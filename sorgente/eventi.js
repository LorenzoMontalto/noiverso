// ============================================================
//  EVENTI
//  - Settimana: ogni settimana una serie è "in evidenza": la sua bustina costa il 30% in meno,
//    ci sono 3 sfide speciali contro squadre di quella serie e 3 missioni su quella serie.
//    La serie gira da sola ogni lunedì; l'admin può sceglierne un'altra (config "evidenza").
//  - BossGiorno: per chi ha finito la storia, un boss difficile che cambia ogni giorno.
//    Ha una corazza (lo rende duro) e un punto debole: con la squadra giusta si batte.
// ============================================================

// lunedì della settimana di una data (ora locale), e chiave tipo "2026-11-23"
function lunediDi(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
const chiaveGiorno = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// numero "a caso" ma sempre uguale per la stessa stringa (stesso giorno = stesso boss per tutti)
function hashTesto(t) { let h = 2166136261; for (const ch of String(t)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const Settimana = (() => {
  const SCONTO = .3;
  let scelta = null;   // { settimana, serie } dall'admin
  const chiave = () => chiaveGiorno(lunediDi());
  function serie() {
    const k = chiave();
    if (scelta && scelta.settimana === k && SERIE[scelta.serie]) return scelta.serie;
    const n = Math.round((lunediDi() - new Date(2026, 0, 5)) / (7 * 864e5));   // 5 gennaio 2026 era lunedì
    return ORDINE_SERIE[((n % ORDINE_SERIE.length) + ORDINE_SERIE.length) % ORDINE_SERIE.length];
  }
  const fineSettimana = () => { const x = lunediDi(); x.setDate(x.getDate() + 7); return x; };
  function prezzo(t) { const T = TIPI_BUSTINA[t]; if (!T || !T.prezzo) return 0; return T.serie && T.serie === serie() ? Math.round(T.prezzo * (1 - SCONTO) / 10) * 10 : T.prezzo; }
  const inEvidenza = t => !!(TIPI_BUSTINA[t] && TIPI_BUSTINA[t].serie && TIPI_BUSTINA[t].serie === serie());

  // ---------- progressi della settimana ----------
  // I progressi valgono per TUTTA la settimana, anche se nel frattempo la serie in evidenza cambia.
  // Errore corretto (nov 2026): si azzeravano ogni volta che la serie risultava diversa, e succedeva a ogni rientro
  // (per un attimo, prima di leggere la scelta dell'admin, la serie era quella automatica) e a ogni serie nuova aggiunta:
  // così le sfide della settimana (fino a 1.650 monete e una bustina leggendaria) si potevano rivincere chiudendo e rientrando.
  function stato() {
    const k = chiave(), s = serie();
    if (!S.settimana || S.settimana.chiave !== k) S.settimana = { chiave: k, serie: s, vinte: {}, prog: {}, riscosse: {} };
    else if (S.settimana.serie !== s) S.settimana = Object.assign({}, S.settimana, { serie: s });
    return S.settimana;
  }
  const SFIDE = [
    { nome: "Facile",    liv: [8, 12],  rarita: ["comune", "rara"],                  abilita: .6,  premio: { monete: 250 } },
    { nome: "Media",     liv: [16, 20], rarita: ["rara", "epica"],                   abilita: .8,  get premio() { return { monete: 500, bustine: { [`serie-${serie()}`]: 1 } }; } },
    { nome: "Difficile", liv: [26, 30], rarita: ["epica", "leggendaria"],            abilita: .95, premio: { monete: 900, bustine: { leggendaria: 1 } } },
  ];
  const MISSIONI = [
    { id: "vinci", n: 5, testo: s => `Vinci 5 battaglie con almeno 3 carte ${s} in squadra`, premio: { monete: 300 } },
    { id: "bustine", n: 3, testo: s => `Apri 3 bustine ${s}`, premio: { monete: 350 } },
    { id: "potenzia", n: 5, testo: s => `Potenzia 5 volte carte ${s}`, premio: { bustine: { epica: 1 } } },
  ];
  function evento(tipo, d = {}) {
    if (S.admin) return;
    const st = stato(), s = st.serie, piu = id => { st.prog[id] = (st.prog[id] || 0) + 1; };
    if (tipo === "vittoria" && (d.squadra || []).filter(id => PER_ID[id] && PER_ID[id].serie === s).length >= 3) piu("vinci");
    if (tipo === "bustina" && d.tipo === `serie-${s}`) piu("bustine");
    if (tipo === "potenzia" && d.id && PER_ID[d.id] && PER_ID[d.id].serie === s) piu("potenzia");
  }
  function riscuoti(id) {
    const st = stato(), m = MISSIONI.find(x => x.id === id);
    if (!m || st.riscosse[id] || (st.prog[id] || 0) < m.n) return;
    st.riscosse[id] = true;
    const p = JSON.parse(JSON.stringify(m.premio)); daiPremio(p);
    salva(); aggiornaTesta(); disegna();
    mostraAvviso(`Missione della settimana completata: ${testoPremio(p)}!`);
  }
  const daRiscuotere = () => { const st = stato(); return MISSIONI.filter(m => !st.riscosse[m.id] && (st.prog[m.id] || 0) >= m.n).length; };

  // ---------- sfide della settimana ----------
  function nemici(i) {
    const s = serie(), sf = SFIDE[i], pool = CARTE.filter(c => c.serie === s);
    // sempre le stesse per tutta la settimana: scelte con il nome della settimana
    let h = hashTesto(chiave() + ":" + i);
    const pesca = arr => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return arr.splice(h % arr.length, 1)[0]; };
    const buone = pool.filter(c => sf.rarita.includes(c.rarita)), altre = pool.filter(c => !sf.rarita.includes(c.rarita));
    const out = [];
    while (out.length < CARTE_SQUADRA && (buone.length || altre.length)) out.push(pesca(buone.length ? buone : altre));
    return out.map((c, k) => ({ id: c.id, liv: sf.liv[0] + (k % (sf.liv[1] - sf.liv[0] + 1)), lode: false }));
  }
  const campo = () => ORDINE_CAMPI[hashTesto(chiave() + ":campo") % ORDINE_CAMPI.length];
  function avvia(i) {
    const sf = SFIDE[i]; if (!sf) return;
    const se = SERIE[serie()];
    const L = { id: "settimana", nome: `${se.nome} · ${sf.nome}`, abilita: sf.abilita, liv: sf.liv, premio: 60 + i * 40, punti: 0, xp: 90 + i * 40, xpCarte: 1.5 + i,
      campo: campo(), settimana: { i }, rifai: () => avvia(i) };
    L.dopoVittoria = () => {
      const st = stato();
      if (st.vinte[i]) return "";
      st.vinte[i] = true;
      const p = JSON.parse(JSON.stringify(sf.premio)); daiPremio(p);
      return `Prima vittoria della settimana: ${testoPremio(p)}!`;
    };
    schermoIntero(true);
    setTimeout(() => avviaSfida(L, null, nemici(i)), ridotto ? 0 : 200);
  }
  const testoFine = () => { const d = Math.max(0, Math.ceil((fineSettimana() - Date.now()) / 864e5)); return d <= 1 ? "finisce oggi" : `ancora ${d} giorni`; };

  // ---------- grafica ----------
  function htmlStrada() {
    const se = SERIE[serie()];
    return `<div class="evidenza-strada" style="--c:${se.colore}"><span class="ev-stemma">${se.simbolo}</span>
      <div><small>Serie della settimana · ${testoFine()}</small><b>${esc(se.nome)}</b><span class="nota">Bustina ${esc(se.nome)} −${Math.round(SCONTO * 100)}%, sfide e missioni speciali.</span></div>
      <button class="btn piccolo" data-azione="vai-sfida">Vai alle sfide</button></div>`;
  }
  function htmlSfida() {
    const s = serie(), se = SERIE[s], st = stato(), c = CAMPI[campo()];
    return `<section class="settimana" style="--c:${se.colore}">
      <div class="titolo-riga piccola"><h3><span class="ev-stemma piccolo">${se.simbolo}</span> Sfide della settimana: ${esc(se.nome)}</h3><p class="nota">${testoFine()} · campo ${c.icona} ${c.nome} · squadre tutte ${esc(se.nome)}</p></div>
      <div class="sett-sfide">${SFIDE.map((sf, i) => `<button class="sett-sfida ${st.vinte[i] ? "fatta" : ""}" data-fx="spinta" data-sfida-settimana="${i}">
        <b>${sf.nome}</b><span>Lv ${sf.liv[0]}–${sf.liv[1]}</span>
        <small>${st.vinte[i] ? "✓ Premio preso questa settimana" : `Prima vittoria: ${testoPremio(sf.premio)}`}</small></button>`).join("")}</div>
      <div class="sett-missioni">${MISSIONI.map(m => { const p = Math.min(m.n, st.prog[m.id] || 0), fatta = st.riscosse[m.id], pronta = !fatta && p >= m.n;
        return `<div class="sett-missione ${fatta ? "fatta" : ""}"><span>${m.testo(esc(se.nome))}</span>
          <div class="barra"><i style="--p:${Math.round(p / m.n * 100)}%;background:${se.colore}"></i></div>
          <small>${p}/${m.n} · ${testoPremio(m.premio)}</small>
          ${pronta ? `<button class="btn piccolo primario" data-riscuoti-settimana="${m.id}">Riscuoti</button>` : fatta ? `<small class="ok">✓ Riscossa</small>` : ""}</div>`; }).join("")}</div>
    </section>`;
  }
  // ---------- admin ----------
  async function carica() {
    if (Archivio.modo !== "cloud" || !Archivio.db) return;
    try { const snap = await Archivio.db.doc("config/evidenza").get(); scelta = snap && snap.exists ? snap.data() : null; } catch (e) { return; }
    if (!B && ["strada", "sfida", "negozio", "admin"].includes(vista) && $("#modale").hidden) disegnaQuieto();
  }
  function htmlAdmin() {
    const auto = !(scelta && scelta.settimana === chiave());
    return `<h3>Serie della settimana</h3>
      <p class="nota">Ogni lunedì cambia da sola. Questa settimana: <b>${esc(SERIE[serie()].nome)}</b>${auto ? " (automatica)" : " (scelta da te)"}. Puoi sceglierne un'altra solo per questa settimana.</p>
      <div class="filtri">${ORDINE_SERIE.map(k => `<button class="chip" data-admin-evidenza="${k}" aria-pressed="${serie() === k}">${SERIE[k].simbolo} ${esc(SERIE[k].nome)}</button>`).join("")}
      <button class="chip" data-admin-evidenza="" aria-pressed="${auto}">Automatica</button></div>`;
  }
  async function salvaAdmin(k) {
    const nuovo = k ? { settimana: chiave(), serie: k } : {};
    try { await Archivio.db.doc("config/evidenza").set(nuovo); scelta = k ? nuovo : null; mostraAvviso(k ? `Serie della settimana: ${SERIE[k].nome}.` : "Serie della settimana automatica."); }
    catch (e) { mostraAvviso("Non sono riuscito a salvare."); }
    disegna();
  }
  return { serie, prezzo, inEvidenza, evento, riscuoti, daRiscuotere, avvia, htmlStrada, htmlSfida, carica, htmlAdmin, salvaAdmin, SCONTO };
})();

const BossGiorno = (() => {
  // il boss di ogni serie: una sua leggendaria, ingigantita
  const BOSS = { eroi: "ironlus", db: "gokiele", dei: "zeutiz", nueve: "reina", maghi: "simoldemort", demoni: "lollifer", mestieri: "ludhacker", simpson: "lollart", barbapapa: "ritamma", starwars: "giueia", elementi: "auraria", creature: "vikyeletro", cyborg: "alessiai" };
  const CORAZZE = {
    corazza:  { nome: "Corazza", desc: t => `Subisce il 40% di danni in meno dalle carte che non battono il suo tipo (${STILI[t].nome}).` },
    rigenera: { nome: "Rigenerazione", desc: () => "Ogni turno recupera il 6% dei PV, a meno che non stia bruciando." },
    furia:    { nome: "Furia", desc: () => "Sotto metà PV i suoi colpi fanno il 35% di danni in più." },
    scudo:    { nome: "Scudo magico", desc: () => "Stordimento e indebolimento non hanno effetto su di lui." },
  };
  const DEBOLEZZE = {
    serie:      { nome: "Teme una serie", desc: x => `Le carte ${SERIE[x].nome} gli fanno il 50% di danni in più.` },
    sinergia:   { nome: "Teme le sinergie", desc: () => "Se la tua squadra ha una sinergia di serie (2 carte o più), parte con il 30% di PV in meno." },
    multiverso: { nome: "Teme il Multiverso", desc: () => "Le tue carte con il Multiverso attivo gli fanno il 45% di danni in più." },
    fuoco:      { nome: "Teme il fuoco", desc: () => "Le bruciature gli fanno il triplo dei danni." },
    tipo:       { nome: "Teme un tipo", desc: t => `Le carte ${STILI[t].nome} gli fanno il 40% di danni in più (oltre al vantaggio di tipo).` },
  };
  const PV_X = 2.2, GUARDIE = 3, LIV_GUARDIE = 25;   // PV del boss rispetto a una leggendaria al 30, guardie e loro livello (provati con le simulazioni)
  function oggi(data = new Date()) {
    const k = chiaveGiorno(data), h = n => hashTesto(k + ":" + n);
    const s = ORDINE_SERIE[h("serie") % ORDINE_SERIE.length], id = BOSS[s] && PER_ID[BOSS[s]] ? BOSS[s] : CARTE.find(c => c.serie === s && c.rarita === "leggendaria").id;
    const c = PER_ID[id], kc = Object.keys(CORAZZE), kd = Object.keys(DEBOLEZZE);
    const corazza = kc[h("cor") % kc.length];
    let debolezza = kd[h("deb") % kd.length];
    if (corazza === "rigenera" && debolezza === "fuoco") debolezza = "fuoco";   // combinazione bella: brucialo per fermarlo
    const altre = ORDINE_SERIE.filter(x => x !== s), serieDebole = altre[h("sd") % altre.length];
    const tipoForte = Object.keys(STILI).find(t => STILI[t].batte === c.stile);   // il tipo che lo batte
    const campo = ORDINE_CAMPI[h("campo") % ORDINE_CAMPI.length];
    return { chiave: k, serie: s, id, corazza, debolezza, serieDebole, tipoForte, campo };
  }
  const descCorazza = g => CORAZZE[g.corazza].desc(PER_ID[g.id].stile);
  const descDebolezza = g => DEBOLEZZE[g.debolezza].desc(g.debolezza === "serie" ? g.serieDebole : g.tipoForte);
  const sbloccato = () => S.admin || (STORIA.length && stelleTappa(STORIA.length - 1, STORIA[STORIA.length - 1].tappe.length - 1) > 0);
  const battutoOggi = () => S.bossGiorno && S.bossGiorno.chiave === chiaveGiorno(new Date()) && S.bossGiorno.vinto;
  // le guardie: 4 carte della stessa serie del boss, al 28-30
  function squadra(g) {
    let h = hashTesto(g.chiave + ":guardie");
    const pool = CARTE.filter(c => c.serie === g.serie && c.id !== g.id && c.rarita !== "comune");
    const out = [];
    while (out.length < GUARDIE && pool.length) { h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0; out.push(pool.splice(h % pool.length, 1)[0].id); }
    return [{ id: g.id, liv: 30, lode: true }, ...out.map((id, k) => ({ id, liv: LIV_GUARDIE + (k % 3), lode: false }))];
  }
  // trasforma il primo nemico nel boss del giorno (lo usano anche gli amici che guardano)
  function prepara(Bt, g) {
    const x = Bt.lati[1].squadra[0], mio = Bt.lati[0];
    x.pvCura = Math.round(x.pvMax * 1.5);
    x.pvMax = x.pv = Math.round(x.pvMax * PV_X);
    x.att *= 1.2; x.vel += 3; x.bossGiorno = true;
    if (g.corazza === "corazza") { const forte = g.tipoForte; x.dannoDa = a => a.c.stile === forte ? 1 : .6; }
    if (g.corazza === "rigenera") x.rigenera = 6;
    if (g.corazza === "furia") x.furia = 35;
    if (g.corazza === "scudo") x.immuneEffetti = true;
    const prima = x.dannoDa || (() => 1);
    if (g.debolezza === "serie") x.dannoDa = a => prima(a) * (a.c.serie === g.serieDebole ? 1.5 : 1);
    if (g.debolezza === "tipo") x.dannoDa = a => prima(a) * (a.c.stile === g.tipoForte ? 1.4 : 1);
    if (g.debolezza === "multiverso") { const mv = new Set(((mio.sinergie || {}).multiverso || []).flatMap(m => m.ids)); x.dannoDa = a => prima(a) * (mv.has(a.id) ? 1.45 : 1); }
    if (g.debolezza === "fuoco") x.bruciaX = 3;
    if (g.debolezza === "sinergia" && ((mio.sinergie || {}).serie || []).some(s => s.liv >= 1)) x.pv = Math.round(x.pvMax * .7);
  }
  function avvia() {
    if (!sbloccato()) return;
    const g = oggi(), c = PER_ID[g.id];
    const L = { id: "boss-giorno", nome: `${c.nome}, boss del giorno`, abilita: 1, liv: [28, 30], premio: 150, punti: 0, xp: 220, xpCarte: battutoOggi() ? 2 : 5,
      campo: g.campo, bossGiorno: g, rifai: () => avvia() };
    L.dopoVittoria = () => {
      if (battutoOggi()) return "Oggi l'avevi già battuto: il premio grosso torna domani con un boss nuovo.";
      S.bossGiorno = { chiave: g.chiave, vinto: true }; S.stats.bossGiorno = (S.stats.bossGiorno || 0) + 1;
      const p = { monete: 600, bustine: { leggendaria: 1 } }; daiPremio(p);
      return `Boss del giorno sconfitto! ${testoPremio(p)}.`;
    };
    schermoIntero(true);
    setTimeout(() => avviaSfida(L, null, squadra(g)), ridotto ? 0 : 200);
  }
  function htmlSfida() {
    const g = oggi(), c = PER_ID[g.id], se = SERIE[g.serie], campo = CAMPI[g.campo];
    if (!sbloccato()) return `<section class="boss-giorno chiuso"><div class="bg-testa"><span class="bg-ico">☠</span><div><b>Boss del giorno</b><span class="nota">Finisci la storia (batti il boss dell'ultimo capitolo) per sbloccarlo: ogni giorno un boss diverso, molto forte, con un punto debole da scoprire.</span></div></div></section>`;
    return `<section class="boss-giorno" style="--c:${se.colore}">
      <div class="bg-testa">${htmlCarta(c, { piccola: true, liv: 30, lode: true })}
        <div><small>Boss del giorno · cambia a mezzanotte</small><b>${esc(c.nome)}</b><span class="nota">${se.simbolo} ${esc(se.nome)} · ${STILI[c.stile].icona} ${STILI[c.stile].nome} · con ${GUARDIE} guardie al Lv ${LIV_GUARDIE}-${LIV_GUARDIE + 2} · campo ${campo.icona} ${campo.nome}</span></div></div>
      <div class="bg-regole">
        <p class="bg-cor"><b>🛡 ${CORAZZE[g.corazza].nome}</b> ${descCorazza(g)}</p>
        <p class="bg-deb"><b>🎯 Punto debole: ${DEBOLEZZE[g.debolezza].nome}</b> ${descDebolezza(g)}</p>
      </div>
      <div class="azioni"><button class="btn primario" data-fx="spinta" data-azione="boss-giorno">${battutoOggi() ? "Rigioca (premio già preso)" : "Combatti"}</button>
        <span class="nota">${battutoOggi() ? "✓ Battuto oggi. Domani arriva un boss nuovo." : "Prima vittoria del giorno: 600 monete + 1 Bustina Leggendaria + 5 potenziatori a ogni carta che scende in campo."}</span></div>
    </section>`;
  }
  return { oggi, prepara, avvia, htmlSfida, sbloccato, battutoOggi, squadra, descCorazza, descDebolezza, CORAZZE, DEBOLEZZE, PV_X };
})();

// eventi delle missioni: li ascolta anche la settimana
if (typeof Missioni !== "undefined" && !Missioni._settimana) {
  const orig = Missioni.evento;
  Missioni.evento = (tipo, d) => { orig(tipo, d); try { Settimana.evento(tipo, d); } catch (e) { /* niente */ } };
  Missioni._settimana = true;
}

// ============================================================
//  TORNEO DEL WEEKEND (le regole sono nel database: tornei, tornei_iscritti, tornei_partite)
// ============================================================
const Torneo = (() => {
  let T = null, iscritti = [], partite = [], caricato = false, ultimo = 0;
  async function carica(forza) {
    if (!socialeAttivo() || !sbSociale()) return;
    if (!forza && Date.now() - ultimo < 20000) return;
    ultimo = Date.now();
    try {
      const sb = sbSociale();
      const { data: ts } = await sb.from("tornei").select("*").order("id", { ascending: false }).limit(1);
      T = ts && ts[0] && (["iscrizioni", "in_corso"].includes(ts[0].stato) || (ts[0].finito && Date.now() - new Date(ts[0].finito) < 3 * 864e5)) ? ts[0] : null;
      if (T) {
        const [{ data: is }, { data: ps }] = await Promise.all([
          sb.from("tornei_iscritti").select("*").eq("torneo", T.id),
          sb.from("tornei_partite").select("*").eq("torneo", T.id).order("turno").order("n")]);
        iscritti = is || []; partite = ps || [];
      } else { iscritti = []; partite = []; }
      caricato = true;
      if (T && T.stato === "finito" && !S.admin && !Torneo._premi) { Torneo._premi = true; ritiraPremiClassifica(); }
    } catch (e) { return; }
    if (!B && ["strada", "classifica", "admin"].includes(vista) && $("#modale").hidden) disegnaQuieto();
  }
  const nome = id => { const x = iscritti.find(i => i.user_id === id); return x ? x.nome : id ? "Giocatore" : "—"; };
  const avatar = id => { const x = iscritti.find(i => i.user_id === id); return x ? x.avatar : ""; };
  const sonoIscritto = () => !!iscritti.find(i => i.user_id === Archivio.uid);
  const miaPartita = () => partite.find(p => !p.vincitore && p.a && p.b && (p.a === Archivio.uid || p.b === Archivio.uid));
  const eliminato = () => T && T.stato === "in_corso" && sonoIscritto() && !miaPartita() && partite.some(p => p.vincitore && (p.a === Archivio.uid || p.b === Archivio.uid) && p.vincitore !== Archivio.uid && !p.finalina)
    && !partite.some(p => p.finalina && (p.a === Archivio.uid || p.b === Archivio.uid) && !p.vincitore);
  const tempo = d => { const ms = new Date(d) - Date.now(); if (ms <= 0) return "scaduta"; const h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4); return h ? `${h} h ${m} min` : `${m} min`; };
  const turni = () => Math.max(0, ...partite.map(p => p.turno));
  const nomeTurno = (r, tot) => r === tot ? "Finale" : r === tot - 1 ? "Semifinali" : r === tot - 2 ? "Quarti" : `Turno ${r}`;
  // quanti turni avrà in tutto il tabellone (dal numero di partite del primo turno)
  const turniTotali = () => { const p1 = partite.filter(p => p.turno === 1).length; return p1 ? Math.round(Math.log2(p1 * 2)) : 0; };

  async function iscriviti(si) {
    try { await rpcSociale("iscriviti_torneo", { si }); mostraAvviso(si ? "Sei iscritto al torneo! Ti avviso quando inizia." : "Iscrizione tolta."); }
    catch (e) { mostraAvviso(e.message); }
    carica(true);
  }

  // riquadro nella Strada
  function htmlStrada() {
    if (!T || S.admin) return "";
    if (T.stato === "iscrizioni") return `<div class="torneo-strada"><span class="tr-coppa">🏆</span><div><small>Torneo · iscrizioni aperte</small><b>${esc(T.nome)}</b><span class="nota">${iscritti.length} iscritti · sfide dal vivo a eliminazione diretta · premi ai primi 3</span></div>
      ${sonoIscritto() ? `<button class="btn piccolo" data-torneo="esci">Iscritto ✓ (togli)</button>` : `<button class="btn piccolo primario" data-torneo="iscriviti">Iscriviti</button>`}</div>`;
    if (T.stato === "in_corso") {
      const m = miaPartita(), avv = m ? (m.a === Archivio.uid ? m.b : m.a) : null;
      const info = m ? `${m.finalina ? "Finalina 3° posto" : nomeTurno(m.turno, turniTotali())}: contro <b>${esc(nome(avv))}</b> · scade tra ${tempo(m.scadenza)}`
        : eliminato() ? "Sei stato eliminato: guarda come va a finire!" : sonoIscritto() ? "Aspetta che finiscano le altre partite del turno." : "Torneo in corso.";
      return `<div class="torneo-strada"><span class="tr-coppa">🏆</span><div><small>Torneo in corso</small><b>${esc(T.nome)}</b><span class="nota">${info}</span></div>
        ${m ? (Online.eOnline && Online.eOnline(avv) ? `<button class="btn piccolo primario" data-sfida-vivo="${esc(avv)}">Sfida ora</button>` : `<span class="nota piccola">${esc(nome(avv))} non è online</span>`) : `<button class="btn piccolo" data-azione="vai-classifica">Tabellone</button>`}</div>`;
    }
    const vincitore = partite.find(p => p.turno === turni() && !p.finalina);
    return vincitore && vincitore.vincitore ? `<div class="torneo-strada finito"><span class="tr-coppa">🏆</span><div><small>Torneo finito</small><b>${esc(T.nome)}</b><span class="nota">Ha vinto <b>${esc(nome(vincitore.vincitore))}</b>!</span></div><button class="btn piccolo" data-azione="vai-classifica">Tabellone</button></div>` : "";
  }
  // tabellone completo (pagina Classifica)
  function htmlTabellone() {
    if (!T) return "";
    if (T.stato === "iscrizioni") return `<section class="torneo"><div class="titolo-riga"><h2>🏆 ${esc(T.nome)}</h2><p class="nota">Iscrizioni aperte · ogni turno dura ${T.ore_turno} ore</p></div>
      <p class="nota">Iscritti (${iscritti.length}): ${iscritti.map(i => esc(i.nome)).join(", ") || "ancora nessuno"}.</p>
      ${htmlPremi()}
      ${S.admin ? "" : sonoIscritto() ? `<button class="btn" data-torneo="esci">Togli l'iscrizione</button>` : `<button class="btn primario" data-torneo="iscriviti">Iscriviti al torneo</button>`}</section>`;
    const tot = turniTotali();
    const htmlPartita = p => {
      const io = p.a === Archivio.uid || p.b === Archivio.uid;
      const riga = id => `<div class="tr-gioc ${p.vincitore && p.vincitore === id ? "vince" : p.vincitore ? "perde" : ""}">${id ? htmlAvatar(String(avatar(id) || ""), "mini") : ""}<span>${id ? esc(nome(id)) : "passa il turno"}</span></div>`;
      return `<div class="tr-partita ${io ? "mia" : ""} ${p.vincitore ? "chiusa" : ""}">${riga(p.a)}${riga(p.b)}
        <small>${p.vincitore ? (p.a_tavolino ? "a tavolino" : !p.a || !p.b ? "" : "giocata") : p.a && p.b ? `scade tra ${tempo(p.scadenza)}` : ""}</small></div>`;
    };
    const colonne = [];
    for (let r = 1; r <= Math.max(tot, turni()); r++) {
      const ps = partite.filter(p => p.turno === r && !p.finalina), f3 = partite.filter(p => p.turno === r && p.finalina);
      colonne.push(`<div class="tr-turno"><b>${nomeTurno(r, tot)}</b>${ps.map(htmlPartita).join("") || `<div class="tr-partita vuota"><small>da decidere</small></div>`}
        ${f3.length ? `<b class="tr-f3">Finalina 3° posto</b>${f3.map(htmlPartita).join("")}` : ""}</div>`);
    }
    return `<section class="torneo"><div class="titolo-riga"><h2>🏆 ${esc(T.nome)}</h2><p class="nota">${T.stato === "finito" ? "Finito" : `In corso · ogni turno dura ${T.ore_turno} ore`} · le partite si giocano come sfide dal vivo</p></div>
      ${htmlPremi()}<div class="tr-tabellone">${colonne.join("")}</div></section>`;
  }
  const htmlPremi = () => Array.isArray(T.premi) && T.premi.length ? `<p class="tr-premi">${T.premi.map((p, i) => `<span>${["🥇", "🥈", "🥉"][i]} ${esc(testoPremio(p || {}))}</span>`).join("")}</p>` : "";

  // ---------- admin ----------
  function htmlAdmin() {
    if (!caricato) { setTimeout(() => carica(true), 0); return `<h3>Torneo del weekend</h3><p class="nota">Carico…</p>`; }
    const aperte = partite.filter(p => !p.vincitore && p.a && p.b);
    if (!T || T.stato === "finito" || T.stato === "annullato") return `<h3>Torneo del weekend</h3>
      <p class="nota">Crea un torneo: si aprono le iscrizioni e quando vuoi lo avvii (servono almeno 3 iscritti). Le partite si giocano come sfide dal vivo e il risultato conta da solo.</p>
      <form id="form-torneo" class="campi-torneo" autocomplete="off">
        <label>Nome <input name="nome" maxlength="40" value="Torneo del weekend"></label>
        <label>Ore per turno <input name="ore" type="number" min="1" max="168" value="24"></label>
        ${[1, 2, 3].map(i => `<fieldset><legend>${["🥇", "🥈", "🥉"][i - 1]} ${i}° posto</legend><div class="campi-3">
          <label>Monete <input name="m${i}" type="number" min="0" max="5000" value="${[2000, 1000, 500][i - 1]}"></label>
          <label>Bustine leggendarie <input name="l${i}" type="number" min="0" max="10" value="${[2, 1, 0][i - 1]}"></label>
          <label>Bustine epiche <input name="e${i}" type="number" min="0" max="10" value="${[0, 1, 2][i - 1]}"></label></div></fieldset>`).join("")}
        <div class="azioni"><button class="btn primario" type="submit">Crea torneo e apri le iscrizioni</button></div>
      </form>`;
    return `<h3>Torneo: ${esc(T.nome)}</h3>
      <p class="nota">${T.stato === "iscrizioni" ? `Iscrizioni aperte: ${iscritti.length} iscritti (${iscritti.map(i => esc(i.nome)).join(", ") || "nessuno"}).` : `In corso: ${aperte.length} partite da giocare.`}</p>
      ${T.stato === "iscrizioni" ? `<div class="azioni"><button class="btn primario" data-admin="torneo-avvia" ${iscritti.length < 3 ? "disabled" : ""}>Avvia il torneo</button></div>` : ""}
      ${aperte.length ? `<p class="nota">Se una partita non viene giocata entro la scadenza, assegna tu la vittoria:</p><div class="tr-admin">${aperte.map(p => `<div><span>${esc(nome(p.a))} vs ${esc(nome(p.b))} · ${tempo(p.scadenza)}</span>
        <button class="btn piccolo" data-admin="torneo-assegna:${p.id}:${p.a}">Vince ${esc(nome(p.a))}</button><button class="btn piccolo" data-admin="torneo-assegna:${p.id}:${p.b}">Vince ${esc(nome(p.b))}</button></div>`).join("")}</div>` : ""}
      <div class="azioni"><button class="btn" data-admin="torneo-annulla">Annulla il torneo</button></div>`;
  }
  async function admin(cosa, el) {
    try {
      if (cosa === "torneo-avvia") { const r = await rpcSociale("avvia_torneo"); mostraAvviso(`Torneo avviato: ${r.iscritti} giocatori, tabellone da ${r.tabellone}.`); }
      else if (cosa === "torneo-annulla") {
        if (el.dataset.conferma !== "1") { el.dataset.conferma = "1"; el.textContent = "Sicuro? Tocca di nuovo"; return; }
        await rpcSociale("annulla_torneo"); mostraAvviso("Torneo annullato.");
      } else if (cosa.startsWith("torneo-assegna:")) { const [, id, v] = cosa.split(":"); await rpcSociale("assegna_torneo", { partita: +id, vincitore: v }); mostraAvviso("Vittoria assegnata."); }
    } catch (e) { mostraAvviso(e.message); }
    await carica(true); const box = $("#admin-torneo"); if (box) box.innerHTML = htmlAdmin();
  }
  async function crea(form) {
    const f = new FormData(form), premi = [1, 2, 3].map(i => {
      const p = {}, m = +f.get(`m${i}`) || 0, l = +f.get(`l${i}`) || 0, e = +f.get(`e${i}`) || 0;
      if (m) p.monete = Math.min(5000, m); if (l || e) p.bustine = Object.assign({}, l ? { leggendaria: Math.min(10, l) } : {}, e ? { epica: Math.min(10, e) } : {});
      return p; });
    try { await rpcSociale("crea_torneo", { nome: String(f.get("nome") || ""), ore: +f.get("ore") || 24, premi }); mostraAvviso("Torneo creato: iscrizioni aperte!"); }
    catch (e) { mostraAvviso(e.message); }
    await carica(true); const box = $("#admin-torneo"); if (box) box.innerHTML = htmlAdmin();
  }
  setInterval(() => { if (!B && ["strada", "classifica"].includes(vista)) carica(); }, 60000);
  return { carica, iscriviti, htmlStrada, htmlTabellone, htmlAdmin, admin, crea };
})();
