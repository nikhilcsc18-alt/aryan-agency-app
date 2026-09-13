export type UserRole = 'admin' | 'salesman' | 'delivery' | 'retailer' | 'accounts';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  salesmanId?: string;
  retailerId?: string;
  deliveryId?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  gstRate: number;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  companyName: string;
  logoUrl?: string;
}

export type ProductCategory = 
  | 'Beverages' 
  | 'Biscuits & Bakery' 
  | 'Spices & Staples' 
  | 'Personal Care' 
  | 'Dairy & Refrigerated' 
  | 'Confectionery & Chocolates' 
  | 'Snacks & Namkeen' 
  | 'Household & Hygiene'
  | 'Home Care'
  | 'Baby Care';

export interface ProductBatch {
  batchNumber: string;
  mfgDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  stockCases: number;
  stockLoosePcs: number;
  warehouseBin?: string;
}

export interface CartItem {
  product: Product;
  cases: number;
  loosePcs: number;
}

export interface TradeScheme {
  id: string;
  title: string;
  description: string;
  minQtyCases: number;
  freeQtyPcs?: number;
  discountPercentage?: number;
  discountFlatRs?: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  brand: string;
  category: ProductCategory;
  hsnCode: string;
  gstRate: number; // e.g. 5, 12, 18
  piecesPerCase: number;
  mrpPiece: number; // ₹
  wholesalePricePiece: number; // ₹ (distributor to retailer price per piece)
  casePrice: number; // ₹ (wholesalePricePiece * piecesPerCase)
  currentStockCases: number;
  currentStockLoosePcs: number;
  reorderLevelCases: number;
  imageUrl: string;
  batches: ProductBatch[];
  activeScheme?: TradeScheme;
  description?: string;
}

export interface Retailer {
  id: string;
  storeName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  area: string;
  beatName: string;
  gstin?: string;
  panNumber?: string;
  creditLimit: number; // ₹
  currentOutstanding: number; // ₹
  creditDaysAllowed: number;
  lat?: number;
  lng?: number;
  status: 'active' | 'overdue' | 'blocked';
  createdAt: string;
  creditEnabled?: boolean; // Admin-controlled toggle for Credit/Udhar access
}

export interface Salesman {
  id: string;
  employeeCode: string;
  name: string;
  phone: string;
  email: string;
  assignedBeats: string[];
  dailyTargetAmount: number; // ₹
  monthlyTargetAmount: number; // ₹
  currentMonthAchieved: number; // ₹
  commissionPercentage: number;
  todayOrdersCount: number;
  todaySalesAmount: number;
  status: 'active' | 'on_leave' | 'inactive';
}

export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  brand: string;
  category: ProductCategory;
  hsnCode: string;
  gstRate: number;
  cases: number;
  loosePcs: number;
  totalPieces: number;
  unitPrice: number; // Price per piece (wholesale)
  grossAmount: number; // ₹
  discountAmount: number; // ₹
  taxableAmount: number; // ₹
  cgstAmount: number; // ₹
  sgstAmount: number; // ₹
  igstAmount: number; // ₹
  totalAmount: number; // ₹
  schemeApplied?: string;
  freePcsAwarded?: number;
}

export type OrderStatus = 
  | 'draft' 
  | 'booked' 
  | 'confirmed' 
  | 'packed' 
  | 'dispatched' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-2026-1001
  retailerId: string;
  retailerName: string;
  retailerPhone: string;
  retailerAddress: string;
  retailerGstin?: string;
  beatName: string;
  salesmanId?: string;
  salesmanName?: string;
  orderDate: string; // ISO String
  expectedDeliveryDate: string;
  items: OrderItem[];
  subtotal: number; // ₹
  totalDiscount: number; // ₹
  totalTaxable: number; // ₹
  totalCgst: number; // ₹
  totalSgst: number; // ₹
  totalTax: number; // ₹
  roundOff: number;
  grandTotal: number; // ₹
  amountPaid: number; // ₹
  outstandingAmount: number; // ₹
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMode?: 'cash' | 'upi' | 'credit' | 'cheque' | 'bank_transfer' | 'qr';
  deliveryRunId?: string;
  driverName?: string;
  vehicleNumber?: string;
  deliveredAt?: string;
  podSignature?: string;
  podReceiverName?: string;
  podNotes?: string;
  notes?: string;
  isInterstate?: boolean;
}

export interface DeliveryRunSheet {
  id: string;
  runNumber: string; // e.g. RUN-2026-042
  date: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  beatNames: string[];
  totalOrders: number;
  deliveredOrders: number;
  totalOrderValue: number;
  totalCashCollected: number;
  totalUpiCollected: number;
  status: 'loading' | 'out_for_delivery' | 'completed' | 'returned';
  orderIds: string[];
}

export type PaymentMode = 'upi' | 'cash' | 'cheque' | 'bank_transfer' | 'credit_note';

export interface PaymentRecord {
  id: string;
  receiptNumber: string; // e.g. RCP-2026-501
  retailerId: string;
  retailerName: string;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  paymentMode: PaymentMode;
  transactionRef?: string;
  paymentDate: string;
  collectedByRole: 'salesman' | 'delivery' | 'admin' | 'online_direct';
  collectorName: string;
  status: 'confirmed' | 'pending_clearance' | 'bounced';
  notes?: string;
}

export type Payment = PaymentRecord;

export interface DashboardMetrics {
  todaySales: number;
  todayOrdersCount: number;
  pendingDeliveriesCount: number;
  overdueRetailersCount: number;
  totalReceivables: number;
  inventoryValuation: number;
  lowStockItemsCount: number;
  monthlyTargetAchievedPct: number;
}

export interface InventoryMovement {
  id: string;
  type: 'inward' | 'outward_dispatch' | 'return_inward' | 'damage_adjustment' | 'manual_adjustment';
  productId: string;
  productName: string;
  sku: string;
  batchNumber: string;
  cases: number;
  loosePcs: number;
  referenceId?: string; // PO number or Order ID
  date: string;
  performedBy: string;
  reason?: string;
}

export interface RetailerLedgerEntry {
  id: string;
  retailerId: string;
  date: string;
  type: 'invoice' | 'payment' | 'credit_note' | 'debit_note';
  referenceNumber: string;
  description: string;
  debit: number; // increases balance (e.g. new invoice)
  credit: number; // decreases balance (e.g. payment received)
  runningBalance: number;
}

export interface PromotionalBanner {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string; // e.g. "🔥 5 + 2 FREE", "10% OFF", "NEW", "BEST OFFER"
  ctaText?: string;
  targetCategory?: string;
  imageUrl: string;
  bgGradient: string;
  accentColor?: string;
  isActive: boolean;
}

