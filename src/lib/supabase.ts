import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Product, 
  Retailer, 
  Salesman, 
  Order, 
  OrderItem,
  DeliveryRunSheet, 
  PaymentRecord, 
  InventoryMovement, 
  User,
  Category,
  Brand
} from '../types';

// Read Supabase environment credentials from client or server environment
const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
export const supabaseAnonKey = typeof rawKey === 'string' ? rawKey.trim() : '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ============================================================================
// DATA CONVERSION & NORMALIZATION HELPERS (snake_case <-> camelCase)
// ============================================================================

function mapDbUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url,
    salesmanId: row.salesman_id,
    retailerId: row.retailer_id,
    deliveryId: row.delivery_id
  };
}

function userToDb(u: Partial<User>): any {
  const out: any = {};
  if (u.id !== undefined) out.id = u.id;
  if (u.name !== undefined) out.name = u.name;
  if (u.email !== undefined) out.email = u.email;
  if (u.phone !== undefined) out.phone = u.phone;
  if (u.role !== undefined) out.role = u.role;
  if (u.avatarUrl !== undefined) out.avatar_url = u.avatarUrl;
  if (u.salesmanId !== undefined) out.salesman_id = u.salesmanId;
  if (u.retailerId !== undefined) out.retailer_id = u.retailerId;
  if (u.deliveryId !== undefined) out.delivery_id = u.deliveryId;
  return out;
}

function mapDbCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    gstRate: Number(row.gst_rate || 18)
  };
}

function mapDbBrand(row: any): Brand {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    companyName: row.company_name,
    logoUrl: row.logo_url
  };
}

function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    category: row.category,
    hsnCode: row.hsn_code,
    gstRate: Number(row.gst_rate || 18),
    piecesPerCase: Number(row.pieces_per_case || 24),
    mrpPiece: Number(row.mrp_piece || 0),
    wholesalePricePiece: Number(row.wholesale_price_piece || 0),
    casePrice: Number(row.case_price || 0),
    currentStockCases: Number(row.current_stock_cases || 0),
    currentStockLoosePcs: Number(row.current_stock_loose_pcs || 0),
    reorderLevelCases: Number(row.reorder_level_cases || 10),
    imageUrl: row.image_url || '',
    description: row.description || '',
    batches: Array.isArray(row.batches) ? row.batches : [],
    activeScheme: row.active_scheme || undefined
  };
}

function productToDb(p: Partial<Product>): any {
  const out: any = {};
  if (p.id !== undefined) out.id = p.id;
  if (p.sku !== undefined) out.sku = p.sku;
  if (p.name !== undefined) out.name = p.name;
  if (p.brand !== undefined) out.brand = p.brand;
  if (p.category !== undefined) out.category = p.category;
  if (p.hsnCode !== undefined) out.hsn_code = p.hsnCode;
  if (p.gstRate !== undefined) out.gst_rate = p.gstRate;
  if (p.piecesPerCase !== undefined) out.pieces_per_case = p.piecesPerCase;
  if (p.mrpPiece !== undefined) out.mrp_piece = p.mrpPiece;
  if (p.wholesalePricePiece !== undefined) out.wholesale_price_piece = p.wholesalePricePiece;
  if (p.casePrice !== undefined) out.case_price = p.casePrice;
  if (p.currentStockCases !== undefined) out.current_stock_cases = p.currentStockCases;
  if (p.currentStockLoosePcs !== undefined) out.current_stock_loose_pcs = p.currentStockLoosePcs;
  if (p.reorderLevelCases !== undefined) out.reorder_level_cases = p.reorderLevelCases;
  if (p.imageUrl !== undefined) out.image_url = p.imageUrl;
  if (p.description !== undefined) out.description = p.description;
  if (p.batches !== undefined) out.batches = p.batches;
  if (p.activeScheme !== undefined) out.active_scheme = p.activeScheme;
  return out;
}

function mapDbRetailer(row: any): Retailer {
  return {
    id: row.id,
    storeName: row.store_name,
    ownerName: row.owner_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    area: row.area,
    beatName: row.beat_name,
    gstin: row.gstin,
    panNumber: row.pan_number,
    creditLimit: Number(row.credit_limit || 50000),
    currentOutstanding: Number(row.current_outstanding || 0),
    creditDaysAllowed: Number(row.credit_days_allowed || 14),
    lat: row.lat ? Number(row.lat) : undefined,
    lng: row.lng ? Number(row.lng) : undefined,
    status: row.status || 'active',
    createdAt: row.created_at || new Date().toISOString()
  };
}

function retailerToDb(r: Partial<Retailer>): any {
  const out: any = {};
  if (r.id !== undefined) out.id = r.id;
  if (r.storeName !== undefined) out.store_name = r.storeName;
  if (r.ownerName !== undefined) out.owner_name = r.ownerName;
  if (r.phone !== undefined) out.phone = r.phone;
  if (r.email !== undefined) out.email = r.email;
  if (r.address !== undefined) out.address = r.address;
  if (r.area !== undefined) out.area = r.area;
  if (r.beatName !== undefined) out.beat_name = r.beatName;
  if (r.gstin !== undefined) out.gstin = r.gstin;
  if (r.panNumber !== undefined) out.pan_number = r.panNumber;
  if (r.creditLimit !== undefined) out.credit_limit = r.creditLimit;
  if (r.currentOutstanding !== undefined) out.current_outstanding = r.currentOutstanding;
  if (r.creditDaysAllowed !== undefined) out.credit_days_allowed = r.creditDaysAllowed;
  if (r.status !== undefined) out.status = r.status;
  return out;
}

function mapDbSalesman(row: any): Salesman {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    name: row.name,
    phone: row.phone,
    email: row.email,
    assignedBeats: Array.isArray(row.assigned_beats) ? row.assigned_beats : [],
    dailyTargetAmount: Number(row.daily_target_amount || 75000),
    monthlyTargetAmount: Number(row.monthly_target_amount || 1800000),
    currentMonthAchieved: Number(row.current_month_achieved || 0),
    commissionPercentage: Number(row.commission_percentage || 1.5),
    todayOrdersCount: Number(row.today_orders_count || 0),
    todaySalesAmount: Number(row.today_sales_amount || 0),
    status: row.status || 'active'
  };
}

function salesmanToDb(s: Partial<Salesman>): any {
  const out: any = {};
  if (s.id !== undefined) out.id = s.id;
  if (s.employeeCode !== undefined) out.employee_code = s.employeeCode;
  if (s.name !== undefined) out.name = s.name;
  if (s.phone !== undefined) out.phone = s.phone;
  if (s.email !== undefined) out.email = s.email;
  if (s.assignedBeats !== undefined) out.assigned_beats = s.assignedBeats;
  if (s.dailyTargetAmount !== undefined) out.daily_target_amount = s.dailyTargetAmount;
  if (s.monthlyTargetAmount !== undefined) out.monthly_target_amount = s.monthlyTargetAmount;
  if (s.currentMonthAchieved !== undefined) out.current_month_achieved = s.currentMonthAchieved;
  if (s.commissionPercentage !== undefined) out.commission_percentage = s.commissionPercentage;
  if (s.todayOrdersCount !== undefined) out.today_orders_count = s.todayOrdersCount;
  if (s.todaySalesAmount !== undefined) out.today_sales_amount = s.todaySalesAmount;
  if (s.status !== undefined) out.status = s.status;
  return out;
}

function mapDbOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    retailerId: row.retailer_id,
    retailerName: row.retailer_name,
    retailerPhone: row.retailer_phone || '',
    retailerAddress: row.retailer_address || '',
    retailerGstin: row.retailer_gstin,
    beatName: row.beat_name,
    salesmanId: row.salesman_id,
    salesmanName: row.salesman_name,
    orderDate: row.order_date,
    expectedDeliveryDate: row.expected_delivery_date || '',
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal || 0),
    totalDiscount: Number(row.total_discount || 0),
    totalTaxable: Number(row.total_taxable || 0),
    totalCgst: Number(row.total_cgst || 0),
    totalSgst: Number(row.total_sgst || 0),
    totalTax: Number(row.total_tax || 0),
    roundOff: Number(row.round_off || 0),
    grandTotal: Number(row.grand_total || 0),
    amountPaid: Number(row.amount_paid || 0),
    outstandingAmount: Number(row.outstanding_amount || 0),
    status: row.status,
    paymentStatus: row.payment_status,
    deliveryRunId: row.delivery_run_id,
    driverName: row.driver_name,
    vehicleNumber: row.vehicle_number,
    podReceiverName: row.pod_receiver_name,
    podSignature: row.pod_signature,
    podNotes: row.pod_notes,
    notes: row.notes,
    isInterstate: Boolean(row.is_interstate)
  };
}

function orderToDb(o: Partial<Order>): any {
  const out: any = {};
  if (o.id !== undefined) out.id = o.id;
  if (o.orderNumber !== undefined) out.order_number = o.orderNumber;
  if (o.retailerId !== undefined) out.retailer_id = o.retailerId;
  if (o.retailerName !== undefined) out.retailer_name = o.retailerName;
  if (o.retailerPhone !== undefined) out.retailer_phone = o.retailerPhone;
  if (o.retailerAddress !== undefined) out.retailer_address = o.retailerAddress;
  if (o.retailerGstin !== undefined) out.retailer_gstin = o.retailerGstin;
  if (o.beatName !== undefined) out.beat_name = o.beatName;
  if (o.salesmanId !== undefined) out.salesman_id = o.salesmanId;
  if (o.salesmanName !== undefined) out.salesman_name = o.salesmanName;
  if (o.orderDate !== undefined) out.order_date = o.orderDate;
  if (o.expectedDeliveryDate !== undefined) out.expected_delivery_date = o.expectedDeliveryDate;
  if (o.items !== undefined) out.items = o.items;
  if (o.subtotal !== undefined) out.subtotal = o.subtotal;
  if (o.totalDiscount !== undefined) out.total_discount = o.totalDiscount;
  if (o.totalTaxable !== undefined) out.total_taxable = o.totalTaxable;
  if (o.totalCgst !== undefined) out.total_cgst = o.totalCgst;
  if (o.totalSgst !== undefined) out.total_sgst = o.totalSgst;
  if (o.totalTax !== undefined) out.total_tax = o.totalTax;
  if (o.roundOff !== undefined) out.round_off = o.roundOff;
  if (o.grandTotal !== undefined) out.grand_total = o.grandTotal;
  if (o.amountPaid !== undefined) out.amount_paid = o.amountPaid;
  if (o.outstandingAmount !== undefined) out.outstanding_amount = o.outstandingAmount;
  if (o.status !== undefined) out.status = o.status;
  if (o.paymentStatus !== undefined) out.payment_status = o.paymentStatus;
  if (o.deliveryRunId !== undefined) out.delivery_run_id = o.deliveryRunId;
  if (o.driverName !== undefined) out.driver_name = o.driverName;
  if (o.vehicleNumber !== undefined) out.vehicle_number = o.vehicleNumber;
  if (o.podReceiverName !== undefined) out.pod_receiver_name = o.podReceiverName;
  if (o.podSignature !== undefined) out.pod_signature = o.podSignature;
  if (o.podNotes !== undefined) out.pod_notes = o.podNotes;
  if (o.notes !== undefined) out.notes = o.notes;
  if (o.isInterstate !== undefined) out.is_interstate = o.isInterstate;
  return out;
}

function mapDbOrderItem(row: any): OrderItem {
  return {
    productId: row.product_id,
    sku: row.sku,
    productName: row.product_name,
    brand: row.brand,
    category: row.category,
    hsnCode: row.hsn_code,
    gstRate: Number(row.gst_rate || 18),
    cases: Number(row.cases || 0),
    loosePcs: Number(row.loose_pcs || 0),
    totalPieces: Number(row.total_pieces || 0),
    unitPrice: Number(row.unit_price || 0),
    grossAmount: Number(row.gross_amount || 0),
    discountAmount: Number(row.discount_amount || 0),
    taxableAmount: Number(row.taxable_amount || 0),
    cgstAmount: Number(row.cgst_amount || 0),
    sgstAmount: Number(row.sgst_amount || 0),
    igstAmount: Number(row.igst_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    schemeApplied: row.scheme_applied,
    freePcsAwarded: row.free_pcs_awarded
  };
}

function mapDbPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    retailerId: row.retailer_id,
    retailerName: row.retailer_name,
    orderId: row.order_id,
    orderNumber: row.order_number,
    amount: Number(row.amount || 0),
    paymentMode: row.payment_mode,
    transactionRef: row.transaction_ref,
    paymentDate: row.payment_date,
    collectedByRole: row.collected_by_role,
    collectorName: row.collector_name,
    status: row.status,
    notes: row.notes
  };
}

function paymentToDb(p: Partial<PaymentRecord>): any {
  const out: any = {};
  if (p.id !== undefined) out.id = p.id;
  if (p.receiptNumber !== undefined) out.receipt_number = p.receiptNumber;
  if (p.retailerId !== undefined) out.retailer_id = p.retailerId;
  if (p.retailerName !== undefined) out.retailer_name = p.retailerName;
  if (p.orderId !== undefined) out.order_id = p.orderId;
  if (p.orderNumber !== undefined) out.order_number = p.orderNumber;
  if (p.amount !== undefined) out.amount = p.amount;
  if (p.paymentMode !== undefined) out.payment_mode = p.paymentMode;
  if (p.transactionRef !== undefined) out.transaction_ref = p.transactionRef;
  if (p.paymentDate !== undefined) out.payment_date = p.paymentDate;
  if (p.collectedByRole !== undefined) out.collected_by_role = p.collectedByRole;
  if (p.collectorName !== undefined) out.collector_name = p.collectorName;
  if (p.status !== undefined) out.status = p.status;
  if (p.notes !== undefined) out.notes = p.notes;
  return out;
}

function mapDbDelivery(row: any): DeliveryRunSheet {
  return {
    id: row.id,
    runNumber: row.run_number,
    date: row.date,
    driverName: row.driver_name,
    driverPhone: row.driver_phone || '',
    vehicleNumber: row.vehicle_number,
    beatNames: Array.isArray(row.beat_names) ? row.beat_names : [],
    totalOrders: Number(row.total_orders || 0),
    deliveredOrders: Number(row.delivered_orders || 0),
    totalOrderValue: Number(row.total_order_value || 0),
    totalCashCollected: Number(row.total_cash_collected || 0),
    totalUpiCollected: Number(row.total_upi_collected || 0),
    status: row.status,
    orderIds: Array.isArray(row.order_ids) ? row.order_ids : []
  };
}

function deliveryToDb(d: Partial<DeliveryRunSheet>): any {
  const out: any = {};
  if (d.id !== undefined) out.id = d.id;
  if (d.runNumber !== undefined) out.run_number = d.runNumber;
  if (d.date !== undefined) out.date = d.date;
  if (d.driverName !== undefined) out.driver_name = d.driverName;
  if (d.driverPhone !== undefined) out.driver_phone = d.driverPhone;
  if (d.vehicleNumber !== undefined) out.vehicle_number = d.vehicleNumber;
  if (d.beatNames !== undefined) out.beat_names = d.beatNames;
  if (d.totalOrders !== undefined) out.total_orders = d.totalOrders;
  if (d.deliveredOrders !== undefined) out.delivered_orders = d.deliveredOrders;
  if (d.totalOrderValue !== undefined) out.total_order_value = d.totalOrderValue;
  if (d.totalCashCollected !== undefined) out.total_cash_collected = d.totalCashCollected;
  if (d.totalUpiCollected !== undefined) out.total_upi_collected = d.totalUpiCollected;
  if (d.status !== undefined) out.status = d.status;
  if (d.orderIds !== undefined) out.order_ids = d.orderIds;
  return out;
}

function mapDbMovement(row: any): InventoryMovement {
  return {
    id: row.id,
    type: row.type,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    batchNumber: row.batch_number,
    cases: Number(row.cases || 0),
    loosePcs: Number(row.loose_pcs || 0),
    referenceId: row.reference_id,
    date: row.date,
    performedBy: row.performed_by,
    reason: row.reason
  };
}

// ============================================================================
// SUPABASE SERVICE IMPLEMENTATION
// ============================================================================

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  /**
   * Diagnostic test verifying connection and all 11 required tables
   */
  async checkConnection(): Promise<{
    configured: boolean;
    connected: boolean;
    message: string;
    missingEnvVars: string[];
    verifiedTables: { table: string; count: number; status: 'ok' | 'error' | 'empty' }[];
  }> {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

    if (!isSupabaseConfigured || !supabase) {
      return {
        configured: false,
        connected: false,
        message: missing.length > 0 
          ? `Missing Supabase environment variables: ${missing.join(', ')}` 
          : 'Supabase credentials contain placeholder values',
        missingEnvVars: missing,
        verifiedTables: []
      };
    }

    const tablesToTest = [
      'users',
      'retailers',
      'products',
      'categories',
      'brands',
      'salesmen',
      'orders',
      'order_items',
      'payments',
      'inventory',
      'deliveries'
    ];

    const results: { table: string; count: number; status: 'ok' | 'error' | 'empty' }[] = [];
    let anyOk = false;

    for (const tbl of tablesToTest) {
      try {
        const { count, error } = await supabase.from(tbl).select('*', { count: 'exact', head: true });
        if (error) {
          results.push({ table: tbl, count: 0, status: 'error' });
        } else {
          anyOk = true;
          results.push({ table: tbl, count: count || 0, status: (count && count > 0) ? 'ok' : 'empty' });
        }
      } catch (err) {
        results.push({ table: tbl, count: 0, status: 'error' });
      }
    }

    return {
      configured: true,
      connected: anyOk,
      message: anyOk 
        ? 'Successfully connected to Supabase PostgreSQL database' 
        : 'Could not connect to Supabase tables. Please execute the supabase_schema.sql script in your Supabase SQL editor.',
      missingEnvVars: [],
      verifiedTables: results
    };
  },

  // 1. Users & Supabase Auth
  async getUsers(): Promise<User[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapDbUser);
  },

  async getUserById(id: string): Promise<User | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapDbUser(data) : null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();
    if (error) throw error;
    return data ? mapDbUser(data) : null;
  },

  async saveUser(user: Partial<User>): Promise<User | null> {
    if (!supabase) return null;
    const dbPayload = userToDb(user);
    const { data, error } = await supabase.from('users').upsert(dbPayload).select().single();
    if (error) throw error;
    return mapDbUser(data);
  },

  // Auth Functions
  async getAuthSession() {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },

  async signUpWithEmail(email: string, password: string, profile: { name: string; phone: string; role: string; salesmanId?: string; retailerId?: string; deliveryId?: string }) {
    if (!supabase) throw new Error('Supabase client is not configured');
    
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: profile.name,
          phone: profile.phone,
          role: profile.role
        }
      }
    });

    if (authError) throw authError;

    // 2. Create or sync profile record in users table
    const userId = authData.user?.id || `usr_${Date.now()}`;
    const userProfile: User = {
      id: userId,
      name: profile.name,
      email: email.trim().toLowerCase(),
      phone: profile.phone,
      role: profile.role as any,
      salesmanId: profile.salesmanId,
      retailerId: profile.retailerId,
      deliveryId: profile.deliveryId
    };

    try {
      await this.saveUser(userProfile);
    } catch (profileErr) {
      console.warn('Profile sync warning:', profileErr);
    }

    return { user: userProfile, authUser: authData.user, session: authData.session };
  },

  async signInWithEmail(email: string, password: string) {
    if (!supabase) throw new Error('Supabase client is not configured');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });

    if (error) throw error;

    // Find profile from database or fallback to user metadata
    let profile = await this.getUserByEmail(email);
    if (!profile && data.user) {
      profile = {
        id: data.user.id,
        name: data.user.user_metadata?.name || email.split('@')[0],
        email: data.user.email || email,
        phone: data.user.user_metadata?.phone || '+91 98000 00000',
        role: (data.user.user_metadata?.role as any) || 'admin'
      };
      try {
        await this.saveUser(profile);
      } catch (err) {
        console.warn('Failed to auto-save profile on sign in:', err);
      }
    }

    return { session: data.session, user: profile || null, authUser: data.user };
  },

  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 2. Categories
  async getCategories(): Promise<Category[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapDbCategory);
  },

  // 3. Brands
  async getBrands(): Promise<Brand[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapDbBrand);
  },

  // 4. Products
  async getProducts(): Promise<Product[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapDbProduct);
  },

  async saveProduct(product: Partial<Product>): Promise<Product | null> {
    if (!supabase) return null;
    const dbPayload = productToDb(product);
    const { data, error } = await supabase.from('products').upsert(dbPayload).select().single();
    if (error) throw error;
    return mapDbProduct(data);
  },

  async deleteProduct(id: string): Promise<boolean | null> {
    if (!supabase) return null;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // 5. Retailers
  async getRetailers(): Promise<Retailer[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('retailers').select('*').order('store_name');
    if (error) throw error;
    return (data || []).map(mapDbRetailer);
  },

  async saveRetailer(retailer: Partial<Retailer>): Promise<Retailer | null> {
    if (!supabase) return null;
    const dbPayload = retailerToDb(retailer);
    const { data, error } = await supabase.from('retailers').upsert(dbPayload).select().single();
    if (error) throw error;
    return mapDbRetailer(data);
  },

  async deleteRetailer(id: string): Promise<boolean | null> {
    if (!supabase) return null;
    const { error } = await supabase.from('retailers').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // 6. Salesmen
  async getSalesmen(): Promise<Salesman[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('salesmen').select('*').order('name');
    if (error) throw error;
    return (data || []).map(mapDbSalesman);
  },

  async saveSalesman(salesman: Partial<Salesman>): Promise<Salesman | null> {
    if (!supabase) return null;
    const dbPayload = salesmanToDb(salesman);
    const { data, error } = await supabase.from('salesmen').upsert(dbPayload).select().single();
    if (error) throw error;
    return mapDbSalesman(data);
  },

  async deleteSalesman(id: string): Promise<boolean | null> {
    if (!supabase) return null;
    const { error } = await supabase.from('salesmen').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // 7. Orders
  async getOrders(): Promise<Order[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('orders').select('*').order('order_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbOrder);
  },

  async createOrder(order: Partial<Order>): Promise<Order | null> {
    if (!supabase) return null;
    const dbPayload = orderToDb(order);
    const { data, error } = await supabase.from('orders').insert(dbPayload).select().single();
    if (error) throw error;

    // Also populate normalized order_items table if items are present
    if (order.items && order.items.length > 0 && data.id) {
      const lineItems = order.items.map(item => ({
        order_id: data.id,
        product_id: item.productId,
        sku: item.sku,
        product_name: item.productName,
        brand: item.brand,
        category: item.category,
        hsn_code: item.hsnCode,
        gst_rate: item.gstRate,
        cases: item.cases,
        loose_pcs: item.loosePcs,
        total_pieces: item.totalPieces,
        unit_price: item.unitPrice,
        gross_amount: item.grossAmount,
        discount_amount: item.discountAmount,
        taxable_amount: item.taxableAmount,
        cgst_amount: item.cgstAmount,
        sgst_amount: item.sgstAmount,
        igst_amount: item.igstAmount,
        total_amount: item.totalAmount,
        scheme_applied: item.schemeApplied,
        free_pcs_awarded: item.freePcsAwarded || 0
      }));
      await supabase.from('order_items').insert(lineItems);
    }

    return mapDbOrder(data);
  },

  async updateOrderStatus(id: string, status: string, extra?: any): Promise<Order | null> {
    if (!supabase) return null;
    const updatePayload: any = { status };
    if (extra) {
      if (extra.paymentStatus) updatePayload.payment_status = extra.paymentStatus;
      if (extra.podReceiverName) updatePayload.pod_receiver_name = extra.podReceiverName;
      if (extra.podSignature) updatePayload.pod_signature = extra.podSignature;
      if (extra.podNotes) updatePayload.pod_notes = extra.podNotes;
    }
    const { data, error } = await supabase.from('orders').update(updatePayload).eq('id', id).select().single();
    if (error) throw error;
    return mapDbOrder(data);
  },

  async deleteOrder(id: string): Promise<boolean | null> {
    if (!supabase) return null;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // 8. Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    if (error) throw error;
    return (data || []).map(mapDbOrderItem);
  },

  // 9. Payments
  async getPayments(): Promise<PaymentRecord[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbPayment);
  },

  async recordPayment(payment: Partial<PaymentRecord>): Promise<PaymentRecord | null> {
    if (!supabase) return null;
    const dbPayload = paymentToDb(payment);
    const { data, error } = await supabase.from('payments').insert(dbPayload).select().single();
    if (error) throw error;
    return mapDbPayment(data);
  },

  // 10. Deliveries
  async getDeliveries(): Promise<DeliveryRunSheet[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('deliveries').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbDelivery);
  },

  async saveDelivery(sheet: Partial<DeliveryRunSheet>): Promise<DeliveryRunSheet | null> {
    if (!supabase) return null;
    const dbPayload = deliveryToDb(sheet);
    const { data, error } = await supabase.from('deliveries').upsert(dbPayload).select().single();
    if (error) throw error;
    return mapDbDelivery(data);
  },

  // 11. Inventory & Movements
  async getInventoryLogs(): Promise<InventoryMovement[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('inventory_movements').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapDbMovement);
  },

  async logInventoryMovement(movement: Partial<InventoryMovement>): Promise<InventoryMovement | null> {
    if (!supabase) return null;
    const dbPayload = {
      id: movement.id || `mov_${Date.now()}`,
      type: movement.type,
      product_id: movement.productId,
      product_name: movement.productName,
      sku: movement.sku,
      batch_number: movement.batchNumber,
      cases: movement.cases || 0,
      loose_pcs: movement.loosePcs || 0,
      reference_id: movement.referenceId || '',
      date: movement.date || new Date().toISOString(),
      performed_by: movement.performedBy || 'Admin',
      reason: movement.reason
    };
    const { data, error } = await supabase.from('inventory_movements').insert(dbPayload).select().single();
    if (error) throw error;
    return mapDbMovement(data);
  }
};
