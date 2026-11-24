// ============================================================
//  IMMAGINI DELLE CARTE
//  Nella versione pubblicata le immagini stanno in uno spazio privato di Supabase (bucket "carte"):
//  le vede solo chi ha fatto l'accesso. Per mostrarle il gioco chiede a Supabase dei link firmati
//  che valgono 7 giorni e li tiene in memoria, così il browser può riusare le immagini già scaricate.
//  Nella versione su Claude (senza Supabase) restano nella cartella img/.
// ============================================================
const ImmaginiCarte = (() => {
  const BUCKET = "carte", DURATA = 7 * 24 * 3600, CHIAVE = "noiverso-immagini";
  // segnaposto scuro (prima dell'accesso, o se un'immagine manca)
  const VUOTA = "data:image/svg+xml;charset=utf-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 7"><rect width="5" height="7" fill="#1d151b"/></svg>');
  let mappa = {};
  const supa = () => window.NOIVERSO_SUPABASE && window.NoiversoAccesso && window.NoiversoAccesso.sb;

  // nome del file di una carta: di solito è il suo codice, ma una carta può averne uno suo (campo img) quando cambia foto
  const file = id => (typeof PER_ID !== "undefined" && PER_ID[id] && PER_ID[id].img) || id;
  function url(id) {
    if (!window.NOIVERSO_SUPABASE) return `img/${file(id)}.webp`;
    return mappa[file(id)] || VUOTA;
  }

  // Prepara i link firmati (dopo l'accesso). Riusa quelli salvati finché mancano più di 2 giorni alla scadenza.
  async function prepara(ids, forza) {
    ids = [...new Set(ids.map(file))];
    const sb = supa();
    if (!sb || !(await window.NoiversoAccesso.sessione())) return;
    let salvate = null;
    try { salvate = JSON.parse(localStorage.getItem(CHIAVE)); } catch (e) {}
    const ancoraBuone = salvate && salvate.scade - Date.now() > 2 * 24 * 3600 * 1000 && ids.every(id => salvate.mappa[id]);
    if (ancoraBuone && !forza) { mappa = salvate.mappa; return; }
    try {
      const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(ids.map(id => `${id}.webp`), DURATA);
      if (error) throw error;
      const nuova = {};
      for (const x of data || []) if (x.signedUrl && !x.error) nuova[x.path.replace(/\.webp$/, "")] = x.signedUrl;
      mappa = nuova;
      try { localStorage.setItem(CHIAVE, JSON.stringify({ scade: Date.now() + DURATA * 1000, mappa: nuova })); } catch (e) {}
    } catch (e) { if (salvate) mappa = salvate.mappa; }
  }

  // ---------- strumenti admin: elenco e caricamento ----------
  async function elenco() {
    const sb = supa(); if (!sb) return [];
    const { data, error } = await sb.storage.from(BUCKET).list("", { limit: 1000 });
    if (error) throw error;
    return (data || []).map(f => f.name.replace(/\.webp$/, ""));
  }
  // Porta un'immagine qualsiasi al formato delle carte: 520×728 (5:7), ritagliata al centro, in webp
  async function inFormatoCarta(blob) {
    const bmp = await createImageBitmap(blob);
    const W = 520, H = 728, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d"), r = Math.max(W / bmp.width, H / bmp.height);
    const w = bmp.width * r, h = bmp.height * r;
    g.drawImage(bmp, (W - w) / 2, Math.min(0, (H - h) * .25), w, h);   // un po' spostata in alto: lì ci sono i volti
    return await new Promise(ok => cv.toBlob(ok, "image/webp", .85));
  }
  async function carica(id, blob, giaPronta) {
    const sb = supa();
    const dati = giaPronta ? blob : await inFormatoCarta(blob);
    const { error } = await sb.storage.from(BUCKET).upload(`${file(id)}.webp`, dati, { upsert: true, contentType: "image/webp", cacheControl: String(DURATA) });
    if (error) throw error;
    dimenticaMini(file(id));
  }
  function dimentica() { try { localStorage.removeItem(CHIAVE); } catch (e) {} }

  // ---------- miniature (nov 2026) ----------
  // Squadre, album e negozio mostrano tante carte piccole. Con le immagini intere (520×728), ogni volta che
  // rientri in una pagina il telefono le deve ricaricare e ridecodificare tutte, e per un paio di secondi le
  // carte restano vuote. Così invece ne faccio una copia piccola (300×420) una volta sola, la tengo nella
  // memoria del dispositivo e la uso da lì: compare subito. Le immagini intere restano per il dettaglio e la battaglia.
  const MINI_W = 300, MINI_H = 420, DEPOSITO = "noiverso-miniature";
  const mini = {}, coda = [], inCoda = new Set();
  let deposito = null, inCorso = 0;
  const chiaveMini = f => `https://miniature.noiverso/v1/${encodeURIComponent(f)}.jpg`;
  function urlMini(id) {
    const f = file(id);
    if (mini[f]) return mini[f];
    const u = url(id);
    if (u !== VUOTA && window.NOIVERSO_SUPABASE) accoda(f, u);
    return u;
  }
  async function apriMiniature() {
    if (!window.NOIVERSO_SUPABASE || !("caches" in window)) return;
    try {
      deposito = await caches.open(DEPOSITO);
      for (const r of await deposito.keys()) {
        const nome = decodeURIComponent(new URL(r.url).pathname.split("/").pop().replace(/\.jpg$/, ""));
        if (mini[nome]) continue;
        const res = await deposito.match(r); if (res) mini[nome] = URL.createObjectURL(await res.blob());
      }
    } catch (e) { deposito = null; }
    for (const f of coda.splice(0)) inCoda.delete(f.f), accoda(f.f, f.u);
  }
  function accoda(f, u) {
    if (mini[f] || inCoda.has(f)) return;
    inCoda.add(f); coda.push({ f, u });
    if (deposito) avanti();
  }
  function avanti() {
    while (inCorso < 2 && coda.length) {
      const x = coda.shift(); inCorso++;
      crea(x.f, x.u).catch(() => {}).finally(() => { inCorso--; inCoda.delete(x.f); setTimeout(avanti, 30); });
    }
  }
  async function crea(f, u) {
    if (mini[f] || !deposito) return;
    const res = await fetch(u); if (!res.ok) return;
    const bmp = await createImageBitmap(await res.blob());
    const cv = document.createElement("canvas"); cv.width = MINI_W; cv.height = MINI_H;
    const g = cv.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(bmp, 0, 0, MINI_W, MINI_H);
    if (bmp.close) bmp.close();
    const piccola = await new Promise(ok => cv.toBlob(ok, "image/jpeg", .85)); if (!piccola) return;
    try { await deposito.put(chiaveMini(f), new Response(piccola, { headers: { "Content-Type": "image/jpeg" } })); } catch (e) {}
    mini[f] = URL.createObjectURL(piccola);
  }
  // dopo l'accesso: carico quelle già pronte e preparo, con calma, quelle delle carte che hai
  async function preparaMiniature(ids) {
    await apriMiniature();
    for (const id of ids) { const u = url(id); if (u !== VUOTA) accoda(file(id), u); }
  }
  async function dimenticaMini(f) { delete mini[f]; try { if (deposito) await deposito.delete(chiaveMini(f)); } catch (e) {} }

  return { url, urlMini, file, prepara, preparaMiniature, dimenticaMini, elenco, carica, dimentica, VUOTA };
})();
function imgCarta(id) { return ImmaginiCarte.url(id); }
function imgMini(id) { return ImmaginiCarte.urlMini(id); }   // carte piccole nelle liste
