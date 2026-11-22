// ============================================================
//  ZAINO
//  Oggetti da usare in battaglia, a tema "notte in città". Si comprano nel negozio, si mettono nello zaino
//  prima della partita (3 posti) e si usano durante il proprio turno: uno per turno, senza perdere la mossa.
//  Un oggetto si consuma solo se lo usi. Gli effetti sono in motore.js (OGGETTI_EFFETTI).
// ============================================================
const Zaino = (() => {
  const POSTI = 3;
  const OGGETTI = {
    kebab:    { nome: "Kebab di mezzanotte", icona: "🥙", colore: "#ffb347", prezzo: 120, corto: "Cura il 35%",
                desc: "La tua carta in campo recupera il 35% dei PV. Niente rimette in forze come un kebab alle 3 di notte." },
    lattina:  { nome: "Lattina al neon", icona: "🥤", colore: "#3fd8ff", prezzo: 100, corto: "+3 energia",
                desc: "+3 energia subito. Brilla al buio e ti tiene sveglio fino all'alba." },
    occhiali: { nome: "Occhiali da boss", icona: "🕶️", colore: "#f2c14e", prezzo: 150, corto: "+30% attacco",
                desc: "Attacco della carta in campo +30% per 2 turni. Con questi addosso nessuno ti dice di no." },
    casco:    { nome: "Casco del motorino", icona: "⛑️", colore: "#a9b4c4", prezzo: 120, corto: "Scudo 60%",
                desc: "Il prossimo colpo che subisci fa il 60% di danni in meno. Allacciato bene, mi raccomando." },
    acqua:    { nome: "Bottiglietta d'acqua", icona: "💧", colore: "#6ccaff", prezzo: 80, corto: "Toglie i malus",
                desc: "Toglie bruciature, debolezza e stordimento e cura il 10% dei PV. Il rimedio del giorno dopo." },
    fumogeno: { nome: "Fumogeno da stadio", icona: "💨", colore: "#b866ff", prezzo: 150, corto: "Schiva 1 attacco",
                desc: "Il prossimo attacco nemico contro la tua carta va a vuoto. In mezzo al fumo non ti vede nessuno." },
    taxi:     { nome: "Taxi di ritorno", icona: "🚕", colore: "#ffe14a", prezzo: 400, corto: "Rialza una carta KO",
                desc: "Una tua carta KO torna in panchina con il 30% dei PV. Una volta sola per battaglia: a quell'ora i taxi sono pochi." },
  };
  const ORDINE = Object.keys(OGGETTI);
  // ---------- modifiche dell'admin (config 'zaino'): nome, icona, colore, prezzo, descrizione, forza dell'effetto, in vendita sì/no ----------
  const BASE = JSON.parse(JSON.stringify(OGGETTI)), BASE_EFF = JSON.parse(JSON.stringify(OGGETTI_EFFETTI));
  // limiti dell'effetto per tipo: [minimo, massimo, unità]
  const LIMITI = { cura: [5, 100, "% PV"], energia: [1, 8, "energia"], forza: [5, 100, "% attacco"], scudo: [5, 90, "% di danni in meno"], pulisci: [0, 50, "% PV di cura"], rianima: [5, 100, "% PV"] };
  const cortoDi = id => { const e = OGGETTI_EFFETTI[id] || {}; return { cura: `Cura il ${e.val}%`, energia: `+${e.val} energia`, forza: `+${e.val}% attacco`, scudo: `Scudo ${e.val}%`,
    pulisci: "Toglie i malus", nebbia: "Schiva 1 attacco", rianima: "Rialza una carta KO" }[e.tipo] || ""; };
  let personali = {}, caricato = false;
  function applica(cfg) {
    personali = cfg && typeof cfg === "object" ? cfg : {};
    for (const id of ORDINE) {
      const m = personali[id] || {}, b = BASE[id], o = OGGETTI[id], e = OGGETTI_EFFETTI[id], be = BASE_EFF[id];
      o.nome = typeof m.nome === "string" && m.nome.trim() ? m.nome.trim().slice(0, 30) : b.nome;
      o.icona = typeof m.icona === "string" && m.icona.trim() ? [...m.icona.trim()].slice(0, 4).join("") : b.icona;
      o.colore = /^#[0-9a-f]{6}$/i.test(m.colore || "") ? m.colore : b.colore;
      o.desc = typeof m.desc === "string" && m.desc.trim() ? m.desc.trim().slice(0, 200) : b.desc;
      o.prezzo = Number.isFinite(+m.prezzo) && +m.prezzo >= 10 ? Math.min(5000, Math.round(+m.prezzo)) : b.prezzo;
      o.nascosto = !!m.nascosto;
      const lim = LIMITI[be.tipo];
      e.val = lim && Number.isFinite(+m.val) ? Math.max(lim[0], Math.min(lim[1], Math.round(+m.val))) : be.val;
      if (be.turni) e.turni = Number.isFinite(+m.turni) ? Math.max(1, Math.min(5, Math.round(+m.turni))) : be.turni;
      o.corto = cortoDi(id);
    }
  }
  async function carica() {
    if (Archivio.modo !== "cloud" || !Archivio.db) { caricato = true; return; }
    try { const snap = await Archivio.db.doc("config/zaino").get(); applica(snap && snap.exists ? snap.data() : {}); caricato = true; } catch (e) { return; }
    if (!B && ["admin", "sfida", "negozio"].includes(vista) && $("#modale").hidden) disegna();
  }
  function htmlAdmin() {
    if (!caricato) { setTimeout(carica, 0); return `<h3>Zaino</h3><p class="nota">Carico gli oggetti…</p>`; }
    return `<h3>Zaino</h3>
      <p class="nota">Cambia nome, icona (un'emoji), colore, prezzo, descrizione e forza dell'effetto degli oggetti. Quando salvi vale per tutti, anche nelle partite dal vivo. "Non in vendita" lo toglie dal negozio, ma chi ce l'ha può ancora usarlo.</p>
      <form id="form-zaino" class="zaino-admin" autocomplete="off">${ORDINE.map(id => { const o = OGGETTI[id], e = OGGETTI_EFFETTI[id], lim = LIMITI[e.tipo];
        return `<fieldset class="zaino-admin-riga" style="--c:${o.colore}">
          <legend>${htmlIcona(id, "piccola")} ${esc(o.nome)}${o.nascosto ? ` <small class="nota">(non in vendita)</small>` : ""}</legend>
          <div class="campi-3">
            <label>Nome <input name="${id}.nome" maxlength="30" value="${esc(o.nome)}"></label>
            <label>Icona <input name="${id}.icona" maxlength="8" value="${esc(o.icona)}" class="campo-emoji"></label>
            <label>Colore <input name="${id}.colore" type="color" value="${esc(o.colore)}"></label>
          </div>
          <label>Descrizione <textarea name="${id}.desc" rows="2" maxlength="200">${esc(o.desc)}</textarea></label>
          <div class="campi-3">
            <label>Prezzo <input name="${id}.prezzo" type="number" min="10" max="5000" value="${o.prezzo}"></label>
            ${lim ? `<label>Effetto (${lim[2]}) <input name="${id}.val" type="number" min="${lim[0]}" max="${lim[1]}" value="${e.val}"></label>` : `<label>Effetto <input value="${esc(cortoDi(id))}" disabled></label>`}
            ${e.turni ? `<label>Turni <input name="${id}.turni" type="number" min="1" max="5" value="${e.turni}"></label>` : `<label class="spunta"><input type="checkbox" name="${id}.nascosto" ${o.nascosto ? "checked" : ""}> Non in vendita</label>`}
          </div>
          ${e.turni ? `<label class="spunta"><input type="checkbox" name="${id}.nascosto" ${o.nascosto ? "checked" : ""}> Non in vendita</label>` : ""}
        </fieldset>`; }).join("")}
        <div class="azioni"><button class="btn primario" type="submit">Salva per tutti</button><button type="button" class="btn" data-admin="zaino-base">Valori di partenza</button></div>
      </form>`;
  }
  async function salvaAdmin(form, base) {
    const f = base ? null : new FormData(form), nuovi = {};
    if (!base) for (const id of ORDINE) {
      const g = k => f.get(`${id}.${k}`), d = {}, b = BASE[id], be = BASE_EFF[id];
      for (const k of ["nome", "icona", "desc"]) { const v = String(g(k) || "").trim(); if (v && v !== b[k]) d[k] = v; }
      if (g("colore") && g("colore") !== b.colore) d.colore = g("colore");
      if (g("prezzo") && +g("prezzo") !== b.prezzo) d.prezzo = +g("prezzo");
      if (g("val") !== null && g("val") !== "" && +g("val") !== be.val) d.val = +g("val");
      if (g("turni") !== null && g("turni") !== "" && +g("turni") !== be.turni) d.turni = +g("turni");
      if (g("nascosto")) d.nascosto = true;
      if (Object.keys(d).length) nuovi[id] = d;
    }
    try { await Archivio.db.doc("config/zaino").set(nuovi); applica(nuovi); mostraAvviso(base ? "Oggetti tornati ai valori di partenza per tutti." : "Oggetti dello zaino salvati: ora valgono per tutti."); }
    catch (e) { mostraAvviso("Non sono riuscito a salvare. Serve la pagina online con il tuo account admin."); }
    const box = $("#admin-zaino"); if (box) box.innerHTML = htmlAdmin();
  }
  const info = id => Object.assign({ id }, OGGETTI[id]);
  const stato = () => { if (!S.zaino) S.zaino = { oggetti: {}, porta: [] }; return S.zaino; };
  const quanti = id => (stato().oggetti || {})[id] || 0;
  const porta = () => Array.from({ length: POSTI }, (_, i) => (stato().porta || [])[i] || null);

  function htmlIcona(id, cls = "") {
    const o = info(id);
    return `<span class="oggetto-ico ${cls}" style="--c:${o.colore}" aria-hidden="true"><i>${o.icona}</i></span>`;
  }

  // Cosa entra davvero in battaglia: i posti scelti, finché ne hai (due posti con lo stesso oggetto servono 2 copie)
  function perBattaglia() {
    const resto = Object.assign({}, stato().oggetti);
    return porta().map(id => { if (!id || !resto[id]) return null; resto[id]--; return { id, usato: false }; });
  }

  // ---------- negozio ----------
  function compra(id, n, el) {
    const o = OGGETTI[id]; if (!o || o.nascosto) return;
    const costo = o.prezzo * n;
    if (!S.admin && S.monete < costo) { mostraAvviso("Non hai abbastanza monete."); return; }
    if (!S.admin) S.monete -= costo;
    const z = stato();
    z.oggetti = Object.assign({}, z.oggetti, { [id]: (z.oggetti[id] || 0) + n });
    // se lo zaino ha un posto libero, lo metto lì da solo
    const p = porta(); const libero = p.indexOf(null);
    if (libero >= 0 && !p.includes(id)) { p[libero] = id; z.porta = p; }
    salva(); aggiornaTesta();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 30, forma: "coriandolo", colori: [o.colore, "#ffffff"], velocita: 6, dimensione: 4 }); }
    mostraAvviso(`${n > 1 ? n + " × " : ""}${o.nome} nello zaino.`);
    disegna();
  }
  function htmlNegozio() {
    return `<div class="titolo-riga piccola"><h3>Zaino</h3><p class="nota">Oggetti da usare in battaglia: uno per turno, senza perdere la mossa. Ne porti ${POSTI} a partita e si consumano solo se li usi.</p></div>
      <div class="vetrina zaino-vetrina">${ORDINE.filter(id => !OGGETTI[id].nascosto || quanti(id)).map(id => { const o = info(id), n = quanti(id);
        return `<div class="prodotto prodotto-oggetto" style="--c:${o.colore}">
          ${htmlIcona(id, "grande")}
          <b>${esc(o.nome)}</b>
          <span class="nota">${esc(o.desc)}</span>
          ${n ? `<span class="ne-hai">Ne hai ${n}</span>` : ""}
          <div class="prodotto-prezzi">
            <button class="btn primario" data-fx="monete" data-compra-oggetto="${id}:1" ${S.admin || S.monete >= o.prezzo ? "" : "disabled"}>${o.prezzo} <i class="moneta-ico"></i></button>
            <button class="btn" data-fx="monete" data-compra-oggetto="${id}:5" ${S.admin || S.monete >= o.prezzo * 5 ? "" : "disabled"}>×5 · ${o.prezzo * 5}</button>
          </div></div>`; }).join("")}</div>`;
  }

  // ---------- pagina Sfida: lo zaino per la prossima partita ----------
  function htmlPannello() {
    const p = porta(), pronti = perBattaglia();
    return `<div class="zaino-pannello">
      <div class="zaino-testa"><b>Zaino</b><span class="nota">Quello che porti nella prossima partita. Tocca un posto per cambiarlo.</span></div>
      <div class="zaino-posti">${p.map((id, i) => {
        if (!id) return `<button type="button" class="zaino-posto vuoto" data-zaino-posto="${i}"><span class="oggetto-ico vuoto"><i>+</i></span><small>Vuoto</small></button>`;
        const o = info(id), ok = !!pronti[i];
        return `<button type="button" class="zaino-posto ${ok ? "" : "finito"}" data-zaino-posto="${i}" style="--c:${o.colore}">${htmlIcona(id)}<b>${esc(o.nome)}</b><small>${ok ? esc(o.corto) : "Finito: ricompralo"}</small></button>`;
      }).join("")}</div>
    </div>`;
  }
  let postoScelto = 0;
  function apriPosto(i) {
    postoScelto = i;
    const posseduti = ORDINE.filter(id => quanti(id) > 0);
    apriModale(`<div class="zaino-modale"><h2>Posto ${i + 1} dello zaino</h2>
      <p class="nota">Scegli cosa portare. Gli oggetti si consumano solo se li usi in battaglia.</p>
      ${posseduti.length ? `<div class="zaino-scelta">${posseduti.map(id => { const o = info(id), sel = porta()[i] === id;
        return `<button type="button" class="zaino-opzione ${sel ? "sel" : ""}" data-zaino-metti="${id}" style="--c:${o.colore}">${htmlIcona(id)}<span><b>${esc(o.nome)}</b> <small class="ne-hai-2">× ${quanti(id)}</small><br><small>${esc(o.desc)}</small></span></button>`; }).join("")}</div>`
        : `<p class="nota">Lo zaino è vuoto: gli oggetti si comprano nel negozio.</p>`}
      <div class="azioni centro">${porta()[i] ? `<button class="btn" data-zaino-metti="">Lascia vuoto</button>` : ""}<button class="btn oro" data-azione="vai-negozio">Compra oggetti</button></div>
    </div>`);
  }
  function metti(id) {
    const z = stato(), p = porta(); p[postoScelto] = id || null; z.porta = p;
    salva(); chiudiModale();
    if (vista === "sfida") disegna();
  }

  // ---------- in battaglia ----------
  function htmlBattaglia() {
    if (!B || !B.zaino || !B.zaino.some(Boolean)) return "";
    const giaUsato = (B.oggettiTurno || [])[0] === B.turno;
    return `<div class="zaino-riga"><span class="zaino-etichetta">Zaino</span>${B.zaino.map((x, i) => {
      if (!x) return "";
      const o = info(x.id), off = x.usato || animazione || B.vincitore >= 0 || giaUsato || (livelloAttuale && livelloAttuale.vivo && Online.inAttesa());
      return `<button type="button" class="zaino-usa ${x.usato ? "usato" : ""}" data-usa-oggetto="${i}" style="--c:${o.colore}" ${off ? "disabled" : ""} title="${esc(o.desc)}">${htmlIcona(x.id, "piccola")}<span><b>${esc(o.nome)}</b><small>${x.usato ? "Usato" : esc(o.corto)}</small></span></button>`;
    }).join("")}${giaUsato && B.zaino.some(x => x && !x.usato) ? `<small class="zaino-nota">Un oggetto per turno</small>` : ""}</div>`;
  }
  async function usa(i) {
    if (!B || animazione || B.vincitore >= 0) return;
    const x = B.zaino && B.zaino[i]; if (!x || x.usato) return;
    // dal vivo: l'oggetto parte insieme alla mossa, quindi dopo aver scelto non si può più aprire lo zaino
    if (livelloAttuale && livelloAttuale.vivo && (Online.inAttesa() || B.serveSostituzione(1))) { mostraAvviso("Hai già scelto la mossa di questo turno."); return; }
    const o = info(x.id), r = B.usaOggetto(0, x.id, o.nome);
    if (!r.ok) { mostraAvviso(r.motivo); return; }
    x.usato = true;
    if (livelloAttuale && livelloAttuale.vivo) Online.oggettoUsato(x.id);
    if (!livelloAttuale || !livelloAttuale.provaAdmin) {
      const z = stato(); z.oggetti = Object.assign({}, z.oggetti, { [x.id]: Math.max(0, (z.oggetti[x.id] || 0) - 1) }); salva();
    }
    await riproduci(r.ev);
  }

  return { POSTI, carica, htmlAdmin, salvaAdmin, elenco: () => Object.entries(OGGETTI), info, quanti, htmlIcona, perBattaglia, compra, htmlNegozio, htmlPannello, apriPosto, metti, htmlBattaglia, usa, ORDINE };
})();
