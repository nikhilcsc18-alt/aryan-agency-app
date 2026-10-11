import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  Clock, 
  Store, 
  ShoppingBag, 
  FileText, 
  AlertCircle,
  MapPin,
  IndianRupee,
  Calendar
} from 'lucide-react';
import { SalesmanVisit, VisitCheckOutPayload, Order } from '../types';
import { api, formatINR } from '../lib/api';

interface VisitCheckOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: SalesmanVisit;
  orders?: Order[];
  onCheckOutSuccess: (updatedVisit: SalesmanVisit) => void;
}

export const VisitCheckOutModal: React.FC<VisitCheckOutModalProps> = ({
  isOpen,
  onClose,
  visit,
  orders = [],
  onCheckOutSuccess
}) => {
  const [notes, setNotes] = useState(visit.notes || '');
  const [orderTotalAmount, setOrderTotalAmount] = useState<number | ''>(visit.orderTotalAmount || '');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(visit.orderCreatedId || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate duration elapsed
  const checkInDate = new Date(visit.checkInTime);
  const now = new Date();
  const elapsedMinutes = Math.max(1, Math.round((now.getTime() - checkInDate.getTime()) / 60000));

  // Filter orders booked today for this retailer
  const retailerOrdersToday = orders.filter(o => 
    o.retailerId === visit.retailerId &&
    o.orderDate && o.orderDate.slice(0, 10) === now.toISOString().slice(0, 10)
  );

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrderId(orderId);
    const matched = retailerOrdersToday.find(o => o.id === orderId);
    if (matched) {
      setOrderTotalAmount(matched.grandTotal || 0);
    }
  };

  const handleConfirmCheckOut = async () => {
    setError(null);
    try {
      setSubmitting(true);
      const payload: VisitCheckOutPayload = {
        notes: notes.trim(),
        orderCreatedId: selectedOrderId || undefined,
        orderTotalAmount: orderTotalAmount !== '' ? Number(orderTotalAmount) : undefined
      };

      const res = await api.checkOutVisit(visit.id, payload);
      if (res.success && res.visit) {
        onCheckOutSuccess(res.visit);
        onClose();
      } else {
        setError(res.message || 'Failed to complete visit check-out');
      }
    } catch (err: any) {
      console.error('Check-out error:', err);
      setError(err?.message || 'Check-out failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black tracking-tight truncate">Complete Shop Visit</h3>
              <p className="text-xs text-emerald-100 truncate">
                {visit.retailerName} • {visit.beatName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Active Visit Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>{visit.retailerName}</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Checked In
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Check-In Time</span>
                <span className="font-medium text-slate-800">
                  {new Date(visit.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Time Spent at Store</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{elapsedMinutes} minutes</span>
                </span>
              </div>
            </div>

            {visit.distanceMetres !== undefined && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Verified GPS Distance:</span>
                <span className="font-mono font-bold text-slate-700">{visit.distanceMetres}m from counter</span>
              </div>
            )}

            {/* Visit Photo Thumbnail */}
            {visit.photoUrl && (
              <div className="pt-2 border-t border-slate-200 flex items-center space-x-2.5">
                <img
                  src={visit.photoUrl}
                  alt="Visit check-in proof"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-300 shadow-xs shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-800 block">Live Photo Proof</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    GPS & timestamp watermarked
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Link Order Booked During Visit */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
            <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Order Booked During Visit (Optional)</span>
            </label>

            {retailerOrdersToday.length > 0 && (
              <div>
                <label className="text-[11px] text-slate-600 block mb-1">
                  Select Today's Punched Order:
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- No order booked / Inquiry visit only --</option>
                  {retailerOrdersToday.map(ord => (
                    <option key={ord.id} value={ord.id}>
                      {ord.orderNumber} • {formatINR(ord.grandTotal)} ({ord.items?.length || 0} items)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-600 block mb-1">
                Order Total Value (₹):
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  value={orderTotalAmount}
                  onChange={(e) => setOrderTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Visit Summary / Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Visit Summary & Feedback</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Stock replenished with 10 cases Parle-G. Retailer requested delivery tomorrow morning. Collected ₹15,000 cash against overdue invoice."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-[11px]">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Total visit time: <strong className="text-slate-800">{elapsedMinutes} mins</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmCheckOut}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Checking Out...' : 'Complete Visit'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
