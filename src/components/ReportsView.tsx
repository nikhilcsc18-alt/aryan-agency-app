import React, { useState, useMemo } from 'react';
import { 
  Order, 
  Retailer, 
  Salesman, 
  Product, 
  DeliveryRunSheet, 
  PaymentRecord, 
  InventoryMovement, 
  ReportType, 
  ReportPeriod, 
  GstSubReportType, 
  ReportFilterOptions 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  formatINR, 
  formatQty, 
  getDateRangeForPeriod,
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
  generatePurchaseReportData
} from '../lib/reportUtils';
import { 
  exportReportToPdf, 
  exportReportToExcel, 
  exportReportToCsv, 
  printReportPreview,
  ExportColumn 
} from '../lib/exportUtils';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  RotateCcw, 
  Search, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Store, 
  Users, 
  Truck, 
  Receipt, 
  Layers, 
  Boxes, 
  AlertCircle, 
  Percent, 
  ArrowUpDown,
  BookOpen,
  PieChart,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  retailers: Retailer[];
  products: Product[];
  salesmen: Salesman[];
  deliveries: DeliveryRunSheet[];
  payments: PaymentRecord[];
  inventoryLogs?: InventoryMovement[];
  onOpenInvoice?: (order: Order) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  retailers,
  products,
  salesmen,
  deliveries,
  payments,
  inventoryLogs = [],
  onOpenInvoice
}) => {
  const { currentRole, isAdmin, currentUser } = useAuth();

  // Active Report Type State
  const [activeReportType, setActiveReportType] = useState<ReportType>('sales');

  // Period & Date Filter State
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('this_month');
  const [customFromDate, setCustomFromDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [customToDate, setCustomToDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Advanced Filters State
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>('all');
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>('all');
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('all');
  const [selectedGstFilter, setSelectedGstFilter] = useState<'all' | 'gst' | 'non_gst'>('all');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('all');
  const [selectedBeatName, setSelectedBeatName] = useState<string>('all');
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // GST Sub-Report state
  const [gstSubReport, setGstSubReport] = useState<GstSubReportType>('sales_register');

  // Ledger Selected Retailer
  const [ledgerRetailerId, setLedgerRetailerId] = useState<string>(
    retailers.length > 0 ? retailers[0].id : ''
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filter Bar Collapsible State on Mobile
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState<boolean>(false);

  // Extract unique brands, categories, beats
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.brand) set.add(p.brand); });
    orders.forEach(o => o.items?.forEach(it => { if (it.brand) set.add(it.brand); }));
    return Array.from(set).sort();
  }, [products, orders]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [products]);

  const uniqueBeats = useMemo(() => {
    const set = new Set<string>();
    retailers.forEach(r => { if (r.beatName) set.add(r.beatName); });
    salesmen.forEach(s => s.assignedBeats?.forEach(b => set.add(b)));
    return Array.from(set).sort();
  }, [retailers, salesmen]);

  const uniqueDeliveryDrivers = useMemo(() => {
    const set = new Set<string>();
    deliveries.forEach(d => { if (d.driverName) set.add(d.driverName); });
    return Array.from(set).sort();
  }, [deliveries]);

  // Combined Filters Object
  const filterOptions: ReportFilterOptions = useMemo(() => ({
    period: selectedPeriod,
    fromDate: customFromDate,
    toDate: customToDate,
    retailerId: selectedRetailerId,
    salesmanId: selectedSalesmanId,
    deliveryPersonId: selectedDeliveryPersonId,
    productId: selectedProductId,
    brand: selectedBrand,
    category: selectedCategory,
    paymentStatus: selectedPaymentStatus,
    orderStatus: selectedOrderStatus as any,
    gstFilter: selectedGstFilter,
    paymentMode: selectedPaymentMode as any,
    beatName: selectedBeatName,
    onlyOverdue,
    gstSubReport,
    searchTerm
  }), [
    selectedPeriod,
    customFromDate,
    customToDate,
    selectedRetailerId,
    selectedSalesmanId,
    selectedDeliveryPersonId,
    selectedProductId,
    selectedBrand,
    selectedCategory,
    selectedPaymentStatus,
    selectedOrderStatus,
    selectedGstFilter,
    selectedPaymentMode,
    selectedBeatName,
    onlyOverdue,
    gstSubReport,
    searchTerm
  ]);

  const dateRange = useMemo(() => {
    return getDateRangeForPeriod(selectedPeriod, customFromDate, customToDate);
  }, [selectedPeriod, customFromDate, customToDate]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedPeriod('this_month');
    setSelectedRetailerId('all');
    setSelectedSalesmanId('all');
    setSelectedDeliveryPersonId('all');
    setSelectedProductId('all');
    setSelectedBrand('all');
    setSelectedCategory('all');
    setSelectedPaymentStatus('all');
    setSelectedOrderStatus('all');
    setSelectedGstFilter('all');
    setSelectedPaymentMode('all');
    setSelectedBeatName('all');
    setOnlyOverdue(false);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Compile active human-readable filter list for letterhead & exports
  const activeFilterLabels = useMemo(() => {
    const list: string[] = [];
    if (selectedRetailerId !== 'all') {
      const ret = retailers.find(r => r.id === selectedRetailerId);
      list.push(`Retailer: ${ret?.storeName || selectedRetailerId}`);
    }
    if (selectedSalesmanId !== 'all') {
      const sm = salesmen.find(s => s.id === selectedSalesmanId);
      list.push(`Salesman: ${sm?.name || selectedSalesmanId}`);
    }
    if (selectedBrand !== 'all') list.push(`Brand: ${selectedBrand}`);
    if (selectedCategory !== 'all') list.push(`Category: ${selectedCategory}`);
    if (selectedBeatName !== 'all') list.push(`Beat: ${selectedBeatName}`);
    if (selectedGstFilter !== 'all') list.push(`GST: ${selectedGstFilter === 'gst' ? 'Registered' : 'Unregistered'}`);
    if (selectedPaymentStatus !== 'all') list.push(`Payment: ${selectedPaymentStatus}`);
    if (onlyOverdue) list.push('Only Overdue');
    if (searchTerm) list.push(`Search: "${searchTerm}"`);
    return list;
  }, [
    selectedRetailerId,
    selectedSalesmanId,
    selectedBrand,
    selectedCategory,
    selectedBeatName,
    selectedGstFilter,
    selectedPaymentStatus,
    onlyOverdue,
    searchTerm,
    retailers,
    salesmen
  ]);

  // Compute Active Report Output
  const reportData = useMemo(() => {
    switch (activeReportType) {
      case 'sales':
        return {
          type: 'sales',
          title: 'FMCG Sales & Dispatch Register',
          ...generateSalesReportData(orders, filterOptions)
        };
      case 'customer_ledger': {
        const targetRetailer = retailers.find(r => r.id === ledgerRetailerId) || retailers[0];
        if (!targetRetailer) {
          return {
            type: 'customer_ledger',
            title: 'Customer Ledger Statement',
            retailer: null,
            openingBalance: 0,
            closingBalance: 0,
            totalDebit: 0,
            totalCredit: 0,
            transactions: []
          };
        }
        return {
          type: 'customer_ledger',
          title: `Account Ledger: ${targetRetailer.storeName}`,
          ...generateCustomerLedgerData(
            targetRetailer, 
            orders, 
            payments, 
            selectedPeriod, 
            customFromDate, 
            customToDate
          )
        };
      }
      case 'gst':
        return {
          ...generateGstReportData(orders, filterOptions)
        };
      case 'product_sales':
        return {
          type: 'product_sales',
          title: 'Product-Wise Sales & Margin Report',
          ...generateProductSalesReportData(orders, products, filterOptions)
        };
      case 'brand_sales':
        return {
          type: 'brand_sales',
          title: 'Brand-Wise Sales Performance',
          ...generateBrandSalesReportData(orders, products, filterOptions)
        };
      case 'category_sales':
        return {
          type: 'category_sales',
          title: 'Category-Wise Sales Distribution',
          ...generateCategorySalesReportData(orders, products, filterOptions)
        };
      case 'salesman_sales':
        return {
          type: 'salesman_sales',
          title: 'Sales Force & Beat Performance Report',
          ...generateSalesmanReportData(orders, payments, salesmen, retailers, filterOptions)
        };
      case 'outstanding':
        return {
          type: 'outstanding',
          title: 'Customer Credit & Outstanding Receivables',
          ...generateOutstandingReportData(retailers, orders, payments, filterOptions)
        };
      case 'payment_collection':
        return {
          type: 'payment_collection',
          title: 'Payment Collections & Daily Cash/UPI Register',
          ...generatePaymentCollectionReportData(payments, orders, retailers, filterOptions)
        };
      case 'customer_sales':
        return {
          type: 'customer_sales',
          title: 'Customer-Wise Sales Analysis',
          ...generateCustomerSalesReportData(orders, retailers, filterOptions)
        };
      case 'delivery':
        return {
          type: 'delivery',
          title: 'Delivery Run Sheets & Driver Trip Analysis',
          ...generateDeliveryReportData(deliveries, orders, filterOptions)
        };
      case 'returns':
        return {
          type: 'returns',
          title: 'Returns & Credit Note Register',
          ...generateReturnsReportData(orders, inventoryLogs, filterOptions)
        };
      case 'profit_margin':
        return {
          type: 'profit_margin',
          title: 'Profit & Gross Margin Distribution Report',
          ...generateProfitMarginReportData(orders, products, filterOptions)
        };
      case 'purchase':
        return {
          type: 'purchase',
          title: 'Warehouse Stock Inward & Purchase Register',
          ...generatePurchaseReportData(inventoryLogs, products, filterOptions)
        };
      default:
        return {
          type: 'sales',
          title: 'FMCG Sales & Dispatch Register',
          ...generateSalesReportData(orders, filterOptions)
        };
    }
  }, [
    activeReportType,
    orders,
    retailers,
    products,
    salesmen,
    deliveries,
    payments,
    inventoryLogs,
    filterOptions,
    ledgerRetailerId,
    selectedPeriod,
    customFromDate,
    customToDate
  ]);

  // Build Export Columns and Rows depending on Active Report
  const exportPayload = useMemo(() => {
    let columns: ExportColumn[] = [];
    let rows: Record<string, any>[] = [];
    let summaryCards: { label: string; value: string }[] = [];

    if (activeReportType === 'sales') {
      const data = reportData as ReturnType<typeof generateSalesReportData> & { title: string };
      columns = [
        { header: 'Date', dataKey: 'date', width: 22 },
        { header: 'Invoice No.', dataKey: 'orderNumber', width: 28 },
        { header: 'Customer', dataKey: 'customerName', width: 45 },
        { header: 'GSTIN', dataKey: 'customerGstin', width: 34 },
        { header: 'Salesman', dataKey: 'salesman', width: 30 },
        { header: 'Taxable (₹)', dataKey: 'taxableFormatted', align: 'right', width: 25 },
        { header: 'CGST (₹)', dataKey: 'cgstFormatted', align: 'right', width: 22 },
        { header: 'SGST (₹)', dataKey: 'sgstFormatted', align: 'right', width: 22 },
        { header: 'IGST (₹)', dataKey: 'igstFormatted', align: 'right', width: 22 },
        { header: 'Total (₹)', dataKey: 'totalFormatted', align: 'right', width: 26 },
        { header: 'Payment Status', dataKey: 'paymentStatus', align: 'center', width: 24 }
      ];
      rows = data.tableRows.map(r => ({
        ...r,
        taxableFormatted: formatINR(r.taxableAmount),
        cgstFormatted: formatINR(r.cgst),
        sgstFormatted: formatINR(r.sgst),
        igstFormatted: formatINR(r.igst),
        totalFormatted: formatINR(r.grandTotal),
        paymentStatus: r.paymentStatus?.toUpperCase()
      }));
      summaryCards = [
        { label: 'Total Orders', value: String(data.summary.totalOrders) },
        { label: 'Gross Sales', value: formatINR(data.summary.grossSales) },
        { label: 'Discount', value: formatINR(data.summary.discount) },
        { label: 'Taxable Value', value: formatINR(data.summary.taxableAmount) },
        { label: 'Total GST', value: formatINR(data.summary.totalGst) },
        { label: 'Net Sales', value: formatINR(data.summary.netSales) },
        { label: 'Collected', value: formatINR(data.summary.paidAmount) },
        { label: 'Outstanding', value: formatINR(data.summary.outstandingAmount) }
      ];
    } else if (activeReportType === 'customer_ledger') {
      const data = reportData as ReturnType<typeof generateCustomerLedgerData> & { title: string };
      columns = [
        { header: 'Date', dataKey: 'date', width: 24 },
        { header: 'Ref / Invoice', dataKey: 'referenceNumber', width: 32 },
        { header: 'Particulars', dataKey: 'description', width: 65 },
        { header: 'Debit (₹)', dataKey: 'debitFormatted', align: 'right', width: 25 },
        { header: 'Credit (₹)', dataKey: 'creditFormatted', align: 'right', width: 25 },
        { header: 'Balance (₹)', dataKey: 'balanceFormatted', align: 'right', width: 28 },
        { header: 'Payment Mode', dataKey: 'paymentMode', width: 28 }
      ];
      rows = data.transactions.map(t => ({
        ...t,
        debitFormatted: t.debit > 0 ? formatINR(t.debit) : '-',
        creditFormatted: t.credit > 0 ? formatINR(t.credit) : '-',
        balanceFormatted: formatINR(t.runningBalance)
      }));
      summaryCards = [
        { label: 'Opening Balance', value: formatINR(data.openingBalance) },
        { label: 'Total Debits (Sales)', value: formatINR(data.totalDebit) },
        { label: 'Total Credits (Payments)', value: formatINR(data.totalCredit) },
        { label: 'Closing Balance', value: formatINR(data.closingBalance) }
      ];
    } else if (activeReportType === 'gst') {
      const data = reportData as ReturnType<typeof generateGstReportData>;
      if (data.type === 'hsn_summary') {
        const hsnData = data as { rows: any[]; summary: any };
        columns = [
          { header: 'HSN Code', dataKey: 'hsnCode', width: 26 },
          { header: 'Description', dataKey: 'description', width: 45 },
          { header: 'Qty (Cs+Pcs)', dataKey: 'qtyFormatted', align: 'center', width: 26 },
          { header: 'Taxable (₹)', dataKey: 'taxableFormatted', align: 'right', width: 28 },
          { header: 'GST %', dataKey: 'gstRateFormatted', align: 'center', width: 18 },
          { header: 'CGST (₹)', dataKey: 'cgstFormatted', align: 'right', width: 24 },
          { header: 'SGST (₹)', dataKey: 'sgstFormatted', align: 'right', width: 24 },
          { header: 'IGST (₹)', dataKey: 'igstFormatted', align: 'right', width: 24 },
          { header: 'Total (₹)', dataKey: 'totalFormatted', align: 'right', width: 28 }
        ];
        rows = hsnData.rows.map(r => ({
          ...r,
          qtyFormatted: formatQty(r.totalCases, r.totalLoosePcs),
          taxableFormatted: formatINR(r.taxableAmount),
          gstRateFormatted: `${r.gstRate}%`,
          cgstFormatted: formatINR(r.cgstAmount),
          sgstFormatted: formatINR(r.sgstAmount),
          igstFormatted: formatINR(r.igstAmount),
          totalFormatted: formatINR(r.totalAmount)
        }));
      } else if (data.type === 'rate_summary') {
        const rateData = data as { rows: any[]; summary: any };
        columns = [
          { header: 'GST Rate', dataKey: 'rateFormatted', align: 'center', width: 24 },
          { header: 'Items Sold', dataKey: 'itemsCount', align: 'center', width: 24 },
          { header: 'Taxable Value (₹)', dataKey: 'taxableFormatted', align: 'right', width: 35 },
          { header: 'CGST (₹)', dataKey: 'cgstFormatted', align: 'right', width: 28 },
          { header: 'SGST (₹)', dataKey: 'sgstFormatted', align: 'right', width: 28 },
          { header: 'IGST (₹)', dataKey: 'igstFormatted', align: 'right', width: 28 },
          { header: 'Total Tax (₹)', dataKey: 'totalTaxFormatted', align: 'right', width: 30 },
          { header: 'Invoice Total (₹)', dataKey: 'totalFormatted', align: 'right', width: 35 }
        ];
        rows = rateData.rows.map(r => ({
          ...r,
          rateFormatted: `${r.gstRate}%`,
          taxableFormatted: formatINR(r.taxableAmount),
          cgstFormatted: formatINR(r.cgstAmount),
          sgstFormatted: formatINR(r.sgstAmount),
          igstFormatted: formatINR(r.igstAmount),
          totalTaxFormatted: formatINR(r.totalTax),
          totalFormatted: formatINR(r.totalAmount)
        }));
      } else {
        const regData = data as { rows: any[]; summary: any };
        columns = [
          { header: 'Invoice No.', dataKey: 'invoiceNumber', width: 28 },
          { header: 'Date', dataKey: 'invoiceDate', width: 22 },
          { header: 'Customer Name', dataKey: 'customerName', width: 45 },
          { header: 'GSTIN', dataKey: 'customerGstin', width: 34 },
          { header: 'Place of Supply', dataKey: 'placeOfSupply', width: 28 },
          { header: 'Taxable Value (₹)', dataKey: 'taxableFormatted', align: 'right', width: 28 },
          { header: 'Rate', dataKey: 'rateFormatted', align: 'center', width: 16 },
          { header: 'CGST (₹)', dataKey: 'cgstFormatted', align: 'right', width: 22 },
          { header: 'SGST (₹)', dataKey: 'sgstFormatted', align: 'right', width: 22 },
          { header: 'IGST (₹)', dataKey: 'igstFormatted', align: 'right', width: 22 },
          { header: 'Total (₹)', dataKey: 'totalFormatted', align: 'right', width: 28 }
        ];
        rows = regData.rows.map(r => ({
          ...r,
          rateFormatted: `${r.gstRate}%`,
          taxableFormatted: formatINR(r.taxableValue),
          cgstFormatted: formatINR(r.cgst),
          sgstFormatted: formatINR(r.sgst),
          igstFormatted: formatINR(r.igst),
          totalFormatted: formatINR(r.invoiceTotal)
        }));
      }
      summaryCards = [
        { label: 'Total Invoices/Items', value: String(data.summary.totalRecords) },
        { label: 'Total Taxable', value: formatINR(data.summary.taxableAmount) },
        { label: 'Total CGST', value: formatINR(data.summary.cgst) },
        { label: 'Total SGST', value: formatINR(data.summary.sgst) },
        { label: 'Total IGST', value: formatINR(data.summary.igst) },
        { label: 'Total GST Paid', value: formatINR(data.summary.totalGst) },
        { label: 'Gross Invoiced', value: formatINR(data.summary.invoiceTotal) }
      ];
    } else if (activeReportType === 'product_sales') {
      const data = reportData as ReturnType<typeof generateProductSalesReportData> & { title: string };
      columns = [
        { header: 'SKU', dataKey: 'sku', width: 28 },
        { header: 'Product Name', dataKey: 'productName', width: 55 },
        { header: 'Brand', dataKey: 'brand', width: 28 },
        { header: 'Category', dataKey: 'category', width: 32 },
        { header: 'Cases', dataKey: 'casesSold', align: 'right', width: 18 },
        { header: 'Pcs', dataKey: 'totalPiecesSold', align: 'right', width: 18 },
        { header: 'Gross (₹)', dataKey: 'grossFormatted', align: 'right', width: 25 },
        { header: 'Discount (₹)', dataKey: 'discountFormatted', align: 'right', width: 22 },
        { header: 'GST (₹)', dataKey: 'gstFormatted', align: 'right', width: 22 },
        { header: 'Net Sales (₹)', dataKey: 'netFormatted', align: 'right', width: 28 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        grossFormatted: formatINR(r.grossSales),
        discountFormatted: formatINR(r.discount),
        gstFormatted: formatINR(r.gst),
        netFormatted: formatINR(r.netSales)
      }));
      summaryCards = [
        { label: 'Products Sold', value: String(data.summary.totalRecords) },
        { label: 'Total Cases', value: String(data.summary.totalCases) },
        { label: 'Gross Sales', value: formatINR(data.summary.grossSales) },
        { label: 'Total Discount', value: formatINR(data.summary.discount) },
        { label: 'GST Collected', value: formatINR(data.summary.totalGst) },
        { label: 'Net Sales', value: formatINR(data.summary.netSales) }
      ];
    } else if (activeReportType === 'brand_sales') {
      const data = reportData as ReturnType<typeof generateBrandSalesReportData> & { title: string };
      columns = [
        { header: 'Brand Name', dataKey: 'brand', width: 45 },
        { header: 'SKUs', dataKey: 'productsCount', align: 'center', width: 20 },
        { header: 'Orders Count', dataKey: 'ordersCount', align: 'center', width: 24 },
        { header: 'Cases Sold', dataKey: 'casesSold', align: 'right', width: 22 },
        { header: 'Gross Sales (₹)', dataKey: 'grossFormatted', align: 'right', width: 32 },
        { header: 'Discount (₹)', dataKey: 'discountFormatted', align: 'right', width: 26 },
        { header: 'GST (₹)', dataKey: 'gstFormatted', align: 'right', width: 26 },
        { header: 'Net Sales (₹)', dataKey: 'netFormatted', align: 'right', width: 35 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        grossFormatted: formatINR(r.grossSales),
        discountFormatted: formatINR(r.discount),
        gstFormatted: formatINR(r.gst),
        netFormatted: formatINR(r.netSales)
      }));
      summaryCards = [
        { label: 'Brands Count', value: String(data.summary.totalRecords) },
        { label: 'Gross Sales', value: formatINR(data.summary.grossSales) },
        { label: 'Total Discount', value: formatINR(data.summary.discount) },
        { label: 'Total GST', value: formatINR(data.summary.totalGst) },
        { label: 'Net Sales', value: formatINR(data.summary.netSales) }
      ];
    } else if (activeReportType === 'category_sales') {
      const data = reportData as ReturnType<typeof generateCategorySalesReportData> & { title: string };
      columns = [
        { header: 'Category', dataKey: 'category', width: 45 },
        { header: 'SKUs', dataKey: 'productsCount', align: 'center', width: 20 },
        { header: 'Orders Count', dataKey: 'ordersCount', align: 'center', width: 24 },
        { header: 'Cases Sold', dataKey: 'casesSold', align: 'right', width: 22 },
        { header: 'Gross Sales (₹)', dataKey: 'grossFormatted', align: 'right', width: 32 },
        { header: 'Discount (₹)', dataKey: 'discountFormatted', align: 'right', width: 26 },
        { header: 'GST (₹)', dataKey: 'gstFormatted', align: 'right', width: 26 },
        { header: 'Net Sales (₹)', dataKey: 'netFormatted', align: 'right', width: 35 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        grossFormatted: formatINR(r.grossSales),
        discountFormatted: formatINR(r.discount),
        gstFormatted: formatINR(r.gst),
        netFormatted: formatINR(r.netSales)
      }));
      summaryCards = [
        { label: 'Categories Count', value: String(data.summary.totalRecords) },
        { label: 'Gross Sales', value: formatINR(data.summary.grossSales) },
        { label: 'Total Discount', value: formatINR(data.summary.discount) },
        { label: 'Total GST', value: formatINR(data.summary.totalGst) },
        { label: 'Net Sales', value: formatINR(data.summary.netSales) }
      ];
    } else if (activeReportType === 'salesman_sales') {
      const data = reportData as ReturnType<typeof generateSalesmanReportData> & { title: string };
      columns = [
        { header: 'Salesman', dataKey: 'name', width: 35 },
        { header: 'Code', dataKey: 'employeeCode', width: 22 },
        { header: 'Orders', dataKey: 'totalOrders', align: 'center', width: 18 },
        { header: 'Sales (₹)', dataKey: 'salesFormatted', align: 'right', width: 28 },
        { header: 'Collections (₹)', dataKey: 'collectionFormatted', align: 'right', width: 28 },
        { header: 'Outstanding (₹)', dataKey: 'outstandingFormatted', align: 'right', width: 28 },
        { header: 'Returns (₹)', dataKey: 'returnsFormatted', align: 'right', width: 22 },
        { header: 'Outlets', dataKey: 'customerCount', align: 'center', width: 18 },
        { header: 'Target %', dataKey: 'targetFormatted', align: 'center', width: 20 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        salesFormatted: formatINR(r.totalSales),
        collectionFormatted: formatINR(r.collection),
        outstandingFormatted: formatINR(r.outstanding),
        returnsFormatted: formatINR(r.returns),
        targetFormatted: `${r.achievementPct}%`
      }));
      summaryCards = [
        { label: 'Sales Force', value: String(data.summary.totalRecords) },
        { label: 'Total Orders', value: String(data.summary.totalOrders) },
        { label: 'Total Sales', value: formatINR(data.summary.totalSales) },
        { label: 'Total Collected', value: formatINR(data.summary.totalCollection) },
        { label: 'Market Outstanding', value: formatINR(data.summary.totalOutstanding) }
      ];
    } else if (activeReportType === 'outstanding') {
      const data = reportData as ReturnType<typeof generateOutstandingReportData> & { title: string };
      columns = [
        { header: 'Store Name', dataKey: 'storeName', width: 45 },
        { header: 'Beat / Area', dataKey: 'beatArea', width: 32 },
        { header: 'Credit Limit (₹)', dataKey: 'limitFormatted', align: 'right', width: 26 },
        { header: 'Credit Days', dataKey: 'creditDays', align: 'center', width: 20 },
        { header: 'Total Sales (₹)', dataKey: 'salesFormatted', align: 'right', width: 28 },
        { header: 'Total Paid (₹)', dataKey: 'paidFormatted', align: 'right', width: 28 },
        { header: 'Outstanding (₹)', dataKey: 'outstandingFormatted', align: 'right', width: 30 },
        { header: 'Overdue (₹)', dataKey: 'overdueFormatted', align: 'right', width: 26 },
        { header: 'Status', dataKey: 'statusFormatted', align: 'center', width: 20 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        beatArea: `${r.beatName} (${r.area})`,
        limitFormatted: formatINR(r.creditLimit),
        salesFormatted: formatINR(r.totalSales),
        paidFormatted: formatINR(r.totalPaid),
        outstandingFormatted: formatINR(r.outstanding),
        overdueFormatted: r.overdueAmount > 0 ? formatINR(r.overdueAmount) : '-',
        statusFormatted: r.isOverdue ? 'OVERDUE' : 'REGULAR'
      }));
      summaryCards = [
        { label: 'Total Outlets', value: String(data.summary.totalRecords) },
        { label: 'Lifetime Sales', value: formatINR(data.summary.totalSales) },
        { label: 'Total Collections', value: formatINR(data.summary.totalPaid) },
        { label: 'Total Outstanding', value: formatINR(data.summary.totalOutstanding) },
        { label: 'Overdue Dues', value: formatINR(data.summary.totalOverdue) },
        { label: 'Overdue Retailers', value: String(data.summary.overdueCount) }
      ];
    } else if (activeReportType === 'payment_collection') {
      const data = reportData as ReturnType<typeof generatePaymentCollectionReportData> & { title: string };
      columns = [
        { header: 'Date', dataKey: 'date', width: 22 },
        { header: 'Receipt No.', dataKey: 'receiptNumber', width: 28 },
        { header: 'Customer', dataKey: 'customerName', width: 45 },
        { header: 'Invoice Ref', dataKey: 'orderNumber', width: 26 },
        { header: 'Amount (₹)', dataKey: 'amountFormatted', align: 'right', width: 28 },
        { header: 'Mode', dataKey: 'paymentMode', align: 'center', width: 24 },
        { header: 'Collected By', dataKey: 'collectedBy', width: 30 },
        { header: 'Bank / UPI Ref', dataKey: 'reference', width: 30 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        amountFormatted: formatINR(r.amount)
      }));
      summaryCards = [
        { label: 'Total Receipts', value: String(data.summary.totalRecords) },
        { label: 'Total Collections', value: formatINR(data.summary.totalCollected) },
        { label: 'UPI / QR Payments', value: formatINR(data.summary.upiTotal) },
        { label: 'Cash In Hand', value: formatINR(data.summary.cashTotal) },
        { label: 'Bank / NEFT', value: formatINR(data.summary.bankTotal) },
        { label: 'Cheque Clearance', value: formatINR(data.summary.chequeTotal) }
      ];
    } else if (activeReportType === 'customer_sales') {
      const data = reportData as ReturnType<typeof generateCustomerSalesReportData> & { title: string };
      columns = [
        { header: 'Store Name', dataKey: 'storeName', width: 45 },
        { header: 'Beat / Area', dataKey: 'beatArea', width: 32 },
        { header: 'GSTIN', dataKey: 'gstin', width: 32 },
        { header: 'Orders', dataKey: 'ordersCount', align: 'center', width: 18 },
        { header: 'Cases', dataKey: 'casesSold', align: 'right', width: 18 },
        { header: 'Gross (₹)', dataKey: 'grossFormatted', align: 'right', width: 28 },
        { header: 'Net Sales (₹)', dataKey: 'netFormatted', align: 'right', width: 28 },
        { header: 'Paid (₹)', dataKey: 'paidFormatted', align: 'right', width: 28 },
        { header: 'Outstanding (₹)', dataKey: 'outstandingFormatted', align: 'right', width: 28 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        beatArea: `${r.beatName} (${r.area})`,
        grossFormatted: formatINR(r.grossSales),
        netFormatted: formatINR(r.netSales),
        paidFormatted: formatINR(r.paid),
        outstandingFormatted: formatINR(r.outstanding)
      }));
      summaryCards = [
        { label: 'Active Retailers', value: String(data.summary.totalRecords) },
        { label: 'Gross Sales', value: formatINR(data.summary.grossSales) },
        { label: 'Net Sales', value: formatINR(data.summary.netSales) },
        { label: 'Total Paid', value: formatINR(data.summary.totalPaid) },
        { label: 'Total Outstanding', value: formatINR(data.summary.totalOutstanding) }
      ];
    } else if (activeReportType === 'delivery') {
      const data = reportData as ReturnType<typeof generateDeliveryReportData> & { title: string };
      columns = [
        { header: 'Date', dataKey: 'date', width: 22 },
        { header: 'Run Number', dataKey: 'runNumber', width: 28 },
        { header: 'Driver Name', dataKey: 'driverName', width: 35 },
        { header: 'Vehicle', dataKey: 'vehicleNumber', width: 26 },
        { header: 'Assigned Beats', dataKey: 'beatNames', width: 38 },
        { header: 'Orders', dataKey: 'ordersFormatted', align: 'center', width: 24 },
        { header: 'Completion %', dataKey: 'rateFormatted', align: 'center', width: 24 },
        { header: 'Trip Value (₹)', dataKey: 'valueFormatted', align: 'right', width: 28 },
        { header: 'Collected (₹)', dataKey: 'collectedFormatted', align: 'right', width: 28 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        ordersFormatted: `${r.deliveredOrders}/${r.totalOrders}`,
        rateFormatted: `${r.completionRate}%`,
        valueFormatted: formatINR(r.totalOrderValue),
        collectedFormatted: formatINR(r.totalCollected)
      }));
      summaryCards = [
        { label: 'Trip Runs', value: String(data.summary.totalRecords) },
        { label: 'Total Orders', value: String(data.summary.totalOrders) },
        { label: 'Delivered Orders', value: String(data.summary.deliveredOrders) },
        { label: 'Trip Value', value: formatINR(data.summary.totalValue) },
        { label: 'Driver Collections', value: formatINR(data.summary.totalCollected) }
      ];
    } else if (activeReportType === 'returns') {
      const data = reportData as ReturnType<typeof generateReturnsReportData> & { title: string };
      columns = [
        { header: 'Date', dataKey: 'date', width: 22 },
        { header: 'Type', dataKey: 'type', width: 45 },
        { header: 'Reference', dataKey: 'reference', width: 28 },
        { header: 'Customer / SKU', dataKey: 'customerOrProduct', width: 45 },
        { header: 'Quantity', dataKey: 'quantity', align: 'center', width: 24 },
        { header: 'Amount (₹)', dataKey: 'amountFormatted', align: 'right', width: 26 },
        { header: 'Reason / Remarks', dataKey: 'reason', width: 45 },
        { header: 'Authorized By', dataKey: 'authorizedBy', width: 30 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        amountFormatted: r.amount > 0 ? formatINR(r.amount) : '-'
      }));
      summaryCards = [
        { label: 'Return Entries', value: String(data.summary.totalRecords) },
        { label: 'Return Value', value: formatINR(data.summary.totalReturnAmount) },
        { label: 'Total Cases Returned', value: String(data.summary.totalCases) },
        { label: 'Total Loose Pcs', value: String(data.summary.totalLoose) }
      ];
    } else if (activeReportType === 'profit_margin') {
      const data = reportData as ReturnType<typeof generateProfitMarginReportData> & { title: string };
      columns = [
        { header: 'SKU', dataKey: 'sku', width: 26 },
        { header: 'Product Name', dataKey: 'productName', width: 55 },
        { header: 'Brand', dataKey: 'brand', width: 28 },
        { header: 'Pieces Sold', dataKey: 'quantityPieces', align: 'right', width: 24 },
        { header: 'Wholesale (₹)', dataKey: 'wsFormatted', align: 'right', width: 28 },
        { header: 'MRP Value (₹)', dataKey: 'mrpFormatted', align: 'right', width: 28 },
        { header: 'Retailer Margin', dataKey: 'retMarginFormatted', align: 'right', width: 28 },
        { header: 'Agency Margin', dataKey: 'distMarginFormatted', align: 'right', width: 28 },
        { header: 'Margin %', dataKey: 'marginFormatted', align: 'center', width: 20 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        wsFormatted: formatINR(r.wholesaleValue),
        mrpFormatted: formatINR(r.mrpValue),
        retMarginFormatted: formatINR(r.retailerMarginAmt),
        distMarginFormatted: formatINR(r.distributorMarginAmt),
        marginFormatted: `${r.marginPercentage}%`
      }));
      summaryCards = [
        { label: 'Total Net Sales', value: formatINR(data.summary.netSales) },
        { label: 'Wholesale Turnover', value: formatINR(data.summary.wholesaleValue) },
        { label: 'Consumer MRP Value', value: formatINR(data.summary.mrpValue) },
        { label: 'Retailer Trade Margin', value: formatINR(data.summary.retailerMarginTotal) },
        { label: 'Agency Gross Margin', value: formatINR(data.summary.distributorMarginTotal) },
        { label: 'Distributor Margin %', value: `${data.summary.distributorMarginPct}%` }
      ];
    } else if (activeReportType === 'purchase') {
      const data = reportData as ReturnType<typeof generatePurchaseReportData> & { title: string };
      columns = [
        { header: 'Date', dataKey: 'date', width: 22 },
        { header: 'SKU', dataKey: 'sku', width: 28 },
        { header: 'Product Name', dataKey: 'productName', width: 50 },
        { header: 'Brand', dataKey: 'brand', width: 28 },
        { header: 'Batch No.', dataKey: 'batchNumber', width: 28 },
        { header: 'Quantity Inward', dataKey: 'quantity', align: 'center', width: 26 },
        { header: 'Stock Valuation (₹)', dataKey: 'valFormatted', align: 'right', width: 30 },
        { header: 'PO Reference', dataKey: 'reference', width: 28 },
        { header: 'Received By', dataKey: 'performedBy', width: 28 }
      ];
      rows = data.rows.map(r => ({
        ...r,
        valFormatted: formatINR(r.approxValue)
      }));
      summaryCards = [
        { label: 'Inward Receipts', value: String(data.summary.totalRecords) },
        { label: 'Total Cases Inward', value: String(data.summary.totalCases) },
        { label: 'Total Loose Pcs', value: String(data.summary.totalLoose) },
        { label: 'Warehouse Stock Value', value: formatINR(data.summary.totalValuation) }
      ];
    }

    return { columns, rows, summaryCards };
  }, [activeReportType, reportData]);

  // Paginated Rows for Screen Display
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return exportPayload.rows.slice(start, start + pageSize);
  }, [exportPayload.rows, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(exportPayload.rows.length / pageSize));

  // Export Handlers
  const handleExportPdf = () => {
    exportReportToPdf({
      reportTitle: (reportData as any).title || 'Aryan Agency Distribution Report',
      fileNamePrefix: `Aryan_${activeReportType}_Report`,
      periodLabel: dateRange.label,
      filterSummary: activeFilterLabels,
      columns: exportPayload.columns,
      rows: exportPayload.rows,
      summaryCards: exportPayload.summaryCards
    });
  };

  const handleExportExcel = () => {
    exportReportToExcel({
      reportTitle: (reportData as any).title || 'Aryan Agency Distribution Report',
      fileNamePrefix: `Aryan_${activeReportType}_Report`,
      periodLabel: dateRange.label,
      filterSummary: activeFilterLabels,
      columns: exportPayload.columns,
      rows: exportPayload.rows,
      summaryCards: exportPayload.summaryCards
    });
  };

  const handleExportCsv = () => {
    exportReportToCsv({
      reportTitle: (reportData as any).title || 'Aryan Agency Distribution Report',
      fileNamePrefix: `Aryan_${activeReportType}_Report`,
      periodLabel: dateRange.label,
      filterSummary: activeFilterLabels,
      columns: exportPayload.columns,
      rows: exportPayload.rows,
      summaryCards: exportPayload.summaryCards
    });
  };

  const handlePrint = () => {
    printReportPreview();
  };

  // Report Navigation Categories definition
  const reportTabs: { id: ReportType; label: string; icon: React.ReactNode; badgeText?: string }[] = [
    { id: 'sales', label: 'Sales Report', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'gst', label: 'GST Reports', icon: <Receipt className="w-4 h-4" />, badgeText: 'GSTR-1' },
    { id: 'customer_ledger', label: 'Customer Ledger', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'outstanding', label: 'Outstanding / Dues', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'payment_collection', label: 'Payment Collections', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'product_sales', label: 'Product-wise Sales', icon: <Boxes className="w-4 h-4" /> },
    { id: 'brand_sales', label: 'Brand-wise Sales', icon: <Layers className="w-4 h-4" /> },
    { id: 'category_sales', label: 'Category-wise Sales', icon: <PieChart className="w-4 h-4" /> },
    { id: 'customer_sales', label: 'Customer-wise Sales', icon: <Store className="w-4 h-4" /> },
    { id: 'salesman_sales', label: 'Salesman-wise Sales', icon: <Users className="w-4 h-4" /> },
    { id: 'delivery', label: 'Delivery Run Sheets', icon: <Truck className="w-4 h-4" /> },
    { id: 'returns', label: 'Returns & Credit Notes', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'purchase', label: 'Purchase & Inward', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'profit_margin', label: 'Profit & Margin', icon: <Percent className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-5 pb-16 print:p-0 print:space-y-2">
      {/* 1. Header & Quick Export Action Bar */}
      <div className="bg-[#0B132B] text-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Reports & Distribution Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Aryan Agency · Hatan Road, Utraula, Balrampur · GSTIN: 09BOGPG2620P1ZQ
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Download formatted A4 PDF Report with letterhead"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            title="Download Excel Spreadsheet (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-white shadow-xs transition-colors cursor-pointer"
            title="Download CSV file"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 shadow-xs transition-colors cursor-pointer"
            title="Print Report Preview"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. Report Type Selector Ribbon */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-2 overflow-x-auto print:hidden">
        <div className="flex items-center space-x-1 min-w-max">
          {reportTabs.map(tab => {
            const isActive = activeReportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveReportType(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badgeText && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. GST Dedicated Sub-Report Switcher (When GST report is active) */}
      {activeReportType === 'gst' && (
        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 space-y-2 print:hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              GST Tax Modules & Summary Views
            </span>
            <span className="text-[11px] text-blue-400">GSTR-1 & Financial Filing Ready</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'sales_register', label: 'GST Sales Register' },
              { id: 'b2b', label: 'B2B Invoices (With GSTIN)' },
              { id: 'b2c', label: 'B2C Retail (Unregistered)' },
              { id: 'hsn_summary', label: 'HSN-wise Summary' },
              { id: 'rate_summary', label: 'GST Rate-wise Summary' },
              { id: 'credit_note', label: 'Credit Note / Returns' }
            ].map(sub => (
              <button
                key={sub.id}
                onClick={() => {
                  setGstSubReport(sub.id as GstSubReportType);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  gstSubReport === sub.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Customer Ledger Quick Selector (When Ledger report is active) */}
      {activeReportType === 'customer_ledger' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-700 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Select Customer / Retailer for Ledger Statement</p>
              <p className="text-xs text-blue-700">Opening Balance + Invoices - Payments - Credit Notes = Closing Balance</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={ledgerRetailerId}
              onChange={(e) => {
                setLedgerRetailerId(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-blue-300 text-slate-900 text-xs font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[220px]"
            >
              {retailers.map(r => (
                <option key={r.id} value={r.id}>
                  {r.storeName} ({r.beatName || r.area || 'Utraula'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 5. Date / Period Selector & Advanced Filters Panel */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-4 print:hidden">
        {/* Date / Period Common Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Reporting Date & Period</span>
            </div>
            <button
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className="md:hidden flex items-center space-x-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isAdvancedFiltersOpen ? 'Hide Filters' : 'More Filters'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'previous_month', label: 'Previous Month' },
              { id: 'this_quarter', label: 'This Quarter' },
              { id: 'this_year', label: 'This Year' },
              { id: 'financial_year', label: 'Financial Year (01 Apr - 31 Mar)' },
              { id: 'custom', label: 'Custom Range' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPeriod(p.id as ReportPeriod);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedPeriod === p.id
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range Picker */}
          {selectedPeriod === 'custom' && (
            <div className="pt-2 flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-600">From Date:</span>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => {
                    setCustomFromDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-600">To Date:</span>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => {
                    setCustomToDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Advanced Filters Grid */}
        <div className={`pt-2 border-t border-slate-100 space-y-3 ${isAdvancedFiltersOpen ? 'block' : 'hidden md:block'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Customer Filter */}
            {activeReportType !== 'customer_ledger' && (
              <div>
                <label className="block text-slate-600 font-medium mb-1">Customer / Retailer</label>
                <select
                  value={selectedRetailerId}
                  onChange={(e) => { setSelectedRetailerId(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">All Retailers ({retailers.length})</option>
                  {retailers.map(r => (
                    <option key={r.id} value={r.id}>{r.storeName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Salesman Filter */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Salesman</label>
              <select
                value={selectedSalesmanId}
                onChange={(e) => { setSelectedSalesmanId(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Salesmen</option>
                {salesmen.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.employeeCode || 'EMP'})</option>
                ))}
              </select>
            </div>

            {/* Beat / Area Filter */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Beat / Distribution Area</label>
              <select
                value={selectedBeatName}
                onChange={(e) => { setSelectedBeatName(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Beats</option>
                {uniqueBeats.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => { setSelectedBrand(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Brands</option>
                {uniqueBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Payment Status</label>
              <select
                value={selectedPaymentStatus}
                onChange={(e) => { setSelectedPaymentStatus(e.target.value as any); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Order Status Filter */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Order Status</label>
              <select
                value={selectedOrderStatus}
                onChange={(e) => { setSelectedOrderStatus(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Orders</option>
                <option value="booked">Booked</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* GST / Non-GST Filter */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">GST Registration Type</label>
              <select
                value={selectedGstFilter}
                onChange={(e) => { setSelectedGstFilter(e.target.value as any); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All (B2B + B2C)</option>
                <option value="gst">B2B (Registered with GSTIN)</option>
                <option value="non_gst">B2C (Unregistered)</option>
              </select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <label className="block text-slate-600 font-medium mb-1">Payment Mode</label>
              <select
                value={selectedPaymentMode}
                onChange={(e) => { setSelectedPaymentMode(e.target.value); setCurrentPage(1); }}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Modes</option>
                <option value="cash">Cash Collection</option>
                <option value="upi">UPI / Dynamic QR</option>
                <option value="bank_transfer">Bank Transfer / NEFT</option>
                <option value="cheque">Cheque</option>
                <option value="credit">Trade Credit</option>
              </select>
            </div>

            {/* Keyword Search */}
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-medium mb-1">Search Keyword</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search invoice number, retailer, phone, GSTIN, salesman..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Outstanding Overdue Toggle & Reset */}
            <div className="flex items-end justify-between sm:col-span-2 space-x-2">
              {activeReportType === 'outstanding' && (
                <label className="flex items-center space-x-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyOverdue}
                    onChange={(e) => { setOnlyOverdue(e.target.checked); setCurrentPage(1); }}
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span>Show Overdue Customers Only</span>
                </label>
              )}

              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Summary Metrics Cards */}
      {exportPayload.summaryCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:grid-cols-4 print:gap-2">
          {exportPayload.summaryCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 mt-1 truncate">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 7. Printable Letterhead Preview Container */}
      <div id="aryan-report-preview" className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Letterhead Header (visible on screen and in print) */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-slate-900">ARYAN AGENCY</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">FMCG DISTRIBUTION</span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Authorized Wholesaler & Super Stockist · Hatan Road, Utraula, Balrampur (UP) - 271604
              </p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                GSTIN: <span className="font-bold text-slate-800">09BOGPG2620P1ZQ</span> · Ph: +91 9140529661
              </p>
            </div>

            <div className="text-left md:text-right">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase">
                {(reportData as any).title || 'Commercial Distribution Report'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Period: <span className="font-semibold text-slate-900">{dateRange.label}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generated: {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          {/* Active Filters Bar in Preview */}
          {activeFilterLabels.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Applied Filters:</span>
              {activeFilterLabels.map((lbl, idx) => (
                <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                  {lbl}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {paginatedRows.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-500">
              <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No records found for the selected period and filters</p>
              <p className="text-xs text-slate-500 mt-1">Try broadening the date range or resetting advanced filters</p>
              <button
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white border-b border-slate-700">
                  <th className="py-2.5 px-3 font-semibold text-[11px] w-10 text-center">#</th>
                  {exportPayload.columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={`py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                  {activeReportType === 'sales' && onOpenInvoice && (
                    <th className="py-2.5 px-3 font-semibold text-[11px] text-center print:hidden">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.map((row, rIdx) => {
                  const globalIdx = (currentPage - 1) * pageSize + rIdx + 1;
                  return (
                    <tr
                      key={row.id || rIdx}
                      className={`hover:bg-blue-50/50 transition-colors ${
                        rIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-400 text-center font-mono text-[10px]">
                        {globalIdx}
                      </td>
                      {exportPayload.columns.map((col, cIdx) => {
                        const val = row[col.dataKey];
                        const isPrimary = col.dataKey === 'orderNumber' || col.dataKey === 'storeName' || col.dataKey === 'productName';

                        return (
                          <td
                            key={cIdx}
                            className={`py-2.5 px-3 whitespace-nowrap ${
                              col.align === 'right'
                                ? 'text-right font-mono'
                                : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                            } ${isPrimary ? 'font-semibold text-slate-900' : 'text-slate-700'}`}
                          >
                            {/* Interactive Drill-down triggers */}
                            {col.dataKey === 'brand' && activeReportType === 'brand_sales' ? (
                              <button
                                onClick={() => {
                                  setSelectedBrand(String(val));
                                  setActiveReportType('product_sales');
                                  setCurrentPage(1);
                                }}
                                className="text-blue-600 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                                title="Click to view product breakdown for this brand"
                              >
                                <span>{val}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : col.dataKey === 'category' && activeReportType === 'category_sales' ? (
                              <button
                                onClick={() => {
                                  setSelectedCategory(String(val));
                                  setActiveReportType('product_sales');
                                  setCurrentPage(1);
                                }}
                                className="text-blue-600 hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
                                title="Click to view product breakdown for this category"
                              >
                                <span>{val}</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : (col.dataKey === 'storeName' || col.dataKey === 'customerName') && row.retailerId ? (
                              <button
                                onClick={() => {
                                  setLedgerRetailerId(row.retailerId);
                                  setActiveReportType('customer_ledger');
                                  setCurrentPage(1);
                                }}
                                className="text-slate-900 hover:text-blue-600 hover:underline font-semibold text-left cursor-pointer"
                                title="Click to view customer ledger"
                              >
                                {val}
                              </button>
                            ) : col.dataKey === 'paymentStatus' ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  val === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : val === 'PARTIAL'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {val}
                              </span>
                            ) : col.dataKey === 'statusFormatted' ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  val === 'OVERDUE'
                                    ? 'bg-rose-100 text-rose-800 font-bold animate-pulse'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {val}
                              </span>
                            ) : (
                              val !== undefined && val !== null ? String(val) : '-'
                            )}
                          </td>
                        );
                      })}

                      {/* Optional Action Button */}
                      {activeReportType === 'sales' && onOpenInvoice && (
                        <td className="py-2 px-3 text-center print:hidden">
                          <button
                            onClick={() => {
                              const ord = orders.find(o => o.id === row.id || o.orderNumber === row.orderNumber);
                              if (ord) onOpenInvoice(ord);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                          >
                            View Invoice
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Pagination & Footer Info */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 print:hidden">
          <div className="flex items-center space-x-2">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>of {exportPayload.rows.length} total entries</span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 py-1 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-100"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
