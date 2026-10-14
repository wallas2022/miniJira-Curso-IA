import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { listProjectTickets, patchTicket } from '../../lib/api';
import type { Estado, Ticket } from '../../types';

interface BoardState {
  tickets: Ticket[];
  error: string | null;
  cargarTickets: (proyectoId: string) => Promise<void>;
  moveTicket: (ticketId: string, nuevoEstado: Estado) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tickets: [],
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
