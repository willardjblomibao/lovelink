import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Gift, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Confetti } from '@/components/effects/Confetti';
import type { Surprise } from '@/types';

export default function SecretSurprise() {
  const { profile } = useAuth();
  const { couple } = useCouple();
  const [surprises, setSurprises] = useState<Surprise[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  const [opened, setOpened] = useState<Surprise | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!couple?.id) return;
    const { data } = await supabase
      .from('surprises')
      .select('*')
      .eq('couple_id', couple.id)
      .order('unlock_at', { ascending: true });
    setSurprises((data as Surprise[]) ?? []);
  }, [couple?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setUnlockAt('');
    setShowForm(false);
    setEditingId(null);
  };

  const openEdit = (s: Surprise) => {
    setEditingId(s.id);
    setTitle(s.title);
    setContent(s.content);
    setUnlockAt(new Date(s.unlock_at).toISOString().slice(0, 16));
    setShowForm(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!couple?.id || !profile?.id || !title.trim() || !content.trim() || !unlockAt) return;

    if (editingId) {
      await supabase
        .from('surprises')
        .update({ title: title.trim(), content: content.trim(), unlock_at: new Date(unlockAt).toISOString() })
        .eq('id', editingId);
    } else {
      await supabase.from('surprises').insert({
        couple_id: couple.id,
        created_by: profile.id,
        title: title.trim(),
        content: content.trim(),
        unlock_at: new Date(unlockAt).toISOString()
      });
    }
    resetForm();
    load();
  };

  const openSurprise = async (s: Surprise) => {
    const isUnlockable = new Date(s.unlock_at).getTime() <= Date.now();
    if (!isUnlockable || s.created_by === profile?.id) return;
    await supabase
      .from('surprises')
      .update({ is_unlocked: true, opened_by: profile?.id, opened_at: new Date().toISOString() })
      .eq('id', s.id);
    setOpened({ ...s, is_unlocked: true });
    load();
  };

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <Confetti show={!!opened} onDone={() => setOpened(null)} />
      <TopBar
        title="Secret Surprises"
        showBack
        right={
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="rounded-full bg-rose-500 p-2 text-white shadow-soft"
          >
            <Plus size={18} />
          </button>
        }
      />

      <div className="space-y-4 px-5">
        <p className="px-1 text-sm text-ink-500 dark:text-cream/50">
          Schedule a hidden note for the future — it stays locked until the moment you choose.
        </p>

        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <GlassCard className="space-y-3">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Happy 1-year!" />
              <label className="block text-left">
                <span className="mb-1.5 block text-[13px] font-medium text-ink-700 dark:text-cream/70">Your message</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Write your secret note..."
                />
              </label>
              <Input
                label="Unlocks at"
                type="datetime-local"
                value={unlockAt}
                onChange={(e) => setUnlockAt(e.target.value)}
              />
              <div className="flex gap-2">
                <Button full onClick={handleCreate}>
                  {editingId ? 'Save changes' : 'Lock it away'}
                </Button>
                {editingId && (
                  <Button variant="secondary" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {surprises.map((s, i) => {
            const isMine = s.created_by === profile?.id;
            const canUnlock = new Date(s.unlock_at).getTime() <= Date.now();
            const showContent = isMine || s.is_unlocked;
            const canEdit = isMine && !s.is_unlocked;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card relative flex flex-col items-center gap-2 py-6 text-center"
              >
                {canEdit && (
                  <button
                    onClick={() => openEdit(s)}
                    className="absolute right-2 top-2 rounded-full bg-white/70 p-1.5 text-ink-500 dark:bg-white/10 dark:text-cream/60"
                    aria-label="Edit surprise"
                  >
                    <Pencil size={12} />
                  </button>
                )}
                <button onClick={() => openSurprise(s)} disabled={isMine || !canUnlock} className="flex flex-col items-center gap-2">
                  {showContent ? <Gift size={26} className="text-rose-500" /> : <Lock size={22} className="text-ink-500 dark:text-cream/40" />}
                  <span className="text-sm font-medium text-ink dark:text-cream">
                    {showContent ? s.title : isMine ? `${s.title} (yours)` : 'Locked surprise'}
                  </span>
                  <span className="text-[11px] text-ink-500 dark:text-cream/40">
                    {canUnlock ? (isMine ? 'Waiting for them to open' : 'Tap to open!') : `Unlocks ${new Date(s.unlock_at).toLocaleDateString()}`}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>

        {surprises.length === 0 && (
          <p className="pt-6 text-center text-sm text-ink-500 dark:text-cream/40">No surprises yet — plan one!</p>
        )}
      </div>

      <AnimatePresence>
        {opened && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8"
            onClick={() => setOpened(null)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card w-full max-w-sm bg-cream/95 p-6 text-center dark:bg-charcoal-100/95"
              onClick={(e) => e.stopPropagation()}
            >
              <Gift size={32} className="mx-auto mb-3 text-rose-500" />
              <h3 className="font-display text-lg text-ink dark:text-cream">{opened.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-700 dark:text-cream/80">{opened.content}</p>
              <Button className="mt-5" onClick={() => setOpened(null)}>
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
