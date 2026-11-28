// ============================================================
//  EXTRA (nov 2026): maestria delle carte, Arena, gradi della stagione, vetrina e statistiche,
//  frammenti, offerte speciali del negozio e cosmetici.
// ============================================================

const attivoExtra = () => typeof S !== "undefined" && S && !S.admin && S.profilo && S.profilo.nome;
const num = x => Number(x) || 0;

// ---------------- Cosmetici ----------------
// Non cambiano la forza: cornici per l'avatar, colore del nome, sfondo della vetrina. Si vedono anche in classifica.
const Cosmetici = (() => {
  const CAT = {
    // cornici dell'avatar
    "cornice-neon":      { tipo: "cornice", nome: "Cornice Neon", prezzo: 800 },
    "cornice-fiamme":    { tipo: "cornice", nome: "Cornice di Fiamme", prezzo: 1200 },
    "cornice-ghiaccio":  { tipo: "cornice", nome: "Cornice di Ghiaccio", prezzo: 1200 },
    "cornice-oro":       { tipo: "cornice", nome: "Cornice d'Oro", da: "Livello giocatore 30" },
    "cornice-arcobaleno":{ tipo: "cornice", nome: "Cornice Arcobaleno", da: "Livello giocatore 50" },
    "cornice-numero1":   { tipo: "cornice", nome: "Cornice del Numero Uno", da: "Livello giocatore 100" },
    "cornice-maestro":   { tipo: "cornice", nome: "Cornice del Maestro (vecchia)", da: "Non si sblocca più: ora la maestria dà la cornice alla carta" },
    "cornice-diamante":  { tipo: "cornice", nome: "Cornice Diamante", da: "Grado Diamante in una stagione" },
    "cornice-leggenda":  { tipo: "cornice", nome: "Cornice Leggenda", da: "Grado Leggenda in una stagione" },
    "cornice-neve":      { tipo: "cornice", nome: "Cornice di Neve", da: "Calendario dell'Avvento (8 dicembre)" },
    // colore del nome
    "nome-neon":         { tipo: "nome", nome: "Nome Neon", prezzo: 900 },
    "nome-dorato":       { tipo: "nome", nome: "Nome Dorato", prezzo: 1500 },
    "nome-fuoco":        { tipo: "nome", nome: "Nome di Fuoco", da: "Livello giocatore 40" },
    "nome-arcobaleno":   { tipo: "nome", nome: "Nome Arcobaleno", da: "Livello giocatore 70" },
    "nome-arena":        { tipo: "nome", nome: "Nome del Campione d'Arena", da: "7 vittorie nell'Arena" },
    "nome-natale":       { tipo: "nome", nome: "Nome Natalizio", da: "Calendario dell'Avvento (14 dicembre)" },
    // sfondo della vetrina
    "sfondo-tramonto":   { tipo: "sfondo", nome: "Sfondo Tramonto", prezzo: 600 },
    "sfondo-citta":      { tipo: "sfondo", nome: "Sfondo Città di Notte", prezzo: 600 },
    "sfondo-galassia":   { tipo: "sfondo", nome: "Sfondo Galassia", prezzo: 1000 },
    "sfondo-oro":        { tipo: "sfondo", nome: "Sfondo d'Oro", da: "Livello giocatore 60" },
    "sfondo-noiverso":   { tipo: "sfondo", nome: "Sfondo Noiverso", da: "Livello giocatore 90" },
    "sfondo-natale":     { tipo: "sfondo", nome: "Sfondo Notte di Natale", da: "Calendario dell'Avvento (21 dicembre)" },
    // cornici delle carte: una volta sbloccate si mettono su tutte le carte che vuoi (dal dettaglio della carta)
    "cc-neon":           { tipo: "carta", nome: "Cornice carta Neon", prezzo: 700 },
    "cc-ghiaccio":       { tipo: "carta", nome: "Cornice carta di Ghiaccio", prezzo: 1000 },
    "cc-sakura":         { tipo: "carta", nome: "Cornice carta Sakura", prezzo: 1200 },
    "cc-oro":            { tipo: "carta", nome: "Cornice carta d'Oro", prezzo: 1600 },
    // nov 2026: tante cornici nuove nel negozio (Cosmetici.htmlNegozio)
    "cc-legno":          { tipo: "carta", nome: "Cornice carta di Legno", prezzo: 500, desc: "Legno scuro con i chiodini agli angoli." },
    "cc-argento":        { tipo: "carta", nome: "Cornice carta d'Argento", prezzo: 800, desc: "Argento lucidato che luccica." },
    "cc-caramella":      { tipo: "carta", nome: "Cornice carta Caramella", prezzo: 900, desc: "Strisce bianche e rosse che girano." },
    "cc-pixel":          { tipo: "carta", nome: "Cornice carta Pixel", prezzo: 1000, desc: "A scacchi come un videogioco a 8 bit." },
    "cc-smeraldo":       { tipo: "carta", nome: "Cornice carta Smeraldo", prezzo: 1100, desc: "Verde gemma, con due smeraldi incastonati." },
    "cc-rubino":         { tipo: "carta", nome: "Cornice carta Rubino", prezzo: 1100, desc: "Rosso gemma, con due rubini incastonati." },
    "cc-zaffiro":        { tipo: "carta", nome: "Cornice carta Zaffiro", prezzo: 1100, desc: "Blu gemma, con due zaffiri incastonati." },
    "cc-veleno":         { tipo: "carta", nome: "Cornice carta Veleno", prezzo: 1200, desc: "Verde tossico che cola dall'alto." },
    "cc-oceano":         { tipo: "carta", nome: "Cornice carta Oceano", prezzo: 1300, desc: "Onde che scorrono tutto intorno." },
    "cc-notte":          { tipo: "carta", nome: "Cornice carta Notte stellata", prezzo: 1300, desc: "Blu notte con le stelline che brillano." },
    "cc-lava":           { tipo: "carta", nome: "Cornice carta di Lava", prezzo: 1400, desc: "Roccia scura e lava che pulsa." },
    "cc-tempesta":       { tipo: "carta", nome: "Cornice carta Tempesta", prezzo: 1500, desc: "Scariche elettriche e fulmini agli angoli." },
    "cc-ombra":          { tipo: "carta", nome: "Cornice carta Ombra", prezzo: 1700, desc: "Fumo viola e nero che respira." },
    "cc-aurora":         { tipo: "carta", nome: "Cornice carta Aurora boreale", prezzo: 2000, desc: "Verde e viola che girano come l'aurora." },
    "cc-prisma":         { tipo: "carta", nome: "Cornice carta Prisma", prezzo: 2400, desc: "Arcobaleno che gira e un riflesso che attraversa la carta." },
    "cc-reale":          { tipo: "carta", nome: "Cornice carta Reale", prezzo: 3000, desc: "Velluto viola, filo d'oro e la corona in cima." },
    "cc-natale":         { tipo: "carta", nome: "Cornice carta di Natale", da: "Calendario dell'Avvento (24 dicembre)" },
    "cc-leggenda":       { tipo: "carta", nome: "Cornice carta Leggenda", da: "Storia · Livello Leggenda (boss finale)", desc: "Oro e porpora, con la corona: per chi ha finito il Livello Leggenda." },
    "cc-fiamme":         { tipo: "carta", nome: "Cornice carta di Fiamme", da: "Livello giocatore 35" },
    "cc-galassia":       { tipo: "carta", nome: "Cornice carta Galassia", da: "Livello giocatore 55" },
    "cc-arcobaleno":     { tipo: "carta", nome: "Cornice carta Arcobaleno", da: "Livello giocatore 80" },
    "cc-diamante":       { tipo: "carta", nome: "Cornice carta Diamante", da: "Grado Platino in una stagione" },
  };
  // la Cornice del Maestro è unica: non si compra e non si trova, la ha solo la carta con 5 stelle di maestria
  const MAESTRO = "cc-maestro";
  const NOMI_CARTA = Object.assign({ [MAESTRO]: "Cornice del Maestro" }, Object.fromEntries(Object.entries(CAT).filter(([, v]) => v.tipo === "carta").map(([k, v]) => [k, v.nome.replace(/^Cornice carta (d'|di )?/, "").replace(/^./, x => x.toUpperCase())])));
  const TIPI = { cornice: "Cornice dell'avatar", nome: "Colore del nome", sfondo: "Sfondo della vetrina" };
  const stato = () => { if (!S.cosm || typeof S.cosm !== "object") S.cosm = { have: {}, cornice: "", nome: "", sfondo: "" }; return S.cosm; };
  const ha = id => !!stato().have[id];
  function sblocca(id, avvisa = true) {
    if (!CAT[id] || ha(id)) return false;
    const s = stato(); S.cosm = Object.assign({}, s, { have: Object.assign({}, s.have, { [id]: true }) });
    if (CAT[id].tipo !== "carta" && !S.cosm[CAT[id].tipo]) S.cosm[CAT[id].tipo] = id;   // il primo di un tipo si mette da solo
    if (avvisa) setTimeout(() => mostraAvviso(CAT[id].tipo === "carta" ? `Nuova ${CAT[id].nome}! La metti dal dettaglio di ogni carta.` : `Nuovo cosmetico: ${CAT[id].nome}! Lo trovi nel profilo.`), 900);
    return true;
  }
  function usa(tipo, id) { const s = stato(); if (id && (!ha(id) || CAT[id].tipo !== tipo)) return; S.cosm = Object.assign({}, s, { [tipo]: id || "" }); salva(); Archivio.pubblicaClassifica(); aggiornaTesta(); }
  // classi CSS (anche per gli altri giocatori, dai dati della classifica)
  const classeCornice = id => CAT[id] && CAT[id].tipo === "cornice" ? `cosm-${id}` : "";
  const classeNome = id => CAT[id] && CAT[id].tipo === "nome" ? `cosm-${id}` : "";
  const classeSfondo = id => CAT[id] && CAT[id].tipo === "sfondo" ? `cosm-${id}` : "";
  // cornice di una carta (solo se valida: quella del Maestro solo con 5 stelle su quella carta)
  const valida = (cartaId, cc) => cc === MAESTRO ? typeof Maestria !== "undefined" && Maestria.stelle(cartaId) >= 5 : !!(CAT[cc] && CAT[cc].tipo === "carta" && ha(cc));
  function corniceCarta(cartaId) { const cc = (stato().carte || {})[cartaId]; return cc && valida(cartaId, cc) ? cc : ""; }
  function usaCarta(cartaId, cc) {
    if (cc && !valida(cartaId, cc)) return;
    const s = stato(), carte = Object.assign({}, s.carte); if (cc) carte[cartaId] = cc; else delete carte[cartaId];
    S.cosm = Object.assign({}, s, { carte }); salva(); apriDettaglio(cartaId); disegnaQuieto();
  }
  // il "telaio" sopra l'immagine della carta (anche per le carte degli amici, con la loro cornice)
  const htmlTelaio = cc => cc && NOMI_CARTA[cc] ? `<i class="cc-telaio ${cc}" aria-hidden="true"></i>${cc === MAESTRO ? `<i class="cc-deco" aria-hidden="true"><b>★</b><b>★</b><b>★</b><b>★</b><span>MAESTRO</span></i>` : `<i class="cc-orn ${cc}" aria-hidden="true"></i>`}` : "";
  function htmlSceltaCarta(cartaId) {
    if (S.admin || !S.carte[cartaId]) return "";
    const attuale = corniceCarta(cartaId), maestro = valida(cartaId, MAESTRO);
    const mie = Object.keys(CAT).filter(id => CAT[id].tipo === "carta" && ha(id));
    return `<div class="cc-scelta"><b>Cornice della carta</b><div class="filtri">
      <button class="chip" data-cc-usa="${cartaId}:" aria-pressed="${!attuale}">Nessuna</button>
      ${maestro ? `<button class="chip cc-chip-maestro" data-cc-usa="${cartaId}:${MAESTRO}" aria-pressed="${attuale === MAESTRO}">★ Maestro</button>` : ""}
      ${mie.map(id => `<button class="chip" data-cc-usa="${cartaId}:${id}" aria-pressed="${attuale === id}">${esc(NOMI_CARTA[id])}</button>`).join("")}</div>
      <p class="nota">${maestro ? "La Cornice del Maestro è solo di questa carta: l'ha guadagnata con 5 stelle di maestria." : "La Cornice del Maestro si sblocca solo per la carta che arriva a 5 stelle di maestria."}${mie.length ? "" : " Le altre cornici si trovano nel negozio e salendo di livello."}</p></div>`;
  }
  // ---- negozio: tutte le cornici delle carte (e gli altri cosmetici in vendita), sempre lì ----
  function compra(id, el) {
    const x = CAT[id]; if (!attivoExtra() || !x || !x.prezzo || ha(id) || S.monete < x.prezzo) return;
    S.monete -= x.prezzo; sblocca(id, false); salva(); aggiornaTesta(); Archivio.pubblicaClassifica(); disegna();
    if (el) { const [px, py] = FX.centro(el); FX.esplosione(px, py, { n: 40, forma: "moneta", colori: ["#f2c14e", "#fff3c4"], velocita: 7, dimensione: 6 }); }
    mostraAvviso(x.tipo === "carta" ? `Comprata: ${x.nome}! La metti dal dettaglio di ogni carta.` : `Comprato: ${x.nome}! Lo metti dal tuo profilo.`);
  }
  function htmlNegozio() {
    if (!attivoExtra()) return "";
    const sq = squadraAttiva().carte.filter(Boolean), prova = PER_ID[sq[0]] || possedute()[0] || CARTE[0];
    const carte = Object.keys(CAT).filter(id => CAT[id].tipo === "carta"), inVendita = carte.filter(id => CAT[id].prezzo).sort((a, b) => CAT[a].prezzo - CAT[b].prezzo), altre = carte.filter(id => !CAT[id].prezzo);
    const bottone = id => ha(id) ? `<span class="cc-tua">✓ Già tua</span>` : `<button class="btn primario" data-fx="monete" data-cosm-compra="${id}" ${S.monete >= CAT[id].prezzo ? "" : "disabled"}>${CAT[id].prezzo} <i class="moneta-ico"></i></button>`;
    const profilo = Object.keys(CAT).filter(id => CAT[id].prezzo && CAT[id].tipo !== "carta");
    const anteprima = id => CAT[id].tipo === "cornice" ? avatar(S.profilo.avatar, id, "grande") : CAT[id].tipo === "nome" ? `<b class="cosm-prova-nome ${classeNome(id)}">${esc(S.profilo.nome || "Nome")}</b>` : `<i class="cosm-prova-sfondo ${classeSfondo(id)}"></i>`;
    return `<div class="titolo-riga piccola"><h3>Cornici delle carte</h3><p class="nota">Le compri una volta e le metti su tutte le carte che vuoi, dal dettaglio della carta. Le vedono anche gli amici, in classifica e in battaglia. Non cambiano la forza.</p></div>
      <div class="vetrina cc-vetrina">${inVendita.map(id => `<div class="prodotto cc-prodotto ${ha(id) ? "cc-mia" : ""}">
          ${htmlCarta(prova, { piccola: true, cc: id })}
          <b>${esc(NOMI_CARTA[id])}</b><span class="nota">${esc(CAT[id].desc || "")}</span>
          <div class="prodotto-prezzi">${bottone(id)}</div></div>`).join("")}</div>
      <details class="cc-altre"><summary>Cornici che non si comprano (${altre.length + 1})</summary><div class="vetrina cc-vetrina">
        ${altre.map(id => `<div class="prodotto cc-prodotto ${ha(id) ? "cc-mia" : "cc-chiusa"}">${htmlCarta(prova, { piccola: true, cc: id })}<b>${esc(NOMI_CARTA[id])}</b><span class="nota">${ha(id) ? "✓ Già tua" : "🔒 " + esc(CAT[id].da)}</span></div>`).join("")}
        <div class="prodotto cc-prodotto cc-chiusa">${htmlCarta(prova, { piccola: true, cc: MAESTRO })}<b>Maestro</b><span class="nota">🔒 Solo sulla carta che arriva a 5 stelle di maestria (una per carta)</span></div>
      </div></details>
      <div class="titolo-riga piccola"><h3>Per il tuo profilo</h3><p class="nota">Cornice dell'avatar, colore del nome e sfondo della vetrina: li scegli dal tuo profilo e li vedono tutti in classifica.</p></div>
      <div class="vetrina cosm-vetrina">${profilo.map(id => `<div class="prodotto cosm-prodotto ${ha(id) ? "cc-mia" : ""}">
          <div class="cosm-prova">${anteprima(id)}</div><b>${esc(CAT[id].nome)}</b><span class="nota">${TIPI[CAT[id].tipo]}</span>
          <div class="prodotto-prezzi">${bottone(id)}</div></div>`).join("")}</div>`;
  }
  const avatar = (avatarId, corniceId, cls = "") => `<span class="cornice-avatar ${classeCornice(corniceId)}">${htmlAvatar(avatarId, cls)}</span>`;
  function htmlProfilo() {
    const s = stato();
    return Object.entries(TIPI).map(([tipo, nomeTipo]) => {
      const miei = Object.keys(CAT).filter(id => CAT[id].tipo === tipo && ha(id));
      return `<div class="cosm-riga"><b>${nomeTipo}</b><div class="filtri">
        <button class="chip" data-cosm-usa="${tipo}:" aria-pressed="${!s[tipo]}">Nessuno</button>
        ${miei.map(id => `<button class="chip cosm-chip" data-cosm-usa="${tipo}:${id}" aria-pressed="${s[tipo] === id}">${tipo === "nome" ? `<span class="${classeNome(id)}">${esc(CAT[id].nome)}</span>` : esc(CAT[id].nome)}</button>`).join("")}
        ${miei.length ? "" : `<span class="nota">Ancora nessuno: si trovano nel negozio, con i livelli, i gradi e l'Arena.</span>`}</div></div>`;
    }).join("") + (() => { const n = Object.keys(CAT).filter(id => CAT[id].tipo === "carta" && ha(id)).length, m = possedute().filter(c => Maestria.stelle(c.id) >= 5).length;
      return `<div class="cosm-riga"><b>Cornici delle carte</b><p class="nota">Ne hai ${n}${m ? `, più ${m} ${m === 1 ? "Cornice del Maestro" : "Cornici del Maestro"} (una per ogni carta con 5 stelle)` : ""}. Si mettono dal dettaglio di ogni carta.</p></div>`; })();
  }
  return { CAT, MAESTRO, compra, htmlNegozio, corniceCarta, usaCarta, htmlTelaio, htmlSceltaCarta, ha, sblocca, usa, stato, classeCornice, classeNome, classeSfondo, avatar, htmlProfilo };
})();

// ---------------- Maestria delle carte ----------------
// Ogni carta ha 5 obiettivi suoi. Ogni obiettivo raggiunto è una stella: monete, potenziatori, punti Fama e, alla quinta, la Cornice del Maestro per quella carta.
const Maestria = (() => {
  const OBIETTIVI = [
    { k: "v", n: 3,    testo: "Vinci 3 battaglie con questa carta scesa in campo", monete: piuMonete(25),  pot: 5,  fama: 10 },
    { k: "d", n: 1500, testo: "Fai 1.500 danni con questa carta", monete: piuMonete(50), pot: 10, fama: 20 },
    { k: "o", n: 10,   testo: "Manda KO 10 carte nemiche con questa carta", monete: piuMonete(75), pot: 15, fama: 30 },
    { k: "f", n: 10,   testo: "Usa 10 volte la sua mossa finale", monete: piuMonete(100), pot: 20, fama: 40 },
    { k: "v", n: 25,   testo: "Vinci 25 battaglie con questa carta scesa in campo", monete: piuMonete(150), pot: 30, fama: 60, frammenti: 30 },
  ];
  const dati = id => (S.maestria && S.maestria[id]) || { v: 0, d: 0, o: 0, f: 0, presi: [] };
  const stelle = id => dati(id).presi.length;
  const totaleStelle = () => Object.values(S.maestria || {}).reduce((a, m) => a + ((m && m.presi) || []).length, 0);
  function fineBattaglia(vinto) {
    const L = typeof livelloAttuale !== "undefined" ? livelloAttuale : null;
    if (!attivoExtra() || !L || L.spettatore || !B) return;
    const avvisi = [];
    for (const x of B.lati[0].squadra) {
      if (!x.usata || !S.carte[x.id]) continue;
      const st = x.st || {}, m = Object.assign({ v: 0, d: 0, o: 0, f: 0, presi: [] }, dati(x.id));
      m.v += vinto ? 1 : 0; m.d += num(st.d); m.o += num(st.o); m.f += num(st.f);
      OBIETTIVI.forEach((ob, i) => {
        if (m.presi.includes(i) || m[ob.k] < ob.n) return;
        m.presi = m.presi.concat(i);
        // potenziatori per questa carta; se è già al 30 non servono più e valgono 5 monete l'uno
        const al30 = infoCarta(x.id).liv >= LIVELLO_MAX, extra = al30 ? ob.pot * 5 : 0;
        daiPremio({ monete: ob.monete + extra });
        if (!al30) S.pot = Object.assign({}, S.pot, { [x.id]: num((S.pot || {})[x.id]) + ob.pot });
        if (ob.frammenti) Frammenti.aggiungi(ob.frammenti, false);
        Livello.guadagna(ob.fama);
        avvisi.push(`Maestria ${PER_ID[x.id].nome} ${"★".repeat(m.presi.length)}: ${al30 ? `+${ob.monete + extra} monete (è già al 30)` : `+${ob.pot} potenziatori ▲ e +${ob.monete} monete`}${ob.frammenti ? ` e ${ob.frammenti} frammenti` : ""}`);
        if (m.presi.length >= OBIETTIVI.length) {   // quinta stella: la Cornice del Maestro, solo per questa carta (e la mette subito)
          const s = Cosmetici.stato(); S.cosm = Object.assign({}, s, { carte: Object.assign({}, s.carte, { [x.id]: Cosmetici.MAESTRO }) });
          avvisi.push(`${PER_ID[x.id].nome} ha 5 stelle: sblocca la Cornice del Maestro, solo sua!`);
        }
      });
      S.maestria = Object.assign({}, S.maestria, { [x.id]: m });
    }
    avvisi.slice(0, 3).forEach((t, i) => setTimeout(() => mostraAvviso(t), 2600 + i * 2200));
  }
  function htmlDettaglio(id) {
    if (!S.carte[id] || S.admin) return "";
    const m = dati(id);
    return `<div class="maestria-box"><b>Maestria ${"★".repeat(m.presi.length)}${"☆".repeat(OBIETTIVI.length - m.presi.length)}</b>
      <ul>${OBIETTIVI.map((ob, i) => { const v = Math.min(ob.n, m[ob.k]), ok = m.presi.includes(i);
        return `<li class="${ok ? "fatto" : ""}"><span>${ok ? "★" : "☆"} ${esc(ob.testo)}</span><small>${ok ? "fatto" : `${v.toLocaleString("it-IT")} / ${ob.n.toLocaleString("it-IT")}`} · +${ob.pot} ▲ e +${ob.monete} monete${ob.frammenti ? ` e ${ob.frammenti} ◈` : ""}</small></li>`; }).join("")}</ul>
      <p class="nota">Le stelle si prendono da sole giocando: contano le battaglie in cui questa carta è scesa in campo. Ogni stella dà potenziatori ▲ per questa carta (80 in tutto); se è già al 30 li ricevi in monete, 5 l'uno. Con 5 stelle questa carta sblocca la Cornice del Maestro, che è solo sua.</p></div>`;
  }
  return { OBIETTIVI, stelle, totaleStelle, fineBattaglia, htmlDettaglio };
})();

// ---------------- Frammenti ◈ ----------------
// Dosati: arrivano solo dai doppioni di carte già al 30 (oltre alle monete di sempre), dall'Arena e dalla maestria.
// Servono a creare una carta che NON hai ancora (non copie in più): così l'album si completa anche senza fortuna,
// ma resta un traguardo da giocatore che ha già tanto.
// Esempio: una bustina normale con tutte le carte al 30 dà in media circa 16 ◈; una leggendaria a scelta ne costa 1500 (circa 90 bustine).
const Frammenti = (() => {
  const DA_DOPPIONE = { comune: 2, rara: 4, epica: 10, leggendaria: 25, jolly: 12 };
  const COSTO = { comune: 100, rara: 250, epica: 600, leggendaria: 1500, jolly: 2000 };   // nov 2026: Jolly 900→2000 (non si comprano e nelle bustine sono rarissimi: i frammenti sono l'unica strada sicura)
  const quanti = () => num(S.framm);
  function aggiungi(n, avvisa = true) { if (!attivoExtra() || !(n > 0)) return; S.framm = quanti() + Math.round(n); if (avvisa) setTimeout(() => mostraAvviso(`+${n} frammenti ◈ (ne hai ${S.framm}).`), 1200); }
  function daEsiti(esiti) { const n = (esiti || []).reduce((a, e) => a + num(e.framm), 0); aggiungi(n); }
  function crea(id, el) {
    const c = PER_ID[id]; if (!c || S.carte[id] || !attivoExtra()) return;
    const costo = COSTO[c.rarita]; if (quanti() < costo) { mostraAvviso(`Servono ${costo} frammenti.`); return; }
    S.framm = quanti() - costo; S.carte[id] = 1; S.liv[id] = S.liv[id] || 1; S.stats.create = num(S.stats.create) + 1;
    Livello.carteNuove([{ id, nuova: true }]);
    salva(); aggiornaTesta(); Archivio.pubblicaClassifica();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 70, forma: "stella", colori: ["#9ad8ff", "#ffffff", "#c9a4ff"], velocita: 8, dimensione: 6 }); }
    mostraAvviso(`${c.nome} creata con ${costo} frammenti!`); apriDettaglio(id);
  }
  // carta coperta dell'album: resta una sorpresa (vedi solo rarità e serie) finché non la crei
  function apriMistero(id) {
    const c = PER_ID[id]; if (!c || S.carte[id] || S.admin) return;
    const costo = COSTO[c.rarita], ok = quanti() >= costo;
    apriModale(`<div class="crea-box grande"><div class="crea-carta">${htmlCarta(c, { coperta: true })}</div>
      <div><span class="codice-tag">${esc(SERIE[c.serie].simbolo)} ${esc(SERIE[c.serie].nome)}${SERIE[c.serie].nome === RARITA[c.rarita].nome ? "" : ` · ${esc(RARITA[c.rarita].nome)}`}</span><h2>Carta da scoprire</h2>
      <p>Puoi crearla con i <b>frammenti ◈</b>: costa <b>${costo}</b> e ne hai <b>${quanti()}</b>.</p>
      <p class="nota">I frammenti arrivano dai doppioni delle carte già al livello 30 (comune 2, rara 4, epica 10, leggendaria 25, jolly 12), dall'Arena e dalla maestria. Si possono usare solo per le carte che non hai ancora.</p>
      <div class="azioni"><button class="btn ${ok ? "oro" : ""}" data-fx="stelle" data-crea="${id}" ${ok ? "" : "disabled"}>${ok ? `Crea con ${costo} ◈` : `Ti mancano ${costo - quanti()} ◈`}</button><button class="btn" data-azione="chiudi">Chiudi</button></div></div></div>`);
  }
  // toccando ◈ in alto: quanti ne hai, come si prendono e quanto costa ogni carta
  function apriInfo() {
    const q = quanti(), mancano = CARTE.filter(c => !S.carte[c.id]), creabili = mancano.filter(c => q >= COSTO[c.rarita]).length;
    apriModale(`<div class="framm-info"><div class="fi-ico">◈</div><h2>${q.toLocaleString("it-IT")} frammenti</h2>
      <p>Servono a <b>creare le carte che ti mancano</b>: nell'album tocca una carta coperta. Su ognuna c'è scritto quanti frammenti costa.</p>
      <table class="fi-tab"><thead><tr><th>Rarità</th><th>Costa</th><th>Doppione al 30 dà</th></tr></thead><tbody>
        ${[...ORDINE_RARITA, "jolly"].map(r => `<tr><td>${esc(RARITA[r].nome)}</td><td><b>◈ ${COSTO[r].toLocaleString("it-IT")}</b></td><td>+${DA_DOPPIONE[r]} ◈</td></tr>`).join("")}</tbody></table>
      <p class="nota">Arrivano dai doppioni delle carte già al livello 30, dall'Arena, dalla Lunga Notte, dalla Scalata, dalla Leggenda e dalla quinta stella di maestria. Ti mancano ${mancano.length} carte${creabili ? `: <b>${creabili}</b> le puoi già creare` : ""}.</p>
      <div class="fi-cambio"><h3>Cambia in potenziatori universali ✪</h3>
        <p class="nota">Ogni <b>${PER_CAMBIO} ◈</b> diventano <b>1 ✪</b>, che vale come un potenziatore per <b>qualsiasi</b> carta. Utile se ti mancano poche carte e i frammenti avanzano.</p>
        <div class="azioni centro">${[1, 5, 25].map(n => `<button class="btn piccolo ${q >= n * PER_CAMBIO ? "oro" : ""}" data-fx="stelle" data-azione="framm-cambia" data-n="${n}" ${q >= n * PER_CAMBIO ? "" : "disabled"}>${n} ✪ · ${(n * PER_CAMBIO).toLocaleString("it-IT")} ◈</button>`).join("")}
          ${Math.floor(q / PER_CAMBIO) > 25 ? `<button class="btn piccolo oro" data-fx="stelle" data-azione="framm-cambia" data-n="${Math.floor(q / PER_CAMBIO)}">Tutti: ${Math.floor(q / PER_CAMBIO)} ✪</button>` : ""}</div></div>
      <div class="azioni centro"><button class="btn primario" data-azione="vai-album">Vai all'album</button><button class="btn" data-azione="chiudi">Chiudi</button></div></div>`);
  }
  // nov 2026: frammenti → potenziatori universali ✪ (20 a 1). Esempio: 500 ◈ diventano 25 ✪.
  const PER_CAMBIO = 20;
  function cambia(n, el) {
    n = Math.max(1, Math.floor(+n || 0));
    if (!attivoExtra() || S.admin) return;
    if (quanti() < n * PER_CAMBIO) { mostraAvviso(`Servono ${n * PER_CAMBIO} frammenti.`); return; }
    S.framm = quanti() - n * PER_CAMBIO; S.jolly = Math.max(0, Math.floor(S.jolly || 0)) + n;
    salva(); aggiornaTesta();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 40, forma: "stella", colori: ["#c9a4ff", "#ffffff", "#9ad8ff"], velocita: 6, dimensione: 5 }); }
    mostraAvviso(`${n * PER_CAMBIO} ◈ → ${n} potenziatori universali ✪ (ora ne hai ${S.jolly}).`); apriInfo();
  }
  return { DA_DOPPIONE, COSTO, quanti, aggiungi, daEsiti, crea, apriMistero, apriInfo, cambia, PER_CAMBIO };
})();

// ---------------- Statistiche e vetrina ----------------
const Vetrina = (() => {
  // dopo ogni battaglia: quante volte usi ogni carta e le ultime 10 partite
  function fineBattaglia(vinto) {
    const L = typeof livelloAttuale !== "undefined" ? livelloAttuale : null;
    if (!attivoExtra() || !L || L.spettatore || !B) return;
    const usate = B.lati[0].squadra.filter(x => x.usata).map(x => x.id);
    if (!L.arena) { const usi = Object.assign({}, S.usi); for (const id of usate) usi[id] = num(usi[id]) + 1; S.usi = usi; }   // in Arena le carte non sono tue
    const tipo = L.storia ? "Storia" : L.vivo ? "Dal vivo" : L.amico ? "Amico" : L.bossGruppo ? "Boss di gruppo" : L.bossGiorno ? "Boss del giorno" : L.settimana ? "Settimana" : L.arena ? "Arena" : "Computer";
    const voce = { t: Date.now(), tipo, nome: String(L.nome || "").replace(/^Arena · /, "").slice(0, 40), vinto: !!vinto, sq: B.lati[0].squadra.map(x => x.id) };
    S.storico = [voce].concat(Array.isArray(S.storico) ? S.storico : []).slice(0, 10);
  }
  const preferita = () => { const e = Object.entries(S.usi || {}).filter(([id]) => PER_ID[id]).sort((a, b) => b[1] - a[1]); return e.length ? e[0][0] : ""; };
  const seriePreferita = () => { const t = {}; for (const [id, n] of Object.entries(S.usi || {})) if (PER_ID[id]) t[PER_ID[id].serie] = num(t[PER_ID[id].serie]) + n; const e = Object.entries(t).sort((a, b) => b[1] - a[1]); return e.length ? e[0][0] : ""; };
  const lista = () => (Array.isArray(S.vetrina) ? S.vetrina : []).filter(id => PER_ID[id] && S.carte[id]).slice(0, 3);
  function metti(i, id) { const v = lista().concat(["", "", ""]).slice(0, 3); v[i] = id && S.carte[id] ? id : ""; S.vetrina = v.filter(Boolean).filter((x, k, a) => a.indexOf(x) === k); salva(); Archivio.pubblicaClassifica(); apriProfilo(); }
  const pct = (v, p) => v + p ? Math.round(v / (v + p) * 100) : 0;
  const quando = t => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${Math.max(1, m)} min fa` : m < 1440 ? `${Math.round(m / 60)} h fa` : `${Math.round(m / 1440)} g fa`; };
  // nov 2026: le carte della vetrina come sono nella collezione (livello, lode, rarità dopo le ascese, olografica, Ultra,
  // cornice e stelle di maestria). Le mie le leggo dal salvataggio, quelle di un amico arrivano dal server.
  function cartaVetrina(id, d) {
    const c = PER_ID[id];
    if (d.mio) return htmlCarta(c, { piccola: true });
    const x = (Array.isArray(d.dett) ? d.dett : []).find(y => y && y.id === id);
    if (!x) return htmlCarta(c, { piccola: true, liv: 0, lode: false });
    return htmlCarta(c, { piccola: true, liv: Math.min(LIVELLO_MAX, num(x.liv) || 1), lode: !!x.lode, olo: !!x.olo, ultra: !!x.ultra && !!c.ultra,
      rar: rarDopo(c.rarita, num(x.asc)), stelle: Math.min(5, num(x.stelle)), cc: typeof x.cc === "string" && (Cosmetici.CAT[x.cc] || x.cc === Cosmetici.MAESTRO) ? x.cc : "" });
  }
  // il riquadro (anche per gli amici, dai dati della classifica)
  function htmlRiquadro(d) {
    const v = (d.vetrina || []).filter(id => PER_ID[id]);
    return `<div class="vetrina-profilo ${Cosmetici.classeSfondo(d.sfondo)}">
      <div class="vp-carte">${[0, 1, 2].map(i => v[i] ? cartaVetrina(v[i], d) : `<div class="vp-vuota">${d.mio ? "Scegli una carta" : "—"}</div>`).join("")}</div>
      <div class="vp-numeri">
        <div><b>${d.livello ? Livello.badge(d.livello, "mini") : "–"}</b><span>Livello</span></div>
        <div><b>${esc(Gradi.nome(num(d.punti)))}</b><span>Grado</span></div>
        <div><b>${pct(num(d.vittorie), num(d.sconfitte))}%</b><span>Vittorie (${num(d.vittorie)}/${num(d.vittorie) + num(d.sconfitte)})</span></div>
        <div><b>${num(d.stelle)} ★</b><span>Maestria</span></div>
        <div><b>${d.preferita && PER_ID[d.preferita] ? esc(PER_ID[d.preferita].nome) : "–"}</b><span>Carta più usata</span></div>
        <div><b>${d.serie && SERIE[d.serie] ? `${SERIE[d.serie].simbolo} ${esc(SERIE[d.serie].nome)}` : "–"}</b><span>Serie preferita</span></div>
      </div>
      <div class="vp-record"><span class="vp-record-tit">Record</span>
        <div><b>🌙 ${num(d.albe) ? `${num(d.albe)} ${num(d.albe) === 1 ? "alba" : "albe"}` : num(d.notteMax) ? `fermata ${num(d.notteMax)}` : "–"}</b><span>Lunga Notte</span></div>
        <div><b>🗼 ${num(d.scalataMax) ? `piano ${num(d.scalataMax)}` : "–"}</b><span>Scalata</span></div>
        <div><b>⚔️ ${d.arenaMax != null && (num(d.arenaMax) || num(d.arene)) ? `${num(d.arenaMax)} vittorie` : "–"}</b><span>Arena (su 7)</span></div>
      </div></div>`;
  }
  const miei = () => ({ mio: true, vetrina: lista(), sfondo: Cosmetici.stato().sfondo, livello: S.lv ? Livello.info().liv : 1, punti: Gradi.mieiPunti(), vittorie: S.stats.vittorie, sconfitte: S.stats.sconfitte, stelle: Maestria.totaleStelle(), preferita: preferita(), serie: seriePreferita(),
    albe: S.stats.albe, notteMax: S.stats.notteMax, scalataMax: S.stats.scalataMax, arenaMax: S.stats.arenaMax, arene: S.stats.arene });
  function htmlProfilo() {
    if (S.admin) return "";
    const v = lista(), mie = possedute().slice().sort((a, b) => a.nome.localeCompare(b.nome));
    const scelta = i => `<select data-vetrina="${i}"><option value="">— vuoto —</option>${mie.map(c => `<option value="${c.id}" ${v[i] === c.id ? "selected" : ""}>${esc(c.nome)}</option>`).join("")}</select>`;
    const st = Array.isArray(S.storico) ? S.storico : [];
    return `<h3>La tua vetrina</h3><p class="nota">Le 3 carte che vuoi mostrare: le vedono gli amici toccando il tuo nome in classifica.</p>
      ${htmlRiquadro(miei())}
      <div class="vp-scelte">${[0, 1, 2].map(scelta).join("")}</div>
      <h3>Ultime partite</h3>
      ${st.length ? `<ul class="storico">${st.map(p => `<li class="${p.vinto ? "vinta" : "persa"}"><b>${p.vinto ? "Vinta" : "Persa"}</b><span>${esc(p.tipo)}${p.nome ? ` · ${esc(p.nome)}` : ""}</span><small>${quando(p.t)}</small></li>`).join("")}</ul>` : `<p class="nota">Ancora nessuna partita registrata.</p>`}
      <h3>Cosmetici</h3>${Cosmetici.htmlProfilo()}`;
  }
  // profilo di un amico (dalla riga della classifica)
  function apriAmico(r) {
    if (!r) return;
    apriModale(`<div class="profilo-modale"><div class="profilo-testa">${Cosmetici.avatar(String(r.avatar || ""), r.cornice, "grande")}<div><small>Giocatore</small>
      <h2 class="${Cosmetici.classeNome(r.stileNome)}">${esc(String(r.nome || "Giocatore"))}</h2>${r.titolo ? `<span class="nota">«${esc(r.titolo)}»</span>` : ""}</div></div>
      ${htmlRiquadro({ vetrina: r.vetrina || [], sfondo: r.sfondo, livello: num(r.livello), punti: num(r.punti), vittorie: num(r.vittorie), sconfitte: num(r.sconfitte), stelle: num(r.stelle), preferita: r.preferita, serie: r.seriePref,
        albe: r.albe, notteMax: r.notteMax, scalataMax: r.scalataMax, arenaMax: r.arenaMax, arene: r.arene, dett: r.vetrinaDett })}
      <div class="azioni centro">${r.id && r.id !== Archivio.uid ? `<button class="btn primario" data-fx="spinta" data-album-amico="${esc(r.id)}">📒 Vedi il suo album</button>${Regali.htmlTasto(r)}` : ""}<button class="btn" data-azione="chiudi">Chiudi</button></div></div>`);
  }
  // nov 2026: l'album di un amico, letto dal server (album_amico): tutte le carte, con quanto le ha potenziate
  let albumA = null;
  async function apriAlbumAmico(id) {
    apriModale(`<div class="album-amico"><p class="nota">Apro l'album…</p></div>`);
    let d;
    try { d = await rpcSociale("album_amico", { amico: id }); }
    catch (e) { const el = $("#modale-corpo .album-amico"); if (el) el.innerHTML = `<p class="nota">Non riesco a leggere il suo album adesso. ${String(e && e.message || "").includes("function") ? "Hai eseguito di nuovo schema.sql su Supabase?" : "Riprova tra poco."}</p><div class="azioni centro"><button class="btn" data-azione="chiudi">Chiudi</button></div>`; return; }
    const carte = d && d.carte && typeof d.carte === "object" ? d.carte : {};
    const serie = ORDINE_SERIE.filter(s => CARTE.some(c => c.serie === s));
    const conta = s => CARTE.filter(c => c.serie === s && carte[c.id]).length;
    albumA = { id, nome: String(d && d.nome || "Giocatore"), carte, serie: serie.find(s => conta(s)) || serie[0], solo: false };
    disegnaAlbumAmico();
  }
  function disegnaAlbumAmico() {
    const el = $("#modale-corpo .album-amico"); if (!el || !albumA) return;
    const A = albumA, C = A.carte, ids = Object.keys(C).filter(k => PER_ID[k]);
    const al30 = ids.filter(k => num(C[k][0]) >= LIVELLO_MAX).length, lode = ids.filter(k => C[k][1]).length;
    const nSerie = s => CARTE.filter(c => c.serie === s).length, hSerie = s => CARTE.filter(c => c.serie === s && C[c.id]).length;
    const lista = CARTE.filter(c => c.serie === A.serie && (!A.solo || C[c.id])).sort((a, b) => rangoRarita(b.rarita) - rangoRarita(a.rarita));
    const carta = c => { const x = C[c.id];
      if (!x) return `<div class="aa-carta">${htmlCarta(c, { piccola: true, coperta: true })}</div>`;
      const cc = typeof x[6] === "string" && (Cosmetici.CAT[x[6]] || x[6] === Cosmetici.MAESTRO) ? x[6] : "";
      return `<div class="aa-carta">${htmlCarta(c, { piccola: true, liv: Math.min(LIVELLO_MAX, num(x[0]) || 1), lode: !!x[1], olo: !!x[2], ultra: !!x[3] && !!c.ultra, rar: rarDopo(c.rarita, num(x[4])), stelle: Math.min(5, num(x[5])), cc })}</div>`; };
    el.innerHTML = `<span class="codice-tag">Album</span><h2>L'album di ${esc(A.nome)}</h2>
      <div class="aa-numeri"><div><b>${ids.length}<small>/${CARTE.length}</small></b><span>carte</span></div><div><b>${al30}</b><span>al livello 30</span></div><div><b>${lode}</b><span>con la lode</span></div></div>
      <div class="aa-filtri"><label class="filtro-ruolo"><span class="filtri-etichetta">Serie</span><select data-aa-serie aria-label="Serie">
        ${ORDINE_SERIE.filter(s => nSerie(s)).map(s => `<option value="${s}" ${s === A.serie ? "selected" : ""}>${SERIE[s].simbolo} ${esc(SERIE[s].nome)} · ${hSerie(s)}/${nSerie(s)}</option>`).join("")}</select></label>
        <label class="aa-solo"><input type="checkbox" data-aa-solo ${A.solo ? "checked" : ""}> Solo quelle che ha</label></div>
      <div class="aa-griglia">${lista.length ? lista.map(carta).join("") : `<p class="nota">Di questa serie non ha ancora nessuna carta.</p>`}</div>
      <div class="azioni centro"><button class="btn" data-azione="chiudi">Chiudi</button></div>`;
  }
  document.addEventListener("change", e => {
    if (!albumA || !e.target.closest(".album-amico")) return;
    if (e.target.matches("[data-aa-serie]")) { albumA.serie = e.target.value; disegnaAlbumAmico(); }
    else if (e.target.matches("[data-aa-solo]")) { albumA.solo = e.target.checked; disegnaAlbumAmico(); }
  });
  return { fineBattaglia, preferita, seriePreferita, lista, metti, htmlProfilo, apriAmico, htmlRiquadro, apriAlbumAmico };
})();

// ---------------- Gradi della stagione ----------------
// Dai punti dal vivo del mese (quelli della classifica, calcolati dal server): Bronzo → Leggenda.
// A fine stagione (quando l'admin azzera la classifica) si riscuote il premio del grado più alto raggiunto.
const Gradi = (() => {
  const GRADI = [
    { nome: "Bronzo", da: 0, ico: "🥉", premio: null },
    { nome: "Argento", da: 9, ico: "🥈", premio: { monete: piuMonete(300) } },
    { nome: "Oro", da: 21, ico: "🥇", premio: { monete: piuMonete(600), bustine: { epica: 1 } } },
    { nome: "Platino", da: 36, ico: "💠", premio: { monete: piuMonete(1000), bustine: { epica: 2 } }, cosm: "cc-diamante" },
    { nome: "Diamante", da: 54, ico: "💎", premio: { monete: piuMonete(1500), bustine: { leggendaria: 1 } }, cosm: "cornice-diamante" },
    { nome: "Leggenda", da: 75, ico: "👑", premio: { monete: piuMonete(2500), bustine: { leggendaria: 1, ultra: 1 } }, cosm: "cornice-leggenda" },
  ];
  const indice = p => { let i = 0; GRADI.forEach((g, k) => { if (p >= g.da) i = k; }); return i; };
  const nome = p => `${GRADI[indice(p)].ico} ${GRADI[indice(p)].nome}`;
  const mieiPunti = () => { const r = typeof classificaDati !== "undefined" && classificaDati ? classificaDati.find(x => x.id === Archivio.uid) : null; return r ? num(r.punti) : 0; };
  // tiene il grado più alto visto nella stagione; quando cambia stagione propone il premio
  function controlla() {
    if (!attivoExtra() || typeof albo === "undefined") return;
    if (!albo && !controlla.chiesto && typeof socialeAttivo === "function" && socialeAttivo()) { controlla.chiesto = true; caricaAlbo(); }   // la data d'inizio della stagione
    if (!albo) return;
    const stagione = albo.dal || "inizio";   // prima del primo azzeramento la stagione non ha una data
    const g = S.gradi && typeof S.gradi === "object" ? S.gradi : null;
    if (!g) { S.gradi = { stagione, max: indice(mieiPunti()), premi: [] }; return; }
    if (g.stagione !== stagione) {   // nuova stagione: il grado della vecchia si può riscuotere
      const premi = (g.premi || []).concat(g.max > 0 ? [{ stagione: g.stagione, grado: g.max, preso: false }] : []);
      S.gradi = { stagione, max: 0, premi }; salva(); return;
    }
    const ora = indice(mieiPunti());
    if (ora > g.max) { S.gradi = Object.assign({}, g, { max: ora }); salva(); setTimeout(() => mostraAvviso(`Nuovo grado: ${GRADI[ora].ico} ${GRADI[ora].nome}! A fine stagione riscuoti il premio.`), 800); }
  }
  const daRiscuotere = () => ((S.gradi && S.gradi.premi) || []).filter(p => !p.preso);
  function riscuoti() {
    const lista = daRiscuotere(); if (!lista.length) return;
    const parti = [];
    for (const p of lista) { const G = GRADI[p.grado]; if (G.premio) { daiPremio(JSON.parse(JSON.stringify(G.premio))); parti.push(`${G.nome}: ${testoPremio(G.premio)}`); } if (G.cosm) Cosmetici.sblocca(G.cosm); p.preso = true; }
    S.gradi = Object.assign({}, S.gradi, { premi: S.gradi.premi.slice() }); salva(); aggiornaTesta(); disegna();
    mostraAvviso(`Premio di fine stagione · ${parti.join(" · ")}`);
  }
  function htmlClassifica() {
    if (!attivoExtra()) return "";
    const p = mieiPunti(), i = indice(p), G = GRADI[i], dopo = GRADI[i + 1], r = daRiscuotere();
    return `<div class="gradi-box"><div class="gr-ico">${G.ico}</div><div><b>Il tuo grado: ${G.nome}</b>
      <span class="nota">${p} punti in questa stagione${dopo ? ` · ${dopo.ico} ${dopo.nome} a ${dopo.da} punti` : " · grado massimo!"} · massimo raggiunto: ${GRADI[(S.gradi && S.gradi.max) || 0].nome}</span>
      <span class="nota">Premio di fine stagione per il grado più alto: ${GRADI.filter(g => g.premio).map(g => `${g.ico} ${testoPremio(g.premio)}${g.cosm ? " + cornice" : ""}`).join(" · ")}</span></div>
      ${r.length ? `<button class="btn oro" data-fx="coriandoli" data-azione="gradi-riscuoti">Riscuoti il premio della stagione</button>` : ""}</div>`;
  }
  return { GRADI, indice, nome, mieiPunti, controlla, riscuoti, daRiscuotere, htmlClassifica };
})();

// ---------------- Arena ----------------
// Paghi l'ingresso, scegli 5 carte (ogni volta tra 3), poi giochi contro il computer finché non perdi 3 volte o vinci 7.
// Tutte le carte (tue e del computer) sono al livello 20: conta come scegli e come giochi, non la collezione.
const Arena = (() => {
  const INGRESSO = 300, MAX_VINTE = 7, MAX_PERSE = 3;
  const GIRI = ["leggendaria", "epica", "epica", "rara", "comune"];   // la rarità delle 3 carte proposte a ogni scelta
  // nov 2026 (27): premi alzati, circa il doppio al minuto (prima 100 · 150 · 250 · 350+N · 450+E · 600+E · 800+L · 1000+L)
  const PREMI = [{ monete: 220 }, { monete: 330 }, { monete: 480 }, { monete: 620, bustine: { normale: 1 } }, { monete: 780, bustine: { epica: 1 } },
    { monete: 1000, bustine: { epica: 1 }, frammenti: 40 }, { monete: 1300, bustine: { leggendaria: 1 }, frammenti: 80 }, { monete: 1700, bustine: { leggendaria: 1 }, frammenti: 160 }];
  const ABILITA = [.6, .68, .75, .82, .88, .93, .96];
  const stato = () => S.arena && typeof S.arena === "object" ? S.arena : null;
  const casuali = (rar, n, escludi = []) => { const pool = CARTE.filter(c => c.rarita === rar && !escludi.includes(c.id)); const out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id); return out; };
  const testoPremio2 = p => testoPremio(p);   // i frammenti ora li scrive testoPremio
  function entra() {
    if (!attivoExtra() || stato()) return;
    if (S.monete < INGRESSO) { mostraAvviso(`L'ingresso costa ${INGRESSO} monete.`); return; }
    S.monete -= INGRESSO;
    S.arena = { scelte: [], proposta: casuali(GIRI[0], 3), vinte: 0, perse: 0, finita: false };
    salva(); aggiornaTesta(); apriScelta();
  }
  function apriScelta() {
    const a = stato(); if (!a || a.scelte.length >= 5) return;
    apriModale(`<div class="arena-scelta"><span class="codice-tag">Arena · scelta ${a.scelte.length + 1} di 5</span><h2>Scegli una carta</h2>
      <p class="nota">Tutte le carte in Arena sono al livello 20. Pensa al tipo (Forza, Difesa, Velocità) e alle sinergie tra le carte che scegli.</p>
      <div class="arena-carte">${a.proposta.map(id => `<div class="arena-opz"><button class="arena-opzione" data-arena-scegli="${id}">${htmlCarta(PER_ID[id], { liv: 20 })}<small>${esc(RUOLI[PER_ID[id].ruolo].nome)} · ${esc(SERIE[PER_ID[id].serie].nome)}</small></button>
        <button class="btn piccolo" data-arena-info="${id}">Dettagli</button></div>`).join("")}</div>
      <p class="nota">Tocca «Dettagli» per vedere statistiche e mosse al livello 20; tocca la carta per sceglierla.</p>
      ${a.scelte.length ? `<p class="nota">Già scelte: ${a.scelte.map(id => esc(PER_ID[id].nome)).join(", ")}</p>` : ""}</div>`);
  }
  // scheda della carta come sarà in Arena (livello 20, senza lode né olografica), poi si torna alla scelta
  function info(id) {
    const a = stato(); if (!a || !a.proposta.includes(id)) return;
    const c = PER_ID[id], s = statistiche(c, 20, false, c.rarita), r = RUOLI[c.ruolo];
    apriModale(`<div class="dettaglio">
      <div class="dettaglio-carta">${htmlCarta(c, { liv: 20, piena: true })}</div>
      <div class="dettaglio-testo"><span class="codice-tag">Arena · livello 20</span>
        <p class="serie-nome">${esc(SERIE[c.serie].nome)}</p><h2>${esc(c.nome)}</h2>
        <div class="ruolo-box"><b>${esc(r.nome)}</b><span>${esc(r.cosa)}</span><p>${esc(r.passiva)}</p></div>
        ${htmlStatGriglia(c, s)}${htmlBonusRarita(c)}${htmlTipo(c)}
        <ul class="mosse-lista">${c.mosse.map(mo => `<li><span class="costo">${mo.costo}⚡</span><b>${esc(mo.nome)}</b><small>${esc(descrMossa(mo))}</small></li>`).join("")}</ul>
        ${(() => { const n = a.scelte.filter(x => PER_ID[x].serie === c.serie).length + 1, S2 = SINERGIE[c.serie]; if (n < 2 || !S2) return "";
          const liv = n >= 5 ? 3 : n >= 3 ? 2 : 1, v = S2[["", "v2", "v3", "v5"][liv]];
          return `<p class="passiva"><b>Sinergia:</b> con questa avresti ${n} carte ${esc(SERIE[c.serie].nome)}: ${esc(S2.testo(v, liv))}.</p>`; })()}
        <div class="azioni"><button class="btn primario" data-arena-scegli="${id}">Scegli questa</button><button class="btn" data-azione="arena-scelta">Torna alla scelta</button></div>
      </div></div>`);
  }
  function scegli(id) {
    const a = stato(); if (!a || !a.proposta.includes(id) || a.scelte.length >= 5) return;
    const scelte = a.scelte.concat(id), i = scelte.length;
    S.arena = Object.assign({}, a, { scelte, proposta: i < 5 ? casuali(GIRI[i], 3, scelte) : [] });
    salva();
    if (i < 5) apriScelta(); else { chiudiModale(); mostraAvviso("Squadra dell'Arena pronta! Vai a Sfida e gioca la prima partita."); disegna(); }
  }
  function nemici() {
    return GIRI.map(r => casuali(r, 1)[0]).map(id => ({ id, liv: 20, lode: false }));
  }
  function gioca() {
    const a = stato(); if (!a || a.scelte.length < 5 || a.finita) return;
    const L = { id: "arena", nome: `Arena · partita ${a.vinte + a.perse + 1}`, abilita: ABILITA[Math.min(a.vinte, ABILITA.length - 1)], liv: [20, 20], premio: 0, punti: 0, xp: 60, xpCarte: 1.5,
      arena: true, rifai: () => gioca() };
    L.dopoVittoria = () => esito(true);
    L.dopoSconfitta = () => esito(false);
    schermoIntero(true);
    setTimeout(() => avviaSfida(L, a.scelte, nemici(), true), ridotto ? 0 : 200);
  }
  function esito(vinto) {
    const a = stato(); if (!a || a.finita) return "";
    const n = Object.assign({}, a, vinto ? { vinte: a.vinte + 1 } : { perse: a.perse + 1 });
    n.finita = n.vinte >= MAX_VINTE || n.perse >= MAX_PERSE;
    S.arena = n; salva();
    if (n.vinte >= MAX_VINTE) Cosmetici.sblocca("nome-arena");
    return n.finita ? `Arena finita: ${n.vinte} vittorie! Riscuoti il premio nella pagina Sfida (${testoPremio2(PREMI[n.vinte])}).` : `Arena: ${n.vinte} vittorie, ${n.perse} sconfitte (ne puoi perdere ancora ${MAX_PERSE - n.perse}).`;
  }
  function riscuoti(el) {
    const a = stato(); if (!a || !a.finita) return;
    const p = PREMI[Math.min(a.vinte, PREMI.length - 1)];
    daiPremio({ monete: p.monete, bustine: p.bustine });
    if (p.frammenti) Frammenti.aggiungi(p.frammenti, false);
    S.stats.arene = num(S.stats.arene) + 1; S.stats.arenaMax = Math.max(num(S.stats.arenaMax), a.vinte);
    S.arena = null; salva(); aggiornaTesta(); disegna();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 70, forma: "stella", colori: ["#f2c14e", "#ffffff", "#ff2e46"], velocita: 8, dimensione: 6 }); }
    mostraAvviso(`Premio dell'Arena (${a.vinte} vittorie): ${testoPremio2(p)}!`);
  }
  function htmlSfida() {
    if (!attivoExtra()) return "";
    const a = stato();
    const premi = `<details class="arena-premi"><summary>Premi</summary><ul>${PREMI.map((p, i) => `<li><b>${i} vittorie</b> ${esc(testoPremio2(p))}</li>`).join("")}</ul></details>`;
    if (!a) return `<section class="arena-box"><div class="ab-testa"><span class="ab-ico">⚔</span><div><b>Arena</b><span class="nota">Scegli 5 carte tra quelle proposte (tutte al livello 20, anche se non le hai) e gioca finché non perdi 3 volte. Massimo ${MAX_VINTE} vittorie: più ne fai, più è ricco il premio.</span></div>
      <button class="btn primario" data-fx="onda" data-azione="arena-entra" ${S.monete >= INGRESSO ? "" : "disabled"}>Entra · ${INGRESSO} monete</button></div>${premi}</section>`;
    if (a.scelte.length < 5) return `<section class="arena-box"><div class="ab-testa"><span class="ab-ico">⚔</span><div><b>Arena · scelta in corso</b><span class="nota">Hai scelto ${a.scelte.length} carte su 5.</span></div>
      <button class="btn primario" data-azione="arena-scelta">Continua a scegliere</button></div></section>`;
    return `<section class="arena-box"><div class="ab-testa"><span class="ab-ico">⚔</span><div><b>Arena · ${a.vinte} vittorie · ${a.perse} sconfitte</b>
      <span class="nota">${a.finita ? `Finita! Premio: ${esc(testoPremio2(PREMI[a.vinte]))}` : `Prossima vittoria: premio ${esc(testoPremio2(PREMI[a.vinte + 1]))}. Ne puoi perdere ancora ${MAX_PERSE - a.perse}.`}</span></div>
      ${a.finita ? `<button class="btn oro" data-fx="coriandoli" data-azione="arena-riscuoti">Riscuoti il premio</button>` : `<button class="btn primario" data-fx="spinta" data-azione="arena-gioca">Gioca la partita ${a.vinte + a.perse + 1}</button>`}</div>
      <div class="ab-carte">${a.scelte.map(id => htmlCarta(PER_ID[id], { piccola: true, liv: 20 })).join("")}</div>
      <div class="ab-pallini">${Array.from({ length: MAX_VINTE }, (_, i) => `<i class="${i < a.vinte ? "v" : ""}"></i>`).join("")}<span>·</span>${Array.from({ length: MAX_PERSE }, (_, i) => `<i class="p ${i < a.perse ? "x" : ""}"></i>`).join("")}</div>${premi}</section>`;
  }
  return { INGRESSO, PREMI, entra, apriScelta, scegli, info, gioca, riscuoti, htmlSfida, stato };
})();

// ---------------- Offerte speciali del negozio ----------------
// Le bustine restano tutte come prima. In più, ogni giorno 3 offerte diverse per ogni giocatore:
// una carta che ti manca (mai leggendaria), potenziatori per una tua carta, un cosmetico.
const Offerte = (() => {
  const PREZZO_CARTA = { comune: 400, rara: 900, epica: 2000, jolly: 2500 }, POT = 20, PREZZO_POT = 300;
  const giorno = () => chiaveGiorno(new Date());
  const sorteggia = (lista, chiave) => lista.length ? lista[hashTesto(chiave) % lista.length] : null;
  // le offerte si decidono una volta al giorno e restano quelle (anche dopo aver comprato la carta)
  function elenco() {
    const g = giorno(), os = S.offerteSpeciali;
    if (os && os.giorno === g && Array.isArray(os.lista)) return os.lista.filter(o => o.k === "cosm" ? Cosmetici.CAT[o.id] : PER_ID[o.id]);
    const lista = calcola(g);
    S.offerteSpeciali = { giorno: g, presi: [], lista };
    return lista;
  }
  function calcola(g) {
    const seme = g + ":" + (S.profilo && S.profilo.nome || "");
    const out = [];
    const mancanti = CARTE.filter(c => !S.carte[c.id] && c.rarita !== "leggendaria" && c.rarita !== "jolly");   // i Jolly non si comprano: solo bustine (rarissimi) o frammenti
    const carta = sorteggia(mancanti, seme + ":carta");
    if (carta) out.push({ k: "carta", id: carta.id, prezzo: PREZZO_CARTA[carta.rarita], titolo: `Carta ${RARITA[carta.rarita].nome.toLowerCase()} da scoprire · ${SERIE[carta.serie].nome}`, desc: "Una carta che non hai ancora: scopri chi è quando la compri." });
    const salgono = possedute().filter(c => infoCarta(c.id).liv < LIVELLO_MAX);
    const pot = sorteggia(salgono.filter(c => squadraAttiva().carte.includes(c.id)).length ? salgono.filter(c => squadraAttiva().carte.includes(c.id)) : salgono, seme + ":pot");
    if (pot) out.push({ k: "pot", id: pot.id, prezzo: PREZZO_POT, titolo: `${POT} potenziatori per ${pot.nome}`, desc: "Per farla salire di livello prima." });
    const cosm = sorteggia(Object.keys(Cosmetici.CAT).filter(id => Cosmetici.CAT[id].prezzo && !Cosmetici.ha(id)), seme + ":cosm");
    if (cosm) out.push({ k: "cosm", id: cosm, prezzo: Cosmetici.CAT[cosm].prezzo, titolo: Cosmetici.CAT[cosm].nome, desc: "Cosmetico: non cambia la forza." });
    return out;
  }
  const preso = k => !!(S.offerteSpeciali && S.offerteSpeciali.giorno === giorno() && (S.offerteSpeciali.presi || []).includes(k));
  function compra(k, el) {
    if (!attivoExtra() || preso(k)) return;
    const o = elenco().find(x => x.k === k); if (!o || S.monete < o.prezzo) return;
    S.monete -= o.prezzo;
    if (o.k === "carta") { S.carte[o.id] = 1; S.liv[o.id] = S.liv[o.id] || 1; Livello.carteNuove([{ id: o.id, nuova: true }]); setTimeout(() => apriDettaglio(o.id), 300); }
    if (o.k === "pot") S.pot = Object.assign({}, S.pot, { [o.id]: num((S.pot || {})[o.id]) + POT });
    if (o.k === "cosm") Cosmetici.sblocca(o.id, false);
    S.offerteSpeciali = Object.assign({}, S.offerteSpeciali, { presi: S.offerteSpeciali.presi.concat(k) });
    salva(); aggiornaTesta(); Archivio.pubblicaClassifica(); disegna();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 40, forma: "moneta", colori: ["#f2c14e", "#fff3c4"], velocita: 7, dimensione: 6 }); }
    mostraAvviso(`Comprato: ${o.titolo}!`);
  }
  function html() {
    if (!attivoExtra()) return "";
    const l = elenco(); if (!l.length) return "";
    return `<div class="titolo-riga piccola"><h3>Offerte speciali di oggi</h3><p class="nota">Cambiano ogni giorno e sono diverse per ognuno. Le bustine restano qui sotto come sempre.</p></div>
      <div class="offerte-speciali">${l.map(o => `<div class="off-sp ${preso(o.k) ? "presa" : ""}">
        ${o.k === "carta" ? htmlCarta(PER_ID[o.id], { piccola: true, coperta: !preso(o.k) }) : o.k === "pot" ? htmlCarta(PER_ID[o.id], { piccola: true }) : Cosmetici.CAT[o.id].tipo === "carta" ? htmlCarta(possedute()[0] || CARTE[0], { piccola: true, cc: o.id }) : `<div class="off-cosm"><span class="cornice-avatar ${Cosmetici.classeCornice(o.id)}">${htmlAvatar(S.profilo.avatar)}</span><b class="${Cosmetici.classeNome(o.id)}">${esc(S.profilo.nome || "")}</b></div>`}
        <b>${esc(o.titolo)}</b><span class="nota">${esc(o.desc)}</span>
        ${preso(o.k) ? `<span class="nota">Comprato! Domani nuove offerte.</span>` : `<button class="btn oro" data-fx="monete" data-offerta-sp="${o.k}" ${S.monete >= o.prezzo ? "" : "disabled"}>${o.prezzo} <i class="moneta-ico"></i></button>`}
      </div>`).join("")}</div>`;
  }
  return { elenco, compra, html };
})();

// Cosmetici dei livelli giocatore (si sbloccano riscuotendo quei livelli)
if (typeof Livello !== "undefined" && Livello.premiExtra) {
  const PER_LIVELLO = { 30: "cornice-oro", 35: "cc-fiamme", 40: "nome-fuoco", 50: "cornice-arcobaleno", 55: "cc-galassia", 60: "sfondo-oro", 70: "nome-arcobaleno", 80: "cc-arcobaleno", 90: "sfondo-noiverso", 100: "cornice-numero1" };
  for (const [L, id] of Object.entries(PER_LIVELLO)) Livello.premiExtra[L] = { id, testo: Cosmetici.CAT[id].nome, dai: () => Cosmetici.sblocca(id) };
}

// Controlli leggeri a ogni aggiornamento della testata: cosmetici dei livelli già riscossi (per chi li aveva presi prima) e grado della stagione
const Extra = {
  controlla() {
    if (!attivoExtra()) return;
    if (S.lv && Array.isArray(S.lv.riscossi)) for (const L of S.lv.riscossi) { const x = Livello.premiExtra[L]; if (x && x.id && !Cosmetici.ha(x.id)) Cosmetici.sblocca(x.id, false); }
    Gradi.controlla();
    Jolly.sistema();
    if (!Extra.nv) { Extra.nv = true; setTimeout(Novita.controlla, 2500); }
  },
};

// ---------------- I tuoi progressi (un solo posto) ----------------
// In cima alla Strada: un riquadro per ogni cosa che avanza, con il puntino rosso dove c'è qualcosa da riscuotere.
const Progressi = (() => {
  function voci() {
    const lv = Livello.info(), sp = SfidePass.stato(), a = Arena.stato();
    const mie = possedute().length, stelleMax = mie * Maestria.OBIETTIVI.length, st = Maestria.totaleStelle();
    const gr = Gradi.indice(Gradi.mieiPunti()), G = Gradi.GRADI[gr];
    const passR = daRiscuotere();
    const sfideTot = sp.gIds.length + sp.sIds.length, sfideFatte = sp.gFatte.length + sp.sFatte.length;
    return [
      { ico: "⬆", nome: "Livello giocatore", valore: `Lv ${lv.liv}`, barra: lv.max ? 100 : Math.round(lv.dentro / lv.serve * 100), sotto: lv.max ? "Massimo!" : `${lv.dentro}/${lv.serve} punti`, pronti: Livello.daRiscuotere().length, azione: "livello-pagina" },
      { ico: "🎟", nome: "Pass", valore: `Lv ${livelloPass()}`, barra: (S.pass.xp % PASS.xpLivello) / PASS.xpLivello * 100, sotto: passR ? `${passR} premi da prendere` : "Sfide del pass per salire", pronti: passR, azione: "vai-pass" },
      { fuori: true, ico: "🎯", nome: "Sfide del pass", valore: `${sfideFatte}/${sfideTot}`, barra: sfideTot ? sfideFatte / sfideTot * 100 : 0, sotto: "Oggi e questa settimana", pronti: 0, azione: "vai-pass" },
      { fuori: true, ico: "📋", nome: "Missioni di oggi", valore: Missioni.pronte() ? `${Missioni.pronte()} ${Missioni.pronte() === 1 ? "pronta" : "pronte"}` : "In corso", sotto: "Le trovi qui sotto", pronti: Missioni.pronte(), azione: "vai-missioni" },
      { ico: "★", nome: "Maestria", valore: `${st} ★`, barra: stelleMax ? st / stelleMax * 100 : 0, sotto: `su ${stelleMax} possibili`, pronti: 0, azione: "vai-album" },
      { fuori: true, gioca: true, ico: "⚔", nome: "Arena", valore: !a ? "Libera" : a.finita ? "Finita!" : `${a.vinte} V · ${a.perse} S`, sotto: !a ? `Ingresso ${Arena.INGRESSO} monete` : a.finita ? "Riscuoti il premio" : a.scelte.length < 5 ? "Scelta in corso" : "Partita in corso", pronti: a && a.finita ? 1 : 0, azione: "vai-sfida" },
      { ico: G.ico, nome: "Grado della stagione", valore: G.nome, sotto: Gradi.GRADI[gr + 1] ? `${Gradi.GRADI[gr + 1].nome} a ${Gradi.GRADI[gr + 1].da} punti` : "Grado massimo", pronti: Gradi.daRiscuotere().length, azione: "vai-classifica" },
      { ico: "🏆", nome: "Trofei", valore: Trofei.pronti() ? `${Trofei.pronti()} ${Trofei.pronti() === 1 ? "pronto" : "pronti"}` : "Collezione", sotto: "Nell'album, scheda Trofei", pronti: Trofei.pronti(), azione: "vai-trofei" },
      { ico: "📖", nome: "Album", valore: `${mie}/${CARTE.length}`, barra: mie / CARTE.length * 100, sotto: `◈ ${Frammenti.quanti()} frammenti`, pronti: 0, azione: "vai-album" },
    ];
  }
  // il pallino di Home conta anche le missioni (sono in home); l'Arena conta nel pallino di Gioca
  const totale = () => attivoExtra() ? voci().filter(v => !v.gioca).reduce((n, v) => n + (v.pronti || 0), 0) : 0;
  function htmlStrada() {
    if (!attivoExtra()) return "";
    return `<section class="progressi-hub"><div class="titolo-riga piccola"><h2>I tuoi progressi</h2></div>
      <div class="ph-griglia">${voci().filter(v => !v.fuori).map(v => `<button class="ph-voce ${v.pronti ? "pronta" : ""}" data-azione="${v.azione}">
        ${v.pronti ? `<span class="ph-punto">${v.pronti}</span>` : ""}
        <span class="ph-ico">${v.ico}</span><span class="ph-nome">${esc(v.nome)}</span><b>${esc(v.valore)}</b>
        ${v.barra !== undefined ? `<span class="ph-barra"><i style="--p:${Math.max(0, Math.min(100, Math.round(v.barra)))}%"></i></span>` : ""}
        <small>${esc(v.sotto)}</small></button>`).join("")}</div></section>`;
  }
  return { totale, htmlStrada };
})();

// ---------------- Novità (una volta sola per ogni aggiornamento) ----------------
const Novita = (() => {
  const VERSIONE = "2026-11-boss", ENIGMA = "2026-11-enigma", PRIMA = "2026-11-album";
  const NUOVE = [
    { ico: "👹", titolo: "Boss della settimana senza fine", testo: "Quando il gruppo abbatte il boss della settimana ne arriva subito un altro, un po' più forte, fino a domenica: si continua ad attaccare e ogni boss dà il suo premio. C'è anche il record del gruppo, i boss abbattuti in una settimana: chi colpisce il boss che lo batte prende un premio in più." },
    { ico: "🧩", titolo: "Enigma del giorno", testo: "In Gioca › Eventi: ogni giorno la stessa battaglia per tutti, con squadra e avversario già decisi. Vincila nel minor numero di turni: puoi riprovare quanto vuoi e c'è la classifica di oggi con gli amici. La prima vittoria del giorno dà monete." },
    { ico: "🎁", titolo: "Regali tra amici", testo: "Ogni giorno puoi mandare un regalo gratis a un amico: tocca il suo nome in classifica e «Manda un regalo». Vale 3 potenziatori universali ✪. I regali che ricevi li trovi nella Home." },
    { ico: "◈", titolo: "Frammenti in potenziatori", testo: "Ti avanzano frammenti? Tocca ◈ in alto: ogni 20 frammenti diventano 1 potenziatore universale ✪, che vale per qualsiasi carta." },
    { ico: "✨", titolo: "La squadra giusta per la tappa", testo: "Nella scheda di una tappa (storia e Leggenda) c'è «Trova la squadra migliore per questa tappa»: il gioco prova le tue carte contro quei nemici, con il loro campo e la regola, e ti propone la squadra che vince di più." },
    { ico: "💡", titolo: "Consigli per la Leggenda", testo: "Sotto la regola di ogni capitolo della Leggenda ora c'è un consiglio su quali carte portare e come giocarla." },
  ];
  let SCHEDE = [];
  const VECCHIE = [
    { ico: "🪙", titolo: "Più monete per tutti", testo: "Battaglie, storia, missioni, premi di accesso, pass, eventi, boss e sfide con gli amici danno il 50% di monete in più: per esempio battere il Boss dà 180 monete invece di 120. Così portare le carte al livello 30 è molto più alla portata." },
    { ico: "📒", titolo: "L'album degli amici", testo: "Tocca il nome di un amico in classifica e poi «Vedi il suo album»: vedi tutte le carte che ha, a che livello, con la lode, olografiche, Ultra e con le cornici." },
    { ico: "💰", titolo: "Premi raddoppiati", testo: "Arena, Lunga Notte e Scalata ora danno circa il doppio: per esempio l'Arena con 3 vittorie dà 620 monete e una bustina (prima 350), l'alba della Notte una Bustina Leggendaria, 400 monete e 60 frammenti. E anche uscire presto rende quasi l'ingresso." },
    { ico: "👑", titolo: "Storia · Livello Leggenda", testo: "Hai finito la storia? Ricomincia da capo al Livello Leggenda: stessi capitoli, nemici al 30 con la lode e una regola speciale diversa in ogni capitolo. Dà frammenti, potenziatori universali, tre titoli e, alla fine, la cornice delle carte «Leggenda». La trovi in Gioca, sotto la Storia." },
    { ico: "🧭", titolo: "Il menu è cambiato", testo: "Ora le sezioni sono 5: Home, Gioca, Carte, Negozio e Amici. Dentro Carte trovi Bustine, Album e Squadre; dentro Amici la Classifica e il Pass. Il numerino su una sezione vuol dire che lì c'è qualcosa da fare." },
  ];
  let i = 0;
  function controlla() {
    if (!attivoExtra() || S.novita === VERSIONE) return;
    if (typeof Tutorial !== "undefined" && Tutorial.attivo) { setTimeout(controlla, 20000); return; }
    if (!$("#modale").hidden || (typeof B !== "undefined" && B)) return;
    if (!(S.stats.vittorie + S.stats.sconfitte)) { S.novita = VERSIONE; return; }   // chi è appena arrivato le scopre col tutorial
    // chi aveva già visto quelle dell'Enigma vede solo il boss; chi non aveva visto le novità di prima le vede dopo queste
    SCHEDE = S.novita === ENIGMA ? NUOVE.slice(0, 1) : NUOVE.concat(S.novita === PRIMA ? [] : VECCHIE);
    i = 0; mostra();
  }
  function mostra() {
    const s = SCHEDE[i];
    apriModale(`<div class="novita"><span class="codice-tag">Novità · ${i + 1} di ${SCHEDE.length}</span>
      <div class="nv-ico">${s.ico}</div><h2>${esc(s.titolo)}</h2><p>${esc(s.testo)}</p>
      <div class="nv-punti">${SCHEDE.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="azioni centro">${i > 0 ? `<button class="btn" data-azione="novita-indietro">Indietro</button>` : ""}
      <button class="btn primario" data-azione="${i < SCHEDE.length - 1 ? "novita-avanti" : "novita-fine"}">${i < SCHEDE.length - 1 ? "Avanti" : "Ho capito"}</button></div></div>`);
  }
  const avanti = () => { i = Math.min(SCHEDE.length - 1, i + 1); mostra(); };
  const indietro = () => { i = Math.max(0, i - 1); mostra(); };
  const fine = () => { S.novita = VERSIONE; salva(); chiudiModale(); };
  const rivedi = () => { SCHEDE = NUOVE.concat(VECCHIE); i = 0; mostra(); };
  return { controlla, avanti, indietro, fine, rivedi };
})();

// ---------------- Squadra consigliata ----------------
// Prova alcune squadre fatte con le tue carte (le più forti, e quelle che sfruttano le sinergie di una serie)
// facendole combattere davvero, di nascosto, contro avversari del tuo livello. Propone quella che vince di più.
const Consiglio = (() => {
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const membro = id => ({ id, liv: livello(id) || 1, lode: haLode(id), olo: haOlo(id), ultra: haUltra(id), asc: (S.asc || {})[id] || 0 });
  const valore = id => { const s = statistiche(PER_ID[id], livello(id) || 1, haLode(id), rarCarta(id)); return s.pv * s.att * (1 + s.vel / 200); };
  function candidate() {
    // al massimo un Jolly per squadra: tiene solo il migliore
    const mie = possedute().map(c => c.id).sort((a, b) => valore(b) - valore(a)).filter((id, k, l) => PER_ID[id].rarita !== "jolly" || l.findIndex(x => PER_ID[x].rarita === "jolly") === k);
    const out = [], chiave = new Set(), add = l => { if (l.length < CARTE_SQUADRA) return; const k = l.slice().sort().join(); if (!chiave.has(k)) { chiave.add(k); out.push(l); } };
    add(mie.slice(0, CARTE_SQUADRA));
    const perSerie = {}; for (const id of mie) (perSerie[PER_ID[id].serie] = perSerie[PER_ID[id].serie] || []).push(id);
    for (const l of Object.values(perSerie).filter(l => l.length >= 2)) {
      for (const k of [5, 3, 2]) { if (l.length < k) continue; const base = l.slice(0, k); add(base.concat(mie.filter(x => !base.includes(x)).slice(0, CARTE_SQUADRA - k))); }
    }
    const somma = l => l.reduce((a, id) => a + valore(id), 0);
    return out.sort((a, b) => somma(b) - somma(a)).slice(0, 10);
  }
  function avversari(R) {
    const mie = possedute(), lv = Math.round(mie.map(c => livello(c.id) || 1).sort((a, b) => b - a).slice(0, 10).reduce((a, b, _, l) => a + b / l.length, 0)) || 1;
    const pesca = rar => { const l = CARTE.filter(c => rar.includes(c.rarita)); return l[Math.floor(R() * l.length)].id; };
    const out = [];
    for (let i = 0; i < 6; i++) { const s = new Set(); while (s.size < CARTE_SQUADRA) s.add(pesca(i < 3 ? ["epica", "leggendaria"] : ["rara", "epica", "leggendaria"])); out.push([...s]); }
    for (let i = 0; i < 4; i++) { const OSE = ORDINE_SERIE.filter(k => !SERIE[k].jolly), ser = OSE[Math.floor(R() * OSE.length)], l = CARTE.filter(c => c.serie === ser).map(c => c.id); const s = new Set(); while (s.size < Math.min(CARTE_SQUADRA, l.length)) s.add(l[Math.floor(R() * l.length)]); while (s.size < CARTE_SQUADRA) s.add(pesca(["epica"])); out.push([...s]); }
    return out.map(l => l.map(id => ({ id, liv: lv, lode: lv >= 30 })));
  }
  function combatti(mia, nemica, R) {
    const b = new Battaglia(mia.map(membro), nemica, "A", "B", rng(1 + Math.floor(R() * 1e9)));
    let g = 0;
    while (b.vincitore < 0 && g++ < 300) {
      for (const l of [0, 1]) if (b.serveSostituzione(l)) b.sostituisci(l, b.scegliSostituto(l));
      if (b.vincitore >= 0) break;
      b.risolviTurno(b.scegliAzione(0, .9), b.scegliAzione(1, .9));
    }
    return b.vincitore === 0;
  }
  // tutto a pezzetti, così lo schermo non si blocca
  function calcola() {
    if (possedute().length < CARTE_SQUADRA) { mostraAvviso(`Servono almeno ${CARTE_SQUADRA} carte.`); return; }
    apriModale(`<div class="consiglio-modale"><h2>Squadra consigliata</h2><p class="nota">Faccio combattere di nascosto alcune squadre con le tue carte…</p><div class="barra"><i id="cons-barra" style="--p:0%"></i></div></div>`);
    const R = rng(hashTesto(chiaveGiorno(new Date()) + (S.profilo && S.profilo.nome || ""))), nem = avversari(R);
    const attuale = squadraAttiva().carte.length === CARTE_SQUADRA ? squadraAttiva().carte.slice() : null;
    const prove = candidate(); if (attuale && !prove.some(l => l.slice().sort().join() === attuale.slice().sort().join())) prove.push(attuale);
    const ris = prove.map(l => ({ l, v: 0, n: 0 })), GIRI = 3, totale = ris.length * nem.length * GIRI;
    let i = 0;
    const passo = () => {
      if ($("#modale").hidden) return;   // chiuso a metà
      const fine = Date.now() + 40;
      while (i < totale && Date.now() < fine) { const r = ris[Math.floor(i / (nem.length * GIRI))], n = nem[i % nem.length]; r.n++; if (combatti(r.l, n, R)) r.v++; i++; }
      const bar = $("#cons-barra"); if (bar) bar.style.setProperty("--p", `${Math.round(i / totale * 100)}%`);
      if (i < totale) setTimeout(passo, 0); else mostra(ris, attuale);
    };
    setTimeout(passo, 50);
  }
  let proposta = null;
  function mostra(ris, attuale) {
    ris.sort((a, b) => b.v / b.n - a.v / a.n);
    const best = ris[0], pct = r => Math.round(r.v / r.n * 100), att = attuale && ris.find(r => r.l.slice().sort().join() === attuale.slice().sort().join());
    // in campo per prima la carta con più vita
    proposta = best.l.slice().sort((a, b) => statistiche(PER_ID[b], livello(b) || 1, haLode(b), rarCarta(b)).pv - statistiche(PER_ID[a], livello(a) || 1, haLode(a), rarCarta(a)).pv);
    const uguale = att === best;
    apriModale(`<div class="consiglio-modale"><h2>Squadra consigliata</h2>
      <div class="cons-carte">${proposta.map(id => htmlCarta(PER_ID[id], { piccola: true })).join("")}</div>
      <p>Contro avversari del tuo livello ha vinto <b>${pct(best)}%</b> delle battaglie di prova${att && !uguale ? `; la tua squadra di adesso il <b>${pct(att)}%</b>` : ""}.</p>
      <p class="nota">${uguale ? "La tua squadra di adesso è già la migliore tra quelle provate!" : "È un consiglio: le battaglie di prova usano il computer, e tu puoi giocare meglio. Ho messo per prima la carta con più vita."}</p>
      <div class="azioni centro">${uguale ? "" : `<button class="btn primario" data-fx="onda" data-azione="consiglio-usa">Usa questa squadra</button>`}<button class="btn" data-azione="chiudi">${uguale ? "Bene così" : "Lascia la mia"}</button></div></div>`);
  }
  function usa() {
    if (!proposta) return;
    const sq = squadraAttiva(); sq.carte = proposta.slice(); S.squadre = S.squadre.slice();
    salva(); chiudiModale(); disegna(); mostraAvviso(`Squadra «${sq.nome}» aggiornata.`);
  }
  return { calcola, usa };
})();

// ---------------- Potenziatori jolly ----------------
// I potenziatori che restano su una carta arrivata al livello 30 non servono più a quella carta: diventano jolly.
// I jolly stanno da parte (S.jolly) finché decidi tu su quale carta usarli e quanti: si mettono sulla carta scelta
// come normali potenziatori, poi la potenzi come sempre (con le monete). Non si scambiano.
const Jolly = (() => {
  const n = () => Math.max(0, Math.floor(S.jolly || 0));
  // quanti potenziatori mancano a una carta per arrivare al 30 (contando quelli che ha già)
  function mancanoAl30(id) {
    const inf = infoCarta(id); if (!inf.liv || inf.liv >= LIVELLO_MAX) return 0;
    let tot = 0; for (let l = inf.liv; l < LIVELLO_MAX; l++) tot += potPerLivello(l);
    return Math.max(0, tot - inf.pot);
  }
  const mancaProssimo = id => { const inf = infoCarta(id); return inf.liv && inf.liv < LIVELLO_MAX ? Math.max(0, inf.servePot - inf.pot) : 0; };

  // le carte al 30 cedono i potenziatori avanzati (tranne quelli promessi in uno scambio aperto)
  function sistema(avvisa = true) {
    if (typeof S === "undefined" || !S || !S.pot || !S.carte || S.admin) return 0;
    let tot = 0; const nomi = [];
    for (const id of Object.keys(S.pot)) {
      if (!S.carte[id] || !PER_ID[id] || livello(id) < LIVELLO_MAX) continue;
      const ris = typeof Scambi !== "undefined" ? Scambi.riservati(id) : 0;
      const q = Math.floor((S.pot[id] || 0) - ris); if (q <= 0) continue;
      S.pot = Object.assign({}, S.pot, { [id]: S.pot[id] - q }); tot += q; nomi.push(PER_ID[id].nome);
    }
    if (!tot) return 0;
    S.jolly = n() + tot; salva();
    if (avvisa) mostraAvviso(`✪ ${tot} potenziatori avanzati (${nomi.slice(0, 3).join(", ")}${nomi.length > 3 ? "…" : ""}, già al 30) sono diventati universali: li usi su qualsiasi carta da Squadre.`);
    return tot;
  }

  function usa(id, quanti) {
    const max = Math.min(n(), mancanoAl30(id)), q = Math.max(0, Math.min(Math.floor(quanti), max));
    if (!q) return 0;
    S.jolly = n() - q; S.pot = Object.assign({}, S.pot, { [id]: ((S.pot || {})[id] || 0) + q });
    salva(); aggiornaTesta();
    return q;
  }

  // il "salvadanaio" in Squadre
  function htmlSquadra() {
    const j = n(); if (!j) return "";
    return `<div class="jolly-box"><span class="jolly-ico">✪</span><div><b>Potenziatori universali: ${j}</b><small>Arrivano dalle carte al livello 30 e dalle vittorie delle carte 30 e lode. Li usi su qualsiasi carta, quando vuoi tu.</small></div>
      <button class="btn piccolo primario" data-fx="stelle" data-azione="jolly-apri">Usali</button></div>`;
  }
  // nel dettaglio di una carta
  function htmlDettaglio(id) {
    const j = n(), m = mancanoAl30(id); if (!j || !m) return "";
    const p = mancaProssimo(id);
    return `<div class="jolly-dett"><span>✪ Hai <b>${j}</b> potenziatori universali</span>
      ${p ? `<button class="btn piccolo" data-jolly-usa="${id}:${p}" ${p <= j ? "" : "disabled"}>+${p} per il prossimo livello</button>` : ""}
      <button class="btn piccolo" data-jolly-usa="${id}:${Math.min(j, m)}">Metti ${Math.min(j, m) === m ? `i ${m} che servono fino al 30` : `tutti i ${j}`}</button></div>`;
  }

  // la finestra per scegliere la carta
  function apri() {
    const j = n();
    const mie = possedute().filter(c => livello(c.id) < LIVELLO_MAX);
    const inSq = id => squadreDi(id).length ? 0 : 1;
    mie.sort((a, b) => inSq(a.id) - inSq(b.id) || mancaProssimo(a.id) - mancaProssimo(b.id) || livello(b.id) - livello(a.id));
    const riga = c => {
      const inf = infoCarta(c.id), p = mancaProssimo(c.id), sq = squadreDi(c.id);
      return `<div class="jolly-riga"><img src="${imgMini(c.id)}" alt="">
        <span class="jolly-testo"><b>${esc(c.nome)}</b><small><span class="stile s-${c.stile}">${c.stile}</span> Lv ${inf.liv} · potenziatori ${inf.pot}/${inf.servePot}${sq.length ? ` · squadra ${sq.join(", ")}` : ""}</small></span>
        <span class="jolly-btn">${inf.pronta ? `<button class="btn piccolo primario" data-jolly-potenzia="${c.id}" ${inf.puoi ? "" : "disabled"} title="${inf.serveMon} monete">Potenzia ▲</button>` : ""}
        <button class="btn piccolo" data-jolly-usa="${c.id}:1" ${j ? "" : "disabled"}>+1</button>
        ${p > 1 ? `<button class="btn piccolo" data-jolly-usa="${c.id}:${p}" ${p <= j ? "" : "disabled"}>+${p}</button>` : ""}</span></div>`;
    };
    apriModale(`<div class="jolly-fin"><h2>✪ Potenziatori universali</h2>
      <p class="jolly-conto">Ne hai <b>${j}</b></p>
      <p class="nota">Arrivano dalle carte che hanno raggiunto il livello 30 (i potenziatori che avanzavano non servivano più) e dalle carte <b>30 e lode</b>: ognuna che scende in campo in una battaglia vinta dà da 1 a 5 universali (quanti i potenziatori normali di quella battaglia) e 15 monete (non nell'Arena). Scegli tu su quale carta metterli e quanti: poi la potenzi come sempre, con le monete. <b>+N</b> mette quelli che mancano per il prossimo livello.</p>
      ${mie.length ? `<div class="jolly-lista">${mie.map(riga).join("")}</div>` : `<p class="nota">Tutte le tue carte sono già al livello 30!</p>`}</div>`);
  }

  document.addEventListener("click", e => {
    const t = e.target.closest && e.target.closest("[data-jolly-usa],[data-jolly-potenzia]"); if (!t) return;
    const inFinestra = !!t.closest(".jolly-fin");
    if (t.dataset.jollyPotenzia) { potenziaCarta(t.dataset.jollyPotenzia, null, true); if (inFinestra) apri(); return; }
    const [id, q] = t.dataset.jollyUsa.split(":"), fatti = usa(id, +q);
    if (!fatti) return;
    const [x, y] = FX.centro(t); FX.esplosione(x, y, { n: 26, forma: "stella", colori: ["#c9a4ff", "#ffffff", "#3fd8ff"], velocita: 6, dimensione: 5 });
    mostraAvviso(`✪ ${fatti} potenziatori universali messi su ${PER_ID[id].nome}.${infoCarta(id).pronta ? " Ora puoi potenziarla!" : ""}`);
    if (inFinestra) apri(); else { disegna(); apriDettaglio(id); }
  });

  return { n, sistema, usa, apri, htmlSquadra, htmlDettaglio, mancanoAl30 };
})();
