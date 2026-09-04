import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { TopBar } from '@/components/ui/TopBar';
import { Spinner } from '@/components/ui/Spinner';
import type { Memory } from '@/types';
import { cx } from '@/lib/utils';

export default function Memories() {
  const { profile } = useAuth();
  const { couple } = useCouple();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [viewing, setViewing] = useState<Memory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!couple?.id) return;
    const { data } = await supabase
      .from('memories')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false });
    setMemories((data as Memory[]) ?? []);
    setLoading(false);
  }, [couple?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!couple?.id) return;
    const channel = supabase
      .channel(`memories:${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memories', filter: `couple_id=eq.${couple.id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, load]);

  const handleUpload = async (file: File) => {
    if (!couple?.id || !profile?.id) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${couple.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('memories').upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from('memories').getPublicUrl(path);
      await supabase.from('memories').insert({
        couple_id: couple.id,
        uploader_id: profile.id,
        media_url: data.publicUrl,
        media_type: file.type.startsWith('video') ? 'video' : 'photo',
        taken_at: new Date().toISOString().slice(0, 10)
      });
    }
    setUploading(false);
  };

  const toggleFavorite = async (memory: Memory) => {
    await supabase.from('memories').update({ is_favorite: !memory.is_favorite }).eq('id', memory.id);
    setViewing((v) => (v && v.id === memory.id ? { ...v, is_favorite: !memory.is_favorite } : v));
  };

  const deleteMemory = async (memory: Memory) => {
    setDeleting(true);
    await supabase.from('memories').delete().eq('id', memory.id);
    setDeleting(false);
    setViewing(null);
  };

  const visible = filter === 'favorites' ? memories.filter((m) => m.is_favorite) : memories;

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <TopBar
        title="Memory Vault"
        showBack
        right={
          <button
            onClick={() => fileInput.current?.click()}
            className="rounded-full bg-rose-500 p-2 text-white shadow-soft"
            aria-label="Add memory"
          >
            {uploading ? <Spinner size={16} /> : <Plus size={18} />}
          </button>
        }
      />
      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />

      <div className="flex gap-2 px-5 pb-3">
        {(['all', 'favorites'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cx(
              'rounded-pill px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              filter === f ? 'bg-rose-500 text-white' : 'bg-white/60 text-ink-700 dark:bg-white/10 dark:text-cream/70'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <Spinner className="text-rose-500" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 pt-20 text-center px-8">
          <span className="text-4xl">🖼️</span>
          <p className="text-sm text-ink-500 dark:text-cream/50">
            No memories yet. Tap + to add your first photo together.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 px-4">
          {visible.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (i % 6) * 0.04 }}
              onClick={() => setViewing(m)}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-white/40 dark:bg-white/5"
            >
              {m.media_type === 'video' ? (
                <video src={m.media_url} className="h-full w-full object-cover" muted />
              ) : (
                <img src={m.media_url} alt={m.caption ?? 'Memory'} className="h-full w-full object-cover" />
              )}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(m);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/30 p-1.5 backdrop-blur-sm"
              >
                <Heart size={14} className={cx('text-white', m.is_favorite && 'fill-rose-500 text-rose-500')} />
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-black/90"
            onClick={() => setViewing(null)}
          >
            <div className="safe-top flex items-center justify-between px-4 py-4">
              <button onClick={() => setViewing(null)} className="rounded-full bg-white/10 p-2 text-white">
                <X size={20} />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(viewing);
                  }}
                  className="rounded-full bg-white/10 p-2 text-white"
                >
                  <Heart size={18} className={cx(viewing.is_favorite && 'fill-rose-500 text-rose-500')} />
                </button>
                {viewing.uploader_id === profile?.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMemory(viewing);
                    }}
                    disabled={deleting}
                    className="rounded-full bg-white/10 p-2 text-white disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            <motion.div
              className="flex flex-1 items-center justify-center px-4"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              {viewing.media_type === 'video' ? (
                <video src={viewing.media_url} className="max-h-full max-w-full rounded-2xl" controls autoPlay />
              ) : (
                <img src={viewing.media_url} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
