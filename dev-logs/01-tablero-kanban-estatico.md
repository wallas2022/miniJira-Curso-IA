# 01 — Tablero Kanban estático

**Fecha:** 2026-09-30
**Contexto:** fase previa a drag-and-drop, "Mover a…", drawer de detalle y filtros. Construye la ruta `/proyectos/:id` que hasta ahora era un placeholder.

## Alcance construido

- 4 columnas fijas (Por hacer / En progreso / Review / Terminado, RF-10) con conteo de tickets por columna.
- `TicketCard` estático: título, badge de prioridad (texto + color, nunca solo color), avatares de responsables, badges de etiquetas.
- Estado vacío por columna ("Sin tickets") y tablero completo vacío (proyecto sin tickets).
- Datos mock nuevos (`apps/web/src/mocks/tickets.ts`) cubriendo los 4 estados, las 3 prioridades, 0/1/2 responsables, 0/2 etiquetas y un ticket archivado (excluido del tablero).

## Explícitamente diferido

- Drag-and-drop entre columnas (`@dnd-kit`).
- Control accesible `<select>` "Mover a…" (alternativa por teclado, WCAG §B.2).
- `TicketDrawer` de detalle al hacer clic en una tarjeta.
- Barra de filtros (prototype-spec §C.7) y botón "Nuevo ticket".
- Chip de fecha de vencimiento (`ticket.fecha`) en la tarjeta.

## Decisiones y justificación

- **Etiquetas reutilizan `Badge variant="default"`**: la entrada actual de `Badge` en `COMPONENTS.md` ya contempla "etiquetas cortas"; crear un átomo nuevo hubiera duplicado uno existente.
- **Columnas con tokens neutros** (`--color-bg-surface`, `--color-border`, `--radius-md`): no existen tokens de color por estado (`design.md` los marca como gap nunca implementado) y no se inventaron colores hardcodeados.
- **Tickets archivados excluidos por defecto** en `BoardPage` (no es parte de la fase de filtros; es corrección de modelo base).
- **`BoardColumn` como archivo independiente** (no fusionado en `BoardPage`), siguiendo el patrón `ProjectCard`/`ProjectGrid` ya establecido en el repo.

## Archivos nuevos/modificados

- `apps/web/src/types.ts` — agrega `Estado`, `Prioridad`, `Etiqueta`, `Responsable`, `Ticket`.
- `apps/web/src/mocks/tickets.ts` — `mockTickets`.
- `apps/web/src/features/tickets/constants.ts`, `TicketCard.tsx`, `BoardColumn.tsx`, `KanbanBoard.tsx`, `BoardPage.tsx`.
- `apps/web/src/App.tsx` — reemplaza el placeholder del tablero por `BoardPage`.
- `COMPONENTS.md` — filas nuevas para `TicketCard`, `BoardColumn`, `KanbanBoard`.

## Preguntas abiertas para fases futuras

- ¿Se necesitan tokens de color por estado (`--mj-color-status-*`) o los neutros son suficientes a largo plazo?
- ¿Cómo se muestra overflow de avatares cuando hay muchos responsables?
- ¿Dónde vive el chip de fecha de vencimiento y cómo se distingue vencido/próximo a vencer?

## Cómo verificar

1. `pnpm --filter web dev`.
2. Navegar a `/proyectos/proy-1`: 4 columnas, tarjetas variadas, columna "Review" vacía.
3. Navegar a `/proyectos/proy-3`: tablero completamente vacío.
4. Confirmar que el ticket `tk-8` (archivado) no aparece en ninguna columna.
