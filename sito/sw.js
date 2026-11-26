// Service worker di Noiverso: fa partire il gioco in fretta e tiene in memoria codice e immagini.
// La pagina principale arriva sempre dalla rete (così gli aggiornamenti arrivano subito);
// i file con il codice hanno nel nome un'impronta, quindi una volta scaricati non cambiano più.
const VERSIONE = "ce61203a";
const CACHE = "noiverso-" + VERSIONE;
const BASE = ["./", "installa.html", "manifest.webmanifest", "icone/icona-192.png", "icone/icona-512.png", "icone/apple-touch-icon.png", "carte.50ddcadc.js", "motore.a252ab6e.js", "effetti.9fb9bc7f.js", "suoni.48664f04.js", "scena3d.69277890.js", "mappe.8922ee6b.js", "storia.75ab2ff4.js", "tutorial.b7098382.js", "missioni.cd5c4dc5.js", "sociale.d0c1d199.js", "collezione.356b56d0.js", "graffiti.e550f7a5.js", "zaino.ba1e8b12.js", "online.546aed30.js", "reazioni.4a0e6db8.js", "eventi.62e522d9.js", "progressi.2892477a.js", "extra.3036717e.js", "avvento.355b1396.js", "notte.fc31b477.js", "scalata.0c485016.js", "app.f7badf83.js", "supabase-ponte.7c0d3cac.js", "immagini.1e35aa5a.js", "three.min.9274bbce.js", "supabase.min.8816af04.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith("noiverso-") && n !== CACHE && !["noiverso-suoni", "noiverso-immagini", "noiverso-miniature"].includes(n)).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  // database e accesso (Supabase): mai dalla memoria
  if (url.hostname.endsWith("supabase.co") || url.hostname.endsWith("supabase.in")) return;
  const font = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !font) return;
  const pagina = r.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html") || url.pathname.endsWith("config.js") || url.pathname.endsWith(".webmanifest");
  if (pagina) {
    // prima la rete (saltando anche la memoria del browser, che GitHub Pages farebbe durare 10 minuti),
    // la copia in memoria solo se sei offline
    const daRete = r.mode === "navigate" ? fetch(r.url, { cache: "no-store", credentials: "same-origin" }) : fetch(r, { cache: "no-store" });
    e.respondWith(daRete.then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match("./"))));
    return;
  }
  // immagini e suoni non cambiano a ogni versione: stanno in un deposito a parte che non si svuota
  const deposito = url.pathname.includes("/img/") ? "noiverso-immagini" : url.pathname.includes("/suoni/") ? "noiverso-suoni" : CACHE;
  e.respondWith(caches.open(deposito).then(k => k.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === "opaque") k.put(r, res.clone()); return res; }))));
});
