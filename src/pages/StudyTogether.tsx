import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Check, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { useStudySession } from '@/hooks/useStudySession';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { cx } from '@/lib/utils';

export default function StudyTogether() {
  const { profile } = useAuth();
  const { couple, partner } = useCouple();
  const { session, tasks, joinSession, leaveSession, addTask, toggleTask, editTask, deleteTask } = useStudySession(
    couple?.id ?? null
  );
  const [newTask, setNewTask] = useState('');
  const [now, setNow] = useState(Date.now());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const iAmActive = !!(profile && session?.active_user_ids.includes(profile.id));
  const partnerActive = !!(partner && session?.active_user_ids.includes(partner.id));

  const remainingSeconds = useMemo(() => {
    if (!session?.timer_started_at) return session ? session.duration_minutes * 60 : 25 * 60;
    const elapsed = Math.floor((now - new Date(session.timer_started_at).getTime()) / 1000);
    const total = session.duration_minutes * 60;
    return Math.max(0, total - elapsed);
  }, [session, now]);

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const ss = String(remainingSeconds % 60).padStart(2, '0');

  const handleToggleSession = () => {
    if (!profile) return;
    iAmActive ? leaveSession(profile.id) : joinSession(profile.id);
  };

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    if (!profile || !newTask.trim()) return;
    addTask(profile.id, newTask);
    setNewTask('');
  };

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <TopBar title="Study Together" showBack right={<span />} />

      <div className="space-y-5 px-5">
        <GlassCard className="flex flex-col items-center gap-5 py-8">
          <div className="flex gap-6">
            <StatusPill label={profile?.display_name.split(' ')[0] ?? 'You'} active={iAmActive} />
            <StatusPill label={partner?.display_name.split(' ')[0] ?? 'Partner'} active={partnerActive} />
          </div>

          <motion.p
            key={remainingSeconds}
            className="font-display text-6xl tabular-nums text-ink dark:text-cream"
          >
            {mm}:{ss}
          </motion.p>

          <button
            onClick={handleToggleSession}
            className={cx(
              'flex h-16 w-16 items-center justify-center rounded-full shadow-soft transition-transform active:scale-90',
              iAmActive ? 'bg-white/70 text-rose-500 dark:bg-white/10' : 'bg-rose-500 text-white'
            )}
          >
            {iAmActive ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
          </button>
          <p className="text-xs text-ink-500 dark:text-cream/40">
            {partnerActive && iAmActive
              ? 'Studying together right now 📚'
              : partnerActive
              ? `${partner?.display_name.split(' ')[0]} is studying — join in!`
              : 'Start a session to study together in sync.'}
          </p>
        </GlassCard>

        <div>
          <h2 className="mb-3 px-1 font-display text-base text-ink dark:text-cream">Shared checklist</h2>
          <GlassCard className="space-y-3">
            {tasks.map((t) =>
              editingId === t.id ? (
                <form
                  key={t.id}
                  onSubmit={(e) => {
                    e.preventDefault();
                    editTask(t.id, editValue);
                    setEditingId(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="input-field flex-1 py-2 text-sm"
                  />
                  <button type="submit" className="rounded-full bg-rose-500 p-2 text-white">
                    <Check size={14} />
                  </button>
                </form>
              ) : (
                <div key={t.id} className="flex w-full items-center gap-3">
                  <button onClick={() => toggleTask(t.id, !t.is_done)} className="flex flex-1 items-center gap-3 text-left">
                    <span
                      className={cx(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2',
                        t.is_done ? 'border-rose-500 bg-rose-500' : 'border-ink/20 dark:border-white/20'
                      )}
                    >
                      {t.is_done && <Check size={13} className="text-white" />}
                    </span>
                    <span className={cx('text-sm', t.is_done && 'text-ink-500 line-through dark:text-cream/40')}>
                      {t.title}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(t.id);
                      setEditValue(t.title);
                    }}
                    className="shrink-0 rounded-full p-1.5 text-ink-500 dark:text-cream/50"
                  >
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deleteTask(t.id)} className="shrink-0 rounded-full p-1.5 text-rose-500">
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            )}
            {tasks.length === 0 && <p className="text-sm text-ink-500 dark:text-cream/40">No assignments yet.</p>}
            <form onSubmit={handleAddTask} className="flex items-center gap-2 pt-1">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add an assignment..."
                className="input-field flex-1 py-2 text-sm"
              />
              <button type="submit" className="rounded-full bg-rose-500 p-2 text-white">
                <Plus size={16} />
              </button>
            </form>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={cx(
          'h-2.5 w-2.5 rounded-full',
          active ? 'bg-emerald-400 animate-pulse-dot' : 'bg-ink-500/20 dark:bg-white/10'
        )}
      />
      <span className="text-xs text-ink-500 dark:text-cream/50">{label}</span>
    </div>
  );
}
