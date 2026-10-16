import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Share2,
  Eye,
  FileText,
  Search,
  CheckCircle2,
  Filter,
  Layers,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  X,
  Package,
  Store,
  Printer,
  Sparkles,
  Info,
  Tag,
  IndianRupee,
  ShieldCheck,
  Send
} from 'lucide-react';
import { Product, Salesman, Retailer, ProductCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  CataloguePriceMode,
  generateCataloguePdf,
  downloadCataloguePdf,
  shareCatalogueFile,
  shareCatalogueViaWhatsApp,
  GeneratedCatalogue
} from '../lib/cataloguePdfGenerator';
import { ProductImage } from './ProductImage';

interface CatalogueViewProps {
  products: Product[];
  salesmen?: Salesman[];
  retailers?: Retailer[];
  onNavigateToOrders?: () => void;
  onOpenNewOrderForRetailer?: (retailer: Retailer) => void;
}

export const CatalogueView: React.FC<CatalogueViewProps> = ({
  products = [],
  salesmen = [],
  retailers = [],
  onNavigateToOrders,
  onOpenNewOrderForRetailer
}) => {
  const { currentRole, currentUser, isAdmin, isSalesman } = useAuth();

  // Mode preset: 'full' | 'category' | 'brand'
  const [cataloguePreset, setCataloguePreset] = useState<'full' | 'category' | 'brand'>('full');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // Price Mode: 'wholesale_and_mrp' | 'mrp_only' | 'none'
  const [priceMode, setPriceMode] = useState<CataloguePriceMode>('wholesale_and_mrp');

  // Search filter for product selector
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Product IDs (Default: all active products selected)
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => {
    return new Set(products.map(p => p.id));
  });

  // Re-sync if products list updates
  useEffect(() => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      products.forEach(p => {
        if (!next.has(p.id)) next.add(p.id);
      });
      return next;
    });
  }, [products]);

  // Customization Options (Admin editable, Salesman view-only)
  const [customTitle, setCustomTitle] = useState('DIGITAL PRODUCT CATALOGUE');
  const [customSubtitle, setCustomSubtitle] = useState('Utraula & Balrampur Beat Network · B2B Wholesale Edition');
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // WhatsApp Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [targetRetailerId, setTargetRetailerId] = useState<string>('');
  const [manualPhone, setManualPhone] = useState('');

  // PDF Generation & Preview State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressState, setProgressState] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: ''
  });
  const [generatedResult, setGeneratedResult] = useState<GeneratedCatalogue | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPageNumber, setPreviewPageNumber] = useState(1);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Available Categories & Brands
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [products]);

  // Eligible products based on current preset (Full vs Category vs Brand)
  const presetFilteredProducts = useMemo(() => {
    return products.filter(p => {
      if (cataloguePreset === 'category' && selectedCategory !== 'all') {
        if (p.category !== selectedCategory) return false;
      }
      if (cataloguePreset === 'brand' && selectedBrand !== 'all') {
        if (p.brand !== selectedBrand) return false;
      }
      return true;
    });
  }, [products, cataloguePreset, selectedCategory, selectedBrand]);

  // Selected products for generation
  const activeProductsForCatalogue = useMemo(() => {
    return presetFilteredProducts.filter(p => selectedProductIds.has(p.id));
  }, [presetFilteredProducts, selectedProductIds]);

  // Display products in the selection picker (filtered by search query)
  const displayedInPicker = useMemo(() => {
    if (!searchQuery.trim()) return presetFilteredProducts;
    const q = searchQuery.toLowerCase().trim();
    return presetFilteredProducts.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [presetFilteredProducts, searchQuery]);

  // Retailers available to salesman or admin for WhatsApp direct share
  const availableRetailers = useMemo(() => {
    if (isSalesman && currentUser?.salesmanId) {
      const mySalesman = salesmen.find(s => s.id === currentUser.salesmanId);
      if (mySalesman && Array.isArray(mySalesman.assignedBeats) && mySalesman.assignedBeats.length > 0) {
        return retailers.filter(r => mySalesman.assignedBeats.includes(r.beatName));
      }
    }
    return retailers;
  }, [retailers, salesmen, isSalesman, currentUser]);

  // Auto-clear notification messages
  useEffect(() => {
    if (actionSuccessMsg) {
      const timer = setTimeout(() => setActionSuccessMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccessMsg]);

  useEffect(() => {
    if (actionErrorMsg) {
      const timer = setTimeout(() => setActionErrorMsg(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [actionErrorMsg]);

  // Toggle single product selection
  const handleToggleProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all or deselect all
  const handleSelectAllInPreset = () => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      presetFilteredProducts.forEach(p => next.add(p.id));
      return next;
    });
  };

  const handleDeselectAllInPreset = () => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      presetFilteredProducts.forEach(p => next.delete(p.id));
      return next;
    });
  };

  // Generate Catalogue PDF (used for preview, download, or share)
  const handleCompileCatalogue = async (): Promise<GeneratedCatalogue | null> => {
    if (activeProductsForCatalogue.length === 0) {
      setActionErrorMsg('Kripya catalogue me shaamil karne ke liye kam se kam 1 product chunein.');
      return null;
    }

    try {
      setIsGenerating(true);
      setActionErrorMsg(null);

      let effectiveTitle = customTitle;
      if (cataloguePreset === 'category' && selectedCategory !== 'all') {
        effectiveTitle = `${selectedCategory.toUpperCase()} CATALOGUE`;
      } else if (cataloguePreset === 'brand' && selectedBrand !== 'all') {
        effectiveTitle = `${selectedBrand.toUpperCase()} PRODUCT CATALOGUE`;
      }

      const result = await generateCataloguePdf({
        title: effectiveTitle,
        subtitle: customSubtitle,
        priceMode,
        selectedCategory,
        selectedBrand,
        products: activeProductsForCatalogue,
        onProgress: (prog) => {
          setProgressState(prog);
        }
      });

      setGeneratedResult(result);
      return result;
    } catch (err: any) {
      console.error('[Catalogue Generation Error]:', err);
      setActionErrorMsg(err?.message || 'Failed to generate catalogue PDF. Please try again.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Instant Download
  const handleDownload = async () => {
    let result = generatedResult;
    if (!result) {
      result = await handleCompileCatalogue();
    }
    if (result) {
      downloadCataloguePdf(result.blob, result.fileName);
      setActionSuccessMsg(`PDF download shuru ho gaya: "${result.fileName}"`);
    }
  };

  // Handle Live Preview
  const handleOpenPreview = async () => {
    let result = generatedResult;
    if (!result) {
      result = await handleCompileCatalogue();
    }
    if (result) {
      setIsPreviewOpen(true);
      setPreviewPageNumber(1);
    }
  };

  // Handle Native File Share (Android / Mobile Web Share)
  const handleNativeShare = async () => {
    let result = generatedResult;
    if (!result) {
      result = await handleCompileCatalogue();
    }
    if (!result) return;

    const res = await shareCatalogueFile(
      result.blob,
      result.fileName,
      'Aryan Agency FMCG Product Catalogue',
      'Aryan Agency (Utraula) B2B Wholesale Digital Product Catalogue PDF.'
    );

    if (res.success) {
      setActionSuccessMsg('Catalogue PDF safaltapoorvak share kiya gaya!');
    } else {
      // Fallback to WhatsApp share modal if device doesn't support file sharing
      setIsShareModalOpen(true);
    }
  };

  // Handle WhatsApp Share Trigger
  const handleConfirmWhatsAppShare = () => {
    const targetRetailer = availableRetailers.find(r => r.id === targetRetailerId);
    const phone = manualPhone.trim() || targetRetailer?.phone || '';

    const topBrands: string[] = Array.from(new Set(activeProductsForCatalogue.map(p => p.brand)));

    shareCatalogueViaWhatsApp({
      phone,
      retailerName: targetRetailer?.storeName || targetRetailer?.ownerName,
      catalogueTitle: customTitle,
      productCount: activeProductsForCatalogue.length,
      topBrands,
      priceMode
    });

    setIsShareModalOpen(false);
    setActionSuccessMsg(`WhatsApp share launch kiya gaya${targetRetailer ? ` for ${targetRetailer.storeName}` : ''}!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER: BRANDING & ROLE BADGES                              */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0B132B] via-[#1E293B] to-[#0F172A] rounded-2xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-blue-600/30 border border-blue-400/40 rounded-xl text-blue-300">
                <BookOpen className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                    Digital Product Catalogue
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 font-mono">
                    FMCG B2B v1.4
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Aryan Agency Wholesale Distributor · Utraula & Balrampur Beat Network
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl pt-1">
              {isAdmin 
                ? 'Create professional printable A4 PDF catalogues with customizable prices, live interactive preview, and 1-click WhatsApp sharing for your retail network.'
                : 'Browse current wholesale catalogue, download high-resolution PDF and share directly with beat retailers on WhatsApp with pre-composed order greetings.'}
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Active Catalogue SKUs
              </span>
              <span className="text-lg font-black text-amber-300">
                {activeProductsForCatalogue.length} / {products.length}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Price Mode
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {priceMode === 'wholesale_and_mrp' ? 'Wholesale + MRP' : priceMode === 'mrp_only' ? 'MRP Only' : 'Showcase'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Generation Progress Bar */}
      {isGenerating && (
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-xs font-bold text-slate-900">
                {progressState.message || 'Compiling digital product catalogue...'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-700">
              {progressState.total > 0 ? `${Math.round((progressState.current / progressState.total) * 100)}%` : 'Processing...'}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressState.total > 0 ? (progressState.current / progressState.total) * 100 : 15}%` }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CATALOGUE CONFIGURATION BAR: PRESETS, PRICING & ACTION BUTTONS          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
        
        {/* Row 1: Catalogue Presets */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              1. Catalogue Scope / Range
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCataloguePreset('full')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  cataloguePreset === 'full'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Full Catalogue ({products.length} SKUs)</span>
              </button>

              <button
                type="button"
                onClick={() => setCataloguePreset('category')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  cataloguePreset === 'category'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Category-Wise</span>
              </button>

              <button
                type="button"
                onClick={() => setCataloguePreset('brand')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  cataloguePreset === 'brand'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Brand-Wise</span>
              </button>
            </div>
          </div>

          {/* Row 1 Right: Pricing Mode Selection */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
              2. Price Configuration
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPriceMode('wholesale_and_mrp')}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  priceMode === 'wholesale_and_mrp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="B2B Distributor Trade Rates + MRP + Margin %"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Wholesale & MRP</span>
              </button>

              <button
                type="button"
                onClick={() => setPriceMode('mrp_only')}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  priceMode === 'mrp_only'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Show Maximum Retail Price only"
              >
                <span>MRP Only</span>
              </button>

              <button
                type="button"
                onClick={() => setPriceMode('none')}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
                  priceMode === 'none'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Showcase Catalogue without prices"
              >
                <span>Without Prices</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Filters when Category or Brand is selected */}
        {cataloguePreset === 'category' && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar animate-in fade-in">
            <span className="text-xs font-bold text-slate-500 shrink-0">Select Category:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {cataloguePreset === 'brand' && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar animate-in fade-in">
            <span className="text-xs font-bold text-slate-500 shrink-0">Select Brand:</span>
            <button
              onClick={() => setSelectedBrand('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedBrand === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Brands
            </button>
            {brands.map(b => {
              const count = products.filter(p => p.brand === b).length;
              return (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedBrand === b
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {b} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Row 3: Action Buttons (Preview, Download, WhatsApp Share, Share PDF) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">
              Target Selection: <b className="text-slate-900">{activeProductsForCatalogue.length}</b> of {presetFilteredProducts.length} items
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(true)}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1 cursor-pointer"
                title="Edit catalogue title, subtitle & notes"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Customize Header</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Live Preview Button */}
            <button
              type="button"
              onClick={handleOpenPreview}
              disabled={isGenerating || activeProductsForCatalogue.length === 0}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Preview Catalogue</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating || activeProductsForCatalogue.length === 0}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              disabled={isGenerating || activeProductsForCatalogue.length === 0}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>

            {/* Share PDF Button (Native Android / Web Share) */}
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={isGenerating || activeProductsForCatalogue.length === 0}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="Share PDF file directly via Android Share Sheet / Web Share"
            >
              <Share2 className="w-4 h-4" />
              <span>Share PDF</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. PRODUCT SELECTION GRID: SELECT / DESELECT ACTIVE PRODUCTS               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Selection Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name, brand, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg w-64 sm:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSelectAllInPreset}
              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAllInPreset}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <span className="text-xs text-slate-500 pl-2">
              Showing <b>{displayedInPicker.length}</b> products
            </span>
          </div>
        </div>

        {/* Products Cards Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[640px] overflow-y-auto">
          {displayedInPicker.map((prod) => {
            const isSelected = selectedProductIds.has(prod.id);
            const margin = Math.max(0, prod.mrpPiece - prod.wholesalePricePiece);
            const marginPct = prod.mrpPiece > 0 ? (margin / prod.mrpPiece) * 100 : 0;

            return (
              <div
                key={prod.id}
                onClick={() => handleToggleProduct(prod.id)}
                className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all cursor-pointer select-none group ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Checkbox indicator */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Top Image + Badges */}
                <div className="flex items-start space-x-3 mb-2">
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 p-1 shrink-0 overflow-hidden">
                    <ProductImage
                      src={prod.imageUrl}
                      alt={prod.name}
                      brand={prod.brand}
                      category={prod.category}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="pr-6 min-w-0">
                    <span className="text-[10px] font-black uppercase text-blue-700 tracking-wide block truncate">
                      {prod.brand}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
                      {prod.packSize || (prod.piecesPerCase ? `Case of ${prod.piecesPerCase} pcs` : 'Standard pack')}
                    </span>
                  </div>
                </div>

                {/* Active Scheme Tag */}
                {prod.activeScheme && prod.activeScheme.title && (
                  <div className="mb-2 px-2 py-0.5 bg-amber-100 border border-amber-300 rounded text-[9.5px] font-bold text-amber-800 truncate">
                    🎁 {prod.activeScheme.title}
                  </div>
                )}

                {/* Pricing Block */}
                <div className="pt-2 border-t border-slate-200/80 mt-auto">
                  {priceMode === 'wholesale_and_mrp' ? (
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Trade Rate</span>
                        <span className="font-bold text-emerald-700">₹{prod.wholesalePricePiece.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">MRP</span>
                        <span className="font-semibold text-slate-700">₹{prod.mrpPiece.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-blue-600 font-bold block">{marginPct.toFixed(0)}% Margin</span>
                        <span className="text-[11px] font-bold text-slate-500">+₹{margin.toFixed(1)}</span>
                      </div>
                    </div>
                  ) : priceMode === 'mrp_only' ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Retail MRP:</span>
                      <span className="font-bold text-slate-900 text-sm">₹{prod.mrpPiece.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      Showcase Mode (Rates on Request)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE LIVE CATALOGUE PREVIEW MODAL                                */}
      {/* ========================================================================= */}
      {isPreviewOpen && generatedResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#0B132B] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    Live Catalogue PDF Preview
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {generatedResult.fileName} · {generatedResult.pageCount} Pages · {generatedResult.productCount} SKUs
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => downloadCataloguePdf(generatedResult.blob, generatedResult.fileName)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  title="Share PDF file"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setIsShareModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp Share</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded PDF Viewer / Object */}
            <div className="flex-1 bg-slate-900 relative">
              <iframe
                src={`${generatedResult.blobUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Catalogue PDF Preview"
              />
            </div>

            {/* Footer with Page Info */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Ready for high-quality printing on standard A4 paper.</span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="font-bold text-slate-800 hover:text-black"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WHATSAPP SHARE MODAL: DIRECT RETAILER SELECTION                         */}
      {/* ========================================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <Send className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Share Catalogue on WhatsApp</h3>
                  <p className="text-[11px] text-slate-500">Send personalized catalogue link & wholesale rates</p>
                </div>
              </div>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Retailer Selector */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Select Mapped Beat Retailer:
                </label>
                <select
                  value={targetRetailerId}
                  onChange={(e) => {
                    setTargetRetailerId(e.target.value);
                    const selected = availableRetailers.find(r => r.id === e.target.value);
                    if (selected && selected.phone) {
                      setManualPhone(selected.phone);
                    }
                  }}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Store / Retailer --</option>
                  {availableRetailers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.storeName} ({r.ownerName}) • {r.beatName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Or Enter 10-Digit Mobile Number:
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Message Preview Box */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                  WhatsApp Message Preview:
                </span>
                <p className="text-slate-700 text-[11px] italic">
                  &ldquo;Namaste! Aryan Agency (Utraula) ki taraf se Digital FMCG Wholesale Catalogue. Total {activeProductsForCatalogue.length} SKUs across leading brands with wholesale rates. Kripya apna order bhejein.&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWhatsAppShare}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Open WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ADMIN CUSTOMIZATION MODAL (HEADER & SUBTITLE SETTINGS)                 */}
      {/* ========================================================================= */}
      {isCustomizeModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Customize Catalogue Header</h3>
              </div>
              <button onClick={() => setIsCustomizeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Catalogue Main Title:</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. DIGITAL PRODUCT CATALOGUE"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subtitle / Beat Scope:</label>
                <input
                  type="text"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Utraula & Balrampur Beat Network · Wholesale Edition"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                <p className="font-semibold text-slate-800">Distributor Contact Info:</p>
                <p className="mt-0.5">Station Road, Utraula, Balrampur (UP) - 271304</p>
                <p>Hotline: +91 98391 23456 | GSTIN: 09BOGPG2620P1ZQ</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
