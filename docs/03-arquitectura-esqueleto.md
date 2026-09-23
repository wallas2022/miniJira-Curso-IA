# Mini Jira — Esqueleto Técnico (artefacto de arquitectura inicial)

Cumple la convención de `CLAUDE.md`: artefacto en `docs/` antes de codificar.

## Alcance de este esqueleto
Estructura de proyecto (carpetas, configuración, modelo de datos, stubs de rutas). **No se implementó lógica de negocio** (autenticación, permisos por rol, queries reales) — eso queda a cargo del usuario, según lo acordado.

## Decisiones reflejadas (`docs/specs.md` v1.0, APROBADO)
- Stack definitivo: React + TypeScript + Vite (frontend), Node.js + TypeScript + Express (backend), **SQLite + Prisma** (Decisión PO/PM, P13). Reflejado también en `CLAUDE.md`.
- Modelo de datos (`backend/prisma/schema.prisma`) implementa el modelo aprobado en `specs.md` § 5:
  - `Ticket` – `Project`: muchos-a-muchos vía `TicketProject` (RF-03/P2).
  - `Ticket` – `User`: un creador y **cero o un** responsable (RF-05/P8).
  - Etiquetas libres vía `Tag`/`TicketTag` (RF-09b).
  - Campo `version` en `Ticket` para bloqueo optimista (RF-16/P5).
  - Campo `archivado` para archivo lógico, nunca borrado físico (RF-02/P6).
  - Enums `EstadoTicket` (3 estados fijos, RF-10/P7) y `Prioridad` (RF-09a).
- Rutas de la API (`backend/src/routes/*`) cubren los endpoints de RF-01 a RF-16 y RF-13 (reporte simple), todas devolviendo `501` con referencia al RF correspondiente — la lógica de permisos (matriz § 5.1) y las queries con Prisma son el siguiente paso, no parte de este esqueleto.
- Notificaciones por email (RF-12), dashboard con gráficos y modo oscuro (RF-15) quedan **fuera de este esqueleto**: son Fase 2 según `specs.md`.

## Cómo continuar
1. `cd backend && npm install && npm run prisma:migrate` para generar `dev.db` y el cliente de Prisma.
2. Implementar la lógica de cada ruta usando `prisma` (`backend/src/lib/prisma.ts`) y la matriz de permisos de `specs.md` § 5.1.
3. `cd frontend && npm install && npm run dev` para el shell de React.
4. Cualquier cambio de alcance se actualiza primero en `docs/specs.md`, luego en el código.
