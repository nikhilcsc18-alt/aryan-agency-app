import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  ChevronRight, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  Truck, 
  Package, 
  Boxes, 
  Tag, 
  Percent, 
  Gift, 
  Search, 
  ArrowRight,
  ClipboardList,
  UserCheck,
  CreditCard,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Product, Order, ProductCategory, CartItem } from '../types';
import { formatINR } from '../lib/api';
import { ProductImage } from './ProductImage';
import { AryanAgencyFMCGLogo } from './AryanAgencyLogo';

interface MobileHomeViewProps {
  products: Product[];
  orders?: Order[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onNavigateTab: (tab: any) => void;
  onOpenCart: () => void;
  onOpenAccountModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

// 6 Exact Categories from reference design
interface CategoryItem {
  id: string;
  label: string;
  categoryMatch: string[];
  bgColor: string;
  ringColor: string;
  icon: (color?: string) => React.ReactNode;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  products,
  orders = [],
  onAddToCart,
  onNavigateTab,
  onOpenCart,
  onOpenAccountModal,
  searchQuery = '',
  onSearchChange
}) => {
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Banner slide index
  const [currentBanner, setCurrentBanner] = useState<number>(0);

  // Local product quantities for stepper before adding to cart
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  
  // Quick added visual feedback per product
  const [justAdded, setJustAdded] = useState<Record<string, boolean>>({});

  // 6 Circular Category definitions matching reference image
  const categories: CategoryItem[] = [
    {
      id: 'snacks',
      label: 'Snacks & Chips',
      categoryMatch: ['Snacks & Namkeen', 'Snacks & Instant Food'],
      bgColor: 'bg-[#FF6A3D]',
      ringColor: 'ring-[#FF6A3D]',
      icon: () => (
        // Snacks & Chips packet SVG
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4L7 2L12 4L17 2L19 4V20L17 22L12 20L7 22L5 20V4Z" />
          <path d="M9 9C11 12 13 12 15 9" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      )
    },
    {
      id: 'biscuits',
      label: 'Biscuits & Bakery',
      categoryMatch: ['Biscuits & Bakery'],
      bgColor: 'bg-[#1E60D5]',
      ringColor: 'ring-[#1E60D5]',
      icon: () => (
        // Biscuit / Cookie SVG
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="9" r="1" fill="currentColor" />
          <circle cx="15" cy="9" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
          <circle cx="8" cy="14" r="1" fill="currentColor" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
        </svg>
      )
    },
    {
      id: 'beverages',
      label: 'Beverages',
      categoryMatch: ['Beverages', 'Beverages & Tea'],
      bgColor: 'bg-[#00B050]',
      ringColor: 'ring-[#00B050]',
      icon: () => (
        // Drink bottle SVG
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2H14V5H10V2Z" />
          <path d="M9 5H15L17 8V20C17 21.1 16.1 22 15 22H9C7.9 22 7 21.1 7 20V8L9 5Z" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="16" x2="17" y2="16" />
        </svg>
      )
    },
    {
      id: 'personal_care',
      label: 'Personal Care',
      categoryMatch: ['Personal Care'],
      bgColor: 'bg-[#8E44AD]',
      ringColor: 'ring-[#8E44AD]',
      icon: () => (
        // Lotion / Shampoo dispenser bottle SVG
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 5H14" />
          <path d="M12 2V5" />
          <path d="M8 8C8 6.9 8.9 6 10 6H14C15.1 6 16 6.9 16 8V20C16 21.1 15.1 22 14 22H10C8.9 22 8 21.1 8 20V8Z" />
          <path d="M12 11V15" />
          <path d="M10 13H14" />
        </svg>
      )
    },
    {
      id: 'home_care',
      label: 'Home Care',
      categoryMatch: ['Household & Hygiene', 'Home Care'],
      bgColor: 'bg-[#E91E63]',
      ringColor: 'ring-[#E91E63]',
      icon: () => (
        // House / Cleaning SVG
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10L12 3L21 10V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V10Z" />
          <path d="M9 21V12H15V21" />
        </svg>
      )
    },
    {
      id: 'baby_care',
      label: 'Baby Care',
      categoryMatch: ['Baby Care', 'Personal Care'],
      bgColor: 'bg-[#00BCD4]',
      ringColor: 'ring-[#00BCD4]',
      icon: () => (
        // Baby / Stroller / Face SVG
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
          <path d="M9.5 15C10.5 16.5 13.5 16.5 14.5 15" />
          <path d="M12 2V4" />
          <path d="M4 6L6 7" />
          <path d="M20 6L18 7" />
        </svg>
      )
    }
  ];

  // Promotional Banner slides
  const bannerSlides = [
    {
      id: 'banner_main',
      bgGradient: 'from-[#F6BD27] via-[#F4B218] to-[#E89E0B]',
      title: 'सभी बड़े ब्रांड्स अब आपके पास',
      tagline: 'Quality Products | Best Price | Fast Delivery',
      badge: 'Har Brand Har Ghar Tak',
      offer: 'Flat ₹10 to ₹50 Margin per pack on Wholesale'
    },
    {
      id: 'banner_offers',
      bgGradient: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
      title: 'Aryan Mega B2B FMCG Utsav',
      tagline: 'Parle • Britannia • Lay’s • PepsiCo • Amul',
      badge: 'Instant Schemes',
      offer: 'Extra 5% Wholesale Margin on Bulk Bookings'
    },
    {
      id: 'banner_fast',
      bgGradient: 'from-[#0284C7] via-[#0369A1] to-[#075985]',
      title: 'Fast & Direct Depot Delivery',
      tagline: 'Order Today • Same-Day / 24-Hour Dispatch',
      badge: 'City Beat Fleet',
      offer: '100% Genuine Direct Supply Chain Guarantee'
    }
  ];

  // Helper to extract pack size string
  const getPackSize = (product: Product): string => {
    const match = product.name.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1];
    const weightMatch = product.name.match(/(\d+\s*(?:g|kg|l|ml|pcs|s1|tin|pouch))/i);
    if (weightMatch) return weightMatch[0];
    return `${product.piecesPerCase} pcs/cs`;
  };

  // Helper to calculate discount amount or text
  const getDiscountBadge = (product: Product): string => {
    if (product.activeScheme?.discountFlatRs) {
      return `₹${product.activeScheme.discountFlatRs} OFF`;
    }
    if (product.mrpPiece && product.wholesalePricePiece && product.mrpPiece > product.wholesalePricePiece) {
      const diff = Math.round(product.mrpPiece - product.wholesalePricePiece);
      if (diff > 0) return `₹${diff} OFF`;
    }
    if (product.activeScheme?.discountPercentage) {
      return `${product.activeScheme.discountPercentage}% OFF`;
    }
    return 'BEST PRICE';
  };

  // Filtered products based on search or category
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      const catObj = categories.find(c => c.id === selectedCategory);
      if (catObj) {
        list = list.filter(p => 
          catObj.categoryMatch.some(m => 
            p.category.toLowerCase().includes(m.toLowerCase()) ||
            p.name.toLowerCase().includes(m.toLowerCase())
          )
        );
      }
    }

    return list;
  }, [products, searchQuery, selectedCategory]);

  // Specific top reference products prioritizing Kurkure, Lay's, Honey Bunny Diaper, etc.
  const topProducts = useMemo(() => {
    // Sort so exact reference items appear at the front
    return [...filteredProducts].sort((a, b) => {
      const isARef = a.name.toLowerCase().includes('kurkure') || a.name.toLowerCase().includes('lay') || a.name.toLowerCase().includes('honey bunny');
      const isBRef = b.name.toLowerCase().includes('kurkure') || b.name.toLowerCase().includes('lay') || b.name.toLowerCase().includes('honey bunny');
      if (isARef && !isBRef) return -1;
      if (!isARef && isBRef) return 1;
      return 0;
    });
  }, [filteredProducts]);

  // Quantity stepper handlers
  const handleQuantityChange = (productId: string, delta: number) => {
    const current = productQuantities[productId] || 1;
    const next = Math.max(1, current + delta);
    setProductQuantities(prev => ({ ...prev, [productId]: next }));
  };

  const handleAddToCartClick = (product: Product) => {
    const qty = productQuantities[product.id] || 1;
    onAddToCart(product, qty);
    
    // Animate button state
    setJustAdded(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setJustAdded(prev => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  return (
    <div className="w-full pb-20 space-y-5 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. FULL-WIDTH PROMOTIONAL BANNER                                          */}
      {/* ========================================================================= */}
      <section className="relative w-full">
        <div 
          className={`relative w-full rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r ${bannerSlides[currentBanner].bgGradient} p-4 sm:p-6 text-white transition-all duration-500 min-h-[190px] sm:min-h-[220px] flex items-center`}
        >
          {/* Subtle background decorative shapes */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Left Content */}
            <div className="w-full md:w-3/5 space-y-2 text-left">
              {/* Aryan Agency Mini Branding */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-white/90 p-1 flex items-center justify-center shadow-xs">
                  <AryanAgencyFMCGLogo size="sm" theme="light" showSubline={false} />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider text-[#0f294d] uppercase leading-none">
                    ARYAN AGENCY
                  </h3>
                  <span className="text-[9px] font-bold text-[#1e3a8a] tracking-tight uppercase">
                    FMCG Distribution
                  </span>
                </div>
              </div>

              {/* Hindi Slogan - Large Bold Typography */}
              <h2 className="text-xl sm:text-2xl font-black text-[#0A1E3F] tracking-tight leading-tight drop-shadow-2xs">
                {bannerSlides[currentBanner].title}
              </h2>

              {/* Tagline Pill */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0A1E3F] text-white text-[10px] sm:text-xs font-bold tracking-tight shadow-sm">
                <span>{bannerSlides[currentBanner].tagline}</span>
              </div>
            </div>

            {/* Right Visual Products Collage / Badge */}
            <div className="w-full md:w-2/5 flex items-center justify-end space-x-3">
              {/* Featured brand pills */}
              <div className="hidden sm:flex flex-col space-y-1 text-right text-[11px] font-bold text-[#0A1E3F]">
                <span>✓ Lay's • Kurkure</span>
                <span>✓ Parle-G • Amul</span>
                <span>✓ Honey Bunny</span>
              </div>

              {/* Circular Badge: Har Brand Har Ghar Tak */}
              <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0A1E3F] text-white p-2 flex flex-col items-center justify-center text-center shadow-xl border-2 border-white/20 transform hover:scale-105 transition-transform">
                <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-amber-400">
                  Har Brand
                </span>
                <span className="text-[12px] sm:text-sm font-black tracking-tight text-white uppercase">
                  Har Ghar
                </span>
                <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase text-cyan-300">
                  Tak
                </span>
                <div className="mt-0.5 text-[8px] opacity-75 font-semibold">
                  100% Genuine
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center space-x-2 mt-2.5">
          {bannerSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBanner(idx)}
              className={`transition-all duration-200 cursor-pointer ${
                currentBanner === idx 
                  ? 'w-6 h-1.5 bg-[#0A1E3F] rounded-full' 
                  : 'w-2 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ROUND CATEGORY ICONS                                                   */}
      {/* ========================================================================= */}
      <section className="w-full">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
            Product Categories
          </h3>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Clear Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 6 Circular Categories horizontal scroll / grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 px-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-${cat.id}`}
                onClick={() => {
                  setSelectedCategory(isSelected ? null : cat.id);
                }}
                className={`group flex flex-col items-center text-center cursor-pointer transition-transform active:scale-95 focus:outline-none`}
              >
                {/* Round Circular Icon */}
                <div 
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${cat.bgColor} flex items-center justify-center shadow-md transition-all duration-200 ${
                    isSelected 
                      ? `ring-4 ${cat.ringColor} ring-offset-2 scale-105 shadow-lg` 
                      : 'group-hover:scale-105 group-hover:shadow-lg'
                  }`}
                >
                  {cat.icon()}
                </div>

                {/* Category Label */}
                <span className={`text-[11px] sm:text-xs font-bold mt-2 leading-tight max-w-[85px] line-clamp-2 ${
                  isSelected ? 'text-blue-700 font-extrabold' : 'text-slate-700 group-hover:text-slate-900'
                }`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PRODUCT SECTION: TOP PRODUCTS                                          */}
      {/* ========================================================================= */}
      <section className="w-full">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
            </span>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Top Products
            </h2>
            {selectedCategory && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase">
                {categories.find(c => c.id === selectedCategory)?.label}
              </span>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('products')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer group"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Product Cards Row / Multi-Card Display */}
        {topProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold">No products found matching the criteria</p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                if (onSearchChange) onSearchChange('');
              }}
              className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {topProducts.slice(0, 8).map((product) => {
              const qty = productQuantities[product.id] || 1;
              const isAdded = justAdded[product.id];
              const discountText = getDiscountBadge(product);
              const packSize = getPackSize(product);
              const wholesalePrice = product.wholesalePricePiece || Math.round(product.casePrice / product.piecesPerCase);
              const mrp = product.mrpPiece || Math.round(wholesalePrice * 1.25);

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="bg-white rounded-2xl border border-slate-100/90 shadow-xs hover:shadow-md transition-shadow p-2.5 sm:p-3 flex flex-col justify-between relative group"
                >
                  {/* Top Left Discount Pill Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md bg-[#E53E3E] text-white shadow-xs">
                      {discountText}
                    </span>
                  </div>

                  {/* Product Image Container */}
                  <div className="w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 mt-2">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      brand={product.brand}
                      category={product.category}
                      sku={product.sku}
                      objectFit="contain"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="mt-2.5 space-y-1">
                    <h3 
                      className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 min-h-[34px]"
                      title={product.name}
                    >
                      {product.name}
                    </h3>
                    
                    <p className="text-[11px] font-semibold text-slate-500">
                      {packSize}
                    </p>

                    {/* Pricing */}
                    <div className="flex items-baseline space-x-2 pt-0.5">
                      <span className="text-base sm:text-lg font-black text-slate-900">
                        {formatINR(wholesalePrice)}
                      </span>
                      {mrp > wholesalePrice && (
                        <span className="text-xs font-semibold text-slate-400 line-through">
                          {formatINR(mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Quantity Stepper + Yellow Add to Cart Button */}
                  <div className="mt-3 space-y-2">
                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center shadow-2xs hover:bg-slate-200 active:scale-95 transition-transform"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800">
                        {qty} {qty > 1 ? 'cases' : 'case'}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center shadow-2xs hover:bg-slate-200 active:scale-95 transition-transform"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Add to Cart Button - Bright Yellow */}
                    <button
                      onClick={() => handleAddToCartClick(product)}
                      className={`w-full py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : 'bg-[#FFC107] hover:bg-[#FFB300] text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Added to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. QUICK ACTION CARDS (4 Pastel Cards below Top Products)                 */}
      {/* ========================================================================= */}
      <section className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Home - All Products */}
          <button
            onClick={() => {
              setSelectedCategory(null);
              onNavigateTab('products');
            }}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#EEF4FF] hover:bg-blue-100/70 border border-blue-100 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-full bg-[#1A73E8] text-white flex items-center justify-center shadow-xs">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">Home</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">All Products</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 2: Orders - Track & Manage */}
          <button
            onClick={() => onNavigateTab('orders')}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#EDF8F1] hover:bg-emerald-100/70 border border-emerald-100 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-full bg-[#0F9D58] text-white flex items-center justify-center shadow-xs">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">Orders</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Track & Manage</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 3: Offers - Special Deals */}
          <button
            onClick={() => {
              setSelectedCategory(null);
              onNavigateTab('products');
            }}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF4ED] hover:bg-orange-100/70 border border-orange-100 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-full bg-[#F4511E] text-white flex items-center justify-center shadow-xs">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">Offers</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Special Deals</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Card 4: Account - Profile & Settings */}
          <button
            onClick={() => {
              if (onOpenAccountModal) {
                onOpenAccountModal();
              } else {
                onNavigateTab('dashboard');
              }
            }}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F0FF] hover:bg-purple-100/70 border border-purple-100 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-full bg-[#673AB7] text-white flex items-center justify-center shadow-xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">Account</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Profile & Settings</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DELIVERY SECTION: FAST & RELIABLE DELIVERY                             */}
      {/* ========================================================================= */}
      <section className="w-full">
        <div className="w-full rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#103058] to-[#0D233D] p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-950">
          
          {/* Left info */}
          <div className="flex items-center space-x-3 text-left w-full sm:w-auto">
            {/* Delivery Truck with speed lines */}
            <div className="w-12 h-12 rounded-xl bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-white shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white tracking-tight">
                Fast & Reliable Delivery
              </h4>
              <p className="text-xs text-blue-200 font-medium mt-0.5">
                Your Orders, Our Priority
              </p>
            </div>
          </div>

          {/* Center/Right Delivery Graphic & Track Order Button */}
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4">
            {/* 3D Parcel Box Graphic */}
            <div className="flex items-center space-x-1.5 opacity-90">
              <div className="flex flex-col space-y-0.5">
                <span className="w-6 h-0.5 bg-amber-400 rounded-full" />
                <span className="w-4 h-0.5 bg-amber-400 rounded-full" />
              </div>
              <Boxes className="w-7 h-7 text-amber-400" />
            </div>

            {/* Track Order Yellow Pill Button */}
            <button
              id="home-track-order-btn"
              onClick={() => onNavigateTab('orders')}
              className="px-4 py-2.5 rounded-full bg-[#FFB703] hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Track Order</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
