import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { useMood } from '@/hooks/useMood';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { MOOD_META, PRESET_MOODS, getMoodDisplay, getMoodSupport } from '@/types';
import { cx } from '@/lib/utils';

export default function MoodPage() {
  const { profile } = useAuth();
  const { couple, partner } = useCouple();
  const { setMood, latestFor, saving } = useMood(couple?.id ?? null);

  const [showCustom, setShowCustom] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [customLabel, setCustomLabel] = useState('');

  const myMood = profile ? latestFor(profile.id) : null;
  const partnerMood = partner ? latestFor(partner.id) : null;

  const handlePickPreset = (key: string) => {
    if (!couple?.id || !profile?.id) return;
    setMood(couple.id, profile.id, key, MOOD_META[key].emoji);
  };

  const handleSaveCustom = () => {
    if (!couple?.id || !profile?.id || !customLabel.trim()) return;
    setMood(couple.id, profile.id, customLabel.trim(), customEmoji.trim() || undefined);
    setCustomEmoji('');
    setCustomLabel('');
    setShowCustom(false);
  };

  const isCustomActive = myMood && !MOOD_META[myMood.mood];

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
                  Feeling {getMoodDisplay(partnerMood).emoji} {getMoodDisplay(partnerMood).label.toLowerCase()}
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
                “{getMoodSupport(partnerMood)}”
              </p>
            </GlassCard>
          </motion.div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-base text-ink dark:text-cream">How are you, really?</h2>
            <button
              onClick={() => setShowCustom((s) => !s)}
              className="flex items-center gap-1 text-xs font-medium text-rose-500"
            >
              {showCustom ? <X size={13} /> : <Plus size={13} />}
              Custom
            </button>
          </div>

          <AnimatePresence>
            {showCustom && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <GlassCard className="mb-3 space-y-3">
                  <p className="text-xs text-ink-500 dark:text-cream/50">
                    Not on the list? Describe it your own way — pick any emoji from your keyboard.
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value.slice(0, 4))}
                      placeholder="🥹"
                      className="input-field w-16 text-center text-xl"
                      maxLength={4}
                    />
                    <input
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value.slice(0, 30))}
                      placeholder="e.g. Nervous but excited"
                      className="input-field flex-1"
                    />
                  </div>
                  <Button full onClick={handleSaveCustom} disabled={!customLabel.trim() || saving} icon={<Check size={16} />}>
                    Save this mood
                  </Button>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-4 gap-2.5">
            {PRESET_MOODS.map((key, i) => {
              const meta = MOOD_META[key];
              const active = myMood?.mood === key;
              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePickPreset(key)}
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

          {isCustomActive && myMood && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-rose-50/70 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
              <span className="text-xl">{getMoodDisplay(myMood).emoji}</span>
              Today you're feeling <strong>{myMood.mood}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
