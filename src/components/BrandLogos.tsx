import React, { useState } from 'react';

export interface BrandLogoInfo {
  name: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor: string;
  bgClass: string;
  borderClass: string;
  defaultLogoUrl?: string;
}

export const FMCG_BRANDS_INFO: Record<string, BrandLogoInfo> = {
  'Parle': {
    name: 'Parle',
    tagline: 'G maane Genius',
    primaryColor: '#D32F2F',
    secondaryColor: '#FFD54F',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200'
  },
  'Britannia': {
    name: 'Britannia',
    tagline: 'Eat Healthy, Think Better',
    primaryColor: '#C62828',
    secondaryColor: '#2E7D32',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  'Amul': {
    name: 'Amul',
    tagline: 'The Taste of India',
    primaryColor: '#D32F2F',
    secondaryColor: '#1A237E',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200'
  },
  'Nestlé': {
    name: 'Nestlé',
    tagline: 'Good food, Good life',
    primaryColor: '#0277BD',
    secondaryColor: '#4FC3F7',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200'
  },
  'Nestle': {
    name: 'Nestlé',
    tagline: 'Good food, Good life',
    primaryColor: '#0277BD',
    secondaryColor: '#4FC3F7',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200'
  },
  'Tata': {
    name: 'Tata',
    tagline: 'Leadership with Trust',
    primaryColor: '#005691',
    secondaryColor: '#42A5F5',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200'
  },
  'Tata Tea': {
    name: 'Tata Tea',
    tagline: 'Jaago Re',
    primaryColor: '#1B5E20',
    secondaryColor: '#FFB300',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  },
  'Cadbury': {
    name: 'Cadbury',
    tagline: 'Kuch Meetha Ho Jaaye',
    primaryColor: '#381460',
    secondaryColor: '#FFD54F',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200'
  },
  'Hindustan Unilever': {
    name: 'Hindustan Unilever',
    tagline: 'Making sustainable living commonplace',
    primaryColor: '#1F36C7',
    secondaryColor: '#00B0FF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200'
  },
  'HUL': {
    name: 'HUL',
    tagline: 'Hindustan Unilever Limited',
    primaryColor: '#1F36C7',
    secondaryColor: '#00B0FF',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200'
  },
  'Colgate': {
    name: 'Colgate',
    tagline: 'Smile Karo Aur Shuru Ho Jao',
    primaryColor: '#D32F2F',
    secondaryColor: '#FFFFFF',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200'
  },
  'Lay\'s': {
    name: 'Lay\'s',
    tagline: 'No One Can Eat Just One',
    primaryColor: '#FBC02D',
    secondaryColor: '#D32F2F',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200'
  },
  'Lays': {
    name: 'Lay\'s',
    tagline: 'No One Can Eat Just One',
    primaryColor: '#FBC02D',
    secondaryColor: '#D32F2F',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200'
  },
  'ITC': {
    name: 'ITC',
    tagline: 'Enduring Value',
    primaryColor: '#0D47A1',
    secondaryColor: '#FFC107',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200'
  },
  'Aashirvaad': {
    name: 'Aashirvaad',
    tagline: 'Shudhata Ka Vishwas',
    primaryColor: '#B71C1C',
    secondaryColor: '#FFB300',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  'Sunfeast': {
    name: 'Sunfeast',
    tagline: 'Spread the Smile',
    primaryColor: '#E65100',
    secondaryColor: '#FFD54F',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200'
  },
  'Dettol': {
    name: 'Dettol',
    tagline: 'Be 100% Sure',
    primaryColor: '#1B5E20',
    secondaryColor: '#4CAF50',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  },
  'Haldiram\'s': {
    name: 'Haldiram\'s',
    tagline: 'Taste of Tradition',
    primaryColor: '#B71C1C',
    secondaryColor: '#FFC107',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200'
  },
  'Fortune': {
    name: 'Fortune',
    tagline: 'Ghar Ka Khana, Ghar Ka Pyaar',
    primaryColor: '#2E7D32',
    secondaryColor: '#FFD600',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200'
  },
  'Dabur': {
    name: 'Dabur',
    tagline: 'Celebrate Life',
    primaryColor: '#2E7D32',
    secondaryColor: '#81C784',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  },
  'Everest': {
    name: 'Everest',
    tagline: 'Taste Mein Best, Mummy Aur Everest',
    primaryColor: '#C62828',
    secondaryColor: '#FF8A80',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200'
  },
  'Surf Excel': {
    name: 'Surf Excel',
    tagline: 'Daag Acche Hain',
    primaryColor: '#1565C0',
    secondaryColor: '#E91E63',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200'
  }
};

interface BrandLogoProps {
  brand: string;
  customLogoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallbackOnFail?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  customLogoUrl,
  size = 'md',
  className = '',
  showFallbackOnFail = true
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  const cleanBrand = brand.trim();
  const meta: BrandLogoInfo = FMCG_BRANDS_INFO[cleanBrand] || {
    name: cleanBrand,
    tagline: 'Quality FMCG',
    primaryColor: '#1E293B',
    secondaryColor: '#64748B',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200'
  };

  const sizePixels = {
    sm: 28,
    md: 40,
    lg: 52,
    xl: 68
  }[size];

  // If a custom logo URL is specified and hasn't failed, render the image
  if (customLogoUrl && !imageFailed) {
    return (
      <div 
        className={`flex items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-200 ${className}`}
        style={{ width: sizePixels, height: sizePixels }}
      >
        <img
          src={customLogoUrl}
          alt={`${cleanBrand} logo`}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  // Render high-fidelity SVG brand vectors
  const renderBrandSvg = () => {
    switch (cleanBrand.toLowerCase()) {
      case 'parle':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            {/* Parle Red Lozenge with Gold Edge */}
            <rect x="6" y="16" width="88" height="68" rx="34" fill="#D32F2F" stroke="#FFD54F" strokeWidth="4" />
            <ellipse cx="50" cy="50" rx="40" ry="28" fill="#C62828" />
            {/* Wheat stalks styling */}
            <path d="M16 50 C18 42, 24 38, 30 50 C24 62, 18 58, 16 50 Z" fill="#FFD54F" opacity="0.8" />
            <path d="M84 50 C82 42, 76 38, 70 50 C76 62, 82 58, 84 50 Z" fill="#FFD54F" opacity="0.8" />
            {/* Brand text */}
            <text x="50" y="55" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="serif" textAnchor="middle" letterSpacing="1.5">
              PARLE
            </text>
            <text x="50" y="67" fill="#FFE082" fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="2">
              ESTD 1929
            </text>
          </svg>
        );

      case 'britannia':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#FFFFFF" stroke="#E0E0E0" strokeWidth="1" />
            {/* Green top arch banner */}
            <path d="M10 32 Q50 16 90 32 L90 20 Q50 6 10 20 Z" fill="#1B5E20" />
            {/* Red main ribbon */}
            <path d="M8 40 Q50 28 92 40 L90 68 Q50 56 10 68 Z" fill="#C62828" stroke="#D32F2F" />
            {/* Yellow dynamic swoosh */}
            <path d="M14 62 Q50 48 86 62 Q50 54 14 62 Z" fill="#FFD54F" />
            <text x="50" y="53" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.8">
              BRITANNIA
            </text>
            <text x="50" y="78" fill="#1B5E20" fontSize="7" fontWeight="800" textAnchor="middle" letterSpacing="0.5">
              Eat Healthy
            </text>
          </svg>
        );

      case 'amul':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#FFFFFF" stroke="#FFCDD2" strokeWidth="2" />
            {/* Iconic Amul Red Cursive Script */}
            <path d="M22 62 Q28 26 38 62 M26 48 L35 48" stroke="#D32F2F" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M40 62 L40 42 Q46 36 50 46 Q54 36 60 42 L60 62" stroke="#D32F2F" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M64 42 L64 56 Q66 63 72 61 L72 42" stroke="#D32F2F" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M78 28 L78 62" stroke="#D32F2F" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* The Taste of India subtext */}
            <text x="50" y="76" fill="#0D47A1" fontSize="6.5" fontWeight="800" textAnchor="middle" letterSpacing="0.5">
              The Taste of India
            </text>
            {/* Small red heart accent */}
            <circle cx="80" cy="24" r="3" fill="#D32F2F" />
          </svg>
        );

      case 'nestle':
      case 'nestlé':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#0277BD" />
            {/* Nest & mother bird outline */}
            <path d="M25 60 Q50 72 75 60 Q50 66 25 60 Z" fill="#E1F5FE" />
            <path d="M38 56 Q40 42 48 40 Q52 40 50 48 Q44 54 38 56 Z" fill="#FFFFFF" />
            <circle cx="52" cy="42" r="4" fill="#FFFFFF" />
            {/* Nestlé wordmark */}
            <text x="50" y="78" fill="#FFFFFF" fontSize="14" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">
              Nestlé
            </text>
          </svg>
        );

      case 'tata':
      case 'tata tea':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#005691" />
            {/* Iconic twin curved T crest */}
            <ellipse cx="50" cy="42" rx="22" ry="18" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
            <path d="M42 34 Q50 42 50 54" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M58 34 Q50 42 50 54" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* TATA wordmark */}
            <text x="50" y="76" fill="#FFFFFF" fontSize="16" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="3">
              TATA
            </text>
          </svg>
        );

      case 'cadbury':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#381460" />
            {/* Gold accents */}
            <ellipse cx="50" cy="50" rx="42" ry="34" fill="none" stroke="#FFD54F" strokeWidth="1" strokeDasharray="3 2" />
            {/* Cadbury flowing script */}
            <text x="50" y="54" fill="#FFFFFF" fontSize="19" fontWeight="bold" fontFamily="cursive, serif" fontStyle="italic" textAnchor="middle" letterSpacing="0.5">
              Cadbury
            </text>
            {/* Glass and a half milk icon */}
            <path d="M42 66 L44 74 L48 74 L50 66 Z" fill="#FFFFFF" opacity="0.8" />
            <path d="M52 66 L54 74 L58 74 L60 66 Z" fill="#FFFFFF" opacity="0.8" />
          </svg>
        );

      case 'hindustan unilever':
      case 'hul':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#FFFFFF" stroke="#BBDEFB" strokeWidth="1.5" />
            {/* Unilever U shape formed of symbols */}
            <path d="M30 26 Q30 58 50 62 Q70 58 70 26" stroke="#1F36C7" strokeWidth="6" strokeLinecap="round" fill="none" />
            <circle cx="34" cy="30" r="3" fill="#00B0FF" />
            <circle cx="66" cy="30" r="3" fill="#00B0FF" />
            <circle cx="50" cy="54" r="4" fill="#1F36C7" />
            <text x="50" y="78" fill="#1F36C7" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">
              Unilever
            </text>
          </svg>
        );

      case 'colgate':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="16" width="92" height="68" rx="12" fill="#D32F2F" />
            {/* White Smile swoosh underneath */}
            <path d="M16 64 Q50 78 84 64 Q50 72 16 64 Z" fill="#FFFFFF" />
            {/* Colgate bold white text with slant */}
            <text x="50" y="52" fill="#FFFFFF" fontSize="18" fontWeight="900" fontStyle="italic" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">
              Colgate
            </text>
          </svg>
        );

      case 'lays':
      case 'lay\'s':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            {/* Golden sun circle */}
            <circle cx="50" cy="50" r="38" fill="#FBC02D" stroke="#F57F17" strokeWidth="2" />
            {/* Red ribbon wrapping across */}
            <path d="M8 50 Q50 36 92 50 L88 64 Q50 50 12 64 Z" fill="#D32F2F" />
            <text x="50" y="56" fill="#FFFFFF" fontSize="19" fontWeight="900" fontStyle="italic" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">
              Lay&apos;s
            </text>
          </svg>
        );

      case 'itc':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#0D47A1" />
            {/* Triple triangles */}
            <polygon points="35,32 50,56 20,56" fill="#FFC107" />
            <polygon points="65,32 80,56 50,56" fill="#FFC107" />
            <polygon points="50,44 65,68 35,68" fill="#FFFFFF" />
            <text x="50" y="80" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" letterSpacing="3">
              ITC
            </text>
          </svg>
        );

      case 'aashirvaad':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#B71C1C" />
            {/* Golden Sun & Wheat arch */}
            <circle cx="50" cy="38" r="14" fill="#FFD54F" />
            <path d="M30 46 Q50 32 70 46" stroke="#FFE082" strokeWidth="3" strokeLinecap="round" fill="none" />
            <text x="50" y="64" fill="#FFFFFF" fontSize="10.5" fontWeight="900" textAnchor="middle" letterSpacing="0.8">
              AASHIRVAAD
            </text>
            <text x="50" y="77" fill="#FFE082" fontSize="7" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              SHUDH ATTA
            </text>
          </svg>
        );

      case 'dettol':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            {/* Green Shield */}
            <path d="M50 8 C72 8 86 16 86 42 C86 68 50 90 50 90 C50 90 14 68 14 42 C14 16 28 8 50 8 Z" fill="#1B5E20" stroke="#4CAF50" strokeWidth="2.5" />
            {/* White sword/dagger emblem */}
            <line x1="50" y1="20" x2="50" y2="58" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            <line x1="40" y1="30" x2="60" y2="30" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="22" r="3" fill="#FFFFFF" />
            <text x="50" y="74" fill="#FFFFFF" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
              Dettol
            </text>
          </svg>
        );

      case 'haldiram\'s':
      case 'haldirams':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <ellipse cx="50" cy="50" rx="44" ry="34" fill="#B71C1C" stroke="#FFC107" strokeWidth="4" />
            <ellipse cx="50" cy="50" rx="40" ry="30" fill="#C62828" />
            <text x="50" y="48" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="cursive, serif" textAnchor="middle">
              Haldiram&apos;s
            </text>
            <text x="50" y="63" fill="#FFD54F" fontSize="6.5" fontWeight="bold" textAnchor="middle" letterSpacing="1.5">
              NAGPUR
            </text>
          </svg>
        );

      case 'fortune':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#FFFFFF" stroke="#81C784" strokeWidth="2" />
            {/* Golden sunflower / sunburst */}
            <circle cx="50" cy="38" r="16" fill="#FFD600" />
            <circle cx="50" cy="38" r="10" fill="#FF8F00" />
            <text x="50" y="66" fill="#2E7D32" fontSize="14" fontWeight="900" textAnchor="middle" letterSpacing="1">
              Fortune
            </text>
            <text x="50" y="78" fill="#D32F2F" fontSize="6" fontWeight="800" textAnchor="middle" letterSpacing="0.5">
              EDIBLE OILS
            </text>
          </svg>
        );

      case 'dabur':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#FFFFFF" stroke="#A5D6A7" strokeWidth="2" />
            {/* Green banyan tree of life */}
            <path d="M50 48 L50 28 Q40 22 34 32 Q44 38 50 48 Q56 38 66 32 Q60 22 50 28 Z" fill="#2E7D32" />
            <circle cx="50" cy="24" r="6" fill="#FFB300" />
            <text x="50" y="66" fill="#2E7D32" fontSize="14" fontWeight="900" textAnchor="middle" letterSpacing="1.5">
              Dabur
            </text>
            <text x="50" y="78" fill="#388E3C" fontSize="6" fontWeight="bold" textAnchor="middle" letterSpacing="1">
              AYURVEDA
            </text>
          </svg>
        );

      case 'everest':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            {/* Red Diamond */}
            <polygon points="50,12 88,50 50,88 12,50" fill="#C62828" stroke="#FF8A80" strokeWidth="2" />
            <text x="50" y="54" fill="#FFFFFF" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
              EVEREST
            </text>
            <text x="50" y="65" fill="#FFD54F" fontSize="6" fontWeight="bold" textAnchor="middle">
              SPICES
            </text>
          </svg>
        );

      case 'surf excel':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="4" y="10" width="92" height="80" rx="16" fill="#0D47A1" />
            {/* Splash rays */}
            <circle cx="50" cy="40" r="16" fill="#00E5FF" opacity="0.6" />
            <circle cx="44" cy="36" r="10" fill="#FF4081" opacity="0.8" />
            <circle cx="56" cy="38" r="8" fill="#FFD600" opacity="0.8" />
            <text x="50" y="64" fill="#FFFFFF" fontSize="11" fontWeight="900" textAnchor="middle">
              Surf Excel
            </text>
            <text x="50" y="76" fill="#00E5FF" fontSize="7" fontWeight="bold" textAnchor="middle">
              EASY WASH
            </text>
          </svg>
        );

      default:
        // Generic elegant monogram badge for any other brand
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <rect x="6" y="12" width="88" height="76" rx="16" fill={meta.primaryColor} stroke={meta.secondaryColor} strokeWidth="2" />
            <circle cx="50" cy="42" r="20" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x="50" y="49" fill="#FFFFFF" fontSize="18" fontWeight="900" textAnchor="middle">
              {cleanBrand.slice(0, 3).toUpperCase()}
            </text>
            <text x="50" y="74" fill="#FFFFFF" opacity="0.9" fontSize="9" fontWeight="bold" textAnchor="middle" letterSpacing="0.5">
              {cleanBrand.slice(0, 9)}
            </text>
          </svg>
        );
    }
  };

  return (
    <div 
      className={`inline-flex items-center justify-center rounded-xl overflow-hidden transition-all duration-200 ${className}`}
      style={{ width: sizePixels, height: sizePixels }}
      title={meta.tagline ? `${cleanBrand} - ${meta.tagline}` : cleanBrand}
    >
      {renderBrandSvg()}
    </div>
  );
};
