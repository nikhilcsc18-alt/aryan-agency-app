import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Tag, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Settings, 
  X, 
  Check, 
  Trash2,
  Percent,
  Gift
} from 'lucide-react';
import { PromotionalBanner } from '../types';

interface PromotionalBannerCarouselProps {
  onSelectCategory?: (category: string) => void;
  onSelectBrand?: (brand: string) => void;
  isAdmin?: boolean;
}

const DEFAULT_BANNERS: PromotionalBanner[] = [
  {
    id: 'ban_1',
    title: 'Aryan Mega B2B FMCG Utsav',
    subtitle: 'Extra 5% Wholesale Margin on Parle, Britannia & Sunfeast Bulk Bookings above ₹25,000',
    badgeText: '🔥 BEST OFFER',
    ctaText: 'Explore Biscuits',
    targetCategory: 'Biscuits & Bakery',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1000&auto=format&fit=crop',
    bgGradient: 'from-blue-900 via-indigo-900 to-slate-900',
    accentColor: 'amber-400',
    isActive: true
  },
  {
    id: 'ban_2',
    title: 'Trade Scheme: Buy 5 Cases, Get 2 Free',
    subtitle: 'Exclusive Kirana & Supermarket Scheme on Confectionery, Chocolates & Packaged Goodies',
    badgeText: '🔥 5 + 2 FREE',
    ctaText: 'Claim Free Cases',
    targetCategory: 'Confectionery & Chocolates',
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=1000&auto=format&fit=crop',
    bgGradient: 'from-amber-900 via-orange-950 to-slate-950',
    accentColor: 'amber-300',
    isActive: true
  },
  {
    id: 'ban_3',
    title: 'Beverages & Soft Drinks Depot Stock',
    subtitle: 'Guaranteed 24-Hour Dispatch across all City Beats • Flat ₹40 Off/Case on Juices & Colas',
    badgeText: '10% OFF',
    ctaText: 'View Beverages',
    targetCategory: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=1000&auto=format&fit=crop',
    bgGradient: 'from-cyan-950 via-blue-950 to-slate-950',
    accentColor: 'cyan-400',
    isActive: true
  },
  {
    id: 'ban_4',
    title: 'Snacks & Namkeen Fresh Inward Depot Arrival',
    subtitle: 'Direct Depot Pricing with 100% Guaranteed Fresh Batch Mfg Dates & Full Return Assurance',
    badgeText: 'NEW',
    ctaText: 'Order Namkeen',
    targetCategory: 'Snacks & Namkeen',
    imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=1000&auto=format&fit=crop',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-950',
    accentColor: 'emerald-400',
    isActive: true
  }
];

const LOCAL_STORAGE_KEY = 'aryan_agency_promotional_banners_v1';

export const PromotionalBannerCarousel: React.FC<PromotionalBannerCarouselProps> = ({
  onSelectCategory,
  onSelectBrand,
  isAdmin = false
}) => {
  const [banners, setBanners] = useState<PromotionalBanner[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved banners:', e);
    }
    return DEFAULT_BANNERS;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<PromotionalBanner> | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const activeBanners = banners.filter(b => b.isActive);
  const totalBanners = activeBanners.length;

  // Auto slide every 5 seconds unless paused or modal is open
  useEffect(() => {
    if (totalBanners <= 1 || isPaused || isManageModalOpen) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % totalBanners);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalBanners, isPaused, isManageModalOpen]);

  // Keep index within bounds if banners change
  useEffect(() => {
    if (currentIndex >= totalBanners && totalBanners > 0) {
      setCurrentIndex(0);
    }
  }, [totalBanners, currentIndex]);

  const saveBannersToStorage = (updated: PromotionalBanner[]) => {
    setBanners(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist banners:', e);
    }
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? totalBanners - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % totalBanners);
  };

  // Touch Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (totalBanners === 0) return null;

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200/80 group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Banner Canvas Container */}
      <div 
        onClick={() => {
          if (currentBanner.targetBrand && onSelectBrand) {
            onSelectBrand(currentBanner.targetBrand);
          } else if (currentBanner.targetCategory && onSelectCategory) {
            onSelectCategory(currentBanner.targetCategory);
          }
        }}
        className={`relative w-full aspect-[2/1] sm:aspect-[2.4/1] md:aspect-[2.8/1] lg:aspect-[3.2/1] min-h-[185px] sm:min-h-[220px] md:min-h-[250px] max-h-[380px] bg-slate-950 flex items-center transition-all duration-500 overflow-hidden ${
          (currentBanner.targetBrand || currentBanner.targetCategory) ? 'cursor-pointer' : ''
        }`}
      >
        
        {/* Full-bleed background banner image covering the entire container (Zero blank sides) */}
        {currentBanner.imageUrl && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              referrerPolicy="no-referrer"
              className={`w-full h-full ${
                currentBanner.posterFit === 'fill'
                  ? 'object-fill'
                  : 'object-cover object-center'
              } opacity-100 scale-100 transition-transform duration-700 hover:scale-[1.02]`}
            />

            {/* If text overlay is NOT hidden, show gradient scrim so text is readable */}
            {!currentBanner.hideTextOverlay && (
              <div className="absolute inset-0 z-[2]">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-slate-950/20" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
              </div>
            )}
          </div>
        )}

        {/* Content Box */}
        {!currentBanner.hideTextOverlay ? (
          <div className="relative z-10 w-full px-5 sm:px-8 py-5 md:py-6 flex flex-col justify-between max-w-2xl text-white">
            
            {/* Offer Badge Header */}
            <div className="flex items-center space-x-2 mb-2 sm:mb-2.5">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs sm:text-xs font-black tracking-wide bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 uppercase animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-slate-950 text-slate-950 shrink-0" />
                <span>{currentBanner.badgeText}</span>
              </span>

              <span className="text-[11px] sm:text-xs font-semibold text-slate-300 flex items-center space-x-1 bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Aryan FMCG Super Wholesale</span>
              </span>
            </div>

            {/* Main Title */}
            <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm line-clamp-2">
              {currentBanner.title}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-200 mt-1.5 sm:mt-2 line-clamp-2 max-w-xl leading-relaxed text-balance">
              {currentBanner.subtitle}
            </p>

            {/* Action CTA & Quick Info */}
            <div className="mt-3.5 sm:mt-4 flex items-center flex-wrap gap-2.5">
              {currentBanner.showBuyNow !== false && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentBanner.targetBrand && onSelectBrand) {
                      onSelectBrand(currentBanner.targetBrand);
                    } else if (currentBanner.targetCategory && onSelectCategory) {
                      onSelectCategory(currentBanner.targetCategory);
                    }
                  }}
                  className="px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <span>{currentBanner.buyNowText || currentBanner.ctaText || 'अभी खरीदें (Buy Now)'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}

              <div className="hidden sm:flex items-center space-x-1 text-[11px] font-medium text-slate-300 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5">
                <Percent className="w-3 h-3 text-emerald-400" />
                <span>Maximum Retailer Margin Guaranteed</span>
              </div>
            </div>
          </div>
        ) : (
          /* PURE PHOTO MODE */
          <div className="relative z-10 w-full px-4 sm:px-6 py-3 sm:py-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              {currentBanner.targetBrand || currentBanner.targetCategory ? (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-black border border-white/20 shadow-md">
                  <span>🏷️ {currentBanner.targetBrand ? `Brand: ${currentBanner.targetBrand}` : `Category: ${currentBanner.targetCategory}`}</span>
                </span>
              ) : <div />}
            </div>

            {currentBanner.showBuyNow !== false && (
              <div className="mt-auto flex items-center justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentBanner.targetBrand && onSelectBrand) {
                      onSelectBrand(currentBanner.targetBrand);
                    } else if (currentBanner.targetCategory && onSelectCategory) {
                      onSelectCategory(currentBanner.targetCategory);
                    }
                  }}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-2xl active:scale-95 transition-all cursor-pointer border-2 border-amber-300"
                >
                  <span>{currentBanner.buyNowText || 'अभी खरीदें (Buy Now)'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Right side floating FMCG decorative badge (desktop) - only if text overlay is visible */}
        {!currentBanner.hideTextOverlay && (
          <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 flex-col items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl text-center max-w-[170px] transform hover:rotate-1 transition-transform">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg mb-2">
              <Gift className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-amber-300 uppercase tracking-wide">Depot Delivery</span>
            <span className="text-[11px] text-white/90 leading-tight mt-0.5">Order before 5 PM for next-morning beat delivery</span>
          </div>
        )}

      </div>

      {/* Manual Swipe / Carousel Arrows (visible on hover and touch) */}
      {totalBanners > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Offer"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all cursor-pointer border border-white/20 shadow-md active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Offer"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all cursor-pointer border border-white/20 shadow-md active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator & Admin Manage Trigger */}
      <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center space-x-1.5 pointer-events-none">
        <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 pointer-events-auto shadow-xs">
          {activeBanners.map((banner, idx) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? 'w-6 h-2 bg-amber-400 shadow-sm shadow-amber-400/50'
                  : 'w-2 h-2 bg-white/50 hover:bg-white'
              }`}
            />
          ))}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              title="Manage B2B Promotional Banners (Admin)"
              className="ml-2 pl-1.5 border-l border-white/20 text-white/70 hover:text-amber-300 text-[10px] font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span className="hidden sm:inline">Posters</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Banner Management Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Manage B2B Offer Banners & Posters</span>
                </h3>
                <p className="text-xs text-slate-500">Configure promotional slides, offer badges & scheme announcements</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageModalOpen(false);
                  setEditingBanner(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of existing banners */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {banners.map((ban, i) => (
                <div 
                  key={ban.id} 
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    ban.isActive ? 'bg-slate-50 border-slate-200' : 'bg-slate-100/60 border-dashed border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img 
                      src={ban.imageUrl} 
                      alt="" 
                      className="w-12 h-10 rounded-lg object-cover border shrink-0 bg-slate-200" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 truncate">{ban.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 shrink-0">
                          {ban.badgeText}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{ban.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = banners.map(b => b.id === ban.id ? { ...b, isActive: !b.isActive } : b);
                        saveBannersToStorage(updated);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-semibold ${
                        ban.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ban.isActive ? 'Active' : 'Hidden'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingBanner({ ...ban })}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50"
                      title="Edit"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>

                    {banners.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = banners.filter(b => b.id !== ban.id);
                          saveBannersToStorage(updated);
                        }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Edit / Add form */}
            {editingBanner ? (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5 text-xs">
                <div className="font-bold text-blue-950 flex items-center justify-between">
                  <span>{editingBanner.id ? 'Edit Banner' : 'New Promotional Banner'}</span>
                  <button 
                    type="button" 
                    onClick={() => setEditingBanner(null)}
                    className="text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Banner Headline</label>
                    <input
                      type="text"
                      value={editingBanner.title || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      placeholder="e.g. Mega FMCG Offer"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Offer Badge</label>
                    <input
                      type="text"
                      value={editingBanner.badgeText || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, badgeText: e.target.value })}
                      placeholder="e.g. 🔥 5 + 2 FREE, 10% OFF"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Subtitle / Scheme Terms</label>
                  <input
                    type="text"
                    value={editingBanner.subtitle || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                    placeholder="Details about discount or free cases"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Image URL</label>
                    <input
                      type="text"
                      value={editingBanner.imageUrl || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Target Category Filter</label>
                    <select
                      value={editingBanner.targetCategory || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, targetCategory: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">None (General)</option>
                      <option value="Biscuits & Bakery">Biscuits & Bakery</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Snacks & Namkeen">Snacks & Namkeen</option>
                      <option value="Confectionery & Chocolates">Confectionery & Chocolates</option>
                      <option value="Spices & Staples">Spices & Staples</option>
                      <option value="Personal Care">Personal Care</option>
                      <option value="Dairy & Refrigerated">Dairy & Refrigerated</option>
                      <option value="Household & Hygiene">Household & Hygiene</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingBanner.title) return;
                      if (editingBanner.id) {
                        const updated = banners.map(b => b.id === editingBanner.id ? (editingBanner as PromotionalBanner) : b);
                        saveBannersToStorage(updated);
                      } else {
                        const newBanner: PromotionalBanner = {
                          id: `ban_${Date.now()}`,
                          title: editingBanner.title || 'New Offer',
                          subtitle: editingBanner.subtitle || '',
                          badgeText: editingBanner.badgeText || 'HOT OFFER',
                          ctaText: 'View Deals',
                          targetCategory: editingBanner.targetCategory || 'Biscuits & Bakery',
                          imageUrl: editingBanner.imageUrl || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1000',
                          bgGradient: 'from-blue-900 via-indigo-900 to-slate-900',
                          isActive: true
                        };
                        saveBannersToStorage([...banners, newBanner]);
                      }
                      setEditingBanner(null);
                    }}
                    className="px-3 py-1.5 bg-[#2563eb] text-white rounded-lg font-bold flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Banner</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBanner({
                      title: '',
                      subtitle: '',
                      badgeText: '🔥 BEST OFFER',
                      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1000',
                      targetCategory: 'Biscuits & Bakery',
                      isActive: true
                    });
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Poster</span>
                </button>

                <button
                  type="button"
                  onClick={() => saveBannersToStorage(DEFAULT_BANNERS)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Reset to Aryan FMCG Defaults
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
