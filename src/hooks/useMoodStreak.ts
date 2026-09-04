import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useMoodStreak(coupleId: string | null, boyfriendId?: string | null, girlfriendId?: string | null) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!coupleId || !boyfriendId || !girlfriendId) return;

    const load = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data } = await supabase
        .from('moods')
        .select('user_id, mood_date')
        .eq('couple_id', coupleId)
        .gte('mood_date', since.toISOString().slice(0, 10));

      if (!data) return;

      const byDate = new Map<string, Set<string>>();
      for (const row of data as { user_id: string; mood_date: string }[]) {
        if (!byDate.has(row.mood_date)) byDate.set(row.mood_date, new Set());
        byDate.get(row.mood_date)!.add(row.user_id);
      }

      let count = 0;
      const cursor = new Date();
      for (let i = 0; i < 30; i++) {
        const key = cursor.toISOString().slice(0, 10);
        const users = byDate.get(key);
        if (users && users.has(boyfriendId) && users.has(girlfriendId)) {
          count++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
      setStreak(count);
    };

    load();
  }, [coupleId, boyfriendId, girlfriendId]);

  return streak;
}
