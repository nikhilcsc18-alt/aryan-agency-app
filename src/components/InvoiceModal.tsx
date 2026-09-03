import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Building2, 
  FileText,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { Order } from '../types';
import { formatINR, formatINRDecimals } from '../lib/api';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const totalCases = order.items.reduce((s, i) => s + i.cases, 0);
  const totalLoose = order.items.reduce((s, i) => s + i.loosePcs, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Actions Bar (Hidden in Print) */}
        <div className="p-3.5 bg-[#1e293b] text-white flex items-center justify-between print:hidden rounded-t-lg">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs tracking-wide">GST Tax Invoice Preview • {order.invoiceNumber || order.orderNumber}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg text-xs flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Paper Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-900 bg-white font-sans text-xs" id="printable-invoice">
          
          {/* Header Title */}
          <div className="text-center pb-3 border-b-2 border-slate-800">
            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">GST TAX INVOICE • ORIGINAL FOR RECIPIENT</div>
            <h1 className="text-2xl font-black tracking-tight text-[#1e293b] mt-0.5">ARYAN AGENCY</h1>
            <p className="text-[11px] text-slate-700 font-medium">Authorised FMCG Super Stockist & Wholesale Distributor</p>
            <p className="text-[11px] text-slate-600">
              #104, APMC Commercial Yard, Yeshwanthpur Industrial Area, Bengaluru, Karnataka - 560022
            </p>
            <div className="flex justify-center items-center space-x-4 text-[11px] font-mono text-slate-700 mt-1">
              <span><b>GSTIN:</b> 29ABCDE1234F1Z5</span>
              <span>•</span>
              <span><b>FSSAI Lic:</b> 11223344556677</span>
              <span>•</span>
              <span><b>Phone:</b> +91 80 2345 6789</span>
            </div>
          </div>

          {/* Invoice Meta and Billed To Section */}
          <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-300 text-xs">
            
            {/* Buyer Details */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Billed To (Buyer / Consignee):</span>
              <div className="text-sm font-bold text-slate-900">{order.retailerName}</div>
              <div className="text-slate-600">{order.retailerAddress}</div>
              <div className="text-slate-600"><b>Phone:</b> {order.retailerPhone}</div>
              <div className="font-mono text-slate-700"><b>Beat Route:</b> {order.beatName}</div>
              <div className="font-mono text-slate-700"><b>State Code:</b> 29 (Karnataka)</div>
            </div>

            {/* Invoice Details */}
            <div className="space-y-1 text-right font-mono">
              <div>
                <span className="text-slate-500 font-sans text-[11px]">Invoice Number: </span>
                <span className="font-bold text-slate-900 text-sm">{order.invoiceNumber || order.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans text-[11px]">Invoice Date: </span>
                <span className="font-bold text-slate-900">
                  {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-sans text-[11px]">Order Reference: </span>
                <span className="text-slate-800">{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans text-[11px]">Booked By (DSR): </span>
                <span className="font-sans font-semibold text-slate-800">{order.salesmanName || 'Direct Booking'}</span>
              </div>
              {order.deliveryRunSheetNumber && (
                <div>
                  <span className="text-slate-500 font-sans text-[11px]">Trip Sheet: </span>
                  <span className="text-slate-800">{order.deliveryRunSheetNumber} ({order.vehicleNumber})</span>
                </div>
              )}
            </div>

          </div>

          {/* Itemized Table */}
          <div className="mt-4 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f1f5f9] text-slate-700 uppercase text-[10px] font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 w-8 text-center">#</th>
                  <th className="p-2">Description of Goods</th>
                  <th className="p-2">HSN</th>
                  <th className="p-2 text-center">Cases</th>
                  <th className="p-2 text-center">Total Pcs</th>
                  <th className="p-2 text-right">Wholesale Rate</th>
                  <th className="p-2 text-right">Scheme Disc.</th>
                  <th className="p-2 text-right">Taxable (₹)</th>
                  <th className="p-2 text-center">GST</th>
                  <th className="p-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-2">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        SKU: {item.sku} {item.batchNumber ? `• Batch: ${item.batchNumber}` : ''}
                      </div>
                    </td>
                    <td className="p-2 font-mono text-slate-600">{item.hsnCode}</td>
                    <td className="p-2 text-center font-mono font-semibold">
                      {item.cases}
                      {item.loosePcs > 0 && <span className="text-[10px] block font-normal">+{item.loosePcs} pcs</span>}
                    </td>
                    <td className="p-2 text-center font-mono">
                      {item.totalPieces}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-700">
                      {formatINR(item.unitPricePiece)}
                    </td>
                    <td className="p-2 text-right font-mono text-[#2563eb]">
                      {item.discountAmount > 0 ? `-${formatINR(item.discountAmount)}` : '-'}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-800 font-medium">
                      {formatINRDecimals(item.taxableAmount)}
                    </td>
                    <td className="p-2 text-center font-mono text-slate-600">
                      {item.gstRate}%
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900">
                      {formatINRDecimals(item.netTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Summary Breakdown */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-300 pt-4">
            
            {/* Left Box: Terms & Bank UPI QR */}
            <div className="space-y-3 text-[11px] text-slate-600">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-800 block text-xs">Bank Transfer & UPI QR:</span>
                <div><b>A/C Name:</b> ARYAN AGENCY</div>
                <div><b>Bank:</b> HDFC Bank, Yeshwanthpur Branch</div>
                <div><b>A/C No:</b> 50200012345678 (Current) • <b>IFSC:</b> HDFC0001234</div>
                <div><b>UPI ID:</b> aryanagency@hdfcbank</div>
              </div>

              <div className="text-[10px] text-slate-500 leading-tight space-y-0.5">
                <p>1. Goods once sold will not be accepted back except for verified factory leakage/damage.</p>
                <p>2. Payment due strictly within agreed credit terms (14 days). Interest @18% p.a. on overdue bills.</p>
                <p>3. Subject to Bengaluru Jurisdiction only.</p>
              </div>
            </div>

            {/* Right Box: Grand Totals */}
            <div className="space-y-1.5 font-mono text-xs text-right bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Total Packages / Cases:</span>
                <span>{totalCases} Cases {totalLoose > 0 ? `+ ${totalLoose} pcs` : ''}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Subtotal (Gross Value):</span>
                <span>{formatINRDecimals(order.subtotal)}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-[#2563eb] font-semibold">
                  <span className="font-sans">Total Schemes & Discounts:</span>
                  <span>-{formatINRDecimals(order.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Taxable Value:</span>
                <span>{formatINRDecimals(order.totalTaxable)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">CGST + SGST (Central & State):</span>
                <span>{formatINRDecimals(order.totalTax)}</span>
              </div>

              <div className="border-t border-slate-400 pt-2 flex justify-between items-baseline font-bold text-slate-900">
                <span className="font-sans text-sm">Invoice Grand Total:</span>
                <span className="text-base text-[#1e293b]">{formatINR(order.grandTotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 text-[11px] font-semibold pt-1 border-t border-slate-200">
                <span className="font-sans">Amount Paid:</span>
                <span>{formatINR(order.amountPaid)}</span>
              </div>

              <div className="flex justify-between text-rose-700 text-[11px] font-bold">
                <span className="font-sans">Balance Payable:</span>
                <span>{formatINR(Math.max(0, order.grandTotal - order.amountPaid))}</span>
              </div>
            </div>

          </div>

          {/* Signature Footer */}
          <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-12 flex items-end justify-center font-serif italic text-slate-400">
                Receiver's Stamp & Signature
              </div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                For {order.retailerName}
              </div>
            </div>

            <div>
              <div className="h-12 flex items-end justify-center font-bold text-[#1e293b]">
                Aryan Agency Authorized Signatory
              </div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">
                For ARYAN AGENCY
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
