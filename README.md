# Mini Jira

Gestor de tareas/tickets simplificado (estilo Jira) para equipos pequeños: proyectos, tablero Kanban, tickets con asignación, prioridad, etiquetas y comentarios.

> La fuente única de verdad del alcance y las reglas de negocio es [`docs/specs.md`](docs/specs.md). Las convenciones de trabajo del repo están en [`CLAUDE.md`](CLAUDE.md). Este README describe el estado del código, no el alcance del producto — ante cualquier diferencia, `specs.md` decide.

## Estado actual

- **Specs:** [`docs/specs.md`](docs/specs.md) — v1.1 (aprobado). Fuente única de verdad del alcance y las reglas de negocio.
- **Specs de frontend:** [`docs/frontend-specs.md`](docs/frontend-specs.md) (decisión P14) fija el stack definitivo del frontend (monorepo pnpm, React 19, Tailwind v4, TanStack Query, React Hook Form + Zod, `@dnd-kit`) y resuelve las ambigüedades que `specs.md` había dejado abiertas.
- **Frontend:** `apps/web/` — vista de Proyectos y tablero Kanban de un proyecto construidos sobre datos mock (sin conexión a una API real todavía). El estado del tablero se maneja con un store de Zustand con drag-and-drop (`@dnd-kit`) y actualización optimista con rollback; es una decisión **temporal** documentada en `frontend-specs.md` §5.4, a reemplazar por TanStack Query cuando exista API real.
- **Backend:** esqueleto Express + Prisma ([`docs/03-arquitectura-esqueleto.md`](docs/03-arquitectura-esqueleto.md)), todas las rutas devuelven `501` (sin lógica de negocio todavía). `backend/prisma/schema.prisma` ya está sincronizado con `specs.md` v1.1 (Ticket↔Proyecto uno-a-muchos, múltiples responsables, 4 estados incluyendo "Review").

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4, en `apps/web/` (monorepo **pnpm workspaces**, con `packages/shared/` para tipos compartidos) |
| Backend | Node.js + TypeScript + Express (`backend/`, fuera del monorepo pnpm) |
| Base de datos | SQLite |
| Acceso a datos | Prisma ORM |

Detalle completo y justificación de cada decisión de stack en [`docs/frontend-specs.md`](docs/frontend-specs.md) §0 y §4.

## Estructura del repo

```
apps/web/         Frontend (React 19 + Vite + Tailwind v4)
packages/shared/  Tipos compartidos del monorepo pnpm (scaffold, hoy solo consumido por apps/web)
backend/          API REST (Express + Prisma)
docs/             Artefactos de cada fase (specs, frontend-specs, prototype-spec, arquitectura, backlog, test plan)
architecture/     Diagramas C4 y de entidad-relación
design.md         Sistema de diseño (design tokens, componentes)
COMPONENTS.md     Inventario de componentes reutilizables del frontend
materiales/       Insumos de entrada (transcripciones, etc.)
```

## Cómo levantar el proyecto

### Frontend (monorepo pnpm)
```bash
pnpm install        # en la raíz del repo
pnpm dev            # equivale a "pnpm --filter web dev" → http://localhost:5173
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate   # crea dev.db y el cliente de Prisma
npm run dev               # http://localhost:4000
```

## Documentación

- [`docs/specs.md`](docs/specs.md) — requerimientos funcionales/no funcionales, matriz de permisos, decisiones del PO/PM.
- [`docs/frontend-specs.md`](docs/frontend-specs.md) — stack definitivo del frontend y resolución de ambigüedades (P14).
- [`docs/prototype-spec.md`](docs/prototype-spec.md) — design tokens y estándares WCAG AA del prototipo.
- [`docs/03-arquitectura-esqueleto.md`](docs/03-arquitectura-esqueleto.md) — qué cubre el esqueleto técnico del backend y qué falta.
- [`design.md`](design.md) — sistema de diseño consolidado.
- [`COMPONENTS.md`](COMPONENTS.md) — inventario de componentes reutilizables del frontend (consultar antes de crear uno nuevo).
- [`CLAUDE.md`](CLAUDE.md) — convenciones de trabajo del repo.

## Historial de cambios

Este README se actualiza al aprobarse cada push. Entradas más recientes arriba.

| Fecha | Push | Resumen |
|---|---|---|
| 2026-09-30 | Tablero: store de Zustand + drag-and-drop | `board.store.ts` (`useTicketsByStatus`/`moveTicket`) conecta `TicketCard`/`BoardColumn`/`KanbanBoard` sin prop-drilling; arrastrar una tarjeta entre columnas (`@dnd-kit`) aplica el cambio de forma optimista y revierte con un banner de error si la llamada simulada falla. Cada tarjeta mantiene el `<select>` "Mover a…" accesible (WCAG AA). Divergencia temporal con TanStack Query documentada en `frontend-specs.md` §5.4. |
| 2026-09-30 | Tablero Kanban estático | Se construyen `TicketCard`, `BoardColumn` y `KanbanBoard` como piezas presentacionales (sin store todavía), documentadas en `COMPONENTS.md`. |
| 2026-09-30 | Regla de `COMPONENTS.md` en `CLAUDE.md` | Se deja constancia de que todo componente reutilizable nuevo debe agregarse al inventario antes de darse por terminado. |
| 2026-09-30 | Vista de Proyectos | Design tokens, átomos compartidos (`Button`, `IconButton`, `Avatar`, `Badge`), `AppShell` y `ProjectCard`/`ProjectGrid`. |
| 2026-09-30 | Migración a monorepo pnpm | El frontend pasa de `frontend/` a `apps/web/` dentro de un monorepo **pnpm workspaces**, con `packages/shared/` para tipos compartidos a futuro (decisión P14 en `specs.md`). |
| 2026-09-30 | `design.md` | Sistema de diseño consolidado a partir de `tokens.css` y las specs, portando los design tokens existentes. |
| 2026-09-30 | `frontend-specs.md` | Se resuelven todas las ambigüedades abiertas del frontend y se fija el stack definitivo (P14): React 19, Tailwind v4, TanStack Query, React Hook Form + Zod, `@dnd-kit`. |
| 2026-09-30 | Estilos alineados a `prototype-spec.md` | El frontend adopta los design tokens y estándares WCAG AA definidos en el prototipo. |
| 2026-09-30 | Primer prototipo funcional | Auth, proyectos y tablero Kanban sobre el modelo de datos v1.1; de paso se sincroniza `backend/prisma/schema.prisma` con `specs.md` v1.1 (Ticket↔Proyecto uno-a-muchos, múltiples responsables, 4 estados incl. "Review"), resolviendo la advertencia de sincronización que arrastraba este README. |
| 2026-09-30 | `prototype-spec.md` | Design tokens y estándares WCAG AA, y especificación de las features del MVP para el prototipo. |
| 2026-09-30 | Arquitectura, backlog y plan de pruebas | Diagramas C4 y entidad-relación, backlog de historias y plan de pruebas. |
| 2026-09-23 | Agregar README | Se documenta el estado actual del proyecto y se deja constancia de que el esquema Prisma aún no está sincronizado con specs.md v1.1. |
| 2026-09-23 | Commit inicial | Scaffold del proyecto: `specs.md` v1.0, esqueleto de arquitectura, backend (Express + Prisma) y frontend (React + Vite) sin lógica de negocio. |
