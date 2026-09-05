import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CalendarHeart, Cake, MapPin, Bell, Pencil, Trash2, CalendarPlus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { daysUntil, buildICS, downloadICS } from '@/lib/utils';
import type { CoupleEvent, EventType } from '@/types';

const typeIcon: Record<EventType, typeof CalendarHeart> = {
  anniversary: CalendarHeart,
  birthday: Cake,
  date: MapPin,
  reminder: Bell,
  custom: CalendarHeart
};

const typeOptions: { value: EventType; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'custom', label: 'Other' }
];

export default function CalendarPage() {
  const { profile } = useAuth();
  const { couple, refresh } = useCouple();
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CoupleEvent | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('date');

  const [editingAnniversary, setEditingAnniversary] = useState(false);
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

  useEffect(() => {
    setAnniversaryDraft(couple?.anniversary_date ?? '');
  }, [couple?.anniversary_date]);

  const resetForm = () => {
    setTitle('');
    setDate('');
    setType('date');
    setEditingEvent(null);
    setShowForm(false);
  };

  const openEdit = (ev: CoupleEvent) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDate(ev.event_date);
    setType(ev.event_type);
    setShowForm(true);
  };

  const submitEvent = async () => {
    if (!couple?.id || !profile?.id || !title.trim() || !date) return;

    if (editingEvent) {
      await supabase
        .from('events')
        .update({
          title: title.trim(),
          event_type: type,
          event_date: date,
          is_recurring_yearly: type === 'birthday' || type === 'anniversary'
        })
        .eq('id', editingEvent.id);
    } else {
      await supabase.from('events').insert({
        couple_id: couple.id,
        created_by: profile.id,
        title: title.trim(),
        event_type: type,
        event_date: date,
        is_recurring_yearly: type === 'birthday' || type === 'anniversary'
      });
    }
    resetForm();
    load();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    if (editingEvent?.id === id) resetForm();
    load();
  };

  const saveAnniversary = async () => {
    if (!couple?.id || !anniversaryDraft) return;
    await supabase.from('couples').update({ anniversary_date: anniversaryDraft }).eq('id', couple.id);
    setEditingAnniversary(false);
    refresh();
  };

  const exportEventToPhone = (ev: CoupleEvent) => {
    const ics = buildICS({
      title: ev.title,
      dateStr: ev.event_date,
      description: ev.notes ?? undefined,
      recurringYearly: ev.is_recurring_yearly
    });
    downloadICS(ev.title, ics);
  };

  const exportAnniversaryToPhone = () => {
    if (!couple?.anniversary_date) return;
    const ics = buildICS({
      title: 'Our Anniversary',
      dateStr: couple.anniversary_date,
      description: 'LoveLink anniversary reminder',
      recurringYearly: true
    });
    downloadICS('anniversary', ics);
  };

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <TopBar
        title="Calendar"
        showBack
        right={
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="rounded-full bg-rose-500 p-2 text-white shadow-soft"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
          </button>
        }
      />

      <div className="space-y-4 px-5">
        {couple?.anniversary_date && !editingAnniversary ? (
          <GlassCard className="text-center">
            <p className="text-sm text-ink-500 dark:text-cream/50">Next anniversary in</p>
            <p className="mt-1 font-display text-3xl text-rose-500">{daysUntil(couple.anniversary_date)} days</p>
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={() => setEditingAnniversary(true)}
                className="flex items-center gap-1 rounded-pill bg-white/70 px-3 py-1.5 text-xs font-medium text-ink-700 dark:bg-white/10 dark:text-cream/70"
              >
                <Pencil size={12} /> Edit date
              </button>
              <button
                onClick={exportAnniversaryToPhone}
                className="flex items-center gap-1 rounded-pill bg-white/70 px-3 py-1.5 text-xs font-medium text-ink-700 dark:bg-white/10 dark:text-cream/70"
              >
                <CalendarPlus size={12} /> Add to phone
              </button>
            </div>
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
              {couple?.anniversary_date && (
                <Button variant="secondary" onClick={() => setEditingAnniversary(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </GlassCard>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <GlassCard className="space-y-3">
                <Input label="What's the occasion?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Movie night" />
                <div className="flex gap-2">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field flex-1" />
                  <select value={type} onChange={(e) => setType(e.target.value as EventType)} className="input-field w-32">
                    {typeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button full onClick={submitEvent}>
                    {editingEvent ? 'Save changes' : 'Add to calendar'}
                  </Button>
                  {editingEvent && (
                    <Button variant="secondary" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => exportEventToPhone(ev)}
                      className="rounded-full p-2 text-ink-500 active:bg-ink/5 dark:text-cream/50 dark:active:bg-white/10"
                      aria-label="Add to phone calendar"
                    >
                      <CalendarPlus size={16} />
                    </button>
                    <button
                      onClick={() => openEdit(ev)}
                      className="rounded-full p-2 text-ink-500 active:bg-ink/5 dark:text-cream/50 dark:active:bg-white/10"
                      aria-label="Edit event"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => deleteEvent(ev.id)}
                      className="rounded-full p-2 text-rose-500 active:bg-rose-50 dark:active:bg-white/10"
                      aria-label="Delete event"
                    >
                      <Trash2 size={15} />
                    </button>
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
