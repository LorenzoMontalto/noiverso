// Service worker di Noiverso: fa partire il gioco in fretta e tiene in memoria codice e immagini.
// La pagina principale arriva sempre dalla rete (così gli aggiornamenti arrivano subito);
// i file con il codice hanno nel nome un'impronta, quindi una volta scaricati non cambiano più.
const VERSIONE = "6e17b220";
const CACHE = "noiverso-" + VERSIONE;
const BASE = ["./", "installa.html", "manifest.webmanifest", "icone/icona-192.png", "icone/icona-512.png", "icone/apple-touch-icon.png", "carte.a93673e7.js", "motore.2271a730.js", "effetti.9fb9bc7f.js", "suoni.74c89eac.js", "scena3d.54696600.js", "mappe.fb504325.js", "storia.fe995756.js", "tutorial.5cbc834a.js", "missioni.80068fac.js", "sociale.8be65ec1.js", "collezione.d79346c4.js", "graffiti.87ba5b2f.js", "zaino.f42c2817.js", "online.48770847.js", "reazioni.4a0e6db8.js", "eventi.89e96608.js", "app.0109b84d.js", "supabase-ponte.8a297e8b.js", "immagini.1fe49a86.js", "three.min.9274bbce.js", "supabase.min.8816af04.js"];

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
    // prima la rete (saltando anche la memoria del browser, che GitHub Pages farebbe durare 10 minuti),
    // la copia in memoria solo se sei offline
    const daRete = r.mode === "navigate" ? fetch(r.url, { cache: "no-store", credentials: "same-origin" }) : fetch(r, { cache: "no-store" });
    e.respondWith(daRete.then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match("./"))));
    return;
  }
  const deposito = url.pathname.includes("/img/") ? "noiverso-immagini" : CACHE;
  e.respondWith(caches.open(deposito).then(k => k.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === "opaque") k.put(r, res.clone()); return res; }))));
});
