import React, { useState } from 'react';
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  FileText,
  Minus
} from 'lucide-react';
import { Product, InventoryMovement } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface InventoryViewProps {
  products: Product[];
  inventoryLogs: InventoryMovement[];
  onInwardStock: (data: any) => Promise<void>;
  onOutwardStock?: (data: any) => Promise<void>;
  preselectedProductId?: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  inventoryLogs,
  onInwardStock,
  onOutwardStock,
  preselectedProductId
}) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'stock' | 'expiry' | 'inward_logs'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);

  // Inward Form State
  const [inwardForm, setInwardForm] = useState({
    productId: preselectedProductId || (products[0]?.id || ''),
    batchNumber: `BAT-2026-${Math.floor(100 + Math.random() * 900)}`,
    mfgDate: new Date().toISOString().split('T')[0],
    expiryDate: '2027-06-30',
    cases: 25,
    loosePcs: 0,
    supplierInvoice: `PO-FAC-${Math.floor(1000 + Math.random() * 9000)}`,
    reason: 'Depot factory replenishment'
  });

  // Outward Form State
  const [outwardForm, setOutwardForm] = useState({
    productId: products[0]?.id || '',
    batchNumber: '',
    cases: 1,
    loosePcs: 0,
    type: 'damage_adjustment',
    reason: 'Damaged during unloading / transit',
    referenceId: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const handleOpenInward = (prodId?: string) => {
    setInwardForm({
      productId: prodId || (products[0]?.id || ''),
      batchNumber: `BAT-2026-${Math.floor(100 + Math.random() * 900)}`,
      mfgDate: new Date().toISOString().split('T')[0],
      expiryDate: '2027-06-30',
      cases: 20,
      loosePcs: 0,
      supplierInvoice: `PO-FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      reason: 'Depot factory replenishment'
    });
    setIsInwardModalOpen(true);
  };

  const handleOpenOutward = (prodId?: string) => {
    const prod = products.find(p => p.id === (prodId || products[0]?.id));
    setOutwardForm({
      productId: prod?.id || (products[0]?.id || ''),
      batchNumber: prod?.batches[0]?.batchNumber || '',
      cases: 1,
      loosePcs: 0,
      type: 'damage_adjustment',
      reason: 'Damaged carton / leakage write-off',
      referenceId: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsOutwardModalOpen(true);
  };

  const handleSubmitInward = async (e: React.FormEvent) => {
    e.preventDefault();
    await onInwardStock(inwardForm);
    setIsInwardModalOpen(false);
  };

  const handleSubmitOutward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onOutwardStock) {
      await onOutwardStock(outwardForm);
    }
    setIsOutwardModalOpen(false);
  };

  // Expiry analysis
  const today = new Date();
  const allBatchesWithProduct: { product: Product; batch: any; daysToExpiry: number; status: 'fresh' | 'warning' | 'critical' | 'expired' }[] = [];

  products.forEach(p => {
    p.batches.forEach(b => {
      const exp = new Date(b.expiryDate);
      const diffTime = exp.getTime() - today.getTime();
      const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status: 'fresh' | 'warning' | 'critical' | 'expired' = 'fresh';
      if (daysToExpiry < 0) {
        status = 'expired';
      } else if (daysToExpiry <= 90) {
        status = 'critical';
      } else if (daysToExpiry <= 180) {
        status = 'warning';
      }

      allBatchesWithProduct.push({
        product: p,
        batch: b,
        daysToExpiry,
        status
      });
    });
  });

  allBatchesWithProduct.sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  const criticalBatches = allBatchesWithProduct.filter(b => b.status === 'critical' || b.status === 'expired');

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Warehouse Inventory & Batch Control</h1>
          <p className="text-xs text-slate-500">Live depot stock, batch manufacturing & expiry tracking, factory inward receipts</p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => handleOpenOutward()}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>- Stock Out / Adjust</span>
            </button>
            <button
              onClick={() => handleOpenInward()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Receive Stock Inward</span>
            </button>
          </div>
        )}
      </div>

      {/* Critical Expiry Alert Banner */}
      {criticalBatches.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-rose-900">
                Near-Expiry Alert: {criticalBatches.length} Batches expiring within 90 days
              </div>
              <div className="text-xs text-rose-700 mt-0.5">
                Apply clearance discount or push to high-volume supermarket beats immediately.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('expiry')}
            className="text-xs font-semibold text-rose-900 hover:text-rose-950 underline shrink-0 cursor-pointer ml-2"
          >
            Review Batches
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 bg-white px-4 pt-2 rounded-t-lg">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'stock'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Depot Stock Overview ({products.length} SKUs)
        </button>
        <button
          onClick={() => setActiveTab('expiry')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 cursor-pointer ${
            activeTab === 'expiry'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Batch & Expiry Tracker</span>
          {criticalBatches.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold">
              {criticalBatches.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('inward_logs')}
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inward_logs'
              ? 'border-[#2563eb] text-[#2563eb]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Movement Log ({inventoryLogs.length})
        </button>
      </div>

      {/* Tab Content: Stock Overview */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3">Packaging</th>
                  <th className="px-4 py-3 text-center">Available Stock</th>
                  <th className="px-4 py-3 text-center">Reorder Buffer</th>
                  <th className="px-4 py-3 text-right">Valuation</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((product) => {
                    const isLow = product.currentStockCases <= product.reorderLevelCases;
                    const val = product.currentStockCases * product.casePrice;

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{product.name}</div>
                          <div className="font-mono text-[11px] text-slate-500">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#2563eb]">
                          {product.brand}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {product.piecesPerCase} pcs / case
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                          {product.currentStockCases} Cases
                          {product.currentStockLoosePcs > 0 && (
                            <span className="text-slate-500 text-[10px] block font-normal">+{product.currentStockLoosePcs} loose pcs</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600">
                          {product.reorderLevelCases} Cases
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          {formatINR(val)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="status-pill status-warning">
                              Low Stock
                            </span>
                          ) : (
                            <span className="status-pill status-success">
                              Optimal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenInward(product.id)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-slate-100 hover:bg-[#1e293b] hover:text-white text-slate-700 transition-colors cursor-pointer"
                          >
                            + Inward
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Batch & Expiry Tracker */}
      {activeTab === 'expiry' && (
        <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Batch Number</th>
                  <th className="px-4 py-3">Mfg Date</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Days Left</th>
                  <th className="px-4 py-3 text-center">Stock</th>
                  <th className="px-4 py-3">Location Bin</th>
                  <th className="px-4 py-3">Risk Assessment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allBatchesWithProduct.map((item, idx) => {
                  const getBadge = (status: string) => {
                    switch (status) {
                      case 'expired':
                        return 'status-pill status-danger';
                      case 'critical':
                        return 'status-pill status-danger';
                      case 'warning':
                        return 'status-pill status-warning';
                      default:
                        return 'status-pill status-success';
                    }
                  };

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.product.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.product.sku}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {item.batch.batchNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {item.batch.mfgDate}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {item.batch.expiryDate}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {item.daysToExpiry < 0 ? (
                          <span className="text-rose-600 font-bold">Expired</span>
                        ) : (
                          <span className={item.daysToExpiry <= 90 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                            {item.daysToExpiry} days
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-semibold text-slate-900">
                        {item.batch.stockCases} Cases
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {item.batch.warehouseBin || 'A-01'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getBadge(item.status)}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Movement Log */}
      {activeTab === 'inward_logs' && (
        <div className="bg-white rounded-b-lg border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Batch & Ref</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3">Handled By</th>
                  <th className="px-4 py-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryLogs.map((log) => {
                  const isInward = log.type === 'inward' || log.type === 'return_inward';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500">
                        {new Date(log.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-pill ${
                          isInward ? 'status-success' : 'status-info'
                        }`}>
                          {isInward ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span className="capitalize">{log.type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{log.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{log.sku}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        <div>Batch: {log.batchNumber}</div>
                        {log.referenceId && <div className="text-[10px] text-slate-500">Ref: {log.referenceId}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {isInward ? `+${log.cases}` : `-${log.cases}`} Cases
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {log.performedBy}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate" title={log.reason}>
                        {log.reason || 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inward Modal */}
      {isInwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Receive Stock Inward (Factory PO)</h3>
                <p className="text-xs text-slate-500">Record fresh batch dispatch into Aryan Agency depot</p>
              </div>
              <button 
                onClick={() => setIsInwardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitInward} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Product SKU</label>
                <select
                  value={inwardForm.productId}
                  onChange={(e) => setInwardForm({ ...inwardForm, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.brand} - {p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={inwardForm.batchNumber}
                    onChange={(e) => setInwardForm({ ...inwardForm, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier PO / Invoice #</label>
                  <input
                    type="text"
                    required
                    value={inwardForm.supplierInvoice}
                    onChange={(e) => setInwardForm({ ...inwardForm, supplierInvoice: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Manufacturing Date</label>
                  <input
                    type="date"
                    required
                    value={inwardForm.mfgDate}
                    onChange={(e) => setInwardForm({ ...inwardForm, mfgDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={inwardForm.expiryDate}
                    onChange={(e) => setInwardForm({ ...inwardForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cases Received</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={inwardForm.cases}
                    onChange={(e) => setInwardForm({ ...inwardForm, cases: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Loose Pieces</label>
                  <input
                    type="number"
                    min="0"
                    value={inwardForm.loosePcs}
                    onChange={(e) => setInwardForm({ ...inwardForm, loosePcs: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Remarks</label>
                <input
                  type="text"
                  value={inwardForm.reason}
                  onChange={(e) => setInwardForm({ ...inwardForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="Factory dispatch notes"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsInwardModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Inward Receipt
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Stock Out / Adjustment Modal */}
      {isOutwardModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Minus className="w-4 h-4 text-rose-600" />
                <span>Inventory Stock-Out & Damage Adjustment</span>
              </h2>
              <button 
                onClick={() => setIsOutwardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOutward} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select SKU Product *</label>
                <select
                  required
                  value={outwardForm.productId}
                  onChange={(e) => {
                    const prod = products.find(p => p.id === e.target.value);
                    setOutwardForm({
                      ...outwardForm,
                      productId: e.target.value,
                      batchNumber: prod?.batches[0]?.batchNumber || ''
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - In Stock: {p.currentStockCases} cs
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Adjustment Type</label>
                  <select
                    value={outwardForm.type}
                    onChange={(e) => setOutwardForm({ ...outwardForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                  >
                    <option value="damage_adjustment">Damage / Leakage Write-off</option>
                    <option value="sample_deduction">Marketing / Sampling Deduction</option>
                    <option value="expiry_return">Expired Stock Return to Factory</option>
                    <option value="audit_reconciliation">Physical Audit Discrepancy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reference / Note #</label>
                  <input
                    type="text"
                    required
                    value={outwardForm.referenceId}
                    onChange={(e) => setOutwardForm({ ...outwardForm, referenceId: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-rose-50/40 p-3 rounded-lg border border-rose-100">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cases to Deduct</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={outwardForm.cases}
                    onChange={(e) => setOutwardForm({ ...outwardForm, cases: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Loose Pieces</label>
                  <input
                    type="number"
                    min="0"
                    value={outwardForm.loosePcs}
                    onChange={(e) => setOutwardForm({ ...outwardForm, loosePcs: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Reason / Notes *</label>
                <input
                  type="text"
                  required
                  value={outwardForm.reason}
                  onChange={(e) => setOutwardForm({ ...outwardForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="e.g. Moisture damaged carton during warehouse movement"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOutwardModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Deduct & Log Outward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
