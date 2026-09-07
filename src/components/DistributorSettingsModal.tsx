import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Check, 
  CreditCard, 
  Banknote, 
  QrCode, 
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      allowCOD,
      mandatoryOnlinePayment,
      upiVpa: upiVpa.trim() || 'aryanagency@icici',
      upiPayeeName: upiPayeeName.trim() || 'Aryan Agency FMCG Distribution'
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 bg-[#1e293b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Payment & Checkout Settings</h3>
              <p className="text-[11px] text-slate-300">Admin controls for COD and Online Payment modes</p>
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
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          
          {/* Section: Cash on Delivery (COD) Control */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  allowCOD ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Allow Cash on Delivery (COD)</h4>
                  <p className="text-[11px] text-slate-500">Retailers can opt to pay cash upon van delivery</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCOD}
                  onChange={(e) => {
                    setAllowCOD(e.target.value === 'true' || e.target.checked);
                    if (!e.target.checked) {
                      setMandatoryOnlinePayment(true);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {!allowCOD && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>COD is DISABLED:</strong> The Cash on Delivery option will be hidden at checkout. Retailers must pay via UPI or Dynamic QR Code.
                </p>
              </div>
            )}
          </div>

          {/* Section: Mandatory Online Payment */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  mandatoryOnlinePayment ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mandatory Online Payment</h4>
                  <p className="text-[11px] text-slate-500">Require immediate UPI / QR payment for all orders</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mandatoryOnlinePayment}
                  onChange={(e) => {
                    setMandatoryOnlinePayment(e.target.checked);
                    if (e.target.checked) {
                      setAllowCOD(false);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563eb]"></div>
              </label>
            </div>
          </div>

          {/* Section: Distributor UPI Settlement Account */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <CreditCard className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>Distributor UPI Settlement Details</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Distributor UPI VPA ID
                </label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="e.g. aryanagency@icici"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Payee Display Name
                </label>
                <input
                  type="text"
                  value={upiPayeeName}
                  onChange={(e) => setUpiPayeeName(e.target.value)}
                  placeholder="e.g. Aryan Agency FMCG Distribution"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
              <Info className="w-3 h-3" />
              <span>Dynamic QR codes for checkout will automatically encode these UPI details and exact bill amounts.</span>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex items-center justify-end space-x-2">
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
                <span>Save Payment Settings</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
