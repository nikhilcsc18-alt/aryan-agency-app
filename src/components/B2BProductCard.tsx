import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Flame, 
  Tag, 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  Package,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../lib/api';

interface B2BProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, casesCount: number) => void;
  onBookNow?: (productId: string) => void;
  onBuyNow?: (product: Product, casesCount: number) => void;
  isRetailer?: boolean;
  isSalesman?: boolean;
  onViewBatches?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  isAdmin?: boolean;
  inCartCount?: number;
  onUpdateCartItem?: (productId: string, cases: number, loosePcs: number) => void;
}

export const B2BProductCard: React.FC<B2BProductCardProps> = ({
  product,
  onAddToCart,
  onBookNow,
  onBuyNow,
  isRetailer = false,
  isSalesman = false,
  onViewBatches,
  onEditProduct,
  onDeleteProduct,
  isAdmin = false,
  inCartCount = 0,
  onUpdateCartItem
}) => {
  const [casesCount, setCasesCount] = useState<number>(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  const isLowStock = product.currentStockCases <= product.reorderLevelCases;
  const isOutOfStock = product.currentStockCases <= 0;
  
  // Calculate margin percentage
  const marginPct = product.mrpPiece > 0 
    ? Math.round(((product.mrpPiece - product.wholesalePricePiece) / product.mrpPiece) * 100)
    : 15;

  // Determine smart offer / scheme badge
  const getOfferBadge = () => {
    if (product.activeScheme && product.activeScheme.isActive) {
      if (product.activeScheme.freeQtyPcs && product.activeScheme.minQtyCases) {
        return `🔥 ${product.activeScheme.minQtyCases} + ${product.activeScheme.freeQtyPcs} FREE`;
      }
      if (product.activeScheme.discountPercentage) {
        return `🔥 ${product.activeScheme.discountPercentage}% OFF`;
      }
      if (product.activeScheme.discountFlatRs) {
        return `🔥 ₹${product.activeScheme.discountFlatRs} OFF/CS`;
      }
      return `🔥 ${product.activeScheme.title}`;
    }

    if (marginPct >= 20) {
      return '🔥 BEST OFFER';
    }
    if (marginPct >= 15) {
      return '10% OFF';
    }
    if (product.reorderLevelCases >= 15) {
      return 'NEW';
    }
    return '🔥 HOT DEAL';
  };

  const offerBadge = getOfferBadge();

  const handleIncrement = () => {
    if (inCartCount > 0 && onUpdateCartItem) {
      onUpdateCartItem(product.id, inCartCount + 1, 0);
    } else {
      setCasesCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (inCartCount > 0 && onUpdateCartItem) {
      onUpdateCartItem(product.id, Math.max(0, inCartCount - 1), 0);
    } else {
      setCasesCount(prev => (prev > 1 ? prev - 1 : 1));
    }
  };

  const handleAddToCartClick = () => {
    if (onAddToCart) {
      onAddToCart(product, casesCount);
      setIsAddedFeedback(true);
      setTimeout(() => setIsAddedFeedback(false), 1400);
    }
  };

  const handleBuyNowClick = () => {
    const qtyToBuy = inCartCount > 0 ? inCartCount : casesCount;
    if (onBuyNow) {
      onBuyNow(product, qtyToBuy);
    } else if (onAddToCart) {
      onAddToCart(product, qtyToBuy);
    }
  };

  const activeDisplayQty = inCartCount > 0 ? inCartCount : casesCount;
  const totalPcsForDisplay = activeDisplayQty * (product.piecesPerCase || 24);

  return (
    <div 
      className={`bg-white rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative group hover:shadow-lg ${
        inCartCount > 0 ? 'border-blue-400 ring-1 ring-blue-300/60 shadow-xs' : 'border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Top Media & Badges */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-100">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500'}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Gradient Shadow behind badges */}
        <div className="absolute inset-x-0 top-0 h-10 sm:h-14 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

        {/* Top Left: Offer / Scheme Badge */}
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10 max-w-[65%]">
          <span className="inline-flex items-center space-x-0.5 sm:space-x-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[11px] font-black tracking-wide bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-xs sm:shadow-md truncate">
            <span className="truncate">{offerBadge}</span>
          </span>
        </div>

        {/* Top Right: Stock Status Pill */}
        <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10">
          {isOutOfStock ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold bg-rose-900/90 text-rose-100 backdrop-blur-xs border border-rose-700 shadow-xs">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold bg-amber-500/90 text-slate-950 backdrop-blur-xs shadow-xs">
              Low: {product.currentStockCases} cs
            </span>
          ) : (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-semibold bg-slate-900/75 text-emerald-300 backdrop-blur-xs border border-white/10 shadow-xs">
              {product.currentStockCases} cs
            </span>
          )}
        </div>

        {/* Active Scheme Strip if present */}
        {product.activeScheme && product.activeScheme.isActive && (
          <div className="absolute bottom-0 inset-x-0 bg-amber-500/95 backdrop-blur-xs text-slate-950 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-black flex items-center justify-between border-t border-amber-400">
            <span className="flex items-center space-x-1 truncate">
              <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              <span className="truncate">{product.activeScheme.title}</span>
            </span>
            <span className="text-[8px] sm:text-[10px] bg-slate-950 text-white px-1 sm:px-1.5 py-0.2 rounded font-bold shrink-0 ml-1">
              SCHEME
            </span>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-2 sm:p-3.5 flex-1 flex flex-col justify-between space-y-1.5 sm:space-y-3">
        
        {/* Brand & Name & SKU */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[9px] sm:text-[10px] font-black tracking-wider text-[#2563eb] uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
              {product.brand}
            </span>
            <div 
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[9px] sm:text-[10.5px] font-mono font-bold tracking-tight text-slate-800 shrink-0 max-w-[65%] truncate shadow-2xs"
              title={`SKU Code: ${product.sku || (product as any).product_sku || 'N/A'}`}
            >
              <span className="text-[8px] sm:text-[9px] text-slate-500 font-medium">SKU:</span>
              <span className="text-slate-900 truncate">{product.sku || (product as any).product_sku || 'N/A'}</span>
            </div>
          </div>

          <h3 
            className="font-bold text-slate-900 text-xs sm:text-[14px] leading-tight line-clamp-2 min-h-[1.9rem] sm:min-h-[2.4rem]"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Pack / Carton Size */}
          <div className="flex items-center justify-between text-[9px] sm:text-xs text-slate-500 mt-1 font-medium">
            <span className="inline-flex items-center space-x-1 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] sm:text-[11px] text-slate-700 font-semibold truncate">
              <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500 shrink-0" />
              <span>{product.piecesPerCase} pcs/cs</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400">GST {product.gstRate}%</span>
          </div>
        </div>

        {/* Pricing Block (ApnaClub style: Wholesale Rate + MRP + Margin) */}
        <div className="bg-slate-50/90 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 border border-slate-200/80 space-y-0.5 sm:space-y-1">
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline space-x-0.5 sm:space-x-1 min-w-0">
              <span className="text-sm sm:text-lg font-black text-slate-950 font-mono tracking-tight truncate">
                ₹{product.wholesalePricePiece.toFixed(2)}
              </span>
              <span className="text-[9px] sm:text-[11px] font-semibold text-slate-500">/pc</span>
            </div>

            <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap">
              +{marginPct}%
            </span>
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-[11px] text-slate-500 pt-0.5 border-t border-slate-200/60 font-mono">
            <span className="truncate">
              Cs: <strong className="text-slate-900 font-bold">{formatINR(product.casePrice)}</strong>
            </span>
            <span className="line-through text-slate-400 shrink-0 pl-1 text-[8px] sm:text-[10px]">
              ₹{product.mrpPiece.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Quantity Controls & Add to Cart */}
        <div className="space-y-1.5 sm:space-y-2 pt-0.5">
          
          {/* [ - ] Quantity [ + ] Selector */}
          <div className="flex items-center justify-between bg-slate-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-slate-200">
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-600 pl-1.5 truncate">
              <span className="hidden xs:inline">Qty: </span>
              <span className="text-slate-900 font-bold">{activeDisplayQty} cs</span>
            </span>

            <div className="flex items-center space-x-0.5 sm:space-x-1">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={isOutOfStock}
                aria-label="Decrease cases"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              </button>

              <span className="w-5 sm:w-7 text-center text-[11px] sm:text-xs font-black font-mono text-slate-900">
                {activeDisplayQty}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={isOutOfStock}
                aria-label="Increase cases"
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-white hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* [ ADD TO CART ] Main Action Button */}
          {inCartCount > 0 ? (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleAddToCartClick}
                className="flex-1 py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center space-x-1 transition-all shadow-xs cursor-pointer active:scale-98 truncate"
              >
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">In Cart ({inCartCount})</span>
              </button>
              
              {isRetailer ? (
                onBuyNow && (
                  <button
                    type="button"
                    onClick={handleBuyNowClick}
                    className="py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs transition-all cursor-pointer shrink-0 flex items-center space-x-1 shadow-xs"
                    title="Buy Now / Place Order"
                  >
                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />
                    <span>Buy Now</span>
                  </button>
                )
              ) : (
                onBookNow && (
                  <button
                    type="button"
                    onClick={() => onBookNow(product.id)}
                    className="py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-[10px] sm:text-xs transition-all cursor-pointer shrink-0"
                    title="Direct Order Book"
                  >
                    Book
                  </button>
                )
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleAddToCartClick}
                disabled={isOutOfStock}
                className={`flex-1 py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center space-x-1 transition-all shadow-xs active:scale-98 cursor-pointer truncate ${
                  isAddedFeedback
                    ? 'bg-emerald-600 text-white'
                    : isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#1A365D] hover:bg-[#2A4365] text-white hover:shadow-md'
                }`}
              >
                {isAddedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">ADD TO CART</span>
                  </>
                )}
              </button>

              {isRetailer ? (
                onBuyNow && (
                  <button
                    type="button"
                    onClick={handleBuyNowClick}
                    disabled={isOutOfStock}
                    className="py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-xs transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center space-x-1 shadow-xs"
                    title="Instant Buy Now & Order Placement"
                  >
                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />
                    <span>Buy Now</span>
                  </button>
                )
              ) : (
                onBookNow && (
                  <button
                    type="button"
                    onClick={() => onBookNow(product.id)}
                    disabled={isOutOfStock}
                    className="py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] sm:text-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    title="Instant Booking"
                  >
                    Book
                  </button>
                )
              )}
            </div>
          )}

          {/* Secondary Quick Action Bar (Batches & Admin) */}
          <div className="flex items-center justify-between pt-0.5 text-[9px] sm:text-[11px] text-slate-500">
            {onViewBatches && (
              <button
                type="button"
                onClick={() => onViewBatches(product)}
                className="text-slate-600 hover:text-blue-700 font-medium flex items-center space-x-1 hover:underline cursor-pointer truncate"
                title="View Full Product Details & SKU Specifications"
              >
                <Eye className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">Details & Batches</span>
              </button>
            )}

            {isAdmin && (
              <div className="flex items-center space-x-1 ml-auto shrink-0">
                {onEditProduct && (
                  <button
                    type="button"
                    onClick={() => onEditProduct(product)}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-0.5 cursor-pointer text-[9px] sm:text-[11px]"
                  >
                    <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>Edit</span>
                  </button>
                )}
                {onDeleteProduct && (
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(product.id)}
                    className="text-rose-500 hover:text-rose-700 font-semibold flex items-center p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
