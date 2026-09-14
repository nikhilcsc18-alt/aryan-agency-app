import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Minus, 
  Plus, 
  Truck, 
  ChevronRight, 
  Share2, 
  Check, 
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Info
} from 'lucide-react';
import { Product, ProductPackingOption, Retailer } from '../types';
import { getProductPackingOptions } from '../lib/packingUtils';
import { formatINR } from '../lib/api';
import { ProductImage } from './ProductImage';

interface ApnaClubPackSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCartBatch?: (items: { product: Product; packing: ProductPackingOption; quantity: number }[]) => void;
  onAddToCartSingle?: (product: Product, quantity: number, packing?: ProductPackingOption) => void;
  currentRetailer?: Retailer | null;
  allRetailers?: Retailer[];
  onSelectRetailer?: (retailerId: string) => void;
  initialQuantities?: Record<string, number>; // packingId -> quantity
}

export const ApnaClubPackSelectorModal: React.FC<ApnaClubPackSelectorModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCartBatch,
  onAddToCartSingle,
  currentRetailer,
  allRetailers = [],
  onSelectRetailer,
  initialQuantities = {}
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showRetailerPicker, setShowRetailerPicker] = useState<boolean>(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState<boolean>(false);

  const packingOptions = useMemo(() => {
    if (!product) return [];
    return getProductPackingOptions(product);
  }, [product]);

  // Sync initial quantities when modal opens
  useEffect(() => {
    if (isOpen && product) {
      const initialMap: Record<string, number> = {};
      packingOptions.forEach(opt => {
        initialMap[opt.id] = initialQuantities[opt.id] || 0;
      });
      // If none selected, default the primary pack to 1 for quick checkout
      if (Object.values(initialMap).every(v => v === 0) && packingOptions.length > 0) {
        initialMap[packingOptions[0].id] = 1;
      }
      setQuantities(initialMap);
      setIsAddedFeedback(false);
    }
  }, [isOpen, product, packingOptions]);

  if (!isOpen || !product) return null;

  const handleIncrement = (packingId: string) => {
    setQuantities(prev => ({
      ...prev,
      [packingId]: (prev[packingId] || 0) + 1
    }));
  };

  const handleDecrement = (packingId: string) => {
    setQuantities(prev => ({
      ...prev,
      [packingId]: Math.max(0, (prev[packingId] || 0) - 1)
    }));
  };

  // Calculate totals
  const totalPacksCount: number = (Object.values(quantities) as number[]).reduce((acc: number, q: number) => acc + (Number(q) || 0), 0);
  const totalOrderAmount = packingOptions.reduce((acc, opt) => {
    const qty = Number(quantities[opt.id]) || 0;
    return acc + (qty * opt.sellingPrice);
  }, 0);

  const totalMrpAmount = packingOptions.reduce((acc, opt) => {
    const qty = Number(quantities[opt.id]) || 0;
    return acc + (qty * opt.mrp);
  }, 0);

  const totalSavings = Math.max(0, totalMrpAmount - totalOrderAmount);

  const handleAddToCart = () => {
    if (totalPacksCount <= 0) return;

    const itemsToAdd: { product: Product; packing: ProductPackingOption; quantity: number }[] = [];
    packingOptions.forEach(opt => {
      const qty = quantities[opt.id] || 0;
      if (qty > 0) {
        itemsToAdd.push({
          product,
          packing: opt,
          quantity: qty
        });
      }
    });

    if (onAddToCartBatch && itemsToAdd.length > 0) {
      onAddToCartBatch(itemsToAdd);
    } else if (onAddToCartSingle && itemsToAdd.length > 0) {
      itemsToAdd.forEach(item => {
        onAddToCartSingle(item.product, item.quantity, item.packing);
      });
    }

    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
      onClose();
    }, 600);
  };

  // WhatsApp share handler
  const handleShareOnWhatsApp = () => {
    const textLines = [
      `*Aryan Agency FMCG Distribution Offer:*`,
      `📦 *${product.name}*`,
      `Brand: ${product.brand}`,
      `Unit MRP: ₹${product.mrpPiece || product.wholesalePricePiece * 1.25} per unit\n`,
      `*Available Packing Options & Margins:*`
    ];

    packingOptions.forEach(opt => {
      textLines.push(`• *${opt.name}* (${opt.pieces} pcs): ₹${opt.unitPrice.toFixed(2)}/pc | Total: ₹${opt.sellingPrice} (Margin: +${opt.marginPercentage}%)`);
    });

    textLines.push(`\nFast delivery in 1-2 days across all beat routes!`);
    const encoded = encodeURIComponent(textLines.join('\n'));
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const deliverToName = currentRetailer?.storeName || 'Select Retailer Store';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200 border border-slate-200">
        
        {/* Top Product Header Row (Exact match to uploaded screenshot) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-wider text-blue-600 mb-1">
                <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{product.brand}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{product.category}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2">
                {product.name}
              </h2>

              {/* MRP & WhatsApp Share Row */}
              <div className="flex items-center space-x-3 mt-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-700 font-mono">
                  <span className="font-black text-slate-900">₹{(product.mrpPiece || 0).toFixed(1)}</span>
                  <span className="text-slate-500 font-normal ml-1">MRP per unit</span>
                </span>

                <button
                  type="button"
                  onClick={handleShareOnWhatsApp}
                  title="Share pack details on WhatsApp"
                  className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Close X Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close pack selector"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Scrollable Pack Options List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
          
          {/* Packaging Cards - Exact 3-column table matching screenshot */}
          {packingOptions.map((opt) => {
            const currentQty = quantities[opt.id] || 0;
            const packTotal = opt.sellingPrice;
            const packMrp = opt.mrp;
            const packSave = Math.max(0, packMrp - packTotal);

            return (
              <div 
                key={opt.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:border-blue-300 transition-colors"
              >
                {/* 3 Columns Header & Values Box */}
                <div className="p-3.5 sm:p-4 border-b border-slate-100">
                  <div className="grid grid-cols-3 text-center gap-2 items-center">
                    
                    {/* Column 1: Pack of */}
                    <div className="text-center">
                      <div className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-tight">
                        Pack of
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5 font-mono">
                        {opt.pieces}
                      </div>
                    </div>

                    {/* Column 2: Aryan price/unit (AK price/unit) */}
                    <div className="text-center border-x border-slate-100 px-1">
                      <div className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-tight truncate">
                        AK price/unit
                      </div>
                      <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5 font-mono">
                        ₹{opt.unitPrice.toFixed(2)}
                      </div>
                    </div>

                    {/* Column 3: Margin % */}
                    <div className="text-center">
                      <div className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-tight">
                        Margin
                      </div>
                      <div className="text-base sm:text-lg font-black text-emerald-600 mt-0.5 font-mono">
                        {opt.marginPercentage.toFixed(2)}%
                      </div>
                    </div>

                  </div>

                  {/* Pack Price and MRP Subline */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>
                      Pack Total: <strong className="text-slate-900 font-bold">₹{packTotal.toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-400">
                      MRP ₹{packMrp.toFixed(2)} {packSave > 0 && <span className="text-emerald-700 font-bold ml-1">(Save ₹{packSave.toFixed(0)})</span>}
                    </span>
                  </div>
                </div>

                {/* Stepper [ - ] Qty [ + ] Row */}
                <div className="grid grid-cols-3 items-center bg-slate-50/70 p-2 sm:p-2.5">
                  <button
                    type="button"
                    onClick={() => handleDecrement(opt.id)}
                    disabled={currentQty <= 0}
                    className="h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
                    aria-label={`Decrease ${opt.name}`}
                  >
                    <Minus className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="text-center font-mono font-black text-base text-slate-900 select-none">
                    {currentQty}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleIncrement(opt.id)}
                    className="h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg transition-all active:scale-95 cursor-pointer shadow-2xs"
                    aria-label={`Increase ${opt.name}`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Delivery Promise Notice (Exact match to screenshot) */}
          <div className="flex items-center space-x-3 p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl text-blue-900 text-xs font-semibold">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <span>Your order will be delivered in 1-2 days</span>
          </div>

        </div>

        {/* Bottom Delivery & Add to Cart Bar (Exact match to screenshot) */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 shrink-0 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            
            {/* Left: Deliver To */}
            <div className="min-w-0 flex-1 relative">
              <div 
                onClick={() => allRetailers.length > 1 && setShowRetailerPicker(!showRetailerPicker)}
                className={`flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-slate-500 cursor-pointer ${
                  allRetailers.length > 1 ? 'hover:text-blue-600' : ''
                }`}
              >
                <span>DELIVER TO</span>
                <span>•</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div 
                onClick={() => allRetailers.length > 1 && setShowRetailerPicker(!showRetailerPicker)}
                className={`text-xs sm:text-sm font-black text-slate-900 truncate mt-0.5 ${
                  allRetailers.length > 1 ? 'cursor-pointer hover:text-blue-600' : ''
                }`}
                title={deliverToName}
              >
                {deliverToName}
              </div>

              {/* Retailer Selector Dropdown if multiple exist */}
              {showRetailerPicker && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-30 max-h-48 overflow-y-auto">
                  <div className="p-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Store:
                  </div>
                  {allRetailers.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        if (onSelectRetailer) onSelectRetailer(r.id);
                        setShowRetailerPicker(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                        r.id === currentRetailer?.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{r.storeName}</span>
                      {r.id === currentRetailer?.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: ADD TO CART > Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={totalPacksCount <= 0}
              className={`px-5 sm:px-6 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center space-x-1.5 transition-all shadow-md active:scale-98 cursor-pointer shrink-0 uppercase tracking-wider ${
                isAddedFeedback
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : totalPacksCount <= 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#1a365d] hover:bg-[#10233e] text-white shadow-blue-900/30'
              }`}
            >
              {isAddedFeedback ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <span>
                    ADD TO CART {totalPacksCount > 0 ? `(${totalPacksCount})` : ''}
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>

          </div>

          {/* Quick Summary of Subtotal */}
          {totalPacksCount > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>
                Total: <strong className="text-slate-900 font-bold">{formatINR(totalOrderAmount)}</strong>
              </span>
              {totalSavings > 0 && (
                <span className="text-emerald-700 font-bold">
                  Total Profit/Margin: {formatINR(totalSavings)}
                </span>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
