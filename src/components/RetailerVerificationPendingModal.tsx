import React, { useState } from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  PhoneCall, 
  MessageSquare, 
  LogOut, 
  Store, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { User, Retailer } from '../types';

interface RetailerVerificationPendingModalProps {
  currentUser: User;
  linkedRetailer?: Retailer;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export const RetailerVerificationPendingModal: React.FC<RetailerVerificationPendingModalProps> = ({
  currentUser,
  linkedRetailer,
  onRefresh,
  onLogout
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const storeName = linkedRetailer?.storeName || currentUser.businessName || currentUser.name || 'Your Retail Outlet';
  const ownerName = linkedRetailer?.ownerName || currentUser.name || 'Proprietor';
  const phone = linkedRetailer?.phone || currentUser.phone || '';
  const beat = linkedRetailer?.beatName || 'Assigned Beat Route';
  const status = linkedRetailer?.verificationStatus || currentUser.verificationStatus || 'pending';
  const isRejected = status === 'rejected';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header Ribbon */}
        <div className={`p-6 text-center text-white ${isRejected ? 'bg-rose-600' : 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs mb-3 ring-8 ring-white/10">
            {isRejected ? (
              <AlertTriangle className="w-8 h-8 text-white" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {isRejected ? 'वेरिफिकेशन अस्वीकृत (Verification Rejected)' : 'सत्यापन लंबित है (Verification Pending)'}
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium">
            Aryan Agency B2B Wholesale Distribution Network
          </p>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Status Alert Box */}
          <div className={`p-4 rounded-xl border ${isRejected ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            <div className="flex items-start space-x-3">
              <Lock className={`w-5 h-5 shrink-0 mt-0.5 ${isRejected ? 'text-rose-600' : 'text-amber-600'}`} />
              <div className="text-xs sm:text-sm space-y-1">
                <p className="font-bold">
                  {isRejected 
                    ? 'आपका रिटेलर आवेदन स्वीकृत नहीं हुआ है।'
                    : 'थोक ऑर्डर बुकिंग सत्यापन के बाद ही चालू होगी (Orders Locked)'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">
                  {isRejected 
                    ? (linkedRetailer?.verificationRemarks || 'कृपया अपने बीट सेल्समैन या एजेंसी डिपो से संपर्क कर सही विवरण व दुकान की फोटो अपडेट करवाएं।')
                    : 'आपकी दुकान का खाता अभी एजेंसी एडमिन / सेल्स ऑफिसर द्वारा सत्यापन (KYC Approval) के लिए प्रक्रिया में है। जब तक डिपो द्वारा पुष्टि नहीं हो जाती, तब तक नया ऑर्डर नहीं दिया जा सकता।'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Retailer Info Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2 font-bold text-slate-800">
                <Store className="w-4 h-4 text-[#2563eb]" />
                <span className="text-sm">{storeName}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isRejected 
                  ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {isRejected ? 'REJECTED' : 'PENDING APPROVAL'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">दुकानदार / Owner</span>
                <span className="font-medium text-slate-800">{ownerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">मोबाइल / Phone</span>
                <span className="font-mono text-slate-800">{phone}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">बीट रूट / Assigned Beat</span>
                <span className="font-medium text-slate-800">{beat}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleRefresh}
              className="w-full py-3 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'जांच हो रही है...' : 'स्थिति जांचें (Refresh Status)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="tel:+919886034567"
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors text-center"
              >
                <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                <span>कॉल डिपो</span>
              </a>

              <a
                href={`https://wa.me/919886034567?text=${encodeURIComponent(`नमस्ते Aryan Agency, मेरी दुकान ${storeName} (फोन: ${phone}) का रिटेलर वेरिफिकेशन पेंडिंग है। कृपया अप्रूव करें।`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors text-center"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>व्हाट्सएप करें</span>
              </a>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center space-x-1.5 cursor-pointer pt-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>दूसरे खाते से लॉगिन करें (Log out)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
