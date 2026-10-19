#!/usr/bin/env python3
"""
Migración v2 «Modern Financial Ledger» — ediciones quirúrgicas de HTML.

 1. index.html           : quita el <link> de Google Fonts (ahora se cargan via @import en styles.css)
 2. finanzas-personales  : quita el <style> embebido (migrado a styles.css) y los <link> de fuentes
 3. 6 páginas de categoría: añade class="cat" al <body> para activar su bloque de estilos

Idempotente: si vuelve a ejecutarse, no rompe nada.
"""
import re, os, sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
CAMBIOS = []


def leer(nombre):
    with open(os.path.join(RAIZ, nombre), encoding="utf-8") as f:
        return f.read()


def escribir(nombre, txt):
    with open(os.path.join(RAIZ, nombre), "w", encoding="utf-8") as f:
        f.write(txt)


def aplicar(nombre, txt, patrón, reemplazo, descripcion, flags=0):
    nuevo, n = re.subn(patrón, reemplazo, txt, flags=flags)
    CAMBIOS.append((nombre, descripcion, n))
    return nuevo


# ---------------------------------------------------------------- 1. index.html
txt = leer("index.html")
antes = txt
# el bloque de fuentes: preconnect (se conserva) + css2 (se elimina)
txt = aplicar(
    "index.html", txt,
    r'\n\s*<link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet">',
    "", "elimina <link> de Google Fonts (DM Sans/Manrope/Source Serif 4)"
)
if txt != antes:
    escribir("index.html", txt)

# ------------------------------------------------- 2. finanzas-personales.html
nombre = "finanzas-personales.html"
txt = leer(nombre)
# 2a. quitar el <style> embebido completo
txt = aplicar(
    nombre, txt,
    r'<style>.*?</style>', "", "elimina el <style> embebido (migrado a styles.css)",
    flags=re.S
)
# 2b. quitar el <link> de Gelasio/Ubuntu Mono
txt = aplicar(
    nombre, txt,
    r'<link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet">',
    "", "elimina <link> de Google Fonts (Gelasio/Ubuntu Mono)"
)
escribir(nombre, txt)

# ------------------------------------------------- 3. páginas de categoría
CATEGORIAS = ["ahorro.html", "hipotecas.html", "nomina.html", "inversion.html",
              "cuentas.html", "prestamos.html"]
for cat in CATEGORIAS:
    txt = leer(cat)
    if 'class="cat"' in txt:
        CAMBIOS.append((cat, "ya tenía class=\"cat\"", 0))
        continue
    txt = aplicar(cat, txt, r"<body>", '<body class="cat">',
                  "añade class=\"cat\" al <body>")
    escribir(cat, txt)

# ---------------------------------------------------------------- informe
print("=== CAMBIOS APLICADOS ===")
for nombre, desc, n in CAMBIOS:
    estado = "OK" if n else "SIN EFECTO"
    print(f"  [{estado:>10}] {nombre:28s} {desc} ({n} ocurrencia/s)")
print()
print("Total de archivos que deberían aparecer modificados en git:",
      len({c[0] for c in CAMBIOS if c[2]}))
