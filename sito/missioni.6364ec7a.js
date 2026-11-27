// ============================================================
//  MISSIONI E PREMI DI ACCESSO
//  Ogni giorno 3 missioni (più un bonus se le fai tutte), ogni settimana 3 missioni più grandi,
//  e un calendario di 7 giorni di accesso: se salti un giorno si riparte dal primo.
//  Le missioni sono scelte "a caso" ma in modo fisso per quel giorno e quel giocatore,
//  così se ricarichi la pagina non cambiano.
// ============================================================
const Missioni = (() => {
  const XP_GIORNO = 8, XP_SETT = 30;   // nov 2026: un quinto di prima (il pass sale con le Sfide del pass)
  const POOL = {
    vinci:        { n: 2, testo: m => `Vinci ${m.n} battaglie`, premio: { monete: piuMonete(80) } },
    serie:        { n: 1, testo: m => `Vinci con almeno 2 carte ${SERIE[m.serie] ? SERIE[m.serie].nome : ""} in squadra`, premio: { monete: piuMonete(100) } },
    bustina:      { n: 2, testo: m => `Apri ${m.n} bustine`, premio: { monete: piuMonete(60) } },
    potenzia:     { n: 1, testo: () => "Potenzia una carta", premio: { monete: piuMonete(80) } },
    "tre-stelle": { n: 1, testo: () => "Prendi 3 stelle in una tappa della storia", premio: { monete: piuMonete(100) } },
    amico:        { n: 1, online: true, testo: () => "Sfida la squadra di un amico", premio: { monete: piuMonete(100) } },
    boss:         { n: 1, online: true, testo: () => "Attacca il boss del gruppo", premio: { monete: piuMonete(100) } },
    modi:         { n: 3, testo: m => `Supera ${m.n} fermate della Lunga Notte o piani della Scalata`, premio: { monete: piuMonete(120) } },
  };
  const POOL_SETT = {
    vinci:         { n: 15, testo: m => `Vinci ${m.n} battaglie`, premio: { bustine: { epica: 1 } } },
    bustina:       { n: 8, testo: m => `Apri ${m.n} bustine`, premio: { monete: piuMonete(300) } },
    "amico-vinci": { n: 3, online: true, testo: m => `Batti ${m.n} volte la squadra di un amico`, premio: { bustine: { epica: 1 } } },
    "boss-danni":  { n: 5000, online: true, testo: m => `Fai ${m.n.toLocaleString("it-IT")} danni al boss`, premio: { bustine: { mega: 1 } } },
    stelle:        { n: 10, testo: m => `Prendi ${m.n} stelle nella storia`, premio: { monete: piuMonete(300) } },
    modi:          { n: 20, testo: m => `Supera ${m.n} tra fermate della Lunga Notte e piani della Scalata`, premio: { bustine: { epica: 1 } } },
  };
  const BONUS = { bustine: { normale: 1 } };
  // giorno 4: una bustina di una serie a caso (scelta quando la riscuoti)
  const ACCESSI = [{ monete: piuMonete(100) }, { bustine: { normale: 1 } }, { monete: piuMonete(150) }, { serieCaso: true }, { monete: piuMonete(200) }, { bustine: { mega: 1 } }, { bustine: { epica: 1 } }];

  const online = () => !!window.NOIVERSO_SUPABASE && Archivio.modo === "cloud";
  const giorno = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const ieri = () => { const d = new Date(); d.setDate(d.getDate() - 1); return giorno(d); };
  function settimana(d = new Date()) {   // settimana ISO, da lunedì a domenica (come il boss)
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dw = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dw);
    const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y) / 864e5 + 1) / 7)).padStart(2, "0")}`;
  }
  // numeri "casuali" ma sempre uguali per lo stesso seme
  function rng(seme) { let h = 2166136261; for (const ch of seme) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
  function pesca(pool, quante, seme) {
    const r = rng(seme), tipi = Object.keys(pool).filter(t => !pool[t].online || online());
    const serieOk = Object.keys(SERIE).filter(id => possedute().filter(c => c.serie === id).length >= 2);
    const scelte = [];
    while (scelte.length < quante && tipi.length) {
      const t = tipi.splice(Math.floor(r() * tipi.length), 1)[0];
      if (t === "serie" && !serieOk.length) continue;
      const m = { tipo: t, n: pool[t].n, prog: 0, riscossa: false };
      if (t === "serie") m.serie = serieOk[Math.floor(r() * serieOk.length)];
      scelte.push(m);
    }
    return scelte;
  }
  function aggiorna() {
    const g = giorno(), w = settimana(), id = (Archivio.uid || S.profilo.nome || "io");
    const M = S.missioni = Object.assign({}, S.missioni || {});
    if (M.giorno !== g) { M.giorno = g; M.lista = pesca(POOL, 3, `${g}|${id}`); M.bonus = false; }
    if (M.settimana !== w) { M.settimana = w; M.sett = pesca(POOL_SETT, 3, `${w}|${id}|s`); }
    M.lista = (M.lista || []).map(m => Object.assign({}, m)); M.sett = (M.sett || []).map(m => Object.assign({}, m));
    return M;
  }
  const info = (m, sett) => (sett ? POOL_SETT : POOL)[m.tipo];
  const testo = (m, sett) => info(m, sett) ? info(m, sett).testo(m) : m.tipo;
  const premio = (m, sett) => info(m, sett) ? info(m, sett).premio : {};
  const pronte = () => { if (S.admin) return 0; const M = aggiorna(); return [...M.lista, ...M.sett].filter(m => m.prog >= m.n && !m.riscossa).length + (bonusPronto(M) ? 1 : 0) + (accesso().pronto ? 1 : 0); };
  const bonusPronto = M => !M.bonus && M.lista.length && M.lista.every(m => m.riscossa);

  // ---------- eventi dal gioco ----------
  function evento(tipo, d = {}) {
    if (S.admin) return;
    const M = aggiorna(), finite = [];
    const avanza = (m, sett, q = 1) => { if (m.prog >= m.n) return; m.prog = Math.min(m.n, m.prog + q); if (m.prog >= m.n) finite.push(testo(m, sett)); };
    for (const [lista, sett] of [[M.lista, false], [M.sett, true]]) for (const m of lista) {
      if (tipo === "vittoria" && m.tipo === "vinci") avanza(m, sett);
      if (tipo === "vittoria" && m.tipo === "serie" && (d.squadra || []).filter(id => PER_ID[id] && PER_ID[id].serie === m.serie).length >= 2) avanza(m, sett);
      if (tipo === "bustina" && m.tipo === "bustina") avanza(m, sett);
      if (tipo === "potenzia" && m.tipo === "potenzia") avanza(m, sett);
      if (tipo === "storia" && m.tipo === "tre-stelle" && d.tre) avanza(m, sett);
      if (tipo === "storia" && m.tipo === "stelle" && d.nuove) avanza(m, sett, d.nuove);
      if (tipo === "modo" && m.tipo === "modi") avanza(m, sett, d.n || 1);
      if (tipo === "amico" && m.tipo === "amico") avanza(m, sett);
      if (tipo === "amico" && m.tipo === "amico-vinci" && d.vinto) avanza(m, sett);
      if (tipo === "boss" && m.tipo === "boss") avanza(m, sett);
      if (tipo === "boss" && m.tipo === "boss-danni" && d.danni) avanza(m, sett, d.danni);
    }
    if (finite.length) setTimeout(() => mostraAvviso(`Missione completata: ${finite[0]}! Riscuoti il premio nella Strada.`), 1400);
    aggiornaTesta();
  }

  // ---------- premi ----------
  function dai(p) {
    const q = Object.assign({}, p);
    if (q.serieCaso) { const ids = Object.keys(SERIE).filter(k => !SERIE[k].jolly); q.bustine = { [`serie-${ids[Math.floor(Math.random() * ids.length)]}`]: 1 }; delete q.serieCaso; }
    daiPremio(q);
    return q;
  }
  function riscuoti(chi, el) {
    const M = aggiorna();
    let p, xp = 0, nome;
    if (chi === "bonus") { if (!bonusPronto(M)) return; M.bonus = true; p = BONUS; nome = "Bonus del giorno"; }
    else {
      const [l, i] = chi.split(":"), sett = l === "s", m = (sett ? M.sett : M.lista)[+i];
      if (!m || m.prog < m.n || m.riscossa) return;
      m.riscossa = true; p = premio(m, sett); xp = sett ? XP_SETT : XP_GIORNO; nome = testo(m, sett);
      Livello.guadagna(sett ? Livello.PUNTI.missioneSett : Livello.PUNTI.missione);
    }
    const dato = dai(p);
    const su = xp ? aggiungiXP(xp) : 0;
    salva(); aggiornaTesta();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 40, forma: "coriandolo", colori: ["#f2c14e", "#ff2e46", "#3fd8ff", "#fff"], velocita: 7, dimensione: 5 }); }
    mostraAvviso(`${nome}: ${testoPremio(dato)}${xp ? ` + ${xp} XP` : ""}`);
    if (su) setTimeout(() => mostraAvviso(`Pass: livello ${su} raggiunto!`), 1800);
    disegna();
  }
  function accesso() {
    const A = S.accessi || {}, g = giorno();
    if (A.riscosso === g) return { giorno: A.serie || 1, pronto: false };
    const prossimo = A.ultimo === ieri() ? (A.serie || 0) % 7 + 1 : 1;
    return { giorno: prossimo, pronto: true, persa: !!A.ultimo && A.ultimo !== ieri() && (A.serie || 0) > 1 };
  }
  function riscuotiAccesso(el) {
    const a = accesso(); if (!a.pronto || S.admin) return;
    const daFinestra = !!(el && el.closest && el.closest("#modale"));
    S.accessi = { ultimo: giorno(), riscosso: giorno(), serie: a.giorno };
    S.stats.serieMax = Math.max(S.stats.serieMax || 0, a.giorno);
    Livello.guadagna(Livello.PUNTI.accesso);
    const dato = dai(ACCESSI[a.giorno - 1]);
    salva(); aggiornaTesta();
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 50, forma: "stella", colori: ["#f2c14e", "#fff3c4", "#ff2e46"], velocita: 7, dimensione: 6 }); }
    mostraAvviso(`Premio di accesso, giorno ${a.giorno}: ${testoPremio(dato)}${a.giorno === 7 ? ". Settimana completa!" : ""}`);
    if (daFinestra) setTimeout(chiudiModale, ridotto ? 0 : 650);
    disegna();
  }
  // Appena apri il gioco: la finestra del premio di accesso (aspetta tutorial, battaglie e altre finestre)
  let finestraInAttesa = false, giornoVisto = null;
  function finestraAccesso() {
    giornoVisto = giorno();
    if (S.admin || !accesso().pronto || finestraInAttesa) return;
    finestraInAttesa = true;
    let tentativi = 0;
    const prova = () => {
      // aspetta anche a lungo che si chiudano le altre finestre (fino a 10 minuti)
      if (S.admin || !accesso().pronto || ++tentativi > 400 || document.querySelector(".accesso-pop")) { finestraInAttesa = false; return; }
      if (B || Tutorial.attivo || !$("#accesso").hidden || !$("#modale").hidden || !$("#apertura").hidden) { setTimeout(prova, 1500); return; }
      const a = accesso();
      apriModale(`<div class="accesso-pop">
        <span class="codice-tag">Premio di accesso</span>
        <h2>${a.persa ? "Si riparte!" : a.giorno === 7 ? "Settimo giorno!" : `Giorno ${a.giorno} di 7`}</h2>
        <p class="nota">${a.persa ? "Hai saltato un giorno, quindi si ricomincia dal primo. Torna ogni giorno per arrivare al premio più grosso." : a.giorno === 7 ? "Hai giocato una settimana intera di fila: oggi c'è il premio più grosso." : "Torna ogni giorno: più giorni di fila, più grossi i premi."}</p>
        ${htmlCalendario(a)}
        <div class="azioni centro"><button class="btn oro grande" data-fx="coriandoli" data-azione="riscuoti-accesso">Riscuoti: ${esc(nomeAccesso(ACCESSI[a.giorno - 1]))}</button></div>
        <button class="btn piccolo accesso-dopo" data-azione="chiudi">Più tardi (lo trovi nella Strada)</button>
      </div>`);
      finestraInAttesa = false;
    };
    setTimeout(prova, 1800);
  }
  // Sul telefono il gioco spesso non si riapre da zero ma torna da "in sottofondo": se nel frattempo è cambiato giorno,
  // la finestra del premio deve comparire lo stesso (prima usciva solo riaprendo la pagina)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || giornoVisto === null || typeof S === "undefined" || !S) return;
    if (giorno() !== giornoVisto) { finestraAccesso(); if (typeof disegna === "function" && !B) disegna(); }
  });
  setInterval(() => { if (document.visibilityState === "visible" && giornoVisto !== null && giorno() !== giornoVisto) finestraAccesso(); }, 60000);
  function htmlCalendario(a) {
    return `<ol class="accessi-giorni">${ACCESSI.map((p, k) => { const n = k + 1, preso = a.pronto ? n < a.giorno : n <= a.giorno, oggiQui = a.pronto && n === a.giorno;
      return `<li class="${preso ? "preso" : ""} ${oggiQui ? "oggi-qui" : ""} ${n === 7 ? "settimo" : ""}"><small>G${n}</small><span>${esc(nomeAccesso(p))}</span></li>`; }).join("")}</ol>`;
  }
  const nomeAccesso = p => p.serieCaso ? "Bustina di una serie" : testoPremio(p);

  // ---------- grafica (nella Strada) ----------
  function htmlRiga(m, i, sett) {
    const pct = Math.round(m.prog / m.n * 100), finita = m.prog >= m.n;
    return `<li class="missione ${finita ? "finita" : ""} ${m.riscossa ? "riscossa" : ""}">
      <div class="missione-testo"><b>${esc(testo(m, sett))}</b><small>${esc(testoPremio(premio(m, sett)))} · +${sett ? XP_SETT : XP_GIORNO} XP</small></div>
      <div class="missione-barra"><i style="--p:${pct}%"></i><span>${m.n >= 1000 ? `${m.prog.toLocaleString("it-IT")}/${m.n.toLocaleString("it-IT")}` : `${m.prog}/${m.n}`}</span></div>
      ${m.riscossa ? `<span class="missione-fatta">✓</span>` : finita ? `<button class="btn oro piccolo" data-fx="coriandoli" data-missione="${sett ? "s" : "g"}:${i}">Riscuoti</button>` : `<span class="missione-vuota"></span>`}
    </li>`;
  }
  function htmlStrada() {
    if (S.admin) return "";
    const M = aggiorna(), a = accesso();
    const fineGiorno = (() => { const d = new Date(); d.setHours(24, 0, 0, 0); const h = Math.max(0, Math.round((d - new Date()) / 36e5)); return h <= 1 ? "meno di un'ora" : `${h} ore`; })();
    return `
    <section class="oggi">
      <div class="titolo-riga"><h2>Oggi</h2><p class="nota">Le missioni cambiano tra ${fineGiorno}.</p></div>
      <div class="accessi ${a.pronto ? "pronto" : ""}">
        <div class="accessi-testa"><b>Premio di accesso</b><span class="nota">${a.pronto ? (a.persa ? "Hai saltato un giorno: si riparte dal primo." : `Giorno ${a.giorno} di 7`) : "Torna domani per il prossimo."}</span></div>
        ${htmlCalendario(a)}
        ${a.pronto ? `<button class="btn oro" data-fx="coriandoli" data-azione="riscuoti-accesso">Riscuoti il giorno ${a.giorno}</button>` : ""}
      </div>
      <div class="missioni-griglia">
        <div class="missioni-box">
          <h3>Missioni del giorno</h3>
          <ol class="missioni">${M.lista.map((m, i) => htmlRiga(m, i, false)).join("")}</ol>
          <div class="missione-bonus ${M.bonus ? "riscossa" : ""}"><span>Completa tutte e 3: <b>${esc(testoPremio(BONUS))}</b></span>${bonusPronto(M) ? `<button class="btn oro piccolo" data-fx="coriandoli" data-missione="bonus">Riscuoti</button>` : M.bonus ? `<span class="missione-fatta">✓</span>` : ""}</div>
        </div>
        <details class="missioni-box sett" ${M.sett.some(m => m.prog >= m.n && !m.riscossa) ? "open" : ""}>
          <summary><h3>Missioni della settimana</h3><span class="nota">${M.sett.filter(m => m.prog >= m.n).length} di ${M.sett.length} fatte</span></summary>
          <ol class="missioni">${M.sett.map((m, i) => htmlRiga(m, i, true)).join("")}</ol>
        </details>
      </div>
    </section>`;
  }

  return { evento, riscuoti, riscuotiAccesso, finestraAccesso, htmlStrada, pronte, aggiorna, accesso, settimana };
})();
