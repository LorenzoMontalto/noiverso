// ============================================================
//  SFIDE TRA AMICI e BOSS DEL GRUPPO (solo nella versione online)
//  Le regole che contano (squadra dell'amico, punti, limiti di oggi, PV del boss) stanno su Supabase:
//  qui il gioco mostra e combatte, il server decide.
// ============================================================
const sbSociale = () => window.NoiversoAccesso && window.NoiversoAccesso.sb;
const socialeAttivo = () => !!window.NOIVERSO_SUPABASE && Archivio.modo === "cloud";
async function rpcSociale(nome, args) {
  const { data, error } = await sbSociale().rpc(nome, args || {});
  if (error) throw new Error(error.message && !/fetch|network/i.test(error.message) ? error.message : "Non riesco a collegarmi. Sei online?");
  return data;
}

// ---------------- SFIDE TRA AMICI ----------------
const Amici = (() => {
  const VINTE_PAGATE = 5;   // vittorie al giorno contro amici che danno le monete piene

  async function sfidaOggi(id) {
    const da = new Date(); da.setHours(0, 0, 0, 0);
    const { data } = await sbSociale().from("sfide_amici").select("sfidato").eq("sfidante", Archivio.uid).gte("quando", da.toISOString());
    const righe = data || [];
    return { coppia: righe.filter(r => r.sfidato === id).length, totale: righe.length };
  }

  async function sfida(id) {
    if (!socialeAttivo()) { mostraAvviso("Le sfide tra amici funzionano nella versione online del gioco."); return; }
    if (B) return;
    if (squadraAttiva().carte.length < CARTE_SQUADRA) { mostraAvviso("Prima prepara una squadra completa."); vai("squadra"); return; }
    let amico;
    try {
      amico = await rpcSociale("squadra_amico", { amico: id });
      if (!S.admin) {
        const o = await sfidaOggi(id);
        if (o.coppia >= 3) { mostraAvviso(`Oggi hai già sfidato ${amico.nome} 3 volte: riprova domani.`); return; }
        if (o.totale >= 12) { mostraAvviso("Per oggi hai fatto tutte le sfide tra amici: riprova domani."); return; }
      }
    } catch (e) { mostraAvviso(e.message); return; }
    const sq = (amico.squadra || []).filter(x => PER_ID[x.id]);
    if (sq.length < 3) { mostraAvviso(`${amico.nome} non ha ancora una squadra pronta.`); return; }
    chiudiModale();
    schermoIntero(true);
    setTimeout(() => avviaSfida({ id: "amico", nome: `Squadra di ${amico.nome}`, abilita: .85, liv: [1, 30], premio: 0, punti: 0, xp: 0,
      amico: { id, nome: amico.nome, avatar: amico.avatar, prova: !!S.admin }, graffitoNemico: amico.graffito && GRAFFITI_COPPIE[amico.graffito.id] ? amico.graffito : null }, null, sq), ridotto ? 0 : 220);
  }

  async function chiudi() {
    const L = livelloAttuale, a = L.amico, vinto = B.vincitore === 0;
    L.espCarte = premiaCarte(1.6, vinto);
    const g = new Date().toDateString();
    if (!S.amiciOggi || S.amiciOggi.giorno !== g) S.amiciOggi = { giorno: g, vinte: 0 };
    else S.amiciOggi = Object.assign({}, S.amiciOggi);
    const e = { vinto, monete: piuMonete(10), xp: XP_SCONFITTA, stato: a.prova ? "prova" : "invio" };
    if (vinto) {
      e.monete = piuMonete(S.amiciOggi.vinte < VINTE_PAGATE ? 90 : 20); e.xp = ridXP(110);
      S.amiciOggi.vinte++; S.stats.vittorie++; if (!a.prova) S.stats.vinteAmici = (S.stats.vinteAmici || 0) + 1;
      if (arena) arena.vittoria(0);
      setTimeout(() => { const el = $(".fine b"); if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 70, forma: "coriandolo", colori: ["#f2c14e", "#ff2e46", "#3fd8ff", "#ffffff"], velocita: 8, dimensione: 5, durata: 1500 }); } }, 200);
    } else S.stats.sconfitte++;
    S.monete += e.monete;
    const su = aggiungiXP(e.xp);
    L.esito = e;
    if (!a.prova) {
      Missioni.evento("amico", { vinto });
      if (vinto) Missioni.evento("vittoria", { squadra: B.lati[0].squadra.map(x => x.id) });
    }
    salva(); aggiornaTesta(); aggiornaBattaglia();
    if (su) setTimeout(() => mostraAvviso(`Pass: livello ${su} raggiunto!`), 900);
    if (!a.prova) {
      try { await rpcSociale("registra_sfida", { amico: a.id, vinto }); e.stato = "ok"; }
      catch (err) { e.stato = err.message; }
      Archivio.pubblicaClassifica();
      aggiornaBattaglia();
    }
  }

  function htmlFine() {
    const L = livelloAttuale, a = L.amico, e = L.esito || {};
    const punti = e.stato === "prova" ? `<small class="nota">Prova da admin: non conta in classifica.</small>`
      : e.stato === "invio" ? `<small class="nota">Registro il risultato…</small>`
      : e.stato === "ok" ? (e.vinto ? `<span class="punti-amico">Vittoria registrata: ${esc(a.nome)} lo vedrà tra le sfide ricevute</span>` : `<span class="punti-amico perso">${esc(a.nome)} si è difeso</span>`)
      : `<small class="errore">${esc(e.stato)}</small>`;
    return `<div class="fine ${e.vinto ? "vinto" : "perso"}">
      <b>${e.vinto ? "Vittoria!" : "Sconfitta"}</b>
      <span>${e.vinto ? `Hai battuto la squadra di ${esc(a.nome)}!` : `La squadra di ${esc(a.nome)} ha resistito.`}</span>
      ${punti}
      <span>+${e.monete} monete · +${e.xp} XP</span>
      ${htmlEspCarte()}
      <div class="azioni centro"><button class="btn primario" data-fx="onda" data-sfida-amico="${esc(a.id)}">Rivincita</button><button class="btn" data-fx="salto" data-azione="esci-amici">Torna agli amici</button></div>
    </div>`;
  }

  // Elenco degli amici da sfidare (dalla classifica)
  function htmlElenco() {
    if (!socialeAttivo()) return `<p class="nota">Le sfide tra amici funzionano nella versione online del gioco.</p>`;
    if (!classificaDati) { avviaClassifica(); return `<p class="nota">Carico gli amici…</p>`; }
    const altri = classificaDati.filter(r => r.id !== Archivio.uid);
    if (!altri.length) return `<p class="nota">Non c'è ancora nessun amico in classifica. Appena qualcuno vince una battaglia compare qui.</p>`;
    return `<ul class="amici-lista">${altri.map(r => `<li>
      ${htmlAvatar(String(r.avatar || ""), "mini")}
      <div class="amico-info"><b>${esc(String(r.nome || "Giocatore"))}</b><small>${Number(r.punti) || 0} punti · ${Number(r.vinte_vivo) || 0} vinte dal vivo</small></div>
      <button class="btn primario piccolo" data-fx="spinta" data-sfida-amico="${esc(r.id)}">Sfida</button></li>`).join("")}</ul>`;
  }
  function apriElenco() {
    apriModale(`<div class="amici-modale"><h2>Sfida un amico</h2>
      <p class="nota">Combatti contro la squadra che l'amico ha in campo adesso, guidata dal computer. Vinci monete ed esperienza, ma niente punti classifica: quelli si fanno solo con le sfide dal vivo. Massimo 3 sfide al giorno contro lo stesso amico.</p>
      <div id="amici-elenco">${htmlElenco()}</div></div>`);
  }
  function aggiornaElenco() { const el = $("#amici-elenco"); if (el) el.innerHTML = htmlElenco(); }

  // Avviso all'ingresso: le sfide ricevute mentre non c'eri
  async function controllaRicevute() {
    if (!socialeAttivo() || S.admin) return;
    try {
      const { data } = await sbSociale().from("sfide_amici").select("sfidante,vinto,quando").eq("sfidato", Archivio.uid).eq("visto", false);
      const righe = (data || []).sort((x, y) => String(y.quando).localeCompare(String(x.quando)));
      if (!righe.length) return;
      const ids = [...new Set(righe.map(r => r.sfidante))];
      const { data: cl } = await sbSociale().from("classifica").select("user_id,dati").in("user_id", ids);
      const nomi = {}; for (const c of cl || []) nomi[c.user_id] = c.dati || {};
      const mostra = () => {
        if (B || Tutorial.attivo || !$("#accesso").hidden || !$("#modale").hidden) { setTimeout(mostra, 2500); return; }
        apriModale(`<div class="amici-modale"><h2>Mentre non c'eri…</h2>
          <p class="nota">Alcuni amici hanno sfidato la tua squadra (guidata dal computer): ${righe.filter(r => !r.vinto).length} volte ti sei difeso, ${righe.filter(r => r.vinto).length} hai perso.</p>
          <ul class="amici-lista">${righe.slice(0, 12).map(r => { const n = nomi[r.sfidante] || {};
            return `<li>${htmlAvatar(String(n.avatar || ""), "mini")}<div class="amico-info"><b>${esc(String(n.nome || "Un amico"))}</b><small>${r.vinto ? "ti ha battuto" : "ha perso contro di te"}</small></div>
              ${r.vinto ? `<button class="btn primario piccolo" data-fx="spinta" data-sfida-amico="${esc(r.sfidante)}">Rivincita</button>` : `<span class="vinto-tag">Difesa!</span>`}</li>`; }).join("")}</ul>
          <div class="azioni centro"><button class="btn" data-azione="chiudi">Ok</button></div></div>`);
      };
      setTimeout(mostra, 1200);
      rpcSociale("segna_sfide_viste").catch(() => {});
    } catch (e) { /* è un extra: se non va, pazienza */ }
  }

  return { sfida, chiudi, htmlFine, apriElenco, aggiornaElenco, controllaRicevute };
})();

// ---------------- BOSS DEL GRUPPO ----------------
const Boss = (() => {
  let stato = null, errore = null, inCarica = false;
  const PREMIO = { monete: piuMonete(300), bustine: { leggendaria: 1 } }, PREMIO_MVP = { bustine: { epica: 1 } };

  function cartaBoss(sett) {
    const leg = CARTE.filter(c => c.rarita === "leggendaria");
    let h = 0; for (const ch of String(sett)) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
    return leg[h % leg.length] || CARTE[0];
  }
  // il giorno vale come sul server: a mezzanotte di Roma gli attacchi ripartono da 0
  const giornoRoma = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date());
  let caricatoIl = "", caricatoAlle = 0;
  async function carica(forza) {
    if (!socialeAttivo() || (inCarica && !forza)) return stato;
    inCarica = true;
    caricatoIl = giornoRoma(); caricatoAlle = Date.now();   // anche se fallisce: così non si riprova in loop
    try { stato = await rpcSociale("boss_attuale"); errore = null; } catch (e) { errore = e.message; }
    inCarica = false;
    ridisegna();
    return stato;
  }
  function ridisegna() {
    if (B) return;
    for (const el of document.querySelectorAll("[data-boss-box]")) el.outerHTML = el.dataset.bossBox === "grande" ? htmlGrande() : htmlCompatto();
  }
  const rimasti = () => stato ? Math.max(0, stato.pv_max - stato.danni) : 0;
  const tempo = () => { if (!stato) return ""; const ms = new Date(stato.fine) - new Date(), g = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24; return ms <= 0 ? "finito" : g ? `${g} g e ${h} h` : `${h} h`; };

  function htmlCompatto() { return html(false); }
  function htmlGrande() { return html(true); }
  function html(grande) {
    const tipo = grande ? "grande" : "compatto";
    if (!socialeAttivo()) return "";
    // dati di un altro giorno (app rimasta aperta dopo mezzanotte) o vecchi di più di 5 minuti: si ricaricano
    if (stato && !inCarica && (caricatoIl !== giornoRoma() || Date.now() - caricatoAlle > 5 * 60e3)) setTimeout(() => carica(), 0);
    if (!stato) { if (!errore) setTimeout(() => carica(), 0); return `<div class="boss-box" data-boss-box="${tipo}"><p class="nota">${errore ? esc(errore) : "Cerco il boss della settimana…"}</p></div>`; }
    const c = cartaBoss(stato.settimana), r = rimasti(), pct = Math.round(r / stato.pv_max * 100), caduto = r <= 0;
    const colpi = stato.colpi_oggi || 0, premi = stato.da_riscuotere || [];
    const top = (stato.classifica || []).slice(0, grande ? 10 : 3);
    return `<div class="boss-box ${caduto ? "caduto" : ""}" data-boss-box="${tipo}">
      <div class="boss-testa">
        <img src="${imgCarta(c.id)}" alt="">
        <div><small class="boss-etichetta">Boss della settimana · finisce tra ${tempo()}</small>
          <b>${esc(c.nome)} Gigante</b>
          <div class="boss-pv"><i style="--p:${pct}%"></i><span>${caduto ? "SCONFITTO!" : `${r.toLocaleString("it-IT")} / ${stato.pv_max.toLocaleString("it-IT")} PV`}</span></div>
        </div>
      </div>
      ${premi.length ? `<button class="btn oro" data-fx="coriandoli" data-boss-premio="${esc(premi[0])}">Riscuoti il premio del boss!</button>` : ""}
      ${caduto ? `<p class="nota">Il gruppo l'ha battuto. Lunedì arriva un nuovo boss.</p>` : `<div class="boss-azioni">
        <button class="btn primario" data-fx="spinta" data-azione="attacca-boss" ${colpi >= 3 && !S.admin ? "disabled" : ""}>${colpi >= 3 && !S.admin ? "Attacchi finiti per oggi" : "Attacca"}</button>
        <span class="nota">Attacchi oggi: ${S.admin ? "prova admin" : `${colpi}/3`}</span></div>`}
      ${top.length ? `<ol class="boss-classifica">${top.map((x, i) => `<li class="${x.id === Archivio.uid ? "io" : ""}"><span>${i + 1}</span>${htmlAvatar(String(x.avatar || ""), "mini")}<b>${esc(String(x.nome))}</b><em>${Number(x.danni).toLocaleString("it-IT")}</em></li>`).join("")}</ol>`
        : `<p class="nota">Nessuno l'ha ancora colpito. Sii il primo!</p>`}
      ${grande ? `<p class="nota piccola">Tutti colpiscono lo stesso boss: 3 attacchi al giorno a testa, al massimo 6.000 danni ad attacco. Se cade entro domenica, chi ha partecipato riceve ${testoPremio(PREMIO)} e una bomboletta; chi ha fatto più danni anche ${testoPremio(PREMIO_MVP)}.</p>` : ""}
    </div>`;
  }

  // quando l'app torna in primo piano (telefono sbloccato il giorno dopo) o scatta la mezzanotte, il riquadro del boss si aggiorna
  const controllaGiorno = () => { if (stato && document.visibilityState === "visible" && document.querySelector("[data-boss-box]") && caricatoIl !== giornoRoma()) carica(); };
  document.addEventListener("visibilitychange", controllaGiorno);
  setInterval(controllaGiorno, 60e3);
  async function attacca() {
    if (!socialeAttivo() || B) return;
    await carica(true);
    if (!stato) { mostraAvviso(errore || "Non trovo il boss."); return; }
    if (rimasti() <= 0) { mostraAvviso("Il boss è già stato sconfitto."); return; }
    if (!S.admin && (stato.colpi_oggi || 0) >= 3) { mostraAvviso("Oggi hai già attaccato il boss 3 volte: torna domani."); return; }
    if (squadraAttiva().carte.length < CARTE_SQUADRA) { mostraAvviso("Prima prepara una squadra completa."); vai("squadra"); return; }
    const c = cartaBoss(stato.settimana);
    schermoIntero(true);
    setTimeout(() => avviaSfida({ id: "boss-gruppo", nome: `${c.nome} Gigante`, abilita: .9, liv: [30, 30], premio: 0, punti: 0, xp: 0,
      bossGruppo: { settimana: stato.settimana, pv: rimasti(), prova: !!S.admin }, graffitoNemico: { id: Graffiti.ORDINE[(c.id.length + stato.settimana.length * 7) % Graffiti.ORDINE.length], liv: 3 } }, null, [{ id: c.id, liv: LIVELLO_MAX, lode: true }]), ridotto ? 0 : 220);
  }
  // Il boss in battaglia: tanti PV (quelli che restano al boss del gruppo, al massimo 99.999) e colpi più forti
  function prepara(Bt, pv) {
    const x = Bt.lati[1].squadra[0], L = livelloAttuale && livelloAttuale.bossGruppo;
    x.pvCura = Math.round(x.pvMax * 1.5);   // le cure del boss contano come se avesse PV normali (×1,5), non i suoi 99.999
    x.pvMax = x.pv = Math.max(1, Math.min(pv || L.pv, 99999));
    x.att = Math.round(x.att * 1.2); x.vel += 4;   // colpisce più forte, ma non troppo: così l'attacco dura e si fanno danni
    if (L) L.pvInizio = x.pv;
  }
  async function chiudi() {
    const L = livelloAttuale, b = L.bossGruppo, x = B.lati[1].squadra[0];
    const danni = Math.max(0, Math.round(b.pvInizio - Math.max(0, x.pv)));
    // anche quando la squadra cade i danni fatti contano: le carte scese in campo prendono comunque potenziatori
    L.espCarte = premiaCarte(1.5, B.vincitore === 0, true);
    if (B.vincitore !== 0) S.stats.sconfitte++;
    const e = { danni, contati: Math.min(danni, 6000), monete: piuMonete(Math.min(150, 30 + Math.round(danni / 40))), xp: ridXP(80), stato: b.prova ? "prova" : "invio" };
    S.monete += e.monete;
    const su = aggiungiXP(e.xp);
    L.esito = e;
    if (!b.prova) { Missioni.evento("boss", { danni: e.contati }); S.stats.danniBoss = (S.stats.danniBoss || 0) + e.contati; }
    if (B.vincitore === 0 && arena) arena.vittoria(0);
    salva(); aggiornaTesta(); aggiornaBattaglia();
    if (su) setTimeout(() => mostraAvviso(`Pass: livello ${su} raggiunto!`), 900);
    if (!b.prova) {
      try { const r = await rpcSociale("colpisci_boss", { danni: e.contati }); stato = r; e.stato = "ok"; e.sconfittoOra = r.sconfitto_ora; e.rimasti = Math.max(0, r.pv_max - r.danni); }
      catch (err) { e.stato = err.message; }
      aggiornaBattaglia();
      if (e.sconfittoOra) setTimeout(() => { FX.esplosione(innerWidth / 2, innerHeight / 3, { n: 120, forma: "stella", colori: ["#f2c14e", "#fff3c4", "#ff2e46"], velocita: 10, dimensione: 6 }); }, 400);
    }
  }
  function htmlFine() {
    const L = livelloAttuale, e = L.esito;
    // la battaglia è appena finita e i premi non sono ancora calcolati (succede per un attimo): niente schermata a metà
    if (!e) return `<div class="fine boss-fine"><b>${B.vincitore === 0 ? "Boss abbattuto!" : "Sconfitta"}</b><span class="nota">Conto i danni…</span></div>`;
    const info = e.stato === "prova" ? `<small class="nota">Prova da admin: i danni non contano.</small>`
      : e.stato === "invio" ? `<small class="nota">Registro i danni…</small>`
      : e.stato === "ok" ? (e.sconfittoOra ? `<span class="punti-amico">Colpo finale! Il boss è caduto: tutti quelli che l'hanno colpito ricevono il premio.</span>` : `<span class="nota">Al boss restano ${Number(e.rimasti).toLocaleString("it-IT")} PV.</span>`)
      : `<small class="errore">${esc(e.stato)}</small>`;
    return `<div class="fine ${B.vincitore === 0 ? "vinto" : "perso boss-fine"}">
      <b>${B.vincitore === 0 ? "Boss abbattuto!" : "Sconfitta"}</b>
      <span class="boss-danni"><b>${e.danni.toLocaleString("it-IT")}</b> danni</span>
      <span>${e.danni > e.contati ? `Ne contano ${e.contati.toLocaleString("it-IT")} (massimo per attacco).` : "Inflitti al boss del gruppo."}</span>
      ${info}
      <span>+${e.monete} monete · +${e.xp} XP</span>
      ${htmlEspCarte()}
      <div class="azioni centro"><button class="btn primario" data-fx="salto" data-azione="esci-boss">Torna al boss della settimana</button></div>
    </div>`;
  }
  async function riscatta(sett, el) {
    try {
      const r = await rpcSociale("riscatta_boss", { sett });
      const p = JSON.parse(JSON.stringify(PREMIO));
      if (r.posizione === 1) for (const [t, n] of Object.entries(PREMIO_MVP.bustine)) p.bustine[t] = (p.bustine[t] || 0) + n;
      daiPremio(p);
      const gr = Graffiti.dai(Graffiti.pesca());
      salva(); aggiornaTesta();
      if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 80, forma: "coriandolo", colori: ["#f2c14e", "#ff2e46", "#3fd8ff", "#fff"], velocita: 9, dimensione: 5 }); }
      apriModale(`<div class="codice-modale"><span class="codice-tag">Boss sconfitto</span><h2>${r.posizione === 1 ? "Sei l'MVP!" : "Missione compiuta"}</h2>
        <p>Siete stati in ${r.partecipanti} a colpirlo. Tu hai fatto <b>${Number(r.danni).toLocaleString("it-IT")}</b> danni (${r.posizione}° posto).</p>
        <p class="codice-premio">Hai ricevuto: <b>${esc(testoPremio(p))} + graffito «${esc(Graffiti.info(gr.id).nome)}»</b></p>
        <div class="azioni centro"><button class="btn primario" data-azione="chiudi">Grande!</button></div></div>`);
      carica(true);
    } catch (e) { mostraAvviso(e.message); carica(true); }
  }
  return { carta: cartaBoss, carica, htmlCompatto, htmlGrande, attacca, prepara, chiudi, htmlFine, riscatta, get stato() { return stato; } };
})();
