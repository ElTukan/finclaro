#!/usr/bin/env python3
# Auditoria: que clases usan las paginas y que selectores define styles.css
import re, glob, os, collections

RAIZ = os.path.dirname(os.path.abspath(__file__))

# 1) Selectores definidos en styles.css
css = open(os.path.join(RAIZ, "styles.css"), encoding="utf-8").read()
# quitar comentarios
css_limpio = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
# quitar el contenido de los bloques @media/@keyframes para no contar sus reglas internas
selectores = set()
for bloque in re.finditer(r"([^{}]+)\{", css_limpio):
    sel = bloque.group(1).strip()
    if sel.startswith("@") or not sel:
        continue
    for parte in sel.split(","):
        parte = parte.strip()
        # quedarse con las clases y elementos simples
        for cl in re.findall(r"\.([A-Za-z0-9_-]+)", parte):
            selectores.add(cl)
        for el in re.findall(r"(?:^|[\s>+~])([a-z][a-z0-9]*)", parte):
            selectores.add(el)

# 2) Clases usadas en las paginas
paginas = sorted(glob.glob(os.path.join(RAIZ, "*.html")))
usadas = collections.Counter()
por_pagina = {}
for p in paginas:
    txt = open(p, encoding="utf-8").read()
    clases = set()
    for m in re.finditer(r'class="([^"]+)"', txt):
        for c in m.group(1).split():
            clases.add(c)
    por_pagina[os.path.basename(p)] = clases
    for c in clases:
        usadas[c] += 1

# 3) Clasificar paginas
cats = {"ahorro","hipotecas","nomina","inversion","cuentas","prestamos","finanzas-personales"}
grupos = {"home": [], "categoria": [], "articulo": [], "legal": []}
for nombre, cl in por_pagina.items():
    if nombre == "index.html":
        grupos["home"].append(nombre)
    elif nombre.replace(".html","") in cats:
        grupos["categoria"].append(nombre)
    elif nombre in ("404.html","privacidad.html","aviso-legal.html","sobre-finclaro.html"):
        grupos["legal"].append(nombre)
    elif "calculadora" in nombre or nombre.replace(".html","") in (
        "cuanto-irpf-me-tienen-que-retener","euribor-hoy","cuando-se-cobra-el-paro",
        "cuando-se-cobra-la-pension","cuando-se-cobra-el-imv","2000-euros-brutos-cuanto-es-neto-2026",
        "30000-euros-brutos-cuanto-es-neto-2026","paga-extra-pensiones"):
        grupos["articulo"].append(nombre)
    else:
        grupos["articulo"].append(nombre)

print("=== GRUPOS DE PAGINAS ===")
for g, l in grupos.items():
    print(f"  {g}: {len(l)}")
print("  total html:", len(paginas))
print()

print("=== CLASES USADAS QUE NO TIENEN SELECTOR EN styles.css (HUERFANAS) ===")
huerfanas = sorted([c for c in usadas if c not in selectores])
for c in huerfanas:
    print(f"  .{c}  (en {usadas[c]} paginas)")
print(f"  TOTAL huerfanas: {len(huerfanas)}")
print()

print("=== CLASES HUERFANAS Y EN QUE GRUPO APARECEN ===")
for c in huerfanas:
    donde = [g for g, l in grupos.items() if any(c in por_pagina[n] for n in l)]
    print(f"  .{c} -> {', '.join(donde)}")
print()

print("=== SELECTORES EN CSS QUE NO SE USAN EN NINGUNA PAGINA ===")
no_usados = sorted([s for s in selectores if re.match(r"^[a-z][a-z0-9]*$", s) == None and s not in usadas])
print("  (elementos y clases sin uso):", len(no_usados))
for s in no_usados:
    print(f"  .{s}")
