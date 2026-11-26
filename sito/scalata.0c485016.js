// ============================================================
//  LA SCALATA (nov 2026) — modalità incrementale, come l'Arena ma da zero
//  Ti fai la squadra scegliendo 5 volte tra 3 carte, tutte al livello 1. A ogni piano vinto sali di livello e scegli
//  un potenziamento tra tre. Anche il bot sale: a ogni piano prende un potenziamento suo (lo vedi prima di combattere).
//  I piani non finiscono mai: ti fermi alla terza sconfitta, oppure quando decidi di incassare.
//
//  Due parti: ScalataRegole (solo regole, usate anche da controlli/simula.js) e Scalata (le schermate).
//  Usa i cimeli della Lunga Notte (CIMELI, NotteRegole.applicaCimeli).
// ============================================================
const ScalataRegole = (() => {
  const GIRI = ["leggendaria", "epica", "epica", "rara", "comune"], VITE = 3;
  const T = { abilita0: .45, abilitaPiano: .03, extraDal: 13, extraPiano: .05 };
  const fuori = c => c.rarita !== "jolly" && !(SERIE[c.serie] && SERIE[c.serie].jolly);
  const mescola = (rng, a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pesca = (rng, a) => a[Math.floor(rng() * a.length)];
  const casuali = (rng, rar, n, escludi = []) => mescola(rng, CARTE.filter(c => c.rarita === rar && fuori(c) && !escludi.includes(c.id))).slice(0, n).map(c => c.id);
  const voce = id => ({ id, liv: 1, asc: 0, olo: false, ultra: false });
  const CIM_RAR = { comune: ["insegna", "giubbotto", "scarpe", "panino"], rara: ["caffe", "termos", "dado", "specchietto", "casco"], epica: ["canini", "moneta", "petardo", "foto", "cassa"], leggendaria: ["insegna", "panino", "canini", "petardo"] };

  function nuova(rng) { return { v: 1, fase: "draft", scelte: [], proposta: casuali(rng, GIRI[0], 3), piano: 1, vite: VITE, perse: 0 }; }
  function scegliDraft(rng, st, id) {
    if (st.fase !== "draft" || !st.proposta.includes(id)) return false;
    st.scelte.push(id);
    if (st.scelte.length < 5) { st.proposta = casuali(rng, GIRI[st.scelte.length], 3, st.scelte); return true; }
    st.squadra = st.scelte.map(voce); st.cimeli = {}; st.proposta = null;
    st.bot = { squadra: GIRI.map(r => voce(casuali(rng, r, 1, st.scelte)[0])), cimeli: {}, extra: 1, preso: "" };
    st.fase = "torre"; return true;
  }
  // rarità del potenziamento: migliora con il piano (l = min(30, piano × 1,5))
  function raritaPiano(rng, piano) {
    const l = Math.min(30, piano * 1.5), x = rng() * 100, leg = 3 + .6 * l, epi = 15 + 1.2 * l, rar = 50 + l;
    return x < leg ? "leggendaria" : x < epi ? "epica" : x < rar ? "rara" : "comune";
  }
  // i potenziamenti possibili di una rarità per una squadra (niente potenziamenti inutili)
  function possibili(rar, sq, cim, perBot) {
    const v = [], puoAsc = n => sq.some(x => ORDINE_RARITA.indexOf(rarDopo(PER_ID[x.id].rarita, x.asc)) + n <= 3);
    const cimNuovi = rar === "leggendaria" ? CIM_RAR.leggendaria : CIM_RAR[rar].filter(c => !cim[c]);
    const sotto30 = sq.some(x => x.liv < LIVELLO_MAX);
    if (rar === "comune") { if (sotto30) v.push({ tipo: "liv1", n: 3 }); v.push({ tipo: "livTutti", n: 1 }); }
    if (rar === "rara") { if (sotto30) v.push({ tipo: "liv1", n: 5 }); v.push({ tipo: "livTutti", n: 2 }); if (sq.some(x => !x.olo)) v.push({ tipo: "olo" }); }
    if (rar === "epica") { v.push({ tipo: "livTutti", n: 3 }); if (puoAsc(1)) v.push({ tipo: "asc", n: 1 }); }
    if (rar === "leggendaria") { v.push({ tipo: "livTutti", n: 5 }); if (sq.some(x => !x.ultra)) v.push({ tipo: "ultra" }); if (puoAsc(2)) v.push({ tipo: "asc", n: 2 }); }
    for (const c of cimNuovi) v.push({ tipo: "cimelio", id: c });
    return v.map(p => Object.assign(p, { rar }));
  }
  function potenziamento(rng, rar, sq, cim, escludi = []) {
    const v = possibili(rar, sq, cim).filter(p => !escludi.some(e => e.tipo === p.tipo && e.id === p.id && e.n === p.n));
    return v.length ? pesca(rng, v) : { tipo: "livTutti", n: 1, rar };
  }
  // 3 offerte: due della rarità del piano, una di quattro piani più avanti (così ce n'è sempre una più rara)
  function offerte(rng, st) {
    const a = [];
    for (const r of [raritaPiano(rng, st.piano), raritaPiano(rng, st.piano), raritaPiano(rng, st.piano + 4)]) a.push(potenziamento(rng, r, st.squadra, st.cimeli, a));
    return a.sort((x, y) => ORDINE_RARITA.indexOf(x.rar) - ORDINE_RARITA.indexOf(y.rar));
  }
  const serveCarta = p => ["liv1", "olo", "ultra", "asc"].includes(p.tipo);
  const cartaOk = (p, x) => p.tipo === "olo" ? !x.olo : p.tipo === "ultra" ? !x.ultra : p.tipo === "asc" ? ORDINE_RARITA.indexOf(rarDopo(PER_ID[x.id].rarita, x.asc)) + p.n <= 3 : x.liv < LIVELLO_MAX;
  // applica un potenziamento (i = carta scelta, se serve)
  function applica(p, sq, cim, i) {
    const x = sq[i];
    if (p.tipo === "liv1") x.liv = Math.min(LIVELLO_MAX, x.liv + p.n);
    else if (p.tipo === "livTutti") sq.forEach(y => { y.liv = Math.min(LIVELLO_MAX, y.liv + p.n); });
    else if (p.tipo === "olo") x.olo = true;
    else if (p.tipo === "ultra") x.ultra = true;
    else if (p.tipo === "asc") x.asc = (x.asc || 0) + p.n;
    else if (p.tipo === "cimelio") cim[p.id] = (cim[p.id] || 0) + 1;
  }
  function testo(p) {
    if (p.tipo === "liv1") return `+${p.n} livelli a una carta`;
    if (p.tipo === "livTutti") return `+${p.n} livell${p.n > 1 ? "i" : "o"} a tutta la squadra`;
    if (p.tipo === "olo") return "Una carta diventa olografica (+5% PV e danni)";
    if (p.tipo === "ultra") return "Una carta diventa Ultra (+10% PV e danni)";
    if (p.tipo === "asc") return p.n > 1 ? "Una carta sale di 2 rarità" : "Una carta sale di rarità (Ascesa)";
    if (p.tipo === "cimelio") return `${CIMELI[p.id].ico} ${CIMELI[p.id].nome}: ${CIMELI[p.id].desc}`;
    return "";
  }
  // vittoria: si sale di piano, +1 livello a tutti, poi si sceglie il potenziamento
  function vittoria(rng, st) {
    st.piano++; st.squadra.forEach(x => { x.liv = Math.min(LIVELLO_MAX, x.liv + 1); });
    st.offerta = offerte(rng, st); st.fase = "potenziamento";
  }
  function sconfitta(st) { st.vite--; st.perse++; if (st.vite <= 0) { st.fase = "fine"; st.finita = "vite"; } else st.fase = "torre"; }
  // dopo il potenziamento: ogni 3 piani si può cambiare una carta, poi sale il bot
  function dopoPotenziamento(rng, st) {
    if ((st.piano - 1) % 3 === 0) { st.cambio = GIRI.map(r => r).sort(() => rng() - .5).slice(0, 3).map(r => casuali(rng, r, 1, st.squadra.map(x => x.id))[0]); st.fase = "cambio"; return; }
    turnoBot(rng, st); st.fase = "torre";
  }
  function cambia(rng, st, nuova, i) {
    if (nuova && st.squadra[i]) st.squadra[i] = Object.assign(voce(nuova), { liv: st.squadra[i].liv });
    st.cambio = null; turnoBot(rng, st); st.fase = "torre";
  }
  // il bot: un potenziamento della rarità del piano, +1 livello, cambia 2 carte (stessa rarità, tiene i potenziamenti)
  function turnoBot(rng, st) {
    const b = st.bot, p = potenziamento(rng, raritaPiano(rng, st.piano), b.squadra, b.cimeli);
    let i = Math.floor(rng() * 5); if (serveCarta(p)) { const ok = b.squadra.map((x, j) => j).filter(j => cartaOk(p, b.squadra[j])); i = ok.length ? pesca(rng, ok) : i; }
    applica(p, b.squadra, b.cimeli, i);
    b.preso = testo(p) + (serveCarta(p) ? ` (${PER_ID[b.squadra[i].id].nome})` : "");
    b.squadra.forEach(x => { x.liv = Math.min(LIVELLO_MAX, x.liv + 1); });
    for (const j of mescola(rng, [0, 1, 2, 3, 4]).slice(0, 2)) {
      const r = PER_ID[b.squadra[j].id].rarita, nuovo = casuali(rng, r, 1, b.squadra.map(x => x.id))[0];
      if (nuovo) b.squadra[j] = Object.assign({}, b.squadra[j], { id: nuovo });
    }
    if (st.piano >= T.extraDal) b.extra = (b.extra || 1) * (1 + T.extraPiano);
  }
  const abilita = piano => Math.min(.96, T.abilita0 + T.abilitaPiano * (piano - 1));
  function prepara(B, st) {
    NotteRegole.applicaCimeli(B, 0, st.cimeli);
    NotteRegole.applicaCimeli(B, 1, st.bot.cimeli);
    const k = st.bot.extra || 1;
    if (k > 1) for (const x of B.lati[1].squadra) { x.pvMax = Math.round(x.pvMax * k); x.pv = x.pvMax; x.att *= k; }
  }
  const pianiSuperati = st => Math.max(0, st.piano - 1);
  const voceBattaglia = x => ({ id: x.id, liv: x.liv, lode: false, olo: !!x.olo, ultra: !!x.ultra, asc: x.asc || 0 });
  return { GIRI, VITE, T, nuova, scegliDraft, offerte, applica, testo, serveCarta, cartaOk, vittoria, sconfitta, dopoPotenziamento, cambia, turnoBot, abilita, prepara, pianiSuperati, voceBattaglia, raritaPiano };
})();

if (typeof module !== "undefined") module.exports = { ScalataRegole };

// ============================================================
//  Scalata: le schermate
// ============================================================
const Scalata = (typeof document === "undefined") ? null : (() => {
  const R = ScalataRegole, rng = () => Math.random();
  const st = () => S.scalata && S.scalata.v === 1 ? S.scalata : null;
  function htmlSfida() {
    const s = st();
    return `<section class="modo-box scalata-box"><div class="modo-ico">🗼</div><div>
      <b>La Scalata</b><span class="nota">Come l'Arena, ma tutti partono dal livello 1. A ogni piano vinto sali e scegli un potenziamento; anche il bot si rinforza. I piani non finiscono mai: hai 3 vite, oppure ti fermi e incassi quando vuoi.</span>
      ${s ? `<span class="modo-stato">${s.fase === "fine" ? "Scalata finita: riscuoti il premio" : s.fase === "draft" ? `Scelta ${s.scelte.length + 1} di 5` : `Piano ${s.piano} · ${"❤️".repeat(s.vite)}${s.battaglia ? " · battaglia in corso" : ""}`}</span>` : `<span class="modo-stato">Ingresso ${PremiModalita.INGRESSO_SCALATA} monete · premio in base ai piani superati</span>`}
      </div><div class="modo-tasti"><button class="btn ${s ? "primario" : "oro"}" data-fx="spinta" data-azione="${s ? "scalata-vai" : "scalata-entra"}">${s ? "Continua" : "Inizia a salire"}</button>
      <button class="btn piccolo" data-azione="scalata-regole">Come si gioca</button></div></section>`;
  }
  function entra(confermato) {
    if (st()) { vai("scalata"); return; }
    if (!S.admin && S.monete < PremiModalita.INGRESSO_SCALATA) { mostraAvviso(`L'ingresso costa ${PremiModalita.INGRESSO_SCALATA} monete.`); return; }
    if (!confermato) { apriModale(`<div class="modo-conferma"><span class="codice-tag">🗼 La Scalata</span><h2>Inizi a salire?</h2>
      <p>L'ingresso costa <b>${S.admin ? "niente (sei l'admin)" : PremiModalita.INGRESSO_SCALATA + " monete"}</b> e non si restituisce: il premio dipende da quanti piani superi.</p>
      <p class="nota">Hai 3 vite. Dal secondo piano puoi fermarti quando vuoi con «Mi fermo qui» e incassare.</p>
      <div class="azioni centro"><button class="btn oro grande" data-fx="spinta" data-azione="scalata-conferma">Sì, inizio${S.admin ? "" : ` (${PremiModalita.INGRESSO_SCALATA} monete)`}</button><button class="btn" data-azione="chiudi">Non ora</button></div>
      <button class="btn piccolo link" data-azione="scalata-regole">Come si gioca</button></div>`); return; }
    chiudiModale();
    if (!S.admin) S.monete -= PremiModalita.INGRESSO_SCALATA;
    S.scalata = R.nuova(rng); salva(); aggiornaTesta(); vai("scalata");
  }
  const stelle = x => x.asc ? `<i class="hud-stelle">${"★".repeat(x.asc)}</i>` : "";
  function htmlSquadra(sq, scegli, p) {
    return `<div class="notte-squadra">${sq.map((x, i) => { const c = PER_ID[x.id], r = rarDopo(c.rarita, x.asc), ok = !p || R.cartaOk(p, x);
      return `<button type="button" class="notte-membro ${scegli && !ok ? "spento" : ""}" ${scegli ? (ok ? `data-scalata-carta="${i}"` : "disabled") : `data-scalata-info="${i}"`}>
        <img src="${imgCarta(c.id)}" alt=""><span class="nm-testo"><b>${esc(c.nome)}${stelle(x)}</b><small><span class="r-testo r-${r}">${RARITA[r].nome}</span> · Lv ${x.liv} · <span class="s-${c.stile}">${c.stile}</span></small>
        <small>${x.ultra ? `<span class="r-ultra">◆ Ultra</span> ` : ""}${x.olo ? `<span class="olo-testo">✦ Olo</span>` : ""}</small></span></button>`; }).join("")}</div>`;
  }
  const cim = c => Object.keys(c).map(id => `<button type="button" class="cimelio-chip" data-cimelio-info="${id}" title="${esc(CIMELI[id].desc)}">${CIMELI[id].ico}${c[id] > 1 ? `<small>×${c[id]}</small>` : ""}</button>`).join("");
  function vista() {
    const s = st();
    if (!s) return htmlCopertinaModo("scalata", copertinaPer("scalata"));
    if (s.battaglia && !B) setTimeout(riprendi, 0);
    let corpo = "";
    if (s.fase === "draft") corpo = `<div class="notte-riquadro"><h3>Scelta ${s.scelte.length + 1} di 5: ${esc(RARITA[R.GIRI[s.scelte.length]].nome.toLowerCase())}</h3><p class="nota">Tutte partono dal livello 1 e crescono piano dopo piano.</p>
      <div class="arena-carte">${s.proposta.map(id => `<div class="arena-opz"><button class="arena-opzione" data-scalata-scegli="${id}">${htmlCarta(PER_ID[id], { liv: 1 })}<small>${esc(RUOLI[PER_ID[id].ruolo].nome)} · ${esc(SERIE[PER_ID[id].serie].nome)}</small></button></div>`).join("")}</div>
      ${s.scelte.length ? `<p class="nota">Già scelte: ${s.scelte.map(id => esc(PER_ID[id].nome)).join(", ")}</p>` : ""}</div>`;
    else if (s.battaglia) corpo = `<div class="notte-riquadro"><p>Battaglia in corso…</p><button class="btn primario" data-azione="scalata-riprendi">Riprendi la battaglia</button></div>`;
    else if (s.fase === "torre") corpo = `<div class="notte-riquadro"><h3>Piano ${s.piano}</h3>
      ${s.bot.preso ? `<p class="scalata-bot">🤖 Il bot ha preso: <b>${esc(s.bot.preso)}</b>${s.bot.extra > 1 ? ` · è più forte del ${Math.round((s.bot.extra - 1) * 100)}%` : ""}</p>` : `<p class="nota">Il primo piano: il bot ha le tue stesse rarità, al livello 1.</p>`}
      <p class="nota">Il bot: ${s.bot.squadra.map(x => `${esc(PER_ID[x.id].nome)} Lv ${x.liv}`).join(" · ")} ${cim(s.bot.cimeli)}</p>
      <div class="azioni centro"><button class="btn primario grande" data-fx="spinta" data-azione="scalata-combatti">Combatti</button>${s.piano > 1 ? `<button class="btn" data-azione="scalata-fermati">Mi fermo qui</button>` : ""}</div></div>`;
    else if (s.fase === "potenziamento") corpo = s.scegliCarta !== undefined && s.scegliCarta !== null
      ? `<div class="notte-riquadro"><h3>Su quale carta?</h3><p class="nota">${esc(R.testo(s.offerta[s.scegliCarta]))}</p>${htmlSquadra(s.squadra, true, s.offerta[s.scegliCarta])}<button class="btn" data-azione="scalata-annulla-carta">Indietro</button></div>`
      : `<div class="notte-riquadro"><h3>Piano superato! Scegli un potenziamento</h3><div class="scalata-pot">${s.offerta.map((p, i) => `<button type="button" class="pot-carta r-${p.rar}" data-fx="spinta" data-scalata-pot="${i}" style="--i:${i}"><small>${esc(RARITA[p.rar].nome)}</small><b>${esc(R.testo(p))}</b></button>`).join("")}</div></div>`;
    else if (s.fase === "cambio") corpo = `<div class="notte-riquadro"><h3>Cambio di squadra</h3><p class="nota">Ogni 3 piani puoi cambiare una carta: la nuova tiene il livello di quella che sostituisce.</p>
      ${s.nuovaScelta ? `<p>Chi lascia il posto a <b>${esc(PER_ID[s.nuovaScelta].nome)}</b>?</p>${htmlSquadra(s.squadra, true)}` : `<div class="arena-carte">${s.cambio.map(id => `<div class="arena-opz"><button class="arena-opzione" data-scalata-nuova="${id}">${htmlCarta(PER_ID[id], { liv: 1 })}<small>${esc(RUOLI[PER_ID[id].ruolo].nome)}</small></button></div>`).join("")}</div>`}
      <button class="btn" data-azione="scalata-no-cambio">Non cambio</button></div>`;
    else if (s.fase === "fine") { const p = R.pianiSuperati(s), pr = PremiModalita.scalata(p);
      corpo = `<div class="notte-riquadro fine-notte"><h3>${s.finita === "fermo" ? "Ti sei fermato al piano " + s.piano : "Scalata finita"}</h3><p>Piani superati: <b>${p}</b></p>
        <p class="notte-premio-fine">${S.admin ? "Da admin non ci sono premi." : esc(testoPremio(pr))}</p>
        <button class="btn oro" data-fx="coriandoli" data-azione="scalata-riscuoti">${S.admin ? "Chiudi" : "Riscuoti"}</button></div>`; }
    const prossimo = s.fase !== "fine" && s.fase !== "draft" ? PremiModalita.scalata(R.pianiSuperati(s)) : null;
    return `<section class="modo scalata"><div class="titolo-riga"><h2>🗼 La Scalata</h2><span class="modo-tasti">${s.fase !== "draft" && s.fase !== "fine" ? `<span class="scalata-vite">${"❤️".repeat(s.vite)}${"🖤".repeat(R.VITE - s.vite)}</span>` : ""}<button class="btn piccolo" data-azione="scalata-regole">Come si gioca</button></span></div>
      ${s.squadra ? `<div class="notte-stato"><span class="gettoni">🗼 Piano <b>${s.piano}</b>${prossimo ? ` · se ti fermi ora: ${esc(testoPremio(prossimo))}` : ""}</span><span class="cimeli">${cim(s.cimeli) || `<small class="nota">Ancora nessun cimelio</small>`}</span></div>${s.fase === "potenziamento" && s.scegliCarta != null || s.nuovaScelta ? "" : htmlSquadra(s.squadra)}` : ""}
      ${corpo}</section>`;
  }
  function scegli(id) { const s = st(); if (!s || !R.scegliDraft(rng, s, id)) return; salva(); disegna(); }
  function combatti() { const s = st(); if (!s || s.fase !== "torre") return; s.battaglia = { seme: Math.floor(Math.random() * 2 ** 31), log: [] }; salva(); riprendi(); }
  function riprendi() {
    const s = st(); if (!s || !s.battaglia || B) return;
    const L = { id: "scalata", nome: `Scalata · piano ${s.piano}`, abilita: R.abilita(s.piano), liv: [1, 30], premio: 0, punti: 0, xp: 0, modo: Scalata, seme: s.battaglia.seme, rigioca: s.battaglia.log,
      squadraMia: s.squadra.map(R.voceBattaglia) };
    avviaSfida(L, null, s.bot.squadra.map(R.voceBattaglia), true);
  }
  function prepara(Bt) { R.prepara(Bt, st()); }
  function passo(e) { const s = st(); if (s && s.battaglia) { s.battaglia.log.push(e); salva(); } }
  let esito = null;
  function chiudi() {
    const s = st(); if (!s) return; const vinto = B.vincitore === 0;
    s.battaglia = null; esito = { vinto, piano: s.piano };
    if (vinto) R.vittoria(rng, s); else R.sconfitta(s);
    if (vinto && !S.admin) {
      const p = R.pianiSuperati(s), w = Missioni.settimana();
      Missioni.evento("modo", { n: 1 }); SfidePass.evento({ t: "modo", n: 1, piano: p });
      // record della settimana per la classifica tra amici (e record di sempre per i trofei)
      const rs = S.stats.scalataSett && S.stats.scalataSett.sett === w ? S.stats.scalataSett.piano : 0;
      S.stats.scalataSett = { sett: w, piano: Math.max(rs, p) }; S.stats.scalataMax = Math.max(S.stats.scalataMax || 0, p); Trofei.controlla();
    }
    salva(); aggiornaBattaglia();
  }
  function htmlFine() {
    const e = esito || { vinto: B.vincitore === 0 }, s = st();
    return `<div class="fine ${e.vinto ? "vinto" : "perso"}"><b>${e.vinto ? `Piano ${e.piano} superato!` : "Sconfitta"}</b>
      <span>${e.vinto ? "La squadra sale di 1 livello: scegli il potenziamento." : s && s.fase === "fine" ? "Hai finito le vite: la scalata finisce qui." : `Perdi una vita (ne restano ${s ? s.vite : 0}). Riprova lo stesso piano.`}</span>
      <div class="azioni centro"><button class="btn primario" data-fx="onda" data-azione="esci-battaglia">Continua</button></div></div>`;
  }
  function scegliPot(i) {
    const s = st(); if (!s || s.fase !== "potenziamento") return; const p = s.offerta[i]; if (!p) return;
    if (R.serveCarta(p)) { s.scegliCarta = i; salva(); disegna(); return; }
    R.applica(p, s.squadra, s.cimeli); dopoPot(s, p);
  }
  function suCarta(i) {
    const s = st(); if (!s) return;
    if (s.fase === "cambio" && s.nuovaScelta) { R.cambia(rng, s, s.nuovaScelta, i); s.nuovaScelta = null; salva(); disegna(); return; }
    if (s.fase !== "potenziamento" || s.scegliCarta == null) return;
    const p = s.offerta[s.scegliCarta]; if (!R.cartaOk(p, s.squadra[i])) return;
    R.applica(p, s.squadra, s.cimeli, i); s.scegliCarta = null; dopoPot(s, p);
  }
  function dopoPot(s, p) { s.offerta = null; s.scegliCarta = null; R.dopoPotenziamento(rng, s); salva(); disegna(); scrollTo(0, 0); FX.esplosione(innerWidth / 2, innerHeight / 3, { n: 40, forma: "stella", colori: ["#f2c14e", "#9a6aff", "#3fd8ff"], velocita: 7, dimensione: 5 }); }
  function annullaCarta() { const s = st(); if (s) { s.scegliCarta = null; s.nuovaScelta = null; salva(); disegna(); } }
  function nuovaCarta(id) { const s = st(); if (!s || s.fase !== "cambio" || !s.cambio.includes(id)) return; s.nuovaScelta = id; salva(); disegna(); }
  function noCambio() { const s = st(); if (!s || s.fase !== "cambio") return; s.nuovaScelta = null; R.cambia(rng, s, null); salva(); disegna(); }
  function fermati(el) {
    const s = st(); if (!s || s.fase !== "torre") return;
    if (!el.dataset.sicuro) { el.dataset.sicuro = "1"; el.textContent = "Sicuro? Tocca di nuovo"; return; }
    s.fase = "fine"; s.finita = "fermo"; salva(); disegna();
  }
  function riscuoti(el) {
    const s = st(); if (!s || s.fase !== "fine") return;
    const p = R.pianiSuperati(s), pr = PremiModalita.scalata(p);
    if (!S.admin) { daiPremio(pr); aggiungiXP(ridXP(PremiModalita.XP_BATTAGLIA * p)); S.stats.scalate = (S.stats.scalate || 0) + 1; S.stats.scalataMax = Math.max(S.stats.scalataMax || 0, p); }
    S.scalata = null; salva(); aggiornaTesta(); vai("sfida");
    if (!S.admin) mostraAvviso(`La Scalata (${p} piani): ${testoPremio(pr)}!`);
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 60, forma: "stella", colori: ["#f2c14e", "#3fd8ff", "#ffffff"], velocita: 8, dimensione: 6 }); }
  }
  function regole() {
    const P = PremiModalita, righe = [1, 3, 5, 8, 10, 12, 15, 20].map(p => `<tr><td>${p} pian${p > 1 ? "i" : "o"}</td><td>${esc(testoPremio(P.scalata(p)))}</td></tr>`).join("");
    apriModale(`<div class="modo-regole"><span class="codice-tag">🗼 La Scalata</span><h2>Come si gioca</h2>
      <ol>
        <li><b>Ti fai la squadra.</b> Come nell'Arena scegli 5 volte una carta tra 3 (una leggendaria, due epiche, una rara, una comune), ma <b>partono tutte dal livello 1</b>. La tua collezione qui non conta.</li>
        <li><b>A ogni piano vinto</b> la squadra sale di 1 livello e scegli <b>un potenziamento tra tre</b>, di rarità diverse: livelli, olografica, Ultra, Ascesa o un cimelio. Più sali, più escono potenziamenti rari.</li>
        <li><b>Anche il bot sale.</b> A ogni piano prende un suo potenziamento (lo vedi prima di combattere), cambia due carte e gioca meglio. Dal piano 13 diventa anche più forte del 5% a piano.</li>
        <li><b>Ogni 3 piani</b> puoi cambiare una carta: la nuova tiene il livello di quella che lascia.</li>
        <li><b>Hai 3 vite.</b> Se perdi riprovi lo stesso piano. I piani non finiscono mai: ti fermi alla terza sconfitta, oppure quando vuoi con «Mi fermo qui».</li>
      </ol>
      <h3>I cimeli</h3><div class="regole-cimeli">${Object.entries(CIMELI).filter(([, c]) => c.solo !== "notte").map(([, c]) => `<div><span>${c.ico}</span><b>${esc(c.nome)}</b><small>${esc(c.desc)}</small></div>`).join("")}</div>
      <p class="nota">Quelli leggendari (Insegna, Panino, Canini, Petardo) si sommano se li prendi di nuovo.</p>
      <h3>I premi</h3><p class="nota">Ingresso ${P.INGRESSO_SCALATA} monete. Il premio cresce con i piani, con una bustina in più ai piani 5, 10 e 15.</p>
      <table class="regole-premi"><tbody>${righe}</tbody></table>
      <div class="azioni centro"><button class="btn primario" data-azione="chiudi">Ho capito</button></div></div>`);
  }
  function info(i) { const s = st(), x = s && s.squadra[i]; if (x) apriSchedaCarta({ id: x.id, liv: x.liv, olo: x.olo, ultra: x.ultra }); }
  return { vista: "scalata", htmlSfida, entra, regole, html: vista, scegli, combatti, riprendi, prepara, passo, chiudi, htmlFine, scegliPot, suCarta, annullaCarta, nuovaCarta, noCambio, fermati, riscuoti, info, stato: st };
})();
