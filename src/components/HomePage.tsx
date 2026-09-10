import React, { useState } from 'react';
import { AryanAgencyLogo } from './AryanAgencyLogo';
import { AppDownloadModal } from './AppDownloadModal';
import { 
  LogIn, 
  UserPlus, 
  ArrowRight, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  PackageCheck, 
  Store, 
  Clock, 
  CheckCircle2, 
  Boxes, 
  BadgePercent, 
  FileText, 
  ChevronRight, 
  Download, 
  Menu, 
  X,
  Layers,
  Sparkles,
  TrendingUp,
  Headphones,
  Award
} from 'lucide-react';

interface HomePageProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAuth }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const productCategories = [
    {
      title: 'Biscuits & Bakery',
      description: 'High-velocity tea-time favourites, cookies, cream & glucose biscuits from top brands.',
      icon: '🍪',
      brands: ['Parle-G', 'Britannia', 'Sunfeast', 'Oreo'],
      badge: 'High Turnover',
      bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
      borderColor: 'border-amber-200/80',
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      title: 'Beverages & Soft Drinks',
      description: 'Carbonated cold drinks, fruit juices, packaged water, and instant beverage mixes.',
      icon: '🥤',
      brands: ['Coca-Cola', 'Thums Up', 'Sprite', 'Frooti', 'Maaza'],
      badge: 'Cold Chain Ready',
      bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      borderColor: 'border-blue-200/80',
      badgeColor: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Snacks, Namkeen & Savories',
      description: 'Crispy potato chips, extruded snacks, traditional Indian namkeen & roasted savories.',
      icon: '🍿',
      brands: ['Lay\'s', 'Kurkure', 'Haldiram\'s', 'Balaji'],
      badge: 'Top Margin',
      bgGradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
      borderColor: 'border-orange-200/80',
      badgeColor: 'bg-orange-100 text-orange-800'
    },
    {
      title: 'Confectionery & Chocolates',
      description: 'Toffees, hard boiled candies, fruit gums, milk chocolates, and festive gift boxes.',
      icon: '🍫',
      brands: ['Cadbury Dairy Milk', 'Nestle KitKat', 'Alpenliebe', 'Pulse'],
      badge: 'Counter Impulse',
      bgGradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
      borderColor: 'border-purple-200/80',
      badgeColor: 'bg-purple-100 text-purple-800'
    },
    {
      title: 'Personal Care & Hygiene',
      description: 'Toilet soaps, premium shampoos, toothpastes, hair oils, shaving essentials & detergents.',
      icon: '🧼',
      brands: ['Dettol', 'Lifebuoy', 'Colgate', 'Clinic Plus', 'Rin'],
      badge: 'Daily Essential',
      bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
      borderColor: 'border-emerald-200/80',
      badgeColor: 'bg-emerald-100 text-emerald-800'
    },
    {
      title: 'Packaged Foods & Staples',
      description: 'Instant noodles, pasta, cooking spices, pure mustard oils, and breakfast cereals.',
      icon: '🍜',
      brands: ['Maggi', 'Yippee!', 'Fortune', 'Everest', 'Catch'],
      badge: 'Volume Anchor',
      bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
      borderColor: 'border-rose-200/80',
      badgeColor: 'bg-rose-100 text-rose-800'
    }
  ];

  const valuePillars = [
    {
      icon: Boxes,
      title: 'Direct Super-Stockist Inventory',
      desc: 'Genuine manufacturer-sourced inventory with batch-level traceability and 100% fresh expiry dates.'
    },
    {
      icon: Truck,
      title: 'Fast Route Beat Delivery',
      desc: 'Scheduled 24 to 48-hour delivery directly to your kirana store doorstep with verified delivery run-sheets.'
    },
    {
      icon: BadgePercent,
      title: 'Transparent Wholesale Pricing',
      desc: 'Direct wholesale rates, transparent GST tax invoices, and real-time company scheme discounts.'
    },
    {
      icon: Store,
      title: 'Retailer-First Credit & Support',
      desc: 'Flexible credit limits, instant UPI ledger settlements, and dedicated salesman assistance for every beat.'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Login / Sign Up',
      desc: 'Register your retail store or login to your verified FMCG partner account in seconds.',
      icon: UserPlus
    },
    {
      step: '02',
      title: 'Browse Wholesale Catalog',
      desc: 'Explore categorized FMCG stock, real-time case availability, and active manufacturer schemes.',
      icon: Layers
    },
    {
      step: '03',
      title: 'Place B2B Order',
      desc: 'Add case packs or loose units, choose credit or UPI payment, and receive instant booking confirmation.',
      icon: PackageCheck
    },
    {
      step: '04',
      title: 'Track Dispatch & Receive',
      desc: 'Live dispatch alerts, digital delivery run-sheets, and official GST tax invoices upon receipt.',
      icon: Truck
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* ========================================================================= */}
      {/* 1. TOP UTILITY BAR                                                        */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-slate-300 text-xs border-b border-slate-800 py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-[11px] sm:text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-slate-200 font-medium">Official FMCG Authorized Wholesale Distributor</span>
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:flex items-center space-x-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>Utraula &amp; Balrampur District Coverage (U.P.)</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-5 text-[11px]">
            <a 
              href="tel:+919140529661" 
              className="flex items-center space-x-1 text-slate-300 hover:text-amber-400 transition-colors"
            >
              <Phone className="w-3 h-3 text-amber-400" />
              <span className="font-semibold">+91 9140529661</span>
            </a>
            <button
              type="button"
              onClick={() => setIsDownloadModalOpen(true)}
              className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Get Android App</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN NAVIGATION HEADER                                                 */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center">
            <AryanAgencyLogo variant="horizontal" size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#about" className="hover:text-blue-900 transition-colors">About Us</a>
            <a href="#categories" className="hover:text-blue-900 transition-colors">Categories</a>
            <a href="#how-it-works" className="hover:text-blue-900 transition-colors">How It Works</a>
            <a href="#coverage" className="hover:text-blue-900 transition-colors">Distribution Network</a>
            <a href="#contact" className="hover:text-blue-900 transition-colors">Contact</a>
          </nav>

          {/* Desktop Action Buttons: Prominent Login and Sign Up */}
          <div className="hidden sm:flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-800 hover:text-blue-950 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer shadow-2xs"
            >
              <LogIn className="w-4 h-4 text-blue-700" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="inline-flex items-center space-x-2 px-4.5 py-2 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-md shadow-amber-500/20 border border-amber-400 transition-all cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Mobile Quick Action Buttons + Menu Toggle */}
          <div className="flex items-center space-x-2 sm:hidden">
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-slate-100 border border-slate-300"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-700" />
              <span>Login</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-amber-400 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center space-x-2 border border-slate-300"
              >
                <LogIn className="w-4 h-4 text-blue-700" />
                <span>Partner Login</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signup');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>New Retailer Sign Up</span>
              </button>
            </div>

            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                About Aryan Agency
              </a>
              <a 
                href="#categories" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                FMCG Categories
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                How Ordering Works
              </a>
              <a 
                href="#coverage" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Distribution Network
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Contact &amp; Helpdesk
              </a>
            </nav>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <a href="tel:+919140529661" className="font-semibold text-blue-900 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>+91 9140529661</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsDownloadModalOpen(true);
                }}
                className="font-bold text-emerald-700 flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download APK</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-[#0B1528] text-white pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
        
        {/* Subtle geometric background elements */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7 text-center lg:text-left">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Premier FMCG Super-Stockist &amp; Wholesale Partner</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.15] text-white">
                Your Trusted <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">FMCG Distribution</span> Partner
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Aryan Agency delivers reliable, direct-from-manufacturer wholesale supply to kirana stores, retail supermarkets, and merchants. Guaranteed genuine batches, competitive trade margins, and scheduled beat deliveries.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2.5 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Get Started / Register</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Partner Login</span>
                </button>
              </div>

              {/* Micro Trust Indicators */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 border-t border-white/10 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">100+</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Partner Brands</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">500+</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Retailers Served</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">24-48h</div>
                  <div className="text-[11px] sm:text-xs text-slate-400">Doorstep Delivery</div>
                </div>
              </div>

            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Aryan Wholesale Depot</h2>
                      <p className="text-[11px] text-slate-400">Balrampur &amp; Utraula Command Center</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Dispatch
                  </span>
                </div>

                {/* Highlights List */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Official Company Schemes</span>
                      <span className="text-slate-300">Instant trade volume bonuses and festive free-case offers automatically applied.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Transparent GST Tax Invoicing</span>
                      <span className="text-slate-300">100% compliant e-invoicing and input tax credit (ITC) for your retail business.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-white block">Salesman Beat Ordering Support</span>
                      <span className="text-slate-300">Order directly online or coordinate seamlessly with your designated route salesman.</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action in Visual Card */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenAuth('signin')}
                    className="w-full py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
                  >
                    <span>Access Retailer Portal</span>
                    <ChevronRight className="w-4 h-4 text-blue-900" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. BUSINESS CREDIBILITY PILLARS                                           */}
      {/* ========================================================================= */}
      <section id="about" className="py-14 sm:py-18 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Why Partner With Us
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Engineered for Modern FMCG Retailers &amp; Kiranas
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              We eliminate stock shortages, erratic deliveries, and opaque pricing with technology-driven distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuePillars.map((pillar, idx) => {
              const IconComp = pillar.icon;
              return (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. PRODUCT & BRAND CATEGORY SHOWCASE                                      */}
      {/* ========================================================================= */}
      <section id="categories" className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                Product Portfolio
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                Comprehensive FMCG Wholesale Range
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                Stocking the highest-demanded fast-moving consumer packaged goods from India’s premier brand manufacturers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="self-start sm:self-auto inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-blue-900 hover:text-blue-700 cursor-pointer"
            >
              <span>View Full Wholesale Price List</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productCategories.map((cat, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-6 bg-white border ${cat.borderColor} shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group`}
              >
                <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${cat.bgGradient} pointer-events-none`} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Key Brands
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.brands.map((brand, bIdx) => (
                      <span 
                        key={bIdx}
                        className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200/80"
                      >
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW IT WORKS (FOUR STREAMLINED STEPS)                                  */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Seamless Ordering
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              How FMCG Wholesale Works
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2">
              From store registration to doorstep dispatch in 4 effortless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {workflowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="relative flex flex-col items-center sm:items-start text-center sm:text-left">
                  
                  {/* Step Number Badge */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-sm shadow-md">
                      <StepIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <span className="text-2xl font-black text-slate-300 font-mono">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>

                </div>
              );
            })}
          </div>

          {/* Centered CTA beneath steps */}
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="inline-flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Register Your Retail Store Today</span>
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. DISTRIBUTION NETWORK & REGIONAL COVERAGE                               */}
      {/* ========================================================================= */}
      <section id="coverage" className="py-14 sm:py-18 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                Regional Logistics Network
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Covering Utraula &amp; Greater Balrampur Retail Routes
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Our distribution infrastructure operates dedicated delivery run-sheets across major market beats, rural retail hubs, and town centers. Whether you operate a single high-street kirana store or a multi-counter mini supermarket, our vehicles visit your locality regularly.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-amber-400">Utraula Town</div>
                  <div className="text-[11px] text-slate-400">Daily Beat Schedule</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-amber-400">Balrampur Main</div>
                  <div className="text-[11px] text-slate-400">Alternate Day Delivery</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-amber-400">Rural Markets</div>
                  <div className="text-[11px] text-slate-400">Weekly Route Coverage</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-4">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Headphones className="w-5 h-5 text-amber-400" />
                  <span>Onboard Your Store In 5 Minutes</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Need a salesman to visit your shop with physical product samples and wholesale price books? Contact our distribution manager immediately:
                </p>
                
                <div className="space-y-2 text-xs">
                  <a
                    href="tel:+919140529661"
                    className="flex items-center space-x-3 p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Distribution Desk: +91 9140529661</span>
                  </a>

                  <a
                    href="mailto:aryanagency@zohomail.in"
                    className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/15"
                  >
                    <Mail className="w-4 h-4 text-cyan-300" />
                    <span>Email: aryanagency@zohomail.in</span>
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer id="contact" className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
            
            {/* Company Info */}
            <div className="lg:col-span-5 space-y-4">
              <AryanAgencyLogo variant="horizontal" size="md" theme="dark" />
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Aryan Agency is an authorized FMCG wholesale distributor providing super-stockist distribution, retailer trade credit, scheduled delivery, and digital supply chain solutions for kirana and grocery businesses.
              </p>
              <div className="text-xs text-slate-500 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>GST Compliant • Trade License Verified</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-3 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Quick Navigation
              </h3>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    type="button" 
                    onClick={() => onOpenAuth('signin')} 
                    className="hover:text-amber-400 cursor-pointer"
                  >
                    Partner Login
                  </button>
                </li>
                <li>
                  <button 
                    type="button" 
                    onClick={() => onOpenAuth('signup')} 
                    className="hover:text-amber-400 cursor-pointer"
                  >
                    Retailer Registration
                  </button>
                </li>
                <li>
                  <a href="#categories" className="hover:text-amber-400">
                    Product Categories
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-amber-400">
                    Ordering Workflow
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsDownloadModalOpen(true)}
                    className="hover:text-emerald-400 text-emerald-500 font-semibold cursor-pointer"
                  >
                    Download Android App (APK)
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Details */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Contact &amp; Warehouse
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Main Depot, Subhash Nagar, Hatan Road, Utraula, District Balrampur, Uttar Pradesh - 271604</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a href="tel:+919140529661" className="text-slate-200 hover:text-white font-semibold">
                    +91 9140529661
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <a href="mailto:aryanagency@zohomail.in" className="text-slate-200 hover:text-white">
                    aryanagency@zohomail.in
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Monday – Saturday: 8:00 AM – 8:00 PM</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <div>
              © {new Date().getFullYear()} Aryan Agency FMCG Distribution. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <button 
                type="button" 
                onClick={() => onOpenAuth('signin')} 
                className="hover:text-slate-300 cursor-pointer"
              >
                Sign In
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => onOpenAuth('signup')} 
                className="hover:text-slate-300 cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* App Download Modal */}
      <AppDownloadModal 
        isOpen={isDownloadModalOpen} 
        onClose={() => setIsDownloadModalOpen(false)} 
      />

    </div>
  );
};
