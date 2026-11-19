#!/usr/bin/env python3
"""Builds the Kestrel Drone website from the page bodies in tools/pages/. Run: python3 tools/build.py
Writes index.html, install.html, about.html and 404.html, plus sitemap.xml and robots.txt."""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://drone.kestrelaviation.tech"
APP = "https://app.drone.kestrelaviation.tech/"
COMPANY = "https://kestrelaviation.tech"
REPO = "https://github.com/algophobic-dev/kestrel-drone"

PAGES = {
    "index": ("Kestrel Drone · Free airspace and preflight app for drone pilots",
              "Kestrel Drone shows whether you can fly a drone at a spot, and why: controlled airspace with LAANC ceilings, TFRs, security restrictions and national parks. Drone weather, flight log and checklist. Free, for recreational and Part 107 pilots."),
    "install": ("Install · Kestrel Drone", "Open Kestrel Drone in your browser, or add it to your iPhone, iPad, Android phone, Mac or Windows PC. Free."),
    "about": ("About · Kestrel Drone", "About Kestrel Drone: where its data comes from, how LAANC requests work, and what it keeps on your device."),
    "404": ("Page not found · Kestrel Drone", "There is no page at this address."),
}
NAV = [("install", "Install"), ("about", "About")]


def url_of(n):
    return "/" if n == "index" else f"/{n}.html"


def page(name):
    title, desc = PAGES[name]
    links = "".join(f'<li class=opt><a href="{url_of(n)}"{" aria-current=page" if n == name else ""}>{label}</a></li>' for n, label in NAV)
    body = (ROOT / "tools" / "pages" / f"{name}.html").read_text().replace("{{APP}}", APP).replace("{{REPO}}", REPO).replace("{{COMPANY}}", COMPANY)
    canonical = "" if name == "404" else f'\n<link rel="canonical" href="{BASE}{url_of(name)}">'
    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#10161a">{canonical}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kestrel Drone">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{BASE}{url_of(name)}">
<meta property="og:image" content="{BASE}/img/laanc.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/img/icon.svg" type="image/svg+xml">
<link rel="icon" href="/img/favicon.png" type="image/png" sizes="64x64">
<link rel="apple-touch-icon" href="/img/icon-180.png">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>
<header class="nav">
  <div class="brand"><a class="mark" href="/"><img src="/img/icon-180.png" width="28" height="28" alt="">Kestrel Drone</a><a class="by-top" href="{COMPANY}">by Kestrel Aviation Solutions</a></div>
  <nav aria-label="Main"><ul>{links}<li><a class="btn sm" href="{APP}">Open the app</a></li></ul></nav>
</header>
<main>
{body}
</main>
<footer>
  <div>Kestrel Drone, by <a class="by" href="{COMPANY}">Kestrel Aviation Solutions</a></div>
  <nav aria-label="Footer"><a href="/install.html">Install</a><a href="/about.html">About</a><a href="{REPO}">GitHub</a></nav>
  <div class="end">2026. Provided as is, with no warranty.</div>
</footer>
<script src="/js/bg.js" data-mode="drone" defer></script>
</body>
</html>
"""
    (ROOT / ("index.html" if name == "index" else f"{name}.html")).write_text(html)


for n in PAGES:
    page(n)
(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
                                  + "".join(f"  <url><loc>{BASE}{url_of(n)}</loc></url>\n" for n in PAGES if n != "404") + "</urlset>\n")
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")
print("Built", ", ".join(PAGES), "and sitemap.xml, robots.txt")
