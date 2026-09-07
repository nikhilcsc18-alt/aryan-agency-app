import { useState, useEffect } from 'react';

export interface DistributorSettings {
  allowCOD: boolean;
  mandatoryOnlinePayment: boolean;
  upiVpa: string;
  upiPayeeName: string;
}

const DEFAULT_SETTINGS: DistributorSettings = {
  allowCOD: true,
  mandatoryOnlinePayment: false,
  upiVpa: 'aryanagency@icici',
  upiPayeeName: 'Aryan Agency FMCG Distribution'
};

const SETTINGS_STORAGE_KEY = 'aryan_distributor_settings';
const SETTINGS_EVENT = 'aryan_settings_updated';

export const getDistributorSettings = (): DistributorSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Error reading distributor settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveDistributorSettings = (settings: Partial<DistributorSettings>): DistributorSettings => {
  try {
    const current = getDistributorSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Error saving distributor settings:', e);
    return getDistributorSettings();
  }
};

export const useDistributorSettings = () => {
  const [settings, setSettings] = useState<DistributorSettings>(getDistributorSettings);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setSettings(e.detail);
      } else {
        setSettings(getDistributorSettings());
      }
    };

    window.addEventListener(SETTINGS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(SETTINGS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateSettings = (newSettings: Partial<DistributorSettings>) => {
    const saved = saveDistributorSettings(newSettings);
    setSettings(saved);
  };

  return { settings, updateSettings };
};
