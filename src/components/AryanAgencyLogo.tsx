import React from 'react';

interface AryanAgencyLogoProps {
  variant?: 'icon' | 'square' | 'horizontal' | 'badge' | 'fmcg-basket';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  useImageAsset?: boolean;
  showTagline?: boolean;
}

/**
 * Clean SVG Brand Symbol for Apna Store / Aryan Agency
 */
export const ApnaStoreVectorIcon: React.FC<{ size?: number; className?: string }> = ({ 
  size = 32, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 44 44" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xs ${className}`}
      aria-label="Apna Store Logo"
    >
      <defs>
        <linearGradient id="apna-blue-grad" x1="6" y1="6" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#0B1E3F" />
        </linearGradient>
        <linearGradient id="apna-gold-grad" x1="12" y1="14" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Rounded Navy Container */}
      <rect x="2" y="2" width="40" height="40" rx="10" fill="url(#apna-blue-grad)" stroke="#2563EB" strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Modern Shopping Store Bag / Carton Icon */}
      {/* Bag / Basket Body */}
      <path 
        d="M10 17C10 15.8954 10.8954 15 12 15H32C33.1046 15 34 15.8954 34 17L32 34C32 35.1046 31.1046 36 30 36H14C12.8954 36 12 35.1046 12 34L10 17Z" 
        fill="#1E293B" 
        stroke="#60A5FA" 
        strokeWidth="1.5"
      />

      {/* Bag Handle */}
      <path 
        d="M16 15V12C16 9.79086 17.7909 8 20 8H24C26.2091 8 28 9.79086 28 12V15" 
        stroke="#F59E0B" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />

      {/* Dynamic Golden "A" Accent / Tick */}
      <path 
        d="M22 19L27 28H23L22 25.5H19L22 19Z" 
        fill="url(#apna-gold-grad)" 
      />
      <circle cx="28.5" cy="20.5" r="2" fill="#FBBF24" />
    </svg>
  );
};

/**
 * Standard FMCG Basket/Store Logo variant
 */
export const AryanAgencyFMCGLogo: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
  showSubline?: boolean;
}> = ({
  className = '',
  size = 'md',
  theme = 'dark',
  showSubline = true
}) => {
  return (
    <AryanAgencyLogo 
      variant="horizontal" 
      size={size} 
      theme={theme} 
      className={className} 
      showTagline={showSubline} 
    />
  );
};

/**
 * Main Apna Store Brand Logo Component
 * Strict Brand Specification:
 * - Small logo on the left
 * - "Apna Store" on the right
 * - Tagline: "Smart Shopping. Trusted Service."
 * - Subtle: "Powered by Aryan Agency" below
 * - No prominent FMCG distribution text, no duplicate logos
 */
export const AryanAgencyLogo: React.FC<AryanAgencyLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'auto',
  className = '',
  showTagline = true
}) => {
  const isDark = theme === 'dark';

  // Size metrics
  const sizeConfig = {
    xs: { iconSize: 24, title: 'text-xs', tagline: 'text-[9px]', sub: 'text-[8px]' },
    sm: { iconSize: 30, title: 'text-sm sm:text-base', tagline: 'text-[10px]', sub: 'text-[9px]' },
    md: { iconSize: 36, title: 'text-base sm:text-lg', tagline: 'text-[11px]', sub: 'text-[9.5px]' },
    lg: { iconSize: 44, title: 'text-lg sm:text-xl', tagline: 'text-xs', sub: 'text-[10px]' },
    xl: { iconSize: 52, title: 'text-xl sm:text-2xl', tagline: 'text-xs', sub: 'text-[11px]' },
    '2xl': { iconSize: 64, title: 'text-2xl sm:text-3xl', tagline: 'text-sm', sub: 'text-xs' }
  }[size];

  // 1. PURE ICON ONLY
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <ApnaStoreVectorIcon size={sizeConfig.iconSize} />
      </div>
    );
  }

  // 2. SQUARE APP ICON
  if (variant === 'square') {
    return (
      <div className={`inline-flex items-center justify-center rounded-2xl p-1 bg-[#0B1E3F] border border-blue-900 shadow-md shrink-0 ${className}`}>
        <ApnaStoreVectorIcon size={sizeConfig.iconSize} />
      </div>
    );
  }

  // 3. BADGE / PILL
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full border ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200'} ${className}`}>
        <ApnaStoreVectorIcon size={18} />
        <span className="font-black tracking-tight text-xs">
          Apna <span className="text-[#F59E0B]">Store</span>
        </span>
      </div>
    );
  }

  // 4. STANDARD HORIZONTAL / FMCG-BASKET BRAND LOCKUP
  // Layout: Small logo on left, "Apna Store" on right, tagline "Smart Shopping. Trusted Service.", subtle "Powered by Aryan Agency" below.
  return (
    <div className={`inline-flex items-center space-x-2.5 select-none text-left ${className}`}>
      {/* Small logo on the left */}
      <div className="shrink-0 flex items-center justify-center">
        <ApnaStoreVectorIcon size={sizeConfig.iconSize} />
      </div>

      {/* Brand Text on the right */}
      <div className="flex flex-col justify-center leading-tight min-w-0">
        <div className="flex items-center space-x-1">
          <span className={`font-black tracking-tight font-sans ${sizeConfig.title} ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Apna
          </span>
          <span className={`font-black tracking-tight font-sans ${sizeConfig.title} text-[#F59E0B]`}>
            Store
          </span>
        </div>

        {showTagline && (
          <>
            <span className={`font-medium tracking-normal ${sizeConfig.tagline} ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-none mt-0.5 truncate`}>
              Smart Shopping. Trusted Services.
            </span>
            <span className={`font-normal ${sizeConfig.sub} ${isDark ? 'text-slate-400' : 'text-slate-400'} leading-none mt-0.5 truncate`}>
              Powered by Aryan Agency
            </span>
          </>
        )}
      </div>
    </div>
  );
};
