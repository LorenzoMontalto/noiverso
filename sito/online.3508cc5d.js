// ============================================================
//  ONLINE: chi è connesso adesso e sfide dal vivo tra amici
//
//  Presenza: un canale in tempo reale di Supabase dove ognuno dice "ci sono" (pallino verde).
//  Sfida dal vivo: i due telefoni calcolano LA STESSA battaglia (stesso seme per i numeri casuali,
//  stesse squadre, stesse mosse). Chi ha sfidato è il lato 0 della battaglia "vera"; chi ha accettato
//  la vede a specchio (BattagliaSpecchio), così per tutti e due la propria squadra è in basso a sinistra.
//  Ogni turno ci si scambiano le mosse; dopo ogni turno ci si scambia anche una "firma" dello stato:
//  se non coincide, qualcuno ha modificato il gioco e la partita viene annullata.
//  I messaggi hanno una conferma di ricezione: finché non arriva, vengono rimandati.
// ============================================================

// numeri casuali ripetibili: stesso seme → stessa sequenza su tutti e due i telefoni
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// La battaglia vista dall'altra parte: il lato 0 diventa il lato 1 e viceversa
const CAMPI_LATO = ["lato", "colpo", "su", "cura", "entra", "ko", "bersaglio"];
function specchiaEventi(ev) {
  return (ev || []).map(e => {
    const x = Object.assign({}, e);
    for (const k of CAMPI_LATO) if (typeof x[k] === "number") x[k] = 1 - x[k];
    if (e.foto) x.foto = { pv: [e.foto.pv[1], e.foto.pv[0]], en: [e.foto.en[1], e.foto.en[0]], att: [e.foto.att[1], e.foto.att[0]] };
    if (e.fine) x.testo = e.testo === "Hai vinto!" ? "Hai perso." : e.testo === "Hai perso." ? "Hai vinto!" : e.testo;
    return x;
  });
}
class BattagliaSpecchio {
  constructor(c) { this.c = c; }
  get lati() { return [this.c.lati[1], this.c.lati[0]]; }
  get turno() { return this.c.turno; }
  get vincitore() { const v = this.c.vincitore; return v < 0 ? v : 1 - v; }
  set vincitore(v) { this.c.vincitore = v < 0 ? v : 1 - v; }
  get graffitiAnnullati() { const g = this.c.graffitiAnnullati; return g ? [g[1], g[0]] : null; }
  get oggettiTurno() { const o = this.c.oggettiTurno || []; return [o[1], o[0]]; }
  get ev() { return specchiaEventi(this.c.ev); }
  attivo(l) { return this.c.attivo(1 - l); }
  chiPrimo() { const p = this.c.chiPrimo(); return p < 0 ? p : 1 - p; }
  vivi(l) { return this.c.vivi(1 - l); }
  serveSostituzione(l) { return this.c.serveSostituzione(1 - l); }
  puoUsare(l, i) { return this.c.puoUsare(1 - l, i); }
  gv(l, id) { return this.c.gv(1 - l, id); }
  calcolaDanno(l, a, d, m, cas) { return this.c.calcolaDanno(1 - l, a, d, m, cas); }
  attaccoEffettivo(l, x) { return this.c.attaccoEffettivo(1 - l, x); }
  _valuta(l, a, d, m) { return this.c._valuta(1 - l, a, d, m); }
  impostaGraffiti(g0, g1) { this.c.impostaGraffiti(g1, g0); }
  get campo() { return this.c.campo; }
  impostaCampo(id) { return this.c.impostaCampo(id); }
  risolviTurno(az0, az1) { return specchiaEventi(this.c.risolviTurno(az1, az0)); }
  sostituisci(l, i) { return specchiaEventi(this.c.sostituisci(1 - l, i)); }
  usaOggetto(l, id, nome) { const r = this.c.usaOggetto(1 - l, id, nome); return Object.assign({}, r, { ev: specchiaEventi(r.ev) }); }
}

const Online = (() => {
  const TEMPO_TURNO = 45, TEMPO_RIENTRO = 90, TEMPO_INVITO = 30;   // nov 2026: 90 s per rientrare (era 60)
  let canale = null, presenti = {}, attivo = false;
  let invitoFuori = null, invitoDentro = null;
  const risposte = {};   // inviti a cui ho già risposto: se l'invito arriva di nuovo, rimando la stessa risposta
  let P = null;   // la partita in corso
  const sb = () => window.NoiversoAccesso && window.NoiversoAccesso.sb;
  const io = () => Archivio.uid;
  const mioNome = () => (S.profilo.nome || "Giocatore").slice(0, 22);

  // ---------------- presenza ----------------
  function avvia() {
    if (attivo || !socialeAttivo() || S.admin || !sb()) return;
    attivo = true;
    canale = sb().channel("noiverso-online", { config: { presence: { key: io() }, broadcast: { self: false } } });
    canale
      .on("presence", { event: "sync" }, () => { leggiPresenti(); })
      .on("presence", { event: "join" }, () => { leggiPresenti(); })
      .on("presence", { event: "leave" }, () => { leggiPresenti(); })
      .on("broadcast", { event: "invito" }, ({ payload }) => { if (payload && payload.a === io()) riceviInvito(payload); })
      .on("broadcast", { event: "risposta" }, ({ payload }) => { if (payload && payload.a === io()) rispostaInvito(payload); })
      .on("broadcast", { event: "annulla" }, ({ payload }) => { if (payload && payload.a === io() && invitoDentro && invitoDentro.id === payload.id) { invitoDentro = null; chiudiModale(); mostraAvviso(`${payload.nome} ha annullato la sfida.`); } })
      .subscribe(stato => { if (stato === "SUBSCRIBED") annuncia(); });
    addEventListener("beforeunload", () => { try { canale && canale.untrack(); } catch (e) {} });
  }
  function riavvia() {
    const vecchio = canale; canale = null; attivo = false; presenti = {};
    try { if (vecchio) sb().removeChannel(vecchio); } catch (e) {}
    avvia();
  }
  let timerNascosto = null;
  setInterval(() => {
    if (!attivo) { if (typeof S !== "undefined" && S && socialeAttivo() && !S.admin && sb()) avvia(); return; }
    // canale caduto (rete persa, telefono in sottofondo a lungo): mi ricollego
    if (canale && canale.state && !["joined", "joining"].includes(canale.state)) { riavvia(); return; }
    annuncia();   // ogni tanto mi rifaccio vedere, così chi è appena arrivato mi trova
  }, 20000);
  document.addEventListener("visibilitychange", () => {
    if (!attivo || !canale) return;
    clearTimeout(timerNascosto);
    if (document.visibilityState === "visible") {
      if (canale.state && !["joined", "joining"].includes(canale.state)) riavvia(); else annuncia();
      if (P && P.ch && !["joined", "joining"].includes(P.ch.state)) { P.perso = P.perso || Date.now() - 3000; ricollega(); }
    } else if (!P && !D && !G) {
      // app in sottofondo da più di 2 minuti: non risulto più online (torno appena riapri)
      timerNascosto = setTimeout(() => { try { canale && canale.untrack(); } catch (e) {} }, 120000);
    }
  });
  function annuncia() {
    if (!canale) return;
    try { canale.track({ nome: mioNome(), avatar: S.profilo.avatar || "", stato: P || D ? "in-battaglia" : G ? "spettatore" : "libero",
      partita: P && P.iniziata && !P.finita ? P.id : D && !D.finita ? D.id : null, contro: P ? P.avv.nome : D ? D.dati.nomeB : null, t: Date.now() }); } catch (e) {}
  }
  function leggiPresenti() {
    const st = canale ? canale.presenceState() : {}, nuovi = {};
    for (const [k, lista] of Object.entries(st || {})) { const x = (lista || [])[lista.length - 1]; if (x && k !== io()) nuovi[k] = { nome: x.nome, avatar: x.avatar, stato: x.stato, partita: x.partita, contro: x.contro }; }
    presenti = nuovi;
    if (!B) {
      if (vista === "classifica") disegna();
      const box = $("#amici-online"); if (box) box.outerHTML = htmlAmici();
      const st = $("#amici-strada"); if (st) st.outerHTML = htmlStrada();
    }
  }
  // Riquadro "Amici online" nella Strada (a destra sui computer, in alto sul telefono)
  function htmlStrada() {
    if (!socialeAttivo() || S.admin) return "";
    const lista = Object.entries(presenti).sort((a, b) => (a[1].stato === "libero" ? 0 : 1) - (b[1].stato === "libero" ? 0 : 1));
    return `<aside class="amici-strada" id="amici-strada" aria-label="Amici online">
      <div class="online-testa"><b><span class="pallino-online"></span> Amici online</b><span class="badge-online">${lista.length}</span></div>
      ${!attivo ? `<p class="nota">Mi collego…</p>` : lista.length ? `<ul>${lista.map(([id, x]) => `<li>
        ${htmlAvatar(String(x.avatar || ""), "mini")}
        <span class="amico-info"><b>${esc(String(x.nome || "Giocatore"))}</b><small>${x.stato === "libero" ? "Online" : x.stato === "spettatore" ? "Guarda una sfida" : `Contro ${esc(String(x.contro || "un amico"))}`}</small></span>
        ${x.stato === "in-battaglia" && x.partita ? `<button class="btn piccolo" data-guarda="${esc(String(x.partita))}" aria-label="Guarda">👀</button>`
          : x.stato === "libero" ? `<button class="btn primario piccolo" data-sfida-vivo="${esc(id)}">Sfida</button>` : ""}</li>`).join("")}</ul>`
        : `<p class="nota">Nessuno online adesso. Quando un amico apre il gioco compare qui.</p>`}
    </aside>`;
  }
  const eOnline = id => !!presenti[id];
  // nov 2026: se un amico sta giocando (dal vivo o contro il computer) la sua partita si può guardare anche dalla classifica
  const partitaDi = id => { const x = presenti[id]; return x && x.stato === "in-battaglia" && x.partita ? { partita: String(x.partita), contro: String(x.contro || "") } : null; };
  const quantiOnline = () => Object.keys(presenti).length;

  function htmlAmici() {
    if (!socialeAttivo() || S.admin) return "";
    const lista = Object.entries(presenti).sort((a, b) => (a[1].stato === "libero" ? 0 : 1) - (b[1].stato === "libero" ? 0 : 1));
    return `<div class="amici-online" id="amici-online">
      <div class="online-testa"><b><span class="pallino-online"></span> Amici online</b><span class="nota">${lista.length ? `${lista.length} ${lista.length === 1 ? "connesso" : "connessi"} adesso` : "Nessuno connesso in questo momento"}</span></div>
      ${lista.length ? `<ul class="amici-lista">${lista.map(([id, x]) => `<li>
        ${htmlAvatar(String(x.avatar || ""), "mini")}
        <div class="amico-info"><b>${esc(String(x.nome || "Giocatore"))}</b><small>${x.stato === "libero" ? "Online" : x.stato === "spettatore" ? "Sta guardando una sfida" : `Sta giocando contro ${esc(String(x.contro || "un amico"))}`}</small></div>
        ${x.stato === "in-battaglia" && x.partita ? `<button class="btn piccolo" data-fx="spinta" data-guarda="${esc(String(x.partita))}">👀 Guarda</button>`
          : `<button class="btn primario piccolo" data-fx="spinta" data-sfida-vivo="${esc(id)}" ${x.stato === "libero" ? "" : "disabled"}>Sfida dal vivo</button>`}</li>`).join("")}</ul>`
        : `<p class="nota">Quando un amico apre il gioco compare qui: potrete sfidarvi dal vivo, mossa contro mossa.</p>`}
    </div>`;
  }

  // ---------------- inviti ----------------
  function mieCarte() { return squadraAttiva().carte.slice(0, CARTE_SQUADRA); }
  function sfida(id) {
    if (!attivo || !presenti[id]) { mostraAvviso("Questo amico non è più online."); return; }
    if (B || P) return;
    if (mieCarte().length < CARTE_SQUADRA) { mostraAvviso("Prima prepara una squadra completa."); vai("squadra"); return; }
    const inv = { id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()), da: io(), a: id, nome: mioNome(), avatar: S.profilo.avatar || "", seme: Math.floor(Math.random() * 2 ** 31), scade: Date.now() + TEMPO_INVITO * 1000 };
    invitoFuori = { ...inv, nomeAvv: presenti[id].nome };
    canale.send({ type: "broadcast", event: "invito", payload: inv });
    let giri = 0;
    const aggiorna = () => {
      if (!invitoFuori || invitoFuori.id !== inv.id) return;
      const s = Math.max(0, Math.ceil((inv.scade - Date.now()) / 1000));
      if (s <= 0) { annullaInvito(true); return; }
      if (++giri % 4 === 0) try { canale.send({ type: "broadcast", event: "invito", payload: inv }); } catch (e) {}   // nel caso si sia perso per strada
      const el = $("#invito-secondi"); if (el) el.textContent = s; else return;
      setTimeout(aggiorna, 500);
    };
    apriModale(`<div class="invito-vivo"><span class="codice-tag">Sfida dal vivo</span><h2>Aspetto ${esc(invitoFuori.nomeAvv)}…</h2>
      <div class="invito-anello"><b id="invito-secondi">${TEMPO_INVITO}</b><small>secondi</small></div>
      <p class="nota">Gli è arrivata la tua sfida. Appena accetta, si parte.</p>
      <div class="azioni centro"><button class="btn" data-azione="annulla-invito">Annulla</button></div></div>`, { bloccata: true });
    setTimeout(aggiorna, 500);
  }
  function annullaInvito(scaduto) {
    if (!invitoFuori) return;
    try { canale.send({ type: "broadcast", event: "annulla", payload: { id: invitoFuori.id, a: invitoFuori.a, nome: mioNome() } }); } catch (e) {}
    const n = invitoFuori.nomeAvv; invitoFuori = null; chiudiModale();
    if (scaduto) mostraAvviso(`${n} non ha risposto.`);
  }
  function riceviInvito(p) {
    if (risposte[p.id]) { try { canale.send({ type: "broadcast", event: "risposta", payload: risposte[p.id] }); } catch (e) {} return; }
    if (invitoDentro && invitoDentro.id === p.id) return;
    if (p.scade < Date.now()) return;
    const occupato = B || P || Tutorial.attivo || invitoDentro || invitoFuori || (!$("#apertura").hidden);
    if (occupato) { risposte[p.id] = { id: p.id, a: p.da, ok: false, motivo: "occupato", nome: mioNome() }; canale.send({ type: "broadcast", event: "risposta", payload: risposte[p.id] }); return; }
    invitoDentro = p;
    const aggiorna = () => {
      if (!invitoDentro || invitoDentro.id !== p.id) return;
      const s = Math.max(0, Math.ceil((p.scade - Date.now()) / 1000));
      if (s <= 0) { invitoDentro = null; chiudiModale(); return; }
      const el = $("#invito-secondi"); if (el) el.textContent = s; else return;
      setTimeout(aggiorna, 500);
    };
    apriModale(`<div class="invito-vivo arrivo"><span class="codice-tag">Sfida dal vivo</span>
      ${htmlAvatar(String(p.avatar || ""), "grande")}
      <h2>${esc(p.nome)} ti sfida!</h2>
      <p class="nota">Mossa contro mossa, in tempo reale. Quando accetti scegli con quale squadra giocare${Graffiti.scelto() ? ` (graffito «${esc(Graffiti.info(Graffiti.scelto()).nome)}»)` : ""}.</p>
      <div class="invito-anello piccolo"><b id="invito-secondi">${Math.ceil((p.scade - Date.now()) / 1000)}</b><small>secondi</small></div>
      <div class="azioni centro"><button class="btn primario" data-fx="onda" data-azione="accetta-invito">Accetta</button><button class="btn" data-azione="rifiuta-invito">Rifiuta</button></div></div>`, { bloccata: true });
    setTimeout(aggiorna, 500);
    if (navigator.vibrate) try { navigator.vibrate([120, 60, 120]); } catch (e) {}
  }
  // se dalla scelta della squadra vai a modificarle, l'invito si rifiuta (l'amico non resta ad aspettare)
  function rifiutaSeInvito() { if (invitoDentro) rispondi(false); }
  function rispondi(ok) {
    const p = invitoDentro; if (!p) return;
    invitoDentro = null; chiudiModale();
    if (ok && mieCarte().length < CARTE_SQUADRA) { ok = false; mostraAvviso("Ti serve una squadra completa per accettare."); }
    risposte[p.id] = { id: p.id, a: p.da, ok, nome: mioNome(), motivo: ok ? "" : "rifiuta" };
    canale.send({ type: "broadcast", event: "risposta", payload: risposte[p.id] });
    if (ok) entraPartita({ id: p.id, seme: p.seme, avv: { id: p.da, nome: p.nome, avatar: p.avatar }, host: false });
  }
  function rispostaInvito(r) {
    if (!invitoFuori || invitoFuori.id !== r.id) return;
    const inv = invitoFuori; invitoFuori = null; chiudiModale();
    if (!r.ok) { mostraAvviso(r.motivo === "occupato" ? `${r.nome} è occupato in questo momento.` : `${r.nome} ha rifiutato la sfida.`); return; }
    entraPartita({ id: inv.id, seme: inv.seme, avv: { id: inv.a, nome: inv.nomeAvv, avatar: presenti[inv.a] ? presenti[inv.a].avatar : "" }, host: true });
  }

  // il canale della partita: lo apro all'inizio e lo riapro se cade (rete persa, telefono in sottofondo)
  function apriCanale() {
    const ch = sb().channel(`noiverso-vivo-${P.id}`, { config: { presence: { key: io() }, broadcast: { self: false } } });
    P.ch = ch;
    ch.on("broadcast", { event: "m" }, ({ payload }) => ricevi(payload))
      .on("broadcast", { event: "r" }, ({ payload }) => { if (!P || !payload) return; if (payload.spett) Reazioni.riceviSpettatore(payload.r, payload.nome, payload.da); else if (payload.da === P.avv.id) Reazioni.ricevi(payload.r); })
      .on("broadcast", { event: "spett" }, ({ payload }) => {
        // chi ha sfidato racconta la partita agli spettatori: dati di partenza + tutte le mosse fatte finora
        if (!P || !P.host || !P.spett || !payload || payload.tipo !== "ciao") return;
        try { ch.send({ type: "broadcast", event: "spett", payload: { tipo: "stato", per: payload.da, dati: P.spett, log: P.log } }); } catch (e) {}
      })
      .on("presence", { event: "sync" }, () => controllaAvversario())
      .on("presence", { event: "join" }, () => controllaAvversario())
      .on("presence", { event: "leave" }, () => controllaAvversario())
      .subscribe(async stato => {
        if (stato !== "SUBSCRIBED" || !P || P.ch !== ch) return;
        try { ch.track({ t: Date.now() }); } catch (e) {}
        if (P.prontoMio) return;
        P.prontoMio = true; P.salvando = true;
        // le squadre si leggono dal server (così nessuno può presentarsi con carte "ritoccate"):
        // prima mi assicuro che il mio ultimo salvataggio sia arrivato
        await salvaEAttendi();
        if (!P || P.ch !== ch) return;
        P.salvando = false;
        manda({ tipo: "pronto", nome: mioNome(), avatar: S.profilo.avatar || "" });
        provaInizio();
      });
  }
  function ricollega() {
    if (!P || P.finita || !P.ch) return;
    const stato = P.ch.state;
    if (["joined", "joining"].includes(stato)) { P.perso = 0; return; }
    if (!P.perso) { P.perso = Date.now(); aggiornaBanner(); return; }
    if (Date.now() - P.perso < 3000) return;   // a volte torna da solo in un attimo
    if (P.ricollego) return;
    const p = P, vecchio = P.ch; P.perso = Date.now(); P.ricollego = true;
    try { if (sb().realtime && !sb().realtime.isConnected()) sb().realtime.connect(); } catch (e) {}
    // prima tolgo il canale vecchio (supabase ridarebbe lo stesso), poi lo riapro con lo stesso nome:
    // l'avversario mi ritrova e i messaggi non ancora confermati si rimandano da soli
    const togli = Promise.resolve().then(() => sb().removeChannel(vecchio)).catch(() => {});
    Promise.race([togli, new Promise(r => setTimeout(r, 1500))]).then(() => {
      try { const rt = sb().realtime; if (rt && Array.isArray(rt.channels) && rt.channels.includes(vecchio)) rt.channels = rt.channels.filter(c => c !== vecchio); } catch (e) {}
      p.ricollego = false;
      if (P === p && !p.finita) apriCanale();
    });
  }

  // ---------------- la partita: messaggi con conferma ----------------
  function entraPartita(dati) {
    P = Object.assign(dati, { ch: null, mie: {}, loro: {}, mieOgg: {}, risolti: {}, firmeMie: {}, firmeLoro: {}, visti: new Set(), inAttesa: {}, prontoLoro: null, prontoMio: null,
      sostLoro: [], scadenza: 0, rientro: 0, finita: false, motivo: "", avvPresente: false, iniziata: false, seq: 0 });
    annuncia();
    apriModale(`<div class="invito-vivo"><span class="codice-tag">Sfida dal vivo</span><h2>Mi collego con ${esc(P.avv.nome)}…</h2><p class="nota">Un attimo: ci scambiamo le squadre.</p></div>`, { bloccata: true });
    apriCanale();
    const p = P;
    P.timerRete = setInterval(() => rimanda(p), 1500);
    P.timerOrologio = setInterval(orologio, 500);
    // se entro 20 secondi non riusciamo a parlarci, si lascia perdere
    setTimeout(() => { if (P && !P.iniziata && !P.finita) { mostraAvviso("Non riesco a collegarmi con il tuo amico. Riprovate tra poco."); esci(); chiudiModale(); } }, 20000);
  }
  function manda(msg) {
    if (!P) return;
    const k = `${io()}:${++P.seq}`;
    const m = Object.assign({ k, da: io() }, msg);
    P.inAttesa[k] = m;
    try { P.ch.send({ type: "broadcast", event: "m", payload: m }); } catch (e) {}
  }
  function rimanda(p) { for (const m of Object.values(p.inAttesa)) try { p.ch.send({ type: "broadcast", event: "m", payload: m }); } catch (e) {} }
  function ricevi(m) {
    if (!P || !m || m.da !== P.avv.id) return;
    if (m.tipo === "ack") { delete P.inAttesa[m.rif]; return; }
    try { P.ch.send({ type: "broadcast", event: "m", payload: { tipo: "ack", rif: m.k, da: io() } }); } catch (e) {}
    if (P.visti.has(m.k)) return;
    P.visti.add(m.k);
    if (m.tipo === "pronto") { P.prontoLoro = m; provaInizio(); }
    else if (m.tipo === "azione") { P.loro[m.t] = m; provaRisolvi(); }
    else if (m.tipo === "sost") { P.sostLoro.push(m); provaSost(); }
    else if (m.tipo === "firma") { P.firmeLoro[m.t] = m.h; controllaFirme(); }
    else if (m.tipo === "resa") { if (B && B.vincitore < 0) { B.vincitore = 0; P.motivo = "resa"; aggiungiRegistro({ testo: `${P.avv.nome} si è arreso.`, avviso: true }); chiudiSfida(); } }
    else if (m.tipo === "esci") { P.avvUscito = true; }
  }
  function controllaAvversario() {
    if (!P || !P.ch) return;
    const st = P.ch.presenceState() || {}, c = !!st[P.avv.id];
    P.spettatori = Object.keys(st).filter(k => k.startsWith("spett:")).length;
    if (c && !P.avvPresente && P.rientro) aggiungiRegistro({ testo: `${P.avv.nome} è di nuovo connesso.`, avviso: true });
    P.avvPresente = c;
    P.rientro = c ? 0 : (P.rientro || (P.iniziata && !P.finita ? Date.now() + TEMPO_RIENTRO * 1000 : 0));
    aggiornaBanner();
  }

  async function salvaEAttendi() {
    salva();
    for (let i = 0; i < 40 && (Archivio._inScrittura || Object.keys(Archivio._coda || {}).length); i++) await new Promise(r => setTimeout(r, 200));
  }
  // ---------------- inizio, turni, sostituzioni ----------------
  async function provaInizio() {
    if (!P || P.iniziata || P.caricando || !P.prontoLoro || P.prontoMio !== true || P.salvando) return;
    P.caricando = true;
    const avv = P.prontoLoro;
    P.avv.nome = avv.nome || P.avv.nome; P.avv.avatar = avv.avatar || P.avv.avatar;
    // tutti e due leggono dal server le due squadre (quella di chi ha sfidato e quella di chi ha accettato)
    let mia, sua;
    try { [mia, sua] = await Promise.all([rpcSociale("squadra_amico", { amico: io() }), rpcSociale("squadra_amico", { amico: P.avv.id })]); }
    catch (e) { P.caricando = false; mostraAvviso("Non riesco a leggere le squadre: " + e.message); esci(); chiudiModale(); return; }
    if (!P) return;
    const pulisci = q => ((q && q.squadra) || []).filter(x => PER_ID[x.id]).slice(0, CARTE_SQUADRA);
    const sqMia = pulisci(mia), sqSua = pulisci(sua);
    if (sqMia.length < CARTE_SQUADRA || sqSua.length < CARTE_SQUADRA) { mostraAvviso("Una delle due squadre non è completa: la sfida non può partire."); esci(); chiudiModale(); return; }
    const g = x => x && x.graffito && GRAFFITI_COPPIE[x.graffito.id] ? x.graffito : null;
    P.iniziata = true;
    P.log = [];
    // per gli spettatori (orientamento "vero": chi ha sfidato è il lato 0)
    const [sqA, sqB, gA, gB] = P.host ? [sqMia, sqSua, g(mia), g(sua)] : [sqSua, sqMia, g(sua), g(mia)];
    if (P.host) P.spett = { seme: P.seme, sqA, sqB, gA, gB, nomeA: mioNome(), nomeB: P.avv.nome, idA: io(), idB: P.avv.id };
    annuncia();
    chiudiModale();
    schermoIntero(true);
    setTimeout(() => avviaSfida({ id: "vivo", nome: P.avv.nome, abilita: 0, liv: [1, 30], premio: 0, punti: 0, xp: 0,
      vivo: { id: P.id, host: P.host, mia: sqMia, sua: sqSua, graffitoMio: g(mia) }, graffitoNemico: g(sua) },
      sqMia.map(x => x.id), sqSua).then(() => { nuovoTurno(); }), ridotto ? 0 : 200);
  }
  // chiamata da avviaSfida: crea la battaglia "vera" (chi ha sfidato = lato 0) e, per chi ha accettato, la vista a specchio
  function creaBattaglia(mia, nemici) {
    const rng = mulberry32(P.seme);
    if (P.host) { P.canon = new Battaglia(mia, nemici, mioNome(), P.avv.nome, rng); return P.canon; }
    P.canon = new Battaglia(nemici, mia, P.avv.nome, mioNome(), rng);
    return new BattagliaSpecchio(P.canon);
  }
  const firma = () => { const c = P.canon; return JSON.stringify([c.turno, c.vincitore, c.lati.map(L => [L.energia, L.attivo, L.squadra.map(x => x.pv)])]); };
  function nuovoTurno() {
    if (!P || !B || B.vincitore >= 0) return;
    P.scadenza = Date.now() + TEMPO_TURNO * 1000;
    aggiornaBattaglia();
  }
  const turno = () => B ? B.turno : 0;
  // la mia mossa (dal pannello): la mando e aspetto la sua
  function scegli(az) {
    if (!P || !B || animazione || B.vincitore >= 0) return;
    const t = turno();
    if (P.mie[t] || B.serveSostituzione(0) || B.serveSostituzione(1)) return;
    P.mie[t] = { az, ogg: P.mieOgg[t] || [] };
    manda({ tipo: "azione", t, az, ogg: P.mie[t].ogg });
    aggiornaBattaglia();
    provaRisolvi();
  }
  // oggetto dello zaino usato in questo turno: va con la mia mossa (l'altro lo applica prima di risolvere)
  function oggettoUsato(id) { if (!P) return; const t = turno(); (P.mieOgg[t] = P.mieOgg[t] || []).push(id); logga({ o: "ogg", l: 0, id }); }
  function logga(e) {
    if (!P || !P.host || !P.spett) return;
    P.log.push(e);
    try { P.ch.send({ type: "broadcast", event: "spett", payload: { tipo: "passo", n: P.log.length - 1, e } }); } catch (x) {}
  }
  async function provaRisolvi() {
    if (!P || !B || animazione || B.vincitore >= 0) return;
    const t = turno();
    if (P.risolti[t] || !P.mie[t] || !P.loro[t] || B.serveSostituzione(0) || B.serveSostituzione(1)) return;
    P.risolti[t] = true;
    P.scadenza = 0;
    // prima gli oggetti che l'avversario ha usato in questo turno
    let ev = [];
    for (const id of (P.loro[t].ogg || []).slice(0, 1)) {   // al massimo uno per turno e tre a partita, come per tutti
      if ((P.oggLoro = P.oggLoro || 0) >= Zaino.POSTI || !Zaino.info(id).nome) continue;
      const r = B.usaOggetto(1, id, Zaino.info(id).nome); if (r.ok) { P.oggLoro++; ev = ev.concat(r.ev); logga({ o: "ogg", l: 1, id }); }
    }
    ev = ev.concat(B.risolviTurno(P.mie[t].az, P.loro[t].az));
    logga({ o: "turno", a: P.mie[t].az, b: P.loro[t].az });
    P.firmeMie[t] = firma();
    manda({ tipo: "firma", t, h: P.firmeMie[t] });
    await riproduci(ev);
    controllaFirme();
    if (!P) return;
    if (B.vincitore >= 0) { chiudiSfida(); return; }
    provaSost();
    nuovoTurno();
  }
  // KO: chi deve sostituire sceglie; l'altro aspetta
  async function sostituisci(i) {
    if (!P || !B || animazione || !B.serveSostituzione(0)) return;
    manda({ tipo: "sost", t: turno(), i });
    const evS = B.sostituisci(0, i); logga({ o: "sost", l: 0, i });
    await riproduci(evS);
    provaRisolvi(); nuovoTurno();
  }
  async function provaSost() {
    if (!P || !B || animazione) return;
    while (P.sostLoro.length && B.serveSostituzione(1)) {
      const m = P.sostLoro.shift();
      const evS = B.sostituisci(1, m.i); logga({ o: "sost", l: 1, i: m.i });
      await riproduci(evS);
    }
    provaRisolvi();
    aggiornaBattaglia();
  }
  function controllaFirme() {
    if (!P || P.finita) return;
    for (const t of Object.keys(P.firmeLoro)) if (P.firmeMie[t] && P.firmeMie[t] !== P.firmeLoro[t]) {
      P.finita = true; P.motivo = "contestata";
      apriModale(`<div class="conferma"><h2>Partita annullata</h2><p>I due telefoni non sono d'accordo su come è andato il turno ${t}: di solito vuol dire che uno dei due ha una versione diversa (o modificata) del gioco. Ricaricate la pagina e riprovate.</p><div class="azioni centro"><button class="btn primario" data-azione="esci-vivo">Ok</button></div></div>`, { bloccata: true });
      registra(null, "contestata");
      return;
    }
  }

  // ---------------- orologio: tempo per scegliere e per rientrare ----------------
  function orologio() {
    if (!P || !B || P.finita) return;
    ricollega();
    // se un messaggio è arrivato mentre partiva un'animazione, lo applico adesso
    if (!animazione && B.vincitore < 0) { if (P.sostLoro.length) provaSost(); else provaRisolvi(); }
    if (P.rientro && Date.now() > P.rientro && B.vincitore < 0) {   // l'avversario non è tornato: vinci tu
      P.motivo = "abbandono"; B.vincitore = 0;
      aggiungiRegistro({ testo: `${P.avv.nome} non è tornato in tempo: vinci per abbandono.`, avviso: true });
      if (!animazione) chiudiSfida();
      return;
    }
    // connesso ma fermo (telefono bloccato, scheda in secondo piano): dopo un minuto oltre il suo tempo, vinci tu
    if (!animazione && B.vincitore < 0 && P.attesaDa && Date.now() - P.attesaDa > (TEMPO_TURNO + TEMPO_RIENTRO) * 1000) {
      P.motivo = "abbandono"; B.vincitore = 0;
      aggiungiRegistro({ testo: `${P.avv.nome} non risponde più: vinci per abbandono.`, avviso: true });
      chiudiSfida();
      return;
    }
    if (P.scadenza && !animazione && B.vincitore < 0 && Date.now() > P.scadenza) {
      P.scadenza = 0;
      if (B.serveSostituzione(0)) { const i = B.lati[0].squadra.findIndex(x => x.pv > 0); if (i >= 0) sostituisci(i); }
      // tempo scaduto: parte da sola la mossa base (quella da 0 energia), così la partita non si ferma
      else if (!P.mie[turno()]) { const a = B.attivo(0), i = Math.max(0, a.c.mosse.findIndex(m => m.costo === 0)); mostraAvviso(`Tempo scaduto: parte ${a.c.mosse[i].nome}.`); scegli({ tipo: "mossa", i }); }
    }
    segnaAttesa();
    aggiornaBanner();
  }
  // barra che si svuota durante il tuo turno (verde, poi rossa negli ultimi 10 secondi)
  function barraTempo() {
    const resto = P.scadenza ? Math.max(0, (P.scadenza - Date.now()) / 1000) : 0;
    return `<span class="vivo-tempo ${resto <= 10 ? "poco" : ""}"><i style="width:${(resto / TEMPO_TURNO * 100).toFixed(1)}%"></i></span>`;
  }
  function testoBanner() {
    if (!P || !B || B.vincitore >= 0) return "";
    if (P.perso) return `<b class="vivo-allarme">Connessione persa</b> · mi ricollego… (la partita ti aspetta)`;
    if (P.rientro) return `<b class="vivo-allarme">${esc(P.avv.nome)} si è disconnesso</b> · ha ${Math.max(0, Math.ceil((P.rientro - Date.now()) / 1000))} s per rientrare`;
    if (animazione) return `Turno in corso…`;
    const s = P.scadenza ? Math.max(0, Math.ceil((P.scadenza - Date.now()) / 1000)) : 0;
    if (B.serveSostituzione(0)) return `Scegli chi mandare in campo · <b>${s}</b> s${barraTempo()}`;
    if (B.serveSostituzione(1)) return `${esc(P.avv.nome)} sceglie chi mandare in campo…`;
    if (P.mie[turno()]) return `Hai scelto. Aspetto la mossa di ${esc(P.avv.nome)}…`;
    return `Tocca a te · <b class="${s <= 10 ? "vivo-allarme" : ""}">${s}</b> s per scegliere${barraTempo()}`;
  }
  // da quando aspetto l'avversario (la mia mossa è partita o tocca a lui sostituire)
  function segnaAttesa() {
    if (!P || !B) return;
    const t = turno(), aspetto = B.vincitore < 0 && !animazione && ((P.mie[t] && !P.loro[t]) || B.serveSostituzione(1));
    P.attesaDa = aspetto ? (P.attesaDa || Date.now()) : 0;
  }
  function aggiornaBanner() { const el = $("#vivo-banner"); if (el) el.innerHTML = testoBanner(); }
  function htmlBanner() { return P ? `<p class="vivo-banner" id="vivo-banner">${testoBanner()}</p>${P.spettatori ? `<p class="vivo-spett">👀 ${P.spettatori} ${P.spettatori === 1 ? "amico sta guardando" : "amici stanno guardando"}</p>` : ""}` : ""; }
  const inAttesa = () => !!(P && B && P.mie[turno()] && B.vincitore < 0);
  const scelta = () => { const m = P && P.mie[turno()]; if (!m) return ""; const a = m.az; return a.tipo === "mossa" ? B.attivo(0).c.mosse[a.i].nome : a.tipo === "carica" ? "Carica" : "Cambio"; };

  // ---------------- fine ----------------
  // reazioni: niente conferma di ricezione, se una si perde pazienza
  function mandaReazione(i) {
    const ch = P ? P.ch : G ? G.ch : D ? D.ch : null; if (!ch) return;
    try { ch.send({ type: "broadcast", event: "r", payload: G && !P ? { da: io(), r: i, spett: true, nome: mioNome() } : { da: io(), r: i } }); } catch (e) {}
  }

  // ---------------- guardare la sfida di due amici ----------------
  // Lo spettatore entra nel canale della partita, chiede a chi ha sfidato i dati di partenza e le mosse fatte finora,
  // rigioca tutto in silenzio (stesso seme: viene uguale) e poi segue le mosse nuove con le animazioni.
  let G = null;
  function guarda(partita) {
    if (!attivo || B || P || G || !partita) return;
    G = { id: partita, pronto: false, prossimo: 0, attesa: {}, coda: [], lavora: false, fine: null, ultimoPasso: Date.now() };
    apriModale(`<div class="invito-vivo"><span class="codice-tag">Spettatore</span><h2>Mi collego alla sfida…</h2><p class="nota">Recupero le mosse fatte finora.</p>
      <div class="azioni centro"><button class="btn" data-azione="esci-guarda">Annulla</button></div></div>`, { bloccata: true });
    const ch = sb().channel(`noiverso-vivo-${partita}`, { config: { presence: { key: `spett:${io()}` }, broadcast: { self: false } } });
    G.ch = ch;
    ch.on("broadcast", { event: "spett" }, ({ payload }) => riceviSpett(payload))
      .on("broadcast", { event: "r" }, ({ payload }) => {
        if (!G || !G.dati || !payload || payload.da === io()) return;
        if (payload.spett) Reazioni.riceviSpettatore(payload.r, payload.nome, payload.da);
        else Reazioni.ricevi(payload.r, payload.da === G.dati.idA ? 0 : 1, true);
      })
      .on("presence", { event: "sync" }, () => controllaGiocatori())
      .subscribe(stato => {
        if (stato !== "SUBSCRIBED" || !G || G.ch !== ch) return;
        try { ch.track({ nome: mioNome(), t: Date.now() }); } catch (e) {}
        chiedi();
      });
    G.timer = setInterval(() => {
      if (!G) return;
      if (!G.pronto) { if (Date.now() - G.ultimoPasso > 12000) { mostraAvviso("Non riesco a collegarmi: forse la sfida è appena finita."); esciGuarda(); chiudiModale(); } else chiedi(); return; }
      // manca un pezzo da più di 4 secondi: richiedo tutto e riempio il buco
      if (Object.keys(G.attesa).length && Date.now() - G.ultimoPasso > 4000) { chiedi(); G.ultimoPasso = Date.now(); }
    }, 2000);
    annuncia();
  }
  function chiedi() { try { G.ch.send({ type: "broadcast", event: "spett", payload: { tipo: "ciao", da: io() } }); } catch (e) {} }
  function riceviSpett(p) {
    if (!G || !p) return;
    if (p.tipo === "stato" && p.per === io()) {
      if (!G.pronto) { G.pronto = true; G.dati = p.dati; G.logIniziale = p.log || []; G.prossimo = G.logIniziale.length; G.ultimoPasso = Date.now(); inizia(); }
      else (p.log || []).forEach((e, n) => { if (n >= G.prossimo) G.attesa[n] = e; });
      avanza();
    } else if (p.tipo === "passo") {
      G.ultimoPasso = Date.now();
      if (!G.pronto) return;
      if (p.n >= G.prossimo) G.attesa[p.n] = p.e;
      avanza();
    } else if (p.tipo === "fine") { G.fine = p; avanza(); }
  }
  function inizia() {
    const d = G.dati;
    chiudiModale();
    schermoIntero(true);
    avviaSfida({ id: "guarda", nome: d.nomeB, abilita: 0, liv: [1, 30], premio: 0, punti: 0, xp: 0, graffitoNemico: d.gB,
      spettatore: { nomeA: d.nomeA, nomeB: d.nomeB, sqA: d.sqA, gA: d.gA } }, d.sqA.map(x => x.id), d.sqB).then(() => { avanza(); });
  }
  // chiamata da avviaSfida: la battaglia vera, già portata al punto in cui è adesso (senza animazioni)
  function creaGuarda(sqA, sqB) {
    const d = G.dati, bt = new Battaglia(sqA, sqB, d.nomeA, d.nomeB, mulberry32(d.seme));
    if (d.bossPv) Boss.prepara(bt, d.bossPv);   // il boss del gruppo, trasformato come lo vede chi gioca
    return bt;
  }

  // ---------------- diretta delle sfide contro il computer ----------------
  // Chi gioca contro un bot apre un canale come quello delle sfide dal vivo: gli amici possono guardare.
  // La battaglia usa un seme (così lo spettatore la rigioca uguale); le scelte del computer usano un caso a parte.
  let D = null;
  function iniziaDiretta(dati) {
    chiudiDiretta();
    if (!attivo || P || G || !sb()) return false;
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
    D = { id, dati: Object.assign({}, dati, { idA: io(), idB: null, cpu: true }), log: [], spettatori: 0 };
    const d = D, ch = sb().channel(`noiverso-vivo-${id}`, { config: { presence: { key: io() }, broadcast: { self: false } } });
    d.ch = ch;
    ch.on("broadcast", { event: "spett" }, ({ payload }) => {
        if (D !== d || !payload || payload.tipo !== "ciao") return;
        try { ch.send({ type: "broadcast", event: "spett", payload: { tipo: "stato", per: payload.da, dati: d.dati, log: d.log } }); } catch (e) {}
      })
      .on("broadcast", { event: "r" }, ({ payload }) => { if (D === d && payload && payload.spett) Reazioni.riceviSpettatore(payload.r, payload.nome, payload.da); })
      .on("presence", { event: "sync" }, () => {
        if (D !== d) return;
        const n = Object.keys(ch.presenceState() || {}).filter(k => k.startsWith("spett:")).length;
        if (n !== d.spettatori) { d.spettatori = n; const el = $("#diretta-spett"); if (el) el.outerHTML = htmlDiretta(); else if (B && !animazione) aggiornaBattaglia(); }
      })
      .subscribe(st => { if (st === "SUBSCRIBED" && D === d) try { ch.track({ t: Date.now() }); } catch (e) {} });
    annuncia();
    return true;
  }
  function loggaDiretta(e) {
    if (!D || D.finita) return;
    D.log.push(e);
    try { D.ch.send({ type: "broadcast", event: "spett", payload: { tipo: "passo", n: D.log.length - 1, e } }); } catch (x) {}
  }
  function fineDiretta(vincitore, motivo) {
    if (!D || D.finita) return;
    try { D.ch.send({ type: "broadcast", event: "spett", payload: { tipo: "fine", vincitore, motivo: motivo || "normale" } }); } catch (e) {}
    D.finita = true;
    annuncia();
  }
  function chiudiDiretta() {
    if (!D) return;
    const d = D; D = null;
    if (!d.finita) try { d.ch.send({ type: "broadcast", event: "spett", payload: { tipo: "fine", vincitore: 1, motivo: "resa" } }); } catch (e) {}
    setTimeout(() => { try { sb().removeChannel(d.ch); } catch (e) {} }, 1500);
    annuncia();
  }
  const htmlDiretta = () => D && D.spettatori ? `<p class="vivo-spett" id="diretta-spett">👀 ${D.spettatori} ${D.spettatori === 1 ? "amico sta guardando" : "amici stanno guardando"}</p>` : `<span id="diretta-spett" hidden></span>`;
  function rigioca(bt) { for (const e of G.logIniziale || []) applica(bt, e); G.logIniziale = null; }
  function applica(bt, e) {
    if (e.o === "ogg") { const r = bt.usaOggetto(e.l, e.id, Zaino.info(e.id).nome || e.id); return r.ev || []; }
    if (e.o === "sost") return bt.sostituisci(e.l, e.i);
    if (e.o === "turno") return bt.risolviTurno(e.a, e.b);
    return [];
  }
  async function avanza() {
    if (!G || !G.pronto || !B || G.lavora) return;
    G.lavora = true;
    while (G && B && G.attesa[G.prossimo]) {
      const e = G.attesa[G.prossimo]; delete G.attesa[G.prossimo]; G.prossimo++;
      while (animazione) await new Promise(r => setTimeout(r, 120));
      if (!G || !B) break;
      await riproduci(applica(B, e));
      aggiornaBattaglia();
    }
    if (G) G.lavora = false;
    if (G && B && B.vincitore < 0 && G.fine && !Object.keys(G.attesa).length) B.vincitore = G.fine.vincitore;   // resa o abbandono
    if (G && B && B.vincitore >= 0 && !G.chiusa) { G.chiusa = true; chiudiSfida(); }
  }
  function controllaGiocatori() {
    if (!G || !G.ch || !G.dati) return;
    const st = G.ch.presenceState() || {};
    G.spettatori = Object.keys(st).filter(k => k.startsWith("spett:")).length;
    G.giocatori = [G.dati.idA, G.dati.idB].filter(k => k && st[k]).length + (G.dati.cpu ? 1 : 0);
    const el = $("#guarda-info"); if (el) el.innerHTML = testoGuarda();
  }
  const testoGuarda = () => !G || !G.dati ? "" : `👀 ${G.spettatori || 1} ${G.spettatori === 1 || !G.spettatori ? "spettatore" : "spettatori"}${G.giocatori === 2 || G.giocatori === undefined ? "" : " · <b class=\"vivo-allarme\">un giocatore si è disconnesso</b>"}`;
  function htmlGuarda() {
    const d = G && G.dati; if (!d) return "";
    return `<div class="guarda-pannello">
      <p class="guarda-titolo"><b>${esc(d.nomeA)}</b> <span>contro</span> <b>${esc(d.nomeB)}</b></p>
      <p class="nota" id="guarda-info">${testoGuarda()}</p>
      <p class="nota">Stai guardando la sfida dal vivo: ${esc(d.nomeA)} è in basso, ${esc(d.nomeB)} in alto. Con 😀 mandi reazioni che vedono tutti.</p>
      <div class="azioni centro"><button class="btn" data-azione="esci-guarda">Esci</button></div></div>`;
  }
  function chiudiGuarda() { livelloAttuale.esito = { vincitore: B.vincitore }; aggiornaBattaglia(); }
  function htmlFineGuarda() {
    const d = G && G.dati, v = B ? B.vincitore : -1, nome = !d ? "" : v === 0 ? d.nomeA : d.nomeB;
    const motivo = G && G.fine && G.fine.motivo === "resa" ? " (l'altro si è arreso)" : G && G.fine && G.fine.motivo === "abbandono" ? " (l'altro ha abbandonato)" : "";
    return `<div class="fine vinto"><b>Ha vinto ${esc(nome)}!</b><span>Sfida finita${motivo}.</span>
      <div class="azioni centro"><button class="btn primario" data-azione="esci-guarda">Torna alle sfide</button></div></div>`;
  }
  function esciGuarda() {
    if (!G) return;
    const g = G; G = null;
    clearInterval(g.timer);
    try { g.ch.untrack(); } catch (e) {}
    setTimeout(() => { try { sb().removeChannel(g.ch); } catch (e) {} }, 500);
    annuncia();
  }
  function resa() {
    if (!P || !B) return;
    manda({ tipo: "resa" });
    P.motivo = "resa";
  }
  async function registra(vincitore, motivo) {
    if (!P || P.registrata) return;
    P.registrata = true;
    try {
      const r = await rpcSociale("chiudi_partita_vivo", { partita: P.id, avversario: P.avv.id, sono_a: P.host, chi_vince: vincitore, firma: P.canon ? firma() : "", motivo });
      P.esitoServer = r && r.stato; P.puntiServer = r ? Number(r.punti) || 0 : 0;
    } catch (e) { P.esitoServer = "errore"; P.erroreServer = e.message; }
    try { Torneo.carica(true); } catch (e) { /* il torneo è un extra */ }
    if (B && B.vincitore >= 0) aggiornaBattaglia();
  }
  function chiudi() {
    const L = livelloAttuale, vinto = B.vincitore === 0;
    L.espCarte = premiaCarte(1.8, vinto);
    const e = { vinto, monete: vinto ? 100 : 30, xp: ridXP(vinto ? 130 : 50) };
    if (vinto) { S.stats.vittorie++; S.stats.vinteVivo = (S.stats.vinteVivo || 0) + 1; if (arena) arena.vittoria(0); }
    else S.stats.sconfitte++;
    S.monete += e.monete;
    const su = aggiungiXP(e.xp);
    L.esito = e;
    Missioni.evento("amico", { vinto });
    if (vinto) Missioni.evento("vittoria", { squadra: B.lati[0].squadra.map(x => x.id) });
    salva(); aggiornaTesta(); aggiornaBattaglia();
    if (su) setTimeout(() => mostraAvviso(`Pass: livello ${su} raggiunto!`), 900);
    if (P) {
      if (P.host && P.spett) try { P.ch.send({ type: "broadcast", event: "spett", payload: { tipo: "fine", vincitore: B.vincitore, motivo: P.motivo || "normale" } }); } catch (e) {}
      P.finita = true; P.scadenza = 0; P.rientro = 0;
      registra(vinto ? io() : P.avv.id, P.motivo || "normale");
      if (vinto) setTimeout(() => { const el = $(".fine b"); if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 80, forma: "coriandolo", colori: ["#f2c14e", "#ff2e46", "#3fd8ff", "#ffffff"], velocita: 8, dimensione: 5 }); } }, 250);
    }
  }
  function htmlFine() {
    const e = livelloAttuale.esito || {}, nome = P ? P.avv.nome : livelloAttuale.nome;
    const motivo = P && P.motivo === "abbandono" ? `${esc(nome)} ha abbandonato la partita.` : P && P.motivo === "resa" ? (e.vinto ? `${esc(nome)} si è arreso.` : "Ti sei arreso.") : "";
    const srv = !P ? "" : P.esitoServer === "ok" ? (e.vinto ? `<span class="punti-amico">+3 punti classifica</span>` : `<span class="nota">Risultato registrato.</span>`)
      : P.esitoServer === "attesa" ? `<small class="nota">Aspetto che anche ${esc(nome)} confermi il risultato…</small>`
      : P.esitoServer === "abbandono" ? (P.puntiServer ? `<span class="punti-amico">+3 punti classifica (vittoria per abbandono)</span>` : `<small class="nota">Vittoria per abbandono: oggi contro ${esc(nome)} l'hai già avuta, questa non dà punti.</small>`)
      : P.esitoServer === "contestata" ? `<small class="errore">Risultato contestato: nessun punto.</small>`
      : P.esitoServer === "errore" ? `<small class="errore">${esc(P.erroreServer || "Non riesco a registrare il risultato.")}</small>` : `<small class="nota">Registro il risultato…</small>`;
    return `<div class="fine ${e.vinto ? "vinto" : "perso"}">
      <b>${e.vinto ? "Vittoria!" : "Sconfitta"}</b>
      <span>${e.vinto ? `Hai battuto ${esc(nome)} dal vivo!` : `${esc(nome)} ha vinto questa volta.`}</span>
      ${motivo ? `<span class="nota">${motivo}</span>` : ""}
      ${srv}
      <span>+${e.monete} monete · +${e.xp} XP</span>
      ${htmlEspCarte()}
      <div class="azioni centro">${P && eOnline(P.avv.id) ? `<button class="btn primario" data-fx="onda" data-sfida-vivo="${esc(P.avv.id)}">Rivincita</button>` : ""}<button class="btn" data-fx="salto" data-azione="esci-vivo">Torna alle sfide</button></div>
    </div>`;
  }
  // ascolta le conferme del server mentre si guarda il risultato (l'altro può confermare dopo)
  async function aggiornaEsito() {
    if (!P || P.esitoServer !== "attesa") return;
    try { const { data } = await sb().from("partite_vivo").select("stato,punti").eq("id", P.id); const st = data && data[0] && data[0].stato; if (st && st !== "attesa") { P.esitoServer = st; P.puntiServer = Number(data[0].punti) || 0; aggiornaBattaglia(); } } catch (e) {}
  }
  setInterval(aggiornaEsito, 3000);
  function esci() {
    if (!P) return;
    const p = P;
    try { manda({ tipo: "esci" }); } catch (e) {}
    clearInterval(p.timerOrologio);
    setTimeout(() => { clearInterval(p.timerRete); try { sb().removeChannel(p.ch); } catch (e) {} }, 5000);   // il tempo di far arrivare le ultime conferme
    if (P === p) P = null;
    annuncia();
  }

  return { partitaDi, htmlStrada, iniziaDiretta, loggaDiretta, fineDiretta, chiudiDiretta, htmlDiretta, get inDiretta() { return !!D; }, guarda, creaGuarda, rigioca, htmlGuarda, chiudiGuarda, htmlFineGuarda, esciGuarda, get inGuarda() { return !!G; }, mandaReazione, avvia, htmlAmici, eOnline, quantiOnline, sfida, annullaInvito, rispondi, rifiutaSeInvito, creaBattaglia, scegli, sostituisci, oggettoUsato, htmlBanner, inAttesa, scelta, resa, chiudi, htmlFine, esci,
    get inPartita() { return !!P; } };
})();
