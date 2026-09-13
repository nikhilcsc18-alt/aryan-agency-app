import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Flame, 
  ChevronRight, 
  ChevronLeft,
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
  X,
  Store,
  Clock,
  ShieldCheck,
  BadgePercent,
  CheckCircle,
  Navigation as NavIcon
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

// Visual FMCG Categories with Real High-Res Imagery
interface CategoryItem {
  id: string;
  label: string;
  categoryMatch: string[];
  imageUrl: string;
  bgColor: string;
  ringColor: string;
  icon: () => React.ReactNode;
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
  
  // Brand filter state
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // Active view mode between Categories and Brands card
  const [activeBrowseMode, setActiveBrowseMode] = useState<'categories' | 'brands'>('categories');
  
  // Banner slide index & auto-slide state
  const [currentBanner, setCurrentBanner] = useState<number>(0);
  const [isBannerPaused, setIsBannerPaused] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Local product quantities for stepper before adding to cart
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  
  // Quick added visual feedback per product
  const [justAdded, setJustAdded] = useState<Record<string, boolean>>({});

  // 8 Curated FMCG Wholesale Categories with real product image URLs
  const categories: CategoryItem[] = [
    {
      id: 'biscuits',
      label: 'Biscuits & Bakery',
      categoryMatch: ['Biscuits & Bakery', 'Biscuits'],
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
      bgColor: 'bg-blue-600',
      ringColor: 'ring-blue-600',
      icon: () => (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <circle cx="9" cy="9" r="1" fill="currentColor" />
          <circle cx="15" cy="9" r="1" fill="currentColor" />
          <circle cx="12" cy="14" r="1" fill="currentColor" />
        </svg>
      )
    },
    {
      id: 'snacks',
      label: 'Snacks & Chips',
      categoryMatch: ['Snacks & Namkeen', 'Snacks & Instant Food', 'Snacks'],
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80',
      bgColor: 'bg-orange-500',
      ringColor: 'ring-orange-500',
      icon: () => (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4L7 2L12 4L17 2L19 4V20L17 22L12 20L7 22L5 20V4Z" />
          <circle cx="12" cy="14" r="1.5" fill="currentColor" />
        </svg>
      )
    },
    {
      id: 'beverages',
      label: 'Beverages',
      categoryMatch: ['Beverages', 'Beverages & Tea'],
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80',
      bgColor: 'bg-emerald-600',
      ringColor: 'ring-emerald-600',
      icon: () => (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2H14V5H10V2Z" />
          <path d="M9 5H15L17 8V20C17 21.1 16.1 22 15 22H9C7.9 22 7 21.1 7 20V8L9 5Z" />
        </svg>
      )
    },
    {
      id: 'personal_care',
      label: 'Personal Care',
      categoryMatch: ['Personal Care'],
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
      bgColor: 'bg-purple-600',
      ringColor: 'ring-purple-600',
      icon: () => (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 5H14" />
          <path d="M12 2V5" />
          <path d="M8 8C8 6.9 8.9 6 10 6H14C15.1 6 16 6.9 16 8V20C16 21.1 15.1 22 14 22H10C8.9 22 8 21.1 8 20V8Z" />
        </svg>
      )
    },
    {
      id: 'home_care',
      label: 'Home Care',
      categoryMatch: ['Household & Hygiene', 'Home Care'],
      imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80',
      bgColor: 'bg-pink-600',
      ringColor: 'ring-pink-600',
      icon: () => (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10L12 3L21 10V20C21 20.6 20.6 21 20 21H4C3.4 21 3 20.6 3 20V10Z" />
        </svg>
      )
    },
    {
      id: 'dairy',
      label: 'Dairy & Butter',
      categoryMatch: ['Dairy & Refrigerated', 'Dairy'],
      imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80',
      bgColor: 'bg-amber-600',
      ringColor: 'ring-amber-600',
      icon: () => (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 21h10M12 3v18" />
        </svg>
      )
    },
    {
      id: 'baby_care',
      label: 'Baby Care',
      categoryMatch: ['Baby Care'],
      imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&auto=format&fit=crop&q=80',
      bgColor: 'bg-cyan-600',
      ringColor: 'ring-cyan-600',
      icon: () => (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
        </svg>
      )
    },
    {
      id: 'staples',
      label: 'Spices & Staples',
      categoryMatch: ['Staples & Cooking Essentials', 'Spices & Staples', 'Foodgrain', 'Snacks & Instant Food'],
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80',
      bgColor: 'bg-red-600',
      ringColor: 'ring-red-600',
      icon: () => (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      )
    }
  ];

  // Dynamically extract authentic brands from database products
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, { brand: string; count: number; sampleProduct?: Product }>();
    products.forEach(p => {
      const b = (p.brand || '').trim();
      if (!b) return;
      if (!brandMap.has(b)) {
        brandMap.set(b, {
          brand: b,
          count: 1,
          sampleProduct: p
        });
      } else {
        const item = brandMap.get(b)!;
        item.count += 1;
        if (!item.sampleProduct?.imageUrl && p.imageUrl) {
          item.sampleProduct = p;
        }
      }
    });
    return Array.from(brandMap.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  // Helper to find real category image from products or fallback
  const getCategoryPhoto = (cat: CategoryItem) => {
    const matchingProduct = products.find(p => 
      cat.categoryMatch.some(m => (p.category || '').toLowerCase().includes(m.toLowerCase())) && p.imageUrl
    );
    return matchingProduct?.imageUrl || cat.imageUrl;
  };

  // Helper to count available products in category
  const getCategoryCount = (cat: CategoryItem) => {
    return products.filter(p => 
      cat.categoryMatch.some(m => (p.category || '').toLowerCase().includes(m.toLowerCase()))
    ).length;
  };

  // Multiple Promotional Banners for Auto-Slide Carousel (Focused on Retailers / Dukandars)
  const bannerSlides = [
    {
      id: 'banner_main',
      bgGradient: 'from-[#F6BD27] via-[#F4B218] to-[#E89E0B]',
      title: 'दुकानदारों के लिए सीधे डिपो थोक भाव',
      tagline: 'Best Wholesale Rates • Maximum Retailer Margins',
      badge: 'केवल दुकानदारों के लिए (B2B)',
      offer: 'हर पेटी / कार्टन पर ₹20 से ₹60 तक का सीधा दुकानदार मुनाफा',
      brands: "Lay's • Kurkure • Parle-G • Amul • Sunfeast"
    },
    {
      id: 'banner_offers',
      bgGradient: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
      title: 'Aryan B2B Retailer Trade Schemes',
      tagline: 'Parle • Britannia • Sunfeast • PepsiCo • Amul',
      badge: 'थोक व्यापार डिस्काउंट',
      offer: 'कार्टन / पेटी बुकिंग पर अतिरिक्त 5% थोक स्कीम मार्जिन',
      brands: 'Special Wholesale Trade Margin on Bulk Booking'
    },
    {
      id: 'banner_fast',
      bgGradient: 'from-[#0284C7] via-[#0369A1] to-[#075985]',
      title: 'Direct Depot Supply to Your Shop',
      tagline: 'Same-Day / 24-Hour Dispatch directly to your Kirana Counter',
      badge: 'दुकान तक सीधी डिलीवरी',
      offer: '100% Genuine Direct Supply Chain Guarantee with GST Bill',
      brands: 'City Beat Fleet • Indiranagar • Yeshwanthpur • Whitefield'
    },
    {
      id: 'banner_baby_care',
      bgGradient: 'from-[#0D9488] via-[#0F766E] to-[#115E59]',
      title: 'Baby Care & Personal Hygiene Wholesale',
      tagline: 'Honey Bunny • Dettol • Colgate • Stayfree',
      badge: 'सुपर-स्टॉकिस्ट डिपो',
      offer: 'Buy 5 Cases, Get 1 Case Free on Honey Bunny Diapers',
      brands: 'Super-Stockist Authentic Direct Supply for Retailers'
    }
  ];

  // Auto-slide Timer Effect
  useEffect(() => {
    if (isBannerPaused) return;

    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % bannerSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isBannerPaused, bannerSlides.length]);

  // Manual Swipe Handlers for Touch Devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      setCurrentBanner(prev => (prev + 1) % bannerSlides.length);
    } else if (isRightSwipe) {
      setCurrentBanner(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

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

  // Identify the latest active order for continuous, non-blinking prominent tracking
  const activeOrder = useMemo(() => {
    const ongoing = orders.find(o => 
      ['booked', 'confirmed', 'packed', 'out_for_delivery', 'dispatched'].includes(o.status)
    );
    if (ongoing) return ongoing;
    // Fallback to most recent order if any
    return orders.length > 0 ? orders[0] : null;
  }, [orders]);

  const hasActiveDelivery = activeOrder && ['booked', 'confirmed', 'packed', 'out_for_delivery', 'dispatched'].includes(activeOrder.status);

  // Filtered products based on search, category or brand
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

    // Brand filter
    if (selectedBrand) {
      list = list.filter(p => p.brand.toLowerCase() === selectedBrand.toLowerCase());
    }

    return list;
  }, [products, searchQuery, selectedCategory, selectedBrand]);

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

  // Helper for order status progress steps
  const getTrackingStepIndex = (status: string) => {
    switch (status) {
      case 'booked': return 1;
      case 'confirmed': return 2;
      case 'packed': return 3;
      case 'out_for_delivery':
      case 'dispatched': return 4;
      case 'delivered': return 5;
      default: return 1;
    }
  };

  const currentStep = activeOrder ? getTrackingStepIndex(activeOrder.status) : 0;

  return (
    <div className="w-full pb-20 space-y-4 sm:space-y-5 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* B2B WHOLESALE RETAILER CALLOUT (Dukandar / Shopkeeper Exclusive)          */}
      {/* Clarifies that this app is for registered shopkeepers & wholesale orders  */}
      {/* ========================================================================= */}
      <div className="w-full bg-gradient-to-r from-[#07162c] via-[#0B2545] to-[#0A1E3F] border border-blue-800/80 rounded-2xl p-3 text-white shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
            <Store className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 px-1.5 py-0.5 rounded text-white">
                B2B Wholesale
              </span>
              <span className="text-xs font-extrabold text-amber-300">
                केवल दुकानदारों व किराना व्यापारियों के लिए
              </span>
            </div>
            <p className="text-[10.5px] text-blue-200 mt-0.5 leading-tight">
              सीधे डिपो से कार्टन / पेटी थोक भाव • स्पेशल दुकानदार मार्जिन व स्कीम • उपभोगता आर्डर मान्य नहीं
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-1 text-emerald-400 text-[11px] font-bold shrink-0 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60">
          <ShieldCheck className="w-4 h-4" />
          <span>GST Bill & Dukan Delivery</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. AUTO-SLIDING PROMOTIONAL BANNER CAROUSEL                               */}
      {/* ========================================================================= */}
      <section 
        className="relative w-full select-none"
        onMouseEnter={() => setIsBannerPaused(true)}
        onMouseLeave={() => setIsBannerPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg bg-gradient-to-r ${bannerSlides[currentBanner].bgGradient} p-4 sm:p-6 text-white transition-all duration-700 min-h-[195px] sm:min-h-[225px] flex items-center`}
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
                    B2B FMCG Distribution
                  </span>
                </div>
              </div>

              {/* Banner Title - Bold Clear Typography */}
              <h2 className="text-lg sm:text-2xl font-black text-[#0A1E3F] tracking-tight leading-tight">
                {bannerSlides[currentBanner].title}
              </h2>

              {/* Tagline Pill */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0A1E3F] text-white text-[10px] sm:text-xs font-bold tracking-tight shadow-sm">
                <span>{bannerSlides[currentBanner].tagline}</span>
              </div>

              {/* Offer Text */}
              <p className="text-[11px] sm:text-xs font-bold text-[#0A1E3F]/90">
                {bannerSlides[currentBanner].offer}
              </p>
            </div>

            {/* Right Visual Products Badge */}
            <div className="w-full md:w-2/5 flex items-center justify-between sm:justify-end space-x-3">
              <div className="flex flex-col space-y-0.5 text-left sm:text-right text-[10px] sm:text-[11px] font-bold text-[#0A1E3F]">
                <span>✓ {bannerSlides[currentBanner].brands}</span>
                <span className="text-[9px] text-[#0A1E3F]/80">ISO 9001:2015 GST Verified</span>
              </div>

              {/* Circular Badge: Wholesale Retailer Verified */}
              <div className="relative shrink-0 w-22 h-22 sm:w-28 sm:h-28 rounded-full bg-[#0A1E3F] text-white p-2 flex flex-col items-center justify-center text-center shadow-xl border-2 border-white/20 transform hover:scale-105 transition-transform">
                <span className="text-[9px] sm:text-xs font-black tracking-wider uppercase text-amber-400">
                  B2B
                </span>
                <span className="text-[11px] sm:text-sm font-black tracking-tight text-white uppercase">
                  RETAILER
                </span>
                <span className="text-[9px] sm:text-xs font-black tracking-wider uppercase text-emerald-400">
                  WHOLESALE
                </span>
                <div className="mt-0.5 text-[8px] opacity-80 font-semibold text-blue-200">
                  दुकानदार पोर्टल
                </div>
              </div>
            </div>

          </div>

          {/* Left / Right Arrow Controls */}
          <button 
            onClick={() => setCurrentBanner(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-xs transition-opacity"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setCurrentBanner(prev => (prev + 1) % bannerSlides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-xs transition-opacity"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center space-x-2 mt-2.5">
          {bannerSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentBanner(idx)}
              className={`transition-all duration-300 cursor-pointer ${
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
      {/* 2. PROMINENT ORDER / DELIVERY TRACKING (TOP POSITION)                      */}
      {/* Visible immediately near the top without scrolling; steady, non-blinking  */}
      {/* ========================================================================= */}
      <section className="w-full">
        {hasActiveDelivery && activeOrder ? (
          /* Prominent Active Order Tracking Card */
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#103058] to-[#0D233D] p-4 sm:p-5 shadow-md border border-blue-900 text-white">
            
            {/* Top row: Delivery Van Graphic, Order Info & Track Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-800/60">
              
              <div className="flex items-center space-x-3 text-left">
                {/* FMCG Delivery Van Graphic */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md ring-2 ring-blue-400/30 shrink-0">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                      दुकान तक डिलीवरी (Live Beat Van)
                    </span>
                    <span className="text-xs font-bold text-blue-200">
                      #{activeOrder.orderNumber}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white mt-0.5 tracking-tight">
                    {activeOrder.retailerName} • {formatINR(activeOrder.grandTotal || activeOrder.totalAmount || 0)}
                  </h3>
                </div>
              </div>

              {/* Action: View & Track Details */}
              <div className="flex items-center justify-between sm:justify-end space-x-2">
                <span className="text-[11px] font-semibold text-blue-200">
                  Expected: <b className="text-white">{activeOrder.expectedDeliveryDate || 'Today Beat Van'}</b>
                </span>
                <button
                  id="home-active-track-order-btn"
                  onClick={() => onNavigateTab('orders')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FFB703] hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Track Order</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
                </button>
              </div>

            </div>

            {/* 5-Step Order Progression Stepper (Steady Solid Colors - No Annoying Blinking) */}
            <div className="pt-3.5">
              <div className="grid grid-cols-5 gap-1 text-center relative">
                
                {/* Step 1: Placed */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep >= 1 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-1.5 leading-tight ${
                    currentStep === 1 ? 'text-amber-300' : currentStep > 1 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    Booked (दर्ज)
                  </span>
                </div>

                {/* Step 2: Confirmed */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep >= 2 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-1.5 leading-tight ${
                    currentStep === 2 ? 'text-amber-300' : currentStep > 2 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    Confirmed (स्वीकृत)
                  </span>
                </div>

                {/* Step 3: Packed */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep >= 3 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : '3'}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-1.5 leading-tight ${
                    currentStep === 3 ? 'text-amber-300' : currentStep > 3 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    Packed (डिपो पैक)
                  </span>
                </div>

                {/* Step 4: Out for Delivery */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep >= 4 ? 'bg-[#FFB703] text-slate-950 shadow-md ring-2 ring-amber-300/40' : 'bg-slate-700 text-slate-400'
                  }`}>
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-1.5 leading-tight ${
                    currentStep === 4 ? 'text-amber-300 font-extrabold' : currentStep > 4 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    On Van (वैन पर)
                  </span>
                </div>

                {/* Step 5: Delivered */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    currentStep >= 5 ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold mt-1.5 leading-tight ${
                    currentStep >= 5 ? 'text-emerald-400 font-bold' : 'text-slate-400'
                  }`}>
                    Delivered (दुकान पर)
                  </span>
                </div>

              </div>
            </div>

          </div>
        ) : (
          /* Compact Delivery Banner when no order is in transit */
          <div className="w-full rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#103058] to-[#0D233D] px-4 py-3 shadow-md border border-blue-950 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-white shrink-0">
                <Truck className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-white tracking-tight leading-tight">
                  डिपो से दुकान तक सीधी डिलीवरी (Direct Depot Supply)
                </h4>
                <p className="text-[11px] text-blue-200 font-medium">
                  किराना दुकानों के लिए 24 घंटे में डिलीवरी • 100% पक्का GST बिल व आर्डर ट्रैकिंग
                </p>
              </div>
            </div>

            <button
              id="home-compact-track-order-btn"
              onClick={() => onNavigateTab('orders')}
              className="px-3 py-2 rounded-xl bg-[#FFB703] hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Track Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. PRODUCT CATEGORIES + BRANDS (TWO PROFESSIONAL SECTIONS)               */}
      {/* Interactive switcher or side-by-side cards with real database brands       */}
      {/* ========================================================================= */}
      <section className="w-full space-y-3">
        
        {/* Navigation Tabs Header between Categories & Brands */}
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveBrowseMode('categories')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeBrowseMode === 'categories'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Product Categories
            </button>
            <button
              onClick={() => setActiveBrowseMode('brands')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeBrowseMode === 'brands'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Top FMCG Brands</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-blue-100 text-blue-800">
                {availableBrands.length}
              </span>
            </button>
          </div>

          {/* Active Filter Clear Button */}
          {(selectedCategory || selectedBrand) && (
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedBrand(null);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Clear Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ======================================================================= */}
        {/* A. PRODUCT CATEGORIES CARD                                              */}
        {/* Dedicated card with real product category imagery (Biscuits, Snacks...)  */}
        {/* ======================================================================= */}
        {activeBrowseMode === 'categories' ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
            
            {/* Header with Title, Count and Active Filter Status */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>Product Categories (थोक श्रेणियां)</span>
                  <span className="text-[10px] font-semibold text-slate-500 lowercase">
                    ({categories.length} categories)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  दुकान के स्टॉक के लिए कैटेगरी चुनें • पेटी व कार्टन थोक दरें उपलब्ध
                </p>
              </div>

              {selectedCategory && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 shrink-0">
                  Filtered
                </span>
              )}
            </div>

            {/* Visual Product Categories Grid with Realistic Product Images */}
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = getCategoryCount(cat);
                const photo = getCategoryPhoto(cat);

                return (
                  <button
                    key={cat.id}
                    id={`cat-${cat.id}`}
                    onClick={() => {
                      setSelectedBrand(null);
                      setSelectedCategory(isSelected ? null : cat.id);
                    }}
                    className={`group flex flex-col items-center text-center p-1.5 sm:p-2 rounded-2xl transition-all cursor-pointer relative select-none ${
                      isSelected 
                        ? 'bg-blue-50/90 ring-2 ring-blue-600 shadow-xs scale-102' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Category Image Box with Realistic Product Visual */}
                    <div 
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white border-2 transition-all duration-200 shadow-2xs ${
                        isSelected 
                          ? 'border-blue-600 ring-2 ring-blue-400/40 shadow-sm' 
                          : 'border-slate-200/90 group-hover:border-slate-300 group-hover:scale-105'
                      }`}
                    >
                      <img
                        src={photo}
                        alt={cat.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      
                      {/* Active Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Category Label */}
                    <span className={`text-[10px] sm:text-xs font-bold mt-1.5 leading-snug line-clamp-2 max-w-[78px] ${
                      isSelected ? 'text-blue-700 font-black' : 'text-slate-800 group-hover:text-blue-600'
                    }`}>
                      {cat.label}
                    </span>

                    {/* Product count */}
                    <span className="text-[9.5px] font-semibold text-slate-400 mt-0.5">
                      {count > 0 ? `${count} items` : 'Stock'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ======================================================================= */
          /* B. BRANDS CARD                                                          */
          /* Authentic database brands with logos & product counts                   */
          /* ======================================================================= */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Direct Stockist Brands ({availableBrands.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tap any authorized brand to filter wholesale stock
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {availableBrands.map(({ brand, count, sampleProduct }) => {
                const isSelected = selectedBrand?.toLowerCase() === brand.toLowerCase();
                return (
                  <button
                    key={brand}
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedBrand(isSelected ? null : brand);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/30' 
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                    }`}
                  >
                    {/* Brand thumbnail / icon */}
                    <div className="w-10 h-10 rounded-lg bg-white p-1 border border-slate-100 flex items-center justify-center shrink-0">
                      {sampleProduct?.imageUrl ? (
                        <ProductImage
                          src={sampleProduct.imageUrl}
                          alt={brand}
                          brand={brand}
                          category={sampleProduct.category}
                          sku={sampleProduct.sku}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Store className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-black truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {brand}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {count} {count === 1 ? 'Product' : 'Products'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </section>

      {/* ========================================================================= */}
      {/* 4. PRODUCT CATALOG GRID: FILTERED OR TOP PRODUCTS                         */}
      {/* ========================================================================= */}
      <section className="w-full">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500" />
            </span>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              {selectedBrand ? `${selectedBrand} Wholesale Catalog` : selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.label} (थोक स्टॉक)` : 'Wholesale FMCG Stock (थोक उत्पाद)'}
            </h2>
            {(selectedCategory || selectedBrand) && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase">
                {selectedBrand || categories.find(c => c.id === selectedCategory)?.label}
              </span>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('products')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer group"
          >
            <span>View All ({products.length})</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Product Cards Row / Multi-Card Display */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold">No wholesale products found matching criteria</p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedBrand(null);
                if (onSearchChange) onSearchChange('');
              }}
              className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.slice(0, 12).map((product) => {
              const qty = productQuantities[product.id] || 1;
              const isAdded = justAdded[product.id];
              const discountText = getDiscountBadge(product);
              const packSize = getPackSize(product);
              const wholesalePrice = product.wholesalePricePiece || Math.round(product.casePrice / product.piecesPerCase);
              const mrp = product.mrpPiece || Math.round(wholesalePrice * 1.25);
              const marginPerPiece = Math.max(0, mrp - wholesalePrice);
              const marginPercent = mrp > 0 ? Math.round((marginPerPiece / mrp) * 100) : 0;
              const piecesPerCase = product.piecesPerCase || 24;
              const casePrice = product.casePrice || Math.round(wholesalePrice * piecesPerCase);

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-2.5 sm:p-3 flex flex-col justify-between relative group"
                >
                  {/* Top Left Wholesale / Trade Scheme Pill Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10 max-w-[80%]">
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-[#E53E3E] text-white shadow-xs truncate block">
                      {product.schemeDescription ? product.schemeDescription : discountText ? discountText : 'थोक स्कीम'}
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
                    
                    <p className="text-[11px] font-semibold text-slate-500 truncate">
                      {packSize} • <span className="text-slate-700 font-bold">{product.brand}</span>
                    </p>

                    {/* Wholesale Pricing vs MRP */}
                    <div className="pt-0.5 space-y-1">
                      <div className="flex items-baseline justify-between flex-wrap gap-1">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base sm:text-lg font-black text-[#0A1E3F]">
                            {formatINR(wholesalePrice)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            /pc थोक
                          </span>
                        </div>
                        {mrp > wholesalePrice && (
                          <span className="text-xs font-semibold text-slate-400 line-through">
                            MRP {formatINR(mrp)}
                          </span>
                        )}
                      </div>

                      {/* Dukandar Margin / Profit Highlight */}
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg px-2 py-0.5 flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-emerald-800">
                        <span>मुनाफा:</span>
                        <span className="font-black text-emerald-700">
                          +{formatINR(marginPerPiece)} ({marginPercent}%)
                        </span>
                      </div>

                      {/* Case / Peti Rate */}
                      <div className="text-[10px] text-slate-500 font-medium flex items-center justify-between px-0.5">
                        <span>1 पेटी ({piecesPerCase} pcs):</span>
                        <span className="font-bold text-slate-800">{formatINR(casePrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Quantity Stepper + Case Add to Cart Button */}
                  <div className="mt-3 space-y-2">
                    {/* Quantity Stepper in Cases */}
                    <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center shadow-2xs hover:bg-slate-200 active:scale-95 transition-transform cursor-pointer"
                        title="कम करें (Decrease cases)"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800">
                        {qty} {qty > 1 ? 'पेटियां (Cases)' : 'पेटी (Case)'}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center shadow-2xs hover:bg-slate-200 active:scale-95 transition-transform cursor-pointer"
                        title="बढ़ाएं (Increase cases)"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Add Case to Cart Button - Bright Yellow */}
                    <button
                      onClick={() => handleAddToCartClick(product)}
                      className={`w-full py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : 'bg-[#FFC107] hover:bg-[#FFB300] text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">पेटी कार्ट में जोड़ी गई!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Add Case (पेटी जोड़ें)</span>
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

    </div>
  );
};
