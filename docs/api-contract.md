# api-contract.md — Contrato de API REST (Mini Jira)

> Fuente única de verdad: `docs/specs.md` (v1.1, APROBADO) y `docs/backlog.md`. Ante cualquier divergencia entre este contrato y `specs.md`, decide `specs.md`; este documento se corrige, nunca al revés.
>
> Alcance: define el backend REST que el frontend (`apps/web/`) necesita consumir. El frontend actual está por detrás del backlog — el store de tablero (`apps/web/src/features/tickets/board.store.ts`) solo implementa `moveTicket`, y `ProjectsPage.tsx` no dispara ninguna llamada de datos (renderiza `mockProyectos` directamente). Por eso los endpoints se derivan de las historias de `backlog.md` usando `apps/web/src/types.ts` como forma de datos autoritativa, no solo de código ya cableado. Cada endpoint indica qué pieza de frontend lo consume hoy, y cuál debe construirse.
>
> Este documento no modifica ningún archivo del frontend.

---

## 0. Convenciones

### Envelope
Toda respuesta, éxito o error, tiene esta forma:

```ts
interface ApiResponse<T> {
  data: T | null;
  error: ProblemDetails | null;
}
```

Éxito: `{ "data": {...}, "error": null }`. Falla: `{ "data": null, "error": {...} }`.

### Errores — RFC 7807 Problem Details
```ts
interface ProblemDetails {
  type: string;     // URI que identifica la categoría, ej. "https://minijira.dev/errors/validation"
  title: string;     // resumen corto y estable, ej. "Validation Failed"
  status: number;    // código HTTP
  detail: string;    // explicación legible de esta ocurrencia específica
  instance: string;  // referencia a la request concreta, ej. el path invocado
  errors?: { field: string; message: string }[]; // solo en 400 de validación de formulario
}
```

Ejemplo (título de ticket ausente):
```json
{
  "data": null,
  "error": {
    "type": "https://minijira.dev/errors/validation",
    "title": "Validation Failed",
    "status": 400,
    "detail": "El ticket no pudo guardarse por errores de validación.",
    "instance": "/projects/proj_1/tickets",
    "errors": [{ "field": "titulo", "message": "El título es obligatorio." }]
  }
}
```

Códigos usados en este contrato: `400` (validación), `401` (no autenticado / credenciales inválidas / sesión expirada), `403` (autenticado pero sin permiso), `404` (recurso no encontrado o fuera del alcance visible del usuario — no se distingue de "no existe" para no filtrar información de otros proyectos).

### Paginación — cursor-based
Todo endpoint de listado acepta `?cursor=<string>&limit=<number>` (default `limit=20`) y responde:

```ts
interface Page<T> {
  items: T[];
  nextCursor: string | null; // null = no hay más páginas
}
```

`ApiResponse<Page<T>>["data"]` es la forma concreta de `data` en estos endpoints.

### Autenticación
Header `Authorization: Bearer <token>` en toda ruta salvo `POST /auth/login`. Token inválido o expirado → `401` en cualquier endpoint, no solo en `/auth/me`; el cliente debe interpretar cualquier `401` como "sesión expirada, re-loguear" (Historia 1, edge case).

### Excepción de ruteo
La convención general es **REST plural anidado** (la ruta refleja la relación de datos: proyecto → ticket → comentario). La única excepción es `GET /tickets` (top-level, plano, sección 3), porque Historia 8 filtra tickets **por proyecto entre varios proyectos a la vez** — no tiene sentido anidarlo bajo un único `:projectId`.

---

## 1. Modelo de datos

Tipos existentes — ver `apps/web/src/types.ts` (no se modifican, se referencian tal cual):

| Tipo | Campos | Línea en `types.ts` |
|---|---|---|
| `UsuarioResumen` | `id, email, nombre, rol: 'ADMIN'|'USUARIO', activo` | 5 |
| `Proyecto` | `id, nombre, descripcion, creadorId, creador, creadoEn, ticketsAbiertos` | 13 |
| `Ticket` | `id, titulo, descripcion, estado, prioridad, fecha, proyectoId, creadorId, creador, archivado, archivadoPorId, creadoEn, actualizadoEn, cerradoEn, responsables, etiquetas` | 36 |
| `Estado` | `'POR_HACER' \| 'EN_PROGRESO' \| 'REVIEW' \| 'TERMINADO'` (orden fijo, R-07) | 23 |
| `Prioridad` | `'BAJA' \| 'MEDIA' \| 'ALTA'` | 24 |
| `Etiqueta` | `id, nombre` | 26 |
| `Responsable` | `userId, user` | 31 |

Tipo **nuevo** (no existe aún en `types.ts` — Historia 7 lo requiere, debe agregarse ahí cuando se implemente):

```ts
export interface Comentario {
  id: string;
  ticketId: string;
  autorId: string;
  autor: Pick<UsuarioResumen, 'id' | 'nombre' | 'email'>;
  contenido: string;
  creadoEn: string; // ISO 8601
}
```
Sigue el mismo patrón que `Proyecto.creador` / `Ticket.creador`.

**Hueco señalado (no se asume, se deja documentado):** `backlog.md` no define gestión de `Etiqueta` (crear/listar etiquetas disponibles) ni des-asignación de `Responsable` (Historia 5 solo cubre *agregar* responsables). Ambos quedan fuera de este contrato hasta que una historia los cubra explícitamente.

---

## 2. Endpoints — P0 (desbloquea el Kanban)

### `POST /auth/login`
- **Auth:** no requiere.
- **Payload:** `{ email: string; password: string }`
- **Response (`data`):** `{ token: string; user: UsuarioResumen }`
- **Errores:** `401` credenciales incorrectas — mensaje genérico, **sin indicar** cuál de los dos campos falló (Historia 1, edge case).
- **Dispara desde:** no existe aún una `LoginPage` en el frontend; debe crearse.
- **Historia:** H1.

### `GET /auth/me`
- **Auth:** requerida.
- **Response (`data`):** `UsuarioResumen`
- **Errores:** `401` si el token es inválido o expiró → dispara el flujo de re-login (Historia 1, edge case "Sesión expirada").
- **Dispara desde:** bootstrap de la app (resolución de rol antes de decidir qué proyectos/tickets mostrar).
- **Historia:** H1.

### `GET /projects`
- **Auth:** requerida.
- **Query:** `?cursor=&limit=`
- **Response (`data`):** `Page<Proyecto>`
- **Reglas de visibilidad:** Admin recibe todos los proyectos; Usuario recibe solo los que creó o donde tiene al menos un ticket asignado como responsable (Historia 2).
- **Dispara desde:** `ProjectsPage.tsx` — hoy importa `mockProyectos` estático (línea 9); debe reemplazarse por este fetch.
- **Historia:** H2.

### `GET /projects/:projectId/tickets`
- **Auth:** requerida. `403` si el usuario no tiene visibilidad sobre `:projectId` (misma regla que H2).
- **Query:** `?cursor=&limit=` (implícitamente excluye `archivado=true`; ver Historia 4 — tickets archivados desaparecen del tablero).
- **Response (`data`):** `Page<Ticket>`
- **Dispara desde:** `KanbanBoard.tsx` / `useTicketsByStatus` en `board.store.ts` (líneas 39–48), que hoy filtra sobre datos mockeados en memoria — debe pasar a consumir este endpoint.
- **Historia:** H6.

### `PATCH /projects/:projectId/tickets/:ticketId`
- **Auth:** requerida.
- **Payload (parcial):** `{ estado?, titulo?, descripcion?, prioridad?, fecha?, etiquetas?: string[] }`
- **Response (`data`):** `Ticket` actualizado.
- **Reglas de permiso:** creador o responsable del ticket puede editar; Administrador puede editar cualquiera; si `estado` cambia pero quien edita no es creador/responsable/Admin → `403` (Historia 6, edge case "ticket sin relación"). Si cualquier otro campo cambia sin ser creador/responsable/Admin → `403` (Historia 3, edge case).
- **Efectos:** si `estado` pasa a `'TERMINADO'`, el backend registra `cerradoEn`; cualquier cambio actualiza `actualizadoEn`.
- **Concurrencia:** **last-write-wins, sin detección de conflicto** (RF-16/decisión P5 vigente) — dos ediciones simultáneas no generan `409`, gana la última escritura silenciosamente. No confundir con los endpoints de locking de la sección 6, que están explícitamente fuera del MVP.
- **Dispara desde:** `moveTicket` en `board.store.ts` (líneas 16–36, hoy solo envía `estado` vía `moverTicketRemoto` en `ticketsApi.ts`); también cubre la edición de campos de Historia 3, para la cual aún no existe UI.
- **Historia:** H3, H6.

---

## 3. Endpoints — P1

### `POST /projects`
- **Payload:** `{ nombre: string; descripcion?: string | null }`
- **Response:** `Proyecto` creado, con `creadorId` = usuario autenticado.
- **Dispara desde:** no existe handler aún en `ProjectsPage.tsx` — debe agregarse.
- **Historia:** H2.

### `PATCH /projects/:projectId`
- **Payload (parcial):** `{ nombre?: string; descripcion?: string | null }`
- **Permisos:** solo el creador puede editar; si no → `403` (Historia 2, edge case).
- **Dispara desde:** no existe handler aún — debe agregarse.
- **Historia:** H2.

### `POST /projects/:projectId/tickets`
- **Payload:** `{ titulo: string; descripcion?: string | null; prioridad?: Prioridad; fecha?: string | null; etiquetas?: string[] }`
- **Response:** `Ticket` creado — `creadorId` = usuario autenticado, `estado` inicial `'POR_HACER'`, `creadoEn` registrado.
- **Errores:** `400` si falta `titulo` (Historia 3, edge case).
- **Dispara desde:** no existe handler aún.
- **Historia:** H3.

### `DELETE /projects/:projectId/tickets/:ticketId`
- **Efecto:** archivado lógico (`archivado = true`, `archivadoPorId` = usuario autenticado) — nunca un borrado físico.
- **Permisos:** Usuario solo puede archivar tickets propios (`403` si no es creador); Administrador puede archivar cualquiera, y queda registrado quién lo archivó vía `archivadoPorId` (Historia 4).
- **Historia:** H4.

### `POST /projects/:projectId/tickets/:ticketId/restore`
- **Permisos:** solo Administrador (`403` para Usuario, Historia 4 edge case).
- **Efecto:** `archivado = false`; el ticket vuelve a aparecer en tablero y filtros.
- **Historia:** H4.

### `POST /projects/:projectId/tickets/:ticketId/responsables`
- **Payload:** `{ userId: string }`
- **Permisos:** Usuario solo puede auto-asignarse (`userId` debe ser el propio usuario autenticado, si no → `403`, Historia 5 edge case / riesgo R-06); Administrador puede asignar a cualquiera.
- **Response:** `Ticket` actualizado con el nuevo `responsables[]`.
- **Historia:** H5.

### `GET /projects/:projectId/tickets/:ticketId/comments`
- **Response (`data`):** `Page<Comentario>` (orden cronológico).
- **Historia:** H7.

### `POST /projects/:projectId/tickets/:ticketId/comments`
- **Payload:** `{ contenido: string }`
- **Errores:** `400` si `contenido` está vacío/solo espacios — no se registra (Historia 7, edge case).
- **Response:** `Comentario` creado, `autorId` = usuario autenticado, `creadoEn` registrado.
- **Historia:** H7.

### `GET /tickets`
- **Ruta plana** (única excepción — ver Convenciones).
- **Query:** `?proyectoId=&prioridad=&responsableId=&etiqueta=&fechaDesde=&fechaHasta=&cursor=&limit=` — todos opcionales y combinables (AND).
- **Response (`data`):** `Page<Ticket>`, sin resultados → `200` con `items: []` (no es un error, Historia 8 edge case).
- **Alcance:** siempre restringido a los proyectos visibles del usuario (misma regla que H2), incluso si no se pasa `proyectoId`.
- **Historia:** H8.

---

## 4. Endpoints — P2

### `POST /auth/logout`
- Invalida el token actual del lado del servidor.
- **Historia:** H1 (complemento).

### `GET /reports/closed-tickets`
- **Query:** `?mes=&anio=&proyectoId=` (opcionales; sin filtro = todo el histórico).
- **Permisos:** solo Administrador — `403` para Usuario (Historia 9, edge case).
- **Response (`data`):** `{ proyectoId: string; proyecto: string; mes: number; anio: number; cantidad: number }[]` — conteo tabular, sin gráficos, agrupado por mes y proyecto, basado en tickets `estado = 'TERMINADO'` con `cerradoEn` registrado.
- **Historia:** H9.

---

## 5. Fuera de este contrato

- **Modo oscuro (Historia 10):** no requiere ningún endpoint — es enteramente Design Tokens/frontend (RF-14, RF-15, RNF-03).
- **`GET /audit/:ticketId`:** omitido. No existe entidad de audit-log en el frontend ni en `specs.md`; RF-02 ("traza de auditoría" de quién archivó un ticket) ya está satisfecho por el campo plano `Ticket.archivadoPorId` devuelto en cualquier respuesta de ticket. Agregar un audit-log real sería ampliar el alcance de `specs.md` sin que ninguna historia de `backlog.md` lo pida hoy.

---

## 6. Fase 2 — pendiente de decisión PO (fuera del MVP)

### `POST /tickets/:id/lock` · `DELETE /tickets/:id/lock`
Estos dos endpoints **contradicen la decisión vigente de `specs.md`**: v1.0 especificaba bloqueo optimista (campo `version`, HTTP `409`), pero **v1.1 lo reemplazó explícitamente por last-write-wins sin detección de conflicto** (`specs.md:33`, `specs.md:142` fila P5; RF-16 en `specs.md:120`). Mientras `specs.md` no se actualice para reintroducir locking, estos endpoints no tienen prioridad P0/P1/P2 y no deben implementarse — se documentan aquí únicamente como propuesta a futuro, siguiendo la regla de `CLAUDE.md` de nunca dejar divergir código y `specs.md` en silencio.

Si en el futuro se aprueban, la forma propuesta sería:
- `POST /tickets/:id/lock` → `{ data: { lockedBy: UsuarioResumen; lockedAt: string; expiresAt: string } }`, `409` si ya está bloqueado por otro usuario.
- `DELETE /tickets/:id/lock` → libera el lock; `403` si quien lo pide no es quien lo tomó (salvo Admin).

---

## 7. Trazabilidad Gherkin → endpoint

| Historia | Escenario (`backlog.md`) | Endpoint | Resultado / código |
|---|---|---|---|
| H1 | Inicio de sesión exitoso | `POST /auth/login` | `200`, `data.token` |
| H1 | No existe registro público | (sin endpoint — ausencia de ruta de registro es la implementación) | n/a |
| H1 | Credenciales incorrectas | `POST /auth/login` | `401`, mensaje genérico |
| H1 | Sesión expirada | cualquier endpoint protegido | `401` → re-login |
| H2 | Crear un proyecto | `POST /projects` | `200`, `creadorId` = autor |
| H2 | Editar un proyecto propio | `PATCH /projects/:id` | `200` |
| H2 | Visibilidad total Admin | `GET /projects` | `200`, todos |
| H2 | Visibilidad restringida Usuario | `GET /projects` | `200`, filtrado |
| H2 | Edición no autorizada | `PATCH /projects/:id` | `403` |
| H3 | Crear un ticket | `POST /projects/:projectId/tickets` | `200` |
| H3 | Editar ticket propio | `PATCH /projects/:projectId/tickets/:ticketId` | `200` |
| H3 | Administrador edita cualquiera | `PATCH /projects/:projectId/tickets/:ticketId` | `200` |
| H3 | Cierre de ticket | `PATCH .../tickets/:ticketId` (`estado: 'TERMINADO'`) | `200`, `cerradoEn` seteado |
| H3 | Título obligatorio ausente | `POST /projects/:projectId/tickets` | `400`, `errors: [{field: 'titulo'}]` |
| H3 | Edición no autorizada | `PATCH .../tickets/:ticketId` | `403` |
| H3 | Edición concurrente (LWW) | `PATCH .../tickets/:ticketId` | `200` para ambas, sin `409` (por diseño) |
| H4 | Usuario archiva propio | `DELETE .../tickets/:ticketId` | `200` |
| H4 | Admin archiva de un tercero | `DELETE .../tickets/:ticketId` | `200`, `archivadoPorId` registrado |
| H4 | Admin restaura | `POST .../tickets/:ticketId/restore` | `200` |
| H4 | Usuario intenta archivar ajeno | `DELETE .../tickets/:ticketId` | `403` |
| H4 | Usuario intenta restaurar | `POST .../tickets/:ticketId/restore` | `403` |
| H5 | Ticket con varios responsables | `POST .../tickets/:ticketId/responsables` (repetido) | `200` cada vez |
| H5 | Usuario se autoasigna | `POST .../tickets/:ticketId/responsables` (`userId` propio) | `200` |
| H5 | Admin asigna a cualquiera | `POST .../tickets/:ticketId/responsables` | `200` |
| H5 | Usuario intenta asignar a un tercero | `POST .../tickets/:ticketId/responsables` | `403` |
| H6 | Mover ticket propio/asignado | `PATCH .../tickets/:ticketId` (`estado`) | `200` |
| H6 | Admin mueve cualquiera | `PATCH .../tickets/:ticketId` (`estado`) | `200` |
| H6 | Usuario mueve ticket sin relación | `PATCH .../tickets/:ticketId` (`estado`) | `403` |
| H7 | Agregar comentario | `POST .../tickets/:ticketId/comments` | `200` |
| H7 | Ver comentarios | `GET .../tickets/:ticketId/comments` | `200` |
| H7 | Comentario vacío | `POST .../tickets/:ticketId/comments` | `400` |
| H8 | Filtrar por un criterio | `GET /tickets?<criterio>=` | `200`, filtrado |
| H8 | Combinar varios filtros | `GET /tickets?a=&b=` | `200`, intersección |
| H8 | Filtrado respeta visibilidad | `GET /tickets` | `200`, acotado a proyectos visibles |
| H8 | Sin resultados | `GET /tickets?...` | `200`, `items: []` |
| H9 | Ver conteo de cierres | `GET /reports/closed-tickets` | `200` |
| H9 | Usuario sin acceso al reporte | `GET /reports/closed-tickets` | `403` |
| H10 | Modo oscuro | — (sin endpoint, ver sección 5) | n/a |

---

**Pendiente de tu aprobación antes de pasar a diseño de schema Prisma / implementación del backend.**
