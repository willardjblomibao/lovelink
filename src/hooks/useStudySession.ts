import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { StudySession, StudyTask } from '@/types';

export function useStudySession(coupleId: string | null) {
  const [session, setSession] = useState<StudySession | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!coupleId) return;
    const [{ data: sessionData }, { data: taskData }] = await Promise.all([
      supabase.from('study_sessions').select('*').eq('couple_id', coupleId).maybeSingle(),
      supabase.from('study_tasks').select('*').eq('couple_id', coupleId).order('created_at', { ascending: true })
    ]);
    setSession((sessionData as StudySession) ?? null);
    setTasks((taskData as StudyTask[]) ?? []);
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`study:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_sessions', filter: `couple_id=eq.${coupleId}` },
        (payload) => setSession(payload.new as StudySession)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_tasks', filter: `couple_id=eq.${coupleId}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, load]);

  const joinSession = async (userId: string, durationMinutes = 25) => {
    if (!coupleId) return;
    const current = session?.active_user_ids ?? [];
    const nextIds = Array.from(new Set([...current, userId]));
    await supabase.from('study_sessions').upsert({
      couple_id: coupleId,
      active_user_ids: nextIds,
      timer_started_at: session?.timer_started_at ?? new Date().toISOString(),
      duration_minutes: session?.duration_minutes ?? durationMinutes,
      is_break: false,
      updated_at: new Date().toISOString()
    });
  };

  const leaveSession = async (userId: string) => {
    if (!coupleId || !session) return;
    const nextIds = session.active_user_ids.filter((id) => id !== userId);
    await supabase
      .from('study_sessions')
      .update({ active_user_ids: nextIds, updated_at: new Date().toISOString() })
      .eq('couple_id', coupleId);
  };

  const addTask = async (userId: string, title: string) => {
    if (!coupleId || !title.trim()) return;
    await supabase.from('study_tasks').insert({ couple_id: coupleId, created_by: userId, title: title.trim() });
  };

  const toggleTask = async (taskId: string, isDone: boolean) => {
    await supabase.from('study_tasks').update({ is_done: isDone }).eq('id', taskId);
  };

  const editTask = async (taskId: string, title: string) => {
    if (!title.trim()) return;
    await supabase.from('study_tasks').update({ title: title.trim() }).eq('id', taskId);
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('study_tasks').delete().eq('id', taskId);
  };

  return { session, tasks, loading, joinSession, leaveSession, addTask, toggleTask, editTask, deleteTask };
}
