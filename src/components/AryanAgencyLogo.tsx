import React from 'react';

interface AryanAgencyLogoProps {
  variant?: 'icon' | 'square' | 'horizontal' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  theme?: 'dark' | 'light' | 'auto';
  className?: string;
  useImageAsset?: boolean;
}

export const AryanAgencyLogo: React.FC<AryanAgencyLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'auto',
  className = '',
  useImageAsset = false
}) => {
  // Size metrics
  const sizeConfig = {
    xs: { icon: 20, box: 'w-6 h-6', text: 'text-xs', sub: 'text-[8px]' },
    sm: { icon: 28, box: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 36, box: 'w-10 h-10', text: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 48, box: 'w-14 h-14', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 64, box: 'w-20 h-20', text: 'text-2xl', sub: 'text-sm' },
    '2xl': { icon: 84, box: 'w-28 h-28', text: 'text-3xl', sub: 'text-base' }
  }[size];

  // Colors based on theme
  const textColor = theme === 'dark' ? 'text-white' : theme === 'light' ? 'text-slate-900' : 'text-slate-900 dark:text-white';
  const subTextColor = theme === 'dark' ? 'text-slate-400' : theme === 'light' ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400';
  const badgeBg = theme === 'dark' ? 'bg-slate-800 text-blue-300 border-slate-700' : 'bg-blue-50 text-blue-700 border-blue-200';

  // SVG Geometric FMCG Distribution Icon
  const renderVectorSymbol = (iconSize: number) => (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
      aria-label="Aryan Agency FMCG Distribution Mark"
    >
      <defs>
        <linearGradient id="aa-blue-top" x1="12" y1="6" x2="36" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="aa-blue-left" x1="10" y1="20" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="aa-blue-right" x1="24" y1="20" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="aa-amber-arrow" x1="16" y1="18" x2="34" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Isometric Distribution Carton Facet - Top (depot storage roof) */}
      <path 
        d="M24 4L40 13.5L24 23L8 13.5L24 4Z" 
        fill="url(#aa-blue-top)" 
      />

      {/* Carton Facet - Left (FMCG bulk pack) */}
      <path 
        d="M8 15L23 23.8V42L8 33V15Z" 
        fill="url(#aa-blue-left)" 
      />

      {/* Carton Facet - Right (Dispatch warehouse bay) */}
      <path 
        d="M25 23.8L40 15V33L25 42V23.8Z" 
        fill="url(#aa-blue-right)" 
      />

      {/* Monogram 'A' & Velocity Delivery Arrow (Supply chain in motion) */}
      <path 
        d="M24 10L32 18.5H26.5V27.5L21.5 27.5V18.5H16L24 10Z" 
        fill="url(#aa-amber-arrow)"
        filter="url(#subtle-shadow)"
      />

      {/* Front Accent Line / Retail Shelf Divider */}
      <path 
        d="M13 25L23 31M25 31L35 25" 
        stroke="#ffffff" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeOpacity="0.4"
      />
    </svg>
  );

  // 1. PURE ICON ONLY
  if (variant === 'icon') {
    if (useImageAsset) {
      return (
        <img 
          src="/assets/aryan_agency_icon.png" 
          alt="Aryan Agency"
          className={`${sizeConfig.box} object-contain rounded-lg ${className}`}
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderVectorSymbol(sizeConfig.icon)}
      </div>
    );
  }

  // 2. SQUARE APP ICON (Android App Icon / Favicon / High-vis avatar format)
  if (variant === 'square') {
    if (useImageAsset) {
      return (
        <div className={`relative ${sizeConfig.box} rounded-2xl overflow-hidden shadow-md border border-slate-700/50 bg-slate-900 ${className}`}>
          <img 
            src="/assets/aryan_agency_icon.png" 
            alt="Aryan Agency App Icon"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }

    return (
      <div 
        className={`relative inline-flex items-center justify-center ${sizeConfig.box} rounded-2xl bg-gradient-to-br from-slate-900 via-[#1e293b] to-blue-950 p-2 shadow-lg border border-slate-700/60 ring-1 ring-white/10 ${className}`}
      >
        {renderVectorSymbol(sizeConfig.icon)}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />
      </div>
    );
  }

  // 3. BADGE / PILL
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full border ${badgeBg} ${className}`}>
        {renderVectorSymbol(18)}
        <span className="font-bold tracking-tight text-xs">Aryan Agency</span>
        <span className="text-[10px] uppercase font-semibold opacity-75">FMCG</span>
      </div>
    );
  }

  // 4. HORIZONTAL BRAND LOGO (Header, Login Screen, Invoices)
  if (useImageAsset) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img 
          src="/assets/aryan_agency_horizontal.png" 
          alt="Aryan Agency FMCG Distribution"
          className="h-10 sm:h-12 w-auto object-contain rounded-sm"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Icon emblem */}
      <div className={`relative shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-2 border border-slate-700/80 shadow-xs ring-1 ring-blue-500/20`}>
        {renderVectorSymbol(sizeConfig.icon)}
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-tight">
        <div className="flex items-center space-x-2">
          <span className={`font-extrabold tracking-tight font-sans ${sizeConfig.text} ${textColor}`}>
            Aryan Agency
          </span>
          <span className="hidden sm:inline-block text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
            FMCG
          </span>
        </div>
        <span className={`font-semibold uppercase tracking-widest ${sizeConfig.sub} ${subTextColor}`}>
          Distribution & Wholesale ERP
        </span>
      </div>
    </div>
  );
};
