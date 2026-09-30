import type { Estado, Prioridad } from '../../types';

export const ESTADOS_ORDENADOS: readonly Estado[] = [
  'POR_HACER',
  'EN_PROGRESO',
  'REVIEW',
  'TERMINADO',
];

export const ESTADO_LABELS: Record<Estado, string> = {
  POR_HACER: 'Por hacer',
  EN_PROGRESO: 'En progreso',
  REVIEW: 'Review',
  TERMINADO: 'Terminado',
};

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};
