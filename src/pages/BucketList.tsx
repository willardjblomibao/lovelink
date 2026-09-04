import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Confetti } from '@/components/effects/Confetti';
import { cx } from '@/lib/utils';
import type { BucketListItem } from '@/types';

const categories: { id: BucketListItem['category']; label: string }[] = [
  { id: 'date_idea', label: 'Date ideas' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'travel', label: 'Travel' },
  { id: 'other', label: 'Other' }
];

export default function BucketList() {
  const { profile } = useAuth();
  const { couple } = useCouple();
  const [items, setItems] = useState<BucketListItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BucketListItem['category']>('date_idea');
  const [celebrate, setCelebrate] = useState(false);

  const load = useCallback(async () => {
    if (!couple?.id) return;
    const { data } = await supabase
      .from('bucket_list')
      .select('*')
      .eq('couple_id', couple.id)
      .order('created_at', { ascending: false });
    setItems((data as BucketListItem[]) ?? []);
  }, [couple?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!couple?.id) return;
    const channel = supabase
      .channel(`bucket:${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bucket_list', filter: `couple_id=eq.${couple.id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, load]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!couple?.id || !profile?.id || !title.trim()) return;
    await supabase.from('bucket_list').insert({ couple_id: couple.id, created_by: profile.id, title: title.trim(), category });
    setTitle('');
  };

  const toggleDone = async (item: BucketListItem) => {
    const nowDone = !item.is_completed;
    await supabase
      .from('bucket_list')
      .update({ is_completed: nowDone, completed_at: nowDone ? new Date().toISOString() : null })
      .eq('id', item.id);
    if (nowDone) setCelebrate(true);
  };

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <Confetti show={celebrate} onDone={() => setCelebrate(false)} />
      <TopBar title="Bucket List" showBack right={<span />} />

      <div className="space-y-5 px-5">
        <GlassCard>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Watch the sunrise together"
              className="input-field"
            />
            <div className="flex items-center gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BucketListItem['category'])}
                className="input-field flex-1 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-full bg-rose-500 p-3 text-white shadow-soft">
                <Plus size={18} />
              </button>
            </div>
          </form>
        </GlassCard>

        {categories.map((cat) => {
          const group = items.filter((i) => i.category === cat.id);
          if (group.length === 0) return null;
          return (
            <div key={cat.id}>
              <h3 className="mb-2 px-1 text-sm font-medium text-ink-500 dark:text-cream/50">{cat.label}</h3>
              <div className="space-y-2">
                {group.map((item, i) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleDone(item)}
                    className="glass-card flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span
                      className={cx(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                        item.is_completed ? 'border-rose-500 bg-rose-500' : 'border-ink/20 dark:border-white/20'
                      )}
                    >
                      {item.is_completed && <Check size={12} className="text-white" />}
                    </span>
                    <span className={cx('text-sm', item.is_completed && 'text-ink-500 line-through dark:text-cream/40')}>
                      {item.title}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <p className="pt-6 text-center text-sm text-ink-500 dark:text-cream/40">
            Start dreaming up your first adventure together.
          </p>
        )}
      </div>
    </div>
  );
}
