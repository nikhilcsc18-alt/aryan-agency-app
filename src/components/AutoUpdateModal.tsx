import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  X, 
  ArrowRight, 
  Smartphone, 
  ShieldCheck, 
  Zap,
  Info
} from 'lucide-react';
import { 
  AppVersionInfo, 
  CURRENT_APP_VERSION, 
  performInAppUpdate, 
  isAutoUpdateEnabled, 
  setAutoUpdateEnabled,
  skipVersionUpdate
} from '../lib/appUpdateService';

interface AutoUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo?: AppVersionInfo;
  isManualCheck?: boolean;
}

export const AutoUpdateModal: React.FC<AutoUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  isManualCheck = false
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusText, setStatusText] = useState('Ready to update');
  const [autoUpdateChecked, setAutoUpdateChecked] = useState(isAutoUpdateEnabled());

  useEffect(() => {
    setAutoUpdateChecked(isAutoUpdateEnabled());
  }, [isOpen]);

  if (!isOpen) return null;

  const targetVersion = updateInfo?.version || '1.3.0';
  const releaseNotes = updateInfo?.releaseNotes || 'Aryan Agency Multi-Packing Options (Pack of 1, 2, 4, 10), Add to Cart detail selector & Auto-Update system.';
  const isMandatory = updateInfo?.isMandatory || false;

  const handleStartUpdate = async () => {
    try {
      setIsUpdating(true);
      await performInAppUpdate((percent, text) => {
        setProgressPercent(percent);
        setStatusText(text);
      });
    } catch (err) {
      console.error('Update failed', err);
      setIsUpdating(false);
      alert('Could not complete in-app update. You can use direct APK download as fallback.');
    }
  };

  const handleDismiss = () => {
    if (updateInfo) {
      skipVersionUpdate(updateInfo.version);
    }
    onClose();
  };

  const handleToggleAutoUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAutoUpdateChecked(checked);
    setAutoUpdateEnabled(checked);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Modal Top Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-4 sm:p-5 relative">
          {!isMandatory && !isUpdating && (
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-3.5 right-3.5 p-1.5 text-blue-200 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                  New Update
                </span>
                <span className="text-xs font-mono font-bold text-blue-100">
                  v{targetVersion}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Automatic In-App Update
              </h3>
            </div>
          </div>

          <p className="text-xs text-blue-100/90 mt-2 font-medium leading-relaxed">
            बिना APK डाउनलोड किए 1-क्लिक में नया वर्शन अपडेट करें। आपको बार-बार ऐप अनइनस्टॉल या री-इन्स्टॉल करने की आवश्यकता नहीं है।
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 text-slate-700">
          
          {/* Version Comparison Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Current App Version</p>
              <p className="font-mono font-bold text-slate-800 text-sm">v{CURRENT_APP_VERSION}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="text-right">
              <p className="text-[10px] text-emerald-600 font-semibold uppercase">Latest Server Version</p>
              <p className="font-mono font-black text-emerald-700 text-sm">v{targetVersion}</p>
            </div>
          </div>

          {/* What's New Bullet Points */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>What&apos;s New in v{targetVersion} (नए फीचर्स):</span>
            </h4>
            <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/80 text-[11.5px] space-y-1.5 text-slate-600">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Aryan Agency Pricing &amp; Margin:</strong> Pack of 1, 2, 4 व Pack of 10 पैकिंग ऑप्शन्स और स्पष्ट मार्जिन %।</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>2-Step Cart Screen:</strong> कार्ट में सभी प्रोडक्ट्स अलग स्क्रॉल करें, पेमेंट सेक्शन से व्यू लॉक नहीं होगा।</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Bulk Product Add:</strong> Admin पैनल में एक साथ कई प्रोडक्ट्स जोड़ें या Excel/WhatsApp से पेस्ट करें।</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Seamless Auto Update:</strong> नया अपडेट आने पर ऐप तुरंत स्वतः रीफ्रेश होकर चालू हो जाती है।</span>
              </div>
            </div>
          </div>

          {/* Progress Bar during update */}
          {isUpdating ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>{statusText}</span>
                </span>
                <span className="font-mono">{progressPercent}%</span>
              </div>
              <div className="w-full bg-blue-200/80 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                Updating app without re-downloading APK... Please wait a moment.
              </p>
            </div>
          ) : (
            <>
              {/* Auto Update Preference Checkbox */}
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={autoUpdateChecked}
                  onChange={handleToggleAutoUpdate}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Always apply future updates automatically in background</span>
              </label>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleStartUpdate}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>1-Click Auto Update Now (तुरंत अपडेट करें)</span>
                </button>

                {/* Secondary: Raw APK download for sharing */}
                <div className="flex items-center justify-between pt-1">
                  {!isMandatory && (
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                    >
                      Remind Me Later
                    </button>
                  )}

                  <a
                    href="/download/aryan-agency-app.apk"
                    download="aryan-agency-app.apk"
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center space-x-1 cursor-pointer ml-auto"
                    title="Download standalone APK file for offline sharing"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Raw APK (Optional)</span>
                  </a>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
