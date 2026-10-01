import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useBoardStore } from './board.store';
import { BoardColumn } from './BoardColumn';
import { ESTADOS_ORDENADOS, ESTADO_LABELS } from './constants';
import type { Estado } from '../../types';

export interface KanbanBoardProps {
  proyectoId: string;
}

function esEstado(id: string | number): id is Estado {
  return (ESTADOS_ORDENADOS as readonly string[]).includes(String(id));
}

export function KanbanBoard({ proyectoId }: KanbanBoardProps) {
  const tickets = useBoardStore((state) => state.tickets);
  const error = useBoardStore((state) => state.error);
  const moveTicket = useBoardStore((state) => state.moveTicket);
  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    let estadoDestino: Estado | undefined;
    if (esEstado(over.id)) {
      estadoDestino = over.id;
    } else {
      estadoDestino = tickets.find((ticket) => ticket.id === over.id)?.estado;
    }

    if (estadoDestino) {
      moveTicket(String(active.id), estadoDestino);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {error && (
        <p
          role="alert"
          className="mb-(--mj-space-3) rounded-md border border-danger bg-error-bg p-(--mj-space-2) text-body text-error-text"
        >
          {error}
        </p>
      )}
      <div className="flex gap-(--mj-space-4) overflow-x-auto pb-(--mj-space-2)">
        {ESTADOS_ORDENADOS.map((estado) => (
          <BoardColumn
            key={estado}
            estado={estado}
            titulo={ESTADO_LABELS[estado]}
            proyectoId={proyectoId}
          />
        ))}
      </div>
    </DndContext>
  );
}
