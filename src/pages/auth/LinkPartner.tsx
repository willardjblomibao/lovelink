import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Confetti } from '@/components/effects/Confetti';

type Mode = 'choice' | 'create' | 'join';

export default function LinkPartner() {
  const { profile } = useAuth();
  const { createInvite, joinWithCode, couple, partner } = useCouple();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('choice');
  const [code, setCode] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(couple?.invite_code ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [justConnected, setJustConnected] = useState(false);

  if (couple?.boyfriend_id && couple?.girlfriend_id && !justConnected) {
    navigate('/home');
  }

  const handleCreate = async () => {
    if (!profile?.role) return;
    setLoading(true);
    setError(null);
    const { code: newCode, error } = await createInvite(profile.role);
    setLoading(false);
    if (error) setError(error);
    else {
      setInviteCode(newCode);
      setMode('create');
    }
  };

  const handleJoin = async () => {
    if (!profile?.role || code.length < 6) return;
    setLoading(true);
    setError(null);
    const { error } = await joinWithCode(code, profile.role);
    setLoading(false);
    if (error) setError(error);
    else {
      setJustConnected(true);
      setTimeout(() => navigate('/home'), 2200);
    }
  };

  const copyCode = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (justConnected || (couple?.boyfriend_id && couple?.girlfriend_id)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center dark:bg-charcoal">
        <Confetti show />
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <Heart size={56} className="fill-rose-500 text-rose-500" />
        </motion.div>
        <h2 className="font-display text-2xl text-ink dark:text-cream">You're connected!</h2>
        <p className="text-sm text-ink-500 dark:text-cream/60">
          You and {partner?.display_name ?? 'your partner'} are linked. Taking you home...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col justify-center bg-cream px-6 dark:bg-charcoal">
      <AnimatePresence mode="wait">
        {mode === 'choice' && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="font-display text-2xl text-ink dark:text-cream">Link with your partner</h1>
              <p className="mt-2 text-sm text-ink-500 dark:text-cream/60">
                One of you creates a code, the other enters it. That's it.
              </p>
            </div>
            <Button full onClick={handleCreate} loading={loading}>
              Create an invite code
            </Button>
            <Button full variant="secondary" onClick={() => setMode('join')}>
              I have a code
            </Button>
          </motion.div>
        )}

        {mode === 'create' && inviteCode && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6 text-center"
          >
            <h1 className="font-display text-2xl text-ink dark:text-cream">Share this code</h1>
            <p className="text-sm text-ink-500 dark:text-cream/60">Send it to your partner to link your accounts.</p>
            <GlassCard className="flex items-center justify-center gap-4 py-8">
              <span className="font-display text-4xl tracking-[0.3em] text-rose-500">{inviteCode}</span>
              <button
                onClick={copyCode}
                className="rounded-full bg-white/70 p-2.5 text-rose-500 shadow-soft dark:bg-white/10"
                aria-label="Copy code"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </GlassCard>
            <p className="text-xs text-ink-500 dark:text-cream/40">Waiting for your partner to join...</p>
            <div className="flex justify-center pt-2">
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-rose-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              />
            </div>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h1 className="font-display text-2xl text-ink dark:text-cream">Enter your code</h1>
              <p className="mt-2 text-sm text-ink-500 dark:text-cream/60">Ask your partner for their 6-character code.</p>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="A1B2C3"
              maxLength={6}
              className="input-field text-center font-display text-3xl tracking-[0.4em]"
            />
            {error && <p className="text-center text-sm text-rose-700">{error}</p>}
            <Button full onClick={handleJoin} loading={loading} disabled={code.length < 6}>
              Connect
            </Button>
            <Button full variant="ghost" onClick={() => setMode('choice')} className="justify-center">
              Back
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
