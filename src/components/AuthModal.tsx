import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { UserRole } from '../types';
import { 
  Building2, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ShieldCheck, 
  Briefcase, 
  Truck, 
  Calculator, 
  Store,
  X, 
  Check, 
  AlertCircle,
  Loader2,
  Database
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    signInWithEmail, 
    signUpWithEmail, 
    allUsers, 
    currentUser, 
    switchUser 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'demo'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>('salesman');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          setError('Please enter both email and password.');
          setLoading(false);
          return;
        }
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid credentials or user not registered in Supabase.');
        } else {
          setSuccessMsg('Signed in successfully!');
          setTimeout(() => closeAuthModal(), 500);
        }
      } else if (mode === 'signup') {
        if (!email || !password || !name) {
          setError('Please fill in your name, email, and password.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        const res = await signUpWithEmail(email, password, {
          name,
          phone: phoneNumber || '+91 98000 00000',
          role
        });
        if (!res.success) {
          setError(res.error || 'Failed to create account. Please try again.');
        } else {
          setSuccessMsg('Account created successfully in Supabase!');
          setTimeout(() => closeAuthModal(), 600);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoRole: UserRole) => {
    setEmail(demoEmail);
    setPassword('AryanAgency@2026');
    setRole(demoRole);
  };

  const getRoleIcon = (r: string) => {
    switch (r) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case 'salesman':
        return <Briefcase className="w-4 h-4 text-sky-500" />;
      case 'delivery':
        return <Truck className="w-4 h-4 text-emerald-500" />;
      case 'accounts':
        return <Calculator className="w-4 h-4 text-purple-500" />;
      case 'retailer':
        return <Store className="w-4 h-4 text-amber-500" />;
      default:
        return <User className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="bg-[#1e293b] text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Supabase Authentication</h2>
              <p className="text-xs text-slate-400">Aryan Agency FMCG Distribution Suite</p>
            </div>
          </div>
          <button 
            onClick={closeAuthModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Pill */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="flex items-center text-slate-600 font-medium">
            <Database className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Supabase PostgreSQL Status:
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[11px] ${
            isSupabaseConfigured 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isSupabaseConfigured ? 'Live Connected' : 'Local Prototype'}
          </span>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'border-[#2563eb] text-[#2563eb] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'border-[#2563eb] text-[#2563eb] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('demo'); setError(null); setSuccessMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'demo'
                ? 'border-[#2563eb] text-[#2563eb] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Fast Roles
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-start space-x-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'demo' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Click any persona below to immediately log in and test role-based access:
              </p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {allUsers.map((u) => {
                  const isCur = u.id === currentUser?.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={async () => {
                        await switchUser(u.id);
                        closeAuthModal();
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isCur
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                          {getRoleIcon(u.role)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email} &bull; <span className="capitalize font-medium">{u.role}</span></div>
                        </div>
                      </div>
                      {isCur && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role & Permissions</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    >
                      <option value="salesman">Salesman (DSR - Order Booking & Retailers)</option>
                      <option value="delivery">Delivery Partner (Trip Sheets & POD)</option>
                      <option value="accounts">Accounts & Finance (Ledger & Collections)</option>
                      <option value="admin">Distributor Admin (Full Access)</option>
                      <option value="retailer">Retailer (Portal & Order Invoices)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@aryanagency.in"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              {mode === 'signin' && (
                <div className="pt-1">
                  <p className="text-[11px] text-slate-500 font-medium mb-1.5">Quick Fill Demo Credentials:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('aryan@aryanagency.in', 'admin')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors"
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('rajesh.sales@aryanagency.in', 'salesman')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors"
                    >
                      Salesman
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('suresh.van1@aryanagency.in', 'delivery')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors"
                    >
                      Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('pooja.accounts@aryanagency.in', 'accounts')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors"
                    >
                      Accounts
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-2.5 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
