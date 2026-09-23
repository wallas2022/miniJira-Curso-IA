# specs.md — Mini Jira

> **Fuente única de verdad del proyecto** (ver `CLAUDE.md`). Toda decisión de código debe alinearse con este documento; si diverge, se corrige el código o se actualiza este archivo explícitamente.

**Estado del documento:** APROBADO v1.1 — 23 de septiembre de 2026.
Generado a partir de la transcripción del kick-off (24 de octubre) y de la sesión de decisiones del PO/PM que cerró las 13 preguntas críticas de la Fase 1 (v1.0). **Esta versión (v1.1) reemplaza varias de esas decisiones** a partir de una segunda ronda de respuestas del PO/PM organizada en 4 bloques (A–D, 23/09/2026). Las decisiones se citan como **(Decisión PO/PM, P#)**; donde v1.1 cambió una decisión de v1.0, se indica explícitamente.

### Historial de versiones
- **v1.0** (kick-off + primera ronda de decisiones): línea base inicial.
- **v1.1** (23/09/2026, segunda ronda — Bloques A–D): cambia el modelo de permisos, el modelo Ticket↔Proyecto, la asignación de responsables, los estados del tablero, la política de concurrencia y el alcance del modo oscuro. Ver detalle en cada sección y en el registro de decisiones (§7).

---

## 1. Objetivos

- Construir "Mini Jira", una herramienta interna de gestión de tareas para un equipo de ~10 personas (Transcripción, Roberto, línea 6).
- Entregar la primera versión funcional en producción en un **máximo de 3 semanas**, cubriendo desarrollo, pruebas y despliegue (Transcripción, Roberto, líneas 6–7; Decisión PO/PM, P1).
- El plazo es fijo y el alcance In-Scope de este documento se entrega completo (Decisión PO/PM, P1). Ver riesgo R-01 en la sección 8.

> **Pendiente de aclaración:** en la segunda ronda (Bloque D, pregunta 13) el PO/PM respondió "vamos a dejar establecido 3 semanas de holgura", lo cual es ambiguo: no queda claro si son 3 semanas de margen *adicionales* al plazo o si el plazo *es* esa holgura. Hasta que se confirme, este documento mantiene la lectura de v1.0 (plazo fijo de 3 semanas, sin margen adicional). No modificar RNF-01 sin confirmación explícita.

## 2. In-Scope / Out-of-Scope

### In-Scope (MVP)
- Gestión de tickets: crear, editar y "eliminar" (archivo lógico) (Transcripción, Roberto, línea 18; Laura, línea 49).
- Proyectos como entidad propia; un ticket pertenece a **un único proyecto** (Decisión PO/PM, P2 — **cambiado en v1.1**, antes muchos-a-muchos).
- Asignación de **uno o varios responsables** por ticket (Decisión PO/PM, P8 — **cambiado en v1.1**, antes un único responsable).
- Tablero Kanban de **4 estados**: Por hacer / En progreso / Review / Terminado (Decisión PO/PM, P7 — **cambiado en v1.1**, antes 3 estados sin Review).
- Comentarios dentro de un ticket (Transcripción, Laura, línea 40).
- Filtrado por fecha, prioridad, responsable, proyecto y etiquetas (Transcripción, Marcos, línea 27; Laura, línea 28).
- Roles Administrador / Usuario con permisos definidos en la sección 5.1 (Decisión PO/PM, P4 — **matriz actualizada en v1.1**).
- Autenticación propia con email + contraseña (Decisión PO/PM, P3).
- Concurrencia resuelta por **last-write-wins**, sin bloqueo optimista (Decisión PO/PM, P5 — **cambiado en v1.1**, antes bloqueo optimista con HTTP 409).
- Visibilidad de proyectos restringida para el rol Usuario: solo ve los proyectos que creó o en los que tiene al menos un ticket asignado; el Administrador ve todos (Decisión PO/PM, P2 — **nuevo en v1.1**).
- Vista simple de **tickets cerrados por mes y por proyecto** para el reporte mensual (sin gráficos) (Decisión PO/PM, P11).
- Interfaz limpia y moderna (estilo "Apple": blanco, limpio, sombras suaves), **con modo claro y modo oscuro** (Transcripción, Laura, líneas 9, 55, 64; Decisión PO/PM, P12 — **cambiado en v1.1**: modo oscuro pasa de Fase 2 a requisito de MVP).

### Resolución de la contradicción: email y dashboard
- **Notificaciones por email:** fuera del MVP, pasan a Fase 2. Prevalece `CLAUDE.md` (Decisión PO/PM, P10).
- **Dashboard de métricas:** fuera del MVP. Se sustituye por una vista simple de conteo de tickets cerrados por mes/proyecto que cubre el reporte mensual de Roberto (Decisión PO/PM, P11). Esto no contradice `CLAUDE.md`, que excluye los *dashboards de métricas* y *analytics avanzados*, no una consulta de conteo.

### Out-of-Scope
- Heredado de `CLAUDE.md`: SSO/autenticación multi-tenant empresarial, permisos granulares avanzados, integraciones con terceros (Slack, GitHub, webhooks, email), aplicaciones móviles nativas, tiempo real (websockets/colaboración en vivo), migraciones de datos desde otras herramientas, reportes/analytics avanzados y dashboards de métricas.
- Registro público de usuarios (las cuentas las crea el Administrador) (Decisión PO/PM, P3).
- Estados de tablero configurables por proyecto (Decisión PO/PM, P7).
- Bloqueo optimista / detección de conflictos de edición (Decisión PO/PM, P5 — **eliminado del alcance en v1.1**; ver riesgo R-05).

### Fase 2 (acordado, fuera del MVP)
- Notificaciones por email al mencionar o asignar (Decisión PO/PM, P10).
- Dashboard de métricas con gráficos, si se aprueba (Decisión PO/PM, P11).

> Modo oscuro **ya no está en Fase 2**: pasó a ser requisito de MVP en v1.1 (Decisión PO/PM, P12).

## 3. Stack Tecnológico

Confirmado formalmente (Decisión PO/PM, P13):

| Capa | Tecnología |
|------|-----------|
| Frontend | React |
| Backend | Node.js |
| Base de datos | **SQLite** (relacional) |
| Acceso a datos | **ORM Prisma** (migraciones y tipos generados) |

- Se usa SQLite en lugar de PostgreSQL. Con ~10 usuarios la carga es baja; Prisma permite migrar a PostgreSQL en el futuro cambiando sobre todo la configuración del datasource.
- Consecuencia: `CLAUDE.md` debe actualizarse para pasar el stack de "tentativo" a definitivo con SQLite + Prisma.

## 4. Supuestos

- Equipo de ~10 personas como orden de magnitud de carga/uso (Transcripción, Roberto, línea 6).
- **(Actualizado en v1.1)** No todos los usuarios ven todos los proyectos: el Administrador ve todos; un Usuario normal ve solo los proyectos que creó o en los que tiene al menos un ticket asignado (Decisión PO/PM, P2).
- **Supuesto pendiente de validación:** se interpreta "asignado a un proyecto" como *tener al menos un ticket de ese proyecto asignado como responsable*. No hay concepto explícito de "membresía de proyecto" en las respuestas del PO/PM; si existiera un mecanismo distinto, debe confirmarse y actualizar RF-04.
- **Supuesto pendiente de validación:** las respuestas del PO/PM confirman que un ticket puede tener varios responsables (Decisión PO/PM, P8), pero no aclaran si un Usuario normal puede asignar a **otros** usuarios o solo asignarse a **sí mismo**. Hasta confirmar, se asume que un Usuario puede asignarse a sí mismo en tickets propios, y que asignar a terceros quedaría reservado al Administrador. Ver riesgo R-06.
- Existe al menos un Administrador inicial, creado en el despliegue (seed), que da de alta al resto de cuentas (Decisión PO/PM, P3).
- Una sola instancia del backend accede a la base SQLite (SQLite no está pensado para varios servidores escribiendo en paralelo).

## 5. Requerimientos Funcionales

### 5.1 Matriz de permisos (Decisión PO/PM, P2, P4, P6, P8 — **actualizada en v1.1**)

| Acción | Administrador | Usuario |
|--------|:---:|:---:|
| Ver todos los proyectos y tickets | ✅ | ❌ (solo los propios o donde tiene ticket asignado) |
| Crear proyecto | ✅ | ✅ |
| Editar proyecto | ✅ | ✅ (solo los propios) |
| Crear ticket | ✅ | ✅ |
| Editar ticket | ✅ (cualquiera) | ✅ (solo los propios) |
| Mover ticket entre estados | ✅ (cualquiera) | ✅ (solo propios o asignados) |
| Comentar | ✅ | ✅ |
| Asignar / reasignar responsable | ✅ (a cualquier ticket) | ⚠️ Pendiente de confirmación — se asume: solo a sí mismo en tickets propios |
| "Eliminar" (archivar) tickets propios | ✅ | ✅ |
| "Eliminar" (archivar) tickets de terceros | ✅ (con soft-delete y traza de quién archivó) | ❌ |
| Restaurar tickets archivados | ✅ | ❌ |
| Crear / desactivar cuentas de usuario | ✅ | ❌ |

### 5.2 Requerimientos

| ID | Requerimiento | Fuente | Estado |
|----|---------------|--------|--------|
| RF-01 | El sistema debe permitir **crear y editar** tickets, y ofrecer un botón **"Eliminar"** que archiva el ticket. | Transcripción, Roberto, línea 18 | Cerrado |
| RF-02 | "Eliminar" es un **archivo lógico** (soft-delete): el ticket no se borra físicamente, se oculta del tablero y los filtros. Un **Usuario** puede archivar solo **sus propios** tickets. El **Administrador** puede archivar tickets de **cualquier** usuario, dejando registro de quién archivó (traza de auditoría), y es el único que puede **restaurar** tickets archivados. | Transcripción, Laura, línea 49; Decisión PO/PM, P6 (**cambiado en v1.1**: antes solo Admin archivaba) | Cerrado |
| RF-03 | Un ticket pertenece a **un único proyecto** (relación uno-a-muchos: un proyecto tiene muchos tickets). Es obligatorio al crear el ticket. | Decisión PO/PM, P2 (**cambiado en v1.1**: antes muchos-a-muchos) | Cerrado |
| RF-04 | El **Proyecto** es una entidad propia (nombre, descripción, creador). Tanto **Administrador** como **Usuario** pueden crear y editar proyectos (un Usuario solo edita los proyectos que él mismo creó). Visibilidad: el **Administrador** ve todos los proyectos; un **Usuario** ve solo los proyectos que creó o aquellos en los que tiene al menos un ticket asignado. | Decisión PO/PM, P2 (**cambiado en v1.1**: antes solo Admin creaba y todos veían todo) | Cerrado |
| RF-05 | Cada ticket puede tener **cero, uno o varios responsables** (relación muchos-a-muchos entre ticket y usuario). Un Usuario puede asignarse a sí mismo en sus propios tickets; asignar a terceros queda reservado al Administrador (**pendiente de confirmación**, ver supuesto en §4 y riesgo R-06). | Decisión PO/PM, P8 (**cambiado en v1.1**: antes un único responsable, solo asignaba el Admin) | Cerrado, con pendiente |
| RF-06 | El sistema distingue los roles **Administrador** y **Usuario** con los permisos de la matriz 5.1. | Transcripción, Laura, línea 15; Decisión PO/PM, P4 | Cerrado |
| RF-07 | Acceso con **login propio (email + contraseña)**. No hay registro público: el Administrador crea las cuentas. Contraseñas almacenadas con hash seguro (p. ej. bcrypt/argon2). | Transcripción, Sofía, línea 14; Decisión PO/PM, P3 | Cerrado |
| RF-08 | Campos del ticket: **título** (obligatorio), **descripción**, **estado**, **prioridad**, **etiquetas**, **proyecto**, **responsable(s)**, **fecha**, **creador**, **fecha de creación**, **fecha de actualización** y **fecha de cierre** (al pasar a "Terminado"). | Transcripción, Laura, línea 26; Marcos, línea 27; Decisión PO/PM, P9 | Cerrado |
| RF-09 | Filtrar tickets por **fecha**, **prioridad**, **responsable**, **proyecto** y **etiquetas**, combinables entre sí, dentro del alcance de visibilidad del usuario (§5.1). | Transcripción, Marcos, línea 27; Laura, línea 28 | Cerrado |
| RF-09a | **Prioridad**: valor fijo entre **Baja / Media / Alta**. | Decisión PO/PM, P9 | Cerrado |
| RF-09b | **Etiquetas**: texto libre, varias por ticket, las crea cualquier usuario al editar el ticket. | Decisión PO/PM, P9 | Cerrado |
| RF-10 | Tablero Kanban con **4 estados fijos**: **Por hacer / En progreso / Review / Terminado**. | Transcripción, Laura y Marcos, línea 28; Decisión PO/PM, P7 (**cambiado en v1.1**: antes 3 estados sin "Review") | Cerrado, con pendiente |
| RF-11 | El sistema debe permitir **comentarios** dentro de un ticket (autor y fecha visibles). | Transcripción, Laura, línea 40 | Cerrado |
| RF-12 | Notificaciones por email al mencionar o asignar. | Transcripción, Laura, línea 40 | **Fase 2** (Decisión PO/PM, P10) |
| RF-13 | Vista simple de **número de tickets cerrados por mes y por proyecto** (tabla, sin gráficos), accesible al Administrador. | Transcripción, Laura, línea 44; Roberto, línea 45; Decisión PO/PM, P11 | Cerrado |
| RF-14 | Interfaz fácil de usar, estética limpia y moderna (blanco, limpio, sombras suaves), construida con Design Tokens. | Transcripción, Laura, líneas 9, 55; Decisión PO/PM, P12 | Cerrado |
| RF-15 | Modo oscuro, implementado con los mismos Design Tokens de RF-14 (paleta oscura alternativa). **Forma parte del MVP**, no de Fase 2. | Transcripción, Laura, línea 64; Decisión PO/PM, P12 (**cambiado en v1.1**: antes Fase 2) | Cerrado |
| RF-16 | Edición concurrente resuelta por **last-write-wins**: si dos usuarios editan el mismo ticket y ambos guardan, gana la última escritura; no se detecta ni se avisa el conflicto, y el cambio anterior puede perderse silenciosamente. | Transcripción, Sofía, línea 38; Decisión PO/PM, P5 (**cambiado en v1.1**: antes bloqueo optimista con HTTP 409) | Cerrado (ver riesgo R-05) |
| RF-17 | El sistema restringe la visibilidad de proyectos y tickets para el rol Usuario a los que creó o a aquellos donde tiene al menos un ticket asignado como responsable; el Administrador ve todos. | Decisión PO/PM, P2 | Cerrado, con pendiente (ver supuesto §4) |

> **RF-10, pendiente de confirmación:** el orden de columnas se fija como *Por hacer → En progreso → Review → Terminado* por ser el flujo lógico habitual (Review antes de dar por Terminado). La respuesta del PO/PM listó los estados como "Por hacer, En progreso, Terminado, Review", sin especificar el orden del tablero. Confirmar con el PO/PM antes de fijarlo en la UI.

## 6. Requerimientos No Funcionales

| ID | Requerimiento | Fuente | Estado |
|----|---------------|--------|--------|
| RNF-01 | Plazo máximo de **3 semanas** hasta producción (desarrollo + pruebas + despliegue), con el alcance In-Scope completo. | Transcripción, Roberto, líneas 6–7; Decisión PO/PM, P1 | Cerrado (ver riesgo R-01; pendiente de aclaración sobre "holgura", §1) |
| RNF-02 | Rendimiento: carga inicial del tablero **< 2 s**; respuesta de la API **p95 < 500 ms** con ~10 usuarios concurrentes. | Transcripción, Laura, línea 35; Decisión PO/PM | Cerrado |
| RNF-03 | Accesibilidad y estándares de UI: **WCAG 2.1 AA** y Design Tokens, incluyendo contraste suficiente en modo oscuro (RF-15). | `CLAUDE.md` | Vigente por convención |
| RNF-04 | Seguridad básica: contraseñas con hash, sesiones con expiración, autorización por rol validada en el backend (no solo en la UI), incluyendo el filtrado de visibilidad de proyectos (RF-17). | Derivado de RF-06, RF-07 y RF-17 | Cerrado |

## 7. Registro de decisiones (antes: preguntas abiertas)

| # | Pregunta | Decisión v1.0 | Decisión v1.1 (vigente) |
|---|----------|----------|----------|
| P1 | Plazo de 3 semanas | Fijo, máximo 3 semanas | Se mantiene fijo; respuesta ambigua sobre "holgura" pendiente de aclarar (§1) |
| P2 | Modelo de Proyecto / Ticket | Muchos-a-muchos; solo Admin crea; todos ven todo | **Ticket→Proyecto uno-a-muchos; Admin y Usuario crean proyectos; visibilidad restringida para Usuario (solo propios o asignados)** |
| P3 | Autenticación | Login propio email + contraseña; cuentas creadas por Admin | Sin cambios |
| P4 | Permisos por rol | Ver matriz 5.1 (v1.0) | **Ver matriz 5.1 actualizada** |
| P5 | Concurrencia | Bloqueo optimista (campo `version`, HTTP 409) | **Last-write-wins, sin detección de conflicto** |
| P6 | Archivar | Solo Admin; puede restaurar | **Usuario archiva sus propios tickets; Admin archiva cualquiera (con traza) y es el único que restaura** |
| P7 | Estados del tablero | 3: Por hacer / En progreso / Listo | **4: Por hacer / En progreso / Review / Terminado** (orden pendiente de confirmar) |
| P8 | Asignación | Un responsable; solo Admin asigna | **Uno o varios responsables; quién puede asignar a terceros queda pendiente de confirmar** |
| P9 | Prioridad y etiquetas | Baja/Media/Alta; etiquetas libres, varias por ticket | Sin cambios |
| P10 | Email | Fuera del MVP → Fase 2 | Sin cambios |
| P11 | Dashboard | Fuera del MVP; se sustituye por vista simple de conteo | Sin cambios |
| P12 | Estilo visual / modo oscuro | Estilo limpio en MVP; modo oscuro → Fase 2 | **Modo oscuro pasa a ser requisito del MVP** |
| P13 | Stack | React + Node.js + SQLite + Prisma | Sin cambios |

## 8. Riesgos

| ID | Riesgo | Mitigación |
|----|--------|------------|
| R-01 | El Tech Lead cuestionó la viabilidad del plazo (Transcripción, líneas 36, 46, 54) y se mantiene el alcance completo con plazo fijo; v1.1 además **agrega** alcance (modo oscuro pasa a MVP, 4 estados en vez de 3, visibilidad por proyecto). | Ya se sacaron del MVP email y dashboard. Si a mitad de la semana 2 hay retraso, el PO/PM decide qué RF pasa a Fase 2 y se actualiza este archivo. Vigilar especialmente RF-15 y RF-17 por ser alcance nuevo de v1.1. |
| R-03 | El modelo de múltiples responsables por ticket (P8) sin reglas claras de quién asigna a terceros puede generar asignaciones descoordinadas. | Confirmar con el PO/PM la regla de asignación (R-06) antes de implementar el endpoint de asignación. |
| R-04 | SQLite limita el escalado horizontal. | Suficiente para ~10 usuarios; Prisma facilita migrar a PostgreSQL si crece. |
| R-05 | **(Nuevo en v1.1)** Last-write-wins (RF-16) puede provocar pérdida silenciosa de cambios cuando dos usuarios editan el mismo ticket a la vez, sin aviso al usuario perjudicado. | Aceptado explícitamente por el PO/PM. Documentar el comportamiento en la UI (p. ej. mostrar "última actualización por X" al abrir el ticket) para mitigar sorpresas, sin implementar bloqueo. |
| R-06 | **(Nuevo en v1.1)** No está confirmado si un Usuario normal puede asignar responsables a **otros** usuarios o solo a sí mismo (P8). | Confirmar con el PO/PM antes de implementar RF-05. Hasta entonces, se implementa la regla más restrictiva (autoasignación) documentada como supuesto en §4. |
| R-07 | **(Nuevo en v1.1)** El orden de las columnas del tablero (Review antes o después de Terminado) no fue confirmado explícitamente por el PO/PM (P7). | Confirmar orden antes de fijar la UI del tablero; ver nota en RF-10. |

---

**Siguiente paso:** actualizar `CLAUDE.md` para reflejar el stack definitivo (SQLite + Prisma) y el alcance de Fase 2 vigente (solo email y dashboard). Antes de iniciar el diseño técnico (modelo de datos y API), resolver los pendientes marcados en v1.1: orden de columnas del tablero (R-07), regla de asignación a terceros (R-06) y la aclaración sobre "holgura" del plazo (§1).
