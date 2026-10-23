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
  CheckCircle2,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import { useDistributorSettings } from '../lib/settings';
import { api } from '../lib/api';
import { ARYAN_AGENCY_PROFILE, getVerifiedCompanyAddress } from '../lib/businessProfile';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'payments'>('profile');

  // Business Profile State
  const [businessProfile, setBusinessProfile] = useState({
    businessName: ARYAN_AGENCY_PROFILE.businessName,
    businessType: ARYAN_AGENCY_PROFILE.businessType,
    address: ARYAN_AGENCY_PROFILE.address,
    road: ARYAN_AGENCY_PROFILE.road,
    area: ARYAN_AGENCY_PROFILE.area,
    city: ARYAN_AGENCY_PROFILE.city,
    district: ARYAN_AGENCY_PROFILE.district,
    state: ARYAN_AGENCY_PROFILE.state,
    pincode: ARYAN_AGENCY_PROFILE.pincode || '',
    pincodeVerified: Boolean(ARYAN_AGENCY_PROFILE.pincodeVerified),
    primaryMobile: ARYAN_AGENCY_PROFILE.primaryMobile,
    email: ARYAN_AGENCY_PROFILE.email,
    gstin: ARYAN_AGENCY_PROFILE.gstin,
    panNumber: ARYAN_AGENCY_PROFILE.panNumber,
    fssaiNumber: ARYAN_AGENCY_PROFILE.fssaiNumber
  });

  // Payment & Delivery State
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
  const [isSaving, setIsSaving] = useState(false);

  // Fetch verified profile from server on open
  useEffect(() => {
    if (!isOpen) return;
    api.getBusinessProfile().then(prof => {
      if (prof) {
        setBusinessProfile(prev => ({
          ...prev,
          ...prof,
          pincode: prof.pincode || '',
          pincodeVerified: Boolean(prof.pincodeVerified)
        }));
      }
    }).catch(() => {});
  }, [isOpen]);

  // Generate live preview QR code for UPI
  useEffect(() => {
    if (!isOpen) return;
    const vpa = upiVpa.trim() || 'aryanagency@upi';
    const name = upiPayeeName.trim() || 'Aryan Agency';
    const sampleUri = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&cu=INR&tn=${encodeURIComponent('AryanAgency-Payment')}`;

    QRCode.toDataURL(sampleUri, {
      width: 140,
      margin: 1,
      color: { dark: '#0F172A', light: '#FFFFFF' }
    })
      .then(url => setPreviewQrUrl(url))
      .catch(err => console.error('Error generating preview QR:', err));
  }, [isOpen, upiVpa, upiPayeeName]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      // Save Payment & Delivery settings
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

      // Save Business Profile settings
      const updatedAddress = `${businessProfile.road}, ${businessProfile.area}, ${businessProfile.city}, ${businessProfile.district}, ${businessProfile.state}`;
      const payload = {
        ...businessProfile,
        fullAddress: updatedAddress
      };
      await api.updateBusinessProfile(payload);
      Object.assign(ARYAN_AGENCY_PROFILE, payload);

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onSaved) onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      alert(err?.message || 'Failed to save business settings');
    } finally {
      setIsSaving(false);
    }
  };

  const previewFormattedAddress = businessProfile.pincode && businessProfile.pincodeVerified
    ? `${businessProfile.address}, ${businessProfile.city}, ${businessProfile.district}, ${businessProfile.state} – ${businessProfile.pincode}`
    : `${businessProfile.address}, ${businessProfile.city}, ${businessProfile.district}, ${businessProfile.state}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header */}
        <div className="p-4 bg-[#1e293b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Aryan Agency — Centralized Business Settings</h3>
              <p className="text-[11px] text-slate-300">Official Profile, Verified Contacts, Tax &amp; Delivery</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-700 bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Official Business Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-700 bg-white -mb-px rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment &amp; Delivery</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Centralized Business Profile (Single Source of Truth)</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  These verified details appear across Staff ID cards, retailer-facing headers, PDF catalogues, invoices, and distribution desks.
                </p>
              </div>

              {/* Business Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={businessProfile.businessName}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Type / Branding *
                  </label>
                  <input
                    type="text"
                    value={businessProfile.businessType}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, businessType: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Verified Official Address
                  </span>
                  <span className="text-[10px] text-slate-400">Utraula, Balrampur, Uttar Pradesh</span>
                </label>
                <input
                  type="text"
                  value={businessProfile.address}
                  onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* PIN Code Verification Section */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-amber-950">
                      PIN Code Verification Status
                    </label>
                    <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                      Display the PIN code only after it has been physically verified by Admin.
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 271604"
                    value={businessProfile.pincode}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, pincode: e.target.value.trim() })}
                    className="w-28 text-xs px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <label className="flex items-center space-x-2 text-xs text-amber-900 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={businessProfile.pincodeVerified}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, pincodeVerified: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Confirm &amp; Authorize PIN code display on official ID cards and receipts</span>
                </label>

                <div className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/60">
                  <span className="font-semibold text-slate-700">Live Preview: </span>
                  <span className="font-mono text-slate-900 font-bold">{previewFormattedAddress}</span>
                </div>
              </div>

              {/* Primary Mobile & Business Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Primary Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={businessProfile.primaryMobile}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, primaryMobile: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="9140529661"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Official distributor contact number</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Official Business Email *
                  </label>
                  <input
                    type="email"
                    value={businessProfile.email}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, email: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="aryanagency@zohomail.in"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Used for invoices and official notices</span>
                </div>
              </div>

              {/* Tax & Registration Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Official GSTIN
                  </label>
                  <input
                    type="text"
                    value={businessProfile.gstin}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, gstin: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={businessProfile.panNumber}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, panNumber: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    FSSAI License
                  </label>
                  <input
                    type="text"
                    value={businessProfile.fssaiNumber}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, fssaiNumber: e.target.value })}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT & DELIVERY */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
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
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Distributor UPI ID (VPA) *
                      </label>
                      <input
                        type="text"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="e.g. aryanagency@upi or 9140529661@paytm"
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Beneficiary / Payee Name *
                      </label>
                      <input
                        type="text"
                        value={upiPayeeName}
                        onChange={(e) => setUpiPayeeName(e.target.value)}
                        placeholder="e.g. Aryan Agency"
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Live QR Preview */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                      <QrCode className="w-3 h-3 text-blue-600" />
                      <span>Scan &amp; Pay Preview</span>
                    </span>
                    {previewQrUrl ? (
                      <img 
                        src={previewQrUrl} 
                        alt="UPI QR Code Preview" 
                        className="w-24 h-24 object-contain rounded-lg border border-slate-100 shadow-2xs" 
                      />
                    ) : (
                      <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                        Generating...
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-slate-600 font-bold mt-1.5 truncate max-w-[170px]">
                      {upiVpa || 'aryanagency@upi'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Charge Controls */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Depot Delivery Charges</span>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableDeliveryCharges}
                      onChange={(e) => setEnableDeliveryCharges(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700 ml-1.5">Apply Charges</span>
                  </label>
                </div>

                {enableDeliveryCharges && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1 font-medium">Standard Delivery Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={deliveryCharge}
                        onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                        className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1 font-medium">Free Delivery Above (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={freeDeliveryAbove}
                        onChange={(e) => setFreeDeliveryAbove(Number(e.target.value))}
                        className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods Available */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <Banknote className="w-4 h-4 text-purple-600" />
                  <span>Payment Modes Permitted</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={allowCOD}
                      onChange={(e) => setAllowCOD(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Allow Cash on Delivery (COD)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      checked={mandatoryOnlinePayment}
                      onChange={(e) => setMandatoryOnlinePayment(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Mandatory Instant Online UPI</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {saveSuccess ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Changes saved successfully!
                </span>
              ) : (
                'Admin authorized settings'
              )}
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
