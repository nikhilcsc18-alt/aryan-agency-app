import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ScanLine, 
  Camera, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  Zap, 
  RefreshCw, 
  Keyboard, 
  Flashlight, 
  FlashlightOff, 
  CameraOff,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
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
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'aryan-barcode-scanner-viewport';

  // Play audio beep on successful scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted
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
    if (partialMatch) return partialMatch;

    // 4. Name match
    const byName = products.find(p => p.name.toLowerCase().includes(cleanCode));
    return byName || null;
  };

  const handleBarcodeSuccess = (decodedText: string) => {
    // If the exact same barcode is already showing, don't trigger repeatedly
    if (lastScannedCode === decodedText && scannedProduct) {
      return;
    }

    playBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch (e) {
        // Ignore
      }
    }

    setLastScannedCode(decodedText);
    const product = findProductByCode(decodedText);
    if (product) {
      setScannedProduct(product);
      setScanError(null);
    } else {
      setScanError(`बारकोड "${decodedText}" के साथ कोई प्रोडक्ट मैच नहीं हुआ। कृपया SKU चेक करें।`);
      setScannedProduct(null);
    }
  };

  const startScanner = async () => {
    try {
      const element = document.getElementById(scannerContainerId);
      if (!element) return;

      // Stop any existing instance
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          // ignore
        }
      }

      setPermissionState('requesting');
      setScanError(null);

      // Explicitly register all standard 1D and 2D FMCG retail barcodes
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.ITF
      ];

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport,
        verbose: false
      });
      scannerRef.current = html5QrCode;

      setIsScanning(true);
      await html5QrCode.start(
        { facingMode: cameraFacing },
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            // Horizontal rectangular scanning target box for standard 1D FMCG barcodes
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.max(220, Math.floor(minEdge * 0.85)),
              height: Math.max(120, Math.floor(minEdge * 0.55))
            };
          },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleBarcodeSuccess(decodedText);
        },
        () => {
          // Normal frame scan tick
        }
      );

      setPermissionState('granted');

      // Check if torch/flash is supported on the back camera
      try {
        const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
        if (capabilities && (capabilities as any).torchFeature?.().isSupported()) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn('Camera barcode scanner error:', err);
      setIsScanning(false);
      setPermissionState('denied');
      const errString = String(err?.message || err);
      if (errString.includes('NotAllowedError') || errString.includes('Permission') || errString.includes('denied')) {
        setScanError('कैमरा परमिशन नहीं मिली (Permission Denied). कृपया ब्राउज़र या फ़ोन में कैमरा Allow करें या नीचे बारकोड नंबर टाइप करें।');
      } else if (errString.includes('NotFoundError') || errString.includes('DevicesNotFoundError')) {
        setScanError('कोई कैमरा डिवाइस नहीं मिला। कृपया नीचे बारकोड नंबर डालकर सर्च करें।');
      } else {
        setScanError('कैमरा शुरू नहीं हो पाया। आप नीचे दिए गए इनपुट से बारकोड या SKU सर्च कर सकते हैं।');
      }
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
    setIsTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !isScanning) return;
    try {
      const nextTorch = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any]
      });
      setIsTorchOn(nextTorch);
    } catch (err) {
      console.warn('Could not toggle torch:', err);
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
    setLastScannedCode(null);

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

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;

    const product = findProductByCode(manualCode);
    if (product) {
      playBeep();
      setScannedProduct(product);
      setScanError(null);
    } else {
      setScanError(`SKU / बारकोड "${manualCode}" से कोई प्रोडक्ट नहीं मिला। नीचे दिए गए डेमो बारकोड से टेस्ट करें।`);
      setScannedProduct(null);
    }
  };

  const handleConfirmProduct = () => {
    if (!scannedProduct) return;
    onProductFound(scannedProduct);
    onClose();
  };

  const handleScanNext = () => {
    setScannedProduct(null);
    setLastScannedCode(null);
    setScanError(null);
  };

  if (!isOpen) return null;

  // Curated demo barcodes for quick instant testing
  const demoBarcodes = [
    { name: 'Parle-G 80g', code: '8901063012345', sku: 'PARLE-G-80G' },
    { name: 'Good Day Butter 100g', code: '8901030383742', sku: 'BRIT-GD-BUTTER-100G' },
    { name: 'Sunfeast Mom’s Magic', code: '8901725181223', sku: 'ITC-SUNFEAST-MOM-CHOC' },
    { name: 'Tata Tea Gold 500g', code: '8901052002134', sku: 'TATA-TEA-GOLD-500G' },
    { name: 'Nestle Maggi 70g', code: '8901058852331', sku: 'NESTLE-MAGGI-70G' },
    { name: 'Cadbury Dairy Milk', code: '8901233024567', sku: 'CADBURY-DM-SILK-60G' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#0a192f] via-[#102a43] to-[#1e3a8a] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-black tracking-tight text-white">बारकोड स्कैनर (Barcode Scanner)</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-400/30">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-blue-200">Camera permission enabled • EAN-13, SKU & Gun reader</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="bg-slate-100 p-1.5 flex items-center border-b border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>लाइव कैमरा स्कैनर (Camera)</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4 text-blue-600" />
            <span>मैन्युअल / गन इनपुट (Manual)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 space-y-3.5">
          
          {/* TAB 1: Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[240px] flex items-center justify-center border-2 border-slate-800 shadow-inner">
                <div id={scannerContainerId} className="w-full h-full min-h-[240px]" />
                
                {/* Visual Target Reticle Overlay */}
                {isScanning && !scannedProduct && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <div className="w-64 h-32 border-2 border-dashed border-emerald-400/90 rounded-2xl relative bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br" />

                      {/* Animated scanning red/laser line */}
                      <div className="absolute left-1 right-1 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
                      
                      <div className="absolute -bottom-6 left-0 right-0 text-center">
                        <span className="text-[10.5px] bg-slate-900/90 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 tracking-wide uppercase">
                          बारकोड को बॉक्स में रखें
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Permission Denied UI in viewport */}
                {permissionState === 'denied' && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-5 text-center text-white space-y-2.5 z-20">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                      <CameraOff className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-xs">
                      <h4 className="font-bold text-sm text-white">कैमरा परमिशन ब्लॉक है</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        बारकोड स्कैन करने के लिए ब्राउज़र या फ़ोन में Camera Allow करें।
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startScanner}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>कैमरा दोबारा चालू करें</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Action Controls Bar */}
              <div className="flex items-center justify-between text-xs px-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-600 flex items-center space-x-1.5 text-[11px] font-medium">
                  <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  <span>{isScanning ? 'कैमरा स्कैनर सक्रिय (Scanning...)' : 'कैमरा बंद'}</span>
                </span>

                <div className="flex items-center space-x-2">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                        isTorchOn 
                          ? 'bg-amber-100 text-amber-900 border-amber-300' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isTorchOn ? <Flashlight className="w-3 h-3 text-amber-600" /> : <FlashlightOff className="w-3 h-3" />}
                      <span>{isTorchOn ? 'Torch On' : 'Torch'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')}
                    className="px-2.5 py-1 text-slate-700 hover:bg-slate-200/80 bg-white rounded-lg border border-slate-200 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Switch Front / Back Camera"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-600" />
                    <span>{cameraFacing === 'environment' ? 'Back Cam' : 'Front Cam'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Manual / USB Input */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>बारकोड नंबर या SKU कोड दर्ज करें:</span>
                </label>
                <div className="relative">
                  <ScanLine className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="उदा: 8901063012345 या PARLE-G-80G"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="w-full pl-9 pr-24 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 shadow-inner font-bold"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
                  >
                    सर्च करें
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  USB व Bluetooth लेज़र बारकोड गन सीधे इस फील्ड में रीड करती है।
                </p>
              </div>
            </form>
          )}

          {/* Error Alert */}
          {scanError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">{scanError}</span>
              </div>
            </div>
          )}

          {/* Product Match Card (Instant Result on Scan) */}
          {scannedProduct && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 rounded-2xl border-2 border-emerald-400 p-3.5 space-y-3 shadow-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-14 h-14 rounded-xl bg-white border border-emerald-300 p-1 flex items-center justify-center shrink-0 shadow-xs">
                    <img 
                      src={scannedProduct.imageUrl} 
                      alt={scannedProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain rounded" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] px-2 py-0.5 font-black rounded-full bg-emerald-600 text-white uppercase tracking-wider flex items-center space-x-1 shadow-xs">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>मैच मिला (Matched)</span>
                      </span>
                      <span className="text-[11px] text-emerald-800 font-mono font-bold">
                        {getProductBarcode(scannedProduct)}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 text-xs mt-1 leading-tight">{scannedProduct.name}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {scannedProduct.brand} • SKU: <span className="font-mono font-semibold">{scannedProduct.sku}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">थोक भाव</span>
                  <span className="text-sm font-black font-mono text-emerald-700">
                    {formatINR(scannedProduct.wholesalePricePiece)} / pc
                  </span>
                  <span className="text-[10.5px] text-slate-600 block font-mono font-bold">
                    {formatINR(scannedProduct.casePrice)} / case
                  </span>
                </div>
              </div>

              {/* Stock and Margin Badge */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-2 rounded-xl border border-emerald-200 font-semibold">
                <div className="text-slate-700">
                  डिपो स्टॉक: <strong className="text-emerald-800 font-mono">{scannedProduct.currentStockCases} कार्टन</strong>
                </div>
                <div className="text-right text-emerald-800">
                  रिटेलर मार्जिन: <strong className="font-mono text-emerald-700">{scannedProduct.retailerMarginPercent}%</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleScanNext}
                  className="px-3 py-2 text-slate-700 hover:bg-white bg-slate-100 rounded-xl font-bold text-xs border border-slate-300 cursor-pointer transition-colors"
                >
                  दूसरा बारकोड स्कैन करें
                </button>

                <button
                  type="button"
                  onClick={handleConfirmProduct}
                  className="flex-1 py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black rounded-xl shadow-md flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <span>प्रोडक्ट खोलें व आर्डर करें</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Instant Sample Barcode Clickers (Helpful for quick test / demo) */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
              तुरंत टेस्ट के लिए मुख्य FMCG प्रोडक्ट्स (Quick Demo Barcodes):
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
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 rounded-lg border border-slate-200 font-medium transition-colors text-slate-700 cursor-pointer"
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
