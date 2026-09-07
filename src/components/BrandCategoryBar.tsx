import React, { useRef } from 'react';
import { 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Layers,
  Check
} from 'lucide-react';
import { Product } from '../types';

interface BrandCategoryBarProps {
  products: Product[];
  selectedBrand: string;
  onSelectBrand: (brand: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

// Visual style map for top Indian FMCG brands
const BRAND_METADATA: Record<string, { bg: string; text: string; border: string; accent: string; initial: string }> = {
  'Parle': {
    bg: 'bg-red-50 hover:bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    accent: 'bg-red-600 text-white',
    initial: 'P'
  },
  'Britannia': {
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    accent: 'bg-amber-600 text-white',
    initial: 'B'
  },
  'ITC Sunfeast': {
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    accent: 'bg-blue-600 text-white',
    initial: 'ITC'
  },
  'ITC': {
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    accent: 'bg-blue-600 text-white',
    initial: 'ITC'
  },
  'Cadbury': {
    bg: 'bg-purple-50 hover:bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    accent: 'bg-purple-700 text-white',
    initial: 'C'
  },
  'Tata Tea': {
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    accent: 'bg-emerald-700 text-white',
    initial: 'TATA'
  },
  'Tata': {
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    accent: 'bg-emerald-700 text-white',
    initial: 'TATA'
  },
  'Nestlé': {
    bg: 'bg-sky-50 hover:bg-sky-100',
    text: 'text-sky-800',
    border: 'border-sky-200',
    accent: 'bg-sky-600 text-white',
    initial: 'N'
  },
  'Amul': {
    bg: 'bg-rose-50 hover:bg-rose-100',
    text: 'text-rose-800',
    border: 'border-rose-200',
    accent: 'bg-rose-600 text-white',
    initial: 'AMUL'
  },
  'Everest': {
    bg: 'bg-orange-50 hover:bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    accent: 'bg-orange-600 text-white',
    initial: 'E'
  },
  'Haldiram\'s': {
    bg: 'bg-yellow-50 hover:bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    accent: 'bg-yellow-600 text-white',
    initial: 'H'
  },
  'Dabur': {
    bg: 'bg-green-50 hover:bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    accent: 'bg-green-700 text-white',
    initial: 'D'
  },
  'Fortune': {
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-200',
    accent: 'bg-amber-600 text-white',
    initial: 'F'
  }
};

const getBrandMeta = (brandName: string) => {
  return BRAND_METADATA[brandName] || {
    bg: 'bg-slate-50 hover:bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
    accent: 'bg-[#1e293b] text-white',
    initial: brandName.slice(0, 2).toUpperCase()
  };
};

export const BrandCategoryBar: React.FC<BrandCategoryBarProps> = ({
  products,
  selectedBrand,
  onSelectBrand
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Extract unique brands with their product counts
  const brandCounts = products.reduce((acc, p) => {
    acc[p.brand] = (acc[p.brand] || 0) + 1;
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

      {/* Horizontal Scrollable Circular/Square Brand Icons */}
      <div 
        ref={scrollContainerRef}
        className="flex items-center space-x-2.5 sm:space-x-3 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth"
      >
        {/* 'All Brands' Card */}
        <button
          type="button"
          onClick={() => onSelectBrand('all')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 min-w-[76px] sm:min-w-[84px] group ${
            selectedBrand === 'all'
              ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-sm ring-2 ring-blue-500/30'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-white'
          }`}
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105 shadow-xs ${
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

        {/* Individual Brand Icons */}
        {brands.map(brand => {
          const isSelected = selectedBrand === brand;
          const meta = getBrandMeta(brand);
          const count = brandCounts[brand] || 0;

          return (
            <button
              key={brand}
              type="button"
              onClick={() => onSelectBrand(isSelected ? 'all' : brand)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 min-w-[76px] sm:min-w-[84px] group relative ${
                isSelected
                  ? 'bg-blue-50/80 border-[#2563eb] shadow-sm ring-2 ring-[#2563eb]/25'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#2563eb] text-white rounded-full flex items-center justify-center shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}

              {/* Circular/Square Brand Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-xs transition-transform group-hover:scale-105 shadow-xs border ${meta.border} ${meta.accent}`}>
                <span className="tracking-tight text-[11px]">
                  {meta.initial}
                </span>
              </div>

              {/* Brand Name */}
              <span className={`text-[11px] font-bold mt-1.5 whitespace-nowrap max-w-[76px] truncate ${
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
    </div>
  );
};
