import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Salesman } from '../types';
import { formatINR } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface SalesmenViewProps {
  salesmen: Salesman[];
  onSaveSalesman: (salesman: Partial<Salesman>) => Promise<void>;
  onDeleteSalesman?: (id: string) => Promise<void>;
  onOpenNewOrderForSalesman: (salesmanId: string) => void;
}

export const SalesmenView: React.FC<SalesmenViewProps> = ({
  salesmen,
  onSaveSalesman,
  onDeleteSalesman,
  onOpenNewOrderForSalesman
}) => {
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalesman, setEditingSalesman] = useState<Partial<Salesman> | null>(null);
  const [deletingSalesmanId, setDeletingSalesmanId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingSalesman({
      employeeCode: `EMP-AA-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      phone: '+91 ',
      email: '',
      assignedBeats: ['Indiranagar Retail Beat'],
      dailyTargetAmount: 70000,
      monthlyTargetAmount: 1800000,
      currentMonthAchieved: 0,
      commissionPercentage: 1.5,
      todayOrdersCount: 0,
      todaySalesAmount: 0,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (salesman: Salesman) => {
    setEditingSalesman({ ...salesman });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSalesman) return;
    await onSaveSalesman(editingSalesman);
    setIsModalOpen(false);
    setEditingSalesman(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Sales Representatives & DSR Beat Planning</h1>
          <p className="text-xs text-slate-500">Field sales force management, beat assignments, daily targets, and commission tracking</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Sales Representative</span>
          </button>
        )}
      </div>

      {/* Salesmen Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {salesmen.map((salesman) => {
          const pct = Math.min(100, Math.round((salesman.currentMonthAchieved / salesman.monthlyTargetAmount) * 100));
          const estimatedCommission = (salesman.currentMonthAchieved * salesman.commissionPercentage) / 100;

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
                        className="p-1 text-slate-400 hover:text-[#2563eb] rounded-md cursor-pointer"
                        title="Edit Salesman"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {onDeleteSalesman && (
                        <button
                          onClick={() => setDeletingSalesmanId(salesman.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          title="Delete Salesman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Assigned Beats */}
                <div className="mt-3.5 space-y-1 text-xs">
                  <span className="text-slate-500 font-semibold block text-[11px]">Assigned Beat Routes:</span>
                  <div className="flex flex-wrap gap-1">
                    {salesman.assignedBeats.map((beat, bIdx) => (
                      <span key={bIdx} className="status-pill status-info">
                        {beat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Target & Achievement Box */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
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
                    <span className="text-slate-600 font-mono">Commission: {formatINR(estimatedCommission)}</span>
                  </div>
                </div>

                {/* Today's Activity */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 text-center border border-slate-100">
                    <span className="text-slate-500 text-[10px] block font-medium">Today's Orders</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{salesman.todayOrdersCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 text-center border border-slate-100">
                    <span className="text-slate-500 text-[10px] block font-medium">Today's Sales</span>
                    <span className="font-mono font-bold text-[#2563eb] text-sm">{formatINR(salesman.todaySalesAmount)}</span>
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onOpenNewOrderForSalesman(salesman.id)}
                  className="w-full py-2 px-3 bg-[#1e293b] hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>+ Punch Order as {salesman.name.split(' ')[0]}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Salesman Modal */}
      {isModalOpen && editingSalesman && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingSalesman.id ? 'Edit Sales Representative' : 'Add Sales Representative (DSR)'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Employee Code</label>
                  <input
                    type="text"
                    required
                    value={editingSalesman.employeeCode || ''}
                    onChange={(e) => setEditingSalesman({ ...editingSalesman, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
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
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
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

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Sales Representative
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSalesmanId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Remove Sales Representative?</h3>
                <p className="text-[11px] text-slate-500">This will remove salesman from active beat routing.</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{salesmen.find(s => s.id === deletingSalesmanId)?.name}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingSalesmanId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (deletingSalesmanId && onDeleteSalesman) {
                    await onDeleteSalesman(deletingSalesmanId);
                    setDeletingSalesmanId(null);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Yes, Remove Salesman
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
