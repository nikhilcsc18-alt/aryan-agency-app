import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Store, 
  Plus, 
  Route, 
  Calendar, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Phone, 
  ArrowUpRight, 
  Search, 
  Filter, 
  RefreshCw, 
  Target, 
  Award, 
  Briefcase, 
  ChevronRight, 
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  Loader2,
  Navigation,
  FileText,
  UserCheck,
  IndianRupee,
  CreditCard,
  Printer,
  Share2,
  Download
} from 'lucide-react';
import { 
  Salesman, 
  Order, 
  Retailer, 
  Product, 
  NavTab, 
  SalesmanTask, 
  SalesTarget, 
  SalesmanVisit, 
  TaskStatus,
  TaskType,
  StaffAttendance,
  StaffPayroll,
  StaffMember,
  PaymentRecord
} from '../types';
import { formatINR, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StaffIdCardModal } from './StaffIdCardModal';
import { ARYAN_AGENCY_PROFILE } from '../lib/businessProfile';

interface SalesmanHomeDashboardProps {
  salesman?: Salesman;
  orders: Order[];
  retailers: Retailer[];
  products: Product[];
  onOpenNewOrderForRetailer: (retailerId?: string) => void;
  onOpenCheckInForRetailer: (retailer: Retailer) => void;
  onNavigateTab: (tab: NavTab) => void;
  onRefreshData?: () => Promise<void>;
}

export const SalesmanHomeDashboard: React.FC<SalesmanHomeDashboardProps> = ({
  salesman: propSalesman,
  orders = [],
  retailers = [],
  products = [],
  onOpenNewOrderForRetailer,
  onOpenCheckInForRetailer,
  onNavigateTab,
  onRefreshData
}) => {
  const { currentUser } = useAuth();

  // Active Date Filter: 'today' | 'this_week' | 'this_month'
  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tasks & Visits State
  const [tasks, setTasks] = useState<SalesmanTask[]>([]);
  const [visits, setVisits] = useState<SalesmanVisit[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'visit' | 'follow_up' | 'order_booking' | 'completed'>('all');

  // Retailer Beat Tracking State
  const [retailerSearch, setRetailerSearch] = useState('');
  const [retailerTab, setRetailerTab] = useState<'all' | 'remaining' | 'visited'>('all');
  const [isBeatsModalOpen, setIsBeatsModalOpen] = useState(false);

  // Task Completion Modal State
  const [completingTask, setCompletingTask] = useState<SalesmanTask | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  // Self-Task Quick Creation Modal State
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('visit');
  const [newTaskRetailerId, setNewTaskRetailerId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSavingNewTask, setIsSavingNewTask] = useState(false);

  // Active Salesman Identity
  const activeSalesman = useMemo(() => {
    if (propSalesman) return propSalesman;
    // Look up by currentUser
    if (currentUser?.salesmanId) {
      return {
        id: currentUser.salesmanId,
        employeeCode: 'EMP-SE-ACTIVE',
        name: currentUser.name,
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        assignedBeats: [],
        commissionPercentage: 1.5,
        status: 'active' as const
      };
    }
    return {
      id: 'slm_active',
      employeeCode: 'EMP-SE-101',
      name: currentUser?.name || 'Sales Representative',
      phone: currentUser?.phone || '',
      email: currentUser?.email || '',
      assignedBeats: [],
      commissionPercentage: 1.5,
      status: 'active' as const
    };
  }, [propSalesman, currentUser]);

  // Attendance & Salary State
  const [myAttendanceList, setMyAttendanceList] = useState<StaffAttendance[]>([]);
  const [myPayroll, setMyPayroll] = useState<StaffPayroll | null>(null);
  const [isPunchingAttendance, setIsPunchingAttendance] = useState(false);
  const [isAttendanceHistoryOpen, setIsAttendanceHistoryOpen] = useState(false);
  const [isSalaryStatementOpen, setIsSalaryStatementOpen] = useState(false);
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [myStaffProfile, setMyStaffProfile] = useState<StaffMember | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const curMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  // Today's specific attendance record
  const todayAttendance = useMemo(() => {
    return myAttendanceList.find(a => a.date === todayStr);
  }, [myAttendanceList, todayStr]);

  // Monthly Attendance Summary
  const monthlyAttendanceStats = useMemo(() => {
    const presentDays = myAttendanceList.filter(a => a.status === 'present').length;
    const absentDays = myAttendanceList.filter(a => a.status === 'absent').length;
    const halfDays = myAttendanceList.filter(a => a.status === 'half_day').length;
    const paidLeaves = myAttendanceList.filter(a => a.status === 'paid_leave').length;
    const weeklyOffs = myAttendanceList.filter(a => a.status === 'weekly_off').length;
    const totalPayableDays = presentDays + paidLeaves + weeklyOffs + (halfDays * 0.5);
    const leaveQuota = 2; // Configured monthly paid leave quota
    const remainingLeaveBalance = Math.max(0, leaveQuota - paidLeaves);

    return {
      presentDays,
      absentDays,
      halfDays,
      paidLeaves,
      weeklyOffs,
      totalPayableDays,
      leaveQuota,
      remainingLeaveBalance
    };
  }, [myAttendanceList]);

  // Load Tasks, Visits, Attendance, Payroll and Staff Profile for this salesman
  const loadDashboardData = async () => {
    try {
      setLoadingTasks(true);
      const curMonth = new Date().toISOString().slice(0, 7);
      const [fetchedTasks, fetchedVisits, fetchedAtt, fetchedPay, fetchedStaff, fetchedPayments] = await Promise.all([
        api.getSalesmanTasks(activeSalesman.id).catch(() => []),
        api.getVisits({ salesmanId: activeSalesman.id }).catch(() => []),
        api.getStaffAttendance({ month: curMonth }).catch(() => []),
        api.getStaffPayrolls({ period: curMonth }).catch(() => []),
        api.getStaffMembers().catch(() => []),
        api.getPayments().catch(() => [])
      ]);
      setTasks(fetchedTasks || []);
      setVisits(fetchedVisits || []);
      setMyAttendanceList(fetchedAtt || []);
      setPayments(fetchedPayments || []);
      if (fetchedPay && fetchedPay.length > 0) {
        setMyPayroll(fetchedPay[0]);
      }
      if (fetchedStaff && fetchedStaff.length > 0) {
        const found = fetchedStaff.find((s: StaffMember) => 
          s.salesmanId === activeSalesman.id ||
          (s.email && s.email.toLowerCase() === (activeSalesman.email || '').toLowerCase()) ||
          (currentUser?.id && s.userId === currentUser.id)
        );
        if (found) {
          setMyStaffProfile(found);
        } else {
          setMyStaffProfile({
            id: `stf_${activeSalesman.id}`,
            employeeCode: activeSalesman.employeeCode || `EMP-${activeSalesman.id.replace('slm_', '')}`,
            name: activeSalesman.name,
            phone: activeSalesman.phone || '+91 98000 00000',
            email: activeSalesman.email || 'sales@aryanagency.in',
            role: 'salesman',
            designation: 'Senior Sales Executive',
            assignedBeats: activeSalesman.assignedBeats || ['Utraula Retail Beat'],
            joiningDate: '2024-03-15',
            employmentStatus: 'active',
            salaryType: 'monthly_fixed',
            baseSalary: 22000,
            weeklyOffDay: 0,
            monthlyLeaveQuota: 2,
            createdAt: '2024-03-15T00:00:00Z',
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('[SalesmanDashboard] Failed to fetch dashboard data:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeSalesman.id]);

  const handlePunchAttendance = async () => {
    try {
      setIsPunchingAttendance(true);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const res = await api.markStaffAttendance({
        staffId: myStaffProfile?.id || activeSalesman.id,
        date: todayStr,
        status: 'present',
        checkInTime: timeStr,
        remarks: 'Self check-in via mobile dashboard'
      });
      if (res && res.attendance) {
        setMyAttendanceList(prev => [res.attendance, ...prev.filter(a => a.date !== todayStr)]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to punch attendance');
    } finally {
      setIsPunchingAttendance(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        loadDashboardData(),
        onRefreshData ? onRefreshData() : Promise.resolve()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // -------------------------------------------------------------
  // Data Scoping & Filtering
  // -------------------------------------------------------------
  const now = new Date();
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  // Executive's Assigned Beats
  const assignedBeats = useMemo(() => {
    if (activeSalesman?.assignedBeats && Array.isArray(activeSalesman.assignedBeats)) {
      return activeSalesman.assignedBeats;
    }
    return [];
  }, [activeSalesman?.assignedBeats]);

  // Executive's Assigned Retailers (Strict Data Isolation)
  const assignedRetailers = useMemo(() => {
    return (retailers || []).filter(r => {
      if (!r || !r.id) return false;
      const beatMatch = r.beatName && assignedBeats.some(b => b.toLowerCase().trim() === r.beatName.toLowerCase().trim());
      const directMatch = (r.assignedSalesmanId && r.assignedSalesmanId === activeSalesman.id) ||
                          (r.salesmanId && r.salesmanId === activeSalesman.id);
      return Boolean(beatMatch || directMatch);
    });
  }, [retailers, assignedBeats, activeSalesman?.id]);

  // Filtered Orders for this Sales Executive
  const myOrders = useMemo(() => {
    return (orders || []).filter(o => {
      if (!o || !o.id || o.status === 'cancelled') return false;
      const isSalesmanMatch = 
        (o.salesmanId && o.salesmanId === activeSalesman.id) ||
        (o.salesmanName && activeSalesman.name && o.salesmanName.toLowerCase() === activeSalesman.name.toLowerCase());
      const isRetailerInBeat = assignedRetailers.some(r => r.id === o.retailerId);
      return isSalesmanMatch || isRetailerInBeat;
    });
  }, [orders, activeSalesman, assignedRetailers]);

  // Date Filtered Orders
  const dateFilteredOrders = useMemo(() => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday of this week
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    return myOrders.filter(o => {
      const orderDateStr = (o.orderDate || '').slice(0, 10);
      if (dateFilter === 'today') {
        return orderDateStr === todayStr;
      }
      if (dateFilter === 'this_week') {
        return orderDateStr >= startOfWeekStr;
      }
      if (dateFilter === 'this_month') {
        return orderDateStr.startsWith(currentMonthStr);
      }
      return true;
    });
  }, [myOrders, dateFilter, todayStr, currentMonthStr]);

  // Today's Verified Visits (Only genuine check-ins count, never viewing a profile)
  const todayVisits = useMemo(() => {
    return (visits || []).filter(v => {
      if (!v || !v.checkInTime) return false;
      const visitDate = v.checkInTime.slice(0, 10);
      const isVerifiedStatus = v.status === 'checked_in' || v.status === 'completed';
      return visitDate === todayStr && isVerifiedStatus;
    });
  }, [visits, todayStr]);

  const visitedRetailerIdsToday = useMemo(() => {
    return new Set(todayVisits.map(v => v.retailerId));
  }, [todayVisits]);

  // -------------------------------------------------------------
  // Section A Metrics Calculations
  // -------------------------------------------------------------
  // Today's Sales
  const todayOrders = myOrders.filter(o => (o.orderDate || '').slice(0, 10) === todayStr);
  const todaySalesAmount = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const todayOrdersCount = todayOrders.length;
  const todayDeliveredOrders = todayOrders.filter(o => o.status === 'delivered');
  const todayBookedOnlyOrders = todayOrders.filter(o => o.status !== 'delivered');

  // Monthly Sales
  const monthlyOrders = myOrders.filter(o => (o.orderDate || '').slice(0, 7) === currentMonthStr);
  const monthlySalesAmount = monthlyOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const monthlyDeliveredOrders = monthlyOrders.filter(o => o.status === 'delivered');

  // Target Verification: "If a target has not been assigned, show 'Target not assigned' instead of inventing a target."
  const isTargetAssigned = Boolean(
    activeSalesman.targetAssigned || 
    (activeSalesman.monthlyTargetAmount && activeSalesman.monthlyTargetAmount > 0) ||
    (activeSalesman.dailyTargetAmount && activeSalesman.dailyTargetAmount > 0)
  );

  const monthlyTargetAmount = isTargetAssigned ? (activeSalesman.monthlyTargetAmount || 0) : 0;
  const dailyTargetAmount = isTargetAssigned ? (activeSalesman.dailyTargetAmount || 0) : 0;

  // Safe percentage calculation (No division by zero or NaN)
  const targetAchievedPercentage = monthlyTargetAmount > 0
    ? Math.min(100, Math.round((monthlySalesAmount / monthlyTargetAmount) * 100))
    : 0;

  const remainingMonthlyTargetAmount = monthlyTargetAmount > 0
    ? Math.max(0, monthlyTargetAmount - monthlySalesAmount)
    : 0;

  const dailyAchievedPercentage = dailyTargetAmount > 0
    ? Math.min(100, Math.round((todaySalesAmount / dailyTargetAmount) * 100))
    : 0;

  const remainingDailyTargetAmount = dailyTargetAmount > 0
    ? Math.max(0, dailyTargetAmount - todaySalesAmount)
    : 0;

  // Retailers Visited & Remaining Today
  const retailersVisitedCount = visitedRetailerIdsToday.size;
  const totalAssignedRetailersCount = assignedRetailers.length;
  const retailersRemainingCount = Math.max(0, totalAssignedRetailersCount - retailersVisitedCount);

  // Orders Delivered vs Pending
  const allDeliveredOrdersCount = myOrders.filter(o => o.status === 'delivered').length;
  const pendingOrdersCount = myOrders.filter(o => ['booked', 'confirmed', 'packed', 'dispatched'].includes(o.status)).length;
  const pendingTasksCount = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;

  // -------------------------------------------------------------
  // Real Collections Calculations
  // -------------------------------------------------------------
  const myPayments = useMemo(() => {
    return (payments || []).filter(p => {
      if (!p || p.status !== 'confirmed') return false;
      const isSalesmanMatch = (p.collectorName && activeSalesman.name && p.collectorName.toLowerCase() === activeSalesman.name.toLowerCase());
      const isRetailerInBeat = assignedRetailers.some(r => r.id === p.retailerId);
      return isSalesmanMatch || isRetailerInBeat;
    });
  }, [payments, activeSalesman, assignedRetailers]);

  const dateFilteredPayments = useMemo(() => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    return myPayments.filter(p => {
      const pDate = (p.paymentDate || '').slice(0, 10);
      if (dateFilter === 'today') return pDate === todayStr;
      if (dateFilter === 'this_week') return pDate >= startOfWeekStr;
      if (dateFilter === 'this_month') return pDate.startsWith(currentMonthStr);
      return true;
    });
  }, [myPayments, dateFilter, todayStr, currentMonthStr]);

  const periodCollectionAmount = useMemo(() => {
    return dateFilteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [dateFilteredPayments]);

  const todayPayments = useMemo(() => {
    return myPayments.filter(p => (p.paymentDate || '').slice(0, 10) === todayStr);
  }, [myPayments, todayStr]);

  const todayCollectionAmount = useMemo(() => {
    return todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [todayPayments]);

  // -------------------------------------------------------------
  // Task Handlers
  // -------------------------------------------------------------
  const handleOpenCompleteModal = (task: SalesmanTask) => {
    setCompletingTask(task);
    setCompletionNotes('');
  };

  const handleConfirmCompleteTask = async () => {
    if (!completingTask) return;
    try {
      setIsSavingCompletion(true);
      await api.updateSalesmanTaskStatus(completingTask.id, 'completed', completionNotes);
      setTasks(prev => prev.map(t => 
        t.id === completingTask.id 
          ? { ...t, status: 'completed', completedAt: new Date().toISOString(), completionNotes }
          : t
      ));
      setCompletingTask(null);
    } catch (err: any) {
      alert(err.message || 'Failed to complete task');
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const handleCreateSelfTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setIsSavingNewTask(true);
      const matchedRetailer = assignedRetailers.find(r => r.id === newTaskRetailerId);
      const created = await api.saveSalesmanTask({
        salesmanId: activeSalesman.id,
        salesmanName: activeSalesman.name,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        taskType: newTaskType,
        retailerId: newTaskRetailerId || undefined,
        retailerName: matchedRetailer?.storeName,
        retailerPhone: matchedRetailer?.phone,
        retailerAddress: matchedRetailer?.address,
        beatName: matchedRetailer?.beatName || assignedBeats[0],
        dueDate: newTaskDueDate,
        priority: newTaskPriority,
        status: 'pending'
      });

      if (created && created.task) {
        setTasks(prev => [created.task, ...prev]);
        setIsAddTaskModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskRetailerId('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsSavingNewTask(false);
    }
  };

  // Filtered Task List
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (taskFilter === 'all') return true;
      if (taskFilter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
      if (taskFilter === 'completed') return t.status === 'completed';
      return t.taskType === taskFilter;
    });
  }, [tasks, taskFilter]);

  // Filtered Retailer Outlets for Beat Tracking
  const filteredRetailers = useMemo(() => {
    return assignedRetailers.filter(r => {
      const q = retailerSearch.toLowerCase();
      const matchesSearch = !q || 
        r.storeName.toLowerCase().includes(q) || 
        r.ownerName.toLowerCase().includes(q) || 
        r.phone.includes(q) ||
        r.area.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const isVisited = visitedRetailerIdsToday.has(r.id);
      if (retailerTab === 'visited') return isVisited;
      if (retailerTab === 'remaining') return !isVisited;
      return true;
    });
  }, [assignedRetailers, retailerSearch, retailerTab, visitedRetailerIdsToday]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. COMPACT SALESMAN PROFILE & EXECUTIVE COMMAND BAR                       */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#0B1E3F] via-[#0F274E] to-[#13284C] text-white rounded-2xl p-3.5 sm:p-5 shadow-lg border border-blue-900/60 relative overflow-hidden">
        {/* Ambient subtle light accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Salesman Identity */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0 border border-white/20">
              {activeSalesman.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              {/* Salesman Name & Badges */}
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  {activeSalesman.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/90 text-blue-200 border border-blue-800 shrink-0">
                  {activeSalesman.employeeCode}
                </span>
                <span className="text-[10px] font-bold text-emerald-300 flex items-center space-x-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>On Field</span>
                </span>
              </div>

              {/* Compact Assigned Beats & ID Card link */}
              <div className="flex items-center space-x-2 text-xs text-slate-300 mt-0.5 flex-wrap">
                <span className="text-slate-400 text-[11px]">Assigned Beats:</span>
                <span className="font-bold text-amber-300 text-[11px]">
                  {assignedBeats.length > 0 ? `${assignedBeats.length} Beat${assignedBeats.length > 1 ? 's' : ''}` : 'All Outlets'}
                </span>
                <button 
                  type="button"
                  onClick={() => setIsBeatsModalOpen(true)}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer transition-colors"
                >
                  View Beats →
                </button>
                <span className="text-slate-500">•</span>
                <button
                  type="button"
                  onClick={() => setIsIdCardOpen(true)}
                  className="text-[11px] text-blue-300 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
                >
                  Staff ID Card
                </button>
              </div>
            </div>
          </div>

          {/* Controls: Attendance Widget + Period Toggle + Refresh */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            {/* Quick Attendance Punch / Status */}
            {todayAttendance ? (
              <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px]">Checked In {todayAttendance.checkInTime ? `(${todayAttendance.checkInTime})` : ''}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePunchAttendance}
                disabled={isPunchingAttendance}
                className="px-3 py-1.5 min-h-[38px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 border border-emerald-400/30"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
                <span>{isPunchingAttendance ? 'Punching...' : 'Punch Attendance'}</span>
              </button>
            )}

            {/* Date Filter Tabs */}
            <div className="bg-[#0B1E3F]/90 p-0.5 rounded-xl border border-blue-900/80 flex items-center text-xs shadow-inner">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`px-2.5 py-1 min-h-[34px] rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  dateFilter === 'today' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('this_week')}
                className={`px-2.5 py-1 min-h-[34px] rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  dateFilter === 'this_week' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('this_month')}
                className={`px-2.5 py-1 min-h-[34px] rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  dateFilter === 'this_month' 
                    ? 'bg-amber-500 text-slate-950 shadow-xs' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Month
              </button>
            </div>

            {/* Refresh Live Field Data */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 min-w-[36px] min-h-[36px] bg-[#13284C] hover:bg-blue-800/60 text-slate-200 rounded-xl border border-blue-800/80 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-2xs active:scale-95"
              title="Refresh Live Salesman Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SECTION 1: DISTRIBUTION OVERVIEW (COMPACT 2-COLUMN GRID + ROW)          */}
      {/* ========================================================================= */}
      <section aria-labelledby="distribution-overview-heading" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 id="distribution-overview-heading" className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Distribution Overview</span>
          </h2>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {dateFilter === 'today' ? "Today" : dateFilter === 'this_week' ? "This Week" : "This Month"}
          </span>
        </div>

        {/* 2-Column Grid for the 4 Core Metrics */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          {/* Card 1: Today's Sales Amount */}
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Today's Sales</span>
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 font-mono">
                {formatINR(todaySalesAmount)}
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold truncate">
              {todayOrdersCount} booked · {todayDeliveredOrders.length} delivered
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between text-left cursor-pointer group active:scale-[0.99]"
            title="View Orders History"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Total Orders</span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 font-mono flex items-baseline justify-between">
                <span>{dateFilteredOrders.length}</span>
                <span className="text-[10px] text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                  View <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium truncate">
              {dateFilteredOrders.filter(o => o.status === 'delivered').length} delivered · {dateFilteredOrders.filter(o => o.status !== 'delivered').length} pipeline
            </div>
          </button>

          {/* Card 3: Retailer Visits */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('retailer-beat-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between text-left cursor-pointer group active:scale-[0.99]"
            title="View Retailer Beat Outlets"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Retailer Visits</span>
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <Store className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 font-mono flex items-baseline space-x-1">
                <span>{retailersVisitedCount}</span>
                <span className="text-xs text-slate-400 font-normal">/ {totalAssignedRetailersCount}</span>
              </div>
              {/* Mini progress bar */}
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((retailersVisitedCount / Math.max(1, totalAssignedRetailersCount)) * 100))}%` }}
                />
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 text-[11px] flex items-center justify-between">
              <span className="text-emerald-700 font-semibold">{retailersVisitedCount} visited</span>
              <span className="text-amber-700 font-bold">{retailersRemainingCount} left</span>
            </div>
          </button>

          {/* Card 4: Collection */}
          <button
            type="button"
            onClick={() => onNavigateTab('payments')}
            className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200/90 shadow-xs hover:border-emerald-400 transition-all flex flex-col justify-between text-left cursor-pointer group active:scale-[0.99]"
            title="View Payment Collections & Khata"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Collection</span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <IndianRupee className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5 font-mono">
                {formatINR(periodCollectionAmount)}
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
              <span className="text-emerald-700 font-bold">{dateFilteredPayments.length} payments</span>
              <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                Ledger <ChevronRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </button>
        </div>

        {/* Pending Orders: In ONE Short Row */}
        <button
          type="button"
          onClick={() => onNavigateTab('orders')}
          className="w-full bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-xs hover:border-blue-400 transition-all flex items-center justify-between text-left cursor-pointer active:scale-[0.99] group"
          title="View Pending Orders"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">Pending Orders</span>
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                  pendingOrdersCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {pendingOrdersCount} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {myOrders.filter(o => o.status === 'booked').length} booked · {myOrders.filter(o => ['confirmed', 'packed', 'dispatched'].includes(o.status)).length} in transit dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2">
            <span className="hidden sm:inline">View Orders</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </div>
        </button>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION 2: QUICK ACTIONS (COMPACT 3-COLUMN GRID)                       */}
      {/* ========================================================================= */}
      <section aria-labelledby="quick-actions-heading" className="space-y-2">
        <h2 id="quick-actions-heading" className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Quick Actions
        </h2>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* 1. Book Order */}
          <button
            type="button"
            onClick={() => onOpenNewOrderForRetailer()}
            className="min-h-[52px] p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-sm flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 space-y-1"
            title="Book a New Wholesale Order"
          >
            <ShoppingCart className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="truncate w-full text-[11px] sm:text-xs font-extrabold">Book Order</span>
          </button>

          {/* 2. Retailers */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('retailer-beat-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="min-h-[52px] p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-200 transition-all shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 space-y-1"
            title="View Assigned Outlets Beat"
          >
            <Store className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate w-full text-[11px] sm:text-xs">Retailers ({assignedRetailers.length})</span>
          </button>

          {/* 3. Collection */}
          <button
            type="button"
            onClick={() => onNavigateTab('payments')}
            className="min-h-[52px] p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-200 transition-all shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 space-y-1"
            title="View Payment Collections & Khata Ledgers"
          >
            <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate w-full text-[11px] sm:text-xs">Collection</span>
          </button>

          {/* 4. Attendance */}
          <button
            type="button"
            onClick={() => setIsAttendanceHistoryOpen(true)}
            className="min-h-[52px] p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-200 transition-all shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 space-y-1"
            title="View Monthly Attendance Calendar & Leaves"
          >
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="truncate w-full text-[11px] sm:text-xs">Attendance</span>
          </button>

          {/* 5. Tasks */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('tasks-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="min-h-[52px] p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-200 transition-all shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 space-y-1"
            title="View Daily Visits & Follow-up Tasks"
          >
            <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="truncate w-full text-[11px] sm:text-xs">Tasks ({pendingTasksCount})</span>
          </button>

          {/* 6. Catalog */}
          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="min-h-[52px] p-2 sm:p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold border border-slate-200 transition-all shadow-2xs flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 space-y-1"
            title="Browse Wholesale Product Catalogue"
          >
            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="truncate w-full text-[11px] sm:text-xs">Catalog</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION B: SALES TARGET PROGRESS BAR                                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span>Sales Target Progress & Quota Tracking</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live progress against current FMCG distribution sales quotas
            </p>
          </div>

          {isTargetAssigned ? (
            <div className="flex items-center space-x-3 text-xs">
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Monthly Target</span>
                <span className="font-bold text-slate-900 font-mono">{formatINR(monthlyTargetAmount)}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Achieved Sales</span>
                <span className="font-bold text-emerald-700 font-mono">{formatINR(monthlySalesAmount)}</span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Remaining</span>
                <span className="font-bold text-amber-700 font-mono">{formatINR(remainingMonthlyTargetAmount)}</span>
              </div>
            </div>
          ) : (
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
              Target not assigned
            </span>
          )}
        </div>

        {isTargetAssigned && monthlyTargetAmount > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Monthly Target Completion</span>
              <span className="text-blue-700 font-mono font-bold">{targetAchievedPercentage}%</span>
            </div>
            
            {/* Multi-tier progress bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500"
                style={{ width: `${targetAchievedPercentage}%` }}
              />
            </div>

            {/* Daily target indicator */}
            {dailyTargetAmount > 0 && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-1">
                <span>
                  <strong>Daily Target:</strong> {formatINR(dailyTargetAmount)} • Today's Achieved: <strong className="text-emerald-700 font-mono">{formatINR(todaySalesAmount)}</strong> ({dailyAchievedPercentage}%)
                </span>
                <span>
                  Remaining Today: <strong className="text-amber-700 font-mono">{formatINR(remainingDailyTargetAmount)}</strong>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center py-6">
            <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No Sales Target Allocated</h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
              Your Area Sales Manager / Admin has not configured a numerical target for this cycle. Orders booked on your beats continue to be tracked in real-time.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2.5 SECTION: MY ATTENDANCE & MY SALARY (STAFF MODULE)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Card 1: My Attendance Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">My Attendance</h3>
                  <p className="text-[11px] text-slate-500">Daily verification & monthly logs</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAttendanceHistoryOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Monthly Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Today's Status Banner */}
            <div className="mt-3 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Today's Status ({todayStr})
                </span>
                <div className="mt-0.5 flex items-center gap-2">
                  {todayAttendance ? (
                    <>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                        todayAttendance.status === 'present' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        todayAttendance.status === 'half_day' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        todayAttendance.status === 'paid_leave' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {todayAttendance.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-600 font-mono">
                        In: {todayAttendance.checkInTime || '--:--'} {todayAttendance.checkOutTime ? `• Out: ${todayAttendance.checkOutTime}` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Attendance Not Marked</span>
                    </span>
                  )}
                </div>
              </div>

              {!todayAttendance && (
                <button
                  type="button"
                  onClick={handlePunchAttendance}
                  disabled={isPunchingAttendance}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {isPunchingAttendance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Self Check-In Today</span>
                </button>
              )}
            </div>

            {/* Monthly Attendance Counters */}
            <div className="grid grid-cols-3 gap-2.5 mt-3 pt-2">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Present</span>
                <span className="text-base font-extrabold text-emerald-700 font-mono">{monthlyAttendanceStats.presentDays}</span>
                <span className="text-[10px] text-slate-400 block">Days</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Half / Leave</span>
                <span className="text-base font-extrabold text-amber-700 font-mono">
                  {monthlyAttendanceStats.halfDays} / {monthlyAttendanceStats.paidLeaves}
                </span>
                <span className="text-[10px] text-slate-400 block">Days</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Absent</span>
                <span className="text-base font-extrabold text-rose-700 font-mono">{monthlyAttendanceStats.absentDays}</span>
                <span className="text-[10px] text-slate-400 block">Days</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              <span>Leave Balance: </span>
              <strong className="text-slate-900">{monthlyAttendanceStats.remainingLeaveBalance} / {monthlyAttendanceStats.leaveQuota} days</strong>
            </div>
            <div>
              <span>Total Payable: </span>
              <strong className="text-emerald-700 font-mono font-bold">{monthlyAttendanceStats.totalPayableDays} Days</strong>
            </div>
          </div>
        </div>

        {/* Card 2: My Salary & Earnings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">My Salary & Earnings</h3>
                  <p className="text-[11px] text-slate-500">Cycle {curMonthStr} • Monthly Statement</p>
                </div>
              </div>

              {myPayroll && (
                <button
                  type="button"
                  onClick={() => setIsSalaryStatementOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Payslip</span>
                </button>
              )}
            </div>

            {myPayroll ? (
              <div className="mt-3 space-y-3">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-xl border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider block">
                      Net Salary Payable
                    </span>
                    <div className="text-xl font-black text-slate-900 font-mono">
                      {formatINR(myPayroll.netPayable)}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    myPayroll.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    myPayroll.status === 'partially_paid' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                    myPayroll.status === 'approved' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                    'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {myPayroll.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Base Salary</span>
                    <span className="font-bold text-slate-900 font-mono">{formatINR(myPayroll.baseSalary)}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Received</span>
                    <span className="font-bold text-emerald-700 font-mono">{formatINR(myPayroll.amountPaid)}</span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">Balance Due</span>
                    <span className="font-bold text-rose-700 font-mono">{formatINR(myPayroll.remainingDue)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-3">
                <IndianRupee className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-700">Salary Calculation in Progress</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Disbursement statement will appear here once approved by distributor accounts.</p>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <button
              type="button"
              onClick={() => onNavigateTab('staff')}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer"
            >
              View Full Workforce Portal →
            </button>
          </div>
        </div>

      </div>
      <div id="tasks-section" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Task Management & Retailer Visits</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                {pendingTasksCount} Pending
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned field tasks, payment follow-ups, and scheduled outlet visits
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAddTaskModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Task / Follow-up</span>
            </button>
          </div>
        </div>

        {/* Task Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-100">
          <button
            type="button"
            onClick={() => setTaskFilter('all')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap ${taskFilter === 'all' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('pending')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap ${taskFilter === 'pending' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Pending ({pendingTasksCount})
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('visit')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap ${taskFilter === 'visit' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Visits ({tasks.filter(t => t.taskType === 'visit').length})
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('follow_up')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap ${taskFilter === 'follow_up' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Follow-ups ({tasks.filter(t => t.taskType === 'follow_up').length})
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('completed')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer whitespace-nowrap ${taskFilter === 'completed' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Completed ({tasks.filter(t => t.status === 'completed').length})
          </button>
        </div>

        {/* Task List */}
        {loadingTasks ? (
          <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span className="text-xs">Loading task schedule...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">No tasks in this category</p>
            <p className="text-[11px] text-slate-400">All planned outlet visits and follow-ups are up to date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.map(task => {
              const isOverdue = task.status !== 'completed' && task.dueDate < todayStr;
              const isDone = task.status === 'completed';
              const matchedRetailer = task.retailerId ? assignedRetailers.find(r => r.id === task.retailerId) : null;

              return (
                <div 
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isDone 
                      ? 'bg-slate-50/70 border-slate-200 opacity-80' 
                      : isOverdue 
                      ? 'bg-rose-50/40 border-rose-200' 
                      : 'bg-white border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.taskType === 'visit' ? 'bg-blue-100 text-blue-800' :
                          task.taskType === 'follow_up' ? 'bg-amber-100 text-amber-800' :
                          task.taskType === 'order_booking' ? 'bg-emerald-100 text-emerald-800' :
                          task.taskType === 'collection' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.taskType.replace('_', ' ')}
                        </span>

                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          task.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Due Date Indicator */}
                      <span className={`text-[11px] font-medium flex items-center space-x-1 ${
                        isDone ? 'text-emerald-700' : isOverdue ? 'text-rose-700 font-bold' : 'text-slate-500'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        <span>{isDone ? 'Done' : isOverdue ? `Overdue (${task.dueDate})` : `Due: ${task.dueDate}`}</span>
                      </span>
                    </div>

                    <h4 className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Associated Retailer Outlet Details */}
                    {task.retailerName && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Store className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 block">{task.retailerName}</span>
                            <span className="text-[10px] text-slate-400">{task.beatName || 'Beat Route'}</span>
                          </div>
                        </div>

                        {task.retailerPhone && (
                          <a 
                            href={`tel:${task.retailerPhone.replace(/\D/g, '')}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-md cursor-pointer transition-colors"
                            title="Call Retailer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Completion Notes */}
                    {isDone && task.completionNotes && (
                      <div className="text-[11px] text-slate-500 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                        <strong>Notes:</strong> {task.completionNotes}
                      </div>
                    )}
                  </div>

                  {/* Task Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">
                      Assigned by {task.assignedByName || 'Admin'}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {matchedRetailer && !isDone && (
                        <button
                          type="button"
                          onClick={() => onOpenCheckInForRetailer(matchedRetailer)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span>Check-In</span>
                        </button>
                      )}

                      {!isDone ? (
                        <button
                          type="button"
                          onClick={() => handleOpenCompleteModal(task)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Mark Done</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. SECTION D: RETAILER & BEAT TRACKING                                    */}
      {/* ========================================================================= */}
      <div id="retailer-beat-section" className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Beat Outlets & Field Verification Tracking</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                {assignedRetailers.length} Outlets
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified GPS shop check-ins, order punch, and pending beat outlets for today
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search store, owner or phone..."
              value={retailerSearch}
              onChange={(e) => setRetailerSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setRetailerTab('all')}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${retailerTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              All Outlets ({assignedRetailers.length})
            </button>
            <button
              type="button"
              onClick={() => setRetailerTab('remaining')}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${retailerTab === 'remaining' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Remaining Today ({retailersRemainingCount})
            </button>
            <button
              type="button"
              onClick={() => setRetailerTab('visited')}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${retailerTab === 'visited' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Visited Today ({retailersVisitedCount})
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            GPS verification required for visits
          </span>
        </div>

        {/* Retailer Outlet Cards */}
        {filteredRetailers.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-100">
            <Store className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">No outlets match filter</p>
            <p className="text-[11px] text-slate-400">All outlets for this beat view are up to date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRetailers.map(retailer => {
              const isVisitedToday = visitedRetailerIdsToday.has(retailer.id);
              const visitDetails = todayVisits.find(v => v.retailerId === retailer.id);

              return (
                <div 
                  key={retailer.id}
                  className={`bg-white rounded-xl border p-4 transition-all flex flex-col justify-between hover:border-blue-400/80 shadow-2xs ${
                    isVisitedToday ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isVisitedToday ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {retailer.storeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {retailer.storeName}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {retailer.ownerName} • {retailer.area}
                          </span>
                        </div>
                      </div>

                      {/* Visit Status Badge */}
                      {isVisitedToday ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 mr-0.5" /> Visited
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Visit
                        </span>
                      )}
                    </div>

                    {/* Address & Beat */}
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{retailer.address}</span>
                    </div>

                    {/* Financial & Outstandings */}
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Current Balance</span>
                        <span className={`font-mono font-bold ${retailer.currentOutstanding > retailer.creditLimit ? 'text-rose-600' : 'text-slate-800'}`}>
                          {formatINR(retailer.currentOutstanding || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Credit Limit</span>
                        <span className="font-mono font-semibold text-slate-700">
                          {formatINR(retailer.creditLimit || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Verified Visit Notes if done today */}
                    {isVisitedToday && visitDetails && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-100/60 p-1.5 rounded flex items-center justify-between">
                        <span>Check-in: {new Date(visitDetails.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {visitDetails.distanceMetres !== undefined && (
                          <span>GPS Accuracy: {Math.round(visitDetails.distanceMetres)}m</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Outlet Quick Action Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <a
                      href={`tel:${retailer.phone.replace(/\D/g, '')}`}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center space-x-1 cursor-pointer"
                      title="Direct Phone Call"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>Call</span>
                    </a>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenCheckInForRetailer(retailer)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
                          isVisitedToday 
                            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title="GPS Field Verification Check-In"
                      >
                        <Navigation className="w-3 h-3 text-emerald-600" />
                        <span>{isVisitedToday ? 'Re-Check In' : 'GPS Check-In'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenNewOrderForRetailer(retailer.id)}
                        className="px-3 py-1 text-[11px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs flex items-center space-x-1 cursor-pointer"
                        title="Punch Wholesale Order"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MARK TASK COMPLETE WITH NOTES                                    */}
      {/* ========================================================================= */}
      {completingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Mark Task as Completed</h3>
              </div>
              <button 
                type="button"
                onClick={() => setCompletingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <p className="font-semibold text-slate-800">{completingTask.title}</p>
              {completingTask.retailerName && (
                <p className="text-slate-500">Retailer: {completingTask.retailerName}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-semibold text-xs mb-1">
                Completion Notes / Outcome (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Visited retailer, booked 5 cases of Parle-G, collected ₹2,000 cash balance."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingCompletion}
                onClick={handleConfirmCompleteTask}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                {isSavingCompletion && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                <span>Save & Complete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD SELF-TASK OR FOLLOW-UP                                       */}
      {/* ========================================================================= */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Field Task / Follow-up</h3>
                  <p className="text-[11px] text-slate-500">Scheduled outlet visit, booking, or collection reminder</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSelfTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Booking follow-up for Britannia Marie Gold"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Task Type</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                  >
                    <option value="visit">Retailer Visit</option>
                    <option value="follow_up">Payment Follow-up</option>
                    <option value="order_booking">Order Booking</option>
                    <option value="collection">Cash/UPI Collection</option>
                    <option value="general">General Task</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Associated Retailer Outlet</label>
                <select
                  value={newTaskRetailerId}
                  onChange={(e) => setNewTaskRetailerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="">-- None / General Outlet --</option>
                  {assignedRetailers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.storeName} ({r.ownerName} • {r.area})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Instructions or specific schemes to present..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewTask}
                  className="px-4 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  {isSavingNewTask && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  <span>Save Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SALESMAN ATTENDANCE HISTORY & CALENDAR                             */}
      {/* ========================================================================= */}
      {isAttendanceHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">My Attendance History ({curMonthStr})</h3>
                  <p className="text-[11px] text-slate-500">{activeSalesman.name} • {activeSalesman.employeeCode}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAttendanceHistoryOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Monthly Summary Badges */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-emerald-700 block uppercase font-bold">Present</span>
                <span className="font-black text-emerald-800 text-sm font-mono">{monthlyAttendanceStats.presentDays}</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                <span className="text-[10px] text-amber-700 block uppercase font-bold">Half Day</span>
                <span className="font-black text-amber-800 text-sm font-mono">{monthlyAttendanceStats.halfDays}</span>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-[10px] text-blue-700 block uppercase font-bold">Paid Leave</span>
                <span className="font-black text-blue-800 text-sm font-mono">{monthlyAttendanceStats.paidLeaves}</span>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-600 block uppercase font-bold">Payable Days</span>
                <span className="font-black text-slate-900 text-sm font-mono">{monthlyAttendanceStats.totalPayableDays}</span>
              </div>
            </div>

            {/* Records List */}
            {myAttendanceList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                No attendance recorded yet for this month.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Check In / Out</th>
                      <th className="p-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myAttendanceList.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{rec.date}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            rec.status === 'present' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            rec.status === 'half_day' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                            rec.status === 'paid_leave' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            rec.status === 'weekly_off' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                            'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {rec.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {rec.checkInTime || '-'} {rec.checkOutTime ? `→ ${rec.checkOutTime}` : ''}
                        </td>
                        <td className="p-2.5 text-slate-500 text-[11px]">{rec.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAttendanceHistoryOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SALESMAN SALARY STATEMENT (PAYSLIP)                                */}
      {/* ========================================================================= */}
      {isSalaryStatementOpen && myPayroll && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Official Salary Statement ({myPayroll.period})</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsSalaryStatementOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slip Canvas */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                <div>
                  <div className="font-black text-slate-900 text-sm">APNA STORE</div>
                  <div className="text-[10px] text-slate-500">Powered by Aryan Agency • FMCG Distribution • Utraula, UP</div>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-blue-700">{myPayroll.period}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-2 bg-white rounded-lg border border-slate-200">
                <div>Staff: <strong className="text-slate-900">{myPayroll.staffName}</strong></div>
                <div>ID: <strong className="font-mono text-blue-700">{myPayroll.employeeCode}</strong></div>
                <div>Role: <strong>{myPayroll.role}</strong></div>
                <div>Payable Days: <strong>{myPayroll.payableDays} / {myPayroll.totalDaysInMonth}</strong></div>
              </div>

              <div className="space-y-1.5 p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-600">Base Salary:</span>
                  <span className="font-mono font-bold">{formatINR(myPayroll.baseSalary)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Allowances:</span>
                  <span className="font-mono font-bold">+{formatINR(myPayroll.allowancesTotal)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Deductions / Advances:</span>
                  <span className="font-mono font-bold">-{formatINR(myPayroll.deductionsTotal + myPayroll.advancesDeducted)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900 text-sm">
                  <span>Net Salary Payable:</span>
                  <span className="font-mono text-blue-700">{formatINR(myPayroll.netPayable)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 pt-1">
                  <span>Disbursed (Amount Paid):</span>
                  <span className="font-mono font-bold">{formatINR(myPayroll.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Remaining Due:</span>
                  <span className="font-mono font-bold">{formatINR(myPayroll.remainingDue)}</span>
                </div>
              </div>

              {myPayroll.payments && myPayroll.payments.length > 0 && (
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100 space-y-1">
                  <div className="text-[10px] font-bold text-emerald-900 uppercase">Payment Vouchers:</div>
                  {myPayroll.payments.map(p => (
                    <div key={p.id} className="flex justify-between text-[10px] text-emerald-800 font-mono">
                      <span>{p.paymentDate} • {p.paymentMethod.toUpperCase()} {p.referenceNumber ? `(${p.referenceNumber})` : ''}</span>
                      <span className="font-bold">{formatINR(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSalaryStatementOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Beats Modal */}
      {isBeatsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-[#0B1E3F] via-[#0F274E] to-[#13284C] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Route className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold tracking-tight">Assigned Beats ({assignedBeats.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBeatsModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-500 font-medium pb-1">
                Field distribution beats assigned to <strong className="text-slate-800">{activeSalesman.name}</strong>:
              </p>
              {assignedBeats.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  No individual beats assigned. All depot retailer outlets are accessible for order booking.
                </div>
              ) : (
                assignedBeats.map((beatName, idx) => {
                  const outletsInBeat = assignedRetailers.filter(r => (r.beatName || '').toLowerCase() === beatName.toLowerCase());
                  const visitedInBeat = outletsInBeat.filter(r => visitedRetailerIdsToday.has(r.id)).length;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-colors">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">{beatName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {outletsInBeat.length} Assigned Outlets · {visitedInBeat} Visited Today
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBeatsModalOpen(false);
                          setRetailerSearch(beatName);
                          const el = document.getElementById('retailer-beat-section');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] shrink-0 cursor-pointer border border-blue-200/60"
                      >
                        Filter Beat
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Total Outlets: <strong>{assignedRetailers.length}</strong></span>
              <button
                type="button"
                onClick={() => setIsBeatsModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salesman Digital ID Card Modal */}
      {isIdCardOpen && myStaffProfile && (
        <StaffIdCardModal
          staff={myStaffProfile}
          isOpen={isIdCardOpen}
          onClose={() => setIsIdCardOpen(false)}
        />
      )}

    </div>
  );
};
