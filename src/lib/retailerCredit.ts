/**
 * Retailer Credit Control Management
 * Handles Admin-level toggling of Credit/Udhar access and credit limits for individual retailers.
 * Synchronizes with database and local storage to ensure persistent settings and instant UI reactivity.
 */

import { useState, useEffect } from 'react';
import { Retailer } from '../types';

export interface RetailerCreditSettings {
  creditEnabled: boolean;
  creditLimit?: number;
  creditDaysAllowed?: number;
  updatedAt?: string;
  updatedBy?: string;
}

const STORAGE_KEY = 'aryan_retailer_credit_controls';
const CREDIT_UPDATE_EVENT = 'aryan_retailer_credit_updated';

/**
 * Read all local credit overrides
 */
export function getAllCreditOverrides(): Record<string, RetailerCreditSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[retailerCredit] Failed to parse credit overrides from storage:', err);
    return {};
  }
}

/**
 * Get credit settings for a specific retailer.
 * By default: credit is disabled unless explicitly enabled by Admin.
 */
export function getRetailerCreditSettings(retailer: Partial<Retailer>): RetailerCreditSettings {
  if (!retailer || !retailer.id) {
    return { creditEnabled: false, creditLimit: 0, creditDaysAllowed: 14 };
  }

  const overrides = getAllCreditOverrides();
  const override = overrides[retailer.id];

  // If local override exists, it has highest authority for current session
  if (override !== undefined && override.creditEnabled !== undefined) {
    return {
      creditEnabled: Boolean(override.creditEnabled),
      creditLimit: override.creditLimit !== undefined ? override.creditLimit : (retailer.creditLimit ?? 50000),
      creditDaysAllowed: override.creditDaysAllowed !== undefined ? override.creditDaysAllowed : (retailer.creditDaysAllowed ?? 14),
      updatedAt: override.updatedAt
    };
  }

  // Next check database record
  if (retailer.creditEnabled !== undefined) {
    return {
      creditEnabled: Boolean(retailer.creditEnabled),
      creditLimit: retailer.creditLimit ?? 50000,
      creditDaysAllowed: retailer.creditDaysAllowed ?? 14
    };
  }

  // Default: credit is disabled until Admin explicitly enables it
  return {
    creditEnabled: false,
    creditLimit: retailer.creditLimit ?? 50000,
    creditDaysAllowed: retailer.creditDaysAllowed ?? 14
  };
}

/**
 * Check if credit/udhaar is enabled for this retailer
 */
export function isCreditEnabledForRetailer(retailer?: Partial<Retailer> | null): boolean {
  if (!retailer) return false;
  return getRetailerCreditSettings(retailer).creditEnabled;
}

/**
 * Save credit setting for a retailer (Admin only).
 * Dispatches event for real-time reactivity across Cart, RetailersView, and Order modals.
 */
export function setRetailerCreditControl(
  retailerId: string, 
  settings: Partial<RetailerCreditSettings>
): RetailerCreditSettings {
  try {
    const overrides = getAllCreditOverrides();
    const existing = overrides[retailerId] || { creditEnabled: false };
    
    const updated: RetailerCreditSettings = {
      ...existing,
      ...settings,
      updatedAt: new Date().toISOString()
    };

    overrides[retailerId] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));

    // Dispatch global event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CREDIT_UPDATE_EVENT, { 
        detail: { retailerId, settings: updated } 
      }));
    }

    return updated;
  } catch (err) {
    console.error('[retailerCredit] Failed to save credit control:', err);
    return { creditEnabled: Boolean(settings.creditEnabled) };
  }
}

/**
 * Apply saved credit overrides to a list of retailers loaded from API/Supabase
 */
export function applyCreditControlsToRetailers(retailers: Retailer[]): Retailer[] {
  const overrides = getAllCreditOverrides();
  return retailers.map(r => {
    const override = overrides[r.id];
    if (override) {
      return {
        ...r,
        creditEnabled: override.creditEnabled,
        creditLimit: override.creditLimit !== undefined ? override.creditLimit : r.creditLimit,
        creditDaysAllowed: override.creditDaysAllowed !== undefined ? override.creditDaysAllowed : r.creditDaysAllowed
      };
    }
    // If not in overrides and not in r.creditEnabled, defaults to false
    return {
      ...r,
      creditEnabled: r.creditEnabled !== undefined ? Boolean(r.creditEnabled) : false
    };
  });
}

/**
 * React hook to listen for real-time credit control changes
 */
export function useRetailerCredit(retailer?: Partial<Retailer> | null) {
  const [creditSettings, setCreditSettings] = useState<RetailerCreditSettings>(() => 
    retailer ? getRetailerCreditSettings(retailer) : { creditEnabled: false }
  );

  useEffect(() => {
    if (!retailer?.id) return;
    setCreditSettings(getRetailerCreditSettings(retailer));

    const handleUpdate = (e: any) => {
      if (e?.detail?.retailerId === retailer.id) {
        setCreditSettings(e.detail.settings);
      } else if (!e?.detail?.retailerId) {
        setCreditSettings(getRetailerCreditSettings(retailer));
      }
    };

    window.addEventListener(CREDIT_UPDATE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(CREDIT_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [retailer?.id, retailer?.creditEnabled, retailer?.creditLimit]);

  return creditSettings;
}
