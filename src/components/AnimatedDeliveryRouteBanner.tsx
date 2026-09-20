import React from 'react';
import { ChevronRight, Building2, Store, Navigation, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AnimatedDeliveryRouteBannerProps {
  onTrackOrders: () => void;
  className?: string;
}

export const AnimatedDeliveryRouteBanner: React.FC<AnimatedDeliveryRouteBannerProps> = ({
  onTrackOrders,
  className = ''
}) => {
  return (
    <div
      id="direct-depot-animated-banner"
      className={`w-full rounded-2xl bg-gradient-to-r from-[#071E3D] via-[#0E2F59] to-[#0A2447] p-3.5 sm:p-4 md:p-5 shadow-lg border border-blue-800/60 relative overflow-hidden text-white transition-all select-none ${className}`}
    >
      {/* Background Ambient Logistics Glows */}
      <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Section: Information Header & Action Button */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex-1 min-w-0">
          {/* Header Title with Official FMCG Logistics Badge */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
              <span>Direct Depot Supply</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Genuine Direct Supply</span>
            </span>
          </div>

          <h3 className="text-sm sm:text-base md:text-lg font-black text-white tracking-tight leading-snug drop-shadow-xs">
            डिपो से दुकान तक सीधी डिलीवरी
          </h3>

          <p className="text-[11px] sm:text-xs text-blue-200/95 font-medium mt-0.5 tracking-tight leading-relaxed">
            किराना दुकानों के लिए 24 घंटे में डिलीवरी • 100% पक्का GST बिल • Order Tracking
          </p>
        </div>

        {/* Track Orders Action Button */}
        <div className="flex items-center shrink-0">
          <button
            id="home-compact-track-order-btn"
            type="button"
            onClick={onTrackOrders}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFB703] to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap border border-amber-300"
          >
            <Navigation className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
            <span>Track Orders</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ANIMATED DELIVERY HIGHWAY ROUTE: DEPOT -> ROAD -> KIRANA SHOP            */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full pt-2.5 border-t border-blue-800/40">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          
          {/* 1. LEFT POINT: ARYAN DEPOT (DISPATCH POINT) */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#092244] border-2 border-amber-400/80 flex items-center justify-center text-amber-300 shadow-md shadow-amber-500/10">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              {/* Online Hub Indicator Dot */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#071E3D] rounded-full animate-pulse" />
            </div>

            <div className="hidden xs:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs font-black text-white leading-tight">
                  Aryan Depot
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-amber-300/90 block leading-tight">
                डिपो (Utraula)
              </span>
            </div>
          </div>

          {/* 2. CENTER HIGHWAY LANE: ANIMATED ROAD WITH FMCG MINI-TRUCK */}
          <div className="flex-1 min-w-[120px] max-w-full relative mx-1 sm:mx-2">
            
            {/* Highway Road Surface */}
            <div className="w-full h-8 sm:h-9 bg-[#081528] rounded-full border border-blue-700/60 relative overflow-hidden shadow-inner flex items-center px-1">
              
              {/* Road Asphalt Texture / Grid Lines */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-slate-900 to-blue-950/40" />

              {/* Animated Road Centerline (Moving Dashes) */}
              <div 
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] w-full"
                style={{
                  backgroundImage: 'repeating-linear-gradient(to right, #facc15 0, #facc15 8px, transparent 8px, transparent 18px)',
                  backgroundSize: '24px 2px',
                  animation: 'deliveryRoadMove 1.2s linear infinite'
                }}
              />

              {/* Subtle Route Milestone Waypoints */}
              <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500/60 pointer-events-none" />
              <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400/60 pointer-events-none" />
              <div className="absolute left-3/4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500/60 pointer-events-none" />

              {/* MOVING FMCG MINI-TRUCK CONTAINER */}
              <div
                className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none"
                style={{
                  animation: 'fmcgTruckDeliveryRoute 6s cubic-bezier(0.4, 0.0, 0.2, 1) infinite'
                }}
              >
                {/* FMCG Delivery Mini-Truck (Tata Ace / Commercial Cargo Van SVG) */}
                <svg
                  className="w-10 h-7 sm:w-12 sm:h-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] filter"
                  viewBox="0 0 54 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Headlight Beam shining forward on road */}
                  <path d="M46 17 L54 11 L54 27 L46 22 Z" fill="url(#truckHeadlightBeam)" opacity="0.65" />

                  {/* Truck Chassis Underbody */}
                  <rect x="5" y="22" width="42" height="3" rx="1.5" fill="#0f172a" />

                  {/* Closed FMCG Cargo Box (Aryan Agency Branded) */}
                  <rect x="4" y="6" width="28" height="17" rx="2" fill="#1A73E8" stroke="#60A5FA" strokeWidth="1" />
                  
                  {/* Cargo Accent Striping */}
                  <line x1="4" y1="18" x2="32" y2="18" stroke="#FBBF24" strokeWidth="1.5" />
                  
                  {/* Aryan FMCG Express Plate */}
                  <rect x="7" y="9" width="22" height="7" rx="1" fill="#0A2540" />
                  <text x="18" y="14.2" fill="#FBBF24" fontSize="4.2" fontWeight="900" textAnchor="middle" letterSpacing="0.6">
                    ARYAN
                  </text>
                  <text x="18" y="17" fill="#E2E8F0" fontSize="2.3" fontWeight="bold" textAnchor="middle" letterSpacing="0.4">
                    EXPRESS
                  </text>

                  {/* Driver Cabin */}
                  <path d="M32 9 H42 L47 16 V23 H32 V9 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
                  
                  {/* Cabin Windshield */}
                  <path d="M34 11 H41 L45 16 H34 V11 Z" fill="#38BDF8" opacity="0.9" />

                  {/* Amber Headlight & Red Taillight */}
                  <rect x="46.5" y="18" width="2" height="3" rx="0.5" fill="#FDE047" />
                  <rect x="3" y="18" width="1.5" height="3" rx="0.5" fill="#EF4444" />

                  {/* Heavy Duty Wheels with Hubcaps */}
                  <circle cx="12" cy="24" r="4.2" fill="#020617" stroke="#94A3B8" strokeWidth="1" />
                  <circle cx="12" cy="24" r="1.8" fill="#E2E8F0" />
                  
                  <circle cx="39" cy="24" r="4.2" fill="#020617" stroke="#94A3B8" strokeWidth="1" />
                  <circle cx="39" cy="24" r="1.8" fill="#E2E8F0" />

                  {/* Speed Exhaust Puff behind truck */}
                  <circle cx="2" cy="22" r="1" fill="#94a3b8" opacity="0.4" />
                  <circle cx="0.5" cy="21.5" r="0.7" fill="#94a3b8" opacity="0.2" />

                  {/* Gradient Definition for Headlight */}
                  <defs>
                    <linearGradient id="truckHeadlightBeam" x1="46" y1="19" x2="54" y2="19" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FEF08A" stopOpacity="0.8" />
                      <stop offset="1" stopColor="#FEF08A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Middle Label in Road Overlay */}
              <div className="absolute inset-x-0 bottom-0.5 text-center pointer-events-none">
                <span className="text-[8px] sm:text-[9px] font-bold text-blue-300/60 uppercase tracking-widest">
                  Direct Highway Route • 24h Transit
                </span>
              </div>
            </div>

            {/* Mobile Route Label Under Track */}
            <div className="block xs:hidden text-center mt-1">
              <span className="text-[9px] font-bold text-amber-300/90">
                डिपो से सीधे आपकी दुकान तक
              </span>
            </div>
          </div>

          {/* 3. RIGHT POINT: KIRANA SHOP / RETAILER SHOP (DESTINATION) */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="hidden xs:block text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-[11px] sm:text-xs font-black text-white leading-tight">
                  Kirana Shop
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-300/90 block leading-tight">
                किराना दुकान (Counter)
              </span>
            </div>

            <div className="relative">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#082823] border-2 border-emerald-400/80 flex items-center justify-center text-emerald-300 shadow-md shadow-emerald-500/10">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              {/* Destination Arrived Checkmark Badge */}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#071E3D] rounded-full flex items-center justify-center text-[9px] text-white font-black shadow-xs">
                ✓
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Embedded CSS Animations for the Continuous Delivery Loop */}
      <style>{`
        @keyframes fmcgTruckDeliveryRoute {
          0% {
            left: 2%;
            opacity: 0;
            transform: translateY(-50%) scale(0.88);
          }
          4% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          45% {
            transform: translateY(-50%) scale(1);
          }
          86% {
            left: calc(100% - 50px);
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          93% {
            left: calc(100% - 46px);
            opacity: 1;
            transform: translateY(-50%) scale(1.03);
          }
          97% {
            opacity: 0.2;
            transform: translateY(-50%) scale(0.95);
          }
          100% {
            left: calc(100% - 42px);
            opacity: 0;
            transform: translateY(-50%) scale(0.9);
          }
        }

        @keyframes deliveryRoadMove {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 24px 0;
          }
        }
      `}</style>
    </div>
  );
};
