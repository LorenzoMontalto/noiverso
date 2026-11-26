// ============================================================
//  LA LUNGA NOTTE (nov 2026) — modalità roguelike, "si esce la sera"
//  Dieci fermate dal tramonto all'alba. La collezione non conta: le carte sono quelle che trovi per strada.
//  I PV restano da una battaglia all'altra; a ogni bivio scegli la strada; raccogli carte e cimeli.
//  Se perdi, la notte finisce e incassi in base a quante fermate hai superato.
//
//  Due parti:
//  - NotteRegole: solo regole, niente DOM (le usa anche controlli/simula.js in Node);
//  - Notte: le schermate.
//  Nessuna regola nuova nel motore: i cimeli usano le chiavi di x.sin delle sinergie, le statistiche e l'energia.
// ============================================================

// I cimeli: li usano sia la Lunga Notte sia la Scalata. "conta" = quante volte ce l'hai (nella Scalata quelli
// leggendari si sommano).
const CIMELI = {
  insegna:     { ico: "🔆", nome: "Insegna al neon",      rar: "comune",  desc: "+10% attacco a tutte le tue carte" },
  giubbotto:   { ico: "🧥", nome: "Giubbotto di pelle",   rar: "comune",  desc: "+12% difesa a tutte le tue carte" },
  scarpe:      { ico: "👟", nome: "Scarpe da corsa",      rar: "comune",  desc: "+3 velocità a tutte le tue carte" },
  panino:      { ico: "🥪", nome: "Panino della nonna",   rar: "comune",  desc: "+12% PV a tutte le tue carte" },
  caffe:       { ico: "☕", nome: "Doppio caffè",          rar: "rara",    desc: "Inizi ogni battaglia con +2 energia" },
  termos:      { ico: "🍲", nome: "Termos di brodo",      rar: "rara",    desc: "La carta in campo recupera il 3% dei PV ogni turno" },
  dado:        { ico: "🎲", nome: "Dado truccato",        rar: "rara",    desc: "+12% di colpi critici" },
  specchietto: { ico: "🪞", nome: "Specchietto rotto",    rar: "rara",    desc: "6% di parare un attacco" },
  casco:       { ico: "⛑️", nome: "Casco prestato",       rar: "rara",    desc: "Le tue carte iniziano la battaglia con uno scudo del 35%" },
  cerotti:     { ico: "🩹", nome: "Scatola di cerotti",   rar: "rara",    desc: "Dopo ogni vittoria +12% PV in più a tutti", solo: "notte" },
  portafogli:  { ico: "👛", nome: "Portafogli trovato",   rar: "rara",    desc: "+50% gettoni dalle battaglie", solo: "notte" },
  canini:      { ico: "🧛", nome: "Canini di plastica",   rar: "epica",   desc: "Recuperano in PV il 10% dei danni che fanno" },
  moneta:      { ico: "🪙", nome: "Moneta fortunata",     rar: "epica",   desc: "15% di colpire una seconda volta a metà danni" },
  petardo:     { ico: "🧨", nome: "Petardo gigante",      rar: "epica",   desc: "Le mosse da 5 ⚡ fanno +15% di danni" },
  foto:        { ico: "📸", nome: "Foto di gruppo",       rar: "epica",   desc: "+8% di danni per ogni compagno già KO" },
  cassa:       { ico: "🔊", nome: "Cassa a tutto volume", rar: "epica",   desc: "I nemici iniziano con 2 energia in meno" },
};

const NotteRegole = (() => {
  const FERMATE = 10, MAX_SQ = 5, LIV0 = 12, GETTONI0 = 30;
  // tarabili (le simulazioni stanno in controlli/simula.js)
  // tarati con le simulazioni (controlli/modalita.js): un giocatore medio arriva all'alba circa 1 volta su 10,
  // uno bravo più spesso; di solito si perde ai boss (fermata 5 e 10) o tra la 6 e la 9
  const T = { bossPv: 1.2, bossPvUltimo: 1.4, bossAtt: 1, bossFuria: 20, koTorna: .4, curaVittoria: .2, livBase: 4, livPasso: 1.45,
    nRissa: [2, 2, 3, 3, 3, 4, 4, 4, 5, 5] };
  const livNemici = f => Math.round(T.livBase + f * T.livPasso);
  const PREZZI = { comune: 25, rara: 40, epica: 65, leggendaria: 110, cimelio: 70, cura: 35, livello: 45 };
  const fuoriDaiJolly = c => c.rarita !== "jolly" && !(SERIE[c.serie] && SERIE[c.serie].jolly);
  const pesca = (rng, a) => a[Math.floor(rng() * a.length)];
  const mescola = (rng, a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const carteDi = (rar, escludi = []) => CARTE.filter(c => c.rarita === rar && fuoriDaiJolly(c) && !escludi.includes(c.id));
  const serieValide = () => Object.keys(SERIE).filter(k => !SERIE[k].jolly);

  // la rarità delle carte trovate migliora fermata dopo fermata (bonus +3 fermate per banda e boss)
  function rarita(rng, f, bonus = 0) {
    const g = f + bonus, x = rng() * 100, leg = Math.min(25, 1 + g * 1.6), epi = Math.min(40, 8 + g * 2.8), rar = 36;
    return x < leg ? "leggendaria" : x < leg + epi ? "epica" : x < leg + epi + rar ? "rara" : "comune";
  }
  const cartaCasuale = (rng, rar, escludi) => { const p = carteDi(rar, escludi); return p.length ? pesca(rng, p).id : pesca(rng, carteDi("comune", escludi)).id; };
  const livMedio = st => Math.max(1, Math.round(st.squadra.reduce((n, x) => n + x.liv, 0) / Math.max(1, st.squadra.length)));

  // ---- partenza ----
  function partenze(rng) {
    const ser = mescola(rng, serieValide().filter(k => CARTE.filter(c => c.serie === k && ["rara", "comune"].includes(c.rarita)).length >= 3));
    const comitiva = mescola(rng, CARTE.filter(c => c.serie === ser[0] && ["rara", "comune"].includes(c.rarita))).slice(0, 3).map(c => c.id);
    const eq = ["FOR", "DIF", "VEL"].map(s => pesca(rng, CARTE.filter(c => c.rarita === "rara" && c.stile === s && fuoriDaiJolly(c))).id);
    const fuori = [pesca(rng, carteDi("leggendaria")).id, pesca(rng, carteDi("comune")).id];
    return [
      { id: "comitiva", nome: "La comitiva", desc: `3 amici della stessa serie (${SERIE[ser[0]].nome}): parti con la sinergia.`, carte: comitiva, gettoni: GETTONI0 },
      { id: "equilibrati", nome: "Gli equilibrati", desc: "Una rara Forza, una Difesa e una Velocità: c'è sempre il tipo giusto.", carte: eq, gettoni: GETTONI0 },
      { id: "fuoriclasse", nome: "Il fuoriclasse", desc: "Una leggendaria e una comune, più 60 gettoni per farti la squadra strada facendo.", carte: fuori, gettoni: GETTONI0 + 60 },
    ];
  }
  function nuova(rng, partenza) {
    return { v: 1, fase: "bivio", fermata: 1, squadra: partenza.carte.map(id => ({ id, liv: LIV0, pv: 1 })), cimeli: {}, gettoni: partenza.gettoni,
      bivio: bivio(rng, 1, partenza.carte), vinte: 0, partenza: partenza.id };
  }

  // ---- bivi e tappe ----
  function nemiciRissa(rng, f, escludi) {
    const n = T.nRissa[f - 1], liv = livNemici(f);
    const out = []; for (let i = 0; i < n; i++) { const id = cartaCasuale(rng, rarita(rng, f), [...escludi, ...out.map(x => x.id)]); out.push({ id, liv }); }
    return out;
  }
  function nemiciBanda(rng, f) {
    const k = pesca(rng, serieValide().filter(s => CARTE.filter(c => c.serie === s && c.rarita !== "leggendaria").length >= 5));
    const n = Math.max(3, T.nRissa[f - 1]), liv = livNemici(f) + 1;
    return { serie: k, nemici: mescola(rng, CARTE.filter(c => c.serie === k && c.rarita !== "leggendaria")).slice(0, n).map(c => ({ id: c.id, liv })) };
  }
  function nemiciBoss(rng, f) {
    const k = pesca(rng, serieValide().filter(s => CARTE.some(c => c.serie === s && c.rarita === "leggendaria") && CARTE.filter(c => c.serie === s && c.rarita !== "leggendaria").length >= 3));
    const liv = livNemici(f) + 1, boss = pesca(rng, CARTE.filter(c => c.serie === k && c.rarita === "leggendaria"));
    const comp = mescola(rng, CARTE.filter(c => c.serie === k && c.rarita !== "leggendaria")).slice(0, f >= FERMATE ? 3 : 2);
    return { serie: k, nemici: [{ id: boss.id, liv }, ...comp.map(c => ({ id: c.id, liv: liv - 1 }))] };
  }
  function tappa(rng, tipo, f, escludi) {
    if (tipo === "rissa") return { tipo, nemici: nemiciRissa(rng, f, escludi) };
    if (tipo === "banda") return { tipo, ...nemiciBanda(rng, f) };
    if (tipo === "boss") return { tipo, ...nemiciBoss(rng, f) };
    if (tipo === "imprevisto") return { tipo, scena: pesca(rng, ["buttafuori", "tre-carte", "amico", "vicolo", "taxi"]) };
    return { tipo };
  }
  function bivio(rng, f, escludi = []) {
    let tipi;
    if (f === 1) tipi = ["rissa", "rissa"];
    else if (f === 4 || f === 9) tipi = ["bar", "mercatino"];   // prima di un boss ci si prepara sempre
    else if (f === 5 || f === FERMATE) tipi = ["boss"];
    else { const pool = ["banda", "bar", "mercatino", "imprevisto", "imprevisto"], a = mescola(rng, pool), altri = [];
      for (const t of a) if (!altri.includes(t) && altri.length < 2) altri.push(t);
      tipi = ["rissa", ...altri]; }
    return tipi.map(t => tappa(rng, t, f, escludi));
  }
  const abilita = (f, boss) => Math.min(.96, .6 + f * .035 + (boss ? .05 : 0));

  // ---- in battaglia ----
  // applica i cimeli a un lato della battaglia (conta = { id: quante volte })
  function applicaCimeli(B, lato, conta) {
    const L = B.lati[lato], O = B.lati[1 - lato], k = id => conta[id] || 0;
    for (const x of L.squadra) {
      x.sin = x.sin || {};
      if (k("insegna")) x.att *= 1 + .10 * k("insegna");
      if (k("giubbotto")) x.dif *= 1 + .12 * k("giubbotto");
      if (k("scarpe")) x.vel += 3 * k("scarpe");
      if (k("panino")) { const f = x.pv / x.pvMax; x.pvMax = Math.round(x.pvMax * (1 + .12 * k("panino"))); x.pv = Math.round(x.pvMax * f); }
      if (k("termos")) x.sin.rigenera = (x.sin.rigenera || 0) + 3 * k("termos");
      if (k("canini")) x.sin.vampiro = (x.sin.vampiro || 0) + 10 * k("canini");
      if (k("dado")) x.sin.crit = (x.sin.crit || 0) + 12 * k("dado");
      if (k("moneta")) x.sin.fortuna = (x.sin.fortuna || 0) + 15 * k("moneta");
      if (k("specchietto")) x.sin.para = (x.sin.para || 0) + 6 * k("specchietto");
      if (k("petardo")) x.sin.finale = (x.sin.finale || 0) + 15 * k("petardo");
      if (k("foto")) x.sin.onore = (x.sin.onore || 0) + 8 * k("foto");
      if (k("casco")) x.scudo = Math.max(x.scudo || 0, 35);
    }
    if (k("caffe")) L.energia = Math.min(ENERGIA_MAX, L.energia + 2 * k("caffe"));
    if (k("cassa")) O.energia = Math.max(0, O.energia - 2 * k("cassa"));
  }
  function prepara(B, st, t) {
    // i PV che restano da una battaglia all'altra
    B.lati[0].squadra.forEach((x, i) => { const s = st.squadra[i]; if (s) x.pv = Math.max(1, Math.round(x.pvMax * s.pv)); });
    applicaCimeli(B, 0, st.cimeli);
    if (t && t.tipo === "boss") {
      const b = B.lati[1].squadra[0], m = st.fermata >= FERMATE ? T.bossPvUltimo : T.bossPv;
      b.pvMax = Math.round(b.pvMax * m); b.pv = b.pvMax; b.att *= T.bossAtt; b.furia = T.bossFuria;
    }
  }
  // dopo la battaglia: i PV rimasti (frazione) e chi è finito KO
  function dopoBattaglia(st, B, vinto, rng) {
    B.lati[0].squadra.forEach((x, i) => { if (st.squadra[i]) st.squadra[i].pv = Math.max(0, x.pv / x.pvMax); });
    if (!vinto) { st.fase = "fine"; st.finita = "persa"; return null; }
    st.vinte++;
    const cura = T.curaVittoria + (st.cimeli.cerotti ? .12 : 0);
    for (const s of st.squadra) { s.pv = s.pv <= 0 ? T.koTorna : Math.min(1, s.pv + cura); s.liv = Math.min(LIVELLO_MAX, s.liv + 1); }
    const t = st.tappa, f = st.fermata, molt = st.cimeli.portafogli ? 1.5 : 1;
    const g = t.tipo === "boss" ? 70 : t.tipo === "banda" ? 45 : 25 + Math.floor(rng() * 11);
    st.gettoni += Math.round(g * molt);
    return premio(rng, st, t.tipo);
  }
  // il premio da scegliere dopo una vittoria
  function premio(rng, st, tipo) {
    const f = st.fermata, bonus = tipo === "rissa" ? 0 : 3, escl = st.squadra.map(x => x.id), lv = livMedio(st);
    const carta = () => { const id = cartaCasuale(rng, rarita(rng, f, bonus), [...escl, ...scelte.filter(x => x.carta).map(x => x.carta)]); return { carta: id, liv: lv }; };
    const cim = n => mescola(rng, Object.keys(CIMELI).filter(id => !st.cimeli[id] && !scelte.some(x => x.cimelio === id) && CIMELI[id].solo !== "scalata")).slice(0, n).map(id => ({ cimelio: id }));
    const scelte = [];
    if (tipo === "rissa") { scelte.push(carta(), carta()); scelte.push(...cim(1)); }
    else if (tipo === "banda") scelte.push(...cim(3));
    else { scelte.push(...cim(2)); scelte.push(carta()); }
    return scelte;
  }
  // prendere una carta: se la squadra è piena bisogna dire chi lasciare (lascia = indice)
  function prendiCarta(st, id, liv, lascia) {
    const nuova = { id, liv, pv: 1 };
    if (st.squadra.length < MAX_SQ) { st.squadra.push(nuova); return true; }
    if (lascia === undefined || lascia === null || !st.squadra[lascia]) return false;
    st.squadra[lascia] = nuova; return true;
  }
  function avanza(rng, st) {
    st.fermata++; st.tappa = null; st.premio = null; st.offerta = null;
    if (st.fermata > FERMATE) { st.fase = "fine"; st.finita = "alba"; st.fermata = FERMATE; return; }
    st.fase = "bivio"; st.bivio = bivio(rng, st.fermata, st.squadra.map(x => x.id));
  }
  const curaTutti = (st, q) => st.squadra.forEach(s => { s.pv = Math.min(1, Math.max(0, s.pv) + q); });
  const livelliTutti = (st, n) => st.squadra.forEach(s => { s.liv = Math.min(LIVELLO_MAX, s.liv + n); });
  function mercatino(rng, st) {
    const lv = livMedio(st), escl = st.squadra.map(x => x.id), carte = [];
    for (let i = 0; i < 3; i++) { const r = rarita(rng, st.fermata), id = cartaCasuale(rng, r, [...escl, ...carte.map(c => c.id)]); carte.push({ id, liv: lv, prezzo: PREZZI[PER_ID[id].rarita] }); }
    const cimeli = mescola(rng, Object.keys(CIMELI).filter(id => !st.cimeli[id] && CIMELI[id].solo !== "scalata")).slice(0, 2).map(id => ({ id, prezzo: PREZZI.cimelio }));
    return { carte, cimeli, cura: PREZZI.cura, livello: PREZZI.livello, comprati: [] };
  }
  // premio finale: f = fermate superate. I valori sono tarati in controlli/simula.js (vedi PremiModalita)
  const fermateSuperate = st => st.finita === "alba" ? FERMATE : Math.max(0, st.fermata - 1);
  return { FERMATE, MAX_SQ, LIV0, T, PREZZI, partenze, nuova, bivio, abilita, applicaCimeli, prepara, dopoBattaglia, premio, prendiCarta, avanza,
    curaTutti, livelliTutti, mercatino, rarita, livMedio, fermateSuperate, mescola, pesca };
})();

// Premi delle tre modalità "a corsa" (Arena, Lunga Notte, Scalata), tarati insieme con controlli/modalita.js.
// Regola: a parità di bravura rendono più o meno lo stesso valore per minuto di gioco (circa 18 monete nette al
// minuto per un giocatore medio, 29 per uno bravo, come l'Arena), e chi arriva più in là — più difficile e più
// lungo — prende di più, con un salto ai traguardi duri (il primo boss e l'alba; i piani 5, 10 e 15).
// Valore delle bustine nei conti: normale 100, epica 300, leggendaria 900 monete.
const PremiModalita = {
  INGRESSO_NOTTE: 300,
  // f = fermate superate (0-10); 10 = alba
  NOTTE: [{ monete: 170 }, { monete: 200 }, { monete: 240 }, { monete: 260 }, { monete: 190, bustine: { normale: 1 } },
    { monete: 170, bustine: { epica: 1 } }, { monete: 210, bustine: { epica: 1 } }, { monete: 270, bustine: { epica: 1 } }, { monete: 300, bustine: { epica: 1 } },
    { monete: 320, bustine: { epica: 1 } }, { monete: 100, bustine: { leggendaria: 1 } }],
  notte(f) { const p = this.NOTTE[Math.max(0, Math.min(10, f))]; return { monete: p.monete, bustine: Object.assign({}, p.bustine || {}) }; },
  INGRESSO_SCALATA: 300,
  // p = piani superati: cresce con il tempo che serve ad arrivarci (circa 2,8 minuti a piano, di più in alto)
  scalata(p) {
    const r = { monete: Math.round((150 + 98 * p + 1.75 * p * p - (p >= 10 ? 150 : 0) - (p >= 15 ? 600 : 0)) / 10) * 10, bustine: {} };
    if (p >= 5) r.bustine.normale = 1;
    if (p >= 10) r.bustine.epica = 1;
    if (p >= 15) r.bustine.leggendaria = 1;
    return r;
  },
  XP_BATTAGLIA: 60,   // XP del pass per ogni battaglia vinta, come in Arena
};

if (typeof module !== "undefined") module.exports = { NotteRegole, CIMELI, PremiModalita };

// ============================================================
//  Notte: le schermate
// ============================================================
const Notte = (typeof document === "undefined") ? null : (() => {
  const R = NotteRegole;
  const st = () => S.notte && S.notte.v === 1 ? S.notte : null;
  const rng = () => Math.random();
  const ICONE = { rissa: "👊", banda: "🧢", boss: "💀", bar: "🍻", mercatino: "🛍️", imprevisto: "❓" };
  const NOMI = { rissa: "Rissa", banda: "Banda rivale", boss: "Boss", bar: "Bar", mercatino: "Mercatino", imprevisto: "Imprevisto" };
  const DESCR = { bar: "Riposi o ti alleni.", mercatino: "Carte, cimeli e cure in cambio di gettoni.", imprevisto: "Può andare bene… o male." };
  const SCENE = {
    buttafuori: { tit: "Il buttafuori", testo: "All'ingresso del locale c'è un buttafuori enorme. Dietro di lui, un cimelio dimenticato su un tavolo." },
    "tre-carte": { tit: "Il gioco delle tre carte", testo: "Un tipo sul marciapiede ti sfida: «Trova la regina, raddoppi la posta»." },
    amico: { tit: "Un vecchio amico", testo: "Incontri un vecchio amico che non vedevi da anni. Vuole darti una mano." },
    vicolo: { tit: "Lo sconosciuto nel vicolo", testo: "Uno sconosciuto ti offre un allenamento «speciale» in un vicolo buio. Rende forti, ma lascia il segno." },
    taxi: { tit: "Il taxi", testo: "Un taxi si ferma: il tassista è un medico in pensione e ha cinque minuti." },
  };

  // ---------- riquadro nella pagina Sfida ----------
  function htmlSfida() {
    const s = st();
    return `<section class="modo-box notte-box"><div class="modo-ico">🌙</div><div>
      <b>La Lunga Notte</b><span class="nota">Dieci fermate dal tramonto all'alba con carte trovate per strada: la tua collezione non conta. I PV restano tra una battaglia e l'altra, a ogni bivio scegli la strada e raccogli cimeli. Se perdi, la notte finisce.</span>
      ${s ? `<span class="modo-stato">${s.fase === "fine" ? "Notte finita: riscuoti il premio" : `Fermata ${s.fermata} di ${R.FERMATE}${s.battaglia ? " · battaglia in corso" : ""}`}</span>` : `<span class="modo-stato">Ingresso ${PremiModalita.INGRESSO_NOTTE} monete · premio in base alle fermate superate</span>`}
      </div><div class="modo-tasti"><button class="btn ${s ? "primario" : "oro"}" data-fx="spinta" data-azione="${s ? "notte-vai" : "notte-entra"}">${s ? "Continua" : "Esci stasera"}</button>
      <button class="btn piccolo" data-azione="notte-regole">Come si gioca</button></div></section>`;
  }
  // prima di pagare l'ingresso si conferma, così non si parte per sbaglio
  function entra(confermato) {
    if (st()) { vai("notte"); return; }
    if (!S.admin && S.monete < PremiModalita.INGRESSO_NOTTE) { mostraAvviso(`L'ingresso costa ${PremiModalita.INGRESSO_NOTTE} monete.`); return; }
    if (!confermato) { apriModale(`<div class="modo-conferma"><span class="codice-tag">🌙 La Lunga Notte</span><h2>Esci stasera?</h2>
      <p>L'ingresso costa <b>${S.admin ? "niente (sei l'admin)" : PremiModalita.INGRESSO_NOTTE + " monete"}</b> e non si restituisce: il premio dipende da quante fermate superi.</p>
      <p class="nota">Puoi fermarti quando vuoi con «Torna a casa» e incassare quello che hai guadagnato fino a lì.</p>
      <div class="azioni centro"><button class="btn oro grande" data-fx="spinta" data-azione="notte-conferma">Sì, esco${S.admin ? "" : ` (${PremiModalita.INGRESSO_NOTTE} monete)`}</button><button class="btn" data-azione="chiudi">Non ora</button></div>
      <button class="btn piccolo link" data-azione="notte-regole">Come si gioca</button></div>`); return; }
    chiudiModale();
    if (!S.admin) S.monete -= PremiModalita.INGRESSO_NOTTE;
    S.notte = { v: 1, fase: "partenza", partenze: R.partenze(rng) };
    salva(); aggiornaTesta(); vai("notte");
  }

  // ---------- pezzi di interfaccia ----------
  const htmlCim = c => `<button type="button" class="cimelio-chip" data-cimelio-info="${c}" title="${esc(CIMELI[c].desc)}">${CIMELI[c].ico}${S.notte && S.notte.cimeli && S.notte.cimeli[c] > 1 ? `<small>×${S.notte.cimeli[c]}</small>` : ""}</button>`;
  function htmlStrada(s) {
    return `<ol class="notte-strada">${Array.from({ length: R.FERMATE }, (_, i) => { const f = i + 1, fatta = f < s.fermata || s.finita === "alba", ora = f === s.fermata && !fatta;
      return `<li class="${fatta ? "fatta" : ""} ${ora ? "ora" : ""} ${f === 5 || f === R.FERMATE ? "boss" : ""}"><span>${fatta ? "✓" : f === 5 || f === R.FERMATE ? "💀" : f}</span></li>`; }).join("")}<li class="alba ${s.finita === "alba" ? "fatta" : ""}"><span>🌅</span></li></ol>`;
  }
  function htmlSquadra(s, scegliLascia) {
    return `<div class="notte-squadra">${s.squadra.map((x, i) => { const c = PER_ID[x.id], pct = Math.round(Math.max(0, x.pv) * 100);
      return `<${scegliLascia ? `button type="button" data-notte-lascia="${i}"` : `button type="button" data-notte-carta="${i}"`} class="notte-membro ${x.pv <= 0 ? "ko" : ""}">
        <img src="${imgCarta(c.id)}" alt=""><span class="nm-testo"><b>${esc(c.nome)}</b><small><span class="r-testo r-${c.rarita}">${RARITA[c.rarita].nome}</span> · Lv ${x.liv} · <span class="s-${c.stile}">${c.stile}</span></small>
        <span class="nm-pv"><i style="width:${pct}%"></i></span><small>${x.pv <= 0 ? "KO" : pct + "% PV"}</small></span></${scegliLascia ? "button" : "button"}>`; }).join("")}
      ${Array.from({ length: R.MAX_SQ - s.squadra.length }, () => `<div class="notte-membro vuoto"><span>posto libero</span></div>`).join("")}</div>`;
  }
  const htmlNemici = n => `<div class="notte-nemici">${n.map(x => `<span title="${esc(PER_ID[x.id].nome)}"><img src="${imgCarta(x.id)}" alt=""><small>Lv ${x.liv}</small></span>`).join("")}</div>`;
  function htmlOpzione(t, i) {
    const lv = t.nemici ? t.nemici[0].liv : 0;
    return `<button type="button" class="notte-opz t-${t.tipo}" data-fx="spinta" data-notte-bivio="${i}">
      <span class="no-ico">${ICONE[t.tipo]}</span><b>${NOMI[t.tipo]}${t.serie ? ` · ${esc(SERIE[t.serie].nome)}` : ""}</b>
      <small>${t.nemici ? `${t.nemici.length} nemici · Lv ${lv}${t.tipo === "boss" ? " · il boss ha più PV e si infuria" : t.tipo === "banda" ? " · tutti della stessa serie" : ""}` : DESCR[t.tipo]}</small>
      ${t.nemici ? htmlNemici(t.nemici) : ""}
      <em>${t.tipo === "rissa" ? "Premio: gettoni e una carta o un cimelio" : t.tipo === "banda" ? "Premio: 45 gettoni e un cimelio a scelta" : t.tipo === "boss" ? "Premio: 70 gettoni e un cimelio o una carta" : ""}</em></button>`;
  }
  function htmlScelta(x, i, prefisso) {
    if (x.cimelio) { const c = CIMELI[x.cimelio]; return `<button type="button" class="notte-premio cim" data-fx="spinta" data-${prefisso}="${i}"><span class="np-ico">${c.ico}</span><b>${esc(c.nome)}</b><small>${esc(c.desc)}</small>${x.prezzo ? `<em>${x.prezzo} gettoni</em>` : ""}</button>`; }
    const c = PER_ID[x.carta || x.id];
    return `<button type="button" class="notte-premio carta" data-fx="spinta" data-${prefisso}="${i}">${htmlCarta(c, { piccola: true, liv: x.liv })}<b>${esc(c.nome)}</b><small>${esc(RUOLI[c.ruolo].nome)} · Lv ${x.liv}</small>${x.prezzo ? `<em>${x.prezzo} gettoni</em>` : ""}</button>`;
  }

  // ---------- la pagina ----------
  function vista() {
    const s = st();
    if (!s) return htmlCopertinaModo("notte", copertinaPer("notte"));
    if (s.battaglia && !B) setTimeout(riprendi, 0);
    let corpo = "";
    if (s.fase === "partenza") corpo = `<h3>Con chi esci stasera?</h3><p class="nota">Tutte le carte partono dal livello ${R.LIV0} e restano solo per questa notte.</p>
      <div class="notte-partenze">${s.partenze.map((p, i) => `<button type="button" class="notte-opz partenza" data-fx="spinta" data-notte-partenza="${i}"><b>${esc(p.nome)}</b><small>${esc(p.desc)}</small>
        <div class="notte-nemici">${p.carte.map(id => `<span><img src="${imgCarta(id)}" alt=""><small>${esc(PER_ID[id].nome)}</small></span>`).join("")}</div><em>${p.gettoni} gettoni</em></button>`).join("")}</div>`;
    else if (s.battaglia) corpo = `<div class="notte-riquadro"><p>Battaglia in corso…</p><button class="btn primario" data-azione="notte-riprendi">Riprendi la battaglia</button></div>`;
    else if (s.fase === "bivio") corpo = `<h3>Fermata ${s.fermata}: ${s.bivio.length > 1 ? "che strada prendi?" : "non si torna indietro"}</h3><div class="notte-bivio">${s.bivio.map(htmlOpzione).join("")}</div>`;
    else if (s.fase === "premio") corpo = `<div class="notte-riquadro"><h3>Hai vinto! Scegli il premio</h3><div class="notte-premi">${s.premio.map((x, i) => htmlScelta(x, i, "notte-premio")).join("")}</div>
      <button class="btn" data-azione="notte-salta">Non prendo niente</button></div>`;
    else if (s.fase === "lascia") corpo = `<div class="notte-riquadro"><h3>La squadra è piena: chi lasci a casa?</h3><p class="nota">Arriva <b>${esc(PER_ID[s.lascia.carta].nome)}</b> (Lv ${s.lascia.liv}). Tocca la carta da lasciare.</p>
      ${htmlSquadra(s, true)}<button class="btn" data-azione="notte-annulla-lascia">Annulla</button></div>`;
    else if (s.fase === "bar") corpo = `<div class="notte-riquadro"><h3>🍻 Al bar</h3><p class="nota">Ti siedi un attimo. Cosa fai?</p><div class="notte-premi">
      <button type="button" class="notte-premio" data-azione="notte-bar-riposo"><span class="np-ico">😴</span><b>Riposi</b><small>+40% PV a tutti</small></button>
      <button type="button" class="notte-premio" data-azione="notte-bar-allena"><span class="np-ico">🏋️</span><b>Ti alleni</b><small>+2 livelli a tutti</small></button></div></div>`;
    else if (s.fase === "mercatino") { const m = s.offerta;
      corpo = `<div class="notte-riquadro"><h3>🛍️ Il mercatino</h3><p class="nota">Hai <b>${s.gettoni}</b> gettoni.</p>
        <div class="notte-premi">${m.carte.map((x, i) => m.comprati.includes("c" + i) ? "" : htmlScelta(x, i, "notte-compra-carta")).join("")}${m.cimeli.map((x, i) => m.comprati.includes("m" + i) ? "" : htmlScelta({ cimelio: x.id, prezzo: x.prezzo }, i, "notte-compra-cim")).join("")}
          <button type="button" class="notte-premio" data-azione="notte-compra-cura" ${m.comprati.includes("cura") ? "disabled" : ""}><span class="np-ico">💊</span><b>Cerotti e bende</b><small>+30% PV a tutti</small><em>${m.cura} gettoni</em></button>
          <button type="button" class="notte-premio" data-azione="notte-compra-livello" ${m.comprati.includes("livello") ? "disabled" : ""}><span class="np-ico">📈</span><b>Lezione di boxe</b><small>+1 livello a tutti</small><em>${m.livello} gettoni</em></button></div>
        <button class="btn primario" data-azione="notte-avanti">Vai avanti</button></div>`; }
    else if (s.fase === "imprevisto") corpo = htmlImprevisto(s);
    else if (s.fase === "fine") { const f = R.fermateSuperate(s), p = PremiModalita.notte(f);
      corpo = `<div class="notte-riquadro fine-notte ${s.finita === "alba" ? "alba" : ""}"><h3>${s.finita === "alba" ? "🌅 Sei arrivato all'alba!" : s.finita === "abbandonata" ? "Sei tornato a casa prima" : "La notte finisce qui"}</h3>
        <p>Fermate superate: <b>${f}</b> di ${R.FERMATE} · battaglie vinte: ${s.vinte}</p>
        <p class="notte-premio-fine">${S.admin ? "Da admin non ci sono premi." : esc(testoPremio(p))}</p>
        <button class="btn oro" data-fx="coriandoli" data-azione="notte-riscuoti">${S.admin ? "Chiudi" : "Riscuoti e torna a casa"}</button></div>`; }
    return `<section class="modo notte">
      <div class="titolo-riga"><h2>🌙 La Lunga Notte</h2><span class="modo-tasti"><button class="btn piccolo" data-azione="notte-regole">Come si gioca</button>${s.fase !== "fine" && s.fase !== "partenza" ? `<button class="btn piccolo" data-azione="notte-abbandona">Torna a casa</button>` : ""}</span></div>
      ${s.fase !== "partenza" ? htmlStrada(s) : ""}
      ${s.squadra ? `<div class="notte-stato"><span class="gettoni">🪙 <b>${s.gettoni}</b> gettoni</span><span class="cimeli">${Object.keys(s.cimeli).map(htmlCim).join("") || `<small class="nota">Ancora nessun cimelio</small>`}</span></div>${s.fase === "lascia" ? "" : htmlSquadra(s)}` : ""}
      ${corpo}</section>`;
  }
  function htmlImprevisto(s) {
    const sc = SCENE[s.tappa.scena], b = (az, ico, tit, sotto, off) => `<button type="button" class="notte-premio" data-notte-imp="${az}" ${off ? "disabled" : ""}><span class="np-ico">${ico}</span><b>${tit}</b><small>${sotto}</small></button>`;
    const pieno = s.squadra.length >= R.MAX_SQ;
    const opz = {
      buttafuori: [b("paga", "🪙", "Paghi 40 gettoni", "e prendi il cimelio", s.gettoni < 40), b("forza", "💥", "Passi con la forza", "una carta perde il 35% dei PV, ma il cimelio è tuo"), b("via", "🚶", "Cambi strada", "non succede niente")],
      "tre-carte": [b("gioca", "🃏", "Scommetti 50 gettoni", "50% di raddoppiarli, 50% di perderli", s.gettoni < 50), b("via", "🚶", "Lasci perdere", "non succede niente")],
      amico: [b("carta", "🤝", "Ti presta una carta", pieno ? "la squadra è piena" : "una carta gratis", pieno), b("cura", "🍝", "Vi offre la cena", "+20% PV a tutti"), b("soldi", "💸", "Ti presta dei soldi", "+35 gettoni")],
      vicolo: [b("accetta", "🥊", "Accetti", "+3 livelli a tutti ma −25% PV"), b("via", "🚶", "Te ne vai", "non succede niente")],
      taxi: [b("uno", "🚑", "Cura il più malconcio", "torna al 100% dei PV"), b("tutti", "🩹", "Un controllo a tutti", "+15% PV a tutti")],
    }[s.tappa.scena];
    return `<div class="notte-riquadro"><h3>❓ ${esc(sc.tit)}</h3><p>${esc(sc.testo)}</p><div class="notte-premi">${opz.join("")}</div></div>`;
  }

  // ---------- azioni ----------
  // si passa alla fermata dopo: conta per missioni e sfide del pass; all'alba conta anche l'alba
  function avanzaN(s) {
    R.avanza(rng, s);
    if (S.admin) return;
    Missioni.evento("modo", { n: 1 }); SfidePass.evento({ t: "modo", n: 1, alba: s.finita === "alba" });
  }
  function scegliPartenza(i) { const s = st(); if (!s || s.fase !== "partenza") return; S.notte = R.nuova(rng, s.partenze[i]); salva(); disegna(); }
  function scegliBivio(i) {
    const s = st(); if (!s || s.fase !== "bivio" || !s.bivio[i]) return;
    const t = s.bivio[i]; s.tappa = t; s.bivio = null;
    if (t.nemici) { avviaBattaglia(t); return; }
    if (t.tipo === "mercatino") s.offerta = R.mercatino(rng, s);
    s.fase = t.tipo; salva(); disegna(); scrollTo(0, 0);
  }
  function avviaBattaglia(t) {
    const s = st();
    s.battaglia = { seme: Math.floor(Math.random() * 2 ** 31), log: [] };
    salva(); riprendi();
  }
  // avvia (o riprende dopo un F5) la battaglia della tappa: stesso seme e stesse mosse già fatte, così ricaricare
  // la pagina non dà una seconda possibilità
  function riprendi() {
    const s = st(); if (!s || !s.battaglia || B) return;
    const t = s.tappa, boss = t.tipo === "boss";
    const L = { id: "notte", nome: boss ? `Boss: ${PER_ID[t.nemici[0].id].nome}` : t.tipo === "banda" ? `Banda ${SERIE[t.serie].nome}` : "Rissa", abilita: R.abilita(s.fermata, boss),
      liv: [t.nemici[0].liv, t.nemici[0].liv], premio: 0, punti: 0, xp: 0, modo: Notte, seme: s.battaglia.seme, rigioca: s.battaglia.log,
      squadraMia: s.squadra.map(x => ({ id: x.id, liv: x.liv, lode: false, olo: false, ultra: false, asc: 0 })) };
    avviaSfida(L, null, t.nemici.map(x => ({ id: x.id, liv: x.liv, lode: false })), true);
  }
  // agganci usati da app.js durante la battaglia
  function prepara(Bt) {
    const s = st(); R.prepara(Bt, s, s.tappa);
    // i KO restano KO: se in campo c'è una carta KO, entra la prima viva
    const L0 = Bt.lati[0]; if (L0.squadra[L0.attivo] && L0.squadra[L0.attivo].pv <= 0) { const i = L0.squadra.findIndex(x => x.pv > 0); if (i >= 0) L0.attivo = i; }
  }
  function passo(e) { const s = st(); if (s && s.battaglia) { s.battaglia.log.push(e); salva(); } }
  let ultimoEsito = null;
  function chiudi() {
    const s = st(); if (!s) return;
    const vinto = B.vincitore === 0;
    s.battaglia = null;
    const scelte = R.dopoBattaglia(s, B, vinto, rng);
    if (vinto) { s.premio = scelte; s.fase = "premio"; }
    ultimoEsito = { vinto, boss: s.tappa && s.tappa.tipo === "boss", fermata: s.fermata };
    salva(); aggiornaBattaglia();
  }
  function htmlFine() {
    const e = ultimoEsito || { vinto: B.vincitore === 0 };
    return `<div class="fine ${e.vinto ? "vinto" : "perso"}"><b>${e.vinto ? (e.boss ? "Boss battuto!" : "Vittoria!") : "Sconfitta: la notte finisce"}</b>
      <span>${e.vinto ? "Tutti recuperano un po' di PV e salgono di 1 livello. Chi era KO torna in piedi." : "Torni a casa e incassi in base alle fermate superate."}</span>
      <div class="azioni centro"><button class="btn primario" data-fx="onda" data-azione="esci-battaglia">${e.vinto ? "Scegli il premio" : "Vedi il premio"}</button></div></div>`;
  }
  function scegliPremio(i) {
    const s = st(); if (!s || s.fase !== "premio") return; const x = s.premio[i]; if (!x) return;
    if (x.cimelio) { s.cimeli[x.cimelio] = (s.cimeli[x.cimelio] || 0) + 1; avanzaN(s); }
    else if (!R.prendiCarta(s, x.carta, x.liv)) { s.lascia = { carta: x.carta, liv: x.liv, torna: "premio" }; s.fase = "lascia"; }
    else avanzaN(s);
    salva(); disegna(); scrollTo(0, 0);
  }
  function lascia(i) {
    const s = st(); if (!s || s.fase !== "lascia") return;
    const l = s.lascia; R.prendiCarta(s, l.carta, l.liv, i);
    if (l.prezzo) { s.gettoni -= l.prezzo; s.offerta.comprati.push(l.chiave); s.fase = "mercatino"; }
    else if (l.torna === "imprevisto") avanzaN(s);
    else avanzaN(s);
    s.lascia = null; salva(); disegna();
  }
  function annullaLascia() { const s = st(); if (!s || s.fase !== "lascia") return; s.fase = s.lascia.torna; s.lascia = null; salva(); disegna(); }
  function compra(cosa, i) {
    const s = st(); if (!s || s.fase !== "mercatino") return; const m = s.offerta;
    const paga = (prezzo, chiave, fai) => { if (m.comprati.includes(chiave)) return; if (s.gettoni < prezzo) { mostraAvviso("Non hai abbastanza gettoni."); return; } if (fai() === false) return; s.gettoni -= prezzo; m.comprati.push(chiave); salva(); disegna(); };
    if (cosa === "carta") { const x = m.carte[i]; if (!x || m.comprati.includes("c" + i)) return; if (s.gettoni < x.prezzo) { mostraAvviso("Non hai abbastanza gettoni."); return; }
      if (!R.prendiCarta(s, x.id, x.liv)) { s.lascia = { carta: x.id, liv: x.liv, prezzo: x.prezzo, chiave: "c" + i, torna: "mercatino" }; s.fase = "lascia"; salva(); disegna(); return; }
      s.gettoni -= x.prezzo; m.comprati.push("c" + i); salva(); disegna(); return; }
    if (cosa === "cim") { const x = m.cimeli[i]; if (x) paga(x.prezzo, "m" + i, () => { s.cimeli[x.id] = 1; }); return; }
    if (cosa === "cura") paga(m.cura, "cura", () => R.curaTutti(s, .3));
    if (cosa === "livello") paga(m.livello, "livello", () => R.livelliTutti(s, 1));
  }
  function bar(cosa) { const s = st(); if (!s || s.fase !== "bar") return; if (cosa === "riposo") R.curaTutti(s, .4); else R.livelliTutti(s, 2); avanzaN(s); salva(); disegna(); scrollTo(0, 0); }
  function imprevisto(az) {
    const s = st(); if (!s || s.fase !== "imprevisto") return; const sc = s.tappa.scena;
    const cimCaso = () => { const c = R.mescola(Math.random, Object.keys(CIMELI).filter(id => !s.cimeli[id] && CIMELI[id].solo !== "scalata"))[0]; if (c) { s.cimeli[c] = 1; return CIMELI[c].nome; } return ""; };
    let msg = "";
    if (sc === "buttafuori" && az === "paga") { if (s.gettoni < 40) return; s.gettoni -= 40; msg = `Hai preso: ${cimCaso()}.`; }
    else if (sc === "buttafuori" && az === "forza") { const vivi = s.squadra.filter(x => x.pv > 0), x = R.pesca(Math.random, vivi.length ? vivi : s.squadra); x.pv = Math.max(.01, x.pv - .35); msg = `${PER_ID[x.id].nome} si fa male, ma il cimelio è tuo: ${cimCaso()}.`; }
    else if (sc === "tre-carte" && az === "gioca") { if (s.gettoni < 50) return; const v = Math.random() < .5; s.gettoni += v ? 50 : -50; msg = v ? "Hai trovato la regina: +50 gettoni!" : "Niente regina: −50 gettoni."; }
    else if (sc === "amico" && az === "carta") { const r = NotteRegole.rarita(Math.random, s.fermata), pool = CARTE.filter(c => c.rarita === r && !SERIE[c.serie].jolly && !s.squadra.some(x => x.id === c.id));
      const c = R.pesca(Math.random, pool); if (!R.prendiCarta(s, c.id, R.livMedio(s))) return; msg = `${c.nome} si unisce a te!`; }
    else if (sc === "amico" && az === "cura") { R.curaTutti(s, .2); msg = "+20% PV a tutti."; }
    else if (sc === "amico" && az === "soldi") { s.gettoni += 35; msg = "+35 gettoni."; }
    else if (sc === "vicolo" && az === "accetta") { R.livelliTutti(s, 3); s.squadra.forEach(x => { if (x.pv > 0) x.pv = Math.max(.01, x.pv - .25); }); msg = "+3 livelli a tutti, ma che botte."; }
    else if (sc === "taxi" && az === "uno") { const x = s.squadra.reduce((a, b) => (b.pv < a.pv ? b : a)); x.pv = 1; msg = `${PER_ID[x.id].nome} torna come nuovo.`; }
    else if (sc === "taxi" && az === "tutti") { R.curaTutti(s, .15); msg = "+15% PV a tutti."; }
    avanzaN(s); salva(); disegna(); scrollTo(0, 0);
    if (msg) mostraAvviso(msg);
  }
  function salta() { const s = st(); if (!s || s.fase !== "premio") return; avanzaN(s); salva(); disegna(); }
  function avanti() { const s = st(); if (!s || s.fase !== "mercatino") return; avanzaN(s); salva(); disegna(); scrollTo(0, 0); }
  function abbandona(el) {
    const s = st(); if (!s) return;
    if (!el.dataset.sicuro) { el.dataset.sicuro = "1"; el.textContent = "Sicuro? Tocca di nuovo"; return; }
    s.fase = "fine"; s.finita = "abbandonata"; s.battaglia = null; salva(); disegna();
  }
  function riscuoti(el) {
    const s = st(); if (!s || s.fase !== "fine") return;
    const f = R.fermateSuperate(s), p = PremiModalita.notte(f);
    if (!S.admin) { daiPremio(p); aggiungiXP(ridXP(PremiModalita.XP_BATTAGLIA * (s.vinte || 0))); S.stats.notti = (S.stats.notti || 0) + 1; S.stats.notteMax = Math.max(S.stats.notteMax || 0, f);
      if (s.finita === "alba") S.stats.albe = (S.stats.albe || 0) + 1; Trofei.controlla(); }
    S.notte = null; salva(); aggiornaTesta(); vai("sfida");
    if (!S.admin) mostraAvviso(`La Lunga Notte (${f} fermate): ${testoPremio(p)}!`);
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 60, forma: "stella", colori: ["#f2c14e", "#9a6aff", "#ffffff"], velocita: 8, dimensione: 6 }); }
  }
  function regole() {
    const R2 = PremiModalita, righe = [0, 2, 4, 5, 7, 9, 10].map(f => `<tr><td>${f === 10 ? "🌅 Alba" : f + (f === 1 ? " fermata" : " fermate")}</td><td>${esc(testoPremio(R2.notte(f)))}</td></tr>`).join("");
    apriModale(`<div class="modo-regole"><span class="codice-tag">🌙 La Lunga Notte</span><h2>Come si gioca</h2>
      <ol>
        <li><b>Scegli con chi esci.</b> Tre partenze diverse, tutte al livello ${R.LIV0}. Le carte della tua collezione qui non contano: sono quelle che trovi per strada e restano solo per questa notte.</li>
        <li><b>Dieci fermate fino all'alba.</b> A ogni bivio scegli la strada: 👊 rissa, 🧢 banda rivale (tutti della stessa serie), 🍻 bar (riposi o ti alleni), 🛍️ mercatino, ❓ imprevisto. Alle fermate 5 e 10 c'è un 💀 boss.</li>
        <li><b>I PV restano.</b> Quello che perdi in una battaglia te lo porti alla successiva. Dopo ogni vittoria tutti recuperano il 20% e salgono di 1 livello; chi era KO torna con il 40%.</li>
        <li><b>Gettoni, carte e cimeli.</b> Vincendo guadagni gettoni (si spendono al mercatino) e scegli un premio: una carta nuova o un cimelio. La squadra ha al massimo 5 carte.</li>
        <li><b>Se perdi, la notte finisce.</b> Puoi anche tornare a casa quando vuoi. Il premio dipende dalle fermate superate.</li>
      </ol>
      <h3>I cimeli</h3><div class="regole-cimeli">${Object.entries(CIMELI).filter(([, c]) => c.solo !== "scalata").map(([, c]) => `<div><span>${c.ico}</span><b>${esc(c.nome)}</b><small>${esc(c.desc)}</small></div>`).join("")}</div>
      <h3>I premi</h3><p class="nota">Ingresso ${R2.INGRESSO_NOTTE} monete. Più vai lontano più prendi, con un salto dopo il primo boss e all'alba.</p>
      <table class="regole-premi"><tbody>${righe}</tbody></table>
      <div class="azioni centro"><button class="btn primario" data-azione="chiudi">Ho capito</button></div></div>`);
  }
  function infoCimelio(id) { const c = CIMELI[id]; if (c) mostraAvviso(`${c.ico} ${c.nome}: ${c.desc}.`); }
  function infoCarta(i) { const s = st(), x = s && s.squadra[i]; if (x) apriSchedaCarta({ id: x.id, liv: x.liv }); }

  return { vista: "notte", htmlSfida, entra, regole, html: vista, scegliPartenza, scegliBivio, riprendi, prepara, passo, chiudi, htmlFine, scegliPremio, lascia, annullaLascia, compra, bar, imprevisto, salta, avanti, abbandona, riscuoti, infoCimelio, infoCarta, stato: st };
})();
