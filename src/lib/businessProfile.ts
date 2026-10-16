/**
 * Centralized Business Profile for Aryan Agency FMCG Distribution
 * Single Source of Truth for Company Identity, Legal Registration,
 * Addresses, Verified Contacts, and Digital ID Card Details.
 */

export interface BusinessProfile {
  businessName: string;
  businessType: string;
  tagline: string;
  shortTagline: string;
  address: string;
  road: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  fullAddress: string;
  primaryMobile: string;
  supportPhoneFormatted: string;
  email: string;
  gstin: string;
  panNumber: string;
  fssaiNumber: string;
  website: string;
  officialDomain: string;
  operatingHours: string;
}

export const ARYAN_AGENCY_PROFILE: BusinessProfile = {
  businessName: 'Aryan Agency',
  businessType: 'FMCG Distribution — Trusted FMCG Supplier',
  tagline: 'FMCG Distribution — Trusted FMCG Supplier',
  shortTagline: 'Authorised Super Stockist & Wholesale FMCG Depot',
  address: 'Hatan Road, Gurudyaldeeh',
  road: 'Hatan Road',
  area: 'Gurudyaldeeh',
  city: 'Utraula',
  district: 'Balrampur',
  state: 'Uttar Pradesh',
  pincode: '271604', // Confirmed PIN Code
  fullAddress: 'Hatan Road, Gurudyaldeeh, Utraula, Balrampur, Uttar Pradesh – 271604',
  primaryMobile: '9140529661',
  supportPhoneFormatted: '+91 9140529661',
  email: 'aryanagency@zohomail.in',
  gstin: '09BOGPG2620P1ZQ',
  panNumber: 'BOGPG2620P',
  fssaiNumber: '11223344556677',
  website: 'https://aryanagency.in',
  officialDomain: 'aryanagency.in',
  operatingHours: '9:00 AM – 8:00 PM (Monday – Saturday)'
};

/**
 * Format standard company letterhead for PDF or printable documents
 */
export function getCompanyLetterhead(): {
  name: string;
  tagline: string;
  address: string;
  gstin: string;
  pan: string;
  contact: string;
  email: string;
  phone: string;
} {
  return {
    name: ARYAN_AGENCY_PROFILE.businessName.toUpperCase(),
    tagline: ARYAN_AGENCY_PROFILE.tagline,
    address: ARYAN_AGENCY_PROFILE.fullAddress,
    gstin: `GSTIN: ${ARYAN_AGENCY_PROFILE.gstin}`,
    pan: `PAN: ${ARYAN_AGENCY_PROFILE.panNumber}`,
    contact: `Ph: ${ARYAN_AGENCY_PROFILE.supportPhoneFormatted} | Email: ${ARYAN_AGENCY_PROFILE.email}`,
    email: ARYAN_AGENCY_PROFILE.email,
    phone: ARYAN_AGENCY_PROFILE.supportPhoneFormatted
  };
}
