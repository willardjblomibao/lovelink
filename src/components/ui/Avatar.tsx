import { cx, initials } from '@/lib/utils';
import { Heart } from 'lucide-react';

export function Avatar({
  name,
  src,
  size = 48,
  online,
  ring
}: {
  name: string;
  src?: string | null;
  size?: number;
  online?: boolean;
  ring?: boolean;
}) {
  const initialsText = initials(name);
  return (
    <div className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <div
        className={cx(
          'flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose-300 to-rose-500 font-display text-white',
          ring && 'ring-4 ring-white/80 dark:ring-charcoal-100'
        )}
        style={{ fontSize: size * 0.36 }}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : initialsText ? (
          <span>{initialsText}</span>
        ) : (
          <Heart size={size * 0.4} className="fill-white/90 text-white/90" />
        )}
      </div>
      {online !== undefined && (
        <span
          className={cx(
            'absolute bottom-0 right-0 block rounded-full border-2 border-cream dark:border-charcoal',
            online ? 'bg-emerald-400' : 'bg-ink-500/40'
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
