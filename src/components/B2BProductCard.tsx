import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Check, 
  AlertCircle, 
  Layers, 
  Zap, 
  Tag, 
  Package, 
  Eye, 
  FileText, 
  Sparkles,
  Edit,
  Trash2
} from 'lucide-react';
import { Product, ProductPackingOption } from '../types';
import { formatINR } from '../lib/api';
import { ProductImage } from './ProductImage';
import { getProductPackingOptions } from '../lib/packingUtils';

interface B2BProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, casesCount: number, packing?: ProductPackingOption) => void;
  onBookNow?: (productId: string) => void;
  onBuyNow?: (product: Product, casesCount: number, packing?: ProductPackingOption) => void;
  isRetailer?: boolean;
  isSalesman?: boolean;
  onViewBatches?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  isAdmin?: boolean;
  inCartCount?: number;
  onUpdateCartItem?: (productId: string, cases: number, loosePcs: number, packingId?: string) => void;
  onOpenPackSelector?: (product: Product) => void;
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
  onUpdateCartItem,
  onOpenPackSelector
}) => {
  const [casesCount, setCasesCount] = useState<number>(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  // Packing options for Aryan Agency Wholesale
  const packingOptions = useMemo(() => getProductPackingOptions(product), [product]);
  const [selectedPackingId, setSelectedPackingId] = useState<string>(() => packingOptions[0]?.id || '');

  useEffect(() => {
    if (!packingOptions.some(p => p.id === selectedPackingId)) {
      setSelectedPackingId(packingOptions[0]?.id || '');
    }
  }, [packingOptions, selectedPackingId]);

  const activePacking = packingOptions.find(p => p.id === selectedPackingId) || packingOptions[0];
  const unitPrice = product.wholesalePricePiece || activePacking?.unitPrice || 0;
  const unitMrp = product.mrpPiece || activePacking?.unitMrp || 0;

  const isLowStock = product.currentStockCases <= product.reorderLevelCases;
  const isOutOfStock = product.currentStockCases <= 0;

  // Determine smart offer / scheme badge (Margin percentage removed per instruction)
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

    if (product.currentStockCases > 20) {
      return '⭐ POPULAR';
    }
    return '📦 WHOLESALE';
  };

  const offerBadge = getOfferBadge();

  const handleIncrement = () => {
    if (inCartCount > 0 && onUpdateCartItem) {
      onUpdateCartItem(product.id, inCartCount + 1, 0, activePacking?.id);
    } else {
      setCasesCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (inCartCount > 0 && onUpdateCartItem) {
      onUpdateCartItem(product.id, Math.max(0, inCartCount - 1), 0, activePacking?.id);
    } else {
      setCasesCount(prev => (prev > 1 ? prev - 1 : 1));
    }
  };

  // Clicking Add to Cart opens the Aryan Agency detail pack selector
  const handleAddToCartClick = () => {
    if (onOpenPackSelector) {
      onOpenPackSelector(product);
      return;
    }
    if (onAddToCart) {
      onAddToCart(product, casesCount, activePacking);
      setIsAddedFeedback(true);
      setTimeout(() => setIsAddedFeedback(false), 1400);
    }
  };

  const handleBuyNowClick = () => {
    if (onOpenPackSelector) {
      onOpenPackSelector(product);
      return;
    }
    const qtyToBuy = inCartCount > 0 ? inCartCount : casesCount;
    if (onBuyNow) {
      onBuyNow(product, qtyToBuy, activePacking);
    } else if (onAddToCart) {
      onAddToCart(product, qtyToBuy, activePacking);
    }
  };

  const activeDisplayQty = inCartCount > 0 ? inCartCount : casesCount;

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative">
      
      {/* Top Media & Header Section */}
      <div className="relative">
        
        {/* Top Badges Bar */}
        <div className="absolute top-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between pointer-events-none">
          {/* Offer / Margin Ribbon */}
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10.5px] font-black tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xs uppercase">
            {offerBadge}
          </span>

          {/* Stock Tag */}
          {isOutOfStock ? (
            <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold bg-rose-600 text-white">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold bg-amber-500 text-white">
              Low Stock
            </span>
          ) : null}
        </div>

        {/* Product Image Stage */}
        <div className="h-32 sm:h-40 bg-slate-50 relative flex items-center justify-center p-2 overflow-hidden">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            brand={product.brand}
            category={product.category}
            sku={product.sku}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
          />

          {/* Quick Admin Actions Overlay */}
          {isAdmin && (
            <div className="absolute bottom-1.5 right-1.5 flex items-center space-x-1 opacity-90 group-hover:opacity-100 transition-opacity">
              {onEditProduct && (
                <button
                  type="button"
                  onClick={() => onEditProduct(product)}
                  className="p-1 rounded-md bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 shadow-2xs cursor-pointer"
                  title="Edit Product"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
              {onDeleteProduct && (
                <button
                  type="button"
                  onClick={() => onDeleteProduct(product.id)}
                  className="p-1 rounded-md bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 shadow-2xs cursor-pointer"
                  title="Delete Product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Content Section */}
      <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between space-y-2">
        
        <div>
          {/* Brand & Category Row */}
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100/60 truncate">
              {product.brand}
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-400 truncate max-w-[100px]">
              {product.category}
            </span>
          </div>

          {/* Product Title */}
          <h3 
            className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-1 min-h-[2.2rem]" 
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Pricing Block - Clean Wholesale Rate & MRP (Pack of 1, Pack of 2 & Margin % removed per instructions) */}
        <div className="bg-slate-50/90 rounded-xl p-2 sm:p-2.5 border border-slate-200/80 space-y-1.5">
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline space-x-1 min-w-0">
              <span className="text-base sm:text-xl font-black text-slate-950 font-mono tracking-tight">
                ₹{unitPrice.toFixed(2)}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">/pc</span>
              {unitMrp > unitPrice && (
                <span className="text-[9.5px] text-slate-400 line-through ml-1 font-mono">
                  ₹{unitMrp.toFixed(1)}
                </span>
              )}
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 font-mono">
              MRP ₹{unitMrp.toFixed(1)}
            </span>
          </div>

          {/* Case Price and Pieces info */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
            <span className="truncate">
              Case: <strong className="text-slate-900 font-bold">{formatINR(product.casePrice || (unitPrice * (product.piecesPerCase || 24)))}</strong>
            </span>
            <span className="text-slate-500 shrink-0 text-[9.5px] sm:text-[10.5px]">
              {product.piecesPerCase || 24} pcs/cs
            </span>
          </div>
        </div>

        {/* Action Buttons (Clicking Add to Cart opens the Aryan Agency Pack Selector Detail View) */}
        <div className="space-y-1.5 pt-0.5">
          {inCartCount > 0 ? (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleAddToCartClick}
                className="flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-1 transition-all shadow-xs cursor-pointer active:scale-98 truncate"
                title="View & Edit Selected Packs"
              >
                <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="truncate">In Cart ({inCartCount})</span>
              </button>
              
              {isRetailer ? (
                onBuyNow && (
                  <button
                    type="button"
                    onClick={handleBuyNowClick}
                    className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0 flex items-center space-x-1 shadow-xs"
                    title="Buy Now / Place Order"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
                    <span>Buy</span>
                  </button>
                )
              ) : (
                onBookNow && (
                  <button
                    type="button"
                    onClick={() => onBookNow(product.id)}
                    className="py-2 sm:py-2.5 px-2.5 sm:px-3.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0"
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
                className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-98 cursor-pointer truncate ${
                  isAddedFeedback
                    ? 'bg-emerald-600 text-white'
                    : isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isAddedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>+ Add to Cart</span>
                  </>
                )}
              </button>

              {isRetailer ? (
                onBuyNow && (
                  <button
                    type="button"
                    onClick={handleBuyNowClick}
                    disabled={isOutOfStock}
                    className="py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0 flex items-center space-x-1 disabled:opacity-40"
                    title="Instant Buy Now"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
                    <span>Buy</span>
                  </button>
                )
              ) : (
                onBookNow && (
                  <button
                    type="button"
                    onClick={() => onBookNow(product.id)}
                    disabled={isOutOfStock}
                    className="py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shrink-0 disabled:opacity-40"
                    title="Book Order"
                  >
                    Book
                  </button>
                )
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
