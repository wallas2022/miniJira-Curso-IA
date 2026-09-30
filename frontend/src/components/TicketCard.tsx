import type { AuthUser, Estado, Ticket } from '../types';

interface Props {
  ticket: Ticket;
  currentUser: AuthUser;
  estados: { value: Estado; label: string }[];
  onOpen: () => void;
  onMove: (estado: Estado) => void;
}

const PRIORIDAD_LABEL: Record<Ticket['prioridad'], string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };

// docs/prototype-spec.md C.4: tarjeta de ticket del tablero, con alternativa de teclado
// ("Mover a...") a la interaccion de arrastrar y soltar (WCAG 2.1 AA, seccion B.2).
export function TicketCard({ ticket, currentUser, estados, onOpen, onMove }: Props) {
  const autorizado =
    currentUser.rol === 'ADMIN' ||
    ticket.creadorId === currentUser.id ||
    ticket.responsables.some((r) => r.userId === currentUser.id);

  return (
    <div className="mj-card mj-ticket-card">
      <button type="button" className="mj-ticket-card-title" onClick={onOpen}>
        {ticket.titulo}
      </button>

      <span className={`mj-badge mj-badge--prioridad-${ticket.prioridad.toLowerCase()}`}>
        Prioridad: {PRIORIDAD_LABEL[ticket.prioridad]}
      </span>

      {ticket.responsables.length > 0 && (
        <div className="mj-avatar-row" aria-label="Responsables">
          {ticket.responsables.map((r) => (
            <span key={r.userId} className="mj-avatar" title={r.user.email}>
              {r.user.email.slice(0, 2).toUpperCase()}
            </span>
          ))}
        </div>
      )}

      <label className="mj-move-select">
        <span className="mj-sr-only">Mover "{ticket.titulo}" a</span>
        <select
          value={ticket.estado}
          disabled={!autorizado}
          onChange={(e) => onMove(e.target.value as Estado)}
        >
          {estados.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </label>
      {!autorizado && <p className="mj-hint mj-text-secondary">Solo lectura: no sos creador ni responsable.</p>}
    </div>
  );
}
