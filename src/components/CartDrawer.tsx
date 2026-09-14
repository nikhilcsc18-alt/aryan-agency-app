import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  Store, 
  IndianRupee, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertTriangle,
  Gift,
  Zap,
  Banknote,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Lock,
  SlidersHorizontal,
  CreditCard,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  Percent
} from 'lucide-react';
import QRCode from 'qrcode';
import { CartItem, Retailer, Product } from '../types';
import { formatINR } from '../lib/api';
import { ProductImage } from './ProductImage';
import { useAuth } from '../context/AuthContext';
import { useDistributorSettings } from '../lib/settings';
import { DistributorSettingsModal } from './DistributorSettingsModal';
import { isCreditEnabledForRetailer } from '../lib/retailerCredit';
import { calculateCartItemPricing } from '../lib/packingUtils';

export interface CheckoutPaymentDetails {
  paymentMode: 'cod' | 'upi' | 'qr' | 'credit';
  upiRefNumber?: string;
  isPaidNow?: boolean;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  retailers: Retailer[];
  selectedRetailerId?: string;
  onSelectRetailer: (retailerId: string) => void;
  onUpdateCartItem: (productId: string, cases: number, loosePcs: number, packingId?: string) => void;
  onRemoveFromCart: (productId: string, packingId?: string) => void;
  onClearCart: () => void;
  onCheckout: (retailerId: string, cartItems: CartItem[], paymentDetails?: CheckoutPaymentDetails) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  retailers,
  selectedRetailerId,
  onSelectRetailer,
  onUpdateCartItem,
  onRemoveFromCart,
  onClearCart,
  onCheckout
}) => {
  const { isRetailer, isSalesman, isAdmin, currentUser } = useAuth();
  const { settings } = useDistributorSettings();
  
  // Two-step checkout: Step 1 (Review Products) -> Step 2 (Payment Mode)
  // This solves the mobile scrolling/lock issue completely!
  const [activeStep, setActiveStep] = useState<'items' | 'payment'>('items');
  const [isProductsSummaryExpanded, setIsProductsSummaryExpanded] = useState(false);

  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'cod' | 'upi' | 'qr' | 'credit'>('cod');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [isPaidConfirmed, setIsPaidConfirmed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Reset to items step whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      setActiveStep('items');
    }
  }, [isOpen]);

  const selectedRetailer = retailers.find(r => r.id === selectedRetailerId) || retailers[0];
  const isCreditAllowed = Boolean(selectedRetailer && isCreditEnabledForRetailer(selectedRetailer));

  // Sync default payment mode with COD availability and retailer credit permissions
  useEffect(() => {
    if (!settings.allowCOD && selectedPaymentMode === 'cod') {
      setSelectedPaymentMode('qr');
    }
  }, [settings.allowCOD, selectedPaymentMode]);

  // If Wholesale Credit mode is selected but retailer credit is disabled, safely switch mode
  useEffect(() => {
    if (selectedPaymentMode === 'credit' && !isCreditAllowed) {
      setSelectedPaymentMode(settings.allowCOD ? 'cod' : 'qr');
    }
  }, [isCreditAllowed, selectedPaymentMode, settings.allowCOD]);

  if (!isOpen) return null;

  // Calculate cart totals supporting both ApnaClub packings and FMCG cases
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalTax = 0;
  let totalCases = 0;
  let totalLoosePcs = 0;
  let totalFreePcs = 0;

  const itemCalculations = cartItems.map(item => {
    const p = item.product;
    const pricing = calculateCartItemPricing(item);

    let grossAmount = pricing.grossAmount;
    let discountAmount = 0;
    let freePcs = 0;
    let schemeText = '';

    const effectiveQty = item.selectedPacking ? (item.packCount || item.cases || 1) : item.cases;

    // Apply active trade scheme if applicable
    if (p.activeScheme && p.activeScheme.isActive) {
      const scheme = p.activeScheme;
      if (effectiveQty >= scheme.minQtyCases) {
        if (scheme.freeQtyPcs) {
          freePcs = Math.floor(effectiveQty / scheme.minQtyCases) * scheme.freeQtyPcs;
          schemeText = `+${freePcs} Free Pcs`;
        }
        if (scheme.discountPercentage) {
          discountAmount = (grossAmount * scheme.discountPercentage) / 100;
          schemeText = `${scheme.discountPercentage}% Off`;
        }
        if (scheme.discountFlatRs) {
          discountAmount = effectiveQty * scheme.discountFlatRs;
          schemeText = `₹${scheme.discountFlatRs} off`;
        }
      }
    }

    const netAmount = Math.max(0, grossAmount - discountAmount);
    const gstRate = p.gstRate || 18;
    const taxable = netAmount / (1 + gstRate / 100);
    const tax = netAmount - taxable;

    subtotal += grossAmount;
    totalDiscount += discountAmount;
    totalTaxable += taxable;
    totalTax += tax;
    totalCases += effectiveQty;
    totalLoosePcs += item.loosePcs || 0;
    totalFreePcs += freePcs;

    return {
      ...item,
      pricing,
      grossAmount,
      discountAmount,
      netAmount,
      freePcs,
      schemeText
    };
  });

  const grandTotal = Math.round(subtotal - totalDiscount);
  const isCreditOverdue = selectedRetailer && (selectedRetailer.currentOutstanding + grandTotal > selectedRetailer.creditLimit);

  // Generate dynamic UPI QR Code whenever grandTotal or QR mode changes
  const upiUri = `upi://pay?pa=${settings.upiVpa}&pn=${encodeURIComponent(settings.upiPayeeName)}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent('AryanAgency-Order')}`;

  // Generate QR Code data URL when QR mode is active
  if (selectedPaymentMode === 'qr' && !qrCodeDataUrl) {
    QRCode.toDataURL(upiUri, {
      width: 180,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Error generating UPI QR:', err));
  }

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(settings.upiVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleBookNow = () => {
    onCheckout(selectedRetailer?.id || '', cartItems, {
      paymentMode: selectedPaymentMode,
      upiRefNumber: upiRefNumber.trim() || undefined,
      isPaidNow: selectedPaymentMode === 'qr' || selectedPaymentMode === 'upi'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col h-full">
          
          {/* ================================================================= */}
          {/* HEADER: Title, Close, and 2-Step Progress Indicator                */}
          {/* ================================================================= */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight leading-none">
                    Wholesale Order Cart
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium mt-0.5">
                    {cartItems.length} Products • Aryan Agency FMCG
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs"
                    title="Clear entire cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 2-Step Navigation Tabs Bar */}
            {cartItems.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setActiveStep('items')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeStep === 'items'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">1</span>
                  <span>Products ({cartItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep('payment')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    activeStep === 'payment'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">2</span>
                  <span>Payment & Checkout</span>
                </button>
              </div>
            )}
          </div>

          {/* Retailer Selector Bar (for salesmen & admin) */}
          {!isRetailer && (
            <div className="px-3.5 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-1.5 text-xs text-blue-900 font-medium truncate">
                <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-slate-600 text-[11px]">Booking for:</span>
                <strong className="text-blue-950 font-bold truncate max-w-[170px]">
                  {selectedRetailer?.storeName}
                </strong>
              </div>
              <select
                value={selectedRetailerId || selectedRetailer?.id}
                onChange={(e) => onSelectRetailer(e.target.value)}
                className="text-[11px] bg-white border border-blue-200 rounded px-2 py-0.5 font-semibold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {retailers.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.storeName} ({r.area})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 1: CART PRODUCTS LIST (100% UNLOCKED SCROLLABLE VIEW)         */}
          {/* ================================================================= */}
          {activeStep === 'items' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 min-h-0 overscroll-contain">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">Your Cart is Empty</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Browse our FMCG wholesale catalog or brands and add cases / packs to start booking.
                    </p>
                  </div>
                ) : (
                  itemCalculations.map((item) => {
                    const p = item.product;
                    const pricing = item.pricing;
                    const effectiveQty = item.selectedPacking ? (item.packCount || item.cases || 1) : item.cases;

                    return (
                      <div 
                        key={`${p.id}_${item.selectedPackingId || 'std'}`}
                        className="bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-shadow space-y-2"
                      >
                        {/* Top: Image, Brand, SKU & Product Title */}
                        <div className="flex items-start space-x-2.5">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-slate-50 border border-slate-100 shrink-0 overflow-hidden flex items-center justify-center p-1">
                            <ProductImage
                              src={p.imageUrl}
                              alt={p.name}
                              brand={p.brand}
                              category={p.category}
                              sku={p.sku}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                {p.brand}
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemoveFromCart(p.id, item.selectedPackingId)}
                                className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight line-clamp-1 mt-0.5" title={p.name}>
                              {p.name}
                            </h4>

                            {/* ApnaClub Packing / Case info */}
                            <div className="flex items-center space-x-1.5 mt-1 flex-wrap gap-y-1">
                              {item.selectedPacking ? (
                                <>
                                  <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded inline-flex items-center space-x-1">
                                    <Package className="w-2.5 h-2.5 text-amber-600" />
                                    <span>{item.selectedPacking.name}</span>
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                    +{item.selectedPacking.marginPercentage}% Margin
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500 font-mono">
                                    ₹{pricing.unitPrice.toFixed(2)}/pc
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {p.piecesPerCase} pcs/case • ₹{p.wholesalePricePiece.toFixed(2)}/pc
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono line-through">
                                    MRP ₹{p.mrpPiece}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Trade Scheme Free Items or Discount Banner */}
                        {item.schemeText && (
                          <div className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 flex items-center justify-between text-[10px] text-amber-900 font-bold">
                            <span className="flex items-center space-x-1">
                              <Gift className="w-3 h-3 text-amber-600" />
                              <span>Trade Scheme: {item.schemeText}</span>
                            </span>
                            {item.freePcs > 0 && (
                              <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                                +{item.freePcs} FREE
                              </span>
                            )}
                          </div>
                        )}

                        {/* Bottom Row: Quantity Steppers & Line Total */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          {/* ApnaClub Packing Quantity Stepper */}
                          {item.selectedPacking ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => onUpdateCartItem(p.id, effectiveQty - 1, 0, item.selectedPackingId)}
                                  className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 shadow-2xs active:scale-90 transition-all cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-10 text-center text-xs font-mono font-black text-slate-900">
                                  {effectiveQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onUpdateCartItem(p.id, effectiveQty + 1, 0, item.selectedPackingId)}
                                  className="w-6 h-6 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 shadow-2xs active:scale-90 transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[10px] font-bold text-slate-600">
                                {effectiveQty > 1 ? 'Packs' : 'Pack'} ({pricing.totalPieces} pcs)
                              </span>
                            </div>
                          ) : (
                            /* Standard Case + Loose Steppers */
                            <div className="flex items-center space-x-3">
                              {/* Cases Stepper */}
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500 font-bold">Cases:</span>
                                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateCartItem(p.id, item.cases - 1, item.loosePcs)}
                                    className="w-5 h-5 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 shadow-2xs active:scale-90 cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center text-xs font-mono font-bold text-slate-900">
                                    {item.cases}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateCartItem(p.id, item.cases + 1, item.loosePcs)}
                                    className="w-5 h-5 rounded bg-white text-slate-700 font-bold flex items-center justify-center hover:bg-slate-200 shadow-2xs active:scale-90 cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Loose Pcs */}
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500 font-bold">Loose:</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={(p.piecesPerCase || 24) - 1}
                                  value={item.loosePcs}
                                  onChange={(e) => onUpdateCartItem(p.id, item.cases, Math.max(0, Number(e.target.value)))}
                                  className="w-10 px-1 py-0.5 text-xs font-mono font-bold border border-slate-200 rounded text-center bg-slate-50"
                                />
                              </div>
                            </div>
                          )}

                          {/* Line Total */}
                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-black font-mono text-slate-950">
                              {formatINR(item.netAmount)}
                            </div>
                            {item.discountAmount > 0 && (
                              <div className="text-[10px] font-bold text-emerald-600 font-mono">
                                Saved {formatINR(item.discountAmount)}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* Step 1 Fixed Bottom Summary & Next Button */}
              {cartItems.length > 0 && (
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Gross: </span>
                      <span className="font-mono text-slate-800 font-bold">{formatINR(subtotal)}</span>
                      {totalDiscount > 0 && (
                        <span className="text-emerald-600 font-semibold ml-2">
                          (Saved {formatINR(totalDiscount)})
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] block">Net Payable:</span>
                      <span className="text-base sm:text-lg font-black font-mono text-blue-700">
                        {formatINR(grandTotal)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveStep('payment')}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Proceed to Payment & Checkout ({formatINR(grandTotal)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ================================================================= */}
          {/* STEP 2: PAYMENT MODE & CONFIRMATION (DEDICATED FULL SCREEN VIEW)   */}
          {/* ================================================================= */}
          {activeStep === 'payment' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 min-h-0 overscroll-contain">
                
                {/* Back Button to Review Products */}
                <button
                  type="button"
                  onClick={() => setActiveStep('items')}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer py-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>← Back to Review Products ({cartItems.length} items)</span>
                </button>

                {/* Collapsible Order Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-3.5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Total Order Payable</p>
                      <p className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">
                        {formatINR(grandTotal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-200 text-[10px] font-bold">
                        {cartItems.length} Products • {totalCases} Units
                      </span>
                    </div>
                  </div>

                  {/* Toggle to peek products */}
                  <button
                    type="button"
                    onClick={() => setIsProductsSummaryExpanded(prev => !prev)}
                    className="w-full pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    <span>{isProductsSummaryExpanded ? 'Hide Product Details' : 'View Ordered Products Summary'}</span>
                    {isProductsSummaryExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Expanded Mini-List */}
                  {isProductsSummaryExpanded && (
                    <div className="pt-2 border-t border-slate-700/60 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {itemCalculations.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-0.5 text-slate-300">
                          <span className="truncate max-w-[200px] font-medium">
                            {item.product.name}
                          </span>
                          <span className="font-mono text-white text-[11px] shrink-0 ml-2">
                            {item.selectedPacking ? `${item.packCount} pk` : `${item.cases} cs`} • {formatINR(item.netAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Select Payment Mode Section Header */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Select Payment Option (भुगतान माध्यम)</span>
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Settings</span>
                    </button>
                  )}
                </div>

                {/* Payment Option Cards Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {/* COD */}
                  <button
                    type="button"
                    disabled={!settings.allowCOD}
                    onClick={() => setSelectedPaymentMode('cod')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      !settings.allowCOD
                        ? 'opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed'
                        : selectedPaymentMode === 'cod'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Banknote className={`w-4 h-4 ${selectedPaymentMode === 'cod' ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        settings.allowCOD ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {settings.allowCOD ? 'COD' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1.5">Cash on Delivery</p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Pay cash during van delivery</p>
                  </button>

                  {/* Scan UPI QR */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('qr')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      selectedPaymentMode === 'qr'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <QrCode className={`w-4 h-4 ${selectedPaymentMode === 'qr' ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                        Zero Fee
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1.5">Scan UPI QR</p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Instant GPay, PhonePe, Paytm</p>
                  </button>

                  {/* Direct UPI App */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('upi')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      selectedPaymentMode === 'upi'
                        ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone className={`w-4 h-4 ${selectedPaymentMode === 'upi' ? 'text-purple-600' : 'text-slate-500'}`} />
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                        UPI App
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1.5">UPI Direct Link</p>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Pay via installed banking app</p>
                  </button>

                  {/* Wholesale Credit (15 Days Udhar) */}
                  {isCreditAllowed && (
                    <button
                      type="button"
                      disabled={settings.mandatoryOnlinePayment}
                      onClick={() => setSelectedPaymentMode('credit')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        settings.mandatoryOnlinePayment
                          ? 'opacity-50 bg-slate-100 border-slate-200 cursor-not-allowed'
                          : selectedPaymentMode === 'credit'
                          ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Tag className={`w-4 h-4 ${selectedPaymentMode === 'credit' ? 'text-blue-600' : 'text-slate-500'}`} />
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          15 Days
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1.5">Wholesale Credit</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Limit: {formatINR(selectedRetailer?.creditLimit || 50000)}
                      </p>
                    </button>
                  )}
                </div>

                {/* Notice if Credit is Disabled for this outlet */}
                {!isCreditAllowed && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Credit / Udhar:{' '}
                        <strong className="text-slate-700 font-semibold">Disabled</strong> for this outlet
                      </span>
                    </span>
                    {isAdmin ? (
                      <span className="text-[10px] text-blue-600 font-bold">
                        (Manage in Retailers)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        Pay via UPI or COD
                      </span>
                    )}
                  </div>
                )}

                {/* Conditional Dynamic QR Code Display */}
                {selectedPaymentMode === 'qr' && (
                  <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-xs space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Scan QR with GPay / PhonePe / Paytm:</span>
                      <span className="text-xs font-mono font-black text-blue-700">{formatINR(grandTotal)}</span>
                    </div>

                    <div className="flex items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Distributor UPI QR" 
                          className="w-40 h-40 rounded-lg shadow-2xs"
                        />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                          Generating QR...
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500">Official Distributor UPI ID</p>
                        <p className="font-mono font-bold text-slate-900">{settings.upiVpa}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUPI}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded hover:bg-slate-100 text-slate-700 flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        Bank UTR / Transaction Reference # (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 524109823471"
                        value={upiRefNumber}
                        onChange={(e) => setUpiRefNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Conditional UPI App Link Display */}
                {selectedPaymentMode === 'upi' && (
                  <div className="p-3.5 bg-white rounded-xl border border-purple-200 shadow-xs space-y-2.5 animate-in fade-in duration-150">
                    <p className="text-xs text-slate-600">
                      Tap below to open your phone's UPI app and pay securely:
                    </p>
                    <a
                      href={upiUri}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open UPI App to Pay {formatINR(grandTotal)}</span>
                    </a>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                        UTR / Transaction ID after payment:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 524109823471"
                        value={upiRefNumber}
                        onChange={(e) => setUpiRefNumber(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {isCreditOverdue && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Order exceeds current credit limit ({formatINR(selectedRetailer?.creditLimit || 0)}). Spot payment or admin clearance required.</span>
                  </div>
                )}

              </div>

              {/* Step 2 Fixed Bottom Order Place Button */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2">
                <button
                  type="button"
                  onClick={handleBookNow}
                  className={`w-full py-3 px-4 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 ${
                    isRetailer
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Confirm & Place Order ({formatINR(grandTotal)})</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {isSettingsModalOpen && (
        <DistributorSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
};
