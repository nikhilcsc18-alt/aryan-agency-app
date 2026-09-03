import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AryanAgencyLogo } from './AryanAgencyLogo';
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
  ShieldAlert
} from 'lucide-react';

interface HeaderProps {
  onOpenNewOrder: () => void;
  onOpenAICopilot: () => void;
  onResetData: () => void;
  cartItemCount?: number;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewOrder,
  onOpenAICopilot,
  onResetData,
  cartItemCount = 0,
  onOpenCart
}) => {
  const { 
    currentUser, 
    authenticatedUser,
    allUsers, 
    switchUser, 
    currentRole, 
    isAdmin,
    isAuthenticatedWithSupabase, 
    openAuthModal, 
    logout 
  } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  return (
    <header className="bg-[#1e293b] text-white border-b border-slate-700/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3.5">
            <AryanAgencyLogo 
              variant="horizontal" 
              size="md" 
              theme="dark" 
            />
          </div>

          {/* Action Tools & Role Switcher */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            
            {/* Supabase Auth Key Button */}
            <button
              id="header-supabase-auth-btn"
              onClick={openAuthModal}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 shadow-xs transition-colors cursor-pointer"
              title="Supabase Authentication & Role Manager"
            >
              <KeyRound className="w-3.5 h-3.5 sm:mr-1.5 text-emerald-400" />
              <span className="hidden lg:inline">{isAuthenticatedWithSupabase ? 'Supabase Auth' : 'Auth Login'}</span>
            </button>

            {/* Shopping Cart Button */}
            {onOpenCart && (
              <button
                id="header-cart-btn"
                onClick={onOpenCart}
                className="relative inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 shadow-xs transition-colors cursor-pointer"
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

            {/* AI Copilot Button */}
            <button
              id="ai-copilot-btn"
              onClick={onOpenAICopilot}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/80 shadow-xs transition-colors cursor-pointer"
              title="AI FMCG Demand & Order Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              <span className="hidden md:inline">Aryan AI</span>
              <span className="md:hidden">AI</span>
            </button>

            {/* Quick Order Punch Button */}
            <button
              id="header-punch-order-btn"
              onClick={onOpenNewOrder}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Punch Order</span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="role-switch-btn"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-2.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors focus:outline-none cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#2563eb] overflow-hidden flex items-center justify-center shrink-0 text-white font-bold text-[10px]">
                  {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AA'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold leading-tight text-slate-100 max-w-[120px] truncate">{currentUser?.name}</div>
                  <div className="text-[10px] text-slate-400">{badge.label}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showRoleDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 text-slate-800"
                  onClick={() => setShowRoleDropdown(false)}
                >
                  {isOwnerOrAdmin ? (
                    <>
                      <div className="px-3.5 py-2 border-b border-slate-100 mb-1.5 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Admin Impersonation</p>
                          <p className="text-xs text-slate-500">Switch persona to test operational workflows</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold uppercase">
                          Admin
                        </span>
                      </div>

                      <div className="space-y-0.5 max-h-56 overflow-y-auto px-1">
                        {allUsers.map((user) => {
                          const isSelected = user.id === currentUser?.id;
                          const uBadge = getRoleBadge(user.role);
                          return (
                            <button
                              key={user.id}
                              onClick={() => switchUser(user.id)}
                              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-md hover:bg-slate-50 transition-colors ${
                                isSelected ? 'bg-blue-50/80 font-semibold' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-bold text-[10px]">
                                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <div className="text-slate-900 font-medium">{user.name}</div>
                                  <div className="text-[10px] text-slate-500">{uBadge.label}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#2563eb]" />}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="px-3.5 py-2">
                      <div className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                          <div className="mt-1 flex items-center space-x-1.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                              {currentRole}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center">
                              <Lock className="w-3 h-3 mr-0.5 text-slate-400" />
                              Role Locked
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 p-2.5 rounded-md bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start space-x-2">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="leading-snug">
                          Role switching is strictly disabled. Your access is determined by your authenticated Supabase account.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-100 mt-2 pt-1.5 px-3 space-y-1">
                    <button
                      onClick={() => openAuthModal()}
                      className="w-full flex items-center justify-center space-x-1.5 text-xs text-blue-600 hover:text-blue-700 py-1.5 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Switch Account / Sign In</span>
                    </button>
                    <button
                      onClick={logout}
                      className="w-full flex items-center justify-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 py-1.5 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out Session</span>
                    </button>
                    {isOwnerOrAdmin && (
                      <button
                        onClick={handleReset}
                        disabled={isResetting}
                        className="w-full flex items-center justify-center space-x-1.5 text-xs text-rose-600 hover:text-rose-700 py-1.5 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                        <span>{isResetting ? 'Resetting...' : 'Reset Demo FMCG Data'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
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
      </div>
    </header>
  );
};
