import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  pageName?: string;
  onNavigateHome?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  pageName = 'Dashboard Module',
  onNavigateHome
}) => {
  const { currentUser, currentRole, isLoading } = useAuth();

  // 1. Loading State Guard
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-medium">Verifying authorization permissions...</p>
      </div>
    );
  }

  // 2. Unauthenticated Guard
  if (!currentUser) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Authentication Required</h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          The Aryan Agency FMCG Distribution dashboard is strictly protected. Please sign in with your Supabase credentials to proceed.
        </p>
      </div>
    );
  }

  // 3. Role-Based Access Guard
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-8 text-center max-w-lg mx-auto my-12">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Access Restricted: {pageName}</h3>
        <p className="text-xs text-slate-600 mb-2 leading-relaxed">
          Your active account <span className="font-semibold text-slate-800">{currentUser.name}</span> has the role{' '}
          <span className="inline-block px-2 py-0.5 font-semibold uppercase text-[10px] bg-amber-100 text-amber-800 rounded">
            {currentRole}
          </span>
          , which does not have permission to view this section.
        </p>
        <p className="text-[11px] text-slate-500 mb-6">
          Authorized roles for this view: {allowedRoles.map(r => r.toUpperCase()).join(', ')}.
        </p>
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        )}
      </div>
    );
  }

  // 4. Authorized: Render Page Content
  return <>{children}</>;
};
