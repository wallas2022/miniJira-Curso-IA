# prototype-spec.md — Especificación de Prototipo UI/UX (Mini Jira)

> **Fuente:** `docs/specs.md` (v1.1, APROBADO) y `architecture/er_diagram.md`. Este documento no introduce funcionalidades, roles ni reglas que no se desprendan de un RF/RNF de `specs.md`; ante cualquier divergencia, prevalece `specs.md` (ver `CLAUDE.md`).
> **Propósito:** alimentar la implementación en Claude Code y el prototipado visual en Google Stitch. Todo el contenido (nombres, textos, avatares, cifras) es **placeholder**, no datos reales.
> **Pendientes heredados de `specs.md` que afectan este documento:** orden de columnas del tablero (R-07), regla de asignación de responsables a terceros (R-06), aviso de concurrencia last-write-wins (R-05). Se marcan explícitamente en cada sección donde aplican.

---

## A. Sistema de diseño global (Design Tokens)

Estética objetivo: "estilo Apple" — blanco, limpio, sombras suaves (RF-14) — con modo claro y modo oscuro como parte del MVP (RF-15). Todo valor visual se define como token; ningún componente debe usar valores sueltos hardcodeados (`CLAUDE.md`).

Convención de nombres: prefijo `--mj-` (Mini Jira) + categoría + propósito, p. ej. `--mj-color-bg-canvas`.

### A.1 Color

**Paleta primitiva** (placeholder, ajustable por Product Design):

| Token primitivo | Valor placeholder | Uso |
|---|---|---|
| `--mj-gray-0` … `--mj-gray-900` | escala de 10 pasos, blanco a casi negro | superficies, texto, bordes |
| `--mj-blue-500` | azul primario de marca | acciones primarias, foco, links |
| `--mj-green-500` | verde | éxito, prioridad baja |
| `--mj-amber-500` | ámbar | advertencia, prioridad media |
| `--mj-red-500` | rojo | error, prioridad alta |

**Tokens semánticos** (redefinidos por tema, claro/oscuro):

| Token semántico | Claro | Oscuro |
|---|---|---|
| `--mj-color-bg-canvas` | `--mj-gray-0` (blanco) | `--mj-gray-900` |
| `--mj-color-bg-surface` (cards, modales) | `--mj-gray-0` con sombra | `--mj-gray-800` |
| `--mj-color-border` | `--mj-gray-200` | `--mj-gray-700` |
| `--mj-color-text-primary` | `--mj-gray-900` | `--mj-gray-0` |
| `--mj-color-text-secondary` | `--mj-gray-600` | `--mj-gray-300` |
| `--mj-color-action-primary` | `--mj-blue-500` | `--mj-blue-500` (ajustado en luminosidad si el contraste AA lo exige) |
| `--mj-color-focus-ring` | `--mj-blue-500` a 3px con offset | mismo, verificado sobre fondo oscuro |
| `--mj-color-priority-baja` | `--mj-green-500` | equivalente ajustado a AA sobre fondo oscuro |
| `--mj-color-priority-media` | `--mj-amber-500` | ídem |
| `--mj-color-priority-alta` | `--mj-red-500` | ídem |
| `--mj-color-status-success` / `-error` / `-warning` / `-info` | derivados de verde/rojo/ámbar/azul | ídem |

Regla obligatoria: cada par claro/oscuro debe validarse independientemente contra los mínimos de contraste de la sección B antes de darse por definitivo (no basta con invertir la escala de grises).

### A.2 Tipografía

| Token | Valor placeholder |
|---|---|
| `--mj-font-family-base` | `-apple-system, "Segoe UI", Roboto, sans-serif` |
| `--mj-font-family-mono` | usado solo en fechas/IDs técnicos si aplica |
| `--mj-font-size-display` / `h1` / `h2` / `h3` / `body` / `caption` | escala tipográfica de 6 pasos |
| `--mj-font-weight-regular` / `-medium` / `-semibold` | 400 / 500 / 600 |
| `--mj-line-height-tight` / `-base` / `-relaxed` | para títulos, cuerpo y bloques largos (descripción, comentarios) |

### A.3 Espaciado y layout

| Token | Valor placeholder |
|---|---|
| `--mj-space-1` … `--mj-space-8` | escala base 4px (4, 8, 12, 16, 24, 32, 48, 64) |
| `--mj-radius-sm` / `-md` / `-lg` / `-pill` | 4px / 8px / 16px / 999px |
| `--mj-shadow-sm` / `-md` / `-lg` | sombras suaves y difusas (estilo "Apple"), nunca duras |
| `--mj-breakpoint-sm` / `-md` / `-lg` | mobile / tablet / desktop, para tablero y formularios responsivos |
| `--mj-z-dropdown` / `-modal` / `-toast` | escala de apilamiento consistente |

### A.4 Movimiento

| Token | Valor placeholder |
|---|---|
| `--mj-duration-fast` / `-base` / `-slow` | 100ms / 200ms / 320ms |
| `--mj-easing-standard` | curva estándar de entrada/salida |

Toda animación debe respetar `prefers-reduced-motion` (ver sección B).

### A.5 Iconografía y componentes base

- Un único set de iconos (line icons, trazo consistente), tamaños `16 / 20 / 24px` ligados a `--mj-space-*`.
- Componentes base reutilizables que consumen estos tokens: `Button` (primario/secundario/destructivo/texto), `Input`, `Select`, `TagInput`, `Avatar` (con iniciales como fallback), `Badge` (prioridad/estado), `Modal`/`Drawer`, `Toast`, `EmptyState`, `SkeletonLoader`, `Tabs`, `Tooltip`.

---

## B. Estándares WCAG 2.1 AA + usabilidad

Aplica a toda la interfaz (RNF-03, `CLAUDE.md`). Es un checklist transversal a todas las pantallas de la sección C.

### B.1 Contraste
- Texto normal: mínimo **4.5:1**; texto grande (≥18px o ≥14px bold): mínimo **3:1**. Verificar en ambos temas (claro y oscuro), no solo en claro.
- Componentes de UI e íconos con significado (bordes de input, badges de prioridad, foco): mínimo **3:1** contra el fondo adyacente.
- El color nunca es el único portador de significado: la prioridad muestra color **+ ícono + texto** ("Alta"/"Media"/"Baja"); los estados de error muestran color **+ ícono + mensaje**.

### B.2 Navegación por teclado
- Toda acción alcanzable con mouse debe serlo con teclado, en un orden de tabulación lógico (izquierda→derecha, arriba→abajo).
- Foco siempre visible mediante `--mj-color-focus-ring`; nunca se remueve el outline sin un reemplazo igual o más visible.
- El tablero Kanban (drag-and-drop) debe tener una alternativa 100% accesible por teclado: al enfocar una tarjeta, una acción "Mover a…" abre un menú con los 4 estados como opciones.
- Modales/drawers: atrapan el foco mientras están abiertos, `Esc` cierra, y al cerrar el foco regresa al elemento que los abrió.

### B.3 Roles y ARIA
- Landmarks semánticos: `header`, `nav`, `main` en cada pantalla.
- Modales con `role="dialog"` y `aria-modal="true"`; formularios con `<label>` asociado a cada input y errores anunciados vía `aria-describedby`.
- Cambios de estado async (mover ticket, guardar, error) anunciados a lectores de pantalla vía región `aria-live="polite"` (o `assertive` para errores bloqueantes).
- Botones solo-ícono siempre llevan `aria-label` descriptivo.

### B.4 Usabilidad y feedback
- Cada acción que involucra red debe cubrir explícitamente 4 estados: **loading** (skeleton o spinner, nunca pantalla en blanco), **éxito** (toast o feedback inline breve), **error** (mensaje claro + acción de reintento cuando aplique), **vacío** (mensaje + CTA principal, nunca solo "no hay datos").
- Mensajes de error son específicos y accionables ("El título es obligatorio", no "Error"); excepción deliberada: el error de credenciales de login es genérico por seguridad (ver C.1).
- Flujos cortos: crear un ticket o proyecto no debe requerir más de una pantalla/paso salvo confirmaciones destructivas (archivar).
- Textos alternativos en toda imagen/avatar/ilustración de estado vacío.
- Tamaño mínimo de objetivo táctil: 44×44px en controles interactivos.
- Todo el contenido de este documento es placeholder; los textos reales de UI se redactan en la fase de contenido/copy, no aquí.

---

## C. Funcionalidades del MVP

Cada subsección corresponde a una funcionalidad identificada en `specs.md`, con su RF de origen.

### C.1 Autenticación (login)
**RF de origen:** RF-07.

- **Propósito:** dar acceso mediante email + contraseña; no existe registro público, las cuentas las crea el Administrador.
- **Componentes:** logo/marca, `Input` email, `Input` contraseña (con toggle mostrar/ocultar), `Button` primario "Iniciar sesión", banner de error genérico.
- **Layout:** tarjeta centrada, ancho máx. ~400px, fondo `--mj-color-bg-canvas`, sin navegación lateral.
- **Estados:**
  - Vacío/inicial: formulario listo, foco en campo email.
  - Loading: botón con spinner, inputs deshabilitados.
  - Error: banner genérico ("Email o contraseña incorrectos") — deliberadamente inespecífico para no revelar qué campo falló (RNF-04).
  - Éxito: redirección al listado de proyectos.

### C.2 Gestión de cuentas de usuario (solo Administrador)
**RF de origen:** RF-07, matriz 5.1 ("Crear/desactivar cuentas de usuario").

- **Propósito:** el Administrador da de alta y desactiva cuentas, ya que no hay registro público.
- **Componentes:** tabla (email placeholder, rol, estado activo/inactivo, fecha de alta), `Button` "Nuevo usuario" → modal (email, contraseña temporal, rol Administrador/Usuario), toggle activar/desactivar por fila con confirmación.
- **Layout:** vista de administración accesible solo desde un ítem de navegación visible únicamente para rol Administrador.
- **Estados:** loading (filas skeleton), vacío ("Aún no hay usuarios además de tu cuenta"), error de carga, confirmación modal antes de desactivar, toast de éxito al crear/desactivar.
- **Nota de permisos:** esta pantalla no debe ser alcanzable ni por URL directa para un Usuario (autorización validada en backend, RNF-04).

### C.3 Proyectos
**RF de origen:** RF-04, RF-17.

- **Propósito:** crear, editar y listar proyectos. Visibilidad restringida: Usuario ve solo los que creó o donde tiene un ticket asignado; Administrador ve todos.
- **Componentes:** grid de `Card` de proyecto (nombre, descripción corta, contador de tickets, creador), `Button` "Nuevo proyecto" → modal/formulario (nombre*, descripción), acceso a "Editar" visible solo si el usuario es el creador o es Administrador.
- **Layout:** grid responsivo (1 columna en mobile, 3–4 en desktop), header simple con el botón de creación.
- **Estados:** loading (cards skeleton), vacío ("Todavía no tienes proyectos — crea el primero"), error de carga/guardado, validación inline (nombre obligatorio), toast de éxito.

### C.4 Tablero Kanban de tickets
**RF de origen:** RF-10, RF-01/RF-02 (archivado oculta del tablero), RF-17.

- **Propósito:** visualizar y mover tickets de un proyecto entre los 4 estados fijos.
- **Componentes:** selector/breadcrumb de proyecto activo, 4 columnas con título y contador ("Por hacer", "En progreso", "Review", "Terminado"), `Card` de ticket (título, `Badge` de prioridad, avatares de responsables, chips de etiquetas), `Button` "Nuevo ticket", barra de filtros (ver C.7).
- **Layout:** 4 columnas de ancho fijo con scroll horizontal en mobile; cada columna con scroll vertical independiente.
- **Estados:** loading (columnas skeleton), columna vacía ("Sin tickets"), tablero vacío (proyecto sin tickets aún), tarjeta no autorizada para mover (Usuario no creador/asignado: la tarjeta se muestra sin controlador de arrastre y con tooltip explicando por qué), error al mover (revertir visualmente + toast).
- **Pendiente marcado en `specs.md` (R-07):** el orden mostrado arriba (Por hacer → En progreso → Review → Terminado) es el placeholder adoptado por `specs.md` hasta confirmación del PO/PM; no fijar en código de producción sin esa confirmación.

### C.5 Detalle de ticket (crear/editar)
**RF de origen:** RF-08, RF-09a, RF-09b, RF-05, RF-01/RF-02, RF-16.

- **Propósito:** gestionar todos los campos de un ticket, sus responsables, etiquetas y su archivado.
- **Componentes:** `Input` título* (obligatorio), `Textarea` descripción, `Select` estado, `Select` prioridad (Baja/Media/Alta), proyecto (fijo si se abre desde el tablero), selector múltiple de responsables (autocomplete de usuarios), `TagInput` de etiquetas (creación libre al vuelo), campo fecha, metadata de solo lectura (creador, fecha de creación/actualización, fecha de cierre si el estado es "Terminado"), banner informativo "Última actualización por {usuario} el {fecha}", `Button` destructivo "Eliminar" (archivar, con confirmación), sección de comentarios (ver C.6).
- **Layout:** panel lateral deslizante (`Drawer`) sobre el tablero en desktop; pantalla completa en mobile.
- **Estados:** loading skeleton, guardado con estado "Guardando…"/"Guardado", error de validación (título vacío), confirmación modal antes de archivar, toast de éxito, campos deshabilitados con tooltip cuando el Usuario no es creador ni responsable.
- **Reglas de permisos aplicadas en la UI (validadas también en backend, RNF-04):**
  - Usuario edita/mueve/archiva solo tickets propios o donde es responsable; Administrador, cualquiera.
  - Asignación de responsables: Administrador asigna a cualquiera; Usuario, según el supuesto pendiente de `specs.md` (R-06), solo puede autoasignarse — el selector de responsables para Usuario se limita a su propio nombre hasta que se confirme la regla.
- **Pendiente marcado en `specs.md` (R-05):** no existe detección de conflictos (last-write-wins); el banner de "última actualización por" es la única mitigación de UI prevista, no un bloqueo de edición.

### C.6 Comentarios
**RF de origen:** RF-11.

- **Propósito:** permitir comentarios dentro de un ticket, con autor y fecha visibles.
- **Componentes:** lista de comentarios (avatar, nombre de autor placeholder, fecha relativa, contenido), `Textarea` "Agregar comentario" + `Button` enviar.
- **Layout:** sección inferior del panel de detalle de ticket (C.5), con scroll interno propio si la lista es larga.
- **Estados:** loading, vacío ("Sé el primero en comentar"), error al enviar (con reintento), éxito (el comentario aparece al final de la lista de forma optimista).

### C.7 Filtrado de tickets
**RF de origen:** RF-09, RF-09a, RF-09b, RF-17.

- **Propósito:** filtrar tickets por fecha, prioridad, responsable, proyecto y etiquetas, de forma combinable, siempre dentro del alcance de visibilidad del usuario.
- **Componentes:** barra/panel de filtros con selects múltiples (prioridad, responsable, etiquetas), selector de rango de fecha, selector de proyecto; chips de filtros activos con botón para quitar cada uno; `Button` "Limpiar filtros".
- **Layout:** barra horizontal colapsable sobre el tablero (C.4) en desktop; panel deslizable en mobile.
- **Estados:** sin filtros (default), filtros activos (contador de resultados visible), sin resultados ("Ningún ticket coincide con los filtros aplicados").

### C.8 Tickets archivados
**RF de origen:** RF-01, RF-02.

- **Propósito:** dar acceso a los tickets "eliminados" (archivo lógico). El Administrador ve los archivados de cualquier usuario con traza de quién archivó y es el único que puede restaurar; un Usuario solo ve los que él mismo archivó.
- **Componentes:** tabla/lista (título, proyecto, archivado por, fecha de archivado), `Button` "Restaurar" (visible solo para Administrador).
- **Layout:** vista accesible desde un ítem de navegación "Archivados".
- **Estados:** loading, vacío ("No hay tickets archivados"), confirmación antes de restaurar, toast de éxito.

### C.9 Reporte mensual de tickets cerrados
**RF de origen:** RF-13.

- **Propósito:** vista simple (tabla, sin gráficos) de tickets cerrados por mes y proyecto, accesible solo para Administrador.
- **Componentes:** selector de mes/año, selector de proyecto (con opción "Todos"), tabla de resultados (proyecto, mes, cantidad de tickets cerrados).
- **Layout:** página simple de una sola tabla, sin visualizaciones gráficas (fuera de alcance, `CLAUDE.md`).
- **Estados:** loading, vacío ("No se cerraron tickets en este período"), error de carga.

### C.10 Modo claro / oscuro
**RF de origen:** RF-15.

- **Propósito:** alternar entre tema claro y oscuro conservando el contraste AA definido en la sección A.1/B.1.
- **Componentes:** `Toggle` con ícono sol/luna en el header global, con `aria-pressed` reflejando el estado.
- **Layout:** control persistente en la barra de navegación superior, visible en todas las pantallas autenticadas.
- **Comportamiento:** por defecto sigue `prefers-color-scheme` del sistema; la preferencia explícita del usuario se recuerda entre sesiones; el cambio de tema no debe producir parpadeo (FOUC) ni interrumpir animaciones en curso (respetando `prefers-reduced-motion`, sección B.4).

---

## D. Trazabilidad rápida (funcionalidad → RF)

| Funcionalidad (sección C) | RF de origen |
|---|---|
| C.1 Autenticación | RF-07 |
| C.2 Gestión de usuarios | RF-07, matriz 5.1 |
| C.3 Proyectos | RF-04, RF-17 |
| C.4 Tablero Kanban | RF-10, RF-01, RF-02, RF-17 |
| C.5 Detalle de ticket | RF-08, RF-09a, RF-09b, RF-05, RF-01, RF-02, RF-16 |
| C.6 Comentarios | RF-11 |
| C.7 Filtrado | RF-09, RF-17 |
| C.8 Archivados | RF-01, RF-02 |
| C.9 Reporte mensual | RF-13 |
| C.10 Modo claro/oscuro | RF-15 |

No se incluye ninguna pantalla para notificaciones por email ni dashboard de métricas con gráficos: ambos son Fase 2 / fuera de alcance del MVP (`specs.md`, §2).
