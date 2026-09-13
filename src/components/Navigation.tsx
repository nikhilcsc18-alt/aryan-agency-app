import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Home,
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Boxes, 
  Store, 
  Users, 
  Truck, 
  IndianRupee,
  FileSpreadsheet,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Sparkles,
  LayoutGrid,
  BadgePercent,
  User,
  ClipboardList
} from 'lucide-react';

export type NavTab = 
  | 'home'
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
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenAccountModal?: () => void;
  onOpenNewOrder?: () => void;
  onOpenAICopilot?: () => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  ordersBadge,
  lowStockBadge,
  cartCount = 0,
  onOpenCart,
  onOpenAccountModal,
  onOpenNewOrder,
  onOpenAICopilot,
  isMobileMenuOpen: externalIsMenuOpen,
  setIsMobileMenuOpen: externalSetIsMenuOpen
}) => {
  const { currentRole, currentUser, logout, isAdmin, isSalesman, isRetailer } = useAuth();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);

  const isMobileMenuOpen = externalIsMenuOpen !== undefined ? externalIsMenuOpen : internalMenuOpen;
  const setIsMobileMenuOpen = externalSetIsMenuOpen || setInternalMenuOpen;

  // Base navigation items - includes 'home' as primary landing tab
  let navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> }
  ];

  if (currentRole === 'admin') {
    navItems.push(
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'orders', label: 'Orders & Dispatch', icon: <ShoppingCart className="w-4 h-4" />, badge: ordersBadge },
      { id: 'products', label: 'Products & Schemes', icon: <Package className="w-4 h-4" /> },
      { id: 'inventory', label: 'Warehouse & Batches', icon: <Boxes className="w-4 h-4" />, badge: lowStockBadge },
      { id: 'retailers', label: 'Retailers & Credits', icon: <Store className="w-4 h-4" /> },
      { id: 'salesmen', label: 'Salesmen & Beats', icon: <Users className="w-4 h-4" /> },
      { id: 'deliveries', label: 'Delivery Run Sheets', icon: <Truck className="w-4 h-4" /> },
      { id: 'payments', label: 'Payments & Ledger', icon: <IndianRupee className="w-4 h-4" /> }
    );
  } else if (currentRole === 'salesman') {
    navItems.push(
      { id: 'dashboard', label: 'Beat Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'orders', label: 'Booked Orders', icon: <ShoppingCart className="w-4 h-4" /> },
      { id: 'retailers', label: 'My Beat Outlets', icon: <Store className="w-4 h-4" /> },
      { id: 'products', label: 'Catalog & Schemes', icon: <Package className="w-4 h-4" /> },
      { id: 'payments', label: 'Collections', icon: <IndianRupee className="w-4 h-4" /> }
    );
  } else if (currentRole === 'delivery') {
    navItems.push(
      { id: 'deliveries', label: 'My Trip Sheet (POD)', icon: <Truck className="w-4 h-4" /> },
      { id: 'orders', label: 'Assigned Orders', icon: <ShoppingCart className="w-4 h-4" /> },
      { id: 'payments', label: 'Spot Cash/UPI Collections', icon: <IndianRupee className="w-4 h-4" /> }
    );
  } else if (currentRole === 'accounts') {
    navItems.push(
      { id: 'payments', label: 'Payments & Ledger', icon: <IndianRupee className="w-4 h-4" /> },
      { id: 'retailers', label: 'Retailer Outstandings & Limits', icon: <Store className="w-4 h-4" /> },
      { id: 'orders', label: 'GST Invoices & Billing', icon: <ShoppingCart className="w-4 h-4" />, badge: ordersBadge },
      { id: 'dashboard', label: 'Financial Analytics', icon: <LayoutDashboard className="w-4 h-4" /> }
    );
  } else if (currentRole === 'retailer') {
    navItems.push(
      { id: 'products', label: 'Distributor Catalog', icon: <Package className="w-4 h-4" /> },
      { id: 'orders', label: 'My Orders', icon: <ShoppingCart className="w-4 h-4" />, badge: ordersBadge },
      { id: 'payments', label: 'My Payments & Ledger', icon: <IndianRupee className="w-4 h-4" /> },
      { id: 'retailers', label: 'Store Profile & Credit', icon: <Store className="w-4 h-4" /> }
    );
  } else {
    // Default fallback
    navItems.push(
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
      { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
      { id: 'payments', label: 'Payments', icon: <IndianRupee className="w-4 h-4" /> }
    );
  }

  // Determine top 4 tabs for mobile bottom navigation
  const mobilePrimaryTabs = navItems.slice(0, 4);
  const hasMoreTabs = navItems.length > 4;

  const handleMobileTabClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP NAVIGATION BAR (screens >= 768px) - Strictly Unchanged             */}
      {/* ========================================================================= */}
      <nav className="hidden md:block bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
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

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM APP NAVIGATION BAR (screens <= 767px)                       */}
      {/* 4-tab fixed navigation: Home | Orders | Cart | Account                     */}
      {/* Category removed from bottom navigation as requested                       */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
        <div className="grid grid-cols-4 items-center h-16 px-1">
          
          {/* 1. Home Tab */}
          <button
            id="mobile-nav-home"
            onClick={() => handleMobileTabClick('home')}
            className={`relative flex flex-col items-center justify-center h-full py-1 text-center transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'home' ? 'text-[#1A73E8]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative mt-0.5">
              <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            </div>
            <span className={`text-[11px] mt-1 tracking-tight ${
              activeTab === 'home' ? 'font-black text-[#1A73E8]' : 'font-semibold text-slate-500'
            }`}>
              Home
            </span>
            {activeTab === 'home' && (
              <span className="w-4 h-0.5 bg-[#1A73E8] rounded-full mt-0.5" />
            )}
          </button>

          {/* 2. Orders Tab */}
          <button
            id="mobile-nav-orders"
            onClick={() => handleMobileTabClick('orders')}
            className={`relative flex flex-col items-center justify-center h-full py-1 text-center transition-all cursor-pointer select-none active:scale-95 ${
              activeTab === 'orders' ? 'text-[#1A73E8]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative mt-0.5">
              <ClipboardList className={`w-5 h-5 ${activeTab === 'orders' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {ordersBadge !== undefined && ordersBadge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs ring-2 ring-white">
                  {ordersBadge > 99 ? '99+' : ordersBadge}
                </span>
              )}
            </div>
            <span className={`text-[11px] mt-1 tracking-tight ${
              activeTab === 'orders' ? 'font-black text-[#1A73E8]' : 'font-semibold text-slate-500'
            }`}>
              Orders
            </span>
            {activeTab === 'orders' && (
              <span className="w-4 h-0.5 bg-[#1A73E8] rounded-full mt-0.5" />
            )}
          </button>

          {/* 3. Cart Tab with Notification Badge */}
          <button
            id="mobile-nav-cart"
            onClick={() => {
              if (onOpenCart) {
                onOpenCart();
              } else {
                handleMobileTabClick('orders');
              }
            }}
            className="relative flex flex-col items-center justify-center h-full py-1 text-center transition-all cursor-pointer select-none active:scale-95 text-slate-500 hover:text-slate-800"
          >
            <div className="relative mt-0.5">
              <ShoppingCart className="w-5 h-5 stroke-[1.8]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#E53E3E] text-white font-black text-[10px] flex items-center justify-center shadow-xs ring-2 ring-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 font-semibold text-slate-500 tracking-tight">
              Cart
            </span>
          </button>

          {/* 4. Account Tab (Directly opens logged-in user Account Details) */}
          <button
            id="mobile-nav-account"
            onClick={() => {
              if (onOpenAccountModal) {
                onOpenAccountModal();
              } else {
                setIsMobileMenuOpen(true);
              }
            }}
            className="relative flex flex-col items-center justify-center h-full py-1 text-center transition-all cursor-pointer select-none active:scale-95 text-slate-500 hover:text-slate-800"
          >
            <div className="relative mt-0.5">
              <User className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] mt-1 font-semibold text-slate-500 tracking-tight">
              Account
            </span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE ANDROID SLIDE-UP DRAWER (screens <= 767px)                         */}
      {/* Displays all FMCG distribution modules with clean touch list               */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div 
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="bg-[#0f172a] text-white rounded-t-2xl border-t border-slate-700 shadow-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8]">FMCG Modules</span>
                <p className="text-xs text-slate-400 mt-0.5">Role: <b className="text-slate-200 uppercase">{currentRole}</b></p>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions inside Drawer */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {isRetailer ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSelectTab('products');
                  }}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-amber-300" />
                  <span>Buy Products</span>
                </button>
              ) : (isSalesman || isAdmin) && onOpenNewOrder ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenNewOrder();
                  }}
                  className="py-2.5 px-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>+ Punch Order</span>
                </button>
              ) : null}
              {onOpenAICopilot && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAICopilot();
                  }}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 border border-slate-700 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Aryan AI</span>
                </button>
              )}
            </div>

            {/* All Navigation Tabs */}
            <div className="space-y-1 pt-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1">
                Navigation Directory
              </div>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileTabClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#1e293b] text-[#38bdf8] font-bold border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-800/80 active:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`p-2 rounded-lg ${isActive ? 'bg-[#2563eb] text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* User Session and Logout */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <p className="font-semibold text-slate-200 truncate">{currentUser?.name || 'Aryan Staff'}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'FMCG System'}</p>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 hover:text-white flex items-center space-x-1 font-semibold text-xs shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

