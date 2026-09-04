import { useRef, useState } from 'react';
import { LogOut, Moon, Sun, Camera, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotifications } from '@/context/NotificationContext';
import { supabase } from '@/lib/supabase';
import { TopBar } from '@/components/ui/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function Settings() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { couple } = useCouple();
  const { theme, toggleTheme } = useTheme();
  const { permission, requestPermission } = useNotifications();
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (file: File) => {
    if (!profile?.id) return;
    setUploading(true);
    const path = `${profile.id}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', profile.id);
      await refreshProfile();
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-cream pb-10 dark:bg-charcoal">
      <TopBar title="Settings" showBack right={<span />} />

      <div className="space-y-5 px-5">
        <GlassCard className="flex flex-col items-center gap-3 py-8">
          <div className="relative">
            <Avatar name={profile?.display_name ?? '?'} src={profile?.avatar_url} size={80} ring />
            <button
              onClick={() => fileInput.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full bg-rose-500 p-1.5 text-white shadow-soft"
            >
              {uploading ? <Spinner size={12} /> : <Camera size={13} />}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
            />
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-ink dark:text-cream">{profile?.display_name}</p>
            <p className="text-xs capitalize text-ink-500 dark:text-cream/50">{profile?.role}</p>
          </div>
        </GlassCard>

        {couple && (
          <GlassCard className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink dark:text-cream">Invite code</p>
              <p className="text-xs text-ink-500 dark:text-cream/50">Share only with your partner</p>
            </div>
            <span className="font-display text-lg tracking-widest text-rose-500">{couple.invite_code}</span>
          </GlassCard>
        )}

        <GlassCard className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <Bell size={18} className="text-rose-500" />
            ) : (
              <BellOff size={18} className="text-rose-500" />
            )}
            <div>
              <p className="text-sm font-medium text-ink dark:text-cream">Chat notifications</p>
              <p className="text-xs text-ink-500 dark:text-cream/50">
                {permission === 'granted'
                  ? 'On — you\'ll be notified of new chats'
                  : permission === 'denied'
                  ? 'Blocked in browser settings'
                  : 'Off — enable to get notified'}
              </p>
            </div>
          </div>
          {permission !== 'granted' && permission !== 'denied' && (
            <Button variant="secondary" onClick={requestPermission} className="px-4 py-2 text-xs">
              Enable
            </Button>
          )}
        </GlassCard>

        <GlassCard className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'light' ? <Sun size={18} className="text-rose-500" /> : <Moon size={18} className="text-rose-500" />}
            <span className="text-sm font-medium text-ink dark:text-cream">Dark mode</span>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative h-7 w-12 rounded-full transition-colors ${theme === 'dark' ? 'bg-rose-500' : 'bg-ink/15'}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </GlassCard>

        <Button full variant="secondary" onClick={signOut} icon={<LogOut size={17} />}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
