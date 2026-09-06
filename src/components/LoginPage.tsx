import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { User } from '../types';
import { AryanAgencyLogo } from './AryanAgencyLogo';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  User as UserIcon,
  Phone,
  ShoppingCart,
  FileText,
  BookOpen,
  Receipt,
  MapPin,
  Headphones,
  Sparkles,
  LogIn
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: (user?: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('aryan_remembered_email');
      const savedRemember = localStorage.getItem('aryan_remember_me');
      if (savedEmail) {
        setEmail(savedEmail);
      }
      if (savedRemember !== null) {
        setRememberMe(savedRemember === 'true');
      }
    } catch {
      // ignore storage error
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
          setError('Please provide both your registered email address and password.');
          setLoading(false);
          return;
        }

        // Save or remove remembered email
        try {
          if (rememberMe) {
            localStorage.setItem('aryan_remembered_email', cleanEmail);
            localStorage.setItem('aryan_remember_me', 'true');
          } else {
            localStorage.removeItem('aryan_remembered_email');
            localStorage.setItem('aryan_remember_me', 'false');
          }
        } catch {
          // ignore storage error
        }

        console.log('[LoginPage] Submitting authentication for:', cleanEmail);
        const res = await signInWithEmail(cleanEmail, password);

        if (!res.success) {
          console.error('[LoginPage Auth Error]:', res.error);
          setError(res.error || 'Invalid email or password. Please verify your credentials and try again.');
        } else {
          console.log('[LoginPage] Authentication successful:', res.user?.email, 'Role:', res.user?.role);
          setSuccess(`Signed in successfully! Redirecting to Dashboard...`);
          if (!rememberMe) {
            setEmail('');
          }
          setPassword('');
          if (onLoginSuccess) {
            setTimeout(() => {
              onLoginSuccess(res.user);
            }, 300);
          }
        }
      } else if (mode === 'signup') {
        const cleanName = name.trim();
        const cleanEmail = email.trim();
        if (!cleanName || !cleanEmail || !password) {
          setError('Please fill in your full name, email address, and password.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        console.log('[LoginPage] Submitting registration for:', cleanEmail);
        const res = await signUpWithEmail(cleanEmail, password, {
          name: cleanName,
          phone: phone.trim() || '+91 94500 00000'
        });

        if (!res.success) {
          console.error('[LoginPage Registration Error]:', res.error);
          setError(res.error || 'Failed to create user account. Please check your credentials or contact administrator.');
        } else {
          console.log('[LoginPage] Registration successful for:', cleanEmail);
          setSuccess('Account created and authenticated! Redirecting to Dashboard...');
          setEmail('');
          setPassword('');
          setName('');
          setPhone('');
          if (onLoginSuccess) {
            setTimeout(() => {
              onLoginSuccess(res.user);
            }, 300);
          }
        }
      } else if (mode === 'forgot') {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
          setError('Please enter your registered work email address.');
          setLoading(false);
          return;
        }

        const res = await resetPassword(cleanEmail);
        if (!res.success) {
          setError(res.error || 'Could not process password reset request. Please check the email address.');
        } else {
          setSuccess(res.message || 'Password reset instructions have been dispatched to your email.');
        }
      }
    } catch (err: any) {
      console.error('[LoginPage Unexpected Error]:', err);
      setError(err.message || 'An unexpected authentication error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans selection:bg-blue-600 selection:text-white bg-slate-900 relative overflow-x-hidden">
      
      {/* Main Split Screen Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-screen relative">
        
        {/* ========================================================= */}
        {/* LEFT SIDE: BRANDING, FEATURES & FMCG SHOWCASE (~55%)     */}
        {/* ========================================================= */}
        <section className="w-full lg:w-[55%] xl:w-[56%] bg-gradient-to-br from-[#041530] via-[#092248] to-[#0d2a58] text-white p-6 sm:p-8 md:p-10 lg:p-12 relative flex flex-col justify-between overflow-hidden z-10 shadow-2xl">
          
          {/* Subtle Background Pattern & Ambient Glows */}
          <div 
            className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute bottom-10 left-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />

          {/* TOP SECTION: LOGO, COMPANY NAME & TAGLINE */}
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              {/* 3D Isometric Cube Logo with ® symbol */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                <img 
                  src="/assets/aryan_agency_icon.png" 
                  alt="Aryan Agency 3D Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to vector component if image load fails
                    e.currentTarget.style.display = 'none';
                    const fallback = document.getElementById('vector-logo-fallback-left');
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div id="vector-logo-fallback-left" style={{ display: 'none' }}>
                  <AryanAgencyLogo variant="icon" size="lg" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline">
                  <span className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                    Aryan
                  </span>
                  <span className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-amber-400 ml-2 drop-shadow-sm">
                    Agency
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-slate-300 uppercase mt-0.5">
                  FMCG DISTRIBUTION & SUPPLY CHAIN
                </p>
              </div>
            </div>

            {/* Elegant Tagline */}
            <div className="mt-3 text-xs sm:text-sm italic font-serif text-slate-200/90 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="text-amber-300 font-medium">Better Products</span>
              <span className="text-slate-500 not-italic">|</span>
              <span className="text-white font-medium">Stronger Partnerships</span>
              <span className="text-slate-500 not-italic">|</span>
              <span className="text-blue-300 font-medium">A Brighter Tomorrow</span>
            </div>
          </div>

          {/* MIDDLE SECTION: CORE RETAIL & DISTRIBUTION FEATURES */}
          <div className="my-7 lg:my-8 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-amber-400">
                CORE RETAIL & DISTRIBUTION FEATURES
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-400/40 via-blue-500/30 to-transparent" />
            </div>

            {/* 4 Premium Features in a Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
              
              {/* Feature 1: Distributor Catalog */}
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-400/50 hover:bg-white/[0.08] transition-all duration-200 group">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/80 bg-amber-400/10 flex items-center justify-center text-amber-300 mb-2.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
                  <ShoppingCart className="w-5 h-5 text-amber-300" />
                </div>
                <h4 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                  Distributor Catalog
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-300/80 mt-1 font-medium">
                  Explore FMCG Products
                </p>
              </div>

              {/* Feature 2: My Orders & Invoices */}
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-400/50 hover:bg-white/[0.08] transition-all duration-200 group">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/80 bg-amber-400/10 flex items-center justify-center text-amber-300 mb-2.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-amber-300" />
                </div>
                <h4 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                  My Orders & Invoices
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-300/80 mt-1 font-medium">
                  Track Your Orders
                </p>
              </div>

              {/* Feature 3: Account & Credit Ledger */}
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-400/50 hover:bg-white/[0.08] transition-all duration-200 group">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/80 bg-amber-400/10 flex items-center justify-center text-amber-300 mb-2.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5 text-amber-300" />
                </div>
                <h4 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                  Account & Credit Ledger
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-300/80 mt-1 font-medium">
                  Manage Your Account
                </p>
              </div>

              {/* Feature 4: Payment Receipts */}
              <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-400/50 hover:bg-white/[0.08] transition-all duration-200 group">
                <div className="w-12 h-12 rounded-full border-2 border-amber-400/80 bg-amber-400/10 flex items-center justify-center text-amber-300 mb-2.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] group-hover:scale-105 transition-transform">
                  <Receipt className="w-5 h-5 text-amber-300" />
                </div>
                <h4 className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                  Payment Receipts
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-300/80 mt-1 font-medium">
                  View Payment History
                </p>
              </div>

            </div>
          </div>

          {/* BOTTOM SECTION: TRUSTED SUPPLIER, LOCATION, CONTACT, BRANDS & SHOWCASE */}
          <div className="relative z-10 pt-4 border-t border-blue-900/50 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* Left Column: Supplier, Location & Brand List */}
              <div className="md:col-span-7 space-y-3">
                {/* Script Heading */}
                <div>
                  <h3 className="text-base sm:text-lg font-serif italic text-amber-300 drop-shadow-xs">
                    Trusted FMCG Supplier
                  </h3>
                  <p className="text-xs sm:text-sm font-serif italic text-slate-200">
                    in Utraula & Surrounding Areas
                  </p>
                </div>

                {/* Location & Phone Badges */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="font-medium text-slate-100">Utraula, Dist. Balrampur (U.P.)</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Contact Us</span>
                      <span className="font-semibold text-slate-100">+91 945xxxxxx</span>
                    </div>
                  </div>
                </div>

                {/* OUR BRANDS SECTION */}
                <div className="pt-2">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                    OUR BRANDS
                  </h5>
                  <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed">
                    Kurkure | Uncle Chips | Pramod | Frymps | Honey Bunny | Kinder Joy | Agarbatti | Paradise Bakery | And Many More
                  </p>
                </div>
              </div>

              {/* Right Column: FMCG Product Visual Showcase */}
              <div className="md:col-span-5 relative">
                <div className="rounded-2xl overflow-hidden border border-white/15 shadow-xl bg-gradient-to-t from-black/60 to-transparent p-1 relative group">
                  <img 
                    src="/assets/fmcg_products_showcase.jpg" 
                    alt="FMCG Products Collection" 
                    className="w-full h-36 sm:h-40 object-cover rounded-xl group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041530]/90 via-transparent to-transparent pointer-events-none rounded-xl" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                    <span>Authorized Partner</span>
                    <span className="text-white font-mono text-[9px]">100% Genuine</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Desktop Curved Dividing Swoosh (Yellow/Gold & Cyan/Blue wave transition) */}
          <div 
            className="hidden lg:block absolute top-0 bottom-0 -right-7 w-14 pointer-events-none z-20"
            aria-hidden="true"
          >
            <svg 
              className="h-full w-full" 
              viewBox="0 0 100 1000" 
              preserveAspectRatio="none"
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Golden Yellow Accent Wave */}
              <path 
                d="M0,0 Q60,350 15,650 T40,1000 L0,1000 Z" 
                fill="#f59e0b" 
                opacity="0.95"
              />
              {/* Royal Blue Accent Wave */}
              <path 
                d="M0,0 Q40,350 0,650 T20,1000 L0,1000 Z" 
                fill="#1d4ed8" 
                opacity="0.8"
              />
            </svg>
          </div>

        </section>

        {/* ========================================================= */}
        {/* RIGHT SIDE: SOFT LIGHT BACKGROUND & PREMIUM LOGIN CARD   */}
        {/* ========================================================= */}
        <section className="w-full lg:w-[45%] xl:w-[44%] bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-200 relative flex flex-col justify-center items-center p-4 sm:p-8 lg:p-10 xl:p-12 overflow-hidden">
          
          {/* Soft blurred supermarket aisle background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
            <img 
              src="/assets/supermarket_aisle_blur.jpg" 
              alt="Retail background" 
              className="w-full h-full object-cover filter blur-[2px]"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Soft ambient lighting rings */}
          <div 
            className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />

          {/* Floating White Premium Login Card (Rounded 24px = rounded-3xl) */}
          <div className="w-full max-w-[440px] bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.12)] p-6 sm:p-8 relative z-20 transition-all">
            
            {/* Top Logo & Enterprise Name */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 mb-2 drop-shadow-sm">
                <img 
                  src="/assets/aryan_agency_icon.png" 
                  alt="Aryan Agency Mark" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fb = document.getElementById('vector-logo-fallback-card');
                    if (fb) fb.style.display = 'block';
                  }}
                />
                <div id="vector-logo-fallback-card" style={{ display: 'none' }}>
                  <AryanAgencyLogo variant="icon" size="md" />
                </div>
              </div>

              <div className="flex items-baseline">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  Aryan
                </span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-500 ml-1.5">
                  Agency
                </span>
              </div>
              
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mt-0.5">
                FMCG DISTRIBUTION & SUPPLY CHAIN
              </span>
            </div>

            {/* Heading & Subheading */}
            <div className="text-center mb-5">
              <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
                {mode === 'signin' && 'Welcome Back'}
                {mode === 'signup' && 'Register Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {mode === 'signin' && 'Sign in to your account to continue'}
                {mode === 'signup' && 'Create your verified retailer / partner account'}
                {mode === 'forgot' && 'Enter your registered email for password recovery'}
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-900">Authentication Error</p>
                  <p className="mt-0.5 leading-relaxed text-rose-700">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message Alert */}
            {success && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1">
                  <p className="font-semibold text-emerald-900">Success</p>
                  <p className="mt-0.5 leading-relaxed text-emerald-700">{success}</p>
                </div>
              </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="card-forgot-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="card-forgot-email"
                      type="email"
                      required
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Instructions...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer inline-flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              /* SIGN IN & SIGN UP FORMS */
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Additional Registration Fields */}
                {mode === 'signup' && (
                  <>
                    <div>
                      <label htmlFor="card-signup-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Full Name / Retailer Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <input
                          id="card-signup-name"
                          type="text"
                          required
                          disabled={loading}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Ramesh Gupta"
                          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="card-signup-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Contact Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          id="card-signup-phone"
                          type="tel"
                          disabled={loading}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 94500 12345"
                          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email Address Field */}
                <div>
                  <label htmlFor="card-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="card-email"
                      type="email"
                      required
                      autoComplete="email"
                      disabled={loading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="card-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="card-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      disabled={loading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                {mode === 'signin' && (
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Blue to Indigo Gradient Button: "Sign In to Dashboard →" */}
                <button
                  id="sign-in-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{mode === 'signin' ? 'Sign In to Dashboard →' : 'Complete Registration →'}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider with Or / Register Option */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              {mode === 'signin' ? (
                <p className="text-xs text-slate-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    <span>Register Account</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </p>
              ) : mode === 'signup' ? (
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Sign In to Dashboard</span>
                  </button>
                </p>
              ) : null}
            </div>

            {/* Middle Footer inside Card */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-500 font-medium">
                Aryan Agency | FMCG Distribution | Utraula, Balrampur (U.P.)
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Trusted Supplier • Better Service • Growing Together
              </p>
            </div>

            {/* Bottom 3 Trust Indicators */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">Secure Access</span>
              </div>
              <div className="flex flex-col items-center">
                <Lock className="w-4 h-4 text-blue-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">Your Data is Safe</span>
              </div>
              <div className="flex flex-col items-center">
                <Headphones className="w-4 h-4 text-amber-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">24/7 Support</span>
              </div>
            </div>

          </div>

          {/* Bottom Right "Together We Grow" Graphic Callout */}
          <div className="hidden sm:flex absolute bottom-4 right-6 items-center flex-col select-none pointer-events-none z-30">
            <span className="text-base font-serif italic font-bold text-blue-900 drop-shadow-xs tracking-wide">
              Together We Grow
            </span>
            {/* Hand-drawn style underline swoosh */}
            <svg width="110" height="12" viewBox="0 0 110 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 7C30 1 75 2 108 9" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

        </section>

      </div>

    </div>
  );
};
