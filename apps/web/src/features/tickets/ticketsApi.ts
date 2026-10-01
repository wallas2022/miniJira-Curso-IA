import type { Estado } from '../../types';

// Simula la persistencia remota de un movimiento de ticket. No hay backend real
// todavía (ver nota en docs/frontend-specs.md §5.2); el rechazo aleatorio existe
// para poder ejercitar el rollback optimista del store sin intervención manual.
const PROBABILIDAD_DE_FALLO = 0.2;
const LATENCIA_MS = 400;

export function moverTicketRemoto(ticketId: string, nuevoEstado: Estado): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < PROBABILIDAD_DE_FALLO) {
        reject(new Error(`No se pudo guardar el movimiento del ticket ${ticketId} a ${nuevoEstado}`));
      } else {
        resolve();
      }
    }, LATENCIA_MS);
  });
}
