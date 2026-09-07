import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ScanLine, 
  Camera, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Package, 
  ArrowRight,
  Zap,
  Volume2,
  RefreshCw,
  Keyboard
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product } from '../types';
import { formatINR } from '../lib/api';

// Standard Indian FMCG EAN-13 Barcode map for catalog SKUs
export const PRODUCT_BARCODE_MAP: Record<string, string> = {
  'PARLE-G-80G': '8901063012345',
  'BRIT-GD-BUTTER-100G': '8901030383742',
  'ITC-SUNFEAST-MOM-CHOC': '8901725181223',
  'TATA-TEA-GOLD-500G': '8901052002134',
  'NESTLE-MAGGI-70G': '8901058852331',
  'CADBURY-DM-SILK-60G': '8901233024567',
  'AMUL-TAAZA-1L': '8901262010011',
  'EVEREST-GARAM-MASALA-100G': '8901786010045',
  'HALDIRAMS-BHUJIA-400G': '8904063200118',
  'DABUR-RED-PASTE-200G': '8901207010032'
};

export const getProductBarcode = (product: Product): string => {
  if (product.barcode) return product.barcode;
  if (PRODUCT_BARCODE_MAP[product.sku]) return PRODUCT_BARCODE_MAP[product.sku];
  // Deterministic 13-digit EAN-13 barcode based on SKU
  const hash = Math.abs(product.sku.split('').reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000000, 0));
  return `890${String(hash).padStart(9, '0')}1`;
};

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductFound: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductFound
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'aryan-barcode-scanner-viewport';

  // Play audio beep on successful scan
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  // Find product matching a scanned/entered code
  const findProductByCode = (code: string): Product | null => {
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode) return null;

    // 1. Direct barcode match
    const byBarcode = products.find(p => {
      const bCode = getProductBarcode(p).toLowerCase();
      return bCode === cleanCode || p.barcode?.toLowerCase() === cleanCode;
    });
    if (byBarcode) return byBarcode;

    // 2. Direct SKU match
    const bySku = products.find(p => p.sku.toLowerCase() === cleanCode);
    if (bySku) return bySku;

    // 3. Partial match on SKU or barcode
    const partialMatch = products.find(p => {
      const bCode = getProductBarcode(p).toLowerCase();
      return bCode.includes(cleanCode) || p.sku.toLowerCase().includes(cleanCode);
    });

    return partialMatch || null;
  };

  const handleBarcodeSuccess = (decodedText: string) => {
    playBeep();
    const product = findProductByCode(decodedText);
    if (product) {
      setScannedProduct(product);
      setScanError(null);
    } else {
      setScanError(`No product found in catalog matching barcode: "${decodedText}".`);
      setScannedProduct(null);
    }
  };

  // Camera start / stop lifecycle
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopScanner();
      return;
    }

    let isMounted = true;
    setScanError(null);
    setScannedProduct(null);

    const timer = setTimeout(() => {
      if (!isMounted) return;
      startScanner();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, activeTab, cameraFacing]);

  const startScanner = async () => {
    try {
      const element = document.getElementById(scannerContainerId);
      if (!element) return;

      // Stop any existing instance first
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      setIsScanning(true);
      await html5QrCode.start(
        { facingMode: cameraFacing },
        {
          fps: 15,
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleBarcodeSuccess(decodedText);
        },
        () => {
          // Frame error (normal when barcode not in view)
        }
      );
    } catch (err: any) {
      console.warn('Camera barcode scanner error:', err);
      setIsScanning(false);
      setScanError('Camera access unavailable or permission denied. You can still scan using the manual barcode input below.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;

    const product = findProductByCode(manualCode);
    if (product) {
      playBeep();
      setScannedProduct(product);
      setScanError(null);
    } else {
      setScanError(`No SKU found matching "${manualCode}". Try using one of the sample barcodes below.`);
      setScannedProduct(null);
    }
  };

  const handleConfirmProduct = () => {
    if (!scannedProduct) return;
    onProductFound(scannedProduct);
    onClose();
  };

  if (!isOpen) return null;

  // Curated demo barcodes for quick instant testing
  const demoBarcodes = [
    { name: 'Parle-G 80g', code: '8901063012345', sku: 'PARLE-G-80G' },
    { name: 'Good Day 100g', code: '8901030383742', sku: 'BRIT-GD-BUTTER-100G' },
    { name: 'Sunfeast Mom’s', code: '8901725181223', sku: 'ITC-SUNFEAST-MOM-CHOC' },
    { name: 'Tata Tea Gold', code: '8901052002134', sku: 'TATA-TEA-GOLD-500G' },
    { name: 'Maggi Noodles', code: '8901058852331', sku: 'NESTLE-MAGGI-70G' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-[#1e293b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">FMCG Product Barcode Scanner</h3>
              <p className="text-[11px] text-slate-300">Scan EAN-13, SKU barcode or laser gun input</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100 p-1.5 flex items-center border-b border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Live Camera Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Barcode / USB Gun Input</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          
          {/* TAB 1: Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[220px] flex items-center justify-center border border-slate-800">
                <div id={scannerContainerId} className="w-full h-full" />
                
                {/* Visual Target Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-36 border-2 border-dashed border-emerald-400/80 rounded-xl relative">
                    {/* Animated scanning laser line */}
                    <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
                    <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] text-emerald-300 font-mono tracking-wider uppercase">
                      Align Barcode in Box
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500 flex items-center space-x-1 text-[11px]">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Autofocus active</span>
                </span>

                <button
                  type="button"
                  onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
                  className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Switch Camera</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Manual / USB Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Barcode Number or SKU
                </label>
                <div className="relative">
                  <ScanLine className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. 8901063012345 or PARLE-G-80G"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="w-full pl-9 pr-20 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] text-slate-900"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#2563eb] text-white font-bold text-xs rounded-lg hover:bg-[#1d4ed8] cursor-pointer"
                  >
                    Search
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hardware USB and Bluetooth barcode scanners automatically submit on trigger.
                </p>
              </div>
            </form>
          )}

          {/* Error Alert */}
          {scanError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{scanError}</span>
              </div>
            </div>
          )}

          {/* Product Match Card */}
          {scannedProduct && (
            <div className="bg-emerald-50/70 rounded-xl border border-emerald-300 p-3.5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-emerald-200 p-1 flex items-center justify-center shrink-0">
                    <img 
                      src={scannedProduct.imageUrl} 
                      alt={scannedProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] px-1.5 py-0.2 font-bold rounded bg-emerald-600 text-white uppercase">
                        Matched SKU
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {getProductBarcode(scannedProduct)}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mt-0.5">{scannedProduct.name}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {scannedProduct.brand} • {scannedProduct.category}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Wholesale Rate</span>
                  <span className="text-sm font-bold font-mono text-emerald-800">
                    {formatINR(scannedProduct.wholesalePricePiece)} / pc
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {formatINR(scannedProduct.casePrice)} / case
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 text-[11px]">
                  Depot Stock: <strong className="text-slate-900">{scannedProduct.currentStockCases} Cases</strong>
                </span>

                <button
                  type="button"
                  onClick={handleConfirmProduct}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <span>Select & Open Product</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Instant Sample Barcode Clickers */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Test Product Barcodes:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {demoBarcodes.map(demo => (
                <button
                  key={demo.sku}
                  type="button"
                  onClick={() => {
                    setManualCode(demo.code);
                    const p = findProductByCode(demo.code);
                    if (p) {
                      playBeep();
                      setScannedProduct(p);
                      setScanError(null);
                    }
                  }}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-md border border-slate-200 font-mono transition-colors text-slate-700 cursor-pointer"
                  title={`Barcode: ${demo.code}`}
                >
                  <span>{demo.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
