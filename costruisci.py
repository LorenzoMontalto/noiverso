#!/usr/bin/env python3
"""Costruisce la cartella sito/ (quella pubblicata) a partire da sorgente/.
I file con il codice prendono nel nome un'impronta del contenuto (es. app.1a2b3c4d.js):
così ogni aggiornamento arriva subito a tutti, senza copie vecchie in memoria."""
import hashlib, os, re, shutil
QUI = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(QUI, "sorgente"), os.path.join(QUI, "sito")
CODICE = ["carte", "motore", "effetti", "suoni", "scena3d", "mappe", "storia", "tutorial", "missioni", "sociale", "collezione", "graffiti", "zaino", "online", "reazioni", "eventi", "progressi", "extra", "avvento", "app", "supabase-ponte", "immagini"]
LIBRERIE = ["three.min", "supabase.min"]

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT)
for cartella in ["icone", "suoni"]:   # le immagini delle carte stanno nello spazio privato di Supabase
    shutil.copytree(os.path.join(SRC, cartella), os.path.join(OUT, cartella))
for f in ["config.js", "manifest.webmanifest", "installa.html", "emoji-it.json"]:
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
versione = hashlib.sha256(("".join(nomi) + html).encode()).hexdigest()[:8]   # anche index.html (stili), così ogni modifica arriva a tutti
base = ["./", "installa.html", "manifest.webmanifest", "icone/icona-192.png", "icone/icona-512.png", "icone/apple-touch-icon.png"] + nomi
sw = open(os.path.join(SRC, "sw.js"), encoding="utf-8").read().replace("__VERSIONE__", versione).replace("__FILE__", ", ".join(f'"{x}"' for x in base))
open(os.path.join(OUT, "sw.js"), "w", encoding="utf-8").write(sw)
open(os.path.join(OUT, ".nojekyll"), "w").close()

# Il server deve sapere la rarità di ogni carta (per gli scambi): la copia da carte.js dentro schema.sql
carte_js = open(os.path.join(SRC, "carte.js"), encoding="utf-8").read()
coppie = re.findall(r'\{ id: "([a-z0-9_-]+)",[^}]*?rarita: "(comune|rara|epica|leggendaria|ultra|jolly)"', carte_js)
assert len(coppie) >= 60, len(coppie)
blocco = ("-- INIZIO RARITA (scritto da costruisci.py a partire da sorgente/carte.js: non modificarlo a mano)\n"
  "create or replace function public.rarita_base(carta text) returns text language sql immutable as $$\n  select case carta\n"
  + "".join(f"    when '{i}' then '{r}'\n" for i, r in coppie) + "  end;\n$$;\n-- FINE RARITA")
schema_p = os.path.join(QUI, "supabase", "schema.sql")
schema = open(schema_p, encoding="utf-8").read()
nuovo_schema = re.sub(r"-- INIZIO RARITA.*?-- FINE RARITA", lambda m: blocco, schema, flags=re.S)
if nuovo_schema != schema: open(schema_p, "w", encoding="utf-8").write(nuovo_schema)
print("sito/ pronto · versione", versione)

# Controllo (nov 2026): ogni serie nuova deve avere la data di uscita in USCITA_SERIE (eventi.js),
# altrimenti entra subito nella rotazione e sposta le prossime settimane in evidenza e i boss.
import re as _re
_carte = open("sorgente/carte.js", encoding="utf8").read()
_serie = _re.findall(r"^  (\w+):\s+\{ nome:", _carte[_carte.index("const SERIE = {"):_carte.index("};", _carte.index("const SERIE = {"))], _re.M)
_ev = open("sorgente/eventi.js", encoding="utf8").read()
_usc = _ev[_ev.index("const USCITA_SERIE = {"):]; _usc = _usc[:_usc.index("};") + 2]
_senza = [x for x in _serie[17:] if x + ":" not in _usc.replace(" ", "")]
if _senza: print("ATTENZIONE: serie senza data di uscita in USCITA_SERIE (eventi.js):", ", ".join(_senza))
