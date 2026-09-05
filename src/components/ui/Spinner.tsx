import { cx } from '@/lib/utils';
import { Heart } from 'lucide-react';

export function Spinner({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export function FullScreenLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-cream dark:bg-charcoal">
      <div className="flex flex-col items-center gap-3 text-rose-500">
        <Heart size={36} className="animate-heart-pop fill-rose-500" />
        <Spinner />
      </div>
    </div>
  );
}
