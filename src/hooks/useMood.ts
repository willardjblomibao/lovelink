import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Mood, MoodType } from '@/types';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function useMood(coupleId: string | null) {
  const [todayMoods, setTodayMoods] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

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
        (payload) => {
          const row = payload.new as Mood;
          setTodayMoods((prev) => [row, ...prev.filter((m) => m.user_id !== row.user_id)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'moods', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          const row = payload.new as Mood;
          setTodayMoods((prev) => {
            const exists = prev.some((m) => m.id === row.id);
            return exists ? prev.map((m) => (m.id === row.id ? row : m)) : [row, ...prev];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const setMood = async (coupleId: string, userId: string, mood: MoodType, note?: string) => {
    // Guard against rapid repeated taps firing overlapping requests.
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);

    // Optimistic local update so the UI reflects the tap instantly.
    const dateStr = todayDateString();
    setTodayMoods((prev) => {
      const existing = prev.find((m) => m.user_id === userId);
      if (existing) return prev.map((m) => (m.user_id === userId ? { ...m, mood, note: note ?? null } : m));
      return [
        { id: `optimistic-${userId}`, couple_id: coupleId, user_id: userId, mood, note: note ?? null, created_at: new Date().toISOString() } as Mood,
        ...prev
      ];
    });

    // One row per (couple, user, day): upsert instead of insert so repeated
    // taps update the same row rather than creating duplicates.
    await supabase
      .from('moods')
      .upsert(
        { couple_id: coupleId, user_id: userId, mood, note, mood_date: dateStr, created_at: new Date().toISOString() },
        { onConflict: 'couple_id,user_id,mood_date' }
      );

    savingRef.current = false;
    setSaving(false);
  };

  const latestFor = (userId: string) => todayMoods.find((m) => m.user_id === userId) ?? null;

  return { todayMoods, loading, saving, setMood, latestFor };
}
