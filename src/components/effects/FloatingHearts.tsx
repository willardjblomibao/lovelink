import { useMemo } from 'react';
import { Heart } from 'lucide-react';

/** Gentle ambient hearts drifting upward. Purely decorative, pointer-events disabled. */
export function FloatingHearts({ count = 6 }: { count?: number }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: 5 + Math.random() * 90,
        delay: Math.random() * 5,
        duration: 6 + Math.random() * 4,
        size: 12 + Math.random() * 14,
        opacity: 0.15 + Math.random() * 0.25
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((h) => (
        <Heart
          key={h.id}
          className="absolute bottom-0 animate-float-up fill-rose-400 text-rose-400"
          style={{
            left: `${h.left}%`,
            width: h.size,
            height: h.size,
            opacity: h.opacity,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`
          }}
        />
      ))}
    </div>
  );
}
