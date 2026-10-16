import jsPDF from 'jspdf';
import { Product, ProductCategory } from '../types';

export type CataloguePriceMode = 'wholesale_and_mrp' | 'mrp_only' | 'none';

export interface CatalogueGeneratorOptions {
  title?: string;
  subtitle?: string;
  priceMode: CataloguePriceMode;
  selectedCategory?: string; // 'all' or specific
  selectedBrand?: string; // 'all' or specific
  products: Product[];
  agencyName?: string;
  agencyTagline?: string;
  agencyAddress?: string;
  agencyPhones?: string;
  agencyEmail?: string;
  agencyGstin?: string;
  onProgress?: (progress: { current: number; total: number; message: string }) => void;
}

export interface GeneratedCatalogue {
  doc: jsPDF;
  blob: Blob;
  blobUrl: string;
  fileName: string;
  pageCount: number;
  productCount: number;
}

import { ARYAN_AGENCY_PROFILE } from './businessProfile';

const DEFAULT_AGENCY = {
  name: ARYAN_AGENCY_PROFILE.businessName.toUpperCase(),
  tagline: ARYAN_AGENCY_PROFILE.tagline,
  address: ARYAN_AGENCY_PROFILE.fullAddress,
  phones: ARYAN_AGENCY_PROFILE.supportPhoneFormatted,
  email: ARYAN_AGENCY_PROFILE.email,
  gstin: ARYAN_AGENCY_PROFILE.gstin,
  serviceAreas: 'Utraula, Balrampur, Tulsipur, Pachperwa, Rehra Bazar, Gonda'
};

/**
 * Loads an image URL and converts it to a base64 JPEG data URL safely.
 * Includes timeout and canvas resizing for high PDF speed and low memory footprint.
 */
async function loadImageAsBase64(url: string, timeoutMs = 2500): Promise<string | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') return null;
  if (!url || !url.trim()) return null;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 240;
        let width = img.width || maxDim;
        let height = img.height || maxDim;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = Math.max(width, 20);
        canvas.height = Math.max(height, 20);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        // White backdrop for clean rendering
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Creates a clean FMCG badge canvas image when real image fails to load or has CORS restrictions.
 */
function createFallbackProductImage(brand: string, category: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 160, 160);

  // Border
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 156, 156);

  // Brand Box
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(16, 20, 128, 48);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const brandShort = (brand || 'FMCG').slice(0, 12);
  ctx.fillText(brandShort, 80, 44);

  // Category Icon & Text
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 11px Helvetica, Arial, sans-serif';
  ctx.fillText('GENUINE PACK', 80, 95);

  ctx.fillStyle = '#64748B';
  ctx.font = '9px Helvetica, Arial, sans-serif';
  const catShort = (category || 'Standard').slice(0, 18);
  ctx.fillText(catShort, 80, 120);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Main Catalogue PDF Builder
 */
export async function generateCataloguePdf(options: CatalogueGeneratorOptions): Promise<GeneratedCatalogue> {
  const {
    title = 'DIGITAL PRODUCT CATALOGUE',
    subtitle = 'Comprehensive B2B FMCG Price & Assortment Directory',
    priceMode,
    selectedCategory = 'all',
    selectedBrand = 'all',
    products,
    agencyName = DEFAULT_AGENCY.name,
    agencyTagline = DEFAULT_AGENCY.tagline,
    agencyAddress = DEFAULT_AGENCY.address,
    agencyPhones = DEFAULT_AGENCY.phones,
    agencyEmail = DEFAULT_AGENCY.email,
    agencyGstin = DEFAULT_AGENCY.gstin,
    onProgress
  } = options;

  // Filter out any invalid/empty products and sort by category then brand then name
  const validProducts = (products || [])
    .filter(p => p && p.id && p.name)
    .sort((a, b) => {
      if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
      if (a.brand !== b.brand) return (a.brand || '').localeCompare(b.brand || '');
      return (a.name || '').localeCompare(b.name || '');
    });

  const totalProducts = validProducts.length;

  onProgress?.({
    current: 0,
    total: totalProducts,
    message: 'Starting digital catalogue compilation...'
  });

  // Pre-load images (with fallback)
  const imageMap = new Map<string, string>();
  for (let i = 0; i < validProducts.length; i++) {
    const p = validProducts[i];
    onProgress?.({
      current: i + 1,
      total: totalProducts,
      message: `Processing product visuals (${i + 1}/${totalProducts}): ${p.name.slice(0, 24)}...`
    });

    let base64 = await loadImageAsBase64(p.imageUrl);
    if (!base64) {
      base64 = createFallbackProductImage(p.brand, p.category);
    }
    imageMap.set(p.id, base64);
  }

  onProgress?.({
    current: totalProducts,
    total: totalProducts,
    message: 'Designing premium multi-page A4 catalogue...'
  });

  // Create jsPDF instance (A4 portrait, 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // =========================================================================
  // PAGE 1: COVER PAGE
  // =========================================================================
  
  // Navy background cover banner
  doc.setFillColor(11, 19, 43); // #0B132B
  doc.rect(0, 0, pageWidth, 135, 'F');

  // Decorative Accent Bar (Gold)
  doc.setFillColor(245, 158, 11); // #F59E0B
  doc.rect(0, 135, pageWidth, 4, 'F');

  // Distributor Badge
  doc.setFillColor(30, 58, 138); // #1E3A8A
  doc.roundedRect(20, 15, 170, 9, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(253, 224, 71); // amber-300
  doc.text('OFFICIAL FMCG SUPER STOCKIST & AUTHORIZED DISTRIBUTOR', 105, 21, { align: 'center' });

  // Aryan Agency Logo Emblem (Vector graphic)
  drawAryanAgencyCoverLogo(doc, 105, 36);

  // Agency Main Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('ARYAN AGENCY', 105, 54, { align: 'center' });

  // Prominent Tagline: Trusted FMCG Supplier
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(253, 224, 71); // Amber/Gold #FDE047
  doc.text('★ Trusted FMCG Supplier ★', 105, 63, { align: 'center' });

  // Thin separator line
  doc.setDrawColor(56, 189, 248);
  doc.setLineWidth(0.5);
  doc.line(35, 70, 175, 70);

  // Catalogue Title & Scope: Digital Product Catalogue
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('DIGITAL PRODUCT CATALOGUE', 105, 82, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(subtitle, 105, 91, { align: 'center' });

  // Price Mode Pill on Cover
  doc.setFillColor(245, 158, 11); // Gold pill
  doc.roundedRect(50, 103, 110, 12, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  const priceModeText = priceMode === 'wholesale_and_mrp'
    ? 'WHOLESALE TRADE RATES & MRP EDITION'
    : priceMode === 'mrp_only'
    ? 'STANDARD RETAIL MRP EDITION'
    : 'SHOWCASE CATALOGUE (RATES ON REQUEST)';
  doc.text(priceModeText, 105, 110.5, { align: 'center' });

  // Date and Scope text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const nowStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Published: ${nowStr} · Utraula & Balrampur Beat Network`, 105, 126, { align: 'center' });

  // LOWER COVER AREA (White / Slate)
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 139, pageWidth, pageHeight - 139, 'F');

  // Key Highlights Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(16, 148, 178, 62, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DISTRIBUTION NETWORK HIGHLIGHTS', 24, 158);

  // 3 Feature Columns
  const feats = [
    {
      title: '100% Genuine Stock',
      desc: 'Direct company sourcing from Parle, Britannia, Amul, Nestle, Tata, HUL & top FMCG brands.'
    },
    {
      title: 'Daily Beat Delivery',
      desc: 'Dedicated delivery vans covering Utraula, Balrampur, Tulsipur, Pachperwa & Rehra Bazar.'
    },
    {
      title: 'Trade Schemes & Credit',
      desc: 'Company trade discounts, free schemes & convenient credit facilities for verified retailers.'
    }
  ];

  feats.forEach((f, idx) => {
    const featX = 24 + idx * 56;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(featX, 164, 52, 40, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(f.title, featX + 4, 172);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(f.desc, 44);
    doc.text(splitDesc, featX + 4, 179);
  });

  // Summary Metrics Banner
  const uniqueCategories = Array.from(new Set(validProducts.map(p => p.category))).length;
  const uniqueBrands = Array.from(new Set(validProducts.map(p => p.brand))).length;

  const stats = [
    { label: 'Active Products', val: `${totalProducts} SKUs` },
    { label: 'Product Categories', val: `${uniqueCategories} Categories` },
    { label: 'Leading Brands', val: `${uniqueBrands} Brands` },
    { label: 'Order Dispatch', val: '24-48 Hours' }
  ];

  stats.forEach((st, idx) => {
    const sx = 16 + idx * 45;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(sx, 216, 43, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(st.label, sx + 4, 223);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(st.val, sx + 4, 231);
  });

  // Contact Footer Card on Cover Page
  doc.setFillColor(11, 19, 43);
  doc.roundedRect(16, 242, 178, 42, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(245, 158, 11);
  doc.text('FOR WHOLESALE ORDERS & RETAILER ONBOARDING:', 24, 252);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(241, 245, 249);
  doc.text(`Warehouse & Office: ${agencyAddress}`, 24, 259);
  doc.text(`Order Booking Phone: ${agencyPhones} | Email: ${agencyEmail}`, 24, 265);
  doc.text(`GSTIN Registration: ${agencyGstin} | State Code: 09 (Uttar Pradesh)`, 24, 271);
  doc.text(`Delivery Beats: ${DEFAULT_AGENCY.serviceAreas}`, 24, 277);

  // =========================================================================
  // PAGE 2: TABLE OF CONTENTS & ORDERING GUIDE
  // =========================================================================
  doc.addPage();

  // Mini Top Header
  drawPageHeader(doc, 'TABLE OF CONTENTS & HOW TO ORDER', agencyName, agencyPhones);

  // Table of Contents Section
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, 30, 178, 135, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('1. PRODUCT CATEGORIES INCLUDED', 24, 42);

  // Group by category to show count and starting page
  const catMap = new Map<string, { count: number; startPage: number }>();
  validProducts.forEach((p, pIdx) => {
    const pageNum = Math.floor(pIdx / 6) + 3;
    if (!catMap.has(p.category)) {
      catMap.set(p.category, { count: 1, startPage: pageNum });
    } else {
      catMap.get(p.category)!.count += 1;
    }
  });

  let catY = 52;
  Array.from(catMap.entries()).forEach(([catName, info], idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(24, catY - 4, 162, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 138);
    doc.text(`${idx + 1}. ${catName}`, 28, catY + 1.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${info.count} SKUs  ·  Page ${info.startPage}`, 180, catY + 1.5, { align: 'right' });

    catY += 9;
  });

  // Featured Brands Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. MAJOR FMCG BRANDS REPRESENTED', 24, 126);

  const brandMap = new Map<string, number>();
  validProducts.forEach(p => {
    brandMap.set(p.brand, (brandMap.get(p.brand) || 0) + 1);
  });

  const topBrands = Array.from(brandMap.entries())
    .map(([bName, bCount]) => `${bName} (${bCount})`)
    .join('  ·  ');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const brandLines = doc.splitTextToSize(topBrands, 162);
  doc.text(brandLines, 24, 134);

  // Ordering Guide Box
  doc.setFillColor(238, 242, 255); // Indigo light
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(16, 172, 178, 96, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('3. HOW TO BOOK YOUR WHOLESALE ORDER', 24, 184);

  const steps = [
    {
      num: 'A',
      title: 'WhatsApp Quick Booking',
      desc: 'Send product codes / item names & case counts directly to our dedicated order line: +91 98391 23456.'
    },
    {
      num: 'B',
      title: 'Beat Salesman Field Visit',
      desc: 'Book your orders directly with your assigned beat representative during regular store visits in Utraula & Balrampur.'
    },
    {
      num: 'C',
      title: 'Aryan Agency Retailer Portal',
      desc: 'Log in with your registered 10-digit mobile number on our app to see live wholesale rates, stock levels & statement.'
    },
    {
      num: 'D',
      title: 'Payment & Delivery Dispatch',
      desc: 'Orders are dispatched within 24-48 hours via route delivery vans with digital invoices & instant GST ITC pass-through.'
    }
  ];

  steps.forEach((s, sIdx) => {
    const sy = 194 + sIdx * 17;
    doc.setFillColor(30, 58, 138);
    doc.circle(30, sy - 1, 3.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(s.num, 30, sy + 0.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(s.title, 38, sy - 1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(s.desc, 38, sy + 3.5);
  });

  drawPageFooter(doc, 2, agencyAddress, agencyPhones);

  // =========================================================================
  // PRODUCT PAGES (6 products per page: 2 columns x 3 rows)
  // =========================================================================
  const productsPerPage = 6;
  const totalContentPages = Math.ceil(totalProducts / productsPerPage);

  for (let pageIdx = 0; pageIdx < totalContentPages; pageIdx++) {
    doc.addPage();
    const currentPageNum = 3 + pageIdx;

    const pageProducts = validProducts.slice(
      pageIdx * productsPerPage,
      (pageIdx + 1) * productsPerPage
    );

    // Current page main category name
    const currentCat = pageProducts[0]?.category || 'FMCG Assortment';
    drawPageHeader(
      doc,
      `${currentCat.toUpperCase()} · WHOLESALE DIRECTORY`,
      agencyName,
      agencyPhones
    );

    // Grid coordinates
    // Col 1: x = 14, width = 88
    // Col 2: x = 108, width = 88
    // Row 1: y = 28, height = 76
    // Row 2: y = 108, height = 76
    // Row 3: y = 188, height = 76

    const colWidth = 88;
    const cardHeight = 77;
    const colGap = 6;
    const rowGap = 5;
    const startX = 14;
    const startY = 28;

    pageProducts.forEach((prod, itemIdx) => {
      const col = itemIdx % 2;
      const row = Math.floor(itemIdx / 2);
      const cardX = startX + col * (colWidth + colGap);
      const cardY = startY + row * (cardHeight + rowGap);

      drawProductCard(doc, prod, cardX, cardY, colWidth, cardHeight, priceMode, imageMap.get(prod.id));
    });

    drawPageFooter(doc, currentPageNum, agencyAddress, agencyPhones);
  }

  // =========================================================================
  // BACK COVER: TERMS, POLICIES & BANK SETTLEMENT
  // =========================================================================
  doc.addPage();
  const backPageNum = 3 + totalContentPages;

  drawPageHeader(doc, 'TERMS, POLICIES & BANK SETTLEMENT', agencyName, agencyPhones);

  // Distributor Policies Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, 30, 178, 110, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('WHOLESALE DISTRIBUTION TERMS & CONDITIONS', 24, 42);

  const terms = [
    {
      title: 'Minimum Order Quantity (MOQ):',
      desc: 'Standard beat delivery MOQ is ₹2,000 or 2 cases. Mix assortment allowed across categories.'
    },
    {
      title: 'Pricing & GST Invoicing:',
      desc: 'All trade rates are subject to company scheme revisions. Fully compliant GST tax invoices provided with HSN code & valid GSTIN ITC credit.'
    },
    {
      title: 'Damage & Expiry Replacement Policy:',
      desc: 'Breakage / seal leakages must be reported to the delivery representative at the time of delivery. Expiry claims processed as per company credit note rules.'
    },
    {
      title: 'Credit & Payment Terms:',
      desc: 'Authorized credit accounts enjoy 7 to 15 days credit as per approved limit. Prompt payment unlocks higher trade limits and priority dispatch.'
    },
    {
      title: 'Beat Delivery Schedules:',
      desc: 'Regular deliveries to Utraula Retail Beat, Balrampur Central, Tulsipur, Jarwa, Pachperwa and Rehra Bazar routes.'
    }
  ];

  let termY = 52;
  terms.forEach(t => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(t.title, 24, termY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitT = doc.splitTextToSize(t.desc, 160);
    doc.text(splitT, 24, termY + 4.5);

    termY += 12;
  });

  // Bank & UPI Settlement Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(16, 148, 178, 76, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('BANK ACCOUNT & DIGITAL UPI PAYMENT DETAILS', 24, 160);

  // Bank Details Left Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('SETTLEMENT BANK:', 24, 170);
  doc.text('ACCOUNT NAME:', 24, 178);
  doc.text('ACCOUNT TYPE:', 24, 186);
  doc.text('BRANCH:', 24, 194);
  doc.text('IFSC CODE:', 24, 202);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('State Bank of India (SBI)', 65, 170);
  doc.text('Aryan Agency FMCG Distribution', 65, 178);
  doc.text('Current Account (B2B Commercial)', 65, 186);
  doc.text('Station Road Branch, Utraula', 65, 194);
  doc.text('SBIN0000612', 65, 202);

  // UPI Box Right Column
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(125, 165, 62, 50, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('INSTANT UPI QR', 156, 174, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Scan from PhonePe, GPay, Paytm', 156, 181, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('aryanagency@upi', 156, 192, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Real-time ledger credit', 156, 202, { align: 'center' });

  // Thank You Banner
  doc.setFillColor(11, 19, 43);
  doc.roundedRect(16, 230, 178, 38, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(245, 158, 11);
  doc.text('THANK YOU FOR PARTNERING WITH ARYAN AGENCY', 105, 243, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(241, 245, 249);
  doc.text('Building Strong FMCG Retail Partnerships Across Eastern Uttar Pradesh', 105, 251, { align: 'center' });
  doc.text(`Contact: ${agencyPhones} · Email: ${agencyEmail}`, 105, 258, { align: 'center' });

  drawPageFooter(doc, backPageNum, agencyAddress, agencyPhones);

  // Total pages count
  const totalPages = doc.getNumberOfPages();

  // Add "Page X of Y" dynamically on all content pages
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  // Generate output blob and URL
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const safeName = (title || 'Catalogue').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Aryan_Agency_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;

  onProgress?.({
    current: totalProducts,
    total: totalProducts,
    message: 'Digital catalogue successfully compiled!'
  });

  return {
    doc,
    blob,
    blobUrl,
    fileName,
    pageCount: totalPages,
    productCount: totalProducts
  };
}

/**
 * Draws a crisp Aryan Agency FMCG logo emblem for the cover page
 */
function drawAryanAgencyCoverLogo(doc: jsPDF, cx: number, cy: number) {
  // Golden circular emblem badge with navy center
  doc.setFillColor(30, 58, 138); // blue-900
  doc.circle(cx, cy, 10.5, 'F');
  doc.setDrawColor(245, 158, 11); // Gold rim
  doc.setLineWidth(0.9);
  doc.circle(cx, cy, 10.5, 'S');

  // Basket handles
  doc.setDrawColor(56, 189, 248); // sky-400
  doc.setLineWidth(0.6);
  doc.line(cx - 4.5, cy + 1, cx - 1.8, cy - 3.5);
  doc.line(cx + 4.5, cy + 1, cx + 1.8, cy - 3.5);

  // FMCG products inside basket
  doc.setFillColor(249, 115, 22); // orange juice carton
  doc.rect(cx - 3.8, cy - 4.8, 2.2, 4.2, 'F');

  doc.setFillColor(6, 182, 212); // cyan spray/can
  doc.rect(cx - 0.8, cy - 5.5, 2.2, 5, 'F');

  doc.setFillColor(16, 185, 129); // green beverage bottle
  doc.rect(cx + 2.2, cy - 4.2, 2.0, 3.8, 'F');

  // Shopping Basket body
  doc.setFillColor(2, 132, 199); // blue-600
  doc.roundedRect(cx - 6, cy, 12, 5.5, 1, 1, 'F');

  // Basket grid wire accents
  doc.setDrawColor(186, 230, 253);
  doc.setLineWidth(0.35);
  doc.line(cx - 5, cy + 2.5, cx + 5, cy + 2.5);
}

/**
 * Top Page Header on Content Pages
 */
function drawPageHeader(doc: jsPDF, sectionTitle: string, agencyName: string, agencyPhone: string) {
  // Navy Top Bar
  doc.setFillColor(11, 19, 43);
  doc.rect(0, 0, 210, 18, 'F');

  // Gold accent line
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 18, 210, 1.5, 'F');

  // Left Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(agencyName, 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(253, 224, 71); // amber-300
  doc.text(` ·  ${sectionTitle}`, 50, 11);

  // Right Contact
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Order Hotline: ${agencyPhone.split('/')[0].trim()}`, 196, 11, { align: 'right' });
}

/**
 * Bottom Page Footer on Content Pages
 */
function drawPageFooter(doc: jsPDF, pageNum: number, address: string, phones: string) {
  const pageHeight = 297;
  const pageWidth = 210;

  // Thin separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

  // Left text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Aryan Agency FMCG Distribution · Utraula, Balrampur (UP)', 14, pageHeight - 8);
}

/**
 * Renders a single, beautifully styled product card inside the PDF grid
 */
function drawProductCard(
  doc: jsPDF,
  p: Product,
  x: number,
  y: number,
  width: number,
  height: number,
  priceMode: CataloguePriceMode,
  imageBase64?: string
) {
  // Card outer container
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  // Top Category / Brand Pill
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(x + 1, y + 1, width - 2, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 58, 138); // blue-900
  const brandLabel = (p.brand || 'FMCG').toUpperCase();
  doc.text(brandLabel, x + 3.5, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const catLabel = (p.category || 'General').slice(0, 20);
  doc.text(catLabel, x + width - 3.5, y + 5, { align: 'right' });

  // Product Image Box (26 x 26 mm)
  const imgX = x + 3;
  const imgY = y + 9.5;
  const imgSize = 25;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(241, 245, 249);
  doc.roundedRect(imgX, imgY, imgSize, imgSize, 1.5, 1.5, 'FD');

  if (imageBase64) {
    try {
      doc.addImage(imageBase64, 'JPEG', imgX + 0.5, imgY + 0.5, imgSize - 1, imgSize - 1);
    } catch {
      // Fallback text if image add fails
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(brandLabel.slice(0, 4), imgX + imgSize / 2, imgY + imgSize / 2, { align: 'center' });
    }
  }

  // Product Name (Right of Image)
  const textX = imgX + imgSize + 3;
  const textWidth = width - (imgSize + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42); // slate-900
  const nameLines = doc.splitTextToSize(p.name, textWidth);
  const renderedNameLines = nameLines.slice(0, 2);
  doc.text(renderedNameLines, textX, imgY + 4);

  // Pack details & specs
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);

  const packDesc = p.packSize 
    ? `Pack: ${p.packSize}` 
    : p.piecesPerCase 
    ? `Case of ${p.piecesPerCase} pcs` 
    : 'Standard Pack';
  doc.text(packDesc, textX, imgY + 14.5);

  // Barcode / SKU
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184); // slate-400
  const skuOrBarcode = p.barcode ? `Barcode: ${p.barcode}` : `SKU: ${p.sku}`;
  doc.text(skuOrBarcode.slice(0, 26), textX, imgY + 19.5);

  // GST & HSN
  if (p.hsnCode || p.gstRate) {
    doc.text(`GST: ${p.gstRate}% · HSN: ${p.hsnCode || 'N/A'}`, textX, imgY + 24);
  }

  // Active Trade Scheme Banner (if any)
  let schemeY = y + 36.5;
  if (p.activeScheme && p.activeScheme.title) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(251, 191, 36); // amber-400
    doc.roundedRect(x + 2.5, schemeY, width - 5, 6, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(180, 83, 9); // amber-700
    const schemeText = `SCHEME: ${p.activeScheme.title} (${p.activeScheme.description || ''})`.slice(0, 48);
    doc.text(schemeText, x + 4, schemeY + 4.2);
    schemeY += 7.5;
  } else {
    schemeY += 1.5;
  }

  // Pricing Box (Bottom of Card)
  const priceBoxY = schemeY + 1;
  const priceBoxHeight = (y + height - 2.5) - priceBoxY;

  if (priceMode === 'wholesale_and_mrp') {
    doc.setFillColor(240, 253, 244); // light emerald-50
    doc.setDrawColor(187, 247, 208); // emerald-200
    doc.roundedRect(x + 2.5, priceBoxY, width - 5, priceBoxHeight, 1.5, 1.5, 'FD');

    // MRP Column
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('MRP:', x + 5, priceBoxY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`₹${p.mrpPiece.toFixed(2)}`, x + 5, priceBoxY + 12.5);

    // Wholesale Price Column (Prominent)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text('WHOLESALE RATE:', x + 30, priceBoxY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87);
    doc.text(`₹${p.wholesalePricePiece.toFixed(2)}`, x + 30, priceBoxY + 13);

    // Margin & Case Details
    const marginAmount = Math.max(0, p.mrpPiece - p.wholesalePricePiece);
    const marginPercent = p.mrpPiece > 0 ? (marginAmount / p.mrpPiece) * 100 : 0;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`Margin: ₹${marginAmount.toFixed(1)} (${marginPercent.toFixed(0)}%)`, x + width - 5, priceBoxY + 6.5, { align: 'right' });

    if (p.casePrice || p.piecesPerCase) {
      const caseCost = p.casePrice || (p.wholesalePricePiece * (p.piecesPerCase || 1));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(71, 85, 105);
      doc.text(`Case: ₹${caseCost.toFixed(0)}`, x + width - 5, priceBoxY + 13, { align: 'right' });
    }
  } else if (priceMode === 'mrp_only') {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x + 2.5, priceBoxY, width - 5, priceBoxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('MAXIMUM RETAIL PRICE (MRP):', x + 5, priceBoxY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`₹${p.mrpPiece.toFixed(2)}`, x + 5, priceBoxY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Inclusive of all taxes', x + width - 5, priceBoxY + 15, { align: 'right' });
  } else {
    // No price mode
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x + 2.5, priceBoxY, width - 5, priceBoxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text('PRODUCT ASSORTMENT SHOWCASE', x + 5, priceBoxY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Trade rates & scheme discounts available upon enquiry', x + 5, priceBoxY + 16);
  }
}

/**
 * Downloads a generated catalogue blob cleanly in the user's browser or mobile webview
 */
export function downloadCataloguePdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Shares the catalogue file using the native Web Share API (Android, iOS, Chrome Mobile)
 * Falls back to returning false if files cannot be shared.
 */
export async function shareCatalogueFile(
  blob: Blob,
  fileName: string,
  title: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        text,
        files: [file]
      });
      return { success: true };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Share cancelled by user' };
    }
    return { success: false, error: err?.message || 'Native file sharing unavailable' };
  }

  return { success: false, error: 'Device does not support direct PDF file sharing' };
}

/**
 * Creates and opens a professional WhatsApp share link
 */
export function shareCatalogueViaWhatsApp(options: {
  phone?: string;
  retailerName?: string;
  catalogueTitle: string;
  productCount: number;
  topBrands: string[];
  agencyPhone?: string;
  priceMode: CataloguePriceMode;
}) {
  const {
    phone,
    retailerName,
    catalogueTitle,
    productCount,
    topBrands,
    agencyPhone = '+91 98391 23456',
    priceMode
  } = options;

  const greeting = retailerName
    ? `Namaste ${retailerName} ji,`
    : `Namaste Retail Partner,`;

  const priceText = priceMode === 'wholesale_and_mrp'
    ? 'Isme latest B2B Wholesale Trade Rates, MRP aur company schemes shaamil hain.'
    : priceMode === 'mrp_only'
    ? 'Isme latest products aur MRP details shaamil hain.'
    : 'Isme latest product catalogue shaamil hai.';

  const message = `${greeting}

*Aryan Agency (Utraula)* ki taraf se *${catalogueTitle}*!

📦 *Total Products:* ${productCount} Active SKUs
🏷️ *Leading Brands:* ${topBrands.slice(0, 6).join(', ')}
💰 *Pricing:* ${priceText}

🚚 *Daily Beat Delivery:* Utraula, Balrampur, Tulsipur & nearby areas
📞 *Order Booking Hotline:* ${agencyPhone}

Apna wholesale order book karne ke liye kripya reply karein ya call karein.
Dhanyawad,
*Aryan Agency FMCG Distribution*`;

  const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
  const waUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  window.open(waUrl, '_blank');
}
