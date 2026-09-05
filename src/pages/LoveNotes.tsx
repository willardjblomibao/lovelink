import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Check, CheckCheck, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCouple } from '@/context/CoupleContext';
import { useNotifications } from '@/context/NotificationContext';
import { useMessages, useTypingIndicator } from '@/hooks/useMessages';
import { TopBar } from '@/components/ui/TopBar';
import { cx, formatTime } from '@/lib/utils';
import { triggerHeartBurst } from '@/components/effects/HeartBurst';

export default function LoveNotes() {
  const { profile } = useAuth();
  const { couple, partner } = useCouple();
  const { messages, sendMessage, react } = useMessages(couple?.id ?? null, profile?.id ?? null);
  const { partnerTyping, setTyping } = useTypingIndicator(couple?.id ?? null, profile?.id ?? null);
  const { clearUnreadChats } = useNotifications();

  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, partnerTyping]);

  useEffect(() => {
    clearUnreadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleChange = (value: string) => {
    setDraft(value);
    setTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setTyping(false), 1500);
  };

  const handleSend = async (e: MouseEvent<HTMLButtonElement>) => {
    if (!draft.trim()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const text = draft;
    setDraft('');
    setTyping(false);
    setSendError(null);

    const { error } = await sendMessage(text);
    if (error) {
      setDraft(text); // restore so nothing is lost
      setSendError(error);
    } else {
      triggerHeartBurst(rect.left + rect.width / 2, rect.top);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-cream dark:bg-charcoal">
      <TopBar title={partner ? `${partner.display_name}` : 'Chats'} showBack right={<span />} />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-3 pt-2">
        {messages.map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cx('flex', mine ? 'justify-end' : 'justify-start')}
            >
              <div className={cx('max-w-[75%]', mine ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
                <div
                  onDoubleClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    triggerHeartBurst(rect.left + rect.width / 2, rect.top);
                    react(m.id, 'heart');
                  }}
                  className={cx(
                    'relative rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-soft',
                    mine
                      ? 'rounded-br-md bg-rose-500 text-white'
                      : 'rounded-bl-md bg-white/80 text-ink dark:bg-white/10 dark:text-cream'
                  )}
                >
                  {m.content}
                  {m.reaction === 'heart' && (
                    <span className="absolute -bottom-3 -right-1">
                      <Heart size={14} className="fill-rose-500 text-rose-500" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 px-1 text-[11px] text-ink-500 dark:text-cream/40">
                  <span>{formatTime(m.created_at)}</span>
                  {mine && (m.seen_at ? <CheckCheck size={13} className="text-rose-400" /> : <Check size={13} />)}
                </div>
              </div>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {partnerTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white/80 px-4 py-3 shadow-soft dark:bg-white/10">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-ink-500/50 dark:bg-cream/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.12 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <div className="mx-4 mb-1 rounded-xl bg-rose-100 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          Couldn't send: {sendError}
        </div>
      )}

      <div className="safe-bottom flex items-end gap-2 border-t border-white/50 bg-white/70 px-4 py-3 backdrop-blur-glass dark:border-white/10 dark:bg-charcoal-100/80">
        <textarea
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (draft.trim()) {
                const text = draft;
                setDraft('');
                setTyping(false);
                setSendError(null);
                sendMessage(text).then(({ error }) => {
                  if (error) {
                    setDraft(text);
                    setSendError(error);
                  }
                });
              }
            }
          }}
          rows={1}
          placeholder="Send a little love..."
          className="input-field max-h-24 flex-1 resize-none py-2.5"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="rounded-full bg-rose-500 p-3 text-white shadow-soft active:scale-90 transition-transform disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
