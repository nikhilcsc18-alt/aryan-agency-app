/**
 * Aryan Agency FMCG - Capacitor & Web In-App Auto Update Service
 * Allows the Android app and Web PWA to update seamlessly without
 * requiring the user to repeatedly download and install APKs manually.
 */

export interface AppVersionInfo {
  version: string;
  versionCode?: number;
  downloadUrl: string;
  updatedAt: string;
  releaseNotes: string;
  isMandatory?: boolean;
  minSupportedVersion?: string;
}

export const CURRENT_APP_VERSION = '1.3.0';
export const CURRENT_VERSION_CODE = 130;

const VERSION_CHECK_ENDPOINT = '/download/version.json';
const AUTO_UPDATE_PREF_KEY = 'aryan_auto_update_enabled';
const LAST_SKIPPED_VERSION_KEY = 'aryan_last_skipped_version';

/**
 * Compare two semver strings (e.g. "1.3.0" vs "1.2.6")
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map(p => parseInt(p, 10) || 0);
  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Check server for available app updates
 */
export async function checkForAppUpdates(): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  latestVersionInfo?: AppVersionInfo;
}> {
  try {
    const response = await fetch(`${VERSION_CHECK_ENDPOINT}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION };
    }

    const versionInfo: AppVersionInfo = await response.json();
    const hasUpdate = compareVersions(versionInfo.version, CURRENT_APP_VERSION) > 0;

    return {
      hasUpdate,
      currentVersion: CURRENT_APP_VERSION,
      latestVersionInfo: versionInfo
    };
  } catch (err) {
    console.warn('[AutoUpdate] Check failed (running offline or network error):', err);
    return { hasUpdate: false, currentVersion: CURRENT_APP_VERSION };
  }
}

/**
 * Perform automatic in-app update:
 * 1. Clears stale application caches / service workers
 * 2. Fetches fresh assets from distributor server
 * 3. Smoothly reloads the application with latest code, eliminating APK reinstall friction
 */
export async function performInAppUpdate(
  onProgress?: (percent: number, statusText: string) => void
): Promise<void> {
  onProgress?.(15, 'Checking update package...');
  await new Promise(r => setTimeout(r, 200));

  // If running in browser with Service Workers or Cache Storage
  if ('caches' in window) {
    onProgress?.(40, 'Updating local app bundle...');
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    } catch (e) {
      console.warn('[AutoUpdate] Cache purge warning:', e);
    }
  }

  // Update Service Worker registration if active
  if ('serviceWorker' in navigator) {
    onProgress?.(70, 'Synchronizing latest features...');
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
      }
    } catch (e) {
      console.warn('[AutoUpdate] SW update warning:', e);
    }
  }

  onProgress?.(95, 'Restarting with latest version...');
  await new Promise(r => setTimeout(r, 400));

  // Reload the application cache-busted
  const cleanUrl = window.location.origin + window.location.pathname + `?updated_v=${Date.now()}` + window.location.hash;
  window.location.replace(cleanUrl);
}

/**
 * Get whether auto-update on restart is enabled by the user
 */
export function isAutoUpdateEnabled(): boolean {
  return localStorage.getItem(AUTO_UPDATE_PREF_KEY) !== 'false';
}

/**
 * Toggle auto-update on restart preference
 */
export function setAutoUpdateEnabled(enabled: boolean): void {
  localStorage.setItem(AUTO_UPDATE_PREF_KEY, enabled ? 'true' : 'false');
}

/**
 * Skip a specific non-mandatory version update
 */
export function skipVersionUpdate(version: string): void {
  localStorage.setItem(LAST_SKIPPED_VERSION_KEY, version);
}

/**
 * Check if a version was previously skipped
 */
export function isVersionSkipped(version: string): boolean {
  return localStorage.getItem(LAST_SKIPPED_VERSION_KEY) === version;
}
