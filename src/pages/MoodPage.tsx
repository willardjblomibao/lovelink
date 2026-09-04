import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { useMood } from '@/hooks/useMood';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { MOOD_META, type MoodType } from '@/types';
import { cx } from '@/lib/utils';

const moodOrder: MoodType[] = ['amazing', 'happy', 'okay', 'tired', 'stressed', 'sad', 'sick', 'missing_you'];

export default function MoodPage() {
  const { profile } = useAuth();
  const { couple, partner } = useCouple();
  const { setMood, latestFor, saving } = useMood(couple?.id ?? null);

  const myMood = profile ? latestFor(profile.id) : null;
  const partnerMood = partner ? latestFor(partner.id) : null;

  const handlePick = (mood: MoodType) => {
    if (!couple?.id || !profile?.id) return;
    setMood(couple.id, profile.id, mood);
  };

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <TopBar title="Mood Check" showBack right={<span />} />

      <div className="space-y-5 px-5">
        {partner && (
          <GlassCard className="flex items-center gap-4">
            <Avatar name={partner.display_name} src={partner.avatar_url} size={48} />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink dark:text-cream">{partner.display_name}</p>
              {partnerMood ? (
                <p className="text-sm text-ink-500 dark:text-cream/60">
                  Feeling {MOOD_META[partnerMood.mood].emoji} {MOOD_META[partnerMood.mood].label.toLowerCase()}
                </p>
              ) : (
                <p className="text-sm text-ink-500 dark:text-cream/40">Hasn't checked in yet today</p>
              )}
            </div>
          </GlassCard>
        )}

        {partnerMood && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="bg-rose-50/70 dark:bg-rose-500/10">
              <p className="text-sm italic leading-relaxed text-rose-700 dark:text-rose-200">
                “{MOOD_META[partnerMood.mood].support}”
              </p>
            </GlassCard>
          </motion.div>
        )}

        <div>
          <h2 className="mb-3 px-1 font-display text-base text-ink dark:text-cream">How are you, really?</h2>
          <div className="grid grid-cols-4 gap-2.5">
            {moodOrder.map((mood, i) => {
              const meta = MOOD_META[mood];
              const active = myMood?.mood === mood;
              return (
                <motion.button
                  key={mood}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePick(mood)}
                  disabled={saving}
                  className={cx(
                    'glass-card flex flex-col items-center gap-1.5 py-4 disabled:opacity-60',
                    active && 'ring-2 ring-rose-400'
                  )}
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-[11px] font-medium text-ink-700 dark:text-cream/70">{meta.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
