import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SkeletonBoard } from '../components/SkeletonLoader';
import { TicketCard } from '../components/TicketCard';
import { TicketDrawer } from '../components/TicketDrawer';
import { useAnnouncer } from '../context/AnnouncerContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Estado, Proyecto, Ticket, UsuarioResumen } from '../types';

// RF-10 (docs/prototype-spec.md C.4): orden de columnas placeholder, pendiente de
// confirmar con el PO/PM (specs.md, riesgo R-07).
const ESTADOS: { value: Estado; label: string }[] = [
  { value: 'POR_HACER', label: 'Por hacer' },
  { value: 'EN_PROGRESO', label: 'En progreso' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'TERMINADO', label: 'Terminado' },
];

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [users, setUsers] = useState<UsuarioResumen[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drawerTicket, setDrawerTicket] = useState<Ticket | null | undefined>(undefined);

  const cargar = () => {
    if (!id) return;
    setError(null);
    Promise.all([api.getProject(id), api.listTickets(id), api.listUsers()])
      .then(([p, t, u]) => {
        setProyecto(p);
        setTickets(t);
        setUsers(u);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el tablero.'));
  };

  useEffect(cargar, [id]);

  const onMove = async (ticket: Ticket, estado: Estado) => {
    const previo = tickets;
    const etiqueta = ESTADOS.find((e) => e.value === estado)?.label ?? estado;
    setTickets((prev) => prev?.map((t) => (t.id === ticket.id ? { ...t, estado } : t)) ?? prev);
    try {
      await api.moveTicket(ticket.id, estado);
      announce(`"${ticket.titulo}" movido a ${etiqueta}.`);
    } catch (err) {
      setTickets(previo);
      const mensaje = err instanceof Error ? err.message : 'No se pudo mover el ticket.';
      setError(mensaje);
      announce(mensaje, { assertive: true });
    }
  };

  if (error && !proyecto) {
    return (
      <main className="mj-page">
        <div className="mj-banner mj-banner--error" role="alert">
          {error}
        </div>
        <Link to="/proyectos" className="mj-button">
          Volver a proyectos
        </Link>
      </main>
    );
  }

  if (!proyecto || !tickets || !user) {
    return (
      <main className="mj-page">
        <p className="mj-sr-only">Cargando tablero...</p>
        <SkeletonBoard />
      </main>
    );
  }

  return (
    <main className="mj-page">
      <header className="mj-page-header">
        <div>
          <Link to="/proyectos" className="mj-breadcrumb">
            ← Proyectos
          </Link>
          <h1>{proyecto.nombre}</h1>
        </div>
        <button className="mj-button mj-button--primary" onClick={() => setDrawerTicket(null)}>
          Nuevo ticket
        </button>
      </header>

      {error && (
        <div className="mj-banner mj-banner--error" role="alert">
          {error}
        </div>
      )}

      <div className="mj-board">
        {ESTADOS.map((columna) => {
          const ticketsColumna = tickets.filter((t) => t.estado === columna.value);
          return (
            <section key={columna.value} className="mj-board-column" aria-label={columna.label}>
              <h2>
                {columna.label} <span className="mj-badge">{ticketsColumna.length}</span>
              </h2>
              {ticketsColumna.length === 0 && <p className="mj-text-secondary mj-hint">Sin tickets</p>}
              {ticketsColumna.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  currentUser={user}
                  estados={ESTADOS}
                  onOpen={() => setDrawerTicket(ticket)}
                  onMove={(estado) => onMove(ticket, estado)}
                />
              ))}
            </section>
          );
        })}
      </div>

      {drawerTicket !== undefined && (
        <TicketDrawer
          proyectoId={proyecto.id}
          ticket={drawerTicket}
          users={users}
          currentUser={user}
          onClose={() => setDrawerTicket(undefined)}
          onSaved={() => {
            setDrawerTicket(undefined);
            cargar();
          }}
        />
      )}
    </main>
  );
}
