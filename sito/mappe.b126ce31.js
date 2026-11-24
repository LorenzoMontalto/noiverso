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
    [[240, 1010], [530, 800], [860, 960], [1160, 700], [1570, 330], [990, 330]],    // porto
    [[200, 1020], [560, 880], [900, 1010], [1190, 730], [870, 470], [1460, 280]],   // deserto
    [[220, 1040], [540, 870], [870, 990], [1170, 760], [880, 520], [1460, 330]],    // luna park
    [[250, 1060], [570, 900], [920, 990], [1230, 790], [1010, 560], [900, 250]],    // vulcano
    [[200, 1050], [520, 860], [880, 990], [1250, 830], [1420, 480], [900, 240]],    // Inferi
    [[230, 1000], [520, 760], [880, 950], [1190, 690], [1480, 890], [1560, 330]],   // città dei mestieri
    [[220, 1000], [540, 820], [880, 980], [1180, 720], [1470, 900], [1560, 360]],   // Springfield
    [[200, 980], [520, 780], [860, 960], [1160, 700], [1480, 860], [1300, 340]],   // casa dei Barbapapà
    [[220, 980], [560, 840], [900, 1000], [1200, 760], [1520, 900], [1380, 330]],   // galassia lontana lontana
    [[260, 1000], [620, 860], [360, 560], [960, 820], [1420, 880], [1380, 360]],    // regno degli elementi
    [[240, 1010], [620, 920], [1020, 1040], [1300, 820], [640, 620], [1500, 480]],   // notte delle creature
    [[220, 1030], [580, 880], [960, 1020], [1210, 760], [820, 520], [1500, 330]],    // città del futuro
    [[300, 900], [620, 1000], [1060, 980], [1440, 760], [1020, 420], [520, 300]],     // tavolo da gioco
    [[900, 228], [685, 824], [1055, 400], [1600, 352], [880, 150], [515, 328]],       // giro del mondo
    [[250, 980], [640, 920], [1040, 1000], [1440, 890], [1250, 560], [610, 236]],     // Far West
    [[240, 980], [560, 760], [900, 920], [1220, 700], [1500, 880], [900, 300]],     // specchio dei mondi
    [[150, 900], [450, 760], [760, 860], [1060, 700], [1360, 820], [1640, 560]],    // treno tra i mondi
    [[900, 1080], [1290, 860], [560, 760], [1230, 560], [600, 420], [900, 190]],    // torre del tempo
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
    [[110, 1120, "▤", "Container Rossi"], [430, 680, "⚖", "Dogana"], [700, 1100, "🐟", "Mercato del Pesce"], [1350, 820, "☠", "Nave Fantasma"],
     [1640, 200, "✺", "Faro"], [880, 220, "⚓", "Molo Nove"], [300, 400, "⚙", "Gru"], [1100, 1080, "⛽", "Deposito"], [600, 300, "☕", "Taverna del Marinaio"]],
    [[90, 1130, "🐪", "Carovana"], [520, 1110, "♒", "Oasi"], [980, 1120, "⚡", "Canyon"], [1360, 660, "▲", "Piramide"],
     [620, 380, "🌀", "Tempesta di Sabbia"], [1620, 200, "◉", "Tempio delle Sfere"], [300, 560, "☀", "Dune Dorate"], [1500, 1050, "⛺", "Accampamento"], [1150, 300, "☠", "Ossa di Drago"]],
    [[100, 1140, "🎟", "Biglietteria"], [380, 760, "◈", "Casa degli Specchi"], [700, 1120, "☠", "Tunnel dell'Orrore"], [1380, 860, "⇅", "Montagne Russe"],
     [640, 440, "✶", "Tenda della Veggente"], [1600, 220, "♛", "Ruota Panoramica"], [1050, 420, "♪", "Giostra dei Cavalli"], [1640, 1100, "🍭", "Zucchero Filato"], [250, 380, "◎", "Tiro a Segno"]],
    [[120, 1140, "⛏", "Pendici"], [380, 760, "◆", "Grotte di Cristallo"], [760, 1130, "♨", "Fiume di Lava"], [1420, 900, "☁", "Campo di Cenere"],
     [1250, 520, "◉", "Bocca del Cratere"], [900, 120, "▲", "Cuore del Vulcano"], [1600, 380, "⚒", "Fucina"], [1650, 1120, "☢", "Sorgenti Bollenti"], [420, 300, "✦", "Ossidiana"]],
    [[100, 1140, "⛩", "Porta degli Inferi"], [330, 720, "≈", "Fiume Stige"], [760, 1140, "⚖", "Mercato dei Patti"], [1440, 1010, "⛧", "Cerchio del Sabba"],
     [1640, 380, "◉", "Abisso"], [900, 110, "♛", "Trono di Fuoco"], [300, 330, "☠", "Valle delle Ossa"], [1160, 520, "♨", "Lago di Fuoco"], [1680, 1130, "⛓", "Prigioni"], [600, 520, "✝", "Cimitero"]],
    [[90, 1130, "☀", "Villaggio Vacanze"], [330, 600, "✎", "Scuola"], [520, 1130, "🍸", "Bar Centrale"], [1000, 1120, "⚽", "Stadio"],
     [1320, 560, "$", "Borsa"], [1660, 1030, "🎬", "Set del Film"], [1700, 200, "♫", "Teatro dell'Opera"], [720, 420, "⚗", "Laboratorio"],
     [1080, 270, "🎧", "Studio di Registrazione"], [230, 200, "▲", "Vetta del Monte"], [1680, 650, "☘", "Giungla"]],
    [[110, 1120, "✎", "Scuola Elementare"], [400, 940, "🍺", "Taverna di Moe"], [730, 1130, "✝", "Prima Chiesa"], [1070, 590, "★", "Studio di Krusty"],
     [1640, 1020, "⚑", "Stazione di Polizia"], [1720, 250, "⌂", "Evergreen Terrace"], [260, 300, "☢", "Centrale Nucleare"], [820, 250, "◎", "Kwik-E-Mart"],
     [1260, 260, "▲", "Monte Springfield"], [600, 560, "🍩", "Lard Lad Donuts"]],
    [[100, 1110, "✿", "Giardino Fiorito"], [400, 610, "⚗", "Laboratorio Blu"], [760, 1120, "📖", "Biblioteca"], [1080, 560, "⚽", "Campo Sportivo"],
     [1660, 1010, "♫", "Sala della Musica"], [1300, 180, "⌂", "La Casa Rosa"], [260, 300, "≈", "Laghetto"], [1660, 420, "🐘", "Zoo di Pipsobà"],
     [820, 300, "🎨", "Atelier"], [1440, 640, "☂", "Prato degli Ombrelli"]],
    [[110, 1110, "☀", "Tatooine"], [440, 960, "🍸", "Cantina di Mos Eisley"], [780, 1130, "⚖", "Senato Galattico"], [1080, 620, "✦", "Base Ribelle"],
     [1660, 1020, "♨", "Mustafar"], [1380, 180, "◉", "Morte Nera"], [300, 300, "❄", "Pianeta Ghiacciato"], [820, 300, "☄", "Campo di Asteroidi"],
     [1680, 560, "⛭", "Flotta Imperiale"], [520, 600, "✧", "Tempio Jedi"]],
    [[110, 1120, "✿", "Foresta in Fiore"], [720, 1130, "≈", "Lago in Tempesta"], [200, 280, "❄", "Vette di Ghiaccio"], [1010, 1110, "☠", "Palude del Veleno"],
     [1660, 1100, "♨", "Forgia di Magma"], [1380, 130, "❖", "Trono degli Elementi"], [1000, 420, "♪", "Grotta dell'Eco"], [1560, 360, "⚡", "Picco dei Fulmini"],
     [560, 520, "◆", "Miniera di Cristalli"], [1210, 470, "☾", "Bosco delle Ombre"]],
    [[110, 1110, "✝", "Cimitero"], [760, 1130, "≈", "Laguna Nera"], [1150, 1120, "⚗", "Laboratorio del Dottore"], [1520, 1000, "▲", "Piramide Maledetta"],
     [420, 720, "☾", "Bosco della Luna Piena"], [1700, 150, "♜", "Castello del Conte"], [235, 120, "★", "Torre della Strega"], [820, 360, "◯", "Luna Piena"],
     [1650, 700, "⌂", "Cripta"], [1700, 1100, "✳", "Tana del Ragno"]],
    [[110, 1100, "✦", "Quartiere dei Neon"], [700, 1100, "⚙", "Mercato dei Ricambi"], [1180, 1100, "⚒", "Fabbrica dei Robot"], [1260, 600, "◈", "Dentro la Rete"],
     [700, 380, "▮", "Grattacielo della Corporazione"], [1500, 120, "◉", "Cervello Centrale"], [260, 420, "✈", "Stazione delle Auto Volanti"],
     [1700, 980, "♻", "Discarica Elettronica"], [1720, 560, "✚", "Clinica Cibernetica"]],
    [[120, 1110, "☕", "L'Osteria"], [700, 1140, "♪", "La Sagra del Paese"], [1300, 1110, "♣", "Circolo della Briscola"], [1700, 700, "◆", "Sala del Tressette"],
     [1500, 220, "♞", "Torneo dei Cavalli"], [520, 150, "♛", "Tavolo dei Re"], [900, 520, "▤", "Il Mazzo"], [110, 420, "$", "Cassa dei Denari"], [1710, 1110, "♠", "Bancone"]],
    [[990, 250, "⌚", "Londra"], [700, 920, "♪", "Rio de Janeiro"], [1110, 470, "▲", "Il Cairo"], [1640, 420, "✿", "Tokyo"], [790, 110, "♣", "Edimburgo"], [470, 400, "★", "Washington"],
     [975, 330, "⛫", "Roma"], [1050, 330, "◎", "Atene"], [1560, 960, "☼", "Sydney"], [300, 700, "≈", "Oceano"]],
    [[120, 1130, "♠", "Saloon"], [540, 690, "★", "Ufficio dello Sceriffo"], [740, 1130, "$", "Banca"], [1640, 600, "⚙", "Stazione"],
     [1700, 1060, "◎", "Recinto del Rodeo"], [1650, 220, "⛏", "Miniera d'Oro"], [460, 600, "✝", "Chiesetta"], [1060, 250, "▲", "Canyon"],
     [240, 360, "☠", "Cimitero"], [1190, 680, "◉", "Pozzo"], [610, 130, "☀", "Mesa del Duello"]],
    [[120, 1110, "◇", "Lo specchio"], [380, 600, "✦", "Mondo di Giulia"], [760, 1110, "✧", "Mondo di Viky"], [1300, 540, "⌘", "Labirinto"],
     [1660, 1010, "◈", "Mondo di Senè"], [900, 150, "∞", "Il Cuore del Multiverso"], [300, 260, "◐", "Frammenti"], [1600, 280, "◑", "Specchi rotti"]],
    [[100, 1050, "⌂", "Stazione"], [330, 560, "☕", "Carrozza Ristorante"], [760, 1060, "☾", "Carrozza Letto"], [1060, 520, "⌒", "Ponte Sospeso"],
     [1390, 1010, "◐", "Galleria"], [1680, 400, "♨", "Locomotiva"], [900, 200, "☁", "Temporale"], [1500, 160, "⛰", "Montagne"]],
    [[640, 1120, "⌂", "Portone"], [1500, 960, "◷", "Sala degli Orologi"], [300, 860, "↗", "Scala Infinita"], [1520, 520, "❀", "Giardino Sospeso"],
     [330, 380, "◇", "Stanza degli Specchi"], [1220, 150, "⌛", "Cima della Torre"], [1650, 1130, "⚙", "Ingranaggi"]],
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
    const n = NODI[NODI.length - 1];
    for (let i = 0; i < n.length - 1; i++) s += `<path d="M${n[i][0]},${n[i][1]} L${n[i + 1][0]},${n[i + 1][1]}" stroke="#b866ff" stroke-width="6" opacity=".35" filter="url(#bagliore)"/>`;
    for (const [x, y] of [...n, [560, 980], [1000, 180], [1450, 250], [360, 220], [1260, 760], [760, 760]]) {
      s += `<path d="${blob(x, y + 40, 150, 50, r)}" fill="#2a1a3a"/><path d="M${x - 130},${y + 40} Q${x},${y + 200} ${x + 130},${y + 40}Z" fill="#1a0e26"/>`;
      s += `<path d="${blob(x, y + 30, 140, 45, r)}" fill="#4a3a5a" stroke="#6a5a8a" stroke-width="3"/>`;
    }
    return s;
  }

  function porto(r) {
    let s = `<rect width="${W}" height="${H}" fill="#121820"/>`;
    // mare a destra e in alto a destra, con onde
    s += `<path d="M1180,${H} C1240,900 1150,700 1300,520 C1420,380 1380,180 1500,0 L${W},0 L${W},${H}Z" fill="#0b2a44"/>`;
    for (let k = 0; k < 90; k++) { const x = 1250 + r() * 560, y = r() * H; s += `<path d="M${f(x)},${f(y)} q10,-7 20,0 t20,0" stroke="#2a6aa0" stroke-width="2" fill="none" opacity=".45"/>`; }
    // banchina e pontili
    s += `<path d="M1180,${H} C1240,900 1150,700 1300,520 C1420,380 1380,180 1500,0" stroke="#6a6a72" stroke-width="22" fill="none"/>`;
    for (const [x, y, l] of [[1280, 860, 220], [1300, 600, 260], [1420, 360, 200]]) s += `<rect x="${x}" y="${y}" width="${l}" height="34" fill="#5a4636" stroke="#2a2018" stroke-width="3"/>`;
    // container a file
    const colori = ["#c0392b", "#2b6fc0", "#2fa36b", "#e0a33a", "#8a3fc0", "#c05a2b"];
    for (let x = 60; x < 1100; x += 120) for (let y = 820; y < H - 30; y += 70) if (r() < .8) {
      const c = colori[Math.floor(r() * colori.length)];
      s += `<rect x="${f(x)}" y="${f(y)}" width="100" height="44" fill="${c}" stroke="#0d0a0c" stroke-width="3"/>`;
      for (let k = 1; k < 6; k++) s += `<line x1="${f(x + k * 16)}" y1="${f(y + 4)}" x2="${f(x + k * 16)}" y2="${f(y + 40)}" stroke="#0d0a0c" stroke-opacity=".35" stroke-width="2"/>`;
    }
    // magazzini e strade
    for (let x = 40; x < 1150; x += 170) for (let y = 40; y < 760; y += 150) if (r() < .7) s += `<rect x="${f(x)}" y="${f(y)}" width="${f(120 + r() * 30)}" height="${f(90 + r() * 30)}" rx="4" fill="${r() < .5 ? "#232a33" : "#1c222b"}" stroke="#36404c"/>`;
    // gru
    for (const [x, y] of [[300, 470], [1180, 450], [1080, 900]]) s += `<path d="M${x},${y + 90} L${x},${y - 90} L${x + 170},${y - 90}" stroke="#f2c14e" stroke-width="10" fill="none"/><line x1="${x + 150}" y1="${y - 90}" x2="${x + 150}" y2="${y}" stroke="#bbb" stroke-width="3"/><rect x="${x + 135}" y="${y}" width="30" height="20" fill="#c0392b"/>`;
    // nave fantasma (verdastra) e navi cargo
    s += `<path d="M1200,700 L1500,700 L1460,780 L1240,780Z" fill="#2a3a30" stroke="#6fe3a0" stroke-width="3" opacity=".9"/><rect x="1300" y="610" width="12" height="90" fill="#3a4a40"/><path d="M1312,615 L1400,660 L1312,690Z" fill="#9fe0c0" opacity=".45"/>`;
    s += `<path d="M1500,980 L1760,980 L1730,1040 L1530,1040Z" fill="#7a2a2a" stroke="#2a0a0a" stroke-width="3"/><rect x="1560" y="940" width="70" height="40" fill="#ddd"/>`;
    // faro su uno scoglio
    s += `<path d="${blob(1600, 400, 120, 60, r)}" fill="#3a3a3a"/><path d="M1580,390 L1590,240 L1610,240 L1620,390Z" fill="#f4f4f4" stroke="#c0392b" stroke-width="4"/><circle cx="1600" cy="235" r="18" fill="#ffe14a"/><path d="M1600,235 L1800,170 L1800,300Z" fill="#ffe14a" opacity=".18"/>`;
    for (let k = 0; k < 30; k++) s += `<circle cx="${f(r() * 1200)}" cy="${f(r() * H)}" r="${f(5 + r() * 7)}" fill="${k % 2 ? "#3fd8ff" : "#ffcf6a"}" opacity=".45" filter="url(#bagliore)"/>`;
    return s;
  }
  function deserto(r) {
    let s = `<defs><linearGradient id="sabbia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0c27a"/><stop offset="1" stop-color="#c9893f"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sabbia)"/>`;
    // dune
    for (let k = 0; k < 16; k++) { const y = 80 + k * 72 + r() * 30; s += `<path d="M-50,${f(y)} C300,${f(y - 40 - r() * 30)} 600,${f(y + 30)} 900,${f(y - 20)} S1500,${f(y + 40)} 1850,${f(y - 10)}" stroke="#b97a3a" stroke-opacity=".35" stroke-width="${f(6 + r() * 8)}" fill="none"/>`; }
    // canyon
    s += `<path d="M700,${H} C760,1060 980,1060 1060,980 C1140,900 1250,900 1300,${H}Z" fill="#7a3f1e"/><path d="M780,${H} C820,1090 980,1090 1050,1030 C1110,980 1200,990 1230,${H}Z" fill="#4a2410"/>`;
    // oasi con palme
    s += `<path d="${blob(560, 960, 170, 90, r)}" fill="#3a9ad0" stroke="#2fa36b" stroke-width="16"/>`;
    for (const [x, y] of [[420, 900], [700, 920], [480, 1040], [660, 1040], [560, 870]]) s += `<line x1="${x}" y1="${y}" x2="${x + 6}" y2="${y - 50}" stroke="#7a5a2a" stroke-width="6"/>${[0, 72, 144, 216, 288].map(a => `<path d="M${x + 6},${y - 50} q${f(Math.cos(a / 57.3) * 30)},${f(Math.sin(a / 57.3) * 12 - 10)} ${f(Math.cos(a / 57.3) * 50)},${f(Math.sin(a / 57.3) * 22)}" stroke="#2f8a3a" stroke-width="7" fill="none"/>`).join("")}`;
    // piramidi
    for (const [x, y, w] of [[1360, 760, 220], [1560, 800, 140], [1180, 820, 110]]) s += `<path d="M${x - w},${y} L${x},${y - w * 1.1} L${x + w},${y}Z" fill="#e0b060"/><path d="M${x},${y - w * 1.1} L${x + w},${y} L${x + w * .25},${y}Z" fill="#b08040"/>`;
    // tempesta di sabbia
    for (let k = 0; k < 7; k++) s += `<path d="M${f(620 - 200 + k * 20)},${f(400 + k * 12)} a${f(220 - k * 25)},${f(90 - k * 9)} 0 1 1 ${f(400 - k * 50)},0" stroke="#fff3d0" stroke-opacity="${(.15 + k * .05).toFixed(2)}" stroke-width="10" fill="none"/>`;
    // tempio delle sfere in cima
    s += `<rect x="1520" y="210" width="200" height="110" fill="#d8b070" stroke="#8a6030" stroke-width="4"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${1530 + i * 40}" y="230" width="16" height="90" fill="#f0d8a0"/>`).join("")}<path d="M1500,210 L1620,150 L1740,210Z" fill="#c0904a"/>`;
    for (let i = 0; i < 7; i++) s += `<circle cx="${1560 + i * 20}" cy="${190 - (i % 2) * 8}" r="7" fill="#ff9a1f" stroke="#ffe0a0" stroke-width="2"/>`;
    // ossa e cactus
    for (let k = 0; k < 14; k++) { const x = r() * W, y = 150 + r() * 900; s += `<path d="M${f(x)},${f(y)} v-40 m0,14 h-14 v-12 m14,8 h14 v-14" stroke="#4f7d43" stroke-width="7" fill="none" stroke-linecap="round"/>`; }
    s += `<path d="M1050,300 q60,-40 120,0 q40,30 80,0" stroke="#f4ece0" stroke-width="10" fill="none"/>`;
    // carovana
    for (let i = 0; i < 5; i++) s += `<ellipse cx="${120 + i * 50}" cy="${1100 - i * 6}" rx="18" ry="10" fill="#7a5030"/>`;
    return s;
  }
  function lunapark(r) {
    let s = `<defs><radialGradient id="notteLuna" cx=".7" cy=".2" r=".9"><stop offset="0" stop-color="#3a1450"/><stop offset="1" stop-color="#0c0614"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#notteLuna)"/>`;
    for (let k = 0; k < 100; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * 300)}" r="${(r() * 1.5 + .3).toFixed(1)}" fill="#fff" opacity="${(.3 + r() * .6).toFixed(2)}"/>`;
    s += `<rect y="560" width="${W}" height="${H - 560}" fill="#1a1020"/>`;
    // vialetti
    for (const d of [curva([[0, 1080], [500, 900], [900, 1000], [1300, 800], [1800, 900]]), curva([[200, 600], [700, 520], [1100, 640], [1600, 560]])]) s += `<path d="${d}" stroke="#2c1c34" stroke-width="60" fill="none"/>`;
    // ruota panoramica
    const [rx, ry, rr] = [1600, 260, 170];
    s += `<line x1="${rx - 90}" y1="${ry + 330}" x2="${rx}" y2="${ry}" stroke="#8a7aa0" stroke-width="10"/><line x1="${rx + 90}" y1="${ry + 330}" x2="${rx}" y2="${ry}" stroke="#8a7aa0" stroke-width="10"/>`;
    s += `<circle cx="${rx}" cy="${ry}" r="${rr}" fill="none" stroke="#ff4fd8" stroke-width="8"/><circle cx="${rx}" cy="${ry}" r="${rr - 30}" fill="none" stroke="#3fd8ff" stroke-width="3"/>`;
    for (let a = 0; a < 12; a++) { const x = rx + Math.cos(a / 6 * Math.PI) * rr, y = ry + Math.sin(a / 6 * Math.PI) * rr; s += `<line x1="${rx}" y1="${ry}" x2="${f(x)}" y2="${f(y)}" stroke="#c0a0e0" stroke-width="3"/><rect x="${f(x - 14)}" y="${f(y)}" width="28" height="22" rx="5" fill="${["#ff4fd8", "#3fd8ff", "#f2c14e"][a % 3]}"/>`; }
    // montagne russe
    const binario = [[1100, 1000], [1200, 760], [1300, 900], [1420, 700], [1520, 960], [1640, 820], [1760, 1000]];
    for (const [x, y] of binario) s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${H}" stroke="#6a5a80" stroke-width="6"/>`;
    s += `<path d="${curva(binario)}" stroke="#ff2e46" stroke-width="12" fill="none"/><path d="${curva(binario)}" stroke="#ffd0d8" stroke-width="3" stroke-dasharray="10 10" fill="none"/>`;
    // tendoni a righe
    const tenda = (x, y, w, c1, c2) => { let t = ""; for (let i = 0; i < 6; i++) t += `<path d="M${x},${y - w} L${f(x - w + i * w / 3)},${y} L${f(x - w + (i + 1) * w / 3)},${y}Z" fill="${i % 2 ? c1 : c2}"/>`; return t + `<rect x="${x - w}" y="${y}" width="${2 * w}" height="${f(w * .6)}" fill="${c2}"/><circle cx="${x}" cy="${y - w - 8}" r="6" fill="#f2c14e"/>`; };
    s += tenda(640, 420, 90, "#ff4fd8", "#fff0fa") + tenda(380, 700, 70, "#3fd8ff", "#e8fbff") + tenda(1640, 1060, 60, "#f2c14e", "#fff6dc") + tenda(250, 340, 55, "#ff2e46", "#ffe8ec");
    // tunnel dell'orrore
    s += `<path d="M600,1180 L600,1060 Q700,980 800,1060 L800,1180Z" fill="#0a0410" stroke="#6fe3a0" stroke-width="6"/><circle cx="660" cy="1040" r="8" fill="#6fe3a0"/><circle cx="740" cy="1040" r="8" fill="#6fe3a0"/>`;
    // giostra dei cavalli
    s += `<ellipse cx="1050" cy="460" rx="110" ry="40" fill="#c08040"/><path d="M940,460 L1050,330 L1160,460Z" fill="#ff4fd8" opacity=".85"/>`;
    // lampadine
    for (let k = 0; k < 70; k++) s += `<circle cx="${f(r() * W)}" cy="${f(560 + r() * 600)}" r="${f(3 + r() * 5)}" fill="${["#ff4fd8", "#3fd8ff", "#f2c14e", "#ffffff"][k % 4]}" opacity=".7" filter="url(#bagliore)"/>`;
    return s;
  }
  function vulcano(r) {
    let s = `<defs><linearGradient id="cieloRosso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0e0a"/><stop offset=".5" stop-color="#1e0b08"/><stop offset="1" stop-color="#140806"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#cieloRosso)"/>`;
    // il vulcano
    s += `<path d="M300,780 L760,180 L1040,180 L1500,780Z" fill="#2a1a16"/><path d="M520,780 L800,260 L1000,260 L1280,780Z" fill="#35221c"/>`;
    s += `<ellipse cx="900" cy="185" rx="140" ry="30" fill="#ff5a1f"/><ellipse cx="900" cy="185" rx="90" ry="18" fill="#ffd36b"/><circle cx="900" cy="150" r="200" fill="#ff5a1f" opacity=".1" filter="url(#sfoca)"/>`;
    for (let k = 0; k < 8; k++) s += `<path d="${blob(820 + r() * 160, 60 - r() * 40, 60 + r() * 40, 30 + r() * 20, r, 14, .5)}" fill="#4a3a36" opacity="${(.5 + r() * .3).toFixed(2)}"/>`;
    // fiumi di lava
    for (const d of [curva([[880, 200], [820, 420], [700, 700], [760, 1000], [740, 1200]]), curva([[940, 200], [1080, 460], [1240, 700], [1420, 1000]])]) s += `<path d="${d}" stroke="#ff5a1f" stroke-width="40" fill="none" opacity=".9"/><path d="${d}" stroke="#ffd36b" stroke-width="12" fill="none"/><path d="${d}" stroke="#ff5a1f" stroke-width="80" fill="none" opacity=".15" filter="url(#bagliore)"/>`;
    // grotte di cristallo
    for (let k = 0; k < 18; k++) { const x = 250 + r() * 300, y = 680 + r() * 180, h = 30 + r() * 50; s += `<path d="M${f(x)},${f(y)} l${f(10 + r() * 8)},${f(-h)} l${f(10 + r() * 8)},${f(h)}Z" fill="${k % 2 ? "#3fd8ff" : "#9fefff"}" opacity=".75"/>`; }
    // rocce e cenere
    for (let k = 0; k < 60; k++) s += `<path d="${blob(r() * W, 760 + r() * 440, 20 + r() * 40, 12 + r() * 20, r, 8, .5)}" fill="${["#2a1c18", "#3a2620", "#1c120e"][k % 3]}"/>`;
    for (let k = 0; k < 120; k++) s += `<circle cx="${f(1250 + r() * 550)}" cy="${f(800 + r() * 380)}" r="${(1 + r() * 3).toFixed(1)}" fill="#8a7a74" opacity=".5"/>`;
    // fucina
    s += `<rect x="1560" y="340" width="120" height="80" fill="#3a2a24" stroke="#ff5a1f" stroke-width="4"/><rect x="1600" y="300" width="20" height="40" fill="#3a2a24"/><circle cx="1620" cy="380" r="14" fill="#ffd36b"/>`;
    for (let k = 0; k < 40; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(3 + r() * 5)}" fill="#ff9a1f" opacity=".55" filter="url(#bagliore)"/>`;
    return s;
  }

  function inferi(r) {
    let s = `<defs><radialGradient id="fondoInferi" cx=".5" cy=".15" r=".95"><stop offset="0" stop-color="#4a0a10"/><stop offset=".55" stop-color="#1c0608"/><stop offset="1" stop-color="#0c0304"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#fondoInferi)"/>`;
    // crepe di lava nel terreno
    for (let k = 0; k < 26; k++) { let x = r() * W, y = 300 + r() * 900, d = `M${f(x)},${f(y)}`; for (let i = 0; i < 5; i++) { x += (r() - .5) * 140; y += (r() - .5) * 90; d += ` L${f(x)},${f(y)}`; } s += `<path d="${d}" stroke="#ff3a1a" stroke-width="${f(2 + r() * 4)}" fill="none" opacity=".55" filter="url(#bagliore)"/><path d="${d}" stroke="#ffb347" stroke-width="1.5" fill="none" opacity=".7"/>`; }
    // il fiume Stige (nero e verdastro)
    const stige = curva([[-50, 640], [260, 720], [520, 600], [700, 760], [640, 980], [820, 1250]]);
    s += `<path d="${stige}" stroke="#061612" stroke-width="110" fill="none"/><path d="${stige}" stroke="#0c2a22" stroke-width="70" fill="none"/><path d="${stige}" stroke="#3fae8a" stroke-width="3" fill="none" stroke-dasharray="18 30" opacity=".5"/>`;
    s += `<path d="M560,690 L700,700" stroke="#5a4a44" stroke-width="20"/><path d="M560,690 L700,700" stroke="#8a7a70" stroke-width="3" stroke-dasharray="8 8"/>`;
    // lago di fuoco
    s += `<path d="${blob(1160, 600, 200, 90, r)}" fill="#ff5a1f" opacity=".9"/><path d="${blob(1160, 600, 130, 55, r)}" fill="#ffd36b" opacity=".85"/><circle cx="1160" cy="600" r="240" fill="#ff5a1f" opacity=".12" filter="url(#sfoca)"/>`;
    // il trono in alto, su una scalinata
    s += `<path d="M640,420 L760,300 L1040,300 L1160,420Z" fill="#2a0c10" stroke="#5a1a20" stroke-width="4"/>`;
    for (let i = 0; i < 5; i++) s += `<rect x="${700 + i * 20}" y="${300 - i * 22}" width="${400 - i * 40}" height="22" fill="${i % 2 ? "#3a1016" : "#2e0c12"}" stroke="#5a1a20" stroke-width="2"/>`;
    s += `<path d="M840,190 L840,90 L870,120 L900,60 L930,120 L960,90 L960,190Z" fill="#c9a13a" stroke="#6a4a10" stroke-width="3"/><rect x="830" y="186" width="140" height="22" fill="#6a1a20"/>`;
    for (const x of [720, 1080]) s += `<path d="M${x},300 q-20,-60 0,-110 q20,50 0,110Z" fill="#ff5a1f" opacity=".9"/><path d="M${x},300 q-10,-40 0,-70 q10,30 0,70Z" fill="#ffd36b"/>`;
    // corna di roccia
    for (const [x, y, d] of [[200, 230, 1], [1600, 220, -1], [480, 160, 1], [1320, 150, -1]]) s += `<path d="M${x},${y + 120} Q${x + 70 * d},${y} ${x + 20 * d},${y - 80} Q${x + 110 * d},${y + 10} ${x + 70 * d},${y + 120}Z" fill="#1c0a0c" stroke="#3a1418" stroke-width="3"/>`;
    // cerchio del sabba (pentacolo)
    const [px, py, pr] = [1440, 900, 110];
    s += `<circle cx="${px}" cy="${py}" r="${pr}" fill="none" stroke="#ff2e46" stroke-width="5" opacity=".85" filter="url(#bagliore)"/><circle cx="${px}" cy="${py}" r="${pr}" fill="none" stroke="#ff8a8a" stroke-width="2"/>`;
    let stella = ""; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; stella += `${i ? "L" : "M"}${f(px + Math.cos(a) * pr)},${f(py + Math.sin(a) * pr)} `; }
    s += `<path d="${stella}Z" fill="none" stroke="#ff2e46" stroke-width="3"/>`;
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; s += `<circle cx="${f(px + Math.cos(a) * (pr + 24))}" cy="${f(py + Math.sin(a) * (pr + 24))}" r="7" fill="#ffd36b" filter="url(#bagliore)"/>`; }
    // abisso: vortice scuro
    for (let k = 0; k < 7; k++) s += `<ellipse cx="1640" cy="480" rx="${170 - k * 22}" ry="${80 - k * 10}" fill="none" stroke="${k % 2 ? "#3a0a3a" : "#5a1a4a"}" stroke-width="10" opacity="${(.4 + k * .08).toFixed(2)}"/>`;
    s += `<ellipse cx="1640" cy="480" rx="30" ry="14" fill="#000"/>`;
    // valle delle ossa e cimitero
    for (let k = 0; k < 16; k++) { const x = 160 + r() * 320, y = 260 + r() * 200; s += `<path d="M${f(x)},${f(y)} h${f(26 + r() * 16)}" stroke="#d8cfc0" stroke-width="5" stroke-linecap="round" opacity=".7"/>`; }
    for (let k = 0; k < 10; k++) { const x = 520 + r() * 180, y = 480 + r() * 120; s += `<path d="M${f(x)},${f(y)} v-26 a10,10 0 0 1 20,0 v26Z" fill="#3a3034" stroke="#5a4a50" stroke-width="2"/>`; }
    // porta degli inferi
    s += `<path d="M40,1200 L40,1060 Q100,980 160,1060 L160,1200Z" fill="#0a0304" stroke="#c9a13a" stroke-width="6"/><path d="M60,1190 L60,1070 Q100,1010 140,1070 L140,1190Z" fill="#ff3a1a" opacity=".35" filter="url(#bagliore)"/>`;
    // prigioni con catene
    for (let i = 0; i < 4; i++) s += `<rect x="${1600 + i * 40}" y="1060" width="30" height="80" fill="#1a0a0c" stroke="#5a5a62" stroke-width="2"/>${[0, 1, 2].map(j => `<line x1="${1606 + i * 40 + j * 9}" y1="1060" x2="${1606 + i * 40 + j * 9}" y2="1140" stroke="#7a7a82" stroke-width="2"/>`).join("")}`;
    // braci che fluttuano
    for (let k = 0; k < 60; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(2 + r() * 5)}" fill="${k % 3 ? "#ff5a1f" : "#ffd36b"}" opacity=".6" filter="url(#bagliore)"/>`;
    return s;
  }
  function lavoro(r) {
    let s = `<rect width="${W}" height="${H}" fill="#cfd6d2"/>`;
    // erba e parchi
    for (let k = 0; k < 8; k++) s += `<path d="${blob(200 + r() * 1400, 200 + r() * 900, 90 + r() * 60, 60 + r() * 40, r)}" fill="#8cc06a" opacity=".8"/>`;
    // strade a griglia
    for (let x = 0; x <= W; x += 180) s += `<rect x="${x}" y="0" width="34" height="${H}" fill="#6a6e74"/><line x1="${x + 17}" y1="0" x2="${x + 17}" y2="${H}" stroke="#f4f4f4" stroke-width="2" stroke-dasharray="16 16"/>`;
    for (let y = 0; y <= H; y += 160) s += `<rect x="0" y="${y}" width="${W}" height="34" fill="#6a6e74"/><line x1="0" y1="${y + 17}" x2="${W}" y2="${y + 17}" stroke="#f4f4f4" stroke-width="2" stroke-dasharray="16 16"/>`;
    // palazzi con tetti colorati (lontano dai luoghi speciali)
    const libero = (x, y) => ![[0, 900, 300, 1200], [770, 870, 1150, 1200], [1480, 900, 1800, 1200], [1450, 80, 1800, 420], [0, 40, 420, 380], [1200, 460, 1450, 680]].some(([a, b, c, d]) => x > a && x < c && y > b && y < d);
    for (let x = 34; x < W; x += 180) for (let y = 34; y < H; y += 160) {
      if (!libero(x + 70, y + 60) || r() < .15) continue;
      const tetto = ["#e07a5a", "#5a9ae0", "#e0c05a", "#9a7ae0", "#5ac0a0", "#e05a7a"][Math.floor(r() * 6)];
      s += `<rect x="${x + 10}" y="${y + 10}" width="${f(110 + r() * 20)}" height="${f(90 + r() * 20)}" rx="6" fill="#f4f0e8" stroke="#a8a49c" stroke-width="2"/><rect x="${x + 20}" y="${y + 20}" width="${f(90 + r() * 10)}" height="${f(70 + r() * 10)}" rx="4" fill="${tetto}" opacity=".85"/>`;
    }
    // villaggio vacanze: piscina e palme
    s += `<rect x="40" y="980" width="240" height="140" rx="40" fill="#3fc0f0" stroke="#f4f4f4" stroke-width="8"/><path d="M60,1040 q30,-12 60,0 t60,0 t60,0" stroke="#bfeeff" stroke-width="3" fill="none"/>`;
    for (const [x, y] of [[30, 940], [290, 950], [160, 1160]]) s += `<line x1="${x}" y1="${y}" x2="${x + 6}" y2="${y - 50}" stroke="#7a5a2a" stroke-width="6"/>${[0, 72, 144, 216, 288].map(a => `<path d="M${x + 6},${y - 50} q${f(Math.cos(a / 57.3) * 20)},${f(Math.sin(a / 57.3) * 10 - 10)} ${f(Math.cos(a / 57.3) * 36)},${f(Math.sin(a / 57.3) * 18)}" stroke="#2fa36b" stroke-width="7" fill="none" stroke-linecap="round"/>`).join("")}`;
    // stadio
    s += `<ellipse cx="960" cy="1030" rx="190" ry="120" fill="#c8c8cc" stroke="#8a8a90" stroke-width="6"/><ellipse cx="960" cy="1030" rx="140" ry="80" fill="#3f9a4a" stroke="#f4f4f4" stroke-width="4"/><line x1="960" y1="950" x2="960" y2="1110" stroke="#f4f4f4" stroke-width="3"/><circle cx="960" cy="1030" r="22" fill="none" stroke="#f4f4f4" stroke-width="3"/>`;
    for (const [x, y] of [[790, 920], [1130, 920], [790, 1140], [1130, 1140]]) s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 60}" stroke="#5a5a62" stroke-width="5"/><rect x="${x - 14}" y="${y - 72}" width="28" height="14" fill="#fffbe0" stroke="#5a5a62" stroke-width="2"/>`;
    // borsa: palazzo con colonne
    s += `<rect x="1230" y="560" width="200" height="100" fill="#ece6d8" stroke="#8a8270" stroke-width="3"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${1245 + i * 38}" y="580" width="16" height="80" fill="#fffdf6" stroke="#b8b0a0"/>`).join("")}<path d="M1215,560 L1330,500 L1445,560Z" fill="#ece6d8" stroke="#8a8270" stroke-width="3"/>`;
    s += `<path d="M1240,640 L1290,610 L1330,630 L1380,580 L1420,600" stroke="#2fa36b" stroke-width="5" fill="none"/>`;
    // set del film: telecamera e riflettori
    s += `<rect x="1520" y="960" width="240" height="170" fill="#2a2a30" stroke="#f2c14e" stroke-width="4"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${1530 + i * 38}" y="970" width="20" height="10" fill="${i % 2 ? "#f4f4f4" : "#1a1a1a"}"/>`).join("")}`;
    for (const x of [1560, 1720]) s += `<path d="M${x},1110 L${x},1040" stroke="#5a5a62" stroke-width="5"/><path d="M${x - 16},1030 L${x + 16},1030 L${x + 26},1000 L${x - 26},1000Z" fill="#c0c0c8"/><path d="M${x},1000 L${x + (x < 1640 ? 60 : -60)},900 L${x + (x < 1640 ? 110 : -110)},930Z" fill="#fff6c0" opacity=".35"/>`;
    // teatro dell'opera con palco
    s += `<path d="M1490,380 L1490,200 Q1640,110 1790,200 L1790,380Z" fill="#7a1a2a" stroke="#c9a13a" stroke-width="5"/><rect x="1530" y="250" width="220" height="110" fill="#1a0a10"/><path d="M1530,250 q30,60 0,110 M1750,250 q-30,60 0,110" stroke="#c0283a" stroke-width="18" fill="none"/>`;
    s += `<rect x="1610" y="320" width="60" height="26" rx="4" fill="#0a0a0a"/><rect x="1614" y="324" width="52" height="6" fill="#f4f4f4"/>`;
    // montagna innevata in alto a sinistra
    s += `<path d="M20,380 L230,80 L420,380Z" fill="#8a8e96"/><path d="M160,180 L230,80 L300,180 L270,170 L230,200 L195,170Z" fill="#fafafa"/><path d="M260,380 L360,240 L460,380Z" fill="#9aa0a8"/>`;
    // giungla a destra
    for (let k = 0; k < 40; k++) s += `<circle cx="${f(1600 + r() * 200)}" cy="${f(560 + r() * 200)}" r="${f(16 + r() * 18)}" fill="${["#2f7a3a", "#3f8f4a", "#246a30"][k % 3]}"/>`;
    // laboratorio e studio di registrazione
    s += `<rect x="650" y="370" width="140" height="80" rx="6" fill="#f4f8f8" stroke="#3fd8ff" stroke-width="4"/><path d="M700,390 l0,30 l-14,24 h42 l-14,-24 v-30Z" fill="#7dff6b" opacity=".7"/>`;
    s += `<rect x="1010" y="220" width="140" height="80" rx="6" fill="#2a1a3a" stroke="#b866ff" stroke-width="4"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${1024 + i * 17}" y="${280 - (i * 37 % 40)}" width="9" height="${(i * 37 % 40) + 6}" fill="#b866ff"/>`).join("")}`;
    // scuola
    s += `<rect x="270" y="520" width="140" height="80" fill="#c0603a" stroke="#7a3a20" stroke-width="3"/><path d="M260,520 L340,480 L420,520Z" fill="#8a3a20"/><rect x="330" y="560" width="22" height="40" fill="#5a3a20"/>`;
    // alberi sparsi e auto
    for (let k = 0; k < 50; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(8 + r() * 8)}" fill="#4f9a4a" opacity=".85"/>`;
    for (let k = 0; k < 18; k++) { const v = r() < .5, x = v ? Math.floor(r() * 10) * 180 + 6 : r() * W, y = v ? r() * H : Math.floor(r() * 8) * 160 + 6; s += `<rect x="${f(x)}" y="${f(y)}" width="${v ? 14 : 26}" height="${v ? 26 : 14}" rx="4" fill="${["#ff3344", "#3f7fe0", "#f2c14e", "#f4f4f4"][k % 4]}"/>`; }
    return s;
  }

  function specchi(r) {
    let s = `<defs><radialGradient id="fondoSpecchi" cx=".5" cy=".25" r=".9"><stop offset="0" stop-color="#3a1a5a"/><stop offset=".6" stop-color="#160a26"/><stop offset="1" stop-color="#08040e"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#fondoSpecchi)"/>`;
    // frammenti di altri mondi: schegge colorate con dentro i colori delle serie
    const colori = ["#4c95ff", "#ff9a1f", "#f2c14e", "#ff2e46", "#43d39e", "#d4145a", "#a6e22e"];
    for (let k = 0; k < 34; k++) {
      const cx = r() * W, cy = r() * H, R = 60 + r() * 110, n = 3 + Math.floor(r() * 3), a0 = r() * 6.28;
      let d = ""; for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.28 + (r() - .5) * .6, rr = R * (.6 + r() * .5); d += `${i ? "L" : "M"}${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr * .7)} `; }
      const c = colori[k % colori.length];
      s += `<path d="${d}Z" fill="${c}" opacity=".13" stroke="#e8d8ff" stroke-width="2" stroke-opacity=".35"/>`;
    }
    // crepe dello specchio che partono dal centro in alto
    for (let k = 0; k < 18; k++) { let x = 900, y = 260, d = `M${x},${y}`; const a = r() * 6.28; for (let i = 0; i < 6; i++) { x += Math.cos(a + (r() - .5) * .8) * 90; y += Math.sin(a + (r() - .5) * .8) * 70; d += ` L${f(x)},${f(y)}`; } s += `<path d="${d}" stroke="#e8d8ff" stroke-width="${f(1 + r() * 2)}" fill="none" opacity=".45"/>`; }
    // il cuore del multiverso: anelli
    for (let k = 0; k < 6; k++) s += `<ellipse cx="900" cy="240" rx="${150 - k * 20}" ry="${80 - k * 10}" fill="none" stroke="${colori[k]}" stroke-width="5" opacity=".55" filter="url(#bagliore)"/>`;
    s += `<circle cx="900" cy="240" r="26" fill="#fff" opacity=".9" filter="url(#bagliore)"/>`;
    // lo specchio da cui entri
    s += `<rect x="60" y="1010" width="120" height="170" rx="60" fill="#c8b8ff" opacity=".35" stroke="#f2c14e" stroke-width="8"/><rect x="80" y="1030" width="80" height="130" rx="40" fill="#fff" opacity=".25"/>`;
    for (let k = 0; k < 90; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(1 + r() * 3)}" fill="#e8d8ff" opacity="${(.3 + r() * .6).toFixed(2)}"/>`;
    return s;
  }
  function treno(r) {
    // fasce di mondi diversi uno dopo l'altro (città, deserto, bosco, neve, mare, inferi), con la ferrovia che li attraversa
    const mondi = [["#2a3240", "#3a4456"], ["#c9a86a", "#b08f52"], ["#1f5a34", "#2a6a40"], ["#d8e4ee", "#bfd0de"], ["#1a4a7a", "#235a90"], ["#3a0c10", "#521418"]];
    let s = "";
    mondi.forEach(([a, b], i) => { const x0 = i * W / mondi.length; s += `<rect x="${f(x0)}" y="0" width="${f(W / mondi.length + 2)}" height="${H}" fill="${a}"/>`;
      for (let k = 0; k < 12; k++) s += `<path d="${blob(x0 + r() * W / mondi.length, r() * H, 40 + r() * 60, 25 + r() * 40, r)}" fill="${b}" opacity=".8"/>`; });
    // sfumature tra un mondo e l'altro (i portali)
    for (let i = 1; i < mondi.length; i++) { const x = i * W / mondi.length; s += `<rect x="${f(x - 30)}" y="0" width="60" height="${H}" fill="#fff" opacity=".1"/><line x1="${f(x)}" y1="0" x2="${f(x)}" y2="${H}" stroke="#c38bff" stroke-width="4" stroke-dasharray="10 14" opacity=".6"/>`; }
    // pioggia
    for (let k = 0; k < 160; k++) { const x = r() * W, y = r() * H; s += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x - 8)}" y2="${f(y + 26)}" stroke="#bfe0ff" stroke-width="1.5" opacity=".35"/>`; }
    // ferrovia (traversine + binari) lungo il percorso
    const via = curva([[-40, 950], [150, 900], [450, 760], [760, 860], [1060, 700], [1360, 820], [1640, 560], [1860, 520]]);
    s += `<path d="${via}" stroke="#5a4030" stroke-width="44" fill="none" stroke-dasharray="8 16"/><path d="${via}" stroke="#c0c0c8" stroke-width="22" fill="none"/><path d="${via}" stroke="#4a4a52" stroke-width="14" fill="none"/>`;
    // il treno in cima a destra
    for (let k = 0; k < 4; k++) s += `<rect x="${1560 + k * 56}" y="${470 - k * 6}" width="50" height="34" rx="6" fill="${k ? "#c0392b" : "#2a2a30"}" stroke="#111" stroke-width="3"/>`;
    s += `<rect x="1556" y="440" width="18" height="26" fill="#2a2a30"/><circle cx="1565" cy="420" r="16" fill="#ddd" opacity=".6"/><circle cx="1550" cy="395" r="22" fill="#ddd" opacity=".4"/>`;
    return s;
  }
  function torre(r) {
    let s = `<defs><radialGradient id="fondoTorre" cx=".5" cy=".55" r=".8"><stop offset="0" stop-color="#3a2a10"/><stop offset=".7" stop-color="#1a1206"/><stop offset="1" stop-color="#0a0703"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#fondoTorre)"/>`;
    // la torre vista dall'alto: piani concentrici che salgono verso il centro
    for (let k = 0; k < 7; k++) s += `<ellipse cx="900" cy="640" rx="${780 - k * 105}" ry="${520 - k * 70}" fill="${k % 2 ? "#3a2c14" : "#2c2210"}" stroke="#c9a13a" stroke-width="3" opacity=".95"/>`;
    // quadrante d'orologio al centro
    s += `<circle cx="900" cy="640" r="120" fill="#efe3c0" stroke="#c9a13a" stroke-width="10"/>`;
    for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; s += `<line x1="${f(900 + Math.cos(a) * 95)}" y1="${f(640 + Math.sin(a) * 95)}" x2="${f(900 + Math.cos(a) * 112)}" y2="${f(640 + Math.sin(a) * 112)}" stroke="#3a2c14" stroke-width="${k % 3 ? 3 : 7}"/>`; }
    s += `<line x1="900" y1="640" x2="900" y2="560" stroke="#3a2c14" stroke-width="9" stroke-linecap="round"/><line x1="900" y1="640" x2="960" y2="660" stroke="#3a2c14" stroke-width="6" stroke-linecap="round"/><circle cx="900" cy="640" r="10" fill="#c9a13a"/>`;
    // ingranaggi
    const ingr = (cx, cy, R, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * 6.28, rr = i % 2 ? R : R * .82; d += `${i ? "L" : "M"}${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)} `; } return `<path d="${d}Z" fill="#6a5020" stroke="#c9a13a" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${f(R * .3)}" fill="#1a1206"/>`; };
    s += ingr(1650, 1080, 90, 12) + ingr(1530, 1150, 50, 9) + ingr(130, 140, 70, 10) + ingr(230, 230, 40, 8);
    // giardino sospeso (verde) e sabbia del tempo
    for (let k = 0; k < 20; k++) s += `<circle cx="${f(1450 + r() * 160)}" cy="${f(460 + r() * 120)}" r="${f(12 + r() * 16)}" fill="${["#3f8f4a", "#2f7a3a", "#7dffb0"][k % 3]}" opacity=".85"/>`;
    for (let k = 0; k < 80; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${f(1 + r() * 2.5)}" fill="#f2c14e" opacity="${(.2 + r() * .5).toFixed(2)}"/>`;
    return s;
  }
  function springfield(r) {
    let s = `<rect width="${W}" height="${H}" fill="#9bd36a"/>`;
    // cielo azzurro con nuvole in alto (la collina con la scritta Springfield)
    s += `<path d="M0,0 H${W} V150 Q1300,210 900,170 T0,190Z" fill="#8fd3ff"/>`;
    for (let k = 0; k < 7; k++) { const x = 100 + k * 250 + r() * 60, y = 40 + r() * 50; s += `<g fill="#ffffff" opacity=".95"><ellipse cx="${f(x)}" cy="${f(y)}" rx="60" ry="22"/><ellipse cx="${f(x + 40)}" cy="${f(y - 14)}" rx="40" ry="22"/><ellipse cx="${f(x - 35)}" cy="${f(y - 8)}" rx="34" ry="18"/></g>`; }
    s += `<path d="M1050,330 Q1260,150 1480,330Z" fill="#6fb24a"/><text x="1265" y="300" text-anchor="middle" font-size="40" font-weight="900" fill="#ffffff" stroke="#2a5a1a" stroke-width="2" font-family="Arial Black, sans-serif" transform="rotate(-6 1265 300)">SPRINGFIELD</text>`;
    // fiume e laghetto
    s += `<path d="M0,700 C200,640 300,760 480,720 S760,640 900,700" stroke="#4fb6ff" stroke-width="40" fill="none" opacity=".85"/>`;
    // strade
    const strada = d => `<path d="${d}" stroke="#7b7f86" stroke-width="44" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#f4e27a" stroke-width="3" stroke-dasharray="18 18" fill="none"/>`;
    s += strada("M0,1060 H1800") + strada("M0,860 C400,830 800,900 1800,840") + strada("M460,1200 V430") + strada("M1000,1200 V420 H1800") + strada("M1350,1200 V420");
    // casette di Springfield con tetti colorati (lontane dai luoghi speciali)
    const libero = (x, y) => ![[0, 960, 300, 1200], [300, 860, 560, 1050], [620, 1050, 880, 1200], [950, 480, 1200, 720], [1500, 900, 1800, 1200], [1580, 120, 1800, 420], [100, 180, 460, 460], [700, 170, 960, 340], [480, 470, 720, 660], [1040, 150, 1500, 350]].some(([a, b, c, d]) => x > a && x < c && y > b && y < d);
    for (let k = 0; k < 70; k++) {
      const x = 60 + r() * 1680, y = 380 + r() * 760; if (!libero(x, y)) continue;
      const tetto = ["#e05a5a", "#5a8ae0", "#e0a35a", "#9a6ae0", "#5ab08a", "#e05aa0"][Math.floor(r() * 6)];
      s += `<rect x="${f(x)}" y="${f(y)}" width="44" height="34" fill="#fff1c0" stroke="#7a6a40" stroke-width="2"/><path d="M${f(x - 6)},${f(y)} L${f(x + 22)},${f(y - 22)} L${f(x + 50)},${f(y)}Z" fill="${tetto}" stroke="#6a4a3a" stroke-width="2"/><rect x="${f(x + 17)}" y="${f(y + 16)}" width="10" height="18" fill="#8a5a3a"/>`;
    }
    // alberi
    for (let k = 0; k < 45; k++) { const x = r() * W, y = 360 + r() * 840; if (!libero(x, y)) continue; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(12 + r() * 10)}" fill="${["#4a9a3a", "#3a8a30", "#5aaa40"][k % 3]}" stroke="#2a6a20" stroke-width="2"/>`; }
    // centrale nucleare: due torri di raffreddamento con il fumo
    for (const x of [200, 330]) s += `<path d="M${x - 50},440 Q${x - 30},350 ${x - 40},250 H${x + 40} Q${x + 30},350 ${x + 50},440Z" fill="#c8cdd2" stroke="#7a8088" stroke-width="4"/><ellipse cx="${x}" cy="250" rx="40" ry="10" fill="#9aa0a8"/>${[0, 1, 2].map(i => `<circle cx="${x + i * 14 - 10}" cy="${215 - i * 30}" r="${22 + i * 8}" fill="#eef2f4" opacity="${.75 - i * .2}"/>`).join("")}`;
    s += `<rect x="130" y="400" width="300" height="50" fill="#a8aeb4" stroke="#6a7078" stroke-width="3"/><circle cx="280" cy="425" r="16" fill="#ffd90f" stroke="#2a2a2a" stroke-width="3"/><path d="M280,425 l0,-14 a14,14 0 0 1 12,7Z M280,425 l12,7 a14,14 0 0 1 -24,0Z" fill="#2a2a2a"/>`;
    // barile verde fosforescente nel fiume
    s += `<ellipse cx="600" cy="690" rx="16" ry="10" fill="#7dff3a" stroke="#3a8a10" stroke-width="3"/>`;
    // scuola elementare
    s += `<rect x="20" y="1000" width="250" height="110" fill="#e8a060" stroke="#7a4a20" stroke-width="4"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${38 + i * 46}" y="1020" width="30" height="26" fill="#bfe8ff" stroke="#7a4a20" stroke-width="2"/>`).join("")}<rect x="130" y="1070" width="30" height="40" fill="#7a4a20"/><line x1="250" y1="1000" x2="250" y2="940" stroke="#5a5a5a" stroke-width="4"/><path d="M250,940 h30 v18 h-30Z" fill="#e04a4a"/>`;
    // taverna di Moe
    s += `<rect x="330" y="880" width="170" height="110" fill="#5a4030" stroke="#2a1a10" stroke-width="4"/><rect x="345" y="860" width="140" height="30" rx="4" fill="#1a1a1a"/><text x="415" y="882" text-anchor="middle" font-size="22" font-weight="900" fill="#ff5a5a" font-family="Arial Black, sans-serif">MOE'S</text>${[0, 1, 2].map(i => `<path d="M${352 + i * 46},910 l15,-15 l15,15 l-15,15Z" fill="${["#3aa04a", "#e04a4a", "#3a6ae0"][i]}"/>`).join("")}<rect x="400" y="945" width="30" height="45" fill="#2a1a10"/>`;
    // chiesa
    s += `<rect x="640" y="1080" width="180" height="100" fill="#f4ece0" stroke="#8a7a6a" stroke-width="4"/><path d="M630,1080 L730,1010 L830,1080Z" fill="#c05a3a" stroke="#6a3020" stroke-width="3"/><rect x="710" y="950" width="40" height="70" fill="#f4ece0" stroke="#8a7a6a" stroke-width="3"/><path d="M705,950 L730,910 L755,950Z" fill="#c05a3a"/><path d="M730,880 v26 M720,890 h20" stroke="#5a4a3a" stroke-width="5"/>`;
    // studio di Krusty: tendone con la faccia del clown
    s += `<path d="M960,690 Q1075,520 1190,690Z" fill="#e04a8a" stroke="#7a1a4a" stroke-width="4"/>${[0, 1, 2, 3].map(i => `<path d="M${985 + i * 50},690 Q${1010 + i * 50},610 ${1035 + i * 50},690" fill="${i % 2 ? "#ffd90f" : "#3ac0e0"}" opacity=".85"/>`).join("")}<circle cx="1075" cy="620" r="26" fill="#fff1c0" stroke="#2a2a2a" stroke-width="2"/><circle cx="1075" cy="626" r="7" fill="#e02a2a"/><path d="M1050,610 q-14,-10 -6,-22 M1100,610 q14,-10 6,-22" stroke="#3ac06a" stroke-width="9" fill="none"/>`;
    // stazione di polizia
    s += `<rect x="1530" y="960" width="230" height="120" fill="#5a7ab0" stroke="#2a3a60" stroke-width="4"/><rect x="1575" y="935" width="140" height="30" fill="#2a3a60"/><text x="1645" y="957" text-anchor="middle" font-size="18" font-weight="900" fill="#ffffff" font-family="Arial Black, sans-serif">POLICE</text><rect x="1630" y="1030" width="30" height="50" fill="#2a3a60"/><rect x="1560" y="1110" width="70" height="30" rx="8" fill="#ffffff" stroke="#2a2a2a" stroke-width="2"/><rect x="1580" y="1104" width="30" height="8" fill="#e02a2a"/>`;
    // casa dei Simpson: rosa con il tetto marrone, garage e prato
    s += `<rect x="1600" y="230" width="190" height="120" fill="#f4a6c0" stroke="#8a4a6a" stroke-width="4"/><path d="M1590,230 L1695,160 L1800,230Z" fill="#8a5a3a" stroke="#4a2a1a" stroke-width="3"/><rect x="1640" y="260" width="34" height="30" fill="#bfe8ff" stroke="#8a4a6a" stroke-width="2"/><rect x="1720" y="260" width="34" height="30" fill="#bfe8ff" stroke="#8a4a6a" stroke-width="2"/><rect x="1680" y="300" width="30" height="50" fill="#8a5a3a"/><rect x="1580" y="300" width="20" height="50" fill="#e8d8b0"/>`;
    // Kwik-E-Mart e il ciambellone gigante di Lard Lad
    s += `<rect x="730" y="190" width="200" height="90" fill="#e8f0e0" stroke="#3a7a5a" stroke-width="4"/><rect x="730" y="190" width="200" height="22" fill="#3a9a6a"/><path d="M730,212 h200" stroke="#e04a4a" stroke-width="6"/>`;
    s += `<rect x="540" y="560" width="130" height="80" fill="#f4e0c0" stroke="#8a6a40" stroke-width="3"/><circle cx="605" cy="520" r="44" fill="#e8a060" stroke="#8a5a20" stroke-width="4"/><circle cx="605" cy="520" r="30" fill="#ff8ad0"/><circle cx="605" cy="520" r="14" fill="#9bd36a" stroke="#8a5a20" stroke-width="3"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${f(605 + Math.cos(i) * 20)}" y="${f(520 + Math.sin(i * 1.7) * 20)}" width="7" height="3" fill="${["#ffd90f", "#3ac0e0", "#ffffff", "#e04a4a"][i % 4]}" transform="rotate(${i * 40} ${f(605 + Math.cos(i) * 20)} ${f(520 + Math.sin(i * 1.7) * 20)})"/>`).join("")}`;
    // ciambelle sparse
    for (let k = 0; k < 10; k++) { const x = 80 + r() * 1640, y = 400 + r() * 760; if (!libero(x, y)) continue; s += `<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="#ff8ad0" stroke="#c08040" stroke-width="4"/><circle cx="${f(x)}" cy="${f(y)}" r="3" fill="#9bd36a"/>`; }
    return s;
  }
  function barbacasa(r) {
    let s = `<rect width="${W}" height="${H}" fill="#a8e07a"/>`;
    // cielo e nuvolette tonde
    s += `<path d="M0,0 H${W} V120 Q900,190 0,140Z" fill="#9fdcff"/>`;
    for (let k = 0; k < 8; k++) { const x = 80 + k * 230 + r() * 50, y = 40 + r() * 40; s += `<g fill="#ffffff"><circle cx="${f(x)}" cy="${f(y)}" r="22"/><circle cx="${f(x + 26)}" cy="${f(y - 8)}" r="26"/><circle cx="${f(x + 54)}" cy="${f(y)}" r="20"/></g>`; }
    // colline morbide
    for (let k = 0; k < 6; k++) s += `<path d="${blob(150 + r() * 1500, 300 + r() * 800, 160 + r() * 90, 80 + r() * 50, r, 18, .12)}" fill="${["#96d46a", "#b4e88a", "#8acb5e"][k % 3]}" opacity=".85"/>`;
    // sentierini di sassolini
    for (let k = 0; k < 140; k++) s += `<circle cx="${f(r() * W)}" cy="${f(260 + r() * 940)}" r="${f(3 + r() * 4)}" fill="#e8dcc0" opacity=".7"/>`;
    // fiori ovunque
    const libero = (x, y) => ![[0, 980, 320, 1200], [280, 520, 520, 700], [640, 1040, 900, 1200], [940, 460, 1230, 660], [1540, 900, 1800, 1200], [1080, 80, 1540, 330], [140, 200, 420, 420], [1560, 330, 1780, 520], [700, 220, 940, 380], [1360, 560, 1540, 720]].some(([a, b, c, d]) => x > a && x < c && y > b && y < d);
    for (let k = 0; k < 160; k++) { const x = r() * W, y = 230 + r() * 970; if (!libero(x, y)) continue; const c = ["#ff8fc8", "#ffd90f", "#ffffff", "#c38bff", "#ff6a6a"][k % 5];
      s += `<g>${[0, 72, 144, 216, 288].map(a => `<circle cx="${f(x + Math.cos(a / 57.3) * 6)}" cy="${f(y + Math.sin(a / 57.3) * 6)}" r="5" fill="${c}"/>`).join("")}<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="#ffb84a"/></g>`; }
    // alberi tondi
    for (let k = 0; k < 30; k++) { const x = r() * W, y = 300 + r() * 900; if (!libero(x, y)) continue; s += `<rect x="${f(x - 4)}" y="${f(y)}" width="8" height="24" fill="#8a5a3a"/><circle cx="${f(x)}" cy="${f(y - 8)}" r="${f(20 + r() * 8)}" fill="${["#5ab04a", "#4a9a3a", "#6ac05a"][k % 3]}"/>`; }
    // la casa rosa dei Barbapapà: forme a bolla, finestre tonde, comignoli storti
    s += `<path d="M1100,330 Q1090,180 1180,150 Q1220,60 1300,110 Q1380,50 1430,140 Q1520,160 1510,330Z" fill="#ff9ccc" stroke="#d0609a" stroke-width="6"/>`;
    s += `<path d="M1200,150 q-10,-60 10,-80 q20,10 14,80Z M1400,130 q0,-50 20,-70 q18,14 6,72Z" fill="#ff9ccc" stroke="#d0609a" stroke-width="5"/>`;
    for (const [x, y, rr] of [[1180, 230, 22], [1260, 200, 26], [1350, 190, 22], [1430, 240, 24], [1300, 280, 18]]) s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#bfe8ff" stroke="#d0609a" stroke-width="4"/><path d="M${x - rr},${y} h${rr * 2} M${x},${y - rr} v${rr * 2}" stroke="#d0609a" stroke-width="2"/>`;
    s += `<path d="M1280,330 v-46 a24,24 0 0 1 48,0 v46Z" fill="#c0508a"/>`;
    // laghetto
    s += `<path d="${blob(270, 330, 120, 70, r, 16, .15)}" fill="#6ac8ff" stroke="#ffffff" stroke-width="6"/>`;
    for (let k = 0; k < 4; k++) s += `<ellipse cx="${f(200 + k * 45)}" cy="${f(320 + (k % 2) * 25)}" rx="14" ry="7" fill="#5ab04a"/>`;
    // laboratorio blu (cupola), biblioteca, campo sportivo, sala della musica, atelier, zoo
    s += `<path d="M300,680 v-60 a100,70 0 0 1 200,0 v60Z" fill="#4fa8ff" stroke="#2a5a9a" stroke-width="5"/><circle cx="400" cy="610" r="18" fill="#bfe8ff" stroke="#2a5a9a" stroke-width="3"/><path d="M460,560 q20,-40 0,-70" stroke="#7dffb0" stroke-width="8" fill="none"/>`;
    s += `<path d="M660,1180 v-90 q110,-70 220,0 v90Z" fill="#ffb84a" stroke="#a0602a" stroke-width="5"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${680 + i * 38}" y="1110" width="16" height="50" rx="3" fill="${["#e04a4a", "#3a6ae0", "#5ac05a", "#c38bff", "#ffd90f"][i]}"/>`).join("")}`;
    s += `<rect x="950" y="480" width="270" height="170" rx="80" fill="#5ab04a" stroke="#ffffff" stroke-width="6"/><line x1="1085" y1="480" x2="1085" y2="650" stroke="#ffffff" stroke-width="4"/><circle cx="1085" cy="565" r="30" fill="none" stroke="#ffffff" stroke-width="4"/>`;
    s += `<path d="M1560,1180 v-120 q120,-90 240,0 v120Z" fill="#c38bff" stroke="#7a4ab0" stroke-width="5"/>${[0, 1, 2, 3].map(i => `<text x="${1600 + i * 50}" y="${1110 - (i % 2) * 20}" font-size="30" fill="#ffffff">${["♪", "♫", "♪", "♬"][i]}</text>`).join("")}`;
    s += `<rect x="720" y="250" width="200" height="110" rx="40" fill="#2a2a3a" stroke="#ffd90f" stroke-width="4"/>${[0xe04a4a, 0x3a6ae0, 0xffd90f, 0x5ac05a].map((c, i) => `<circle cx="${760 + i * 40}" cy="310" r="14" fill="#${c.toString(16).padStart(6, "0")}"/>`).join("")}`;
    s += `<rect x="1570" y="340" width="200" height="160" rx="30" fill="#e8d8a0" stroke="#a08a4a" stroke-width="5" stroke-dasharray="10 8"/><text x="1610" y="440" font-size="40">🐘</text><text x="1680" y="470" font-size="34">🦒</text>`;
    // prato degli ombrelli
    for (const [x, y, c] of [[1390, 640, "#5ac05a"], [1450, 600, "#ff8fc8"], [1500, 660, "#4fa8ff"]]) s += `<path d="M${x - 30},${y} a30,22 0 0 1 60,0Z" fill="${c}"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 34}" stroke="#5a4a3a" stroke-width="4"/>`;
    // gocce di pioggia leggere
    for (let k = 0; k < 60; k++) { const x = r() * W, y = 150 + r() * 1050; s += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x - 4)}" y2="${f(y + 14)}" stroke="#4fa8ff" stroke-width="2" opacity=".35"/>`; }
    return s;
  }
  function galassia(r) {
    let s = `<rect width="${W}" height="${H}" fill="#070a1c"/>`;
    // nebulose
    for (const [x, y, c] of [[400, 500, "#3a1a6a"], [1300, 800, "#0a3a6a"], [900, 300, "#5a1a4a"], [1500, 300, "#1a2a6a"]]) s += `<ellipse cx="${x}" cy="${y}" rx="${f(300 + r() * 150)}" ry="${f(180 + r() * 100)}" fill="${c}" opacity=".45" filter="url(#sfoca)"/>`;
    // stelle
    for (let k = 0; k < 420; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * H)}" r="${(r() * 1.8 + .4).toFixed(1)}" fill="#ffffff" opacity="${(.3 + r() * .7).toFixed(2)}"/>`;
    for (let k = 0; k < 12; k++) { const x = r() * W, y = r() * H; s += `<path d="M${f(x)},${f(y - 8)} L${f(x + 2)},${f(y - 2)} L${f(x + 8)},${f(y)} L${f(x + 2)},${f(y + 2)} L${f(x)},${f(y + 8)} L${f(x - 2)},${f(y + 2)} L${f(x - 8)},${f(y)} L${f(x - 2)},${f(y - 2)}Z" fill="#fff6d0"/>`; }
    // Tatooine: pianeta di sabbia con due soli
    s += `<circle cx="150" cy="1080" r="120" fill="#d8b07a"/><path d="M40,1060 q110,-30 220,0 M50,1110 q100,-20 200,10" stroke="#b08a50" stroke-width="10" fill="none" opacity=".6"/><circle cx="300" cy="940" r="26" fill="#ffd04a"/><circle cx="350" cy="960" r="18" fill="#ff9a3a"/>`;
    // cantina: stazione/avamposto
    s += `<circle cx="440" cy="900" r="70" fill="#a89070"/><rect x="400" y="880" width="80" height="40" rx="20" fill="#5a4a3a"/>`;
    // Coruscant con il Senato
    s += `<circle cx="780" cy="1100" r="110" fill="#5a6a8a"/>${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${700 + i * 22}" y="${1020 - (i * 37 % 50)}" width="12" height="${60 + (i * 37 % 50)}" fill="#ffd04a" opacity=".6"/>`).join("")}<path d="M740,1080 a40,20 0 0 1 80,0Z" fill="#c0c8d8"/>`;
    // base ribelle su una luna verde
    s += `<circle cx="1080" cy="560" r="80" fill="#3a8a4a"/><circle cx="1050" cy="540" r="20" fill="#2a6a3a"/><circle cx="1110" cy="590" r="14" fill="#2a6a3a"/>`;
    // Mustafar: pianeta di lava
    s += `<circle cx="1660" cy="1080" r="120" fill="#3a1a10"/>${[0, 1, 2, 3].map(i => `<path d="M${1580 + i * 40},${1000 + i * 20} q30,40 10,90" stroke="#ff6a2a" stroke-width="8" fill="none"/>`).join("")}`;
    // Morte Nera
    s += `<circle cx="1380" cy="190" r="140" fill="#8a909a" stroke="#5a606a" stroke-width="4"/><path d="M1240,190 h280" stroke="#5a606a" stroke-width="5"/><circle cx="1330" cy="140" r="34" fill="#6a707a" stroke="#4a505a" stroke-width="4"/><circle cx="1330" cy="140" r="10" fill="#3a404a"/>`;
    for (let k = 0; k < 30; k++) s += `<rect x="${f(1260 + r() * 240)}" y="${f(100 + r() * 180)}" width="4" height="2" fill="#ffd04a" opacity=".7"/>`;
    // pianeta ghiacciato
    s += `<circle cx="300" cy="300" r="90" fill="#dfeef8"/><path d="M230,280 q70,-20 140,0" stroke="#a8c8e0" stroke-width="10" fill="none"/>`;
    // asteroidi
    for (let k = 0; k < 18; k++) s += `<path d="${blob(f(700 + r() * 260), f(220 + r() * 170), 10 + r() * 16, 8 + r() * 12, r, 8, .3)}" fill="#6a5a50"/>`;
    // flotta imperiale: triangoli grigi
    for (const [x, y, k] of [[1640, 540, 1], [1720, 600, .7], [1600, 620, .6]]) s += `<path d="M${x},${y} l${f(-90 * k)},${f(30 * k)} l${f(90 * k)},${f(30 * k)}Z" fill="#b0b8c4" stroke="#6a707a" stroke-width="2"/>`;
    // tempio Jedi
    s += `<circle cx="520" cy="560" r="60" fill="#7a6a5a"/><path d="M480,560 h80 l-10,-50 h-60Z" fill="#d8c8a8"/>${[0, 1, 2, 3].map(i => `<rect x="${488 + i * 18}" y="470" width="6" height="40" fill="#d8c8a8"/>`).join("")}`;
    // un caccia ala X e un caccia TIE in volo
    s += `<g transform="translate(1000 900) rotate(-20)"><rect x="-30" y="-4" width="60" height="8" fill="#e0e0e0"/><path d="M-10,-4 l-20,-22 h8 l18,22Z M-10,4 l-20,22 h8 l18,-22Z" fill="#c0c0c0"/><circle cx="30" cy="0" r="3" fill="#ff4a4a"/></g>`;
    s += `<g transform="translate(1180 300)"><circle r="9" fill="#5a606a"/><rect x="-22" y="-20" width="6" height="40" fill="#3a404a"/><rect x="16" y="-20" width="6" height="40" fill="#3a404a"/><line x1="-16" y1="0" x2="16" y2="0" stroke="#5a606a" stroke-width="4"/></g>`;
    return s;
  }
  function elementi(r) {
    // un mondo diviso tra gli elementi: foresta, lago, ghiacci, palude, vulcano e il trono sospeso in cielo
    let s = `<defs><linearGradient id="cieloEl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2a4a"/><stop offset=".45" stop-color="#2a4a5a"/><stop offset="1" stop-color="#1c3a2a"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#cieloEl)"/>`;
    // aurora in cielo
    for (const [y, c] of [[120, "#3fe0c0"], [170, "#7d5aff"], [220, "#3fd8ff"]]) s += `<path d="M0,${y} q450,-90 900,0 t900,0" stroke="${c}" stroke-width="40" fill="none" opacity=".18" filter="url(#sfoca)"/>`;
    for (let k = 0; k < 140; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * 420)}" r="${(r() * 1.6 + .3).toFixed(1)}" fill="#ffffff" opacity="${(.2 + r() * .6).toFixed(2)}"/>`;
    // vette di ghiaccio (in alto a sinistra)
    s += `<path d="M0,640 L120,330 L210,470 L320,200 L440,450 L540,300 L700,640Z" fill="#b8d8ec"/><path d="M120,330 L160,420 L140,430 Z M320,200 L370,330 L300,320Z M540,300 L580,380 L520,370Z" fill="#ffffff"/>`;
    s += `<path d="M0,640 L700,640 L700,700 L0,700Z" fill="#dff0fa"/>`;
    for (let k = 0; k < 40; k++) { const x = r() * 680, y = 560 + r() * 120, h = 14 + r() * 30; s += `<path d="M${f(x)},${f(y)} l${f(6 + r() * 6)},${f(-h)} l${f(6 + r() * 6)},${f(h)}Z" fill="#9fd8ff" opacity=".8"/>`; }
    // miniera di cristalli
    for (let k = 0; k < 16; k++) { const x = 480 + r() * 160, y = 600 + r() * 60, h = 30 + r() * 50; s += `<path d="M${f(x)},${f(y)} l${f(9 + r() * 8)},${f(-h)} l${f(9 + r() * 8)},${f(h)}Z" fill="${["#ff8fd8", "#9fe8ff", "#c38bff"][k % 3]}" opacity=".85"/>`; }
    // prato e foresta in fiore (in basso a sinistra)
    s += `<path d="M0,700 L760,700 L820,1200 L0,1200Z" fill="#2f6a34"/>`;
    for (let k = 0; k < 70; k++) { const x = r() * 640, y = 760 + r() * 420, rr = 18 + r() * 26; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${["#245a2a", "#3a7a3a", "#2a6a30"][k % 3]}"/>`; }
    for (let k = 0; k < 90; k++) s += `<circle cx="${f(r() * 680)}" cy="${f(740 + r() * 450)}" r="${f(3 + r() * 4)}" fill="${["#ff8fd8", "#ffd04a", "#ffffff"][k % 3]}"/>`;
    // lago in tempesta (in basso al centro)
    s += `<path d="${blob(660, 1080, 190, 110, r, 18, .15)}" fill="#1a5a9a"/>`;
    for (let k = 0; k < 10; k++) s += `<path d="M${f(520 + r() * 260)},${f(1020 + r() * 120)} q20,-14 40,0 t40,0" stroke="#9fd8ff" stroke-width="4" fill="none" opacity=".7"/>`;
    // palude del veleno (al centro)
    s += `<path d="M760,700 L1180,700 L1240,1200 L820,1200Z" fill="#26341e"/>`;
    for (let k = 0; k < 14; k++) s += `<path d="${blob(820 + r() * 360, 800 + r() * 360, 30 + r() * 40, 16 + r() * 18, r, 12, .3)}" fill="#4a7a1a" opacity=".75"/>`;
    for (let k = 0; k < 30; k++) s += `<circle cx="${f(820 + r() * 380)}" cy="${f(760 + r() * 420)}" r="${f(3 + r() * 6)}" fill="#7dff4a" opacity=".5" filter="url(#bagliore)"/>`;
    // bosco delle ombre
    for (let k = 0; k < 26; k++) { const x = 1080 + r() * 260, y = 520 + r() * 150; s += `<path d="M${f(x)},${f(y)} l14,-60 l14,60Z" fill="#2a1a3a"/>`; }
    s += `<circle cx="1210" cy="540" r="90" fill="#8a3aff" opacity=".18" filter="url(#sfoca)"/>`;
    // picco dei fulmini (dietro il vulcano)
    s += `<path d="M1560,700 L1700,430 L1800,560 L1800,700Z" fill="#3a4a6a"/><path d="M1700,430 L1730,490 L1690,500Z" fill="#dfe8ff"/>`;
    for (const [x, y] of [[1690, 400], [1760, 450]]) s += `<path d="M${x},${y - 120} l-18,50 h16 l-22,60 l44,-70 h-18 l14,-40Z" fill="#fff6a0"/>`;
    // vulcano e forgia di magma (in basso a destra)
    s += `<path d="M1180,700 L1800,700 L1800,1200 L1240,1200Z" fill="#2a1410"/><path d="M1380,1000 L1560,640 L1660,640 L1800,960 L1800,1000Z" fill="#3a1e16"/>`;
    s += `<ellipse cx="1610" cy="645" rx="60" ry="14" fill="#ff5a1f"/><circle cx="1610" cy="620" r="120" fill="#ff5a1f" opacity=".12" filter="url(#sfoca)"/>`;
    s += `<path d="${curva([[1600, 650], [1540, 820], [1600, 1000], [1560, 1200]])}" stroke="#ff5a1f" stroke-width="16" fill="none" opacity=".85"/>`;
    for (let k = 0; k < 30; k++) s += `<circle cx="${f(1260 + r() * 540)}" cy="${f(720 + r() * 460)}" r="${f(2 + r() * 4)}" fill="#ff9a1f" opacity=".6" filter="url(#bagliore)"/>`;
    // il trono degli elementi: isola sospesa con un cristallo
    s += `<path d="${blob(1380, 300, 230, 70, r, 18, .15)}" fill="#5a6a7a"/><path d="M1180,310 L1380,470 L1580,310Z" fill="#3a4a5a"/>`;
    s += `<path d="M1380,140 L1430,250 L1380,320 L1330,250Z" fill="#3fe0c0" opacity=".9"/><circle cx="1380" cy="240" r="140" fill="#3fe0c0" opacity=".16" filter="url(#sfoca)"/>`;
    for (const [a, c] of [[0, "#ff5a1f"], [1.57, "#3fd8ff"], [3.14, "#7dff4a"], [4.71, "#fff1bd"]]) s += `<circle cx="${f(1380 + Math.cos(a) * 170)}" cy="${f(270 + Math.sin(a) * 50)}" r="16" fill="${c}" filter="url(#bagliore)"/>`;
    // grotta dell'eco: onde sonore
    for (let k = 1; k <= 4; k++) s += `<circle cx="1000" cy="420" r="${k * 26}" stroke="#c38bff" stroke-width="3" fill="none" opacity="${(.7 - k * .14).toFixed(2)}"/>`;
    return s;
  }
  function notte(r) {
    // la notte delle creature: luna piena, cimitero, laguna, laboratorio, piramide, bosco e castello sulla collina
    let s = `<defs><linearGradient id="cieloNotte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c0820"/><stop offset=".5" stop-color="#1a1236"/><stop offset="1" stop-color="#141a1a"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#cieloNotte)"/>`;
    for (let k = 0; k < 160; k++) s += `<circle cx="${f(r() * W)}" cy="${f(r() * 520)}" r="${(r() * 1.5 + .3).toFixed(1)}" fill="#ffffff" opacity="${(.2 + r() * .6).toFixed(2)}"/>`;
    // luna piena
    s += `<circle cx="820" cy="190" r="220" fill="#e8e4ff" opacity=".12" filter="url(#sfoca)"/><circle cx="820" cy="190" r="110" fill="#f2efe0"/>`;
    for (const [x, y, rr] of [[790, 160, 18], [850, 220, 12], [860, 150, 9], [780, 230, 10]]) s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#d8d2c0"/>`;
    // pipistrelli
    for (let k = 0; k < 14; k++) { const x = 500 + r() * 900, y = 80 + r() * 300, d = 8 + r() * 8; s += `<path d="M${f(x)},${f(y)} q${f(d)},${f(-d)} ${f(2 * d)},0 q${f(-d * .4)},${f(d * .3)} ${f(-d)},${f(d * .5)} q${f(-d * .6)},${f(-d * .2)} ${f(-d)},${f(-d * .5)}Z" fill="#0a0612"/>`; }
    // colline
    s += `<path d="M0,620 q300,-120 600,-40 t600,-60 t600,-80 L1800,1200 L0,1200Z" fill="#161e1c"/>`;
    s += `<path d="M0,760 q400,-80 900,-10 t900,-40 L1800,1200 L0,1200Z" fill="#1c2622"/>`;
    // castello del conte sulla collina (in alto a destra)
    s += `<path d="M1300,420 L1700,420 L1760,560 L1240,560Z" fill="#0e0c16"/>`;
    for (const [x, w, h] of [[1340, 60, 230], [1430, 90, 300], [1550, 70, 260], [1640, 50, 200]]) s += `<rect x="${x}" y="${420 - h}" width="${w}" height="${h}" fill="#151222"/><path d="M${x - 8},${420 - h} l${w / 2 + 8},-60 l${w / 2 + 8},60Z" fill="#2a1a3a"/>`;
    for (let k = 0; k < 16; k++) s += `<rect x="${f(1350 + r() * 330)}" y="${f(160 + r() * 240)}" width="8" height="12" fill="#ffcc55" opacity="${(.5 + r() * .5).toFixed(2)}"/>`;
    // cimitero (in basso a sinistra)
    for (let k = 0; k < 22; k++) { const x = 60 + r() * 420, y = 880 + r() * 260; s += k % 3 ? `<path d="M${f(x)},${f(y)} v-34 a14,14 0 0 1 28,0 v34Z" fill="#5a5a66"/>` : `<path d="M${f(x + 12)},${f(y)} v-50 M${f(x)},${f(y - 36)} h24" stroke="#6a6a76" stroke-width="7"/>`; }
    for (let k = 0; k < 10; k++) s += `<circle cx="${f(80 + r() * 400)}" cy="${f(900 + r() * 240)}" r="${f(30 + r() * 30)}" fill="#7dff8a" opacity=".06" filter="url(#sfoca)"/>`;
    // laguna nera
    s += `<path d="${blob(620, 1080, 200, 100, r, 18, .15)}" fill="#0a1e26"/>`;
    for (let k = 0; k < 9; k++) s += `<circle cx="${f(480 + r() * 280)}" cy="${f(1030 + r() * 100)}" r="10" fill="#e8f0e0" opacity=".8"/>`;
    // laboratorio con torre e fulmini
    s += `<rect x="960" y="880" width="120" height="200" fill="#2a2a34"/><rect x="1000" y="760" width="40" height="120" fill="#33333f"/><circle cx="1020" cy="755" r="14" fill="#7dff4a" filter="url(#bagliore)"/>`;
    s += `<path d="M1020,600 l-20,60 h18 l-24,70 l46,-80 h-18 l16,-50Z" fill="#c8ffb0"/>`;
    for (let k = 0; k < 4; k++) s += `<rect x="${975 + k * 26}" y="920" width="14" height="22" fill="#7dff4a" opacity=".7"/>`;
    // piramide maledetta
    s += `<path d="M1180,980 L1330,740 L1480,980Z" fill="#8a7448"/><path d="M1330,740 L1480,980 L1400,980Z" fill="#6a5634"/><rect x="1318" y="900" width="24" height="80" fill="#1a1208"/>`;
    // bosco della luna piena
    for (let k = 0; k < 40; k++) { const x = 360 + r() * 520, y = 520 + r() * 200, h = 60 + r() * 80; s += `<path d="M${f(x)},${f(y)} l${f(h * .25)},${f(-h)} l${f(h * .25)},${f(h)}Z" fill="${["#0e1a14", "#12221a", "#0a140e"][k % 3]}"/>`; }
    for (let k = 0; k < 8; k++) s += `<circle cx="${f(380 + r() * 500)}" cy="${f(560 + r() * 140)}" r="3" fill="#ffd04a"/>`;
    // torre della strega
    s += `<rect x="200" y="300" width="70" height="260" fill="#1e1430"/><path d="M180,300 L235,180 L290,300Z" fill="#3a1a5a"/><circle cx="235" cy="360" r="10" fill="#c38bff" filter="url(#bagliore)"/>`;
    // nebbiolina bassa
    for (let k = 0; k < 18; k++) s += `<ellipse cx="${f(r() * W)}" cy="${f(800 + r() * 380)}" rx="${f(120 + r() * 120)}" ry="${f(20 + r() * 20)}" fill="#cfd8e8" opacity=".035"/>`;
    return s;
  }
  function futuro(r) {
    // la città del futuro: grattacieli, insegne al neon, auto volanti e pioggia
    let s = `<defs><linearGradient id="cieloFuturo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060f"/><stop offset=".55" stop-color="#140a2a"/><stop offset="1" stop-color="#0a0a14"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#cieloFuturo)"/>`;
    s += `<circle cx="1000" cy="110" r="60" fill="#d8d8f0" opacity=".45"/><circle cx="1000" cy="110" r="150" fill="#8a7bff" opacity=".1" filter="url(#sfoca)"/>`;
    // tre file di grattacieli, dalla più lontana alla più vicina
    for (const [base, alt, col, n] of [[760, 420, "#120c22", 34], [900, 380, "#0e0a1a", 26], [1200, 300, "#08070f", 18]]) {
      for (let k = 0; k < n; k++) {
        const w = 40 + r() * 70, x = r() * (W - w), h = alt * (.4 + r() * .8);
        s += `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h + 400)}" fill="${col}"/>`;
        for (let j = 0; j < 6; j++) s += `<rect x="${f(x + 4 + r() * (w - 12))}" y="${f(base - h + 10 + r() * h)}" width="5" height="3" fill="${["#38e0ff", "#ff4fd8", "#ffd04a", "#9d7bff"][(k + j) % 4]}" opacity="${(.4 + r() * .5).toFixed(2)}"/>`;
      }
    }
    // insegne al neon
    for (let k = 0; k < 14; k++) { const x = r() * (W - 80), y = 500 + r() * 600, c = ["#38e0ff", "#ff4fd8", "#7dff4a", "#ffd04a"][k % 4]; s += `<rect x="${f(x)}" y="${f(y)}" width="${f(40 + r() * 50)}" height="${f(12 + r() * 14)}" rx="4" fill="none" stroke="${c}" stroke-width="3" filter="url(#bagliore)"/><rect x="${f(x)}" y="${f(y)}" width="${f(40 + r() * 50)}" height="${f(12 + r() * 14)}" rx="4" fill="none" stroke="${c}" stroke-width="2"/>`; }
    // il cervello centrale: torre con una sfera luminosa in cima
    s += `<path d="M1430,1200 L1460,300 L1540,300 L1570,1200Z" fill="#1a1830" stroke="#38e0ff" stroke-width="2" stroke-opacity=".5"/><circle cx="1500" cy="270" r="46" fill="#38e0ff" opacity=".9"/><circle cx="1500" cy="270" r="130" fill="#38e0ff" opacity=".18" filter="url(#sfoca)"/>`;
    for (let k = 0; k < 6; k++) s += `<path d="M1500,270 q${f(-200 + r() * 400)},${f(-60 + r() * 120)} ${f(-500 + r() * 1000)},${f(200 + r() * 500)}" stroke="#38e0ff" stroke-width="1.5" fill="none" opacity=".35"/>`;
    // auto volanti con le scie
    for (let k = 0; k < 12; k++) { const x = r() * W, y = 150 + r() * 500, v = r() > .5 ? 1 : -1; s += `<path d="M${f(x)},${f(y)} h${f(-v * (60 + r() * 80))}" stroke="${v > 0 ? "#ff4fd8" : "#38e0ff"}" stroke-width="2" opacity=".6"/><rect x="${f(x - 9)}" y="${f(y - 4)}" width="18" height="8" rx="3" fill="#c8d0e0"/>`; }
    // strada bagnata con i riflessi
    s += `<rect x="0" y="1120" width="${W}" height="80" fill="#0a0a12"/>`;
    for (let k = 0; k < 30; k++) s += `<rect x="${f(r() * W)}" y="${f(1125 + r() * 70)}" width="${f(20 + r() * 60)}" height="3" fill="${["#38e0ff", "#ff4fd8", "#ffd04a"][k % 3]}" opacity=".35"/>`;
    // pioggia
    for (let k = 0; k < 260; k++) { const x = r() * W, y = r() * H; s += `<path d="M${f(x)},${f(y)} l-6,22" stroke="#9fb8ff" stroke-width="1.2" opacity=".25"/>`; }
    return s;
  }
  function tavolo(r) {
    // il tavolo da gioco visto dall'alto: pavimento di legno, panno verde, carte, monete, coppe, spade e bastoni
    let s = `<rect width="${W}" height="${H}" fill="#3a2414"/>`;
    for (let k = 0; k < 24; k++) s += `<rect x="0" y="${k * 50}" width="${W}" height="48" fill="${["#4a2e18", "#422814", "#3e2612"][k % 3]}"/><path d="M${f(r() * W)},${k * 50} v48" stroke="#2a180a" stroke-width="3"/>`;
    // il tavolo: bordo di legno e panno verde
    s += `<ellipse cx="900" cy="640" rx="820" ry="520" fill="#5a3218"/><ellipse cx="900" cy="640" rx="790" ry="492" fill="#1f6a3a"/><ellipse cx="900" cy="640" rx="760" ry="465" fill="none" stroke="#e8b04a" stroke-width="3" opacity=".5"/>`;
    for (let k = 0; k < 80; k++) s += `<circle cx="${f(200 + r() * 1400)}" cy="${f(250 + r() * 780)}" r="${f(20 + r() * 40)}" fill="#185a30" opacity=".35"/>`;
    // carte sparse sul panno
    const semi = [["♥", "#c82a2a"], ["◆", "#e8b04a"], ["†", "#2a4a8a"], ["▮", "#6a4a2a"]];
    for (let k = 0; k < 22; k++) {
      const x = 260 + r() * 1280, y = 260 + r() * 720, ang = f(-40 + r() * 80), [sim, col] = semi[k % 4];
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${ang})"><rect x="-34" y="-50" width="68" height="100" rx="8" fill="#f4ead2" stroke="#8a6a3a" stroke-width="2"/><rect x="-26" y="-42" width="52" height="84" rx="4" fill="none" stroke="${col}" stroke-width="2" opacity=".6"/><text x="0" y="12" text-anchor="middle" font-size="34" fill="${col}">${sim}</text></g>`;
    }
    // un mazzo coperto
    for (let k = 0; k < 6; k++) s += `<rect x="${860 - k * 2}" y="${560 - k * 3}" width="80" height="116" rx="8" fill="#8a1a1a" stroke="#e8b04a" stroke-width="2"/>`;
    // pile di monete d'oro
    for (const [x, y] of [[420, 760], [1400, 480], [1250, 900], [600, 380]]) for (let k = 0; k < 5; k++) s += `<ellipse cx="${x}" cy="${y - k * 7}" rx="22" ry="9" fill="#e8b04a" stroke="#8a6a1a" stroke-width="2"/>`;
    // coppe
    for (const [x, y] of [[1500, 760], [300, 560]]) s += `<path d="M${x - 22},${y - 30} h44 q0,34 -22,40 v18 h14 v6 h-36 v-6 h14 v-18 q-22,-6 -22,-40Z" fill="#d89a2a" stroke="#6a4a0a" stroke-width="2"/>`;
    // spade e bastoni incrociati
    s += `<g transform="translate(1180 330) rotate(30)"><rect x="-4" y="-80" width="8" height="140" fill="#c8d0e0"/><rect x="-22" y="50" width="44" height="8" fill="#8a6a1a"/></g>`;
    s += `<g transform="translate(700 930) rotate(-35)"><rect x="-8" y="-90" width="16" height="170" rx="8" fill="#7a4a1a"/><circle cx="0" cy="-90" r="12" fill="#6a3a12"/></g>`;
    // lampadario sopra il tavolo
    s += `<circle cx="900" cy="640" r="380" fill="#ffe9a8" opacity=".07" filter="url(#sfoca)"/>`;
    return s;
  }
  function farwest(r) {
    // il Far West al tramonto: mese rosse all'orizzonte, la ferrovia, la città di legno, il recinto del rodeo e i cactus
    let s = `<defs><linearGradient id="cieloWest" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2a5a"/><stop offset=".5" stop-color="#e0703a"/><stop offset="1" stop-color="#f6c07a"/></linearGradient>
      <linearGradient id="terraWest" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0a464"/><stop offset="1" stop-color="#b06a34"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#terraWest)"/><rect width="${W}" height="340" fill="url(#cieloWest)"/>`;
    // sole che tramonta dietro le mese
    s += `<circle cx="1380" cy="320" r="230" fill="#ffd890" opacity=".14"/><circle cx="1380" cy="320" r="120" fill="#ffd890" opacity=".9"/>`;
    for (let k = 0; k < 6; k++) s += `<ellipse cx="${f(150 + r() * 1500)}" cy="${f(60 + r() * 160)}" rx="${f(80 + r() * 90)}" ry="${f(8 + r() * 8)}" fill="#ffb070" opacity=".35"/>`;
    for (const [x, w, h] of [[40, 300, 170], [470, 260, 130], [880, 340, 210], [1230, 130, 90], [1520, 260, 160]]) {
      s += `<path d="M${x},342 L${x + 34},${342 - h} L${x + w - 34},${342 - h} L${x + w},342Z" fill="#a8482a"/><path d="M${x + w * .62},342 L${x + w - 34},${342 - h} L${x + w},342Z" fill="#7a2e1a"/>`;
      for (let i = 1; i < 4; i++) s += `<path d="M${x + 34 * (1 - i / 4) + 6},${f(342 - h + h * i / 4)} H${f(x + w - 34 * (1 - i / 4) - 6)}" stroke="#c86a3a" stroke-width="3" opacity=".5"/>`;
    }
    s += `<rect y="336" width="${W}" height="14" fill="#c88048" opacity=".7"/>`;
    // terra screpolata e cespugli
    for (let k = 0; k < 60; k++) { const x = r() * W, y = 370 + r() * 820; s += `<path d="M${f(x)},${f(y)} l${f(10 + r() * 20)},${f(-6 + r() * 12)} l${f(10 + r() * 20)},${f(-6 + r() * 12)}" stroke="#8a4a22" stroke-width="2" fill="none" opacity=".45"/>`; }
    for (let k = 0; k < 30; k++) s += `<circle cx="${f(r() * W)}" cy="${f(380 + r() * 800)}" r="${f(8 + r() * 10)}" fill="#7a7a3a" opacity=".55"/>`;
    // la strada principale della città
    s += `<path d="${curva([[-40, 1000], [400, 960], [800, 1000], [1200, 960], [1840, 1010]])}" stroke="#c88a4e" stroke-width="130" fill="none"/>`;
    s += `<path d="${curva([[-40, 1000], [400, 960], [800, 1000], [1200, 960], [1840, 1010]])}" stroke="#a86a36" stroke-width="4" stroke-dasharray="30 40" fill="none" opacity=".5"/>`;
    // la ferrovia: traversine e due binari
    const binario = curva([[-40, 740], [600, 650], [1250, 560], [1840, 480]]);
    s += `<path d="${binario}" stroke="#5a3418" stroke-width="40" stroke-dasharray="8 20" fill="none"/><path d="${binario}" stroke="#8a8a96" stroke-width="24" fill="none"/><path d="${binario}" stroke="#c48a50" stroke-width="16" fill="none"/>`;
    // la locomotiva alla stazione
    s += `<g transform="translate(1470 522) rotate(-8)"><rect x="-90" y="-40" width="120" height="50" rx="6" fill="#2a2a30"/><rect x="20" y="-70" width="60" height="80" rx="4" fill="#3a2a2a"/><rect x="-110" y="-62" width="22" height="30" fill="#2a2a30"/><path d="M-118,-62 h38 l-6,-14 h-26Z" fill="#1a1a1e"/>
      <circle cx="-60" cy="14" r="18" fill="#8a1a1a" stroke="#1a1a1e" stroke-width="5"/><circle cx="-10" cy="14" r="18" fill="#8a1a1a" stroke="#1a1a1e" stroke-width="5"/><circle cx="50" cy="14" r="14" fill="#8a1a1a" stroke="#1a1a1e" stroke-width="5"/><rect x="30" y="-58" width="22" height="18" fill="#ffd890"/></g>`;
    for (let k = 0; k < 5; k++) s += `<circle cx="${f(1360 - k * 40)}" cy="${f(410 - k * 34)}" r="${18 + k * 7}" fill="#e8e0d8" opacity="${(.6 - k * .1).toFixed(2)}"/>`;
    // gli edifici di legno lungo la strada (a nord), con le insegne
    const case_ = [[60, 150, 130, "SALOON", "#7a4420"], [230, 120, 110, "HOTEL", "#8a5428"], [370, 110, 100, "STORE", "#6a3a1a"], [500, 140, 120, "SHERIFF", "#5a3218"], [660, 120, 110, "BANK", "#7a4a2a"], [800, 110, 95, "BARBER", "#8a5a30"]];
    for (const [x, w, h, nome, col] of case_) {
      const y = 880;
      s += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${col}" stroke="#3a1e0a" stroke-width="4"/><rect x="${x - 6}" y="${y - h - 26}" width="${w + 12}" height="30" fill="${col}" stroke="#3a1e0a" stroke-width="4"/>`;
      s += `<rect x="${x + 10}" y="${y - h + 12}" width="${w - 20}" height="26" fill="#f0dcae" stroke="#3a1e0a" stroke-width="2"/><text x="${x + w / 2}" y="${y - h + 32}" text-anchor="middle" font-size="18" font-weight="700" fill="#3a1e0a" font-family="Georgia, serif">${nome}</text>`;
      for (const wx of [x + 14, x + w - 38]) s += `<rect x="${wx}" y="${y - h + 50}" width="24" height="28" fill="#ffd890" opacity=".85"/>`;
      s += `<rect x="${x + w / 2 - 14}" y="${y - 44}" width="28" height="44" fill="#2a160a"/><rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="10" fill="#4a2a10"/>`;
    }
    // la chiesetta bianca e il cimitero
    s += `<rect x="300" y="590" width="90" height="80" fill="#e8dcc0" stroke="#6a4a2a" stroke-width="4"/><path d="M290,592 L345,540 L400,592Z" fill="#a8482a"/><rect x="335" y="500" width="20" height="44" fill="#e8dcc0" stroke="#6a4a2a" stroke-width="3"/><path d="M345,470 v28 m-10,-18 h20" stroke="#6a4a2a" stroke-width="5"/><rect x="333" y="630" width="24" height="40" fill="#6a4a2a"/>`;
    for (let k = 0; k < 7; k++) { const x = 180 + (k % 4) * 40, y = 400 + Math.floor(k / 4) * 50; s += `<path d="M${x},${y + 24} v-24 m-9,8 h18" stroke="#5a3a1a" stroke-width="5"/><ellipse cx="${x}" cy="${y + 26}" rx="14" ry="5" fill="#8a5a30"/>`; }
    // il recinto del rodeo
    s += `<ellipse cx="1470" cy="900" rx="210" ry="100" fill="#c8945a"/>`;
    for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2, x = 1470 + Math.cos(a) * 210, y = 900 + Math.sin(a) * 100; s += `<rect x="${f(x - 4)}" y="${f(y - 30)}" width="8" height="32" fill="#5a3418"/>`; }
    for (const dy of [-22, -10]) s += `<ellipse cx="1470" cy="${900 + dy}" rx="210" ry="100" fill="none" stroke="#6a3e1c" stroke-width="5"/>`;
    s += `<path d="M1430,920 q-8,-26 14,-30 l30,-4 q20,0 24,18 l-6,22 m-56,-6 v26 m46,-30 v30 m-60,-48 l-14,-12" stroke="#3a2410" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    // la diligenza sulla pista
    s += `<g transform="translate(1040 1040)"><rect x="-60" y="-70" width="110" height="60" rx="10" fill="#8a1a1a" stroke="#3a0a0a" stroke-width="4"/><rect x="-46" y="-60" width="30" height="24" fill="#f0dcae"/><rect x="-6" y="-60" width="30" height="24" fill="#f0dcae"/><rect x="-66" y="-80" width="122" height="12" fill="#3a1e0a"/>
      <circle cx="-40" cy="-6" r="22" fill="none" stroke="#3a1e0a" stroke-width="6"/><circle cx="30" cy="-6" r="22" fill="none" stroke="#3a1e0a" stroke-width="6"/><path d="M-40,-28 v44 M-62,-6 h44 M30,-28 v44 M8,-6 h44" stroke="#3a1e0a" stroke-width="3"/><path d="M50,-40 h60" stroke="#3a1e0a" stroke-width="5"/></g>`;
    // il pozzo e la banca dell'oro (sacchi)
    s += `<circle cx="1190" cy="770" r="34" fill="#7a7a80" stroke="#3a3a40" stroke-width="6"/><circle cx="1190" cy="770" r="20" fill="#1a2a3a"/><path d="M1150,770 v-60 h80 v60 M1140,710 l50,-26 l50,26" stroke="#5a3418" stroke-width="7" fill="none"/>`;
    // la miniera d'oro nella roccia, in alto a destra
    s += `<path d="M1600,342 q0,-70 50,-70 q50,0 50,70Z" fill="#2a160a" stroke="#5a3418" stroke-width="10"/><rect x="1630" y="330" width="40" height="16" fill="#e8b04a"/>`;
    // cactus saguaro e rotolacampo
    for (let k = 0; k < 18; k++) {
      let x = r() * W, y = 380 + r() * 800;
      if (y > 760 && y < 1100 && x < 960) y = 1130 + r() * 50;   // non sopra la città
      // né sopra la diligenza, la locomotiva, il recinto o le tappe
      const occupato = (x, y) => [[960, 1130, 930, 1100], [1300, 1580, 400, 580], [1230, 1720, 760, 1030], [1150, 1350, 480, 640]].some(([a, b, c, d]) => x > a && x < b && y > c && y < d);
      if (occupato(x, y)) continue;
      const h = 40 + r() * 40;
      s += `<path d="M${f(x)},${f(y)} v${f(-h)} M${f(x)},${f(y - h * .5)} h-16 v${f(-h * .3)} M${f(x)},${f(y - h * .6)} h16 v${f(-h * .3)}" stroke="#3f7a3a" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    }
    for (let k = 0; k < 8; k++) { const x = r() * W, y = 400 + r() * 760; s += `<circle cx="${f(x)}" cy="${f(y)}" r="16" fill="none" stroke="#8a6a3a" stroke-width="3" stroke-dasharray="6 4"/><circle cx="${f(x + 3)}" cy="${f(y - 2)}" r="9" fill="none" stroke="#a07a40" stroke-width="2"/>`; }
    // avvoltoi in cielo
    for (const [x, y] of [[700, 120], [760, 150], [1050, 90]]) s += `<path d="M${x - 22},${y} q11,-12 22,0 q11,-12 22,0" stroke="#2a1420" stroke-width="5" fill="none"/>`;
    return s;
  }
  function mondo(r) {
    // il giro del mondo: un planisfero con i continenti, le rotte degli aerei e qualche monumento
    const P = (lon, lat) => [f((lon + 180) * 5), f((80 - lat) * 8)];
    let s = `<defs><linearGradient id="mareMondo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d5a8a"/><stop offset="1" stop-color="#123c66"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#mareMondo)"/>`;
    // meridiani e paralleli
    for (let lon = -150; lon <= 180; lon += 30) s += `<path d="M${P(lon, 80)[0]},0 V${H}" stroke="#ffffff" stroke-width="1" opacity=".08"/>`;
    for (let lat = 60; lat >= -60; lat -= 30) s += `<path d="M0,${P(0, lat)[1]} H${W}" stroke="#ffffff" stroke-width="1" opacity=".08"/>`;
    for (let k = 0; k < 40; k++) s += `<path d="M${f(r() * W)},${f(r() * H)} q12,-6 24,0" stroke="#9fd8ff" stroke-width="2" fill="none" opacity=".25"/>`;
    // continenti (contorni semplificati in longitudine e latitudine)
    const terre = [
      [[-165, 68], [-140, 70], [-100, 72], [-80, 66], [-60, 55], [-75, 45], [-80, 30], [-97, 25], [-105, 20], [-90, 15], [-80, 8], [-105, 25], [-117, 33], [-125, 45], [-135, 58], [-160, 60]],   // Nord America
      [[-80, 10], [-60, 8], [-35, -5], [-38, -15], [-48, -26], [-58, -35], [-68, -52], [-74, -45], [-72, -20], [-80, -5]],   // Sud America
      [[-10, 36], [-9, 44], [-2, 48], [-5, 52], [-3, 58], [5, 62], [20, 70], [40, 68], [45, 55], [30, 45], [28, 40], [20, 38], [12, 44], [15, 38], [5, 43]],   // Europa
      [[-17, 15], [-10, 30], [-5, 36], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [30, -34], [18, -34], [12, -15], [9, 4], [-8, 5]],   // Africa
      [[40, 68], [70, 75], [110, 77], [140, 72], [170, 66], [160, 58], [140, 50], [130, 35], [120, 22], [106, 10], [100, 15], [92, 22], [80, 8], [72, 20], [57, 25], [48, 30], [36, 36], [30, 45], [45, 55]],   // Asia
      [[114, -22], [122, -18], [131, -12], [142, -11], [153, -25], [150, -37], [140, -38], [130, -32], [115, -34]],   // Australia
      [[-6, 50], [2, 51], [0, 54], [-3, 58], [-6, 57], [-5, 52]],   // Gran Bretagna
      [[130, 31], [136, 34], [141, 38], [142, 43], [140, 41], [135, 35]],   // Giappone
    ];
    for (const t of terre) {
      const pts = t.map(([a, b]) => P(a, b));
      s += `<path d="${curva(pts.concat([pts[0]]))}Z" fill="#3f8f5a" stroke="#2a6a40" stroke-width="4"/>`;
      s += `<path d="${curva(pts.concat([pts[0]]))}Z" fill="none" stroke="#d8c890" stroke-width="10" opacity=".25"/>`;
    }
    // un po' di deserto, ghiaccio e foreste sopra i continenti
    for (const [lon, lat, c, rx, ry] of [[15, 22, "#d8b878", 120, 50], [45, 25, "#d8b878", 60, 30], [-60, -8, "#2e7a42", 90, 60], [100, 60, "#e8f0f0", 200, 35], [-100, 62, "#e8f0f0", 150, 30], [133, -25, "#c89a5a", 80, 40]]) {
      const [x, y] = P(lon, lat); s += `<path d="${blob(x, y, rx, ry, r, 16, .2)}" fill="${c}" opacity=".55"/>`;
    }
    // rotte degli aerei (tratteggiate) tra gli scali
    const scali = [[0, 51.5], [-43, -23], [31, 30], [140, 36], [-4, 57], [-77, 39]];
    for (let k = 0; k < scali.length - 1; k++) {
      const [a, b] = [P(...scali[k]), P(...scali[k + 1])], mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 120;
      s += `<path d="M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}" stroke="#ffffff" stroke-width="4" stroke-dasharray="14 12" fill="none" opacity=".55"/>`;
    }
    // aeroplanini e nuvole
    for (const [lon, lat, rot] of [[-20, 10, 120], [80, 50, 80], [-110, 50, -20]]) { const [x, y] = P(lon, lat); s += `<text x="${x}" y="${y}" font-size="44" fill="#ffffff" transform="rotate(${rot} ${x} ${y})" text-anchor="middle">✈</text>`; }
    for (let k = 0; k < 12; k++) s += `<ellipse cx="${f(r() * W)}" cy="${f(r() * H)}" rx="${f(50 + r() * 60)}" ry="${f(14 + r() * 10)}" fill="#ffffff" opacity=".18"/>`;
    // rosa dei venti
    s += `<g transform="translate(1660 1060)"><circle r="70" fill="#0d2c4a" stroke="#d8c890" stroke-width="4"/><path d="M0,-62 L12,0 L0,62 L-12,0Z M-62,0 L0,-12 L62,0 L0,12Z" fill="#d8c890"/><text y="-74" text-anchor="middle" font-size="26" fill="#d8c890">N</text></g>`;
    return s;
  }
  const TERRENI = [citta, isola, metropoli, olimpo, castello, porto, deserto, lunapark, vulcano, inferi, lavoro, springfield, barbacasa, galassia, elementi, notte, futuro, tavolo, mondo, farwest, specchi, treno, torre, dimensione];

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
    const NEBBIE = [["#2b2433", "214,196,232"], ["#9fb4c8", "255,255,255"], ["#363e4e", "200,214,236"], ["#c9d4de", "255,255,255"], ["#1c2638", "205,220,245"],
      ["#162230", "180,210,235"], ["#c9a86a", "255,240,210"], ["#22102e", "240,180,255"], ["#2a1410", "255,190,150"], ["#1e0608", "255,120,110"], ["#b8c4cc", "255,255,255"],
      ["#4a6a8a", "255,250,220"], ["#6a4a6a", "255,220,240"], ["#070a1c", "180,200,255"], ["#1c2a34", "200,255,235"], ["#100c1c", "200,190,240"], ["#0a0818", "170,220,255"], ["#2a1a0e", "255,230,180"], ["#123c66", "230,245,255"], ["#3a1c10", "255,214,170"],
      ["#160a26", "220,190,255"], ["#2a3240", "200,225,255"], ["#1a1206", "255,225,150"], ["#24123c", "214,170,255"]];
    const [base, nuv] = NEBBIE[k] || NEBBIE[0];
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
