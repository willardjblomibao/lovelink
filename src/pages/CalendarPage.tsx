import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CalendarHeart, Cake, MapPin, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { daysUntil } from '@/lib/utils';
import type { CoupleEvent, EventType } from '@/types';

const typeIcon: Record<EventType, typeof CalendarHeart> = {
  anniversary: CalendarHeart,
  birthday: Cake,
  date: MapPin,
  reminder: Bell,
  custom: CalendarHeart
};

export default function CalendarPage() {
  const { profile } = useAuth();
  const { couple, refresh } = useCouple();
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('date');
  const [anniversaryDraft, setAnniversaryDraft] = useState(couple?.anniversary_date ?? '');

  const load = useCallback(async () => {
    if (!couple?.id) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('couple_id', couple.id)
      .order('event_date', { ascending: true });
    setEvents((data as CoupleEvent[]) ?? []);
  }, [couple?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const addEvent = async () => {
    if (!couple?.id || !profile?.id || !title.trim() || !date) return;
    await supabase.from('events').insert({
      couple_id: couple.id,
      created_by: profile.id,
      title: title.trim(),
      event_type: type,
      event_date: date,
      is_recurring_yearly: type === 'birthday' || type === 'anniversary'
    });
    setTitle('');
    setDate('');
    setShowForm(false);
    load();
  };

  const saveAnniversary = async () => {
    if (!couple?.id || !anniversaryDraft) return;
    await supabase.from('couples').update({ anniversary_date: anniversaryDraft }).eq('id', couple.id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <TopBar
        title="Calendar"
        showBack
        right={
          <button onClick={() => setShowForm((s) => !s)} className="rounded-full bg-rose-500 p-2 text-white shadow-soft">
            <Plus size={18} />
          </button>
        }
      />

      <div className="space-y-4 px-5">
        {couple?.anniversary_date ? (
          <GlassCard className="text-center">
            <p className="text-sm text-ink-500 dark:text-cream/50">Next anniversary in</p>
            <p className="mt-1 font-display text-3xl text-rose-500">{daysUntil(couple.anniversary_date)} days</p>
          </GlassCard>
        ) : (
          <GlassCard>
            <p className="mb-3 text-sm font-medium text-ink dark:text-cream">When did your story begin?</p>
            <div className="flex gap-2">
              <input
                type="date"
                value={anniversaryDraft}
                onChange={(e) => setAnniversaryDraft(e.target.value)}
                className="input-field flex-1"
              />
              <Button onClick={saveAnniversary}>Save</Button>
            </div>
          </GlassCard>
        )}

        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <GlassCard className="space-y-3">
              <Input label="What's the occasion?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Movie night" />
              <div className="flex gap-2">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field flex-1" />
                <select value={type} onChange={(e) => setType(e.target.value as EventType)} className="input-field w-32">
                  <option value="date">Date</option>
                  <option value="birthday">Birthday</option>
                  <option value="reminder">Reminder</option>
                  <option value="custom">Other</option>
                </select>
              </div>
              <Button full onClick={addEvent}>
                Add to calendar
              </Button>
            </GlassCard>
          </motion.div>
        )}

        <div className="space-y-3">
          {events.map((ev, i) => {
            const Icon = typeIcon[ev.event_type];
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <GlassCard className="flex items-center gap-4 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/10">
                    <Icon size={19} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ink dark:text-cream">{ev.title}</p>
                    <p className="text-xs text-ink-500 dark:text-cream/50">
                      {new Date(ev.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} ·{' '}
                      {daysUntil(ev.event_date)}d away
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
          {events.length === 0 && (
            <p className="pt-8 text-center text-sm text-ink-500 dark:text-cream/40">
              No events yet — add your first date night!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
