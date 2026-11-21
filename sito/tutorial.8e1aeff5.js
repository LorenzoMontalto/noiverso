// ============================================================
//  TUTORIAL
//  Parte da solo la prima volta che un giocatore entra; si può rifare dal profilo o da "Come si gioca".
//  Ogni passo può illuminare un pezzo dello schermo. Alcuni passi chiedono di fare una cosa vera
//  (aprire la bustina di benvenuto, formare la squadra, giocare la prima battaglia): il tutorial
//  aspetta che sia fatta e va avanti da solo. Se è già fatta (per esempio quando lo rifai) il passo
//  diventa solo una spiegazione.
// ============================================================
const Tutorial = (() => {
  const PREMIO = 150;
  let passi = [], i = 0, attivo = false, timer = null, radice = null, entrato = 0;

  const vis = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? r : null; };
  const trova = sel => { if (!sel) return null; for (const el of document.querySelectorAll(sel)) if (vis(el)) return el; return null; };
  const squadraPiena = () => squadraAttiva().carte.length === CARTE_SQUADRA;
  const fuoriBattaglia = () => !B;

  function preparaPassi() {
    const nome = esc(S.profilo.nome || "giocatore");
    return [
      { titolo: `Ciao ${nome}!`, testo: `Benvenuto in <b>Noiverso</b>, il gioco di carte del gruppo. In un paio di minuti ti faccio vedere tutto: bustine, album, squadra e la tua prima battaglia.<br><span class="tut-nota">Puoi saltare quando vuoi e rifarlo dal tuo profilo.</span>` },
      { vista: "strada", bersaglio: ".testa .monete", titolo: "Le monete", testo: `Servono per comprare bustine (${PREZZO_BUSTINA} l'una) e per potenziare le carte. Le guadagni vincendo battaglie, con la storia e con il pass.` },
      { vista: "strada", bersaglio: ".nav", titolo: "Le sezioni", testo: "Da questa barra ti sposti tra le parti del gioco. Il numerino su una sezione vuol dire che lì c'è qualcosa da fare." },
      { vista: "bustine", bersaglio: '[data-apri="benvenuto"]', titolo: "Le bustine",
        aspetta: () => !S.inventario.benvenuto && $("#apertura").hidden,
        compito: "Hai una <b>bustina di benvenuto</b>: 5 carte tutte diverse. Tocca <b>Apri</b>!",
        testo: `Qui apri le bustine. Ne ricevi una gratis ogni giorno; le altre costano ${PREZZO_BUSTINA} monete o arrivano dal pass. Le carte sono <span class="r-comune">Comuni</span>, <span class="r-rara">Rare</span>, <span class="r-epica">Epiche</span> o <span class="r-leggendaria">Leggendarie</span>.`,
        bersaglioInfo: ".scaffale" },
      { vista: "album", bersaglio: ".serie-copertine", titolo: "L'album", testo: "Le carte sono divise in serie. Tocca una serie per vederne le carte: quelle scure non le hai ancora trovate." },
      { vista: "album", bersaglio: "#vista .griglia", titolo: "Potenziare le carte", testo: "Tocca una carta per vedere mosse e statistiche. Le carte salgono di livello solo se le potenzi tu: ogni <b>doppione</b> ti dà potenziatori per quella carta, e con potenziatori + monete la porti al livello dopo, fino al <b>30 e lode</b>. Il <b class=\"tut-su\">▲</b> verde ti dice quando puoi." },
      { vista: "squadra", bersaglio: "#vista .griglia", bolla: "alto", titolo: "La squadra",
        aspetta: squadraPiena,
        compito: `Tocca ${CARTE_SQUADRA} carte qui sotto per metterle in squadra. <span class="tut-conta"></span>`,
        testo: `La squadra è di ${CARTE_SQUADRA} carte: la prima entra in campo per prima e con le frecce cambi l'ordine. Puoi preparare fino a ${NUM_SQUADRE} squadre diverse.`,
        bersaglioInfo: ".slot5", bollaInfo: null },
      { vista: "squadra", bersaglio: ".riepilogo", titolo: "Gli stili", testo: `Ogni carta ha uno stile: <span class="s-FOR stile">FOR</span> batte <span class="s-VEL stile">VEL</span>, che batte <span class="s-MEN stile">MEN</span>, che batte <span class="s-FOR stile">FOR</span>. Chi è in vantaggio fa il 30% di danni in più, chi è in svantaggio il 20% in meno. Meglio una squadra con stili misti.` },
      { vista: "sfida", bersaglio: ".livelli .livello", titolo: "Le sfide", saltaSe: () => !squadraPiena() || !!B,
        aspetta: () => !!B,
        compito: "Facciamo la tua prima battaglia: tocca <b>Recluta</b>, l'avversario più facile.",
        testo: "Qui sfidi il computer. Più è difficile l'avversario, più monete, punti classifica e XP del pass vinci." },
      // ---- dentro la battaglia ----
      { battaglia: true, bersaglio: "#neon-turno", titolo: "A chi tocca", testo: "Qui in alto vedi sempre di chi è il turno. La tua squadra è in basso a sinistra, quella avversaria in alto a destra." },
      { battaglia: true, bersaglio: ".mana-riga", bolla: "alto", titolo: "L'energia", testo: `L'energia è di tutta la squadra: si parte da ${ENERGIA_INIZIALE} e ogni turno ne arrivano 2. Le mosse più forti costano di più: i rombi sopra ogni mossa dicono quanto.` },
      { battaglia: true, bersaglio: ".mosse", bolla: "alto", titolo: "Le mosse", testo: "Ogni turno scegli una mossa. <b>Carica</b> ti dà +2 energia e ti fa subire meno danni: utile per preparare la mossa finale. Il riquadro <b>Consiglio</b> ti suggerisce la scelta migliore." },
      { battaglia: true, bersaglio: ".panchina", bolla: "alto", titolo: "La panchina", testo: "Qui ci sono le altre carte della squadra. Puoi cambiare quella in campo (usa il turno): conviene quando sei in svantaggio di stile. Quando una carta va KO scegli tu chi entra." },
      { battaglia: true, nascosto: true, aspetta: fuoriBattaglia, titolo: "", testo: "" },
      // ---- il resto ----
      { vista: "storia", bersaglio: '.nav [data-vista="storia"]', titolo: "La storia", testo: "Capitoli su una mappa da esplorare, con dialoghi, tappe e un boss alla fine. Ogni tappa vale fino a 3 stelle: con le stelle apri gli scrigni del capitolo." },
      { vista: "pass", bersaglio: '.nav [data-vista="pass"]', titolo: "Il pass", testo: `Ogni battaglia e ogni bustina danno XP. Il pass ha ${PASS.livelli} livelli con un premio ciascuno, e ogni 10 scegli tu tra due premi. Finito il pass continui a trovare scrigni a sorpresa.` },
      { vista: "classifica", bersaglio: '.nav [data-vista="classifica"]', titolo: "La classifica", testo: "La classifica del gruppo: i punti arrivano vincendo le sfide. Vediamo chi è il più forte." },
      { vista: "strada", bersaglio: "#profilo-btn", titolo: "Il tuo profilo", testo: "Qui cambi nome e avatar e trovi le impostazioni (se il telefono scalda o va a scatti prova la grafica leggera). Da qui puoi anche <b>rifare questo tutorial</b>." },
      { titolo: "Sei pronto!", fine: true, testo: () => (S.tutorial && S.tutorial.premiato) || S.admin ? "Ora sai tutto. Buon divertimento!" : `Ora sai tutto. Per iniziare ti regalo <b>${PREMIO} monete</b>. Buon divertimento!` },
    ];
  }

  function avvia() {
    if (attivo) chiudi();
    if (B || !$("#accesso").hidden) return;
    passi = preparaPassi(); i = -1; attivo = true;
    radice = document.createElement("div");
    radice.id = "tutorial";
    radice.innerHTML = `<div class="tut-velo"></div><div class="tut-buco"></div><div class="tut-bolla" role="dialog" aria-live="polite" aria-label="Tutorial"></div>`;
    document.body.appendChild(radice);
    radice.addEventListener("click", clic);
    vaiA(0, 1);
    timer = setInterval(controlla, 250);
  }

  function chiudi() {
    attivo = false; clearInterval(timer); timer = null;
    if (radice) radice.remove(); radice = null;
  }

  function finisci(saltato) {
    const t = Object.assign({}, S.tutorial || {});
    t.fatto = true; delete t.nuovoPerTe;
    if (!saltato && !t.premiato && !S.admin) {
      t.premiato = true; S.monete += PREMIO;
      setTimeout(() => mostraAvviso(`+${PREMIO} monete: benvenuto nel Noiverso!`), 300);
    }
    S.tutorial = t;
    salva(); aggiornaTesta();
    chiudi();
    if (!B && vista !== "strada" && !saltato) vai("strada");
  }

  // dir: +1 avanti, -1 indietro (salta i passi che non servono in quella direzione)
  function vaiA(n, dir) {
    while (n >= 0 && n < passi.length) {
      const p = passi[n];
      const salta = (p.battaglia && !B) || (!p.battaglia && B) || (p.saltaSe && p.saltaSe()) || (dir < 0 && p.nascosto);
      if (!salta) break;
      n += dir;
    }
    if (n < 0) n = 0;
    if (n >= passi.length) return finisci(false);
    i = n;
    const p = passi[i];
    // se la cosa da fare è già fatta, il passo diventa solo una spiegazione
    p.daFare = !!(p.aspetta && !p.aspetta());
    entrato = Date.now();
    if (p.vista && !B && vista !== p.vista) vai(p.vista);
    disegnaBolla();
    setTimeout(() => {
      const el = trova(bersaglio(p));
      if (el && !B) { const r = el.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 40) el.scrollIntoView({ block: "center", behavior: ridotto ? "auto" : "smooth" }); }
    }, 120);
  }
  const bersaglio = p => (p.daFare || !p.bersaglioInfo) ? p.bersaglio : p.bersaglioInfo;
  const posBolla = p => p.daFare || p.bollaInfo === undefined ? p.bolla : p.bollaInfo;

  function disegnaBolla() {
    if (!radice) return;
    const p = passi[i], bolla = radice.querySelector(".tut-bolla");
    const contati = passi.filter(x => !x.nascosto && !x.battaglia && !x.fine);
    const num = contati.indexOf(p) + 1, tot = contati.length;
    const testo = typeof p.testo === "function" ? p.testo() : p.testo;
    radice.classList.toggle("da-fare", p.daFare);
    bolla.innerHTML = `
      <div class="tut-testa"><b>${p.titolo}</b><small>${p.fine ? "" : p.battaglia ? "In battaglia" : `${num}/${tot}`}</small></div>
      <p>${p.daFare ? p.compito || "" : testo}</p>
      ${p.daFare ? `<p class="tut-compito">Fallo tu: ti aspetto qui.</p>` : ""}
      <div class="tut-azioni">
        ${p.fine ? `<button class="btn primario" data-tut="avanti">Inizia a giocare</button>`
          : p.daFare ? `<button class="btn piccolo" data-tut="salta-passo">Salta questo passo</button><button class="btn piccolo tut-esci" data-tut="esci">Salta tutorial</button>`
          : `${i > 0 ? `<button class="btn piccolo" data-tut="indietro">Indietro</button>` : ""}<button class="btn piccolo tut-esci" data-tut="esci">Salta tutorial</button><button class="btn primario" data-tut="avanti">${i === 0 ? "Iniziamo" : "Avanti"}</button>`}
      </div>`;
    FX.riavvia(bolla, "tut-entra");
    posiziona();
  }

  function clic(e) {
    const b = e.target.closest("[data-tut]");
    if (!b) { e.stopPropagation(); return; }
    e.stopPropagation();
    const cosa = b.dataset.tut;
    if (cosa === "avanti") vaiA(i + 1, 1);
    else if (cosa === "indietro") vaiA(i - 1, -1);
    else if (cosa === "salta-passo") vaiA(i + 1, 1);
    else if (cosa === "esci") finisci(true);
  }

  function controlla() {
    if (!attivo || !radice) return;
    const p = passi[i];
    if (!$("#accesso").hidden) { chiudi(); return; }                      // è tornato alla schermata di accesso
    if (p.battaglia && !B) { vaiA(i + 1, 1); return; }                     // ha abbandonato la battaglia
    if (p.daFare && p.aspetta() && Date.now() - entrato > 300) { vaiA(i + 1, 1); return; }
    if (p.daFare && (p.compito || "").includes("tut-conta")) { const c = radice.querySelector(".tut-conta"); if (c) c.textContent = `(${squadraAttiva().carte.length}/${CARTE_SQUADRA})`; }
    // mentre si apre una bustina o c'è una finestra aperta il tutorial si fa da parte
    const coperto = !$("#apertura").hidden || !$("#modale").hidden || p.nascosto;
    radice.hidden = coperto;
    if (!coperto) posiziona();
  }

  function posiziona() {
    if (!radice || radice.hidden) return;
    const p = passi[i], buco = radice.querySelector(".tut-buco"), bolla = radice.querySelector(".tut-bolla");
    const el = trova(bersaglio(p)), r = el && el.getBoundingClientRect();
    const W = innerWidth, H = innerHeight, m = 10;
    radice.classList.toggle("senza-buco", !r);
    if (r) {
      const g = 6, top = Math.max(4, r.top - g), left = Math.max(4, r.left - g);
      Object.assign(buco.style, { top: top + "px", left: left + "px", width: Math.min(W - 8, r.right + g) - left + "px", height: Math.min(H - 8, r.bottom + g) - top + "px" });
    }
    const bw = bolla.offsetWidth, bh = bolla.offsetHeight, dove = posBolla(p);
    let top, left;
    if (!r) { top = (H - bh) / 2; left = (W - bw) / 2; }
    else {
      left = Math.min(Math.max(m, r.left + r.width / 2 - bw / 2), W - bw - m);
      if (dove === "alto") top = m + 4;
      else if (dove === "basso") top = H - bh - m;
      else if (H - r.bottom >= bh + 26) top = r.bottom + 16;
      else if (r.top >= bh + 26) top = r.top - bh - 16;
      else top = H - bh - m;
      if (dove === "alto" || dove === "basso") left = (W - bw) / 2;
    }
    bolla.style.top = Math.max(m, top) + "px"; bolla.style.left = left + "px";
  }

  addEventListener("resize", () => posiziona());

  // primo ingresso: parte da solo. Chi giocava già prima del tutorial riceve solo un avviso, una volta.
  function allIngresso() {
    if (S.admin || !S.tutorial) return;
    if (!S.tutorial.fatto) setTimeout(avvia, 650);
    else if (S.tutorial.nuovoPerTe) {
      S.tutorial = Object.assign({}, S.tutorial); delete S.tutorial.nuovoPerTe; salva();
      setTimeout(() => mostraAvviso("Novità: c'è un tutorial! Lo trovi nel tuo profilo, in alto a destra."), 1600);
    }
  }

  return { avvia, chiudi, allIngresso, get attivo() { return attivo; } };
})();
