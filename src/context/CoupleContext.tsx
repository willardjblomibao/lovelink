import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { AppUser, Couple, PartnerRole } from '@/types';

interface CoupleContextValue {
  couple: Couple | null;
  partner: AppUser | null;
  loading: boolean;
  createInvite: (role: PartnerRole) => Promise<{ code: string | null; error: string | null }>;
  joinWithCode: (code: string, role: PartnerRole) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextValue | undefined>(undefined);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCouple = async () => {
    if (!profile?.couple_id) {
      setCouple(null);
      setPartner(null);
      setLoading(false);
      return;
    }
    const { data: coupleData } = await supabase
      .from('couples')
      .select('*')
      .eq('id', profile.couple_id)
      .single();

    if (coupleData) {
      setCouple(coupleData as Couple);
      const partnerId =
        coupleData.boyfriend_id === profile.id ? coupleData.girlfriend_id : coupleData.boyfriend_id;
      if (partnerId) {
        const { data: partnerData } = await supabase.from('users').select('*').eq('id', partnerId).single();
        setPartner((partnerData as AppUser) ?? null);
      } else {
        setPartner(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    loadCouple();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.couple_id, profile?.id]);

  // Realtime: couple row changes (partner connects, anniversary set, daily quote, etc.)
  useEffect(() => {
    if (!couple?.id) return;
    const channel = supabase
      .channel(`couple:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${couple.id}` },
        (payload) => setCouple(payload.new as Couple)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const updated = payload.new as AppUser;
          if (updated.id !== profile?.id) setPartner(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, profile?.id]);

  const createInvite: CoupleContextValue['createInvite'] = async (role) => {
    const { data, error } = await supabase.rpc('create_couple', { p_role: role });
    if (error) return { code: null, error: error.message };
    await refreshProfile();
    await loadCouple();
    return { code: (data as Couple).invite_code, error: null };
  };

  const joinWithCode: CoupleContextValue['joinWithCode'] = async (code, role) => {
    const { error } = await supabase.rpc('join_couple', { p_code: code.trim().toUpperCase(), p_role: role });
    if (error) return { error: error.message };
    await refreshProfile();
    await loadCouple();
    return { error: null };
  };

  return (
    <CoupleContext.Provider value={{ couple, partner, loading, createInvite, joinWithCode, refresh: loadCouple }}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error('useCouple must be used within CoupleProvider');
  return ctx;
}
