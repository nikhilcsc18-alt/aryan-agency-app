import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Tag, 
  Boxes, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Eye,
  ShoppingCart,
  LayoutGrid,
  List,
  Flame,
  ArrowUpDown,
  Sparkles,
  Percent,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  ShoppingBag,
  Zap,
  ScanLine,
  QrCode,
  Copy,
  Barcode,
  Loader2,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  ImagePlus
} from 'lucide-react';
import { Product, ProductCategory, TradeScheme, CartItem, ProductPackingOption } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { PromotionalBannerCarousel } from './PromotionalBannerCarousel';
import { B2BProductCard } from './B2BProductCard';
import { BrandCategoryBar } from './BrandCategoryBar';
import { BarcodeScannerModal, PRODUCT_BARCODE_MAP } from './BarcodeScannerModal';
import { ProductImage } from './ProductImage';
import { BrandLogo } from './BrandLogos';
import { FMCG_PRODUCT_PRESETS, FMCGPresetProduct, compressImageFile } from '../lib/fmcgPresets';
import { BulkProductAddModal } from './BulkProductAddModal';
import { ApnaClubPackSelectorModal } from './ApnaClubPackSelectorModal';
import { createPackingOption, calculateMarginPercentage, getProductPackingOptions, createPresetPacking } from '../lib/packingUtils';

interface ProductsViewProps {
  products: Product[];
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onSaveBatchProducts?: (products: Partial<Product>[]) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onInwardStock?: (productId: string) => void;
  onOpenNewOrderWithProduct?: (productId: string) => void;
  onQuickOrder?: (productId: string) => void;
  onAddToCart?: (product: Product, casesCount?: number, packing?: ProductPackingOption) => void;
  cartItems?: CartItem[];
  onUpdateCartItem?: (productId: string, cases: number, loosePcs: number, packingId?: string) => void;
  onRemoveFromCart?: (productId: string, packingId?: string) => void;
  onOpenCart?: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'Biscuits & Bakery',
  'Beverages',
  'Spices & Staples',
  'Personal Care',
  'Dairy & Refrigerated',
  'Confectionery & Chocolates',
  'Snacks & Namkeen',
  'Household & Hygiene'
];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onSaveProduct,
  onSaveBatchProducts,
  onDeleteProduct,
  onInwardStock,
  onOpenNewOrderWithProduct,
  onQuickOrder,
  onAddToCart,
  cartItems = [],
  onUpdateCartItem,
  onRemoveFromCart,
  onOpenCart
}) => {
  const { isAdmin, isSalesman, isRetailer } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [quickSort, setQuickSort] = useState<'default' | 'margin_desc' | 'price_asc' | 'price_desc' | 'name_asc'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [packSelectorProduct, setPackSelectorProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewBatchesProduct, setViewBatchesProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const handleImageUrlChange = (url: string) => {
    let clean = url.trim();
    // Auto-extract real image url if user pastes a Google Images preview link
    if (clean.includes('google.com/imgres') && clean.includes('imgurl=')) {
      try {
        const parsed = new URL(clean);
        const actual = parsed.searchParams.get('imgurl');
        if (actual) {
          clean = decodeURIComponent(actual);
        }
      } catch (e) {
        // ignore
      }
    }
    setImagePreviewError(false);
    setEditingProduct(prev => prev ? { ...prev, imageUrl: clean } : null);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const dataUrl = await compressImageFile(file, 800, 0.85);
      setImagePreviewError(false);
      setEditingProduct(prev => prev ? { ...prev, imageUrl: dataUrl } : null);
    } catch (err) {
      console.error('Failed to compress image file', err);
      alert('Could not process the selected image file. Please try another image.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleApplyPreset = (preset: FMCGPresetProduct) => {
    setEditingProduct(prev => {
      if (!prev) return null;
      return {
        ...prev,
        imageUrl: preset.imageUrl,
        brand: (!prev.brand || prev.brand === 'General') ? preset.brand : prev.brand,
        category: (!prev.category || prev.category === 'Biscuits & Bakery') ? (preset.category as ProductCategory) : prev.category
      };
    });
    setImagePreviewError(false);
    setShowPresetsModal(false);
  };

  const handleBookProduct = (productId: string) => {
    if (onOpenNewOrderWithProduct) {
      onOpenNewOrderWithProduct(productId);
    } else if (onQuickOrder) {
      onQuickOrder(productId);
    }
  };

  const handleBuyNowProduct = (product: Product, cases: number = 1, packing?: ProductPackingOption) => {
    if (onAddToCart) {
      onAddToCart(product, cases, packing);
    }
    if (onOpenCart) {
      onOpenCart();
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProductId || !onDeleteProduct) return;
    await onDeleteProduct(deletingProductId);
    setDeletingProductId(null);
  };

  // Extract unique brands
  const brands = Array.from(new Set(products.map(p => p.brand))).sort();

  // Filter products
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const skuCode = (p.sku || (p as any).product_sku || (p as any).productSku || '').toLowerCase();
    const barcodeCode = (p.barcode || (p as any).barcode_number || (p.sku && PRODUCT_BARCODE_MAP[p.sku]) || '').toLowerCase();
    const matchesSearch = 
      !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      skuCode.includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      barcodeCode.includes(q);
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
    
    let matchesOffer = true;
    if (onlyOffers) {
      const hasScheme = p.activeScheme && p.activeScheme.isActive;
      const margin = p.mrpPiece > 0 ? ((p.mrpPiece - p.wholesalePricePiece) / p.mrpPiece) * 100 : 0;
      matchesOffer = Boolean(hasScheme || margin >= 18);
    }

    return matchesSearch && matchesCat && matchesBrand && matchesOffer;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (quickSort === 'margin_desc') {
      const marginA = a.mrpPiece > 0 ? (a.mrpPiece - a.wholesalePricePiece) / a.mrpPiece : 0;
      const marginB = b.mrpPiece > 0 ? (b.mrpPiece - b.wholesalePricePiece) / b.mrpPiece : 0;
      return marginB - marginA;
    }
    if (quickSort === 'price_asc') {
      return a.wholesalePricePiece - b.wholesalePricePiece;
    }
    if (quickSort === 'price_desc') {
      return b.wholesalePricePiece - a.wholesalePricePiece;
    }
    if (quickSort === 'name_asc') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  // Cart summary metrics
  const totalCartCases = cartItems.reduce((sum, item) => sum + item.cases, 0);
  const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.cases * item.product.casePrice), 0);

  const handleOpenAdd = () => {
    setEditingProduct({
      sku: '',
      name: '',
      brand: '',
      category: 'Biscuits & Bakery',
      hsnCode: '19053100',
      gstRate: 18,
      piecesPerCase: 24,
      mrpPiece: 20,
      wholesalePricePiece: 16.5,
      casePrice: 396,
      currentStockCases: 20,
      currentStockLoosePcs: 0,
      reorderLevelCases: 10,
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500',
      packingOptions: [
        createPresetPacking(1, 16.5, 20, 'Pack of 1', 0),
        createPresetPacking(2, 16.5, 20, 'Pack of 2', 1),
        createPresetPacking(10, 16.5, 20, 'Pack of 10', 3)
      ],
      batches: [
        {
          batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
          mfgDate: new Date().toISOString().split('T')[0],
          expiryDate: '2027-06-30',
          stockCases: 20,
          stockLoosePcs: 0,
          warehouseBin: 'BAY-A'
        }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    const packs = (product.packingOptions && product.packingOptions.length > 0)
      ? JSON.parse(JSON.stringify(product.packingOptions))
      : getProductPackingOptions(product);

    setEditingProduct({
      ...product,
      packingOptions: packs,
      sku: product.sku || (product as any).product_sku || (product as any).productSku || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const cleanSku = (editingProduct.sku || (editingProduct as any).product_sku || '').trim();
      const currentPacks = (editingProduct.packingOptions && editingProduct.packingOptions.length > 0)
        ? editingProduct.packingOptions
        : getProductPackingOptions(editingProduct as Product);

      const finalProduct = {
        ...editingProduct,
        packingOptions: currentPacks,
        sku: cleanSku,
        product_sku: cleanSku
      };
      await onSaveProduct(finalProduct);
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Failed to save product in modal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      
      {/* 1. TOP PROMOTIONAL POSTER/BANNER CAROUSEL */}
      <section aria-label="Promotional Banners">
        <PromotionalBannerCarousel 
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          isAdmin={isAdmin}
        />
      </section>

      {/* 2. HORIZONTAL SCROLLABLE CIRCULAR/SQUARE BRAND ICONS SHOWCASE */}
      <section aria-label="Brand Catalog Filtering">
        <BrandCategoryBar 
          products={products}
          selectedBrand={selectedBrand}
          onSelectBrand={(brand) => {
            setSelectedBrand(brand);
            // If selecting a specific brand, reset search query so user sees all brand SKUs
            if (brand !== 'all' && searchQuery) {
              setSearchQuery('');
            }
          }}
        />
      </section>

      {/* 3. HEADER & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              FMCG B2B Wholesale Catalog
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#2563eb]">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Depot wholesale rates, active brand schemes, carton packing & live depot inventory
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Desktop View Mode Toggle */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>B2B Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-slate-600" />
              <span>Inventory Table</span>
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkAddOpen(true)}
                className="px-3.5 py-2 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 active:scale-95"
                title="Add multiple products at once with Aryan Agency packings"
              >
                <Boxes className="w-4 h-4 stroke-[2.5]" />
                <span>+ Bulk Add Products (एक साथ जोड़ें)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Add Single SKU</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. ARYAN AGENCY QUICK CATEGORY CHIPS */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-xs">
          <span className="font-bold text-slate-800 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Browse Categories</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedBrand('all');
              setSearchQuery('');
              setOnlyOffers(false);
            }}
            className="text-[11px] text-[#2563eb] hover:underline font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>

        {/* Scrollable Category Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all font-bold cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories ({products.length})
          </button>

          {CATEGORIES.map(cat => {
            const count = products.filter(p => p.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all font-semibold cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-[#1A365D] text-white shadow-sm ring-2 ring-blue-400/40'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. SEARCH, BRAND FILTER & QUICK SORTS */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Prominent Search Input with Integrated Barcode Trigger */}
          <div className="sm:col-span-6 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search biscuit, namkeen, brand, SKU or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white transition-all placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dedicated Barcode Scanner Button */}
            <button
              type="button"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-slate-900 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-700"
              title="Scan Product Barcode with Camera"
            >
              <ScanLine className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>
          </div>

          {/* Brand Filter Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white text-slate-700 font-medium"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:col-span-2">
            <select
              value={quickSort}
              onChange={(e) => setQuickSort(e.target.value as any)}
              className="w-full px-2.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] focus:bg-white text-slate-700 font-medium"
            >
              <option value="default">Sort: Recommended</option>
              <option value="margin_desc">🔥 Highest Margin %</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>

          {/* Offer Filter Toggle */}
          <div className="sm:col-span-2 flex items-center">
            <button
              type="button"
              onClick={() => setOnlyOffers(prev => !prev)}
              className={`w-full py-2.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all border cursor-pointer ${
                onlyOffers
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Offers Only</span>
            </button>
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-900 font-bold">{sortedProducts.length}</strong> of {products.length} SKUs
          </span>
          {onlyOffers && (
            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Filtered: Active Schemes & Best Wholesale Margins
            </span>
          )}
        </div>
      </div>

      {/* 5. PRODUCT DISPLAY: MODERN B2B CARDS (DEFAULT & MOBILE) VS TABLE */}
      {viewMode === 'grid' ? (
        <div>
          {sortedProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No products match your search criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting "All Categories", clearing your brand filter, or searching for another FMCG brand like Parle, Britannia, or Sunfeast.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedBrand('all');
                  setOnlyOffers(false);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3.5 lg:gap-5">
              {sortedProducts.map((product) => {
                const inCartItem = cartItems.find(i => i.product.id === product.id);
                const inCartCases = inCartItem?.cases || 0;

                return (
                  <B2BProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={(p, cases, packing) => {
                      if (onAddToCart) onAddToCart(p, cases, packing);
                    }}
                    onBookNow={!isRetailer && (isSalesman || isAdmin) ? handleBookProduct : undefined}
                    onBuyNow={isRetailer ? (p, cases, packing) => handleBuyNowProduct(p, cases, packing) : undefined}
                    isRetailer={isRetailer}
                    isSalesman={isSalesman}
                    onViewBatches={(p) => setViewBatchesProduct(p)}
                    onEditProduct={handleOpenEdit}
                    onDeleteProduct={(id) => setDeletingProductId(id)}
                    isAdmin={isAdmin}
                    inCartCount={inCartCases}
                    onUpdateCartItem={onUpdateCartItem}
                    onOpenPackSelector={(p) => setPackSelectorProduct(p)}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* DESKTOP TABLE VIEW (Screens >= 768px when user toggles table mode) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product / Brand</th>
                  <th className="px-4 py-3">SKU & HSN</th>
                  <th className="px-4 py-3">Pack & GST</th>
                  <th className="px-4 py-3 text-right">Piece MRP</th>
                  <th className="px-4 py-3 text-right">Wholesale Price</th>
                  <th className="px-4 py-3 text-right">Case Price</th>
                  <th className="px-4 py-3 text-center">Warehouse Stock</th>
                  <th className="px-4 py-3">Active Scheme</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProducts.map((product) => {
                  const isLowStock = product.currentStockCases <= product.reorderLevelCases;
                  const marginPct = Math.round(((product.mrpPiece - product.wholesalePricePiece) / product.mrpPiece) * 100);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                            <ProductImage
                              src={product.imageUrl}
                              alt={product.name}
                              brand={product.brand}
                              category={product.category}
                              sku={product.sku || (product as any).product_sku}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{product.name}</div>
                            <div className="text-[11px] text-[#2563eb] font-semibold flex items-center space-x-1">
                              <span>{product.brand}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 font-normal">{product.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-slate-900 font-bold text-xs shadow-2xs">
                          <span className="text-slate-500 font-normal text-[10px]">SKU:</span>
                          <span className="text-slate-900">{product.sku || (product as any).product_sku || 'N/A'}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">HSN: {product.hsnCode || 'N/A'}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{product.piecesPerCase} pcs / cs</div>
                        <div className="text-[11px] text-slate-500 font-mono">GST {product.gstRate}%</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        ₹{product.mrpPiece.toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-slate-900">₹{product.wholesalePricePiece.toFixed(2)}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">+{marginPct}% Margin</div>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(product.casePrice)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono font-bold text-xs ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                            {product.currentStockCases} cs
                          </span>
                          {product.currentStockLoosePcs > 0 && (
                            <span className="text-[10px] text-slate-500 font-mono">+{product.currentStockLoosePcs} pcs</span>
                          )}
                          {isLowStock && (
                            <span className="mt-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {product.activeScheme && product.activeScheme.isActive ? (
                          <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
                            <Tag className="w-3 h-3 shrink-0 text-amber-600" />
                            <span className="max-w-[140px] truncate" title={product.activeScheme.description}>
                              {product.activeScheme.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard Price</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setViewBatchesProduct(product)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Batches & Expiry Dates"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(product)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {onDeleteProduct && (
                              <button
                                type="button"
                                onClick={() => setDeletingProductId(product.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {onAddToCart && (
                          <button
                            type="button"
                            onClick={() => onAddToCart(product, 1)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                            title="Add 1 Case to Quick Cart"
                          >
                            <ShoppingCart className="w-3 h-3 text-[#2563eb]" />
                            <span>+ Cart</span>
                          </button>
                        )}

                        {isRetailer ? (
                          <button
                            type="button"
                            onClick={() => handleBuyNowProduct(product, 1)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer inline-flex items-center space-x-1 shadow-2xs"
                            title="Instant Buy Now & Order Placement"
                          >
                            <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                            <span>Buy Now</span>
                          </button>
                        ) : (isSalesman || isAdmin) ? (
                          <button
                            type="button"
                            onClick={() => handleBookProduct(product.id)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors cursor-pointer"
                            title="Book Order for Retailer"
                          >
                            Book
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MOBILE FLOATING CART BAR (WHEN CART HAS ITEMS) */}
      {totalCartCases > 0 && onOpenCart && (
        <aside 
          aria-label="Active wholesale order summary"
          className="md:hidden fixed bottom-18 inset-x-3 z-40 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="bg-slate-950 text-white p-3 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black">
                  {totalCartCases} Case{totalCartCases > 1 ? 's' : ''} in Cart
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Est. Total: <strong>{formatINR(totalCartAmount)}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCart}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center space-x-1 cursor-pointer shadow-md active:scale-95"
            >
              <span>View Cart</span>
              <span>→</span>
            </button>
          </div>
        </aside>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[4px] shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingProduct.id ? 'Edit FMCG Product SKU' : 'Add New FMCG SKU'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                    placeholder="e.g. Parle-G Glucose Biscuit (80g)"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                    placeholder="e.g. Parle, Britannia, Amul, ITC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                    placeholder="PARLE-G-80G"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Biscuits & Bakery'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HSN Code</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.hsnCode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                    placeholder="19053100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-[4px] border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pcs per Case</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.piecesPerCase || 24}
                    onChange={(e) => {
                      const pcs = Number(e.target.value);
                      const wp = editingProduct.wholesalePricePiece || 0;
                      setEditingProduct({ 
                        ...editingProduct, 
                        piecesPerCase: pcs,
                        casePrice: pcs * wp
                      });
                    }}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Piece MRP (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingProduct.mrpPiece || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, mrpPiece: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Wholesale / Pc (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={editingProduct.wholesalePricePiece || 0}
                    onChange={(e) => {
                      const wp = Number(e.target.value);
                      const pcs = editingProduct.piecesPerCase || 24;
                      setEditingProduct({ 
                        ...editingProduct, 
                        wholesalePricePiece: wp,
                        casePrice: pcs * wp
                      });
                    }}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Tax Slab</label>
                  <select
                    value={editingProduct.gstRate || 18}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  >
                    <option value={0}>0% (Exempted)</option>
                    <option value={5}>5% (Staples/Oils)</option>
                    <option value={12}>12% (Dairy/Snacks)</option>
                    <option value={18}>18% (Confectionery/FMCG)</option>
                    <option value={28}>28% (Aerated drinks)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Stock (Cases)</label>
                  <input
                    type="number"
                    value={editingProduct.currentStockCases || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, currentStockCases: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reorder Level (Cases)</label>
                  <input
                    type="number"
                    value={editingProduct.reorderLevelCases || 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reorderLevelCases: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Calculated Case Price</label>
                  <div className="px-3 py-2 font-mono font-bold text-[#1A365D] bg-slate-100 border border-slate-200 rounded-[4px]">
                    {formatINR((editingProduct.wholesalePricePiece || 0) * (editingProduct.piecesPerCase || 24))}
                  </div>
                </div>
              </div>

              {/* Aryan Agency Tiered Packing Options (Pack of 1, Pack of 2, Pack of 4, Pack of 10, etc.) */}
              <div className="border border-amber-300 bg-amber-50/60 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                  <div>
                    <label className="block text-amber-950 font-black text-sm flex items-center space-x-1.5">
                      <Package className="w-4 h-4 text-amber-700" />
                      <span>Aryan Agency Packing Options &amp; Retailer Margins</span>
                    </label>
                    <span className="text-[11px] text-amber-900/80 mt-0.5 block">
                      Edit or add Pack of 1, Pack of 2, Pack of 3, Pack of 10, etc. Admin can change quantity, price, and margins.
                    </span>
                  </div>

                  {/* Preset Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const baseWp = editingProduct.wholesalePricePiece || 16;
                        const baseMrp = editingProduct.mrpPiece || 20;
                        const defaultPacks = [
                          createPresetPacking(1, baseWp, baseMrp, 'Pack of 1', 0),
                          createPresetPacking(2, baseWp, baseMrp, 'Pack of 2', 1),
                          createPresetPacking(4, baseWp, baseMrp, 'Pack of 4', 2),
                          createPresetPacking(10, baseWp, baseMrp, 'Pack of 10', 3),
                          createPresetPacking(40, baseWp, baseMrp, 'Pack of 40', 6)
                        ];
                        setEditingProduct({
                          ...editingProduct,
                          packingOptions: defaultPacks
                        });
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs cursor-pointer flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Reset Standard Packs (1, 2, 4, 10, 40)</span>
                    </button>
                  </div>
                </div>

                {/* Quick Add Buttons: Pack of 1, Pack of 2, Pack of 3, Pack of 4, Pack of 10, Pack of 40 */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-bold text-amber-950 mr-1">Quick Add:</span>
                  {[
                    { name: 'Pack of 1', pieces: 1, discount: 0 },
                    { name: 'Pack of 2', pieces: 2, discount: 1 },
                    { name: 'Pack of 3', pieces: 3, discount: 1 },
                    { name: 'Pack of 4', pieces: 4, discount: 2 },
                    { name: 'Pack of 10', pieces: 10, discount: 3 },
                    { name: 'Pack of 40', pieces: 40, discount: 6 }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        const baseWp = editingProduct.wholesalePricePiece || 16;
                        const baseMrp = editingProduct.mrpPiece || 20;
                        const newPack = createPresetPacking(
                          preset.pieces,
                          baseWp,
                          baseMrp,
                          preset.name,
                          preset.discount
                        );
                        const existing = editingProduct.packingOptions || [];
                        setEditingProduct({
                          ...editingProduct,
                          packingOptions: [...existing, newPack]
                        });
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3 text-amber-600 stroke-[3]" />
                      <span>{preset.name}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const baseWp = editingProduct.wholesalePricePiece || 16;
                      const baseMrp = editingProduct.mrpPiece || 20;
                      const newPack = createPresetPacking(6, baseWp, baseMrp, 'Pack of 6', 2);
                      const existing = editingProduct.packingOptions || [];
                      setEditingProduct({
                        ...editingProduct,
                        packingOptions: [...existing, newPack]
                      });
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3 text-amber-600 stroke-[3]" />
                    <span>+ Custom Pack</span>
                  </button>
                </div>

                {/* Interactive Editable Packing Options List */}
                <div className="space-y-3 pt-1">
                  {((editingProduct.packingOptions && editingProduct.packingOptions.length > 0)
                    ? editingProduct.packingOptions 
                    : getProductPackingOptions(editingProduct as Product)
                  ).map((pack, idx) => {
                    const pcs = pack.pieces || 1;
                    const selling = pack.sellingPrice || 0;
                    const mrp = pack.mrp || 0;
                    const unitPrice = Math.round((selling / pcs) * 100) / 100;
                    const unitMrp = Math.round((mrp / pcs) * 100) / 100;
                    const margin = calculateMarginPercentage(mrp, selling);
                    const savings = Math.max(0, mrp - selling);

                    const updatePack = (field: keyof ProductPackingOption, val: any) => {
                      const currentPacks = [
                        ...((editingProduct.packingOptions && editingProduct.packingOptions.length > 0)
                          ? editingProduct.packingOptions 
                          : getProductPackingOptions(editingProduct as Product))
                      ];
                      const target = { ...currentPacks[idx], [field]: val };
                      
                      // recalculate unit metrics & margin
                      const updatedPcs = Math.max(1, target.pieces || 1);
                      let updatedSell = Math.max(0, target.sellingPrice || 0);
                      let updatedMrp = Math.max(0, target.mrp || 0);

                      // If pieces was changed, update selling price and mrp proportionally if not manually changed
                      if (field === 'pieces') {
                        const baseWp = editingProduct.wholesalePricePiece || 16;
                        const baseMrp = editingProduct.mrpPiece || 20;
                        const discount = target.discountPercentage || 0;
                        const unitRate = baseWp * (1 - discount / 100);
                        updatedSell = Math.round(unitRate * updatedPcs * 100) / 100;
                        updatedMrp = Math.round(baseMrp * updatedPcs * 100) / 100;
                        target.sellingPrice = updatedSell;
                        target.mrp = updatedMrp;
                        if (!target.name || target.name.startsWith('Pack of')) {
                          target.name = `Pack of ${updatedPcs}`;
                        }
                      }

                      target.unitPrice = Math.round((updatedSell / updatedPcs) * 100) / 100;
                      target.unitMrp = Math.round((updatedMrp / updatedPcs) * 100) / 100;
                      target.marginPercentage = calculateMarginPercentage(updatedMrp, updatedSell);

                      currentPacks[idx] = target;
                      setEditingProduct({
                        ...editingProduct,
                        packingOptions: currentPacks
                      });
                    };

                    return (
                      <div 
                        key={pack.id || idx} 
                        className="bg-white p-3 sm:p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-2.5"
                      >
                        {/* Header Row of pack item */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] flex items-center justify-center font-mono">
                              #{idx + 1}
                            </span>
                            <span className="font-black text-slate-900 text-xs">
                              {pack.name} ({pcs} pcs)
                            </span>
                            <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                              +{margin}% MARGIN
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {savings > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                Retailer Saves: ₹{savings.toFixed(0)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const currentPacks = (editingProduct.packingOptions && editingProduct.packingOptions.length > 0)
                                  ? editingProduct.packingOptions 
                                  : getProductPackingOptions(editingProduct as Product);
                                if (currentPacks.length <= 1) {
                                  alert('At least 1 packing option is required.');
                                  return;
                                }
                                setEditingProduct({
                                  ...editingProduct,
                                  packingOptions: currentPacks.filter((_, i) => i !== idx)
                                });
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete this packing option"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Editable Form Inputs (4 columns) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          {/* 1. Pack Label */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Pack Label
                            </label>
                            <input
                              type="text"
                              value={pack.name}
                              onChange={(e) => updatePack('name', e.target.value)}
                              placeholder="e.g. Pack of 3"
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 text-xs focus:bg-white focus:border-amber-500 outline-hidden"
                            />
                          </div>

                          {/* 2. Pieces count */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Pieces (Pcs)
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={pack.pieces}
                              onChange={(e) => updatePack('pieces', parseInt(e.target.value) || 1)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs focus:bg-white focus:border-amber-500 outline-hidden"
                            />
                          </div>

                          {/* 3. Selling Price (₹) */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Selling Price (₹)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={pack.sellingPrice}
                              onChange={(e) => updatePack('sellingPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs focus:bg-white focus:border-amber-500 outline-hidden"
                            />
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                              Rate: ₹{unitPrice.toFixed(2)}/pc
                            </span>
                          </div>

                          {/* 4. Pack MRP (₹) */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Pack MRP (₹)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={pack.mrp}
                              onChange={(e) => updatePack('mrp', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs focus:bg-white focus:border-amber-500 outline-hidden"
                            />
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              MRP: ₹{unitMrp.toFixed(2)}/pc
                            </span>
                          </div>
                        </div>

                        {/* Summary bar for this pack */}
                        <div className="bg-slate-50 rounded-lg p-2 flex items-center justify-between text-[11px] text-slate-600 font-mono">
                          <span>
                            Retailer Price: <strong className="text-slate-900 font-bold">₹{unitPrice.toFixed(2)}/pc</strong> (Total ₹{selling.toFixed(2)})
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Margin: +{margin}% (Profit: ₹{savings.toFixed(2)})
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Product Image & Packshot Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div>
                    <label className="block text-slate-800 font-bold text-xs flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-[#2563eb]" />
                      <span>Product Packshot / Image</span>
                    </label>
                    <span className="text-[10.5px] text-slate-500">
                      Paste direct URL, upload local photo, or pick from popular FMCG presets
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {/* Upload from Device button */}
                    <label className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Popular FMCG Presets button */}
                    <button
                      type="button"
                      onClick={() => setShowPresetsModal(!showPresetsModal)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#2563eb] text-xs font-bold cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>FMCG Presets</span>
                    </button>

                    {editingProduct.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleImageUrlChange('')}
                        className="text-[11px] text-slate-400 hover:text-rose-600 px-1 font-medium"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Live Preview and URL Input */}
                <div className="flex items-start space-x-3 pt-1">
                  {/* Left: Interactive Live Preview Card */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {editingProduct.imageUrl ? (
                      <>
                        <img
                          src={editingProduct.imageUrl}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          onLoad={() => setImagePreviewError(false)}
                          onError={() => setImagePreviewError(true)}
                          className="w-full h-full object-cover"
                        />
                        {imagePreviewError ? (
                          <div className="absolute inset-0 bg-rose-950/80 text-white flex flex-col items-center justify-center p-1 text-center">
                            <AlertCircle className="w-4 h-4 text-rose-400 mb-0.5" />
                            <span className="text-[8px] font-bold leading-tight">Blocked or Invalid Link</span>
                          </div>
                        ) : (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                        <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                        <span className="text-[9px] font-medium leading-tight">No Image Set</span>
                      </div>
                    )}
                  </div>

                  {/* Right: URL Input & Helper */}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={editingProduct.imageUrl || ''}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      className={`w-full px-3 py-2 text-xs border rounded-lg font-mono focus:ring-1 transition-colors ${
                        imagePreviewError 
                          ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-400' 
                          : 'border-slate-300 bg-white focus:ring-blue-500'
                      }`}
                      placeholder="Paste image link (e.g. https://.../photo.jpg)"
                    />

                    {imagePreviewError ? (
                      <p className="text-[11px] text-rose-600 font-medium">
                        ⚠️ Yeh image URL load nahi ho pa raha (website hotlink protection ya invalid URL). Aap upar &apos;Upload Image&apos; par click karke apne phone/computer se photo upload kar sakte hain, ya &apos;FMCG Presets&apos; se verified image select karein.
                      </p>
                    ) : (
                      <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 inline shrink-0" />
                        <span>Google Images links are automatically cleaned &amp; verified.</span>
                      </div>
                    )}

                    {/* Quick 1-tap presets chips */}
                    <div className="pt-0.5 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">Quick Fill:</span>
                      {FMCG_PRODUCT_PRESETS.slice(0, 6).map(preset => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white border border-slate-200 hover:border-blue-400 hover:text-[#2563eb] text-slate-700 shrink-0 cursor-pointer shadow-2xs"
                        >
                          {preset.brand}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expandable FMCG Presets Drawer */}
                {showPresetsModal && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 bg-white rounded-xl p-3 border shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Select Verified FMCG Product Packshot:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPresetsModal(false)}
                        className="text-xs text-slate-400 hover:text-slate-700"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                      {FMCG_PRODUCT_PRESETS.map((preset) => (
                        <div
                          key={preset.sku}
                          onClick={() => handleApplyPreset(preset)}
                          className="flex items-center space-x-2 p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all group"
                        >
                          <img
                            src={preset.imageUrl}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-md object-cover border border-slate-100 shrink-0"
                          />
                          <div className="min-w-0 text-left">
                            <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-blue-600">
                              {preset.name}
                            </div>
                            <div className="text-[9px] text-slate-400">
                              {preset.brand} • ₹{preset.mrpPiece}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Trade Scheme Settings */}
              <div className="border border-orange-200 bg-orange-50/50 p-3 rounded-[4px] space-y-2">
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center text-[#DD6B20]">
                    <Tag className="w-3.5 h-3.5 mr-1" /> Active Trade Promotional Scheme
                  </span>
                  <label className="flex items-center space-x-1.5 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.activeScheme?.isActive || false}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setEditingProduct({
                          ...editingProduct,
                          activeScheme: {
                            id: editingProduct.activeScheme?.id || `sch_${Date.now()}`,
                            title: editingProduct.activeScheme?.title || 'Volume Discount',
                            description: editingProduct.activeScheme?.description || 'Discount on bulk order',
                            minQtyCases: editingProduct.activeScheme?.minQtyCases || 5,
                            freeQtyPcs: editingProduct.activeScheme?.freeQtyPcs || 0,
                            discountPercentage: editingProduct.activeScheme?.discountPercentage || 0,
                            isActive: isChecked
                          }
                        });
                      }}
                    />
                    <span>Enable Scheme</span>
                  </label>
                </div>

                {editingProduct.activeScheme?.isActive && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1">Scheme Title</label>
                      <input
                        type="text"
                        value={editingProduct.activeScheme.title}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          activeScheme: { ...editingProduct.activeScheme!, title: e.target.value }
                        })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-[4px]"
                        placeholder="e.g. Monsoon Dhamaka"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1">Min Cases</label>
                      <input
                        type="number"
                        value={editingProduct.activeScheme.minQtyCases}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          activeScheme: { ...editingProduct.activeScheme!, minQtyCases: Number(e.target.value) }
                        })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-[4px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1">Free Pcs Awarded</label>
                      <input
                        type="number"
                        value={editingProduct.activeScheme.freeQtyPcs || 0}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          activeScheme: { ...editingProduct.activeScheme!, freeQtyPcs: Number(e.target.value) }
                        })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-[4px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-[4px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#DD6B20] hover:bg-[#C05621] text-white font-semibold rounded-[4px] shadow-xs flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      <span>Saving SKU...</span>
                    </>
                  ) : (
                    <span>Save FMCG SKU</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* View Product Details & Batches Modal */}
      {viewBatchesProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                  <ProductImage
                    src={viewBatchesProduct.imageUrl}
                    alt={viewBatchesProduct.name}
                    brand={viewBatchesProduct.brand}
                    category={viewBatchesProduct.category}
                    sku={viewBatchesProduct.sku}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-[#2563eb] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {viewBatchesProduct.brand}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5" title={viewBatchesProduct.name}>
                    {viewBatchesProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500">{viewBatchesProduct.category}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setViewBatchesProduct(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prominent SKU & Identification Box */}
            <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/40 rounded-xl p-3 sm:p-3.5 border border-blue-200/80 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1">
                    <Barcode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Product SKU Identifier</span>
                  </div>
                  <div className="font-mono text-base sm:text-lg font-black text-blue-950 tracking-tight select-all">
                    {viewBatchesProduct.sku || (viewBatchesProduct as any).product_sku || 'N/A'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const skuText = viewBatchesProduct.sku || (viewBatchesProduct as any).product_sku || '';
                    if (skuText) {
                      navigator.clipboard.writeText(skuText);
                      setCopiedSku(true);
                      setTimeout(() => setCopiedSku(false), 2000);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 shadow-2xs flex items-center space-x-1 transition-all active:scale-95 shrink-0 cursor-pointer"
                  title="Copy SKU code to clipboard"
                >
                  {copiedSku ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-blue-600" />
                      <span>Copy SKU</span>
                    </>
                  )}
                </button>
              </div>

              {/* Barcode & HSN Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-blue-100 text-xs">
                <span className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                  <span className="text-slate-400">Barcode:</span>
                  <span className="font-bold">{viewBatchesProduct.barcode || PRODUCT_BARCODE_MAP[viewBatchesProduct.sku] || 'N/A'}</span>
                </span>
                <span className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                  <span className="text-slate-400">HSN:</span>
                  <span className="font-bold">{viewBatchesProduct.hsnCode || 'N/A'}</span>
                </span>
                <span className="inline-flex items-center space-x-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                  <span className="text-slate-400">GST:</span>
                  <span className="font-bold">{viewBatchesProduct.gstRate}%</span>
                </span>
              </div>
            </div>

            {/* Pricing & Packaging Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Wholesale / Pc</div>
                <div className="text-sm font-black font-mono text-slate-900">₹{viewBatchesProduct.wholesalePricePiece.toFixed(2)}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">MRP / Pc</div>
                <div className="text-sm font-black font-mono text-slate-500 line-through">₹{viewBatchesProduct.mrpPiece.toFixed(2)}</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] text-emerald-700 font-bold">Margin</div>
                <div className="text-sm font-black text-emerald-700">
                  {viewBatchesProduct.mrpPiece > 0 
                    ? `+${Math.round(((viewBatchesProduct.mrpPiece - viewBatchesProduct.wholesalePricePiece) / viewBatchesProduct.mrpPiece) * 100)}%`
                    : '15%'}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[10px] text-slate-500 font-semibold">Case Pack</div>
                <div className="text-sm font-black text-slate-900">{viewBatchesProduct.piecesPerCase} pcs/cs</div>
              </div>
            </div>

            {/* Stock Summary */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">Warehouse Stock:</span>
                <span className="font-mono font-black text-slate-900">{viewBatchesProduct.currentStockCases} Cases</span>
                {viewBatchesProduct.currentStockLoosePcs > 0 && (
                  <span className="font-mono text-slate-500">+{viewBatchesProduct.currentStockLoosePcs} pcs</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Reorder Level: {viewBatchesProduct.reorderLevelCases} cs
              </div>
            </div>

            {/* Active Batches Section */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Active Warehouse Batches:</span>
                <span className="text-[11px] font-normal text-slate-500">{(viewBatchesProduct.batches || []).length} Recorded</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {(viewBatchesProduct.batches || []).length > 0 ? (
                  viewBatchesProduct.batches.map((batch, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{batch.batchNumber}</div>
                        <div className="text-[11px] text-slate-500">
                          Mfg: {batch.mfgDate} • <span className="font-semibold text-rose-700">Exp: {batch.expiryDate}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[#1A365D]">{batch.stockCases} Cases</div>
                        <div className="text-[10px] text-slate-500 font-mono">Bin {batch.warehouseBin || 'A-01'}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                    No active batch logs found for this SKU.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const pId = viewBatchesProduct.id;
                    setViewBatchesProduct(null);
                    onInwardStock(pId);
                  }}
                  className="text-xs font-semibold text-[#2563eb] hover:underline"
                >
                  + Inward New Batch
                </button>
                {isAdmin && (
                  <>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        const p = viewBatchesProduct;
                        setViewBatchesProduct(null);
                        handleOpenEdit(p);
                      }}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-700 hover:underline"
                    >
                      Edit SKU
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewBatchesProduct(null)}
                className="px-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Product SKU?</h3>
                <p className="text-[11px] text-slate-500">This action will remove the SKU from active catalog.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{products.find(p => p.id === deletingProductId)?.name}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete SKU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {isBarcodeScannerOpen && (
        <BarcodeScannerModal
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          products={products}
          onProductFound={(foundProduct) => {
            setSelectedBrand('all');
            setSelectedCategory('all');
            setSearchQuery(foundProduct.sku);
          }}
        />
      )}

      {/* Bulk Product Add Modal */}
      {isBulkAddOpen && (
        <BulkProductAddModal
          isOpen={isBulkAddOpen}
          onClose={() => setIsBulkAddOpen(false)}
          existingBrands={brands.filter(b => b !== 'all')}
          categories={CATEGORIES}
          onSaveBatch={async (batch) => {
            if (onSaveBatchProducts) {
              await onSaveBatchProducts(batch);
            } else {
              for (const p of batch) {
                await onSaveProduct(p);
              }
            }
          }}
        />
      )}

      {/* ApnaClub-Style Pack Selector Modal */}
      {packSelectorProduct && (
        <ApnaClubPackSelectorModal
          isOpen={!!packSelectorProduct}
          onClose={() => setPackSelectorProduct(null)}
          product={packSelectorProduct}
          onAddToCartSingle={(prod, qty, pack) => {
            if (onAddToCart) {
              onAddToCart(prod, qty, pack);
            }
          }}
          onAddToCartBatch={(items) => {
            if (onAddToCart) {
              items.forEach(item => {
                onAddToCart(item.product, item.quantity, item.packing);
              });
            }
          }}
        />
      )}

    </div>
  );
};
