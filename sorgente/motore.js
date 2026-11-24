// ============================================================
//  MOTORE DI BATTAGLIA (senza grafica).
//  La schermata chiama risolviTurno() e anima gli eventi restituiti.
//
//  - 5 contro 5: un personaggio in campo per parte, gli altri in riserva.
//  - Ogni turno entrambi scelgono: una mossa, "Carica" o un cambio.
//    Prima i cambi, poi Carica, poi le mosse in ordine di velocità.
//  - Energia per squadra: si parte da 3, +2 a fine turno, massimo 8.
//    "Carica" dà +2 energia subito e fa subire il 30% di danni in meno quel turno.
//  - Danno = potenza · (attacco+6)/(difesa+6) · stile · variazione · K
//    stile: ×1,3 se il tuo stile batte il suo, ×0,8 se è il contrario.
// ============================================================

const ENERGIA_INIZIALE = 3, ENERGIA_TURNO = 2, ENERGIA_MAX = 8, BONUS_CARICA = 2;
const K_DANNO = 0.78, SMUSSO = 6, PROB_CRITICO = 0.06;
const TURNO_SIRENE = 30;
const TETTO_ATTACCO = 1.6;   // i bonus all'attacco sommati arrivano al massimo a +60% // da questo turno le cure si dimezzano e chi è in campo perde PV ogni turno

const _carte = (typeof module !== "undefined") ? require("./carte.js") : null;
const _PER_ID = _carte ? _carte.PER_ID : PER_ID;
const _STILI = _carte ? _carte.STILI : STILI;
const _stat = _carte ? _carte.statistiche : statistiche;
const _rarDopo = _carte ? _carte.rarDopo : rarDopo;

function multStile(sa, sd) {
  if (_STILI[sa].batte === sd) return 1.3;
  if (_STILI[sd].batte === sa) return 0.8;
  return 1;
}

// Le carte olografiche hanno il 5% in più di PV e di danni (come un piccolo livello extra)
const BONUS_OLO = 1.05, BONUS_ULTRA = 1.10;   // la versione Ultra: +10% di PV e danni (si somma all'olografica)
// asc: quante volte la carta è salita di rarità (Ascesa). La carta in battaglia ha la rarità nuova (anche la cornice).
function nuovoCombattente(id, liv, lode, olo, ultra, asc) {
  const base = _PER_ID[id], rar = _rarDopo(base.rarita, asc);
  const c = rar !== base.rarita ? Object.assign({}, base, { rarita: rar, ascesa: true }) : base, s = _stat(c, liv, lode), k = (olo ? BONUS_OLO : 1) * (ultra && c.ultra ? BONUS_ULTRA : 1);
  const pv = Math.round(s.pv * k);
  return { id, c, liv, lode: !!lode, olo: !!olo, asc: rar !== base.rarita ? asc | 0 : 0, ultra: !!(ultra && c.ultra), f: s.f * k, pv, pvMax: pv, att: s.attBase, dif: s.dif, vel: s.vel,
    buff: {}, stati: {}, scudo: 0, nebbia: false, stordito: false, carica: false, koAnnunciato: false };
}


// ---------------- Sinergie ----------------
// Serie: 2, 3 o 5 carte della stessa serie in squadra danno un bonus (sempre più grande) alle carte di quella serie.
// Multiverso: 2 o più versioni della stessa persona (es. Lollifer + Lollinista) danno +2% / +4% a tutte le statistiche di quelle carte.
// I valori si possono cambiare dal pannello admin (config "sinergie"): li legge applicaSinergie.
const _il = v => (v === 1 || v === 11 || String(v)[0] === "8") ? `l'${v}%` : `il ${v}%`;
// Tre livelli: 2 carte della stessa serie (bonus piccolo), 3 (medio), 5 (grande). liv = 1, 2, 3.
const SOGLIE_SINERGIA = [2, 3, 5];
const SINERGIE_BASE = {
  eroi:     { tipo: "dif",      v2: 10, v3: 20, v5: 23, testo: v => `+${v}% difesa` },
  db:       { tipo: "att",      v2: 8, v3: 16, v5: 22, testo: v => `+${v}% attacco` },
  dei:      { tipo: "rigenera", v2: 1.5, v3: 3, v5: 4.5, testo: v => `in campo recuperano ${_il(v)} dei PV ogni turno` },
  // Mafiosi: v = energia in più in tutto, a rate: +1 all'inizio e +1 a fine turno per i turni dopo.
  // Così non si arriva mai alla mossa finale (5) al primo turno: si parte al massimo da 4.
  nueve:    { tipo: "energia",  v2: 1, v3: 4,  v5: 10,  testo: v => v <= 1 ? `la squadra parte con +${v} energia` : `+1 energia all'inizio e +1 in più a fine turno per i primi ${v - 1} turni` },
  // Maghi: effetti più forti (e da 3 carte durano 1 turno in più); in più le loro mosse con un effetto fanno +15/25/45% di danni
  maghi:    { tipo: "effetti",  v2: 100, v3: 180, v5: 300, testo: (v, liv) => `i loro effetti (brucia, indebolisci, stordisci) sono più forti del ${v}%${liv >= 2 ? " e durano 1 turno in più" : ""}, e le mosse con un effetto fanno +${[0, 15, 25, 45][liv] || 15}% di danni` },
  demoni:   { tipo: "vampiro",  v2: 6, v3: 12, v5: 25, testo: v => `recuperano in PV ${_il(v)} dei danni che fanno` },
  // Simpson: colpi critici più frequenti e, da 3 carte, più forti (×1,75; con 5 ×2 invece di ×1,5)
  simpson:  { tipo: "critico",  v2: 15, v3: 25, v5: 35, testo: (v, liv) => `+${v}% di probabilità di colpo critico${liv >= 2 ? `, e i loro critici fanno ×${liv >= 3 ? "2" : "1,75"} invece di ×1,5` : ""}` },
  // Barbapapà: cambiano forma, quindi il tipo conta meno per loro: lo svantaggio di tipo (quando attaccano e quando difendono) si riduce
  barbapapa: { tipo: "forma",   v2: 40, v3: 80, v5: 95, testo: (v, liv) => v >= 100 ? `non soffrono più lo svantaggio di tipo, né in attacco né in difesa` : `lo svantaggio di tipo pesa ${_il(v)} in meno su di loro, in attacco e in difesa` },
  // Star Wars: con i riflessi della Forza a volte parano un colpo intero (come una schivata)
  starwars: { tipo: "para",     v2: 5, v3: 8, v5: 11, testo: v => `${v}% di probabilità di parare un attacco con la Forza (non subiscono danni né effetti)` },
  // Elementi: si caricano restando in campo. Ogni fine turno in campo +v% attacco, fino a 5 volte; uscendo si scaricano.
  elementi: { tipo: "accumulo", v2: 5, v3: 9, v5: 13, testo: v => `restando in campo si caricano: +${v}% di attacco a ogni fine turno, fino a 5 volte (massimo +${Math.round(v * 50) / 10}%); se escono si scaricano` },
  // Creature mistiche: non muoiono davvero. La prima volta che vanno KO hanno v% di probabilità di rialzarsi con il 20% dei PV (una volta a carta).
  creature: { tipo: "rinascita", v2: 12, v3: 20, v5: 30, testo: v => `la prima volta che vanno KO hanno ${_il(v)} di probabilità di rialzarsi con il 20% dei PV (una volta per carta)` },
  // Cyborg: sistemi schermati. Hanno v% di probabilità di respingere gli effetti nemici (brucia, stordisci, indebolisci, ruba energia).
  cyborg: { tipo: "schermo", v2: 50, v3: 85, v5: 100, testo: (v, liv) => `${v}% di probabilità di respingere gli effetti nemici (bruciatura, stordimento, indebolimento, furto di energia)${liv >= 3 ? ", e l'effetto respinto torna indietro su chi l'ha lanciato" : ""}` },
  // Carte da gioco: fortuna al tavolo. v% di probabilità che un attacco faccia «Scopa!» e colpisca di nuovo a metà danni.
  carte: { tipo: "fortuna", v2: 11, v3: 24, v5: 33, testo: v => `${v}% di probabilità che un loro attacco faccia «Scopa!» e colpisca una seconda volta a metà danni` },
  // Paesi del mondo: ospitalità. Quando una carta della serie entra in campo recupera v% dei PV massimi.
  paesi: { tipo: "ospitalita", v2: 14, v3: 27, v5: 45, testo: v => `quando entrano in campo recuperano ${_il(v)} dei PV massimi (benvenuti a casa!)` },
  // Far West: estrazione rapida. La prima mossa d'attacco dopo essere entrate in campo fa +v% di danni (tutti i colpi di quella mossa).
  farwest: { tipo: "duello", v2: 15, v3: 26, v5: 34, testo: v => `estrazione rapida: la prima mossa d'attacco dopo che entrano in campo fa +${v}% di danni` },
  // Apocalisse: istinto di sopravvivenza. Sotto il 35% dei PV subiscono v% di danni in meno.
  apocalisse: { tipo: "sopravvivenza", v2: 25, v3: 44, v5: 48, testo: v => `istinto di sopravvivenza: quando hanno meno del 35% dei PV subiscono ${_il(v)} di danni in meno` },
  mestieri: { tipo: "vel",      v2: 8, v3: 23, v5: 30, testo: (v, liv) => `+${v}% velocità${liv >= 3 ? " e la squadra parte con +1 energia" : ""}` },
};
const SINERGIE = JSON.parse(JSON.stringify(SINERGIE_BASE, (k, v) => typeof v === "function" ? undefined : v));
for (const k in SINERGIE) SINERGIE[k].testo = SINERGIE_BASE[k].testo;
const MULTIVERSO = { v2: 2, v3: 4 };   // nov 2026: era 8 / 14, ma toccando tutte le statistiche valeva tre volte una sinergia di serie
const valSinergia = (s, liv) => liv >= 3 ? s.v5 : liv === 2 ? s.v3 : liv === 1 ? s.v2 : 0;
function applicaSinergie(cfg) {
  const c = cfg && typeof cfg === "object" ? cfg : {};
  const num = (x, b, max) => x !== undefined && x !== null && x !== "" && Number.isFinite(+x) ? Math.max(0, Math.min(max, Math.round(+x * 10) / 10)) : b;
  // i valori salvati con le vecchie regole (solo 3 e 5 carte) non valgono più: si riparte dai nuovi
  const nuove = c.versione === 4;   // nov 2026: versione 3 (Mafiosi rivisti); i valori salvati prima non valgono più
  for (const k in SINERGIE_BASE) {
    const b = SINERGIE_BASE[k], m = (nuove && c[k]) || {}, max = b.tipo === "energia" ? 5 : b.tipo === "effetti" ? 400 : 60;
    for (const v of ["v2", "v3", "v5"]) SINERGIE[k][v] = num(m[v], b[v], max);
  }
  const mv = (nuove && c.multiverso) || {};
  MULTIVERSO.v2 = num(mv.v2, 2, 30);
  MULTIVERSO.v3 = num(mv.v3, 4, 40);
}
// Quali sinergie ha una squadra (array di id carte). Usata dal motore e dalla schermata Squadre.
function sinergieDi(ids) {
  const carte = ids.map(id => _PER_ID[id]).filter(Boolean);
  const perSerie = {}, perPersona = {};
  for (const c of carte) { (perSerie[c.serie] = perSerie[c.serie] || []).push(c.id); if (c.persona) (perPersona[c.persona] = perPersona[c.persona] || []).push(c.id); }
  const serie = Object.entries(perSerie).filter(([k]) => SINERGIE[k]).map(([k, lista]) => {
    const n = lista.length, liv = n >= 5 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0, s = SINERGIE[k];
    return { serie: k, n, liv, ids: lista, tipo: s.tipo, val: valSinergia(s, liv) };
  }).sort((a, b) => b.n - a.n);
  const multiverso = Object.entries(perPersona).filter(([, l]) => l.length >= 2)
    .map(([persona, lista]) => ({ persona, ids: lista, n: lista.length, val: lista.length >= 3 ? MULTIVERSO.v3 : MULTIVERSO.v2 }));
  return { serie, multiverso };
}

// ---------------- Campi di battaglia ----------------
// Ogni battaglia si gioca su un campo che cambia una regola per tutti e due. Contro il computer e dal vivo
// è pescato a caso (con il seme della battaglia, così i due giocatori e chi guarda vedono lo stesso);
// nella storia dipende dalla mappa. L'oggetto "Radio pirata" dello zaino lo cambia a scelta.
const CAMPI = {
  pioggia: { nome: "Pioggia",      icona: "🌧️", colore: "#5aa9ff", desc: "Le bruciature durano 1 turno in meno e le carte Velocità hanno +10% velocità." },
  notte:   { nome: "Notte",        icona: "🌙", colore: "#9b7bff", desc: "Colpi critici più frequenti: +6% di probabilità per tutti." },
  stadio:  { nome: "Stadio pieno", icona: "🏟️", colore: "#f2c14e", desc: "Il pubblico carica tutti: +1 energia a entrambe le squadre quando si entra nello stadio." },
  lava:    { nome: "Lava",         icona: "🌋", colore: "#ff6a2a", desc: "A fine turno chi è in campo perde il 2% dei PV: conviene chiudere in fretta." },
  tempio:  { nome: "Tempio",       icona: "🏛️", colore: "#7dffb0", desc: "Tutte le cure valgono il doppio." },
};
const ORDINE_CAMPI = Object.keys(CAMPI);

// ---------------- Graffiti ----------------
// Ogni lato può spruzzare un graffito sul campo: vale per tutta la battaglia (nomi e disegni in graffiti.js).
// Sono a coppie opposte: se i due lati usano i due graffiti della stessa coppia, si annullano.
const GRAFFITI_COPPIE = { fiamma: "muro", muro: "fiamma", fulmine: "blackout", blackout: "fulmine", cuore: "spina", spina: "cuore", fortuna: "specchio", specchio: "fortuna" };
// quanto vale l'effetto al livello 1..5
function valoreGraffito(id, liv = 1) {
  const l = Math.max(1, Math.min(5, liv || 1)) - 1;
  return { fiamma: 3 + 1.5 * l, muro: 3.5 + 1.25 * l, fulmine: l >= 2 ? 2 : 1, blackout: l >= 2 ? 2 : 1, cuore: 1.5 + .4 * l, spina: 2.5 + 1.25 * l, fortuna: 8 + 3 * l, specchio: l >= 3 ? 2 : 1 }[id] || 0;
}

// ---------------- Zaino ----------------
// Oggetti che si usano durante il proprio turno (uno per turno, non consumano la mossa). Nomi e grafiche in zaino.js.
const OGGETTI_EFFETTI = {
  kebab:    { tipo: "cura", val: 35 },
  lattina:  { tipo: "energia", val: 3 },
  occhiali: { tipo: "forza", val: 30, turni: 2 },
  casco:    { tipo: "scudo", val: 60 },
  acqua:    { tipo: "pulisci", val: 10 },
  fumogeno: { tipo: "nebbia" },
  taxi:     { tipo: "rianima", val: 30 },
  radio:    { tipo: "campo" },
};

// Cure, bruciature e sirene (tutto quello che è "una percentuale dei PV") si calcolano sui PV "normali" della carta:
// il boss del gruppo ha decine di migliaia di PV, e curarsi del 5% di quelli lo rendeva imbattibile.
const pvCura = a => a.pvCura || a.pvMax;

class Battaglia {
  // squadre: array di {id, liv}
  constructor(sqG, sqC, nomeG = "Tu", nomeC = "Avversario", rng = Math.random) {
    this.rng = rng;
    this.lati = [
      { nome: nomeG, squadra: sqG.map(x => nuovoCombattente(x.id, x.liv, x.lode, x.olo, x.ultra, x.asc)), attivo: 0, energia: ENERGIA_INIZIALE },
      { nome: nomeC, squadra: sqC.map(x => nuovoCombattente(x.id, x.liv, x.lode, x.olo, x.ultra, x.asc)), attivo: 0, energia: ENERGIA_INIZIALE },
    ];
    this.turno = 1;
    this.vincitore = -1;
    this.ev = [];
    this.graffitiAnnullati = null;
    this.lati.forEach(L => { this._sinergie(L); if (L.squadra[0]) L.squadra[0].usata = true; });   // "usata": è scesa in campo (per i premi)
    this.campo = null;
    this.impostaCampo(ORDINE_CAMPI[Math.floor(this.rng() * ORDINE_CAMPI.length)]);
  }
  // applica le sinergie di una squadra ai suoi combattenti
  _sinergie(L) {
    const sin = sinergieDi(L.squadra.map(x => x.id));
    L.sinergie = sin;
    for (const s of sin.serie) {
      if (!s.liv) continue;
      for (const x of L.squadra) {
        if (x.c.serie !== s.serie) continue;
        x.sin = x.sin || {};
        if (s.tipo === "att") { x.att *= 1 + s.val / 100; x.sinAtt = 1 + s.val / 100; }
        else if (s.tipo === "dif") x.dif *= 1 + s.val / 100;
        else if (s.tipo === "vel") x.vel = Math.round(x.vel * (1 + s.val / 100));
        else if (s.tipo === "rigenera") x.sin.rigenera = s.val;
        else if (s.tipo === "vampiro") x.sin.vampiro = s.val;
        else if (s.tipo === "para") x.sin.para = s.val;
        else if (s.tipo === "accumulo") x.sin.accumulo = s.val;
        else if (s.tipo === "rinascita") x.sin.rinascita = s.val;
        else if (s.tipo === "fortuna") x.sin.fortuna = s.val;
        else if (s.tipo === "ospitalita") x.sin.ospitalita = s.val;
        else if (s.tipo === "sopravvivenza") x.sin.sopravvive = s.val;
        else if (s.tipo === "duello") { x.sin.duello = s.val; x.pronta = true; }
        else if (s.tipo === "schermo") { x.sin.schermo = s.val; if (s.liv >= 3) x.sin.rimbalza = 1; }
        else if (s.tipo === "forma") { x.sin.forma = s.val; }
        else if (s.tipo === "critico") { x.sin.crit = s.val; x.sin.critX = s.liv >= 3 ? 2 : s.liv === 2 ? 1.75 : 1.5; }
        else if (s.tipo === "effetti") { x.sin.forzaEff = s.val; x.sin.dannoEff = [0, 15, 25, 45][s.liv] || 0; if (s.liv >= 2) x.sin.effetti = 1; }
      }
      if (s.tipo === "energia") { const v = Math.round(s.val); L.energia = Math.min(ENERGIA_MAX, L.energia + Math.min(1, v)); L.spintaEnergia = Math.max(0, v - 1); }
      if (s.tipo === "vel" && s.liv >= 3) L.energia = Math.min(ENERGIA_MAX, L.energia + 1);
    }
    for (const m of sin.multiverso) {
      const k = 1 + m.val / 100;
      for (const x of L.squadra) if (m.ids.includes(x.id)) { x.att *= k; x.dif *= k; x.pv = Math.round(x.pv * k); x.pvMax = x.pv; x.vel = Math.round(x.vel * k); }
    }
  }

  // cambia il campo: toglie gli effetti del vecchio e mette quelli del nuovo
  impostaCampo(id) {
    if (!CAMPI[id] || id === this.campo) return false;
    if (this.campo === "pioggia") for (const L of this.lati) for (const x of L.squadra) if (x.velPioggia) { x.vel = x.velPioggia; delete x.velPioggia; }
    this.campo = id;
    if (id === "pioggia") for (const L of this.lati) for (const x of L.squadra) if (x.c.stile === "VEL") { x.velPioggia = x.vel; x.vel = Math.round(x.vel * 1.1); }
    if (id === "stadio") for (const L of this.lati) L.energia = Math.min(ENERGIA_MAX, L.energia + 1);
    return true;
  }
  // g0, g1: { id, liv } oppure null
  impostaGraffiti(g0, g1) {
    const g = [g0, g1].map(x => x && GRAFFITI_COPPIE[x.id] ? { id: x.id, liv: Math.max(1, Math.min(5, x.liv || 1)) } : null);
    if (g[0] && g[1] && GRAFFITI_COPPIE[g[0].id] === g[1].id) { this.graffitiAnnullati = [g[0], g[1]]; g[0] = g[1] = null; }
    this.lati.forEach((L, i) => { L.graffito = g[i]; });
    for (const l of [0, 1]) {
      if (this.gv(l, "fulmine")) this.lati[l].energia = Math.min(ENERGIA_MAX, this.lati[l].energia + this.gv(l, "fulmine"));
      if (this.gv(l, "blackout")) this.lati[1 - l].energia = Math.max(0, this.lati[1 - l].energia - this.gv(l, "blackout"));
    }
  }
  // Usa un oggetto dello zaino: { ok, motivo, ev }. Non fa passare il turno.
  usaOggetto(l, idPieno, nome) {
    const [id, scelta] = String(idPieno).split(":");   // la Radio pirata porta il campo scelto: "radio:lava"
    const e = OGGETTI_EFFETTI[id], L = this.lati[l], a = this.attivo(l);
    const no = motivo => ({ ok: false, motivo, ev: [] });
    if (!e || this.vincitore >= 0) return no("La battaglia è finita.");
    if (a.pv <= 0) return no("Prima manda in campo un'altra carta.");
    if ((this.oggettiTurno || [])[l] === this.turno) return no("Puoi usare un solo oggetto per turno.");
    if (e.tipo === "cura" && a.pv >= a.pvMax) return no(`${a.c.nome} ha già tutti i PV.`);
    if (e.tipo === "energia" && L.energia >= ENERGIA_MAX) return no("L'energia è già al massimo.");
    if (e.tipo === "pulisci" && !a.stati.brucia && !a.buff.debole && !a.stordito && a.pv >= a.pvMax) return no(`${a.c.nome} sta già benissimo.`);
    const ko = L.squadra.find(x => x.pv <= 0);
    if (e.tipo === "rianima" && (!ko || this.rianimato && this.rianimato[l])) return no(!ko ? "Nessuna carta è KO." : "Puoi rimettere in piedi una carta sola a battaglia.");
    if (e.tipo === "campo" && (!CAMPI[scelta] || scelta === this.campo)) return no(!CAMPI[scelta] ? "Scegli un campo." : "Siete già su questo campo.");
    this.ev = [];
    this.oggettiTurno = this.oggettiTurno || []; this.oggettiTurno[l] = this.turno;
    this._log(`${L.nome} apre lo zaino: ${nome || id}!`, { lato: l, oggetto: id, avviso: true });
    if (e.tipo === "cura") this._cura(l, a, Math.round(pvCura(a) * e.val / 100));
    else if (e.tipo === "energia") { L.energia = Math.min(ENERGIA_MAX, L.energia + e.val); this._log(`+${e.val} energia.`, { lato: l, anim: "energia", su: l }); }
    else if (e.tipo === "forza") { a.buff.att = { val: e.val, turni: e.turni }; this._log(`Attacco di ${a.c.nome} +${e.val}% per ${e.turni} turni.`, { lato: l, anim: "potenzia", su: l }); }
    else if (e.tipo === "scudo") { a.scudo = Math.max(a.scudo, e.val); this._log(`${a.c.nome} è protetto: il prossimo colpo fa il ${e.val}% di danni in meno.`, { lato: l, anim: "scudo", su: l }); }
    else if (e.tipo === "pulisci") {
      delete a.stati.brucia; delete a.buff.debole; a.stordito = false;
      this._log(`${a.c.nome} si rimette in sesto: niente più bruciature, debolezza o stordimento.`, { lato: l });
      this._cura(l, a, Math.round(pvCura(a) * e.val / 100));
    }
    else if (e.tipo === "nebbia") { a.nebbia = true; a.nebbiaFino = this.turno; this._log(`Fumo dappertutto: il prossimo attacco contro ${a.c.nome} andrà a vuoto.`, { lato: l, anim: "nebbia", su: l }); }
    else if (e.tipo === "rianima") {
      ko.pv = Math.max(1, Math.round(ko.pvMax * e.val / 100)); ko.koAnnunciato = false; ko.stati = {}; ko.buff = {};
      this.rianimato = this.rianimato || []; this.rianimato[l] = true;
      this._log(`${ko.c.nome} torna in piedi con ${ko.pv} PV ed è di nuovo in panchina.`, { lato: l, cura: l, quanto: ko.pv });
    }
    else if (e.tipo === "campo") {
      this.impostaCampo(scelta);
      this._log(`Il campo cambia: ${CAMPI[scelta].icona} ${CAMPI[scelta].nome}! ${CAMPI[scelta].desc}`, { lato: l, campo: scelta, avviso: true });
    }
    return { ok: true, ev: this.ev };
  }

  // valore del graffito "id" se il lato l lo sta usando, altrimenti 0
  gv(l, id) { const x = this.lati[l].graffito; return x && x.id === id ? valoreGraffito(id, x.liv) : 0; }

  attivo(l) { const L = this.lati[l]; return L.squadra[L.attivo]; }
  vivi(l) { return this.lati[l].squadra.filter(x => x.pv > 0); }
  serveSostituzione(l) { return this.attivo(l).pv <= 0 && this.vivi(l).length > 0 && this.vincitore < 0; }
  puoUsare(l, i) { const a = this.attivo(l); return a.pv > 0 && this.lati[l].energia >= a.c.mosse[i].costo; }

  _foto() {
    return {
      pv: this.lati.map(L => L.squadra.map(x => x.pv)),
      en: this.lati.map(L => L.energia),
      att: this.lati.map(L => L.attivo),
    };
  }
  _log(testo, extra = {}) { this.ev.push({ testo, ...extra, foto: this._foto() }); }

  attaccoEffettivo(l, x) {
    // I bonus all'attacco (mosse e Occhiali che potenziano, Capo, sinergia Dragon Ball) insieme non superano +60%.
    // Esempio: Capo 1,1 × Ordine Reale 1,35 × 5 Dragon Ball 1,26 = 1,87 → conta 1,60.
    let bonus = x.sinAtt || 1;
    if (x.buff.att) bonus *= 1 + x.buff.att.val / 100;
    if (x.carica_el && x.sin && x.sin.accumulo) bonus *= 1 + x.carica_el * x.sin.accumulo / 100;
    if (this.lati[l].squadra.some(y => y.pv > 0 && y.c.ruolo === "capo")) bonus *= 1.1;
    let a = x.att / (x.sinAtt || 1) * Math.min(TETTO_ATTACCO, bonus);
    if (x.buff.debole) a *= 1 - x.buff.debole.val / 100;
    if (x.c.ruolo === "picchiatore") a *= 1 + 0.5 * (1 - x.pv / x.pvMax);
    return a;
  }

  // casuale=false → stima deterministica (usata dal computer per decidere)
  calcolaDanno(l, a, d, m, casuale = true) {
    const att = this.attaccoEffettivo(l, a);
    const dif = d.dif * (1 - (m.penetra || 0) / 100);
    const rapporto = (att * (a.f || 1) + SMUSSO) / (dif + SMUSSO);   // attacco e difesa entrambi col livello
    let stile = multStile(a.c.stile, d.c.stile);
    // sinergia Barbapapà: cambiando forma lo svantaggio di tipo pesa meno (chi attacca in svantaggio, o chi si difende da un vantaggio)
    if (stile < 1 && a.sin && a.sin.forma) stile += (1 - stile) * Math.min(100, a.sin.forma) / 100;
    if (stile > 1 && d.sin && d.sin.forma) stile -= (stile - 1) * Math.min(100, d.sin.forma) / 100;
    let varia = 1, crit = false;
    if (casuale) {
      varia = a.c.ruolo === "imprevedibile" ? 0.6 + this.rng() * 0.9 : 0.9 + this.rng() * 0.2;
      const sc = (a.sin && a.sin.crit) || 0;   // sinergia Simpson: tetto più alto (60% invece di 35%)
      crit = this.rng() < Math.min(sc ? 0.6 : 0.35, (a.c.ruolo === "assassino" ? 0.2 : PROB_CRITICO) + sc / 100 + this.gv(l, "fortuna") / 100 + (this.campo === "notte" ? 0.06 : 0));
    }
    // chi è in svantaggio di tipo non fa colpi critici: il tipo deve contare davvero
    if (stile < 1) crit = false;
    const parato = crit && this.gv(1 - l, "specchio") > 0;   // lo specchio trasforma i critici in colpi normali
    if (parato) crit = false;
    let dmg = m.pot * rapporto * stile * varia * (crit ? ((a.sin && a.sin.critX) || 1.5) : 1) * K_DANNO * (a.f || 1);
    dmg *= (1 + this.gv(l, "fiamma") / 100) * (1 - this.gv(1 - l, "muro") / 100);
    if (a.c.ruolo === "tiratore" && m.costo >= 2) dmg *= 1.1;
    if (m.eff && a.sin && a.sin.dannoEff) dmg *= 1 + a.sin.dannoEff / 100;   // sinergia Maghi
    // boss del giorno: corazze e punti deboli (funzioni messe da BossGiorno.prepara)
    if (d.dannoDa) dmg *= d.dannoDa(a);
    if (a.furia && a.pv < a.pvMax * .5) dmg *= 1 + a.furia / 100;
    if (d.c.ruolo === "tank") dmg *= 0.9;
    if (d.sin && d.sin.sopravvive && d.pv < d.pvMax * .35) dmg *= 1 - d.sin.sopravvive / 100;   // sinergia Apocalisse
    if (a.pronta && a.sin && a.sin.duello) dmg *= 1 + a.sin.duello / 100;   // sinergia Far West: estrazione rapida
    if (d.carica) dmg *= 0.7;
    return { danno: Math.max(1, Math.round(dmg)), crit, stile, parato };
  }

  // Chi andrebbe per primo se questo turno attaccano tutti e due (-1 = a sorte, solo al primo turno a pari velocità)
  chiPrimo() {
    const v0 = this.attivo(0).vel, v1 = this.attivo(1).vel;
    if (v0 !== v1) return v0 > v1 ? 0 : 1;
    return this.ultimoAttacco === 0 || this.ultimoAttacco === 1 ? 1 - this.ultimoAttacco : -1;
  }

  risolviTurno(azG, azC) {
    this.ev = [];
    const az = [azG, azC];
    for (const l of [0, 1]) if (az[l].tipo === "cambio") this._cambia(l, az[l].i);
    for (const l of [0, 1]) if (az[l].tipo === "carica") {
      const L = this.lati[l], a = this.attivo(l);
      L.energia = Math.min(ENERGIA_MAX, L.energia + BONUS_CARICA);
      a.carica = true;
      this._log(`${a.c.nome} si concentra: +${BONUS_CARICA} energia e si protegge.`, { lato: l, anim: "energia", su: l });
    }
    // Ognuno fa UNA mossa per turno: la velocità decide solo chi va per primo.
    // A pari velocità va prima chi non ha attaccato per ultimo: così nessuno attacca due volte di fila
    // (prima a pari velocità si tirava a sorte ogni turno, e capitava A-B | B-A).
    const chiMuove = [0, 1].filter(l => az[l].tipo === "mossa");
    if (chiMuove.length === 2) {
      const v0 = this.attivo(0).vel, v1 = this.attivo(1).vel;
      const primo = v0 !== v1 ? (v0 > v1 ? 0 : 1)
        : this.ultimoAttacco === 0 || this.ultimoAttacco === 1 ? 1 - this.ultimoAttacco
        : (this.rng() < 0.5 ? 0 : 1);
      chiMuove.splice(0, 2, primo, 1 - primo);
    }
    this._mosso = [false, false];   // chi ha già agito in questo turno (per la durata della nebbia)
    for (const l of chiMuove) {
      if (this.vincitore >= 0) break;
      this._mosso[l] = true;
      const a = this.attivo(l);
      if (a.pv <= 0) continue;
      if (a.stordito) { a.stordito = false; a.immuneFino = this.turno + 1; this._log(`${a.c.nome} è stordito e salta il turno.`, { lato: l }); continue; }
      const m = a.c.mosse[az[l].i];
      // se nel frattempo ha perso energia (gliel'hanno rubata), usa la mossa gratis invece di saltare il turno
      const mm = this.lati[l].energia < m.costo ? (a.c.mosse.find(x => x.costo === 0) || a.c.mosse[0]) : m;
      if (mm !== m) this._log(`${a.c.nome} non ha più abbastanza energia per ${m.nome}: usa ${mm.nome}.`, { lato: l });
      if (this.lati[l].energia < mm.costo) { this._log(`${a.c.nome} non ha abbastanza energia.`, { lato: l }); continue; }
      this._usaMossa(l, mm);
      this._controllaKO();
    }
    if (this.vincitore < 0) this._fineTurno();
    return this.ev;
  }

  _cambia(l, i) {
    const L = this.lati[l], fuori = this.attivo(l);
    if (i === L.attivo || !L.squadra[i] || L.squadra[i].pv <= 0) return;
    fuori.stordito = false; fuori.carica = false; fuori.nebbia = false; fuori.carica_el = 0;
    L.attivo = i;
    const dentro = this.attivo(l);
    dentro.usata = true;
    this._log(`${L.nome} manda in campo ${dentro.c.nome}.`, { lato: l, entra: l });
    if (dentro.c.ruolo === "difensore") { dentro.scudo = Math.max(dentro.scudo, 30); this._log(`${dentro.c.nome} alza la guardia: scudo 30%.`, { lato: l, anim: "scudo", su: l }); }
    // Paesi del mondo: chi entra in campo si sente a casa e recupera un po' di PV
    if (dentro.sin && dentro.sin.duello) dentro.pronta = true;   // Far West: rientrando in campo la pistola è di nuovo carica
    if (dentro.sin && dentro.sin.ospitalita && dentro.pv < dentro.pvMax) this._cura(l, dentro, Math.max(1, Math.round(dentro.pvMax * dentro.sin.ospitalita / 100)));
  }

  // Sostituzione dopo un KO (non consuma il turno)
  sostituisci(l, i) { this.ev = []; this._cambia(l, i); return this.ev; }

  _usaMossa(l, m) {
    const L = this.lati[l], O = this.lati[1 - l], a = this.attivo(l), d = this.attivo(1 - l);
    this.ultimoAttacco = l;
    L.energia -= m.costo;
    this._log(`${a.c.nome} usa ${m.nome}!`, { lato: l, anim: "attacco", id: a.id, mossa: a.c.mosse.indexOf(m), nome: m.nome, costo: m.costo, stile: a.c.stile, pot: m.pot, colpi: m.colpi || 1, eff: (m.eff || {}).tipo || "" });
    const e = m.eff || {};
    const SUL_BERSAGLIO = ["brucia", "stordisci", "indebolisci", "ruba"];
    const mira = m.pot > 0 || SUL_BERSAGLIO.includes(e.tipo);
    let colpito = false, totale = 0;
    if (mira) {
      if (d.nebbia) { d.nebbia = false; this._log(`${d.c.nome} sparisce: il colpo va a vuoto.`, { lato: 1 - l, anim: "schiva", bersaglio: 1 - l }); }
      else if (d.c.ruolo === "schivatore" && this.rng() < 0.15) { this._log(`${d.c.nome} schiva!`, { lato: 1 - l, anim: "schiva", bersaglio: 1 - l }); }
      else if (d.sin && d.sin.para && this.rng() < d.sin.para / 100) { this._log(`${d.c.nome} para il colpo con la Forza!`, { lato: 1 - l, anim: "schiva", bersaglio: 1 - l }); }
      else colpito = true;
    }
    // Far West: la prima mossa d'attacco dopo l'ingresso è un'estrazione rapida (anche a vuoto, la pistola è scarica)
    const estrae = m.pot > 0 && a.pronta && a.sin && a.sin.duello;
    if (estrae && colpito) this._log(`Estrazione rapida! ${a.c.nome} spara per primo.`, { lato: l });
    if (estrae && !colpito) a.pronta = false;
    if (colpito && m.pot > 0) {
      const n = m.colpi || 1;
      for (let k = 0; k < n && d.pv > 0; k++) {
        const r = this.calcolaDanno(l, a, d, m, true);
        let dmg = r.danno;
        if (d.scudo) { dmg = Math.max(1, Math.round(dmg * (1 - d.scudo / 100))); d.scudo = 0; }
        d.pv = Math.max(0, d.pv - dmg);
        const cade = d.pv <= 0;
        totale += dmg;
        const nota = r.stile > 1 ? " Super efficace!" : r.stile < 1 ? " Poco efficace." : "";
        this._log(`${r.crit ? "Critico! " : ""}${d.c.nome} perde ${dmg} PV.${nota}`, { lato: l, colpo: 1 - l, danno: dmg, crit: r.crit, stile: a.c.stile, efficace: r.stile });
        if (cade) this._rialza(1 - l, d);
        if (r.parato) { const n = this.gv(1 - l, "specchio"); O.energia = Math.min(ENERGIA_MAX, O.energia + n); this._log(`Graffito Specchio: il critico rimbalza, ${O.nome} prende +${n} energia.`, { lato: 1 - l, anim: "energia", su: 1 - l, graffito: "specchio" }); }
        const spina = this.gv(1 - l, "spina");
        if (spina && a.pv > 0) { const rif = Math.max(1, Math.round(dmg * spina / 100)); a.pv = Math.max(0, a.pv - rif); this._log(`Graffito Spina: ${a.c.nome} si punge e perde ${rif} PV.`, { lato: 1 - l, colpo: l, danno: rif, graffito: "spina" }); this._rialza(l, a); }
      }
      // Carte da gioco: a volte fanno «Scopa!» e il colpo si ripete a metà danni (una volta per mossa)
      if (a.sin && a.sin.fortuna && d.pv > 0 && a.pv > 0 && this.rng() < a.sin.fortuna / 100) {
        const r = this.calcolaDanno(l, a, d, m, true), dmg = Math.max(1, Math.round(r.danno / 2));
        d.pv = Math.max(0, d.pv - dmg); totale += dmg;
        this._log(`Scopa! ${a.c.nome} rilancia: ${d.c.nome} perde altri ${dmg} PV.`, { lato: l, colpo: 1 - l, danno: dmg, stile: a.c.stile, efficace: r.stile });
        if (d.pv <= 0) this._rialza(1 - l, d);
      }
      // mossa che drena e sinergia Demoni non si sommano: vale la più alta (prima si arrivava al 60% dei danni)
      a.pronta = false;
      const drena = Math.max(m.drena || 0, (a.sin && a.sin.vampiro) || 0);
      if (drena && totale > 0 && a.pv > 0) this._cura(l, a, Math.max(1, Math.round(totale * drena / 100)));
      if (a.c.ruolo === "ladro" && O.energia > 0 && this.rng() < 0.2) {
        O.energia--; L.energia = Math.min(ENERGIA_MAX, L.energia + 1);
        this._log(`${a.c.nome} ruba 1 energia.`, { lato: l });
      }
    }
    if (!e.tipo) return;
    if (SUL_BERSAGLIO.includes(e.tipo)) { if (colpito && d.pv > 0) this._effettoBersaglio(l, a, d, e); }
    else this._effettoSe(l, a, e);
  }

  _effettoBersaglio(l, a, d, e, rimbalzo = false) {
    const L = this.lati[l], O = this.lati[1 - l];
    if (!rimbalzo && d.sin && d.sin.schermo && this.rng() < d.sin.schermo / 100) {
      this._log(`${d.c.nome}: sistemi schermati, l'effetto non passa.`, { lato: 1 - l, anim: "scudo", su: 1 - l });
      // con 5 Cyborg l'effetto respinto torna indietro su chi l'ha lanciato (una volta sola, niente ping-pong)
      if (d.sin.rimbalza && a.pv > 0) { this._log(`L'effetto rimbalza su ${a.c.nome}!`, { lato: 1 - l }); this._effettoBersaglio(1 - l, d, a, e, true); }
      return;
    }
    if (e.tipo === "brucia") {
      if (d.c.ruolo === "incendiario") { this._log(`${d.c.nome} non brucia.`, { lato: 1 - l }); return; }
      const turni = Math.max(1, e.turni + (a.c.ruolo === "incendiario" ? 1 : 0) + (a.sin && a.sin.effetti ? 1 : 0) - (this.campo === "pioggia" ? 1 : 0));
      d.stati.brucia = { val: Math.round(e.val * (1 + ((a.sin && a.sin.forzaEff) || 0) / 100)), turni };
      this._log(`${d.c.nome} brucia per ${turni} turni.`, { lato: l, anim: "brucia", su: 1 - l });
    } else if (d.immuneEffetti && (e.tipo === "stordisci" || e.tipo === "indebolisci")) {
      this._log(`${d.c.nome} è protetto da uno scudo magico: l'effetto non lo tocca.`, { lato: 1 - l });
    } else if (e.tipo === "stordisci" && (d.stordito || d.immuneFino >= this.turno)) {
      // appena ripreso da uno stordimento: per un turno non si può stordire di nuovo (niente stordimenti a catena)
      this._log(`${d.c.nome} si è appena ripreso: resiste allo stordimento.`, { lato: 1 - l });
    } else if (e.tipo === "stordisci") {
      if (this.rng() < e.val * (1 + ((a.sin && a.sin.forzaEff) || 0) / 100) / 100) { d.stordito = true; this._log(`${d.c.nome} è stordito!`, { lato: l, anim: "stordito", su: 1 - l }); }
      else this._log(`${d.c.nome} resiste allo stordimento.`, { lato: 1 - l });
    } else if (e.tipo === "indebolisci") {
      const turni = e.turni + (a.c.ruolo === "stregone" ? 1 : 0) + (a.sin && a.sin.effetti ? 1 : 0);
      d.buff.debole = { val: Math.min(80, Math.round(e.val * (1 + ((a.sin && a.sin.forzaEff) || 0) / 100))), turni };
      this._log(`Attacco di ${d.c.nome} −${e.val}% per ${turni} turni.`, { lato: l, anim: "debole", su: 1 - l });
    } else if (e.tipo === "ruba") {
      const n = Math.min(e.val, O.energia);
      O.energia -= n; L.energia = Math.min(ENERGIA_MAX, L.energia + n);
      if (n) this._log(`${a.c.nome} ruba ${n} energia.`, { lato: l });
    }
  }

  _effettoSe(l, a, e) {
    const L = this.lati[l];
    // "potenzia" vale per tutta la squadra: se chi l'ha usata va KO, chi entra tiene il bonus per i turni che restano.
    // Se un compagno ha già un bonus più forte, tiene il suo.
    if (e.tipo === "potenzia") {
      for (const x of L.squadra) if (x.pv > 0 && (!x.buff.att || x.buff.att.val <= e.val)) x.buff.att = { val: e.val, turni: e.turni };
      this._log(`Attacco di tutta la squadra +${e.val}% per ${e.turni} turni.`, { lato: l, anim: "potenzia", su: l });
    }
    else if (e.tipo === "scudo") { a.scudo = e.val; this._log(`${a.c.nome} si protegge: il prossimo colpo fa il ${e.val}% di danni in meno.`, { lato: l, anim: "scudo", su: l }); }
    else if (e.tipo === "nebbia") {
      if (a.ultimaNebbia === this.turno - 1) { this._log(`${a.c.nome} prova a sparire di nuovo, ma non ci riesce.`, { lato: l }); }
      else { a.nebbia = true; a.nebbiaFino = this.turno + (this._mosso && this._mosso[1 - l] ? 1 : 0); this._log(`${a.c.nome} sparisce per un turno: il prossimo attacco nemico andrà a vuoto.`, { lato: l, anim: "nebbia", su: l }); }
      a.ultimaNebbia = this.turno;
    }
    else if (e.tipo === "cura") this._cura(l, a, Math.round(pvCura(a) * e.val / 100));
    else if (e.tipo === "energia") { L.energia = Math.min(ENERGIA_MAX, L.energia + e.val); this._log(`${L.nome} guadagna ${e.val} energia.`, { lato: l, anim: "energia", su: l }); }
  }

  // Creature mistiche: alla prima caduta si rialzano (non conta come cura: niente tempio né sirene)
  _rialza(l, x) {
    if (x.pv > 0 || !x.sin || !x.sin.rinascita || x.rialzato) return;
    x.rialzato = true;
    if (this.rng() >= x.sin.rinascita / 100) return;
    x.pv = Math.max(1, Math.round(x.pvMax * .2));
    x.stati = {}; x.stordito = false;
    this._log(`${x.c.nome} non muore così facilmente: si rialza con ${x.pv} PV!`, { lato: l, cura: l, quanto: x.pv });
  }
  _cura(l, x, n) {
    if (this.campo === "tempio") n *= 2;
    if (this.turno >= TURNO_SIRENE) n = Math.round(n / 2);
    const prima = x.pv;
    x.pv = Math.min(x.pvMax, x.pv + n);
    if (x.pv > prima) this._log(`${x.c.nome} recupera ${x.pv - prima} PV.`, { lato: l, cura: l, quanto: x.pv - prima });
  }

  _controllaKO() {
    for (const l of [0, 1]) {
      const a = this.attivo(l);
      if (a.pv <= 0 && !a.koAnnunciato) { a.koAnnunciato = true; this._log(`${a.c.nome} è KO!`, { lato: l, ko: l }); }
    }
    const finiti = [0, 1].filter(l => this.vivi(l).length === 0);
    if (finiti.length && this.vincitore < 0) {
      // doppio KO nello stesso momento (bruciature o sirene a fine turno): vince il giocatore
      this.vincitore = finiti.length === 2 ? 0 : 1 - finiti[0];
      if (finiti.length === 2) this._log("Doppio KO! Restate a terra tutti e due, ma l'ultimo a cadere è il nemico.", { avviso: true });
      this._log(this.vincitore === 0 ? "Hai vinto!" : "Hai perso.", { fine: true });
    }
  }

  _fineTurno() {
    // l'invisibilità dura un turno solo: se nessuno l'ha colpita, finisce qui
    for (const l of [0, 1]) { const a = this.attivo(l); if (a.nebbia && this.turno >= (a.nebbiaFino ?? this.turno)) { a.nebbia = false; this._log(`${a.c.nome} torna visibile.`, { lato: l }); } }
    for (const l of [0, 1]) {
      const L = this.lati[l], a = this.attivo(l);
      if (a.pv > 0) {
        const b = a.stati.brucia;
        if (b) {
          const dmg = Math.max(1, Math.round(pvCura(a) * b.val / 100 * (a.bruciaX || 1)));
          a.pv = Math.max(0, a.pv - dmg);
          this._log(`${a.c.nome} brucia: −${dmg} PV.`, { lato: l, colpo: l, danno: dmg, stile: "FOR", brucia: true });
          if (--b.turni <= 0) delete a.stati.brucia;
          this._rialza(l, a);
        }
        if (a.rigenera && a.pv > 0 && a.pv < a.pvMax && !a.stati.brucia) this._cura(l, a, Math.max(1, Math.round(pvCura(a) * a.rigenera / 100)));
        if (a.sin && a.sin.rigenera && a.pv > 0 && a.pv < a.pvMax) this._cura(l, a, Math.max(1, Math.round(pvCura(a) * a.sin.rigenera / 100)));
        if (a.sin && a.sin.accumulo && a.pv > 0 && (a.carica_el || 0) < 5) { a.carica_el = (a.carica_el || 0) + 1; this._log(`${a.c.nome} si carica di energia elementale: +${String(Math.round(a.carica_el * a.sin.accumulo * 10) / 10).replace(".", ",")}% attacco.`, { lato: l, anim: "potenzia", su: l }); }
        const cuore = this.gv(l, "cuore");
        if (cuore && a.pv > 0 && a.pv < a.pvMax) this._cura(l, a, Math.max(1, Math.round(pvCura(a) * cuore / 100)));
        if (a.pv > 0 && a.c.ruolo === "guaritore") {
          this._cura(l, a, Math.round(pvCura(a) * 0.05));
          for (const x of L.squadra) if (x !== a && x.pv > 0 && x.pv < x.pvMax) x.pv = Math.min(x.pvMax, x.pv + Math.round(x.pvMax * (this.turno >= TURNO_SIRENE ? 0.01 : 0.02)));
        }
        if (a.pv > 0 && this.campo === "lava") {
          const dmg = Math.max(1, Math.round(pvCura(a) * 0.02));
          a.pv = Math.max(0, a.pv - dmg);
          this._log(`La lava scotta: ${a.c.nome} perde ${dmg} PV.`, { lato: l, colpo: l, danno: dmg, brucia: true });
          this._rialza(l, a);
        }
        if (a.pv > 0 && this.turno >= TURNO_SIRENE) {
          const pct = 4 + 2 * (this.turno - TURNO_SIRENE);
          const dmg = Math.max(1, Math.round(pvCura(a) * pct / 100));
          a.pv = Math.max(0, a.pv - dmg);
          this._log(`Sirene in arrivo: ${a.c.nome} perde ${dmg} PV.`, { lato: l, colpo: l, danno: dmg }); this._rialza(l, a);
        }
      }
      for (const x of L.squadra) {
        for (const k of Object.keys(x.buff)) if (--x.buff[k].turni <= 0) delete x.buff[k];
        x.carica = false;
      }
      const extra = (a.pv > 0 && a.c.ruolo === "stratega") ? 1 : 0;
      // Fulmine dà +1 energia anche a inizio turno 4, Blackout ne toglie 1 al nemico
      const g4 = this.turno === 3 && L.graffito;
      const piu = g4 && L.graffito.id === "fulmine" ? 1 : 0, meno = this.turno === 3 && this.lati[1 - l].graffito && this.lati[1 - l].graffito.id === "blackout" ? 1 : 0;
      const spinta = L.spintaEnergia > 0 ? (L.spintaEnergia--, 1) : 0;   // sinergia Mafiosi: +1 a fine turno nei primi turni
      L.energia = Math.max(0, Math.min(ENERGIA_MAX, L.energia + ENERGIA_TURNO + extra + piu - meno + spinta));
    }
    this._controllaKO();
    this.turno++;
    if (this.vincitore < 0) {
      this._log(`— Turno ${this.turno} —`, { separatore: true });
      if (this.turno === TURNO_SIRENE - 5) this._log("Tra 5 turni arrivano le sirene: da lì le cure valgono la metà e ogni turno si perdono PV. Conviene chiudere!", { avviso: true });
      if (this.turno === TURNO_SIRENE) this._log("Arrivano le sirene! Da ora le cure valgono la metà e ogni turno si perdono PV.", { avviso: true });
    }
  }

  // ---------------- Intelligenza del computer ----------------
  // abilita: 0..1 (quanto spesso sceglie la mossa migliore invece di una a caso)
  scegliAzione(l, abilita) {
    const L = this.lati[l], a = this.attivo(l), d = this.attivo(1 - l);
    const usabili = a.c.mosse.map((m, i) => i).filter(i => L.energia >= a.c.mosse[i].costo);
    if ((this.rngIA || this.rng)() > abilita) {
      if ((this.rngIA || this.rng)() < 0.15) return { tipo: "carica" };
      return { tipo: "mossa", i: usabili[Math.floor((this.rngIA || this.rng)() * usabili.length)] };
    }
    // Cambio se è in svantaggio di tipo: dalla difficoltà media in su (abilità ≥ 0,6) già sotto metà PV, come farebbe un giocatore.
    // Sceglie chi ha il vantaggio sul nemico (o almeno non è in svantaggio) e più PV; non cambia due turni di fila.
    const soglia = abilita >= 0.6 ? 0.5 : 0.35;
    if (a.pv / a.pvMax < soglia && multStile(d.c.stile, a.c.stile) > 1 && L.ultimoCambio !== this.turno - 1 && (this.rngIA || this.rng)() < (abilita >= 0.6 ? abilita * 0.85 : abilita * 0.5)) {
      let i = -1, top = -Infinity;
      L.squadra.forEach((x, k) => {
        if (k === L.attivo || x.pv <= 0 || multStile(d.c.stile, x.c.stile) > 1) return;
        const p = multStile(x.c.stile, d.c.stile) * 100 + x.pv / x.pvMax * 50;
        if (p > top) { top = p; i = k; }
      });
      if (i >= 0) { L.ultimoCambio = this.turno; return { tipo: "cambio", i }; }
    }
    let meglio = usabili[0], punti = -1;
    for (const i of usabili) {
      const p = this._valuta(l, a, d, a.c.mosse[i]);
      if (p > punti) { punti = p; meglio = i; }
    }
    // Se ha solo la mossa base e poca energia, a volte carica per la mossa finale
    if (a.c.mosse[meglio].costo === 0 && L.energia < 5 && L.energia >= 3 && (this.rngIA || this.rng)() < 0.3) return { tipo: "carica" };
    return { tipo: "mossa", i: meglio };
  }

  _valuta(l, a, d, m) {
    let p = 0;
    if (m.pot > 0) {
      p = this.calcolaDanno(l, a, d, m, false).danno * (m.colpi || 1);
      if (p >= d.pv) p += 100; // KO sicuro
    }
    const e = m.eff;
    if (e) {
      if (e.tipo === "cura") p += a.pv / a.pvMax < 0.6 ? a.pvMax * e.val / 100 : 2;
      if (e.tipo === "scudo") p += a.scudo ? 0 : 16;
      if (e.tipo === "nebbia") p += (a.nebbia || a.ultimaNebbia === this.turno - 1) ? 0 : 15;
      if (e.tipo === "potenzia") p += a.buff.att ? 0 : 22;
      if (e.tipo === "energia") p += this.lati[l].energia < 4 ? 16 : 4;
      if (e.tipo === "brucia") p += d.stati.brucia ? 0 : d.pvMax * e.val / 100 * e.turni * 0.7;
      if (e.tipo === "stordisci") p += d.stordito || d.immuneFino >= this.turno ? 0 : 20 * e.val / 100;
      if (e.tipo === "indebolisci") p += d.buff.debole ? 0 : 14;
      if (e.tipo === "ruba") p += 7 * e.val;
    }
    return p;
  }

  scegliSostituto(l) {
    const L = this.lati[l], d = this.attivo(1 - l);
    let meglio = -1, punti = -Infinity;
    L.squadra.forEach((x, i) => {
      if (x.pv <= 0) return;
      const p = multStile(x.c.stile, d.c.stile) * 100 + x.pv / x.pvMax * 50;
      if (p > punti) { punti = p; meglio = i; }
    });
    return meglio;
  }
}

if (typeof module !== "undefined") module.exports = { Battaglia, multStile, ENERGIA_MAX, valoreGraffito, GRAFFITI_COPPIE, OGGETTI_EFFETTI, sinergieDi, SINERGIE, applicaSinergie, MULTIVERSO, SOGLIE_SINERGIA, valSinergia, CAMPI, ORDINE_CAMPI };
