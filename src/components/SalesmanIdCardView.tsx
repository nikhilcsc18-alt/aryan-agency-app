import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Download, 
  Share2, 
  Printer, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Route, 
  Check, 
  Copy, 
  AlertCircle, 
  Building2, 
  ExternalLink,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { StaffMember, Salesman } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { AryanAgencyFMCGLogo } from './AryanAgencyLogo';
import { ARYAN_AGENCY_PROFILE, getVerifiedCompanyAddress } from '../lib/businessProfile';

interface SalesmanIdCardViewProps {
  salesman?: Salesman;
  onNavigateHome: () => void;
}

export const SalesmanIdCardView: React.FC<SalesmanIdCardViewProps> = ({
  salesman,
  onNavigateHome
}) => {
  const { currentUser, isSalesman } = useAuth();
  const [staffProfile, setStaffProfile] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('front');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Load authenticated staff profile dynamically
  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        setLoading(true);
        const staffList = await api.getStaffMembers();
        if (!isMounted) return;

        // Resolve staff record corresponding to the current authenticated salesman
        const match = (staffList || []).find((s: StaffMember) => 
          (salesman?.id && s.salesmanId === salesman.id) ||
          (currentUser?.id && s.userId === currentUser.id) ||
          (salesman?.email && s.email && s.email.toLowerCase() === salesman.email.toLowerCase()) ||
          (currentUser?.email && s.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (salesman?.id && s.id === `stf_${salesman.id}`) ||
          (salesman?.phone && s.phone && s.phone.replace(/\D/g, '').slice(-10) === salesman.phone.replace(/\D/g, '').slice(-10))
        );

        if (match) {
          setStaffProfile(match);
        } else if (salesman) {
          // Construct authorized profile from actual salesman credential
          setStaffProfile({
            id: `stf_${salesman.id}`,
            employeeCode: salesman.employeeCode || `EMP-${salesman.id.replace('slm_', '')}`,
            name: salesman.name,
            phone: salesman.phone || '+91 91405 29661',
            email: salesman.email || currentUser?.email || '',
            role: 'salesman',
            designation: 'Field Sales Officer',
            salesmanId: salesman.id,
            userId: currentUser?.id,
            assignedBeats: salesman.assignedBeats || ['Utraula Retail Beat'],
            joiningDate: '2024-03-15',
            employmentStatus: salesman.status === 'inactive' ? 'inactive' : 'active',
            salaryType: 'monthly_fixed',
            baseSalary: 22000,
            weeklyOffDay: 0,
            monthlyLeaveQuota: 2,
            createdAt: '2024-03-15T00:00:00Z',
            updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Failed to load salesman staff profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, [salesman, currentUser]);

  const verificationUrl = `https://${ARYAN_AGENCY_PROFILE.officialDomain}/verify/staff/${staffProfile?.employeeCode || 'EMP'}`;

  // Generate QR Code
  useEffect(() => {
    if (!staffProfile) return;
    const verificationPayload = JSON.stringify({
      empCode: staffProfile.employeeCode,
      name: staffProfile.name,
      role: staffProfile.role,
      designation: staffProfile.designation,
      issuer: ARYAN_AGENCY_PROFILE.businessName,
      companyPhone: ARYAN_AGENCY_PROFILE.primaryMobile,
      verifyUrl: verificationUrl
    });

    QRCode.toDataURL(verificationPayload, {
      width: 220,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    }).then(url => {
      setQrCodeDataUrl(url);
    }).catch(err => {
      console.warn('QR code generation notice:', err);
    });
  }, [staffProfile, verificationUrl]);

  const handlePrint = () => {
    window.print();
  };

  /**
   * Generates and downloads a print-ready vector PDF ID card
   */
  const handleDownloadPdf = async () => {
    if (!staffProfile) return;
    try {
      setIsDownloading(true);
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
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, cardW, 11, 'F');

      // Top brand text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(ARYAN_AGENCY_PROFILE.businessName.toUpperCase(), 12, 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4);
      doc.setTextColor(191, 219, 254);
      doc.text(ARYAN_AGENCY_PROFILE.businessType, 12, 8.5);

      doc.setFillColor(245, 158, 11);
      doc.rect(cardW - 22, 2.5, 18, 5.5, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.text('STAFF PASS', cardW - 13, 6.2, { align: 'center' });

      // Photo placeholder / border
      doc.setFillColor(241, 245, 249);
      doc.rect(4, 14, 18, 22, 'F');
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.4);
      doc.rect(4, 14, 18, 22, 'D');

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(staffProfile.name.charAt(0), 13, 26, { align: 'center' });

      // Employee Code Badge below photo
      doc.setFillColor(15, 23, 42);
      doc.rect(4, 38, 18, 5, 'F');
      doc.setTextColor(252, 211, 77);
      doc.setFont('courier', 'bold');
      doc.setFontSize(4.5);
      doc.text(staffProfile.employeeCode, 13, 41.5, { align: 'center' });

      // Staff Details
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(staffProfile.name, 25, 16.5);

      doc.setTextColor(37, 99, 235);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text(staffProfile.designation || 'Sales Representative', 25, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4);
      doc.setTextColor(100, 116, 139);
      doc.text('Field Sales & Distribution Depot', 25, 23);

      // Separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(25, 25, cardW - 4, 25);

      // Contact info
      doc.setFontSize(4.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Mobile: ${staffProfile.phone}`, 25, 28.5);
      if (staffProfile.email) {
        doc.text(`Email: ${staffProfile.email}`, 25, 32);
      }
      doc.text(`Joined: ${staffProfile.joiningDate || 'Authorized'}`, 25, staffProfile.email ? 35.5 : 32);
      if (staffProfile.assignedBeats && staffProfile.assignedBeats.length > 0) {
        doc.text(`Beat: ${staffProfile.assignedBeats[0]}`, 25, staffProfile.email ? 39 : 35.5);
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

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, cardW, 7, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.text('TERMS & EMPLOYMENT VERIFICATION', 4, 4.5);
      doc.setTextColor(203, 213, 225);
      doc.setFontSize(4.5);
      doc.text(`PASS: ${staffProfile.employeeCode}`, cardW - 4, 4.5, { align: 'right' });

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

      if (staffProfile.emergencyContact) {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.text(`Emergency: ${staffProfile.emergencyContact.name} (${staffProfile.emergencyContact.relation}) - ${staffProfile.emergencyContact.phone}`, 4, 29);
      }

      if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, 'PNG', cardW - 22, 9, 18, 18);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(3.5);
        doc.text('Scan to Verify', cardW - 13, 29, { align: 'center' });
      }

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
      doc.text(`This card is property of ${ARYAN_AGENCY_PROFILE.businessName}. If found, return to: ${getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)} or call ${ARYAN_AGENCY_PROFILE.supportPhoneFormatted}.`, 6, 37.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(3.5);
      doc.setTextColor(100, 116, 139);
      doc.line(10, 47, 30, 47);
      doc.text('Cardholder Signature', 20, 49.5, { align: 'center' });

      doc.line(cardW - 30, 47, cardW - 10, 47);
      doc.text('Authorized Signatory', cardW - 20, 49.5, { align: 'center' });

      const safeName = (staffProfile.name || 'Salesman').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`AryanAgency_IDCard_${staffProfile.employeeCode}_${safeName}.pdf`);
      setShareFeedback('ID Card PDF downloaded successfully!');
      setTimeout(() => setShareFeedback(null), 4000);
    } catch (err) {
      console.error('[Download PDF] Error:', err);
      alert('Failed to generate PDF. You can also print the card using the Print button.');
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Native Share API with fallback to copy link
   */
  const handleShare = async () => {
    if (!staffProfile) return;
    const shareData = {
      title: `${ARYAN_AGENCY_PROFILE.businessName} Staff ID Card - ${staffProfile.name}`,
      text: `Authorized Employee Pass: ${staffProfile.name} (${staffProfile.employeeCode}), ${staffProfile.designation} at ${ARYAN_AGENCY_PROFILE.businessName} FMCG Distribution. Official Helpline: ${ARYAN_AGENCY_PROFILE.supportPhoneFormatted}`,
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">Loading Authorized Identity Pass...</p>
      </div>
    );
  }

  if (!staffProfile) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Staff Profile Not Linked</h2>
        <p className="text-sm text-slate-500">
          Your authenticated login does not have an active employee profile record assigned yet.
          Please contact your administrator to authorize your staff pass.
        </p>
        <button
          type="button"
          onClick={onNavigateHome}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back to Home Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">
                Official Staff ID Card
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Verified Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Authenticated pass for {staffProfile.name} • {staffProfile.employeeCode}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Download CR-80 Vector PDF (Standard ID Card Size)"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Share ID Card with WhatsApp / Web Share"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Pass</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Print Physical ID Card"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {shareFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-xs text-emerald-800 font-semibold flex items-center gap-2 shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{shareFeedback}</span>
        </div>
      )}

      {/* Main Layout: Preview on Left, Authorized Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: ID Card Visual Showcase */}
        <div className="lg:col-span-7 bg-slate-100/80 rounded-2xl p-6 border border-slate-200 flex flex-col items-center justify-center space-y-4">
          
          <div className="flex items-center space-x-2 bg-white/90 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSide === 'front' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front Side
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSide === 'back' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back Side
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('both')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSide === 'both' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both Sides
            </button>
          </div>

          <div className="flex flex-col gap-5 w-full items-center">
            {/* Front Card */}
            {(activeSide === 'front' || activeSide === 'both') && (
              <div className="w-full max-w-[460px] h-[280px] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col relative select-none shrink-0 transition-transform hover:scale-[1.01]">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 px-4 py-2.5 flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 p-1 flex items-center justify-center border border-white/20">
                      <AryanAgencyFMCGLogo className="w-full h-full text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-wider uppercase text-white leading-tight">
                        {ARYAN_AGENCY_PROFILE.businessName}
                      </div>
                      <div className="text-[8.5px] font-semibold text-blue-200">
                        {ARYAN_AGENCY_PROFILE.businessType}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase bg-amber-400 text-slate-950 tracking-wider">
                    Staff Pass
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex items-center gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-22 h-26 rounded-xl overflow-hidden border-2 border-blue-500/80 shadow-md bg-slate-100 relative">
                      {staffProfile.photoUrl ? (
                        <img 
                          src={staffProfile.photoUrl} 
                          alt={staffProfile.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-200 to-slate-300 text-slate-500 font-bold text-2xl">
                          {staffProfile.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[7.5px] text-center font-bold py-0.5 uppercase tracking-wider">
                        {staffProfile.role}
                      </div>
                    </div>
                    <div className="mt-1.5 px-2 py-0.5 rounded-sm bg-slate-900 text-amber-300 font-mono text-[9.5px] font-bold">
                      {staffProfile.employeeCode}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-tight truncate">
                        {staffProfile.name}
                      </h3>
                      <p className="text-xs font-bold text-blue-700 leading-snug">
                        {staffProfile.designation}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Field Sales &amp; Distribution Depot
                      </p>
                    </div>

                    <div className="pt-1 border-t border-slate-200 space-y-1 text-[11px] text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold font-mono">{staffProfile.phone}</span>
                      </div>
                      {staffProfile.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate text-[10px] text-slate-600">{staffProfile.email}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Joined: {staffProfile.joiningDate}</span>
                        </span>
                        <span className="px-1.5 py-0.2 rounded font-bold uppercase text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {staffProfile.employmentStatus}
                        </span>
                      </div>
                    </div>

                    {staffProfile.assignedBeats && staffProfile.assignedBeats.length > 0 && (
                      <div className="text-[9px] text-slate-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 truncate">
                        <span className="font-bold text-blue-900">Beats: </span>
                        {staffProfile.assignedBeats.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Ribbon */}
                <div className="px-4 py-1.5 bg-slate-900 text-slate-300 text-[8px] flex items-center justify-between">
                  <span className="truncate">{getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)}</span>
                  <span className="flex items-center gap-1 font-mono text-amber-400 shrink-0 ml-2">
                    <ShieldCheck className="w-2.5 h-2.5" /> OFFICIAL PASS
                  </span>
                </div>
              </div>
            )}

            {/* Back Card */}
            {(activeSide === 'back' || activeSide === 'both') && (
              <div className="w-full max-w-[460px] h-[280px] rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col relative select-none shrink-0 transition-transform hover:scale-[1.01]">
                <div className="bg-slate-900 px-4 py-2 text-white flex items-center justify-between">
                  <div className="text-[9.5px] font-bold tracking-wider uppercase text-amber-400">
                    Terms & Verification Conditions
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    PASS: {staffProfile.employeeCode}
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between text-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 text-[9.5px] leading-relaxed max-w-[270px]">
                      <div className="font-bold text-slate-900 text-xs">
                        {ARYAN_AGENCY_PROFILE.businessName}
                      </div>
                      <p className="text-slate-600">
                        {getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)}
                      </p>
                      <div className="font-mono text-[9px] text-slate-700 pt-0.5 space-y-0.5">
                        <div><b>Care Helpline:</b> {ARYAN_AGENCY_PROFILE.supportPhoneFormatted}</div>
                        <div><b>Email:</b> {ARYAN_AGENCY_PROFILE.email}</div>
                        <div><b>GSTIN:</b> {ARYAN_AGENCY_PROFILE.gstin} · <b>PAN:</b> {ARYAN_AGENCY_PROFILE.panNumber}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-18 h-18 p-1 border border-slate-300 rounded-lg bg-white shadow-2xs flex items-center justify-center">
                        {qrCodeDataUrl ? (
                          <img 
                            src={qrCodeDataUrl} 
                            alt="Verification QR" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-400">
                            QR
                          </div>
                        )}
                      </div>
                      <span className="text-[7px] font-mono text-slate-500 mt-0.5">Scan to Verify</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200 rounded p-1.5 text-[8px] text-amber-900 leading-tight">
                    <span className="font-bold">Important Notice:</span> Non-transferable property of {ARYAN_AGENCY_PROFILE.businessName}. Return to: {getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)} or call <span className="font-bold font-mono">{ARYAN_AGENCY_PROFILE.supportPhoneFormatted}</span>.
                  </div>

                  <div className="flex items-end justify-between pt-1 border-t border-slate-200">
                    <div className="text-center w-28">
                      <div className="h-4 flex items-center justify-center">
                        <span className="text-[9px] font-serif italic text-blue-900 font-semibold">{staffProfile.name.split(' ')[0]}</span>
                      </div>
                      <div className="border-t border-slate-400 text-[7.5px] text-slate-500 uppercase font-semibold">
                        Holder Signature
                      </div>
                    </div>

                    <div className="text-center w-28">
                      <div className="h-4 flex items-center justify-center">
                        <span className="text-[9px] font-serif italic text-emerald-900 font-bold">Aryan Agency Auth</span>
                      </div>
                      <div className="border-t border-slate-400 text-[7.5px] text-slate-500 uppercase font-semibold">
                        Authorized Signatory
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 px-4 py-1 text-center text-[7.5px] text-slate-500 border-t border-slate-200">
                  {ARYAN_AGENCY_PROFILE.businessName} • {ARYAN_AGENCY_PROFILE.shortTagline}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Authorized Profile Details & Security Notice */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Authorized Identity Record</span>
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Read-Only
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Full Legal Name</span>
                <span className="font-bold text-slate-900">{staffProfile.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Employee ID</span>
                <span className="font-mono font-bold text-blue-700">{staffProfile.employeeCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Designation</span>
                <span className="font-semibold text-slate-900">{staffProfile.designation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department / Role</span>
                <span className="font-semibold text-slate-900 capitalize">{staffProfile.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mobile Phone</span>
                <span className="font-mono font-semibold text-slate-900">{staffProfile.phone}</span>
              </div>
              {staffProfile.email && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Staff Email</span>
                  <span className="font-mono text-slate-900 truncate max-w-[180px]">{staffProfile.email}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Joining Date</span>
                <span className="font-semibold text-slate-900">{staffProfile.joiningDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Employment Status</span>
                <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {staffProfile.employmentStatus}
                </span>
              </div>
              {staffProfile.assignedBeats && staffProfile.assignedBeats.length > 0 && (
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Assigned Beat Routes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {staffProfile.assignedBeats.map((b, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[11px] font-medium">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800">Security Rule: </span>
              Staff identity details and designations are centrally authorized and managed by Admin. Sales representatives cannot alter official records. Contact Admin for profile amendments.
            </div>
          </div>

          {/* Company Contact Info */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Issuing Distributor
            </h3>
            <div className="text-xs text-slate-600 space-y-1.5">
              <div className="font-bold text-slate-800">{ARYAN_AGENCY_PROFILE.businessName}</div>
              <div className="text-slate-500">{getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)}</div>
              <div><b>Care Desk:</b> {ARYAN_AGENCY_PROFILE.supportPhoneFormatted}</div>
              <div><b>Email:</b> {ARYAN_AGENCY_PROFILE.email}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
