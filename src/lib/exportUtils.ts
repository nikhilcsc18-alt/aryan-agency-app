import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  dataKey: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
}

export interface ExportReportOptions {
  reportTitle: string;
  fileNamePrefix: string;
  periodLabel: string;
  filterSummary?: string[];
  columns: ExportColumn[];
  rows: Record<string, any>[];
  summaryCards?: { label: string; value: string }[];
}

const AGENCY_HEADER = {
  name: 'ARYAN AGENCY',
  tagline: 'Trusted FMCG Supplier & Wholesale Distributor',
  gstin: 'GSTIN: 09BOGPG2620P1ZQ',
  address: 'Station Road, Utraula, Balrampur, Uttar Pradesh - 271304',
  contact: 'Ph: +91 98391 23456 / +91 94520 67890 | Email: info@aryanagency.in | Web: aryanagency.in'
};

/**
 * 1. Professional PDF Export with Aryan Agency Letterhead & Styling
 */
export function exportReportToPdf(options: ExportReportOptions) {
  const {
    reportTitle,
    fileNamePrefix,
    periodLabel,
    filterSummary = [],
    columns,
    rows,
    summaryCards = []
  } = options;

  // Choose orientation: landscape if more than 6 columns, else portrait
  const isLandscape = columns.length > 6;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 14;

  // Header Background Banner
  doc.setFillColor(11, 19, 43); // Dark Navy Blue (#0B132B)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Title & Tagline in Letterhead
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(AGENCY_HEADER.name, 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 215, 240);
  doc.text(AGENCY_HEADER.tagline, 14, currentY + 5);
  doc.text(`${AGENCY_HEADER.address} | ${AGENCY_HEADER.gstin}`, 14, currentY + 9.5);

  // Right-aligned contact in header
  doc.setFontSize(8);
  doc.setTextColor(220, 230, 250);
  doc.text(`Contact: +91 98391 23456`, pageWidth - 14, currentY, { align: 'right' });
  doc.text(`support@aryanagency.in`, pageWidth - 14, currentY + 5, { align: 'right' });

  currentY = 34;

  // Report Title & Period Banner
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(reportTitle.toUpperCase(), 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Reporting Period: ${periodLabel}`, 14, currentY + 5);

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  doc.text(`Generated On: ${nowFormatted}`, pageWidth - 14, currentY + 5, { align: 'right' });

  currentY += 10;

  // Active Filters row if present
  if (filterSummary.length > 0) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, currentY, pageWidth - 28, 7, 1.5, 1.5, 'F');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Filters: ${filterSummary.join(' | ')}`, 16, currentY + 4.8);
    currentY += 10;
  }

  // Summary Metrics Mini-Cards
  if (summaryCards.length > 0) {
    const cardCount = Math.min(summaryCards.length, 5);
    const cardGap = 3;
    const totalAvailWidth = pageWidth - 28;
    const cardWidth = (totalAvailWidth - (cardGap * (cardCount - 1))) / cardCount;
    const cardHeight = 13;

    summaryCards.slice(0, 5).forEach((card, idx) => {
      const cardX = 14 + idx * (cardWidth + cardGap);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(card.label, cardX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(card.value, cardX + 3, currentY + 10.2);
    });

    currentY += cardHeight + 5;
  }

  // Table using jspdf-autotable
  const tableHeaders = columns.map(c => c.header);
  const tableBody = rows.map(r => columns.map(c => {
    const val = r[c.dataKey];
    return val !== undefined && val !== null ? String(val) : '-';
  }));

  const columnStyles: Record<number, any> = {};
  columns.forEach((col, idx) => {
    columnStyles[idx] = {
      halign: col.align || 'left',
      cellWidth: col.width ? col.width : 'auto'
    };
  });

  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate 50
    },
    columnStyles,
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer on every page
      const pageCount = (doc as any).internal.getNumberOfPages();
      const pageCurrent = (data as any).pageNumber;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Aryan Agency ERP Module · Confidential Distribution Statement`,
        14,
        doc.internal.pageSize.getHeight() - 6
      );
      doc.text(
        `Page ${pageCurrent} of ${pageCount}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'right' }
      );
    }
  });

  // Save the document
  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`${fileNamePrefix}_${dateStamp}.pdf`);
}

/**
 * 2. Professional Excel (.xlsx) Export with Formatted Columns & Header
 */
export function exportReportToExcel(options: ExportReportOptions) {
  const {
    reportTitle,
    fileNamePrefix,
    periodLabel,
    filterSummary = [],
    columns,
    rows,
    summaryCards = []
  } = options;

  const nowFormatted = new Date().toLocaleString('en-IN');

  // Build sheet rows array
  const sheetData: any[][] = [];

  // Header Title Lines
  sheetData.push([AGENCY_HEADER.name]);
  sheetData.push([AGENCY_HEADER.tagline]);
  sheetData.push([`${AGENCY_HEADER.address} | ${AGENCY_HEADER.gstin}`]);
  sheetData.push([]);
  sheetData.push([`REPORT: ${reportTitle.toUpperCase()}`]);
  sheetData.push([`PERIOD: ${periodLabel}`, '', `GENERATED ON: ${nowFormatted}`]);

  if (filterSummary.length > 0) {
    sheetData.push([`APPLIED FILTERS: ${filterSummary.join(' | ')}`]);
  }

  // Summary Metrics row
  if (summaryCards.length > 0) {
    sheetData.push([]);
    const summaryLabels = summaryCards.map(s => s.label);
    const summaryValues = summaryCards.map(s => s.value);
    sheetData.push(summaryLabels);
    sheetData.push(summaryValues);
  }

  sheetData.push([]); // blank separator

  // Table Column Headers
  const headerRow = columns.map(c => c.header);
  sheetData.push(headerRow);

  // Table Data Rows
  rows.forEach(r => {
    const rowValues = columns.map(c => {
      const val = r[c.dataKey];
      return val !== undefined && val !== null ? val : '';
    });
    sheetData.push(rowValues);
  });

  // Create Workbook & Worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths based on headers & content
  const colWidths = columns.map(c => ({
    wch: Math.max(c.header.length + 4, 14)
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  const safeSheetName = reportTitle.slice(0, 28).replace(/[/\\?*[\]]/g, ' ');
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileNamePrefix}_${dateStamp}.xlsx`);
}

/**
 * 3. RFC-4180 Compliant CSV Export
 */
export function exportReportToCsv(options: ExportReportOptions) {
  const {
    fileNamePrefix,
    columns,
    rows
  } = options;

  const escapeCsv = (val: any): string => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = columns.map(c => escapeCsv(c.header)).join(',');
  const rowLines = rows.map(r => {
    return columns.map(c => escapeCsv(r[c.dataKey])).join(',');
  });

  const csvContent = [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileNamePrefix}_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 4. Print Report (Direct clean printer trigger)
 */
export function printReportPreview() {
  try {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  } catch (err) {
    console.warn('[printReportPreview notice]:', err);
  }
}
