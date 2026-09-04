import { ChevronLeft, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import type { ReactNode } from 'react';

export function TopBar({
  title,
  showBack,
  right
}: {
  title: string;
  showBack?: boolean;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="safe-top sticky top-0 z-30 flex items-center justify-between bg-cream/80 px-5 pb-3 pt-4 backdrop-blur-glass dark:bg-charcoal/80">
      <div className="flex w-10 items-center">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="-ml-2 rounded-full p-2 text-ink-700 active:bg-ink/5 dark:text-cream dark:active:bg-white/10"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
        )}
      </div>
      <h1 className="font-display text-lg font-medium text-ink dark:text-cream">{title}</h1>
      <div className="flex w-10 items-center justify-end">
        {right ?? (
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-ink-700 active:bg-ink/5 dark:text-cream dark:active:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        )}
      </div>
    </header>
  );
}
