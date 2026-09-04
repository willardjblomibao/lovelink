import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export function GlassCard({
  children,
  className,
  as: Component = motion.div,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  as?: typeof motion.div;
  delay?: number;
}) {
  return (
    <Component
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cx('glass-card p-5', className)}
    >
      {children}
    </Component>
  );
}
