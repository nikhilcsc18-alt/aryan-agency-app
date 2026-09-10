import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  LogIn,
  Building2,
  Shield,
  Clock,
  ExternalLink,
  Download,
  Smartphone,
  QrCode,
  Truck,
  Boxes,
  Award,
  CheckCircle
} from 'lucide-react';
import { AppDownloadModal } from './AppDownloadModal';

interface LoginPageProps {
  onLoginSuccess?: (user?: User) => void;
  onBackToHome?: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess,
  onBackToHome,
  initialMode = 'signin'
}) => {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
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
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col font-sans selection:bg-blue-600 selection:text-white bg-slate-950 relative overflow-x-hidden">
      
      {/* Top Banner on Mobile */}
      <div className="lg:hidden w-full bg-gradient-to-r from-blue-900 via-[#07152d] to-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-blue-800/40 text-xs">
        <div className="flex items-center space-x-2">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-[11px] mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Aryan Agency Portal</span>
        </div>
        <a 
          href="tel:+919140529661" 
          className="inline-flex items-center space-x-1 text-amber-400 font-bold hover:text-amber-300"
        >
          <Phone className="w-3 h-3" />
          <span>+91 9140529661</span>
        </a>
      </div>

      {/* Main Split Screen Container */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-screen relative">
        
        {/* ========================================================= */}
        {/* LEFT SIDE: BRANDING & ENTERPRISE SHOWCASE (52% on desktop)*/}
        {/* ========================================================= */}
        <section className="w-full lg:w-[52%] xl:w-[54%] bg-gradient-to-br from-[#030914] via-[#07172e] to-[#0a2347] text-white p-5 sm:p-7 md:p-8 lg:p-10 xl:p-12 relative flex flex-col justify-between overflow-hidden z-10 shadow-2xl border-b lg:border-b-0 lg:border-r border-blue-900/40">
          
          {/* Subtle Grid Lines & Micro Dot Engineering Matrix */}
          <div 
            className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none" 
            aria-hidden="true" 
          />
          {/* Subtle diagonal micro lines */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"
            aria-hidden="true"
          />
          
          {/* Ambient Lighting Spheres with Deep Rich Saturation */}
          <div 
            className="absolute -top-28 -left-28 w-[420px] h-[420px] rounded-full bg-blue-600/18 blur-[100px] pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-amber-500/12 blur-[100px] pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute -bottom-24 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" 
            aria-hidden="true" 
          />

          {/* TOP SECTION: BRAND IDENTITY & ACCREDITATION */}
          <div className="relative z-10 space-y-4">
            
            {/* Top Row with Home Navigation & Official Super-Stockist Accreditation */}
            <div className="flex items-center justify-between gap-3">
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-amber-300 hover:text-amber-200 border border-white/15 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Home</span>
                </button>
              )}

              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-950/80 to-slate-900/80 border border-blue-500/30 backdrop-blur-md shadow-xs ml-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-blue-200">
                  Authorized Super-Stockist
                </span>
                <span className="text-white/20">•</span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-300">
                  Utraula (U.P.)
                </span>
              </div>
            </div>

            {/* Logo Presentation & Corporate Typographic Hierarchy */}
            <div className="flex items-center space-x-4 pt-1">
              {/* Aryan Agency Verified Logo Mark with Crisp Glass Frame */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-[84px] lg:h-[84px] shrink-0 p-2 rounded-2xl bg-gradient-to-b from-white/[0.12] to-white/[0.04] border border-white/25 backdrop-blur-md shadow-[0_16px_32px_rgba(0,0,0,0.4)] ring-1 ring-white/10 group hover:scale-[1.03] transition-all flex items-center justify-center">
                <img 
                  src="/assets/aryan_agency_icon.png" 
                  alt="Aryan Agency Official Logo" 
                  className="w-full h-full object-contain drop-shadow-md rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = document.getElementById('vector-logo-fallback-left');
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div id="vector-logo-fallback-left" style={{ display: 'none' }}>
                  <AryanAgencyLogo variant="icon" size="lg" />
                </div>
              </div>

              {/* Company Wordmark & Corporate Subtitle */}
              <div className="space-y-1">
                <div className="flex items-baseline">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-baseline leading-none">
                    <span>Aryan</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 ml-2.5 drop-shadow-xs">Agency</span>
                  </h1>
                </div>
                
                <p className="text-[11px] sm:text-xs lg:text-[13px] font-bold tracking-widest text-blue-200/90 uppercase">
                  FMCG Super-Stockist &amp; Wholesale Distribution
                </p>

                <div className="flex items-center space-x-2 pt-0.5">
                  <span className="inline-flex items-center space-x-1 text-[10px] font-medium text-slate-300 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Verified GST Distributor</span>
                  </span>
                  <span className="inline-flex items-center space-x-1 text-[10px] font-medium text-slate-300 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-md">
                    <Truck className="w-3 h-3 text-cyan-400" />
                    <span>Direct Beat Routes</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Corporate Value Statement */}
            <div className="pt-1 hidden sm:block">
              <p className="text-xs sm:text-sm lg:text-[15px] font-medium text-slate-200 leading-relaxed max-w-xl">
                <span className="text-amber-300 font-bold">Authorized FMCG Distribution.</span>{' '}
                <span className="text-slate-100">Batch-tested fresh stock, direct company margins, and daily door-to-door delivery for retail partners.</span>
              </p>
            </div>

          </div>

          {/* MIDDLE SECTION: ENTERPRISE FMCG PILLARS & BRAND NETWORK */}
          <div className="hidden sm:block my-4 lg:my-6 relative z-10 space-y-3.5">
            <div className="flex items-center space-x-2">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                <span>Super-Stockist Infrastructure</span>
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-amber-400/40 via-blue-400/20 to-transparent" />
            </div>

            {/* 3 Value Proposition Glass Cards with Refined Icons & Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Card 1: Fast B2B Ordering */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 hover:border-amber-400/40 hover:bg-white/[0.09] transition-all duration-200 group">
                <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <ShoppingCart className="w-4.5 h-4.5 text-amber-300" />
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">
                  Direct B2B Orders
                </h4>
                <p className="text-[10.5px] text-slate-300/80 mt-1 leading-relaxed">
                  Real-time wholesale booking, trade schemes, and volume case margins.
                </p>
              </div>

              {/* Card 2: Live Stock & Ledger */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 hover:border-blue-400/40 hover:bg-white/[0.09] transition-all duration-200 group">
                <div className="w-9 h-9 rounded-xl bg-blue-400/15 border border-blue-400/30 flex items-center justify-center text-blue-300 mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <FileText className="w-4.5 h-4.5 text-blue-300" />
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">
                  GST Invoicing
                </h4>
                <p className="text-[10.5px] text-slate-300/80 mt-1 leading-relaxed">
                  100% compliant tax billing, batch expiry tracking &amp; instant digital receipts.
                </p>
              </div>

              {/* Card 3: Credit & Retailers */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 hover:border-emerald-400/40 hover:bg-white/[0.09] transition-all duration-200 group">
                <div className="w-9 h-9 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-2 group-hover:scale-105 transition-transform shadow-xs">
                  <BookOpen className="w-4.5 h-4.5 text-emerald-300" />
                </div>
                <h4 className="text-xs font-bold text-white leading-snug">
                  Retailer Ledger
                </h4>
                <p className="text-[10.5px] text-slate-300/80 mt-1 leading-relaxed">
                  Transparent credit balances, UPI settlement receipts &amp; delivery run-sheets.
                </p>
              </div>

            </div>

            {/* Authorized Brand Network Ribbon */}
            <div className="pt-0.5">
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 backdrop-blur-xs flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 shrink-0 flex items-center space-x-1">
                  <Award className="w-3 h-3 text-amber-300" />
                  <span>Authorized FMCG Brands:</span>
                </span>
                <span className="text-[11px] text-slate-300 font-medium truncate">
                  Parle • Britannia • Amul • Tata Tea • Nestlé • Cadbury • Lay&apos;s • Haldiram&apos;s • Fortune
                </span>
              </div>
            </div>

            {/* Android Mobile App Promotion Box */}
            <div className="pt-1">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-400/30 backdrop-blur-md shadow-lg flex items-center justify-between gap-3 group hover:border-emerald-400/50 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                    <Smartphone className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                        Aryan Agency Mobile App
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                        Android APK
                      </span>
                    </div>
                    <p className="text-[10.5px] text-emerald-100/80 mt-0.5">
                      Faster Kirana re-orders, barcode stock scanning &amp; offline beat sync
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-slate-950" />
                  <span>Get APK</span>
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: ENTERPRISE HELPDESK & MAIN DEPOT ADDRESS */}
          <div className="relative z-10 pt-3 sm:pt-4 border-t border-blue-900/60 mt-3 sm:mt-0 space-y-2.5">
            
            {/* Contact Support Glass Card */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-white/[0.08] to-white/[0.03] border border-white/15 backdrop-blur-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    Distribution Helpdesk
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Helpdesk Active
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 hidden sm:block">
                  For dealership onboarding, wholesale order booking, or payment ledger assistance:
                </p>
              </div>

              {/* Clickable Phone & Email Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href="tel:+919140529661"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/25 transition-all cursor-pointer group"
                  title="Call Aryan Agency"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-950 group-hover:rotate-12 transition-transform" />
                  <span>+91 9140529661</span>
                </a>

                <a
                  href="mailto:aryanagency@zohomail.in"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-medium text-xs border border-white/20 transition-all cursor-pointer group"
                  title="Email Aryan Agency"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-300 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[11px]">Email</span>
                </a>
              </div>

            </div>

            {/* Official Depot Location Address */}
            <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] text-slate-400 px-1">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[290px] sm:max-w-none text-slate-300 font-medium">
                  Main Depot, Subhash Nagar, Hatan Road, Utraula, Dist. Balrampur (U.P.) - 271604
                </span>
              </span>
              <span className="hidden md:inline text-slate-400 shrink-0 ml-2">
                Mon - Sat: 8:00 AM - 8:00 PM
              </span>
            </div>

          </div>

          {/* Desktop Curved Dividing Wave */}
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
                opacity="0.85" 
              />
            </svg>
          </div>

        </section>

        {/* ========================================================= */}
        {/* RIGHT SIDE: MODERN, CLEAN, PREMIUM LOGIN FORM (46%)       */}
        {/* ========================================================= */}
        <section className="w-full lg:w-[46%] xl:w-[45%] bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200/90 relative flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 overflow-hidden">
          
          {/* Subtle blurred supermarket background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
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
            className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" 
            aria-hidden="true" 
          />

          {/* Top Mobile App Quick Download Banner */}
          <div className="w-full max-w-[460px] mb-3 flex items-center justify-between bg-white/90 backdrop-blur-md border border-slate-200/90 px-3.5 py-2 rounded-2xl shadow-xs relative z-20">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11.5px] font-bold text-slate-800">
                Kirana &amp; Sales Mobile App
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download APK</span>
            </button>
          </div>

          {/* Floating White Premium Login Card */}
          <div className="w-full max-w-[460px] bg-white/95 backdrop-blur-xl rounded-[28px] border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.14)] p-6 sm:p-8 relative z-20 transition-all">
            
            {/* Top Navigation Row inside Card */}
            <div className="flex items-center justify-between mb-4">
              {onBackToHome ? (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
              ) : <div />}

              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-bold shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Secure B2B Portal</span>
              </div>
            </div>

            {/* Mobile / Card Top Logo: visible on mobile for identity, hidden on lg desktop since left branding panel already features large logo */}
            <div className="flex flex-col items-center text-center mb-3 lg:hidden">
              <div className="w-10 h-10 mb-1 drop-shadow-xs">
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
                  <AryanAgencyLogo variant="icon" size="xs" />
                </div>
              </div>

              <div className="flex items-baseline">
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  Aryan
                </span>
                <span className="text-lg font-extrabold tracking-tight text-amber-500 ml-1.5">
                  Agency
                </span>
              </div>
            </div>

            {/* Heading & Subheading */}
            <div className="text-center mb-5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {mode === 'signin' && 'Sign In to Your Account'}
                {mode === 'signup' && 'Register Retailer Account'}
                {mode === 'forgot' && 'Reset Your Password'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                {mode === 'signin' && 'Access inventory, wholesale orders, billing, and retail management'}
                {mode === 'signup' && 'Create your verified B2B distributor / retailer account'}
                {mode === 'forgot' && 'Enter your registered email address to receive recovery instructions'}
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

            {/* ========================================================= */}
            {/* FORGOT PASSWORD FORM                                      */}
            {/* ========================================================= */}
            {mode === 'forgot' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="card-forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5">
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
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            ) : (
              /* ========================================================= */
              /* SIGN IN & SIGN UP FORMS                                   */
              /* ========================================================= */
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Additional Registration Fields */}
                {mode === 'signup' && (
                  <>
                    <div>
                      <label htmlFor="card-signup-name" className="block text-xs font-bold text-slate-700 mb-1.5">
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
                          placeholder="e.g. Ramesh Kumar (Gupta General Store)"
                          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="card-signup-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
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
                          className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email Address Field */}
                <div>
                  <label htmlFor="card-email" className="block text-xs font-bold text-slate-700 mb-1.5">
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
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="card-password" className="block text-xs font-bold text-slate-700">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>

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
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60 transition-all shadow-2xs"
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

                {/* Remember Me Checkbox (Sign in mode only) */}
                {mode === 'signin' && (
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Remember my email</span>
                    </label>

                    <span className="text-[11px] text-slate-400 font-medium">
                      256-bit Encrypted
                    </span>
                  </div>
                )}

                {/* Modern Gradient Login Button */}
                <button
                  id="sign-in-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 sm:py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      <span>
                        {mode === 'signin' ? 'Sign In to Dashboard' : 'Complete Registration'}
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Mode Switcher: Register / Sign In */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              {mode === 'signin' ? (
                <p className="text-xs text-slate-600">
                  New Retailer or Partner?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors inline-flex items-center gap-1 ml-1"
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
                    className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors inline-flex items-center gap-1 ml-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back to Sign In</span>
                  </button>
                </p>
              ) : null}
            </div>

            {/* Mobile Contact Quick Bar: Clickable phone & email right under the card */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 lg:hidden bg-slate-50/80 -mx-6 -mb-6 p-4 rounded-b-[28px] text-center space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">
                Need help or quick support? Contact Us:
              </span>
              <div className="flex items-center justify-center gap-3 text-xs">
                <a 
                  href="tel:+919140529661" 
                  className="inline-flex items-center space-x-1 font-bold text-blue-600 hover:text-blue-800"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>+91 9140529661</span>
                </a>
                <span className="text-slate-300">•</span>
                <a 
                  href="mailto:aryanagency@zohomail.in" 
                  className="inline-flex items-center space-x-1 font-medium text-slate-700 hover:text-blue-600"
                >
                  <Mail className="w-3 h-3 text-blue-500" />
                  <span>aryanagency@zohomail.in</span>
                </a>
              </div>
            </div>

            {/* Trust & Security Badges below card for Desktop */}
            <div className="hidden lg:grid mt-5 pt-3.5 border-t border-slate-100 grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">SSL 256-Bit</span>
                <span className="text-[9px] text-slate-400">Encrypted</span>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="w-4 h-4 text-blue-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">Supabase Auth</span>
                <span className="text-[9px] text-slate-400">Verified</span>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="w-4 h-4 text-amber-600 mb-0.5" />
                <span className="text-[10px] font-bold text-slate-700">99.9% Uptime</span>
                <span className="text-[9px] text-slate-400">Active Node</span>
              </div>
            </div>

          </div>

          {/* Bottom Enterprise Credit Line */}
          <div className="mt-5 text-center relative z-20">
            <p className="text-[11px] font-medium text-slate-500">
              © Aryan Agency • FMCG Distribution &amp; Retail Management
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Utraula, Balrampur (U.P.) • All Rights Reserved
            </p>
          </div>

        </section>

      </div>

      {/* App Download Modal with APK Link, QR Code & Setup */}
      <AppDownloadModal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)} 
      />

    </div>
  );
};
