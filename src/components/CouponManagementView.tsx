import React, { useState, useEffect, useMemo } from 'react';
import { Coupon, CouponRedemption, UpiDiscountConfig, Product, ProductCategory } from '../types';
import { api, formatINR, formatINRDecimals } from '../lib/api';
import { exportReportToCsv, exportReportToExcel, printReportPreview } from '../lib/exportUtils';
import { 
  Tag, 
  Percent, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  RotateCcw, 
  Download, 
  Printer, 
  Search, 
  Sliders, 
  IndianRupee, 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Users, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';

interface CouponManagementViewProps {
  products: Product[];
  onOpenProductScheme?: () => void;
}

export const CouponManagementView: React.FC<CouponManagementViewProps> = ({
  products = []
}) => {
  const [activeTab, setActiveTab] = useState<'coupons' | 'upi_config' | 'analytics'>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [upiConfig, setUpiConfig] = useState<UpiDiscountConfig>({ isEnabled: true, percentage: 0.5 });
  const [reportsData, setReportsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  // Modal State for Create/Edit Coupon
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);

  // UPI Config Edit State
  const [editUpiEnabled, setEditUpiEnabled] = useState(true);
  const [editUpiPercentage, setEditUpiPercentage] = useState(0.5);

  // Simulator State
  const [simOrderAmount, setSimOrderAmount] = useState<number>(5000);
  const [simSelectedCoupon, setSimSelectedCoupon] = useState<string>('HONEY50');
  const [simPaymentMode, setSimPaymentMode] = useState<'upi' | 'cod'>('upi');

  // Available Brands & Categories from Products
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.brand) set.add(p.brand);
    });
    // Ensure Honey Bunny is present in the list
    set.add('Honey Bunny');
    return Array.from(set).sort();
  }, [products]);

  const availableCategories: ProductCategory[] = [
    'Biscuits & Bakery',
    'Beverages',
    'Confectionery & Chocolates',
    'Snacks & Namkeen',
    'Personal Care',
    'Baby Care',
    'Home Care',
    'Household & Hygiene',
    'Spices & Staples',
    'Dairy & Refrigerated'
  ];

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [cpns, uConfig, rData] = await Promise.all([
        api.getCoupons(),
        api.getUpiDiscountConfig(),
        api.getCouponReports()
      ]);
      setCoupons(cpns);
      setUpiConfig(uConfig);
      setEditUpiEnabled(uConfig.isEnabled);
      setEditUpiPercentage(uConfig.percentage);
      setReportsData(rData);
    } catch (err: any) {
      console.error('Error loading coupon management data:', err);
      showToast(err?.message || 'Failed to load coupon data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      if (statusFilter === 'active' && !c.isActive) return false;
      if (statusFilter === 'inactive' && c.isActive) return false;
      if (brandFilter !== 'all' && c.targetBrand !== brandFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = (c.code || '').toLowerCase().includes(q);
        const matchesTitle = (c.title || '').toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        const matchesBrand = (c.targetBrand || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesDesc && !matchesBrand) return false;
      }
      return true;
    });
  }, [coupons, statusFilter, brandFilter, searchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = (preset?: 'honey_bunny') => {
    if (preset === 'honey_bunny') {
      setEditingCoupon({
        code: 'HONEY50',
        title: 'Honey Bunny Special Discount Campaign',
        description: 'Flat ₹50 OFF on Honey Bunny baby care products on orders above ₹1,000',
        applicableTo: 'brand',
        targetBrand: 'Honey Bunny',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 1000,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        totalUsageLimit: 1000,
        perCustomerUsageLimit: 5,
        isActive: true
      });
    } else {
      setEditingCoupon({
        code: '',
        title: '',
        description: '',
        applicableTo: 'all',
        discountType: 'fixed',
        discountValue: 50,
        minOrderAmount: 1000,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        totalUsageLimit: 500,
        perCustomerUsageLimit: 1,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon({
      ...coupon,
      startDate: coupon.startDate ? coupon.startDate.split('T')[0] : '',
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const updated = await api.saveCoupon({
        ...coupon,
        isActive: !coupon.isActive
      });
      setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c));
      showToast(`Coupon ${updated.code} is now ${updated.isActive ? 'Active' : 'Deactivated'}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to update coupon status', 'error');
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) {
      return;
    }
    try {
      await api.deleteCoupon(coupon.id);
      setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      showToast(`Coupon ${coupon.code} deleted successfully.`);
      loadAllData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete coupon', 'error');
    }
  };

  const handleSaveCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon || !editingCoupon.code?.trim()) {
      showToast('Coupon code is required', 'error');
      return;
    }
    if (!editingCoupon.discountValue || editingCoupon.discountValue <= 0) {
      showToast('Discount value must be greater than 0', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        ...editingCoupon,
        code: editingCoupon.code.trim().toUpperCase(),
        discountValue: Number(editingCoupon.discountValue),
        minOrderAmount: Number(editingCoupon.minOrderAmount || 0),
        maxDiscountLimit: editingCoupon.maxDiscountLimit ? Number(editingCoupon.maxDiscountLimit) : undefined,
        totalUsageLimit: editingCoupon.totalUsageLimit ? Number(editingCoupon.totalUsageLimit) : undefined,
        perCustomerUsageLimit: editingCoupon.perCustomerUsageLimit ? Number(editingCoupon.perCustomerUsageLimit) : 1,
        startDate: editingCoupon.startDate ? new Date(editingCoupon.startDate).toISOString() : new Date().toISOString(),
        expiryDate: editingCoupon.expiryDate ? new Date(editingCoupon.expiryDate).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString()
      };

      const saved = await api.saveCoupon(payload);
      showToast(`Coupon ${saved.code} saved successfully!`);
      setIsModalOpen(false);
      setEditingCoupon(null);
      await loadAllData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save coupon', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUpiConfig = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateUpiDiscountConfig({
        isEnabled: editUpiEnabled,
        percentage: Number(editUpiPercentage)
      });
      setUpiConfig(updated);
      showToast(`UPI Discount settings updated (${updated.percentage}% - ${updated.isEnabled ? 'Enabled' : 'Disabled'})`);
      await loadAllData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update UPI discount', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Simulator Calculations
  const simCalculations = useMemo(() => {
    const orderAmt = Number(simOrderAmount) || 0;
    const selectedCpn = coupons.find(c => c.code.toUpperCase() === simSelectedCoupon.toUpperCase());

    let couponDiscount = 0;
    if (selectedCpn && selectedCpn.isActive && orderAmt >= (selectedCpn.minOrderAmount || 0)) {
      if (selectedCpn.discountType === 'fixed') {
        couponDiscount = Math.min(selectedCpn.discountValue, orderAmt);
      } else {
        let disc = (orderAmt * selectedCpn.discountValue) / 100;
        if (selectedCpn.maxDiscountLimit) disc = Math.min(disc, selectedCpn.maxDiscountLimit);
        couponDiscount = Math.round(disc * 100) / 100;
      }
    }

    const remainingAmount = Math.max(0, orderAmt - couponDiscount);
    let upiDiscount = 0;
    if (simPaymentMode === 'upi' && upiConfig.isEnabled) {
      upiDiscount = Math.round((remainingAmount * (upiConfig.percentage / 100)) * 100) / 100;
    }

    const finalPayable = Math.max(0, remainingAmount - upiDiscount);
    const totalSavings = couponDiscount + upiDiscount;

    return {
      orderAmt,
      couponDiscount,
      remainingAmount,
      upiDiscount,
      finalPayable,
      totalSavings,
      selectedCpn
    };
  }, [simOrderAmount, simSelectedCoupon, simPaymentMode, coupons, upiConfig]);

  // Export Analytics
  const handleExportAnalyticsCsv = () => {
    if (!reportsData?.couponStats) return;
    const columns = [
      { header: 'Coupon Code', dataKey: 'code' },
      { header: 'Campaign Title', dataKey: 'title' },
      { header: 'Target Scope', dataKey: 'scope' },
      { header: 'Discount Type', dataKey: 'discountType' },
      { header: 'Value', dataKey: 'discountValue' },
      { header: 'Redemptions', dataKey: 'redemptionsCount' },
      { header: 'Discounts Given (₹)', dataKey: 'totalDiscountGiven' },
      { header: 'Sales Generated (₹)', dataKey: 'totalSalesVolume' },
      { header: 'Status', dataKey: 'status' }
    ];
    const rows = reportsData.couponStats.map((c: any) => ({
      code: c.code,
      title: c.title,
      scope: c.applicableTo === 'brand' ? `Brand: ${c.targetBrand}` : c.applicableTo,
      discountType: c.discountType,
      discountValue: c.discountValue,
      redemptionsCount: c.redemptionsCount,
      totalDiscountGiven: c.totalDiscountGiven,
      totalSalesVolume: c.totalSalesVolume,
      status: c.isActive ? 'Active' : 'Inactive'
    }));

    exportReportToCsv({
      reportTitle: 'Coupon Campaign Performance',
      fileNamePrefix: 'coupon_campaign_performance',
      periodLabel: 'All Campaigns',
      columns,
      rows
    });
  };

  const handlePrintAnalytics = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-bottom duration-200 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950 text-emerald-100 border-emerald-800' 
            : 'bg-rose-950 text-rose-100 border-rose-800'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Header Banner in Royal Navy #0B132B & Gold #F59E0B */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B132B] text-white p-5 sm:p-6 shadow-sm border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                Promotion & Growth Desk
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Automatic 0.5% UPI Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Coupons & Offers Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Create product & brand promo codes (e.g. <strong>HONEY50</strong> for Honey Bunny), configure automatic 0.5% UPI discount, and monitor digital redemption analytics.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenCreateModal('honey_bunny')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Honey Bunny Preset</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Coupon</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-6 flex items-center space-x-2 border-t border-slate-800 pt-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Active Coupons ({coupons.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upi_config')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'upi_config'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>UPI 0.5% Discount & Simulator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Discount Analytics & Redemptions</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: COUPONS LIST & MANAGEMENT                                     */}
      {/* =================================================================== */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          
          {/* Quick Filters & Search Bar */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by code (e.g. HONEY50), title or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Brands</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coupons Table / Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoupons.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No coupons match your criteria</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click below to create a new promo code or restore the Honey Bunny campaign.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal('honey_bunny')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    Add HONEY50 Coupon
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Create Custom Coupon
                  </button>
                </div>
              </div>
            ) : (
              filteredCoupons.map((coupon) => (
                <div 
                  key={coupon.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  {/* Top Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-base font-black px-3 py-1 rounded-lg bg-[#0B132B] text-amber-400 tracking-wider shadow-2xs">
                          {coupon.code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          coupon.isActive 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {coupon.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black font-mono text-emerald-700">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2.5 leading-snug">
                      {coupon.title}
                    </h3>
                    {coupon.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {coupon.description}
                      </p>
                    )}
                  </div>

                  {/* Conditions & Scope */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[11px] space-y-1.5 text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Target Scope:</span>
                      <strong className="text-slate-900">
                        {coupon.applicableTo === 'brand' ? (
                          <span className="text-blue-700 font-bold">Brand: {coupon.targetBrand}</span>
                        ) : coupon.applicableTo === 'category' ? (
                          <span className="text-purple-700 font-bold">Category: {coupon.targetCategory}</span>
                        ) : coupon.applicableTo === 'products' ? (
                          <span>{coupon.targetProductIds?.length || 0} Specific Products</span>
                        ) : (
                          <span className="text-slate-700 font-bold">All Store Products</span>
                        )}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span>Min Order Required:</span>
                      <strong className="text-slate-900 font-mono">
                        {coupon.minOrderAmount > 0 ? formatINR(coupon.minOrderAmount) : 'No Minimum'}
                      </strong>
                    </div>

                    {coupon.discountType === 'percentage' && coupon.maxDiscountLimit && (
                      <div className="flex justify-between items-center">
                        <span>Max Cap Limit:</span>
                        <strong className="text-slate-900 font-mono">₹{coupon.maxDiscountLimit}</strong>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span>Redemptions Used:</span>
                      <strong className="text-slate-900 font-mono">
                        {coupon.usedCount || 0} {coupon.totalUsageLimit ? `/ ${coupon.totalUsageLimit}` : ''}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                      <span>Expires:</span>
                      <span>{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('en-IN') : 'Never'}</span>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(coupon)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        coupon.isActive 
                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' 
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditCoupon(coupon)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit coupon"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: AUTOMATIC UPI DISCOUNT CONFIG & LIVE SIMULATOR                */}
      {/* =================================================================== */}
      {activeTab === 'upi_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Configuration Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Automatic UPI Payment Discount</h3>
                <p className="text-xs text-slate-500">Incentivize digital prepaid orders over cash on delivery</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Enable / Disable Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Enable Automatic UPI Discount</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When active, customers choosing QR Code or UPI Direct automatically receive this discount.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUpiEnabled}
                    onChange={(e) => setEditUpiEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Percentage Setting */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  UPI Discount Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="10"
                    value={editUpiPercentage}
                    onChange={(e) => setEditUpiPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Default: <strong>0.5%</strong>. Calculated automatically on the order balance <em>after</em> coupon discount has been applied.
                </p>
              </div>

              {/* Strict Business Rules Info */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950 space-y-1.5">
                <span className="font-bold flex items-center space-x-1.5 text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Enforced Security Rules</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-900/90 pl-1">
                  <li><strong>COD Excluded:</strong> Cash on Delivery orders never receive the 0.5% UPI discount.</li>
                  <li><strong>Order Level Recalculation:</strong> The server recalculates and locks the discount upon booking.</li>
                  <li><strong>Combination with Coupons:</strong> Both Honey Bunny coupons and UPI discounts apply sequentially on the same order.</li>
                </ul>
              </div>

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveUpiConfig}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Save UPI Discount Configuration</span>
              </button>
            </div>
          </div>

          {/* Right: Live Interactive Simulator */}
          <div className="bg-[#0B132B] text-white rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Live Checkout Simulator</h4>
                  <p className="text-[10px] text-slate-400">Test coupon + UPI discount formulas together</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Formula Verified
              </span>
            </div>

            {/* Input Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Product Order Gross Amount (₹)</label>
                <input
                  type="number"
                  value={simOrderAmount}
                  onChange={(e) => setSimOrderAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Apply Coupon</label>
                <select
                  value={simSelectedCoupon}
                  onChange={(e) => setSimSelectedCoupon(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="NONE">No Coupon</option>
                  {coupons.map(c => (
                    <option key={c.id} value={c.code}>{c.code} ({c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method Switcher */}
            <div>
              <label className="block text-slate-400 text-[11px] mb-1.5">Select Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSimPaymentMode('upi')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    simPaymentMode === 'upi'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>UPI / QR ({editUpiPercentage}%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimPaymentMode('cod')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    simPaymentMode === 'cod'
                      ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Cash on Delivery (0%)</span>
                </button>
              </div>
            </div>

            {/* Step-by-Step Breakdown Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Product Order Amount:</span>
                <span className="text-white font-bold">{formatINR(simCalculations.orderAmt)}</span>
              </div>

              {simCalculations.couponDiscount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>{simCalculations.selectedCpn?.code || 'Coupon'} Discount:</span>
                  <span className="font-bold">-₹{simCalculations.couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                <span>Remaining Amount:</span>
                <span>₹{simCalculations.remainingAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-400">
                <span>UPI Discount ({editUpiPercentage}%):</span>
                <span className="font-bold">
                  {simPaymentMode === 'upi' ? `-₹${simCalculations.upiDiscount.toFixed(2)}` : '₹0.00 (COD Excluded)'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline text-sm">
                <span className="text-white font-sans font-bold">Final Payable Amount:</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {formatINRDecimals(simCalculations.finalPayable)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[11px] font-sans font-bold flex items-center justify-between">
                <span>Total Customer Savings:</span>
                <span className="font-mono text-emerald-400 font-black">
                  ₹{simCalculations.totalSavings.toFixed(2)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Formula: <code>Final Payable = (Order - Coupon) - ((Order - Coupon) × {editUpiPercentage}%)</code>
            </p>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: ANALYTICS & REPORTS                                          */}
      {/* =================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          
          {/* Top Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total Coupon Savings</span>
                <Tag className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1">
                {formatINR(reportsData?.summary?.totalCouponDiscounts || 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Across all promotional codes</p>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Total UPI Discounts</span>
                <Percent className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-emerald-700 mt-1">
                {formatINR(reportsData?.summary?.totalUpiDiscounts || 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">0.5% prepaid incentive</p>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Honey Bunny Sales</span>
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-blue-900 mt-1">
                {formatINR(reportsData?.summary?.honeyBunnySalesVolume || 0)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                HONEY50: {formatINR(reportsData?.summary?.honeyBunnyCouponDiscounts || 0)} given
              </p>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                <span>Prepaid UPI Adoption</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-lg sm:text-xl font-black font-mono text-purple-900 mt-1">
                {reportsData?.summary?.upiAdoptionPercentage || 0}%
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {reportsData?.summary?.totalUpiOrdersCount || 0} UPI vs {reportsData?.summary?.totalCodOrdersCount || 0} COD
              </p>
            </div>
          </div>

          {/* Campaign-Wise Usage Performance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Campaign Performance & Usage</h3>
                <p className="text-xs text-slate-500">Breakdown of redemptions, discounts granted and sales volume</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleExportAnalyticsCsv}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintAnalytics}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center space-x-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Coupon Code</th>
                    <th className="p-3">Campaign Title</th>
                    <th className="p-3">Target Scope</th>
                    <th className="p-3">Discount Type</th>
                    <th className="p-3 text-right">Redemptions</th>
                    <th className="p-3 text-right">Discounts Given</th>
                    <th className="p-3 text-right">Sales Volume</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportsData?.couponStats?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No coupon performance records available.
                      </td>
                    </tr>
                  ) : (
                    reportsData?.couponStats?.map((stat: any) => (
                      <tr key={stat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-black text-slate-900">
                          {stat.code}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {stat.title}
                        </td>
                        <td className="p-3 text-slate-600">
                          {stat.applicableTo === 'brand' ? (
                            <span className="font-semibold text-blue-700">Brand: {stat.targetBrand}</span>
                          ) : (
                            <span>{stat.applicableTo}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {stat.discountType === 'percentage' ? `${stat.discountValue}%` : `₹${stat.discountValue} Flat`}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          {stat.redemptionsCount}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          {formatINR(stat.totalDiscountGiven || 0)}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900">
                          {formatINR(stat.totalSalesVolume || 0)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            stat.isActive 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {stat.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Redemptions Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Recent Customer Redemptions Log</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                    <th className="py-2 px-2">Order #</th>
                    <th className="py-2 px-2">Customer</th>
                    <th className="py-2 px-2">Coupon Code</th>
                    <th className="py-2 px-2 text-right">Order Gross</th>
                    <th className="py-2 px-2 text-right">Discount Saved</th>
                    <th className="py-2 px-2 text-right">Redeemed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportsData?.recentRedemptions?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 text-xs">
                        No customer redemptions recorded yet. Test an order using HONEY50!
                      </td>
                    </tr>
                  ) : (
                    reportsData?.recentRedemptions?.map((red: CouponRedemption) => (
                      <tr key={red.id} className="hover:bg-slate-50 text-[11px]">
                        <td className="py-2 px-2 font-mono font-bold text-blue-700">{red.orderNumber}</td>
                        <td className="py-2 px-2 font-medium text-slate-800">{red.customerName}</td>
                        <td className="py-2 px-2 font-mono font-bold text-amber-700">{red.couponCode}</td>
                        <td className="py-2 px-2 text-right font-mono text-slate-700">{formatINR(red.orderAmount)}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700">₹{red.discountAmount}</td>
                        <td className="py-2 px-2 text-right text-slate-400">{new Date(red.redeemedAt).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE OR EDIT COUPON                                        */}
      {/* =================================================================== */}
      {isModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-[#0B132B] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingCoupon.id ? 'Edit Coupon Settings' : 'Create New Promotional Coupon'}
                  </h3>
                  <p className="text-[11px] text-slate-300">Apna Store Smart Offers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCouponSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Row 1: Code and Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coupon Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HONEY50"
                    value={editingCoupon.code || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Applicable Scope
                  </label>
                  <select
                    value={editingCoupon.applicableTo || 'all'}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, applicableTo: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Entire Store (All Products)</option>
                    <option value="brand">Specific Brand</option>
                    <option value="category">Specific Category</option>
                  </select>
                </div>
              </div>

              {/* Conditional Brand / Category Selector */}
              {editingCoupon.applicableTo === 'brand' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Target Brand <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingCoupon.targetBrand || 'Honey Bunny'}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, targetBrand: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableBrands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {editingCoupon.applicableTo === 'category' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Target Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingCoupon.targetCategory || 'Baby Care'}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, targetCategory: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row 2: Title and Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coupon Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Honey Bunny Promotional Launch Offer"
                  value={editingCoupon.title || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Terms (Shown in checkout)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Get flat ₹50 OFF on Honey Bunny baby care products on orders above ₹1,000"
                  value={editingCoupon.description || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Row 3: Discount Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={editingCoupon.discountType || 'fixed'}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discountType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed ₹ (Flat Rupee)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Value ({editingCoupon.discountType === 'percentage' ? '%' : '₹'}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={editingCoupon.discountValue ?? ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1000"
                    value={editingCoupon.minOrderAmount ?? ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 4: Limits and Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {editingCoupon.discountType === 'percentage' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500"
                      value={editingCoupon.maxDiscountLimit ?? ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, maxDiscountLimit: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1000"
                    value={editingCoupon.totalUsageLimit ?? ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, totalUsageLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Per Customer Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={editingCoupon.perCustomerUsageLimit ?? ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, perCustomerUsageLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editingCoupon.startDate || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editingCoupon.expiryDate || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800">
                  Enable Coupon Campaign (Immediately Available)
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(editingCoupon.isActive)}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCoupon.id ? 'Save Changes' : 'Create Coupon'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
