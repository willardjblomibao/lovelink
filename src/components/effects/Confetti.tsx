import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#F4A6BD', '#E8748F', '#FBD3DD', '#FFF9F1', '#C24F6B'];

export function Confetti({ show, onDone }: { show: boolean; onDone?: () => void }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (show) {
      const t = setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 2600);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.4,
        duration: 2 + Math.random() * 1.4,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
        size: 6 + Math.random() * 6
      })),
    []
  );

  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              className="absolute top-[-5%] rounded-sm"
              style={{ left: `${p.left}%`, width: p.size, height: p.size * 1.6, backgroundColor: p.color }}
              initial={{ y: '-10vh', x: 0, opacity: 1, rotate: 0 }}
              animate={{ y: '110vh', x: p.drift, opacity: [1, 1, 0], rotate: p.rotate }}
              transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
