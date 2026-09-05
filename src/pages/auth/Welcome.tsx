import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FloatingHearts } from '@/components/effects/FloatingHearts';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="relative flex h-screen flex-col justify-between overflow-hidden bg-gradient-to-b from-blush via-cream to-cream px-6 pb-10 pt-16 dark:from-charcoal-100 dark:via-charcoal dark:to-charcoal">
      <FloatingHearts count={8} />

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="mb-6 flex h-24 w-24 items-center justify-center rounded-card bg-white/70 shadow-glass backdrop-blur-glass dark:bg-white/10"
        >
          <Heart size={44} className="fill-rose-500 text-rose-500" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="font-display text-4xl font-medium text-ink dark:text-cream"
        >
          LoveLink
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-3 max-w-xs text-[15px] leading-relaxed text-ink-500 dark:text-cream/60"
        >
          A private space for two. Notes, memories, and moments — always in sync.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="relative z-10 space-y-3"
      >
        <Button full onClick={() => navigate('/signup')}>
          Create an account
        </Button>
        <Button full variant="secondary" onClick={() => navigate('/login')}>
          I already have one
        </Button>
      </motion.div>
    </div>
  );
}
