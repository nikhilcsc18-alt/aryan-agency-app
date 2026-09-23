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
  Eye
} from 'lucide-react';
import { Retailer } from '../types';
import { formatINR, formatINRDecimals, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { setRetailerCreditControl, isCreditEnabledForRetailer } from '../lib/retailerCredit';

interface RetailersViewProps {
  retailers: Retailer[];
  onSaveRetailer: (retailer: Partial<Retailer>) => Promise<void>;
  onVerifyRetailer?: (id: string, status: 'verified' | 'rejected', remarks?: string) => Promise<void>;
  onDeleteRetailer?: (id: string) => Promise<void>;
  onOpenNewOrderForRetailer: (retailerId: string) => void;
  onRecordPaymentForRetailer: (retailer: Retailer) => void;
}

const DEFAULT_BEAT_ROUTES = [
  'Utraula Retail Beat',
  'Balrampur Central Beat',
  'Jarwa Rural Beat',
  'Tulsipur Provision Beat',
  'Indiranagar Retail Beat',
  'MG Road Commercial Beat',
  'Koramangala Daily Beat',
  'Whitefield Supermarket Beat',
  'Jayanagar Provision Beat'
];

export const RetailersView: React.FC<RetailersViewProps> = ({
  retailers,
  onSaveRetailer,
  onVerifyRetailer,
  onDeleteRetailer,
  onOpenNewOrderForRetailer,
  onRecordPaymentForRetailer
}) => {
  const { isAdmin, isSalesman, isAccounts, isRetailer, currentUser } = useAuth();
  
  // Local retailers state for instant optimistic updates
  const [localRetailers, setLocalRetailers] = useState<Retailer[]>(retailers);
  useEffect(() => {
    setLocalRetailers(retailers);
  }, [retailers]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeat, setSelectedBeat] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creditAccessFilter, setCreditAccessFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [togglingCreditId, setTogglingCreditId] = useState<string | null>(null);
  const [verifyingRetailerId, setVerifyingRetailerId] = useState<string | null>(null);

  // Beat Management State
  const [customBeats, setCustomBeats] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fmcg_custom_beats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isBeatModalOpen, setIsBeatModalOpen] = useState(false);
  const [newBeatName, setNewBeatName] = useState('');
  const [newBeatDescription, setNewBeatDescription] = useState('');
  const [isAddingBeatInline, setIsAddingBeatInline] = useState(false);
  const [inlineBeatInput, setInlineBeatInput] = useState('');

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Partial<Retailer> | null>(null);
  const [deletingRetailerId, setDeletingRetailerId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Shop Photo Lightbox Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<{ url: string; title: string } | null>(null);

  // Ledger Modal
  const [ledgerData, setLedgerData] = useState<{ retailer: Retailer; entries: any[]; finalBalance: number } | null>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // Aggregate all beats
  const beats = Array.from(new Set([
    ...DEFAULT_BEAT_ROUTES,
    ...localRetailers.map(r => r.beatName),
    ...customBeats
  ])).filter(Boolean);

  const handleCreateBeat = (beatNameToAdd: string) => {
    const trimmed = beatNameToAdd.trim();
    if (!trimmed) return;
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
      shopPhotoUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (retailer: Retailer) => {
    setModalError(null);
    setIsSaving(false);
    setIsAddingBeatInline(false);
    setEditingRetailer({
      ...retailer,
      creditEnabled: Boolean(retailer.creditEnabled)
    });
    setIsModalOpen(true);
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
        beatName: editingRetailer.beatName || beats[0]
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
    
    // Instant optimistic removal from UI
    setLocalRetailers(prev => prev.filter(r => r.id !== targetId));
    setDeletingRetailerId(null);

    if (onDeleteRetailer) {
      try {
        await onDeleteRetailer(targetId);
      } catch (err) {
        console.error('Failed to delete retailer:', err);
      }
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

        {(isAdmin || isSalesman) && (
          <div className="flex items-center space-x-2.5">
            {/* Beat Creation Button */}
            <button
              type="button"
              onClick={() => setIsBeatModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              title="Add a new Beat Delivery Route"
            >
              <Map className="w-4 h-4" />
              <span>+ Create Beat (नई बीट)</span>
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
          </div>
        )}
      </div>

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
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 truncate">
                    <span>{retailer.address}</span>
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
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                      title="Delete Retailer"
                    >
                      <Trash2 className="w-4 h-4" />
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
                  <p className="text-[11px] text-slate-500">नई बीट डिलीवरी मार्ग जोड़ें</p>
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
                <label className="block text-slate-700 font-semibold text-xs mb-1">Beat Name / बीट का नाम *</label>
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
                  Save New Beat (बीट सुरक्षित करें)
                </button>
              </div>
            </form>
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
                    <span>Shop Front Photo / दुकान की फोटो (Capture / Upload)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">दुकान के बोर्ड की साफ फोटो लें</span>
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
                        <span>फोटो सुरक्षित है (Photo Uploaded)</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        यह फोटो दुकान सत्यापन व ऑर्डर डिलीवरी में प्रदर्शित होगी।
                      </p>
                      <div className="flex items-center space-x-2 pt-1">
                        <label className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md cursor-pointer flex items-center space-x-1">
                          <Camera className="w-3 h-3 text-[#2563eb]" />
                          <span>Retake (दोबारा लें)</span>
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
                    <span className="font-bold text-slate-800 text-xs">कैमरा से दुकान की फोटो खींचें (Capture Shop Photo)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">या गैलरी से दुकान की इमेज अपलोड करें</span>
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
                    placeholder="e.g. Laxmi Supermarket"
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
                      {isAddingBeatInline ? '← Choose Existing' : '+ New Beat (नई बीट)'}
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

              {/* Full Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Shop Address *</label>
                <input
                  type="text"
                  required
                  value={editingRetailer.address || ''}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="#12, Main Market, Utraula, Balrampur, UP"
                />
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
                        <option value="verified">✓ Verified & Approved (ऑर्डर चालू)</option>
                        <option value="pending">⏳ Pending Review (सत्यापन लंबित)</option>
                        <option value="rejected">✕ Rejected (अस्वीकृत)</option>
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-75"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Saving Outlet...' : 'Save Retail Outlet'}</span>
                </button>
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
      {deletingRetailerId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Retailer?</h3>
                <p className="text-[11px] text-slate-500">This will remove the store from active beat routing.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong>{localRetailers.find(r => r.id === deletingRetailerId)?.storeName}</strong>?
            </p>

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
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete Retailer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
