import type { InputHTMLAttributes } from 'react';
import { cx } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...rest }: InputProps) {
  return (
    <label className="block text-left">
      {label && (
        <span className="mb-1.5 block text-[13px] font-medium text-ink-700 dark:text-cream/70">{label}</span>
      )}
      <input id={id} className={cx('input-field', className)} {...rest} />
    </label>
  );
}
