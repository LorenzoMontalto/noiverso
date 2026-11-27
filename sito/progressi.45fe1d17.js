// ============================================================
//  PROGRESSI (nov 2026)
//  - Livello giocatore: un livello dell'account, separato dal pass, con punti suoi (punti Fama ✦).
//    Si guadagnano un po' con tutto: battaglie, storia, carte nuove, potenziamenti, missioni, trofei.
//    100 livelli; ogni livello dà monete, ogni 5 una bustina epica, ogni 10 una leggendaria e un titolo,
//    al 25, 50, 75 e 100 una Bustina Ultra.
//  - Sfide del pass: 3 sfide al giorno e 4 alla settimana che danno tanti XP del pass.
//    Da nov 2026 battaglie, bustine e missioni danno solo un quinto degli XP di prima: il pass sale soprattutto con le sfide.
// ============================================================

const Livello = (() => {
  const MAX = 100;
  // nov 2026: curva accorciata (era 100 + 20 a livello: il 100 arrivava dopo circa 8 mesi). Ora circa 5 settimane per il 50 e 4 mesi per il 100.
  const serve = L => 90 + 10 * (L - 1);                               // punti per passare da L a L+1 (1→2: 90, 49→50: 570, 99→100: 1070)
  const totaleA = L => 90 * (L - 1) + 5 * (L - 1) * (L - 2);          // punti per arrivare al livello L (al 50: 16.170, al 100: 57.420)
  const TITOLI = { 10: "Veterano", 20: "Campione", 30: "Gran Maestro", 40: "Leggenda vivente", 50: "Mito del Noiverso",
    60: "Signore delle carte", 70: "Imbattibile", 80: "Leggenda del gruppo", 90: "Semidio", 100: "Il Numero Uno" };
  // quanto vale ogni cosa (lo stesso elenco si vede nella finestra «Come si guadagna»)
  const PUNTI = {
    computer: { recluta: 10, sfidante: 15, boss: 25, leggenda: 40 }, settimana: 30, bossGiorno: 60, bossGiornoAncora: 15,
    storia: 20, storiaBoss: 40, stella: 15, vivo: 50, vivoPersa: 15, amico: 25, amicoPersa: 5, bossGruppo: 20, persa: 3,
    carta: { comune: 5, rara: 10, epica: 20, leggendaria: 50, jolly: 30 }, olo: 25, ultra: 100,
    potenzia: 2, al30: 40, lode: 80, ascesa: 60, missione: 20, missioneSett: 60, trofeo: 40, accesso: 10,
  };
  const COME = [
    ["Vittoria contro il computer", "Recluta 10 · Sfidante 15 · Boss 25 · Leggenda 40 (in modalità rapida il 60%)"],
    ["Sfida della settimana vinta", "30"], ["Boss del giorno battuto", "60 (15 se l'avevi già battuto oggi)"],
    ["Tappa della storia vinta", "20 (tappa del boss 40) + 15 per ogni stella nuova"],
    ["Partita dal vivo", "vinta 50 · persa 15"], ["Sfida a un amico", "vinta 25 · persa 5"], ["Attacco al boss di gruppo", "20"],
    ["Sconfitta contro il computer", "3 (se dura almeno 3 turni)"],
    ["Carta nuova", "comune 5 · rara 10 · epica 20 · leggendaria 50 · olografica +25 · Ultra +100"],
    ["Potenziamento", "2 a livello · carta al 30: +40 · lode: +80 · ascesa: +60"],
    ["Missioni e premi", "missione del giorno 20 · della settimana 60 · trofeo 40 · premio di accesso 10"],
  ];
  const attivo = () => typeof S !== "undefined" && S && !S.admin && S.profilo && S.profilo.nome;
  function info() {
    const p = (S.lv && S.lv.punti) || 0;
    let L = 1; while (L < MAX && p >= totaleA(L + 1)) L++;
    return { liv: L, punti: p, dentro: p - totaleA(L), serve: L < MAX ? serve(L) : 0, max: L >= MAX };
  }
  function premio(L) {
    const p = { monete: piuMonete(50 + 5 * L) }, b = {};   // nov 2026: era 50 + 10 × L (troppe monete con maestria e Arena)
    if (L % 5 === 0) b.epica = 1;
    if (L % 10 === 0) b.leggendaria = 1;
    if (L % 25 === 0) b.ultra = 1;   // 25, 50, 75, 100
    if (L === MAX) b.leggendaria = 2;  // il livello 100: premio speciale
    if (Object.keys(b).length) p.bustine = b;
    return p;
  }
  const premiExtra = {};   // cosmetici legati a certi livelli (li aggiunge extra.js)
  const testoPremioLv = L => testoPremio(premio(L)) + (TITOLI[L] ? ` e il titolo «${TITOLI[L]}»` : "") + (premiExtra[L] ? ` + ${premiExtra[L].testo}` : "");
  // chi giocava già prima: parte dal livello che corrisponde a quello che ha fatto finora
  function iniziali() {
    let p = 0; const st = S.stats || {};
    p += (st.vittorie || 0) * 15;
    for (const id in S.carte || {}) if (S.carte[id] && PER_ID[id]) p += PUNTI.carta[PER_ID[id].rarita] || 0;
    p += Object.keys(S.olo || {}).filter(id => S.olo[id]).length * PUNTI.olo;
    p += Object.keys(S.ultra || {}).filter(id => S.ultra[id]).length * PUNTI.ultra;
    p += Object.values((S.storia && S.storia.stelle) || {}).reduce((a, b) => a + (+b || 0), 0) * PUNTI.stella;
    for (const id in S.liv || {}) { const l = +S.liv[id] || 1; p += (l - 1) * PUNTI.potenzia + (l >= LIVELLO_MAX ? PUNTI.al30 : 0); }
    p += Object.keys(S.lodeXp || {}).filter(id => S.lodeXp[id] >= XP_LODE).length * PUNTI.lode;
    p += (st.ascese || 0) * PUNTI.ascesa;
    p += Object.keys(S.trofei || {}).filter(id => S.trofei[id]).length * PUNTI.trofeo;
    return Math.min(Math.round(p), totaleA(MAX));
  }
  let pubblicato = 0;
  function controlla() {
    if (!attivo()) return;
    // la riga della classifica si aggiorna appena entri e ogni volta che il livello cambia (anche senza battaglie)
    if (S.lv && typeof S.lv === "object") { const l = info().liv; if (l !== pubblicato) { pubblicato = l; Archivio.pubblicaClassifica(); } return; }
    S.lv = { punti: iniziali(), riscossi: [] };
    const l = info().liv;
    salva(); pubblicato = l; Archivio.pubblicaClassifica();
    if (l > 1) setTimeout(() => mostraAvviso(`Novità: il livello giocatore! Per quello che hai fatto finora parti dal livello ${l}: hai ${l - 1} ${l === 2 ? "premio" : "premi"} da riscuotere nella Strada.`), 2500);
  }
  function daRiscuotere() { if (!S.lv) return []; const l = info().liv, out = []; for (let k = 2; k <= l; k++) if (!S.lv.riscossi.includes(k)) out.push(k); return out; }
  function guadagna(n) {
    if (!attivo() || !(n > 0)) return;
    controlla();
    const prima = info().liv;
    S.lv = Object.assign({}, S.lv, { punti: S.lv.punti + Math.round(n) });
    const dopo = info().liv;
    if (dopo > prima) {
      setTimeout(() => { mostraAvviso(`✦ Livello giocatore ${dopo}! Premio da riscuotere nella Strada: ${testoPremioLv(dopo)}.`); if (typeof FX !== "undefined") FX.esplosione(innerWidth / 2, 80, { n: 50, forma: "stella", colori: ["#9ad8ff", "#ffffff", "#f2c14e"], velocita: 7, dimensione: 5 }); }, 1400);
      Archivio.pubblicaClassifica();
    }
  }
  function riscuoti(el) {
    const lista = daRiscuotere(); if (!lista.length) return;
    const tot = { monete: 0, bustine: {} };
    for (const L of lista) { const p = premio(L); tot.monete += p.monete; for (const [t, n] of Object.entries(p.bustine || {})) tot.bustine[t] = (tot.bustine[t] || 0) + n; }
    daiPremio(tot);
    for (const L of lista) if (premiExtra[L]) premiExtra[L].dai();
    S.lv = Object.assign({}, S.lv, { riscossi: S.lv.riscossi.concat(lista) });
    salva(); aggiornaTesta(); Trofei.controlla(); disegna();
    if (document.querySelector(".lv-pagina")) apriLivelli();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 70, forma: "stella", colori: ["#9ad8ff", "#f2c14e", "#ffffff"], velocita: 8, dimensione: 6 }); }
    const titoli = lista.filter(L => TITOLI[L]).map(L => `«${TITOLI[L]}»`);
    mostraAvviso(`Livello giocatore: ${testoPremio(tot)}${titoli.length ? `. Nuovi titoli nei trofei: ${titoli.join(", ")}` : ""}!`);
  }
  // ---------- cosa succede nel gioco ----------
  // fine di ogni battaglia (chiamata da premiaCarte): L = livelloAttuale, risultati = carte con lodeNuova ecc.
  function fineBattaglia(vinto, risultati) {
    const L = typeof livelloAttuale !== "undefined" ? livelloAttuale : null;
    if (!L || L.spettatore || !attivo()) return;
    const rapida = typeof carteBattaglia === "function" && carteBattaglia() === 3 ? .6 : 1;
    let p = 0;
    if (L.bossGruppo) p = PUNTI.bossGruppo;
    else if (L.vivo) p = vinto ? PUNTI.vivo : PUNTI.vivoPersa;
    else if (L.amico) p = vinto ? PUNTI.amico : PUNTI.amicoPersa;
    else if (!vinto) p = B && B.turno >= 3 && !L.resa ? PUNTI.persa : 0;
    else if (L.storia) { const t = STORIA[L.storia.k] && STORIA[L.storia.k].tappe[L.storia.i]; p = t && t.boss ? PUNTI.storiaBoss : PUNTI.storia; }
    else if (L.bossGiorno) p = BossGiorno.battutoOggi() ? PUNTI.bossGiornoAncora : PUNTI.bossGiorno;
    else if (L.settimana) p = PUNTI.settimana * rapida;
    else p = (PUNTI.computer[L.id] || PUNTI.computer.recluta) * rapida;
    p += (risultati || []).filter(r => r && r.lodeNuova).length * PUNTI.lode;
    guadagna(p);
  }
  function carteNuove(esiti) {
    let p = 0;
    for (const e of esiti || []) { if (e.nuova && PER_ID[e.id]) p += PUNTI.carta[PER_ID[e.id].rarita] || 0; if (e.olo) p += PUNTI.olo; if (e.ultra) p += PUNTI.ultra; }
    guadagna(p);
  }
  // ---------- grafica ----------
  const badge = (l, cls = "") => `<span class="lv-badge ${cls}" title="Livello giocatore ${l}">${l}</span>`;
  function htmlStrada() {
    if (!attivo() || !S.lv) return "";
    const i = info(), r = daRiscuotere(), prossimo = i.max ? null : i.liv + 1;
    return `<section class="livello-giocatore">
      <div class="lg-stemma">${badge(i.liv, "grande")}</div>
      <div class="lg-info"><p class="serie-nome">Livello giocatore</p>
        <div class="xp"><div class="xp-barra lg-barra"><i style="--p:${i.max ? 100 : i.dentro / i.serve * 100}%"></i></div>
          <small>${i.max ? "Livello 100: il massimo!" : `${i.dentro} / ${i.serve} ✦ al livello ${prossimo} · premio: ${esc(testoPremioLv(prossimo))}`}</small></div></div>
      <div class="lg-azioni">${r.length ? `<button class="btn oro" data-fx="coriandoli" data-azione="livello-riscuoti">Riscuoti ${r.length === 1 ? "il premio" : `${r.length} premi`}</button>` : ""}
        <button class="btn piccolo" data-azione="livello-pagina">Tutti i livelli e premi</button></div>
    </section>`;
  }
  // Tutti i livelli in una pagina: premi già presi, da riscuotere, il livello attuale e quelli futuri
  function apriLivelli() {
    if (!S.lv) controlla();
    const i = info(), r = daRiscuotere();
    const icona = L => { const p = premio(L); return p.bustine && p.bustine.ultra ? "🌟" : p.bustine && p.bustine.leggendaria ? "👑" : p.bustine && p.bustine.epica ? "🎁" : "🪙"; };
    const tessere = Array.from({ length: MAX }, (_, k) => {
      const L = k + 1, preso = S.lv.riscossi.includes(L), raggiunto = L <= i.liv, attuale = L === i.liv;
      if (L === 1) return `<div class="lvt preso inizio"><span class="lvt-num">${badge(1)}</span><span class="lvt-premio">Inizio</span></div>`;
      const stato = preso ? "preso" : raggiunto ? "pronto" : "futuro";
      const mancano = raggiunto ? 0 : totaleA(L) - i.punti;
      return `<div class="lvt ${stato}${attuale ? " attuale" : ""}${TITOLI[L] ? " titolo" : ""}${premio(L).bustine ? " grande" : ""}" id="lvt-${L}">
        <span class="lvt-num">${badge(L)}</span>
        <span class="lvt-ico" aria-hidden="true">${icona(L)}</span>
        <span class="lvt-premio">${esc(testoPremio(premio(L)))}${TITOLI[L] ? `<b class="lvt-titolo">Titolo «${esc(TITOLI[L])}»</b>` : ""}${premiExtra[L] ? `<b class="lvt-titolo">${esc(premiExtra[L].testo)}</b>` : ""}</span>
        <span class="lvt-stato">${preso ? "Riscosso ✓" : raggiunto ? "Da riscuotere" : `mancano ${mancano.toLocaleString("it-IT")} ✦`}</span>
      </div>`;
    }).join("");
    apriModale(`<div class="lv-pagina">
      <div class="lv-testa">${badge(i.liv, "grande")}<div><span class="codice-tag">Livello giocatore</span><h2>Livello ${i.liv}${i.max ? " · massimo" : ""}</h2>
        <div class="xp"><div class="xp-barra lg-barra"><i style="--p:${i.max ? 100 : i.dentro / i.serve * 100}%"></i></div>
        <small>${i.max ? "Hai raggiunto il livello 100, il più alto." : `${i.dentro} / ${i.serve} ✦ al livello ${i.liv + 1}`} · ${i.punti.toLocaleString("it-IT")} ✦ in tutto</small></div></div></div>
      <div class="azioni">${r.length ? `<button class="btn oro" data-fx="coriandoli" data-azione="livello-riscuoti">Riscuoti ${r.length === 1 ? "il premio" : `${r.length} premi`}</button>` : ""}<button class="btn" data-azione="livello-info">Come si sale</button><button class="btn" data-azione="chiudi">Chiudi</button></div>
      <div class="lv-griglia">${tessere}</div>
    </div>`);
    setTimeout(() => { const el = document.getElementById(`lvt-${Math.min(MAX, i.liv + 1)}`); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 150);
  }
  function apriInfo() {
    const i = info();
    const prossimi = []; for (let L = Math.max(2, i.liv - 1); L <= Math.min(MAX, i.liv + 8); L++) prossimi.push(L);
    apriModale(`<div class="codice-modale lg-modale"><span class="codice-tag">Livello giocatore ${i.liv}</span>
      <h2>Come si sale di livello</h2>
      <p class="nota">Il livello giocatore è separato dal pass e non si azzera mai. Si sale con i punti Fama ✦, che arrivano un po' da tutto quello che fai. Livelli: ${MAX}.</p>
      <table class="lg-tab">${COME.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)} ✦</td></tr>`).join("")}</table>
      <h3>Premi</h3>
      <p class="nota">Ogni livello: monete (50 + 5 × il livello). Ogni 5 livelli anche una bustina epica, ogni 10 una leggendaria e un titolo, al 25, 50, 75 e 100 una Bustina Ultra.</p>
      <ul class="lg-premi">${prossimi.map(L => `<li class="${L <= i.liv ? (S.lv.riscossi.includes(L) ? "preso" : "pronto") : ""}">${badge(L)} ${esc(testoPremioLv(L))}${L <= i.liv && !S.lv.riscossi.includes(L) ? " · <b>da riscuotere</b>" : L <= i.liv ? " ✓" : ""}</li>`).join("")}</ul>
      <div class="azioni centro"><button class="btn" data-azione="livello-pagina">Tutti i livelli e premi</button><button class="btn" data-azione="chiudi">Chiudi</button></div></div>`);
  }
  return { premiExtra, apriLivelli, MAX, TITOLI, PUNTI, info, controlla, guadagna, riscuoti, daRiscuotere, fineBattaglia, carteNuove, htmlStrada, apriInfo, badge, totaleA };
})();

// ---------------- Sfide del pass ----------------
const SfidePass = (() => {
  // ogni sfida: n da fare, XP del pass (pieni, non ridotti), e quanto conta un evento
  const GIORNO = [
    { id: "vinci-3", n: 3, xp: 150, testo: "Vinci 3 battaglie", conta: e => e.t === "battaglia" && e.vinto ? 1 : 0 },
    { id: "finali-3", n: 3, xp: 150, testo: "Usa 3 mosse finali (quelle da 5 energia)", conta: e => e.t === "battaglia" ? e.finali : 0 },
    { id: "serie-1", n: 1, xp: 150, testo: "Vinci con almeno 3 carte della stessa serie", conta: e => e.t === "battaglia" && e.vinto && e.serieMax >= 3 ? 1 : 0 },
    { id: "ko-10", n: 10, xp: 150, testo: "Manda KO 10 carte nemiche", conta: e => e.t === "battaglia" ? e.ko : 0 },
    { id: "storia-1", n: 1, xp: 150, testo: "Vinci una tappa della storia (anche rigiocata)", conta: e => e.t === "battaglia" && e.vinto && e.tipo === "storia" ? 1 : 0 },
    { id: "difficile-1", n: 1, xp: 200, testo: "Vinci una sfida Boss o Leggenda contro il computer", conta: e => e.t === "battaglia" && e.vinto && (e.tipo === "boss" || e.tipo === "leggenda") ? 1 : 0 },
    { id: "bustine-2", n: 2, xp: 120, testo: "Apri 2 bustine", conta: e => e.t === "bustina" ? 1 : 0 },
    { id: "potenzia-3", n: 3, xp: 120, testo: "Potenzia 3 volte una carta", conta: e => e.t === "potenzia" ? 1 : 0 },
    { id: "amici-1", n: 1, xp: 200, testo: "Vinci contro un amico o dal vivo", conta: e => e.t === "battaglia" && e.vinto && (e.tipo === "amico" || e.tipo === "vivo") ? 1 : 0 },
    { id: "modi-3", n: 3, xp: 150, testo: "Supera 3 fermate della Lunga Notte o piani della Scalata", conta: e => e.t === "modo" ? e.n : 0 },
  ];
  const SETTIMANA = [
    { id: "vinci-15", n: 15, xp: 600, testo: "Vinci 15 battaglie", conta: e => e.t === "battaglia" && e.vinto ? 1 : 0 },
    { id: "leggenda-5", n: 5, xp: 700, testo: "Vinci 5 sfide Leggenda contro il computer", conta: e => e.t === "battaglia" && e.vinto && e.tipo === "leggenda" ? 1 : 0 },
    { id: "storia-5", n: 5, xp: 500, testo: "Vinci 5 tappe della storia (anche rigiocate)", conta: e => e.t === "battaglia" && e.vinto && e.tipo === "storia" ? 1 : 0 },
    { id: "boss-2", n: 2, xp: 700, testo: "Batti 2 volte il boss del giorno", conta: e => e.t === "battaglia" && e.vinto && e.tipo === "bossGiorno" ? 1 : 0, serve: () => BossGiorno.sbloccato() },
    { id: "finali-20", n: 20, xp: 500, testo: "Usa 20 mosse finali", conta: e => e.t === "battaglia" ? e.finali : 0 },
    { id: "vivo-3", n: 3, xp: 700, testo: "Vinci 3 partite contro amici o dal vivo", conta: e => e.t === "battaglia" && e.vinto && (e.tipo === "amico" || e.tipo === "vivo") ? 1 : 0 },
    { id: "sinergia-3", n: 3, xp: 600, testo: "Vinci 3 battaglie con 5 carte della stessa serie", conta: e => e.t === "battaglia" && e.vinto && e.serieMax >= 5 ? 1 : 0 },
    { id: "ko-50", n: 50, xp: 500, testo: "Manda KO 50 carte nemiche", conta: e => e.t === "battaglia" ? e.ko : 0 },
    { id: "bustine-8", n: 8, xp: 400, testo: "Apri 8 bustine", conta: e => e.t === "bustina" ? 1 : 0 },
    { id: "alba-1", n: 1, xp: 700, testo: "Arriva all'alba nella Lunga Notte", conta: e => e.t === "modo" && e.alba ? 1 : 0 },
    { id: "piano-8", n: 1, xp: 600, testo: "Supera l'ottavo piano della Scalata", conta: e => e.t === "modo" && e.piano >= 8 ? 1 : 0 },
  ];
  const attivo = () => typeof S !== "undefined" && S && !S.admin && S.profilo && S.profilo.nome;
  const scegli = (pool, k, chiave) => {   // sempre le stesse per tutto il giorno (o la settimana), uguali per tutti
    let h = hashTesto(chiave); const l = pool.slice(), out = [];
    while (out.length < k && l.length) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; out.push(l.splice(h % l.length, 1)[0].id); }
    return out;
  };
  function stato() {
    const g = chiaveGiorno(new Date()), w = chiaveGiorno(lunediDi());
    let s = S.sfidePass && typeof S.sfidePass === "object" ? S.sfidePass : null;
    if (!s || s.giorno !== g) s = Object.assign({}, s, { giorno: g, gIds: scegli(GIORNO, 3, "pass-g:" + g), g: {}, gFatte: [] });
    if (s.settimana !== w) s = Object.assign({}, s, { settimana: w, sIds: scegli(SETTIMANA.filter(x => !x.serve || x.serve()), 4, "pass-s:" + w), s: {}, sFatte: [] });
    if (s !== S.sfidePass) S.sfidePass = s;
    return s;
  }
  function evento(e) {
    if (!attivo()) return;
    const s = stato(), fatte = [];
    for (const [ids, prog, done, pool] of [[s.gIds, "g", "gFatte", GIORNO], [s.sIds, "s", "sFatte", SETTIMANA]]) for (const id of ids) {
      const c = pool.find(x => x.id === id); if (!c || s[done].includes(id)) continue;
      const q = c.conta(e) || 0; if (!q) continue;
      s[prog] = Object.assign({}, s[prog], { [id]: Math.min(c.n, (s[prog][id] || 0) + q) });
      if (s[prog][id] >= c.n) { s[done] = s[done].concat(id); fatte.push(c); }
    }
    for (const c of fatte) {
      const su = aggiungiXP(c.xp, true);
      setTimeout(() => mostraAvviso(`Sfida del pass completata: ${c.testo}. +${c.xp} XP${su ? ` · Pass livello ${su}!` : ""}`), 2200);
    }
  }
  // dati della battaglia appena finita
  function fineBattaglia(vinto) {
    const L = typeof livelloAttuale !== "undefined" ? livelloAttuale : null;
    if (!L || L.spettatore || typeof B === "undefined" || !B) return;
    const tipo = L.storia ? "storia" : L.vivo ? "vivo" : L.amico ? "amico" : L.bossGruppo ? "bossGruppo" : L.bossGiorno ? "bossGiorno" : L.settimana ? "settimana" : L.id;
    const ids = B.lati[0].squadra.map(x => x.id), perSerie = {};
    for (const id of ids) if (PER_ID[id]) perSerie[PER_ID[id].serie] = (perSerie[PER_ID[id].serie] || 0) + 1;
    evento({ t: "battaglia", vinto, tipo, finali: (B.finali && B.finali[0]) || 0, ko: B.lati[1].squadra.filter(x => x.pv <= 0).length, serieMax: Math.max(0, ...Object.values(perSerie)) });
  }
  function htmlPass() {
    if (!attivo()) return `<p class="nota">Le sfide del pass si vedono con il profilo normale.</p>`;
    const s = stato();
    const riga = (pool, prog, fatte) => id => { const c = pool.find(x => x.id === id); if (!c) return ""; const v = Math.min(c.n, s[prog][id] || 0), ok = s[fatte].includes(id);
      return `<li class="${ok ? "fatta" : ""}"><span class="sp-testo">${esc(c.testo)}</span><span class="sp-xp">+${c.xp} XP</span>
        <div class="sp-barra"><i style="--p:${v / c.n * 100}%"></i></div><small>${ok ? "Completata ✓" : `${v} / ${c.n}`}</small></li>`; };
    return `<section class="sfide-pass">
      <div class="titolo-riga piccola"><h3>Sfide del pass</h3><p class="nota">Le battaglie danno pochi XP: il pass sale soprattutto con queste sfide. Gli XP arrivano da soli appena le completi.</p></div>
      <div class="sp-colonne">
        <div><p class="sp-tit">Di oggi <small>· nuove a mezzanotte</small></p><ul class="sp-lista">${s.gIds.map(riga(GIORNO, "g", "gFatte")).join("")}</ul></div>
        <div><p class="sp-tit">Della settimana <small>· nuove ogni lunedì</small></p><ul class="sp-lista">${s.sIds.map(riga(SETTIMANA, "s", "sFatte")).join("")}</ul></div>
      </div></section>`;
  }
  return { evento, fineBattaglia, htmlPass, stato, GIORNO, SETTIMANA };
})();

// Agganci agli eventi delle missioni (bustine aperte, potenziamenti, stelle della storia, premi riscossi)
if (typeof Missioni !== "undefined" && !Missioni._progressi) {
  const orig = Missioni.evento;
  Missioni.evento = (tipo, d = {}) => {
    orig(tipo, d);
    try {
      if (tipo === "bustina") SfidePass.evento({ t: "bustina" });
      if (tipo === "potenzia") {
        SfidePass.evento({ t: "potenzia" });
        Livello.guadagna(Livello.PUNTI.potenzia + (d.id && S.liv && S.liv[d.id] >= LIVELLO_MAX ? Livello.PUNTI.al30 : 0));
      }
      if (tipo === "storia" && d.nuove) Livello.guadagna(d.nuove * Livello.PUNTI.stella);
    } catch (e) { /* niente */ }
  };
  Missioni._progressi = true;
}
