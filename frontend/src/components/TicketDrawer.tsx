import { FormEvent, useEffect, useState } from 'react';
import { useAnnouncer } from '../context/AnnouncerContext';
import { api } from '../lib/api';
import type { AuthUser, Prioridad, Ticket, UsuarioResumen } from '../types';

interface Props {
  proyectoId: string;
  ticket: Ticket | null;
  users: UsuarioResumen[];
  currentUser: AuthUser;
  onClose: () => void;
  onSaved: () => void;
}

const PRIORIDADES: Prioridad[] = ['BAJA', 'MEDIA', 'ALTA'];

// RF-08/RF-09a/RF-05/RF-01/RF-02 (docs/prototype-spec.md C.5): detalle de ticket, crear/editar.
export function TicketDrawer({ proyectoId, ticket, users, currentUser, onClose, onSaved }: Props) {
  const { announce } = useAnnouncer();
  const esEdicion = ticket !== null;
  const autorizado =
    !esEdicion ||
    currentUser.rol === 'ADMIN' ||
    ticket!.creadorId === currentUser.id ||
    ticket!.responsables.some((r) => r.userId === currentUser.id);

  const [titulo, setTitulo] = useState(ticket?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(ticket?.descripcion ?? '');
  const [prioridad, setPrioridad] = useState<Prioridad>(ticket?.prioridad ?? 'MEDIA');
  const [responsableIds, setResponsableIds] = useState<Set<string>>(
    new Set(ticket?.responsables.map((r) => r.userId) ?? [])
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const puedeAsignarA = (userId: string) => currentUser.rol === 'ADMIN' || userId === currentUser.id;

  const toggleResponsable = (userId: string) => {
    setResponsableIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('El titulo es obligatorio.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      if (esEdicion) {
        await api.updateTicket(ticket!.id, { titulo, descripcion, prioridad });
        const actuales = new Set(ticket!.responsables.map((r) => r.userId));
        const cambioResponsables =
          actuales.size !== responsableIds.size || [...actuales].some((id) => !responsableIds.has(id));
        if (cambioResponsables) {
          await api.assignTicket(ticket!.id, [...responsableIds]);
        }
      } else {
        await api.createTicket({ proyectoId, titulo, descripcion, prioridad });
      }
      announce(esEdicion ? `Ticket "${titulo}" guardado.` : `Ticket "${titulo}" creado.`);
      onSaved();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo guardar el ticket.';
      setError(mensaje);
      announce(mensaje, { assertive: true });
    } finally {
      setGuardando(false);
    }
  };

  const onArchivar = async () => {
    if (!ticket) return;
    if (!window.confirm(`¿Archivar "${ticket.titulo}"? Podras verlo en Archivados.`)) return;
    setGuardando(true);
    setError(null);
    try {
      await api.archiveTicket(ticket.id);
      announce(`Ticket "${ticket.titulo}" archivado.`);
      onSaved();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo archivar el ticket.';
      setError(mensaje);
      announce(mensaje, { assertive: true });
      setGuardando(false);
    }
  };

  return (
    <div className="mj-drawer-overlay" onClick={onClose}>
      <aside
        className="mj-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={onSubmit}>
          <div className="mj-drawer-header">
            <h2 id="drawer-title">{esEdicion ? 'Editar ticket' : 'Nuevo ticket'}</h2>
            <button type="button" className="mj-button mj-button--icon" aria-label="Cerrar" onClick={onClose}>
              ✕
            </button>
          </div>

          {!autorizado && (
            <div className="mj-banner mj-banner--info" role="status">
              Solo podes ver este ticket: no sos el creador ni un responsable.
            </div>
          )}

          <label className="mj-field">
            <span>Titulo *</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              disabled={guardando || !autorizado}
              autoFocus
            />
          </label>

          <label className="mj-field">
            <span>Descripcion</span>
            <textarea
              value={descripcion ?? ''}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={guardando || !autorizado}
            />
          </label>

          <label className="mj-field">
            <span>Prioridad</span>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              disabled={guardando || !autorizado}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p === 'BAJA' ? 'Baja' : p === 'MEDIA' ? 'Media' : 'Alta'}
                </option>
              ))}
            </select>
          </label>

          {esEdicion && (
            <fieldset className="mj-field">
              <legend>Responsables</legend>
              {users.map((u) => (
                <label key={u.id} className="mj-checkbox-row">
                  <input
                    type="checkbox"
                    checked={responsableIds.has(u.id)}
                    disabled={guardando || !autorizado || !puedeAsignarA(u.id)}
                    onChange={() => toggleResponsable(u.id)}
                  />
                  <span>{u.email}</span>
                </label>
              ))}
              <p className="mj-text-secondary mj-hint">
                {currentUser.rol === 'ADMIN'
                  ? 'Como Administrador podes asignar a cualquier persona.'
                  : 'Como Usuario solo podes asignarte o desasignarte a vos mismo (pendiente de confirmar con el PO/PM, ver specs.md R-06).'}
              </p>
            </fieldset>
          )}

          {!esEdicion && (
            <p className="mj-text-secondary mj-hint">Guarda el ticket para poder asignar responsables.</p>
          )}

          {esEdicion && (
            <p className="mj-text-secondary mj-hint">
              Creado por {ticket!.creador.email} el {new Date(ticket!.creadoEn).toLocaleString()}. Ultima
              actualizacion: {new Date(ticket!.actualizadoEn).toLocaleString()}.
            </p>
          )}

          {error && (
            <div className="mj-banner mj-banner--error" role="alert">
              {error}
            </div>
          )}

          <div className="mj-drawer-footer">
            {esEdicion && autorizado && (
              <button type="button" className="mj-button mj-button--destructive" onClick={onArchivar} disabled={guardando}>
                Eliminar
              </button>
            )}
            {autorizado && (
              <button type="submit" className="mj-button mj-button--primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </form>
      </aside>
    </div>
  );
}
