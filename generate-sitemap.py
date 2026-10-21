#!/usr/bin/env python3
"""
Genera sitemap.xml para finclaro.es
Recorre todos los .html del repo, lee su <link rel="canonical"> y construye el sitemap.
Solo incluye páginas con canonical apuntando a https://finclaro.es/
Excluye 404.html y archivos basura.
"""
import os
import re
import subprocess
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parents[0]
BASE_URL = "https://finclaro.es"

EXCLUDE = {"404.html"}

def git_lastmod(path):
    try:
        value = subprocess.check_output(
            ["git", "log", "-1", "--format=%cs", "--", str(path.relative_to(ROOT))],
            cwd=ROOT, text=True, stderr=subprocess.DEVNULL,
        ).strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            return value
    except (OSError, subprocess.CalledProcessError):
        pass
    return date.today().isoformat()

def get_canonical(html_path: Path):
    try:
        text = html_path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return None
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', text, re.I)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', text, re.I)
    if not m:
        return None
    url = m.group(1).strip()
    if not url.startswith(BASE_URL):
        return None
    return url

def main():
    urls = {}
    for path in ROOT.rglob("*.html"):
        if path.name in EXCLUDE:
            continue
        if "_site" in path.parts or ".git" in path.parts:
            continue
        canon = get_canonical(path)
        if canon:
            urls[canon] = path

    urls[BASE_URL + "/"] = ROOT / "index.html"

    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for u in sorted(urls):
        lines.append("  <url>")
        lines.append(f"    <loc>{u}</loc>")
        lines.append(f"    <lastmod>{git_lastmod(urls[u])}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    out = "\n".join(lines) + "\n"

    dest = ROOT / "sitemap.xml"
    dest.write_text(out, encoding="utf-8")
    print(f"Sitemap generado: {len(urls)} URLs -> {dest}")

if __name__ == "__main__":
    main()
