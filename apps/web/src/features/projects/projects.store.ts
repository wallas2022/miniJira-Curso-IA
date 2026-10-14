import { create } from 'zustand';
import { listProjects } from '../../lib/api';
import type { Proyecto } from '../../types';

interface ProjectsState {
  proyectos: Proyecto[];
  cargando: boolean;
  error: string | null;
  cargarProyectos: () => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  proyectos: [],
  cargando: false,
  error: null,
  async cargarProyectos() {
    set({ cargando: true, error: null });
    try {
      const items: Proyecto[] = [];
      let cursor: string | undefined;
      do {
        const page = await listProjects({ cursor });
        items.push(...page.items);
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      set({ proyectos: items, cargando: false });
    } catch {
      set({ cargando: false, error: 'No se pudieron cargar los proyectos.' });
    }
  },
}));
