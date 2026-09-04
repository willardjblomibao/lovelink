import { Quote } from 'lucide-react';
import { quoteForToday } from '@/lib/utils';
import type { Couple } from '@/types';

export function DailyQuote({ couple }: { couple: Couple | null }) {
  const quote = couple?.daily_quote || quoteForToday();

  return (
    <div className="flex items-start gap-3">
      <Quote size={18} className="mt-0.5 shrink-0 text-rose-400" />
      <p className="font-display text-[15px] italic leading-relaxed text-ink-700 dark:text-cream/80">
        {quote}
      </p>
    </div>
  );
}
