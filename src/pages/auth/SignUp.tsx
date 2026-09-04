import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TopBar } from '@/components/ui/TopBar';

export default function SignUp() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, name);
    setLoading(false);
    if (error) setError(error);
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center dark:bg-charcoal">
        <span className="text-5xl">💌</span>
        <h2 className="font-display text-xl text-ink dark:text-cream">Check your inbox</h2>
        <p className="text-sm text-ink-500 dark:text-cream/60">
          We sent a confirmation link to <strong>{email}</strong>. Tap it, then come back and log in.
        </p>
        <Button variant="secondary" onClick={() => navigate('/login')}>
          Back to log in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-cream dark:bg-charcoal">
      <TopBar title="Create your account" showBack right={<span />} />
      <div className="flex flex-1 flex-col justify-center px-6">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input label="Your name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" />
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <Button type="submit" full loading={loading}>
            Sign up
          </Button>
        </motion.form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
          <span className="text-xs text-ink-500 dark:text-cream/40">or</span>
          <div className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
        </div>

        <Button full variant="secondary" onClick={signInWithGoogle}>
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-ink-500 dark:text-cream/50">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-rose-500">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
