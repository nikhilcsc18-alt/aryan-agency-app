import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AryanAgencyLogo } from './AryanAgencyLogo';
import { DistributorSettingsModal } from './DistributorSettingsModal';
import { 
  Building2, 
  UserCircle2, 
  Sparkles, 
  PlusCircle, 
  RotateCcw, 
  ChevronDown, 
  Check, 
  ShieldCheck, 
  Truck, 
  Store, 
  Briefcase,
  Calculator,
  ShoppingCart,
  KeyRound,
  LogOut,
  Lock,
  ShieldAlert,
  Settings,
  SlidersHorizontal,
  Download,
  Smartphone,
  Bell,
  Search,
  Menu,
  User
} from 'lucide-react';
import { AppDownloadModal } from './AppDownloadModal';

interface HeaderProps {
  onOpenNewOrder: () => void;
  onOpenAICopilot: () => void;
  onResetData: () => void;
  cartItemCount?: number;
  onOpenCart?: () => void;
  onOpenAccount?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onToggleMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewOrder,
  onOpenAICopilot,
  onResetData,
  cartItemCount = 0,
  onOpenCart,
  onOpenAccount,
  searchQuery = '',
  onSearchChange,
  notificationCount = 0,
  onOpenNotifications,
  onToggleMenu
}) => {
  const { 
    currentUser, 
    authenticatedUser,
    currentRole, 
    isAdmin,
    isSalesman,
    isRetailer,
    isAuthenticatedWithSupabase, 
    openAuthModal, 
    logout 
  } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  const isOwnerOrAdmin = authenticatedUser?.role === 'admin' || currentUser?.role === 'admin';

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Distributor Owner',
          bg: 'bg-blue-950/80 text-blue-200 border border-blue-800',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-400" />
        };
      case 'salesman':
        return {
          label: 'Sales Rep (DSR)',
          bg: 'bg-slate-700/80 text-slate-200 border border-slate-600',
          icon: <Briefcase className="w-3.5 h-3.5 mr-1 text-blue-300" />
        };
      case 'delivery':
        return {
          label: 'Delivery Partner',
          bg: 'bg-emerald-950/80 text-emerald-200 border border-emerald-800',
          icon: <Truck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
        };
      case 'accounts':
        return {
          label: 'Accounts & Finance',
          bg: 'bg-purple-950/80 text-purple-200 border border-purple-800',
          icon: <Calculator className="w-3.5 h-3.5 mr-1 text-purple-400" />
        };
      case 'retailer':
        return {
          label: 'Retailer Portal',
          bg: 'bg-amber-950/80 text-amber-200 border border-amber-800',
          icon: <Store className="w-3.5 h-3.5 mr-1 text-amber-400" />
        };
      default:
        return { label: role, bg: 'bg-slate-800 text-slate-200 border border-slate-700', icon: null };
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset database to default FMCG sample data (Products, Retailers, Orders, Stock)?')) {
      setIsResetting(true);
      await onResetData();
      setIsResetting(false);
    }
  };

  const badge = getRoleBadge(currentRole);

  const renderDropdown = () => (
    <div 
      className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Authenticated User Account Details */}
      <div className="px-3.5 py-2">
        <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-9 h-9 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
            {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AA'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-900 truncate">{currentUser?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || currentUser?.phone}</p>
            <div className="mt-1.5 flex items-center space-x-1.5 flex-wrap gap-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wide">
                {badge.label}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center">
                <Lock className="w-3 h-3 mr-0.5 text-slate-400" />
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Security & Access Info */}
        <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-start space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            {isAuthenticatedWithSupabase 
              ? 'Signed in with secure authenticated account. Permissions are locked to your role.' 
              : 'Signed in session. Access is strictly scoped to your registered account.'}
          </p>
        </div>
      </div>

      {/* Admin Quick Action: Payment & Checkout Settings */}
      {isOwnerOrAdmin && (
        <div className="px-3 py-1">
          <button
            onClick={() => {
              setShowRoleDropdown(false);
              setIsSettingsOpen(true);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Checkout & Payment Settings</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-600">
              COD / UPI
            </span>
          </button>
        </div>
      )}

      {/* Account Actions */}
      <div className="border-t border-slate-100 mt-2 pt-2 px-3 space-y-1">
        {/* App Download Action */}
        <button
          onClick={() => {
            setShowRoleDropdown(false);
            setIsDownloadOpen(true);
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer font-medium"
        >
          <div className="flex items-center space-x-2">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Download Android App</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">
            APK
          </span>
        </button>

        {onOpenAccount && (
          <button
            onClick={() => {
              setShowRoleDropdown(false);
              onOpenAccount();
            }}
            className="w-full flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-800 hover:text-blue-700 py-2 bg-blue-50/70 hover:bg-blue-100/80 rounded-lg transition-colors cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>My Account Details</span>
          </button>
        )}

        <button
          onClick={() => {
            setShowRoleDropdown(false);
            openAuthModal();
          }}
          className="w-full flex items-center justify-center space-x-1.5 text-xs text-blue-600 hover:text-blue-700 py-1.5 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Switch Account / Sign In</span>
        </button>

        <button
          onClick={() => {
            setShowRoleDropdown(false);
            logout();
          }}
          className="w-full flex items-center justify-center space-x-1.5 text-xs text-slate-600 hover:text-rose-600 py-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out Session</span>
        </button>

        {isOwnerOrAdmin && (
          <button
            onClick={() => {
              setShowRoleDropdown(false);
              handleReset();
            }}
            disabled={isResetting}
            className="w-full flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 hover:text-rose-600 py-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset FMCG Demo Data'}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <header className="bg-[#0B1E3F] text-white border-b border-blue-900/60 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* DESKTOP TOP BAR (screens >= 768px)                                        */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3.5">
            <AryanAgencyLogo 
              variant="fmcg-basket" 
              size="md" 
              theme="dark" 
            />
          </div>

          {/* Desktop Search Bar */}
          {onSearchChange && (
            <div className="flex-1 max-w-md mx-6">
              <div className="relative">
                <Search className="w-4 h-4 text-blue-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="desktop-header-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search products, brands, FMCG categories..."
                  className="w-full bg-[#13284c] border border-blue-800/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-300 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Action Tools & Role Switcher */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Supabase Auth Key Button */}
            <button
              id="header-supabase-auth-btn"
              onClick={openAuthModal}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#13284c] hover:bg-[#1a3666] text-slate-200 border border-blue-800/80 shadow-xs transition-colors cursor-pointer"
              title="Supabase Authentication & Role Manager"
            >
              <KeyRound className="w-3.5 h-3.5 sm:mr-1.5 text-emerald-400" />
              <span className="hidden lg:inline">{isAuthenticatedWithSupabase ? 'Supabase Auth' : 'Auth Login'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                type="button"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg bg-[#13284c] hover:bg-[#1a3666] text-white border border-blue-800/80 transition-colors cursor-pointer"
                title="View Notifications & Alerts"
                aria-label="View Notifications"
              >
                <Bell className="w-4 h-4 text-blue-200" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#E53E3E] text-white font-black text-[10px] flex items-center justify-center ring-2 ring-[#0B1E3F]">
                    {notificationCount}
                  </span>
                )}
              </button>
            </div>

            {/* Shopping Cart Button */}
            {onOpenCart && (
              <button
                id="header-cart-btn"
                onClick={onOpenCart}
                className="relative inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-[#13284c] hover:bg-[#1a3666] text-slate-200 border border-blue-800/80 shadow-xs transition-colors cursor-pointer"
                title="View Active Order Cart"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:mr-1.5 text-amber-400" />
                <span className="hidden sm:inline">Cart</span>
                {cartItemCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Download App (APK) Button */}
            <button
              id="header-download-app-btn"
              onClick={() => setIsDownloadOpen(true)}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-600/60 shadow-xs transition-colors cursor-pointer"
              title="Download Aryan Agency Android App (APK)"
            >
              <Download className="w-3.5 h-3.5 sm:mr-1.5 text-emerald-400" />
              <span className="hidden sm:inline">Download App</span>
            </button>

            {/* AI Copilot Button */}
            <button
              id="ai-copilot-btn"
              onClick={onOpenAICopilot}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-[#13284c] hover:bg-[#1a3666] text-slate-200 border border-blue-800/80 shadow-xs transition-colors cursor-pointer"
              title="AI FMCG Demand & Order Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              <span>Aryan AI</span>
            </button>

            {/* Quick Order Punch Button - Salesman and Admin only */}
            {!isRetailer && (isSalesman || isAdmin) && (
              <button
                id="header-punch-order-btn"
                onClick={onOpenNewOrder}
                className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#1A73E8] hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>Punch Order</span>
              </button>
            )}

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="role-switch-btn"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-2.5 bg-[#13284c] hover:bg-[#1a3666] text-white text-xs px-3 py-1.5 rounded-lg border border-blue-800 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#1A73E8] overflow-hidden flex items-center justify-center shrink-0 text-white font-bold text-[10px]">
                  {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AA'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold leading-tight text-slate-100 max-w-[120px] truncate">{currentUser?.name}</div>
                  <div className="text-[10px] text-blue-200">{badge.label}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
              </button>

              {/* Dropdown Menu */}
              {showRoleDropdown && renderDropdown()}
            </div>

            {/* Quick Logout Button */}
            <button
              id="header-logout-btn"
              onClick={logout}
              title="Sign Out of Supabase Session"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg border border-slate-700/80 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE COMPACT ANDROID APP BAR (screens <= 767px)                         */}
        {/* Exact match to reference image:                                           */}
        {/* Menu | Aryan Agency FMCG Logo | Search | Notification | Profile           */}
        {/* ========================================================================= */}
        <div className="md:hidden py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            {/* Left: Menu & Brand Logo */}
            <div className="flex items-center space-x-2 min-w-0">
              {onToggleMenu && (
                <button
                  id="mobile-header-menu-btn"
                  onClick={onToggleMenu}
                  className="w-9 h-9 rounded-lg bg-[#13284c] border border-blue-800/80 flex items-center justify-center text-white active:scale-95 transition-transform"
                  title="Open FMCG Navigation"
                >
                  <Menu className="w-5 h-5 text-white" />
                </button>
              )}
              <AryanAgencyLogo 
                variant="fmcg-basket" 
                size="sm" 
                theme="dark" 
              />
            </div>

            {/* Right: Notifications, Profile */}
            <div className="flex items-center space-x-2 shrink-0">
              {/* Notification Icon */}
              <button
                id="mobile-header-notification-btn"
                type="button"
                onClick={onOpenNotifications}
                className="relative w-9 h-9 rounded-lg bg-[#13284c] border border-blue-800/80 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
                title="View Notifications & Alerts"
                aria-label="View Notifications"
              >
                <Bell className="w-4 h-4 text-blue-200" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#E53E3E] text-white font-black text-[10px] flex items-center justify-center ring-2 ring-[#0B1E3F]">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* User Profile / Account Trigger */}
              <div className="relative">
                <button
                  id="mobile-header-profile-btn"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="w-9 h-9 rounded-lg bg-[#13284c] border border-blue-800/80 flex items-center justify-center text-white active:scale-95 transition-transform relative"
                  title="Profile & Roles"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1A73E8] flex items-center justify-center text-[10px] font-bold">
                    {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AA'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B1E3F]" />
                </button>

                {/* Mobile Dropdown Popup */}
                {showRoleDropdown && renderDropdown()}
              </div>
            </div>
          </div>

          {/* Mobile Search Bar - Directly visible as in reference UI */}
          {onSearchChange && (
            <div className="relative pt-0.5">
              <Search className="w-4 h-4 text-blue-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="mobile-header-search"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products, brands, biscuits, snacks..."
                className="w-full bg-[#13284c] border border-blue-800/80 rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-300 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Distributor Settings Modal */}
      {isSettingsOpen && (
        <DistributorSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* App Download Modal */}
      {isDownloadOpen && (
        <AppDownloadModal
          isOpen={isDownloadOpen}
          onClose={() => setIsDownloadOpen(false)}
        />
      )}
    </header>
  );
};
