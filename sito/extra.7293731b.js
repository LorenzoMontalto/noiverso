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
    "cornice-maestro":   { tipo: "cornice", nome: "Cornice del Maestro", da: "Una carta con 5 stelle di maestria" },
    "cornice-diamante":  { tipo: "cornice", nome: "Cornice Diamante", da: "Grado Diamante in una stagione" },
    "cornice-leggenda":  { tipo: "cornice", nome: "Cornice Leggenda", da: "Grado Leggenda in una stagione" },
    // colore del nome
    "nome-neon":         { tipo: "nome", nome: "Nome Neon", prezzo: 900 },
    "nome-dorato":       { tipo: "nome", nome: "Nome Dorato", prezzo: 1500 },
    "nome-fuoco":        { tipo: "nome", nome: "Nome di Fuoco", da: "Livello giocatore 40" },
    "nome-arcobaleno":   { tipo: "nome", nome: "Nome Arcobaleno", da: "Livello giocatore 70" },
    "nome-arena":        { tipo: "nome", nome: "Nome del Campione d'Arena", da: "7 vittorie nell'Arena" },
    // sfondo della vetrina
    "sfondo-tramonto":   { tipo: "sfondo", nome: "Sfondo Tramonto", prezzo: 600 },
    "sfondo-citta":      { tipo: "sfondo", nome: "Sfondo Città di Notte", prezzo: 600 },
    "sfondo-galassia":   { tipo: "sfondo", nome: "Sfondo Galassia", prezzo: 1000 },
    "sfondo-oro":        { tipo: "sfondo", nome: "Sfondo d'Oro", da: "Livello giocatore 60" },
    "sfondo-noiverso":   { tipo: "sfondo", nome: "Sfondo Noiverso", da: "Livello giocatore 90" },
  };
  const TIPI = { cornice: "Cornice dell'avatar", nome: "Colore del nome", sfondo: "Sfondo della vetrina" };
  const stato = () => { if (!S.cosm || typeof S.cosm !== "object") S.cosm = { have: {}, cornice: "", nome: "", sfondo: "" }; return S.cosm; };
  const ha = id => !!stato().have[id];
  function sblocca(id, avvisa = true) {
    if (!CAT[id] || ha(id)) return false;
    const s = stato(); S.cosm = Object.assign({}, s, { have: Object.assign({}, s.have, { [id]: true }) });
    if (!S.cosm[CAT[id].tipo]) S.cosm[CAT[id].tipo] = id;   // il primo di un tipo si mette da solo
    if (avvisa) setTimeout(() => mostraAvviso(`Nuovo cosmetico: ${CAT[id].nome}! Lo trovi nel profilo.`), 900);
    return true;
  }
  function usa(tipo, id) { const s = stato(); if (id && (!ha(id) || CAT[id].tipo !== tipo)) return; S.cosm = Object.assign({}, s, { [tipo]: id || "" }); salva(); Archivio.pubblicaClassifica(); aggiornaTesta(); }
  // classi CSS (anche per gli altri giocatori, dai dati della classifica)
  const classeCornice = id => CAT[id] && CAT[id].tipo === "cornice" ? `cosm-${id}` : "";
  const classeNome = id => CAT[id] && CAT[id].tipo === "nome" ? `cosm-${id}` : "";
  const classeSfondo = id => CAT[id] && CAT[id].tipo === "sfondo" ? `cosm-${id}` : "";
  const avatar = (avatarId, corniceId, cls = "") => `<span class="cornice-avatar ${classeCornice(corniceId)}">${htmlAvatar(avatarId, cls)}</span>`;
  function htmlProfilo() {
    const s = stato();
    return Object.entries(TIPI).map(([tipo, nomeTipo]) => {
      const miei = Object.keys(CAT).filter(id => CAT[id].tipo === tipo && ha(id));
      return `<div class="cosm-riga"><b>${nomeTipo}</b><div class="filtri">
        <button class="chip" data-cosm-usa="${tipo}:" aria-pressed="${!s[tipo]}">Nessuno</button>
        ${miei.map(id => `<button class="chip cosm-chip ${tipo === "nome" ? classeNome(id) : ""}" data-cosm-usa="${tipo}:${id}" aria-pressed="${s[tipo] === id}">${esc(CAT[id].nome)}</button>`).join("")}
        ${miei.length ? "" : `<span class="nota">Ancora nessuno: si trovano nel negozio, con i livelli, la maestria, i gradi e l'Arena.</span>`}</div></div>`;
    }).join("");
  }
  return { CAT, ha, sblocca, usa, stato, classeCornice, classeNome, classeSfondo, avatar, htmlProfilo };
})();

// ---------------- Maestria delle carte ----------------
// Ogni carta ha 5 obiettivi suoi. Ogni obiettivo raggiunto è una stella: monete, punti Fama e, alla quinta, la Cornice del Maestro.
const Maestria = (() => {
  const OBIETTIVI = [
    { k: "v", n: 3,    testo: "Vinci 3 battaglie con questa carta scesa in campo", monete: 50,  fama: 10 },
    { k: "d", n: 1500, testo: "Fai 1.500 danni con questa carta", monete: 100, fama: 20 },
    { k: "o", n: 10,   testo: "Manda KO 10 carte nemiche con questa carta", monete: 150, fama: 30 },
    { k: "f", n: 10,   testo: "Usa 10 volte la sua mossa finale", monete: 250, fama: 40 },
    { k: "v", n: 25,   testo: "Vinci 25 battaglie con questa carta scesa in campo", monete: 400, fama: 60, frammenti: 30 },
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
        const p = { monete: ob.monete }; daiPremio(p);
        if (ob.frammenti) Frammenti.aggiungi(ob.frammenti, false);
        Livello.guadagna(ob.fama);
        avvisi.push(`Maestria ${PER_ID[x.id].nome} ${"★".repeat(m.presi.length)}: +${ob.monete} monete${ob.frammenti ? ` e ${ob.frammenti} frammenti` : ""}`);
        if (m.presi.length >= OBIETTIVI.length) Cosmetici.sblocca("cornice-maestro");
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
        return `<li class="${ok ? "fatto" : ""}"><span>${ok ? "★" : "☆"} ${esc(ob.testo)}</span><small>${ok ? "fatto" : `${v.toLocaleString("it-IT")} / ${ob.n.toLocaleString("it-IT")}`} · +${ob.monete} monete${ob.frammenti ? ` e ${ob.frammenti} ◈` : ""}</small></li>`; }).join("")}</ul>
      <p class="nota">Le stelle si prendono da sole giocando: contano le battaglie in cui questa carta è scesa in campo. Con 5 stelle sblocchi la Cornice del Maestro.</p></div>`;
  }
  return { OBIETTIVI, stelle, totaleStelle, fineBattaglia, htmlDettaglio };
})();

// ---------------- Frammenti ◈ ----------------
// Dosati: arrivano solo dai doppioni di carte già al 30 (oltre alle monete di sempre), dall'Arena e dalla maestria.
// Servono a creare una carta che NON hai ancora (non copie in più): così l'album si completa anche senza fortuna,
// ma resta un traguardo da giocatore che ha già tanto.
// Esempio: una bustina normale con tutte le carte al 30 dà in media circa 16 ◈; una leggendaria a scelta ne costa 1500 (circa 90 bustine).
const Frammenti = (() => {
  const DA_DOPPIONE = { comune: 2, rara: 4, epica: 10, leggendaria: 25 };
  const COSTO = { comune: 100, rara: 250, epica: 600, leggendaria: 1500 };
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
      <div><span class="codice-tag">${esc(SERIE[c.serie].simbolo)} ${esc(SERIE[c.serie].nome)} · ${esc(RARITA[c.rarita].nome)}</span><h2>Carta da scoprire</h2>
      <p>Puoi crearla con i <b>frammenti ◈</b>: costa <b>${costo}</b> e ne hai <b>${quanti()}</b>.</p>
      <p class="nota">I frammenti arrivano dai doppioni delle carte già al livello 30 (comune 2, rara 4, epica 10, leggendaria 25), dall'Arena e dalla maestria. Si possono usare solo per le carte che non hai ancora.</p>
      <div class="azioni"><button class="btn ${ok ? "oro" : ""}" data-fx="stelle" data-crea="${id}" ${ok ? "" : "disabled"}>${ok ? `Crea con ${costo} ◈` : `Ti mancano ${costo - quanti()} ◈`}</button><button class="btn" data-azione="chiudi">Chiudi</button></div></div></div>`);
  }
  return { DA_DOPPIONE, COSTO, quanti, aggiungi, daEsiti, crea, apriMistero };
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
  // il riquadro (anche per gli amici, dai dati della classifica)
  function htmlRiquadro(d) {
    const v = (d.vetrina || []).filter(id => PER_ID[id]);
    return `<div class="vetrina-profilo ${Cosmetici.classeSfondo(d.sfondo)}">
      <div class="vp-carte">${[0, 1, 2].map(i => v[i] ? htmlCarta(PER_ID[v[i]], { piccola: true, liv: 0, lode: false }) : `<div class="vp-vuota">${d.mio ? "Scegli una carta" : "—"}</div>`).join("")}</div>
      <div class="vp-numeri">
        <div><b>${d.livello ? Livello.badge(d.livello, "mini") : "–"}</b><span>Livello</span></div>
        <div><b>${esc(Gradi.nome(num(d.punti)))}</b><span>Grado</span></div>
        <div><b>${pct(num(d.vittorie), num(d.sconfitte))}%</b><span>Vittorie (${num(d.vittorie)}/${num(d.vittorie) + num(d.sconfitte)})</span></div>
        <div><b>${num(d.stelle)} ★</b><span>Maestria</span></div>
        <div><b>${d.preferita && PER_ID[d.preferita] ? esc(PER_ID[d.preferita].nome) : "–"}</b><span>Carta più usata</span></div>
        <div><b>${d.serie && SERIE[d.serie] ? `${SERIE[d.serie].simbolo} ${esc(SERIE[d.serie].nome)}` : "–"}</b><span>Serie preferita</span></div>
      </div></div>`;
  }
  const miei = () => ({ mio: true, vetrina: lista(), sfondo: Cosmetici.stato().sfondo, livello: S.lv ? Livello.info().liv : 1, punti: Gradi.mieiPunti(), vittorie: S.stats.vittorie, sconfitte: S.stats.sconfitte, stelle: Maestria.totaleStelle(), preferita: preferita(), serie: seriePreferita() });
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
      ${htmlRiquadro({ vetrina: r.vetrina || [], sfondo: r.sfondo, livello: num(r.livello), punti: num(r.punti), vittorie: num(r.vittorie), sconfitte: num(r.sconfitte), stelle: num(r.stelle), preferita: r.preferita, serie: r.seriePref })}
      <div class="azioni centro"><button class="btn" data-azione="chiudi">Chiudi</button></div></div>`);
  }
  return { fineBattaglia, preferita, seriePreferita, lista, metti, htmlProfilo, apriAmico, htmlRiquadro };
})();

// ---------------- Gradi della stagione ----------------
// Dai punti dal vivo del mese (quelli della classifica, calcolati dal server): Bronzo → Leggenda.
// A fine stagione (quando l'admin azzera la classifica) si riscuote il premio del grado più alto raggiunto.
const Gradi = (() => {
  const GRADI = [
    { nome: "Bronzo", da: 0, ico: "🥉", premio: null },
    { nome: "Argento", da: 9, ico: "🥈", premio: { monete: 300 } },
    { nome: "Oro", da: 21, ico: "🥇", premio: { monete: 600, bustine: { epica: 1 } } },
    { nome: "Platino", da: 36, ico: "💠", premio: { monete: 1000, bustine: { epica: 2 } } },
    { nome: "Diamante", da: 54, ico: "💎", premio: { monete: 1500, bustine: { leggendaria: 1 } }, cosm: "cornice-diamante" },
    { nome: "Leggenda", da: 75, ico: "👑", premio: { monete: 2500, bustine: { leggendaria: 1, ultra: 1 } }, cosm: "cornice-leggenda" },
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
  const PREMI = [{ monete: 100 }, { monete: 150 }, { monete: 250 }, { monete: 350, bustine: { normale: 1 } }, { monete: 450, bustine: { epica: 1 } },
    { monete: 600, bustine: { epica: 1 }, frammenti: 20 }, { monete: 800, bustine: { leggendaria: 1 }, frammenti: 40 }, { monete: 1000, bustine: { leggendaria: 1 }, frammenti: 100 }];
  const ABILITA = [.6, .68, .75, .82, .88, .93, .96];
  const stato = () => S.arena && typeof S.arena === "object" ? S.arena : null;
  const casuali = (rar, n, escludi = []) => { const pool = CARTE.filter(c => c.rarita === rar && !escludi.includes(c.id)); const out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id); return out; };
  const testoPremio2 = p => testoPremio(p) + (p.frammenti ? ` + ${p.frammenti} ◈` : "");
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
      <div class="arena-carte">${a.proposta.map(id => `<button class="arena-opzione" data-arena-scegli="${id}">${htmlCarta(PER_ID[id], { liv: 20 })}<small>${esc(RUOLI[PER_ID[id].ruolo].nome)} · ${esc(SERIE[PER_ID[id].serie].nome)}</small></button>`).join("")}</div>
      ${a.scelte.length ? `<p class="nota">Già scelte: ${a.scelte.map(id => esc(PER_ID[id].nome)).join(", ")}</p>` : ""}</div>`);
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
  return { INGRESSO, PREMI, entra, apriScelta, scegli, gioca, riscuoti, htmlSfida, stato };
})();

// ---------------- Offerte speciali del negozio ----------------
// Le bustine restano tutte come prima. In più, ogni giorno 3 offerte diverse per ogni giocatore:
// una carta che ti manca (mai leggendaria), potenziatori per una tua carta, un cosmetico.
const Offerte = (() => {
  const PREZZO_CARTA = { comune: 400, rara: 900, epica: 2000 }, POT = 20, PREZZO_POT = 300;
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
    const mancanti = CARTE.filter(c => !S.carte[c.id] && c.rarita !== "leggendaria");
    const carta = sorteggia(mancanti, seme + ":carta");
    if (carta) out.push({ k: "carta", id: carta.id, prezzo: PREZZO_CARTA[carta.rarita], titolo: `Carta ${RARITA[carta.rarita].nome.toLowerCase()} da scoprire · ${SERIE[carta.serie].nome}`, desc: "Una carta che non hai ancora: scopri chi è quando la compri." });
    const salgono = possedute().filter(c => infoCarta(c.id).liv < LIVELLO_MAX);
    const pot = sorteggia(salgono.filter(c => squadraAttiva().carte.includes(c.id)).length ? salgono.filter(c => squadraAttiva().carte.includes(c.id)) : salgono, seme + ":pot");
    if (pot) out.push({ k: "pot", id: pot.id, prezzo: PREZZO_POT, titolo: `${POT} potenziatori per ${pot.nome}`, desc: "Per farla salire di livello prima." });
    const cosm = sorteggia(Object.keys(Cosmetici.CAT).filter(id => Cosmetici.CAT[id].prezzo && !Cosmetici.ha(id)), seme + ":cosm");
    if (cosm) out.push({ k: "cosm", id: cosm, prezzo: Cosmetici.CAT[cosm].prezzo, titolo: Cosmetici.CAT[cosm].nome, desc: "Cosmetico: non cambia la forza, si vede in classifica e nel profilo." });
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
        ${o.k === "carta" ? htmlCarta(PER_ID[o.id], { piccola: true, coperta: !preso(o.k) }) : o.k === "pot" ? htmlCarta(PER_ID[o.id], { piccola: true }) : `<div class="off-cosm"><span class="cornice-avatar ${Cosmetici.classeCornice(o.id)}">${htmlAvatar(S.profilo.avatar)}</span><b class="${Cosmetici.classeNome(o.id)}">${esc(S.profilo.nome || "")}</b></div>`}
        <b>${esc(o.titolo)}</b><span class="nota">${esc(o.desc)}</span>
        ${preso(o.k) ? `<span class="nota">Comprato! Domani nuove offerte.</span>` : `<button class="btn oro" data-fx="monete" data-offerta-sp="${o.k}" ${S.monete >= o.prezzo ? "" : "disabled"}>${o.prezzo} <i class="moneta-ico"></i></button>`}
      </div>`).join("")}</div>`;
  }
  return { elenco, compra, html };
})();

// Cosmetici dei livelli giocatore (si sbloccano riscuotendo quei livelli)
if (typeof Livello !== "undefined" && Livello.premiExtra) {
  const PER_LIVELLO = { 30: "cornice-oro", 40: "nome-fuoco", 50: "cornice-arcobaleno", 60: "sfondo-oro", 70: "nome-arcobaleno", 90: "sfondo-noiverso", 100: "cornice-numero1" };
  for (const [L, id] of Object.entries(PER_LIVELLO)) Livello.premiExtra[L] = { id, testo: Cosmetici.CAT[id].nome, dai: () => Cosmetici.sblocca(id) };
}

// Controlli leggeri a ogni aggiornamento della testata: cosmetici dei livelli già riscossi (per chi li aveva presi prima) e grado della stagione
const Extra = {
  controlla() {
    if (!attivoExtra()) return;
    if (S.lv && Array.isArray(S.lv.riscossi)) for (const L of S.lv.riscossi) { const x = Livello.premiExtra[L]; if (x && x.id && !Cosmetici.ha(x.id)) Cosmetici.sblocca(x.id, false); }
    Gradi.controlla();
  },
};
