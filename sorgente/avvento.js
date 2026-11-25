// ============================================================
//  CALENDARIO DELL'AVVENTO (dicembre 2026)
//  Dal 1° al 24 dicembre una casella al giorno, il 25 il regalo di Natale.
//  Prima del via, sulla Strada c'è il conto alla rovescia. Le caselle dei giorni passati si possono
//  recuperare con le monete fino all'Epifania. Chi le apre tutte e 25 riceve un regalo in più.
//  I premi restano sotto i limiti dei controlli del server (niente salti di monete o frammenti sospetti).
// ============================================================
const Avvento = (() => {
  const ANNO = 2026, RECUPERO = 200, GIORNO = 864e5;
  // mezzanotte italiana del giorno g di dicembre (a dicembre l'Italia è sempre a UTC+1); g = 32 è il 1° gennaio
  const mezzanotte = g => Date.UTC(ANNO, 11, g, -1);
  const INIZIO = mezzanotte(1), NATALE = mezzanotte(25);
  const MOSTRA_DA = Date.UTC(ANNO, 10, 20, -1);      // il conto alla rovescia si vede dal 20 novembre
  const FINE = Date.UTC(ANNO + 1, 0, 7, -1);         // dopo l'Epifania il calendario sparisce
  const ora = () => Date.now();

  // ---- i premi, giorno per giorno (le domeniche e le feste valgono di più) ----
  const PREMI = {
    1:  { ico: "🪙", testo: "300 monete", monete: 300 },
    2:  { ico: "🎴", testo: "1 Bustina", bustine: { normale: 1 } },
    3:  { ico: "🥤", testo: "3 Lattine al neon", zaino: { lattina: 3 } },
    4:  { ico: "◈", testo: "60 frammenti", framm: 60 },
    5:  { ico: "⬆", testo: "5 potenziatori per una tua carta", pot: 5 },
    6:  { ico: "💜", testo: "1 Bustina Epica", bustine: { epica: 1 } },
    7:  { ico: "🪙", testo: "400 monete", monete: 400 },
    8:  { ico: "❄", testo: "Cornice di Neve (avatar)", cosm: "cornice-neve", monete: 150 },
    9:  { ico: "🥙", testo: "2 Kebab di mezzanotte e 2 Caschi", zaino: { kebab: 2, casco: 2 } },
    10: { ico: "◈", testo: "100 frammenti", framm: 100 },
    11: { ico: "🎴", testo: "2 Bustine", bustine: { normale: 2 } },
    12: { ico: "⬆", testo: "10 potenziatori per una tua carta", pot: 10 },
    13: { ico: "💜", testo: "1 Bustina Epica e 300 monete", bustine: { epica: 1 }, monete: 300 },
    14: { ico: "🎅", testo: "Nome Natalizio (colore del nome)", cosm: "nome-natale", monete: 150 },
    15: { ico: "🪙", testo: "600 monete", monete: 600 },
    16: { ico: "📻", testo: "1 Radio pirata e 2 Fumogeni", zaino: { radio: 1, fumogeno: 2 } },
    17: { ico: "◈", testo: "150 frammenti", framm: 150 },
    18: { ico: "🎴", testo: "3 Bustine", bustine: { normale: 3 } },
    19: { ico: "⬆", testo: "15 potenziatori per una tua carta", pot: 15 },
    20: { ico: "🧡", testo: "1 Bustina Leggendaria", bustine: { leggendaria: 1 } },
    21: { ico: "🌨", testo: "Sfondo Notte di Natale (vetrina)", cosm: "sfondo-natale", monete: 200 },
    22: { ico: "🪙", testo: "800 monete", monete: 800 },
    23: { ico: "💜", testo: "2 Bustine Epiche e 250 frammenti", bustine: { epica: 2 }, framm: 250 },
    24: { ico: "🎄", testo: "Cornice carta di Natale e 1000 monete", cosm: "cc-natale", monete: 1000 },
    25: { ico: "🎁", testo: "2 Bustine Leggendarie e 1500 monete", bustine: { leggendaria: 2 }, monete: 1500 },
  };
  const COMPLETO = { ico: "🌟", testo: "1 Bustina Ultra", bustine: { ultra: 1 } };   // tutte e 25 aperte
  // le caselle sono mescolate come in un vero calendario (sempre nello stesso ordine per tutti)
  const ORDINE = [7, 18, 3, 24, 12, 1, 20, 9, 15, 5, 22, 14, 25, 10, 2, 17, 6, 21, 11, 23, 4, 16, 8, 19, 13];
  const GIORNI_SETT = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];

  const attivo = () => typeof S !== "undefined" && S && !S.admin && S.profilo && S.profilo.nome;
  const stato = () => { if (!S.avvento || S.avvento.anno !== ANNO) S.avvento = { anno: ANNO, aperte: [] }; return S.avvento; };
  const aperta = g => stato().aperte.includes(g);
  // che giorno del calendario è oggi: 0 = non è ancora iniziato, 1..25 = dicembre, 26 = dopo Natale
  const oggi = () => { const t = ora(); if (t < INIZIO) return 0; return Math.min(26, Math.floor((t - INIZIO) / GIORNO) + 1); };
  const visibile = () => attivo() && ora() >= MOSTRA_DA && ora() < FINE;
  const daRecuperare = () => { const o = Math.min(oggi(), 26); const out = []; for (let g = 1; g <= Math.min(o - 1, 24); g++) if (!aperta(g)) out.push(g); return out; };
  const oggiPronta = () => { const o = oggi(); if (o >= 1 && o <= 24) return !aperta(o); if (o >= 25) return !aperta(25); return false; };
  const prossimaApertura = () => { const o = oggi(); return o >= 25 ? null : mezzanotte(o + 1); };

  // ---- conto alla rovescia: "5g 11:14:03" ----
  function durata(ms) {
    ms = Math.max(0, ms); const s = Math.floor(ms / 1000), g = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    const due = n => String(n).padStart(2, "0");
    return (g ? `${g}g ` : "") + `${due(h)}:${due(m)}:${due(x)}`;
  }
  const htmlConto = quando => `<b class="av-conto" data-conto="${quando}">${durata(quando - ora())}</b>`;
  let scaduto = false;
  setInterval(() => {
    const el = document.querySelectorAll("[data-conto]"); if (!el.length) return;
    let finito = false;
    el.forEach(e => { const r = +e.dataset.conto - ora(); e.textContent = durata(r); if (r <= 0) finito = true; });
    // al momento giusto (mezzanotte) la Strada e il calendario si aggiornano da soli
    if (finito && !scaduto) { scaduto = true; setTimeout(() => { scaduto = false; if ($("#modale-corpo .avvento")) apri(); if (typeof vista !== "undefined" && vista === "strada" && typeof B !== "undefined" && !B) disegna(); }, 1200); }
  }, 1000);

  // ---- dare i premi ----
  function dai(p) {
    const fatto = [];
    if (p.monete) { S.monete += p.monete; }
    for (const [t, n] of Object.entries(p.bustine || {})) S.inventario[t] = (S.inventario[t] || 0) + n;
    if (p.framm) Frammenti.aggiungi(p.framm, false);
    if (p.zaino) { if (!S.zaino) S.zaino = { oggetti: {}, porta: [] }; S.zaino.oggetti = S.zaino.oggetti || {}; for (const [id, n] of Object.entries(p.zaino)) S.zaino.oggetti[id] = (S.zaino.oggetti[id] || 0) + n; }
    if (p.cosm) Cosmetici.sblocca(p.cosm, false);
    if (p.pot) { const q = { pot: p.pot, casuale: true }; daiPremio(q); if (q.carta) fatto.push(`${p.pot} potenziatori a ${PER_ID[q.carta].nome}`); }
    Livello.guadagna(40);   // ogni casella dà anche un po' di punti livello
    return fatto;
  }

  async function apriCasella(g, el) {
    if (!attivo()) return;
    const o = oggi();
    if (aperta(g) || g > Math.min(o, 25) || (g === 25 && o < 25)) return;
    const recupero = g < Math.min(o, 25) && g !== 25;
    if (recupero) {
      if (ora() >= FINE) return;
      if (S.monete < RECUPERO) { mostraAvviso(`Per recuperare la casella del ${g} dicembre servono ${RECUPERO} monete.`); return; }
      S.monete -= RECUPERO;
    }
    const p = PREMI[g], extra = dai(p);
    stato().aperte.push(g);
    let completo = false;
    if (stato().aperte.length >= 25 && !stato().completo) { stato().completo = true; dai(COMPLETO); completo = true; }
    salva(); aggiornaTesta(); if (p.cosm) Archivio.pubblicaClassifica();
    // la casella si apre (anta che gira) e poi si vede il premio
    const casella = el && el.closest(".av-casella");
    if (casella) { casella.classList.add("si-apre"); try { Suoni.strappo(); setTimeout(() => Suoni.cura(), 450); } catch (e) {} await attesa(650); }
    if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 60, forma: "stella", colori: ["#ff4a5a", "#ffffff", "#3adc7a", "#f2c14e"], velocita: 8, dimensione: 7 }); }
    apri();
    mostraAvviso(`🎄 ${g === 25 ? "Buon Natale!" : `${g} dicembre:`} ${p.testo}${extra.length ? ` (${extra.join(", ")})` : ""}${completo ? `. Hai aperto tutte le caselle: regalo extra, ${COMPLETO.testo}!` : "."}`);
    if (typeof vista !== "undefined" && vista === "strada") disegnaQuieto();
  }

  // ---- il calendario (finestra) ----
  function htmlCasella(g) {
    const o = oggi(), p = PREMI[g], fatta = aperta(g);
    const data = new Date(mezzanotte(g) + 3600e3), gs = GIORNI_SETT[data.getUTCDay()];
    const natale = g === 25 ? " natale" : "";
    if (fatta) return `<button class="av-casella aperta${natale}" data-avvento-info="${g}" title="${esc(p.testo)}" aria-label="${g} dicembre: ${esc(p.testo)}"><span class="av-num">${g}</span><span class="av-premio-ico">${p.ico}</span><small>${esc(p.testo)}</small></button>`;
    const oggiQui = (g === o && g <= 24) || (g === 25 && o >= 25);
    if (oggiQui) return `<button class="av-casella oggi${natale}" data-avvento-apri="${g}" aria-label="Apri la casella del ${g} dicembre"><span class="av-anta"><span class="av-num">${g}</span><small>Aprila!</small></span></button>`;
    if (g < o && g <= 24) return ora() < FINE ? `<button class="av-casella persa" data-avvento-apri="${g}" aria-label="Recupera la casella del ${g} dicembre per ${RECUPERO} monete"><span class="av-anta"><span class="av-num">${g}</span><small>Recupera<br>${RECUPERO} <i class="moneta-ico"></i></small></span></button>`
      : `<div class="av-casella chiusa"><span class="av-num">${g}</span><small>persa</small></div>`;
    return `<div class="av-casella chiusa${natale}"><span class="av-anta"><span class="av-num">${g}</span><small>${gs}</small></span></div>`;
  }
  function apri() {
    if (!attivo()) return;
    const o = oggi(), prossima = prossimaApertura(), n = stato().aperte.length, rec = daRecuperare();
    const testa = o === 0 ? `Apre il <b>1° dicembre</b> a mezzanotte: mancano ${htmlConto(INIZIO)}`
      : o <= 24 ? (aperta(o) ? `Casella di oggi aperta ✓ · la prossima tra ${htmlConto(prossima)}` : `Oggi è il <b>${o} dicembre</b>: apri la tua casella!`)
      : o === 25 ? (aperta(25) ? "Buon Natale! 🎄" : "È Natale: apri il regalo grande!") : "Il calendario è finito: buone feste!";
    apriModale(`<div class="avvento">
      <div class="av-testa"><span class="av-albero">🎄</span><div><small>Noiverso · dicembre ${ANNO}</small><h2>Calendario dell'Avvento</h2><p class="av-stato">${testa}</p></div></div>
      <div class="av-griglia">${ORDINE.map(htmlCasella).join("")}</div>
      <div class="av-piede">
        <p class="nota">Una casella al giorno dal 1° al 24 dicembre, il 25 c'è il regalo di Natale. Dentro ci sono monete, bustine, frammenti, potenziatori, oggetti dello zaino e <b>4 cosmetici di Natale</b> che non si trovano da nessun'altra parte.
        Se salti un giorno puoi recuperare la casella con ${RECUPERO} monete, fino al 6 gennaio. Ogni casella dà anche 40 punti livello.</p>
        <div class="av-completo ${stato().completo ? "fatto" : ""}"><span>${COMPLETO.ico}</span><div><b>Apri tutte e 25 le caselle</b><small>${stato().completo ? "Fatto! Hai ricevuto " + COMPLETO.testo + "." : `Regalo extra: ${COMPLETO.testo} · ne hai aperte ${n}/25${rec.length ? ` · ${rec.length} da recuperare` : ""}`}</small></div></div>
      </div>
    </div>`);
  }

  // ---- sulla Strada ----
  function htmlStrada() {
    if (!visibile()) return "";
    const o = oggi(), n = stato().aperte.length, rec = daRecuperare();
    let sotto, bottone, acceso = false;
    if (o === 0) { sotto = `Apre il 1° dicembre: mancano ${htmlConto(INIZIO)}`; bottone = "Sbircia"; }
    else if (oggiPronta()) { sotto = o >= 25 ? "È Natale: il regalo grande ti aspetta!" : `Oggi è il ${o} dicembre: la tua casella è pronta!`; bottone = o >= 25 ? "Apri il regalo" : "Apri la casella"; acceso = true; }
    else if (o <= 24) { sotto = `Casella di oggi aperta ✓ · prossima tra ${htmlConto(prossimaApertura())}${rec.length ? ` · ${rec.length} da recuperare` : ""}`; bottone = "Calendario"; }
    else { sotto = `Buone feste! Hai aperto ${n}/25 caselle${rec.length ? ` · ${rec.length} si recuperano fino al 6 gennaio` : ""}`; bottone = "Calendario"; }
    return `<div class="avvento-strada ${acceso ? "pronto" : ""}"><span class="av-albero">🎄</span><div><small>Calendario dell'Avvento${o ? ` · ${n}/25 aperte` : ""}</small><b>${o === 0 ? "Sta per arrivare dicembre!" : "Calendario dell'Avvento"}</b><span class="nota">${sotto}</span></div>
      <button class="btn piccolo ${acceso ? "primario" : ""}" data-avvento-vedi>${bottone}</button>${acceso ? `<i class="av-punto"></i>` : ""}</div>`;
  }

  document.addEventListener("click", e => {
    const t = e.target.closest && e.target.closest("[data-avvento-vedi],[data-avvento-apri],[data-avvento-info]");
    if (!t) return;
    if (t.dataset.avventoInfo) { const g = +t.dataset.avventoInfo; mostraAvviso(`${g === 25 ? "Natale" : `${g} dicembre`}: ${PREMI[g].testo}.`); return; }
    if (t.dataset.avventoApri) apriCasella(+t.dataset.avventoApri, t); else apri();
  });

  return { ANNO, PREMI, COMPLETO, oggi, oggiPronta, apri, apriCasella, htmlStrada, visibile, _mezzanotte: mezzanotte };
})();
