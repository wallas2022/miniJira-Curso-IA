# COMPONENTS.md — Inventario de componentes reutilizables (Mini Jira)

Se agrega una fila por cada componente reutilizable terminado (átomos, moléculas,
organismos y shells). No documenta páginas completas ni componentes de un solo uso.

**Antes de crear un componente nuevo, revisar esta tabla — nunca duplicar uno que ya exista.**

| Componente | Ruta | Props principales | Cuándo usarlo | Tokens usados |
|---|---|---|---|---|
| `Button` | `apps/web/src/components/Button.tsx` | `variant?: default\|primary\|destructive\|icon` + atributos nativos de `<button>` | Cualquier acción clickeable con texto visible (enviar formulario, confirmar, cancelar, eliminar). | `--color-bg-surface`, `--color-action-primary`, `--color-error-bg`, `--color-danger`, `--color-text-*`, `--radius-sm`, `--duration-fast`, `--ease-standard` |
| `IconButton` | `apps/web/src/components/IconButton.tsx` | `icon: ReactNode`, `aria-label: string` (obligatorio) + resto de `ButtonProps` | Acción clickeable sin texto visible (cerrar, editar inline). Siempre requiere `aria-label` descriptivo. | Hereda de `Button` variante `icon` |
| `Avatar` | `apps/web/src/components/Avatar.tsx` | `nombre: string` | Representar a un usuario (creador, responsable, autor de comentario) de forma compacta. | `--color-action-primary`, `--color-text-on-primary`, `--text-caption`, `font-semibold` |
| `Badge` | `apps/web/src/components/Badge.tsx` | `variant?: default\|prioridad-baja\|prioridad-media\|prioridad-alta`, `children` | Conteos o etiquetas cortas (tickets abiertos, prioridad de un ticket). Color nunca es el único portador de significado. | `--color-border`, `--color-priority-*`, `--radius-pill`, `--text-caption` |
| `AppShell` | `apps/web/src/app/AppShell.tsx` | `children: ReactNode` | Layout compartido por toda ruta autenticada (barra superior + contenido). No usar en `/login`. | `--color-canvas`, `--color-surface`, `--color-border`, `--text-h2`, `font-semibold`, `--color-link` |
| `ProjectCard` | `apps/web/src/features/projects/ProjectCard.tsx` | `proyecto: Proyecto` | Mostrar un proyecto dentro de una grilla/listado, enlazado a su tablero. | `--color-surface`, `--color-border`, `--radius-md`, `--shadow-card`, `--text-h2`, `--color-secondary`; compone `Avatar` + `Badge` |
| `ProjectGrid` | `apps/web/src/features/projects/ProjectGrid.tsx` | `proyectos: Proyecto[]` | Listar todos los proyectos visibles para el usuario actual (incluye estado vacío). | Grid `auto-fill minmax(240px,1fr)`, `--color-secondary` (estado vacío) |
| `TicketCard` | `apps/web/src/features/tickets/TicketCard.tsx` | `ticket: Ticket` | Mostrar un ticket individual (título, prioridad, responsables, etiquetas) dentro de una columna del tablero. | `--color-bg-surface`, `--color-border`, `--radius-md`, `--shadow-card`, `--text-body`, `--color-priority-*`; compone `Badge` + `Avatar` |
| `BoardColumn` | `apps/web/src/features/tickets/BoardColumn.tsx` | `estado: Estado`, `titulo: string`, `tickets: Ticket[]` | Agrupar y listar los tickets de un estado fijo del tablero (incluye estado vacío "Sin tickets"). | `--color-bg-surface`, `--color-border`, `--radius-md`, `--text-h3`, `--color-secondary`; compone `Badge` + `TicketCard` |
| `KanbanBoard` | `apps/web/src/features/tickets/KanbanBoard.tsx` | `tickets: Ticket[]` | Orquestar las 4 columnas fijas del tablero de un proyecto, agrupando tickets por `estado`. | Flex `overflow-x-auto`, `gap: var(--mj-space-4)` (equivalente a `.mj-board`); compone `BoardColumn` |
