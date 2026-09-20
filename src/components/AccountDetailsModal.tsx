import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Store, 
  ShieldCheck, 
  CreditCard, 
  PackageCheck, 
  Clock, 
  Truck, 
  LogOut, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Receipt,
  Headphones,
  BadgePercent,
  Package,
  ClipboardList,
  Percent,
  Edit3,
  Camera,
  Save,
  Check,
  RotateCcw,
  Navigation,
  Sparkles,
  Info
} from 'lucide-react';
import { User, Order, Retailer, Salesman } from '../types';
import { formatINR, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  retailers?: Retailer[];
  salesmen?: Salesman[];
  orders?: Order[];
  onNavigateTab: (tab: any) => void;
  onLogout: () => void;
  onSaveRetailer?: (retailer: Retailer) => Promise<any>;
}

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  retailers = [],
  salesmen = [],
  orders = [],
  onNavigateTab,
  onLogout,
  onSaveRetailer
}) => {
  const { updateProfile, isAdmin, isRetailer } = useAuth();

  // Find linked retailer profile if retailer
  const linkedRetailer = retailers.find(
    r => (currentUser?.retailerId && r.id === currentUser.retailerId) || 
    (currentUser?.name && r.storeName.toLowerCase() === currentUser.name.toLowerCase()) ||
    (currentUser?.phone && r.phone === currentUser.phone) ||
    (currentUser?.email && r.email && currentUser.email.toLowerCase() === r.email.toLowerCase())
  ) || (currentUser?.role === 'retailer' && retailers.length > 0 ? retailers[0] : null);

  // Find linked salesman profile if salesman
  const linkedSalesman = salesmen.find(
    s => (currentUser?.salesmanId && s.id === currentUser.salesmanId) ||
    (currentUser?.name && s.name.toLowerCase() === currentUser.name.toLowerCase())
  ) || (currentUser?.role === 'salesman' && salesmen.length > 0 ? salesmen[0] : null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessLogoUrl, setBusinessLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState('');

  // Initialize form state from currentUser and linkedRetailer
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || linkedRetailer?.phone || '');
      setAvatarUrl(currentUser.avatarUrl || linkedRetailer?.photoUrl || '');
      setBusinessName(
        currentUser.businessName || 
        linkedRetailer?.storeName || 
        (currentUser.role === 'admin' ? 'Aryan Agency FMCG Distribution' : '')
      );
      setBusinessLogoUrl(currentUser.businessLogoUrl || linkedRetailer?.logoUrl || '');
      setAddress(currentUser.address || linkedRetailer?.address || '');
      setCity(currentUser.city || 'Balrampur');
      setState(currentUser.state || 'Uttar Pradesh');
      setPincode(currentUser.pincode || '271604');
      setGstin(currentUser.gstin || linkedRetailer?.gstin || '');
      setPanNumber(currentUser.panNumber || linkedRetailer?.panNumber || '');
      
      const lat = currentUser.locationCoordinates?.lat || linkedRetailer?.lat;
      const lng = currentUser.locationCoordinates?.lng || linkedRetailer?.lng;
      setLatitude(lat !== undefined ? String(lat) : '27.3167');
      setLongitude(lng !== undefined ? String(lng) : '82.4167');
    }
  }, [currentUser, linkedRetailer, isOpen]);

  if (!isOpen || !currentUser) return null;

  // User relevant orders
  const userOrders = orders.filter(o => {
    if (linkedRetailer) return o.retailerId === linkedRetailer.id;
    if (linkedSalesman) return o.salesmanId === linkedSalesman.id;
    return true;
  });

  const activeOrders = userOrders.filter(o => ['booked', 'confirmed', 'packed', 'out_for_delivery', 'dispatched'].includes(o.status));

  // Role badge display config
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Distributor Owner & Admin', color: 'bg-blue-600 text-white', badgeBg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'salesman':
        return { label: 'DSR Sales Representative', color: 'bg-indigo-600 text-white', badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'retailer':
        return { label: 'Registered Kirana Partner', color: 'bg-emerald-600 text-white', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'delivery':
        return { label: 'Depot Delivery Fleet Partner', color: 'bg-amber-600 text-white', badgeBg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'accounts':
        return { label: 'Finance & GST Billing Desk', color: 'bg-purple-600 text-white', badgeBg: 'bg-purple-50 text-purple-800 border-purple-200' };
      default:
        return { label: 'FMCG Business User', color: 'bg-slate-700 text-white', badgeBg: 'bg-slate-50 text-slate-800 border-slate-200' };
    }
  };

  const roleConfig = getRoleConfig(currentUser.role);

  // Check verification status
  const verificationStatus = currentUser.verificationStatus || linkedRetailer?.verificationStatus || (currentUser.role === 'admin' ? 'verified' : 'pending');

  // Location detection
  const handleDetectCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(6));
          setLongitude(pos.coords.longitude.toFixed(6));
          setIsDetectingLocation(false);
        },
        (err) => {
          console.warn('Geolocation access warning:', err.message);
          setIsDetectingLocation(false);
          // Fallback to Balrampur / Utraula defaults
          setLatitude('27.3167');
          setLongitude('82.4167');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLatitude('27.3167');
      setLongitude('82.4167');
    }
  };

  // Profile image upload simulation / URL helper
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'avatar') {
          setAvatarUrl(result);
        } else {
          setBusinessLogoUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    const latNum = latitude ? parseFloat(latitude) : undefined;
    const lngNum = longitude ? parseFloat(longitude) : undefined;

    const payload: Partial<User> = {
      id: currentUser.id,
      role: currentUser.role,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      businessName: businessName.trim() || undefined,
      businessLogoUrl: businessLogoUrl.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
      panNumber: panNumber.trim() ? panNumber.trim().toUpperCase() : undefined,
      locationCoordinates: {
        lat: latNum,
        lng: lngNum,
        addressText: address.trim()
      }
    };

    try {
      const res = await updateProfile(payload);
      if (res && res.success) {
        // Also update linked retailer object in state if available
        if (linkedRetailer && onSaveRetailer) {
          await onSaveRetailer({
            ...linkedRetailer,
            storeName: businessName.trim() || linkedRetailer.storeName,
            ownerName: name.trim() || linkedRetailer.ownerName,
            phone: phone.trim() || linkedRetailer.phone,
            email: email.trim() || linkedRetailer.email,
            address: address.trim() || linkedRetailer.address,
            gstin: gstin.trim() || linkedRetailer.gstin,
            panNumber: panNumber.trim() || linkedRetailer.panNumber,
            logoUrl: businessLogoUrl.trim() || linkedRetailer.logoUrl,
            photoUrl: avatarUrl.trim() || linkedRetailer.photoUrl,
            lat: latNum !== undefined ? latNum : linkedRetailer.lat,
            lng: lngNum !== undefined ? lngNum : linkedRetailer.lng
          });
        }

        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsEditing(false);
        }, 1200);
      } else {
        setSaveError(res?.error || 'Could not update profile. Please check details and try again.');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Admin Verification handler (Approve / Reject)
  const handleAdminVerifyAction = async (status: 'verified' | 'rejected') => {
    if (!linkedRetailer?.id) return;
    setIsVerifying(true);
    setSaveError(null);
    try {
      const res = await api.verifyRetailer(linkedRetailer.id, status, adminRemarks.trim() || undefined);
      if (res && res.retailer) {
        if (onSaveRetailer) {
          await onSaveRetailer(res.retailer);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        setSaveError('Failed to update verification status.');
      }
    } catch (err: any) {
      setSaveError(err?.message || 'Error processing verification');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================================= */}
        {/* MODAL HEADER: Aryan Agency Profile Banner with Edit Switch                 */}
        {/* ========================================================================= */}
        <div className="relative bg-gradient-to-r from-[#0B1E3F] via-[#102A54] to-[#16386E] text-white p-5 sm:p-6">
          {/* Header Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            {!isEditing ? (
              <button
                id="edit-profile-btn"
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-[#0B1E3F] font-bold text-xs flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                }}
                className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center space-x-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}

            <button
              id="close-account-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Account Details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Identity & Avatar / Logo */}
          <div className="flex items-center space-x-4 mt-1">
            <div className="relative shrink-0 group">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name || currentUser.name} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-[#0B1E3F] font-black text-2xl flex items-center justify-center shadow-lg ring-4 ring-white/15">
                  {name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AA'}
                </div>
              )}

              {/* Status indicator on avatar */}
              <div 
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#0B1E3F] flex items-center justify-center shadow-xs ${
                  verificationStatus === 'verified' 
                    ? 'bg-emerald-500 text-white' 
                    : verificationStatus === 'rejected'
                    ? 'bg-rose-500 text-white'
                    : 'bg-amber-400 text-slate-900'
                }`}
                title={`Account KYC: ${verificationStatus.toUpperCase()}`}
              >
                {verificationStatus === 'verified' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : verificationStatus === 'rejected' ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 pr-14">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                  {name || currentUser.name}
                </h2>
              </div>
              <p className="text-xs text-blue-200 font-semibold truncate mt-0.5">
                {businessName || (currentUser.role === 'admin' ? 'Aryan Agency FMCG Distribution' : 'Retail Partner Outlet')}
              </p>
              
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-400 text-slate-950 shadow-xs">
                  {roleConfig.label}
                </span>

                {/* Verification Badge */}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  verificationStatus === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : verificationStatus === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}>
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {verificationStatus === 'verified' 
                    ? 'KYC Verified Partner' 
                    : verificationStatus === 'rejected'
                    ? 'Verification Rejected'
                    : 'KYC Pending Verification'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY (Scrollable)                                                  */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* Alert / Notification Feedback */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile details, shop info, and coordinates updated successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Admin KYC Approval / Rejection Action Panel for Retailer Profiles */}
          {isAdmin && linkedRetailer && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-700" />
                  <span className="font-black text-indigo-950 uppercase tracking-wide">
                    Admin KYC Verification Review
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                  linkedRetailer.verificationStatus === 'verified'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : linkedRetailer.verificationStatus === 'rejected'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  Current: {linkedRetailer.verificationStatus || 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-indigo-100">
                <div>
                  <span className="text-slate-400 block font-medium">Store / Outlet:</span>
                  <span className="font-bold text-slate-900">{linkedRetailer.storeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">GSTIN & PAN:</span>
                  <span className="font-mono font-bold text-slate-900">{linkedRetailer.gstin || 'None'} / {linkedRetailer.panNumber || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Beat Route:</span>
                  <span className="font-semibold text-slate-800">{linkedRetailer.beatName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Contact:</span>
                  <span className="font-semibold text-slate-800">{linkedRetailer.phone}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Verification remarks (e.g., Shop physical visit verified, documents checked)"
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-indigo-500"
                />
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => handleAdminVerifyAction('verified')}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Verify</span>
                  </button>
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => handleAdminVerifyAction('rejected')}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Verification Notice for Retailers */}
          {currentUser.role === 'retailer' && verificationStatus === 'pending' && !isEditing && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-extrabold text-amber-950">KYC Verification In Progress</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed pl-6">
                Your retailer profile is submitted and currently under review by Aryan Agency Admin. Once verified, your wholesale credit limit and dispatch priority will be unlocked. You can update your shop photo, GSTIN, and location anytime.
              </p>
            </div>
          )}

          {/* ======================================================================= */}
          {/* EDIT FORM (When isEditing === true)                                    */}
          {/* ======================================================================= */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900 flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Update your contact details, shop/company name, photo/logo, business tax identifiers, and delivery GPS location.
                </p>
              </div>

              {/* Photos & Logo Section */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Profile Photo & Shop / Company Logo</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Avatar / Owner Photo */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Owner Photo URL / Upload
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://... or choose file"
                        className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                      />
                      <label className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors shrink-0">
                        <Camera className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageSelect(e, 'avatar')}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Store / Company Logo */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Store / Company Logo URL
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={businessLogoUrl}
                        onChange={(e) => setBusinessLogoUrl(e.target.value)}
                        placeholder="https://... or choose file"
                        className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                      />
                      <label className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageSelect(e, 'logo')}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preview Thumbnail */}
                {(avatarUrl || businessLogoUrl) && (
                  <div className="flex items-center space-x-3 pt-2 border-t border-slate-200">
                    {avatarUrl && (
                      <div className="flex items-center space-x-2">
                        <img 
                          src={avatarUrl} 
                          alt="Avatar Preview" 
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] font-bold text-slate-500">Owner Photo</span>
                      </div>
                    )}
                    {businessLogoUrl && (
                      <div className="flex items-center space-x-2">
                        <img 
                          src={businessLogoUrl} 
                          alt="Logo Preview" 
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] font-bold text-slate-500">Business Logo</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Personal & Contact Details */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-slate-700" />
                  <span>Personal & Contact Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                      placeholder="e.g. Aryan Sharma"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Mobile Phone *</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                      placeholder="+91 98450 12345"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block">Registered Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                      placeholder="e.g. store@aryanagency.in"
                    />
                  </div>
                </div>
              </div>

              {/* Business & Tax Profile */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>
                    {currentUser.role === 'admin' ? 'Company & Agency Profile' : 'Shop & Store Profile'}
                  </span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      {currentUser.role === 'admin' ? 'Company / Agency Name *' : 'Shop / Store Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                      placeholder={currentUser.role === 'admin' ? 'Aryan Agency FMCG Distribution' : 'e.g. Sri Krishna Supermarket'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">GSTIN Number</label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500 font-mono"
                      placeholder="29AABCA1234F1Z8"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">PAN Number</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500 font-mono"
                      placeholder="AABCA1234F"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Address & GPS Location */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Physical Address & GPS Coordinates</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleDetectCurrentLocation}
                    disabled={isDetectingLocation}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 cursor-pointer"
                  >
                    <Navigation className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    <span>{isDetectingLocation ? 'Locating...' : 'Get Live GPS'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">Premises Street Address *</label>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                      placeholder="Plot / Shop No, Street, Landmark, Area"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                        placeholder="Balrampur"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                        placeholder="Karnataka"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-blue-500 font-mono"
                        placeholder="560022"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Latitude</label>
                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-blue-500 font-mono"
                        placeholder="13.0285"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Longitude</label>
                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-blue-500 font-mono"
                        placeholder="77.5407"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B1E3F] hover:bg-[#16386E] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* ======================================================================= */
            /* VIEW MODE (When isEditing === false)                                  */
            /* ======================================================================= */
            <>
              {/* Quick Hub Navigation Cards */}
              <section className="w-full">
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Card 1: Catalog - All Products */}
                  <button
                    id="acc-quick-catalog"
                    onClick={() => {
                      onClose();
                      onNavigateTab('products');
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#EEF4FF] hover:bg-blue-100/70 border border-blue-100 transition-all text-left group cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#1A73E8] text-white flex items-center justify-center shadow-xs shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 leading-tight">Catalog</p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">All Products</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  {/* Card 2: Orders - Track & Manage */}
                  <button
                    id="acc-quick-orders"
                    onClick={() => {
                      onClose();
                      onNavigateTab('orders');
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#EDF8F1] hover:bg-emerald-100/70 border border-emerald-100 transition-all text-left group cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#0F9D58] text-white flex items-center justify-center shadow-xs shrink-0">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 leading-tight">Orders</p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">Track & Manage</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  {/* Card 3: Offers - Special Deals */}
                  <button
                    id="acc-quick-offers"
                    onClick={() => {
                      onClose();
                      onNavigateTab('products');
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF4ED] hover:bg-orange-100/70 border border-orange-100 transition-all text-left group cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#F4511E] text-white flex items-center justify-center shadow-xs shrink-0">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 leading-tight">Offers</p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">Special Deals</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  {/* Card 4: Account - Profile & Credit (Active View) */}
                  <div
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F0FF] border border-purple-200/90 text-left shadow-2xs ring-2 ring-purple-400/25"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#673AB7] text-white flex items-center justify-center shadow-xs shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p className="text-xs font-black text-purple-950 leading-tight">Account</p>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900">
                            Active
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-purple-700 mt-0.5 truncate">Profile & Credit</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  </div>
                </div>
              </section>

              {/* 1. Business / Store Information Section */}
              <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Store className="w-4 h-4 text-blue-700" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {currentUser.role === 'admin' ? 'Company Profile & Registration' : 'Store & Beat Details'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      {currentUser.role === 'admin' ? 'Distribution Agency' : 'Outlet Store Name'}
                    </span>
                    <span className="font-bold text-slate-900 mt-0.5 block">
                      {businessName || currentUser.businessName || linkedRetailer?.storeName || 'Aryan Agency FMCG'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Proprietor / Contact</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{name || currentUser.name}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">GSTIN / Tax ID</span>
                    <span className="font-bold text-slate-800 mt-0.5 block font-mono">
                      {gstin || currentUser.gstin || linkedRetailer?.gstin || '29AABCA1234F1Z8'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      {currentUser.role === 'admin' ? 'PAN Identifier' : 'Delivery Beat Route'}
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block font-mono">
                      {currentUser.role === 'admin' 
                        ? (panNumber || currentUser.panNumber || 'AABCA1234F') 
                        : (linkedRetailer?.beatName || 'City Central Beat')}
                    </span>
                  </div>
                  {(address || currentUser.address || linkedRetailer?.address) && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 sm:col-span-2 flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-slate-700 text-xs font-medium block">
                          {address || currentUser.address || linkedRetailer?.address}
                        </span>
                        {(latitude || longitude) && (
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            GPS Coordinates: {latitude || '13.0285'}, {longitude || '77.5407'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* 2. Contact & Personal Profile */}
              <section className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-slate-700" />
                    <span>Contact & Account Credentials</span>
                  </h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</p>
                      <p className="font-bold text-slate-800 truncate">{phone || currentUser.phone || '+91 98450 12345'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Registered Email</p>
                      <p className="font-bold text-slate-800 truncate">{email || currentUser.email || 'account@aryanagency.in'}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Credit & Ledger Summary (Financial Details) */}
              <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-blue-800" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Wholesale Ledger & Credit Terms
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('payments');
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>View Full Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Credit Limit</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900 mt-1 block">
                      {linkedRetailer?.creditLimit ? formatINR(linkedRetailer.creditLimit) : '₹50,000'}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Outstanding</span>
                    <span className={`text-xs sm:text-sm font-black mt-1 block ${
                      (linkedRetailer?.currentOutstanding || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {formatINR(linkedRetailer?.currentOutstanding || 0)}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Payment Days</span>
                    <span className="text-xs sm:text-sm font-black text-blue-700 mt-1 block">
                      {linkedRetailer?.creditDaysAllowed || 15} Days
                    </span>
                  </div>
                </div>
              </section>

              {/* 4. Orders History & Quick Navigation */}
              <section className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Order Summary
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateTab('orders');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center space-x-0.5 cursor-pointer"
                  >
                    <span>Track & Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-emerald-900 leading-none">{activeOrders.length}</p>
                      <p className="text-[10px] font-bold text-emerald-700 mt-1">Active Deliveries</p>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-blue-900 leading-none">{userOrders.length}</p>
                      <p className="text-[10px] font-bold text-blue-700 mt-1">Total Orders</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5. Direct Distributor Support & Helpdesk */}
              <section className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 leading-tight">Depot Order Helpline</p>
                    <p className="text-[11px] text-slate-600">Utraula Distribution Hub • 9:00 AM – 8:00 PM</p>
                  </div>
                </div>
                <a
                  href="tel:+919845012345"
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-bold text-slate-900 hover:bg-amber-100 transition-colors"
                >
                  Call Hub
                </a>
              </section>
            </>
          )}

        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                             */}
        {/* ========================================================================= */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            id="account-modal-logout-btn"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          {!isEditing ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-[#0B1E3F] hover:bg-[#16386E] text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="py-2.5 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Close Edit
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
