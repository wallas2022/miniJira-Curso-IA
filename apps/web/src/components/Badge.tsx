import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'prioridad-baja' | 'prioridad-media' | 'prioridad-alta';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-border text-primary border-transparent',
  'prioridad-baja': 'bg-transparent text-priority-baja border-priority-baja',
  'prioridad-media': 'bg-transparent text-priority-media border-priority-media',
  'prioridad-alta': 'bg-transparent text-priority-alta border-priority-alta',
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-pill border px-(--mj-space-2) text-caption ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </span>
  );
}
