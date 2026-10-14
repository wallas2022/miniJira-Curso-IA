import { create } from 'zustand';
import {
  createProject,
  listProjects,
  patchProject,
  type CreateProjectPayload,
  type PatchProjectPayload,
} from '../../lib/api';
import type { Proyecto } from '../../types';

interface ProjectsState {
  proyectos: Proyecto[];
  cargando: boolean;
  error: string | null;
  // P0
  cargarProyectos: () => Promise<void>;
  // P1
  crearProyecto: (payload: CreateProjectPayload) => Promise<Proyecto | null>;
  editarProyecto: (proyectoId: string, patch: PatchProjectPayload) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
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

  // Sin optimista: el id y creadoEn los asigna el servidor.
  async crearProyecto(payload) {
    set({ error: null });
    try {
      const creado = await createProject(payload);
      set((state) => ({ proyectos: [creado, ...state.proyectos] }));
      return creado;
    } catch {
      set({ error: `No se pudo crear el proyecto "${payload.nombre}".` });
      return null;
    }
  },

  async editarProyecto(proyectoId, patch) {
    const anterior = get().proyectos.find((p) => p.id === proyectoId);
    if (!anterior) return;

    const reemplazar = (proyecto: Proyecto) =>
      set((state) => ({
        proyectos: state.proyectos.map((p) => (p.id === proyecto.id ? proyecto : p)),
      }));

    reemplazar({ ...anterior, ...patch });
    set({ error: null });

    try {
      reemplazar(await patchProject(proyectoId, patch));
    } catch {
      reemplazar(anterior);
      set({ error: `No se pudo editar "${anterior.nombre}". Se revirtió el cambio.` });
    }
  },
}));
