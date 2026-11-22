// Service worker di Noiverso: fa partire il gioco in fretta e tiene in memoria codice e immagini.
// La pagina principale arriva sempre dalla rete (così gli aggiornamenti arrivano subito);
// i file con il codice hanno nel nome un'impronta, quindi una volta scaricati non cambiano più.
const VERSIONE = "0cbec23b";
const CACHE = "noiverso-" + VERSIONE;
const BASE = ["./", "installa.html", "manifest.webmanifest", "icone/icona-192.png", "icone/icona-512.png", "icone/apple-touch-icon.png", "carte.ef7dadc0.js", "motore.a5d463f6.js", "effetti.9fb9bc7f.js", "scena3d.c693551b.js", "mappe.9c43510a.js", "storia.08128bc0.js", "tutorial.a0d7d7af.js", "missioni.80068fac.js", "sociale.870259fd.js", "collezione.43d273e9.js", "graffiti.1ecab573.js", "zaino.be6cf23c.js", "online.a4e7bb46.js", "reazioni.4a0e6db8.js", "app.d3843fc3.js", "supabase-ponte.8a297e8b.js", "immagini.a787db84.js", "three.min.9274bbce.js", "supabase.min.8816af04.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n.startsWith("noiverso-") && n !== CACHE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
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
    // prima la rete, la copia in memoria solo se sei offline
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match("./"))));
    return;
  }
  const deposito = url.pathname.includes("/img/") ? "noiverso-immagini" : CACHE;
  e.respondWith(caches.open(deposito).then(k => k.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === "opaque") k.put(r, res.clone()); return res; }))));
});
