import React, { useState, useEffect } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogos';

interface ProductImageProps {
  src?: string;
  alt: string;
  brand?: string;
  category?: string;
  sku?: string;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  brand = 'FMCG',
  category = 'General',
  sku = '',
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full relative overflow-hidden bg-slate-100 flex items-center justify-center',
  loading = 'lazy',
  objectFit = 'cover'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Clean and sanitize image URL
  const getSanitizedSrc = (rawSrc?: string): string | null => {
    if (!rawSrc || !rawSrc.trim()) return null;
    let url = rawSrc.trim();

    // If it's a Google Images redirect URL, extract the real imgurl query param
    if (url.includes('google.com/imgres') && url.includes('imgurl=')) {
      try {
        const parsed = new URL(url);
        const actualImg = parsed.searchParams.get('imgurl');
        if (actualImg) {
          return decodeURIComponent(actualImg);
        }
      } catch (e) {
        // Fall through
      }
    }

    return url;
  };

  const finalSrc = getSanitizedSrc(src);

  if (!finalSrc || hasError) {
    return (
      <div className={`${containerClassName} bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100`}>
        <div className="flex flex-col items-center justify-center p-2 text-center max-w-[90%]">
          {brand && (
            <div className="mb-1 drop-shadow-xs">
              <BrandLogo brand={brand} size="sm" />
            </div>
          )}
          <span className="text-[10px] font-bold text-slate-700 truncate max-w-full leading-tight">
            {alt}
          </span>
          <span className="text-[8px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider">
            {sku || brand}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {/* Loading Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <Package className="w-5 h-5 text-slate-400 opacity-50" />
        </div>
      )}

      <img
        src={finalSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
