import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChangeEvent } from 'react';
import { Avatar } from '../../components/Avatar';
import { Badge, type BadgeProps } from '../../components/Badge';
import type { Estado, Prioridad, Ticket } from '../../types';
import { useBoardStore } from './board.store';
import { ESTADOS_ORDENADOS, ESTADO_LABELS, PRIORIDAD_LABELS } from './constants';

export interface TicketCardProps {
  ticket: Ticket;
}

const PRIORIDAD_BADGE_VARIANT: Record<Prioridad, NonNullable<BadgeProps['variant']>> = {
  BAJA: 'prioridad-baja',
  MEDIA: 'prioridad-media',
  ALTA: 'prioridad-alta',
};

export function TicketCard({ ticket }: TicketCardProps) {
  const moveTicket = useBoardStore((state) => state.moveTicket);
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: ticket.id,
  });

  function handleMoverA(event: ChangeEvent<HTMLSelectElement>) {
    moveTicket(ticket.id, event.target.value as Estado);
  }

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className="flex flex-col gap-(--mj-space-2) rounded-md border border-border bg-surface p-(--mj-space-4) shadow-card"
    >
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
      <label className="flex flex-col gap-(--mj-space-1) text-caption text-secondary">
        Mover a…
        <select
          value={ticket.estado}
          onChange={handleMoverA}
          onPointerDown={(event) => event.stopPropagation()}
          className="rounded-sm border border-border bg-surface p-(--mj-space-1) text-body text-primary"
        >
          {ESTADOS_ORDENADOS.map((estado) => (
            <option key={estado} value={estado}>
              {ESTADO_LABELS[estado]}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
