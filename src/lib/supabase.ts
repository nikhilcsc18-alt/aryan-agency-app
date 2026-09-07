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
  UserRole,
  Category,
  Brand
} from '../types';

// Read Supabase environment credentials from client or server environment with multiple alias fallbacks
const env = (import.meta as any).env || {};

const rawUrl = 
  env.VITE_SUPABASE_URL || 
  env.VITE_SUPABASE_PROJECT_URL || 
  env.SUPABASE_URL || 
  '';

const rawKey = 
  env.VITE_SUPABASE_ANON_KEY || 
  env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  env.SUPABASE_ANON_KEY || 
  env.SUPABASE_PUBLISHABLE_KEY || 
  env.SUPABASE_KEY || 
  '';

export const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
export const supabaseAnonKey = typeof rawKey === 'string' ? rawKey.trim() : '';

export interface SupabaseConfigStatus {
  isValid: boolean;
  isConfigured: boolean;
  url: string;
  projectRef: string;
  keyType: 'publishable' | 'anon_jwt' | 'invalid' | 'missing';
  error?: string;
  hint?: string;
}

export function validateSupabaseCredentials(url: string, key: string): SupabaseConfigStatus {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  // 1. URL Check
  if (!cleanUrl) {
    return {
      isValid: false,
      isConfigured: false,
      url: '',
      projectRef: '',
      keyType: cleanKey ? (cleanKey.startsWith('sb_publishable_') ? 'publishable' : 'invalid') : 'missing',
      error: 'Supabase Project URL is missing.',
      hint: 'Please provide VITE_SUPABASE_URL in your environment settings (e.g., https://your-project-id.supabase.co).'
    };
  }

  if (cleanUrl.includes('placeholder') || cleanUrl.includes('your-project-id')) {
    return {
      isValid: false,
      isConfigured: false,
      url: cleanUrl,
      projectRef: '',
      keyType: 'invalid',
      error: 'Supabase Project URL contains a placeholder value.',
      hint: 'Please replace placeholder with your actual Supabase project URL.'
    };
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return {
      isValid: false,
      isConfigured: false,
      url: cleanUrl,
      projectRef: '',
      keyType: 'invalid',
      error: 'Supabase Project URL must begin with https://',
      hint: 'Ensure your URL matches format: https://<project-ref>.supabase.co'
    };
  }

  let projectRef = '';
  try {
    const parsed = new URL(cleanUrl);
    projectRef = parsed.hostname.split('.')[0] || '';
  } catch {
    projectRef = '';
  }

  // 2. Key Check
  if (!cleanKey) {
    return {
      isValid: false,
      isConfigured: false,
      url: cleanUrl,
      projectRef,
      keyType: 'missing',
      error: 'Supabase API key is missing.',
      hint: 'Please set VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in your environment settings.'
    };
  }

  if (cleanKey.includes('placeholder') || cleanKey.includes('your-key-here') || cleanKey === 'sb_publishable_your_key_here') {
    return {
      isValid: false,
      isConfigured: false,
      url: cleanUrl,
      projectRef,
      keyType: 'invalid',
      error: 'Supabase API Key contains a placeholder value.',
      hint: 'Copy your Publishable Key (sb_publishable_...) from Supabase Dashboard > Project Settings > API Keys.'
    };
  }

  // Detect accidental Google or Gemini API key
  if (cleanKey.startsWith('AIza') || cleanKey.startsWith('AQ.') || cleanKey.toUpperCase().includes('GEMINI')) {
    return {
      isValid: false,
      isConfigured: false,
      url: cleanUrl,
      projectRef,
      keyType: 'invalid',
      error: 'The provided API key is a Google/Gemini API key, NOT a Supabase Publishable Key.',
      hint: 'Do not use your Gemini key for Supabase. Go to Supabase Dashboard > Project Settings > API Keys and copy the Publishable Key.'
    };
  }

  const isPublishable = cleanKey.startsWith('sb_publishable_');
  const isAnonJwt = cleanKey.startsWith('eyJ') && cleanKey.split('.').length === 3;

  if (!isPublishable && !isAnonJwt) {
    return {
      isValid: false,
      isConfigured: false,
      url: cleanUrl,
      projectRef,
      keyType: 'invalid',
      error: 'Invalid Supabase API key format.',
      hint: 'Supabase keys should start with "sb_publishable_" (Publishable Key) or "eyJ" (Anon JWT Key).'
    };
  }

  return {
    isValid: true,
    isConfigured: true,
    url: cleanUrl,
    projectRef,
    keyType: isPublishable ? 'publishable' : 'anon_jwt'
  };
}

export const supabaseConfigStatus = validateSupabaseCredentials(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = supabaseConfigStatus.isValid;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
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
  const sku = row.sku || row.product_sku || row.productSku || row.code || row.item_code || row.sku_code || '';
  return {
    id: row.id,
    sku,
    barcode: row.barcode || row.barcode_number || '',
    name: row.name || row.product_name || '',
    brand: row.brand || row.brand_name || '',
    category: row.category || row.category_name || 'Biscuits & Bakery',
    hsnCode: row.hsn_code || row.hsnCode || '',
    gstRate: Number(row.gst_rate ?? row.gstRate ?? 18),
    piecesPerCase: Number(row.pieces_per_case ?? row.piecesPerCase ?? 24),
    mrpPiece: Number(row.mrp_piece ?? row.mrpPiece ?? 0),
    wholesalePricePiece: Number(row.wholesale_price_piece ?? row.wholesalePricePiece ?? 0),
    casePrice: Number(row.case_price ?? row.casePrice ?? 0),
    currentStockCases: Number(row.current_stock_cases ?? row.currentStockCases ?? 0),
    currentStockLoosePcs: Number(row.current_stock_loose_pcs ?? row.currentStockLoosePcs ?? 0),
    reorderLevelCases: Number(row.reorder_level_cases ?? row.reorderLevelCases ?? 10),
    imageUrl: row.image_url || row.imageUrl || '',
    description: row.description || '',
    batches: Array.isArray(row.batches) ? row.batches : [],
    activeScheme: row.active_scheme || row.activeScheme || undefined
  };
}

function productToDb(p: Partial<Product> | any): any {
  const out: any = {};
  if (p.id !== undefined) out.id = p.id;
  const skuVal = p.sku ?? p.product_sku ?? p.productSku;
  if (skuVal !== undefined) {
    out.sku = skuVal;
  }
  if (p.barcode !== undefined || p.barcode_number !== undefined) out.barcode = p.barcode ?? p.barcode_number;
  if (p.name !== undefined) out.name = p.name;
  if (p.brand !== undefined) out.brand = p.brand;
  if (p.category !== undefined) out.category = p.category;
  if (p.hsnCode !== undefined || p.hsn_code !== undefined) out.hsn_code = p.hsnCode ?? p.hsn_code;
  if (p.gstRate !== undefined || p.gst_rate !== undefined) out.gst_rate = p.gstRate ?? p.gst_rate;
  if (p.piecesPerCase !== undefined || p.pieces_per_case !== undefined) out.pieces_per_case = p.piecesPerCase ?? p.pieces_per_case;
  if (p.mrpPiece !== undefined || p.mrp_piece !== undefined) out.mrp_piece = p.mrpPiece ?? p.mrp_piece;
  if (p.wholesalePricePiece !== undefined || p.wholesale_price_piece !== undefined) out.wholesale_price_piece = p.wholesalePricePiece ?? p.wholesale_price_piece;
  if (p.casePrice !== undefined || p.case_price !== undefined) out.case_price = p.casePrice ?? p.case_price;
  if (p.currentStockCases !== undefined || p.current_stock_cases !== undefined) out.current_stock_cases = p.currentStockCases ?? p.current_stock_cases;
  if (p.currentStockLoosePcs !== undefined || p.current_stock_loose_pcs !== undefined) out.current_stock_loose_pcs = p.currentStockLoosePcs ?? p.current_stock_loose_pcs;
  if (p.reorderLevelCases !== undefined || p.reorder_level_cases !== undefined) out.reorder_level_cases = p.reorderLevelCases ?? p.reorder_level_cases;
  if (p.imageUrl !== undefined || p.image_url !== undefined) out.image_url = p.imageUrl ?? p.image_url;
  if (p.description !== undefined) out.description = p.description;
  if (p.batches !== undefined) out.batches = p.batches;
  if (p.activeScheme !== undefined || p.active_scheme !== undefined) out.active_scheme = p.activeScheme ?? p.active_scheme;
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
  const safeId = (row.id && String(row.id).trim() && row.id !== 'null' && row.id !== 'undefined')
    ? String(row.id).trim()
    : `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const safeOrderNumber = row.order_number || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    id: safeId,
    orderNumber: safeOrderNumber,
    retailerId: row.retailer_id,
    retailerName: row.retailer_name,
    retailerPhone: row.retailer_phone || '',
    retailerAddress: row.retailer_address || '',
    retailerGstin: row.retailer_gstin,
    beatName: row.beat_name,
    salesmanId: row.salesman_id,
    salesmanName: row.salesman_name,
    orderDate: row.order_date || new Date().toISOString(),
    expectedDeliveryDate: row.expected_delivery_date || new Date().toISOString().split('T')[0],
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
    status: row.status || 'booked',
    paymentStatus: row.payment_status || 'unpaid',
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

function orderToDb(o: any): any {
  const out: any = {};
  const safeId = (o.id && String(o.id).trim() && o.id !== 'null' && o.id !== 'undefined')
    ? String(o.id).trim()
    : `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  out.id = safeId;
  out.order_number = o.orderNumber || o.order_number || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  
  if (o.retailerId !== undefined || o.retailer_id !== undefined) {
    out.retailer_id = o.retailerId || o.retailer_id;
  }
  if (o.retailerName !== undefined || o.retailer_name !== undefined) {
    out.retailer_name = o.retailerName || o.retailer_name;
  }
  if (o.retailerPhone !== undefined || o.retailer_phone !== undefined) {
    out.retailer_phone = o.retailerPhone || o.retailer_phone || '';
  }
  if (o.retailerAddress !== undefined || o.retailer_address !== undefined) {
    out.retailer_address = o.retailerAddress || o.retailer_address || '';
  }
  if (o.retailerGstin !== undefined || o.retailer_gstin !== undefined) {
    out.retailer_gstin = o.retailerGstin || o.retailer_gstin;
  }
  if (o.beatName !== undefined || o.beat_name !== undefined) {
    out.beat_name = o.beatName || o.beat_name;
  }
  if (o.salesmanId !== undefined || o.salesman_id !== undefined) {
    out.salesman_id = o.salesmanId || o.salesman_id;
  }
  if (o.salesmanName !== undefined || o.salesman_name !== undefined) {
    out.salesman_name = o.salesmanName || o.salesman_name;
  }

  out.order_date = o.orderDate || o.order_date || new Date().toISOString();
  out.expected_delivery_date = o.expectedDeliveryDate || o.expected_delivery_date || new Date().toISOString().split('T')[0];

  const items = Array.isArray(o.items) ? o.items : [];
  out.items = items;

  // Derive financial numbers with safe calculations and aliases
  let rawSubtotal = o.subtotal ?? o.subtotalGross ?? o.grossSubtotal;
  let rawDiscount = o.totalDiscount ?? o.total_discount ?? 0;
  let rawTaxable = o.totalTaxable ?? o.total_taxable ?? o.taxableAmount;
  let rawTax = o.totalTax ?? o.total_tax ?? o.totalGst;
  let rawGrandTotal = o.grandTotal ?? o.grand_total ?? o.totalAmount ?? o.finalBillAmount;
  let rawAmountPaid = o.amountPaid ?? o.amount_paid ?? 0;
  let rawOutstanding = o.outstandingAmount ?? o.outstanding_amount ?? o.balanceAmount;

  if (rawSubtotal === undefined || rawGrandTotal === undefined || rawTaxable === undefined) {
    let calcGross = 0;
    let calcDisc = 0;
    let calcTaxable = 0;
    let calcTax = 0;
    let calcTotal = 0;

    for (const item of items) {
      const gross = Number(item.grossAmount || (item.cases * 500) || 0);
      const disc = Number(item.discountAmount || 0);
      const taxable = Number(item.taxableAmount || (gross - disc));
      const tax = Number(item.totalTax || item.taxAmount || (taxable * (item.gstRate || 18) / 100));
      const lineTotal = Number(item.totalAmount || (taxable + tax));
      calcGross += gross;
      calcDisc += disc;
      calcTaxable += taxable;
      calcTax += tax;
      calcTotal += lineTotal;
    }

    if (rawSubtotal === undefined) rawSubtotal = calcGross || calcTotal || 0;
    if (rawDiscount === undefined) rawDiscount = calcDisc || 0;
    if (rawTaxable === undefined) rawTaxable = calcTaxable || rawSubtotal;
    if (rawTax === undefined) rawTax = calcTax || 0;
    if (rawGrandTotal === undefined) rawGrandTotal = calcTotal || rawSubtotal;
  }

  out.subtotal = Number(rawSubtotal || 0);
  out.total_discount = Number(rawDiscount || 0);
  out.total_taxable = Number(rawTaxable || 0);
  const totalTaxNum = Number(rawTax || 0);
  out.total_tax = totalTaxNum;
  out.total_cgst = Number(o.totalCgst ?? o.total_cgst ?? o.cgstTotal ?? +(totalTaxNum / 2).toFixed(2));
  out.total_sgst = Number(o.totalSgst ?? o.total_sgst ?? o.sgstTotal ?? +(totalTaxNum / 2).toFixed(2));
  out.round_off = Number(o.roundOff ?? o.round_off ?? 0);
  out.grand_total = Number(rawGrandTotal || 0);
  out.amount_paid = Number(rawAmountPaid || 0);
  out.outstanding_amount = Number(
    rawOutstanding !== undefined ? rawOutstanding : Math.max(0, out.grand_total - out.amount_paid)
  );

  out.status = o.status || 'booked';
  out.payment_status = o.paymentStatus || o.payment_status || (out.amount_paid >= out.grand_total ? 'paid' : out.amount_paid > 0 ? 'partial' : 'unpaid');
  if (o.deliveryRunId !== undefined || o.delivery_run_id !== undefined) out.delivery_run_id = o.deliveryRunId || o.delivery_run_id;
  if (o.driverName !== undefined || o.driver_name !== undefined) out.driver_name = o.driverName || o.driver_name;
  if (o.vehicleNumber !== undefined || o.vehicle_number !== undefined) out.vehicle_number = o.vehicleNumber || o.vehicle_number;
  if (o.podReceiverName !== undefined || o.pod_receiver_name !== undefined) out.pod_receiver_name = o.podReceiverName || o.pod_receiver_name;
  if (o.podSignature !== undefined || o.pod_signature !== undefined) out.pod_signature = o.podSignature || o.pod_signature;
  if (o.podNotes !== undefined || o.pod_notes !== undefined) out.pod_notes = o.podNotes || o.pod_notes;
  if (o.notes !== undefined) out.notes = o.notes;
  if (o.isInterstate !== undefined || o.is_interstate !== undefined) {
    out.is_interstate = Boolean(o.isInterstate ?? o.is_interstate);
  }
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
    const configStatus = validateSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    const missing: string[] = [];
    if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

    if (!isSupabaseConfigured || !supabase) {
      return {
        configured: false,
        connected: false,
        message: configStatus.error || (missing.length > 0 
          ? `Missing Supabase environment variables: ${missing.join(', ')}` 
          : 'Supabase credentials contain invalid or placeholder values'),
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
    let gatewayErrorMessage: string | null = null;

    for (const tbl of tablesToTest) {
      try {
        const { count, error } = await supabase.from(tbl).select('*', { count: 'exact', head: true });
        if (error) {
          if (error.message?.includes('Unregistered API key') || (error as any)?.code === '401' || (error as any)?.status === 401) {
            gatewayErrorMessage = `Supabase API Gateway Error: "Unregistered API key". The Publishable Key is not registered for project '${configStatus.projectRef}'. Please verify the Publishable Key in Supabase Dashboard > Project Settings > API Keys.`;
          }
          results.push({ table: tbl, count: 0, status: 'error' });
        } else {
          anyOk = true;
          results.push({ table: tbl, count: count || 0, status: (count && count > 0) ? 'ok' : 'empty' });
        }
      } catch (err: any) {
        if (err?.message?.includes('Unregistered API key')) {
          gatewayErrorMessage = `Supabase API Gateway Error: "Unregistered API key". The Publishable Key is not registered for project '${configStatus.projectRef}'.`;
        }
        results.push({ table: tbl, count: 0, status: 'error' });
      }
    }

    return {
      configured: true,
      connected: anyOk,
      message: gatewayErrorMessage || (anyOk 
        ? 'Successfully connected to Supabase PostgreSQL database' 
        : 'Could not connect to Supabase tables. Please execute the supabase_schema.sql script in your Supabase SQL editor.'),
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

  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      console.error('[Supabase updateUserRole error]:', error);
      throw new Error(`Database error updating user role: ${error.message || 'Operation failed'}`);
    }
    return true;
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

  async signUpWithEmail(email: string, password: string, profile: { name: string; phone: string; role?: string; salesmanId?: string; retailerId?: string; deliveryId?: string }) {
    if (!supabase) throw new Error('Supabase client is not configured');
    
    // Security Rule: Public self-registrations MUST NOT be allowed to choose or receive privileged internal roles
    // (admin, salesman, delivery, accounts). All public signups are created with the safe role 'retailer' (Retail Store Partner).
    // Internal operational roles can only be granted by an authenticated Administrator in the management interface.
    const safeRole: UserRole = 'retailer';

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: profile.name,
          phone: profile.phone,
          role: safeRole
        }
      }
    });

    if (authError) throw authError;

    // 2. Create or sync profile record in users table with safe role
    const userId = authData.user?.id || `usr_${Date.now()}`;
    const userProfile: User = {
      id: userId,
      name: profile.name,
      email: email.trim().toLowerCase(),
      phone: profile.phone,
      role: safeRole,
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
    if (!supabase) {
      console.error('[Supabase Auth] Supabase client is not configured.');
      throw new Error('Supabase client is not configured. Please check your Supabase URL and API Key.');
    }
    
    const cleanEmail = email.trim().toLowerCase();
    console.log('[Supabase Auth] Calling signInWithPassword for:', cleanEmail);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (error) {
      console.error('[Supabase Auth Error]:', error);
      throw error;
    }

    console.log('[Supabase Auth] signInWithPassword succeeded. User ID:', data?.user?.id);

    // Find profile from database or fallback to user metadata
    let profile = await this.getUserByEmail(cleanEmail).catch(e => {
      console.warn('[Supabase Auth] Could not fetch profile from DB:', e);
      return null;
    });

    if (!profile && data.user) {
      // Safe fallback: never default unknown users to 'admin'
      const assignedRole = (data.user.user_metadata?.role as any) || 'retailer';
      profile = {
        id: data.user.id,
        name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
        email: data.user.email || cleanEmail,
        phone: data.user.user_metadata?.phone || '+91 98000 00000',
        role: assignedRole
      };
      try {
        await this.saveUser(profile);
      } catch (err) {
        console.warn('[Supabase Auth] Failed to auto-save profile on sign in:', err);
      }
    }

    return { session: data.session, user: profile || null, authUser: data.user };
  },

  async resetPassword(email: string) {
    if (!supabase) {
      throw new Error('Supabase client is not configured.');
    }
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    });
    if (error) throw error;
    return data;
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

  async saveProduct(product: Partial<Product> | any): Promise<Product | null> {
    if (!supabase) return null;
    const dbPayload = productToDb(product);
    let { data, error } = await supabase.from('products').upsert(dbPayload).select().single();
    
    // If column 'sku' doesn't exist but 'product_sku' does (or vice-versa), retry with alternate column name
    if (error && error.message && (error.message.includes('sku') || error.message.includes('column'))) {
      const fallbackPayload = { ...dbPayload };
      if ('sku' in fallbackPayload) {
        fallbackPayload.product_sku = fallbackPayload.sku;
        delete fallbackPayload.sku;
      } else if ('product_sku' in fallbackPayload) {
        fallbackPayload.sku = fallbackPayload.product_sku;
        delete fallbackPayload.product_sku;
      }
      const retryRes = await supabase.from('products').upsert(fallbackPayload).select().single();
      if (!retryRes.error && retryRes.data) {
        data = retryRes.data;
        error = null;
      }
    }

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
    if (!supabase) throw new Error('Supabase client is not configured.');

    // 1. Validate required fields for FMCG business workflow
    const storeName = retailer.storeName?.trim();
    if (!storeName) {
      throw new Error('Retail Outlet / Store Name is required.');
    }
    const ownerName = retailer.ownerName?.trim();
    if (!ownerName) {
      throw new Error('Owner / Proprietor Name is required.');
    }
    const rawPhone = retailer.phone?.trim() || '';
    const digitsOnlyPhone = rawPhone.replace(/\D/g, '');
    if (!digitsOnlyPhone || digitsOnlyPhone.length < 10) {
      throw new Error('A valid 10-digit mobile phone number is required for retailer order and payment tracking.');
    }
    const address = retailer.address?.trim();
    if (!address) {
      throw new Error('Shop address is required for delivery routing.');
    }

    const area = retailer.area?.trim() || 'Indiranagar';
    const beatName = retailer.beatName?.trim() || 'Indiranagar Retail Beat';
    const gstin = retailer.gstin?.trim().toUpperCase() || '';
    const panNumber = retailer.panNumber?.trim().toUpperCase() || '';

    // 2. Prevent duplicate retailer creation by checking existing records in Supabase
    const { data: existingRetailers, error: fetchErr } = await supabase
      .from('retailers')
      .select('id, store_name, phone, gstin');

    if (!fetchErr && Array.isArray(existingRetailers)) {
      // Check phone number collision (matching last 10 digits to be safe across +91 prefixes)
      const targetPhoneSuffix = digitsOnlyPhone.slice(-10);
      const phoneDuplicate = existingRetailers.find(r => {
        if (retailer.id && r.id === retailer.id) return false;
        const existingDigits = (r.phone || '').replace(/\D/g, '');
        return existingDigits.endsWith(targetPhoneSuffix);
      });

      if (phoneDuplicate) {
        throw new Error(
          `A retailer outlet with phone ${rawPhone} already exists (${phoneDuplicate.store_name}). ` +
          `Please verify the phone number or edit the existing outlet.`
        );
      }

      // Check GSTIN collision if GSTIN is provided and valid (not blank)
      if (gstin && gstin.length >= 15) {
        const gstinDuplicate = existingRetailers.find(r => {
          if (retailer.id && r.id === retailer.id) return false;
          return (r.gstin || '').trim().toUpperCase() === gstin;
        });

        if (gstinDuplicate) {
          throw new Error(
            `A retailer outlet with GSTIN ${gstin} already exists (${gstinDuplicate.store_name}). ` +
            `Each GSTIN must be uniquely registered.`
          );
        }
      }
    }

    // 3. Ensure a deterministic, unique ID is assigned for new retailer records
    const id = retailer.id || `ret_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // 4. Construct complete retailer model with FMCG defaults
    const completeRetailer: Retailer = {
      id,
      storeName,
      ownerName,
      phone: rawPhone.startsWith('+91') ? rawPhone : `+91 ${rawPhone}`,
      email: retailer.email?.trim().toLowerCase() || '',
      address,
      area,
      beatName,
      gstin,
      panNumber,
      creditLimit: Number(retailer.creditLimit) >= 0 ? Number(retailer.creditLimit) : 50000,
      currentOutstanding: Number(retailer.currentOutstanding) || 0,
      creditDaysAllowed: Number(retailer.creditDaysAllowed) || 14,
      status: retailer.status || 'active',
      createdAt: retailer.createdAt || new Date().toISOString()
    };

    const dbPayload = retailerToDb(completeRetailer);
    // Explicitly guarantee ID is present in payload
    dbPayload.id = id;

    const { data, error } = await supabase
      .from('retailers')
      .upsert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error('[Supabase saveRetailer error]:', error);
      throw new Error(`Database error saving retailer: ${error.message || 'Operation failed'}`);
    }

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
    return (data || [])
      .filter(row => row && row.id && row.id !== 'null' && row.id !== 'undefined')
      .map(mapDbOrder);
  },

  async createOrder(order: Partial<Order>): Promise<Order | null> {
    if (!supabase) return null;
    const dbPayload = orderToDb(order);
    if (!dbPayload.id || dbPayload.id === 'null') {
      dbPayload.id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
    const { data, error } = await supabase.from('orders').insert(dbPayload).select().single();
    if (error) throw error;

    // Also populate normalized order_items table if items are present
    if (order.items && order.items.length > 0 && data && data.id) {
      try {
        const lineItems = order.items.map((item: any) => ({
          order_id: data.id,
          product_id: item.productId || item.product_id,
          sku: item.sku || 'SKU-GEN',
          product_name: item.productName || item.product_name || 'FMCG Item',
          brand: item.brand || 'Aryan',
          category: item.category || 'General',
          hsn_code: item.hsnCode || item.hsn_code || '1905',
          gst_rate: Number(item.gstRate || item.gst_rate || 18),
          cases: Number(item.cases || 0),
          loose_pcs: Number(item.loosePcs || item.loose_pcs || 0),
          total_pieces: Number(item.totalPieces || item.total_pieces || (item.cases * 24 + (item.loosePcs || 0))),
          unit_price: Number(item.unitPrice || item.unit_price || 0),
          gross_amount: Number(item.grossAmount || item.gross_amount || 0),
          discount_amount: Number(item.discountAmount || item.discount_amount || 0),
          taxable_amount: Number(item.taxableAmount || item.taxable_amount || 0),
          cgst_amount: Number(item.cgstAmount || item.cgst_amount || 0),
          sgst_amount: Number(item.sgstAmount || item.sgst_amount || 0),
          igst_amount: Number(item.igstAmount || item.igst_amount || 0),
          total_amount: Number(item.totalAmount || item.total_amount || 0),
          scheme_applied: item.schemeApplied || item.scheme_applied || null,
          free_pcs_awarded: Number(item.freePcsAwarded || item.free_pcs_awarded || 0)
        }));
        await supabase.from('order_items').insert(lineItems);
      } catch (itemInsertErr) {
        console.warn('[Supabase Warning] Non-fatal order_items table insertion error:', itemInsertErr);
      }
    }

    return mapDbOrder(data);
  },

  async updateOrderStatus(id: string, status: string, extra?: any): Promise<Order | null> {
    if (!supabase) return null;
    if (!id || id === 'null' || id === 'undefined') {
      console.warn('[Supabase Warning] updateOrderStatus skipped: orders.id is null or invalid');
      return null;
    }
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
    if (!id || id === 'null' || id === 'undefined') {
      console.warn('[Supabase Warning] deleteOrder skipped: orders.id is null or invalid');
      return false;
    }
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // 8. Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[] | null> {
    if (!supabase) return null;
    if (!orderId || orderId === 'null' || orderId === 'undefined') {
      return [];
    }
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
