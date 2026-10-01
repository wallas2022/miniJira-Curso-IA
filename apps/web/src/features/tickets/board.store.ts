import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { mockTickets } from '../../mocks/tickets';
import type { Estado, Ticket } from '../../types';
import { moverTicketRemoto } from './ticketsApi';

interface BoardState {
  tickets: Ticket[];
  error: string | null;
  moveTicket: (ticketId: string, nuevoEstado: Estado) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tickets: mockTickets,
  error: null,
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
      await moverTicketRemoto(ticketId, nuevoEstado);
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
