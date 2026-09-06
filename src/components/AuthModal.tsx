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
    signUpWithEmail
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
          phone: phoneNumber || '+91 98000 00000'
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

                  <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold text-blue-900">Registered as Retail Store Partner</p>
                      <p className="text-[10px] text-blue-700 leading-snug mt-0.5">
                        New accounts are created with the Retailer role. Privileged operational roles (Administrator, Sales Representative, Delivery, Accounts Officer) are strictly assigned by the Distributor Admin.
                      </p>
                    </div>
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
        </div>
      </div>
    </div>
  );
};
