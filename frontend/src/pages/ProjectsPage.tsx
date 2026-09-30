import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SkeletonProjectGrid } from '../components/SkeletonLoader';
import { useAnnouncer } from '../context/AnnouncerContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { Proyecto } from '../types';

// RF-04/RF-17: lista de proyectos visibles para el usuario actual (docs/prototype-spec.md C.3).
export function ProjectsPage() {
  const { user, logout } = useAuth();
  const { announce } = useAnnouncer();
  const [proyectos, setProyectos] = useState<Proyecto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const cargar = () => {
    setError(null);
    api
      .listProjects()
      .then(setProyectos)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los proyectos.'));
  };

  useEffect(cargar, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setFormError('El nombre del proyecto es obligatorio.');
      return;
    }
    setGuardando(true);
    setFormError(null);
    try {
      await api.createProject({ nombre, descripcion });
      setNombre('');
      setDescripcion('');
      setShowForm(false);
      announce(`Proyecto "${nombre}" creado.`);
      cargar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'No se pudo crear el proyecto.';
      setFormError(mensaje);
      announce(mensaje, { assertive: true });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="mj-page">
      <header className="mj-page-header">
        <div>
          <h1>Proyectos</h1>
          <p className="mj-text-secondary">
            Conectado como {user?.email} ({user?.rol === 'ADMIN' ? 'Administrador' : 'Usuario'})
          </p>
        </div>
        <div className="mj-page-header-actions">
          <button className="mj-button mj-button--primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancelar' : 'Nuevo proyecto'}
          </button>
          <button className="mj-button" onClick={logout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      {showForm && (
        <form className="mj-card mj-inline-form" onSubmit={onSubmit} aria-label="Crear proyecto">
          <label className="mj-field">
            <span>Nombre *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={guardando} autoFocus />
          </label>
          <label className="mj-field">
            <span>Descripcion</span>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} disabled={guardando} />
          </label>
          {formError && (
            <div className="mj-banner mj-banner--error" role="alert">
              {formError}
            </div>
          )}
          <button type="submit" className="mj-button mj-button--primary" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Crear proyecto'}
          </button>
        </form>
      )}

      {error && (
        <div className="mj-banner mj-banner--error" role="alert">
          {error}
        </div>
      )}

      {proyectos === null && !error && <SkeletonProjectGrid />}

      {proyectos?.length === 0 && (
        <div className="mj-empty-state">
          <p>Todavia no tenes proyectos.</p>
          <button className="mj-button mj-button--primary" onClick={() => setShowForm(true)}>
            Crea el primero
          </button>
        </div>
      )}

      <div className="mj-project-grid">
        {proyectos?.map((p) => (
          <Link key={p.id} to={`/proyectos/${p.id}`} className="mj-card mj-project-card">
            <h2>{p.nombre}</h2>
            {p.descripcion && <p className="mj-text-secondary">{p.descripcion}</p>}
            <span className="mj-badge">{p._count?.tickets ?? 0} tickets</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
