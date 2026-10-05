/**
 * Retailer Verification Control Management
 * Handles persistent verification status overrides (pending / verified / rejected)
 * for retail outlets across Supabase and local ERP data storage.
 */

import { Retailer, User } from '../types';

export interface RetailerVerificationOverride {
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationRemarks?: string;
  verificationReasonCode?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  creditLimit?: number;
  creditEnabled?: boolean;
  creditDaysAllowed?: number;
  beatName?: string;
  updatedAt: string;
}

const STORAGE_KEY = 'aryan_retailer_verification_overrides';
export const VERIFICATION_UPDATE_EVENT = 'aryan_retailer_verification_updated';

/**
 * Read all local verification overrides
 */
export function getAllVerificationOverrides(): Record<string, RetailerVerificationOverride> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[retailerVerification] Failed to parse verification overrides from storage:', err);
    return {};
  }
}

/**
 * Get verification override for a specific retailer
 */
export function getRetailerVerificationOverride(retailerId: string): RetailerVerificationOverride | null {
  if (!retailerId) return null;
  const overrides = getAllVerificationOverrides();
  return overrides[retailerId] || null;
}

/**
 * Set verification override for a retailer and notify components
 */
export function setRetailerVerificationOverride(
  retailerId: string, 
  data: Partial<RetailerVerificationOverride> & { verificationStatus: 'pending' | 'verified' | 'rejected' }
): RetailerVerificationOverride {
  const overrides = getAllVerificationOverrides();
  const existing = overrides[retailerId] || {};
  
  const record: RetailerVerificationOverride = {
    ...existing,
    ...data,
    verificationStatus: data.verificationStatus,
    updatedAt: new Date().toISOString()
  };

  overrides[retailerId] = record;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.warn('[retailerVerification] Failed to persist override to localStorage:', err);
  }

  // Dispatch custom event for real-time reactive sync across components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VERIFICATION_UPDATE_EVENT, { 
      detail: { retailerId, override: record } 
    }));
  }

  return record;
}

/**
 * Apply verification overrides to a list of retailers.
 * Guarantees that once approved, a retailer stays approved even if remote database
 * lacks the schema column or returns cached default data.
 */
export function applyVerificationOverrides(retailers: Retailer[]): Retailer[] {
  if (!Array.isArray(retailers)) return [];
  const overrides = getAllVerificationOverrides();

  return retailers.map(retailer => {
    const override = overrides[retailer.id];
    if (!override) return retailer;

    return {
      ...retailer,
      verificationStatus: override.verificationStatus,
      verificationRemarks: override.verificationRemarks !== undefined ? override.verificationRemarks : retailer.verificationRemarks,
      verificationReasonCode: override.verificationReasonCode !== undefined ? override.verificationReasonCode : retailer.verificationReasonCode,
      verifiedAt: override.verifiedAt !== undefined ? override.verifiedAt : retailer.verifiedAt,
      verifiedBy: override.verifiedBy !== undefined ? override.verifiedBy : retailer.verifiedBy,
      creditLimit: override.creditLimit !== undefined ? override.creditLimit : retailer.creditLimit,
      creditEnabled: override.creditEnabled !== undefined ? override.creditEnabled : retailer.creditEnabled,
      creditDaysAllowed: override.creditDaysAllowed !== undefined ? override.creditDaysAllowed : retailer.creditDaysAllowed,
      beatName: override.beatName || retailer.beatName
    };
  });
}
