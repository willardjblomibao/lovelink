import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import type { LoveNote } from '@/types';

interface ToastItem {
  id: number;
  title: string;
  body: string;
}

interface NotificationContextValue {
  unreadChats: number;
  clearUnreadChats: () => void;
  toasts: ToastItem[];
  dismissToast: (id: number) => void;
  permission: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { couple, partner } = useCouple();
  const [unreadChats, setUnreadChats] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const onChatPage = useRef(false);

  useEffect(() => {
    onChatPage.current = window.location.pathname === '/notes';
    const handleRoute = () => {
      onChatPage.current = window.location.pathname === '/notes';
    };
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  useEffect(() => {
    if (!couple?.id || !profile?.id) return;

    const channel = supabase
      .channel(`chat-notify:${couple.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `couple_id=eq.${couple.id}` },
        (payload) => {
          const msg = payload.new as LoveNote;
          if (msg.sender_id === profile.id) return;

          const onChat = window.location.pathname === '/notes';
          if (!onChat) {
            setUnreadChats((c) => c + 1);
          }

          const toast: ToastItem = {
            id: Date.now(),
            title: partner?.display_name ?? 'New message',
            body: msg.content
          };
          setToasts((t) => [...t, toast]);
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== toast.id)), 4500);

          if (permission === 'granted' && document.hidden) {
            new Notification(`💗 ${partner?.display_name ?? 'Your partner'}`, {
              body: msg.content,
              icon: '/icons/icon-192.png'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id, profile?.id, partner?.display_name, permission]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadChats,
        clearUnreadChats: () => setUnreadChats(0),
        toasts,
        dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
        permission,
        requestPermission
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
