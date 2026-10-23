export type UserRole = 'admin' | 'salesman' | 'delivery' | 'retailer' | 'accounts';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status?: 'active' | 'inactive';
  avatarUrl?: string;
  salesmanId?: string;
  retailerId?: string;
  deliveryId?: string;
  // Business Profile & Location fields
  businessName?: string; // Company / Agency / Shop name
  businessLogoUrl?: string; // Shop or Company Logo
  address?: string; // Full physical address / warehouse / shop address
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  panNumber?: string;
  locationCoordinates?: {
    lat?: number;
    lng?: number;
    addressText?: string;
  };
  // Retailer Verification (kyc / onboarding)
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationRemarks?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  shopPhotoUrl?: string;
  // UPI Connect fields
  upiVpa?: string; // Linked UPI Virtual Payment Address (e.g. store@upi)
  upiPayeeName?: string; // Payee Name displayed on UPI
  upiBankName?: string; // Linked settlement bank name
  upiStatus?: 'active' | 'unverified';
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

export interface ProductPackingOption {
  id: string;
  name: string; // e.g. "Pack of 10", "Pack of 40", "Case of 60"
  pieces: number; // e.g. 10, 40, 60
  sellingPrice: number; // ₹ wholesale price for this pack (e.g. ₹80, ₹300)
  mrp: number; // ₹ MRP for this pack (e.g. ₹100, ₹400)
  unitPrice?: number; // ₹ sellingPrice / pieces (e.g. ₹8.00, ₹7.50)
  unitMrp?: number; // ₹ mrp / pieces (e.g. ₹10.00)
  marginPercentage: number; // e.g. 20, 25
  isDefault?: boolean;
}

export interface CartItem {
  product: Product;
  cases: number;
  loosePcs: number;
  selectedPackingId?: string;
  selectedPacking?: ProductPackingOption;
  packCount?: number;
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
  packingOptions?: ProductPackingOption[];
  packSize?: string;
  unit?: string;
  manufacturer?: string;
  subCategory?: string;
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
  currentBalance?: number; // ₹ (alias for currentOutstanding)
  creditDaysAllowed: number;
  lat?: number;
  lng?: number;
  status: 'active' | 'overdue' | 'blocked' | 'inactive';
  isActive?: boolean;
  createdAt?: string;
  creditEnabled?: boolean; // Admin-controlled toggle for Credit/Udhar access
  // Profile, Logo and KYC verification fields
  logoUrl?: string; // Store front or retailer logo
  photoUrl?: string; // Owner photo
  shopPhotoUrl?: string; // Shop front photo captured during onboarding
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationRemarks?: string;
  verificationReasonCode?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  submittedAt?: string; // When retailer application was submitted
  verificationTimeline?: VerificationTimelineEvent[];
  // UPI Connect fields
  upiVpa?: string;
  upiPayeeName?: string;
  upiBankName?: string;
  upiStatus?: 'active' | 'unverified';
}

export interface VerificationTimelineEvent {
  id: string;
  timestamp: string; // ISO String
  type: 'submitted' | 'document_uploaded' | 'beat_mapped' | 'reviewed' | 'approved' | 'rejected' | 'comment_added';
  actorName: string;
  actorRole: string;
  title: string;
  description: string;
  reasonCode?: string;
  metadata?: Record<string, any>;
}

export interface VerificationReasonOption {
  code: string;
  label: string;
  description: string;
  category: 'approval' | 'rejection';
  defaultCreditLimit?: number;
  isCreditRecommended?: boolean;
}

export interface Salesman {
  id: string;
  employeeCode: string;
  name: string;
  phone: string;
  email: string;
  assignedBeats: string[];
  dailyTargetAmount?: number; // ₹
  monthlyTargetAmount?: number; // ₹
  currentMonthAchieved?: number; // ₹
  commissionPercentage: number;
  todayOrdersCount?: number;
  todaySalesAmount?: number;
  status: 'active' | 'on_leave' | 'inactive';
  targetAssigned?: boolean;
  effectiveStartDate?: string;
  targetPeriod?: 'daily' | 'monthly' | 'weekly';
  userId?: string;
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
  packingName?: string;
  packCount?: number;
  marginPercentage?: number;
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
  deliveryCharge?: number; // ₹ Delivery charges (or 0 if free)
  mdrCharge?: number; // ₹ Govt MDR charges (e.g. 0.04% for digital payment)
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
  remarks?: string;
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
  targetBrand?: string; // Brand to filter when banner or Buy Now is clicked
  imageUrl: string;
  bgGradient: string;
  accentColor?: string;
  isActive: boolean;
  hideTextOverlay?: boolean; // When true, hides title, subtitle, badges so only the pure graphic banner shows
  posterFit?: 'cover' | 'fill' | 'contain'; // Display style for poster: 'cover' fills entire space, 'fill' stretches 100%
  showBuyNow?: boolean; // Whether to show Buy Now button on the banner
  buyNowText?: string; // Custom label for Buy Now button, e.g. "Buy Now"
}

export type NavTab = 
  | 'home'
  | 'dashboard' 
  | 'orders' 
  | 'products' 
  | 'inventory' 
  | 'retailers' 
  | 'salesmen' 
  | 'deliveries' 
  | 'payments'
  | 'banners'
  | 'verifications'
  | 'reports'
  | 'catalogue'
  | 'staff'
  | 'idcard';

export type ReportType = 
  | 'sales' 
  | 'purchase' 
  | 'customer_ledger' 
  | 'outstanding' 
  | 'payment_collection' 
  | 'product_sales' 
  | 'customer_sales' 
  | 'brand_sales' 
  | 'category_sales' 
  | 'salesman_sales' 
  | 'delivery' 
  | 'returns' 
  | 'gst' 
  | 'profit_margin'
  | 'visits';

export type ReportPeriod = 
  | 'today' 
  | 'yesterday' 
  | 'this_week' 
  | 'this_month' 
  | 'previous_month' 
  | 'this_quarter' 
  | 'this_year' 
  | 'financial_year' 
  | 'custom';

export type GstSubReportType = 
  | 'sales_register' 
  | 'b2b' 
  | 'b2c' 
  | 'invoice_report' 
  | 'taxable_summary' 
  | 'hsn_summary' 
  | 'rate_summary' 
  | 'cgst_summary' 
  | 'sgst_summary' 
  | 'igst_summary' 
  | 'credit_note';

export interface ReportFilterOptions {
  period: ReportPeriod;
  fromDate?: string;
  toDate?: string;
  retailerId?: string;
  salesmanId?: string;
  deliveryPersonId?: string;
  productId?: string;
  brand?: string;
  category?: string;
  paymentStatus?: 'all' | 'unpaid' | 'partial' | 'paid';
  orderStatus?: 'all' | OrderStatus;
  gstFilter?: 'all' | 'gst' | 'non_gst';
  paymentMode?: 'all' | 'cash' | 'upi' | 'cheque' | 'bank_transfer' | 'credit' | 'qr';
  beatName?: string;
  onlyOverdue?: boolean;
  gstSubReport?: GstSubReportType;
  searchTerm?: string;
}

export type NotificationEventType = 
  | 'retailer_registered'
  | 'kyc_submitted'
  | 'verification_pending'
  | 'approval_required'
  | 'retailer_approved'
  | 'retailer_rejected'
  | 'order_created'
  | 'order'
  | 'payment_submitted'
  | 'payment'
  | 'inventory'
  | 'scheme'
  | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: NotificationEventType;
  isRead: boolean;
  actionTab?: NavTab;
  retailerId?: string;
  retailerName?: string;
  orderId?: string;
  paymentId?: string;
  recipientRole?: UserRole;
  recipientUserId?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface AdminDeviceToken {
  id: string;
  userId: string;
  role: UserRole;
  fcmToken: string;
  platform: 'android' | 'web';
  deviceInfo?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Beat-Wise Salesman Visit & Check-In Types
// ==========================================
export type VisitStatus = 'pending' | 'checked_in' | 'completed' | 'rejected';

export interface SalesmanVisit {
  id: string;
  salesmanId: string;
  salesmanName: string;
  retailerId: string;
  retailerName: string;
  beatName: string;
  status: VisitStatus;
  checkInTime: string; // ISO timestamp
  checkOutTime?: string; // ISO timestamp
  checkInLat?: number;
  checkInLng?: number;
  checkInAccuracy?: number; // Metres
  retailerLat?: number;
  retailerLng?: number;
  distanceMetres?: number;
  allowedRadiusMetres?: number; // Default: 100m
  isMockLocation?: boolean;
  photoUrl?: string; // Live captured store front photo URL
  notes?: string;
  orderCreatedId?: string;
  orderTotalAmount?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitCheckInPayload {
  salesmanId?: string;
  retailerId: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  isMockLocation?: boolean;
  photoUrl: string;
  allowedRadiusMetres?: number;
  notes?: string;
}

export interface VisitCheckOutPayload {
  notes?: string;
  orderCreatedId?: string;
  orderTotalAmount?: number;
}

// ==========================================
// Salesman Tasks & Target Management Types
// ==========================================
export type TaskType = 'visit' | 'target' | 'order_booking' | 'collection' | 'follow_up' | 'other' | 'general';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'closed';
export type TaskPriority = 'normal' | 'low' | 'medium' | 'high' | 'urgent';

export interface SalesmanTask {
  id: string;
  salesmanId: string;
  salesmanName?: string;
  title: string;
  description?: string;
  taskType: TaskType;
  retailerId?: string;
  retailerName?: string;
  retailerPhone?: string;
  retailerAddress?: string;
  beatName?: string;
  targetAmount?: number; // Target in ₹
  targetQuantity?: number; // Target Quantity in cases / pcs
  startDate?: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  followUpDate?: string; // YYYY-MM-DD
  status: TaskStatus;
  priority: TaskPriority;
  assignedByRole?: string;
  assignedByName?: string;
  adminNotes?: string;
  completedAt?: string;
  completionNotes?: string;
  actualSalesBooked?: number;
  actualSalesDelivered?: number;
  actualPaymentsCollected?: number;
  createdAt: string;
  updatedAt: string;
}

export type TargetPeriod = 'daily' | 'weekly' | 'monthly';

export interface SalesTarget {
  id: string;
  salesmanId: string;
  period: TargetPeriod;
  targetAmount: number; // ₹
  effectiveStartDate: string; // YYYY-MM-DD
  effectiveEndDate?: string;
  assignedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Staff Management, Attendance & Payroll Types
// ==========================================

export type SalaryType = 'monthly_fixed' | 'daily_wage' | 'attendance_based';
export type EmploymentStatus = 'active' | 'inactive' | 'on_leave';
export type AttendanceStatus = 
  | 'present' 
  | 'absent' 
  | 'half_day' 
  | 'paid_leave' 
  | 'unpaid_leave' 
  | 'weekly_off';

export type PayrollStatus = 'draft' | 'calculated' | 'approved' | 'partially_paid' | 'paid';

export interface StaffAllowance {
  id: string;
  title: string;
  amount: number;
}

export interface StaffDeduction {
  id: string;
  title: string;
  amount: number;
}

export interface StaffEmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface StaffMember {
  id: string;
  employeeCode: string; // e.g. "EMP-AA-1001"
  name: string;
  phone: string;
  email: string;
  role: string; // 'salesman' | 'delivery' | 'accounts' | 'admin' | 'manager'
  designation: string; // e.g. "Senior Sales Executive", "Delivery Pilot", "Accounts Executive"
  photoUrl?: string;
  assignedBeats?: string[];
  joiningDate: string; // YYYY-MM-DD
  employmentStatus: EmploymentStatus;
  salaryType: SalaryType;
  baseSalary: number; // monthly fixed, daily wage, or attendance rate (₹)
  allowances?: StaffAllowance[];
  deductions?: StaffDeduction[];
  weeklyOffDay: number; // 0 = Sunday, 1 = Monday, etc.
  monthlyLeaveQuota: number; // e.g. 2 days approved paid leave per month
  emergencyContact?: StaffEmergencyContact;
  address?: string;
  userId?: string; // Link to auth User
  salesmanId?: string; // Link to Salesman entity if role === 'salesman'
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceCorrectionEntry {
  correctedBy: string;
  correctedAt: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
}

export type AttendanceApprovalStatus = 'pending' | 'approved' | 'rejected' | 'correction_required';

export interface AttendanceApprovalEvent {
  action: 'submitted' | 'approved' | 'rejected' | 'correction_requested';
  actorId: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  reason?: string;
  previousApprovalStatus?: AttendanceApprovalStatus;
  newApprovalStatus?: AttendanceApprovalStatus;
}

export interface StaffAttendance {
  id: string;
  staffId: string;
  employeeCode: string;
  staffName: string;
  role: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  approvalStatus?: AttendanceApprovalStatus; // 'pending' | 'approved' | 'rejected' | 'correction_required'
  checkInTime?: string; // HH:mm or ISO
  checkOutTime?: string; // HH:mm or ISO
  checkInMethod?: 'admin_marked' | 'self_check_in' | 'gps_verified';
  workingHours?: number;
  remarks?: string;
  approvedBy?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  correctionReason?: string;
  approvalAuditTrail?: AttendanceApprovalEvent[];
  correctionHistory?: AttendanceCorrectionEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPaymentRecord {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'upi' | 'cash' | 'cheque';
  referenceNumber?: string;
  paidByName: string;
  notes?: string;
  createdAt: string;
}

export interface StaffPayroll {
  id: string;
  staffId: string;
  employeeCode: string;
  staffName: string;
  role: string;
  period: string; // YYYY-MM (e.g. "2026-10")
  salaryType: SalaryType;
  baseSalary: number;
  totalDaysInMonth: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  weeklyOffs: number;
  payableDays: number; // present + paidLeaves + weeklyOffs + (0.5 * halfDays)
  grossCalculated: number;
  allowancesTotal: number;
  allowanceBreakdown?: StaffAllowance[];
  deductionsTotal: number;
  deductionBreakdown?: StaffDeduction[];
  advancesDeducted: number;
  netPayable: number;
  amountPaid: number;
  remainingDue: number;
  status: PayrollStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  payments?: PayrollPaymentRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffSalaryPaymentPayload {
  payrollId: string;
  staffId: string;
  period: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'upi' | 'cash' | 'cheque';
  referenceNumber?: string;
  notes?: string;
  paidByName?: string;
}



