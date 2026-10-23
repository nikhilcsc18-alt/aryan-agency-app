import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  RotateCw, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Building2, 
  Award,
  Download,
  Share2,
  Check,
  Copy,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { StaffMember } from '../types';
import { AryanAgencyFMCGLogo } from './AryanAgencyLogo';
import { ARYAN_AGENCY_PROFILE, getVerifiedCompanyAddress } from '../lib/businessProfile';

interface StaffIdCardModalProps {
  staff: StaffMember;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffIdCardModal: React.FC<StaffIdCardModalProps> = ({
  staff,
  isOpen,
  onClose
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('front');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const verificationUrl = `https://${ARYAN_AGENCY_PROFILE.officialDomain}/verify/staff/${staff?.employeeCode || 'EMP'}`;

  useEffect(() => {
    if (!staff) return;
    // Generate verifiable non-sensitive QR payload
    const verificationPayload = JSON.stringify({
      empCode: staff.employeeCode,
      name: staff.name,
      role: staff.role,
      designation: staff.designation,
      issuer: ARYAN_AGENCY_PROFILE.businessName,
      companyPhone: ARYAN_AGENCY_PROFILE.primaryMobile,
      verifyUrl: verificationUrl
    });

    QRCode.toDataURL(verificationPayload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => {
      setQrCodeDataUrl(url);
    }).catch(err => {
      console.warn('QR code generation notice:', err);
    });
  }, [staff, verificationUrl]);

  if (!isOpen || !staff) return null;

  const handlePrint = () => {
    window.print();
  };

  /**
   * Generates and downloads a print-ready vector PDF ID card
   */
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      // Create CR80 standard card PDF (85.6mm x 53.98mm in landscape) or 2-up on A4
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [86, 54] // Standard CR-80 card dimensions
      });

      const cardW = 86;
      const cardH = 54;

      // ==========================================
      // PAGE 1: FRONT OF THE ID CARD
      // ==========================================
      // Header Banner (Navy)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, cardW, 11, 'F');

      // Top brand text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(ARYAN_AGENCY_PROFILE.businessName.toUpperCase(), 4, 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(ARYAN_AGENCY_PROFILE.businessType, 4, 8.5);

      // Gold badge "STAFF ID"
      doc.setFillColor(245, 158, 11); // amber-500
      doc.roundedRect(cardW - 17, 2.5, 13, 4.5, 0.8, 0.8, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.text('STAFF ID', cardW - 10.5, 5.5, { align: 'center' });

      // Employee Photo Box Placeholder / Border
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(4, 13.5, 18, 22, 1, 1, 'F');
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.3);
      doc.roundedRect(4, 13.5, 18, 22, 1, 1, 'D');

      // Employee initial in photo box
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(staff.name.charAt(0), 13, 26, { align: 'center' });

      // Employee ID Tag under photo
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(4, 36.5, 18, 4, 0.6, 0.6, 'F');
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(4);
      doc.text(staff.employeeCode, 13, 39.2, { align: 'center' });

      // Employee Details (Right Column)
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(staff.name, 25, 16.5);

      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text(staff.designation || 'Staff Member', 25, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4);
      doc.setTextColor(100, 116, 139);
      doc.text(`Department: ${getDepartmentName(staff.role)}`, 25, 23);

      // Separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(25, 25, cardW - 4, 25);

      // Contact info
      doc.setFontSize(4.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Mobile: ${staff.phone}`, 25, 28.5);
      doc.text(`Email: ${staff.email || 'N/A'}`, 25, 32);
      doc.text(`Joined: ${staff.joiningDate || 'Authorized'}`, 25, 35.5);
      if (staff.assignedBeats && staff.assignedBeats.length > 0) {
        doc.text(`Beat: ${staff.assignedBeats[0]}`, 25, 39);
      }

      // Footer Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, cardH - 5, cardW, 5, 'F');
      doc.setTextColor(203, 213, 225);
      doc.setFontSize(3.8);
      doc.text(`${getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)} · Ph: ${ARYAN_AGENCY_PROFILE.supportPhoneFormatted}`, cardW / 2, cardH - 1.8, { align: 'center' });

      // ==========================================
      // PAGE 2: BACK OF THE ID CARD
      // ==========================================
      doc.addPage([86, 54], 'landscape');

      // Top Back Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, cardW, 7, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.text('TERMS & EMPLOYMENT VERIFICATION', 4, 4.5);
      doc.setTextColor(203, 213, 225);
      doc.setFontSize(4.5);
      doc.text(`PASS: ${staff.employeeCode}`, cardW - 4, 4.5, { align: 'right' });

      // Company Info (Left)
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(ARYAN_AGENCY_PROFILE.businessName, 4, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.2);
      doc.setTextColor(71, 85, 105);
      doc.text(getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE), 4, 14.5);
      doc.text(`Care Desk: ${ARYAN_AGENCY_PROFILE.supportPhoneFormatted}`, 4, 18);
      doc.text(`Email: ${ARYAN_AGENCY_PROFILE.email}`, 4, 21.5);
      doc.text(`GSTIN: ${ARYAN_AGENCY_PROFILE.gstin} · PAN: ${ARYAN_AGENCY_PROFILE.panNumber}`, 4, 25);

      if (staff.emergencyContact) {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.text(`Emergency: ${staff.emergencyContact.name} (${staff.emergencyContact.relation}) - ${staff.emergencyContact.phone}`, 4, 29);
      }

      // QR Code (Right)
      if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, 'PNG', cardW - 22, 9, 18, 18);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(3.5);
        doc.text('Scan to Verify', cardW - 13, 29, { align: 'center' });
      }

      // Return Notice
      doc.setFillColor(254, 243, 199);
      doc.rect(4, 32, cardW - 8, 7, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.2);
      doc.rect(4, 32, cardW - 8, 7, 'D');
      doc.setTextColor(120, 53, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4);
      doc.text('Official Property Notice:', 6, 35);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.8);
      doc.text(`This card is property of ${ARYAN_AGENCY_PROFILE.businessName}. If found, please return to: ${getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)} or call ${ARYAN_AGENCY_PROFILE.supportPhoneFormatted}.`, 6, 37.5);

      // Signatures
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.5);
      doc.setTextColor(100, 116, 139);
      doc.line(10, 47, 30, 47);
      doc.text('Cardholder Signature', 20, 49.5, { align: 'center' });

      doc.line(cardW - 30, 47, cardW - 10, 47);
      doc.text('Authorized Signatory', cardW - 20, 49.5, { align: 'center' });

      // Save PDF file
      const safeName = (staff.name || 'Staff').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`AryanAgency_IDCard_${staff.employeeCode}_${safeName}.pdf`);
      setShareFeedback('ID Card PDF downloaded successfully!');
      setTimeout(() => setShareFeedback(null), 4000);
    } catch (err: any) {
      console.error('[Download PDF] Error:', err);
      alert('Failed to generate PDF. Please try printing the card instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Share ID Card via native Web Share API or copy link fallback
   */
  const handleShare = async () => {
    const shareData = {
      title: `${ARYAN_AGENCY_PROFILE.businessName} Staff ID Card - ${staff.name}`,
      text: `Authorized Employee Pass: ${staff.name} (${staff.employeeCode}), ${staff.designation} at ${ARYAN_AGENCY_PROFILE.businessName} FMCG Distribution. Official Helpline: ${ARYAN_AGENCY_PROFILE.supportPhoneFormatted}`,
      url: verificationUrl
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setShareFeedback('ID card shared successfully!');
        setTimeout(() => setShareFeedback(null), 4000);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, using clipboard fallback', err);
        }
      }
    }

    // Fallback: Copy verification link to clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text}\nVerification Link: ${shareData.url}`);
        setShareFeedback('Employee Pass details & link copied to clipboard!');
        setTimeout(() => setShareFeedback(null), 4000);
      } else {
        alert(`Verification Link:\n${verificationUrl}`);
      }
    } catch {
      alert(`Verification Link:\n${verificationUrl}`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'salesman':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivery':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accounts':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDepartmentName = (role: string) => {
    switch (role) {
      case 'admin': return 'Executive Management';
      case 'salesman': return 'Field Sales & Distribution';
      case 'delivery': return 'Logistics & Fleet Dispatch';
      case 'accounts': return 'Accounts & Trade Finance';
      default: return 'Operations';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Digital Staff Identity Card
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Authorized Pass
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Official employee credential for {staff.name} ({staff.employeeCode})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Side Toggle */}
            <div className="hidden sm:flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveSide('front')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeSide === 'front' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Front View
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('back')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeSide === 'back' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Back View
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('both')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeSide === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Both Sides
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert if Share / Download triggered */}
        {shareFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs text-emerald-800 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              {shareFeedback}
            </span>
            <button 
              type="button" 
              onClick={() => setShareFeedback(null)} 
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Card Stage / Printable Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-gradient-to-b from-slate-100/70 to-slate-200/50 flex flex-col items-center justify-center">
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full max-w-3xl" id="printable-staff-card">
            
            {/* ============================================================= */}
            {/* FRONT OF THE ID CARD (Standard CR80 Horizontal Layout)        */}
            {/* ============================================================= */}
            {(activeSide === 'front' || activeSide === 'both') && (
              <div className="w-full max-w-[460px] h-[290px] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col relative select-none shrink-0 transition-transform hover:scale-[1.01]">
                
                {/* Front Top Brand Banner */}
                <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 px-4 py-3 flex items-center justify-between text-white relative">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center border border-white/20">
                      <AryanAgencyFMCGLogo className="w-full h-full text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-wider uppercase text-white leading-tight">
                        {ARYAN_AGENCY_PROFILE.businessName}
                      </div>
                      <div className="text-[9px] font-semibold text-blue-200 tracking-wide">
                        {ARYAN_AGENCY_PROFILE.businessType}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-400 text-slate-950 tracking-wider shadow-2xs">
                      Staff ID Pass
                    </span>
                  </div>
                </div>

                {/* Main Card Body */}
                <div className="p-4 flex-1 flex items-center gap-4">
                  {/* Staff Photo Column */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-24 h-28 rounded-xl overflow-hidden border-2 border-blue-500/80 shadow-md bg-slate-100 relative">
                      {staff.photoUrl ? (
                        <img 
                          src={staff.photoUrl} 
                          alt={staff.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-200 to-slate-300 text-slate-500 font-bold text-2xl">
                          {staff.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[8px] text-center font-bold py-0.5 uppercase tracking-wider">
                        {staff.role}
                      </div>
                    </div>

                    <div className="mt-1.5 px-2 py-0.5 rounded-sm bg-slate-900 text-amber-300 font-mono text-[10px] font-bold tracking-wider shadow-2xs">
                      {staff.employeeCode}
                    </div>
                  </div>

                  {/* Staff Details Column */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-tight truncate">
                        {staff.name}
                      </h3>
                      <p className="text-xs font-bold text-blue-700 leading-snug">
                        {staff.designation}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {getDepartmentName(staff.role)}
                      </p>
                    </div>

                    <div className="pt-1 border-t border-slate-200/80 space-y-1 text-[11px] text-slate-700">
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold font-mono">{staff.phone}</span>
                      </div>
                      {staff.email ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate text-[10px] text-slate-600">{staff.email}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Joined: {staff.joiningDate}</span>
                        </span>
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] border ${getRoleBadgeColor(staff.role)}`}>
                          {staff.employmentStatus.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Beats / Location if salesman */}
                    {staff.assignedBeats && staff.assignedBeats.length > 0 && (
                      <div className="text-[9px] text-slate-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 truncate">
                        <span className="font-bold text-blue-900">Beat: </span>
                        {staff.assignedBeats.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Footer Ribbon */}
                <div className="px-4 py-1.5 bg-slate-900 text-slate-300 text-[8px] flex items-center justify-between">
                  <span className="truncate">{getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)}</span>
                  <span className="flex items-center gap-1 font-mono text-amber-400 shrink-0 ml-2">
                    <ShieldCheck className="w-2.5 h-2.5" /> OFFICIAL PASS
                  </span>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* BACK OF THE ID CARD (Standard CR80 Horizontal Layout)         */}
            {/* ============================================================= */}
            {(activeSide === 'back' || activeSide === 'both') && (
              <div className="w-full max-w-[460px] h-[290px] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col relative select-none shrink-0 transition-transform hover:scale-[1.01]">
                
                {/* Back Top Header */}
                <div className="bg-slate-900 px-4 py-2 text-white flex items-center justify-between">
                  <div className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                    Terms & Verification Conditions
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    ID: {staff.employeeCode}
                  </div>
                </div>

                {/* Back Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between text-slate-700">
                  
                  {/* Top section: Address & QR code */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 text-[10px] leading-relaxed max-w-[270px]">
                      <div className="font-bold text-slate-900 text-xs">
                        {ARYAN_AGENCY_PROFILE.businessName}
                      </div>
                      <p className="text-slate-600 text-[9.5px]">
                        {getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)}
                      </p>
                      <div className="font-mono text-[9px] text-slate-700 pt-0.5 space-y-0.5">
                        <div><b>Care Helpline:</b> {ARYAN_AGENCY_PROFILE.supportPhoneFormatted}</div>
                        <div><b>Business Email:</b> {ARYAN_AGENCY_PROFILE.email}</div>
                        <div><b>GSTIN:</b> {ARYAN_AGENCY_PROFILE.gstin} · <b>PAN:</b> {ARYAN_AGENCY_PROFILE.panNumber}</div>
                      </div>
                      {staff.emergencyContact && (
                        <div className="mt-1 pt-1 border-t border-slate-200 text-[9px] text-rose-700 font-medium">
                          <span className="font-bold">Emergency Contact: </span>
                          {staff.emergencyContact.name} ({staff.emergencyContact.relation}) - {staff.emergencyContact.phone}
                        </div>
                      )}
                    </div>

                    {/* QR Code Container */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-20 h-20 p-1 border border-slate-300 rounded-lg bg-white shadow-2xs flex items-center justify-center">
                        {qrCodeDataUrl ? (
                          <img 
                            src={qrCodeDataUrl} 
                            alt="Verification QR" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                            QR Code
                          </div>
                        )}
                      </div>
                      <span className="text-[7.5px] font-mono text-slate-500 mt-0.5">Scan to Verify</span>
                    </div>
                  </div>

                  {/* Return Notice */}
                  <div className="bg-amber-50/80 border border-amber-200 rounded p-1.5 text-[8.5px] text-amber-900 leading-tight">
                    <span className="font-bold">Important Notice:</span> This identity pass is non-transferable property of {ARYAN_AGENCY_PROFILE.businessName}. If found lost, please return to distributor address ({getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)}) or call <span className="font-bold font-mono">{ARYAN_AGENCY_PROFILE.supportPhoneFormatted}</span>.
                  </div>

                  {/* Signatures Row */}
                  <div className="flex items-end justify-between pt-1 border-t border-slate-200">
                    <div className="text-center w-28">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[10px] font-serif italic text-blue-900 font-semibold">{staff.name.split(' ')[0]}</span>
                      </div>
                      <div className="border-t border-slate-400 text-[8px] text-slate-500 uppercase font-semibold">
                        Holder Signature
                      </div>
                    </div>

                    <div className="text-center w-28">
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[10px] font-serif italic text-emerald-900 font-bold">Aryan Agency Auth</span>
                      </div>
                      <div className="border-t border-slate-400 text-[8px] text-slate-500 uppercase font-semibold">
                        Authorized Signatory
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Footer */}
                <div className="bg-slate-100 px-4 py-1 text-center text-[8px] text-slate-500 border-t border-slate-200">
                  {ARYAN_AGENCY_PROFILE.businessName} • {ARYAN_AGENCY_PROFILE.shortTagline}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span className="font-semibold text-slate-700">Verified Address:</span> {ARYAN_AGENCY_PROFILE.fullAddress} · Contact: {ARYAN_AGENCY_PROFILE.supportPhoneFormatted}
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => setActiveSide(prev => prev === 'front' ? 'back' : 'front')}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip Card</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Share digital ID card via WhatsApp, Native Share, or Copy link"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Share Pass</span>
            </button>

            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download CR-80 print-ready PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Print card directly using browser or system printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
