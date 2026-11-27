// Taratura della Storia · Livello Leggenda.
// Per ogni tappa cerca la «forza» (% in più o in meno su PV e attacco dei nemici) che porta una squadra da fine gioco
// (tutte al 30 con la lode) alla percentuale di vittorie voluta:
//   tappe normali: dal 68% (prima tappa) al 40% circa (ultimi capitoli), un po' meno a ogni tappa del capitolo;
//   boss: dal 45% del primo capitolo al 12% del boss finale.
// Squadre di prova, a caso a ogni partita: 3 leggendarie + 2 epiche, oppure 5 carte di una serie (con la sinergia).
// Uso: node controlli/leggenda.js [partite] [parte] [parti] [solo=k]   → stampa JSON { "c1-0": forza, ... }
//      MISURA=1 node controlli/leggenda.js 300   → misura le vittorie con la taratura attuale
const fs = require("fs"), vm = require("vm"), path = require("path"), D = path.join(__dirname, "..", "sorgente");
const ctx = { console, Math, JSON, Object, Array, Date, require, process }; vm.createContext(ctx);
for (const f of ["carte", "motore"]) vm.runInContext(fs.readFileSync(`${D}/${f}.js`, "utf8").replace(/^const /gm, "var ").replace(/^class (\w+)/gm, "var $1 = class $1"), ctx);
const on = fs.readFileSync(`${D}/online.js`, "utf8"); vm.runInContext(on.slice(0, on.indexOf("const Online")).replace(/^const /gm, "var "), ctx);
const st = fs.readFileSync(`${D}/storia.js`, "utf8"); vm.runInContext(st.slice(0, st.indexOf("if (typeof module")).replace(/^const /gm, "var "), ctx);
const lg = fs.readFileSync(`${D}/leggenda.js`, "utf8"); vm.runInContext(lg.slice(0, lg.indexOf("if (typeof module")).replace(/^const /gm, "var "), ctx);
ctx.N = +process.argv[2] || 80; ctx.PARTE = +process.argv[3] || 0; ctx.PARTI = +process.argv[4] || 1;
ctx.SOLO = process.argv[5] ? +process.argv[5] : -1; ctx.MISURA = !!process.env.MISURA;
vm.runInContext(`
let x = 777 + PARTE; const rng = () => (x = (x * 16807) % 2147483647) / 2147483647;
const buone = CARTE.filter(c => !SERIE[c.serie].jolly);
const pool = r => buone.filter(c => c.rarita === r);
const pesca = (r, escl) => { const p = pool(r).filter(c => !escl.includes(c.id)); return p[Math.floor(rng() * p.length)].id; };
const VAL = { comune: 0, rara: 1, epica: 2, leggendaria: 3 };
const serieBuone = Object.keys(SERIE).filter(s => !SERIE[s].jolly && buone.filter(c => c.serie === s).length >= 5);
function squadraMia() {
  const ids = [];
  if (rng() < .5) { for (const r of ["leggendaria", "leggendaria", "leggendaria", "epica", "epica"]) ids.push(pesca(r, ids)); }
  else { const s = serieBuone[Math.floor(rng() * serieBuone.length)];
    buone.filter(c => c.serie === s).sort((a, b) => VAL[b.rarita] - VAL[a.rarita] || rng() - .5).slice(0, 5).forEach(c => ids.push(c.id)); }
  return ids.map(id => ({ id, liv: 30, lode: true }));
}
function vince(k, i, f) {
  const t = Leggenda.tappa(k, i), cap = STORIA[k];
  TARATURA_LEGGENDA[cap.id + "-" + i] = f;
  const B = new Battaglia(squadraMia(), t.nemici.map(e => Object.assign({}, e)), "A", "B", mulberry32(Math.floor(rng() * 2 ** 31))); B.rngIA = rng;
  B.impostaCampo(cap.campo); B.campoBloccato = true;
  Leggenda.prepara(B, k, i);
  let g = 0;
  while (B.vincitore < 0 && g++ < 200) {
    if (B.serveSostituzione(0)) B.sostituisci(0, B.scegliSostituto(0));
    if (B.serveSostituzione(1)) B.sostituisci(1, B.scegliSostituto(1));
    if (B.vincitore >= 0) break;
    B.risolviTurno(B.scegliAzione(0, .85), B.scegliAzione(1, t.abilita));
  }
  return B.vincitore === 0;
}
const perc = (k, i, f, n) => { let v = 0; for (let j = 0; j < n; j++) if (vince(k, i, f)) v++; return v / n; };
const bersaglio = (k, i) => { const p = Leggenda.avanzamento(k, i); return STORIA[k].tappe[i].boss ? .45 - .33 * p : .68 - .26 * p - .035 * i; };
const out = {};
STORIA.forEach((cap, k) => cap.tappe.forEach((t, i) => {
  if ((k * 6 + i) % PARTI !== PARTE || (SOLO >= 0 && SOLO !== k)) return;
  const chiave = cap.id + "-" + i, tgt = bersaglio(k, i);
  if (MISURA) { out[chiave] = [Math.round(perc(k, i, TARATURA_LEGGENDA[chiave] || 0, N) * 100), Math.round(tgt * 100)]; return; }
  // ricerca per bisezione: più forza = meno vittorie
  let lo = -45, hi = 90;
  for (let it = 0; it < 7; it++) { const m = (lo + hi) / 2; if (perc(k, i, m, N) > tgt) lo = m; else hi = m; }
  out[chiave] = Math.round((lo + hi) / 2);
}));
console.log(JSON.stringify(out));
`, ctx);
