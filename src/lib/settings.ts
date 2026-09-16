import { useState, useEffect } from 'react';

export interface DistributorSettings {
  allowCOD: boolean;
  mandatoryOnlinePayment: boolean;
  upiVpa: string;
  upiPayeeName: string;
  // Delivery charges settings
  enableDeliveryCharges: boolean;
  deliveryCharge: number; // e.g. ₹50 standard fee
  freeDeliveryAbove: number; // e.g. ₹2000 (Orders above this amount get free delivery)
  // Govt MDR charges settings
  enableMdr: boolean;
  mdrPercentage: number; // e.g. 0.04 (%)
}

const DEFAULT_SETTINGS: DistributorSettings = {
  allowCOD: true,
  mandatoryOnlinePayment: false,
  upiVpa: 'aryanagency@upi',
  upiPayeeName: 'Aryan Agency',
  enableDeliveryCharges: true,
  deliveryCharge: 50,
  freeDeliveryAbove: 2000,
  enableMdr: true,
  mdrPercentage: 0.04
};

const SETTINGS_STORAGE_KEY = 'aryan_distributor_settings';
const SETTINGS_EVENT = 'aryan_settings_updated';

export const getDistributorSettings = (): DistributorSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Replace old placeholder that resolved to Dharmesh D Patel on ICICI bank
    if (parsed.upiVpa === 'aryanagency@icici') {
      parsed.upiVpa = 'aryanagency@upi';
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
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
