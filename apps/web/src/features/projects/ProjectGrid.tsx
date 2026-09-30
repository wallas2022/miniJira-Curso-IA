import { ProjectCard } from './ProjectCard';
import type { Proyecto } from '../../types';

export interface ProjectGridProps {
  proyectos: Proyecto[];
}

export function ProjectGrid({ proyectos }: ProjectGridProps) {
  if (proyectos.length === 0) {
    return (
      <p className="text-body text-secondary" role="status">
        Todavía no hay proyectos.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-(--mj-space-4)">
      {proyectos.map((proyecto) => (
        <ProjectCard key={proyecto.id} proyecto={proyecto} />
      ))}
    </div>
  );
}
