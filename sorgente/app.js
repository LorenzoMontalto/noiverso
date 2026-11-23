// ============================================================
//  APP: salvataggio, bustine, album, squadre, sfide, pass, classifica.
// ============================================================

const PREZZO_BUSTINA = 100;
const MONETE_INIZIALI = 300;
const MONETE_DOPPIONE_MAX = 25;   // doppione di una carta già al livello massimo
const CARTE_SQUADRA = 5;
const NUM_SQUADRE = 3;

const LIVELLI_SFIDA = [
  { id: "recluta",  nome: "Recluta",  rarita: ["comune", "rara"],       liv: [1, 3], abilita: 0.4,  premio: 40,  punti: 1, xp: 60, xpCarte: 1,
    desc: "Comuni e rare al livello 1–3. Per imparare." },
  { id: "sfidante", nome: "Sfidante", rarita: ["rara", "epica"],        liv: [6, 12], abilita: 0.65, premio: 70,  punti: 2, xp: 90, xpCarte: 1.5,
    desc: "Rare ed epiche, livello 6–12." },
  { id: "boss",     nome: "Boss",     rarita: ["epica", "leggendaria"], liv: [14, 22], abilita: 0.85, premio: 120, punti: 4, xp: 140, xpCarte: 2,
    desc: "Epiche e leggendarie, livello 14–22. Gioca bene." },
  { id: "leggenda", nome: "Leggenda", rarita: ["leggendaria", "epica"], liv: [25, 30], abilita: 1.0,  premio: 200, punti: 8, xp: 200, xpCarte: 2.6, lode: true,
    desc: "Il meglio del mazzo al livello 25–30, con la lode. Il massimo." },
];
const XP_SCONFITTA = 20, XP_BUSTINA = 15;

// Tipi di bustina: quante carte e con che probabilità esce l'ultima
const TIPI_BUSTINA = {
  benvenuto:   { nome: "Bustina di benvenuto", carte: 5, distinte: true, ultima: { rara: 80, epica: 20 },
    desc: "5 carte tutte diverse: abbastanza per la prima squadra." },
  normale:     { nome: "Bustina",              carte: 4, ultima: "peso4", desc: "4 carte, l'ultima almeno Rara." },
  epica:       { nome: "Bustina Epica",        carte: 4, ultima: { epica: 80, leggendaria: 20 }, desc: "4 carte, l'ultima almeno Epica." },
  leggendaria: { nome: "Bustina Leggendaria",  carte: 5, ultima: { leggendaria: 100 }, desc: "5 carte, l'ultima è Leggendaria (e può uscire in versione Ultra)." },
  ultra:       { nome: "Bustina Ultra",        carte: 5, ultima: { leggendaria: 100 }, versioneUltra: true, desc: "5 carte, l'ultima è la versione Ultra di una carta: cornice nera e oro e +10% in battaglia." },
};
// Bustine del negozio: classiche, mega, una per ogni serie e una per ogni stile (prezzi in monete)
Object.assign(TIPI_BUSTINA.benvenuto, { colore: "#ff6b7d" });
Object.assign(TIPI_BUSTINA.normale, { prezzo: PREZZO_BUSTINA, gruppo: "classiche", colore: "#ff2e46" });
Object.assign(TIPI_BUSTINA.epica, { prezzo: 300, gruppo: "classiche", colore: "#b866ff" });
Object.assign(TIPI_BUSTINA.leggendaria, { prezzo: 900, gruppo: "classiche", colore: "#f2c14e" });
Object.assign(TIPI_BUSTINA.ultra, { prezzo: 3000, gruppo: "classiche", colore: "#ffe9a8" });
TIPI_BUSTINA.mega = { nome: "Mega bustina", carte: 8, ultima: { epica: 85, leggendaria: 15 }, desc: "8 carte, l'ultima almeno Epica.", prezzo: 450, gruppo: "classiche", colore: "#3fd8ff", simbolo: "✚" };
for (const id of Object.keys(SERIE)) TIPI_BUSTINA[`serie-${id}`] = { serie: id, carte: 4, ultima: "peso4", prezzo: 150, gruppo: "serie",
  get nome() { return `Bustina ${SERIE[id].nome}`; }, get desc() { return `4 carte solo della serie ${SERIE[id].nome}, l'ultima almeno Rara.`; },
  get colore() { return SERIE[id].colore; }, get simbolo() { return SERIE[id].simbolo; } };
const COLORI_STILE = { FOR: "#ff7a45", VEL: "#3fd8ff", DIF: "#7ddc6a" };
for (const [id, st] of Object.entries(STILI)) TIPI_BUSTINA[`stile-${id}`] = { stile: id, nome: `Bustina ${st.nome}`, carte: 4, ultima: "peso4", prezzo: 150, gruppo: "stile",
  colore: COLORI_STILE[id], simbolo: id, desc: `4 carte di stile ${st.nome}, l'ultima almeno Rara.` };
const ORDINE_BUSTINE = ["benvenuto", "ultra", "leggendaria", "epica", "mega", "normale", ...Object.keys(TIPI_BUSTINA).filter(t => /^(serie|stile)-/.test(t))];
const SCONTO_OFFERTA = .3;

// Pass battaglia: 100 livelli. Ogni 10 livelli scegli tu tra due premi.
// Finito il pass, ogni 500 XP in più si apre uno scrigno a sorpresa (all'infinito).
const PASS = { stagione: 1, nome: "Notte in città", livelli: 100, xpLivello: 200, xpBonus: 500 };
const NOMI_BUSTINE = { normale: ["Bustina", "Bustine"], epica: ["Bustina Epica", "Bustine Epiche"], leggendaria: ["Bustina Leggendaria", "Bustine Leggendarie"], ultra: ["Bustina Ultra", "Bustine Ultra"] };
// Premi a scelta: [opzione A, opzione B]. pot = potenziatori da dare a una carta che scegli tu.
const SCELTE_PASS = {
  10: [{ bustine: { epica: 1 } }, { monete: 400 }],
  20: [{ bustine: { leggendaria: 1 } }, { pot: 50 }],
  30: [{ bustine: { epica: 2 } }, { monete: 800 }],
  40: [{ bustine: { leggendaria: 1 } }, { monete: 1000 }],
  50: [{ bustine: { leggendaria: 2 } }, { pot: 100 }],
  60: [{ bustine: { leggendaria: 1, epica: 1 } }, { monete: 1400 }],
  70: [{ bustine: { epica: 3 } }, { pot: 120 }],
  80: [{ bustine: { leggendaria: 2 } }, { monete: 2000 }],
  90: [{ bustine: { leggendaria: 2, epica: 1 } }, { pot: 150 }],
  100: [{ bustine: { leggendaria: 3 } }, { monete: 4000 }],
};
function testoPremio(p) {
  const parti = [];
  if (p.monete) parti.push(`${p.monete} monete`);
  for (const [t, n] of Object.entries(p.bustine || {})) if (n) parti.push(NOMI_BUSTINE[t] ? `${n > 1 ? n + " " : ""}${NOMI_BUSTINE[t][n > 1 ? 1 : 0]}` : `${n > 1 ? n + " × " : ""}${TIPI_BUSTINA[t] ? TIPI_BUSTINA[t].nome : t}`);
  if (p.pot) parti.push(p.casuale ? `+${p.pot} potenziatori${p.carta ? " a " + PER_ID[p.carta].nome : ""}` : `+${p.pot} potenziatori a una carta a scelta`);
  return parti.join(" + ");
}
function premioPass(l) {
  if (SCELTE_PASS[l]) return { scelta: SCELTE_PASS[l] };
  if (l % 5 === 0) return { bustine: { epica: 1 } };
  if (l % 3 === 0) return { bustine: { normale: 1 } };
  return { monete: 40 + l * 3 };
}
// Scrigno a sorpresa dopo il livello 100
function premioCasuale() {
  const x = Math.random() * 100;
  if (x < 38) return { monete: 150 + Math.floor(Math.random() * 6) * 50 };
  if (x < 62) return { bustine: { normale: 1 } };
  if (x < 80) return { bustine: { epica: 1 } };
  if (x < 94) return { pot: 25, casuale: true };
  return { bustine: { leggendaria: 1 } };
}

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const oggi = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const attesa = ms => new Promise(r => setTimeout(r, ms));
const ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------- Stato del giocatore ----------------
const IMPOSTAZIONI_BASE = { modalita: "classica", velocita: "normale", effetti: true, consigli: true, grafica: "alta" };
function statoNuovo() {
  return {
    v: 2, monete: MONETE_INIZIALI, carte: {},
    profilo: { nome: "", avatar: "" }, impostazioni: { ...IMPOSTAZIONI_BASE }, admin: false, adminPronto: false,
    squadre: Array.from({ length: NUM_SQUADRE }, (_, i) => ({ nome: `Squadra ${i + 1}`, carte: [] })), attiva: 0,
    inventario: { benvenuto: 1, normale: 0, epica: 0, leggendaria: 0 },
    ultimoGiorno: "",
    stats: { vittorie: 0, sconfitte: 0, punti: 0, bustine: 0 },
    pass: { xp: 0, riscossi: [], scelte: {}, bonus: 0, potInSospeso: 0 },
    storia: { stelle: {}, scrigni: [] },
    tutorial: { fatto: false },
    liv: {},      // livello di ogni carta (1–30): sale solo potenziandola a mano
    pot: {},      // potenziatori di ogni carta (arrivano dai doppioni)
    lodeXp: {},   // esperienza verso la lode, per le carte arrivate al 30
  };
}
let S = statoNuovo();

// Porta un salvataggio della versione precedente (squadre da 3, vecchi nomi) alla nuova
function migra(s) {
  if (!s) return null;
  if (s.v === 2) return s;
  const n = statoNuovo();
  n.monete = s.monete ?? n.monete;
  for (const [id, q] of Object.entries(s.carte || {})) { const nid = ID_VECCHI[id] || id; if (PER_ID[nid]) n.carte[nid] = (n.carte[nid] || 0) + q; }
  n.squadre[0].carte = (s.squadra || []).map(id => ID_VECCHI[id] || id).filter(id => n.carte[id]);
  n.inventario = { benvenuto: (s.stats && s.stats.bustine) ? 0 : 1, normale: s.bustineGratis || 0, epica: 0, leggendaria: 0 };
  n.ultimoGiorno = s.ultimoGiorno || "";
  n.stats = Object.assign(n.stats, s.stats || {});
  return n;
}

// Livello, potenziatori e costo del prossimo livello di una carta.
// dentro/serve: sotto il 30 è il riempimento dei potenziatori, al 30 l'esperienza verso la lode.
function infoCarta(id) {
  if (!S.carte[id]) return { liv: 0, dentro: 0, serve: 0, lode: false, pot: 0, servePot: 0, serveMon: 0, pronta: false, puoi: false };
  // i potenziatori promessi in uno scambio aperto non si possono usare per potenziare
  const liv = Math.min(LIVELLO_MAX, (S.liv || {})[id] || 1), pot = Math.max(0, ((S.pot || {})[id] || 0) - (typeof Scambi !== "undefined" ? Scambi.riservati(id) : 0)), lx = (S.lodeXp || {})[id] || 0;
  if (liv >= LIVELLO_MAX) return { liv, lode: lx >= XP_LODE, pot, dentro: Math.min(lx, XP_LODE), serve: XP_LODE, servePot: 0, serveMon: 0, pronta: false, puoi: false };
  const servePot = potPerLivello(liv), serveMon = monetePerLivello(liv), pronta = pot >= servePot;
  return { liv, lode: false, pot, dentro: Math.min(pot, servePot), serve: servePot, servePot, serveMon, pronta, puoi: pronta && (S.admin || S.monete >= serveMon) };
}
const livello = id => infoCarta(id).liv;
const haLode = id => infoCarta(id).lode;
const possedute = () => CARTE.filter(c => S.carte[c.id] > 0);
// In quali squadre è una carta (numeri da 1): serve a capire quali conviene potenziare
const squadreDi = id => (S.squadre || []).map((q, i) => (q.carte || []).includes(id) ? i + 1 : 0).filter(Boolean);
function htmlBadgeSquadra(id) {
  const sq = squadreDi(id); if (!sq.length) return "";
  const attiva = sq.includes((S.attiva || 0) + 1);
  const testo = sq.length === 1 ? `Squadra ${sq[0]}` : `Squadre ${sq.join(" · ")}`;
  return `<span class="badge-squadra ${attiva ? "attiva" : ""}" title="${attiva ? "Nella squadra che usi adesso" : "In una delle tue squadre"}">⚑ ${testo}</span>`;
}
const potenziabili = () => possedute().filter(c => infoCarta(c.id).puoi).length;
// Etichetta sulle carte: verde "▲ Potenzia" se puoi farla salire adesso,
// arancione con le monete che mancano se hai già i potenziatori ma non abbastanza monete.
function htmlEtichettaPot(info) {
  if (!info || !info.pronta) return "";
  if (info.puoi) return `<span class="potenziabile" title="Puoi potenziarla adesso" aria-label="Puoi potenziarla adesso"><b>▲</b><em>Potenzia</em></span>`;
  const manca = info.serveMon - S.monete;
  return `<span class="potenziabile manca" title="Hai i potenziatori: mancano ${manca} monete" aria-label="Mancano ${manca} monete per potenziarla"><b>▲</b><em>-${manca} 🪙</em></span>`;
}
const squadraAttiva = () => S.squadre[S.attiva] || S.squadre[0];
const livelloPass = () => Math.min(PASS.livelli, Math.floor(S.pass.xp / PASS.xpLivello));
const bonusDisponibili = () => Math.max(0, Math.floor((S.pass.xp - PASS.livelli * PASS.xpLivello) / PASS.xpBonus) - (S.pass.bonus || 0));
const daRiscuotere = () => { const l = livelloPass(); let n = 0; for (let i = 1; i <= l; i++) if (!S.pass.riscossi.includes(i)) n++; return n + bonusDisponibili(); };
const bustineTotali = () => Object.values(S.inventario).reduce((a, b) => a + b, 0);

// ============================================================
//  ARCHIVIO: unico punto che sa DOVE e PER CHI si salva.
//  - Online (pagina condivisa su Claude): ogni giocatore è il suo
//    account Claude; i dati stanno in data/users/<id>/<slot>.
//  - Sul dispositivo (riserva): profili locali scelti all'accesso.
//  - slot "partita" = gioco normale, slot "admin" = solo il proprietario.
//  Per Supabase basterà riscrivere questo oggetto.
// ============================================================
// I dati che arrivano dal database sono in sola lettura: modificarli fallisce in silenzio
// (per esempio "aggiungi questa carta alla collezione"). Ne faccio sempre una copia modificabile.
const copiaLibera = d => d == null ? d : JSON.parse(JSON.stringify(d));

const Archivio = {
  modo: "locale",
  db: null, user: null, uid: null, proprietario: false, nomeAccount: "",
  slot: "partita",
  profiloLocale: null,
  _inScrittura: false, _coda: {}, _localePiuNuovo: false,

  async init() {
    try {
      if (window.claude && typeof window.claude.use === "function") {
        const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
        this.user = user;
        if (user) {
          try { this.proprietario = !!(await Promise.resolve(user.isOwner && user.isOwner())); } catch (e) { this.proprietario = false; }
          try { const me = await user.me(); this.nomeAccount = (me && me.name) || ""; } catch (e) { /* senza nome */ }
        }
        if (db && user) {
          const id = await user.id();
          if (id) { this.db = db; this.uid = id; this.modo = "cloud"; }
        }
      }
    } catch (e) { this.modo = "locale"; }
  },
  get admin() { return this.slot === "admin"; },
  // online la copia locale è per account: su un dispositivo condiviso nessuno vede (o si porta via) i progressi di un altro
  _chiave() { return this.modo === "cloud" ? `noiverso-cloud-${this.uid}-${this.slot}` : `losnueve-${this.profiloLocale}-${this.slot}`; },
  _leggiLocale(k = this._chiave()) { try { const t = localStorage.getItem(k); return t ? JSON.parse(t) : null; } catch (e) { return null; } },
  _scriviLocale(s) { try { localStorage.setItem(this._chiave(), JSON.stringify(s)); } catch (e) { /* niente */ } },
  _ref() { return this.db.doc(`data/users/${this.uid}/${this.slot}`); },

  async aspettaScritture() { while (this._inScrittura || Object.keys(this._coda).length) await attesa(80); },
  async usaSlot(slot) { await this.aspettaScritture(); if (this._stopMio) { try { this._stopMio(); } catch (e) {} this._stopMio = null; } this.slot = slot; },
  _stopMio: null,
  ascoltaMio(cb) {
    if (this.modo !== "cloud" || !this.db) return;
    if (this._stopMio) { try { this._stopMio(); } catch (e) {} }
    const slot = this.slot;
    try {
      this._stopMio = this._ref().onSnapshot(snap => {
        const m = snap.metadata || {};
        if (m.fromCache || m.hasPendingWrites || !snap.exists) return;
        cb(copiaLibera(snap.data()), slot);
      }, () => { this._stopMio = null; });
    } catch (e) { this._stopMio = null; }
  },

  // Legge il salvataggio dal server. Il browser a volte risponde subito con una copia vecchia
  // (fromCache): aspetto quella confermata dal server, e solo se non arriva uso quello che ho.
  _leggiServer() {
    const ref = this._ref();
    return new Promise((ok, ko) => {
      let fatto = false, ultimo = null, stop = null;
      const fine = (v, err) => { if (fatto) return; fatto = true; try { stop && stop(); } catch (e) {} err ? ko(err) : ok(v); };
      try {
        stop = ref.onSnapshot(snap => { ultimo = snap; if (!snap.metadata || !snap.metadata.fromCache) fine(snap); }, e => fine(null, e));
        if (fatto && stop) { try { stop(); } catch (e) {} }
      } catch (e) { ref.get().then(sn => fine(sn), err => fine(null, err)); return; }
      setTimeout(() => { if (fatto) return; if (ultimo) fine(ultimo); else ref.get().then(sn => fine(sn), err => fine(null, err)); }, 5000);
      setTimeout(() => fine(null, { code: "timeout" }), 12000);
    });
  },
  async carica() {
    // la vecchia copia locale non diceva di quale account fosse: la tolgo, il salvataggio vero è sul server
    try { localStorage.removeItem(`losnueve-cloud-${this.slot}`); } catch (e) {}
    const locale = this._leggiLocale();
    this._localePiuNuovo = false;
    if (this.modo === "cloud") {
      try {
        const snap = await this._leggiServer();
        const server = snap && snap.exists ? copiaLibera(snap.data()) : null;
        // la copia su questo dispositivo è più recente (salvataggio non ancora arrivato al server): vince lei
        if (server && locale && (locale.rev || 0) > (server.rev || 0)) { this._localePiuNuovo = true; return locale; }
        if (server) return server;
        // prima volta online: si porta dietro i progressi della versione precedente (solo nella versione su Claude)
        return locale || (this.slot === "partita" && !window.NOIVERSO_SUPABASE ? this._leggiLocale("losnueve-partita-v1") : null);
      } catch (e) { this.modo = "locale"; this.profiloLocale = this.profiloLocale || "ospite"; mostraAvviso("Non riesco a leggere i salvataggi online: per ora gioco su questo dispositivo."); }
    }
    return locale;
  },

  async salva(stato) {
    const copia = JSON.parse(JSON.stringify(stato));
    this._scriviLocale(copia);
    if (this.modo !== "cloud") { aggiornaSalvataggio(); return; }
    // in coda per profilo (normale/admin): ognuno va sempre nel suo documento, anche se nel frattempo cambi profilo
    this._coda[this.slot] = { s: copia, ref: this._ref() };
    if (this._inScrittura) return;
    this._inScrittura = true;
    aggiornaSalvataggio("in-corso");
    while (Object.keys(this._coda).length) {
      const k = Object.keys(this._coda)[0], { s, ref } = this._coda[k]; delete this._coda[k];
      try { await ref.set(s); }
      catch (e) {
        if (e && e.code === "unavailable") { await attesa(800 + Math.random() * 800); try { await ref.set(s); continue; } catch (e2) { e = e2; } }
        if (e && e.code === "invalid_argument") { this.modo = "locale"; this.profiloLocale = this.profiloLocale || "ospite"; mostraAvviso(window.NOIVERSO_SUPABASE ? "Il server non accetta il salvataggio: per ora i progressi restano su questo dispositivo. Prova a uscire e rientrare." : "Non hai il permesso di salvare online: i progressi restano su questo dispositivo. Chiedi a chi ha creato il gioco di invitarti come Editor."); }
        else if (e && e.code === "quota_exceeded") mostraAvviso("Il database del gioco è pieno: avvisa chi l'ha creato.");
        else { this.modo = "locale"; this.profiloLocale = this.profiloLocale || "ospite"; mostraAvviso("Il salvataggio online non risponde: per ora i progressi restano su questo dispositivo."); }
      }
    }
    this._inScrittura = false;
    aggiornaSalvataggio();
  },

  async pubblicaClassifica() {
    if (this.modo !== "cloud" || this.admin) return; // l'admin non entra in classifica
    const voce = { punti: S.stats.punti, vittorie: S.stats.vittorie, sconfitte: S.stats.sconfitte,
      carte: possedute().length, pass: livelloPass(), nome: (S.profilo.nome || "").slice(0, 22), avatar: S.profilo.avatar || "", titolo_id: Trofei.titoloId(),
      aggiornato: new Date().toISOString() };
    const firma = JSON.stringify(Object.assign({}, voce, { aggiornato: 0 }));
    if (firma === this._ultimaVoce) return;
    try { await this.db.doc(`classifica/${this.uid}`).set(voce); this._ultimaVoce = firma; } catch (e) { /* la classifica è un extra */ }
  },

  // Impostazioni delle carte decise dall'admin (persona, serie, rarità): uguali per tutti
  async caricaConfig() {
    if (this.modo !== "cloud") return null;
    try {
      const snap = await Promise.race([this.db.doc("config/carte").get(), attesa(8000).then(() => null)]);
      return snap && snap.exists ? copiaLibera(snap.data()) : null;
    } catch (e) { return null; }
  },
  // Ascolta le impostazioni delle carte: la prima risposta può essere la copia salvata nel browser
  // (fromCache), quindi aspetta quella confermata dal database e poi segue i cambiamenti dal vivo.
  _stopConfig: null, _ultimaConfig: "",
  ascoltaConfig(cb) {
    if (this.modo !== "cloud") return Promise.resolve(null);
    return new Promise(res => {
      let risolta = false;
      const fine = v => { if (!risolta) { risolta = true; res(v); } };
      setTimeout(() => fine(undefined), 6000);
      try {
        this._stopConfig = this.db.doc("config/carte").onSnapshot(snap => {
          const dati = snap.exists ? copiaLibera(snap.data()) : null;
          const firma = JSON.stringify(dati || {});
          if (snap.metadata && snap.metadata.fromCache && !risolta) { this._cache = dati; return; }
          if (!risolta) { this._ultimaConfig = firma; fine(dati); return; }
          if (firma !== this._ultimaConfig) { this._ultimaConfig = firma; cb(dati); }
        }, () => fine(undefined));
      } catch (e) { fine(undefined); }
    });
  },
  async salvaConfig(cfg) {
    if (this.modo !== "cloud") throw { code: "locale" };
    await this.db.doc("config/carte").set(cfg);
  },

  _stopClassifica: null,
  ascoltaClassifica(cb, errore) {
    if (this.modo !== "cloud" || this._stopClassifica) return;
    this._stopClassifica = this.db.collection("classifica").orderBy("punti", "desc").limit(50)
      .onSnapshot(snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), e => { this._stopClassifica = null; errore && errore(e); });
  },
};

// Profili sul dispositivo (quando non si è online con l'account): più persone sullo stesso telefono
const Profili = {
  chiave: "losnueve-profili",
  leggi() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.chiave) || "null"); } catch (e) { d = null; }
    if (!d) {
      d = { lista: [] };
      // porta dentro la partita della versione precedente come primo profilo
      try {
        const vecchia = localStorage.getItem("losnueve-partita-v1");
        if (vecchia) { d.lista.push({ id: "p1", nome: "Giocatore 1", avatar: "" }); localStorage.setItem("losnueve-p1-partita", vecchia); }
      } catch (e) { /* niente */ }
      this.scrivi(d);
    }
    return d;
  },
  scrivi(d) { try { localStorage.setItem(this.chiave, JSON.stringify(d)); } catch (e) { /* niente */ } },
  aggiungi(nome, avatar) {
    const d = this.leggi();
    const id = "p" + Date.now().toString(36);
    d.lista.push({ id, nome, avatar });
    this.scrivi(d);
    return id;
  },
  aggiorna(id, dati) { const d = this.leggi(); const p = d.lista.find(x => x.id === id); if (p) { Object.assign(p, dati); this.scrivi(d); } },
};

// rev = numero del salvataggio: serve a capire quale copia è la più recente
function salva() { S.rev = (S.rev || 0) + 1; Archivio.salva(S); }

function aggiornaSalvataggio(fase) {
  const el = $("#salvataggio");
  if (!el) return;
  el.className = "salvataggio";
  if (fase === "in-corso") { el.textContent = "Salvataggio…"; el.classList.add("in-corso"); }
  else if (Archivio.modo !== "cloud") { el.textContent = "Salvato su questo dispositivo"; el.classList.add("locale"); }
  else { el.textContent = "Salvato online"; el.classList.add("ok"); }
}

function aggiornaTesta() {
  if (S.admin) { const m = $("#monete"); m.textContent = "∞"; m.dataset.valore = S.monete; }
  else FX.contatore($("#monete"), S.monete);
  const pb = $("#profilo-btn");
  if (pb) { pb.hidden = !S.profilo.nome; pb.innerHTML = `${htmlAvatar(S.profilo.avatar)}<span>${esc(S.profilo.nome || "")}</span>${S.admin ? `<em>Admin</em>` : ""}`; }
  const na = $('[data-vista="admin"]'); if (na) na.hidden = !S.admin;
  Trofei.controlla();
  const nst = $('[data-vista="strada"] .badge'); if (nst) { const q = Missioni.pronte(); nst.textContent = q; nst.hidden = !q; }
  const ns = $('[data-vista="storia"] .badge'); if (ns) { const q = scrigniPronti(); ns.textContent = q; ns.hidden = !q; }
  const nal = $('[data-vista="album"] .badge'); if (nal) { const q = potenziabili() + Trofei.pronti() + Scambi.inArrivo; nal.textContent = q; nal.hidden = !q; }
  const b = bustineTotali(), r = daRiscuotere();
  const nb = $('[data-vista="bustine"] .badge'), np = $('[data-vista="pass"] .badge');
  if (nb) { nb.textContent = b; nb.hidden = !b; }
  if (np) { np.textContent = r; np.hidden = !r; }
}

function bustinaDelGiorno() {
  if (S.ultimoGiorno === oggi()) return false;
  S.ultimoGiorno = oggi();
  S.inventario.normale++;
  salva();
  return true;
}

function aggiungiXP(n) {
  const prima = livelloPass();
  S.pass.xp += n;
  const dopo = livelloPass();
  return dopo > prima ? dopo : 0;
}

// ============================================================
//  CARTA (componente grafico)
// ============================================================
const PROB_OLO = 1 / 50;
// Leggendaria garantita: dopo 10 bustine di fila senza leggendarie, l'ultima carta dell'11ª è leggendaria.
// Esempio: apri 10 bustine normali e non esce nessuna leggendaria → la prossima ne ha una sicura, e il conto riparte da 0.
const PIETA = 10;
const mancaPieta = () => Math.max(1, PIETA + 1 - (S.pieta || 0));   // bustine da aprire per arrivare alla garantita (questa compresa)
function htmlPieta() {
  const n = mancaPieta();
  return `<p class="pieta-riga"><span class="pallino r-leggendaria"></span>${n <= 1 ? "<b>La prossima bustina ha una leggendaria garantita!</b>" : `Leggendaria garantita tra <b>${n}</b> bustine (se non ne trovi prima)`}<span class="pieta-barra"><i style="--p:${Math.round(Math.min(PIETA, S.pieta || 0) / PIETA * 100)}%"></i></span></p>`;
}
const haOlo = id => !!(S.olo && S.olo[id]);
// rarità attuale di una tua carta (con l'Ascesa può essere più alta di quella di partenza)
const rarCarta = id => PER_ID[id] ? rarDopo(PER_ID[id].rarita, (S.asc || {})[id]) : "comune";
function puoAscendere(id) {
  if (!S.carte[id] || infoCarta(id).liv < LIVELLO_MAX) return false;
  const r = rarCarta(id); return r !== "leggendaria" && (S.admin || S.monete >= ASCESA_MONETE[r]);
}
const haUltra = id => !!(S.ultra && S.ultra[id] && PER_ID[id] && PER_ID[id].ultra);
const PROB_ULTRA = .15;   // quando trovi una carta che ha la versione Ultra, 15 volte su 100 è Ultra (circa 1 bustina su 180, 1 Leggendaria su 18)
function htmlCarta(c, opz = {}) {
  const liv = opz.liv ?? livello(c.id);
  const lode = opz.lode ?? (opz.liv === undefined && haLode(c.id));
  const info = opz.liv === undefined && S.carte[c.id] ? infoCarta(c.id) : null;
  const coperta = opz.coperta;
  const rar = opz.rar || (opz.liv === undefined && S.carte[c.id] ? rarCarta(c.id) : c.rarita), salita = !coperta && rar !== c.rarita;
  return `
  <div class="carta r-${rar}${salita ? " ascesa" : ""}${coperta ? " sconosciuta" : ""}${opz.piccola ? " piccola" : ""}${opz.mini ? " mini" : ""}${!coperta && (opz.olo ?? (opz.liv === undefined && haOlo(c.id))) ? " olo" : ""}${!coperta && c.ultra && (opz.ultra ?? (opz.liv === undefined && haUltra(c.id))) ? " ultra" : ""}" data-id="${c.id}" ${opz.click ? 'role="button" tabindex="0"' : ""}>
    <img src="${imgCarta(c.id)}" alt="${coperta ? "Carta da scoprire" : esc(c.nome)}" loading="lazy" draggable="false">
    ${coperta ? `<div class="punto-domanda">?</div>` : opz.mini ? "" : `
    <div class="carta-testa"><span class="stile s-${c.stile}" title="${STILI[c.stile].nome}">${c.stile}</span><span class="serie-ico" style="--c:${SERIE[c.serie].colore}" title="${esc(SERIE[c.serie].nome)}">${SERIE[c.serie].simbolo}</span>${liv ? `<span class="liv ${lode ? "lode" : ""}">${lode ? "30 e lode" : `Lv ${liv}`}</span>` : ""}</div>
    ${htmlEtichettaPot(info)}${info && !opz.mini && puoAscendere(c.id) ? `<span class="potenziabile ascesa-pronta" title="Al 30: può salire di rarità"><b>⬆</b><em>Ascesa</em></span>` : ""}
    ${salita && !opz.mini ? `<span class="ascesa-tag" title="Salita di rarità: era ${esc(RARITA[c.rarita].nome.toLowerCase())}">⬆</span>` : ""}
    ${info && !opz.piccola && !opz.mini ? `<div class="carta-xp ${info.liv >= LIVELLO_MAX ? "verso-lode" : ""} ${info.lode ? "piena" : ""}"><i style="width:${info.lode ? 100 : Math.round(info.dentro / info.serve * 100)}%"></i></div>` : ""}
    <div class="carta-piede">
      ${!coperta && !opz.mini && (opz.olo ?? (opz.liv === undefined && haOlo(c.id))) ? `<div class="olo-scritta">✦ Olografica</div>` : ""}
      <div class="carta-nome">${esc(c.nome)}</div>
      <div class="carta-sotto"><span class="ruolo-tag">${esc(RUOLI[c.ruolo].nome)}</span> ${opz.piccola ? "" : `<span class="ruolo-cosa">${esc(RUOLI[c.ruolo].cosa)}</span>`}</div>
    </div>`}
  </div>`;
}

function descrMossa(mo) {
  const p = [];
  if (mo.pot) p.push(mo.colpi ? `Potenza ${mo.pot} ×${mo.colpi}` : `Potenza ${mo.pot}`);
  const e = mo.eff;
  if (e) {
    p.push({
      brucia: `brucia ${e.val}% PV per ${e.turni} turni`, stordisci: `${e.val}% di stordire`,
      indebolisci: `attacco nemico −${e.val}% per ${e.turni} turni`, ruba: `ruba ${e.val} energia`,
      potenzia: `attacco di tutta la squadra +${e.val}% per ${e.turni} turni`, scudo: `prossimo colpo −${e.val}%`,
      nebbia: "il prossimo attacco nemico va a vuoto", cura: `cura il ${e.val}% dei PV`, energia: `+${e.val} energia`,
    }[e.tipo]);
  }
  if (mo.drena) p.push(`cura il ${mo.drena}% dei danni`);
  if (mo.penetra) p.push(`ignora il ${mo.penetra}% della difesa`);
  return p.join(" · ");
}

// Statistiche con evidenziata quella potenziata dal tipo della carta
function htmlStatGriglia(c, s) {
  const su = { FOR: ["att"], DIF: ["dif"], VEL: ["vel"] }[c.stile] || [];
  const cella = (k, nome) => `<div class="${su.includes(k) ? `potenziata s-${c.stile}` : ""}"><b>${s[k]}</b><span>${nome}${su.includes(k) ? " ▲" : ""}</span></div>`;
  return `<div class="stat-griglia">${cella("pv", "PV")}${cella("att", "Attacco")}${cella("dif", "Difesa")}${cella("vel", "Velocità")}</div>`;
}
function htmlTipo(c) {
  const t = STILI[c.stile], debole = Object.entries(STILI).find(([, x]) => x.batte === c.stile);
  return `<p class="passiva tipo-riga"><b class="s-${c.stile}">${t.icona} Tipo ${esc(t.nome)}</b>: ${esc(t.bonus)}. Batte ${esc(STILI[t.batte].nome)}, soffre ${esc(debole[1].nome)}.</p>`;
}
function apriDettaglio(id) {
  const c = PER_ID[id], inf = infoCarta(id), liv = inf.liv || 1, lode = inf.lode, rar = rarCarta(id), s = statistiche(c, liv, lode, rar), r = RUOLI[c.ruolo];
  const copie = S.carte[id] || 0;
  apriModale(`
    <div class="dettaglio">
      <div class="dettaglio-carta" data-inclina>${htmlCarta(c, { liv, olo: haOlo(id), ultra: haUltra(id), rar })}</div>
      <div class="dettaglio-testo">
        <p class="serie-nome">${esc(SERIE[c.serie].nome)}</p>
        <h2>${esc(c.nome)}</h2>
        <p class="frase">${esc(c.frase)}</p>
        <div class="ruolo-box"><b>${esc(r.nome)}</b><span>${esc(r.cosa)}</span><p>${esc(r.passiva)}</p></div>
        ${htmlStatGriglia(c, s)}
        ${htmlBonusRarita(rar === c.rarita ? c : Object.assign({}, c, { rarita: rar }))}${rar !== c.rarita ? `<p class="nota">⬆ Salita di rarità: in origine era ${esc(RARITA[c.rarita].nome.toLowerCase())}.</p>` : ""}
        ${htmlTipo(c)}
        ${squadreDi(id).length ? `<p class="passiva"><b>⚑ In squadra:</b> ${squadreDi(id).map(n => esc(S.squadre[n - 1].nome || `Squadra ${n}`) + (n === (S.attiva || 0) + 1 ? " (quella che usi adesso)" : "")).join(", ")}.</p>` : ""}
        <ul class="mosse-lista">
          ${c.mosse.map(mo => `<li><span class="costo">${mo.costo}◆</span><b>${esc(mo.nome)}</b><small>${esc(descrMossa(mo))}</small></li>`).join("")}
        </ul>
        <div class="livello-box ${lode ? "lode" : ""}" id="livello-box">
          <div class="livello-riga"><b>${lode ? "Livello 30 e lode" : `Livello ${liv}`}</b><span>${lode ? "+5% a PV e danni" : liv < LIVELLO_MAX ? `Potenziatori ${inf.pot}/${inf.servePot}` : `Lode: ${inf.dentro}/${inf.serve} XP`}</span></div>
          <div class="xp-barra ${liv < LIVELLO_MAX ? "pot" : ""}"><i style="--p:${lode ? 100 : Math.round(inf.dentro / inf.serve * 100)}%"></i></div>
          ${copie && liv < LIVELLO_MAX ? (() => { const s2 = statistiche(c, liv + 1, false, rar), monOk = S.admin || S.monete >= inf.serveMon; return `
          <p class="prossimo">Al livello ${liv + 1}: PV ${s.pv} → <b>${s2.pv}</b> · Attacco ${s.att} → <b>${s2.att}</b> · Difesa ${s.dif} → <b>${s2.dif}</b>${s2.vel !== s.vel ? ` · Velocità ${s.vel} → <b>${s2.vel}</b>` : ""}</p>
          <div class="potenzia-riga">
            <span class="costi"><span class="${inf.pronta ? "ok" : "manca"}">${inf.servePot} potenziatori</span><span class="${monOk ? "ok" : "manca"}">${inf.serveMon} monete</span></span>
            <button class="btn primario" data-fx="stelle" data-azione="potenzia" data-id="${id}" ${inf.puoi ? "" : "disabled"}>Potenzia</button>
          </div>`; })() : ""}
          ${htmlAscesa(id)}
          ${haOlo(c.id) ? `<p class="olo-nota">✦ <b>Olografica</b>: +5% di PV e di danni in battaglia. Ne esce una ogni 50 carte circa.</p>` : ""}
          ${c.ultra ? (haUltra(c.id) ? `<p class="ultra-nota">◆ <b>Versione Ultra</b>: cornice nera e oro e +10% di PV e di danni in battaglia.</p>` : `<p class="nota">Questa carta ha anche una <b>versione Ultra</b> da trovare (+10% in battaglia): esce raramente quando la trovi in una bustina, sempre nella Bustina Ultra.</p>`) : ""}
          <p class="nota piccola">${lode ? "Ha la lode: è al massimo. I suoi doppioni ora danno monete." : liv < LIVELLO_MAX ? `Ogni doppione di questa carta dà ${POT_DOPPIONE[c.rarita]} potenziatori, e ogni battaglia vinta in cui scende in campo da 1 a 5.${!inf.pronta ? ` Te ne mancano ${inf.servePot - inf.pot}.` : !inf.puoi ? ` Ti mancano ${inf.serveMon - S.monete} monete.` : ""}` : "È al 30: continua a giocarci in battaglia per prendere la lode. I suoi doppioni ora danno monete."} · ${copie} ${copie === 1 ? "copia" : "copie"}</p>
        </div>
      </div>
    </div>`);
}

// Potenzia a mano una carta di un livello
function potenziaCarta(id, el, restaQui) {
  const inf = infoCarta(id);
  if (!inf.puoi) return;
  S.pot[id] = ((S.pot || {})[id] || 0) - inf.servePot;
  if (!S.admin) S.monete -= inf.serveMon;
  S.liv[id] = inf.liv + 1;
  Missioni.evento("potenzia", { id });
  salva();
  if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 40, forma: "stella", colori: ["#6fe3a0", "#3fd8ff", "#ffffff"], velocita: 7, dimensione: 5, durata: 1100 }); }
  if (restaQui) { ridisegnaSquadra(); mostraAvviso(`${PER_ID[id].nome} sale al livello ${S.liv[id]}!`); }
  else { disegna(); apriDettaglio(id); }
  const lb = $("#livello-box"); if (lb) FX.riavvia(lb, "sale");
  if (S.liv[id] === LIVELLO_MAX) mostraAvviso(`${PER_ID[id].nome} è al livello 30! Ora giocaci in battaglia per prendere la lode.`);
}

// ---------------- Statistiche delle carte (admin) ----------------
// Ogni battaglia manda al server le carte scese in campo e se hai vinto; l'admin vede per ogni carta quanto è usata
// e quanto vince, così si bilancia guardando i numeri veri. Esempio: 120 battaglie e 84 vinte = 70%: troppo forte.
const StatCarte = (() => {
  let dati = null, errore = null, ordine = "usate", carico = false;
  function registra(vinto, quale) {
    if (S.admin || !socialeAttivo() || !B) return;
    const carte = B.lati[0].squadra.filter(x => x.usata && S.carte[x.id]).map(x => x.id);
    if (carte.length) rpcSociale("registra_carte", { carte, vinto: !!vinto, quale }).catch(() => {});
  }
  async function carica() {
    carico = true; errore = null; ridisegna();
    try { dati = await rpcSociale("statistiche_carte", {}); } catch (e) { errore = "Non riesco a leggere le statistiche. Hai eseguito di nuovo schema.sql su Supabase?"; }
    carico = false; ridisegna();
  }
  function ridisegna() { const box = $("#admin-stat"); if (box) box.innerHTML = htmlAdmin(); }
  const perc = (u, v) => u ? Math.round(v / u * 100) : null;
  // sotto le 20 battaglie la percentuale dice poco: la mostro ma in grigio
  const cellaPerc = (u, v) => { const p = perc(u, v); if (p === null) return `<td class="st-vuota">—</td>`;
    return `<td class="${u < 20 ? "st-poche" : p >= 62 ? "st-forte" : p <= 38 ? "st-debole" : ""}">${p}%</td>`; };
  function righe() {
    const b = dati.battaglie || {}, p = dati.possesso || {}, g = Math.max(1, dati.giocatori || 0);
    const r = CARTE.map(c => { const pc = b[`${c.id}:pc`] || [0, 0], vi = b[`${c.id}:vivo`] || [0, 0], po = p[c.id] || [0, 0, 0];
      return { c, pc, vi, po, usate: pc[0] + vi[0], vince: perc(pc[0] + vi[0], pc[1] + vi[1]) ?? -1 }; });
    const chiavi = { usate: x => x.usate, vince: x => x.vince, vivo: x => x.vi[0], squadra: x => x.po[1], possesso: x => x.po[0], livello: x => x.po[2] };
    return r.sort((a, b) => chiavi[ordine](b) - chiavi[ordine](a) || a.c.nome.localeCompare(b.c.nome)).map(x => `<tr>
      <td class="st-nome"><span class="pallino r-${x.c.rarita}"></span>${esc(x.c.nome)} <small style="color:${SERIE[x.c.serie].colore}">${SERIE[x.c.serie].simbolo}</small></td>
      <td>${x.po[0]} <small>(${Math.round(x.po[0] / g * 100)}%)</small></td><td>${x.po[1]}</td><td>${x.po[2] || "—"}</td>
      <td>${x.pc[0]}</td>${cellaPerc(x.pc[0], x.pc[1])}<td>${x.vi[0]}</td>${cellaPerc(x.vi[0], x.vi[1])}</tr>`).join("");
  }
  function htmlAdmin() {
    const th = (k, t) => `<th><button class="st-ordina ${ordine === k ? "attivo" : ""}" data-admin="stat-ordina-${k}">${t}${ordine === k ? " ▾" : ""}</button></th>`;
    return `<h3>Statistiche delle carte</h3>
      <p class="nota">Per ogni carta: quanti giocatori ce l'hanno, quanti la tengono nella squadra attiva, il livello medio, e quante battaglie ha fatto (scesa in campo) con la percentuale di vittorie, contro il computer e dal vivo. In <b class="st-forte">rosso</b> le carte che vincono dal 62% in su, in <b class="st-debole">blu</b> quelle sotto il 38%; in grigio se le battaglie sono meno di 20 (troppo poche per giudicare). Le tue partite da admin non contano.</p>
      <div class="azioni"><button class="btn primario" data-admin="stat-carica" ${carico ? "disabled" : ""}>${dati ? "Aggiorna" : "Carica le statistiche"}</button>${dati ? `<button class="btn" data-admin="stat-azzera">Azzera le battaglie</button>` : ""}</div>
      ${errore ? `<p class="errore">${esc(errore)}</p>` : carico ? `<p class="nota">Carico…</p>` : !dati ? "" : `
      <p class="nota">${dati.giocatori} giocatori (admin esclusi).</p>
      <div class="st-scorri"><table class="st-tabella"><thead><tr><th>Carta</th>${th("possesso", "Ce l'hanno")}${th("squadra", "In squadra")}${th("livello", "Lv medio")}${th("usate", "Battaglie PC")}${th("vince", "Vince")}${th("vivo", "Dal vivo")}<th>Vince</th></tr></thead>
      <tbody>${righe()}</tbody></table></div>`}`;
  }
  async function azione(cosa, el) {
    if (cosa === "carica") return carica();
    if (cosa.startsWith("ordina-")) { ordine = cosa.slice(7); ridisegna(); return; }
    if (cosa === "azzera") {
      if (!el.dataset.sicuro) { el.dataset.sicuro = "1"; el.textContent = "Sicuro? Tocca di nuovo"; return; }
      try { await rpcSociale("azzera_statistiche_carte", {}); mostraAvviso("Battaglie azzerate: si riparte da zero (utile dopo aver cambiato le sinergie o una carta)."); } catch (e) { mostraAvviso(e.message); }
      return carica();
    }
  }
  return { registra, htmlAdmin, azione };
})();

// ---------------- Ascesa ----------------
// Al 30 una comune, rara o epica può salire di rarità: riparte dal livello 1 con la forza della rarità nuova.
function htmlAscesa(id) {
  const c = PER_ID[id], inf = infoCarta(id), ora = rarCarta(id);
  if (!S.carte[id] || ora === "leggendaria") return "";
  const dopo = rarDopo(c.rarita, ((S.asc || {})[id] || 0) + 1), costo = ASCESA_MONETE[ora];
  if (inf.liv < LIVELLO_MAX) return `<p class="nota piccola">⬆ <b>Ascesa</b>: al livello 30 questa carta potrà diventare ${esc(RARITA[dopo].nome.toLowerCase())} (${costo} monete).</p>`;
  const ok = S.admin || S.monete >= costo;
  return `<div class="ascesa-box r-${dopo}"><b>⬆ Ascesa: può diventare ${esc(RARITA[dopo].nome)}</b>
    <p>Riparte dal livello 1, ma con la forza di una ${esc(RARITA[dopo].nome.toLowerCase())}: arrivata di nuovo al 30 sarà più forte di adesso.</p>
    <div class="potenzia-riga"><span class="costi"><span class="${ok ? "ok" : "manca"}">${costo} monete</span></span><button class="btn primario" data-azione="ascesa" data-id="${id}" ${ok ? "" : "disabled"}>Fai salire</button></div></div>`;
}
function ascendiCarta(id, conferma, el) {
  const c = PER_ID[id], inf = infoCarta(id), ora = rarCarta(id);
  if (!c || !S.carte[id] || inf.liv < LIVELLO_MAX || ora === "leggendaria") return;
  const passi = ((S.asc || {})[id] || 0) + 1, dopo = rarDopo(c.rarita, passi), costo = ASCESA_MONETE[ora];
  if (!conferma) {
    const a = statistiche(c, LIVELLO_MAX, inf.lode, ora), b1 = statistiche(c, 1, false, dopo), b30 = statistiche(c, LIVELLO_MAX, false, dopo);
    apriModale(`<div class="codice-modale ascesa-conferma"><span class="codice-tag">Ascesa</span><h2>${esc(c.nome)} diventa ${esc(RARITA[dopo].nome.toLowerCase())}?</h2>
      <div class="ascesa-carte">${htmlCarta(c, { liv: LIVELLO_MAX, lode: inf.lode, olo: haOlo(id), ultra: haUltra(id), rar: ora })}<span class="scambio-freccia">→</span>${htmlCarta(c, { liv: 1, olo: haOlo(id), ultra: haUltra(id), rar: dopo })}</div>
      <table class="ascesa-tab"><tr><th></th><th>Adesso (Lv 30)</th><th>Dopo (Lv 1)</th><th>Dopo, di nuovo al 30</th></tr>
        ${[["PV", "pv"], ["Attacco", "att"], ["Difesa", "dif"], ["Velocità", "vel"]].map(([n, k]) => `<tr><td>${n}</td><td>${a[k]}</td><td>${b1[k]}</td><td><b>${b30[k]}</b></td></tr>`).join("")}</table>
      <p class="nota">Costa <b>${costo} monete</b>. Torna al livello 1${inf.lode ? " e perde la lode" : ""}: per riportarla su servono di nuovo potenziatori e monete. I potenziatori che hai già restano.</p>
      <div class="azioni centro"><button class="btn" data-azione="chiudi">Non ancora</button><button class="btn primario" data-fx="stelle" data-azione="ascesa-ok" data-id="${id}" ${S.admin || S.monete >= costo ? "" : "disabled"}>Fai salire (${costo} 🪙)</button></div></div>`);
    return;
  }
  if (!S.admin && S.monete < costo) { mostraAvviso(`Servono ${costo} monete.`); return; }
  if (!S.admin) S.monete -= costo;
  S.asc = Object.assign({}, S.asc, { [id]: passi });
  S.liv[id] = 1; if (S.lodeXp) S.lodeXp[id] = 0;
  S.stats.ascese = (S.stats.ascese || 0) + 1;
  salva(); aggiornaTesta();
  if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 70, forma: "stella", colori: ["#ffd76a", "#ff9bd2", "#ffffff"], velocita: 9, dimensione: 6, durata: 1400 }); }
  chiudiModale(); disegna(); apriDettaglio(id);
  mostraAvviso(`${c.nome} ora è ${RARITA[dopo].nome.toLowerCase()}! Riparte dal livello 1.`);
}

// ---------------- Modale e avvisi ----------------
function apriModale(html, opz = {}) {
  const m = $("#modale");
  $("#modale-corpo").innerHTML = html;
  m.hidden = false;
  m.dataset.bloccata = opz.bloccata ? "1" : "";
  $("#modale-chiudi").hidden = !!opz.bloccata;
  FX.riavvia($(".modale-scatola"), "entra");
}
function chiudiModale() {
  $("#modale").hidden = true; $("#modale-corpo").innerHTML = "";
  // chiusa la scelta della squadra senza scegliere: niente battaglia, si esce dallo schermo intero
  if (typeof scegliSquadra === "function" && scegliSquadra.poi) { scegliSquadra.poi = null; if (!B) schermoIntero(false); }
}

function mostraAvviso(testo) {
  const el = $("#avviso");
  el.textContent = testo;
  el.hidden = false;
  FX.riavvia(el, "entra");
  clearTimeout(mostraAvviso._t);
  mostraAvviso._t = setTimeout(() => { el.hidden = true; }, 5000);
}

// ============================================================
//  VISTE
// ============================================================
const VISTE = ["strada", "storia", "bustine", "negozio", "album", "squadra", "sfida", "pass", "classifica", "admin"];
let vista = "strada";
let filtroAlbum = "tutte", filtroSquadra = "tutte", albumScheda = "carte";
// Ricerca per tipo, serie e nome (album e squadre)
const filtri = { album: { tipo: "", ruolo: "", cerca: "" }, squadra: { tipo: "", ruolo: "", serie: "", cerca: "", pot: false } };
const normCerca = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
function passaFiltri(c, f) {
  if (f.tipo && c.stile !== f.tipo) return false;
  if (f.ruolo && c.ruolo !== f.ruolo) return false;
  if (f.serie && c.serie !== f.serie) return false;
  if (f.pot && !infoCarta(c.id).pronta) return false;
  const q = normCerca(f.cerca);
  return !q || normCerca(c.nome).includes(q) || normCerca(c.persona).includes(q);
}
function htmlBarraFiltri(dove, extra = "") {
  const f = filtri[dove];
  const chipTipo = ["", "FOR", "DIF", "VEL"].map(t => `<button class="chip ${t ? "s-" + t : ""}" data-fx="gelatina" data-filtra="${dove}:tipo:${t}" aria-pressed="${f.tipo === t}">${t ? `${STILI[t].icona} ${STILI[t].nome}` : "Tutti i tipi"}</button>`).join("");
  const chipSerie = "serie" in f ? `<div class="filtri filtri-riga"><span class="filtri-etichetta">Serie</span>${["", ...ORDINE_SERIE].map(s => `<button class="chip" data-fx="gelatina" data-filtra="${dove}:serie:${s}" aria-pressed="${f.serie === s}">${s ? SERIE[s].simbolo + " " + esc(SERIE[s].nome) : "Tutte"}</button>`).join("")}</div>` : "";
  const attivi = f.tipo || f.ruolo || f.cerca || f.serie || f.pot;
  const sceltaRuolo = `<label class="filtro-ruolo"><span class="filtri-etichetta">Ruolo</span><select data-filtra-ruolo="${dove}" aria-label="Filtra per ruolo">
      <option value="">Tutti i ruoli</option>${Object.entries(RUOLI).sort((a, b) => a[1].nome.localeCompare(b[1].nome)).map(([k, r]) => `<option value="${k}" ${f.ruolo === k ? "selected" : ""}>${esc(r.nome)} · ${esc(r.cosa)}</option>`).join("")}</select></label>`;
  return `<div class="barra-filtri">
    <div class="cerca-riga"><input type="search" class="cerca" data-cerca="${dove}" value="${esc(f.cerca)}" placeholder="Cerca per nome o persona…" autocomplete="off" aria-label="Cerca una carta">
      ${attivi ? `<button class="btn piccolo" data-filtra="${dove}:azzera:">Togli filtri</button>` : ""}</div>
    <div class="filtri filtri-riga"><span class="filtri-etichetta">Tipo</span>${extra}${chipTipo}</div>
    ${sceltaRuolo}
    ${chipSerie}
  </div>`;
}

function vai(v) {
  if (!VISTE.includes(v)) v = "strada";
  const cambiata = v !== vista;
  if (cambiata) selSq = null;
  vista = v;
  if (location.hash.slice(1) !== v) { try { history.replaceState(null, "", "#" + v); } catch (e) { location.hash = v; } }
  $$(".nav button").forEach(b => b.setAttribute("aria-current", b.dataset.vista === v ? "page" : "false"));
  spostaIndicatore();
  disegna();
  if (cambiata) FX.riavvia($("#vista"), "vista-entra");
}

function spostaIndicatore() {
  const b = $(`.nav button[data-vista="${vista}"]`), ind = $(".nav-indicatore");
  if (!b || !ind) return;
  ind.style.width = b.offsetWidth + "px";
  ind.style.transform = `translateX(${b.offsetLeft}px)`;
  if (b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "nearest" });
}

const FUNZIONI_VISTE = () => ({ strada: vistaStrada, bustine: vistaBustine, negozio: vistaNegozio, album: vistaAlbum, squadra: vistaSquadra, sfida: vistaSfida, pass: vistaPass, classifica: vistaClassifica, admin: vistaAdmin, storia: vistaStoria });
let ultimaVistaDisegnata = "";
function disegna() {
  aggiornaTesta();
  if (B && $("#azioni")) return;   // durante una battaglia la pagina sotto non si ridisegna (la classifica può aggiornarsi in qualsiasi momento)
  const main = $("#vista");
  main.classList.remove("quieta");
  main.innerHTML = FUNZIONI_VISTE()[vista]();
  ultimaVistaDisegnata = vista;
  if (vista === "classifica") avviaClassifica();
  if (vista === "pass") dopoPass();
  if (vista === "storia") dopoStoria();
}

// ---------- STRADA (home) ----------
function vistaStrada() {
  const tot = CARTE.length, mie = possedute().length;
  const b = bustineTotali(), r = daRiscuotere();
  const giocate = S.stats.vittorie + S.stats.sconfitte;
  const anteprima = ["reina", "gokiele", "zeutiz", "ironlus", "brolymone"].map(id => PER_ID[id]).filter(Boolean);
  return `${Online.htmlStrada()}
  ${Torneo.htmlStrada()}
  ${Settimana.htmlStrada()}
  <section class="eroe">
    <div class="eroe-testo">
      <h1 class="neon">Noiverso</h1>
      <p>Il gioco di carte del gruppo. Apri bustine, completa l'album, porta in strada la tua squadra di cinque e scala la classifica.</p>
      <div class="azioni">
        ${b ? `<button class="btn primario" data-fx="onda" data-azione="vai-bustine">Apri ${b === 1 ? "la tua bustina" : `le tue ${b} bustine`}</button>` : `<button class="btn primario" data-fx="onda" data-azione="vai-bustine">Vai all'edicola</button>`}
        <button class="btn" data-fx="spinta" data-azione="vai-sfida">Sfida il computer</button>
        ${r ? `<button class="btn oro" data-fx="coriandoli" data-azione="vai-pass">${r} ${r === 1 ? "premio" : "premi"} del pass</button>` : ""}
      </div>
    </div>
    <div class="ventaglio" aria-hidden="true">${anteprima.map(c => htmlCarta(c, { liv: 0, piccola: true })).join("")}</div>
  </section>
  ${Missioni.htmlStrada()}
  ${(() => { const p = prossimaTappa(); const c = p ? STORIA[p.k] : STORIA[STORIA.length - 1];
    return `<section class="storia-banner" style="--c:${c.colore}">
      <img src="${imgCarta(p ? c.tappe[p.i].parla : "aresorenzo")}" alt="">
      <div><p class="serie-nome">Modalità storia · ${stelleTotali()}/${STORIA.length * 18} ★</p>
        <h2>${p ? `Capitolo ${p.k + 1}: ${esc(c.titolo)}` : "Storia completata!"}</h2>
        <p class="nota">${p ? `Prossima tappa: ${esc(c.tappe[p.i].titolo)}. Vinci per sbloccare monete, bustine e il resto della storia.` : "Rigioca le tappe per prendere tutte le stelle e aprire gli scrigni."}</p></div>
      <button class="btn primario" data-fx="onda" data-azione="vai-storia">${p ? "Continua la storia" : "Apri la mappa"}</button>
    </section>`; })()}
  <section class="riquadri">
    <div class="riquadro"><span>Album</span><b>${mie}<small>/${tot}</small></b><div class="barra"><i style="--p:${Math.round(mie / tot * 100)}%"></i></div></div>
    <div class="riquadro"><span>Vittorie</span><b>${S.stats.vittorie}<small> su ${giocate}</small></b></div>
    <div class="riquadro"><span>Pass</span><b>Lv ${livelloPass()}<small>/${PASS.livelli}</small></b><div class="barra oro"><i style="--p:${(S.pass.xp % PASS.xpLivello) / PASS.xpLivello * 100}%"></i></div></div>
    <div class="riquadro"><span>Punti classifica</span><b>${(() => { const io = classificaDati && classificaDati.find(r => r.id === Archivio.uid); return io ? Number(io.punti) || 0 : 0; })()}</b></div>
  </section>
  <section class="regole">
    <div class="titolo-riga"><h2>Come si gioca</h2><button class="btn piccolo" data-fx="salto" data-azione="rifai-tutorial">Rifai il tutorial</button></div>
    <ol>
      <li><b>Bustine.</b> Ogni giorno ricevi una bustina gratis; le altre le compri nel <b>Negozio</b> (classiche, per serie e per stile) o arrivano dal pass. Le apri dalla pagina Bustine. La prima è di benvenuto: 5 carte tutte diverse.</li>
      <li><b>Potenziare.</b> Le carte salgono di livello solo se le potenzi tu, dal dettaglio della carta (il segno ▲ verde dice quando puoi). Ogni doppione dà potenziatori per quella carta: ${POT_DOPPIONE.comune} se è Comune, ${POT_DOPPIONE.rara} Rara, ${POT_DOPPIONE.epica} Epica, ${POT_DOPPIONE.leggendaria} Leggendaria. Ogni livello costa potenziatori e monete, sempre di più: da ${potPerLivello(1)} potenziatori e ${monetePerLivello(1)} monete per il livello 2 fino a ${potPerLivello(29)} e ${monetePerLivello(29)} per il 30. Ogni livello dà +2% a PV e danni.</li>
      <li><b>30 e lode.</b> Una carta al 30 fa esperienza in battaglia: dopo ${XP_LODE} XP prende la lode, che la potenzia di un altro 5%. I doppioni di una carta al 30 danno monete.</li>
      <li><b>Squadre.</b> Prepari fino a ${NUM_SQUADRE} squadre da ${CARTE_SQUADRA}, nell'ordine che vuoi: la prima entra in campo per prima.</li>
      <li><b>Battaglia.</b> Cinque contro cinque. Ogni turno scegli una mossa, <i>Carica</i> (+2 energia e ti proteggi) o un cambio. Ogni carta fa una sola mossa per turno: la più veloce attacca per prima (a pari velocità si alterna). L'energia è della squadra: si parte da 3 e si guadagnano 2 punti a turno.</li>
      <li><b>Classifica.</b> Si fanno punti solo con le sfide dal vivo contro gli amici online: +3 per ogni vittoria, 0 per le sconfitte.</li>
      <li><b>Tipi.</b> Ogni carta è di un tipo che potenzia una sua statistica: <span class="s-FOR stile">FOR</span> Forza +25% attacco, <span class="s-DIF stile">DIF</span> Difesa +5% difesa, <span class="s-VEL stile">VEL</span> Velocità +5 velocità e +15% attacco (a parità di livello una carta Velocità attacca sempre prima delle altre). Potenziando salgono attacco, difesa, velocità e PV di tutte le carte, e la statistica del tipo sale di più. Forza batte Difesa, Difesa batte Velocità, Velocità batte Forza: il vantaggio vale ×1,3, lo svantaggio ×0,8.</li>
      <li><b>Pass.</b> Ogni sfida e ogni bustina danno punti esperienza. Ogni livello del pass sblocca un premio.</li>
    </ol>
  </section>`;
}

// ---------- BUSTINE ----------
function htmlBustina(t, spenta) {
  const T = TIPI_BUSTINA[t];
  return `<div class="bustina-3d b-${t}${spenta ? " spenta" : ""}" style="--c:${T.colore || "var(--neon)"}" data-inclina><div class="bustina-faccia">${T.simbolo ? `<i class="bustina-simbolo">${T.simbolo}</i>` : ""}<span>NOI<br>VERSO</span><small>${T.carte} carte</small></div></div>`;
}
function vistaBustine() {
  const disponibili = ORDINE_BUSTINE.filter(t => S.inventario[t] > 0);
  const tot = disponibili.reduce((a, t) => a + S.inventario[t], 0);
  return `
  <section>
    <div class="titolo-riga"><h2>Le tue bustine</h2><p class="nota">${tot ? `Ne hai ${tot} da aprire. Ogni bustina aperta dà ${XP_BUSTINA} XP al pass.` : "Non hai bustine da aprire."}</p>
      <button class="btn oro" data-fx="salto" data-azione="vai-negozio">Vai al negozio</button></div>
    ${htmlPieta()}
    ${disponibili.length ? `<div class="scaffale">
      ${disponibili.map(t => `
        <div class="bustina-box">
          ${htmlBustina(t)}
          <b>${esc(TIPI_BUSTINA[t].nome)}</b>
          <span class="nota">${esc(TIPI_BUSTINA[t].desc)}</span>
          <button class="btn primario" data-fx="onda" data-apri="${t}">Apri${S.inventario[t] > 1 ? ` · ne hai ${S.inventario[t]}` : ""}</button>
        </div>`).join("")}
    </div>` : `<div class="vuoto-bustine">
      ${htmlBustina("normale", true)}
      <p>Ogni giorno ne ricevi una gratis. Le altre le trovi nel negozio, nel pass e negli scrigni della storia.</p>
      <button class="btn primario" data-fx="onda" data-azione="vai-negozio">Compra bustine</button>
    </div>`}
  </section>`;
}

// ---------- NEGOZIO ----------
function offertaDelGiorno() {
  const tipi = ORDINE_BUSTINE.filter(t => TIPI_BUSTINA[t].prezzo && t !== "normale");
  let h = 0; for (const ch of oggi()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const t = tipi[h % tipi.length];
  return { t, prezzo: Math.round(TIPI_BUSTINA[t].prezzo * (1 - SCONTO_OFFERTA) / 10) * 10, presa: S.offerta === oggi() };
}
function htmlProdotto(t) {
  const T = TIPI_BUSTINA[t], n = S.inventario[t] || 0, ev = Settimana.inEvidenza(t), prezzo = Settimana.prezzo(t);
  return `<div class="prodotto ${ev ? "in-evidenza" : ""}" style="--c:${T.colore}">
    ${ev ? `<span class="ev-etichetta">Serie della settimana · −${Math.round(Settimana.SCONTO * 100)}%</span>` : ""}
    ${htmlBustina(t)}
    <b>${esc(T.nome)}</b>
    <span class="nota">${esc(T.desc)}</span>
    ${n ? `<span class="ne-hai">Ne hai ${n}</span>` : ""}
    <div class="prodotto-prezzi">
      ${ev ? `<s class="nota">${T.prezzo}</s>` : ""}<button class="btn primario" data-fx="monete" data-compra="${t}:1" ${S.admin || S.monete >= prezzo ? "" : "disabled"}>${prezzo} <i class="moneta-ico"></i></button>
      <button class="btn" data-fx="monete" data-compra="${t}:5" ${S.admin || S.monete >= prezzo * 5 ? "" : "disabled"}>×5 · ${prezzo * 5}</button>
    </div>
  </div>`;
}
function vistaNegozio() {
  const off = offertaDelGiorno(), TO = TIPI_BUSTINA[off.t];
  const peso = ORDINE_RARITA.reduce((a, r) => a + RARITA[r].peso, 0);
  const gruppo = (g, titolo, nota) => `<div class="titolo-riga piccola"><h3>${titolo}</h3><p class="nota">${nota}</p></div>
    <div class="vetrina">${ORDINE_BUSTINE.filter(t => TIPI_BUSTINA[t].gruppo === g).map(htmlProdotto).join("")}</div>`;
  const segreti = (S.codici || []).filter(x => x.titolo);
  return `
  <section class="negozio">
    <div class="titolo-riga"><h2>Negozio</h2><p class="nota">Hai <b>${S.admin ? "∞" : S.monete}</b> monete. Le bustine che compri finiscono in <b>Bustine</b>, pronte da aprire.</p></div>
    <div class="offerta" style="--c:${TO.colore}">
      <div class="offerta-etichetta">Offerta del giorno · −${Math.round(SCONTO_OFFERTA * 100)}%</div>
      ${htmlBustina(off.t, off.presa)}
      <div class="offerta-info">
        <b>${esc(TO.nome)}</b><span class="nota">${esc(TO.desc)}</span>
        <div class="prodotto-prezzi">${off.presa ? `<span class="nota">Presa! Domani arriva un'altra offerta.</span>`
          : `<s>${TO.prezzo}</s><button class="btn oro" data-fx="monete" data-compra="${off.t}:offerta" ${S.admin || S.monete >= off.prezzo ? "" : "disabled"}>${off.prezzo} <i class="moneta-ico"></i></button><small class="nota">una sola al giorno</small>`}</div>
      </div>
    </div>
    ${gruppo("classiche", "Classiche", "Da tutte le serie.")}
    ${gruppo("serie", "Per serie", "Solo carte di una serie: per completare l'album.")}
    ${gruppo("stile", "Per stile", "Solo carte di uno stile: per costruire la squadra.")}
    ${Graffiti.htmlNegozio()}
    ${Zaino.htmlNegozio()}
    <div class="codice-box">
      <h3>Codice promozionale</h3>
      <p class="nota">Hai un codice? Scrivilo qui. Alcuni nascondono delle sorprese…</p>
      <form id="form-codice-promo" class="codice-riga" autocomplete="off">
        <input id="codice-input" maxlength="40" placeholder="Scrivi il codice" autocapitalize="characters" spellcheck="false">
        <button class="btn primario" data-fx="onda" type="submit">Usa</button>
      </form>
      <p id="codice-esito" class="nota" aria-live="polite"></p>
      ${segreti.length ? `<div class="segreti"><span class="nota">Sorprese trovate:</span> ${segreti.map(x => `<button class="chip" data-fx="gelatina" data-riapri-codice="${esc(x.codice)}">${esc(x.titolo)}</button>`).join("")}</div>` : ""}
    </div>
    ${htmlPieta()}
    <table class="probabilita">
      <caption>Probabilità per carta nella bustina classica</caption>
      <thead><tr><th>Rarità</th><th>Prime carte</th><th>Ultima carta</th></tr></thead>
      <tbody>${ORDINE_RARITA.map(r => `<tr><td><span class="pallino r-${r}"></span>${RARITA[r].nome}</td><td>${(RARITA[r].peso / peso * 100).toFixed(1)}%</td><td>${RARITA[r].peso4}%</td></tr>`).join("")}</tbody>
    </table>
  </section>`;
}
function compraBustina(arg, el) {
  const [t, q] = arg.split(":"), T = TIPI_BUSTINA[t];
  if (!T || !T.prezzo) return;
  const off = offertaDelGiorno();
  let n = 1, costo = T.prezzo;
  if (q === "offerta") { if (off.t !== t || off.presa) return; costo = off.prezzo; S.offerta = oggi(); }
  else { n = +q || 1; costo = Settimana.prezzo(t) * n; }
  if (!S.admin && S.monete < costo) { mostraAvviso("Non hai abbastanza monete."); return; }
  if (!S.admin) S.monete -= costo;
  S.inventario[t] = (S.inventario[t] || 0) + n;
  salva(); aggiornaTesta();
  FX.volaIcona(el, $('[data-vista="bustine"]'), "b-normale");
  mostraAvviso(`${n > 1 ? n + " × " : ""}${T.nome} ${n > 1 ? "aggiunte" : "aggiunta"}: la apri nella pagina Bustine.`);
  disegna();
}

// ---------- CODICI PROMOZIONALI ----------
// I codici e le sorprese stanno solo su Supabase (tabella "codici"): qui nel codice del gioco non c'è nessun segreto.
async function chiediCodice(c) {
  if (!window.NOIVERSO_SUPABASE) throw new Error("I codici funzionano solo nella versione online del gioco.");
  const { data, error } = await window.NoiversoAccesso.sb.rpc("riscatta_codice", { c, prova: !!S.admin });
  if (error) throw new Error(/non valido|già usato|esaurito|accesso/i.test(error.message) ? error.message : "Non riesco a controllare il codice. Sei collegato a internet?");
  return data;
}
async function usaCodice() {
  const inp = $("#codice-input"), out = $("#codice-esito"), c = (inp.value || "").trim();
  if (!c) return;
  out.textContent = "Controllo il codice…";
  try { const p = await chiediCodice(c); inp.value = ""; out.textContent = ""; applicaCodice(p); }
  catch (e) { out.innerHTML = `<b class="errore">${esc(e.message)}</b>`; FX.riavvia(inp, "fx-scuoti"); }
}
async function riapriCodice(c) {
  try { applicaCodice(await chiediCodice(c)); } catch (e) { mostraAvviso(e.message); }
}
function applicaCodice(p) {
  const parti = [];
  if (!p.gia) {
    if (p.monete) { S.monete += +p.monete; parti.push(`${p.monete} monete`); }
    for (const [t, n] of Object.entries(p.bustine || {})) if (TIPI_BUSTINA[t] && n > 0) { S.inventario[t] = (S.inventario[t] || 0) + +n; parti.push(`${n > 1 ? n + " × " : ""}${TIPI_BUSTINA[t].nome}`); }
    for (let k = 0; k < Math.min(20, +p.bombolette || 0); k++) { const g = Graffiti.dai(Graffiti.pesca()); parti.push(`graffito «${Graffiti.info(g.id).nome}»`); }
    for (const [id, n] of Object.entries(p.oggetti || {})) { const o = Zaino.info(id), q = Math.min(20, Math.max(0, +n || 0)); if (!o.nome || !q) continue;
      if (!S.zaino) S.zaino = { oggetti: {}, porta: [] }; S.zaino.oggetti[id] = (S.zaino.oggetti[id] || 0) + q; parti.push(`${q > 1 ? q + " × " : ""}${o.icona} ${o.nome}`); }
    // carte precise: come se le trovassi in una bustina (se ce l'hai già diventa un doppione: potenziatori, o monete se è al 30)
    for (const id of (Array.isArray(p.carte) ? p.carte : []).slice(0, 40)) {
      const c = PER_ID[id]; if (!c) continue;
      const prima = S.carte[id] || 0, inf = infoCarta(id);
      S.carte[id] = prima + 1;
      if (!prima) { S.liv[id] = S.liv[id] || 1; parti.push(c.nome); }
      else if (inf.liv >= LIVELLO_MAX) { S.monete += MONETE_DOPPIONE_30[c.rarita]; parti.push(`${c.nome} (doppione: +${MONETE_DOPPIONE_30[c.rarita]} monete)`); }
      else { S.pot[id] = (S.pot[id] || 0) + POT_DOPPIONE[c.rarita]; parti.push(`${c.nome} (doppione: +${POT_DOPPIONE[c.rarita]} potenziatori)`); }
    }
  }
  if (p.ripetibile && p.titolo && !p.prova) {   // le sorprese ripetibili si possono riaprire dal negozio
    const lista = (S.codici || []).filter(x => x.codice !== p.codice);
    S.codici = [...lista, { codice: p.codice, titolo: String(p.titolo).slice(0, 40) }];
  }
  salva(); aggiornaTesta();
  effettoCodice(p.effetto);
  const premio = parti.length ? `<p class="codice-premio">Hai ricevuto: <b>${parti.map(esc).join(" · ")}</b></p>` : "";
  if (p.pagina) { apriPaginaSegreta(p.pagina, p.titolo); if (parti.length) mostraAvviso(`Hai ricevuto: ${parti.join(" · ")}`); }
  else apriModale(`<div class="codice-modale">
      <span class="codice-tag">${p.prova ? "Prova admin · " : ""}Codice ${esc(p.codice)}</span>
      <h2>${esc(p.titolo || "Codice valido!")}</h2>
      ${p.messaggio ? `<div class="codice-testo">${esc(p.messaggio).replace(/\n/g, "<br>")}</div>` : ""}
      ${premio || (p.gia ? `<p class="nota">I premi di questo codice li avevi già ricevuti.</p>` : "")}
      <div class="azioni centro"><button class="btn primario" data-azione="chiudi">Grande!</button></div>
    </div>`);
  if (vista === "negozio") setTimeout(disegna, 50);
}
function effettoCodice(tipo) {
  if (!tipo || ridotto) return;
  const W = innerWidth, H = innerHeight;
  const colori = { coriandoli: ["#f2c14e", "#ff2e46", "#3fd8ff", "#ffffff"], girasoli: ["#FFC21A", "#F2A400", "#FFD84D", "#557A26"], stelle: ["#ffffff", "#f2c14e", "#d08cff"] }[tipo];
  if (tipo === "monete") { for (let k = 0; k < 4; k++) setTimeout(() => FX.volaMonete($("#vista"), $(".monete"), 12), k * 250); return; }
  if (colori) for (let k = 0; k < 4; k++) setTimeout(() => FX.esplosione(W * (.2 + .2 * k), H * .35, { n: 50, forma: tipo === "stelle" ? "stella" : "coriandolo", colori, velocita: 9, dimensione: 5 }), k * 180);
}
function apriPaginaSegreta(html, titolo) {
  const ov = document.createElement("div");
  ov.id = "pagina-segreta";
  ov.innerHTML = `<iframe sandbox="allow-scripts" title="${esc(titolo || "Sorpresa")}"></iframe><button class="btn pagina-chiudi" type="button">✕ Torna al gioco</button>`;
  ov.querySelector("iframe").srcdoc = html;
  ov.querySelector(".pagina-chiudi").addEventListener("click", () => ov.remove());
  document.body.appendChild(ov);
}

function pescaDa(pesi) {
  const voci = typeof pesi === "string" ? ORDINE_RARITA.map(r => [r, RARITA[r][pesi]]) : Object.entries(pesi);
  const tot = voci.reduce((a, [, p]) => a + p, 0);
  let x = Math.random() * tot;
  for (const [r, p] of voci) { x -= p; if (x < 0) return r; }
  return voci[voci.length - 1][0];
}

function apriBustina(tipo) {
  const T = TIPI_BUSTINA[tipo];
  const uscite = [];
  const pietaOra = (S.pieta || 0) >= PIETA;
  for (let i = 0; i < T.carte; i++) {
    const r = pietaOra && i === T.carte - 1 ? "leggendaria" : pescaDa(i < T.carte - 1 ? "peso" : T.ultima);
    const vale = c => (!T.serie || c.serie === T.serie) && (!T.stile || c.stile === T.stile);
    let pool = CARTE.filter(c => c.rarita === r && vale(c));
    // Bustina Ultra: l'ultima è una delle carte con la versione Ultra (prima quelle che non hai ancora Ultra)
    if (T.versioneUltra && i === T.carte - 1) { const tutte = CARTE.filter(c => c.ultra), nuove = tutte.filter(c => !haUltra(c.id)); pool = (nuove.length ? nuove : tutte).length ? (nuove.length ? nuove : tutte) : pool; }
    // se la serie (o lo stile) non ha carte di quella rarità, prende la rarità più vicina
    const k = ORDINE_RARITA.indexOf(r);
    for (let d = 1; !pool.length && d < ORDINE_RARITA.length; d++)
      for (const kk of [k - d, k + d]) if (!pool.length && ORDINE_RARITA[kk]) pool = CARTE.filter(c => c.rarita === ORDINE_RARITA[kk] && vale(c));
    if (T.distinte) { const libere = pool.filter(c => !uscite.includes(c.id)); if (libere.length) pool = libere; }
    uscite.push(pool[Math.floor(Math.random() * pool.length)].id);
  }
  // l'ultima (la più rara) resta per ultima, le altre in ordine di rarità crescente
  const ultima = uscite.pop();
  uscite.sort((a, b) => ORDINE_RARITA.indexOf(PER_ID[a].rarita) - ORDINE_RARITA.indexOf(PER_ID[b].rarita));
  uscite.push(ultima);
  const esiti = uscite.map((id, n) => {
    const prima = S.carte[id] || 0, infoPrima = infoCarta(id), r = PER_ID[id].rarita;
    let extra = 0, pot = 0;
    S.carte[id] = prima + 1;
    if (prima === 0) S.liv[id] = S.liv[id] || 1;
    else if (infoPrima.liv >= LIVELLO_MAX) { extra = MONETE_DOPPIONE_30[r]; S.monete += extra; }
    else { pot = POT_DOPPIONE[r]; S.pot[id] = (S.pot[id] || 0) + pot; }
    const dopo = infoCarta(id);
    // 1 carta su 50 esce olografica (se non ce l'hai già così)
    const olo = !haOlo(id) && Math.random() < PROB_OLO;
    if (olo) { S.olo = Object.assign({}, S.olo, { [id]: true }); S.stats.olo = (S.stats.olo || 0) + 1; }
    // versione Ultra: solo per le carte che ce l'hanno; sicura nell'ultima carta della Bustina Ultra
    const garantita = T.versioneUltra && n === uscite.length - 1;
    const ultra = PER_ID[id].ultra && !haUltra(id) && (garantita || Math.random() < PROB_ULTRA);
    if (ultra) { S.ultra = Object.assign({}, S.ultra, { [id]: true }); S.stats.ultra = (S.stats.ultra || 0) + 1; }
    if (garantita && !ultra && PER_ID[id].ultra) { S.monete += 500; extra += 500; }   // le avevi già tutte Ultra: 500 monete
    return { id, nuova: prima === 0, pot, pronta: !infoPrima.pronta && dopo.pronta, extra, liv: dopo.liv, lode: dopo.lode, olo, ultra,
      pieta: pietaOra && n === uscite.length - 1 && PER_ID[id].rarita === "leggendaria" };
  });
  S.stats.bustine++;
  S.pieta = esiti.some(e => PER_ID[e.id].rarita === "leggendaria") ? 0 : (S.pieta || 0) + 1;
  // riempie da sola la prima squadra finché non è completa
  const sq = S.squadre[S.attiva];
  for (const e of esiti) if (sq.carte.length < CARTE_SQUADRA && !sq.carte.includes(e.id)) sq.carte.push(e.id);
  return esiti;
}

// Prima di aprire una bustina controllo di avere l'ultima versione del gioco: i premi (potenziatori dei
// doppioni, probabilità) li calcola il gioco, e con una pagina vecchia aperta da ore si userebbero i numeri vecchi.
let aperturaInCorso = false;
async function apriBustinaAggiornata(tipo) {
  if (aperturaInCorso) return;
  aperturaInCorso = true;
  try {
    if (Date.now() - (controllaAggiornamento.ultimo || 0) > 60000) await Promise.race([controllaAggiornamento(), attesa(2500)]);
    let provato = false; try { provato = sessionStorage.getItem("ln-ricarica") === versioneNuova; } catch (e) {}
    if (versioneNuova && !provato) { applicaAggiornamento(); return; }   // ricarica la pagina: la bustina resta lì da aprire
    usaBustina(tipo, false);
  } finally { aperturaInCorso = false; }
}
function usaBustina(tipo, pagando) {
  if (pagando) {
    if (S.monete < PREZZO_BUSTINA) return;
    if (!S.admin) S.monete -= PREZZO_BUSTINA;
    tipo = "normale";
  } else {
    if (!S.inventario[tipo]) return;
    S.inventario[tipo]--;
  }
  const esiti = apriBustina(tipo);
  const su = aggiungiXP(XP_BUSTINA);
  Missioni.evento("bustina", { tipo });
  const graffito = Graffiti.forseInBustina(tipo);
  salva();
  Archivio.pubblicaClassifica();
  aggiornaTesta();
  mostraApertura(esiti, tipo, su, graffito);
}

// ---------- Apertura bustina (3D, con riserva 2D) ----------
let apertura = null;
// la bomboletta trovata nella bustina: una "carta" in più da girare
const htmlBombolettaBustina = g => g ? `<button type="button" class="bomboletta-bustina" data-azione="gira-bomboletta" hidden aria-label="Gira la bomboletta">
    <span class="bomboletta-retro"><i>🎨</i><b>Bomboletta!</b><small>Tocca per girarla</small></span>${Graffiti.htmlInBustina(g)}</button>` : "";
function giraBomboletta() {
  const b = $(".bomboletta-bustina"); if (!b || b.classList.contains("girata")) return;
  b.classList.add("girata");
  const [x, y] = FX.centro(b); FX.esplosione(x, y, { n: 50, forma: "coriandolo", colori: ["#ff2e46", "#3fd8ff", "#f2c14e", "#b866ff"], velocita: 7, dimensione: 5 });
}
function mostraApertura(esiti, tipo, livelloSu, graffito) {
  if (usa3D()) {
    const ov = $("#apertura");
    ov.hidden = false;
    ov.innerHTML = `
      <div class="apertura-tela" id="tela-bustina"></div>
      <div class="apertura-ui">
        <p class="suggerimento" id="sugg">Tocca la bustina per aprirla</p>
        ${htmlBombolettaBustina(graffito)}
        <div class="azioni centro">
          <button class="btn" data-fx="gelatina" data-azione="gira-tutte" hidden>Gira tutte</button>
          <button class="btn primario" data-fx="onda" data-azione="chiudi-apertura" hidden>Continua</button>
        </div>
      </div>`;
    try {
      apertura = new Scena3D.Apertura($("#tela-bustina"), esiti, tipo, {
        onApri: () => { $("#sugg").textContent = ""; },
        onPronte: () => { $("#sugg").textContent = graffito ? "Tocca le carte per girarle: c'è anche una bomboletta!" : "Tocca le carte per girarle"; $('[data-azione="gira-tutte"]').hidden = false; $('[data-azione="chiudi-apertura"]').hidden = false; const bb = $(".bomboletta-bustina"); if (bb) bb.hidden = false; },
        onGira: (i, tutte) => {
          $("#sugg").textContent = tutte ? `${livelloSu ? `Pass: livello ${livelloSu} raggiunto! · ` : ""}Tocca una carta per vedere le statistiche` : "Tocca di nuovo una carta girata per vedere le statistiche";
          if (tutte) $('[data-azione="gira-tutte"]').hidden = true;
        },
        onDettaglio: i => apriSchedaCarta(esiti[i]),
      });
      return;
    } catch (e) { ov.hidden = true; ov.innerHTML = ""; apertura = null; }
  }
  mostraApertura2D(esiti, graffito);
}
// Scheda veloce di una carta appena trovata: sta sopra la bustina aperta e si chiude con un tocco
const PIU_RARITA = r => Math.round((RARITA[r].forza - 1) * 100);
function htmlBonusRarita(c) {
  const p = PIU_RARITA(c.rarita);
  return p ? `<p class="bonus-rarita r-${c.rarita}"><b>${esc(RARITA[c.rarita].nome)}</b>: +${p}% a PV, attacco e difesa rispetto a una comune</p>` : "";
}
function apriSchedaCarta(e) {
  const c = PER_ID[e.id]; if (!c) return;
  chiudiSchedaCarta();
  const inf = infoCarta(c.id), liv = inf.liv || e.liv || 1, lode = inf.lode || e.lode, olo = haOlo(c.id) || e.olo, ultra = haUltra(c.id) || e.ultra, rar = S.carte[c.id] ? rarCarta(c.id) : c.rarita;
  const s = statistiche(c, liv, lode, rar), r = RUOLI[c.ruolo], st = STILI[c.stile];
  const el = document.createElement("div");
  el.className = "scheda-veloce"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", `Statistiche di ${c.nome}`);
  el.innerHTML = `<div class="scheda-box">
    <button class="scheda-x" aria-label="Chiudi">✕</button>
    <div class="scheda-testa">
      <div class="scheda-carta">${htmlCarta(c, { liv, lode, olo, ultra, rar })}</div>
      <div>
        <p class="serie-nome">${esc(SERIE[c.serie].nome)} · <span class="r-testo r-${rar}">${esc(RARITA[rar].nome)}</span></p>
        <h2>${esc(c.nome)}</h2>
        <p class="nota">${lode ? "Livello 30 e lode" : `Livello ${liv}`} · ${esc(r.nome)} · ${st.icona} ${esc(st.nome)}</p>
        ${e.olo ? `<p class="olo-nota">✦ <b>Olografica</b>: +5% di PV e di danni in battaglia</p>` : ""}
        ${(e.ultra || haUltra(c.id)) && c.ultra ? `<p class="ultra-nota">◆ <b>Versione Ultra</b>: +10% di PV e di danni in battaglia</p>` : ""}
      </div>
    </div>
    ${htmlStatGriglia(c, s)}
    ${htmlBonusRarita(c)}
    ${htmlTipo(c)}
    <p class="passiva"><b>${esc(r.cosa)}.</b> ${esc(r.passiva)}</p>
    <ul class="mosse-lista">${c.mosse.map(mo => `<li><span class="costo">${mo.costo}◆</span><b>${esc(mo.nome)}</b><small>${esc(descrMossa(mo))}</small></li>`).join("")}</ul>
    <p class="nota centro">Tocca ✕ o fuori dalla scheda per tornare alle carte</p>
  </div>`;
  el.addEventListener("click", ev => { if (ev.target === el || ev.target.closest(".scheda-x")) { ev.stopPropagation(); chiudiSchedaCarta(); } });
  document.body.appendChild(el);
}
function chiudiSchedaCarta() { const v = document.querySelector(".scheda-veloce"); if (v) v.remove(); }
addEventListener("keydown", e => { if (e.key === "Escape") chiudiSchedaCarta(); });
function chiudiApertura() {
  chiudiSchedaCarta();
  if (apertura) { apertura.distruggi(); apertura = null; }
  const ov = $("#apertura"); ov.hidden = true; ov.innerHTML = "";
  disegna();
  if (versioneNuova) setTimeout(applicaAggiornamento, 600);
}
let esitiAperti = [];
function mostraApertura2D(esiti, graffito) {
  esitiAperti = esiti;
  apriModale(`
    <div class="apertura2d">
      <h2>Tocca le carte per girarle</h2>
      <p class="nota centro">Tocca di nuovo una carta girata per vedere le statistiche.</p>
      <div class="apertura-carte">
        ${esiti.map((e, i) => `
          <button class="gira r-${PER_ID[e.id].rarita}" data-i="${i}" aria-label="Gira la carta ${i + 1}">
            <div class="faccia retro"><span class="neon">NV</span></div>
            <div class="faccia fronte">
              ${htmlCarta(PER_ID[e.id], { liv: e.liv, lode: e.lode, olo: e.olo, ultra: e.ultra })}
              <span class="etichetta ${e.ultra ? "ultra-tag" : e.olo ? "olo-tag" : ""}">${e.ultra ? "ULTRA!" : e.olo ? "Olografica!" : e.pieta ? "Garantita!" : e.nuova ? "Nuova!" : e.pot ? `+${e.pot} potenziatori` : e.extra ? `+${e.extra} monete` : ""}</span>
            </div>
          </button>`).join("")}
      </div>
      ${htmlBombolettaBustina(graffito).replace(" hidden ", " ")}
      <div class="azioni centro">
        <button class="btn" data-azione="gira-tutte-2d">Gira tutte</button>
        <button class="btn primario" data-azione="chiudi">Continua</button>
      </div>
    </div>`, { bloccata: true });
}

// ---------- ALBUM (diviso per serie) ----------
const ORDINE_SERIE = Object.keys(SERIE);
function statSerie(id) {
  const cs = CARTE.filter(c => c.serie === id), mie = cs.filter(c => S.carte[c.id]);
  return { tot: cs.length, mie: mie.length, pct: Math.round(mie.length / cs.length * 100), carte: cs };
}
function htmlSezioneSerie(id, conTitolo) {
  const se = SERIE[id], st = statSerie(id);
  const fa = filtri.album, filtrando = !!(fa.tipo || fa.ruolo || fa.cerca);
  // con un filtro attivo si vedono solo le carte già trovate (le altre restano una sorpresa)
  // rarità attuale: una carta salita con l'Ascesa conta (e si ordina) con la rarità nuova
  const rarOra = c => S.carte[c.id] ? rarCarta(c.id) : c.rarita;
  const elenco = [...st.carte].filter(c => !filtrando || (S.carte[c.id] && passaFiltri(c, fa))).sort((a, b) => ORDINE_RARITA.indexOf(rarOra(b)) - ORDINE_RARITA.indexOf(rarOra(a)) || a.nome.localeCompare(b.nome));
  if (filtrando && !elenco.length) return conTitolo ? "" : `<section class="serie-sezione" style="--c:${se.colore}"><p class="nota">Nessuna carta trovata di questa serie con questi filtri.</p></section>`;
  // Esempio: 3 leggendarie nella serie, ne hai trovate 2 e una comune è salita a leggendaria → "Leggendaria 2/3 +1 ⬆";
  // e quella comune non conta più tra le comuni ("Comune 3/5" invece di 4/5).
  const perRarita = ORDINE_RARITA.slice().reverse().filter(r => st.carte.some(c => c.rarita === r || rarOra(c) === r)).map(r => {
    const cs = st.carte.filter(c => c.rarita === r), qui = cs.filter(c => S.carte[c.id] && rarOra(c) === r).length;
    const salite = st.carte.filter(c => c.rarita !== r && S.carte[c.id] && rarOra(c) === r).length, andate = cs.filter(c => S.carte[c.id] && rarOra(c) !== r).length;
    const titolo = [salite ? `${salite} salite a ${RARITA[r].nome.toLowerCase()} con l'Ascesa` : "", andate ? `${andate} salite alla rarità dopo` : ""].filter(Boolean).join(" · ");
    return `<span class="rar-conta"${titolo ? ` title="${titolo}"` : ""}><span class="pallino r-${r}"></span>${RARITA[r].nome} ${cs.length ? `${qui}/${cs.length}` : ""}${salite ? ` <b class="rar-salite">+${salite} ⬆</b>` : ""}</span>`; }).join("");
  return `
  <section class="serie-sezione" style="--c:${se.colore}">
    <div class="serie-testa">
      <span class="serie-stemma" aria-hidden="true">${se.simbolo}</span>
      <div class="serie-info">
        ${conTitolo ? `<h3>${esc(se.nome)}</h3>` : `<h2>${esc(se.nome)}</h2>`}
        <p class="nota">${esc(se.desc)}</p>
        ${Sinergie.htmlSerieAlbum(id)}
        <div class="serie-rarita">${perRarita}</div>
      </div>
      <div class="serie-progresso"><b>${st.mie}<small>/${st.tot}</small></b><div class="barra"><i style="--p:${st.pct}%;background:${se.colore}"></i></div>${st.mie === st.tot ? `<span class="completa">Serie completa!</span>` : ""}</div>
    </div>
    <div class="griglia">
      ${elenco.map((c, i) => `<div class="cella" style="--i:${i}">${S.carte[c.id] ? htmlCarta(c, { click: true }) + htmlBadgeSquadra(c.id) : htmlCarta(c, { coperta: true })}</div>`).join("")}
    </div>
  </section>`;
}
// ---------- carte da potenziare ----------
const cartePronte = () => possedute().filter(c => infoCarta(c.id).pronta);
function htmlLegendaPot() {
  return `<p class="legenda-pot"><span class="potenziabile finto"><b>▲</b><em>Potenzia</em></span> puoi farla salire di livello adesso
    <span class="potenziabile manca finto"><b>▲</b><em>-50 🪙</em></span> hai i potenziatori, ti mancano solo le monete</p>`;
}
function htmlBottonePot(id) {
  const inf = infoCarta(id);
  if (inf.liv >= LIVELLO_MAX && rarCarta(id) !== "leggendaria") return `<button type="button" class="btn btn-pot" data-azione="ascesa" data-id="${id}">⬆ Ascesa a ${esc(RARITA[rarDopo(PER_ID[id].rarita, ((S.asc || {})[id] || 0) + 1)].nome.toLowerCase())} · ${ASCESA_MONETE[rarCarta(id)]} 🪙</button>`;
  if (!inf.liv || inf.liv >= LIVELLO_MAX) return "";
  if (inf.puoi) return `<button type="button" class="btn btn-pot" data-fx="stelle" data-sq-az="potenzia">▲ Potenzia a Lv ${inf.liv + 1} · ${S.admin ? "gratis" : inf.serveMon + " 🪙"}</button>`;
  if (inf.pronta) return `<button type="button" class="btn" disabled>▲ Potenzia: mancano ${inf.serveMon - S.monete} monete</button>`;
  return `<span class="nota pot-mancano">Per il Lv ${inf.liv + 1}: ${inf.pot}/${inf.servePot} potenziatori</span>`;
}
function htmlCopertinaPot() {
  const pr = cartePronte(); if (!pr.length && filtroAlbum !== "pot") return "";
  const ora = pr.filter(c => infoCarta(c.id).puoi).length;
  return `<button class="copertina copertina-pot ${filtroAlbum === "pot" ? "scelta" : ""}" data-fx="gelatina" data-filtro="pot" aria-pressed="${filtroAlbum === "pot"}">
    <span class="copertina-testo"><span class="pot-grande">▲</span><b>Da potenziare</b><small>${ora ? `${ora} adesso` : ""}${ora && pr.length > ora ? " · " : ""}${pr.length > ora ? `${pr.length - ora} senza monete` : ""}</small></span></button>`;
}
function htmlSezionePot() {
  const sq = new Set(squadraAttiva().carte);
  const pr = cartePronte().filter(c => passaFiltri(c, filtri.album)).sort((a, b) => (sq.has(b.id) ? 1 : 0) - (sq.has(a.id) ? 1 : 0) || (infoCarta(b.id).puoi ? 1 : 0) - (infoCarta(a.id).puoi ? 1 : 0) || ORDINE_RARITA.indexOf(b.rarita) - ORDINE_RARITA.indexOf(a.rarita));
  if (!pr.length) return `<section class="serie-sezione"><p class="nota">Nessuna carta da potenziare per ora: i potenziatori arrivano dai doppioni che trovi nelle bustine.</p></section>`;
  return `<section class="serie-sezione sezione-pot">
    <div class="serie-testa"><span class="serie-stemma" aria-hidden="true">▲</span><div class="serie-info"><h2>Da potenziare</h2>
      <p class="nota">Queste carte hanno abbastanza potenziatori per salire di livello. Prima quelle della tua squadra attiva. Tocca una carta e premi <b>Potenzia</b>.</p>${htmlLegendaPot()}</div></div>
    <div class="griglia">${pr.map((c, i) => `<div class="cella" style="--i:${i}">${htmlCarta(c, { click: true }) + htmlBadgeSquadra(c.id)}</div>`).join("")}</div>
  </section>`;
}
function htmlSchedeAlbum() {
  const n = { trofei: Trofei.pronti(), scambi: Scambi.inArrivo };
  return `<div class="schede-album" role="tablist">${[["carte", "Carte"], ["trofei", "Trofei"], ["scambi", "Scambi"]].map(([k, t]) =>
    `<button class="scheda ${albumScheda === k ? "sel" : ""}" role="tab" aria-selected="${albumScheda === k}" data-scheda-album="${k}">${t}${n[k] ? `<span class="badge">${n[k]}</span>` : ""}</button>`).join("")}</div>`;
}
function vistaAlbum() {
  if (albumScheda === "trofei") return `<section>${htmlSchedeAlbum()}${Trofei.html()}</section>`;
  if (albumScheda === "scambi") return `<section>${htmlSchedeAlbum()}${Scambi.html()}</section>`;
  const tot = possedute().length, olo = Object.keys(S.olo || {}).filter(id => S.olo[id] && PER_ID[id]).length;
  return `
  <section>
    ${htmlSchedeAlbum()}
    <div class="titolo-riga"><h2>Album</h2><p class="nota">${tot}/${CARTE.length} carte trovate in ${ORDINE_SERIE.length} serie${olo ? ` · <span class="olo-testo">✦ ${olo} olografiche</span>` : ""}.</p></div>
    ${htmlBarraFiltri("album")}${filtri.album.tipo || filtri.album.ruolo || filtri.album.cerca ? `<p class="nota">Con un filtro attivo vedi solo le carte che hai già trovato.${filtroAlbum === "pot" ? "" : " Tocca una serie qui sotto per cercare solo lì."}</p>` : ""}
    <div class="serie-copertine">
      ${htmlCopertinaPot()}
      ${ORDINE_SERIE.map((id, k) => {
        const se = SERIE[id], st = statSerie(id);
        const anteprima = [...st.carte].sort((a, b) => (S.carte[b.id] ? 1 : 0) - (S.carte[a.id] ? 1 : 0) || ORDINE_RARITA.indexOf(b.rarita) - ORDINE_RARITA.indexOf(a.rarita)).slice(0, 3);
        return `<button class="copertina ${filtroAlbum === id ? "scelta" : ""}" data-inclina data-fx="gelatina" data-filtro="${id}" style="--c:${se.colore};--i:${k}" aria-pressed="${filtroAlbum === id}">
          <span class="copertina-carte">${anteprima.map(c => `<img src="${imgCarta(c.id)}" alt="" class="${S.carte[c.id] ? "" : "buia"}">`).join("")}</span>
          <span class="copertina-testo"><span class="serie-stemma piccolo">${se.simbolo}</span><b>${esc(se.nome)}</b><small>${st.mie}/${st.tot}</small></span>
          <span class="barra"><i style="--p:${st.pct}%;background:${se.colore}"></i></span>
        </button>`;
      }).join("")}
      <button class="copertina tutte ${filtroAlbum === "tutte" ? "scelta" : ""}" data-fx="gelatina" data-filtro="tutte" aria-pressed="${filtroAlbum === "tutte"}"><span class="copertina-testo"><b>Tutte le serie</b><small>${tot}/${CARTE.length}</small></span></button>
    </div>
    ${filtroAlbum === "pot" ? "" : Sinergie.htmlMultiversoAlbum()}
    ${filtroAlbum === "pot" ? htmlSezionePot() : filtroAlbum === "tutte" ? ORDINE_SERIE.map(id => htmlSezioneSerie(id, true)).join("") : htmlSezioneSerie(filtroAlbum, false)}
  </section>`;
}

// ---------- SQUADRE ----------
function vistaSquadra() {
  const mie = possedute();
  if (!mie.length) return vuoto("Non hai ancora carte.", "Apri la tua prima bustina", "vai-bustine");
  const sq = squadraAttiva();
  const slot = Array.from({ length: CARTE_SQUADRA }, (_, i) => {
    const id = sq.carte[i];
    if (!id) return `<div class="slot"><div class="slot-vuoto">Posto ${i + 1}</div></div>`;
    const sel = selSq && selSq.id === id, bersaglio = selSq && selSq.modo === "slot" && !sel;
    return `<div class="slot pieno ${sel ? "selezionata" : ""} ${bersaglio ? "bersaglio" : ""}" style="--i:${i}">
      <div class="slot-carta" data-slot="${i}" role="button" tabindex="0" aria-label="${esc(PER_ID[id].nome)}: tocca per le opzioni">${htmlCarta(PER_ID[id], { piccola: true })}</div>
      <div class="slot-comandi">
        <button class="mini-btn" data-fx="salto" data-sposta="${i}:-1" ${i === 0 ? "disabled" : ""} aria-label="Sposta a sinistra">◀</button>
        <button class="mini-btn togli" data-fx="scuoti" data-togli="${i}" aria-label="Togli dalla squadra">✕</button>
        <button class="mini-btn" data-fx="salto" data-sposta="${i}:1" ${i >= sq.carte.length - 1 ? "disabled" : ""} aria-label="Sposta a destra">▶</button>
      </div>
      ${i === 0 ? `<span class="primo">Entra per primo</span>` : ""}
    </div>`;
  });
  const stili = { FOR: 0, DIF: 0, VEL: 0 };
  let pv = 0;
  sq.carte.forEach(id => { stili[PER_ID[id].stile]++; pv += statistiche(PER_ID[id], livello(id), haLode(id), rarCarta(id)).pv; });
  const ruoli = sq.carte.map(id => RUOLI[PER_ID[id].ruolo].nome);
  const nPot = mie.filter(c => infoCarta(c.id).pronta).length;
  if (!nPot) filtri.squadra.pot = false;
  const elenco = mie.filter(c => passaFiltri(c, filtri.squadra))
    .sort((a, b) => ORDINE_RARITA.indexOf(b.rarita) - ORDINE_RARITA.indexOf(a.rarita) || a.nome.localeCompare(b.nome));
  return `
  <section>
    <div class="titolo-riga">
      <h2>Squadre</h2>
      <div class="filtri">${S.squadre.map((s, i) => `<button class="chip" data-fx="gelatina" data-squadra="${i}" aria-pressed="${i === S.attiva}">${esc(s.nome)} · ${s.carte.length}/${CARTE_SQUADRA}</button>`).join("")}</div>
    </div>
    <div class="squadra-barra">
      <label for="nome-squadra">Nome</label>
      <input id="nome-squadra" maxlength="22" value="${esc(sq.nome)}" autocomplete="off">
      <span class="nota">${sq.carte.length === CARTE_SQUADRA ? "Squadra pronta per le sfide." : `Mancano ${CARTE_SQUADRA - sq.carte.length} ${CARTE_SQUADRA - sq.carte.length === 1 ? "carta" : "carte"}.`}</span>
    </div>
    <div class="slot5">${slot.join("")}</div>
    ${Graffiti.htmlSquadra()}
    ${Sinergie.htmlSquadra(sq.carte)}
    <div class="riepilogo">
      <div><span>Stili</span>${Object.entries(stili).map(([k, n]) => `<b class="stile s-${k}">${k} ${n}</b>`).join(" ")}</div>
      <div><span>Ruoli</span>${ruoli.length ? ruoli.map(r => `<b class="ruolo-pill">${esc(r)}</b>`).join(" ") : "—"}</div>
      <div><span>PV totali</span><b>${pv}</b></div>
    </div>
    <div class="titolo-riga piccola">
      <p class="nota">Tocca una carta per vedere cosa puoi fare: aggiungerla, scambiarla con una della squadra, confrontarla o <b>potenziarla</b>. Le frecce cambiano l'ordine.</p>
      ${htmlLegendaPot()}
      ${htmlBarraFiltri("squadra", nPot ? `<button class="chip chip-pot" data-fx="gelatina" data-filtra="squadra:pot:" aria-pressed="${filtri.squadra.pot}">▲ Da potenziare · ${nPot}</button>` : "")}
    </div>
    ${elenco.length ? "" : `<p class="nota vuoto-filtri">Nessuna carta con questi filtri.</p>`}
    <div class="griglia">
      ${elenco.map((c, i) => { const dentro = sq.carte.includes(c.id);
        return `<div class="scegli cella ${dentro ? "scelta" : ""} ${selSq && selSq.id === c.id ? "selezionata" : ""}" style="--i:${i}" data-scegli="${c.id}" role="button" tabindex="0" aria-pressed="${dentro}">${htmlCarta(c)}</div>`; }).join("")}
    </div>
  </section>
  ${htmlAzioniCarta()}`;
}


// ---------------- Sinergie: riquadro in Squadre, icone in battaglia, valori dall'admin ----------------
const Sinergie = (() => {
  let caricato = false;
  async function carica() {
    if (Archivio.modo !== "cloud" || !Archivio.db) { caricato = true; return; }
    try { const snap = await Archivio.db.doc("config/sinergie").get(); applicaSinergie(snap && snap.exists ? snap.data() : {}); caricato = true; } catch (e) { return; }
    if (!B && ["admin", "squadra"].includes(vista) && $("#modale").hidden) disegnaQuieto();
  }
  // liv: 1 = 2 carte, 2 = 3 carte, 3 = 5 carte
  const testoSerie = (k, liv) => { const s = SINERGIE[k]; return s.testo(valSinergia(s, liv), liv); };
  const prossima = n => SOGLIE_SINERGIA.find(x => x > n);
  // riquadro nella pagina Squadre: sinergie attive e quelle a cui manca poco
  function htmlSquadra(ids) {
    const sin = sinergieDi(ids);
    const righe = []; let suggerimenti = 0;
    for (const s of sin.serie) {
      const se = SERIE[s.serie];
      const p = prossima(s.n), pl = p ? SOGLIE_SINERGIA.indexOf(p) + 1 : 0;
      const dopo = p ? ` <small>${p - s.n === 1 ? "Con un'altra" : `Con ${p} carte`}: ${testoSerie(s.serie, pl)}.</small>` : "";
      if (s.liv) righe.push(`<li class="sin-attiva" style="--c:${se.colore}"><span class="sin-ico">${se.simbolo}</span><span><b>${esc(se.nome)} ${s.n}${p ? `/${p}` : ""}</b> · carte ${esc(se.nome)}: ${testoSerie(s.serie, s.liv)}.${dopo}</span></li>`);
      else if (suggerimenti++ < 2) righe.push(`<li class="sin-quasi" style="--c:${se.colore}"><span class="sin-ico">${se.simbolo}</span><span><b>${esc(se.nome)} 1/2</b> · aggiungine un'altra: carte ${esc(se.nome)}, ${testoSerie(s.serie, 1)}.</span></li>`);
    }
    for (const m of sin.multiverso) righe.push(`<li class="sin-attiva multiverso"><span class="sin-ico">∞</span><span><b>Multiverso: ${esc(m.persona)} ×${m.n}</b> +${m.val}% a tutte le statistiche di ${m.ids.map(id => esc(PER_ID[id].nome)).join(", ")}.${m.n === 2 ? ` <small>Con 3 versioni: +${MULTIVERSO.v3}%.</small>` : ""}</span></li>`);
    return `<div class="sinergie-box"><div class="sin-testa"><span>Sinergie</span><small>2, 3 o 5 carte della stessa serie danno a quelle carte un bonus sempre più grande. 2 o più versioni della stessa persona: Multiverso.</small></div>
      ${righe.length ? `<ul class="sin-lista">${righe.join("")}</ul>` : `<p class="nota">Nessuna sinergia: prova a mettere 2 carte della stessa serie, o due versioni dello stesso amico.</p>`}</div>`;
  }
  // icone piccole accanto al nome in battaglia
  function htmlBattaglia(L) {
    const sin = L && L.sinergie; if (!sin) return "";
    const ico = [...sin.serie.filter(s => s.liv).map(s => `<span class="sin-mini" style="--c:${SERIE[s.serie].colore}" title="Sinergia ${esc(SERIE[s.serie].nome)} ${s.n}: ${esc(testoSerie(s.serie, s.liv))}">${SERIE[s.serie].simbolo}${s.n}</span>`),
      ...sin.multiverso.map(m => `<span class="sin-mini multiverso" title="Multiverso ${esc(m.persona)} ×${m.n}: +${m.val}% a quelle carte">∞${m.n}</span>`)];
    return ico.length ? `<span class="sin-icone">${ico.join("")}</span>` : "";
  }
  function htmlAdmin() {
    if (!caricato) { setTimeout(carica, 0); return `<h3>Sinergie</h3><p class="nota">Carico i valori…</p>`; }
    return `<h3>Sinergie</h3>
      <p class="nota">Quanto valgono le sinergie con 2, 3 e 5 carte della stessa serie, e il Multiverso (stessa persona in più versioni). Valgono per tutti, anche dal vivo e contro il computer.</p>
      <form id="form-sinergie" class="sin-admin" autocomplete="off">
        ${ORDINE_SERIE.filter(k => SINERGIE[k]).map(k => { const s = SINERGIE[k], se = SERIE[k]; return `<fieldset style="--c:${se.colore}"><legend>${se.simbolo} ${esc(se.nome)}</legend>
          <div class="campi-4">${[["v2", 2], ["v3", 3], ["v5", 5]].map(([v, n]) => `<label>Con ${n} (${s.tipo === "energia" ? "energia" : s.tipo === "effetti" ? "forza %" : "%"}) <input name="${k}.${v}" type="number" min="0" step="0.5" max="${s.tipo === "effetti" ? 400 : s.tipo === "energia" ? 5 : 60}" value="${s[v]}"></label>`).join("")}
          <label>Con 5 fa <input value="${esc(testoSerie(k, 3))}" disabled></label></div></fieldset>`; }).join("")}
        <fieldset><legend>∞ Multiverso</legend><div class="campi-3">
          <label>2 versioni (%) <input name="multiverso.v2" type="number" min="0" max="30" value="${MULTIVERSO.v2}"></label>
          <label>3 o più (%) <input name="multiverso.v3" type="number" min="0" max="40" value="${MULTIVERSO.v3}"></label></div></fieldset>
        <div class="azioni"><button class="btn primario" type="submit">Salva per tutti</button><button type="button" class="btn" data-admin="sinergie-base">Valori di partenza</button></div>
      </form>`;
  }
  async function salvaAdmin(form, base) {
    const nuovi = { versione: 4 };
    if (!base) {
      const f = new FormData(form);
      for (const k of Object.keys(SINERGIE)) { const d = {}; for (const v of ["v2", "v3", "v5"]) { const x = f.get(`${k}.${v}`); if (x !== null && x !== "") d[v] = +x; } if (Object.keys(d).length) nuovi[k] = d; }
      nuovi.multiverso = { v2: +f.get("multiverso.v2"), v3: +f.get("multiverso.v3") };
    }
    try { await Archivio.db.doc("config/sinergie").set(nuovi); applicaSinergie(nuovi); mostraAvviso(base ? "Sinergie tornate ai valori di partenza." : "Sinergie salvate: ora valgono per tutti."); }
    catch (e) { mostraAvviso("Non sono riuscito a salvare. Serve la pagina online con il tuo account admin."); }
    const box = $("#admin-sinergie"); if (box) box.innerHTML = htmlAdmin();
  }
  // Album: cosa fa la sinergia di una serie (sotto il titolo della serie)
  function htmlSerieAlbum(k) {
    if (!SINERGIE[k]) return "";
    return `<p class="sin-album"><b>Sinergia</b> <span>2 carte: ${testoSerie(k, 1)}</span><span>3 carte: ${testoSerie(k, 2)}</span><span>5 carte: ${testoSerie(k, 3)}</span></p>`;
  }
  // Album: il Multiverso, persona per persona (le versioni che non hai trovato restano un "?")
  function htmlMultiversoAlbum() {
    const perPersona = {};
    for (const c of CARTE) if (c.persona) (perPersona[c.persona] = perPersona[c.persona] || []).push(c);
    const persone = Object.entries(perPersona).filter(([, l]) => l.length >= 2)
      .map(([p, l]) => ({ p, l: l.sort((a, b) => ORDINE_SERIE.indexOf(a.serie) - ORDINE_SERIE.indexOf(b.serie)), mie: l.filter(c => S.carte[c.id]).length }))
      .sort((a, b) => b.mie - a.mie || a.p.localeCompare(b.p));
    if (!persone.length) return "";
    const pronte = persone.filter(x => x.mie >= 2).length;
    return `<details class="multiverso-album">
      <summary><span class="sin-ico">∞</span><span><b>Sinergie del Multiverso</b><small>2 versioni della stessa persona in squadra: <b>+${MULTIVERSO.v2}%</b> a tutte le loro statistiche · 3 o più: <b>+${MULTIVERSO.v3}%</b>${pronte ? ` · ne puoi già fare ${pronte}` : ""}</small></span></summary>
      <div class="mv-lista">${persone.map(x => `<div class="mv-persona ${x.mie >= 3 ? "tre" : x.mie >= 2 ? "due" : ""}">
        <div class="mv-testa"><b>${esc(x.p)}</b><small>${x.mie}/${x.l.length} versioni${x.mie >= 3 ? ` · +${MULTIVERSO.v3}%` : x.mie >= 2 ? ` · +${MULTIVERSO.v2}%` : ""}</small></div>
        <div class="mv-carte">${x.l.map(c => S.carte[c.id]
          ? `<button class="mv-carta" data-dettaglio="${c.id}" style="--c:${SERIE[c.serie].colore}" title="${esc(SERIE[c.serie].nome)}"><img src="${imgCarta(c.id)}" alt="" loading="lazy"><span>${esc(c.nome)}</span></button>`
          : `<span class="mv-carta buia" style="--c:${SERIE[c.serie].colore}" title="Da trovare (${esc(SERIE[c.serie].nome)})"><i>?</i><span>${SERIE[c.serie].simbolo}</span></span>`).join("")}</div>
      </div>`).join("")}</div>
    </details>`;
  }
  return { carica, htmlSquadra, htmlBattaglia, htmlAdmin, salvaAdmin, htmlSerieAlbum, htmlMultiversoAlbum };
})();

// ---------- Squadre: tocchi una carta e scegli cosa farne ----------
// selSq = { id, modo }   modo: null | "slot" (scambia: tocca la carta della squadra da sostituire)
//                              | "carta" (scambia: tocca la carta da mettere al suo posto) | "confronta"
let selSq = null;
function htmlAzioniCarta() {
  if (!selSq || !PER_ID[selSq.id] || !S.carte[selSq.id]) return "";
  const c = PER_ID[selSq.id], sq = squadraAttiva(), dentro = sq.carte.includes(c.id), s = statistiche(c, livello(c.id), haLode(c.id), rarCarta(c.id));
  const guida = selSq.modo === "slot" ? `Tocca la carta della squadra da sostituire con <b>${esc(c.nome)}</b>.`
    : selSq.modo === "carta" ? `Tocca una carta qui sotto da mettere al posto di <b>${esc(c.nome)}</b>.`
    : selSq.modo === "confronta" ? `Tocca un'altra carta da confrontare con <b>${esc(c.nome)}</b>.` : "";
  return `<div class="vista-squadra-spazio"></div><div class="azioni-carta" id="azioni-carta" role="dialog" aria-label="Opzioni per ${esc(c.nome)}">
    <div class="azioni-carta-testa">
      <div class="azioni-carta-mini">${htmlCarta(c, { mini: true })}</div>
      <div class="azioni-carta-info"><b>${esc(c.nome)}</b><small><span class="s-${c.stile}">${STILI[c.stile].icona} ${STILI[c.stile].nome}</span> · ${esc(RUOLI[c.ruolo].nome)} · Lv ${livello(c.id)}</small>
        <small>PV ${s.pv} · Att ${s.att} · Dif ${s.dif} · Vel ${s.vel}</small></div>
      <button type="button" class="mini-btn" data-sq-az="chiudi" aria-label="Chiudi">✕</button>
    </div>
    ${guida ? `<p class="azioni-carta-guida">${guida} <button type="button" class="btn piccolo" data-sq-az="annulla">Annulla</button></p>` : `<div class="azioni-carta-bottoni">
      ${dentro ? `<button type="button" class="btn" data-sq-az="togli">Togli dalla squadra</button>`
        : sq.carte.length < CARTE_SQUADRA ? `<button type="button" class="btn primario" data-fx="stelle" data-sq-az="aggiungi">Aggiungi in squadra</button>` : ""}
      ${sq.carte.length ? `<button type="button" class="btn ${!dentro && sq.carte.length >= CARTE_SQUADRA ? "primario" : ""}" data-sq-az="scambia">⇄ Scambia</button>` : ""}
      <button type="button" class="btn" data-sq-az="confronta">⚖ Confronta</button>
      ${htmlBottonePot(c.id)}
      <button type="button" class="btn" data-sq-az="dettagli">Dettagli</button>
    </div>`}
  </div>`;
}
function ridisegnaSquadra() { disegnaQuieto(); }

// Aggiornamento "morbido": invece di ricreare tutta la pagina (e ricaricare decine di immagini, con le carte
// che rientrano una dopo l'altra) cambia solo i pezzi diversi. Serve dove la pagina si aggiorna spesso:
// squadre, album e classifica.
function morfa(vecchio, nuovo) {
  if (vecchio.nodeType !== nuovo.nodeType || vecchio.nodeName !== nuovo.nodeName ||
      (vecchio.nodeName === "IMG" && vecchio.getAttribute("src") !== nuovo.getAttribute("src"))) { vecchio.replaceWith(nuovo); return; }
  if (vecchio.nodeType === 3 || vecchio.nodeType === 8) { if (vecchio.nodeValue !== nuovo.nodeValue) vecchio.nodeValue = nuovo.nodeValue; return; }
  if (vecchio.nodeType !== 1) return;
  const attivo = vecchio === document.activeElement, dett = vecchio.nodeName === "DETAILS";
  for (const a of [...vecchio.attributes]) if (!nuovo.hasAttribute(a.name) && !(dett && a.name === "open")) vecchio.removeAttribute(a.name);
  for (const a of [...nuovo.attributes]) if (vecchio.getAttribute(a.name) !== a.value && !(attivo && a.name === "value") && !(dett && a.name === "open")) vecchio.setAttribute(a.name, a.value);
  if (vecchio.nodeName === "INPUT" && !attivo) { if (vecchio.type === "checkbox" || vecchio.type === "radio") vecchio.checked = nuovo.checked; else if (vecchio.value !== nuovo.value) vecchio.value = nuovo.value; }
  morfaFigli(vecchio, nuovo);
}
function morfaFigli(vecchio, nuovo) {
  const vc = [...vecchio.childNodes], nc = [...nuovo.childNodes];
  for (let i = 0; i < nc.length; i++) { if (i < vc.length) morfa(vc[i], nc[i]); else vecchio.appendChild(nc[i]); }
  for (let i = nc.length; i < vc.length; i++) vc[i].remove();
}
function disegnaQuieto() {
  const main = $("#vista");
  if (!main || ultimaVistaDisegnata !== vista || !["squadra", "album", "classifica"].includes(vista) || !main.firstElementChild) return disegna();
  aggiornaTesta();
  if (B && $("#azioni")) return;
  const t = document.createElement("div");
  t.innerHTML = FUNZIONI_VISTE()[vista]();
  main.classList.add("quieta");
  morfaFigli(main, t);
}
// tocco su una carta (della collezione o della squadra) mentre sta scegliendo
function toccoCartaSquadra(id) {
  const sq = squadraAttiva();
  if (selSq && selSq.modo === "confronta" && id !== selSq.id) { const a = selSq.id; selSq = { id: a }; ridisegnaSquadra(); confrontaCarte(a, id); return; }
  if (selSq && selSq.modo === "carta" && id !== selSq.id) {
    const i = sq.carte.indexOf(selSq.id);
    if (sq.carte.includes(id)) { const j = sq.carte.indexOf(id); [sq.carte[i], sq.carte[j]] = [sq.carte[j], sq.carte[i]]; mostraAvviso("Ordine scambiato."); }
    else { sq.carte[i] = id; mostraAvviso(`${PER_ID[selSq.id].nome} esce, entra ${PER_ID[id].nome}.`); }
    selSq = null; salva(); ridisegnaSquadra(); return;
  }
  if (selSq && selSq.modo === "slot") {
    const j = sq.carte.indexOf(id);
    if (j < 0 || id === selSq.id) return;
    const i = sq.carte.indexOf(selSq.id);
    if (i >= 0) [sq.carte[i], sq.carte[j]] = [sq.carte[j], sq.carte[i]];
    else { mostraAvviso(`${PER_ID[id].nome} esce, entra ${PER_ID[selSq.id].nome}.`); sq.carte[j] = selSq.id; }
    selSq = null; salva(); ridisegnaSquadra(); return;
  }
  selSq = selSq && selSq.id === id && !selSq.modo ? null : { id };
  ridisegnaSquadra();
}
function azioneCartaSquadra(az) {
  if (!selSq) return;
  const sq = squadraAttiva(), id = selSq.id;
  if (az === "chiudi") selSq = null;
  else if (az === "annulla") selSq = { id };
  else if (az === "aggiungi") {
    if (sq.carte.length < CARTE_SQUADRA && !sq.carte.includes(id)) {
      sq.carte.push(id);
    }
    selSq = null; salva();
  }
  else if (az === "togli") { sq.carte = sq.carte.filter(x => x !== id); selSq = null; salva(); }
  else if (az === "scambia") selSq = { id, modo: sq.carte.includes(id) ? "carta" : "slot" };
  else if (az === "confronta") selSq = { id, modo: "confronta" };
  else if (az === "dettagli") { apriDettaglio(id); return; }
  else if (az === "potenzia") { potenziaCarta(id, $("#azioni-carta [data-sq-az=potenzia]"), true); return; }
  ridisegnaSquadra();
}
// Confronto di due carte, fianco a fianco: la statistica migliore è evidenziata
function confrontaCarte(a, b) {
  const ca = PER_ID[a], cb = PER_ID[b]; if (!ca || !cb) return;
  const sa = statistiche(ca, livello(a), haLode(a), rarCarta(a)), sb = statistiche(cb, livello(b), haLode(b), rarCarta(b));
  const righe = [["PV", "pv"], ["Attacco", "att"], ["Difesa", "dif"], ["Velocità", "vel"]];
  const cella = (x, y) => x > y ? "meglio" : x < y ? "peggio" : "";
  const vs = multStile(ca.stile, cb.stile), testoVs = vs > 1 ? `${esc(ca.nome)} batte ${esc(cb.nome)}: fa il 30% di danni in più, e prende il 20% in meno.`
    : vs < 1 ? `${esc(cb.nome)} batte ${esc(ca.nome)}: fa il 30% di danni in più, e prende il 20% in meno.` : "Stesso tipo: nessun vantaggio tra loro.";
  const colonna = (c, st) => `<div class="confronto-col"><div class="confronto-carta">${htmlCarta(c, { piccola: true })}</div><b>${esc(c.nome)}</b>
    <small><span class="r-testo r-${c.rarita}">${RARITA[c.rarita].nome}</span> · Lv ${livello(c.id)}</small>
    <small><span class="s-${c.stile}">${STILI[c.stile].icona} ${STILI[c.stile].nome}</span> · ${esc(RUOLI[c.ruolo].nome)}</small></div>`;
  apriModale(`<div class="confronto"><h2>Confronto</h2>
    <div class="confronto-testa">${colonna(ca, sa)}<span class="confronto-vs">VS</span>${colonna(cb, sb)}</div>
    <table class="confronto-tab"><tbody>${righe.map(([n, k]) => `<tr><td class="${cella(sa[k], sb[k])}">${sa[k]}</td><th>${n}</th><td class="${cella(sb[k], sa[k])}">${sb[k]}</td></tr>`).join("")}
      <tr><td class="piccolo">${esc(RUOLI[ca.ruolo].passiva)}</td><th>Abilità</th><td class="piccolo">${esc(RUOLI[cb.ruolo].passiva)}</td></tr>
      <tr><td class="piccolo">${ca.mosse.map(m => `${m.costo}◆ ${esc(m.nome)}`).join("<br>")}</td><th>Mosse</th><td class="piccolo">${cb.mosse.map(m => `${m.costo}◆ ${esc(m.nome)}`).join("<br>")}</td></tr>
    </tbody></table>
    <p class="nota centro">${testoVs}</p>
    <div class="azioni centro"><button class="btn primario" data-azione="chiudi">Ok</button></div></div>`);
}

function vuoto(testo, bottone, azione) {
  return `<section class="vuoto"><p>${testo}</p><button class="btn primario" data-fx="onda" data-azione="${azione}">${bottone}</button></section>`;
}

// ---------- SFIDA ----------
function vistaSfida() {
  const pronte = S.squadre.map((s, i) => ({ s, i })).filter(x => x.s.carte.length === CARTE_SQUADRA);
  if (!pronte.length) {
    return possedute().length >= CARTE_SQUADRA
      ? vuoto(`Per sfidare il computer serve una squadra da ${CARTE_SQUADRA}.`, "Prepara la squadra", "vai-squadra")
      : vuoto(`Per sfidare il computer servono ${CARTE_SQUADRA} carte diverse. Ne hai ${possedute().length}.`, "Apri una bustina", "vai-bustine");
  }
  if (squadraAttiva().carte.length !== CARTE_SQUADRA) S.attiva = pronte[0].i;
  const sq = squadraAttiva();
  return `
  <section>
    <div class="titolo-riga"><h2>Scegli l'avversario</h2>
      <div class="filtri">${pronte.map(x => `<button class="chip" data-fx="gelatina" data-squadra-sfida="${x.i}" aria-pressed="${x.i === S.attiva}">${esc(x.s.nome)}</button>`).join("")}</div>
    </div>
    ${Online.htmlAmici()}
    <div class="prima-partita">${Graffiti.htmlPannello()}${Zaino.htmlPannello()}</div>
    ${BossGiorno.htmlSfida()}
    ${Settimana.htmlSfida()}
    ${socialeAttivo() ? `<div class="sfida-sociale">${Boss.htmlGrande()}<div class="amici-invito"><b>Sfida un amico</b><span class="nota">Combatti contro la squadra vera di un amico, guidata dal computer. Se vinci gli rubi un punto in classifica.</span><button class="btn primario" data-fx="spinta" data-azione="vai-amici">Scegli chi sfidare</button></div></div>
    <div class="titolo-riga piccola"><h3>Contro il computer</h3></div>` : ""}
    <div class="modo-riga">${segmento("modalita", "Modalità", [["classica", "Classica 5 contro 5"], ["rapida", "Rapida 3 contro 3"]])}</div>
    <div class="slot5 piccola">${sq.carte.map((id, i) => `<div class="${i >= carteBattaglia() ? "fuori-gioco" : ""}">${htmlCarta(PER_ID[id], { piccola: true })}</div>`).join("")}</div>
    <div class="livelli">
      ${LIVELLI_SFIDA.map((L, i) => `
        <button class="livello l-${L.id}" data-inclina data-fx="spinta" data-sfida="${L.id}" style="--i:${i}">
          <span class="livello-num">${i + 1}</span>
          <b>${L.nome}</b>
          <span>${L.desc}</span>
          <small>${(() => { const pr = premiSfida(L); return `Vittoria: +${pr.monete} monete · +${pr.xp} XP`; })()}</small>
        </button>`).join("")}
    </div>
  </section>`;
}

// ---------- PASS BATTAGLIA ----------
function iconaPremio(p) {
  if (p.pot) return `<span class="ico-pot"><b>+${p.pot}</b></span>`;
  if (p.monete && !p.bustine) return `<span class="ico-monete"><i></i><i></i><i></i></span>`;
  const tipi = Object.keys(p.bustine || {}), tot = tipi.reduce((a, t) => a + p.bustine[t], 0);
  const migliore = ["ultra", "leggendaria", "epica", "normale"].find(t => tipi.includes(t)) || "normale";
  return `<span class="ico-bustina b-${migliore}">${tot > 1 ? `<em>×${tot}</em>` : ""}</span>`;
}
function vistaPass() {
  const lv = livelloPass(), totale = PASS.livelli * PASS.xpLivello, max = lv >= PASS.livelli;
  const xpIn = max ? (S.pass.xp - totale) % PASS.xpBonus : S.pass.xp % PASS.xpLivello;
  const pct = xpIn / (max ? PASS.xpBonus : PASS.xpLivello) * 100;
  const r = daRiscuotere(), bonus = bonusDisponibili();
  const daScegliere = Object.keys(SCELTE_PASS).map(Number).filter(l => l <= lv && !S.pass.riscossi.includes(l));
  return `
  <section class="pass">
    <div class="pass-testa">
      <div class="pass-stemma" aria-hidden="true"><div class="stemma-giro"></div><span>${lv}</span></div>
      <div class="pass-info">
        <p class="serie-nome">Pass battaglia · Stagione ${PASS.stagione} · ${PASS.livelli} livelli</p>
        <h2 class="neon">${esc(PASS.nome)}</h2>
        <div class="xp"><div class="xp-barra"><i style="--p:${pct}%"></i></div>
          <small>${max ? `Pass completato! Prossimo scrigno a sorpresa: ${xpIn} / ${PASS.xpBonus} XP` : `${xpIn} / ${PASS.xpLivello} XP al livello ${lv + 1}`}</small></div>
      </div>
      <button class="btn oro" data-fx="coriandoli" data-azione="riscuoti-tutto" ${r - bonus - daScegliere.length > 0 ? "" : "disabled"}>${r - bonus - daScegliere.length > 0 ? `Riscuoti tutto (${r - bonus - daScegliere.length})` : "Niente da riscuotere"}</button>
    </div>
    <p class="nota">Vittorie: da 60 a 200 XP in base all'avversario · Sconfitta: ${XP_SCONFITTA} XP · Bustina aperta: ${XP_BUSTINA} XP · Ogni 10 livelli scegli tu il premio.
      ${daScegliere.length ? `<b class="oro-testo">Hai ${daScegliere.length === 1 ? "un premio" : daScegliere.length + " premi"} da scegliere (livello ${daScegliere.join(", ")}).</b>` : ""}</p>
    <div class="pass-pista" id="pass-pista">
      <div class="pista-cielo" id="pista-cielo">${skyline()}</div>
      <div class="pista">
        <div class="strada"><i class="strada-luce" id="strada-luce"></i></div>
        ${Array.from({ length: PASS.livelli }, (_, k) => {
          const l = k + 1, p = premioPass(l), preso = S.pass.riscossi.includes(l), libero = l <= lv;
          const stato = preso ? "preso" : libero ? "pronto" : "bloccato";
          if (p.scelta) {
            const scelto = S.pass.scelte ? S.pass.scelte[l] : undefined;
            return `<div class="nodo scelta ${stato}${l === lv + 1 ? " prossimo" : ""}" style="--i:${Math.min(k, 24)}">
              <div class="premio-doppio">
                <span class="scegli-tit">${preso ? "Premio scelto" : libero ? "Scegli il tuo premio" : `Livello ${l} · premio a scelta`}</span>
                <div class="opzioni">${p.scelta.map((o, j) => `<button class="opzione ${preso ? (scelto === j ? "scelta-fatta" : "scartata") : ""}" ${libero && !preso ? `data-fx="coriandoli" data-pass-scelta="${l}:${j}"` : "disabled"} aria-label="Livello ${l}, opzione ${j ? "B" : "A"}: ${esc(testoPremio(o))}">
                  ${iconaPremio(o)}<span class="premio-testo">${esc(testoPremio(o))}</span></button>`).join(`<em class="oppure">o</em>`)}</div>
              </div>
              <span class="nodo-punto"><b>${l}</b></span>
            </div>`;
          }
          const grande = p.bustine && (p.bustine.leggendaria || p.bustine.epica);
          return `<div class="nodo ${stato}${grande ? " grande" : ""}${l === lv + 1 ? " prossimo" : ""}" style="--i:${Math.min(k, 24)}">
            <button class="premio" data-inclina ${stato === "pronto" ? `data-fx="coriandoli" data-riscuoti="${l}"` : "disabled"} aria-label="Livello ${l}: ${esc(testoPremio(p))}${preso ? ", già riscosso" : libero ? ", da riscuotere" : ", bloccato"}">
              ${iconaPremio(p)}
              <span class="premio-testo">${esc(testoPremio(p))}</span>
              <span class="premio-stato">${preso ? "Riscosso" : libero ? "Riscuoti" : `Lv ${l}`}</span>
            </button>
            <span class="nodo-punto"><b>${l}</b></span>
          </div>`;
        }).join("")}
        <div class="nodo bonus ${max ? (bonus ? "pronto" : "attesa") : "bloccato"}" style="--i:24">
          <div class="premio-bonus">
            <span class="scrigno-ico" aria-hidden="true"><i></i><b>?</b></span>
            <b>Scrigno a sorpresa</b>
            <small>${max ? `Uno ogni ${PASS.xpBonus} XP, per sempre` : `Si apre dopo il livello ${PASS.livelli}: uno ogni ${PASS.xpBonus} XP`}</small>
            ${max ? `<div class="xp-barra"><i style="--p:${pct}%"></i></div>` : ""}
            <button class="btn ${bonus ? "oro" : ""} piccolo" data-fx="coriandoli" data-azione="pass-bonus" ${bonus ? "" : "disabled"}>${bonus ? `Apri (${bonus})` : max ? `${xpIn}/${PASS.xpBonus} XP` : "Bloccato"}</button>
          </div>
          <span class="nodo-punto"><b>∞</b></span>
        </div>
      </div>
    </div>
  </section>`;
}

// Profilo di palazzi generato una volta (stesso disegno ogni volta)
let _skyline = "";
function skyline() {
  if (_skyline) return _skyline;
  let seme = 7; const rnd = () => (seme = (seme * 16807) % 2147483647) / 2147483647;
  let x = 0, palazzi = "", finestre = "";
  while (x < 9000) {
    const w = 50 + rnd() * 90, h = 70 + rnd() * 170;
    palazzi += `<rect x="${x.toFixed(0)}" y="${(260 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`;
    for (let fy = 260 - h + 12; fy < 250; fy += 18) for (let fx = x + 8; fx < x + w - 10; fx += 16) if (rnd() < .22) finestre += `<rect x="${fx.toFixed(0)}" y="${fy.toFixed(0)}" width="6" height="8"/>`;
    x += w + 4 + rnd() * 20;
  }
  return (_skyline = `<svg viewBox="0 0 9000 260" preserveAspectRatio="xMinYMax slice" aria-hidden="true"><g class="palazzi">${palazzi}</g><g class="finestre">${finestre}</g></svg>`);
}

function dopoPass() {
  const pista = $("#pass-pista"), cielo = $("#pista-cielo");
  if (!pista) return;
  const lv = livelloPass(), nodi = $$(".nodo", pista);
  const nodo = nodi[Math.max(0, Math.min(nodi.length - 1, lv))];
  if (nodo) pista.scrollLeft = Math.max(0, nodo.offsetLeft - pista.clientWidth / 2 + nodo.offsetWidth / 2);
  // la luce sulla strada arriva fino al livello raggiunto (i nodi hanno larghezze diverse)
  const luce = $("#strada-luce"), strada = luce && luce.parentElement, att = nodi[Math.max(0, Math.min(nodi.length - 1, lv - 1))];
  if (luce && att) luce.style.width = lv ? Math.max(0, Math.min(strada.clientWidth, att.offsetLeft + att.offsetWidth / 2 - strada.offsetLeft)) + "px" : "0px";
  if (S.pass.potInSospeso) setTimeout(() => apriSceltaPotenziatori(S.pass.potInSospeso), 400);
  const parallasse = () => { cielo.style.transform = `translateX(${pista.scrollLeft * .55}px)`; };
  pista.addEventListener("scroll", parallasse, { passive: true });
  parallasse();
}

// Dà un premio. I potenziatori "a scelta" aprono la scelta della carta; quelli casuali vanno a una carta a caso.
function daiPremio(p) {
  const r = { monete: 0, bustine: 0 };
  if (p.monete) { S.monete += p.monete; r.monete += p.monete; }
  for (const [t, n] of Object.entries(p.bustine || {})) { S.inventario[t] = (S.inventario[t] || 0) + n; r.bustine += n; }
  if (p.pot && p.casuale) {
    const ok = possedute().filter(c => infoCarta(c.id).liv < LIVELLO_MAX);
    if (ok.length) { const c = ok[Math.floor(Math.random() * ok.length)]; S.pot[c.id] = (S.pot[c.id] || 0) + p.pot; p.carta = c.id; }
    else { S.monete += p.pot * 10; r.monete += p.pot * 10; p.pot = 0; p.monete = (p.monete || 0) + 250; }
  } else if (p.pot) S.pass.potInSospeso = (S.pass.potInSospeso || 0) + p.pot;
  return r;
}
async function animaPremio(r, origine) {
  const anim = [];
  if (r.monete) anim.push(FX.volaMonete(origine, $(".monete"), Math.min(14, 4 + Math.round(r.monete / 150))));
  if (r.bustine) anim.push(FX.volaIcona(origine, $('[data-vista="bustine"]'), "b-normale"));
  aggiornaTesta();
  await Promise.all(anim.concat(attesa(650)));
}
function ridisegnaPass() {
  const scroll = $("#pass-pista") ? $("#pass-pista").scrollLeft : 0;
  if (vista === "pass") { disegna(); const p = $("#pass-pista"); if (p) p.scrollLeft = scroll; }
}
async function riscuoti(livelli, origine) {
  // i premi a scelta non si riscuotono "in blocco": li scegli tu
  const lista = livelli.filter(l => l <= livelloPass() && !S.pass.riscossi.includes(l) && !SCELTE_PASS[l]);
  if (!lista.length) { if (livelli.length > 1) mostraAvviso("Restano solo i premi a scelta: tocca quello che preferisci."); return; }
  const tot = { monete: 0, bustine: 0 };
  for (const l of lista) {
    const r = daiPremio({ ...premioPass(l) });
    tot.monete += r.monete; tot.bustine += r.bustine;
    S.pass.riscossi.push(l);
    const n = $(`.nodo [data-riscuoti="${l}"]`);
    if (n) n.closest(".nodo").classList.add("riscosso-ora");
  }
  salva();
  try { await animaPremio(tot, origine); } catch (e) {}
  ridisegnaPass();
}
async function scegliPremioPass(l, j, origine) {
  if (l > livelloPass() || S.pass.riscossi.includes(l) || !SCELTE_PASS[l]) return;
  S.pass.scelte = S.pass.scelte || {};
  S.pass.scelte[l] = j;
  S.pass.riscossi.push(l);
  const p = { ...SCELTE_PASS[l][j] };
  const r = daiPremio(p);
  salva();
  const nodo = origine.closest(".nodo"); if (nodo) nodo.classList.add("riscosso-ora");
  try { await animaPremio(r, origine); } catch (e) {}
  ridisegnaPass();
  if (p.pot) apriSceltaPotenziatori(S.pass.potInSospeso);
}
// Scelta della carta a cui dare i potenziatori (non si può chiudere senza scegliere: il premio resta in sospeso)
function apriSceltaPotenziatori(n) {
  if (!n) return;
  const ok = possedute().filter(c => infoCarta(c.id).liv < LIVELLO_MAX).sort((a, b) => livello(b.id) - livello(a.id) || ORDINE_RARITA.indexOf(b.rarita) - ORDINE_RARITA.indexOf(a.rarita));
  if (!ok.length) {
    const m = n * 10; S.monete += m; S.pass.potInSospeso = 0; salva(); aggiornaTesta();
    mostraAvviso(`Hai tutte le carte al livello 30: i ${n} potenziatori diventano ${m} monete.`); return;
  }
  const squadra = new Set(squadraAttiva().carte);
  apriModale(`<div class="scelta-pot">
    <h2>+${n} potenziatori</h2>
    <p class="nota">Scegli la carta a cui darli. Quelle della tua squadra sono in cima.</p>
    <div class="griglia-pot">${[...ok.filter(c => squadra.has(c.id)), ...ok.filter(c => !squadra.has(c.id))].map(c => { const inf = infoCarta(c.id); return `<button class="pot-carta ${squadra.has(c.id) ? "in-squadra" : ""}" data-fx="stelle" data-pot-carta="${c.id}">
      ${htmlCarta(c, { piccola: true })}<small>Lv ${inf.liv} · ${inf.pot}/${inf.servePot}</small></button>`; }).join("")}</div>
  </div>`, { bloccata: true });
}
function datiPotenziatori(id, el) {
  const n = S.pass.potInSospeso || 0;
  if (!n || !PER_ID[id]) return;
  S.pot[id] = (S.pot[id] || 0) + n; S.pass.potInSospeso = 0; salva();
  if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 40, forma: "stella", colori: ["#6fe3a0", "#3fd8ff", "#fff"], velocita: 7, dimensione: 5, durata: 1000 }); }
  chiudiModale(); aggiornaTesta();
  const inf = infoCarta(id);
  mostraAvviso(`${PER_ID[id].nome}: +${n} potenziatori${inf.pronta ? " — ora puoi potenziarla!" : ""}`);
  ridisegnaPass();
}
// Scrigno a sorpresa
async function apriScrignoBonus(origine) {
  if (!bonusDisponibili()) return;
  S.pass.bonus = (S.pass.bonus || 0) + 1;
  const p = premioCasuale();
  const r = daiPremio(p);
  salva();
  try { await animaPremio(r, origine); } catch (e) {}
  const altri = bonusDisponibili();
  apriModale(`<div class="bonus-rivela">
    <div class="scrigno-grande" aria-hidden="true"><span class="scrigno-ico aperto"><i></i></span><div class="bonus-premio">${iconaPremio(p)}</div></div>
    <p class="serie-nome">Scrigno a sorpresa</p>
    <h2>${esc(testoPremio(p))}</h2>
    <div class="azioni centro">${altri ? `<button class="btn oro" data-fx="coriandoli" data-azione="pass-bonus">Apri il prossimo (${altri})</button>` : ""}<button class="btn" data-azione="chiudi">Chiudi</button></div>
  </div>`);
  const sc = $(".scrigno-grande"); if (sc) { const [x, y] = FX.centro(sc); FX.esplosione(x, y, { n: 70, forma: "coriandolo", colori: ["#f2c14e", "#ff2e46", "#3fd8ff", "#fff"], velocita: 8, dimensione: 5, durata: 1400 }); }
  ridisegnaPass();
}

// ---------- CLASSIFICA ----------
let classificaDati = null, classificaErrore = false, nomiCache = {};
// Premi di fine mese per i primi 3 (li assegna il server quando l'admin azzera la classifica)
const PREMI_CLASSIFICA = ["1000 monete + Bustina Leggendaria", "600 monete + Bustina Epica", "300 monete + 2 Bustine"];
async function ritiraPremiClassifica() {
  if (!socialeAttivo() || S.admin) return;
  let lista = [];
  try { lista = await rpcSociale("riscatta_premi_classifica"); } catch (e) { return; }
  if (!Array.isArray(lista) || !lista.length) return;
  const righe = [];
  for (const x of lista) {
    const p = x.premio || {};
    if (p.monete) S.monete += Math.min(5000, +p.monete || 0);
    for (const [t, n] of Object.entries(p.bustine || {})) if (TIPI_BUSTINA[t]) S.inventario[t] = (S.inventario[t] || 0) + Math.min(10, +n || 0);
    righe.push(x);
  }
  salva(); aggiornaTesta();
  const medaglie = ["🥇", "🥈", "🥉"];
  const mostra = () => {
    if (B || Tutorial.attivo || !$("#accesso").hidden || !$("#modale").hidden || !$("#apertura").hidden) { setTimeout(mostra, 2000); return; }
    apriModale(`<div class="codice-modale premio-classifica"><span class="codice-tag">${righe.some(x => x.tipo === "torneo") ? "Premi" : "Classifica del mese"}</span>
      ${righe.map(x => `<div class="premio-podio"><span class="medaglia">${medaglie[x.posizione - 1] || "🏅"}</span>
        <h2>${x.posizione}° posto!</h2><p>${x.tipo === "torneo" ? `🏆 ${esc(String(x.titolo || "Torneo"))}` : `${esc(String(x.titolo || "Classifica"))} · ${Number(x.punti) || 0} punti`}</p>
        <p class="codice-premio">Hai ricevuto: <b>${esc(x.tipo === "torneo" ? testoPremio(x.premio || {}) : PREMI_CLASSIFICA[x.posizione - 1] || "")}</b></p></div>`).join("")}
      <div class="azioni centro"><button class="btn oro" data-azione="chiudi">Grande!</button></div></div>`);
    FX.esplosione(innerWidth / 2, innerHeight / 3, { n: 110, forma: "coriandolo", colori: ["#f2c14e", "#fff3c4", "#ff2e46", "#3fd8ff"], velocita: 9, dimensione: 6 });
  };
  setTimeout(mostra, 1200);
}
// albo d'oro: da quando conta la classifica e i podi delle classifiche azzerate
let albo = null;
async function caricaAlbo() {
  if (albo || !socialeAttivo()) return;
  albo = { dal: null, storico: [] };
  try { const { data } = await sbSociale().from("config").select("dati").eq("id", "classifica"); const d = (data && data[0] && data[0].dati) || {}; albo = { dal: d.dal || null, titolo: typeof d.titolo === "string" ? d.titolo : "", storico: Array.isArray(d.storico) ? d.storico : [] }; }
  catch (e) { albo = null; return; }
  if ((vista === "classifica" || vista === "admin") && !B) disegna();
}
const titoloClassifica = () => (albo && albo.titolo) || "Classifica del gruppo";
function htmlAlbo() {
  if (!albo) { setTimeout(caricaAlbo, 0); return ""; }
  const data = x => new Date(x).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  const medaglie = ["🥇", "🥈", "🥉"];
  const passate = albo.storico.filter(x => x && Array.isArray(x.podio) && x.podio.length).slice(0, 6);
  return `${albo.dal ? `<p class="nota">Punti contati dal ${esc(data(albo.dal))}.</p>` : ""}
    ${passate.length ? `<details class="albo"><summary>Albo d'oro (${passate.length})</summary><ul>${passate.map(x => `<li><small>${x.titolo ? `<b>${esc(String(x.titolo))}</b> · ` : ""}${x.dal ? `${esc(data(x.dal))} – ` : "fino al "}${esc(data(x.al))}</small>
      <span>${x.podio.map((p, i) => `${medaglie[i] || ""} <b>${esc(String(p.nome || "Giocatore"))}</b> ${Number(p.punti) || 0}`).join(" · ")}</span></li>`).join("")}</ul></details>` : ""}`;
}
function vistaClassifica() {
  if (Archivio.modo !== "cloud") return `
    <section class="vuoto"><h2>Classifica del gruppo</h2>
    <p>La classifica funziona quando giochi dalla pagina condivisa con il tuo account. In questo momento i progressi sono salvati solo su questo dispositivo.</p>
    <p class="nota">I tuoi numeri: ${S.stats.vinteVivo || 0} vittorie dal vivo, ${possedute().length} carte, pass livello ${livelloPass()}.</p></section>`;
  if (classificaErrore) return `<section class="vuoto"><h2>Classifica del gruppo</h2><p>Non riesco a leggere la classifica in questo momento. Riprova più tardi.</p></section>`;
  if (!classificaDati) return `<section class="vuoto"><h2>Classifica del gruppo</h2><p>Carico la classifica…</p></section>`;
  if (!classificaDati.length) return `<section class="vuoto"><h2>Classifica del gruppo</h2><p>Nessuno in classifica per ora. Vinci una sfida dal vivo contro un amico per entrare per primo.</p></section>`;
  return `
  <section>
    <div class="titolo-riga"><h2>${esc(titoloClassifica())}</h2></div>
    <p class="nota">Contano solo le sfide dal vivo: +3 punti per ogni vittoria, 0 per le sconfitte. A fine mese premi ai primi tre: 🥇 ${PREMI_CLASSIFICA[0]} · 🥈 ${PREMI_CLASSIFICA[1]} · 🥉 ${PREMI_CLASSIFICA[2]}.</p>
    ${htmlAlbo()}
    ${Torneo.htmlTabellone()}
    <table class="classifica">
      <thead><tr><th>#</th><th>Giocatore</th><th>Punti</th><th>Vinte / giocate</th><th>Carte</th><th>Pass</th>${socialeAttivo() ? "<th></th>" : ""}</tr></thead>
      <tbody>${classificaDati.map((r, i) => `
        <tr class="${r.id === Archivio.uid ? "io" : ""}" style="--i:${i}"><td>${i + 1}</td><td class="chi">${htmlAvatar(String(r.avatar || ""), "mini")}${r.id !== Archivio.uid && Online.eOnline(r.id) ? `<span class="pallino-online" title="Online adesso"></span>` : ""}${esc(String(r.nome || "") || nomiCache[r.id] || (r.id === Archivio.uid ? "Tu" : "Giocatore"))}${r.titolo ? `<small class="titolo-giocatore">${esc(String(r.titolo).slice(0, 30))}</small>` : ""}</td>
        <td>${Number(r.punti) || 0}</td><td>${Number(r.vinte_vivo) || 0}/${Number(r.giocate_vivo) || 0}</td><td>${Number(r.carte) || 0}/${CARTE.length}</td><td>Lv ${Number(r.pass) || 0}</td>${socialeAttivo() ? `<td>${r.id !== Archivio.uid ? `<span class="sfida-celle"><button class="btn piccolo" data-fx="spinta" data-sfida-amico="${esc(r.id)}">Sfida</button>${Online.eOnline(r.id) ? `<button class="btn piccolo primario" data-fx="spinta" data-sfida-vivo="${esc(r.id)}">Dal vivo</button>` : ""}</span>` : ""}</td>` : ""}</tr>`).join("")}</tbody>
    </table>
  </section>`;
}

let classificaTimer = null;
function avviaClassifica() {
  if (Archivio.modo !== "cloud" || Archivio._stopClassifica) return;
  classificaTimer = setTimeout(() => { if (!classificaDati) { classificaErrore = true; if (vista === "classifica") disegna(); } }, 10000);
  Archivio.ascoltaClassifica(async righe => {
    clearTimeout(classificaTimer); classificaErrore = false;
    // ogni salvataggio di un amico tocca la sua riga (anche solo l'ora): ridisegno solo se cambia qualcosa che si vede
    const firma = JSON.stringify(righe.map(r => [r.id, r.punti, r.vinte_vivo, r.giocate_vivo, r.carte, r.pass, r.nome, r.avatar, r.titolo_id]));
    const uguale = classificaDati && firma === avviaClassifica._firma;
    avviaClassifica._firma = firma;
    classificaDati = righe;
    if (uguale) { Amici.aggiornaElenco(); return; }
    try {
      const ids = righe.map(r => r.id).filter(id => !(id in nomiCache));
      if (ids.length && Archivio.user && Archivio.user.profiles) {
        const ps = await Archivio.user.profiles(ids);
        for (const id of ids) nomiCache[id] = (ps && ps[id] && ps[id].name) || "";
      }
    } catch (e) { /* senza nomi si vede "Giocatore" */ }
    if (vista === "classifica") disegnaQuieto();
    if (vista === "album" && albumScheda === "scambi" && !B && $("#modale").hidden) disegnaQuieto();
    Amici.aggiornaElenco();
  }, () => { clearTimeout(classificaTimer); classificaErrore = true; if (vista === "classifica") disegna(); });
}

// ============================================================
//  ACCESSO, PROFILO, IMPOSTAZIONI E ADMIN
// ============================================================
const VELOCITA = { normale: 1, veloce: 1.8, turbo: 3.5 };
const imp = () => Object.assign({}, IMPOSTAZIONI_BASE, S.impostazioni || {});
const usa3D = () => Scena3D.disponibile && imp().grafica !== "2d";
const carteBattaglia = () => imp().modalita === "rapida" ? 3 : CARTE_SQUADRA;
function premiSfida(L) {
  const r = imp().modalita === "rapida";
  return { monete: r ? Math.round(L.premio * .6) : L.premio, punti: r ? Math.max(1, Math.round(L.punti / 2)) : L.punti, xp: r ? Math.round(L.xp * .6) : L.xp };
}
function applicaImpostazioni() {
  const i = imp();
  Scena3D.imposta({ velocita: VELOCITA[i.velocita] || 1, effetti: i.effetti, qualita: i.grafica === "bassa" ? "bassa" : "alta" });
  document.body.classList.toggle("modo-admin", !!S.admin);
}

function htmlAvatar(id, cls = "") {
  return PER_ID[id] ? `<img class="avatar ${cls}" src="${imgCarta(id)}" alt="">` : `<span class="avatar vuoto ${cls}" aria-hidden="true">?</span>`;
}
// L'avatar si sceglie solo tra le carte che hai trovato (l'admin le ha tutte)
const avatarValido = id => !!(id && PER_ID[id] && S && S.carte && S.carte[id] > 0);
function htmlSceltaAvatar(sel) {
  const mie = possedute();
  if (!mie.length) return `<p class="nota">Puoi scegliere come avatar solo le carte che hai trovato: apri la tua prima bustina e torna qui.</p>`;
  return `<p class="nota">Puoi scegliere tra le ${mie.length} carte che hai trovato: più ne trovi, più avatar hai.</p><div class="scelta-avatar" role="radiogroup" aria-label="Scegli il tuo avatar">${mie.map(c => `<button type="button" class="av-btn ${c.id === sel ? "sel" : ""}" data-fx="salto" data-avatar="${c.id}" role="radio" aria-checked="${c.id === sel}" title="${esc(c.nome)}"><img src="${imgCarta(c.id)}" alt="${esc(c.nome)}"></button>`).join("")}</div>`;
}

// ---------- Schermata di accesso ----------
let avatarScelto = "";
function mostraAccesso(vistaForm) {
  const el = $("#accesso");
  el.hidden = false;
  document.body.classList.add("in-accesso");
  const sfondo = `<div class="accesso-sfondo" aria-hidden="true">${["reina", "ligulk", "loca", "ironlus", "ombra", "mauthor", "fuego"].map((id, i) => `<img src="${imgCarta(id)}" alt="" style="--i:${i}">`).join("")}</div>`;
  let corpo;
  if (Archivio.modo === "cloud" && S.profilo.nome && !vistaForm) {
    corpo = `
      <div class="accesso-box">
        <h1 class="neon">Noiverso</h1>
        <div class="accesso-chi">${htmlAvatar(S.profilo.avatar, "grande")}<div><small>Bentornato</small><b>${esc(S.profilo.nome)}</b><span class="nota">${window.NOIVERSO_SUPABASE ? `Collegato come <b>${esc(Archivio.nomeAccount)}</b>` : "Accesso con il tuo account Claude"}</span></div></div>
        <button class="btn primario grande" data-fx="onda" data-azione="entra">Gioca</button>
        ${Archivio.proprietario ? `<button class="btn oro" data-fx="coriandoli" data-azione="entra-admin">Entra come admin</button>` : ""}
        <p class="nota piccola">Progressi, squadre e impostazioni sono solo tuoi: ognuno entra con il proprio account.</p>
      </div>`;
  } else if (Archivio.modo === "cloud" || vistaForm) {
    avatarScelto = avatarScelto || S.profilo.avatar || "";
    corpo = `
      <form class="accesso-box" id="form-profilo">
        <h1 class="neon">Noiverso</h1>
        <h2>${vistaForm === "nuovo" ? "Nuovo giocatore" : "Crea il tuo profilo"}</h2>
        <label for="nome-profilo">Nome in gioco</label>
        <input id="nome-profilo" maxlength="20" required autocomplete="nickname" value="${esc(vistaForm === "nuovo" ? "" : (S.profilo.nome || Archivio.nomeAccount || ""))}" placeholder="Come ti chiamano">
        <p class="nota">L'avatar lo scegli dopo, dal tuo profilo, tra le carte che troverai.</p>
        <p class="errore" id="errore-profilo" hidden></p>
        <button class="btn primario grande" data-fx="onda" type="submit">Entra in strada</button>
        ${vistaForm === "nuovo" ? `<button class="btn" type="button" data-azione="torna-accesso">Indietro</button>` : ""}
        ${Archivio.modo === "cloud" && Archivio.proprietario ? `<button class="btn oro" type="button" data-fx="coriandoli" data-azione="entra-admin">Entra come admin</button>` : ""}
      </form>`;
  } else {
    const lista = Profili.leggi().lista;
    corpo = `
      <div class="accesso-box">
        <h1 class="neon">Noiverso</h1>
        <h2>Chi gioca?</h2>
        <p class="nota piccola">Non sei collegato con un account online: i profili restano su questo dispositivo.</p>
        <div class="profili">
          ${lista.map((p, i) => `<button class="profilo-btn" data-fx="salto" data-profilo="${esc(p.id)}" style="--i:${i}">${htmlAvatar(p.avatar)}<b>${esc(p.nome)}</b></button>`).join("")}
          <button class="profilo-btn nuovo" data-fx="salto" data-azione="nuovo-profilo"><span class="avatar vuoto">+</span><b>Nuovo giocatore</b></button>
        </div>
      </div>`;
  }
  el.innerHTML = sfondo + corpo;
}

async function entra(slot, profiloLocale) {
  $("#accesso").classList.add("esce");
  await Archivio.usaSlot(slot);
  if (profiloLocale) Archivio.profiloLocale = profiloLocale;
  await caricaStato();
  if (slot === "admin") preparaAdmin();
  else S.admin = false;
  applicaImpostazioni();
  const nuova = bustinaDelGiorno();
  const el = $("#accesso");
  el.hidden = true; el.classList.remove("esce"); el.innerHTML = "";
  document.body.classList.remove("in-accesso");
  aggiornaSalvataggio();
  aggiornaTesta();
  vai(S.admin ? "admin" : VISTE.includes(location.hash.slice(1)) && location.hash.slice(1) !== "admin" ? location.hash.slice(1) : "strada");
  if (nuova && S.stats.bustine > 0 && !S.admin) setTimeout(() => mostraAvviso("È arrivata la bustina del giorno!"), 500);
  if (slot === "admin") setTimeout(() => mostraAvviso("Modalità admin: monete infinite e tutte le carte. Questi progressi non vanno in classifica."), 400);
  Tutorial.allIngresso();
  if (slot !== "admin") Missioni.finestraAccesso();
  Zaino.carica(); Reazioni.carica(); Sinergie.carica(); Settimana.carica(); Torneo.carica(true);
  Graffiti.carica().then(() => { if (slot !== "admin") Graffiti.regaloIniziale(); });
  if (slot !== "admin") { Amici.controllaRicevute(); Scambi.ritira(); Scambi.carica(); Online.avvia(); ritiraPremiClassifica(); }
  Boss.carica();
}

async function inviaProfilo(form) {
  const nome = $("#nome-profilo").value.trim().slice(0, 20);
  const err = $("#errore-profilo");
  if (!nome) { err.textContent = "Scrivi un nome per entrare."; err.hidden = false; return; }
  if (Archivio.modo !== "cloud") {
    const id = Profili.aggiungi(nome, "");
    await entra("partita", id);
    S.profilo = { nome, avatar: "" };
    salva(); aggiornaTesta();
  } else {
    S.profilo = { nome, avatar: "" };
    salva();
    await entra("partita");
  }
  avatarScelto = "";
}

function preparaAdmin() {
  S.admin = true;
  if (!S.profilo.nome) S.profilo = { nome: "Admin", avatar: S.profilo.avatar || "reina" };
  if (!S.adminPronto) {
    for (const c of CARTE) S.carte[c.id] = Math.max(S.carte[c.id] || 0, 1);
    S.inventario = { benvenuto: 0, normale: 10, epica: 10, leggendaria: 10 };
    S.pass.xp = PASS.livelli * PASS.xpLivello;
    S.squadre[0].carte = ["reina", "ligulk", "ironlus", "mauthor", "ombra"];
    S.adminPronto = true;
  }
  // tutte le carte, comprese quelle aggiunte dopo, sempre al livello massimo per l'admin
  for (const c of CARTE) { S.carte[c.id] = Math.max(S.carte[c.id] || 0, 1); if (!S.adminLivelli || !S.liv[c.id]) { S.liv[c.id] = LIVELLO_MAX; S.lodeXp[c.id] = XP_LODE; } }
  S.adminLivelli = true;
  S.monete = 999999;
  salva();
}

// ---------- Profilo e impostazioni (finestra) ----------
function segmento(chiave, etichetta, opzioni, aiuto) {
  const v = imp()[chiave];
  return `<div class="imp-riga"><div><b>${etichetta}</b>${aiuto ? `<small>${aiuto}</small>` : ""}</div>
    <div class="segmenti" role="radiogroup" aria-label="${esc(etichetta)}">${opzioni.map(([val, testo]) => `<button type="button" class="seg ${String(v) === String(val) ? "sel" : ""}" data-fx="gelatina" data-imp="${chiave}" data-val="${val}" role="radio" aria-checked="${String(v) === String(val)}">${testo}</button>`).join("")}</div></div>`;
}
function apriProfilo() {
  avatarScelto = avatarValido(S.profilo.avatar) ? S.profilo.avatar : "";
  const tipo = S.admin ? "Account admin" : Archivio.modo === "cloud" ? (window.NOIVERSO_SUPABASE ? `Account · ${Archivio.nomeAccount}` : "Account Claude") : "Profilo su questo dispositivo";
  apriModale(`
    <div class="profilo-modale">
      <div class="profilo-testa">${htmlAvatar(S.profilo.avatar, "grande")}<div><small>${tipo}</small><h2>${esc(S.profilo.nome || "Giocatore")}</h2>
        <span class="nota">${S.admin ? "Monete infinite · tutte le carte · fuori classifica" : `${S.stats.vittorie} vittorie · ${possedute().length}/${CARTE.length} carte · pass Lv ${livelloPass()}`}</span></div></div>
      <details class="profilo-modifica" ${!S.profilo.avatar && possedute().length ? "open" : ""}>
        <summary>${S.profilo.avatar ? "Cambia nome e avatar" : "Scegli il tuo avatar"}</summary>
        <form id="form-modifica">
          <label for="nome-modifica">Nome in gioco</label>
          <input id="nome-modifica" maxlength="20" value="${esc(S.profilo.nome || "")}">
          ${htmlSceltaAvatar(avatarScelto)}
          <button class="btn primario" data-fx="onda" type="submit">Salva profilo</button>
        </form>
      </details>
      <h3>Impostazioni</h3>
      ${segmento("modalita", "Modalità di gioco", [["classica", "Classica 5 contro 5"], ["rapida", "Rapida 3 contro 3"]], "La rapida usa le prime 3 carte della squadra e dà premi ridotti.")}
      ${segmento("velocita", "Velocità animazioni", [["normale", "Normale"], ["veloce", "Veloce"], ["turbo", "Turbo"]])}
      ${segmento("consigli", "Mossa consigliata", [["true", "Sì"], ["false", "No"]], "Solo contro il computer: nelle sfide dal vivo con gli amici è sempre spenta.")}
      ${segmento("effetti", "Effetti delle mosse finali", [["true", "Sì"], ["false", "No"]], "Fascia con il nome della mossa ed effetti su tutto lo schermo.")}
      ${segmento("grafica", "Grafica", [["alta", "3D alta"], ["bassa", "3D leggera"], ["2d", "2D"]], "Se il telefono scalda o va a scatti, prova la leggera o il 2D.")}
      <h3>Account</h3>
      <div class="azioni">
        ${Archivio.proprietario && Archivio.modo === "cloud" ? (S.admin ? `<button class="btn" data-fx="onda" data-azione="esci-admin">Torna al tuo profilo</button>` : `<button class="btn oro" data-fx="coriandoli" data-azione="entra-admin">Passa ad admin</button>`) : ""}
        <button class="btn" data-fx="salto" data-azione="rifai-tutorial">Rifai il tutorial</button>
        <button class="btn" data-fx="salto" data-azione="vai-accesso">${Archivio.modo === "cloud" ? "Torna all'accesso" : "Cambia giocatore"}</button>
        ${window.NOIVERSO_SUPABASE && !matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches && !navigator.standalone ? `<a class="btn oro" data-fx="salto" href="installa.html" target="_blank" rel="noopener">Installa l'app</a>` : ""}
        ${window.NOIVERSO_SUPABASE ? `<button class="btn" data-fx="scuoti" data-azione="esci-account">Esci dall'account</button>` : ""}
      </div>
      ${window.NOIVERSO_SUPABASE ? `<p class="nota piccola">Questo dispositivo resta collegato: non devi rimettere la password. "Esci dall'account" serve se il dispositivo non è tuo.</p>` : ""}
    </div>`);
}

async function vaiAccesso() {
  chiudiModale();
  await Archivio.aspettaScritture();
  if (Archivio.modo === "cloud") { await Archivio.usaSlot("partita"); await caricaStato(); applicaImpostazioni(); }
  mostraAccesso();
}

// ---------- Pannello admin ----------
function vistaAdmin() {
  if (!S.admin) return vuoto("Questa pagina è solo per l'admin.", "Torna in strada", "vai-strada");
  return `
  <section class="admin">
    <div class="titolo-riga"><h2>Pannello admin</h2><p class="nota">Solo tu vedi questa pagina. Qui le monete sono infinite e niente finisce in classifica.</p></div>
    <div class="admin-griglia">
      <div class="admin-box"><h3>Carte · ${possedute().length}/${CARTE.length}</h3>
        <div class="azioni"><button class="btn oro" data-fx="coriandoli" data-admin="carte-lode">Tutte al 30 e lode</button><button class="btn" data-fx="stelle" data-admin="carte-max">Tutte al livello 30</button><button class="btn" data-fx="salto" data-admin="carte-15">Tutte al livello 15</button><button class="btn" data-fx="salto" data-admin="carte-1">Tutte al livello 1</button><button class="btn" data-fx="monete" data-admin="pot-100">+100 potenziatori a tutte</button><button class="btn" data-fx="stelle" data-admin="olo-5">5 olografiche a caso</button><button class="btn oro" data-fx="stelle" data-admin="tutte-speciali">Tutte Ultra e olografiche</button><button class="btn" data-fx="scuoti" data-admin="togli-speciali">Togli Ultra e olografiche</button><button class="btn" data-fx="scuoti" data-admin="carte-zero">Svuota collezione</button></div></div>
      <div class="admin-box"><h3>Bustine</h3>
        <div class="azioni"><button class="btn" data-fx="onda" data-admin="bustine">+10 di ogni tipo</button><button class="btn oro" data-fx="coriandoli" data-apri="leggendaria">Apri una leggendaria</button></div>
        <p class="nota">Ne hai: ${ORDINE_BUSTINE.filter(t => S.inventario[t]).map(t => `${TIPI_BUSTINA[t].nome.replace("Bustina ", "").replace("Bustina", "Normali")} ${S.inventario[t]}`).join(" · ") || "nessuna"}</p></div>
      <div class="admin-box"><h3>Pass battaglia</h3>
        <label for="admin-pass">Livello: <b id="admin-pass-val">${livelloPass()}</b></label>
        <input type="range" id="admin-pass" min="0" max="${PASS.livelli}" value="${livelloPass()}">
        <div class="azioni"><button class="btn" data-fx="onda" data-admin="pass">Imposta livello</button><button class="btn" data-fx="salto" data-admin="pass-reset">Azzera premi riscossi</button><button class="btn oro" data-fx="coriandoli" data-admin="pass-bonus">Oltre il 100: +3 scrigni</button></div></div>
      <div class="admin-box largo"><h3>Prova le animazioni</h3>
        <p class="nota">Scegli una carta e una mossa: parte una battaglia di prova con energia piena e la mossa viene lanciata subito.</p>
        <div class="prova-riga">
          <select id="prova-carta">${CARTE.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select>
          <select id="prova-mossa">${PER_ID[CARTE[0].id].mosse.map((m, i) => `<option value="${i}">${esc(m.nome)} (${m.costo}◆)</option>`).join("")}</select>
          <button class="btn primario" data-fx="spinta" data-admin="prova">Guarda l'animazione</button>
        </div></div>
      <div class="admin-box"><h3>In battaglia</h3>
        <p class="nota">Nelle sfide da admin trovi in alto i tasti <b>◆ Piena</b> (energia al massimo) e <b>Vinci</b> (vittoria immediata).</p>
        <p class="nota">Versione del gioco: <b>${VERSIONE}</b> · ${CARTE.length} carte. Il gioco si aggiorna da solo quando pubblico una versione nuova. <button class="btn piccolo" data-fx="salto" data-azione="controlla-versione">Controlla adesso</button></p></div>
      <div class="admin-box largo" id="editor-carte">${htmlEditorCarte()}</div>
      <div class="admin-box largo" id="admin-immagini">${htmlAdminImmagini()}</div>
      <div class="admin-box largo" id="admin-graffiti">${Graffiti.htmlAdmin()}</div>
      <div class="admin-box largo" id="admin-zaino">${Zaino.htmlAdmin()}</div>
      <div class="admin-box largo" id="admin-stat">${StatCarte.htmlAdmin()}</div>
      <div class="admin-box largo" id="admin-sinergie">${Sinergie.htmlAdmin()}</div>
      <div class="admin-box largo" id="admin-evidenza">${Settimana.htmlAdmin()}</div>
      <div class="admin-box largo" id="admin-torneo">${Torneo.htmlAdmin()}</div>
      <div class="admin-box largo" id="admin-reazioni">${Reazioni.htmlAdmin()}</div>
      <div class="admin-box largo" id="admin-codici">${htmlAdminCodici()}</div>
      <div class="admin-box largo" id="admin-controlli">${htmlAdminControlli()}</div>
      <div class="admin-box"><h3>Classifica</h3>
        <form id="form-titolo-classifica" class="form-codice" autocomplete="off">
          <label>Titolo della classifica <input name="titolo" maxlength="60" value="${esc(albo ? titoloClassifica() : "")}" placeholder="${albo ? "" : "Carico…"}"></label>
          <div class="azioni"><button class="btn primario" type="submit">Salva il titolo</button></div>
        </form>${albo ? "" : (setTimeout(caricaAlbo, 0), "")}
        <p class="nota">Azzera punti e partite giocate di tutti, per esempio all'inizio di ogni mese. Il podio di adesso finisce nell'albo d'oro, visibile in classifica, i primi tre ricevono i premi (🥇 ${PREMI_CLASSIFICA[0]}, 🥈 ${PREMI_CLASSIFICA[1]}, 🥉 ${PREMI_CLASSIFICA[2]}) la prossima volta che aprono il gioco, e il titolo diventa quello del mese nuovo (poi puoi cambiarlo). Le vittorie restano valide per i trofei.</p>
        <div class="azioni"><button class="btn" data-admin="azzera-classifica">Azzera la classifica</button></div></div>
      <div class="admin-box"><h3>Il tuo profilo normale</h3>
        <p class="nota">Riparte da zero il tuo profilo da giocatore (non quello admin).</p>
        <button class="btn" data-fx="scuoti" data-admin="reset-normale">Azzera profilo normale</button></div>
    </div>
  </section>`;
}

// ---------- Immagini delle carte nello spazio privato (solo admin, versione pubblicata) ----------
function htmlAdminImmagini() {
  if (!window.NOIVERSO_SUPABASE) return `<h3>Immagini delle carte</h3><p class="nota">Si gestiscono nella versione pubblicata su Supabase.</p>`;
  setTimeout(aggiornaStatoImmagini, 0);
  return `<h3>Immagini delle carte</h3>
    <p class="nota">Le immagini stanno in uno spazio privato di Supabase: le vede solo chi ha fatto l'accesso. Per una carta nuova carica la foto chiamata con il nome della carta (es. <b>LaReina.png</b>) o con il suo codice (es. <b>reina.webp</b>): la porto io al formato giusto.</p>
    <p id="stato-immagini" class="nota">Controllo le immagini…</p>
    <div class="azioni">
      <label class="btn primario" data-fx="onda">Carica foto…<input type="file" id="img-file" accept="image/*" multiple hidden></label>
    </div>`;
}
async function aggiornaStatoImmagini() {
  const el = $("#stato-immagini"); if (!el) return;
  try {
    const ci = new Set(await ImmaginiCarte.elenco()), mancano = CARTE.filter(c => !ci.has(ImmaginiCarte.file(c.id)));
    el.innerHTML = mancano.length ? `<b class="errore">Ne mancano ${mancano.length} su ${CARTE.length}:</b> ${mancano.slice(0, 20).map(c => esc(c.nome)).join(", ")}${mancano.length > 20 ? "…" : ""}` : `<b>Tutte le ${CARTE.length} immagini sono nello spazio privato.</b>`;
  } catch (e) { el.innerHTML = `<b class="errore">Non riesco a leggere lo spazio delle immagini.</b> Hai eseguito di nuovo schema.sql su Supabase?`; }
}
const normNome = t => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
async function dopoImmagini(ok, ko, cosa) {
  ImmaginiCarte.dimentica(); await ImmaginiCarte.prepara(CARTE.map(c => c.id), true); Scena3D.svuotaCache();
  mostraAvviso(`${cosa}: ${ok} caricate${ko.length ? `, ${ko.length} non riuscite (${ko.slice(0, 6).join(", ")}${ko.length > 6 ? "…" : ""})` : ""}.`);
  disegna();
}
async function trasferisciImmagini() {
  const el = $("#stato-immagini"), ko = []; let ok = 0;
  for (const [i, c] of CARTE.entries()) {
    if (el) el.textContent = `Trasferisco ${i + 1}/${CARTE.length}: ${c.nome}…`;
    try { const r = await fetch(`img/${c.id}.webp`, { cache: "no-store" }); if (!r.ok) throw 0; await ImmaginiCarte.carica(c.id, await r.blob(), true); ok++; }
    catch (e) { ko.push(c.nome); }
  }
  await dopoImmagini(ok, ko, "Trasferimento");
}
async function caricaFileImmagini(files) {
  const el = $("#stato-immagini"), ko = []; let ok = 0;
  const perNome = {}; CARTE.forEach(c => { perNome[normNome(c.id)] = c.id; perNome[normNome(c.nome)] = c.id; });
  for (const [i, f] of [...files].entries()) {
    const id = perNome[normNome(f.name.replace(/\.[^.]+$/, ""))];
    if (!id) { ko.push(f.name); continue; }
    if (el) el.textContent = `Carico ${i + 1}/${files.length}: ${PER_ID[id].nome}…`;
    try { await ImmaginiCarte.carica(id, f, /\.webp$/i.test(f.name) && f.name.toLowerCase() === ImmaginiCarte.file(id) + ".webp"); ok++; } catch (e) { ko.push(f.name); }
  }
  await dopoImmagini(ok, ko, "Caricamento");
}

// ---------- Controlli contro i trucchi (solo admin) ----------
// Il server annota le cose strane; qui le metto in ordine per giocatore, in parole semplici, con i rimedi.
let segnalazioni = null;
async function caricaControlli() {
  try { segnalazioni = await rpcSociale("segnalazioni"); } catch (e) { segnalazioni = { errore: e.message }; }
  const box = $("#admin-controlli"); if (box) box.innerHTML = htmlAdminControlli();
}
function testoSegnalazione(x) {
  const d = x.dettagli || {}, n = v => Number(v || 0).toLocaleString("it-IT");
  const quando = new Date(x.quando).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const T = {
    titolo: [2, `Ha provato a mostrare in classifica un titolo che non ha conquistato. Il server l'ha nascosto da solo.`],
    monete: [1, `In un solo salvataggio le monete sono passate da ${n(d.da)} a ${n(d.a)}. Se gli hai dato un codice con tante monete è normale; se succede spesso, no.`],
    vittorie: [2, `In un solo salvataggio le vittorie sono passate da ${n(d.da)} a ${n(d.a)}: di solito il gioco salva dopo ogni battaglia.`],
    "sfide-veloci": [3, `Il ${d.giorno ? new Date(d.giorno).toLocaleDateString("it-IT") : "?"} ha fatto ${n(d.quante)} sfide tra amici a meno di 25 secondi l'una dall'altra: una battaglia vera dura di più.`],
    "sempre-vinte": [1, `${n(d.quante)} sfide tra amici in 2 settimane, tutte vinte. Può essere solo molto forte: guarda se ci sono anche altre segnalazioni.`],
    "boss-alto": [2, `Media di ${n(d.media)} danni per attacco al boss in ${n(d.colpi)} attacchi (il massimo è 6.000).`],
    rimedio: [0, `Hai già fatto: ${esc(String(d.cosa || ""))}${d.quante !== undefined ? ` (${n(d.quante)})` : ""}.`],
  }[x.tipo] || [1, esc(x.tipo)];
  return { gravita: T[0], testo: T[1], quando };
}
function htmlAdminControlli() {
  const titolo = `<h3>Controlli contro i trucchi</h3>`;
  if (!window.NOIVERSO_SUPABASE) return titolo + `<p class="nota">Funzionano nella versione pubblicata su Supabase.</p>`;
  if (!segnalazioni) { setTimeout(caricaControlli, 0); return titolo + `<p class="nota">Controllo…</p>`; }
  if (segnalazioni.errore) return titolo + `<p class="errore">${esc(segnalazioni.errore)}. Hai eseguito di nuovo schema.sql su Supabase?</p>`;
  const perGiocatore = {};
  for (const x of segnalazioni) (perGiocatore[x.user_id] = perGiocatore[x.user_id] || { nome: x.nome, voci: [] }).voci.push(x);
  const giocatori = Object.entries(perGiocatore).map(([id, g]) => {
    const voci = g.voci.map(x => ({ x, ...testoSegnalazione(x) })).sort((a, b) => b.gravita - a.gravita);
    return { id, nome: g.nome, voci, peso: voci.reduce((s, v) => s + v.gravita, 0) };
  }).sort((a, b) => b.peso - a.peso);
  return titolo + `
    <p class="nota">Le cose strane delle ultime 2 settimane. Una segnalazione da sola non vuol dire che qualcuno bari: conta se se ne accumulano tante sullo stesso giocatore. I rimedi qui sotto rimettono a posto i punti da soli.</p>
    <div class="azioni"><button class="btn piccolo" data-admin="ctl-aggiorna">Aggiorna</button></div>
    ${giocatori.length ? `<div class="controlli">${giocatori.map(g => {
      const tipi = new Set(g.voci.map(v => v.x.tipo));
      return `<div class="controllo ${g.peso >= 5 ? "grave" : g.peso >= 2 ? "medio" : ""}">
        <div class="controllo-testa"><b>${esc(String(g.nome))}</b><span class="controllo-livello">${g.peso >= 5 ? "Da guardare" : g.peso >= 2 ? "Qualcosa di strano" : "Probabilmente niente"}</span></div>
        <ul>${g.voci.slice(0, 8).map(v => `<li class="g${v.gravita}"><small>${v.quando}</small> ${v.testo}</li>`).join("")}</ul>
        ${g.voci.length > 8 ? `<p class="nota">…e altre ${g.voci.length - 8}.</p>` : ""}
        <div class="azioni">
          ${tipi.has("sfide-veloci") || tipi.has("sempre-vinte") ? `<button class="btn piccolo" data-admin="ctl-sfide:${g.id}">Annulla le sue sfide tra amici (14 giorni)</button>` : ""}
          ${tipi.has("boss-alto") ? `<button class="btn piccolo" data-admin="ctl-boss:${g.id}">Azzera i suoi danni al boss di questa settimana</button>` : ""}
        </div></div>`; }).join("")}</div>` : `<p class="nota">Nessuna segnalazione: tutto tranquillo.</p>`}
    <p class="nota piccola">Monete o vittorie sbagliate le puoi correggere a mano su Supabase: Table Editor → salvataggi → riga del giocatore → colonna «dati».</p>`;
}
async function azioneControlli(cosa, el) {
  const [az, id] = cosa.split(":");
  if (az === "ctl-aggiorna") { segnalazioni = null; const box = $("#admin-controlli"); if (box) box.innerHTML = htmlAdminControlli(); return; }
  if (el.dataset.conferma !== "1") { el.dataset.conferma = "1"; el.textContent = "Sicuro? Tocca di nuovo"; return; }
  try {
    if (az === "ctl-sfide") { const n = await rpcSociale("annulla_sfide_di", { u: id, giorni: 14 }); mostraAvviso(`${n} sfide annullate: i punti in classifica tornano a posto.`); }
    if (az === "ctl-boss") { await rpcSociale("azzera_boss_di", { u: id }); mostraAvviso("Danni al boss azzerati."); Boss.carica(true); }
  } catch (e) { mostraAvviso(e.message); }
  caricaControlli();
}

// ---------- Codici promozionali (solo admin) ----------
let codiciAdmin = null, usiCodici = {}, codiceModifica = null, paginaCodice = null;
const EFFETTI_CODICE = { "": "Nessuno", coriandoli: "Coriandoli", monete: "Pioggia di monete", stelle: "Stelle", girasoli: "Girasoli" };
async function caricaCodiciAdmin() {
  const sb = window.NoiversoAccesso.sb;
  try {
    const [{ data: cod, error: e1 }, { data: usi }] = await Promise.all([sb.from("codici").select("*").order("creato"), sb.from("codici_usati").select("codice")]);
    if (e1) throw e1;
    codiciAdmin = cod || []; usiCodici = {};
    for (const u of usi || []) usiCodici[u.codice] = (usiCodici[u.codice] || 0) + 1;
  } catch (e) { codiciAdmin = { errore: true }; }
  const box = $("#admin-codici"); if (box) box.innerHTML = htmlAdminCodici();
}
function riassuntoPremio(p) {
  const v = [];
  if (p.monete) v.push(`${p.monete} monete`);
  for (const [t, n] of Object.entries(p.bustine || {})) v.push(`${n} × ${TIPI_BUSTINA[t] ? TIPI_BUSTINA[t].nome : t}`);
  if (p.bombolette) v.push(`${p.bombolette} graffiti a sorpresa`);
  for (const [id, n] of Object.entries(p.oggetti || {})) v.push(`${n} × ${Zaino.info(id).nome || id}`);
  if (p.pagina) v.push("pagina segreta");
  if (p.messaggio) v.push("messaggio");
  if (p.effetto) v.push(EFFETTI_CODICE[p.effetto] || p.effetto);
  return v.join(" · ") || "—";
}
function htmlAdminCodici() {
  const titolo = `<h3>Codici promozionali</h3>`;
  if (!window.NOIVERSO_SUPABASE) return titolo + `<p class="nota">Si gestiscono nella versione pubblicata su Supabase.</p>`;
  if (!codiciAdmin) { setTimeout(caricaCodiciAdmin, 0); return titolo + `<p class="nota">Carico i codici…</p>`; }
  if (codiciAdmin.errore) return titolo + `<p class="errore">Non riesco a leggere i codici. Hai eseguito di nuovo schema.sql su Supabase?</p>`;
  const k = codiceModifica || { premio: {}, attivo: true }, p = k.premio || {};
  const [bt, bn] = Object.entries(p.bustine || {})[0] || ["", 1];
  const pag = paginaCodice !== null ? paginaCodice : (p.pagina || "");
  return titolo + `
    <p class="nota">Li vedi solo tu: nel codice del gioco non c'è nessun segreto. Ogni giocatore riceve i premi di un codice una volta sola; un codice <b>ripetibile</b> si può riaprire per rivedere la sorpresa. Se lo provi da admin non viene segnato come usato.</p>
    <div class="tab-scorri"><table class="tab-codici">
      <thead><tr><th>Codice</th><th>Cosa dà</th><th>Usato da</th><th></th></tr></thead>
      <tbody>${codiciAdmin.length ? codiciAdmin.map(c => `<tr class="${c.attivo ? "" : "spento"}">
        <td><b>${esc(c.codice)}</b>${c.attivo ? "" : ` <small class="nota">(spento)</small>`}${c.premio && c.premio.ripetibile ? ` <small class="nota">ripetibile</small>` : ""}</td>
        <td>${esc(riassuntoPremio(c.premio || {}))}</td>
        <td>${usiCodici[c.codice] || 0}${c.usi_max ? ` / ${c.usi_max}` : ""}</td>
        <td class="azioni-riga"><button class="btn piccolo" data-admin="cod-modifica:${esc(c.codice)}">Modifica</button><button class="btn piccolo" data-admin="cod-elimina:${esc(c.codice)}">Elimina</button></td></tr>`).join("")
        : `<tr><td colspan="4" class="nota">Nessun codice. Creane uno qui sotto.</td></tr>`}</tbody>
    </table></div>
    <form id="form-codice" class="form-codice" autocomplete="off">
      <h4>${codiceModifica ? `Modifica ${esc(k.codice)}` : "Nuovo codice"}</h4>
      <label>Codice <input name="codice" required maxlength="40" value="${esc(k.codice || "")}" placeholder="ES. NATALE2026" autocapitalize="characters"></label>
      <div class="campi-2">
        <label>Monete <input name="monete" type="number" min="0" max="50000" value="${p.monete || ""}" placeholder="0"></label>
        <label>Bustine <span class="campi-2"><select name="bustina"><option value="">nessuna</option>${ORDINE_BUSTINE.filter(t => t !== "benvenuto").map(t => `<option value="${t}" ${t === bt ? "selected" : ""}>${esc(TIPI_BUSTINA[t].nome)}</option>`).join("")}</select><input name="quante" type="number" min="1" max="50" value="${bn}"></span></label>
      </div>
      <div class="campi-2">
        <label>Graffiti a sorpresa <input name="bombolette" type="number" min="0" max="20" value="${p.bombolette || ""}" placeholder="0"></label>
        <label>Oggetto dello zaino <span class="campi-2"><select name="oggetto"><option value="">nessuno</option>${Zaino.elenco().map(([id, o]) => `<option value="${id}" ${p.oggetti && p.oggetti[id] ? "selected" : ""}>${o.icona} ${esc(o.nome)}</option>`).join("")}</select><input name="quanti-ogg" type="number" min="1" max="20" value="${p.oggetti ? Object.values(p.oggetti)[0] || 1 : 1}"></span></label>
      </div>
      <label>Titolo della sorpresa <input name="titolo" maxlength="40" value="${esc(p.titolo || "")}" placeholder="Compare nel messaggio e tra le sorprese trovate"></label>
      <label>Messaggio <textarea name="messaggio" rows="3" maxlength="2000" placeholder="Facoltativo">${esc(p.messaggio || "")}</textarea></label>
      <div class="campi-2">
        <label>Effetto <select name="effetto">${Object.entries(EFFETTI_CODICE).map(([v, n]) => `<option value="${v}" ${v === (p.effetto || "") ? "selected" : ""}>${n}</option>`).join("")}</select></label>
        <label>Quante persone possono usarlo <input name="usi" type="number" min="1" value="${k.usi_max || ""}" placeholder="senza limite"></label>
      </div>
      <div class="pagina-codice">
        <span class="nota">Pagina segreta (un file .html che si apre a schermo intero): <b>${pag ? `caricata · ${Math.round(pag.length / 1024)} KB` : "nessuna"}</b></span>
        <label class="btn piccolo">Scegli file…<input type="file" id="codice-pagina" accept=".html,text/html" hidden></label>
        ${pag ? `<button type="button" class="btn piccolo" data-admin="cod-togli-pagina">Togli</button>` : ""}
      </div>
      <label class="spunta"><input type="checkbox" name="ripetibile" ${p.ripetibile ? "checked" : ""}> Ripetibile (si può riaprire la sorpresa)</label>
      <label class="spunta"><input type="checkbox" name="attivo" ${k.attivo !== false ? "checked" : ""}> Attivo</label>
      <div class="azioni"><button class="btn primario" type="submit">Salva codice</button>${codiceModifica ? `<button type="button" class="btn" data-admin="cod-nuovo">Annulla</button>` : ""}</div>
      <p id="codice-admin-esito" class="nota"></p>
    </form>`;
}
function ridisegnaCodici() { const box = $("#admin-codici"); if (box) box.innerHTML = htmlAdminCodici(); }
async function azioneCodici(cosa, el) {
  const [az, ...resto] = cosa.split(":"), cod = resto.join(":");
  if (az === "cod-modifica") { codiceModifica = codiciAdmin.find(c => c.codice === cod) || null; paginaCodice = null; ridisegnaCodici(); $("#form-codice").scrollIntoView({ block: "start", behavior: "smooth" }); }
  if (az === "cod-nuovo") { codiceModifica = null; paginaCodice = null; ridisegnaCodici(); }
  if (az === "cod-togli-pagina") { paginaCodice = ""; ridisegnaCodici(); }
  if (az === "cod-elimina") {
    if (el.dataset.conferma !== "1") { el.dataset.conferma = "1"; el.textContent = "Sicuro?"; return; }
    const { error } = await window.NoiversoAccesso.sb.from("codici").delete().eq("codice", cod);
    if (error) mostraAvviso("Non sono riuscito a eliminarlo."); else { if (codiceModifica && codiceModifica.codice === cod) codiceModifica = null; mostraAvviso(`Codice ${cod} eliminato.`); }
    caricaCodiciAdmin();
  }
}
async function salvaTitoloClassifica(form) {
  const t = String(new FormData(form).get("titolo") || "").trim().slice(0, 60);
  try { await rpcSociale("titolo_classifica", { titolo: t }); if (albo) albo.titolo = t; mostraAvviso(t ? `Titolo salvato: «${t}».` : "Titolo tolto: si vede «Classifica del gruppo»."); }
  catch (e) { mostraAvviso(e.message); }
}
async function salvaCodiceAdmin(form) {
  const f = new FormData(form), esito = $("#codice-admin-esito");
  const codice = String(f.get("codice") || "").toUpperCase().replace(/\s+/g, "");
  if (!codice) return;
  const premio = {};
  const monete = Math.min(50000, Math.max(0, parseInt(f.get("monete")) || 0)); if (monete) premio.monete = monete;
  if (f.get("bustina")) premio.bustine = { [f.get("bustina")]: Math.min(50, Math.max(1, parseInt(f.get("quante")) || 1)) };
  const bomb = Math.min(20, Math.max(0, parseInt(f.get("bombolette")) || 0)); if (bomb) premio.bombolette = bomb;
  if (f.get("oggetto")) premio.oggetti = { [f.get("oggetto")]: Math.min(20, Math.max(1, parseInt(f.get("quanti-ogg")) || 1)) };
  for (const k of ["titolo", "messaggio", "effetto"]) { const v = String(f.get(k) || "").trim(); if (v) premio[k] = v; }
  const pag = paginaCodice !== null ? paginaCodice : (codiceModifica && codiceModifica.premio && codiceModifica.premio.pagina) || "";
  if (pag) premio.pagina = pag;
  if (f.get("ripetibile")) premio.ripetibile = true;
  if ((premio.pagina || premio.messaggio) && !premio.titolo) premio.titolo = "Sorpresa";
  const riga = { codice, premio, attivo: !!f.get("attivo"), usi_max: parseInt(f.get("usi")) || null };
  esito.textContent = "Salvo…";
  const sb = window.NoiversoAccesso.sb;
  const { error } = await sb.from("codici").upsert(riga);
  if (error) { esito.innerHTML = `<b class="errore">Non salvato: ${esc(error.message)}</b>`; return; }
  if (codiceModifica && codiceModifica.codice !== codice) await sb.from("codici").delete().eq("codice", codiceModifica.codice);
  codiceModifica = null; paginaCodice = null;
  mostraAvviso(`Codice ${codice} salvato.`);
  caricaCodiciAdmin();
}
document.addEventListener("change", async e => {
  if (e.target.id !== "codice-pagina" || !e.target.files.length) return;
  const f = e.target.files[0];
  if (f.size > 900 * 1024) { mostraAvviso("La pagina è troppo grande (massimo 900 KB)."); return; }
  paginaCodice = await f.text();
  const form = $("#form-codice"), vals = form ? Object.fromEntries(new FormData(form)) : null;
  ridisegnaCodici();
  // rimette quello che avevi già scritto nel modulo
  if (vals) { const nf = $("#form-codice"); for (const [k, v] of Object.entries(vals)) { const c = nf.elements[k]; if (!c || c.type === "file") continue; if (c.type === "checkbox") c.checked = true; else c.value = v; } for (const c of nf.querySelectorAll("input[type=checkbox]")) c.checked = c.name in vals; }
});

// ---------- Editor carte: persona, serie e rarità (solo admin) ----------
let bozza = null, edFiltro = "tutte", edCerca = "";
function nuovaBozza() { return Object.fromEntries(CARTE.map(c => [c.id, { serie: c.serie, rarita: c.rarita, stile: c.stile, persona: c.persona, ultra: !!c.ultra }])); }
function regolaBozza() {
  const gruppi = {};
  for (const c of CARTE) { const b = bozza[c.id]; const p = b.persona.trim(); if (p) (gruppi[p] = gruppi[p] || []).push(c); }
  const problemi = Object.keys(gruppi).filter(p => Object.keys(SERIE).some(se => gruppi[p].filter(c => bozza[c.id].serie === se && bozza[c.id].rarita === "leggendaria").length > 1));
  return { gruppi, problemi, senza: CARTE.filter(c => !bozza[c.id].persona.trim()) };
}
function modificheBozza() { return CARTE.filter(c => { const b = bozza[c.id]; return b.serie !== c.serie || b.rarita !== c.rarita || b.stile !== c.stile || !!b.ultra !== !!c.ultra || b.persona.trim() !== c.persona; }).length; }
function htmlRegola() {
  const r = regolaBozza(), n = modificheBozza();
  const contaSerie = Object.keys(SERIE).map(id => `${SERIE[id].simbolo} ${esc(SERIE[id].nome)} ${CARTE.filter(c => bozza[c.id].serie === id).length} (${CARTE.filter(c => bozza[c.id].serie === id && bozza[c.id].rarita === "leggendaria").length} L)`).join(" · ");
  return `
    <p class="nota">${r.problemi.length ? `<b class="errore">Da sistemare: ${r.problemi.map(esc).join(", ")} ${r.problemi.length === 1 ? "ha" : "hanno"} due leggendarie nella stessa serie.</b>` : "Regola rispettata: nessuna persona ha due leggendarie nella stessa serie."}
      ${r.senza.length ? ` ${r.senza.length} ${r.senza.length === 1 ? "carta non ha" : "carte non hanno"} ancora una persona.` : ""}</p>
    <p class="nota piccola">Carte per serie: ${contaSerie}</p>
    <div class="persone">${Object.entries(r.gruppi).sort((a, b) => a[0].localeCompare(b[0])).map(([p, cs]) => `<div class="persona ${r.problemi.includes(p) ? "errata" : ""}"><b>${esc(p)}</b>${cs.map(c => `<span class="pill-carta r-${bozza[c.id].rarita}">${SERIE[bozza[c.id].serie].simbolo} ${esc(c.nome)}</span>`).join("")}</div>`).join("")}</div>
    <div class="azioni ed-azioni">
      <button class="btn primario" data-fx="coriandoli" data-admin="ed-salva" ${n ? "" : "disabled"}>${n ? `Salva ${n} ${n === 1 ? "modifica" : "modifiche"} per tutti` : "Nessuna modifica"}</button>
      <button class="btn" data-fx="salto" data-admin="ed-annulla" ${n ? "" : "disabled"}>Annulla modifiche</button>
      <button class="btn" data-fx="scuoti" data-admin="ed-originali">Torna ai valori di partenza</button>
    </div>`;
}
function htmlEditorCarte() {
  if (!bozza) bozza = nuovaBozza();
  const persone = [...new Set(Object.values(bozza).map(b => b.persona.trim()).filter(Boolean))].sort();
  const r = regolaBozza();
  const q = edCerca.trim().toLowerCase();
  const elenco = CARTE.filter(c => (edFiltro === "tutte" || (edFiltro === "senza" ? !bozza[c.id].persona.trim() : bozza[c.id].serie === edFiltro)) && (!q || c.nome.toLowerCase().includes(q) || bozza[c.id].persona.toLowerCase().includes(q)));
  return `
    <h3>Persone, serie, rarità, tipo e versione Ultra</h3>
    <p class="nota">Scegli per ogni carta chi è la persona, in che serie va e la rarità. Quando salvi, vale per tutti i giocatori. Regola: al massimo una leggendaria a persona in ogni serie (una persona può averne in più serie).</p>
    ${Archivio.modo !== "cloud" ? `<p class="nota"><b class="errore">Serve la pagina online: senza account le modifiche non si possono salvare per tutti.</b></p>` : ""}
    <div id="ed-regola">${htmlRegola()}</div>
    <div class="ed-filtri">
      <div class="filtri">${["tutte", ...Object.keys(SERIE), "senza"].map(f => `<button class="chip" data-fx="gelatina" data-ed-filtro="${f}" aria-pressed="${edFiltro === f}">${f === "tutte" ? "Tutte" : f === "senza" ? "Senza persona" : SERIE[f].simbolo + " " + esc(SERIE[f].nome)}</button>`).join("")}</div>
      <input id="ed-cerca" type="search" placeholder="Cerca carta o persona" value="${esc(edCerca)}" aria-label="Cerca carta o persona">
    </div>
    <datalist id="ed-persone">${persone.map(p => `<option value="${esc(p)}"></option>`).join("")}</datalist>
    <div class="ed-righe">
      ${elenco.map(c => { const b = bozza[c.id], errata = r.problemi.includes(b.persona.trim()) && b.rarita === "leggendaria";
        const cambiata = b.serie !== c.serie || b.rarita !== c.rarita || b.stile !== c.stile || !!b.ultra !== !!c.ultra || b.persona.trim() !== c.persona;
        return `<div class="ed-riga ${errata ? "errata" : ""} ${cambiata ? "cambiata" : ""}" data-ed-riga="${c.id}">
          <img src="${imgCarta(c.id)}" alt="">
          <b>${esc(c.nome)}</b>
          <label><span>Persona</span><input list="ed-persone" maxlength="30" data-ed="${c.id}" data-campo="persona" value="${esc(b.persona)}" placeholder="Chi è?"></label>
          <label><span>Serie</span><select data-ed="${c.id}" data-campo="serie">${Object.keys(SERIE).map(id => `<option value="${id}" ${b.serie === id ? "selected" : ""}>${esc(SERIE[id].nome)}</option>`).join("")}</select></label>
          <label><span>Rarità</span><select data-ed="${c.id}" data-campo="rarita" class="sel-r-${b.rarita}">${ORDINE_RARITA.map(id => `<option value="${id}" ${b.rarita === id ? "selected" : ""}>${RARITA[id].nome}</option>`).join("")}</select></label>
          <label><span>Tipo</span><select data-ed="${c.id}" data-campo="stile">${Object.keys(STILI).map(id => `<option value="${id}" ${b.stile === id ? "selected" : ""}>${STILI[id].icona} ${esc(STILI[id].nome)}</option>`).join("")}</select></label>
          <label class="ed-ultra" title="Ha anche una versione Ultra da trovare"><input type="checkbox" data-ed="${c.id}" data-campo="ultra" ${b.ultra ? "checked" : ""}><span>Ultra</span></label>
        </div>`; }).join("") || `<p class="nota">Nessuna carta corrisponde.</p>`}
    </div>`;
}
function aggiornaEditor(completo) {
  const box = $("#editor-carte");
  if (!box) return;
  if (completo) { box.innerHTML = htmlEditorCarte(); return; }
  $("#ed-regola").innerHTML = htmlRegola();
  const r = regolaBozza();
  $$("[data-ed-riga]", box).forEach(el => {
    const c = PER_ID[el.dataset.edRiga], b = bozza[c.id];
    el.classList.toggle("errata", r.problemi.includes(b.persona.trim()) && b.rarita === "leggendaria");
    el.classList.toggle("cambiata", b.serie !== c.serie || b.rarita !== c.rarita || b.stile !== c.stile || !!b.ultra !== !!c.ultra || b.persona.trim() !== c.persona);
    const sr = el.querySelector('[data-campo="rarita"]'); sr.className = "sel-r-" + b.rarita;
  });
}
async function salvaEditor(el) {
  const r = regolaBozza();
  if (r.problemi.length) { mostraAvviso(`Prima sistema: ${r.problemi.join(", ")} ha due leggendarie nella stessa serie.`); FX.riavvia($("#ed-regola"), "fx-scuoti"); return; }
  const cfg = { carte: {}, aggiornato: new Date().toISOString() };
  for (const c of CARTE) {
    const o = CARTE_ORIGINALI[c.id], b = bozza[c.id], d = {};
    if (b.serie !== o.serie) d.serie = b.serie;
    if (b.rarita !== o.rarita) d.rarita = b.rarita;
    if (b.stile !== o.stile) d.stile = b.stile;
    if (!!b.ultra !== !!o.ultra) d.ultra = !!b.ultra;
    if (b.persona.trim() !== o.persona) d.persona = b.persona.trim();
    if (Object.keys(d).length) cfg.carte[c.id] = d;
  }
  try { await Archivio.salvaConfig(cfg); }
  catch (e) { mostraAvviso(e && e.code === "locale" ? "Serve la pagina online con il tuo account per salvare per tutti." : "Non sono riuscito a salvare. Riprova tra poco."); return; }
  applicaConfigCarte(cfg);
  Scena3D.svuotaCache();
  bozza = nuovaBozza();
  mostraAvviso("Salvato: da ora tutti vedono le carte così.");
  disegna();
}

async function azioneAdmin(cosa, el) {
  if (!S.admin) return;
  if (cosa === "ed-salva") { salvaEditor(el); return; }
  if (cosa === "img-trasferisci") { trasferisciImmagini(); return; }
  if (cosa.startsWith("stat-")) { StatCarte.azione(cosa.slice(5), el); return; }
  if (cosa.startsWith("cod-")) { azioneCodici(cosa, el); return; }
  if (cosa.startsWith("ctl-")) { azioneControlli(cosa, el); return; }
  if (cosa.startsWith("reaz-")) { Reazioni.azioneAdmin(cosa, el); return; }
  if (cosa.startsWith("torneo-")) { Torneo.admin(cosa, el); return; }
  if (cosa === "sinergie-base") {
    if (el.dataset.conferma !== "1") { el.dataset.conferma = "1"; el.textContent = "Sicuro? Tocca di nuovo"; return; }
    Sinergie.salvaAdmin(null, true); return;
  }
  if (cosa === "zaino-base") {
    if (el.dataset.conferma !== "1") { el.dataset.conferma = "1"; el.textContent = "Sicuro? Tocca di nuovo"; return; }
    Zaino.salvaAdmin(null, true); return;
  }
  if (cosa === "azzera-classifica") {
    apriModale(`<div class="conferma"><h2>Azzerare la classifica?</h2><p>Tutti ripartono da 0 punti e 0 partite giocate. Il podio di adesso viene salvato nell'albo d'oro. Non si può tornare indietro.</p>
      <div class="azioni centro"><button class="btn" data-azione="chiudi">No</button><button class="btn primario" data-admin="azzera-classifica-si">Sì, azzera</button></div></div>`);
    return;
  }
  if (cosa === "azzera-classifica-si") {
    el.disabled = true;
    try { await rpcSociale("azzera_classifica"); chiudiModale(); albo = null; caricaAlbo(); mostraAvviso("Classifica azzerata: si riparte da 0."); }
    catch (e) { mostraAvviso(e.message); el.disabled = false; }
    return;
  }
  if (cosa.startsWith("graffit")) { Graffiti.azioneAdmin(cosa, el); return; }
  if (cosa === "ed-annulla") { bozza = nuovaBozza(); aggiornaEditor(true); return; }
  if (cosa === "ed-originali") { bozza = Object.fromEntries(CARTE.map(c => [c.id, { ...CARTE_ORIGINALI[c.id] }])); aggiornaEditor(true); mostraAvviso("Valori di partenza caricati: premi Salva per applicarli a tutti."); return; }
  const metti = (L, lx = 0) => CARTE.forEach(c => { S.carte[c.id] = Math.max(1, S.carte[c.id] || 0); S.liv[c.id] = L; S.lodeXp[c.id] = lx; });
  if (cosa === "carte-lode") metti(LIVELLO_MAX, XP_LODE);
  if (cosa === "carte-max") metti(LIVELLO_MAX);
  if (cosa === "carte-15") metti(15);
  if (cosa === "carte-1") { metti(1); CARTE.forEach(c => { S.carte[c.id] = 1; S.pot[c.id] = 0; }); }
  if (cosa === "pot-100") CARTE.forEach(c => { if (S.carte[c.id]) S.pot[c.id] = (S.pot[c.id] || 0) + 100; });
  if (cosa === "olo-5") { const ok = possedute().filter(c => !haOlo(c.id)).sort(() => Math.random() - .5).slice(0, 5); S.olo = Object.assign({}, S.olo); ok.forEach(c => { S.olo[c.id] = true; }); }
  if (cosa === "tutte-speciali") { CARTE.forEach(c => { if (!S.carte[c.id]) { S.carte[c.id] = 1; S.liv[c.id] = S.liv[c.id] || 1; } }); S.olo = Object.fromEntries(CARTE.map(c => [c.id, true])); S.ultra = Object.fromEntries(CARTE.filter(c => c.ultra).map(c => [c.id, true])); }
  if (cosa === "togli-speciali") { S.olo = {}; S.ultra = {}; }
  if (cosa === "carte-zero") { S.carte = {}; S.liv = {}; S.pot = {}; S.lodeXp = {}; S.squadre.forEach(s => { s.carte = []; }); }
  if (cosa === "bustine") { for (const t of ["normale", "epica", "leggendaria", "ultra"]) S.inventario[t] = (S.inventario[t] || 0) + 10; FX.volaIcona(el, $('[data-vista="bustine"]'), "b-normale"); }
  if (cosa === "pass") { S.pass.xp = +$("#admin-pass").value * PASS.xpLivello; }
  if (cosa === "pass-reset") { S.pass.riscossi = []; S.pass.scelte = {}; S.pass.bonus = 0; S.pass.potInSospeso = 0; }
  if (cosa === "pass-bonus") S.pass.xp = Math.max(S.pass.xp, PASS.livelli * PASS.xpLivello) + PASS.xpBonus * 3;
  if (cosa === "prova") { const id = $("#prova-carta").value, i = +$("#prova-mossa").value; schermoIntero(true); avviaProva(id, i); return; }
  if (cosa === "reset-normale") {
    apriModale(`<div class="conferma"><h2>Azzerare il tuo profilo normale?</h2><p>Perdi carte, monete e pass del profilo da giocatore. Il profilo admin resta com'è.</p>
      <div class="azioni centro"><button class="btn primario" data-fx="scuoti" data-admin="reset-conferma">Azzera</button><button class="btn" data-azione="chiudi">Annulla</button></div></div>`);
    return;
  }
  if (cosa === "reset-conferma") {
    chiudiModale();
    const admin = S;
    await Archivio.usaSlot("partita");
    const vecchio = migra(await Archivio.carica());
    const nuovo = statoNuovo();
    if (vecchio && vecchio.profilo) nuovo.profilo = vecchio.profilo;
    nuovo.rev = ((vecchio && vecchio.rev) || 0) + 1;
    await Archivio.salva(nuovo);
    await Archivio.usaSlot("admin");
    S = admin;
    ascoltaAltriDispositivi();
    mostraAvviso("Profilo normale azzerato.");
    return;
  }
  salva(); disegna();
}

async function avviaProva(id, i) {
  const altri = CARTE.filter(c => c.id !== id).map(c => c.id).slice(0, 4);
  await avviaSfida("recluta", [id, ...altri]);
  if (!B) return;
  B.lati[0].energia = ENERGIA_MAX;
  aggiornaBattaglia();
  await attesa(500);
  turnoGiocatore({ tipo: "mossa", i });
}

// ============================================================
//  MODALITÀ STORIA (schermata)
// ============================================================
const chiaveTappa = (k, i) => `${STORIA[k].id}-${i + 1}`;
const stelleTappa = (k, i) => (S.storia.stelle || {})[chiaveTappa(k, i)] || 0;
// sbloccato se hai battuto il boss del capitolo prima (o se ci avevi già giocato: i capitoli nuovi non bloccano chi era già avanti)
const capitoloSbloccato = k => k === 0 || stelleTappa(k - 1, STORIA[k - 1].tappe.length - 1) > 0 || STORIA[k].tappe.some((_, i) => stelleTappa(k, i) > 0);
const tappaSbloccata = (k, i) => capitoloSbloccato(k) && (i === 0 || stelleTappa(k, i - 1) > 0);
const stelleCapitolo = k => STORIA[k].tappe.reduce((a, _, i) => a + stelleTappa(k, i), 0);
const stelleTotali = () => STORIA.reduce((a, _, k) => a + stelleCapitolo(k), 0);
function prossimaTappa() {
  for (let k = 0; k < STORIA.length; k++) for (let i = 0; i < STORIA[k].tappe.length; i++) if (tappaSbloccata(k, i) && !stelleTappa(k, i)) return { k, i };
  return null;
}
const scrigniPronti = () => STORIA.reduce((a, _, k) => a + scrigniCapitolo(k).filter(s => stelleCapitolo(k) >= s.stelle && !S.storia.scrigni.includes(s.id)).length, 0);
let capStoria = null;
const htmlStelle = (n, max = 3) => Array.from({ length: max }, (_, j) => `<i class="${j < n ? "piena" : ""}">★</i>`).join("");

function vistaStoria() {
  if (capStoria === null) { const p = prossimaTappa(); capStoria = p ? p.k : STORIA.length - 1; }
  const k = capStoria, cap = STORIA[k], aperto = capitoloSbloccato(k);
  let fatte = 0; while (fatte < cap.tappe.length && stelleTappa(k, fatte)) fatte++;
  return `
  <section class="storia" style="--c:${cap.colore}">
    <div class="titolo-riga"><h2>Storia</h2><p class="nota">Stelle raccolte: <b>${stelleTotali()}</b>/${STORIA.length * 18}</p></div>
    <div class="capitoli">${STORIA.map((c, j) => `<button class="cap-btn ${j === k ? "scelto" : ""} ${capitoloSbloccato(j) ? "" : "chiuso"}" data-fx="gelatina" data-capitolo="${j}" style="--c:${c.colore}" aria-pressed="${j === k}">
      <span class="cap-sim">${capitoloSbloccato(j) ? c.simbolo : "✕"}</span><span><small>Capitolo ${j + 1}</small><b>${esc(c.titolo)}</b></span><em>${stelleCapitolo(j)}/18 ★</em></button>`).join("")}</div>
    <div class="cap-testa">
      <span class="serie-stemma" aria-hidden="true">${cap.simbolo}</span>
      <div><p class="serie-nome">Capitolo ${k + 1}${cap.serie ? ` · ${esc(SERIE[cap.serie].nome)}` : cap.sottotitolo ? ` · ${esc(cap.sottotitolo)}` : " · Finale"}</p><h3>${esc(cap.titolo)}</h3><p class="nota">${esc(cap.intro)}</p></div>
    </div>
    ${aperto ? "" : `<p class="consiglio forte"><b>Capitolo bloccato.</b> Batti il boss del capitolo ${k} per aprirlo.</p>`}
    <div class="mondo-cornice">
      <div class="mondo ${aperto ? "" : "chiuso"}" id="mondo" tabindex="0" aria-label="Mappa del capitolo: trascinala per esplorarla">
        <div class="mondo-tela" style="width:${MappeStoria.W}px;height:${MappeStoria.H}px">
          ${MappeStoria.svg(k)}
          <svg class="mondo-strada" viewBox="0 0 ${MappeStoria.W} ${MappeStoria.H}" width="${MappeStoria.W}" height="${MappeStoria.H}" aria-hidden="true">
            ${fatte > 0 ? `<path d="${MappeStoria.curva(MappeStoria.NODI[k], fatte)}" class="strada-fatta"/>` : ""}
          </svg>
          ${cap.tappe.map((t, i) => htmlNodoMappa(k, i, false)).join("")}
          <canvas class="mondo-nebbia" id="mondo-nebbia" width="900" height="600" aria-hidden="true"></canvas>
          ${cap.tappe.map((t, i) => htmlNodoMappa(k, i, true)).join("")}
        </div>
      </div>
      <div class="mondo-hud">
        <span class="esplorato">Esplorato <b>${Math.round(scoperte(k).length / cap.tappe.length * 100)}%</b></span>
        <span class="nota piccola">Trascina la mappa per esplorarla</span>
        <button class="btn piccolo" data-fx="salto" data-azione="centra-mappa">Vai alla tappa</button>
      </div>
    </div>
    <div class="scrigni">
      ${scrigniCapitolo(k).map(sc => {
        const preso = S.storia.scrigni.includes(sc.id), pronto = !preso && stelleCapitolo(k) >= sc.stelle;
        return `<button class="scrigno ${preso ? "preso" : pronto ? "pronto" : ""}" data-fx="coriandoli" ${pronto ? `data-scrigno="${k}:${sc.id}"` : "disabled"}>
          <span class="scrigno-ico" aria-hidden="true"></span>
          <span><b>Scrigno da ${sc.stelle} ★</b><small>${esc(sc.testo)} · ${preso ? "aperto" : pronto ? "da aprire!" : `${stelleCapitolo(k)}/${sc.stelle} stelle`}</small></span>
        </button>`;
      }).join("")}
    </div>
  </section>`;
}

// Tappe scoperte sulla mappa: quelle già giocate e quella da giocare
const scoperte = k => STORIA[k].tappe.map((_, i) => i).filter(i => tappaSbloccata(k, i));
function htmlNodoMappa(k, i, sopraNebbia) {
  const t = STORIA[k].tappe[i], st = stelleTappa(k, i), libera = tappaSbloccata(k, i);
  if (libera !== sopraNebbia) return "";
  const [x, y] = MappeStoria.NODI[k][i], stato = st ? "fatta" : libera ? "pronta" : "chiusa";
  return `<button class="tappa ${stato} ${t.boss ? "boss" : ""}" style="left:${x}px;top:${y}px;--i:${i}" data-fx="salto" ${libera ? `data-tappa="${k}:${i}"` : "disabled"} aria-label="Tappa ${i + 1}: ${libera ? esc(t.titolo) : "da scoprire"}${st ? `, ${st} stelle` : ""}">
    <span class="tappa-foto"><img src="${imgCarta(t.parla)}" alt=""></span>
    <span class="tappa-num">${t.boss ? "BOSS" : i + 1}</span>
    <span class="tappa-info"><b>${libera ? esc(t.titolo) : "???"}</b><span class="stelle">${htmlStelle(st)}</span></span>
  </button>`;
}

// Disegna la nebbia: si dirada attorno alle tappe scoperte (con animazione per quelle appena scoperte)
let animNebbia = null;
function dopoStoria() {
  const mondo = $("#mondo"), tela = $("#mondo-nebbia");
  if (!mondo || !tela) return;
  const k = capStoria, cap = STORIA[k], nodi = MappeStoria.NODI[k];
  S.storia.visti = S.storia.visti || [];
  const tutte = cap.tappe.every((_, i) => stelleTappa(k, i) > 0);
  const zone = scoperte(k).map(i => ({ x: nodi[i][0], y: nodi[i][1], fine: stelleTappa(k, i) ? 360 : 270, nuova: !S.storia.visti.includes(chiaveTappa(k, i)) }));
  // ogni tappa giocata scopre anche la strada verso la successiva
  scoperte(k).forEach(i => { if (stelleTappa(k, i) && nodi[i + 1]) zone.push({ x: (nodi[i][0] + nodi[i + 1][0]) / 2, y: (nodi[i][1] + nodi[i + 1][1]) / 2, fine: 230, nuova: false }); });
  cancelAnimationFrame(animNebbia);
  const t0 = performance.now(), dur = ridotto ? 0 : 1600;
  const disegnaNebbia = ora => {
    const t = dur ? Math.min(1, (ora - t0) / dur) : 1, e = 1 - Math.pow(1 - t, 3);
    MappeStoria.nebbia(tela, k, zone.map(z => ({ x: z.x, y: z.y, r: z.nuova ? z.fine * e : z.fine })).concat(tutte ? [{ x: MappeStoria.W / 2, y: MappeStoria.H / 2, r: 2400 * e }] : []));
    if (t < 1) animNebbia = requestAnimationFrame(disegnaNebbia);
  };
  animNebbia = requestAnimationFrame(disegnaNebbia);
  const nuove = zone.filter(z => z.nuova).length;
  scoperte(k).forEach(i => { const c = chiaveTappa(k, i); if (!S.storia.visti.includes(c)) S.storia.visti.push(c); });
  if (nuove) salva();
  // centra sulla tappa da giocare (o sull'ultima)
  centraMappa(nuove ? "smooth" : "auto");
  // trascinamento con il mouse (col dito scorre già da solo)
  let tr = null;
  mondo.onpointerdown = ev => { if (ev.pointerType !== "mouse") return; tr = { x: ev.clientX, y: ev.clientY, sl: mondo.scrollLeft, st: mondo.scrollTop, mosso: false }; mondo.classList.add("presa"); };
  mondo.onpointermove = ev => { if (!tr) return; const dx = ev.clientX - tr.x, dy = ev.clientY - tr.y; if (Math.abs(dx) + Math.abs(dy) > 6) tr.mosso = true; mondo.scrollLeft = tr.sl - dx; mondo.scrollTop = tr.st - dy; };
  const fine = () => { if (tr && tr.mosso) mondo.dataset.trascinato = "1"; tr = null; mondo.classList.remove("presa"); setTimeout(() => { delete mondo.dataset.trascinato; }, 0); };
  mondo.onpointerup = fine; mondo.onpointerleave = fine;
}
function centraMappa(modo = "smooth") {
  const mondo = $("#mondo");
  if (!mondo) return;
  const k = capStoria, lista = scoperte(k), i = lista.find(j => !stelleTappa(k, j)) ?? lista[lista.length - 1] ?? 0;
  const [x, y] = MappeStoria.NODI[k][i];
  mondo.scrollTo({ left: x - mondo.clientWidth / 2, top: y - mondo.clientHeight / 2, behavior: modo });
}

let scriviTimer = null;
function apriTappa(k, i) {
  const cap = STORIA[k], t = cap.tappe[i], chi = PER_ID[t.parla], st = stelleTappa(k, i);
  const n = carteBattaglia();
  const premio = st ? `Rigiocando: ${Math.round(t.monete * .25)} monete · 20 XP` :
    `Prima vittoria: ${t.monete} monete · ${Math.round(t.monete * .8)} XP${t.bustina ? ` · ${t.bustine > 1 ? t.bustine + " × " : ""}${TIPI_BUSTINA[t.bustina].nome}` : ""}`;
  apriModale(`
    <div class="tappa-modale" style="--c:${cap.colore}">
      <div class="scena">
        <img class="scena-foto" src="${imgCarta(chi.id)}" alt="">
        <div class="fumetto"><b>${esc(chi.nome)}</b><p id="fumetto-testo" data-testo="${esc(t.frase)}"></p></div>
      </div>
      <p class="serie-nome">Capitolo ${k + 1} · ${t.boss ? "Boss" : `Tappa ${i + 1}`}</p>
      <h2>${esc(t.titolo)}</h2>
      <p class="nota">Avversari al livello ${t.liv[0] === t.liv[1] ? t.liv[0] : `${t.liv[0]}–${t.liv[1]}`} · Difficoltà ${"◆".repeat(Math.max(1, Math.round(t.abilita * 5)))}${n === 3 ? " · Modalità rapida: primi 3 avversari" : ""}</p>
      <div class="tappa-nemici">${t.nemici.slice(0, n).map(id => htmlCarta(PER_ID[id], { piccola: true, liv: t.liv[1], lode: false })).join("")}</div>
      <p class="tappa-premio">${premio}</p>
      <p class="nota piccola">★ vinci · ★★ vinci con almeno ${Math.ceil(n * .6)} personaggi in piedi · ★★★ vinci senza KO${st ? ` · Il tuo record: ${htmlStelle(st)}` : ""}</p>
      <div class="tappa-scelta" id="tappa-scelta" data-luogo="${k}:${i}">${htmlSceltaTappa(k, i, -1)}</div>
    </div>`);
  const el = $("#fumetto-testo"), testo = el.dataset.testo;
  clearInterval(scriviTimer);
  if (ridotto) { el.textContent = testo; return; }
  let j = 0;
  scriviTimer = setInterval(() => { j += 2; el.textContent = testo.slice(0, j); if (j >= testo.length || !el.isConnected) clearInterval(scriviTimer); }, 28);
}

// In fondo alla tappa: prima scegli la squadra, poi compare "Combatti con …"
function htmlSceltaTappa(k, i, scelta) {
  const n = carteBattaglia(), pronte = (S.squadre || []).some(q => q.carte.length >= n);
  if (!pronte) return `<p class="consiglio forte">Ti serve una squadra da ${n} per combattere.</p><button class="btn primario" data-azione="vai-squadra">Prepara la squadra</button>`;
  const q = S.squadre[scelta];
  return `<p class="tappa-scegli-titolo">${q ? "Squadra scelta:" : "Scegli con quale squadra combattere:"}</p>
    ${htmlListaSquadre("data-tappa-squadra", scelta)}
    ${q ? `<button class="btn primario grande" data-fx="spinta" data-tappa-via="${k}:${i}">Combatti con ${esc(q.nome || `Squadra ${scelta + 1}`)}</button>` : ""}`;
}
function avviaStoria(k, i) {
  const cap = STORIA[k], t = cap.tappe[i];
  chiudiModale();
  // la squadra l'hai già scelta nella tappa: niente seconda finestra
  avviaSfida({ id: "storia", nome: t.titolo, abilita: t.abilita, liv: t.liv, premio: 0, punti: 0, xp: 0, storia: { k, i }, campo: STORIA[k].campo, graffitoNemico: t.boss ? Graffiti.aCaso(k + 1) : null }, null, t.nemici, true)
    .then(() => { if (B) aggiungiRegistro({ testo: `${PER_ID[t.parla].nome}: «${t.frase}»`, avviso: true }); });
}

function chiudiStoria() {
  const { k, i } = livelloAttuale.storia, t = STORIA[k].tappe[i], key = chiaveTappa(k, i);
  const prima = !S.storia.stelle[key];
  const esito = { vinto: B.vincitore === 0, stelle: 0, monete: 0, xp: 0, bustina: "", prima };
  livelloAttuale.espCarte = premiaCarte((1 + t.indice * .06) * (t.boss ? 1.3 : 1), esito.vinto);
  if (esito.vinto) {
    const n = B.lati[0].squadra.length, vivi = B.vivi(0).length;
    esito.stelle = vivi === n ? 3 : vivi >= Math.ceil(n * .6) ? 2 : 1;
    if (prima) {
      esito.monete = t.monete; esito.xp = Math.round(t.monete * .8);
      if (t.bustina) { S.inventario[t.bustina] += t.bustine || 1; esito.bustina = `${t.bustine > 1 ? t.bustine + " × " : ""}${TIPI_BUSTINA[t.bustina].nome}`; }
      S.stats.punti += t.boss ? 3 : 1;
    } else { esito.monete = Math.round(t.monete * .25); esito.xp = 20; }
    const nuove = Math.max(0, esito.stelle - (S.storia.stelle[key] || 0));
    S.storia.stelle[key] = Math.max(S.storia.stelle[key] || 0, esito.stelle);
    S.stats.vittorie++;
    Missioni.evento("vittoria", { squadra: B.lati[0].squadra.map(x => x.id) });
    Missioni.evento("storia", { tre: esito.stelle === 3, nuove });
    if (arena) arena.vittoria(0);
    setTimeout(() => { const el = $(".fine b"); if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 70, forma: "stella", colori: ["#f2c14e", "#fff3c4", STORIA[k].colore], velocita: 8, dimensione: 7, durata: 1600 }); } }, 50);
  } else { esito.xp = 10; S.stats.sconfitte++; }
  S.monete += esito.monete;
  const su = aggiungiXP(esito.xp);
  livelloAttuale.esito = esito;
  salva();
  Archivio.pubblicaClassifica();
  aggiornaTesta();
  aggiornaBattaglia();
  if (su) setTimeout(() => mostraAvviso(`Pass: livello ${su} raggiunto!`), 900);
}

function htmlFineStoria() {
  const { k, i } = livelloAttuale.storia, t = STORIA[k].tappe[i], e = livelloAttuale.esito || {};
  const prossima = i + 1 < STORIA[k].tappe.length ? { k, i: i + 1 } : k + 1 < STORIA.length ? { k: k + 1, i: 0 } : null;
  const avanti = e.vinto && prossima && tappaSbloccata(prossima.k, prossima.i);
  return `<div class="fine storia-fine ${e.vinto ? "vinto" : "perso"}" style="--c:${STORIA[k].colore}">
    <b>${e.vinto ? (t.boss ? "Boss sconfitto!" : "Tappa superata!") : "Sconfitta"}</b>
    ${e.vinto ? `<div class="stelle-grandi">${htmlStelle(e.stelle)}</div>` : ""}
    ${e.vinto && t.vittoria ? `<p class="storia-frase">${esc(t.vittoria)}</p>` : ""}
    ${htmlEspCarte()}
    <span>${e.vinto ? `${e.prima ? "Prima vittoria" : "Rigiocata"}: +${e.monete} monete · +${e.xp} XP${e.bustina ? ` · ${esc(e.bustina)}` : ""}` : `+${e.xp} XP · Riprova: puoi cambiare squadra dalla mappa.`}</span>
    <div class="azioni centro">
      ${avanti ? `<button class="btn primario" data-fx="onda" data-azione="storia-avanti">${prossima.k !== k ? "Capitolo successivo" : "Prossima tappa"}</button>` : ""}
      <button class="btn ${avanti ? "" : "primario"}" data-fx="onda" data-azione="rivincita">${e.vinto && e.stelle < 3 ? "Rigioca per le stelle" : "Riprova"}</button>
      <button class="btn" data-fx="salto" data-azione="esci-battaglia">Torna alla mappa</button>
    </div>
  </div>`;
}

async function riscuotiScrigno(k, id, el) {
  const sc = scrigniCapitolo(k).find(s => s.id === id);
  if (!sc || S.storia.scrigni.includes(id) || stelleCapitolo(k) < sc.stelle) return;
  S.storia.scrigni.push(id);
  if (sc.monete) { S.monete += sc.monete; FX.volaMonete(el, $(".monete"), 10); }
  if (sc.bustina) { S.inventario[sc.bustina]++; FX.volaIcona(el, $('[data-vista="bustine"]'), "b-normale"); }
  salva(); aggiornaTesta();
  el.classList.add("si-apre");
  await attesa(700);
  if (vista === "storia") disegna();
}

// ============================================================
//  BATTAGLIA (schermata a tutto schermo)
// ============================================================
let B = null, livelloAttuale = null, animazione = false, arena = null;

function squadraCPU(L, n = CARTE_SQUADRA) {
  const pool = CARTE.filter(c => L.rarita.includes(c.rarita)).map(c => c.id).sort(() => Math.random() - 0.5);
  return pool.slice(0, n).map(id => ({ id, liv: L.liv[0] + Math.floor(Math.random() * (L.liv[1] - L.liv[0] + 1)), lode: !!L.lode }));
}

function schermoIntero(entra) {
  try {
    if (entra && !document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    if (!entra && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  } catch (e) { /* il riquadro può rifiutare lo schermo intero: resta comunque a tutta pagina */ }
}

// Prima di ogni battaglia scegli quale delle tue squadre usare (e la squadra deve rispettare i punti)
// Le 3 squadre come bottoni: attr è l'attributo del click, scelta la squadra evidenziata (-1 = nessuna)
function htmlListaSquadre(attr, scelta) {
  return `<div class="ss-lista">${(S.squadre || []).map((q, i) => {
      const ok = q.carte.length >= Math.min(CARTE_SQUADRA, carteBattaglia());
      const sin = sinergieDi(q.carte), icone = [...sin.serie.filter(s => s.liv).map(s => `<span class="sin-mini" style="--c:${SERIE[s.serie].colore}">${SERIE[s.serie].simbolo}${s.n}</span>`), ...sin.multiverso.map(m => `<span class="sin-mini multiverso">∞${m.n}</span>`)].join("");
      return `<button class="ss-squadra ${i === scelta ? "attiva" : ""}" ${attr}="${i}" ${ok ? "" : "disabled"}>
        <div class="ss-testa"><b>${esc(q.nome || `Squadra ${i + 1}`)}</b><span class="ss-icone">${icone}</span></div>
        <div class="ss-carte">${q.carte.length ? q.carte.map(id => `<img src="${imgCarta(id)}" alt="${esc(PER_ID[id] ? PER_ID[id].nome : "")}" title="${esc(PER_ID[id] ? PER_ID[id].nome : "")} · Lv ${livello(id) || 1}">`).join("") : `<span class="nota">vuota</span>`}</div>
        ${ok ? "" : `<small class="ss-no">${q.carte.length < CARTE_SQUADRA ? "Squadra incompleta" : ""}</small>`}</button>`; }).join("")}</div>`;
}
function scegliSquadra(poi, titolo = "Con quale squadra combatti?") {
  if (B && $("#azioni")) return;
  apriModale(`<div class="scelta-squadra"><h3>${esc(titolo)}</h3>
    ${htmlListaSquadre("data-scegli-squadra", S.attiva || 0)}
    <div class="azioni"><button class="btn" data-azione="vai-squadre">Modifica le squadre</button></div></div>`);
  scegliSquadra.poi = poi;
}
async function avviaSfida(idLivello, carteForzate, nemiciForzati, giaScelta) {
  const Lp = typeof idLivello === "object" ? idLivello : LIVELLI_SFIDA.find(l => l.id === idLivello);
  // prima: scegli la squadra (non serve se guardi, se sei dal vivo, o se le carte sono già decise)
  if (!giaScelta && !carteForzate && Lp && !Lp.spettatore && !Lp.vivo) { scegliSquadra(() => avviaSfida(idLivello, carteForzate, nemiciForzati, true)); return; }
  livelloAttuale = Lp;
  const n = carteForzate ? CARTE_SQUADRA : carteBattaglia();
  const mia = livelloAttuale.spettatore ? livelloAttuale.spettatore.sqA.map(x => Object.assign({}, x))   // spettatore: le squadre dei due amici
    : livelloAttuale.vivo ? livelloAttuale.vivo.mia.map(x => Object.assign({}, x))   // dal vivo: la squadra letta dal server
    : (carteForzate || squadraAttiva().carte).slice(0, n).map(id => ({ id, liv: livello(id) || 1, lode: haLode(id), olo: haOlo(id), ultra: haUltra(id), asc: (S.asc || {})[id] || 0 }));
  const L = livelloAttuale;
  const nemici = nemiciForzati ? nemiciForzati.slice(0, n).map(id => { if (typeof id === "object") return id; const liv = L.liv[0] + Math.floor(Math.random() * (L.liv[1] - L.liv[0] + 1)); return { id, liv, lode: liv >= LIVELLO_MAX && L.storia && STORIA[L.storia.k].tappe[L.storia.i].boss }; }) : squadraCPU(L, n);
  // contro il computer: battaglia con un seme, così gli amici possono guardarla in diretta (le scelte del computer restano a caso)
  const seme = Math.floor(Math.random() * 2 ** 31);
  if (!L.spettatore) avvisoFineConsigli();
  B = L.spettatore ? Online.creaGuarda(mia, nemici) : L.vivo ? Online.creaBattaglia(mia, nemici) : new Battaglia(mia, nemici, "Tu", L.nome, mulberry32(seme));
  if (!L.spettatore && !L.vivo) B.rngIA = Math.random;
  const gMio = L.spettatore ? L.spettatore.gA : L.vivo ? L.vivo.graffitoMio : Graffiti.mio(), gNem = Graffiti.nemico(L);   // una volta sola: per i bot può essere a caso
  B.impostaGraffiti(gMio, gNem);
  const campoFisso = L.spettatore ? L.spettatore.campo : L.campo;   // storia: il campo della mappa (e chi guarda lo riceve)
  if (campoFisso) B.impostaCampo(campoFisso);
  const bossG = L.spettatore ? L.spettatore.bossGiorno : L.bossGiorno;   // boss del giorno: corazza e punto debole
  if (bossG) BossGiorno.prepara(B, bossG);
  B.zaino = L.spettatore ? null : Zaino.perBattaglia();
  if (L.spettatore) Online.rigioca(B);   // porta la battaglia al punto in cui è adesso, prima di disegnare l'arena
  if (L.bossGruppo) Boss.prepara(B);
  if (!L.spettatore && !L.vivo && !L.provaAdmin && !S.admin)
    Online.iniziaDiretta({ seme, sqA: mia, sqB: nemici, gA: gMio, gB: gNem, nomeA: (S.profilo.nome || "Giocatore").slice(0, 22), nomeB: `${L.nome} (computer)`,
      bossPv: L.bossGruppo ? B.lati[1].squadra[0].pvMax : null, campo: campoFisso || null, bossGiorno: L.bossGiorno || null });
  document.body.classList.add("in-battaglia");
  $("#app").classList.add("in-battaglia");
  const main = $("#vista");
  main.innerHTML = `
    <section class="arena" id="arena">
      <div class="arena-testa">
        <button class="btn piccolo" data-fx="scuoti" data-azione="abbandona">${L.spettatore ? "Esci" : "Abbandona"}</button>
        <div class="neon-turno" id="neon-turno" aria-live="polite"><b id="neon-chi">Tocca a te</b><small id="turno"></small></div>
        ${S.admin ? `<span class="admin-barra"><button class="btn piccolo oro" data-fx="carica" data-azione="admin-energia">◆ Piena</button><button class="btn piccolo oro" data-fx="coriandoli" data-azione="admin-vinci">Vinci</button></span>` : `<span class="arena-vs">contro <b>${esc(livelloAttuale.nome)}</b></span>`}
      </div>
      <div class="hud hud-1" id="hud-1"></div>
      <div class="lato-mio">
        <div class="hud hud-0" id="hud-0"></div>
        <div class="pannello" id="azioni"></div>
      </div>
    </section>`;
  Reazioni.monta();
  // il palco va per primo: sta sotto a tutto il resto
  $("#arena").insertAdjacentHTML("afterbegin", `<div class="palco" id="palco"><div class="scena3d" id="scena3d"></div><div class="fx-livello" id="fx-livello"></div><ol class="registro" id="registro" aria-live="polite"></ol></div>`);
  chiudiArena();
  if (usa3D()) {
    try {
      arena = new Scena3D.Arena($("#scena3d"), { schermo: $("#fx-livello"), onTocco: (l, i) => toccoPanchina(i) });
      // sul telefono i comandi coprono la parte bassa del campo: le carte si spostano nella parte libera
      const lm = $(".lato-mio"), pc = $("#palco");
      const copri = () => { if (!arena || !lm || !pc) return; const larghi = lm.offsetWidth > pc.clientWidth * .9; $("#arena").style.setProperty("--basso", (larghi ? lm.offsetHeight : 0) + "px"); arena.impostaCopertura(larghi ? lm.offsetHeight / Math.max(1, pc.clientHeight) : 0); };
      if (window.ResizeObserver && lm) { const ro = new ResizeObserver(copri); ro.observe(lm); ro.observe(pc); arena._roCopertura = ro; }
      copri();
      await arena.sincronizza(B);
    } catch (e) { console.error("3D non disponibile:", e); if (arena) arena.distruggi(); arena = null; }
  }
  $("#palco").classList.toggle("senza3d", !arena);
  aggiornaBattaglia();
  aggiungiRegistro({ testo: `Sfida contro ${livelloAttuale.nome}. Tocca una mossa per iniziare.`, avviso: true });
  Graffiti.annunciaInBattaglia(B);
}

function toccoPanchina(i) {
  if (!B || animazione || B.vincitore >= 0 || livelloAttuale.spettatore) return;
  const x = B.lati[0].squadra[i];
  if (!x || x.pv <= 0 || i === B.lati[0].attivo) return;
  if (B.serveSostituzione(0)) sostituisciGiocatore(i);
  else turnoGiocatore({ tipo: "cambio", i });
}

// ---------- Stime e consigli ----------
function stimaMossa(i) {
  const a = B.attivo(0), d = B.attivo(1), m = a.c.mosse[i];
  const eff = multStile(a.c.stile, d.c.stile);
  if (!m.pot) return { danno: 0, eff, ko: false, vuoto: false };
  let danno = B.calcolaDanno(0, a, d, m, false).danno;
  const primo = d.scudo ? Math.max(1, Math.round(danno * (1 - d.scudo / 100))) : danno;
  danno = primo + danno * ((m.colpi || 1) - 1);
  return { danno, eff, ko: !d.nebbia && danno >= d.pv, vuoto: d.nebbia };
}

// Indicazioni su chi batte chi ("▲ batte il nemico", "efficace"): solo all'inizio, si spengono da sole
// quando hai battuto il boss del capitolo 1 della storia (poi resta la legenda dei tipi).
const consigliAttivi = () => !(S && S.storia && STORIA[0] && stelleTappa(0, STORIA[0].tappe.length - 1) > 0);
// Mossa consigliata: si accende o si spegne dal profilo e vale solo contro il computer (mai dal vivo né quando guardi)
const mossaConsigliataAttiva = () => imp().consigli !== false && !(livelloAttuale && (livelloAttuale.vivo || livelloAttuale.spettatore));
function avvisoFineConsigli() {
  if (consigliAttivi() || S.consigliFiniti || S.admin) return;
  S.consigliFiniti = true; salva();
  setTimeout(() => mostraAvviso("Hai finito il capitolo 1: da ora in battaglia non ti dico più chi batte chi. Guarda la legenda dei tipi!"), 1200);
}
// Promemoria sempre visibile in battaglia: chi batte chi (e cosa vuol dire)
function htmlLegendaTipi() {
  const t = k => `<span class="lt-tipo s-${k}">${STILI[k].icona} ${STILI[k].nome}</span>`;
  return `<div class="legenda-tipi" aria-label="Chi batte chi">${t("FOR")}<i>batte</i>${t("DIF")}<i>batte</i>${t("VEL")}<i>batte</i>${t("FOR")}
    <small>La freccia vuol dire «batte»: chi è in vantaggio fa +30% di danni, chi è in svantaggio −20% e niente critici.</small></div>`;
}
function consiglio() {
  const L = B.lati[0], a = B.attivo(0), d = B.attivo(1), tipi = consigliAttivi();
  const usabili = a.c.mosse.map((m, i) => i).filter(i => B.puoUsare(0, i));
  const nome = i => a.c.mosse[i].nome;
  const ko = usabili.find(i => stimaMossa(i).ko);
  if (ko !== undefined) return { mossa: ko, testo: `Puoi mandare KO ${d.c.nome} con <b>${esc(nome(ko))}</b>!` };
  if (tipi && multStile(d.c.stile, a.c.stile) > 1 && a.pv / a.pvMax < 0.55) {
    const r = L.squadra.findIndex((x, k) => k !== L.attivo && x.pv > 0 && multStile(x.c.stile, d.c.stile) > 1);
    if (r >= 0) return { cambio: r, testo: `${esc(d.c.nome)} (${d.c.stile}) è forte contro di te: cambia con <b>${esc(L.squadra[r].c.nome)}</b> (${L.squadra[r].c.stile}), che lo batte.` };
  }
  if (d.nebbia) return { carica: true, testo: `${esc(d.c.nome)} è invisibile: il prossimo attacco va a vuoto. Meglio <b>Carica</b> o una mossa di supporto.` };
  let meglio = usabili[0], punti = -1;
  for (const i of usabili) { const p = B._valuta(0, a, d, a.c.mosse[i]); if (p > punti) { punti = p; meglio = i; } }
  const fin = a.c.mosse.findIndex(m => m.costo >= 5);
  if (fin >= 0 && L.energia < 5 && L.energia + 2 + BONUS_CARICA_UI >= 5 && a.c.mosse[meglio].costo === 0 && a.pv / a.pvMax > 0.35) {
    return { carica: true, testo: `Usa <b>Carica</b>: al prossimo turno avrai ${Math.min(ENERGIA_MAX, L.energia + 2 + BONUS_CARICA_UI)} energia per <b>${esc(nome(fin))}</b>.` };
  }
  const s = stimaMossa(meglio), e = s.eff;
  const nota = !tipi ? "" : e > 1 ? " Il tuo stile batte il suo (×1,3)." : e < 1 ? " Attento: il suo stile batte il tuo (×0,8)." : "";
  return { mossa: meglio, testo: `<b>${esc(nome(meglio))}</b>${s.danno ? ` fa circa ${s.danno} danni` : " è la mossa più utile adesso"}.${nota}` };
}
const BONUS_CARICA_UI = 2;

// ---------- Disegno ----------
function htmlHud(l) {
  const L = B.lati[l], a = B.attivo(l);
  const pct = Math.max(0, a.pv / a.pvMax * 100);
  const stato = [];
  if (a.stati.brucia) stato.push(`<span class="tag brucia">Brucia ${a.stati.brucia.turni}</span>`);
  if (a.stordito) stato.push(`<span class="tag">Stordito</span>`);
  else if (a.immuneFino >= B.turno) stato.push(`<span class="tag su" title="Si è appena ripreso: per questo turno non si può stordire">🛡 Resiste</span>`);
  if (a.scudo) stato.push(`<span class="tag">Scudo ${a.scudo}%</span>`);
  if (a.nebbia) stato.push(`<span class="tag">Invisibile</span>`);
  if (a.buff.att) stato.push(`<span class="tag su">Att +${a.buff.att.val}%</span>`);
  if (a.buff.debole) stato.push(`<span class="tag giu">Att −${a.buff.debole.val}%</span>`);
  const vivi = L.squadra.filter(x => x.pv > 0).length;
  return `
    ${arena ? "" : `<div class="hud-carta">${htmlCarta(a.c, { liv: a.liv, lode: a.lode, mini: true })}</div>`}
    <div class="hud-info">
      <div class="lato-nome"><span class="hud-chi">${livelloAttuale && livelloAttuale.spettatore ? esc(String(L.nome).slice(0, 14)) : l ? "Nemico" : "Tu"}</span><b>${esc(a.c.nome)}</b><span class="stile s-${a.c.stile}">${a.c.stile}</span><small>${a.lode ? "30 e lode" : `Lv ${a.liv}`} · ${esc(RUOLI[a.c.ruolo].nome)}</small>
        <span class="hud-squadra" title="Personaggi ancora in piedi">${L.squadra.map((x, i) => `<i class="${x.pv <= 0 ? "ko" : ""} ${i === L.attivo ? "attiva" : ""}"></i>`).join("")}<small>${vivi}/${L.squadra.length}</small></span>
        ${l ? `<span class="hud-energia" title="Energia del nemico">◆ ${L.energia}</span>` : ""}${Sinergie.htmlBattaglia(L)}</div>
      <div class="pv"><div class="pv-barra ${pct < 25 ? "basso" : pct < 55 ? "medio" : ""}"><i style="width:${pct}%"></i></div><span class="pv-num">${a.pv}/${a.pvMax}</span></div>
      ${htmlStatBattaglia(a)}
      ${stato.length ? `<div class="hud-riga">${stato.join("")}</div>` : ""}
    </div>`;
}

// Attacco (con livello e potenziamenti), difesa e velocità di un personaggio in battaglia
function statBattaglia(x) {
  const su = x.buff.att ? x.buff.att.val : 0, giu = x.buff.debole ? x.buff.debole.val : 0;
  return { att: Math.round(x.att * (x.f || 1) * (1 + su / 100) * (1 - giu / 100) * 10) / 10, dif: Math.round(x.dif * 10) / 10, vel: x.vel, mod: su - giu };
}
function htmlStatBattaglia(x, corto) {
  const s = statBattaglia(x);
  return `<span class="stat-bat${corto ? " corto" : ""}">
    <span class="sb att ${s.mod > 0 ? "su" : s.mod < 0 ? "giu" : ""}" title="Attacco"><i></i>${corto ? "" : "<small>ATT</small>"}<b>${s.att}</b></span>
    <span class="sb dif" title="Difesa"><i></i>${corto ? "" : "<small>DIF</small>"}<b>${s.dif}</b></span>
    <span class="sb vel" title="Velocità"><i></i>${corto ? "" : "<small>VEL</small>"}<b>${s.vel}</b></span>
  </span>`;
}

function htmlCristalli(energia, prossimo) {
  return Array.from({ length: ENERGIA_MAX }, (_, i) => `<i class="${i < energia ? "piena" : i < Math.min(ENERGIA_MAX, energia + prossimo) ? "arriva" : ""}" data-n="${i}"></i>`).join("");
}

function htmlPanchina(perSostituire) {
  const L = B.lati[0], d = B.attivo(1);
  return L.squadra.map((x, i) => {
    if (i === L.attivo && !perSostituire) return "";
    if (i === L.attivo) return "";
    const ko = x.pv <= 0, e = consigliAttivi() ? multStile(x.c.stile, d.c.stile) : 1, pct = Math.max(0, x.pv / x.pvMax * 100);
    return `<button class="riserva-btn ${ko ? "ko" : ""} ${e > 1 ? "vantaggio" : e < 1 ? "svantaggio" : ""}" data-fx="salto" ${ko ? "disabled" : `data-${perSostituire ? "sostituisci" : "cambia"}="${i}"`} ${animazione ? "disabled" : ""}>
      <img src="${imgCarta(x.c.id)}" alt="">
      <span class="riserva-testo"><b>${esc(x.c.nome)}</b><span class="stile s-${x.c.stile}">${x.c.stile}</span>${ko ? "<small>KO</small>" : e > 1 ? "<small class=\"su\">▲ batte il nemico</small>" : e < 1 ? "<small class=\"giu\">▼ in svantaggio</small>" : ""}${ko ? "" : htmlStatBattaglia(x, true)}</span>
      <span class="mini-pv"><i style="width:${pct}%"></i></span>
    </button>`;
  }).join("");
}

function htmlAzioni() {
  const finita = B.vincitore >= 0 && !animazione;   // il risultato si vede solo dopo l'ultima animazione
  if (finita && livelloAttuale.storia) return htmlFineStoria();
  if (finita && livelloAttuale.amico) return Amici.htmlFine();
  if (finita && livelloAttuale.bossGruppo) return Boss.htmlFine();
  if (finita && livelloAttuale.vivo) return Online.htmlFine();
  if (livelloAttuale.spettatore) return finita ? Online.htmlFineGuarda() : Online.htmlGuarda();
  const vivo = livelloAttuale.vivo ? Online.htmlBanner() : "";
  const diretta = !livelloAttuale.vivo && Online.inDiretta ? Online.htmlDiretta() : "";
  if (vivo && !animazione && B.vincitore < 0 && (Online.inAttesa() || (B.serveSostituzione(1) && !B.serveSostituzione(0)))) {
    return `${vivo}${htmlCampo()}${Graffiti.htmlBattaglia(B)}<div class="vivo-attesa"><span class="vivo-puntini"><i></i><i></i><i></i></span>
      <p>${Online.inAttesa() ? `Hai scelto <b>${esc(Online.scelta())}</b>.` : ""} ${esc(livelloAttuale.nome)} sta scegliendo…</p></div>`;
  }
  if (finita) {
    const vinto = B.vincitore === 0;
    return `<div class="fine ${vinto ? "vinto" : "perso"}">
      <b>${vinto ? "Vittoria!" : "Sconfitta"}</b>
      <span>${(() => { const pr = premiSfida(livelloAttuale); return vinto ? `+${pr.monete} monete · +${pr.xp} XP` : `+10 monete · +${XP_SCONFITTA} XP`; })()}</span>
      ${vinto && livelloAttuale.extraFine ? `<span class="punti-amico">${livelloAttuale.extraFine}</span>` : ""}
      ${htmlEspCarte()}
      <div class="azioni centro"><button class="btn primario" data-fx="onda" data-azione="rivincita">Rivincita</button><button class="btn" data-fx="salto" data-azione="esci-battaglia">Torna alle sfide</button></div>
    </div>`;
  }
  if (!animazione && B.serveSostituzione(0)) {
    return `${vivo}${diretta}<p class="consiglio forte"><b>${esc(B.attivo(0).c.nome)} è KO.</b> Scegli chi mandare in campo (puoi anche toccare la carta nell'arena).</p>
    <div class="panchina grande">${htmlPanchina(true)}</div>`;
  }
  const L = B.lati[0], a = B.attivo(0);
  const prossimo = 2 + (a.c.ruolo === "stratega" ? 1 : 0);
  const aiuti = consigliAttivi(), consOn = mossaConsigliataAttiva();
  const cons = animazione || !consOn ? null : consiglio();
  const primo = B.chiPrimo(), d = B.attivo(1);
  const perche = a.vel === d.vel ? `velocità pari, ${a.vel}: si tiene l'ordine così nessuno attacca due volte di fila` : `velocità ${Math.max(a.vel, d.vel)} contro ${Math.min(a.vel, d.vel)}`;
  const ordine = primo === 0 ? `<b>Attacchi per primo</b> (${perche})`
    : primo === 1 ? `<b>${esc(d.c.nome)} attacca per primo</b> (${perche})`
    : `Velocità pari (${a.vel}): il primo attacco si decide a sorte, poi si va a turno`;
  return `${vivo}${diretta}${htmlCampo()}${Graffiti.htmlBattaglia(B)}
  <p class="ordine-turno ${primo === 0 ? "mio" : primo === 1 ? "suo" : ""}">⚡ ${ordine}</p>
  ${htmlLegendaTipi()}
  <div class="mana-riga">
    <span class="mana-etichetta">Energia</span>
    <div class="cristalli" id="cristalli">${htmlCristalli(L.energia, prossimo)}</div>
    <b class="mana-num">${L.energia}<small>/${ENERGIA_MAX}</small></b>
    <span class="mana-prossimo" title="Energia che arriva a fine turno">+${prossimo}/turno</span>
  </div>
  ${animazione ? `<p class="consiglio"><span class="attendi">Turno in corso…</span></p>` : cons ? `<p class="consiglio"><b class="consiglio-tit">Consiglio</b> ${cons.testo}</p>` : ""}
  ${Zaino.htmlBattaglia()}
  <div class="mosse">
    ${a.c.mosse.map((mo, i) => {
      const puo = B.puoUsare(0, i), s = stimaMossa(i), manca = mo.costo - L.energia;
      const tag = !puo ? `<span class="mossa-tag manca">Mancano ${manca} ◆</span>` : consOn && s.ko ? `<span class="mossa-tag ko">KO!</span>` : cons && cons.mossa === i ? `<span class="mossa-tag cons">Consigliata</span>` : "";
      const stima = mo.pot ? (s.vuoto ? "Andrà a vuoto" : `≈ ${s.danno} danni${!aiuti ? "" : s.eff > 1 ? ' · <em class="su">efficace</em>' : s.eff < 1 ? ' · <em class="giu">poco efficace</em>' : ""}`) : esc(descrMossa(mo));
      return `<button class="mossa${mo.costo >= 5 ? " finale" : ""}${cons && cons.mossa === i ? " consigliata" : ""}" data-fx="scintille" data-stile="${a.c.stile}" data-mossa="${i}" data-costo="${mo.costo}" ${puo && !animazione ? "" : "disabled"}>
        <span class="mossa-costo">${mo.costo ? "◆".repeat(mo.costo) : "Gratis"}</span>
        <b>${esc(mo.nome)}</b>
        <small>${stima}</small>
        ${tag}
      </button>`;
    }).join("")}
    <button class="mossa secondaria${cons && cons.carica ? " consigliata" : ""}" data-fx="carica" data-azione="carica" data-costo="-2" ${animazione ? "disabled" : ""}>
      <span class="mossa-costo carica">+◆◆</span><b>Carica</b><small>+2 energia subito e −30% danni subiti</small>
      ${cons && cons.carica ? `<span class="mossa-tag cons">Consigliata</span>` : ""}
    </button>
  </div>
  <div class="panchina${cons && cons.cambio !== undefined ? " suggerita" : ""}">${htmlPanchina(false)}</div>`;
}

// Neon in alto: a chi tocca adesso (tu = azzurro, nemico = rosso)
function segnaTurno(lato, testo, sotto) {
  const n = $("#neon-turno");
  if (!n) return;
  const cls = lato === 0 ? "tu" : lato === 1 ? "nemico" : "fine";
  if (!n.classList.contains(cls) || $("#neon-chi").textContent !== testo) { n.className = "neon-turno " + cls; void n.offsetWidth; n.classList.add("cambia"); }
  $("#neon-chi").textContent = testo;
  $("#turno").textContent = sotto || testoTurno();
  if (arena) arena.turnoDi = lato === 0 || lato === 1 ? lato : null;
}
// "Turno 23 · 🚨 sirene tra 7": dal turno 20 si vede quanto manca alle sirene
function testoTurno() {
  if (!B) return "";
  const mancano = TURNO_SIRENE - B.turno;
  return `Turno ${B.turno}${mancano > 0 && mancano <= 10 ? ` · 🚨 sirene tra ${mancano}` : mancano <= 0 ? " · 🚨 sirene" : ""}`;
}
function segnaTurnoAttesa() {
  if (!B) return;
  if (livelloAttuale && livelloAttuale.spettatore) return segnaTurno(null, B.vincitore >= 0 ? `Vince ${B.lati[B.vincitore].nome}` : "👀 Dal vivo", testoTurno());
  if (B.vincitore >= 0) return segnaTurno(null, B.vincitore === 0 ? "Vittoria!" : "Sconfitta", testoTurno());
  if (livelloAttuale && livelloAttuale.vivo && (Online.inAttesa() || (B.serveSostituzione(1) && !B.serveSostituzione(0))))
    return segnaTurno(1, `Tocca a ${livelloAttuale.nome}`, `${testoTurno()} · sta scegliendo`);
  segnaTurno(0, "Tocca a te", B.serveSostituzione(0) ? "Scegli chi mandare in campo" : `${testoTurno()} · scegli una mossa`);
}

// Il campo di battaglia: riquadro nel pannello e colore dell'arena
function htmlCampo() {
  const c = B && CAMPI[B.campo]; if (!c) return "";
  return `<p class="campo-banner" style="--c:${c.colore}"><span class="campo-ico">${c.icona}</span><span><b>Campo: ${c.nome}</b><small>${c.desc}</small></span></p>`;
}
function aggiornaBattaglia() {
  if (!B || !$("#arena")) return;
  // il campo: in 3D lo disegna la scena (pioggia, stelle, fari, lava, colonne), senza 3D un velo colorato
  if (arena && arena.impostaCampo) { arena.impostaCampo(B.campo); delete $("#arena").dataset.campo; }
  else $("#arena").dataset.campo = B.campo || "";
  if (!animazione) segnaTurnoAttesa();
  $("#hud-1").innerHTML = htmlHud(1);
  $("#hud-0").innerHTML = htmlHud(0);
  $("#azioni").innerHTML = htmlAzioni();
}
function aggiungiRegistro(e) {
  const reg = $("#registro");
  if (!reg || e.separatore) return;
  const li = document.createElement("li");
  li.textContent = e.testo;
  if (e.avviso || e.fine) li.className = "forte";
  else if (e.lato === 1) li.className = "nemico";
  reg.appendChild(li);
  while (reg.children.length > 4) reg.firstChild.remove();
}

// Anteprima: passando su una mossa si illuminano i cristalli che consuma
function anteprimaCosto(costo) {
  const c = $("#cristalli");
  if (!c || !B) return;
  const en = B.lati[0].energia;
  $$("i", c).forEach((el, i) => {
    el.classList.toggle("spesa", costo > 0 && i >= en - costo && i < en);
    el.classList.toggle("guadagno", costo < 0 && i >= en && i < Math.min(ENERGIA_MAX, en - costo));
  });
}
document.addEventListener("pointerover", e => { const m = e.target.closest && e.target.closest(".mossa"); anteprimaCosto(m && !m.disabled ? +m.dataset.costo : 0); });
document.addEventListener("focusin", e => { const m = e.target.closest && e.target.closest(".mossa"); if (m) anteprimaCosto(+m.dataset.costo); });

function applicaFoto(f) {
  B.lati.forEach((L, l) => { L.squadra.forEach((x, i) => { x.pv = f.pv[l][i]; }); L.energia = f.en[l]; L.attivo = f.att[l]; });
}

// Riproduce gli eventi del turno uno alla volta, con le animazioni 3D
async function riproduci(eventi) {
  animazione = true;
  const finale = { pv: B.lati.map(L => L.squadra.map(x => x.pv)), en: B.lati.map(L => L.energia), att: B.lati.map(L => L.attivo) };
  aggiornaBattaglia();
  for (const e of eventi) {
    if (e.foto && e.anim !== "attacco") applicaFoto(e.foto);
    aggiungiRegistro(e);
    if (e.lato === 0 || e.lato === 1) {
      const chi = e.foto && e.foto.att ? B.lati[e.lato].squadra[e.foto.att[e.lato]] : B.attivo(e.lato);
      if (e.anim === "attacco") segnaTurno(e.lato, chi.c.nome, e.lato ? `Attacco nemico · ${e.nome}` : `Il tuo attacco · ${e.nome}`);
      else if (e.anim === "energia") segnaTurno(e.lato, chi.c.nome, "Carica energia");
    }
    if (arena) {
      try {
        if (e.anim === "attacco") { await arena.attacco(e.lato, e); applicaFoto(e.foto); }
        else if (e.colpo !== undefined) { aggiornaBattaglia(); await arena.colpito(e.colpo, e); }
        else if (e.cura !== undefined) { aggiornaBattaglia(); await arena.cura(e.cura, e.quanto); }
        else if (e.anim === "schiva") await arena.schiva(e.bersaglio);
        else if (e.entra !== undefined) { aggiornaBattaglia(); await arena.entra(e.entra, e.foto.att[e.entra]); }
        else if (e.ko !== undefined) { aggiornaBattaglia(); await arena.ko(e.ko); }
        else if (e.su !== undefined) { aggiornaBattaglia(); await arena.effetto(e.su, e.anim, B); }
        else await attesa((e.separatore ? 150 : 300) / (VELOCITA[imp().velocita] || 1));
      } catch (err) { await attesa(200); }
    } else {
      if (e.colpo !== undefined) { const el = $(`#hud-${e.colpo} .hud-carta`); if (el) FX.riavvia(el, "colpito"); }
      await attesa((ridotto ? 100 : e.separatore ? 200 : 450) / (VELOCITA[imp().velocita] || 1));
    }
    aggiornaBattaglia();
  }
  applicaFoto(finale);
  if (arena) await arena.sincronizza(B);
  if (B.vincitore >= 0) await attesa(ridotto ? 100 : 700);   // un attimo di pausa prima del risultato
  animazione = false;
  aggiornaBattaglia();
}

async function turnoGiocatore(az) {
  if (animazione || !B || B.vincitore >= 0 || livelloAttuale.spettatore) return;
  if (livelloAttuale.vivo) return Online.scegli(az);
  const azC = B.scegliAzione(1, livelloAttuale.abilita);
  let ev = B.risolviTurno(az, azC);
  Online.loggaDiretta({ o: "turno", a: az, b: azC });
  if (B.serveSostituzione(1)) { const i = B.scegliSostituto(1); ev = ev.concat(B.sostituisci(1, i)); Online.loggaDiretta({ o: "sost", l: 1, i }); }
  await riproduci(ev);
  if (B.vincitore >= 0) chiudiSfida();
}
async function sostituisciGiocatore(i) {
  if (animazione || (livelloAttuale && livelloAttuale.spettatore)) return;
  if (livelloAttuale && livelloAttuale.vivo) return Online.sostituisci(i);
  const ev = B.sostituisci(0, i); Online.loggaDiretta({ o: "sost", l: 0, i });
  await riproduci(ev);
}

// Dopo una battaglia: le carte al 30 fanno esperienza verso la lode, le altre mostrano i potenziatori
// Dopo ogni battaglia: le carte al 30 prendono punti lode; se hai VINTO, le carte che sono scese in campo
// prendono anche potenziatori (1 contro la Recluta, fino a 5 nelle sfide e nelle tappe più difficili).
// I doppioni restano il modo principale per averne tanti.
const potVittoria = mult => Math.max(1, Math.min(5, Math.round(mult)));
function premiaCarte(mult, vinto) {
  if (livelloAttuale && !livelloAttuale.spettatore) StatCarte.registra(vinto, livelloAttuale.vivo ? "vivo" : "pc");
  const xp = Math.round((vinto ? 50 : 20) * mult * (carteBattaglia() === 3 ? .6 : 1));
  const potV = vinto ? potVittoria(mult) : 0;
  return B.lati[0].squadra.map(x => {
    if (!S.carte[x.id]) return null;
    const prima = infoCarta(x.id), verso = prima.liv >= LIVELLO_MAX && !prima.lode;
    if (verso) S.lodeXp[x.id] = (S.lodeXp[x.id] || 0) + xp;
    const pot = potV && x.usata && prima.liv < LIVELLO_MAX ? potV : 0;
    if (pot) S.pot = Object.assign({}, S.pot, { [x.id]: ((S.pot || {})[x.id] || 0) + pot });
    const dopo = infoCarta(x.id);
    return { id: x.id, xp: verso ? xp : 0, pot, prontaNuova: !prima.pronta && dopo.pronta, liv: dopo.liv, lode: dopo.lode, lodeNuova: !prima.lode && dopo.lode };
  }).filter(Boolean);
}
function htmlEspCarte() {
  const lista = livelloAttuale && livelloAttuale.espCarte;
  if (!lista || !lista.length) return "";
  const totPot = lista.reduce((n, r) => n + (r.pot || 0), 0);
  return `${totPot ? `<p class="esp-pot-nota">Le carte scese in campo hanno guadagnato <b>potenziatori</b> ▲${lista.some(r => r.prontaNuova) ? " — qualcuna ora si può potenziare!" : ""}</p>` : ""}<div class="esp-carte">${lista.map((r, j) => {
    const ora = infoCarta(r.id), pct = ora.lode ? 100 : Math.round(ora.dentro / ora.serve * 100);
    return `<div class="esp-carta ${ora.puoi ? "su" : ""} ${r.lodeNuova ? "lode" : ""}" style="--i:${j}">
    <img src="${imgCarta(r.id)}" alt="${esc(PER_ID[r.id].nome)}">
    <span class="esp-liv">${ora.lode ? "30L" : "Lv " + ora.liv}</span>
    <span class="esp-barra ${ora.liv < LIVELLO_MAX ? "pot" : ""}"><i style="--p:${pct}%"></i></span>
    ${r.pot ? `<span class="esp-pot">+${r.pot} ▲</span>` : ""}
    <small>${r.lodeNuova ? "LODE!" : r.xp ? `+${r.xp} lode` : ora.lode ? "Lode" : ora.puoi ? "Potenzia!" : `${ora.pot}/${ora.servePot}`}</small>
  </div>`; }).join("")}</div>`;
}

function chiudiSfida() {
  if (livelloAttuale && !livelloAttuale.vivo && !livelloAttuale.spettatore) Online.fineDiretta(B.vincitore);
  if (livelloAttuale && livelloAttuale.storia) return chiudiStoria();
  if (livelloAttuale && livelloAttuale.amico) return Amici.chiudi();
  if (livelloAttuale && livelloAttuale.bossGruppo) return Boss.chiudi();
  if (livelloAttuale && livelloAttuale.vivo) return Online.chiudi();
  if (livelloAttuale && livelloAttuale.spettatore) return Online.chiudiGuarda();
  livelloAttuale.espCarte = premiaCarte(livelloAttuale.xpCarte || 1, B.vincitore === 0);
  let su = 0;
  const pr = premiSfida(livelloAttuale);
  if (B.vincitore === 0) {
    S.monete += pr.monete; S.stats.vittorie++; S.stats.punti += pr.punti;
    su = aggiungiXP(pr.xp);
    Missioni.evento("vittoria", { squadra: B.lati[0].squadra.map(x => x.id) });
    livelloAttuale.extraFine = livelloAttuale.dopoVittoria ? livelloAttuale.dopoVittoria() : "";
    if (arena) arena.vittoria(0);
    setTimeout(() => { const el = $(".fine b"); if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 60, forma: "coriandolo", colori: ["#f2c14e", "#ff2e46", "#3fd8ff", "#ffffff"], velocita: 8, dimensione: 5, durata: 1500 }); } }, 50);
  } else { S.monete += 10; S.stats.sconfitte++; su = aggiungiXP(XP_SCONFITTA); }
  salva();
  Archivio.pubblicaClassifica();
  aggiornaTesta();
  aggiornaBattaglia();
  if (su) setTimeout(() => mostraAvviso(`Pass: livello ${su} raggiunto! Vai al pass per riscuotere il premio.`), 600);
}

function chiudiArena() { if (arena) { if (arena._roCopertura) arena._roCopertura.disconnect(); arena.distruggi(); arena = null; } }
function esciBattaglia() {
  if (livelloAttuale && livelloAttuale.vivo && Online.inPartita) Online.esci();
  if (livelloAttuale && livelloAttuale.spettatore && Online.inGuarda) Online.esciGuarda();
  Online.chiudiDiretta();
  chiudiArena();
  B = null; animazione = false;
  document.body.classList.remove("in-battaglia");
  $("#app").classList.remove("in-battaglia");
  schermoIntero(false);
  const daStoria = livelloAttuale && livelloAttuale.storia;
  if (daStoria) capStoria = daStoria.k;
  vai(daStoria ? "storia" : "sfida");
  if (versioneNuova) setTimeout(applicaAggiornamento, 600);
}

// ============================================================
//  EVENTI
// ============================================================
document.addEventListener("input", e => { if (e.target.closest && e.target.closest("#form-graffiti")) Graffiti.anteprimaAdmin(e.target); });
document.addEventListener("change", e => {
  const d = e.target.dataset && e.target.dataset.filtraRuolo;
  if (!d || !filtri[d]) return;
  filtri[d].ruolo = e.target.value; disegnaQuieto();
});
document.addEventListener("input", e => {
  const d = e.target.dataset && e.target.dataset.cerca;
  if (!d || !filtri[d]) return;
  filtri[d].cerca = e.target.value.slice(0, 40);
  clearTimeout(filtri._t); filtri._t = setTimeout(disegnaQuieto, 120);
});
document.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.immaginePer) Graffiti.immagineScelta(e.target); });
document.addEventListener("change", e => { if (e.target.id === "img-file" && e.target.files.length) caricaFileImmagini(e.target.files); });
document.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.reazImg !== undefined && e.target.files.length) Reazioni.immagine(+e.target.dataset.reazImg, e.target.files[0]); });
document.addEventListener("click", e => {
  if (e.target.closest && e.target.closest('#mondo[data-trascinato]')) return;
  const t = e.target.closest("[data-tappa-squadra],[data-compra-oggetto],[data-sfida-vivo],[data-zaino-posto],[data-zaino-metti],[data-usa-oggetto],[data-compra-graffito],[data-emoji-per],[data-bomboletta],[data-scegli-graffito],[data-scheda-album],[data-trofeo],[data-titolo],[data-scambio-amico],[data-scambio-chiedo],[data-scambio-offro],[data-scambio-indietro],[data-scambio-accetta],[data-scambio-rifiuta],[data-scambio-annulla],[data-scambio-ritira],[data-reazione],[data-reazioni],[data-guarda],[data-slot],[data-sq-az],[data-sfida-amico],[data-missione],[data-boss-premio],[data-compra],[data-riapri-codice],[data-capitolo],[data-tappa],[data-tappa-via],[data-scrigno],[data-ed-filtro],[data-avatar],[data-imp],[data-profilo],[data-admin],#profilo-btn,[data-azione],[data-vista],[data-filtro],[data-filtro-sq],[data-filtra],[data-dettaglio],[data-scegli],[data-sfida],[data-mossa],[data-cambia],[data-sostituisci],[data-apri],[data-riscuoti],[data-pass-scelta],[data-pot-carta],[data-squadra],[data-squadra-sfida],[data-sposta],[data-togli],.gira,.carta[role=button],[data-campo-scelto],[data-sfida-settimana],[data-riscuoti-settimana],[data-admin-evidenza],[data-torneo],[data-scegli-squadra]");
  if (!t) {
    if (e.target.id === "modale" && !$("#modale").dataset.bloccata) chiudiModale();
    return;
  }
  if (t.disabled) return;
  if (t.id === "profilo-btn") { apriProfilo(); return; }
  if (t.dataset.avatar) { avatarScelto = t.dataset.avatar; $$(".av-btn").forEach(b => { const si = b.dataset.avatar === avatarScelto; b.classList.toggle("sel", si); b.setAttribute("aria-checked", si); }); return; }
  if (t.dataset.imp) {
    const v = t.dataset.val === "true" ? true : t.dataset.val === "false" ? false : t.dataset.val;
    S.impostazioni = Object.assign(imp(), { [t.dataset.imp]: v });
    applicaImpostazioni(); salva();
    t.parentElement.querySelectorAll(".seg").forEach(b => { const si = b === t; b.classList.toggle("sel", si); b.setAttribute("aria-checked", si); });
    if (vista === "sfida" && !B) setTimeout(disegna, 150);
    return;
  }
  if (t.dataset.profilo) { entra("partita", t.dataset.profilo); return; }
  if (t.dataset.admin) { azioneAdmin(t.dataset.admin, t); return; }
  if (t.dataset.capitolo !== undefined) { capStoria = +t.dataset.capitolo; disegna(); return; }
  if (t.dataset.tappa) { const [k, i] = t.dataset.tappa.split(":").map(Number); apriTappa(k, i); return; }
  if (t.dataset.tappaSquadra !== undefined) {
    const q = +t.dataset.tappaSquadra, box = $("#tappa-scelta");
    S.attiva = q; salva();
    const [k, i] = (box && box.dataset.luogo || "").split(":").map(Number);
    if (box) { box.innerHTML = htmlSceltaTappa(k, i, q); const b = box.querySelector("[data-tappa-via]"); if (b) { FX.riavvia(b, "entra"); b.scrollIntoView({ block: "nearest", behavior: ridotto ? "auto" : "smooth" }); } }
    return;
  }
  if (t.dataset.tappaVia) { const [k, i] = t.dataset.tappaVia.split(":").map(Number); schermoIntero(true); setTimeout(() => avviaStoria(k, i), ridotto ? 0 : 200); return; }
  if (t.dataset.scrigno) { const [k, id] = t.dataset.scrigno.split(":"); riscuotiScrigno(+k, id, t); return; }
  if (t.dataset.edFiltro) { edFiltro = t.dataset.edFiltro; aggiornaEditor(true); return; }
  if (t.dataset.vista) { if (B) return; vai(t.dataset.vista); return; }
  if (t.dataset.filtro) { filtroAlbum = t.dataset.filtro; disegnaQuieto(); return; }
  if (t.dataset.filtroSq) { filtroSquadra = t.dataset.filtroSq; disegna(); return; }
  if (t.dataset.filtra) {
    const [dove, campo, val] = t.dataset.filtra.split(":"), f = filtri[dove];
    if (campo === "azzera") Object.assign(f, { tipo: "", ruolo: "", cerca: "" }, "serie" in f ? { serie: "", pot: false } : {});
    else if (campo === "pot") f.pot = !f.pot;
    else f[campo] = f[campo] === val ? "" : val;
    disegnaQuieto(); return;
  }
  if (t.dataset.squadra !== undefined) { S.attiva = +t.dataset.squadra; salva(); disegna(); return; }
  if (t.dataset.squadraSfida !== undefined) { S.attiva = +t.dataset.squadraSfida; salva(); disegna(); return; }
  if (t.dataset.scegli) { toccoCartaSquadra(t.dataset.scegli); return; }
  if (t.dataset.slot !== undefined) { const id = squadraAttiva().carte[+t.dataset.slot]; if (id) toccoCartaSquadra(id); return; }
  if (t.dataset.sqAz) { azioneCartaSquadra(t.dataset.sqAz); return; }
  if (t.dataset.sposta) {
    const [i, d] = t.dataset.sposta.split(":").map(Number), c = squadraAttiva().carte, j = i + d;
    if (j < 0 || j >= c.length) return;
    [c[i], c[j]] = [c[j], c[i]];
    salva(); disegnaQuieto(); return;
  }
  if (t.dataset.togli !== undefined) { squadraAttiva().carte.splice(+t.dataset.togli, 1); salva(); setTimeout(disegnaQuieto, ridotto ? 0 : 150); return; }
  if (t.dataset.apri) { apriBustinaAggiornata(t.dataset.apri); return; }
  if (t.dataset.compra) { compraBustina(t.dataset.compra, t); return; }
  if (t.dataset.compraOggetto) { const [id, n] = t.dataset.compraOggetto.split(":"); Zaino.compra(id, +n || 1, t); return; }
  if (t.dataset.zainoPosto !== undefined) { Zaino.apriPosto(+t.dataset.zainoPosto); return; }
  if (t.dataset.zainoMetti !== undefined) { Zaino.metti(t.dataset.zainoMetti); return; }
  if (t.dataset.usaOggetto !== undefined) { Zaino.usa(+t.dataset.usaOggetto); return; }
  if (t.dataset.torneo) { Torneo.iscriviti(t.dataset.torneo === "iscriviti"); return; }
  if (t.dataset.sfidaSettimana !== undefined) { Settimana.avvia(+t.dataset.sfidaSettimana); return; }
  if (t.dataset.riscuotiSettimana) { Settimana.riscuoti(t.dataset.riscuotiSettimana); return; }
  if (t.dataset.adminEvidenza !== undefined) { Settimana.salvaAdmin(t.dataset.adminEvidenza); return; }
  if (t.dataset.campoScelto) { const [i, k] = t.dataset.campoScelto.split(":"); Zaino.usa(+i, k); return; }
  if (t.dataset.compraGraffito) { Graffiti.compraUno(t.dataset.compraGraffito, t); return; }
  if (t.dataset.emojiPer) { Graffiti.apriEmoji(t.dataset.emojiPer); return; }
  if (t.dataset.bomboletta) { Graffiti.compra(+t.dataset.bomboletta, t); return; }
  if (t.dataset.scegliGraffito !== undefined) { Graffiti.scegli(t.dataset.scegliGraffito); return; }
  if (t.dataset.schedaAlbum) { albumScheda = t.dataset.schedaAlbum; if (albumScheda === "scambi") Scambi.carica(); disegna(); return; }
  if (t.dataset.trofeo) { Trofei.riscuoti(t.dataset.trofeo, t); return; }
  if (t.dataset.titolo !== undefined) { Trofei.scegliTitolo(t.dataset.titolo); return; }
  if (t.dataset.scambioAmico) { Scambi.sceltoAmico(t.dataset.scambioAmico); return; }
  if (t.dataset.scambioChiedo) { Scambi.scegli("chiedo", t.dataset.scambioChiedo); return; }
  if (t.dataset.scambioOffro) { Scambi.scegli("offro", t.dataset.scambioOffro); return; }
  if (t.dataset.scambioIndietro) { Scambi.indietro(t.dataset.scambioIndietro); return; }
  if (t.dataset.scambioAccetta) { Scambi.rispondi(t.dataset.scambioAccetta, true, t); return; }
  if (t.dataset.scambioRifiuta) { Scambi.rispondi(t.dataset.scambioRifiuta, false, t); return; }
  if (t.dataset.scambioAnnulla) { Scambi.annulla(t.dataset.scambioAnnulla); return; }
  if (t.dataset.scambioRitira) { Scambi.ritira(true, t); return; }
  if (t.dataset.reazione !== undefined) { Reazioni.manda(t.dataset.reazione); return; }
  if (t.dataset.guarda) { Online.guarda(t.dataset.guarda); return; }
  if (t.dataset.reazioni) { Reazioni.clic(t.dataset.reazioni); return; }
  if (t.dataset.sfidaAmico) { if (B) { chiudiArena(); B = null; animazione = false; } Amici.sfida(t.dataset.sfidaAmico); return; }
  if (t.dataset.missione) { Missioni.riscuoti(t.dataset.missione, t); return; }
  if (t.dataset.bossPremio) { t.disabled = true; Boss.riscatta(t.dataset.bossPremio, t); return; }
  if (t.dataset.riapriCodice) { riapriCodice(t.dataset.riapriCodice); return; }
  if (t.dataset.riscuoti) { riscuoti([+t.dataset.riscuoti], t); return; }
  if (t.dataset.passScelta) { const [l, j] = t.dataset.passScelta.split(":").map(Number); scegliPremioPass(l, j, t); return; }
  if (t.dataset.potCarta) { datiPotenziatori(t.dataset.potCarta, t); return; }
  if (t.dataset.sfida) { schermoIntero(true); setTimeout(() => avviaSfida(t.dataset.sfida), ridotto ? 0 : 220); return; }
  if (t.dataset.mossa !== undefined) { turnoGiocatore({ tipo: "mossa", i: +t.dataset.mossa }); return; }
  if (t.dataset.cambia !== undefined) { turnoGiocatore({ tipo: "cambio", i: +t.dataset.cambia }); return; }
  if (t.dataset.sostituisci !== undefined) { sostituisciGiocatore(+t.dataset.sostituisci); return; }
  if (t.dataset.sfidaVivo !== undefined) { const id = t.dataset.sfidaVivo; if (B) { Online.esci(); esciBattaglia(); } scegliSquadra(() => Online.sfida(id), "Con quale squadra sfidi il tuo amico?"); return; }
  if (t.dataset.scegliSquadra !== undefined) { S.attiva = +t.dataset.scegliSquadra; salva(); const f = scegliSquadra.poi; scegliSquadra.poi = null; chiudiModale(); if (f) f(); return; }
  if (t.classList.contains("gira")) { if (t.classList.contains("girata")) apriSchedaCarta(esitiAperti[+t.dataset.i]); else t.classList.add("girata"); return; }
  if (t.matches(".carta[role=button]")) { apriDettaglio(t.dataset.id); return; }
  if (t.dataset.dettaglio) { apriDettaglio(t.dataset.dettaglio); return; }
  switch (t.dataset.azione) {
    case "entra": entra("partita"); break;
    case "entra-admin": chiudiModale(); if (Archivio.proprietario) entra("admin"); break;
    case "esci-admin": chiudiModale(); entra("partita"); break;
    case "nuovo-profilo": avatarScelto = ""; mostraAccesso("nuovo"); break;
    case "torna-accesso": mostraAccesso(); break;
    case "vai-accesso": vaiAccesso(); break;
    case "vai-strada": vai("strada"); break;
    case "admin-energia": if (B && S.admin && !animazione) { B.lati[0].energia = ENERGIA_MAX; aggiornaBattaglia(); } break;
    case "admin-vinci": if (B && S.admin && !animazione && B.vincitore < 0) { B.lati[1].squadra.forEach(x => { x.pv = 0; }); B.vincitore = 0; if (arena) arena.sincronizza(B); chiudiSfida(); } break;
    case "vai-bustine": vai("bustine"); break;
    case "vai-sfida": vai("sfida"); break;
    case "vai-classifica": vai("classifica"); break;
    case "vai-squadra": vai("squadra"); break;
    case "vai-pass": vai("pass"); break;
    case "vai-negozio": vai("negozio"); break;
    case "vai-amici": Amici.apriElenco(); break;
    case "graffiti-collezione": Graffiti.apriCollezione(); break;
    case "nuovo-scambio": Scambi.apriNuovo(); break;
    case "proponi-scambio": Scambi.proponi(t); break;
    case "attacca-boss": Boss.attacca(); break;
    case "esci-amici": esciBattaglia(); setTimeout(() => Amici.apriElenco(), 300); break;
    case "esci-boss": esciBattaglia(); break;
    case "riscuoti-accesso": Missioni.riscuotiAccesso(t); break;
    case "gira-tutte": if (apertura) apertura.giraTutte(); setTimeout(giraBomboletta, 1600); break;
    case "gira-bomboletta": giraBomboletta(); break;
    case "gira-tutte-2d": $$(".gira").forEach((g, i) => setTimeout(() => g.classList.add("girata"), ridotto ? 0 : i * 180)); setTimeout(giraBomboletta, 1000); break;
    case "chiudi-apertura": chiudiApertura(); break;
    case "pass-bonus": apriScrignoBonus(t); break;
    case "riscuoti-tutto": riscuoti(Array.from({ length: livelloPass() }, (_, i) => i + 1), t); break;
    case "carica": turnoGiocatore({ tipo: "carica" }); break;
    case "abbandona":
      if (livelloAttuale && livelloAttuale.spettatore) { Online.esciGuarda(); esciBattaglia(); break; }
      if (animazione) break;
      apriModale(`<div class="conferma"><h2>Abbandonare la sfida?</h2><p>${livelloAttuale.vivo ? `Conta come una sconfitta e ${esc(livelloAttuale.nome)} vince.` : "Conta come una sconfitta."}</p>
        <div class="azioni centro"><button class="btn primario" data-fx="scuoti" data-azione="conferma-abbandono">Abbandona</button><button class="btn" data-fx="onda" data-azione="chiudi">Continua a giocare</button></div></div>`);
      break;
    case "conferma-abbandono": chiudiModale(); if (livelloAttuale.vivo) Online.resa(); B.vincitore = 1; chiudiSfida(); if (livelloAttuale.vivo) Online.esci(); esciBattaglia(); break;
    case "esci-vivo": chiudiModale(); Online.esci(); if (B) esciBattaglia(); break;
    case "esci-guarda": chiudiModale(); Online.esciGuarda(); if (B) esciBattaglia(); break;
    case "annulla-invito": Online.annullaInvito(); break;
    case "accetta-invito": scegliSquadra(() => Online.rispondi(true), "Con quale squadra accetti la sfida?"); break;
    case "vai-squadre": { const c = scegliSquadra.poi; scegliSquadra.poi = null; chiudiModale(); if (c && Online.rifiutaSeInvito) Online.rifiutaSeInvito(); if (!B) schermoIntero(false); vai("squadra"); break; }
    case "rifiuta-invito": Online.rispondi(false); break;
    case "rivincita": chiudiArena(); if (livelloAttuale.storia) avviaStoria(livelloAttuale.storia.k, livelloAttuale.storia.i); else if (livelloAttuale.rifai) livelloAttuale.rifai(); else avviaSfida(livelloAttuale.id); break;
    case "boss-giorno": BossGiorno.avvia(); break;
    case "storia-avanti": {
      const { k, i } = livelloAttuale.storia, p = i + 1 < STORIA[k].tappe.length ? { k, i: i + 1 } : { k: k + 1, i: 0 };
      esciBattaglia(); capStoria = p.k; disegna(); setTimeout(() => apriTappa(p.k, p.i), 250); break;
    }
    case "vai-storia": vai("storia"); break;
    case "centra-mappa": centraMappa(); break;
    case "potenzia": potenziaCarta(t.dataset.id, t); break;
    case "ascesa": ascendiCarta(t.dataset.id, false); break;
    case "ascesa-ok": ascendiCarta(t.dataset.id, true, t); break;
    case "rifai-tutorial": chiudiModale(); if (!B) setTimeout(() => Tutorial.avvia(), 150); break;
    case "esci-account": (async () => { chiudiModale(); try { await Archivio.aspettaScritture(); } catch (e) {} try { await window.NoiversoAccesso.esci(); } catch (e) {} ImmaginiCarte.dimentica(); location.reload(); })(); break;
    case "ricarica": Archivio.aspettaScritture().catch(() => {}).then(() => location.reload()); break;
    case "controlla-versione": controllaAggiornamento().then(v => mostraAvviso(!v ? "Non riesco a controllare la versione da qui." : v === VERSIONE ? `Hai l'ultima versione (${VERSIONE}).` : "Versione nuova trovata: aggiorno…")); break;
    case "esci-battaglia": esciBattaglia(); break;
    case "chiudi": chiudiModale(); if (vista === "bustine" && !B) disegna(); break;
  }
});
document.addEventListener("submit", e => {
  e.preventDefault();
  if (e.target.id === "form-profilo") inviaProfilo(e.target);
  if (e.target.id === "form-codice-promo") usaCodice();
  if (e.target.id === "form-codice") salvaCodiceAdmin(e.target);
  if (e.target.id === "form-titolo-classifica") salvaTitoloClassifica(e.target);
  if (e.target.id === "form-zaino") Zaino.salvaAdmin(e.target);
  if (e.target.id === "form-sinergie") Sinergie.salvaAdmin(e.target);
  if (e.target.id === "form-torneo") Torneo.crea(e.target);
  if (e.target.id === "form-graffiti") Graffiti.pubblica();
  if (e.target.id === "form-modifica") {
    const nome = $("#nome-modifica").value.trim().slice(0, 20);
    if (nome) S.profilo.nome = nome;
    if (avatarScelto && avatarValido(avatarScelto)) S.profilo.avatar = avatarScelto;
    if (Archivio.modo !== "cloud" && Archivio.profiloLocale) Profili.aggiorna(Archivio.profiloLocale, { nome: S.profilo.nome, avatar: S.profilo.avatar });
    salva(); Archivio.pubblicaClassifica(); aggiornaTesta(); apriProfilo(); mostraAvviso("Profilo aggiornato.");
  }
});
document.addEventListener("input", e => {
  if (e.target.id === "admin-pass") $("#admin-pass-val").textContent = e.target.value;
  if (e.target.dataset && e.target.dataset.reazTesto !== undefined) Reazioni.testo(+e.target.dataset.reazTesto, e.target.value);
  if (e.target.dataset && e.target.dataset.ed && bozza) { bozza[e.target.dataset.ed][e.target.dataset.campo] = e.target.type === "checkbox" ? e.target.checked : e.target.value; aggiornaEditor(false); }
  if (e.target.id === "ed-cerca") { edCerca = e.target.value; const pos = e.target.selectionStart; aggiornaEditor(true); const c = $("#ed-cerca"); if (c) { c.focus(); try { c.setSelectionRange(pos, pos); } catch (err) { /* niente */ } } }
});
document.addEventListener("change", e => {
  if (e.target.dataset && e.target.dataset.ed && bozza) { bozza[e.target.dataset.ed][e.target.dataset.campo] = e.target.type === "checkbox" ? e.target.checked : e.target.value; aggiornaEditor(false); return; }
  if (e.target.dataset && e.target.dataset.reazTesto !== undefined) { Reazioni.testo(+e.target.dataset.reazTesto, e.target.value); return; }
  if (e.target.id === "prova-carta") { const c = PER_ID[e.target.value]; $("#prova-mossa").innerHTML = c.mosse.map((m, i) => `<option value="${i}">${esc(m.nome)} (${m.costo}◆)</option>`).join(""); }
  if (e.target.id === "nome-squadra") {
    const v = e.target.value.trim().slice(0, 22);
    squadraAttiva().nome = v || `Squadra ${S.attiva + 1}`;
    salva(); disegna();
  }
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !$("#modale").hidden && !$("#modale").dataset.bloccata) chiudiModale();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[role=button]")) { e.preventDefault(); e.target.click(); }
});
$("#modale-chiudi").addEventListener("click", chiudiModale);
window.addEventListener("hashchange", () => { if (!B && $("#accesso").hidden) vai(location.hash.slice(1)); });
window.addEventListener("resize", spostaIndicatore);

// ============================================================
//  AVVIO
// ============================================================
async function caricaStato() {
  const salvato = migra(await Archivio.carica());
  applicaSalvataggio(salvato);
  if (Archivio.modo === "cloud" && (!salvato || Archivio._localePiuNuovo)) salva();
  ascoltaAltriDispositivi();
}
// Se giochi da due dispositivi insieme: quando l'altro salva qualcosa di più recente, lo prendo
// subito (invece di sovrascriverlo più tardi con i miei dati vecchi).
function ascoltaAltriDispositivi() {
  Archivio.ascoltaMio((dati, slot) => {
    if (slot !== Archivio.slot || (dati.rev || 0) <= (S.rev || 0) || B || animazione || !$("#accesso").hidden) return;
    const eraAdmin = S.admin;
    applicaSalvataggio(migra(dati));
    S.admin = eraAdmin;
    if (eraAdmin) S.monete = Math.max(S.monete, 999999);
    applicaImpostazioni(); aggiornaTesta(); disegna();
    mostraAvviso("Ho caricato i progressi più recenti dall'altro dispositivo.");
  });
}
function applicaSalvataggio(salvato) {
  const n = statoNuovo();
  S = n;
  if (salvato) {
    S = Object.assign(n, salvato, {
      stats: Object.assign(n.stats, salvato.stats || {}),
      inventario: Object.assign({ benvenuto: 0, normale: 0, epica: 0, leggendaria: 0 }, salvato.inventario || {}),
      pass: Object.assign(n.pass, salvato.pass || {}),
      profilo: Object.assign(n.profilo, salvato.profilo || {}),
      impostazioni: Object.assign(n.impostazioni, salvato.impostazioni || {}),
      storia: { stelle: Object.assign({}, (salvato.storia || {}).stelle), scrigni: [...((salvato.storia || {}).scrigni || [])], visti: [...((salvato.storia || {}).visti || [])] },
      // chi giocava già prima che ci fosse il tutorial non se lo vede partire: riceve solo un avviso
      tutorial: Object.assign({}, salvato.tutorial || (salvato.stats && salvato.stats.bustine > 0 ? { fatto: true, nuovoPerTe: true } : { fatto: false })),
    });
    S.carte = Object.assign({}, S.carte || {});
    // nov 2026, rarità ribilanciate: chi aveva già fatto l'Ascesa di una carta cambiata tiene la rarità che si era pagato.
    // Se la carta adesso parte già da lì (o più in alto), l'Ascesa si azzera e le monete spese tornano indietro.
    if (!S.rarNov26) {
      const asc = Object.assign({}, S.asc || {});
      for (const [id, passi] of Object.entries(asc)) {
        const prima = RARITA_PRIMA_NOV26[id]; if (!prima || !PER_ID[id] || !passi) continue;
        const ora = PER_ID[id].rarita, iPrima = ORDINE_RARITA.indexOf(prima), eff = Math.min(3, iPrima + passi), iOra = ORDINE_RARITA.indexOf(ora);
        if (eff > iOra) asc[id] = eff - iOra;
        else { delete asc[id]; for (let k = iPrima; k < eff; k++) S.monete += ASCESA_MONETE[ORDINE_RARITA[k]] || 0; }
      }
      S.asc = asc; S.rarNov26 = true;
    }
    // recupero: una carta con un livello è stata trovata in una bustina, anche se la collezione non l'ha registrata
    for (const id of Object.keys(S.liv || {})) if (PER_ID[id] && !(S.carte[id] > 0)) S.carte[id] = 1;
    // l'avatar deve essere una carta che hai trovato (chi l'aveva scelto prima della regola lo riscegli dal profilo)
    if (S.profilo && S.profilo.avatar && !(S.carte[S.profilo.avatar] > 0)) S.profilo = Object.assign({}, S.profilo, { avatar: "" });
    S.pass.riscossi = [...new Set((S.pass.riscossi || []).map(Number))];
    S.pass.scelte = Object.assign({}, S.pass.scelte || {});
  }
  if (Archivio.modo !== "cloud" && Archivio.profiloLocale && !S.profilo.nome) {
    const p = Profili.leggi().lista.find(x => x.id === Archivio.profiloLocale);
    if (p) S.profilo = { nome: p.nome, avatar: p.avatar || "" };
  }
  // Prima dei livelli fino a 30 il livello dipendeva dalle copie (max 5): Lv5 vecchio ≈ Lv13 nuovo
  if (!salvato || !salvato.esp) {
    S.esp = {};
    for (const [id, q] of Object.entries(S.carte)) if (q > 0) S.esp[id] = xpPerArrivare(1 + (Math.min(5, q) - 1) * 3);
  }
  S.esp = Object.assign({}, S.esp || {});
  // Dai livelli con l'esperienza a quelli a mano: chi aveva già dei livelli se li tiene
  if (!salvato || !salvato.liv) {
    S.liv = {}; S.pot = {}; S.lodeXp = {};
    for (const [id, q] of Object.entries(S.carte)) if (q > 0) { const inf = infoLivello(S.esp[id] || 0); S.liv[id] = inf.liv; if (inf.liv >= LIVELLO_MAX) S.lodeXp[id] = inf.dentro; }
  }
  S.liv = Object.assign({}, S.liv || {}); S.pot = Object.assign({}, S.pot || {}); S.lodeXp = Object.assign({}, S.lodeXp || {});
  // il tipo Mente non c'è più: le sue bustine diventano bustine Difesa
  if (S.inventario && S.inventario["stile-MEN"]) { S.inventario["stile-DIF"] = (S.inventario["stile-DIF"] || 0) + S.inventario["stile-MEN"]; delete S.inventario["stile-MEN"]; }
  S.squadre = Array.from({ length: NUM_SQUADRE }, (_, i) => {
    const q = (S.squadre || [])[i] || { nome: `Squadra ${i + 1}`, carte: [] };
    // il graffito della squadra (prima del cambio era uno solo per tutte: lo do alla squadra attiva)
    const graffito = q.graffito || (i === (S.attiva || 0) && S.graffito ? S.graffito : null);
    return { nome: q.nome || `Squadra ${i + 1}`, carte: [...new Set(q.carte || [])].filter(id => PER_ID[id] && S.carte[id] > 0).slice(0, CARTE_SQUADRA), graffito };
  });
}

function configCambiata(cfg) {
  applicaConfigCarte(cfg);
  Scena3D.svuotaCache();
  if (!bozza || !modificheBozza()) bozza = null;
  if (!B && $("#accesso").hidden && $("#apertura").hidden) disegna();
}

// ---------- Accesso con nickname e password (versione pubblicata su Supabase) ----------
// La prima volta scegli nickname e password; poi il dispositivo resta collegato.
function schermataAccount() {
  return new Promise(risolvi => {
    let registra = true;
    const el = $("#accesso");
    el.hidden = false; document.body.classList.add("in-accesso");
    const disegnaForm = (msg) => {
      el.innerHTML = `<div class="accesso-sfondo" aria-hidden="true">${CARTE.slice(0, 12).map((c, i) => `<img src="${imgCarta(c.id)}" alt="" style="--i:${i}">`).join("")}</div>
      <div class="accesso-box">
        <h1 class="neon">Noiverso</h1>
        <h2>${registra ? "Crea il tuo account" : "Bentornato"}</h2>
        <div class="segmenti scelta-account" role="tablist">
          <button type="button" class="seg ${registra ? "sel" : ""}" data-account="registra" role="tab" aria-selected="${registra}">Sono nuovo</button>
          <button type="button" class="seg ${!registra ? "sel" : ""}" data-account="entra" role="tab" aria-selected="${!registra}">Ho già un account</button>
        </div>
        <form id="form-account" autocomplete="on">
          <label for="acc-nick" class="etichetta-campo">Nickname</label>
          <input id="acc-nick" name="username" autocomplete="username" maxlength="20" required placeholder="es. lollo" autocapitalize="none" spellcheck="false">
          <label for="acc-pass" class="etichetta-campo">Password</label>
          <input id="acc-pass" name="password" type="password" autocomplete="${registra ? "new-password" : "current-password"}" minlength="6" required placeholder="almeno 6 caratteri">
          ${msg ? `<p class="errore-form" role="alert">${esc(msg)}</p>` : ""}
          <button class="btn primario" data-fx="onda" type="submit">${registra ? "Crea account ed entra" : "Entra"}</button>
        </form>
        <p class="nota piccola">${registra ? "Il nickname lo vedranno gli altri in classifica. La password serve solo la prima volta su ogni dispositivo: poi resti collegato." : "Usa lo stesso nickname e la stessa password che hai scelto la prima volta."}</p>
      </div>`;
      const f = $("#form-account");
      f.onsubmit = async ev => {
        ev.preventDefault();
        const nick = $("#acc-nick").value.trim(), pass = $("#acc-pass").value, bt = f.querySelector("button[type=submit]");
        bt.disabled = true; bt.textContent = "Un attimo…";
        try {
          if (registra) await window.NoiversoAccesso.registra(nick, pass);
          else await window.NoiversoAccesso.entra(nick, pass);
          el.innerHTML = ""; risolvi();
        } catch (e) {
          const m = e.code === "credenziali" ? "Nickname o password sbagliati." : e.code === "rete" ? "Non riesco a collegarmi. Controlla la connessione e riprova." : (e.message || "Qualcosa è andato storto, riprova.");
          const n = nick; disegnaForm(m); $("#acc-nick").value = n; $("#acc-pass").focus();
        }
      };
      $$("[data-account]", el).forEach(b => b.onclick = () => { const n = $("#acc-nick").value; registra = b.dataset.account === "registra"; disegnaForm(); $("#acc-nick").value = n; });
    };
    disegnaForm();
    $("#caricamento").hidden = true;
  });
}

async function avvia() {
  if (window.NOIVERSO_SUPABASE && !(await window.NoiversoAccesso.sessione())) await schermataAccount();
  $("#caricamento").hidden = false;
  await Archivio.init();
  let cfg = await Archivio.ascoltaConfig(configCambiata);
  if (cfg === undefined) cfg = Archivio._cache !== undefined ? Archivio._cache : await Archivio.caricaConfig();
  applicaConfigCarte(cfg);
  await ImmaginiCarte.prepara(CARTE.map(c => c.id));   // link alle immagini private (solo dopo l'accesso)
  if (Archivio.modo === "cloud") await caricaStato();
  applicaImpostazioni();
  aggiornaSalvataggio();
  $("#caricamento").hidden = true;
  mostraAccesso();
}

avvia();

// ============================================================
//  AGGIORNAMENTI AUTOMATICI
//  Una pagina aperta prima di un aggiornamento continua a usare il codice vecchio
//  (per esempio senza le carte nuove). Il gioco controlla da solo se è uscita una versione
//  nuova: se non stai combattendo si ricarica subito, altrimenti appena finisci la battaglia.
// ============================================================
const VERSIONE = (() => { const el = document.querySelector('script[src*="app."]'); const m = el && el.getAttribute("src").match(/app\.([0-9a-f]+)\.js/); return m ? m[1] : "sviluppo"; })();
let versioneNuova = null;
async function controllaAggiornamento() {
  if (VERSIONE === "sviluppo" || !window.fetch) return null;
  controllaAggiornamento.ultimo = Date.now();
  try {
    const r = await fetch(location.href.split("#")[0], { cache: "no-store", credentials: "same-origin" });
    if (!r.ok) return null;
    const m = (await r.text()).match(/app\.([0-9a-f]{6,})\.js/);
    if (m && m[1] !== VERSIONE) { versioneNuova = m[1]; applicaAggiornamento(); }
    return m ? m[1] : null;
  } catch (e) { return null; }
}
function occupato() { return !!B || !$("#apertura").hidden || ($("#modale") && !$("#modale").hidden && $("#modale").dataset.bloccata === "1"); }
async function applicaAggiornamento() {
  if (!versioneNuova) return;
  if (occupato()) { mostraBannerAggiornamento(); return; }
  // una sola ricarica automatica per versione: se il browser servisse ancora la pagina vecchia, resta il bottone
  let gia = false; try { gia = sessionStorage.getItem("ln-ricarica") === versioneNuova; sessionStorage.setItem("ln-ricarica", versioneNuova); } catch (e) {}
  if (gia) { mostraBannerAggiornamento(true); return; }
  mostraAvviso("È uscita una nuova versione: aggiorno il gioco…");
  try { await Archivio.aspettaScritture(); } catch (e) {}
  setTimeout(() => location.reload(), 900);
}
function mostraBannerAggiornamento(bloccato) {
  if ($("#banner-agg")) return;
  const el = document.createElement("div");
  el.id = "banner-agg"; el.className = "banner-agg"; el.setAttribute("role", "status");
  el.innerHTML = bloccato
    ? `<span>C'è una versione nuova del gioco ma il browser mostra ancora quella vecchia. Premi <b>Ctrl+Shift+R</b> (o chiudi e riapri la pagina).</span><button class="btn piccolo" data-azione="ricarica">Riprova</button>`
    : `<span>È uscita una nuova versione del gioco: si aggiorna da sola a fine battaglia.</span><button class="btn piccolo primario" data-azione="ricarica">Aggiorna ora</button>`;
  document.body.appendChild(el);
}
setTimeout(controllaAggiornamento, 4000);
setInterval(controllaAggiornamento, 120000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") controllaAggiornamento(); });
window.addEventListener("focus", () => controllaAggiornamento());
