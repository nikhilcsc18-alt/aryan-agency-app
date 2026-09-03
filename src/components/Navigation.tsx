import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Boxes, 
  Store, 
  Users, 
  Truck, 
  IndianRupee,
  FileSpreadsheet
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'orders' 
  | 'products' 
  | 'inventory' 
  | 'retailers' 
  | 'salesmen' 
  | 'deliveries' 
  | 'payments';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  ordersBadge?: number;
  lowStockBadge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  ordersBadge,
  lowStockBadge
}) => {
  const { currentRole } = useAuth();

  // Define tab items based on persona
  let navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [];

  if (currentRole === 'admin') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'orders', label: 'Orders & Dispatch', icon: <ShoppingCart className="w-4 h-4" />, badge: ordersBadge },
      { id: 'products', label: 'Products & Schemes', icon: <Package className="w-4 h-4" /> },
      { id: 'inventory', label: 'Warehouse & Batches', icon: <Boxes className="w-4 h-4" />, badge: lowStockBadge },
      { id: 'retailers', label: 'Retailers & Credits', icon: <Store className="w-4 h-4" /> },
      { id: 'salesmen', label: 'Salesmen & Beats', icon: <Users className="w-4 h-4" /> },
      { id: 'deliveries', label: 'Delivery Run Sheets', icon: <Truck className="w-4 h-4" /> },
      { id: 'payments', label: 'Payments & Ledger', icon: <IndianRupee className="w-4 h-4" /> }
    ];
  } else if (currentRole === 'salesman') {
    navItems = [
      { id: 'dashboard', label: 'Beat Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'orders', label: 'Booked Orders', icon: <ShoppingCart className="w-4 h-4" /> },
      { id: 'retailers', label: 'My Beat Outlets', icon: <Store className="w-4 h-4" /> },
      { id: 'products', label: 'Catalog & Schemes', icon: <Package className="w-4 h-4" /> },
      { id: 'payments', label: 'Collections', icon: <IndianRupee className="w-4 h-4" /> }
    ];
  } else if (currentRole === 'delivery') {
    navItems = [
      { id: 'deliveries', label: 'My Trip Sheet (POD)', icon: <Truck className="w-4 h-4" /> },
      { id: 'orders', label: 'Assigned Orders', icon: <ShoppingCart className="w-4 h-4" /> },
      { id: 'payments', label: 'Spot Cash/UPI Collections', icon: <IndianRupee className="w-4 h-4" /> }
    ];
  } else if (currentRole === 'accounts') {
    navItems = [
      { id: 'payments', label: 'Payments & Ledger', icon: <IndianRupee className="w-4 h-4" /> },
      { id: 'retailers', label: 'Retailer Outstandings & Limits', icon: <Store className="w-4 h-4" /> },
      { id: 'orders', label: 'GST Invoices & Billing', icon: <ShoppingCart className="w-4 h-4" />, badge: ordersBadge },
      { id: 'dashboard', label: 'Financial Analytics', icon: <LayoutDashboard className="w-4 h-4" /> }
    ];
  } else if (currentRole === 'retailer') {
    navItems = [
      { id: 'products', label: 'Distributor Catalog', icon: <Package className="w-4 h-4" /> },
      { id: 'orders', label: 'My Orders & Invoices', icon: <ShoppingCart className="w-4 h-4" /> },
      { id: 'retailers', label: 'Account & Credit Ledger', icon: <FileSpreadsheet className="w-4 h-4" /> },
      { id: 'payments', label: 'Payment Receipts', icon: <IndianRupee className="w-4 h-4" /> }
    ];
  } else {
    // Default fallback
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
      { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
      { id: 'payments', label: 'Payments', icon: <IndianRupee className="w-4 h-4" /> }
    ];
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-2.5 no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1e293b] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span className={isActive ? 'text-[#3b82f6]' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-[#2563eb] text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
