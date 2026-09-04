import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AppUser, PartnerRole } from '@/types';

interface AuthContextValue {
  session: Session | null;
  profile: AppUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: PartnerRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    setProfile((data as AppUser) ?? null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) fetchProfile(newSession.user.id);
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Mark presence online/offline based on tab visibility + lifecycle.
  useEffect(() => {
    if (!profile?.id) return;

    const setOnline = (online: boolean) => {
      supabase
        .from('users')
        .update({ is_online: online, last_seen_at: new Date().toISOString() })
        .eq('id', profile.id)
        .then(() => {});
    };

    setOnline(true);
    const handleVisibility = () => setOnline(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', () => setOnline(false));

    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') setOnline(true);
    }, 45_000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(heartbeat);
      setOnline(false);
    };
  }, [profile?.id]);

  const signInWithEmail: AuthContextValue['signInWithEmail'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail: AuthContextValue['signUpWithEmail'] = async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const signOut = async () => {
    if (profile?.id) {
      await supabase.from('users').update({ is_online: false }).eq('id', profile.id);
    }
    await supabase.auth.signOut();
  };

  const setRole = async (role: PartnerRole) => {
    if (!session) return;
    await supabase.from('users').update({ role }).eq('id', session.user.id);
    await fetchProfile(session.user.id);
  };

  const refreshProfile = async () => {
    if (session) await fetchProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        refreshProfile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        setRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
