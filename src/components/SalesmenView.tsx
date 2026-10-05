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
  Filter
} from 'lucide-react';
import { Salesman, Retailer, User, UserRole } from '../types';
import { formatINR, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface SalesmenViewProps {
  salesmen: Salesman[];
  retailers?: Retailer[];
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
    name.includes('sapthagiri') ||
    owner.includes('laxmi supermarket') ||
    owner.includes('ganesh daily') ||
    owner.includes('ganesh provision') ||
    owner.includes('sapthagiri')
  );
};

export const SalesmenView: React.FC<SalesmenViewProps> = ({
  salesmen,
  retailers = [],
  onSaveSalesman,
  onDeleteSalesman,
  onDeleteBeat,
  onSaveRetailer,
  onOpenNewOrderForSalesman
}) => {
  const { isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState<'salesmen' | 'beat_mapping' | 'staff'>('salesmen');
  
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
  const handleOpenAdd = () => {
    setEditingSalesman({
      employeeCode: `EMP-AA-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      phone: '+91 ',
      email: '',
      assignedBeats: allBeats.length > 0 ? [allBeats[0]] : ['Utraula Retail Beat'],
      dailyTargetAmount: 70000,
      monthlyTargetAmount: 1800000,
      currentMonthAchieved: 0,
      commissionPercentage: 1.5,
      todayOrdersCount: 0,
      todaySalesAmount: 0,
      status: 'active'
    });
    setIsSalesmanModalOpen(true);
  };

  // Open Edit Salesman Modal
  const handleOpenEdit = (salesman: Salesman) => {
    setEditingSalesman({ ...salesman });
    setIsSalesmanModalOpen(true);
  };

  // Save Salesman Details
  const handleSaveSalesmanModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalesman) return;
    await onSaveSalesman(editingSalesman);
    setIsSalesmanModalOpen(false);
    setEditingSalesman(null);
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
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveSection('salesmen')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${activeSection === 'salesmen' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>DSR Salesmen ({salesmen.length})</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveSection('beat_mapping')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${activeSection === 'beat_mapping' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Route className="w-3.5 h-3.5 text-emerald-600" />
                <span>Beat & Retailer Mapping ({allBeats.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('staff')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${activeSection === 'staff' ? 'bg-white text-[#2563eb] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Staff Roles</span>
              </button>
            </div>
          )}

          {isAdmin && activeSection === 'salesmen' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Sales Representative</span>
            </button>
          )}

          {isAdmin && activeSection === 'beat_mapping' && (
            <button
              onClick={() => { setNewBeatInput(''); setIsNewBeatModalOpen(true); }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Beat Route</span>
            </button>
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
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingSalesman.id ? 'Edit Sales Representative' : 'Add New Sales Representative'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Sales force personnel and monthly delivery targets</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSalesmanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editingSalesman.phone || ''}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, phone: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
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
                    required
                    value={editingSalesman.dailyTargetAmount || 75000}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, dailyTargetAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Monthly Target (₹)</label>
                  <input
                    type="number"
                    required
                    value={editingSalesman.monthlyTargetAmount || 1800000}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, monthlyTargetAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
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
                    className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-lg shadow-xs cursor-pointer text-xs"
                  >
                    Save Sales Representative
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

    </div>
  );
};
