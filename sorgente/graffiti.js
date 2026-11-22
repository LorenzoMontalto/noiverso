// ============================================================
//  GRAFFITI
//  Prima della battaglia spruzzi un graffito sul campo: vale per tutta la partita.
//  Gli effetti sono fissi (motore.js, per tenere il gioco bilanciato); nome, scritta, colore e simbolo
//  li decide l'admin dal pannello (salvati in config/graffiti), così diventano le battute del gruppo.
//  Si trovano nelle bombolette (negozio, bustine, boss). Ogni copia in più alza il livello, fino al 5.
// ============================================================
const Graffiti = (() => {
  const LIV_MAX = 5, PREZZO = 250, MONETE_EXTRA = 60, PROB_IN_BUSTINA = .08;
  const BASE = {
    fiamma:   { rarita: "comune", nome: "Fuoco",            scritta: "BRUCIA TUTTO", colore: "#ff5a2e", simbolo: "🔥" },
    muro:     { rarita: "comune", nome: "Muro",             scritta: "NON SI PASSA", colore: "#a9b4c4", simbolo: "🧱" },
    cuore:    { rarita: "comune", nome: "Cuore di strada",  scritta: "CI SIAMO",     colore: "#ff4f8b", simbolo: "❤️" },
    fulmine:  { rarita: "rara",   nome: "Scossa",           scritta: "ZAP!",         colore: "#ffe14a", simbolo: "⚡" },
    spina:    { rarita: "rara",   nome: "Spine",            scritta: "NON TOCCARE",  colore: "#3ccf6e", simbolo: "🌵" },
    fortuna:  { rarita: "rara",   nome: "Colpo di fortuna", scritta: "JACKPOT",      colore: "#f2c14e", simbolo: "🍀" },
    blackout: { rarita: "epica",  nome: "Blackout",         scritta: "LUCI SPENTE",  colore: "#8c6bff", simbolo: "🌑" },
    specchio: { rarita: "epica",  nome: "Specchio",         scritta: "RIMBALZA",     colore: "#6ccaff", simbolo: "🪞" },
  };
  const ORDINE = Object.keys(BASE);
  const PESI = { comune: 70, rara: 25, epica: 5 };
  let personali = {};   // modifiche dell'admin: { id: { nome, scritta, colore, simbolo } }

  const info = id => Object.assign({ id }, BASE[id], personali[id] || {});
  const copie = id => (S.graffiti || {})[id] || 0;
  const liv = id => Math.min(LIV_MAX, copie(id));
  const posseduti = () => ORDINE.filter(id => copie(id) > 0);
  const scelto = () => (S.graffito && copie(S.graffito) ? S.graffito : null);

  function descrivi(id, l = 1) {
    const v = valoreGraffito(id, l), n = x => String(Math.round(x * 10) / 10).replace(".", ",");
    return {
      fiamma: `+${n(v)}% ai danni di tutta la tua squadra.`,
      muro: `−${n(v)}% ai danni che subisce la tua squadra.`,
      cuore: `A fine turno la tua carta in campo recupera il ${n(v)}% dei PV.`,
      fulmine: `Parti con ${v} energia in più e ne ricevi 1 in più a inizio turno 4.`,
      spina: `Chi colpisce la tua carta perde il ${n(v)}% del danno che fa.`,
      fortuna: `+${n(v)}% di probabilità di colpo critico.`,
      blackout: `Il nemico parte con ${v} energia in meno e ne riceve 1 in meno a inizio turno 4.`,
      specchio: `I critici del nemico diventano colpi normali e ti danno +${v} energia.`,
    }[id];
  }
  const nomeOpposto = id => info(GRAFFITI_COPPIE[id]).nome;
  // la stessa descrizione, ma vista da chi subisce il graffito del nemico
  function descriviNemico(id, l = 1) {
    const v = valoreGraffito(id, l), n = x => String(Math.round(x * 10) / 10).replace(".", ",");
    return {
      fiamma: `la sua squadra fa il ${n(v)}% di danni in più.`,
      muro: `la sua squadra subisce il ${n(v)}% di danni in meno.`,
      cuore: `a fine turno la sua carta in campo recupera il ${n(v)}% dei PV.`,
      fulmine: `parte con ${v} energia in più e ne riceve 1 in più a inizio turno 4.`,
      spina: `se colpisci la sua carta perdi il ${n(v)}% del danno che fai.`,
      fortuna: `ha il ${n(v)}% di probabilità in più di fare un critico.`,
      blackout: `parti con ${v} energia in meno e ne ricevi 1 in meno a inizio turno 4.`,
      specchio: `i tuoi critici diventano colpi normali e gli danno +${v} energia.`,
    }[id];
  }

  // ---------------- disegno a bomboletta ----------------
  const cache = {};
  function rng(seme) { let h = 2166136261; for (const ch of seme) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
  function chiaro(hex, k) { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(x => Math.round(x + (255 - x) * k)); return `rgb(${c.join(",")})`; }
  function tela(id, W = 512, H = 256) {
    const g = info(id), chiave = `${id}|${W}|${g.nome}|${g.scritta}|${g.colore}|${g.simbolo}`;
    if (cache[chiave]) return cache[chiave];
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d"), r = rng(chiave), col = /^#[0-9a-f]{6}$/i.test(g.colore) ? g.colore : "#ff2e46";
    x.translate(W / 2, H / 2); x.rotate(-.07);
    // nuvola di vernice dietro
    for (let k = 0; k < 260; k++) {
      const a = r() * Math.PI * 2, d = Math.pow(r(), .6) * W * .44;
      x.globalAlpha = .05 + r() * .12; x.fillStyle = r() < .7 ? col : "#ffffff";
      x.beginPath(); x.arc(Math.cos(a) * d, Math.sin(a) * d * .42, 1 + r() * 3.2, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
    // simbolo grande a sinistra
    x.textAlign = "center"; x.textBaseline = "middle";
    x.font = `${Math.round(H * .5)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    x.save(); x.rotate(-.12); x.shadowColor = col; x.shadowBlur = 18; x.fillText(String(g.simbolo || "★").slice(0, 4), -W * .34, -H * .02); x.restore();
    // scritta: su una o due righe, con contorno scuro, bagliore e colature
    const testo = String(g.scritta || g.nome || "").toUpperCase().slice(0, 20), maxW = W * .6, cx = W * .12;
    let righe = [testo], fs = Math.round(H * .3);
    const font = s => `${s}px "Bungee", Impact, sans-serif`;
    x.font = font(fs);
    if (x.measureText(testo).width > maxW && testo.includes(" ")) {
      const p = testo.split(" "), meta = Math.ceil(p.length / 2);
      righe = [p.slice(0, meta).join(" "), p.slice(meta).join(" ")];
    }
    while (fs > 18 && righe.some(t => (x.font = font(fs), x.measureText(t).width > maxW))) fs -= 2;
    x.font = font(fs);
    const alt = fs * 1.02, y0 = -(righe.length - 1) * alt / 2;
    righe.forEach((t, i) => {
      const y = y0 + i * alt;
      x.lineJoin = "round"; x.lineWidth = fs * .22; x.strokeStyle = "#0b0709"; x.strokeText(t, cx, y);
      const gr = x.createLinearGradient(0, y - fs / 2, 0, y + fs / 2); gr.addColorStop(0, chiaro(col, .55)); gr.addColorStop(.55, col); gr.addColorStop(1, col);
      x.shadowColor = col; x.shadowBlur = 16; x.fillStyle = gr; x.fillText(t, cx, y); x.shadowBlur = 0;
      x.lineWidth = Math.max(1.5, fs * .05); x.strokeStyle = "rgba(255,255,255,.55)"; x.strokeText(t, cx - 1, y - 1);
    });
    // colature
    x.strokeStyle = col; x.lineCap = "round";
    const fondo = y0 + (righe.length - 1) * alt + fs * .42, larg = Math.min(maxW, x.measureText(righe[righe.length - 1]).width);
    for (let k = 0; k < 7; k++) {
      const px = cx - larg / 2 + r() * larg, l = 10 + r() * H * .2;
      x.globalAlpha = .85; x.lineWidth = 2.5 + r() * 3.5;
      x.beginPath(); x.moveTo(px, fondo); x.lineTo(px, fondo + l); x.stroke();
      x.beginPath(); x.arc(px, fondo + l, x.lineWidth * .7, 0, Math.PI * 2); x.fillStyle = col; x.fill();
    }
    x.globalAlpha = 1;
    return (cache[chiave] = cv);
  }
  const urlCache = {};
  function url(id) {
    const g = info(id), k = `${id}|${g.nome}|${g.scritta}|${g.colore}|${g.simbolo}`;
    return urlCache[k] || (urlCache[k] = tela(id).toDataURL());
  }

  // ---------------- ottenere graffiti ----------------
  function pesca() {
    const tot = ORDINE.reduce((s, id) => s + PESI[BASE[id].rarita], 0);
    let n = Math.random() * tot;
    for (const id of ORDINE) { n -= PESI[BASE[id].rarita]; if (n < 0) return id; }
    return ORDINE[0];
  }
  function dai(id) {
    const prima = copie(id);
    S.graffiti = Object.assign({}, S.graffiti, { [id]: prima + 1 });
    let extra = 0;
    if (prima >= LIV_MAX) { extra = MONETE_EXTRA; S.monete += extra; }
    if (!S.graffito) S.graffito = id;
    return { id, nuovo: prima === 0, liv: liv(id), extra };
  }
  function apriBombolette(n) {
    const esiti = Array.from({ length: n }, () => dai(pesca()));
    salva(); aggiornaTesta();
    mostraRivelazione(esiti);
    return esiti;
  }
  function mostraRivelazione(esiti) {
    const uno = esiti.length === 1;
    apriModale(`<div class="graffiti-rivela">
      <span class="codice-tag">${uno ? "Bomboletta" : `${esiti.length} bombolette`}</span>
      <div class="graffiti-usciti ${uno ? "uno" : ""}">${esiti.map((e, i) => { const g = info(e.id);
        return `<div class="graffito-uscito r-${g.rarita}" style="--c:${g.colore};--i:${i}">
          <img src="${url(e.id)}" alt="${esc(g.nome)}">
          <b>${esc(g.nome)}</b>
          <small>${e.nuovo ? "Nuovo!" : e.extra ? `Già al massimo: +${e.extra} monete` : `Sale al livello ${e.liv}!`}</small>
        </div>`; }).join("")}</div>
      <div class="azioni centro"><button class="btn primario" data-azione="chiudi">Grande!</button><button class="btn" data-azione="graffiti-collezione">Vedi i tuoi graffiti</button></div>
    </div>`);
    if (!ridotto) setTimeout(() => { const el = $(".graffiti-usciti"); if (el) { const [x, y] = FX.centro(el); FX.esplosione(x, y, { n: 60, forma: "coriandolo", colori: esiti.map(e => info(e.id).colore).concat("#ffffff"), velocita: 8, dimensione: 5 }); } }, 250);
  }
  function compra(n, el) {
    const costo = n === 5 ? PREZZO * 5 - 100 : PREZZO * n;
    if (!S.admin && S.monete < costo) { mostraAvviso("Non hai abbastanza monete."); return; }
    if (!S.admin) S.monete -= costo;
    apriBombolette(n);
    if (vista === "negozio" || vista === "sfida") setTimeout(disegna, 50);
  }
  // ogni bustina aperta ha una piccola probabilità di contenere anche una bomboletta
  function forseInBustina(tipo) {
    if (tipo === "benvenuto" || Math.random() >= PROB_IN_BUSTINA) return null;
    const e = dai(pesca()); salva();
    setTimeout(() => mostraAvviso(`Nella bustina c'era anche una bomboletta: graffito «${info(e.id).nome}»${e.nuovo ? " (nuovo!)" : ` (livello ${e.liv})`}.`), 2600);
    return e;
  }
  // il primo graffito è un regalo
  function regaloIniziale() {
    if (S.admin || S.graffitiRegalo) return;
    S.graffitiRegalo = true;
    if (!posseduti().length) { dai("fiamma"); salva(); setTimeout(() => mostraAvviso(`Novità: i graffiti! Te ne regalo uno, «${info("fiamma").nome}». Lo trovi nella pagina Sfida.`), 2200); }
  }

  // ---------------- in battaglia ----------------
  function mio() { const id = scelto(); return id ? { id, liv: liv(id) } : null; }
  function aCaso(l) { const id = ORDINE[Math.floor(Math.random() * ORDINE.length)]; return { id, liv: Math.max(1, Math.min(LIV_MAX, l)) }; }
  // graffito del nemico per i livelli contro il computer
  function nemico(L) {
    if (L.graffitoNemico !== undefined) return L.graffitoNemico;
    const i = LIVELLI_SFIDA.findIndex(x => x.id === L.id);
    return i >= 1 ? aCaso(i + 1) : null;
  }
  function htmlChip(g, lato) {
    if (!g) return "";
    const x = info(g.id);
    return `<span class="graffito-chip ${lato ? "nemico" : ""}" style="--c:${x.colore}" title="${esc(lato ? "Nemico: " + descriviNemico(g.id, g.liv) : descrivi(g.id, g.liv))}">${esc(x.simbolo)} ${esc(x.nome)} <small>Lv ${g.liv}</small></span>`;
  }
  function annunciaInBattaglia(Bt) {
    const [a, b] = [Bt.lati[0].graffito, Bt.lati[1].graffito];
    if (Bt.graffitiAnnullati) {
      const [x, y] = Bt.graffitiAnnullati;
      aggiungiRegistro({ testo: `I graffiti «${info(x.id).nome}» e «${info(y.id).nome}» si annullano: nessuno dei due ha effetto.`, avviso: true });
    } else {
      if (a) aggiungiRegistro({ testo: `Hai spruzzato «${info(a.id).nome}» (Lv ${a.liv}): ${descrivi(a.id, a.liv)}`, avviso: true });
      if (b) aggiungiRegistro({ testo: `${Bt.lati[1].nome} ha spruzzato «${info(b.id).nome}» (Lv ${b.liv}): ${descriviNemico(b.id, b.liv)}`, avviso: true });
    }
    if (arena && arena.mettiGraffito) {
      const g = Bt.graffitiAnnullati || [a, b];
      g.forEach((x, l) => { if (x) arena.mettiGraffito(l, tela(x.id, 512, 256), !!Bt.graffitiAnnullati); });
    }
  }

  // ---------------- pagina Sfida: il tuo graffito ----------------
  function htmlPannello() {
    if (S.admin && !posseduti().length) S.graffiti = Object.fromEntries(ORDINE.map(id => [id, LIV_MAX]));
    const id = scelto();
    if (!id) return `<div class="graffito-pannello vuoto"><div><b>Graffiti</b><span class="nota">Spruzza un graffito sul campo prima della battaglia: vale per tutta la partita. Si trovano nelle bombolette.</span></div>
      <button class="btn oro" data-fx="monete" data-bomboletta="1">Bomboletta · ${PREZZO}</button></div>`;
    const g = info(id), l = liv(id);
    return `<div class="graffito-pannello" style="--c:${g.colore}">
      <img src="${url(id)}" alt="">
      <div class="graffito-info"><small>Il tuo graffito</small><b>${esc(g.nome)} <span class="graffito-liv">Lv ${l}</span></b><span class="nota">${esc(descrivi(id, l))}</span>
        <span class="nota piccola">Si annulla contro «${esc(nomeOpposto(id))}».</span></div>
      <div class="graffito-azioni"><button class="btn" data-fx="salto" data-azione="graffiti-collezione">Cambia</button><button class="btn oro piccolo" data-fx="monete" data-bomboletta="1">Bomboletta · ${PREZZO}</button></div>
    </div>`;
  }
  function htmlCollezione() {
    return `<div class="graffiti-modale"><h2>I tuoi graffiti</h2>
      <p class="nota">Scegli quello da spruzzare nelle prossime battaglie. Ogni copia in più alza il livello (massimo ${LIV_MAX}). I graffiti della stessa coppia si annullano a vicenda.</p>
      <div class="graffiti-griglia">${ORDINE.map(id => { const g = info(id), c = copie(id), l = liv(id), sel = scelto() === id;
        return c ? `<button type="button" class="graffito-carta r-${g.rarita} ${sel ? "sel" : ""}" style="--c:${g.colore}" data-scegli-graffito="${id}">
            <img src="${url(id)}" alt=""><b>${esc(g.nome)}</b><span class="graffito-liv">Lv ${l}${l < LIV_MAX ? ` · ${c}/${LIV_MAX}` : " · max"}</span>
            <small>${esc(descrivi(id, l))}</small>${sel ? `<span class="graffito-inuso">✓ In uso</span>` : ""}</button>`
          : `<div class="graffito-carta bloccato r-${g.rarita}"><div class="graffito-ombra">?</div><b>???</b><span class="graffito-liv">${RARITA[g.rarita] ? RARITA[g.rarita].nome : g.rarita}</span><small>Ancora da trovare</small></div>`; }).join("")}</div>
      <div class="azioni centro"><button class="btn" data-scegli-graffito="">Nessun graffito</button><button class="btn oro" data-fx="monete" data-bomboletta="1">Bomboletta · ${PREZZO}</button><button class="btn oro" data-fx="monete" data-bomboletta="5">5 bombolette · ${PREZZO * 5 - 100}</button></div>
    </div>`;
  }
  function apriCollezione() { apriModale(htmlCollezione()); }
  function scegli(id) { S.graffito = id || null; salva(); if (!$("#modale").hidden) $("#modale-corpo").innerHTML = htmlCollezione(); if (vista === "sfida") disegna(); }

  // ---------------- negozio ----------------
  function htmlNegozio() {
    const tutti = ORDINE.slice(0, 3);
    return `<div class="titolo-riga piccola"><h3>Graffiti</h3><p class="nota">Una bomboletta = un graffito a caso (comune 70%, raro 25%, epico 5%). Le copie in più alzano il livello.</p></div>
      <div class="vetrina"><div class="prodotto" style="--c:#ff5a2e">
        <div class="bomboletta-ico">${tutti.map(id => `<img src="${url(id)}" alt="">`).join("")}</div>
        <b>Bomboletta</b><span class="nota">Un graffito da spruzzare in battaglia.</span>
        <div class="prodotto-prezzi"><button class="btn primario" data-fx="monete" data-bomboletta="1" ${S.admin || S.monete >= PREZZO ? "" : "disabled"}>${PREZZO} <i class="moneta-ico"></i></button>
          <button class="btn" data-fx="monete" data-bomboletta="5" ${S.admin || S.monete >= PREZZO * 5 - 100 ? "" : "disabled"}>×5 · ${PREZZO * 5 - 100}</button></div>
      </div></div>`;
  }

  // ---------------- admin: nomi, scritte, colori e simboli ----------------
  async function carica() {
    if (Archivio.modo !== "cloud" || !Archivio.db) return;
    try { const snap = await Archivio.db.doc("config/graffiti").get(); personali = snap && snap.exists ? copiaLibera(snap.data()) || {} : {}; } catch (e) { personali = {}; }
  }
  function htmlAdmin() {
    return `<h3>Graffiti</h3>
      <p class="nota">Qui decidi nome, scritta, colore e simbolo di ogni graffito: mettici le vostre battute! L'effetto in battaglia resta quello scritto sotto, così il gioco rimane bilanciato. I cambiamenti li vedono tutti.</p>
      <form id="form-graffiti" class="form-graffiti">${ORDINE.map(id => { const g = info(id);
        return `<fieldset class="graffito-admin" data-id="${id}">
          <img src="${url(id)}" alt="" class="graffito-anteprima">
          <div class="campi-graffito">
            <label>Nome <input name="${id}.nome" maxlength="24" value="${esc(g.nome)}"></label>
            <label>Scritta sul muro <input name="${id}.scritta" maxlength="20" value="${esc(g.scritta)}"></label>
            <div class="campi-2"><label>Colore <input type="color" name="${id}.colore" value="${esc(g.colore)}"></label><label>Simbolo <input name="${id}.simbolo" maxlength="4" value="${esc(g.simbolo)}"></label></div>
            <small class="nota">${RARITA[g.rarita] ? RARITA[g.rarita].nome : g.rarita} · ${esc(descrivi(id, 1))}</small>
          </div></fieldset>`; }).join("")}
        <div class="azioni"><button class="btn primario" type="submit">Salva i graffiti</button><button class="btn" type="button" data-admin="graffiti-reset">Torna ai nomi di partenza</button></div>
      </form>`;
  }
  function anteprimaAdmin(input) {
    const fs = input.closest(".graffito-admin"); if (!fs) return;
    const id = fs.dataset.id, f = new FormData($("#form-graffiti")), vecchi = personali[id];
    personali[id] = { nome: f.get(`${id}.nome`), scritta: f.get(`${id}.scritta`), colore: f.get(`${id}.colore`), simbolo: f.get(`${id}.simbolo`) };
    fs.querySelector(".graffito-anteprima").src = tela(id).toDataURL();
    personali[id] = vecchi;
    if (vecchi === undefined) delete personali[id];
  }
  async function salvaAdmin(form, reset) {
    const f = new FormData(form), nuovi = {};
    if (!reset) for (const id of ORDINE) {
      const v = { nome: String(f.get(`${id}.nome`) || "").trim().slice(0, 24), scritta: String(f.get(`${id}.scritta`) || "").trim().slice(0, 20), colore: String(f.get(`${id}.colore`) || ""), simbolo: String(f.get(`${id}.simbolo`) || "").trim().slice(0, 4) };
      const d = {}; for (const k of Object.keys(v)) if (v[k] && v[k] !== BASE[id][k]) d[k] = v[k];
      if (Object.keys(d).length) nuovi[id] = d;
    }
    try { await Archivio.db.doc("config/graffiti").set(nuovi); personali = nuovi; mostraAvviso(reset ? "Graffiti riportati ai nomi di partenza." : "Graffiti salvati: li vedono tutti."); }
    catch (e) { mostraAvviso("Non sono riuscito a salvare i graffiti."); }
    const box = $("#admin-graffiti"); if (box) box.innerHTML = htmlAdmin();
  }

  return { pesca, info, liv, copie, posseduti, scelto, descrivi, url, tela, mio, nemico, aCaso, htmlChip, annunciaInBattaglia, htmlPannello, apriCollezione, scegli, compra, apriBombolette, forseInBustina, regaloIniziale, htmlNegozio, carica, htmlAdmin, anteprimaAdmin, salvaAdmin, dai, ORDINE };
})();
