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
  ShoppingBag,
  Navigation as NavIcon,
  Smartphone,
  RefreshCw,
  Download,
  ScanLine
} from 'lucide-react';
import { Product, Order, ProductCategory, CartItem, ProductPackingOption, PromotionalBanner } from '../types';
import { formatINR } from '../lib/api';
import { ProductImage } from './ProductImage';
import { AryanAgencyFMCGLogo } from './AryanAgencyLogo';
import { B2BProductCard } from './B2BProductCard';
import { ApnaClubPackSelectorModal } from './ApnaClubPackSelectorModal';
import { AnimatedDeliveryRouteBanner } from './AnimatedDeliveryRouteBanner';
import { useAuth } from '../context/AuthContext';
import { triggerManualUpdateCheck } from './AppUpdateChecker';
import { triggerApkDownload, useAppDownloadConfig } from '../lib/appDownloadConfig';
import { performInAppUpdate } from '../lib/appUpdateService';

interface MobileHomeViewProps {
  products: Product[];
  orders?: Order[];
  banners?: PromotionalBanner[];
  onAddToCart: (product: Product, quantity?: number, packing?: ProductPackingOption) => void;
  onNavigateTab: (tab: any) => void;
  onOpenCart: () => void;
  onOpenAccountModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  cartItems?: CartItem[];
  onUpdateCartItem?: (productId: string, cases: number, loosePcs: number, packingId?: string) => void;
  onRemoveFromCart?: (productId: string, packingId?: string) => void;
  onQuickOrder?: (productId: string) => void;
  onOpenBarcodeScanner?: () => void;
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
  banners = [],
  onAddToCart,
  onNavigateTab,
  onOpenCart,
  onOpenAccountModal,
  searchQuery = '',
  onSearchChange,
  cartItems = [],
  onUpdateCartItem,
  onRemoveFromCart,
  onQuickOrder,
  onOpenBarcodeScanner
}) => {
  const { isAdmin, isSalesman, isRetailer } = useAuth();
  const { config: appConfig } = useAppDownloadConfig();

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

  // Pack selector modal state for ApnaClub style pack detail
  const [packSelectorProduct, setPackSelectorProduct] = useState<Product | null>(null);

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
  // Uses live banners configured from Admin Panel if available, otherwise falls back to defaults
  const bannerSlides = useMemo(() => {
    const activeBanners = (banners || []).filter(b => b.isActive);
    if (activeBanners.length > 0) {
      return activeBanners.map(b => ({
        id: b.id,
        bgGradient: b.bgGradient || 'from-[#F6BD27] via-[#F4B218] to-[#E89E0B]',
        title: b.title,
        tagline: b.subtitle || 'Best Wholesale Rates • Maximum Retailer Margins',
        badge: b.badgeText || 'केवल दुकानदारों के लिए (B2B)',
        offer: b.ctaText || 'हर पेटी / कार्टन पर सीधा थोक मुनाफा',
        brands: b.accentColor || "Parle • Britannia • Sunfeast • Amul",
        imageUrl: b.imageUrl,
        hideTextOverlay: Boolean(b.hideTextOverlay),
        showBuyNow: b.showBuyNow !== undefined ? Boolean(b.showBuyNow) : true,
        buyNowText: b.buyNowText || 'अभी खरीदें (Buy Now)',
        targetBrand: b.targetBrand || '',
        targetCategory: b.targetCategory || '',
        posterFit: b.posterFit || 'cover'
      }));
    }

    return [
      {
        id: 'banner_main',
        bgGradient: 'from-[#F6BD27] via-[#F4B218] to-[#E89E0B]',
        title: 'दुकानदारों के लिए सीधे डिपो थोक भाव',
        tagline: 'Best Wholesale Rates • Maximum Retailer Margins',
        badge: 'केवल दुकानदारों के लिए (B2B)',
        offer: 'हर पेटी / कार्टन पर ₹20 से ₹60 तक का सीधा दुकानदार मुनाफा',
        brands: "Lay's • Kurkure • Parle-G • Amul • Sunfeast",
        hideTextOverlay: false,
        showBuyNow: true,
        buyNowText: 'अभी खरीदें (Buy Now)',
        targetBrand: 'Parle',
        targetCategory: 'Biscuits & Bakery',
        posterFit: 'cover'
      },
      {
        id: 'banner_offers',
        bgGradient: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
        title: 'Aryan B2B Retailer Trade Schemes',
        tagline: 'Parle • Britannia • Sunfeast • PepsiCo • Amul',
        badge: 'थोक व्यापार डिस्काउंट',
        offer: 'कार्टन / पेटी बुकिंग पर अतिरिक्त 5% थोक स्कीम मार्जिन',
        brands: 'Special Wholesale Trade Margin on Bulk Booking',
        hideTextOverlay: false,
        showBuyNow: true,
        buyNowText: 'ऑर्डर करें (Order Now)',
        targetBrand: "Lay's",
        targetCategory: 'Snacks & Namkeen'
      },
      {
        id: 'banner_fast',
        bgGradient: 'from-[#0284C7] via-[#0369A1] to-[#075985]',
        title: 'Direct Depot Supply to Your Shop',
        tagline: 'Same-Day / 24-Hour Dispatch directly to your Kirana Counter',
        badge: 'दुकान तक सीधी डिलीवरी',
        offer: '100% Genuine Direct Supply Chain Guarantee with GST Bill',
        brands: 'Depot Fleet • Utraula • Balrampur • Gonda • Tulsipur',
        hideTextOverlay: false,
        showBuyNow: true,
        buyNowText: 'थोक कैटलॉग देखें',
        targetBrand: '',
        targetCategory: ''
      },
      {
        id: 'banner_baby_care',
        bgGradient: 'from-[#0D9488] via-[#0F766E] to-[#115E59]',
        title: 'Baby Care & Personal Hygiene Wholesale',
        tagline: 'Honey Bunny • Dettol • Colgate • Stayfree',
        badge: 'सुपर-स्टॉकिस्ट डिपो',
        offer: 'Buy 5 Cases, Get 1 Case Free on Honey Bunny Diapers',
        brands: 'Super-Stockist Authentic Direct Supply for Retailers',
        hideTextOverlay: false,
        showBuyNow: true,
        buyNowText: 'डायपर ऑर्डर करें',
        targetBrand: 'Honey Bunny',
        targetCategory: 'Personal Care'
      }
    ];
  }, [banners]);

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

  // Handle clicking on banner slide or its Buy Now button
  const handleBannerAction = (slide: typeof bannerSlides[0]) => {
    if (slide.targetBrand) {
      setSelectedBrand(slide.targetBrand);
      setSelectedCategory(null);
      setActiveBrowseMode('brands');
      const el = document.getElementById('b2b-products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (slide.targetCategory) {
      const cat = categories.find(c => 
        c.label.toLowerCase() === slide.targetCategory.toLowerCase() ||
        c.categoryMatch.some(m => m.toLowerCase() === slide.targetCategory.toLowerCase()) ||
        slide.targetCategory.toLowerCase().includes(c.id.toLowerCase())
      );
      if (cat) {
        setSelectedCategory(cat.id);
      } else {
        setSelectedCategory(slide.targetCategory);
      }
      setSelectedBrand(null);
      setActiveBrowseMode('categories');
      const el = document.getElementById('b2b-products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Default: scroll to products section
    const el = document.getElementById('b2b-products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
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

  // Retailer / Salesman action handlers matching ProductsView
  const handleBuyNowProduct = (product: Product, cases: number = 1, packing?: ProductPackingOption) => {
    if (onAddToCart) {
      onAddToCart(product, cases, packing);
    }
    if (onOpenCart) {
      onOpenCart();
    }
  };

  const handleBookProduct = (productId: string) => {
    if (onQuickOrder) {
      onQuickOrder(productId);
    } else {
      onNavigateTab('orders');
    }
  };

  // Cart summary calculations
  const totalCartCount = cartItems.reduce((s, i) => s + i.cases, 0);
  const totalCartAmount = cartItems.reduce((s, i) => {
    const itemPrice = i.selectedPacking ? i.selectedPacking.sellingPrice : (i.product.casePrice || 0);
    return s + (i.cases * itemPrice);
  }, 0);

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
      {/* MOBILE APP LIVE UPDATE & VERSION BAR                                      */}
      {/* ========================================================================= */}
      <div className="w-full bg-gradient-to-r from-blue-900/90 via-slate-900 to-indigo-950 text-white rounded-2xl p-2.5 px-3.5 border border-blue-700/60 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs text-white">Aryan Agency App</span>
              <span className="font-mono text-[10px] font-black bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                {appConfig.version || 'v1.3.2'}
              </span>
            </div>
            <p className="text-[10px] text-blue-200">
              Live Cloud Sync • नया बारकोड स्कैनर व फीचर्स लोड करें
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => performInAppUpdate()}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-[11px] flex items-center space-x-1 shadow-sm active:scale-95 transition-all cursor-pointer"
            title="नया वर्शन तुरंत लोड करें और कैश साफ़ करें"
          >
            <RefreshCw className="w-3 h-3 text-slate-950" />
            <span>नया वर्जन लोड करें</span>
          </button>
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
          onClick={() => handleBannerAction(bannerSlides[currentBanner])}
          className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg border border-slate-200/40 dark:border-slate-800/40 ${
            bannerSlides[currentBanner].imageUrl ? 'bg-[#08172E]' : `bg-gradient-to-r ${bannerSlides[currentBanner].bgGradient}`
          } text-white transition-all duration-700 aspect-[16/5.5] sm:aspect-[16/5] flex items-center justify-center cursor-pointer group select-none`}
        >
          {/* Subtle background decorative shapes when no custom image */}
          {!bannerSlides[currentBanner].imageUrl && (
            <>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
            </>
          )}
          
          {/* 100% UN-CROPPED, FULLY CONTAINED BANNER IMAGE (NO ZOOM, NO CROP, COMPLETE VISIBILITY) */}
          {bannerSlides[currentBanner].imageUrl && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center bg-[#07172B]">
              {/* Soft ambient background aura so sides blend seamlessly with zero awkward voids */}
              <img 
                src={bannerSlides[currentBanner].imageUrl} 
                alt="" 
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-105 pointer-events-none select-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#07172B]/35 pointer-events-none" />

              {/* Contained image: complete banner visible top, bottom, left and right */}
              <img 
                src={bannerSlides[currentBanner].imageUrl} 
                alt={bannerSlides[currentBanner].title} 
                className="relative z-10 w-full h-full object-contain object-center scale-100 transition-transform duration-700 group-hover:scale-[1.01] pointer-events-none select-none"
                referrerPolicy="no-referrer"
              />

              {/* If text overlay is NOT hidden, show subtle gradient scrim so text is readable */}
              {!bannerSlides[currentBanner].hideTextOverlay && (
                <div className="absolute inset-0 z-[2] pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                </div>
              )}
            </div>
          )}
          
          {/* MAIN CONTENT AREA: DISPLAY TEXT ONLY IF NOT hideTextOverlay */}
          {!bannerSlides[currentBanner].hideTextOverlay ? (
            <div className="relative z-10 w-full h-full p-3 sm:p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 sm:gap-3 pointer-events-none">
              
              {/* Left Content */}
              <div className="w-full md:w-3/5 space-y-1.5 sm:space-y-2 text-left pointer-events-auto">
                {/* Aryan Agency Mini Branding */}
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/95 p-1 flex items-center justify-center shadow-xs">
                    <AryanAgencyFMCGLogo size="sm" theme="light" showSubline={false} />
                  </div>
                  <div>
                    <h3 className="text-[10px] sm:text-xs font-black tracking-wider text-amber-400 uppercase leading-none drop-shadow-xs">
                      ARYAN AGENCY
                    </h3>
                    <span className="text-[8px] sm:text-[9px] font-bold text-white/90 tracking-tight uppercase">
                      B2B FMCG Distribution
                    </span>
                  </div>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs">
                    {bannerSlides[currentBanner].badge}
                  </span>
                </div>

                {/* Banner Title - Bold Clear Typography */}
                <h2 className="text-sm sm:text-lg md:text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md line-clamp-2">
                  {bannerSlides[currentBanner].title}
                </h2>

                {/* Tagline Pill */}
                <div className="inline-flex items-center px-2.5 py-0.5 sm:py-1 rounded-full bg-black/40 backdrop-blur-xs border border-white/20 text-white text-[9px] sm:text-xs font-bold tracking-tight shadow-sm">
                  <span>{bannerSlides[currentBanner].tagline}</span>
                </div>

                {/* Offer Text */}
                <p className="text-[10px] sm:text-xs font-bold text-amber-300 drop-shadow-xs">
                  {bannerSlides[currentBanner].offer}
                </p>

                {/* Buy Now Button if enabled */}
                {bannerSlides[currentBanner].showBuyNow !== false && (
                  <div className="pt-0.5 sm:pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBannerAction(bannerSlides[currentBanner]);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer border border-amber-300"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{bannerSlides[currentBanner].buyNowText || 'अभी खरीदें (Buy Now)'}</span>
                      <ArrowRight className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Visual Products Info */}
              <div className="w-full md:w-2/5 flex items-center justify-between sm:justify-end space-x-3 pointer-events-auto">
                <div className="flex flex-col space-y-1 text-left sm:text-right text-[9px] sm:text-[11px] font-bold text-white/90">
                  <span className="bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/15 drop-shadow-xs">
                    ✓ {bannerSlides[currentBanner].brands}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-amber-200 drop-shadow-xs">
                    ISO 9001:2015 GST Verified Wholesale
                  </span>
                </div>

                {/* Verified seal on non-image banners */}
                {!bannerSlides[currentBanner].imageUrl && (
                  <div className="relative shrink-0 w-16 h-16 sm:w-22 sm:h-22 rounded-full bg-[#0A1E3F] text-white p-2 flex flex-col items-center justify-center text-center shadow-xl border-2 border-white/20 transform hover:scale-105 transition-transform">
                    <span className="text-[8px] sm:text-[10px] font-black tracking-wider uppercase text-amber-400">
                      B2B
                    </span>
                    <span className="text-[10px] sm:text-xs font-black tracking-tight text-white uppercase">
                      RETAILER
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase text-emerald-400">
                      WHOLESALE
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* PURE PHOTO / POSTER MODE: NO TEXT OVERLAY */
            <div className="relative z-10 w-full flex flex-col justify-between h-full">
              {/* Subtle top indicator if brand/category is targeted */}
              <div className="flex items-center justify-between">
                {bannerSlides[currentBanner].targetBrand || bannerSlides[currentBanner].targetCategory ? (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-[11px] sm:text-xs font-black border border-white/20 shadow-md">
                    <span>🏷️ {bannerSlides[currentBanner].targetBrand ? `Brand: ${bannerSlides[currentBanner].targetBrand}` : `Category: ${bannerSlides[currentBanner].targetCategory}`}</span>
                  </span>
                ) : <div />}
              </div>

              {/* Bottom Buy Now Action Button */}
              {bannerSlides[currentBanner].showBuyNow !== false && (
                <div className="mt-auto pt-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBannerAction(bannerSlides[currentBanner]);
                    }}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-2xl active:scale-95 transition-all cursor-pointer border-2 border-amber-300"
                  >
                    <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                    <span>{bannerSlides[currentBanner].buyNowText || 'अभी खरीदें (Buy Now)'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Left / Right Arrow Controls */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentBanner(prev => (prev - 1 + bannerSlides.length) % bannerSlides.length);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-opacity z-20 cursor-pointer shadow-md"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentBanner(prev => (prev + 1) % bannerSlides.length);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-opacity z-20 cursor-pointer shadow-md"
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
          /* Professional Animated Delivery Route Banner */
          <AnimatedDeliveryRouteBanner onTrackOrders={() => onNavigateTab('orders')} />
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
      <section id="b2b-products-section" className="w-full">
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

          <div className="flex items-center space-x-2">
            {onOpenBarcodeScanner && (
              <button
                type="button"
                onClick={onOpenBarcodeScanner}
                className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                title="बारकोड स्कैन करके तुरंत प्रोडक्ट खोजें"
              >
                <ScanLine className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>स्कैन</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer group"
            >
              <span>View All ({products.length})</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Product Cards Grid with B2BProductCard */}
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3.5 lg:gap-4">
            {filteredProducts.map((product) => {
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
                  isAdmin={isAdmin}
                  inCartCount={inCartCases}
                  onUpdateCartItem={onUpdateCartItem}
                  onOpenPackSelector={(p) => setPackSelectorProduct(p)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Mobile Cart Bar (When Cart has items) */}
      {totalCartCount > 0 && onOpenCart && (
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
                  {totalCartCount} Case{totalCartCount > 1 ? 's' : ''} in Cart
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

      {/* ========================================================================= */}
      {/* MOBILE FOOTER & APP UPDATE STATUS CARD                                     */}
      {/* ========================================================================= */}
      <div className="w-full text-center pt-5 pb-3 space-y-2 border-t border-slate-200 dark:border-slate-800 text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => triggerManualUpdateCheck()}
            className="text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check App Updates (नया वर्शन चेक करें)</span>
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={() => triggerApkDownload()}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download APK ({appConfig.version || 'v1.3.2'})</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          Aryan Agency FMCG Distribution Suite • Android App {appConfig.version || 'v1.3.2'}
        </p>
      </div>

    </div>
  );
};
