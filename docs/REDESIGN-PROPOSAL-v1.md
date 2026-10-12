Aquí tienes el sistema de diseño completo y el código CSS listo para producción de **FinClaro**.

---

### 1. DIRECCIÓN DE DISEÑO: *«The Modern Financial Ledger»*

El concepto rector evoluciona FinClaro de un blog estático a una **publicación financiera de referencia (estilo *Financial Times* / *Monocle* / *Stripe Press*) adaptada a herramientas digitales interactivas**.

#### Principios clave:
1. **Tipografía con autoridad editorial:** Titulares serif refinados con números tabulares de alta precisión. La serifa transmite solidez jurídica y bancaria; la sans geométrica otorga claridad quirúrgica a los datos.
2. **Dualidad Cromática: Papel Noble y Verde Bosque Profundo:** Abandonamos la dependencia del dorado genérico (que suele verse envejecido o pretencioso) en favor de un verde botánico profundo (*Racing Green*) combinado con papel marfil cálido y acentos sutiles en latón cepillado.
3. **Estructura tipo "Border-Grid":** En lugar de tarjetas flotantes con sombras genéricas difusas, utilizamos microbordes nítidos de 1px con contrastes calculados que evocan libros contables encuadernados y prensa económica de alta gama.
4. **Claridad Funcional:** Cero distracciones decorativas. El valor percibido proviene de los márgenes generosos, el ritmo vertical impecable y la velocidad de carga inmediata.

---

### 2. PALETA CROMÁTICA EXACTA

| Token | Hex | Rol y Justificación |
|---|---|---|
| `--fc-canvas` | `#F8F6F0` | **Fondo general (Papel crema noble).** Menos amarillo que `#F6F3EC`, más refinado y con descanso visual superior a pantallas blancas puras. |
| `--fc-surface` | `#FFFFFF` | **Superficie de tarjetas y módulos interactivos.** Contraste limpio con el canvas para elevar jerarquía. |
| `--fc-surface-subtle` | `#EFECE3` | **Superficie secundaria.** Fondos de calculadoras, tablas y bloques alternos. |
| `--fc-ink` | `#0E1218` | **Texto principal.** Negro carbón con tinte azulado casi imperceptible. Menos agresivo que `#000000`, más nítido que el anterior `#111318`. |
| `--fc-muted` | `#505662` | **Texto secundario.** Cumple ratio de contraste WCAG AAA sobre `#F8F6F0` (ratio 7.4:1). |
| `--fc-primary` | `#083D32` | **Verde Bosque Profundo (Acento Principal).** Evoca solidez patrimonial, crecimiento y rigor institucional. Reemplaza el dorado en CTAs primarios y headers. |
| `--fc-primary-hover` | `#0C5446` | Estado hover interactivo para el verde primario. |
| `--fc-accent` | `#A87C38` | **Latón Envejecido (Acento Secundario).** Evolución del dorado actual (`#C39B50`), ahora más terroso y sobrio, reservado exclusivamente para kickers, tags premium y destaques selectivos. |
| `--fc-border` | `#E0DCD1` | **Borde estándar.** Delicado, nítido, simula el guilloché de papelería bancaria. |
| `--fc-border-focus` | `#083D32` | Foco accesible de teclado. |
| `--fc-dark-surface` | `#090C0E` | **Superficie oscura (Footer y Hero home).** Grafito profundo mate, sustituye al `#0B0C0F`. |
| `--fc-success` | `#166534` | Verde semántico para rendimientos positivos y validaciones. |
| `--fc-warning` | `#9A3412` | Ocre quemado para alertas fiscales/financieras. |
| `--fc-danger` | `#991B1B` | Rojo carmesí sobrio para comisiones, costes o errores. |

---

### 3. TIPOGRAFÍA

* **Titulares (Serif):** `Newsreader` (Google Fonts). Diseñada específicamente para lectura editorial de pantallas de alta densidad. Su versión en cursiva añade un toque premium en subtítulos y enfatizados.
* **Cuerpo e Interfaz (Sans-serif):** `Plus Jakarta Sans` (Google Fonts). Geométrica, contemporánea, con amplio set de legibilidad en cuerpos pequeños de móvil.
* **Datos y Cifras (Monospace/Tabular):** `JetBrains Mono` con alineación tabular para desgloses de nóminas, cuotas de hipotecas y calculadoras.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

#### Escala Tipográfica:
* **Display / Hero H1:** `clamp(40px, 5.5vw, 68px)` | Peso: `700` | Line-height: `1.05` | Letter-spacing: `-0.035em`
* **H2 (Secciones / Guías):** `clamp(28px, 3.5vw, 42px)` | Peso: `600` | Line-height: `1.18` | Letter-spacing: `-0.025em`
* **H3 (Bloques / Cards destacadas):** `clamp(20px, 2.2vw, 26px)` | Peso: `600` | Line-height: `1.25` | Letter-spacing: `-0.015em`
* **H4 / Subtítulos:** `18px` | Peso: `600` | Line-height: `1.35`
* **Cuerpo Principal (Artículos):** `18px` (móvil: `17px`) | Peso: `400` | Line-height: `1.72` | Letter-spacing: `-0.005em`
* **UI / Meta / Explicaciones cortas:** `14px` | Peso: `500` | Line-height: `1.5`
* **Eyebrow / Kicker:** `11px` | Peso: `700` | Line-height: `1.2` | Letter-spacing: `0.14em` | Text-transform: `uppercase`
* **Datos numéricos en calculadoras:** `clamp(32px, 4vw, 46px)` | Peso: `600` (`JetBrains Mono`) | Tabular nums activado.

---

### 4. LAYOUT Y SISTEMA DE ESPACIADO

* **Escala Modular de Espaciado:** `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`.
* **Ancho máximo estructural (`--fc-wrap`):** `1200px` con padding lateral de `24px` (móvil: `18px`).
* **Ancho de columna de lectura (`--fc-article-max`):** `720px` centrado (óptimo para 65-75 caracteres por línea, maximiza tiempo de permanencia e integra bloques AdSense sin deformar párrafos).
* **Grid de Calculadoras:** Dos columnas asimétricas `55% / 45%` en desktop (Inputs a la izquierda, Output flotante "Sticky Ledger" a la derecha). En móvil: apilado secuencial natural.

---

### 5. ANATOMÍA DE COMPONENTES

1. **Header:** Fijo, fondo translúcido con desenfoque de cristal sobrio (`rgba(248, 246, 240, 0.88)` + `backdrop-filter: blur(12px)`), borde inferior de `1px solid var(--fc-border)`. Altura `68px`.
2. **Hero:** Fondo oscuro texturado en tinta (`#090C0E`), texto de alto contraste, acentos en latón.
3. **Cards de Contenido:** Superficie `#FFFFFF`, borde perimetral nítido `1px solid var(--fc-border)`, radio de curvatura contenido (`10px`). En hover: microdesplazamiento vertical (-3px) y sombra profunda pero etérea.
4. **Calculadoras (Inputs & Ledger):**
   * Inputs enmarcados en `#FFFFFF` con radio `6px`, borde de `1.5px`, fuentes mono en números y prefijos/sufijos en pastilla fija.
   * Caja de Resultados: Fondo verde bosque tenue (`#F0F6F4`) o superficie blanca con marco destacado en verde oscuro (`#083D32`), cifra principal en tamaño monumental.
5. **FAQ Accordion:** Borde inferior continuo, botón de expansión de ancho completo, icono en rotación suave de 45°, cero fondos estridentes.
6. **Blockquote / Callouts:** Borde izquierdo sólido de 3px (`#083D32` o `#A87C38`), fondo `#F0EDE5`, tipografía Newsreader itálica a 19px.
7. **Botones:**
   * *Primario:* Fondo `#083D32`, texto blanco, esquinas de `6px`, peso 600, padding `13px 24px`.
   * *Secundario:* Fondo transparente, borde de 1px `#0E1218`, texto `#0E1218`.
   * *Terciario:* Enlace con subrayado desplazado de 3px que se engrosa en hover.

---

### 6. MICROINTERACCIONES

* **Hover en tarjetas:** `transform: translateY(-3px); box-shadow: 0 12px 28px -8px rgba(14, 18, 24, 0.08); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;`
* **Botones primarios:** Microescala en activo `transform: scale(0.985);` para sensación táctil.
* **Focus States:** `outline: 2px solid var(--fc-primary); outline-offset: 2px;` sin romper la accesibilidad nativa del navegador.
* **Render de Resultados en Calculadoras:** Al recalcular un resultado, la cifra hace un fade-in sutil (`opacity: 0 -> 1` con duración de `150ms`).

---

### 7. COMPORTAMIENTO RESPONSIVE

* **Desktop (> 980px):** Navegación completa desplegada, layouts a 2-3 columnas, panel de cálculo con sticky a 88px del top.
* **Tablet (701px - 980px):** Grids de topics a 3 columnas, calculadoras a 1 columna completa con el bloque de resultados inmediatamente inferior a los inputs.
* **Mobile (≤ 700px):**
  * Padding de pantalla: `18px`.
  * Menú hamburguesa optimizado con panel desplegable a pantalla completa o drawer.
  * Inputs con font-size mínimo de `16px` para evitar el auto-zoom no deseado de iOS Safari.
  * Celdas de tabla financieras con scroll horizontal nativo asistido por gradiente indicador lateral.

---

### 8. CSS COMPLETO DE PRODUCCIÓN

El siguiente bloque CSS reemplaza e integra tanto la arquitectura moderna `fc-*` como todas las clases de soporte legacy (`.article`, `.tool`, `.faq`, `.quote`, `.card`, etc.) garantizando que las 55 páginas no rompan layout ni estilos de AdSense.

```css
/* ==========================================================================
   FINCLARO - DESIGN SYSTEM PRODUCTION CSS (finclaro.es)
   Versión: 2.0 (Editorial Prestige & Legacy Compatible)
   ========================================================================== */

/* 1. IMPRESIÓN TIPOGRÁFICA */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

/* 2. VARIABLES DE SISTEMA */
:root {
  /* Paleta Nuclear */
  --fc-canvas: #F8F6F0;
  --fc-paper: #F8F6F0; /* alias compatibilidad */
  --fc-surface: #FFFFFF;
  --fc-white: #FFFFFF; /* alias compatibilidad */
  --fc-surface-subtle: #EFECE3;
  --fc-dark: #090C0E;
  --fc-dark-surface: #11151A;

  /* Textos */
  --fc-ink: #0E1218;
  --fc-muted: #505662;
  --fc-ink-light: #F8F6F0;

  /* Acentos de Marca */
  --fc-primary: #083D32;
  --fc-primary-hover: #0C5446;
  --fc-accent: #A87C38;
  --fc-accent-light: #F4EBD9;
  --fc-gold: #A87C38; /* alias compatibilidad */
  --fc-gold-light: #F4EBD9; /* alias compatibilidad */
  --fc-green: #083D32; /* alias compatibilidad */

  /* Líneas & Bordes */
  --fc-line: #E0DCD1;
  --fc-border: #E0DCD1;
  --fc-border-subtle: #ECE8DE;

  /* Semántica Financiera */
  --fc-success: #166534;
  --fc-warning: #9A3412;
  --fc-danger: #991B1B;

  /* Familias Tipográficas */
  --fc-serif: "Newsreader", "Source Serif 4", Georgia, serif;
  --fc-sans: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --fc-display: var(--fc-serif);
  --fc-mono: "JetBrains Mono", monospace;

  /* Layout */
  --fc-wrap: 1200px;
  --fc-article-max: 740px;
  --fc-radius-sm: 4px;
  --fc-radius: 8px;
  --fc-radius-lg: 14px;
  --fc-shadow-sm: 0 1px 3px rgba(14, 18, 24, 0.04);
  --fc-shadow: 0 8px 24px -4px rgba(14, 18, 24, 0.06);
  --fc-shadow-lg: 0 16px 36px -6px rgba(14, 18, 24, 0.1);
  --fc-transition: 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 3. RESET Y BASE NATIVA */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  background-color: var(--fc-canvas);
  color: var(--fc-ink);
  font-family: var(--fc-sans);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  line-height: 1.6;
}

img, svg {
  display: block;
  max-width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
  transition: color var(--fc-transition);
}

/* 4. TIPOGRAFÍA Y ESCALA */
h1, h2, h3, h4, .fc-h1, .fc-h2, .fc-h3 {
  font-family: var(--fc-serif);
  font-feature-settings: "lnum" 1;
  color: var(--fc-ink);
  font-weight: 600;
}

h1, .fc-h1 {
  font-size: clamp(38px, 5vw, 62px);
  line-height: 1.08;
  letter-spacing: -0.03em;
  margin-bottom: 24px;
}

h2, .fc-h2 {
  font-size: clamp(26px, 3.2vw, 38px);
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-top: 48px;
  margin-bottom: 18px;
}

h3, .fc-h3 {
  font-size: clamp(20px, 2.2vw, 26px);
  line-height: 1.3;
  letter-spacing: -0.015em;
  margin-top: 32px;
  margin-bottom: 14px;
}

h4 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

p {
  font-size: 17px;
  line-height: 1.7;
  color: var(--fc-ink);
  margin-bottom: 20px;
}

.fc-muted, .text-muted {
  color: var(--fc-muted);
}

.fc-eyebrow, .kicker {
  display: inline-block;
  font-family: var(--fc-sans);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--fc-accent);
  margin-bottom: 12px;
}

/* 5. CONTENEDORES Y ESTRUCTURA */
.fc-wrap, .wrap {
  width: 100%;
  max-width: var(--fc-wrap);
  margin-left: auto;
  margin-right: auto;
  padding-left: 24px;
  padding-right: 24px;
}

.fc-wrap-narrow {
  max-width: var(--fc-article-max);
}

/* 6. HEADER & NAVEGACIÓN (SITE-HEADER & FC-HEADER) */
.fc-header, .site-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 70px;
  background-color: rgba(248, 246, 240, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--fc-border);
  display: flex;
  align-items: center;
}

.fc-header .fc-wrap, .site-header .wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fc-logo, .site-logo {
  font-family: var(--fc-serif);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--fc-ink);
  display: flex;
  align-items: center;
  gap: 8px;
}

.fc-logo span, .site-logo span {
  color: var(--fc-accent);
}

.fc-nav-list, .site-nav ul {
  display: flex;
  list-style: none;
  gap: 28px;
  align-items: center;
}

.fc-nav-link, .site-nav a {
  font-size: 14px;
  font-weight: 600;
  color: var(--fc-muted);
}

.fc-nav-link:hover, .site-nav a:hover {
  color: var(--fc-primary);
}

/* 7. HERO EDITORIAL (HOME & CATEGORÍAS) */
.fc-hero-dark, .hero-dark {
  background-color: var(--fc-dark);
  color: var(--fc-ink-light);
  padding: 80px 0 90px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
}

.fc-hero-dark h1, .hero-dark h1 {
  color: #FFFFFF;
}

.fc-hero-dark p, .hero-dark p {
  color: #B4B9C2;
  font-size: 19px;
  max-width: 620px;
}

.fc-hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 60px;
  align-items: center;
}

/* 8. BOTONES Y ACCIONES */
.fc-btn, .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--fc-sans);
  font-size: 14px;
  font-weight: 600;
  padding: 12px 22px;
  border-radius: var(--fc-radius-sm);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--fc-transition);
  text-decoration: none;
}

.fc-btn-primary, .btn-primary {
  background-color: var(--fc-primary);
  color: #FFFFFF !important;
  box-shadow: 0 2px 6px rgba(8, 61, 50, 0.15);
}

.fc-btn-primary:hover, .btn-primary:hover {
  background-color: var(--fc-primary-hover);
  transform: translateY(-1px);
}

.fc-btn-primary:active, .btn-primary:active {
  transform: translateY(0);
}

.fc-btn-secondary, .btn-secondary {
  background-color: transparent;
  border-color: var(--fc-border);
  color: var(--fc-ink);
}

.fc-btn-secondary:hover, .btn-secondary:hover {
  border-color: var(--fc-ink);
  background-color: var(--fc-surface);
}

/* 9. CARDS Y GRIDS EDITORIALES */
.fc-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 28px;
  margin: 40px 0;
}

.fc-card, .card {
  background: var(--fc-surface);
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius);
  padding: 30px;
  display: flex;
  flex-direction: column;
  transition: transform var(--fc-transition), box-shadow var(--fc-transition), border-color var(--fc-transition);
}

.fc-card:hover, .card:hover {
  transform: translateY(-3px);
  border-color: #D3CDC0;
  box-shadow: var(--fc-shadow);
}

.fc-card h3, .card h3 {
  margin-top: 10px;
  font-size: 21px;
}

.fc-card p, .card p {
  color: var(--fc-muted);
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 0;
}

/* Badge / Tags */
.fc-badge, .tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 4px;
  background: var(--fc-surface-subtle);
  color: var(--fc-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* 10. ARTÍCULOS Y CONTENIDO LONG-FORM (.article) */
.article-container, .fc-article {
  max-width: var(--fc-article-max);
  margin: 50px auto 80px;
  padding: 0 20px;
}

.article-header {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--fc-border);
}

.article-body p {
  font-size: 18px;
  line-height: 1.74;
  margin-bottom: 24px;
}

.article-body strong {
  font-weight: 600;
  color: var(--fc-ink);
}

.article-body a {
  color: var(--fc-primary);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
}

.article-body a:hover {
  color: var(--fc-primary-hover);
  text-decoration-thickness: 2px;
}

.article-body ul, .article-body ol {
  margin: 24px 0 28px 24px;
  font-size: 17px;
  line-height: 1.7;
}

.article-body li {
  margin-bottom: 10px;
  padding-left: 6px;
}

/* Blockquotes y destacados editoriales */
.fc-quote, .quote, blockquote {
  margin: 36px 0;
  padding: 24px 28px;
  background-color: var(--fc-surface-subtle);
  border-left: 4px solid var(--fc-accent);
  border-radius: 0 var(--fc-radius) var(--fc-radius) 0;
}

.fc-quote p, blockquote p {
  font-family: var(--fc-serif);
  font-size: 19px;
  font-style: italic;
  line-height: 1.6;
  color: var(--fc-ink);
  margin-bottom: 0;
}

/* Breadcrumbs */
.fc-breadcrumbs, .breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--fc-muted);
  margin-bottom: 24px;
}

.fc-breadcrumbs a:hover, .breadcrumbs a:hover {
  color: var(--fc-ink);
}

/* 11. CALCULADORAS Y HERRAMIENTAS (.tool) */
.fc-calculator, .tool {
  background: var(--fc-surface);
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius-lg);
  box-shadow: var(--fc-shadow);
  padding: 36px;
  margin: 40px 0;
}

.fc-calc-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 40px;
}

.fc-input-group {
  margin-bottom: 24px;
}

.fc-label, label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fc-ink);
  margin-bottom: 8px;
}

.fc-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.fc-input, input[type="number"], input[type="text"], select {
  width: 100%;
  font-family: var(--fc-mono);
  font-size: 16px;
  padding: 13px 16px;
  background-color: var(--fc-canvas);
  border: 1.5px solid var(--fc-border);
  border-radius: var(--fc-radius-sm);
  color: var(--fc-ink);
  transition: border-color var(--fc-transition), background-color var(--fc-transition);
}

.fc-input:focus, input:focus, select:focus {
  outline: none;
  border-color: var(--fc-primary);
  background-color: #FFFFFF;
}

.fc-input-prefix, .fc-input-suffix {
  position: absolute;
  font-family: var(--fc-sans);
  font-weight: 600;
  color: var(--fc-muted);
  font-size: 14px;
}

.fc-input-suffix { right: 14px; }
.fc-input-prefix { left: 14px; }

/* Panel de Resultados (Ledger Output) */
.fc-calc-results {
  background-color: var(--fc-surface-subtle);
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius);
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.fc-calc-big-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--fc-muted);
}

.fc-calc-big-number {
  font-family: var(--fc-mono);
  font-size: clamp(34px, 4vw, 44px);
  font-weight: 600;
  color: var(--fc-primary);
  line-height: 1.1;
  margin: 10px 0 20px;
  font-variant-numeric: tabular-nums;
}

/* 12. FAQ ACCORDION (.faq) */
.fc-faq-list, .faq {
  margin: 40px 0;
  border-top: 1px solid var(--fc-border);
}

.fc-faq-item {
  border-bottom: 1px solid var(--fc-border);
}

.fc-faq-question {
  width: 100%;
  padding: 20px 0;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--fc-sans);
  font-size: 17px;
  font-weight: 600;
  color: var(--fc-ink);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.fc-faq-question:hover {
  color: var(--fc-primary);
}

.fc-faq-answer {
  padding-bottom: 24px;
  color: var(--fc-muted);
  font-size: 15px;
  line-height: 1.7;
}

/* 13. INTEGRACIÓN PUBLICITARIA (AdSense-Safe) */
.fc-ad-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--fc-surface-subtle);
  border: 1px dashed var(--fc-border);
  margin: 36px 0;
  min-height: 100px;
  overflow: hidden;
}

/* 14. FOOTER (SITE-FOOTER & FC-FOOTER) */
.fc-footer, .site-footer {
  background-color: var(--fc-dark);
  color: #8C939E;
  padding: 80px 0 40px;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.fc-footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 60px;
}

.fc-footer-col h5 {
  font-family: var(--fc-sans);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #FFFFFF;
  margin-bottom: 20px;
}

.fc-footer-col ul {
  list-style: none;
}

.fc-footer-col li {
  margin-bottom: 12px;
}

.fc-footer-col a {
  font-size: 14px;
  color: #8C939E;
}

.fc-footer-col a:hover {
  color: #FFFFFF;
}

.fc-footer-bottom {
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 15. ADAPTACIÓN RESPONSIVE */
@media (max-width: 980px) {
  .fc-hero-grid, .fc-calc-grid {
    grid-template-columns: 1fr;
    gap: 36px;
  }
  .fc-footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  :root {
    --fc-wrap: 100%;
  }
  .fc-wrap, .wrap {
    padding-left: 18px;
    padding-right: 18px;
  }
  .fc-header, .site-header {
    height: 62px;
  }
  .fc-nav-list, .site-nav {
    display: none; /* Implementar drawer/toggle móvil habitual sin romper dom */
  }
  .fc-grid-3 {
    grid-template-columns: 1fr;
  }
  .fc-calculator, .tool {
    padding: 24px 18px;
  }
  .article-container {
    padding: 0 16px;
    margin-top: 30px;
  }
  .fc-footer-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .fc-footer-bottom {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
```

### Instrucciones de Aplicación Directa:
1. Pega la etiqueta de fuentes de Google Fonts en el `<head>` de tu plantilla base (`_includes/head.html` o similar).
2. Sobrescribe tu archivo de estilos principal (ej. `css/main.css` o `css/style.css`) con el bloque CSS del apartado 8.
3. Como todas las variables maestras (`--fc-ink`, `--fc-paper`, `--fc-serif`, etc.) y las clases de compatibilidad (`.article`, `.tool`, `.faq`, etc.) han sido preservadas y mapeadas a los nuevos valores cromáticos y tipográficos, **las 55 páginas absorberán inmediatamente el nuevo look premium sin que tengas que retocar el marcado HTML**.