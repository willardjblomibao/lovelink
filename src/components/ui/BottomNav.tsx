import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Images, CalendarHeart, Sparkles } from 'lucide-react';
import { cx } from '@/lib/utils';
import { motion } from 'framer-motion';

const items = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/notes', label: 'Notes', icon: MessageCircle },
  { to: '/memories', label: 'Memories', icon: Images },
  { to: '/calendar', label: 'Calendar', icon: CalendarHeart },
  { to: '/more', label: 'More', icon: Sparkles }
];

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-white/50 bg-white/70 backdrop-blur-glass dark:border-white/10 dark:bg-charcoal-100/80">
      <ul className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} className="relative flex flex-col items-center gap-1 py-1.5">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute -top-1 h-1 w-6 rounded-full bg-rose-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    className={cx(isActive ? 'text-rose-500' : 'text-ink-500 dark:text-cream/50')}
                  />
                  <span
                    className={cx(
                      'text-[11px] font-medium',
                      isActive ? 'text-rose-500' : 'text-ink-500 dark:text-cream/50'
                    )}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
