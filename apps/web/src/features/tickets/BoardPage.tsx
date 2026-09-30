import { useParams } from 'react-router-dom';
import { mockProyectos } from '../../mocks/proyectos';
import { mockTickets } from '../../mocks/tickets';
import { KanbanBoard } from './KanbanBoard';

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const proyecto = mockProyectos.find((p) => p.id === id);
  const ticketsDelProyecto = mockTickets.filter(
    (ticket) => ticket.proyectoId === id && !ticket.archivado,
  );

  return (
    <div className="p-(--mj-space-5)">
      <h1 className="text-h1 font-semibold text-primary">
        {proyecto?.nombre ?? 'Proyecto no encontrado'}
      </h1>
      <div className="mt-(--mj-space-5)">
        <KanbanBoard tickets={ticketsDelProyecto} />
      </div>
    </div>
  );
}
