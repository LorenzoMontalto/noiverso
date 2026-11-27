// Simulatore delle tre modalità "a corsa" (Arena, Lunga Notte, Scalata) con un bot che gioca da solo.
// Serve a due cose:
//  1. controllo automatico prima di pubblicare (simula.js): niente errori e percentuali nell'ordine giusto;
//  2. taratura dei premi: `node controlli/modalita.js 400` stampa, per un giocatore "medio" e uno "bravo",
//     quanto si arriva lontano, quanto dura una corsa e quanto rende al minuto ciascuna modalità.
// Il tempo è stimato: 7 secondi a turno di battaglia + 10 di ingresso, 6 secondi a scelta, 8 a carta del draft.
const fs = require("fs"), vm = require("vm"), DIR = require("path").join(__dirname, "..", "sorgente");

function carica() {
  const ctx = { console, Math, JSON, Object, Array, Date, module: undefined };
  vm.createContext(ctx);
  for (const f of ["carte", "motore"]) vm.runInContext(fs.readFileSync(`${DIR}/${f}.js`, "utf8").replace(/^const /gm, "var ").replace(/^class (\w+)/gm, "var $1 = class $1"), ctx);
  const on = fs.readFileSync(`${DIR}/online.js`, "utf8");
  vm.runInContext(on.slice(0, on.indexOf("const Online")).replace(/^const /gm, "var "), ctx);
  for (const f of ["notte", "scalata"]) { const t = fs.readFileSync(`${DIR}/${f}.js`, "utf8"); vm.runInContext(t.slice(0, t.indexOf("if (typeof module")).replace(/^const /gm, "var "), ctx); }
  vm.runInContext(fs.readFileSync(__filename, "utf8").split("// ---- DENTRO ----")[2], ctx);
  return ctx;
}

// ---- DENTRO ----
// (questa parte gira dentro il contesto del gioco)
const VALORE = { normale: 100, epica: 300, leggendaria: 900 }, FRAMMENTO = 3.5;
const valore = p => (p.monete || 0) + Object.entries(p.bustine || {}).reduce((n, [t, q]) => n + (VALORE[t] || 0) * q, 0) + (p.frammenti || 0) * FRAMMENTO;
const SEC_TURNO = 7, SEC_BATT = 10, SEC_SCELTA = 6, SEC_DRAFT = 8;
const ABI = { medio: .7, bravo: .9 };

// una battaglia giocata da due bot; ritorna [vinto, turni]
function combatti(sqA, sqB, rng, abiA, abiB, prepara) {
  const B = new Battaglia(sqA, sqB, "A", "B", mulberry32(Math.floor(rng() * 2 ** 31)));
  if (prepara) prepara(B);
  B.rngIA = rng;
  let g = 0;
  while (B.vincitore < 0 && g++ < 200) {
    if (B.serveSostituzione(0)) B.sostituisci(0, B.scegliSostituto(0));
    if (B.serveSostituzione(1)) B.sostituisci(1, B.scegliSostituto(1));
    if (B.vincitore >= 0) break;
    B.risolviTurno(B.scegliAzione(0, abiA), B.scegliAzione(1, abiB));
  }
  return { vinto: B.vincitore === 0, turni: B.turno, B };
}
const potenza = id => { const c = PER_ID[id]; return RARITA[c.rarita].forza * (BILANCIO[id] || 1); };
// il bot sceglie una carta tra quelle proposte: il medio a caso, il bravo la più forte (con un occhio alla serie)
function sceltaDraft(rng, proposta, scelte, tipo) {
  if (tipo === "medio") return proposta[Math.floor(rng() * proposta.length)];
  const serie = scelte.map(id => PER_ID[id].serie);
  return proposta.map(id => [id, potenza(id) + serie.filter(s => s === PER_ID[id].serie).length * .08]).sort((a, b) => b[1] - a[1])[0][0];
}

// ---------- Arena (com'è nel gioco: livello 20, 7 vittorie o 3 sconfitte) ----------
const ARENA = { INGRESSO: 300, GIRI: ["leggendaria", "epica", "epica", "rara", "comune"], ABILITA: [.6, .68, .75, .82, .88, .93, .96],
  // copia di Arena.PREMI (extra.js): tenerle uguali
  PREMI: [{ monete: 220 }, { monete: 330 }, { monete: 480 }, { monete: 620, bustine: { normale: 1 } }, { monete: 780, bustine: { epica: 1 } },
    { monete: 1000, bustine: { epica: 1 }, frammenti: 40 }, { monete: 1300, bustine: { leggendaria: 1 }, frammenti: 80 }, { monete: 1700, bustine: { leggendaria: 1 }, frammenti: 160 }] };
const casuale = (rng, rar, escl = []) => { const p = CARTE.filter(c => c.rarita === rar && !SERIE[c.serie].jolly && !escl.includes(c.id)); return p[Math.floor(rng() * p.length)].id; };
function arena(rng, tipo) {
  const scelte = []; for (const r of ARENA.GIRI) { const prop = [0, 1, 2].map(() => casuale(rng, r, scelte)); scelte.push(sceltaDraft(rng, prop, scelte, tipo)); }
  let v = 0, p = 0, sec = 5 * SEC_DRAFT;
  while (v < 7 && p < 3) {
    const nem = ARENA.GIRI.map(r => ({ id: casuale(rng, r), liv: 20 }));
    const r = combatti(scelte.map(id => ({ id, liv: 20 })), nem, rng, ABI[tipo], ARENA.ABILITA[Math.min(v, 6)]);
    sec += SEC_BATT + r.turni * SEC_TURNO; if (r.vinto) v++; else p++;
  }
  return { arrivo: v, valore: valore(ARENA.PREMI[v]) - ARENA.INGRESSO, min: sec / 60 };
}

// ---------- Lunga Notte ----------
function notte(rng, tipo) {
  const R = NotteRegole, partenze = R.partenze(rng);
  const st = R.nuova(rng, partenze[tipo === "bravo" ? 1 : Math.floor(rng() * 3)]);
  let sec = 3 * SEC_SCELTA, errori = 0;
  const mediaPv = () => st.squadra.reduce((n, x) => n + Math.max(0, x.pv), 0) / st.squadra.length;
  while (st.fase !== "fine") {
    if (st.fase === "bivio") {
      sec += SEC_SCELTA;
      let i = Math.floor(rng() * st.bivio.length);
      if (tipo === "bravo") {
        const idx = t => st.bivio.findIndex(x => x.tipo === t);
        i = mediaPv() < .55 && idx("bar") >= 0 ? idx("bar") : st.gettoni >= 75 && idx("mercatino") >= 0 ? idx("mercatino") : mediaPv() > .75 && idx("banda") >= 0 ? idx("banda") : idx("rissa") >= 0 ? idx("rissa") : 0;
      }
      const t = st.bivio[i]; st.tappa = t; st.bivio = null;
      if (t.nemici) {
        const boss = t.tipo === "boss";
        const r = combatti(st.squadra.map(x => ({ id: x.id, liv: x.liv })), t.nemici.map(x => ({ id: x.id, liv: x.liv })), rng, ABI[tipo], R.abilita(st.fermata, boss), B => R.prepara(B, st, t));
        sec += SEC_BATT + r.turni * SEC_TURNO;
        const scelte = R.dopoBattaglia(st, r.B, r.vinto, rng);
        if (!r.vinto) break;
        sec += SEC_SCELTA;
        let x = scelte[Math.floor(rng() * scelte.length)];
        if (tipo === "bravo") x = scelte.find(s => s.cimelio && CIMELI[s.cimelio].rar !== "comune") || (st.squadra.length < 5 ? scelte.find(s => s.carta) : null) || scelte.find(s => s.cimelio) || scelte[0];
        if (x.cimelio) st.cimeli[x.cimelio] = (st.cimeli[x.cimelio] || 0) + 1;
        else if (!R.prendiCarta(st, x.carta, x.liv)) { const peggio = st.squadra.map((y, j) => [j, potenza(y.id) + y.liv / 30]).sort((a, b) => a[1] - b[1])[0]; if (potenza(x.carta) > potenza(st.squadra[peggio[0]].id)) R.prendiCarta(st, x.carta, x.liv, peggio[0]); }
        R.avanza(rng, st);
      } else if (t.tipo === "bar") { sec += SEC_SCELTA; if (mediaPv() < .6 || tipo === "medio" && rng() < .5) R.curaTutti(st, .4); else R.livelliTutti(st, 2); R.avanza(rng, st); }
      else if (t.tipo === "mercatino") {
        const m = R.mercatino(rng, st); sec += 3 * SEC_SCELTA;
        if (tipo === "bravo") {
          for (const c of m.cimeli) if (st.gettoni >= c.prezzo) { st.gettoni -= c.prezzo; st.cimeli[c.id] = 1; }
          if (mediaPv() < .65 && st.gettoni >= m.cura) { st.gettoni -= m.cura; R.curaTutti(st, .3); }
          if (st.gettoni >= m.livello) { st.gettoni -= m.livello; R.livelliTutti(st, 1); }
          for (const c of m.carte) if (st.squadra.length < 5 && st.gettoni >= c.prezzo) { st.gettoni -= c.prezzo; R.prendiCarta(st, c.id, c.liv); }
        } else { const c = m.carte[Math.floor(rng() * 3)]; if (st.gettoni >= c.prezzo && st.squadra.length < 5) { st.gettoni -= c.prezzo; R.prendiCarta(st, c.id, c.liv); } else if (st.gettoni >= m.cura) { st.gettoni -= m.cura; R.curaTutti(st, .3); } }
        R.avanza(rng, st);
      } else if (t.tipo === "imprevisto") {
        sec += 2 * SEC_SCELTA;
        const sc = t.scena;
        if (sc === "buttafuori" && st.gettoni >= 40) { st.gettoni -= 40; const c = Object.keys(CIMELI).find(k => !st.cimeli[k] && !CIMELI[k].solo); if (c) st.cimeli[c] = 1; }
        else if (sc === "tre-carte" && st.gettoni >= 50 && tipo === "medio") st.gettoni += rng() < .5 ? 50 : -50;
        else if (sc === "amico") { if (st.squadra.length < 5) R.prendiCarta(st, casuale(rng, R.rarita(rng, st.fermata), st.squadra.map(x => x.id)), R.livMedio(st)); else R.curaTutti(st, .2); }
        else if (sc === "vicolo" && mediaPv() > .5) { R.livelliTutti(st, 3); st.squadra.forEach(x => { if (x.pv > 0) x.pv = Math.max(.01, x.pv - .25); }); }
        else if (sc === "taxi") R.curaTutti(st, .15);
        R.avanza(rng, st);
      }
    } else { errori++; break; }
  }
  const f = R.fermateSuperate(st), alba = st.finita === "alba";
  return { arrivo: f, alba, valore: valore(PremiModalita.notte(f)) - PremiModalita.INGRESSO_NOTTE, min: sec / 60, errori };
}

// ---------- Scalata ----------
function scalata(rng, tipo, maxPiani = 40) {
  const R = ScalataRegole, st = R.nuova(rng);
  let sec = 0, errori = 0;
  while (st.fase === "draft") { R.scegliDraft(rng, st, sceltaDraft(rng, st.proposta, st.scelte, tipo)); sec += SEC_DRAFT; }
  const PREF = { livTutti: 3, ultra: 2.5, asc: 2.4, cimelio: 2, olo: 1.5, liv1: 1 };
  while (st.fase !== "fine" && st.piano <= maxPiani) {
    if (st.fase === "torre") {
      const r = combatti(st.squadra.map(R.voceBattaglia), st.bot.squadra.map(R.voceBattaglia), rng, ABI[tipo], R.abilita(st.piano), B => R.prepara(B, st));
      sec += SEC_BATT + r.turni * SEC_TURNO;
      if (r.vinto) R.vittoria(rng, st); else R.sconfitta(st);
    } else if (st.fase === "potenziamento") {
      sec += SEC_SCELTA;
      const p = tipo === "bravo" ? [...st.offerta].sort((a, b) => (PREF[b.tipo] * (b.n || 1) + ORDINE_RARITA.indexOf(b.rar)) - (PREF[a.tipo] * (a.n || 1) + ORDINE_RARITA.indexOf(a.rar)))[0] : st.offerta[Math.floor(rng() * 3)];
      let i = 0; if (R.serveCarta(p)) { const ok = st.squadra.map((x, j) => j).filter(j => R.cartaOk(p, st.squadra[j])); i = tipo === "bravo" ? ok.sort((a, b) => potenza(st.squadra[b].id) - potenza(st.squadra[a].id))[0] : ok[Math.floor(rng() * ok.length)]; }
      R.applica(p, st.squadra, st.cimeli, i); st.offerta = null; R.dopoPotenziamento(rng, st);
    } else if (st.fase === "cambio") { sec += SEC_SCELTA; R.cambia(rng, st, null); }
    else { errori++; break; }
  }
  const p = R.pianiSuperati(st);
  return { arrivo: p, valore: valore(PremiModalita.scalata(p)) - PremiModalita.INGRESSO_SCALATA, min: sec / 60, errori };
}

function riassunto(nome, f, N, seme) {
  const out = {};
  for (const tipo of ["medio", "bravo"]) {
    let x = seme; const rng = () => (x = (x * 16807) % 2147483647) / 2147483647;
    const r = []; for (let k = 0; k < N; k++) r.push(f(rng, tipo));
    const m = k => r.reduce((n, y) => n + y[k], 0) / r.length;
    const dist = {}; for (const y of r) dist[y.arrivo] = (dist[y.arrivo] || 0) + 1;
    const tempi = {}; for (const y of r) (tempi[y.arrivo] = tempi[y.arrivo] || []).push(y.min);
    out[tipo] = { tempi: Object.fromEntries(Object.entries(tempi).map(([k, v]) => [k, v.reduce((a, b) => a + b) / v.length])), arrivo: m("arrivo"), valore: m("valore"), min: m("min"), alMinuto: m("valore") / m("min"), alba: r.filter(y => y.alba).length / r.length, errori: r.reduce((n, y) => n + (y.errori || 0), 0), dist };
  }
  return out;
}
var RISULTATI = { arena: N => riassunto("arena", arena, N, 7), notte: N => riassunto("notte", notte, N, 11), scalata: N => riassunto("scalata", scalata, N, 13) };
// ---- DENTRO ----

if (require.main === module) {
  const ctx = carica(), N = +(process.argv[2] || 200);
  if (process.env.NT) Object.assign(ctx.NotteRegole.T, JSON.parse(process.env.NT));   // prove di taratura
  if (process.env.ST) Object.assign(ctx.ScalataRegole.T, JSON.parse(process.env.ST));
  for (const m of (process.argv[3] || "arena,notte,scalata").split(",")) {
    const r = ctx.RISULTATI[m](N);
    for (const t of ["medio", "bravo"]) {
      const x = r[t];
      console.log(`${m.padEnd(8)} ${t.padEnd(6)} arriva in media a ${x.arrivo.toFixed(1).padStart(4)}${m === "notte" ? ` (alba ${(x.alba * 100).toFixed(0)}%)` : ""} · ${x.min.toFixed(1)} min · valore netto ${x.valore.toFixed(0).padStart(5)} · ${x.alMinuto.toFixed(0).padStart(4)} al minuto${x.errori ? ` · ERRORI ${x.errori}` : ""}`);
      console.log(`         distribuzione: ${Object.entries(x.dist).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join(" ")}`);
    }
  }
}
module.exports = { carica };
if (require.main === module && process.env.TEMPI) { const ctx = carica(); const out = {}; for (const m of ["notte", "scalata", "arena"]) out[m] = ctx.RISULTATI[m](+process.env.TEMPI); console.log(JSON.stringify(out)); }
