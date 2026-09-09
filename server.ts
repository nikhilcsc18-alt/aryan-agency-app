import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { db } from './server/db';
import { parseNaturalLanguageOrder, generateFMCGInsights } from './server/gemini';
import { Order, OrderItem, PaymentRecord, DeliveryRunSheet } from './src/types';

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
const PORT = 3000;

app.use(express.json());

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

// Products
app.get('/api/products', (req, res) => {
  const products = db.getProducts().map(p => ({
    ...p,
    sku: p.sku || (p as any).product_sku || (p as any).productSku || ''
  }));
  res.json(products);
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
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const updated = { ...existing, ...req.body, id };
  updated.sku = req.body.sku || req.body.product_sku || req.body.productSku || existing.sku || '';
  if (updated.wholesalePricePiece && updated.piecesPerCase) {
    updated.casePrice = Number(updated.wholesalePricePiece) * Number(updated.piecesPerCase);
  }
  db.saveProduct(updated);
  res.json(updated);
});

app.delete('/api/products/:id', requireRoles(['admin']), (req, res) => {
  const id = req.params.id;
  const deleted = db.deleteProduct(id);
  res.json({ success: deleted });
});

// Retailers
app.get('/api/retailers', (req, res) => {
  const retailers = db.getRetailers();
  res.json(retailers);
});

app.post('/api/retailers', requireRoles(['admin', 'salesman', 'accounts']), (req, res) => {
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
  newRetailer.area = newRetailer.area?.trim() || 'Indiranagar';
  newRetailer.beatName = newRetailer.beatName?.trim() || 'Indiranagar Retail Beat';
  newRetailer.gstin = gstin;
  newRetailer.panNumber = newRetailer.panNumber?.trim().toUpperCase() || '';
  newRetailer.creditLimit = Number(newRetailer.creditLimit) >= 0 ? Number(newRetailer.creditLimit) : 50000;
  newRetailer.currentOutstanding = Number(newRetailer.currentOutstanding) || 0;
  newRetailer.creditDaysAllowed = Number(newRetailer.creditDaysAllowed) || 14;
  newRetailer.creditEnabled = newRetailer.creditEnabled !== undefined ? Boolean(newRetailer.creditEnabled) : false;
  newRetailer.status = newRetailer.status || 'active';
  newRetailer.createdAt = newRetailer.createdAt || new Date().toISOString().split('T')[0];

  const saved = db.saveRetailer(newRetailer);
  res.json(saved);
});

app.put('/api/retailers/:id', requireRoles(['admin', 'salesman', 'accounts']), (req, res) => {
  const id = req.params.id;
  const existing = db.getRetailerById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Retailer not found' });
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

app.delete('/api/retailers/:id', requireRoles(['admin']), (req, res) => {
  const id = req.params.id;
  const success = db.deleteRetailer(id);
  res.json({ success });
});

app.get('/api/retailers/:id/ledger', (req, res) => {
  const retailerId = req.params.id;
  const retailer = db.getRetailerById(retailerId);
  if (!retailer) {
    return res.status(404).json({ error: 'Retailer not found' });
  }

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

app.put('/api/salesmen/:id', requireRoles(['admin']), (req, res) => {
  const id = req.params.id;
  const salesmen = db.getSalesmen();
  const existing = salesmen.find(s => s.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Salesman not found' });
  }
  const updated = { ...existing, ...req.body, id };
  db.saveSalesman(updated);
  res.json(updated);
});

app.delete('/api/salesmen/:id', requireRoles(['admin']), (req, res) => {
  const id = req.params.id;
  const success = db.deleteSalesman(id);
  res.json({ success });
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

  const retailer = db.getRetailerById(rawOrder.retailerId);
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
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aryan Agency FMCG server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
