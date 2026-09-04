import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { PartnerRole } from '@/types';
import { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

const options: { role: PartnerRole; label: string; emoji: string }[] = [
  { role: 'boyfriend', label: 'Boyfriend', emoji: '🤵' },
  { role: 'girlfriend', label: 'Girlfriend', emoji: '👰' }
];

export default function ChooseRole() {
  const { setRole } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState<PartnerRole | null>(null);

  const handlePick = async (role: PartnerRole) => {
    setSaving(role);
    await setRole(role);
    navigate('/link-partner');
  };

  return (
    <div className="flex h-screen flex-col justify-center bg-cream px-6 dark:bg-charcoal">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-10 text-center"
      >
        <h1 className="font-display text-2xl text-ink dark:text-cream">Who are you in this story?</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-cream/60">You can't change this later, so choose truly.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((opt, i) => (
          <motion.button
            key={opt.role}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handlePick(opt.role)}
            disabled={saving !== null}
            className="glass-card flex flex-col items-center gap-3 py-10"
          >
            <span className="text-5xl">{opt.emoji}</span>
            <span className="font-display text-lg text-ink dark:text-cream">{opt.label}</span>
            {saving === opt.role && <Spinner size={18} className="text-rose-500" />}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
