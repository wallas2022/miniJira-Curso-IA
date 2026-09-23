# Mini Jira — CLAUDE.md

## Objetivo
Mini Jira es un gestor de tareas/tickets simplificado (estilo Jira) para equipos pequeños: creación de proyectos, tableros con columnas de estado (To Do / In Progress / Done), tarjetas con asignación, prioridad y comentarios básicos. El foco es un producto simple, usable y correcto antes que feature-rich.

## Stack definitivo
Confirmado en `docs/specs.md` (Decisión PO/PM, P13):
- **Frontend:** React + TypeScript, Vite
- **Backend:** Node.js + TypeScript (API REST)
- **Base de datos:** SQLite
- **Acceso a datos:** ORM Prisma (migraciones y tipos generados)
- **Estilos:** CSS con Design Tokens propios (sin framework de UI pesado salvo que specs.md lo indique)

Cualquier cambio de stack se decide primero en `specs.md`, luego se refleja aquí.

## Convenciones de trabajo
- **Cada fase produce un artefacto en `docs/` antes de codificar.** No se escribe código de una fase sin su documento aprobado (ej: `docs/01-discovery.md`, `docs/02-specs.md`, `docs/03-arquitectura.md`, `docs/04-ui.md`, etc.).
- **`docs/specs.md` es la fuente única de verdad (single source of truth).** Ante cualquier ambigüedad o conflicto entre código, comentarios o conversación, `specs.md` decide. Si el código diverge de `specs.md`, se corrige el código o se actualiza `specs.md` explícitamente — nunca se dejan divergir en silencio.
- Cambios de alcance o requisitos se reflejan primero en `specs.md`, luego en el código.
- Nombrar artefactos de forma secuencial y descriptiva dentro de `docs/` para mantener trazabilidad del proceso.

## Estándares de UI
- **Accesibilidad:** cumplir WCAG 2.1 nivel AA como mínimo (contraste, navegación por teclado, roles/aria, foco visible, textos alternativos).
- **Usabilidad:** flujos cortos, feedback claro ante acciones (loading, error, éxito), estados vacíos y de error siempre contemplados.
- **Design Tokens:** toda decisión visual (color, espaciado, tipografía, radios, sombras) se define como token reutilizable, no como valores sueltos hardcodeados en componentes.

## Fuera de alcance
- Autenticación multi-tenant/SSO empresarial, permisos granulares por rol avanzados.
- Integraciones con terceros (Slack, GitHub, email, webhooks).
- Reportes/analytics avanzados, dashboards de métricas.
- Aplicaciones móviles nativas.
- Tiempo real (websockets/colaboración en vivo) salvo que se agregue explícitamente a `specs.md`.
- Migraciones de datos desde otras herramientas (Jira, Trello, etc.).

Notificaciones por email, modo oscuro y dashboard con gráficos quedaron diferidos a Fase 2 en `docs/specs.md` (no forman parte del MVP, pero no son un "fuera de alcance" permanente).
