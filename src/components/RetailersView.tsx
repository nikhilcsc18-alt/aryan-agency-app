import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  MapPin, 
  IndianRupee, 
  AlertTriangle, 
  FileSpreadsheet, 
  Edit, 
  Check, 
  X,
  CreditCard,
  Building,
  Trash2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Camera,
  Image as ImageIcon,
  Map,
  Eye,
  Archive,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Layers,
  LocateFixed,
  Navigation,
  ExternalLink,
  Globe,
  Compass
} from 'lucide-react';
import { Retailer, Order } from '../types';
import { formatINR, formatINRDecimals, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { setRetailerCreditControl, isCreditEnabledForRetailer } from '../lib/retailerCredit';

interface RetailersViewProps {
  retailers: Retailer[];
  orders?: Order[];
  onSaveRetailer: (retailer: Partial<Retailer>) => Promise<void>;
  onVerifyRetailer?: (
    id: string, 
    status: 'verified' | 'rejected', 
    remarks?: string,
    reasonCode?: string,
    options?: { creditLimit?: number; creditEnabled?: boolean; creditDaysAllowed?: number; beatName?: string }
  ) => Promise<void>;
  onDeleteRetailer?: (id: string, handleOrders?: 'delete' | 'archive') => Promise<void>;
  onCleanupRetailers?: (ids: string[], handleOrders: 'delete' | 'archive') => Promise<void>;
  onDeleteBeat?: (beatName: string) => Promise<void>;
  onOpenNewOrderForRetailer: (retailerId: string) => void;
  onRecordPaymentForRetailer: (retailer: Retailer) => void;
  onNavigateToVerifications?: () => void;
  pendingVerificationsCount?: number;
}

const DEFAULT_BEAT_ROUTES = [
  'Utraula Retail Beat',
  'Balrampur Central Beat',
  'Jarwa Rural Beat',
  'Tulsipur Provision Beat',
  'Pachperwa Market Beat',
  'Rehra Bazar Beat',
  'Gaindas Bujurg Beat',
  'Mankapur Road Beat'
];

// 1-Tap Quick GPS Presets for Aryan Agency Territory
export const REGIONAL_BEAT_GPS_PRESETS = [
  { name: 'Utraula Central Market', area: 'Utraula Central', lat: 27.3167, lng: 82.4210 },
  { name: 'Balrampur Mandi Beat', area: 'Balrampur Mandi', lat: 27.4300, lng: 82.1800 },
  { name: 'Jarwa Rural Beat', area: 'Jarwa Border', lat: 27.7100, lng: 82.5000 },
  { name: 'Tulsipur Provision Beat', area: 'Tulsipur Town', lat: 27.5500, lng: 82.4100 },
  { name: 'Pachperwa Market Beat', area: 'Pachperwa Station Road', lat: 27.5200, lng: 82.6500 },
  { name: 'Rehra Bazar Beat', area: 'Rehra Town', lat: 27.1800, lng: 82.3500 },
  { name: 'Gaindas Bujurg Beat', area: 'Gaindas Market', lat: 27.2400, lng: 82.5200 },
  { name: 'Mankapur Highway Beat', area: 'Mankapur Road', lat: 27.0300, lng: 82.2300 }
];

// Target test accounts explicitly requested for cleanup
export const SPECIFIC_TARGET_TEST_STORES = [
  {
    id: 'ret_4',
    storeName: 'Ganesh Daily Needs',
    ownerName: 'Ganesh Kumar',
    phone: '+91 98450 12345',
    area: 'Indiranagar',
    beatName: 'Indiranagar Retail Beat',
    label: 'Ganesh Daily Needs'
  },
  {
    id: 'ret_3',
    storeName: 'Laxmi Supermarket',
    ownerName: 'Suresh Patil',
    phone: '+91 98451 23456',
    area: 'Jayanagar',
    beatName: 'Jayanagar Provision Beat',
    label: 'Laxmi Supermarket'
  },
  {
    id: 'ret_2',
    storeName: 'Sapthagiri Super Mart',
    ownerName: 'Sapthagiri Store',
    phone: '+91 98452 34567',
    area: 'Koramangala',
    beatName: 'Koramangala Daily Beat',
    label: 'Sapthagiri Super Mart'
  }
];

// Helper to identify candidate test or duplicate stores
export const isCandidateTestAccount = (r: Retailer) => {
  const name = (r.storeName || '').toLowerCase();
  const owner = (r.ownerName || '').toLowerCase();
  const phone = (r.phone || '').replace(/\D/g, '');
  return (
    name.includes('ganesh daily') ||
    name.includes('ganesh provision') ||
    name.includes('laxmi supermarket') ||
    name.includes('sapthagiri') ||
    name.includes('test') ||
    name.includes('sample') ||
    name.includes('dummy') ||
    name.includes('demo') ||
    owner.includes('ganesh daily') ||
    owner.includes('laxmi supermarket') ||
    owner.includes('sapthagiri') ||
    owner.includes('test') ||
    owner.includes('dummy') ||
    phone === '9800000000' ||
    phone === '9999999999' ||
    phone.endsWith('000000')
  );
};

const isPurgedStore = (r: Retailer) => {
  const name = (r.storeName || '').toLowerCase();
  const owner = (r.ownerName || '').toLowerCase();
  return (
    name.includes('laxmi supermarket') ||
    name.includes('ganesh daily') ||
    name.includes('ganesh provision') ||
    name.includes('sapthagiri') ||
    owner.includes('laxmi supermarket') ||
    owner.includes('ganesh daily') ||
    owner.includes('ganesh provision') ||
    owner.includes('sapthagiri')
  );
};

export const RetailersView: React.FC<RetailersViewProps> = ({
  retailers,
  orders = [],
  onSaveRetailer,
  onVerifyRetailer,
  onDeleteRetailer,
  onCleanupRetailers,
  onDeleteBeat,
  onOpenNewOrderForRetailer,
  onRecordPaymentForRetailer,
  onNavigateToVerifications,
  pendingVerificationsCount
}) => {
  const { isAdmin, isSalesman, isAccounts, isRetailer, currentUser } = useAuth();
  
  // Local retailers state for instant optimistic updates
  const [localRetailers, setLocalRetailers] = useState<Retailer[]>(() => retailers.filter(r => !isPurgedStore(r)));
  useEffect(() => {
    setLocalRetailers(retailers.filter(r => !isPurgedStore(r)));
  }, [retailers]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeat, setSelectedBeat] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creditAccessFilter, setCreditAccessFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [togglingCreditId, setTogglingCreditId] = useState<string | null>(null);
  const [verifyingRetailerId, setVerifyingRetailerId] = useState<string | null>(null);

  // Cleanup Modal State
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [selectedCleanupIds, setSelectedCleanupIds] = useState<string[]>([]);
  const [cleanupOrderHandling, setCleanupOrderHandling] = useState<'delete' | 'archive'>('delete');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupSearchQuery, setCleanupSearchQuery] = useState('');
  const [singleDeleteOrderHandling, setSingleDeleteOrderHandling] = useState<'delete' | 'archive'>('delete');
  const [cleanupNotification, setCleanupNotification] = useState<string | null>(null);

  // Detect candidate test / duplicate stores in active data
  const detectedTestStores = (retailers || []).filter(isCandidateTestAccount);

  // Compile all candidate stores for cleanup
  const getCleanupCandidateStores = () => {
    const candidates: Array<{
      id: string;
      storeName: string;
      ownerName: string;
      phone: string;
      area: string;
      beatName: string;
      isSpecificTarget: boolean;
      existsInDb: boolean;
      ordersCount: number;
      ordersTotal: number;
    }> = [];

    // 1. Target stores explicitly named in requirement
    SPECIFIC_TARGET_TEST_STORES.forEach(target => {
      const match = (retailers || []).find(r => 
        r.id === target.id ||
        r.storeName.toLowerCase().includes(target.storeName.toLowerCase()) ||
        (r.phone && r.phone.replace(/\D/g, '').endsWith(target.phone.replace(/\D/g, '').slice(-6)))
      );

      const storeId = match ? match.id : target.id;
      const storeOrders = (orders || []).filter(o => o.retailerId === storeId || (match && o.retailerId === match.id));
      const ordersTotal = storeOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);

      candidates.push({
        id: storeId,
        storeName: match?.storeName || target.storeName,
        ownerName: match?.ownerName || target.ownerName,
        phone: match?.phone || target.phone,
        area: match?.area || target.area,
        beatName: match?.beatName || target.beatName,
        isSpecificTarget: true,
        existsInDb: Boolean(match),
        ordersCount: storeOrders.length,
        ordersTotal
      });
    });

    // 2. Add other candidate test accounts found in retailers
    (retailers || []).forEach(r => {
      if (isCandidateTestAccount(r) && !candidates.some(c => c.id === r.id || c.storeName.toLowerCase() === r.storeName.toLowerCase())) {
        const storeOrders = (orders || []).filter(o => o.retailerId === r.id);
        const ordersTotal = storeOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
        candidates.push({
          id: r.id,
          storeName: r.storeName,
          ownerName: r.ownerName,
          phone: r.phone,
          area: r.area || 'General',
          beatName: r.beatName || 'Unassigned',
          isSpecificTarget: false,
          existsInDb: true,
          ordersCount: storeOrders.length,
          ordersTotal
        });
      }
    });

    return candidates;
  };

  const cleanupCandidates = getCleanupCandidateStores();

  // Beat Management State
  const [customBeats, setCustomBeats] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fmcg_custom_beats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedBeats, setDeletedBeats] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fmcg_deleted_beats');
      return saved ? JSON.parse(saved) : [
        'Indiranagar Retail Beat',
        'MG Road Commercial Beat',
        'Koramangala Daily Beat',
        'Whitefield Supermarket Beat',
        'Jayanagar Provision Beat'
      ];
    } catch {
      return [
        'Indiranagar Retail Beat',
        'MG Road Commercial Beat',
        'Koramangala Daily Beat',
        'Whitefield Supermarket Beat',
        'Jayanagar Provision Beat'
      ];
    }
  });

  const [isBeatModalOpen, setIsBeatModalOpen] = useState(false);
  const [newBeatName, setNewBeatName] = useState('');
  const [newBeatDescription, setNewBeatDescription] = useState('');
  const [isAddingBeatInline, setIsAddingBeatInline] = useState(false);
  const [inlineBeatInput, setInlineBeatInput] = useState('');
  const [deletingBeatName, setDeletingBeatName] = useState<string | null>(null);
  const [isDeletingBeat, setIsDeletingBeat] = useState(false);

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Partial<Retailer> | null>(null);
  const [deletingRetailerId, setDeletingRetailerId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // GPS Location Pinning State for Onboarding / Edit
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{
    type: 'idle' | 'locating' | 'success' | 'error' | 'info';
    message: string;
    accuracy?: number;
  }>({ type: 'idle', message: '' });

  // Shop Photo Lightbox Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<{ url: string; title: string } | null>(null);

  // Ledger Modal
  const [ledgerData, setLedgerData] = useState<{ retailer: Retailer; entries: any[]; finalBalance: number } | null>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // Aggregate all beats, excluding any explicitly deleted beats (case-insensitive)
  const beats = Array.from(new Set([
    ...DEFAULT_BEAT_ROUTES,
    ...localRetailers.map(r => r.beatName),
    ...customBeats
  ])).filter(b => Boolean(b) && !deletedBeats.some(db => db.toLowerCase() === b.toLowerCase()));

  const handleCreateBeat = (beatNameToAdd: string) => {
    const trimmed = beatNameToAdd.trim();
    if (!trimmed) return;
    const updatedDeleted = deletedBeats.filter(b => b.toLowerCase() !== trimmed.toLowerCase());
    setDeletedBeats(updatedDeleted);
    try {
      localStorage.setItem('fmcg_deleted_beats', JSON.stringify(updatedDeleted));
    } catch {}

    if (!customBeats.includes(trimmed)) {
      const updated = [...customBeats, trimmed];
      setCustomBeats(updated);
      try {
        localStorage.setItem('fmcg_custom_beats', JSON.stringify(updated));
      } catch {}
    }
    setIsBeatModalOpen(false);
    setNewBeatName('');
    setNewBeatDescription('');
  };

  const handleDeleteBeat = (beatToDelete: string) => {
    setDeletingBeatName(beatToDelete);
  };

  const handleConfirmDeleteBeat = async () => {
    if (!deletingBeatName) return;
    const targetBeat = deletingBeatName;
    try {
      setIsDeletingBeat(true);
      const targetLower = targetBeat.toLowerCase();

      // 1. Update deleted beats state and local storage
      const updatedDeleted = Array.from(new Set([...deletedBeats, targetBeat]));
      setDeletedBeats(updatedDeleted);
      try {
        localStorage.setItem('fmcg_deleted_beats', JSON.stringify(updatedDeleted));
      } catch {}

      // 2. Remove from custom beats
      const updatedCustom = customBeats.filter(b => b.toLowerCase() !== targetLower);
      setCustomBeats(updatedCustom);
      try {
        localStorage.setItem('fmcg_custom_beats', JSON.stringify(updatedCustom));
      } catch {}

      // 3. Reassign retailers in state immediately
      setLocalRetailers(prev => prev.map(r => {
        if (r.beatName && r.beatName.toLowerCase() === targetLower) {
          const updated = { ...r, beatName: 'Utraula Retail Beat' };
          if (onSaveRetailer) {
            onSaveRetailer(updated).catch(err => console.warn('Failed to update retailer beat on server:', err));
          }
          return updated;
        }
        return r;
      }));

      if (selectedBeat && selectedBeat.toLowerCase() === targetLower) {
        setSelectedBeat('all');
      }

      // 4. Call server endpoint to remove from database
      if (onDeleteBeat) {
        await onDeleteBeat(targetBeat);
      }
    } catch (e) {
      console.warn('Failed to delete beat:', e);
    } finally {
      setIsDeletingBeat(false);
      setDeletingBeatName(null);
    }
  };

  const visibleRetailers = currentUser?.role === 'retailer'
    ? localRetailers.filter(r => 
        (currentUser.retailerId && r.id === currentUser.retailerId) ||
        (currentUser.name && (
          r.storeName.toLowerCase() === currentUser.name.toLowerCase() ||
          r.storeName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(r.storeName.toLowerCase())
        )) ||
        (currentUser.phone && r.phone && r.phone.includes(currentUser.phone.replace(/\D/g, '').slice(-10)))
      )
    : localRetailers;

  const filteredRetailers = visibleRetailers.filter(r => {
    if (r.status === 'inactive' && statusFilter !== 'inactive') {
      // Don't show inactive unless explicitly requested
      if (statusFilter === 'active') return false;
    }

    const matchesSearch =
      r.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      (r.gstin && r.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBeat = selectedBeat === 'all' || r.beatName === selectedBeat;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    const isCreditOn = Boolean(r.creditEnabled);
    const matchesCreditAccess = 
      creditAccessFilter === 'all' ||
      (creditAccessFilter === 'enabled' && isCreditOn) ||
      (creditAccessFilter === 'disabled' && !isCreditOn);

    const vStatus = r.verificationStatus || 'pending';
    const matchesVerification = 
      verificationFilter === 'all' ||
      r.verificationStatus === verificationFilter ||
      (verificationFilter === 'pending' && !r.verificationStatus);

    return matchesSearch && matchesBeat && matchesStatus && matchesCreditAccess && matchesVerification;
  });

  const handleVerifyRetailer = async (retailerId: string, status: 'verified' | 'rejected', remarks?: string) => {
    if (!isAdmin && !isSalesman) return;
    try {
      setVerifyingRetailerId(retailerId);
      
      // Optimistic update
      setLocalRetailers(prev => prev.map(r => r.id === retailerId ? {
        ...r,
        verificationStatus: status,
        verificationRemarks: remarks || (status === 'verified' ? 'Verified by Admin / Salesman' : 'Rejected'),
        verifiedAt: status === 'verified' ? new Date().toISOString() : undefined,
        verifiedBy: currentUser?.name || 'Admin'
      } : r));

      if (onVerifyRetailer) {
        await onVerifyRetailer(retailerId, status, remarks);
      } else {
        const res = await api.verifyRetailer(retailerId, status, remarks);
        if (res?.retailer) {
          await onSaveRetailer(res.retailer);
        }
      }
    } catch (err: any) {
      console.error('[RetailersView Verify Retailer Error]:', err);
    } finally {
      setVerifyingRetailerId(null);
    }
  };

  const handleToggleCredit = async (retailer: Retailer, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin && !isAccounts) return;
    const currentStatus = Boolean(retailer.creditEnabled);
    const newStatus = !currentStatus;

    setTogglingCreditId(retailer.id);
    setRetailerCreditControl(retailer.id, {
      creditEnabled: newStatus,
      creditLimit: retailer.creditLimit,
      creditDaysAllowed: retailer.creditDaysAllowed
    });

    setLocalRetailers(prev => prev.map(r => r.id === retailer.id ? { ...r, creditEnabled: newStatus } : r));

    try {
      await onSaveRetailer({
        id: retailer.id,
        storeName: retailer.storeName,
        ownerName: retailer.ownerName,
        phone: retailer.phone,
        address: retailer.address,
        area: retailer.area,
        beatName: retailer.beatName,
        gstin: retailer.gstin,
        panNumber: retailer.panNumber,
        creditLimit: retailer.creditLimit,
        currentOutstanding: retailer.currentOutstanding,
        creditDaysAllowed: retailer.creditDaysAllowed,
        status: retailer.status,
        creditEnabled: newStatus
      });
    } catch (err: any) {
      console.error('[RetailersView Toggle Credit Error]:', err);
    } finally {
      setTogglingCreditId(null);
    }
  };

  const handleOpenAdd = () => {
    setModalError(null);
    setIsSaving(false);
    setIsAddingBeatInline(false);
    setIsDetectingGps(false);
    setIsGeocodingAddress(false);
    setGpsStatus({ type: 'idle', message: '' });
    setEditingRetailer({
      storeName: '',
      ownerName: '',
      phone: '+91 ',
      email: '',
      address: '',
      area: 'Utraula Central',
      beatName: beats[0] || 'Utraula Retail Beat',
      gstin: '',
      panNumber: '',
      creditLimit: 50000,
      currentOutstanding: 0,
      creditDaysAllowed: 15,
      status: 'active',
      creditEnabled: false,
      verificationStatus: 'verified', // Admin/salesman created is verified by default
      shopPhotoUrl: '',
      lat: undefined,
      lng: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (retailer: Retailer) => {
    setModalError(null);
    setIsSaving(false);
    setIsAddingBeatInline(false);
    setIsDetectingGps(false);
    setIsGeocodingAddress(false);
    if (retailer.lat !== undefined && retailer.lng !== undefined) {
      setGpsStatus({
        type: 'success',
        message: `✓ Pinned GPS Location: ${retailer.lat}, ${retailer.lng}`
      });
    } else {
      setGpsStatus({ type: 'idle', message: '' });
    }
    setEditingRetailer({
      ...retailer,
      creditEnabled: Boolean(retailer.creditEnabled)
    });
    setIsModalOpen(true);
  };

  // 1. Detect Live Device GPS (from salesman/agent mobile device or laptop)
  const handleDetectGpsLocation = async () => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setGpsStatus({
        type: 'error',
        message: 'Geolocation is not supported by your browser or device.'
      });
      return;
    }

    setIsDetectingGps(true);
    setGpsStatus({
      type: 'locating',
      message: '📡 Connecting to device GPS satellites & network location...'
    });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);

        setEditingRetailer(prev => prev ? { ...prev, lat, lng } : prev);
        setGpsStatus({
          type: 'success',
          message: `✓ Live GPS Locked (${lat}, ${lng})${accuracy ? ` • Accuracy: ±${accuracy}m` : ''}`,
          accuracy
        });
        setIsDetectingGps(false);

        // Auto-fill address if shop address is empty or short
        try {
          const revRes = await api.reverseGeoLocation(lat, lng);
          if (revRes && revRes.data) {
            const parts = [revRes.data.road, revRes.data.city, revRes.data.state, revRes.data.pincode].filter(Boolean);
            const formatted = parts.join(', ');
            if (formatted) {
              setEditingRetailer(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  address: prev.address?.trim() ? prev.address : formatted,
                  area: prev.area?.trim() ? prev.area : (revRes.data?.city || prev.area)
                };
              });
            }
          }
        } catch (e) {
          console.warn('[Reverse Geocode Note]:', e);
        }
      },
      async (err) => {
        console.warn('[Geolocation Error]:', err);
        // Try regional IP location fallback
        try {
          setGpsStatus({
            type: 'locating',
            message: 'GPS device permission denied. Attempting regional network IP location...'
          });
          const ipLoc = await api.getIpLocation();
          if (ipLoc && ipLoc.data?.lat && ipLoc.data?.lng) {
            const lat = Number(ipLoc.data.lat.toFixed(6));
            const lng = Number(ipLoc.data.lng.toFixed(6));
            setEditingRetailer(prev => prev ? { ...prev, lat, lng } : prev);
            setGpsStatus({
              type: 'info',
              message: `✓ Regional Location (${ipLoc.data.city || 'Balrampur'} Depot: ${lat}, ${lng})`
            });
            setIsDetectingGps(false);
            return;
          }
        } catch {}

        setGpsStatus({
          type: 'error',
          message: 'Could not access GPS. Please choose a regional preset below or enter coordinates manually.'
        });
        setIsDetectingGps(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // 2. Geocode from typed shop address
  const handleGeocodeFromAddress = async () => {
    const query = [editingRetailer?.address, editingRetailer?.area, 'Uttar Pradesh'].filter(Boolean).join(', ').trim();
    if (!query) {
      setGpsStatus({
        type: 'error',
        message: 'Please enter a shop address or area first to pin location.'
      });
      return;
    }

    setIsGeocodingAddress(true);
    setGpsStatus({
      type: 'locating',
      message: `🔍 Searching map coordinates for "${editingRetailer?.address || editingRetailer?.area}"...`
    });

    try {
      const geo = await api.searchGeoLocation(query);
      if (geo && geo.results && geo.results.length > 0) {
        const first = geo.results[0];
        const lat = Number(first.lat.toFixed(6));
        const lng = Number(first.lng.toFixed(6));
        setEditingRetailer(prev => prev ? { ...prev, lat, lng } : prev);
        setGpsStatus({
          type: 'success',
          message: `✓ Coordinates pinned from address (${first.city || first.displayName?.slice(0, 30)}: ${lat}, ${lng})`
        });
      } else {
        // Fallback to Utraula center
        const defaultLat = 27.3167;
        const defaultLng = 82.4210;
        setEditingRetailer(prev => prev ? { ...prev, lat: defaultLat, lng: defaultLng } : prev);
        setGpsStatus({
          type: 'info',
          message: `Pinned to Utraula Central Market Hub (${defaultLat}, ${defaultLng})`
        });
      }
    } catch (e: any) {
      setGpsStatus({
        type: 'error',
        message: 'Address search lookup unavailable. Use Live GPS or Preset.'
      });
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  // 3. Clear GPS pin
  const handleClearGpsPin = () => {
    setEditingRetailer(prev => prev ? { ...prev, lat: undefined, lng: undefined } : null);
    setGpsStatus({ type: 'idle', message: '' });
  };

  // Compress and save shop photo captured from camera/file
  const handleShopPhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.84);

        setEditingRetailer(prev => prev ? {
          ...prev,
          shopPhotoUrl: dataUrl,
          logoUrl: dataUrl
        } : null);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRetailer) return;

    const storeName = editingRetailer.storeName?.trim();
    if (!storeName) {
      setModalError('Retail outlet store name is mandatory.');
      return;
    }

    const ownerName = editingRetailer.ownerName?.trim();
    if (!ownerName) {
      setModalError('Proprietor / Owner name is mandatory.');
      return;
    }

    const phoneDigits = (editingRetailer.phone || '').replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) {
      setModalError('A valid 10-digit mobile number is mandatory for wholesale dispatch.');
      return;
    }

    const address = editingRetailer.address?.trim();
    if (!address) {
      setModalError('Full shop address is mandatory for beat delivery.');
      return;
    }

    const gstin = (editingRetailer.gstin || '').trim().toUpperCase();
    if (gstin && gstin.length !== 15 && gstin !== 'UNREGISTERED') {
      setModalError('Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 29ABCDE1234F1Z5) or left blank.');
      return;
    }

    try {
      setIsSaving(true);
      setModalError(null);

      const toSave = {
        ...editingRetailer,
        beatName: editingRetailer.beatName || beats[0],
        lat: editingRetailer.lat !== undefined && !isNaN(Number(editingRetailer.lat)) ? Number(editingRetailer.lat) : undefined,
        lng: editingRetailer.lng !== undefined && !isNaN(Number(editingRetailer.lng)) ? Number(editingRetailer.lng) : undefined
      };

      await onSaveRetailer(toSave);
      
      // Optimistic update to local retailers
      setLocalRetailers(prev => {
        const idx = prev.findIndex(r => r.id === toSave.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...toSave } as Retailer;
          return copy;
        } else {
          return [{ ...toSave, id: toSave.id || `ret_${Date.now()}` } as Retailer, ...prev];
        }
      });

      setIsModalOpen(false);
      setEditingRetailer(null);
    } catch (err: any) {
      console.error('[RetailersView Save Error]:', err);
      setModalError(err?.message || 'Failed to save retailer outlet. Please check connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deletingRetailerId) return;
    const targetId = deletingRetailerId;
    const handling = singleDeleteOrderHandling;
    
    // Instant optimistic removal from UI
    setLocalRetailers(prev => prev.filter(r => r.id !== targetId));
    setDeletingRetailerId(null);

    if (onDeleteRetailer) {
      try {
        await onDeleteRetailer(targetId, handling);
      } catch (err) {
        console.error('Failed to delete retailer:', err);
      }
    }
  };

  const handleExecuteCleanup = async () => {
    if (selectedCleanupIds.length === 0) return;
    try {
      setIsCleaningUp(true);
      const idsToClean = [...selectedCleanupIds];

      // Optimistic removal from UI
      setLocalRetailers(prev => prev.filter(r => !idsToClean.includes(r.id)));

      if (onCleanupRetailers) {
        await onCleanupRetailers(idsToClean, cleanupOrderHandling);
      } else {
        await api.cleanupRetailers(idsToClean, cleanupOrderHandling);
      }

      setCleanupNotification(`Successfully purged ${idsToClean.length} retailer account(s) and handled associated order data.`);
      setIsCleanupModalOpen(false);
      setSelectedCleanupIds([]);
      setTimeout(() => setCleanupNotification(null), 6000);
    } catch (err: any) {
      console.error('Failed to cleanup retailers:', err);
      alert(err?.message || 'Failed to clean up retailer accounts');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleOpenLedger = async (retailerId: string) => {
    try {
      setIsLoadingLedger(true);
      const data = await api.getRetailerLedger(retailerId);
      setLedgerData(data);
    } catch (err) {
      console.error('Failed to fetch ledger', err);
    } finally {
      setIsLoadingLedger(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Retailer & Kirana Network</h1>
          <p className="text-xs text-slate-500">Retail store directory, credit lines, shop photos, and beat route management</p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {/* Verification Dashboard Quick Link */}
          {onNavigateToVerifications && (
            <button
              type="button"
              onClick={onNavigateToVerifications}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              title="Open Retailer Verification & KYC Dashboard"
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Verification Pipeline</span>
              {pendingVerificationsCount !== undefined && pendingVerificationsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white text-amber-900 rounded-full text-[10px] font-black">
                  {pendingVerificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Admin Dedicated Cleanup Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                // Preselect target candidate IDs by default
                const detectedIds = cleanupCandidates.map(c => c.id);
                setSelectedCleanupIds(detectedIds.length > 0 ? detectedIds : ['ret_4', 'ret_3', 'ret_2']);
                setIsCleanupModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              title="Clean up test, sample, and duplicate retailer accounts and their orders"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Cleanup</span>
              {cleanupCandidates.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                  {cleanupCandidates.length}
                </span>
              )}
            </button>
          )}

          {(isAdmin || isSalesman) && (
            <>
              {/* Beat Creation / Delete Management Button */}
              <button
                type="button"
                onClick={() => setIsBeatModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                title="Manage, create, or delete Beat Delivery Routes"
              >
                <Map className="w-4 h-4" />
                <span>Manage Beats</span>
              </button>

              {/* Onboard Retailer Button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Onboard New Retailer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Banner if cleanup just happened */}
      {cleanupNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3.5 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{cleanupNotification}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setCleanupNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detected Test Accounts Banner for Admin */}
      {isAdmin && detectedTestStores.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {detectedTestStores.length} Test / Duplicate Retailer Account(s) Detected
              </p>
              <p className="text-[11px] text-amber-700">
                Found accounts like {detectedTestStores.slice(0, 3).map(s => `"${s.storeName}"`).join(', ')}. Use the Cleanup tool to permanently purge them and handle associated orders.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCleanupIds(detectedTestStores.map(s => s.id));
              setIsCleanupModalOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer shrink-0 shadow-xs flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Review & Clean Up</span>
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Store, Owner, Phone or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          <div>
            <select
              value={selectedBeat}
              onChange={(e) => setSelectedBeat(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="all">All Beat Routes ({beats.length})</option>
              {beats.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="all">All Standing Statuses</option>
              <option value="active">Active (Good Standing)</option>
              <option value="overdue">Overdue / Exceeded Limit</option>
              <option value="blocked">Blocked / Suspended</option>
            </select>
          </div>

          <div>
            <select
              value={creditAccessFilter}
              onChange={(e) => setCreditAccessFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="all">All Credit Access (ON & OFF)</option>
              <option value="enabled">✓ Credit / Udhar: Enabled Only</option>
              <option value="disabled">✕ Credit / Udhar: Disabled Only</option>
            </select>
          </div>

          <div>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              <option value="all">All Verification Statuses</option>
              <option value="verified">✓ KYC Verified Only</option>
              <option value="pending">⏳ Pending Review Only</option>
              <option value="rejected">✕ Rejected Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Retailers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRetailers.map((retailer) => {
          const creditPct = Math.min(100, Math.round((retailer.currentOutstanding / retailer.creditLimit) * 100));
          const isOverdue = retailer.status === 'overdue' || retailer.currentOutstanding > retailer.creditLimit;
          const isVerified = retailer.verificationStatus === 'verified';
          const isRejected = retailer.verificationStatus === 'rejected';

          return (
            <div 
              key={retailer.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-[#2563eb]/60 transition-colors"
            >
              <div>
                {/* Store Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5">
                    {/* Shop Photo or Logo */}
                    {retailer.shopPhotoUrl || retailer.logoUrl ? (
                      <div 
                        onClick={() => setPreviewPhotoUrl({
                          url: retailer.shopPhotoUrl || retailer.logoUrl || '',
                          title: retailer.storeName
                        })}
                        className="relative group cursor-pointer shrink-0 mt-0.5"
                        title="Click to view shop photo"
                      >
                        <img 
                          src={retailer.shopPhotoUrl || retailer.logoUrl} 
                          alt={retailer.storeName}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-300 shadow-xs group-hover:opacity-90"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#2563eb] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Store className="w-5 h-5" />
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight flex items-center gap-1.5">
                        <span>{retailer.storeName}</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">Prop: {retailer.ownerName}</p>
                      {retailer.shopPhotoUrl && (
                        <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 font-semibold mt-0.5">
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>Shop Photo Added</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span className={`status-pill ${
                      retailer.status === 'blocked'
                        ? 'status-danger'
                        : isOverdue
                        ? 'status-warning'
                        : 'status-success'
                    }`}>
                      {retailer.status}
                    </span>

                    {/* Verification Status Pill */}
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 border ${
                      isVerified
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {isVerified ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
                          <span>Verified</span>
                        </>
                      ) : isRejected ? (
                        <>
                          <XCircle className="w-2.5 h-2.5 mr-0.5 text-rose-600" />
                          <span>Rejected</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-2.5 h-2.5 mr-0.5 text-amber-600" />
                          <span>Pending</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Beat & Contact Info */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{retailer.beatName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{retailer.address}</span>
                    {retailer.lat !== undefined && retailer.lng !== undefined && (
                      <a
                        href={`https://www.google.com/maps?q=${retailer.lat},${retailer.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1.5 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1"
                        title={`View GPS on Google Maps: ${retailer.lat}, ${retailer.lng}`}
                      >
                        <MapPin className="w-2.5 h-2.5 text-rose-500" />
                        <span>GPS Pin</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center text-slate-600">
                      <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <span className="font-mono">{retailer.phone}</span>
                    </span>
                    <span className="font-mono text-slate-500 text-[10px]">
                      GSTIN: {retailer.gstin || 'Unregistered'}
                    </span>
                  </div>
                </div>

                {/* Credit Control & Limits */}
                <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/60 p-2.5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Credit Access:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        retailer.creditEnabled 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {retailer.creditEnabled ? '✓ Credit Enabled' : '✕ Disabled (Cash Only)'}
                      </span>
                      
                      {(isAdmin || isAccounts) && (
                        <button
                          type="button"
                          disabled={togglingCreditId === retailer.id}
                          onClick={(e) => handleToggleCredit(retailer, e)}
                          className="text-[10px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
                        >
                          {togglingCreditId === retailer.id ? 'Saving...' : (retailer.creditEnabled ? 'Turn OFF' : 'Turn ON')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Credit Outstanding:</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(retailer.currentOutstanding)}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${creditPct > 90 ? 'bg-rose-500' : creditPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${creditPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Limit: {formatINR(retailer.creditLimit)}</span>
                      <span>Credit Days: {retailer.creditDaysAllowed || 15}d</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenLedger(retailer.id)}
                  className="text-[#2563eb] hover:text-[#1d4ed8] font-semibold flex items-center cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                  <span>Ledger</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  {/* Verification Quick Action for Admin & Salesman */}
                  {(isAdmin || isSalesman) && !isVerified && (
                    <button
                      type="button"
                      disabled={verifyingRetailerId === retailer.id}
                      onClick={() => handleVerifyRetailer(retailer.id, 'verified')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
                      title="Approve & Verify Retailer Store"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{verifyingRetailerId === retailer.id ? '...' : 'Verify Store'}</span>
                    </button>
                  )}

                  {!isRetailer && (
                    <button
                      type="button"
                      onClick={() => onRecordPaymentForRetailer(retailer)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Collect Dues
                    </button>
                  )}

                  {(isAdmin || isSalesman) && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(retailer)}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded-md cursor-pointer"
                      title="Edit Retailer Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  
                  {(isAdmin || isSalesman) && (
                    <button
                      type="button"
                      onClick={() => setDeletingRetailerId(retailer.id)}
                      className="px-2 py-1 text-xs font-semibold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Delete this Retailer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  )}

                  {!isRetailer && (isSalesman || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => onOpenNewOrderForRetailer(retailer.id)}
                      className="px-3 py-1 text-[11px] font-semibold rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white transition-colors cursor-pointer"
                    >
                      + Book
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredRetailers.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          <Store className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="font-semibold text-slate-700">No Retailers Found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query, beat route, or verification status filter.</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE NEW BEAT MODAL                                                     */}
      {/* ========================================================================= */}
      {isBeatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Map className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Beat Route</h3>
                  <p className="text-[11px] text-slate-500">Add a new delivery beat route</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsBeatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateBeat(newBeatName); }} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">Beat Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Utraula Main Market Beat"
                  value={newBeatName}
                  onChange={(e) => setNewBeatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">Locality / Sector Coverage (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Utraula town, Sadar Bazaar, Bus Stand"
                  value={newBeatDescription}
                  onChange={(e) => setNewBeatDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBeatModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Save New Beat
                </button>
              </div>
            </form>

            {/* List of Existing Beats with Delete Option */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Existing Beat Routes ({beats.length}) / Remove Beats:</h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                {beats.map(b => {
                  const count = localRetailers.filter(r => r.beatName === b).length;
                  return (
                    <div key={b} className="flex items-center justify-between py-1.5 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{b}</span>
                        <span className="text-[11px] text-slate-400 ml-2">({count} outlets)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBeat(b)}
                        className="px-2 py-0.5 text-[11px] text-rose-600 hover:bg-rose-50 border border-rose-200 rounded font-medium transition-colors"
                        title="Delete Beat"
                      >
                        Delete Beat
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONBOARD / EDIT RETAILER MODAL WITH SHOP PHOTO CAPTURE                     */}
      {/* ========================================================================= */}
      {isModalOpen && editingRetailer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 my-auto">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingRetailer.id ? 'Edit Retail Outlet Info' : 'Onboard New Kirana Retailer'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Store profile, shop front photo, beat assignment & KYC verification
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModal} className="p-4 overflow-y-auto space-y-4 text-xs">
              
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* SHOP FRONT PHOTO CAPTURE SECTION (CAMERA / FILE UPLOAD)            */}
              {/* ----------------------------------------------------------------- */}
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold text-xs flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-[#2563eb]" />
                    <span>Shop Front Photo (Capture / Upload)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Take a clear photo of the store signboard</span>
                </div>

                {editingRetailer.shopPhotoUrl ? (
                  <div className="relative rounded-lg border border-slate-300 bg-white p-2.5 flex items-center space-x-3.5 shadow-xs">
                    <img 
                      src={editingRetailer.shopPhotoUrl} 
                      alt="Captured Shop" 
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-1 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Photo Uploaded</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        This photo will be displayed in retailer verification and order delivery dispatch.
                      </p>
                      <div className="flex items-center space-x-2 pt-1">
                        <label className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md cursor-pointer flex items-center space-x-1">
                          <Camera className="w-3 h-3 text-[#2563eb]" />
                          <span>Retake Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleShopPhotoCapture}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setEditingRetailer(prev => prev ? { ...prev, shopPhotoUrl: '', logoUrl: '' } : null)}
                          className="px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-md font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-blue-50/50 transition-colors">
                    <div className="p-2.5 bg-blue-50 text-[#2563eb] rounded-full mb-1.5">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs">Capture Shop Photo</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">or upload store front image from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleShopPhotoCapture}
                    />
                  </label>
                )}
              </div>

              {/* Store Name & Owner Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Retail Store / Kirana Name *</label>
                  <input
                    type="text"
                    required
                    value={editingRetailer.storeName || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, storeName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="e.g. Maa Durga Kirana Store"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Owner / Proprietor Name *</label>
                  <input
                    type="text"
                    required
                    value={editingRetailer.ownerName || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, ownerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="e.g. Ramesh Gupta"
                  />
                </div>
              </div>

              {/* Mobile Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={editingRetailer.phone || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, phone: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="+91 98450 12345"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingRetailer.email || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="outlet@gmail.com"
                  />
                </div>
              </div>

              {/* Assigned Beat Route & Area (WITH INLINE BEAT CREATION) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Assigned Beat Route *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingBeatInline(!isAddingBeatInline)}
                      className="text-[10px] font-bold text-[#2563eb] hover:underline cursor-pointer"
                    >
                      {isAddingBeatInline ? '← Choose Existing' : '+ New Beat'}
                    </button>
                  </div>
                  
                  {isAddingBeatInline ? (
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        value={inlineBeatInput}
                        onChange={(e) => setInlineBeatInput(e.target.value)}
                        placeholder="Type new beat name..."
                        className="flex-1 px-2.5 py-1.5 border border-blue-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (inlineBeatInput.trim()) {
                            handleCreateBeat(inlineBeatInput);
                            setEditingRetailer(prev => prev ? { ...prev, beatName: inlineBeatInput.trim() } : null);
                            setIsAddingBeatInline(false);
                            setInlineBeatInput('');
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs font-bold bg-[#2563eb] text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={editingRetailer.beatName || beats[0]}
                      onChange={(e) => setEditingRetailer({ ...editingRetailer, beatName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    >
                      {beats.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={editingRetailer.area || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, area: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="e.g. Sadar Bazaar, Utraula"
                  />
                </div>
              </div>

              {/* Full Address & GPS Location Pinning */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-semibold text-xs sm:text-sm">
                    Full Shop Address *
                  </label>
                  {editingRetailer.lat !== undefined && editingRetailer.lng !== undefined ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>GPS Pinned ({Number(editingRetailer.lat).toFixed(4)}, {Number(editingRetailer.lng).toFixed(4)})</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>GPS Pin Optional</span>
                    </span>
                  )}
                </div>

                {/* Input with Quick Pin from Address button */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editingRetailer.address || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, address: e.target.value })}
                    className="w-full px-3 py-2 pr-28 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs sm:text-sm"
                    placeholder="#12, Main Market, Utraula, Balrampur, UP"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeFromAddress}
                    disabled={isGeocodingAddress || !editingRetailer.address?.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-40 flex items-center space-x-1 cursor-pointer"
                    title="Auto-pin GPS coordinates matching this typed address"
                  >
                    {isGeocodingAddress ? (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-700" />
                    ) : (
                      <Search className="w-3 h-3 text-blue-700" />
                    )}
                    <span>Pin Address</span>
                  </button>
                </div>

                {/* GPS Location Pinning Control Card */}
                <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Navigation className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                          GPS Location Pinning (Live / Map)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Pin exact store coordinates for delivery dispatch & van routing
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Live GPS Button */}
                      <button
                        type="button"
                        onClick={handleDetectGpsLocation}
                        disabled={isDetectingGps}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Acquire live GPS coordinates from this phone or tablet"
                      >
                        {isDetectingGps ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <LocateFixed className="w-3.5 h-3.5 text-white" />
                        )}
                        <span>{isDetectingGps ? 'Locating...' : '📡 Pin Current GPS'}</span>
                      </button>

                      {/* Clear Button if coordinates present */}
                      {(editingRetailer.lat !== undefined || editingRetailer.lng !== undefined) && (
                        <button
                          type="button"
                          onClick={handleClearGpsPin}
                          className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                          title="Reset pinned GPS coordinates"
                        >
                          Clear Pin
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Manual / Pinned Lat & Lng Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Latitude (GPS Lat)</span>
                      <input
                        type="number"
                        step="any"
                        value={editingRetailer.lat !== undefined ? editingRetailer.lat : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setEditingRetailer({ ...editingRetailer, lat: val });
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. 27.316700"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Longitude (GPS Lng)</span>
                      <input
                        type="number"
                        step="any"
                        value={editingRetailer.lng !== undefined ? editingRetailer.lng : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setEditingRetailer({ ...editingRetailer, lng: val });
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g. 82.421000"
                      />
                    </div>
                  </div>

                  {/* Status Banner / Feedback */}
                  {gpsStatus.message && (
                    <div className={`p-2 rounded-lg text-[11px] font-semibold flex items-center justify-between gap-2 ${
                      gpsStatus.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : gpsStatus.type === 'error'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {gpsStatus.type === 'success' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : gpsStatus.type === 'error' ? (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                        )}
                        <span className="truncate">{gpsStatus.message}</span>
                      </div>

                      {editingRetailer.lat !== undefined && editingRetailer.lng !== undefined && (
                        <a
                          href={`https://www.google.com/maps?q=${editingRetailer.lat},${editingRetailer.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 text-blue-700 hover:text-blue-900 font-bold shrink-0 flex items-center space-x-1"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Interactive OpenStreetMap preview when coordinates are pinned */}
                  {editingRetailer.lat !== undefined && editingRetailer.lng !== undefined && !isNaN(Number(editingRetailer.lat)) && !isNaN(Number(editingRetailer.lng)) && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 relative bg-slate-100 h-28 shadow-inner">
                      <iframe
                        title="Store GPS Location Map"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(editingRetailer.lng) - 0.005}%2C${Number(editingRetailer.lat) - 0.004}%2C${Number(editingRetailer.lng) + 0.005}%2C${Number(editingRetailer.lat) + 0.004}&layer=mapnik&marker=${editingRetailer.lat}%2C${editingRetailer.lng}`}
                        className="w-full h-full pointer-events-none"
                      />
                      <div className="absolute bottom-1 right-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-slate-800 shadow-xs border border-slate-200 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-rose-600" />
                        <span>Pinned: {Number(editingRetailer.lat).toFixed(4)}, {Number(editingRetailer.lng).toFixed(4)}</span>
                      </div>
                    </div>
                  )}

                  {/* 1-Tap Aryan Agency Regional Beat Territory Presets */}
                  <div className="pt-1.5 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-1.5">
                      📍 1-Tap Aryan Agency Regional Beat Territory Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {REGIONAL_BEAT_GPS_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setEditingRetailer(prev => prev ? ({
                              ...prev,
                              lat: preset.lat,
                              lng: preset.lng,
                              area: prev.area?.trim() ? prev.area : preset.area
                            }) : null);
                            setGpsStatus({
                              type: 'success',
                              message: `✓ Preset Pinned: ${preset.name} (${preset.lat}, ${preset.lng})`
                            });
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                            editingRetailer.lat === preset.lat && editingRetailer.lng === preset.lng
                              ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editingRetailer.gstin || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, gstin: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="09ABCDE1234F1Z5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={editingRetailer.panNumber || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, panNumber: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>

              {/* Verification & KYC Status */}
              {(isAdmin || isSalesman) && (
                <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      editingRetailer.verificationStatus === 'verified' 
                        ? 'bg-emerald-600 text-white' 
                        : editingRetailer.verificationStatus === 'rejected' 
                        ? 'bg-rose-600 text-white' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Retailer KYC Verification & Order Access
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Retailers cannot place wholesale orders until status is marked Verified
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">Verification Status</label>
                      <select
                        value={editingRetailer.verificationStatus || 'pending'}
                        onChange={(e) => setEditingRetailer({ ...editingRetailer, verificationStatus: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs font-semibold"
                      >
                        <option value="verified">✓ Verified & Approved</option>
                        <option value="pending">⏳ Pending Review</option>
                        <option value="rejected">✕ Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">Verification Remarks</label>
                      <input
                        type="text"
                        value={editingRetailer.verificationRemarks || ''}
                        onChange={(e) => setEditingRetailer({ ...editingRetailer, verificationRemarks: e.target.value })}
                        placeholder="e.g. Shop photo & physical verification confirmed"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Control & Limits Box */}
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${editingRetailer.creditEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Retailer Credit / Udhar Control
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Allow or restrict 15-Day Wholesale Credit during checkout
                      </p>
                    </div>
                  </div>

                  {isAdmin || isAccounts ? (
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingRetailer.creditEnabled)}
                          onChange={(e) => setEditingRetailer({ ...editingRetailer, creditEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                      <span className={`text-xs font-bold ${editingRetailer.creditEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {editingRetailer.creditEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                  ) : (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded ${
                      editingRetailer.creditEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {editingRetailer.creditEnabled ? 'Credit Enabled' : 'Credit Disabled'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      Credit Limit Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      disabled={!isAdmin && !isAccounts}
                      value={editingRetailer.creditLimit !== undefined ? editingRetailer.creditLimit : 50000}
                      onChange={(e) => setEditingRetailer({ ...editingRetailer, creditLimit: Number(e.target.value) })}
                      className={`w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs ${!isAdmin && !isAccounts ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      Credit Days Allowed
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      required
                      disabled={!isAdmin && !isAccounts}
                      value={editingRetailer.creditDaysAllowed !== undefined ? editingRetailer.creditDaysAllowed : 15}
                      onChange={(e) => setEditingRetailer({ ...editingRetailer, creditDaysAllowed: Number(e.target.value) })}
                      className={`w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs ${!isAdmin && !isAccounts ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between space-x-2">
                {editingRetailer.id && (isAdmin || isSalesman) && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = editingRetailer.id;
                      setIsModalOpen(false);
                      setDeletingRetailerId(id);
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors"
                    title="Permanently remove this retail outlet"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete Outlet</span>
                  </button>
                )}

                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-75 text-xs"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSaving ? 'Saving Outlet...' : 'Save Retail Outlet'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHOP PHOTO LIGHTBOX PREVIEW MODAL                                         */}
      {/* ========================================================================= */}
      {previewPhotoUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Store className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm">{previewPhotoUrl.title} - Shop Photo</h3>
              </div>
              <button 
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[75vh]">
              <img 
                src={previewPhotoUrl.url} 
                alt={previewPhotoUrl.title} 
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEDGER MODAL                                                              */}
      {/* ========================================================================= */}
      {ledgerData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {ledgerData.retailer.storeName} - Ledger Statement
                </h3>
                <p className="text-[11px] text-slate-500">
                  Prop: {ledgerData.retailer.ownerName} • GSTIN: {ledgerData.retailer.gstin || 'Unregistered'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setLedgerData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Credit Limit</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(ledgerData.retailer.creditLimit)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding Balance</span>
                  <span className="font-mono font-bold text-rose-600">{formatINR(ledgerData.finalBalance)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-emerald-600 uppercase">{ledgerData.retailer.status}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Debit (₹)</th>
                      <th className="p-2.5 text-right">Credit (₹)</th>
                      <th className="p-2.5 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledgerData.entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono text-slate-600">{entry.date}</td>
                        <td className="p-2.5 font-medium text-slate-900">{entry.description}</td>
                        <td className="p-2.5 text-right font-mono text-slate-700">{entry.debit ? formatINR(entry.debit) : '-'}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600">{entry.credit ? formatINR(entry.credit) : '-'}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatINR(entry.balance)}</td>
                      </tr>
                    ))}
                    {ledgerData.entries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">No transaction entries found for this retailer outlet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setLedgerData(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deletingRetailerId && (() => {
        const targetRetailer = localRetailers.find(r => r.id === deletingRetailerId) || retailers.find(r => r.id === deletingRetailerId);
        const storeOrders = (orders || []).filter(o => o.retailerId === deletingRetailerId);
        const storeOrdersTotal = storeOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Retailer Store</h3>
                  <p className="text-[11px] text-slate-500">Remove outlet from beat routing and database</p>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                <p className="font-bold text-slate-900">{targetRetailer?.storeName || 'Selected Store'}</p>
                <p className="text-slate-500">Owner: {targetRetailer?.ownerName || '-'} • Beat: {targetRetailer?.beatName || '-'}</p>
                {storeOrders.length > 0 && (
                  <p className="text-amber-800 font-semibold pt-1 border-t border-slate-200">
                    ⚠️ Found {storeOrders.length} associated order(s) totaling {formatINR(storeOrdersTotal)}.
                  </p>
                )}
              </div>

              {storeOrders.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">How should associated order data be handled?</p>
                  <label className="flex items-start space-x-2 text-xs text-slate-700 cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="singleDeleteOrderHandling"
                      checked={singleDeleteOrderHandling === 'delete'}
                      onChange={() => setSingleDeleteOrderHandling('delete')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-900">Cascade delete associated orders & payments</span>
                      <p className="text-[11px] text-slate-500">Completely purge test orders so sales figures stay clean.</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-2 text-xs text-slate-700 cursor-pointer p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="singleDeleteOrderHandling"
                      checked={singleDeleteOrderHandling === 'archive'}
                      onChange={() => setSingleDeleteOrderHandling('archive')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-slate-900">Cancel & archive orders</span>
                      <p className="text-[11px] text-slate-500">Mark orders as Cancelled [Account Purged] to preserve history.</p>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingRetailerId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirmed}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Permanent Delete</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* BEAT ROUTE DELETE CONFIRMATION MODAL                                      */}
      {/* ========================================================================= */}
      {deletingBeatName && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Beat Route?</h3>
                <p className="text-[11px] text-slate-500">Remove beat delivery route from system</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 flex items-center space-x-1">
                <span>Beat Name:</span>
                <span className="text-rose-700 font-extrabold">{deletingBeatName}</span>
              </p>
              <p className="text-slate-600 text-[11px]">
                Are you sure you want to delete this beat route? Any retailers or salesmen assigned to this route will be automatically moved to the default beat.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                disabled={isDeletingBeat}
                onClick={() => setDeletingBeatName(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBeat}
                onClick={handleConfirmDeleteBeat}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 disabled:opacity-75"
              >
                {isDeletingBeat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeletingBeat ? 'Deleting Beat...' : 'Confirm Delete Beat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DATA CLEANUP MODAL (ADMIN ONLY)                                           */}
      {/* ========================================================================= */}
      {isCleanupModalOpen && (() => {
        // Calculate cumulative impact of selected cleanup accounts
        const selectedStoresData = cleanupCandidates.filter(c => selectedCleanupIds.includes(c.id));
        const totalAffectedOrders = selectedStoresData.reduce((sum, s) => sum + s.ordersCount, 0);
        const totalAffectedOrdersValue = selectedStoresData.reduce((sum, s) => sum + s.ordersTotal, 0);

        // Search candidate list or other non-candidate retailers that admin might want to clean up
        const otherRetailers = localRetailers.filter(r => 
          !cleanupCandidates.some(c => c.id === r.id) &&
          (
            !cleanupSearchQuery ||
            r.storeName.toLowerCase().includes(cleanupSearchQuery.toLowerCase()) ||
            r.ownerName.toLowerCase().includes(cleanupSearchQuery.toLowerCase()) ||
            r.phone.includes(cleanupSearchQuery)
          )
        );

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Retailer Network & Test Account Cleanup</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Permanently delete test, sample, or duplicate retailer accounts and safely handle associated order records.
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCleanupModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
                
                {/* Section 1: Target Test Accounts */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>Specific Target Accounts for Permanent Deletion</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Target test outlets like Ganesh Daily Needs, Laxmi Supermarket, and Sapthagiri Super Mart.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allCandidateIds = cleanupCandidates.map(c => c.id);
                        const isAllSelected = allCandidateIds.every(id => selectedCleanupIds.includes(id));
                        if (isAllSelected) {
                          setSelectedCleanupIds([]);
                        } else {
                          setSelectedCleanupIds(allCandidateIds);
                        }
                      }}
                      className="text-[11px] font-semibold text-[#2563eb] hover:text-[#1d4ed8] cursor-pointer"
                    >
                      {cleanupCandidates.every(c => selectedCleanupIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {cleanupCandidates.map(store => {
                      const isSelected = selectedCleanupIds.includes(store.id);
                      return (
                        <div
                          key={store.id}
                          onClick={() => {
                            setSelectedCleanupIds(prev => 
                              prev.includes(store.id) 
                                ? prev.filter(id => id !== store.id) 
                                : [...prev, store.id]
                            );
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200' 
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="shrink-0 text-slate-400">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-rose-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900 truncate">{store.storeName}</span>
                                {store.isSpecificTarget && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                    Target Test Outlet
                                  </span>
                                )}
                                {!store.existsInDb && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Target ID: {store.id}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                Prop: {store.ownerName} • Beat: {store.beatName} • Phone: {store.phone}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 text-[11px]">
                            {store.ordersCount > 0 ? (
                              <span className="font-bold text-amber-700 block">
                                {store.ordersCount} Order(s) • {formatINR(store.ordersTotal)}
                              </span>
                            ) : (
                              <span className="text-slate-400 block">0 Orders</span>
                            )}
                            <span className="text-[10px] text-slate-400">Will be purged</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Order Data Handling Strategy (Crucial) */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <Archive className="w-3.5 h-3.5 text-blue-600" />
                    <span>How Should Associated Order Data Be Handled?</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Choose how orders, invoices, and transactions linked to these accounts will be processed.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Cascade Delete */}
                    <div
                      onClick={() => setCleanupOrderHandling('delete')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        cleanupOrderHandling === 'delete'
                          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="cleanupOrderHandling"
                          checked={cleanupOrderHandling === 'delete'}
                          onChange={() => setCleanupOrderHandling('delete')}
                          className="text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900">Cascade Delete (Recommended)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-5 leading-relaxed">
                        Permanently deletes all orders, line items, and payment receipts. Keeps revenue, GMV, and inventory logs completely clean of test numbers.
                      </p>
                    </div>

                    {/* Option 2: Cancel & Archive */}
                    <div
                      onClick={() => setCleanupOrderHandling('archive')}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        cleanupOrderHandling === 'archive'
                          ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-200'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="cleanupOrderHandling"
                          checked={cleanupOrderHandling === 'archive'}
                          onChange={() => setCleanupOrderHandling('archive')}
                          className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900">Cancel & Archive Orders</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-5 leading-relaxed">
                        Retains order history with status updated to 'Cancelled' and note [Retailer Account Cleaned Up], zeroing out ledger balances.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Add other retailers if needed */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs">
                      Clean Up Other Retailers (Optional)
                    </h4>
                    <span className="text-[10px] text-slate-400">Search active stores to add</span>
                  </div>
                  
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search any store to add to this cleanup batch..."
                      value={cleanupSearchQuery}
                      onChange={e => setCleanupSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {cleanupSearchQuery && (
                    <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {otherRetailers.map(r => {
                        const isAdded = selectedCleanupIds.includes(r.id);
                        return (
                          <div key={r.id} className="p-2 flex items-center justify-between hover:bg-slate-50 text-[11px]">
                            <div>
                              <span className="font-bold text-slate-800">{r.storeName}</span>
                              <span className="text-slate-400 ml-1.5">({r.beatName})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCleanupIds(prev => 
                                  isAdded ? prev.filter(id => id !== r.id) : [...prev, r.id]
                                );
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                isAdded 
                                  ? 'bg-rose-100 text-rose-700' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isAdded ? 'Selected ✓' : '+ Add to Cleanup'}
                            </button>
                          </div>
                        );
                      })}
                      {otherRetailers.length === 0 && (
                        <p className="p-2 text-center text-slate-400 text-[11px]">No matching stores found</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Section 4: Summary Impact Box */}
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Accounts to Delete</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedCleanupIds.length} Outlet(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Associated Orders</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {totalAffectedOrders} Order(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Total Order Value</span>
                    <span className="font-bold text-rose-700 text-sm font-mono">
                      {formatINR(totalAffectedOrdersValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-semibold uppercase">Order Handling</span>
                    <span className="font-bold text-blue-700 text-xs">
                      {cleanupOrderHandling === 'delete' ? 'Cascade Delete' : 'Archive History'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsCleanupModalOpen(false)}
                  disabled={isCleaningUp}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCleanup}
                  disabled={selectedCleanupIds.length === 0 || isCleaningUp}
                  className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                    selectedCleanupIds.length === 0 || isCleaningUp
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isCleaningUp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing Permanent Cleanup...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Permanently Clean Up ({selectedCleanupIds.length}) Outlets</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
