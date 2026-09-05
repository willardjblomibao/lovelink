import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Heart } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { TopBar } from '@/components/ui/TopBar';
import { Spinner } from '@/components/ui/Spinner';
import type { LocketPhoto } from '@/types';

export default function Locket() {
  const { profile } = useAuth();
  const { couple, partner } = useCouple();
  const [latest, setLatest] = useState<LocketPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!couple?.id) return;
    const { data } = await supabase
      .from('locket_photos')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatest((data as LocketPhoto) ?? null);
  }, [couple?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!couple?.id) return;
    const channel = supabase
      .channel(`locket:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'locket_photos', filter: `couple_id=eq.${couple.id}` },
        (payload) => setLatest(payload.new as LocketPhoto)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id]);

  const handleSend = async (file: File) => {
    if (!couple?.id || !profile?.id) return;
    setUploading(true);
    const path = `${couple.id}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from('locket').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('locket').getPublicUrl(path);
      await supabase.from('locket_photos').insert({ couple_id: couple.id, sender_id: profile.id, photo_url: data.publicUrl });
    }
    setUploading(false);
  };

  const isFromPartner = latest && latest.sender_id !== profile?.id;

  return (
    <div className="flex min-h-screen flex-col bg-cream dark:bg-charcoal">
      <TopBar title="Locket" showBack right={<span />} />

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="relative mb-8 h-64 w-64 overflow-hidden rounded-full border-8 border-white shadow-glass dark:border-white/10">
          <AnimatePresence mode="wait">
            {latest ? (
              <motion.img
                key={latest.id}
                src={latest.photo_url}
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="h-full w-full object-cover"
                alt="Locket"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-100 to-rose-300 dark:from-rose-500/20 dark:to-rose-500/10">
                <Heart size={48} className="fill-rose-500 text-rose-500" />
              </div>
            )}
          </AnimatePresence>
        </div>

        <p className="mb-1 text-sm text-ink-500 dark:text-cream/50">
          {latest
            ? isFromPartner
              ? `From ${partner?.display_name.split(' ')[0] ?? 'your partner'}`
              : 'You sent this'
            : 'No locket photo yet'}
        </p>
        <p className="mb-8 text-xs text-ink-500 dark:text-cream/30">
          Sending a new photo instantly updates it on both your screens.
        </p>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleSend(e.target.files[0])}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="btn-primary"
        >
          {uploading ? <Spinner size={18} /> : <Camera size={18} />}
          Send a locket photo
        </button>
      </div>
    </div>
  );
}
