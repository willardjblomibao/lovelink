import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface Burst {
  id: number;
  x: number;
  y: number;
}

let emit: ((x: number, y: number) => void) | null = null;

/** Call from anywhere to trigger a heart burst at a screen coordinate. */
export function triggerHeartBurst(x: number, y: number) {
  emit?.(x, y);
}

/** Mount once near the app root. Renders bursts triggered via triggerHeartBurst(). */
export function HeartBurstLayer() {
  const [bursts, setBursts] = useState<Burst[]>([]);

  useEffect(() => {
    emit = (x, y) => {
      const id = Date.now() + Math.random();
      setBursts((b) => [...b, { id, x, y }]);
      setTimeout(() => setBursts((b) => b.filter((burst) => burst.id !== id)), 900);
    };
    return () => {
      emit = null;
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <AnimatePresence>
        {bursts.map((b) => (
          <motion.div
            key={b.id}
            className="absolute flex gap-1"
            style={{ left: b.x - 20, top: b.y - 20 }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="text-rose-500"
                initial={{ scale: 0, y: 0, opacity: 1, x: (i - 1) * 6 }}
                animate={{ scale: [0, 1.3, 1], y: -60 - i * 12, opacity: [1, 1, 0] }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }}
              >
                <Heart size={24} className="fill-rose-500 text-rose-500" />
              </motion.span>
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
