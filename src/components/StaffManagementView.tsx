import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  IndianRupee, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Award, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  ArrowUpRight, 
  Phone, 
  Mail, 
  MapPin, 
  Route, 
  X, 
  Loader2, 
  Check, 
  RefreshCw,
  Building,
  UserPlus,
  Share2,
  Eye
} from 'lucide-react';
import { 
  StaffMember, 
  StaffAttendance, 
  StaffPayroll, 
  PayrollPaymentRecord, 
  AttendanceStatus, 
  SalaryType, 
  EmploymentStatus, 
  StaffAllowance, 
  StaffDeduction,
  Retailer,
  Salesman
} from '../types';
import { api, formatINR, formatINRDecimals } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StaffIdCardModal } from './StaffIdCardModal';
import { AryanAgencyFMCGLogo } from './AryanAgencyLogo';
import { ARYAN_AGENCY_PROFILE, getVerifiedCompanyAddress } from '../lib/businessProfile';

interface StaffManagementViewProps {
  salesmen?: Salesman[];
  retailers?: Retailer[];
  onNavigateTab?: (tab: string) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  salesmen = [],
  retailers = [],
  onNavigateTab
}) => {
  const { currentUser, isAdmin } = useAuth();

  // Active Main Tab: 'directory' | 'attendance' | 'payroll' | 'reports'
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll' | 'reports'>(isAdmin ? 'directory' : 'attendance');

  useEffect(() => {
    if (!isAdmin && (activeTab === 'directory' || activeTab === 'reports')) {
      setActiveTab('attendance');
    }
  }, [isAdmin, activeTab]);

  // Core Data States
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [attendanceList, setAttendanceList] = useState<StaffAttendance[]>([]);
  const [payrollList, setPayrollList] = useState<StaffPayroll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [beatFilter, setBeatFilter] = useState<string>('all');

  // Attendance Controls
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedStaffForCalendar, setSelectedStaffForCalendar] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Attendance Approval & Workflow States
  const [attendanceSubTab, setAttendanceSubTab] = useState<'approvals' | 'daily_sheet' | 'calendar'>('approvals');
  const [approvalStaffFilter, setApprovalStaffFilter] = useState<string>('all');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>('all');
  const [approvalDateStart, setApprovalDateStart] = useState<string>('');
  const [approvalDateEnd, setApprovalDateEnd] = useState<string>('');
  const [approvalBeatFilter, setApprovalBeatFilter] = useState<string>('all');
  const [rejectingAttendanceRecord, setRejectingAttendanceRecord] = useState<StaffAttendance | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [correctionAttendanceRecord, setCorrectionAttendanceRecord] = useState<StaffAttendance | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [viewingAuditTrailRecord, setViewingAuditTrailRecord] = useState<StaffAttendance | null>(null);

  // Payroll Controls
  const [payrollPeriod, setPayrollPeriod] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Modals
  const [idCardStaff, setIdCardStaff] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [correctingAttendance, setCorrectingAttendance] = useState<StaffAttendance | null>(null);
  const [payingPayroll, setPayingPayroll] = useState<StaffPayroll | null>(null);
  const [viewingPayslip, setViewingPayslip] = useState<StaffPayroll | null>(null);
  
  // New Action & Audit States
  const [viewingStaffDetails, setViewingStaffDetails] = useState<StaffMember | null>(null);
  const [statusChangeCandidate, setStatusChangeCandidate] = useState<{ staff: StaffMember; newStatus: 'active' | 'inactive' } | null>(null);
  const [deletingStaffCandidate, setDeletingStaffCandidate] = useState<{ staff: StaffMember; dependencyError?: string } | null>(null);
  const [isCleanupAuditModalOpen, setIsCleanupAuditModalOpen] = useState(false);
  const [auditCandidates, setAuditCandidates] = useState<{ staff: StaffMember; isLikelyTest: boolean; linkedCounts: { attendance: number; payroll: number; orders: number; tasks: number } }[]>([]);
  const [selectedCleanupIds, setSelectedCleanupIds] = useState<string[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Form state for Add/Edit Staff
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'salesman',
    designation: 'Senior Sales Executive',
    photoUrl: '',
    assignedBeats: [] as string[],
    joiningDate: new Date().toISOString().split('T')[0],
    employmentStatus: 'active' as EmploymentStatus,
    salaryType: 'monthly_fixed' as SalaryType,
    baseSalary: 22000,
    weeklyOffDay: 0, // Sunday
    monthlyLeaveQuota: 2,
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    address: '',
    initialPassword: 'Staff@Aryan2026'
  });

  // Form state for Record Payment
  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'upi' | 'cash' | 'cheque',
    referenceNumber: '',
    notes: ''
  });

  // Form state for Attendance Correction
  const [correctionFormData, setCorrectionFormData] = useState({
    newStatus: 'present' as AttendanceStatus,
    reason: ''
  });

  // Quick Daily Attendance Inputs: map of staffId -> { status, checkInTime, checkOutTime, remarks }
  const [dailyAttendanceInputs, setDailyAttendanceInputs] = useState<Record<string, {
    status: AttendanceStatus;
    checkInTime: string;
    checkOutTime: string;
    remarks: string;
  }>>({});

  // Available Beats
  const allBeats = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach(s => s.assignedBeats?.forEach(b => set.add(b)));
    retailers.forEach(r => r.beatName && set.add(r.beatName));
    return Array.from(set).sort();
  }, [staffList, retailers]);

  // Load All Staff Management Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedStaff, fetchedAttendance, fetchedPayroll] = await Promise.all([
        api.getStaffMembers(),
        api.getStaffAttendance(),
        api.getStaffPayrolls({ period: payrollPeriod })
      ]);
      setStaffList(fetchedStaff || []);
      setAttendanceList(fetchedAttendance || []);
      setPayrollList(fetchedPayroll || []);
    } catch (err: any) {
      console.error('[StaffManagement] Load failed:', err);
      setStatusMessage({ text: 'Failed to load staff records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, payrollPeriod]);

  // Sync Daily Attendance Inputs for the selected attendanceDate
  useEffect(() => {
    const inputs: Record<string, { status: AttendanceStatus; checkInTime: string; checkOutTime: string; remarks: string }> = {};
    staffList.forEach(staff => {
      const match = attendanceList.find(a => a.staffId === staff.id && a.date === attendanceDate);
      if (match) {
        inputs[staff.id] = {
          status: match.status,
          checkInTime: match.checkInTime || '',
          checkOutTime: match.checkOutTime || '',
          remarks: match.remarks || ''
        };
      } else {
        inputs[staff.id] = {
          status: 'present',
          checkInTime: '09:00',
          checkOutTime: '18:00',
          remarks: ''
        };
      }
    });
    setDailyAttendanceInputs(inputs);
  }, [staffList, attendanceList, attendanceDate]);

  // Helper to open Edit Staff Modal
  const openEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      phone: staff.phone,
      email: staff.email,
      role: staff.role,
      designation: staff.designation,
      photoUrl: staff.photoUrl || '',
      assignedBeats: staff.assignedBeats || [],
      joiningDate: staff.joiningDate,
      employmentStatus: staff.employmentStatus,
      salaryType: staff.salaryType,
      baseSalary: staff.baseSalary,
      weeklyOffDay: staff.weeklyOffDay !== undefined ? staff.weeklyOffDay : 0,
      monthlyLeaveQuota: staff.monthlyLeaveQuota || 2,
      emergencyName: staff.emergencyContact?.name || '',
      emergencyRelation: staff.emergencyContact?.relation || '',
      emergencyPhone: staff.emergencyContact?.phone || '',
      address: staff.address || '',
      initialPassword: ''
    });
    setIsAddStaffModalOpen(true);
  };

  // Helper to open Add Staff Modal
  const openAddStaff = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: 'salesman',
      designation: 'Sales Executive',
      photoUrl: '',
      assignedBeats: [],
      joiningDate: new Date().toISOString().split('T')[0],
      employmentStatus: 'active',
      salaryType: 'monthly_fixed',
      baseSalary: 22000,
      weeklyOffDay: 0,
      monthlyLeaveQuota: 2,
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      address: '',
      initialPassword: 'Staff@Aryan2026'
    });
    setIsAddStaffModalOpen(true);
  };

  // Save Staff (Add or Update)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setStatusMessage({ text: 'Name, phone, and email are required.', type: 'error' });
      return;
    }

    try {
      setActionLoading(true);
      const payload: Partial<StaffMember> & { initialPassword?: string } = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        designation: formData.designation.trim(),
        photoUrl: formData.photoUrl.trim() || undefined,
        assignedBeats: formData.assignedBeats,
        joiningDate: formData.joiningDate,
        employmentStatus: formData.employmentStatus,
        salaryType: formData.salaryType,
        baseSalary: Number(formData.baseSalary) || 0,
        weeklyOffDay: Number(formData.weeklyOffDay),
        monthlyLeaveQuota: Number(formData.monthlyLeaveQuota),
        emergencyContact: formData.emergencyName ? {
          name: formData.emergencyName,
          relation: formData.emergencyRelation,
          phone: formData.emergencyPhone
        } : undefined,
        address: formData.address.trim() || undefined
      };

      if (editingStaff) {
        await api.updateStaffMember(editingStaff.id, payload);
        setStatusMessage({ text: `Staff profile for ${formData.name} updated successfully.`, type: 'success' });
      } else {
        payload.initialPassword = formData.initialPassword;
        const res = await api.createStaffMember(payload);
        setStatusMessage({ text: res.message || `Staff member created successfully.`, type: 'success' });
      }

      setIsAddStaffModalOpen(false);
      setEditingStaff(null);
      await loadData();
    } catch (err: any) {
      console.error('[Save Staff] Error:', err);
      setStatusMessage({ text: err.message || 'Failed to save staff profile.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Save Daily Attendance Record
  const handleSaveAttendance = async (staffId: string) => {
    const input = dailyAttendanceInputs[staffId];
    if (!input) return;

    try {
      setActionLoading(true);
      const res = await api.markStaffAttendance({
        staffId,
        date: attendanceDate,
        status: input.status,
        checkInTime: input.checkInTime || undefined,
        checkOutTime: input.checkOutTime || undefined,
        remarks: input.remarks || undefined
      });
      setStatusMessage({ 
        text: `Attendance saved for ${res.attendance.staffName} (${input.status.toUpperCase()}).`, 
        type: 'success' 
      });
      await loadData();
    } catch (err: any) {
      console.error('[Mark Attendance] Error:', err);
      setStatusMessage({ text: err.message || 'Failed to record attendance.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Attendance Approval Actions
  const handleApproveAttendance = async (attendanceId: string) => {
    try {
      setActionLoading(true);
      await api.approveStaffAttendance(attendanceId);
      setStatusMessage({ text: 'Attendance record approved successfully! Marked as verified and payable.', type: 'success' });
      await loadData();
    } catch (err: any) {
      console.error('[Approve Attendance] Error:', err);
      setStatusMessage({ text: err.message || 'Failed to approve attendance.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRejectAttendance = async () => {
    if (!rejectingAttendanceRecord) return;
    if (!rejectReason.trim()) {
      setStatusMessage({ text: 'A mandatory rejection reason is required.', type: 'error' });
      return;
    }

    try {
      setActionLoading(true);
      await api.rejectStaffAttendance(rejectingAttendanceRecord.id, rejectReason.trim());
      setStatusMessage({ text: 'Attendance rejected. Excluded from payable payroll days.', type: 'success' });
      setRejectingAttendanceRecord(null);
      setRejectReason('');
      await loadData();
    } catch (err: any) {
      console.error('[Reject Attendance] Error:', err);
      setStatusMessage({ text: err.message || 'Failed to reject attendance.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRequestCorrection = async () => {
    if (!correctionAttendanceRecord) return;
    if (!correctionReason.trim()) {
      setStatusMessage({ text: 'A reason or directive is required to request attendance correction.', type: 'error' });
      return;
    }

    try {
      setActionLoading(true);
      await api.requestCorrectionStaffAttendance(correctionAttendanceRecord.id, correctionReason.trim());
      setStatusMessage({ text: 'Correction requested for attendance record. Status updated.', type: 'success' });
      setCorrectionAttendanceRecord(null);
      setCorrectionReason('');
      await loadData();
    } catch (err: any) {
      console.error('[Correction Request] Error:', err);
      setStatusMessage({ text: err.message || 'Failed to request correction.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Mark All as Present
  const handleBulkMarkPresent = async () => {
    try {
      setActionLoading(true);
      const activeStaff = staffList.filter(s => s.employmentStatus === 'active');
      for (const s of activeStaff) {
        await api.markStaffAttendance({
          staffId: s.id,
          date: attendanceDate,
          status: 'present',
          checkInTime: '09:00',
          checkOutTime: '18:30',
          remarks: 'Bulk marked Present by Admin'
        });
      }
      setStatusMessage({ text: `Marked Present for all ${activeStaff.length} active staff on ${attendanceDate}.`, type: 'success' });
      await loadData();
    } catch (err: any) {
      console.error('[Bulk Attendance] Error:', err);
      setStatusMessage({ text: 'Failed to complete bulk attendance marking.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Authorized Attendance Correction
  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingAttendance) return;
    if (!correctionFormData.reason.trim()) {
      setStatusMessage({ text: 'Correction reason is strictly required for audit history.', type: 'error' });
      return;
    }

    try {
      setActionLoading(true);
      await api.correctStaffAttendance(
        correctingAttendance.id, 
        correctionFormData.newStatus, 
        correctionFormData.reason.trim()
      );
      setStatusMessage({ text: `Attendance corrected to ${correctionFormData.newStatus.toUpperCase()} with audit reason.`, type: 'success' });
      setCorrectingAttendance(null);
      await loadData();
    } catch (err: any) {
      console.error('[Correction Error]:', err);
      setStatusMessage({ text: err.message || 'Failed to submit correction.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate Monthly Payroll
  const handleCalculatePayroll = async () => {
    try {
      setActionLoading(true);
      const res = await api.calculateStaffPayroll({
        staffId: 'all',
        period: payrollPeriod
      });
      setStatusMessage({ 
        text: `Successfully calculated monthly payroll for period ${payrollPeriod} (${res.count || payrollList.length} employees).`, 
        type: 'success' 
      });
      await loadData();
    } catch (err: any) {
      console.error('[Calculate Payroll] Error:', err);
      setStatusMessage({ text: err.message || 'Failed to calculate payroll.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Monthly Payroll
  const handleApprovePayroll = async (payrollId: string) => {
    try {
      setActionLoading(true);
      await api.approveStaffPayroll(payrollId);
      setStatusMessage({ text: 'Payroll successfully approved and locked for disbursement.', type: 'success' });
      await loadData();
    } catch (err: any) {
      console.error('[Approve Payroll] Error:', err);
      setStatusMessage({ text: err.message || 'Failed to approve payroll.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Record Salary Payment Submit
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayroll) return;
    if (paymentFormData.amount <= 0) {
      setStatusMessage({ text: 'Payment amount must be greater than zero.', type: 'error' });
      return;
    }

    try {
      setActionLoading(true);
      await api.recordStaffSalaryPayment(payingPayroll.id, {
        staffId: payingPayroll.staffId,
        period: payingPayroll.period,
        amount: Number(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod,
        referenceNumber: paymentFormData.referenceNumber,
        notes: paymentFormData.notes
      });
      setStatusMessage({ 
        text: `Recorded ₹${paymentFormData.amount} payment for ${payingPayroll.staffName} (${paymentFormData.paymentMethod.toUpperCase()}).`, 
        type: 'success' 
      });
      setPayingPayroll(null);
      await loadData();
    } catch (err: any) {
      console.error('[Payment Error]:', err);
      setStatusMessage({ text: err.message || 'Failed to record payment.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Export Attendance CSV
  const handleExportAttendanceCSV = () => {
    if (attendanceList.length === 0) {
      setStatusMessage({ text: 'No attendance records available to export for this month.', type: 'error' });
      return;
    }

    const headers = ['Date', 'Employee Code', 'Staff Name', 'Role', 'Status', 'Check In', 'Check Out', 'Working Hours', 'Method', 'Remarks'];
    const rows = attendanceList.map(a => [
      a.date,
      a.employeeCode,
      `"${a.staffName.replace(/"/g, '""')}"`,
      a.role,
      a.status,
      a.checkInTime || '',
      a.checkOutTime || '',
      a.workingHours || '',
      a.checkInMethod || '',
      `"${(a.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Staff_Attendance_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // Staff Active/Inactive & Safe Delete Handlers
  // ==========================================
  const handlePromptStatusChange = (staff: StaffMember, newStatus: 'active' | 'inactive') => {
    if (staff.role === 'admin' && newStatus === 'inactive') {
      alert('Administrator accounts cannot be deactivated.');
      return;
    }
    setStatusChangeCandidate({ staff, newStatus });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChangeCandidate) return;
    const { staff, newStatus } = statusChangeCandidate;
    try {
      setActionLoading(true);
      await api.updateStaffStatus(staff.id, newStatus);
      setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, employmentStatus: newStatus } : s));
      setStatusChangeCandidate(null);
      setStatusMessage({ 
        text: `Staff member "${staff.name}" marked ${newStatus.toUpperCase()}. Historical attendance, payroll, and order records are preserved.`, 
        type: 'success' 
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update employment status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromptDeleteStaff = (staff: StaffMember) => {
    if (staff.role === 'admin') {
      alert('Administrator accounts cannot be deleted.');
      return;
    }
    // Check if staff has attendance or payroll or sales history
    const hasAtt = attendanceList.some(a => a.staffId === staff.id);
    const hasPay = payrollList.some(p => p.staffId === staff.id);
    const reasons: string[] = [];
    if (hasAtt) reasons.push('attendance history');
    if (hasPay) reasons.push('payroll records');
    if (reasons.length > 0) {
      setDeletingStaffCandidate({ 
        staff, 
        dependencyError: `Staff member "${staff.name}" has linked ${reasons.join(' and ')}. Permanent deletion would break historical audit records. Please mark the staff member as Inactive instead.` 
      });
    } else {
      setDeletingStaffCandidate({ staff });
    }
  };

  const handleConfirmDeleteStaff = async (force = false) => {
    if (!deletingStaffCandidate) return;
    const staff = deletingStaffCandidate.staff;
    try {
      setActionLoading(true);
      await api.deleteStaffMember(staff.id, force);
      setStaffList(prev => prev.filter(s => s.id !== staff.id));
      setDeletingStaffCandidate(null);
      setStatusMessage({ text: `Staff record "${staff.name}" removed safely.`, type: 'success' });
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectShareIdCard = async (staff: StaffMember) => {
    const verifyUrl = `https://${ARYAN_AGENCY_PROFILE.officialDomain}/verify/staff/${staff.employeeCode}`;
    const shareText = `Official Employee Pass: ${staff.name} (${staff.employeeCode}), ${staff.designation} at ${ARYAN_AGENCY_PROFILE.businessName}. Company Helpline: ${ARYAN_AGENCY_PROFILE.supportPhoneFormatted}.`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${ARYAN_AGENCY_PROFILE.businessName} Staff ID - ${staff.name}`,
          text: shareText,
          url: verifyUrl
        });
        setStatusMessage({ text: 'Staff ID card shared successfully.', type: 'success' });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}\nVerification: ${verifyUrl}`);
      setStatusMessage({ text: 'Staff ID pass details & verification link copied to clipboard.', type: 'success' });
    } else {
      alert(`Staff ID Pass:\n${shareText}\n${verifyUrl}`);
    }
  };

  // ==========================================
  // Test Data Cleanup & Audit Handlers
  // ==========================================
  const openCleanupAuditModal = async () => {
    try {
      setLoadingAudit(true);
      setIsCleanupAuditModalOpen(true);
      const res = await api.getStaffAuditTestCandidates();
      const candidates = res?.candidates || [];
      setAuditCandidates(candidates);
      // Pre-select only candidates marked as isLikelyTest
      const likelyTestIds = candidates
        .filter(c => c.isLikelyTest)
        .map(c => c.staff.id);
      setSelectedCleanupIds(likelyTestIds);
    } catch (err: any) {
      console.error('Failed to audit staff candidates:', err);
      alert('Failed to load candidate audit list.');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleExecuteStaffCleanup = async () => {
    if (selectedCleanupIds.length === 0) return;
    try {
      setActionLoading(true);
      for (const id of selectedCleanupIds) {
        await api.deleteStaffMember(id, true);
      }
      setStaffList(prev => prev.filter(s => !selectedCleanupIds.includes(s.id)));
      setIsCleanupAuditModalOpen(false);
      setSelectedCleanupIds([]);
      setStatusMessage({ 
        text: `Successfully cleaned selected test records. Genuine staff members, real logins, and business history preserved.`, 
        type: 'success' 
      });
    } catch (err: any) {
      alert(err.message || 'Failed to remove selected test records.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Staff for Directory
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        s.name.toLowerCase().includes(q) || 
        s.employeeCode.toLowerCase().includes(q) || 
        s.phone.includes(q) || 
        s.email.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || s.employmentStatus === statusFilter;
      const matchesBeat = beatFilter === 'all' || s.assignedBeats?.includes(beatFilter);

      return matchesSearch && matchesRole && matchesStatus && matchesBeat;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter, beatFilter]);

  // Attendance Stats for Today
  const todayAttendanceStats = useMemo(() => {
    const today = attendanceDate;
    const records = attendanceList.filter(a => a.date === today);
    const present = records.filter(a => a.status === 'present').length;
    const halfDay = records.filter(a => a.status === 'half_day').length;
    const absent = records.filter(a => a.status === 'absent').length;
    const onLeave = records.filter(a => a.status === 'paid_leave' || a.status === 'unpaid_leave').length;
    const weeklyOff = records.filter(a => a.status === 'weekly_off').length;
    const totalStaff = staffList.length;
    const markedCount = records.length;
    const notMarked = Math.max(0, totalStaff - markedCount);

    return { present, halfDay, absent, onLeave, weeklyOff, notMarked, markedCount, totalStaff };
  }, [attendanceList, attendanceDate, staffList]);

  // Payroll Totals for Selected Period
  const payrollStats = useMemo(() => {
    const totalNet = payrollList.reduce((sum, p) => sum + p.netPayable, 0);
    const totalPaid = payrollList.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalDue = Math.max(0, totalNet - totalPaid);
    const approvedCount = payrollList.filter(p => p.status === 'approved' || p.status === 'paid').length;
    return { totalNet, totalPaid, totalDue, approvedCount, totalCount: payrollList.length };
  }, [payrollList]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & ACTION BAR                                                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                Staff & Workforce Administration
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                Aryan Agency / Apna Store
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 flex items-center gap-2">
              Staff Management, Attendance & Payroll
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Authorized employee registry, biometric-grade attendance logs, salary calculation & digital photo ID cards
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={openCleanupAuditModal}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                  title="Audit and Safely Remove Test / Dummy Staff"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Test Data Cleanup</span>
                </button>

                <button
                  type="button"
                  onClick={openAddStaff}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Staff Member</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            <span className="flex items-center gap-2">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {statusMessage.text}
            </span>
            <button 
              type="button" 
              onClick={() => setStatusMessage(null)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards: Admin sees whole workforce; Non-admin sees only their own profile & dues */}
        {isAdmin ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            {/* Card 1: Total Staff */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Authorized Staff</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {staffList.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-emerald-700 font-semibold">{staffList.filter(s => s.employmentStatus === 'active').length} Active</span>
                <span>•</span>
                <span className="text-amber-700 font-semibold">{staffList.filter(s => s.employmentStatus === 'on_leave').length} On Leave</span>
              </div>
            </div>

            {/* Card 2: Today's Attendance */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Today's Attendance</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                {todayAttendanceStats.present + (todayAttendanceStats.halfDay ? todayAttendanceStats.halfDay * 0.5 : 0)} / {todayAttendanceStats.totalStaff}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="text-emerald-700 font-medium">{todayAttendanceStats.present} Present</span>
                <span>•</span>
                <span className="text-rose-700 font-medium">{todayAttendanceStats.absent} Absent</span>
                {todayAttendanceStats.notMarked > 0 && (
                  <span className="text-amber-700 font-bold">({todayAttendanceStats.notMarked} Unmarked)</span>
                )}
              </div>
            </div>

            {/* Card 3: Monthly Net Payroll */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Payroll Liability ({payrollPeriod})</span>
                <IndianRupee className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {formatINR(payrollStats.totalNet)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>{payrollStats.totalCount} Calculated</span>
                <span className="font-semibold text-indigo-700">{payrollStats.approvedCount} Approved</span>
              </div>
            </div>

            {/* Card 4: Disbursed vs Pending */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Disbursed vs Due</span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-700">
                {formatINR(payrollStats.totalPaid)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Pending Due:</span>
                <span className="font-bold text-rose-700">{formatINR(payrollStats.totalDue)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">My Profile</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-base font-black text-slate-900 truncate">
                {staffList[0]?.name || currentUser?.name || 'Sales Executive'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                {staffList[0]?.employeeCode || 'DSR'} • {staffList[0]?.phone || currentUser?.phone || ''}
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">Today's Punch Status</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-base font-black text-slate-900 capitalize">
                {attendanceList.find(a => a.date === attendanceDate)?.status?.replace('_', ' ') || 'Not Checked In'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {attendanceList.find(a => a.date === attendanceDate)?.checkInTime 
                  ? `Punch In: ${attendanceList.find(a => a.date === attendanceDate)?.checkInTime}` 
                  : 'Punch in your attendance below'}
              </div>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-medium">My Salary ({payrollPeriod})</span>
                <IndianRupee className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-black text-slate-900">
                {formatINR(payrollStats.totalNet)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Disbursed: <strong className="text-emerald-700">{formatINR(payrollStats.totalPaid)}</strong></span>
                {payrollStats.totalDue > 0 && <span className="text-rose-700 font-bold">Due: {formatINR(payrollStats.totalDue)}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Tab Buttons Navigation */}
        <div className="flex border-b border-slate-200 mt-6 -mb-5 sm:-mb-6 overflow-x-auto space-x-6 text-xs sm:text-sm font-bold">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'directory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="w-4 h-4" />
              <span>Staff Directory ({staffList.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Calendar className="w-4 h-4" />
            <span>{isAdmin ? 'Attendance & Approvals' : 'My Attendance & Check-In'}</span>
            {isAdmin && attendanceList.filter(a => a.approvalStatus === 'pending' || (a.checkInMethod === 'self_check_in' && !a.approvalStatus)).length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white animate-pulse">
                {attendanceList.filter(a => a.approvalStatus === 'pending' || (a.checkInMethod === 'self_check_in' && !a.approvalStatus)).length} pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'payroll' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <IndianRupee className="w-4 h-4" />
            <span>{isAdmin ? 'Salary & Monthly Payroll' : 'My Salary & Payslips'}</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'reports' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <FileText className="w-4 h-4" />
              <span>Workforce Reports & Audit</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF DIRECTORY & PROFILES                                         */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === 'directory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, employee code, mobile, email, designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Roles</option>
                <option value="salesman">Salesman (DSR)</option>
                <option value="delivery">Delivery Pilot</option>
                <option value="accounts">Accounts & Finance</option>
                <option value="admin">Administrator</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Beat Filter */}
              {allBeats.length > 0 && (
                <select
                  value={beatFilter}
                  onChange={(e) => setBeatFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">All Beats</option>
                  {allBeats.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Staff Table */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading staff profiles...</span>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-16 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No staff members found</h3>
              <p className="text-xs text-slate-400 mt-1">Try modifying your search or filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Staff Member</th>
                    <th className="p-3.5">Role & Designation</th>
                    <th className="p-3.5">Contact & Beat</th>
                    <th className="p-3.5">Salary Structure</th>
                    <th className="p-3.5">Employment</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Photo & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200 shadow-2xs">
                            {staff.photoUrl ? (
                              <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 bg-slate-100">
                                {staff.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 leading-snug">
                              {staff.name}
                            </div>
                            <div className="font-mono text-[10px] text-blue-700 font-semibold">
                              {staff.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Designation */}
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{staff.designation}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-mono font-medium">{staff.role}</div>
                      </td>

                      {/* Contact & Beat */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-mono text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{staff.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {staff.email}
                        </div>
                        {staff.assignedBeats && staff.assignedBeats.length > 0 && (
                          <div className="text-[10px] text-blue-700 font-medium truncate max-w-[180px]">
                            Beat: {staff.assignedBeats[0]}
                          </div>
                        )}
                      </td>

                      {/* Salary Structure */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">
                          {formatINR(staff.baseSalary)}
                          <span className="text-[10px] text-slate-400 font-normal">
                            {staff.salaryType === 'monthly_fixed' ? '/mo' : staff.salaryType === 'daily_wage' ? '/day' : '/att'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 inline-block mt-0.5">
                          {staff.salaryType === 'monthly_fixed' ? 'Monthly Fixed' : staff.salaryType === 'daily_wage' ? 'Daily Wage' : 'Attendance Based'}
                        </span>
                      </td>

                      {/* Employment Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          staff.employmentStatus === 'active' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : staff.employmentStatus === 'on_leave' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {staff.employmentStatus.replace('_', ' ')}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Joined {staff.joiningDate}
                        </div>
                      </td>

                      {/* Actions Menu */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end flex-wrap gap-1">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewingStaffDetails(staff)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Staff Profile Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Generate / Download ID Card */}
                          <button
                            type="button"
                            onClick={() => setIdCardStaff(staff)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Generate & Download Print-Ready ID Card"
                          >
                            <Award className="w-3 h-3" />
                            <span>ID Card</span>
                          </button>

                          {/* Share ID Card */}
                          <button
                            type="button"
                            onClick={() => handleDirectShareIdCard(staff)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Share Official Employee ID Pass"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <>
                              {/* Edit Details */}
                              <button
                                type="button"
                                onClick={() => openEditStaff(staff)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Staff & Salary Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Mark Active / Mark Inactive */}
                              {staff.employmentStatus === 'active' ? (
                                <button
                                  type="button"
                                  onClick={() => handlePromptStatusChange(staff, 'inactive')}
                                  disabled={staff.role === 'admin'}
                                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-40"
                                  title="Mark Inactive (Preserves all historical records)"
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handlePromptStatusChange(staff, 'active')}
                                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Mark Active"
                                >
                                  Activate
                                </button>
                              )}

                              {/* Delete Staff Member (with dependency & safety checks) */}
                              <button
                                type="button"
                                onClick={() => handlePromptDeleteStaff(staff)}
                                disabled={staff.role === 'admin'}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                                title="Delete Staff Member (Dependency Checked)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ATTENDANCE TRACKER & MONTHLY CALENDAR                              */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          
          {/* Daily Attendance Marking Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isAdmin ? 'Daily Workforce Attendance Sheet' : 'My Daily Attendance & Check-In'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAdmin 
                    ? 'Mark daily Present, Absent, Half Day, Paid Leave, Unpaid Leave or Weekly Off' 
                    : 'Record your daily punch in / punch out, field visits, or leave request'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="font-semibold text-slate-600">Date:</span>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleBulkMarkPresent}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark All Present Today</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportAttendanceCSV}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Daily Marking Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Attendance Status</th>
                    <th className="p-3.5">Check In / Out</th>
                    <th className="p-3.5">Remarks / Reason</th>
                    <th className="p-3.5 text-right">Save Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.filter(s => s.employmentStatus !== 'inactive').map((staff) => {
                    const input = dailyAttendanceInputs[staff.id] || {
                      status: 'present',
                      checkInTime: '09:00',
                      checkOutTime: '18:00',
                      remarks: ''
                    };
                    const existingRecord = attendanceList.find(a => a.staffId === staff.id && a.date === attendanceDate);

                    return (
                      <tr key={staff.id} className="hover:bg-slate-50/60">
                        {/* Employee */}
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{staff.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {staff.employeeCode} • {staff.designation}
                          </div>
                        </td>

                        {/* Status Radio / Select */}
                        <td className="p-3.5">
                          <select
                            value={input.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as AttendanceStatus;
                              setDailyAttendanceInputs(prev => ({
                                ...prev,
                                [staff.id]: { ...prev[staff.id], status: newStatus }
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-1 focus:ring-blue-600 ${
                              input.status === 'present' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                                : input.status === 'half_day' 
                                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                : input.status === 'paid_leave' 
                                ? 'bg-blue-50 text-blue-800 border-blue-300' 
                                : input.status === 'weekly_off' 
                                ? 'bg-slate-100 text-slate-700 border-slate-300' 
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            <option value="present">Present (Full Day)</option>
                            <option value="half_day">Half Day (0.5)</option>
                            <option value="paid_leave">Paid Leave (Approved)</option>
                            <option value="unpaid_leave">Unpaid Leave</option>
                            <option value="weekly_off">Weekly Off (Sunday)</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>

                        {/* Check In / Out Time */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="time"
                              value={input.checkInTime}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDailyAttendanceInputs(prev => ({
                                  ...prev,
                                  [staff.id]: { ...prev[staff.id], checkInTime: v }
                                }));
                              }}
                              className="px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                            />
                            <span className="text-slate-400">to</span>
                            <input
                              type="time"
                              value={input.checkOutTime}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDailyAttendanceInputs(prev => ({
                                  ...prev,
                                  [staff.id]: { ...prev[staff.id], checkOutTime: v }
                                }));
                              }}
                              className="px-2 py-1 text-xs border border-slate-200 rounded font-mono bg-white"
                            />
                          </div>
                        </td>

                        {/* Remarks */}
                        <td className="p-3.5">
                          <input
                            type="text"
                            placeholder="Optional notes / site..."
                            value={input.remarks}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDailyAttendanceInputs(prev => ({
                                ...prev,
                                [staff.id]: { ...prev[staff.id], remarks: v }
                              }));
                            }}
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white"
                          />
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {existingRecord?.correctionHistory && existingRecord.correctionHistory.length > 0 && (
                              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {existingRecord.correctionHistory.length} edits
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSaveAttendance(staff.id)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Attendance Calendar & History View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Monthly Attendance Calendar & Audited Logs
                </h3>
                <p className="text-xs text-slate-500">
                  View full monthly day-by-day attendance grid and perform authorized corrections
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-mono font-bold text-slate-800"
                />

                {isAdmin ? (
                  <select
                    value={selectedStaffForCalendar}
                    onChange={(e) => setSelectedStaffForCalendar(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-medium text-slate-700"
                  >
                    <option value="all">All Staff Members</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.employeeCode})</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700">
                    {staffList[0]?.name || currentUser?.name}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Records Log */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Timing</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Remarks / Correction History</th>
                    <th className="p-3 text-right">Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceList
                    .filter(a => selectedStaffForCalendar === 'all' || a.staffId === selectedStaffForCalendar)
                    .slice(0, 30)
                    .map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-mono font-bold text-slate-800">{record.date}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{record.staffName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{record.employeeCode}</div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            record.status === 'present' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            record.status === 'half_day' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            record.status === 'paid_leave' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            record.status === 'weekly_off' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                            'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {record.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {record.checkInTime || '-'} {record.checkOutTime ? `→ ${record.checkOutTime}` : ''}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {record.checkInMethod === 'self_check_in' ? 'Salesman App' : 'Admin'}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>{record.remarks || '-'}</div>
                          {record.correctionHistory && record.correctionHistory.length > 0 && (
                            <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
                              Last modified by {record.correctionHistory[record.correctionHistory.length - 1].correctedBy}: "{record.correctionHistory[record.correctionHistory.length - 1].reason}"
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setCorrectingAttendance(record);
                                setCorrectionFormData({
                                  newStatus: record.status,
                                  reason: ''
                                });
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Correct
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SALARY & MONTHLY PAYROLL                                           */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          
          {/* Payroll Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isAdmin ? 'Monthly Staff Salary & Payroll Calculation' : 'My Monthly Salary & Payslips'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAdmin 
                  ? 'Calculate payable wages from verified attendance, approve payroll, and record disbursement vouchers'
                  : 'View your earned salary, attendance calculation, allowances, and download payslips'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-600">Period:</span>
                <input
                  type="month"
                  value={payrollPeriod}
                  onChange={(e) => setPayrollPeriod(e.target.value)}
                  className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleCalculatePayroll}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span>Calculate Payroll for All Active</span>
                </button>
              )}
            </div>
          </div>

          {/* Payroll Table */}
          {payrollList.length === 0 ? (
            <div className="py-16 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
              <IndianRupee className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No payroll generated for {payrollPeriod}</h3>
              <p className="text-xs text-slate-400 mt-1">Click "Calculate Payroll for All Active" to compute salary based on attendance records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Staff & Employee ID</th>
                    <th className="p-3.5">Type & Base Salary</th>
                    <th className="p-3.5">Attendance & Payable Days</th>
                    <th className="p-3.5">Allowances / Deductions</th>
                    <th className="p-3.5">Net Payable</th>
                    <th className="p-3.5">Paid vs Due</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payrollList.map((pr) => (
                    <tr key={pr.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Code */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{pr.staffName}</div>
                        <div className="text-[10px] text-blue-700 font-mono font-semibold">
                          {pr.employeeCode} • {pr.role}
                        </div>
                      </td>

                      {/* Base Salary & Type */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{formatINR(pr.baseSalary)}</div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {pr.salaryType === 'monthly_fixed' ? 'Monthly Fixed' : pr.salaryType === 'daily_wage' ? 'Daily Wage' : 'Attendance Based'}
                        </span>
                      </td>

                      {/* Attendance & Days */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-bold text-slate-800">
                          {pr.payableDays} / {pr.totalDaysInMonth} days payable
                        </div>
                        <div className="text-[10px] text-slate-500">
                          P: {pr.presentDays} • WO: {pr.weeklyOffs} • Leave: {pr.paidLeaves} • HD: {pr.halfDays}
                        </div>
                      </td>

                      {/* Allowances & Deductions */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="text-emerald-700 font-semibold">
                          +{formatINR(pr.allowancesTotal)} Allowances
                        </div>
                        <div className="text-rose-700 font-semibold">
                          -{formatINR(pr.deductionsTotal + pr.advancesDeducted)} Deductions
                        </div>
                      </td>

                      {/* Net Payable */}
                      <td className="p-3.5">
                        <div className="font-black text-slate-900 text-sm">
                          {formatINR(pr.netPayable)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Gross: {formatINR(pr.grossCalculated)}
                        </div>
                      </td>

                      {/* Paid vs Due */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="text-emerald-700 font-bold">
                          Paid: {formatINR(pr.amountPaid)}
                        </div>
                        {pr.remainingDue > 0 ? (
                          <div className="text-rose-700 font-bold">
                            Due: {formatINR(pr.remainingDue)}
                          </div>
                        ) : (
                          <div className="text-emerald-700 text-[10px] font-semibold">
                            Fully Cleared
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          pr.status === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          pr.status === 'partially_paid' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          pr.status === 'approved' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                          'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {pr.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Payslip View Action */}
                          <button
                            type="button"
                            onClick={() => setViewingPayslip(pr)}
                            className="px-2 py-1 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded font-bold text-[11px] transition-colors cursor-pointer"
                            title="View / Print Payslip"
                          >
                            Payslip
                          </button>

                          {isAdmin && pr.status === 'calculated' && (
                            <button
                              type="button"
                              onClick={() => handleApprovePayroll(pr.id)}
                              disabled={actionLoading}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}

                          {isAdmin && pr.remainingDue > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingPayroll(pr);
                                setPaymentFormData({
                                  amount: pr.remainingDue,
                                  paymentMethod: 'bank_transfer',
                                  referenceNumber: '',
                                  notes: `Salary disbursement for ${pr.period}`
                                });
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WORKFORCE REPORTS & AUDIT TRAIL                                     */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card A: Monthly Attendance Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Monthly Attendance Compliance</span>
            </h3>
            <p className="text-xs text-slate-500">
              Overview of attendance regularity for {selectedMonth}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Recorded Sessions</span>
                <span className="font-bold font-mono text-slate-900">{attendanceList.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Present Rate</span>
                <span className="font-bold text-emerald-700">
                  {attendanceList.length > 0 ? `${Math.round((attendanceList.filter(a => a.status === 'present').length / attendanceList.length) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Half-Day Instances</span>
                <span className="font-bold text-amber-700 font-mono">
                  {attendanceList.filter(a => a.status === 'half_day').length}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Approved Paid Leaves</span>
                <span className="font-bold text-blue-700 font-mono">
                  {attendanceList.filter(a => a.status === 'paid_leave').length}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Unpaid Absences</span>
                <span className="font-bold text-rose-700 font-mono">
                  {attendanceList.filter(a => a.status === 'absent' || a.status === 'unpaid_leave').length}
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Payroll Disbursement Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Payroll Disbursement Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500">
              Financial reconciliation for period {payrollPeriod}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Gross Payroll Amount</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatINR(payrollList.reduce((sum, p) => sum + p.grossCalculated, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Allowances</span>
                <span className="font-bold text-emerald-700 font-mono">
                  +{formatINR(payrollList.reduce((sum, p) => sum + p.allowancesTotal, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Deductions & Advances</span>
                <span className="font-bold text-rose-700 font-mono">
                  -{formatINR(payrollList.reduce((sum, p) => sum + p.deductionsTotal + p.advancesDeducted, 0))}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2 font-bold">
                <span className="text-slate-900">Total Net Payable</span>
                <span className="font-black text-slate-900 font-mono text-sm">
                  {formatINR(payrollStats.totalNet)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Disbursed (Paid Out)</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {formatINR(payrollStats.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Outstanding Balance</span>
                <span className="font-bold text-rose-700 font-mono">
                  {formatINR(payrollStats.totalDue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD OR EDIT STAFF MEMBER                                         */}
      {/* ========================================================================= */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingStaff ? `Edit Staff: ${editingStaff.name}` : 'Add Authorized Staff Member'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingStaff ? `Employee ID: ${editingStaff.employeeCode}` : 'Creates authoritative staff profile with login credentials'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
              
              {/* Row 1: Full Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Verma"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const r = e.target.value;
                      let des = formData.designation;
                      if (r === 'salesman') des = 'Senior Sales Executive';
                      if (r === 'delivery') des = 'Lead Delivery Pilot';
                      if (r === 'accounts') des = 'Accounts & Finance Officer';
                      if (r === 'admin') des = 'Operations Administrator';
                      setFormData(prev => ({ ...prev, role: r, designation: des }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="salesman">Salesman (DSR / Field Sales)</option>
                    <option value="delivery">Delivery Dispatch Pilot</option>
                    <option value="accounts">Accounts & Billing</option>
                    <option value="admin">Distributor Administrator</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Designation & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Sales Officer"
                    value={formData.designation}
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh.sales@aryanagency.in"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Row 3: Salary Scheme & Rate */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                  <span>Salary & Payroll Configuration</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Salary Type</label>
                    <select
                      value={formData.salaryType}
                      onChange={(e) => setFormData(prev => ({ ...prev, salaryType: e.target.value as SalaryType }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="monthly_fixed">Monthly Fixed Salary</option>
                      <option value="daily_wage">Daily Wage</option>
                      <option value="attendance_based">Attendance-Based</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      {formData.salaryType === 'monthly_fixed' ? 'Monthly Salary (₹)' : 'Daily Rate (₹)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.baseSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Monthly Paid Leave Quota</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={formData.monthlyLeaveQuota}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthlyLeaveQuota: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Status & Joining Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Employment Status</label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData(prev => ({ ...prev, employmentStatus: e.target.value as EmploymentStatus }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="active">Active Employee</option>
                    <option value="on_leave">On Approved Leave</option>
                    <option value="inactive">Inactive / Resigned</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weekly Off Day</label>
                  <select
                    value={formData.weeklyOffDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, weeklyOffDay: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-600"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Profile Photo URL */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profile Photograph URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or uploaded photo link"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sunita Verma"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    placeholder="Spouse / Father / Brother"
                    value={formData.emergencyRelation}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyRelation: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 99999 88888"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Initial Password (only for new accounts) */}
              {!editingStaff && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Login Password</label>
                  <input
                    type="text"
                    value={formData.initialPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, initialPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Staff member can change password upon initial login.</p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingStaff ? 'Update Profile' : 'Save Staff Profile'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIGITAL STAFF ID CARD MODAL                                      */}
      {/* ========================================================================= */}
      {idCardStaff && (
        <StaffIdCardModal
          staff={idCardStaff}
          isOpen={!!idCardStaff}
          onClose={() => setIdCardStaff(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ATTENDANCE CORRECTION MODAL                                      */}
      {/* ========================================================================= */}
      {correctingAttendance && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Authorize Attendance Correction</h3>
                <p className="text-xs text-slate-500">{correctingAttendance.staffName} on {correctingAttendance.date}</p>
              </div>
              <button 
                type="button"
                onClick={() => setCorrectingAttendance(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCorrectionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Status</label>
                <div className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold uppercase text-slate-700 font-mono">
                  {correctingAttendance.status}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Corrected Status *</label>
                <select
                  value={correctionFormData.newStatus}
                  onChange={(e) => setCorrectionFormData(prev => ({ ...prev, newStatus: e.target.value as AttendanceStatus }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-bold"
                >
                  <option value="present">Present (Full Day)</option>
                  <option value="half_day">Half Day (0.5)</option>
                  <option value="paid_leave">Approved Paid Leave</option>
                  <option value="unpaid_leave">Unpaid Leave</option>
                  <option value="weekly_off">Weekly Off</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correction Reason / Authorization *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this correction is authorized (e.g. GPS punch misfire, verified retail visits, emergency client dispatch)..."
                  value={correctionFormData.reason}
                  onChange={(e) => setCorrectionFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCorrectingAttendance(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: RECORD SALARY PAYMENT DISBURSEMENT                                */}
      {/* ========================================================================= */}
      {payingPayroll && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Salary Payment</h3>
                <p className="text-xs text-slate-500">{payingPayroll.staffName} ({payingPayroll.period})</p>
              </div>
              <button 
                type="button"
                onClick={() => setPayingPayroll(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600">Outstanding Due:</span>
                <span className="font-black text-rose-700 font-mono text-sm">{formatINR(payingPayroll.remainingDue)}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={payingPayroll.remainingDue}
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
                  <option value="upi">UPI Settlement</option>
                  <option value="cash">Cash Voucher</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UTR / Reference / Cheque Number</label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789 or UPI-REF-9988"
                  value={paymentFormData.referenceNumber}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Voucher Notes</label>
                <input
                  type="text"
                  placeholder="Optional payment notes..."
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingPayroll(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PRINTABLE SALARY PAYSLIP MODAL                                   */}
      {/* ========================================================================= */}
      {viewingPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Official Monthly Salary Statement</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setViewingPayslip(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Payslip Canvas */}
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/40 space-y-4 text-xs">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 uppercase">{ARYAN_AGENCY_PROFILE.businessName}</h4>
                  <p className="text-[11px] text-slate-500">{ARYAN_AGENCY_PROFILE.businessType}</p>
                  <p className="text-[10px] text-slate-400">{getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)} • GSTIN: {ARYAN_AGENCY_PROFILE.gstin}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 text-slate-800">
                    PAYSLIP {viewingPayslip.period}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              {/* Employee Summary Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block">Employee Name</span>
                  <span className="font-bold text-slate-900 text-xs">{viewingPayslip.staffName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Employee Code / ID</span>
                  <span className="font-mono font-bold text-blue-700 text-xs">{viewingPayslip.employeeCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Designation / Role</span>
                  <span className="font-semibold text-slate-800">{viewingPayslip.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Payable Attendance Days</span>
                  <span className="font-bold text-slate-900">{viewingPayslip.payableDays} / {viewingPayslip.totalDaysInMonth} Days</span>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="font-bold text-emerald-800 border-b border-slate-100 pb-1">Earnings (Credits)</div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Salary Earned</span>
                    <span className="font-mono font-bold">{formatINR(viewingPayslip.grossCalculated)}</span>
                  </div>
                  {viewingPayslip.allowanceBreakdown?.map(a => (
                    <div key={a.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-500">{a.title}</span>
                      <span className="font-mono font-semibold">+{formatINR(a.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold border-t border-slate-100 pt-1 text-emerald-700">
                    <span>Total Earnings</span>
                    <span className="font-mono">{formatINR(viewingPayslip.grossCalculated + viewingPayslip.allowancesTotal)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <div className="font-bold text-rose-800 border-b border-slate-100 pb-1">Deductions (Debits)</div>
                  {viewingPayslip.deductionBreakdown?.map(d => (
                    <div key={d.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-500">{d.title}</span>
                      <span className="font-mono font-semibold">-{formatINR(d.amount)}</span>
                    </div>
                  ))}
                  {viewingPayslip.advancesDeducted > 0 && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Advance Recovered</span>
                      <span className="font-mono font-semibold">-{formatINR(viewingPayslip.advancesDeducted)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-slate-100 pt-1 text-rose-700">
                    <span>Total Deductions</span>
                    <span className="font-mono">{formatINR(viewingPayslip.deductionsTotal + viewingPayslip.advancesDeducted)}</span>
                  </div>
                </div>
              </div>

              {/* Net Payable Banner */}
              <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Net Amount Payable</div>
                  <div className="text-xs text-slate-300">Total credited to staff account</div>
                </div>
                <div className="text-xl font-black font-mono text-amber-300">
                  {formatINR(viewingPayslip.netPayable)}
                </div>
              </div>

              {/* Payments History */}
              {viewingPayslip.payments && viewingPayslip.payments.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5">
                  <div className="font-bold text-slate-900 text-[11px]">Disbursement Records:</div>
                  {viewingPayslip.payments.map(p => (
                    <div key={p.id} className="flex justify-between text-[10px] text-slate-600 font-mono">
                      <span>{p.paymentDate} • {p.paymentMethod.toUpperCase()} {p.referenceNumber ? `(${p.referenceNumber})` : ''}</span>
                      <span className="font-bold text-emerald-700">{formatINR(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Signatures */}
              <div className="flex justify-between pt-4 border-t border-slate-200 text-[10px] text-slate-500">
                <div>Employee Acknowledgment Signature</div>
                <div>Authorized Signatory (Aryan Agency)</div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: VIEW STAFF PROFILE DETAILS MODAL                                 */}
      {/* ========================================================================= */}
      {viewingStaffDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 overflow-hidden flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                  {viewingStaffDetails.photoUrl ? (
                    <img src={viewingStaffDetails.photoUrl} alt={viewingStaffDetails.name} className="w-full h-full object-cover" />
                  ) : (
                    viewingStaffDetails.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingStaffDetails.name}</h3>
                  <p className="text-xs font-semibold text-blue-700">{viewingStaffDetails.designation} • {viewingStaffDetails.employeeCode}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setViewingStaffDetails(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Employment Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${viewingStaffDetails.employmentStatus === 'active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  {viewingStaffDetails.employmentStatus}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mobile Phone</span>
                <span className="font-mono font-semibold text-slate-900">{viewingStaffDetails.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email Address</span>
                <span className="font-mono text-slate-900">{viewingStaffDetails.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Department / Role</span>
                <span className="font-semibold text-slate-900 capitalize">{viewingStaffDetails.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date of Joining</span>
                <span className="font-semibold text-slate-900">{viewingStaffDetails.joiningDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Base Salary</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatINR(viewingStaffDetails.baseSalary)} ({viewingStaffDetails.salaryType.replace('_', ' ')})
                </span>
              </div>
              {viewingStaffDetails.assignedBeats && viewingStaffDetails.assignedBeats.length > 0 && (
                <div className="py-1 border-b border-slate-100">
                  <span className="text-slate-500 block mb-1">Assigned Beat Routes:</span>
                  <div className="flex flex-wrap gap-1">
                    {viewingStaffDetails.assignedBeats.map((b, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px]">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {viewingStaffDetails.emergencyContact && (
                <div className="py-1 border-b border-slate-100 text-slate-700">
                  <span className="text-slate-500 block">Emergency Contact:</span>
                  <span className="font-semibold">{viewingStaffDetails.emergencyContact.name} ({viewingStaffDetails.emergencyContact.relation}) - {viewingStaffDetails.emergencyContact.phone}</span>
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">Issuing Distributor: </span>
                {ARYAN_AGENCY_PROFILE.businessName} • {getVerifiedCompanyAddress(ARYAN_AGENCY_PROFILE)} • Helpline: {ARYAN_AGENCY_PROFILE.supportPhoneFormatted}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const s = viewingStaffDetails;
                  setViewingStaffDetails(null);
                  setIdCardStaff(s);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Open ID Card</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingStaffDetails(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CONFIRM STAFF STATUS CHANGE (ACTIVE / INACTIVE)                  */}
      {/* ========================================================================= */}
      {statusChangeCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {statusChangeCandidate.newStatus === 'inactive' ? 'Deactivate Staff Member' : 'Activate Staff Member'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {statusChangeCandidate.staff.name} ({statusChangeCandidate.staff.employeeCode})
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 text-slate-700">
              {statusChangeCandidate.newStatus === 'inactive' ? (
                <>
                  <p className="font-semibold text-amber-900">
                    Important business audit rule:
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    When this staff member leaves or is marked <b>Inactive</b>, their login credentials and app access will be disabled immediately. 
                  </p>
                  <p className="text-[11px] leading-relaxed text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    ✓ All historical attendance logs, payroll calculations, sales orders, assigned tasks, and recovery records are permanently preserved.
                  </p>
                </>
              ) : (
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Activating this staff member will restore their operational status and permit authorized feature access.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusChangeCandidate(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={actionLoading}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer ${
                  statusChangeCandidate.newStatus === 'inactive'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {actionLoading ? 'Updating...' : `Confirm Mark ${statusChangeCandidate.newStatus.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: SAFE DELETE STAFF CONFIRMATION                                   */}
      {/* ========================================================================= */}
      {deletingStaffCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Staff Profile</h3>
                <p className="text-[11px] text-slate-500">
                  {deletingStaffCandidate.staff.name} ({deletingStaffCandidate.staff.employeeCode})
                </p>
              </div>
            </div>

            {deletingStaffCandidate.dependencyError ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs space-y-2">
                <p className="font-bold text-rose-900">Deletion Blocked for Audit Integrity</p>
                <p className="text-rose-800 text-[11px] leading-relaxed">
                  {deletingStaffCandidate.dependencyError}
                </p>
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-rose-900 font-semibold">Recommended action:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const staff = deletingStaffCandidate.staff;
                      setDeletingStaffCandidate(null);
                      handlePromptStatusChange(staff, 'inactive');
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-bold cursor-pointer"
                  >
                    Mark Inactive Instead
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 text-slate-700">
                <p className="font-semibold text-slate-900">No active business history linked to this staff profile.</p>
                <p className="text-[11px] text-slate-500">
                  This record can be safely removed from the registry.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingStaffCandidate(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {!deletingStaffCandidate.dependencyError && (
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteStaff(false)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {actionLoading ? 'Deleting...' : 'Delete Staff Member'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: ADMIN-ONLY TEST DATA CLEANUP & AUDIT SCREEN                     */}
      {/* ========================================================================= */}
      {isCleanupAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Test Data Cleanup &amp; Audit Review
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Admin Oversight
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review staff records created during test cycles. Purge only verified dummy records while preserving genuine staff.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCleanupAuditModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAudit ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Auditing staff records across attendance, payroll & orders...</span>
              </div>
            ) : auditCandidates.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-600">No staff records in registry to audit.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span>Found <b>{auditCandidates.length}</b> staff profiles in registry.</span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const likely = auditCandidates.filter(c => c.isLikelyTest).map(c => c.staff.id);
                        setSelectedCleanupIds(likely);
                      }}
                      className="text-blue-700 hover:underline font-semibold cursor-pointer"
                    >
                      Select Likely Test Only
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCleanupIds([])}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[45vh] border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-3 w-10">Select</th>
                        <th className="p-3">Staff Candidate</th>
                        <th className="p-3">Role & Email</th>
                        <th className="p-3">Joined / Created</th>
                        <th className="p-3">Linked History</th>
                        <th className="p-3">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditCandidates.map(({ staff, isLikelyTest, linkedCounts }) => {
                        const isSelected = selectedCleanupIds.includes(staff.id);
                        const isProtectedAdmin = staff.role === 'admin';
                        return (
                          <tr key={staff.id} className={`hover:bg-slate-50/70 ${isSelected ? 'bg-amber-50/40' : ''}`}>
                            <td className="p-3">
                              <input
                                type="checkbox"
                                disabled={isProtectedAdmin}
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCleanupIds(prev => [...prev, staff.id]);
                                  } else {
                                    setSelectedCleanupIds(prev => prev.filter(id => id !== staff.id));
                                  }
                                }}
                                className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer disabled:opacity-30"
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{staff.name}</div>
                              <div className="font-mono text-[10px] text-slate-400">{staff.employeeCode}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold capitalize text-slate-800">{staff.role}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{staff.email}</div>
                            </td>
                            <td className="p-3 text-[11px] text-slate-600">
                              {staff.joiningDate}
                            </td>
                            <td className="p-3 text-[11px]">
                              <span className="font-mono text-slate-700">
                                Att: {linkedCounts.attendance} • Pay: {linkedCounts.payroll} • Ord: {linkedCounts.orders}
                              </span>
                            </td>
                            <td className="p-3">
                              {isProtectedAdmin ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  Protected Admin
                                </span>
                              ) : isLikelyTest ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  Likely Test Dummy
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Genuine Staff
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                  <span className="font-bold">Explicit Confirmation Required: </span>
                  Deleting selected test records will purge test profiles and their dependent test-only logs. Real staff accounts, real Supabase auth users, and business sales records will stay untouched.
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCleanupAuditModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteStaffCleanup}
                disabled={selectedCleanupIds.length === 0 || actionLoading}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {actionLoading ? 'Purging...' : `Purge Selected (${selectedCleanupIds.length}) Records`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
