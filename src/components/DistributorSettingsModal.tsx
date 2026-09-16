import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Check, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Truck,
  Percent,
  ShieldCheck,
  AlertTriangle,
  Info,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';
import { useDistributorSettings } from '../lib/settings';

interface DistributorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const DistributorSettingsModal: React.FC<DistributorSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const { settings, updateSettings } = useDistributorSettings();

  const [allowCOD, setAllowCOD] = useState(settings.allowCOD);
  const [mandatoryOnlinePayment, setMandatoryOnlinePayment] = useState(settings.mandatoryOnlinePayment);
  const [upiVpa, setUpiVpa] = useState(settings.upiVpa);
  const [upiPayeeName, setUpiPayeeName] = useState(settings.upiPayeeName);
  
  // Delivery Charges state
  const [enableDeliveryCharges, setEnableDeliveryCharges] = useState(settings.enableDeliveryCharges ?? true);
  const [deliveryCharge, setDeliveryCharge] = useState(settings.deliveryCharge ?? 50);
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState(settings.freeDeliveryAbove ?? 2000);

  // MDR Charges state
  const [enableMdr, setEnableMdr] = useState(settings.enableMdr ?? true);
  const [mdrPercentage, setMdrPercentage] = useState(settings.mdrPercentage ?? 0.04);

  const [previewQrUrl, setPreviewQrUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Generate live preview QR code for the entered UPI VPA and Name
  useEffect(() => {
    if (!isOpen) return;
    const vpa = upiVpa.trim() || 'aryanagency@upi';
    const name = upiPayeeName.trim() || 'Aryan Agency';
    const sampleUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&cu=INR&tn=${encodeURIComponent('AryanAgency-TestPayment')}`;

    QRCode.toDataURL(sampleUri, {
      width: 140,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    })
      .then(url => setPreviewQrUrl(url))
      .catch(err => console.error('Error generating preview QR:', err));
  }, [isOpen, upiVpa, upiPayeeName]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      allowCOD,
      mandatoryOnlinePayment,
      upiVpa: upiVpa.trim() || 'aryanagency@upi',
      upiPayeeName: upiPayeeName.trim() || 'Aryan Agency',
      enableDeliveryCharges,
      deliveryCharge: Math.max(0, Number(deliveryCharge) || 0),
      freeDeliveryAbove: Math.max(0, Number(freeDeliveryAbove) || 0),
      enableMdr,
      mdrPercentage: Math.max(0, Number(mdrPercentage) || 0)
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4 bg-[#1e293b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Admin Payment, Delivery &amp; Tax Settings</h3>
              <p className="text-[11px] text-slate-300">Aryan Agency Company UPI QR, Delivery Charges &amp; Govt MDR</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Security & Clarity Notice about Dharmesh D Patel / Template dummy VPA */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center space-x-1.5 font-bold text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>UPI QR Clarity (Kisi ne hack nahi kiya hai)</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              पुराने कोड में एक डमी सैंपल UPI ID (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono">aryanagency@icici</code>) डली थी। NPCI/ICICI बैंक के रिकॉर्ड में वह नाम धर्मेश डी. पटेल जी के नाम पर रजिस्टर्ड था। <strong>नीचे अपनी असली कंपनी की UPI ID और नाम दर्ज करें</strong>, ताकि स्कैन करते ही आपकी एजेंसी का नाम और बैंक खाता दिखे।
            </p>
          </div>

          {/* Section 1: Official Aryan Agency UPI & Dynamic QR */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Aryan Agency UPI ID &amp; QR Settings</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Dynamic QR
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Company UPI VPA ID (आपकी असली UPI ID) *
                  </label>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    placeholder="e.g. aryanagency@okaxis or 98XXXXXXXX@paytm"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    PhonePe/GPay/Paytm या बैंक से मिली बिजनेस UPI VPA।
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Merchant / Company Display Name *
                  </label>
                  <input
                    type="text"
                    value={upiPayeeName}
                    onChange={(e) => setUpiPayeeName(e.target.value)}
                    placeholder="e.g. Aryan Agency"
                    className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    स्कैन करने पर ऐप में यही कंपनी का नाम दिखेगा।
                  </p>
                </div>
              </div>

              {/* Live QR Test Preview */}
              <div className="flex flex-col items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-600">Scan QR Test Preview</span>
                {previewQrUrl ? (
                  <img 
                    src={previewQrUrl} 
                    alt="Preview QR" 
                    className="w-24 h-24 rounded border border-slate-100 shadow-2xs"
                  />
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-slate-100 text-[10px] text-slate-400">
                    Generating...
                  </div>
                )}
                <span className="text-[9.5px] font-bold text-blue-700 font-mono truncate max-w-full">
                  {upiVpa || 'aryanagency@upi'}
                </span>
                <span className="text-[9px] text-slate-500 truncate max-w-full">
                  {upiPayeeName || 'Aryan Agency'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Delivery Charges Configuration */}
          <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Delivery Charges (डिलीवरी चार्ज सेटिंग्स)</h4>
                  <p className="text-[10px] text-slate-500">छोटे ऑर्डर्स पर चार्ज लगाएं और बड़े ऑर्डर्स पर फ्री डिलीवरी दें</p>
                </div>
              </div>

              {/* Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableDeliveryCharges}
                  onChange={(e) => setEnableDeliveryCharges(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {enableDeliveryCharges ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Standard Delivery Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                      className="w-full pl-6 pr-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">कम राशि वाले आर्डर पर लगने वाला शुल्क</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Free Delivery on Orders Above (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={freeDeliveryAbove}
                      onChange={(e) => setFreeDeliveryAbove(Number(e.target.value))}
                      className="w-full pl-6 pr-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">इतने या इससे अधिक राशि पर डिलीवरी मुफ्त होगी</p>
                </div>

                <div className="sm:col-span-2 p-2 bg-amber-100/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>
                    नियम: <strong>₹{freeDeliveryAbove}</strong> से कम के ऑर्डर पर <strong>₹{deliveryCharge}</strong> डिलीवरी चार्ज लगेगा। ₹{freeDeliveryAbove} या उससे अधिक की खरीदारी पर <strong>100% FREE डिलीवरी</strong> रहेगी।
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-slate-100 rounded-lg text-[11px] text-slate-600">
                डिलीवरी चार्ज बंद है (सभी ऑर्डर्स पर ₹0 डिलीवरी रहेगी)।
              </div>
            )}
          </div>

          {/* Section 3: Government MDR Charges (0.04%) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Govt MDR Charges (डिजिटल भुगतान पर शुल्क)</h4>
                  <p className="text-[10px] text-slate-500">ऑनलाइन UPI / QR पेमेंट पर 0.04% मर्चेंट शुल्क जोड़ें</p>
                </div>
              </div>

              {/* Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMdr}
                  onChange={(e) => setEnableMdr(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {enableMdr && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center space-x-3">
                  <div className="w-36">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      MDR Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.01"
                        value={mdrPercentage}
                        onChange={(e) => setMdrPercentage(Number(e.target.value))}
                        className="w-full pr-7 pl-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="flex-1 text-[11px] text-slate-600 pt-3">
                    सरकारी नियमों के अनुसार डिजिटल / UPI पेमेंट पर <strong>{mdrPercentage}%</strong> MDR चार्ज चेकआउट बिल में जोड़ा जाएगा।
                  </div>
                </div>

                <div className="p-2 bg-emerald-100/70 border border-emerald-200 rounded-lg text-[10.5px] text-emerald-900">
                  ⚡ <strong>Note:</strong> यह चार्ज केवल ऑनलाइन UPI व QR कोड पेमेंट पर लागू होगा। Cash on Delivery (COD) या क्रेडिट (उधार) पर यह चार्ज नहीं लगेगा।
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Cash on Delivery (COD) & Mandatory Online Payment */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  allowCOD ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Allow Cash on Delivery (COD)</h4>
                  <p className="text-[10px] text-slate-500">Retailers can pay cash upon van delivery</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCOD}
                  onChange={(e) => {
                    setAllowCOD(e.target.checked);
                    if (!e.target.checked) {
                      setMandatoryOnlinePayment(true);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {!allowCOD && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>COD is DISABLED:</strong> Retailers must pay via UPI or Dynamic QR Code.
                </p>
              </div>
            )}
          </div>

          {/* Save Action */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <span>Save All Settings</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

