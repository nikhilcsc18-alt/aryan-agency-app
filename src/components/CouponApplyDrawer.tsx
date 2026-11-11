import React from 'react';
import { Coupon, CartItem } from '../types';
import { formatINR } from '../lib/api';
import { Tag, Check, ArrowRight, X, AlertCircle, Sparkles } from 'lucide-react';

interface CouponApplyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: Coupon[];
  cartItems: CartItem[];
  cartGrossTotal: number;
  appliedCouponCode?: string;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
}

export const CouponApplyDrawer: React.FC<CouponApplyDrawerProps> = ({
  isOpen,
  onClose,
  coupons,
  cartItems,
  cartGrossTotal,
  appliedCouponCode,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  if (!isOpen) return null;

  // Evaluate whether each coupon is eligible for current cart
  const checkEligibility = (coupon: Coupon): { isEligible: boolean; reason?: string; eligibleAmount: number } => {
    let eligibleAmount = 0;
    for (const item of cartItems) {
      const p = item.product;
      const piecesPerCase = item.selectedPacking?.pieces || p.piecesPerCase || 24;
      const totalPieces = (item.cases * piecesPerCase) + (item.loosePcs || 0);
      const gross = item.selectedPacking
        ? (item.cases * item.selectedPacking.sellingPrice)
        : (totalPieces * p.wholesalePricePiece);

      let matches = false;
      if (coupon.applicableTo === 'all') {
        matches = true;
      } else if (coupon.applicableTo === 'brand' && coupon.targetBrand) {
        matches = (p.brand || '').toLowerCase().trim() === coupon.targetBrand.toLowerCase().trim();
      } else if (coupon.applicableTo === 'category' && coupon.targetCategory) {
        matches = (p.category || '').toLowerCase().trim() === coupon.targetCategory.toLowerCase().trim();
      } else if (coupon.applicableTo === 'products' && coupon.targetProductIds) {
        matches = coupon.targetProductIds.includes(p.id);
      }

      if (matches) {
        eligibleAmount += gross;
      }
    }

    if (eligibleAmount === 0 && coupon.applicableTo !== 'all') {
      const targetLabel = coupon.targetBrand || coupon.targetCategory || 'selected products';
      return { isEligible: false, reason: `Requires products from ${targetLabel} in your cart`, eligibleAmount: 0 };
    }

    if (coupon.minOrderAmount && (eligibleAmount < coupon.minOrderAmount && cartGrossTotal < coupon.minOrderAmount)) {
      const diff = Math.max(0, coupon.minOrderAmount - eligibleAmount);
      return { 
        isEligible: false, 
        reason: `Add ${formatINR(diff)} more to unlock this offer (Min. ${formatINR(coupon.minOrderAmount)})`,
        eligibleAmount 
      };
    }

    return { isEligible: true, eligibleAmount };
  };

  return (
    <div className="fixed inset-0 z-60 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-[#0B132B] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Available Coupons & Offers</h3>
                <p className="text-[11px] text-slate-300">Apna Store Smart B2B Savings</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List of Coupons */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {coupons.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Tag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">No active coupons available right now.</p>
                <p className="text-xs text-slate-400 mt-1">Check back soon for new promotions and wholesale discounts.</p>
              </div>
            ) : (
              coupons.map((coupon) => {
                const isCurrentApplied = appliedCouponCode?.toUpperCase() === coupon.code.toUpperCase();
                const { isEligible, reason } = checkEligibility(coupon);

                return (
                  <div
                    key={coupon.id}
                    className={`rounded-xl border transition-all p-3.5 relative overflow-hidden ${
                      isCurrentApplied
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                        : isEligible
                        ? 'border-amber-300/80 bg-white hover:border-amber-400 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/80 opacity-90'
                    }`}
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      isCurrentApplied ? 'bg-emerald-500' : isEligible ? 'bg-amber-500' : 'bg-slate-300'
                    }`} />

                    <div className="pl-1">
                      {/* Code and Apply Button Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-sm font-black px-2.5 py-1 rounded-md bg-[#0B132B] text-amber-400 tracking-wider">
                            {coupon.code}
                          </span>
                          {coupon.targetBrand && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              {coupon.targetBrand}
                            </span>
                          )}
                        </div>

                        {isCurrentApplied ? (
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveCoupon();
                            }}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!isEligible}
                            onClick={() => {
                              onApplyCoupon(coupon.code);
                              onClose();
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                              isEligible
                                ? 'bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black shadow-xs'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <span>Apply</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="mt-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {coupon.title}
                        </h4>
                        {coupon.description && (
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                            {coupon.description}
                          </p>
                        )}
                      </div>

                      {/* Terms & Badges */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium">
                        <span>
                          Discount: <strong className="text-slate-800">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</strong>
                        </span>
                        {coupon.minOrderAmount > 0 && (
                          <span>
                            Min Order: <strong className="text-slate-800">{formatINR(coupon.minOrderAmount)}</strong>
                          </span>
                        )}
                        {coupon.maxDiscountLimit && coupon.discountType === 'percentage' && (
                          <span>
                            Max Limit: <strong className="text-slate-800">₹{coupon.maxDiscountLimit}</strong>
                          </span>
                        )}
                      </div>

                      {/* Eligibility Status or Warning */}
                      {!isEligible && reason && (
                        <div className="mt-2 p-1.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[10px] text-amber-900 flex items-start space-x-1.5">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                          <span className="leading-tight">{reason}</span>
                        </div>
                      )}

                      {isCurrentApplied && (
                        <div className="mt-2 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-bold flex items-center space-x-1.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Applied to your cart bill!</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">
              💡 <strong className="text-emerald-700">Bonus:</strong> Paying via UPI automatically gives an additional <strong>0.5% discount</strong> on the final amount!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
