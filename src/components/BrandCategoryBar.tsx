import React, { useRef, useState, useEffect } from 'react';
import { 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Check,
  Settings2,
  X,
  Upload,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { Product } from '../types';
import { BrandLogo, FMCG_BRANDS_INFO } from './BrandLogos';
import { compressImageFile } from '../lib/fmcgPresets';

interface BrandCategoryBarProps {
  products: Product[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const BRAND_LOGOS_STORAGE_KEY = 'aryan_agency_custom_brand_logos';

export const BrandCategoryBar: React.FC<BrandCategoryBarProps> = ({
  products,
  selectedBrand,
  onSelectBrand
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLogoManager, setShowLogoManager] = useState(false);
  const [customLogos, setCustomLogos] = useState<Record<string, string>>({});
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [tempLogoUrl, setTempLogoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Load custom logos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BRAND_LOGOS_STORAGE_KEY);
      if (saved) {
        setCustomLogos(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load custom brand logos from storage', e);
    }
  }, []);

  const saveCustomLogos = (updated: Record<string, string>) => {
    setCustomLogos(updated);
    try {
      localStorage.setItem(BRAND_LOGOS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist custom brand logos', e);
    }
  };

  // Extract unique brands with their product counts
  const brandCounts = products.reduce((acc, p) => {
    if (!p.brand) return acc;
    const b = p.brand.trim();
    acc[b] = (acc[b] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const brands = Object.keys(brandCounts).sort();

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 260;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSetLogo = (brand: string, url: string) => {
    const updated = { ...customLogos };
    if (url.trim()) {
      updated[brand] = url.trim();
    } else {
      delete updated[brand];
    }
    saveCustomLogos(updated);
    setEditingBrand(null);
    setTempLogoUrl('');
  };

  const handleResetLogo = (brand: string) => {
    const updated = { ...customLogos };
    delete updated[brand];
    saveCustomLogos(updated);
    if (editingBrand === brand) {
      setTempLogoUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, brand: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const dataUrl = await compressImageFile(file, 400, 0.9);
      handleSetLogo(brand, dataUrl);
    } catch (err) {
      console.error('Failed to compress logo file', err);
      alert('Could not read the selected image file. Please try another image.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-2.5">
      {/* Top Title & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#2563eb] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            Featured FMCG Brands
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            ({brands.length} Authorized Brands)
          </span>

          <button
            type="button"
            onClick={() => setShowLogoManager(true)}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer ml-1.5"
            title="Manage or customize brand original logos"
          >
            <Settings2 className="w-3 h-3 text-slate-500" />
            <span>Brand Logos</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          {selectedBrand !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectBrand('all')}
              className="text-[11px] font-bold text-[#2563eb] hover:underline cursor-pointer mr-1"
            >
              Clear Filter
            </button>
          )}

          {/* Desktop Left/Right Scroll Arrows */}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="hidden sm:flex w-7 h-7 rounded-lg border border-slate-200 items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="hidden sm:flex w-7 h-7 rounded-lg border border-slate-200 items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Brand Cards with Original Logos */}
      <div 
        ref={scrollContainerRef}
        className="flex items-center space-x-2.5 sm:space-x-3 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth"
      >
        {/* 'All Brands' Card */}
        <button
          type="button"
          onClick={() => onSelectBrand('all')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 min-w-[76px] sm:min-w-[86px] group ${
            selectedBrand === 'all'
              ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-sm ring-2 ring-blue-500/30'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-white'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105 shadow-xs ${
            selectedBrand === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-[11px] font-bold mt-1.5 whitespace-nowrap">
            All Brands
          </span>
          <span className={`text-[9px] font-semibold ${
            selectedBrand === 'all' ? 'text-slate-300' : 'text-slate-400'
          }`}>
            {products.length} SKUs
          </span>
        </button>

        {/* Individual Brand Cards with Authentic Original Logos */}
        {brands.map(brand => {
          const isSelected = selectedBrand === brand;
          const count = brandCounts[brand] || 0;
          const customUrl = customLogos[brand];

          return (
            <button
              key={brand}
              type="button"
              onClick={() => onSelectBrand(isSelected ? 'all' : brand)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer shrink-0 min-w-[80px] sm:min-w-[90px] group relative ${
                isSelected
                  ? 'bg-blue-50/80 border-[#2563eb] shadow-sm ring-2 ring-[#2563eb]/25'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#2563eb] text-white rounded-full flex items-center justify-center shadow-xs z-10">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}

              {/* Authentic Brand Original Logo Badge */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center p-1 bg-white border border-slate-200/80 transition-transform group-hover:scale-105 shadow-xs overflow-hidden">
                <BrandLogo 
                  brand={brand} 
                  customLogoUrl={customUrl} 
                  size="md" 
                />
              </div>

              {/* Brand Name */}
              <span className={`text-[11px] font-bold mt-1.5 whitespace-nowrap max-w-[80px] truncate ${
                isSelected ? 'text-[#2563eb]' : 'text-slate-800'
              }`}>
                {brand}
              </span>

              {/* SKU Count */}
              <span className="text-[9px] font-medium text-slate-400">
                {count} {count === 1 ? 'SKU' : 'SKUs'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Brand Logos Customization Modal */}
      {showLogoManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Brand Original Logos</h3>
                  <p className="text-xs text-slate-500">Official vector logos and custom image URLs for FMCG brands</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLogoManager(false);
                  setEditingBrand(null);
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
                All top brands (Parle, Britannia, Amul, Nestlé, Tata, Cadbury, etc.) include built-in authentic official vector logos. You can also paste an image URL or upload any custom logo image below.
              </div>

              <div className="space-y-2">
                {brands.map(b => {
                  const customUrl = customLogos[b];
                  const isEditing = editingBrand === b;

                  return (
                    <div 
                      key={b} 
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                          <BrandLogo brand={b} customLogoUrl={customUrl} size="sm" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                            <span>{b}</span>
                            {customUrl ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-700">Custom Image</span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 text-blue-700">Official Vector</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {brandCounts[b]} products in catalog
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {customUrl && (
                          <button
                            type="button"
                            onClick={() => handleResetLogo(b)}
                            className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Reset to official vector logo"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEditingBrand(isEditing ? null : b);
                            setTempLogoUrl(customUrl || '');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                        >
                          {isEditing ? 'Cancel' : 'Change'}
                        </button>
                      </div>

                      {/* Expanded Edit Form for this Brand */}
                      {isEditing && (
                        <div className="w-full mt-3 pt-3 border-t border-slate-200 col-span-2 space-y-2">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Image URL or Upload for {b}:
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={tempLogoUrl}
                              onChange={(e) => setTempLogoUrl(e.target.value)}
                              placeholder="https://.../logo.png"
                              className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetLogo(b, tempLogoUrl)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Save URL
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <label className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                              <Upload className="w-3 h-3 text-slate-500" />
                              <span>{isUploading ? 'Uploading...' : 'Upload Image File'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, b)}
                                className="hidden"
                              />
                            </label>
                            {customUrl && (
                              <button
                                type="button"
                                onClick={() => handleResetLogo(b)}
                                className="text-xs text-rose-600 hover:underline"
                              >
                                Revert to Official Vector Logo
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowLogoManager(false);
                  setEditingBrand(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
