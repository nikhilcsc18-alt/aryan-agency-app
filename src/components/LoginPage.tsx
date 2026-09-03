import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { UserRole } from '../types';
import { 
  Building2, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Briefcase, 
  Truck, 
  Calculator, 
  Store, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Database,
  ArrowRight,
  UserCheck
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign up fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('salesman');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          setError('Please provide both your registered email address and password.');
          setLoading(false);
          return;
        }

        const res = await signInWithEmail(email.trim(), password);
        if (!res.success) {
          setError(res.error || 'Invalid credentials or user not registered in Supabase.');
        } else {
          setSuccess('Signed in successfully! Redirecting to Dashboard...');
          if (onLoginSuccess) {
            setTimeout(onLoginSuccess, 400);
          }
        }
      } else {
        if (!name.trim() || !email.trim() || !password) {
          setError('Please fill in your full name, email address, and password.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        const res = await signUpWithEmail(email.trim(), password, {
          name: name.trim(),
          phone: phone.trim() || '+91 98000 00000',
          role
        });

        if (!res.success) {
          setError(res.error || 'Failed to create Supabase user account.');
        } else {
          setSuccess('Account created and authenticated in Supabase! Redirecting to Dashboard...');
          if (onLoginSuccess) {
            setTimeout(onLoginSuccess, 400);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (demoEmail: string, demoRole: UserRole) => {
    setMode('signin');
    setEmail(demoEmail);
    setPassword('AryanAgency@2026');
    setError(null);
    setSuccess(`Credentials filled for ${demoRole.toUpperCase()}. Click 'Sign In to Dashboard' below.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle Background Elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        {/* Company Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 mb-3.5 ring-4 ring-blue-500/20">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Aryan Agency
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-medium">
            FMCG Distribution & Supply Chain ERP
          </p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 font-medium inline-flex items-center gap-1.5">
              <Database className="w-3 h-3 text-blue-400" />
              Supabase Auth Connected
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              Bengaluru, KA
            </span>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Top Notice: Protected Portal */}
          <div className="bg-slate-950/70 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              Protected Portal: Authentication Required
            </span>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active RLS
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccess(null);
              }}
              className={`py-3 text-xs font-semibold text-center transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccess(null);
              }}
              className={`py-3 text-xs font-semibold text-center transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Authentication Form */}
          <div className="p-6 sm:p-7">
            {error && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs flex items-start space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98860 34567"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      FMCG Operational Role <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="salesman">Sales Representative (Beat & Orders)</option>
                      <option value="delivery">Delivery Driver (Logistics & POD)</option>
                      <option value="accounts">Accounts Officer (Reconciliation & GST)</option>
                      <option value="admin">Administrator (Full ERP Control)</option>
                      <option value="retailer">Retailer (Store Order Portal)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@aryanagency.in"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  {mode === 'signin' && (
                    <span className="text-[11px] text-slate-400">
                      Default: <span className="font-mono text-slate-300">AryanAgency@2026</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying with Supabase...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In to Dashboard' : 'Create & Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Quick-Fill Verified Supabase Accounts
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillCredentials('aryan@aryanagency.in', 'admin')}
                  className="text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-md bg-blue-900/50 text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-white group-hover:text-blue-400 truncate">Admin: Aryan Sharma</div>
                    <div className="text-[10px] text-slate-500 font-mono">aryan@aryanagency.in</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('rajesh.sales@aryanagency.in', 'salesman')}
                  className="text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-md bg-sky-900/50 text-sky-400 flex items-center justify-center shrink-0">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-white group-hover:text-sky-400 truncate">Salesman: Rajesh Kumar</div>
                    <div className="text-[10px] text-slate-500 font-mono">rajesh.sales@...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('suresh.van1@aryanagency.in', 'delivery')}
                  className="text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-900/50 text-emerald-400 flex items-center justify-center shrink-0">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-white group-hover:text-emerald-400 truncate">Delivery: Suresh Gowda</div>
                    <div className="text-[10px] text-slate-500 font-mono">suresh.van1@...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('pooja.accounts@aryanagency.in', 'accounts')}
                  className="text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-md bg-purple-900/50 text-purple-400 flex items-center justify-center shrink-0">
                    <Calculator className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-white group-hover:text-purple-400 truncate">Accounts: Pooja Agarwal</div>
                    <div className="text-[10px] text-slate-500 font-mono">pooja.accounts@...</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillCredentials('laxmi.supermarket@gmail.com', 'retailer')}
                  className="text-left p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer group sm:col-span-2"
                >
                  <div className="w-6 h-6 rounded-md bg-amber-900/50 text-amber-400 flex items-center justify-center shrink-0">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-white group-hover:text-amber-400 truncate">Retailer: Laxmi Supermarket</div>
                    <div className="text-[10px] text-slate-500 font-mono">laxmi.supermarket@gmail.com</div>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Footer Security Badge */}
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800/80 text-center">
            <p className="text-[10px] text-slate-500">
              Enterprise ISO 9001:2015 & GST Compliant • Supabase Session Persistence Active
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
