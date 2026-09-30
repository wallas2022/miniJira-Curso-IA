import { mockProyectos } from '../../mocks/proyectos';
import { ProjectGrid } from './ProjectGrid';

export function ProjectsPage() {
  return (
    <div className="mx-auto max-w-[1100px] p-(--mj-space-5)">
      <h1 className="text-h1 font-semibold text-primary">Proyectos</h1>
      <div className="mt-(--mj-space-5)">
        <ProjectGrid proyectos={mockProyectos} />
      </div>
    </div>
  );
}
