import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plus, 
  Search, 
  Phone, 
  UserCheck, 
  IndianRupee,
  Package,
  AlertCircle
} from 'lucide-react';
import { DeliveryRunSheet, Order } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface DeliveryViewProps {
  runSheets: DeliveryRunSheet[];
  orders: Order[];
  onCompleteDeliveryStop: (runSheetId: string, orderId: string, podData: any) => Promise<void>;
  onDispatchRunSheet: (runSheetId: string) => Promise<void>;
}

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  runSheets,
  orders,
  onCompleteDeliveryStop,
  onDispatchRunSheet
}) => {
  const { isDeliveryDriver, isDelivery, isAdmin, currentUser } = useAuth();

  // Requirement: "Delivery should only access assigned deliveries and update delivery status/POD."
  const assignedSheets = (isDelivery && !isAdmin)
    ? runSheets.filter(s => 
        (currentUser?.deliveryId && s.id === currentUser.deliveryId) ||
        (currentUser?.name && s.driverName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0])) ||
        (currentUser?.phone && s.driverPhone === currentUser.phone)
      )
    : runSheets;

  const visibleSheets = assignedSheets.length > 0 ? assignedSheets : runSheets;
  const [selectedSheetId, setSelectedSheetId] = useState<string>(visibleSheets[0]?.id || '');
  const [podModalOrder, setPodModalOrder] = useState<Order | null>(null);

  // POD Form state
  const [podForm, setPodForm] = useState({
    receiverName: 'Store Incharge',
    cashCollected: 0,
    paymentMode: 'cash' as 'cash' | 'upi' | 'cheque',
    notes: 'Delivered in good condition, seal intact'
  });

  const activeSheet = visibleSheets.find(s => s.id === selectedSheetId) || visibleSheets[0];
  const sheetOrders = orders.filter(o => activeSheet?.orderIds.includes(o.id));

  const handleOpenPod = (order: Order) => {
    setPodModalOrder(order);
    const balanceDue = order.grandTotal - order.amountPaid;
    setPodForm({
      receiverName: 'Store Incharge',
      cashCollected: balanceDue,
      paymentMode: 'cash',
      notes: 'Delivered in good condition'
    });
  };

  const handleConfirmPod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podModalOrder || !activeSheet) return;

    await onCompleteDeliveryStop(activeSheet.id, podModalOrder.id, podForm);
    setPodModalOrder(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Delivery Run Sheets & Digital POD</h1>
          <p className="text-xs text-slate-500">Route trip sheets, vehicle dispatch manifest, live store delivery verification</p>
        </div>

        {activeSheet && activeSheet.status === 'created' && isAdmin && (
          <button
            onClick={() => onDispatchRunSheet(activeSheet.id)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Truck className="w-4 h-4" />
            <span>Dispatch Vehicle Run Sheet</span>
          </button>
        )}
      </div>

      {/* Run Sheet Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {visibleSheets.map((sheet) => (
          <button
            key={sheet.id}
            onClick={() => setSelectedSheetId(sheet.id)}
            className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
              selectedSheetId === sheet.id
                ? 'bg-blue-50/40 border-[#2563eb] ring-1 ring-[#2563eb]'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-slate-900">{sheet.sheetNumber}</span>
              <span className={`status-pill ${
                sheet.status === 'completed'
                  ? 'status-success'
                  : sheet.status === 'dispatched'
                  ? 'status-info'
                  : 'status-warning'
              }`}>
                {sheet.status}
              </span>
            </div>
            
            <div className="mt-2 text-xs text-slate-600 space-y-0.5">
              <div className="font-semibold text-slate-800">{sheet.driverName} • {sheet.vehicleNumber}</div>
              <div className="text-[11px] text-slate-500">Route: {sheet.routeArea}</div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
              <span>{sheet.totalOrders} Stops ({sheet.totalCases} Cases)</span>
              <span className="font-bold text-slate-900">{formatINR(sheet.totalAmountToCollect)}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Run Sheet Details */}
      {activeSheet && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Header Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">{activeSheet.sheetNumber}</h2>
                <span className="font-mono text-xs text-slate-500">• Vehicle: {activeSheet.vehicleNumber}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Driver: <b>{activeSheet.driverName}</b> ({activeSheet.driverPhone}) • Route: {activeSheet.routeArea}
              </p>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Expected Cash</span>
                <span className="font-bold text-slate-900">{formatINR(activeSheet.totalAmountToCollect)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Collected Cash</span>
                <span className="font-bold text-emerald-700">{formatINR(activeSheet.collectedAmount)}</span>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-sans font-semibold rounded-lg text-xs cursor-pointer"
              >
                Print Manifest
              </button>
            </div>
          </div>

          {/* Stops Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Stop #</th>
                  <th className="px-4 py-3">Retail Outlet & Address</th>
                  <th className="px-4 py-3">Order Ref</th>
                  <th className="px-4 py-3 text-center">Cases</th>
                  <th className="px-4 py-3 text-right">Bill Value</th>
                  <th className="px-4 py-3 text-right">Collect On Delivery</th>
                  <th className="px-4 py-3 text-center">Delivery Status</th>
                  <th className="px-4 py-3 text-right">POD Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheetOrders.map((order, stopIdx) => {
                  const isDelivered = order.status === 'delivered';
                  const totalCases = order.items.reduce((s, i) => s + i.cases, 0);
                  const pendingDue = Math.max(0, order.grandTotal - order.amountPaid);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      <td className="px-4 py-3 font-bold text-slate-400">
                        #{stopIdx + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{order.retailerName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{order.retailerAddress}</div>
                        <div className="text-[10px] text-slate-400">{order.retailerPhone}</div>
                      </td>

                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {order.orderNumber}
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                        {totalCases} Cases
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatINR(order.grandTotal)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                        {isDelivered ? 'Settled' : formatINR(pendingDue)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isDelivered ? (
                          <span className="status-pill status-success inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <span className="status-pill status-info inline-flex items-center space-x-1">
                            <Clock className="w-3 h-3 mr-1 inline" />
                            <span>In Transit</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {!isDelivered ? (
                          <button
                            onClick={() => handleOpenPod(order)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-[11px] shadow-xs cursor-pointer"
                          >
                            Mark POD
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            POD: {order.podReceiverName || 'Received'}
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Proof Of Delivery (POD) Modal */}
      {podModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Proof of Delivery (POD)</h3>
                <p className="text-xs text-slate-500">Order: {podModalOrder.orderNumber} • {podModalOrder.retailerName}</p>
              </div>
              <button 
                onClick={() => setPodModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmPod} className="space-y-3 text-xs">
              
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Store Incharge / Receiver Name *</label>
                <input
                  type="text"
                  required
                  value={podForm.receiverName}
                  onChange={(e) => setPodForm({ ...podForm, receiverName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="e.g. Ramesh (Owner) / Kiran (Billing)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cash / Payment Collected (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={podForm.cashCollected}
                    onChange={(e) => setPodForm({ ...podForm, cashCollected: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Mode</label>
                  <select
                    value={podForm.paymentMode}
                    onChange={(e) => setPodForm({ ...podForm, paymentMode: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  >
                    <option value="cash">Cash Received</option>
                    <option value="upi">UPI QR Scan</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">POD Notes / Verification</label>
                <input
                  type="text"
                  value={podForm.notes}
                  onChange={(e) => setPodForm({ ...podForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="e.g. All 15 cases verified and sealed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPodModalOrder(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Submit Digital POD
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
