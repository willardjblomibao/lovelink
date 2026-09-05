import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { MOOD_META } from '@/types';
import type { Mood } from '@/types';

export function MoodStatusRow({
  myName,
  partnerName,
  myMood,
  partnerMood
}: {
  myName: string;
  partnerName: string;
  myMood: Mood | null;
  partnerMood: Mood | null;
}) {
  if (!myMood && !partnerMood) {
    return (
      <Link to="/mood" className="block text-center text-sm text-rose-500">
        Share how you're both feeling today →
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <StatusBubble name={myName} mood={myMood} align="right" />

      <motion.span
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="shrink-0"
      >
        <Heart size={20} className="fill-rose-500 text-rose-500" />
      </motion.span>

      <StatusBubble name={partnerName} mood={partnerMood} align="left" />
    </div>
  );
}

function StatusBubble({ name, mood, align }: { name: string; mood: Mood | null; align: 'left' | 'right' }) {
  return (
    <Link
      to="/mood"
      className="flex flex-1 flex-col"
      style={{ alignItems: align === 'right' ? 'flex-end' : 'flex-start', textAlign: align }}
    >
      <span className="text-[11px] font-medium text-ink-500 dark:text-cream/50">{name.split(' ')[0]}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={mood?.mood ?? 'none'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-sm text-ink-700 dark:text-cream/80"
        >
          {mood ? (
            <>
              {MOOD_META[mood.mood].emoji} feeling {MOOD_META[mood.mood].label.toLowerCase()}
            </>
          ) : (
            <span className="text-ink-500/60 dark:text-cream/30">no update yet</span>
          )}
        </motion.span>
      </AnimatePresence>
    </Link>
  );
}
