# security-report.md — Auditoría OWASP Top 10 (api/)

- **Fecha:** 2026-10-14
- **Alcance:** `api/` (Next.js + Supabase). Archivos leídos: `docs/api-contract.md`, todos los `api/src/app/api/**/route.ts`, `api/src/lib/{supabase,api,data,schemas}.ts`, `api/next.config.ts`, `api/.env.example`, `api/.gitignore`.
- **Categorías evaluadas:** A01, A02, A03, A05, A07, A09.
- **Modo:** solo lectura. No se modificó código.
- **Prueba ejecutada:** un `node -e` local con `Date.parse` para confirmar F-08 (no toca el repo ni la BD).

## Resumen ejecutivo

| Sev. | # | Hallazgos |
|---|---|---|
| Crítica | 3 | F-01, F-02, F-03 |
| Alta | 3 | F-04, F-05, F-06 |
| Media | 5 | F-07, F-08, F-09, F-10, F-11 |
| Baja | 2 | F-12, F-13 |

**Causa raíz:** la API corre en una "fase sin autenticación" que cada route.ts declara en comentarios. Aun así **todos los endpoints están abiertos** y usan la `service_role` key, que ignora RLS. Si la API es alcanzable desde internet, cualquiera puede leer y modificar toda la base de datos. Los hallazgos F-01 a F-06 derivan de esto y se resuelven al implementar autenticación (`docs/api-contract.md:67`).

---

## CRÍTICA

### F-01 — A01 — Ningún endpoint autentica; todo corre con `service_role`
- **Evidencia:**
  - `api/src/lib/supabase.ts:6-7` y `:18` → `const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; … createClient(url, serviceRoleKey, …)`. Ignora RLS (comentario `:5`: "las tablas tienen RLS activo y sin policies").
  - No existe `middleware.ts`, `proxy.ts` ni `src/middleware.ts`. Ningún `route.ts` lee `Authorization`.
  - `api/src/app/api/auth/me/route.ts:6-9` → `// … el usuario llega por ?userId=, no por token.` y `const { userId } = parse(MeQuerySchema, searchParamsToObject(req), …)`.
  - El contrato exige lo contrario: `docs/api-contract.md:67` → "Header `Authorization: Bearer <token>` en toda ruta salvo `POST /auth/login`".
- **Impacto:** lectura/escritura anónima de proyectos, tickets, comentarios y usuarios. La API conserva el acceso total que da `service_role`.

### F-02 — A01 — La identidad del actor la dicta el cliente
- **Evidencia:**
  - `api/src/lib/schemas.ts:202` `creadorId` (proyecto), `:221` `creadorId` (ticket), `:239` `autorId` (comentario), `:226` `actorId` (archivar, query), `:233` `userId` (responsable). Todos vienen del body/query.
  - `api/src/lib/data.ts:327` `await assertUserExists(input.creadorId, 'creadorId')`, `:363`, `:513`, `:392` `if (actorId) await assertUserExists(actorId, 'actorId')`. Solo se valida que el usuario exista, no que sea quien llama.
  - `api/src/lib/data.ts:398` → `archivado_por_id: actorId ?? null`. `actorId` es opcional: se puede archivar sin dejar rastro.
- **Impacto:** suplantación de cualquier usuario, incluido ADMIN. La traza de auditoría (`archivadoPorId`, `creadorId`, `autorId`) no es confiable y puede quedar vacía.

### F-03 — A07/A02 — Token de sesión estático y logout sin efecto
- **Evidencia:**
  - `api/src/app/api/auth/login/route.ts:12` → `return ok({ token: 'anonymous-dev-token', user });`
  - `api/src/app/api/auth/logout/route.ts:4` → `export const POST = handler(async () => ok({ ok: true }));`
- **Impacto:** el token no se firma, no expira, no se asocia al usuario y nunca se valida. Login y logout no hacen nada de seguridad. Si el frontend guarda ese valor, da una falsa sensación de sesión.

---

## ALTA

### F-04 — A01 — Sin controles de rol ni de propiedad
Cada route.ts reconoce el hueco en su comentario. Las reglas del contrato no están implementadas:

| Endpoint | Evidencia | Regla incumplida |
|---|---|---|
| `POST …/restore` | `restore/route.ts:8` "Sin chequeo 'solo Admin'"; `data.ts:406-415` | `api-contract.md:178` solo Admin |
| `GET /reports/closed-tickets` | `reports/closed-tickets/route.ts:6` "Sin restricción a Admin"; `data.ts:528` | `api-contract.md:214` solo Admin |
| `PATCH /projects/:id` | `projects/[projectId]/route.ts:8` "Sin chequeo de 'solo el creador'"; `data.ts:340-347` | `api-contract.md:160` solo creador |
| `PATCH …/tickets/:id` | `tickets/[ticketId]/route.ts:16` "sin permisos en esta fase"; `data.ts:196-245` | `api-contract.md:142` creador/responsable/Admin |
| `DELETE …/tickets/:id` | `tickets/[ticketId]/route.ts:8-14`; `data.ts:390-404` | `api-contract.md:173` Usuario solo propios |
| `POST …/responsables` | `responsables/route.ts:8` "Sin regla de auto-asignación"; `data.ts:417-430` | `api-contract.md:183` Usuario solo a sí mismo |

- **Impacto:** escalada vertical (Usuario ejecuta acciones de Admin) y horizontal (editar o archivar tickets ajenos).

### F-05 — A01 — Sin alcance por visibilidad de proyecto; `/auth/me` sin control y sin chequear `activo`
- **Evidencia:**
  - `api/src/app/api/projects/route.ts:16` "devuelve todos los proyectos"; `data.ts:124-163` `listProjects` sin filtro de usuario. Contrato: `api-contract.md:127`.
  - `api/src/app/api/tickets/route.ts:6` "Sin acotar por visibilidad"; `data.ts:441-473`. Contrato: `api-contract.md:201`.
  - `data.ts:172-185` `listTickets` solo comprueba que el proyecto exista (`assertProjectExists`), no que el usuario lo vea.
  - `data.ts:114-120` `getUsuario` devuelve cualquier usuario por id (email, nombre, rol) sin comprobar `row.activo`.
- **Impacto:** IDOR. Cualquiera lee todos los proyectos y tickets, y enumera usuarios con su rol, incluidos los desactivados.

### F-06 — A07 — Login sin rate limiting ni bloqueo
- **Evidencia:** `api/src/app/api/auth/login/route.ts:7-13`. Ni ese handler, ni `handler()` en `api/src/lib/api.ts:72-92`, ni `next.config.ts` aplican límite de intentos. No hay middleware.
- **Impacto:** fuerza bruta y credential stuffing sin freno. `bcrypt` a coste 10 (`data.ts:103`) solo encarece cada intento.

---

## MEDIA

### F-07 — A03 — Comodines LIKE en el login (`ilike` con entrada del usuario)
- **Evidencia:** `api/src/lib/data.ts:107` → `await supabase.from('users').select('*').ilike('email', email.trim()).maybeSingle()`.
- **Detalle:** `ilike` interpreta `%` y `_` como comodines. Con `email = "%@example.com"`, si hay varias coincidencias `maybeSingle()` falla y `handler()` responde 500 (`api.ts:81-90`). Con una sola coincidencia sigue haciendo falta la contraseña. La diferencia 500/401 permite enumerar cuentas y adivinar el formato de los emails.
- **Impacto:** fuga de información. No da acceso por sí solo. Ver el fix en `correction-prompt.md`.

### F-08 — A03 — Inyección de filtro PostgREST en el cursor
- **Evidencia:**
  - `api/src/lib/data.ts:26-31` valida el cursor con `!Number.isNaN(Date.parse(v[0])) && !/["(),]/.test(v[1])`. Solo `v[1]` (el id) se filtra por esos caracteres; `v[0]` solo pasa por `Date.parse`.
  - `api/src/lib/data.ts:52` → ``q.or(`creado_en.${op}."${t}",and(creado_en.eq."${t}",id.${op}."${id}")`)`` interpola `t` en una cadena de filtro.
  - **Prueba local confirmada:** `Date.parse('Jan 1 2026 "')` → `1767247200000` (válido); `Date.parse('Jan 1 2026 (",id.neq.x,z)')` → `1767247200000`. V8 tolera texto extra. Con ese `t` (en el cursor base64url) la comilla `"` cierra el valor y se pueden añadir condiciones al `or`.
- **Impacto acotado:** las demás condiciones (`.eq('archivado', false)`, `.eq('proyecto_id', …)`) se combinan con AND fuera del `or`, así que no se puede escapar de ellas. Sí se manipula el predicado de paginación y se provocan errores 500. Si el alcance por usuario (F-05) se implementa como filtros PostgREST, este vector pasaría a ser más grave.

### F-09 — A05 — Sin cabeceras de seguridad HTTP
- **Evidencia:** `api/next.config.ts:11-24`. `headers()` solo define cabeceras CORS. No hay `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` ni CSP. No se ve `poweredByHeader: false` (`:7-10`).
- **Impacto:** sin HSTS, un primer acceso por HTTP queda expuesto; `/api/docs` se puede enmarcar (clickjacking); se anuncia `X-Powered-By: Next.js`.

### F-10 — A05 — Superficie de documentación pública con scripts de CDN sin integridad
- **Evidencia:**
  - `api/src/app/api/docs/route.ts:8` y `:12` → `<link … href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />`, `<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js">`. Versión flotante `@5`, sin `integrity=`.
  - `api/src/app/api/docs/route.ts:14-17` → `tryItOutEnabled: true`. `api/src/app/api/openapi.yaml/route.ts:5-9` sirve el spec completo sin autenticación.
  - `api/src/lib/schemas.ts:111-112` publica `example: 'lucia.fernandez@example.com'` y `example: 'MiniJira2026!'` con aspecto de credencial real (ver "A VERIFICAR").
- **Impacto:** si unpkg o el paquete se comprometen, se ejecuta JS ajeno en el origen de la API. En producción se publican todos los endpoints con un "Try it out" operativo.

### F-11 — A09 — Registro y monitoreo insuficientes
- **Evidencia:**
  - `api/src/lib/api.ts:81` → `console.error(...)` solo en 500. Los `ApiError` (400/401/404) se devuelven sin ningún log (`:80`).
  - `auth/login/route.ts:11` → `if (!user) throw unauthorized(...)` sin registrar el intento fallido (ni email ni IP).
  - Sin registro de acciones sensibles: archivar (`data.ts:390-404`), restaurar (`:406-415`), asignar (`:417-430`), reportes (`:528`).
  - No hay id de petición/correlación en los logs ni en la respuesta.
- **Impacto:** no se detecta fuerza bruta (F-06) ni abuso; no se puede reconstruir un incidente. Se agrava con F-02, porque `archivadoPorId` tampoco sirve como auditoría.

---

## BAJA

### F-12 — A03 — Entradas de texto sin longitud máxima
- **Evidencia:** `api/src/lib/schemas.ts:150` (`titulo` en PATCH), `:216` (`titulo`), `:201` y `:209` (`descripcion`), `:238` (`contenido`), `:160`/`:220` (`etiquetas` sin `.max()`), `:200` (`nombre`). Solo `limit` tiene tope (`:135`, `.max(100)`).
- **Impacto:** payloads enormes se escriben en la BD y la lista de `etiquetas` se traduce a un `.in(...)` sin límite (`data.ts:212`, `:265`). Riesgo de abuso de recursos/almacenamiento.

### F-13 — A05 — CORS con valor por defecto de desarrollo y un solo origen
- **Evidencia:** `api/next.config.ts:5` → `const allowedOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5273";`
- **Detalle:** si `CORS_ORIGIN` no está definido en producción, se anuncia `localhost`. No es una apertura (el origen no es comodín y no hay `Allow-Credentials`), pero rompe el frontend desplegado o empuja a "arreglarlo" con `*`. No sustituye a la autenticación (F-01).

---

## A VERIFICAR (sin evidencia suficiente en los archivos auditados)

1. **Estado real de RLS en Supabase.** Solo consta por el comentario de `supabase.ts:5` ("RLS activo y sin policies"). Confirmar con `get_advisors` / `list_tables` que todas las tablas lo tienen y que la `anon` key no puede leerlas.
2. **¿Son válidas las credenciales de ejemplo?** `schemas.ts:111-112` (`lucia.fernandez@example.com` / `MiniJira2026!`). Si existen en `users` de Supabase, F-10 sube a Alta. Revisar el seed.
3. **Despliegue público de la API.** No consta si está desplegada ni si el origen es alcanzable desde internet. Eso decide si F-01 a F-06 son explotables hoy.
4. **`cacheComponents: true` (`next.config.ts:9`).** Confirmar que ninguna respuesta de route handler con datos de usuario se cachea de forma compartida cuando se añada autenticación.
5. **Preflight OPTIONS.** No hay handler `OPTIONS` explícito. Comprobar que Next responde con las cabeceras de `headers()` en esas peticiones.
6. **`.gitignore` con `.env*`** (`api/.gitignore`, sección "env files"). `.env.example` está trackeado por haberse añadido de forma forzada. Confirmar que no se versionó ningún `.env` real: `git log --all -- api/.env*`.
7. **Historial de git con claves.** No se auditó. Revisar que `SUPABASE_SERVICE_ROLE_KEY` nunca se commiteó.

## Controles correctos observados

- `api/src/lib/api.ts:72-92`: los errores no controlados devuelven un 500 genérico sin detalles internos.
- `api/src/lib/data.ts:101-112`: `bcrypt` y `DUMMY_HASH` evitan la enumeración por tiempos; el mensaje 401 es genérico (`login/route.ts:10-11`).
- Validación Zod de body, query y params antes de tocar la BD (`api.ts:45-56`; `schemas.ts`).
- Consultas parametrizadas vía supabase-js; `.or()` en `data.ts:52` es el único punto con interpolación (F-08).
- `toUsuarioResumen` (`data.ts:63-69`) nunca expone `password_hash`.
- El cursor valida el id (`data.ts:30`).
- `service_role` solo en servidor, con la variable de entorno fuera del repo (`.gitignore`).
- Los tickets se verifican contra su proyecto (`assertTicketInProject`, `data.ts:274-284`; `patchTicket` `:197-205`).
