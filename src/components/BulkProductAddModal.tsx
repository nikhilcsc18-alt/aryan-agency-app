import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Layers, 
  Package, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Product, ProductCategory, ProductPackingOption } from '../types';
import { createPackingOption, calculateMarginPercentage } from '../lib/packingUtils';
import { formatINR } from '../lib/api';

interface BulkProductRow {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  mrpPiece: number;
  wholesalePricePiece: number;
  piecesPerCase: number;
  currentStockCases: number;
  // ApnaClub Packing 1 (e.g. Pack of 10)
  pack1Name: string;
  pack1Pieces: number;
  pack1Selling: number;
  pack1Mrp: number;
  // ApnaClub Packing 2 (e.g. Pack of 40)
  pack2Name: string;
  pack2Pieces: number;
  pack2Selling: number;
  pack2Mrp: number;
}

interface BulkProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (products: Partial<Product>[]) => Promise<void> | void;
  existingBrands: string[];
  categories: ProductCategory[];
}

const DEFAULT_CATEGORIES: ProductCategory[] = [
  'Biscuits & Bakery',
  'Beverages',
  'Spices & Staples',
  'Personal Care',
  'Dairy & Refrigerated',
  'Confectionery & Chocolates',
  'Snacks & Namkeen',
  'Household & Hygiene'
];

function createEmptyRow(brand: string = 'Parle', category: ProductCategory = 'Biscuits & Bakery'): BulkProductRow {
  return {
    id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: '',
    brand,
    category,
    mrpPiece: 10,
    wholesalePricePiece: 8,
    piecesPerCase: 40,
    currentStockCases: 25,
    pack1Name: 'Pack of 10',
    pack1Pieces: 10,
    pack1Selling: 80,
    pack1Mrp: 100,
    pack2Name: 'Pack of 40',
    pack2Pieces: 40,
    pack2Selling: 300,
    pack2Mrp: 400
  };
}

export const BulkProductAddModal: React.FC<BulkProductAddModalProps> = ({
  isOpen,
  onClose,
  onSaveBatch,
  existingBrands = [],
  categories = DEFAULT_CATEGORIES
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'paste'>('grid');
  const [rows, setRows] = useState<BulkProductRow[]>([
    createEmptyRow('Parle', 'Biscuits & Bakery'),
    createEmptyRow('Britannia', 'Biscuits & Bakery'),
    createEmptyRow('ITC Sunfeast', 'Biscuits & Bakery')
  ]);
  const [pasteText, setPasteText] = useState('');
  const [bulkBrand, setBulkBrand] = useState('');
  const [bulkCategory, setBulkCategory] = useState<ProductCategory | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows(prev => [...prev, createEmptyRow(bulkBrand || 'Parle', (bulkCategory as ProductCategory) || 'Biscuits & Bakery')]);
  };

  const handleAddMultipleRows = (count: number = 5) => {
    const newRows: BulkProductRow[] = [];
    for (let i = 0; i < count; i++) {
      newRows.push(createEmptyRow(bulkBrand || 'Parle', (bulkCategory as ProductCategory) || 'Biscuits & Bakery'));
    }
    setRows(prev => [...prev, ...newRows]);
  };

  const handleDuplicateRow = (index: number) => {
    const target = rows[index];
    const duplicated: BulkProductRow = {
      ...target,
      id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: target.name ? `${target.name} (Copy)` : ''
    };
    setRows(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, duplicated);
      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      alert('At least one product row is required.');
      return;
    }
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof BulkProductRow, value: any) => {
    setRows(prev => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      // Auto-recalculate pack prices if mrpPiece or wholesalePricePiece changed
      if (field === 'mrpPiece') {
        const mrp = Number(value) || 10;
        row.pack1Mrp = Math.round(mrp * row.pack1Pieces);
        row.pack2Mrp = Math.round(mrp * row.pack2Pieces);
      }
      if (field === 'wholesalePricePiece') {
        const rate = Number(value) || 8;
        row.pack1Selling = Math.round(rate * row.pack1Pieces);
        // Bulk pack gets 4% extra discount
        row.pack2Selling = Math.round(rate * row.pack2Pieces * 0.96);
      }
      if (field === 'pack1Pieces') {
        const pcs = Number(value) || 1;
        row.pack1Name = `Pack of ${pcs}`;
        row.pack1Mrp = Math.round(row.mrpPiece * pcs);
        row.pack1Selling = Math.round(row.wholesalePricePiece * pcs);
      }
      if (field === 'pack2Pieces') {
        const pcs = Number(value) || 1;
        row.pack2Name = `Pack of ${pcs}`;
        row.pack2Mrp = Math.round(row.mrpPiece * pcs);
        row.pack2Selling = Math.round(row.wholesalePricePiece * pcs * 0.96);
      }

      next[index] = row;
      return next;
    });
  };

  const handleApplyBulkBrand = () => {
    if (!bulkBrand) return;
    setRows(prev => prev.map(r => ({ ...r, brand: bulkBrand })));
  };

  const handleApplyBulkCategory = () => {
    if (!bulkCategory) return;
    setRows(prev => prev.map(r => ({ ...r, category: bulkCategory as ProductCategory })));
  };

  // Parse Excel / WhatsApp tab-separated or pipe-separated lines
  const handleParsePasteText = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsedRows: BulkProductRow[] = [];

    for (const line of lines) {
      // Split by tab, pipe, or comma
      const parts = line.includes('\t') 
        ? line.split('\t') 
        : line.includes('|') 
        ? line.split('|') 
        : line.split(',');

      const cleanParts = parts.map(p => p.trim());
      if (cleanParts.length === 0 || !cleanParts[0]) continue;

      const name = cleanParts[0];
      const brand = cleanParts[1] || bulkBrand || 'Parle';
      const category = (cleanParts[2] && DEFAULT_CATEGORIES.includes(cleanParts[2] as any))
        ? (cleanParts[2] as ProductCategory)
        : (bulkCategory as ProductCategory) || 'Biscuits & Bakery';

      const mrp = Number(cleanParts[3]) || 10;
      const wholesale = Number(cleanParts[4]) || Math.round(mrp * 0.8);
      const pcs1 = Number(cleanParts[5]) || 10;
      const sell1 = Number(cleanParts[6]) || Math.round(wholesale * pcs1);
      const pcs2 = Number(cleanParts[7]) || 40;
      const sell2 = Number(cleanParts[8]) || Math.round(wholesale * pcs2 * 0.95);
      const stock = Number(cleanParts[9]) || 30;

      parsedRows.push({
        id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name,
        brand,
        category,
        mrpPiece: mrp,
        wholesalePricePiece: wholesale,
        piecesPerCase: pcs2,
        currentStockCases: stock,
        pack1Name: `Pack of ${pcs1}`,
        pack1Pieces: pcs1,
        pack1Selling: sell1,
        pack1Mrp: mrp * pcs1,
        pack2Name: `Pack of ${pcs2}`,
        pack2Pieces: pcs2,
        pack2Selling: sell2,
        pack2Mrp: mrp * pcs2
      });
    }

    if (parsedRows.length > 0) {
      setRows(parsedRows);
      setActiveTab('grid');
      setPasteText('');
    } else {
      alert('Could not parse text. Make sure lines have product name and values separated by tabs, commas, or pipes.');
    }
  };

  const handleSaveAll = async () => {
    setSaveError(null);

    // Validate rows
    const invalidRow = rows.find((r, idx) => !r.name.trim());
    if (invalidRow) {
      setSaveError(`Product row #${rows.indexOf(invalidRow) + 1} has an empty product name. Please provide a name.`);
      return;
    }

    try {
      setIsSaving(true);

      const productsToSave: Partial<Product>[] = rows.map((r, idx) => {
        const p1Margin = calculateMarginPercentage(r.pack1Mrp, r.pack1Selling);
        const p2Margin = calculateMarginPercentage(r.pack2Mrp, r.pack2Selling);

        const packingOptions: ProductPackingOption[] = [
          createPackingOption(r.pack1Name, r.pack1Pieces, r.pack1Selling, r.pack1Mrp, true),
          createPackingOption(r.pack2Name, r.pack2Pieces, r.pack2Selling, r.pack2Mrp, false)
        ];

        const piecesPerCase = r.piecesPerCase || r.pack2Pieces || 40;
        const casePrice = Math.round(r.wholesalePricePiece * piecesPerCase);

        return {
          id: `prd_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          sku: `${r.brand.toUpperCase().replace(/\s+/g, '')}-${r.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${piecesPerCase}`,
          name: r.name.trim(),
          brand: r.brand.trim() || 'General',
          category: r.category,
          hsnCode: '19053100',
          gstRate: 18,
          piecesPerCase,
          mrpPiece: r.mrpPiece,
          wholesalePricePiece: r.wholesalePricePiece,
          casePrice,
          currentStockCases: r.currentStockCases,
          currentStockLoosePcs: 0,
          reorderLevelCases: 10,
          packingOptions,
          imageUrl: '',
          batches: [
            {
              batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
              mfgDate: new Date().toISOString().slice(0, 10),
              expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              stockCases: r.currentStockCases,
              stockLoosePcs: 0
            }
          ]
        };
      });

      await onSaveBatch(productsToSave);
      onClose();
    } catch (err: any) {
      console.error('Failed to save bulk products', err);
      setSaveError(err.message || 'Error saving products. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black">
                  Multiple Product Add (एक साथ कई Products जोड़ें)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Aryan Agency Pricing & Margin
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-300">
                Add multiple SKUs with tiered packing options (Pack of 1, 2, 10 &amp; 40) in a single fast session.
              </p>
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

        {/* Tab Selector & Fast Action Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table Entry ({rows.length} Items)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                activeTab === 'paste' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paste from Excel / WhatsApp</span>
            </button>
          </div>

          {/* Mass-Apply Brand & Category */}
          {activeTab === 'grid' && (
            <div className="flex items-center space-x-2 flex-wrap text-xs">
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  placeholder="Brand for all (e.g. Parle)"
                  value={bulkBrand}
                  onChange={(e) => setBulkBrand(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg w-36"
                />
                <button
                  type="button"
                  onClick={handleApplyBulkBrand}
                  disabled={!bulkBrand}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 rounded-lg font-semibold text-slate-700 cursor-pointer"
                >
                  Apply
                </button>
              </div>

              <div className="flex items-center space-x-1">
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as any)}
                  className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="">Category for all...</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyBulkCategory}
                  disabled={!bulkCategory}
                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 rounded-lg font-semibold text-slate-700 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          
          {saveError && (
            <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* TAB 1: INTERACTIVE TABLE */}
          {activeTab === 'grid' && (
            <div className="space-y-3">
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-2 w-8 text-center">#</th>
                      <th className="p-2 min-w-[200px]">Product Name *</th>
                      <th className="p-2 w-28">Brand</th>
                      <th className="p-2 w-32">Category</th>
                      <th className="p-2 w-16 text-center">MRP/pc</th>
                      <th className="p-2 w-16 text-center">Rate/pc</th>
                      {/* ApnaClub Packing Tier 1 */}
                      <th className="p-2 min-w-[170px] bg-amber-50/70 border-x border-amber-200 text-amber-900">
                        Tier 1: Pack of 10
                      </th>
                      {/* ApnaClub Packing Tier 2 */}
                      <th className="p-2 min-w-[170px] bg-emerald-50/70 border-r border-emerald-200 text-emerald-900">
                        Tier 2: Pack of 40 (Best Margin)
                      </th>
                      <th className="p-2 w-16 text-center">Stock (Cs)</th>
                      <th className="p-2 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.map((row, idx) => {
                      const p1Margin = calculateMarginPercentage(row.pack1Mrp, row.pack1Selling);
                      const p2Margin = calculateMarginPercentage(row.pack2Mrp, row.pack2Selling);

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2 text-center text-slate-400 font-mono font-bold">
                            {idx + 1}
                          </td>

                          {/* Product Name */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="e.g. Parle Hide & Seek 120g"
                              value={row.name}
                              onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Brand */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Brand"
                              value={row.brand}
                              onChange={(e) => handleRowChange(idx, 'brand', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-slate-800"
                            />
                          </td>

                          {/* Category */}
                          <td className="p-2">
                            <select
                              value={row.category}
                              onChange={(e) => handleRowChange(idx, 'category', e.target.value as any)}
                              className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-[11px]"
                            >
                              {categories.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>

                          {/* Single MRP */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={row.mrpPiece}
                              onChange={(e) => handleRowChange(idx, 'mrpPiece', Number(e.target.value))}
                              className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-center"
                            />
                          </td>

                          {/* Single Wholesale Price */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={row.wholesalePricePiece}
                              onChange={(e) => handleRowChange(idx, 'wholesalePricePiece', Number(e.target.value))}
                              className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-center"
                            />
                          </td>

                          {/* Tier 1 Packing */}
                          <td className="p-2 bg-amber-50/40 border-x border-amber-200">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500">Pcs:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={row.pack1Pieces}
                                  onChange={(e) => handleRowChange(idx, 'pack1Pieces', Number(e.target.value))}
                                  className="w-10 px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-center text-xs"
                                />
                                <span className="text-[10px] text-slate-500">₹:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={row.pack1Selling}
                                  onChange={(e) => handleRowChange(idx, 'pack1Selling', Number(e.target.value))}
                                  className="w-14 px-1 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-center text-xs text-amber-950"
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-mono">₹{(row.pack1Selling / (row.pack1Pieces || 1)).toFixed(2)}/pc</span>
                                <span className="font-bold text-emerald-700 bg-emerald-100/80 px-1.5 rounded">
                                  +{p1Margin}%
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Tier 2 Packing (Value pack with higher margin) */}
                          <td className="p-2 bg-emerald-50/40 border-r border-emerald-200">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-slate-500">Pcs:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={row.pack2Pieces}
                                  onChange={(e) => handleRowChange(idx, 'pack2Pieces', Number(e.target.value))}
                                  className="w-10 px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-center text-xs"
                                />
                                <span className="text-[10px] text-slate-500">₹:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={row.pack2Selling}
                                  onChange={(e) => handleRowChange(idx, 'pack2Selling', Number(e.target.value))}
                                  className="w-14 px-1 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-center text-xs text-emerald-950"
                                />
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-mono">₹{(row.pack2Selling / (row.pack2Pieces || 1)).toFixed(2)}/pc</span>
                                <span className="font-black text-emerald-800 bg-emerald-200/90 px-1.5 rounded">
                                  +{p2Margin}%
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Stock in Cases */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={row.currentStockCases}
                              onChange={(e) => handleRowChange(idx, 'currentStockCases', Number(e.target.value))}
                              className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded font-mono text-center"
                            />
                          </td>

                          {/* Row Actions */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleDuplicateRow(idx)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 cursor-pointer"
                                title="Duplicate row"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Row Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add 1 Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddMultipleRows(5)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add 5 Rows</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Total SKUs to Add: <strong className="text-slate-900">{rows.length}</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COPY-PASTE FROM EXCEL OR WHATSAPP */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>How to Paste Wholesale Rate Lists:</span>
                </div>
                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  Copy rows from Excel, Google Sheets, or WhatsApp and paste below. The parser supports columns separated by Tabs, Commas, or Pipes:
                  <br />
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200 text-[10.5px] text-blue-800 mt-1 inline-block">
                    Product Name | Brand | Category | MRP | Rate | Pack1 Pcs | Pack1 Rate | Pack2 Pcs | Pack2 Rate | Stock
                  </code>
                </p>
              </div>

              <textarea
                rows={10}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Example:\nParle 20-20 Cashew 100g\tParle\tBiscuits & Bakery\t20\t16\t10\t160\t40\t600\t50\nGood Day Cashew 100g\tBritannia\tBiscuits & Bakery\t25\t20\t12\t240\t48\t900\t40`}
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPasteText('')}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Clear Text
                </button>
                <button
                  type="button"
                  onClick={handleParsePasteText}
                  disabled={!pasteText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse &amp; Load into Table</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || rows.length === 0}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
          >
            {isSaving ? (
              <span>Saving {rows.length} Products...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All {rows.length} Products (सब जोड़ें)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
