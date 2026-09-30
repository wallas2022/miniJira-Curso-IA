import type { ReactNode } from 'react';
import { Button, type ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'children'> {
  /** Obligatorio: sin texto visible, es la única etiqueta accesible del botón. */
  'aria-label': string;
  icon: ReactNode;
}

export function IconButton({ icon, ...props }: IconButtonProps) {
  return (
    <Button variant="icon" {...props}>
      {icon}
    </Button>
  );
}
