import { useEffect } from 'react';
import { ProjectGrid } from './ProjectGrid';
import { useProjectsStore } from './projects.store';

export function ProjectsPage() {
  const proyectos = useProjectsStore((state) => state.proyectos);
  const cargando = useProjectsStore((state) => state.cargando);
  const error = useProjectsStore((state) => state.error);
  const cargarProyectos = useProjectsStore((state) => state.cargarProyectos);

  useEffect(() => {
    void cargarProyectos();
  }, [cargarProyectos]);

  return (
    <div className="mx-auto max-w-[1100px] p-(--mj-space-5)">
      <h1 className="text-h1 font-semibold text-primary">Proyectos</h1>
      <div className="mt-(--mj-space-5)">
        {error && (
          <p
            role="alert"
            className="rounded-md border border-danger bg-error-bg p-(--mj-space-2) text-body text-error-text"
          >
            {error}
          </p>
        )}
        {cargando && proyectos.length === 0 ? (
          <p className="text-body text-secondary" role="status">
            Cargando proyectos…
          </p>
        ) : (
          !error && <ProjectGrid proyectos={proyectos} />
        )}
      </div>
    </div>
  );
}
