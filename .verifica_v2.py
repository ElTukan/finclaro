#!/usr/bin/env python3
"""Verificación de la migración v2: integridad de HTML y CSS. (v2 corregida)"""
import os, re, glob, sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
errores, avisos, ok = [], [], []


def ruta(n):
    return os.path.join(RAIZ, n)


def urls_fuentes(t):
    """Devuelve solo las URLs css2 de Google Fonts de un HTML."""
    return re.findall(r'https://fonts\.googleapis\.com/css2\?[^"\']*', t)


# ---------------------------------------------------------- 1. HTML íntegros
HTMLS = sorted(glob.glob(ruta("*.html")))
for h in HTMLS:
    n = os.path.basename(h)
    t = open(h, encoding="utf-8").read()
    if not t.rstrip().endswith("</html>"):
        errores.append(f"{n}: no termina en </html>")
    for et in ("<html", "</html>", "<head>", "</head>", "<body", "</body>"):
        c = t.count(et)
        if c != 1:
            errores.append(f"{n}: '{et}' aparece {c} veces")
    if n == "finanzas-personales.html":
        if "<style>" in t or "</style>" in t:
            errores.append(f"{n}: todavía contiene un bloque <style>")
        if 'class="home"' not in t:
            errores.append(f'{n}: ha perdido class="home" en el body')
ok.append(f"{len(HTMLS)} páginas HTML revisadas (estructura y cierre correctos)")

# ------------------------------------------------ 2. categorías con .cat
CATS = ["ahorro.html", "hipotecas.html", "nomina.html", "inversion.html",
        "cuentas.html", "prestamos.html"]
for c in CATS:
    t = open(ruta(c), encoding="utf-8").read()
    if '<body class="cat">' not in t:
        errores.append(f"{c}: no se le ha añadido class=\"cat\"")
ok.append(f"{len(CATS)} páginas de categoría activadas con class=\"cat\"")

# ------------------------------------------------- 3. fuentes (solo en URLs)
VIEJAS = ["DM+Sans", "Manrope", "Source+Serif+4", "Gelasio", "Ubuntu+Mono",
          "family=Inter", "Inter:"]
n_fuentes = 0
for h in HTMLS:
    n = os.path.basename(h)
    for u in urls_fuentes(open(h, encoding="utf-8").read()):
        n_fuentes += 1
        for f in VIEJAS:
            if f in u:
                errores.append(f"{n}: sigue cargando la fuente antigua {f}")
if n_fuentes == 0:
    ok.append("0 páginas HTML cargan fuentes por <link> (todo va por @import en styles.css)")
else:
    errores.append(f"quedan {n_fuentes} <link> de fuentes en HTML")

css = open(ruta("styles.css"), encoding="utf-8").read()
css_urls = re.findall(r'https://fonts\.googleapis\.com/css2\?[^\'"]*', css)
if not css_urls:
    errores.append("styles.css: no tiene @import de fuentes")
else:
    for f in VIEJAS:
        if f in css_urls[0]:
            errores.append(f"styles.css: pide la fuente antigua {f}")
    for nueva in ["Newsreader", "Plus+Jakarta+Sans", "JetBrains+Mono"]:
        if nueva not in css_urls[0]:
            errores.append(f"styles.css: falta la fuente nueva {nueva}")
    ok.append("styles.css importa Newsreader + Plus Jakarta Sans + JetBrains Mono; 0 fuentes antiguas")

# ---------------------------------------------------------- 4. CSS sano
if css.count("{") != css.count("}"):
    errores.append(f"styles.css: llaves descompensadas ({css.count('{')} vs {css.count('}')})")
else:
    ok.append(f"styles.css: llaves balanceadas ({css.count('{')} bloques)")
if css.count("/*") != css.count("*/"):
    errores.append("styles.css: comentarios sin cerrar")
for tok in ["--fc-primary:#083D32", "--fc-accent:#A87C38", "--fc-canvas:#F8F6F0",
            "--fc-gold:#A87C38", "--fc-paper:#F8F6F0", "--fc-line:#E0DCD1",
            '--fc-serif:"Newsreader"', '--fc-sans:"Plus Jakarta Sans"', '--fc-mono:"JetBrains Mono"']:
    if tok.replace(" ", "") not in css.replace(" ", ""):
        errores.append(f"styles.css: falta el token {tok}")
ok.append("styles.css: 9 tokens v2 + alias v1 verificados")

sin_comentarios = re.sub(r"/\*.*?\*/", "", css, flags=re.S).strip()
if not sin_comentarios.startswith("@import"):
    errores.append("styles.css: el @import de fuentes no es la primera regla")
else:
    ok.append("styles.css: @import de fuentes en primera posición")

# ------------------------------------------- 5. selectores nuevos
NUEVOS = [".cat .site-header", ".cat .brand", ".cat .hero", ".cat .grid",
          ".cat .card", ".cat .card .tag", ".cat .btn", ".quick-answer", ".ad",
          ".calculator-fields", ".result-detail", ".reveal", ".reveal.in",
          ".cat .site-header.scrolled", ".home .skip-link"]
faltan = [s for s in NUEVOS if s not in css]
if faltan:
    errores.append(f"styles.css: faltan selectores nuevos -> {faltan}")
else:
    ok.append(f"styles.css: los {len(NUEVOS)} selectores nuevos están presentes")

# ------------------------------------------- 6. selectores v1 conservados
V1 = [".fc-header", ".fc-brand", ".fc-nav-links", ".fc-dashboard", ".fc-topic",
      ".fc-calc-card", ".fc-guide", ".fc-process-grid", ".fc-footer-bottom",
      ".fc-chart-line", ".fc-button-gold", ".fc-nav-cta",
      "article", "th,td", ".eyebrow", ".breadcrumbs", ".article-meta", ".lead",
      ".tool", ".faq", ".quote", ".related", ".source-list", ".wrap", "footer"]
faltan = [s for s in V1 if s not in css]
if faltan:
    errores.append(f"styles.css: se han perdido selectores v1 -> {faltan}")
else:
    ok.append(f"styles.css: los {len(V1)} selectores v1 críticos siguen presentes")

# ------------------------------------------- 7. bloque .home migrado
HOME = [".home .site-header", ".home .hero", ".home .hero-tool", ".home .ht-tab",
        ".home .topics", ".home .topic", ".home .tools-grid", ".home .tool-feature",
        ".home .quick-form", ".home .content-shell", ".home .toolbar", ".home .search",
        ".home .filters", ".home .filter", ".home .article-grid", ".home .article",
        ".home .footergrid", ".home .ft", ".home .proof-strip", ".home .skip-link",
        ".home .orb", ".home .button.light", ".home .navlinks"]
faltan = [s for s in HOME if s not in css]
if faltan:
    errores.append(f"styles.css: falta el CSS migrado de la guía madre -> {faltan}")
else:
    ok.append(f"styles.css: los {len(HOME)} selectores de la guía madre están migrados")

# ------------------------------------------- 8. sin CSS huérfano grave
HUERFANAS_ANTES = ["site-header", "card", "tag", "btn", "grid", "quick-answer", "ad"]
for c in HUERFANAS_ANTES:
    if f".{c}" not in css and f".cat .{c}" not in css:
        errores.append(f"styles.css: .{c} sigue sin estilo")

# ---------------------------------------------------------------- informe
print("=== OK ===")
for o in ok:
    print("  ✓", o)
if avisos:
    print("\n=== AVISOS ===")
    for a in avisos:
        print("  !", a)
print("\n=== ERRORES ===")
if errores:
    for e in errores:
        print("  ✗", e)
    sys.exit(1)
print("  ninguno")
