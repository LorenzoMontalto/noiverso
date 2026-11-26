# Controllo automatico (gira su GitHub prima di ogni pubblicazione): apre il gioco in un browser vero,
# con un Supabase finto, e prova le cose principali come farebbe un giocatore. Se qualcosa si rompe
# (un errore nella pagina o un passaggio che non funziona) esce con errore e il sito NON viene pubblicato.
import asyncio, glob, os, shutil, subprocess, sys, tempfile, time
from playwright.async_api import async_playwright

QUI = os.path.dirname(os.path.abspath(__file__))
SITO = os.path.join(QUI, "..", "sito")
CARTELLA = tempfile.mkdtemp()
shutil.copytree(SITO, CARTELLA, dirs_exist_ok=True)
SB = os.path.basename(glob.glob(os.path.join(CARTELLA, "supabase.min.*.js"))[0])
PORTA = "8799"
srv = subprocess.Popen([sys.executable, "-m", "http.server", PORTA, "--bind", "127.0.0.1"], cwd=CARTELLA, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
URL = f"http://127.0.0.1:{PORTA}/index.html"
problemi = []

def controlla(cosa, ok):
    print(("OK   " if ok else "NO   ") + cosa)
    if not ok: problemi.append(cosa)

async def giro(b, nome, w, h, mobile):
    ctx = await b.new_context(viewport={"width": w, "height": h}, is_mobile=mobile, has_touch=mobile)
    errori = []
    await ctx.route(f"**/{SB}", lambda r: r.fulfill(path=os.path.join(QUI, "finto-supabase.js"), content_type="application/javascript"))
    await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
    await ctx.route("https://*.supabase.co/**", lambda r: r.fulfill(body="", content_type="image/webp"))
    pg = await ctx.new_page()
    pg.on("pageerror", lambda e: errori.append(str(e) + " | " + (getattr(e, "stack", "") or "")[:400]))
    pg.on("console", lambda m: errori.append(m.text) if m.type == "error" and "favicon" not in m.text and "Failed to load resource" not in m.text else None)
    J = pg.evaluate
    await pg.goto(URL); await pg.wait_for_timeout(1500)
    # account nuovo
    await pg.fill("#acc-nick", "Prova" + nome); await pg.fill("#acc-pass", "segreta1"); await pg.click("#form-account button[type=submit]"); await pg.wait_for_timeout(2500)
    await pg.click("#form-profilo button[type=submit]"); await pg.wait_for_timeout(2500)
    if await J("!!document.querySelector('[data-tut=\"esci\"]')"): await pg.click('[data-tut="esci"]'); await pg.wait_for_timeout(1000)
    await J("chiudiModale()")
    controlla(f"[{nome}] il gioco parte e mostra la home", await J("vista === 'strada' && !!document.querySelector('#vista .eroe')"))
    # bustina: apertura, Skippa, riepilogo
    await J("S.inventario.normale = (S.inventario.normale || 0) + 2; salva(); vai('bustine')"); await pg.wait_for_timeout(800)
    await pg.click('[data-apri="normale"]'); await pg.wait_for_timeout(3500)
    if await J("!$('#apertura').hidden"):
        await pg.mouse.click(w / 2, h / 2); await pg.wait_for_timeout(3000)
        await J("document.querySelector('[data-azione=\"riepilogo-bustina\"]')?.click()")
    else:
        await J("document.querySelector('.apertura2d [data-azione=\"riepilogo-bustina\"]')?.click()")
    await pg.wait_for_timeout(1000)
    controlla(f"[{nome}] bustina aperta con riepilogo delle carte", await J("document.querySelectorAll('.riepilogo-bustina .rb-carta').length >= 4"))
    await J("document.querySelector('[data-azione=\"chiudi-riepilogo\"]')?.click()"); await pg.wait_for_timeout(600)
    # le pagine principali
    for v in ["squadra", "album", "negozio", "sfida", "notte", "scalata", "pass", "storia", "classifica", "strada"]:
        await J(f"chiudiModale(); vai('{v}')"); await pg.wait_for_timeout(700)
        controlla(f"[{nome}] pagina {v}", await J(f"vista === '{v}' && document.querySelector('#vista').innerText.length > 40"))
    # una battaglia vera contro il computer: si gioca finché finisce (o per un massimo di mosse)
    await J("chiudiModale(); Scena3D.imposta({ velocita: 3 }); avviaSfida('recluta', null, null, true)"); await pg.wait_for_timeout(5000)
    controlla(f"[{nome}] la battaglia parte", await J("!!B && !!document.querySelector('#azioni')"))
    for _ in range(120):
        if await J("!B || B.vincitore >= 0"): break
        await J("""(() => { const s = document.querySelector('[data-sostituisci]:not([disabled]), .sostituzione [data-i]'); if (s) { s.click(); return; }
          const m = [...document.querySelectorAll('#azioni [data-mossa]:not([disabled])')]; if (m.length) m[m.length - 1].click(); })()""")
        await pg.wait_for_timeout(1200)
    fine = await J("!!B && B.vincitore >= 0")
    controlla(f"[{nome}] la battaglia arriva alla fine", fine)
    if not fine: print("     stato:", await J("B ? JSON.stringify({ turno: B.turno, sost: B.serveSostituzione(0), pv: B.lati.map(L => L.squadra.map(x => Math.round(x.pv))), tasti: [...document.querySelectorAll('#azioni button')].map(b => (b.dataset.mossa ?? b.dataset.azione ?? b.className) + (b.disabled ? '(x)' : '')).slice(0, 12) }) : 'nessuna battaglia'"))
    controlla(f"[{nome}] nessun errore nella pagina", not errori)
    for e in errori[:8]: print("     errore:", e[:300])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
        if not os.environ.get("SOLO_PC"): await giro(b, "telefono", 390, 844, True)
        await giro(b, "computer", 1366, 768, False)
        await b.close()

try: asyncio.run(main())
finally: srv.terminate()
if problemi:
    print(f"\n{len(problemi)} controlli non superati: il sito non viene pubblicato.")
    sys.exit(1)
print("\nTutti i controlli superati.")
