import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Sparkles,
  ClipboardList,
  User as UserIcon,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { NavTab } from '../types';
export type { NavTab };

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const isMobileMenuOpen = externalIsMenuOpen !== undefined ? externalIsMenuOpen : internalMenuOpen;
  const setIsMobileMenuOpen = externalSetIsMenuOpen || setInternalMenuOpen;

  // Build nav items dynamically based on role
  let navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; description?: string }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, description: 'Storefront & Offers' }
  ];

  if (currentRole === 'admin') {
    navItems.push(
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, description: 'FMCG Metrics & Analytics' },
      { id: 'orders', label: 'Orders & Dispatch', icon: <ShoppingCart className="w-5 h-5" />, badge: ordersBadge, description: 'Bookings & Invoicing' },
      { id: 'products', label: 'Products & Schemes', icon: <Package className="w-5 h-5" />, description: 'Catalog & Trade Margins' },
      { id: 'inventory', label: 'Warehouse & Batches', icon: <Boxes className="w-5 h-5" />, badge: lowStockBadge, description: 'Stock & Expiry Tracking' },
      { id: 'retailers', label: 'Retailers & Credits', icon: <Store className="w-5 h-5" />, description: 'Outlets, Ledgers & KYC' },
      { id: 'banners', label: 'Banner Management', icon: <ImageIcon className="w-5 h-5" />, description: 'Home Slides & Offers' },
      { id: 'salesmen', label: 'Salesmen & Beats', icon: <Users className="w-5 h-5" />, description: 'Field Beats & Targets' },
      { id: 'deliveries', label: 'Delivery Run Sheets', icon: <Truck className="w-5 h-5" />, description: 'Trip Sheets & Digital POD' },
      { id: 'payments', label: 'Payments & Ledger', icon: <IndianRupee className="w-5 h-5" />, description: 'Collections & Statements' }
    );
  } else if (currentRole === 'salesman') {
    navItems.push(
      { id: 'dashboard', label: 'Beat Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'orders', label: 'Booked Orders', icon: <ShoppingCart className="w-5 h-5" /> },
      { id: 'retailers', label: 'My Beat Outlets', icon: <Store className="w-5 h-5" /> },
      { id: 'products', label: 'Catalog & Schemes', icon: <Package className="w-5 h-5" /> },
      { id: 'payments', label: 'Collections', icon: <IndianRupee className="w-5 h-5" /> }
    );
  } else if (currentRole === 'delivery') {
    navItems.push(
      { id: 'deliveries', label: 'My Trip Sheet (POD)', icon: <Truck className="w-5 h-5" /> },
      { id: 'orders', label: 'Assigned Orders', icon: <ShoppingCart className="w-5 h-5" /> },
      { id: 'payments', label: 'Spot Cash/UPI Collections', icon: <IndianRupee className="w-5 h-5" /> }
    );
  } else if (currentRole === 'accounts') {
    navItems.push(
      { id: 'payments', label: 'Payments & Ledger', icon: <IndianRupee className="w-5 h-5" /> },
      { id: 'retailers', label: 'Retailer Outstandings & Limits', icon: <Store className="w-5 h-5" /> },
      { id: 'orders', label: 'GST Invoices & Billing', icon: <ShoppingCart className="w-5 h-5" />, badge: ordersBadge },
      { id: 'dashboard', label: 'Financial Analytics', icon: <LayoutDashboard className="w-5 h-5" /> }
    );
  } else if (currentRole === 'retailer') {
    navItems.push(
      { id: 'products', label: 'Distributor Catalog', icon: <Package className="w-5 h-5" /> },
      { id: 'orders', label: 'My Orders', icon: <ShoppingCart className="w-5 h-5" />, badge: ordersBadge },
      { id: 'payments', label: 'My Payments & Ledger', icon: <IndianRupee className="w-5 h-5" /> },
      { id: 'retailers', label: 'Store Profile & Credit', icon: <Store className="w-5 h-5" /> }
    );
  } else {
    // Default fallback
    navItems.push(
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" /> },
      { id: 'products', label: 'Products', icon: <Package className="w-5 h-5" /> },
      { id: 'payments', label: 'Payments', icon: <IndianRupee className="w-5 h-5" /> }
    );
  }

  const handleMobileTabClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* ADMIN DESKTOP LEFT SIDEBAR (screens >= 768px when currentRole === 'admin') */}
      {/* Replaces the horizontal menu with clean, professional collapsible sidebar */}
      {/* ========================================================================= */}
      {isAdmin ? (
        <aside 
          id="admin-left-sidebar"
          className={`hidden md:flex flex-col fixed top-16 left-0 bottom-0 z-30 bg-[#0F172A] border-r border-slate-800 transition-all duration-300 shadow-xl ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Sidebar Header & Collapse Toggle */}
          <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                  Admin Console
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Quick Action Button */}
          <div className="p-3">
            {onOpenNewOrder && (
              <button
                type="button"
                onClick={onOpenNewOrder}
                className={`w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                  isSidebarCollapsed ? 'px-0' : ''
                }`}
                title="Create New Order"
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>+ Punch Order</span>}
              </button>
            )}
          </div>

          {/* Nav Items List */}
          <div className="flex-1 overflow-y-auto px-2.5 space-y-1 py-1 no-scrollbar">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title={item.label}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} shrink-0 transition-colors`}>
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && (
                      <div className="truncate text-left">
                        <span className="truncate block">{item.label}</span>
                      </div>
                    )}
                  </div>

                  {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Admin User Footer inside Sidebar */}
          <div className="p-3 border-t border-slate-800 bg-[#0B132B]">
            {!isSidebarCollapsed ? (
              <div className="flex items-center justify-between">
                <div className="truncate pr-2">
                  <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-slate-400 truncate">Super Stockist Admin</p>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </aside>
      ) : (
        /* Standard Desktop Horizontal Navigation Bar for non-admin roles (Salesman, Retailer, etc.) */
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
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM APP NAVIGATION BAR (screens <= 767px)                       */}
      {/* 4-tab fixed navigation: Home | Orders | Cart | Account                     */}
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

          {/* 3. Cart Tab with Badge */}
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

          {/* 4. Account Tab */}
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
              <UserIcon className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[11px] mt-1 font-semibold text-slate-500 tracking-tight">
              Account
            </span>
          </button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* RESPONSIVE DRAWER / SIDEBAR (Mobile + Desktop Toggle)                     */}
      {/* Opens smoothly when menu icon in header is clicked                         */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200">
          <div 
            className="flex-1"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Side Drawer coming in from the left */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0F172A] text-white shadow-2xl flex flex-col justify-between border-r border-slate-800 z-50 animate-in slide-in-from-left duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B132B]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#38bdf8]">
                    Aryan Agency Menu
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Role: <b className="text-amber-400 uppercase">{currentRole}</b>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions inside Drawer */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
              <div className="grid grid-cols-2 gap-2">
                {isRetailer ? (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSelectTab('products');
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-amber-300" />
                    <span>Catalog</span>
                  </button>
                ) : (isSalesman || isAdmin) && onOpenNewOrder ? (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenNewOrder();
                    }}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
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
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span>Aryan AI</span>
                  </button>
                )}
              </div>
            </div>

            {/* All Navigation Directory Tabs */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                FMCG Management Options
              </div>
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMobileTabClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/30'
                        : 'text-slate-300 hover:bg-slate-800/80 active:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`p-2 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {item.icon}
                      </span>
                      <div>
                        <span className="block font-bold">{item.label}</span>
                        {item.description && (
                          <span className={`text-[10px] block ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* User Session and Logout Footer */}
            <div className="p-3 border-t border-slate-800 bg-[#0B132B] flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <p className="font-bold text-slate-200 truncate">{currentUser?.name || 'Aryan FMCG'}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.phone || currentUser?.email || 'Logged In'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 hover:text-white flex items-center space-x-1 font-semibold text-xs shrink-0 cursor-pointer"
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
