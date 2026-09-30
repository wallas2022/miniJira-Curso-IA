import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'default' | 'primary' | 'destructive' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  default: 'bg-surface border-border text-primary',
  primary: 'bg-action-primary border-action-primary text-on-primary',
  destructive: 'bg-error-bg border-danger text-error-text',
  icon: 'bg-surface border-border text-primary min-w-11 p-(--mj-space-1)',
};

export function Button({ variant = 'default', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-(--mj-space-2) rounded-sm border px-(--mj-space-4) text-body transition-[background-color,opacity] duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
