import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  QrCode, 
  Settings, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  Copy, 
  Check, 
  FileText, 
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import { 
  useAppDownloadConfig, 
  triggerApkDownload, 
  AppDownloadConfig, 
  DEFAULT_APP_CONFIG 
} from '../lib/appDownloadConfig';
import { useAuth } from '../context/AuthContext';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'download' | 'admin';
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'download'
}) => {
  const { config, updateConfig } = useAppDownloadConfig();
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'download' | 'instructions' | 'admin'>(defaultTab);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Admin form state
  const [editUrl, setEditUrl] = useState(config.apkUrl);
  const [editVersion, setEditVersion] = useState(config.version);
  const [editSize, setEditSize] = useState(config.fileSize);
  const [editNotes, setEditNotes] = useState(config.notes);
  const [adminSaved, setAdminSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setDownloadSuccess(false);
      setAdminSaved(false);
      setEditUrl(config.apkUrl);
      setEditVersion(config.version);
      setEditSize(config.fileSize);
      setEditNotes(config.notes);

      // Generate QR Code for downloading
      const fullUrl = config.apkUrl.startsWith('http')
        ? config.apkUrl
        : `${window.location.origin}${config.apkUrl}`;

      QRCode.toDataURL(fullUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [isOpen, config, defaultTab]);

  if (!isOpen) return null;

  const handleDownload = () => {
    triggerApkDownload(config);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 5000);
  };

  const handleCopyLink = () => {
    const fullUrl = config.apkUrl.startsWith('http')
      ? config.apkUrl
      : `${window.location.origin}${config.apkUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveAdminConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      apkUrl: editUrl.trim() || DEFAULT_APP_CONFIG.apkUrl,
      version: editVersion.trim() || DEFAULT_APP_CONFIG.version,
      fileSize: editSize.trim() || DEFAULT_APP_CONFIG.fileSize,
      notes: editNotes.trim() || DEFAULT_APP_CONFIG.notes,
      releaseDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    });
    setAdminSaved(true);
    setTimeout(() => {
      setAdminSaved(false);
      setActiveTab('download');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Aryan Agency branding */}
        <div className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-5 overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 rounded-full bg-blue-500/20 blur-xl"></div>
          <div className="absolute bottom-0 left-1/3 w-28 h-28 rounded-full bg-emerald-500/10 blur-xl"></div>

          <div className="relative flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                <Smartphone className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold tracking-tight text-white">
                    Aryan Agency Mobile App
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                    Android APK
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  FMCG Distribution & Kirana Ordering on your phone
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('download')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'download'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download APK</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('instructions')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'instructions'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>How to Install</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ml-auto ${
                  activeTab === 'admin'
                    ? 'bg-amber-400 text-slate-900 shadow-xs font-bold'
                    : 'text-amber-200 hover:bg-white/10'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure APK Link</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600">
          
          {/* TAB 1: DOWNLOAD APK */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              {/* App Overview Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-slate-900 text-xs">Official Aryan Agency APK</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#2563eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {config.version}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 border-t border-slate-200/80 pt-2.5">
                  <div>
                    <span className="block text-[10px] text-slate-400">File Size</span>
                    <strong className="text-slate-700">{config.fileSize}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Target OS</span>
                    <strong className="text-slate-700">Android 8.0+</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400">Updated</span>
                    <strong className="text-slate-700">{config.releaseDate}</strong>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/60">
                  {config.notes}
                </p>
              </div>

              {/* Main Download Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer text-sm"
                >
                  <Download className="w-5 h-5 animate-bounce" />
                  <span>Download Aryan Agency APK ({config.fileSize})</span>
                </button>

                {downloadSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      APK download initiated! Check your browser or notifications for the file.
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code Section for Desktop to Mobile handoff */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs shrink-0 flex items-center justify-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Scan to download APK" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-12 h-12 text-slate-400" />
                  )}
                </div>

                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start space-x-1.5">
                    <QrCode className="w-4 h-4 text-[#2563eb]" />
                    <strong className="text-slate-900 text-xs">Scan with Phone Camera</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Open your Android mobile camera or Google Lens to scan and download the APK directly to your phone.
                  </p>

                  <div className="pt-1 flex items-center justify-center sm:justify-start space-x-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy Download Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security guarantee note */}
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Virus-free & Verified build for Aryan Agency authorized distributors.</span>
              </div>
            </div>
          )}

          {/* TAB 2: INSTALL INSTRUCTIONS */}
          {activeTab === 'instructions' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                <h4 className="font-bold text-slate-900 text-xs mb-1 flex items-center">
                  <Sparkles className="w-4 h-4 text-blue-600 mr-1.5" />
                  Quick 3-Step Android Installation
                </h4>
                <p className="text-[11px] text-slate-600">
                  Since this is a dedicated enterprise distribution app directly from Aryan Agency, Android will ask you to confirm installing from Chrome or Files:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">Tap Download APK</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tap the download button and wait for the APK file to finish downloading in your browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">Allow Unknown Sources / Chrome</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      If Android prompts &quot;File might be harmful&quot; or &quot;For your security, your phone is not allowed to install unknown apps&quot;, tap <strong>Settings</strong> and switch on <strong>Allow from this source</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">Tap Install & Launch</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tap <strong>Install</strong>. Once installed, open <strong>Aryan Agency</strong> and log in with your phone number or credentials!
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('download')}
                className="w-full py-2.5 rounded-xl bg-[#2563eb] text-white font-bold hover:bg-blue-700 transition-colors cursor-pointer text-xs flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Ready to Download</span>
              </button>
            </div>
          )}

          {/* TAB 3: ADMIN CONFIGURATION */}
          {activeTab === 'admin' && isAdmin && (
            <form onSubmit={handleSaveAdminConfig} className="space-y-3.5">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs mb-1">
                  <Settings className="w-4 h-4 text-amber-700" />
                  <span>Admin APK Hosting & Link Settings</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Update your hosted APK link anytime (e.g. Google Drive direct link, Cloudflare R2, AWS S3, or server download link).
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">
                    APK Download Link / URL:
                  </label>
                  <input
                    type="text"
                    required
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://your-domain.com/aryan-agency.apk or /downloads/aryan.apk"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Can be a relative path or direct external HTTPS link.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 text-xs mb-1">
                      Version Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      placeholder="v1.2.5"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 text-xs mb-1">
                      File Size:
                    </label>
                    <input
                      type="text"
                      required
                      value={editSize}
                      onChange={(e) => setEditSize(e.target.value)}
                      placeholder="18.4 MB"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 text-xs mb-1">
                    Release Notes / Description:
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {adminSaved && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>APK configuration saved successfully!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditUrl(DEFAULT_APP_CONFIG.apkUrl);
                    setEditVersion(DEFAULT_APP_CONFIG.version);
                    setEditSize(DEFAULT_APP_CONFIG.fileSize);
                    setEditNotes(DEFAULT_APP_CONFIG.notes);
                  }}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors cursor-pointer text-xs"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium">Aryan Agency FMCG Distribution</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
