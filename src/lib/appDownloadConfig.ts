/**
 * App Download & Android APK Configuration
 * Allows configuring and updating the Android APK download URL, version, and instructions
 * without requiring any code changes or UI redesign.
 */

import { useState, useEffect } from 'react';
import { api, getServerBaseUrl } from './api';

export interface AppDownloadConfig {
  apkUrl: string;
  version: string;
  fileSize: string;
  releaseDate: string;
  minAndroidVersion: string;
  appName: string;
  packageName: string;
  isAvailable: boolean;
  notes: string;
}

const STORAGE_KEY = 'aryan_app_download_config';
const EVENT_NAME = 'aryan_app_download_config_updated';

export const DEFAULT_APP_CONFIG: AppDownloadConfig = {
  apkUrl: '/download/aryan-agency-app.apk',
  version: 'v1.3.2',
  fileSize: '8.2 MB',
  releaseDate: 'September 2026',
  minAndroidVersion: 'Android 8.0 (Oreo) or later',
  appName: 'Aryan Agency FMCG Distribution',
  packageName: 'com.aryanagency.app',
  isAvailable: true,
  notes: 'Aryan Agency B2B App v1.3.2 with live barcode scanning, internet product auto-fill, and live cloud sync.'
};

export function getAppDownloadConfig(): AppDownloadConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_CONFIG;
    const parsed = JSON.parse(raw);
    // If the cached URL was any previous mock or outdated URL, keep the permanent APK route
    if (
      parsed.apkUrl === '/downloads/aryan-agency-fmcg.apk' ||
      parsed.apkUrl?.includes('releases/latest/download') ||
      parsed.apkUrl?.includes('github.com')
    ) {
      parsed.apkUrl = DEFAULT_APP_CONFIG.apkUrl;
    }
    // Auto-upgrade stale cached versions from previous testing
    if (parsed.version === 'v1.3.0' || parsed.version === 'v1.3.1' || parsed.version === '1.3.0' || parsed.version === '1.3.1') {
      parsed.version = DEFAULT_APP_CONFIG.version;
      parsed.notes = DEFAULT_APP_CONFIG.notes;
    }
    return { ...DEFAULT_APP_CONFIG, ...parsed };
  } catch (err) {
    console.warn('[appDownloadConfig] Error reading config:', err);
    return DEFAULT_APP_CONFIG;
  }
}

export function saveAppDownloadConfig(settings: Partial<AppDownloadConfig>): AppDownloadConfig {
  try {
    const current = getAppDownloadConfig();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    }

    // Persist to server in background if possible
    api.updateAppVersion({
      version: updated.version.replace(/^v/i, ''),
      apkUrl: updated.apkUrl,
      downloadUrl: updated.apkUrl,
      fileSize: updated.fileSize,
      releaseNotes: updated.notes,
      minAndroidVersion: updated.minAndroidVersion
    }).catch(err => {
      console.warn('[appDownloadConfig] Background sync to server error:', err);
    });

    return updated;
  } catch (err) {
    console.error('[appDownloadConfig] Error saving config:', err);
    return getAppDownloadConfig();
  }
}

export function useAppDownloadConfig() {
  const [config, setConfig] = useState<AppDownloadConfig>(getAppDownloadConfig);

  useEffect(() => {
    // 1. Listen for local and cross-tab update events
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getAppDownloadConfig());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // 2. Fetch live official version from server on mount
    api.getAppVersion().then(serverVer => {
      if (serverVer && serverVer.version) {
        const remoteVersionFormatted = serverVer.version.startsWith('v') ? serverVer.version : `v${serverVer.version}`;
        const current = getAppDownloadConfig();
        if (remoteVersionFormatted !== current.version || (serverVer.apkUrl && serverVer.apkUrl !== current.apkUrl)) {
          const merged: AppDownloadConfig = {
            ...current,
            version: remoteVersionFormatted,
            apkUrl: serverVer.apkUrl || serverVer.downloadUrl || current.apkUrl,
            fileSize: serverVer.fileSize || current.fileSize,
            notes: serverVer.releaseNotes || current.notes,
            minAndroidVersion: serverVer.minAndroidVersion || current.minAndroidVersion
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setConfig(merged);
        }
      }
    }).catch(() => {
      // Offline or network error - keep cached/default config
    });

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateConfig = (newSettings: Partial<AppDownloadConfig>) => {
    const saved = saveAppDownloadConfig(newSettings);
    setConfig(saved);
    return saved;
  };

  return { config, updateConfig };
}

/**
 * Trigger download of the Android APK
 */
export function triggerApkDownload(config?: AppDownloadConfig): { success: boolean; url: string } {
  const activeConfig = config || getAppDownloadConfig();
  const url = activeConfig.apkUrl || DEFAULT_APP_CONFIG.apkUrl;

  try {
    // Check if URL is an absolute web link (e.g. https://... or http://...)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Create a temporary link element to trigger the download or open in new tab
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aryan-agency-${activeConfig.version}.apk`);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Local or relative download path: trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aryan-agency-${activeConfig.version}.apk`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    return { success: true, url };
  } catch (err) {
    console.error('[triggerApkDownload] Failed to download APK:', err);
    // Fallback: window.open
    window.open(url, '_blank');
    return { success: true, url };
  }
}
