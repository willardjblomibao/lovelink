import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  icon?: ReactNode;
  full?: boolean;
}

export function Button({
  variant = 'primary',
  loading,
  icon,
  full,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : 'inline-flex items-center gap-2 text-rose-500 font-medium';

  return (
    <button className={cx(base, full && 'w-full', className)} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner size={18} /> : icon}
      {children}
    </button>
  );
}
