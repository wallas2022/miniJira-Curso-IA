import { Link } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import type { Proyecto } from '../../types';

export interface ProjectCardProps {
  proyecto: Proyecto;
}

export function ProjectCard({ proyecto }: ProjectCardProps) {
  return (
    <Link
      to={`/proyectos/${proyecto.id}`}
      className="flex flex-col gap-(--mj-space-3) rounded-md border border-border bg-surface p-(--mj-space-5) text-inherit no-underline shadow-card"
    >
      <h3 className="text-h2 font-semibold text-primary">{proyecto.nombre}</h3>
      {proyecto.descripcion && <p className="text-body text-secondary">{proyecto.descripcion}</p>}
      <div className="mt-auto flex items-center justify-between gap-(--mj-space-3)">
        <div className="flex items-center gap-(--mj-space-2)">
          <Avatar nombre={proyecto.creador.nombre} />
          <span className="text-body text-secondary">{proyecto.creador.nombre}</span>
        </div>
        <Badge>{proyecto.ticketsAbiertos} tickets</Badge>
      </div>
    </Link>
  );
}
