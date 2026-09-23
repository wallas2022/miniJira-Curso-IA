# backlog.md — Historias de Usuario MVP (Mini Jira)

> Fuente única: `docs/specs.md` (v1.1, APROBADO). Cada historia referencia el/los RF que la originan. Formato Gherkin declarativo: los pasos describen intención y reglas de negocio, no elementos de UI.

---

## Historia 1 — Autenticación

**Como** usuario del sistema **quiero** iniciar sesión con mi email y contraseña **para** acceder de forma segura a mis proyectos y tickets.

```gherkin
Escenario: Inicio de sesión exitoso
  Dado que tengo una cuenta activa creada previamente por un Administrador
  Cuando inicio sesión con mi email y mi contraseña correctos
  Entonces accedo al sistema con los permisos correspondientes a mi rol

Escenario: No existe registro público
  Dado que no tengo una cuenta en el sistema
  Cuando intento acceder
  Entonces no encuentro ninguna opción de registro público y debo solicitar que un Administrador cree mi cuenta
```

*RF de origen: RF-07, RNF-04.*

### Edge cases / fallos
```gherkin
Escenario: Credenciales incorrectas
  Dado que ingreso un email o una contraseña incorrectos
  Cuando intento iniciar sesión
  Entonces el sistema rechaza el acceso sin indicar cuál de los dos datos fue incorrecto

Escenario: Sesión expirada
  Dado que mi sesión ha expirado
  Cuando intento realizar cualquier acción en el sistema
  Entonces el sistema me solicita iniciar sesión nuevamente antes de continuar
```

---

## Historia 2 — Gestión de proyectos

**Como** usuario **quiero** crear y editar proyectos **para** organizar los tickets de mi equipo.

```gherkin
Escenario: Crear un proyecto
  Dado que soy un usuario autenticado (Administrador o Usuario)
  Cuando creo un proyecto indicando nombre y descripción
  Entonces el proyecto queda registrado con mi cuenta como creador

Escenario: Editar un proyecto propio
  Dado que soy el creador de un proyecto
  Cuando edito su nombre o descripción
  Entonces los cambios quedan guardados

Escenario: Visibilidad total para Administrador
  Dado que soy Administrador
  Cuando consulto la lista de proyectos
  Entonces veo todos los proyectos existentes en el sistema

Escenario: Visibilidad restringida para Usuario
  Dado que soy Usuario
  Cuando consulto la lista de proyectos
  Entonces solo veo los proyectos que creé o aquellos en los que tengo al menos un ticket asignado como responsable
```

*RF de origen: RF-04, RF-17.*

### Edge cases / fallos
```gherkin
Escenario: Edición no autorizada de proyecto ajeno
  Dado que soy Usuario y no soy el creador de un proyecto
  Cuando intento editarlo
  Entonces el sistema no me lo permite
```

---

## Historia 3 — Crear y editar tickets

**Como** usuario **quiero** crear y editar tickets con su información relevante **para** poder darles seguimiento.

```gherkin
Escenario: Crear un ticket
  Dado que soy un usuario autenticado dentro de un proyecto
  Cuando creo un ticket indicando al menos el título y el proyecto al que pertenece
  Entonces el ticket queda asociado a ese único proyecto, con mi cuenta como creador y con la fecha de creación registrada

Escenario: Editar un ticket propio
  Dado que soy el creador o soy responsable de un ticket
  Cuando edito su descripción, prioridad, etiquetas o fecha
  Entonces los cambios quedan guardados junto con la fecha de actualización

Escenario: Administrador edita cualquier ticket
  Dado que soy Administrador
  Cuando edito cualquier ticket del sistema
  Entonces el sistema permite el cambio

Escenario: Cierre de ticket
  Dado que un ticket cambia a estado Terminado
  Cuando se guarda ese cambio
  Entonces se registra su fecha de cierre
```

*RF de origen: RF-01, RF-03, RF-08.*

### Edge cases / fallos
```gherkin
Escenario: Título obligatorio ausente
  Dado que intento crear o guardar un ticket sin título
  Cuando lo envío
  Entonces el sistema no permite guardar el ticket

Escenario: Edición no autorizada de ticket ajeno
  Dado que soy Usuario y no soy creador ni responsable de un ticket
  Cuando intento editarlo
  Entonces el sistema no me lo permite

Escenario: Edición concurrente (last-write-wins)
  Dado que dos usuarios abren el mismo ticket al mismo tiempo y ambos editan campos
  Cuando ambos guardan sus cambios
  Entonces prevalece la última escritura y el cambio anterior se pierde sin que se avise a quien lo perdió
```

---

## Historia 4 — Archivar y restaurar tickets

**Como** usuario **quiero** archivar tickets que ya no son relevantes **para** mantener el tablero limpio, **y como** Administrador **quiero** poder restaurarlos **para** corregir archivados por error.

```gherkin
Escenario: Usuario archiva su propio ticket
  Dado que soy Usuario y soy el creador de un ticket
  Cuando lo "elimino"
  Entonces el ticket se archiva (archivo lógico) y desaparece del tablero y de los filtros

Escenario: Administrador archiva un ticket de un tercero
  Dado que soy Administrador
  Cuando archivo un ticket de cualquier usuario
  Entonces el ticket se archiva y queda registrado quién lo archivó

Escenario: Administrador restaura un ticket archivado
  Dado que un ticket está archivado
  Cuando un Administrador lo restaura
  Entonces el ticket vuelve a aparecer en el tablero y en los filtros
```

*RF de origen: RF-01, RF-02.*

### Edge cases / fallos
```gherkin
Escenario: Usuario intenta archivar un ticket ajeno
  Dado que soy Usuario y no soy el creador del ticket
  Cuando intento archivarlo
  Entonces el sistema no me lo permite

Escenario: Usuario intenta restaurar un ticket archivado
  Dado que soy Usuario
  Cuando intento restaurar un ticket archivado
  Entonces el sistema no me lo permite, porque solo el Administrador puede restaurar
```

---

## Historia 5 — Asignación de responsables

**Como** usuario **quiero** asignar responsables a un ticket **para** dejar claro quién debe trabajarlo.

```gherkin
Escenario: Ticket con varios responsables
  Dado que un ticket admite cero, uno o varios responsables
  Cuando se asignan varios usuarios como responsables de un mismo ticket
  Entonces todos ellos quedan vinculados al ticket como responsables

Escenario: Usuario se autoasigna en un ticket propio
  Dado que soy Usuario y el ticket es propio
  Cuando me asigno a mí mismo como responsable
  Entonces quedo registrado como responsable del ticket

Escenario: Administrador asigna a cualquier usuario
  Dado que soy Administrador
  Cuando asigno a cualquier usuario como responsable de cualquier ticket
  Entonces la asignación queda guardada
```

*RF de origen: RF-05.*

### Edge cases / fallos
```gherkin
Escenario: Usuario intenta asignar a un tercero (regla pendiente, aplicada de forma restrictiva)
  Dado que soy Usuario
  Cuando intento asignar a otro usuario distinto de mí mismo como responsable de un ticket
  Entonces el sistema no me lo permite, siguiendo la regla más restrictiva asumida mientras no se confirme lo contrario (ver riesgo R-06 en specs.md)
```

---

## Historia 6 — Tablero Kanban

**Como** usuario **quiero** mover tickets entre los estados del tablero **para** reflejar el avance del trabajo.

```gherkin
Escenario: Mover un ticket propio o asignado
  Dado que el tablero tiene los estados Por hacer, En progreso, Review y Terminado
  Cuando muevo un ticket propio o en el que soy responsable a otro estado
  Entonces el estado del ticket se actualiza

Escenario: Administrador mueve cualquier ticket
  Dado que soy Administrador
  Cuando muevo cualquier ticket entre estados
  Entonces el cambio se aplica
```

*RF de origen: RF-10.*

### Edge cases / fallos
```gherkin
Escenario: Usuario intenta mover un ticket sin relación con él
  Dado que soy Usuario y el ticket no es propio ni tengo asignación como responsable
  Cuando intento moverlo entre estados
  Entonces el sistema no me lo permite
```

---

## Historia 7 — Comentarios en tickets

**Como** usuario **quiero** comentar en un ticket **para** comunicarme con el equipo sobre su progreso.

```gherkin
Escenario: Agregar un comentario
  Dado que soy un usuario autenticado con acceso al ticket
  Cuando agrego un comentario
  Entonces el comentario queda guardado con mi cuenta como autor y la fecha del comentario

Escenario: Ver comentarios existentes
  Dado que un ticket tiene varios comentarios
  Cuando lo abro
  Entonces veo todos sus comentarios junto con su autor y su fecha
```

*RF de origen: RF-11.*

### Edge cases / fallos
```gherkin
Escenario: Comentario vacío
  Dado que intento enviar un comentario sin contenido
  Cuando lo envío
  Entonces el sistema no lo registra
```

---

## Historia 8 — Filtrado de tickets

**Como** usuario **quiero** filtrar tickets por fecha, prioridad, responsable, proyecto y etiquetas **para** encontrar rápidamente lo que busco.

```gherkin
Escenario: Filtrar por un solo criterio
  Dado que tengo tickets visibles dentro de mi alcance de permisos
  Cuando aplico un filtro por prioridad, responsable, proyecto, etiqueta o fecha
  Entonces solo veo los tickets que coinciden con ese criterio

Escenario: Combinar varios filtros
  Dado que aplico más de un filtro a la vez
  Cuando los combino
  Entonces el sistema muestra solo los tickets que cumplen todos los criterios aplicados

Escenario: Filtrado respeta la visibilidad por rol
  Dado que soy Usuario
  Cuando aplico cualquier filtro
  Entonces los resultados se limitan a los proyectos donde tengo visibilidad
```

*RF de origen: RF-09, RF-09a, RF-09b, RF-17.*

### Edge cases / fallos
```gherkin
Escenario: Sin resultados
  Dado que ningún ticket coincide con los filtros aplicados
  Cuando se ejecuta la búsqueda
  Entonces el sistema indica que no hay resultados
```

---

## Historia 9 — Reporte mensual de tickets cerrados

**Como** Administrador **quiero** ver un conteo de tickets cerrados por mes y por proyecto **para** armar mi reporte mensual.

```gherkin
Escenario: Ver el conteo de cierres
  Dado que existen tickets en estado Terminado con fecha de cierre registrada
  Cuando accedo a la vista de reporte
  Entonces veo, en formato tabla y sin gráficos, el número de tickets cerrados agrupados por mes y por proyecto
```

*RF de origen: RF-13.*

### Edge cases / fallos
```gherkin
Escenario: Usuario sin acceso al reporte
  Dado que soy Usuario
  Cuando intento acceder a la vista de reporte mensual
  Entonces el sistema no me lo permite, porque es exclusiva del Administrador
```

---

## Historia 10 — Modo oscuro

**Como** usuario **quiero** usar el sistema en modo oscuro **para** reducir la fatiga visual.

```gherkin
Escenario: Cambiar a modo oscuro
  Dado que estoy usando la interfaz en modo claro
  Cuando cambio a modo oscuro
  Entonces toda la interfaz adopta la paleta oscura definida por los Design Tokens

Escenario: Contraste accesible en modo oscuro
  Dado que estoy usando el modo oscuro
  Cuando reviso cualquier pantalla
  Entonces el contraste de texto y elementos cumple WCAG 2.1 AA
```

*RF de origen: RF-14, RF-15, RNF-03.*

---

## Trazabilidad (resumen)

| Historia | RF cubiertos |
|---|---|
| 1. Autenticación | RF-07, RNF-04 |
| 2. Gestión de proyectos | RF-04, RF-17 |
| 3. Crear y editar tickets | RF-01, RF-03, RF-08, RF-16 (edge case) |
| 4. Archivar y restaurar tickets | RF-01, RF-02 |
| 5. Asignación de responsables | RF-05 |
| 6. Tablero Kanban | RF-10 |
| 7. Comentarios | RF-11 |
| 8. Filtrado de tickets | RF-09, RF-09a, RF-09b, RF-17 |
| 9. Reporte mensual de tickets cerrados | RF-13 |
| 10. Modo oscuro | RF-14, RF-15, RNF-03 |

> No incluidas por estar fuera de MVP según specs.md: RF-12 (email, Fase 2). RF-06 (roles) no forma una historia propia: se expresa como reglas de permiso dentro de cada historia (matriz 5.1). Pendientes heredados de specs.md que afectan estas historias: orden de columnas del tablero (R-07, Historia 6), regla de asignación a terceros (R-06, Historia 5).
