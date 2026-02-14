import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase, AUTH_STORAGE_KEY } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from '../utils/domain';
import logger from '../utils/logger';

export interface AuthUser {
  username: string;
  userId: string;
  email?: string;
  attributes?: Record<string, any>;
  signInDetails?: {
    loginId?: string;
    authFlowType?: string;
  };
}

interface AuthContextType {
  user: User | null;
  currentAuthUser: AuthUser | null;
  authRole: User['role'] | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'user' | 'seller' | 'admin', fullName: string, currency?: string, phoneNumber?: string, countryId?: string, businessTypeId?: string) => Promise<any>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; isSignedIn?: boolean; role?: User['role'] | null; error?: any }>;
  signOut: () => Promise<'user' | 'seller' | 'admin' | null>;
  resetPassword: (email: string) => Promise<any>;
  confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<any>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: fetch profile from Supabase `profiles` table
async function fetchProfile(supabaseUser: SupabaseUser, retries = 3): Promise<User | null> {
  for (let i = 0; i < retries; i++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      // Don't retry on AbortError — the request was cancelled, retrying won't help
      if (error.message?.includes('abort')) {
        console.info('[Auth] fetchProfile aborted, using metadata fallback');
        break;
      }
      logger.error(new Error(`fetchProfile attempt ${i + 1}: ${error.message}`), { code: error.code });
      // Profile may not exist yet (trigger hasn't fired), wait and retry
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      // All retries failed — return fallback from user_metadata
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        role: (supabaseUser.user_metadata?.role as User['role']) || 'user',
        full_name: supabaseUser.user_metadata?.full_name || '',
        phone: supabaseUser.user_metadata?.phone || '',
        created_at: supabaseUser.created_at || new Date().toISOString(),
      };
    }

    if (data) {
      return {
        id: data.id,
        email: data.email || supabaseUser.email || '',
        role: data.role || 'user',
        full_name: data.full_name,
        phone: data.phone,
        avatar_url: data.avatar_url,
        is_verified: data.is_verified,
        approved: data.approved,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  }
  return null;
}

// Helper: convert Supabase user to AuthUser
function toAuthUser(su: SupabaseUser): AuthUser {
  return {
    username: su.id,
    userId: su.id,
    email: su.email,
    attributes: su.user_metadata,
    signInDetails: { loginId: su.email, authFlowType: 'USER_PASSWORD_AUTH' },
  };
}

/**
 * Pre-flight: remove expired tokens from localStorage BEFORE the SDK
 * subscribes to onAuthStateChange.  This prevents _initialize() from
 * attempting a slow token-refresh that holds the navigator.locks lock
 * and blocks subsequent signInWithPassword() calls.
 */
  function clearStaleToken(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const expiresAt: number | undefined = parsed?.expires_at;
    if (expiresAt && expiresAt * 1000 < Date.now()) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      console.info('[Auth] Cleared expired token from localStorage');
    }
  } catch {
    // Corrupt token — remove it so the SDK starts fresh
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      /* noop for non-browser envs */
    }
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentAuthUser, setCurrentAuthUser] = useState<AuthUser | null>(null);
  const [authRole, setAuthRole] = useState<User['role'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialSessionHandled = false;

    // ── Step 1: Remove expired/corrupt tokens before SDK init ──
    clearStaleToken();

    // ── Step 2: Single listener — replaces the old initSession() + onAuthStateChange pair ──
    // The SDK fires INITIAL_SESSION synchronously during subscribe, delivering
    // the existing session (or null) without a separate getSession() call.
    // This eliminates the navigator.locks contention that caused login timeouts.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // ── No session (signed out or no existing session) ──
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setCurrentAuthUser(null);
        setAuthRole(null);
        if (event === 'INITIAL_SESSION') {
          initialSessionHandled = true;
          setLoading(false);
        }
        return;
      }

      // ── Valid session: INITIAL_SESSION | SIGNED_IN | TOKEN_REFRESHED ──
      const profile = await fetchProfile(session.user);
      if (profile && mounted) {
        setUser(profile);
        setCurrentAuthUser(toAuthUser(session.user));
        setAuthRole(profile.role);
      }

      if (event === 'INITIAL_SESSION') {
        initialSessionHandled = true;
        setLoading(false);
      }
    });

    // Safety net: if INITIAL_SESSION never fires (should not happen, defence-in-depth)
    const safetyTimer = setTimeout(() => {
      if (mounted && !initialSessionHandled) {
        console.warn('[Auth] INITIAL_SESSION did not fire within 10 s — continuing as guest');
        setLoading(false);
      }
    }, 10_000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign up with email + password.
   * Supabase sends a 6-digit OTP email automatically (configured in Supabase dashboard).
   * The role & full_name are stored in user_metadata and inserted into `profiles` via DB trigger.
   */
  const signUp = async (
    email: string,
    password: string,
    role: 'user' | 'seller' | 'admin',
    fullName: string,
    currency?: string,
    phoneNumber?: string,
    _countryId?: string,
    businessTypeId?: string
  ) => {
    try {
      // ── Pre-flight: check if email already exists in profiles ──
      const { data: existingEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (existingEmail) {
        return { success: false, error: { message: 'Email Id already Exist' } };
      }

      // ── Pre-flight: check if mobile number already exists ──
      if (phoneNumber && phoneNumber.trim()) {
        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', phoneNumber.trim())
          .maybeSingle();

        if (existingPhone) {
          return { success: false, error: { message: 'Mobile Number Already Exist' } };
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            currency: currency || 'INR',
            phone: phoneNumber || '',
            country_id: _countryId,
            business_type_id: businessTypeId,
          },
        },
      });

      if (error) {
        // Map Supabase auth errors to user-friendly messages
        let message = error.message;
        if (message.includes('User already registered') || message.includes('already been registered')) {
          message = 'Email Id already Exist';
        }
        return { success: false, error: { message } };
      }

      // Supabase may return a user with identities=[] if email is already taken
      // (when "Confirm email" is enabled and user exists but hasn't verified)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        return { success: false, error: { message: 'Email Id already Exist' } };
      }

      return {
        success: true,
        userId: data.user?.id,
        isSignUpComplete: false, // needs OTP verification
      };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to sign up' } };
    }
  };

  /**
   * Sign in with email + password.
   * Lock contention is eliminated, so no timeout wrapper is needed.
   * The per-request 15 s fetch timeout in supabase.ts is the only safety net.
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        // Map Supabase errors to user-friendly messages
        let message = error.message;
        if (message.includes('Invalid login credentials')) {
          message = 'Incorrect email or password.';
        } else if (message.includes('Email not confirmed')) {
          message = 'Please verify your email first. Check your inbox for the OTP code.';
        }
        return { success: false, error: { message } };
      }

      if (!data.user) {
        return { success: false, error: { message: 'Sign in failed' } };
      }

      const profile = await fetchProfile(data.user);
      const role = profile?.role || (data.user.user_metadata?.role as User['role']) || 'user';

      if (profile) {
        setUser(profile);
        setCurrentAuthUser(toAuthUser(data.user));
        setAuthRole(role);
      }

      return { success: true, isSignedIn: true, role };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to sign in' } };
    }
  };

  const signOut = async () => {
    const roleBeforeSignout = authRole;
    await supabase.auth.signOut();
    setUser(null);
    setCurrentAuthUser(null);
    setAuthRole(null);
    return roleBeforeSignout;
  };

  /**
   * Send password reset OTP email.
   */
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl('/new-password'),
      });
      if (error) return { success: false, error: { message: error.message } };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to send reset code' } };
    }
  };

  /**
   * Verify OTP and set new password.
   * Uses Supabase's verifyOtp for email type, then updateUser for the new password.
   */
  const confirmPasswordReset = async (email: string, code: string, newPassword: string) => {
    try {
      // Verify the OTP token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });

      if (verifyError) {
        return { success: false, error: { message: verifyError.message } };
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: { message: updateError.message } };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to reset password' } };
    }
  };

  /**
   * Confirm signup OTP (6-digit code sent to email).
   */
  const confirmSignUp = async (email: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          return { success: false, alreadyConfirmed: true, error: { message: 'Already verified' } };
        }
        return { success: false, error: { message: error.message } };
      }

      // After OTP verification, user is auto signed in
      if (data.user) {
        const profile = await fetchProfile(data.user);
        if (profile) {
          setUser(profile);
          setCurrentAuthUser(toAuthUser(data.user));
          setAuthRole(profile.role);
        }
      }

      return { success: true, isSignUpComplete: true };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to verify OTP' } };
    }
  };

  const value = {
    user,
    currentAuthUser,
    authRole,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    confirmPasswordReset,
    confirmSignUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
