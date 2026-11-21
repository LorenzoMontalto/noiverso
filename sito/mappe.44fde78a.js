// ============================================================
//  MAPPE DEI CAPITOLI DELLA STORIA
//  Ogni capitolo ha una mappa grande (1800 × 1200) disegnata in SVG,
//  con luoghi e nomi, e una nebbia (canvas) che si dirada attorno
//  alle tappe scoperte.
// ============================================================

const MappeStoria = (() => {
  const W = 1800, H = 1200;

  // Posizione delle 6 tappe su ogni mappa
  const NODI = [
    [[230, 1010], [540, 850], [870, 985], [1140, 700], [1430, 860], [1590, 370]],   // città
    [[1560, 1000], [1250, 870], [960, 990], [760, 700], [470, 820], [330, 340]],    // isola
    [[200, 640], [480, 910], [800, 700], [1070, 960], [1340, 660], [1600, 300]],    // metropoli
    [[320, 1060], [650, 975], [930, 820], [1230, 900], [1120, 570], [900, 230]],    // Olimpo
    [[250, 1070], [600, 900], [1150, 960], [1060, 640], [700, 440], [1020, 250]],   // castello
    [[190, 600], [470, 370], [790, 570], [1070, 340], [1350, 570], [1620, 600]],    // finale
  ];

  // Luoghi con nome: [x, y, simbolo, nome]
  const LUOGHI = [
    [[120, 880, "⚓", "Porto Vecchio"], [430, 980, "♠", "Vicolo dei Neon"], [690, 760, "$", "Bisca El Sol"], [980, 1090, "☕", "Bar Fiesta"],
     [1000, 590, "✦", "Mercato Nero"], [1280, 980, "⚑", "Covo del Branco"], [1560, 760, "♜", "Ponte Rosso"], [1700, 260, "♛", "Villa della Reina"],
     [300, 300, "✚", "Ospedale"], [760, 260, "✈", "Vecchio Aeroporto"], [1250, 300, "⛪", "Cattedrale"], [600, 520, "♫", "Discoteca Luna"]],
    [[1640, 1100, "⛵", "Molo Sud"], [1360, 760, "◉", "Capsule Corp"], [1080, 1090, "⛺", "Villaggio"], [880, 600, "◎", "Ring del Torneo"],
     [560, 940, "☘", "Foresta di Bambù"], [230, 250, "▲", "Monte Karin"], [400, 520, "☁", "Torre Celeste"], [1500, 420, "⌂", "Casa del Maestro"],
     [1200, 250, "♨", "Sorgenti Calde"], [700, 300, "✶", "Cratere"]],
    [[110, 520, "✪", "Base Segreta"], [400, 1040, "⚓", "Baia Nord"], [700, 600, "☘", "Central Park"], [960, 1090, "♜", "Ponte di Ferro"],
     [1220, 560, "✦", "Torre Stark"], [1500, 1000, "⚙", "Officine"], [1720, 200, "⚡", "Grattacielo Tonante"], [420, 300, "☎", "Redazione"],
     [1000, 260, "⚠", "Laboratorio"], [1600, 760, "✈", "Eliporto"]],
    [[180, 1130, "⛵", "Porto di Atene"], [560, 1100, "❦", "Campi Fioriti"], [840, 920, "♨", "Fucina di Efesto"], [1380, 1000, "♆", "Tempio del Mare"],
     [1300, 650, "☾", "Bosco della Luna"], [900, 120, "♛", "Trono di Zeus"], [420, 700, "☠", "Porte dell'Ade"], [1560, 380, "✦", "Vigneti di Dioniso"],
     [640, 460, "⛲", "Fonte Sacra"], [1600, 1150, "⚓", "Scogli delle Sirene"]],
    [[120, 1150, "⚑", "Binario Nascosto"], [400, 860, "⛵", "Lago Nero"], [1480, 880, "♣", "Foresta Proibita"], [1280, 1110, "⌂", "Capanna del Guardiacaccia"],
     [1560, 560, "◎", "Campo da Quidditch"], [520, 640, "✿", "Serre"], [1250, 640, "♨", "Sotterranei"], [560, 330, "♛", "Torre del Preside"],
     [1180, 160, "✧", "Torre di Astronomia"], [1660, 1110, "☕", "Villaggio"], [220, 470, "☾", "Ponte di Pietra"]],
    [[100, 760, "✦", "Varco"], [360, 220, "☄", "Cometa"], [760, 760, "◉", "Nucleo"], [1000, 180, "✧", "Costellazione"],
     [1260, 760, "⚛", "Frattura"], [1700, 720, "♾", "Sala dei Nove"], [560, 980, "☾", "Luna Spezzata"], [1450, 250, "✺", "Stella Morente"]],
  ];

  // Generatore di numeri casuali con seme: la stessa mappa ogni volta
  function rng(seme) { let s = seme; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  const f = n => Math.round(n);

  // Contorno irregolare attorno a un centro (isole, laghi, nuvole)
  function blob(cx, cy, rx, ry, r, punti = 18, ruvido = .25) {
    const p = [];
    for (let i = 0; i < punti; i++) {
      const a = i / punti * Math.PI * 2, k = 1 - ruvido / 2 + r() * ruvido;
      p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    let d = `M${f((p[0][0] + p[punti - 1][0]) / 2)},${f((p[0][1] + p[punti - 1][1]) / 2)}`;
    for (let i = 0; i < punti; i++) { const a = p[i], b = p[(i + 1) % punti]; d += ` Q${f(a[0])},${f(a[1])} ${f((a[0] + b[0]) / 2)},${f((a[1] + b[1]) / 2)}`; }
    return d + "Z";
  }
  // Curva morbida che passa per tutti i punti
  // segmenti = quanti tratti disegnare (per la strada già fatta): la forma resta identica al sentiero intero
  function curva(pts, segmenti = pts.length - 1) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < Math.min(segmenti, pts.length - 1); i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  // ---------------- Terreni ----------------
  function citta(r) {
    let s = `<rect width="${W}" height="${H}" fill="#0f0c14"/>`;
    const fiume = curva([[-50, 560], [300, 640], [700, 520], [1100, 660], [1450, 560], [1850, 640]]);
    s += `<path d="${fiume}" stroke="#0d2a42" stroke-width="120" fill="none"/><path d="${fiume}" stroke="#123b5c" stroke-width="80" fill="none"/><path d="${fiume}" stroke="#1d5585" stroke-width="3" fill="none" stroke-dasharray="20 30" opacity=".6"/>`;
    for (let x = 0; x < W; x += 110) for (let y = 0; y < H; y += 95) {
      if (Math.abs(y + 45 - (590 + Math.sin(x / 260) * 60)) < 90) continue;
      const w = 70 + r() * 25, h = 55 + r() * 25;
      const col = ["#1a1420", "#1e1724", "#171119"][Math.floor(r() * 3)];
      s += `<rect x="${f(x + 12)}" y="${f(y + 12)}" width="${f(w)}" height="${f(h)}" rx="4" fill="${col}" stroke="#2e2433"/>`;
      for (let k = 0; k < 5; k++) if (r() < .5) s += `<rect x="${f(x + 18 + r() * (w - 14))}" y="${f(y + 18 + r() * (h - 14))}" width="5" height="6" fill="#ffcf6a" opacity="${(.15 + r() * .5).toFixed(2)}"/>`;
    }
    for (let x = 0; x <= W; x += 110) s += `<line x1="${x + 6}" y1="0" x2="${x + 6}" y2="${H}" stroke="#2a2230" stroke-width="10"/>`;
    for (let y = 0; y <= H; y += 95) s += `<line x1="0" y1="${y + 6}" x2="${W}" y2="${y + 6}" stroke="#2a2230" stroke-width="10"/>`;
    for (let k = 0; k < 4; k++) s += `<path d="${blob(200 + r() * 1400, 150 + r() * 900, 80, 55, r)}" fill="#12301e" stroke="#1d4a2e"/>`;
    for (let k = 0; k < 40; k++) { const c = ["#ff2e46", "#3fd8ff", "#ff4fd8", "#f2c14e"][k % 4]; s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(6 + r() * 10)}" fill="${c}" opacity=".5" filter="url(#bagliore)"/>`; }
    return s;
  }
  function isola(r) {
    let s = `<rect width="${W}" height="${H}" fill="#0b3a66"/>`;
    for (let k = 0; k < 120; k++) { const x = r() * W, y = r() * H; s += `<path d="M${f(x)},${f(y)} q10,-8 20,0 t20,0" stroke="#2a6aa0" stroke-width="2" fill="none" opacity=".5"/>`; }
    s += `<path d="${blob(900, 640, 790, 520, r, 26, .2)}" fill="#e2cf93"/>`;
    s += `<path d="${blob(900, 640, 730, 470, r, 26, .2)}" fill="#3f8f4a"/>`;
    s += `<path d="${blob(560, 940, 220, 140, r)}" fill="#2c6e37"/>`;
    for (let k = 0; k < 90; k++) { const x = 300 + r() * 1200, y = 250 + r() * 800; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(8 + r() * 10)}" fill="#2f7a3a" opacity=".8"/>`; }
    const monti = [[260, 320], [360, 280], [180, 400], [700, 300], [760, 330], [1200, 260]];
    for (const [mx, my] of monti) { const h = 120 + r() * 80, w = 110 + r() * 60; s += `<path d="M${mx - w},${my + h / 2} L${mx},${my - h / 2} L${mx + w},${my + h / 2}Z" fill="#7a7068"/><path d="M${mx - w * .3},${my - h * .2} L${mx},${my - h / 2} L${mx + w * .3},${my - h * .2}Z" fill="#f4f4f4"/>`; }
    for (let k = 0; k < 14; k++) { const x = 400 + r() * 1000, y = 400 + r() * 600; s += `<rect x="${f(x)}" y="${f(y)}" width="18" height="${f(40 + r() * 50)}" rx="6" fill="#8a7a62" stroke="#5a4e3e"/>`; }
    s += `<circle cx="880" cy="640" r="120" fill="#cfc7b0" stroke="#8a826c" stroke-width="6"/><circle cx="880" cy="640" r="80" fill="#e8e0c8" stroke="#a89f86" stroke-width="3"/>`;
    for (let a = 0; a < 12; a++) s += `<line x1="${f(880 + Math.cos(a / 6 * Math.PI) * 80)}" y1="${f(640 + Math.sin(a / 6 * Math.PI) * 80)}" x2="${f(880 + Math.cos(a / 6 * Math.PI) * 120)}" y2="${f(640 + Math.sin(a / 6 * Math.PI) * 120)}" stroke="#a89f86" stroke-width="3"/>`;
    s += `<circle cx="1360" cy="700" r="60" fill="#f4f4f4" stroke="#3fd8ff" stroke-width="6"/><path d="M1300,700 h120" stroke="#3fd8ff" stroke-width="8"/>`;
    for (let k = 0; k < 6; k++) s += `<path d="${blob(100 + r() * 1600, k % 2 ? 80 + r() * 80 : 1100 + r() * 60, 50 + r() * 40, 30 + r() * 20, r)}" fill="#e2cf93" stroke="#3f8f4a" stroke-width="10"/>`;
    return s;
  }
  function metropoli(r) {
    let s = `<rect width="${W}" height="${H}" fill="#1a2230"/>`;
    s += `<path d="M1150,${H} C1250,900 1500,820 ${W},860 L${W},${H}Z" fill="#123a5a"/><path d="M0,0 L520,0 C460,140 220,180 0,220Z" fill="#123a5a"/>`;
    s += `<rect x="560" y="480" width="320" height="230" rx="18" fill="#1f4d2e" stroke="#2d6b3e" stroke-width="4"/>`;
    for (let k = 0; k < 60; k++) s += `<circle cx="${f(580 + r() * 280)}" cy="${f(500 + r() * 190)}" r="${f(6 + r() * 8)}" fill="#2a6a3c"/>`;
    for (let x = 20; x < W; x += 130) for (let y = 20; y < H; y += 120) {
      if (x > 540 && x < 900 && y > 460 && y < 720) continue;
      if (y > 860 - (x - 1150) * .3 && x > 1150) continue;
      if (x < 520 && y < 200 - x * .3) continue;
      const w = 80 + r() * 30, h = 70 + r() * 30, t = r();
      s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${t < .3 ? "#2a3446" : t < .6 ? "#232c3c" : "#303b50"}" stroke="#3d4a62"/>`;
      s += `<rect x="${f(x + w * .25)}" y="${f(y + h * .25)}" width="${f(w * .5)}" height="${f(h * .5)}" fill="none" stroke="#4c5c78" stroke-width="2"/>`;
      if (r() < .25) s += `<circle cx="${f(x + w / 2)}" cy="${f(y + h / 2)}" r="5" fill="#ff2e46" opacity=".8"/>`;
    }
    for (let x = 0; x <= W; x += 130) s += `<line x1="${x + 10}" y1="0" x2="${x + 10}" y2="${H}" stroke="#141a26" stroke-width="16"/>`;
    for (let y = 0; y <= H; y += 120) s += `<line x1="0" y1="${y + 10}" x2="${W}" y2="${y + 10}" stroke="#141a26" stroke-width="16"/>`;
    s += `<path d="M900,1080 L1300,960" stroke="#8a95a8" stroke-width="22"/><path d="M900,1080 L1300,960" stroke="#c0c8d0" stroke-width="4" stroke-dasharray="14 10"/>`;
    for (let k = 0; k < 30; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(5 + r() * 8)}" fill="${k % 2 ? "#4c95ff" : "#f2c14e"}" opacity=".45" filter="url(#bagliore)"/>`;
    return s;
  }
  function olimpo(r) {
    let s = `<defs><linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc4e8"/><stop offset=".35" stop-color="#6f9a5a"/><stop offset="1" stop-color="#4f7d43"/></linearGradient></defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#cielo)"/>`;
    s += `<path d="M0,${H} L0,1060 C300,1020 600,1110 900,1060 C1200,1010 1500,1100 ${W},1040 L${W},${H}Z" fill="#1d5a8a"/>`;
    for (let k = 0; k < 40; k++) { const x = r() * W, y = 650 + r() * 380; s += `<rect x="${f(x)}" y="${f(y)}" width="${f(60 + r() * 80)}" height="${f(30 + r() * 30)}" rx="4" fill="${["#c9b24a", "#8fb04a", "#a9c25a", "#7a9a3a"][k % 4]}" opacity=".7" transform="rotate(${f(r() * 30 - 15)} ${f(x)} ${f(y)})"/>`; }
    s += `<path d="M300,760 L620,380 L760,470 L900,120 L1040,460 L1180,360 L1500,760Z" fill="#8a7a6a"/>`;
    s += `<path d="M520,760 L760,470 L900,250 L1040,460 L1280,760Z" fill="#a08f7c"/>`;
    s += `<path d="M820,250 L900,120 L980,250 L940,230 L900,270 L860,230Z" fill="#fafafa"/><path d="M570,450 L620,380 L670,440Z" fill="#fafafa"/><path d="M1140,420 L1180,360 L1220,420Z" fill="#fafafa"/>`;
    for (const d of [curva([[900, 300], [860, 520], [700, 760], [560, 1060]]), curva([[1060, 480], [1240, 700], [1380, 900], [1420, 1060]])]) s += `<path d="${d}" stroke="#3a7fc0" stroke-width="14" fill="none"/><path d="${d}" stroke="#7fc0f0" stroke-width="4" fill="none" opacity=".7"/>`;
    for (let k = 0; k < 100; k++) s += `<circle cx="${f(r() * W)}" cy="${f(700 + r() * 330)}" r="${f(5 + r() * 6)}" fill="#3f6a2e" opacity=".8"/>`;
    for (const [tx, ty] of [[900, 150], [840, 900], [1380, 1000], [640, 470], [1560, 400]]) { s += `<rect x="${tx - 36}" y="${ty - 10}" width="72" height="8" fill="#f2c14e"/><path d="M${tx - 40},${ty - 10} L${tx},${ty - 34} L${tx + 40},${ty - 10}Z" fill="#f2e2a0"/>`; for (let c = -3; c <= 3; c++) s += `<rect x="${tx + c * 10 - 2}" y="${ty - 2}" width="4" height="26" fill="#f4ecd8"/>`; s += `<rect x="${tx - 40}" y="${ty + 24}" width="80" height="6" fill="#f2c14e"/>`; }
    for (let k = 0; k < 9; k++) s += `<path d="${blob(500 + r() * 800, 60 + r() * 260, 120 + r() * 80, 40 + r() * 20, r, 14, .5)}" fill="#ffffff" opacity="${(.45 + r() * .3).toFixed(2)}"/>`;
    return s;
  }
  function castello(r) {
    let s = `<defs><linearGradient id="notte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1230"/><stop offset=".36" stop-color="#1b2c4a"/><stop offset=".44" stop-color="#1d3d28"/><stop offset="1" stop-color="#173420"/></linearGradient></defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#notte)"/>`;
    for (let k = 0; k < 120; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * 380)}" r="${(r() * 1.6 + .4).toFixed(1)}" fill="#fff" opacity="${(.3 + r() * .6).toFixed(2)}"/>`;
    s += `<circle cx="1560" cy="140" r="70" fill="#f4f1dc"/><circle cx="1585" cy="125" r="62" fill="#1b2c4a" opacity=".25"/><circle cx="1560" cy="140" r="120" fill="#f4f1dc" opacity=".08" filter="url(#sfoca)"/>`;
    // montagne dietro il castello
    s += `<path d="M0,520 L180,330 L330,450 L520,260 L700,420 L880,300 L1060,430 L1260,280 L1450,440 L1650,330 L1800,420 L1800,560 L0,560Z" fill="#14203a"/>`;
    // collina e castello
    s += `<path d="M560,720 C620,520 760,430 1000,420 C1240,430 1380,520 1440,720Z" fill="#2a3326"/>`;
    s += `<rect x="640" y="380" width="720" height="250" fill="#3b3f4a" stroke="#22252c" stroke-width="4"/>`;
    for (let x = 640; x < 1360; x += 30) s += `<rect x="${x}" y="366" width="18" height="16" fill="#3b3f4a"/>`;
    const torri = [[600, 70, 360], [700, 60, 300], [850, 80, 420], [1000, 90, 520], [1160, 70, 400], [1300, 64, 330], [1400, 70, 360], [930, 50, 260], [1080, 48, 280]];
    for (const [x, w, h] of torri) {
      const y = 630 - h;
      s += `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" fill="#444956" stroke="#22252c" stroke-width="3"/>`;
      s += `<path d="M${x - w / 2 - 10},${y} L${x},${y - w * 1.3} L${x + w / 2 + 10},${y}Z" fill="#253a66" stroke="#1a2440" stroke-width="3"/>`;
      for (let k = 0; k < Math.floor(h / 60); k++) s += `<rect x="${x - 6}" y="${y + 24 + k * 60}" width="12" height="20" rx="6" fill="#ffd36b" opacity="${(.5 + r() * .5).toFixed(2)}"/>`;
    }
    for (let k = 0; k < 40; k++) s += `<rect x="${f(660 + r() * 680)}" y="${f(420 + r() * 180)}" width="8" height="12" rx="4" fill="#ffd36b" opacity="${(.3 + r() * .6).toFixed(2)}"/>`;
    // lago nero
    s += `<path d="${blob(380, 880, 330, 190, r, 22, .18)}" fill="#08121f" stroke="#1f3a52" stroke-width="6"/>`;
    for (let k = 0; k < 22; k++) { const x = 160 + r() * 440, y = 760 + r() * 240; s += `<path d="M${f(x)},${f(y)} h${f(20 + r() * 40)}" stroke="#2a5a80" stroke-width="2" opacity=".5"/>`; }
    // foresta proibita
    for (let k = 0; k < 110; k++) { const x = 1260 + r() * 540, y = 720 + r() * 330; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(18 + r() * 22)}" fill="${["#0e2a16", "#123520", "#0b2212"][k % 3]}"/>`; }
    // campo da quidditch
    s += `<ellipse cx="1560" cy="560" rx="180" ry="95" fill="#2f6a3a" stroke="#d8e8d0" stroke-width="5"/>`;
    for (const [x, d] of [[1405, -1], [1715, 1]]) for (const dy of [-30, 0, 30]) s += `<line x1="${x}" y1="${560 + dy}" x2="${x}" y2="${560 + dy - 40 - (dy === 0 ? 15 : 0)}" stroke="#f2c14e" stroke-width="3"/><circle cx="${x}" cy="${560 + dy - 48 - (dy === 0 ? 15 : 0)}" r="9" fill="none" stroke="#f2c14e" stroke-width="3"/>`;
    // serre
    for (let k = 0; k < 3; k++) s += `<rect x="${450 + k * 60}" y="${700 + (k % 2) * 14}" width="50" height="34" rx="6" fill="#9fe0c8" opacity=".35" stroke="#cfeee0" stroke-width="2"/>`;
    // capanna e villaggio
    const casa = (x, y, sc, tetto) => `<rect x="${x - 20 * sc}" y="${y - 16 * sc}" width="${40 * sc}" height="${30 * sc}" fill="#5a4636" stroke="#2a2018" stroke-width="2"/><path d="M${x - 26 * sc},${y - 16 * sc} L${x},${y - 40 * sc} L${x + 26 * sc},${y - 16 * sc}Z" fill="${tetto}"/><rect x="${x - 5 * sc}" y="${y}" width="${10 * sc}" height="${14 * sc}" fill="#ffd36b" opacity=".7"/>`;
    s += casa(1280, 1060, 1.4, "#6a4a2a");
    for (let k = 0; k < 9; k++) s += casa(1560 + (k % 3) * 70 + r() * 20, 1040 + Math.floor(k / 3) * 50, .9, ["#7a2a3a", "#2a4a7a", "#4a6a2a"][k % 3]);
    // binari
    s += `<path d="M0,1130 C200,1120 300,1150 420,1180" stroke="#5a5a5a" stroke-width="16" fill="none"/><path d="M0,1130 C200,1120 300,1150 420,1180" stroke="#9a8a6a" stroke-width="3" stroke-dasharray="6 10" fill="none"/>`;
    // ponte di pietra
    s += `<path d="M120,520 Q220,470 320,520" stroke="#6a6a72" stroke-width="18" fill="none"/>`;
    for (let k = 0; k < 30; k++) s += `<circle cx="${f(r() * W)}" cy="${f(420 + r() * 700)}" r="${f(4 + r() * 6)}" fill="#ffe9a8" opacity=".35" filter="url(#bagliore)"/>`;
    return s;
  }
  function dimensione(r) {
    let s = `<defs><radialGradient id="vuoto" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#2a0f4a"/><stop offset="1" stop-color="#05020c"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vuoto)"/>`;
    for (let k = 0; k < 300; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${(r() * 1.8 + .3).toFixed(1)}" fill="#fff" opacity="${(.3 + r() * .7).toFixed(2)}"/>`;
    for (let k = 0; k < 7; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(120 + r() * 160)}" fill="${["#b866ff", "#3fd8ff", "#ff4fd8", "#f2c14e"][k % 4]}" opacity=".12" filter="url(#sfoca)"/>`;
    const n = NODI[5];
    for (let i = 0; i < n.length - 1; i++) s += `<path d="M${n[i][0]},${n[i][1]} L${n[i + 1][0]},${n[i + 1][1]}" stroke="#b866ff" stroke-width="6" opacity=".35" filter="url(#bagliore)"/>`;
    for (const [x, y] of [...n, [560, 980], [1000, 180], [1450, 250], [360, 220], [1260, 760], [760, 760]]) {
      s += `<path d="${blob(x, y + 40, 150, 50, r)}" fill="#2a1a3a"/><path d="M${x - 130},${y + 40} Q${x},${y + 200} ${x + 130},${y + 40}Z" fill="#1a0e26"/>`;
      s += `<path d="${blob(x, y + 30, 140, 45, r)}" fill="#4a3a5a" stroke="#6a5a8a" stroke-width="3"/>`;
    }
    return s;
  }
  const TERRENI = [citta, isola, metropoli, olimpo, castello, dimensione];

  const cache = {};
  function svg(k) {
    if (cache[k]) return cache[k];
    const r = rng(1000 + k * 77), nodi = NODI[k];
    let s = `<svg class="mondo-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><filter id="bagliore" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6"/></filter><filter id="sfoca" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter></defs>`;
    s += TERRENI[k](r);
    for (const [x, y, sim, nome] of LUOGHI[k]) {
      s += `<g class="luogo"><circle cx="${x}" cy="${y}" r="22" fill="rgba(13,10,12,.75)" stroke="#f4ece8" stroke-width="2"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="20" fill="#f4ece8">${sim}</text>
        <text x="${x}" y="${y + 46}" text-anchor="middle" font-size="18" font-weight="700" fill="#f4ece8" stroke="#0d0a0c" stroke-width="5" paint-order="stroke" font-family="Barlow Semi Condensed, Arial Narrow, sans-serif">${nome}</text></g>`;
    }
    s += `<path d="${curva(nodi)}" class="sentiero" fill="none"/>`;
    s += `</svg>`;
    return (cache[k] = s);
  }

  // ---------------- Nebbia ----------------
  // buchi: [{x, y, r}] zone scoperte. Disegna la nebbia e "buca" le zone scoperte.
  function nebbia(canvas, k, buchi) {
    const g = canvas.getContext("2d");
    canvas.width = W / 2; canvas.height = H / 2;   // a metà risoluzione: la nebbia è morbida comunque
    g.setTransform(.5, 0, 0, .5, 0, 0);
    const r = rng(500 + k * 31);
    // colore di base e colore delle nuvole per ogni capitolo
    const [base, nuv] = [["#2b2433", "214,196,232"], ["#9fb4c8", "255,255,255"], ["#363e4e", "200,214,236"], ["#c9d4de", "255,255,255"], ["#1c2638", "205,220,245"], ["#24123c", "214,170,255"]][k];
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 220; i++) {
      const x = r() * W, y = r() * H, rr = 70 + r() * 170, a = .10 + r() * .16;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(${nuv},${a.toFixed(2)})`); gr.addColorStop(1, `rgba(${nuv},0)`);
      g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    for (let i = 0; i < 60; i++) {   // ombre tra le nuvole, per dare volume
      const x = r() * W, y = r() * H, rr = 80 + r() * 160;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, "rgba(0,0,0,.12)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    g.globalCompositeOperation = "destination-out";
    for (const b of buchi) {
      if (b.r <= 0) continue;
      const gr = g.createRadialGradient(b.x, b.y, b.r * .45, b.x, b.y, b.r);
      gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = "source-over";
  }

  return { W, H, NODI, svg, nebbia, curva };
})();
