import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  FileText, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  PackageCheck,
  IndianRupee,
  Calendar,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface OrdersViewProps {
  orders: Order[];
  onOpenNewOrder: () => void;
  onOpenInvoice: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, extra?: any) => Promise<void>;
  onOpenDeliveryRun?: () => void;
  onDeleteOrder?: (id: string) => Promise<void>;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOpenNewOrder,
  onOpenInvoice,
  onUpdateStatus,
  onOpenDeliveryRun,
  onDeleteOrder
}) => {
  const { currentUser, currentRole, isAdmin, isSalesman } = useAuth();
  const isDelivery = currentRole === 'delivery';
  const isRetailer = currentRole === 'retailer';

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeat, setSelectedBeat] = useState<string>('all');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const roleScopedOrders = orders.filter(order => {
    if (isAdmin || currentRole === 'accounts') return true;
    if (isSalesman) {
      return order.salesmanId === currentUser?.salesmanId || 
             (currentUser?.name && order.salesmanName?.toLowerCase().includes(currentUser.name.toLowerCase()));
    }
    if (isDelivery) {
      return order.status === 'dispatched' || order.status === 'packed' || order.status === 'delivered';
    }
    if (isRetailer) {
      return order.retailerId === currentUser?.retailerId || 
             (currentUser?.name && order.retailerName?.toLowerCase().includes(currentUser.name.toLowerCase()));
    }
    return true;
  });

  const baseOrders = (roleScopedOrders.length > 0 || isSalesman || isDelivery || isRetailer)
    ? roleScopedOrders
    : orders;

  const beats = Array.from(new Set(baseOrders.map(o => o.beatName))).filter(Boolean);

  const visibleOrders = currentUser?.role === 'retailer'
  ? baseOrders.filter(order => order.retailerId === currentUser.retailerId)
  : baseOrders;

const filteredOrders = visibleOrders.filter(order => {

  const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

  const matchesBeat = selectedBeat === 'all' || order.beatName === selectedBeat;

  const matchesSearch =
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.retailerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.salesmanName && order.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()));

  return matchesStatus && matchesBeat && matchesSearch;

});

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'dispatched':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'packed':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'confirmed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'booked':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Orders & Dispatch Pipeline</h1>
          <p className="text-xs text-slate-500">Manage FMCG indents, warehouse packing, vehicle dispatch, and delivery status</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenNewOrder}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Punch New Order</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order #, Store, or Salesman..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Beat Route Filter */}
          <div>
            <select
              value={selectedBeat}
              onChange={(e) => setSelectedBeat(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="all">All Beat Routes ({beats.length})</option>
              {beats.map(beat => (
                <option key={beat} value={beat}>{beat}</option>
              ))}
            </select>
          </div>

          {/* Status Quick Count Summary */}
          <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
            Showing {filteredOrders.length} of {orders.length} Total Orders
          </div>

        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            { id: 'booked', label: 'Booked', count: orders.filter(o => o.status === 'booked').length },
            { id: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.status === 'confirmed').length },
            { id: 'packed', label: 'Packed', count: orders.filter(o => o.status === 'packed').length },
            { id: 'dispatched', label: 'Dispatched', count: orders.filter(o => o.status === 'dispatched').length },
            { id: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#1e293b] text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === tab.id ? 'bg-[#2563eb] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Order Details</th>
                <th className="px-4 py-3">Retailer & Beat</th>
                <th className="px-4 py-3">Booked By</th>
                <th className="px-4 py-3">Items Summary</th>
                <th className="px-4 py-3 text-right">Taxable</th>
                <th className="px-4 py-3 text-right">GST</th>
                <th className="px-4 py-3 text-right">Total Bill</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Payment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const totalCases = order.items.reduce((s, i) => s + i.cases, 0);

                const getStatusPillClass = (status: OrderStatus) => {
                  switch (status) {
                    case 'delivered':
                      return 'status-success';
                    case 'dispatched':
                    case 'packed':
                    case 'confirmed':
                      return 'status-info';
                    case 'booked':
                      return 'status-warning';
                    case 'cancelled':
                      return 'status-danger';
                    default:
                      return 'status-info';
                  }
                };

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Order Number & Date */}
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{order.orderNumber}</div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(order.orderDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Retailer */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{order.retailerName}</div>
                      <div className="text-[11px] text-[#2563eb] font-medium">{order.beatName}</div>
                    </td>

                    {/* Salesman */}
                    <td className="px-4 py-3 text-slate-600">
                      {order.salesmanName || 'Self Indent'}
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{order.items.length} SKUs ({totalCases} cs)</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]" title={order.items.map(i => i.productName).join(', ')}>
                        {order.items.map(i => i.productName.split(' ')[0]).join(', ')}
                      </div>
                    </td>

                    {/* Taxable */}
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatINR(order.totalTaxable)}
                    </td>

                    {/* GST */}
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {formatINR(order.totalTax)}
                    </td>

                    {/* Grand Total */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(order.grandTotal)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`status-pill ${getStatusPillClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`status-pill ${
                        order.paymentStatus === 'paid'
                          ? 'status-success'
                          : order.paymentStatus === 'partial'
                          ? 'status-warning'
                          : 'status-danger'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      
                      {/* Invoice Button */}
                      <button
                        onClick={() => onOpenInvoice(order)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 transition-colors cursor-pointer border border-slate-200"
                        title="View & Print GST Tax Invoice"
                      >
                        <FileText className="w-3.5 h-3.5 inline mr-1" />
                        Invoice
                      </button>

                      {/* Workflow state progressor */}
                      {isAdmin && order.status === 'booked' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'confirmed')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}

                      {isAdmin && order.status === 'confirmed' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'packed')}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
                        >
                          Pack
                        </button>
                      )}

                      {isAdmin && order.status === 'packed' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'dispatched', { driverName: 'Suresh Gowda', vehicleNumber: 'KA-05-AB-1234' })}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#1e293b] hover:bg-slate-900 text-white transition-colors cursor-pointer"
                        >
                          Dispatch
                        </button>
                      )}

                      {order.status === 'dispatched' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'delivered', { podReceiverName: 'Store Incharge' })}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                        >
                          Deliver
                        </button>
                      )}

                      {isAdmin && onDeleteOrder && (
                        <button
                          onClick={() => setDeletingOrderId(order.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Cancel/Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Order Modal */}
      {deletingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete / Cancel Order?</h3>
                <p className="text-[11px] text-slate-500">This will remove the order and release booked stock.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{orders.find(o => o.id === deletingOrderId)?.orderNumber}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingOrderId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                onClick={async () => {
                  if (deletingOrderId && onDeleteOrder) {
                    await onDeleteOrder(deletingOrderId);
                    setDeletingOrderId(null);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
