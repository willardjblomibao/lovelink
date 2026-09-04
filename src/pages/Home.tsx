import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, MessageCircle, Smile, Timer, Image as ImageIcon, ListChecks, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { Avatar } from '@/components/ui/Avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { TogetherCounter } from '@/components/home/TogetherCounter';
import { DailyQuote } from '@/components/home/DailyQuote';
import { PresenceBadge } from '@/components/home/PresenceBadge';
import { FloatingHearts } from '@/components/effects/FloatingHearts';
import { BottomNav } from '@/components/ui/BottomNav';

const quickLinks = [
  { to: '/notes', label: 'Love Notes', icon: MessageCircle },
  { to: '/mood', label: 'Mood', icon: Smile },
  { to: '/study', label: 'Study', icon: Timer },
  { to: '/memories', label: 'Memories', icon: ImageIcon },
  { to: '/bucket-list', label: 'Bucket List', icon: ListChecks },
  { to: '/surprises', label: 'Surprises', icon: Lock }
];

export default function Home() {
  const { profile } = useAuth();
  const { couple, partner, loading } = useCouple();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blush/60 via-cream to-cream pb-28 dark:from-charcoal-100/60 dark:via-charcoal dark:to-charcoal">
      <FloatingHearts count={4} />

      <div className="safe-top flex items-center justify-between px-5 pb-2 pt-5">
        <div>
          <p className="text-sm text-ink-500 dark:text-cream/50">Welcome back,</p>
          <h1 className="font-display text-xl text-ink dark:text-cream">{profile?.display_name?.split(' ')[0]}</h1>
        </div>
        <Link to="/settings" className="rounded-full bg-white/60 p-2.5 shadow-soft dark:bg-white/10">
          <SettingsIcon size={20} className="text-ink-700 dark:text-cream" />
        </Link>
      </div>

      <div className="relative z-10 space-y-5 px-5 pt-4">
        <GlassCard className="flex flex-col items-center gap-4 py-8">
          <div className="flex items-center gap-[-8px]">
            <Avatar name={profile?.display_name ?? '?'} src={profile?.avatar_url} size={64} ring online={profile?.is_online} />
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="-mx-3 z-10 text-2xl"
            >
              💗
            </motion.span>
            <Avatar
              name={partner?.display_name ?? 'Partner'}
              src={partner?.avatar_url}
              size={64}
              ring
              online={partner?.is_online}
            />
          </div>

          {!loading && !partner && (
            <Link to="/link-partner" className="text-sm font-medium text-rose-500">
              Link your partner to unlock the full experience →
            </Link>
          )}

          {partner && (
            <>
              <TogetherCounter since={couple?.anniversary_date ?? couple?.connected_at ?? null} />
              <PresenceBadge online={partner.is_online} name={partner.display_name} />
            </>
          )}
        </GlassCard>

        <GlassCard delay={0.05}>
          <DailyQuote couple={couple} />
        </GlassCard>

        <div>
          <h2 className="mb-3 px-1 font-display text-base text-ink dark:text-cream">Together</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickLinks.map(({ to, label, icon: Icon }, i) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
              >
                <Link
                  to={to}
                  className="glass-card flex flex-col items-center justify-center gap-2 py-5 text-center active:scale-95 transition-transform"
                >
                  <Icon size={22} className="text-rose-500" />
                  <span className="text-xs font-medium text-ink-700 dark:text-cream/80">{label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
