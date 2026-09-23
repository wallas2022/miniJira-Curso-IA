# Mini Jira

Gestor de tareas/tickets simplificado (estilo Jira) para equipos pequeños: proyectos, tablero Kanban, tickets con asignación, prioridad, etiquetas y comentarios.

> La fuente única de verdad del alcance y las reglas de negocio es [`docs/specs.md`](docs/specs.md). Las convenciones de trabajo del repo están en [`CLAUDE.md`](CLAUDE.md). Este README describe el estado del código, no el alcance del producto — ante cualquier diferencia, `specs.md` decide.

## Estado actual

- **Specs:** [`docs/specs.md`](docs/specs.md) — v1.1 (aprobado).
- **Código:** esqueleto inicial ([`docs/03-arquitectura-esqueleto.md`](docs/03-arquitectura-esqueleto.md)) generado sobre el modelo de **specs v1.0**: sin lógica de negocio (todas las rutas devuelven `501`).
- ⚠️ **Pendiente de sincronización:** `backend/prisma/schema.prisma` todavía refleja decisiones de v1.0 (Ticket↔Proyecto muchos-a-muchos, un solo responsable, bloqueo optimista, 3 estados). Falta actualizarlo a v1.1 (Ticket↔Proyecto uno-a-muchos, múltiples responsables, *last-write-wins*, 4 estados con "Review") antes de implementar lógica sobre él.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + TypeScript + Express |
| Base de datos | SQLite |
| Acceso a datos | Prisma ORM |

## Estructura del repo

```
backend/    API REST (Express + Prisma)
frontend/   SPA (React + Vite)
docs/       Artefactos de cada fase (specs, arquitectura, ...)
materiales/ Insumos de entrada (transcripciones, etc.)
```

## Cómo levantar el proyecto

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run prisma:migrate   # crea dev.db y el cliente de Prisma
npm run dev               # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                # http://localhost:5173 (por defecto)
```

## Documentación

- [`docs/specs.md`](docs/specs.md) — requerimientos funcionales/no funcionales, matriz de permisos, decisiones del PO/PM.
- [`docs/03-arquitectura-esqueleto.md`](docs/03-arquitectura-esqueleto.md) — qué cubre el esqueleto técnico actual y qué falta.
- [`CLAUDE.md`](CLAUDE.md) — convenciones de trabajo del repo.

## Historial de cambios

Este README se actualiza al aprobarse cada push. Entradas más recientes arriba.

| Fecha | Push | Resumen |
|---|---|---|
| 2026-09-23 | Agregar README | Se documenta el estado actual del proyecto y se deja constancia de que el esquema Prisma aún no está sincronizado con specs.md v1.1. |
| 2026-09-23 | Commit inicial | Scaffold del proyecto: `specs.md` v1.0, esqueleto de arquitectura, backend (Express + Prisma) y frontend (React + Vite) sin lógica de negocio. |
