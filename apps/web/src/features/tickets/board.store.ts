import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  addResponsable,
  archiveTicket,
  createComment,
  createTicket,
  listComments,
  listProjectTickets,
  patchTicket,
  restoreTicket,
  type CreateTicketPayload,
} from '../../lib/api';
import type { Comentario, Estado, Responsable, Ticket } from '../../types';

interface BoardState {
  tickets: Ticket[];
  comentarios: Record<string, Comentario[]>; // por ticketId
  error: string | null;
  // P0
  cargarTickets: (proyectoId: string) => Promise<void>;
  moveTicket: (ticketId: string, nuevoEstado: Estado) => Promise<void>;
  // P1
  crearTicket: (proyectoId: string, payload: CreateTicketPayload) => Promise<Ticket | null>;
  archivarTicket: (ticketId: string) => Promise<void>;
  restaurarTicket: (ticketId: string) => Promise<void>;
  asignarResponsable: (ticketId: string, userId: string) => Promise<void>;
  cargarComentarios: (proyectoId: string, ticketId: string) => Promise<void>;
  crearComentario: (
    proyectoId: string,
    ticketId: string,
    contenido: string,
  ) => Promise<Comentario | null>;
}

// Los ticket-level rollbacks restauran solo el ticket afectado, para no pisar
// cambios concurrentes de otros tickets mientras la llamada estaba en vuelo.
function reemplazar(tickets: Ticket[], ticket: Ticket): Ticket[] {
  return tickets.map((t) => (t.id === ticket.id ? ticket : t));
}

// Datos de usuario ya conocidos en el store (el API de responsables solo recibe el id).
function buscarUsuario(tickets: Ticket[], userId: string): Responsable['user'] | null {
  for (const t of tickets) {
    if (t.creador.id === userId) return t.creador;
    const r = t.responsables.find((resp) => resp.userId === userId);
    if (r) return r.user;
  }
  return null;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tickets: [],
  comentarios: {},
  error: null,
  async cargarTickets(proyectoId) {
    try {
      const items: Ticket[] = [];
      let cursor: string | undefined;
      do {
        const page = await listProjectTickets(proyectoId, { cursor });
        items.push(...page.items);
        cursor = page.nextCursor ?? undefined;
      } while (cursor);

      set((state) => ({
        tickets: [...state.tickets.filter((t) => t.proyectoId !== proyectoId), ...items],
        error: null,
      }));
    } catch {
      set({ error: 'No se pudieron cargar los tickets del proyecto.' });
    }
  },
  async moveTicket(ticketId, nuevoEstado) {
    const ticketsAnteriores = get().tickets;
    const ticket = ticketsAnteriores.find((t) => t.id === ticketId);
    if (!ticket || ticket.estado === nuevoEstado) return;

    set({
      tickets: ticketsAnteriores.map((t) =>
        t.id === ticketId ? { ...t, estado: nuevoEstado } : t,
      ),
      error: null,
    });

    try {
      const actualizado = await patchTicket(ticket.proyectoId, ticketId, { estado: nuevoEstado });
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === ticketId ? actualizado : t)),
      }));
    } catch {
      set({
        tickets: ticketsAnteriores,
        error: `No se pudo mover "${ticket.titulo}". Se revirtió el cambio.`,
      });
    }
  },

  // Sin optimista: el id y las marcas de tiempo los asigna el servidor.
  async crearTicket(proyectoId, payload) {
    set({ error: null });
    try {
      const creado = await createTicket(proyectoId, payload);
      set((state) => ({ tickets: [...state.tickets, creado] }));
      return creado;
    } catch {
      set({ error: `No se pudo crear el ticket "${payload.titulo}".` });
      return null;
    }
  },

  async archivarTicket(ticketId) {
    const ticket = get().tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.archivado) return;

    set((state) => ({
      tickets: reemplazar(state.tickets, { ...ticket, archivado: true }),
      error: null,
    }));

    try {
      const actualizado = await archiveTicket(ticket.proyectoId, ticketId);
      set((state) => ({ tickets: reemplazar(state.tickets, actualizado) }));
    } catch {
      set((state) => ({
        tickets: reemplazar(state.tickets, ticket),
        error: `No se pudo archivar "${ticket.titulo}". Se revirtió el cambio.`,
      }));
    }
  },

  // Solo opera sobre tickets presentes en el store (los archivados no vienen del listado).
  async restaurarTicket(ticketId) {
    const ticket = get().tickets.find((t) => t.id === ticketId);
    if (!ticket || !ticket.archivado) return;

    set((state) => ({
      tickets: reemplazar(state.tickets, { ...ticket, archivado: false }),
      error: null,
    }));

    try {
      const actualizado = await restoreTicket(ticket.proyectoId, ticketId);
      set((state) => ({ tickets: reemplazar(state.tickets, actualizado) }));
    } catch {
      set((state) => ({
        tickets: reemplazar(state.tickets, ticket),
        error: `No se pudo restaurar "${ticket.titulo}". Se revirtió el cambio.`,
      }));
    }
  },

  async asignarResponsable(ticketId, userId) {
    const ticket = get().tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.responsables.some((r) => r.userId === userId)) return;

    // Optimista solo si ya conocemos al usuario; si no, se espera al servidor.
    const usuario = buscarUsuario(get().tickets, userId);
    set((state) => ({
      tickets: usuario
        ? reemplazar(state.tickets, {
            ...ticket,
            responsables: [...ticket.responsables, { userId, user: usuario }],
          })
        : state.tickets,
      error: null,
    }));

    try {
      const actualizado = await addResponsable(ticket.proyectoId, ticketId, userId);
      set((state) => ({ tickets: reemplazar(state.tickets, actualizado) }));
    } catch {
      set((state) => ({
        tickets: reemplazar(state.tickets, ticket),
        error: `No se pudo asignar el responsable de "${ticket.titulo}". Se revirtió el cambio.`,
      }));
    }
  },

  async cargarComentarios(proyectoId, ticketId) {
    try {
      const items: Comentario[] = [];
      let cursor: string | undefined;
      do {
        const page = await listComments(proyectoId, ticketId, { cursor });
        items.push(...page.items);
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      set((state) => ({ comentarios: { ...state.comentarios, [ticketId]: items }, error: null }));
    } catch {
      set({ error: 'No se pudieron cargar los comentarios.' });
    }
  },

  // Sin optimista: el servidor asigna id, autor y fecha.
  async crearComentario(proyectoId, ticketId, contenido) {
    if (!contenido.trim()) {
      set({ error: 'El comentario no puede estar vacío.' });
      return null;
    }
    set({ error: null });
    try {
      const creado = await createComment(proyectoId, ticketId, contenido);
      set((state) => ({
        comentarios: {
          ...state.comentarios,
          [ticketId]: [...(state.comentarios[ticketId] ?? []), creado],
        },
      }));
      return creado;
    } catch {
      set({ error: 'No se pudo guardar el comentario.' });
      return null;
    }
  },
}));

export function useTicketsByStatus(proyectoId: string, estado: Estado): Ticket[] {
  return useBoardStore(
    useShallow((state) =>
      state.tickets.filter(
        (ticket) =>
          ticket.proyectoId === proyectoId && ticket.estado === estado && !ticket.archivado,
      ),
    ),
  );
}
