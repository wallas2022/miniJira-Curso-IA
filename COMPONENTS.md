# COMPONENTS.md — Inventario de componentes reutilizables (Mini Jira)

Se agrega una fila por cada componente reutilizable terminado (átomos, moléculas,
organismos y shells). No documenta páginas completas ni componentes de un solo uso.

| Componente | Ruta | Props | Tokens usados |
|---|---|---|---|
| `Button` | `apps/web/src/components/Button.tsx` | `variant?: default\|primary\|destructive\|icon` + atributos nativos de `<button>` | `--color-bg-surface`, `--color-action-primary`, `--color-error-bg`, `--color-danger`, `--color-text-*`, `--radius-sm`, `--duration-fast`, `--ease-standard` |
| `IconButton` | `apps/web/src/components/IconButton.tsx` | `icon: ReactNode`, `aria-label: string` (obligatorio) + resto de `ButtonProps` | Hereda de `Button` variante `icon` |
| `Avatar` | `apps/web/src/components/Avatar.tsx` | `nombre: string` | `--color-action-primary`, `--color-text-on-primary`, `--text-caption`, `font-semibold` |
| `Badge` | `apps/web/src/components/Badge.tsx` | `variant?: default\|prioridad-baja\|prioridad-media\|prioridad-alta`, `children` | `--color-border`, `--color-priority-*`, `--radius-pill`, `--text-caption` |
| `AppShell` | `apps/web/src/app/AppShell.tsx` | `children: ReactNode` | `--color-canvas`, `--color-surface`, `--color-border`, `--text-h2`, `font-semibold`, `--color-link` |
| `ProjectCard` | `apps/web/src/features/projects/ProjectCard.tsx` | `proyecto: Proyecto` | `--color-surface`, `--color-border`, `--radius-md`, `--shadow-card`, `--text-h2`, `--color-secondary`; compone `Avatar` + `Badge` |
| `ProjectGrid` | `apps/web/src/features/projects/ProjectGrid.tsx` | `proyectos: Proyecto[]` | Grid `auto-fill minmax(240px,1fr)`, `--color-secondary` (estado vacío) |
