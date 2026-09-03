import React, { useState } from 'react';
import { 
  IndianRupee, 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Download, 
  ArrowDownRight,
  Landmark,
  CreditCard
} from 'lucide-react';
import { Payment, Retailer } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface PaymentsViewProps {
  payments: Payment[];
  retailers: Retailer[];
  onRecordPayment: (paymentData: any) => Promise<void>;
  preselectedRetailer?: Retailer | null;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  retailers,
  onRecordPayment,
  preselectedRetailer
}) => {
  const { isAdmin, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form state
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

  const filteredPayments = payments.filter(p => {
    const matchesMode = modeFilter === 'all' || p.paymentMode === modeFilter;
    const matchesSearch = 
      p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.retailerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMode && matchesSearch;
  });

  // Calculate stats
  const totalCollections = payments.reduce((s, p) => s + p.amount, 0);
  const cashTotal = payments.filter(p => p.paymentMode === 'cash').reduce((s, p) => s + p.amount, 0);
  const upiTotal = payments.filter(p => p.paymentMode === 'upi').reduce((s, p) => s + p.amount, 0);
  const chequeTotal = payments.filter(p => p.paymentMode === 'cheque' || p.paymentMode === 'bank_transfer').reduce((s, p) => s + p.amount, 0);

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

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Payment Collections & Treasury</h1>
          <p className="text-xs text-slate-500">Retailer collection receipts, UPI QR payments, cheque clearing, and bank reconciliations</p>
        </div>

        <button
          onClick={() => handleOpenRecord()}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Payment Receipt</span>
        </button>
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
              {filteredPayments.map((payment) => (
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

                  <td className="px-4 py-3 text-slate-700">
                    {payment.collectedBy}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="status-pill status-success inline-flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                      <span>{payment.status}</span>
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 transition-colors cursor-pointer"
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

      {/* Record Payment Modal */}
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
                &times;
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

    </div>
  );
};
