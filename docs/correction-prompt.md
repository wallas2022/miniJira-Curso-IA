# correction-prompt.md — Prompt de corrección de seguridad (api/)

> Autocontenido. Pégalo en una sesión nueva de Claude Code abierta en la raíz del repo `MiniJira`. Deriva de `docs/security-report.md` (auditoría 2026-10-14).

---

## Contexto

Mini Jira es un monorepo. La API está en `api/` (Next.js, route handlers en `api/src/app/api/**/route.ts`, acceso a datos en `api/src/lib/data.ts`, validación Zod en `api/src/lib/schemas.ts`, helpers en `api/src/lib/api.ts`, cliente Supabase con `service_role` en `api/src/lib/supabase.ts`, config en `api/next.config.ts`). El contrato de API es `docs/api-contract.md` y `docs/specs.md` es la fuente única de verdad: si un fix diverge del contrato, **actualiza el contrato explícitamente**, no dejes que diverjan. Estilo: comentarios y mensajes de error en español, errores RFC 7807 vía `ApiError`/`handler`, envelope `{ data, error }`.

Hoy la API está en "fase sin autenticación": ningún endpoint autentica, la identidad (`creadorId`, `autorId`, `actorId`, `userId`) llega del cliente y todo usa `service_role`.

## Reglas de trabajo

1. Aplica **un fix a la vez**, en el orden de abajo (de más a menos severo).
2. **Después de cada fix, DETENTE.** Resume qué cambiaste (archivos y líneas), cómo lo verificaste y qué queda pendiente, y **espera mi confirmación explícita** antes del siguiente.
3. Verifica cada fix con `npm run lint` y `npx tsc --noEmit` en `api/` (y, cuando aplique, con una petición real o un script). Informa del resultado tal cual, incluidos los fallos.
4. No hagas commit ni push sin que yo lo pida. Si cambias endpoints, actualiza `docs/api-contract.md` y `api/openapi.yaml` (se genera con `api/scripts/generate-openapi.ts`).
5. No toques `apps/web/` salvo que un fix lo requiera; en ese caso avísame antes.
6. Antes de empezar, lee `docs/security-report.md` y cada archivo que vayas a editar.

---

## Fix 1 — F-01 / F-03 (Crítica): autenticación real con token firmado

**Problema:** ningún endpoint autentica (`api/src/lib/supabase.ts:6-7,18`; `auth/me/route.ts:6-9`), y el login devuelve `'anonymous-dev-token'` (`auth/login/route.ts:12`).

**Qué hacer:**
- Decide conmigo el mecanismo. Por defecto: JWT firmado (HS256, librería `jose`) con `sub`=userId, `rol`, `exp` corto (p. ej. 8 h). Secreto en `JWT_SECRET` (≥32 bytes), documentado en `api/.env.example` sin valor real y validado al arrancar.
- `login/route.ts`: emite ese JWT en lugar del marcador estático.
- Crea `requireAuth(req)` en `api/src/lib/auth.ts`: lee `Authorization: Bearer`, verifica firma y expiración, **vuelve a cargar el usuario de la BD** y rechaza si no existe o `activo = false`. Devuelve `{ id, rol }`. Falla con `unauthorized()` (401) genérico.
- Aplícalo a **todas** las rutas salvo `POST /api/auth/login`. Decide con una excepción explícita para `/api/docs` y `/api/openapi.yaml` (ver Fix 10).
- `GET /api/auth/me`: elimina el parámetro `?userId=` (y `MeQuerySchema`); devuelve el usuario del token. Quita la regresión de `getUsuario` sobre inactivos (también en F-05).
- `logout`: define el comportamiento real (p. ej. lista de revocación por `jti` o tokens cortos + documentar que es stateless). Debe quedar documentado en el contrato.
- Actualiza `docs/api-contract.md` §2/§4 y el cliente de `apps/web/src/lib/api.ts` solo si hace falta (consúltame).

**Verificación:** una petición sin token, con token manipulado y con token expirado debe dar 401 en todos los endpoints; con token válido debe funcionar. Pega los resultados.

**→ DETENTE y espera confirmación.**

---

## Fix 2 — F-02 (Crítica): la identidad del actor sale del token

**Problema:** `creadorId`, `autorId`, `actorId` y `userId` los dicta el cliente (`schemas.ts:202,221,226,239`; `data.ts:327,363,392,398,513`).

**Qué hacer:**
- Elimina `creadorId` de `CreateProjectBodySchema` y `CreateTicketBodySchema`, `autorId` de `CreateComentarioBodySchema` y `ArchiveQuerySchema.actorId`.
- Pasa el `id` del usuario autenticado desde el route handler a `createProject`, `createTicket`, `createComment` y `archiveTicket`. Hazlo **obligatorio** (hoy `actorId` es opcional en `data.ts:390`) para que `archivado_por_id` siempre quede registrado.
- Elimina las llamadas redundantes a `assertUserExists` sobre el actor (ya lo garantiza `requireAuth`).
- `AddResponsableBodySchema.userId` se mantiene (es el *destinatario*), pero su autorización va en el Fix 3.
- Sincroniza `api/src/lib/openapi/spec.ts`, `api/openapi.yaml` y `docs/api-contract.md`.

**Verificación:** crear proyecto/ticket/comentario y archivar sin enviar ningún id de actor; comprobar en la respuesta que `creadorId`/`autorId`/`archivadoPorId` son los del token. Un body con `creadorId` ajeno debe ignorarse o rechazarse.

**→ DETENTE y espera confirmación.**

---

## Fix 3 — F-04 (Alta): controles de rol y propiedad según el contrato

**Problema:** las reglas de `docs/api-contract.md` no están implementadas (ver tabla de F-04 en el reporte).

**Qué hacer:** implementa en la capa de datos (no solo en el route) estas reglas, con 403 vía un nuevo `forbidden()` en `api/src/lib/api.ts` (kind `'forbidden'`, title `Forbidden`):
- `POST …/restore` → solo `ADMIN` (`api-contract.md:178`).
- `GET /reports/closed-tickets` → solo `ADMIN` (`:214`).
- `PATCH /projects/:id` → solo el creador (`:160`).
- `PATCH …/tickets/:id` → creador, responsable o `ADMIN` (`:142`).
- `DELETE …/tickets/:id` → `USUARIO` solo si es el creador; `ADMIN` cualquiera (`:173`).
- `POST …/responsables` → `USUARIO` solo con `userId` = su propio id; `ADMIN` cualquiera (`:183`).
Añade `403` a las respuestas en OpenAPI.

**Verificación:** matriz de pruebas rol × endpoint (USUARIO propio / ajeno / ADMIN). Pega la tabla de resultados.

**→ DETENTE y espera confirmación.**

---

## Fix 4 — F-05 (Alta): alcance por visibilidad y `/auth/me`

**Problema:** `listProjects` (`data.ts:124-163`), `listTickets` (`:172-185`), `listAllTickets` (`:441-473`) y los endpoints por proyecto no acotan por usuario. Contrato `api-contract.md:127,201`.

**Qué hacer:**
- Regla: `ADMIN` ve todo; `USUARIO` ve proyectos que creó o donde es responsable de algún ticket (`api-contract.md:127`).
- Crea un helper único (p. ej. `visibleProjectIds(user)`) y úsalo en `listProjects`, `listAllTickets`, `listTickets`, y en toda ruta con `:projectId` (ticket, comments, responsables, restore, patch). Si el proyecto no es visible, responde **404** (no 403) para no filtrar existencia (`api-contract.md:52`) — salvo donde el contrato pida 403 (`:132`); si hay conflicto, actualiza el contrato.
- Evita construir el alcance con strings de filtro PostgREST (ver Fix 6); usa `.in('proyecto_id', ids)`.

**Verificación:** con dos usuarios no admin y proyectos distintos, comprobar que ninguno ve ni modifica el proyecto del otro; `ADMIN` ve todo.

**→ DETENTE y espera confirmación.**

---

## Fix 5 — F-06 (Alta): rate limiting en login

**Qué hacer:** limita `POST /api/auth/login` por IP **y** por email normalizado (p. ej. 5 intentos / 15 min, con backoff). Para un despliegue serverless, usa un almacén compartido (Upstash/Redis o tabla en Supabase); no un `Map` en memoria. Responde `429` con `Retry-After` en formato Problem Details. Decide conmigo la tecnología antes de implementar. Añade `429` al OpenAPI.

**Verificación:** 6 intentos fallidos seguidos → el 6.º da 429; un login correcto tras la ventana funciona.

**→ DETENTE y espera confirmación.**

---

## Fix 6 — F-08 (Media): cursor sin interpolación de strings

**Problema:** `data.ts:26-31` valida `v[0]` solo con `Date.parse`, que acepta `Jan 1 2026 "` (probado), y `:52` lo interpola en `.or()`.

**Qué hacer:**
- En `decodeCursor`, exige que `v[0]` sea ISO 8601 estricto: `new Date(v[0]).toISOString() === v[0]` o regex `^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:\d{2})$`. Valida también `v[1]` con una lista blanca (`^[A-Za-z0-9_-]+$`) en lugar de la lista negra actual.
- Reemplaza la interpolación por valores ya validados y normalizados (usa `new Date(v[0]).toISOString()` en el filtro).
- Añade pruebas: cursor con `"`, `(`, `)`, `,` en cualquier campo → 400; cursor legítimo de `encodeCursor` → funciona.

**→ DETENTE y espera confirmación.**

---

## Fix 7 — F-07 (Media): login sin comodines LIKE

**Problema:** `data.ts:107` usa `.ilike('email', email.trim())`.

**Qué hacer:** compara de forma literal. Opciones: normaliza el email a minúsculas al guardarlo y al buscar, y usa `.eq('email', email.trim().toLowerCase())` (revisa antes el schema/seed para no romper cuentas existentes); o escapa `%`, `_` y `\` antes de `ilike`. Valida el formato de email en `LoginBodySchema` (`schemas.ts:111`, `z.email()`). Un email con `%` o `_` debe dar 401 genérico, nunca 500.

**→ DETENTE y espera confirmación.**

---

## Fix 8 — F-09 / F-13 (Media/Baja): cabeceras de seguridad y CORS

**Qué hacer en `api/next.config.ts`:**
- Añade a `headers()`: `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (o `frame-ancestors 'none'` en CSP), `Referrer-Policy: no-referrer`, y una CSP mínima para las respuestas JSON. Define `poweredByHeader: false`.
- CORS: elimina el fallback a `localhost` en producción (si `NODE_ENV === 'production'` y falta `CORS_ORIGIN`, falla al arrancar). Mantén un único origen salvo que decidamos una lista y un middleware.
- Ajusta la CSP de `/api/docs` según el Fix 9 (si sigue cargando de CDN necesita una excepción).

**Verificación:** `curl -I` sobre un endpoint y sobre `/api/docs`; pega las cabeceras.

**→ DETENTE y espera confirmación.**

---

## Fix 9 — F-10 (Media): documentación de la API

**Qué hacer:**
- Decide conmigo: (a) deshabilitar `/api/docs` y `/api/openapi.yaml` en producción (`NODE_ENV`), o (b) protegerlos con autenticación de ADMIN.
- Si sigue habiendo Swagger UI: autoalójalo (dependencia `swagger-ui-dist` con versión fija) o añade `integrity` + `crossorigin` con versión exacta (no `@5`) en `api/src/app/api/docs/route.ts:8,12`. Desactiva `tryItOutEnabled` en producción.
- Sustituye los `example` de `schemas.ts:111-112` por valores claramente ficticios (`usuario@example.com` / `<contraseña>`), y comprueba (**A VERIFICAR #2** del reporte) si `MiniJira2026!` es una contraseña real; si lo es, cámbiala en Supabase.

**→ DETENTE y espera confirmación.**

---

## Fix 10 — F-11 (Media): logging y auditoría

**Qué hacer:**
- En `api/src/lib/api.ts`, genera un `requestId` por petición (cabecera `x-request-id` en la respuesta) y registra en formato JSON: método, ruta, status, duración, `userId` (si hay), `requestId`.
- Registra con nivel `warn` los 401/403/429 (sin loguear contraseñas ni tokens) y los intentos de login fallidos (email normalizado + IP).
- Registra eventos de auditoría de acciones sensibles: archivar, restaurar, asignar responsable, reportes, cambios de proyecto. Valora una tabla `audit_log` en Supabase (migración aparte, coméntalo conmigo antes: el contrato descartó `audit-log` en `api-contract.md` §5, así que primero se actualiza `specs.md`).
- Documenta a dónde van los logs y quién los revisa.

**→ DETENTE y espera confirmación.**

---

## Fix 11 — F-12 (Baja): límites de longitud en Zod

**Qué hacer:** en `api/src/lib/schemas.ts` añade `.max()` a `nombre` (p. ej. 120), `titulo` (200), `descripcion` (5000), `contenido` (5000), y `.max(20)` en `etiquetas` y cada id (`:150,160,200,201,209,216,220,238`). Mensajes de error en español. Regenera el OpenAPI.

**→ DETENTE y espera confirmación.**

---

## Pendiente de verificación (no son fixes; confírmalos tú y repórtame)

- Estado de RLS en todas las tablas de Supabase y que la `anon` key no pueda leerlas (`get_advisors`, `list_tables`).
- Que `SUPABASE_SERVICE_ROLE_KEY` nunca se commiteó (`git log --all -S"service_role" -- api/`) y, si hay duda, rotarla.
- Si la API está desplegada y es pública: si lo está, aplica los Fix 1–3 **antes de cualquier otra cosa** y trata los datos como potencialmente expuestos.
- `cacheComponents: true` (`next.config.ts:9`): confirmar que, tras el Fix 1, las respuestas autenticadas no se cachean compartidas.

Al terminar todos los fixes, vuelve a ejecutar `/owasp-security-audit` y compara contra `docs/security-report.md`.
