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
  Zap,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { 
  performInAppUpdate, 
  isAutoUpdateEnabled, 
  setAutoUpdateEnabled 
} from '../lib/appUpdateService';

declare const __APP_VERSION__: string | undefined;

// Current application version resolved from Vite build or package.json
const CURRENT_APP_VERSION: string = 
  ((import.meta as any)?.env?.PACKAGE_VERSION) ||
  (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.3.2');

// Base URL resolution: in Capacitor/Android builds, resolve to the deployed public app URL via VITE_APP_URL,
// falling back safely to the official origin or GitHub.
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
  return '';
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
 * Triggers APK download using all available native and web methods
 */
export async function downloadAndOpenApk(url: string): Promise<boolean> {
  const targetUrl = (url && url.trim()) ? url.trim() : DEFAULT_APK_DOWNLOAD_URL;
  let opened = false;

  // 1. Try Capacitor Browser plugin (opens Chrome Custom Tab or default Android browser)
  try {
    if (typeof window !== 'undefined') {
      await Browser.open({ url: targetUrl });
      opened = true;
    }
  } catch (err) {
    console.warn('[AppUpdateChecker] Browser.open error:', err);
  }

  // 2. Fallback: window.open with _system for Android WebView
  if (!opened && typeof window !== 'undefined') {
    try {
      const win = window.open(targetUrl, '_system');
      if (win) opened = true;
    } catch (e) {
      console.warn('[AppUpdateChecker] window.open _system error:', e);
    }
  }

  // 3. Fallback: standard web download link
  try {
    const link = document.createElement('a');
    link.href = targetUrl;
    link.setAttribute('download', 'aryan-agency-app.apk');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    opened = true;
  } catch (e) {
    console.warn('[AppUpdateChecker] a.click download error:', e);
  }

  // 4. Fallback: window.location.href
  if (!opened && typeof window !== 'undefined') {
    try {
      window.location.href = targetUrl;
      opened = true;
    } catch {
      // ignore
    }
  }

  return opened;
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

export function triggerManualUpdateCheck() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aryan_check_app_update', { detail: { manual: true } }));
  }
}

export const AppUpdateChecker: React.FC = () => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [latestVersion, setLatestVersion] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>(DEFAULT_APK_DOWNLOAD_URL);
  const [releaseNotes, setReleaseNotes] = useState<string>('');
  const [modalStep, setModalStep] = useState<'prompt' | 'download_started' | 'reloading_web'>('prompt');
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [updateStatusText, setUpdateStatusText] = useState<string>('Ready');
  const [autoUpdateChecked, setAutoUpdateChecked] = useState<boolean>(isAutoUpdateEnabled());
  const [isCheckingManual, setIsCheckingManual] = useState<boolean>(false);
  const [upToDateNotice, setUpToDateNotice] = useState<{ show: boolean; version: string } | null>(null);
  const hasCheckedRef = useRef<boolean>(false);

  const checkForUpdates = async (isManual = false) => {
    if (isManual) {
      setIsCheckingManual(true);
      setUpToDateNotice(null);
    }

    // Multiple fallback endpoints so Android phone APK, Web preview, and GitHub always find the latest version
    const endpoints = [
      `/api/app/version?t=${Date.now()}`,
      `/download/version.json?t=${Date.now()}`,
      ...(APP_BASE_URL ? [`${APP_BASE_URL}/api/app/version?t=${Date.now()}`, `${APP_BASE_URL}/download/version.json?t=${Date.now()}`] : []),
      'https://raw.githubusercontent.com/nikhilcsc18-alt/aryan-agency-app/main/public/download/version.json',
      'https://api.github.com/repos/nikhilcsc18-alt/aryan-agency-app/releases/latest',
    ];

    let foundUpdate = false;
    let checkedRemoteVersion = '';

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!response.ok) continue;

        const data: any = await response.json();
        // Support both version.json format and GitHub releases API format
        let remoteVersion = (data?.version || data?.tag_name || '').trim().replace(/^v/i, '');
        if (!remoteVersion) continue;

        checkedRemoteVersion = remoteVersion;

        let rawDownload = (data?.apkUrl || data?.downloadUrl || '').trim();
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

          const notes = data.releaseNotes || data.notes || data.body || '';
          if (notes && notes.trim()) {
            setReleaseNotes(notes.trim());
          }

          setModalStep('prompt');
          setIsUpdateModalOpen(true);
          foundUpdate = true;
          break; // Successfully found update and opened modal
        }
      } catch {
        // Try next endpoint
      }
    }

    if (isManual) {
      setIsCheckingManual(false);
      if (!foundUpdate) {
        setUpToDateNotice({
          show: true,
          version: checkedRemoteVersion || CURRENT_APP_VERSION
        });
        setTimeout(() => {
          setUpToDateNotice(null);
        }, 5000);
      }
    }
  };

  useEffect(() => {
    // 1. Listen for manual update trigger event from mobile view or header
    const handleManualCheck = () => {
      checkForUpdates(true);
    };

    window.addEventListener('aryan_check_app_update', handleManualCheck);

    // 2. Automatic check only once when app loads
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      try {
        if (sessionStorage.getItem(SESSION_STORAGE_DISMISS_KEY) !== 'true') {
          checkForUpdates(false);
        }
      } catch {
        checkForUpdates(false);
      }
    }

    return () => {
      window.removeEventListener('aryan_check_app_update', handleManualCheck);
    };
  }, []);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_DISMISS_KEY, 'true');
    } catch {
      // Ignore sessionStorage exceptions
    }
    setIsUpdateModalOpen(false);
    setModalStep('prompt');
  };

  const handleStartApkUpdate = async () => {
    // Switch to clear download-in-progress guidance screen immediately
    setModalStep('download_started');
    // Launch download via Browser plugin or fallback
    await downloadAndOpenApk(downloadUrl || DEFAULT_APK_DOWNLOAD_URL);
  };

  const handleReloadWebAssets = async () => {
    try {
      setModalStep('reloading_web');
      await performInAppUpdate((percent, status) => {
        setUpdateProgress(percent);
        setUpdateStatusText(status);
      });
      setIsUpdateModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Web reload failed', err);
      window.location.reload();
    }
  };

  const displayCurrentVersion = CURRENT_APP_VERSION.startsWith('v') 
    ? CURRENT_APP_VERSION 
    : `v${CURRENT_APP_VERSION}`;

  return (
    <>
      {/* Toast Notice when user manually checks for updates and is already on latest version */}
      {isCheckingManual && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs font-semibold">
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
            <span>नवीनतम वर्शन चेक किया जा रहा है... (Checking updates)</span>
          </div>
        </div>
      )}

      {upToDateNotice && !isCheckingManual && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200 max-w-sm">
          <div className="bg-emerald-950 text-emerald-100 p-3.5 rounded-2xl shadow-2xl border border-emerald-700/80 flex flex-col space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">App Up-to-Date (v{upToDateNotice.version.replace(/^v/i, '')})</span>
              </div>
              <button 
                type="button" 
                onClick={() => setUpToDateNotice(null)}
                className="text-emerald-300 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-emerald-200">
              आपके फ़ोन पर नवीनतम वर्शन सक्रिय है। अगर नया बदलाव नहीं दिख रहा, तो डेटा रीलोड करें।
            </p>
            <button
              type="button"
              onClick={handleReloadWebAssets}
              className="mt-1 w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              <span>Force Reload Latest Assets (डेटा रीलोड करें)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Update Modal */}
      {isUpdateModalOpen && (
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
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 id="update-modal-title" className="text-sm sm:text-base font-black tracking-tight text-white">
                    {modalStep === 'download_started' ? 'Updating App' : 'New Update Available'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                    {latestVersion}
                  </span>
                </div>
                <p className="text-[11px] text-blue-200 mt-0.5 font-medium">
                  Aryan Agency Retailer &amp; Distributor App
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-blue-100/90 mt-2 font-medium leading-relaxed">
            {modalStep === 'download_started'
              ? 'APK फाइल डाउनलोड हो रही है। डाउनलोड होने पर नोटिफिकेशन से इंस्टॉल करें।'
              : 'नया वर्शन उपलब्ध है। 1-टैप में नया APK डाउनलोड कर अपडेट करें। आपका सारा डेटा व लॉगिन सुरक्षित रहेगा।'
            }
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-600 overflow-y-auto">
          
          {/* STEP 1: INITIAL PROMPT VIEW */}
          {modalStep === 'prompt' && (
            <>
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
                    <span>What&apos;s New (नए फीचर्स):</span>
                  </span>
                  <div className="text-[11px] text-slate-700 max-h-24 overflow-y-auto whitespace-pre-line leading-relaxed font-sans pr-1">
                    {releaseNotes}
                  </div>
                </div>
              )}

              {/* Security & Data Safety Note */}
              <div className="flex items-center space-x-2 text-[11px] text-emerald-700 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>आपका कार्ट, ऑर्डर हिस्ट्री और लॉगिन डेटा सुरक्षित रहेगा।</span>
              </div>
            </>
          )}

          {/* STEP 2: DOWNLOAD STARTED INSTRUCTIONS VIEW */}
          {modalStep === 'download_started' && (
            <div className="space-y-3">
              {/* Active Download Banner */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Download className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-950">
                    APK डाउनलोड शुरू हो गया है!
                  </h4>
                  <p className="text-[11px] text-blue-700">
                    File: <span className="font-mono font-semibold">aryan-agency-app.apk</span> (~7.9 MB)
                  </p>
                </div>
              </div>

              {/* 3 Step Installation Guide */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2.5">
                <h5 className="text-[11px] font-bold text-slate-800 flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>इंस्टॉल करने के आसान 3 स्टेप्स:</span>
                </h5>

                <div className="space-y-2 text-[11px] text-slate-600">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>अपने मोबाइल के ऊपर से <strong>नोटिफिकेशन बार (Notification Bar)</strong> को नीचे खींचें।</span>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span><strong>aryan-agency-app.apk</strong> डाउनलोड पूरा होने पर उस पर टैप करें।</span>
                  </div>

                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>स्क्रीन पर <strong>&quot;Update&quot;</strong> या <strong>&quot;Install&quot;</strong> बटन दबाएं। नया वर्शन तुरंत चालू हो जाएगा!</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-[10.5px] text-slate-500">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>यदि डाउनलोड पॉपअप नहीं आया, तो नीचे &quot;फिर से डाउनलोड करें&quot; पर टैप करें।</span>
              </div>
            </div>
          )}

          {/* STEP 3: RELOADING WEB ASSETS VIEW */}
          {modalStep === 'reloading_web' && (
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
                Updating application assets...
              </p>
            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {modalStep === 'prompt' ? (
            <>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/80 text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Later (बाद में)
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReloadWebAssets}
                  className="hidden sm:inline-flex px-3 py-2 text-[11px] text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-100 font-medium transition-all items-center justify-center space-x-1 cursor-pointer"
                  title="Reload web browser assets"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reload Web</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartApkUpdate}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-blue-500/25 hover:shadow-lg active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download &amp; Install Update ({latestVersion})</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartApkUpdate}
                className="w-full sm:w-auto px-3.5 py-2 text-xs text-blue-700 hover:text-blue-800 border border-blue-200 bg-blue-50/60 rounded-xl hover:bg-blue-100/60 font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>फिर से डाउनलोड करें (Re-download)</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-98 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>समझ गया (Done)</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
    )}
  </>
  );
};

export default AppUpdateChecker;

