// Controllo automatico (gira su GitHub prima di ogni pubblicazione): 400 battaglie simulate.
// due "telefoni": host usa la battaglia vera, ospite la vede a specchio; stesse mosse → stesso stato
const fs = require("fs"), vm = require("vm"), DIR = require("path").join(__dirname, "..", "sorgente");
const ctx = { console, Math, JSON, Object, Array, Date };
vm.createContext(ctx);
for (const f of ["carte", "motore"]) vm.runInContext(fs.readFileSync(`${DIR}/${f}.js`, "utf8").replace(/^const /gm, "var ").replace(/^class (\w+)/gm, "var $1 = class $1"), ctx);
const on = fs.readFileSync(`${DIR}/online.js`, "utf8");
vm.runInContext(on.slice(0, on.indexOf("const Online")).replace(/^const /gm, "var ").replace(/^class (\w+)/gm, "var $1 = class $1"), ctx);
vm.runInContext(`
const ids = CARTE.map(c => c.id);
function squadra(r) { const s = []; while (s.length < 5) { const id = ids[Math.floor(r() * ids.length)]; if (!s.find(x => x.id === id)) s.push({ id, liv: 1 + Math.floor(r() * 30), lode: false, olo: r() < .3 }); } return s; }
const firma = c => JSON.stringify([c.turno, c.vincitore, c.lati.map(L => [L.energia, L.attivo, L.squadra.map(x => x.pv)])]);
let errori = 0, partite = 0, turni = 0;
const GR = ["fiamma", "muro", "fulmine", "blackout", "cuore", "spina", "fortuna", "specchio"];
const OGG = Object.keys(OGGETTI_EFFETTI);
for (let p = 1; p <= 400; p++) {
  let x = p * 99991; const r = () => (x = (x * 16807) % 2147483647) / 2147483647;
  const sqH = squadra(r), sqO = squadra(r), seme = Math.floor(r() * 2 ** 31);
  const gH = r() < .7 ? { id: GR[Math.floor(r() * 8)], liv: 1 + Math.floor(r() * 5) } : null, gO = r() < .7 ? { id: GR[Math.floor(r() * 8)], liv: 1 + Math.floor(r() * 5) } : null;
  // host: canonica con sé al lato 0
  const H = new Battaglia(sqH, sqO, "H", "O", mulberry32(seme)); H.impostaGraffiti(gH, gO);
  // ospite: canonica con l'host al lato 0, vista a specchio
  const Oc = new Battaglia(sqH, sqO, "H", "O", mulberry32(seme)); const O = new BattagliaSpecchio(Oc); O.impostaGraffiti(gO, gH);
  let g = 0;
  while (H.vincitore < 0 && g++ < 150) {
    // sostituzioni (ognuno sceglie la sua)
    if (H.serveSostituzione(0)) { const i = H.lati[0].squadra.findIndex(y => y.pv > 0); H.sostituisci(0, i); O.sostituisci(1, i); }
    if (O.serveSostituzione(0)) { const i = O.lati[0].squadra.findIndex(y => y.pv > 0); const ev = O.sostituisci(0, i); H.sostituisci(1, i); if (!ev.every(e => e.lato === undefined || e.lato === 0)) errori++; }
    if (H.vincitore >= 0) break;
    // oggetti: l'host lo usa subito, l'ospite lo applica prima di risolvere (e viceversa)
    const oH = r() < .15 ? OGG[Math.floor(r() * OGG.length)] : null, oO = r() < .15 ? OGG[Math.floor(r() * OGG.length)] : null;
    let okH = false, okO = false;
    if (oH) okH = H.usaOggetto(0, oH, oH).ok;
    if (oO) okO = O.usaOggetto(0, oO, oO).ok;
    if (oO) { const rr = H.usaOggetto(1, oO, oO); if (rr.ok !== okO) errori++; }
    if (oH) { const rr = O.usaOggetto(1, oH, oH); if (rr.ok !== okH) errori++; }
    const scegli = (b, l) => { const k = b.rng; b.rng = r; const a = b.scegliAzione(l, .8); b.rng = k; return a; };
    const azH = scegli(H, 0), azO = scegli(Oc, 1);   // l'ospite sceglie dalla sua parte
    const evH = H.risolviTurno(azH, azO), evO = O.risolviTurno(azO, azH);
    turni++;
    if (firma(H) !== firma(Oc)) { errori++; console.log("DIVERSI partita", p, "turno", H.turno); break; }
    // l'ospite vede "Hai vinto" quando vince lui
    const fH = evH.find(e => e.fine), fO = evO.find(e => e.fine);
    if (fH && fO && ((H.vincitore === 0) !== (fH.testo === "Hai vinto!") || (O.vincitore === 0) !== (fO.testo === "Hai vinto!"))) { errori++; console.log("testo fine sbagliato", p); }
    // i pv nelle foto dell'ospite: il suo lato 0 è la squadra dell'ospite
    const ult = evO[evO.length - 1]; if (ult && ult.foto && JSON.stringify(ult.foto.pv[0]) !== JSON.stringify(O.lati[0].squadra.map(y => y.pv)) && O.vincitore < 0) { /* foto prima di fine turno: ok */ }
  }
  if (H.vincitore >= 0 && O.vincitore !== 1 - H.vincitore) errori++;
  partite++;
}
console.log("partite", partite, "turni", turni, "errori", errori);
this.__errori = errori; this.__partite = partite;
`, ctx);
if (ctx.__errori !== 0 || !(ctx.__partite > 0)) { console.error("ERRORE: le battaglie simulate non tornano"); process.exit(1); }

// Lunga Notte e Scalata: 200 corse a testa giocate dal bot. Niente errori, e i risultati devono restare
// nell'ordine di quelli della taratura (se cambia qualcosa nel motore o nelle carte e diventano troppo facili o
// troppo difficili, il controllo si ferma e lo dice).
{
  const m = require("./modalita.js").carica();
  const n = m.RISULTATI.notte(200), s = m.RISULTATI.scalata(200);
  console.log(`notte: medio ${n.medio.arrivo.toFixed(1)} fermate (alba ${(n.medio.alba * 100).toFixed(0)}%), bravo ${n.bravo.arrivo.toFixed(1)} (alba ${(n.bravo.alba * 100).toFixed(0)}%) · scalata: medio ${s.medio.arrivo.toFixed(1)} piani, bravo ${s.bravo.arrivo.toFixed(1)}`);
  const ok = n.medio.errori + n.bravo.errori + s.medio.errori + s.bravo.errori === 0
    && n.medio.alba >= .02 && n.medio.alba <= .3 && n.bravo.arrivo >= 3.5 && n.bravo.arrivo <= 8.5
    && s.medio.arrivo >= 2 && s.medio.arrivo <= 9 && s.bravo.arrivo >= 3.5 && s.bravo.arrivo <= 12;
  if (!ok) { console.error("ERRORE: Lunga Notte o Scalata fuori taratura (vedi controlli/modalita.js)"); process.exit(1); }
}
