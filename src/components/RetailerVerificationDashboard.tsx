import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Store, 
  Phone, 
  MapPin, 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Camera, 
  ExternalLink, 
  MessageSquare, 
  IndianRupee, 
  Check, 
  X, 
  ChevronRight, 
  Sparkles, 
  RefreshCw, 
  ListFilter, 
  SlidersHorizontal,
  Building,
  CreditCard,
  History,
  Send,
  Eye,
  Layers,
  ArrowRight,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import { Retailer, Order, VerificationTimelineEvent } from '../types';
import { formatINR, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface RetailerVerificationDashboardProps {
  retailers: Retailer[];
  orders?: Order[];
  onVerifyRetailer: (
    id: string, 
    status: 'verified' | 'rejected', 
    remarks?: string, 
    reasonCode?: string,
    options?: { creditLimit?: number; creditEnabled?: boolean; creditDaysAllowed?: number; beatName?: string }
  ) => Promise<void>;
  onSaveRetailer?: (retailer: Partial<Retailer>) => Promise<void>;
  onNavigateToRetailers?: () => void;
  onRefreshData?: () => Promise<void>;
}

// Structured Approval Reason Codes
export interface ApprovalReasonOption {
  code: string;
  label: string;
  description: string;
  defaultCreditLimit: number;
  creditEnabled: boolean;
  creditDaysAllowed: number;
  badgeColor: string;
}

export const APPROVAL_REASON_CODES: ApprovalReasonOption[] = [
  {
    code: 'DOCS_VALIDATED',
    label: 'Valid GSTIN & Trade KYC Verified',
    description: 'Government GSTIN/PAN and trade registration successfully validated with state tax registry.',
    defaultCreditLimit: 50000,
    creditEnabled: true,
    creditDaysAllowed: 15,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300'
  },
  {
    code: 'PHYSICAL_STORE_VERIFIED',
    label: 'Physical Storefront Inspected by Beat Agent',
    description: 'Beat Sales Representative physically visited the shop counter and confirmed active retail trade.',
    defaultCreditLimit: 50000,
    creditEnabled: true,
    creditDaysAllowed: 15,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-300'
  },
  {
    code: 'ESTABLISHED_KIRANA',
    label: 'High-Volume Established Kirana Counter',
    description: 'Renowned local retail counter with strong daily turnover. Approved with standard wholesale credit.',
    defaultCreditLimit: 75000,
    creditEnabled: true,
    creditDaysAllowed: 21,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-300'
  },
  {
    code: 'CASH_ONLY_ONBOARDING',
    label: 'Cash-on-Delivery / Spot Cash Wholesale (Zero Risk)',
    description: 'Approved strictly for spot cash and digital UPI settlement. Credit line disabled.',
    defaultCreditLimit: 0,
    creditEnabled: false,
    creditDaysAllowed: 0,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
  },
  {
    code: 'PROVISIONAL_CREDIT',
    label: 'Provisional Starter Credit Line',
    description: 'Trial approval with conservative credit limit (₹25,000 / 7 days) pending payment discipline.',
    defaultCreditLimit: 25000,
    creditEnabled: true,
    creditDaysAllowed: 7,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-300'
  },
  {
    code: 'FAST_TRACK_VERIFIED',
    label: 'Fast-Track Depot Referral',
    description: 'Approved via agency management reference or distributor executive recommendation.',
    defaultCreditLimit: 50000,
    creditEnabled: true,
    creditDaysAllowed: 15,
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-300'
  },
  {
    code: 'CUSTOM_APPROVAL',
    label: 'Custom Approval Justification',
    description: 'Custom discretionary approval logged by agency administrator.',
    defaultCreditLimit: 50000,
    creditEnabled: true,
    creditDaysAllowed: 15,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  }
];

// Structured Rejection Reason Codes
export interface RejectionReasonOption {
  code: string;
  label: string;
  description: string;
  retailerNotice: string;
  badgeColor: string;
}

export const REJECTION_REASON_CODES: RejectionReasonOption[] = [
  {
    code: 'DOCS_INVALID',
    label: 'Invalid or Unverifiable GSTIN / PAN',
    description: 'Provided GSTIN or PAN does not match government records or is currently cancelled/inactive.',
    retailerNotice: 'Your GSTIN or PAN could not be verified in the state tax database. Please provide valid business registration or choose unregistered status.',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-300'
  },
  {
    code: 'SHOP_PHOTO_MISSING',
    label: 'Storefront / Signboard Photo Missing or Unclear',
    description: 'Uploaded photo is blurry, does not display a clear commercial signboard, or was rejected.',
    retailerNotice: 'Please upload a clear daylight photo of your shopfront clearly showing the store signboard and merchandise counter.',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300'
  },
  {
    code: 'OUT_OF_BEAT_AREA',
    label: 'Location Outside Delivery Beat Coverage',
    description: 'Store physical location is not currently serviced by Aryan Agency logistics routes.',
    retailerNotice: 'Your store location falls outside our current delivery beats (Utraula, Balrampur, Tulsipur, Jarwa). Contact depot for route expansion.',
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-300'
  },
  {
    code: 'DUPLICATE_ACCOUNT',
    label: 'Duplicate Store or Mobile Number',
    description: 'A retailer account with identical mobile number, store name, or address already exists in system.',
    retailerNotice: 'An active retailer account with this mobile phone or shop identity already exists. Please log in using your registered mobile number.',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  {
    code: 'UNREACHABLE_PHONE',
    label: 'Proprietor Contact Unreachable',
    description: 'Telephonic verification failed after multiple attempts; phone is switched off or invalid.',
    retailerNotice: 'Our verification team was unable to reach your contact number. Please update an active, reachable mobile number.',
    badgeColor: 'bg-red-50 text-red-700 border-red-300'
  },
  {
    code: 'CREDIT_DEFAULT',
    label: 'Adverse Market Credit History',
    description: 'Negative credit reference or documented past default in local FMCG wholesale market.',
    retailerNotice: 'Wholesale credit account could not be approved due to credit check guidelines. You may re-apply for spot cash delivery only.',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-400'
  },
  {
    code: 'INCOMPLETE_ADDRESS',
    label: 'Incomplete / Vague Delivery Address',
    description: 'Address lacks landmark, street name, or pincode required for delivery van dispatch.',
    retailerNotice: 'Please update your complete physical shop address including street name, nearby landmark, and correct pincode.',
    badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-300'
  },
  {
    code: 'NON_RETAIL_ESTABLISHMENT',
    label: 'Not a Commercial Retail / Kirana Outlet',
    description: 'Applicant does not operate a genuine retail FMCG shop or consumer goods counter.',
    retailerNotice: 'Aryan Agency B2B portal is reserved exclusively for commercial retail store owners and kirana establishments.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-300'
  },
  {
    code: 'CUSTOM_REJECTION',
    label: 'Other Custom Rejection Reason',
    description: 'Administrative refusal logged with specific remarks.',
    retailerNotice: 'Your retailer application requires modification. Please see admin remarks or contact your beat sales representative.',
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-300'
  }
];

export const RetailerVerificationDashboard: React.FC<RetailerVerificationDashboardProps> = ({
  retailers,
  orders = [],
  onVerifyRetailer,
  onSaveRetailer,
  onNavigateToRetailers,
  onRefreshData
}) => {
  const { currentUser, isAdmin, isSalesman } = useAuth();

  // Filters & View Mode
  const [viewMode, setViewMode] = useState<'timeline' | 'cards' | 'table'>('timeline');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [selectedBeat, setSelectedBeat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [activeApprovalRetailer, setActiveApprovalRetailer] = useState<Retailer | null>(null);
  const [selectedApprovalReason, setSelectedApprovalReason] = useState<string>(APPROVAL_REASON_CODES[0].code);
  const [approvalCreditLimit, setApprovalCreditLimit] = useState<number>(50000);
  const [approvalCreditEnabled, setApprovalCreditEnabled] = useState<boolean>(true);
  const [approvalCreditDays, setApprovalCreditDays] = useState<number>(15);
  const [approvalBeatName, setApprovalBeatName] = useState<string>('');
  const [approvalRemarks, setApprovalRemarks] = useState<string>('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Rejection Modal States
  const [activeRejectionRetailer, setActiveRejectionRetailer] = useState<Retailer | null>(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>(REJECTION_REASON_CODES[0].code);
  const [rejectionRemarks, setRejectionRemarks] = useState<string>('');
  const [isProcessingRejection, setIsProcessingRejection] = useState(false);

  // Photo Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Audit Note Modal
  const [activeNoteRetailer, setActiveNoteRetailer] = useState<Retailer | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Distinct beats from active retailers
  const allBeats = useMemo(() => {
    const set = new Set<string>();
    retailers.forEach(r => {
      if (r.beatName) set.add(r.beatName);
    });
    return Array.from(set).sort();
  }, [retailers]);

  // Derived Retailers List with Normalization
  const normalizedRetailers = useMemo(() => {
    return retailers.map(r => {
      const status = r.verificationStatus || 'pending';
      const submittedDate = r.submittedAt || r.createdAt || '2026-09-30T10:00:00Z';
      
      // Synthesize timeline if not present
      let timeline = r.verificationTimeline || [];
      if (!timeline || timeline.length === 0) {
        timeline = [];
        timeline.push({
          id: `tl_init_${r.id}`,
          timestamp: submittedDate,
          type: 'submitted',
          actorName: r.ownerName || 'Proprietor',
          actorRole: 'retailer',
          title: 'Retailer Onboarding Application Submitted',
          description: `Registered outlet "${r.storeName}" in ${r.beatName || 'Assigned Beat'}.`
        });

        if (r.gstin && r.gstin !== 'UNREGISTERED') {
          timeline.push({
            id: `tl_gst_${r.id}`,
            timestamp: new Date(new Date(submittedDate).getTime() + 15 * 60 * 1000).toISOString(),
            type: 'document_uploaded',
            actorName: 'System KYC Check',
            actorRole: 'system',
            title: `GSTIN ${r.gstin} Attached`,
            description: 'Business registration provided for tax invoicing.'
          });
        }

        if (r.shopPhotoUrl) {
          timeline.push({
            id: `tl_photo_${r.id}`,
            timestamp: new Date(new Date(submittedDate).getTime() + 30 * 60 * 1000).toISOString(),
            type: 'document_uploaded',
            actorName: 'Storefront Verification',
            actorRole: 'retailer',
            title: 'Shop Front Photo Uploaded',
            description: 'Commercial signboard photo provided for verification.'
          });
        }

        if (status === 'verified') {
          timeline.push({
            id: `tl_ver_${r.id}`,
            timestamp: r.verifiedAt || new Date().toISOString(),
            type: 'approved',
            actorName: r.verifiedBy || 'Admin',
            actorRole: 'admin',
            title: `Store Verification Approved [${r.verificationReasonCode || 'DOCS_VALIDATED'}]`,
            description: r.verificationRemarks || 'Account verified and credit line unlocked for wholesale orders.',
            reasonCode: r.verificationReasonCode || 'DOCS_VALIDATED'
          });
        } else if (status === 'rejected') {
          timeline.push({
            id: `tl_rej_${r.id}`,
            timestamp: r.verifiedAt || new Date().toISOString(),
            type: 'rejected',
            actorName: r.verifiedBy || 'Admin',
            actorRole: 'admin',
            title: `Verification Rejected [${r.verificationReasonCode || 'DOCS_INVALID'}]`,
            description: r.verificationRemarks || 'Store application rejected.',
            reasonCode: r.verificationReasonCode || 'DOCS_INVALID'
          });
        }
      }

      // Calculate age in hours
      const nowMs = Date.now();
      const subMs = new Date(submittedDate).getTime();
      const ageHours = Math.max(0, Math.floor((nowMs - subMs) / (1000 * 3600)));

      return {
        ...r,
        verificationStatus: status,
        submittedAt: submittedDate,
        verificationTimeline: timeline,
        ageHours
      };
    });
  }, [retailers]);

  // Filtered List
  const filteredRetailers = useMemo(() => {
    return normalizedRetailers.filter(r => {
      // Status filter
      if (statusFilter !== 'all' && r.verificationStatus !== statusFilter) {
        return false;
      }
      // Beat filter
      if (selectedBeat !== 'all' && r.beatName !== selectedBeat) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          r.storeName.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          (r.phone && r.phone.includes(q)) ||
          (r.gstin && r.gstin.toLowerCase().includes(q)) ||
          (r.beatName && r.beatName.toLowerCase().includes(q)) ||
          (r.address && r.address.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      // Pending first, then newest
      if (a.verificationStatus === 'pending' && b.verificationStatus !== 'pending') return -1;
      if (b.verificationStatus === 'pending' && a.verificationStatus !== 'pending') return 1;
      return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
    });
  }, [normalizedRetailers, statusFilter, selectedBeat, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = normalizedRetailers.length;
    const pending = normalizedRetailers.filter(r => r.verificationStatus === 'pending');
    const verified = normalizedRetailers.filter(r => r.verificationStatus === 'verified');
    const rejected = normalizedRetailers.filter(r => r.verificationStatus === 'rejected');
    
    // SLA metrics (Pending > 24h is breached SLA)
    const overdueSla = pending.filter(r => (r.ageHours || 0) >= 24).length;
    const withinSla = pending.filter(r => (r.ageHours || 0) < 24).length;

    // Total credit granted
    const totalCreditUnlocked = verified.reduce((sum, r) => sum + (r.creditLimit || 0), 0);

    return {
      total,
      pendingCount: pending.length,
      verifiedCount: verified.length,
      rejectedCount: rejected.length,
      overdueSla,
      withinSla,
      totalCreditUnlocked
    };
  }, [normalizedRetailers]);

  // Grouped Timeline Helper
  const timelineGroups = useMemo(() => {
    const groups: { [key: string]: typeof filteredRetailers } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Earlier': []
    };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    filteredRetailers.forEach(item => {
      const itemDate = new Date(item.submittedAt || '');
      const itemDateStr = itemDate.toISOString().split('T')[0];

      if (itemDateStr === todayStr) {
        groups['Today'].push(item);
      } else if (itemDateStr === yesterdayStr) {
        groups['Yesterday'].push(item);
      } else if (itemDate > weekAgo) {
        groups['This Week'].push(item);
      } else {
        groups['Earlier'].push(item);
      }
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [filteredRetailers]);

  // Open structured approval modal
  const handleOpenApproveModal = (retailer: Retailer) => {
    setActiveApprovalRetailer(retailer);
    const defaultReason = APPROVAL_REASON_CODES[0];
    setSelectedApprovalReason(defaultReason.code);
    setApprovalCreditLimit(retailer.creditLimit || defaultReason.defaultCreditLimit);
    setApprovalCreditEnabled(retailer.creditEnabled !== undefined ? retailer.creditEnabled : defaultReason.creditEnabled);
    setApprovalCreditDays(retailer.creditDaysAllowed || defaultReason.creditDaysAllowed);
    setApprovalBeatName(retailer.beatName || allBeats[0] || 'Utraula Retail Beat');
    setApprovalRemarks(`Verified and approved by ${currentUser?.name || 'Admin'} on ${new Date().toLocaleDateString('en-IN')}`);
  };

  // Change Approval Reason - auto update suggested credit
  const handleReasonCodeChange = (code: string) => {
    setSelectedApprovalReason(code);
    const matched = APPROVAL_REASON_CODES.find(c => c.code === code);
    if (matched) {
      setApprovalCreditLimit(matched.defaultCreditLimit);
      setApprovalCreditEnabled(matched.creditEnabled);
      setApprovalCreditDays(matched.creditDaysAllowed);
    }
  };

  // Execute Approval
  const handleExecuteApproval = async () => {
    if (!activeApprovalRetailer) return;
    try {
      setIsProcessingApproval(true);
      await onVerifyRetailer(
        activeApprovalRetailer.id,
        'verified',
        approvalRemarks.trim(),
        selectedApprovalReason,
        {
          creditLimit: approvalCreditLimit,
          creditEnabled: approvalCreditEnabled,
          creditDaysAllowed: approvalCreditDays,
          beatName: approvalBeatName
        }
      );
      setActionSuccessMsg(`Store "${activeApprovalRetailer.storeName}" has been successfully approved & verified.`);
      setActiveApprovalRetailer(null);
      setTimeout(() => setActionSuccessMsg(null), 5000);
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      console.error('Failed to approve retailer:', err);
      alert(err?.message || 'Failed to verify retailer account');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Open structured rejection modal
  const handleOpenRejectModal = (retailer: Retailer) => {
    setActiveRejectionRetailer(retailer);
    const defaultRejection = REJECTION_REASON_CODES[0];
    setSelectedRejectionReason(defaultRejection.code);
    setRejectionRemarks(defaultRejection.retailerNotice);
  };

  // Change Rejection Reason - auto update notice
  const handleRejectionCodeChange = (code: string) => {
    setSelectedRejectionReason(code);
    const matched = REJECTION_REASON_CODES.find(c => c.code === code);
    if (matched) {
      setRejectionRemarks(matched.retailerNotice);
    }
  };

  // Execute Rejection
  const handleExecuteRejection = async () => {
    if (!activeRejectionRetailer) return;
    try {
      setIsProcessingRejection(true);
      await onVerifyRetailer(
        activeRejectionRetailer.id,
        'rejected',
        rejectionRemarks.trim(),
        selectedRejectionReason
      );
      setActionSuccessMsg(`Store "${activeRejectionRetailer.storeName}" registration has been marked as REJECTED.`);
      setActiveRejectionRetailer(null);
      setTimeout(() => setActionSuccessMsg(null), 5000);
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      console.error('Failed to reject retailer:', err);
      alert(err?.message || 'Failed to reject retailer');
    } finally {
      setIsProcessingRejection(false);
    }
  };

  // Add custom audit note
  const handleSaveAuditNote = async () => {
    if (!activeNoteRetailer || !noteText.trim()) return;
    try {
      setIsSavingNote(true);
      const newEvent: VerificationTimelineEvent = {
        id: `tl_note_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'comment_added',
        actorName: currentUser?.name || 'Agency Reviewer',
        actorRole: currentUser?.role || 'admin',
        title: 'Reviewer Internal Note Added',
        description: noteText.trim()
      };

      const updatedTimeline = [newEvent, ...(activeNoteRetailer.verificationTimeline || [])];
      if (onSaveRetailer) {
        await onSaveRetailer({
          ...activeNoteRetailer,
          verificationTimeline: updatedTimeline
        });
      }
      setActionSuccessMsg(`Audit comment logged for "${activeNoteRetailer.storeName}".`);
      setActiveNoteRetailer(null);
      setNoteText('');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (onRefreshData) await onRefreshData();
    } catch (err: any) {
      alert(err?.message || 'Failed to record audit note');
    } finally {
      setIsSavingNote(false);
    }
  };

  // Helper for SLA formatting
  const getSlaBadge = (hours: number = 0, status: string = 'pending') => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
          Verified
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3 h-3 mr-1 text-rose-600" />
          Rejected
        </span>
      );
    }
    if (hours >= 24) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
          {hours}h ago • SLA Breach
        </span>
      );
    }
    if (hours < 4) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
          <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
          Just In ({hours}h ago)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
        <Clock className="w-3 h-3 mr-1 text-amber-600" />
        {hours}h ago • Within SLA
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Action Success Toast Feedback */}
      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{actionSuccessMsg}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Retailer Verification Dashboard
                </h1>
                {stats.pendingCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    {stats.pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Onboarding KYC approval pipeline, field beat validation, and structured audit logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {/* Refresh Data Button */}
          {onRefreshData && (
            <button
              type="button"
              onClick={onRefreshData}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Refresh Queue"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          )}

          {/* Jump to All Retailers Directory */}
          {onNavigateToRetailers && (
            <button
              type="button"
              onClick={onNavigateToRetailers}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Retailer Directory</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Requests */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Action</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-amber-900">{stats.pendingCount}</span>
            <span className="text-[11px] font-semibold text-amber-700">outlets awaiting review</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px]">
            <span className="text-rose-600 font-bold">{stats.overdueSla} Overdue (&gt;24h)</span>
            <span className="text-emerald-700 font-medium">{stats.withinSla} on track</span>
          </div>
        </div>

        {/* Verified Outlets */}
        <div 
          onClick={() => setStatusFilter('verified')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'verified'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Network</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-900">{stats.verifiedCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700">authorized kiranas</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Unlocked Credit:</span>
            <span className="font-mono font-bold text-emerald-700">{formatINR(stats.totalCreditUnlocked)}</span>
          </div>
        </div>

        {/* Rejected Outlets */}
        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rejected Requests</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-900">{stats.rejectedCount}</span>
            <span className="text-[11px] font-semibold text-rose-700">flagged / resubmit</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-rose-100 text-[11px] text-slate-500 truncate">
            Structured codes logged for feedback
          </div>
        </div>

        {/* Verification SLA Target */}
        <div className="p-4 rounded-xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification SLA</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">&lt; 24h</span>
            <span className="text-[11px] font-semibold text-slate-500">Service Target</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Total Applications:</span>
            <span className="font-bold text-slate-900">{stats.total} Outlets</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, View Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Review</span>
              {stats.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-white text-amber-900 rounded-full text-[10px] font-black">
                  {stats.pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All ({stats.total})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('verified')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                statusFilter === 'verified'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified ({stats.verifiedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                statusFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({stats.rejectedCount})</span>
            </button>
          </div>

          {/* View Mode Switcher: Timeline vs Cards vs Table */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Timeline chronological audit view"
            >
              <History className="w-3.5 h-3.5" />
              <span>Timeline View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'cards'
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card Grid view"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'table'
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tabular data view"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Search & Beat Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search store name, proprietor, mobile phone, GSTIN, or beat route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#2563eb] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedBeat}
              onChange={(e) => setSelectedBeat(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#2563eb] focus:bg-white font-medium"
            >
              <option value="all">All Delivery Beats ({allBeats.length})</option>
              {allBeats.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredRetailers.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto ring-8 ring-slate-50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No verification requests found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {searchQuery || selectedBeat !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters.'
                : 'All incoming retailer registrations have been processed. Great job!'}
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 pt-2">
            {(searchQuery || selectedBeat !== 'all' || statusFilter !== 'pending') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBeat('all');
                  setStatusFilter('pending');
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        /* ========================================================================= */
        /* 1. TIMELINE VIEW (Centerpiece Requirement)                                */
        /* ========================================================================= */
        <div className="space-y-8">
          {timelineGroups.map(([groupLabel, items]) => (
            <div key={groupLabel} className="space-y-4">
              
              {/* Group Date Header */}
              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-xs flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{groupLabel}</span>
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-800 rounded-full text-[10px] text-slate-300">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Vertical Timeline Stream */}
              <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-blue-300 before:to-slate-200">
                {items.map((retailer) => {
                  const isPending = retailer.verificationStatus === 'pending';
                  const isVerified = retailer.verificationStatus === 'verified';
                  const isRejected = retailer.verificationStatus === 'rejected';

                  return (
                    <div key={retailer.id} className="relative group">
                      
                      {/* Timeline Node Dot */}
                      <div className={`absolute -left-6 sm:-left-8 top-4 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                        isVerified 
                          ? 'bg-emerald-500 text-white' 
                          : isRejected 
                          ? 'bg-rose-500 text-white' 
                          : retailer.ageHours >= 24
                          ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200'
                          : 'bg-amber-500 text-white ring-4 ring-amber-100'
                      }`}>
                        {isVerified ? (
                          <Check className="w-3 h-3 stroke-3" />
                        ) : isRejected ? (
                          <X className="w-3 h-3 stroke-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                      </div>

                      {/* Main Card */}
                      <div className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md overflow-hidden ${
                        isPending 
                          ? 'border-amber-300/80 ring-1 ring-amber-400/20' 
                          : isVerified
                          ? 'border-emerald-200'
                          : 'border-rose-200'
                      }`}>
                        
                        {/* Top Card Header */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                          <div className="flex items-start space-x-3.5">
                            
                            {/* Shop Photo Thumbnail */}
                            <div 
                              onClick={() => {
                                if (retailer.shopPhotoUrl) {
                                  setLightboxPhoto({
                                    url: retailer.shopPhotoUrl,
                                    title: retailer.storeName,
                                    subtitle: `Prop: ${retailer.ownerName} • ${retailer.beatName}`
                                  });
                                }
                              }}
                              className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center bg-slate-100 ${
                                retailer.shopPhotoUrl ? 'cursor-pointer group-photo' : ''
                              }`}
                            >
                              {retailer.shopPhotoUrl ? (
                                <>
                                  <img 
                                    src={retailer.shopPhotoUrl} 
                                    alt={retailer.storeName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Maximize2 className="w-4 h-4" />
                                  </div>
                                </>
                              ) : (
                                <div className="text-center p-1">
                                  <Camera className="w-5 h-5 text-slate-400 mx-auto" />
                                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">No Photo</span>
                                </div>
                              )}
                            </div>

                            {/* Store Identity */}
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                  {retailer.storeName}
                                </h3>
                                {getSlaBadge(retailer.ageHours, retailer.verificationStatus)}
                              </div>

                              <p className="text-xs text-slate-600 font-medium">
                                Proprietor: <span className="font-bold text-slate-900">{retailer.ownerName}</span>
                              </p>

                              <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-0.5">
                                <span className="flex items-center">
                                  <MapPin className="w-3.5 h-3.5 mr-1 text-[#2563eb]" />
                                  <span className="font-semibold text-slate-700">{retailer.beatName}</span>
                                </span>
                                <span>•</span>
                                <span>{retailer.area}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons for Admins & Salesmen */}
                          <div className="flex items-center space-x-2 self-end sm:self-start shrink-0">
                            {isPending && (isAdmin || isSalesman) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenApproveModal(retailer)}
                                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  <span>Approve Store</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectModal(retailer)}
                                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center space-x-1 cursor-pointer"
                                >
                                  <UserX className="w-4 h-4 text-rose-600" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {isVerified && (isAdmin || isSalesman) && (
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(retailer)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                Re-evaluate
                              </button>
                            )}

                            {isRejected && (isAdmin || isSalesman) && (
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(retailer)}
                                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                              >
                                Re-approve
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mid Section: KYC & Communication */}
                        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs bg-white">
                          
                          {/* Contact Details & Direct Call/WhatsApp */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact & Telephony</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-800">{retailer.phone}</span>
                              <a 
                                href={`tel:${retailer.phone}`}
                                className="p-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100" 
                                title="Call Proprietor"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                              <a 
                                href={`https://wa.me/${(retailer.phone || '').replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(retailer.ownerName)},%20Aryan%20Agency%20depot%20here%20regarding%20your%20retailer%20verification.`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                title="WhatsApp Proprietor"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{retailer.address}</p>
                          </div>

                          {/* Tax / GSTIN / PAN KYC */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trade KYC & Identification</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] font-bold text-slate-700">GSTIN:</span>
                              <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                                retailer.gstin && retailer.gstin !== 'UNREGISTERED'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {retailer.gstin || 'Unregistered'}
                              </span>
                            </div>
                            {retailer.panNumber && (
                              <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold text-slate-700">PAN:</span>
                                <span className="font-mono text-[11px] text-slate-600">{retailer.panNumber}</span>
                              </div>
                            )}
                          </div>

                          {/* Credit Terms & Limit */}
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wholesale Credit Terms</span>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Credit Line:</span>
                              <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                                retailer.creditEnabled 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {retailer.creditEnabled ? '✓ Enabled' : '✕ Cash / COD Only'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                              <span className="text-[11px] text-slate-500 font-sans font-normal">Limit:</span>
                              <span>{formatINR(retailer.creditLimit || 50000)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Audit Timeline Stepper within the Card */}
                        <div className="p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                              <History className="w-3.5 h-3.5 text-slate-500" />
                              <span>Application Audit History & Steps</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveNoteRetailer(retailer)}
                              className="text-[11px] font-bold text-[#2563eb] hover:underline cursor-pointer flex items-center space-x-1"
                            >
                              <span>+ Add Audit Note</span>
                            </button>
                          </div>

                          {/* Events List */}
                          <div className="space-y-2">
                            {(retailer.verificationTimeline || []).map((event, idx) => (
                              <div key={event.id || idx} className="flex items-start space-x-2.5 text-xs bg-white p-2.5 rounded-xl border border-slate-200/80">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  event.type === 'approved' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : event.type === 'rejected'
                                    ? 'bg-rose-100 text-rose-700'
                                    : event.type === 'document_uploaded'
                                    ? 'bg-blue-100 text-blue-700'
                                    : event.type === 'comment_added'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {event.type === 'approved' && <Check className="w-3.5 h-3.5" />}
                                  {event.type === 'rejected' && <X className="w-3.5 h-3.5" />}
                                  {event.type === 'document_uploaded' && <FileText className="w-3 h-3" />}
                                  {event.type === 'comment_added' && <MessageSquare className="w-3 h-3" />}
                                  {event.type === 'submitted' && <Store className="w-3 h-3" />}
                                  {event.type === 'beat_mapped' && <MapPin className="w-3 h-3" />}
                                </div>
                                <div className="flex-1 space-y-0.5">
                                  <div className="flex items-center justify-between flex-wrap">
                                    <span className="font-bold text-slate-900">{event.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {new Date(event.timestamp).toLocaleString('en-IN', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600">{event.description}</p>
                                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-0.5">
                                    <span>By: {event.actorName} ({event.actorRole})</span>
                                    {event.reasonCode && (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                                        {event.reasonCode}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'cards' ? (
        /* ========================================================================= */
        /* 2. CARD GRID VIEW                                                         */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRetailers.map(retailer => {
            const isPending = retailer.verificationStatus === 'pending';
            const isVerified = retailer.verificationStatus === 'verified';
            const isRejected = retailer.verificationStatus === 'rejected';

            return (
              <div 
                key={retailer.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow ${
                  isPending ? 'border-amber-300 ring-1 ring-amber-400/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      {retailer.shopPhotoUrl ? (
                        <img 
                          src={retailer.shopPhotoUrl} 
                          alt={retailer.storeName}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{retailer.storeName}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Prop: {retailer.ownerName}</p>
                      </div>
                    </div>
                    {getSlaBadge(retailer.ageHours, retailer.verificationStatus)}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                      <span className="font-semibold text-slate-800">{retailer.beatName}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-mono text-slate-700">{retailer.phone}</span>
                      <span className="font-mono font-bold text-slate-500">GST: {retailer.gstin || 'Unreg'}</span>
                    </div>
                  </div>

                  {retailer.verificationRemarks && (
                    <div className="text-[11px] text-slate-500 bg-amber-50/50 p-2 rounded-lg border border-amber-100 italic">
                      "{retailer.verificationRemarks}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(retailer)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                      >
                        Approve Store
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(retailer)}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        Status: <strong className="uppercase">{retailer.verificationStatus}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenApproveModal(retailer)}
                        className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
                      >
                        Edit Decision
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* 3. TABULAR DATA REGISTER VIEW                                             */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Store / Proprietor</th>
                  <th className="p-3.5">Beat Route</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">KYC / Tax ID</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5">Status & SLA</th>
                  <th className="p-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRetailers.map(retailer => (
                  <tr key={retailer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        {retailer.shopPhotoUrl ? (
                          <img 
                            src={retailer.shopPhotoUrl} 
                            alt="" 
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" 
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{retailer.storeName}</div>
                          <div className="text-[11px] text-slate-500">Prop: {retailer.ownerName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{retailer.beatName}</div>
                      <div className="text-[10px] text-slate-500">{retailer.area}</div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-700">
                      {retailer.phone}
                    </td>

                    <td className="p-3.5 font-mono text-slate-700 text-[11px]">
                      {retailer.gstin || 'Unregistered'}
                    </td>

                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {new Date(retailer.submittedAt || '').toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>

                    <td className="p-3.5">
                      {getSlaBadge(retailer.ageHours, retailer.verificationStatus)}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {retailer.verificationStatus === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(retailer)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(retailer)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(retailer)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-[#2563eb] hover:bg-blue-50 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVE RETAILER MODAL WITH STRUCTURED REASON CODES                       */}
      {/* ========================================================================= */}
      {activeApprovalRetailer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Approve Retailer Account</h3>
                  <p className="text-xs text-emerald-100">
                    {activeApprovalRetailer.storeName} • Prop: {activeApprovalRetailer.ownerName}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActiveApprovalRetailer(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              
              {/* Structured Reason Codes Selection */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Structured Approval Reason Code:</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Mandatory for Audit Trail</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {APPROVAL_REASON_CODES.map(reason => {
                    const isSelected = selectedApprovalReason === reason.code;
                    return (
                      <div
                        key={reason.code}
                        onClick={() => handleReasonCodeChange(reason.code)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20' 
                            : 'bg-white border-slate-200 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{reason.label}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold ${reason.badgeColor}`}>
                            {reason.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {reason.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wholesale Credit Line Configuration */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">Wholesale Ledger Credit Access</h4>
                    <p className="text-[11px] text-slate-500">Enable or restrict 15-day credit billing for this retailer</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalCreditEnabled}
                      onChange={(e) => setApprovalCreditEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {approvalCreditEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Sanctioned Credit Limit (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={approvalCreditLimit}
                        onChange={(e) => setApprovalCreditLimit(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Credit Period Allowed (Days)
                      </label>
                      <select
                        value={approvalCreditDays}
                        onChange={(e) => setApprovalCreditDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="7">7 Days (Short Cycle)</option>
                        <option value="15">15 Days (Standard Wholesale)</option>
                        <option value="21">21 Days (High-Volume Outlets)</option>
                        <option value="30">30 Days (Depot Partner)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Beat Route Assignment */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Assign Delivery Beat Route:
                </label>
                <select
                  value={approvalBeatName}
                  onChange={(e) => setApprovalBeatName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {allBeats.map(beat => (
                    <option key={beat} value={beat}>{beat}</option>
                  ))}
                </select>
              </div>

              {/* Custom Admin Remarks / Feedback */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Admin Audit Remarks:
                </label>
                <textarea
                  rows={2}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Enter any special terms, salesman instructions, or depot approval notes..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveApprovalRetailer(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingApproval}
                onClick={handleExecuteApproval}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isProcessingApproval ? 'Approving Account...' : 'Confirm Approval & Unlock Store'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECT RETAILER MODAL WITH STRUCTURED REASON CODES                        */}
      {/* ========================================================================= */}
      {activeRejectionRetailer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-rose-600 to-red-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <UserX className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Reject Retailer Registration</h3>
                  <p className="text-xs text-rose-100">
                    {activeRejectionRetailer.storeName} • {activeRejectionRetailer.ownerName}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActiveRejectionRetailer(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Alert Notice */}
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Structured Rejection Reason will be logged and displayed to retailer</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    The reason code selected below will guide the retailer on what needs to be fixed before re-applying.
                  </p>
                </div>
              </div>

              {/* Rejection Reason Code Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block">
                  Select Rejection Code:
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {REJECTION_REASON_CODES.map(reason => {
                    const isSelected = selectedRejectionReason === reason.code;
                    return (
                      <div
                        key={reason.code}
                        onClick={() => handleRejectionCodeChange(reason.code)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20'
                            : 'bg-white border-slate-200 hover:border-rose-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">{reason.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{reason.description}</p>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold shrink-0 ${reason.badgeColor}`}>
                          {reason.code}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Retailer Advisory Notice (Sent to Retailer App) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Advisory Message for Retailer (Displayed in their app):
                </label>
                <textarea
                  rows={3}
                  value={rejectionRemarks}
                  onChange={(e) => setRejectionRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveRejectionRetailer(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingRejection}
                onClick={handleExecuteRejection}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>{isProcessingRejection ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHOP PHOTO LIGHTBOX MODAL                                                 */}
      {/* ========================================================================= */}
      {lightboxPhoto && (
        <div 
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 text-white cursor-default"
          >
            <div className="p-4 bg-slate-950/80 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">{lightboxPhoto.title}</h3>
                {lightboxPhoto.subtitle && (
                  <p className="text-xs text-slate-400">{lightboxPhoto.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-hidden flex items-center justify-center bg-black p-2">
              <img 
                src={lightboxPhoto.url} 
                alt={lightboxPhoto.title}
                className="max-h-[70vh] w-auto object-contain rounded-lg" 
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT NOTE MODAL                                                          */}
      {/* ========================================================================= */}
      {activeNoteRetailer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="font-bold">Add Internal Audit Note</span>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveNoteRetailer(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-slate-600">
                Log a field remark, phone call summary, or GPS verification note for <strong>{activeNoteRetailer.storeName}</strong>:
              </p>
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Spoke to owner Ram Kumar over phone; confirmed weekly Parle & Britannia volume..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActiveNoteRetailer(null)}
                className="px-3 py-1.5 font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingNote || !noteText.trim()}
                onClick={handleSaveAuditNote}
                className="px-4 py-1.5 font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingNote ? 'Saving...' : 'Add Note to Timeline'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
