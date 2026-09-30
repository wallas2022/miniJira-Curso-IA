import { Avatar } from '../../components/Avatar';
import { Badge, type BadgeProps } from '../../components/Badge';
import type { Prioridad, Ticket } from '../../types';
import { PRIORIDAD_LABELS } from './constants';

export interface TicketCardProps {
  ticket: Ticket;
}

const PRIORIDAD_BADGE_VARIANT: Record<Prioridad, NonNullable<BadgeProps['variant']>> = {
  BAJA: 'prioridad-baja',
  MEDIA: 'prioridad-media',
  ALTA: 'prioridad-alta',
};

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <article className="flex flex-col gap-(--mj-space-2) rounded-md border border-border bg-surface p-(--mj-space-4) shadow-card">
      <h4 className="text-body font-semibold text-primary">{ticket.titulo}</h4>
      <Badge variant={PRIORIDAD_BADGE_VARIANT[ticket.prioridad]}>
        Prioridad: {PRIORIDAD_LABELS[ticket.prioridad]}
      </Badge>
      {ticket.responsables.length > 0 && (
        <div className="flex items-center gap-(--mj-space-1)">
          {ticket.responsables.map((responsable) => (
            <Avatar key={responsable.userId} nombre={responsable.user.nombre} />
          ))}
        </div>
      )}
      {ticket.etiquetas.length > 0 && (
        <div className="flex flex-wrap gap-(--mj-space-1)">
          {ticket.etiquetas.map((etiqueta) => (
            <Badge key={etiqueta.id}>{etiqueta.nombre}</Badge>
          ))}
        </div>
      )}
    </article>
  );
}
