import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setApiAuthContext } from '../lib/api';
import { supabaseService, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  currentUser: User | null;
  authenticatedUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  isAuthenticated: boolean;
  switchUser: (userId: string) => Promise<void>;
  currentRole: UserRole | '';
  isAdmin: boolean;
  isSalesman: boolean;
  isDelivery: boolean;
  isDeliveryDriver: boolean; // Backwards compatible alias
  isAccounts: boolean;
  isRetailer: boolean;
  // Permissions
  canManageProducts: boolean;
  canManageSalesmen: boolean;
  canManageInventory: boolean;
  canManageOrders: boolean;
  canManagePayments: boolean;
  canAccessDeliveries: boolean;
  canAccessFinancials: boolean;
  // Supabase Auth Methods
  isAuthenticatedWithSupabase: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, pass: string, profile: { name: string; phone: string; role: UserRole; salesmanId?: string; retailerId?: string; deliveryId?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticatedWithSupabase, setIsAuthenticatedWithSupabase] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const loadAuth = async () => {
    try {
      setIsLoading(true);
      // Fetch user directory in the background without blocking the auth session check
      api.getUsers()
        .then(users => {
          if (users && users.length > 0) {
            setAllUsers(users);
          }
        })
        .catch(e => {
          console.warn('Could not load users list:', e);
        });

      // Check if active Supabase session exists in storage with a guaranteed safe timeout
      if (isSupabaseConfigured) {
        try {
          const sessionPromise = supabaseService.getAuthSession();
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 2500)
          );
          const session = await Promise.race([sessionPromise, timeoutPromise]);

          if (session?.user?.email) {
            setIsAuthenticatedWithSupabase(true);
            let dbProfile: User | null = null;
            try {
              const profilePromise = supabaseService.getUserByEmail(session.user.email);
              const profileTimeout = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 2000)
              );
              dbProfile = await Promise.race([profilePromise, profileTimeout]);
            } catch (e) {
              console.warn('Could not fetch DB profile:', e);
            }

            if (!dbProfile && session.user) {
              dbProfile = {
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                email: session.user.email,
                phone: session.user.user_metadata?.phone || '+91 98000 00000',
                role: (session.user.user_metadata?.role as any) || 'salesman'
              };
            }
            if (dbProfile) {
              setAuthenticatedUser(dbProfile);
              setCurrentUser(dbProfile);
              setApiAuthContext(session.access_token || null, dbProfile.id, dbProfile.role);
              return;
            }
          }
        } catch (e) {
          console.warn('Supabase auth session verification failed:', e);
        }
      }

      // No active session found: User must authenticate
      setAuthenticatedUser(null);
      setCurrentUser(null);
      setApiAuthContext(null, null, null);
      setIsAuthenticatedWithSupabase(false);
    } catch (err) {
      console.error('Failed to verify authentication session', err);
      setAuthenticatedUser(null);
      setCurrentUser(null);
      setApiAuthContext(null, null, null);
      setIsAuthenticatedWithSupabase(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuth();

    // Absolute fallback: ensure isLoading cannot remain true under any circumstance
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    // Listen to Supabase auth state changes if client is ready
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabaseService.onAuthStateChange(async (event, session) => {
        if (session?.user?.email) {
          setIsAuthenticatedWithSupabase(true);
          let profile = await supabaseService.getUserByEmail(session.user.email).catch(() => null);
          if (!profile && session.user) {
            profile = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email.split('@')[0],
              email: session.user.email,
              phone: session.user.user_metadata?.phone || '+91 98000 00000',
              role: (session.user.user_metadata?.role as any) || 'salesman'
            };
          }
          if (profile) {
            setAuthenticatedUser(profile);
            setCurrentUser(profile);
            setApiAuthContext(session.access_token || null, profile.id, profile.role);
          }
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT' || !session) {
          setAuthenticatedUser(null);
          setCurrentUser(null);
          setApiAuthContext(null, null, null);
          setIsAuthenticatedWithSupabase(false);
          setIsLoading(false);
        }
      });

      return () => {
        clearTimeout(safetyTimer);
        subscription?.unsubscribe();
      };
    } else {
      setIsLoading(false);
      return () => {
        clearTimeout(safetyTimer);
      };
    }
  }, []);

  const switchUser = async (userId: string) => {
    // 1. Enforce RBAC: Non-admin users cannot switch roles or escalate privileges
    if (!authenticatedUser || authenticatedUser.role !== 'admin') {
      console.warn(`[RBAC Guard] User ${authenticatedUser?.email} with role '${authenticatedUser?.role}' is not authorized to switch roles.`);
      alert(`Access Denied: Your account role (${authenticatedUser?.role?.toUpperCase() || 'RESTRICTED'}) is not authorized to change roles. Only Owner/Admin can switch persona views.`);
      return;
    }

    try {
      const res = await api.switchUser(userId);
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setApiAuthContext(null, res.user.id, res.user.role);
      } else {
        alert('Unauthorized: Failed to switch role. Operation blocked by server security.');
      }
    } catch (err) {
      console.error('Error switching user', err);
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await supabaseService.signInWithEmail(email, pass);
      if (res.user) {
        setAuthenticatedUser(res.user);
        setCurrentUser(res.user);
        setIsAuthenticatedWithSupabase(true);
        const session = await supabaseService.getAuthSession().catch(() => null);
        setApiAuthContext(session?.access_token || null, res.user.id, res.user.role);
      }
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please check your credentials.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string, 
    pass: string, 
    profile: { name: string; phone: string; role: UserRole; salesmanId?: string; retailerId?: string; deliveryId?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await supabaseService.signUpWithEmail(email, pass, profile);
      if (res.user) {
        setAuthenticatedUser(res.user);
        setCurrentUser(res.user);
        setIsAuthenticatedWithSupabase(true);
        const session = await supabaseService.getAuthSession().catch(() => null);
        setApiAuthContext(session?.access_token || null, res.user.id, res.user.role);
      }
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      if (isSupabaseConfigured) {
        await supabaseService.signOut();
      }
      setAuthenticatedUser(null);
      setCurrentUser(null);
      setApiAuthContext(null, null, null);
      setIsAuthenticatedWithSupabase(false);
    } catch (err) {
      console.error('Logout error:', err);
      setAuthenticatedUser(null);
      setCurrentUser(null);
      setApiAuthContext(null, null, null);
      setIsAuthenticatedWithSupabase(false);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRole: UserRole | '' = currentUser?.role || '';
  const isAdmin = currentRole === 'admin';
  const isSalesman = currentRole === 'salesman';
  const isDelivery = currentRole === 'delivery';
  const isDeliveryDriver = currentRole === 'delivery';
  const isAccounts = currentRole === 'accounts';
  const isRetailer = currentRole === 'retailer';

  // Role Permissions
  const canManageProducts = isAdmin;
  const canManageSalesmen = isAdmin;
  const canManageInventory = isAdmin;
  const canManageOrders = isAdmin || isSalesman || isAccounts || isRetailer;
  const canManagePayments = isAdmin || isAccounts || isSalesman || isDelivery;
  const canAccessDeliveries = isAdmin || isDelivery;
  const canAccessFinancials = isAdmin || isAccounts;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authenticatedUser,
        allUsers,
        isLoading,
        isAuthenticated: Boolean(currentUser),
        switchUser,
        currentRole,
        isAdmin,
        isSalesman,
        isDelivery,
        isDeliveryDriver,
        isAccounts,
        isRetailer,
        canManageProducts,
        canManageSalesmen,
        canManageInventory,
        canManageOrders,
        canManagePayments,
        canAccessDeliveries,
        canAccessFinancials,
        isAuthenticatedWithSupabase,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        signInWithEmail,
        signUpWithEmail,
        logout,
        refreshUsers: loadAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
