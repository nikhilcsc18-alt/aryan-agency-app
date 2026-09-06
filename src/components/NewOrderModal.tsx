import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  Tag, 
  IndianRupee, 
  Store, 
  Package, 
  ArrowRight,
  Bot
} from 'lucide-react';
import { Product, Retailer, Salesman, OrderItem } from '../types';
import { formatINR, formatINRDecimals, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface NewOrderModalProps {
  products: Product[];
  retailers: Retailer[];
  salesmen: Salesman[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitOrder: (orderData: any) => Promise<void>;
  initialProductId?: string;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  products,
  retailers,
  salesmen,
  isOpen,
  onClose,
  onSubmitOrder,
  initialProductId
}) => {
  const { currentUser, isSalesman, isRetailer } = useAuth();

  const [orderMode, setOrderMode] = useState<'catalog' | 'ai_parser'>('catalog');
  
  // Selected Retailer
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(() => {
    if (isRetailer && currentUser?.retailerId) return currentUser.retailerId;
    return retailers[0]?.id || '';
  });

  // Selected Salesman
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>(() => {
    if (isSalesman && currentUser?.salesmanId) return currentUser.salesmanId;
    return salesmen[0]?.id || '';
  });

  // Order Items
  const [orderItems, setOrderItems] = useState<{ productId: string; cases: number; loosePcs: number }[]>(() => {
    if (initialProductId) {
      return [{ productId: initialProductId, cases: 2, loosePcs: 0 }];
    }
    return [{ productId: products[0]?.id || '', cases: 5, loosePcs: 0 }];
  });

  // Payment collection on booking
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [orderNotes, setOrderNotes] = useState('');

  // AI Parser state
  const [aiTextPrompt, setAiTextPrompt] = useState('5 cases Parle-G 80g, 2 peti Tata Tea 500g, 4 cases Maggi 70g for Laxmi Supermarket');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiParseResult, setAiParseResult] = useState<any>(null);

  if (!isOpen) return null;

  const currentRetailer = retailers.find(r => r.id === selectedRetailerId);
  const currentSalesman = salesmen.find(s => s.id === selectedSalesmanId);

  // Credit calculation
  const creditLimit = currentRetailer?.creditLimit || 0;
  const currentOutstanding = currentRetailer?.currentOutstanding || 0;
  const availableCredit = Math.max(0, creditLimit - currentOutstanding);
  const isOverdue = currentRetailer?.status === 'overdue' || currentOutstanding > creditLimit;

  // Handle Add Item row
  const handleAddItem = () => {
    const nextUnused = products.find(p => !orderItems.some(i => i.productId === p.id));
    setOrderItems([...orderItems, { productId: nextUnused?.id || products[0]?.id || '', cases: 1, loosePcs: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: 'productId' | 'cases' | 'loosePcs', val: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: val };
    setOrderItems(updated);
  };

  // Calculate live totals
  let grossSubtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalTax = 0;

  const itemBreakdowns = orderItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;

    const cases = Number(item.cases) || 0;
    const loose = Number(item.loosePcs) || 0;
    const totalPcs = (cases * product.piecesPerCase) + loose;
    const lineGross = totalPcs * product.wholesalePricePiece;

    let discount = 0;
    let freePcs = 0;
    let schemeTitle = '';

    if (product.activeScheme && product.activeScheme.isActive) {
      const sch = product.activeScheme;
      if (cases >= sch.minQtyCases) {
        if (sch.freeQtyPcs) {
          freePcs = Math.floor(cases / sch.minQtyCases) * sch.freeQtyPcs;
          schemeTitle = `${sch.title} (+${freePcs} Pcs Free)`;
        }
        if (sch.discountPercentage) {
          discount = (lineGross * sch.discountPercentage) / 100;
          schemeTitle = `${sch.title} (${sch.discountPercentage}% Off)`;
        }
        if (sch.discountFlatRs) {
          discount = cases * sch.discountFlatRs;
          schemeTitle = `${sch.title} (₹${sch.discountFlatRs} off/case)`;
        }
      }
    }

    const netLine = Math.max(0, lineGross - discount);
    const taxable = +(netLine / (1 + product.gstRate / 100)).toFixed(2);
    const gst = +(netLine - taxable).toFixed(2);

    grossSubtotal += lineGross;
    totalDiscount += discount;
    totalTaxable += taxable;
    totalTax += gst;

    return {
      product,
      cases,
      loose,
      totalPcs,
      lineGross,
      discount,
      freePcs,
      schemeTitle,
      netLine,
      taxable,
      gst
    };
  }).filter(Boolean);

  const finalBillAmount = Math.round(grossSubtotal - totalDiscount);

  // AI Order Parser Trigger
  const handleParseWithAI = async () => {
    if (!aiTextPrompt.trim()) return;
    try {
      setIsParsingAI(true);
      const parsed = await api.parseAIOrder(aiTextPrompt);
      setAiParseResult(parsed);

      if (parsed.retailerId) {
        setSelectedRetailerId(parsed.retailerId);
      }

      if (parsed.items && parsed.items.length > 0) {
        const newItems = parsed.items.map((i: any) => ({
          productId: i.productId,
          cases: i.cases || 1,
          loosePcs: i.loosePcs || 0
        }));
        setOrderItems(newItems);
      }

      if (parsed.notes) {
        setOrderNotes(parsed.notes);
      }
    } catch (err) {
      console.error('AI parse error', err);
    } finally {
      setIsParsingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRetailer) return;

    // Build fully calculated line items
    const calculatedItems = itemBreakdowns.map((b: any) => {
      const p = b.product;
      const halfGst = +(b.gst / 2).toFixed(2);
      return {
        productId: p.id,
        sku: p.sku,
        productName: p.name,
        brand: p.brand,
        category: p.category,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        cases: b.cases,
        loosePcs: b.loose,
        totalPieces: b.totalPcs,
        unitPrice: p.wholesalePricePiece,
        grossAmount: b.lineGross,
        discountAmount: b.discount,
        taxableAmount: b.taxable,
        cgstAmount: halfGst,
        sgstAmount: halfGst,
        igstAmount: 0,
        totalAmount: b.netLine,
        schemeApplied: b.schemeTitle || undefined,
        freePcsAwarded: b.freePcs || undefined
      };
    });

    const halfTax = +(totalTax / 2).toFixed(2);
    const roundOff = +(finalBillAmount - (grossSubtotal - totalDiscount)).toFixed(2);
    const outstanding = Math.max(0, finalBillAmount - amountPaidNow);
    const paymentStatus = amountPaidNow >= finalBillAmount ? 'paid' : amountPaidNow > 0 ? 'partial' : 'unpaid';
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const payload = {
      retailerId: currentRetailer.id,
      retailerName: currentRetailer.storeName,
      retailerPhone: currentRetailer.phone || '',
      retailerAddress: currentRetailer.address || '',
      retailerGstin: currentRetailer.gstin || '',
      beatName: currentRetailer.beatName || 'General Beat',
      salesmanId: currentSalesman?.id,
      salesmanName: currentSalesman?.name,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: tomorrow,
      items: calculatedItems,
      subtotal: grossSubtotal,
      totalDiscount,
      totalTaxable,
      totalCgst: halfTax,
      totalSgst: halfTax,
      totalTax,
      roundOff,
      grandTotal: finalBillAmount,
      amountPaid: amountPaidNow,
      outstandingAmount: outstanding,
      paymentMode,
      paymentStatus,
      notes: orderNotes,
      status: 'booked' as const
    };

    await onSubmitOrder(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#1e293b] text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Aryan Agency • FMCG Order Punching</h2>
              <p className="text-[11px] text-slate-500">Fast DSR beat booking, automated scheme calculations & GST invoicing</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-2">
            <div className="bg-slate-200 p-0.5 rounded-lg flex text-xs">
              <button
                type="button"
                onClick={() => setOrderMode('catalog')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  orderMode === 'catalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Catalog Grid
              </button>
              <button
                type="button"
                onClick={() => setOrderMode('ai_parser')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors flex items-center space-x-1 cursor-pointer ${
                  orderMode === 'ai_parser' ? 'bg-[#2563eb] text-white shadow-xs' : 'text-[#2563eb]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI WhatsApp / Voice</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          
          {/* AI WhatsApp / Voice Order Parser Tab */}
          {orderMode === 'ai_parser' && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center">
                  <Bot className="w-4 h-4 mr-1.5 text-[#2563eb]" />
                  Gemini FMCG Order Extractor
                </span>
                <span className="text-[10px] text-[#2563eb] font-semibold uppercase tracking-wider">Natural Language Parser</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Paste raw WhatsApp message or speech transcript received from retailer or salesman. The AI will extract SKUs, case counts, and match the outlet.
              </p>

              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={aiTextPrompt}
                  onChange={(e) => setAiTextPrompt(e.target.value)}
                  placeholder="e.g. 5 cases Parle-G, 2 peti Tata Tea 500g, 4 cases Maggi for Laxmi Supermarket"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] font-sans text-xs"
                />

                <div className="flex items-center justify-between">
                  <div className="flex space-x-1.5 text-[10px]">
                    <span className="text-slate-500">Quick Samples:</span>
                    <button
                      type="button"
                      onClick={() => setAiTextPrompt('10 cases Good Day Butter, 2 cases Surf Excel 1kg for Shree Ganesh Provision')}
                      className="text-[#2563eb] underline cursor-pointer"
                    >
                      Ganesh Store Order
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setAiTextPrompt('3 cases Amul Butter 500g, 5 cases Lays Magic Masala for Sri Sai Ram Mart')}
                      className="text-[#2563eb] underline cursor-pointer"
                    >
                      Sai Ram Mart Order
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleParseWithAI}
                    disabled={isParsingAI}
                    className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isParsingAI ? 'animate-spin' : 'text-amber-300'}`} />
                    <span>{isParsingAI ? 'Extracting Order...' : 'Extract & Fill Form'}</span>
                  </button>
                </div>
              </div>

              {aiParseResult && (
                <div className="p-2.5 bg-white rounded-lg border border-blue-100 text-[11px] space-y-1">
                  <div className="font-semibold text-slate-900">
                    Matched: {aiParseResult.retailerName || 'Selected Store'} ({aiParseResult.items?.length || 0} line items parsed)
                  </div>
                  {aiParseResult.notes && <div className="text-slate-600 italic">Notes: {aiParseResult.notes}</div>}
                </div>
              )}
            </div>
          )}

          {/* Retailer & Salesman Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            
            {/* Retailer Dropdown */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Retail Outlet / Kirana Store <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedRetailerId}
                onChange={(e) => setSelectedRetailerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563eb] focus:outline-none"
                required
              >
                {retailers.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.storeName} ({r.beatName}) • Outstanding: {formatINR(r.currentOutstanding)}
                  </option>
                ))}
              </select>

              {/* Retailer Credit Card Preview */}
              {currentRetailer && (
                <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Credit Limit: <b className="text-slate-900 font-mono">{formatINR(creditLimit)}</b></span>
                    <span className="text-slate-500">Current Dues: <b className="text-rose-700 font-mono">{formatINR(currentOutstanding)}</b></span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500">Available Headroom:</span>
                    <span className={`font-mono font-bold ${availableCredit < 10000 ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {formatINR(availableCredit)}
                    </span>
                  </div>
                  {isOverdue && (
                    <div className="text-rose-600 font-semibold text-[10px] flex items-center pt-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Warning: Store has exceeded credit limit or has overdue invoices!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Salesman & Beat */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Sales Representative (DSR)
              </label>
              <select
                value={selectedSalesmanId}
                onChange={(e) => setSelectedSalesmanId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563eb] focus:outline-none"
              >
                {salesmen.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.assignedBeats.join(', ')})
                  </option>
                ))}
              </select>

              <div className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px]">
                <div className="text-slate-500">Beat Route: <b className="text-slate-900">{currentRetailer?.beatName || 'General Beat'}</b></div>
                <div className="text-slate-500">Address: <span className="text-slate-700">{currentRetailer?.address || 'N/A'}</span></div>
              </div>
            </div>

          </div>

          {/* Product Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-[#f1f5f9] p-3 flex items-center justify-between border-b border-slate-200">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Order Items ({orderItems.length} SKUs)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg flex items-center space-x-1 cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Item</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Select FMCG Product</th>
                    <th className="px-3 py-2 text-center">Cases</th>
                    <th className="px-3 py-2 text-center">Loose Pcs</th>
                    <th className="px-3 py-2 text-right">Case Price</th>
                    <th className="px-3 py-2">Scheme</th>
                    <th className="px-3 py-2 text-right">Line Total (₹)</th>
                    <th className="px-3 py-2 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orderItems.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    const breakdown = itemBreakdowns[index];

                    return (
                      <tr key={index} className="hover:bg-slate-50/70">
                        
                        {/* Product Dropdown */}
                        <td className="px-3 py-2">
                          <select
                            value={item.productId}
                            onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.brand} - {p.name} ({p.currentStockCases} cases in stock)
                              </option>
                            ))}
                          </select>
                          {product && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {product.piecesPerCase} pcs/case • MRP ₹{product.mrpPiece} • Wholesale ₹{product.wholesalePricePiece}/pc (GST {product.gstRate}%)
                            </div>
                          )}
                        </td>

                        {/* Cases input */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.cases}
                            onChange={(e) => handleUpdateItem(index, 'cases', Number(e.target.value))}
                            className="w-16 px-2 py-1 font-mono font-bold text-center border border-slate-300 rounded-lg"
                          />
                        </td>

                        {/* Loose pieces */}
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.loosePcs}
                            onChange={(e) => handleUpdateItem(index, 'loosePcs', Number(e.target.value))}
                            className="w-14 px-2 py-1 font-mono text-center border border-slate-300 rounded-lg"
                          />
                        </td>

                        {/* Case Price */}
                        <td className="px-3 py-2 text-right font-mono text-slate-700">
                          {formatINR(product?.casePrice || 0)}
                        </td>

                        {/* Scheme applied */}
                        <td className="px-3 py-2">
                          {breakdown?.schemeTitle ? (
                            <span className="status-pill status-warning inline-flex items-center">
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              {breakdown.schemeTitle}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">None</span>
                          )}
                        </td>

                        {/* Line Total */}
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                          {formatINR(breakdown?.netLine || 0)}
                        </td>

                        {/* Remove */}
                        <td className="px-3 py-2 text-center">
                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculations Summary & Spot Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            
            {/* Payment & Remarks on Booking */}
            <div className="space-y-3">
              <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                Booking Settlement & Notes
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Spot Advance Payment (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={finalBillAmount}
                    value={amountPaidNow}
                    onChange={(e) => setAmountPaidNow(Number(e.target.value))}
                    className="w-full px-3 py-1.5 font-mono font-semibold bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563eb]"
                  >
                    <option value="cash">Cash (On Booking)</option>
                    <option value="upi">UPI Digital QR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-[11px] mb-1">Delivery / Packing Notes</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Urgent morning van delivery required"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            {/* Bill Value Breakdown */}
            <div className="space-y-1.5 font-mono text-xs border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
              <div className="flex justify-between text-slate-600">
                <span>Gross Value:</span>
                <span>{formatINRDecimals(grossSubtotal)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-[#2563eb] font-semibold">
                  <span>Trade Schemes Discount:</span>
                  <span>-{formatINRDecimals(totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Taxable Amount:</span>
                <span>{formatINRDecimals(totalTaxable)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Total GST (CGST + SGST):</span>
                <span>{formatINRDecimals(totalTax)}</span>
              </div>
              
              <div className="border-t border-slate-300 pt-2 flex justify-between items-baseline text-sm font-bold text-slate-900">
                <span className="font-sans">Grand Total:</span>
                <span className="text-lg text-[#1e293b]">{formatINR(finalBillAmount)}</span>
              </div>

              {amountPaidNow > 0 && (
                <div className="flex justify-between text-emerald-700 text-[11px] font-semibold">
                  <span>Spot Paid ({paymentMode.toUpperCase()}):</span>
                  <span>-{formatINR(amountPaidNow)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 text-[11px] font-semibold pt-1 border-t border-slate-200">
                <span>Balance to Debit Ledger:</span>
                <span>{formatINR(Math.max(0, finalBillAmount - amountPaidNow))}</span>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Punch FMCG Order</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
