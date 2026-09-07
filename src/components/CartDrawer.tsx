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
  CheckCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { CartItem, Retailer, Product } from '../types';
import { formatINR, formatINRDecimals } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useDistributorSettings } from '../lib/settings';
import { DistributorSettingsModal } from './DistributorSettingsModal';

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
  onUpdateCartItem: (productId: string, cases: number, loosePcs: number) => void;
  onRemoveFromCart: (productId: string) => void;
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
  
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'cod' | 'upi' | 'qr' | 'credit'>('cod');
  const [upiRefNumber, setUpiRefNumber] = useState('');
  const [isPaidConfirmed, setIsPaidConfirmed] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Sync default payment mode with COD availability
  useEffect(() => {
    if (!settings.allowCOD && selectedPaymentMode === 'cod') {
      setSelectedPaymentMode('qr');
    }
  }, [settings.allowCOD, selectedPaymentMode]);

  if (!isOpen) return null;

  const selectedRetailer = retailers.find(r => r.id === selectedRetailerId) || retailers[0];

  // Calculate cart totals
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalTax = 0;
  let totalCases = 0;
  let totalLoosePcs = 0;
  let totalFreePcs = 0;

  const itemCalculations = cartItems.map(item => {
    const p = item.product;
    const piecesPerCase = p.piecesPerCase || 24;
    const totalPieces = (item.cases * piecesPerCase) + item.loosePcs;
    const grossAmount = totalPieces * p.wholesalePricePiece;
    
    let discountAmount = 0;
    let freePcs = 0;
    let schemeText = '';

    if (p.activeScheme && p.activeScheme.isActive) {
      const scheme = p.activeScheme;
      if (item.cases >= scheme.minQtyCases) {
        if (scheme.freeQtyPcs) {
          freePcs = Math.floor(item.cases / scheme.minQtyCases) * scheme.freeQtyPcs;
          schemeText = `+${freePcs} Free Pcs`;
        }
        if (scheme.discountPercentage) {
          discountAmount = (grossAmount * scheme.discountPercentage) / 100;
          schemeText = `${scheme.discountPercentage}% Off`;
        }
        if (scheme.discountFlatRs) {
          discountAmount = item.cases * scheme.discountFlatRs;
          schemeText = `₹${scheme.discountFlatRs} off/cs`;
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
    totalCases += item.cases;
    totalLoosePcs += item.loosePcs;
    totalFreePcs += freePcs;

    return {
      ...item,
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

  // Generate QR image on change
  QRCode.toDataURL(upiUri, { width: 180, margin: 1 })
    .then((url) => {
      if (url !== qrCodeDataUrl) setQrCodeDataUrl(url);
    })
    .catch(() => {});

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(settings.upiVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleBookNow = () => {
    if (!selectedRetailer || cartItems.length === 0) return;
    if (selectedPaymentMode === 'cod' && !settings.allowCOD) {
      alert('Cash on Delivery is currently disabled by the distributor. Please select UPI or QR payment.');
      return;
    }
    onCheckout(selectedRetailer.id, cartItems, {
      paymentMode: selectedPaymentMode,
      upiRefNumber: upiRefNumber.trim(),
      isPaidNow: isPaidConfirmed || (selectedPaymentMode === 'qr' && !!upiRefNumber.trim())
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center text-white">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  {isRetailer ? 'Order Cart & Checkout' : 'Order Cart & Quick Indent'}
                </h2>
                <p className="text-[11px] text-slate-300">
                  {cartItems.length} SKUs • {totalCases} Cases {totalLoosePcs > 0 ? `+ ${totalLoosePcs} Pcs` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {cartItems.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-slate-300 hover:text-rose-400 p-1.5 rounded transition-colors cursor-pointer"
                  title="Clear entire cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={onClose}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Retailer Selector Banner */}
          <div className="p-3 bg-slate-50 border-b border-slate-200">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Store className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>{isRetailer ? 'My Retail Store:' : 'Selected Kirana / Retailer:'}</span>
              </span>
              {selectedRetailer && (
                <span className={`status-pill ${
                  selectedRetailer.status === 'blocked' ? 'status-danger' : isCreditOverdue ? 'status-warning' : 'status-success'
                }`}>
                  {selectedRetailer.status}
                </span>
              )}
            </label>

            {isRetailer ? (
              <div className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 flex items-center justify-between">
                <span>{selectedRetailer?.storeName || 'My Kirana Outlet'} ({selectedRetailer?.beatName || 'Assigned Beat'})</span>
                <span className="text-[10px] text-slate-500 font-mono">Dues: {formatINR(selectedRetailer?.currentOutstanding || 0)}</span>
              </div>
            ) : (
              <select
                value={selectedRetailer?.id || ''}
                onChange={(e) => onSelectRetailer(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              >
                {retailers.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.storeName} ({r.beatName}) - Outstanding: {formatINR(r.currentOutstanding)}
                  </option>
                ))}
              </select>
            )}

            {selectedRetailer && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Credit Limit: {formatINR(selectedRetailer.creditLimit)}</span>
                <span className={isCreditOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                  Avail Credit: {formatINR(Math.max(0, selectedRetailer.creditLimit - selectedRetailer.currentOutstanding))}
                </span>
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingCart className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
                <h3 className="font-semibold text-slate-700 text-sm">Your order cart is empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Browse products and click "+ Add to Cart" to quickly punch multiple FMCG cases and scheme items.
                </p>
              </div>
            ) : (
              itemCalculations.map((item) => {
                const p = item.product;
                return (
                  <div 
                    key={p.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2.5">
                        <img 
                          src={p.imageUrl} 
                          alt={p.name}
                          className="w-10 h-10 rounded-md object-cover border border-slate-100 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs leading-tight line-clamp-1">{p.name}</h4>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.brand} • {p.piecesPerCase} pcs/case • MRP ₹{p.mrpPiece}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveFromCart(p.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Active Scheme Badge */}
                    {item.schemeText && (
                      <div className="flex items-center space-x-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        <Gift className="w-3 h-3 text-emerald-600" />
                        <span>Scheme: {item.schemeText}</span>
                      </div>
                    )}

                    {/* Quantity Controls & Line Total */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Cases control */}
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Cases:</span>
                          <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                            <button
                              type="button"
                              onClick={() => onUpdateCartItem(p.id, Math.max(0, item.cases - 1), item.loosePcs)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 rounded-l cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-xs text-slate-900">{item.cases}</span>
                            <button
                              type="button"
                              onClick={() => onUpdateCartItem(p.id, item.cases + 1, item.loosePcs)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 rounded-r cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Loose pcs control */}
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Loose:</span>
                          <input 
                            type="number"
                            min="0"
                            max={p.piecesPerCase - 1}
                            value={item.loosePcs}
                            onChange={(e) => onUpdateCartItem(p.id, item.cases, Math.max(0, Number(e.target.value)))}
                            className="w-12 px-1.5 py-0.5 text-xs font-mono font-bold border border-slate-200 rounded-md text-center bg-slate-50"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {formatINR(item.netAmount)}
                        </span>
                        {item.discountAmount > 0 && (
                          <div className="text-[10px] text-emerald-600 font-mono">
                            - {formatINR(item.discountAmount)}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Gross Product Value</span>
                  <span className="font-mono">{formatINR(subtotal)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Trade Scheme Discounts</span>
                    <span className="font-mono">- {formatINR(totalDiscount)}</span>
                  </div>
                )}

                {totalFreePcs > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 text-[11px]">
                    <span>Free Scheme Packs Included</span>
                    <span className="font-bold">+{totalFreePcs} Loose Pcs</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>GST (CGST + SGST Included)</span>
                  <span className="font-mono">{formatINR(totalTax)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-bold text-slate-900">
                  <span>Net Invoice Amount</span>
                  <span className="font-mono text-base text-[#2563eb]">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* PAYMENT MODE SELECTION SECTION */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Select Payment Mode</span>
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Payment Settings</span>
                    </button>
                  )}
                </div>

                {/* Mode Cards Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* COD */}
                  <button
                    type="button"
                    disabled={!settings.allowCOD}
                    onClick={() => setSelectedPaymentMode('cod')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
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
                    <p className="text-xs font-bold text-slate-900 mt-1">Cash on Delivery</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Pay cash at time of van delivery</p>
                  </button>

                  {/* Dynamic QR Payment */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('qr')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
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
                    <p className="text-xs font-bold text-slate-900 mt-1">Scan UPI QR</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Instant scan via GPay/PhonePe</p>
                  </button>

                  {/* UPI App Payment */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMode('upi')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      selectedPaymentMode === 'upi'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone className={`w-4 h-4 ${selectedPaymentMode === 'upi' ? 'text-blue-600' : 'text-slate-500'}`} />
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
                        UPI App
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">UPI / Net Banking</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Direct payment via UPI handles</p>
                  </button>

                  {/* 15-Day Wholesale Credit */}
                  <button
                    type="button"
                    disabled={settings.mandatoryOnlinePayment}
                    onClick={() => setSelectedPaymentMode('credit')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
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
                    <p className="text-xs font-bold text-slate-900 mt-1">Wholesale Credit</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Distributor ledger credit</p>
                  </button>
                </div>

                {/* Conditional Dynamic QR Code Display */}
                {selectedPaymentMode === 'qr' && (
                  <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-xs space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">Scan to Pay Exact Amount:</span>
                      <span className="text-xs font-mono font-black text-[#2563eb]">{formatINR(grandTotal)}</span>
                    </div>

                    <div className="flex items-center justify-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                      {qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Distributor UPI QR" 
                          className="w-36 h-36 rounded-md shadow-xs"
                        />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                          Generating QR...
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500">Payee UPI VPA</p>
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
                  <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-xs space-y-2 animate-in fade-in duration-150">
                    <p className="text-[11px] text-slate-600">
                      Click below to open your preferred UPI payment application:
                    </p>
                    <a
                      href={upiUri}
                      className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
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

                {!settings.allowCOD && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center space-x-2 text-[11px] text-amber-900">
                    <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Cash on Delivery is currently locked. Online UPI/QR payment required.</span>
                  </div>
                )}
              </div>

              {isCreditOverdue && (
                <div className="p-2 rounded bg-amber-50 border border-amber-200 flex items-start space-x-2 text-[11px] text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Order will exceed retailer credit limit ({formatINR(selectedRetailer?.creditLimit || 0)}). Require spot payment or owner clearance.</span>
                </div>
              )}

              <button
                onClick={handleBookNow}
                className={`w-full py-2.5 px-4 font-bold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  isRetailer
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white'
                }`}
              >
                {isRetailer ? (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Place Order Now ({totalCases} Cases)</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Punch / Book Order ({totalCases} Cases)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </div>
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
