// ============================================================
//  SCENE 3D (Three.js r128): arena di battaglia e apertura bustine.
//  Se il dispositivo non supporta WebGL, Scena3D.disponibile è false
//  e l'app usa la versione 2D.
// ============================================================

const Scena3D = (() => {
  const T = window.THREE;
  const COL_RARITA = { comune: 0x9aa3ad, rara: 0x4c95ff, epica: 0xb866ff, leggendaria: 0xf2c14e, ultra: 0xffe9a8, jolly: 0xffffff };
  const HEX_RARITA = { comune: "#9aa3ad", rara: "#4c95ff", epica: "#b866ff", leggendaria: "#f2c14e", ultra: "#ffe9a8", jolly: "#ffffff" };
  const COL_STILE = { FOR: 0xff7a45, VEL: 0x3fd8ff, DIF: 0x7ddc6a };
  const ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  let disponibile = false;
  // Impostazioni del giocatore: velocità animazioni, effetti a schermo, qualità grafica
  const imp = { velocita: 1, effetti: true, qualita: "alta" };
  try {
    const c = document.createElement("canvas");
    disponibile = !!(T && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { disponibile = false; }

  // ---------------- Utilità ----------------
  const easing = {
    lin: t => t,
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t * t,
    inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    elastic: t => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1,
  };
  const lerp = (a, b, t) => a + (b - a) * t;

  const immagini = {};
  function caricaImg(src) {
    if (!immagini[src]) immagini[src] = new Promise(res => {
      const im = new Image();
      if (/^https?:/.test(src)) im.crossOrigin = "anonymous";   // immagini dallo spazio privato: servono per il 3D
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
    return immagini[src];
  }
  let fontPronto = null;
  function font() {
    if (!fontPronto) fontPronto = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('40px "Bungee"'), document.fonts.load('600 20px "Barlow Semi Condensed"')]).catch(() => {}) : Promise.resolve();
    return fontPronto;
  }

  // segna una risorsa condivisa: non va liberata quando un effetto esce di scena
  function tieni(o) { o.userData = o.userData || {}; o.userData.tieni = true; return o; }

  function nuovaTexture(canvas) {
    const t = new T.CanvasTexture(canvas);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = 16;   // nitide anche quando la carta è inclinata (il renderer usa il massimo che la scheda supporta)
    return t;
  }

  // Faccia della carta disegnata su canvas: foto, cornice, nome, ruolo
  const cacheFronte = {};
  async function texFronte(c, liv, lode, olo, ultra, stelle = 0, cc = "") {
    const k = c.id + ":" + liv + (lode ? "L" : "") + (olo ? "O" : "") + (ultra ? "U" : "") + (stelle ? "S" + stelle : "") + (cc ? "C" + cc : "");
    if (cacheFronte[k]) return cacheFronte[k];
    await font();
    const W = 512, H = 716, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const col = HEX_RARITA[c.rarita];
    g.fillStyle = "#17121a"; g.fillRect(0, 0, W, H);
    const im = await caricaImg(`${imgCarta(c.id)}`);
    if (im) g.drawImage(im, 0, 0, W, H);
    // sfumatura per il testo
    const gr = g.createLinearGradient(0, H * .62, 0, H);
    gr.addColorStop(0, "rgba(8,6,8,0)"); gr.addColorStop(.45, "rgba(8,6,8,.88)"); gr.addColorStop(1, "rgba(8,6,8,.96)");
    g.fillStyle = gr; g.fillRect(0, H * .6, W, H * .4);
    // cornice
    g.lineWidth = 18; g.strokeStyle = col; g.strokeRect(9, 9, W - 18, H - 18);
    if (c.rarita === "leggendaria") { g.lineWidth = 3; g.strokeStyle = "#fff3c4"; g.strokeRect(24, 24, W - 48, H - 48); }
    if (ultra) {   // versione Ultra: cornice nera e oro con la scritta ULTRA
      g.lineWidth = 18; g.strokeStyle = "#0b0a08"; g.strokeRect(9, 9, W - 18, H - 18);
      const go = g.createLinearGradient(0, 0, W, H); go.addColorStop(0, "#fff3c4"); go.addColorStop(.5, "#c9a13a"); go.addColorStop(1, "#fff3c4");
      g.lineWidth = 6; g.strokeStyle = go; g.strokeRect(20, 20, W - 40, H - 40); g.lineWidth = 2; g.strokeRect(30, 30, W - 60, H - 60);
      g.fillStyle = "#0b0a08"; g.fillRect(W / 2 - 90, 4, 180, 40); g.fillStyle = go; g.font = '30px "Bungee", Impact, sans-serif'; g.textAlign = "center"; g.fillText("ULTRA", W / 2, 36); g.textAlign = "left";
    }
    // cornice della carta (cosmetico): sopra il bordo della rarità
    const TELAI = { "cc-neon": ["#39f3ff", "#a8fbff"], "cc-ghiaccio": ["#bfeaff", "#ffffff"], "cc-sakura": ["#ff9ab8", "#ffe0ea"], "cc-oro": ["#c9a13a", "#fff3c4"],
      "cc-fiamme": ["#ff4a1a", "#ffd24d"], "cc-galassia": ["#6a2aff", "#e0c8ff"], "cc-arcobaleno": ["#ff2e46", "#3fd8ff"], "cc-diamante": ["#9ad8ff", "#ffffff"], "cc-maestro": ["#f2c14e", "#ffffff"],
      // nov 2026: cornici nuove del negozio (più di 2 colori = gradiente a più tappe)
      "cc-legno": ["#6a3e1a", "#a06a35"], "cc-argento": ["#8a939d", "#ffffff", "#a7b0ba", "#ffffff", "#8a939d"], "cc-caramella": ["#ff2e46", "#ffffff"], "cc-pixel": ["#39f3ff", "#ff4ad8"],
      "cc-smeraldo": ["#2ad87a", "#b8ffd8"], "cc-rubino": ["#ff2e56", "#ffc8d2"], "cc-zaffiro": ["#2a6aff", "#c8e0ff"], "cc-veleno": ["#5ad81a", "#d6ff5a"],
      "cc-oceano": ["#0a3a8a", "#2a8adf", "#9ae4ff", "#2a8adf", "#0a3a8a"], "cc-notte": ["#0a0f2a", "#3a4a9a"], "cc-lava": ["#3a1006", "#ff5a1a", "#ffb02a", "#ff5a1a", "#3a1006"],
      "cc-tempesta": ["#3fa8ff", "#e8f6ff"], "cc-ombra": ["#0a0410", "#7a3ac8", "#0a0410", "#4a1a7a"], "cc-aurora": ["#3affa0", "#2ad8ff", "#a84aff", "#ff6ad8", "#3affa0"],
      "cc-prisma": ["#ff2e46", "#f2c14e", "#5adc8c", "#39f3ff", "#8a6aff", "#ff6ad8"], "cc-reale": ["#5a1a8a", "#a85ae8", "#3a0a5a", "#a85ae8", "#5a1a8a"],
      "cc-natale": ["#c8102e", "#ffffff", "#1a8a3a", "#ffffff", "#c8102e"] };
    if (TELAI[cc]) {
      const [c1, c2] = TELAI[cc], gt = g.createLinearGradient(0, 0, W, H);
      if (cc === "cc-arcobaleno") ["#ff2e46", "#f2c14e", "#5adc8c", "#39f3ff", "#c9a4ff"].forEach((x, i, a) => gt.addColorStop(i / (a.length - 1), x));
      else if (TELAI[cc].length > 2) TELAI[cc].forEach((x, i, a) => gt.addColorStop(i / (a.length - 1), x));
      else { gt.addColorStop(0, c2); gt.addColorStop(.5, c1); gt.addColorStop(1, c2); }
      g.save(); g.shadowColor = c1; g.shadowBlur = 18; g.lineWidth = cc === "cc-maestro" ? 22 : 16; g.strokeStyle = gt; g.strokeRect(10, 10, W - 20, H - 20); g.restore();
      // ornamenti delle cornici nuove
      g.save();
      if (cc === "cc-caramella" || cc === "cc-pixel") { g.lineWidth = 16; g.strokeStyle = c2; g.setLineDash(cc === "cc-pixel" ? [12, 12] : [16, 16]); g.strokeRect(10, 10, W - 20, H - 20); }
      if (cc === "cc-natale") { g.lineWidth = 16; g.strokeStyle = "#1a8a3a"; g.setLineDash([18, 18]); g.strokeRect(10, 10, W - 20, H - 20); g.setLineDash([]);
        g.fillStyle = "#ffffff"; g.shadowColor = "#bfe8ff"; g.shadowBlur = 8; for (let k = 0; k < 26; k++) { g.beginPath(); g.arc((k * 97) % W, 30 + (k * 53) % (H - 60), 2 + k % 3, 0, 7); g.fill(); }
        g.shadowBlur = 0; g.font = "44px sans-serif"; g.textAlign = "center"; g.fillText("🎄", W - 40, H - 30); g.fillText("🎀", W / 2, 46); g.textAlign = "left"; }
      if (cc === "cc-legno") { g.fillStyle = "#efe6d6"; g.strokeStyle = "#5a4a3a"; g.lineWidth = 3; for (const [x, y] of [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]]) { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); g.stroke(); } }
      if (cc === "cc-smeraldo" || cc === "cc-rubino" || cc === "cc-zaffiro") for (const x of [24, W - 24]) {
        g.save(); g.translate(x, H / 2); g.rotate(Math.PI / 4); const gg = g.createLinearGradient(-16, -16, 16, 16); gg.addColorStop(0, "#ffffff"); gg.addColorStop(.25, c2); gg.addColorStop(.7, c1); gg.addColorStop(1, "#000");
        g.shadowColor = c1; g.shadowBlur = 16; g.fillStyle = gg; g.fillRect(-15, -15, 30, 30); g.shadowBlur = 0; g.lineWidth = 4; g.strokeStyle = "#f2e2a0"; g.strokeRect(-15, -15, 30, 30); g.restore(); }
      if (cc === "cc-veleno") { g.fillStyle = "#b6ff3a"; g.shadowColor = "#8aff3a"; g.shadowBlur = 10; for (const [x, h] of [[.16, 50], [.38, 74], [.6, 40], [.84, 62]]) { g.beginPath(); g.ellipse(W * x, 14, 11, h, 0, 0, Math.PI); g.fill(); } }
      if (cc === "cc-notte") { g.fillStyle = "#ffffff"; g.shadowColor = "#c8d8ff"; g.shadowBlur = 8; for (const [x, y, r] of [[.12, .02, 3], [.7, .02, 2.5], [.97, .3, 3], [.03, .62, 2.5], [.55, .98, 3], [.4, .015, 2], [.97, .7, 2.5], [.03, .25, 2.5], [.2, .98, 2.5]]) { g.beginPath(); g.arc(W * x, H * y, r, 0, 7); g.fill(); } }
      if (cc === "cc-tempesta") { g.fillStyle = "#ffffff"; g.shadowColor = "#3fa8ff"; g.shadowBlur = 14; g.font = 'bold 54px sans-serif'; g.fillText("ϟ", 20, 70); g.fillText("ϟ", W - 52, H - 26); }
      if (cc === "cc-reale") { g.strokeStyle = "#f2c14e"; g.lineWidth = 4; g.shadowColor = "#f2c14e"; g.shadowBlur = 8; g.strokeRect(30, 30, W - 60, H - 60);
        g.shadowBlur = 0; g.fillStyle = "#3a0a5a"; g.fillRect(W / 2 - 36, 6, 72, 46); g.strokeRect(W / 2 - 36, 6, 72, 46); g.fillStyle = "#f2c14e"; g.font = '40px sans-serif'; g.textAlign = "center"; g.fillText("♛", W / 2, 44); }
      g.restore();
      if (cc === "cc-maestro") {
        g.save(); g.fillStyle = "#fff3c4"; g.font = '40px sans-serif'; g.shadowColor = "#f2c14e"; g.shadowBlur = 12;
        for (const [x, y] of [[8, 46], [W - 46, 46], [8, H - 10], [W - 46, H - 10]]) g.fillText("★", x, y);
        g.fillStyle = "#1a1206"; g.fillRect(W / 2 - 96, H - 34, 192, 30); g.fillStyle = gt; g.font = '22px "Bungee", Impact, sans-serif'; g.textAlign = "center"; g.fillText("MAESTRO", W / 2, H - 11); g.restore();
      }
    }
    // nome e ruolo
    g.font = '40px "Bungee", Impact, sans-serif';
    let fs = 40; while (g.measureText(c.nome).width > W - 70 && fs > 14) { fs -= 2; g.font = `${fs}px "Bungee", Impact, sans-serif`; }
    if (olo) {   // olografica: nome arcobaleno e scritta sopra, come nella carta dell'album
      const lw = g.measureText(c.nome).width, arc = g.createLinearGradient(34, 0, 34 + lw, 0);
      ["#ff7a9a", "#ffd25a", "#6fffb8", "#6ccaff", "#d08cff"].forEach((col, i, a) => arc.addColorStop(i / (a.length - 1), col));
      g.fillStyle = arc;
      g.save(); g.font = '800 22px "Barlow Semi Condensed", sans-serif'; g.shadowColor = "#c86eff"; g.shadowBlur = 10;
      const sw = g.measureText("✦ OLOGRAFICA").width, arc2 = g.createLinearGradient(34, 0, 34 + sw, 0);
      ["#ff7a9a", "#ffd25a", "#6fffb8", "#6ccaff", "#d08cff"].forEach((col, i, a) => arc2.addColorStop(i / (a.length - 1), col));
      g.fillStyle = arc2; g.fillText("✦ OLOGRAFICA", 36, H - 74 - fs - 6); g.restore();
      g.fillStyle = arc;
    } else g.fillStyle = "#f4ece8";
    g.fillText(c.nome, 34, H - 74);
    if (stelle) {   // stelle della maestria, in basso a sinistra sopra il nome (come nell'album)
      g.save(); g.font = '26px "Barlow Semi Condensed", sans-serif'; g.textAlign = "left";
      const y = H - 74 - fs - (olo ? 34 : 8);
      for (let i = 0; i < 5; i++) { g.fillStyle = i < stelle ? "#f2c14e" : "rgba(255,255,255,.22)"; g.shadowColor = i < stelle ? "rgba(242,193,78,.8)" : "transparent"; g.shadowBlur = i < stelle ? 8 : 0; g.fillText("★", 34 + i * 24, y); }
      g.restore();
    }
    g.fillStyle = col;
    g.font = '600 24px "Barlow Semi Condensed", "Arial Narrow", sans-serif';
    const ruolo = (typeof RUOLI !== "undefined" ? RUOLI[c.ruolo].nome : c.ruolo).toUpperCase();
    g.fillText(`${ruolo} · ${RARITA[c.rarita].nome.toUpperCase()}`, 36, H - 40);
    // stile e livello
    const cs = { FOR: "#ff7a45", VEL: "#3fd8ff", DIF: "#7ddc6a" }[c.stile];
    g.fillStyle = "rgba(13,10,12,.85)"; g.fillRect(30, 30, 78, 38);
    g.strokeStyle = cs; g.lineWidth = 3; g.strokeRect(30, 30, 78, 38);
    g.fillStyle = cs; g.font = '700 24px "Barlow Semi Condensed", sans-serif'; g.fillText(c.stile, 46, 58);
    if (liv) {
      const testo = lode ? "30 e lode" : `Lv ${liv}`;
      g.font = '700 24px "Barlow Semi Condensed", sans-serif';
      const lw = g.measureText(testo).width + 28;
      g.fillStyle = lode ? "rgba(242,193,78,.92)" : "rgba(13,10,12,.85)"; g.fillRect(W - 30 - lw, 30, lw, 38);
      g.strokeStyle = lode ? "#fff3c4" : col; g.strokeRect(W - 30 - lw, 30, lw, 38);
      g.fillStyle = lode ? "#1b1206" : "#f4ece8"; g.fillText(testo, W - 16 - lw, 58);
    }
    if (lode) { g.lineWidth = 6; g.strokeStyle = "#f2c14e"; g.shadowColor = "#f2c14e"; g.shadowBlur = 20; g.strokeRect(20, 20, W - 40, H - 40); g.shadowBlur = 0; }
    if (olo) {   // olografica: riflesso arcobaleno in diagonale e cornice iridescente
      g.save(); g.globalCompositeOperation = "screen";
      const iri = g.createLinearGradient(0, 0, W, H);
      ["rgba(255,80,120,.30)", "rgba(255,210,90,.26)", "rgba(90,255,170,.26)", "rgba(80,190,255,.30)", "rgba(200,110,255,.30)", "rgba(255,80,120,.26)"].forEach((col, i, a) => iri.addColorStop(i / (a.length - 1), col));
      g.fillStyle = iri; g.fillRect(0, 0, W, H);
      const lampo = g.createLinearGradient(W * .1, 0, W * .9, H);
      lampo.addColorStop(.38, "rgba(255,255,255,0)"); lampo.addColorStop(.5, "rgba(255,255,255,.35)"); lampo.addColorStop(.62, "rgba(255,255,255,0)");
      g.fillStyle = lampo; g.fillRect(0, 0, W, H); g.restore();
      const bordo = g.createLinearGradient(0, 0, W, H);
      ["#ff5078", "#ffd25a", "#5affaa", "#50beff", "#c86eff", "#ff5078"].forEach((col, i, a) => bordo.addColorStop(i / (a.length - 1), col));
      g.lineWidth = 18; g.strokeStyle = bordo; g.strokeRect(9, 9, W - 18, H - 18);
    }
    const tf = tieni(nuovaTexture(cv));
    return (cacheFronte[k] = tf);
  }

  let cacheRetro = null;
  function texRetro() {
    if (cacheRetro) return cacheRetro;
    const W = 512, H = 716, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    g.fillStyle = "#1b1218"; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H / 2); g.rotate(-Math.PI / 4);
    for (let x = -900; x < 900; x += 36) { g.fillStyle = "#22161e"; g.fillRect(x, -900, 18, 1800); }
    g.restore();
    g.lineWidth = 16; g.strokeStyle = "#ff2e46"; g.strokeRect(8, 8, W - 16, H - 16);
    g.shadowColor = "#ff2e46"; g.shadowBlur = 30;
    g.fillStyle = "#ff2e46"; g.font = '130px "Bungee", Impact, sans-serif'; g.textAlign = "center";
    g.fillText("NV", W / 2, H / 2 + 30);
    g.shadowBlur = 0; g.font = '30px "Bungee", Impact, sans-serif'; g.fillStyle = "#f4ece8";
    g.fillText("NOIVERSO", W / 2, H / 2 + 100);
    cacheRetro = tieni(nuovaTexture(cv));
    return cacheRetro;
  }

  function texBustina(tipo) {
    const W = 512, H = 720, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    const T = typeof TIPI_BUSTINA !== "undefined" ? TIPI_BUSTINA[tipo] : null;
    const colori = { benvenuto: ["#ff2e46", "#3a0a14"], normale: ["#ff2e46", "#2a0c14"], epica: ["#b866ff", "#1e0c2e"], leggendaria: ["#f2c14e", "#2e2208"], ultra: ["#ffe9a8", "#0b0a08"] }[tipo] || (T && T.colore ? [T.colore, "#1c1018"] : ["#ff2e46", "#2a0c14"]);
    const gr = g.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, colori[1]); gr.addColorStop(.5, "#120c10"); gr.addColorStop(1, colori[1]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // riflesso "foil"
    const f = g.createLinearGradient(0, H, W, 0);
    f.addColorStop(.35, "rgba(255,255,255,0)"); f.addColorStop(.5, "rgba(255,255,255,.12)"); f.addColorStop(.65, "rgba(255,255,255,0)");
    g.fillStyle = f; g.fillRect(0, 0, W, H);
    g.strokeStyle = colori[0]; g.lineWidth = 10; g.strokeRect(14, 14, W - 28, H - 28);
    for (let i = 0; i < 6; i++) { g.fillStyle = colori[0]; g.globalAlpha = .18; g.fillRect(0, 120 + i * 14, W, 4); }
    g.globalAlpha = 1;
    g.shadowColor = colori[0]; g.shadowBlur = 36; g.fillStyle = colori[0]; g.textAlign = "center";
    g.font = '86px "Bungee", Impact, sans-serif'; g.fillText("NOI", W / 2, H / 2 - 40); g.fillText("VERSO", W / 2, H / 2 + 60);
    g.shadowBlur = 0; g.fillStyle = "#f4ece8"; g.font = '600 34px "Barlow Semi Condensed", sans-serif';
    const nomi = { benvenuto: "BENVENUTO · 5 CARTE", normale: "4 CARTE", epica: "EPICA · 4 CARTE", leggendaria: "LEGGENDARIA · 5 CARTE", ultra: "ULTRA · 5 CARTE" };
    g.fillText(nomi[tipo] || (T ? `${T.nome.replace(/^Bustina\s*/, "").toUpperCase() || "BUSTINA"} · ${T.carte} CARTE` : "4 CARTE"), W / 2, H - 70);
    return nuovaTexture(cv);
  }

  function texTesto(testo, colore, dim = 64) {
    const cv = document.createElement("canvas");
    const g = cv.getContext("2d");
    g.font = `${dim}px "Bungee", Impact, sans-serif`;
    const w = Math.ceil(g.measureText(testo).width) + 40;
    cv.width = w; cv.height = dim + 40;
    g.font = `${dim}px "Bungee", Impact, sans-serif`;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 8; g.strokeStyle = "rgba(0,0,0,.85)"; g.strokeText(testo, w / 2, cv.height / 2);
    g.shadowColor = colore; g.shadowBlur = 18; g.fillStyle = colore; g.fillText(testo, w / 2, cv.height / 2);
    return { tex: nuovaTexture(cv), aspect: w / cv.height };
  }

  let texPuntino = null;
  function puntino() {
    if (texPuntino) return texPuntino;
    const cv = document.createElement("canvas"); cv.width = cv.height = 64;
    const g = cv.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.3, "rgba(255,255,255,.7)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    texPuntino = tieni(new T.CanvasTexture(cv));
    return texPuntino;
  }

  function creaCarta(fronte, retro, rarita, w = 1, h = 1.4) {
    const bordo = new T.MeshStandardMaterial({ color: COL_RARITA[rarita], emissive: COL_RARITA[rarita], emissiveIntensity: .5, metalness: .6, roughness: .35 });
    const mF = new T.MeshStandardMaterial({ map: fronte, roughness: .45, metalness: .1, emissive: 0xffffff, emissiveMap: fronte, emissiveIntensity: .18 });
    const mR = new T.MeshStandardMaterial({ map: retro, roughness: .5, metalness: .1, emissive: 0xffffff, emissiveMap: retro, emissiveIntensity: .15 });
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, .035), [bordo, bordo, bordo, bordo, mF, mR]);
    mesh.userData.materiali = [bordo, mF, mR];
    [bordo, mF, mR, mesh.geometry].forEach(tieni);   // le copie (cloni) usano gli stessi materiali
    return mesh;
  }

  // Quando un effetto finisce e viene tolto dalla scena, libero geometrie, materiali e texture:
  // senza questo la memoria della scheda video cresceva a ogni attacco e il gioco rallentava sempre di più.
  function libera(o) {
    o.traverse(x => {
      if (x.geometry && !(x.geometry.userData && x.geometry.userData.tieni)) x.geometry.dispose();
      if (x.material) [].concat(x.material).forEach(m => {
        if (m.userData && m.userData.tieni) return;
        for (const k of ["map", "emissiveMap", "alphaMap"]) { const t = m[k]; if (t && !(t.userData && t.userData.tieni)) t.dispose(); }
        m.dispose();
      });
    });
  }

  function aloneSprite(colore, scala) {
    const s = new T.Sprite(new T.SpriteMaterial({ map: puntino(), color: colore, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: .8 }));
    s.scale.set(scala, scala, 1);
    return s;
  }

  // ---------------- Base comune: renderer, animazioni, particelle ----------------
  class Base {
    constructor(contenitore) {
      this.box = contenitore;
      this.r = new T.WebGLRenderer({ antialias: imp.qualita !== "bassa" && (window.devicePixelRatio || 1) < 1.5, alpha: true, powerPreference: "high-performance" });
      this.scalaRis = 1;   // si abbassa da sola se il dispositivo non tiene il ritmo
      this.r.setPixelRatio(this._pr(contenitore));
      this.r.outputEncoding = T.sRGBEncoding;
      this.r.setClearColor(0x000000, 0);
      contenitore.appendChild(this.r.domElement);
      this.scena = new T.Scene();
      const togli = this.scena.remove.bind(this.scena);
      this.scena.remove = (...ogg) => { togli(...ogg); for (const o of ogg) if (o && !(o.userData && o.userData.tieni)) libera(o); return this.scena; };
      this.cam = new T.PerspectiveCamera(40, 1, .1, 100);
      this.tween = [];
      this.particelle = [];
      this.aggiornatori = [];
      this.t0 = performance.now();
      this.vivo = true;
      this.scossa = 0;
      this._ro = new ResizeObserver(() => this.ridimensiona());
      this._ro.observe(contenitore);
      this.ridimensiona();
      const ciclo = () => { if (!this.vivo) return; this._frame(); requestAnimationFrame(ciclo); };
      requestAnimationFrame(ciclo);
    }
    // Risoluzione: mai più di ~2,2 milioni di pixel da disegnare (uno schermo grande a densità 2 ne avrebbe 8+)
    _pr(box = this.box) {
      const w = box.clientWidth || 300, h = box.clientHeight || 300;
      const base = imp.qualita === "bassa" ? 1 : Math.min(imp.qualita === "media" ? 1.5 : 2, window.devicePixelRatio || 1);
      const tetto = imp.qualita === "media" ? 2.4e6 : 3.8e6;   // pixel massimi da disegnare a ogni fotogramma
      return Math.max(.6, Math.min(base, Math.sqrt(tetto / (w * h))) * (this.scalaRis || 1));
    }
    ridimensiona() {
      const w = this.box.clientWidth || 300, h = this.box.clientHeight || 300;
      this.r.setPixelRatio(this._pr());
      this.r.setSize(w, h, false);
      this.cam.aspect = w / h;
      this.adattaCamera && this.adattaCamera();
      this.cam.updateProjectionMatrix();
    }
    anima(durata, fn, ease = easing.out) {
      if (ridotto) durata = Math.min(durata, 120);
      durata = durata / imp.velocita;
      return new Promise(res => this.tween.push({ inizio: performance.now(), durata, fn, ease, res }));
    }
    attendi(ms) { return new Promise(r => setTimeout(r, ridotto ? Math.min(ms, 60) : ms / imp.velocita)); }
    esplosione(pos, colore, n = 40, opz = {}) {
      if (ridotto) n = Math.min(n, 10);
      if (imp.qualita === "bassa") n = Math.max(2, Math.ceil(n * .4));
      const geo = new T.BufferGeometry();
      const p = new Float32Array(n * 3), v = [];
      for (let i = 0; i < n; i++) {
        p[i * 3] = pos.x; p[i * 3 + 1] = pos.y; p[i * 3 + 2] = pos.z;
        const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), s = (opz.velocita || 2.6) * (.4 + Math.random() * .8);
        v.push(new T.Vector3(Math.sin(b) * Math.cos(a) * s, Math.abs(Math.cos(b)) * s * (opz.su || 1) + (opz.spinta || 0), Math.sin(b) * Math.sin(a) * s * .6));
      }
      geo.setAttribute("position", new T.BufferAttribute(p, 3));
      const mat = new T.PointsMaterial({ map: puntino(), color: colore, size: opz.dimensione || .12, transparent: true, blending: T.AdditiveBlending, depthWrite: false });
      const pts = new T.Points(geo, mat);
      this.scena.add(pts);
      this.particelle.push({ pts, v, vita: 0, durata: opz.durata || 900, gravita: opz.gravita ?? 3 });
    }
    scritta(testo, colore, pos, scala = .5, durata = 1100) {
      const { tex, aspect } = texTesto(testo, colore);
      const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      s.scale.set(scala * aspect, scala, 1);
      s.position.copy(pos);
      s.renderOrder = 10;
      this.scena.add(s);
      const y0 = pos.y;
      this.anima(durata, t => {
        s.position.y = y0 + t * .7;
        s.material.opacity = t < .7 ? 1 : 1 - (t - .7) / .3;
        const k = t < .15 ? easing.back(t / .15) : 1;
        s.scale.set(scala * aspect * k, scala * k, 1);
      }, easing.lin).then(() => { this.scena.remove(s); tex.dispose(); s.material.dispose(); });
    }
    _frame() {
      const ora = performance.now(), grezzo = (ora - (this._ult || ora)) / 1000, dt = Math.min(.05, grezzo);
      this._ult = ora;
      // se per ~2 secondi va sotto i 40 fotogrammi al secondo, abbassa la risoluzione (fino al 55%)
      if (grezzo > 0 && grezzo < .5 && !document.hidden && ora - this.t0 > 3500) {
        this._fps = this._fps || { t: 0, n: 0 };
        this._fps.t += grezzo; this._fps.n++;
        if (this._fps.t > 3) {
          // abbassa la risoluzione solo se va davvero a scatti (sotto ~32 fps), e la rialza appena torna fluido
          const media = this._fps.t / this._fps.n;
          if (media > 1 / 32 && this.scalaRis > .76) { this.scalaRis = Math.max(.75, this.scalaRis - .1); this.ridimensiona(); }
          else if (media < 1 / 55 && this.scalaRis < 1) { this.scalaRis = Math.min(1, this.scalaRis + .1); this.ridimensiona(); }
          this._fps = { t: 0, n: 0 };
        }
      }
      this.tween = this.tween.filter(tw => {
        const t = Math.min(1, (ora - tw.inizio) / tw.durata);
        tw.fn(tw.ease(t), t);
        if (t >= 1) { tw.res(); return false; }
        return true;
      });
      this.particelle = this.particelle.filter(pa => {
        pa.vita += dt * 1000;
        const arr = pa.pts.geometry.attributes.position.array;
        pa.v.forEach((v, i) => { v.y -= pa.gravita * dt; arr[i * 3] += v.x * dt; arr[i * 3 + 1] += v.y * dt; arr[i * 3 + 2] += v.z * dt; });
        pa.pts.geometry.attributes.position.needsUpdate = true;
        pa.pts.material.opacity = Math.max(0, 1 - pa.vita / pa.durata);
        if (pa.vita >= pa.durata) { this.scena.remove(pa.pts); pa.pts.geometry.dispose(); pa.pts.material.dispose(); return false; }
        return true;
      });
      const tempo = (ora - this.t0) / 1000;
      this.aggiornatori.forEach(f => f(tempo, dt));
      const base = this.camBase;
      if (base) {
        this.cam.position.copy(base);
        if (this.deriva) this.cam.position.add(this.deriva);
        if (this.punta) this.cam.position.add(this.punta);
        if (this.scossa > 0) {
          this.cam.position.x += (Math.random() - .5) * this.scossa;
          this.cam.position.y += (Math.random() - .5) * this.scossa;
          this.scossa = Math.max(0, this.scossa - dt * .9);
        }
        this.cam.lookAt(this.guarda);
      }
      this.r.render(this.scena, this.cam);
    }
    distruggi() {
      this.vivo = false;
      this._ro.disconnect();
      this.scena.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach(m => m.dispose()); });
      this.r.dispose();
      if (this.r.forceContextLoss) this.r.forceContextLoss();
      this.r.domElement.remove();
    }
  }

  // ============================================================
  //  ARENA DI BATTAGLIA
  //  Tavolo visto dall'alto: in basso la tua squadra, in alto quella nemica.
  //  Ogni lato ha la carta in campo al centro e la panchina (5 posti) dietro.
  // ============================================================
  const V = (x, y, z) => new T.Vector3(x, y, z);

  // Statistiche da mostrare sotto una carta in battaglia (attacco già moltiplicato per il livello)
  function statVisibili(x) {
    const b = x.buff || {}, su = b.att ? b.att.val : 0, giu = b.debole ? b.debole.val : 0;
    const att = x.att * (x.f || 1) * (1 + su / 100) * (1 - giu / 100);
    return { att: Math.round(att * 10) / 10, dif: Math.round(x.dif * 10) / 10, vel: x.vel, mod: su - giu };
  }
  function rettangoloTondo(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  // Piccole icone disegnate: spada (attacco), scudo (difesa), fulmine (velocità)
  function icona(g, tipo, cx, cy, col) {
    g.save(); g.translate(cx, cy); g.fillStyle = col; g.strokeStyle = col; g.lineCap = "round"; g.lineJoin = "round";
    if (tipo === "att") { g.lineWidth = 5; g.beginPath(); g.moveTo(-11, 11); g.lineTo(11, -11); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(-10, 2); g.lineTo(-2, 10); g.stroke(); g.beginPath(); g.moveTo(-13, 13); g.lineTo(-9, 9); g.stroke(); }
    if (tipo === "dif") { g.beginPath(); g.moveTo(0, -14); g.lineTo(12, -9); g.lineTo(11, 3); g.quadraticCurveTo(8, 11, 0, 15); g.quadraticCurveTo(-8, 11, -11, 3); g.lineTo(-12, -9); g.closePath(); g.fill(); }
    if (tipo === "vel") { g.beginPath(); g.moveTo(3, -15); g.lineTo(-9, 2); g.lineTo(-1, 2); g.lineTo(-4, 15); g.lineTo(9, -3); g.lineTo(1, -3); g.closePath(); g.fill(); }
    g.restore();
  }

  // Sprite con un simbolo o una parola (per monete, corone, "HA!", ecc.)
  const cacheGlifi = {};
  function glifo(testo, colore, dim = .4) {
    const k = testo + colore;
    if (!cacheGlifi[k]) cacheGlifi[k] = texTesto(testo, colore, 72);
    const { tex, aspect } = cacheGlifi[k];
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    s.scale.set(dim * aspect, dim, 1);
    return s;
  }

  class Arena extends Base {
    constructor(contenitore, opz = {}) {
      super(contenitore);
      this.opz = opz;
      this.fx = opz.schermo || null;     // livello DOM per gli effetti a schermo
      const s = this.scena;
      s.fog = new T.Fog(0x0d0a0c, 13, 34);
      this.ambiente = new T.AmbientLight(0xffffff, .5); s.add(this.ambiente);
      const rossa = new T.PointLight(0xff2e46, 2.4, 16); rossa.position.set(3, 3, -3); s.add(rossa);
      const ciano = new T.PointLight(0x3fd8ff, 1.8, 16); ciano.position.set(-3, 3, 3); s.add(ciano);
      const alto = new T.DirectionalLight(0xffffff, .65); alto.position.set(0, 7, 5); s.add(alto);
      this.luci = { rossa, ciano, alto };
      this.flash = new T.PointLight(0xffffff, 0, 14); this.flash.position.set(0, 3, 0); s.add(this.flash);
      // pavimento: niente calcolo delle luci su ogni pixel (era la parte più pesante), solo colore e pozze di luce finte
      const pav = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshBasicMaterial({ color: 0x120d11 }));
      pav.rotation.x = -Math.PI / 2; s.add(pav);
      this.pavimento = pav;
      this.pozze = [0xff2e46, 0x3fd8ff, 0xffffff].map((col, k) => {
        const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: puntino(), color: col, transparent: true, opacity: k === 2 ? .1 : .32, blending: T.AdditiveBlending, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.y = .004; m.scale.setScalar(k === 2 ? 12 : 9); m.renderOrder = -1; s.add(m); return m;
      });
      const griglia = new T.GridHelper(60, 84, 0xff2e46, 0x3a1820);
      griglia.material.transparent = true; griglia.material.opacity = .3; griglia.position.y = .002; s.add(griglia);
      this.griglia = griglia;
      this.pedane = [0, 1].map(l => {
        const p = new T.Mesh(new T.CylinderGeometry(.7, .74, .05, 48), new T.MeshStandardMaterial({ color: 0x1d151b, emissive: l ? 0x5a1020 : 0x103a48, emissiveIntensity: .7, metalness: .5, roughness: .4 }));
        const anello = new T.Mesh(new T.TorusGeometry(.72, .016, 8, 64), new T.MeshBasicMaterial({ color: l ? 0xff2e46 : 0x3fd8ff }));
        anello.rotation.x = Math.PI / 2; anello.position.y = .03; p.add(anello);
        const onda = new T.Mesh(new T.RingGeometry(.7, .78, 48), new T.MeshBasicMaterial({ color: l ? 0xff2e46 : 0x3fd8ff, transparent: true, opacity: .5, side: T.DoubleSide, depthWrite: false }));
        onda.rotation.x = -Math.PI / 2; onda.position.y = .035; p.add(onda);
        p.userData.onda = onda;
        s.add(p); return p;
      });
      // pulviscolo che sale lento (rosso e azzurro): la scena non è mai ferma
      this.pulviscolo = [0xff2e46, 0x3fd8ff, 0xf2c14e].map((col, k) => {
        const n = imp.qualita === "bassa" ? 25 : 70, geo = new T.BufferGeometry(), arr = new Float32Array(n * 3);
        for (let q = 0; q < n; q++) { arr[q * 3] = (Math.random() - .5) * 18; arr[q * 3 + 1] = Math.random() * 6; arr[q * 3 + 2] = (Math.random() - .5) * 12 - 1; }
        geo.setAttribute("position", new T.BufferAttribute(arr, 3));
        const pts = new T.Points(geo, new T.PointsMaterial({ map: puntino(), color: col, size: k === 2 ? .05 : .08, transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false }));
        s.add(pts); return pts;
      });
      this.deriva = V(0, 0, 0);
      this.punta = V(0, 0, 0);
      this.lati = [[], []];        // per lato: [{ gruppo, carta, targa, id, i }]
      this.attivoIdx = [0, 0];
      this.stato = [{}, {}];
      this.extra = [{}, {}];
      this.adattaCamera();

      this.aggiornatori.push((t, dt) => {
        const k = 1 - Math.exp(-dt * 8);
        for (const l of [0, 1]) this.lati[l].forEach((u, i) => {
          if (u.occupata) { if (performance.now() - u.occupataDa() < 6000 / imp.velocita) return; u.occupata = false; u.gruppo.rotation.z = 0; }
          const attiva = i === this.attivoIdx[l];
          const p = attiva ? this.posAttiva(l) : this.posPanchina(l, i);
          const sc = attiva ? this.L.scalaAtt[l] : this.L.scalaPan;
          u.gruppo.scale.lerp(V(sc, sc, sc), k);
          u.targa.scale.setScalar(attiva ? 1 : 1.02);
          u.targa.rotation.x = this.inclina * .9;
          if (u.pv <= 0) { u.gruppo.position.lerp(V(p.x, .06, p.z), k); u.gruppo.rotation.set(-Math.PI / 2, 0, 0); return; }
          const respiro = Math.sin(t * 1.6 + i + l * 2);
          u.gruppo.position.lerp(V(p.x, p.y + respiro * (attiva ? .07 : .03), p.z), k);
          u.gruppo.rotation.x = this.inclina + (attiva ? Math.sin(t * 1.1 + l) * .035 : 0);
          u.gruppo.rotation.y = (attiva ? (l ? -.24 : .24) : (l ? -.12 : .12)) + Math.sin(t * .8 + i) * (attiva ? .07 : .03);
          u.gruppo.rotation.z = attiva ? Math.sin(t * 1.3 + l * 1.7) * .03 : 0;
          const st = attiva ? this.stato[l] : {};
          const op = st.nebbia ? .35 : 1;
          u.carta.userData.materiali.forEach(m => { m.transparent = op < 1; m.opacity = op; });
          if (attiva && st.brucia && Math.random() < dt * 14) this.esplosione(u.gruppo.position.clone().add(V((Math.random() - .5) * .8, -.4, 0)), 0xff7a45, 3, { velocita: .5, su: 2, gravita: -.6, durata: 700, dimensione: .09 });
        });
        for (const l of [0, 1]) {
          const u = this.attiva(l);
          const sc = this.extra[l].scudo;
          if (sc) { sc.visible = !!this.stato[l].scudo && !!u && u.pv > 0; if (u) sc.position.copy(u.gruppo.position); sc.rotation.y += dt * .6; sc.material.opacity = .18 + Math.sin(t * 3) * .06; }
          const st = this.extra[l].stelle;
          if (st) { st.visible = !!this.stato[l].stordito && !!u; if (u) { st.position.copy(u.gruppo.position); st.position.y += .9; } st.rotation.y += dt * 3; }
          // onda che si allarga dalla pedana
          const onda = this.pedane[l].userData.onda, mio = this.turnoDi === l, f = (t * (mio ? 1.4 : .6) + l * .5) % 1;
          onda.scale.setScalar(1 + f * (mio ? 2.2 : 1.6)); onda.material.opacity = (mio ? .9 : .4) * (1 - f);
          this.pedane[l].material.emissiveIntensity = mio ? 1.4 + Math.sin(t * 6) * .4 : .5;
        }
        // telecamera che respira, luci che girano, pavimento che scorre, pulviscolo che sale
        this.deriva.set(Math.sin(t * .23) * .35, Math.sin(t * .31) * .15, Math.cos(t * .19) * .25);
        this.luci.rossa.intensity = (this._luceBase ?? 2.4) + Math.sin(t * 2.3) * .3;
        this.luci.rossa.position.set(3 + Math.sin(t * .5) * 2, 3, -3 + Math.cos(t * .5) * 1.5);
        this.luci.ciano.position.set(-3 + Math.cos(t * .4) * 2, 3, 3 + Math.sin(t * .4) * 1.5);
        this.pozze[0].position.set(this.luci.rossa.position.x, .004, this.luci.rossa.position.z);
        this.pozze[1].position.set(this.luci.ciano.position.x, .004, this.luci.ciano.position.z);
        this.pozze[2].material.opacity = .08 + this.flash.intensity * .03;
        this.griglia.position.z = (t * .25) % (60 / 84);
        this.pulviscolo.forEach((pts, q) => {
          const a = pts.geometry.attributes.position.array;
          for (let n = 0; n < a.length; n += 3) { a[n + 1] += dt * (.25 + q * .1); a[n] += Math.sin(t + n) * dt * .1; if (a[n + 1] > 6) a[n + 1] = 0; }
          pts.geometry.attributes.position.needsUpdate = true;
        });
      });
      for (const l of [0, 1]) {
        const sc = new T.Mesh(new T.IcosahedronGeometry(.95, 1), new T.MeshBasicMaterial({ color: 0x3fd8ff, wireframe: true, transparent: true, opacity: .2 }));
        sc.visible = false; this.scena.add(sc); this.extra[l].scudo = sc;
        const g = new T.Group();
        for (let i = 0; i < 3; i++) { const sp = aloneSprite(0xffe066, .22); const a = i / 3 * Math.PI * 2; sp.position.set(Math.cos(a) * .35, 0, Math.sin(a) * .35); g.add(sp); }
        g.visible = false; this.scena.add(g); this.extra[l].stelle = g;
      }
      this.ray = new T.Raycaster();
      this._tocco = ev => {
        if (!this.opz.onTocco) return;
        const r = this.r.domElement.getBoundingClientRect();
        this.ray.setFromCamera(new T.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), this.cam);
        const hit = this.ray.intersectObjects(this.lati[0].map(u => u.carta), false)[0];
        if (hit) this.opz.onTocco(0, hit.object.userData.i);
      };
      this.r.domElement.addEventListener("pointerdown", this._tocco);
    }

    // Disposizione in diagonale: la tua squadra in basso a sinistra, quella avversaria in alto a destra.
    // I punti sono in coordinate dello schermo (da −1 a 1) e indicano dove la carta "poggia i piedi":
    // li proietto sul pavimento, così la disposizione resta giusta con qualsiasi forma dello schermo.
    adattaCamera() {
      const a = this.cam.aspect || 1;
      // "pieno": il campo copre tutto lo schermo e i comandi stanno sopra, in basso a destra
      const pieno = this.box.clientHeight >= (window.innerHeight || 0) * .85 && a >= 1.2;
      // punti = centro della carta sullo schermo (da −1 a 1)
      const cop = Math.max(0, Math.min(.7, this.copertura || 0)), alto = pieno || (a < 1.2 && this.box.clientHeight >= (window.innerHeight || 0) * .85);
      // telefono in verticale a tutto schermo: le carte stanno nella parte libera sopra i comandi.
      // (u, v): u da −1 a 1 in orizzontale, v da 0 (in alto) a 1 (dove iniziano i comandi)
      const libero = ([u, v]) => [u, 1 - 2 * v * (1 - cop)];
      this.L = alto && a < 1.2
        ? { att: [libero([-.42, .69]), libero([.5, .42])], pan: [[[-.86, .415], [-.63, .415], [-.4, .415], [-.17, .415]].map(libero), [[.2, .16], [.39, .16], [.58, .16], [.77, .16]].map(libero)],
            scalaAtt: [1, 1.08], scalaPan: .42, dist: 9.6 * Math.max(.8, Math.min(1.15, (1 - cop) / .62)), elev: .72 }
        : pieno
        ? { att: [[-.24, -.33], [.25, .48]], pan: [[[-.88, -.46], [-.74, -.46], [-.6, -.46], [-.46, -.46]], [[.46, .67], [.6, .67], [.74, .67], [.88, .67]]],
            scalaAtt: [1, 1.12], scalaPan: .55, dist: 9.4, elev: .62 }
        : a >= 1.25
        ? { att: [[-.55, -.22], [.55, .32]], pan: [[[-.25, -.55], [-.08, -.55], [.09, -.55], [.26, -.55]], [[-.26, .62], [-.09, .62], [.08, .62], [.25, .62]]],
            scalaAtt: [1, 1.1], scalaPan: .5, dist: 8.4, elev: .66 }
        : { att: [[-.42, -.4], [.55, .24]], pan: [[[-.88, .14], [-.66, .14], [-.44, .14], [-.22, .14]], [[.24, .66], [.43, .66], [.62, .66], [.81, .66]]],
            scalaAtt: [1, 1], scalaPan: .46, dist: 8.6, elev: .72 };
      const dir = V(0, Math.sin(this.L.elev), Math.cos(this.L.elev));
      this.guarda = V(0, .2, 0);
      this.camBase = this.guarda.clone().addScaledVector(dir, this.L.dist / Math.max(.75, Math.min(1, a)));
      this.inclina = -this.L.elev * .55;
      this.cam.position.copy(this.camBase); this.cam.lookAt(this.guarda);
      this.cam.updateMatrixWorld(); this.cam.updateProjectionMatrix();
      // dal punto sullo schermo al punto nello spazio, all'altezza a cui fluttua la carta
      const punto = ([nx, ny], h) => {
        const d = V(nx, ny, .5).unproject(this.cam).sub(this.cam.position).normalize();
        const t = d.y < -.01 ? (h - this.cam.position.y) / d.y : 30;
        return this.cam.position.clone().addScaledVector(d, Math.min(t, 30));
      };
      this.hAtt = this.L.scalaAtt.map(k => 1.16 * k + .08);
      this.hPan = 1.16 * this.L.scalaPan * 1.15 + .04;
      this.P = { att: this.L.att.map((q, l) => punto(q, this.hAtt[l])), pan: this.L.pan.map(r => r.map(q => punto(q, this.hPan))) };
      if (this.pedane) this.pedane.forEach((p, l) => { p.position.set(this.P.att[l].x, .025, this.P.att[l].z); const k = this.L.scalaAtt[l]; p.scale.set(k, 1, k); });
    }
    impostaCopertura(fr) { if (Math.abs((this.copertura || 0) - fr) < .02) return; this.copertura = fr; this.adattaCamera(); this.cam.updateProjectionMatrix(); }
    posAttiva(l) { return this.P.att[l].clone(); }
    posPanchina(l, i) {
      const altri = (this.lati[l].length ? this.lati[l].map((_, k) => k) : [0, 1, 2, 3, 4]).filter(k => k !== this.attivoIdx[l]);
      const r = Math.max(0, altri.indexOf(i));
      return this.P.pan[l][Math.min(r, 3)].clone();
    }
    attiva(l) { return this.lati[l][this.attivoIdx[l]]; }
    pos(l) { const u = this.attiva(l); return u ? u.gruppo.position.clone() : this.posAttiva(l); }
    // punto sullo schermo (in pixel della pagina) sopra la carta in campo di un lato: serve alle reazioni
    puntoSchermo(l, su = .35) {
      const k = (this.L && this.L.scalaAtt && this.L.scalaAtt[l]) || 1;
      const p = this.pos(l).add(V(0, su * k, 0)).project(this.cam), r = this.r.domElement.getBoundingClientRect();
      if (p.z > 1) return null;
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
    }

    async _creaUnita(l, i, x) {
      const carta = creaCarta(await texFronte(x.c, x.liv, x.lode, x.olo, x.ultra, x.stelle, x.cc), texRetro(), x.c.rarita);
      carta.userData.i = i;
      const gruppo = new T.Group();
      gruppo.add(carta);
      // targa sotto la carta: barra dei PV e statistiche (attacco, difesa, velocità)
      const cv = document.createElement("canvas"); cv.width = 384; cv.height = 124;
      const tex = nuovaTexture(cv);
      const targa = new T.Mesh(new T.PlaneGeometry(1.14, 1.14 * 124 / 384), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      targa.position.set(0, -.92, .03);
      tieni(targa.geometry); tieni(targa.material); tieni(tex);
      targa.renderOrder = 2;
      gruppo.add(targa);
      // entra in scena volando dal proprio angolo
      gruppo.position.set(l ? 9 : -9, 2, l ? -6 : 5);
      this.scena.add(gruppo);
      const u = { gruppo, carta, targa, cv, tex, id: x.id, i, pv: x.pv, pvMax: x.pvMax, stat: statVisibili(x) };
      // segno quando una carta diventa "occupata" (un'animazione la sta muovendo): se resta così troppo a lungo
      // (animazione interrotta, due animazioni sovrapposte), il ciclo qui sotto la libera e lei torna al suo posto
      let occ = false, occDa = 0;
      Object.defineProperty(u, "occupata", { get: () => occ, set: v => { occ = !!v; occDa = occ ? performance.now() : 0; }, enumerable: true });
      u.occupataDa = () => occDa;
      this._targa(u);
      return u;
    }
    _barra(u) { this._targa(u); }
    _targa(u) {
      const st = u.stat || {}, chiave = [u.pv, u.pvMax, st.att, st.dif, st.vel, st.mod].join("|");
      if (u._chiave === chiave) return;
      u._chiave = chiave;
      const g = u.cv.getContext("2d"), W = 384, H = 124, p = Math.max(0, u.pv / u.pvMax);
      g.clearRect(0, 0, W, H);
      rettangoloTondo(g, 2, 2, W - 4, H - 4, 18); g.fillStyle = "rgba(10,8,10,.88)"; g.fill();
      g.lineWidth = 2; g.strokeStyle = "rgba(255,255,255,.14)"; g.stroke();
      // PV
      rettangoloTondo(g, 14, 12, W - 28, 32, 10); g.fillStyle = "#26171c"; g.fill();
      if (p > 0) { rettangoloTondo(g, 14, 12, Math.max(20, (W - 28) * p), 32, 10); g.fillStyle = p < .25 ? "#ff2e46" : p < .55 ? "#f2c14e" : "#4fd38a"; g.fill(); }
      g.font = '700 24px "Barlow Semi Condensed", "Arial Narrow", sans-serif'; g.textAlign = "right"; g.textBaseline = "middle";
      g.lineWidth = 4; g.strokeStyle = "rgba(0,0,0,.75)"; const pv = `${Math.max(0, u.pv)}/${u.pvMax}`;
      g.strokeText(pv, W - 22, 29); g.fillStyle = "#fff"; g.fillText(pv, W - 22, 29);
      // statistiche
      const celle = [["att", st.att, "#ff8a5c"], ["dif", st.dif, "#6aa8ff"], ["vel", st.vel, "#ffe066"]];
      celle.forEach(([tipo, val, col], k) => {
        const x0 = 14 + k * 120, y = 86;
        icona(g, tipo, x0 + 20, y, col);
        let c = "#f4ece8";
        if (tipo === "att" && st.mod > 0) c = "#6fe3a0"; if (tipo === "att" && st.mod < 0) c = "#ff6b7a";
        g.textAlign = "left"; g.font = '700 38px "Barlow Semi Condensed", "Arial Narrow", sans-serif'; g.fillStyle = c;
        g.fillText(val == null ? "–" : String(val), x0 + 42, y + 2);
      });
      u.targa.material.opacity = u.pv > 0 ? 1 : .45;
      u.tex.needsUpdate = true;
    }

    // Allinea la scena alla battaglia (crea le carte la prima volta)
    async sincronizza(B) {
      for (const l of [0, 1]) {
        const sq = B.lati[l].squadra;
        if (!this.lati[l].length) this.lati[l] = await Promise.all(sq.map((x, i) => this._creaUnita(l, i, x)));
        sq.forEach((x, i) => {
          const u = this.lati[l][i];
          if (x.pv > u.pv && i !== B.lati[l].attivo && x.pv > 0) this.esplosione(u.gruppo.position.clone(), 0x4fd38a, 6, { velocita: .4, su: 2, gravita: -.5, durata: 600, dimensione: .07 });
          u.pv = x.pv; u.pvMax = x.pvMax; u.stat = statVisibili(x); this._barra(u);
        });
        this.attivoIdx[l] = B.lati[l].attivo;
        const a = B.attivo(l);
        this.stato[l] = { nebbia: a.nebbia, scudo: a.scudo, brucia: !!a.stati.brucia, stordito: a.stordito };
      }
    }
    aggiornaPV(B) {
      for (const l of [0, 1]) B.lati[l].squadra.forEach((x, i) => { const u = this.lati[l][i]; if (u) { u.pv = x.pv; u.stat = statVisibili(x); this._barra(u); } });
    }

    // Cambio: la carta dalla panchina vola in campo, quella in campo torna al suo posto
    async entra(l, i) {
      const vecchio = this.attivoIdx[l], u = this.lati[l][i], v = this.lati[l][vecchio];
      if (!u || i === vecchio) return;
      this.attivoIdx[l] = i;
      this.stato[l] = {};
      u.occupata = true; if (v) v.occupata = true;
      const da = u.gruppo.position.clone(), a = this.posAttiva(l);
      const vda = v ? v.gruppo.position.clone() : null, va = this.posPanchina(l, vecchio);
      const s0 = this.L.scalaPan, s1 = this.L.scalaAtt[l];
      await this.anima(650, t => {
        u.gruppo.position.set(lerp(da.x, a.x, t), lerp(da.y, a.y, t) + Math.sin(t * Math.PI) * 1.4, lerp(da.z, a.z, t));
        u.gruppo.rotation.y = t * Math.PI * 2;
        const k = lerp(s0, s1, t); u.gruppo.scale.set(k, k, k);
        if (v && v.pv > 0) {
          v.gruppo.position.set(lerp(vda.x, va.x, t), lerp(vda.y, va.y, t) + Math.sin(t * Math.PI) * .6, lerp(vda.z, va.z, t));
          const k2 = lerp(s1, s0, t); v.gruppo.scale.set(k2, k2, k2);
        } else if (v) {
          v.gruppo.position.set(lerp(vda.x, va.x, t), .06, lerp(vda.z, va.z, t));
          const k2 = lerp(s1, s0, t); v.gruppo.scale.set(k2, k2, k2);
        }
      }, easing.inOut);
      u.occupata = false; if (v) v.occupata = false;
      this.esplosione(V(a.x, .1, a.z), l ? 0xff2e46 : 0x3fd8ff, 36, { velocita: 2, su: .4, gravita: 1, dimensione: .1 });
    }

    // ---------------- Mattoncini per le animazioni ----------------
    _u(l) { return this.attiva(l); }
    async scatto(l, { k = .78, andata = 190, ritorno = 300, ruota = .35, colore = null } = {}) {
      const u = this._u(l); if (!u) return;
      u.occupata = true;
      const p0 = u.gruppo.position.clone(), verso = this.pos(1 - l).sub(p0).multiplyScalar(k);
      await this.anima(andata, t => { u.gruppo.position.copy(p0).addScaledVector(verso, t); u.gruppo.rotation.z = (l ? 1 : -1) * ruota * t; }, easing.in);
      if (colore) this.esplosione(p0.clone().add(verso), colore, 24, { velocita: 2.2 });
      this.anima(ritorno, t => { u.gruppo.position.copy(p0).addScaledVector(verso, 1 - t); u.gruppo.rotation.z = (l ? 1 : -1) * ruota * (1 - t); }, easing.out).then(() => { u.occupata = false; });
      await this.attendi(60);
    }
    async salto(l, { h = 1.4, dur = 560, giri = 1, sulBersaglio = true, colore = 0xffffff } = {}) {
      const u = this._u(l); if (!u) return;
      u.occupata = true;
      const p0 = u.gruppo.position.clone(), arrivo = sulBersaglio ? this.pos(1 - l).lerp(p0, .3) : p0.clone();
      await this.anima(dur, t => {
        u.gruppo.position.set(lerp(p0.x, arrivo.x, t), p0.y + Math.sin(t * Math.PI) * h, lerp(p0.z, arrivo.z, t));
        u.gruppo.rotation.x = this.inclina - t * Math.PI * 2 * giri;
      }, easing.inOut);
      this.ondaTerra(V(arrivo.x, .05, arrivo.z), colore, 3);
      this.scossa = Math.max(this.scossa, .12);
      await this.anima(260, t => { u.gruppo.position.lerpVectors(arrivo, p0, t); }, easing.out);
      u.occupata = false;
    }
    async teletrasporto(l, { colore = 0x9aa3ad, dietro = true } = {}) {
      const u = this._u(l); if (!u) return null;
      u.occupata = true;
      const p0 = u.gruppo.position.clone();
      this.esplosione(p0, colore, 30, { velocita: 1.2, su: 1, gravita: -.3, durata: 700 });
      const mats = u.carta.userData.materiali;
      await this.anima(180, t => mats.forEach(m => { m.transparent = true; m.opacity = 1 - t; }));
      const d = this.pos(1 - l), dove = V(d.x + (l ? -.8 : .8), d.y, d.z + (dietro ? (l ? .7 : -.7) : (l ? -.5 : .5)));
      u.gruppo.position.copy(dove);
      this.esplosione(dove, colore, 30, { velocita: 1.2, su: 1, gravita: -.3, durata: 700 });
      await this.anima(160, t => mats.forEach(m => { m.opacity = t; }));
      let tornata = false;
      const torna = async () => {
        if (tornata) return; tornata = true;
        await this.anima(150, t => mats.forEach(m => { m.opacity = 1 - t; }));
        u.gruppo.position.copy(p0);
        await this.anima(150, t => mats.forEach(m => { m.opacity = t; }));
        mats.forEach(m => { m.transparent = false; m.opacity = 1; });
        u.occupata = false;
      };
      // nov 2026: tante mosse si teletrasportavano dietro al nemico e non chiamavano mai torna(): la carta restava lì.
      // Ora attacco() riporta indietro, a fine mossa, ogni carta che è ancora dall'altra parte.
      (this._daTornare = this._daTornare || []).push(torna);
      return { u, p0, torna };
    }
    async proiettile(da, a, { colore = 0xffffff, dim = .5, arco = .5, dur = 420, scia = true, simbolo = null, ruota = 0, ritorno = false } = {}) {
      const corpo = simbolo ? glifo(simbolo, "#" + colore.toString(16).padStart(6, "0"), dim) : aloneSprite(colore, dim);
      if (!simbolo) corpo.add(aloneSprite(0xffffff, .45));
      this.scena.add(corpo);
      const vola = (p, q, d) => this.anima(d, t => {
        corpo.position.set(lerp(p.x, q.x, t), lerp(p.y, q.y, t) + Math.sin(t * Math.PI) * arco, lerp(p.z, q.z, t));
        if (ruota) corpo.material.rotation += ruota;
        if (scia && Math.random() < .8) this.esplosione(corpo.position.clone(), colore, 2, { velocita: .3, gravita: 0, durata: 380, dimensione: .08 });
      }, easing.inOut);
      await vola(da, a, dur);
      this.esplosione(a.clone(), colore, 20, { velocita: 2 });
      if (ritorno) await vola(a, da, dur * .8);
      this.scena.remove(corpo);
    }
    async raggio(da, a, { colore = 0xffffff, spessore = .12, dur = 520 } = {}) {
      const dist = da.distanceTo(a);
      const mat = new T.MeshBasicMaterial({ color: colore, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false });
      const nucleoM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false });
      const fascio = new T.Mesh(new T.CylinderGeometry(spessore, spessore, dist, 16, 1, true), mat);
      const nucleo = new T.Mesh(new T.CylinderGeometry(spessore * .35, spessore * .35, dist, 8, 1, true), nucleoM);
      const g = new T.Group(); g.add(fascio, nucleo);
      g.position.copy(da).lerp(a, .5);
      g.quaternion.setFromUnitVectors(V(0, 1, 0), a.clone().sub(da).normalize());
      this.scena.add(g);
      const fine = this.anima(dur, t => {
        const k = t < .2 ? t / .2 : 1 - (t - .2) / .8 * .2;
        g.scale.set(k * (1 + Math.sin(t * 60) * .1), 1, k * (1 + Math.sin(t * 60) * .1));
        mat.opacity = t > .75 ? (1 - t) * 3.6 : .9;
        nucleoM.opacity = mat.opacity;
        if (Math.random() < .6) this.esplosione(a.clone(), colore, 3, { velocita: 1.6 });
      }, easing.lin).then(() => this.scena.remove(g));
      return fine;
    }
    async getto(da, a, { colore = 0xff7a45, dur = 700, densita = 6, dimensione = .16, apertura = .25 } = {}) {
      const dir = a.clone().sub(da);
      const lung = dir.length(); dir.normalize();
      await this.anima(dur, () => {
        for (let k = 0; k < densita; k++) {
          const geo = new T.BufferGeometry(), n = 1;
          geo.setAttribute("position", new T.BufferAttribute(new Float32Array([da.x, da.y, da.z]), 3));
          const v = dir.clone().multiplyScalar(lung * 1.9 * (.7 + Math.random() * .5)).add(V((Math.random() - .5) * apertura * 4, (Math.random() - .5) * apertura * 3, (Math.random() - .5) * apertura * 2));
          const pts = new T.Points(geo, new T.PointsMaterial({ map: puntino(), color: colore, size: dimensione * (.6 + Math.random()), transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
          this.scena.add(pts);
          this.particelle.push({ pts, v: [v], vita: 0, durata: 520, gravita: 0 });
        }
      }, easing.lin);
    }
    fendente(pos, { colore = 0xffffff, rot = Math.random() * Math.PI, scala = 1, dur = 360 } = {}) {
      const arco = new T.Mesh(new T.TorusGeometry(.6 * scala, .035 * scala, 6, 40, Math.PI * .9), new T.MeshBasicMaterial({ color: colore, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      arco.position.copy(pos); arco.position.z += .15;
      arco.rotation.z = rot;
      arco.rotation.x = this.inclina;
      this.scena.add(arco);
      this.esplosione(pos.clone(), colore, 14, { velocita: 2.4 });
      return this.anima(dur, t => { const k = .4 + t * .9; arco.scale.set(k, k, k); arco.rotation.z = rot + t * 1.4; arco.material.opacity = 1 - t; }).then(() => this.scena.remove(arco));
    }
    async fulmine(da, a, { colore = 0x9fd8ff, volte = 3, spessore = 1 } = {}) {
      for (let v = 0; v < volte; v++) {
        const punti = [];
        const passi = 10;
        for (let k = 0; k <= passi; k++) {
          const t = k / passi, p = da.clone().lerp(a, t);
          if (k > 0 && k < passi) p.add(V((Math.random() - .5) * .5, (Math.random() - .5) * .3, (Math.random() - .5) * .4));
          punti.push(p);
        }
        const geo = new T.BufferGeometry().setFromPoints(punti);
        const linea = new T.Line(geo, new T.LineBasicMaterial({ color: colore, transparent: true, blending: T.AdditiveBlending, linewidth: spessore }));
        const alone = new T.Line(geo, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7 }));
        this.scena.add(linea, alone);
        this.flash.color.setHex(colore); this.flash.position.copy(a); this.flash.intensity = 5;
        this.esplosione(a.clone(), colore, 18, { velocita: 2.4 });
        await this.attendi(70);
        this.scena.remove(linea, alone); geo.dispose();
        this.flash.intensity = 0;
        await this.attendi(50);
      }
    }
    ondaTerra(pos, colore = 0xffffff, quanto = 5) {
      const anello = new T.Mesh(new T.RingGeometry(.2, .3, 64), new T.MeshBasicMaterial({ color: colore, transparent: true, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }));
      anello.rotation.x = -Math.PI / 2; anello.position.set(pos.x, .05, pos.z); this.scena.add(anello);
      return this.anima(700, t => { const k = 1 + t * quanto; anello.scale.set(k, k, k); anello.material.opacity = 1 - t; }).then(() => this.scena.remove(anello));
    }
    colonna(pos, colore = 0xffffff, { alt = 4, larg = .45, dur = 900 } = {}) {
      const m = new T.MeshBasicMaterial({ color: colore, transparent: true, opacity: .0, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
      const c = new T.Mesh(new T.CylinderGeometry(larg, larg * 1.2, alt, 24, 1, true), m);
      c.position.set(pos.x, alt / 2, pos.z);
      this.scena.add(c);
      return this.anima(dur, t => { m.opacity = Math.sin(t * Math.PI) * .7; c.scale.set(1 + t * .3, .2 + t * .8, 1 + t * .3); c.rotation.y += .05; }, easing.lin).then(() => this.scena.remove(c));
    }
    simboli(pos, testo, colore, { n = 6, dim = .35, velocita = 1.6, su = 1.2, durata = 900, verso = null } = {}) {
      for (let k = 0; k < n; k++) {
        const s = glifo(testo, colore, dim * (.7 + Math.random() * .6));
        s.position.copy(pos);
        this.scena.add(s);
        const v = verso ? verso.clone().sub(pos).multiplyScalar(1 / (durata / 1000)).add(V((Math.random() - .5), (Math.random() - .2) * 1.5, (Math.random() - .5)))
          : V((Math.random() - .5) * velocita * 2, (.5 + Math.random()) * su, (Math.random() - .5) * velocita);
        const p0 = pos.clone();
        setTimeout(() => this.anima(durata, (t, raw) => {
          s.position.set(p0.x + v.x * raw * durata / 1000, p0.y + v.y * raw * durata / 1000 - (verso ? 0 : raw * raw * 1.2), p0.z + v.z * raw * durata / 1000);
          s.material.opacity = 1 - Math.max(0, raw - .6) / .4;
          s.material.rotation = raw * (k % 2 ? 2 : -2);
        }, easing.lin).then(() => this.scena.remove(s)), k * 50);
      }
      return this.attendi(durata * .6);
    }
    pioggia(pos, { colore = 0xffffff, testo = null, n = 18, dur = 900, larg = 1.4 } = {}) {
      for (let k = 0; k < n; k++) {
        setTimeout(() => {
          const s = testo ? glifo(testo, "#" + colore.toString(16).padStart(6, "0"), .35) : aloneSprite(colore, .35);
          const x = pos.x + (Math.random() - .5) * larg * 2, z = pos.z + (Math.random() - .5) * larg;
          s.position.set(x, 4.5, z); this.scena.add(s);
          this.anima(420 + Math.random() * 200, t => { s.position.y = lerp(4.5, pos.y - .3, t); }, easing.in).then(() => {
            this.scena.remove(s); this.esplosione(V(x, pos.y - .3, z), colore, 6, { velocita: 1.2, su: .6 });
          });
        }, (k / n) * dur);
      }
      return this.attendi(dur + 300);
    }
    orbita(l, { colore = 0xffffff, testo = null, n = 5, dur = 1000, raggio = .8 } = {}) {
      const g = new T.Group(); g.position.copy(this.pos(l)); this.scena.add(g);
      for (let k = 0; k < n; k++) {
        const s = testo ? glifo(testo, "#" + colore.toString(16).padStart(6, "0"), .3) : aloneSprite(colore, .3);
        const a = k / n * Math.PI * 2; s.position.set(Math.cos(a) * raggio, (k % 2) * .3 - .15, Math.sin(a) * raggio); g.add(s);
      }
      return this.anima(dur, t => { g.rotation.y = t * Math.PI * 4; const k = Math.sin(t * Math.PI); g.scale.set(k, k, k); }, easing.lin).then(() => this.scena.remove(g));
    }
    async cloni(l, { n = 2, colore = 0x4fd38a, dur = 600, carica = false } = {}) {
      const u = this._u(l); if (!u) return;
      const copie = [];
      for (let k = 0; k < n; k++) {
        const c = u.carta.clone();
        c.material = u.carta.material.map(m => { const q = m.clone(); q.userData = Object.assign({}, q.userData, { tieni: false }); q.transparent = true; q.opacity = .5; return q; });
        const g = new T.Group(); g.add(c); g.position.copy(u.gruppo.position); g.rotation.copy(u.gruppo.rotation);
        this.scena.add(g); copie.push(g);
      }
      const p0 = u.gruppo.position.clone(), d = this.pos(1 - l);
      await this.anima(dur * .45, t => copie.forEach((g, k) => { g.position.x = p0.x + (k - (n - 1) / 2 || .5) * 1.3 * t * (k % 2 ? -1 : 1); }));
      if (carica) {
        await this.anima(dur * .4, t => copie.forEach(g => { g.position.lerp(d, t * .3); }), easing.in);
        copie.forEach(g => this.esplosione(g.position.clone(), colore, 14, { velocita: 2 }));
      } else await this.attendi(dur * .3);
      await this.anima(200, t => copie.forEach(g => g.children[0].material.forEach(m => { m.opacity = .5 * (1 - t); })));
      copie.forEach(g => this.scena.remove(g));
    }
    linea(da, a, colore, { dur = 600, spessore = .025, onde = 0 } = {}) {
      const curva = new T.CatmullRomCurve3([da, da.clone().lerp(a, .5).add(V(0, .5 + onde, 0)), a]);
      const tubo = new T.Mesh(new T.TubeGeometry(curva, 30, spessore, 6, false), new T.MeshBasicMaterial({ color: colore, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
      this.scena.add(tubo);
      return this.anima(dur, t => { tubo.material.opacity = t < .8 ? 1 : (1 - t) * 5; }, easing.lin).then(() => this.scena.remove(tubo));
    }
    async ragnatela(da, a, colore = 0xffffff) {
      const fili = [];
      for (let k = 0; k < 6; k++) fili.push(this.linea(da, a.clone().add(V((Math.random() - .5) * .9, (Math.random() - .5) * .9, 0)), colore, { dur: 800, spessore: .012 }));
      const rete = new T.Mesh(new T.CircleGeometry(.7, 8), new T.MeshBasicMaterial({ color: colore, wireframe: true, transparent: true, opacity: .8 }));
      rete.position.copy(a); rete.position.z += .1; rete.rotation.x = this.inclina; this.scena.add(rete);
      this.anima(900, t => { rete.scale.setScalar(.2 + t * .9); rete.material.opacity = t > .7 ? (1 - t) * 2.6 : .8; }).then(() => this.scena.remove(rete));
      await Promise.all(fili);
    }
    async missili(da, a, { n = 4, colore = 0xff7a45, dur = 520 } = {}) {
      const voli = [];
      for (let k = 0; k < n; k++) voli.push(this.attendi(k * 90).then(() => this.proiettile(da.clone().add(V((k - n / 2) * .2, .2, 0)), a.clone().add(V((Math.random() - .5) * .6, (Math.random() - .5) * .4, 0)), { colore, dim: .3, arco: .8 + k * .25, dur })));
      await Promise.all(voli);
    }
    crescita(l, { scala = 1.3, dur = 600, colore = 0xff2e46 } = {}) {
      const u = this._u(l); if (!u) return this.attendi(10);
      u.occupata = true;
      this.esplosione(u.gruppo.position.clone(), colore, 30, { velocita: 1.5, su: 1.6, gravita: -.4 });
      return this.anima(dur, t => { const k = 1 + Math.sin(t * Math.PI) * (scala - 1); u.gruppo.scale.set(k, k, k); }, easing.inOut).then(() => { u.occupata = false; });
    }
    async vortice(l, { giri = 3, dur = 700, colore = 0xffffff } = {}) {
      const u = this._u(l); if (!u) return;
      u.occupata = true;
      await this.anima(dur, t => { u.gruppo.rotation.y = t * Math.PI * 2 * giri; if (Math.random() < .5) this.esplosione(u.gruppo.position.clone(), colore, 2, { velocita: 1.5, gravita: 0, durata: 500 }); }, easing.inOut);
      u.occupata = false;
    }
    luceScena(colore, { intensita = .25, dur = 1200 } = {}) {
      const c0 = new T.Color(0xffffff), c1 = new T.Color(colore);
      const f0 = this.scena.fog.color.clone();
      return this.anima(dur, t => {
        const k = Math.sin(t * Math.PI);
        this.ambiente.color.copy(c0).lerp(c1, k);
        this.ambiente.intensity = lerp(.5, intensita, k);
        this.scena.fog.color.copy(f0).lerp(c1.clone().multiplyScalar(.2), k);
        this._luceBase = lerp(2.2, .6, k);
      }, easing.lin).then(() => { this.ambiente.color.copy(c0); this.ambiente.intensity = .5; this.scena.fog.color.copy(f0); this._luceBase = 2.2; });
    }
    lampo(colore = 0xffffff, forza = 6, pos = null) {
      this.flash.color.setHex(colore); if (pos) this.flash.position.copy(pos); else this.flash.position.set(0, 3, 0);
      return this.anima(380, t => { this.flash.intensity = (1 - t) * forza; });
    }
    async zoom(l, { quanto = .35, dur = 500 } = {}) {
      const base = this.camBase.clone(), p = this.pos(l);
      this._zoom = true;
      await this.anima(dur, t => { this.camBase.copy(base).lerp(p, quanto * t); }, easing.inOut);
      return async () => { await this.anima(400, t => { this.camBase.copy(base).lerp(p, quanto * (1 - t)); }, easing.inOut); this.adattaCamera(); };
    }

    // ---------------- Effetti sullo schermo (livello DOM sopra il 3D) ----------------
    schermo(tipo, dur = 1200) {
      if (!this.fx || ridotto || !imp.effetti) return this.attendi(10);
      dur = dur / imp.velocita;
      const el = document.createElement("div");
      el.className = `fx-schermo fx-${tipo}`;
      el.style.setProperty("--dur", dur + "ms");
      if (tipo === "ragnatela") el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${Array.from({ length: 10 }, (_, k) => `<line x1="50" y1="50" x2="${50 + Math.cos(k / 10 * 6.283) * 80}" y2="${50 + Math.sin(k / 10 * 6.283) * 80}"/>`).join("")}${[10, 20, 32, 46].map(r => `<polygon points="${Array.from({ length: 10 }, (_, k) => `${50 + Math.cos(k / 10 * 6.283) * r},${50 + Math.sin(k / 10 * 6.283) * r}`).join(" ")}"/>`).join("")}</svg>`;
      if (tipo === "crepe") el.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M50 48 L38 30 L30 8 M38 30 L18 26 M50 48 L70 34 L84 12 M70 34 L96 38 M50 48 L56 70 L48 96 M56 70 L78 82 M50 48 L28 60 L4 66 M28 60 L22 86"/></svg>`;
      if (tipo === "tagli") el.innerHTML = `<i></i><i></i><i></i>`;
      if (tipo === "laser") el.innerHTML = Array.from({ length: 7 }, () => "<i></i>").join("");
      if (tipo === "spazio") el.innerHTML = Array.from({ length: 40 }, () => `<b style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * .8}s"></b>`).join("");
      if (tipo === "velocita") el.innerHTML = Array.from({ length: 14 }, () => `<i style="top:${Math.random() * 100}%;animation-delay:${Math.random() * .4}s"></i>`).join("");
      if (tipo === "fiori") el.innerHTML = Array.from({ length: 30 }, () => `<b style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .9}s">${["✿", "❀", "♥"][Math.floor(Math.random() * 3)]}</b>`).join("");
      if (tipo === "ki") el.innerHTML = Array.from({ length: 16 }, () => `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .5}s"></i>`).join("");
      if (tipo === "mare") el.innerHTML = `<i></i><i></i><i></i>`;
      if (tipo === "contagio") el.innerHTML = Array.from({ length: 16 }, () => `<b style="left:${Math.random() * 100}%;height:${20 + Math.random() * 40}%;animation-delay:${Math.random() * .5}s"></b>`).join("");
      if (tipo === "mira") el.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="22"/><circle cx="50" cy="50" r="1.5"/><path d="M50 16 V38 M50 62 V84 M16 50 H38 M62 50 H84"/></svg>`;
      if (tipo === "polvere") el.innerHTML = Array.from({ length: 18 }, () => `<b style="top:${30 + Math.random() * 70}%;width:${30 + Math.random() * 60}px;height:${30 + Math.random() * 60}px;animation-delay:${Math.random() * .6}s"></b>`).join("");
      if (tipo === "festa") el.innerHTML = Array.from({ length: 30 }, () => `<b style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .8}s;background:${["#ff2e46", "#ffd04a", "#2fbf71", "#3fd8ff", "#b866ff"][Math.floor(Math.random() * 5)]}"></b>`).join("");
      if (tipo === "mazzo") el.innerHTML = Array.from({ length: 22 }, () => { const [s, c] = [["♥", "#c82a2a"], ["♦", "#c82a2a"], ["♠", "#1a1a2a"], ["♣", "#1a1a2a"]][Math.floor(Math.random() * 4)]; return `<b style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .8}s;color:${c}">${s}</b>`; }).join("");
      if (tipo === "codice") el.innerHTML = Array.from({ length: 24 }, () => `<b style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .8}s">${Array.from({ length: 6 }, () => Math.random() < .5 ? "0" : "1").join("<br>")}</b>`).join("");
      if (tipo === "pipistrelli") el.innerHTML = Array.from({ length: 18 }, () => `<b style="top:${Math.random() * 80}%;animation-delay:${Math.random() * .6}s;font-size:${1 + Math.random() * 1.4}rem">⌒</b>`).join("");
      if (tipo === "gelo") el.innerHTML = Array.from({ length: 26 }, () => `<b style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .9}s">❄</b>`).join("");
      if (tipo === "note") el.innerHTML = Array.from({ length: 22 }, () => `<b style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .9}s">${["♪", "♫", "♬"][Math.floor(Math.random() * 3)]}</b>`).join("");
      if (tipo === "soldi") el.innerHTML = Array.from({ length: 26 }, () => `<b style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .9}s">$</b>`).join("");
      if (tipo === "disco") el.innerHTML = `<i></i><i></i><i></i>`;
      if (tipo === "corona") el.innerHTML = `<b>♛</b>`;
      if (tipo === "incanto") el.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="36"/>${Array.from({ length: 16 }, (_, k) => `<text x="${50 + Math.cos(k / 16 * 6.283) * 40}" y="${51.5 + Math.sin(k / 16 * 6.283) * 40}" text-anchor="middle" transform="rotate(${k / 16 * 360 + 90} ${50 + Math.cos(k / 16 * 6.283) * 40} ${50 + Math.sin(k / 16 * 6.283) * 40})">${"ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ"[k]}</text>`).join("")}<polygon points="50,14 81,68 19,68"/><polygon points="50,86 19,32 81,32"/></svg>`;
      if (tipo === "marchio") el.innerHTML = `<b>☠</b>`;
      if (tipo === "patrono") el.innerHTML = Array.from({ length: 24 }, () => `<b style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-delay:${Math.random() * .8}s"></b>`).join("");
      if (tipo === "pentacolo") el.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/><polygon points="50,10 73.5,82.4 11.9,37.6 88.1,37.6 26.5,82.4"/></svg>`;
      this.fx.appendChild(el);
      const palco = this.fx.closest(".palco");
      const scuoti = { terremoto: "scuoti-forte", crepe: "scuoti-forte", rosso: "scuoti-medio", tempesta: "scuoti-medio", ubriaco: "ubriaco", specchio: "specchio" }[tipo];
      if (palco && scuoti) { palco.classList.remove(scuoti); void palco.offsetWidth; palco.classList.add(scuoti); setTimeout(() => palco.classList.remove(scuoti), dur); }
      setTimeout(() => el.remove(), dur + 50);
      return this.attendi(80);
    }
    cutin(l, id, nome, colore = "#ff2e46") {
      if (!this.fx || ridotto || !imp.effetti) return this.attendi(10);
      const el = document.createElement("div");
      el.className = `cutin cutin-${l}`;
      el.style.setProperty("--c", colore);
      el.innerHTML = `<div class="cutin-fascia"><img src="${imgCarta(id)}" alt=""><div class="cutin-testo"><small>${l ? "Mossa finale nemica" : "Mossa finale"}</small><b>${nome.replace(/[<>&]/g, "")}</b></div></div>`;
      this.fx.appendChild(el);
      el.style.setProperty("--vel", imp.velocita);
      setTimeout(() => el.remove(), 1400 / imp.velocita);
      return this.attendi(1050);
    }

    // ---------------- Animazione di una mossa ----------------
    async attacco(l, e) {
      const ricetta = MOSSE_FX[`${e.id}:${e.mossa}`];
      // la telecamera si avvicina tra chi attacca e chi subisce (di più per le mosse forti)
      const mezzo = this.pos(l).lerp(this.pos(1 - l), .4), verso = mezzo.sub(this.camBase).multiplyScalar(e.costo >= 5 ? .2 : e.costo >= 2 ? .13 : .09);
      const p0 = this.punta.clone();
      this.anima(300, t => { this.punta.copy(p0).lerp(verso, t); }, easing.out);
      // chi attacca si carica un attimo
      const u = this._u(l);
      if (u && !u.occupata) { u.occupata = true; const sc = u.gruppo.scale.x; await this.anima(140, t => { u.gruppo.scale.set(sc * (1 + .08 * t), sc * (1 - .06 * t), sc); }, easing.out); u.gruppo.scale.setScalar(sc); u.occupata = false; }
      try {
        if (ricetta) await ricetta(this, l, e);
        else await this.generica(l, e);
      } catch (err) { /* un'animazione rotta non deve bloccare la partita */ }
      const resta = this._daTornare || []; this._daTornare = [];
      try { await Promise.all(resta.map(f => f())); } catch (err) { /* idem */ }
      const p1 = this.punta.clone();
      this.anima(600, t => { this.punta.copy(p1).multiplyScalar(1 - t); }, easing.inOut);
    }
    async generica(l, e) {
      const col = COL_STILE[e.stile] || 0xffffff;
      if (!e.pot) { await this.colonna(this.pos(l), col); return; }
      if (e.costo >= 2) await this.proiettile(this.pos(l), this.pos(1 - l), { colore: col, dim: e.costo >= 5 ? .9 : .55 });
      else await this.scatto(l, { colore: col });
    }

    async colpito(l, e) {
      const u = this._u(l);
      if (!u) return;
      const col = e.brucia ? 0xff7a45 : (COL_STILE[e.stile] || 0xffffff);
      const pos = u.gruppo.position.clone();
      this.esplosione(pos, col, e.crit ? 60 : 32, { velocita: e.crit ? 3.4 : 2.4 });
      const testo = (e.crit ? "CRITICO " : "") + "-" + e.danno;
      this.scritta(testo, e.crit ? "#f2c14e" : e.efficace > 1 ? "#ff7a45" : "#f4ece8", pos.clone().add(V(0, .95, .3)), e.crit ? .55 : .42);
      if (e.efficace > 1) this.scritta("Super efficace!", "#ff7a45", pos.clone().add(V(0, .5, .3)), .26, 1000);
      if (e.crit || e.danno > 30) this.scossa = Math.max(this.scossa, e.crit ? .3 : .15);
      u.pv = Math.max(0, u.pv - e.danno); this._barra(u);
      const mF = u.carta.userData.materiali[1];
      const occ = u.occupata; u.occupata = true;
      const p0 = u.gruppo.position.clone(), via = p0.clone().sub(this.pos(1 - l)); via.y = 0; via.normalize().multiplyScalar(e.crit ? .55 : .32);
      const rz0 = u.gruppo.rotation.z;
      await this.anima(420, t => {
        const spinta = t < .2 ? t / .2 : 1 - (t - .2) / .8;
        u.gruppo.position.set(p0.x + via.x * spinta + Math.sin(t * 40) * .05 * (1 - t), p0.y + spinta * .08, p0.z + via.z * spinta);
        u.gruppo.rotation.z = rz0 + (l ? -1 : 1) * .22 * spinta;
        mF.emissive.setHex(t < .5 ? 0xff3344 : 0xffffff);
        mF.emissiveIntensity = .18 + (1 - t) * 1.2;
      }, easing.lin);
      mF.emissiveIntensity = .18; mF.emissive.setHex(0xffffff);
      u.occupata = occ;
    }
    async cura(l, n) {
      const u = this._u(l);
      if (!u) return;
      this.esplosione(u.gruppo.position.clone().add(V(0, -.5, 0)), 0x4fd38a, 30, { velocita: .8, su: 2.5, gravita: -1, durata: 1100, dimensione: .11 });
      this.scritta("+" + n, "#4fd38a", u.gruppo.position.clone().add(V(0, .95, .3)), .4);
      u.pv = Math.min(u.pvMax, u.pv + n); this._barra(u);
      await this.attendi(300);
    }
    async schiva(l) {
      const u = this._u(l);
      if (!u) return;
      u.occupata = true;
      const p0 = u.gruppo.position.clone();
      this.scritta("Mancato!", "#3fd8ff", p0.clone().add(V(0, .95, .3)), .34);
      await this.anima(420, t => { u.gruppo.position.x = p0.x + Math.sin(t * Math.PI) * (l ? .8 : -.8); u.gruppo.rotation.z = Math.sin(t * Math.PI) * .25; }, easing.inOut);
      u.occupata = false;
    }
    async ko(l) {
      const u = this._u(l);
      if (!u) return;
      u.occupata = true;
      const p0 = u.gruppo.position.clone();
      this.scritta("KO", "#ff2e46", p0.clone().add(V(0, .95, .3)), .7, 1300);
      this.scossa = .22;
      await this.anima(650, t => {
        u.gruppo.rotation.x = lerp(this.inclina, -Math.PI / 2, t);
        u.gruppo.position.y = lerp(p0.y, .06, t);
      }, easing.in);
      u.pv = 0; this._barra(u);
      this.esplosione(V(p0.x, .1, p0.z), 0x888888, 30, { velocita: 1.5, su: .3, gravita: 1 });
      u.occupata = false;
    }
    effetto(l, tipo, B) {
      if (B) { const a = B.attivo(l); this.stato[l] = { nebbia: a.nebbia, scudo: a.scudo, brucia: !!a.stati.brucia, stordito: a.stordito }; this.aggiornaPV(B); }
      const u = this._u(l);
      if (!u) return this.attendi(100);
      const pos = u.gruppo.position.clone();
      const colori = { scudo: 0x3fd8ff, nebbia: 0x9aa3ad, energia: 0x3fd8ff, potenzia: 0xff7a45, debole: 0xb866ff, stordito: 0xffe066, brucia: 0xff7a45 };
      const col = colori[tipo] || 0xffffff;
      if (tipo === "energia") { this.ondaTerra(pos, col, 4); this.ondaTerra(pos, col, 2.5); }
      const testi = { potenzia: "Attacco su!", debole: "Indebolito", stordito: "Stordito!", brucia: "Brucia!", scudo: "Scudo", nebbia: "Invisibile", energia: "+Energia" };
      if (testi[tipo]) this.scritta(testi[tipo], "#" + col.toString(16).padStart(6, "0"), pos.clone().add(V(0, 1.0, .3)), .3, 1000);
      this.esplosione(pos.clone().add(V(0, tipo === "debole" ? .4 : -.4, 0)), col, 24, { velocita: .9, su: tipo === "debole" ? -.5 : 2, gravita: tipo === "debole" ? 1.5 : -.8, durata: 900, dimensione: .1 });
      return this.attendi(320);
    }
    vittoria(l) {
      const u = this._u(l);
      if (!u) return;
      for (let i = 0; i < 4; i++) setTimeout(() => this.esplosione(u.gruppo.position.clone().add(V(0, .5, 0)), [0xf2c14e, 0xff2e46, 0x3fd8ff, 0xffffff][i], 50, { velocita: 3, su: 1.4, gravita: 2.5, durata: 1400 }), i * 220);
      this.lati[l].forEach((x, i) => { if (x.pv > 0 && i !== this.attivoIdx[l]) setTimeout(() => this.esplosione(x.gruppo.position.clone(), 0xf2c14e, 16, { velocita: 1.5, su: 1.5 }), 300 + i * 120); });
      u.occupata = true;
      const p0 = u.gruppo.position.clone();
      this.anima(1200, t => { u.gruppo.position.y = p0.y + Math.sin(t * Math.PI) * .5; u.gruppo.rotation.y = t * Math.PI * 2; }, easing.inOut).then(() => { u.occupata = false; });
    }
    // Graffito spruzzato sul pavimento accanto alla pedana di un lato (segue la pedana quando cambia il layout).
    // Se i graffiti si annullano, restano sbiaditi.
    mettiGraffito(l, tela, annullato) {
      if (!this.pedane || !this.pedane[l]) return;
      const tex = nuovaTexture(tela);
      const m = new T.Mesh(new T.PlaneGeometry(2.4, 1.2), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = l ? .14 : -.12;
      m.position.set(l ? -1.45 : 1.4, -.017, l ? .15 : .2);
      m.renderOrder = 1;
      this.pedane[l].add(m);
      // compare come una spruzzata: si allarga e prende colore
      const fine = annullato ? .32 : .95, t0 = performance.now();
      const anima = () => { const k = Math.min(1, (performance.now() - t0) / 700); m.material.opacity = fine * k; m.scale.setScalar(.6 + .4 * (1 - Math.pow(1 - k, 3))); if (k < 1 && m.parent) requestAnimationFrame(anima); };
      requestAnimationFrame(anima);
    }


    // ---------- campo di battaglia: ambiente leggero (poche particelle, nessuna luce in più) ----------
    impostaCampo(id) {
      if (id === this.campo) return;
      this.campo = id;
      const s = this.scena, poche = imp.qualita === "bassa";
      if (this._campo) { s.remove(this._campo.gruppo); this.aggiornatori = this.aggiornatori.filter(f => f !== this._campo.agg); this._campo = null; }
      // colori di base di pavimento, nebbia, luci e pozze (salvati la prima volta)
      if (!this._base) this._base = { pav: this.pavimento.material.color.getHex(), nebbia: s.fog.color.getHex(), amb: this.ambiente.intensity, pozze: this.pozze.map(p => p.material.color.getHex()), griglia: this.griglia.material.opacity };
      const b = this._base;
      this.pavimento.material.color.setHex(b.pav); s.fog.color.setHex(b.nebbia); this.ambiente.intensity = b.amb; this.griglia.material.opacity = b.griglia;
      this.pozze.forEach((p, k) => p.material.color.setHex(b.pozze[k]));
      const g = new T.Group(); g.userData.tieni = false; s.add(g);
      const punti = (n, col, dim, fn) => {
        const geo = new T.BufferGeometry(), arr = new Float32Array(n * 3);
        for (let q = 0; q < n; q++) { const [x, y, z] = fn(q); arr[q * 3] = x; arr[q * 3 + 1] = y; arr[q * 3 + 2] = z; }
        geo.setAttribute("position", new T.BufferAttribute(arr, 3));
        const pts = new T.Points(geo, new T.PointsMaterial({ map: puntino(), color: col, size: dim, transparent: true, opacity: .85, blending: T.AdditiveBlending, depthWrite: false }));
        g.add(pts); return pts;
      };
      const caso = (a, b) => a + Math.random() * (b - a);
      let agg = null;
      if (id === "pioggia") {
        s.fog.color.setHex(0x0a1220); this.pavimento.material.color.setHex(0x0c1420);
        this.pozze.forEach((p, k) => p.material.color.setHex(k === 1 ? 0x5aa9ff : k === 0 ? 0x2a4a80 : 0x9fc8ff));
        // gocce: segmenti corti che cadono in diagonale
        const n = poche ? 90 : 220, geo = new T.BufferGeometry(), arr = new Float32Array(n * 6);
        const pos = [...Array(n)].map(() => [caso(-11, 11), caso(0, 9), caso(-8, 6)]);
        geo.setAttribute("position", new T.BufferAttribute(arr, 3));
        const linee = new T.LineSegments(geo, new T.LineBasicMaterial({ color: 0xcfe3ff, transparent: true, opacity: .75, depthWrite: false }));
        g.add(linee);
        let prossimo = caso(4, 9);
        agg = (t, dt) => {
          for (let q = 0; q < n; q++) {
            const p = pos[q]; p[1] -= dt * 11; p[0] -= dt * 2.2;
            if (p[1] < 0) { p[1] = caso(7, 9); p[0] = caso(-11, 13); p[2] = caso(-8, 5); if (Math.random() < .15) this.esplosione(V(p[0], .05, p[2]), 0x9fc8ff, 2, { velocita: .6, su: 1, gravita: 3, durata: 300, dimensione: .05 }); }
            arr.set([p[0], p[1], p[2], p[0] + .16, p[1] + .7, p[2]], q * 6);
          }
          geo.attributes.position.needsUpdate = true;
          if ((prossimo -= dt) < 0) { prossimo = caso(6, 12); this.flash.color.setHex(0xcfe3ff); this.flash.intensity = 6; this.anima(500, k => { this.flash.intensity = 6 * (1 - k) * (k < .2 || k > .35 ? 1 : .2); }); }
        };
      } else if (id === "notte") {
        s.fog.color.setHex(0x05030c); this.pavimento.material.color.setHex(0x07050e); this.ambiente.intensity = b.amb * .5; this.griglia.material.opacity = b.griglia * .6;
        this.pozze.forEach((p, k) => p.material.color.setHex(k === 2 ? 0xbcc8ff : 0x4a3a9a));
        const stelle = punti(poche ? 80 : 180, 0xdfe6ff, .1, () => [caso(-16, 16), caso(1.5, 8), caso(-14, -4)]);
        const luna = new T.Mesh(new T.CircleGeometry(.9, 32), new T.MeshBasicMaterial({ color: 0xf2f0ff, transparent: true, opacity: .9, fog: false }));
        luna.position.set(-5.5, 4.2, -12); g.add(luna);
        const alone = new T.Mesh(new T.PlaneGeometry(5, 5), new T.MeshBasicMaterial({ map: puntino(), color: 0x9b7bff, transparent: true, opacity: .45, blending: T.AdditiveBlending, depthWrite: false, fog: false }));
        alone.position.copy(luna.position).add(V(0, 0, -.1)); g.add(alone);
        agg = t => { stelle.material.opacity = .6 + Math.sin(t * 2.3) * .25; alone.material.opacity = .38 + Math.sin(t * .8) * .08; };
      } else if (id === "stadio") {
        this.pavimento.material.color.setHex(0x14110a);
        this.pozze.forEach((p, k) => p.material.color.setHex(k === 2 ? 0xfff6c0 : 0xf2c14e));
        // 4 fasci di luce che si muovono piano (coni trasparenti, niente luci vere)
        const fasci = [-1, 1].flatMap(sx => [-1, 1].map(sz => {
          const cono = new T.Mesh(new T.ConeGeometry(1.4, 9, 20, 1, true), new T.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: .14, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
          cono.position.set(sx * 5.5, 4.5, sz * 3 - 3); cono.userData.fase = Math.random() * 6; g.add(cono); return cono;
        }));
        const pubblico = punti(poche ? 80 : 180, 0xf2c14e, .06, () => { const a = caso(0, Math.PI * 2); return [Math.cos(a) * caso(10, 13), caso(.5, 3), Math.sin(a) * caso(8, 10) - 2]; });
        agg = t => {
          fasci.forEach(c => { c.rotation.z = Math.sin(t * .6 + c.userData.fase) * .35 + (c.position.x > 0 ? .4 : -.4); c.rotation.x = Math.cos(t * .5 + c.userData.fase) * .25; c.material.opacity = .12 + Math.sin(t * 1.5 + c.userData.fase) * .04; });
          pubblico.material.opacity = .45 + Math.abs(Math.sin(t * 3)) * .4;   // flash del pubblico
        };
      } else if (id === "lava") {
        s.fog.color.setHex(0x1a0602); this.pavimento.material.color.setHex(0x1c0804);
        this.pozze.forEach((p, k) => p.material.color.setHex(k === 2 ? 0xffb347 : 0xff4a1a));
        // crepe di lava sul pavimento
        for (let k = 0; k < (poche ? 6 : 12); k++) {
          const crepa = new T.Mesh(new T.PlaneGeometry(caso(1, 2.6), caso(.03, .07)), new T.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: .8, blending: T.AdditiveBlending, depthWrite: false }));
          crepa.rotation.x = -Math.PI / 2; crepa.rotation.z = caso(0, Math.PI); crepa.position.set(caso(-9, 9), .006, caso(-8, 1.5)); g.add(crepa);
        }
        const braci = punti(poche ? 50 : 120, 0xff7a2a, .09, () => [caso(-10, 10), caso(0, 6), caso(-8, 4)]);
        const arr = braci.geometry.attributes.position.array;
        agg = (t, dt) => {
          for (let q = 0; q < arr.length; q += 3) { arr[q + 1] += dt * caso(.4, 1.2); arr[q] += Math.sin(t + q) * dt * .2; if (arr[q + 1] > 6) arr[q + 1] = 0; }
          braci.geometry.attributes.position.needsUpdate = true;
          this.pozze.forEach((p, k) => { if (k < 2) p.material.opacity = .3 + Math.sin(t * 2 + k) * .08; });
        };
      } else if (id === "tempio") {
        this.pavimento.material.color.setHex(0x0e1410);
        this.pozze.forEach((p, k) => p.material.color.setHex(k === 2 ? 0xffffff : 0x7dffb0));
        const marmo = new T.MeshBasicMaterial({ color: 0x8f9a92 });
        for (let k = 0; k < 6; k++) {
          const col = new T.Mesh(new T.CylinderGeometry(.3, .34, 2.6, poche ? 8 : 14), marmo);
          col.position.set(-7.5 + k * 3, 1.3, -9); g.add(col);
          const capitello = new T.Mesh(new T.BoxGeometry(.85, .22, .85), marmo); capitello.position.set(col.position.x, 2.7, -9); g.add(capitello);
        }
        const architrave = new T.Mesh(new T.BoxGeometry(17, .45, 1), marmo); architrave.position.set(0, 2.95, -9); g.add(architrave);
        const raggi = new T.Mesh(new T.PlaneGeometry(10, 9), new T.MeshBasicMaterial({ map: puntino(), color: 0xc8ffd8, transparent: true, opacity: .18, blending: T.AdditiveBlending, depthWrite: false }));
        raggi.position.set(0, 2.5, -7); g.add(raggi);
        const scintille = punti(poche ? 40 : 90, 0xb8ffd0, .06, () => [caso(-8, 8), caso(0, 5), caso(-6, 3)]);
        const arr = scintille.geometry.attributes.position.array;
        agg = (t, dt) => {
          for (let q = 0; q < arr.length; q += 3) { arr[q + 1] += dt * .35; if (arr[q + 1] > 5) arr[q + 1] = 0; }
          scintille.geometry.attributes.position.needsUpdate = true;
          raggi.material.opacity = .14 + Math.sin(t * .9) * .05;
        };
      }
      this._campo = { gruppo: g, agg: agg || (() => {}) };
      this.aggiornatori.push(this._campo.agg);
    }
    distruggi() { this.r.domElement.removeEventListener("pointerdown", this._tocco); super.distruggi(); }
  }

  // ============================================================
  //  UNA RICETTA PER OGNI MOSSA (id carta : indice mossa)
  //  A = posizione di chi attacca, D = posizione del bersaglio.
  // ============================================================
  const H = n => "#" + n.toString(16).padStart(6, "0");
  const MOSSE_FX = {
    // ---- La Loca ----
    "loca:0": async (ar, l) => { await ar.salto(l, { h: .6, sulBersaglio: false, giri: 0 }); await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xffb347, simbolo: "✦", dim: .45, arco: 1.1, ruota: .3 }); },
    "loca:1": async (ar, l) => { ar.ondaTerra(ar.pos(l), 0xd08cff, 4); ar.ondaTerra(ar.pos(l), 0xff6bd6, 2.5); await ar.simboli(ar.pos(l), "HA!", "#ff6bd6", { n: 7, verso: ar.pos(1 - l), durata: 700 }); },
    "loca:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6bd6"); ar.schermo("ubriaco", 1800); ar.luceScena(0xff6bd6, { dur: 1800 }); await ar.vortice(l, { giri: 4, dur: 800, colore: 0xff6bd6 });
      const giri = []; for (let k = 0; k < 6; k++) giri.push(ar.attendi(k * 80).then(() => ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: [0xff6bd6, 0xffb347, 0x3fd8ff, 0xd08cff][k % 4], dim: .4, arco: (k % 2 ? -1 : 1) * (.6 + k * .2), dur: 500 }))); await Promise.all(giri); ar.scossa = .3; },
    // ---- La Fuego ----
    "fuego:0": async (ar, l) => { await ar.scatto(l, { colore: 0xff7a45 }); ar.esplosione(ar.pos(1 - l), 0xffd36b, 30, { velocita: 2, su: 2, gravita: -.4 }); },
    "fuego:1": async (ar, l) => { await ar.getto(ar.pos(l), ar.pos(1 - l), { colore: 0xff7a45, dur: 800, densita: 7 }); },
    "fuego:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a45"); ar.schermo("calore", 2000); ar.luceScena(0xff5a1f, { intensita: .9, dur: 2000 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { ar.colonna(d.clone().add(V((k - 1) * .7, 0, (k % 2) * .4)), 0xff7a45, { alt: 4.5, larg: .35, dur: 1000 }); await ar.attendi(180); }
      await ar.pioggia(d, { colore: 0xffb347, n: 22, dur: 700 }); ar.scossa = .3; },
    // ---- La Reina ----
    "reina:0": async (ar, l) => { await ar.raggio(ar.pos(l).add(V(0, .35, 0)), ar.pos(1 - l), { colore: 0x9fe6ff, spessore: .05, dur: 450 }); ar.esplosione(ar.pos(1 - l), 0xe6f7ff, 30, { velocita: 1.4, gravita: .6 }); },
    "reina:1": async (ar, l) => { const p = ar.pos(l); const c = glifo("♛", "#f2c14e", .7); c.position.copy(p).add(V(0, 2.5, 0)); ar.scena.add(c); ar.colonna(p, 0xf2c14e, { alt: 3.5 });
      await ar.anima(600, t => { c.position.y = p.y + 2.5 - t * 1.6; }, easing.back); ar.esplosione(c.position.clone(), 0xf2c14e, 30, { velocita: 1.5 }); await ar.attendi(200); ar.scena.remove(c); },
    "reina:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("corona", 1800); ar.schermo("bn", 1800); const d = ar.pos(1 - l); const c = glifo("♛", "#f2c14e", 1.6); c.position.copy(d).add(V(0, 4, 0)); ar.scena.add(c);
      await ar.anima(520, t => { c.position.y = d.y + 4 - t * 3.6; c.material.rotation = (1 - t) * .5; }, easing.in); ar.ondaTerra(d, 0xf2c14e, 7); ar.lampo(0xf2c14e, 8, d); ar.scossa = .35; ar.esplosione(d, 0xf2c14e, 70, { velocita: 3.5 }); await ar.attendi(250); ar.scena.remove(c); },
    // ---- El Chapo ----
    "chapo:0": async (ar, l) => { await ar.proiettile(ar.pos(l).add(V(.2, .3, 0)), ar.pos(1 - l), { colore: 0xbbbbbb, dim: .6, arco: .3, dur: 600 }); ar.esplosione(ar.pos(1 - l), 0x999999, 30, { velocita: 1, su: 1, gravita: -.3, durata: 1100, dimensione: .2 }); },
    "chapo:1": async (ar, l) => { ar.ondaTerra(ar.pos(l), 0x4fd38a, 3); await ar.orbita(l, { colore: 0x4fd38a, testo: "$", n: 6, dur: 900 }); },
    "chapo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fd38a"); ar.schermo("soldi", 2000); ar.schermo("oro", 900); const d = ar.pos(1 - l);
      const p = ar.pioggia(d, { colore: 0x4fd38a, testo: "$", n: 26, dur: 900 }); await ar.proiettile(ar.pos(l), d, { colore: 0xf2c14e, dim: 1.1, arco: 1.4, dur: 700 }); ar.lampo(0xf2c14e, 7, d); ar.scossa = .3; await p; },
    // ---- El Rojo ----
    "rojo:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 140, colore: 0xff2e46 }); },
    "rojo:1": async (ar, l) => { for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .7 + k * .05, andata: 110, ritorno: 140, ruota: k % 2 ? -.4 : .4, colore: 0xff7a45 }); await ar.attendi(90); } },
    "rojo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("rosso", 1700); ar.luceScena(0xff1a1a, { intensita: 1, dur: 1700 }); await ar.crescita(l, { scala: 1.35, dur: 600 });
      await ar.scatto(l, { k: .92, andata: 160, ritorno: 420, ruota: .6, colore: 0xff2e46 }); ar.ondaTerra(ar.pos(1 - l), 0xff2e46, 6); ar.scossa = .4; ar.lampo(0xff2e46, 8, ar.pos(1 - l)); },
    // ---- El Ombra ----
    "ombra:0": async (ar, l) => { const t = await ar.teletrasporto(l, { colore: 0x3a3a4a, dietro: false }); if (!t) return; await ar.fendente(ar.pos(1 - l), { colore: 0x3fd8ff }); await t.torna(); },
    "ombra:1": async (ar, l) => { const p = ar.pos(l); ar.esplosione(p, 0x666677, 60, { velocita: 1, su: 1, gravita: -.2, durata: 1300, dimensione: .3 }); await ar.attendi(400); },
    "ombra:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fd8ff"); ar.schermo("buio", 1900); ar.luceScena(0x000000, { intensita: .05, dur: 1900 }); await ar.attendi(350);
      const t = await ar.teletrasporto(l, { colore: 0x222233, dietro: true }); if (!t) return; for (let k = 0; k < 4; k++) { ar.fendente(ar.pos(1 - l), { colore: 0x3fd8ff, scala: 1.3, rot: k * .8 }); ar.lampo(0x3fd8ff, 4, ar.pos(1 - l)); await ar.attendi(120); } ar.scossa = .3; await t.torna(); },
    // ---- El Pelado ----
    "pelado:0": async (ar, l) => { await ar.scatto(l, { k: .7, andata: 260, ruota: .1, colore: 0xbbbbbb }); ar.ondaTerra(ar.pos(1 - l), 0xbbbbbb, 2.5); },
    "pelado:1": async (ar, l) => { ar.colonna(ar.pos(l), 0x9aa3ad, { alt: 3, larg: .7 }); const m = new T.Mesh(new T.BoxGeometry(1.4, 1.2, .08), new T.MeshStandardMaterial({ color: 0x777777, transparent: true, opacity: .8, metalness: .6 })); const p = ar.pos(l); m.position.copy(p).add(V(0, -1.2, l ? .6 : -.6)); ar.scena.add(m);
      await ar.anima(500, t => { m.position.y = p.y - 1.2 + t * 1.1; }, easing.back); ar.esplosione(m.position.clone(), 0x888888, 30, { velocita: 1.6 }); await ar.attendi(300); await ar.anima(300, t => { m.material.opacity = .8 * (1 - t); }); ar.scena.remove(m); },
    "pelado:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#bbbbbb"); await ar.salto(l, { h: 2.6, dur: 750, giri: 0, colore: 0xbbbbbb }); ar.schermo("terremoto", 1300); ar.schermo("crepe", 1400); ar.scossa = .55;
      const d = ar.pos(1 - l); ar.ondaTerra(d, 0xbbbbbb, 8); ar.ondaTerra(d, 0xff7a45, 5); ar.esplosione(V(d.x, .1, d.z), 0x8a7a6a, 80, { velocita: 3, su: 1.5, gravita: 4, dimensione: .18, durata: 1300 }); await ar.attendi(400); },
    // ---- La Fiesta ----
    "fiesta:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xffe066, simbolo: "✦", dim: .5, arco: 1.2, ruota: .25 }); ar.esplosione(ar.pos(1 - l), 0xffe066, 30, { velocita: 2, su: 1.6 }); },
    "fiesta:1": async (ar, l) => { const p = ar.pos(l); ar.colonna(p, 0x4fd38a, { alt: 3.5 }); for (const c of [0xff2e46, 0xf2c14e, 0x3fd8ff, 0xb866ff]) ar.esplosione(p.clone().add(V(0, 1.6, 0)), c, 14, { velocita: 1.6, su: .4, gravita: 1.2, durata: 1200 }); await ar.attendi(500); },
    "fiesta:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("disco", 2200); ar.luceScena(0xb866ff, { intensita: .7, dur: 2200 }); await ar.orbita(1 - l, { colore: 0xff6bd6, n: 7, dur: 900, raggio: 1 });
      await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0x4fd38a, dur: 700, densita: 5, apertura: .15 }); ar.lampo(0xb866ff, 6); },
    // ---- El Diablo ----
    "diablo:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x8a2be2, dim: .55, arco: -.3, dur: 520 }); ar.esplosione(ar.pos(1 - l), 0x4a0a2a, 30, { velocita: 1, su: 1.2, gravita: -.3, durata: 900, dimensione: .2 }); },
    "diablo:1": async (ar, l) => { const d = ar.pos(1 - l); const g = new T.Group(); const r = new T.Mesh(new T.RingGeometry(.75, .82, 48), new T.MeshBasicMaterial({ color: 0xb866ff, side: T.DoubleSide, transparent: true, blending: T.AdditiveBlending }));
      const pts = []; for (let k = 0; k <= 5; k++) { const a = (k * 2 % 5) / 5 * Math.PI * 2 - Math.PI / 2; pts.push(V(Math.cos(a) * .78, Math.sin(a) * .78, 0)); }
      const st = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xff2e46, transparent: true })); g.add(r, st); g.rotation.x = -Math.PI / 2; g.position.set(d.x, .06, d.z); ar.scena.add(g);
      await ar.anima(900, t => { g.rotation.z = t * 2; r.material.opacity = st.material.opacity = Math.sin(t * Math.PI); }, easing.lin); ar.esplosione(d, 0xb866ff, 30, { velocita: 1, su: 2, gravita: -.6 }); ar.scena.remove(g); },
    "diablo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("inferno", 2000); ar.schermo("pentacolo", 1600); ar.luceScena(0x8b0000, { intensita: .9, dur: 2000 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ar.colonna(V(d.x + Math.cos(a) * 1.1, 0, d.z + Math.sin(a) * .7), 0xff2e46, { alt: 4, larg: .22, dur: 900 }); await ar.attendi(90); }
      ar.colonna(d, 0xff7a45, { alt: 5, larg: .6, dur: 900 }); ar.lampo(0xff2e46, 8, d); ar.scossa = .35; await ar.attendi(500); },
    // ---- La Bandita ----
    "bandita:0": async (ar, l) => { await ar.scatto(l, { k: 1.0, andata: 160, ritorno: 260, ruota: -.3 }); await ar.simboli(ar.pos(1 - l), "$", "#f2c14e", { n: 4, verso: ar.pos(l), durata: 600 }); },
    "bandita:1": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 150 }); await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0x3fd8ff, dur: 500, densita: 4, apertura: .1 }); ar.simboli(ar.pos(1 - l), "$", "#f2c14e", { n: 5, verso: ar.pos(l), durata: 600 }); },
    "bandita:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fd8ff"); ar.schermo("sirene", 2000); for (let k = 0; k < 4; k++) { await ar.scatto(l, { k: .85, andata: 100, ritorno: 120, ruota: k % 2 ? .5 : -.5, colore: k % 2 ? 0xff2e46 : 0x3fd8ff }); ar.lampo(k % 2 ? 0xff2e46 : 0x3fd8ff, 6); await ar.attendi(80); }
      ar.simboli(ar.pos(1 - l), "$", "#f2c14e", { n: 10, verso: ar.pos(l), durata: 700 }); ar.scossa = .3; },
    // ---- Capitan Gossip ----
    "gossip:0": async (ar, l) => { await ar.scatto(l, { colore: 0xf2c14e }); ar.simboli(ar.pos(1 - l), "★", "#f2c14e", { n: 6 }); },
    "gossip:1": async (ar, l) => { await ar.raggio(ar.pos(l), ar.pos(1 - l), { colore: 0xf2c14e, spessore: .16, dur: 600 }); },
    "gossip:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("bianco", 1600); const u = ar._u(l); if (u) { u.occupata = true; const p0 = u.gruppo.position.clone(); await ar.anima(500, t => { u.gruppo.position.y = p0.y + t * 1.2; }); }
      const sole = aloneSprite(0xffe9a8, .2); sole.position.copy(ar.pos(l)).add(V(0, 1, 0)); ar.scena.add(sole); await ar.anima(500, t => sole.scale.setScalar(.2 + t * 2.4));
      const da = sole.position.clone(), d = ar.pos(1 - l); await ar.anima(380, t => sole.position.lerpVectors(da, d, t), easing.in); ar.scena.remove(sole);
      ar.lampo(0xffffff, 10, d); ar.esplosione(d, 0xffe9a8, 100, { velocita: 4.5, durata: 1200 }); ar.ondaTerra(d, 0xf2c14e, 8); ar.scossa = .45; if (u) { const p = ar.posAttiva(l); await ar.anima(300, t => { u.gruppo.position.y = lerp(u.gruppo.position.y, p.y, t); }); u.occupata = false; } },
    // ---- Comora ----
    "comora:0": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 130 }); await ar.fendente(ar.pos(1 - l), { colore: 0x4fd38a }); },
    "comora:1": async (ar, l) => { ar.vortice(l, { giri: 2, dur: 600, colore: 0x4fd38a }); for (let k = 0; k < 3; k++) { ar.fendente(ar.pos(1 - l), { colore: 0x4fd38a, rot: k * 1.1, scala: .9 }); await ar.attendi(170); } },
    "comora:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fd38a"); ar.schermo("tagli", 1400); const t = await ar.teletrasporto(l, { colore: 0x1e5a3a, dietro: true }); if (!t) return;
      ar.fendente(ar.pos(1 - l), { colore: 0x4fd38a, rot: .78, scala: 1.6, dur: 500 }); ar.fendente(ar.pos(1 - l), { colore: 0x4fd38a, rot: -.78, scala: 1.6, dur: 500 }); ar.lampo(0x4fd38a, 7, ar.pos(1 - l)); ar.scossa = .3; await ar.attendi(420); await t.torna(); },
    // ---- Vedova Greca ----
    "vedovagreca:0": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 120 }); await ar.fulmine(ar.pos(1 - l).add(V(-.3, .3, 0)), ar.pos(1 - l).add(V(.3, -.3, 0)), { colore: 0x3fd8ff, volte: 2 }); },
    "vedovagreca:1": async (ar, l) => { ar.proiettile(ar.pos(l).add(V(-.25, 0, 0)), ar.pos(1 - l), { colore: 0xff2e46, dim: .25, arco: .1, dur: 260 }); await ar.attendi(140); await ar.proiettile(ar.pos(l).add(V(.25, 0, 0)), ar.pos(1 - l), { colore: 0xff2e46, dim: .25, arco: .1, dur: 260 }); },
    "vedovagreca:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("laser", 1800); const t = await ar.teletrasporto(l, { colore: 0x111111, dietro: true }); if (!t) return;
      await ar.fulmine(ar.pos(l), ar.pos(1 - l), { colore: 0x3fd8ff, volte: 4 }); ar.scossa = .3; await t.torna(); },
    // ---- Spider Toto ----
    "spidertoto:0": async (ar, l) => { await ar.salto(l, { h: 1.2, giri: 1, colore: 0xff2e46 }); },
    "spidertoto:1": async (ar, l) => { await ar.ragnatela(ar.pos(l), ar.pos(1 - l)); },
    "spidertoto:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4c95ff"); ar.schermo("ragnatela", 1700); const u = ar._u(l); if (!u) return; u.occupata = true; const p0 = u.gruppo.position.clone(), d = ar.pos(1 - l);
      ar.linea(V(0, 5, (p0.z + d.z) / 2), p0, 0xffffff, { dur: 900, spessore: .015 });
      await ar.anima(800, t => { const a = (t - .5) * Math.PI * .9; u.gruppo.position.set(Math.sin(a) * 1.8, 2.2 - Math.cos(a) * 1.7, lerp(p0.z, d.z * .6, t)); u.gruppo.rotation.z = -a * .5; }, easing.inOut);
      ar.ondaTerra(d, 0x4fd38a, 5); ar.esplosione(d, 0xff2e46, 60, { velocita: 3 }); ar.scossa = .35; await ar.anima(350, t => { u.gruppo.position.lerp(p0, t); u.gruppo.rotation.z *= 1 - t; }); u.occupata = false; },
    // ---- Wonder Rita ----
    "wonderrita:0": async (ar, l) => { ar.ondaTerra(ar.pos(l), 0xf2c14e, 2); ar.esplosione(ar.pos(l), 0xf2c14e, 20, { velocita: 2 }); await ar.scatto(l, { colore: 0xf2c14e }); },
    "wonderrita:1": async (ar, l) => { await ar.linea(ar.pos(l), ar.pos(1 - l), 0xf2c14e, { dur: 700, spessore: .03, onde: .4 }); ar.ondaTerra(ar.pos(1 - l), 0xf2c14e, 1.6); ar.ondaTerra(ar.pos(1 - l), 0xffe9a8, 1); },
    "wonderrita:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("dorato", 1800); ar.luceScena(0xf2c14e, { intensita: 1.1, dur: 1800 }); const p = ar.pos(l);
      for (let k = -1; k <= 1; k++) ar.colonna(p.clone().add(V(k * .8, 0, 0)), 0xffe9a8, { alt: 5, larg: .25, dur: 900 }); await ar.attendi(400);
      await ar.scatto(l, { k: .9, andata: 180, ritorno: 380, ruota: .2, colore: 0xf2c14e }); ar.ondaTerra(ar.pos(1 - l), 0xf2c14e, 6); ar.lampo(0xf2c14e, 7); ar.scossa = .35; },
    // ---- Stella Scura ----
    "stellascura:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x7dff9a, dim: .45, arco: .3, dur: 360 }); },
    "stellascura:1": async (ar, l) => { for (let k = 0; k < 3; k++) { ar.proiettile(ar.pos(l), ar.pos(1 - l).add(V((k - 1) * .3, 0, 0)), { colore: 0xd08cff, simbolo: "★", dim: .35, arco: .4 + k * .2, dur: 380, ruota: .3 }); await ar.attendi(120); } await ar.attendi(300); },
    "stellascura:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("spazio", 2000); ar.luceScena(0x2a0a4a, { intensita: .15, dur: 2000 }); const sfera = aloneSprite(0xb866ff, .3); sfera.add(aloneSprite(0x7dff9a, .4));
      sfera.position.copy(ar.pos(l)).add(V(0, 1.6, 0)); ar.scena.add(sfera); await ar.anima(650, t => { sfera.scale.setScalar(.3 + t * 2); if (Math.random() < .5) ar.esplosione(sfera.position.clone().add(V((Math.random() - .5) * 2, (Math.random() - .5) * 2, 0)), 0xb866ff, 2, { velocita: .2, gravita: 0 }); });
      const da = sfera.position.clone(), d = ar.pos(1 - l); await ar.anima(420, t => sfera.position.lerpVectors(da, d, t), easing.in); ar.scena.remove(sfera); ar.lampo(0xb866ff, 9, d); ar.esplosione(d, 0xd08cff, 90, { velocita: 4 }); ar.scossa = .4; },
    // ---- Mie Loki ----
    "mieloki:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x4fd38a, simbolo: "†", dim: .5, arco: .2, dur: 340 }); },
    "mieloki:1": async (ar, l) => { await ar.cloni(l, { n: 2, colore: 0x4fd38a, dur: 700 }); },
    "mieloki:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fd38a"); ar.schermo("specchio", 1800); ar.luceScena(0x0f5a2a, { intensita: .3, dur: 1800 }); await ar.cloni(l, { n: 4, colore: 0x4fd38a, dur: 900, carica: true }); ar.lampo(0x4fd38a, 7, ar.pos(1 - l)); ar.scossa = .3; },
    // ---- Iron Lus ----
    "ironlus:0": async (ar, l) => { await ar.raggio(ar.pos(l).add(V(.3, 0, 0)), ar.pos(1 - l), { colore: 0x9fe6ff, spessore: .07, dur: 300 }); },
    "ironlus:1": async (ar, l) => { await ar.missili(ar.pos(l), ar.pos(1 - l), { n: 4, colore: 0xff7a45 }); },
    "ironlus:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9fe6ff"); const torna = await ar.zoom(l, { quanto: .3, dur: 450 }); const nucleo = aloneSprite(0x9fe6ff, .3); nucleo.position.copy(ar.pos(l)).add(V(0, 0, l ? -.2 : .2)); ar.scena.add(nucleo);
      await ar.anima(500, t => nucleo.scale.setScalar(.3 + t * 1.4)); ar.schermo("bianco", 1200); ar.schermo("unibeam", 1500); await ar.raggio(ar.pos(l), ar.pos(1 - l), { colore: 0x9fe6ff, spessore: .45, dur: 1100 }); ar.scena.remove(nucleo); ar.scossa = .45; await torna(); },
    // ---- CyPips ----
    "cypips:0": async (ar, l) => { const v = []; for (let k = 0; k < 7; k++) v.push(ar.attendi(k * 60).then(() => ar.proiettile(ar.pos(l), ar.pos(1 - l).add(V((Math.random() - .5) * .5, (Math.random() - .5) * .5, 0)), { colore: 0xffd36b, dim: .18, arco: 0, dur: 220, scia: false }))); await Promise.all(v); },
    "cypips:1": async (ar, l) => { const p = ar.pos(l); ar.colonna(p, 0xc0c8d0, { alt: 3 }); const sc = new T.Mesh(new T.IcosahedronGeometry(1.0, 1), new T.MeshStandardMaterial({ color: 0xc0c8d0, metalness: .9, roughness: .2, transparent: true, opacity: .5, wireframe: true })); sc.position.copy(p); ar.scena.add(sc);
      await ar.anima(800, t => { sc.scale.setScalar(.3 + easing.back(Math.min(1, t * 1.6)) * .8); sc.rotation.y = t * 3; sc.material.opacity = t > .7 ? (1 - t) * 1.6 : .5; }, easing.lin); ar.scena.remove(sc); },
    "cypips:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("allarme", 2000); const d = ar.pos(1 - l); const voli = [];
      for (let k = 0; k < 7; k++) voli.push(ar.attendi(k * 110).then(() => ar.proiettile(V(d.x + (Math.random() - .5) * 2.5, 5, d.z + (Math.random() - .5) * 1.5), d.clone().add(V((Math.random() - .5) * 1.2, -.3, (Math.random() - .5) * .6)), { colore: 0xff7a45, dim: .35, arco: 0, dur: 420 }).then(() => { ar.scossa = Math.max(ar.scossa, .2); ar.lampo(0xff7a45, 4, d); })));
      await Promise.all(voli); ar.ondaTerra(d, 0xff7a45, 6); },
    // ---- Mau Thor ----
    "mauthor:0": async (ar, l) => { await ar.salto(l, { h: 1.3, giri: 0, colore: 0x9fd8ff }); ar.fulmine(ar.pos(1 - l).add(V(0, 2.5, 0)), ar.pos(1 - l), { volte: 1 }); },
    "mauthor:1": async (ar, l) => { await ar.fulmine(ar.pos(1 - l).add(V(.3, 4.5, 0)), ar.pos(1 - l), { volte: 3 }); ar.ondaTerra(ar.pos(1 - l), 0x9fd8ff, 3); },
    "mauthor:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9fd8ff"); ar.schermo("tempesta", 2200); ar.luceScena(0x0a1a3a, { intensita: .12, dur: 2200 }); const d = ar.pos(1 - l);
      ar.fulmine(ar.pos(l).add(V(0, 4.5, 0)), ar.pos(l), { volte: 2 }); await ar.attendi(300);
      for (let k = 0; k < 5; k++) { await ar.fulmine(V(d.x + (Math.random() - .5) * 2, 5, d.z), d.clone().add(V((Math.random() - .5) * .5, 0, 0)), { volte: 1 }); ar.scossa = Math.max(ar.scossa, .25); }
      ar.ondaTerra(d, 0x9fd8ff, 7); },
    // ---- Capitan Undercut ----
    "undercut:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x4c95ff, simbolo: "◉", dim: .55, arco: .4, dur: 380, ruota: .5, ritorno: true }); },
    "undercut:1": async (ar, l) => { const p = ar.pos(l); ar.colonna(p, 0x4c95ff, { alt: 3 }); const s = glifo("◉", "#4c95ff", 1.4); s.position.copy(p).add(V(0, 0, l ? -.5 : .5)); ar.scena.add(s);
      await ar.anima(700, t => { s.material.opacity = Math.sin(t * Math.PI); const k = .5 + easing.back(Math.min(1, t * 2)) * .6; s.scale.set(1.4 * k, 1.4 * k, 1); }, easing.lin); ar.scena.remove(s); },
    "undercut:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4c95ff"); ar.schermo("velocita", 1500); await ar.scatto(l, { k: .9, andata: 200, ritorno: 300, ruota: .2, colore: 0x4c95ff });
      await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xff2e46, simbolo: "◉", dim: .8, arco: .6, dur: 420, ruota: .6, ritorno: true }); ar.lampo(0x4c95ff, 6); ar.scossa = .35; },
    // ---- Ligulk ----
    "ligulk:0": async (ar, l) => { await ar.salto(l, { h: 1.0, giri: 0, colore: 0x4fd38a }); ar.ondaTerra(ar.pos(1 - l), 0x4fd38a, 4); },
    "ligulk:1": async (ar, l) => { ar.simboli(ar.pos(l), "GRR", "#4fd38a", { n: 3, dim: .5 }); await ar.crescita(l, { scala: 1.3, colore: 0x4fd38a, dur: 700 }); },
    "ligulk:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fd38a"); await ar.crescita(l, { scala: 1.45, colore: 0x4fd38a, dur: 600 }); ar.schermo("crepe", 1800); ar.schermo("terremoto", 1500); ar.scossa = .6;
      const d = ar.pos(1 - l); ar.ondaTerra(ar.pos(l), 0x4fd38a, 9); await ar.attendi(200); ar.ondaTerra(d, 0x4fd38a, 7); ar.esplosione(V(d.x, .1, d.z), 0x6a5a4a, 90, { velocita: 3.4, su: 1.6, gravita: 4, dimensione: .2, durata: 1400 }); ar.lampo(0x4fd38a, 9, d); await ar.attendi(400); },

    // ================= NUOVE CARTE =================
    // ---- Wandessia ----
    "wandessia:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xff1f4f, dim: .55, arco: .2, dur: 420 }); ar.esplosione(ar.pos(1 - l), 0xff6b8a, 24, { velocita: 1.6, gravita: -.3 }); },
    "wandessia:1": async (ar, l) => { const d = ar.pos(1 - l); ar.orbita(1 - l, { colore: 0xff1f4f, n: 6, dur: 800, raggio: .7 }); await ar.ragnatela(ar.pos(l), d, 0xff3f6a); },
    "wandessia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff1f4f"); ar.schermo("viola", 1800); ar.schermo("specchio", 1500); ar.luceScena(0xff1f4f, { intensita: .6, dur: 1800 }); await ar.orbita(l, { colore: 0xff1f4f, n: 8, dur: 700, raggio: 1 });
      await ar.getto(ar.pos(l), ar.pos(1 - l), { colore: 0xff1f4f, dur: 800, densita: 9, apertura: .4 }); ar.lampo(0xff1f4f, 8, ar.pos(1 - l)); ar.scossa = .35; },
    // ---- Waspy ----
    "waspy:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 110, ritorno: 200, colore: 0xf2c14e }); ar.fulmine(ar.pos(1 - l).add(V(-.2, .2, 0)), ar.pos(1 - l).add(V(.2, -.2, 0)), { colore: 0xffe066, volte: 1 }); },
    "waspy:1": async (ar, l) => { const u = ar._u(l); if (!u) return; u.occupata = true; ar.esplosione(ar.pos(l), 0xf2c14e, 20, { velocita: 1 }); await ar.anima(400, t => { const k = 1 - t * .6; u.gruppo.scale.set(k, k, k); }); await ar.anima(300, t => { const k = .4 + t * .6; u.gruppo.scale.set(k, k, k); }); u.occupata = false; },
    "waspy:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("allarme", 1200); const v = []; for (let k = 0; k < 10; k++) v.push(ar.attendi(k * 60).then(() => ar.proiettile(ar.pos(l), ar.pos(1 - l).add(V((Math.random() - .5) * .8, (Math.random() - .5) * .6, 0)), { colore: 0xffe066, dim: .2, arco: (Math.random() - .5) * 2, dur: 380 })));
      await Promise.all(v); ar.fulmine(ar.pos(1 - l).add(V(0, 1.5, 0)), ar.pos(1 - l), { colore: 0xffe066, volte: 2 }); ar.scossa = .3; },
    // ---- Diegkeye ----
    "diegkeye:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xb866ff, simbolo: "➤", dim: .4, arco: .25, dur: 300, scia: false }); },
    "diegkeye:1": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xff7a45, simbolo: "➤", dim: .45, arco: .5, dur: 380 }); ar.esplosione(ar.pos(1 - l), 0xff7a45, 50, { velocita: 3 }); ar.lampo(0xff7a45, 5, ar.pos(1 - l)); ar.scossa = .15; },
    "diegkeye:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("velocita", 1200); await ar.pioggia(ar.pos(1 - l), { colore: 0xb866ff, testo: "➤", n: 20, dur: 800 }); ar.scossa = .25; },

    // ---- Gokiele ----
    "gokiele:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 120, colore: 0xffd36b }); ar.ondaTerra(ar.pos(1 - l), 0xffd36b, 2); },
    "gokiele:1": async (ar, l) => { const t = await ar.teletrasporto(l, { colore: 0xffd36b, dietro: true }); if (!t) return; ar.esplosione(ar.pos(1 - l), 0xffd36b, 30, { velocita: 2.6 }); ar.fendente(ar.pos(1 - l), { colore: 0xffd36b }); await ar.attendi(200); await t.torna(); },
    "gokiele:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fd8ff"); ar.schermo("ki", 2200); await ar.colonna(ar.pos(l), 0xffd36b, { alt: 4.5, larg: .7, dur: 700 });
      const p = ar.pos(l).add(V(0, 0, l ? -.5 : .5)); const s = aloneSprite(0x3fd8ff, .2); s.add(aloneSprite(0xffffff, .5)); s.position.copy(p); ar.scena.add(s); await ar.anima(600, t => s.scale.setScalar(.2 + t * 1.3));
      ar.schermo("bianco", 900); await ar.raggio(p, ar.pos(1 - l), { colore: 0x3fd8ff, spessore: .5, dur: 1000 }); ar.scena.remove(s); ar.scossa = .5; },
    // ---- Vegerizio ----
    "vegerizio:0": async (ar, l) => { for (let k = 0; k < 3; k++) { ar.proiettile(ar.pos(l), ar.pos(1 - l).add(V((k - 1) * .25, 0, 0)), { colore: 0xffe066, dim: .25, arco: .2, dur: 260 }); await ar.attendi(70); } await ar.attendi(240); },
    "vegerizio:1": async (ar, l) => { ar.colonna(ar.pos(l), 0xb866ff, { alt: 3, dur: 500 }); await ar.attendi(200); await ar.raggio(ar.pos(l), ar.pos(1 - l), { colore: 0xb866ff, spessore: .22, dur: 600 }); },
    "vegerizio:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffe066"); ar.schermo("ki", 2000); const u = ar._u(l); ar.crescita(l, { scala: 1.25, colore: 0xffe066, dur: 700 }); await ar.colonna(ar.pos(l), 0xffe066, { alt: 5, larg: .8, dur: 700 });
      ar.schermo("oro", 900); const sfera = aloneSprite(0xffe066, .5); sfera.add(aloneSprite(0xffffff, .5)); sfera.position.copy(ar.pos(l)); ar.scena.add(sfera); await ar.anima(500, t => { sfera.position.lerpVectors(ar.pos(l), ar.pos(1 - l), t); sfera.scale.setScalar(.5 + t * 2); }, easing.in);
      ar.scena.remove(sfera); ar.lampo(0xffe066, 10, ar.pos(1 - l)); ar.esplosione(ar.pos(1 - l), 0xffe066, 100, { velocita: 4.5 }); ar.ondaTerra(ar.pos(1 - l), 0xffe066, 8); ar.scossa = .5; },
    // ---- Brolymone ----
    "brolymone:0": async (ar, l) => { await ar.scatto(l, { k: .75, andata: 240, ritorno: 340, ruota: .15, colore: 0x7dff6b }); ar.ondaTerra(ar.pos(1 - l), 0x7dff6b, 3); ar.scossa = .15; },
    "brolymone:1": async (ar, l) => { ar.colonna(ar.pos(l), 0x7dff6b, { alt: 4, larg: .8 }); await ar.crescita(l, { scala: 1.35, colore: 0x7dff6b, dur: 800 }); },
    "brolymone:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff6b"); ar.schermo("verde", 2000); ar.luceScena(0x2aff4a, { intensita: .8, dur: 2000 }); const p = ar.pos(l).add(V(0, 1.6, 0)); const m = aloneSprite(0x7dff6b, .3); m.add(aloneSprite(0xffffff, .4)); m.position.copy(p); ar.scena.add(m);
      await ar.anima(700, t => m.scale.setScalar(.3 + t * 3)); await ar.anima(450, t => m.position.lerpVectors(p, ar.pos(1 - l), t), easing.in); ar.scena.remove(m); ar.lampo(0x7dff6b, 10, ar.pos(1 - l)); ar.schermo("crepe", 1200); ar.esplosione(ar.pos(1 - l), 0x7dff6b, 100, { velocita: 4.5 }); ar.ondaTerra(ar.pos(1 - l), 0x7dff6b, 9); ar.scossa = .55; },
    // ---- Freezovico ----
    "freezovico:0": async (ar, l) => { await ar.raggio(ar.pos(l).add(V(.25, .3, 0)), ar.pos(1 - l), { colore: 0xd08cff, spessore: .035, dur: 300 }); },
    "freezovico:1": async (ar, l) => { await ar.getto(ar.pos(l), ar.pos(1 - l), { colore: 0xbfe9ff, dur: 600, densita: 5, dimensione: .14, apertura: .2 }); ar.esplosione(ar.pos(1 - l), 0xe6f7ff, 30, { velocita: 1, gravita: .5, durata: 1100 }); },
    "freezovico:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("viola", 2000); ar.luceScena(0x5a1a8a, { intensita: .25, dur: 2000 }); const p = ar.pos(l).add(V(0, 2.2, 0)); const sole = aloneSprite(0xffb347, .2); sole.add(aloneSprite(0xff2e46, .5)); sole.position.copy(p); ar.scena.add(sole);
      await ar.anima(800, t => { sole.scale.setScalar(.2 + t * 3.4); if (Math.random() < .5) ar.esplosione(p.clone(), 0xffb347, 2, { velocita: 1.5, gravita: 0 }); }); await ar.anima(600, t => sole.position.lerpVectors(p, ar.pos(1 - l), t), easing.in); ar.scena.remove(sole);
      ar.lampo(0xff7a45, 10, ar.pos(1 - l)); ar.esplosione(ar.pos(1 - l), 0xffb347, 120, { velocita: 5 }); ar.ondaTerra(ar.pos(1 - l), 0xff2e46, 9); ar.scossa = .5; },
    // ---- Lohan (id gohanlollo) ----
    "gohanlollo:0": async (ar, l) => { await ar.salto(l, { h: .9, giri: 1, colore: 0x8a5cff }); },
    "gohanlollo:1": async (ar, l) => { ar.fulmine(ar.pos(l).add(V(-.4, .8, 0)), ar.pos(l).add(V(.4, -.6, 0)), { colore: 0xffe066, volte: 2 }); await ar.colonna(ar.pos(l), 0xffe066, { alt: 4, larg: .6 }); },
    "gohanlollo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fd8ff"); ar.schermo("ki", 2000); const fantasma = aloneSprite(0x9fe6ff, 1.4); fantasma.position.copy(ar.pos(l)).add(V(.6, .6, l ? .4 : -.4)); fantasma.material.opacity = .4; ar.scena.add(fantasma);
      await ar.attendi(400); ar.schermo("bianco", 900); const r1 = ar.raggio(ar.pos(l), ar.pos(1 - l), { colore: 0x3fd8ff, spessore: .45, dur: 1000 }); const r2 = ar.raggio(fantasma.position.clone(), ar.pos(1 - l), { colore: 0x9fe6ff, spessore: .25, dur: 1000 }); await Promise.all([r1, r2]); ar.scena.remove(fantasma); ar.scossa = .5; },
    // ---- Pipsccolo ----
    "pipsccolo:0": async (ar, l) => { await ar.linea(ar.pos(l), ar.pos(1 - l), 0x7dff6b, { dur: 360, spessore: .07, onde: -.3 }); ar.esplosione(ar.pos(1 - l), 0x7dff6b, 24, { velocita: 2 }); },
    "pipsccolo:1": async (ar, l) => { const p = ar.pos(l); ar.esplosione(p, 0x7dff6b, 40, { velocita: .8, su: 2, gravita: -.6, durata: 1100 }); await ar.crescita(l, { scala: 1.12, colore: 0x7dff6b, dur: 600 }); },
    "pipsccolo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff6b"); ar.schermo("viola", 1600); const p = ar.pos(l).add(V(0, .4, 0)); const s = aloneSprite(0xffe066, .2); s.position.copy(p); ar.scena.add(s); await ar.anima(700, t => { s.scale.setScalar(.2 + t * .8); ar.esplosione(p.clone().add(V(Math.cos(t * 30) * .5, Math.sin(t * 30) * .5, 0)), 0xb866ff, 1, { velocita: .2, gravita: 0, durata: 300 }); });
      ar.scena.remove(s); const d = ar.pos(1 - l); await ar.anima(500, t => { const q = p.clone().lerp(d, t); for (let k = 0; k < 3; k++) ar.esplosione(q.clone().add(V(Math.cos(t * 40 + k * 2) * .35, Math.sin(t * 40 + k * 2) * .35, 0)), k ? 0xb866ff : 0xffe066, 1, { velocita: .1, gravita: 0, durata: 600, dimensione: .14 }); }, easing.lin);
      ar.lampo(0xffe066, 9, d); ar.esplosione(d, 0xffe066, 80, { velocita: 4 }); ar.scossa = .4; },
    // ---- Caulif Rita ----
    "caulifrita:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 130, ruota: .5, colore: 0xff4fd8 }); },
    "caulifrita:1": async (ar, l) => { const p = ar.pos(l).add(V(0, .6, 0)); const s = aloneSprite(0xff4fd8, .2); s.position.copy(p); ar.scena.add(s); await ar.anima(450, t => s.scale.setScalar(.2 + t * 1.2)); await ar.anima(350, t => s.position.lerpVectors(p, ar.pos(1 - l), t), easing.in); ar.scena.remove(s); ar.esplosione(ar.pos(1 - l), 0xff4fd8, 50, { velocita: 3 }); },
    "caulifrita:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff4fd8"); ar.schermo("ki", 1800); ar.fulmine(ar.pos(l).add(V(-.5, 1, 0)), ar.pos(l).add(V(.5, -.6, 0)), { colore: 0xff4fd8, volte: 3 }); await ar.attendi(300);
      for (let k = 0; k < 3; k++) { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: [0xff4fd8, 0xffe066, 0xff4fd8][k], dim: .7, arco: (k - 1) * .8, dur: 300 }); ar.scossa = .25; } },
    // ---- Criliziano ----
    "criliziano:0": async (ar, l) => { await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), ar.pos(1 - l), { colore: 0xffe066, simbolo: "◎", dim: .5, arco: .3, dur: 380, ruota: .8 }); },
    "criliziano:1": async (ar, l) => { ar.schermo("bianco", 600); ar.lampo(0xffffff, 12, ar.pos(l)); await ar.attendi(350); },
    "criliziano:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffe066"); ar.schermo("tagli", 1400); const p = ar.pos(l).add(V(0, 1.3, 0)); const disco = glifo("◎", "#ffe066", .3); disco.position.copy(p); ar.scena.add(disco);
      await ar.anima(500, t => { const k = .3 + t * 1.6; disco.scale.set(k * 1.6, k * .6, 1); disco.material.rotation += .4; }); await ar.anima(380, t => disco.position.lerpVectors(p, ar.pos(1 - l), t), easing.in); ar.scena.remove(disco);
      ar.fendente(ar.pos(1 - l), { colore: 0xffe066, rot: 0, scala: 1.8, dur: 500 }); ar.lampo(0xffe066, 7, ar.pos(1 - l)); ar.scossa = .35; },
    // ---- Bulsene ----
    "bulsene:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x3fd8ff, simbolo: "⚙", dim: .45, arco: .9, dur: 420, ruota: .3 }); ar.esplosione(ar.pos(1 - l), 0xffffff, 26, { velocita: 1.8 }); },
    "bulsene:1": async (ar, l) => { const p = ar.pos(l); ar.esplosione(p.clone().add(V(0, 0, l ? -.4 : .4)), 0xffffff, 40, { velocita: 1.2, su: 1, gravita: -.2, durata: 900, dimensione: .22 }); ar.ondaTerra(p, 0x3fd8ff, 3); await ar.orbita(l, { colore: 0x3fd8ff, n: 4, dur: 700 }); },
    "bulsene:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fd8ff"); ar.schermo("laser", 1600); const p = ar.pos(l).add(V(l ? 1 : -1, 0, 0)); ar.esplosione(p, 0xffffff, 60, { velocita: 1.6, su: 1, gravita: -.2, durata: 1000, dimensione: .3 });
      const robot = new T.Mesh(new T.BoxGeometry(.7, .9, .5), new T.MeshStandardMaterial({ color: 0x9aa3ad, metalness: .8, roughness: .3, emissive: 0x103a48 })); robot.position.copy(p); ar.scena.add(robot);
      await ar.anima(400, t => { robot.scale.setScalar(easing.back(t)); }); await ar.missili(robot.position.clone(), ar.pos(1 - l), { n: 6, colore: 0x3fd8ff }); ar.scossa = .3; await ar.anima(300, t => robot.scale.setScalar(1 - t)); ar.scena.remove(robot); },
    // ---- C-18 Ora ----
    "c18ora:0": async (ar, l) => { await ar.salto(l, { h: .7, giri: 0, colore: 0x3fd8ff }); },
    "c18ora:1": async (ar, l) => { const p = ar.pos(l); const sc = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshBasicMaterial({ color: 0x3fd8ff, transparent: true, opacity: .25, blending: T.AdditiveBlending, depthWrite: false })); sc.position.copy(p); ar.scena.add(sc);
      await ar.anima(700, t => { sc.scale.setScalar(.2 + easing.back(Math.min(1, t * 1.5)) * .8); sc.material.opacity = t > .7 ? (1 - t) * .8 : .25; }); ar.scena.remove(sc); },
    "c18ora:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fd8ff"); ar.schermo("velocita", 1400); const v = []; for (let k = 0; k < 8; k++) v.push(ar.attendi(k * 70).then(() => ar.proiettile(ar.pos(l).add(V((k % 2 ? .3 : -.3), .2, 0)), ar.pos(1 - l).add(V((Math.random() - .5) * .7, (Math.random() - .5) * .5, 0)), { colore: 0x3fd8ff, dim: .3, arco: (Math.random() - .5), dur: 300 })));
      await Promise.all(v); ar.scossa = .3; },
    // ---- Diego-17 ----
    "diego17:0": async (ar, l) => { for (let k = 0; k < 2; k++) { ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x4fd38a, dim: .3, arco: k ? .3 : -.3, dur: 280 }); await ar.attendi(90); } await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0x3fd8ff, dur: 300, densita: 3, apertura: .1 }); },
    "diego17:1": async (ar, l) => { await ar.scatto(l, { k: .7, andata: 150 }); await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0x3fd8ff, dur: 600, densita: 6, apertura: .15 }); },
    "diego17:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fd38a"); ar.schermo("verde", 1500); const p = ar.pos(l); const sc = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshBasicMaterial({ color: 0x4fd38a, transparent: true, opacity: .35, blending: T.AdditiveBlending, depthWrite: false })); sc.position.copy(p); ar.scena.add(sc);
      await ar.anima(900, t => { sc.scale.setScalar(.2 + t * 3.2); sc.position.lerpVectors(p, ar.pos(1 - l), t * .6); sc.material.opacity = .35 * (1 - t * .5); }); ar.scena.remove(sc); ar.lampo(0x4fd38a, 8, ar.pos(1 - l)); ar.esplosione(ar.pos(1 - l), 0x4fd38a, 80, { velocita: 3.5 }); ar.scossa = .4; },
    // ---- Chichice ----
    "chichice:0": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 160, ruota: .6, colore: 0xaaaaaa }); ar.simboli(ar.pos(1 - l), "BONK", "#ffe066", { n: 1, dim: .45 }); },
    "chichice:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p.clone().add(V(0, .5, 0)), "♨", "#ff7a45", { n: 4, dim: .4 }); await ar.colonna(p, 0x4fd38a, { alt: 3 }); },
    "chichice:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("rosso", 1500); for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .85, andata: 100, ritorno: 140, ruota: k % 2 ? .6 : -.6, colore: 0xff2e46 }); ar.simboli(ar.pos(1 - l), "!", "#ff2e46", { n: 2 }); await ar.attendi(60); }
      await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0x4fd38a, dur: 400, densita: 4 }); },
    // ---- Videssia (id vidalessia) ----
    "vidalessia:0": async (ar, l) => { await ar.salto(l, { h: .8, giri: 1, colore: 0xffffff }); },
    "vidalessia:1": async (ar, l) => { ar.simboli(ar.pos(l), "GO!", "#ff7a45", { n: 3, dim: .45 }); ar.ondaTerra(ar.pos(l), 0xff7a45, 4); await ar.colonna(ar.pos(l), 0xff7a45, { alt: 3 }); },
    "vidalessia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a45"); ar.schermo("velocita", 1400); const u = ar._u(l); if (!u) return; u.occupata = true; const p0 = u.gruppo.position.clone(), d = ar.pos(1 - l);
      await ar.anima(400, t => { u.gruppo.position.y = p0.y + t * 2.5; }); await ar.anima(300, t => { u.gruppo.position.set(lerp(p0.x, d.x, t), p0.y + 2.5 - t * 2.3, lerp(p0.z, d.z, t)); }, easing.in); ar.ondaTerra(d, 0xff7a45, 6); ar.esplosione(d, 0xff7a45, 60, { velocita: 3 }); ar.scossa = .35;
      await ar.anima(350, t => u.gruppo.position.lerpVectors(d, p0, t)); u.occupata = false; },
    // ---- Panky ----
    "panky:0": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 120, ruota: .2, colore: 0xff7a45 }); ar.simboli(ar.pos(1 - l), "★", "#ffe066", { n: 3, dim: .25 }); },
    "panky:1": async (ar, l) => { await ar.vortice(l, { giri: 2, dur: 400, colore: 0xff7a45 }); await ar.simboli(ar.pos(l), "UFF", "#ff7a45", { n: 2, verso: ar.pos(1 - l), durata: 600 }); },
    "panky:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a45"); ar.schermo("ki", 1500); for (let k = 0; k < 5; k++) { await ar.scatto(l, { k: .8, andata: 70, ritorno: 90, ruota: k % 2 ? .5 : -.5, colore: [0xff7a45, 0xffe066][k % 2] }); } ar.scossa = .3; },
    // ---- Giulmai ----
    "giulmai:0": async (ar, l) => { await ar.proiettile(ar.pos(l).add(V(.3, 0, 0)), ar.pos(1 - l), { colore: 0xff4fd8, dim: .5, arco: .3, dur: 360 }); },
    "giulmai:1": async (ar, l) => { ar.proiettile(ar.pos(l).add(V(-.3, 0, 0)), ar.pos(1 - l), { colore: 0xff4fd8, dim: .45, arco: .6, dur: 380 }); await ar.attendi(120); await ar.proiettile(ar.pos(l).add(V(.3, 0, 0)), ar.pos(1 - l), { colore: 0xb866ff, dim: .45, arco: -.4, dur: 380 }); },
    "giulmai:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff4fd8"); ar.schermo("viola", 1600); const p = ar.pos(l).add(V(0, .8, 0)); const s = aloneSprite(0xb866ff, .2); s.add(aloneSprite(0xff4fd8, .6)); s.position.copy(p); ar.scena.add(s);
      await ar.anima(600, t => s.scale.setScalar(.2 + t * 1.8)); await ar.anima(400, t => s.position.lerpVectors(p, ar.pos(1 - l), t), easing.in); ar.scena.remove(s); ar.lampo(0xff4fd8, 9, ar.pos(1 - l)); ar.esplosione(ar.pos(1 - l), 0xff4fd8, 80, { velocita: 4 }); ar.scossa = .4; },

    // ---- Zeu Tiz ----
    "zeutiz:0": async (ar, l) => { await ar.fulmine(ar.pos(l).add(V(0, .6, 0)), ar.pos(1 - l), { colore: 0xffe9a8, volte: 1 }); },
    "zeutiz:1": async (ar, l) => { ar.luceScena(0x1a2a4a, { intensita: .3, dur: 900 }); await ar.fulmine(ar.pos(1 - l).add(V(0, 5, 0)), ar.pos(1 - l), { colore: 0xffe9a8, volte: 3 }); ar.ondaTerra(ar.pos(1 - l), 0xffe9a8, 4); },
    "zeutiz:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffe9a8"); ar.schermo("tempesta", 2300); ar.luceScena(0x0a1530, { intensita: .1, dur: 2300 }); const u = ar._u(l); ar.colonna(ar.pos(l), 0xffe9a8, { alt: 5, larg: .5, dur: 900 }); await ar.attendi(300);
      const d = ar.pos(1 - l); for (let k = 0; k < 4; k++) { ar.fulmine(V(d.x + (Math.random() - .5) * 2.4, 5, d.z + (Math.random() - .5)), d.clone(), { colore: 0xffe9a8, volte: 1 }); await ar.attendi(120); }
      await ar.fulmine(V(d.x, 6, d.z), d, { colore: 0xffffff, volte: 3, spessore: 3 }); ar.schermo("bianco", 700); ar.ondaTerra(d, 0xffe9a8, 9); ar.scossa = .55; },
    // ---- Pose Ludovico ----
    "poseludovico:0": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 160, colore: 0x3fa8ff }); ar.esplosione(ar.pos(1 - l), 0x9fe6ff, 30, { velocita: 2, su: 1.6, gravita: 3 }); },
    "poseludovico:1": async (ar, l) => { const p = ar.pos(l); const m = new T.Mesh(new T.CylinderGeometry(1, 1, 2, 32, 1, true), new T.MeshBasicMaterial({ color: 0x3fa8ff, transparent: true, opacity: .35, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); m.position.set(p.x, 1, p.z); ar.scena.add(m);
      await ar.anima(800, t => { m.scale.set(1, .1 + easing.back(Math.min(1, t * 1.5)) * .9, 1); m.rotation.y += .1; m.material.opacity = t > .7 ? (1 - t) : .35; }); ar.scena.remove(m); },
    "poseludovico:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fa8ff"); ar.schermo("mare", 2200); ar.luceScena(0x0a3a6a, { intensita: .3, dur: 2200 }); const d = ar.pos(1 - l);
      const onda = new T.Mesh(new T.PlaneGeometry(6, 3, 30, 1), new T.MeshBasicMaterial({ color: 0x3fa8ff, transparent: true, opacity: .55, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false })); const z0 = ar.pos(l).z; onda.position.set(0, .1, z0); ar.scena.add(onda);
      await ar.anima(1100, t => { onda.position.z = lerp(z0, d.z, t); onda.position.y = Math.sin(t * Math.PI) * 1.2 + .3; onda.scale.y = .3 + Math.sin(t * Math.PI) * .9; if (Math.random() < .7) ar.esplosione(onda.position.clone().add(V((Math.random() - .5) * 5, 1, 0)), 0x9fe6ff, 3, { velocita: 1.5, su: 1.5, gravita: 3 }); }, easing.inOut);
      ar.scena.remove(onda); ar.esplosione(d, 0x9fe6ff, 100, { velocita: 3.5, su: 1.8, gravita: 4, durata: 1300 }); ar.scossa = .5; },
    // ---- Adel Rizio ----
    "adelrizio:0": async (ar, l) => { await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0x7dff9a, dur: 450, densita: 4, apertura: .1 }); ar.esplosione(ar.pos(1 - l), 0x1a1a2a, 30, { velocita: 1, su: 1, gravita: -.3, durata: 900, dimensione: .2 }); },
    "adelrizio:1": async (ar, l) => { const d = ar.pos(1 - l); for (let k = 0; k < 4; k++) ar.linea(V(d.x + (k - 1.5) * .8, 0, d.z + .3), d.clone().add(V(0, -.2, 0)), 0x7dff9a, { dur: 900, spessore: .03, onde: .3 }); ar.esplosione(V(d.x, .1, d.z), 0x7dff9a, 30, { velocita: 1, su: 2, gravita: -.4 }); await ar.attendi(700); },
    "adelrizio:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff9a"); ar.schermo("buio", 2000); ar.schermo("verde", 1600); ar.luceScena(0x0a2a14, { intensita: .08, dur: 2000 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; ar.colonna(V(d.x + Math.cos(a) * 1.2, 0, d.z + Math.sin(a) * .8), 0x7dff9a, { alt: 3, larg: .18, dur: 1000 }); } await ar.attendi(500);
      ar.esplosione(V(d.x, .1, d.z), 0x7dff9a, 80, { velocita: 2, su: 2.5, gravita: -.5, durata: 1400 }); await ar.getto(d, ar.pos(l), { colore: 0x7dff9a, dur: 600, densita: 6, apertura: .15 }); ar.scossa = .35; },
    // ---- Aresorenzo ----
    "aresorenzo:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 140, colore: 0xff2e46 }); ar.fendente(ar.pos(1 - l), { colore: 0xff2e46, rot: .5 }); },
    "aresorenzo:1": async (ar, l) => { ar.simboli(ar.pos(l), "ARGH", "#ff2e46", { n: 2, dim: .5 }); ar.ondaTerra(ar.pos(l), 0xff2e46, 4); await ar.crescita(l, { scala: 1.2, colore: 0xff2e46 }); },
    "aresorenzo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("rosso", 1900); ar.luceScena(0x8a0a0a, { intensita: .7, dur: 1900 }); for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .9, andata: 110, ritorno: 160, ruota: k % 2 ? .6 : -.6 }); ar.fendente(ar.pos(1 - l), { colore: 0xff2e46, rot: k * 1.2, scala: 1.4 }); ar.lampo(0xff2e46, 5, ar.pos(1 - l)); }
      ar.ondaTerra(ar.pos(1 - l), 0xff2e46, 7); ar.scossa = .45; },
    // ---- Atha Rita ----
    "atharita:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xf2c14e, simbolo: "➤", dim: .55, arco: .3, dur: 360 }); },
    "atharita:1": async (ar, l) => { const p = ar.pos(l); const s = glifo("⬢", "#f2c14e", 1.5); s.position.copy(p).add(V(0, 0, l ? -.5 : .5)); ar.scena.add(s); await ar.anima(800, t => { s.material.opacity = Math.sin(t * Math.PI); s.material.rotation = t; }); ar.scena.remove(s); },
    "atharita:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("dorato", 1700); const d = ar.pos(1 - l); const civetta = glifo("✦", "#f2c14e", .4); civetta.position.copy(ar.pos(l)).add(V(0, 1, 0)); ar.scena.add(civetta);
      await ar.anima(500, t => civetta.position.y = ar.pos(l).y + 1 + t * .8); ar.scena.remove(civetta); for (let k = -1; k <= 1; k++) ar.proiettile(ar.pos(l).add(V(k * .5, 1.5, 0)), d.clone().add(V(k * .3, 0, 0)), { colore: 0xf2c14e, simbolo: "➤", dim: .6, arco: .4, dur: 450 }); await ar.attendi(500); ar.lampo(0xf2c14e, 8, d); ar.scossa = .35; },
    // ---- Art Alice ----
    "artalice:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xe6f0ff, simbolo: "➤", dim: .45, arco: .2, dur: 280, scia: true }); },
    "artalice:1": async (ar, l) => { for (let k = 0; k < 3; k++) { ar.proiettile(ar.pos(l), ar.pos(1 - l).add(V((k - 1) * .35, 0, 0)), { colore: 0xbfd8ff, simbolo: "➤", dim: .35, arco: .9 + k * .2, dur: 420 }); await ar.attendi(100); } await ar.attendi(380); },
    "artalice:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#bfd8ff"); ar.schermo("luna", 2000); ar.luceScena(0x1a2a5a, { intensita: .15, dur: 2000 }); const luna = aloneSprite(0xe6f0ff, 2.4); luna.position.set(0, 4, -3); ar.scena.add(luna); await ar.anima(500, t => luna.material.opacity = t);
      await ar.raggio(luna.position.clone(), ar.pos(l), { colore: 0xbfd8ff, spessore: .1, dur: 400 }); await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xe6f0ff, dim: 1, arco: .3, dur: 380 }); ar.lampo(0xe6f0ff, 9, ar.pos(1 - l)); ar.esplosione(ar.pos(1 - l), 0xe6f0ff, 80, { velocita: 3.5 }); ar.scena.remove(luna); ar.scossa = .35; },
    // ---- Aurera ----
    "aurera:0": async (ar, l) => { await ar.raggio(ar.pos(l).add(V(0, .3, 0)), ar.pos(1 - l), { colore: 0xd08cff, spessore: .04, dur: 360 }); ar.simboli(ar.pos(1 - l), "✦", "#d08cff", { n: 4, dim: .25 }); },
    "aurera:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p.clone().add(V(0, .4, 0)), "♥", "#ff6bd6", { n: 6, dim: .3 }); await ar.colonna(p, 0xffe9a8, { alt: 3.5 }); },
    "aurera:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d08cff"); ar.schermo("corona", 1600); ar.schermo("viola", 1600); const d = ar.pos(1 - l); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; ar.proiettile(d.clone().add(V(Math.cos(a) * 2, 1.5, Math.sin(a))), d.clone(), { colore: 0xd08cff, simbolo: "✦", dim: .4, arco: 0, dur: 500 }); }
      await ar.attendi(550); ar.lampo(0xd08cff, 8, d); ar.ondaTerra(d, 0xd08cff, 6); ar.scossa = .3; },
    // ---- Her Diego ----
    "herdiego:0": async (ar, l) => { await ar.scatto(l, { k: 1.0, andata: 110, ritorno: 200, ruota: -.2 }); ar.simboli(ar.pos(1 - l), "$", "#f2c14e", { n: 3, verso: ar.pos(l), durata: 500 }); },
    "herdiego:1": async (ar, l) => { const t = await ar.teletrasporto(l, { colore: 0xffe9a8, dietro: true }); if (!t) return; ar.simboli(ar.pos(1 - l), "✉", "#ffe9a8", { n: 4, dim: .35 }); await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0x3fd8ff, dur: 300, densita: 3 }); await t.torna(); },
    "herdiego:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffe9a8"); ar.schermo("velocita", 1600); for (let k = 0; k < 4; k++) { await ar.scatto(l, { k: .95, andata: 70, ritorno: 90, ruota: k % 2 ? .4 : -.4, colore: 0xffe9a8 }); } ar.simboli(ar.pos(1 - l), "✉", "#ffe9a8", { n: 6, dim: .35 }); ar.scossa = .3; },
    // ---- Efe Samuele ----
    "efesamuele:0": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 180, ruota: .7, colore: 0xff7a45 }); ar.esplosione(ar.pos(1 - l), 0xffd36b, 30, { velocita: 2.5, su: 1.2 }); },
    "efesamuele:1": async (ar, l) => { const p = ar.pos(l).add(V(0, -.3, 0)); for (let k = 0; k < 3; k++) { ar.esplosione(p.clone(), 0xffb347, 20, { velocita: 2, su: 1.5 }); ar.lampo(0xff7a45, 4, p); await ar.attendi(150); } await ar.getto(ar.pos(l), ar.pos(1 - l), { colore: 0xff7a45, dur: 500, densita: 6 }); },
    "efesamuele:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a45"); ar.schermo("calore", 2000); ar.schermo("terremoto", 1200); ar.luceScena(0xff3a0a, { intensita: .9, dur: 2000 }); const d = ar.pos(1 - l);
      ar.colonna(d, 0xff7a45, { alt: 6, larg: .8, dur: 1100 }); for (let k = 0; k < 14; k++) setTimeout(() => ar.esplosione(V(d.x, .1, d.z), 0xff7a45, 8, { velocita: 2.5, su: 3, gravita: 4, dimensione: .18 }), k * 60); await ar.pioggia(d, { colore: 0xff7a45, n: 16, dur: 700 }); ar.scossa = .5; },
    // ---- Dion Pips ----
    "dionpips:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x8a1a4a, dim: .5, arco: 1, dur: 440 }); ar.esplosione(ar.pos(1 - l), 0xb0305a, 30, { velocita: 2, su: 1, gravita: 2 }); },
    "dionpips:1": async (ar, l) => { await ar.getto(ar.pos(l), ar.pos(1 - l), { colore: 0xb0305a, dur: 600, densita: 5, apertura: .3 }); ar.simboli(ar.pos(1 - l), "hic", "#d08cff", { n: 3, dim: .35 }); },
    "dionpips:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b0305a"); ar.schermo("ubriaco", 2000); ar.schermo("disco", 2000); ar.luceScena(0x6a0a3a, { intensita: .6, dur: 2000 }); await ar.vortice(l, { giri: 3, dur: 700, colore: 0xb0305a });
      const d = ar.pos(1 - l); for (let k = 0; k < 5; k++) { ar.proiettile(ar.pos(l), d.clone().add(V((Math.random() - .5) * .8, 0, 0)), { colore: [0xb0305a, 0x7dff6b, 0xd08cff][k % 3], dim: .45, arco: .6 + Math.random(), dur: 450 }); await ar.attendi(90); } await ar.attendi(400); ar.scossa = .35; },
    // ---- Nikulia ----
    "nikulia:0": async (ar, l) => { const u = ar._u(l); ar.simboli(ar.pos(l), "❦", "#ffffff", { n: 4, dim: .3 }); await ar.scatto(l, { k: .85, andata: 140, colore: 0xffffff }); },
    "nikulia:1": async (ar, l) => { await ar.salto(l, { h: 1.6, giri: 0, colore: 0xf2c14e }); ar.fendente(ar.pos(1 - l), { colore: 0xf2c14e, rot: 1.57, scala: 1.2 }); },
    "nikulia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("dorato", 1700); ar.pioggia(ar.pos(l), { colore: 0xffffff, testo: "❦", n: 12, dur: 900 }); await ar.attendi(300);
      await ar.scatto(l, { k: .95, andata: 160, ritorno: 380, ruota: .3, colore: 0xf2c14e }); ar.fendente(ar.pos(1 - l), { colore: 0xf2c14e, rot: .78, scala: 1.7, dur: 500 }); ar.fendente(ar.pos(1 - l), { colore: 0xffffff, rot: -.78, scala: 1.7, dur: 500 }); ar.lampo(0xf2c14e, 8); ar.scossa = .4; },
    // ---- Solmone ----
    "solmone:0": async (ar, l) => { await ar.raggio(ar.pos(l).add(V(0, .6, 0)), ar.pos(1 - l), { colore: 0xffd36b, spessore: .08, dur: 380 }); },
    "solmone:1": async (ar, l) => { await ar.simboli(ar.pos(l), "♪", "#ffd36b", { n: 7, dim: .35, su: 1.6 }); ar.ondaTerra(ar.pos(l), 0xffd36b, 3); },
    "solmone:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd36b"); ar.schermo("sole", 1900); ar.luceScena(0xffb347, { intensita: 1.1, dur: 1900 }); const s = aloneSprite(0xffd36b, .4); s.add(aloneSprite(0xffffff, .5)); const p = V(ar.pos(l).x - 2.5, 3, ar.pos(l).z); s.position.copy(p); ar.scena.add(s);
      await ar.anima(1000, t => { s.position.set(lerp(p.x, ar.pos(1 - l).x, t), 3 - Math.sin(t * Math.PI) * -.8 - t * 2.2, lerp(p.z, ar.pos(1 - l).z, t)); s.scale.setScalar(.4 + t * 2); if (Math.random() < .7) ar.esplosione(s.position.clone(), 0xffb347, 2, { velocita: .4, gravita: 0, durata: 500 }); }, easing.inOut);
      ar.scena.remove(s); ar.lampo(0xffd36b, 10, ar.pos(1 - l)); ar.esplosione(ar.pos(1 - l), 0xffd36b, 90, { velocita: 4 }); ar.scossa = .4; },
    // ---- Aphro Alessia ----
    "aphroalessia:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xff6bd6, simbolo: "♥", dim: .45, arco: .7, dur: 450 }); },
    "aphroalessia:1": async (ar, l) => { await ar.orbita(1 - l, { colore: 0xff6bd6, testo: "♥", n: 6, dur: 900 }); },
    "aphroalessia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6bd6"); ar.schermo("fiori", 2000); ar.luceScena(0xff6bd6, { intensita: .8, dur: 2000 }); await ar.pioggia(ar.pos(1 - l), { colore: 0xff6bd6, testo: "♥", n: 18, dur: 800 });
      await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0xff6bd6, dur: 500, densita: 5, apertura: .15 }); },
    // ---- Dem Viky ----
    "demviky:0": async (ar, l) => { await ar.linea(ar.pos(l), ar.pos(1 - l), 0xf2c14e, { dur: 420, spessore: .035, onde: .5 }); ar.esplosione(ar.pos(1 - l), 0xf2c14e, 20, { velocita: 1.6 }); },
    "demviky:1": async (ar, l) => { const p = ar.pos(l); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; ar.esplosione(V(p.x + Math.cos(a) * .8, .1, p.z + Math.sin(a) * .5), 0x7dff6b, 6, { velocita: .5, su: 2.5, gravita: -.4, durata: 1000 }); } await ar.colonna(p, 0x7dff6b, { alt: 3 }); },
    "demviky:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff6b"); ar.schermo("fiori", 1900); ar.schermo("verde", 1500); const d = ar.pos(1 - l); for (let k = 0; k < 5; k++) ar.linea(V(d.x + (k - 2) * .6, 0, d.z + .4), d.clone(), 0x7dff6b, { dur: 900, spessore: .04, onde: .4 });
      await ar.attendi(700); ar.esplosione(d, 0xf2c14e, 60, { velocita: 2.5 }); await ar.getto(d, ar.pos(l), { colore: 0x7dff6b, dur: 500, densita: 5 }); },
    // ---- Per Senè ----
    "persene:0": async (ar, l) => { await ar.simboli(ar.pos(l), "✿", "#ff6bd6", { n: 5, dim: .3, verso: ar.pos(1 - l), durata: 600 }); },
    "persene:1": async (ar, l) => { const p = ar.pos(l); ar.esplosione(V(p.x, .1, p.z), 0x3a0a1a, 50, { velocita: 1, su: 1.5, gravita: -.2, durata: 1200, dimensione: .28 }); ar.simboli(p, "✿", "#ff6bd6", { n: 4, dim: .3 }); await ar.attendi(450); },
    "persene:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a1a3a"); ar.schermo("fiori", 1900); ar.schermo("buio", 1600); ar.luceScena(0x3a0a1a, { intensita: .15, dur: 1900 }); const d = ar.pos(1 - l);
      await ar.pioggia(d, { colore: 0xff6bd6, testo: "✿", n: 16, dur: 700 }); ar.colonna(d, 0x8a1a3a, { alt: 4, larg: .6 }); ar.lampo(0x8a1a3a, 8, d); ar.scossa = .3; },

    // ---- El Lobo ----
    "ellobo:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 130, colore: 0xbbbbbb }); ar.fendente(ar.pos(1 - l), { colore: 0xffffff, rot: 2.4, scala: .8 }); },
    "ellobo:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "AUUU", "#bfd8ff", { n: 1, dim: .5, su: 1.6 }); ar.ondaTerra(p, 0xbfd8ff, 5); await ar.ondaTerra(p, 0xbfd8ff, 3); },
    "ellobo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#bfd8ff"); ar.schermo("luna", 1900); ar.luceScena(0x0a1a3a, { intensita: .1, dur: 1900 }); await ar.cloni(l, { n: 3, colore: 0xbfd8ff, dur: 600, carica: true });
      for (let k = 0; k < 4; k++) { ar.fendente(ar.pos(1 - l), { colore: 0xbfd8ff, rot: k * .9, scala: 1.1 }); await ar.attendi(110); } ar.scossa = .35; },
    // ---- El Tigre ----
    "eltigre:0": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 120 }); for (let k = 0; k < 3; k++) ar.fendente(ar.pos(1 - l).add(V((k - 1) * .15, 0, 0)), { colore: 0xff7a45, rot: 1.9, scala: .7 }); },
    "eltigre:1": async (ar, l) => { await ar.salto(l, { h: 1.5, giri: 0, colore: 0xff7a45 }); ar.fendente(ar.pos(1 - l), { colore: 0xff7a45, rot: 2.2, scala: 1.3 }); },
    "eltigre:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a45"); ar.schermo("tagli", 1500); ar.schermo("rosso", 1500); const t = await ar.teletrasporto(l, { colore: 0x3a1a0a, dietro: true }); if (!t) return;
      for (let k = 0; k < 3; k++) { ar.fendente(ar.pos(1 - l).add(V((k - 1) * .25, 0, 0)), { colore: 0xff7a45, rot: 2.1, scala: 1.8, dur: 500 }); } ar.lampo(0xff7a45, 7, ar.pos(1 - l)); ar.scossa = .4; await ar.attendi(450); await t.torna(); },
    // ---- El Cuervo ----
    "elcuervo:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x2a2a3a, simbolo: "❧", dim: .45, arco: .4, dur: 380, ruota: .2 }); },
    "elcuervo:1": async (ar, l) => { for (let k = 0; k < 3; k++) { ar.proiettile(ar.pos(l).add(V(0, .5, 0)), ar.pos(1 - l), { colore: 0x4a4a6a, simbolo: "v", dim: .4, arco: (k - 1) * 1.2, dur: 480 }); await ar.attendi(110); } await ar.attendi(420); },
    "elcuervo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a6a8a"); ar.schermo("buio", 1900); ar.luceScena(0x0a0a14, { intensita: .08, dur: 1900 }); const d = ar.pos(1 - l); const v = [];
      for (let k = 0; k < 12; k++) v.push(ar.attendi(k * 60).then(() => ar.proiettile(V(d.x + (Math.random() - .5) * 4, 2 + Math.random() * 2, d.z + (Math.random() - .5) * 2), d.clone(), { colore: 0x4a4a6a, simbolo: "v", dim: .4, arco: .3, dur: 420, scia: false })));
      await Promise.all(v); ar.lampo(0xff2e46, 7, d); ar.scossa = .4; },
    // ---- La Bruja ----
    "labruja:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xb866ff, simbolo: "✶", dim: .45, arco: .5, dur: 420, ruota: .3 }); },
    "labruja:1": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x7dff6b, dim: .45, arco: 1.2, dur: 480 }); ar.esplosione(ar.pos(1 - l), 0x7dff6b, 40, { velocita: 1, su: 2, gravita: -.4, durata: 1100, dimensione: .2 }); },
    "labruja:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("pentacolo", 1800); ar.schermo("viola", 1800); ar.luceScena(0x2a0a4a, { intensita: .15, dur: 1800 }); await ar.orbita(1 - l, { colore: 0xb866ff, testo: "✶", n: 7, dur: 900, raggio: 1 });
      ar.colonna(ar.pos(1 - l), 0x7dff6b, { alt: 4, larg: .5 }); ar.lampo(0xb866ff, 8, ar.pos(1 - l)); ar.scossa = .3; await ar.attendi(400); },
    // ---- La Sombra ----
    "lasombra:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xffb347, dim: .4, arco: .8, dur: 400 }); ar.esplosione(ar.pos(1 - l), 0xffb347, 24, { velocita: 2, gravita: 2 }); },
    "lasombra:1": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xff2e46, simbolo: "♠", dim: .5, arco: .3, dur: 380, ruota: .5 }); ar.simboli(ar.pos(1 - l), "?", "#ffe066", { n: 3 }); },
    "lasombra:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("soldi", 1800); ar.schermo("rosso", 1200); const semi = ["♠", "♥", "♦", "♣"]; const d = ar.pos(1 - l);
      for (let k = 0; k < 8; k++) { ar.proiettile(ar.pos(l), d.clone().add(V((Math.random() - .5) * .8, (Math.random() - .5) * .5, 0)), { colore: k % 2 ? 0xff2e46 : 0xf4ece8, simbolo: semi[k % 4], dim: .45, arco: (Math.random() - .5) * 2, dur: 420, ruota: .4 }); await ar.attendi(60); }
      await ar.attendi(400); ar.lampo(0xf2c14e, 8, d); ar.scossa = .35; },

    // ---- Samulett Potter ----
    "samulett:0": async (ar, l) => { await ar.raggio(ar.pos(l), ar.pos(1 - l), { colore: 0xff3344, spessore: .08, dur: 380 }); ar.esplosione(ar.pos(1 - l), 0xff3344, 26, { velocita: 2 }); ar.simboli(ar.pos(1 - l), "✧", "#ffd0d0", { n: 3, dim: .25 }); },
    "samulett:1": async (ar, l) => { ar.simboli(ar.pos(l), "⚡", "#f2c14e", { n: 2, dim: .35 }); await ar.salto(l, { h: 2, giri: 1, colore: 0xf2c14e }); ar.fendente(ar.pos(1 - l), { colore: 0xf2c14e, rot: 2.3, scala: 1.1 }); },
    "samulett:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("incanto", 2000); ar.luceScena(0x2a1a04, { intensita: .25, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l), mezzo = a.clone().lerp(d, .55);
      await Promise.all([ar.raggio(a, mezzo, { colore: 0xff3344, spessore: .14, dur: 520 }), ar.raggio(d, mezzo, { colore: 0x4fd38a, spessore: .14, dur: 520 })]);
      ar.esplosione(mezzo, 0xf2c14e, 70, { velocita: 3 }); ar.lampo(0xf2c14e, 9, mezzo); await ar.attendi(200);
      await ar.raggio(a, d, { colore: 0xf2c14e, spessore: .24, dur: 520 }); ar.esplosione(d, 0xffe9a8, 80, { velocita: 3.5 }); ar.scossa = .45; },
    // ---- Mauriziente ----
    "mauriziente:0": async (ar, l) => { await ar.proiettile(ar.pos(l).add(V(0, .4, 0)), ar.pos(1 - l), { colore: 0xdfe8ff, simbolo: "✧", dim: .45, arco: .4, dur: 380, ruota: .3 }); ar.lampo(0xdfe8ff, 4, ar.pos(1 - l)); },
    "mauriziente:1": async (ar, l) => { const p = ar.pos(l); ar.ondaTerra(p, 0x9fd8ff, 4); ar.simboli(p, "✦", "#9fd8ff", { n: 5, dim: .3, su: 1.6 }); await ar.orbita(l, { colore: 0x9fd8ff, testo: "✦", n: 6, dur: 900, raggio: .9 }); },
    "mauriziente:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a45"); ar.schermo("incanto", 2200); ar.schermo("sole", 1600); ar.luceScena(0xff7a45, { intensita: .7, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0xff7a45, { alt: 3, larg: .4, dur: 600 });
      await ar.proiettile(a.clone().add(V(0, 1.4, 0)), d, { colore: 0xff7a45, dim: 1.2, arco: 2.2, dur: 760 });
      ar.esplosione(d, 0xff7a45, 90, { velocita: 3.4, su: 1.5, durata: 1200 }); ar.esplosione(d, 0xffe066, 40, { velocita: 1.5, su: 2.5, gravita: -.6, durata: 1300 }); ar.colonna(d, 0xff7a45, { alt: 4, larg: .6 }); ar.lampo(0xff7a45, 9, d); ar.scossa = .4; },
    // ---- Simoldemort ----
    "simoldemort:0": async (ar, l) => { await ar.raggio(ar.pos(l), ar.pos(1 - l), { colore: 0x2fd47a, spessore: .07, dur: 360 }); ar.esplosione(ar.pos(1 - l), 0x2fd47a, 30, { velocita: 1.8 }); await ar.getto(ar.pos(1 - l), ar.pos(l), { colore: 0x2fd47a, dur: 380, densita: 3, dimensione: .1, apertura: .1 }); },
    "simoldemort:1": async (ar, l) => { const d = ar.pos(1 - l); ar.colonna(d, 0x0a3a1a, { alt: 3.5, larg: .55 }); await ar.simboli(d.clone().add(V(0, .8, 0)), "☠", "#2fd47a", { n: 1, dim: .9, su: 1, durata: 1100 }); ar.esplosione(d, 0x2fd47a, 24, { velocita: .8, su: -.6, gravita: 1.5, durata: 900 }); },
    "simoldemort:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2fd47a"); ar.schermo("marchio", 2200); ar.schermo("buio", 1700); ar.luceScena(0x0a2a14, { intensita: .12, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.orbita(l, { colore: 0x2fd47a, testo: "☠", n: 5, dur: 700, raggio: .9 });
      await ar.fulmine(a, d, { colore: 0x2fd47a, volte: 4, spessore: 1.4 });
      await ar.raggio(a, d, { colore: 0x2fd47a, spessore: .28, dur: 600 }); ar.esplosione(d, 0x2fd47a, 100, { velocita: 3.6 }); ar.lampo(0x2fd47a, 10, d); ar.scossa = .5; },
    // ---- Pipverus Piton ----
    "pipverus:0": async (ar, l) => { const d = ar.pos(1 - l); ar.fendente(d, { colore: 0x9b7bff, rot: 2.2, scala: .9 }); await ar.attendi(120); ar.fendente(d, { colore: 0x4a3a6a, rot: .9, scala: .9 }); ar.esplosione(d, 0x6a5a9a, 20, { velocita: 1.6 }); await ar.attendi(250); },
    "pipverus:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l), d, { colore: 0x9b4dff, dim: .4, arco: 1.6, dur: 520 }); ar.esplosione(d, 0x7dff6b, 46, { velocita: .9, su: 2.2, gravita: -.5, durata: 1200, dimensione: .18 }); ar.simboli(d, "☠", "#7dff6b", { n: 2, dim: .3 }); },
    "pipverus:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a5a9a"); ar.schermo("buio", 1800); ar.schermo("viola", 1500); ar.luceScena(0x0a0814, { intensita: .1, dur: 1900 }); const t = await ar.teletrasporto(l, { colore: 0x1a1424, dietro: true }); if (!t) return;
      const d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.fendente(d.clone().add(V((k - 1) * .2, 0, 0)), { colore: k === 1 ? 0xffffff : 0x9b7bff, rot: 2.1 + k * .5, scala: 1.7, dur: 480 }); await ar.attendi(90); }
      ar.lampo(0x9b7bff, 8, d); ar.esplosione(d, 0x9b7bff, 60, { velocita: 3 }); ar.scossa = .4; await ar.attendi(400); await t.torna(); },
    // ---- Vikatrix Lestrange ----
    "vikatrix:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xd0d0e0, simbolo: "†", dim: .5, arco: .2, dur: 300, ruota: .8 }); ar.esplosione(ar.pos(1 - l), 0xb866ff, 22, { velocita: 2 }); },
    "vikatrix:1": async (ar, l) => { ar.simboli(ar.pos(l), "HA!", "#ff6bd6", { n: 3, dim: .4, su: 1.4 }); await ar.attendi(250); await ar.scatto(l, { k: .88, andata: 140, colore: 0xb866ff, ruota: .6 }); ar.fendente(ar.pos(1 - l), { colore: 0xff6bd6, rot: 2.6, scala: 1.1 }); },
    "vikatrix:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("viola", 2000); ar.schermo("ubriaco", 1600); ar.luceScena(0x2a0a3a, { intensita: .15, dur: 2000 }); await ar.cloni(l, { n: 3, colore: 0xb866ff, dur: 600, carica: true });
      await ar.missili(ar.pos(l), ar.pos(1 - l), { n: 6, colore: 0xb866ff, dur: 520 }); ar.simboli(ar.pos(1 - l), "HA!", "#ff6bd6", { n: 4, dim: .45 });
      await ar.fulmine(ar.pos(l), ar.pos(1 - l), { colore: 0xff6bd6, volte: 2 }); ar.lampo(0xb866ff, 8, ar.pos(1 - l)); ar.scossa = .4; },
    // ---- Alessmione Granger ----
    "alessmione:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l), d, { colore: 0xffe9a8, simbolo: "✧", dim: .4, arco: .6, dur: 400 }); const u = ar._u(1 - l); if (u && !u.occupata) { u.occupata = true; const y0 = u.gruppo.position.y; await ar.anima(500, t => { u.gruppo.position.y = y0 + Math.sin(t * Math.PI) * .6; }); u.occupata = false; } },
    "alessmione:1": async (ar, l) => { const p = ar.pos(l); ar.ondaTerra(p, 0x9fd8ff, 3); ar.simboli(p, "◇", "#9fd8ff", { n: 4, dim: .3 }); await ar.orbita(l, { colore: 0x9fd8ff, testo: "◇", n: 6, dur: 800, raggio: .85 }); },
    "alessmione:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("incanto", 2000); ar.luceScena(0xf2c14e, { intensita: .6, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l), lettere = ["A", "Ω", "Σ", "λ", "π", "∞", "?", "!"];
      for (let k = 0; k < 8; k++) { ar.proiettile(a.clone().add(V((Math.random() - .5) * 1.2, .5 + Math.random(), 0)), d.clone().add(V((Math.random() - .5) * .6, 0, 0)), { colore: 0xffe9a8, simbolo: lettere[k], dim: .45, arco: (Math.random() - .5) * 1.6, dur: 480, ruota: .3 }); await ar.attendi(70); }
      await ar.attendi(420); ar.esplosione(d, 0xf2c14e, 70, { velocita: 3 }); ar.lampo(0xf2c14e, 8, d); ar.scossa = .35; },
    // ---- Seneverr McGrannit ----
    "seneverr:0": async (ar, l) => { await ar.scatto(l, { k: .75, andata: 160, colore: 0xdfe8ff }); ar.fendente(ar.pos(1 - l), { colore: 0xdfe8ff, rot: 1.6, scala: .6 }); },
    "seneverr:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "MIAO", "#bfe8c8", { n: 1, dim: .45, su: 1.4 }); await ar.vortice(l, { giri: 2, dur: 650, colore: 0x4fd38a }); ar.ondaTerra(p, 0x4fd38a, 3); },
    "seneverr:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fd38a"); ar.schermo("terremoto", 1800); ar.luceScena(0x1a2a1a, { intensita: .3, dur: 1800 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.colonna(V(d.x + (k - 1.5) * .55, 0, d.z + .5), 0xa0a0a0, { alt: 2.2, larg: .3, dur: 900 }); ar.ondaTerra(V(d.x + (k - 1.5) * .55, .05, d.z + .5), 0xa0a0a0, 2); await ar.attendi(140); }
      await ar.attendi(250); ar.ondaTerra(d, 0x4fd38a, 7); ar.esplosione(d, 0xc0c0c0, 70, { velocita: 2.6, gravita: 3 }); ar.lampo(0x4fd38a, 7, d); ar.scossa = .5; },
    // ---- Diegirius Black ----
    "diegirius:0": async (ar, l) => { await ar.scatto(l, { k: .9, andata: 120, colore: 0x3a3a4a }); const d = ar.pos(1 - l); ar.fendente(d, { colore: 0xffffff, rot: .4, scala: .7 }); ar.fendente(d, { colore: 0xffffff, rot: -.4 + Math.PI, scala: .7 }); },
    "diegirius:1": async (ar, l) => { const p = ar.pos(l); ar.esplosione(V(p.x, .1, p.z), 0x2a2a3a, 50, { velocita: 1, su: 1.6, gravita: -.3, durata: 1200, dimensione: .26 }); ar.simboli(p, "!", "#ff7a45", { n: 2, dim: .4 }); await ar.crescita(l, { scala: 1.25, dur: 600, colore: 0x6a6a8a }); },
    "diegirius:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a8aa8"); ar.schermo("luna", 1900); ar.luceScena(0x0a0a1a, { intensita: .12, dur: 1900 }); ar.simboli(ar.pos(l), "AUUU", "#bfd8ff", { n: 1, dim: .5 });
      await ar.salto(l, { h: 2.2, giri: 1, colore: 0x8a8aa8 }); const d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.fendente(d, { colore: k === 1 ? 0xff7a45 : 0xffffff, rot: 1.2 + k * .8, scala: 1.4 }); await ar.attendi(110); }
      ar.lampo(0xffffff, 7, d); ar.scossa = .45; },
    // ---- Ludraco Malfoy ----
    "ludraco:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l), d, { colore: 0x4fd38a, dim: .35, arco: .4, dur: 360 }); ar.simboli(d, "~", "#9dffc0", { n: 4, dim: .35 }); const u = ar._u(1 - l); if (u && !u.occupata) { u.occupata = true; const r0 = u.gruppo.rotation.z; await ar.anima(500, t => { u.gruppo.rotation.z = r0 + Math.sin(t * 18) * .18 * (1 - t); }); u.occupata = false; } },
    "ludraco:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a, "S", "#2fd47a", { n: 1, dim: .5 }); await ar.linea(a, d, 0x2fd47a, { dur: 650, spessore: .06, onde: .9 }); ar.fendente(d, { colore: 0x2fd47a, rot: 2, scala: .8 }); },
    "ludraco:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2fd47a"); ar.schermo("verde", 1800); ar.luceScena(0x0a2a14, { intensita: .2, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { await ar.proiettile(a.clone().add(V(0, .4, 0)), d.clone().add(V((k - 1.5) * .2, 0, 0)), { colore: 0x2fd47a, simbolo: "S", dim: .5, arco: (k % 2 ? 1 : -1) * .9, dur: 300, ruota: .4 }); ar.esplosione(d, 0x2fd47a, 16, { velocita: 1.6 }); }
      ar.lampo(0xc0c0c0, 7, d); ar.scossa = .3; },
    // ---- Ritadora Tonks ----
    "ritadora:0": async (ar, l) => { await ar.getto(ar.pos(l), ar.pos(1 - l), { colore: 0xff6bd6, dur: 500, densita: 4, dimensione: .1, apertura: .2 }); ar.esplosione(ar.pos(1 - l), 0xffffff, 16, { velocita: 1.6 }); },
    "ritadora:1": async (ar, l) => { const p = ar.pos(l); for (const c of [0xff6bd6, 0x3fd8ff, 0xf2c14e, 0xb866ff]) ar.esplosione(p, c, 14, { velocita: 1.4, su: 1.2 }); await ar.vortice(l, { giri: 3, dur: 700, colore: 0xff6bd6 }); },
    "ritadora:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6bd6"); ar.schermo("velocita", 1600); ar.luceScena(0xff6bd6, { intensita: .6, dur: 1700 }); const t = await ar.teletrasporto(l, { colore: 0xff6bd6, dietro: false }); if (!t) return;
      const d = ar.pos(1 - l); await ar.fulmine(t.u.gruppo.position.clone(), d, { colore: 0xff6bd6, volte: 3 }); ar.esplosione(d, 0xff6bd6, 60, { velocita: 3 }); ar.lampo(0xff6bd6, 8, d); ar.scossa = .35; await ar.attendi(300); await t.torna(); },
    // ---- Lollon Weasley ----
    "lollon:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.esplosione(a.clone().add(V(0, .4, 0)), 0xff9a1f, 14, { velocita: 1.2 }); await ar.proiettile(a, d, { colore: 0xff9a1f, dim: .45, arco: (Math.random() < .5 ? -1 : 1) * 1.8, dur: 460 }); ar.esplosione(d, 0xff9a1f, 30, { velocita: 2.2 }); ar.simboli(a, "?!", "#ffe066", { n: 1, dim: .35 }); },
    "lollon:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.pioggia(d, { colore: 0x9dffc0, testo: "@", n: 12, dur: 700, larg: 1.2 }); ar.simboli(d, "@", "#7dff6b", { n: 3, dim: .35 }); },
    "lollon:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff9a1f"); ar.schermo("terremoto", 1800); ar.luceScena(0x2a1a0a, { intensita: .3, dur: 1800 }); const d = ar.pos(1 - l);
      await ar.proiettile(V(d.x - 2, 5, d.z - 1), d, { colore: 0xf4ece8, simbolo: "♜", dim: 1.1, arco: .2, dur: 500, scia: false }); ar.ondaTerra(d, 0xf4ece8, 6); ar.scossa = .35;
      await ar.proiettile(V(d.x + 2, 5, d.z - 1), d, { colore: 0xf2c14e, simbolo: "♛", dim: 1.2, arco: .2, dur: 480, scia: false }); ar.ondaTerra(d, 0xf2c14e, 8); ar.esplosione(d, 0xf2c14e, 70, { velocita: 3 }); ar.lampo(0xf2c14e, 8, d); ar.scossa = .55; },
    // ---- Ginice Weasley ----
    "ginice:0": async (ar, l) => { const a = ar.pos(l).add(V(0, .4, 0)), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.proiettile(a, d, { colore: 0x6a6a8a, simbolo: "ᴥ", dim: .35, arco: (k - 1) * 1.3, dur: 440 }); await ar.attendi(90); } await ar.attendi(380); ar.esplosione(d, 0x9fd8ff, 20, { velocita: 1.6 }); },
    "ginice:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 2; k++) { await ar.proiettile(a, d, { colore: 0x5a4a3a, dim: .5, arco: .3, dur: 330 }); ar.esplosione(d, 0xffb347, 22, { velocita: 2.2 }); ar.scossa = .15; } },
    "ginice:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("velocita", 1600); ar.luceScena(0x3a0a0a, { intensita: .3, dur: 1700 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.salto(l, { h: 1.6, giri: 0, sulBersaglio: false, colore: 0xff2e46 }); await ar.proiettile(a.clone().add(V(0, .6, 0)), d, { colore: 0xff2e46, dim: 1, arco: 1.2, dur: 520 });
      ar.esplosione(d, 0xff2e46, 80, { velocita: 3.4 }); ar.ondaTerra(d, 0xff2e46, 6); ar.lampo(0xff2e46, 8, d); ar.scossa = .45; },
    // ---- Tizievil Paciock ----
    "tizievil:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.linea(V(d.x - .8, 0, d.z + .6), d.clone(), 0x4fd38a, { dur: 450, spessore: .07, onde: .6 }); ar.fendente(d, { colore: 0x7dff6b, rot: 1.2, scala: .8 }); ar.esplosione(d, 0x7dff6b, 18, { velocita: 1.4 }); },
    "tizievil:1": async (ar, l) => { const p = ar.pos(l); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; ar.esplosione(V(p.x + Math.cos(a) * .7, .1, p.z + Math.sin(a) * .45), 0x4fd38a, 6, { velocita: .5, su: 2.4, gravita: -.4, durata: 1000 }); } ar.simboli(p, "❦", "#7dff6b", { n: 5, dim: .3, su: 1.5 }); await ar.colonna(p, 0x4fd38a, { alt: 2.6 }); },
    "tizievil:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("dorato", 1800); ar.luceScena(0xf2c14e, { intensita: .7, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(V(a.x, 5, a.z), a.clone().add(V(0, .6, 0)), { colore: 0xffe9a8, simbolo: "†", dim: 1, arco: 0, dur: 450, scia: true }); ar.lampo(0xf2c14e, 8, a);
      await ar.scatto(l, { k: .85, andata: 160, colore: 0xf2c14e }); ar.fendente(d, { colore: 0xf2c14e, rot: 2.2, scala: 2, dur: 520 }); ar.esplosione(d, 0xffe9a8, 60, { velocita: 3 }); ar.scossa = .45;
      await ar.getto(d, a, { colore: 0x7dff6b, dur: 450, densita: 4 }); },
    // ---- Auroruna ----
    "auroruna:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0xdfe8ff, simbolo: "☾", dim: .5, arco: .6, dur: 440, ruota: .2 }); ar.esplosione(ar.pos(1 - l), 0xdfe8ff, 20, { velocita: 1.4 }); },
    "auroruna:1": async (ar, l) => { const d = ar.pos(1 - l); ar.esplosione(d, 0xffffff, 30, { velocita: .7, su: .6, gravita: 0, durata: 1300, dimensione: .14 }); ar.simboli(d, "?", "#dfe8ff", { n: 4, dim: .35 }); await ar.orbita(1 - l, { colore: 0xb866ff, testo: "✧", n: 5, dur: 800, raggio: .8 }); },
    "auroruna:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#bfd8ff"); ar.schermo("patrono", 2200); ar.luceScena(0xdfe8ff, { intensita: 1, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.esplosione(a.clone().add(V(0, .5, 0)), 0xdfe8ff, 50, { velocita: 1.5, su: 1.5, gravita: -.3, durata: 1200 }); let p = a.clone().add(V(0, .5, 0));
      for (let k = 1; k <= 3; k++) { const q = a.clone().lerp(d, k / 3); q.y = d.y; await ar.proiettile(p, q, { colore: 0xbfe8ff, dim: 1, arco: 1.3, dur: 380 }); ar.ondaTerra(V(q.x, .05, q.z), 0xbfe8ff, 3); p = q; }
      ar.esplosione(d, 0xdfe8ff, 80, { velocita: 3 }); ar.lampo(0xdfe8ff, 10, d); ar.scossa = .35; },
    // ---- Giulifleur ----
    "giulifleur:0": async (ar, l) => { await ar.getto(ar.pos(l), ar.pos(1 - l), { colore: 0x4c95ff, dur: 600, densita: 5, dimensione: .16 }); ar.esplosione(ar.pos(1 - l), 0x9fd8ff, 20, { velocita: 1.6 }); },
    "giulifleur:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "✧", "#bfd8ff", { n: 5, dim: .3, su: 1.5 }); ar.ondaTerra(p, 0x4c95ff, 3); await ar.orbita(l, { colore: 0x9fd8ff, testo: "♥", n: 5, dur: 800, raggio: .85 }); },
    "giulifleur:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4c95ff"); ar.schermo("incanto", 2000); ar.luceScena(0x4c95ff, { intensita: .6, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0x4c95ff, { alt: 3.5, larg: .45, dur: 700 });
      for (const c of [0xff3344, 0x4fd38a, 0x4c95ff]) { ar.proiettile(a.clone().add(V(0, 1.2, 0)), d, { colore: c, dim: .7, arco: 1.4, dur: 560 }); await ar.attendi(140); }
      await ar.attendi(420); ar.esplosione(d, 0x9fd8ff, 80, { velocita: 3.2 }); ar.lampo(0x4c95ff, 8, d); ar.scossa = .4; },

    // ================= DEMONI =================
    // ---- Lollifer ----
    "lollifer:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 150, colore: 0xff2e2e }); const d = ar.pos(1 - l); for (let k = 0; k < 3; k++) ar.fendente(d.clone().add(V((k - 1) * .15, 0, 0)), { colore: 0xff3a2a, rot: 2.2, scala: .8 }); ar.esplosione(d, 0xff3a2a, 24, { velocita: 2 }); },
    "lollifer:1": async (ar, l) => { const p = ar.pos(l); ar.esplosione(p.clone().add(V(0, .5, 0)), 0x1a0a0a, 50, { velocita: 1.2, su: 1.2, gravita: .4, durata: 1200, dimensione: .22 }); await ar.salto(l, { h: 2.2, giri: 0, colore: 0x2a0a0a }); ar.fendente(ar.pos(1 - l), { colore: 0xff2e2e, rot: 1.8, scala: 1.3 }); ar.lampo(0xff2e2e, 5, ar.pos(1 - l)); },
    "lollifer:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e2e"); ar.schermo("inferno", 2200); ar.schermo("rosso", 1600); ar.luceScena(0x3a0404, { intensita: .2, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.orbita(l, { colore: 0xff2e2e, testo: "♆", n: 4, dur: 600, raggio: .9 });
      await ar.proiettile(V(d.x, 6, d.z), d, { colore: 0xff2e2e, dim: 1.5, arco: 0, dur: 600 });
      ar.ondaTerra(d, 0xff2e2e, 9); ar.colonna(d, 0xff3a2a, { alt: 4.5, larg: .7 }); ar.esplosione(d, 0xff3a2a, 110, { velocita: 3.8, su: 1.4, durata: 1300 }); ar.esplosione(d, 0x1a0a0a, 40, { velocita: 1.4, su: 2, gravita: -.4, durata: 1400, dimensione: .2 }); ar.lampo(0xff2e2e, 10, d); ar.scossa = .55; },
    // ---- Samuzebub ----
    "samuzebub:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V(0, .4, 0)), d.clone().add(V((Math.random() - .5) * .5, 0, 0)), { colore: 0x3a3a2a, simbolo: "•", dim: .25, arco: (Math.random() - .5) * 2, dur: 420 }); await ar.attendi(50); } await ar.attendi(350); ar.esplosione(d, 0x6a6a3a, 20, { velocita: 1.6 }); },
    "samuzebub:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "♛", "#f2c14e", { n: 2, dim: .4, su: 1.4 }); ar.ondaTerra(p, 0xf2c14e, 3); await ar.orbita(l, { colore: 0x6a6a3a, testo: "•", n: 10, dur: 900, raggio: .9 }); },
    "samuzebub:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c9a13a"); ar.schermo("buio", 2000); ar.schermo("corona", 1600); ar.luceScena(0x1a1404, { intensita: .15, dur: 2000 }); const d = ar.pos(1 - l);
      await ar.pioggia(d, { colore: 0x4a4a2a, testo: "•", n: 30, dur: 900, larg: 1.6 });
      await ar.vortice(1 - l, { giri: 3, dur: 700, colore: 0x6a6a3a });
      ar.esplosione(d, 0xc9a13a, 80, { velocita: 3 }); ar.simboli(d, "♛", "#f2c14e", { n: 3, dim: .5 }); ar.lampo(0xc9a13a, 8, d); ar.scossa = .4; },
    // ---- Simothan ----
    "simothan:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); await ar.linea(a, d, 0x1fb3c4, { dur: 420, spessore: .1, onde: .7 }); ar.fendente(d, { colore: 0x3fd8ff, rot: .6, scala: 1 }); ar.esplosione(d, 0x3fd8ff, 26, { velocita: 2 }); },
    "simothan:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "◆", "#3fd8ff", { n: 5, dim: .3 }); await ar.orbita(l, { colore: 0x1fb3c4, testo: "◆", n: 8, dur: 800, raggio: .85 }); ar.ondaTerra(p, 0x1fb3c4, 3); },
    "simothan:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#1fb3c4"); ar.schermo("mare", 2200); ar.schermo("terremoto", 1600); ar.luceScena(0x04202a, { intensita: .2, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { ar.colonna(V(d.x + (k - 1) * .6, 0, d.z + .4), 0x1fb3c4, { alt: 3, larg: .35, dur: 900 }); await ar.attendi(130); }
      await ar.getto(a, d, { colore: 0x3fd8ff, dur: 700, densita: 8, dimensione: .2, apertura: .35 });
      ar.ondaTerra(d, 0x3fd8ff, 9); ar.esplosione(d, 0x9fefff, 100, { velocita: 3.4, gravita: 3 }); ar.lampo(0x1fb3c4, 9, d); ar.scossa = .55; },
    // ---- Alissith ----
    "alissith:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); await ar.proiettile(a, d, { colore: 0xb866ff, simbolo: "♥", dim: .45, arco: .5, dur: 380 }); ar.esplosione(d, 0xb866ff, 22, { velocita: 1.6 }); await ar.getto(d, a, { colore: 0xd08cff, dur: 380, densita: 3, dimensione: .1, apertura: .1 }); },
    "alissith:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "☾", "#d08cff", { n: 3, dim: .4 }); ar.esplosione(d, 0x2a0a3a, 40, { velocita: .6, su: .4, gravita: 0, durata: 1300, dimensione: .2 }); await ar.orbita(1 - l, { colore: 0xb866ff, testo: "✧", n: 6, dur: 800, raggio: .8 }); },
    "alissith:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("luna", 2200); ar.schermo("viola", 1700); ar.luceScena(0x14041e, { intensita: .1, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(a.clone().add(V(0, 2.5, 0)), a.clone().add(V(0, 1.6, 0)), { colore: 0x2a0a3a, simbolo: "☾", dim: 1.3, arco: 0, dur: 500 });
      await ar.raggio(a.clone().add(V(0, 1.6, 0)), d, { colore: 0xb866ff, spessore: .26, dur: 620 }); ar.esplosione(d, 0xb866ff, 90, { velocita: 3.4 }); ar.lampo(0xb866ff, 9, d); ar.scossa = .45;
      await ar.getto(d, a, { colore: 0xd08cff, dur: 500, densita: 5 }); },
    // ---- Mauriphomet ----
    "mauriphomet:0": async (ar, l) => { await ar.scatto(l, { k: .88, andata: 140, colore: 0x8a5a3a, ruota: .1 }); ar.fendente(ar.pos(1 - l), { colore: 0xffb347, rot: 1.6, scala: .9 }); ar.esplosione(ar.pos(1 - l), 0x8a5a3a, 24, { velocita: 2.2 }); },
    "mauriphomet:1": async (ar, l) => { const d = ar.pos(1 - l); ar.colonna(d, 0x2a0a14, { alt: 3, larg: .5 }); await ar.simboli(d.clone().add(V(0, .7, 0)), "⛧", "#ff3a2a", { n: 1, dim: .9, su: 1, durata: 1000 }); ar.esplosione(d, 0x6a1a2a, 24, { velocita: .8, su: -.6, gravita: 1.5, durata: 900 }); },
    "mauriphomet:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6a2a"); ar.schermo("pentacolo", 2200); ar.schermo("calore", 1600); ar.luceScena(0x3a0a04, { intensita: .3, dur: 2100 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { const ang = k / 5 * Math.PI * 2 - Math.PI / 2; ar.colonna(V(d.x + Math.cos(ang) * .8, 0, d.z + Math.sin(ang) * .5), 0xff6a2a, { alt: 2.4, larg: .25, dur: 900 }); await ar.attendi(110); }
      await ar.attendi(200); ar.colonna(d, 0xff3a2a, { alt: 4.5, larg: .7 }); ar.esplosione(d, 0xff6a2a, 90, { velocita: 3.2, su: 1.6, durata: 1200 }); ar.lampo(0xff6a2a, 9, d); ar.scossa = .45; },
    // ---- Ludomodeus ----
    "ludomodeus:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♥", "#ff4f8a", { n: 3, dim: .3 }); await ar.proiettile(ar.pos(l), d, { colore: 0xff4f8a, dim: .45, arco: .8, dur: 400 }); ar.esplosione(d, 0xff4f8a, 22, { velocita: 1.8 }); },
    "ludomodeus:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .4, 0)), d, { colore: 0xffffff, simbolo: "⚅", dim: .7, arco: 1.4, dur: 520, ruota: 1.2 }); ar.esplosione(d, 0xf2c14e, 34, { velocita: 2.4 }); ar.simboli(d, Math.random() < .5 ? "6!" : "1?", "#f2c14e", { n: 1, dim: .45 }); },
    "ludomodeus:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff4f8a"); ar.schermo("ubriaco", 2000); ar.schermo("soldi", 1600); ar.luceScena(0x3a0a1a, { intensita: .25, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l), segni = ["♥", "♠", "♦", "♣"];
      for (let k = 0; k < 4; k++) { await ar.proiettile(a.clone().add(V(0, .5, 0)), d.clone().add(V((k - 1.5) * .2, 0, 0)), { colore: k % 2 ? 0x1a1a1a : 0xff2e46, simbolo: segni[k], dim: .6, arco: (k % 2 ? 1 : -1) * 1.1, dur: 300, ruota: .6 }); ar.esplosione(d, 0xff4f8a, 18, { velocita: 1.8 }); }
      ar.lampo(0xff4f8a, 8, d); ar.scossa = .4; },
    // ---- Tiziazel ----
    "tiziazel:0": async (ar, l) => { await ar.scatto(l, { k: .9, andata: 110, colore: 0x8a0a0a, ruota: .6 }); const d = ar.pos(1 - l); ar.fendente(d, { colore: 0xd0d0e0, rot: 2.4, scala: .9 }); ar.esplosione(d, 0xb01020, 18, { velocita: 1.8 }); },
    "tiziazel:1": async (ar, l) => { const p = ar.pos(l); ar.esplosione(V(p.x, .1, p.z), 0x1a0a0a, 60, { velocita: 1, su: 1.6, gravita: -.3, durata: 1300, dimensione: .28 }); await ar.attendi(400); },
    "tiziazel:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b01020"); ar.schermo("tagli", 1800); ar.schermo("buio", 1600); ar.luceScena(0x1a0404, { intensita: .1, dur: 1900 }); const t = await ar.teletrasporto(l, { colore: 0x1a0a0a, dietro: true }); if (!t) return;
      const d = ar.pos(1 - l); for (let k = 0; k < 4; k++) { ar.fendente(d.clone().add(V((k - 1.5) * .15, 0, 0)), { colore: k === 3 ? 0xffffff : 0xb01020, rot: 1.8 + k * .6, scala: 1.6, dur: 420 }); await ar.attendi(80); }
      ar.lampo(0xb01020, 8, d); ar.esplosione(d, 0xb01020, 60, { velocita: 3 }); ar.scossa = .45; await ar.attendi(350); await t.torna(); },
    // ---- Aurorrigan ----
    "aurorrigan:0": async (ar, l) => { await ar.proiettile(ar.pos(l), ar.pos(1 - l), { colore: 0x2a2a3a, simbolo: "➶", dim: .5, arco: .2, dur: 320, ruota: .2 }); ar.esplosione(ar.pos(1 - l), 0x6a6a8a, 18, { velocita: 1.8 }); },
    "aurorrigan:1": async (ar, l) => { await ar.missili(ar.pos(l), ar.pos(1 - l), { n: 6, colore: 0x1a1a24, dur: 520 }); ar.simboli(ar.pos(1 - l), "CRA", "#c0c0d0", { n: 2, dim: .35 }); },
    "aurorrigan:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e0203a"); ar.schermo("rosso", 2000); ar.schermo("luna", 1600); ar.luceScena(0x2a0408, { intensita: .15, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.cloni(l, { n: 3, colore: 0x1a1a24, dur: 600, carica: true });
      await ar.missili(a, d, { n: 10, colore: 0x1a1a24, dur: 600 }); ar.simboli(d, "CRA", "#c0c0d0", { n: 4, dim: .45 });
      await ar.raggio(a, d, { colore: 0xe0203a, spessore: .2, dur: 520 }); ar.esplosione(d, 0xe0203a, 80, { velocita: 3.2 }); ar.lampo(0xe0203a, 8, d); ar.scossa = .4; },
    // ---- Pipmon ----
    "pipmon:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); await ar.proiettile(a, d, { colore: 0xf2c14e, simbolo: "●", dim: .35, arco: .3, dur: 320, ruota: .8 }); ar.esplosione(d, 0xf2c14e, 16, { velocita: 1.6 }); await ar.getto(d, a, { colore: 0xffe066, dur: 340, densita: 2, dimensione: .1, apertura: .1 }); },
    "pipmon:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a, "$", "#f2c14e", { n: 3, dim: .4 }); await ar.linea(a, d, 0xf2c14e, { dur: 500, spessore: .05, onde: .5 }); ar.esplosione(d, 0xf2c14e, 26, { velocita: 2 }); await ar.getto(d, a, { colore: 0xffe066, dur: 400, densita: 4, dimensione: .12 }); },
    "pipmon:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("soldi", 2000); ar.schermo("oro", 1600); ar.luceScena(0x2a1a04, { intensita: .5, dur: 2000 }); const d = ar.pos(1 - l);
      await ar.pioggia(d, { colore: 0xf2c14e, testo: "●", n: 26, dur: 900, larg: 1.4 });
      ar.esplosione(d, 0xf2c14e, 70, { velocita: 3 }); ar.simboli(d, "$", "#ffe066", { n: 5, dim: .45 }); ar.lampo(0xf2c14e, 8, d); ar.scossa = .35; },
    // ---- Diegial ----
    "diegial:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 150, colore: 0xff3a2a }); ar.esplosione(ar.pos(1 - l), 0xff6a2a, 30, { velocita: 2.4 }); ar.scossa = .12; },
    "diegial:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "!!", "#ff3a2a", { n: 2, dim: .45 }); ar.colonna(p, 0xff3a2a, { alt: 2.6, larg: .4 }); await ar.crescita(l, { scala: 1.25, dur: 600, colore: 0xff3a2a }); },
    "diegial:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff3a2a"); ar.schermo("inferno", 1900); ar.schermo("crepe", 1500); ar.luceScena(0x3a0804, { intensita: .3, dur: 1900 }); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 2, giri: 1, colore: 0xff3a2a }); ar.ondaTerra(d, 0xff6a2a, 8);
      for (let k = 0; k < 3; k++) { ar.colonna(V(d.x + (k - 1) * .5, 0, d.z + .3), 0xff6a2a, { alt: 2.6, larg: .3, dur: 800 }); await ar.attendi(100); }
      ar.esplosione(d, 0xff3a2a, 90, { velocita: 3.4 }); ar.lampo(0xff3a2a, 9, d); ar.scossa = .5; },
    // ---- Ritacubus ----
    "ritacubus:0": async (ar, l) => { await ar.scatto(l, { k: .82, andata: 150, colore: 0xff6bd6, ruota: .5 }); ar.fendente(ar.pos(1 - l), { colore: 0xff6bd6, rot: 2, scala: .7 }); },
    "ritacubus:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♥", "#ff6bd6", { n: 4, dim: .35, su: 1.4 }); await ar.proiettile(ar.pos(l), d, { colore: 0xff6bd6, simbolo: "♥", dim: .6, arco: .6, dur: 420 }); await ar.orbita(1 - l, { colore: 0xff6bd6, testo: "♥", n: 5, dur: 700, raggio: .7 }); },
    "ritacubus:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6bd6"); ar.schermo("viola", 1800); ar.schermo("fiori", 1500); ar.luceScena(0x3a0a2a, { intensita: .3, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.vortice(l, { giri: 3, dur: 650, colore: 0xff6bd6 }); await ar.cloni(l, { n: 2, colore: 0xff6bd6, dur: 500, carica: true });
      await ar.fulmine(a, d, { colore: 0xff6bd6, volte: 2 }); ar.esplosione(d, 0xff6bd6, 60, { velocita: 2.8 }); ar.lampo(0xff6bd6, 7, d); ar.scossa = .3;
      await ar.getto(d, a, { colore: 0xff9be0, dur: 450, densita: 4 }); },
    // ---- Alistaroth ----
    "alistaroth:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l), d, { colore: 0xe0203a, simbolo: "◆", dim: .4, arco: .4, dur: 380, ruota: .4 }); ar.esplosione(d, 0xe0203a, 20, { velocita: 1.6 }); },
    "alistaroth:1": async (ar, l) => { const p = ar.pos(l); ar.ondaTerra(p, 0xe0203a, 3); ar.simboli(p, "◆", "#ff4f6a", { n: 4, dim: .3 }); await ar.orbita(l, { colore: 0xe0203a, testo: "◆", n: 7, dur: 800, raggio: .85 }); },
    "alistaroth:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e0203a"); ar.schermo("corona", 2000); ar.schermo("rosso", 1500); ar.luceScena(0x3a0408, { intensita: .3, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(a.clone().add(V(0, 1.2, 0)), d.clone().add(V(0, 1.4, 0)), { colore: 0xf2c14e, simbolo: "♛", dim: 1, arco: 1, dur: 600 });
      await ar.proiettile(d.clone().add(V(0, 1.4, 0)), d, { colore: 0xe0203a, dim: .9, arco: 0, dur: 260 });
      ar.ondaTerra(d, 0xe0203a, 7); ar.esplosione(d, 0xe0203a, 80, { velocita: 3 }); ar.lampo(0xe0203a, 8, d); ar.scossa = .4; },
    // ---- Giulimaah ----
    "giulimaah:0": async (ar, l) => { await ar.proiettile(ar.pos(l).add(V(0, .4, 0)), ar.pos(1 - l), { colore: 0xff4f6a, simbolo: "♪", dim: .5, arco: .8, dur: 400, ruota: .3 }); ar.esplosione(ar.pos(1 - l), 0xff4f6a, 18, { velocita: 1.6 }); },
    "giulimaah:1": async (ar, l) => { const a = ar.pos(l).add(V(0, .4, 0)), d = ar.pos(1 - l); for (const s of ["♪", "♫"]) { await ar.proiettile(a, d, { colore: 0xff4f6a, simbolo: s, dim: .55, arco: s === "♪" ? -1 : 1, dur: 340 }); ar.esplosione(d, 0xff4f6a, 16, { velocita: 1.8 }); } },
    "giulimaah:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff4f6a"); ar.schermo("rosso", 1800); ar.luceScena(0x3a0a14, { intensita: .3, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "♫", "#ff4f6a", { n: 6, dim: .4, su: 1.6 }); for (let k = 0; k < 3; k++) { ar.ondaTerra(a.clone().lerp(d, (k + 1) / 3), 0xff4f6a, 4); await ar.attendi(160); }
      ar.esplosione(d, 0xff4f6a, 70, { velocita: 3 }); ar.lampo(0xff4f6a, 7, d); ar.scossa = .35; },
    // ---- Vikamashtu ----
    "vikamashtu:0": async (ar, l) => { await ar.getto(ar.pos(l), ar.pos(1 - l), { colore: 0xff7a45, dur: 460, densita: 4, dimensione: .12, apertura: .15 }); ar.esplosione(ar.pos(1 - l), 0xffb347, 16, { velocita: 1.4 }); },
    "vikamashtu:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); await Promise.all([ar.proiettile(a, d, { colore: 0xff7a45, dim: .45, arco: -1, dur: 440 }), ar.proiettile(a, d, { colore: 0xffb347, dim: .45, arco: 1, dur: 440 })]); ar.esplosione(d, 0xff7a45, 34, { velocita: 1.2, su: 1.6, gravita: -.4, durata: 1000 }); },
    "vikamashtu:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a45"); ar.schermo("calore", 1800); ar.schermo("inferno", 1500); ar.luceScena(0xff4a1a, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.getto(a, d, { colore: 0xff7a45, dur: 800, densita: 8, dimensione: .2, apertura: .3 }); ar.colonna(d, 0xff7a45, { alt: 3.5, larg: .6 });
      ar.esplosione(d, 0xff7a45, 80, { velocita: 3, su: 1.5 }); ar.lampo(0xff7a45, 8, d); ar.scossa = .35; },
    // ---- Senecate ----
    "senecate:0": async (ar, l) => { await ar.scatto(l, { k: .78, andata: 170, colore: 0x2fd47a }); ar.esplosione(ar.pos(1 - l), 0x8a6a3a, 20, { velocita: 1.8 }); ar.simboli(ar.pos(1 - l), "📖", "#dfe8c8", { n: 1, dim: .4 }); },
    "senecate:1": async (ar, l) => { const p = ar.pos(l); for (let k = 0; k < 6; k++) { const ang = k / 6 * Math.PI * 2; ar.esplosione(V(p.x + Math.cos(ang) * .7, .1, p.z + Math.sin(ang) * .45), 0x2fd47a, 6, { velocita: .5, su: 2.4, gravita: -.4, durata: 1000 }); } ar.simboli(p, "❦", "#7dff6b", { n: 4, dim: .3, su: 1.5 }); await ar.colonna(p, 0x2fd47a, { alt: 2.6 }); },
    "senecate:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2fd47a"); ar.schermo("luna", 1900); ar.schermo("verde", 1500); ar.luceScena(0x0a2a14, { intensita: .25, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.proiettile(a.clone().add(V((k - 1) * .5, 1.4, 0)), d, { colore: 0xdfe8ff, simbolo: "☾", dim: .6, arco: (k - 1) * .8, dur: 360 }); ar.esplosione(d, 0x2fd47a, 22, { velocita: 1.8 }); }
      ar.lampo(0x2fd47a, 7, d); ar.scossa = .3; await ar.getto(d, a, { colore: 0x7dff6b, dur: 450, densita: 4 }); },
    // ================= MESTIERI =================
    // ---- Ludhacker ----
    "ludhacker:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 4; k++) { ar.proiettile(a.clone().add(V(0, .4, 0)), d, { colore: 0x39ff6a, simbolo: k % 2 ? "1" : "0", dim: .35, arco: (k - 1.5) * .6, dur: 380 }); await ar.attendi(60); } await ar.attendi(320); ar.esplosione(d, 0x39ff6a, 18, { velocita: 1.6 }); await ar.getto(d, a, { colore: 0x39ff6a, dur: 340, densita: 2, dimensione: .1, apertura: .1 }); },
    "ludhacker:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(d, "****", "#39ff6a", { n: 2, dim: .35 }); await ar.linea(a, d, 0x39ff6a, { dur: 520, spessore: .05, onde: .3 }); ar.esplosione(d, 0x39ff6a, 26, { velocita: 2 }); await ar.getto(d, a, { colore: 0x9dffb8, dur: 380, densita: 3, dimensione: .1 }); },
    "ludhacker:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#39ff6a"); ar.schermo("verde", 2200); ar.schermo("laser", 1500); ar.luceScena(0x042a0a, { intensita: .15, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.pioggia(d, { colore: 0x39ff6a, testo: "1", n: 24, dur: 800, larg: 1.4 }); ar.simboli(d, "ERROR", "#ff3344", { n: 2, dim: .45 });
      await ar.fulmine(a, d, { colore: 0x39ff6a, volte: 3 }); ar.esplosione(d, 0x39ff6a, 90, { velocita: 3.4 }); ar.lampo(0x39ff6a, 9, d); ar.scossa = .45; },
    // ---- Lollinista ----
    "lollinista:0": async (ar, l) => { const a = ar.pos(l).add(V(0, .4, 0)), d = ar.pos(1 - l); await ar.proiettile(a, d, { colore: 0xf4ece8, simbolo: "♩", dim: .6, arco: .7, dur: 400, ruota: .3 }); ar.esplosione(d, 0xf2c14e, 26, { velocita: 2 }); ar.ondaTerra(d, 0xf4ece8, 2); },
    "lollinista:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "♪", "#f2c14e", { n: 6, dim: .35, su: 1.6 }); await ar.orbita(l, { colore: 0xf2c14e, testo: "♫", n: 6, dur: 900, raggio: .9 }); ar.ondaTerra(p, 0xf2c14e, 3); },
    "lollinista:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("dorato", 2200); ar.schermo("corona", 1600); ar.luceScena(0x2a1a04, { intensita: .4, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l), note = ["♩", "♪", "♫", "♬"];
      for (let k = 0; k < 8; k++) { ar.proiettile(a.clone().add(V((Math.random() - .5) * 1.2, .5 + Math.random(), 0)), d.clone().add(V((Math.random() - .5) * .5, 0, 0)), { colore: k % 2 ? 0xf2c14e : 0xf4ece8, simbolo: note[k % 4], dim: .55, arco: (Math.random() - .5) * 1.6, dur: 460 }); await ar.attendi(70); }
      await ar.attendi(400); ar.ondaTerra(d, 0xf2c14e, 8); ar.esplosione(d, 0xf2c14e, 100, { velocita: 3.6 }); ar.lampo(0xf2c14e, 10, d); ar.scossa = .5; },
    // ---- Tiziegista ----
    "tiziegista:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "CIAK", "#f4ece8", { n: 1, dim: .5 }); await ar.scatto(l, { k: .8, andata: 150, colore: 0xf4ece8 }); ar.fendente(d, { colore: 0xf4ece8, rot: 0, scala: .9 }); },
    "tiziegista:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "☕", "#c08a5a", { n: 2, dim: .4 }); ar.ondaTerra(p, 0xf2c14e, 3); await ar.orbita(l, { colore: 0xf2c14e, testo: "✦", n: 6, dur: 800, raggio: .85 }); },
    "tiziegista:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f4ece8"); ar.schermo("bn", 2000); ar.schermo("bianco", 900); ar.luceScena(0xffffff, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d, "AZIONE!", "#f2c14e", { n: 1, dim: .6, su: 1.2 }); await ar.attendi(300);
      for (let k = 0; k < 3; k++) { await ar.proiettile(V(d.x + (k - 1) * 2, 5, d.z - 1), d, { colore: [0xff3344, 0xf2c14e, 0x3fd8ff][k], dim: .9, arco: .2, dur: 380 }); ar.esplosione(d, [0xff3344, 0xf2c14e, 0x3fd8ff][k], 40, { velocita: 2.6 }); }
      ar.lampo(0xffffff, 9, d); ar.scossa = .45; },
    // ---- Alispia ----
    "alispia:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l), d, { colore: 0xff2e46, spessore: .03, dur: 260 }); await ar.proiettile(ar.pos(l), d, { colore: 0xd0d0e0, dim: .2, arco: 0, dur: 160 }); ar.esplosione(d, 0xd0d0e0, 18, { velocita: 2 }); },
    "alispia:1": async (ar, l) => { const p = ar.pos(l); ar.esplosione(V(p.x, .1, p.z), 0x2a2a3a, 50, { velocita: 1, su: 1.4, gravita: -.3, durata: 1200, dimensione: .24 }); ar.simboli(p, "?", "#c0c0d0", { n: 3, dim: .35 }); await ar.attendi(400); },
    "alispia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("buio", 2000); ar.schermo("allarme", 1500); ar.luceScena(0x0a0408, { intensita: .1, dur: 2000 }); const t = await ar.teletrasporto(l, { colore: 0x1a1a24, dietro: true }); if (!t) return;
      const d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.raggio(t.u.gruppo.position.clone(), d.clone().add(V((k - 1) * .15, 0, 0)), { colore: 0xff2e46, spessore: .04, dur: 220 }); await ar.attendi(90); }
      ar.fendente(d, { colore: 0xffffff, rot: 2.3, scala: 1.8, dur: 460 }); ar.esplosione(d, 0xff2e46, 70, { velocita: 3 }); ar.lampo(0xff2e46, 8, d); ar.scossa = .45; await ar.attendi(350); await t.torna(); },
    // ---- Senebroker ----
    "senebroker:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "☎", "#f4ece8", { n: 2, dim: .4 }); await ar.proiettile(ar.pos(l), d, { colore: 0xf2c14e, dim: .4, arco: .5, dur: 380 }); ar.esplosione(d, 0xf2c14e, 20, { velocita: 1.8 }); },
    "senebroker:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "▼", "#ff3344", { n: 4, dim: .45, su: -.6 }); ar.esplosione(d, 0xff3344, 26, { velocita: .8, su: -.6, gravita: 1.5, durata: 900 }); await ar.attendi(500); },
    "senebroker:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("soldi", 2000); ar.schermo("oro", 1500); ar.luceScena(0x2a1a04, { intensita: .4, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d, "▼", "#ff3344", { n: 5, dim: .5, su: -.8 }); await ar.pioggia(d, { colore: 0x4fd38a, testo: "$", n: 20, dur: 800, larg: 1.3 });
      ar.esplosione(d, 0xf2c14e, 70, { velocita: 3 }); ar.lampo(0xf2c14e, 8, d); ar.scossa = .35; await ar.getto(d, a, { colore: 0xf2c14e, dur: 480, densita: 5 }); },
    // ---- Maurialpinista ----
    "maurialpinista:0": async (ar, l) => { await ar.scatto(l, { k: .8, andata: 160, colore: 0xe0a33a, ruota: .2 }); ar.fendente(ar.pos(1 - l), { colore: 0xc0c8d0, rot: 2.4, scala: .9 }); ar.esplosione(ar.pos(1 - l), 0xc0c8d0, 22, { velocita: 2 }); },
    "maurialpinista:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0xffd04a, testo: "∞", n: 5, dur: 800, raggio: .85 }); ar.ondaTerra(p, 0xffd04a, 3); },
    "maurialpinista:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#dfe8ff"); ar.schermo("tempesta", 2000); ar.schermo("terremoto", 1600); ar.luceScena(0xdfe8ff, { intensita: .7, dur: 2000 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.proiettile(V(d.x - 3 + Math.random(), 4 + Math.random() * 2, d.z - 1), d.clone().add(V((Math.random() - .5) * .8, 0, 0)), { colore: 0xf4f8ff, dim: .5 + Math.random() * .5, arco: .3, dur: 520 }); await ar.attendi(80); }
      await ar.attendi(400); ar.ondaTerra(d, 0xf4f8ff, 9); ar.esplosione(d, 0xf4f8ff, 110, { velocita: 3, gravita: 2.5, dimensione: .16 }); ar.lampo(0xdfe8ff, 9, d); ar.scossa = .55; },
    // ---- Pipciatore ----
    "pipciatore:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, -.3, 0)), d, { colore: 0xffffff, simbolo: "⚽", dim: .5, arco: 1.2, dur: 420, ruota: 1 }); ar.esplosione(d, 0xffffff, 22, { velocita: 2 }); },
    "pipciatore:1": async (ar, l) => { await ar.salto(l, { h: 1.8, giri: 1, colore: 0xf2c14e }); const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xffffff, simbolo: "⚽", dim: .55, arco: -.4, dur: 260, ruota: 1.4 }); ar.esplosione(d, 0xf2c14e, 34, { velocita: 2.6 }); ar.scossa = .15; },
    "pipciatore:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("velocita", 1800); ar.luceScena(0xf2c14e, { intensita: .5, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.scatto(l, { k: .5, andata: 200, colore: 0xf2c14e }); await ar.proiettile(a.clone().add(V(0, -.3, 0)), d, { colore: 0xffffff, simbolo: "⚽", dim: 1, arco: 1.6, dur: 520, ruota: 2 });
      ar.esplosione(d, 0xf2c14e, 90, { velocita: 3.4 }); ar.simboli(d, "GOL!", "#f2c14e", { n: 3, dim: .6 }); ar.lampo(0xf2c14e, 9, d); ar.scossa = .45; },
    // ---- Simonducer ----
    "simonducer:0": async (ar, l) => { const d = ar.pos(1 - l); ar.ondaTerra(ar.pos(l), 0xb866ff, 3); await ar.attendi(150); ar.ondaTerra(d, 0xb866ff, 3); ar.esplosione(d, 0xb866ff, 20, { velocita: 1.8 }); ar.scossa = .1; },
    "simonducer:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a, "♪", "#b866ff", { n: 3, dim: .35 }); await ar.attendi(200); await ar.raggio(a, d, { colore: 0xb866ff, spessore: .14, dur: 380 }); ar.ondaTerra(d, 0xb866ff, 5); ar.esplosione(d, 0xff4fd8, 34, { velocita: 2.4 }); ar.scossa = .2; },
    "simonducer:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("disco", 2200); ar.schermo("viola", 1500); ar.luceScena(0x2a0a3a, { intensita: .4, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.ondaTerra(d, [0xb866ff, 0xff4fd8, 0x3fd8ff, 0xf2c14e][k], 4 + k); ar.esplosione(d, [0xb866ff, 0xff4fd8, 0x3fd8ff, 0xf2c14e][k], 20, { velocita: 2 }); ar.scossa = .18; await ar.attendi(230); }
      ar.simboli(d, "DROP", "#ff4fd8", { n: 2, dim: .5 }); ar.lampo(0xb866ff, 8, d); ar.scossa = .4; },
    // ---- Diegarman ----
    "diegarman:0": async (ar, l) => { const p = ar.pos(l); const u = ar._u(l); if (u && !u.occupata) { u.occupata = true; const r0 = u.gruppo.rotation.z; await ar.anima(360, t => { u.gruppo.rotation.z = r0 + Math.sin(t * 30) * .12; }); u.gruppo.rotation.z = r0; u.occupata = false; } await ar.proiettile(p, ar.pos(1 - l), { colore: 0xff4f8a, simbolo: "🍸", dim: .5, arco: .8, dur: 380 }); ar.esplosione(ar.pos(1 - l), 0xff4f8a, 20, { velocita: 1.8 }); },
    "diegarman:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l), d, { colore: 0xff7a45, dim: .45, arco: 1.4, dur: 480 }); ar.colonna(d, 0xff7a45, { alt: 2.4, larg: .4 }); ar.esplosione(d, 0xff7a45, 40, { velocita: 1.2, su: 1.8, gravita: -.4, durata: 1000 }); },
    "diegarman:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff4f8a"); ar.schermo("calore", 1800); ar.schermo("ubriaco", 1500); ar.luceScena(0x3a0a14, { intensita: .3, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l), bic = ["🍸", "🍹", "🍺", "🥂"];
      for (let k = 0; k < 4; k++) { await ar.proiettile(a.clone().add(V(0, .4, 0)), d.clone().add(V((k - 1.5) * .2, 0, 0)), { colore: 0xff4f8a, simbolo: bic[k], dim: .6, arco: (k % 2 ? 1 : -1) * 1.2, dur: 300 }); ar.esplosione(d, 0xff7a45, 18, { velocita: 1.8 }); }
      ar.lampo(0xff4f8a, 8, d); ar.scossa = .35; },
    // ---- Samutografo ----
    "samutografo:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "📷", "#f4ece8", { n: 1, dim: .45 }); ar.lampo(0xffffff, 5, ar.pos(l)); await ar.raggio(ar.pos(l), d, { colore: 0xffffff, spessore: .08, dur: 260 }); ar.esplosione(d, 0xffffff, 18, { velocita: 1.6 }); },
    "samutografo:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("bianco", 500); ar.lampo(0xffffff, 10, d); ar.simboli(d, "✷", "#ffffff", { n: 4, dim: .4 }); await ar.orbita(1 - l, { colore: 0xffffff, testo: "★", n: 4, dur: 700, raggio: .6 }); },
    "samutografo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff9a1f"); ar.schermo("bianco", 700); ar.luceScena(0xffffff, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.lampo(0xffffff, 7, d); await ar.raggio(a, d.clone().add(V((k - 1.5) * .15, 0, 0)), { colore: 0xffffff, spessore: .1, dur: 200 }); ar.esplosione(d, 0xff9a1f, 18, { velocita: 2 }); await ar.attendi(80); }
      ar.simboli(d, "📷", "#ff9a1f", { n: 3, dim: .5 }); ar.scossa = .3; },
    // ---- Alessiologa ----
    "alessiologa:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l), d, { colore: 0x7dff6b, simbolo: "⚗", dim: .45, arco: 1.2, dur: 440, ruota: .6 }); ar.esplosione(d, 0x7dff6b, 30, { velocita: 1, su: 1.5, gravita: -.4, durata: 1000 }); },
    "alessiologa:1": async (ar, l) => { const d = ar.pos(1 - l); ar.esplosione(d, 0x7dff6b, 40, { velocita: .6, su: .6, gravita: 0, durata: 1300, dimensione: .14 }); ar.simboli(d, "🦠", "#7dff6b", { n: 3, dim: .4 }); await ar.orbita(1 - l, { colore: 0x7dff6b, testo: "•", n: 8, dur: 800, raggio: .7 }); },
    "alessiologa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff6b"); ar.schermo("verde", 2000); ar.luceScena(0x0a2a0a, { intensita: .25, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.linea(a, d, 0x7dff6b, { dur: 600, spessore: .08, onde: 1.2 }); await ar.linea(a, d, 0x3fd8ff, { dur: 400, spessore: .08, onde: -1.2 });
      ar.esplosione(d, 0x7dff6b, 80, { velocita: 3 }); ar.simboli(d, "🧬", "#7dff6b", { n: 2, dim: .5 }); ar.lampo(0x7dff6b, 8, d); ar.scossa = .35; },
    // ---- Vikyventura ----
    "vikyventura:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 140, colore: 0x8a6a3a, ruota: .5 }); ar.fendente(ar.pos(1 - l), { colore: 0xd0d0c0, rot: 1.9, scala: 1 }); },
    "vikyventura:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); await ar.linea(V(a.x, 4, a.z), V(d.x, 4, d.z), 0x4f7d43, { dur: 300, spessore: .05 }); await ar.salto(l, { h: 2, giri: 0, colore: 0x4f7d43 }); ar.esplosione(d, 0x8a6a3a, 26, { velocita: 2.2 }); },
    "vikyventura:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e0a33a"); ar.schermo("oro", 1800); ar.schermo("terremoto", 1400); ar.luceScena(0x2a1a04, { intensita: .4, dur: 1800 }); const d = ar.pos(1 - l);
      await ar.proiettile(V(d.x + 2, 4, d.z - 1), d, { colore: 0x8a7a6a, dim: 1.3, arco: .2, dur: 560, ruota: 2 }); ar.ondaTerra(d, 0xe0a33a, 7);
      ar.esplosione(d, 0xe0a33a, 70, { velocita: 3 }); ar.pioggia(d, { colore: 0xf2c14e, testo: "●", n: 12, dur: 700, larg: 1 }); ar.lampo(0xe0a33a, 8, d); ar.scossa = .45; },
    // ---- Auroressa ----
    "auroressa:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .4, 0)), d, { colore: 0xf4f4f4, dim: .25, arco: .3, dur: 320, ruota: .8 }); ar.esplosione(d, 0xf4f4f4, 18, { velocita: 1.6 }); },
    "auroressa:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "✎", "#f4ece8", { n: 3, dim: .35 }); await ar.orbita(l, { colore: 0x9fd8ff, testo: "▤", n: 5, dur: 800, raggio: .85 }); ar.ondaTerra(p, 0x9fd8ff, 3); },
    "auroressa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9fd8ff"); ar.schermo("incanto", 1800); ar.luceScena(0x9fd8ff, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l), segni = ["4", "+", "x²", "=", "?", "π"];
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .3, 1.2, 0)), d, { colore: 0xf4f4f4, simbolo: segni[k], dim: .45, arco: (k - 2.5) * .4, dur: 420 }); await ar.attendi(80); }
      await ar.attendi(360); ar.esplosione(d, 0x9fd8ff, 60, { velocita: 2.8 }); ar.simboli(d, "4-", "#ff3344", { n: 1, dim: .6 }); ar.lampo(0x9fd8ff, 7, d); ar.scossa = .3; },
    // ---- Ritanimatrice ----
    "ritanimatrice:0": async (ar, l) => { await ar.vortice(l, { giri: 2, dur: 450, colore: 0xffd04a }); await ar.scatto(l, { k: .8, andata: 150, colore: 0xffd04a }); ar.esplosione(ar.pos(1 - l), 0xffd04a, 20, { velocita: 1.8 }); },
    "ritanimatrice:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "💧", "#3fd8ff", { n: 4, dim: .35, su: 1.4 }); ar.esplosione(p, 0x3fd8ff, 30, { velocita: .8, su: 2, gravita: -.3, durata: 1000, dimensione: .11 }); await ar.colonna(p, 0x3fd8ff, { alt: 2.4 }); },
    "ritanimatrice:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("sole", 1800); ar.schermo("fiori", 1400); ar.luceScena(0xffd04a, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.cloni(l, { n: 3, colore: 0xffd04a, dur: 500, carica: true }); ar.simboli(a, "♪", "#ffd04a", { n: 5, dim: .4 });
      await ar.missili(a, d, { n: 6, colore: 0xffd04a, dur: 480 }); ar.esplosione(d, 0xffd04a, 60, { velocita: 2.8 }); ar.lampo(0xffd04a, 7, d); ar.scossa = .3; await ar.getto(d, a, { colore: 0x4fd38a, dur: 450, densita: 4 }); },
    // ---- Giudella ----
    "giudella:0": async (ar, l) => { await ar.scatto(l, { k: .85, andata: 140, colore: 0xff6bd6, ruota: .2 }); ar.fendente(ar.pos(1 - l), { colore: 0xff6bd6, rot: .3, scala: .6 }); },
    "giudella:1": async (ar, l) => { const p = ar.pos(l); ar.lampo(0xffffff, 5, p); ar.simboli(p, "✦", "#ff6bd6", { n: 6, dim: .35, su: 1.4 }); await ar.orbita(l, { colore: 0xff6bd6, testo: "📷", n: 4, dur: 800, raggio: .9 }); },
    "giudella:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6bd6"); ar.schermo("fiori", 1800); ar.luceScena(0xff6bd6, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.lampo(0xffffff, 5, a); await ar.attendi(90); }
      await ar.scatto(l, { k: .9, andata: 260, ritorno: 400, colore: 0xff6bd6 }); ar.esplosione(d, 0xff6bd6, 70, { velocita: 3 }); ar.simboli(d, "♥", "#ff6bd6", { n: 4, dim: .45 }); ar.lampo(0xff6bd6, 8, d); ar.scossa = .35; },
    // ================= Simpson =================
    // ---- Tizomer ----
    "tizomer:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xff8ad0, simbolo: "🍩", dim: .5, arco: .5, dur: 380, ruota: 1 }); ar.esplosione(d, 0xff8ad0, 22, { velocita: 1.8 }); },
    "tizomer:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🍩", "#ff8ad0", { n: 4, dim: .4, su: 1.2 }); ar.simboli(p, "Mmm…", "#ffd90f", { n: 1, dim: .5 }); await ar.colonna(p, 0x7dff6b, { alt: 2.2 }); },
    "tizomer:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff3a"); ar.schermo("allarme", 1800); ar.luceScena(0x5aff2a, { intensita: .5, dur: 1800 }); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "D'OH!", "#ffd90f", { n: 1, dim: .7 }); await ar.attendi(300); await ar.colonna(d, 0x7dff3a, { alt: 4 }); ar.esplosione(d, 0x7dff3a, 70, { velocita: 3 }); ar.ondaTerra(d, 0x7dff3a, 8); ar.lampo(0x7dff3a, 9, d); ar.scossa = .5; },
    // ---- Lollart ----
    "lollart:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(.2, .6, 0)), d, { colore: 0xbfbfbf, dim: .22, arco: .4, dur: 260 }); ar.esplosione(d, 0xffffff, 14, { velocita: 1.4 }); },
    "lollart:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "☎", "#ffd90f", { n: 2, dim: .4 }); await ar.attendi(250); ar.simboli(d, "?!", "#ff5a5a", { n: 3, dim: .45 }); ar.lampo(0xffd90f, 4, d); },
    "lollart:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e04a4a"); ar.schermo("velocita", 1400); for (let k = 0; k < 3; k++) await ar.scatto(l, { k: .9, andata: 90, ritorno: 80, ruota: .4, colore: 0xe04a4a });
      const d = ar.pos(1 - l); ar.esplosione(d, 0xe04a4a, 50, { velocita: 2.6 }); ar.simboli(d, "AY CARAMBA", "#ffd90f", { n: 1, dim: .5 }); ar.lampo(0xffffff, 7, d); ar.scossa = .4; },
    // ---- Alisa ----
    "alisa:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♪", "#ffd90f", { n: 3, dim: .35, verso: d, durata: 500 }); await ar.attendi(380); ar.esplosione(d, 0xffd90f, 16, { velocita: 1.4 }); },
    "alisa:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.orbita(l, { colore: 0xe04a4a, testo: "A+", n: 4, dur: 700, raggio: .8 }); ar.simboli(d, "E=mc²", "#ffffff", { n: 2, dim: .35 }); },
    "alisa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd90f"); ar.schermo("dorato", 1800); ar.luceScena(0x3a6ae0, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .25, 1, 0)), d, { colore: 0xffd90f, simbolo: ["♪", "♫"][k % 2], dim: .45, arco: (k - 2.5) * .3, dur: 420 }); await ar.attendi(90); }
      await ar.attendi(320); ar.esplosione(d, 0xffd90f, 60, { velocita: 2.6 }); ar.lampo(0x3a6ae0, 7, d); ar.scossa = .3; },
    // ---- Simarney ----
    "simarney:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "BUUURP", "#9adf5a", { n: 1, dim: .55, verso: d, durata: 500 }); await ar.attendi(400); ar.ondaTerra(d, 0x9adf5a, 3); ar.scossa = .15; },
    "simarney:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🍺", "#ffd04a", { n: 3, dim: .4, su: 1.2 }); await ar.colonna(p, 0xffd04a, { alt: 2.2 }); },
    "simarney:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("ubriaco", 1600); await ar.scatto(l, { k: 1, andata: 200, ruota: .3, colore: 0xffffff }); const d = ar.pos(1 - l);
      ar.getto(ar.pos(l), d, { colore: 0xffffff, dur: 500, densita: 5 }); await ar.attendi(400); ar.esplosione(d, 0xffffff, 60, { velocita: 2.4 }); ar.simboli(d, "PLOW KING", "#e04a4a", { n: 1, dim: .5 }); ar.scossa = .4; },
    // ---- Maurilanders ----
    "maurilanders:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "Okely Dokely!", "#3a9a5a", { n: 1, dim: .45 }); await ar.scatto(l, { k: .8, andata: 130, colore: 0x3a9a5a }); ar.esplosione(d, 0x3a9a5a, 16, { velocita: 1.5 }); },
    "maurilanders:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0xfff6c0, { intensita: .5, dur: 1000 }); ar.simboli(p, "✝", "#fff6c0", { n: 3, dim: .4, su: 1.4 }); await ar.colonna(p, 0xfff6c0, { alt: 3 }); },
    "maurilanders:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a9a5a"); ar.schermo("bianco", 900); const d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { await ar.scatto(l, { k: .85, andata: 70, ritorno: 80, ruota: k % 2 ? .3 : -.3, colore: 0x3a9a5a }); ar.simboli(d, "✋", "#ffd90f", { n: 1, dim: .4 }); }
      ar.esplosione(d, 0x3a9a5a, 50, { velocita: 2.4 }); ar.lampo(0xffffff, 6, d); ar.scossa = .3; },
    // ---- Samusty ----
    "samusty:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xfff1c0, simbolo: "🥧", dim: .5, arco: .4, dur: 360, ruota: .6 }); ar.esplosione(d, 0xfff1c0, 26, { velocita: 1.8 }); },
    "samusty:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "AH AH AH", "#3ac06a", { n: 2, dim: .45, verso: d, durata: 600 }); await ar.attendi(450); ar.lampo(0xffd90f, 4, d); },
    "samusty:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3ac06a"); ar.schermo("disco", 1800); ar.luceScena(0xe04a8a, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.missili(a, d, { n: 4, colore: 0xffd90f, dur: 440 }); ar.esplosione(d, 0x3ac06a, 50, { velocita: 2.6 }); ar.simboli(d, "🤡", "#ffffff", { n: 3, dim: .4 }); ar.scossa = .35; },
    // ---- Dieggum ----
    "dieggum:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 140, colore: 0x3a5ab0 }); ar.esplosione(d, 0x3a5ab0, 16, { velocita: 1.6 }); ar.simboli(d, "SBAM", "#ffffff", { n: 1, dim: .4 }); },
    "dieggum:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🍩", "#ff8ad0", { n: 2, dim: .4 }); await ar.orbita(l, { colore: 0x3a5ab0, testo: "★", n: 5, dur: 750, raggio: .85 }); ar.ondaTerra(p, 0x3a5ab0, 3); },
    "dieggum:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a5ab0"); const d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.schermo(k % 2 ? "rosso" : "laser", 300); ar.luceScena(k % 2 ? 0xff2a2a : 0x2a5aff, { intensita: .6, dur: 300 }); await ar.attendi(260); }
      await ar.scatto(l, { k: 1, andata: 160, colore: 0xffffff }); ar.esplosione(d, 0x3a5ab0, 60, { velocita: 2.6 }); ar.lampo(0xff2a2a, 7, d); ar.scossa = .4; },
    // ---- Pimoe ----
    "pimoe:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xd8d0c0, dim: .3, arco: .3, dur: 320, ruota: 1.2 }); ar.esplosione(d, 0xd8d0c0, 14, { velocita: 1.3 }); },
    "pimoe:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "$", "#3ac06a", { n: 4, dim: .4, verso: ar.pos(l), durata: 600 }); await ar.attendi(500); },
    "pimoe:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6a2a"); ar.schermo("calore", 1600); const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xff6a2a, simbolo: "🍹", dim: .5, arco: .4, dur: 420 });
      ar.esplosione(d, 0xff6a2a, 60, { velocita: 2.6, su: 1.5 }); await ar.colonna(d, 0xff6a2a, { alt: 3 }); ar.lampo(0xff6a2a, 7, d); ar.scossa = .35; },
    // ---- Ludohouse ----
    "ludohouse:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .75, andata: 120, colore: 0x9a6ae0 }); ar.esplosione(d, 0x9a6ae0, 12, { velocita: 1.2 }); },
    "ludohouse:1": async (ar, l) => { const p = ar.pos(l); await ar.vortice(l, { giri: 3, dur: 600, colore: 0x9a6ae0 }); ar.simboli(p, "@_@", "#ffffff", { n: 2, dim: .4 }); },
    "ludohouse:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9a6ae0"); ar.schermo("velocita", 1400); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.cloni(l, { n: 3, colore: 0x9a6ae0, dur: 500, carica: true }); await ar.proiettile(a.clone().add(V(0, .8, 0)), d, { colore: 0x9a6ae0, simbolo: "⚡", dim: .6, arco: .2, dur: 380 }); ar.esplosione(d, 0x9a6ae0, 55, { velocita: 2.6 }); ar.scossa = .3; },
    // ---- Alledna ----
    "alledna:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xffffff, dim: .2, arco: .3, dur: 300, ruota: .8 }); ar.simboli(d, "AH-HA!", "#ffd90f", { n: 1, dim: .45 }); },
    "alledna:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xf4ece0, simbolo: "▤", dim: .5, arco: .5, dur: 420 }); ar.simboli(d, "F", "#ff3344", { n: 2, dim: .5 }); },
    "alledna:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9a6ae0"); ar.schermo("incanto", 1600); const a = ar.pos(l), d = ar.pos(1 - l), segni = ["F", "x²", "π", "√", "F", "?"];
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .3, 1.1, 0)), d, { colore: 0xffffff, simbolo: segni[k], dim: .45, arco: (k - 2.5) * .4, dur: 420 }); await ar.attendi(80); }
      await ar.attendi(350); ar.esplosione(d, 0x9a6ae0, 55, { velocita: 2.6 }); ar.simboli(d, "BOCCIATO", "#ff3344", { n: 1, dim: .5 }); ar.scossa = .3; },
    // ---- Vaggie ----
    "vaggie:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .4, 0)), d, { colore: 0xff4a4a, simbolo: "●", dim: .3, arco: .2, dur: 280 }); ar.esplosione(d, 0xff4a4a, 12, { velocita: 1.3 }); },
    "vaggie:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0x8ad8ff, simbolo: "🍼", dim: .5, arco: .6, dur: 400, ruota: 1 }); ar.esplosione(d, 0x8ad8ff, 30, { velocita: 2 }); },
    "vaggie:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a6ae0"); ar.schermo("buio", 1400); ar.luceScena(0x0a0a20, { intensita: .2, dur: 1400 }); const d = ar.pos(1 - l);
      await ar.attendi(400); ar.fulmine(ar.pos(l).add(V(0, .4, 0)), d, { colore: 0xffffff, volte: 1, spessore: 2 }); ar.lampo(0xffffff, 9, d); ar.esplosione(d, 0xffffff, 50, { velocita: 2.8 }); ar.simboli(d, "BANG", "#ff3344", { n: 1, dim: .6 }); ar.scossa = .45; },
    // ---- Giupatty ----
    "giupatty:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .8, andata: 130, colore: 0x9a6ae0 }); ar.simboli(d, "TIMBRATO", "#e04a4a", { n: 1, dim: .4 }); },
    "giupatty:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "-_-", "#ffffff", { n: 1, dim: .5 }); await ar.orbita(l, { colore: 0x9a6ae0, testo: "▮", n: 5, dur: 750, raggio: .85 }); ar.ondaTerra(p, 0x9a6ae0, 3); },
    "giupatty:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9a6ae0"); ar.schermo("bn", 1400); const d = ar.pos(1 - l); ar.getto(ar.pos(l), d, { colore: 0xc8c8c8, dur: 500, densita: 4 }); await ar.attendi(450); ar.esplosione(d, 0x9a6ae0, 45, { velocita: 2.3 }); ar.scossa = .3; },
    // ---- Selmene ----
    "selmene:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xff6a2a, dim: .2, arco: .3, dur: 300 }); ar.esplosione(d, 0xff6a2a, 14, { velocita: 1.3 }); },
    "selmene:1": async (ar, l) => { const d = ar.pos(1 - l); ar.getto(ar.pos(l), d, { colore: 0xbfbfbf, dur: 500, densita: 4 }); await ar.attendi(450); ar.esplosione(d, 0xff6a2a, 20, { velocita: 1.2, su: 1.2 }); },
    "selmene:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3ac06a"); ar.schermo("verde", 1400); const d = ar.pos(1 - l);
      await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0x3ac06a, simbolo: "🦎", dim: .6, arco: .5, dur: 420, ruota: .5 }); ar.esplosione(d, 0x3ac06a, 50, { velocita: 2.4 }); ar.scossa = .3; },
    // ---- Riessica ----
    "riessica:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "✧", "#ff8ad0", { n: 3, dim: .35, verso: d, durata: 450 }); await ar.attendi(350); ar.esplosione(d, 0xff8ad0, 14, { velocita: 1.3 }); },
    "riessica:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "$", "#ffd90f", { n: 4, dim: .4, verso: ar.pos(l), durata: 600 }); await ar.attendi(500); },
    "riessica:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8ad0"); ar.schermo("fiori", 1400); const d = ar.pos(1 - l); await ar.scatto(l, { k: 1, andata: 160, colore: 0xff8ad0 }); ar.esplosione(d, 0xff8ad0, 50, { velocita: 2.4 }); ar.lampo(0xff8ad0, 6, d); ar.scossa = .3; },
    // ---- Aurrerri ----
    "aurrerri:0": async (ar, l) => { const d = ar.pos(1 - l); for (let k = 0; k < 2; k++) { await ar.scatto(l, { k: .7, andata: 70, ritorno: 70, colore: 0xffd90f }); ar.simboli(d, "ih ih", "#ff8ad0", { n: 1, dim: .35 }); } },
    "aurrerri:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "bla bla", "#ff8ad0", { n: 2, dim: .4, verso: d, durata: 600 }); await ar.attendi(450); ar.lampo(0x9a6ae0, 3, d); },
    "aurrerri:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8ad0"); ar.schermo("specchio", 1400); await ar.cloni(l, { n: 2, colore: 0xff8ad0, dur: 450 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 2; k++) { await ar.scatto(l, { k: .9, andata: 90, ritorno: 90, ruota: k ? .3 : -.3, colore: 0xff8ad0 }); ar.esplosione(d, 0xff8ad0, 30, { velocita: 2.2 }); } ar.scossa = .3; },
    // ================= Barbapapà =================
    // ---- Diegopà ----
    "diegopa:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.vortice(l, { giri: 1, dur: 300, colore: 0xc38bff }); await ar.scatto(l, { k: .85, andata: 120, colore: 0xc38bff }); ar.simboli(d, "✦", "#c38bff", { n: 3, dim: .35 }); },
    "diegopa:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "⚔", "#ffffff", { n: 1, dim: .6 }); await ar.scatto(l, { k: 1, andata: 110, ruota: .3, colore: 0xffffff }); ar.lampo(0xc38bff, 6, d); ar.esplosione(d, 0xc38bff, 26, { velocita: 2 }); },
    "diegopa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c38bff"); ar.schermo("incanto", 1800); ar.luceScena(0xc38bff, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (const f of ["⚔", "⚡", "★"]) { ar.simboli(a, f, "#ffffff", { n: 1, dim: .7 }); await ar.vortice(l, { giri: 1, dur: 260, colore: 0xc38bff }); }
      await ar.scatto(l, { k: 1, andata: 180, colore: 0xffffff }); ar.esplosione(d, 0xc38bff, 70, { velocita: 3 }); ar.simboli(d, "BARBATRUCCO!", "#ff8fc8", { n: 1, dim: .5 }); ar.lampo(0xffffff, 8, d); ar.scossa = .45; },
    // ---- Pipsobà ----
    "pipsoba:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 130, colore: 0xffd90f }); ar.simboli(d, "🐾", "#ffd90f", { n: 3, dim: .35 }); },
    "pipsoba:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (const an of ["🐘", "🦁", "🐒"]) { ar.proiettile(a.clone().add(V(0, .5, 0)), d, { colore: 0xffd90f, simbolo: an, dim: .5, arco: .4, dur: 360 }); await ar.attendi(140); } await ar.attendi(240); ar.esplosione(d, 0xffd90f, 24, { velocita: 1.8 }); },
    "pipsoba:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd90f"); ar.schermo("terremoto", 1600); const a = ar.pos(l), d = ar.pos(1 - l), zoo = ["🐘", "🦁", "🦒", "🐻", "🐒", "🦓"];
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .3, .3, 0)), d, { colore: 0xffd90f, simbolo: zoo[k], dim: .55, arco: .2, dur: 420 }); await ar.attendi(80); }
      await ar.attendi(360); ar.ondaTerra(d, 0xffd90f, 8); ar.esplosione(d, 0xffd90f, 60, { velocita: 2.8 }); ar.scossa = .5; },
    // ---- Ritamma ----
    "ritamma:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .8, andata: 140, colore: 0xff8fc8 }); ar.simboli(d, "♡", "#ff8fc8", { n: 3, dim: .35 }); },
    "ritamma:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "♥", "#ff8fc8", { n: 5, dim: .35, su: 1.3 }); ar.esplosione(p, 0xff8fc8, 30, { velocita: .8, su: 2, gravita: -.3, durata: 1000, dimensione: .1 }); await ar.colonna(p, 0xff8fc8, { alt: 2.6 }); },
    "ritamma:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8fc8"); ar.schermo("fiori", 1800); ar.luceScena(0xff8fc8, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.orbita(l, { colore: 0xff8fc8, testo: "⌂", n: 6, dur: 800, raggio: 1 }); await ar.proiettile(a.clone().add(V(0, 1.2, 0)), d, { colore: 0xff8fc8, simbolo: "⌂", dim: 1, arco: .8, dur: 520 });
      ar.esplosione(d, 0xff8fc8, 60, { velocita: 2.6 }); ar.ondaTerra(d, 0xff8fc8, 6); ar.lampo(0xff8fc8, 7, d); ar.scossa = .4; },
    // ---- Aliottina ----
    "aliottina:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xc38bff, simbolo: "📖", dim: .45, arco: .5, dur: 360, ruota: 1 }); ar.esplosione(d, 0xc38bff, 16, { velocita: 1.5 }); },
    "aliottina:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "zzz", "#c38bff", { n: 3, dim: .4, verso: d, durata: 650 }); await ar.attendi(500); ar.lampo(0xc38bff, 3, d); },
    "aliottina:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c38bff"); ar.schermo("incanto", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .3, 1.1, 0)), d, { colore: 0xc38bff, simbolo: "📖", dim: .45, arco: (k - 2.5) * .4, dur: 440, ruota: 1 }); await ar.attendi(80); }
      await ar.attendi(360); ar.esplosione(d, 0xc38bff, 55, { velocita: 2.5 }); ar.scossa = .3; },
    // ---- Aurobrava ----
    "aurobrava:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 90, ritorno: 80, colore: 0xffb84a }); ar.esplosione(d, 0xffb84a, 14, { velocita: 1.5 }); },
    "aurobrava:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "🔍", "#ffb84a", { n: 1, dim: .7 }); await ar.attendi(350); await ar.scatto(l, { k: .9, andata: 120, colore: 0xffb84a }); ar.lampo(0xffffff, 5, d); },
    "aurobrava:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffb84a"); ar.schermo("velocita", 1500); const d = ar.pos(1 - l); await ar.cloni(l, { n: 3, colore: 0xffb84a, dur: 450, carica: true });
      for (let k = 0; k < 3; k++) await ar.scatto(l, { k: .9, andata: 80, ritorno: 70, ruota: k % 2 ? .3 : -.3, colore: 0xffb84a }); ar.simboli(d, "CASO RISOLTO", "#ffb84a", { n: 1, dim: .5 }); ar.esplosione(d, 0xffb84a, 50, { velocita: 2.5 }); ar.scossa = .3; },
    // ---- Ludopà ----
    "ludopa:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0xff9a3a, dur: 300, densita: 3 }); ar.esplosione(d, 0xff9a3a, 14, { velocita: 1.4 }); },
    "ludopa:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xff9a3a, dim: .5, arco: .7, dur: 420 }); ar.esplosione(d, 0xff9a3a, 30, { velocita: 2.2 }); },
    "ludopa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff9a3a"); ar.schermo("calore", 1400); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.proiettile(a.clone().add(V(0, .6 + k * .3, 0)), d, { colore: 0xff9a3a, dim: .6 + k * .15, arco: .8 - k * .2, dur: 360 }); ar.ondaTerra(d, 0xff9a3a, 3 + k); }
      ar.esplosione(d, 0xff9a3a, 55, { velocita: 2.6 }); ar.scossa = .4; },
    // ---- Mauribà ----
    "mauriba:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xe04a4a, dim: .45, arco: .3, dur: 320 }); ar.esplosione(d, 0xe04a4a, 16, { velocita: 1.6 }); },
    "mauriba:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "💪", "#e04a4a", { n: 2, dim: .45 }); await ar.vortice(l, { giri: 2, dur: 450, colore: 0xe04a4a }); ar.ondaTerra(p, 0xe04a4a, 3); },
    "mauriba:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e04a4a"); ar.schermo("rosso", 1400); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.scatto(l, { k: .6, andata: 120, colore: 0xe04a4a }); await ar.proiettile(a.clone().add(V(0, .4, 0)), d, { colore: 0xffffff, simbolo: "⚽", dim: .6, arco: .3, dur: 360, ruota: 2 });
      ar.simboli(d, "GOOOL", "#ffd90f", { n: 1, dim: .6 }); ar.esplosione(d, 0xe04a4a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- AleBella ----
    "alebella:0": async (ar, l) => { const d = ar.pos(1 - l); ar.lampo(0xffffff, 4, ar.pos(l)); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xffffff, simbolo: "✧", dim: .35, arco: .2, dur: 300 }); },
    "alebella:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♡", "#ff8fc8", { n: 4, dim: .4, verso: d, durata: 600 }); await ar.attendi(480); ar.simboli(d, "@_@", "#ffffff", { n: 1, dim: .4 }); },
    "alebella:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8fc8"); ar.schermo("bianco", 900); ar.luceScena(0xffffff, { intensita: .7, dur: 1200 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.lampo(0xffffff, 6, d); await ar.attendi(100); } ar.esplosione(d, 0xff8fc8, 50, { velocita: 2.4 }); ar.scossa = .3; },
    // ---- Giulialla ----
    "giulialla:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♪", "#7dffb0", { n: 3, dim: .35, verso: d, durata: 450 }); await ar.attendi(360); ar.esplosione(d, 0x7dffb0, 12, { velocita: 1.3 }); },
    "giulialla:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0x7dffb0, testo: "♫", n: 5, dur: 750, raggio: .85 }); ar.simboli(p, "+3", "#7dffb0", { n: 1, dim: .5 }); },
    "giulialla:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dffb0"); ar.schermo("disco", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .25, 1, 0)), d, { colore: 0x7dffb0, simbolo: ["♪", "♫"][k % 2], dim: .45, arco: (k - 2.5) * .3, dur: 420 }); await ar.attendi(90); }
      await ar.attendi(320); ar.esplosione(d, 0x7dffb0, 50, { velocita: 2.4 }); ar.scossa = .3; },
    // ---- Seneforte ----
    "seneforte:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: 1, andata: 150, colore: 0xff8fc8 }); ar.ondaTerra(d, 0xff8fc8, 3); ar.scossa = .15; },
    "seneforte:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0xff8fc8, testo: "▮", n: 6, dur: 750, raggio: .9 }); ar.ondaTerra(p, 0xff8fc8, 3); },
    "seneforte:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8fc8"); ar.schermo("terremoto", 1400); const d = ar.pos(1 - l);
      await ar.colonna(d, 0xff8fc8, { alt: 3 }); ar.ondaTerra(d, 0xff8fc8, 8); ar.esplosione(d, 0xff8fc8, 55, { velocita: 2.4 }); ar.scossa = .5; },
    // ---- Vikylalla ----
    "vikylalla:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "🎸", "#ff6a2a", { n: 1, dim: .5 }); await ar.scatto(l, { k: .85, andata: 120, colore: 0xff6a2a }); ar.esplosione(d, 0xff6a2a, 14, { velocita: 1.4 }); },
    "vikylalla:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♫", "#ff6a2a", { n: 4, dim: .4, verso: d, durata: 550 }); await ar.attendi(450); ar.esplosione(d, 0xff6a2a, 26, { velocita: 1.2, su: 1.4 }); },
    "vikylalla:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6a2a"); ar.schermo("inferno", 1600); ar.luceScena(0xff6a2a, { intensita: .5, dur: 1600 }); const d = ar.pos(1 - l);
      await ar.getto(ar.pos(l), d, { colore: 0xff6a2a, dur: 600, densita: 6 }); ar.esplosione(d, 0xff6a2a, 60, { velocita: 2.8, su: 1.5 }); ar.lampo(0xff6a2a, 7, d); ar.scossa = .35; },
    // ---- Lollapà ----
    "lollapa:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 130, colore: 0xff8fc8 }); ar.esplosione(d, 0xff8fc8, 14, { velocita: 1.4 }); },
    "lollapa:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "BARBATRUCCO!", "#ff8fc8", { n: 1, dim: .5 }); await ar.colonna(p, 0xff8fc8, { alt: 2.4 }); ar.ondaTerra(p, 0xff8fc8, 4); },
    "lollapa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8fc8"); ar.schermo("fiori", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.vortice(l, { giri: 3, dur: 600, colore: 0xff8fc8 }); await ar.proiettile(a.clone().add(V(0, .8, 0)), d, { colore: 0xff8fc8, simbolo: "✿", dim: .9, arco: .5, dur: 460, ruota: 1 }); ar.esplosione(d, 0xff8fc8, 55, { velocita: 2.5 }); ar.scossa = .3; },
    // ---- Tizobà ----
    "tizoba:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♪", "#5ac05a", { n: 2, dim: .35, verso: d, durata: 400 }); await ar.attendi(300); ar.esplosione(d, 0x5ac05a, 12, { velocita: 1.2 }); },
    "tizoba:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "☂", "#5ac05a", { n: 1, dim: .8 }); await ar.orbita(l, { colore: 0x5ac05a, testo: "☂", n: 4, dur: 700, raggio: .8 }); },
    "tizoba:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#5ac05a"); ar.schermo("verde", 1400); const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "🎺", "#ffd90f", { n: 1, dim: .6 });
      await ar.getto(ar.pos(l), d, { colore: 0x5ac05a, dur: 550, densita: 5 }); ar.ondaTerra(d, 0x5ac05a, 6); ar.esplosione(d, 0x5ac05a, 45, { velocita: 2.3 }); ar.scossa = .3; },
    // ---- Samubà ----
    "samuba:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0x4fa8ff, simbolo: "⚗", dim: .4, arco: .5, dur: 360, ruota: 1 }); ar.esplosione(d, 0x4fa8ff, 16, { velocita: 1.5 }); },
    "samuba:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "+", "#4fa8ff", { n: 4, dim: .4, su: 1.3 }); await ar.colonna(p, 0x4fa8ff, { alt: 2.3 }); },
    "samuba:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fa8ff"); ar.schermo("laser", 1400); const d = ar.pos(1 - l);
      await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0x4fa8ff, simbolo: "⚗", dim: .7, arco: .7, dur: 460, ruota: 1.5 }); ar.esplosione(d, 0x4fa8ff, 60, { velocita: 2.8 }); ar.simboli(d, "BOOM", "#ffffff", { n: 1, dim: .55 }); ar.scossa = .35; },
    // ---- Simopà ----
    "simopa:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0x3a6ae0, dur: 280, densita: 3 }); ar.esplosione(d, 0x3a6ae0, 12, { velocita: 1.3 }); },
    "simopa:1": async (ar, l) => { const d = ar.pos(1 - l); for (const c of [0xe04a4a, 0xffd90f, 0x3a6ae0]) { ar.esplosione(d, c, 14, { velocita: 1.4 }); await ar.attendi(120); } },
    "simopa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a6ae0"); ar.schermo("disco", 1400); const a = ar.pos(l), d = ar.pos(1 - l), col = [0xe04a4a, 0xffd90f, 0x3a6ae0, 0x5ac05a, 0xff8fc8];
      for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V((k - 2) * .3, .9, 0)), d, { colore: col[k], dim: .4, arco: (k - 2) * .4, dur: 400 }); await ar.attendi(90); }
      await ar.attendi(320); ar.simboli(d, "🖼", "#ffffff", { n: 1, dim: .6 }); ar.esplosione(d, 0xffffff, 45, { velocita: 2.3 }); ar.scossa = .3; },
    // ================= Star Wars =================
    // spada laser: un fendente luminoso del colore giusto
    // ---- Ludowalker ----
    "ludowalker:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 110, ruota: .3, colore: 0x4fa8ff }); ar.lampo(0x4fa8ff, 5, d); ar.esplosione(d, 0x4fa8ff, 18, { velocita: 1.7 }); },
    "ludowalker:1": async (ar, l) => { const d = ar.pos(1 - l); ar.luceScena(0x4fa8ff, { intensita: .4, dur: 700 }); await ar.getto(ar.pos(l), d, { colore: 0xbfe8ff, dur: 450, densita: 4 }); ar.ondaTerra(d, 0x4fa8ff, 4); ar.scossa = .2; },
    "ludowalker:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fa8ff"); ar.schermo("buio", 1800); ar.luceScena(0x0a1030, { intensita: .2, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.missili(a, d, { n: 2, colore: 0xffd04a, dur: 520 }); await ar.attendi(200); ar.esplosione(d, 0xffd04a, 80, { velocita: 3.2, su: 1.5 }); ar.ondaTerra(d, 0xff8a2a, 9); ar.lampo(0xffffff, 10, d); ar.schermo("bianco", 700); ar.scossa = .6; },
    // ---- Giueia ----
    "giueia:0": async (ar, l) => { const d = ar.pos(1 - l); for (let k = 0; k < 2; k++) { ar.proiettile(ar.pos(l).add(V(.2, .5, 0)), d, { colore: 0xff4a4a, dim: .18, arco: 0, dur: 220 }); await ar.attendi(110); } await ar.attendi(160); ar.esplosione(d, 0xff4a4a, 12, { velocita: 1.3 }); },
    "giueia:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0x4fc3ff, { intensita: .4, dur: 800 }); await ar.colonna(p, 0x4fc3ff, { alt: 2.2 }); ar.simboli(p, "+3", "#4fc3ff", { n: 1, dim: .5 }); },
    "giueia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("allarme", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 8; k++) { ar.proiettile(a.clone().add(V((k - 3.5) * .25, .5 + (k % 3) * .2, 0)), d, { colore: 0xff4a4a, dim: .16, arco: 0, dur: 240 }); await ar.attendi(70); }
      await ar.attendi(220); ar.esplosione(d, 0xff4a4a, 55, { velocita: 2.6 }); ar.simboli(d, "✦", "#ffd04a", { n: 3, dim: .5 }); ar.scossa = .35; },
    // ---- Mauribecca ----
    "mauribecca:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0x5aff6a, dim: .3, arco: 0, dur: 260 }); ar.esplosione(d, 0x5aff6a, 18, { velocita: 1.8 }); },
    "mauribecca:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "RRRAAWR", "#c08a4a", { n: 1, dim: .55 }); await ar.orbita(l, { colore: 0xc08a4a, testo: "▮", n: 5, dur: 750, raggio: .9 }); ar.ondaTerra(p, 0xc08a4a, 3); },
    "mauribecca:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c08a4a"); ar.schermo("terremoto", 1600); const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "RRRAAAAWR", "#c08a4a", { n: 1, dim: .7 });
      for (let k = 0; k < 3; k++) await ar.scatto(l, { k: 1, andata: 80, ritorno: 80, ruota: k % 2 ? .4 : -.4, colore: 0xc08a4a }); ar.ondaTerra(d, 0xc08a4a, 8); ar.esplosione(d, 0xc08a4a, 60, { velocita: 2.8 }); ar.scossa = .55; },
    // ---- Lollakin ----
    "lollakin:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 100, ruota: .4, colore: 0x4fa8ff }); ar.lampo(0x4fa8ff, 5, d); },
    "lollakin:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0x3a0a0a, { intensita: .4, dur: 800 }); await ar.vortice(l, { giri: 2, dur: 500, colore: 0xff3a3a }); ar.simboli(p, "!!", "#ff3a3a", { n: 2, dim: .45 }); },
    "lollakin:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6a2a"); ar.schermo("inferno", 1800); ar.luceScena(0xff4a1a, { intensita: .6, dur: 1800 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { await ar.scatto(l, { k: .9, andata: 70, ritorno: 70, ruota: k % 2 ? .4 : -.4, colore: 0x4fa8ff }); ar.lampo(0x4fa8ff, 5, d); }
      ar.esplosione(d, 0xff6a2a, 60, { velocita: 2.8, su: 1.6 }); await ar.colonna(d, 0xff6a2a, { alt: 3 }); ar.scossa = .45; },
    // ---- Tiz Vader ----
    "tizvader:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 140, ruota: .25, colore: 0xff2a2a }); ar.lampo(0xff2a2a, 5, d); ar.esplosione(d, 0xff2a2a, 14, { velocita: 1.4 }); },
    "tizvader:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "✋", "#ff2a2a", { n: 1, dim: .6 }); ar.luceScena(0x200000, { intensita: .3, dur: 900 }); await ar.vortice(1 - l, { giri: 2, dur: 600, colore: 0x6a0a0a }); ar.simboli(d, "…", "#ffffff", { n: 1, dim: .5 }); },
    "tizvader:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2a2a"); ar.schermo("rosso", 1800); ar.luceScena(0x300000, { intensita: .2, dur: 1800 }); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "KHHH… PUHHH", "#bfbfbf", { n: 1, dim: .5 }); await ar.attendi(500); await ar.scatto(l, { k: 1, andata: 160, colore: 0xff2a2a }); ar.esplosione(d, 0xff2a2a, 60, { velocita: 2.8 }); ar.lampo(0xff2a2a, 8, d); ar.scossa = .5; },
    // ---- Simalpatine ----
    "simalpatine:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "eh eh eh", "#b866ff", { n: 1, dim: .45, verso: d, durata: 500 }); await ar.attendi(400); ar.lampo(0xb866ff, 4, d); },
    "simalpatine:1": async (ar, l) => { const a = ar.pos(l).add(V(0, .5, 0)), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.fulmine(a, d, { colore: 0xb866ff, volte: 1 }); await ar.attendi(140); } ar.esplosione(d, 0xb866ff, 30, { velocita: 1.8 }); },
    "simalpatine:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("tempesta", 2000); ar.luceScena(0x10001a, { intensita: .15, dur: 2000 }); const a = ar.pos(l).add(V(0, .6, 0)), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { await ar.fulmine(a, d.clone().add(V((Math.random() - .5) * .6, 0, 0)), { colore: 0xb866ff, volte: 2, spessore: 2 }); ar.lampo(0xb866ff, 6, d); } ar.esplosione(d, 0xb866ff, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Samuwan ----
    "samuwan:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "Hello there!", "#4fa8ff", { n: 1, dim: .45 }); await ar.scatto(l, { k: .85, andata: 120, colore: 0x4fa8ff }); ar.lampo(0x4fa8ff, 4, d); },
    "samuwan:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "👋", "#ffffff", { n: 1, dim: .6 }); await ar.vortice(l, { giri: 2, dur: 500, colore: 0x9fd8ff }); },
    "samuwan:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fa8ff"); ar.schermo("calore", 1500); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "HO L'ALTURA", "#4fa8ff", { n: 1, dim: .5 }); await ar.attendi(300); await ar.scatto(l, { k: 1, andata: 150, ruota: .5, colore: 0x4fa8ff }); ar.esplosione(d, 0x4fa8ff, 55, { velocita: 2.6 }); ar.lampo(0x4fa8ff, 7, d); ar.scossa = .4; },
    // ---- Aleadmè ----
    "aleadme:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(.2, .5, 0)), d, { colore: 0xff4a4a, dim: .16, arco: 0, dur: 230 }); ar.esplosione(d, 0xff4a4a, 12, { velocita: 1.3 }); },
    "aleadme:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "…per favore", "#ffd04a", { n: 1, dim: .4, verso: d, durata: 600 }); await ar.attendi(500); ar.lampo(0xffd04a, 3, d); },
    "aleadme:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("dorato", 1500); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V((k - 2) * .25, .6, 0)), d, { colore: 0xff4a4a, dim: .16, arco: 0, dur: 230 }); await ar.attendi(90); } await ar.attendi(200); ar.esplosione(d, 0xffd04a, 45, { velocita: 2.3 }); ar.scossa = .3; },
    // ---- Alihsoka ----
    "alihsoka:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 90, ritorno: 80, ruota: .5, colore: 0xffffff }); ar.lampo(0xffffff, 5, d); },
    "alihsoka:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.vortice(l, { giri: 1, dur: 300, colore: 0xffffff }); await ar.scatto(l, { k: 1, andata: 100, colore: 0xffffff }); ar.esplosione(d, 0xffffff, 26, { velocita: 2 }); },
    "alihsoka:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffffff"); ar.schermo("tagli", 1500); const d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { await ar.scatto(l, { k: .9, andata: 60, ritorno: 60, ruota: k % 2 ? .5 : -.5, colore: 0xffffff }); ar.lampo(0xffffff, 5, d); } ar.esplosione(d, 0xffffff, 50, { velocita: 2.5 }); ar.scossa = .35; },
    // ---- Pipsobà Fett ----
    "pipsobafett:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(.2, .5, 0)), d, { colore: 0xff4a4a, dim: .18, arco: 0, dur: 240 }); ar.esplosione(d, 0xff4a4a, 12, { velocita: 1.3 }); },
    "pipsobafett:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .4, 0)), d, { colore: 0xff9a3a, dim: .35, arco: .3, dur: 360 }); ar.esplosione(d, 0xff9a3a, 30, { velocita: 2.2 }); ar.scossa = .2; },
    "pipsobafett:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#5a7a3a"); ar.schermo("calore", 1500); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0xff9a3a, { alt: 2.5 }); await ar.proiettile(a.clone().add(V(0, 2, 0)), d, { colore: 0x5a7a3a, simbolo: "▲", dim: .7, arco: .8, dur: 480 }); ar.esplosione(d, 0xff9a3a, 60, { velocita: 2.8, su: 1.4 }); ar.scossa = .4; },
    // ---- Ritey ----
    "ritey:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 120, ruota: .3, colore: 0xd8b07a }); ar.esplosione(d, 0xd8b07a, 14, { velocita: 1.4 }); },
    "ritey:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "⚙", "#bfbfbf", { n: 3, dim: .4, verso: ar.pos(l), durata: 600 }); await ar.scatto(l, { k: .9, andata: 110, colore: 0xd8b07a }); },
    "ritey:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fa8ff"); ar.schermo("sole", 1500); const d = ar.pos(1 - l); ar.lampo(0x4fa8ff, 6, ar.pos(l));
      for (let k = 0; k < 3; k++) await ar.scatto(l, { k: .9, andata: 80, ritorno: 70, ruota: k % 2 ? .4 : -.4, colore: 0x4fa8ff }); ar.esplosione(d, 0x4fa8ff, 55, { velocita: 2.6 }); ar.scossa = .35; },
    // ---- Aurothma ----
    "aurothma:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "«…»", "#f4ece0", { n: 2, dim: .4, verso: d, durata: 500 }); await ar.attendi(400); ar.lampo(0xf4ece0, 3, d); },
    "aurothma:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "✦", "#ffd04a", { n: 4, dim: .35, su: 1.3 }); await ar.colonna(p, 0xf4ece0, { alt: 2.3 }); },
    "aurothma:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f4ece0"); ar.schermo("bianco", 900); const d = ar.pos(1 - l); ar.simboli(d, "SFIDUCIA", "#ff4a4a", { n: 1, dim: .5 });
      await ar.getto(ar.pos(l), d, { colore: 0xf4ece0, dur: 500, densita: 4 }); ar.esplosione(d, 0xf4ece0, 45, { velocita: 2.2 }); ar.scossa = .25; },
    // ---- Diegoren ----
    "diegoren:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .4, colore: 0xff2a2a }); ar.esplosione(d, 0xff2a2a, 18, { velocita: 1.7 }); },
    "diegoren:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "AAARGH", "#ff2a2a", { n: 1, dim: .5 }); await ar.vortice(l, { giri: 2, dur: 450, colore: 0xff2a2a }); ar.esplosione(p, 0xff2a2a, 20, { velocita: 1.4 }); },
    "diegoren:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2a2a"); ar.schermo("crepe", 1400); const d = ar.pos(1 - l);
      await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0x2a2a2a, simbolo: "⛑", dim: .6, arco: .6, dur: 420, ruota: 2 }); ar.esplosione(d, 0xff2a2a, 50, { velocita: 2.5 }); ar.scossa = .35; },
    // ---- Senendulla ----
    "senendulla:0": async (ar, l) => { const d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.proiettile(ar.pos(l).add(V(0, 1.2, 0)), d, { colore: 0x5aff6a, dim: .16, arco: -.2, dur: 240 }); await ar.attendi(90); } await ar.attendi(160); ar.esplosione(d, 0x5aff6a, 14, { velocita: 1.4 }); },
    "senendulla:1": async (ar, l) => { const p = ar.pos(l); await ar.vortice(l, { giri: 3, dur: 600, colore: 0xff9a3a }); ar.simboli(p, "+3", "#ff9a3a", { n: 1, dim: .5 }); },
    "senendulla:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff9a3a"); ar.schermo("velocita", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.missili(a.clone().add(V(0, 1.5, 0)), d, { n: 6, colore: 0x5aff6a, dur: 440 }); ar.esplosione(d, 0xff9a3a, 55, { velocita: 2.6 }); ar.scossa = .35; },
    // ---- Viky Erso ----
    "vikyerso:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 90, ritorno: 90, colore: 0x8a7a5a }); ar.esplosione(d, 0x8a7a5a, 12, { velocita: 1.3 }); },
    "vikyerso:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0x4fc3ff, simbolo: "▤", dim: .45, arco: .4, dur: 380 }); ar.lampo(0x4fc3ff, 5, d); },
    "vikyerso:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fc3ff"); ar.schermo("allarme", 1500); const d = ar.pos(1 - l); await ar.cloni(l, { n: 3, colore: 0x8a7a5a, dur: 450, carica: true });
      await ar.scatto(l, { k: 1, andata: 150, colore: 0x4fc3ff }); ar.esplosione(d, 0x4fc3ff, 50, { velocita: 2.5 }); ar.scossa = .35; },
    // ================= Elementi =================
    // ---- Auraria (aria e oro) ----
    "auraria:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0xffe08a, dur: 380, densita: 3, apertura: .4 }); ar.esplosione(d, 0xffe08a, 16, { velocita: 1.6 }); },
    "auraria:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0xffd04a, { intensita: .4, dur: 800 }); await ar.vortice(l, { giri: 3, dur: 600, colore: 0xfff1bd }); ar.simboli(p, "➶", "#ffd04a", { n: 5, dim: .4, su: 1.4 }); },
    "auraria:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("dorato", 1800); ar.luceScena(0xffd04a, { intensita: .6, dur: 1800 }); const d = ar.pos(1 - l);
      await ar.vortice(1 - l, { giri: 4, dur: 800, colore: 0xffe08a }); ar.pioggia(d, { colore: 0xfff1bd, testo: "✦", n: 22, dur: 800 }); await ar.colonna(d, 0xffd04a, { alt: 4, larg: .7 }); ar.esplosione(d, 0xffd04a, 70, { velocita: 3, su: 1.6 }); ar.lampo(0xffffff, 8, d); ar.scossa = .5; },
    // ---- Senesuono (suono) ----
    "senesuono:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♪", "#c38bff", { n: 3, dim: .45, verso: d, durata: 450 }); await ar.attendi(380); ar.lampo(0xc38bff, 4, d); ar.esplosione(d, 0xc38bff, 12, { velocita: 1.3 }); },
    "senesuono:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.ondaTerra(a.clone().lerp(d, k / 3), 0xc38bff, 3 + k); await ar.attendi(120); } ar.simboli(d, "♫", "#c38bff", { n: 4, dim: .4 }); ar.scossa = .25; },
    "senesuono:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c38bff"); ar.schermo("note", 1800); ar.luceScena(0x6a2aa0, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.ondaTerra(a, 0xc38bff, 4 + k * 2); ar.simboli(a, ["♪", "♫", "♬", "𝄞"][k], "#e0c0ff", { n: 3, dim: .5, verso: d, durata: 500 }); await ar.attendi(200); }
      ar.esplosione(d, 0xc38bff, 60, { velocita: 2.8 }); ar.lampo(0xc38bff, 8, d); ar.scossa = .5; },
    // ---- Vikytal (rune del Nord) ----
    "vikytal:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 130, ruota: .45, colore: 0x8ac8ff }); ar.fendente(d, { colore: 0x8ac8ff }); ar.esplosione(d, 0x8ac8ff, 16, { velocita: 1.6 }); },
    "vikytal:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0x4a8aff, { intensita: .35, dur: 800 }); await ar.orbita(l, { colore: 0x8ac8ff, testo: "ᚱ", n: 6, dur: 800, raggio: .9 }); ar.simboli(p, "ᛟ", "#8ac8ff", { n: 1, dim: .7 }); },
    "vikytal:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8ac8ff"); ar.schermo("gelo", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "ᚦ ᚱ ᛟ", "#8ac8ff", { n: 1, dim: .6 }); await ar.salto(l, { h: 1.8, dur: 600, giri: 1, colore: 0x8ac8ff });
      ar.fendente(d, { colore: 0xffffff, scala: 1.6 }); ar.ondaTerra(d, 0x8ac8ff, 9); ar.esplosione(d, 0x8ac8ff, 65, { velocita: 3 }); ar.lampo(0xffffff, 8, d); ar.scossa = .6; },
    // ---- Alessieno (veleno) ----
    "alessieno:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "🐍", "#7dff4a", { n: 1, dim: .5, verso: d, durata: 400 }); await ar.attendi(350); ar.esplosione(d, 0x7dff4a, 16, { velocita: 1.4 }); },
    "alessieno:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0x7dff4a, dur: 600, densita: 5, dimensione: .22, apertura: .45 }); ar.simboli(d, "☠", "#7dff4a", { n: 3, dim: .4 }); },
    "alessieno:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff4a"); ar.schermo("verde", 1800); ar.luceScena(0x1a4a0a, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(a.clone().add(V(0, .6, 0)), d, { colore: 0x7dff4a, simbolo: "🐍", dim: .8, arco: .7, dur: 500 }); ar.esplosione(d, 0x7dff4a, 60, { velocita: 2.6, su: 1.3 }); ar.simboli(d, "☠", "#7dff4a", { n: 6, dim: .45 }); ar.scossa = .4; },
    // ---- Diegaqua (acqua) ----
    "diegaqua:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0x4fb8ff, dur: 420, densita: 5 }); ar.esplosione(d, 0x9fd8ff, 16, { velocita: 1.6 }); },
    "diegaqua:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("mare", 900); await ar.vortice(1 - l, { giri: 3, dur: 650, colore: 0x4fb8ff }); ar.esplosione(d, 0x9fd8ff, 22, { velocita: 1.6 }); },
    "diegaqua:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fb8ff"); ar.schermo("mare", 2000); ar.luceScena(0x0a3a7a, { intensita: .5, dur: 2000 }); const d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0x9fd8ff, n: 30, dur: 900, larg: 2 }); await ar.colonna(d, 0x4fb8ff, { alt: 4.5, larg: .9 }); ar.ondaTerra(d, 0x4fb8ff, 9); ar.esplosione(d, 0x9fd8ff, 70, { velocita: 3 }); ar.scossa = .55; },
    // ---- Pipgelo (ghiaccio) ----
    "pipgelo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xbfe8ff, simbolo: "❄", dim: .45, arco: .2, dur: 300 }); ar.esplosione(d, 0xbfe8ff, 16, { velocita: 1.5 }); },
    "pipgelo:1": async (ar, l) => { const d = ar.pos(1 - l); ar.pioggia(d, { colore: 0xdff4ff, testo: "❄", n: 16, dur: 800 }); await ar.attendi(500); ar.lampo(0xbfe8ff, 4, d); },
    "pipgelo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#bfe8ff"); ar.schermo("gelo", 2000); ar.luceScena(0x9fd8ff, { intensita: .5, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0xffffff, testo: "❄", n: 26, dur: 1000, larg: 2 }); await ar.raggio(a.clone().add(V(0, .5, 0)), d, { colore: 0xbfe8ff, spessore: .22, dur: 600 }); await ar.colonna(d, 0xdff4ff, { alt: 3, larg: .8 }); ar.esplosione(d, 0xffffff, 60, { velocita: 2.6 }); ar.scossa = .45; },
    // ---- Ritacrys (cristallo) ----
    "ritacrys:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(.2, .5, 0)), d, { colore: 0x9fe8ff, simbolo: "◆", dim: .4, arco: .1, dur: 260 }); ar.esplosione(d, 0x9fe8ff, 14, { velocita: 1.5 }); },
    "ritacrys:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V((k - 1) * .3, .7, 0)), d, { colore: 0x9fe8ff, simbolo: "◆", dim: .35, arco: .3, dur: 300 }); await ar.attendi(110); } await ar.attendi(200); ar.esplosione(d, 0x9fe8ff, 22, { velocita: 1.8 }); },
    "ritacrys:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9fe8ff"); ar.schermo("bianco", 700); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { await ar.raggio(a.clone().add(V((k - 1.5) * .35, .8, 0)), d, { colore: [0xff6ad5, 0x6ad5ff, 0xfff06a, 0x9fe8ff][k], spessore: .1, dur: 260 }); ar.lampo(0xffffff, 4, d); }
      ar.esplosione(d, 0x9fe8ff, 60, { velocita: 2.6 }); ar.simboli(d, "◆", "#9fe8ff", { n: 8, dim: .4 }); ar.scossa = .35; },
    // ---- Alisombra (ombra) ----
    "alisombra:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.teletrasporto(l, { colore: 0x8a3aff }); ar.fendente(d, { colore: 0xb866ff }); ar.esplosione(d, 0x8a3aff, 14, { velocita: 1.4 }); },
    "alisombra:1": async (ar, l) => { ar.schermo("viola", 900); await ar.cloni(l, { n: 2, colore: 0x5a1a9a, dur: 500 }); },
    "alisombra:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("buio", 1800); ar.luceScena(0x100018, { intensita: .15, dur: 1800 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.teletrasporto(l, { colore: 0x8a3aff }); ar.fendente(d, { colore: 0xb866ff, scala: 1.3 }); } ar.esplosione(d, 0x8a3aff, 60, { velocita: 2.6 }); ar.lampo(0xb866ff, 7, d); ar.scossa = .4; },
    // ---- Giuliflora (natura) ----
    "giuliflora:0": async (ar, l) => { const d = ar.pos(1 - l); ar.linea(ar.pos(l).add(V(0, .4, 0)), d, 0x4fd38a, { dur: 400, spessore: .04, onde: 3 }); await ar.attendi(320); ar.esplosione(d, 0x4fd38a, 14, { velocita: 1.4 }); },
    "giuliflora:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("fiori", 1200); await ar.colonna(p, 0x7dffb0, { alt: 2.2 }); ar.simboli(p, "✿", "#ff8fd8", { n: 6, dim: .35, su: 1.3 }); },
    "giuliflora:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fd38a"); ar.schermo("fiori", 1800); ar.luceScena(0x2a6a2a, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.linea(a.clone().add(V((k - 1.5) * .3, .3, 0)), d, 0x4fd38a, { dur: 500, spessore: .05, onde: 4 }); await ar.attendi(90); }
      await ar.attendi(300); ar.esplosione(d, 0xff8fd8, 55, { velocita: 2.4 }); ar.simboli(d, "❀", "#ff8fd8", { n: 8, dim: .4 }); ar.scossa = .3; },
    // ---- Simoluce (luce) ----
    "simoluce:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xfff1bd, spessore: .1, dur: 380 }); ar.lampo(0xfff1bd, 5, d); },
    "simoluce:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("sole", 1000); await ar.colonna(p, 0xffd04a, { alt: 2.5 }); ar.simboli(p, "+3", "#ffd04a", { n: 1, dim: .5 }); },
    "simoluce:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("sole", 1800); ar.luceScena(0xffe9a8, { intensita: .7, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0xfff1bd, { alt: 3.5 }); await ar.raggio(a.clone().add(V(0, 1.2, 0)), d, { colore: 0xfff1bd, spessore: .3, dur: 700 }); ar.schermo("bianco", 600); ar.esplosione(d, 0xffd04a, 70, { velocita: 3 }); ar.scossa = .45; },
    // ---- Tiziamma (fuoco) ----
    "tiziamma:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .3, colore: 0xff6a2a }); ar.esplosione(d, 0xff6a2a, 20, { velocita: 1.8 }); },
    "tiziamma:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0xff7a45, dur: 650, densita: 6 }); ar.esplosione(d, 0xff4a1a, 24, { velocita: 1.8 }); },
    "tiziamma:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6a2a"); ar.schermo("inferno", 1800); ar.luceScena(0xff4a1a, { intensita: .7, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0xff6a2a, { alt: 3 }); await ar.getto(a, d, { colore: 0xff7a45, dur: 800, densita: 9, dimensione: .22, apertura: .5 }); await ar.colonna(d, 0xff4a1a, { alt: 4, larg: .8 }); ar.esplosione(d, 0xff6a2a, 70, { velocita: 3, su: 1.6 }); ar.scossa = .55; },
    // ---- Lollonova (cosmo) ----
    "lollonova:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "✦", "#d08cff", { n: 5, dim: .3, verso: d, durata: 450 }); await ar.attendi(380); ar.esplosione(d, 0xd08cff, 14, { velocita: 1.4 }); },
    "lollonova:1": async (ar, l) => { const d = ar.pos(1 - l); ar.luceScena(0x1a0a3a, { intensita: .3, dur: 900 }); await ar.vortice(1 - l, { giri: 2, dur: 600, colore: 0x6a3aff }); ar.crescita(1 - l, { scala: .8, dur: 500, colore: 0x6a3aff }); },
    "lollonova:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d08cff"); ar.schermo("spazio", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.orbita(l, { colore: 0xd08cff, testo: "✦", n: 8, dur: 700, raggio: 1 }); await ar.proiettile(a.clone().add(V(0, 1, 0)), d, { colore: 0xffffff, dim: .8, arco: .4, dur: 500 });
      ar.schermo("bianco", 700); ar.esplosione(d, 0xd08cff, 80, { velocita: 3.4, su: 1.5 }); ar.lampo(0xffffff, 10, d); ar.scossa = .5; },
    // ---- Ludomagma (magma) ----
    "ludomagma:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 130, ruota: .35, colore: 0xff4a1a }); ar.esplosione(d, 0xff8a2a, 20, { velocita: 1.8 }); ar.ondaTerra(d, 0xff4a1a, 3); },
    "ludomagma:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("calore", 1000); await ar.colonna(p, 0xff4a1a, { alt: 2.6 }); ar.esplosione(p, 0xff8a2a, 26, { velocita: 1.6, su: 1.4 }); },
    "ludomagma:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff4a1a"); ar.schermo("terremoto", 1800); ar.luceScena(0xff3a0a, { intensita: .6, dur: 1800 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { ar.proiettile(d.clone().add(V((k - 2) * .4, 4, 0)), d.clone().add(V((k - 2) * .25, 0, 0)), { colore: 0xff6a2a, dim: .45, arco: 0, dur: 380 }); await ar.attendi(90); }
      await ar.attendi(300); ar.ondaTerra(d, 0xff4a1a, 9); ar.esplosione(d, 0xff8a2a, 70, { velocita: 3 }); ar.scossa = .6; },
    // ---- Mauricore (terra) ----
    "mauricore:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 150, ruota: .25, colore: 0x8a6a4a }); ar.esplosione(d, 0x8a6a4a, 18, { velocita: 1.6 }); },
    "mauricore:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0x8a6a4a, testo: "▲", n: 6, dur: 750, raggio: .9 }); ar.ondaTerra(p, 0x8a6a4a, 3); },
    "mauricore:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a6a4a"); ar.schermo("crepe", 1600); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 1.6, dur: 560, giri: 0, colore: 0x8a6a4a }); ar.ondaTerra(d, 0x8a6a4a, 10); ar.schermo("terremoto", 1200); ar.esplosione(d, 0x8a6a4a, 60, { velocita: 2.8, su: 1.4 }); ar.scossa = .65; },
    // ---- Samulmine (fulmine) ----
    "samulmine:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.fulmine(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0x9fd8ff, volte: 1 }); ar.lampo(0x9fd8ff, 4, d); },
    "samulmine:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.fulmine(d.clone().add(V(0, 4, 0)), d, { colore: 0xffffff, volte: 2, spessore: 2 }); ar.lampo(0xffffff, 7, d); ar.esplosione(d, 0x9fd8ff, 22, { velocita: 2 }); ar.scossa = .25; },
    "samulmine:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9fd8ff"); ar.schermo("tempesta", 1800); ar.luceScena(0x05102a, { intensita: .2, dur: 1800 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { await ar.fulmine(d.clone().add(V((k - 1.5) * .5, 4, 0)), d, { colore: 0x9fd8ff, volte: 1, spessore: 2 }); ar.lampo(0xffffff, 6, d); } ar.esplosione(d, 0x9fd8ff, 60, { velocita: 2.8 }); ar.scossa = .45; },

    // ================= Creature Mistiche =================
    // ---- Lollendigo (wendigo) ----
    "lollendigo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .4, colore: 0xbfe8ff }); ar.fendente(d, { colore: 0xdff4ff }); ar.esplosione(d, 0xbfe8ff, 18, { velocita: 1.7 }); },
    "lollendigo:1": async (ar, l) => { const d = ar.pos(1 - l); ar.luceScena(0x0a1428, { intensita: .3, dur: 900 }); ar.simboli(ar.pos(l), "AAUUHH", "#bfe8ff", { n: 1, dim: .5, verso: d, durata: 600 }); await ar.vortice(1 - l, { giri: 2, dur: 600, colore: 0x9fb8d8 }); },
    "lollendigo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#bfe8ff"); ar.schermo("gelo", 2000); ar.luceScena(0x0a1428, { intensita: .3, dur: 2000 }); const d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0xffffff, testo: "❄", n: 24, dur: 1000, larg: 2 }); for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .95, andata: 80, ritorno: 80, ruota: k % 2 ? .5 : -.5, colore: 0xbfe8ff }); ar.fendente(d, { colore: 0xffffff, scala: 1.3 }); }
      ar.esplosione(d, 0xbfe8ff, 65, { velocita: 3 }); ar.lampo(0xbfe8ff, 8, d); ar.scossa = .5; },
    // ---- Senelagoon (ninfa della laguna) ----
    "senelagoon:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0x3a8a6a, dur: 420, densita: 4 }); ar.esplosione(d, 0x6ac89a, 14, { velocita: 1.4 }); },
    "senelagoon:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "✿", "#f0f4e0", { n: 5, dim: .4, su: 1.3 }); await ar.colonna(p, 0x6ac89a, { alt: 2.3 }); },
    "senelagoon:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6ac89a"); ar.schermo("mare", 2000); ar.luceScena(0x0a2a1e, { intensita: .5, dur: 2000 }); const d = ar.pos(1 - l);
      await ar.vortice(1 - l, { giri: 4, dur: 800, colore: 0x3a8a6a }); await ar.colonna(d, 0x2a6a4a, { alt: 4, larg: .9 }); ar.ondaTerra(d, 0x6ac89a, 8); ar.esplosione(d, 0x6ac89a, 60, { velocita: 2.8 }); ar.scossa = .5; },
    // ---- Vikyeletro (scheletro dei fulmini) ----
    "vikyeletro:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.fulmine(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xb866ff, volte: 1 }); ar.simboli(d, "☠", "#e0d0ff", { n: 1, dim: .5 }); },
    "vikyeletro:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("viola", 900); ar.simboli(d, "☠", "#b866ff", { n: 4, dim: .4 }); await ar.vortice(1 - l, { giri: 2, dur: 550, colore: 0x8a3aff }); },
    "vikyeletro:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("tempesta", 2000); ar.luceScena(0x14002a, { intensita: .2, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.cloni(l, { n: 3, colore: 0xe0d0ff, dur: 450, carica: true }); for (let k = 0; k < 4; k++) { ar.proiettile(a.clone().add(V((k - 1.5) * .3, .5, 0)), d, { colore: 0xe0d0ff, simbolo: "☠", dim: .45, arco: .4, dur: 320 }); await ar.attendi(100); }
      await ar.fulmine(d.clone().add(V(0, 4, 0)), d, { colore: 0xb866ff, volte: 2, spessore: 2 }); ar.esplosione(d, 0xb866ff, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Aligorgona (gorgone) ----
    "aligorgona:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0x8aa84a, simbolo: "🐍", dim: .5, arco: .3, dur: 320 }); ar.esplosione(d, 0x8aa84a, 14, { velocita: 1.4 }); },
    "aligorgona:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xffd04a, spessore: .06, dur: 420 }); ar.lampo(0xffd04a, 5, d); ar.schermo("bn", 700); },
    "aligorgona:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("bn", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 2; k++) { ar.raggio(a.clone().add(V((k - .5) * .2, .8, 0)), d, { colore: 0xffd04a, spessore: .1, dur: 600 }); } await ar.attendi(600);
      ar.crescita(1 - l, { scala: .85, dur: 600, colore: 0x8a8a8a }); ar.esplosione(d, 0x9a9a9a, 55, { velocita: 2.4 }); ar.schermo("crepe", 1000); ar.scossa = .4; },
    // ---- Giulistrega (strega) ----
    "giulistrega:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.salto(l, { h: 1.2, dur: 480, giri: 0, colore: 0xc38bff }); ar.esplosione(d, 0xc38bff, 16, { velocita: 1.5 }); },
    "giulistrega:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("pentacolo", 1100); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xc38bff, simbolo: "✶", dim: .45, arco: .4, dur: 380 }); ar.simboli(d, "✶", "#c38bff", { n: 4, dim: .35 }); },
    "giulistrega:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff4a"); ar.schermo("verde", 1800); ar.luceScena(0x1a2a0a, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0x7dff4a, { alt: 2.5 }); for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V(0, 1, 0)), d.clone().add(V((k - 2) * .25, 0, 0)), { colore: 0x7dff4a, dim: .3, arco: .9, dur: 420 }); await ar.attendi(80); }
      await ar.attendi(350); ar.esplosione(d, 0x7dff4a, 60, { velocita: 2.6, su: 1.4 }); ar.simboli(d, "☠", "#7dff4a", { n: 3, dim: .45 }); ar.scossa = .4; },
    // ---- Samulupo (lupo mannaro) ----
    "samulupo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 110, ruota: .45, colore: 0x8a6a4a }); ar.schermo("tagli", 600); ar.esplosione(d, 0xa08060, 16, { velocita: 1.6 }); },
    "samulupo:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("luna", 1200); ar.simboli(p, "AUUUUU", "#f2efe0", { n: 1, dim: .55 }); await ar.crescita(l, { scala: 1.25, dur: 600, colore: 0xf2efe0 }); },
    "samulupo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2efe0"); ar.schermo("luna", 1900); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "AUUUUUUU", "#f2efe0", { n: 1, dim: .6 }); await ar.attendi(300);
      for (let k = 0; k < 4; k++) { await ar.scatto(l, { k: 1, andata: 70, ritorno: 60, ruota: k % 2 ? .5 : -.5, colore: 0xa08060 }); ar.fendente(d, { colore: 0xffffff, scala: 1.2 }); }
      ar.esplosione(d, 0xa08060, 60, { velocita: 2.8 }); ar.scossa = .5; },
    // ---- Simospirit (fantasma) ----
    "simospirit:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "Buuu", "#dff4ff", { n: 1, dim: .45, verso: d, durata: 450 }); await ar.attendi(380); ar.lampo(0xdff4ff, 4, d); },
    "simospirit:1": async (ar, l) => { await ar.teletrasporto(l, { colore: 0xdff4ff, dietro: false }); ar.schermo("patrono", 900); },
    "simospirit:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#dff4ff"); ar.schermo("patrono", 1800); ar.luceScena(0x9fb8d8, { intensita: .4, dur: 1800 }); const d = ar.pos(1 - l);
      await ar.teletrasporto(l, { colore: 0xdff4ff }); await ar.vortice(1 - l, { giri: 3, dur: 700, colore: 0xdff4ff }); ar.esplosione(d, 0xdff4ff, 55, { velocita: 2.5 }); ar.lampo(0xffffff, 7, d); ar.scossa = .35; },
    // ---- Auranshee (banshee) ----
    "auranshee:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "~", "#ffe08a", { n: 3, dim: .5, verso: d, durata: 450 }); await ar.attendi(380); ar.esplosione(d, 0xffe08a, 12, { velocita: 1.3 }); },
    "auranshee:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.ondaTerra(a.clone().lerp(d, k / 3), 0xffe08a, 3 + k); await ar.attendi(110); } ar.simboli(d, "!!", "#ffe08a", { n: 2, dim: .45 }); ar.scossa = .25; },
    "auranshee:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("dorato", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "AAAAAAH", "#ffe08a", { n: 1, dim: .6 }); for (let k = 0; k < 4; k++) { ar.ondaTerra(a, 0xffd04a, 4 + k * 2); await ar.attendi(160); }
      await ar.raggio(a.clone().add(V(0, .7, 0)), d, { colore: 0xffe08a, spessore: .25, dur: 600 }); ar.esplosione(d, 0xffd04a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Diegombie (zombie) ----
    "diegombie:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .8, andata: 260, ritorno: 340, ruota: .15, colore: 0x7dff4a }); ar.esplosione(d, 0x6a8a3a, 14, { velocita: 1.3 }); },
    "diegombie:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "…ancora qui", "#7dff4a", { n: 1, dim: .45 }); await ar.colonna(p, 0x7dff4a, { alt: 2 }); },
    "diegombie:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff4a"); ar.schermo("verde", 1800); ar.luceScena(0x0a1a0a, { intensita: .3, dur: 1800 }); const d = ar.pos(1 - l);
      await ar.cloni(l, { n: 4, colore: 0x6a8a3a, dur: 500, carica: true }); for (let k = 0; k < 4; k++) { ar.lampo(0x7dff4a, 3, d); await ar.attendi(120); } ar.esplosione(d, 0x7dff4a, 55, { velocita: 2.4 }); ar.scossa = .4; },
    // ---- Ludogargo (gargoyle) ----
    "ludogargo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 130, ruota: .3, colore: 0x8a8a96 }); ar.esplosione(d, 0x8a8a96, 16, { velocita: 1.5 }); },
    "ludogargo:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("bn", 800); await ar.orbita(l, { colore: 0x8a8a96, testo: "◆", n: 6, dur: 750, raggio: .9 }); ar.ondaTerra(p, 0x8a8a96, 3); },
    "ludogargo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a8a96"); ar.schermo("pipistrelli", 1600); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 2.4, dur: 700, giri: 1, colore: 0x8a8a96 }); ar.ondaTerra(d, 0x8a8a96, 9); ar.schermo("crepe", 1000); ar.esplosione(d, 0x8a8a96, 60, { velocita: 2.8, su: 1.4 }); ar.scossa = .6; },
    // ---- Maurimmia (mummia) ----
    "maurimmia:0": async (ar, l) => { const d = ar.pos(1 - l); ar.linea(ar.pos(l).add(V(0, .5, 0)), d, 0xe8d8b0, { dur: 380, spessore: .05, onde: 2 }); await ar.attendi(320); ar.esplosione(d, 0xe8d8b0, 14, { velocita: 1.3 }); },
    "maurimmia:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "☥", "#ffd04a", { n: 3, dim: .5 }); ar.luceScena(0x2a1a00, { intensita: .4, dur: 900 }); await ar.vortice(1 - l, { giri: 2, dur: 600, colore: 0xffd04a }); },
    "maurimmia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("calore", 1900); ar.luceScena(0x8a6a2a, { intensita: .5, dur: 1900 }); const d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0xd8b07a, n: 40, dur: 1000, larg: 2.4 }); await ar.vortice(1 - l, { giri: 4, dur: 900, colore: 0xd8b07a }); ar.esplosione(d, 0xd8b07a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Alessiaracne (ragno) ----
    "alessiaracne:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 100, ritorno: 90, colore: 0xff2a4a }); ar.simboli(d, "🕷", "#ff2a4a", { n: 1, dim: .5 }); },
    "alessiaracne:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("ragnatela", 1100); await ar.ragnatela(ar.pos(l).add(V(0, .5, 0)), d, 0xffffff); },
    "alessiaracne:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2a4a"); ar.schermo("ragnatela", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.proiettile(a.clone().add(V((k - 1.5) * .3, .4, 0)), d, { colore: 0x2a0a0a, simbolo: "🕷", dim: .45, arco: .5, dur: 360 }); await ar.attendi(100); }
      await ar.attendi(300); ar.esplosione(d, 0xff2a4a, 50, { velocita: 2.4 }); ar.scossa = .35; },
    // ---- Pipkenstein (mostro di Frankenstein) ----
    "pipkenstein:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 200, ritorno: 280, ruota: .2, colore: 0x7dff4a }); ar.esplosione(d, 0x7dff4a, 16, { velocita: 1.5 }); },
    "pipkenstein:1": async (ar, l) => { const p = ar.pos(l); await ar.fulmine(p.clone().add(V(0, 4, 0)), p, { colore: 0xc8ffb0, volte: 2 }); ar.lampo(0xc8ffb0, 6, p); ar.simboli(p, "+3", "#7dff4a", { n: 1, dim: .5 }); },
    "pipkenstein:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff4a"); ar.schermo("tempesta", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.fulmine(a.clone().add(V(0, 4, 0)), a, { colore: 0xc8ffb0, volte: 3, spessore: 2 }); ar.simboli(a, "È VIVO!", "#7dff4a", { n: 1, dim: .55 });
      await ar.scatto(l, { k: 1, andata: 160, colore: 0x7dff4a }); ar.esplosione(d, 0x7dff4a, 60, { velocita: 2.8 }); ar.lampo(0xc8ffb0, 8, d); ar.scossa = .5; },
    // ---- Ritarena (sirena) ----
    "ritarena:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0x4fd8d8, dur: 400, densita: 4 }); ar.esplosione(d, 0x9fe8ff, 14, { velocita: 1.4 }); },
    "ritarena:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "♪", "#9fe8ff", { n: 5, dim: .4, su: 1.4 }); await ar.colonna(p, 0x4fd8d8, { alt: 2.2 }); },
    "ritarena:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fd8d8"); ar.schermo("mare", 1900); ar.luceScena(0x0a2a3a, { intensita: .5, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "♫", "#9fe8ff", { n: 4, dim: .45, verso: d, durata: 600 }); await ar.attendi(400); await ar.colonna(d, 0x1a5a7a, { alt: 3.5, larg: .8 }); ar.esplosione(d, 0x4fd8d8, 55, { velocita: 2.6 }); ar.scossa = .4; },
    // ---- Tizidrac (vampiro) ----
    "tizidrac:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.teletrasporto(l, { colore: 0x8a0a1a }); ar.simboli(d, "♥", "#ff2a3a", { n: 3, dim: .35, verso: ar.pos(l), durata: 500 }); },
    "tizidrac:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("pipistrelli", 1300); ar.pioggia(d, { colore: 0x1a0a14, testo: "▾", n: 14, dur: 700 }); await ar.attendi(500); ar.lampo(0x8a0a1a, 4, d); },
    "tizidrac:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2a3a"); ar.schermo("rosso", 1900); ar.luceScena(0x2a0008, { intensita: .3, dur: 1900 }); const d = ar.pos(1 - l);
      ar.schermo("pipistrelli", 1400); await ar.teletrasporto(l, { colore: 0x8a0a1a }); ar.simboli(d, "♥", "#ff2a3a", { n: 8, dim: .4, verso: ar.pos(l), durata: 700 }); ar.esplosione(d, 0xff2a3a, 55, { velocita: 2.5 }); ar.scossa = .4; },

    // ================= Cyborg =================
    // ---- Alessi.AI ----
    "alessiai:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "⌖", "#38e0ff", { n: 1, dim: .6 }); await ar.raggio(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0x38e0ff, spessore: .06, dur: 380 }); ar.lampo(0x38e0ff, 4, d); },
    "alessiai:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("codice", 1000); await ar.orbita(l, { colore: 0x38e0ff, testo: "01", n: 6, dur: 750, raggio: .9 }); ar.simboli(p, "+3", "#38e0ff", { n: 1, dim: .5 }); },
    "alessiai:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#38e0ff"); ar.schermo("codice", 2000); ar.luceScena(0x0a2a3a, { intensita: .5, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d, "⌖", "#38e0ff", { n: 1, dim: .8 }); await ar.attendi(300); for (let k = 0; k < 5; k++) { ar.raggio(a.clone().add(V((k - 2) * .25, .8, 0)), d, { colore: 0x38e0ff, spessore: .07, dur: 300 }); await ar.attendi(80); }
      await ar.attendi(300); ar.schermo("bianco", 600); ar.esplosione(d, 0x38e0ff, 70, { velocita: 3 }); ar.scossa = .5; },
    // ---- Diegobot ----
    "diegobot:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 160, ruota: .2, colore: 0x4fa8ff }); ar.esplosione(d, 0xc8d0e0, 20, { velocita: 1.8 }); ar.ondaTerra(d, 0x4fa8ff, 3); },
    "diegobot:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0x0a2a5a, { intensita: .4, dur: 800 }); await ar.orbita(l, { colore: 0x4fa8ff, testo: "⬡", n: 6, dur: 750, raggio: .9 }); },
    "diegobot:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fa8ff"); ar.schermo("allarme", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0x4fa8ff, { alt: 3 }); await ar.raggio(a.clone().add(V(0, .5, 0)), d, { colore: 0x9fd8ff, spessore: .35, dur: 700 }); ar.esplosione(d, 0x4fa8ff, 70, { velocita: 3.2, su: 1.5 }); ar.lampo(0xffffff, 9, d); ar.scossa = .6; },
    // ---- Ritron ----
    "ritron:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(.2, .5, 0)), d, { colore: 0xb866ff, spessore: .08, dur: 300 }); ar.esplosione(d, 0xb866ff, 14, { velocita: 1.4 }); },
    "ritron:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V(.2, .5, 0)), d, { colore: 0xb866ff, dim: .16, arco: 0, dur: 200 }); await ar.attendi(90); } await ar.attendi(160); ar.esplosione(d, 0xb866ff, 20, { velocita: 1.6 }); },
    "ritron:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b866ff"); ar.schermo("viola", 1800); ar.luceScena(0x2a0a4a, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.esplosione(a.clone().add(V(0, .6, 0)), 0xb866ff, 20, { velocita: .8 }); await ar.attendi(400); await ar.raggio(a.clone().add(V(0, .6, 0)), d, { colore: 0xe0c0ff, spessore: .4, dur: 700 }); ar.schermo("bianco", 600); ar.esplosione(d, 0xb866ff, 70, { velocita: 3 }); ar.scossa = .55; },
    // ---- Piptron ----
    "piptron:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 140, ruota: .2, colore: 0xffd04a }); ar.esplosione(d, 0xffd04a, 16, { velocita: 1.5 }); },
    "piptron:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0x3a2a00, { intensita: .35, dur: 800 }); await ar.colonna(p, 0xffd04a, { alt: 2.4 }); ar.ondaTerra(p, 0xffd04a, 3); },
    "piptron:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("calore", 1800); ar.luceScena(0xff9a1f, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.esplosione(a.clone().add(V(0, .4, 0)), 0xffd04a, 30, { velocita: .9 }); await ar.attendi(350); await ar.proiettile(a.clone().add(V(0, .5, 0)), d, { colore: 0xffd04a, dim: .9, arco: .2, dur: 480 }); ar.esplosione(d, 0xff9a1f, 70, { velocita: 3 }); ar.scossa = .5; },
    // ---- Senetron ----
    "senetron:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "</>", "#7dff4a", { n: 2, dim: .4, verso: d, durata: 450 }); await ar.attendi(380); ar.lampo(0x7dff4a, 4, d); },
    "senetron:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("codice", 1100); ar.simboli(d, "ERROR", "#7dff4a", { n: 1, dim: .5 }); await ar.vortice(1 - l, { giri: 2, dur: 550, colore: 0x7dff4a }); },
    "senetron:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff4a"); ar.schermo("codice", 2000); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.simboli(a, ["0", "1", "</>", "#", "%", "@"][k], "#7dff4a", { n: 2, dim: .4, verso: d, durata: 450 }); await ar.attendi(90); }
      await ar.attendi(400); ar.simboli(d, "100%", "#7dff4a", { n: 1, dim: .6 }); ar.esplosione(d, 0x7dff4a, 55, { velocita: 2.5 }); ar.scossa = .35; },
    // ---- Tizitron ----
    "tizitron:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(.2, .5, 0)), d, { colore: 0xc8d0e0, simbolo: "✊", dim: .5, arco: .1, dur: 280 }); ar.esplosione(d, 0x4fa8ff, 16, { velocita: 1.6 }); },
    "tizitron:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("rosso", 900); await ar.crescita(l, { scala: 1.2, dur: 500, colore: 0xff2a3a }); ar.simboli(p, "!!", "#ff2a3a", { n: 2, dim: .45 }); },
    "tizitron:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fa8ff"); ar.schermo("allarme", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.missili(a.clone().add(V(0, .6, 0)), d, { n: 8, colore: 0xff7a45, dur: 520 }); ar.esplosione(d, 0xff7a45, 65, { velocita: 3 }); ar.scossa = .5; },
    // ---- Vikybyte ----
    "vikybyte:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.teletrasporto(l, { colore: 0xff9a3a }); ar.lampo(0xff9a3a, 4, d); ar.esplosione(d, 0xff9a3a, 14, { velocita: 1.4 }); },
    "vikybyte:1": async (ar, l) => { ar.schermo("ubriaco", 900); await ar.cloni(l, { n: 3, colore: 0xff9a3a, dur: 500 }); },
    "vikybyte:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff9a3a"); ar.schermo("codice", 1800); const d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.teletrasporto(l, { colore: 0xff9a3a }); ar.lampo(0xff9a3a, 5, d); } ar.esplosione(d, 0xff9a3a, 60, { velocita: 2.8 }); ar.scossa = .4; },
    // ---- GiuliByte ----
    "giulibyte:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0x7dff4a, dim: .3, arco: .2, dur: 300 }); ar.esplosione(d, 0x7dff4a, 14, { velocita: 1.4 }); },
    "giulibyte:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "⚙", "#7dff4a", { n: 4, dim: .35, su: 1.3 }); await ar.colonna(p, 0x7dff4a, { alt: 2.2 }); },
    "giulibyte:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dff4a"); ar.schermo("verde", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { ar.linea(a.clone().add(V((k - 1) * .3, .3, 0)), d, 0x7dff4a, { dur: 500, spessore: .04, onde: 3 }); await ar.attendi(90); } await ar.attendi(350); ar.esplosione(d, 0x7dff4a, 50, { velocita: 2.3 }); ar.scossa = .3; },
    // ---- Lolloborg ----
    "lolloborg:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0x9d7bff, spessore: .06, dur: 340 }); ar.lampo(0x9d7bff, 4, d); },
    "lolloborg:1": async (ar, l) => { const d = ar.pos(1 - l); ar.luceScena(0x1a0a3a, { intensita: .3, dur: 900 }); await ar.ragnatela(ar.pos(l).add(V(0, .5, 0)), d, 0x9d7bff); ar.simboli(d, "⬡", "#9d7bff", { n: 4, dim: .35 }); },
    "lolloborg:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9d7bff"); ar.schermo("viola", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "SARAI ASSIMILATO", "#9d7bff", { n: 1, dim: .45 }); await ar.attendi(400); await ar.raggio(a.clone().add(V(0, .7, 0)), d, { colore: 0x9d7bff, spessore: .3, dur: 600 }); ar.esplosione(d, 0x9d7bff, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Ludovolt ----
    "ludovolt:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.fulmine(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0xffe04a, volte: 1 }); ar.lampo(0xffe04a, 4, d); },
    "ludovolt:1": async (ar, l) => { const a = ar.pos(l).add(V(0, .5, 0)), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.fulmine(a, d, { colore: 0xffe04a, volte: 1 }); await ar.attendi(120); } ar.esplosione(d, 0xff9a1f, 22, { velocita: 1.7 }); },
    "ludovolt:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffe04a"); ar.schermo("tempesta", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0xffe04a, { alt: 3 }); for (let k = 0; k < 4; k++) { await ar.fulmine(a.clone().add(V(0, .6, 0)), d, { colore: 0xffe04a, volte: 2, spessore: 2 }); ar.lampo(0xffffff, 6, d); } ar.esplosione(d, 0xffe04a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Samulex ----
    "samulex:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.fulmine(ar.pos(l).add(V(0, .5, 0)), d, { colore: 0x4fc3ff, volte: 1 }); ar.esplosione(d, 0x4fc3ff, 14, { velocita: 1.4 }); },
    "samulex:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0x0a2a5a, { intensita: .4, dur: 800 }); await ar.vortice(l, { giri: 2, dur: 500, colore: 0x4fc3ff }); ar.simboli(p, "⚡", "#4fc3ff", { n: 4, dim: .35, su: 1.3 }); },
    "samulex:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fc3ff"); ar.schermo("tempesta", 1800); const d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.fulmine(d.clone().add(V((k - 1) * .5, 4, 0)), d, { colore: 0x4fc3ff, volte: 2, spessore: 2 }); ar.lampo(0xffffff, 6, d); } ar.esplosione(d, 0x4fc3ff, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Alicircuit ----
    "alicircuit:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 100, ritorno: 90, colore: 0xd06aff }); ar.fendente(d, { colore: 0xd06aff }); },
    "alicircuit:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "⌖", "#ff4a4a", { n: 1, dim: .6 }); await ar.attendi(300); await ar.raggio(ar.pos(l).add(V(.3, .7, 0)), d, { colore: 0xff4a4a, spessore: .05, dur: 280 }); ar.esplosione(d, 0xd06aff, 20, { velocita: 1.8 }); },
    "alicircuit:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d06aff"); ar.schermo("laser", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d, "⌖", "#ff4a4a", { n: 1, dim: .8 }); await ar.attendi(500); await ar.proiettile(a.clone().add(V(.3, .7, 0)), d, { colore: 0xffffff, dim: .25, arco: 0, dur: 180 }); ar.lampo(0xffffff, 8, d); ar.esplosione(d, 0xd06aff, 55, { velocita: 2.6 }); ar.scossa = .35; },
    // ---- Auroroid ----
    "auroroide:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 130, ruota: .25, colore: 0xffd04a }); ar.esplosione(d, 0xffd04a, 14, { velocita: 1.4 }); },
    "auroroide:1": async (ar, l) => { const p = ar.pos(l); await ar.colonna(p, 0xffd04a, { alt: 2.3 }); ar.simboli(p, "+3", "#ffd04a", { n: 1, dim: .5 }); },
    "auroroide:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("dorato", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.raggio(a.clone().add(V(0, .6, 0)), d, { colore: 0xffd04a, spessore: .25, dur: 650 }); ar.esplosione(d, 0xffd04a, 55, { velocita: 2.5 }); ar.scossa = .35; },
    // ---- Mauriborg ----
    "mauriborg:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .8, andata: 200, ritorno: 260, ruota: .15, colore: 0xff9a1f }); ar.esplosione(d, 0xc8d0e0, 18, { velocita: 1.6 }); ar.ondaTerra(d, 0xff9a1f, 3); },
    "mauriborg:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0xff9a1f, testo: "▣", n: 6, dur: 750, raggio: .9 }); ar.ondaTerra(p, 0xff9a1f, 3); },
    "mauriborg:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff9a1f"); ar.schermo("terremoto", 1600); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 1.4, dur: 560, giri: 0, colore: 0xff9a1f }); ar.ondaTerra(d, 0xff9a1f, 9); ar.esplosione(d, 0xff9a1f, 60, { velocita: 2.8, su: 1.4 }); ar.scossa = .6; },
    // ---- Simonex ----
    "simonex:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xff2a3a, spessore: .07, dur: 320 }); ar.lampo(0xff2a3a, 4, d); },
    "simonex:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("allarme", 900); ar.simboli(d, "ERRORE", "#ff2a3a", { n: 1, dim: .5 }); await ar.vortice(1 - l, { giri: 2, dur: 500, colore: 0xff2a3a }); },
    "simonex:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2a3a"); ar.schermo("allarme", 2000); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 3; k > 0; k--) { ar.simboli(a, String(k), "#ff2a3a", { n: 1, dim: .7 }); await ar.attendi(280); }
      await ar.scatto(l, { k: 1, andata: 160, colore: 0xff2a3a }); ar.schermo("bianco", 700); ar.esplosione(d, 0xff2a3a, 80, { velocita: 3.4, su: 1.6 }); ar.lampo(0xffffff, 10, d); ar.scossa = .6; },
    // ================= Carte da Gioco =================
    // ---- Alire (Re di Coppe) ----
    "alire:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xd89a2a, simbolo: "🍷", dim: .45, arco: .5, dur: 360 }); ar.esplosione(d, 0xc82a2a, 16, { velocita: 1.5 }); },
    "alire:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("corona", 1100); ar.simboli(p, "🍷", "#e8b04a", { n: 4, dim: .4, su: 1.3 }); await ar.colonna(p, 0xe8b04a, { alt: 2.4 }); },
    "alire:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c82a2a"); ar.schermo("mazzo", 1900); ar.luceScena(0x5a0a0a, { intensita: .5, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V((k - 2) * .3, .6, 0)), d, { colore: 0xf4ead2, simbolo: "♥", dim: .45, arco: .4, dur: 360, ruota: 3 }); await ar.attendi(80); }
      await ar.attendi(320); ar.esplosione(d, 0xc82a2a, 65, { velocita: 3 }); ar.lampo(0xe8b04a, 8, d); ar.scossa = .5; },
    // ---- Maurire (Re di Bastoni) ----
    "maurire:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 130, ruota: .5, colore: 0x8a5a2a }); ar.esplosione(d, 0x8a5a2a, 18, { velocita: 1.7 }); ar.ondaTerra(d, 0x8a5a2a, 3); },
    "maurire:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "BRISCOLA!", "#e8b04a", { n: 1, dim: .5 }); await ar.scatto(l, { k: 1, andata: 110, ruota: .6, colore: 0xe8b04a }); ar.esplosione(d, 0xe8b04a, 26, { velocita: 2 }); ar.scossa = .25; },
    "maurire:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e8b04a"); ar.schermo("corona", 1700); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 1.8, dur: 620, giri: 1, colore: 0xe8b04a }); ar.ondaTerra(d, 0x8a5a2a, 10); ar.schermo("terremoto", 1000); ar.esplosione(d, 0xe8b04a, 70, { velocita: 3.2, su: 1.5 }); ar.scossa = .65; },
    // ---- Tizire (Re di Spade) ----
    "tizire:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 110, ruota: .4, colore: 0x9fb8ff }); ar.fendente(d, { colore: 0xdfe8ff }); },
    "tizire:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xf4ead2, simbolo: "♠", dim: .55, arco: 0, dur: 260, ruota: 4 }); ar.lampo(0x9fb8ff, 5, d); ar.simboli(d, "✦", "#ffffff", { n: 3, dim: .3 }); },
    "tizire:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2a4a8a"); ar.schermo("tagli", 1500); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "SCOPA!", "#e8b04a", { n: 1, dim: .7 }); await ar.attendi(300);
      for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .95, andata: 70, ritorno: 60, ruota: k % 2 ? .5 : -.5, colore: 0x9fb8ff }); ar.fendente(d, { colore: 0xffffff, scala: 1.4 }); }
      ar.schermo("mazzo", 1200); ar.esplosione(d, 0x9fb8ff, 65, { velocita: 3 }); ar.scossa = .5; },
    // ---- Giulasso (Asso di Bastoni) ----
    "giulasso:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .5, colore: 0x8a5a2a }); ar.esplosione(d, 0x8a5a2a, 18, { velocita: 1.6 }); },
    "giulasso:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "◆", "#e8b04a", { n: 3, dim: .35, verso: ar.pos(l), durata: 500 }); await ar.scatto(l, { k: .9, andata: 110, colore: 0xe8b04a }); },
    "giulasso:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a5a2a"); ar.schermo("mazzo", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(a.clone().add(V(0, 1.2, 0)), d, { colore: 0x7a4a1a, simbolo: "▮", dim: .9, arco: .8, dur: 500, ruota: 3 }); ar.ondaTerra(d, 0x8a5a2a, 8); ar.esplosione(d, 0xe8b04a, 60, { velocita: 2.8 }); ar.scossa = .5; },
    // ---- Lollocallo (Cavallo di Denari) ----
    "lollocallo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: 1, andata: 110, ritorno: 120, ruota: .2, colore: 0xe8b04a }); ar.esplosione(d, 0xe8b04a, 16, { velocita: 1.6 }); },
    "lollocallo:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("velocita", 700); await ar.scatto(l, { k: 1, andata: 90, colore: 0xe8b04a }); ar.simboli(d, "◉", "#e8b04a", { n: 4, dim: .35, verso: ar.pos(l), durata: 500 }); },
    "lollocallo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e8b04a"); ar.schermo("velocita", 1600); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "♞", "#e8b04a", { n: 1, dim: .8 }); for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: 1, andata: 70, ritorno: 60, ruota: .2, colore: 0xe8b04a }); ar.lampo(0xe8b04a, 4, d); }
      ar.pioggia(d, { colore: 0xe8b04a, testo: "◉", n: 18, dur: 700 }); ar.esplosione(d, 0xe8b04a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Ludasso (Asso di Coppe) ----
    "ludasso:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0xa01a3a, dur: 380, densita: 3 }); ar.esplosione(d, 0xa01a3a, 12, { velocita: 1.3 }); },
    "ludasso:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🍷", "#e8b04a", { n: 3, dim: .4, su: 1.2 }); await ar.colonna(p, 0xc82a4a, { alt: 2.2 }); },
    "ludasso:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c82a4a"); ar.schermo("mazzo", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.getto(a, d, { colore: 0xc82a4a, dur: 700, densita: 8, dimensione: .2, apertura: .45 }); ar.esplosione(d, 0xc82a4a, 55, { velocita: 2.5 }); ar.simboli(d, "♥", "#c82a2a", { n: 5, dim: .4 }); ar.scossa = .35; },
    // ---- Samasso (Asso di Denari) ----
    "samasso:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xe8b04a, simbolo: "◉", dim: .4, arco: .6, dur: 340, ruota: 5 }); ar.esplosione(d, 0xe8b04a, 14, { velocita: 1.4 }); },
    "samasso:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("soldi", 1000); ar.simboli(p, "7◆", "#e8b04a", { n: 1, dim: .6 }); await ar.colonna(p, 0xe8b04a, { alt: 2.3 }); },
    "samasso:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e8b04a"); ar.schermo("soldi", 1800); ar.luceScena(0x5a4a0a, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 7; k++) { ar.proiettile(a.clone().add(V((k - 3) * .2, .6, 0)), d, { colore: 0xe8b04a, simbolo: "◉", dim: .35, arco: .6, dur: 360, ruota: 5 }); await ar.attendi(70); }
      await ar.attendi(300); ar.esplosione(d, 0xe8b04a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Pipsante (Fante di Coppe) ----
    "pipsante:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xd89a2a, simbolo: "🍷", dim: .4, arco: .5, dur: 340, ruota: 3 }); ar.esplosione(d, 0xd89a2a, 14, { velocita: 1.4 }); },
    "pipsante:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0xf4ead2, testo: "▯", n: 6, dur: 750, raggio: .9 }); ar.ondaTerra(p, 0xe8b04a, 3); },
    "pipsante:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d89a2a"); ar.schermo("mazzo", 1500); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(a.clone().add(V(0, 1, 0)), d, { colore: 0xf4ead2, simbolo: "▯", dim: .9, arco: .6, dur: 460, ruota: 4 }); ar.esplosione(d, 0xd89a2a, 55, { velocita: 2.5 }); ar.scossa = .4; },
    // ---- Ritare (Re di Denari) ----
    "ritare:0": async (ar, l) => { const d = ar.pos(1 - l); ar.pioggia(d, { colore: 0xe8b04a, testo: "◉", n: 8, dur: 600 }); await ar.attendi(450); ar.esplosione(d, 0xe8b04a, 12, { velocita: 1.3 }); },
    "ritare:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "3·2·A", "#e8b04a", { n: 1, dim: .5, verso: d, durata: 500 }); await ar.attendi(400); await ar.vortice(1 - l, { giri: 2, dur: 500, colore: 0xe8b04a }); },
    "ritare:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e8b04a"); ar.schermo("soldi", 1900); ar.luceScena(0x5a4a0a, { intensita: .5, dur: 1900 }); const d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0xe8b04a, testo: "◉", n: 30, dur: 1000, larg: 2 }); await ar.colonna(d, 0xe8b04a, { alt: 3.5, larg: .8 }); ar.esplosione(d, 0xe8b04a, 60, { velocita: 2.8 }); ar.scossa = .4; },
    // ---- Senecallo (Cavallo di Spade) ----
    "senecallo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xc8d0e0, simbolo: "†", dim: .55, arco: .1, dur: 280 }); ar.esplosione(d, 0x9fb8ff, 14, { velocita: 1.4 }); },
    "senecallo:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "Cucù!", "#9fb8ff", { n: 1, dim: .5 }); await ar.scatto(l, { k: 1, andata: 100, colore: 0x9fb8ff }); ar.esplosione(d, 0x9fb8ff, 22, { velocita: 1.8 }); },
    "senecallo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2a4a8a"); ar.schermo("velocita", 1600); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "♞", "#9fb8ff", { n: 1, dim: .8 }); await ar.scatto(l, { k: 1, andata: 180, colore: 0x9fb8ff }); ar.fendente(d, { colore: 0xffffff, scala: 1.5 }); ar.esplosione(d, 0x9fb8ff, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Vikante (Fante di Bastoni) ----
    "vikante:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 110, ruota: .4, colore: 0x8a5a2a }); ar.esplosione(d, 0x8a5a2a, 14, { velocita: 1.4 }); },
    "vikante:1": async (ar, l) => { ar.schermo("mazzo", 900); await ar.teletrasporto(l, { colore: 0xe8b04a }); },
    "vikante:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a5a2a"); ar.schermo("mazzo", 1600); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "7½", "#e8b04a", { n: 1, dim: .8 }); await ar.attendi(300); await ar.teletrasporto(l, { colore: 0xe8b04a }); for (let k = 0; k < 2; k++) await ar.scatto(l, { k: .95, andata: 70, ritorno: 60, ruota: k % 2 ? .5 : -.5, colore: 0x8a5a2a });
      ar.esplosione(d, 0xe8b04a, 55, { velocita: 2.5 }); ar.scossa = .4; },
    // ---- Alessante (Fante di Spade) ----
    "alessante:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 100, ritorno: 90, colore: 0x9fb8ff }); ar.fendente(d, { colore: 0xdfe8ff, scala: .8 }); },
    "alessante:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "😏", "#ffffff", { n: 1, dim: .6 }); await ar.attendi(350); ar.simboli(d, "?", "#9fb8ff", { n: 3, dim: .45 }); ar.lampo(0x9fb8ff, 3, d); },
    "alessante:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2a4a8a"); ar.schermo("tagli", 1400); const d = ar.pos(1 - l);
      for (let k = 0; k < 2; k++) { await ar.scatto(l, { k: .95, andata: 80, ritorno: 70, ruota: k % 2 ? .5 : -.5, colore: 0x9fb8ff }); ar.fendente(d, { colore: 0xffffff, scala: 1.2 }); } ar.esplosione(d, 0x9fb8ff, 50, { velocita: 2.4 }); ar.scossa = .35; },
    // ---- Aurante (Fante di Denari) ----
    "aurante:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xe8b04a, simbolo: "◉", dim: .4, arco: .5, dur: 320, ruota: 5 }); ar.simboli(d, "◉", "#e8b04a", { n: 1, dim: .35, verso: ar.pos(l), durata: 450 }); },
    "aurante:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.teletrasporto(l, { colore: 0xe8b04a }); ar.esplosione(d, 0xe8b04a, 20, { velocita: 1.8 }); },
    "aurante:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e8b04a"); ar.schermo("soldi", 1500); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.proiettile(a.clone().add(V((k - 1.5) * .25, .6, 0)), d, { colore: 0xe8b04a, simbolo: "◉", dim: .4, arco: .5, dur: 320, ruota: 5 }); await ar.attendi(110); } await ar.attendi(250); ar.esplosione(d, 0xe8b04a, 45, { velocita: 2.2 }); ar.scossa = .3; },
    // ---- Diegallo (Cavallo di Coppe) ----
    "diegallo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 150, ruota: .2, colore: 0xc82a4a }); ar.esplosione(d, 0xc82a4a, 16, { velocita: 1.5 }); ar.ondaTerra(d, 0x8a5a2a, 3); },
    "diegallo:1": async (ar, l) => { await ar.orbita(l, { colore: 0xd89a2a, testo: "🍷", n: 5, dur: 750, raggio: .9 }); },
    "diegallo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c82a4a"); ar.schermo("velocita", 1400); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "♞", "#c82a4a", { n: 1, dim: .8 }); await ar.scatto(l, { k: 1, andata: 200, colore: 0xc82a4a }); ar.ondaTerra(d, 0x8a5a2a, 8); ar.esplosione(d, 0xc82a4a, 55, { velocita: 2.6 }); ar.scossa = .45; },
    // ---- Simocallo (Cavallo di Bastoni) ----
    "simocallo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .5, colore: 0x8a5a2a }); ar.esplosione(d, 0x8a5a2a, 16, { velocita: 1.6 }); },
    "simocallo:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("ubriaco", 800); await ar.vortice(1 - l, { giri: 2, dur: 500, colore: 0x8a5a2a }); ar.simboli(d, "💫", "#e8b04a", { n: 2, dim: .4 }); },
    "simocallo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a5a2a"); ar.schermo("ubriaco", 1500); const d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) await ar.scatto(l, { k: .95, andata: 70, ritorno: 70, ruota: (k - 1) * .6, colore: 0x8a5a2a }); ar.ondaTerra(d, 0x8a5a2a, 7); ar.esplosione(d, 0xe8b04a, 55, { velocita: 2.6 }); ar.scossa = .45; },
    // ================= Paesi del Mondo =================
    // ---- Aurorecia (Grecia) ----
    "aurorecia:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xe8d8a8, simbolo: "↗", dim: .55, arco: .2, dur: 300 }); ar.esplosione(d, 0xe8d8a8, 16, { velocita: 1.6 }); },
    "aurorecia:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("dorato", 1000); ar.simboli(p, "Ω", "#f2e6b0", { n: 3, dim: .45, su: 1.3 }); await ar.colonna(p, 0xf2e6b0, { alt: 2.6 }); },
    "aurorecia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a6ad8"); ar.schermo("dorato", 1900); ar.luceScena(0xf2e6b0, { intensita: .6, dur: 1900 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.fulmine(d.clone().add(V((k - 1) * .5, 4, 0)), d, { colore: 0xfff6c8, volte: 1, spessore: 2 }); ar.lampo(0xffffff, 6, d); }
      await ar.colonna(d, 0xf2e6b0, { alt: 4, larg: .8 }); ar.esplosione(d, 0xf2e6b0, 70, { velocita: 3 }); ar.scossa = .5; },
    // ---- Pipscozia (Scozia) ----
    "pipscozia:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 120, ruota: .5, colore: 0x3a6ad8 }); ar.fendente(d, { colore: 0xdfe8ff, scala: 1.2 }); ar.esplosione(d, 0x3a6ad8, 18, { velocita: 1.7 }); },
    "pipscozia:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a, "♫", "#c8d8ff", { n: 4, dim: .45, verso: d, durata: 600 }); for (let k = 0; k < 3; k++) { ar.ondaTerra(a.clone().lerp(d, k / 3), 0x3a6ad8, 3 + k); await ar.attendi(120); } ar.scossa = .25; },
    "pipscozia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a6ad8"); ar.schermo("tagli", 1500); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "FREEDOM!", "#ffffff", { n: 1, dim: .6 }); await ar.salto(l, { h: 2, dur: 650, giri: 1, colore: 0x3a6ad8 });
      ar.fendente(d, { colore: 0xffffff, scala: 1.8 }); ar.ondaTerra(d, 0x3a6ad8, 10); ar.esplosione(d, 0x3a6ad8, 70, { velocita: 3.2 }); ar.lampo(0xffffff, 8, d); ar.scossa = .65; },
    // ---- Simonusa (Stati Uniti) ----
    "simonusa:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xff2a3a, dim: .3, arco: .7, dur: 360 }); ar.esplosione(d, 0xffffff, 16, { velocita: 2 }); ar.esplosione(d, 0x3a6ad8, 12, { velocita: 1.6 }); },
    "simonusa:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "★", "#ffffff", { n: 6, dim: .35, su: 1.4 }); await ar.colonna(p, 0x3a6ad8, { alt: 2.4 }); ar.esplosione(p.clone().add(V(0, 1.4, 0)), 0xff2a3a, 30, { velocita: 2, su: 1.2 }); },
    "simonusa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2a3a"); ar.schermo("notte", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.proiettile(a.clone().add(V((k - 1.5) * .3, .6, 0)), d.clone().add(V((k - 1.5) * .3, .8, 0)), { colore: [0xff2a3a, 0xffffff, 0x3a6ad8, 0xffd04a][k], dim: .3, arco: .9, dur: 420 }); await ar.attendi(140); }
      await ar.attendi(300); for (const c of [0xff2a3a, 0xffffff, 0x3a6ad8]) { ar.esplosione(d.clone().add(V(0, .8, 0)), c, 50, { velocita: 3, su: 1.3 }); await ar.attendi(120); } ar.scossa = .45; },
    // ---- Aleghilterra (Inghilterra) ----
    "aleghilterra:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xffffff, simbolo: "☕", dim: .45, arco: .5, dur: 360 }); ar.esplosione(d, 0xc8a070, 14, { velocita: 1.4 }); },
    "aleghilterra:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0xc82a3a, testo: "♛", n: 5, dur: 750, raggio: .9 }); ar.ondaTerra(p, 0xc82a3a, 3); },
    "aleghilterra:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c82a3a"); ar.schermo("corona", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(a.clone().add(V(0, 1.2, 0)), d, { colore: 0xffd04a, simbolo: "♛", dim: .9, arco: .7, dur: 520 }); ar.esplosione(d, 0xffd04a, 60, { velocita: 2.8 }); ar.esplosione(d, 0xc82a3a, 40, { velocita: 2.2 }); ar.scossa = .45; },
    // ---- Diegspagna (Spagna) ----
    "diegspagna:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 100, ritorno: 90, colore: 0xffd04a }); ar.fendente(d, { colore: 0xffd04a, scala: .8 }); },
    "diegspagna:1": async (ar, l) => { ar.schermo("rosso", 800); ar.simboli(ar.pos(l), "¡OLÉ!", "#ffd04a", { n: 1, dim: .55 }); await ar.teletrasporto(l, { colore: 0xc82a3a }); },
    "diegspagna:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c82a3a"); ar.schermo("rosso", 1600); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "¡OLÉ!", "#ffd04a", { n: 1, dim: .7 }); for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .95, andata: 70, ritorno: 60, ruota: k % 2 ? .5 : -.5, colore: 0xc82a3a }); ar.fendente(d, { colore: 0xffd04a, scala: 1.2 }); }
      ar.esplosione(d, 0xc82a3a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Ritalia (Italia) ----
    "ritalia:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 110, ruota: .4, colore: 0x2fbf71 }); ar.simboli(d, "✋", "#ffffff", { n: 1, dim: .5 }); ar.esplosione(d, 0xff2a3a, 14, { velocita: 1.5 }); },
    "ritalia:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "MAMMA MIA!", "#ffffff", { n: 1, dim: .5 }); await ar.vortice(1 - l, { giri: 2, dur: 550, colore: 0x2fbf71 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "ritalia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2fbf71"); ar.schermo("terremoto", 1600); const d = ar.pos(1 - l);
      for (const c of [0x2fbf71, 0xffffff, 0xff2a3a]) { ar.proiettile(d.clone().add(V(0, 4, 0)), d, { colore: c, dim: .6, arco: 0, dur: 350 }); await ar.attendi(140); }
      await ar.attendi(250); ar.ondaTerra(d, 0xd8b878, 9); ar.esplosione(d, 0xd8b878, 60, { velocita: 2.8 }); ar.scossa = .55; },
    // ---- Samubrasil (Brasile) ----
    "samubrasil:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.salto(l, { h: .7, dur: 380, giri: 1, colore: 0x2fbf71 }); ar.esplosione(d, 0xffd04a, 16, { velocita: 1.6 }); },
    "samubrasil:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("festa", 1100); ar.pioggia(p, { colore: 0xffd04a, testo: "✦", n: 16, dur: 800 }); await ar.vortice(l, { giri: 2, dur: 500, colore: 0x2fbf71 }); },
    "samubrasil:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2fbf71"); ar.schermo("festa", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.salto(l, { h: 2, dur: 650, giri: 2, colore: 0xffd04a }); await ar.proiettile(a.clone().add(V(0, 1.5, 0)), d, { colore: 0xffffff, simbolo: "⚽", dim: .7, arco: .2, dur: 260 });
      ar.esplosione(d, 0x2fbf71, 55, { velocita: 2.8 }); ar.esplosione(d, 0xffd04a, 40, { velocita: 2.4 }); ar.scossa = .45; },
    // ---- Maurigitto (Egitto) ----
    "maurigitto:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xffd04a, spessore: .06, dur: 340 }); ar.lampo(0xffd04a, 4, d); },
    "maurigitto:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "☥", "#ffd04a", { n: 3, dim: .5 }); ar.luceScena(0x2a1a00, { intensita: .4, dur: 900 }); await ar.vortice(1 - l, { giri: 2, dur: 600, colore: 0xffd04a }); },
    "maurigitto:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("calore", 1900); ar.luceScena(0x8a6a2a, { intensita: .5, dur: 1900 }); const d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0xd8b07a, n: 40, dur: 1000, larg: 2.4 }); await ar.vortice(1 - l, { giri: 4, dur: 900, colore: 0xd8b07a }); ar.esplosione(d, 0xd8b07a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Senesia (Tunisia) ----
    "senesia:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xff4a1a, simbolo: "🌶", dim: .45, arco: .5, dur: 340 }); ar.esplosione(d, 0xff4a1a, 16, { velocita: 1.6 }); },
    "senesia:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("calore", 900); await ar.getto(ar.pos(l), d, { colore: 0xd8b07a, dur: 600, densita: 6 }); },
    "senesia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c82a3a"); ar.schermo("inferno", 1700); ar.luceScena(0xff6a1a, { intensita: .6, dur: 1700 }); const d = ar.pos(1 - l);
      await ar.raggio(d.clone().add(V(0, 4, 0)), d, { colore: 0xffd04a, spessore: .4, dur: 600 }); await ar.colonna(d, 0xff6a1a, { alt: 3.5 }); ar.esplosione(d, 0xff6a1a, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Tizgeria (Algeria) ----
    "tizgeria:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(.2, .6, 0)), d, { colore: 0xc8d0e0, simbolo: "†", dim: .45, arco: .1, dur: 260, ruota: 4 }); ar.esplosione(d, 0x2fbf71, 14, { velocita: 1.4 }); },
    "tizgeria:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V((k - 1) * .3, .6, 0)), d, { colore: 0xd8b07a, dim: .2, arco: .2, dur: 280 }); await ar.attendi(100); } await ar.attendi(200); ar.esplosione(d, 0xd8b07a, 22, { velocita: 1.8 }); },
    "tizgeria:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2fbf71"); ar.schermo("calore", 1600); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "☪", "#ffffff", { n: 1, dim: .6 }); await ar.teletrasporto(l, { colore: 0x2fbf71 }); for (let k = 0; k < 2; k++) await ar.scatto(l, { k: .95, andata: 70, ritorno: 60, ruota: k ? .5 : -.5, colore: 0x2fbf71 });
      ar.esplosione(d, 0x2fbf71, 55, { velocita: 2.6 }); ar.esplosione(d, 0xff2a3a, 25, { velocita: 2 }); ar.scossa = .4; },
    // ---- Vikappone (Giappone) ----
    "vikappone:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "❀", "#ffb0d0", { n: 4, dim: .35, verso: d, durata: 450 }); await ar.attendi(380); ar.esplosione(d, 0xffb0d0, 14, { velocita: 1.4 }); },
    "vikappone:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("fiori", 1200); ar.simboli(p, "🍵", "#ffffff", { n: 1, dim: .5 }); await ar.colonna(p, 0xffb0d0, { alt: 2.2 }); },
    "vikappone:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff5a8a"); ar.schermo("fiori", 1900); ar.luceScena(0x5a1a2a, { intensita: .4, dur: 1900 }); const d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0xffb0d0, testo: "❀", n: 34, dur: 1100, larg: 2.2 }); await ar.vortice(1 - l, { giri: 4, dur: 900, colore: 0xffb0d0 }); ar.esplosione(d, 0xffb0d0, 60, { velocita: 2.6 }); ar.scossa = .35; },
    // ---- Alirtogallo (Portogallo) ----
    "alirtogallo:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♪", "#ffd04a", { n: 2, dim: .4, verso: d, durata: 450 }); await ar.attendi(380); ar.simboli(d, "◉", "#ffd04a", { n: 1, dim: .35, verso: ar.pos(l), durata: 450 }); },
    "alirtogallo:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♫", "#9fb8ff", { n: 3, dim: .45, verso: d, durata: 600 }); await ar.attendi(500); ar.lampo(0x6a8aff, 3, d); },
    "alirtogallo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2fbf71"); ar.schermo("mare", 1800); ar.luceScena(0x0a3a7a, { intensita: .5, dur: 1800 }); const d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0x9fd8ff, n: 30, dur: 900, larg: 2 }); await ar.colonna(d, 0x4fb8ff, { alt: 4.5, larg: .9 }); ar.ondaTerra(d, 0x4fb8ff, 9); ar.esplosione(d, 0x9fd8ff, 60, { velocita: 3 }); ar.scossa = .5; },
    // ---- Giulancia (Francia) ----
    "giulancia:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .5, colore: 0xd8a860 }); ar.simboli(d, "🥖", "#ffffff", { n: 1, dim: .5 }); ar.esplosione(d, 0xd8a860, 14, { velocita: 1.5 }); },
    "giulancia:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🥐", "#ffffff", { n: 1, dim: .55 }); await ar.colonna(p, 0x3a6ad8, { alt: 2.2 }); ar.simboli(p, "+3", "#ffd04a", { n: 1, dim: .45 }); },
    "giulancia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a6ad8"); ar.schermo("corona", 1500); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2, 0)), "🗼", "#ffffff", { n: 1, dim: 1.1 }); await ar.attendi(400); await ar.proiettile(d.clone().add(V(0, 4, 0)), d, { colore: 0x8a8a96, dim: .8, arco: 0, dur: 380 });
      ar.ondaTerra(d, 0x3a6ad8, 9); ar.esplosione(d, 0x3a6ad8, 45, { velocita: 2.6 }); ar.esplosione(d, 0xff2a3a, 30, { velocita: 2.2 }); ar.scossa = .5; },
    // ---- Lollirlanda (Irlanda) ----
    "lollirlanda:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 140, ruota: .25, colore: 0x2fbf71 }); ar.esplosione(d, 0x2fbf71, 16, { velocita: 1.5 }); },
    "lollirlanda:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🍺", "#ffffff", { n: 1, dim: .55 }); await ar.colonna(p, 0x2fbf71, { alt: 2.2 }); ar.simboli(p, "☘", "#2fbf71", { n: 4, dim: .35, su: 1.3 }); },
    "lollirlanda:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2fbf71"); ar.schermo("tempesta", 1700); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 1.6, dur: 560, giri: 0, colore: 0x2fbf71 }); ar.ondaTerra(d, 0x6a7a6a, 10); ar.schermo("crepe", 1000); ar.esplosione(d, 0x2fbf71, 55, { velocita: 2.8, su: 1.4 }); ar.scossa = .6; },
    // ---- Ludormania (Germania) ----
    "ludormania:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xffd04a, simbolo: "🍺", dim: .5, arco: .6, dur: 360, ruota: 3 }); ar.esplosione(d, 0xffd04a, 16, { velocita: 1.5 }); },
    "ludormania:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("festa", 1100); ar.simboli(p, "PROST!", "#ffd04a", { n: 1, dim: .55 }); await ar.colonna(p, 0xffd04a, { alt: 2.3 }); },
    "ludormania:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("festa", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.proiettile(a.clone().add(V((k - 1) * .3, .6, 0)), d, { colore: 0xffd04a, simbolo: "🍺", dim: .5, arco: .6, dur: 300, ruota: 3 }); ar.esplosione(d, 0xffd04a, 20, { velocita: 2 }); }
      ar.esplosione(d, 0xffffff, 40, { velocita: 2.6 }); ar.scossa = .4; },
    // ================= Far West =================
    // ---- Seneloon (Ultra) ----
    "seneloon:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0x6a9a4a, simbolo: "🍾", dim: .5, arco: .6, dur: 360, ruota: 5 }); ar.esplosione(d, 0x9ad87a, 18, { velocita: 1.8 }); ar.esplosione(d, 0xffffff, 8, { velocita: 1.2 }); },
    "seneloon:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("polvere", 1100); ar.simboli(d, "💥", "#ffd04a", { n: 3, dim: .45 }); for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .9, andata: 70, ritorno: 60, ruota: k % 2 ? .4 : -.4, colore: 0xd9893b }); ar.esplosione(d, 0xd9893b, 12, { velocita: 1.5 }); } },
    "seneloon:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d9893b"); ar.schermo("inferno", 1800); ar.luceScena(0xff7a2a, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(a.clone().add(V(0, 1, 0)), d, { colore: 0xffb040, simbolo: "🥃", dim: .7, arco: .8, dur: 480, ruota: 4 });
      ar.lampo(0xffa030, 7, d); await ar.colonna(d, 0xff6a1a, { alt: 3.6, larg: .8 }); ar.esplosione(d, 0xff6a1a, 70, { velocita: 3 }); ar.esplosione(d, 0xffd04a, 40, { velocita: 2.4 }); ar.scossa = .55; },
    // ---- Giuvlass ----
    "giuvlass:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "😉", "#ffffff", { n: 1, dim: .45 }); await ar.attendi(200); await ar.raggio(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xffe0a0, spessore: .04, dur: 160 }); ar.lampo(0xffe0a0, 4, d); ar.esplosione(d, 0xd9893b, 12, { velocita: 1.4 }); },
    "giuvlass:1": async (ar, l) => { ar.simboli(ar.pos(l), "♥", "#ff6a8a", { n: 4, dim: .35, su: 1.2 }); await ar.teletrasporto(l, { colore: 0xd9893b }); },
    "giuvlass:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d9893b"); ar.schermo("mira", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.6, 0)), "🕛", "#ffffff", { n: 1, dim: .7 }); await ar.attendi(550); ar.lampo(0xffffff, 9, a);
      await ar.raggio(a.clone().add(V(0, .7, 0)), d, { colore: 0xfff0c0, spessore: .12, dur: 220 }); ar.esplosione(d, 0xd9893b, 60, { velocita: 3 }); ar.esplosione(d, 0xffffff, 30, { velocita: 2.4 }); ar.scossa = .55; },
    // ---- Ludobunty ----
    "ludobunty:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.lampo(0xffd890, 4, a); await ar.proiettile(a.clone().add(V(0, .6, 0)), d, { colore: 0xffe0a0, dim: .16, arco: 0, dur: 180 }); ar.esplosione(d, 0xd9893b, 14, { velocita: 1.6 }); },
    "ludobunty:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("mira", 1000); ar.simboli(d, "$", "#ffd04a", { n: 5, dim: .4, su: 1.3 }); await ar.vortice(1 - l, { giri: 2, dur: 550, colore: 0xffd04a }); },
    "ludobunty:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d9893b"); ar.schermo("mira", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.6, 0)), "WANTED", "#ffd04a", { n: 1, dim: .7 }); await ar.attendi(400);
      for (let k = 0; k < 3; k++) { ar.lampo(0xffd890, 5, a); await ar.proiettile(a.clone().add(V(0, .6, 0)), d, { colore: 0xffe0a0, dim: .2, arco: 0, dur: 160 }); ar.esplosione(d, 0xd9893b, 20, { velocita: 2 }); await ar.attendi(90); }
      ar.esplosione(d, 0xffd04a, 55, { velocita: 2.8 }); ar.scossa = .5; },
    // ---- Alicolt ----
    "alicolt:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.lampo(0xffe0a0, 4, a); await ar.proiettile(a.clone().add(V(0, .4, 0)), d, { colore: 0xe8e8f0, dim: .16, arco: 0, dur: 160 }); ar.esplosione(d, 0xe8e8f0, 12, { velocita: 1.4 }); },
    "alicolt:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0xe8e8f0, testo: "◉", n: 6, dur: 700, raggio: .8 }); ar.colonna(p, 0xffd04a, { alt: 2 }); },
    "alicolt:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("mira", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.lampo(0xffe0a0, 4, a); ar.proiettile(a.clone().add(V(0, .5, 0)), d.clone().add(V((k % 3 - 1) * .25, .3 + (k % 2) * .4, 0)), { colore: 0xe8e8f0, dim: .16, arco: 0, dur: 150 }); await ar.attendi(110); }
      await ar.attendi(150); ar.esplosione(d, 0xffd04a, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Auroraider ----
    "auroraider:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 110, ruota: .5, colore: 0x8a5a2a }); ar.esplosione(d, 0x8a5a2a, 14, { velocita: 1.5 }); ar.simboli(d, "◉", "#ffd04a", { n: 1, dim: .35, verso: ar.pos(l), durata: 450 }); },
    "auroraider:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("polvere", 1200); await ar.teletrasporto(l, { colore: 0xd9893b }); ar.esplosione(d, 0xd9893b, 20, { velocita: 1.8 }); ar.simboli(d, "$", "#ffd04a", { n: 3, dim: .4, verso: ar.pos(l), durata: 500 }); },
    "auroraider:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d9893b"); ar.schermo("polvere", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "$5000", "#ffd04a", { n: 1, dim: .7 }); await ar.attendi(300);
      for (let k = 0; k < 4; k++) { ar.proiettile(a.clone().add(V(0, .6, 0)), d.clone().add(V((k - 1.5) * .2, .5, 0)), { colore: 0xffe0a0, dim: .18, arco: .1, dur: 200 }); ar.lampo(0xffd890, 4, a); await ar.attendi(100); }
      await ar.scatto(l, { k: .95, andata: 90, ruota: .6, colore: 0xd9893b }); ar.esplosione(d, 0xd9893b, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Lollawless ----
    "lollawless:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .3, colore: 0x8a5a2a }); ar.esplosione(d, 0xd9893b, 16, { velocita: 1.6 }); ar.simboli(d, "💥", "#ffd04a", { n: 1, dim: .4 }); },
    "lollawless:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("polvere", 1000); await ar.vortice(l, { giri: 2, dur: 450, colore: 0xd9893b }); ar.simboli(d, "✦", "#ffd04a", { n: 4, dim: .35 }); ar.esplosione(d, 0xd9893b, 18, { velocita: 1.8 }); },
    "lollawless:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a5a2a"); ar.schermo("polvere", 1600); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "SENZA LEGGE", "#ffffff", { n: 1, dim: .55 }); await ar.salto(l, { h: 1.8, dur: 600, giri: 1, colore: 0xd9893b });
      ar.ondaTerra(d, 0xb06a34, 10); ar.schermo("crepe", 900); ar.esplosione(d, 0xd9893b, 65, { velocita: 3 }); ar.scossa = .6; },
    // ---- Simarshal ----
    "simarshal:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 110, ruota: .4, colore: 0x8a8a96 }); ar.esplosione(d, 0xc8c8d0, 14, { velocita: 1.4 }); },
    "simarshal:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "✶", "#ffd04a", { n: 1, dim: .8 }); await ar.colonna(p, 0xffd04a, { alt: 2.4 }); ar.ondaTerra(p, 0xffd04a, 3); },
    "simarshal:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("dorato", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.proiettile(a.clone().add(V(0, 1.2, 0)), d, { colore: 0xffd04a, simbolo: "✶", dim: 1, arco: .5, dur: 520, ruota: 3 });
      ar.lampo(0xffd04a, 7, d); ar.esplosione(d, 0xffd04a, 60, { velocita: 2.8 }); ar.ondaTerra(d, 0xffd04a, 8); ar.scossa = .45; },
    // ---- Alessoutlaw ----
    "alessoutlaw:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "👓", "#ffffff", { n: 1, dim: .45 }); await ar.raggio(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xd9893b, spessore: .05, dur: 260 }); ar.esplosione(d, 0xd9893b, 12, { velocita: 1.3 }); },
    "alessoutlaw:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("polvere", 1000); await ar.getto(ar.pos(l), d, { colore: 0xd8b07a, dur: 550, densita: 6 }); },
    "alessoutlaw:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a5a2a"); ar.schermo("polvere", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(-1.5, .8, 0)), "🚂", "#ffffff", { n: 1, dim: .9, verso: d, durata: 700 }); await ar.attendi(650);
      ar.esplosione(d, 0x5a5a60, 40, { velocita: 2.2, su: 1.2 }); ar.esplosione(d, 0xd9893b, 45, { velocita: 2.8 }); ar.simboli(d, "$", "#ffd04a", { n: 5, dim: .4, verso: a, durata: 600 }); ar.scossa = .5; },
    // ---- Dieganger ----
    "dieganger:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 130, ruota: .3, colore: 0x6a4a2a }); ar.esplosione(d, 0x8a5a2a, 14, { velocita: 1.5 }); },
    "dieganger:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🔥", "#ffb040", { n: 1, dim: .6 }); ar.luceScena(0xff9a3a, { intensita: .3, dur: 900 }); await ar.colonna(p, 0xffb040, { alt: 2 }); },
    "dieganger:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a5a2a"); ar.schermo("mira", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 2; k++) { ar.lampo(0xffd890, 5, a); await ar.proiettile(a.clone().add(V(0, .7, 0)), d, { colore: 0xffe0a0, dim: .22, arco: 0, dur: 190 }); ar.esplosione(d, 0xd9893b, 22, { velocita: 2 }); await ar.attendi(160); }
      ar.ondaTerra(d, 0x8a5a2a, 7); ar.esplosione(d, 0xd9893b, 45, { velocita: 2.6 }); ar.scossa = .4; },
    // ---- Mauribandit ----
    "mauribandit:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xff4a1a, simbolo: "✸", dim: .35, arco: .6, dur: 360 }); ar.esplosione(d, 0xff6a1a, 18, { velocita: 1.6 }); },
    "mauribandit:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xc82a2a, simbolo: "🧨", dim: .5, arco: .8, dur: 420, ruota: 4 }); ar.lampo(0xffa030, 5, d); ar.esplosione(d, 0xff6a1a, 30, { velocita: 2.2 }); ar.scossa = .25; },
    "mauribandit:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c82a2a"); ar.schermo("inferno", 1800); ar.luceScena(0xff6a1a, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V((k - 1) * .3, .7, 0)), d.clone().add(V((k - 1) * .4, 0, 0)), { colore: 0xc82a2a, simbolo: "🧨", dim: .45, arco: .9, dur: 450, ruota: 4 }); await ar.attendi(120); }
      await ar.attendi(380); ar.schermo("bianco", 300); ar.lampo(0xffffff, 10, d); ar.esplosione(d, 0xff6a1a, 80, { velocita: 3.4, su: 1.3 }); ar.esplosione(d, 0x3a2a1a, 40, { velocita: 2 }); ar.ondaTerra(d, 0xff6a1a, 10); ar.scossa = .75; },
    // ---- Samuero ----
    "samuero:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xc8a060, spessore: .05, dur: 300 }); ar.simboli(d, "◯", "#c8a060", { n: 1, dim: .6 }); ar.esplosione(d, 0xc8a060, 10, { velocita: 1.2 }); },
    "samuero:1": async (ar, l) => { ar.schermo("polvere", 1000); await ar.salto(l, { h: 1, dur: 500, giri: 1, colore: 0xd9893b }); },
    "samuero:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a5a2a"); ar.schermo("polvere", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V(0, .2 + (k % 2) * .3, (k - 2) * .3)), d, { colore: 0x6a4a2a, simbolo: "🐂", dim: .55, arco: .1, dur: 380 }); await ar.attendi(110); }
      await ar.attendi(250); ar.ondaTerra(d, 0xb06a34, 9); ar.esplosione(d, 0xd9893b, 60, { velocita: 2.8 }); ar.scossa = .55; },
    // ---- Pipstolero ----
    "pipstolero:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.lampo(0xffe0a0, 5, a); await ar.proiettile(a.clone().add(V(0, .9, 0)), d, { colore: 0xe8e8f0, dim: .15, arco: 0, dur: 140 }); ar.esplosione(d, 0xd9893b, 12, { velocita: 1.5 }); },
    "pipstolero:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 2; k++) { ar.lampo(0xffe0a0, 4, a); await ar.proiettile(a.clone().add(V(0, .8, 0)), d.clone().add(V(0, .3 * k, 0)), { colore: 0xe8e8f0, dim: .15, arco: 0, dur: 150 }); ar.esplosione(d, 0xd9893b, 10, { velocita: 1.4 }); await ar.attendi(80); } },
    "pipstolero:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d9893b"); ar.schermo("mira", 1700); ar.luceScena(0xffa060, { intensita: .4, dur: 1700 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.attendi(500); ar.lampo(0xffffff, 9, a); await ar.raggio(a.clone().add(V(0, .9, 0)), d, { colore: 0xfff0c0, spessore: .1, dur: 200 });
      ar.esplosione(d, 0xd9893b, 55, { velocita: 2.8 }); ar.esplosione(d, 0xffffff, 25, { velocita: 2 }); ar.scossa = .45; },
    // ---- Ritaloon ----
    "ritaloon:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xc8c8d0, simbolo: "◎", dim: .55, arco: .3, dur: 340, ruota: 6 }); ar.esplosione(d, 0xc8c8d0, 12, { velocita: 1.4 }); },
    "ritaloon:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🥃", "#ffffff", { n: 2, dim: .45, su: 1.2 }); await ar.colonna(p, 0xffb040, { alt: 2.2 }); },
    "ritaloon:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff5a8a"); ar.schermo("note", 1700); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "♪", "#ff8ab0", { n: 5, dim: .4, su: 1.4 }); for (let k = 0; k < 4; k++) await ar.scatto(l, { k: .9, andata: 60, ritorno: 50, ruota: k % 2 ? .5 : -.5, colore: 0xff5a8a });
      ar.esplosione(d, 0xff5a8a, 50, { velocita: 2.6 }); ar.scossa = .35; },
    // ---- Tiziariffo ----
    "tiziariffo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .6, 0)), d, { colore: 0xc8c8d0, simbolo: "⛓", dim: .45, arco: .3, dur: 320, ruota: 3 }); ar.esplosione(d, 0xc8c8d0, 12, { velocita: 1.3 }); },
    "tiziariffo:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "★", "#ffd04a", { n: 1, dim: .8 }); await ar.orbita(l, { colore: 0xffd04a, testo: "★", n: 5, dur: 700, raggio: .9 }); },
    "tiziariffo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("dorato", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "SHERIFF", "#ffd04a", { n: 1, dim: .6 }); await ar.attendi(300); ar.lampo(0xffd890, 6, a);
      await ar.proiettile(a.clone().add(V(0, .7, 0)), d, { colore: 0xffd04a, simbolo: "★", dim: .8, arco: .2, dur: 300, ruota: 4 }); ar.ondaTerra(d, 0xffd04a, 8); ar.esplosione(d, 0xffd04a, 55, { velocita: 2.6 }); ar.scossa = .45; },
    // ---- Vikylasso ----
    "vikylasso:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xc8a060, spessore: .05, dur: 260 }); ar.lampo(0xc8a060, 3, d); ar.esplosione(d, 0xc8a060, 10, { velocita: 1.3 }); },
    "vikylasso:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0xc8a060, testo: "◯", n: 3, dur: 700, raggio: 1 }); ar.colonna(p, 0x7dffb0, { alt: 2 }); },
    "vikylasso:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c8a060"); ar.schermo("polvere", 1600); const d = ar.pos(1 - l);
      await ar.orbita(l, { colore: 0xc8a060, testo: "◯", n: 4, dur: 600, raggio: 1.1 }); await ar.raggio(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xc8a060, spessore: .08, dur: 300 });
      await ar.vortice(1 - l, { giri: 3, dur: 700, colore: 0xc8a060 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.esplosione(d, 0xd9893b, 45, { velocita: 2.4 }); ar.scossa = .4; },
    // ================= Circo Intergalattico =================
    // ---- Simoonauta (Ultra) ----
    "simoonauta:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); await ar.proiettile(a.clone().add(V(0, .7, 0)), d, { colore: 0xff8a3a, simbolo: "🚀", dim: .5, arco: .1, dur: 260 }); ar.esplosione(d, 0xff8a3a, 16, { velocita: 1.7 }); },
    "simoonauta:1": async (ar, l) => { const p = ar.pos(l); for (const n of ["3", "2", "1"]) { ar.simboli(p.clone().add(V(0, 1.4, 0)), n, "#ffe08a", { n: 1, dim: .7 }); await ar.attendi(220); } ar.colonna(p, 0x9b4dff, { alt: 2.6 }); },
    "simoonauta:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9b4dff"); ar.schermo("spazio", 2200); ar.luceScena(0x2a1650, { intensita: .7, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "UOMO CANNONE!", "#ffe08a", { n: 1, dim: .55 }); ar.ondaTerra(a, 0xff8a3a, 4); await ar.salto(l, { h: 2.8, dur: 650, giri: 1, colore: 0xff8a3a });
      ar.schermo("bianco", 250); await ar.scatto(l, { k: 1, andata: 120, ritorno: 120, ruota: 1, colore: 0xff8a3a });
      ar.lampo(0xffffff, 10, d); ar.esplosione(d, 0xff8a3a, 80, { velocita: 3.3 }); ar.esplosione(d, 0x9b4dff, 40, { velocita: 2.4 }); ar.simboli(d, "★", "#ffe08a", { n: 5, dim: .35, su: 1.4 }); ar.scossa = .7; },
    // ---- Aliena ----
    "aliena:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xb06aff, spessore: .06, dur: 220 }); ar.esplosione(d, 0xb06aff, 14, { velocita: 1.5 }); },
    "aliena:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("viola", 1000); ar.simboli(d.clone().add(V(0, 2.2, 0)), "🛸", "#ffffff", { n: 1, dim: .8 }); await ar.colonna(d, 0xb06aff, { alt: 3, larg: .6 }); ar.simboli(d, "⬇", "#c8a8ff", { n: 2, dim: .4 }); },
    "aliena:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b06aff"); ar.schermo("spazio", 2100); ar.luceScena(0x3a1a6a, { intensita: .7, dur: 2100 }); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.8, 0)), "INVASIONE", "#c8a8ff", { n: 1, dim: .6 });
      for (let k = 0; k < 4; k++) { ar.simboli(d.clone().add(V((k - 1.5) * .6, 2.6, 0)), "🛸", "#ffffff", { n: 1, dim: .6 }); ar.raggio(d.clone().add(V((k - 1.5) * .6, 2.4, 0)), d.clone().add(V((k - 1.5) * .2, .2, 0)), { colore: 0xb06aff, spessore: .08, dur: 260 }); await ar.attendi(140); }
      await ar.attendi(200); ar.esplosione(d, 0xb06aff, 70, { velocita: 3 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .45 }); ar.scossa = .6; },
    // ---- Mauriziano ----
    "mauriziano:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.linea(ar.pos(l).add(V(0, .8, 0)), d, 0x6a3a1a, { dur: 180, spessore: .04 }); ar.lampo(0xffe08a, 3, d); ar.esplosione(d, 0x8a4a2a, 14, { velocita: 1.5 }); },
    "mauriziano:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "CRACK!", "#ffe08a", { n: 1, dim: .5 }); await ar.linea(ar.pos(l).add(V(0, .8, 0)), d, 0x6a3a1a, { dur: 160, spessore: .04 }); ar.lampo(0xffffff, 5, d); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "mauriziano:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#5adc8c"); ar.schermo("terremoto", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.5, 0)), "ALLE BESTIE!", "#ffe08a", { n: 1, dim: .55 });
      for (let k = 0; k < 4; k++) { ar.proiettile(a.clone().add(V(0, .3, (k - 1.5) * .3)), d.clone().add(V((k - 1.5) * .15, .3, 0)), { colore: [0x5adc8c, 0x3fd8ff, 0xff7ab8, 0xffd04a][k], simbolo: ["👾", "🦎", "🐙", "👽"][k], dim: .6, arco: .4, dur: 380 }); await ar.attendi(150); }
      await ar.attendi(250); ar.ondaTerra(d, 0x5adc8c, 9); ar.esplosione(d, 0x5adc8c, 70, { velocita: 3 }); ar.scossa = .7; },
    // ---- Lollovni ----
    "lollovni:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .6, colore: 0xf2c14e }); ar.esplosione(d, 0xf2c14e, 16, { velocita: 1.6 }); },
    "lollovni:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("festa", 1100); ar.simboli(p, "🎩", "#ffffff", { n: 1, dim: .6 }); await ar.colonna(p, 0xf2c14e, { alt: 2.5 }); ar.ondaTerra(p, 0x9b4dff, 4); },
    "lollovni:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("festa", 2000); ar.luceScena(0x3a1a6a, { intensita: .6, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.8, 0)), "GRAN FINALE!", "#ffe08a", { n: 1, dim: .6 }); await ar.orbita(l, { colore: 0xf2c14e, testo: "★", n: 8, dur: 600, raggio: 1.2 });
      await ar.raggio(a.clone().add(V(0, 1, 0)), d, { colore: 0xf2c14e, spessore: .22, dur: 420 }); ar.schermo("bianco", 250);
      ar.esplosione(d, 0xf2c14e, 80, { velocita: 3.2 }); ar.esplosione(d, 0x9b4dff, 40, { velocita: 2.4 }); ar.scossa = .55; },
    // ---- Samufo ----
    "samufo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xffffff, simbolo: "🂡", dim: .45, arco: .1, dur: 220, ruota: 10 }); ar.esplosione(d, 0x9b4dff, 12, { velocita: 1.4 }); },
    "samufo:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d.clone().add(V(0, 2.2, 0)), "🛸", "#ffffff", { n: 1, dim: .7 }); await ar.colonna(d, 0x7ad8ff, { alt: 3, larg: .5 }); ar.simboli(d, "🐄", "#ffffff", { n: 1, dim: .45, su: 1.4 }); },
    "samufo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9b4dff"); ar.schermo("incanto", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "ABRACADABRA", "#ffe08a", { n: 1, dim: .55 }); await ar.teletrasporto(l, { colore: 0x9b4dff });
      for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V((k - 2) * .25, 1.2, 0)), d.clone().add(V((k - 2) * .12, .3, 0)), { colore: 0xffffff, simbolo: ["🂡", "🂱", "🃁", "🃑", "🃏"][k], dim: .45, arco: .4, dur: 300, ruota: 8 }); await ar.attendi(100); }
      await ar.attendi(200); ar.esplosione(d, 0x9b4dff, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Senebula ----
    "senebula:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xffb8f0, simbolo: "✦", dim: .4, arco: .4, dur: 320 }); ar.esplosione(d, 0xffb8f0, 14, { velocita: 1.4 }); },
    "senebula:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("viola", 1000); await ar.orbita(l, { colore: 0xffb8f0, testo: "✦", n: 6, dur: 700, raggio: 1 }); ar.colonna(p, 0x7dffb0, { alt: 2.2 }); ar.simboli(p, "♥", "#ffb8f0", { n: 3, dim: .35, su: 1.3 }); },
    "senebula:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffb8f0"); ar.schermo("spazio", 1900); ar.luceScena(0x6a2a8a, { intensita: .6, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.vortice(1 - l, { giri: 3, dur: 800, colore: 0xffb8f0 }); ar.schermo("bianco", 300); ar.lampo(0xffffff, 10, d);
      ar.esplosione(d, 0xffb8f0, 70, { velocita: 3 }); ar.esplosione(d, 0x9b4dff, 40, { velocita: 2.4 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .45 }); ar.scossa = .5; },
    // ---- Alessiastro ----
    "alessiastro:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, 1.4, 0)), d, { colore: 0xffe08a, simbolo: "★", dim: .5, arco: -.2, dur: 260 }); ar.esplosione(d, 0xffe08a, 14, { velocita: 1.5 }); },
    "alessiastro:1": async (ar, l) => { const p = ar.pos(l); ar.luceScena(0x000000, { intensita: .5, dur: 900 }); await ar.colonna(p, 0xffe08a, { alt: 3.5, larg: .7 }); ar.simboli(p, "★", "#ffe08a", { n: 3, dim: .35, su: 1.3 }); },
    "alessiastro:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffe08a"); ar.schermo("spazio", 2000); ar.luceScena(0x1a0a3a, { intensita: .7, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0xffe08a, { alt: 4, larg: .4 }); ar.simboli(d.clone().add(V(0, 1.8, 0)), "SUPERNOVA", "#ffe08a", { n: 1, dim: .6 });
      await ar.raggio(a.clone().add(V(0, 1.2, 0)), d, { colore: 0xfff0c0, spessore: .2, dur: 350 }); ar.schermo("bianco", 300); ar.lampo(0xffffff, 12, d);
      ar.esplosione(d, 0xffe08a, 90, { velocita: 3.5 }); ar.ondaTerra(d, 0xffe08a, 9); ar.scossa = .6; },
    // ---- Aurorbit ----
    "aurorbit:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 90, ritorno: 80, ruota: 1, colore: 0xf2c14e }); ar.esplosione(d, 0xf2c14e, 12, { velocita: 1.4 }); },
    "aurorbit:1": async (ar, l) => { await ar.orbita(l, { colore: 0xf2c14e, testo: "◯", n: 1, dur: 700, raggio: 1 }); await ar.teletrasporto(l, { colore: 0x9b4dff }); },
    "aurorbit:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("velocita", 1800); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 3, dur: 800, giri: 2, colore: 0xf2c14e }); ar.lampo(0xff8a3a, 6, d);
      ar.esplosione(d, 0xff8a3a, 55, { velocita: 2.8 }); ar.esplosione(d, 0xf2c14e, 30, { velocita: 2.2 }); ar.scossa = .45; },
    // ---- Ludovolo ----
    "ludovolo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 110, ruota: .5, colore: 0x7ad8ff }); ar.simboli(d, "🪐", "#ffffff", { n: 1, dim: .45 }); },
    "ludovolo:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0x7ad8ff, testo: "●", n: 4, dur: 700, raggio: 1 }); ar.colonna(p, 0x7dd8ff, { alt: 2 }); },
    "ludovolo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7ad8ff"); ar.schermo("spazio", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.orbita(1 - l, { colore: 0xffd04a, testo: "●", n: 8, dur: 800, raggio: 1.2 }); ar.simboli(d.clone().add(V(0, 1.6, 0)), "☉", "#ffd04a", { n: 1, dim: 1 });
      ar.esplosione(d, 0x7ad8ff, 55, { velocita: 2.6 }); ar.esplosione(d, 0xffd04a, 30, { velocita: 2 }); ar.scossa = .4; },
    // ---- Diegolo ----
    "diegolo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0x3fd8ff, dim: .3, arco: .7, dur: 340 }); ar.esplosione(d, 0x3fd8ff, 12, { velocita: 1.4 }); ar.simboli(d, "◆", "#7dd8ff", { n: 1, dim: .35, verso: ar.pos(l), durata: 450 }); },
    "diegolo:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V(0, 1, 0)), d.clone().add(V((k - 1) * .2, .4, 0)), { colore: [0xff8a3a, 0x3fd8ff, 0xb06aff][k], dim: .3, arco: .8, dur: 360 }); await ar.attendi(110); } await ar.attendi(250); ar.esplosione(d, 0xb06aff, 16, { velocita: 1.6 }); },
    "diegolo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fd8ff"); ar.schermo("spazio", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.orbita(l, { colore: 0x3fd8ff, testo: "●", n: 5, dur: 500, raggio: .9 });
      for (let k = 0; k < 6; k++) { ar.proiettile(d.clone().add(V((k - 2.5) * .3, 3, 0)), d.clone().add(V((k - 2.5) * .15, .2, 0)), { colore: [0xff8a3a, 0x3fd8ff, 0xb06aff][k % 3], dim: .35, arco: 0, dur: 360 }); await ar.attendi(90); }
      await ar.attendi(200); ar.esplosione(d, 0x3fd8ff, 55, { velocita: 2.7 }); ar.simboli(d, "◆", "#7dd8ff", { n: 2, dim: .35, verso: a, durata: 500 }); ar.scossa = .45; },
    // ---- Pipstronauta ----
    "pipstronauta:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 160, ruota: .3, colore: 0xc8c8d8 }); ar.esplosione(d, 0xc8c8d8, 14, { velocita: 1.5 }); },
    "pipstronauta:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🧑‍🚀", "#ffffff", { n: 1, dim: .6 }); await ar.colonna(p, 0x7ad8ff, { alt: 2.3 }); ar.ondaTerra(p, 0x7ad8ff, 3); },
    "pipstronauta:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c8c8d8"); ar.schermo("terremoto", 1700); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 3, dur: 750, giri: 0, colore: 0xc8c8d8 }); ar.schermo("crepe", 1000); ar.ondaTerra(d, 0xc8c8d8, 11); ar.esplosione(d, 0x8a8a96, 70, { velocita: 3, su: 1.3 }); ar.scossa = .8; },
    // ---- Giullia ----
    "giullia:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "♪", "#ffe08a", { n: 2, dim: .35 }); await ar.scatto(l, { k: .85, andata: 100, ruota: .3, colore: 0xff8a3a }); ar.esplosione(d, 0xff8a3a, 12, { velocita: 1.4 }); },
    "giullia:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("calore", 900); await ar.getto(ar.pos(l), d, { colore: 0xb06aff, dur: 600, densita: 7 }); ar.esplosione(d, 0xb06aff, 14, { velocita: 1.5 }); },
    "giullia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8a3a"); ar.schermo("inferno", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.4, 0)), "🤡", "#ffffff", { n: 1, dim: .6 }); await ar.getto(a, d, { colore: 0xff8a3a, dur: 900, densita: 10 });
      ar.esplosione(d, 0xff6a1a, 55, { velocita: 2.6 }); ar.scossa = .4; },
    // ---- Tiziclown ----
    "tiziclown:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xffffff, simbolo: "🎳", dim: .5, arco: .5, dur: 320, ruota: 8 }); ar.esplosione(d, 0xff2e46, 12, { velocita: 1.4 }); },
    "tiziclown:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🥧", "#ffffff", { n: 1, dim: .6 }); await ar.orbita(l, { colore: 0xff2e46, testo: "●", n: 5, dur: 600, raggio: .9 }); ar.ondaTerra(p, 0xff2e46, 3); },
    "tiziclown:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff2e46"); ar.schermo("festa", 1700); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(-1.4, .4, 0)), "🚗", "#ffffff", { n: 1, dim: .9, verso: d, durata: 600 }); await ar.attendi(600);
      ar.simboli(d, "HONK!", "#ffe08a", { n: 1, dim: .6 }); ar.esplosione(d, 0xff2e46, 50, { velocita: 2.6 }); ar.esplosione(d, 0xffe08a, 25, { velocita: 2 }); ar.scossa = .4; },
    // ---- Ritacrobata ----
    "ritacrobata:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 90, ritorno: 80, ruota: 1, colore: 0xffb8f0 }); ar.esplosione(d, 0xffb8f0, 12, { velocita: 1.4 }); },
    "ritacrobata:1": async (ar, l) => { await ar.salto(l, { h: 1.6, dur: 500, giri: 2, colore: 0xffb8f0 }); await ar.teletrasporto(l, { colore: 0xffb8f0 }); },
    "ritacrobata:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffb8f0"); ar.schermo("velocita", 1700); const d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .97, andata: 55, ritorno: 45, ruota: k % 2 ? 1 : -1, colore: 0xffb8f0 }); ar.esplosione(d, 0xffb8f0, 14, { velocita: 1.6 }); }
      ar.esplosione(d, 0x9b4dff, 40, { velocita: 2.4 }); ar.scossa = .35; },
    // ---- Vikyrobata ----
    "vikyrobata:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xf2c14e, simbolo: "◯", dim: .6, arco: .2, dur: 280, ruota: 6 }); ar.esplosione(d, 0xf2c14e, 12, { velocita: 1.4 }); },
    "vikyrobata:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.orbita(1 - l, { colore: 0xf2c14e, testo: "◯", n: 2, dur: 600, raggio: .8 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "vikyrobata:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("spazio", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.salto(l, { h: 2.2, dur: 600, giri: 1, colore: 0xf2c14e }); await ar.proiettile(a.clone().add(V(0, 1.6, 0)), d, { colore: 0xf2c14e, simbolo: "◯", dim: .9, arco: .3, dur: 380, ruota: 8 });
      ar.esplosione(d, 0xf2c14e, 55, { velocita: 2.7 }); ar.simboli(d, "★", "#ffe08a", { n: 4, dim: .35, su: 1.3 }); ar.scossa = .4; },
    // ================= Jolly (carte fuori dal gruppo) =================
    // ---- Arciulo ----
    "arciulo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ritorno: 160, ruota: .6, colore: 0x2a2a2a }); ar.simboli(d, "🪶", "#ffffff", { n: 2, dim: .35 }); ar.esplosione(d, 0xd8d0c8, 14, { velocita: 1.4 }); },
    "arciulo:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("bianco", 260); await ar.orbita(l, { colore: 0xffffff, testo: "✨", n: 6, dur: 700, raggio: .9 }); ar.colonna(p, 0x7dffb0, { alt: 2.2 }); ar.simboli(p, "♥", "#7dffb0", { n: 3, dim: .35, su: 1.3 }); },
    "arciulo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e8443a"); ar.schermo("festa", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "🧹", "#ffffff", { n: 1, dim: .7 }); for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V((k - 2) * .15, 1.1, 0)), d.clone().add(V((k - 2) * .1, .3, 0)), { colore: 0xffffff, simbolo: k % 2 ? "🧽" : "🪶", dim: .45, arco: .5, dur: 300, ruota: 7 }); await ar.attendi(90); }
      await ar.scatto(l, { k: 1, andata: 110, ritorno: 150, ruota: 1.2, colore: 0x2a2a2a }); ar.esplosione(d, 0xffffff, 55, { velocita: 2.8 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .5; },
    // ---- Tomm (producer) ----
    "tomm:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ritorno: 160, ruota: .4, colore: 0x8a4aff }); ar.simboli(d, "🥁", "#ffffff", { n: 1, dim: .4 }); ar.ondaTerra(d, 0x8a4aff, 2); ar.esplosione(d, 0xb08aff, 14, { velocita: 1.4 }); },
    "tomm:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("festa", 700); ar.simboli(p.clone().add(V(0, 1.6, 0)), "🎧", "#ffffff", { n: 1, dim: .6 }); await ar.orbita(l, { colore: 0x8a4aff, testo: "♪", n: 6, dur: 700, raggio: .9 }); ar.simboli(p, "⚡", "#ffd04a", { n: 3, dim: .35, su: 1.3 }); },
    "tomm:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a4aff"); ar.luceScena(0x2a0a5a, { intensita: .7, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.7, 0)), "3… 2… 1…", "#ffffff", { n: 1, dim: .5 }); for (let k = 0; k < 4; k++) { ar.colonna(a.clone().add(V((k - 1.5) * .35, 0, 0)), [0x8a4aff, 0xff4fd8, 0x4ad8ff, 0xffd04a][k], { alt: 1 + k * .4, larg: .25 }); await ar.attendi(160); }
      ar.schermo("festa", 1200); await ar.scatto(l, { k: 1, andata: 110, ritorno: 150, ruota: 1, colore: 0x8a4aff }); ar.simboli(d.clone().add(V(0, 1.4, 0)), "DROP!", "#ff4fd8", { n: 1, dim: .6 });
      ar.ondaTerra(d, 0xff4fd8, 9); ar.esplosione(d, 0x8a4aff, 60, { velocita: 3 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .6; },
    // ---- Yaska.wav (rapper) ----
    "yaska:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.proiettile(a.clone().add(V(0, 1, 0)), d.clone().add(V(0, .4, 0)), { colore: 0xff7a2a, simbolo: "🎤", dim: .4, arco: .3, dur: 280, ruota: 4 }); await ar.attendi(280); ar.esplosione(d, 0xff7a2a, 16, { velocita: 1.6 }); ar.simboli(d, "🔥", "#ff7a2a", { n: 2, dim: .3 }); },
    "yaska:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a.clone().add(V(0, 1.6, 0)), "DISS!", "#ffffff", { n: 1, dim: .55 }); for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V(0, 1.1, 0)), d.clone().add(V((k - 1) * .2, .5, 0)), { colore: 0xe8443a, simbolo: "💬", dim: .4, arco: .4, dur: 300 }); await ar.attendi(110); } await ar.attendi(200); ar.simboli(d, "⬇", "#b06aff", { n: 2, dim: .35 }); },
    "yaska:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a2a"); ar.schermo("calore", 1900); ar.luceScena(0x5a1a00, { intensita: .7, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.7, 0)), "🎤", "#ffffff", { n: 1, dim: .7 }); for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .12, 1.1, 0)), d.clone().add(V((k - 2.5) * .1, .3, 0)), { colore: 0xff7a2a, simbolo: k % 2 ? "🔥" : "♪", dim: .45, arco: .5, dur: 300, ruota: 5 }); await ar.attendi(80); }
      await ar.attendi(200); ar.colonna(d, 0xff7a2a, { alt: 2.6, larg: 1 }); ar.esplosione(d, 0xffb04a, 60, { velocita: 3 }); ar.simboli(d, "🔥", "#ff7a2a", { n: 4, dim: .4, su: 1.4 }); ar.scossa = .6; },
    // ---- Michele ----
    "michele:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: 1, andata: 150, ritorno: 200, ruota: .3, colore: 0x8a1a2a }); ar.ondaTerra(d, 0x8a1a2a, 3); ar.esplosione(d, 0xc8843a, 16, { velocita: 1.6 }); },
    "michele:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("calore", 900); ar.simboli(p.clone().add(V(0, 1.6, 0)), "💪", "#ffffff", { n: 1, dim: .6 }); await ar.colonna(p, 0x8a1a2a, { alt: 2.4, larg: 1 }); ar.simboli(p, "🛡", "#ffffff", { n: 1, dim: .5 }); },
    "michele:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a1a2a"); ar.schermo("terremoto", 1800); ar.luceScena(0x4a1010, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.7, 0)), "RRRIP!", "#ff6a6a", { n: 1, dim: .6 }); for (let k = 0; k < 6; k++) ar.simboli(a.clone().add(V((k - 2.5) * .2, 1.1, 0)), "▰", "#8a1a2a", { n: 1, dim: .3, su: 1.6 });
      await ar.attendi(300); await ar.salto(l, { h: 1.8, dur: 600, giri: 0, colore: 0x8a1a2a }); ar.ondaTerra(d, 0x8a1a2a, 10);
      ar.esplosione(d, 0xc8843a, 65, { velocita: 3 }); ar.esplosione(d, 0x8a1a2a, 30, { velocita: 2.3 }); ar.scossa = .7; },
    // ================= Opere d'Arte =================
    // ---- Monnarita (Ultra) ----
    "monnarita:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l).add(V(0, 1.5, 0)), "🙂", "#ffffff", { n: 1, dim: .45 }); await ar.raggio(ar.pos(l).add(V(0, 1.1, 0)), d, { colore: 0xd8b890, spessore: .06, dur: 240 }); ar.esplosione(d, 0xd8a84a, 14, { velocita: 1.5 }); },
    "monnarita:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("incanto", 1100); ar.simboli(d.clone().add(V(0, 1.7, 0)), "👀", "#ffffff", { n: 1, dim: .55 }); await ar.orbita(1 - l, { colore: 0xd8a84a, testo: "👁", n: 4, dur: 700, raggio: .9 }); ar.simboli(d, "⬇", "#d8a84a", { n: 2, dim: .4 }); },
    "monnarita:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d8a84a"); ar.schermo("dorato", 2100); ar.luceScena(0x4a3a1a, { intensita: .75, dur: 2100 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2.2, 0)), "🖼", "#ffffff", { n: 1, dim: 1.1 }); for (let k = 0; k < 4; k++) { ar.colonna(d.clone().add(V((k - 1.5) * .5, 0, 0)), 0xd8a84a, { alt: 2.2, larg: .35 }); await ar.attendi(110); }
      ar.simboli(a.clone().add(V(0, 1.7, 0)), "🙂", "#ffffff", { n: 1, dim: .6 }); await ar.raggio(a.clone().add(V(0, 1.1, 0)), d, { colore: 0xffe29a, spessore: .18, dur: 420 }); ar.schermo("bianco", 240);
      ar.ondaTerra(d, 0xd8a84a, 9); ar.esplosione(d, 0xd8a84a, 80, { velocita: 3.3 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .45 }); ar.scossa = .65; },
    // ---- L'Urlo di Samu ----
    "urlosamu:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a.clone().add(V(0, 1.5, 0)), "AAAH!", "#ff7a2a", { n: 1, dim: .5 }); ar.ondaTerra(a, 0xff7a2a, 3); await ar.getto(a.clone().add(V(0, 1.1, 0)), d, { colore: 0xff9a3a, dur: 360, densita: 5, apertura: .5 }); ar.esplosione(d, 0xff7a2a, 16, { velocita: 1.6 }); },
    "urlosamu:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("ubriaco", 1100); await ar.vortice(l, { giri: 3, dur: 700, colore: 0xff7a2a }); ar.colonna(p, 0xff4a1a, { alt: 2.4 }); ar.simboli(p, "⬆", "#ff9a3a", { n: 2, dim: .4 }); },
    "urlosamu:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7a2a"); ar.schermo("inferno", 2000); ar.luceScena(0x8a2a0a, { intensita: .8, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 4; k++) { ar.simboli(a.clone().add(V(0, 1.4 + k * .25, 0)), "A".repeat(3 + k * 2) + "H!", ["#ff4a1a", "#ff9a3a", "#2a6aff", "#ffd27a"][k], { n: 1, dim: .45 + k * .08 }); ar.ondaTerra(a, 0xff7a2a, 3 + k * 2); ar.scossa = .2 + k * .12; await ar.attendi(230); }
      await ar.getto(a.clone().add(V(0, 1.1, 0)), d, { colore: 0xff4a1a, dur: 600, densita: 10, apertura: .6 }); ar.schermo("bianco", 220);
      ar.esplosione(d, 0xff7a2a, 70, { velocita: 3.2 }); ar.esplosione(d, 0x2a6aff, 30, { velocita: 2.4 }); ar.scossa = .75; },
    // ---- Alice con l'orecchino di perla ----
    "aliceperla:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, 1.1, 0)), d, { colore: 0xffffff, simbolo: "⚪", dim: .3, arco: .15, dur: 220 }); ar.esplosione(d, 0xf4f0e8, 14, { velocita: 1.5 }); },
    "aliceperla:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("buio", 900); ar.simboli(p.clone().add(V(0, 1.5, 0)), "💎", "#ffffff", { n: 1, dim: .45 }); await ar.teletrasporto(l, { colore: 0x2a6aff, dietro: false }); },
    "aliceperla:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2a5aaa"); ar.schermo("buio", 1900); ar.luceScena(0x0a1020, { intensita: .8, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      const p = a.clone().add(V(0, 1.2, 0)); ar.simboli(p, "⚪", "#ffffff", { n: 1, dim: .6 }); await ar.attendi(450);
      ar.luceScena(0xffe8b0, { intensita: .9, dur: 600 }); await ar.raggio(p, d, { colore: 0xffffff, spessore: .12, dur: 380 }); ar.lampo(0xffffff, 8, d);
      ar.esplosione(d, 0xffffff, 70, { velocita: 3.1 }); ar.esplosione(d, 0x2a5aaa, 25, { velocita: 2.2 }); ar.scossa = .55; },
    // ---- Bonaparte di Tiziano ----
    "bonaparte:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: 1, andata: 130, ritorno: 170, ruota: .5, colore: 0xc8102e }); ar.esplosione(d, 0xc8102e, 16, { velocita: 1.6 }); ar.simboli(d, "🐎", "#ffffff", { n: 1, dim: .4 }); },
    "bonaparte:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("corona", 1000); ar.simboli(p.clone().add(V(0, 1.6, 0)), "👉", "#ffffff", { n: 1, dim: .5 }); await ar.colonna(p, 0xc8102e, { alt: 2.5 }); ar.ondaTerra(p, 0xf2c14e, 4); },
    "bonaparte:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c8102e"); ar.schermo("tempesta", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.8, 0)), "VIVE L'EMPEREUR!", "#ffd27a", { n: 1, dim: .45 }); await ar.salto(l, { h: 2.2, dur: 620, giri: 0, colore: 0xc8102e });
      ar.schermo("bianco", 220); ar.ondaTerra(d, 0xc8102e, 9); ar.esplosione(d, 0xc8102e, 70, { velocita: 3.1 }); ar.esplosione(d, 0xffffff, 30, { velocita: 2.4 }); ar.scossa = .7; },
    // ---- Lollante sul mare di nebbia ----
    "lollante:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 160, ritorno: 200, ruota: .3, colore: 0x8a9aaa }); ar.esplosione(d, 0xbac8d8, 14, { velocita: 1.4 }); },
    "lollante:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("polvere", 1100); ar.getto(p.clone().add(V(0, .2, 0)), p.clone().add(V(0, .3, 0)), { colore: 0xdfe8f0, dur: 700, densita: 6, apertura: 1 }); await ar.colonna(p, 0xbac8d8, { alt: 2.2, larg: .9 }); ar.simboli(p, "🛡", "#ffffff", { n: 1, dim: .5 }); },
    "lollante:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a9aaa"); ar.schermo("polvere", 1900); ar.luceScena(0x5a6a7a, { intensita: .6, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { ar.getto(a.clone().add(V(0, .3, 0)), d.clone().add(V(0, .2 * k, 0)), { colore: 0xdfe8f0, dur: 500, densita: 6, apertura: .8 }); await ar.attendi(200); }
      await ar.salto(l, { h: 1.6, dur: 560, giri: 0, colore: 0x8a9aaa }); ar.ondaTerra(d, 0xbac8d8, 8); ar.esplosione(d, 0xdfe8f0, 65, { velocita: 3 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .55; },
    // ---- Senèbertà che guida il popolo ----
    "seneberta:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0x2a4aaa, simbolo: "🚩", dim: .45, arco: .3, dur: 300, ruota: 4 }); ar.esplosione(d, 0xff6a2a, 14, { velocita: 1.5 }); },
    "seneberta:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("calore", 900); await ar.getto(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xff6a2a, dur: 500, densita: 6, apertura: .4 }); ar.esplosione(d, 0xff4a1a, 22, { velocita: 1.8 }); },
    "seneberta:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2a4aaa"); ar.schermo("inferno", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      for (const [k, c] of [0x2a4aaa, 0xffffff, 0xc8102e].entries()) { ar.colonna(a.clone().add(V((k - 1) * .4, 0, 0)), c, { alt: 2.4, larg: .35 }); await ar.attendi(140); }
      ar.simboli(a.clone().add(V(0, 1.9, 0)), "AVANTI!", "#ffd27a", { n: 1, dim: .55 }); await ar.scatto(l, { k: 1, andata: 130, ritorno: 160, colore: 0xff6a2a });
      ar.esplosione(d, 0xff6a2a, 60, { velocita: 2.9 }); ar.esplosione(d, 0x2a4aaa, 25, { velocita: 2.2 }); ar.scossa = .55; },
    // ---- Pips Gothic ----
    "pipsgothic:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 130, ritorno: 170, ruota: .2, colore: 0x8a8a8a }); ar.simboli(d, "🔱", "#d8d8d8", { n: 1, dim: .45 }); ar.esplosione(d, 0x8a7a5a, 14, { velocita: 1.5 }); },
    "pipsgothic:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l).add(V(0, 1.6, 0)), "😐", "#ffffff", { n: 1, dim: .5 }); await ar.raggio(ar.pos(l).add(V(0, 1.2, 0)), d, { colore: 0x6a6a6a, spessore: .05, dur: 300 }); ar.simboli(d, "⬇", "#aaaaaa", { n: 2, dim: .4 }); },
    "pipsgothic:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a5a3a"); ar.schermo("polvere", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2.1, 0)), "🏠", "#ffffff", { n: 1, dim: .9 }); for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V(0, 1.1, 0)), d.clone().add(V((k - 1) * .2, .3, 0)), { colore: 0xd8c890, simbolo: "🌾", dim: .45, arco: .5, dur: 320, ruota: 4 }); await ar.attendi(120); }
      await ar.scatto(l, { k: 1, andata: 120, ritorno: 160, colore: 0x6a5a3a }); ar.simboli(d, "🔱", "#d8d8d8", { n: 1, dim: .6 }); ar.ondaTerra(d, 0x8a7a5a, 8); ar.esplosione(d, 0x8a7a5a, 65, { velocita: 3 }); ar.scossa = .6; },
    // ---- Aurora con l'ermellino ----
    "auroraermellino:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xf4f0e8, simbolo: "🦦", dim: .45, arco: .4, dur: 300 }); ar.simboli(d, "⚡", "#ffd27a", { n: 1, dim: .35 }); ar.esplosione(d, 0xf4f0e8, 12, { velocita: 1.4 }); },
    "auroraermellino:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 100, ritorno: 140, ruota: .4, colore: 0x8a1a2a }); ar.fendente(d, { colore: 0xf4f0e8, scala: .8 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "auroraermellino:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a1a2a"); ar.schermo("dorato", 1800); ar.luceScena(0x3a1a10, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2, 0)), "🖌", "#ffffff", { n: 1, dim: .8 }); await ar.orbita(1 - l, { colore: 0xf4f0e8, testo: "🦦", n: 4, dur: 800, raggio: 1 });
      ar.esplosione(d, 0x8a1a2a, 55, { velocita: 2.8 }); ar.simboli(d, "⚡", "#ffd27a", { n: 1, dim: .45 }); ar.scossa = .45; },
    // ---- Shot Sage Giuvv ----
    "giuvvsage:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d.clone().add(V(0, 1.5, 0)), "POP!", "#ff4fd8", { n: 1, dim: .5 }); await ar.proiettile(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xffd90f, simbolo: "●", dim: .35, arco: .2, dur: 230 }); ar.esplosione(d, 0x4fc3ff, 14, { velocita: 1.5 }); },
    "giuvvsage:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("disco", 1000); await ar.getto(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xff4fd8, dur: 450, densita: 6 }); ar.simboli(d, "⬇", "#ffd90f", { n: 2, dim: .4 }); },
    "giuvvsage:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff4fd8"); ar.schermo("disco", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      const cc = [0xff4fd8, 0xffd90f, 0x4fc3ff, 0x3adc7a, 0xff7a2a, 0x9b4dff];
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .2, 1.2, 0)), d.clone().add(V((k - 2.5) * .1, .3, 0)), { colore: cc[k], simbolo: "😁", dim: .45, arco: .4, dur: 280 }); ar.simboli(d, "POP", "#" + cc[k].toString(16).padStart(6, "0"), { n: 1, dim: .35 }); await ar.attendi(90); }
      await ar.attendi(220); ar.esplosione(d, 0xff4fd8, 50, { velocita: 2.8 }); ar.esplosione(d, 0xffd90f, 25, { velocita: 2.2 }); ar.scossa = .45; },
    // ---- Vikith e Oloferne ----
    "vikith:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .92, andata: 100, ritorno: 150, ruota: .7, colore: 0xd8d8e8 }); ar.fendente(d, { colore: 0xd8d8e8, scala: 1 }); ar.esplosione(d, 0x8a1a2a, 14, { velocita: 1.5 }); },
    "vikith:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("buio", 1000); ar.simboli(p.clone().add(V(0, 1.5, 0)), "🕯", "#ffd27a", { n: 1, dim: .45 }); await ar.teletrasporto(l, { colore: 0x3a0a1a, dietro: false }); },
    "vikith:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a1a2a"); ar.schermo("buio", 1800); ar.luceScena(0x2a0a0a, { intensita: .8, dur: 1800 }); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.9, 0)), "🗡", "#ffffff", { n: 1, dim: .8 }); await ar.teletrasporto(l, { colore: 0x8a1a2a, dietro: true });
      ar.fendente(d, { colore: 0xffffff, scala: 1.5 }); ar.schermo("rosso", 300); ar.esplosione(d, 0x8a1a2a, 60, { velocita: 2.9 }); ar.scossa = .55; },
    // ---- La morte di Simons ----
    "mortesimons:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xf4f0e8, simbolo: "🪶", dim: .45, arco: .25, dur: 280, ruota: 3 }); ar.esplosione(d, 0xf4f0e8, 12, { velocita: 1.4 }); },
    "mortesimons:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p.clone().add(V(0, 1.4, 0)), "🛁", "#ffffff", { n: 1, dim: .5 }); await ar.orbita(l, { colore: 0xbfe8ff, testo: "○", n: 5, dur: 600, raggio: .8 }); ar.colonna(p, 0xf2c14e, { alt: 2 }); },
    "mortesimons:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a5a4a"); ar.schermo("bn", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "✉", "#f4f0e8", { n: 1, dim: .6 }); await ar.proiettile(a.clone().add(V(0, 1.2, 0)), d, { colore: 0xf4f0e8, simbolo: "✉", dim: .6, arco: .5, dur: 500, ruota: 2 });
      ar.esplosione(d, 0x6a5a4a, 55, { velocita: 2.8 }); ar.simboli(d, "⬇", "#d8c8a8", { n: 2, dim: .4 }); ar.scossa = .45; },
    // ---- Il Diegazzo con la pipa ----
    "diegazzo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l).add(V(0, 1.1, 0)), d, { colore: 0xc8c0b8, dur: 380, densita: 4, apertura: .4 }); ar.esplosione(d, 0x8a7a6a, 12, { velocita: 1.3 }); },
    "diegazzo:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("polvere", 1000); ar.getto(p.clone().add(V(0, 1.1, 0)), p.clone().add(V(0, 2.2, 0)), { colore: 0xd8d0c8, dur: 700, densita: 7, apertura: 1 }); await ar.teletrasporto(l, { colore: 0xc8c0b8, dietro: false }); },
    "diegazzo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a6a4a"); ar.schermo("polvere", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { ar.simboli(a.clone().add(V((k - 2) * .15, 1.3 + k * .15, 0)), "○", "#d8d0c8", { n: 1, dim: .3 + k * .08, su: 1.5 }); await ar.attendi(100); }
      await ar.getto(a.clone().add(V(0, 1.1, 0)), d, { colore: 0xb8b0a8, dur: 600, densita: 9, apertura: .6 }); ar.esplosione(d, 0x8a7a6a, 50, { velocita: 2.6 }); ar.scossa = .4; },
    // ---- Il dinosauro Ludovico ----
    "dinoludovico:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 200, ritorno: 260, ruota: 1, colore: 0x6a8a4a }); ar.esplosione(d, 0x6a8a4a, 14, { velocita: 1.5 }); },
    "dinoludovico:1": async (ar, l) => { const a = ar.pos(l); ar.simboli(a.clone().add(V(0, 1.6, 0)), "ROAAAR!", "#a6e22e", { n: 1, dim: .55 }); ar.ondaTerra(a, 0x6a8a4a, 5); await ar.colonna(a, 0x6a8a4a, { alt: 2.4 }); ar.simboli(a, "⬆", "#a6e22e", { n: 2, dim: .4 }); },
    "dinoludovico:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a8a4a"); ar.schermo("terremoto", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2.4, 0)), "☄", "#ff8a3a", { n: 1, dim: 1 }); await ar.salto(l, { h: 1.4, dur: 650, giri: 0, colore: 0x6a8a4a });
      ar.ondaTerra(d, 0x6a8a4a, 10); ar.esplosione(d, 0x6a8a4a, 60, { velocita: 3 }); ar.esplosione(d, 0xff8a3a, 25, { velocita: 2.4 }); ar.scossa = .7; },
    // ---- La Dama di Alessiott ----
    "damaalessiott:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xbfe8ff, simbolo: "🪞", dim: .45, arco: .3, dur: 280, ruota: 6 }); ar.esplosione(d, 0xbfe8ff, 14, { velocita: 1.4 }); },
    "damaalessiott:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("viola", 1000); await ar.vortice(1 - l, { giri: 2, dur: 600, colore: 0x6a4a8a }); ar.simboli(d, "⬇", "#b89aff", { n: 2, dim: .4 }); },
    "damaalessiott:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4a7a8a"); ar.schermo("mare", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .15, .5, 0)), d.clone().add(V((k - 2.5) * .1, .3, 0)), { colore: 0x8ad8ff, simbolo: k % 2 ? "🌸" : "≈", dim: .4, arco: .2, dur: 300 }); await ar.attendi(90); }
      await ar.attendi(220); ar.esplosione(d, 0x4a7a8a, 50, { velocita: 2.7 }); ar.scossa = .4; },
    // ---- La famiglia Pecorella ----
    "pecorella:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 180, ritorno: 230, ruota: .3, colore: 0xc8843a }); ar.esplosione(d, 0xc8843a, 14, { velocita: 1.4 }); },
    "pecorella:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("festa", 1000); await ar.orbita(l, { colore: 0xffe08a, testo: "🍝", n: 5, dur: 650, raggio: .9 }); ar.colonna(p, 0x7dffb0, { alt: 2.2 }); ar.simboli(p, "♥", "#7dffb0", { n: 3, dim: .35, su: 1.3 }); },
    "pecorella:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c8843a"); ar.schermo("terremoto", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.7, 0)), "👨‍👩‍👦‍👦", "#ffffff", { n: 1, dim: .8 }); await ar.salto(l, { h: 1.5, dur: 600, giri: 0, colore: 0xc8843a });
      ar.ondaTerra(d, 0xc8843a, 10); ar.esplosione(d, 0xc8843a, 55, { velocita: 2.8 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .65; },
    // ================= Colori =================
    // ---- Aurormo (Ultra) ----
    "aurormo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xf4f0e8, simbolo: "◆", dim: .4, arco: .3, dur: 280, ruota: 7 }); ar.esplosione(d, 0xffffff, 14, { velocita: 1.5 }); },
    "aurormo:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("bianco", 300); ar.luceScena(0xffffff, { intensita: .5, dur: 900 }); await ar.colonna(p, 0xffffff, { alt: 2.8, larg: .9 }); ar.simboli(p, "✦", "#ffffff", { n: 5, dim: .35, su: 1.4 }); },
    "aurormo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f4f0e8"); ar.schermo("bianco", 260); ar.luceScena(0xffffff, { intensita: .8, dur: 2100 }); const a = ar.pos(l), d = ar.pos(1 - l);
      const arco = [0xff2e46, 0xff9a1f, 0xffd90f, 0x3adc7a, 0x2a8adf, 0x9b4dff];
      for (const [k, c] of arco.entries()) { ar.raggio(a.clone().add(V(0, .7 + k * .12, 0)), d.clone().add(V(0, .3 + k * .1, 0)), { colore: c, spessore: .07, dur: 300 }); await ar.attendi(70); }
      await ar.attendi(200); ar.simboli(d.clone().add(V(0, 1.8, 0)), "🗿", "#ffffff", { n: 1, dim: 1 }); ar.schermo("bianco", 300); ar.ondaTerra(d, 0xffffff, 9);
      ar.esplosione(d, 0xffffff, 80, { velocita: 3.3 }); for (const c of arco) ar.esplosione(d, c, 10, { velocita: 2.4 }); ar.scossa = .65; },
    // ---- Pipscuro ----
    "pipscuro:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.teletrasporto(l, { colore: 0x2a2a3a, dietro: true }); ar.fendente(d, { colore: 0x6a6a8a, scala: 1 }); ar.esplosione(d, 0x1a1a2a, 16, { velocita: 1.6 }); },
    "pipscuro:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("buio", 1100); ar.luceScena(0x0a0a14, { intensita: .8, dur: 1100 }); await ar.vortice(l, { giri: 2, dur: 600, colore: 0x2a2a3a }); ar.simboli(p, "☾", "#fff1b8", { n: 1, dim: .5 }); },
    "pipscuro:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2a2a3a"); ar.schermo("buio", 2000); ar.luceScena(0x05050a, { intensita: .9, dur: 2000 }); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2.1, 0)), "🌕", "#ffffff", { n: 1, dim: .8 }); for (let k = 0; k < 4; k++) { ar.fendente(d.clone().add(V((k % 2 ? .2 : -.2), .2 * k, 0)), { colore: 0x8a8aa8, scala: 1.2 }); await ar.attendi(140); }
      ar.getto(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0x0a0a14, dur: 450, densita: 8 }); await ar.attendi(380);
      ar.esplosione(d, 0x1a1a2a, 70, { velocita: 3 }); ar.simboli(d, "⬇", "#8a8aa8", { n: 2, dim: .4 }); ar.scossa = .6; },
    // ---- Lolloblitz ----
    "lolloblitz:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.fulmine(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0x2a6aff, volte: 1 }); ar.esplosione(d, 0x4fa8ff, 16, { velocita: 1.6 }); },
    "lolloblitz:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("tempesta", 900); await ar.fulmine(d.clone().add(V(0, 4, 0)), d, { colore: 0x9ad8ff, volte: 2 }); ar.simboli(d.clone().add(V(0, 1.6, 0)), "🏛", "#ffffff", { n: 1, dim: .6 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "lolloblitz:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2a6aff"); ar.schermo("tempesta", 2000); ar.luceScena(0x0a1a5a, { intensita: .7, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { ar.fulmine(d.clone().add(V((k - 2) * .5, 4, 0)), d.clone().add(V((k - 2) * .1, .2, 0)), { colore: k % 2 ? 0x9ad8ff : 0x2a6aff, volte: 1 }); ar.schermo("bianco", 80); await ar.attendi(150); }
      ar.scatto(l, { k: 1, andata: 110, ritorno: 160, colore: 0x2a6aff }); ar.ondaTerra(d, 0x2a6aff, 9); ar.esplosione(d, 0x4fa8ff, 75, { velocita: 3.2 }); ar.scossa = .7; },
    // ---- Mauzzurro ----
    "mauzzurro:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0x4fb8ff, dur: 420, densita: 5 }); ar.esplosione(d, 0xbfe8ff, 14, { velocita: 1.5 }); },
    "mauzzurro:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("mare", 1000); ar.simboli(p.clone().add(V(0, 1.5, 0)), "⛵", "#ffffff", { n: 1, dim: .5 }); await ar.colonna(p, 0x4fb8ff, { alt: 2.4, larg: .8 }); ar.simboli(p, "🛡", "#ffffff", { n: 1, dim: .5 }); },
    "mauzzurro:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#2a8adf"); ar.schermo("mare", 2000); ar.luceScena(0x0a3a8a, { intensita: .6, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { ar.ondaTerra(a.clone().lerp(d, .3 + k * .25), 0x4fb8ff, 4 + k * 2); await ar.attendi(200); }
      await ar.getto(a.clone().add(V(0, 1.2, 0)), d, { colore: 0x2a8adf, dur: 700, densita: 10, apertura: .5 }); ar.pioggia(d, { colore: 0xbfe8ff, n: 24, dur: 700, larg: 1.2 });
      ar.esplosione(d, 0x4fb8ff, 70, { velocita: 3.1 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .6; },
    // ---- Giulilla ----
    "giulilla:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xc8a0ff, simbolo: "❀", dim: .4, arco: .35, dur: 300, ruota: 6 }); ar.esplosione(d, 0xc8a0ff, 14, { velocita: 1.4 }); },
    "giulilla:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("viola", 1000); await ar.getto(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xd8b8ff, dur: 550, densita: 5, apertura: .5 }); ar.simboli(d, "❀", "#c8a0ff", { n: 4, dim: .3 }); ar.simboli(d, "⬇", "#c8a0ff", { n: 2, dim: .4 }); },
    "giulilla:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#b88aff"); ar.schermo("luna", 1900); ar.luceScena(0x3a1a6a, { intensita: .6, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2.1, 0)), "🌕", "#ffffff", { n: 1, dim: .8 }); await ar.orbita(1 - l, { colore: 0xc8a0ff, testo: "❀", n: 8, dur: 900, raggio: 1.1 });
      await ar.raggio(a.clone().add(V(0, 1.1, 0)), d, { colore: 0xb88aff, spessore: .14, dur: 360 }); ar.esplosione(d, 0xc8a0ff, 65, { velocita: 3 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .5; },
    // ---- Simoborg ----
    "simoborg:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0x8a1a3a, simbolo: "🍷", dim: .45, arco: .3, dur: 280, ruota: 5 }); ar.esplosione(d, 0x8a1a3a, 16, { velocita: 1.6 }); },
    "simoborg:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("rosso", 900); await ar.orbita(l, { colore: 0x8a1a3a, testo: "🍇", n: 5, dur: 650, raggio: .9 }); ar.colonna(p, 0x8a1a3a, { alt: 2.3 }); ar.simboli(p, "⬆", "#ff6a8a", { n: 2, dim: .4 }); },
    "simoborg:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a1a3a"); ar.schermo("rosso", 1900); ar.luceScena(0x4a0a1a, { intensita: .7, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2.1, 0)), "🌕", "#ff6a6a", { n: 1, dim: .8 }); await ar.salto(l, { h: 2.1, dur: 600, giri: 1, colore: 0x8a1a3a });
      ar.ondaTerra(d, 0x8a1a3a, 9); ar.esplosione(d, 0x8a1a3a, 80, { velocita: 3.2 }); ar.esplosione(d, 0xff4a6a, 30, { velocita: 2.3 }); ar.scossa = .7; },
    // ---- Vikfuchsia ----
    "vikfuchsia:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xff4fd8, simbolo: "✿", dim: .4, arco: .3, dur: 260, ruota: 8 }); ar.esplosione(d, 0xff4fd8, 14, { velocita: 1.4 }); },
    "vikfuchsia:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🌺", "#ffffff", { n: 4, dim: .35, su: 1.3 }); await ar.teletrasporto(l, { colore: 0xff4fd8, dietro: false }); },
    "vikfuchsia:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff4fd8"); ar.schermo("viola", 1800); ar.luceScena(0x6a0a4a, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 7; k++) { ar.proiettile(a.clone().add(V((k - 3) * .15, 1.2, 0)), d.clone().add(V((k - 3) * .1, .3, 0)), { colore: 0xff4fd8, simbolo: k % 2 ? "🌺" : "✿", dim: .45, arco: .5, dur: 320, ruota: 8 }); await ar.attendi(80); }
      await ar.attendi(240); ar.esplosione(d, 0xff4fd8, 65, { velocita: 3 }); ar.esplosione(d, 0xffa0e8, 25, { velocita: 2.2 }); ar.scossa = .5; },
    // ---- Diegosa ----
    "diegosa:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xff8fb8, simbolo: "🌹", dim: .45, arco: .3, dur: 280 }); ar.esplosione(d, 0xff8fb8, 14, { velocita: 1.4 }); },
    "diegosa:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("festa", 1000); ar.simboli(p.clone().add(V(0, 1.5, 0)), "♛", "#ffd27a", { n: 1, dim: .5 }); await ar.colonna(p, 0xff8fb8, { alt: 2.3 }); ar.ondaTerra(p, 0xff8fb8, 3); },
    "diegosa:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8fb8"); ar.schermo("corona", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.9, 0)), "🌅", "#ffffff", { n: 1, dim: .8 }); await ar.scatto(l, { k: 1, andata: 130, ritorno: 150, ruota: .6, colore: 0xff8fb8 });
      ar.fendente(d, { colore: 0x3a8a3a, scala: 1.3 }); ar.esplosione(d, 0xff8fb8, 60, { velocita: 2.9 }); ar.simboli(d, "🌹", "#ffffff", { n: 3, dim: .35 }); ar.scossa = .5; },
    // ---- Ritavola ----
    "ritavola:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0x9b4dff, simbolo: "❀", dim: .4, arco: .35, dur: 300, ruota: 6 }); ar.esplosione(d, 0x9b4dff, 12, { velocita: 1.4 }); },
    "ritavola:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("viola", 900); await ar.orbita(l, { colore: 0x9b4dff, testo: "⚡", n: 4, dur: 600, raggio: .8 }); ar.colonna(p, 0xf2c14e, { alt: 2 }); },
    "ritavola:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9b4dff"); ar.schermo("viola", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.pioggia(d, { colore: 0xb88aff, n: 30, dur: 1000, larg: 1.3 }); for (let k = 0; k < 4; k++) { ar.simboli(d.clone().add(V((k - 1.5) * .3, 2, 0)), "❀", "#c8a0ff", { n: 1, dim: .4 }); await ar.attendi(150); }
      await ar.attendi(250); ar.esplosione(d, 0x9b4dff, 60, { velocita: 2.8 }); ar.simboli(d, "⬇", "#c8a0ff", { n: 2, dim: .4 }); ar.scossa = .45; },
    // ---- Samuarancio ----
    "samuarancio:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xff9a1f, simbolo: "🍊", dim: .45, arco: .4, dur: 300, ruota: 6 }); ar.esplosione(d, 0xffb84d, 16, { velocita: 1.5 }); },
    "samuarancio:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("calore", 900); await ar.getto(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xff9a1f, dur: 500, densita: 6, apertura: .4 }); ar.esplosione(d, 0xff6a1a, 24, { velocita: 1.9 }); },
    "samuarancio:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff9a1f"); ar.schermo("sole", 1900); ar.luceScena(0x8a3a0a, { intensita: .6, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2.1, 0)), "☀", "#ffd27a", { n: 1, dim: 1 }); for (let k = 0; k < 5; k++) { ar.proiettile(a.clone().add(V((k - 2) * .2, 1.2, 0)), d.clone().add(V((k - 2) * .12, .3, 0)), { colore: 0xff9a1f, simbolo: "🍊", dim: .5, arco: .6, dur: 340, ruota: 6 }); await ar.attendi(100); }
      await ar.attendi(260); ar.esplosione(d, 0xff9a1f, 60, { velocita: 2.9 }); ar.esplosione(d, 0xff4a1a, 30, { velocita: 2.3 }); ar.scossa = .5; },
    // ---- Ludovirde ----
    "ludovirde:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0x3fe0c0, spessore: .06, dur: 220 }); ar.esplosione(d, 0x3fe0c0, 14, { velocita: 1.5 }); },
    "ludovirde:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("mare", 900); await ar.proiettile(ar.pos(l).add(V(0, 1.2, 0)), d, { colore: 0x9affe8, simbolo: "🪼", dim: .55, arco: .4, dur: 420 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "ludovirde:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3fe0c0"); ar.schermo("mare", 1900); ar.luceScena(0x0a4a4a, { intensita: .65, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 10; k++) ar.simboli(a.clone().add(V((Math.random() - .5) * 2, Math.random() * .5, 0)), "○", "#9affe8", { n: 1, dim: .25, su: 2 });
      await ar.attendi(300); await ar.raggio(a.clone().add(V(0, 1.1, 0)), d, { colore: 0x3fe0c0, spessore: .18, dur: 450 }); ar.ondaTerra(d, 0x3fe0c0, 7);
      ar.esplosione(d, 0x3fe0c0, 65, { velocita: 3 }); ar.scossa = .5; },
    // ---- Alessiallo ----
    "alessiallo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xffd21a, simbolo: "🌻", dim: .45, arco: .3, dur: 280, ruota: 6 }); ar.esplosione(d, 0xffd21a, 12, { velocita: 1.4 }); },
    "alessiallo:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("sole", 900); await ar.colonna(p, 0xffd21a, { alt: 2.3, larg: .8 }); ar.simboli(p, "🛡", "#ffffff", { n: 1, dim: .5 }); },
    "alessiallo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd21a"); ar.schermo("sole", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .18, 1.1, 0)), d.clone().add(V((k - 2.5) * .1, .3, 0)), { colore: 0xffd21a, simbolo: "🌻", dim: .45, arco: .5, dur: 320, ruota: 5 }); await ar.attendi(90); }
      await ar.attendi(240); ar.esplosione(d, 0xffd21a, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Aliverde ----
    "aliverde:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xe8ff7a, simbolo: "✦", dim: .35, arco: .25, dur: 260 }); ar.simboli(d, "⚡", "#e8ff7a", { n: 1, dim: .35 }); ar.esplosione(d, 0x3adc7a, 12, { velocita: 1.4 }); },
    "aliverde:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("verde", 900); ar.pioggia(d, { colore: 0xc8fff0, n: 26, dur: 700, larg: .8 }); await ar.attendi(450); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "aliverde:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3adc7a"); ar.schermo("verde", 1800); ar.luceScena(0x0a4a2a, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.orbita(1 - l, { colore: 0xe8ff7a, testo: "✦", n: 10, dur: 900, raggio: 1.1 }); ar.getto(a.clone().add(V(0, 1, 0)), d, { colore: 0x3adc7a, dur: 450, densita: 6 }); await ar.attendi(400);
      ar.esplosione(d, 0x3adc7a, 55, { velocita: 2.8 }); ar.simboli(d, "⚡", "#e8ff7a", { n: 1, dim: .4 }); ar.scossa = .45; },
    // ---- Tizianverde ----
    "tizianverde:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ritorno: 160, ruota: .8, colore: 0x8ad83a }); ar.fendente(d, { colore: 0x8ad83a, scala: .9 }); ar.esplosione(d, 0x8ad83a, 12, { velocita: 1.4 }); },
    "tizianverde:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xa6e22e, dur: 450, densita: 5, apertura: .5 }); ar.simboli(d, "🍃", "#ffffff", { n: 4, dim: .3 }); ar.simboli(d, "⬇", "#a6e22e", { n: 2, dim: .4 }); },
    "tizianverde:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8ad83a"); ar.schermo("verde", 1700); const d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.fendente(d.clone().add(V((k % 2 ? .2 : -.2), .1 * k, 0)), { colore: k % 2 ? 0xa6e22e : 0x3a8a1a, scala: 1 }); ar.simboli(d, "🍃", "#ffffff", { n: 1, dim: .3 }); await ar.attendi(110); }
      ar.esplosione(d, 0x8ad83a, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Senèocra ----
    "seneocra:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xc8902a, simbolo: "●", dim: .4, arco: .4, dur: 300 }); ar.esplosione(d, 0xc8902a, 14, { velocita: 1.4 }); },
    "seneocra:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("sole", 900); await ar.colonna(p, 0xe8b04a, { alt: 2.2 }); ar.simboli(p, "♥", "#7dffb0", { n: 3, dim: .35, su: 1.3 }); },
    "seneocra:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c8902a"); ar.schermo("polvere", 1700); ar.luceScena(0x6a3a0a, { intensita: .55, dur: 1700 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2, 0)), "🌅", "#ffffff", { n: 1, dim: .8 }); await ar.ondaTerra(a, 0xc8902a, 4); await ar.raggio(a.clone().add(V(0, 1, 0)), d, { colore: 0xe8b04a, spessore: .14, dur: 380 });
      ar.esplosione(d, 0xc8902a, 55, { velocita: 2.8 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .45; },
    // ================= Dei Inutili =================
    // ---- Lollimpo (Ultra) ----
    "lollimpo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0x2a2a3a, simbolo: "📺", dim: .45, arco: .35, dur: 300, ruota: 6 }); ar.esplosione(d, 0x9b6ac8, 14, { velocita: 1.5 }); },
    "lollimpo:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("luna", 1100); ar.simboli(p.clone().add(V(0, 1.4, 0)), "5 MIN…", "#ffffff", { n: 1, dim: .5 }); await ar.orbita(l, { colore: 0xffffff, testo: "z", n: 5, dur: 700, raggio: .9 }); ar.colonna(p, 0x9b6ac8, { alt: 2.2 }); },
    "lollimpo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7a3aa8"); ar.schermo("buio", 2100); ar.luceScena(0x4a1a6a, { intensita: .7, dur: 2100 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.7, 0)), "NON MI ALZO", "#ffe08a", { n: 1, dim: .55 }); ar.simboli(d.clone().add(V(0, 2.4, 0)), "🛋", "#ffffff", { n: 1, dim: 1.1 }); await ar.attendi(380);
      await ar.vortice(1 - l, { giri: 2, dur: 650, colore: 0x9b6ac8 }); ar.schermo("bianco", 220); ar.ondaTerra(d, 0x7a3aa8, 8);
      ar.esplosione(d, 0x9b6ac8, 80, { velocita: 3.2 }); ar.esplosione(d, 0xf2c14e, 35, { velocita: 2.3 }); ar.simboli(d, "💤", "#ffffff", { n: 3, dim: .45, su: 1.4 }); ar.scossa = .7; },
    // ---- Vikyber ----
    "vikyber:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xff4a6a, simbolo: "🔔", dim: .45, arco: .2, dur: 240 }); ar.simboli(d, "!", "#ff4a6a", { n: 3, dim: .35 }); ar.esplosione(d, 0xff4a6a, 12, { velocita: 1.4 }); },
    "vikyber:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("codice", 1100); for (let k = 0; k < 5; k++) { ar.simboli(d.clone().add(V((k - 2) * .35, 1.6 + (k % 2) * .3, 0)), "▭", "#bfe8ff", { n: 1, dim: .45 }); await ar.attendi(90); } ar.colonna(d, 0x4fc3ff, { alt: 2.4 }); ar.simboli(d, "⬇", "#4fc3ff", { n: 2, dim: .4 }); },
    "vikyber:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fc3ff"); ar.schermo("allarme", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.8, 0)), "ERRORE 404", "#ff4a6a", { n: 1, dim: .55 });
      for (let k = 0; k < 5; k++) { ar.fulmine(a.clone().add(V(0, 1, 0)), d.clone().add(V((k - 2) * .15, .3, 0)), { colore: [0x4fc3ff, 0xff4a6a, 0xffe08a, 0x7dffb0, 0xff7ab8][k], volte: 1 }); ar.simboli(d, ["📱", "💬", "🎮", "🔋", "📶"][k], "#ffffff", { n: 1, dim: .4 }); await ar.attendi(140); }
      ar.schermo("bn", 300); ar.esplosione(d, 0x4fc3ff, 65, { velocita: 3 }); ar.scossa = .55; },
    // ---- Pipposeidon ----
    "pipposeidon:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0x8ad8ff, dur: 420, densita: 5 }); ar.esplosione(d, 0xbfe8ff, 14, { velocita: 1.5 }); },
    "pipposeidon:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("mare", 1000); ar.pioggia(d, { colore: 0xbfe8ff, n: 26, dur: 800, larg: 1 }); await ar.attendi(500); ar.simboli(d, "❄", "#bfe8ff", { n: 4, dim: .35 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "pipposeidon:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fa8ff"); ar.schermo("mare", 2100); ar.luceScena(0x1a4a8a, { intensita: .6, dur: 2100 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "ANCORA 5 MINUTI!", "#bfe8ff", { n: 1, dim: .5 }); ar.simboli(a.clone().add(V(.5, .3, 0)), "🦆", "#ffffff", { n: 1, dim: .5 });
      ar.pioggia(d, { colore: 0x8ad8ff, n: 40, dur: 1300, larg: 1.6 }); await ar.getto(a.clone().add(V(0, 1.2, 0)), d, { colore: 0x4fa8ff, dur: 900, densita: 9, dimensione: .22 });
      ar.ondaTerra(d, 0x4fa8ff, 8); ar.esplosione(d, 0x8ad8ff, 75, { velocita: 3.1 }); ar.scossa = .6; },
    // ---- Alicronos ----
    "alicronos:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xf2c14e, simbolo: "⌛", dim: .45, arco: .3, dur: 300, ruota: 6 }); ar.esplosione(d, 0xf2c14e, 12, { velocita: 1.4 }); },
    "alicronos:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("dorato", 1000); ar.simboli(d.clone().add(V(0, 1.6, 0)), "TRA 5 MIN…", "#ffe08a", { n: 1, dim: .5 }); await ar.vortice(1 - l, { giri: 2, dur: 600, colore: 0xf2c14e }); ar.simboli(d, "⬇", "#f2c14e", { n: 2, dim: .4 }); },
    "alicronos:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#f2c14e"); ar.schermo("bn", 1900); ar.luceScena(0x5a4a2a, { intensita: .6, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 2, 0)), "🕰", "#ffffff", { n: 1, dim: 1 }); await ar.orbita(1 - l, { colore: 0xf2c14e, testo: "⌛", n: 6, dur: 900, raggio: 1.1 });
      await ar.raggio(a.clone().add(V(0, 1, 0)), d, { colore: 0xf2c14e, spessore: .16, dur: 380 }); ar.schermo("bianco", 220);
      ar.esplosione(d, 0xf2c14e, 70, { velocita: 3 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .45 }); ar.scossa = .5; },
    // ---- Maurizap ----
    "maurizap:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xd8a84a, simbolo: "🍺", dim: .45, arco: .4, dur: 300, ruota: 5 }); ar.esplosione(d, 0xff8a3a, 14, { velocita: 1.5 }); },
    "maurizap:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a.clone().add(V(0, 1.4, 0)), "BURP!", "#a6e22e", { n: 1, dim: .6 }); await ar.getto(a.clone().add(V(0, 1.1, 0)), d, { colore: 0xa6e22e, dur: 500, densita: 6, apertura: .4 }); ar.esplosione(d, 0xff8a3a, 22, { velocita: 1.8 }); },
    "maurizap:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#a6e22e"); ar.schermo("verde", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      for (const [k, t] of ["BURP!", "BUUURP!", "BUUUUURP!!"].entries()) { ar.simboli(a.clone().add(V(0, 1.4 + k * .3, 0)), t, "#a6e22e", { n: 1, dim: .5 + k * .1 }); ar.ondaTerra(a, 0xa6e22e, 3 + k * 2); ar.scossa = .2 + k * .15; await ar.attendi(330); }
      await ar.getto(a.clone().add(V(0, 1.1, 0)), d, { colore: 0xff8a3a, dur: 650, densita: 9, apertura: .5 }); ar.schermo("calore", 500);
      ar.esplosione(d, 0xa6e22e, 55, { velocita: 2.8 }); ar.esplosione(d, 0xff6a2a, 40, { velocita: 2.4 }); ar.scossa = .6; },
    // ---- Diegigante ----
    "diegigante:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 140, ruota: .9, colore: 0xc8384a }); ar.simboli(d, "OPS!", "#ffe08a", { n: 1, dim: .45 }); ar.esplosione(d, 0xc8384a, 14, { velocita: 1.5 }); },
    "diegigante:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("festa", 1000); ar.simboli(p, "👏", "#ffffff", { n: 4, dim: .4, su: 1.3 }); await ar.colonna(p, 0xc8384a, { alt: 2.4 }); ar.ondaTerra(p, 0xf2c14e, 3); },
    "diegigante:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c8384a"); ar.schermo("corona", 2000); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "🎭", "#ffffff", { n: 1, dim: .9 }); await ar.salto(l, { h: 2.2, dur: 620, giri: 2, colore: 0xc8384a });
      ar.simboli(d.clone().add(V(0, 1.8, 0)), "FIGURACCIA!", "#ffe08a", { n: 1, dim: .6 }); ar.schermo("bianco", 240); ar.ondaTerra(d, 0xc8384a, 9);
      ar.esplosione(d, 0xc8384a, 80, { velocita: 3.2 }); ar.esplosione(d, 0xf2c14e, 30, { velocita: 2.2 }); ar.simboli(d, "😳", "#ffffff", { n: 3, dim: .4, su: 1.4 }); ar.scossa = .65; },
    // ---- Samufi ----
    "samufi:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.raggio(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0x4fc3ff, spessore: .05, dur: 220 }); ar.simboli(d, "📶", "#4fc3ff", { n: 1, dim: .4 }); ar.esplosione(d, 0x4fc3ff, 12, { velocita: 1.4 }); },
    "samufi:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("bn", 900); ar.simboli(d.clone().add(V(0, 1.6, 0)), "LAG…", "#ffffff", { n: 1, dim: .55 }); await ar.attendi(400); ar.orbita(1 - l, { colore: 0xffffff, testo: "◌", n: 6, dur: 700, raggio: .8 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "samufi:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#4fc3ff"); ar.schermo("codice", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.8, 0)), "CONNESSIONE PERSA", "#ff4a6a", { n: 1, dim: .5 }); for (let k = 0; k < 3; k++) { ar.ondaTerra(a, 0x4fc3ff, 3 + k * 2); await ar.attendi(160); }
      await ar.fulmine(a.clone().add(V(0, 1.2, 0)), d, { colore: 0x4fc3ff, volte: 3 }); ar.schermo("bn", 300);
      ar.esplosione(d, 0x4fc3ff, 65, { velocita: 3 }); ar.simboli(d, "✕", "#ff4a6a", { n: 3, dim: .45 }); ar.scossa = .5; },
    // ---- Alessietra ----
    "alessietra:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xff4a6a, simbolo: "📵", dim: .45, arco: .2, dur: 250 }); ar.esplosione(d, 0xff4a6a, 12, { velocita: 1.4 }); },
    "alessietra:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p.clone().add(V(0, 1.5, 0)), "VISUALIZZATO", "#bfe8ff", { n: 1, dim: .45 }); await ar.teletrasporto(l, { colore: 0xa88aff, dietro: false }); ar.simboli(p, "✓✓", "#3fa8ff", { n: 2, dim: .35 }); },
    "alessietra:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#a88aff"); ar.schermo("viola", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V(0, 1.2 + (k % 3) * .2, 0)), d.clone().add(V((k - 2.5) * .12, .3, 0)), { colore: 0x3fa8ff, simbolo: "✓✓", dim: .4, arco: .3, dur: 300 }); await ar.attendi(90); }
      await ar.attendi(240); ar.simboli(d.clone().add(V(0, 1.7, 0)), "…", "#ffffff", { n: 1, dim: .8 }); ar.esplosione(d, 0x3fa8ff, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Simondo ----
    "simondo:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xd8a84a, simbolo: "🍔", dim: .45, arco: .4, dur: 300, ruota: 4 }); ar.esplosione(d, 0xd8a84a, 12, { velocita: 1.4 }); },
    "simondo:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("festa", 1000); await ar.orbita(l, { colore: 0xffe08a, testo: "🍕", n: 5, dur: 700, raggio: .9 }); ar.colonna(p, 0x7dffb0, { alt: 2.2 }); ar.simboli(p, "♥", "#7dffb0", { n: 3, dim: .35, su: 1.3 }); },
    "simondo:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d8a84a"); ar.schermo("ubriaco", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      for (const [k, cibo] of ["🍕", "🍔", "🍟", "🌭", "🍝"].entries()) { ar.proiettile(a.clone().add(V(0, 1, 0)), d.clone().add(V((k - 2) * .14, .3, 0)), { colore: 0xd8a84a, simbolo: cibo, dim: .5, arco: .5, dur: 340, ruota: 5 }); await ar.attendi(110); }
      await ar.attendi(250); ar.simboli(d, "🤢", "#ffffff", { n: 1, dim: .6, su: 1.4 }); ar.esplosione(d, 0xa6e22e, 50, { velocita: 2.6 }); ar.scossa = .45; },
    // ---- Giulimbuto ----
    "giulimbuto:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xa88aff, simbolo: "🔑", dim: .4, arco: .3, dur: 260, ruota: 8 }); ar.esplosione(d, 0xa88aff, 12, { velocita: 1.4 }); },
    "giulimbuto:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("incanto", 1000); await ar.vortice(1 - l, { giri: 3, dur: 650, colore: 0xa88aff }); ar.simboli(d, "?", "#ffffff", { n: 3, dim: .4 }); ar.simboli(d, "⬇", "#a88aff", { n: 2, dim: .4 }); },
    "giulimbuto:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#a88aff"); ar.schermo("incanto", 1900); ar.luceScena(0x3a1a6a, { intensita: .6, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.8, 0)), "DOV'È FINITO?", "#ffe08a", { n: 1, dim: .5 });
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .2, 1.3, 0)), d.clone().add(V((k - 2.5) * .1, .3, 0)), { colore: 0xa88aff, simbolo: ["🔑", "🧦", "🎧", "📺", "👓", "💍"][k], dim: .4, arco: .5, dur: 300, ruota: 9 }); await ar.attendi(95); }
      await ar.vortice(1 - l, { giri: 2, dur: 500, colore: 0xa88aff }); ar.esplosione(d, 0xa88aff, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Tizifone ----
    "tizifone:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xf2e2b0, simbolo: "📜", dim: .45, arco: .3, dur: 280, ruota: 6 }); ar.esplosione(d, 0xf2e2b0, 12, { velocita: 1.4 }); },
    "tizifone:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p.clone().add(V(0, 1.5, 0)), "NON HO SENTITO", "#ffffff", { n: 1, dim: .45 }); await ar.colonna(p, 0xf2e2b0, { alt: 2.2, larg: .7 }); ar.simboli(p, "🛡", "#ffffff", { n: 1, dim: .5 }); },
    "tizifone:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7a3aa8"); ar.schermo("dorato", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      for (const [k, t] of ["ERA TARDI", "MI SCADEVA IL TELEFONO", "È COLPA DEL WI-FI!"].entries()) { ar.simboli(a.clone().add(V(0, 1.4 + k * .3, 0)), t, "#ffe08a", { n: 1, dim: .4 + k * .06 }); await ar.attendi(300); }
      await ar.scatto(l, { k: 1, andata: 130, ritorno: 140, ruota: .5, colore: 0x7a3aa8 }); ar.lampo(0xffffff, 6, d);
      ar.esplosione(d, 0x7a3aa8, 55, { velocita: 2.8 }); ar.esplosione(d, 0xf2e2b0, 25, { velocita: 2 }); ar.scossa = .45; },
    // ---- Auroronfla ----
    "auroronfla:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xffffff, simbolo: "☁", dim: .5, arco: .3, dur: 300 }); ar.esplosione(d, 0xffe8f0, 14, { velocita: 1.3 }); },
    "auroronfla:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("notte", 900); await ar.orbita(l, { colore: 0xffffff, testo: "z", n: 4, dur: 600, raggio: .8 }); ar.colonna(p, 0xf2c14e, { alt: 2 }); },
    "auroronfla:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c8a8ff"); ar.schermo("luna", 1800); ar.luceScena(0x2a2a5a, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V(0, .6, (k - 1) * .3)), d.clone().add(V((k - 1) * .2, .3, 0)), { colore: 0xffffff, simbolo: "🐑", dim: .55, arco: .7, dur: 420 }); await ar.attendi(170); }
      await ar.attendi(250); ar.simboli(d.clone().add(V(0, 1.5, 0)), "ZZZ", "#ffffff", { n: 1, dim: .7 }); ar.esplosione(d, 0xc8a8ff, 50, { velocita: 2.5 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .4; },
    // ---- Ludosbadiglio ----
    "ludosbadiglio:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 220, ritorno: 320, ruota: .2, colore: 0x9b6ac8 }); ar.esplosione(d, 0x9b6ac8, 12, { velocita: 1.3 }); },
    "ludosbadiglio:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a.clone().add(V(0, 1.4, 0)), "AAAAWN…", "#ffffff", { n: 1, dim: .5 }); ar.ondaTerra(a, 0xc8a8ff, 4); await ar.attendi(350); ar.simboli(d.clone().add(V(0, 1.4, 0)), "aawn…", "#c8a8ff", { n: 1, dim: .4 }); ar.simboli(d, "⬇", "#c8a8ff", { n: 2, dim: .4 }); },
    "ludosbadiglio:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9b6ac8"); ar.schermo("notte", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "LETARGO", "#c8a8ff", { n: 1, dim: .55 }); await ar.salto(l, { h: 1.6, dur: 650, giri: 0, colore: 0x9b6ac8 });
      ar.ondaTerra(d, 0x9b6ac8, 8); ar.esplosione(d, 0x9b6ac8, 60, { velocita: 2.8 }); ar.simboli(d, "💤", "#ffffff", { n: 3, dim: .4, su: 1.3 }); ar.scossa = .55; },
    // ---- Ricaos ----
    "ricaos:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .92, andata: 110, ritorno: 160, ruota: .8, colore: 0xd8a84a }); ar.fendente(d, { colore: 0xd8a84a, scala: .9 }); ar.esplosione(d, 0xd8a84a, 14, { velocita: 1.5 }); },
    "ricaos:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xffffff, simbolo: "🧺", dim: .6, arco: .6, dur: 380 }); ar.simboli(d, "🧦", "#ffffff", { n: 3, dim: .35 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "ricaos:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff7ab8"); ar.schermo("tempesta", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.8, 0)), "CAOS!", "#ffe08a", { n: 1, dim: .6 });
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .15, 1.1, 0)), d.clone().add(V((k - 2.5) * .12, .3, 0)), { colore: 0xff7ab8, simbolo: ["🧦", "👕", "🍽", "🧹", "📦", "🧸"][k], dim: .45, arco: .5, dur: 300, ruota: 8 }); await ar.attendi(85); }
      await ar.attendi(220); ar.esplosione(d, 0xff7ab8, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Senevolta ----
    "senevolta:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l).add(V(0, 1, 0)), d, { colore: 0xd8c8f0, dur: 380, densita: 4, apertura: .35 }); ar.simboli(d, "uff…", "#ffffff", { n: 1, dim: .35 }); ar.esplosione(d, 0xd8c8f0, 10, { velocita: 1.3 }); },
    "senevolta:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("rosso", 900); ar.simboli(p.clone().add(V(0, 1.5, 0)), "CHE DRAMMA!", "#ffe08a", { n: 1, dim: .5 }); await ar.colonna(p, 0xff4a6a, { alt: 2.3 }); ar.simboli(p, "😭", "#ffffff", { n: 2, dim: .35, su: 1.2 }); },
    "senevolta:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#a88aff"); ar.schermo("viola", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      for (const [k, t] of ["TROPPO STRESS", "NON È GIUSTO", "UFFA!!"].entries()) { ar.simboli(a.clone().add(V(0, 1.4 + k * .3, 0)), t, "#ffffff", { n: 1, dim: .42 + k * .05 }); await ar.attendi(280); }
      await ar.scatto(l, { k: 1, andata: 120, ritorno: 140, ruota: .6, colore: 0xa88aff }); ar.lampo(0xffffff, 6, d);
      ar.esplosione(d, 0xa88aff, 55, { velocita: 2.8 }); ar.simboli(d, "🎭", "#ffffff", { n: 2, dim: .4 }); ar.scossa = .45; },
    // ================= Mitologia Giapponese =================
    // ---- Samuruele (Ultra) ----
    "samuruele:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 80, ritorno: 70, colore: 0xe84a7f }); ar.fendente(d, { colore: 0xf4f0ff, scala: 1 }); ar.esplosione(d, 0xffb8cc, 14, { velocita: 1.6 }); },
    "samuruele:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("fiori", 1100); ar.simboli(p, "武", "#ffffff", { n: 1, dim: .8 }); await ar.colonna(p, 0xe84a7f, { alt: 2.4 }); ar.ondaTerra(p, 0xffb8cc, 3); },
    "samuruele:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e84a7f"); ar.schermo("fiori", 2000); ar.luceScena(0x8a1a3a, { intensita: .6, dur: 2000 }); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.7, 0)), "斬", "#ffffff", { n: 1, dim: .9 }); await ar.attendi(350);
      for (let k = 0; k < 4; k++) { await ar.scatto(l, { k: .97, andata: 55, ritorno: 45, ruota: k % 2 ? .7 : -.7, colore: 0xe84a7f }); ar.fendente(d, { colore: k % 2 ? 0xffb8cc : 0xf4f0ff, scala: 1.2 }); }
      ar.schermo("tagli", 700); ar.esplosione(d, 0xffb8cc, 70, { velocita: 3 }); ar.esplosione(d, 0xd8283a, 30, { velocita: 2.2 }); ar.scossa = .55; },
    // ---- Lollorochi ----
    "lollorochi:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .92, andata: 110, ruota: .4, colore: 0x3a6a4a }); ar.simboli(d, "🐍", "#7ad89a", { n: 1, dim: .5 }); ar.esplosione(d, 0x3a6a4a, 16, { velocita: 1.6 }); },
    "lollorochi:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("contagio", 1000); await ar.getto(ar.pos(l), d, { colore: 0x7ad89a, dur: 600, densita: 6 }); ar.simboli(d, "☠", "#7ad89a", { n: 2, dim: .4 }); },
    "lollorochi:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a6a4a"); ar.schermo("luna", 2200); ar.luceScena(0x8a0a1a, { intensita: .7, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.8, 0)), "八岐大蛇", "#ff5a4a", { n: 1, dim: .6 });
      for (let k = 0; k < 8; k++) { ar.proiettile(a.clone().add(V((k - 3.5) * .3, 1.4 + (k % 2) * .4, 0)), d.clone().add(V((k - 3.5) * .12, .4, 0)), { colore: 0x4a8a5a, simbolo: "🐍", dim: .45, arco: .3, dur: 300 }); await ar.attendi(90); }
      await ar.attendi(200); ar.esplosione(d, 0x3a6a4a, 70, { velocita: 3 }); ar.esplosione(d, 0xd8283a, 30, { velocita: 2.4 }); ar.scossa = .6; },
    // ---- Tizunagi ----
    "tizunagi:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .9, 0)), d, { colore: 0xe8e0ff, simbolo: "⚚", dim: .55, arco: .1, dur: 260 }); ar.lampo(0x9ad8ff, 3, d); ar.esplosione(d, 0x9ad8ff, 14, { velocita: 1.5 }); },
    "tizunagi:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("tempesta", 1100); await ar.vortice(1 - l, { giri: 2, dur: 600, colore: 0x6a8ad8 }); ar.simboli(d, "⤓", "#9ad8ff", { n: 2, dim: .45 }); },
    "tizunagi:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#9ad8ff"); ar.schermo("tempesta", 2200); ar.luceScena(0x1a2a6a, { intensita: .7, dur: 2200 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0x9ad8ff, { alt: 4, larg: .5 }); ar.simboli(d.clone().add(V(0, 1.8, 0)), "国生み", "#ffffff", { n: 1, dim: .6 });
      for (let k = 0; k < 3; k++) { await ar.fulmine(d.clone().add(V((k - 1) * .4, 3, 0)), d, { colore: 0x9ad8ff, volte: 1, spessore: 2 }); ar.lampo(0x9ad8ff, 7, d); await ar.attendi(120); }
      ar.ondaTerra(d, 0x6a8ad8, 10); ar.esplosione(d, 0x9ad8ff, 70, { velocita: 3.2, su: 1.3 }); ar.scossa = .7; },
    // ---- Diegami ----
    "diegami:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.simboli(a, "◎", "#ffd04a", { n: 1, dim: .5 }); await ar.raggio(a.clone().add(V(0, .8, 0)), d, { colore: 0xffe08a, spessore: .05, dur: 150 }); ar.lampo(0xffe08a, 4, d); },
    "diegami:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.fulmine(d.clone().add(V(0, 3, 0)), d, { colore: 0xffe08a, volte: 2, spessore: 2 }); ar.lampo(0xffffff, 6, d); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "diegami:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffd04a"); ar.schermo("tempesta", 2000); ar.luceScena(0x2a2a5a, { intensita: .7, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "雷神", "#ffd04a", { n: 1, dim: .7 }); await ar.orbita(l, { colore: 0xffd04a, testo: "◎", n: 6, dur: 600, raggio: 1.1 });
      for (let k = 0; k < 4; k++) { ar.fulmine(d.clone().add(V((k - 1.5) * .35, 3.2, 0)), d, { colore: 0xffe08a, volte: 1, spessore: 2 }); await ar.attendi(110); }
      ar.schermo("bianco", 250); ar.lampo(0xffffff, 10, d); ar.esplosione(d, 0xffe08a, 70, { velocita: 3 }); ar.scossa = .6; },
    // ---- Aurokitsune ----
    "aurokitsune:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0x6ab8ff, simbolo: "🔥", dim: .45, arco: .4, dur: 330 }); ar.esplosione(d, 0x6ab8ff, 16, { velocita: 1.6 }); },
    "aurokitsune:1": async (ar, l) => { ar.schermo("incanto", 1000); await ar.cloni(l, { n: 3, colore: 0xffffff, dur: 600 }); await ar.teletrasporto(l, { colore: 0x6ab8ff }); },
    "aurokitsune:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6ab8ff"); ar.schermo("incanto", 2000); ar.luceScena(0x1a2a5a, { intensita: .6, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a.clone().add(V(0, 1.6, 0)), "九尾", "#ffffff", { n: 1, dim: .7 });
      for (let k = 0; k < 9; k++) { ar.proiettile(a.clone().add(V(Math.cos(k * .7) * .8, 1 + Math.sin(k * .7) * .5, 0)), d.clone().add(V((k - 4) * .08, .4, 0)), { colore: k % 2 ? 0x6ab8ff : 0xffffff, simbolo: "🔥", dim: .35, arco: .5, dur: 320 }); await ar.attendi(70); }
      await ar.attendi(200); ar.esplosione(d, 0x6ab8ff, 60, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Maurioni ----
    "maurioni:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 150, ruota: .8, colore: 0xd8283a }); ar.esplosione(d, 0x8a4a2a, 18, { velocita: 1.7 }); ar.scossa = .25; },
    "maurioni:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("calore", 1000); await ar.getto(ar.pos(l), d, { colore: 0xff5a2a, dur: 650, densita: 8 }); ar.simboli(d, "鬼", "#ff3a2a", { n: 1, dim: .6 }); },
    "maurioni:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d8283a"); ar.schermo("inferno", 2000); ar.luceScena(0xff3a10, { intensita: .7, dur: 2000 }); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.7, 0)), "鬼", "#ff3a2a", { n: 1, dim: 1 }); await ar.salto(l, { h: 2, dur: 600, giri: 0, colore: 0xd8283a });
      ar.schermo("crepe", 1000); ar.ondaTerra(d, 0xff5a2a, 11); await ar.colonna(d, 0xff4a10, { alt: 3.6, larg: .9 }); ar.esplosione(d, 0xff6a1a, 80, { velocita: 3.3, su: 1.3 }); ar.scossa = .8; },
    // ---- Simotengu ----
    "simotengu:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 110, ruota: .5, colore: 0x2a2030 }); ar.esplosione(d, 0x6a5a7a, 14, { velocita: 1.5 }); ar.simboli(d, "◆", "#7dd8ff", { n: 1, dim: .35, verso: ar.pos(l), durata: 450 }); },
    "simotengu:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("velocita", 900); ar.pioggia(d, { colore: 0x2a2030, n: 18, dur: 700 }); await ar.vortice(1 - l, { giri: 2, dur: 550, colore: 0x6a5a7a }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "simotengu:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a5a7a"); ar.schermo("velocita", 1900); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.salto(l, { h: 2.6, dur: 700, giri: 1, colore: 0x2a2030 }); ar.pioggia(d, { colore: 0x2a2030, n: 30, dur: 900 }); ar.simboli(d.clone().add(V(0, 1.7, 0)), "天狗", "#ffffff", { n: 1, dim: .7 });
      await ar.scatto(l, { k: .98, andata: 70, ritorno: 60, ruota: .8, colore: 0x6a5a7a }); ar.esplosione(d, 0x6a5a7a, 60, { velocita: 2.8 }); ar.simboli(d, "◆", "#7dd8ff", { n: 2, dim: .35, verso: a, durata: 500 }); ar.scossa = .45; },
    // ---- Alikami ----
    "alikami:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 110, ritorno: 90, colore: 0xffe8c0 }); ar.esplosione(d, 0xffe8c0, 12, { velocita: 1.4 }); },
    "alikami:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("fiori", 1100); ar.simboli(p, "神", "#ffffff", { n: 1, dim: .6 }); await ar.colonna(p, 0x7dffb0, { alt: 2.4 }); ar.simboli(p, "✿", "#ffb8cc", { n: 4, dim: .35, su: 1.3 }); },
    "alikami:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ffe8c0"); ar.schermo("dorato", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0xffe8c0, { alt: 3 }); await ar.raggio(a.clone().add(V(0, 1, 0)), d, { colore: 0xffe8c0, spessore: .18, dur: 380 });
      ar.esplosione(d, 0xffe8c0, 55, { velocita: 2.6 }); ar.simboli(d, "✿", "#ffb8cc", { n: 5, dim: .35, su: 1.3 }); ar.scossa = .35; },
    // ---- Giulyokai ----
    "giulyokai:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0x6ab8ff, simbolo: "🏮", dim: .5, arco: .5, dur: 360 }); ar.esplosione(d, 0x6ab8ff, 14, { velocita: 1.5 }); },
    "giulyokai:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("notte", 1000); await ar.orbita(1 - l, { colore: 0x6ab8ff, testo: "●", n: 5, dur: 700, raggio: .9 }); ar.simboli(d, "👻", "#ffffff", { n: 1, dim: .5 }); },
    "giulyokai:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6ab8ff"); ar.schermo("notte", 2000); ar.luceScena(0x0a1a3a, { intensita: .7, dur: 2000 }); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.7, 0)), "百鬼夜行", "#6ab8ff", { n: 1, dim: .55 });
      for (let k = 0; k < 6; k++) { ar.proiettile(a.clone().add(V((k - 2.5) * .3, 1.2, 0)), d.clone().add(V((k - 2.5) * .15, .3, 0)), { colore: 0x6ab8ff, simbolo: ["👻", "🏮", "👹"][k % 3], dim: .45, arco: .4, dur: 340 }); await ar.attendi(100); }
      await ar.attendi(200); ar.esplosione(d, 0x6ab8ff, 55, { velocita: 2.6 }); ar.scossa = .4; },
    // ---- Ludoninja ----
    "ludoninja:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xc8c8d0, simbolo: "✴", dim: .4, arco: .05, dur: 200, ruota: 12 }); ar.esplosione(d, 0xc8c8d0, 12, { velocita: 1.5 }); },
    "ludoninja:1": async (ar, l) => { ar.schermo("polvere", 1000); ar.pioggia(ar.pos(l), { colore: 0x8a8a96, n: 16, dur: 700 }); await ar.teletrasporto(l, { colore: 0x3a3a46 }); },
    "ludoninja:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#3a3a46"); ar.schermo("buio", 1800); ar.luceScena(0x000000, { intensita: .6, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.teletrasporto(l, { colore: 0x3a3a46 }); ar.simboli(d.clone().add(V(0, 1.6, 0)), "忍", "#ffffff", { n: 1, dim: .8 });
      for (let k = 0; k < 3; k++) { ar.fendente(d, { colore: 0xd8283a, scala: 1.1 }); await ar.attendi(140); }
      ar.esplosione(d, 0xd8283a, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Alesshogun ----
    "alesshogun:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 100, ritorno: 90, colore: 0xc8a24a }); ar.fendente(d, { colore: 0xffe8a0, scala: .9 }); },
    "alesshogun:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "将軍", "#ffd04a", { n: 1, dim: .6 }); ar.ondaTerra(p, 0xc8a24a, 4); await ar.colonna(p, 0xd8283a, { alt: 2.4 }); },
    "alesshogun:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#c8a24a"); ar.schermo("tagli", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.cloni(l, { n: 4, colore: 0xd8283a, dur: 700 });
      for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .96, andata: 60, ritorno: 50, ruota: k % 2 ? .6 : -.6, colore: 0xc8a24a }); ar.fendente(d, { colore: 0xffe8a0, scala: 1.1 }); }
      ar.esplosione(d, 0xc8a24a, 60, { velocita: 2.8 }); ar.scossa = .5; },
    // ---- Ritamiko ----
    "ritamiko:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 110, ruota: .3, colore: 0xffffff }); ar.simboli(d, "ϟ", "#ffffff", { n: 1, dim: .45 }); ar.esplosione(d, 0xffffff, 12, { velocita: 1.4 }); },
    "ritamiko:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "⛩", "#d8283a", { n: 1, dim: .8 }); await ar.orbita(l, { colore: 0xd8283a, testo: "✦", n: 5, dur: 700, raggio: .9 }); ar.ondaTerra(p, 0xffb8cc, 3); },
    "ritamiko:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#d8283a"); ar.schermo("bianco", 300); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.6, 0)), "祓", "#ffffff", { n: 1, dim: .8 }); await ar.attendi(300);
      await ar.raggio(a.clone().add(V(0, .9, 0)), d, { colore: 0xffffff, spessore: .16, dur: 360 }); ar.esplosione(d, 0xffffff, 50, { velocita: 2.6 }); ar.simboli(d, "✦", "#ffb8cc", { n: 4, dim: .35, su: 1.3 }); ar.scossa = .35; },
    // ---- Pipsuki ----
    "pipsuki:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xe8dcc4, simbolo: "🍶", dim: .5, arco: .6, dur: 360, ruota: 6 }); ar.esplosione(d, 0xe8dcc4, 12, { velocita: 1.4 }); },
    "pipsuki:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "🍶", "#ffffff", { n: 1, dim: .6 }); await ar.orbita(l, { colore: 0x7dd8ff, testo: "◆", n: 3, dur: 600, raggio: .9 }); },
    "pipsuki:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#a8784a"); ar.schermo("festa", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(a, "💨", "#ffffff", { n: 3, dim: .5 }); await ar.crescita(l, { scala: 1.6, dur: 600 });
      ar.simboli(d.clone().add(V(0, 1.6, 0)), "化け狸", "#ffd04a", { n: 1, dim: .6 }); await ar.scatto(l, { k: .95, andata: 120, ruota: .4, colore: 0xa8784a });
      ar.esplosione(d, 0xa8784a, 50, { velocita: 2.6 }); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); ar.scossa = .4; },
    // ---- Seneko ----
    "seneko:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xe8e8f0, simbolo: "➶", dim: .45, arco: .1, dur: 220 }); ar.esplosione(d, 0xd8283a, 12, { velocita: 1.4 }); },
    "seneko:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("mira", 900); ar.simboli(p, "🐱", "#ffffff", { n: 1, dim: .6 }); await ar.colonna(p, 0xe84a7f, { alt: 2 }); },
    "seneko:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e84a7f"); ar.schermo("fiori", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.salto(l, { h: 1.6, dur: 450, giri: 0, colore: 0xe84a7f });
      for (let k = 0; k < 6; k++) { ar.proiettile(d.clone().add(V((k - 2.5) * .35, 4, 0)), d.clone().add(V((k - 2.5) * .15, .2, 0)), { colore: 0xe8e8f0, simbolo: "➶", dim: .4, arco: 0, dur: 360 }); await ar.attendi(90); }
      await ar.attendi(200); ar.esplosione(d, 0xe84a7f, 50, { velocita: 2.6 }); ar.scossa = .35; },
    // ---- Vikitsune ----
    "vikitsune:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .92, andata: 100, ritorno: 90, colore: 0xff8a3a }); ar.fendente(d, { colore: 0xffb070, scala: .8 }); },
    "vikitsune:1": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0xff8a3a, simbolo: "🔥", dim: .5, arco: .5, dur: 340 }); ar.schermo("calore", 800); ar.esplosione(d, 0xff8a3a, 18, { velocita: 1.7 }); },
    "vikitsune:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff8a3a"); ar.schermo("incanto", 1700); const d = ar.pos(1 - l);
      await ar.cloni(l, { n: 5, colore: 0xff8a3a, dur: 700 });
      for (let k = 0; k < 5; k++) { ar.esplosione(d.clone().add(V((k - 2) * .2, .3, 0)), 0xff8a3a, 14, { velocita: 1.6 }); await ar.attendi(110); }
      ar.simboli(d.clone().add(V(0, 1.5, 0)), "🦊", "#ffffff", { n: 1, dim: .7 }); ar.esplosione(d, 0xffb070, 40, { velocita: 2.4 }); ar.scossa = .35; },
    // ================= Apocalisse =================
    // ---- Dieghunter (Ultra) ----
    "dieghunter:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xc8c8d0, simbolo: "➶", dim: .45, arco: .05, dur: 200 }); ar.esplosione(d, 0xb02a1a, 14, { velocita: 1.6 }); },
    "dieghunter:1": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(d, "⚙", "#8a8a96", { n: 1, dim: .8 }); await ar.vortice(1 - l, { giri: 2, dur: 500, colore: 0x8a8a96 }); ar.lampo(0xffffff, 3, d); ar.simboli(d, "💫", "#ffd04a", { n: 2, dim: .4 }); },
    "dieghunter:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e0552e"); ar.schermo("mira", 1900); ar.luceScena(0x8a2a14, { intensita: .5, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.salto(l, { h: 1.2, dur: 450, giri: 0, colore: 0xe0552e });
      for (let k = 0; k < 4; k++) { ar.proiettile(a.clone().add(V(0, .8, 0)), d.clone().add(V((k - 1.5) * .25, .3 + (k % 2) * .4, 0)), { colore: 0xe8e8f0, simbolo: "➶", dim: .45, arco: .05, dur: 190 }); await ar.attendi(130); }
      await ar.attendi(150); ar.esplosione(d, 0xb02a1a, 60, { velocita: 2.8 }); ar.esplosione(d, 0xe0552e, 30, { velocita: 2.2 }); ar.scossa = .5; },
    // ---- Pipscience ----
    "pipscience:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .8, 0)), d, { colore: 0x9aff3a, simbolo: "🧪", dim: .45, arco: .7, dur: 380, ruota: 5 }); ar.esplosione(d, 0x9aff3a, 18, { velocita: 1.6 }); },
    "pipscience:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("contagio", 1100); await ar.getto(ar.pos(l), d, { colore: 0x9aff3a, dur: 550, densita: 6 }); ar.simboli(d, "☣", "#9aff3a", { n: 2, dim: .45 }); },
    "pipscience:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7ad82a"); ar.schermo("contagio", 1900); ar.luceScena(0x3a8a10, { intensita: .6, dur: 1900 }); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.7, 0)), "PAZIENTE ZERO", "#9aff3a", { n: 1, dim: .6 }); await ar.vortice(1 - l, { giri: 3, dur: 800, colore: 0x9aff3a });
      await ar.colonna(d, 0x7ad82a, { alt: 3.5, larg: .8 }); ar.esplosione(d, 0x9aff3a, 70, { velocita: 3 }); ar.simboli(d, "☣", "#9aff3a", { n: 4, dim: .4, su: 1.4 }); ar.scossa = .45; },
    // ---- Ritageddon ----
    "ritageddon:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 110, ruota: .5, colore: 0x6a4a2a }); ar.esplosione(d, 0xb02a1a, 16, { velocita: 1.6 }); },
    "ritageddon:1": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V(0, .7, 0)), d.clone().add(V((k - 1) * .25, .4, 0)), { colore: 0xc8c8d0, simbolo: "➶", dim: .4, arco: .05, dur: 200 }); await ar.attendi(110); } await ar.attendi(150); ar.esplosione(d, 0xb02a1a, 20, { velocita: 1.8 }); },
    "ritageddon:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e0552e"); ar.schermo("inferno", 2000); ar.luceScena(0xff4a10, { intensita: .7, dur: 2000 }); const d = ar.pos(1 - l);
      for (let k = 0; k < 5; k++) { ar.proiettile(d.clone().add(V((k - 2) * .5, 5, 0)), d.clone().add(V((k - 2) * .3, 0, 0)), { colore: 0xff6a1a, dim: .6, arco: 0, dur: 420 }); await ar.attendi(110); }
      await ar.attendi(300); ar.schermo("bianco", 300); ar.lampo(0xffffff, 10, d); ar.ondaTerra(d, 0xff4a10, 11); ar.schermo("crepe", 1000); ar.esplosione(d, 0xff6a1a, 90, { velocita: 3.5, su: 1.4 }); ar.scossa = .8; },
    // ---- Alesshack ----
    "alesshack:0": async (ar, l) => { const d = ar.pos(1 - l); ar.simboli(ar.pos(l), "</>", "#ff3a2a", { n: 2, dim: .35, verso: d, durata: 450 }); await ar.attendi(400); ar.lampo(0xff3a2a, 3, d); ar.simboli(d, "◆", "#7dd8ff", { n: 1, dim: .35, verso: ar.pos(l), durata: 450 }); },
    "alesshack:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("codice", 1100); ar.luceScena(0x000000, { intensita: .6, dur: 900 }); await ar.attendi(400); ar.lampo(0xff3a2a, 5, d); ar.simboli(d, "⚠", "#ff3a2a", { n: 1, dim: .6 }); },
    "alesshack:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff3a2a"); ar.schermo("codice", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.6, 0)), "SYSTEM HACKED", "#ff3a2a", { n: 1, dim: .55 }); for (let k = 0; k < 3; k++) { await ar.raggio(a.clone().add(V(0, .7, 0)), d, { colore: 0xff3a2a, spessore: .05, dur: 150 }); ar.lampo(0xff3a2a, 4, d); }
      ar.esplosione(d, 0xff3a2a, 55, { velocita: 2.6 }); ar.simboli(d, "◆", "#7dd8ff", { n: 2, dim: .35, verso: a, durata: 500 }); ar.scossa = .4; },
    // ---- Maurizomb ----
    "maurizomb:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 150, ruota: .7, colore: 0x6a6a74 }); ar.esplosione(d, 0x8a8a96, 16, { velocita: 1.6 }); ar.scossa = .2; },
    "maurizomb:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "⛨", "#c8c8d0", { n: 1, dim: .8 }); await ar.colonna(p, 0x8a8a96, { alt: 2.2 }); ar.ondaTerra(p, 0x8a8a96, 3); },
    "maurizomb:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#8a8a96"); ar.schermo("terremoto", 1700); const d = ar.pos(1 - l);
      await ar.salto(l, { h: 2, dur: 650, giri: 0, colore: 0x8a8a96 }); ar.schermo("crepe", 1000); ar.ondaTerra(d, 0x6a5a4a, 11); ar.esplosione(d, 0x6a5a4a, 70, { velocita: 3, su: 1.3 }); ar.scossa = .8; },
    // ---- Tizianator ----
    "tizianator:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.getto(ar.pos(l), d, { colore: 0xff6a1a, dur: 350, densita: 4 }); ar.esplosione(d, 0xff6a1a, 12, { velocita: 1.4 }); },
    "tizianator:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("calore", 1000); await ar.getto(ar.pos(l), d, { colore: 0xff8a2a, dur: 700, densita: 8 }); ar.esplosione(d, 0xff4a10, 20, { velocita: 1.8 }); },
    "tizianator:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff6a1a"); ar.schermo("inferno", 1900); ar.luceScena(0xff6a1a, { intensita: .7, dur: 1900 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.getto(a, d, { colore: 0xff6a1a, dur: 900, densita: 10 }); await ar.colonna(d, 0xff4a10, { alt: 3.8, larg: .9 }); ar.esplosione(d, 0xff6a1a, 70, { velocita: 3 }); ar.scossa = .5; },
    // ---- Vikydead ----
    "vikydead:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xe8e8f0, dim: .14, arco: 0, dur: 160 }); ar.esplosione(d, 0xb02a1a, 12, { velocita: 1.4 }); },
    "vikydead:1": async (ar, l) => { ar.schermo("contagio", 1000); ar.pioggia(ar.pos(l), { colore: 0x8aa07a, n: 16, dur: 700 }); await ar.teletrasporto(l, { colore: 0x6a7a5a }); },
    "vikydead:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a7a5a"); ar.schermo("mira", 1800); ar.luceScena(0x0a0a10, { intensita: .5, dur: 1800 }); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.attendi(600); ar.lampo(0xffffff, 8, a); await ar.raggio(a.clone().add(V(0, .7, 0)), d, { colore: 0xfff0c0, spessore: .1, dur: 200 }); ar.esplosione(d, 0xb02a1a, 55, { velocita: 2.8 }); ar.scossa = .45; },
    // ---- Alizombie ----
    "alizombie:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 110, ruota: .3, colore: 0x6a8a4a }); ar.simboli(d, "🦷", "#ffffff", { n: 1, dim: .45 }); ar.esplosione(d, 0xb02a1a, 14, { velocita: 1.5 }); },
    "alizombie:1": async (ar, l) => { const d = ar.pos(1 - l); ar.schermo("contagio", 1000); ar.simboli(d, "☣", "#9aff3a", { n: 3, dim: .4 }); await ar.vortice(1 - l, { giri: 2, dur: 500, colore: 0x6a8a4a }); },
    "alizombie:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a8a4a"); ar.schermo("contagio", 1700); const d = ar.pos(1 - l);
      await ar.cloni(l, { n: 4, colore: 0x6a8a4a, dur: 700 }); for (let k = 0; k < 5; k++) { ar.esplosione(d.clone().add(V((k - 2) * .2, .3, 0)), 0x6a8a4a, 14, { velocita: 1.6 }); await ar.attendi(110); } ar.esplosione(d, 0xb02a1a, 40, { velocita: 2.4 }); ar.scossa = .4; },
    // ---- Auroravive ----
    "auroravive:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 100, ritorno: 90, colore: 0xe8e8f0 }); ar.fendente(d, { colore: 0xe8e8f0, scala: .7 }); },
    "auroravive:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "✚", "#ff3a3a", { n: 3, dim: .45, su: 1.3 }); await ar.colonna(p, 0x7dffb0, { alt: 2.2 }); },
    "auroravive:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#ff3a3a"); ar.schermo("bianco", 300); const d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(0, 1.4, 0)), "LIBERA!", "#ffffff", { n: 1, dim: .6 }); await ar.attendi(350);
      for (let k = 0; k < 2; k++) { await ar.fulmine(d.clone().add(V(0, 2.5, 0)), d, { colore: 0x9ad8ff, volte: 1, spessore: 2 }); ar.lampo(0x9ad8ff, 7, d); await ar.attendi(150); }
      ar.esplosione(d, 0x9ad8ff, 50, { velocita: 2.6 }); ar.scossa = .4; },
    // ---- Lollivor ----
    "lollivor:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .9, andata: 120, ruota: .6, colore: 0x6a4a2a }); ar.esplosione(d, 0xb02a1a, 16, { velocita: 1.6 }); },
    "lollivor:1": async (ar, l) => { const p = ar.pos(l); ar.simboli(p, "📻", "#ffffff", { n: 1, dim: .5 }); ar.ondaTerra(p, 0xe0552e, 4); await ar.colonna(p, 0xe0552e, { alt: 2.3 }); },
    "lollivor:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e0552e"); ar.schermo("tagli", 1500); const d = ar.pos(1 - l);
      ar.simboli(ar.pos(l), "SOPRAVVIVO!", "#ffffff", { n: 1, dim: .55 }); for (let k = 0; k < 3; k++) await ar.scatto(l, { k: .95, andata: 70, ritorno: 60, ruota: k % 2 ? .6 : -.6, colore: 0xe0552e });
      ar.esplosione(d, 0xe0552e, 60, { velocita: 2.8 }); ar.scossa = .5; },
    // ---- Simopter ----
    "simopter:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); for (let k = 0; k < 3; k++) { ar.proiettile(a.clone().add(V(0, 2.2, 0)), d.clone().add(V((k - 1) * .3, 0, 0)), { colore: 0xffd890, dim: .12, arco: 0, dur: 200 }); await ar.attendi(80); } ar.esplosione(d, 0xe0552e, 14, { velocita: 1.5 }); },
    "simopter:1": async (ar, l) => { const p = ar.pos(l); ar.proiettile(p.clone().add(V(0, 3, 0)), p.clone().add(V(0, .4, 0)), { colore: 0x6a7a5a, simbolo: "📦", dim: .6, arco: 0, dur: 500 }); await ar.attendi(500); ar.colonna(p, 0x7dd8ff, { alt: 2 }); },
    "simopter:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#6a7a5a"); ar.schermo("velocita", 1800); const a = ar.pos(l), d = ar.pos(1 - l);
      ar.simboli(d.clone().add(V(-1.2, 2.2, 0)), "🚁", "#ffffff", { n: 1, dim: 1, verso: d.clone().add(V(1.2, 2.2, 0)), durata: 900 });
      for (let k = 0; k < 6; k++) { ar.proiettile(d.clone().add(V((k - 2.5) * .3, 2.4, 0)), d.clone().add(V((k - 2.5) * .2, 0, 0)), { colore: 0xffd890, dim: .14, arco: 0, dur: 200 }); await ar.attendi(90); }
      ar.esplosione(d, 0xe0552e, 55, { velocita: 2.8 }); ar.ondaTerra(d, 0xc8c8d0, 7); ar.scossa = .45; },
    // ---- Giulimort ----
    "giulimort:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .95, andata: 90, ritorno: 80, colore: 0xc8c8d0 }); ar.fendente(d, { colore: 0xdfe8ff, scala: .8 }); },
    "giulimort:1": async (ar, l) => { ar.simboli(ar.pos(l), "CORRI!", "#ffffff", { n: 1, dim: .5 }); await ar.teletrasporto(l, { colore: 0xe0552e }); },
    "giulimort:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e0552e"); ar.schermo("velocita", 1500); const d = ar.pos(1 - l);
      for (let k = 0; k < 3; k++) { await ar.scatto(l, { k: .95, andata: 60, ritorno: 50, ruota: k % 2 ? .5 : -.5, colore: 0xe0552e }); ar.fendente(d, { colore: 0xdfe8ff, scala: 1 }); }
      ar.esplosione(d, 0x6a5a4a, 40, { velocita: 2.4 }); ar.esplosione(d, 0xe0552e, 25, { velocita: 2 }); ar.scossa = .35; },
    // ---- Ludovirus ----
    "ludovirus:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.proiettile(ar.pos(l).add(V(0, .7, 0)), d, { colore: 0xc8c8d0, simbolo: "🔧", dim: .5, arco: .5, dur: 340, ruota: 6 }); ar.esplosione(d, 0xc8c8d0, 12, { velocita: 1.4 }); },
    "ludovirus:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0x7dd8ff, testo: "✈", n: 3, dur: 700, raggio: 1 }); ar.colonna(p, 0x7dd8ff, { alt: 2 }); },
    "ludovirus:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dd8ff"); ar.schermo("laser", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.orbita(l, { colore: 0x7dd8ff, testo: "✈", n: 6, dur: 500, raggio: 1.1 });
      for (let k = 0; k < 6; k++) { ar.raggio(a.clone().add(V((k - 2.5) * .25, 1.6, 0)), d.clone().add(V((k - 2.5) * .15, .3, 0)), { colore: 0xff3a2a, spessore: .03, dur: 160 }); await ar.attendi(90); }
      ar.esplosione(d, 0x7dd8ff, 45, { velocita: 2.6 }); ar.esplosione(d, 0xff6a1a, 25, { velocita: 2 }); ar.scossa = .4; },
    // ---- Samudead ----
    "samudead:0": async (ar, l) => { const a = ar.pos(l), d = ar.pos(1 - l); ar.lampo(0xffd890, 4, a); await ar.proiettile(a.clone().add(V(0, .6, 0)), d, { colore: 0xffe0a0, dim: .16, arco: 0, dur: 170 }); ar.esplosione(d, 0xb02a1a, 12, { velocita: 1.5 }); },
    "samudead:1": async (ar, l) => { const p = ar.pos(l); ar.schermo("mira", 900); await ar.colonna(p, 0xe0552e, { alt: 2 }); },
    "samudead:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#e0552e"); ar.schermo("mira", 1700); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.attendi(500); ar.lampo(0xffffff, 8, a); await ar.raggio(a.clone().add(V(0, .7, 0)), d.clone().add(V(0, .9, 0)), { colore: 0xfff0c0, spessore: .09, dur: 180 });
      ar.esplosione(d.clone().add(V(0, .9, 0)), 0xb02a1a, 50, { velocita: 2.8 }); ar.simboli(d, "☠", "#ffffff", { n: 1, dim: .6 }); ar.scossa = .45; },
    // ---- Senemune ----
    "senemune:0": async (ar, l) => { const d = ar.pos(1 - l); await ar.scatto(l, { k: .85, andata: 130, ruota: .3, colore: 0x7dffb0 }); ar.esplosione(d, 0x7dffb0, 12, { velocita: 1.4 }); },
    "senemune:1": async (ar, l) => { const p = ar.pos(l); await ar.orbita(l, { colore: 0x7dffb0, testo: "✚", n: 5, dur: 700, raggio: .9 }); ar.ondaTerra(p, 0x7dffb0, 3); },
    "senemune:2": async (ar, l, e) => { await ar.cutin(l, e.id, e.nome, "#7dffb0"); ar.schermo("dorato", 1600); const a = ar.pos(l), d = ar.pos(1 - l);
      await ar.colonna(a, 0x7dffb0, { alt: 3 }); await ar.raggio(a.clone().add(V(0, .9, 0)), d, { colore: 0x7dffb0, spessore: .2, dur: 400 });
      ar.esplosione(d, 0x7dffb0, 55, { velocita: 2.6 }); ar.simboli(a, "♥", "#7dffb0", { n: 4, dim: .35, su: 1.3 }); ar.scossa = .35; },
  };

  // ============================================================
  //  APERTURA BUSTINA
  // ============================================================
  // Apertura della bustina:
  //  1. tocchi la bustina: trema e si illumina del colore della carta migliore che c'è dentro (più è rara, più a lungo)
  //  2. le carte escono in un mazzetto coperto: a ogni tocco se ne scopre una, la più rara è sempre l'ultima
  //  3. leggendarie e Ultra hanno un'entrata speciale: buio, serie, ruolo e tipo, poi la carta
  const VAL_RARITA = { comune: 0, rara: 1, epica: 2, leggendaria: 3, ultra: 4, jolly: 3.5 };
  const suono = (nome, ...a) => { try { if (typeof Suoni !== "undefined") Suoni[nome](...a); } catch (e) {} };
  class Apertura extends Base {
    constructor(contenitore, esiti, tipo, callback = {}) {
      super(contenitore);
      this.esiti = esiti;
      this.cb = callback;
      this.fase = "attesa";
      const s = this.scena;
      this.ambiente = new T.AmbientLight(0xffffff, .55); s.add(this.ambiente);
      const k = new T.PointLight(0xffffff, 1.3, 20); k.position.set(0, 2, 5); s.add(k); this.faro = k;
      this.luceRara = new T.PointLight(0xff2e46, 0, 10); this.luceRara.position.set(0, 0, 2); s.add(this.luceRara);
      this.guarda = new T.Vector3(0, 0, 0);
      this.n = esiti.length;
      // rarità di ogni carta (l'Ultra conta come una rarità a parte) e ordine in cui si scoprono: dalla meno rara alla più rara
      this.rar = esiti.map(e => e.ultra ? "ultra" : PER_ID[e.id].rarita);
      this.mazzo = esiti.map((e, i) => i).sort((a, b) => VAL_RARITA[this.rar[a]] - VAL_RARITA[this.rar[b]] || a - b);
      this.migliore = this.rar[this.mazzo[this.n - 1]];
      this.adattaCamera();
      // bustina: corpo + striscia da strappare
      const tex = texBustina(tipo);
      const lato = new T.MeshStandardMaterial({ color: 0x2a1218, metalness: .7, roughness: .3 });
      const fronte = new T.MeshStandardMaterial({ map: tex, metalness: .35, roughness: .3, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .25 });
      this.fronte = fronte;
      this.bustina = new T.Group();
      const corpo = new T.Mesh(new T.BoxGeometry(1.6, 2.0, .16), [lato, lato, lato, lato, fronte, lato]);
      const texS = tex.clone(); texS.needsUpdate = true;
      texS.repeat.set(1, .1); texS.offset.set(0, .9);
      const fS = new T.MeshStandardMaterial({ map: texS, metalness: .35, roughness: .3, emissive: 0xffffff, emissiveMap: texS, emissiveIntensity: .25 });
      corpo.geometry.translate(0, -.1, 0);
      const striscia = new T.Mesh(new T.BoxGeometry(1.6, .2, .16), [lato, lato, lato, lato, fS, lato]);
      striscia.position.y = 1.0;
      this.bustina.add(corpo, striscia);
      this.bustina.position.y = this.yc;
      this.striscia = striscia; this.corpo = corpo;
      s.add(this.bustina);
      this.alone = aloneSprite(tipo === "ultra" ? 0xffe9a8 : tipo === "leggendaria" ? 0xf2c14e : tipo === "epica" ? 0xb866ff : 0xff2e46, 4.5);
      this.alone.position.set(0, this.yc, -.5); this.alone.material.opacity = .35;
      s.add(this.alone);
      // velo nero per l'entrata speciale (sta tra il tavolo e la carta in primo piano)
      this.velo = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
      this.velo.position.z = 1.1; this.velo.renderOrder = 5; s.add(this.velo);
      this.carte = [];
      this.aggiornatori.push(t => {
        if (this.fase === "attesa") {
          this.bustina.rotation.y = Math.sin(t * 1.2) * .35;
          this.bustina.rotation.x = Math.sin(t * .9) * .08;
          this.bustina.position.y = this.yc + Math.sin(t * 1.6) * .08;
        }
        if (this.fase !== "carica") this.alone.material.opacity = .25 + Math.sin(t * 2) * .08;
        this.carte.forEach((c, i) => {
          if (c.userData.girata && !c.userData.occupata) c.position.y = c.userData.base.y + Math.sin(t * 1.8 + i) * .04;
          if (c.userData.alone) { c.userData.alone.position.copy(c.position); c.userData.alone.position.z -= .1; c.userData.alone.material.opacity = .35 + Math.sin(t * 3 + i) * .15; }
        });
      });
      this.ray = new T.Raycaster();
      this._giu = ev => { this._inizio = { x: ev.clientX, y: ev.clientY }; };
      this._su = ev => { const a = this._inizio || { x: ev.clientX, y: ev.clientY }; this._inizio = null; this._tocco(ev, Math.hypot(ev.clientX - a.x, ev.clientY - a.y) > 30); };
      this.r.domElement.addEventListener("pointerdown", this._giu);
      this.r.domElement.addEventListener("pointerup", this._su);
      this.prepara();
    }
    adattaCamera() {
      const a = this.cam.aspect || 1;
      this.righe = a < .95 ? 2 : 1;
      const perRiga = Math.ceil((this.n || 4) / this.righe);
      const largh = perRiga * 1.1 + (perRiga - 1) * .25 + .6;
      // sopra la griglia delle carte scoperte, sotto il mazzetto coperto
      const h = this.righe * 1.55 + (this.righe - 1) * .1;
      this.yMazzo = -h / 2 - 1.05;
      const alto = h / 2 + .1, basso = this.yMazzo - .85 - 1.1;   // sotto il mazzetto resta spazio per il suggerimento e i bottoni
      this.yc = (alto + basso) / 2;
      const alt = alto - basso + .5;
      const tan = Math.tan(T.MathUtils.degToRad(this.cam.fov / 2));
      const d = Math.max(largh / 2 / (tan * a), alt / 2 / tan, 4.2);
      this.camBase = new T.Vector3(0, this.yc, d);
      this.guarda = new T.Vector3(0, this.yc, 0);
      this.fronteCarta = new T.Vector3(0, this.yc + .05, Math.min(1.9, d * .42));
      if (this.carte) this.carte.forEach(c => { c.userData.base = this.posizione(c.userData.i); if (c.userData.girata && !c.userData.occupata) c.position.copy(c.userData.base); });
    }
    posizione(i) {
      const perRiga = Math.ceil(this.n / this.righe);
      const riga = Math.floor(i / perRiga), col = i % perRiga;
      const inRiga = riga === this.righe - 1 ? this.n - perRiga * riga : perRiga;
      const x = (col - (inRiga - 1) / 2) * 1.35;
      const y = this.righe === 1 ? 0 : (riga === 0 ? .83 : -.83);
      return new T.Vector3(x, y, 0);
    }
    posMazzo(k) { return new T.Vector3((k % 2 ? .03 : -.03), this.yMazzo + k * .025, .05 + k * .02); }
    async prepara() {
      this.carte = await Promise.all(this.esiti.map(async (e, i) => {
        const c = PER_ID[e.id];
        const m = creaCarta(await texFronte(c, e.liv, e.lode, e.olo, e.ultra), texRetro(), c.rarita, 1.1, 1.54);
        m.rotation.y = Math.PI; m.visible = false;
        m.userData = { ...m.userData, i, rarita: c.rarita, girata: false, base: this.posizione(i) };
        const al = aloneSprite(e.ultra ? 0xffe9a8 : COL_RARITA[c.rarita], e.ultra ? 3.8 : c.rarita === "leggendaria" ? 3.2 : c.rarita === "epica" ? 2.6 : 2.0);
        al.visible = false; m.userData.alone = al;
        this.scena.add(al, m);
        return m;
      }));
      this.pronta = true;
      if (this._daAprire) this.apri();
    }
    _tocco(ev, strisciata) {
      if (this.fase === "attesa") { this.apri(); return; }
      if (this.fase !== "carte") return;
      const r = this.r.domElement.getBoundingClientRect();
      const v = new T.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      this.ray.setFromCamera(v, this.cam);
      const hit = this.ray.intersectObjects(this.carte.filter(c => c.userData.girata), false)[0];
      // una carta già scoperta: un tocco apre le statistiche
      if (hit && !strisciata && !hit.object.userData.occupata) { this.cb.onDettaglio && this.cb.onDettaglio(hit.object.userData.i); return; }
      // altrimenti (tocco o strisciata ovunque) si scopre la prossima carta del mazzetto
      this.prossima();
    }
    async apri() {
      if (this.fase !== "attesa") return;
      if (!this.pronta) { this._daAprire = true; return; }
      this.fase = "carica";
      this.cb.onApri && this.cb.onApri();
      const b = this.bustina, liv = VAL_RARITA[this.migliore], col = new T.Color(COL_RARITA[this.migliore]);
      // la bustina trema e si accende del colore della carta migliore: comune un attimo, Ultra a lungo
      const dur = 700 + liv * 380;
      suono("carica", dur / (imp.velocita || 1), liv);
      this.alone.material.color.copy(col);
      this.luceRara.color.copy(col); this.luceRara.position.set(0, this.yc, 2);
      const emi = this.fronte.emissive.clone();
      await this.anima(dur, (t, raw) => {
        const f = raw * raw * (.06 + liv * .035);
        b.rotation.z = Math.sin(raw * (40 + liv * 12)) * f; b.position.x = Math.sin(raw * 47) * f * .6; b.rotation.y = 0; b.position.y = this.yc;
        this.fronte.emissive.copy(emi).lerp(col, raw * .9); this.fronte.emissiveIntensity = .25 + raw * (.35 + liv * .15);
        this.alone.material.opacity = .3 + raw * .6; const k = 1 + raw * (.15 + liv * .1); this.alone.scale.set(4.5 * k, 4.5 * k, 1);
        this.luceRara.intensity = raw * (2 + liv * 1.5);
      }, easing.lin);
      if (liv >= 3) { this.scossa = .2 + (liv - 3) * .15; this.esplosione(new T.Vector3(0, this.yc, .3), COL_RARITA[this.migliore], 80, { velocita: 3.5, su: 1.3 }); }
      this.fase = "apertura";
      suono("strappo");
      this.anima(400, t => { this.luceRara.intensity = (1 - t) * (2 + liv * 1.5); });
      const st = this.striscia;
      this.esplosione(new T.Vector3(0, this.yc + 1, .2), 0xffffff, 50, { velocita: 2.5, su: 1.5 });
      this.anima(600, t => { st.position.set(t * 2.2, 1 + t * 1.8, t * .8); st.rotation.z = -t * 2.5; st.rotation.x = t; }, easing.out).then(() => { st.visible = false; });
      await this.attendi(160);
      // le carte escono e si impilano coperte nel mazzetto, in basso
      this.mazzo.forEach((i, k) => {
        const c = this.carte[i], dove = this.posMazzo(this.n - 1 - k);   // la prima da scoprire sta in cima
        c.visible = true; c.position.set(0, this.yc + .2, .05); c.scale.set(.85, .85, .85); c.userData.occupata = true;
        setTimeout(() => {
          suono("esce");
          this.anima(520, t => {
            c.position.set(lerp(0, dove.x, t), lerp(this.yc + .2, dove.y, t) + Math.sin(t * Math.PI) * .9, lerp(.05, dove.z, t) + Math.sin(t * Math.PI) * .4);
            const s = lerp(.85, 1, t); c.scale.set(s, s, s); c.rotation.z = (1 - t) * (k % 2 ? .5 : -.5) + (k % 2 ? .03 : -.03);
          }, easing.out).then(() => { c.userData.occupata = false; });
        }, k * 90);
      });
      this.anima(700, t => { b.position.y = this.yc - t * 3.5; b.rotation.x = t * .8; this.corpo.material.forEach && this.corpo.material.forEach(m => { m.transparent = true; m.opacity = 1 - t; }); }, easing.in)
        .then(() => { b.visible = false; });
      await this.attendi(560 + this.n * 90);
      this.alone.material.color.setHex(COL_RARITA[this.migliore]);
      suono("mazzo");
      this.fase = "carte";
      this.cb.onPronte && this.cb.onPronte();
    }
    // scopre la prossima carta del mazzetto
    async prossima() {
      if (this.fase !== "carte" || this._occupato || !this.mazzo.length) return;
      this._occupato = true;
      const i = this.mazzo.shift();
      try { await this.rivela(i); } finally { this._occupato = false; }
      if (this._tutte && this.mazzo.length) this.prossima();
    }
    async rivela(i) {
      const c = this.carte[i], r = this.rar[i], col = COL_RARITA[r], top = r === "leggendaria" || r === "ultra" || r === "jolly", veloce = !!this._tutte;
      c.userData.occupata = true;
      const davanti = this.fronteCarta.clone(), scala = 1.3;
      // la carta sale dal mazzetto e si mette davanti
      suono("esce");
      const da = c.position.clone();
      await this.anima(veloce ? 220 : 320, t => { c.position.lerpVectors(da, davanti, t); c.rotation.z = 0; const s = lerp(1, scala, t); c.scale.set(s, s, s); }, easing.out);
      if (top && !veloce) await this.entrataSpeciale(i, davanti);
      else if (r === "epica" && !veloce) await this.anima(420, (t, raw) => { c.rotation.z = Math.sin(raw * 50) * .05 * raw; }, easing.lin);
      // si gira
      this.luceRara.color.setHex(col); this.luceRara.position.set(0, this.yc, 2.5);
      this.anima(top ? 1100 : 600, t => { this.luceRara.intensity = Math.sin(t * Math.PI) * (r === "ultra" ? 10 : top ? 6 : r === "epica" ? 3.5 : 2); });
      suono("gira", r);
      await this.anima(veloce ? 320 : 480, t => {
        c.rotation.y = Math.PI * (1 - t); c.rotation.z = 0;
        c.position.z = davanti.z + Math.sin(t * Math.PI) * .4;
        const s = scala * (1 + Math.sin(t * Math.PI) * .1); c.scale.set(s, s, s);
      }, easing.back);
      c.rotation.y = 0; c.userData.girata = true;
      const n = { comune: 20, rara: 40, epica: 70, leggendaria: 130, ultra: 220, jolly: 90 }[r];
      this.esplosione(davanti.clone().add(new T.Vector3(0, 0, .2)), col, n, { velocita: top ? 4 : 2.6, su: 1.2 });
      if (top) {
        this.scossa = r === "ultra" ? .45 : .25;
        const colori = r === "ultra" ? [0xffe9a8, 0x111111, 0xf2c14e, 0xffffff, 0xc9a13a, 0x000000] : r === "jolly" ? [0xffffff, 0xe8f0ff, 0xffffff, 0xd8d8e8] : [0xf2c14e, 0xffffff, 0xff2e46];
        colori.forEach((cc, k) => setTimeout(() => this.esplosione(davanti.clone().add(new T.Vector3(0, .3, .2)), cc, 50, { velocita: 3.8, su: 1.6, durata: 1300 }), (k + 1) * 180));
        if (r === "ultra") this.scritta("ULTRA!", "#ffe9a8", davanti.clone().add(new T.Vector3(0, 1.2, .3)), .45, 2400);
        if (r === "jolly") this.scritta("JOLLY!", "#ffffff", davanti.clone().add(new T.Vector3(0, 1.5, .3)), .45, 2400);
      }
      const e = this.esiti[i];
      const etichetta = e.ultra ? "" : e.olo ? "Olografica!" : e.nuova ? "Nuova!" : e.pot ? `+${e.pot} potenziatori` : e.extra ? `+${e.extra} monete` : "";
      if (etichetta) this.scritta(etichetta, e.olo ? "#c86eff" : e.nuova ? "#ff2e46" : "#f2c14e", davanti.clone().add(new T.Vector3(0, 1.05, .3)), .28, e.olo ? 2200 : 1500);
      if (e.olo) [0xff5078, 0xffd25a, 0x5affaa, 0x50beff, 0xc86eff].forEach((cc, k) => setTimeout(() => this.esplosione(davanti.clone().add(new T.Vector3(0, .2, .2)), cc, 40, { velocita: 3, su: 1.4 }), k * 140));
      this.velo.material.opacity > 0 && this.anima(500, t => { this.velo.material.opacity = (1 - t) * .82; this.ambiente.intensity = lerp(.1, .55, t); this.faro.intensity = lerp(.3, 1.3, t); });
      // un attimo per guardarla, poi va al suo posto
      await this.attendi(veloce ? 140 : top ? 1100 : 520);
      const base = c.userData.base;
      await this.anima(veloce ? 240 : 360, t => { c.position.lerpVectors(davanti, base, t); const s = lerp(scala, 1, t); c.scale.set(s, s, s); }, easing.inOut);
      c.position.copy(base); c.scale.set(1, 1, 1);
      suono("posa");
      c.userData.occupata = false; c.userData.alone.visible = true;
      this.cb.onGira && this.cb.onGira(i, !this.mazzo.length);
    }
    // leggendaria o Ultra: si spegne tutto e arrivano, uno alla volta, serie, ruolo e tipo
    async entrataSpeciale(i, davanti) {
      const c = this.carte[i], carta = PER_ID[this.esiti[i].id], ultra = this.rar[i] === "ultra";
      await this.anima(450, t => { this.velo.material.opacity = t * .82; this.ambiente.intensity = lerp(.55, .1, t); this.faro.intensity = lerp(1.3, .3, t); });
      const serie = SERIE[carta.serie] || { nome: carta.serie, simbolo: "★", colore: "#f2c14e" };
      const ruolo = (RUOLI[carta.ruolo] || {}).nome || carta.ruolo;
      const stile = { FOR: "Forza", DIF: "Difesa", VEL: "Velocità" }[carta.stile] || carta.stile;
      const passi = [[`${serie.simbolo} ${serie.nome}`, serie.colore], [ruolo, "#ffffff"], [stile, carta.stile === "FOR" ? "#ff6a5a" : carta.stile === "DIF" ? "#6ab8ff" : "#7dff9a"]];
      if (ultra) passi.push(["ULTRA", "#ffe9a8"]);
      for (const [testo, colore] of passi) {
        suono("rullo");
        this.cartello(testo, colore, davanti.clone().add(new T.Vector3(0, 1.3, .3)), .34, 560);
        this.esplosione(davanti.clone().add(new T.Vector3(0, 1.2, .1)), new T.Color(colore).getHex(), 18, { velocita: 1.6, su: 1 });
        await this.anima(520, (t, raw) => { c.rotation.z = Math.sin(raw * 60) * .03 * raw; c.position.z = davanti.z + raw * .08; }, easing.lin);
      }
      c.rotation.z = 0;
    }
    // una scritta ferma sotto la carta (compare con un piccolo rimbalzo e sparisce): per l'entrata speciale
    cartello(testo, colore, pos, scala, durata) {
      const { tex, aspect } = texTesto(testo, colore);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sp.position.copy(pos); sp.renderOrder = 11; this.scena.add(sp);
      this.anima(durata, t => {
        const k = t < .25 ? easing.back(t / .25) : 1;
        sp.scale.set(scala * aspect * k, scala * k, 1);
        sp.material.opacity = t < .8 ? 1 : 1 - (t - .8) / .2;
      }, easing.lin).then(() => { this.scena.remove(sp); tex.dispose(); sp.material.dispose(); });
    }
    giraTutte() { this._tutte = true; this.prossima(); }
    distruggi() { this.r.domElement.removeEventListener("pointerdown", this._giu); this.r.domElement.removeEventListener("pointerup", this._su); super.distruggi(); }
  }

  return { get disponibile() { return disponibile; }, Arena, Apertura, texFronte, imposta(o) { Object.assign(imp, o); }, get impostazioni() { return { ...imp }; }, _mosse: MOSSE_FX, svuotaCache() { for (const k in cacheFronte) { cacheFronte[k].dispose(); delete cacheFronte[k]; } } };
})();
