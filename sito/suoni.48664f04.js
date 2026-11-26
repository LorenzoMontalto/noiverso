"use strict";
// ============================================================
//  Suoni e musica di Noiverso
//  Tutto è sintetizzato al momento con il Web Audio del browser:
//  niente file da scaricare e niente diritti d'autore (la musica è originale, scritta qui sotto).
//  Il browser fa partire l'audio solo dopo il primo tocco: fino ad allora tutto resta in silenzio.
// ============================================================
const Suoni = (() => {
  let ctx = null, master = null, busMusica = null, busEffetti = null, eco = null, rumore = null;
  // i volumi valgono per questo dispositivo (non per l'account): così valgono anche prima dell'accesso,
  // nel profilo admin e in qualunque profilo si usi su questo telefono o computer
  const CHIAVE = "noiverso-audio";
  let pref = { musica: "60", suoni: "80" }, salvate = false;
  try { const x = localStorage.getItem(CHIAVE); if (x) { pref = Object.assign(pref, JSON.parse(x)); salvate = true; } } catch (e) {}
  let volMusica = +pref.musica / 100, volEffetti = +pref.suoni / 100, sbloccato = false;
  const ora = () => ctx.currentTime;

  function crea() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .2;
    master = ctx.createGain(); master.gain.value = .9;
    master.connect(comp); comp.connect(ctx.destination);
    busMusica = ctx.createGain(); busMusica.gain.value = volMusica * .8; busMusica.connect(master);
    busEffetti = ctx.createGain(); busEffetti.gain.value = volEffetti; busEffetti.connect(master);
    // un'eco leggera per dare spazio alla musica
    eco = ctx.createDelay(1); eco.delayTime.value = .32;
    const ritorno = ctx.createGain(); ritorno.gain.value = .28;
    const filtroEco = ctx.createBiquadFilter(); filtroEco.type = "lowpass"; filtroEco.frequency.value = 2200;
    eco.connect(filtroEco); filtroEco.connect(ritorno); ritorno.connect(eco); filtroEco.connect(busMusica);
    // rumore bianco riutilizzabile (2 secondi)
    rumore = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = rumore.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function sblocca() {
    if (!crea()) return;
    if (ctx.state === "suspended") ctx.resume();
    if (!sbloccato) { sbloccato = true; Musica._sbloccato(); }
    caricaCampioni();
  }
  function imposta(o) {
    if (o.musica !== undefined) { volMusica = Math.max(0, Math.min(1, +o.musica / 100)); pref.musica = String(o.musica); }
    if (o.effetti !== undefined) { volEffetti = Math.max(0, Math.min(1, +o.effetti / 100)); pref.suoni = String(o.effetti); }
    try { localStorage.setItem(CHIAVE, JSON.stringify(pref)); salvate = true; } catch (e) {}
    if (volEffetti > 0 && sbloccato) caricaCampioni();
    if (ctx) { busMusica.gain.setTargetAtTime(volMusica * .8, ora(), .1); busEffetti.gain.setTargetAtTime(volEffetti, ora(), .05); }
    Musica._volume(volMusica);
  }
  const pronto = () => ctx && sbloccato && ctx.state === "running";
  const effettiAttivi = () => pronto() && volEffetti > 0;

  // ---------- mattoncini ----------
  // un oscillatore con inviluppo: tipo, frequenza (anche una rampa), durata, volume
  function tono(tipo, f, dur, vol, { a = .005, fine, dest = busEffetti, t = 0, rampa = "exp", filtro, q = 1, staccato = .6 } = {}) {
    const t0 = ora() + t, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t0);
    if (fine) rampa === "exp" ? o.frequency.exponentialRampToValueAtTime(Math.max(20, fine), t0 + dur) : o.frequency.linearRampToValueAtTime(fine, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + a);
    g.gain.setTargetAtTime(0, t0 + a, Math.max(.01, dur * staccato / 3));
    let ultimo = o;
    if (filtro) { const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = filtro; fl.Q.value = q; o.connect(fl); ultimo = fl; }
    ultimo.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + dur + .3);
    return o;
  }
  // rumore filtrato: tipo di filtro, frequenza (anche una rampa), durata, volume
  function soffio(tipoF, f, dur, vol, { fine, q = 1, a = .005, t = 0, dest = busEffetti } = {}) {
    const t0 = ora() + t, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = rumore; s.loop = true;
    fl.type = tipoF; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q;
    if (fine) fl.frequency.exponentialRampToValueAtTime(Math.max(30, fine), t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + a); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(t0, Math.random()); s.stop(t0 + dur + .05);
  }
  const tonfo = (vol = .7, t = 0, f = 140) => tono("sine", f, .35, vol, { fine: 42, t, staccato: .9 });
  const campana = (f, vol = .2, t = 0, dur = .9) => { tono("sine", f, dur, vol, { t, staccato: 1 }); tono("sine", f * 2.01, dur * .6, vol * .35, { t, staccato: 1 }); tono("sine", f * 3.02, dur * .35, vol * .15, { t }); };
  const nota = n => 440 * Math.pow(2, (n - 69) / 12);

  // ---------- campioni registrati (Kenney, CC0): si scaricano dopo il primo tocco, se i suoni sono accesi ----------
  const INDICE = {"ui-click": 3, "ui-forte": 2, "carta-scivola": 4, "carta-posa": 3, "carta-gira": 3, "bustina-apri": 2, "bustina-estrai": 2, "mazzo-mescola": 1, "mazzo-ventaglio": 2, "fiches": 3, "colpo": 3, "colpo-forte": 3, "metallo": 2, "metallo-leggero": 2, "roccia": 2, "legno": 2, "vetro": 2, "campana": 2, "tonfo": 2, "lama-sfodera": 2, "lama": 2, "ascia": 1, "fruscio": 2, "monete": 2, "laser": 3, "laser-grande": 2, "laser-retro": 2, "campo-energia": 2, "esplosione": 3, "boato": 2, "fiamma": 2, "melma": 2, "robot": 2, "glitch": 2, "vittoria": 1, "sconfitta": 1, "rivela-leggendaria": 1, "rivela-epica": 1, "rivela-rara": 1};
  const VERSIONE_CAMPIONI = 1;
  const campioni = {}, ultimoUsato = {};
  let caricamento = false;
  function caricaCampioni() {
    if (caricamento || !ctx || volEffetti <= 0) return;
    caricamento = true;
    for (const [nome, n] of Object.entries(INDICE)) for (let i = 1; i <= n; i++) {
      fetch(`suoni/${nome}-${i}.mp3?v=${VERSIONE_CAMPIONI}`).then(r => r.ok ? r.arrayBuffer() : Promise.reject())
        .then(b => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no)))
        .then(buf => { (campioni[nome] = campioni[nome] || [])[i - 1] = buf; })
        .catch(() => {});
    }
  }
  // suona un campione (una delle varianti, mai la stessa due volte di fila); se non è ancora pronto restituisce false
  function c(nome, vol = 1, { t = 0, rate = 1, varia = .05 } = {}) {
    const l = (campioni[nome] || []).filter(Boolean);
    if (!l.length) return false;
    let k = Math.floor(Math.random() * l.length);
    if (l.length > 1 && k === ultimoUsato[nome]) k = (k + 1) % l.length;
    ultimoUsato[nome] = k;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = l[k]; s.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * varia);
    g.gain.value = vol; s.connect(g); g.connect(busEffetti);
    s.start(ora() + t);
    return true;
  }

  // ---------- timbri delle mosse ----------
  const TIMBRI = {
    pugno: v => { if (!c("colpo-forte", .9 * v)) { tonfo(.8 * v); soffio("lowpass", 900, .12, .5 * v); } soffio("bandpass", 900, .18, .15 * v, { fine: 2400, q: 2 }); },
    lama: v => { const ok = c("lama-sfodera", .7 * v); c("lama", .8 * v, { t: .1 }); if (!ok) soffio("bandpass", 6500, .22, .55 * v, { fine: 1200, q: 2 }); },
    fuoco: v => { c("fiamma", .8 * v); for (let k = 0; k < 6; k++) soffio("highpass", 3000, .03, .18 * v, { t: k * .07 + Math.random() * .03 }); tonfo(.35 * v, .05, 90); },
    ghiaccio: v => { c("vetro", .8 * v, { rate: 1.15 }); [2093, 2637, 3136, 3951].forEach((f, k) => campana(f, .05 * v, .05 + k * .05, .5)); soffio("highpass", 5000, .4, .12 * v); },
    fulmine: v => { soffio("highpass", 2500, .18, .6 * v, { a: .001 }); tono("sawtooth", 1400, .18, .12 * v, { fine: 80 }); c("esplosione", .55 * v, { rate: 1.5 }) || tonfo(.6 * v, .03, 110); },
    acqua: v => { c("fruscio", .6 * v, { rate: .7 }); soffio("bandpass", 600, .45, .4 * v, { fine: 2400, q: 1.5 }); for (let k = 0; k < 4; k++) tono("sine", 400 + k * 120, .08, .1 * v, { fine: 900 + k * 200, t: .1 + k * .06 }); },
    laser: v => { if (!c(v > 1 ? "laser-grande" : "laser", .8 * v)) { tono("square", 1600, .28, .12 * v, { fine: 180 }); } },
    suono: v => { [0, 4, 7, 12].forEach((s, k) => tono("triangle", nota(72 + s), .25, .12 * v, { t: k * .06 })); c("campana", .3 * v, { rate: 1.5 }); },
    ombra: v => { c("campo-energia", .6 * v, { rate: .55 }); tono("sawtooth", 220, .6, .1 * v, { fine: 55, filtro: 700 }); },
    luce: v => { [0, 4, 7, 11].forEach((s, k) => campana(nota(79 + s), .07 * v, k * .045, .8)); c("campo-energia", .4 * v, { rate: 1.5 }); },
    veleno: v => { c("melma", .9 * v); for (let k = 0; k < 4; k++) tono("sine", 220 + Math.random() * 120, .12, .1 * v, { fine: 500, t: k * .07 }); },
    monete: v => { if (!c("monete", .9 * v)) TIMBRI_SINTESI.monete(v); c("fiches", .6 * v, { t: .12 }); },
    vento: v => { c("fruscio", .9 * v); soffio("bandpass", 400, .55, .35 * v, { fine: 2600, q: 3 }); },
    magia: v => { c("campo-energia", .7 * v); [0, 7, 12, 16, 19].forEach((s, k) => tono("sine", nota(76 + s), .3, .06 * v, { t: k * .04 })); },
    terra: v => { if (!c("roccia", .9 * v)) tonfo(1 * v, 0, 90); soffio("lowpass", 400, .6, .4 * v, { fine: 80 }); },
    spari: v => { for (let k = 0; k < 3; k++) if (!c("laser-retro", .55 * v, { t: k * .1 })) soffio("bandpass", 2200, .08, .5 * v, { t: k * .09, q: 1 }); },
    ascia: v => { c("ascia", .9 * v) || c("lama", .8 * v); c("legno", .5 * v, { t: .05 }); },
  };
  const TIMBRI_SINTESI = { monete: v => { for (let k = 0; k < 3; k++) { tono("square", 988, .06, .06 * v, { t: k * .09 }); tono("square", 1319, .2, .06 * v, { t: k * .09 + .05 }); } } };
  // dal nome della mossa all'elemento (prima le parole più precise)
  const PAROLE = [
    ["fuoco", /fuoc|fiamm|lava|magma|incend|brucia|infern|eruz|sole nasc|calderon|vulcan|nucleo/i],
    ["ghiaccio", /ghiacc|gel|neve|brina|glacial|cristall|prisma|❄/i],
    ["fulmine", /fulmin|scaric|volt|elettr|tension|tuono|saetta|scossa|cortocirc|tempest/i],
    ["acqua", /acqua|onda|mare|maremot|getto|lago|laguna|palude|loto|vortice mar|abiss|sirena|coda/i],
    ["laser", /laser|plasma|raggio|cannon|fotonic|missil|razzo|blaster/i],
    ["suono", /nota|sinfon|urlo|canto|ulul|lament|eco|cucù|banshee|suono|brindisi/i],
    ["ombra", /ombr|eclissi|buio|notte|oscur|sith|morte|maledi|possess|fantasm|invisib|brivido/i],
    ["luce", /luce|luci|alba|sol|aur|stell|nova|bagliore|dorat|oro\b|d'oro/i],
    ["veleno", /velen|tossic|serp|morso|ragn|zombie|sangue|vampir/i],
    ["monete", /monet|denar|soldi|tesoro|settebell|primiera|rubamazz|ruba|download|virus/i],
    ["vento", /vent|brezz|uragan|ciclon|volo|corrente|tornado/i],
    ["ascia", /ascia|mazzat|bastonat|randell|bastone/i],
    ["lama", /spad|lama|tagli|fendent|artigl|lancia|spadin|katana|sciabol/i],
    ["terra", /terr|roccia|pietr|sisma|granit|sabbia|schiacc|pressa|picchiat|campanil|galopp/i],
    ["spari", /raffica|pioggia|colpi|esercito|orda|nido|tutti i/i],
  ];
  function timbroMossa(e) {
    const c = PER_ID[e.id], m = c && c.mosse[e.mossa];
    const nome = (m && m.nome) || e.nome || "";
    for (const [t, re] of PAROLE) if (re.test(nome)) return t;
    const eff = m && m.eff && m.eff.tipo;
    if (eff === "cura" || eff === "potenzia" || eff === "energia") return "magia";
    if (eff === "scudo") return "terra";
    if (eff === "nebbia") return "vento";
    if (m && m.colpi > 1) return "spari";
    return c && c.stile === "VEL" ? "lama" : c && c.stile === "DIF" ? "terra" : "pugno";
  }

  // ---------- suoni del gioco ----------
  const ultimiTocchi = { t: 0 };
  const S = {
    tocco(forte) {
      if (!effettiAttivi()) return;
      const n = performance.now(); if (n - ultimiTocchi.t < 45) return; ultimiTocchi.t = n;
      if (forte) { if (!c("ui-forte", .55)) { tono("triangle", 660, .08, .12, { fine: 990 }); tono("sine", 1320, .1, .05, { t: .04 }); } }
      else if (!c("ui-click", .5)) tono("sine", 880, .06, .09, { fine: 620 });
    },
    mossa(e) {
      if (!effettiAttivi()) return;
      const carta = PER_ID[e.id], m = carta && carta.mosse[e.mossa], finale = (m && m.costo >= 5) || e.mossa === 2;
      const t = timbroMossa(e);
      // un tocco della serie: le Carte da Gioco suonano come carte, i Cyborg come metallo
      if (carta && carta.serie === "carte") c("carta-scivola", .6);
      if (carta && carta.serie === "cyborg") c("robot", .35, { rate: 1.2 });
      if (finale) {
        // la mossa finale: un soffio che sale, poi il colpo con un'esplosione sotto
        soffio("bandpass", 300, .7, .22, { fine: 3000, q: 2 }); tono("sawtooth", 110, .7, .05, { fine: 440, filtro: 1500 });
        setTimeout(() => { if (!effettiAttivi()) return; (TIMBRI[t] || TIMBRI.pugno)(1.2); c("esplosione", .55); }, 650);
      } else (TIMBRI[t] || TIMBRI.pugno)(m && m.pot ? 1 : .7);
    },
    colpo(e) {
      if (!effettiAttivi()) return;
      const d = e.danno || 0, v = Math.min(1.1, .5 + d / 120), forte = e.crit || d >= 60;
      if (!c(forte ? "colpo-forte" : "colpo", .85 * v)) { tonfo(.7 * v, 0, e.crit ? 180 : 130); soffio("lowpass", e.crit ? 3000 : 1400, .14, .45 * v); }
      if (e.crit) { c("metallo-leggero", .5) || soffio("highpass", 4000, .1, .4, { a: .001 }); tono("square", 1800, .12, .04, { fine: 600 }); }
      if (e.efficace > 1) tono("triangle", 1046, .18, .06, { t: .05 });
    },
    cura() { if (!effettiAttivi()) return; [0, 4, 7, 12].forEach((s, k) => campana(nota(76 + s), .06, k * .07, .7)); c("campo-energia", .25, { rate: 1.7 }); },
    scudo() { if (!effettiAttivi()) return; if (!c("campo-energia", .7)) [523, 1187, 1663, 2531].forEach((f, k) => tono("sine", f, .7, .07 / (k + 1) * 2, { staccato: 1 })); c("metallo", .35, { t: .05 }); },
    effetto(tipo) {
      if (!effettiAttivi()) return;
      if (tipo === "scudo") return S.scudo();
      if (tipo === "potenzia") { c("campo-energia", .45, { rate: 1.25 }); tono("sawtooth", 220, .45, .05, { fine: 880, filtro: 2000 }); [0, 4, 7].forEach((s, k) => tono("triangle", nota(67 + s), .3, .06, { t: .2 + k * .05 })); return; }
      if (tipo === "energia") { for (let k = 0; k < 3; k++) tono("sine", 500 + k * 250, .1, .09, { fine: 900 + k * 250, t: k * .08 }); c("fiches", .35, { t: .1, rate: 1.3 }); return; }
      if (tipo === "indebolisci") { tono("triangle", 600, .5, .09, { fine: 150 }); c("campo-energia", .3, { rate: .6 }); return; }
      if (tipo === "stordisci") { c("campana", .45, { rate: 1.4 }); const o = tono("sine", 1200, .7, .05, { staccato: 1 }); const l = ctx.createOscillator(), g = ctx.createGain(); l.frequency.value = 9; g.gain.value = 300; l.connect(g); g.connect(o.frequency); l.start(); l.stop(ora() + .8); return; }
      if (tipo === "brucia") return TIMBRI.fuoco(.5);
      if (tipo === "nebbia") return TIMBRI.vento(.6);
      tono("sine", 700, .12, .07, { fine: 1000 });
    },
    schiva() { if (effettiAttivi()) c("fruscio", .8) || soffio("bandpass", 800, .3, .35, { fine: 3500, q: 2.5 }); },
    // una carta che entra in campo: scivola e si posa sul tavolo
    entra() { if (!effettiAttivi()) return; if (!c("carta-scivola", .8)) soffio("bandpass", 2500, .25, .25, { fine: 600, q: 2 }); c("carta-posa", .8, { t: .18 }) || tonfo(.35, .2, 160); },
    ko() { if (!effettiAttivi()) return; c("tonfo", 1) || tonfo(.8, .25, 100); tono("sawtooth", 330, .7, .07, { fine: 60, filtro: 1200 }); },
    fine(vinto) {
      if (!effettiAttivi()) return;
      if (vinto) { if (c("vittoria", .8)) { [72, 76, 79].forEach(n => tono("triangle", nota(n), 1.2, .05, { t: .85, staccato: 1 })); c("fiches", .5, { t: .9 }); } else { [60, 64, 67, 72].forEach((n, k) => tono("square", nota(n), .18, .07, { t: k * .11, filtro: 3000 })); [72, 76, 79].forEach(n => tono("triangle", nota(n), 1.2, .08, { t: .46, staccato: 1 })); } }
      else if (!c("sconfitta", .8)) { [67, 63, 60, 55].forEach((n, k) => tono("triangle", nota(n), .35, .09, { t: k * .22 })); }
    },
    // ---- bustine ----
    carica(dur, forza) {   // la bustina trema e si illumina: più è rara la carta migliore, più sale
      if (!effettiAttivi()) return;
      const s = dur / 1000;
      c("mazzo-mescola", .6);
      tono("sawtooth", 80, s, .04 + forza * .025, { fine: 200 + forza * 260, filtro: 900 + forza * 900, a: s * .8, staccato: .4 });
      soffio("bandpass", 300, s, .08 + forza * .04, { fine: 1500 + forza * 1500, q: 3, a: s * .9 });
      if (forza >= 3) tono("sine", 55, s, .22, { a: s * .9, staccato: .3 });
    },
    strappo() { if (!effettiAttivi()) return; if (!c("bustina-apri", 1)) soffio("bandpass", 1800, .35, .55, { fine: 5000, q: .8, a: .002 }); },
    esce() { if (effettiAttivi()) c("carta-scivola", .45) || soffio("bandpass", 1500, .16, .18, { fine: 3500, q: 2 }); },
    mazzo() { if (effettiAttivi()) c("mazzo-ventaglio", .7); },
    posa() { if (effettiAttivi()) c("carta-posa", .7); },
    gira(rarita) {
      if (!effettiAttivi()) return;
      if (!c("carta-gira", .9)) soffio("highpass", 3000, .06, .25, { a: .001 });
      const sting = { rara: ["rivela-rara", .45], epica: ["rivela-epica", .55], leggendaria: ["rivela-leggendaria", .75], ultra: ["rivela-leggendaria", .8], jolly: ["rivela-leggendaria", .8] }[rarita];
      if (sting && c(sting[0], sting[1], { t: .08, varia: 0 })) {
        if (rarita === "leggendaria" || rarita === "ultra" || rarita === "jolly") { c("campana", .4, { t: .1 }); c("fiches", .5, { t: .5 }); }
        if (rarita === "ultra") c("boato", .8, { t: .05 });
        return;
      }
      const n = { comune: [72], rara: [72, 79], epica: [72, 76, 79, 84], leggendaria: [72, 76, 79, 84, 88], ultra: [60, 67, 72, 76, 79, 84, 88], jolly: [72, 79, 84, 91, 96] }[rarita] || [72];
      if (rarita !== "comune" || !campioni["carta-gira"]) n.forEach((x, k) => tono(rarita === "comune" ? "sine" : "triangle", nota(x), .35, .06, { t: .05 + k * .06 }));
    },
    rullo() { if (!effettiAttivi()) return; c("legno", .9, { rate: .8 }) || tonfo(.9, 0, 70); tonfo(.5, 0, 70); },   // i colpi dell'entrata speciale
  };
  return { sblocca, imposta, ...S, _collegaRegistrazione(d) { busEffetti.connect(d); }, get campioniPronti() { return Object.values(campioni).reduce((a, l) => a + l.filter(Boolean).length, 0); }, get preferenze() { return { ...pref }; }, get salvate() { return salvate; }, get pronto() { return pronto(); }, get _ctx() { return ctx; }, _tono: tono, _soffio: soffio, _nota: nota, get _busMusica() { return busMusica; }, get _eco() { return eco; }, get _rumore() { return rumore; } };
})();

// ============================================================
//  Musica dei menu: tre brani originali che si alternano.
//  Ogni brano ha accordi, basso, batteria e una melodia costruita da piccoli motivi che seguono gli accordi.
// ============================================================
const Musica = (() => {
  const SCALE = { maggiore: [0, 2, 4, 5, 7, 9, 11], minore: [0, 2, 3, 5, 7, 8, 10], dorica: [0, 2, 3, 5, 7, 9, 10] };
  // accordi: grado della scala (0 = primo), 7 = con la settima
  const BRANI = [
    { nome: "Piazza del Noiverso", bpm: 112, tonica: 60, scala: "maggiore", lead: "square", basso: "triangle",
      A: [0, 4, 5, 3, 0, 4, 3, 4], B: [5, 3, 0, 4, 5, 3, 1, 4],
      batt: { k: "x.......x.x.....", s: "....x.......x...", h: "x.x.x.x.x.x.x.x." }, bassoRitmo: "x..x..x.x..x..x.",
      motA: [[0, 0, 2], [2, 2, 2], [4, 4, 3], [8, 2, 2], [10, 1, 2], [12, 0, 4]], motA2: [[0, 4, 2], [2, 5, 2], [4, 4, 2], [6, 2, 2], [8, 1, 4], [12, -1, 4]],
      motB: [[0, 2, 3], [3, 4, 1], [4, 5, 4], [8, 4, 2], [10, 2, 2], [12, 4, 4]], motB2: [[0, 7, 3], [3, 6, 1], [4, 4, 4], [8, 2, 4], [12, 1, 4]] },
    { nome: "Strada per l'Olimpo", bpm: 96, tonica: 57, scala: "minore", lead: "triangle", basso: "sawtooth",
      A: [0, 5, 2, 6, 0, 5, 3, 4], B: [3, 0, 5, 6, 3, 0, 4, 4],
      batt: { k: "x.....x...x.....", s: "....x.......x..x", h: "..x...x...x...x." }, bassoRitmo: "x.x...x.x.x...x.",
      motA: [[0, 4, 4], [4, 2, 2], [6, 0, 2], [8, 2, 6], [14, 4, 2]], motA2: [[0, 7, 3], [3, 6, 1], [4, 4, 4], [8, 2, 4], [12, 0, 4]],
      motB: [[0, 0, 2], [2, 2, 2], [4, 4, 2], [6, 7, 2], [8, 6, 4], [12, 4, 4]], motB2: [[0, 4, 2], [2, 2, 2], [4, 0, 4], [8, 1, 2], [10, -1, 2], [12, 0, 4]] },
    { nome: "Notte di carte", bpm: 84, tonica: 53, scala: "dorica", lead: "sine", basso: "triangle", settime: true, swing: .12,
      A: [0, 3, 0, 3, 1, 4, 0, 4], B: [3, 2, 1, 4, 3, 2, 6, 4],
      batt: { k: "x.........x.....", s: "....x.......x...", h: "x.xxx.x.x.xxx.x." }, bassoRitmo: "x.....x...x.....",
      motA: [[2, 4, 2], [4, 2, 2], [6, 4, 6], [12, 6, 4]], motA2: [[0, 7, 2], [2, 6, 2], [4, 4, 4], [10, 2, 2], [12, 0, 4]],
      motB: [[0, 2, 1], [1, 4, 1], [2, 6, 2], [4, 7, 4], [8, 6, 2], [10, 4, 6]], motB2: [[0, 4, 4], [4, 3, 2], [6, 2, 2], [8, 1, 8]] },
  ];
  let attiva = false, volume = +Suoni.preferenze.musica / 100, brano = 0, giro = 0, passo = 0, prossimo = 0, timer = null, sbloccato = false, voluto = false, bus = null;

  const nota = n => 440 * Math.pow(2, (n - 69) / 12);
  function grado(b, g) { const sc = SCALE[b.scala]; const o = Math.floor(g / 7); return b.tonica + 12 * o + sc[((g % 7) + 7) % 7]; }

  function strumento(tipo, f, t0, dur, vol, { filtro = 2400, a = .01, rel = .12, dest } = {}) {
    const ctx = Suoni._ctx, o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = tipo; o.frequency.value = f;
    fl.type = "lowpass"; fl.frequency.value = filtro;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + a);
    g.gain.setValueAtTime(vol * .8, t0 + Math.max(a, dur - rel)); g.gain.linearRampToValueAtTime(0, t0 + dur + rel);
    o.connect(fl); fl.connect(g); g.connect(dest || bus);
    o.start(t0); o.stop(t0 + dur + rel + .05);
    return g;
  }
  function batteria(pezzo, t0, vol) {
    const ctx = Suoni._ctx;
    if (pezzo === "k") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(140, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + .14);
      g.gain.setValueAtTime(.4 * vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .22);
      o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + .25);
    } else {
      const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = Suoni._rumore; fl.type = "highpass"; fl.frequency.value = pezzo === "s" ? 1400 : 7500;
      const d = pezzo === "s" ? .14 : .035;
      g.gain.setValueAtTime((pezzo === "s" ? .22 : .07) * vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d);
      s.connect(fl); fl.connect(g); g.connect(bus); s.start(t0, Math.random()); s.stop(t0 + d + .02);
      if (pezzo === "s") { const o = ctx.createOscillator(), g2 = ctx.createGain(); o.frequency.value = 190; g2.gain.setValueAtTime(.12 * vol, t0); g2.gain.exponentialRampToValueAtTime(.001, t0 + .08); o.connect(g2); g2.connect(bus); o.start(t0); o.stop(t0 + .1); }
    }
  }
  // suona il sedicesimo "passo" del brano al tempo t0
  function suonaPasso(b, p, t0, sedicesimo) {
    const battuta = Math.floor(p / 16), s = p % 16;
    const sezione = Math.floor(battuta / 8) % 2 ? b.B : b.A;
    const g = sezione[battuta % 8], inB = sezione === b.B;
    const radice = grado(b, g);
    // pad: l'accordo tenuto per tutta la battuta
    if (s === 0) {
      const voci = [g, g + 2, g + 4].concat(b.settime ? [g + 6] : []);
      voci.forEach((v, k) => strumento(k % 2 ? "sawtooth" : "triangle", nota(grado(b, v)) * (k % 2 ? 1.003 : 1), t0, sedicesimo * 16, .03, { filtro: 1100, a: .25, rel: .4 }));
    }
    // basso
    if (b.bassoRitmo[s] === "x") strumento(b.basso, nota(radice - 12 + (s === 8 && b.bpm > 100 ? 12 : 0)), t0, sedicesimo * 1.6, .17, { filtro: b.basso === "sawtooth" ? 500 : 900, rel: .05 });
    // batteria (la prima battuta del brano entra senza)
    if (giro > 0 || battuta > 0) for (const k of ["k", "s", "h"]) if (b.batt[k][s] === "x") batteria(k, t0, 1);
    // melodia: motivo della sezione, risposta nelle battute dispari, riposo ogni quarta battuta della sezione B
    if (inB && battuta % 8 === 7) return;
    const mot = inB ? (battuta % 2 ? b.motB2 : b.motB) : (battuta % 2 ? b.motA2 : b.motA);
    for (const [st, gr, lun] of mot) if (st === s) {
      const f = nota(grado(b, g + gr) + 12);
      strumento(b.lead, f, t0, sedicesimo * lun * .92, b.lead === "square" ? .045 : b.lead === "sine" ? .11 : .08, { filtro: b.lead === "square" ? 2600 : 4000, rel: .08 });
      strumento(b.lead, f, t0, sedicesimo * lun * .9, .02, { dest: Suoni._eco });
    }
  }
  function pianifica() {
    const ctx = Suoni._ctx; if (!ctx) return;
    const b = BRANI[brano], sed = 60 / b.bpm / 4;
    while (prossimo < ctx.currentTime + .18) {
      const sw = b.swing && passo % 2 ? sed * b.swing : 0;
      suonaPasso(b, passo, prossimo + sw, sed);
      prossimo += sed; passo++;
      if (passo >= 16 * 16) { passo = 0; giro++; if (giro >= 2) { giro = 0; brano = (brano + 1) % BRANI.length; prossimo += sed * 8; return; } }
    }
  }
  function avvia() {
    voluto = true;
    if (attiva || !sbloccato || volume <= 0 || !Suoni._ctx) return;
    const ctx = Suoni._ctx;
    bus = ctx.createGain(); bus.gain.setValueAtTime(0, ctx.currentTime); bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5); bus.connect(Suoni._busMusica);
    attiva = true; prossimo = ctx.currentTime + .1;
    timer = setInterval(pianifica, 40);
  }
  function ferma(dolce = true) {
    voluto = false;
    if (!attiva) return;
    attiva = false; clearInterval(timer); timer = null;
    const ctx = Suoni._ctx, b = bus; bus = null;
    if (b) { b.gain.cancelScheduledValues(ctx.currentTime); b.gain.setValueAtTime(b.gain.value, ctx.currentTime); b.gain.linearRampToValueAtTime(0, ctx.currentTime + (dolce ? 1.2 : .1)); setTimeout(() => b.disconnect(), 1600); }
  }
  // quando la pagina va in secondo piano la musica si ferma (e la batteria del telefono ringrazia)
  document.addEventListener("visibilitychange", () => {
    const ctx = Suoni._ctx; if (!ctx) return;
    if (document.hidden) { if (attiva) { const v = voluto; ferma(false); voluto = v; } ctx.suspend && ctx.suspend(); }
    else { ctx.resume && ctx.resume(); if (voluto) avvia(); }
  });
  return {
    avvia, ferma, BRANI,
    // passa a un brano (per provarli): ricomincia dall'inizio
    vai(i) { brano = ((i % BRANI.length) + BRANI.length) % BRANI.length; passo = 0; giro = 0; if (Suoni._ctx) prossimo = Suoni._ctx.currentTime + .05; },
    get attiva() { return attiva; }, get brano() { return BRANI[brano].nome; },
    _sbloccato() { sbloccato = true; if (voluto) avvia(); },
    _volume(v) { volume = v; if (v <= 0 && attiva) { ferma(); voluto = true; } else if (v > 0 && voluto && !attiva) avvia(); },
  };
})();
