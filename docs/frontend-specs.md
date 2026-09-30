# frontend-specs.md — Especificación de Frontend (Mini Jira)

> **Fuente:** `docs/specs.md` (v1.1, APROBADO), `docs/backlog.md`, `docs/test_plan.md`, `architecture/architecture.md`, `architecture/er_diagram.md` y `docs/prototype-spec.md`. Este documento resuelve, para el **frontend**, todos los puntos que esos documentos dejaban pendientes o ambiguos (ver §0). Ante cualquier conflicto futuro, `specs.md` sigue siendo la fuente única de verdad (`CLAUDE.md`); si esta especificación necesita cambiar como consecuencia, se actualiza aquí explícitamente.
>
> **Estado:** pendiente de confirmación del usuario. No se escribe código de implementación hasta que este documento sea aprobado.

---

## 0. Decisiones que este documento fija (antes ambiguas o pendientes)

Todas confirmadas por el Product Owner en dos rondas de preguntas (30/09/2026 – 01/10/2026):

| # | Punto pendiente | Origen | Decisión |
|---|---|---|---|
| 1 | Asignación de responsables a terceros (riesgo R-06) | `specs.md` §8 | Un **Usuario** solo puede asignarse/desasignarse **a sí mismo**. Asignar a un tercero es exclusivo del **Administrador**. |
| 2 | Orden de columnas del tablero (riesgo R-07) | `specs.md` §8 | **Por hacer → En progreso → Review → Terminado**, definitivo. |
| 3 | Etiquetas: ¿catálogo o texto libre? | `er_diagram.md` §4 | **Catálogo compartido** reutilizable entre tickets, con autocompletado. Cualquier usuario puede crear una etiqueta nueva al editar un ticket (RF-09b sigue vigente). |
| 4 | Significado del campo `fecha` del ticket | `er_diagram.md` §4 | **Fecha límite/vencimiento**, opcional. |
| 5 | Nombre visible de usuario | `er_diagram.md` §4 | Se agrega el campo **`nombre`** a `User` (lo define el Administrador al crear la cuenta). Reemplaza al email en comentarios, avatares y selectores de responsables. |
| 6 | Canal para comunicar credenciales (no hay email, RF-12 es Fase 2) | Nuevo, detectado en este análisis | El sistema **genera la contraseña** al crear la cuenta y la muestra **una sola vez** en pantalla; el Administrador la comunica fuera del sistema. |
| 7 | Recuperación de contraseña | Nuevo | **No hay flujo de "olvidé mi contraseña"**. El Administrador restablece la cuenta desde la gestión de usuarios, lo que genera y muestra una nueva contraseña temporal una sola vez (mismo mecanismo que el punto 6). |
| 8 | Combinación de valores dentro de un mismo filtro | `backlog.md` Historia 8 | **Multi-selección dentro de cada filtro** (ej. Prioridad = Baja **o** Media), combinada con **AND** entre distintos tipos de filtro. |
| 9 | Campo y forma del filtro de fecha (con 3 fechas posibles por ticket) | Nuevo, detectado en este análisis | El filtro de fecha opera como **rango (desde/hasta)** sobre la **fecha de vencimiento** (punto 4). No filtra por fecha de creación ni de cierre en el MVP. |
| 10 | Versión de React | `specs.md` §3 (no fija versión) | **React 18** (LTS), la misma del prototipo actual. |
| 11 | Manejo de datos remotos/estado servidor | No especificado | Se introduce **TanStack Query**. |
| 12 | Manejo de formularios | No especificado | Se introduce **React Hook Form + Zod**. |
| 13 | Testing de frontend | `test_plan.md` no fija herramientas | **Vitest + React Testing Library**. |
| 14 | Almacenamiento de sesión (JWT) | No especificado | Se mantiene **JWT en `localStorage`**, como en el prototipo actual. |

---

## 1. Stack y versiones

| Capa | Tecnología | Versión |
|---|---|---|
| Librería UI | React | `^18.3.1` |
| Lenguaje | TypeScript | `^5.5.4` |
| Build tool / dev server | Vite | `^5.4.x` |
| Enrutamiento | React Router (`react-router-dom`) | `^6.26.x` |
| Datos remotos / cache | TanStack Query (`@tanstack/react-query`) | `^5.x` |
| Formularios | React Hook Form | `^7.x` |
| Validación de formularios | Zod + `@hookform/resolvers` | `^3.x` |
| Drag-and-drop del tablero | `@dnd-kit/core` + `@dnd-kit/sortable` | `^6.x` / `^8.x` |
| Testing | Vitest + React Testing Library + `@testing-library/user-event` + `jsdom` | `^2.x` / `^16.x` / `^14.x` / `^25.x` |
| Estilos | CSS plano con Design Tokens propios (sin framework de UI pesado, `CLAUDE.md`) | — |

No se introduce ningún framework de UI (Material UI, Chakra, Tailwind, etc.): `CLAUDE.md` lo excluye salvo indicación explícita en `specs.md`, y no la hay.

---

## 2. Dependencias

### 2.1 Producción

| Paquete | Propósito |
|---|---|
| `react`, `react-dom` | Librería UI base. |
| `react-router-dom` | Rutas de la SPA (login, proyectos, tablero, usuarios, reportes). |
| `@tanstack/react-query` | Cache, revalidación e invalidación de datos remotos (proyectos, tickets, comentarios, etiquetas, usuarios, reporte). Reemplaza el `fetch` manual + `useState` del prototipo. |
| `react-hook-form` | Estado y validación de todos los formularios (login, proyecto, ticket, usuario, filtros). |
| `zod` + `@hookform/resolvers` | Esquemas de validación tipados, compartidos entre formularios y (cuando aplique) para tipar las respuestas de la API. |
| `@dnd-kit/core`, `@dnd-kit/sortable` | Arrastrar y soltar tickets entre columnas del tablero (`docs/prototype-spec.md` C.4), manteniendo el control `<select>` accesible como alternativa de teclado obligatoria (WCAG 2.1 AA, B.2). |

### 2.2 Desarrollo

| Paquete | Propósito |
|---|---|
| `typescript` | Tipado estático. |
| `vite`, `@vitejs/plugin-react` | Servidor de desarrollo y build. |
| `vitest` | Test runner (integrado con Vite). |
| `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` | Tests de componentes orientados a comportamiento del usuario. |
| `jsdom` | Entorno DOM simulado para Vitest. |
| `@types/react`, `@types/react-dom` | Tipos de React. |

No se agrega ESLint/Prettier como decisión de producto: se configuran con reglas estándar de React + TypeScript (`eslint:recommended`, `@typescript-eslint/recommended`, `eslint-plugin-react-hooks`) como práctica de ingeniería, sin impacto en reglas de negocio.

---

## 3. Modelo de datos (frontend)

Tipos TypeScript que el frontend consume desde la API. Reflejan las decisiones de §0 (campo `nombre` en `User`, `fecha` como vencimiento, `Tag` como catálogo compartido).

```typescript
type Rol = 'ADMIN' | 'USUARIO';
type Estado = 'POR_HACER' | 'EN_PROGRESO' | 'REVIEW' | 'TERMINADO'; // orden fijo, decisión #2
type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';

interface AuthUser {
  id: string;
  email: string;
  nombre: string; // decisión #5
  rol: Rol;
}

interface UsuarioResumen {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
}

interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string | null;
  creadorId: string;
  creador: Pick<UsuarioResumen, 'id' | 'nombre' | 'email'>;
  creadoEn: string; // ISO 8601
  ticketsAbiertos: number;
}

interface Etiqueta {
  id: string;
  nombre: string;
}

interface Responsable {
  userId: string;
  user: Pick<UsuarioResumen, 'id' | 'nombre' | 'email'>;
}

interface Comentario {
  id: string;
  contenido: string;
  fecha: string; // ISO 8601
  autorId: string;
  autor: Pick<UsuarioResumen, 'id' | 'nombre' | 'email'>;
  ticketId: string;
}

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: Estado;
  prioridad: Prioridad;
  fecha: string | null; // ISO 8601 (solo fecha), vencimiento opcional — decisión #4
  proyectoId: string;
  creadorId: string;
  creador: Pick<UsuarioResumen, 'id' | 'nombre' | 'email'>;
  archivado: boolean;
  archivadoPorId: string | null;
  creadoEn: string;
  actualizadoEn: string;
  cerradoEn: string | null; // se completa al pasar a TERMINADO
  responsables: Responsable[];
  etiquetas: Etiqueta[];
}

// RF-09, decisiones #8 y #9: multi-seleccion por tipo + rango sobre "fecha" (vencimiento)
interface FiltrosTicket {
  proyectoId: string; // el tablero siempre filtra dentro de un proyecto
  prioridades?: Prioridad[];
  responsableIds?: string[];
  etiquetaIds?: string[];
  vencimientoDesde?: string; // ISO date
  vencimientoHasta?: string; // ISO date
}

interface ReporteMensualFila {
  proyectoId: string;
  proyectoNombre: string;
  mes: string; // "2026-09"
  ticketsCerrados: number;
}

// Respuesta al crear una cuenta o al restablecer su contrasena — decisiones #6 y #7
interface CredencialesGeneradas {
  usuario: UsuarioResumen;
  passwordTemporal: string; // se muestra una unica vez, el backend no la vuelve a exponer
}
```

---

## 4. Reglas de negocio

### 4.1 Matriz de permisos (consolidada, con R-06 resuelto)

| Acción | Administrador | Usuario |
|---|:---:|:---:|
| Ver todos los proyectos y tickets | ✅ | ❌ solo los propios o donde tiene ticket asignado (RF-17) |
| Crear proyecto | ✅ | ✅ |
| Editar proyecto | ✅ (cualquiera) | ✅ solo los propios |
| Crear ticket | ✅ | ✅ (dentro de un proyecto visible para él) |
| Editar ticket (título, descripción, prioridad, fecha, etiquetas) | ✅ (cualquiera) | ✅ solo propios o donde es responsable |
| Mover ticket entre estados | ✅ (cualquiera) | ✅ solo propios o asignados |
| Comentar | ✅ | ✅ (en cualquier ticket dentro de su alcance de visibilidad) |
| Asignar/reasignar responsable a **sí mismo** | ✅ | ✅ |
| Asignar/reasignar responsable a **un tercero** | ✅ (a cualquier ticket) | ❌ — **decisión #1** |
| Archivar ("eliminar") tickets propios | ✅ | ✅ |
| Archivar tickets de terceros | ✅ (con traza de quién archivó) | ❌ |
| Restaurar tickets archivados | ✅ | ❌ |
| Ver tickets archivados | ✅ (todos los del proyecto) | ✅ solo los que él mismo archivó |
| Crear/desactivar cuentas de usuario | ✅ | ❌ |
| Restablecer contraseña de una cuenta | ✅ | ❌ (ni siquiera la propia — sin flujo de autoservicio, decisión #7) |
| Ver reporte mensual de cierres | ✅ | ❌ |
| Crear etiquetas nuevas en el catálogo | ✅ | ✅ (al editar cualquier ticket donde tenga permiso de edición) |

Nota: el frontend aplica estas reglas solo para **ocultar/deshabilitar** controles (UX); la autorización real se valida en el backend (RNF-04, EC-01 de `test_plan.md`). Ningún componente debe asumir que ocultar un botón es suficiente control de acceso.

### 4.2 Reglas de datos

- Un ticket pertenece a **un único proyecto** (RF-03); no existe selector de "mover de proyecto" en el MVP.
- `fecha` (vencimiento) es **opcional**; si no se completa, el ticket no muestra chip de vencimiento en la tarjeta del tablero.
- `cerradoEn` se completa automáticamente al mover un ticket a `TERMINADO` y se limpia (`null`) si se lo mueve fuera de ese estado.
- Las etiquetas son un **catálogo compartido**: al escribir, el campo autocompleta con etiquetas existentes (normalizadas sin distinguir mayúsculas/minúsculas para evitar duplicados como "Bug"/"bug"); si no existe, se crea una nueva al guardar.
- Comentarios: solo se pueden **crear y listar** en el MVP (RF-11). No hay edición ni borrado de comentarios — no está en el alcance de `specs.md`.
- Concurrencia: **last-write-wins** (RF-16), sin bloqueo ni aviso de conflicto. El detalle del ticket muestra "Última actualización por {nombre} el {fecha}" como mitigación de UX (riesgo R-05), no como control real de concurrencia.
- Filtros: se combinan con **AND** entre tipos de filtro distintos; dentro de un mismo tipo (prioridad, responsable, etiqueta), los valores seleccionados se combinan con **OR** (decisión #8). El filtro de fecha es un rango sobre el campo de vencimiento (decisión #9).
- El reporte mensual (RF-13) es de solo lectura, en tabla, sin gráficos, agrupado por mes y proyecto, exclusivo para Administrador.
- Vista de archivados: es **por proyecto** (una pestaña/alternancia dentro del tablero de ese proyecto), no una vista global — los tickets archivados siguen perteneciendo a un único proyecto y la regla de visibilidad de §4.1 aplica igual que en el tablero activo.

### 4.3 Cuentas de usuario

- Alta de cuenta (solo Admin): email (único), nombre, rol. La contraseña se **genera automáticamente** y se muestra una única vez en un modal de confirmación tras crear la cuenta (decisión #6); no puede volver a consultarse — si se pierde, requiere un restablecimiento.
- Restablecer contraseña (solo Admin, sobre una cuenta existente): genera una nueva contraseña temporal y la muestra una única vez, con el mismo componente de confirmación que el alta.
- Desactivar cuenta: el usuario desactivado no puede iniciar sesión (`activo = false`); no se elimina el registro ni sus tickets/comentarios asociados.
- No existe registro público ni flujo de "olvidé mi contraseña" (RF-07, decisión #7).

---

## 5. Arquitectura de componentes

### 5.1 Capas y responsabilidades

```
main.tsx
  └─ QueryClientProvider (TanStack Query)
      └─ BrowserRouter
          └─ AnnouncerProvider       (aria-live, ya existente)
              └─ ThemeProvider       (nuevo: modo claro/oscuro manual + persistencia)
                  └─ AuthProvider    (sesion JWT en localStorage)
                      └─ App (rutas)
```

- **`AppShell`** (nuevo): layout compartido por toda ruta autenticada — barra superior con navegación (Proyectos · Usuarios [Admin] · Reportes [Admin]), datos del usuario actual, toggle de modo oscuro (RF-15) y botón de cerrar sesión. Sustituye los encabezados ad-hoc que el prototipo repetía en cada página.
- **`ThemeProvider`**: expone `theme: 'light' | 'dark'` y `setTheme()`. Persiste la preferencia explícita del usuario en `localStorage`; si no hay preferencia guardada, sigue `prefers-color-scheme` del sistema (ya implementado en `tokens.css`). Escribe `data-theme="light"|"dark"` en `<html>` para que los tokens CSS existentes puedan sobrescribir el modo automático cuando el usuario elige explícitamente.
- **Hooks de datos por feature** (`features/<dominio>/api.ts`): un archivo por dominio (proyectos, tickets, comentarios, etiquetas, usuarios, reportes) que encapsula los hooks de TanStack Query (`useProyectos`, `useCrearProyecto`, `useTickets`, `useMoverTicket`, etc.) y las claves de cache (`queryKey`). Ningún componente de UI llama `fetch` directamente.
- **Formularios** (`features/<dominio>/*Form.tsx`): cada formulario define su propio esquema Zod y usa `react-hook-form` vía `zodResolver`. Los esquemas de validación viven junto al formulario que los usa (no hay una carpeta `validation/` compartida prematura).
- **Tablero** (`features/tickets/BoardPage.tsx` + `dnd/`): las columnas y tarjetas están envueltas con los contextos de `@dnd-kit` para soportar arrastrar y soltar; cada tarjeta conserva el `<select>` "Mover a…" ya implementado en el prototipo como alternativa de teclado obligatoria — ambos mecanismos llaman al mismo hook `useMoverTicket`.
- **`TicketDrawer`**: se mantiene como panel lateral (ya implementado), ahora usando `react-hook-form` para el formulario y hooks de TanStack Query para guardar/asignar/archivar, con invalidación automática de la cache del tablero al mutar.
- **Componentes de UI compartidos** (`components/`): `Button`, `Field` (input/select/textarea con label y error asociado), `Banner`, `Badge`, `Avatar`, `SkeletonLoader` (ya existente), `Modal`/`Drawer` genérico. Se documentan informalmente aquí (no hay Storybook en el MVP); siguen los tokens de `docs/prototype-spec.md` sección A.
- **`AnnouncerContext`**: ya implementado, sin cambios de diseño; los nuevos flujos (comentarios, filtros, reportes, gestión de usuarios) deben anunciar sus acciones siguiendo el mismo patrón.

### 5.2 Patrón de datos remotos

Cada mutación de TanStack Query invalida las `queryKey` afectadas en `onSuccess` (ej. crear un ticket invalida `['tickets', proyectoId]`; archivar un ticket invalida tanto `['tickets', proyectoId]` como `['tickets-archivados', proyectoId]`). No se mantiene estado de servidor duplicado en `useState`.

### 5.3 Drag-and-drop accesible

Por WCAG 2.1 AA (`docs/prototype-spec.md` B.2), toda interacción de arrastrar y soltar debe tener una alternativa de teclado equivalente. El `<select>` de cada tarjeta cumple ese rol y permanece visible (no oculto tras el drag-and-drop); ambos disparan la misma mutación y quedan sujetos a la misma regla de permisos (§4.1).

---

## 6. Estructura de carpetas

```
frontend/
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx                     # definicion de rutas
│  ├─ app/
│  │  ├─ AppShell.tsx
│  │  └─ queryClient.ts
│  ├─ auth/
│  │  ├─ AuthContext.tsx
│  │  ├─ useAuth.ts
│  │  └─ LoginPage.tsx
│  ├─ context/
│  │  ├─ AnnouncerContext.tsx
│  │  └─ ThemeContext.tsx
│  ├─ features/
│  │  ├─ projects/
│  │  │  ├─ api.ts
│  │  │  ├─ ProjectsPage.tsx
│  │  │  ├─ ProjectCard.tsx
│  │  │  └─ ProjectForm.tsx
│  │  ├─ tickets/
│  │  │  ├─ api.ts
│  │  │  ├─ BoardPage.tsx
│  │  │  ├─ TicketCard.tsx
│  │  │  ├─ TicketDrawer.tsx
│  │  │  ├─ TicketForm.tsx
│  │  │  ├─ TicketFilters.tsx
│  │  │  ├─ ArchivedTicketsView.tsx
│  │  │  └─ dnd/
│  │  │     ├─ DndBoardContext.tsx
│  │  │     └─ DraggableTicketCard.tsx
│  │  ├─ comments/
│  │  │  ├─ api.ts
│  │  │  ├─ CommentList.tsx
│  │  │  └─ CommentForm.tsx
│  │  ├─ tags/
│  │  │  ├─ api.ts
│  │  │  └─ TagInput.tsx
│  │  ├─ users/
│  │  │  ├─ api.ts
│  │  │  ├─ UsersPage.tsx
│  │  │  ├─ UserForm.tsx
│  │  │  └─ GeneratedPasswordModal.tsx
│  │  └─ reports/
│  │     ├─ api.ts
│  │     └─ ReportsPage.tsx
│  ├─ components/                 # UI compartida (Button, Field, Banner, Badge, Avatar, SkeletonLoader, Modal)
│  ├─ lib/
│  │  └─ apiClient.ts             # fetch wrapper: base URL, header de autenticacion, manejo de errores
│  ├─ types.ts
│  └─ styles/
│     └─ tokens.css
├─ test/
│  ├─ setup.ts                    # configuracion de Vitest + jest-dom
│  └─ test-utils.tsx              # render() con todos los providers para tests de componentes
├─ index.html
├─ vite.config.ts
├─ vitest.config.ts
├─ tsconfig.json
└─ package.json
```

---

## 7. Rutas y navegación

| Ruta | Página | Acceso |
|---|---|---|
| `/login` | `LoginPage` | Público |
| `/proyectos` | `ProjectsPage` | Autenticado |
| `/proyectos/:id` | `BoardPage` (incluye filtros y alternancia activos/archivados) | Autenticado, sujeto a visibilidad RF-17 |
| `/usuarios` | `UsersPage` | Solo Administrador |
| `/reportes` | `ReportsPage` | Solo Administrador |

El detalle de ticket y sus comentarios **no** tienen ruta propia: se abren como `TicketDrawer` superpuesto sobre `/proyectos/:id`, consistente con `docs/prototype-spec.md` C.5.

---

## 8. Decisiones técnicas del Frontend Engineer (sin impacto en reglas de negocio)

Documentadas aquí para que puedan corregirse antes de aprobar el documento, aunque no se sometieron a votación por no ser ambigüedades de producto:

- **CSS**: se continúa con CSS plano + custom properties (`tokens.css`), sin CSS Modules ni CSS-in-JS, igual que el prototipo actual.
- **Lint/formato**: ESLint (`recommended` + `@typescript-eslint` + `react-hooks`) y Prettier, configuración estándar.
- **Duración de sesión JWT**: 8 horas (ajustable sin impacto de producto).
- **Normalización de etiquetas**: comparación case-insensitive para sugerir/evitar duplicados; se conserva la capitalización tal como la escribió quien la creó.
- **Vista de archivados por proyecto** (no global): ver §4.2.

---

## 9. Fuera de alcance de este documento

- Notificaciones por email (RF-12) y dashboard con gráficos: Fase 2, según `specs.md`.
- Autenticación con cookie `httpOnly`: se evaluó y se descartó para este MVP (decisión #14); si se reconsidera, requiere cambios coordinados en el backend.
- Especificación del backend: este documento asume que la API REST existente se extiende para cubrir las 10 historias de `docs/backlog.md` (comentarios, filtros, archivados, reporte, gestión de usuarios) con los mismos contratos de datos de §3; no redefine rutas ni contratos del servidor.
