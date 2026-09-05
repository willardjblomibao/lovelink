import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { LoveNote } from '@/types';

export function useMessages(coupleId: string | null, myId: string | null) {
  const [messages, setMessages] = useState<LoveNote[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!coupleId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages((data as LoveNote[]) ?? []);
    setLoading(false);
  }, [coupleId]);

  useEffect(() => {
    load();
  }, [load]);

  // Mark partner messages as seen once loaded / when new ones arrive while viewing.
  useEffect(() => {
    if (!coupleId || !myId) return;
    const unseen = messages.filter((m) => m.sender_id !== myId && !m.seen_at);
    if (unseen.length === 0) return;
    supabase
      .from('messages')
      .update({ seen_at: new Date().toISOString() })
      .in(
        'id',
        unseen.map((m) => m.id)
      )
      .then(() => {});
  }, [messages, coupleId, myId]);

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`messages:${coupleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as LoveNote])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `couple_id=eq.${coupleId}` },
        (payload) =>
          setMessages((prev) => prev.map((m) => (m.id === (payload.new as LoveNote).id ? (payload.new as LoveNote) : m)))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const sendMessage = async (content: string) => {
    if (!coupleId || !myId || !content.trim()) return { error: 'Nothing to send.' };
    const { error } = await supabase.from('messages').insert({
      couple_id: coupleId,
      sender_id: myId,
      content: content.trim(),
      delivered_at: new Date().toISOString()
    });
    if (error) {
      console.error('LoveLink: failed to send message', error);
      return { error: error.message };
    }
    return { error: null };
  };

  const react = async (messageId: string, emoji: string) => {
    await supabase.from('messages').update({ reaction: emoji }).eq('id', messageId);
  };

  return { messages, loading, sendMessage, react };
}

export function useTypingIndicator(coupleId: string | null, myId: string | null) {
  const [partnerTyping, setPartnerTyping] = useState(false);

  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`typing:${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_status', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          const row = payload.new as { user_id: string; is_typing: boolean };
          if (row.user_id !== myId) setPartnerTyping(row.is_typing);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, myId]);

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!coupleId || !myId) return;
      await supabase
        .from('typing_status')
        .upsert({ couple_id: coupleId, user_id: myId, is_typing: isTyping, updated_at: new Date().toISOString() });
    },
    [coupleId, myId]
  );

  return { partnerTyping, setTyping };
}
