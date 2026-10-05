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
  Info,
  Crosshair,
  ExternalLink,
  Globe,
  Compass,
  Loader2,
  Search
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
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{
    type: 'idle' | 'locating' | 'success' | 'error' | 'info';
    message: string;
    source?: 'gps' | 'network' | 'address' | 'preset' | 'manual';
    accuracy?: number;
  }>({ type: 'idle', message: '' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState('');

  // Initialize form state from currentUser and linkedRetailer
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || linkedRetailer?.phone || '');
      setAvatarUrl(currentUser.avatarUrl || linkedRetailer?.shopPhotoUrl || linkedRetailer?.photoUrl || '');
      setBusinessName(
        currentUser.businessName || 
        linkedRetailer?.storeName || 
        (currentUser.role === 'admin' ? 'Aryan Agency FMCG Distribution' : '')
      );
      setBusinessLogoUrl(currentUser.businessLogoUrl || linkedRetailer?.shopPhotoUrl || linkedRetailer?.logoUrl || '');
      setAddress(currentUser.address || linkedRetailer?.address || '');
      setCity(currentUser.city || 'Utraula');
      setState(currentUser.state || 'Uttar Pradesh');
      setPincode(currentUser.pincode || '271604');

      const cachedGstin = typeof window !== 'undefined' ? localStorage.getItem('aryan_agency_gstin') : null;
      const initialGstin = currentUser.gstin || linkedRetailer?.gstin || (currentUser.role === 'admin' ? (cachedGstin || '09BOGPG2620P1ZQ') : '');
      setGstin(initialGstin);

      const initialPan = currentUser.panNumber || linkedRetailer?.panNumber || (currentUser.role === 'admin' ? 'BOGPG2620P' : '');
      setPanNumber(initialPan);
      
      const lat = currentUser.locationCoordinates?.lat !== undefined ? currentUser.locationCoordinates?.lat : linkedRetailer?.lat;
      const lng = currentUser.locationCoordinates?.lng !== undefined ? currentUser.locationCoordinates?.lng : linkedRetailer?.lng;
      setLatitude(lat !== undefined ? String(lat) : '27.316700');
      setLongitude(lng !== undefined ? String(lng) : '82.416700');
      setLocationStatus({ type: 'idle', message: '' });
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

  // Regional Hub Presets for Aryan Agency operational territory (Uttar Pradesh B2B Network)
  const REGIONAL_PRESETS = [
    { name: 'Utraula Main Depot', lat: 27.3167, lng: 82.4167, city: 'Utraula', state: 'Uttar Pradesh', pincode: '271604' },
    { name: 'Balrampur Central', lat: 27.4297, lng: 82.1818, city: 'Balrampur', state: 'Uttar Pradesh', pincode: '271201' },
    { name: 'Gonda Junction Beat', lat: 27.1337, lng: 81.9619, city: 'Gonda', state: 'Uttar Pradesh', pincode: '271001' },
    { name: 'Tulsipur Border Beat', lat: 27.5469, lng: 82.4184, city: 'Tulsipur', state: 'Uttar Pradesh', pincode: '271208' },
    { name: 'Bahraich Market', lat: 27.5744, lng: 81.5947, city: 'Bahraich', state: 'Uttar Pradesh', pincode: '271801' },
    { name: 'Lucknow Transport Hub', lat: 26.8467, lng: 80.9462, city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' }
  ];

  // Reverse Geocoding helper (Server-side proxy with client fallback)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await api.reverseGeoLocation(lat, lng);
      if (res && res.success && res.data) {
        const addr = res.data;
        if (addr.city) setCity(addr.city);
        if (addr.state) setState(addr.state);
        if (addr.pincode) setPincode(addr.pincode);
        if (!address.trim() && (addr.road || addr.displayName)) {
          setAddress(addr.road || addr.displayName.split(',').slice(0, 3).join(', '));
        }
        return {
          displayName: addr.displayName,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode
        };
      }
    } catch (e) {
      console.warn('Server reverse geocode notice:', e);
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state_district;
          const detectedState = addr.state;
          const detectedPincode = addr.postcode;
          const detectedRoad = [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ');

          if (detectedCity) setCity(detectedCity);
          if (detectedState) setState(detectedState);
          if (detectedPincode) setPincode(detectedPincode);
          if (!address.trim() && (data.display_name || detectedRoad)) {
            setAddress(detectedRoad || data.display_name.split(',').slice(0, 3).join(', '));
          }
          return {
            displayName: data.display_name,
            city: detectedCity,
            state: detectedState,
            pincode: detectedPincode
          };
        }
      }
    } catch (err) {
      console.warn('Direct reverse geocode error notice:', err);
    }
    return null;
  };

  // Robust Multi-tier Location detection
  const handleDetectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setLocationStatus({
      type: 'locating',
      message: '📡 Connecting to device GPS satellite & network triangulation...'
    });

    const onCoordinatesObtained = async (lat: number, lng: number, source: 'gps' | 'network', accuracy?: number) => {
      const latStr = lat.toFixed(6);
      const lngStr = lng.toFixed(6);
      setLatitude(latStr);
      setLongitude(lngStr);

      setLocationStatus({
        type: 'success',
        message: source === 'gps' 
          ? `✓ Live Device GPS Acquired (${latStr}, ${lngStr})${accuracy ? ` • Accuracy: ±${Math.round(accuracy)}m` : ''}` 
          : `✓ Regional Location Acquired (${latStr}, ${lngStr})`,
        source,
        accuracy
      });

      // Automatically reverse-geocode address
      try {
        const reverseData = await reverseGeocode(lat, lng);
        if (reverseData?.city) {
          setLocationStatus({
            type: 'success',
            message: `✓ GPS Position Locked: ${reverseData.city}${reverseData.state ? ', ' + reverseData.state : ''} (${latStr}, ${lngStr})`,
            source,
            accuracy
          });
        }
      } catch {}

      setIsDetectingLocation(false);
    };

    // Fallback using IP Geolocation
    const fallbackToNetworkLocation = async (failureReason?: string) => {
      try {
        setLocationStatus({
          type: 'locating',
          message: failureReason 
            ? `${failureReason} Querying regional network location...`
            : 'Device GPS unavailable; querying regional network IP...'
        });

        // 1. Try server proxy endpoint
        const serverGeo = await api.getIpLocation();
        if (serverGeo && serverGeo.data && serverGeo.data.lat && serverGeo.data.lng) {
          const { lat, lng, city: ipCity, state: ipRegion, postal: ipPostal } = serverGeo.data;
          if (ipCity) setCity(ipCity);
          if (ipRegion) setState(ipRegion);
          if (ipPostal) setPincode(ipPostal);
          await onCoordinatesObtained(lat, lng, 'network');
          return;
        }
      } catch (netErr) {
        console.warn('Network location fallback note:', netErr);
      }

      // Default to Utraula / Balrampur Depot Coordinates
      const defaultLat = 27.3167;
      const defaultLng = 82.4167;
      setLatitude(defaultLat.toFixed(6));
      setLongitude(defaultLng.toFixed(6));
      setCity(prev => prev || 'Balrampur');
      setState(prev => prev || 'Uttar Pradesh');
      setPincode(prev => prev || '271604');
      setLocationStatus({
        type: 'info',
        message: 'Set to Aryan Agency Regional Depot (Utraula / Balrampur: 27.3167, 82.4167). You can also click "Pin from Address" or select a preset.',
        source: 'manual'
      });
      setIsDetectingLocation(false);
    };

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onCoordinatesObtained(pos.coords.latitude, pos.coords.longitude, 'gps', pos.coords.accuracy);
        },
        (err) => {
          console.warn('GPS attempt notice:', err.message, 'Code:', err.code);
          let reason = 'Device GPS signal weak.';
          if (err.code === 1) {
            reason = 'Browser location permission denied.';
          } else if (err.code === 3) {
            reason = 'Device GPS request timed out.';
          }
          fallbackToNetworkLocation(reason);
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
      );
    } else {
      fallbackToNetworkLocation('Browser geolocation API not supported.');
    }
  };

  // Forward Geocoding: Locate GPS from Premises Address
  const handleGeocodeFromAddress = async () => {
    const query = [address, city, state, pincode].filter(Boolean).join(', ');
    if (!query.trim()) {
      setLocationStatus({
        type: 'error',
        message: 'Please enter a shop street address, city, or pincode first to pinpoint GPS coordinates.'
      });
      return;
    }

    setIsGeocodingAddress(true);
    setLocationStatus({
      type: 'locating',
      message: `Searching GPS pin for "${address || city || pincode}"...`
    });

    try {
      // 1. Try server geocoding proxy
      const serverSearch = await api.searchGeoLocation(query);
      if (serverSearch && serverSearch.results && serverSearch.results.length > 0) {
        const item = serverSearch.results[0];
        const latStr = item.lat.toFixed(6);
        const lngStr = item.lng.toFixed(6);
        setLatitude(latStr);
        setLongitude(lngStr);
        if (item.city) setCity(item.city);
        if (item.state) setState(item.state);
        if (item.pincode) setPincode(item.pincode);
        setLocationStatus({
          type: 'success',
          message: `✓ GPS coordinates matched from address: ${latStr}, ${lngStr} (${item.city || city})`,
          source: 'address'
        });
        setIsGeocodingAddress(false);
        return;
      }

      // City-level fallback
      if (city.trim()) {
        const citySearch = await api.searchGeoLocation(`${city.trim()}, Uttar Pradesh, India`);
        if (citySearch && citySearch.results && citySearch.results.length > 0) {
          const item = citySearch.results[0];
          const latStr = item.lat.toFixed(6);
          const lngStr = item.lng.toFixed(6);
          setLatitude(latStr);
          setLongitude(lngStr);
          setLocationStatus({
            type: 'success',
            message: `✓ Pinpointed from city "${city}": ${latStr}, ${lngStr}`,
            source: 'address'
          });
          setIsGeocodingAddress(false);
          return;
        }
      }

      // Direct client fallback
      const directRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'Accept': 'application/json' }
      });
      if (directRes.ok) {
        const items = await directRes.json();
        if (items && items.length > 0) {
          const item = items[0];
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          setLatitude(lat.toFixed(6));
          setLongitude(lon.toFixed(6));
          setLocationStatus({
            type: 'success',
            message: `✓ GPS coordinates matched: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
            source: 'address'
          });
          setIsGeocodingAddress(false);
          return;
        }
      }

      setLocationStatus({
        type: 'error',
        message: `Could not find map pin for "${query}". Try clicking "Get Live GPS" or select a regional preset below.`
      });
    } catch (err: any) {
      setLocationStatus({
        type: 'error',
        message: 'Address lookup error. You can click "Get Live GPS" or select a regional preset below.'
      });
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  // Smart Coordinate Handlers (Splits comma-separated "lat, lng" strings on paste)
  const handleLatChange = (val: string) => {
    if (val.includes(',') || (val.trim().includes(' ') && val.trim().split(/\s+/).length === 2)) {
      const parts = val.split(/[,\s]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const p1 = parseFloat(parts[0]);
        const p2 = parseFloat(parts[1]);
        if (!isNaN(p1) && !isNaN(p2)) {
          setLatitude(p1.toFixed(6));
          setLongitude(p2.toFixed(6));
          setLocationStatus({
            type: 'success',
            message: `✓ Extracted coordinates: Lat ${p1.toFixed(6)}, Lng ${p2.toFixed(6)}`,
            source: 'manual'
          });
          return;
        }
      }
    }
    setLatitude(val);
  };

  const handleLngChange = (val: string) => {
    if (val.includes(',') || (val.trim().includes(' ') && val.trim().split(/\s+/).length === 2)) {
      const parts = val.split(/[,\s]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const p1 = parseFloat(parts[0]);
        const p2 = parseFloat(parts[1]);
        if (!isNaN(p1) && !isNaN(p2)) {
          setLatitude(p1.toFixed(6));
          setLongitude(p2.toFixed(6));
          setLocationStatus({
            type: 'success',
            message: `✓ Extracted coordinates: Lat ${p1.toFixed(6)}, Lng ${p2.toFixed(6)}`,
            source: 'manual'
          });
          return;
        }
      }
    }
    setLongitude(val);
  };

  // Quick Preset Setter
  const setPresetLocation = (preset: typeof REGIONAL_PRESETS[0]) => {
    setLatitude(preset.lat.toFixed(6));
    setLongitude(preset.lng.toFixed(6));
    if (preset.city) setCity(preset.city);
    if (preset.state) setState(preset.state);
    if (preset.pincode) setPincode(preset.pincode);
    setLocationStatus({
      type: 'success',
      message: `✓ Set to ${preset.name} (${preset.lat.toFixed(6)}, ${preset.lng.toFixed(6)})`,
      source: 'preset'
    });
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

    const latClean = latitude.trim();
    const lngClean = longitude.trim();
    const latNum = latClean !== '' && !isNaN(Number(latClean)) ? Number(latClean) : undefined;
    const lngNum = lngClean !== '' && !isNaN(Number(lngClean)) ? Number(lngClean) : undefined;

    const finalGstin = gstin.trim().toUpperCase();
    const finalPan = panNumber.trim().toUpperCase();

    const payload: Partial<User> & { lat?: number; lng?: number } = {
      id: currentUser.id,
      role: currentUser.role,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
      businessName: businessName.trim() || (currentUser.role === 'admin' ? 'Aryan Agency FMCG Distribution' : undefined),
      businessLogoUrl: businessLogoUrl.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      pincode: pincode.trim() || undefined,
      gstin: finalGstin,
      panNumber: finalPan,
      lat: latNum,
      lng: lngNum,
      locationCoordinates: (latNum !== undefined && lngNum !== undefined) ? {
        lat: latNum,
        lng: lngNum,
        addressText: address.trim() || (city.trim() ? `${city.trim()}, ${state.trim()}` : '')
      } : undefined
    };

    try {
      if (finalGstin) {
        try {
          localStorage.setItem('aryan_agency_gstin', finalGstin);
          localStorage.setItem(`aryan_profile_${currentUser.id}`, JSON.stringify({ ...currentUser, ...payload }));
        } catch {}
      }

      const res = await updateProfile(payload);
      if (res && res.success) {
        setGstin(finalGstin);
        setPanNumber(finalPan);
        if (payload.businessName) setBusinessName(payload.businessName);

        // Also update linked retailer object in state if available
        if (linkedRetailer && onSaveRetailer) {
          await onSaveRetailer({
            ...linkedRetailer,
            storeName: businessName.trim() || linkedRetailer.storeName,
            ownerName: name.trim() || linkedRetailer.ownerName,
            phone: phone.trim() || linkedRetailer.phone,
            email: email.trim() || linkedRetailer.email,
            address: address.trim() || linkedRetailer.address,
            gstin: finalGstin || linkedRetailer.gstin,
            panNumber: finalPan || linkedRetailer.panNumber,
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
                {businessName || (currentUser.role === 'admin' ? 'Aryan Agency FMCG Distribution' : 'Kirana Retail Store')}
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
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500 font-mono"
                      placeholder="e.g. 09BOGPG2620P1ZQ"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">PAN Number</label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500 font-mono"
                      placeholder="e.g. BOGPG2620P"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Address & GPS Location */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Physical Address & GPS Coordinates</span>
                  </h3>
                  
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <button
                      type="button"
                      onClick={handleDetectCurrentLocation}
                      disabled={isDetectingLocation}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Fetch live GPS coordinates from this phone or computer"
                    >
                      <Navigation className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin text-blue-700' : ''}`} />
                      <span>{isDetectingLocation ? 'Locating...' : 'Get Live GPS'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGeocodeFromAddress}
                      disabled={isGeocodingAddress}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Search map registry from your street address and city"
                    >
                      <Search className={`w-3 h-3 ${isGeocodingAddress ? 'animate-spin text-emerald-800' : ''}`} />
                      <span>{isGeocodingAddress ? 'Searching...' : 'Pin from Address'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Status Notification Banner */}
                {locationStatus.message && (
                  <div className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 animate-in fade-in duration-150 ${
                    locationStatus.type === 'success' 
                      ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
                      : locationStatus.type === 'error'
                      ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                      : locationStatus.type === 'locating'
                      ? 'bg-blue-50/90 border-blue-200 text-blue-900'
                      : 'bg-amber-50/90 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-start space-x-2 min-w-0">
                      {locationStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                      {locationStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                      {locationStatus.type === 'locating' && <Loader2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />}
                      {locationStatus.type === 'info' && <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <p className="font-semibold text-[11px] leading-relaxed">{locationStatus.message}</p>
                        {locationStatus.source && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/80 uppercase tracking-wider border border-black/5">
                              Source: {locationStatus.source === 'gps' ? '🛰️ Satellite GPS' : locationStatus.source === 'network' ? '🌐 Regional IP' : locationStatus.source === 'address' ? '📍 Address Search' : '🏢 Regional Preset'}
                            </span>
                            {locationStatus.accuracy !== undefined && (
                              <span className="text-[10px] text-slate-600">
                                ±{Math.round(locationStatus.accuracy)}m accuracy
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && (
                      <a
                        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1 shrink-0 underline bg-white/70 px-2 py-1 rounded-lg border border-blue-100"
                      >
                        <span>Open Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 block">Premises Street Address *</label>
                      <span className="text-[10px] text-slate-400">Street / Mohalla / Landmark</span>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                      placeholder="e.g. Shop No. 12, Main Market Road, Near Gandhi Chowk, Utraula"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">City / Town</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                        placeholder="Utraula"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-blue-500"
                        placeholder="Uttar Pradesh"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">Pincode</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-blue-500 font-mono"
                        placeholder="271604"
                      />
                    </div>
                  </div>

                  {/* GPS Coordinates Inputs with Live Helper */}
                  <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center space-x-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                        <span>Precise GPS Coordinates (Latitude & Longitude)</span>
                      </span>

                      <div className="flex items-center space-x-2 text-[10px]">
                        <span className="text-slate-500 italic">Tip: You can paste &ldquo;lat, lng&rdquo; together</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Latitude (°N)</label>
                        <input
                          type="text"
                          value={latitude}
                          onChange={(e) => handleLatChange(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-blue-500 font-mono font-semibold text-slate-800"
                          placeholder="27.316700"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 block">Longitude (°E)</label>
                        <input
                          type="text"
                          value={longitude}
                          onChange={(e) => handleLngChange(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-blue-500 font-mono font-semibold text-slate-800"
                          placeholder="82.416700"
                        />
                      </div>
                    </div>

                    {/* Regional Presets Quick Selector */}
                    <div className="pt-1.5 border-t border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-600 uppercase tracking-wider">
                          1-Click Regional Depot & Beat Presets:
                        </span>
                        {latitude && longitude && (
                          <a 
                            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
                          >
                            <span>Preview Pin</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {REGIONAL_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setPresetLocation(preset)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                              Math.abs(Number(latitude) - preset.lat) < 0.01 && Math.abs(Number(longitude) - preset.lng) < 0.01
                                ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            📍 {preset.name}
                          </button>
                        ))}
                      </div>
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
                      {gstin || currentUser.gstin || linkedRetailer?.gstin || (currentUser.role === 'admin' ? '09BOGPG2620P1ZQ' : 'Not Registered')}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      {currentUser.role === 'admin' ? 'PAN Identifier' : 'Delivery Beat Route'}
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block font-mono">
                      {currentUser.role === 'admin' 
                        ? (panNumber || currentUser.panNumber || 'BOGPG2620P') 
                        : (linkedRetailer?.beatName || 'City Central Beat')}
                    </span>
                  </div>
                  {/* Physical Address & GPS Coordinates Card in View Mode */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/90 sm:col-span-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2 min-w-0">
                        <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Physical Address & Delivery Geolocation
                          </span>
                          <span className="text-slate-800 text-xs font-semibold block mt-0.5 leading-snug">
                            {address || currentUser.address || linkedRetailer?.address || `${city || currentUser.city || 'Balrampur'}, ${state || currentUser.state || 'Uttar Pradesh'} - ${pincode || currentUser.pincode || '271604'}`}
                          </span>
                          {(city || state || pincode) && (
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {[city || currentUser.city, state || currentUser.state, pincode || currentUser.pincode].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {latitude && longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 flex items-center space-x-1 shrink-0 transition-colors"
                          title="Verify pinned store on Google Maps"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100 text-[10px]">
                      <div className="flex items-center space-x-1.5 font-mono text-slate-600">
                        <Crosshair className="w-3 h-3 text-blue-600" />
                        <span>GPS Coordinates:</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {latitude || '27.316700'}, {longitude || '82.416700'}
                        </span>
                      </div>

                      <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>Delivery Beat Pin Locked</span>
                      </span>
                    </div>
                  </div>
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
