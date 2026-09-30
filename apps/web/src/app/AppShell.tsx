import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface AppShellProps {
  children: ReactNode;
}

// TODO: cuando exista AuthProvider, la barra muestra el usuario actual
// (Avatar + nombre) y un botón de cerrar sesión (frontend-specs.md §5.1).
// Los links "Usuarios"/"Reportes" (solo Administrador) se agregan cuando
// existan esas páginas — no se dejan como links muertos.
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface px-(--mj-space-5) py-(--mj-space-3)">
        <nav className="mx-auto flex max-w-[1100px] items-center gap-(--mj-space-5)">
          <span className="text-h2 font-semibold text-primary">Mini Jira</span>
          <Link to="/proyectos" className="text-body text-link">
            Proyectos
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
