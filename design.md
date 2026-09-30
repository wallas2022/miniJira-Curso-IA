# design.md — Manifiesto de Sistema de Diseño (Mini Jira)

> **Fuente de esta extracción:** no existen archivos `.dc.html` de Claude Design en el proyecto ni en el repositorio de referencia (`amoralesbdg/CursoIA_Asistido`, rama `main`, única rama, verificada). Este documento se generó a partir de la **fuente de verdad real y vigente** del proyecto:
> - `frontend/src/styles/tokens.css` — tokens efectivamente implementados y verificados contra WCAG 2.1 AA.
> - `docs/prototype-spec.md` §A/§B — sistema de diseño y estándares de accesibilidad aprobados.
> - `docs/frontend-specs.md` §5, §8 — arquitectura de componentes prevista.
> - Componentes reales: `LoginPage.tsx`, `ProjectsPage.tsx`, `BoardPage.tsx`, `TicketCard.tsx`, `TicketDrawer.tsx`, `SkeletonLoader.tsx`.
>
> Ante cualquier divergencia futura entre este documento y `docs/specs.md`/`docs/prototype-spec.md`, esos documentos son la fuente única de verdad (`CLAUDE.md`).
>
> **Nota de alcance:** el frontend actual (v1.1, prototipo funcional) implementa los tokens y clases CSS de base, pero **no** define todavía componentes React reutilizables (`Button`, `Input`, `Badge` como componentes) ni estados `:hover`/`:active` explícitos — solo `:disabled` y `:focus-visible` globales. Esos estados quedan marcados como **pendientes de implementación** más abajo, no inventados.

---

## 1. Paleta de colores por rol semántico

Todos los pares claro/oscuro fueron verificados por luminancia relativa real contra WCAG 2.1 AA (4.5:1 texto normal, 3:1 texto grande/componentes UI) — ver comentarios de razón de contraste en `tokens.css`.

### 1.1 Neutros (superficies y texto)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--mj-color-bg-canvas` | `#ffffff` | `#1d1d1f` | Fondo de página, columnas del tablero |
| `--mj-color-bg-surface` | `#ffffff` | `#2c2c2e` | Cards, drawer, inputs (fondo elevado) |
| `--mj-color-border` | `#d2d2d7` | `#3a3a3c` | Bordes de card/botón/input/columna |
| `--mj-color-text-primary` | `#1d1d1f` | `#f5f5f7` (15.46:1) | Texto principal, títulos |
| `--mj-color-text-secondary` | `#6e6e73` (5.07:1) | `#a1a1a6` (6.55:1) | Texto auxiliar, hints, metadatos |
| `--mj-color-text-on-primary` | `#ffffff` | `#ffffff` | Texto sobre superficies de acción primaria |

### 1.2 Primarios / acción de marca

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--mj-color-action-primary` | `#0071e3` | `#0071e3` (4.70:1 con `text-on-primary` en ambos temas) | Relleno de botón primario |
| `--mj-color-link` | `#0071e3` (4.70:1) | `#4da3ff` (6.41:1) | Enlaces y texto sobre fondo — **token separado del botón** porque el azul de marca no llega a 4.5:1 como texto sobre fondo oscuro |

### 1.3 Estados semánticos (feedback e info)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--mj-color-info-bg` | `#eef6ff` | `#12263d` | Fondo de banner informativo |
| `--mj-color-info-text` | `#0b4a8f` (8.06:1) | `#bcdcff` (10.81:1) | Texto de banner informativo |
| `--mj-color-error-bg` | `#fdecec` | `#3a1414` | Fondo de banner/botón destructivo |
| `--mj-color-error-text` | `#8a1c1c` (8.13:1) | `#ffb4ab` (9.59:1) | Texto de error |
| `--mj-color-danger` | `#d70015` (4.71:1) | `#f87171` (5.89:1) | Borde de acción destructiva |

### 1.4 Prioridad de ticket (RF-09a: color + texto, nunca solo color)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--mj-color-priority-baja` | `#1c7a3d` (5.38:1) | `#4ade80` (8.0:1) | Badge "Prioridad: Baja" |
| `--mj-color-priority-media` | `#a15c00` (5.19:1) | `#fbbf24` (8.35:1) | Badge "Prioridad: Media" |
| `--mj-color-priority-alta` | `#c0201c` (6.06:1) | `#f87171` (5.04:1) | Badge "Prioridad: Alta" |

### 1.5 Interactivos (foco)

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--mj-color-focus-ring` | `#0071e3` | `#0071e3` | Anillo de foco visible (`:focus-visible`), mínimo 3:1 exigido a componentes UI — cumple en ambos temas |

---

## 2. Tipografía

| Token | Valor | Uso |
|---|---|---|
| `--mj-font-family-base` | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | Única familia del sistema (estética "Apple", sin fuente mono en uso actual) |

**Escala de tamaños:**

| Token | Valor (rem / px aprox.) | Uso |
|---|---|---|
| `--mj-font-size-display` | `2.5rem` (40px) | Reservado, sin uso actual en pantallas implementadas |
| `--mj-font-size-h1` | `2rem` (32px) | `<h1>` — título de página (ej. nombre de proyecto en el tablero) |
| `--mj-font-size-h2` | `1.375rem` (22px) | `<h2>` — encabezados de columna, secciones |
| `--mj-font-size-h3` | `1.125rem` (18px) | Reservado, sin uso actual |
| `--mj-font-size-body` | `1rem` (16px) | Texto de cuerpo, inputs, botones (tamaño base) |
| `--mj-font-size-caption` | `0.85rem` (13.6px) | `.mj-badge`, `.mj-hint` |

**Pesos:**

| Token | Valor | Uso |
|---|---|---|
| `--mj-font-weight-regular` | `400` | Texto de cuerpo |
| `--mj-font-weight-medium` | `500` | Reservado, sin uso actual |
| `--mj-font-weight-semibold` | `600` | `<h1>`, `<h2>`, título de tarjeta de ticket, avatar |

**Line-heights:**

| Token | Valor | Uso |
|---|---|---|
| `--mj-line-height-tight` | `1.2` | Títulos (`h1`, `h2`) |
| `--mj-line-height-base` | `1.5` | Cuerpo de texto (`body`) |
| `--mj-line-height-relaxed` | `1.7` | Reservado para bloques largos (descripción, comentarios) — aún no aplicado en CSS |

---

## 3. Espaciado y layout

Escala base de 4px, uso consistente vía `gap`, `padding`, `margin`:

| Token | Valor |
|---|---|
| `--mj-space-1` | `4px` |
| `--mj-space-2` | `8px` |
| `--mj-space-3` | `12px` |
| `--mj-space-4` | `16px` |
| `--mj-space-5` | `24px` |
| `--mj-space-6` | `32px` |
| `--mj-space-7` | `48px` |
| `--mj-space-8` | `64px` |

**Layout / breakpoints:**

| Token | Valor | Uso |
|---|---|---|
| `--mj-breakpoint-sm` | `480px` | Colapso de padding en `.mj-page`/`.mj-auth-screen` (usado como literal en `@media`, no como `var()` — limitación de CSS) |
| `--mj-breakpoint-md` | `768px` | Reservado para tablet |
| `--mj-breakpoint-lg` | `1024px` | Reservado para desktop |

**Contenedores:**

| Clase | Regla |
|---|---|
| `.mj-page` | `max-width: 1100px`, `margin: 0 auto`, `padding: var(--mj-space-5)` |
| `.mj-project-grid` | `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`, `gap: var(--mj-space-4)` |
| `.mj-board` | `display: flex`, `overflow-x: auto`, `gap: var(--mj-space-4)` |

**Z-index:**

| Token | Valor | Uso |
|---|---|---|
| `--mj-z-dropdown` | `10` | Reservado — sin dropdown propio implementado (usa `<select>` nativo) |
| `--mj-z-modal` | `100` | `.mj-drawer-overlay` |
| `--mj-z-toast` | `1000` | Reservado — sin componente Toast implementado aún (feedback actual es banner inline) |

**Movimiento** (respeta `prefers-reduced-motion`, ver §6):

| Token | Valor |
|---|---|
| `--mj-duration-fast` | `100ms` |
| `--mj-duration-base` | `200ms` |
| `--mj-duration-slow` | `320ms` |
| `--mj-easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` |

---

## 4. Radios de borde por componente

No existe un token `--mj-radius-lg` en uso real todavía (reservado en la escala); los radios efectivamente aplicados son:

| Token | Valor | Componentes que lo usan |
|---|---|---|
| `--mj-radius-sm` | `4px` | `.mj-button`, inputs/select/textarea (`.mj-field`), `.mj-banner`, skeleton |
| `--mj-radius-md` | `8px` | `.mj-card` (incluye tarjeta de proyecto y de ticket), `.mj-board-column` |
| `--mj-radius-lg` | `16px` | Reservado en la escala — **sin componente que lo consuma actualmente** (candidato: drawer/modal grandes) |
| `--mj-radius-pill` | `999px` | `.mj-badge` (contador de columna, prioridad) |
| *(sin radio)* | `0` | `.mj-drawer` (panel lateral a borde de pantalla) |

---

## 5. Sombras (nombradas semánticamente)

| Token | Valor | Nombre semántico | Uso real |
|---|---|---|---|
| `--mj-shadow-sm` | `0 1px 3px rgba(0,0,0,0.1)` | **card** | `.mj-card` (proyectos, tickets) |
| `--mj-shadow-md` | `0 4px 16px rgba(0,0,0,0.12)` | **modal / drawer** | `.mj-drawer` (panel lateral de detalle de ticket) |
| *(no definida)* | — | **dropdown** | **Gap:** no hay sombra propia para menús desplegables; el tablero usa `<select>` nativo (sombra del navegador), no un componente `Dropdown` custom. Si se construye uno, se recomienda introducir `--mj-shadow-sm` o un nuevo `--mj-shadow-dropdown` de menor difusión que `-md`. |

---

## 6. Accesibilidad transversal (WCAG 2.1 AA) que condiciona el sistema visual

De `docs/prototype-spec.md` §B, aplicado en `tokens.css`:

- **Foco:** `:focus-visible { outline: 3px solid var(--mj-color-focus-ring); outline-offset: 2px; }` global — nunca se remueve sin reemplazo.
- **Contraste:** mínimo 4.5:1 texto normal, 3:1 componentes UI — verificado por par de token, no por inversión de escala de grises.
- **Color no es el único portador de significado:** prioridad = color + texto ("Prioridad: Alta"), nunca badge sin etiqueta.
- **Movimiento reducido:** `@media (prefers-reduced-motion: reduce)` anula duraciones de animación/transición a `0.01ms` globalmente.
- **Objetivo táctil:** `min-height: 44px` en botones, inputs, select, fila de checkbox (`.mj-checkbox-row`).
- **Tema oscuro:** automático vía `prefers-color-scheme` (RF-15); cada color fue reverificado en oscuro, no solo invertido (ver notas de contraste en §1).

---

## 7. Componentes y sus estados

Reconstruido desde las clases CSS reales de `tokens.css` + el uso en JSX. Se marca explícitamente cuándo un estado **no está implementado** (no se inventan valores).

### 7.1 Button (`.mj-button`)

| Estado | Implementación |
|---|---|
| Default | `border: 1px solid var(--mj-color-border)`, `background: var(--mj-color-bg-surface)`, `color: var(--mj-color-text-primary)`, `min-height: 44px` |
| Variante `--primary` | `background`/`border-color: var(--mj-color-action-primary)`, `color: var(--mj-color-text-on-primary)` |
| Variante `--destructive` | `background: var(--mj-color-error-bg)`, `border-color: var(--mj-color-danger)`, `color: var(--mj-color-error-text)` (usado en "Eliminar" del `TicketDrawer`) |
| Variante `--icon` | `min-width: 44px`, `padding: var(--mj-space-1)` (usado en botón "Cerrar" ✕ del drawer) |
| Hover | **No implementado** — sin regla `:hover`; el navegador no aplica cambio visual propio sobre `background` custom |
| Active | **No implementado** — sin regla `:active` |
| Disabled | `opacity: 0.6`, `cursor: not-allowed` (aplicado en todos los envíos de formulario mientras `guardando === true`) |
| Focus | Hereda `:focus-visible` global (anillo `--mj-color-focus-ring`, 3px, offset 2px) |
| Transición | `background-color` y `opacity` en `var(--mj-duration-fast)` con `var(--mj-easing-standard)` — preparada para un hover futuro que hoy no está definido |

### 7.2 Input / Select / Textarea (`.mj-field input/select/textarea`)

| Estado | Implementación |
|---|---|
| Default | `border: 1px solid var(--mj-color-border)`, `background: var(--mj-color-bg-canvas)`, `min-height: 44px` (`textarea`: `88px`) |
| Hover | **No implementado** |
| Active/Focus | Solo `:focus-visible` global (no hay estilo de foco específico para campos de formulario más allá del outline global) |
| Disabled | Estilo nativo del navegador (atributo `disabled` en JSX; no hay regla CSS `:disabled` propia para inputs, a diferencia de `.mj-button`) — **inconsistencia menor**: el botón sí define opacidad en disabled, el input no |
| Error | No hay borde de error por campo; la validación se comunica vía `.mj-banner--error` a nivel de formulario (`aria-describedby` no implementado literalmente en JSX pese a estar prescrito en `prototype-spec.md` §B.3) |

### 7.3 Badge (`.mj-badge`)

| Estado / variante | Implementación |
|---|---|
| Default (contador) | `background: var(--mj-color-border)`, `color: var(--mj-color-text-primary)`, `border-radius: pill` |
| `--prioridad-baja/media/alta` | `background: transparent`, `border: 1px solid` + `color` del token de prioridad correspondiente (contraste ≥3:1 como componente UI) |
| Hover/Active/Focus | No aplica — elemento no interactivo (`<span>`) |
| Disabled | No aplica |

### 7.4 Card (`.mj-card`)

| Estado | Implementación |
|---|---|
| Default | `background: var(--mj-color-bg-surface)`, `border: 1px solid var(--mj-color-border)`, `border-radius: md`, `box-shadow: sm`, `padding: space-5` |
| Variante ticket (`.mj-ticket-card`) | Mismo `.mj-card` + `margin-top: space-4`, layout en columna |
| Variante proyecto (`.mj-project-card`, es `<Link>`) | `text-decoration: none`, `color: inherit` |
| Hover | **No implementado** — un `<Link>` completo funciona como card clickeable sin feedback visual de hover propio |
| Focus | Hereda `:focus-visible` global sobre el `<Link>`/`<button>` interno |

### 7.5 Avatar (`.mj-avatar`)

| Estado | Implementación |
|---|---|
| Default | Círculo `28×28px`, `background: var(--mj-color-action-primary)`, `color: var(--mj-color-text-on-primary)`, iniciales del email como fallback (`title` con email completo para accesibilidad) |
| Interactivo | No aplica — es puramente informativo, no clickeable |

### 7.6 Banner (`.mj-banner`)

| Variante | Implementación |
|---|---|
| `--error` | `background: var(--mj-color-error-bg)`, `color: var(--mj-color-error-text)`, `role="alert"` |
| `--info` | `background: var(--mj-color-info-bg)`, `color: var(--mj-color-info-text)`, `role="status"` |
| Éxito | **No implementado como banner** — el feedback de éxito actual es solo `AnnouncerContext` (aria-live), sin componente Toast visual pese a estar previsto (`--mj-z-toast`) |

### 7.7 Drawer / Modal (`.mj-drawer-overlay`, `.mj-drawer`)

| Estado | Implementación |
|---|---|
| Apertura | Overlay `rgba(0,0,0,0.4)` con animación `mj-fade-in`; panel con `mj-slide-in` (`translateX(16px)` → `0`), ambas respetando `prefers-reduced-motion` |
| Foco | `role="dialog"`, `aria-modal="true"`, `Escape` cierra (`TicketDrawer.tsx`); **atrapar el foco dentro del drawer (focus trap) está prescrito en `prototype-spec.md` §B.2 pero no implementado en el código actual** |
| Cierre | Click en overlay (`stopPropagation` en el panel) o botón `✕` |

### 7.8 Skeleton (`.mj-skeleton`)

| Estado | Implementación |
|---|---|
| Loading | Gradiente animado (`background-size: 200% 100%`, `animation: mj-skeleton-pulse 1.4s`), `aria-hidden="true"`; variantes `SkeletonProjectGrid` y `SkeletonBoard` componen líneas (`SkeletonLine`) dentro de `.mj-card`/`.mj-board-column` |
| Reduced motion | Frecuencia de animación anulada por la regla global `@media (prefers-reduced-motion: reduce)` |

---

## 8. Bloque `:root {}` consolidado

Variables reales de `tokens.css`, sin duplicados, listas para portar a un `@theme` de Tailwind v4 (mapear cada `--mj-*` a su equivalente `--color-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--text-*`, `--font-weight-*`, `--ease-*` según la convención de Tailwind).

```css
:root {
  /* Color: superficies y texto (tema claro, default) */
  --mj-color-bg-canvas: #ffffff;
  --mj-color-bg-surface: #ffffff;
  --mj-color-border: #d2d2d7;
  --mj-color-text-primary: #1d1d1f;
  --mj-color-text-secondary: #6e6e73;
  --mj-color-text-on-primary: #ffffff;

  /* Color: acción primaria e interactivos */
  --mj-color-action-primary: #0071e3;
  --mj-color-link: #0071e3;
  --mj-color-focus-ring: #0071e3;

  /* Color: prioridad de ticket */
  --mj-color-priority-baja: #1c7a3d;
  --mj-color-priority-media: #a15c00;
  --mj-color-priority-alta: #c0201c;

  /* Color: estados de feedback */
  --mj-color-danger: #d70015;
  --mj-color-info-bg: #eef6ff;
  --mj-color-info-text: #0b4a8f;
  --mj-color-error-bg: #fdecec;
  --mj-color-error-text: #8a1c1c;

  /* Espaciado (escala base 4px) */
  --mj-space-1: 4px;
  --mj-space-2: 8px;
  --mj-space-3: 12px;
  --mj-space-4: 16px;
  --mj-space-5: 24px;
  --mj-space-6: 32px;
  --mj-space-7: 48px;
  --mj-space-8: 64px;

  /* Tipografía */
  --mj-font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --mj-font-size-display: 2.5rem;
  --mj-font-size-h1: 2rem;
  --mj-font-size-h2: 1.375rem;
  --mj-font-size-h3: 1.125rem;
  --mj-font-size-body: 1rem;
  --mj-font-size-caption: 0.85rem;
  --mj-font-weight-regular: 400;
  --mj-font-weight-medium: 500;
  --mj-font-weight-semibold: 600;
  --mj-line-height-tight: 1.2;
  --mj-line-height-base: 1.5;
  --mj-line-height-relaxed: 1.7;

  /* Radios y sombras */
  --mj-radius-sm: 4px;
  --mj-radius-md: 8px;
  --mj-radius-lg: 16px;
  --mj-radius-pill: 999px;
  --mj-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --mj-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);

  /* Movimiento */
  --mj-duration-fast: 100ms;
  --mj-duration-base: 200ms;
  --mj-duration-slow: 320ms;
  --mj-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-index */
  --mj-z-dropdown: 10;
  --mj-z-modal: 100;
  --mj-z-toast: 1000;

  /* Breakpoints (referencia — CSS no permite var() dentro de @media,
     mantener en sync con los literales usados en las media queries) */
  --mj-breakpoint-sm: 480px;
  --mj-breakpoint-md: 768px;
  --mj-breakpoint-lg: 1024px;
}

/* Overrides de tema oscuro (RF-15) — mismas variables, valores
   reverificados independientemente contra WCAG AA, no una inversión
   automática de la escala de grises. */
@media (prefers-color-scheme: dark) {
  :root {
    --mj-color-bg-canvas: #1d1d1f;
    --mj-color-bg-surface: #2c2c2e;
    --mj-color-border: #3a3a3c;
    --mj-color-text-primary: #f5f5f7;
    --mj-color-text-secondary: #a1a1a6;
    --mj-color-link: #4da3ff;
    --mj-color-priority-baja: #4ade80;
    --mj-color-priority-media: #fbbf24;
    --mj-color-priority-alta: #f87171;
    --mj-color-danger: #f87171;
    --mj-color-info-bg: #12263d;
    --mj-color-info-text: #bcdcff;
    --mj-color-error-bg: #3a1414;
    --mj-color-error-text: #ffb4ab;
  }
}
```

---

## 9. Gaps detectados (para priorizar antes de escalar el sistema)

1. **Sin estados `:hover`/`:active`** en `.mj-button`, `.mj-card`/`.mj-project-card` ni inputs — solo `:disabled` (botón) y `:focus-visible` global.
2. **Sin componente Toast** pese a tener `--mj-z-toast` reservado — el feedback de éxito depende solo de `aria-live` (`AnnouncerContext`), sin confirmación visual.
3. **Sin focus trap** en `.mj-drawer` pese a estar prescrito en `prototype-spec.md` §B.2.
4. **`--mj-radius-lg` y `--mj-font-size-h3`/`-medium`/`-relaxed`** están declarados pero ningún componente los consume todavía.
5. **Sin sombra de dropdown** ni componente `Dropdown` propio (se usa `<select>` nativo).
6. **Inputs sin estilo de `:disabled` propio** (a diferencia de `.mj-button`, que sí define `opacity: 0.6`).
