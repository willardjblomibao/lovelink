import { motion } from 'framer-motion';
import { daysTogether } from '@/lib/utils';

export function TogetherCounter({ since }: { since: string | null }) {
  if (!since) {
    return (
      <p className="text-center text-sm text-ink-500 dark:text-cream/50">
        Set your anniversary date in the Calendar to start counting.
      </p>
    );
  }

  const days = daysTogether(since);

  return (
    <div className="text-center">
      <motion.p
        key={days}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="font-display text-5xl font-medium text-rose-500"
      >
        {days.toLocaleString()}
      </motion.p>
      <p className="mt-1 text-sm text-ink-500 dark:text-cream/60">days together, and counting</p>
    </div>
  );
}
