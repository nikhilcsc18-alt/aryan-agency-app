import React, { useState, useEffect, useRef } from 'react';
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
  Phone, 
  ShoppingCart, 
  Receipt, 
  MapPin, 
  LogIn, 
  Shield, 
  Clock, 
  Download, 
  Smartphone, 
  Truck, 
  Check, 
  Sparkles,
  RefreshCw,
  Store,
  KeyRound
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
  const { 
    signInWithOtp, 
    verifyOtp, 
    completeRetailerRegistration, 
    signInWithEmail, 
    resetPassword 
  } = useAuth();

  // Authentication method: 'otp' (primary for retailers) or 'password' (for distributor staff/admin)
  const [authMethod, setAuthMethod] = useState<'otp' | 'password'>('otp');

  // OTP flow stages: 'phone' -> 'verify' -> 'onboard'
  const [otpStep, setOtpStep] = useState<'phone' | 'verify' | 'onboard'>('phone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // New Retailer Onboarding Fields (EMAIL IS COMPLETELY OPTIONAL)
  const [onboardStoreName, setOnboardStoreName] = useState('');
  const [onboardOwnerName, setOnboardOwnerName] = useState('');
  const [onboardEmail, setOnboardEmail] = useState('');
  const [onboardAddress, setOnboardAddress] = useState('');

  // Password / Staff mode state
  const [staffMode, setStaffMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // General UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Input refs for 6-digit OTP fields
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 30-Second Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (otpStep === 'verify' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  // Load remembered staff email if any
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('aryan_remembered_email');
      const savedRemember = localStorage.getItem('aryan_remember_me');
      if (savedEmail) setEmail(savedEmail);
      if (savedRemember !== null) setRememberMe(savedRemember === 'true');
    } catch {}
  }, []);

  // Format 10-digit clean mobile number
  const cleanMobile = mobileNumber.replace(/\D/g, '').slice(-10);

  // -------------------------------------------------------------
  // 1. SEND OTP ACTION
  // -------------------------------------------------------------
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithOtp(cleanMobile);
      if (!res.success) {
        setError(res.error || 'Failed to send OTP. Please check your mobile number and try again.');
      } else {
        setSuccess(`Verification code dispatched to +91 ${cleanMobile}`);
        setOtpStep('verify');
        setCountdown(30);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      }
    } catch (err: any) {
      setError(err.message || 'Network error while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. RESEND OTP ACTION
  // -------------------------------------------------------------
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await signInWithOtp(cleanMobile);
      if (!res.success) {
        setError(res.error || 'Failed to resend OTP. Please try again.');
      } else {
        setSuccess(`A new OTP has been sent to +91 ${cleanMobile}`);
        setCountdown(30);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      }
    } catch (err: any) {
      setError(err.message || 'Error resending OTP.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. VERIFY OTP ACTION
  // -------------------------------------------------------------
  const handleVerifyOtp = async (otpCodeToVerify?: string) => {
    const code = otpCodeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await verifyOtp(cleanMobile, code);
      if (!res.success) {
        setError(res.error || 'Invalid or expired verification code. Please check the SMS and try again.');
        setLoading(false);
        return;
      }

      // Existing User: Log in directly!
      if (!res.isNewUser && res.user) {
        setSuccess('Authentication successful! Loading dashboard...');
        if (onLoginSuccess) {
          setTimeout(() => {
            onLoginSuccess(res.user);
          }, 350);
        }
        return;
      }

      // New Retailer: Show quick profile screen where email is completely optional
      setOtpStep('onboard');
      setOnboardStoreName('');
      setOnboardOwnerName('');
      setOnboardEmail('');
      setOnboardAddress('');
      setSuccess('Mobile number verified! You can enter store details or complete your profile later.');
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual OTP box typing
  const handleOtpBoxChange = (index: number, val: string) => {
    const sanitized = val.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    // Handle paste of full 6 digits
    if (sanitized.length > 1) {
      const pasted = sanitized.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      if (pasted.length === 6) {
        handleVerifyOtp(pasted.join(''));
      } else {
        const nextIdx = Math.min(pasted.length, 5);
        otpInputRefs.current[nextIdx]?.focus();
      }
      return;
    }

    newDigits[index] = sanitized.slice(-1);
    setOtpDigits(newDigits);

    if (sanitized && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto verify when all 6 digits entered
    if (newDigits.every(d => d !== '') && index === 5) {
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // -------------------------------------------------------------
  // 4. COMPLETE NEW RETAILER ONBOARDING
  // -------------------------------------------------------------
  const handleCompleteOnboarding = async (skipDetails: boolean = false) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        phone: cleanMobile,
        storeName: skipDetails ? '' : onboardStoreName.trim(),
        ownerName: skipDetails ? '' : onboardOwnerName.trim(),
        email: skipDetails ? '' : onboardEmail.trim(), // STRICTLY OPTIONAL
        address: skipDetails ? '' : onboardAddress.trim()
      };

      const res = await completeRetailerRegistration(payload);
      if (!res.success) {
        setError(res.error || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess('Account created successfully! Loading store dashboard...');
      if (onLoginSuccess) {
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 400);
      }
    } catch (err: any) {
      setError(err.message || 'Registration error.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 5. STAFF / ADMIN PASSWORD AUTHENTICATION
  // -------------------------------------------------------------
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (staffMode === 'signin') {
        if (!cleanEmail || !password) {
          setError('Please enter your work email and password.');
          setLoading(false);
          return;
        }

        try {
          if (rememberMe) {
            localStorage.setItem('aryan_remembered_email', cleanEmail);
            localStorage.setItem('aryan_remember_me', 'true');
          } else {
            localStorage.removeItem('aryan_remembered_email');
            localStorage.setItem('aryan_remember_me', 'false');
          }
        } catch {}

        const res = await signInWithEmail(cleanEmail, password);
        if (!res.success) {
          setError(res.error || 'Invalid credentials. Please verify your email and password.');
        } else {
          setSuccess('Signed in successfully! Redirecting...');
          if (onLoginSuccess) {
            setTimeout(() => onLoginSuccess(res.user), 300);
          }
        }
      } else if (staffMode === 'forgot') {
        if (!cleanEmail) {
          setError('Please enter your registered work email address.');
          setLoading(false);
          return;
        }
        const res = await resetPassword(cleanEmail);
        if (!res.success) {
          setError(res.error || 'Password reset request failed.');
        } else {
          setSuccess(res.message || 'Password reset instructions dispatched to your email.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
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
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-[11px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Aryan Agency • Apna Store</span>
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
        {/* LEFT SIDE: ENTERPRISE SHOWCASE & BRANDING                */}
        {/* ========================================================= */}
        <section className="w-full lg:w-[50%] xl:w-[52%] bg-gradient-to-br from-[#030914] via-[#07172e] to-[#0a2347] text-white p-5 sm:p-7 md:p-8 lg:p-10 xl:p-12 relative flex flex-col justify-between overflow-hidden z-10 shadow-2xl border-b lg:border-b-0 lg:border-r border-blue-900/40">
          
          <div 
            className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute -top-28 -left-28 w-[420px] h-[420px] rounded-full bg-blue-600/18 blur-[100px] pointer-events-none" 
            aria-hidden="true" 
          />
          <div 
            className="absolute -bottom-24 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" 
            aria-hidden="true" 
          />

          {/* Top Brand Bar */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 p-2 border border-white/20">
                  <AryanAgencyLogo variant="icon" size="sm" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-baseline">
                    ARYAN <span className="text-amber-400 ml-1.5 font-extrabold">AGENCY</span>
                  </h1>
                  <p className="text-[11px] text-blue-200/80 font-semibold tracking-wide uppercase">
                    Trusted FMCG Wholesale Supplier • Apna Store
                  </p>
                </div>
              </div>

              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-300 transition-colors cursor-pointer border border-white/10"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Store</span>
                </button>
              )}
            </div>

            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct Kirana Wholesale Ordering &amp; Delivery</span>
            </div>

            <div className="space-y-3 mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                Kirana Store &amp; Retailer Portal <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">
                  Fast Mobile OTP Sign In
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-lg">
                Sign in with your 10-digit mobile number. Receive a 6-digit SMS code to instantly check wholesale catalog prices, place orders, track van dispatches, and review khata ledgers.
              </p>
            </div>

            {/* Key Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start space-x-2.5">
                <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Mobile Number + OTP</span>
                  <span className="text-slate-400 text-[11px]">Instant sign in without memorizing passwords or mandatory emails</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start space-x-2.5">
                <Truck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Utraula &amp; Balrampur Beat Delivery</span>
                  <span className="text-slate-400 text-[11px]">Direct FMCG dispatch to your shop doorstep</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start space-x-2.5">
                <Receipt className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Digital Khata &amp; Invoices</span>
                  <span className="text-slate-400 text-[11px]">Real-time statement, outstanding balance and payment receipts</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Secure Supabase Session</span>
                  <span className="text-slate-400 text-[11px]">Isolated retailer data privacy protected by row-level security</span>
                </div>
              </div>
            </div>
          </div>

          {/* Android App Download Callout on Left */}
          <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download Android App (Official APK)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 cursor-pointer"
            >
              Get App APK
            </button>
          </div>

        </section>

        {/* ========================================================= */}
        {/* RIGHT SIDE: CLEAN AUTHENTICATION CARD                     */}
        {/* ========================================================= */}
        <section className="w-full lg:w-[50%] xl:w-[48%] bg-slate-900/60 backdrop-blur-md flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 lg:p-10 relative z-20">
          
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 text-slate-900 relative">
            
            {/* Header Brand Badge on Mobile */}
            <div className="flex flex-col items-center text-center mb-4 lg:hidden">
              <div className="w-12 h-12 mb-1.5">
                <AryanAgencyLogo variant="icon" size="sm" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                ARYAN <span className="text-amber-500 font-extrabold">AGENCY</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Trusted FMCG Supplier • Apna Store</p>
            </div>

            {/* Auth Method Switcher Tabs: Mobile OTP vs Staff Login */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('otp');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMethod === 'otp'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile OTP Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setError(null);
                  setSuccess(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  authMethod === 'password'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Staff &amp; Admin</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Notice</p>
                  <p className="mt-0.5 leading-relaxed text-rose-700">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message Alert */}
            {success && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <div className="flex-1">
                  <p className="font-bold text-emerald-900">Success</p>
                  <p className="mt-0.5 leading-relaxed text-emerald-700">{success}</p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1. MOBILE NUMBER + OTP AUTHENTICATION FLOW (DEFAULT)      */}
            {/* ========================================================= */}
            {authMethod === 'otp' && (
              <div>
                
                {/* ------------------------------------------------------- */}
                {/* STAGE 1: ENTER MOBILE NUMBER & SEND OTP                 */}
                {/* ------------------------------------------------------- */}
                {otpStep === 'phone' && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="text-left mb-3">
                      <h3 className="text-base font-bold text-slate-900">
                        Retailer Sign In
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter your 10-digit mobile number to receive a secure SMS verification code.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/15 overflow-hidden shadow-2xs">
                        {/* Fixed India Country Code +91 */}
                        <div className="bg-slate-100 px-3.5 py-3 border-r border-slate-300 flex items-center space-x-1.5 text-slate-800 font-bold text-xs sm:text-sm select-none">
                          <span>🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={10}
                          required
                          disabled={loading}
                          autoFocus
                          value={mobileNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setMobileNumber(val);
                          }}
                          placeholder="98XXXXXXXX"
                          className="w-full px-3.5 py-3 text-slate-900 font-mono text-sm sm:text-base font-bold tracking-wider placeholder-slate-400 focus:outline-none bg-white"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        OTP will be sent to your mobile number via SMS
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || cleanMobile.length !== 10}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Help Note */}
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-slate-600 space-y-1">
                      <p className="font-semibold text-blue-900 flex items-center space-x-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Instant Access</span>
                      </p>
                      <p>
                        Existing retailers are logged in immediately. New accounts can complete their store profile without requiring an email address.
                      </p>
                    </div>
                  </form>
                )}

                {/* ------------------------------------------------------- */}
                {/* STAGE 2: ENTER 6-DIGIT OTP & VERIFY                     */}
                {/* ------------------------------------------------------- */}
                {otpStep === 'verify' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('phone');
                          setError(null);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Edit Number</span>
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        +91 {cleanMobile.slice(0, 2)}••• ••{cleanMobile.slice(-3)}
                      </span>
                    </div>

                    <div className="text-center">
                      <h3 className="text-base font-bold text-slate-900">
                        Verify Mobile Number
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Enter the 6-digit verification code sent to +91 {cleanMobile}
                      </p>
                    </div>

                    {/* 6 Individual OTP Boxes */}
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5 my-3">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpInputRefs.current[idx] = el; }}
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          disabled={loading}
                          value={digit}
                          onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 transition-all shadow-2xs"
                        />
                      ))}
                    </div>

                    {/* Verify Button */}
                    <button
                      type="button"
                      onClick={() => handleVerifyOtp()}
                      disabled={loading || otpDigits.some(d => !d)}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Verify &amp; Sign In</span>
                        </>
                      )}
                    </button>

                    {/* Resend Timer & Action */}
                    <div className="pt-2 text-center text-xs">
                      {countdown > 0 ? (
                        <p className="text-slate-500 font-medium">
                          Didn&apos;t receive code? Resend in{' '}
                          <span className="font-mono font-bold text-blue-600">
                            {countdown}s
                          </span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={loading}
                          className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center justify-center space-x-1 mx-auto"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Resend OTP via SMS</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------- */}
                {/* STAGE 3: NEW RETAILER QUICK ONBOARDING SCREEN           */}
                {/* ------------------------------------------------------- */}
                {otpStep === 'onboard' && (
                  <div className="space-y-3.5 text-left">
                    <div className="text-center pb-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1.5 font-bold">
                        <Store className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        Retail Store Profile
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your mobile is verified! Add store info now or complete it in your profile anytime.
                      </p>
                    </div>

                    {/* Verified Mobile Display */}
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-medium">Verified Mobile:</span>
                      <span className="font-mono font-bold text-emerald-900">+91 {cleanMobile}</span>
                    </div>

                    {/* Store Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kirana / Retail Store Name
                      </label>
                      <input
                        type="text"
                        value={onboardStoreName}
                        onChange={(e) => setOnboardStoreName(e.target.value)}
                        placeholder="e.g. Maa Durga Kirana Store"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    {/* Owner Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Proprietor / Owner Name
                      </label>
                      <input
                        type="text"
                        value={onboardOwnerName}
                        onChange={(e) => setOnboardOwnerName(e.target.value)}
                        placeholder="e.g. Ramesh Gupta"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    {/* EMAIL ADDRESS: STRICTLY OPTIONAL AS EXPLICITLY REQUESTED */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Email Address
                        </label>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          Optional
                        </span>
                      </div>
                      <input
                        type="email"
                        value={onboardEmail}
                        onChange={(e) => setOnboardEmail(e.target.value)}
                        placeholder="Optional (leave blank if not available)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Email is not required. Your account is active with your mobile number.
                      </span>
                    </div>

                    {/* Shop Address */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Shop Address
                      </label>
                      <input
                        type="text"
                        value={onboardAddress}
                        onChange={(e) => setOnboardAddress(e.target.value)}
                        placeholder="e.g. Main Market, Utraula, Balrampur"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteOnboarding(false)}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Creating Store Profile...</span>
                          </>
                        ) : (
                          <>
                            <span>Save &amp; Open Store</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {/* SKIP AND COMPLETE IN PROFILE LATER (AS REQUESTED) */}
                      <button
                        type="button"
                        onClick={() => handleCompleteOnboarding(true)}
                        disabled={loading}
                        className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      >
                        Skip &amp; Complete in Profile Later
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ========================================================= */}
            {/* 2. STAFF / ADMIN EMAIL & PASSWORD AUTHENTICATION          */}
            {/* ========================================================= */}
            {authMethod === 'password' && (
              <form onSubmit={handleStaffSubmit} className="space-y-4 text-left">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    {staffMode === 'signin' ? 'Staff & Admin Sign In' : 'Reset Password'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {staffMode === 'signin' 
                      ? 'For distributor owners, sales representatives and accounts staff' 
                      : 'Enter your registered email to receive recovery instructions'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Work Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@aryanagency.in"
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {staffMode === 'signin' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStaffMode('forgot');
                          setError(null);
                        }}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>{staffMode === 'signin' ? 'Sign In as Staff / Admin' : 'Send Recovery Link'}</span>
                    </>
                  )}
                </button>

                {staffMode === 'forgot' && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setStaffMode('signin')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Password Login</span>
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Helpline Bar */}
            <div className="mt-5 pt-3.5 border-t border-slate-150 text-center text-xs text-slate-500">
              <span>Customer Care / Helpline: </span>
              <a href="tel:+919140529661" className="font-bold text-blue-600 hover:underline">
                +91 9140529661
              </a>
            </div>

          </div>

          {/* Bottom Enterprise Credit Line */}
          <div className="mt-4 text-center text-[11px] text-slate-400">
            © Aryan Agency • FMCG Wholesale Distribution Suite, Utraula &amp; Balrampur
          </div>

        </section>

      </div>

      {/* App Download Modal */}
      <AppDownloadModal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)} 
      />

    </div>
  );
};
