import React, { useState } from 'react';
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
  Camera
} from 'lucide-react';
import { Retailer } from '../types';
import { formatINR, formatINRDecimals, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { setRetailerCreditControl, isCreditEnabledForRetailer } from '../lib/retailerCredit';

interface RetailersViewProps {
  retailers: Retailer[];
  onSaveRetailer: (retailer: Partial<Retailer>) => Promise<void>;
  onDeleteRetailer?: (id: string) => Promise<void>;
  onOpenNewOrderForRetailer: (retailerId: string) => void;
  onRecordPaymentForRetailer: (retailer: Retailer) => void;
}

export const RetailersView: React.FC<RetailersViewProps> = ({
  retailers,
  onSaveRetailer,
  onDeleteRetailer,
  onOpenNewOrderForRetailer,
  onRecordPaymentForRetailer
}) => {
  const { isAdmin, isSalesman, isAccounts, isRetailer, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeat, setSelectedBeat] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creditAccessFilter, setCreditAccessFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [togglingCreditId, setTogglingCreditId] = useState<string | null>(null);
  const [verifyingRetailerId, setVerifyingRetailerId] = useState<string | null>(null);

  // Edit / Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Partial<Retailer> | null>(null);
  const [deletingRetailerId, setDeletingRetailerId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Ledger Modal
  const [ledgerData, setLedgerData] = useState<{ retailer: Retailer; entries: any[]; finalBalance: number } | null>(null);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const beats = Array.from(new Set(retailers.map(r => r.beatName))).filter(Boolean);

  const visibleRetailers = currentUser?.role === 'retailer'
    ? retailers.filter(r => 
        (currentUser.retailerId && r.id === currentUser.retailerId) ||
        (currentUser.name && (
          r.storeName.toLowerCase() === currentUser.name.toLowerCase() ||
          r.storeName.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(r.storeName.toLowerCase())
        )) ||
        (currentUser.phone && r.phone && r.phone.includes(currentUser.phone.replace(/\D/g, '').slice(-10)))
      )
    : retailers;

const filteredRetailers = visibleRetailers.filter(r => {

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
    if (!isAdmin) return;
    try {
      setVerifyingRetailerId(retailerId);
      const res = await api.verifyRetailer(retailerId, status, remarks);
      if (res && res.retailer) {
        await onSaveRetailer(res.retailer);
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
    // Instant optimistic update in local credit registry & custom event
    setRetailerCreditControl(retailer.id, {
      creditEnabled: newStatus,
      creditLimit: retailer.creditLimit,
      creditDaysAllowed: retailer.creditDaysAllowed
    });

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
    setEditingRetailer({
      storeName: '',
      ownerName: '',
      phone: '+91 ',
      email: '',
      address: '',
      area: 'Indiranagar',
      beatName: 'Indiranagar Retail Beat',
      gstin: '29ABCDE',
      panNumber: 'ABCDE1234F',
      creditLimit: 50000,
      currentOutstanding: 0,
      creditDaysAllowed: 14,
      status: 'active',
      creditEnabled: false // Disabled by default for new outlets until Admin explicitly approves
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (retailer: Retailer) => {
    setModalError(null);
    setIsSaving(false);
    setEditingRetailer({ 
      ...retailer,
      creditEnabled: retailer.creditEnabled !== undefined ? Boolean(retailer.creditEnabled) : false
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRetailer) return;

    // 1. Client-side field validations
    const storeName = editingRetailer.storeName?.trim();
    if (!storeName) {
      setModalError('Store / Outlet Name is required.');
      return;
    }

    const ownerName = editingRetailer.ownerName?.trim();
    if (!ownerName) {
      setModalError('Owner / Proprietor Name is required.');
      return;
    }

    const rawPhone = editingRetailer.phone?.trim() || '';
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 10) {
      setModalError('A valid 10-digit mobile phone number is required for retailer order and payment tracking.');
      return;
    }

    const address = editingRetailer.address?.trim();
    if (!address) {
      setModalError('Full shop address is required for delivery routing.');
      return;
    }

    // 2. Prevent duplicate phone number registration
    const targetSuffix = digitsOnly.slice(-10);
    const phoneDuplicate = retailers.find(r => {
      if (editingRetailer.id && r.id === editingRetailer.id) return false;
      const existingDigits = (r.phone || '').replace(/\D/g, '');
      return existingDigits.endsWith(targetSuffix);
    });

    if (phoneDuplicate) {
      setModalError(`A retailer outlet with phone ${rawPhone} already exists (${phoneDuplicate.storeName}). Please check the phone number or edit the existing outlet.`);
      return;
    }

    // 3. Prevent duplicate GSTIN registration
    const gstin = editingRetailer.gstin?.trim().toUpperCase() || '';
    if (gstin && gstin.length >= 15) {
      const gstinDuplicate = retailers.find(r => {
        if (editingRetailer.id && r.id === editingRetailer.id) return false;
        return (r.gstin || '').trim().toUpperCase() === gstin;
      });

      if (gstinDuplicate) {
        setModalError(`A retailer outlet with GSTIN ${gstin} already exists (${gstinDuplicate.storeName}).`);
        return;
      }
    }

    try {
      setIsSaving(true);
      setModalError(null);
      await onSaveRetailer(editingRetailer);
      setIsModalOpen(false);
      setEditingRetailer(null);
    } catch (err: any) {
      console.error('[RetailersView Save Error]:', err);
      // Preserve form values and show the actual error message inside the modal
      setModalError(err?.message || 'Failed to save retailer outlet. Please check connection and try again.');
    } finally {
      setIsSaving(false);
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
          <p className="text-xs text-slate-500">Retail store directory, credit lines, payment ledgers, and beat assignments</p>
        </div>

        {(isAdmin || isSalesman) && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Onboard New Retailer</span>
          </button>
        )}
      </div>

      {/* Filters */}
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
              <option value="all">All KYC Statuses</option>
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

          return (
            <div 
              key={retailer.id}
              className="bg-white rounded-lg border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-[#2563eb]/60 transition-colors"
            >
              <div>
                {/* Store Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2.5">
                    {retailer.logoUrl ? (
                      <img 
                        src={retailer.logoUrl} 
                        alt={retailer.storeName}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Store className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{retailer.storeName}</h3>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5">Prop: {retailer.ownerName}</p>
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
                      retailer.verificationStatus === 'verified'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : retailer.verificationStatus === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {retailer.verificationStatus === 'verified' ? (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />
                          <span>KYC Verified</span>
                        </>
                      ) : retailer.verificationStatus === 'rejected' ? (
                        <>
                          <XCircle className="w-2.5 h-2.5 mr-0.5 text-rose-600" />
                          <span>Rejected</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-2.5 h-2.5 mr-0.5 text-amber-600" />
                          <span>Pending KYC</span>
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
                      <Phone className="w-3 h-3 mr-1 text-slate-400" />
                      {retailer.phone}
                    </span>
                    {retailer.gstin && (
                      <span className="font-mono text-slate-500 font-medium">
                        GST: {retailer.gstin}
                      </span>
                    )}
                  </div>
                </div>

                {/* Credit Limit & Outstanding Gauge */}
                <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Outstanding Dues:</span>
                    <span className="font-mono font-bold text-rose-700">{formatINR(retailer.currentOutstanding)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                    <span>Credit Limit:</span>
                    <span className="font-mono text-slate-800">{formatINR(retailer.creditLimit)} ({retailer.creditDaysAllowed} days)</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        creditPct > 90 ? 'bg-rose-500' : creditPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${creditPct}%` }}
                    />
                  </div>

                  {/* Admin Credit Control Switch */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/90 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <CreditCard className={`w-3.5 h-3.5 ${retailer.creditEnabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-[11px] font-semibold text-slate-700">
                        Credit / Udhar:
                      </span>
                    </div>

                    {isAdmin || isAccounts ? (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          disabled={togglingCreditId === retailer.id}
                          onClick={(e) => handleToggleCredit(retailer, e)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            retailer.creditEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                          } ${togglingCreditId === retailer.id ? 'opacity-60 cursor-wait' : ''}`}
                          title={retailer.creditEnabled ? 'Click to Disable credit for this retailer' : 'Click to Enable credit for this retailer'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              retailer.creditEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          retailer.creditEnabled ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          {retailer.creditEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        retailer.creditEnabled 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {retailer.creditEnabled ? 'Active' : 'Disabled'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleOpenLedger(retailer.id)}
                  className="text-[#2563eb] hover:text-[#1d4ed8] font-semibold flex items-center cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                  <span>Ledger</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  {isAdmin && retailer.verificationStatus !== 'verified' && (
                    <button
                      disabled={verifyingRetailerId === retailer.id}
                      onClick={() => handleVerifyRetailer(retailer.id, 'verified')}
                      className="px-2 py-1 text-[11px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
                      title="Approve & Verify Retailer KYC Profile"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{verifyingRetailerId === retailer.id ? '...' : 'Verify'}</span>
                    </button>
                  )}

                  {!isRetailer && (
                    <button
                      onClick={() => onRecordPaymentForRetailer(retailer)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      Collect Dues
                    </button>
                  )}

                  {(isAdmin || isSalesman) && (
                    <button
                      onClick={() => handleOpenEdit(retailer)}
                      className="p-1 text-slate-500 hover:text-blue-600 rounded-md cursor-pointer"
                      title="Edit Retailer Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && onDeleteRetailer && (
                    <button
                      onClick={() => setDeletingRetailerId(retailer.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                      title="Delete Retailer (Admin Only)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {!isRetailer && (isSalesman || isAdmin) && (
                    <button
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

      {/* Add / Edit Retailer Modal */}
      {isModalOpen && editingRetailer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingRetailer.id ? 'Edit Retail Outlet Info' : 'Onboard New Kirana Retailer'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto text-xs">
              
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2 text-rose-700 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed font-medium">
                    {modalError}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Store / Outlet Name *</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Beat Route *</label>
                  <select
                    value={editingRetailer.beatName || 'Indiranagar Retail Beat'}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, beatName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  >
                    <option value="Indiranagar Retail Beat">Indiranagar Retail Beat</option>
                    <option value="MG Road Commercial Beat">MG Road Commercial Beat</option>
                    <option value="Koramangala Daily Beat">Koramangala Daily Beat</option>
                    <option value="Whitefield Supermarket Beat">Whitefield Supermarket Beat</option>
                    <option value="Jayanagar Provision Beat">Jayanagar Provision Beat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Area / Locality</label>
                  <input
                    type="text"
                    value={editingRetailer.area || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, area: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="e.g. 100ft Road"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Shop Address</label>
                <input
                  type="text"
                  required
                  value={editingRetailer.address || ''}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="#42, 100ft Road, Indiranagar, Bangalore"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    value={editingRetailer.city || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="Bangalore"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    value={editingRetailer.state || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, state: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="Karnataka"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={editingRetailer.pincode || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, pincode: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="560038"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Store Logo / Board Photo (URL)</label>
                <input
                  type="url"
                  value={editingRetailer.logoUrl || ''}
                  onChange={(e) => setEditingRetailer({ ...editingRetailer, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="https://images.unsplash.com/... or image link"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={editingRetailer.gstin || ''}
                    onChange={(e) => setEditingRetailer({ ...editingRetailer, gstin: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="29ABCDE1234F1Z5"
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

              {/* Admin KYC Verification Box */}
              {isAdmin && (
                <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
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
                          KYC Profile Verification & Approval
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Verify retailer identity documents (GST, PAN, Shop board photo)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">Verification Status</label>
                      <select
                        value={editingRetailer.verificationStatus || 'pending'}
                        onChange={(e) => setEditingRetailer({ ...editingRetailer, verificationStatus: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs font-semibold"
                      >
                        <option value="pending">⏳ Pending Review</option>
                        <option value="verified">✓ Verified & Approved</option>
                        <option value="rejected">✕ Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">Verification Remarks / Notes</label>
                      <input
                        type="text"
                        value={editingRetailer.verificationRemarks || ''}
                        onChange={(e) => setEditingRetailer({ ...editingRetailer, verificationRemarks: e.target.value })}
                        placeholder="e.g. GSTIN and physical shop verified"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs"
                      >
                      </input>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Credit Control & Limits Box */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingRetailer.creditEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Retailer Credit / Udhar Control
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {isAdmin || isAccounts 
                          ? 'Allow or restrict 15-Day Wholesale Credit during checkout' 
                          : 'Admin restricted: Retailer cannot modify their own credit settings'}
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-blue-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      Credit Limit Amount (₹) {!isAdmin && !isAccounts && <span className="text-[10px] text-slate-400 font-normal">(Admin setting)</span>}
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
                      Credit Days Allowed {!isAdmin && !isAccounts && <span className="text-[10px] text-slate-400 font-normal">(Admin setting)</span>}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      required
                      disabled={!isAdmin && !isAccounts}
                      value={editingRetailer.creditDaysAllowed !== undefined ? editingRetailer.creditDaysAllowed : 14}
                      onChange={(e) => setEditingRetailer({ ...editingRetailer, creditDaysAllowed: Number(e.target.value) })}
                      className={`w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs ${!isAdmin && !isAccounts ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      Account Status {!isAdmin && <span className="text-[10px] text-slate-400 font-normal">(Admin setting)</span>}
                    </label>
                    <select
                      disabled={!isAdmin}
                      value={editingRetailer.status || 'active'}
                      onChange={(e) => setEditingRetailer({ ...editingRetailer, status: e.target.value as any })}
                      className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-xs ${!isAdmin ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                    >
                      <option value="active">Active</option>
                      <option value="overdue">Overdue</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>
              </div>

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
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Saving Outlet...' : 'Save Retail Outlet'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Ledger Statement Modal */}
      {ledgerData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Account Ledger Statement • {ledgerData.retailer.storeName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Prop: {ledgerData.retailer.ownerName} • GSTIN: {ledgerData.retailer.gstin || 'Unregistered'}
                </p>
              </div>
              <button 
                onClick={() => setLedgerData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statement Summary */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Credit Limit</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(ledgerData.retailer.creditLimit)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Outstanding Balance</span>
                <span className="font-mono font-bold text-rose-700">{formatINR(ledgerData.finalBalance)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Credit Terms</span>
                <span className="font-semibold text-slate-800">{ledgerData.retailer.creditDaysAllowed} Days Allowed</span>
              </div>
            </div>

            {/* Entries Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f1f5f9] text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type & Ref</th>
                    <th className="px-3 py-2">Particulars / Details</th>
                    <th className="px-3 py-2 text-right">Debit (₹)</th>
                    <th className="px-3 py-2 text-right">Credit (₹)</th>
                    <th className="px-3 py-2 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerData.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-slate-500">
                        {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold">
                        <span className={`status-pill ${
                          entry.type === 'invoice' ? 'status-info' : 'status-success'
                        }`}>
                          {entry.referenceNumber}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700 max-w-xs">
                        {entry.description}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-900 font-semibold">
                        {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700 font-semibold">
                        {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                        {formatINR(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs cursor-pointer"
              >
                Print Statement
              </button>
              <button
                onClick={() => setLedgerData(null)}
                className="px-4 py-1.5 bg-[#1e293b] hover:bg-slate-800 text-white font-semibold rounded-lg text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRetailerId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Retailer?</h3>
                <p className="text-[11px] text-slate-500">This will remove the store from active beat routing.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong>{retailers.find(r => r.id === deletingRetailerId)?.storeName}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingRetailerId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletingRetailerId && onDeleteRetailer) {
                    await onDeleteRetailer(deletingRetailerId);
                    setDeletingRetailerId(null);
                  }
                }}
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
