// ============================================================
//  PER I COLLEZIONISTI: trofei con titoli, e scambi tra amici (si pagano con i potenziatori della carta)
// ============================================================

// ---------------- TROFEI E TITOLI ----------------
// Ogni trofeo dà monete (una volta) e sblocca un titolo da mostrare sotto il nome in classifica.
const Trofei = (() => {
  const TITOLI_SERIE = { eroi: "Supereroe", db: "Guerriero leggendario", dei: "Divinità", nueve: "Boss della mala", maghi: "Arcimago", demoni: "Signore degli Inferi", mestieri: "Stacanovista", simpson: "Re di Springfield", barbapapa: "Barbatrucco", starwars: "Maestro Jedi", elementi: "Avatar degli Elementi", creature: "Signore della Notte", cyborg: "Cyborg Supremo", carte: "Re del Mazzo", paesi: "Cittadino del Mondo", farwest: "Sceriffo della Frontiera", apocalisse: "Ultimo Sopravvissuto", giappone: "Shogun del Sol Levante", circo: "Direttore del Circo Stellare", inutili: "Re del Dolce Far Niente", colori: "Maestro dell'Arcobaleno", arte: "Curatore del Museo", ospiti: "Amico di Tutti" };
  const stelleTot = () => Object.values((S.storia || {}).stelle || {}).reduce((a, n) => a + n, 0);
  const lodi = () => possedute().filter(c => haLode(c.id)).length;
  const oloTot = () => Object.keys(S.olo || {}).filter(id => S.olo[id] && PER_ID[id]).length;
  const livMax = () => possedute().reduce((m, c) => Math.max(m, livello(c.id) || 1), 1);
  const st = k => (S.stats || {})[k] || 0;
  function elenco() {
    const v = [
      { id: "vittoria-1", nome: "Prima vittoria", desc: "Vinci la tua prima battaglia", titolo: "Recluta", premio: 50, prog: () => st("vittorie"), max: 1 },
      { id: "vittorie-50", nome: "Veterano", desc: "Vinci 50 battaglie", titolo: "Veterano", premio: 200, prog: () => st("vittorie"), max: 50 },
      { id: "vittorie-200", nome: "Leggenda della strada", desc: "Vinci 200 battaglie", titolo: "Leggenda", premio: 600, prog: () => st("vittorie"), max: 200 },
      { id: "carte-25", nome: "Collezionista", desc: "Trova 25 carte diverse", titolo: "Collezionista", premio: 150, prog: () => possedute().length, max: 25 },
      { id: "carte-50", nome: "Archivista", desc: "Trova 50 carte diverse", titolo: "Archivista", premio: 300, prog: () => possedute().length, max: 50 },
      { id: "carte-tutte", nome: "Album completo", desc: `Trova tutte le ${CARTE.length} carte`, titolo: "Completista", premio: 1000, prog: () => possedute().length, max: CARTE.length },
    ];
    for (const id of ORDINE_SERIE) {
      const tot = CARTE.filter(c => c.serie === id).length;
      if (tot) v.push({ id: `serie-${id}`, nome: `Serie ${SERIE[id].nome} completa`, desc: `Trova tutte le ${tot} carte della serie ${SERIE[id].nome}`, titolo: TITOLI_SERIE[id] || `Re della serie ${SERIE[id].nome}`, premio: 300, prog: () => possedute().filter(c => c.serie === id).length, max: tot, colore: SERIE[id].colore });
    }
    v.push(
      { id: "olo-1", nome: "Che brillantezza", desc: "Trova una carta olografica", titolo: "Brillante", premio: 100, prog: oloTot, max: 1 },
      { id: "olo-5", nome: "Cacciatore di arcobaleni", desc: "Trova 5 carte olografiche", titolo: "Arcobaleno", premio: 400, prog: oloTot, max: 5 },
      { id: "livello-10", nome: "Allenatore", desc: "Porta una carta al livello 10", titolo: "Allenatore", premio: 100, prog: livMax, max: 10 },
      { id: "livello-30", nome: "Al massimo", desc: "Porta una carta al livello 30", titolo: "Maestro", premio: 300, prog: livMax, max: 30 },
      { id: "lode-1", nome: "Trenta e lode", desc: "Porta una carta al 30 e lode", titolo: "Lodato", premio: 400, prog: lodi, max: 1 },
      { id: "bustine-50", nome: "Strappabustine", desc: "Apri 50 bustine", titolo: "Strappabustine", premio: 200, prog: () => st("bustine"), max: 50 },
      { id: "stelle-30", nome: "Narratore", desc: "Prendi 30 stelle nella storia", titolo: "Narratore", premio: 250, prog: stelleTot, max: 30 },
      { id: "ultra-1", nome: "Tocco Ultra", desc: "Trova la versione Ultra di una carta", titolo: "Ultra", premio: 500, prog: () => CARTE.filter(c => haUltra(c.id)).length, max: 1 },
      { id: "stelle-120", nome: "Giramondo", desc: "Prendi 120 stelle nella storia", titolo: "Giramondo", premio: 600, prog: stelleTot, max: 120 },
      { id: "pass-50", nome: "Fedelissimo", desc: "Arriva al livello 50 del pass", titolo: "Fedelissimo", premio: 300, prog: livelloPass, max: 50 },
      { id: "accessi-7", nome: "Sempre presente", desc: "Riscuoti il premio di accesso 7 giorni di fila", titolo: "Sempre presente", premio: 200, prog: () => st("serieMax"), max: 7 },
      // nov 2026: Lunga Notte e Scalata
      { id: "notte-1", nome: "Prima uscita", desc: "Finisci una Lunga Notte", titolo: "Nottambulo", premio: 100, prog: () => st("notti"), max: 1 },
      { id: "notte-boss", nome: "Oltre il buttafuori", desc: "Supera il primo boss della Lunga Notte (fermata 5)", titolo: "Buttafuori", premio: 250, prog: () => st("notteMax"), max: 5 },
      { id: "alba-1", nome: "Fino all'alba", desc: "Arriva all'alba nella Lunga Notte", titolo: "Re della notte", premio: 500, prog: () => st("albe"), max: 1 },
      { id: "alba-5", nome: "Cinque albe", desc: "Arriva all'alba 5 volte", titolo: "Signore dell'alba", premio: 1000, prog: () => st("albe"), max: 5 },
      { id: "scalata-5", nome: "Piano 5", desc: "Supera 5 piani in una Scalata", titolo: "Scalatore", premio: 150, prog: () => st("scalataMax"), max: 5 },
      { id: "scalata-10", nome: "Piano 10", desc: "Supera 10 piani in una Scalata", titolo: "Alpinista", premio: 400, prog: () => st("scalataMax"), max: 10 },
      { id: "scalata-15", nome: "Piano 15", desc: "Supera 15 piani in una Scalata", titolo: "Re della Torre", premio: 800, prog: () => st("scalataMax"), max: 15 },
      { id: "scalata-20", nome: "Oltre le nuvole", desc: "Supera 20 piani in una Scalata", titolo: "Oltre le nuvole", premio: 1500, prog: () => st("scalataMax"), max: 20 },
      // Storia · Livello Leggenda (i boss battuti: il server li conta sulle stelle salvate)
      { id: "leggenda-1", nome: "Oltre la storia", desc: "Batti il primo boss del Livello Leggenda", titolo: "Leggendario", premio: 300, prog: () => capitoliLeggenda(), max: 1 },
      { id: "leggenda-15", nome: "Metà leggenda", desc: "Batti 15 boss del Livello Leggenda", titolo: "Eroe leggendario", premio: 800, prog: () => capitoliLeggenda(), max: 15 },
      { id: "leggenda-30", nome: "Leggenda vivente", desc: "Finisci il Livello Leggenda (tutti i 30 boss)", titolo: "Leggenda vivente", premio: 2000, prog: () => capitoliLeggenda(), max: 30 },
    );
    // nov 2026: titoli del livello giocatore (ogni 10 livelli, fino al 100)
    if (typeof Livello !== "undefined") for (const L of Object.keys(Livello.TITOLI).map(Number)) v.push({ id: `giocatore-${L}`, nome: `Livello giocatore ${L}`, desc: `Arriva al livello giocatore ${L}`, titolo: Livello.TITOLI[L], premio: 100, prog: () => (S.lv ? Livello.info().liv : 1), max: L });
    if (window.NOIVERSO_SUPABASE) v.push(
      { id: "amici-10", nome: "Bullo di quartiere", desc: "Batti 10 volte la squadra di un amico", titolo: "Bullo di quartiere", premio: 300, prog: () => st("vinteAmici"), max: 10 },
      { id: "boss-20000", nome: "Ammazzaboss", desc: "Fai 20.000 danni ai boss del gruppo", titolo: "Ammazzaboss", premio: 300, prog: () => st("danniBoss"), max: 20000 },
      { id: "vivo-5", nome: "Campione dal vivo", desc: "Vinci 5 sfide dal vivo contro gli amici", titolo: "Campione dal vivo", premio: 400, prog: () => st("vinteVivo"), max: 5 },
      { id: "scambi-3", nome: "Mercante", desc: "Completa 3 scambi con gli amici", titolo: "Mercante", premio: 200, prog: () => st("scambi"), max: 3 },
    );
    return v;
  }
  const presi = () => S.trofei || {};
  const raggiunto = t => t.prog() >= t.max;
  const pronti = () => S.admin ? 0 : elenco().filter(t => raggiunto(t) && !presi()[t.id]).length;
  const annunciati = new Set();
  function controlla() {   // avvisa una volta quando un trofeo diventa riscuotibile
    // mentre apri una bustina niente annunci: rovinerebbero la sorpresa (arrivano quando la chiudi)
    const inBustina = () => !$("#apertura").hidden || !!$("#modale-corpo .apertura2d");
    if (S.admin || B || inBustina()) return;
    // nov 2026: più trofei insieme diventano un solo avviso (prima ne arrivavano 5 o 6 di fila)
    const nuovi = elenco().filter(t => raggiunto(t) && !presi()[t.id] && !annunciati.has(t.id));
    if (!nuovi.length) return;
    nuovi.forEach(t => annunciati.add(t.id));
    setTimeout(() => {
      if (inBustina()) { nuovi.forEach(t => annunciati.delete(t.id)); return; }
      const nomi = nuovi.map(t => t.nome);
      mostraAvviso(nomi.length === 1 ? `Trofeo sbloccato: ${nomi[0]}! Riscuotilo nell'Album, scheda Trofei.`
        : `${nomi.length} trofei sbloccati: ${nomi.slice(0, 3).join(", ")}${nomi.length > 3 ? ` e altri ${nomi.length - 3}` : ""}! Riscuotili nell'Album, scheda Trofei.`);
    }, 900);
  }
  function titoloAttuale() { const t = elenco().find(x => x.id === S.titolo); return t && presi()[t.id] ? t.titolo : ""; }
  const titoloId = () => titoloAttuale() ? S.titolo : "";
  function riscuoti(id, el) {
    const t = elenco().find(x => x.id === id);
    if (!t || !raggiunto(t) || presi()[id] || S.admin) return;
    S.trofei = Object.assign({}, presi(), { [id]: true });
    S.monete += t.premio;
    Livello.guadagna(Livello.PUNTI.trofeo);
    if (!S.titolo) S.titolo = id;
    salva(); aggiornaTesta(); Archivio.pubblicaClassifica();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 60, forma: "stella", colori: ["#f2c14e", "#fff3c4", "#ff2e46"], velocita: 8, dimensione: 6 }); }
    mostraAvviso(`${t.nome}: +${t.premio} monete e il titolo «${t.titolo}»`);
    disegna();
  }
  function scegliTitolo(id) {
    if (id && !presi()[id]) return;
    S.titolo = id || ""; salva(); Archivio.pubblicaClassifica(); disegna();
  }
  function html() {
    const v = elenco(), fatti = v.filter(t => presi()[t.id]).length;
    const ordine = t => presi()[t.id] ? 2 : raggiunto(t) ? 0 : 1;
    return `
    <div class="titolo-riga"><h2>Trofei</h2><p class="nota">${fatti}/${v.length} conquistati. Ogni trofeo dà monete e un titolo da mostrare in classifica.</p></div>
    <div class="titolo-scelto">Il tuo titolo: <b>${esc(titoloAttuale() || "nessuno")}</b>${titoloAttuale() ? ` <button class="btn piccolo" data-titolo="">Toglilo</button>` : ""}</div>
    <div class="trofei">${[...v].sort((a, b) => ordine(a) - ordine(b)).map(t => {
      const p = Math.min(t.prog(), t.max), preso = presi()[t.id], pronto = raggiunto(t) && !preso, usato = S.titolo === t.id;
      return `<div class="trofeo ${preso ? "preso" : pronto ? "pronto" : ""}" ${t.colore ? `style="--c:${t.colore}"` : ""}>
        <div class="trofeo-icona">${preso ? "🏆" : pronto ? "✦" : "🔒"}</div>
        <div class="trofeo-testo"><b>${esc(t.nome)}</b><small>${esc(t.desc)}</small>
          <div class="missione-barra"><i style="--p:${Math.round(p / t.max * 100)}%"></i><span>${t.max >= 1000 ? `${p.toLocaleString("it-IT")}/${t.max.toLocaleString("it-IT")}` : `${p}/${t.max}`}</span></div>
          <small class="trofeo-premio">Titolo «${esc(t.titolo)}» · ${t.premio} monete</small></div>
        <div class="trofeo-azione">${pronto ? `<button class="btn oro piccolo" data-fx="coriandoli" data-trofeo="${t.id}">Riscuoti</button>`
          : preso ? (usato ? `<span class="chip sel">In uso</span>` : `<button class="btn piccolo" data-titolo="${t.id}">Usa titolo</button>`) : ""}</div>
      </div>`; }).join("")}</div>`;
  }
  // trofei di cui si occupa qualcun altro (la serie completata si annuncia quando giri la carta, non prima)
  const silenzia = ids => ids.forEach(id => annunciati.add(id));
  const trova = id => elenco().find(t => t.id === id);
  const titoliPresi = () => elenco().filter(t => presi()[t.id] && t.titolo);
  const titoliTotali = () => elenco().filter(t => t.titolo).length;
  return { html, pronti, controlla, riscuoti, scegliTitolo, titoloAttuale, titoloId, silenzia, trova, titoliPresi, titoliTotali };
})();

// ---------------- SCAMBI ----------------
const Scambi = (() => {
  let lista = null, inArrivo = 0, errore = null, nuovo = null;   // nuovo = scambio in preparazione: { amico, nome, chiedo, offro, doppioni }
  const attivo = () => socialeAttivo();
  const nome = id => { const r = (classificaDati || []).find(x => x.id === id); return r ? String(r.nome || "Giocatore") : "un amico"; };
  // Scambiare una carta costa i potenziatori che ti dà un suo doppione (10 comune, 12 rara, 24 epica, 60 leggendaria):
  // è come dare via un doppione. La carta resta nel tuo album.
  const costo = id => POT_DOPPIONE[PER_ID[id].rarita];
  const mieOfferte = id => (lista || []).filter(x => x.da === Archivio.uid && x.offro === id && (x.stato === "aperto" || (x.stato === "accettato" && !x.ritirato))).length;
  const riservati = id => PER_ID[id] ? mieOfferte(id) * costo(id) : 0;   // potenziatori promessi in proposte non ancora chiuse
  const daRitirare = x => x.da === Archivio.uid && x.stato === "accettato" && !x.ritirato;
  const potLiberi = id => Math.max(0, ((S.pot || {})[id] || 0) - riservati(id));
  const offribili = rarita => possedute().filter(c => c.rarita === rarita && potLiberi(c.id) >= costo(c.id));

  async function carica() {
    if (!attivo()) return;
    try {
      const { data, error } = await sbSociale().from("scambi").select("*").order("creato", { ascending: false }).limit(40);
      if (error) throw error;
      lista = data || []; errore = null;
      inArrivo = lista.filter(x => (x.a === Archivio.uid && x.stato === "aperto") || daRitirare(x)).length;
    } catch (e) { errore = "Non riesco a leggere gli scambi. Hai eseguito di nuovo schema.sql su Supabase?"; }
    aggiornaTesta();
    if (vista === "album" && albumScheda === "scambi" && !B) disegna();
  }
  // una carta che arriva da uno scambio conta come se l'avessi trovata in una bustina
  function ricevi(id) {
    const prima = S.carte[id] || 0, r = PER_ID[id].rarita, inf = infoCarta(id);
    S.carte[id] = prima + 1;
    if (prima === 0) { S.liv[id] = S.liv[id] || 1; return "Nuova carta!"; }
    if (inf.liv >= LIVELLO_MAX) { S.monete += MONETE_DOPPIONE_30[r]; return `Doppione: +${MONETE_DOPPIONE_30[r]} monete`; }
    S.pot[id] = (S.pot[id] || 0) + POT_DOPPIONE[r]; return `Doppione: +${POT_DOPPIONE[r]} potenziatori`;
  }
  function dai(id, quanti) { S.pot[id] = Math.max(0, ((S.pot || {})[id] || 0) - (quanti || costo(id))); }
  function mostraRicevuta(titolo, testo, id, cosa) {
    apriModale(`<div class="codice-modale"><span class="codice-tag">Scambio completato</span><h2>${esc(titolo)}</h2>
      <div class="scambio-ricevuta">${htmlCarta(PER_ID[id])}</div>
      <p>${testo}</p><p class="codice-premio"><b>${esc(cosa)}</b></p>
      <div class="azioni centro"><button class="btn primario" data-azione="chiudi">Grande!</button></div></div>`);
  }
  // chi ha proposto: ritira le carte degli scambi che gli amici hanno accettato
  async function ritira(manuale, el) {
    if (!attivo() || S.admin) return;
    if (el) el.disabled = true;
    try {
      const fatti = await rpcSociale("ritira_scambi");
      if (!fatti || !fatti.length) { if (manuale) { mostraAvviso("Niente da ritirare: la carta è già nel tuo album."); carica(); } return; }
      if (!classificaDati) await new Promise(ok => { avviaClassifica(); setTimeout(ok, 1500); });
      const righe = [];
      for (const f of fatti) { if (!PER_ID[f.ricevi]) continue; dai(f.dai, f.costo); righe.push({ f, cosa: ricevi(f.ricevi) }); S.stats.scambi = (S.stats.scambi || 0) + 1; }
      salva(); aggiornaTesta();
      const x = righe[0], altri = righe.length - 1;
      const mostra = () => { if (!manuale && (B || Tutorial.attivo || !$("#modale").hidden || !$("#accesso").hidden)) { setTimeout(mostra, 2500); return; }
        const sc = (lista || []).find(s => s.id === x.f.id);
        mostraRicevuta(x.cosa.startsWith("Doppione") ? `Potenziatori per ${PER_ID[x.f.ricevi].nome}` : `Hai ricevuto ${PER_ID[x.f.ricevi].nome}`, `${(t => t.charAt(0).toUpperCase() + t.slice(1))(sc ? esc(nome(sc.a)) : "un amico")} ha accettato il tuo scambio: gli hai dato una copia di ${esc(PER_ID[x.f.dai].nome)} (${x.f.costo || costo(x.f.dai)} suoi potenziatori; la carta resta nel tuo album).${altri ? ` E altri ${altri} scambi sono andati a buon fine.` : ""}`, x.f.ricevi, x.cosa); };
      if (x) setTimeout(mostra, manuale ? 0 : 800);
      carica();
    } catch (e) { if (manuale) { mostraAvviso(e.message); if (el) el.disabled = false; } }
  }
  async function rispondi(id, accetto, el) {
    if (el) el.disabled = true;
    try {
      const r = await rpcSociale("rispondi_scambio", { scambio: +id, accetto });
      if (r.stato === "accettato") {
        dai(r.dai, r.costo); const cosa = ricevi(r.ricevi); S.stats.scambi = (S.stats.scambi || 0) + 1;
        salva(); aggiornaTesta();
        const sc = (lista || []).find(s => s.id === +id);
        mostraRicevuta(cosa.startsWith("Doppione") ? `Potenziatori per ${PER_ID[r.ricevi].nome}` : `Hai ricevuto ${PER_ID[r.ricevi].nome}`, `Hai dato una copia di ${esc(PER_ID[r.dai].nome)} a ${sc ? esc(nome(sc.da)) : "un amico"}: ti è costata ${r.costo || costo(r.dai)} suoi potenziatori, la carta resta nel tuo album.`, r.ricevi, cosa);
      } else mostraAvviso("Proposta rifiutata.");
    } catch (e) { mostraAvviso(e.message); }
    carica();
  }
  async function annulla(id) { try { await rpcSociale("annulla_scambio", { scambio: +id }); mostraAvviso("Proposta annullata."); } catch (e) { mostraAvviso(e.message); } carica(); }

  // ---- proporre uno scambio: amico → carta che chiedi → carta che offri → conferma ----
  function apriNuovo() {
    if (!attivo()) return;
    if (!classificaDati) { avviaClassifica(); setTimeout(apriNuovo, 900); return; }
    nuovo = null;
    const altri = classificaDati.filter(r => r.id !== Archivio.uid);
    apriModale(`<div class="amici-modale"><h2>Nuovo scambio</h2><p class="nota">Con chi vuoi scambiare?</p>
      ${altri.length ? `<ul class="amici-lista">${altri.map(r => `<li>${htmlAvatar(String(r.avatar || ""), "mini")}<div class="amico-info"><b>${esc(String(r.nome || "Giocatore"))}</b><small>${Number(r.carte) || 0} carte</small></div><button class="btn primario piccolo" data-scambio-amico="${esc(r.id)}">Scegli</button></li>`).join("")}</ul>` : `<p class="nota">Non c'è ancora nessun amico in classifica.</p>`}</div>`);
  }
  async function sceltoAmico(id) {
    nuovo = { amico: id, nome: nome(id) };
    $("#modale-corpo").innerHTML = `<div class="amici-modale"><h2>Scambio con ${esc(nuovo.nome)}</h2><p class="nota">Guardo le sue carte…</p></div>`;
    try { nuovo.doppioni = (await rpcSociale("doppioni_amico", { amico: id })).filter(c => PER_ID[c]); }
    catch (e) { mostraAvviso(e.message); chiudiModale(); return; }
    passo();
  }
  function griglia(carte, attr) {
    return `<div class="scambio-griglia">${carte.map(c => `<button type="button" class="scambio-carta" ${attr}="${c.id}">${htmlCarta(c, { piccola: true })}<small>${RARITA[c.rarita].nome}${attr === "data-scambio-offro" ? ` · costa ${costo(c.id)} pot. (ne hai ${potLiberi(c.id)})` : S.carte[c.id] ? ` · ce l'hai: +${costo(c.id)} pot.` : " · ti manca"}</small></button>`).join("")}</div>`;
  }
  function passo() {
    const corpo = $("#modale-corpo"); if (!corpo || !nuovo) return;
    // prima le carte che ti mancano, poi quelle che hai già (da quelle ricevi potenziatori)
    const ordina = l => l.map(id => PER_ID[id]).sort((a, b) => (S.carte[a.id] ? 1 : 0) - (S.carte[b.id] ? 1 : 0) || rangoRarita(b.rarita) - rangoRarita(a.rarita));
    if (!nuovo.chiedo) {
      corpo.innerHTML = `<div class="amici-modale"><h2>Cosa vuoi da ${esc(nuovo.nome)}?</h2>
        ${nuovo.doppioni.length ? `<p class="nota">Carte che ${esc(nuovo.nome)} può scambiare (ha abbastanza potenziatori di quella carta). Se la carta ti manca la ricevi; se ce l'hai già ricevi i suoi <b>potenziatori</b>, come un doppione: così vi aiutate a potenziare. Solo carte della stessa rarità.</p>${griglia(ordina(nuovo.doppioni), "data-scambio-chiedo")}`
          : `<p class="nota">${esc(nuovo.nome)} non ha carte con abbastanza potenziatori per scambiarle. Riprova con un altro amico.</p><div class="azioni centro"><button class="btn" data-azione="nuovo-scambio">Scegli un altro amico</button></div>`}</div>`;
    } else if (!nuovo.offro) {
      const r = PER_ID[nuovo.chiedo].rarita, miei = offribili(r);
      corpo.innerHTML = `<div class="amici-modale"><h2>Cosa offri in cambio?</h2>
        <p class="nota">Chiedi <b>${esc(PER_ID[nuovo.chiedo].nome)}</b> (${RARITA[r].nome}). Offri una tua carta ${RARITA[r].nome.toLowerCase()}: ti costa ${POT_DOPPIONE[r]} potenziatori di quella carta, cioè quanto vale un suo doppione. La carta resta nel tuo album.</p>
        ${miei.length ? griglia(miei.sort((a, b) => potLiberi(b.id) - potLiberi(a.id)), "data-scambio-offro") : `<p class="nota">Nessuna tua carta ${RARITA[r].nome.toLowerCase()} ha almeno ${POT_DOPPIONE[r]} potenziatori liberi. Apri qualche bustina: i doppioni danno potenziatori.</p>`}
        <div class="azioni centro"><button class="btn" data-scambio-indietro="chiedo">Indietro</button></div></div>`;
    } else {
      const a = PER_ID[nuovo.offro], b = PER_ID[nuovo.chiedo];
      corpo.innerHTML = `<div class="amici-modale"><h2>Confermi?</h2>
        <div class="scambio-riepilogo"><div><small>Dai una copia (−${costo(a.id)} pot.)</small>${htmlCarta(a, { piccola: true })}</div><span class="scambio-freccia">⇄</span><div><small>${S.carte[b.id] ? `Ricevi +${costo(b.id)} potenziatori` : "Ricevi la carta"}</small>${htmlCarta(b, { piccola: true })}</div></div>
        <p class="nota">${esc(nuovo.nome)} vedrà la proposta e potrà accettarla o rifiutarla. Dura 7 giorni. Intanto quei ${costo(a.id)} potenziatori restano messi da parte; se rifiuta o annulli, tornano liberi.</p>
        <div class="azioni centro"><button class="btn" data-scambio-indietro="offro">Indietro</button><button class="btn primario" data-fx="onda" data-azione="proponi-scambio">Proponi lo scambio</button></div></div>`;
    }
  }
  function scegli(cosa, id) { if (!nuovo) return; nuovo[cosa] = id; passo(); }
  function indietro(cosa) { if (!nuovo) return; nuovo[cosa] = null; if (cosa === "chiedo") nuovo.offro = null; passo(); }
  async function proponi(el) {
    if (!nuovo || !nuovo.offro || !nuovo.chiedo) return;
    if (el) el.disabled = true;
    try { await rpcSociale("proponi_scambio", { amico: nuovo.amico, offro: nuovo.offro, chiedo: nuovo.chiedo }); chiudiModale(); mostraAvviso(`Proposta inviata a ${nuovo.nome}.`); nuovo = null; }
    catch (e) { mostraAvviso(e.message); if (el) el.disabled = false; }
    carica();
  }

  function htmlRiga(x) {
    const ricevuta = x.a === Archivio.uid, a = PER_ID[x.offro], b = PER_ID[x.chiedo];
    if (!a || !b) return "";
    const chi = esc(nome(ricevuta ? x.da : x.a));
    const stato = { aperto: "In attesa", accettato: "Accettato", rifiutato: "Rifiutato", annullato: "Annullato" }[x.stato];
    return `<li class="scambio-riga ${x.stato}">
      <div class="scambio-chi"><b>${chi}</b><small>${ricevuta ? "ti offre ⇄ ti chiede" : "gli offri ⇄ gli chiedi"}</small></div>
      <div class="scambio-coppia">${htmlCarta(a, { mini: true })}<span>⇄</span>${htmlCarta(b, { mini: true })}</div>
      <div class="scambio-nomi"><span>${esc(a.nome)}</span><span>${esc(b.nome)}${ricevuta ? ` <small>(costa ${costo(b.id)} pot., ne hai ${potLiberi(b.id)})</small>` : ""}</span></div>
      <div class="scambio-azioni">${daRitirare(x) ? `<button class="btn primario piccolo" data-fx="stelle" data-scambio-ritira="${x.id}">${S.carte[x.chiedo] ? "Ricevi potenziatori" : "Ricevi carta"}</button>` : x.stato === "aperto" ? (ricevuta
        ? `<button class="btn primario piccolo" data-fx="onda" data-scambio-accetta="${x.id}">Accetta</button><button class="btn piccolo" data-scambio-rifiuta="${x.id}">Rifiuta</button>`
        : `<button class="btn piccolo" data-scambio-annulla="${x.id}">Annulla</button>`) : `<span class="scambio-stato">${stato}</span>`}</div>
    </li>`;
  }
  function html() {
    if (!attivo()) return `<div class="titolo-riga"><h2>Scambi</h2></div><p class="nota">Gli scambi funzionano nella versione online del gioco.</p>`;
    if (!lista && !errore) setTimeout(carica, 0);
    if (!classificaDati) setTimeout(avviaClassifica, 0);   // per i nomi degli amici
    const ricevute = (lista || []).filter(x => x.a === Archivio.uid && x.stato === "aperto");
    const mie = (lista || []).filter(x => x.da === Archivio.uid && x.stato === "aperto");
    const pronte = (lista || []).filter(daRitirare);
    const vecchie = (lista || []).filter(x => x.stato !== "aperto" && !daRitirare(x)).slice(0, 8);
    return `
    <div class="titolo-riga"><h2>Scambi</h2><p class="nota">Scambia con gli amici qualsiasi carta della stessa rarità. Dare una copia costa i potenziatori di un doppione di quella carta (10 comune, 12 rara, 24 epica, 60 leggendaria) e la carta resta nel tuo album. Chi riceve una carta che non ha la trova nell'album; se ce l'ha già riceve quei potenziatori: così vi aiutate a potenziare.</p>
      <button class="btn primario" data-fx="onda" data-azione="nuovo-scambio" ${S.admin ? "disabled" : ""}>Nuovo scambio</button></div>
    ${errore ? `<p class="errore">${esc(errore)}</p>` : !lista ? `<p class="nota">Carico gli scambi…</p>` : `
    ${pronte.length ? `<h3 class="scambi-titolo">Accettati: ritira la carta <span class="badge-in">${pronte.length}</span></h3><ul class="scambi">${pronte.map(htmlRiga).join("")}</ul>` : ""}
    <h3 class="scambi-titolo">Proposte per te ${ricevute.length ? `<span class="badge-in">${ricevute.length}</span>` : ""}</h3>
    ${ricevute.length ? `<ul class="scambi">${ricevute.map(htmlRiga).join("")}</ul>` : `<p class="nota">Nessuna proposta in arrivo.</p>`}
    <h3 class="scambi-titolo">Le tue proposte</h3>
    ${mie.length ? `<ul class="scambi">${mie.map(htmlRiga).join("")}</ul>` : `<p class="nota">Non hai proposte aperte.</p>`}
    ${vecchie.length ? `<h3 class="scambi-titolo">Ultimi scambi</h3><ul class="scambi vecchi">${vecchie.map(htmlRiga).join("")}</ul>` : ""}`}`;
  }
  // ogni minuto ricontrolla gli scambi, così una proposta accettata compare anche senza riaprire il gioco
  setInterval(() => { if (attivo() && !B && document.visibilityState === "visible") carica(); }, 60000);
  return { riservati, html, carica, ritira, rispondi, annulla, apriNuovo, sceltoAmico, scegli, indietro, proponi, get inArrivo() { return inArrivo; } };
})();
