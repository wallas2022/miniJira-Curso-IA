import type { Ticket } from '../../types';
import { BoardColumn } from './BoardColumn';
import { ESTADOS_ORDENADOS, ESTADO_LABELS } from './constants';

export interface KanbanBoardProps {
  tickets: Ticket[];
}

export function KanbanBoard({ tickets }: KanbanBoardProps) {
  return (
    <div className="flex gap-(--mj-space-4) overflow-x-auto pb-(--mj-space-2)">
      {ESTADOS_ORDENADOS.map((estado) => (
        <BoardColumn
          key={estado}
          estado={estado}
          titulo={ESTADO_LABELS[estado]}
          tickets={tickets.filter((ticket) => ticket.estado === estado)}
        />
      ))}
    </div>
  );
}
