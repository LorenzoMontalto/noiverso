// ============================================================
//  REAZIONI IN BATTAGLIA
//  Un bottone nell'arena apre le reazioni (emoji, frasi o immagini). Dopo averne mandata una
//  bisogna aspettare 3 secondi per la prossima. Compaiono sopra la carta in campo di chi le manda.
//  Dal vivo arrivano all'amico e agli spettatori; gli spettatori le mandano dalla "tribuna".
//  Contro il computer ogni tanto risponde lui. L'elenco si cambia dal pannello Admin (config 'reazioni').
// ============================================================
const Reazioni = (() => {
  const ATTESA = 3000, MAX = 16;
  const BASE = ["😂", "😎", "😱", "😡", "👏", "🔥", "💀", "🤡", "GG", "Fortuna!", "Ops…", "Tutto calcolato"].map((testo, i) => ({ id: `b${i}`, testo }));
  let lista = BASE.map(x => Object.assign({}, x)), caricate = false;
  const firmate = {};   // percorso immagine → indirizzo firmato
  let ultima = 0, muto = false, timerGiro = null;
  const ricevute = {};   // chi → quando (per non farsi riempire lo schermo)
  const sb = () => window.NoiversoAccesso && window.NoiversoAccesso.sb;
  const perId = id => lista.find(x => x.id === id);
  const eFrase = x => !x.img && [...(x.testo || "")].length > 2;

  // ---------- elenco pubblicato ----------
  async function firma(percorsi) {
    const da = [...new Set(percorsi.filter(p => p && !firmate[p]))];
    if (!da.length || !sb()) return;
    try { const { data } = await sb().storage.from("carte").createSignedUrls(da, 7 * 24 * 3600); for (const x of data || []) if (x.signedUrl) firmate[x.path] = x.signedUrl; } catch (e) {}
  }
  function pulisci(l) {
    const out = [];
    for (const x of Array.isArray(l) ? l : []) {
      if (!x || typeof x.id !== "string") continue;
      const testo = typeof x.testo === "string" ? x.testo.trim().slice(0, 24) : "", img = typeof x.img === "string" && /^reazioni\/[\w.-]+$/.test(x.img) ? x.img : "";
      if (testo || img) out.push({ id: x.id.slice(0, 20), testo, img });
      if (out.length >= MAX) break;
    }
    return out.length ? out : BASE.map(x => Object.assign({}, x));
  }
  async function carica() {
    if (Archivio.modo !== "cloud" || !Archivio.db) { caricate = true; return; }
    try { const snap = await Archivio.db.doc("config/reazioni").get(); lista = pulisci(snap && snap.exists ? (snap.data() || {}).lista : null); caricate = true; } catch (e) { return; }
    await firma(lista.map(x => x.img));
    if (vista === "admin" && !B) { const box = $("#admin-reazioni"); if (box) box.innerHTML = htmlAdmin(); }
  }
  function htmlContenuto(x) {
    if (x.img) return firmate[x.img] ? `<img src="${esc(firmate[x.img])}" alt="${esc(x.testo || "reazione")}">` : `<span>${esc(x.testo || "🖼️")}</span>`;
    return esc(x.testo);
  }

  // ---------- in battaglia ----------
  const spettatore = () => !!(livelloAttuale && livelloAttuale.spettatore);
  function htmlArena() {
    const dalVivo = livelloAttuale && (livelloAttuale.vivo || livelloAttuale.spettatore);
    return `<div class="reazioni" id="reazioni">
      <button type="button" class="reazioni-apri" data-reazioni="apri" aria-label="Reazioni" aria-expanded="false"><span>😀</span><i class="reazioni-giro" hidden></i></button>
      <div class="reazioni-vassoio" id="reazioni-vassoio" hidden>
        <div class="reazioni-griglia">${lista.map(x => `<button type="button" class="reazione ${eFrase(x) ? "frase" : ""} ${x.img ? "immagine" : ""}" data-reazione="${esc(x.id)}" title="${esc(x.testo || "")}">${htmlContenuto(x)}</button>`).join("")}</div>
        ${dalVivo ? `<button type="button" class="reazioni-muto" data-reazioni="muto">${muto ? "🔈 Riattiva le reazioni degli altri" : "🔇 Silenzia le reazioni degli altri"}</button>` : ""}
      </div>
    </div>`;
  }
  function monta() {
    const ar = $("#arena"); if (!ar || $("#reazioni")) return;
    ar.insertAdjacentHTML("beforeend", htmlArena());
    if (!caricate) carica();
    firma(lista.map(x => x.img));
    aggiornaGiro();
  }
  const vassoio = () => $("#reazioni-vassoio");
  function apriChiudi(forza) {
    const v = vassoio(); if (!v) return;
    const apri = forza !== undefined ? forza : v.hidden;
    if (apri) { const vecchio = $("#reazioni"); if (vecchio) { vecchio.outerHTML = htmlArena(); } }   // elenco sempre aggiornato
    const v2 = vassoio(); if (!v2) return;
    v2.hidden = !apri;
    const b = $(".reazioni-apri"); if (b) b.setAttribute("aria-expanded", String(apri));
    aggiornaGiro();
  }
  // il bottone mostra quanto manca prima di poter mandare la prossima
  function aggiornaGiro() {
    clearTimeout(timerGiro);
    const resto = ultima + ATTESA - Date.now(), b = $(".reazioni-apri"), g = $(".reazioni-giro");
    if (!b || !g) return;
    const attesa = resto > 0;
    b.classList.toggle("in-attesa", attesa); g.hidden = !attesa;
    $$(".reazione").forEach(x => { x.disabled = attesa; });
    if (attesa) { g.style.setProperty("--p", `${Math.round((1 - resto / ATTESA) * 100)}%`); timerGiro = setTimeout(aggiornaGiro, 100); }
  }
  function manda(id) {
    const x = perId(id); if (!x || !B) return;
    if (Date.now() - ultima < ATTESA) return;
    ultima = Date.now();
    apriChiudi(false);
    if (spettatore()) { mostraTribuna(x, "Tu"); Online.mandaReazione(id); }
    else {
      mostra(0, x);
      if (livelloAttuale && livelloAttuale.vivo) Online.mandaReazione(id);
      else if (Math.random() < .35) setTimeout(() => { if (B && !spettatore()) mostra(1, lista[Math.floor(Math.random() * lista.length)]); }, 800 + Math.random() * 900);
    }
    aggiornaGiro();
  }
  // da un giocatore (dal vivo): accetto solo reazioni dell'elenco e non più di una ogni 2,5 secondi per persona
  function troppoPresto(chi) { const t = Date.now(); if (t - (ricevute[chi] || 0) < 2500) return true; ricevute[chi] = t; return false; }
  function ricevi(id, lato = 1) {
    const x = perId(id);
    if (!x || muto || !B || troppoPresto("lato" + lato)) return;
    mostra(lato, x);
  }
  function riceviSpettatore(id, nome, da) {
    const x = perId(id);
    if (!x || muto || !B || troppoPresto("sp" + da)) return;
    mostraTribuna(x, String(nome || "Spettatore").slice(0, 16));
  }
  // fumetto grande sopra la carta in campo
  function mostra(lato, x) {
    const ar = $("#arena"); if (!ar) return;
    const vecchia = document.querySelector(`.fumetto-reazione.lato-${lato}`); if (vecchia) vecchia.remove();
    const el = document.createElement("div");
    el.className = `fumetto-reazione lato-${lato} ${eFrase(x) ? "frase" : ""} ${x.img ? "immagine" : ""}`;
    el.innerHTML = htmlContenuto(x);
    const p = arena && arena.puntoSchermo ? arena.puntoSchermo(lato) : null;
    if (p) { el.classList.add("sulla-carta"); el.style.left = `${Math.max(70, Math.min(innerWidth - 70, p.x))}px`; el.style.top = `${Math.max(150, Math.min(innerHeight - 40, p.y))}px`; }
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("via"), 2400);
    setTimeout(() => el.remove(), 2900);
  }
  // reazioni degli spettatori: piccole, in alto al centro, con il nome
  function mostraTribuna(x, nome) {
    let t = $("#tribuna");
    if (!t) { const ar = $("#arena"); if (!ar) return; ar.insertAdjacentHTML("beforeend", `<div class="tribuna" id="tribuna" aria-live="polite"></div>`); t = $("#tribuna"); }
    const el = document.createElement("div");
    el.className = "tribuna-voce";
    el.innerHTML = `<small>👀 ${esc(nome)}</small><span class="${x.img ? "immagine" : ""}">${htmlContenuto(x)}</span>`;
    t.appendChild(el);
    while (t.children.length > 4) t.firstChild.remove();
    setTimeout(() => el.classList.add("via"), 2600);
    setTimeout(() => el.remove(), 3100);
  }
  function clic(cosa) {
    if (cosa === "apri") apriChiudi();
    if (cosa === "muto") { muto = !muto; const b = $(".reazioni-muto"); if (b) b.textContent = muto ? "🔈 Riattiva le reazioni degli altri" : "🔇 Silenzia le reazioni degli altri"; mostraAvviso(muto ? "Reazioni degli altri silenziate." : "Reazioni degli altri riattivate."); }
  }
  document.addEventListener("pointerdown", e => { const v = vassoio(); if (v && !v.hidden && !e.target.closest("#reazioni")) apriChiudi(false); });

  // ---------- pannello Admin ----------
  let bozza = null;   // elenco in modifica, finché non salvi
  function htmlAdmin() {
    if (!caricate) { setTimeout(carica, 0); return `<h3>Reazioni</h3><p class="nota">Carico le reazioni…</p>`; }
    if (!bozza) bozza = lista.map(x => Object.assign({}, x));
    return `<h3>Reazioni</h3>
      <p class="nota">Le reazioni che si mandano in battaglia (al massimo ${MAX}). Ognuna può essere un'emoji, una frase corta o un'immagine caricata da te: per le immagini il testo serve da descrizione. Quando salvi valgono per tutti.</p>
      <div class="reaz-admin">${bozza.map((x, i) => `<div class="reaz-admin-riga">
        <span class="reaz-anteprima ${x.img ? "immagine" : ""}">${htmlContenuto(x)}</span>
        <input data-reaz-testo="${i}" maxlength="24" value="${esc(x.testo)}" placeholder="${x.img ? "Descrizione" : "Emoji o frase"}" aria-label="Testo della reazione ${i + 1}">
        <label class="btn piccolo">${x.img ? "Cambia immagine" : "Immagine…"}<input type="file" accept="image/*" data-reaz-img="${i}" hidden></label>
        ${x.img ? `<button type="button" class="btn piccolo" data-admin="reaz-togli-img:${i}">Togli immagine</button>` : ""}
        <span class="reaz-frecce"><button type="button" class="btn piccolo" data-admin="reaz-su:${i}" ${i ? "" : "disabled"} aria-label="Sposta su">↑</button><button type="button" class="btn piccolo" data-admin="reaz-giu:${i}" ${i < bozza.length - 1 ? "" : "disabled"} aria-label="Sposta giù">↓</button></span>
        <button type="button" class="btn piccolo" data-admin="reaz-togli:${i}" aria-label="Elimina">✕</button>
      </div>`).join("")}</div>
      <div class="azioni"><button type="button" class="btn" data-admin="reaz-nuova" ${bozza.length >= MAX ? "disabled" : ""}>+ Nuova reazione</button>
        <button type="button" class="btn primario" data-admin="reaz-salva">Salva per tutti</button>
        <button type="button" class="btn" data-admin="reaz-base">Reazioni di partenza</button></div>
      <p class="nota" id="reaz-esito"></p>`;
  }
  const ridisegnaAdmin = () => { const box = $("#admin-reazioni"); if (box) box.innerHTML = htmlAdmin(); };
  function testo(i, v) { if (bozza && bozza[i]) bozza[i].testo = v; }
  async function immagine(i, file) {
    if (!bozza || !bozza[i] || !file) return;
    const esito = $("#reaz-esito"); if (esito) esito.textContent = "Carico l'immagine…";
    try {
      const bmp = await createImageBitmap(file);
      const r = Math.min(1, 256 / Math.max(bmp.width, bmp.height)), cv = document.createElement("canvas");
      cv.width = Math.round(bmp.width * r); cv.height = Math.round(bmp.height * r);
      cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob = await new Promise(ok => cv.toBlob(ok, "image/webp", .9));
      const percorso = `reazioni/${bozza[i].id}-${Date.now()}.webp`;
      const { error } = await sb().storage.from("carte").upload(percorso, blob, { contentType: "image/webp", cacheControl: "604800" });
      if (error) throw error;
      await firma([percorso]);
      bozza[i].img = percorso;
      ridisegnaAdmin();
      const e2 = $("#reaz-esito"); if (e2) e2.textContent = "Immagine caricata: ricordati di salvare.";
    } catch (e) { const e2 = $("#reaz-esito"); if (e2) e2.innerHTML = `<b class="errore">Non sono riuscito a caricare l'immagine: ${esc(e.message || "")}</b>`; }
  }
  async function azioneAdmin(cosa, el) {
    const [az, n] = cosa.split(":"), i = +n;
    if (!bozza) bozza = lista.map(x => Object.assign({}, x));
    if (az === "reaz-nuova" && bozza.length < MAX) bozza.push({ id: "r" + Date.now().toString(36), testo: "", img: "" });
    if (az === "reaz-togli") bozza.splice(i, 1);
    if (az === "reaz-togli-img" && bozza[i]) bozza[i].img = "";
    if (az === "reaz-su" && i > 0) [bozza[i - 1], bozza[i]] = [bozza[i], bozza[i - 1]];
    if (az === "reaz-giu" && i < bozza.length - 1) [bozza[i + 1], bozza[i]] = [bozza[i], bozza[i + 1]];
    if (az === "reaz-base") { if (el.dataset.conferma !== "1") { el.dataset.conferma = "1"; el.textContent = "Sicuro? Tocca di nuovo"; return; } bozza = BASE.map(x => Object.assign({}, x)); }
    if (az === "reaz-salva") {
      const pronte = bozza.filter(x => (x.testo || "").trim() || x.img);
      if (!pronte.length) { mostraAvviso("Serve almeno una reazione."); return; }
      try { await Archivio.db.doc("config/reazioni").set({ lista: pronte }); lista = pulisci(pronte); bozza = null; mostraAvviso("Reazioni salvate: ora le hanno tutti."); }
      catch (e) { mostraAvviso("Non sono riuscito a salvare. Serve la pagina online con il tuo account admin."); return; }
    }
    ridisegnaAdmin();
  }
  return { carica, monta, manda, ricevi, riceviSpettatore, clic, htmlAdmin, testo, immagine, azioneAdmin };
})();
