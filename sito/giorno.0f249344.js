// ============================================================
//  SQUADRA MIGLIORE · REGALI TRA AMICI · ENIGMA DEL GIORNO   (nov 2026)
// ============================================================

// ---------------- battaglie simulate (non toccano la battaglia vera, la variabile B) ----------------
// Gioca una partita intera tra due squadre col computer da entrambe le parti. Torna { vinta, pvRimasti (0-1), turni }.
function partitaSimulata(sqA, sqB, o = {}) {
  const rng = o.rng || Math.random;
  const Bt = new Battaglia(sqA.map(x => Object.assign({}, x)), sqB.map(x => Object.assign({}, x)), "A", "B", mulberry32(Math.floor(rng() * 2 ** 31)));
  Bt.rngIA = rng;
  if (o.campo) { Bt.impostaCampo(o.campo); Bt.campoBloccato = true; }
  if (o.prepara) o.prepara(Bt);
  let g = 0;
  while (Bt.vincitore < 0 && g++ < 200) {
    if (Bt.serveSostituzione(0)) Bt.sostituisci(0, Bt.scegliSostituto(0));
    if (Bt.serveSostituzione(1)) Bt.sostituisci(1, Bt.scegliSostituto(1));
    if (Bt.vincitore >= 0) break;
    Bt.risolviTurno(Bt.scegliAzione(0, o.abilitaA ?? .85), Bt.scegliAzione(1, o.abilitaB ?? .85));
  }
  const L0 = Bt.lati[0].squadra, pv = L0.reduce((a, x) => a + Math.max(0, x.pv), 0) / Math.max(1, L0.reduce((a, x) => a + x.pvMax, 0));
  return { vinta: Bt.vincitore === 0, pvRimasti: pv, turni: Bt.turno - 1 };
}

// ---------------- SQUADRA MIGLIORE PER UNA TAPPA ----------------
// (La «Squadra consigliata» generica, nelle Squadre, c'è già: extra.js, Consiglio.) Questa invece cerca la squadra
// migliore contro i nemici VERI di una tappa della storia o della Leggenda, con il loro campo e la regola del capitolo.
// Come: prepara una decina di squadre «candidate» (le 5 carte più forti; e per ogni serie in cui hai almeno 2 carte,
// le sue migliori più le più forti delle altre, per la sinergia), le fa combattere contro quella tappa e tiene la migliore.
// Esempio: con 3 carte Mafiosi forti, la squadra «3 Mafiosi + 2 leggendarie» batte spesso le 5 carte più forti da sole.
const SquadraMigliore = (() => {
  const forza = c => { const s = statistiche(c, livello(c.id) || 1, haLode(c.id), rarCarta(c.id)); return s.pv / 150 + s.att / 10 + s.dif / 16 + s.vel / 14 + (haOlo(c.id) ? .15 : 0) + (haUltra(c.id) ? .3 : 0); };
  // carte possibili: non i Jolly (si scelgono a mano con la loro modalità)
  const pool = () => possedute().filter(c => c.rarita !== "jolly" && !SERIE[c.serie].jolly).map(c => ({ c, f: forza(c) })).sort((a, b) => b.f - a.f);
  function candidate() {
    const P = pool(), n = CARTE_SQUADRA;
    if (P.length < n) return [];
    const viste = new Set(), out = [];
    const metti = ids => { const k = [...ids].sort().join(","); if (ids.length === n && !viste.has(k)) { viste.add(k); out.push(ids); } };
    metti(P.slice(0, n).map(x => x.c.id));
    const perSerie = {};
    for (const x of P) (perSerie[x.c.serie] = perSerie[x.c.serie] || []).push(x);
    const serie = Object.keys(perSerie).filter(s => perSerie[s].length >= 2)
      .sort((a, b) => perSerie[b].slice(0, 3).reduce((t, x) => t + x.f, 0) - perSerie[a].slice(0, 3).reduce((t, x) => t + x.f, 0)).slice(0, 6);
    for (const s of serie) for (const k of [5, 3, 2]) {
      if (perSerie[s].length < k) continue;
      const base = perSerie[s].slice(0, k).map(x => x.c.id);
      metti(base.concat(P.filter(x => !base.includes(x.c.id)).slice(0, n - k).map(x => x.c.id)));
    }
    return out.slice(0, 12);
  }
  // in squadra la più resistente entra per prima (le altre a seguire per forza)
  const ordina = ids => ids.slice().sort((a, b) => { const sa = statistiche(PER_ID[a], livello(a) || 1, haLode(a), rarCarta(a)), sb = statistiche(PER_ID[b], livello(b) || 1, haLode(b), rarCarta(b)); return (sb.pv + sb.dif * 5) - (sa.pv + sa.dif * 5); });
  const voci = ids => ids.map(id => ({ id, liv: livello(id) || 1, lode: haLode(id), olo: haOlo(id), ultra: haUltra(id), asc: (S.asc || {})[id] || 0 }));
  // calcola a pezzi per non bloccare la pagina; avanzamento(0-1) per la barra
  async function calcola(contro, avanzamento) {
    const C = candidate(); if (!C.length) return null;
    const punti = C.map(() => ({ v: 0, n: 0, pv: 0 }));
    const lavori = [];
    if (contro) { const N = 30; C.forEach((_, i) => { for (let j = 0; j < N; j++) lavori.push([i, -1]); }); }
    else { const N = 6; for (let i = 0; i < C.length; i++) for (let j = 0; j < C.length; j++) if (i !== j) for (let r = 0; r < N; r++) lavori.push([i, j]); }
    for (let w = 0; w < lavori.length; w++) {
      const [i, j] = lavori[w];
      const r = contro ? partitaSimulata(voci(C[i]), contro.nemici, { campo: contro.campo, prepara: contro.prepara, abilitaB: contro.abilita })
        : partitaSimulata(voci(C[i]), voci(C[j]));
      punti[i].n++; punti[i].pv += r.pvRimasti; if (r.vinta) punti[i].v++;
      if (w % 40 === 39) { if (avanzamento) avanzamento(w / lavori.length); await new Promise(f => setTimeout(f, 0)); }
    }
    const val = p => p.v / p.n + p.pv / p.n * .2;
    let best = 0; punti.forEach((p, i) => { if (val(p) > val(punti[best])) best = i; });
    // la tua squadra di adesso, per confronto (solo contro una tappa: è lì che il numero dice qualcosa)
    let attuale = null;
    if (contro && squadraAttiva().carte.length === CARTE_SQUADRA) { let v = 0; const N = 30; const mia = squadraAttiva().carte.map(id => voceMia(id)); for (let k = 0; k < N; k++) if (partitaSimulata(mia, contro.nemici, { campo: contro.campo, prepara: contro.prepara, abilitaB: contro.abilita }).vinta) v++; attuale = v / N; }
    return { ids: ordina(C[best]), vince: punti[best].v / punti[best].n, attuale, candidate: C.length };
  }
  let proposta = null, tappa = null;
  async function apri(perTappa) {
    tappa = perTappa || null;
    if (pool().length < CARTE_SQUADRA) { mostraAvviso(`Servono almeno ${CARTE_SQUADRA} carte (non Jolly) per proporti una squadra.`); return; }
    apriModale(`<div class="sm-modale"><span class="codice-tag">✨ Squadra migliore</span><h2>Cerco la squadra migliore…</h2><p class="nota">Provo diverse squadre con le tue carte facendole combattere${tappa ? " contro i nemici di questa tappa" : " tra loro"}.</p><div class="sm-barra"><i style="width:0%"></i></div></div>`);
    let contro = null;
    if (tappa) { const { k, i, leg } = tappa, t = datiTappa(k, i, leg);
      contro = { nemici: t.nemici.map(e => typeof e === "object" ? Object.assign({}, e) : { id: e, liv: t.liv[1], lode: false }), campo: STORIA[k].campo, abilita: t.abilita, prepara: leg ? Bt => Leggenda.prepara(Bt, k, i) : null }; }
    const r = await calcola(contro, p => { const b = $("#modale-corpo .sm-barra i"); if (b) b.style.width = Math.round(p * 100) + "%"; });
    const el = $("#modale-corpo .sm-modale"); if (!el) return;   // finestra chiusa nel frattempo
    if (!r) { el.innerHTML = `<p class="nota">Non ho trovato abbastanza carte.</p><div class="azioni centro"><button class="btn" data-azione="chiudi">Chiudi</button></div>`; return; }
    proposta = r.ids;
    const sq = squadraAttiva(), stesse = sq.carte.length === CARTE_SQUADRA && [...sq.carte].sort().join() === [...r.ids].sort().join();
    // se la tua squadra di adesso vince (quasi) quanto la proposta, non serve cambiarla. Esempio: 9 su 10 contro 9 su 10.
    const uguale = stesse || (r.attuale != null && r.attuale >= r.vince - .05);
    const perc = x => `${Math.round(x * 10)} volte su 10`;
    el.innerHTML = `<span class="codice-tag">✨ Squadra migliore</span><h2>${stesse ? "La tua squadra è già la migliore!" : uguale ? "La tua squadra va già bene" : "Ti propongo questa squadra"}</h2>
      <div class="sm-carte">${r.ids.map(id => htmlCarta(PER_ID[id], { piccola: true })).join("")}</div>
      <p class="nota">${tappa ? `Contro questa tappa vince circa <b>${perc(r.vince)}</b>${r.attuale != null ? ` (la tua squadra di adesso: ${perc(r.attuale)})` : ""}.` : `Tra ${r.candidate} squadre provate con le tue carte è quella che ha vinto di più (${Math.round(r.vince * 100)}% delle partite).`} La prima entra in campo per prima. Il calcolo non conta zaino e graffito.</p>
      <div class="azioni centro">${stesse ? "" : `<button class="btn ${uguale ? "" : "primario"}" data-fx="spinta" data-azione="sm-usa">Usala come «${esc(sq.nome)}»</button>`}<button class="btn ${uguale ? "primario" : ""}" data-azione="${tappa ? "sm-torna" : "chiudi"}">${uguale ? "Tengo la mia" : "No, grazie"}</button></div>`;
  }
  function usa() {
    if (!proposta) return;
    const sq = squadraAttiva(); sq.carte = proposta.slice(); if (sq.jolly && !sq.carte.includes(sq.jolly)) { /* il Jolly non c'è più: la sua scelta resta salvata ma non conta */ }
    salva(); chiudiModale(); mostraAvviso(`«${sq.nome}» ora ha la squadra proposta.`);
    const t = tappa; tappa = null; disegna();
    if (t) setTimeout(() => apriTappa(t.k, t.i), 200);
  }
  function torna() { const t = tappa; tappa = null; chiudiModale(); if (t) setTimeout(() => apriTappa(t.k, t.i), 150); }
  return { apri, usa, torna, calcola, candidate };
})();

// ---------------- REGALI TRA AMICI ----------------
// Ogni giorno puoi mandare un regalo gratis a un amico: 3 potenziatori universali ✪. Il server tiene il conto
// (uno al giorno per chi lo manda, giorno di Roma) e chi lo riceve lo riscuote dalla home.
const Regali = (() => {
  const VALORE = 3;   // ✪ per regalo
  let stato = { mandato: null, arrivati: [] }, caricato = false;
  async function carica() {
    if (!socialeAttivo() || S.admin) return;
    try { const d = await rpcSociale("regali_stato"); stato = { mandato: d && d.mandato || null, arrivati: Array.isArray(d && d.arrivati) ? d.arrivati : [] }; caricato = true; aggiornaTesta(); if (vista === "strada") disegnaQuieto(); }
    catch (e) { /* schema vecchio o offline: niente regali per ora */ }
  }
  const mandatoOggi = () => stato.mandato;
  const arrivati = () => stato.arrivati.length;
  async function manda(id, nome) {
    if (stato.mandato) { mostraAvviso("Hai già mandato il regalo di oggi: domani puoi mandarne un altro."); return; }
    try { await rpcSociale("manda_regalo", { amico: id }); stato.mandato = id; chiudiModale(); mostraAvviso(`🎁 Regalo mandato a ${nome}: riceverà ${VALORE} potenziatori universali ✪.`); disegnaQuieto(); }
    catch (e) { mostraAvviso(String(e.message || e).includes("già") ? "Hai già mandato il regalo di oggi." : `Non riesco a mandare il regalo: ${e.message || e}`); }
  }
  async function riscuoti() {
    try {
      const n = await rpcSociale("riscuoti_regali"); const q = Math.max(0, Math.min(30, +n || 0));
      const da = [...new Set(stato.arrivati.map(x => x.nome))].slice(0, 3).join(", ");
      stato.arrivati = [];
      if (q) { S.jolly = Math.max(0, Math.floor(S.jolly || 0)) + q * VALORE; salva(); mostraAvviso(`🎁 ${q} ${q === 1 ? "regalo" : "regali"}${da ? ` da ${da}` : ""}: +${q * VALORE} potenziatori universali ✪`); }
      aggiornaTesta(); disegna();
    } catch (e) { mostraAvviso("Non riesco a riscuotere i regali adesso. Riprova tra poco."); }
  }
  // il tasto nel profilo di un amico
  const htmlTasto = r => !socialeAttivo() || S.admin || !r || !r.id || r.id === Archivio.uid ? "" :
    stato.mandato === r.id ? `<button class="btn piccolo" disabled>🎁 Regalo di oggi mandato</button>`
    : stato.mandato ? `<button class="btn piccolo" disabled title="Uno al giorno">🎁 Hai già mandato il regalo di oggi</button>`
    : `<button class="btn oro" data-fx="coriandoli" data-regalo="${esc(r.id)}" data-regalo-nome="${esc(String(r.nome || "Giocatore"))}">🎁 Manda un regalo (${VALORE} ✪)</button>`;
  return { carica, mandatoOggi, arrivati, manda, riscuoti, htmlTasto, VALORE, get caricato() { return caricato; } };
})();

// ---------------- ENIGMA DEL GIORNO ----------------
// Ogni giorno una battaglia uguale per tutti: la tua squadra è già fatta (5 carte scelte dal giorno), l'avversario
// anche. Vince chi lo batte nel minor numero di turni: si può riprovare quanto si vuole, conta il risultato migliore.
// La prima vittoria del giorno dà monete. La difficoltà la tara una simulazione (uguale per tutti: stesso seme).
const Enigma = (() => {
  const VISTA = "modo-enigma";
  const oggi = () => { const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const semeDi = s => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  let cache = null;
  function delGiorno() {
    const g = oggi(); if (cache && cache.giorno === g) return cache;
    const rng = mulberry32(semeDi("enigma:" + g));
    const buone = CARTE.filter(c => c.rarita !== "jolly" && !SERIE[c.serie].jolly);
    const pesca = (r, escl) => { const p = buone.filter(c => c.rarita === r && !escl.includes(c.id)); return p[Math.floor(rng() * p.length)].id; };
    const mie = [], loro = [];
    for (const r of ["leggendaria", "epica", "epica", "rara", "rara"]) mie.push(pesca(r, mie));
    for (const r of ["leggendaria", "leggendaria", "epica", "epica", "rara"]) loro.push(pesca(r, mie.concat(loro)));
    const campo = ORDINE_CAMPI[Math.floor(rng() * ORDINE_CAMPI.length)];
    const mia = mie.map(id => ({ id, liv: 22, lode: false, olo: false, ultra: false, asc: 0 }));
    // taratura: il livello dei nemici (tra 10 e 30) che fa vincere circa la metà delle volte giocando bene. Sale di
    // livello finché le vittorie scendono sotto il 50% e tiene il più vicino al 50%. Stesse partite per tutti (stesso seme).
    // Esempio: livello 17 → 58% di vittorie, livello 18 → 46%: tiene il 18 (46 è più vicino a 50 di 58).
    const prova = L => { const r2 = mulberry32(semeDi("taratura:" + g + L)); let v = 0;
      for (let k = 0; k < 24; k++) if (partitaSimulata(mia, loro.map(id => ({ id, liv: L, lode: false })), { campo, rng: r2, abilitaA: .85, abilitaB: .9 }).vinta) v++;
      return v / 24; };
    // il calcolo dura qualche decimo di secondo: lo ricordo per il resto della giornata
    const chiave = "noiverso-enigma-liv:" + g;
    let liv = 0; try { liv = +localStorage.getItem(chiave) || 0; } catch (e) {}
    if (!(liv >= 10 && liv <= 30)) {
      liv = 10; let prima = prova(10);
      for (let L = 11; L <= 30 && prima > .5; L++) { const ora = prova(L); liv = Math.abs(ora - .5) < Math.abs(prima - .5) ? L : L - 1; prima = ora; if (ora <= .5) break; }
      try { localStorage.setItem(chiave, String(liv)); } catch (e) {}
    }
    cache = { giorno: g, mia, nemici: loro.map(id => ({ id, liv, lode: false })), campo, liv };
    return cache;
  }
  const mio = () => (S.enigma && S.enigma.giorno === oggi()) ? S.enigma : null;   // { giorno, migliore (turni), inviato (turni confermati dal server), tentativi, premiato }
  let classifica = null, ultimo = null, erroreInvio = "", inCorso = false, caricataAlle = 0;
  async function caricaClassifica(controlla = true) {
    if (!socialeAttivo()) return;
    try { classifica = { giorno: oggi(), righe: await rpcSociale("classifica_enigma", { giorno: oggi() }) || [] }; }
    catch (e) { classifica = { giorno: oggi(), righe: classifica && classifica.righe || [], errore: String(e.message || e) }; }
    caricataAlle = Date.now();
    // controllo finale: ho un risultato di oggi ma in classifica non ci sono (e non è piena)? Allora il server non
    // l'ha salvato davvero: lo rimando subito, una volta sola per apertura (niente giri infiniti)
    const m = mio();
    if (controlla && m && m.migliore && !S.admin && !classifica.errore && Array.isArray(classifica.righe) && classifica.righe.length < 50
        && !classifica.righe.some(r => r.id === Archivio.uid)) { m.inviato = 0; return invia(false); }
    if (vista === VISTA && !B) disegnaQuieto();
  }
  // manda al server il risultato migliore di oggi se non l'ha ancora ricevuto (anche se un invio prima era fallito,
  // per esempio offline o prima di aggiornare il database), poi ricarica la classifica.
  // Vale come ricevuto solo se il server risponde con il numero di turni che ha salvato (una versione vecchia
  // del database poteva rispondere «niente» senza salvare).
  async function invia(controlla = true) {
    const m = mio();
    if (inCorso || !m || !m.migliore || m.inviato === m.migliore || !socialeAttivo() || S.admin) return caricaClassifica(controlla);
    inCorso = true;
    try {
      const salvato = await rpcSociale("registra_enigma", { giorno: m.giorno, turni: m.migliore });
      if (Number.isFinite(+salvato) && +salvato > 0 && +salvato <= m.migliore) { m.inviato = m.migliore; erroreInvio = ""; salva(); }
      else erroreInvio = "il server non ha salvato il risultato (esegui di nuovo schema.sql su Supabase)";
    } catch (e) { erroreInvio = String(e.message || e); }
    inCorso = false;
    return caricaClassifica(controlla);
  }
  function gioca() {
    const E = delGiorno();
    const L = { id: "enigma", nome: "Enigma del giorno", abilita: .9, liv: [E.liv, E.liv], premio: 0, punti: 0, xp: 0, modo: Enigma, campo: E.campo,
      squadraMia: E.mia.map(x => Object.assign({}, x)) };
    avviaSfida(L, null, E.nemici.map(x => Object.assign({}, x)), true);
  }
  function prepara() {}
  function chiudi() {
    const vinto = B.vincitore === 0, turni = Math.max(1, B.turno - 1), g = oggi();   // B.turno è già quello dopo l'ultimo giocato
    const m = mio() || { giorno: g, migliore: 0, tentativi: 0, premiato: false };
    m.tentativi++;
    let premio = 0, record = false;
    if (vinto) {
      if (!m.migliore || turni < m.migliore) { m.migliore = turni; record = true; }
      if (!m.premiato && !S.admin) { premio = piuMonete(150); S.monete += premio; m.premiato = true; aggiungiXP(ridXP(80)); }
    }
    S.enigma = m; ultimo = { vinto, turni, premio, record };
    salva(); aggiornaBattaglia();
    if (vinto) invia();
  }
  function htmlFine() {
    const e = ultimo || { vinto: B.vincitore === 0, turni: Math.max(1, B.turno - 1) };
    return `<div class="fine ${e.vinto ? "vinto" : "perso"}"><b>${e.vinto ? `Risolto in ${e.turni} turni!` : "Non questa volta"}</b>
      <span>${e.vinto ? `${e.record ? "È il tuo risultato migliore di oggi. " : `Il tuo migliore di oggi resta ${mio() ? mio().migliore : e.turni} turni. `}${e.premio ? `+${e.premio} monete per la prima vittoria del giorno.` : ""}` : "Riprova: la squadra e l'avversario restano quelli di oggi."}</span>
      <div class="azioni centro"><button class="btn primario" data-fx="onda" data-azione="enigma-gioca">Riprova</button><button class="btn" data-azione="esci-battaglia">Classifica</button></div></div>`;
  }
  function htmlPagina() {
    const E = delGiorno(), m = mio();
    // a ogni apertura della pagina: rimanda il risultato se serve e ricarica la classifica (gli amici giocano nel frattempo)
    if (!classifica || classifica.giorno !== oggi()) classifica = { giorno: oggi(), righe: null };
    // (al massimo ogni 10 secondi: ridisegnare la pagina dopo il caricamento non fa ripartire un altro caricamento)
    if (!inCorso && Date.now() - caricataAlle > 10000) { caricataAlle = Date.now(); invia(); }
    const righe = classifica.righe;
    return `<div class="enigma">
      <p class="nota">Ogni giorno la stessa battaglia per tutti: squadra e avversario sono già decisi. Vinci nel <b>minor numero di turni</b>: puoi riprovare quanto vuoi, conta il risultato migliore. La prima vittoria del giorno dà ${piuMonete(150)} monete.</p>
      <div class="en-riga"><span class="en-tit">La tua squadra (livello 22)</span><div class="en-carte">${E.mia.map(x => htmlCarta(PER_ID[x.id], { piccola: true, liv: x.liv, lode: false, olo: false, ultra: false, cc: "", stelle: 0 })).join("")}</div></div>
      <div class="en-riga"><span class="en-tit">L'avversario (livello ${E.liv}) · campo ${esc(CAMPI[E.campo] ? CAMPI[E.campo].nome : E.campo)}</span><div class="en-carte">${E.nemici.map(x => htmlCarta(PER_ID[x.id], { piccola: true, liv: x.liv, lode: false, olo: false, ultra: false, cc: "", stelle: 0 })).join("")}</div></div>
      <div class="azioni centro"><button class="btn oro grande" data-fx="spinta" data-azione="enigma-gioca">${m && m.migliore ? `Riprova (il tuo migliore: ${m.migliore} turni)` : m ? "Riprova" : "Gioca l'enigma"}</button></div>
      <div class="cm-box en-classifica"><h3>🧩 Classifica di oggi</h3>${!socialeAttivo() ? `<p class="nota">La classifica si vede solo giocando online.</p>` : righe === null ? `<p class="nota">Carico…</p>` : righe.length
        ? `<ol>${righe.slice(0, 15).map((r, i) => `<li class="${r.id === Archivio.uid ? "io" : ""}"><span>${["🥇", "🥈", "🥉"][i] || i + 1 + "."}</span><b>${esc(String(r.nome || "Giocatore"))}</b><em>${num(r.turni)} turni</em></li>`).join("")}</ol>`
        : `<p class="nota">${classifica.errore ? "" : "Nessuno l'ha ancora risolto oggi: il primo posto è libero."}</p>`}
        ${S.admin ? `<p class="nota">Sei nello slot admin: i risultati di qui non vanno in classifica.</p>` : ""}
        ${socialeAttivo() && (classifica.errore || erroreInvio) ? `<p class="nota errore">Non riesco ${erroreInvio ? "a mandare il tuo risultato" : "a leggere la classifica"}: ${esc(erroreInvio || classifica.errore)}. Riprovo da solo quando riapri questa pagina.</p>` : ""}
        ${m && m.migliore && m.inviato !== m.migliore && socialeAttivo() && !S.admin && !erroreInvio ? `<p class="nota">Sto mandando il tuo risultato…</p>` : ""}</div>
    </div>`;
  }
  const fattoOggi = () => !!(mio() && mio().migliore);
  return { vista: VISTA, invia, delGiorno, gioca, prepara, chiudi, htmlFine, htmlPagina, fattoOggi, oggi, mio };
})();
