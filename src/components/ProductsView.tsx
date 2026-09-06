import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Tag, 
  Boxes, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { Product, ProductCategory, TradeScheme } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface ProductsViewProps {
  products: Product[];
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onInwardStock?: (productId: string) => void;
  onOpenNewOrderWithProduct?: (productId: string) => void;
  onQuickOrder?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Biscuits & Bakery',
  'Beverages',
  'Spices & Staples',
  'Personal Care',
  'Dairy & Refrigerated',
  'Confectionery & Chocolates',
  'Snacks & Namkeen',
  'Household & Hygiene'
];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onInwardStock,
  onOpenNewOrderWithProduct,
  onQuickOrder,
  onAddToCart
}) => {
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewBatchesProduct, setViewBatchesProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const handleBookProduct = (productId: string) => {
    if (onOpenNewOrderWithProduct) {
      onOpenNewOrderWithProduct(productId);
    } else if (onQuickOrder) {
      onQuickOrder(productId);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProductId || !onDeleteProduct) return;
    await onDeleteProduct(deletingProductId);
    setDeletingProductId(null);
  };

  // Extract unique brands
  const brands = Array.from(new Set(products.map(p => p.brand))).sort();

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
    return matchesSearch && matchesCat && matchesBrand;
  });

  const handleOpenAdd = () => {
    setEditingProduct({
      sku: '',
      name: '',
      brand: '',
      category: 'Biscuits & Bakery',
      hsnCode: '19053100',
      gstRate: 18,
      piecesPerCase: 24,
      mrpPiece: 20,
      wholesalePricePiece: 16.5,
      casePrice: 396,
      currentStockCases: 20,
      currentStockLoosePcs: 0,
      reorderLevelCases: 10,
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500',
      batches: [
        {
          batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
          mfgDate: new Date().toISOString().split('T')[0],
          expiryDate: '2027-06-30',
          stockCases: 20,
          stockLoosePcs: 0,
          warehouseBin: 'BAY-A'
        }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    await onSaveProduct(editingProduct);
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Product Master & FMCG SKUs</h1>
          <p className="text-xs text-slate-500">Wholesale pricing, case quantities, GST tax slabs, and live warehouse inventory</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New SKU</span>
          </button>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, Product name, or Brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:bg-white transition-all"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:bg-white"
            >
              <option value="all">All Categories ({products.length})</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:bg-white"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Category Pills Quick Filter */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1e293b] text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1e293b] text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List: Desktop Table (screens >= 768px) & Mobile Android Cards (screens <= 767px) */}
      <div className="hidden md:block bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Product / Brand</th>
                <th className="px-4 py-3">SKU & HSN</th>
                <th className="px-4 py-3">Pack & GST</th>
                <th className="px-4 py-3 text-right">Piece MRP</th>
                <th className="px-4 py-3 text-right">Wholesale Price</th>
                <th className="px-4 py-3 text-right">Case Price</th>
                <th className="px-4 py-3 text-center">Warehouse Stock</th>
                <th className="px-4 py-3">Active Scheme</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const isLowStock = product.currentStockCases <= product.reorderLevelCases;
                const marginPct = Math.round(((product.mrpPiece - product.wholesalePricePiece) / product.mrpPiece) * 100);

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Product Name & Brand */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.imageUrl || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100'}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{product.name}</div>
                          <div className="text-[11px] text-[#2563eb] font-semibold">{product.brand} • <span className="text-slate-500 font-normal">{product.category}</span></div>
                        </div>
                      </div>
                    </td>

                    {/* SKU & HSN */}
                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-900 font-semibold">{product.sku}</div>
                      <div className="text-[11px] text-slate-500 font-mono">HSN: {product.hsnCode}</div>
                    </td>

                    {/* Case Packing & GST */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{product.piecesPerCase} pcs / cs</div>
                      <div className="text-[11px] text-slate-500 font-mono">GST {product.gstRate}%</div>
                    </td>

                    {/* MRP */}
                    <td className="px-4 py-3 text-right font-mono text-slate-500">
                      ₹{product.mrpPiece.toFixed(2)}
                    </td>

                    {/* Wholesale Price Piece */}
                    <td className="px-4 py-3 text-right">
                      <div className="font-mono font-semibold text-slate-900">₹{product.wholesalePricePiece.toFixed(2)}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{marginPct}% Margin</div>
                    </td>

                    {/* Case Price */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(product.casePrice)}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-mono font-bold text-xs ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                          {product.currentStockCases} cs
                        </span>
                        {product.currentStockLoosePcs > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">+{product.currentStockLoosePcs} pcs</span>
                        )}
                        {isLowStock && (
                          <span className="mt-0.5 status-pill status-warning text-[9px]">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Active Scheme */}
                    <td className="px-4 py-3">
                      {product.activeScheme && product.activeScheme.isActive ? (
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#2563eb] text-[11px]">
                          <Tag className="w-3 h-3 shrink-0" />
                          <span className="font-medium max-w-[140px] truncate" title={product.activeScheme.description}>
                            {product.activeScheme.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard Price</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setViewBatchesProduct(product)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="View Batches & Expiry Dates"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {onDeleteProduct && (
                            <button
                              onClick={() => setDeletingProductId(product.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {onAddToCart && (
                        <button
                          onClick={() => onAddToCart(product)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors inline-flex items-center space-x-1 cursor-pointer"
                          title="Add 1 Case to Quick Cart"
                        >
                          <ShoppingCart className="w-3 h-3 text-[#2563eb]" />
                          <span>+ Cart</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleBookProduct(product.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors cursor-pointer"
                      >
                        Book
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE ANDROID PRODUCT CARDS (screens <= 767px)                           */}
      {/* Visual FMCG cards with image, pricing, margins, live stock & action bar   */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((product) => {
          const isLowStock = product.currentStockCases <= product.reorderLevelCases;
          const marginPct = Math.round(((product.mrpPiece - product.wholesalePricePiece) / product.mrpPiece) * 100);

          return (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3 active:border-blue-300 transition-all"
            >
              {/* Top Row: Image + Main Meta */}
              <div className="flex items-start space-x-3">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150'}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {product.brand}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {product.sku}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-tight mt-1 truncate">
                    {product.name}
                  </h3>

                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {product.category} • {product.piecesPerCase} pcs/case
                  </p>
                </div>
              </div>

              {/* Trade Scheme Banner if active */}
              {product.activeScheme && product.activeScheme.isActive && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center space-x-1.5 text-xs text-amber-900">
                  <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="font-semibold">{product.activeScheme.title}</span>
                </div>
              )}

              {/* Price & Stock Stats Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">Case Price</span>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {formatINR(product.casePrice)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ₹{product.wholesalePricePiece.toFixed(2)}/pc • MRP ₹{product.mrpPiece.toFixed(2)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">Depot Stock</span>
                  <div className={`font-mono font-bold text-sm ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                    {product.currentStockCases} Cases
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-600">
                    {marginPct}% Retailer Margin
                  </div>
                </div>
              </div>

              {/* Mobile Action Controls */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => setViewBatchesProduct(product)}
                  className="py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center space-x-1 active:scale-95 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Batches</span>
                </button>

                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(product)}
                    className="py-2 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center space-x-1 active:scale-95 transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-700" />
                    <span>+ Cart</span>
                  </button>
                )}

                <button
                  onClick={() => handleBookProduct(product.id)}
                  className={`py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center space-x-1 active:scale-95 transition-all shadow-xs ${
                    !onAddToCart ? 'col-span-2' : ''
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Order</span>
                </button>
              </div>

              {/* Admin Edit Controls if Admin */}
              {isAdmin && (
                <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="text-blue-600 font-semibold flex items-center space-x-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit SKU</span>
                  </button>
                  {onDeleteProduct && (
                    <button
                      onClick={() => setDeletingProductId(product.id)}
                      className="text-rose-600 font-semibold flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[4px] shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingProduct.id ? 'Edit FMCG Product SKU' : 'Add New FMCG SKU'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                    placeholder="e.g. Parle-G Glucose Biscuit (80g)"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                    placeholder="e.g. Parle, Britannia, Amul, ITC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                    placeholder="PARLE-G-80G"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Biscuits & Bakery'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HSN Code</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.hsnCode || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px] focus:border-[#2B6CB0] focus:outline-none"
                    placeholder="19053100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-[4px] border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pcs per Case</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.piecesPerCase || 24}
                    onChange={(e) => {
                      const pcs = Number(e.target.value);
                      const wp = editingProduct.wholesalePricePiece || 0;
                      setEditingProduct({ 
                        ...editingProduct, 
                        piecesPerCase: pcs,
                        casePrice: pcs * wp
                      });
                    }}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Piece MRP (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingProduct.mrpPiece || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, mrpPiece: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Wholesale / Pc (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={editingProduct.wholesalePricePiece || 0}
                    onChange={(e) => {
                      const wp = Number(e.target.value);
                      const pcs = editingProduct.piecesPerCase || 24;
                      setEditingProduct({ 
                        ...editingProduct, 
                        wholesalePricePiece: wp,
                        casePrice: pcs * wp
                      });
                    }}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Tax Slab</label>
                  <select
                    value={editingProduct.gstRate || 18}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  >
                    <option value={0}>0% (Exempted)</option>
                    <option value={5}>5% (Staples/Oils)</option>
                    <option value={12}>12% (Dairy/Snacks)</option>
                    <option value={18}>18% (Confectionery/FMCG)</option>
                    <option value={28}>28% (Aerated drinks)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Current Stock (Cases)</label>
                  <input
                    type="number"
                    value={editingProduct.currentStockCases || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, currentStockCases: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reorder Level (Cases)</label>
                  <input
                    type="number"
                    value={editingProduct.reorderLevelCases || 10}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reorderLevelCases: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-[4px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Calculated Case Price</label>
                  <div className="px-3 py-2 font-mono font-bold text-[#1A365D] bg-slate-100 border border-slate-200 rounded-[4px]">
                    {formatINR((editingProduct.wholesalePricePiece || 0) * (editingProduct.piecesPerCase || 24))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Product Image URL</label>
                <input
                  type="text"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-[4px]"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              {/* Trade Scheme Settings */}
              <div className="border border-orange-200 bg-orange-50/50 p-3 rounded-[4px] space-y-2">
                <div className="font-semibold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center text-[#DD6B20]">
                    <Tag className="w-3.5 h-3.5 mr-1" /> Active Trade Promotional Scheme
                  </span>
                  <label className="flex items-center space-x-1.5 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.activeScheme?.isActive || false}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setEditingProduct({
                          ...editingProduct,
                          activeScheme: {
                            id: editingProduct.activeScheme?.id || `sch_${Date.now()}`,
                            title: editingProduct.activeScheme?.title || 'Volume Discount',
                            description: editingProduct.activeScheme?.description || 'Discount on bulk order',
                            minQtyCases: editingProduct.activeScheme?.minQtyCases || 5,
                            freeQtyPcs: editingProduct.activeScheme?.freeQtyPcs || 0,
                            discountPercentage: editingProduct.activeScheme?.discountPercentage || 0,
                            isActive: isChecked
                          }
                        });
                      }}
                    />
                    <span>Enable Scheme</span>
                  </label>
                </div>

                {editingProduct.activeScheme?.isActive && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1">Scheme Title</label>
                      <input
                        type="text"
                        value={editingProduct.activeScheme.title}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          activeScheme: { ...editingProduct.activeScheme!, title: e.target.value }
                        })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-[4px]"
                        placeholder="e.g. Monsoon Dhamaka"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1">Min Cases</label>
                      <input
                        type="number"
                        value={editingProduct.activeScheme.minQtyCases}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          activeScheme: { ...editingProduct.activeScheme!, minQtyCases: Number(e.target.value) }
                        })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-[4px]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 text-[11px] mb-1">Free Pcs Awarded</label>
                      <input
                        type="number"
                        value={editingProduct.activeScheme.freeQtyPcs || 0}
                        onChange={(e) => setEditingProduct({
                          ...editingProduct,
                          activeScheme: { ...editingProduct.activeScheme!, freeQtyPcs: Number(e.target.value) }
                        })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-[4px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-[4px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#DD6B20] hover:bg-[#C05621] text-white font-semibold rounded-[4px] shadow-xs"
                >
                  Save FMCG SKU
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* View Batches Modal */}
      {viewBatchesProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[4px] shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{viewBatchesProduct.name}</h3>
                <p className="text-xs text-slate-500 font-mono">SKU: {viewBatchesProduct.sku} • Bin Allocations</p>
              </div>
              <button 
                onClick={() => setViewBatchesProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Active Warehouse Batches:</div>
              {viewBatchesProduct.batches.map((batch, idx) => (
                <div key={idx} className="p-3 rounded-[4px] bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{batch.batchNumber}</div>
                    <div className="text-[11px] text-slate-500">
                      Mfg: {batch.mfgDate} • <span className="font-semibold text-rose-700">Exp: {batch.expiryDate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-[#1A365D]">{batch.stockCases} Cases</div>
                    <div className="text-[10px] text-slate-500 font-mono">Bin {batch.warehouseBin || 'A-01'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const pId = viewBatchesProduct.id;
                  setViewBatchesProduct(null);
                  onInwardStock(pId);
                }}
                className="text-xs font-semibold text-[#2B6CB0] hover:underline"
              >
                + Inward New Batch
              </button>
              <button
                onClick={() => setViewBatchesProduct(null)}
                className="px-3.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-[4px] font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Product SKU?</h3>
                <p className="text-[11px] text-slate-500">This action will remove the SKU from active catalog.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{products.find(p => p.id === deletingProductId)?.name}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete SKU
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
