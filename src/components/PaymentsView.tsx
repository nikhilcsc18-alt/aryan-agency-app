import React, { useState } from 'react';
import { 
  IndianRupee, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download, 
  Printer,
  Receipt,
  Store,
  Calendar,
  CreditCard,
  Building2,
  X,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Payment, Retailer, Order } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface PaymentsViewProps {
  payments: Payment[];
  retailers: Retailer[];
  orders?: Order[];
  onOpenInvoice?: (order: Order) => void;
  onRecordPayment: (paymentData: any) => Promise<void>;
  preselectedRetailer?: Retailer | null;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  retailers,
  orders = [],
  onOpenInvoice,
  onRecordPayment,
  preselectedRetailer
}) => {
  const { isAdmin, isSalesman, isAccounts, isRetailer, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [retailerTab, setRetailerTab] = useState<'receipts' | 'invoices' | 'ledger'>('receipts');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<Payment | null>(null);

  // Form state for Admin/Salesman collections
  const [paymentForm, setPaymentForm] = useState({
    retailerId: preselectedRetailer?.id || retailers[0]?.id || '',
    amount: 15000,
    paymentMode: 'upi' as 'cash' | 'upi' | 'cheque' | 'bank_transfer',
    referenceNumber: `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`,
    chequeNumber: '',
    chequeDate: '',
    bankName: '',
    notes: 'Payment received towards outstanding balance'
  });

  // Find current retailer record for logged-in retailer
  const currentRetailer = isRetailer
    ? retailers.find(r => 
        (currentUser?.retailerId && r.id === currentUser.retailerId) ||
        (currentUser?.name && (
          r.storeName.toLowerCase() === currentUser.name.toLowerCase() ||
          r.storeName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(r.storeName.toLowerCase())
        )) ||
        (currentUser?.phone && r.phone && r.phone.includes(currentUser.phone.replace(/\D/g, '').slice(-10)))
      ) || retailers[0]
    : null;

  // Retailer-scoped payments
  const retailerPayments = payments.filter(p => {
    if (!isRetailer) return true;
    const matchId = (currentRetailer && p.retailerId === currentRetailer.id) ||
                    (currentUser?.retailerId && p.retailerId === currentUser.retailerId);
    const matchName = (currentRetailer && p.retailerName.toLowerCase() === currentRetailer.storeName.toLowerCase()) ||
                      (currentUser?.name && p.retailerName.toLowerCase().includes(currentUser.name.toLowerCase()));
    return Boolean(matchId || matchName);
  });

  // Retailer-scoped orders
  const retailerOrders = orders.filter(o => {
    if (!isRetailer) return true;
    const matchId = (currentRetailer && o.retailerId === currentRetailer.id) ||
                    (currentUser?.retailerId && o.retailerId === currentUser.retailerId);
    const matchName = (currentRetailer && o.retailerName.toLowerCase() === currentRetailer.storeName.toLowerCase()) ||
                      (currentUser?.name && o.retailerName.toLowerCase().includes(currentUser.name.toLowerCase()));
    return Boolean(matchId || matchName);
  });

  // Filtered payments for display
  const displayPayments = (isRetailer ? retailerPayments : payments).filter(p => {
    const matchesMode = modeFilter === 'all' || p.paymentMode === modeFilter;
    const matchesSearch =
      p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.retailerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMode && matchesSearch;
  });

  // Filtered invoices for retailer display
  const displayInvoices = retailerOrders.filter(o => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Build Chronological Ledger for Retailer
  const ledgerEntries = React.useMemo(() => {
    if (!isRetailer) return [];

    const events: Array<{
      id: string;
      date: string;
      type: 'invoice' | 'payment';
      refNumber: string;
      description: string;
      debit: number;
      credit: number;
      status: string;
      orderRef?: Order;
      paymentRef?: Payment;
    }> = [];

    // Add Invoices (Debits)
    retailerOrders.forEach(o => {
      events.push({
        id: `inv-${o.id}`,
        date: o.orderDate,
        type: 'invoice',
        refNumber: o.orderNumber,
        description: `B2B Wholesale Invoice • ${o.items.length} SKUs (${o.items.reduce((s, i) => s + i.cases, 0)} cs)`,
        debit: o.grandTotal,
        credit: 0,
        status: o.paymentStatus || 'unpaid',
        orderRef: o
      });
    });

    // Add Payments (Credits)
    retailerPayments.forEach(p => {
      events.push({
        id: `pay-${p.id}`,
        date: p.date,
        type: 'payment',
        refNumber: p.receiptNumber,
        description: `Payment Credited (${p.paymentMode.toUpperCase()}) ${p.referenceNumber ? `• Ref: ${p.referenceNumber}` : ''}`,
        debit: 0,
        credit: p.amount,
        status: p.status || 'verified',
        paymentRef: p
      });
    });

    // Sort chronologically ascending to calculate running balance
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const withRunningBalance = events.map(ev => {
      running += (ev.debit - ev.credit);
      return {
        ...ev,
        runningBalance: running
      };
    });

    // Return descending for latest first display
    return withRunningBalance.reverse();
  }, [isRetailer, retailerOrders, retailerPayments]);

  // General metrics for Admin/Salesman Collections & Treasury
  const totalCollections = payments.reduce((s, p) => s + p.amount, 0);
  const cashTotal = payments.filter(p => p.paymentMode === 'cash').reduce((s, p) => s + p.amount, 0);
  const upiTotal = payments.filter(p => p.paymentMode === 'upi').reduce((s, p) => s + p.amount, 0);
  const chequeTotal = payments.filter(p => p.paymentMode === 'cheque' || p.paymentMode === 'bank_transfer').reduce((s, p) => s + p.amount, 0);

  // Retailer personal metrics
  const retailerOutstanding = currentRetailer?.currentOutstanding ?? 0;
  const retailerCreditLimit = currentRetailer?.creditLimit ?? 0;
  const retailerCreditDays = currentRetailer?.creditDaysAllowed ?? 15;
  const retailerAvailableCredit = Math.max(0, retailerCreditLimit - retailerOutstanding);
  const retailerTotalPaid = retailerPayments.reduce((s, p) => s + p.amount, 0);
  const retailerTotalInvoiced = retailerOrders.reduce((s, o) => s + o.grandTotal, 0);

  const handleOpenRecord = (ret?: Retailer) => {
    setPaymentForm({
      retailerId: ret?.id || preselectedRetailer?.id || retailers[0]?.id || '',
      amount: ret?.currentOutstanding || 15000,
      paymentMode: 'upi',
      referenceNumber: `UPI/2026/${Math.floor(100000 + Math.random() * 900000)}`,
      chequeNumber: '',
      chequeDate: '',
      bankName: '',
      notes: 'Payment received towards outstanding ledger dues'
    });
    setIsRecordModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ret = retailers.find(r => r.id === paymentForm.retailerId);
    if (!ret) return;

    await onRecordPayment({
      ...paymentForm,
      retailerName: ret.storeName,
      collectedBy: currentUser?.name || 'Aryan Agency Staff'
    });
    setIsRecordModalOpen(false);
  };

  // =========================================================================
  // 1. RETAILER VIEW: "My Payments & Ledger"
  // Completely removes: Record Payment Receipt, Cash in Hand, Van & DSR Collections,
  // Treasury, Collection management, Collected By, Bank reconciliation.
  // Replaces with: Outstanding Balance, Invoice History, Payment History,
  // Payment Receipts, Credit Ledger.
  // =========================================================================
  if (isRetailer) {
    return (
      <div className="space-y-5 animate-in fade-in duration-150">
        
        {/* Retailer Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">My Payments & Ledger</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                {currentRetailer?.storeName || 'Retailer Account'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Statement of accounts, verified payment receipts, wholesale invoice billing history, and credit ledger
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              title="Print Account Statement"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Statement</span>
            </button>
          </div>
        </div>

        {/* Retailer Summary Cards: Outstanding Balance, Payments, Credit Limit, Invoiced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Outstanding Balance */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Outstanding Balance</span>
              <IndianRupee className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
              {formatINR(retailerOutstanding)}
            </span>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
              <span className="text-slate-500">Credit Limit</span>
              <span className="font-mono font-semibold text-slate-700">{formatINR(retailerCreditLimit)}</span>
            </div>
          </div>

          {/* Total Payments Made */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Payment History</span>
              <Receipt className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
              {formatINR(retailerTotalPaid)}
            </span>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
              <span className="text-slate-500">Verified Receipts</span>
              <span className="font-semibold text-emerald-700">{retailerPayments.length} Receipts</span>
            </div>
          </div>

          {/* Credit Terms & Available Credit */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Available Credit</span>
              <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
            </div>
            <span className="text-xl font-bold font-mono text-[#2563eb] mt-1 block">
              {formatINR(retailerAvailableCredit)}
            </span>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
              <span className="text-slate-500">Credit Period</span>
              <span className="font-semibold text-slate-700">{retailerCreditDays} Days Terms</span>
            </div>
          </div>

          {/* Invoice History Total */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Invoice History</span>
              <FileText className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-xl font-bold font-mono text-slate-800 mt-1 block">
              {formatINR(retailerTotalInvoiced)}
            </span>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
              <span className="text-slate-500">Billed Orders</span>
              <span className="font-semibold text-slate-700">{retailerOrders.length} Invoices</span>
            </div>
          </div>

        </div>

        {/* Section Navigation Tabs: Payment Receipts, Invoice History, Credit Ledger */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setRetailerTab('receipts')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                retailerTab === 'receipts'
                  ? 'bg-[#1e293b] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Payment Receipts ({retailerPayments.length})</span>
            </button>

            <button
              onClick={() => setRetailerTab('invoices')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                retailerTab === 'invoices'
                  ? 'bg-[#1e293b] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Invoice History ({retailerOrders.length})</span>
            </button>

            <button
              onClick={() => setRetailerTab('ledger')}
              className={`px-3.5 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                retailerTab === 'ledger'
                  ? 'bg-[#1e293b] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Credit Ledger Statement</span>
            </button>
          </div>

          {/* Search bar within tabs */}
          {retailerTab !== 'ledger' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={retailerTab === 'receipts' ? "Search receipt # or ref..." : "Search invoice # or product..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          )}
        </div>

        {/* TAB 1: Payment Receipts & History */}
        {retailerTab === 'receipts' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            {displayPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Receipt className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700">No payment receipts found</p>
                <p className="text-xs text-slate-400 mt-0.5">When payments are settled towards wholesale orders, receipts will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Receipt # & Date</th>
                      <th className="px-4 py-3">Payment Mode</th>
                      <th className="px-4 py-3">Reference / Transaction ID</th>
                      <th className="px-4 py-3 text-right">Amount Paid</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-slate-900">{payment.receiptNumber}</div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Calendar className="w-3 h-3 inline text-slate-400" />
                            <span>{new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="status-pill status-info uppercase text-[10px] font-bold">
                            {payment.paymentMode.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                          {payment.referenceNumber || payment.chequeNumber || 'DIRECT SETTLEMENT'}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 text-sm">
                          {formatINR(payment.amount)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="status-pill status-success inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1 inline" />
                            <span className="capitalize">{payment.status || 'Verified'}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setActiveReceiptModal(payment)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                            title="View Money Receipt"
                          >
                            <Receipt className="w-3 h-3 inline mr-1" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Invoice History */}
        {retailerTab === 'invoices' && (
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            {displayInvoices.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="font-semibold text-slate-700">No wholesale invoices found</p>
                <p className="text-xs text-slate-400 mt-0.5">Orders placed through the catalog will appear here as GST tax invoices.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Invoice / Order #</th>
                      <th className="px-4 py-3">Billing Date</th>
                      <th className="px-4 py-3">Items Summary</th>
                      <th className="px-4 py-3 text-right">Taxable</th>
                      <th className="px-4 py-3 text-right">GST Total</th>
                      <th className="px-4 py-3 text-right">Total Bill</th>
                      <th className="px-4 py-3 text-center">Payment Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayInvoices.map((order) => {
                      const totalCases = order.items.reduce((s, i) => s + i.cases, 0);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                            <span className="text-[10px] text-slate-400">GST B2B Tax Invoice</span>
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{order.items.length} SKUs ({totalCases} cs)</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]" title={order.items.map(i => i.productName).join(', ')}>
                              {order.items.map(i => i.productName.split(' ')[0]).join(', ')}
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            {formatINR(order.totalTaxable)}
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            {formatINR(order.totalTax)}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                            {formatINR(order.grandTotal)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <span className={`status-pill ${
                              order.paymentStatus === 'paid'
                                ? 'status-success'
                                : order.paymentStatus === 'partial'
                                ? 'status-warning'
                                : 'status-danger'
                            }`}>
                              {order.paymentStatus || 'unpaid'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            {onOpenInvoice && (
                              <button
                                onClick={() => onOpenInvoice(order)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                title="View & Print GST Tax Invoice"
                              >
                                <FileText className="w-3 h-3 inline mr-1" />
                                <span>GST Invoice</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Credit Ledger Statement */}
        {retailerTab === 'ledger' && (
          <div className="space-y-4">
            {/* Ledger Store Summary Header */}
            <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400 font-medium">B2B Account Ledger Statement</div>
                <h3 className="text-base font-bold tracking-tight text-white mt-0.5">
                  {currentRetailer?.storeName || currentUser?.name || 'Retail Outlet'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  GSTIN: {currentRetailer?.gstin || 'Unregistered'} • Route: {currentRetailer?.beatName || 'Bangalore Central'} • Credit Limit: {formatINR(retailerCreditLimit)}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-700 sm:pl-6">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Closing Dues Balance</span>
                <span className="text-xl font-mono font-bold text-amber-400 block mt-0.5">
                  {formatINR(retailerOutstanding)}
                </span>
                <span className="text-[10px] text-slate-300 block">
                  {retailerOutstanding <= retailerCreditLimit ? 'Within Approved Credit Terms' : 'Credit Overdue'}
                </span>
              </div>
            </div>

            {/* Ledger Statement Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
              {ledgerEntries.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-semibold text-slate-700">No ledger transactions yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">All billed wholesale orders (debits) and payment receipts (credits) will automatically compile here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Transaction Particulars</th>
                        <th className="px-4 py-3">Reference / Doc #</th>
                        <th className="px-4 py-3 text-right">Debit (Invoice)</th>
                        <th className="px-4 py-3 text-right">Credit (Payment)</th>
                        <th className="px-4 py-3 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>

                          <td className="px-4 py-3 font-medium text-slate-900">
                            <div className="flex items-center space-x-1.5">
                              {entry.type === 'invoice' ? (
                                <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              ) : (
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                              <span>{entry.description}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                            {entry.refNumber}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-semibold text-rose-600">
                            {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">
                            {entry.credit > 0 ? formatINR(entry.credit) : '—'}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 text-sm">
                            {formatINR(entry.runningBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Money Receipt Modal for Retailer */}
        {activeReceiptModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Official Money Receipt</h3>
                    <p className="text-[11px] text-slate-500">Aryan Agency FMCG Distribution</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveReceiptModal(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Receipt Voucher #</span>
                  <span className="font-mono font-bold text-slate-900">{activeReceiptModal.receiptNumber}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Receipt Date</span>
                  <span className="font-medium text-slate-800">
                    {new Date(activeReceiptModal.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Retail Outlet</span>
                  <span className="font-bold text-slate-900">{activeReceiptModal.retailerName}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Payment Mode</span>
                  <span className="status-pill status-info uppercase text-[10px] font-bold">
                    {activeReceiptModal.paymentMode.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Reference / UTR / Cheque #</span>
                  <span className="font-mono text-slate-700">{activeReceiptModal.referenceNumber || 'DIRECT'}</span>
                </div>
                <div className="flex justify-between pt-1 text-sm font-bold">
                  <span className="text-slate-800">Amount Received & Credited</span>
                  <span className="font-mono text-emerald-700">{formatINR(activeReceiptModal.amount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Money Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // =========================================================================
  // 2. SALESMAN / ADMIN / ACCOUNTS VIEW: "Payment Collections & Treasury"
  // Displays full treasury metrics, collections by mode, collected-by logs,
  // and "+ Record Payment Receipt" action.
  // =========================================================================
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Payment Collections & Treasury</h1>
          <p className="text-xs text-slate-500">Retailer collection receipts, UPI QR payments, cheque clearing, and bank reconciliations</p>
        </div>

        {(isAdmin || isSalesman || isAccounts) && (
          <button
            onClick={() => handleOpenRecord()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Payment Receipt</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Total Collections</span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">{formatINR(totalCollections)}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">{payments.length} Receipts Processed</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">UPI / QR Scan</span>
          <span className="text-lg font-bold font-mono text-[#2563eb] mt-0.5 block">{formatINR(upiTotal)}</span>
          <span className="text-[10px] text-emerald-600 mt-1 block font-medium">Instant Bank Settlement</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Cash in Hand</span>
          <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">{formatINR(cashTotal)}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Van & DSR collections</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">Cheque / Bank Transfer</span>
          <span className="text-lg font-bold font-mono text-slate-700 mt-0.5 block">{formatINR(chequeTotal)}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Subject to clearing</span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Receipt #, Store, or Ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="all">All Modes</option>
            <option value="upi">UPI / QR</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Receipt & Date</th>
                <th className="px-4 py-3">Retail Outlet</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Reference / Cheque #</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3">Collected By</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                  
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-slate-900">{payment.receiptNumber}</div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(payment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {payment.retailerName}
                  </td>

                  <td className="px-4 py-3">
                    <span className="status-pill status-info">
                      {payment.paymentMode.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                    {payment.referenceNumber || payment.chequeNumber || 'CASH RECEIPT'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                    {formatINR(payment.amount)}
                  </td>

                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {payment.collectedBy || 'Staff'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="status-pill status-success inline-flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                      <span>{payment.status}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setActiveReceiptModal(payment)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 transition-colors cursor-pointer border border-slate-200"
                      title="Print Money Receipt"
                    >
                      Receipt
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal (Salesman / Admin Only) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Payment & Money Receipt</h3>
                <p className="text-xs text-slate-500">Collect dues from retailer and credit their ledger balance</p>
              </div>
              <button 
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Retailer *</label>
                <select
                  value={paymentForm.retailerId}
                  onChange={(e) => {
                    const ret = retailers.find(r => r.id === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      retailerId: e.target.value,
                      amount: ret?.currentOutstanding || 15000
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  required
                >
                  {retailers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.storeName} ({r.beatName}) • Dues: {formatINR(r.currentOutstanding)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount Collected (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Mode *</label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  >
                    <option value="upi">UPI / Instant QR</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">NEFT / RTGS / IMPS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reference / UTR / Cheque Number</label>
                <input
                  type="text"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="e.g. UPI Ref # or Bank UTR"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm & Credit Ledger
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Money Receipt Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Money Receipt</h3>
                  <p className="text-[11px] text-slate-500">Aryan Agency FMCG Distribution</p>
                </div>
              </div>
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Receipt Voucher #</span>
                <span className="font-mono font-bold text-slate-900">{activeReceiptModal.receiptNumber}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Receipt Date</span>
                <span className="font-medium text-slate-800">
                  {new Date(activeReceiptModal.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Retail Outlet</span>
                <span className="font-bold text-slate-900">{activeReceiptModal.retailerName}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Payment Mode</span>
                <span className="status-pill status-info uppercase text-[10px] font-bold">
                  {activeReceiptModal.paymentMode.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Reference / UTR / Cheque #</span>
                <span className="font-mono text-slate-700">{activeReceiptModal.referenceNumber || 'DIRECT'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Collected By</span>
                <span className="font-medium text-slate-800">{activeReceiptModal.collectedBy || 'Aryan Agency'}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-slate-800">Amount Received</span>
                <span className="font-mono text-emerald-700">{formatINR(activeReceiptModal.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
