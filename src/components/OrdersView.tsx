import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PackageCheck, 
  ChevronRight,
  User,
  Calendar,
  IndianRupee,
  Store,
  MapPin,
  Trash2,
  Package,
  ArrowRight
} from 'lucide-react';
import { Order, OrderStatus, Retailer } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface OrdersViewProps {
  orders: Order[];
  retailers?: Retailer[];
  onOpenNewOrder: () => void;
  onOpenInvoice: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, extra?: any) => Promise<void>;
  onOpenDeliveryRun?: () => void;
  onDeleteOrder?: (id: string) => Promise<void>;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  retailers = [],
  onOpenNewOrder,
  onOpenInvoice,
  onUpdateStatus,
  onOpenDeliveryRun,
  onDeleteOrder
}) => {
  const { isAdmin, isSalesman, isDelivery, isAccounts, isRetailer, currentRole, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBeat, setSelectedBeat] = useState<string>('all');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  // Clean valid orders
  const validOrders = (orders || []).filter(order => Boolean(order && order.id && order.id !== 'null' && order.id !== 'undefined'));

  // Role Scoping
  const roleScopedOrders = validOrders.filter(order => {
    if (isAdmin || currentRole === 'accounts') return true;
    if (isSalesman) {
      return order.salesmanId === currentUser?.salesmanId || 
             (currentUser?.name && order.salesmanName?.toLowerCase().includes(currentUser.name.toLowerCase()));
    }
    if (isDelivery) {
      return order.status === 'dispatched' || order.status === 'packed' || order.status === 'delivered';
    }
    if (isRetailer) {
      const matchId = (currentUser?.retailerId && order.retailerId === currentUser.retailerId);
      const matchName = currentUser?.name && (
        order.retailerName?.toLowerCase() === currentUser.name.toLowerCase() ||
        order.retailerName?.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(order.retailerName?.toLowerCase())
      );
      const matchPhone = currentUser?.phone && order.retailerPhone && (
        order.retailerPhone.replace(/\D/g, '').includes(currentUser.phone.replace(/\D/g, '').slice(-10))
      );
      return Boolean(matchId || matchName || matchPhone);
    }
    return true;
  });

  const baseOrders = roleScopedOrders;
  const beats = Array.from(new Set(baseOrders.map(o => o.beatName))).filter(Boolean);

  // Status mapping for Retailers
  const getRetailerStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'booked':
        return { label: 'Order Placed', step: 1, badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'draft':
        return { label: 'Pending', step: 1, badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'confirmed':
        return { label: 'Confirmed', step: 2, badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'packed':
        return { label: 'Processing', step: 3, badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'dispatched':
        return { label: 'Dispatched', step: 4, badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'delivered':
        return { label: 'Delivered', step: 5, badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'cancelled':
        return { label: 'Cancelled', step: 0, badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' };
      default:
        return { label: status, step: 1, badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  // Filter orders by status & search
  const filteredOrders = baseOrders.filter(order => {
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (isRetailer) {
        if (statusFilter === 'placed') matchesStatus = order.status === 'booked';
        else if (statusFilter === 'pending') matchesStatus = order.status === 'draft' || order.status === 'booked';
        else if (statusFilter === 'confirmed') matchesStatus = order.status === 'confirmed';
        else if (statusFilter === 'processing') matchesStatus = order.status === 'packed';
        else if (statusFilter === 'dispatched') matchesStatus = order.status === 'dispatched';
        else if (statusFilter === 'delivered') matchesStatus = order.status === 'delivered';
        else if (statusFilter === 'cancelled') matchesStatus = order.status === 'cancelled';
        else matchesStatus = order.status === statusFilter;
      } else {
        matchesStatus = order.status === statusFilter;
      }
    }

    const matchesBeat = selectedBeat === 'all' || order.beatName === selectedBeat;
    const matchesSearch =
      (order.orderNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.retailerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.salesmanName && order.salesmanName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesBeat && matchesSearch;
  });

  const getStatusPillClass = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'status-success';
      case 'dispatched':
      case 'packed':
      case 'confirmed':
        return 'status-info';
      case 'booked':
      case 'draft':
        return 'status-warning';
      case 'cancelled':
        return 'status-danger';
      default:
        return 'status-info';
    }
  };

  // Status tabs configuration
  const statusTabs = isRetailer ? [
    { id: 'all', label: 'All Orders', count: baseOrders.length },
    { id: 'placed', label: 'Order Placed', count: baseOrders.filter(o => o.status === 'booked').length },
    { id: 'pending', label: 'Pending', count: baseOrders.filter(o => o.status === 'draft' || o.status === 'booked').length },
    { id: 'confirmed', label: 'Confirmed', count: baseOrders.filter(o => o.status === 'confirmed').length },
    { id: 'processing', label: 'Processing', count: baseOrders.filter(o => o.status === 'packed').length },
    { id: 'dispatched', label: 'Dispatched', count: baseOrders.filter(o => o.status === 'dispatched').length },
    { id: 'delivered', label: 'Delivered', count: baseOrders.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', label: 'Cancelled', count: baseOrders.filter(o => o.status === 'cancelled').length }
  ] : [
    { id: 'all', label: 'All Orders', count: baseOrders.length },
    { id: 'booked', label: 'Booked', count: baseOrders.filter(o => o.status === 'booked').length },
    { id: 'confirmed', label: 'Confirmed', count: baseOrders.filter(o => o.status === 'confirmed').length },
    { id: 'packed', label: 'Packed', count: baseOrders.filter(o => o.status === 'packed').length },
    { id: 'dispatched', label: 'Dispatched', count: baseOrders.filter(o => o.status === 'dispatched').length },
    { id: 'delivered', label: 'Delivered', count: baseOrders.filter(o => o.status === 'delivered').length },
    { id: 'cancelled', label: 'Cancelled', count: baseOrders.filter(o => o.status === 'cancelled').length }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {isRetailer ? 'My Orders' : 'Orders & Dispatch Pipeline'}
          </h1>
          <p className="text-xs text-slate-500">
            {isRetailer 
              ? 'Track order status, delivery progress, products summary, and GST tax invoices' 
              : 'Manage FMCG indents, warehouse packing, vehicle dispatch, and delivery status'}
          </p>
        </div>

        {!isRetailer && (isSalesman || isAdmin) && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNewOrder}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Punch New Order</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={isRetailer ? "Search by Order ID or Product name..." : "Search by Order #, Store, or Salesman..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {/* Beat Route Filter (Only if multiple routes exist) */}
          {!isRetailer ? (
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
          ) : (
            <div className="flex items-center text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Store className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
              <span className="font-semibold truncate">
                {currentUser?.name || 'Retail Store Orders'}
              </span>
            </div>
          )}

          {/* Status Quick Count Summary */}
          <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
            Showing {filteredOrders.length} of {baseOrders.length} Orders
          </div>

        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
          {statusTabs.map(tab => (
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

      {/* ========================================================================= */}
      {/* 1. RETAILER VIEW: "My Orders" Tracker Cards                              */}
      {/* Shows Order ID, Order Date, Products, Total Amount, Current Status        */}
      {/* With visual order progress tracker for Placed -> Confirmed -> Delivered   */}
      {/* ========================================================================= */}
      {isRetailer && (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 space-y-3">
              <ShoppingCart className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-800 text-base">No orders found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {statusFilter === 'all'
                  ? "You haven't placed any wholesale orders yet. Browse our Distributor Catalog to place your first order using 'Buy Now'."
                  : `No orders found under "${statusTabs.find(t => t.id === statusFilter)?.label}". Try choosing "All Orders".`}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const totalCases = order.items.reduce((s, i) => s + i.cases, 0);
              const totalLoosePcs = order.items.reduce((s, i) => s + (i.loosePcs || 0), 0);
              const statusInfo = getRetailerStatusInfo(order.status);

              // 5-Step visual tracker
              const steps = [
                { num: 1, label: 'Order Placed', key: 'booked' },
                { num: 2, label: 'Confirmed', key: 'confirmed' },
                { num: 3, label: 'Processing', key: 'packed' },
                { num: 4, label: 'Dispatched', key: 'dispatched' },
                { num: 5, label: 'Delivered', key: 'delivered' }
              ];

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Order Card Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center text-[#2563eb]">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {order.orderNumber}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                          <span>
                            Ordered on {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {order.salesmanName && (
                            <span>• Rep: {order.salesmanName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Amount</span>
                        <span className="text-base font-bold font-mono text-slate-900 block">
                          {formatINR(order.grandTotal)}
                        </span>
                      </div>

                      <button
                        onClick={() => onOpenInvoice(order)}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer shrink-0"
                        title="View GST Tax Invoice"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>GST Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Progress Stepper (Only if not cancelled) */}
                  {order.status !== 'cancelled' ? (
                    <div className="px-4 py-3 bg-white border-b border-slate-100 overflow-x-auto">
                      <div className="flex items-center min-w-[500px] justify-between text-xs py-1">
                        {steps.map((step, idx) => {
                          const isComplete = statusInfo.step > step.num;
                          const isCurrent = statusInfo.step === step.num;
                          return (
                            <React.Fragment key={step.key}>
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                                    isComplete
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : isCurrent
                                      ? 'bg-[#2563eb] text-white ring-4 ring-blue-100'
                                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}
                                >
                                  {isComplete ? '✓' : step.num}
                                </div>
                                <span
                                  className={`font-semibold text-xs ${
                                    isCurrent
                                      ? 'text-[#2563eb] font-bold'
                                      : isComplete
                                      ? 'text-slate-800'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                              {idx < steps.length - 1 && (
                                <div
                                  className={`flex-1 h-0.5 mx-3 ${
                                    statusInfo.step > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                                  }`}
                                />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-100 text-xs text-rose-800 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>This order was cancelled. Please contact Aryan Agency customer support for details.</span>
                    </div>
                  )}

                  {/* Products Summary List */}
                  <div className="p-4 space-y-2.5">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Products Ordered ({order.items.length} SKUs • {totalCases} Cases {totalLoosePcs > 0 ? `+ ${totalLoosePcs} Pcs` : ''})</span>
                      <span className="text-[11px] text-slate-500 font-normal">GST Inclusive Wholesale Billing</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 text-xs flex items-start justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.brand} • {item.cases} Cases {item.loosePcs > 0 ? `+ ${item.loosePcs} Pcs` : ''}
                            </div>
                            {item.schemeApplied && (
                              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                                🎁 Scheme: {item.schemeApplied}
                              </div>
                            )}
                          </div>
                          <div className="text-right font-mono font-bold text-slate-800 shrink-0 ml-2">
                            {formatINR(item.totalAmount)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery & Payment Note */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1 border-t border-slate-100">
                      <div>
                        {order.driverName ? (
                          <span>Vehicle: {order.vehicleNumber || 'Van'} • Driver: {order.driverName}</span>
                        ) : (
                          <span>Expected Delivery: {new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        )}
                      </div>
                      <div>
                        Payment: <span className="font-semibold uppercase text-slate-700">{order.paymentStatus}</span> ({order.paymentMode || 'Credit'})
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADMIN / SALESMAN / DELIVERY VIEW: Table & Cards                        */}
      {/* ========================================================================= */}
      {!isRetailer && (
        <>
          {/* Desktop Table (screens >= 768px) */}
          <div className="hidden md:block bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
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

                          {/* Workflow state progressor (Admin / Delivery Only) */}
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

                          {(isAdmin || isDelivery) && order.status === 'dispatched' && (
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

          {/* Mobile Android Order Cards (screens <= 767px) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const totalCases = order.items.reduce((s, i) => s + i.cases, 0);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3 active:border-blue-300 transition-all"
                >
                  {/* Header: Order ID + Status Pills */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#2563eb]">
                        {order.orderNumber}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {new Date(order.orderDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`status-pill text-[10px] ${getStatusPillClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`status-pill text-[10px] ${
                        order.paymentStatus === 'paid'
                          ? 'status-success'
                          : order.paymentStatus === 'partial'
                          ? 'status-warning'
                          : 'status-danger'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Retailer & Route */}
                  <div className="pt-2 border-t border-slate-100 flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{order.retailerName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {order.beatName} • <span className="text-slate-600 font-medium">{order.salesmanName || 'Self Indent'}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {formatINR(order.grandTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {order.items.length} SKUs ({totalCases} cs)
                      </div>
                    </div>
                  </div>

                  {/* Items summary preview */}
                  <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Items: </span>
                    <span className="text-slate-500">
                      {order.items.map(i => `${i.productName.split(' ')[0]} (${i.cases}cs)`).join(', ')}
                    </span>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onOpenInvoice(order)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 border border-slate-200 flex items-center space-x-1.5 active:scale-95 transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>GST Invoice</span>
                    </button>

                    <div className="flex items-center space-x-1.5">
                      {isAdmin && order.status === 'booked' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'confirmed')}
                          className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] text-white active:scale-95 transition-transform"
                        >
                          Confirm
                        </button>
                      )}

                      {isAdmin && order.status === 'confirmed' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'packed')}
                          className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white active:scale-95 transition-transform"
                        >
                          Pack Stock
                        </button>
                      )}

                      {isAdmin && order.status === 'packed' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'dispatched', { driverName: 'Suresh Gowda', vehicleNumber: 'KA-05-AB-1234' })}
                          className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#1e293b] text-white active:scale-95 transition-transform"
                        >
                          Dispatch Van
                        </button>
                      )}

                      {(isAdmin || isDelivery) && order.status === 'dispatched' && (
                        <button
                          onClick={() => onUpdateStatus(order.id, 'delivered', { podReceiverName: 'Store Incharge' })}
                          className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white active:scale-95 transition-transform"
                        >
                          Mark Delivered
                        </button>
                      )}

                      {isAdmin && onDeleteOrder && (
                        <button
                          onClick={() => setDeletingOrderId(order.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 active:scale-95 transition-transform"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete Order Confirmation Modal */}
      {deletingOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete FMCG Order?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to cancel and remove order <span className="font-mono font-bold text-slate-800">{deletingOrderId}</span>? This will revert any reserved stock buffer.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingOrderId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteOrder) {
                    await onDeleteOrder(deletingOrderId);
                  }
                  setDeletingOrderId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer shadow-xs"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
