import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '../../components/Badge';
import type { Estado } from '../../types';
import { useTicketsByStatus } from './board.store';
import { TicketCard } from './TicketCard';

export interface BoardColumnProps {
  estado: Estado;
  titulo: string;
  proyectoId: string;
}

export function BoardColumn({ estado, titulo, proyectoId }: BoardColumnProps) {
  const tickets = useTicketsByStatus(proyectoId, estado);
  const { setNodeRef } = useDroppable({ id: estado });

  return (
    <section
      ref={setNodeRef}
      aria-label={titulo}
      className="flex w-[280px] shrink-0 flex-col gap-(--mj-space-3) rounded-md border border-border bg-surface p-(--mj-space-3)"
    >
      <header className="flex items-center justify-between gap-(--mj-space-2)">
        <h3 className="text-h3 font-semibold text-primary">{titulo}</h3>
        <Badge>{tickets.length}</Badge>
      </header>
      {tickets.length === 0 ? (
        <p className="text-body text-secondary" role="status">
          Sin tickets
        </p>
      ) : (
        <SortableContext
          items={tickets.map((ticket) => ticket.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-(--mj-space-2) overflow-y-auto">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <TicketCard ticket={ticket} />
              </li>
            ))}
          </ul>
        </SortableContext>
      )}
    </section>
  );
}
