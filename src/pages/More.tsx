import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smile, Timer, ListChecks, Lock, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { TopBar } from '@/components/ui/TopBar';
import { BottomNav } from '@/components/ui/BottomNav';

const links = [
  { to: '/mood', label: 'Couple Mood', desc: 'Share how you feel today', icon: Smile },
  { to: '/study', label: 'Study Together', desc: 'Shared Pomodoro & checklist', icon: Timer },
  { to: '/bucket-list', label: 'Bucket List', desc: 'Date ideas & dreams', icon: ListChecks },
  { to: '/locket', label: 'Locket', desc: 'Send a photo, instantly', icon: Sparkles },
  { to: '/surprises', label: 'Secret Surprises', desc: 'Hidden notes for the future', icon: Lock },
  { to: '/settings', label: 'Settings', desc: 'Profile, theme, account', icon: SettingsIcon }
];

export default function More() {
  return (
    <div className="min-h-screen bg-cream pb-28 dark:bg-charcoal">
      <TopBar title="More" right={<span />} />
      <div className="space-y-3 px-5">
        {links.map((l, i) => (
          <motion.div
            key={l.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link to={l.to} className="glass-card flex items-center gap-4 px-4 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-500 dark:bg-rose-500/10">
                <l.icon size={19} />
              </div>
              <div>
                <p className="font-medium text-ink dark:text-cream">{l.label}</p>
                <p className="text-xs text-ink-500 dark:text-cream/50">{l.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
