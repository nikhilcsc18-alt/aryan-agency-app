import { 
  Order, 
  OrderItem, 
  Retailer, 
  Salesman, 
  DeliveryRunSheet, 
  PaymentRecord, 
  InventoryMovement, 
  Product,
  ReportFilterOptions, 
  ReportPeriod, 
  GstSubReportType 
} from '../types';

/**
 * Format Indian Rupee currency with standard Indian commas (e.g. ₹1,25,000.00)
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  const val = Number(amount);
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatQty(cases: number = 0, loosePcs: number = 0): string {
  const parts: string[] = [];
  if (cases > 0) parts.push(`${cases} cs`);
  if (loosePcs > 0) parts.push(`${loosePcs} pcs`);
  return parts.length > 0 ? parts.join(' + ') : '0 pcs';
}

/**
 * Computes exact start and end date bounds for standard Indian distribution periods
 */
export function getDateRangeForPeriod(
  period: ReportPeriod, 
  customFrom?: string, 
  customTo?: string
): { fromDate: string; toDate: string; label: string } {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(0, 0, 0, 0);
    return res;
  };
  const endOfDay = (d: Date) => {
    const res = new Date(d);
    res.setHours(23, 59, 59, 999);
    return res;
  };
  const toYMD = (d: Date) => d.toISOString().slice(0, 10);

  switch (period) {
    case 'today': {
      return { fromDate: todayStr, toDate: todayStr, label: 'Today' };
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      return { fromDate: yStr, toDate: yStr, label: 'Yesterday' };
    }
    case 'this_week': {
      const day = now.getDay();
      // Monday as start of Indian business week
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(monday.getDate() - diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      return { 
        fromDate: toYMD(monday), 
        toDate: toYMD(sunday), 
        label: `This Week (${toYMD(monday)} to ${toYMD(sunday)})` 
      };
    }
    case 'this_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { 
        fromDate: toYMD(firstDay), 
        toDate: toYMD(lastDay), 
        label: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}` 
      };
    }
    case 'previous_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { 
        fromDate: toYMD(firstDay), 
        toDate: toYMD(lastDay), 
        label: `Previous Month (${firstDay.toLocaleString('default', { month: 'long' })} ${firstDay.getFullYear()})` 
      };
    }
    case 'this_quarter': {
      // Indian Financial Quarters: Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
      const m = now.getMonth(); // 0 to 11
      const y = now.getFullYear();
      let qNum = 1;
      let startM = 3; // Apr
      let endM = 5; // Jun
      let qYear = y;

      if (m >= 3 && m <= 5) {
        qNum = 1; startM = 3; endM = 5; qYear = y;
      } else if (m >= 6 && m <= 8) {
        qNum = 2; startM = 6; endM = 8; qYear = y;
      } else if (m >= 9 && m <= 11) {
        qNum = 3; startM = 9; endM = 11; qYear = y;
      } else {
        qNum = 4; startM = 0; endM = 2; qYear = y;
      }

      const qStart = new Date(qYear, startM, 1);
      const qEnd = new Date(qYear, endM + 1, 0);
      return { 
        fromDate: toYMD(qStart), 
        toDate: toYMD(qEnd), 
        label: `Q${qNum} (${toYMD(qStart)} to ${toYMD(qEnd)})` 
      };
    }
    case 'this_year': {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      return { 
        fromDate: toYMD(firstDay), 
        toDate: toYMD(lastDay), 
        label: `Calendar Year ${now.getFullYear()}` 
      };
    }
    case 'financial_year': {
      // Indian Financial Year: 1 April to 31 March
      const m = now.getMonth();
      const y = now.getFullYear();
      const fyStartYear = m >= 3 ? y : y - 1;
      const fyEndYear = fyStartYear + 1;
      const firstDay = new Date(fyStartYear, 3, 1); // 1 April
      const lastDay = new Date(fyEndYear, 2, 31); // 31 March
      return { 
        fromDate: toYMD(firstDay), 
        toDate: toYMD(lastDay), 
        label: `Financial Year ${fyStartYear}-${String(fyEndYear).slice(-2)} (01 Apr to 31 Mar)` 
      };
    }
    case 'custom': {
      const from = customFrom || todayStr;
      const to = customTo || todayStr;
      return { 
        fromDate: from, 
        toDate: to, 
        label: `Custom Period (${from} to ${to})` 
      };
    }
    default: {
      return { fromDate: todayStr, toDate: todayStr, label: 'Today' };
    }
  }
}

/**
 * Filter Orders by Date Range & Advanced Filters
 */
export function filterOrders(orders: Order[], filters: ReportFilterOptions): Order[] {
  const { fromDate, toDate } = getDateRangeForPeriod(filters.period, filters.fromDate, filters.toDate);

  return orders.filter(order => {
    // 1. Date Range
    const oDate = (order.orderDate || '').slice(0, 10);
    if (fromDate && oDate < fromDate) return false;
    if (toDate && oDate > toDate) return false;

    // 2. Retailer Filter
    if (filters.retailerId && filters.retailerId !== 'all' && order.retailerId !== filters.retailerId) {
      return false;
    }

    // 3. Salesman Filter
    if (filters.salesmanId && filters.salesmanId !== 'all') {
      if (order.salesmanId !== filters.salesmanId && order.salesmanName !== filters.salesmanId) {
        return false;
      }
    }

    // 4. Order Status Filter
    if (filters.orderStatus && filters.orderStatus !== 'all' && order.status !== filters.orderStatus) {
      return false;
    }

    // 5. Payment Status Filter
    if (filters.paymentStatus && filters.paymentStatus !== 'all' && order.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    // 6. GST Filter
    if (filters.gstFilter && filters.gstFilter !== 'all') {
      const hasGstin = Boolean(order.retailerGstin && order.retailerGstin.trim().length >= 10);
      if (filters.gstFilter === 'gst' && !hasGstin) return false;
      if (filters.gstFilter === 'non_gst' && hasGstin) return false;
    }

    // 7. Payment Mode Filter
    if (filters.paymentMode && filters.paymentMode !== 'all') {
      if (order.paymentMode !== filters.paymentMode) return false;
    }

    // 8. Beat / Area Filter
    if (filters.beatName && filters.beatName !== 'all') {
      if (order.beatName !== filters.beatName) return false;
    }

    // 9. Product / Brand / Category Filter in Items
    if (filters.productId && filters.productId !== 'all') {
      const hasProduct = order.items.some(it => it.productId === filters.productId);
      if (!hasProduct) return false;
    }
    if (filters.brand && filters.brand !== 'all') {
      const hasBrand = order.items.some(it => it.brand?.toLowerCase() === filters.brand?.toLowerCase());
      if (!hasBrand) return false;
    }
    if (filters.category && filters.category !== 'all') {
      const hasCategory = order.items.some(it => it.category?.toLowerCase() === filters.category?.toLowerCase());
      if (!hasCategory) return false;
    }

    // 10. Search Term
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const q = filters.searchTerm.toLowerCase().trim();
      const match = 
        (order.orderNumber || '').toLowerCase().includes(q) ||
        (order.retailerName || '').toLowerCase().includes(q) ||
        (order.retailerGstin || '').toLowerCase().includes(q) ||
        (order.salesmanName || '').toLowerCase().includes(q) ||
        (order.beatName || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Filter Payments by Date Range and Advanced Filters
 */
export function filterPayments(payments: PaymentRecord[], filters: ReportFilterOptions): PaymentRecord[] {
  const { fromDate, toDate } = getDateRangeForPeriod(filters.period, filters.fromDate, filters.toDate);

  return payments.filter(payment => {
    const pDate = (payment.paymentDate || '').slice(0, 10);
    if (fromDate && pDate < fromDate) return false;
    if (toDate && pDate > toDate) return false;

    if (filters.retailerId && filters.retailerId !== 'all' && payment.retailerId !== filters.retailerId) {
      return false;
    }

    if (filters.paymentMode && filters.paymentMode !== 'all') {
      if (payment.paymentMode !== filters.paymentMode) return false;
    }

    if (filters.salesmanId && filters.salesmanId !== 'all') {
      if (payment.collectorName !== filters.salesmanId && payment.collectedByRole !== 'salesman') {
        // Can also match collectorName
      }
    }

    if (filters.searchTerm && filters.searchTerm.trim()) {
      const q = filters.searchTerm.toLowerCase().trim();
      const match = 
        (payment.receiptNumber || '').toLowerCase().includes(q) ||
        (payment.retailerName || '').toLowerCase().includes(q) ||
        (payment.orderNumber || '').toLowerCase().includes(q) ||
        (payment.transactionRef || '').toLowerCase().includes(q) ||
        (payment.collectorName || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * 1. Comprehensive Sales Report Data Generator
 */
export function generateSalesReportData(orders: Order[], filters: ReportFilterOptions) {
  const filteredOrders = filterOrders(orders, filters);

  let totalGross = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;
  let totalNetSales = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let totalCases = 0;
  let totalLoosePcs = 0;
  let totalPieces = 0;
  let totalOrdersCount = filteredOrders.length;
  let salesReturns = 0; // Cancelled or returned orders value

  filteredOrders.forEach(o => {
    if (o.status === 'cancelled') {
      salesReturns += o.grandTotal || 0;
      return;
    }

    totalGross += o.subtotal || 0;
    totalDiscount += o.totalDiscount || 0;
    totalTaxable += o.totalTaxable || 0;
    totalCgst += o.totalCgst || 0;
    totalSgst += o.totalSgst || 0;
    totalIgst += (o as any).totalIgst || (o.isInterstate ? (o.totalTax || 0) : 0);
    totalGst += o.totalTax || (o.totalCgst + o.totalSgst);
    totalNetSales += o.grandTotal || 0;
    totalPaid += o.amountPaid || 0;
    totalOutstanding += o.outstandingAmount || 0;

    o.items?.forEach(it => {
      totalCases += it.cases || 0;
      totalLoosePcs += it.loosePcs || 0;
      totalPieces += it.totalPieces || (it.cases * (it as any).piecesPerCase || 0) + it.loosePcs;
    });
  });

  const netReceivable = Math.max(0, totalOutstanding - salesReturns);

  const tableRows = filteredOrders.map(o => {
    const isCancelled = o.status === 'cancelled';
    const isInterstate = Boolean(o.isInterstate || (o.retailerGstin && !o.retailerGstin.startsWith('09')));
    const igstVal = isInterstate ? (o.totalTax || 0) : 0;
    const cgstVal = isInterstate ? 0 : (o.totalCgst || 0);
    const sgstVal = isInterstate ? 0 : (o.totalSgst || 0);

    return {
      id: o.id,
      date: (o.orderDate || '').slice(0, 10),
      orderNumber: o.orderNumber,
      customerName: o.retailerName,
      customerGstin: o.retailerGstin || 'Unregistered (B2C)',
      salesman: o.salesmanName || 'Direct / Head Office',
      beatName: o.beatName || 'General',
      taxableAmount: isCancelled ? 0 : (o.totalTaxable || 0),
      cgst: isCancelled ? 0 : cgstVal,
      sgst: isCancelled ? 0 : sgstVal,
      igst: isCancelled ? 0 : igstVal,
      totalGst: isCancelled ? 0 : (o.totalTax || cgstVal + sgstVal + igstVal),
      grandTotal: o.grandTotal || 0,
      paidAmount: o.amountPaid || 0,
      outstandingAmount: o.outstandingAmount || 0,
      paymentStatus: o.paymentStatus || 'unpaid',
      orderStatus: o.status,
      isCancelled
    };
  });

  return {
    summary: {
      totalRecords: totalOrdersCount,
      totalOrders: totalOrdersCount,
      grossSales: totalGross,
      discount: totalDiscount,
      taxableAmount: totalTaxable,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalGst,
      netSales: totalNetSales,
      paidAmount: totalPaid,
      outstandingAmount: totalOutstanding,
      salesReturns,
      netReceivable,
      totalCases,
      totalLoosePcs,
      totalPieces
    },
    tableRows
  };
}

/**
 * 2. Customer Ledger Generator
 */
export interface LedgerTransaction {
  id: string;
  date: string;
  referenceNumber: string;
  type: 'invoice' | 'payment' | 'credit_note';
  description: string;
  debit: number; // Increases balance (Invoice)
  credit: number; // Decreases balance (Payment / Return)
  runningBalance: number;
  paymentMode?: string;
  status?: string;
}

export function generateCustomerLedgerData(
  retailer: Retailer,
  orders: Order[],
  payments: PaymentRecord[],
  period: ReportPeriod,
  customFrom?: string,
  customTo?: string
) {
  const { fromDate, toDate } = getDateRangeForPeriod(period, customFrom, customTo);

  // All orders for this retailer
  const retailerOrders = orders.filter(o => o.retailerId === retailer.id && o.status !== 'draft');
  // All payments for this retailer
  const retailerPayments = payments.filter(p => p.retailerId === retailer.id && p.status !== 'bounced');

  // Compute opening balance before fromDate
  let openingBalance = 0;

  retailerOrders.forEach(o => {
    const oDate = (o.orderDate || '').slice(0, 10);
    if (oDate < fromDate) {
      if (o.status === 'cancelled') {
        // No debit
      } else {
        openingBalance += o.grandTotal || 0;
      }
    }
  });

  retailerPayments.forEach(p => {
    const pDate = (p.paymentDate || '').slice(0, 10);
    if (pDate < fromDate) {
      openingBalance -= p.amount || 0;
    }
  });

  // Collect period transactions
  const transactions: {
    id: string;
    rawDate: string;
    date: string;
    referenceNumber: string;
    type: 'invoice' | 'payment' | 'credit_note';
    description: string;
    debit: number;
    credit: number;
    paymentMode?: string;
    status?: string;
  }[] = [];

  // Add Orders in period
  retailerOrders.forEach(o => {
    const oDate = (o.orderDate || '').slice(0, 10);
    if (oDate >= fromDate && oDate <= toDate) {
      if (o.status === 'cancelled') {
        transactions.push({
          id: `ord_${o.id}`,
          rawDate: o.orderDate,
          date: oDate,
          referenceNumber: o.orderNumber,
          type: 'credit_note',
          description: `Cancelled Order / Credit Memo (${o.items?.length || 0} items)`,
          debit: 0,
          credit: o.grandTotal || 0,
          paymentMode: 'Credit Note',
          status: 'Cancelled'
        });
      } else {
        transactions.push({
          id: `ord_${o.id}`,
          rawDate: o.orderDate,
          date: oDate,
          referenceNumber: o.orderNumber,
          type: 'invoice',
          description: `Tax Invoice - ${o.items?.length || 0} FMCG items (${o.beatName || 'Beat'})`,
          debit: o.grandTotal || 0,
          credit: 0,
          paymentMode: o.paymentMode ? o.paymentMode.toUpperCase() : 'CREDIT',
          status: o.status
        });
      }
    }
  });

  // Add Payments in period
  retailerPayments.forEach(p => {
    const pDate = (p.paymentDate || '').slice(0, 10);
    if (pDate >= fromDate && pDate <= toDate) {
      const modeLabel = p.paymentMode === 'upi' ? 'UPI / QR Transfer' :
        p.paymentMode === 'cash' ? 'Cash Collection' :
        p.paymentMode === 'cheque' ? 'Cheque Deposit' :
        p.paymentMode === 'bank_transfer' ? 'NEFT / RTGS' :
        'Credit Note';

      transactions.push({
        id: `pay_${p.id}`,
        rawDate: p.paymentDate,
        date: pDate,
        referenceNumber: p.receiptNumber || p.transactionRef || 'REC-PAY',
        type: p.paymentMode === 'credit_note' ? 'credit_note' : 'payment',
        description: `Payment Receipt - ${modeLabel} ${p.transactionRef ? `(Ref: ${p.transactionRef})` : ''} - Col. by ${p.collectorName || 'Aryan Staff'}`,
        debit: 0,
        credit: p.amount || 0,
        paymentMode: modeLabel,
        status: p.status
      });
    }
  });

  // Sort chronological
  transactions.sort((a, b) => (a.rawDate || a.date).localeCompare(b.rawDate || b.date));

  // Compute running balance
  let currentRunning = openingBalance;
  let totalDebitPeriod = 0;
  let totalCreditPeriod = 0;

  const ledgerRows: LedgerTransaction[] = transactions.map(t => {
    currentRunning = currentRunning + t.debit - t.credit;
    totalDebitPeriod += t.debit;
    totalCreditPeriod += t.credit;
    return {
      id: t.id,
      date: t.date,
      referenceNumber: t.referenceNumber,
      type: t.type,
      description: t.description,
      debit: t.debit,
      credit: t.credit,
      runningBalance: currentRunning,
      paymentMode: t.paymentMode,
      status: t.status
    };
  });

  const closingBalance = openingBalance + totalDebitPeriod - totalCreditPeriod;

  return {
    retailer,
    period: { fromDate, toDate },
    openingBalance,
    totalDebit: totalDebitPeriod,
    totalCredit: totalCreditPeriod,
    closingBalance,
    transactions: ledgerRows
  };
}

/**
 * 3. Dedicated GST Reports Engine
 */
export function generateGstReportData(orders: Order[], filters: ReportFilterOptions) {
  const filteredOrders = filterOrders(orders, filters).filter(o => o.status !== 'cancelled');
  const subReport = filters.gstSubReport || 'sales_register';

  // Specific Sub-Reports
  if (subReport === 'hsn_summary') {
    // Group by HSN Code
    const hsnMap: Record<string, {
      hsnCode: string;
      description: string;
      gstRate: number;
      totalCases: number;
      totalLoosePcs: number;
      totalPieces: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
      totalAmount: number;
    }> = {};

    filteredOrders.forEach(o => {
      const isInterstate = Boolean(o.isInterstate || (o.retailerGstin && !o.retailerGstin.startsWith('09')));

      o.items?.forEach(it => {
        const hsn = it.hsnCode || '19053100';
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsnCode: hsn,
            description: it.category ? `${it.category} Items` : it.productName,
            gstRate: it.gstRate || 18,
            totalCases: 0,
            totalLoosePcs: 0,
            totalPieces: 0,
            taxableAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalTax: 0,
            totalAmount: 0
          };
        }

        const entry = hsnMap[hsn];
        entry.totalCases += it.cases || 0;
        entry.totalLoosePcs += it.loosePcs || 0;
        entry.totalPieces += it.totalPieces || (it.cases * (it as any).piecesPerCase || 0) + it.loosePcs;
        entry.taxableAmount += it.taxableAmount || 0;

        const tax = (it.cgstAmount || 0) + (it.sgstAmount || 0) + (it.igstAmount || 0);
        if (isInterstate) {
          entry.igstAmount += tax;
        } else {
          entry.cgstAmount += it.cgstAmount || (tax / 2);
          entry.sgstAmount += it.sgstAmount || (tax / 2);
        }
        entry.totalTax += tax;
        entry.totalAmount += it.totalAmount || (it.taxableAmount + tax);
      });
    });

    const rows = Object.values(hsnMap).sort((a, b) => b.taxableAmount - a.taxableAmount);
    const totalTaxable = rows.reduce((acc, r) => acc + r.taxableAmount, 0);
    const totalCgst = rows.reduce((acc, r) => acc + r.cgstAmount, 0);
    const totalSgst = rows.reduce((acc, r) => acc + r.sgstAmount, 0);
    const totalIgst = rows.reduce((acc, r) => acc + r.igstAmount, 0);
    const totalTax = totalCgst + totalSgst + totalIgst;
    const totalInvoiceVal = rows.reduce((acc, r) => acc + r.totalAmount, 0);

    return {
      type: 'hsn_summary',
      title: 'HSN-Wise GST Summary',
      summary: {
        totalRecords: rows.length,
        taxableAmount: totalTaxable,
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        totalGst: totalTax,
        invoiceTotal: totalInvoiceVal
      },
      rows
    };
  }

  if (subReport === 'rate_summary') {
    // Group by GST Rate (0%, 5%, 12%, 18%, 28%)
    const rateMap: Record<number, {
      gstRate: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalTax: number;
      totalAmount: number;
      itemsCount: number;
    }> = {};

    [0, 5, 12, 18, 28].forEach(r => {
      rateMap[r] = {
        gstRate: r,
        taxableAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
        totalAmount: 0,
        itemsCount: 0
      };
    });

    filteredOrders.forEach(o => {
      const isInterstate = Boolean(o.isInterstate || (o.retailerGstin && !o.retailerGstin.startsWith('09')));

      o.items?.forEach(it => {
        const rate = it.gstRate !== undefined ? it.gstRate : 18;
        if (!rateMap[rate]) {
          rateMap[rate] = {
            gstRate: rate,
            taxableAmount: 0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 0,
            totalTax: 0,
            totalAmount: 0,
            itemsCount: 0
          };
        }
        const entry = rateMap[rate];
        entry.itemsCount++;
        entry.taxableAmount += it.taxableAmount || 0;
        const tax = (it.cgstAmount || 0) + (it.sgstAmount || 0) + (it.igstAmount || 0);
        if (isInterstate) {
          entry.igstAmount += tax;
        } else {
          entry.cgstAmount += it.cgstAmount || (tax / 2);
          entry.sgstAmount += it.sgstAmount || (tax / 2);
        }
        entry.totalTax += tax;
        entry.totalAmount += it.totalAmount || (it.taxableAmount + tax);
      });
    });

    const rows = Object.values(rateMap).filter(r => r.taxableAmount > 0 || r.itemsCount > 0);
    const totalTaxable = rows.reduce((acc, r) => acc + r.taxableAmount, 0);
    const totalCgst = rows.reduce((acc, r) => acc + r.cgstAmount, 0);
    const totalSgst = rows.reduce((acc, r) => acc + r.sgstAmount, 0);
    const totalIgst = rows.reduce((acc, r) => acc + r.igstAmount, 0);
    const totalTax = totalCgst + totalSgst + totalIgst;
    const totalInvoiceVal = rows.reduce((acc, r) => acc + r.totalAmount, 0);

    return {
      type: 'rate_summary',
      title: 'GST Rate-Wise Tax Summary',
      summary: {
        totalRecords: rows.length,
        taxableAmount: totalTaxable,
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        totalGst: totalTax,
        invoiceTotal: totalInvoiceVal
      },
      rows
    };
  }

  // B2B filter (with GSTIN), B2C filter (without GSTIN), or Standard Sales Register
  let targetOrders = filteredOrders;
  if (subReport === 'b2b') {
    targetOrders = filteredOrders.filter(o => Boolean(o.retailerGstin && o.retailerGstin.trim().length >= 10));
  } else if (subReport === 'b2c') {
    targetOrders = filteredOrders.filter(o => !o.retailerGstin || o.retailerGstin.trim().length < 10);
  }

  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalInvoiceVal = 0;

  const invoiceRows = targetOrders.map(o => {
    const isInterstate = Boolean(o.isInterstate || (o.retailerGstin && !o.retailerGstin.startsWith('09')));
    const pos = isInterstate ? 'Inter-State' : '09-Uttar Pradesh';
    const taxable = o.totalTaxable || 0;
    const taxTotal = o.totalTax || (o.totalCgst + o.totalSgst);
    const cgst = isInterstate ? 0 : (o.totalCgst || taxTotal / 2);
    const sgst = isInterstate ? 0 : (o.totalSgst || taxTotal / 2);
    const igst = isInterstate ? taxTotal : 0;
    const invoiceTotal = o.grandTotal || (taxable + taxTotal);

    // Approximate dominant GST Rate from order items
    const dominantRate = o.items?.[0]?.gstRate || 18;

    totalTaxable += taxable;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;
    totalInvoiceVal += invoiceTotal;

    return {
      id: o.id,
      invoiceNumber: o.orderNumber,
      invoiceDate: (o.orderDate || '').slice(0, 10),
      customerName: o.retailerName,
      customerGstin: o.retailerGstin || 'URP (Unregistered)',
      placeOfSupply: pos,
      taxableValue: taxable,
      gstRate: dominantRate,
      cgst,
      sgst,
      igst,
      invoiceTotal
    };
  });

  const totalGst = totalCgst + totalSgst + totalIgst;

  return {
    type: subReport,
    title: subReport === 'b2b' ? 'GST B2B Inward/Outward Register' :
      subReport === 'b2c' ? 'GST B2C Retail Invoices Register' :
      'GST Sales Register (GSTR-1 Ready)',
    summary: {
      totalRecords: invoiceRows.length,
      taxableAmount: totalTaxable,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalGst,
      invoiceTotal: totalInvoiceVal
    },
    rows: invoiceRows
  };
}

/**
 * 4. Product-wise Sales Report Generator
 */
export function generateProductSalesReportData(
  orders: Order[],
  products: Product[],
  filters: ReportFilterOptions
) {
  const filteredOrders = filterOrders(orders, filters).filter(o => o.status !== 'cancelled');

  const prodMap: Record<string, {
    productId: string;
    productName: string;
    sku: string;
    brand: string;
    category: string;
    hsnCode: string;
    gstRate: number;
    casesSold: number;
    loosePcsSold: number;
    totalPiecesSold: number;
    grossSales: number;
    discount: number;
    gst: number;
    netSales: number;
    ordersCount: number;
    wholesaleRate: number;
    mrp: number;
  }> = {};

  filteredOrders.forEach(o => {
    o.items?.forEach(it => {
      const pid = it.productId || it.sku;
      if (!prodMap[pid]) {
        const prod = products.find(p => p.id === pid || p.sku === it.sku);
        prodMap[pid] = {
          productId: pid,
          productName: it.productName || prod?.name || 'FMCG Product',
          sku: it.sku || prod?.sku || '',
          brand: it.brand || prod?.brand || 'General',
          category: it.category || prod?.category || 'Staples',
          hsnCode: it.hsnCode || prod?.hsnCode || '19053100',
          gstRate: it.gstRate !== undefined ? it.gstRate : (prod?.gstRate || 18),
          casesSold: 0,
          loosePcsSold: 0,
          totalPiecesSold: 0,
          grossSales: 0,
          discount: 0,
          gst: 0,
          netSales: 0,
          ordersCount: 0,
          wholesaleRate: it.unitPrice || prod?.wholesalePricePiece || 0,
          mrp: prod?.mrpPiece || 0
        };
      }

      const entry = prodMap[pid];
      entry.casesSold += it.cases || 0;
      entry.loosePcsSold += it.loosePcs || 0;
      entry.totalPiecesSold += it.totalPieces || (it.cases * (it as any).piecesPerCase || 0) + it.loosePcs;
      entry.grossSales += it.grossAmount || 0;
      entry.discount += it.discountAmount || 0;
      entry.gst += (it.cgstAmount || 0) + (it.sgstAmount || 0) + (it.igstAmount || 0);
      entry.netSales += it.totalAmount || 0;
      entry.ordersCount += 1;
    });
  });

  const rows = Object.values(prodMap).sort((a, b) => b.netSales - a.netSales);

  const totalGross = rows.reduce((acc, r) => acc + r.grossSales, 0);
  const totalDiscount = rows.reduce((acc, r) => acc + r.discount, 0);
  const totalGst = rows.reduce((acc, r) => acc + r.gst, 0);
  const totalNetSales = rows.reduce((acc, r) => acc + r.netSales, 0);
  const totalCases = rows.reduce((acc, r) => acc + r.casesSold, 0);
  const totalPcs = rows.reduce((acc, r) => acc + r.totalPiecesSold, 0);

  return {
    summary: {
      totalRecords: rows.length,
      grossSales: totalGross,
      discount: totalDiscount,
      totalGst,
      netSales: totalNetSales,
      totalCases,
      totalPieces: totalPcs
    },
    rows
  };
}

/**
 * 5. Brand-wise Sales Report Generator
 */
export function generateBrandSalesReportData(
  orders: Order[],
  products: Product[],
  filters: ReportFilterOptions
) {
  const filteredOrders = filterOrders(orders, filters).filter(o => o.status !== 'cancelled');

  const brandMap: Record<string, {
    brand: string;
    ordersCount: number;
    casesSold: number;
    totalPiecesSold: number;
    grossSales: number;
    discount: number;
    gst: number;
    netSales: number;
    productsCount: Set<string>;
  }> = {};

  filteredOrders.forEach(o => {
    o.items?.forEach(it => {
      const b = (it.brand || 'Unbranded').trim();
      if (!brandMap[b]) {
        brandMap[b] = {
          brand: b,
          ordersCount: 0,
          casesSold: 0,
          totalPiecesSold: 0,
          grossSales: 0,
          discount: 0,
          gst: 0,
          netSales: 0,
          productsCount: new Set()
        };
      }
      const entry = brandMap[b];
      entry.ordersCount++;
      entry.casesSold += it.cases || 0;
      entry.totalPiecesSold += it.totalPieces || (it.cases * (it as any).piecesPerCase || 0) + it.loosePcs;
      entry.grossSales += it.grossAmount || 0;
      entry.discount += it.discountAmount || 0;
      entry.gst += (it.cgstAmount || 0) + (it.sgstAmount || 0) + (it.igstAmount || 0);
      entry.netSales += it.totalAmount || 0;
      entry.productsCount.add(it.productId || it.productName);
    });
  });

  const rows = Object.values(brandMap).map(b => ({
    ...b,
    productsCount: b.productsCount.size
  })).sort((a, b) => b.netSales - a.netSales);

  const totalGross = rows.reduce((acc, r) => acc + r.grossSales, 0);
  const totalDiscount = rows.reduce((acc, r) => acc + r.discount, 0);
  const totalGst = rows.reduce((acc, r) => acc + r.gst, 0);
  const totalNet = rows.reduce((acc, r) => acc + r.netSales, 0);

  return {
    summary: {
      totalRecords: rows.length,
      grossSales: totalGross,
      discount: totalDiscount,
      totalGst,
      netSales: totalNet
    },
    rows
  };
}

/**
 * 6. Category-wise Sales Report Generator
 */
export function generateCategorySalesReportData(
  orders: Order[],
  products: Product[],
  filters: ReportFilterOptions
) {
  const filteredOrders = filterOrders(orders, filters).filter(o => o.status !== 'cancelled');

  const catMap: Record<string, {
    category: string;
    ordersCount: number;
    casesSold: number;
    totalPiecesSold: number;
    grossSales: number;
    discount: number;
    gst: number;
    netSales: number;
    productsCount: Set<string>;
  }> = {};

  filteredOrders.forEach(o => {
    o.items?.forEach(it => {
      const c = (it.category || 'General').trim();
      if (!catMap[c]) {
        catMap[c] = {
          category: c,
          ordersCount: 0,
          casesSold: 0,
          totalPiecesSold: 0,
          grossSales: 0,
          discount: 0,
          gst: 0,
          netSales: 0,
          productsCount: new Set()
        };
      }
      const entry = catMap[c];
      entry.ordersCount++;
      entry.casesSold += it.cases || 0;
      entry.totalPiecesSold += it.totalPieces || (it.cases * (it as any).piecesPerCase || 0) + it.loosePcs;
      entry.grossSales += it.grossAmount || 0;
      entry.discount += it.discountAmount || 0;
      entry.gst += (it.cgstAmount || 0) + (it.sgstAmount || 0) + (it.igstAmount || 0);
      entry.netSales += it.totalAmount || 0;
      entry.productsCount.add(it.productId || it.productName);
    });
  });

  const rows = Object.values(catMap).map(c => ({
    ...c,
    productsCount: c.productsCount.size
  })).sort((a, b) => b.netSales - a.netSales);

  const totalGross = rows.reduce((acc, r) => acc + r.grossSales, 0);
  const totalDiscount = rows.reduce((acc, r) => acc + r.discount, 0);
  const totalGst = rows.reduce((acc, r) => acc + r.gst, 0);
  const totalNet = rows.reduce((acc, r) => acc + r.netSales, 0);

  return {
    summary: {
      totalRecords: rows.length,
      grossSales: totalGross,
      discount: totalDiscount,
      totalGst,
      netSales: totalNet
    },
    rows
  };
}

/**
 * 7. Salesman-wise Performance Report Generator
 */
export function generateSalesmanReportData(
  orders: Order[],
  payments: PaymentRecord[],
  salesmen: Salesman[],
  retailers: Retailer[],
  filters: ReportFilterOptions
) {
  const filteredOrders = filterOrders(orders, filters);
  const filteredPayments = filterPayments(payments, filters);

  const smMap: Record<string, {
    id: string;
    name: string;
    employeeCode: string;
    phone: string;
    assignedBeats: string[];
    totalOrders: number;
    totalSales: number;
    collection: number;
    outstanding: number;
    returns: number;
    customerCount: Set<string>;
    monthlyTarget: number;
  }> = {};

  // Seed with registered salesmen
  salesmen.forEach(sm => {
    smMap[sm.id] = {
      id: sm.id,
      name: sm.name,
      employeeCode: sm.employeeCode || `EMP-${sm.id.slice(-4)}`,
      phone: sm.phone,
      assignedBeats: sm.assignedBeats || [],
      totalOrders: 0,
      totalSales: 0,
      collection: 0,
      outstanding: 0,
      returns: 0,
      customerCount: new Set(),
      monthlyTarget: sm.monthlyTargetAmount || 200000
    };
  });

  // Tally Orders
  filteredOrders.forEach(o => {
    const smId = o.salesmanId || salesmen.find(s => s.name === o.salesmanName)?.id || 'direct';
    if (!smMap[smId]) {
      smMap[smId] = {
        id: smId,
        name: o.salesmanName || 'Head Office / Direct',
        employeeCode: 'DIR-01',
        phone: '+91 98391 23456',
        assignedBeats: [o.beatName || 'General'],
        totalOrders: 0,
        totalSales: 0,
        collection: 0,
        outstanding: 0,
        returns: 0,
        customerCount: new Set(),
        monthlyTarget: 150000
      };
    }

    const entry = smMap[smId];
    if (o.status === 'cancelled') {
      entry.returns += o.grandTotal || 0;
    } else {
      entry.totalOrders++;
      entry.totalSales += o.grandTotal || 0;
      entry.outstanding += o.outstandingAmount || 0;
      if (o.retailerId) entry.customerCount.add(o.retailerId);
    }
  });

  // Tally Collections
  filteredPayments.forEach(p => {
    const smId = salesmen.find(s => s.name === p.collectorName || s.id === (p as any).salesmanId)?.id || 'direct';
    if (smMap[smId]) {
      smMap[smId].collection += p.amount || 0;
    }
  });

  const rows = Object.values(smMap).map(s => {
    const achievementPct = s.monthlyTarget > 0 ? Math.round((s.totalSales / s.monthlyTarget) * 100) : 0;
    return {
      ...s,
      customerCount: s.customerCount.size,
      achievementPct
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const totalOrders = rows.reduce((acc, r) => acc + r.totalOrders, 0);
  const totalSales = rows.reduce((acc, r) => acc + r.totalSales, 0);
  const totalCollection = rows.reduce((acc, r) => acc + r.collection, 0);
  const totalOutstanding = rows.reduce((acc, r) => acc + r.outstanding, 0);

  return {
    summary: {
      totalRecords: rows.length,
      totalOrders,
      totalSales,
      totalCollection,
      totalOutstanding
    },
    rows
  };
}

/**
 * 8. Outstanding & Receivables Report Generator
 */
export function generateOutstandingReportData(
  retailers: Retailer[],
  orders: Order[],
  payments: PaymentRecord[],
  filters: ReportFilterOptions
) {
  const rows = retailers.map(ret => {
    const retOrders = orders.filter(o => o.retailerId === ret.id && o.status !== 'cancelled' && o.status !== 'draft');
    const retPayments = payments.filter(p => p.retailerId === ret.id && p.status === 'confirmed');

    const totalInvoiced = retOrders.reduce((acc, o) => acc + (o.grandTotal || 0), 0);
    const totalPaid = retPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const currentOutstanding = Math.max(0, ret.currentOutstanding ?? (totalInvoiced - totalPaid));
    const creditLimit = ret.creditLimit || 50000;
    const isOverdue = currentOutstanding > creditLimit || ret.status === 'overdue';
    const overdueAmount = isOverdue ? Math.max(0, currentOutstanding - creditLimit) : 0;

    return {
      id: ret.id,
      storeName: ret.storeName,
      ownerName: ret.ownerName,
      phone: ret.phone,
      area: ret.area || 'Utraula',
      beatName: ret.beatName || 'General Beat',
      gstin: ret.gstin || 'Unregistered',
      creditLimit,
      creditDays: ret.creditDaysAllowed || 15,
      totalSales: totalInvoiced,
      totalPaid,
      outstanding: currentOutstanding,
      overdueAmount,
      isOverdue,
      status: ret.status
    };
  }).filter(r => {
    if (filters.onlyOverdue && !r.isOverdue && r.outstanding <= 0) return false;
    if (filters.retailerId && filters.retailerId !== 'all' && r.id !== filters.retailerId) return false;
    if (filters.beatName && filters.beatName !== 'all' && r.beatName !== filters.beatName) return false;
    return true;
  }).sort((a, b) => b.outstanding - a.outstanding);

  const totalOutstanding = rows.reduce((acc, r) => acc + r.outstanding, 0);
  const totalOverdue = rows.reduce((acc, r) => acc + r.overdueAmount, 0);
  const totalSales = rows.reduce((acc, r) => acc + r.totalSales, 0);
  const totalPaid = rows.reduce((acc, r) => acc + r.totalPaid, 0);

  return {
    summary: {
      totalRecords: rows.length,
      totalSales,
      totalPaid,
      totalOutstanding,
      totalOverdue,
      overdueCount: rows.filter(r => r.isOverdue).length
    },
    rows
  };
}

/**
 * 9. Payment Collection Report Generator
 */
export function generatePaymentCollectionReportData(
  payments: PaymentRecord[],
  orders: Order[],
  retailers: Retailer[],
  filters: ReportFilterOptions
) {
  const filtered = filterPayments(payments, filters);

  let cashTotal = 0;
  let upiTotal = 0;
  let bankTotal = 0;
  let chequeTotal = 0;
  let otherTotal = 0;
  let grandTotal = 0;

  const rows = filtered.map(p => {
    const amount = p.amount || 0;
    grandTotal += amount;

    if (p.paymentMode === 'cash') cashTotal += amount;
    else if (p.paymentMode === 'upi') upiTotal += amount;
    else if (p.paymentMode === 'bank_transfer') bankTotal += amount;
    else if (p.paymentMode === 'cheque') chequeTotal += amount;
    else otherTotal += amount;

    return {
      id: p.id,
      date: (p.paymentDate || '').slice(0, 10),
      receiptNumber: p.receiptNumber || 'RCP-PAY',
      customerName: p.retailerName,
      orderNumber: p.orderNumber || '-',
      amount,
      paymentMode: (p.paymentMode || 'cash').toUpperCase(),
      collectedBy: p.collectorName || 'Aryan Staff',
      collectedByRole: p.collectedByRole || 'admin',
      reference: p.transactionRef || '-',
      status: p.status,
      notes: p.notes || ''
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  return {
    summary: {
      totalRecords: rows.length,
      totalCollected: grandTotal,
      cashTotal,
      upiTotal,
      bankTotal,
      chequeTotal,
      otherTotal
    },
    rows
  };
}

/**
 * 10. Customer-wise Sales Report Generator
 */
export function generateCustomerSalesReportData(
  orders: Order[],
  retailers: Retailer[],
  filters: ReportFilterOptions
) {
  const filteredOrders = filterOrders(orders, filters).filter(o => o.status !== 'cancelled');

  const custMap: Record<string, {
    retailerId: string;
    storeName: string;
    ownerName: string;
    phone: string;
    beatName: string;
    area: string;
    gstin: string;
    ordersCount: number;
    casesSold: number;
    grossSales: number;
    discount: number;
    gst: number;
    netSales: number;
    paid: number;
    outstanding: number;
  }> = {};

  filteredOrders.forEach(o => {
    const rid = o.retailerId || 'unknown';
    if (!custMap[rid]) {
      const ret = retailers.find(r => r.id === rid);
      custMap[rid] = {
        retailerId: rid,
        storeName: o.retailerName || ret?.storeName || 'Outlet',
        ownerName: ret?.ownerName || '',
        phone: o.retailerPhone || ret?.phone || '',
        beatName: o.beatName || ret?.beatName || 'General Beat',
        area: ret?.area || 'Utraula',
        gstin: o.retailerGstin || ret?.gstin || 'Unregistered',
        ordersCount: 0,
        casesSold: 0,
        grossSales: 0,
        discount: 0,
        gst: 0,
        netSales: 0,
        paid: 0,
        outstanding: 0
      };
    }

    const entry = custMap[rid];
    entry.ordersCount++;
    entry.grossSales += o.subtotal || 0;
    entry.discount += o.totalDiscount || 0;
    entry.gst += o.totalTax || 0;
    entry.netSales += o.grandTotal || 0;
    entry.paid += o.amountPaid || 0;
    entry.outstanding += o.outstandingAmount || 0;

    o.items?.forEach(it => {
      entry.casesSold += it.cases || 0;
    });
  });

  const rows = Object.values(custMap).sort((a, b) => b.netSales - a.netSales);

  const totalGross = rows.reduce((acc, r) => acc + r.grossSales, 0);
  const totalNet = rows.reduce((acc, r) => acc + r.netSales, 0);
  const totalPaid = rows.reduce((acc, r) => acc + r.paid, 0);
  const totalOutstanding = rows.reduce((acc, r) => acc + r.outstanding, 0);

  return {
    summary: {
      totalRecords: rows.length,
      grossSales: totalGross,
      netSales: totalNet,
      totalPaid,
      totalOutstanding
    },
    rows
  };
}

/**
 * 11. Delivery-wise Report Generator
 */
export function generateDeliveryReportData(
  deliveries: DeliveryRunSheet[],
  orders: Order[],
  filters: ReportFilterOptions
) {
  const { fromDate, toDate } = getDateRangeForPeriod(filters.period, filters.fromDate, filters.toDate);

  const rows = deliveries.filter(d => {
    const dDate = (d.date || '').slice(0, 10);
    if (fromDate && dDate < fromDate) return false;
    if (toDate && dDate > toDate) return false;
    if (filters.deliveryPersonId && filters.deliveryPersonId !== 'all') {
      if (d.driverName !== filters.deliveryPersonId && d.driverPhone !== filters.deliveryPersonId) return false;
    }
    return true;
  }).map(d => {
    const completionRate = d.totalOrders > 0 ? Math.round((d.deliveredOrders / d.totalOrders) * 100) : 0;
    return {
      id: d.id,
      runNumber: d.runNumber,
      date: (d.date || '').slice(0, 10),
      driverName: d.driverName,
      driverPhone: d.driverPhone,
      vehicleNumber: d.vehicleNumber,
      beatNames: (d.beatNames || []).join(', '),
      totalOrders: d.totalOrders || 0,
      deliveredOrders: d.deliveredOrders || 0,
      completionRate,
      totalOrderValue: d.totalOrderValue || 0,
      cashCollected: d.totalCashCollected || 0,
      upiCollected: d.totalUpiCollected || 0,
      totalCollected: (d.totalCashCollected || 0) + (d.totalUpiCollected || 0),
      status: d.status
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  const totalOrders = rows.reduce((acc, r) => acc + r.totalOrders, 0);
  const deliveredOrders = rows.reduce((acc, r) => acc + r.deliveredOrders, 0);
  const totalValue = rows.reduce((acc, r) => acc + r.totalOrderValue, 0);
  const totalCollected = rows.reduce((acc, r) => acc + r.totalCollected, 0);

  return {
    summary: {
      totalRecords: rows.length,
      totalOrders,
      deliveredOrders,
      totalValue,
      totalCollected
    },
    rows
  };
}

/**
 * 12. Returns & Credit Note Report Generator
 */
export function generateReturnsReportData(
  orders: Order[],
  inventoryLogs: InventoryMovement[],
  filters: ReportFilterOptions
) {
  const { fromDate, toDate } = getDateRangeForPeriod(filters.period, filters.fromDate, filters.toDate);

  // Cancelled orders
  const cancelledOrders = orders.filter(o => {
    const oDate = (o.orderDate || '').slice(0, 10);
    if (fromDate && oDate < fromDate) return false;
    if (toDate && oDate > toDate) return false;
    return o.status === 'cancelled';
  });

  // Inward return inventory logs
  const returnLogs = inventoryLogs.filter(l => {
    const lDate = (l.date || '').slice(0, 10);
    if (fromDate && lDate < fromDate) return false;
    if (toDate && lDate > toDate) return false;
    return l.type === 'return_inward' || l.type === 'damage_adjustment';
  });

  let totalReturnAmount = 0;
  let totalCases = 0;
  let totalLoose = 0;

  const rows: {
    id: string;
    date: string;
    type: string;
    reference: string;
    customerOrProduct: string;
    quantity: string;
    amount: number;
    reason: string;
    authorizedBy: string;
  }[] = [];

  cancelledOrders.forEach(o => {
    totalReturnAmount += o.grandTotal || 0;
    const cases = o.items?.reduce((acc, it) => acc + (it.cases || 0), 0) || 0;
    const loose = o.items?.reduce((acc, it) => acc + (it.loosePcs || 0), 0) || 0;
    totalCases += cases;
    totalLoose += loose;

    rows.push({
      id: `ord_${o.id}`,
      date: (o.orderDate || '').slice(0, 10),
      type: 'Order Cancellation / Return Memo',
      reference: o.orderNumber,
      customerOrProduct: o.retailerName,
      quantity: formatQty(cases, loose),
      amount: o.grandTotal || 0,
      reason: o.remarks || o.notes || 'Order cancelled / goods returned',
      authorizedBy: o.salesmanName || 'Admin Desk'
    });
  });

  returnLogs.forEach(l => {
    totalCases += l.cases || 0;
    totalLoose += l.loosePcs || 0;
    rows.push({
      id: `log_${l.id}`,
      date: (l.date || '').slice(0, 10),
      type: l.type === 'return_inward' ? 'Warehouse Physical Return' : 'Damage Stock Adjustment',
      reference: l.referenceId || `LOG-${l.sku}`,
      customerOrProduct: `${l.productName} (${l.sku})`,
      quantity: formatQty(l.cases, l.loosePcs),
      amount: 0,
      reason: l.reason || 'Depot Inward Inspection',
      authorizedBy: l.performedBy || 'Depot Manager'
    });
  });

  rows.sort((a, b) => b.date.localeCompare(a.date));

  return {
    summary: {
      totalRecords: rows.length,
      totalReturnAmount,
      totalCases,
      totalLoose
    },
    rows
  };
}

/**
 * 13. Profit & Margin Summary Generator
 */
export function generateProfitMarginReportData(
  orders: Order[],
  products: Product[],
  filters: ReportFilterOptions
) {
  const filteredOrders = filterOrders(orders, filters).filter(o => o.status !== 'cancelled');

  let totalWholesaleValue = 0;
  let totalMrpValue = 0;
  let totalGrossSales = 0;
  let totalDiscount = 0;
  let totalGst = 0;
  let totalNetSales = 0;
  let totalEstimatedCost = 0;

  const itemBreakdownMap: Record<string, {
    productId: string;
    productName: string;
    sku: string;
    brand: string;
    quantityPieces: number;
    wholesaleValue: number;
    mrpValue: number;
    retailerMarginAmt: number;
    distributorMarginAmt: number;
    marginPercentage: number;
  }> = {};

  filteredOrders.forEach(o => {
    totalGrossSales += o.subtotal || 0;
    totalDiscount += o.totalDiscount || 0;
    totalGst += o.totalTax || 0;
    totalNetSales += o.grandTotal || 0;

    o.items?.forEach(it => {
      const pid = it.productId || it.sku;
      const prod = products.find(p => p.id === pid || p.sku === it.sku);

      const pieces = it.totalPieces || (it.cases * (it as any).piecesPerCase || 0) + it.loosePcs;
      const wholesaleUnitPrice = it.unitPrice || prod?.wholesalePricePiece || 1;
      const mrpUnitPrice = prod?.mrpPiece || (wholesaleUnitPrice * 1.25);
      // FMCG Distributor acquisition cost is roughly 92-94% of wholesale price (6-8% distributor margin)
      const distCostUnitPrice = wholesaleUnitPrice * 0.93;

      const wsVal = wholesaleUnitPrice * pieces;
      const mrpVal = mrpUnitPrice * pieces;
      const costVal = distCostUnitPrice * pieces;
      const retMargin = Math.max(0, mrpVal - wsVal);
      const distMargin = Math.max(0, wsVal - costVal);

      totalWholesaleValue += wsVal;
      totalMrpValue += mrpVal;
      totalEstimatedCost += costVal;

      if (!itemBreakdownMap[pid]) {
        itemBreakdownMap[pid] = {
          productId: pid,
          productName: it.productName || prod?.name || 'FMCG Product',
          sku: it.sku || prod?.sku || '',
          brand: it.brand || prod?.brand || 'General',
          quantityPieces: 0,
          wholesaleValue: 0,
          mrpValue: 0,
          retailerMarginAmt: 0,
          distributorMarginAmt: 0,
          marginPercentage: 0
        };
      }

      const entry = itemBreakdownMap[pid];
      entry.quantityPieces += pieces;
      entry.wholesaleValue += wsVal;
      entry.mrpValue += mrpVal;
      entry.retailerMarginAmt += retMargin;
      entry.distributorMarginAmt += distMargin;
    });
  });

  const rows = Object.values(itemBreakdownMap).map(item => {
    const marginPct = item.wholesaleValue > 0 ? (item.distributorMarginAmt / item.wholesaleValue) * 100 : 7;
    return {
      ...item,
      marginPercentage: Number(marginPct.toFixed(1))
    };
  }).sort((a, b) => b.wholesaleValue - a.wholesaleValue);

  const totalRetailerMargin = Math.max(0, totalMrpValue - totalWholesaleValue);
  const totalDistributorMargin = Math.max(0, totalWholesaleValue - totalEstimatedCost);
  const overallDistMarginPct = totalWholesaleValue > 0 ? (totalDistributorMargin / totalWholesaleValue) * 100 : 7;

  return {
    summary: {
      totalRecords: rows.length,
      netSales: totalNetSales,
      wholesaleValue: totalWholesaleValue,
      mrpValue: totalMrpValue,
      retailerMarginTotal: totalRetailerMargin,
      distributorMarginTotal: totalDistributorMargin,
      distributorMarginPct: Number(overallDistMarginPct.toFixed(1))
    },
    rows
  };
}

/**
 * 14. Purchase & Inward Stock Report Generator
 */
export function generatePurchaseReportData(
  inventoryLogs: InventoryMovement[],
  products: Product[],
  filters: ReportFilterOptions
) {
  const { fromDate, toDate } = getDateRangeForPeriod(filters.period, filters.fromDate, filters.toDate);

  const inwardLogs = inventoryLogs.filter(l => {
    const lDate = (l.date || '').slice(0, 10);
    if (fromDate && lDate < fromDate) return false;
    if (toDate && lDate > toDate) return false;
    return l.type === 'inward' || l.type === 'return_inward';
  });

  let totalCases = 0;
  let totalLoose = 0;
  let totalValuation = 0;

  const rows = inwardLogs.map(l => {
    const prod = products.find(p => p.id === l.productId || p.sku === l.sku);
    const casePrice = prod?.casePrice || ((prod?.wholesalePricePiece || 10) * (prod?.piecesPerCase || 40));
    const approxVal = (l.cases * casePrice) + (l.loosePcs * (prod?.wholesalePricePiece || 10));

    totalCases += l.cases || 0;
    totalLoose += l.loosePcs || 0;
    totalValuation += approxVal;

    return {
      id: l.id,
      date: (l.date || '').slice(0, 10),
      sku: l.sku,
      productName: l.productName,
      brand: prod?.brand || 'FMCG Depot',
      category: prod?.category || 'Staples',
      batchNumber: l.batchNumber || 'FACTORY-BATCH',
      quantity: formatQty(l.cases, l.loosePcs),
      cases: l.cases,
      loosePcs: l.loosePcs,
      approxValue: approxVal,
      reference: l.referenceId || 'PO-DEPOT-INWARD',
      performedBy: l.performedBy || 'Store Incharge'
    };
  }).sort((a, b) => b.date.localeCompare(a.date));

  return {
    summary: {
      totalRecords: rows.length,
      totalCases,
      totalLoose,
      totalValuation
    },
    rows
  };
}
