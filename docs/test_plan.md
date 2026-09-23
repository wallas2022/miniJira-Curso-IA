# test_plan.md — Plan de Pruebas MVP (Mini Jira)

> Fuentes: `docs/backlog.md` (historias y criterios de aceptación en Gherkin) y `docs/specs.md` v1.1 (fuente única de verdad de requerimientos). Cada caso de prueba referencia el escenario Gherkin que lo origina y el/los RF/RNF cubiertos.

## Convenciones
- **ID**: `TC-H{n}-{seq}` = caso de prueba derivado de un criterio de aceptación de la Historia n del backlog. `EC-{seq}` = edge case crítico identificado por QA, no presente aún en backlog.md.
- **Tipo**: Funcional (F), Seguridad (S), Rendimiento (R), Accesibilidad (A).
- No se agregan pruebas para requisitos fuera del MVP (RF-12) ni fuera de `specs.md`.

---

## 1. Casos de prueba por criterio de aceptación (backlog.md)

### Historia 1 — Autenticación

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H1-01 | Inicio de sesión exitoso | Con una cuenta activa creada por Admin, ingresar email y contraseña correctos y enviar el formulario | Acceso concedido con los permisos del rol de la cuenta | RF-07 | F |
| TC-H1-02 | No existe registro público | Buscar en la pantalla de acceso alguna opción de alta de cuenta | No existe opción de autorregistro | RF-07 | F |
| TC-H1-03 | Credenciales incorrectas | Ingresar email correcto + contraseña incorrecta (y viceversa) | Acceso rechazado con mensaje genérico, sin indicar qué dato falló | RF-07, RNF-04 | S |
| TC-H1-04 | Sesión expirada | Dejar expirar la sesión y luego intentar cualquier acción | El sistema exige reautenticación antes de ejecutar la acción | RNF-04 | S |

### Historia 2 — Gestión de proyectos

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H2-01 | Crear un proyecto | Usuario o Admin crea proyecto con nombre y descripción | Proyecto creado, creador = usuario actual | RF-04 | F |
| TC-H2-02 | Editar un proyecto propio | El creador edita nombre/descripción | Cambios guardados | RF-04 | F |
| TC-H2-03 | Visibilidad total para Administrador | Con proyectos de distintos creadores, Admin lista proyectos | Ve todos los proyectos | RF-17 | F |
| TC-H2-04 | Visibilidad restringida para Usuario | Usuario A creó Proyecto1; tiene ticket asignado en Proyecto2; Proyecto3 no le pertenece ni tiene tickets | Usuario A ve Proyecto1 y Proyecto2, no ve Proyecto3 | RF-17 | F |
| TC-H2-05 (edge) | Edición no autorizada de proyecto ajeno | Usuario B (no creador) intenta editar Proyecto1 | Operación rechazada | RF-04, RF-06 | S |

### Historia 3 — Crear y editar tickets

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H3-01 | Crear un ticket | Usuario autenticado crea ticket con título + proyecto | Ticket creado con creador y fecha de creación | RF-01, RF-03, RF-08 | F |
| TC-H3-02 | Editar un ticket propio | Creador o responsable edita descripción/prioridad/etiquetas/fecha | Cambios guardados + fecha de actualización | RF-08 | F |
| TC-H3-03 | Administrador edita cualquier ticket | Admin edita un ticket de otro usuario | Cambio permitido | RF-06 | F |
| TC-H3-04 | Cierre de ticket | Mover un ticket a estado Terminado | Fecha de cierre registrada | RF-08, RF-10 | F |
| TC-H3-05 (edge) | Título obligatorio ausente | Intentar crear/guardar ticket sin título | Guardado bloqueado, validación visible | RF-08 | F |
| TC-H3-06 (edge) | Edición no autorizada de ticket ajeno | Usuario sin ser creador ni responsable intenta editar | Operación rechazada | RF-06 | S |
| TC-H3-07 (edge) | Edición concurrente (last-write-wins) | Dos sesiones abren el mismo ticket y ambas guardan cambios en secuencia | Prevalece la última escritura; no hay aviso de conflicto | RF-16 | F |

### Historia 4 — Archivar y restaurar tickets

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H4-01 | Usuario archiva su propio ticket | El creador archiva su ticket | Ticket archivado, oculto del tablero y filtros | RF-01, RF-02 | F |
| TC-H4-02 | Administrador archiva un ticket de un tercero | Admin archiva ticket de otro usuario | Ticket archivado con traza de quién lo archivó | RF-02 | F |
| TC-H4-03 | Administrador restaura un ticket archivado | Admin restaura un ticket archivado | Ticket reaparece en tablero y filtros | RF-02 | F |
| TC-H4-04 (edge) | Usuario intenta archivar un ticket ajeno | Usuario no creador intenta archivar | Operación rechazada | RF-02, RF-06 | S |
| TC-H4-05 (edge) | Usuario intenta restaurar un ticket archivado | Usuario intenta restaurar | Operación rechazada (solo Admin restaura) | RF-02, RF-06 | S |

### Historia 5 — Asignación de responsables

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H5-01 | Ticket con varios responsables | Asignar varios usuarios como responsables de un mismo ticket | Todos quedan vinculados | RF-05 | F |
| TC-H5-02 | Usuario se autoasigna en ticket propio | Usuario se asigna a sí mismo en ticket propio | Queda registrado como responsable | RF-05 | F |
| TC-H5-03 | Administrador asigna a cualquier usuario | Admin asigna a un tercero como responsable de cualquier ticket | Asignación guardada | RF-05 | F |
| TC-H5-04 (edge) | Usuario intenta asignar a un tercero | Usuario intenta asignar a otro usuario distinto de sí mismo | Operación rechazada (regla restrictiva, R-06) | RF-05 | S |

### Historia 6 — Tablero Kanban

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H6-01 | Mover un ticket propio o asignado | Usuario mueve ticket propio/asignado entre los 4 estados | Estado actualizado | RF-10 | F |
| TC-H6-02 | Administrador mueve cualquier ticket | Admin mueve cualquier ticket | Cambio aplicado | RF-06, RF-10 | F |
| TC-H6-03 (edge) | Usuario intenta mover un ticket sin relación con él | Usuario sin ser creador/responsable intenta moverlo | Operación rechazada | RF-06, RF-10 | S |

### Historia 7 — Comentarios en tickets

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H7-01 | Agregar un comentario | Usuario autenticado agrega comentario a un ticket con acceso | Comentario guardado con autor y fecha | RF-11 | F |
| TC-H7-02 | Ver comentarios existentes | Abrir un ticket con varios comentarios | Se listan todos con autor y fecha | RF-11 | F |
| TC-H7-03 (edge) | Comentario vacío | Intentar enviar un comentario sin contenido | No se registra el comentario | RF-11 | F |

### Historia 8 — Filtrado de tickets

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H8-01a | Filtrar por un solo criterio — fecha | Aplicar filtro de fecha | Solo tickets que coinciden | RF-09 | F |
| TC-H8-01b | Filtrar por un solo criterio — prioridad | Aplicar filtro de prioridad (Baja/Media/Alta) | Solo tickets con esa prioridad | RF-09, RF-09a | F |
| TC-H8-01c | Filtrar por un solo criterio — responsable | Aplicar filtro por responsable | Solo tickets con ese responsable | RF-09 | F |
| TC-H8-01d | Filtrar por un solo criterio — proyecto | Aplicar filtro por proyecto | Solo tickets de ese proyecto | RF-09 | F |
| TC-H8-01e | Filtrar por un solo criterio — etiqueta | Aplicar filtro por etiqueta de texto libre | Solo tickets con esa etiqueta | RF-09, RF-09b | F |
| TC-H8-02 | Combinar varios filtros | Aplicar fecha + responsable simultáneamente | Solo tickets que cumplen ambos criterios | RF-09 | F |
| TC-H8-03 | Filtrado respeta la visibilidad por rol | Usuario aplica cualquier filtro | Resultados limitados a sus proyectos visibles | RF-17 | F |
| TC-H8-04 (edge) | Sin resultados | Aplicar filtros que no calzan con ningún ticket | Sistema indica ausencia de resultados | RF-09 | F |

### Historia 9 — Reporte mensual de tickets cerrados

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H9-01 | Ver el conteo de cierres | Admin accede a la vista de reporte con tickets Terminados de varios meses/proyectos | Tabla con conteo por mes y proyecto, sin gráficos | RF-13 | F |
| TC-H9-02 (edge) | Usuario sin acceso al reporte | Usuario intenta acceder a la vista de reporte | Acceso rechazado | RF-06, RF-13 | S |

### Historia 10 — Modo oscuro

| ID | Escenario Gherkin de origen | Pasos clave | Resultado esperado | RF/RNF | Tipo |
|---|---|---|---|---|---|
| TC-H10-01 | Cambiar a modo oscuro | Activar modo oscuro desde modo claro | Interfaz completa usa la paleta oscura de Design Tokens | RF-15 | F |
| TC-H10-02 | Contraste accesible en modo oscuro | Revisar pantallas principales en modo oscuro con herramienta de contraste | Cumple WCAG 2.1 AA | RF-15, RNF-03 | A |

---

## 2. Edge cases críticos no cubiertos en backlog.md

Identificados por análisis de `specs.md` (incluyendo los riesgos R-01 a R-07 ya documentados) que no tienen escenario Gherkin ni caso de prueba en la sección 1.

| ID | Edge case | RF/RNF relacionado | Enfoque de prueba sugerido |
|---|---|---|---|
| EC-01 | Bypass de autorización llamando directamente a la API (no solo bloqueo en la UI) para editar/archivar/mover/ver tickets o proyectos fuera del alcance del rol | RNF-04, RF-17, RF-06 | Repetir cada caso "operación rechazada" de la sección 1 invocando el endpoint directamente con un token de Usuario, sin pasar por la UI |
| EC-02 | Regla de asignación de responsables a terceros por un Usuario normal, aún no confirmada por el PO/PM (riesgo R-06) | RF-05 | Confirmar la regla con PO/PM antes de fijar el comportamiento; diseñar casos para ambas alternativas |
| EC-03 | Accesibilidad WCAG 2.1 AA fuera del modo oscuro: navegación completa por teclado, roles/aria, foco visible y textos alternativos en formularios/tablero/modales | RNF-03 | Auditoría con lector de pantalla y herramienta automatizada (p. ej. axe) sobre login, tablero, ticket y filtros |
| EC-04 | Pérdida silenciosa de datos con last-write-wins cuando el conflicto ocurre en campos multivaluados (responsables, etiquetas) y no solo en texto simple (riesgo R-05) | RF-16 | Editar responsables/etiquetas del mismo ticket desde dos sesiones simultáneas y verificar qué conjunto final se guarda |
| EC-05 | Rendimiento bajo carga: carga inicial del tablero y latencia de API con ~10 usuarios concurrentes | RNF-02 | Prueba de carga con 10 usuarios concurrentes ejecutando crear/editar/filtrar; medir tiempo de carga y p95 de la API |
| EC-06 | Orden de columnas del tablero no confirmado por el PO/PM (riesgo R-07): Review antes o después de Terminado | RF-10 | Confirmar orden con PO/PM antes de congelar la UI; verificar que el orden implementado coincide con lo acordado |
| EC-07 | Creación y desactivación de cuentas de usuario por el Administrador (fila de la matriz 5.1), sin historia ni escenario propio en backlog.md | RF-07 (matriz 5.1) | Admin crea una cuenta y valida que permite login; Admin desactiva una cuenta y valida que ya no puede iniciar sesión |
| EC-08 | Verificación de que las contraseñas se almacenan con hash seguro (bcrypt/argon2) y no en texto plano | RNF-04 | Inspección directa del almacenamiento tras crear una cuenta / intento de login con hash conocido filtrado |
| EC-09 | Revocación dinámica de visibilidad: un Usuario pierde el único ticket asignado de un proyecto que no creó | RF-17 | Desasignar el último ticket de un Usuario en un proyecto ajeno y verificar que el proyecto deja de listarse para él |
| EC-10 | Ticket creado sin ningún responsable asignado (caso límite "cero responsables" de RF-05) | RF-05 | Crear ticket sin asignar responsables y verificar que el ticket funciona con normalidad (edición, movimiento, filtros) |
| EC-11 | Inyección de valores de prioridad o estado fuera del dominio permitido (Baja/Media/Alta; los 4 estados fijos) vía llamada directa a la API | RF-09a, RF-10 | Enviar un valor de prioridad/estado inválido directamente a la API y verificar que se rechaza |

### Matriz de priorización (Impacto × Probabilidad)

| Probabilidad \ Impacto | Alto | Medio | Bajo |
|---|---|---|---|
| **Alta** | EC-01, EC-02, EC-03 — **Crítica** | EC-06, EC-07 — **Alta** | EC-10 — **Media** |
| **Media** | EC-04, EC-05 — **Alta** | EC-09 — **Media** | — |
| **Baja** | EC-08 — **Media** | EC-11 — **Baja** | — |

### Justificación de prioridad

- **EC-01 (Crítica):** impacto alto porque una falla de autorización a nivel de API expone datos y acciones entre usuarios violando directamente RF-17/RNF-04 (seguridad); probabilidad alta porque es un error común dejar la validación solo en la UI cuando el backend no la re-implementa explícitamente.
- **EC-02 (Crítica):** `specs.md` ya deja esta regla como pendiente de confirmación (riesgo R-06); si se implementa mal, puede permitir asignaciones no autorizadas (impacto alto) y, al no estar confirmada, es altamente probable que la implementación actual no refleje la decisión final del PO/PM.
- **EC-03 (Crítica):** RNF-03 exige WCAG 2.1 AA completo, pero backlog.md solo valida contraste en modo oscuro; el resto de la interfaz (teclado, aria, foco, alt text) queda sin ningún test, con alta probabilidad de incumplimiento si no se audita explícitamente.
- **EC-04 y EC-05 (Alta):** ambos son riesgos explícitos de `specs.md` (R-05 y el propio RNF-02) con impacto alto (pérdida de datos / incumplimiento de un RNF cerrado), pero requieren condiciones específicas (concurrencia real, carga de 10 usuarios) que los hacen de probabilidad media más que alta.
- **EC-06 y EC-07 (Alta):** impacto medio porque afectan UX/operatividad, no seguridad ni integridad de datos, pero probabilidad alta: EC-06 es un pendiente ya documentado (R-07) y EC-07 es un flujo indispensable (sin crear cuentas no hay usuarios) que hoy no tiene ningún test.
- **EC-08 (Media):** impacto alto si falla (contraseñas expuestas), pero probabilidad baja asumiendo que el stack (Node.js + práctica estándar) use una librería de hash reconocida; aun así merece una verificación puntual antes de producción.
- **EC-09 y EC-10 (Media):** impacto medio/bajo (afectan UX o son comportamiento esperado, no brechas de seguridad), con probabilidad media-alta por ser casos de uso cotidianos.
- **EC-11 (Baja):** requiere bypass deliberado de la UI y el impacto se limita a inconsistencia de datos/filtros, no a una brecha de seguridad ni pérdida de información.

---

## 3. Validación final — RF/RNF sin test asociado

Revisando cada requerimiento de `specs.md` contra los casos de prueba de la sección 1 (los derivados de criterios de aceptación del backlog):

| RF/RNF | Estado | Detalle |
|---|---|---|
| **RF-12** | **Sin test (esperado)** | Notificaciones por email — declarado explícitamente Fase 2, fuera del MVP en `specs.md` §2 y §7 (P10). No corresponde generar test de MVP. |
| **RNF-01** | **Sin test (no aplica)** | Plazo de 3 semanas — es un requisito de gestión de proyecto/cronograma, no una conducta verificable con un caso de prueba funcional; se controla por seguimiento del proyecto, no por QA. |
| **RNF-02** | **Sin test en backlog.md — cubierto solo como edge case** | Ningún escenario Gherkin de backlog.md prueba rendimiento (carga del tablero < 2 s, API p95 < 500 ms). Ver EC-05. Se recomienda incorporar estos casos al backlog antes del cierre del MVP. |
| **RNF-03** | **Cubierto parcialmente** | TC-H10-02 solo prueba contraste en modo oscuro. Navegación por teclado, roles/aria y textos alternativos (exigidos por `CLAUDE.md`/RNF-03 en toda la interfaz) no tienen test. Ver EC-03. |
| **RNF-04** | **Cubierto parcialmente** | TC-H1-03/04 cubren credenciales y expiración de sesión. El hash seguro de contraseñas y la validación de autorización en el backend (no solo en la UI) no tienen test explícito. Ver EC-01 y EC-08. |
| **RF-07 (fila "crear/desactivar cuentas" de la matriz 5.1)** | **Cubierto parcialmente** | El login (RF-07 núcleo) está cubierto en Historia 1. La creación y desactivación de cuentas por el Administrador no tiene escenario ni test en backlog.md. Ver EC-07. |
| **RF-06** | **Cubierto de forma transversal** | No es RF de origen de ninguna historia (backlog.md lo indica explícitamente), pero queda validado indirectamente por todos los casos "operación rechazada/permitida por rol": TC-H2-05, TC-H3-03/06, TC-H4-04/05, TC-H6-02/03, TC-H9-02. No se considera un vacío. |
| **Resto de RF** (RF-01 a RF-05, RF-08 a RF-11, RF-13 a RF-17, RF-09a, RF-09b) | **Cubiertos** | Cada uno tiene al menos un caso de prueba en la sección 1 (ver columna RF/RNF de cada tabla). |

**Conclusión:** de los requerimientos del MVP, **RNF-02, RNF-03 y RNF-04 quedan solo parcialmente cubiertos**, y la fila de creación/desactivación de cuentas de RF-07 no tiene test propio; todos estos vacíos están mapeados a los edge cases EC-01, EC-03, EC-05, EC-07 y EC-08 de la sección 2, priorizados como Crítica/Alta/Media. RF-12 y RNF-01 quedan sin test de forma correcta y esperada por estar fuera del alcance testeable del MVP.
