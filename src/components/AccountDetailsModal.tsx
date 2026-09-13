import React from 'react';
import { 
  User as UserIcon, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Store, 
  ShieldCheck, 
  CreditCard, 
  PackageCheck, 
  Clock, 
  Truck, 
  LogOut, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Receipt,
  Headphones,
  BadgePercent,
  Package,
  ClipboardList,
  Percent
} from 'lucide-react';
import { User, Order, Retailer, Salesman } from '../types';
import { formatINR } from '../lib/api';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  retailers?: Retailer[];
  salesmen?: Salesman[];
  orders?: Order[];
  onNavigateTab: (tab: any) => void;
  onLogout: () => void;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  retailers = [],
  salesmen = [],
  orders = [],
  onNavigateTab,
  onLogout
}) => {
  if (!isOpen || !currentUser) return null;

  // Find linked retailer profile if retailer
  const linkedRetailer = retailers.find(
    r => r.id === currentUser.retailerId || 
    r.storeName.toLowerCase() === currentUser.name.toLowerCase() ||
    (currentUser.email && r.phone && currentUser.email.includes(r.phone))
  ) || (currentUser.role === 'retailer' && retailers.length > 0 ? retailers[0] : null);

  // Find linked salesman profile if salesman
  const linkedSalesman = salesmen.find(
    s => s.id === currentUser.salesmanId ||
    s.name.toLowerCase() === currentUser.name.toLowerCase()
  ) || (currentUser.role === 'salesman' && salesmen.length > 0 ? salesmen[0] : null);

  // User relevant orders
  const userOrders = orders.filter(o => {
    if (linkedRetailer) return o.retailerId === linkedRetailer.id;
    if (linkedSalesman) return o.salesmanId === linkedSalesman.id;
    return true;
  });

  const activeOrders = userOrders.filter(o => ['booked', 'confirmed', 'packed', 'out_for_delivery', 'dispatched'].includes(o.status));
  const completedOrders = userOrders.filter(o => o.status === 'delivered');

  // Role badge display config
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Distributor Owner & Admin', color: 'bg-blue-600 text-white', badgeBg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'salesman':
        return { label: 'DSR Sales Representative', color: 'bg-indigo-600 text-white', badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'retailer':
        return { label: 'Registered Kirana Partner', color: 'bg-emerald-600 text-white', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'delivery':
        return { label: 'Depot Delivery Fleet Partner', color: 'bg-amber-600 text-white', badgeBg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'accounts':
        return { label: 'Finance & GST Billing Desk', color: 'bg-purple-600 text-white', badgeBg: 'bg-purple-50 text-purple-800 border-purple-200' };
      default:
        return { label: 'FMCG Business User', color: 'bg-slate-700 text-white', badgeBg: 'bg-slate-50 text-slate-800 border-slate-200' };
    }
  };

  const roleConfig = getRoleConfig(currentUser.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================================= */}
        {/* MODAL HEADER: Aryan Agency Navy Blue Profile Banner                        */}
        {/* ========================================================================= */}
        <div className="relative bg-gradient-to-r from-[#0B1E3F] via-[#102A54] to-[#16386E] text-white p-5 sm:p-6">
          {/* Close Button */}
          <button
            id="close-account-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Account Details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Identity & Avatar */}
          <div className="flex items-center space-x-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-[#0B1E3F] font-black text-2xl flex items-center justify-center shadow-lg ring-4 ring-white/15">
                {currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AA'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0B1E3F] flex items-center justify-center" title="Active Verified Session">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {currentUser.name}
                </h2>
              </div>
              <p className="text-xs text-blue-200 font-medium truncate mt-0.5">
                {currentUser.email || 'Retail Partner Account'}
              </p>
              
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-400 text-slate-950 shadow-xs">
                  {roleConfig.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-blue-100 border border-white/20">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                  Verified FMCG Partner
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY (Scrollable)                                                  */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* Quick Hub Navigation Cards (Catalog, Orders, Offers, Account) */}
          <section className="w-full">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Card 1: Catalog - All Products */}
              <button
                id="acc-quick-catalog"
                onClick={() => {
                  onClose();
                  onNavigateTab('products');
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#EEF4FF] hover:bg-blue-100/70 border border-blue-100 transition-all text-left group cursor-pointer active:scale-95 shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#1A73E8] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 leading-tight">Catalog</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">All Products</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Card 2: Orders - Track & Manage */}
              <button
                id="acc-quick-orders"
                onClick={() => {
                  onClose();
                  onNavigateTab('orders');
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#EDF8F1] hover:bg-emerald-100/70 border border-emerald-100 transition-all text-left group cursor-pointer active:scale-95 shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#0F9D58] text-white flex items-center justify-center shadow-xs shrink-0">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 leading-tight">Orders</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">Track & Manage</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Card 3: Offers - Special Deals */}
              <button
                id="acc-quick-offers"
                onClick={() => {
                  onClose();
                  onNavigateTab('products');
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF4ED] hover:bg-orange-100/70 border border-orange-100 transition-all text-left group cursor-pointer active:scale-95 shadow-2xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#F4511E] text-white flex items-center justify-center shadow-xs shrink-0">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 leading-tight">Offers</p>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">Special Deals</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Card 4: Account - Profile & Credit (Active View) */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F0FF] border border-purple-200/90 text-left shadow-2xs ring-2 ring-purple-400/25"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#673AB7] text-white flex items-center justify-center shadow-xs shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-black text-purple-950 leading-tight">Account</p>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900">
                        Active
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-purple-700 mt-0.5 truncate">Profile & Credit</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              </div>
            </div>
          </section>

          {/* 1. Retailer Business & Beat Information (if Retailer or linked Store) */}
          {linkedRetailer && (
            <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Store className="w-4 h-4 text-blue-700" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Store & Beat Details
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-blue-100 text-blue-800">
                  {linkedRetailer.beatName || 'Assigned Beat'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Outlet Name</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{linkedRetailer.storeName}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Owner / Contact</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{linkedRetailer.ownerName}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">GSTIN / Tax ID</span>
                  <span className="font-bold text-slate-800 mt-0.5 block font-mono">{linkedRetailer.gstin || '29AAAAA0000A1Z5 (Composition)'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Delivery Beat Route</span>
                  <span className="font-bold text-slate-800 mt-0.5 block">{linkedRetailer.beatName || 'City Central Beat'}</span>
                </div>
                {linkedRetailer.address && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100 sm:col-span-2 flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-xs font-medium">{linkedRetailer.address}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 2. Contact & Personal Profile */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-slate-700" />
              <span>Contact & Account Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</p>
                  <p className="font-bold text-slate-800 truncate">{currentUser.phone || linkedRetailer?.phone || '+91 98450 12345'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Registered Email</p>
                  <p className="font-bold text-slate-800 truncate">{currentUser.email || 'account@aryanagency.in'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Credit & Ledger Summary (Financial Details) */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-blue-800" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Wholesale Ledger & Credit Terms
                </h3>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('payments');
                }}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-0.5 cursor-pointer"
              >
                <span>View Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Credit Limit</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 mt-1 block">
                  {linkedRetailer?.creditLimit ? formatINR(linkedRetailer.creditLimit) : '₹50,000'}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Outstanding</span>
                <span className={`text-xs sm:text-sm font-black mt-1 block ${
                  (linkedRetailer?.outstandingBalance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {formatINR(linkedRetailer?.outstandingBalance || 0)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Days</span>
                <span className="text-xs sm:text-sm font-black text-blue-700 mt-1 block">
                  {linkedRetailer?.paymentTermsDays || 15} Days
                </span>
              </div>
            </div>
          </section>

          {/* 4. Orders History & Quick Navigation */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Order Summary
                </h3>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onNavigateTab('orders');
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-0.5 cursor-pointer"
              >
                <span>Track & Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-900 leading-none">{activeOrders.length}</p>
                  <p className="text-[10px] font-bold text-emerald-700 mt-1">Active Deliveries</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-black text-blue-900 leading-none">{userOrders.length}</p>
                  <p className="text-[10px] font-bold text-blue-700 mt-1">Total Orders</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Direct Distributor Support & Helpdesk */}
          <section className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">Depot Order Helpline</p>
                <p className="text-[11px] text-slate-600">Yeshwanthpur Distribution Hub • 9:00 AM – 8:00 PM</p>
              </div>
            </div>
            <a
              href="tel:+919845012345"
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-slate-900 hover:bg-amber-100 transition-colors"
            >
              Call Hub
            </a>
          </section>

        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                             */}
        {/* ========================================================================= */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            id="account-modal-logout-btn"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 max-w-[160px] py-2.5 px-4 rounded-xl bg-[#0B1E3F] hover:bg-[#16386E] text-white text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
