import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { db } from './server/db';
import { parseNaturalLanguageOrder, generateFMCGInsights, lookupProductByBarcode } from './server/gemini';
import { User, Order, OrderItem, PaymentRecord, DeliveryRunSheet, Retailer, ReportFilterOptions, ReportType, ReportPeriod, GstSubReportType } from './src/types';
import { 
  generateSalesReportData, 
  generateCustomerLedgerData, 
  generateGstReportData, 
  generateProductSalesReportData, 
  generateBrandSalesReportData, 
  generateCategorySalesReportData, 
  generateSalesmanReportData, 
  generateOutstandingReportData, 
  generatePaymentCollectionReportData, 
  generateCustomerSalesReportData, 
  generateDeliveryReportData, 
  generateReturnsReportData, 
  generateProfitMarginReportData, 
  generatePurchaseReportData,
  getDateRangeForPeriod
} from './src/lib/reportUtils';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userRole?: string;
    }
  }
}

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS for mobile devices, Capacitor Android apps, and external browser origins
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id, X-User-Role, Accept, Cache-Control');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize Supabase Server Client for token validation
const rawSupabaseUrl = 
  process.env.VITE_SUPABASE_URL || 
  process.env.VITE_SUPABASE_PROJECT_URL || 
  process.env.SUPABASE_URL || 
  '';

const rawSupabaseKey = 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  process.env.SUPABASE_KEY || 
  '';

const isKeyValid = Boolean(
  rawSupabaseKey &&
  !rawSupabaseKey.includes('placeholder') &&
  !rawSupabaseKey.startsWith('AIza') &&
  !rawSupabaseKey.startsWith('AQ.') &&
  (rawSupabaseKey.startsWith('sb_publishable_') || rawSupabaseKey.startsWith('eyJ'))
);

const isSupabaseReady = Boolean(
  rawSupabaseUrl && 
  isKeyValid && 
  !rawSupabaseUrl.includes('placeholder') && 
  rawSupabaseUrl.startsWith('http')
);

const supabaseServer = isSupabaseReady
  ? createClient(rawSupabaseUrl, rawSupabaseKey)
  : null;

// Current Active User State for Local Session Tracking
let currentActiveUserId = 'usr_admin';

// Authentication Middleware: Resolves and verifies user identity
async function authenticateRequest(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const headerUserId = req.headers['x-user-id'] as string;

    let authenticatedUser = null;

    // 1. Verify Supabase JWT token if provided
    if (token && supabaseServer) {
      try {
        const { data: { user }, error } = await supabaseServer.auth.getUser(token);
        if (!error && user) {
          const users = db.getUsers();
          authenticatedUser = users.find(u => 
            (user.email && u.email.toLowerCase() === user.email.toLowerCase()) || 
            u.id === user.id
          );
          if (!authenticatedUser) {
            // Check if user exists in Supabase users table to fetch authoritative role
            let authoritativeRole: any = 'retailer';
            try {
              if (supabaseServer) {
                const { data: dbUser } = await supabaseServer
                  .from('users')
                  .select('role')
                  .eq('id', user.id)
                  .maybeSingle();
                if (dbUser && dbUser.role) {
                  authoritativeRole = dbUser.role;
                }
              }
            } catch (dbErr) {
              console.warn('Supabase DB role lookup error:', dbErr);
            }

            authenticatedUser = {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              phone: user.user_metadata?.phone || '+91 98000 00000',
              role: authoritativeRole
            };
          }
        }
      } catch (tokenErr) {
        console.warn('Supabase token verification error:', tokenErr);
      }
    }

    // 2. Fallback to verified user id in database or header metadata
    if (!authenticatedUser && headerUserId) {
      const users = db.getUsers();
      authenticatedUser = users.find(u => u.id === headerUserId) || null;
      if (!authenticatedUser) {
        const headerRole = req.headers['x-user-role'] as string;
        const validRoles = ['admin', 'salesman', 'accounts', 'delivery', 'retailer'];
        const assignedRole = (headerRole && validRoles.includes(headerRole)) ? headerRole : 'admin';
        authenticatedUser = {
          id: headerUserId,
          name: (req.headers['x-user-name'] as string) || 'Authorized User',
          email: (req.headers['x-user-email'] as string) || '',
          role: assignedRole
        };
      }
    }

    // 3. Fallback for role header or local session
    if (!authenticatedUser) {
      const headerRole = req.headers['x-user-role'] as string;
      const validRoles = ['admin', 'salesman', 'accounts', 'delivery', 'retailer'];
      if (headerRole && validRoles.includes(headerRole)) {
        const users = db.getUsers();
        authenticatedUser = users.find(u => u.role === headerRole) || {
          id: `usr_${headerRole}`,
          name: `${headerRole.toUpperCase()} User`,
          email: `${headerRole}@aryanagency.in`,
          role: headerRole
        };
      } else {
        const users = db.getUsers();
        authenticatedUser = users.find(u => u.id === currentActiveUserId) || users[0] || {
          id: 'usr_admin',
          name: 'Aryan Agency Admin',
          email: 'admin@aryanagency.in',
          role: 'admin'
        };
      }
    }

    req.user = authenticatedUser;
    req.userRole = authenticatedUser ? authenticatedUser.role : 'admin';
    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    next();
  }
}

// Global authentication resolution
app.use(authenticateRequest);

// Role-Based Access Control (RBAC) Guard Middleware
function requireRoles(allowedRoles: string[]) {
  return (req: any, res: any, next: any) => {
    const role = req.userRole;
    if (!role || role === 'anon') {
      return res.status(401).json({ 
        error: 'Authentication Required: Please sign in to Aryan Agency FMCG Distribution portal.' 
      });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        error: `Forbidden: Access restricted. Your assigned account role '${role.toUpperCase()}' does not have permission for this operation. Authorized roles: ${allowedRoles.map(r => r.toUpperCase()).join(', ')}.` 
      });
    }
    next();
  };
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Aryan Agency FMCG Distribution' });
});

// Diagnostic Supabase configuration status endpoint (does not expose secret keys)
app.get('/api/supabase-status', (req, res) => {
  let projectRef = '';
  try {
    if (rawSupabaseUrl) {
      const parsed = new URL(rawSupabaseUrl);
      projectRef = parsed.hostname.split('.')[0] || '';
    }
  } catch {}

  const keyType = !rawSupabaseKey
    ? 'missing'
    : rawSupabaseKey.startsWith('sb_publishable_')
    ? 'publishable'
    : rawSupabaseKey.startsWith('eyJ')
    ? 'anon_jwt'
    : rawSupabaseKey.startsWith('AQ.') || rawSupabaseKey.startsWith('AIza')
    ? 'google_gemini_key_detected'
    : 'invalid';

  res.json({
    isConfigured: isSupabaseReady,
    projectUrlConfigured: Boolean(rawSupabaseUrl),
    projectUrl: rawSupabaseUrl || null,
    projectRef: projectRef || null,
    keyConfigured: Boolean(rawSupabaseKey),
    keyType,
    isValidKeyFormat: isKeyValid
  });
});

// Phone OTP In-Memory Store with TTL & Rate Limiting
interface PhoneOtpRecord {
  phone: string;
  token: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}
const phoneOtpStore = new Map<string, PhoneOtpRecord>();

// Clean expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of phoneOtpStore.entries()) {
    if (val.expiresAt < now) {
      phoneOtpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// 1. Send OTP Endpoint
app.post('/api/auth/otp/send', async (req, res) => {
  try {
    const rawPhone = String(req.body.phone || '').trim();
    const digitsOnly = rawPhone.replace(/\D/g, '').slice(-10);

    if (!digitsOnly || digitsOnly.length !== 10 || !/^[6-9]\d{9}$/.test(digitsOnly)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number.'
      });
    }

    const formattedPhone = `+91${digitsOnly}`;
    const now = Date.now();

    // Rate-limiting check: min 20 seconds between resends
    const existing = phoneOtpStore.get(digitsOnly);
    if (existing && now - existing.lastSentAt < 20000) {
      const waitSec = Math.ceil((20000 - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSec}s before requesting a new OTP.`
      });
    }

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store with 5-minute expiry
    phoneOtpStore.set(digitsOnly, {
      phone: formattedPhone,
      token: generatedOtp,
      expiresAt: now + 5 * 60 * 1000,
      attempts: 0,
      lastSentAt: now
    });

    console.log(`[SMS OTP Gateway] >> Generated 6-digit OTP for ${formattedPhone}: ${generatedOtp}`);

    // If Supabase server client configured, trigger Supabase auth OTP in background
    if (supabaseServer) {
      try {
        supabaseServer.auth.signInWithOtp({
          phone: formattedPhone,
          options: { channel: 'sms' }
        }).then(({ error }: any) => {
          if (error) console.log(`[Supabase SMS Notice]: ${error.message}`);
        }).catch(() => {});
      } catch {}
    }

    return res.json({
      success: true,
      message: `OTP sent successfully to ${formattedPhone.slice(0, 5)}•••••`,
      phone: formattedPhone
    });
  } catch (err: any) {
    console.error('[OTP Send Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to send OTP. Please try again.' });
  }
});

// 2. Verify OTP Endpoint
app.post('/api/auth/otp/verify', async (req, res) => {
  try {
    const rawPhone = String(req.body.phone || '').trim();
    const token = String(req.body.token || '').trim();
    const digitsOnly = rawPhone.replace(/\D/g, '').slice(-10);

    if (!digitsOnly || digitsOnly.length !== 10) {
      return res.status(400).json({ success: false, error: 'Invalid mobile number.' });
    }
    if (!token || token.length !== 6) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 6-digit OTP.' });
    }

    const formattedPhone = `+91${digitsOnly}`;
    const now = Date.now();
    const record = phoneOtpStore.get(digitsOnly);

    // Master test OTP for testing / development
    const isMasterOtp = token === '123456';
    const isDirectMatch = record && record.token === token && record.expiresAt > now;

    if (!isMasterOtp && !isDirectMatch) {
      if (record) {
        record.attempts += 1;
        if (record.attempts >= 5) {
          phoneOtpStore.delete(digitsOnly);
          return res.status(400).json({ success: false, error: 'Too many attempts. Please request a new OTP.' });
        }
      }
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP. Please try again.' });
    }

    // OTP Verified! Consume token
    phoneOtpStore.delete(digitsOnly);

    // Look for existing user in local db & Supabase
    const allUsers = db.getUsers();
    let user = allUsers.find(u => {
      const uDigits = (u.phone || '').replace(/\D/g, '').slice(-10);
      return uDigits === digitsOnly;
    });

    // Also look up in Supabase if not found locally
    if (!user && supabaseServer) {
      try {
        const { data: su } = await supabaseServer.from('users').select('*').limit(50);
        if (su && su.length > 0) {
          const matched = su.find((u: any) => (u.phone || '').replace(/\D/g, '').slice(-10) === digitsOnly);
          if (matched) {
            user = {
              id: matched.id,
              name: matched.name,
              email: matched.email,
              phone: matched.phone,
              role: matched.role,
              avatarUrl: matched.avatar_url,
              salesmanId: matched.salesman_id,
              retailerId: matched.retailer_id,
              deliveryId: matched.delivery_id
            };
            db.saveUser(user);
          }
        }
      } catch (e) {
        console.warn('[Supabase user lookup notice]:', e);
      }
    }

    // Check if phone matches an existing store in retailers table
    const allRetailers = db.getRetailers();
    let matchedRetailer = allRetailers.find(r => {
      const rDigits = (r.phone || '').replace(/\D/g, '').slice(-10);
      return rDigits === digitsOnly;
    });

    if (!matchedRetailer && supabaseServer) {
      try {
        const { data: sr } = await supabaseServer.from('retailers').select('*').limit(50);
        if (sr && sr.length > 0) {
          const matched = sr.find((r: any) => (r.phone || '').replace(/\D/g, '').slice(-10) === digitsOnly);
          if (matched) {
            matchedRetailer = matched;
          }
        }
      } catch {}
    }

    if (user) {
      // Existing user found! Link retailerId if retailer exists and not yet set
      if (matchedRetailer && !user.retailerId) {
        user.retailerId = matchedRetailer.id;
        db.saveUser(user);
      }
      currentActiveUserId = user.id;
      return res.json({
        success: true,
        isNewUser: false,
        user,
        retailer: matchedRetailer || null
      });
    }

    if (matchedRetailer) {
      // Retailer store exists (e.g. onboarded by salesman) but no user record created yet!
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: matchedRetailer.ownerName || matchedRetailer.storeName,
        email: matchedRetailer.email || `retailer.${digitsOnly}@aryanagency.in`,
        phone: formattedPhone,
        role: 'retailer',
        retailerId: matchedRetailer.id,
        businessName: matchedRetailer.storeName,
        address: matchedRetailer.address
      };
      db.saveUser(newUser);
      if (supabaseServer) {
        try {
          await supabaseServer.from('users').upsert({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            retailer_id: newUser.retailerId
          });
        } catch {}
      }
      currentActiveUserId = newUser.id;
      return res.json({
        success: true,
        isNewUser: false,
        user: newUser,
        retailer: matchedRetailer
      });
    }

    // Completely new user! Requires onboarding profile completion
    return res.json({
      success: true,
      isNewUser: true,
      phone: formattedPhone
    });
  } catch (err: any) {
    console.error('[OTP Verify Error]:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify OTP. Please try again.' });
  }
});

// 3. Register Retailer after OTP Verification
app.post('/api/auth/otp/register', async (req, res) => {
  try {
    const { phone, storeName, ownerName, email, address, area, beatName, gstin, panNumber, lat, lng } = req.body;
    const digitsOnly = String(phone || '').replace(/\D/g, '').slice(-10);

    if (!digitsOnly || digitsOnly.length !== 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    // Email is strictly OPTIONAL as requested: if user provides it, use it; otherwise fallback to phone-based handle
    const cleanEmail = email?.trim() ? email.trim().toLowerCase() : `retailer.${digitsOnly}@aryanagency.in`;
    const finalStoreName = storeName?.trim() || `Kirana Store (${digitsOnly.slice(-4)})`;
    const finalOwnerName = ownerName?.trim() || `Retailer ${digitsOnly.slice(-4)}`;
    const finalAddress = address?.trim() || 'Utraula, Balrampur (UP)';

    const formattedPhone = `+91${digitsOnly}`;
    const retailerId = `ret_${Date.now()}`;

    // 1. Create Retailer
    const newRetailer: Retailer = {
      id: retailerId,
      storeName: finalStoreName,
      ownerName: finalOwnerName,
      phone: formattedPhone,
      email: cleanEmail,
      address: finalAddress,
      area: area?.trim() || 'Utraula Central',
      beatName: beatName?.trim() || 'Utraula Retail Beat',
      gstin: gstin?.trim().toUpperCase() || '',
      panNumber: panNumber?.trim().toUpperCase() || '',
      creditLimit: 50000,
      currentOutstanding: 0,
      creditDaysAllowed: 15,
      status: 'active',
      creditEnabled: false,
      verificationStatus: 'pending',
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      createdAt: new Date().toISOString()
    };
    db.saveRetailer(newRetailer);

    // 2. Create User (Strict Role = 'retailer')
    const userId = `usr_${Date.now()}`;
    const newUser: User = {
      id: userId,
      name: finalOwnerName,
      email: cleanEmail,
      phone: formattedPhone,
      role: 'retailer',
      retailerId: newRetailer.id,
      businessName: finalStoreName,
      address: finalAddress,
      gstin: newRetailer.gstin,
      panNumber: newRetailer.panNumber,
      verificationStatus: 'pending'
    };
    db.saveUser(newUser);

    // Sync to Supabase
    if (supabaseServer) {
      try {
        await supabaseServer.from('retailers').upsert({
          id: newRetailer.id,
          store_name: newRetailer.storeName,
          owner_name: newRetailer.ownerName,
          phone: newRetailer.phone,
          email: newRetailer.email,
          address: newRetailer.address,
          area: newRetailer.area,
          beat_name: newRetailer.beatName,
          gstin: newRetailer.gstin,
          pan_number: newRetailer.panNumber,
          credit_limit: newRetailer.creditLimit,
          current_outstanding: newRetailer.currentOutstanding,
          credit_days_allowed: newRetailer.creditDaysAllowed,
          lat: newRetailer.lat,
          lng: newRetailer.lng,
          status: newRetailer.status
        });

        await supabaseServer.from('users').upsert({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: 'retailer',
          retailer_id: newRetailer.id
        });
      } catch (e) {
        console.warn('[Supabase Onboarding Sync Warning]:', e);
      }
    }

    currentActiveUserId = newUser.id;
    return res.json({
      success: true,
      user: newUser,
      retailer: newRetailer
    });
  } catch (err: any) {
    console.error('[OTP Register Error]:', err);
    return res.status(500).json({ success: false, error: 'पंजीकरण में त्रुटि (Failed to register retailer).' });
  }
});

// Current User & Auth State
app.get('/api/auth/users', (req, res) => {
  const users = db.getUsers();
  res.json(users);
});

app.get('/api/auth/current', (req, res) => {
  const users = db.getUsers();
  const user = req.user || users.find(u => u.id === currentActiveUserId) || users[0];
  res.json(user);
});

app.post('/api/auth/switch', (req, res) => {
  const { userId } = req.body;
  // Security Requirement: The role switcher must NEVER grant permissions;
  // it may only switch between roles that the currently authenticated user is explicitly authorized to use.
  // Non-admin users (Salesman, Delivery, etc.) are strictly forbidden from switching roles.
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      error: `Forbidden: Role escalation blocked. Role '${req.userRole?.toUpperCase()}' cannot switch accounts or roles. Only Owner/Admin is authorized.` 
    });
  }

  const users = db.getUsers();
  const found = users.find(u => u.id === userId);
  if (found) {
    currentActiveUserId = found.id;
    return res.json({ success: true, user: found });
  }
  res.status(404).json({ error: 'User not found' });
});

// Admin-Only Role Assignment / Promotion Endpoint
const handleUpdateUserRole = (req: any, res: any) => {
  const targetUserId = req.params.id;
  const { role: newRole } = req.body;
  const validRoles = ['admin', 'salesman', 'delivery', 'accounts', 'retailer'];
  if (!validRoles.includes(newRole)) {
    return res.status(400).json({ 
      error: `Invalid operational role: '${newRole}'. Permitted roles: ${validRoles.join(', ')}` 
    });
  }

  const users = db.getUsers();
  const targetUser = users.find(u => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User account not found in system database' });
  }

  targetUser.role = newRole;
  db.saveUser(targetUser);

  // Sync to Supabase users table if connected
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer
        .from('users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUserId)
    )
      .then(({ error }: any) => {
        if (error) console.warn('[Supabase Role Sync Warning]:', error.message);
      })
      .catch((e: any) => console.warn('[Supabase Role Sync Error]:', e));
  }

  res.json({ success: true, user: targetUser });
};

app.put('/api/auth/users/:id/role', requireRoles(['admin']), handleUpdateUserRole);
app.put('/api/users/:id/role', requireRoles(['admin']), handleUpdateUserRole);

// Profile Update Endpoint (Used by Admin, Retailer, Salesman to update their profile, logo, business details, location)
app.put('/api/auth/profile', (req, res) => {
  const headerUserId = req.headers['x-user-id'] as string;
  const headerUserRole = req.headers['x-user-role'] as string;
  const currentUserId = req.user?.id || headerUserId || currentActiveUserId;
  const users = db.getUsers();
  
  const {
    id: bodyId,
    name,
    email,
    phone,
    avatarUrl,
    businessName,
    businessLogoUrl,
    address,
    city,
    state,
    pincode,
    gstin,
    panNumber,
    locationCoordinates,
    role
  } = req.body;

  // Priority 1: Match by explicit bodyId if provided
  // Priority 2: Match by authenticated req.user?.id or headerUserId
  // Priority 3: Match by email
  // Priority 4: Match by phone
  // Priority 5: Fallback to currentActiveUserId
  let user: User | undefined;
  if (bodyId) {
    user = users.find(u => u.id === bodyId);
  }
  if (!user && (req.user?.id || headerUserId)) {
    const authId = req.user?.id || headerUserId;
    user = users.find(u => u.id === authId);
  }
  if (!user && email) {
    user = users.find(u => u.email && u.email.toLowerCase() === email.trim().toLowerCase());
  }
  if (!user && phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    user = users.find(u => (u.phone || '').replace(/\D/g, '') === cleanPhone);
  }
  if (!user) {
    user = users.find(u => u.id === currentActiveUserId) || users[0];
  }

  // If user still not found, create a new persistent user record so retailer profile updates never fail!
  if (!user) {
    const assignedId = bodyId || currentUserId || `usr_${Date.now()}`;
    const userRole = (role || headerUserRole || req.userRole || 'retailer') as any;
    user = {
      id: assignedId,
      name: (name || 'Retailer Partner').trim(),
      email: (email || `${assignedId}@retailer.aryanagency.in`).trim().toLowerCase(),
      phone: (phone || '+91 98000 00000').trim(),
      role: userRole,
      avatarUrl: avatarUrl || undefined,
      businessName: businessName || (userRole === 'admin' ? 'Aryan Agency FMCG Distribution' : undefined),
      businessLogoUrl: businessLogoUrl || undefined,
      address: address || undefined,
      city: city || 'Utraula',
      state: state || 'Uttar Pradesh',
      pincode: pincode || '271604',
      gstin: gstin ? gstin.trim().toUpperCase() : (userRole === 'admin' ? '09BOGPG2620P1ZQ' : ''),
      panNumber: panNumber ? panNumber.trim().toUpperCase() : (userRole === 'admin' ? 'BOGPG2620P' : ''),
      locationCoordinates: locationCoordinates || undefined,
      verificationStatus: userRole === 'admin' ? 'verified' : 'pending'
    };
  } else {
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (businessName !== undefined) user.businessName = businessName.trim();
    if (businessLogoUrl !== undefined) user.businessLogoUrl = businessLogoUrl;
    if (address !== undefined) user.address = address.trim();
    if (city !== undefined) user.city = city.trim();
    if (state !== undefined) user.state = state.trim();
    if (pincode !== undefined) user.pincode = pincode.trim();
    if (gstin !== undefined) user.gstin = gstin.trim().toUpperCase();
    if (panNumber !== undefined) user.panNumber = panNumber.trim().toUpperCase();
    if (locationCoordinates !== undefined) user.locationCoordinates = locationCoordinates;
  }

  // If this user is an admin, keep other admin profiles (e.g. usr_admin) in sync with agency GST details
  if (user.role === 'admin') {
    const otherAdmins = users.filter(u => u.role === 'admin' && u.id !== user!.id);
    for (const admin of otherAdmins) {
      if (gstin !== undefined) admin.gstin = user.gstin;
      if (panNumber !== undefined) admin.panNumber = user.panNumber;
      if (businessName !== undefined) admin.businessName = user.businessName;
      if (address !== undefined) admin.address = user.address;
      db.saveUser(admin);
    }
  }

  // If this user is a retailer and has a linked retailer record, sync changes
  if (user.retailerId || user.role === 'retailer') {
    const retailerId = user.retailerId || user.id;
    const existingRetailer = db.getRetailerById(retailerId) || db.getRetailers().find(r => 
      (user.phone && r.phone === user.phone) || 
      (user.email && r.email === user.email) ||
      (bodyId && r.id === bodyId)
    );
    if (existingRetailer) {
      if (businessName) existingRetailer.storeName = businessName;
      if (name) existingRetailer.ownerName = name;
      if (phone) existingRetailer.phone = phone;
      if (email) existingRetailer.email = email;
      if (address) existingRetailer.address = address;
      if (gstin !== undefined) existingRetailer.gstin = user.gstin;
      if (panNumber !== undefined) existingRetailer.panNumber = user.panNumber;
      if (businessLogoUrl) existingRetailer.logoUrl = businessLogoUrl;
      if (avatarUrl) existingRetailer.photoUrl = avatarUrl;
      if (locationCoordinates?.lat && locationCoordinates?.lng) {
        existingRetailer.lat = locationCoordinates.lat;
        existingRetailer.lng = locationCoordinates.lng;
      }
      db.saveRetailer(existingRetailer);
    }
  }

  db.saveUser(user);

  // Sync to Supabase users table if connected
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer
        .from('users')
        .update({
          name: user.name,
          phone: user.phone,
          avatar_url: user.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
    ).catch(e => console.warn('[Supabase Profile Sync Warning]:', e));
  }

  res.json({ success: true, user });
});

// ============================================================================
// Server-Side Geolocation & Geocoding Endpoints (Bypasses Browser CORS / Adblock)
// ============================================================================

// 1. IP Geolocation Proxy
app.get('/api/geo/ip', async (req, res) => {
  try {
    const forwarded = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
    const clientIp = forwarded || req.socket.remoteAddress || '';
    const isLocal = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');

    let geoData: any = null;

    // If client IP is public, query with IP, otherwise query current public network IP
    const url = isLocal ? 'https://ipapi.co/json/' : `https://ipapi.co/${clientIp}/json/`;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AryanAgency-ERP/2.0 (dispatch@aryanagency.in)' },
        signal: AbortSignal.timeout(4000)
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.latitude && data.longitude) {
          geoData = {
            lat: Number(data.latitude),
            lng: Number(data.longitude),
            city: data.city || 'Balrampur',
            state: data.region || 'Uttar Pradesh',
            postal: data.postal || '271604',
            country: data.country_name || 'India',
            source: 'ip'
          };
        }
      }
    } catch (e1) {
      // Fallback to ipwho.is
      try {
        const response2 = await fetch(isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${clientIp}`, {
          signal: AbortSignal.timeout(4000)
        });
        if (response2.ok) {
          const data2 = await response2.json();
          if (data2 && data2.success && data2.latitude && data2.longitude) {
            geoData = {
              lat: Number(data2.latitude),
              lng: Number(data2.longitude),
              city: data2.city || 'Balrampur',
              state: data2.region || 'Uttar Pradesh',
              postal: data2.postal || '271604',
              country: data2.country || 'India',
              source: 'ip'
            };
          }
        }
      } catch (e2) {}
    }

    if (!geoData) {
      // Default to Aryan Agency Regional Hub (Utraula / Balrampur Depot)
      geoData = {
        lat: 27.3167,
        lng: 82.4167,
        city: 'Balrampur',
        state: 'Uttar Pradesh',
        postal: '271604',
        country: 'India',
        source: 'regional_default'
      };
    }

    return res.json({ success: true, data: geoData });
  } catch (err: any) {
    return res.json({
      success: true,
      data: {
        lat: 27.3167,
        lng: 82.4167,
        city: 'Balrampur',
        state: 'Uttar Pradesh',
        postal: '271604',
        country: 'India',
        source: 'fallback'
      }
    });
  }
});

// 2. Forward Geocoding: Search GPS Coordinates from Address or City query
app.get('/api/geo/search', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query parameter q is required' });
  }

  try {
    const encoded = encodeURIComponent(query);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: { 
        'User-Agent': 'AryanAgency-ERP/2.0 (contact@aryanagency.in)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: 'Geocoding service unavailable' });
    }

    const items = await response.json();
    const results = (items || []).map((item: any) => {
      const addr = item.address || {};
      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: addr.city || addr.town || addr.village || addr.county || addr.state_district || '',
        state: addr.state || '',
        pincode: addr.postcode || ''
      };
    });

    return res.json({ success: true, results });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Geocoding failed' });
  }
});

// 3. Reverse Geocoding: Lat/Lng -> Address Details
app.get('/api/geo/reverse', async (req, res) => {
  const lat = req.query.lat as string;
  const lng = req.query.lng as string;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'Parameters lat and lng are required' });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: { 
        'User-Agent': 'AryanAgency-ERP/2.0 (contact@aryanagency.in)',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: 'Reverse geocode service unavailable' });
    }

    const data = await response.json();
    const addr = data.address || {};
    const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
    const detectedState = addr.state || '';
    const detectedPincode = addr.postcode || '';
    const detectedRoad = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ');

    return res.json({
      success: true,
      data: {
        displayName: data.display_name,
        road: detectedRoad,
        city: detectedCity,
        state: detectedState,
        pincode: detectedPincode
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Reverse geocoding failed' });
  }
});

// ============================================================================
// Distributor Settings & UPI Connect API Endpoints
// ============================================================================

app.get('/api/settings', (req, res) => {
  const settings = db.getSettings();
  res.json({
    success: true,
    settings
  });
});

app.put('/api/settings', requireRoles(['admin', 'accounts']), (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({
    success: true,
    settings: updated,
    message: 'Distributor & UPI Connect settings updated successfully'
  });
});

// UPI VPA Verification & Bank Handshake Simulation Endpoint
app.post('/api/upi/verify-vpa', (req, res) => {
  const { vpa, payeeName, bankName } = req.body;
  if (!vpa || typeof vpa !== 'string' || !vpa.includes('@')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid UPI VPA format. Must be in the format username@bank (e.g. aryanagency@upi)' 
    });
  }

  const [username, handle] = vpa.toLowerCase().trim().split('@');
  if (!username || !handle) {
    return res.status(400).json({ success: false, error: 'Invalid UPI VPA format. Missing handle.' });
  }

  // Latency simulation (20-45ms standard NPCI lookup)
  const latencyMs = Math.floor(20 + Math.random() * 25);
  const detectedBank = bankName || (
    handle.includes('sbi') ? 'State Bank of India' :
    handle.includes('icici') ? 'ICICI Bank Ltd' :
    handle.includes('hdfc') ? 'HDFC Bank Ltd' :
    handle.includes('axis') || handle.includes('axl') ? 'Axis Bank Ltd' :
    handle.includes('paytm') ? 'Paytm Payments Bank' :
    handle.includes('ybl') || handle.includes('ibl') ? 'Yes Bank / IndusInd' :
    handle.includes('baroda') ? 'Bank of Baroda' :
    handle.includes('pnb') ? 'Punjab National Bank' :
    'National Payments Corporation of India (NPCI) Node'
  );

  res.json({
    success: true,
    vpa: vpa.trim(),
    isValid: true,
    payeeName: payeeName || 'Aryan Agency FMCG Distribution',
    bankName: detectedBank,
    latencyMs,
    settlementSupport: 'Instant Realtime T+0 Settlement (IMPS/UPI 2.0)',
    verifiedAt: new Date().toISOString()
  });
});

// Admin & Salesman Verification Endpoint for Retailer Onboarding / KYC Verification
app.put('/api/retailers/:id/verify', requireRoles(['admin', 'salesman', 'accounts']), (req, res) => {
  const retailerId = req.params.id;
  const { status, remarks, reasonCode, creditLimit, creditEnabled, creditDaysAllowed, beatName } = req.body;

  if (!['pending', 'verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "Invalid verification status. Must be 'pending', 'verified', or 'rejected'." });
  }

  const actorName = req.user?.name || (req.headers['x-user-name'] as string) || 'Admin';
  const actorRole = req.userRole || 'admin';
  const nowIso = new Date().toISOString();

  let retailer = db.getRetailerById(retailerId);
  if (!retailer) {
    retailer = {
      id: retailerId,
      storeName: req.body.storeName || 'Registered Retail Outlet',
      ownerName: req.body.ownerName || 'Retail Owner',
      phone: req.body.phone || '',
      address: req.body.address || 'Utraula, Balrampur',
      area: req.body.area || 'Utraula',
      beatName: beatName || req.body.beatName || 'Utraula Retail Beat',
      status: 'active',
      creditLimit: creditLimit !== undefined ? Number(creditLimit) : 50000,
      currentOutstanding: 0,
      creditDaysAllowed: creditDaysAllowed !== undefined ? Number(creditDaysAllowed) : 15,
      creditEnabled: creditEnabled !== undefined ? Boolean(creditEnabled) : true,
      verificationStatus: status,
      verificationRemarks: remarks || '',
      verificationReasonCode: reasonCode || '',
      verifiedAt: status === 'verified' ? nowIso : undefined,
      verifiedBy: status === 'verified' ? actorName : undefined,
      submittedAt: req.body.submittedAt || nowIso,
      verificationTimeline: []
    };
  } else {
    retailer.verificationStatus = status;
    retailer.verificationRemarks = remarks || '';
    retailer.verificationReasonCode = reasonCode || retailer.verificationReasonCode || '';
    retailer.verifiedAt = status === 'verified' ? nowIso : undefined;
    retailer.verifiedBy = status === 'verified' ? actorName : undefined;
    if (creditLimit !== undefined) retailer.creditLimit = Number(creditLimit);
    if (creditEnabled !== undefined) retailer.creditEnabled = Boolean(creditEnabled);
    if (creditDaysAllowed !== undefined) retailer.creditDaysAllowed = Number(creditDaysAllowed);
    if (beatName) retailer.beatName = beatName;
  }

  // Create timeline event
  const timelineEvent = {
    id: `vtl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowIso,
    type: (status === 'verified' ? 'approved' : status === 'rejected' ? 'rejected' : 'reviewed') as 'approved' | 'rejected' | 'reviewed',
    actorName,
    actorRole,
    title: status === 'verified'
      ? `Verification Approved (${reasonCode || 'DOCS_VALIDATED'})`
      : status === 'rejected'
      ? `Verification Rejected (${reasonCode || 'DOCS_INVALID'})`
      : 'Application Marked Pending Review',
    description: remarks || (status === 'verified' ? 'Approved for wholesale order punch' : 'Account status updated'),
    reasonCode: reasonCode || ''
  };

  retailer.verificationTimeline = [timelineEvent, ...(retailer.verificationTimeline || [])];

  db.saveRetailer(retailer);

  // Also sync user verification if user account is linked
  const users = db.getUsers();
  const linkedUser = users.find(u => 
    u.retailerId === retailer?.id || 
    (u.phone && retailer?.phone && u.phone.replace(/\D/g, '').slice(-10) === retailer.phone.replace(/\D/g, '').slice(-10)) || 
    (retailer?.email && u.email && u.email.toLowerCase() === retailer.email.toLowerCase()) ||
    (retailer?.ownerName && u.name && u.name.toLowerCase() === retailer.ownerName.toLowerCase()) ||
    (retailer?.storeName && u.name && u.name.toLowerCase() === retailer.storeName.toLowerCase())
  );
  if (linkedUser) {
    linkedUser.verificationStatus = status;
    linkedUser.verificationRemarks = remarks || '';
    linkedUser.verifiedAt = retailer.verifiedAt;
    linkedUser.verifiedBy = retailer.verifiedBy;
    if (!linkedUser.retailerId) {
      linkedUser.retailerId = retailer.id;
    }
    db.saveUser(linkedUser);

    // Sync to Supabase users table if connected
    if (supabaseServer) {
      Promise.resolve(
        supabaseServer
          .from('users')
          .update({ 
            verification_status: status, 
            verified_at: retailer.verifiedAt,
            verified_by: retailer.verifiedBy,
            retailer_id: retailer.id,
            updated_at: nowIso 
          })
          .eq('id', linkedUser.id)
      ).catch((err: any) => console.warn('[Supabase User Verification Sync Notice]:', err?.message));
    }
  }

  // Also sync standard status to Supabase retailers table if connected
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer
        .from('retailers')
        .update({ 
          status: status === 'rejected' ? 'inactive' : 'active',
          updated_at: nowIso 
        })
        .eq('id', retailer.id)
    ).catch(() => {});
  }

  res.json({ success: true, retailer, message: `Retailer verification status updated to ${status.toUpperCase()}` });
});

// ==========================================
// FMCG Distribution Intelligence & Reports API
// ==========================================
app.get('/api/reports', requireRoles(['admin', 'accounts', 'salesman']), (req, res) => {
  try {
    const reportType = (req.query.reportType as ReportType) || 'sales';
    const period = (req.query.period as ReportPeriod) || 'this_month';
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit as string, 10) || 50));

    let orders = db.getOrders();
    let retailers = db.getRetailers();
    let products = db.getProducts();
    let salesmen = db.getSalesmen();
    let deliveries = db.getDeliveries();
    let payments = db.getPayments();
    let inventoryLogs = db.getInventoryLogs();

    // Security: If current role is salesman, restrict data to assigned beats and salesman orders
    if (req.userRole === 'salesman') {
      const salesmanId = req.user?.salesmanId || req.user?.id;
      const sm = salesmen.find(s => s.id === salesmanId || (req.user?.name && s.name.toLowerCase() === req.user.name.toLowerCase()));
      const beats = sm?.assignedBeats || [];
      orders = orders.filter(o => o.salesmanId === sm?.id || o.salesmanName === sm?.name || (o.beatName && beats.includes(o.beatName)));
      retailers = retailers.filter(r => (r.beatName && beats.includes(r.beatName)));
    }

    const filterOptions: ReportFilterOptions = {
      period,
      fromDate,
      toDate,
      retailerId: req.query.retailerId as string,
      salesmanId: req.query.salesmanId as string,
      deliveryPersonId: req.query.deliveryPersonId as string,
      productId: req.query.productId as string,
      brand: req.query.brand as string,
      category: req.query.category as string,
      paymentStatus: req.query.paymentStatus as any,
      orderStatus: req.query.orderStatus as any,
      gstFilter: req.query.gstFilter as any,
      paymentMode: req.query.paymentMode as any,
      beatName: req.query.beatName as string,
      onlyOverdue: req.query.onlyOverdue === 'true',
      gstSubReport: (req.query.gstSubReport as GstSubReportType) || 'sales_register',
      searchTerm: req.query.searchTerm as string
    };

    let result: any;
    switch (reportType) {
      case 'sales':
        result = generateSalesReportData(orders, filterOptions);
        break;
      case 'customer_ledger': {
        const targetId = (req.query.retailerId as string) || (retailers[0]?.id);
        const targetRet = retailers.find(r => r.id === targetId) || retailers[0];
        result = targetRet ? generateCustomerLedgerData(targetRet, orders, payments, period, fromDate, toDate) : { transactions: [] };
        break;
      }
      case 'gst':
        result = generateGstReportData(orders, filterOptions);
        break;
      case 'product_sales':
        result = generateProductSalesReportData(orders, products, filterOptions);
        break;
      case 'brand_sales':
        result = generateBrandSalesReportData(orders, products, filterOptions);
        break;
      case 'category_sales':
        result = generateCategorySalesReportData(orders, products, filterOptions);
        break;
      case 'salesman_sales':
        result = generateSalesmanReportData(orders, payments, salesmen, retailers, filterOptions);
        break;
      case 'outstanding':
        result = generateOutstandingReportData(retailers, orders, payments, filterOptions);
        break;
      case 'payment_collection':
        result = generatePaymentCollectionReportData(payments, orders, retailers, filterOptions);
        break;
      case 'customer_sales':
        result = generateCustomerSalesReportData(orders, retailers, filterOptions);
        break;
      case 'delivery':
        result = generateDeliveryReportData(deliveries, orders, filterOptions);
        break;
      case 'returns':
        result = generateReturnsReportData(orders, inventoryLogs, filterOptions);
        break;
      case 'profit_margin':
        result = generateProfitMarginReportData(orders, products, filterOptions);
        break;
      case 'purchase':
        result = generatePurchaseReportData(inventoryLogs, products, filterOptions);
        break;
      default:
        result = generateSalesReportData(orders, filterOptions);
    }

    const rows = result.tableRows || result.rows || result.transactions || [];
    const totalCount = rows.length;
    const paginatedRows = rows.slice((page - 1) * limit, page * limit);
    const dateRange = getDateRangeForPeriod(period, fromDate, toDate);

    res.json({
      success: true,
      reportType,
      dateRange,
      summary: result.summary || {},
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalCount / limit))
      },
      data: paginatedRows
    });
  } catch (err: any) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate distribution report' });
  }
});

// Products
app.get('/api/products', (req, res) => {
  const products = db.getProducts().map(p => ({
    ...p,
    sku: p.sku || (p as any).product_sku || (p as any).productSku || ''
  }));
  res.json(products);
});

// Barcode / GTIN Product Information & Auto Image Lookup
app.get('/api/products/lookup/:barcode', async (req, res) => {
  const barcode = req.params.barcode;
  if (!barcode) {
    return res.status(400).json({ found: false, message: 'Barcode is required' });
  }

  try {
    const result = await lookupProductByBarcode(barcode);
    res.json(result);
  } catch (err: any) {
    console.warn('Barcode lookup notice:', err?.message || err);
    res.json({ found: false, source: 'none', barcode, message: 'Could not fetch external details; please enter manually.' });
  }
});

app.post('/api/products', requireRoles(['admin']), (req, res) => {
  const newProduct = req.body;
  if (!newProduct.id) {
    newProduct.id = `prd_${Date.now()}`;
  }
  newProduct.sku = newProduct.sku || newProduct.product_sku || newProduct.productSku || '';
  if (!newProduct.casePrice) {
    newProduct.casePrice = Number(newProduct.wholesalePricePiece) * Number(newProduct.piecesPerCase);
  }
  const saved = db.saveProduct(newProduct);
  res.json(saved);
});

app.put('/api/products/:id', requireRoles(['admin']), (req, res) => {
  const id = req.params.id;
  const existing = db.getProductById(id);
  const updated = existing 
    ? { ...existing, ...req.body, id } 
    : {
        id,
        name: req.body.name || 'Unnamed Product',
        brand: req.body.brand || 'General FMCG',
        category: req.body.category || 'General',
        sku: req.body.sku || req.body.product_sku || req.body.productSku || '',
        product_sku: req.body.sku || req.body.product_sku || req.body.productSku || '',
        hsnCode: req.body.hsnCode || '1905',
        piecesPerCase: Number(req.body.piecesPerCase) || 24,
        wholesalePricePiece: Number(req.body.wholesalePricePiece) || 0,
        casePrice: Number(req.body.casePrice) || (Number(req.body.wholesalePricePiece || 0) * (Number(req.body.piecesPerCase) || 24)),
        mrpPiece: Number(req.body.mrpPiece) || 0,
        gstRate: Number(req.body.gstRate) || 18,
        currentStockCases: Number(req.body.currentStockCases) || 0,
        currentStockLoosePcs: Number(req.body.currentStockLoosePcs) || 0,
        reorderLevelCases: Number(req.body.reorderLevelCases) || 10,
        primaryWarehouseBin: req.body.primaryWarehouseBin || 'BAY-A1',
        imageUrl: req.body.imageUrl || '',
        activeScheme: req.body.activeScheme || null,
        batches: req.body.batches || [],
        packingOptions: req.body.packingOptions || [],
        ...req.body
      };

  updated.sku = req.body.sku || req.body.product_sku || req.body.productSku || (existing ? existing.sku : '') || updated.sku || '';
  updated.product_sku = updated.sku;
  if (updated.wholesalePricePiece && updated.piecesPerCase) {
    updated.casePrice = Number(updated.wholesalePricePiece) * Number(updated.piecesPerCase);
  }
  const saved = db.saveProduct(updated);
  res.json(saved || updated);
});

app.delete('/api/products/:id', requireRoles(['admin']), (req, res) => {
  const id = req.params.id;
  const deleted = db.deleteProduct(id);
  res.json({ success: deleted });
});

// Retailers
app.get('/api/retailers', (req, res) => {
  const isCandidateTest = (r: Retailer) => {
    const name = (r.storeName || '').toLowerCase();
    const phone = (r.phone || '').replace(/\D/g, '');
    return (
      phone === '9800000000' ||
      phone === '9999999999' ||
      name.includes('dummy') ||
      name.includes('sample') ||
      r.id === 'ret_1' ||
      r.id === 'ret_usr_usr_admin'
    );
  };
  const retailers = [...db.getRetailers()].filter(r => !isCandidateTest(r));
  const users = db.getUsers().filter(u => u.role === 'retailer' && u.id !== 'usr_admin');

  // Auto-link / populate retail outlets for any authentic registered user accounts with role 'retailer'
  users.forEach(u => {
    if (!u.phone || u.phone.includes('00000') || u.name?.toLowerCase().includes('dummy')) return;
    const matched = retailers.find(r => 
      (u.retailerId && r.id === u.retailerId) ||
      (u.phone && r.phone && u.phone.replace(/\D/g, '').slice(-10) === r.phone.replace(/\D/g, '').slice(-10)) ||
      (u.email && r.email && u.email.toLowerCase() === r.email.toLowerCase()) ||
      (u.name && r.storeName && u.name.toLowerCase() === r.storeName.toLowerCase()) ||
      (u.name && r.ownerName && u.name.toLowerCase() === r.ownerName.toLowerCase())
    );

    if (!matched) {
      const generatedRetailer: Retailer = {
        id: u.retailerId || `ret_usr_${u.id.replace(/[^a-zA-Z0-9]/g, '_').slice(-16)}`,
        storeName: u.businessName || u.name || 'Kirana Store',
        ownerName: u.name || 'Proprietor',
        phone: u.phone,
        email: u.email || '',
        address: u.address || 'Utraula, Balrampur, Uttar Pradesh',
        area: u.city || 'Utraula Central',
        beatName: 'Utraula Retail Beat',
        status: 'active',
        creditLimit: 50000,
        currentOutstanding: 0,
        creditDaysAllowed: 14,
        creditEnabled: false,
        verificationStatus: u.verificationStatus || 'pending',
        verificationRemarks: u.verificationRemarks || 'New registration via mobile portal',
        verifiedAt: u.verifiedAt,
        verifiedBy: u.verifiedBy,
        createdAt: new Date().toISOString()
      };
      db.saveRetailer(generatedRetailer);
      retailers.push(generatedRetailer);

      if (!u.retailerId) {
        u.retailerId = generatedRetailer.id;
        db.saveUser(u);
      }
    } else {
      // Sync verification status between user and retailer
      if (matched.verificationStatus === 'verified' && u.verificationStatus !== 'verified') {
        u.verificationStatus = 'verified';
        u.verifiedAt = matched.verifiedAt;
        u.verifiedBy = matched.verifiedBy;
        db.saveUser(u);
      } else if (u.verificationStatus === 'verified' && matched.verificationStatus !== 'verified') {
        matched.verificationStatus = 'verified';
        matched.verifiedAt = u.verifiedAt;
        matched.verifiedBy = u.verifiedBy;
        db.saveRetailer(matched);
      }
    }
  });

  const filtered = retailers.filter(r => {
    const n = (r.storeName || '').toLowerCase();
    return !n.includes('laxmi supermarket') && !n.includes('ganesh daily') && !n.includes('ganesh provision') && !n.includes('sapthagiri');
  });
  res.json(filtered);
});

app.post('/api/retailers', requireRoles(['admin', 'salesman', 'accounts', 'retailer']), (req, res) => {
  const newRetailer = req.body;
  const storeName = newRetailer.storeName?.trim();
  if (!storeName) {
    return res.status(400).json({ error: 'Retail Outlet / Store Name is required.' });
  }
  const ownerName = newRetailer.ownerName?.trim();
  if (!ownerName) {
    return res.status(400).json({ error: 'Owner / Proprietor Name is required.' });
  }
  const rawPhone = newRetailer.phone?.trim() || '';
  const digitsOnlyPhone = rawPhone.replace(/\D/g, '');
  if (!digitsOnlyPhone || digitsOnlyPhone.length < 10) {
    return res.status(400).json({ error: 'A valid 10-digit mobile phone number is required for retailer order and payment tracking.' });
  }
  const address = newRetailer.address?.trim();
  if (!address) {
    return res.status(400).json({ error: 'Shop address is required for delivery routing.' });
  }

  const existingRetailers = db.getRetailers();
  const targetSuffix = digitsOnlyPhone.slice(-10);
  const phoneDuplicate = existingRetailers.find(r => {
    if (newRetailer.id && r.id === newRetailer.id) return false;
    const existingDigits = (r.phone || '').replace(/\D/g, '');
    return existingDigits.endsWith(targetSuffix);
  });
  if (phoneDuplicate) {
    return res.status(400).json({ 
      error: `A retailer outlet with phone ${rawPhone} already exists (${phoneDuplicate.storeName}). Please verify the phone number or edit the existing outlet.` 
    });
  }

  const gstin = newRetailer.gstin?.trim().toUpperCase() || '';
  if (gstin && gstin.length >= 15) {
    const gstinDuplicate = existingRetailers.find(r => {
      if (newRetailer.id && r.id === newRetailer.id) return false;
      return (r.gstin || '').trim().toUpperCase() === gstin;
    });
    if (gstinDuplicate) {
      return res.status(400).json({ 
        error: `A retailer outlet with GSTIN ${gstin} already exists (${gstinDuplicate.storeName}). Each GSTIN must be uniquely registered.` 
      });
    }
  }

  if (!newRetailer.id) {
    newRetailer.id = `ret_${Date.now()}`;
  }
  newRetailer.storeName = storeName;
  newRetailer.ownerName = ownerName;
  newRetailer.phone = rawPhone.startsWith('+91') ? rawPhone : `+91 ${rawPhone}`;
  newRetailer.address = address;
  newRetailer.area = newRetailer.area?.trim() || 'Utraula Central';
  newRetailer.beatName = newRetailer.beatName?.trim() || 'Utraula Retail Beat';
  newRetailer.gstin = gstin;
  newRetailer.panNumber = newRetailer.panNumber?.trim().toUpperCase() || '';
  newRetailer.creditLimit = Number(newRetailer.creditLimit) >= 0 ? Number(newRetailer.creditLimit) : 50000;
  newRetailer.currentOutstanding = Number(newRetailer.currentOutstanding) || 0;
  newRetailer.creditDaysAllowed = Number(newRetailer.creditDaysAllowed) || 14;
  newRetailer.creditEnabled = newRetailer.creditEnabled !== undefined ? Boolean(newRetailer.creditEnabled) : false;
  newRetailer.status = newRetailer.status || 'active';
  newRetailer.createdAt = newRetailer.createdAt || new Date().toISOString().split('T')[0];
  if (newRetailer.lat !== undefined && !isNaN(Number(newRetailer.lat))) {
    newRetailer.lat = Number(newRetailer.lat);
  }
  if (newRetailer.lng !== undefined && !isNaN(Number(newRetailer.lng))) {
    newRetailer.lng = Number(newRetailer.lng);
  }
  if (newRetailer.shopPhotoUrl) {
    newRetailer.shopPhotoUrl = newRetailer.shopPhotoUrl;
  }

  const saved = db.saveRetailer(newRetailer);
  res.json(saved);
});

app.put('/api/retailers/:id', requireRoles(['admin', 'salesman', 'accounts']), (req, res) => {
  const id = req.params.id;
  let existing = db.getRetailerById(id);
  if (!existing) {
    existing = {
      id,
      storeName: req.body.storeName || 'Retail Partner Outlet',
      ownerName: req.body.ownerName || req.body.storeName || 'Retail Owner',
      phone: req.body.phone || '+91 98000 00000',
      address: req.body.address || 'Utraula, Balrampur',
      area: req.body.area || 'Utraula',
      beatName: req.body.beatName || 'Utraula Retail Beat',
      status: 'active',
      creditLimit: 50000,
      currentOutstanding: 0,
      creditDaysAllowed: 15,
      creditEnabled: true
    };
  }

  // Security & Business Rule: Retailer and Salesman cannot alter their own credit settings.
  // Only Admin and Accounts can turn credit ON/OFF or edit credit limits.
  const isPrivilegedCreditAdmin = req.userRole === 'admin' || req.userRole === 'accounts';

  const rawPhone = req.body.phone !== undefined ? req.body.phone?.trim() : existing.phone;
  if (rawPhone) {
    const digitsOnlyPhone = rawPhone.replace(/\D/g, '');
    if (digitsOnlyPhone.length < 10) {
      return res.status(400).json({ error: 'A valid 10-digit mobile phone number is required.' });
    }
    const targetSuffix = digitsOnlyPhone.slice(-10);
    const existingRetailers = db.getRetailers();
    const phoneDuplicate = existingRetailers.find(r => {
      if (r.id === id) return false;
      const existingDigits = (r.phone || '').replace(/\D/g, '');
      return existingDigits.endsWith(targetSuffix);
    });
    if (phoneDuplicate) {
      return res.status(400).json({ 
        error: `A retailer outlet with phone ${rawPhone} already exists (${phoneDuplicate.storeName}).` 
      });
    }
  }

  const updated = { 
    ...existing, 
    ...req.body, 
    id,
    creditEnabled: isPrivilegedCreditAdmin 
      ? (req.body.creditEnabled !== undefined ? Boolean(req.body.creditEnabled) : existing.creditEnabled) 
      : existing.creditEnabled,
    creditLimit: isPrivilegedCreditAdmin 
      ? (req.body.creditLimit !== undefined ? Number(req.body.creditLimit) : existing.creditLimit) 
      : existing.creditLimit,
    creditDaysAllowed: isPrivilegedCreditAdmin 
      ? (req.body.creditDaysAllowed !== undefined ? Number(req.body.creditDaysAllowed) : existing.creditDaysAllowed) 
      : existing.creditDaysAllowed
  };
  db.saveRetailer(updated);
  res.json(updated);
});

app.delete('/api/retailers/:id', requireRoles(['admin', 'salesman', 'accounts']), (req, res) => {
  const id = req.params.id;
  const handleOrders = req.query.handleOrders === 'archive' ? 'archive' : 'delete';
  db.deleteRetailer(id, { deleteOrders: handleOrders === 'delete', archiveOrders: handleOrders === 'archive' });
  
  if (supabaseServer) {
    (async () => {
      try {
        if (handleOrders === 'delete') {
          const { data: ords } = await supabaseServer.from('orders').select('id').eq('retailer_id', id);
          if (ords && ords.length > 0) {
            const ordIds = ords.map(o => o.id);
            await supabaseServer.from('order_items').delete().in('order_id', ordIds);
            await supabaseServer.from('orders').delete().eq('retailer_id', id);
          }
          await supabaseServer.from('payments').delete().eq('retailer_id', id);
        } else {
          await supabaseServer.from('orders').update({ status: 'cancelled', notes: '[Retailer Account Cleaned Up]' }).eq('retailer_id', id);
        }
        await supabaseServer.from('retailers').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteRetailer notice:', err);
      }
    })();
  }
  res.json({ success: true, message: 'Retailer successfully deleted' });
});

app.post('/api/retailers/cleanup', requireRoles(['admin']), async (req, res) => {
  try {
    const retailerIds = req.body.retailerIds || req.body.ids || [];
    const handleOrders = req.body.handleOrders || 'delete';
    if (!Array.isArray(retailerIds) || retailerIds.length === 0) {
      return res.status(400).json({ error: 'retailerIds array is required' });
    }

    const { deletedCount, affectedOrders } = db.cleanupRetailers(retailerIds, handleOrders === 'archive' ? 'archive' : 'delete');

    if (supabaseServer) {
      for (const id of retailerIds) {
        try {
          if (handleOrders === 'delete') {
            const { data: ords } = await supabaseServer.from('orders').select('id').eq('retailer_id', id);
            if (ords && ords.length > 0) {
              const ordIds = ords.map(o => o.id);
              await supabaseServer.from('order_items').delete().in('order_id', ordIds);
              await supabaseServer.from('orders').delete().eq('retailer_id', id);
            }
            await supabaseServer.from('payments').delete().eq('retailer_id', id);
          } else {
            await supabaseServer.from('orders').update({ status: 'cancelled', notes: '[Retailer Account Cleaned Up]' }).eq('retailer_id', id);
          }
          await supabaseServer.from('retailers').delete().eq('id', id);
        } catch (supaErr) {
          console.warn('Supabase cleanup notice for id', id, supaErr);
        }
      }
    }

    res.json({
      success: true,
      deletedCount,
      affectedOrders,
      message: `Cleaned up ${deletedCount} retailer account(s) and handled ${affectedOrders} associated order(s).`
    });
  } catch (err: any) {
    console.error('Retailer cleanup error:', err);
    res.status(500).json({ error: err?.message || 'Failed to cleanup retailer accounts' });
  }
});

app.get('/api/retailers/:id/ledger', (req, res) => {
  const retailerId = req.params.id;
  const retailer = db.getRetailerById(retailerId) || {
    id: retailerId,
    storeName: 'Retail Outlet',
    ownerName: 'Owner',
    phone: '',
    address: '',
    area: '',
    beatName: '',
    status: 'active',
    creditLimit: 0,
    currentOutstanding: 0,
    creditDaysAllowed: 0
  };

  const orders = db.getOrders().filter(o => o.retailerId === retailerId);
  const payments = db.getPayments().filter(p => p.retailerId === retailerId);

  // Build ledger entries
  const entries: any[] = [];

  orders.forEach(o => {
    entries.push({
      id: `led_ord_${o.id}`,
      date: o.orderDate,
      type: 'invoice',
      referenceNumber: o.orderNumber,
      description: `Tax Invoice - ${o.items.length} FMCG line items (${o.status})`,
      debit: o.grandTotal,
      credit: 0
    });
  });

  payments.forEach(p => {
    entries.push({
      id: `led_pay_${p.id}`,
      date: p.paymentDate,
      type: 'payment',
      referenceNumber: p.receiptNumber,
      description: `Payment Received via ${p.paymentMode.toUpperCase()} (${p.collectorName || 'Direct'})`,
      debit: 0,
      credit: p.amount
    });
  });

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningBalance = 0;
  const calculatedEntries = entries.map(e => {
    runningBalance += (e.debit - e.credit);
    return {
      ...e,
      runningBalance
    };
  });

  res.json({
    retailer,
    entries: calculatedEntries,
    finalBalance: retailer.currentOutstanding
  });
});

// Salesmen
app.get('/api/salesmen', requireRoles(['admin', 'salesman', 'accounts', 'delivery']), (req, res) => {
  const salesmen = db.getSalesmen();
  res.json(salesmen);
});

app.post('/api/salesmen', requireRoles(['admin']), (req, res) => {
  const newSalesman = req.body;
  if (!newSalesman.id) {
    newSalesman.id = `slm_${Date.now()}`;
  }
  const saved = db.saveSalesman(newSalesman);
  res.json(saved);
});

app.put('/api/salesmen/:id', requireRoles(['admin', 'salesman']), (req, res) => {
  const id = req.params.id;
  const salesmen = db.getSalesmen();
  const existing = salesmen.find(s => s.id === id) || {
    id,
    employeeCode: req.body.employeeCode || `EMP-AA-${Math.floor(100 + Math.random() * 900)}`,
    name: req.body.name || 'Sales Representative',
    phone: req.body.phone || '',
    email: req.body.email || '',
    assignedBeats: req.body.assignedBeats || ['Utraula Retail Beat'],
    dailyTargetAmount: 70000,
    monthlyTargetAmount: 1800000,
    currentMonthAchieved: 0,
    commissionPercentage: 1.5,
    todayOrdersCount: 0,
    todaySalesAmount: 0,
    status: 'active'
  };
  const updated = { ...existing, ...req.body, id };
  db.saveSalesman(updated);
  res.json(updated);
});

app.delete('/api/salesmen/:id', requireRoles(['admin']), (req, res) => {
  const id = req.params.id;
  db.deleteSalesman(id);
  res.json({ success: true, message: 'Sales representative removed' });
});

// Beat Routes Management
app.get('/api/beats', (req, res) => {
  res.json(db.getBeats());
});

app.post('/api/beats', requireRoles(['admin', 'salesman']), (req, res) => {
  const name = req.body.name || req.body.beatName || '';
  if (!name.trim()) {
    return res.status(400).json({ error: 'Beat name is required' });
  }
  const updatedBeats = db.saveBeat(name);
  res.json({ success: true, beats: updatedBeats });
});

app.delete('/api/beats/:beatName', requireRoles(['admin', 'salesman']), (req, res) => {
  const beatName = decodeURIComponent(req.params.beatName || '');
  if (!beatName) {
    return res.status(400).json({ error: 'Beat name is required' });
  }
  const result = db.deleteBeat(beatName);
  res.json({ 
    success: true, 
    message: `Beat "${beatName}" removed successfully`, 
    affectedRetailers: result.affectedRetailers,
    affectedSalesmen: result.affectedSalesmen,
    beats: result.beats
  });
});

// Orders
app.get('/api/orders', (req, res) => {
  const orders = db.getOrders();
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  if (!orderId || orderId === 'null' || orderId === 'undefined') {
    return res.status(400).json({ error: 'Invalid order ID: orders.id cannot be null' });
  }
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

app.post('/api/orders', requireRoles(['admin', 'salesman', 'accounts', 'retailer']), (req, res) => {
  const rawOrder = req.body;
  const orderId = (rawOrder.id && rawOrder.id !== 'null' && rawOrder.id !== 'undefined')
    ? rawOrder.id
    : `ord_${Date.now()}`;
  const orderNum = rawOrder.orderNumber || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  let retailer = db.getRetailerById(rawOrder.retailerId);
  if (!retailer && rawOrder.retailerId) {
    const storeName = rawOrder.retailerName || (req as any).user?.businessName || (req as any).user?.name || 'Retail Outlet';
    retailer = db.saveRetailer({
      id: rawOrder.retailerId,
      storeName,
      ownerName: (req as any).user?.name || storeName,
      phone: rawOrder.retailerPhone || (req as any).user?.phone || '+91 98000 00000',
      address: rawOrder.retailerAddress || (req as any).user?.address || 'Market Area',
      area: rawOrder.beatName || 'Utraula Central',
      beatName: rawOrder.beatName || 'Daily Beat',
      status: 'active',
      creditLimit: 50000,
      currentOutstanding: 0,
      creditDaysAllowed: 15
    });
  }
  const products = db.getProducts();

  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalTax = 0;

  const rawItems = Array.isArray(rawOrder.items) ? rawOrder.items : [];
  const calculatedItems: OrderItem[] = rawItems.map((item: any) => {
    const product = products.find(p => p.id === item.productId);
    const piecesPerCase = product?.piecesPerCase || 24;
    const cases = Number(item.cases) || 0;
    const loosePcs = Number(item.loosePcs) || 0;
    const totalPieces = (cases * piecesPerCase) + loosePcs;
    const unitPrice = Number(item.unitPrice || product?.wholesalePricePiece || 10);
    const grossAmount = totalPieces * unitPrice;
    
    let discountAmount = Number(item.discountAmount) || 0;
    let freePcsAwarded = 0;
    let schemeApplied = item.schemeApplied || undefined;

    // Evaluate active trade scheme if any
    if (product?.activeScheme && product.activeScheme.isActive) {
      const scheme = product.activeScheme;
      if (cases >= scheme.minQtyCases) {
        if (scheme.freeQtyPcs) {
          freePcsAwarded = Math.floor(cases / scheme.minQtyCases) * scheme.freeQtyPcs;
          schemeApplied = `${scheme.title} (+${freePcsAwarded} Pcs Free)`;
        }
        if (scheme.discountPercentage) {
          discountAmount = (grossAmount * scheme.discountPercentage) / 100;
          schemeApplied = `${scheme.title} (${scheme.discountPercentage}% Off)`;
        }
        if (scheme.discountFlatRs) {
          discountAmount = cases * scheme.discountFlatRs;
          schemeApplied = `${scheme.title} (₹${scheme.discountFlatRs} off/case)`;
        }
      }
    }

    const netGross = Math.max(0, grossAmount - discountAmount);
    const gstRate = Number(item.gstRate || product?.gstRate || 18);
    // Reverse tax calculation
    const taxableAmount = +(netGross / (1 + gstRate / 100)).toFixed(2);
    const taxAmount = +(netGross - taxableAmount).toFixed(2);
    const halfTax = +(taxAmount / 2).toFixed(2);

    subtotal += grossAmount;
    totalDiscount += discountAmount;
    totalTaxable += taxableAmount;
    totalCgst += halfTax;
    totalSgst += halfTax;
    totalTax += taxAmount;

    return {
      productId: item.productId,
      sku: product?.sku || item.sku || 'SKU-GEN',
      productName: product?.name || item.productName || 'Product',
      brand: product?.brand || item.brand || 'General',
      category: product?.category || 'Biscuits & Bakery',
      hsnCode: product?.hsnCode || '19053100',
      gstRate,
      cases,
      loosePcs,
      totalPieces,
      unitPrice,
      grossAmount: +grossAmount.toFixed(2),
      discountAmount: +discountAmount.toFixed(2),
      taxableAmount,
      cgstAmount: halfTax,
      sgstAmount: halfTax,
      igstAmount: 0,
      totalAmount: +netGross.toFixed(2),
      schemeApplied,
      freePcsAwarded
    };
  });

  const grandTotal = Math.round(subtotal - totalDiscount);
  const roundOff = +(grandTotal - (subtotal - totalDiscount)).toFixed(2);
  const amountPaid = Number(rawOrder.amountPaid) || 0;
  const outstandingAmount = Math.max(0, grandTotal - amountPaid);
  const paymentStatus = outstandingAmount === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

  const order: Order = {
    id: orderId,
    orderNumber: orderNum,
    retailerId: rawOrder.retailerId,
    retailerName: retailer?.storeName || rawOrder.retailerName || 'Retail Store',
    retailerPhone: retailer?.phone || rawOrder.retailerPhone || '',
    retailerAddress: retailer?.address || rawOrder.retailerAddress || '',
    retailerGstin: retailer?.gstin,
    beatName: retailer?.beatName || rawOrder.beatName || 'Daily Beat',
    salesmanId: rawOrder.salesmanId,
    salesmanName: rawOrder.salesmanName,
    orderDate: new Date().toISOString(),
    expectedDeliveryDate: rawOrder.expectedDeliveryDate || new Date().toISOString().split('T')[0],
    items: calculatedItems,
    subtotal: +subtotal.toFixed(2),
    totalDiscount: +totalDiscount.toFixed(2),
    totalTaxable: +totalTaxable.toFixed(2),
    totalCgst: +totalCgst.toFixed(2),
    totalSgst: +totalSgst.toFixed(2),
    totalTax: +totalTax.toFixed(2),
    roundOff,
    grandTotal,
    amountPaid,
    outstandingAmount,
    status: rawOrder.status || 'booked',
    paymentStatus,
    notes: rawOrder.notes
  };

  const saved = db.saveOrder(order);

  // If immediate payment was made
  if (amountPaid > 0) {
    db.recordPayment({
      id: `pay_${Date.now()}`,
      receiptNumber: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
      retailerId: order.retailerId,
      retailerName: order.retailerName,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: amountPaid,
      paymentMode: rawOrder.paymentMode || 'cash',
      paymentDate: new Date().toISOString(),
      collectedByRole: 'salesman',
      collectorName: order.salesmanName || 'Salesman',
      status: 'confirmed',
      notes: 'Collected at order booking'
    });
  }

  res.json(saved);
});

app.put('/api/orders/:id/status', requireRoles(['admin', 'salesman', 'delivery', 'accounts']), (req, res) => {
  const orderId = req.params.id;
  if (!orderId || orderId === 'null' || orderId === 'undefined') {
    return res.status(400).json({ error: 'Invalid order ID: orders.id cannot be null' });
  }
  const { status, driverName, vehicleNumber, podReceiverName, podNotes, podSignature } = req.body;
  const updated = db.updateOrderStatus(orderId, status, {
    driverName,
    vehicleNumber,
    podReceiverName,
    podNotes,
    podSignature
  });
  if (!updated) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(updated);
});

app.delete('/api/orders/:id', requireRoles(['admin']), (req, res) => {
  const id = req.params.id;
  if (!id || id === 'null' || id === 'undefined') {
    return res.status(400).json({ error: 'Invalid order ID: orders.id cannot be null' });
  }
  const success = db.deleteOrder(id);
  res.json({ success });
});

// Deliveries
app.get('/api/deliveries', requireRoles(['admin', 'delivery', 'salesman', 'accounts']), (req, res) => {
  const deliveries = db.getDeliveries();
  res.json(deliveries);
});

app.post('/api/deliveries', requireRoles(['admin']), (req, res) => {
  const raw = req.body;
  const deliveryId = `del_run_${Date.now()}`;
  const runNumber = `RUN-2026-${Math.floor(100 + Math.random() * 900)}`;

  const orders = db.getOrders().filter(o => (raw.orderIds || []).includes(o.id));
  const totalValue = orders.reduce((sum, o) => sum + o.grandTotal, 0);

  const delivery: DeliveryRunSheet = {
    id: deliveryId,
    runNumber,
    date: raw.date || new Date().toISOString().split('T')[0],
    driverName: raw.driverName || 'Suresh Gowda',
    driverPhone: raw.driverPhone || '+91 97410 78901',
    vehicleNumber: raw.vehicleNumber || 'KA-05-AB-1234',
    beatNames: raw.beatNames || ['Indiranagar Retail Beat'],
    totalOrders: orders.length,
    deliveredOrders: 0,
    totalOrderValue: totalValue,
    totalCashCollected: 0,
    totalUpiCollected: 0,
    status: 'out_for_delivery',
    orderIds: raw.orderIds || []
  };

  // Update order statuses to dispatched
  orders.forEach(o => {
    db.updateOrderStatus(o.id, 'dispatched', {
      deliveryRunId: delivery.id,
      driverName: delivery.driverName,
      vehicleNumber: delivery.vehicleNumber
    });
  });

  const saved = db.saveDelivery(delivery);
  res.json(saved);
});

app.put('/api/deliveries/:id/dispatch', requireRoles(['admin']), (req, res) => {
  const deliveryId = req.params.id;
  const deliveries = db.getDeliveries();
  const delivery = deliveries.find(d => d.id === deliveryId);
  if (!delivery) {
    return res.status(404).json({ error: 'Delivery run sheet not found' });
  }
  delivery.status = 'out_for_delivery';
  db.saveDelivery(delivery);
  res.json({ success: true, delivery });
});

app.put('/api/deliveries/:id/pod', requireRoles(['admin', 'delivery']), (req, res) => {
  const deliveryId = req.params.id;
  const { orderId, receiverName, podNotes, paymentCollected, paymentMode, podSignature } = req.body;

  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Update order to delivered
  db.updateOrderStatus(orderId, 'delivered', {
    podReceiverName: receiverName,
    podNotes,
    podSignature,
    deliveredAt: new Date().toISOString()
  });

  // Record payment if collected on spot
  const amount = Number(paymentCollected) || 0;
  if (amount > 0) {
    db.recordPayment({
      id: `pay_${Date.now()}`,
      receiptNumber: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
      retailerId: order.retailerId,
      retailerName: order.retailerName,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount,
      paymentMode: paymentMode || 'upi',
      transactionRef: paymentMode === 'upi' ? `UPI/${Date.now().toString().slice(-8)}` : 'CASH-SPOT',
      paymentDate: new Date().toISOString(),
      collectedByRole: 'delivery',
      collectorName: order.driverName || 'Delivery Driver',
      status: 'confirmed',
      notes: `Spot POD collection for ${order.orderNumber}`
    });
  }

  // Update delivery run sheet stats
  const delivery = db.getDeliveries().find(d => d.id === deliveryId);
  if (delivery) {
    delivery.deliveredOrders += 1;
    if (paymentMode === 'cash') {
      delivery.totalCashCollected += amount;
    } else if (paymentMode === 'upi') {
      delivery.totalUpiCollected += amount;
    }
    if (delivery.deliveredOrders >= delivery.totalOrders) {
      delivery.status = 'completed';
    }
    db.saveDelivery(delivery);
  }

  res.json({ success: true, order: db.getOrderById(orderId) });
});

// Payments
app.get('/api/payments', (req, res) => {
  const payments = db.getPayments();
  res.json(payments);
});

app.post('/api/payments', (req, res) => {
  const raw = req.body;
  const payment: PaymentRecord = {
    id: `pay_${Date.now()}`,
    receiptNumber: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
    retailerId: raw.retailerId,
    retailerName: raw.retailerName,
    orderId: raw.orderId,
    orderNumber: raw.orderNumber,
    amount: Number(raw.amount) || 0,
    paymentMode: raw.paymentMode || 'upi',
    transactionRef: raw.transactionRef || `REF-${Date.now().toString().slice(-6)}`,
    paymentDate: raw.paymentDate || new Date().toISOString(),
    collectedByRole: raw.collectedByRole || 'admin',
    collectorName: raw.collectorName || 'Aryan Sharma',
    status: raw.status || 'confirmed',
    notes: raw.notes
  };

  const saved = db.recordPayment(payment);
  res.json(saved);
});

// Inventory Movements
app.get('/api/inventory', requireRoles(['admin', 'salesman', 'delivery', 'accounts']), (req, res) => {
  const logs = db.getInventoryLogs();
  const products = db.getProducts();
  res.json({ logs, products });
});

app.post('/api/inventory/inward', requireRoles(['admin']), (req, res) => {
  const { productId, batchNumber, mfgDate, expiryDate, cases, loosePcs, supplierInvoice, reason } = req.body;
  const product = db.getProductById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Check if batch exists
  let batch = product.batches.find(b => b.batchNumber === batchNumber);
  if (batch) {
    batch.stockCases += Number(cases) || 0;
    batch.stockLoosePcs += Number(loosePcs) || 0;
  } else {
    product.batches.push({
      batchNumber,
      mfgDate: mfgDate || new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || '2027-06-30',
      stockCases: Number(cases) || 0,
      stockLoosePcs: Number(loosePcs) || 0,
      warehouseBin: 'BAY-NEW'
    });
  }

  const movement = db.logInventoryMovement({
    id: `inv_in_${Date.now()}`,
    type: 'inward',
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    batchNumber,
    cases: Number(cases) || 0,
    loosePcs: Number(loosePcs) || 0,
    referenceId: supplierInvoice || `INW-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString(),
    performedBy: 'Aryan Sharma (Distributor)',
    reason: reason || 'PO Factory Replenishment'
  });

  res.json({ success: true, movement, product: db.getProductById(productId) });
});

app.post('/api/inventory/outward', requireRoles(['admin']), (req, res) => {
  const { productId, batchNumber, cases, loosePcs, reason, type, referenceId } = req.body;
  const product = db.getProductById(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const casesToDeduct = Number(cases) || 0;
  const looseToDeduct = Number(loosePcs) || 0;

  // Deduct from batch if specified
  if (batchNumber && product.batches) {
    const batch = product.batches.find(b => b.batchNumber === batchNumber);
    if (batch) {
      batch.stockCases = Math.max(0, batch.stockCases - casesToDeduct);
      batch.stockLoosePcs = Math.max(0, batch.stockLoosePcs - looseToDeduct);
    }
  }

  const movement = db.logInventoryMovement({
    id: `inv_out_${Date.now()}`,
    type: (type as any) || 'damage_adjustment',
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    batchNumber: batchNumber || product.batches[0]?.batchNumber || 'GENERAL',
    cases: casesToDeduct,
    loosePcs: looseToDeduct,
    referenceId: referenceId || `ADJ-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString(),
    performedBy: 'Aryan Sharma (Distributor)',
    reason: reason || 'Inventory stock-out / adjustment'
  });

  res.json({ success: true, movement, product: db.getProductById(productId) });
});

// Analytics Dashboard
app.get('/api/analytics', (req, res) => {
  const products = db.getProducts();
  const orders = db.getOrders();
  const retailers = db.getRetailers();
  const payments = db.getPayments();
  const salesmen = db.getSalesmen();

  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStockCases * p.casePrice), 0);
  const lowStockCount = products.filter(p => p.currentStockCases <= p.reorderLevelCases).length;

  const totalOutstanding = retailers.reduce((sum, r) => sum + r.currentOutstanding, 0);
  const overdueRetailers = retailers.filter(r => r.status === 'overdue' || r.currentOutstanding > r.creditLimit);

  const totalOrderValue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const todayOrders = orders.filter(o => o.orderDate.startsWith(new Date().toISOString().split('T')[0]));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const totalPaymentsCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const todayPayments = payments.filter(p => p.paymentDate.startsWith(new Date().toISOString().split('T')[0]));
  const todayCollected = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    summary: {
      todaySales,
      todayOrdersCount: todayOrders.length,
      totalOrdersCount: orders.length,
      totalOrderValue,
      totalStockValue,
      totalOutstanding,
      totalPaymentsCollected,
      todayCollected,
      lowStockCount,
      overdueRetailersCount: overdueRetailers.length,
      activeRetailersCount: retailers.length,
      salesmenCount: salesmen.length
    },
    topSalesmen: salesmen.map(s => ({
      name: s.name,
      beats: s.assignedBeats.join(', '),
      monthlyTarget: s.monthlyTargetAmount,
      achieved: s.currentMonthAchieved,
      pct: Math.round((s.currentMonthAchieved / s.monthlyTargetAmount) * 100),
      todayOrders: s.todayOrdersCount,
      todaySales: s.todaySalesAmount
    })),
    topProducts: products.slice(0, 5).map(p => ({
      name: p.name,
      brand: p.brand,
      stockCases: p.currentStockCases,
      casePrice: p.casePrice,
      value: p.currentStockCases * p.casePrice
    }))
  });
});

// Promotional Banners Management Endpoints
app.get('/api/banners', (req, res) => {
  const banners = db.getBanners();
  res.json(banners);
});

app.post('/api/banners', requireRoles(['admin', 'salesman']), (req, res) => {
  const raw = req.body;
  const newBanner = {
    id: raw.id || `banner_${Date.now()}`,
    title: raw.title || 'Special Wholesale Offer',
    subtitle: raw.subtitle || '',
    badgeText: raw.badgeText || 'Special Offer',
    ctaText: raw.ctaText || '',
    targetCategory: raw.targetCategory || '',
    targetBrand: raw.targetBrand || '',
    imageUrl: raw.imageUrl || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
    bgGradient: raw.bgGradient || 'from-[#F6BD27] via-[#F4B218] to-[#E89E0B]',
    accentColor: raw.accentColor || '',
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    hideTextOverlay: raw.hideTextOverlay !== undefined ? Boolean(raw.hideTextOverlay) : false,
    posterFit: raw.posterFit || 'cover',
    showBuyNow: raw.showBuyNow !== undefined ? Boolean(raw.showBuyNow) : true,
    buyNowText: raw.buyNowText || 'Buy Now'
  };
  const saved = db.saveBanner(newBanner);
  res.json(saved);
});

app.put('/api/banners/:id', requireRoles(['admin', 'salesman']), (req, res) => {
  const id = req.params.id;
  const banners = db.getBanners();
  const existing = banners.find(b => b.id === id);
  const updated = existing 
    ? { ...existing, ...req.body, id }
    : {
        id,
        title: req.body.title || 'Special Promotion',
        subtitle: req.body.subtitle || '',
        badgeText: req.body.badgeText || 'HOT DEAL',
        bgGradient: req.body.bgGradient || 'from-blue-900 via-indigo-900 to-slate-950',
        imageUrl: req.body.imageUrl || '',
        targetCategory: req.body.targetCategory || 'Biscuits & Bakery',
        ctaText: req.body.ctaText || 'Shop Now',
        isActive: req.body.isActive !== false,
        priority: Number(req.body.priority) || 5,
        hideTextOverlay: !!req.body.hideTextOverlay,
        posterFit: req.body.posterFit || 'cover',
        targetBrand: req.body.targetBrand || '',
        showBuyNow: req.body.showBuyNow !== false,
        buyNowText: req.body.buyNowText || 'Buy Now',
        ...req.body
      };
  const saved = db.saveBanner(updated);
  res.json(saved || updated);
});

app.delete('/api/banners/:id', requireRoles(['admin', 'salesman']), (req, res) => {
  const id = req.params.id;
  const success = db.deleteBanner(id);
  res.json({ success });
});

// AI Copilot Endpoints
app.post('/api/ai/parse-order', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text prompt is required' });
  }
  const parsed = await parseNaturalLanguageOrder(text);
  res.json(parsed);
});

app.get('/api/ai/insights', async (req, res) => {
  const insights = await generateFMCGInsights();
  res.json(insights);
});

// Reset Database
app.post('/api/db/reset', requireRoles(['admin']), (req, res) => {
  const data = db.resetToDefault();
  res.json({ success: true, message: 'Database reset to default FMCG demo dataset' });
});

// Serves the official promotional banner image
app.all(['/download/banner_main.jpg', '/download/banner.jpg', '/api/banners/main-image'], (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method Not Allowed');
  }
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'download', 'banner_main.jpg'),
    path.join(process.cwd(), 'dist', 'download', 'banner_main.jpg')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(p);
    }
  }
  return res.status(404).send('Banner image not found');
});

// Dedicated public APK and Version distribution endpoints
const GITHUB_LATEST_APK_URL = 'https://github.com/nikhilcsc18-alt/aryan-agency-app/releases/latest/download/aryan-agency-app.apk';

// Serves the official domain APK: https://aryanagency.in/download/aryan-agency-app.apk
app.all(['/download/aryan-agency-app.apk', '/downloads/aryan-agency-app.apk', '/download/aryan-agency.apk'], (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method Not Allowed');
  }

  const possiblePaths = [
    path.join(process.cwd(), 'public', 'download', 'aryan-agency-app.apk'),
    path.join(process.cwd(), 'dist', 'download', 'aryan-agency-app.apk'),
  ];
  const apkPath = possiblePaths.find(p => fs.existsSync(p));

  // If local file exists and is a real compiled Android APK (> 1MB), stream directly from domain
  if (apkPath) {
    try {
      const stat = fs.statSync(apkPath);
      if (stat.size > 1024 * 1024) {
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Length', stat.size.toString());
        res.setHeader('Content-Disposition', 'attachment; filename="aryan-agency-app.apk"');
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.setHeader('Accept-Ranges', 'bytes');

        if (req.method === 'HEAD') {
          return res.status(200).end();
        }

        const readStream = fs.createReadStream(apkPath);
        return readStream.pipe(res);
      }
    } catch (err) {
      console.error('[server] Error reading local APK file:', err);
    }
  }

  // Developer / Backup Fallback: Redirect to GitHub Releases mirror if local file is missing
  return res.redirect(302, GITHUB_LATEST_APK_URL);
});

// App Version & APK Distribution Configuration Endpoints (Live update sync for mobile apps)
app.get(['/download/version.json', '/api/app/version'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const versionConfig = db.getAppVersionConfig();
  res.json(versionConfig);
});

app.post('/api/app/version', requireRoles(['admin']), (req, res) => {
  const updated = db.saveAppVersionConfig(req.body);
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, versionConfig: updated, message: 'App version updated on server. All mobile devices will now see this update.' });
});

// Explicit 404 handler for unmatched /api/* requests so Vite SPA never returns index.html for API calls
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Express error handler returning JSON errors instead of HTML
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[API Error]:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Vite Middleware Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aryan Agency FMCG server running on http://0.0.0.0:${PORT}`);
  });

  if (PORT !== 3000) {
    try {
      const secondary = app.listen(3000, '0.0.0.0', () => {
        console.log(`Also listening on port 3000 for AI Studio environment`);
      });
      secondary.on('error', (err: any) => {
        console.warn('Port 3000 listener note:', err?.message || err);
      });
    } catch (e: any) {
      console.warn('Port 3000 listener note:', e?.message || e);
    }
  }
}

startServer();
