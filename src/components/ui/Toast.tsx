import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/context/NotificationContext';

export function ToastLayer() {
  const { toasts, dismissToast } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-[80] mx-auto flex max-w-md flex-col gap-2 px-4 pt-3">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            onClick={() => {
              dismissToast(t.id);
              navigate('/notes');
            }}
            className="glass-card pointer-events-auto flex items-center gap-3 bg-white/90 px-4 py-3 text-left shadow-glass dark:bg-charcoal-100/95"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
              <MessageCircle size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink dark:text-cream">{t.title}</span>
              <span className="block truncate text-xs text-ink-500 dark:text-cream/60">{t.body}</span>
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
