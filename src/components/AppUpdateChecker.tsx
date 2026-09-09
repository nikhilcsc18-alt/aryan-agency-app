import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Sparkles, 
  X, 
  ArrowUpCircle, 
  ShieldCheck, 
  Smartphone, 
  Clock,
  ExternalLink
} from 'lucide-react';

declare const __APP_VERSION__: string | undefined;

// Current application version resolved from Vite build or package.json
const CURRENT_APP_VERSION: string = 
  ((import.meta as any)?.env?.PACKAGE_VERSION) ||
  (typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.4');

const VERSION_INFO_URL = '/download/version.json';
const DEFAULT_APK_DOWNLOAD_URL = '/download/aryan-agency-app.apk';
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
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        // Fetch public version.json from Render / Express server directly (works with private GitHub repo)
        const response = await fetch(VERSION_INFO_URL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Silent exit on HTTP errors
          return;
        }

        const data: AppVersionInfo = await response.json();
        const remoteVersion = data?.version?.trim() || '';
        if (!remoteVersion) return;

        // Check if remote version from version.json is strictly newer than installed package version
        if (isNewerVersion(remoteVersion, CURRENT_APP_VERSION)) {
          setLatestVersion(remoteVersion.startsWith('v') ? remoteVersion : `v${remoteVersion}`);
          setDownloadUrl(data.downloadUrl || DEFAULT_APK_DOWNLOAD_URL);

          if (data.releaseNotes && data.releaseNotes.trim()) {
            setReleaseNotes(data.releaseNotes.trim());
          }

          setIsUpdateModalOpen(true);
        }
      } catch {
        // Handle all network/fetch errors silently without breaking the app
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

  const handleUpdateNow = () => {
    // Open the direct APK download URL
    try {
      window.open(downloadUrl || DEFAULT_APK_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = downloadUrl || DEFAULT_APK_DOWNLOAD_URL;
    }
    // Also dismiss modal for this session
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Aryan Agency Brand Header */}
        <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-5 overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-500/20 blur-xl"></div>
          <div className="absolute bottom-0 left-1/3 w-24 h-24 rounded-full bg-emerald-500/15 blur-xl"></div>

          <div className="relative flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 id="update-modal-title" className="text-base font-bold tracking-tight text-white">
                    New Update Available
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                    APK Update
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  Aryan Agency FMCG Distribution Suite
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
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-600">
          
          {/* Version Comparison Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                  Current Version
                </span>
                <span className="font-mono text-xs font-bold text-slate-700">
                  {displayCurrentVersion}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                    New Version
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-bold">
                    LATEST
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-900">
                  {latestVersion}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-3 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>A newer version of the Aryan Agency Android APK has been released with performance improvements and bug fixes.</span>
            </p>
          </div>

          {/* Optional Release Highlights */}
          {releaseNotes && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
              <span className="text-[10.5px] font-bold text-blue-900 block">
                Release Notes:
              </span>
              <div className="text-[11px] text-slate-600 max-h-24 overflow-y-auto whitespace-pre-line leading-relaxed font-sans pr-1">
                {releaseNotes}
              </div>
            </div>
          )}

          {/* Security Guarantee */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Official release package from Aryan Agency GitHub repository.</span>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-200/80 bg-white border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Later
          </button>

          <button
            type="button"
            onClick={handleUpdateNow}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Update Now</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AppUpdateChecker;
