#!/usr/bin/env python3
"""Costruisce la cartella sito/ (quella pubblicata) a partire da sorgente/.
I file con il codice prendono nel nome un'impronta del contenuto (es. app.1a2b3c4d.js):
così ogni aggiornamento arriva subito a tutti, senza copie vecchie in memoria."""
import hashlib, os, re, shutil
QUI = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(QUI, "sorgente"), os.path.join(QUI, "sito")
CODICE = ["carte", "motore", "effetti", "scena3d", "mappe", "storia", "tutorial", "missioni", "sociale", "app", "supabase-ponte", "immagini"]
LIBRERIE = ["three.min", "supabase.min"]

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)
for cartella in ["icone"]:   # le immagini delle carte stanno nello spazio privato di Supabase
    shutil.copytree(os.path.join(SRC, cartella), os.path.join(OUT, cartella))
for f in ["config.js", "manifest.webmanifest", "installa.html"]:
    shutil.copy(os.path.join(SRC, f), os.path.join(OUT, f))
html = open(os.path.join(SRC, "index.html"), encoding="utf-8").read()
nomi = []
for nome in CODICE + LIBRERIE:
    dati = open(os.path.join(SRC, nome + ".js"), "rb").read()
    impronta = hashlib.sha256(dati).hexdigest()[:8]
    nuovo = f"{nome}.{impronta}.js"
    open(os.path.join(OUT, nuovo), "wb").write(dati)
    html, n = re.subn(rf'src="{re.escape(nome)}\.js"', f'src="{nuovo}"', html)
    assert n == 1, nome
    nomi.append(nuovo)
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(html)
versione = hashlib.sha256("".join(nomi).encode()).hexdigest()[:8]
base = ["./", "installa.html", "manifest.webmanifest", "icone/icona-192.png", "icone/icona-512.png", "icone/apple-touch-icon.png"] + nomi
sw = open(os.path.join(SRC, "sw.js"), encoding="utf-8").read().replace("__VERSIONE__", versione).replace("__FILE__", ", ".join(f'"{x}"' for x in base))
open(os.path.join(OUT, "sw.js"), "w", encoding="utf-8").write(sw)
open(os.path.join(OUT, ".nojekyll"), "w").close()
print("sito/ pronto · versione", versione)
