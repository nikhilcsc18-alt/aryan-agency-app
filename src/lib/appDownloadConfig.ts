/**
 * App Download & Android APK Configuration
 * Allows configuring and updating the Android APK download URL, version, and instructions
 * without requiring any code changes or UI redesign.
 */

import { useState, useEffect } from 'react';

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
  version: 'v1.2.4',
  fileSize: '18.4 MB',
  releaseDate: 'March 2026',
  minAndroidVersion: 'Android 8.0 (Oreo) or later',
  appName: 'Aryan Agency FMCG Distribution',
  packageName: 'in.aryanagency.fmcg',
  isAvailable: true,
  notes: 'Direct Android APK for Kirana retailers, DSR salesmen, and delivery drivers with offline order sync and barcode scanning.'
};

export function getAppDownloadConfig(): AppDownloadConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_CONFIG;
    const parsed = JSON.parse(raw);
    // If the cached URL was any previous GitHub release or mock path, migrate it to the permanent public APK route
    if (
      parsed.apkUrl === '/downloads/aryan-agency-fmcg.apk' ||
      parsed.apkUrl?.includes('releases/latest/download') ||
      parsed.apkUrl?.includes('github.com')
    ) {
      parsed.apkUrl = DEFAULT_APP_CONFIG.apkUrl;
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
    return updated;
  } catch (err) {
    console.error('[appDownloadConfig] Error saving config:', err);
    return getAppDownloadConfig();
  }
}

export function useAppDownloadConfig() {
  const [config, setConfig] = useState<AppDownloadConfig>(getAppDownloadConfig);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setConfig(e.detail);
      } else {
        setConfig(getAppDownloadConfig());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);
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
