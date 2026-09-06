import React from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  Boxes, 
  AlertTriangle, 
  IndianRupee, 
  Truck, 
  CheckCircle2, 
  ArrowUpRight, 
  ChevronRight, 
  Store,
  Sparkles,
  Plus
} from 'lucide-react';
import { Product, Order, Retailer, Salesman } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface DashboardViewProps {
  products: Product[];
  orders: Order[];
  retailers: Retailer[];
  salesmen: Salesman[];
  onNavigateTab: (tab: any) => void;
  onOpenNewOrder: () => void;
  onOpenAICopilot: () => void;
  onOpenInvoice: (order: Order) => void;
  onInwardStock: (productId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  orders,
  retailers,
  salesmen,
  onNavigateTab,
  onOpenNewOrder,
  onOpenAICopilot,
  onOpenInvoice,
  onInwardStock
}) => {
  const { currentUser, currentRole, isAdmin } = useAuth();

  // Scope orders based on role
  const isSalesman = currentRole === 'salesman';
  const validOrders = (orders || []).filter(o => Boolean(o && o.id && o.id !== 'null' && o.id !== 'undefined'));
  const roleFilteredOrders = isSalesman 
    ? validOrders.filter(o => o.salesmanId === currentUser?.salesmanId || o.salesmanName === currentUser?.name)
    : validOrders;

  const displayOrders = isSalesman && roleFilteredOrders.length > 0 ? roleFilteredOrders : validOrders;

  // Metrics calculation
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayOrders = displayOrders.filter(o => o.orderDate.startsWith(todayDateStr));
  const todayBillings = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  
  const totalStockValue = products.reduce((sum, p) => sum + (p.currentStockCases * p.casePrice), 0);
  const lowStockProducts = products.filter(p => p.currentStockCases <= p.reorderLevelCases);
  
  const totalOutstanding = retailers.reduce((sum, r) => sum + r.currentOutstanding, 0);
  const overdueRetailers = retailers.filter(r => r.status === 'overdue' || r.currentOutstanding > r.creditLimit);

  const pendingDispatches = displayOrders.filter(o => o.status === 'confirmed' || o.status === 'packed');
  const deliveredToday = displayOrders.filter(o => o.status === 'delivered' && o.orderDate.startsWith(todayDateStr));

  // Current salesman profile
  const mySalesmanProfile = salesmen.find(s => s.id === currentUser?.salesmanId || s.name === currentUser?.name);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Persona Greeting & Top Bar */}
      <div className="bg-white rounded-lg p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {isSalesman ? 'My Beat Performance & Orders' : 'Distribution Overview'}
            </h1>
            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold uppercase tracking-wide border border-slate-200">
              {currentRole}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isSalesman 
              ? `Daily Beat Indenting & Route Operations • Logged in as ${currentUser?.name}`
              : `Depot operations for Bangalore Central & East Zones • Active session for ${currentUser?.name}`}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:space-x-2.5">
          <button
            onClick={onOpenAICopilot}
            className="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>AI Copilot</span>
          </button>
          
          <button
            onClick={onOpenNewOrder}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Punch Order</span>
          </button>
        </div>
      </div>

      {/* Critical Operational Alerts (Stock buffer alerts only for Admin) */}
      {(isAdmin && lowStockProducts.length > 0) || overdueRetailers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isAdmin && lowStockProducts.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    Stock Alert: {lowStockProducts.length} SKUs below Reorder Buffer
                  </div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    {lowStockProducts.slice(0, 2).map(p => `${p.brand} ${p.name.split(' ')[0]} (${p.currentStockCases} cs left)`).join(', ')}
                    {lowStockProducts.length > 2 && ` and ${lowStockProducts.length - 2} more`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onInwardStock()}
                className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 cursor-pointer ml-2"
              >
                Inward Stock
              </button>
            </div>
          )}

          {overdueRetailers.length > 0 && (
            <div className="bg-rose-50/80 border border-rose-200 rounded-lg p-4 flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-rose-900">
                    Credit Limit Overdue: {overdueRetailers.length} Outlets
                  </div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    Total balance of {formatINR(overdueRetailers.reduce((s, r) => s + r.currentOutstanding, 0))}. Collect before next billing.
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('retailers')}
                className="text-xs font-semibold text-rose-900 hover:text-rose-950 underline shrink-0 cursor-pointer ml-2"
              >
                View Outlets
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Primary 4-Column Balanced Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {isSalesman ? "My Today's Bookings" : "Today's Revenue"}
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {formatINR(todayBillings)}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium flex items-center justify-between">
            <span>↑ {todayOrders.length} wholesale orders booked</span>
            <span className="text-slate-400 font-normal">{deliveredToday.length} done</span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Pending Dispatch
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {pendingDispatches.length} Orders
          </div>
          <div className="text-xs text-amber-600 mt-1 font-medium flex items-center justify-between">
            <span>{formatINR(pendingDispatches.reduce((s, o) => s + o.grandTotal, 0))}</span>
            <span className="text-slate-400 font-normal">Ready for van</span>
          </div>
        </div>

        {/* Stock Alerts (Admin) or Target (Salesman) */}
        {isAdmin ? (
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Stock Valuation (Admin)
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
              {formatINR(totalStockValue)}
            </div>
            <div className="text-xs mt-1 font-medium flex items-center justify-between">
              <span className={lowStockProducts.length > 0 ? 'text-rose-600' : 'text-slate-500'}>
                {lowStockProducts.length} SKUs low stock
              </span>
              <span className="text-slate-400 font-normal">{products.length} SKUs total</span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Monthly Beat Target
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
              {formatINR(mySalesmanProfile?.monthlyTargetAmount || 250000)}
            </div>
            <div className="text-xs text-blue-600 mt-1 font-medium flex items-center justify-between">
              <span>Achieved: {formatINR(mySalesmanProfile?.currentMonthAchieved || todayBillings)}</span>
              <span className="text-slate-400 font-normal">Active Beat</span>
            </div>
          </div>
        )}

        {/* Market Outstanding */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Retailer Receivables
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            {formatINR(totalOutstanding)}
          </div>
          <div className="text-xs text-blue-600 mt-1 font-medium flex items-center justify-between">
            <span>Across {retailers.length} stores</span>
            <span className="text-rose-600 font-normal">{overdueRetailers.length} overdue</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Orders Table (2fr) + Performance & Quick Dispatch (1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-slate-900">
                {isSalesman ? 'My Beat Bookings' : 'Recent Wholesale Orders'}
              </span>
              <span className="text-xs text-slate-400">({displayOrders.length} total)</span>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8] flex items-center cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {/* Desktop Table View (screens >= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Retailer & Beat</th>
                  <th className="px-4 py-3">Salesman</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayOrders.slice(0, 6).map((order) => {
                  const getStatusPillClass = (status: string) => {
                    switch (status) {
                      case 'delivered':
                        return 'status-success';
                      case 'dispatched':
                      case 'packed':
                        return 'status-info';
                      case 'confirmed':
                      case 'booked':
                        return 'status-warning';
                      default:
                        return 'status-info';
                    }
                  };

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{order.retailerName}</div>
                        <div className="text-[11px] text-slate-500">{order.beatName}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.salesmanName || 'Self Indent'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 font-mono">
                        {formatINR(order.grandTotal)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-pill ${getStatusPillClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onOpenInvoice(order)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 transition-colors cursor-pointer border border-slate-200"
                        >
                          Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (screens <= 767px) */}
          <div className="md:hidden divide-y divide-slate-100">
            {displayOrders.slice(0, 6).map((order) => {
              const getStatusPillClass = (status: string) => {
                switch (status) {
                  case 'delivered':
                    return 'status-success';
                  case 'dispatched':
                  case 'packed':
                    return 'status-info';
                  case 'confirmed':
                  case 'booked':
                    return 'status-warning';
                  default:
                    return 'status-info';
                }
              };

              return (
                <div key={order.id} className="p-4 space-y-2.5 active:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#2563eb]">
                      {order.orderNumber}
                    </span>
                    <span className={`status-pill text-[10px] ${getStatusPillClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{order.retailerName}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {order.beatName} • <span className="text-slate-600 font-medium">{order.salesmanName || 'Self Indent'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {formatINR(order.grandTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {order.items.length} SKUs
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-50">
                    <button
                      onClick={() => onOpenInvoice(order)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 transition-colors border border-slate-200"
                    >
                      View Invoice
                    </button>
                    <button
                      onClick={() => onNavigateTab('orders')}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-[#2563eb] hover:bg-blue-100 transition-colors"
                    >
                      Track Dispatch →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Performance Card + Quick Dispatch */}
        <div className="flex flex-col gap-5">
          
          {/* Salesmen / Performance Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {isSalesman ? 'My Beat Progress' : 'Top Salesmen'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isSalesman ? 'Target vs Achievement' : 'Beat target achievements'}
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-[#2563eb]" />
              </div>

              <div className="divide-y divide-slate-100">
                {(isSalesman && mySalesmanProfile ? [mySalesmanProfile] : salesmen.slice(0, 3)).map((salesman) => {
                  const pct = Math.min(100, Math.round((salesman.currentMonthAchieved / salesman.monthlyTargetAmount) * 100));
                  return (
                    <div key={salesman.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{salesman.name}</div>
                        <div className="text-[11px] text-slate-500">{salesman.assignedBeats[0]} • {salesman.todayOrdersCount} orders</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-emerald-600">{formatINR(salesman.currentMonthAchieved)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{pct}% achieved</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigateTab('salesmen')}
                  className="w-full py-1.5 text-xs font-semibold text-center text-[#2563eb] hover:text-[#1d4ed8] hover:bg-slate-50 rounded-md transition-colors"
                >
                  Manage Sales Force (Admin) →
                </button>
              </div>
            )}
          </div>

          {/* Geometric Dark Card: Quick Delivery Fleet (Only for Admin) */}
          {isAdmin ? (
            <div className="bg-[#1e293b] text-white rounded-lg p-5 border border-slate-800 shadow-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Quick Delivery Fleet
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                <div 
                  onClick={() => onNavigateTab('deliveries')}
                  className="p-3 bg-white/10 hover:bg-white/15 rounded-lg flex justify-between items-center cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-medium text-slate-200">Route 1: Central Kirana Market</div>
                    <div className="text-[10px] text-slate-400">Van KA-04-E-8821 • Ramesh K.</div>
                  </div>
                  <span className="text-[10px] bg-[#2563eb] text-white px-2 py-0.5 rounded font-semibold">
                    4 Drops
                  </span>
                </div>

                <div 
                  onClick={() => onNavigateTab('deliveries')}
                  className="p-3 bg-white/10 hover:bg-white/15 rounded-lg flex justify-between items-center cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-medium text-slate-200">Route 2: Outer Ring Road Beat</div>
                    <div className="text-[10px] text-slate-400">Van KA-04-E-9943 • Manjunath</div>
                  </div>
                  <span className="text-[10px] bg-[#2563eb] text-white px-2 py-0.5 rounded font-semibold">
                    7 Drops
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-600">
              <div className="font-semibold text-slate-900 mb-1">DSR Operational Guidelines</div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Book retail store orders before 5:00 PM for next-morning depot dispatch. Ensure outstanding receipts are credited via Cash/UPI collections.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
