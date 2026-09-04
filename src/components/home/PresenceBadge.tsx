import { cx } from '@/lib/utils';

export function PresenceBadge({ online, name }: { online: boolean; name: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[13px]">
      <span
        className={cx(
          'h-2 w-2 rounded-full',
          online ? 'bg-emerald-400 animate-pulse-dot' : 'bg-ink-500/30'
        )}
      />
      <span className="text-ink-500 dark:text-cream/50">
        {name} is {online ? 'online now' : 'offline'}
      </span>
    </div>
  );
}
