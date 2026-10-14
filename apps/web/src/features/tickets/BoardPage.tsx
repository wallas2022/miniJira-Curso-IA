import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectsStore } from '../projects/projects.store';
import { KanbanBoard } from './KanbanBoard';

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const proyecto = useProjectsStore((state) => state.proyectos.find((p) => p.id === id));
  const cargando = useProjectsStore((state) => state.cargando);
  const cargarProyectos = useProjectsStore((state) => state.cargarProyectos);

  // Entrada directa a /proyectos/:id: el store aún no tiene el proyecto, se resuelve el nombre.
  useEffect(() => {
    if (!proyecto) void cargarProyectos();
  }, [proyecto, cargarProyectos]);

  return (
    <div className="p-(--mj-space-5)">
      <h1 className="text-h1 font-semibold text-primary">
        {proyecto?.nombre ?? (cargando ? 'Cargando…' : 'Proyecto no encontrado')}
      </h1>
      <div className="mt-(--mj-space-5)">
        {id && <KanbanBoard proyectoId={id} />}
      </div>
    </div>
  );
}
