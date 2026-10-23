import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Target, 
  TrendingUp, 
  Phone, 
  Plus, 
  Edit, 
  Check, 
  X, 
  MapPin, 
  Award,
  CalendarCheck,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  UserCheck,
  Search,
  Route,
  Store,
  Layers,
  CheckSquare,
  Square,
  ArrowRight,
  Filter,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  IndianRupee,
  ListTodo
} from 'lucide-react';
import { Salesman, Retailer, User, UserRole, SalesmanTask, SalesTarget, TaskType, TaskPriority, TaskStatus, Order, PaymentRecord } from '../types';
import { formatINR, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface SalesmenViewProps {
  salesmen: Salesman[];
  retailers?: Retailer[];
  orders?: Order[];
  payments?: PaymentRecord[];
  onSaveSalesman: (salesman: Partial<Salesman>) => Promise<void>;
  onDeleteSalesman?: (id: string) => Promise<void>;
  onDeleteBeat?: (beatName: string) => Promise<void>;
  onSaveRetailer?: (retailer: Partial<Retailer>) => Promise<void>;
  onOpenNewOrderForSalesman: (salesmanId: string) => void;
}

const DEFAULT_BEAT_ROUTES = [
  'Utraula Retail Beat',
  'Balrampur Central Beat',
  'Jarwa Rural Beat',
  'Tulsipur Provision Beat',
  'Pachperwa Market Beat',
  'Rehra Bazar Beat',
  'Gaindas Bujurg Beat',
  'Mankapur Road Beat'
];

const isPurgedStore = (r: Retailer) => {
  const name = (r.storeName || '').toLowerCase();
  const owner = (r.ownerName || '').toLowerCase();
  return (
    name.includes('laxmi supermarket') ||
    name.includes('ganesh daily') ||
    name.includes('ganesh provision') ||
    name.includes('sapthagiri super') ||
    owner.includes('laxmi supermarket') ||
    owner.includes('ganesh daily') ||
    owner.includes('sapthagiri store')
  );
};

export const SalesmenView: React.FC<SalesmenViewProps> = ({
  salesmen,
  retailers = [],
  orders = [],
  payments = [],
  onSaveSalesman,
  onDeleteSalesman,
  onDeleteBeat,
  onSaveRetailer,
  onOpenNewOrderForSalesman
}) => {
  const { isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<'salesmen' | 'beat_mapping' | 'tasks_targets' | 'staff'>('salesmen');

  // New Sales Executive Account Creation State
  const [newSalesmanEmail, setNewSalesmanEmail] = useState('');
  const [newSalesmanPassword, setNewSalesmanPassword] = useState('');
  const [showNewSalesmanPassword, setShowNewSalesmanPassword] = useState(false);
  const [newSalesmanTargetDate, setNewSalesmanTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salesmanCreationError, setSalesmanCreationError] = useState<string | null>(null);
  const [isCreatingSalesman, setIsCreatingSalesman] = useState(false);

  // Field Tasks & Targets State (Admin Management)
  const [adminTasks, setAdminTasks] = useState<SalesmanTask[]>([]);
  const [adminTargets, setAdminTargets] = useState<SalesTarget[]>([]);
  const [loadingTasksTargets, setLoadingTasksTargets] = useState(false);
  const [tasksSalesmanFilter, setTasksSalesmanFilter] = useState<string>('all');
  const [tasksStatusFilter, setTasksStatusFilter] = useState<string>('all');
  const [tasksTypeFilter, setTasksTypeFilter] = useState<string>('all');
  
  // Assign Task Modal State
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [assignTaskSalesmanId, setAssignTaskSalesmanId] = useState('');
  const [assignTaskRetailerId, setAssignTaskRetailerId] = useState('');
  const [assignTaskType, setAssignTaskType] = useState<TaskType>('visit');
  const [assignTaskTitle, setAssignTaskTitle] = useState('');
  const [assignTaskDescription, setAssignTaskDescription] = useState('');
  const [assignTaskTargetAmount, setAssignTaskTargetAmount] = useState<number | ''>('');
  const [assignTaskTargetQuantity, setAssignTaskTargetQuantity] = useState<number | ''>('');
  const [assignTaskStartDate, setAssignTaskStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [assignTaskDueDate, setAssignTaskDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [assignTaskPriority, setAssignTaskPriority] = useState<TaskPriority>('normal');
  const [assignTaskFollowUpDate, setAssignTaskFollowUpDate] = useState('');
  const [assignTaskNotes, setAssignTaskNotes] = useState('');
  const [assignTaskModalError, setAssignTaskModalError] = useState<string | null>(null);
  const [isSavingAssignTask, setIsSavingAssignTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Update Quota / Target Modal State
  const [isUpdateTargetModalOpen, setIsUpdateTargetModalOpen] = useState(false);
  const [targetUpdateSalesmanId, setTargetUpdateSalesmanId] = useState('');
  const [targetUpdatePeriod, setTargetUpdatePeriod] = useState<'monthly' | 'daily'>('monthly');
  const [targetUpdateAmount, setTargetUpdateAmount] = useState<number>(1800000);
  const [targetUpdateEffectiveDate, setTargetUpdateEffectiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [targetUpdateNotes, setTargetUpdateNotes] = useState('');
  const [isSavingTargetUpdate, setIsSavingTargetUpdate] = useState(false);
  
  // Cleaned retailers list (excluding demo purged stores)
  const validRetailers = retailers.filter(r => !isPurgedStore(r));

  // Beat Management State
  const [customBeats, setCustomBeats] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fmcg_custom_beats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedBeats, setDeletedBeats] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fmcg_deleted_beats');
      return saved ? JSON.parse(saved) : [
        'Indiranagar Retail Beat',
        'MG Road Commercial Beat',
        'Koramangala Daily Beat',
        'Whitefield Supermarket Beat',
        'Jayanagar Provision Beat'
      ];
    } catch {
      return [
        'Indiranagar Retail Beat',
        'MG Road Commercial Beat',
        'Koramangala Daily Beat',
        'Whitefield Supermarket Beat',
        'Jayanagar Provision Beat'
      ];
    }
  });

  // Aggregate all active beats (case-insensitive check)
  const allBeats = Array.from(new Set([
    ...DEFAULT_BEAT_ROUTES,
    ...validRetailers.map(r => r.beatName),
    ...salesmen.flatMap(s => s.assignedBeats || []),
    ...customBeats
  ])).filter(b => Boolean(b) && !deletedBeats.some(db => db.toLowerCase() === b.toLowerCase()));

  // Modals & Selection state
  const [isSalesmanModalOpen, setIsSalesmanModalOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Partial<Salesman> | null>(null);
  const [deletingSalesmanId, setDeletingSalesmanId] = useState<string | null>(null);
  const [deletingBeatName, setDeletingBeatName] = useState<string | null>(null);
  const [isDeletingBeat, setIsDeletingBeat] = useState(false);
  
  // Beat Assignment Modal for a specific salesman
  const [assigningBeatsSalesman, setAssigningBeatsSalesman] = useState<Salesman | null>(null);
  const [selectedBeatsForSalesman, setSelectedBeatsForSalesman] = useState<string[]>([]);
  const [isAssigningSaving, setIsAssigningSaving] = useState(false);

  // Beat to Retailer Mapping Modal
  const [mappingBeatTarget, setMappingBeatTarget] = useState<string | null>(null);
  const [selectedRetailerIdsForBeat, setSelectedRetailerIdsForBeat] = useState<string[]>([]);
  const [retailerSearchInModal, setRetailerSearchInModal] = useState('');
  const [isMappingSaving, setIsMappingSaving] = useState(false);

  // New Beat Route Modal
  const [isNewBeatModalOpen, setIsNewBeatModalOpen] = useState(false);
  const [newBeatInput, setNewBeatInput] = useState('');

  // Search & Filter in Beat Mapping Tab
  const [beatSearchQuery, setBeatSearchQuery] = useState('');
  const [beatSalesmanFilter, setBeatSalesmanFilter] = useState('all');

  // Staff & Role Management State (Admin only)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStaffUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await api.getUsers();
      setUsersList(data || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'staff' && isAdmin) {
      loadStaffUsers();
    }
  }, [activeSection, isAdmin]);

  const loadAdminTasksAndTargets = async () => {
    try {
      setLoadingTasksTargets(true);
      const [tList, tgtList] = await Promise.all([
        api.getSalesmanTasks().catch(() => []),
        api.getSalesTargets().catch(() => [])
      ]);
      setAdminTasks(tList || []);
      setAdminTargets(tgtList || []);
    } catch (e) {
      console.error('Failed to load tasks/targets for admin:', e);
    } finally {
      setLoadingTasksTargets(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'tasks_targets' && isAdmin) {
      loadAdminTasksAndTargets();
    }
  }, [activeSection, isAdmin]);

  const resetAssignTaskForm = () => {
    setEditingTaskId(null);
    setAssignTaskSalesmanId(salesmen[0]?.id || '');
    setAssignTaskRetailerId('');
    setAssignTaskType('visit');
    setAssignTaskTitle('');
    setAssignTaskDescription('');
    setAssignTaskTargetAmount('');
    setAssignTaskTargetQuantity('');
    setAssignTaskStartDate(new Date().toISOString().split('T')[0]);
    setAssignTaskDueDate(new Date().toISOString().split('T')[0]);
    setAssignTaskPriority('normal');
    setAssignTaskFollowUpDate('');
    setAssignTaskNotes('');
    setAssignTaskModalError(null);
  };

  const handleOpenAssignTask = (salesmanId?: string, retailerId?: string) => {
    resetAssignTaskForm();
    if (salesmanId) setAssignTaskSalesmanId(salesmanId);
    if (retailerId) setAssignTaskRetailerId(retailerId);
    setIsAssignTaskModalOpen(true);
  };

  const handleEditTask = (task: SalesmanTask) => {
    setEditingTaskId(task.id);
    setAssignTaskSalesmanId(task.salesmanId);
    setAssignTaskRetailerId(task.retailerId || '');
    setAssignTaskType(task.taskType || 'visit');
    setAssignTaskTitle(task.title);
    setAssignTaskDescription(task.description || '');
    setAssignTaskTargetAmount(task.targetAmount !== undefined ? task.targetAmount : '');
    setAssignTaskTargetQuantity(task.targetQuantity !== undefined ? task.targetQuantity : '');
    setAssignTaskStartDate(task.startDate || new Date().toISOString().split('T')[0]);
    setAssignTaskDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setAssignTaskPriority(task.priority || 'normal');
    setAssignTaskFollowUpDate(task.followUpDate || '');
    setAssignTaskNotes(task.completionNotes || '');
    setAssignTaskModalError(null);
    setIsAssignTaskModalOpen(true);
  };

  const handleSaveAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTaskTitle.trim()) {
      setAssignTaskModalError('Please enter a task title.');
      return;
    }
    if (!assignTaskSalesmanId) {
      setAssignTaskModalError('Please select a sales executive.');
      return;
    }

    setIsSavingAssignTask(true);
    setAssignTaskModalError(null);

    try {
      const selectedSalesman = salesmen.find(s => s.id === assignTaskSalesmanId);
      const selectedRetailer = validRetailers.find(r => r.id === assignTaskRetailerId);
      const payload: Partial<SalesmanTask> = {
        salesmanId: assignTaskSalesmanId,
        salesmanName: selectedSalesman?.name || undefined,
        retailerId: assignTaskRetailerId || undefined,
        retailerName: selectedRetailer?.storeName || undefined,
        retailerPhone: selectedRetailer?.phone || undefined,
        retailerAddress: selectedRetailer?.address || undefined,
        beatName: selectedRetailer?.beatName || undefined,
        taskType: assignTaskType,
        title: assignTaskTitle.trim(),
        description: assignTaskDescription.trim() || undefined,
        priority: assignTaskPriority,
        startDate: assignTaskStartDate,
        dueDate: assignTaskDueDate,
        targetAmount: assignTaskTargetAmount !== '' ? Number(assignTaskTargetAmount) : undefined,
        targetQuantity: assignTaskTargetQuantity !== '' ? Number(assignTaskTargetQuantity) : undefined,
        followUpDate: assignTaskFollowUpDate || undefined,
        status: 'pending'
      };

      if (editingTaskId) {
        await api.updateSalesmanTask(editingTaskId, payload);
        setStatusMessage({ type: 'success', text: 'Task successfully updated and reassigned.' });
      } else {
        await api.saveSalesmanTask(payload);
        setStatusMessage({ type: 'success', text: 'Task successfully assigned to Sales Executive!' });
      }

      setIsAssignTaskModalOpen(false);
      resetAssignTaskForm();
      await loadAdminTasksAndTargets();
    } catch (err: any) {
      console.error('Save task error:', err);
      setAssignTaskModalError(err?.message || 'Failed to save and assign task.');
    } finally {
      setIsSavingAssignTask(false);
    }
  };

  const handleSaveTargetUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUpdateSalesmanId) {
      setStatusMessage({ type: 'error', text: 'Please select a sales executive.' });
      return;
    }
    if (!targetUpdateAmount || Number(targetUpdateAmount) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid target amount.' });
      return;
    }

    setIsSavingTargetUpdate(true);
    try {
      await api.saveSalesTarget({
        salesmanId: targetUpdateSalesmanId,
        period: targetUpdatePeriod,
        targetAmount: Number(targetUpdateAmount),
        effectiveStartDate: targetUpdateEffectiveDate,
        notes: targetUpdateNotes.trim() || undefined
      });
      setStatusMessage({ type: 'success', text: `Sales target of ${formatINR(Number(targetUpdateAmount))} assigned successfully!` });
      setIsUpdateTargetModalOpen(false);
      await loadAdminTasksAndTargets();
    } catch (err: any) {
      console.error('Save target error:', err);
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save sales target.' });
    } finally {
      setIsSavingTargetUpdate(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.updateSalesmanTaskStatus(taskId, newStatus);
      setStatusMessage({ type: 'success', text: `Task marked as "${newStatus}".` });
      await loadAdminTasksAndTargets();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update task status.' });
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      setIsDeletingTask(true);
      await api.deleteSalesmanTask(deletingTaskId);
      setStatusMessage({ type: 'success', text: 'Task deleted successfully.' });
      setDeletingTaskId(null);
      await loadAdminTasksAndTargets();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to delete task.' });
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(userId);
      setStatusMessage(null);
      await api.updateUserRole(userId, newRole);
      setStatusMessage({ type: 'success', text: `User operational role updated to "${newRole}".` });
      await loadStaffUsers();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update user role' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Create New Beat
  const handleCreateBeat = (beatName: string) => {
    const trimmed = beatName.trim();
    if (!trimmed) return;
    const updatedDeleted = deletedBeats.filter(b => b.toLowerCase() !== trimmed.toLowerCase());
    setDeletedBeats(updatedDeleted);
    try {
      localStorage.setItem('fmcg_deleted_beats', JSON.stringify(updatedDeleted));
    } catch {}

    if (!customBeats.includes(trimmed)) {
      const updated = [...customBeats, trimmed];
      setCustomBeats(updated);
      try {
        localStorage.setItem('fmcg_custom_beats', JSON.stringify(updated));
      } catch {}
    }
    setIsNewBeatModalOpen(false);
    setNewBeatInput('');
  };

  // Delete Beat Route (Remove "Faltu" Beat)
  const handleDeleteBeat = (beatToDelete: string) => {
    setDeletingBeatName(beatToDelete);
  };

  const handleConfirmDeleteBeat = async () => {
    if (!deletingBeatName) return;
    const targetBeat = deletingBeatName;
    try {
      setIsDeletingBeat(true);
      const targetLower = targetBeat.toLowerCase();

      // 1. Mark in deleted beats
      const updatedDeleted = Array.from(new Set([...deletedBeats, targetBeat]));
      setDeletedBeats(updatedDeleted);
      try {
        localStorage.setItem('fmcg_deleted_beats', JSON.stringify(updatedDeleted));
      } catch {}

      // 2. Remove from custom beats
      const updatedCustom = customBeats.filter(b => b.toLowerCase() !== targetLower);
      setCustomBeats(updatedCustom);
      try {
        localStorage.setItem('fmcg_custom_beats', JSON.stringify(updatedCustom));
      } catch {}

      // 3. Unassign from any salesman who had this beat
      for (const s of salesmen) {
        if (s.assignedBeats && s.assignedBeats.some(b => b.toLowerCase() === targetLower)) {
          const nextBeats = s.assignedBeats.filter(b => b.toLowerCase() !== targetLower);
          try {
            await onSaveSalesman({ ...s, assignedBeats: nextBeats });
          } catch (e) {
            console.warn('Failed to unassign beat from salesman during beat deletion:', e);
          }
        }
      }

      // 4. Reassign any retailers assigned to this beat
      if (onSaveRetailer) {
        for (const r of validRetailers) {
          if (r.beatName && r.beatName.toLowerCase() === targetLower) {
            try {
              await onSaveRetailer({ ...r, beatName: 'Utraula Retail Beat' });
            } catch (e) {
              console.warn('Failed to reassign retailer during beat deletion:', e);
            }
          }
        }
      }

      // 5. Sync to server
      if (onDeleteBeat) {
        try {
          await onDeleteBeat(targetBeat);
        } catch (e) {
          console.warn('Failed to delete beat via server:', e);
        }
      }
    } catch (e) {
      console.warn('Error during beat deletion:', e);
    } finally {
      setIsDeletingBeat(false);
      setDeletingBeatName(null);
    }
  };

  // Assign or Reassign a Beat to a Salesman directly from the Mapping Matrix
  const handleAssignBeatToSalesman = async (beatName: string, targetSalesmanId: string) => {
    try {
      if (targetSalesmanId === 'none') {
        // Unassign from all salesmen currently holding it
        for (const s of salesmen) {
          if (s.assignedBeats?.includes(beatName)) {
            const nextBeats = s.assignedBeats.filter(b => b !== beatName);
            await onSaveSalesman({ ...s, assignedBeats: nextBeats });
          }
        }
      } else {
        // Find new salesman
        const targetSalesman = salesmen.find(s => s.id === targetSalesmanId);
        if (!targetSalesman) return;

        // Unassign from old salesmen first
        for (const s of salesmen) {
          if (s.id !== targetSalesmanId && s.assignedBeats?.includes(beatName)) {
            const nextBeats = s.assignedBeats.filter(b => b !== beatName);
            await onSaveSalesman({ ...s, assignedBeats: nextBeats });
          }
        }

        // Add to new salesman
        const currentBeats = targetSalesman.assignedBeats || [];
        if (!currentBeats.includes(beatName)) {
          const nextBeats = [...currentBeats, beatName];
          await onSaveSalesman({ ...targetSalesman, assignedBeats: nextBeats });
        }
      }
    } catch (err: any) {
      console.error('Failed to update salesman beat assignment:', err);
      alert('Error updating salesman beat assignment: ' + (err?.message || 'Unknown error'));
    }
  };

  // Move a specific Retailer to another Beat
  const handleMoveRetailerToBeat = async (retailer: Retailer, newBeatName: string) => {
    if (!onSaveRetailer) return;
    try {
      await onSaveRetailer({
        id: retailer.id,
        storeName: retailer.storeName,
        ownerName: retailer.ownerName,
        phone: retailer.phone,
        address: retailer.address,
        area: retailer.area,
        beatName: newBeatName
      });
    } catch (err: any) {
      console.error('Failed to move retailer to beat:', err);
      alert('Failed to update retailer beat: ' + (err?.message || 'Error'));
    }
  };

  // Open Bulk Retailer Mapping Modal for a Beat
  const handleOpenBulkMapModal = (beatName: string) => {
    setMappingBeatTarget(beatName);
    const currentlyInBeat = validRetailers
      .filter(r => r.beatName === beatName)
      .map(r => r.id);
    setSelectedRetailerIdsForBeat(currentlyInBeat);
    setRetailerSearchInModal('');
  };

  // Save Bulk Retailer Mapping
  const handleSaveBulkMapping = async () => {
    if (!mappingBeatTarget || !onSaveRetailer) return;
    setIsMappingSaving(true);
    try {
      // 1. Retailers that should now be in this beat
      const toAdd = validRetailers.filter(r => selectedRetailerIdsForBeat.includes(r.id) && r.beatName !== mappingBeatTarget);
      for (const r of toAdd) {
        await onSaveRetailer({
          id: r.id,
          storeName: r.storeName,
          ownerName: r.ownerName,
          phone: r.phone,
          address: r.address,
          area: r.area,
          beatName: mappingBeatTarget
        });
      }

      // 2. Retailers that were unselected from this beat -> set to Unassigned or default
      const toRemove = validRetailers.filter(r => !selectedRetailerIdsForBeat.includes(r.id) && r.beatName === mappingBeatTarget);
      for (const r of toRemove) {
        await onSaveRetailer({
          id: r.id,
          storeName: r.storeName,
          ownerName: r.ownerName,
          phone: r.phone,
          address: r.address,
          area: r.area,
          beatName: 'Unassigned'
        });
      }

      setMappingBeatTarget(null);
    } catch (err: any) {
      console.error('Failed to save bulk mapping:', err);
      alert('Failed to save retailer mapping: ' + (err?.message || 'Error'));
    } finally {
      setIsMappingSaving(false);
    }
  };

  // Open Salesman Beat Assignment Modal
  const handleOpenAssignBeatsModal = (salesman: Salesman) => {
    setAssigningBeatsSalesman(salesman);
    setSelectedBeatsForSalesman([...(salesman.assignedBeats || [])]);
  };

  // Save Salesman Beat Assignment
  const handleSaveAssignBeats = async () => {
    if (!assigningBeatsSalesman) return;
    setIsAssigningSaving(true);
    try {
      await onSaveSalesman({
        ...assigningBeatsSalesman,
        assignedBeats: selectedBeatsForSalesman
      });
      setAssigningBeatsSalesman(null);
    } catch (err: any) {
      console.error('Failed to save beats for salesman:', err);
      alert('Failed to save salesman beats: ' + (err?.message || 'Error'));
    } finally {
      setIsAssigningSaving(false);
    }
  };

  // Open Add Salesman Modal
  // Open Add Salesman Modal
  const handleOpenAdd = () => {
    setEditingSalesman({
      employeeCode: `EMP-SE-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      phone: '',
      email: '',
      assignedBeats: allBeats.length > 0 ? [allBeats[0]] : ['Utraula Retail Beat'],
      dailyTargetAmount: 75000,
      monthlyTargetAmount: 1800000,
      currentMonthAchieved: 0,
      commissionPercentage: 1.5,
      todayOrdersCount: 0,
      todaySalesAmount: 0,
      status: 'active'
    });
    setNewSalesmanEmail('');
    setNewSalesmanPassword('');
    setShowNewSalesmanPassword(false);
    setNewSalesmanTargetDate(new Date().toISOString().split('T')[0]);
    setSalesmanCreationError(null);
    setIsSalesmanModalOpen(true);
  };

  // Open Edit Salesman Modal
  const handleOpenEdit = (salesman: Salesman) => {
    setEditingSalesman({ ...salesman });
    setNewSalesmanEmail(salesman.email || '');
    setSalesmanCreationError(null);
    setIsSalesmanModalOpen(true);
  };

  // Save Salesman Details (Creates Auth Account for new salesman, or updates existing)
  const handleSaveSalesmanModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalesman) return;

    if (!editingSalesman.id) {
      // POINT 1: Create Sales Executive with full name, email, password, phone, beats, target
      const cleanEmail = (newSalesmanEmail || editingSalesman.email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setSalesmanCreationError('A valid work email address is required for executive sign-in.');
        return;
      }
      if (!newSalesmanPassword || newSalesmanPassword.trim().length < 6) {
        setSalesmanCreationError('Login password must be at least 6 characters long.');
        return;
      }
      const rawPhone = (editingSalesman.phone || '').replace(/\D/g, '').slice(-10);
      if (rawPhone.length !== 10) {
        setSalesmanCreationError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      if (!editingSalesman.name || !editingSalesman.name.trim()) {
        setSalesmanCreationError('Please enter the full name of the Sales Executive.');
        return;
      }

      setIsCreatingSalesman(true);
      setSalesmanCreationError(null);

      try {
        const res = await api.createSalesExecutive({
          name: editingSalesman.name.trim(),
          email: cleanEmail,
          password: newSalesmanPassword.trim(),
          phone: `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`,
          assignedBeats: editingSalesman.assignedBeats && editingSalesman.assignedBeats.length > 0 
            ? editingSalesman.assignedBeats 
            : ['Utraula Retail Beat'],
          dailyTargetAmount: editingSalesman.dailyTargetAmount || 0,
          monthlyTargetAmount: editingSalesman.monthlyTargetAmount || 0,
          commissionPercentage: editingSalesman.commissionPercentage || 1.5,
          targetEffectiveDate: newSalesmanTargetDate
        });

        if (res && res.success && res.salesman) {
          await onSaveSalesman(res.salesman);
          setIsSalesmanModalOpen(false);
          setEditingSalesman(null);
          setNewSalesmanPassword('');
          setNewSalesmanEmail('');
          setStatusMessage({ 
            type: 'success', 
            text: `Sales Executive "${res.salesman.name}" registered successfully! Code: ${res.salesman.employeeCode}. Login credentials linked to Supabase/ERP.` 
          });
          if (activeSection === 'tasks_targets') {
            loadAdminTasksAndTargets();
          }
        } else {
          setSalesmanCreationError(res?.message || 'Failed to create sales executive account.');
        }
      } catch (err: any) {
        console.error('Error creating sales executive:', err);
        setSalesmanCreationError(err?.message || 'Server error occurred while creating executive.');
      } finally {
        setIsCreatingSalesman(false);
      }
    } else {
      // Editing existing salesman
      try {
        await onSaveSalesman(editingSalesman);
        setIsSalesmanModalOpen(false);
        setEditingSalesman(null);
      } catch (err: any) {
        setSalesmanCreationError(err?.message || 'Failed to update sales representative.');
      }
    }
  };

  // Delete Salesman Confirmed
  const handleDeleteSalesmanConfirmed = async () => {
    if (!deletingSalesmanId || !onDeleteSalesman) return;
    const id = deletingSalesmanId;
    setDeletingSalesmanId(null);
    try {
      await onDeleteSalesman(id);
    } catch (err) {
      console.error('Failed to delete salesman:', err);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  // Filtered Beats for Matrix View
  const filteredBeatsForMatrix = allBeats.filter(b => {
    const matchesSearch = b.toLowerCase().includes(beatSearchQuery.toLowerCase()) ||
      validRetailers.some(r => r.beatName === b && (r.storeName.toLowerCase().includes(beatSearchQuery.toLowerCase()) || r.ownerName.toLowerCase().includes(beatSearchQuery.toLowerCase())));

    if (beatSalesmanFilter === 'all') return matchesSearch;
    if (beatSalesmanFilter === 'unassigned') {
      const isAssigned = salesmen.some(s => s.assignedBeats?.includes(b));
      return matchesSearch && !isAssigned;
    }
    const salesman = salesmen.find(s => s.id === beatSalesmanFilter);
    return matchesSearch && (salesman?.assignedBeats?.includes(b) ?? false);
  });

  // Retailers without any mapped beat or obsolete beat
  const unassignedRetailers = validRetailers.filter(r => !r.beatName || r.beatName === 'Unassigned' || !allBeats.includes(r.beatName));

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {activeSection === 'salesmen' 
              ? 'Sales Force & Beat Targets' 
              : activeSection === 'beat_mapping'
              ? 'Beat Route & Retailer Mapping Matrix'
              : 'Internal Staff & Role-Based Authorization'}
          </h1>
          <p className="text-xs text-slate-500">
            {activeSection === 'salesmen'
              ? 'Field sales force management, beat assignments, daily targets, and commission tracking'
              : activeSection === 'beat_mapping'
              ? 'Map specific kirana retailers to beat routes and allocate each beat to dedicated sales representatives'
              : 'Manage operational staff accounts and assign authoritative roles (Admin, Sales, Delivery, Accounts)'}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {isAdmin && (
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSection('salesmen')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSection === 'salesmen' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>DSR Salesmen ({salesmen.length})</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSection('beat_mapping')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSection === 'beat_mapping' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Route className="w-3.5 h-3.5 text-emerald-600" />
                <span>Beat & Retailer Mapping ({allBeats.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('tasks_targets')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSection === 'tasks_targets' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Target className="w-3.5 h-3.5 text-purple-600" />
                <span>Tasks & Targets</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('staff')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${activeSection === 'staff' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Staff Roles</span>
              </button>
            </div>
          )}

          {isAdmin && activeSection === 'salesmen' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Sales Representative</span>
            </button>
          )}

          {isAdmin && activeSection === 'beat_mapping' && (
            <button
              onClick={() => { setNewBeatInput(''); setIsNewBeatModalOpen(true); }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Beat Route</span>
            </button>
          )}

          {isAdmin && activeSection === 'tasks_targets' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenAssignTask()}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Assign Task</span>
              </button>
              <button
                onClick={() => {
                  setTargetUpdateSalesmanId(salesmen[0]?.id || '');
                  setTargetUpdatePeriod('monthly');
                  setTargetUpdateAmount(1800000);
                  setIsUpdateTargetModalOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Set Target</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: SALESMEN VIEW                                                  */}
      {/* ========================================================================= */}
      {activeSection === 'salesmen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {salesmen.map((salesman) => {
            const pct = Math.min(100, Math.round((salesman.currentMonthAchieved / salesman.monthlyTargetAmount) * 100));

            return (
              <div 
                key={salesman.id}
                className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-[#2563eb]/60 transition-colors"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#1e293b] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {salesman.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{salesman.name}</h3>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                          <span>{salesman.employeeCode}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">{salesman.commissionPercentage}% Comm.</span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEdit(salesman)}
                          className="p-1.5 text-slate-400 hover:text-[#2563eb] rounded-md cursor-pointer"
                          title="Edit Salesman"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {onDeleteSalesman && (
                          <button
                            onClick={() => setDeletingSalesmanId(salesman.id)}
                            className="px-2 py-1 text-xs font-semibold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center space-x-1 cursor-pointer"
                            title="Delete this Sales Representative"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 flex items-center text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span className="font-mono">{salesman.phone}</span>
                  </div>

                  {/* Assigned Beats with Quick Action */}
                  <div className="mt-3.5 space-y-1.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 font-bold text-[11px] flex items-center">
                        <Route className="w-3 h-3 mr-1 text-emerald-600" />
                        Assigned Beats ({salesman.assignedBeats?.length || 0}):
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenAssignBeatsModal(salesman)}
                          className="text-[11px] text-[#2563eb] hover:underline font-bold cursor-pointer"
                        >
                          + Assign / Change Beat
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {salesman.assignedBeats && salesman.assignedBeats.length > 0 ? (
                        salesman.assignedBeats.map((beat, bIdx) => (
                          <span 
                            key={bIdx} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {beat}
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const nextBeats = salesman.assignedBeats.filter(b => b !== beat);
                                  await onSaveSalesman({ ...salesman, assignedBeats: nextBeats });
                                }}
                                className="ml-1 text-blue-400 hover:text-rose-600 cursor-pointer"
                                title="Unassign Beat"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No beats assigned yet. Click "+ Assign / Change Beat".</span>
                      )}
                    </div>
                  </div>

                  {/* Target & Achievement Box */}
                  <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Monthly Target:</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(salesman.monthlyTargetAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Achieved MTD:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatINR(salesman.currentMonthAchieved)}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-[#2563eb]' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">{pct}% Completed</span>
                      <span>Target: {formatINR(salesman.dailyTargetAmount)}/day</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between space-x-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenAssignBeatsModal(salesman)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer flex items-center space-x-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Assign Beats</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenNewOrderForSalesman(salesman.id)}
                    className="flex-1 px-3 py-1.5 text-xs font-bold rounded-md bg-[#2563eb] hover:bg-[#1d4ed8] text-white cursor-pointer shadow-xs transition-colors text-center"
                  >
                    + Punch Order
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DEDICATED BEAT ROUTE & RETAILER MAPPING MATRIX                 */}
      {/* ========================================================================= */}
      {activeSection === 'beat_mapping' && (
        <div className="space-y-5">
          {/* Summary Metric Strip & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Active Beats</span>
                <span className="text-xl font-extrabold text-slate-900">{allBeats.length}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Mapped Outlets</span>
                <span className="text-xl font-extrabold text-emerald-800">
                  {validRetailers.filter(r => r.beatName && r.beatName !== 'Unassigned' && allBeats.includes(r.beatName)).length}
                </span>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Field Salesmen</span>
                <span className="text-xl font-extrabold text-blue-800">{salesmen.length}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Unassigned Outlets</span>
                <span className="text-xl font-extrabold text-amber-800">{unassignedRetailers.length}</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search beats, retailers or proprietors..."
                  value={beatSearchQuery}
                  onChange={(e) => setBeatSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter by Salesman:</span>
                <select
                  value={beatSalesmanFilter}
                  onChange={(e) => setBeatSalesmanFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                >
                  <option value="all">All Beats ({allBeats.length})</option>
                  <option value="unassigned">Unassigned Beats</option>
                  {salesmen.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.assignedBeats?.length || 0} beats)</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Unassigned Outlets Alert Banner (if any) */}
          {unassignedRetailers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {unassignedRetailers.length} Retailer Outlets are not mapped to an active beat!
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Assign them to delivery routes below so salesmen can plan daily visits and punch orders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Master Beat Route Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredBeatsForMatrix.map((beat) => {
              const retailersInBeat = validRetailers.filter(r => r.beatName === beat);
              const assignedSalesman = salesmen.find(s => s.assignedBeats?.includes(beat));

              return (
                <div 
                  key={beat}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors overflow-hidden"
                >
                  {/* Top Bar for this Beat */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Route className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{beat}</h3>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {retailersInBeat.length} Kirana Outlets Mapped
                        </span>
                      </div>
                    </div>

                    {/* Salesman Assignment Dropdown for this Beat */}
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Assigned Salesman</label>
                        <select
                          value={assignedSalesman ? assignedSalesman.id : 'none'}
                          onChange={(e) => handleAssignBeatToSalesman(beat, e.target.value)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                        >
                          <option value="none">-- Not Assigned --</option>
                          {salesmen.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.employeeCode})</option>
                          ))}
                        </select>
                      </div>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteBeat(beat)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Delete Beat Route"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Retailers List mapped to this Beat */}
                  <div className="p-4 flex-1 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Retailers on this Beat ({retailersInBeat.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenBulkMapModal(beat)}
                        className="text-xs font-bold text-[#2563eb] hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Map / Add Retailers</span>
                      </button>
                    </div>

                    {retailersInBeat.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {retailersInBeat.map((r) => (
                          <div 
                            key={r.id} 
                            className="p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:bg-slate-100/60 transition-colors"
                          >
                            <div className="space-y-0.5 max-w-[65%]">
                              <span className="font-bold text-slate-900 block truncate">{r.storeName}</span>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                <span>{r.ownerName}</span>
                                <span>•</span>
                                <span className="font-mono">{r.phone}</span>
                              </div>
                            </div>

                            {/* Move Retailer to another Beat Dropdown */}
                            <div className="flex items-center space-x-1.5 shrink-0">
                              <select
                                value={r.beatName}
                                onChange={(e) => handleMoveRetailerToBeat(r, e.target.value)}
                                className="px-2 py-1 text-[11px] rounded border border-slate-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                                title="Move this shop to another beat"
                              >
                                {allBeats.map(b => (
                                  <option key={b} value={b}>{b}</option>
                                ))}
                                <option value="Unassigned">Unassigned</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                        <Store className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <span>No retailers mapped to this beat yet.</span>
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => handleOpenBulkMapModal(beat)}
                            className="px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded text-xs hover:bg-blue-100"
                          >
                            + Map Retailers Now
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Total Due on Beat:{' '}
                      <strong className="text-slate-900 font-mono">
                        {formatINR(retailersInBeat.reduce((acc, curr) => acc + (curr.currentOutstanding || 0), 0))}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenBulkMapModal(beat)}
                      className="text-[#2563eb] font-bold hover:underline"
                    >
                      Manage Outlets →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unassigned Retailers Table / Card */}
          {unassignedRetailers.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-300 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Unassigned Outlets ({unassignedRetailers.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">These stores currently do not belong to any active delivery beat.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {unassignedRetailers.map(r => (
                  <div key={r.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block truncate">{r.storeName}</span>
                      <span className="text-[11px] text-slate-500">{r.ownerName} • {r.phone}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                      <span className="text-[11px] font-semibold text-slate-600">Assign Beat:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleMoveRetailerToBeat(r, e.target.value);
                        }}
                        defaultValue=""
                        className="px-2 py-1 text-xs rounded border border-amber-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      >
                        <option value="" disabled>Select Beat Route...</option>
                        {allBeats.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: FIELD TASKS & SALES TARGETS MANAGEMENT                           */}
      {/* ========================================================================= */}
      {activeSection === 'tasks_targets' && isAdmin && (() => {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Filter tasks
        const filteredTasks = adminTasks.filter(t => {
          if (tasksSalesmanFilter !== 'all' && t.salesmanId !== tasksSalesmanFilter) return false;
          if (tasksTypeFilter !== 'all' && t.taskType !== tasksTypeFilter) return false;
          if (tasksStatusFilter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
          if (tasksStatusFilter === 'completed') return t.status === 'completed';
          if (tasksStatusFilter === 'overdue') return (t.status === 'pending' || t.status === 'in_progress') && t.dueDate < todayStr;
          if (tasksStatusFilter === 'cancelled') return t.status === 'cancelled';
          if (tasksStatusFilter === 'closed') return t.status === 'closed';
          return true;
        });

        const totalTasks = adminTasks.length;
        const pendingTasks = adminTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
        const completedTasks = adminTasks.filter(t => t.status === 'completed').length;
        const overdueTasks = adminTasks.filter(t => (t.status === 'pending' || t.status === 'in_progress') && t.dueDate < todayStr).length;

        // Calculate total sales achievements from genuine orders
        const currentMonth = todayStr.slice(0, 7);
        const monthOrders = (orders || []).filter(o => o.orderDate?.startsWith(currentMonth) && o.status !== 'cancelled');
        const totalMonthSales = monthOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
        const totalTargetsAmount = adminTargets.filter(tgt => tgt.period === 'monthly').reduce((sum, t) => sum + (t.targetAmount || 0), 0);
        const achievementPct = totalTargetsAmount > 0 ? Math.round((totalMonthSales / totalTargetsAmount) * 100) : 0;

        return (
          <div className="space-y-6">
            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Tasks</span>
                  <ListTodo className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-black text-slate-900 mt-1">{totalTasks}</p>
                <span className="text-[10px] text-slate-400">Assigned across field force</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600">Pending</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-amber-600 mt-1">{pendingTasks}</p>
                <span className="text-[10px] text-slate-400">In-progress / queued</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600">Completed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-600 mt-1">{completedTasks}</p>
                <span className="text-[10px] text-slate-400">Successfully closed</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-600">Overdue</span>
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-2xl font-black text-rose-600 mt-1">{overdueTasks}</p>
                <span className="text-[10px] text-rose-500 font-medium">Due date passed</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600">Achievement</span>
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-black text-blue-600 mt-1">{achievementPct}%</p>
                <span className="text-[10px] text-slate-400">{formatINR(totalMonthSales)} of {formatINR(totalTargetsAmount || 1)}</span>
              </div>
            </div>

            {/* Filter and Control Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-500" /> Filter:
                  </span>
                  
                  {/* Salesman Filter */}
                  <select
                    value={tasksSalesmanFilter}
                    onChange={(e) => setTasksSalesmanFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="all">All Sales Executives ({salesmen.length})</option>
                    {salesmen.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.employeeCode || s.id})</option>
                    ))}
                  </select>

                  {/* Task Type Filter */}
                  <select
                    value={tasksTypeFilter}
                    onChange={(e) => setTasksTypeFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="all">All Task Types</option>
                    <option value="visit">Retailer Visit</option>
                    <option value="target">Sales Target</option>
                    <option value="order_booking">Order Booking</option>
                    <option value="collection">Payment Recovery</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="other">Other</option>
                  </select>

                  {/* Status Pills */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'overdue', label: 'Overdue' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setTasksStatusFilter(st.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                          tasksStatusFilter === st.id 
                            ? 'bg-white text-purple-700 shadow-2xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAssignTask()}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Assign Retailer Task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetUpdateSalesmanId(salesmen[0]?.id || '');
                      setTargetUpdatePeriod('monthly');
                      setTargetUpdateAmount(1800000);
                      setIsUpdateTargetModalOpen(true);
                    }}
                    className="px-3.5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Set Sales Target</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Task Assignments Table & Cards */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-purple-600" />
                    <span>Assigned Retailer Tasks & Objectives ({filteredTasks.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tasks and targets saved to database and synchronized live to Salesman mobile dashboard
                  </p>
                </div>
                {loadingTasksTargets && (
                  <div className="flex items-center space-x-1 text-xs text-purple-600">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </div>
                )}
              </div>

              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <ListTodo className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No tasks match your current filter</p>
                  <p className="text-xs text-slate-400">Click &ldquo;+ Assign Retailer Task&rdquo; to assign a new field task to a sales representative.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenAssignTask()}
                    className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign First Task</span>
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const isTaskOverdue = (task.status === 'pending' || task.status === 'in_progress') && task.dueDate < todayStr;
                    const assignedSalesman = salesmen.find(s => s.id === task.salesmanId);
                    
                    // Live tracking from genuine orders & payments
                    const taskOrders = (orders || []).filter(o => 
                      task.retailerId 
                        ? o.retailerId === task.retailerId && o.status !== 'cancelled'
                        : o.salesmanId === task.salesmanId && o.status !== 'cancelled'
                    );
                    const bookedSales = taskOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
                    const deliveredSales = taskOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
                    const retailerPayments = (payments || []).filter(p => task.retailerId && p.retailerId === task.retailerId);
                    const collectedPayments = retailerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

                    // Target progress
                    const targetAmt = task.targetAmount || 0;
                    const targetProgressPct = targetAmt > 0 ? Math.min(100, Math.round((bookedSales / targetAmt) * 100)) : 0;

                    return (
                      <div key={task.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          {/* Task Main Info */}
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Task Type Badge */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                task.taskType === 'visit' ? 'bg-blue-100 text-blue-800' :
                                task.taskType === 'target' ? 'bg-purple-100 text-purple-800' :
                                task.taskType === 'order_booking' ? 'bg-emerald-100 text-emerald-800' :
                                task.taskType === 'collection' ? 'bg-amber-100 text-amber-800' :
                                task.taskType === 'follow_up' ? 'bg-cyan-100 text-cyan-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {task.taskType.replace('_', ' ')}
                              </span>

                              {/* Priority Badge */}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.priority === 'urgent' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                task.priority === 'high' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {task.priority.toUpperCase()} PRIORITY
                              </span>

                              {/* Status Badge */}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                isTaskOverdue ? 'bg-rose-100 text-rose-800 animate-pulse' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'cancelled' ? 'bg-slate-100 text-slate-500 line-through' :
                                'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {isTaskOverdue ? '⚠️ OVERDUE' : task.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs text-slate-600">
                              <div className="flex items-center space-x-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Salesman: <b>{task.salesmanName || assignedSalesman?.name || 'Unassigned'}</b></span>
                              </div>

                              {task.retailerName && (
                                <div className="flex items-center space-x-1.5">
                                  <Store className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>Retailer: <b>{task.retailerName}</b> {task.beatName ? `(${task.beatName})` : ''}</span>
                                </div>
                              )}

                              <div className="flex items-center space-x-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Due: <b className={isTaskOverdue ? 'text-rose-600' : ''}>{task.dueDate}</b></span>
                              </div>

                              {task.targetAmount !== undefined && task.targetAmount > 0 && (
                                <div className="flex items-center space-x-1.5">
                                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Sales Target: <b>{formatINR(task.targetAmount)}</b></span>
                                </div>
                              )}

                              {task.targetQuantity !== undefined && task.targetQuantity > 0 && (
                                <div className="flex items-center space-x-1.5">
                                  <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                  <span>Qty Target: <b>{task.targetQuantity} cases/units</b></span>
                                </div>
                              )}

                              {task.followUpDate && (
                                <div className="flex items-center space-x-1.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>Follow-up: <b>{task.followUpDate}</b></span>
                                </div>
                              )}
                            </div>

                            {/* Actual Performance Tracking vs Target from Genuine Orders */}
                            {(task.targetAmount !== undefined && task.targetAmount > 0) && (
                              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                                <div className="flex items-center justify-between font-semibold">
                                  <span className="text-slate-700">Live Sales Target Achievement:</span>
                                  <span className={targetProgressPct >= 100 ? 'text-emerald-700 font-bold' : 'text-blue-700 font-bold'}>
                                    {targetProgressPct}% ({formatINR(bookedSales)} / {formatINR(task.targetAmount)})
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${targetProgressPct >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(100, targetProgressPct)}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                  <span>Booked: {formatINR(bookedSales)}</span>
                                  <span>Delivered: {formatINR(deliveredSales)}</span>
                                  <span>Recovered: {formatINR(collectedPayments)}</span>
                                </div>
                              </div>
                            )}

                            {/* Completion Remarks */}
                            {task.completionNotes && (
                              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                                <p className="font-bold flex items-center gap-1 text-[11px] text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Field Completion Notes & Evidence:</span>
                                </p>
                                <p className="mt-0.5 leading-relaxed">{task.completionNotes}</p>
                                {task.completedAt && (
                                  <p className="text-[10px] text-emerald-700 mt-1">Submitted: {new Date(task.completedAt).toLocaleString()}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Admin Action Buttons */}
                          <div className="flex lg:flex-col items-center lg:items-end justify-end space-x-2 lg:space-x-0 lg:space-y-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                            {task.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer"
                                title="Mark Task as Completed"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleEditTask(task)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Edit Instructions, Target, or Reassign"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500" />
                              <span>Edit / Reassign</span>
                            </button>

                            {task.status !== 'cancelled' && task.status !== 'closed' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateTaskStatus(task.id, 'cancelled')}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                title="Cancel this task"
                              >
                                Cancel Task
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeletingTaskId(task.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Permanently Delete Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Salesmen Monthly Quota & Targets Management Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span>Sales Representatives Target Quotas</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly & Daily sales targets configured for each Sales Executive
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTargetUpdateSalesmanId(salesmen[0]?.id || '');
                    setTargetUpdatePeriod('monthly');
                    setTargetUpdateAmount(1800000);
                    setIsUpdateTargetModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Update Sales Target</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesmen.map((slm) => {
                  const slmTarget = adminTargets.find(t => t.salesmanId === slm.id && t.period === 'monthly') || {
                    targetAmount: slm.monthlyTargetAmount || 1500000
                  };
                  const slmOrders = (orders || []).filter(o => o.salesmanId === slm.id && o.orderDate?.startsWith(currentMonth) && o.status !== 'cancelled');
                  const actualSales = slmOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || 0), 0);
                  const progressPct = slmTarget.targetAmount > 0 ? Math.round((actualSales / slmTarget.targetAmount) * 100) : 0;

                  return (
                    <div key={slm.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {slm.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{slm.name}</p>
                            <p className="text-[10px] text-slate-500">{slm.employeeCode || slm.id}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetUpdateSalesmanId(slm.id);
                            setTargetUpdatePeriod('monthly');
                            setTargetUpdateAmount(slmTarget.targetAmount || 1800000);
                            setIsUpdateTargetModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                          title="Edit Target"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Monthly Target:</span>
                          <span className="font-bold text-slate-900">{formatINR(slmTarget.targetAmount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Actual Booked:</span>
                          <span className="font-bold text-emerald-700">{formatINR(actualSales)}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 mt-1.5 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full ${progressPct >= 100 ? 'bg-emerald-600' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-right font-bold text-slate-500 pt-0.5">
                          {progressPct}% achieved this month
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* SECTION 3: STAFF ROLES & PERMISSIONS                                      */}
      {/* ========================================================================= */}
      {activeSection === 'staff' && isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Registered Accounts & Access Roles</h2>
              <p className="text-xs text-slate-500">Control who can access DSR order punch, retailer KYC, deliveries, and accounting</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff accounts..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs font-semibold ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {statusMessage.text}
            </div>
          )}

          {loadingUsers ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
              <span className="text-xs font-medium">Loading staff accounts...</span>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3 text-right">Change Role Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-semibold text-slate-900">{user.name || user.email || 'Staff Member'}</td>
                      <td className="p-3 text-slate-500 font-mono">{user.phone || user.email || '-'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          disabled={updatingUserId === user.id}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded bg-white font-medium focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                        >
                          <option value="salesman">Salesman (DSR)</option>
                          <option value="admin">Administrator</option>
                          <option value="accounts">Accounts & Finance</option>
                          <option value="delivery">Delivery Dispatch</option>
                          <option value="retailer">Retailer Outlet</option>
                        </select>
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
      {/* MODAL 1: ASSIGN BEATS TO SALESMAN                                         */}
      {/* ========================================================================= */}
      {assigningBeatsSalesman && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assign Beat Routes</h3>
                  <p className="text-[11px] text-slate-500">{assigningBeatsSalesman.name} ({assigningBeatsSalesman.employeeCode})</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setAssigningBeatsSalesman(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Select Beats to Assign:</span>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBeatsForSalesman([...allBeats])}
                    className="text-[11px] text-[#2563eb] hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBeatsForSalesman([])}
                    className="text-[11px] text-slate-500 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Beats Checklist */}
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2.5">
                {allBeats.map(beat => {
                  const isChecked = selectedBeatsForSalesman.includes(beat);
                  const outletsCount = validRetailers.filter(r => r.beatName === beat).length;
                  return (
                    <label 
                      key={beat} 
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${isChecked ? 'bg-blue-50/80 border border-blue-200 text-blue-900' : 'hover:bg-slate-50 border border-transparent text-slate-700'}`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBeatsForSalesman(prev => [...prev, beat]);
                            } else {
                              setSelectedBeatsForSalesman(prev => prev.filter(b => b !== beat));
                            }
                          }}
                          className="w-4 h-4 text-[#2563eb] rounded focus:ring-0 cursor-pointer"
                        />
                        <span className="font-semibold">{beat}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">({outletsCount} shops)</span>
                    </label>
                  );
                })}
              </div>

              {/* Inline Add Beat */}
              <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="+ Add new beat name..."
                  value={newBeatInput}
                  onChange={(e) => setNewBeatInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newBeatInput.trim()) {
                      handleCreateBeat(newBeatInput.trim());
                      setSelectedBeatsForSalesman(prev => [...prev, newBeatInput.trim()]);
                      setNewBeatInput('');
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 cursor-pointer"
                >
                  Add Beat
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAssigningBeatsSalesman(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAssigningSaving}
                onClick={handleSaveAssignBeats}
                className="px-4 py-1.5 text-xs font-bold bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg shadow-xs cursor-pointer flex items-center space-x-1"
              >
                {isAssigningSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                <span>Save Beat Assignment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MAP RETAILERS TO BEAT ROUTE                                      */}
      {/* ========================================================================= */}
      {mappingBeatTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Map Retailers to Beat Route</h3>
                  <p className="text-[11px] text-slate-500">Route: <strong className="text-slate-800">{mappingBeatTarget}</strong></p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setMappingBeatTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search kirana stores to map..."
                  value={retailerSearchInModal}
                  onChange={(e) => setRetailerSearchInModal(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Select Outlets ({selectedRetailerIdsForBeat.length} selected):
                </span>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRetailerIdsForBeat(validRetailers.map(r => r.id))}
                    className="text-[11px] text-[#2563eb] hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRetailerIdsForBeat([])}
                    className="text-[11px] text-slate-500 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Retailer checklist */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2.5">
                {validRetailers
                  .filter(r => {
                    const q = retailerSearchInModal.toLowerCase();
                    return r.storeName.toLowerCase().includes(q) || r.ownerName.toLowerCase().includes(q);
                  })
                  .map(r => {
                    const isChecked = selectedRetailerIdsForBeat.includes(r.id);
                    const isOtherBeat = r.beatName && r.beatName !== mappingBeatTarget && r.beatName !== 'Unassigned';
                    return (
                      <label 
                        key={r.id} 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${isChecked ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-900' : 'hover:bg-slate-50 border border-transparent text-slate-700'}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRetailerIdsForBeat(prev => [...prev, r.id]);
                              } else {
                                setSelectedRetailerIdsForBeat(prev => prev.filter(id => id !== r.id));
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <span className="font-semibold block">{r.storeName}</span>
                            <span className="text-[10px] text-slate-400">{r.ownerName} • {r.phone}</span>
                          </div>
                        </div>

                        {isOtherBeat && !isChecked && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            in {r.beatName}
                          </span>
                        )}
                      </label>
                    );
                  })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setMappingBeatTarget(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMappingSaving}
                onClick={handleSaveBulkMapping}
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer flex items-center space-x-1"
              >
                {isMappingSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                <span>Save Retailer Mapping</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE NEW BEAT ROUTE                                            */}
      {/* ========================================================================= */}
      {isNewBeatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Route className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Beat Route</h3>
                  <p className="text-[11px] text-slate-500">Add a new delivery beat route</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsNewBeatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateBeat(newBeatInput); }} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold text-xs mb-1">Beat Route Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pachperwa Market Beat"
                  value={newBeatInput}
                  onChange={(e) => setNewBeatInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewBeatModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Create Beat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD / EDIT SALESMAN MODAL                                        */}
      {/* ========================================================================= */}
      {isSalesmanModalOpen && editingSalesman && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingSalesman.id ? 'Edit Sales Representative' : 'Add New Sales Executive'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingSalesman.id ? 'Update employee profile and assigned beats' : 'Registers authentication login, role & employee record'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSalesmanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {salesmanCreationError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{salesmanCreationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSalesmanModal} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={editingSalesman.employeeCode || ''}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSalesman.name || ''}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
              </div>

              {/* Login Email Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Work Email ID * (Sign-In Username)</span>
                </label>
                <input
                  type="email"
                  required
                  value={editingSalesman.id ? (editingSalesman.email || '') : newSalesmanEmail}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (editingSalesman.id) {
                      setEditingSalesman({ ...editingSalesman, email: val });
                    } else {
                      setNewSalesmanEmail(val);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  placeholder="executive@aryanagency.in"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  The executive will use this email address to log in to the Salesman Dashboard.
                </span>
              </div>

              {/* Password Setup (For new accounts) */}
              {!editingSalesman.id && (
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex items-center space-x-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Login Password / Temporary Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewSalesmanPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newSalesmanPassword}
                      onChange={(e) => setNewSalesmanPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      placeholder="Minimum 6 characters (e.g. Sales@2026)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewSalesmanPassword(!showNewSalesmanPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      {showNewSalesmanPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Secured and registered with Supabase Authentication and ERP authorization.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number (10 Digits) *</label>
                  <input
                    type="text"
                    required
                    value={editingSalesman.phone || ''}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, phone: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Commission %</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingSalesman.commissionPercentage || 1.5}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, commissionPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
              </div>

              {/* Beat Selection */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Beat Routes:</label>
                <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {allBeats.map(beat => {
                    const isChecked = editingSalesman.assignedBeats?.includes(beat);
                    return (
                      <label key={beat} className="flex items-center space-x-2 p-1 rounded hover:bg-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = editingSalesman.assignedBeats || [];
                            const updated = e.target.checked
                              ? [...current, beat]
                              : current.filter(b => b !== beat);
                            setEditingSalesman({ ...editingSalesman, assignedBeats: updated });
                          }}
                          className="w-3.5 h-3.5 text-[#2563eb] rounded"
                        />
                        <span className="text-slate-800 font-medium">{beat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Daily Target (₹)</label>
                  <input
                    type="number"
                    value={editingSalesman.dailyTargetAmount || 0}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, dailyTargetAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="e.g. 75000 (0 if none)"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Monthly Target (₹)</label>
                  <input
                    type="number"
                    value={editingSalesman.monthlyTargetAmount || 0}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, monthlyTargetAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    placeholder="e.g. 1800000 (0 if none)"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between space-x-2">
                {editingSalesman?.id && onDeleteSalesman && isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = editingSalesman.id!;
                      setIsSalesmanModalOpen(false);
                      setDeletingSalesmanId(id);
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer transition-colors"
                    title="Permanently remove this sales representative"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete Salesman</span>
                  </button>
                )}

                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsSalesmanModalOpen(false)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSalesman}
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-lg shadow-xs cursor-pointer text-xs flex items-center space-x-1"
                  >
                    {isCreatingSalesman && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                    <span>{editingSalesman.id ? 'Save Updates' : 'Create Sales Executive'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DELETE SALESMAN CONFIRMATION                                     */}
      {/* ========================================================================= */}
      {deletingSalesmanId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Remove Sales Representative?</h3>
                <p className="text-[11px] text-slate-500">Confirm removal of sales representative</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{salesmen.find(s => s.id === deletingSalesmanId)?.name}</strong>? Their assigned beats will be unallocated.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingSalesmanId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSalesmanConfirmed}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs cursor-pointer"
              >
                Yes, Remove Salesman
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DELETE BEAT ROUTE CONFIRMATION                                   */}
      {/* ========================================================================= */}
      {deletingBeatName && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Beat Route?</h3>
                <p className="text-[11px] text-slate-500">Remove delivery route from system</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs space-y-1">
              <p className="font-bold text-slate-900">
                Beat: <span className="text-rose-700 font-extrabold">{deletingBeatName}</span>
              </p>
              <p className="text-slate-600 text-[11px]">
                Are you sure you want to delete this beat route? It will be automatically unassigned from salesmen and all outlets on this beat will be moved to the default route.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingBeat}
                onClick={() => setDeletingBeatName(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBeat}
                onClick={handleConfirmDeleteBeat}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-75"
              >
                {isDeletingBeat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeletingBeat ? 'Deleting...' : 'Yes, Delete Beat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ASSIGN / EDIT RETAILER TASK (ADMIN ONLY)                          */}
      {/* ========================================================================= */}
      {isAssignTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <ListTodo className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTaskId ? 'Edit / Reassign Field Task' : 'Assign Retailer Task & Sales Target'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingTaskId ? 'Modify instructions, target, or assigned salesman' : 'Assign specific retailer visit, sales target, or recovery goal to Sales Executive'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignTaskModalOpen(false);
                  resetAssignTaskForm();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAssignTask} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {assignTaskModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold">{assignTaskModalError}</span>
                </div>
              )}

              {/* Row 1: Salesman & Retailer Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Select Sales Executive <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignTaskSalesmanId}
                    onChange={(e) => setAssignTaskSalesmanId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="" disabled>Choose Sales Executive...</option>
                    {salesmen.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.employeeCode || s.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Target Retail Outlet
                  </label>
                  <select
                    value={assignTaskRetailerId}
                    onChange={(e) => setAssignTaskRetailerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">-- General / Area Wide Task --</option>
                    {validRetailers.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.storeName} ({r.beatName || 'General Beat'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Task Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Task Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignTaskType}
                    onChange={(e) => setAssignTaskType(e.target.value as TaskType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="visit">📍 Retailer Visit</option>
                    <option value="target">🎯 Sales Target</option>
                    <option value="order_booking">📦 Order Booking</option>
                    <option value="collection">💰 Payment Recovery</option>
                    <option value="follow_up">📞 Follow-up</option>
                    <option value="other">📋 Other / Custom Directive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Priority Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assignTaskPriority}
                    onChange={(e) => setAssignTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="normal">🟢 Normal Priority</option>
                    <option value="high">🟡 High Priority</option>
                    <option value="urgent">🔴 Urgent / Escalated</option>
                  </select>
                </div>
              </div>

              {/* Task Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={assignTaskTitle}
                  onChange={(e) => setAssignTaskTitle(e.target.value)}
                  placeholder="e.g. Visit Paras Kirana, pitch Parle-G combo, collect overdue payment"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Instructions & Objectives
                </label>
                <textarea
                  value={assignTaskDescription}
                  onChange={(e) => setAssignTaskDescription(e.target.value)}
                  rows={2}
                  placeholder="Detailed guidelines for the sales representative during visit..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-normal text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Row 3: Target Amount & Target Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Sales Target Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={assignTaskTargetAmount}
                      onChange={(e) => setAssignTaskTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 25000"
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Target Quantity (Cases / Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={assignTaskTargetQuantity}
                    onChange={(e) => setAssignTaskTargetQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50 cases"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Row 4: Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={assignTaskStartDate}
                    onChange={(e) => setAssignTaskStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={assignTaskDueDate}
                    onChange={(e) => setAssignTaskDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Follow-up Date (Optional)</label>
                  <input
                    type="date"
                    value={assignTaskFollowUpDate}
                    onChange={(e) => setAssignTaskFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSavingAssignTask}
                  onClick={() => {
                    setIsAssignTaskModalOpen(false);
                    resetAssignTaskForm();
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAssignTask}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-75"
                >
                  {isSavingAssignTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSavingAssignTask ? 'Saving Assignment...' : editingTaskId ? 'Update Task' : 'Save & Assign Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: SET SALES TARGET / QUOTA MODAL                                    */}
      {/* ========================================================================= */}
      {isUpdateTargetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configure Sales Target</h3>
                  <p className="text-xs text-slate-500">Assign official sales revenue target in ₹</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUpdateTargetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTargetUpdate} className="p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Sales Executive <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetUpdateSalesmanId}
                  onChange={(e) => setTargetUpdateSalesmanId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>Choose Sales Representative...</option>
                  {salesmen.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.employeeCode || s.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Period</label>
                  <select
                    value={targetUpdatePeriod}
                    onChange={(e) => setTargetUpdatePeriod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly Target</option>
                    <option value="daily">Daily Target</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={targetUpdateEffectiveDate}
                    onChange={(e) => setTargetUpdateEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Target Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={targetUpdateAmount}
                    onChange={(e) => setTargetUpdateAmount(Number(e.target.value))}
                    required
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-base text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  value={targetUpdateNotes}
                  onChange={(e) => setTargetUpdateNotes(e.target.value)}
                  placeholder="e.g. Diwali festive wholesale drive target"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  disabled={isSavingTargetUpdate}
                  onClick={() => setIsUpdateTargetModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTargetUpdate}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-75"
                >
                  {isSavingTargetUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isSavingTargetUpdate ? 'Saving Target...' : 'Save Sales Target'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: DELETE TASK CONFIRMATION                                         */}
      {/* ========================================================================= */}
      {deletingTaskId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Assigned Task?</h3>
                <p className="text-[11px] text-slate-500">Remove task assignment from system</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this task? It will be removed immediately from both the Admin Console and the Salesman dashboard.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={() => setDeletingTaskId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={handleConfirmDeleteTask}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-75"
              >
                {isDeletingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeletingTask ? 'Deleting...' : 'Yes, Delete Task'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
