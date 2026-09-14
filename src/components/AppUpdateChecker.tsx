import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Sparkles, 
  X, 
  ArrowUpCircle, 
  ShieldCheck, 
  Smartphone, 
  Clock,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { 
  performInAppUpdate, 
  isAutoUpdateEnabled, 
  setAutoUpdateEnabled 
} from '../lib/appUpdateService';

declare const __APP_VERSION__: string | undefined;

// Current application version resolved from Vite build or package.json
const CURRENT_APP_VERSION: string = 
  ((import.meta as any)?.env?.PACKAGE_VERSION) ||
  (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.3.0');

// Base URL resolution: in Capacitor/Android builds, resolve to the deployed public app URL via VITE_APP_URL,
// falling back safely to the official Render domain or web origin.
const APP_BASE_URL: string = (() => {
  const envUrl = ((import.meta as any)?.env?.VITE_APP_URL || (import.meta as any)?.env?.APP_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, '');
    // In Capacitor or local builds, avoid using localhost as the update base URL
    if (!origin.includes('localhost') && !origin.startsWith('capacitor') && !origin.startsWith('file:')) {
      return origin;
    }
  }
  return 'https://aryan-agency-app.onrender.com';
})();

const DEFAULT_APK_DOWNLOAD_URL = 'https://github.com/nikhilcsc18-alt/aryan-agency-app/releases/latest/download/aryan-agency-app.apk';
const SESSION_STORAGE_DISMISS_KEY = 'aryan_agency_update_dismissed';

interface AppVersionInfo {
  version: string;
  downloadUrl?: string;
  releaseNotes?: string;
  updatedAt?: string;
}

/**
 * Normalizes version strings by removing leading 'v', trimming whitespace,
 * and extracting semver segments (e.g. "v1.2.5" -> [1, 2, 5]).
 */
function parseSemver(versionStr: string): number[] {
  if (!versionStr) return [0, 0, 0];
  const cleaned = versionStr.trim().replace(/^v/i, '');
  const parts = cleaned.split(/[-+.]/);
  return parts.slice(0, 3).map((p) => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
}

/**
 * Compares two semantic version strings.
 * Returns true if remoteVersion is strictly greater than currentVersion.
 */
function isNewerVersion(remoteVersion: string, currentVersion: string): boolean {
  if (!remoteVersion) return false;
  const [rMajor = 0, rMinor = 0, rPatch = 0] = parseSemver(remoteVersion);
  const [cMajor = 0, cMinor = 0, cPatch = 0] = parseSemver(currentVersion);

  if (rMajor > cMajor) return true;
  if (rMajor < cMajor) return false;

  if (rMinor > cMinor) return true;
  if (rMinor < cMinor) return false;

  return rPatch > cPatch;
}

export const AppUpdateChecker: React.FC = () => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>(DEFAULT_APK_DOWNLOAD_URL);
  const [releaseNotes, setReleaseNotes] = useState<string>('');
  const [isUpdatingInApp, setIsUpdatingInApp] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateStatusText, setUpdateStatusText] = useState<string>('Ready');
  const [autoUpdateChecked, setAutoUpdateChecked] = useState<boolean>(isAutoUpdateEnabled());
  const hasCheckedRef = useRef<boolean>(false);

  useEffect(() => {
    // Check only once when the app starts
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Do not repeatedly show the popup if user dismissed it in the current session
    try {
      if (sessionStorage.getItem(SESSION_STORAGE_DISMISS_KEY) === 'true') {
        return;
      }
    } catch {
      // Ignore sessionStorage errors (e.g. strict security mode or iframe restrictions)
    }

    const checkForUpdates = async () => {
      // Multiple fallback endpoints so Android phone APK, Web preview, and Render always find the latest version
      const endpoints = [
        `/download/version.json?t=${Date.now()}`,
        `${APP_BASE_URL}/download/version.json`,
        'https://aryan-agency-app.onrender.com/download/version.json',
        'https://raw.githubusercontent.com/nikhilcsc18-alt/aryan-agency-app/main/public/download/version.json',
        'https://api.github.com/repos/nikhilcsc18-alt/aryan-agency-app/releases/latest',
      ];

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          if (!response.ok) continue;

          const data: any = await response.json();
          // Support both version.json format and GitHub releases API format
          let remoteVersion = (data?.version || data?.tag_name || '').trim().replace(/^v/i, '');
          if (!remoteVersion) continue;

          let rawDownload = (data?.downloadUrl || '').trim();
          if (!rawDownload && Array.isArray(data?.assets)) {
            const apkAsset = data.assets.find((a: any) => a.name?.endsWith('.apk'));
            if (apkAsset?.browser_download_url) {
              rawDownload = apkAsset.browser_download_url;
            }
          }

          if (isNewerVersion(remoteVersion, CURRENT_APP_VERSION)) {
            setLatestVersion(`v${remoteVersion}`);
            const resolvedDownload = rawDownload
              ? (rawDownload.startsWith('http') ? rawDownload : `${APP_BASE_URL}${rawDownload.startsWith('/') ? '' : '/'}${rawDownload}`)
              : DEFAULT_APK_DOWNLOAD_URL;
            setDownloadUrl(resolvedDownload);

            const notes = data.releaseNotes || data.body || '';
            if (notes && notes.trim()) {
              setReleaseNotes(notes.trim());
            }

            // If user has background auto-update enabled, update seamlessly on next visit
            if (isAutoUpdateEnabled() && !sessionStorage.getItem('auto_updated_performed')) {
              sessionStorage.setItem('auto_updated_performed', 'true');
            }

            setIsUpdateModalOpen(true);
            return; // Successfully found update and opened modal
          }
        } catch {
          // Try next endpoint
        }
      }
    };

    checkForUpdates();
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_DISMISS_KEY, 'true');
    } catch {
      // Ignore sessionStorage exceptions
    }
    setIsUpdateModalOpen(false);
  };

  const handleInAppAutoUpdate = async () => {
    try {
      setIsUpdatingInApp(true);
      await performInAppUpdate((percent, status) => {
        setUpdateProgress(percent);
        setUpdateStatusText(status);
      });
    } catch (err) {
      console.error('In-app auto-update failed', err);
      setIsUpdatingInApp(false);
      alert('Could not auto-apply update. Falling back to APK download.');
      handleDownloadApk();
    }
  };

  const handleDownloadApk = () => {
    const targetUrl = downloadUrl || DEFAULT_APK_DOWNLOAD_URL;
    try {
      const isCapacitor = typeof window !== 'undefined' && (
        (window as any).Capacitor !== undefined ||
        window.location.protocol === 'capacitor:' ||
        window.location.origin.includes('localhost')
      );

      if (isCapacitor && (window as any).Capacitor?.Plugins?.Browser?.open) {
        (window as any).Capacitor.Plugins.Browser.open({ url: targetUrl });
      } else {
        window.open(targetUrl, '_system') || window.open(targetUrl, '_blank') || (window.location.href = targetUrl);
      }
    } catch {
      window.location.href = targetUrl;
    }
    handleDismiss();
  };

  if (!isUpdateModalOpen) return null;

  const displayCurrentVersion = CURRENT_APP_VERSION.startsWith('v') 
    ? CURRENT_APP_VERSION 
    : `v${CURRENT_APP_VERSION}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Aryan Agency Brand Header */}
        <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 sm:p-5 overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/20 blur-xl"></div>
          <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-emerald-500/15 blur-xl"></div>

          <div className="relative flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 id="update-modal-title" className="text-sm sm:text-base font-black tracking-tight text-white">
                    Auto Update Available
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                    1-Click Update
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 mt-0.5 font-medium">
                  Aryan Agency Retailer &amp; Distributor App
                </p>
              </div>
            </div>

            {!isUpdatingInApp && (
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-xs text-blue-100/90 mt-2 font-medium leading-relaxed">
            बिना APK डाउनलोड किए 1-क्लिक में नया वर्शन अपडेट करें। आपको बार-बार ऐप अनइनस्टॉल या री-इन्स्टॉल करने की आवश्यकता नहीं है।
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-600">
          
          {/* Version Comparison Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Current Version
                </span>
                <span className="font-mono text-xs font-bold text-slate-700">
                  {displayCurrentVersion}
                </span>
              </div>

              <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    New Version
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-bold">
                    LATEST
                  </span>
                </div>
                <span className="font-mono text-xs font-black text-emerald-900">
                  {latestVersion}
                </span>
              </div>
            </div>
          </div>

          {/* Release Highlights */}
          {releaseNotes && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1.5">
              <span className="text-[10.5px] font-bold text-blue-950 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>What&apos;s New (नए बदलाव):</span>
              </span>
              <div className="text-[11px] text-slate-700 max-h-24 overflow-y-auto whitespace-pre-line leading-relaxed font-sans pr-1">
                {releaseNotes}
              </div>
            </div>
          )}

          {/* In-app updating progress bar */}
          {isUpdatingInApp ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>{updateStatusText}</span>
                </span>
                <span className="font-mono">{updateProgress}%</span>
              </div>
              <div className="w-full bg-emerald-200/80 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${updateProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-emerald-700 text-center">
                Applying latest features seamlessly without manual APK reinstall...
              </p>
            </div>
          ) : (
            <>
              {/* Background auto update preference */}
              <label className="flex items-center space-x-2 text-[11px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoUpdateChecked}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAutoUpdateChecked(val);
                    setAutoUpdateEnabled(val);
                  }}
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Always update app automatically in background on launch</span>
              </label>

              {/* Security & Convenience Note */}
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero downtime: updates all features instantly in 1 tap.</span>
              </div>
            </>
          )}

        </div>

        {/* Modal Actions */}
        {!isUpdatingInApp && (
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/80 text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              Later
            </button>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleDownloadApk}
                className="flex-1 sm:flex-none px-3 py-2 text-[11px] text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-100 font-medium transition-all flex items-center justify-center space-x-1 cursor-pointer"
                title="Download raw APK file to share via WhatsApp"
              >
                <Download className="w-3 h-3" />
                <span>Raw APK</span>
              </button>

              <button
                type="button"
                onClick={handleInAppAutoUpdate}
                className="flex-2 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg active:scale-98 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>1-Click Auto Update (तुरंत अपडेट)</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AppUpdateChecker;

