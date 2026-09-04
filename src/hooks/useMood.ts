import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Mood, MoodType } from '@/types';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useMood(coupleId: string | null) {
  const [todayMoods, setTodayMoods] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!coupleId) return;
    const { data } = await supabase
      .from('moods')
      .select('*')
      .eq('couple_id', coupleId)
      .gte('created_at', startOfToday())
      .order('created_at', { ascending: false });
    setTodayMoods((data as Mood[]) ?? []);
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`moods:${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'moods', filter: `couple_id=eq.${coupleId}` },
        (payload) => setTodayMoods((prev) => [payload.new as Mood, ...prev])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const setMood = async (coupleId: string, userId: string, mood: MoodType, note?: string) => {
    await supabase.from('moods').insert({ couple_id: coupleId, user_id: userId, mood, note });
  };

  const latestFor = (userId: string) => todayMoods.find((m) => m.user_id === userId) ?? null;

  return { todayMoods, loading, setMood, latestFor };
}
