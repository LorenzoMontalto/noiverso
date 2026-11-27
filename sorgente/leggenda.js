// ============================================================
//  STORIA · LIVELLO LEGGENDA
//  Si sblocca battendo il boss finale della storia normale. Stessi capitoli, stesse tappe e stessi nemici,
//  ma tutti al livello 30 con la lode (poi anche olografici e Ultra), un computer che gioca meglio
//  e, in ogni capitolo, una regola speciale che cambia il modo di giocare.
//  Progressi separati (S.leggenda): stelle, scrigni e tappe viste hanno il loro registro.
// ============================================================

// Le regole speciali: una per capitolo (la chiave è l'id del capitolo). Valgono per i nemici, alcune anche per te.
// Usano gli stessi meccanismi delle sinergie e del boss del giorno: x.sin.* (vedi motore.js), scudo, furia, energia.
const REGOLE_LEGGENDA = {
  c1:  { ico: "💼", nome: "Il racket", desc: "I nemici partono con 2 energia in più.", applica: B => { B.lati[1].energia += 2; } },
  c2:  { ico: "🔥", nome: "Spirito combattivo", desc: "Sotto metà dei PV i nemici fanno il 25% di danni in più.", applica: B => nemici(B, x => { x.furia = 25; }) },
  c3:  { ico: "🛡️", nome: "Armature", desc: "Il primo colpo che ogni nemico subisce fa il 45% di danni in meno.", applica: B => nemici(B, x => { x.scudo = 45; }) },
  c4:  { ico: "✨", nome: "Benedizione dell'Olimpo", desc: "A fine turno i nemici in campo recuperano il 4% dei PV.", applica: B => nemici(B, x => { x.sin.rigenera = (x.sin.rigenera || 0) + 4; }) },
  c6:  { ico: "🪄", nome: "Fuoco magico", desc: "Le bruciature dei nemici ti fanno il doppio dei danni.", applica: B => B.lati[0].squadra.forEach(x => { x.bruciaX = 2; }) },
  c7:  { ico: "📦", nome: "Merce sequestrata", desc: "Il tuo zaino resta chiuso: niente oggetti in questa battaglia.", applica: B => { B.zaino = null; } },
  c8:  { ico: "🏜️", nome: "Tempesta di sabbia", desc: "Parti con 1 energia in meno; i nemici con 1 in più.", applica: B => { B.lati[0].energia = Math.max(0, B.lati[0].energia - 1); B.lati[1].energia += 1; } },
  c9:  { ico: "🎠", nome: "Giostra impazzita", desc: "I nemici hanno 6 di velocità in più: attaccano quasi sempre per primi.", applica: B => nemici(B, x => { x.vel += 6; }) },
  c10: { ico: "🌋", nome: "Pelle di magma", desc: "I nemici non si fanno stordire né indebolire.", applica: B => nemici(B, x => { x.immuneEffetti = true; }) },
  c11: { ico: "🩸", nome: "Sete di anime", desc: "I nemici recuperano in PV il 15% dei danni che fanno.", applica: B => nemici(B, x => { x.sin.vampiro = (x.sin.vampiro || 0) + 15; }) },
  c12: { ico: "⏰", nome: "Straordinari", desc: "Nei primi 4 turni i nemici guadagnano 1 energia in più a fine turno.", applica: B => { B.lati[1].spintaEnergia = (B.lati[1].spintaEnergia || 0) + 4; } },
  c16: { ico: "🍩", nome: "D'oh!", desc: "I nemici fanno colpi critici molto più spesso (+18%).", applica: B => nemici(B, x => { x.sin.crit = (x.sin.crit || 0) + 18; }) },
  c17: { ico: "🫧", nome: "Barbatrucco", desc: "Per i nemici lo svantaggio di tipo pesa la metà, in attacco e in difesa.", applica: B => nemici(B, x => { x.sin.forma = Math.max(x.sin.forma || 0, 50); }) },
  c18: { ico: "🌌", nome: "Il lato oscuro", desc: "I nemici parano il 10% degli attacchi (niente danni né effetti).", applica: B => nemici(B, x => { x.sin.para = (x.sin.para || 0) + 10; }) },
  c19: { ico: "🌀", nome: "Furia degli elementi", desc: "Restando in campo i nemici si caricano: +7% di attacco a ogni fine turno, fino a 5 volte.", applica: B => nemici(B, x => { x.sin.accumulo = Math.max(x.sin.accumulo || 0, 7); }) },
  c20: { ico: "🧛", nome: "Non morti", desc: "La prima volta che vanno KO i nemici hanno il 30% di probabilità di rialzarsi.", applica: B => nemici(B, x => { x.sin.rinascita = Math.max(x.sin.rinascita || 0, 30); }) },
  c21: { ico: "🤖", nome: "Schermatura", desc: "I nemici respingono metà dei tuoi effetti (bruciatura, stordimento, indebolimento, furto di energia).", applica: B => nemici(B, x => { x.sin.schermo = Math.max(x.sin.schermo || 0, 50); }) },
  c22: { ico: "🃏", nome: "Asso nella manica", desc: "Il 22% degli attacchi nemici fa «Scopa!» e colpisce una seconda volta a metà danni.", applica: B => nemici(B, x => { x.sin.fortuna = Math.max(x.sin.fortuna || 0, 22); }) },
  c23: { ico: "🏠", nome: "Giocano in casa", desc: "Quando entrano in campo i nemici recuperano il 20% dei PV massimi.", applica: B => nemici(B, x => { x.sin.ospitalita = Math.max(x.sin.ospitalita || 0, 20); }) },
  c24: { ico: "🤠", nome: "Pistola facile", desc: "Il primo attacco di ogni nemico appena entrato in campo fa il 35% di danni in più.", applica: B => nemici(B, x => { x.sin.duello = Math.max(x.sin.duello || 0, 35); x.pronta = true; }) },
  c25: { ico: "☢️", nome: "Sopravvissuti", desc: "Sotto il 35% dei PV i nemici subiscono il 40% di danni in meno.", applica: B => nemici(B, x => { x.sin.sopravvive = Math.max(x.sin.sopravvive || 0, 40); }) },
  c26: { ico: "⛩️", nome: "Bushidō", desc: "Per ogni compagno già KO i nemici fanno il 10% di danni in più.", applica: B => nemici(B, x => { x.sin.onore = Math.max(x.sin.onore || 0, 10); }) },
  c27: { ico: "🎪", nome: "Gran finale", desc: "I nemici partono con 1 energia in più e le loro mosse da 5 energia fanno il 25% di danni in più.", applica: B => { B.lati[1].energia += 1; nemici(B, x => { x.sin.finale = Math.max(x.sin.finale || 0, 25); }); } },
  c28: { ico: "🍀", nome: "Fortuna sfacciata", desc: "Quando un colpo li manderebbe KO, i nemici hanno il 25% di probabilità di restare in piedi con 1 PV.", applica: B => nemici(B, x => { x.sin.miracolo = Math.max(x.sin.miracolo || 0, 25); }) },
  c29: { ico: "🎨", nome: "Contrasti", desc: "Quando colpiscono in vantaggio di tipo, i nemici fanno il 40% di danni in più.", applica: B => nemici(B, x => { x.sin.contrasto = Math.max(x.sin.contrasto || 0, 40); }) },
  c30: { ico: "🖼️", nome: "Capolavori", desc: "Quando un nemico entra in campo hai il 35% di probabilità di restare incantato e saltare il turno.", applica: B => nemici(B, x => { x.sin.incanto = Math.max(x.sin.incanto || 0, 35); }) },
  c13: { ico: "🪞", nome: "Lo specchio", desc: "I nemici hanno il 10% in più di PV, attacco e difesa.", applica: B => nemici(B, x => { x.pvMax = Math.round(x.pvMax * 1.1); x.pv = x.pvMax; x.att *= 1.1; x.dif *= 1.1; }) },
  c14: { ico: "🚂", nome: "A tutta velocità", desc: "I nemici fanno più critici (+10%) e i loro critici fanno il doppio dei danni.", applica: B => nemici(B, x => { x.sin.crit = (x.sin.crit || 0) + 10; x.sin.critX = Math.max(x.sin.critX || 1.5, 2); }) },
  c15: { ico: "⏳", nome: "Il tempo si ferma", desc: "I nemici partono con 5 energia: possono usare subito la mossa più forte.", applica: B => { B.lati[1].energia = Math.max(B.lati[1].energia, 5); } },
  c5:  { ico: "👑", nome: "Tutti contro di te", desc: "Un po' di tutto: i nemici partono con 2 energia in più, recuperano il 2% dei PV a turno e il primo colpo che subiscono fa il 30% in meno.",
         applica: B => { B.lati[1].energia += 2; nemici(B, x => { x.sin.rigenera = (x.sin.rigenera || 0) + 2; x.scudo = Math.max(x.scudo || 0, 30); }); } },
};
function nemici(B, f) { for (const x of B.lati[1].squadra) { x.sin = x.sin || {}; f(x); } }

// TARATURA_LEGGENDA: per ogni tappa, di quanto sono più forti (+) o più deboli (−) i nemici, in % su PV e attacco.
// Calcolata con una simulazione (controlli/leggenda.js, 300 partite per prova): una squadra «da fine gioco» (tutte al 30
// con la lode: 3 leggendarie + 2 epiche, oppure 5 carte di una serie) vince circa il 68% della prima tappa, poi sempre
// meno, fino al 12-14% contro il boss finale; i boss di ogni capitolo sono la tappa più dura del capitolo.
// Misurata di nuovo con 500 partite nuove: in media a 2,5 punti dal bersaglio. Le regole contano già: per esempio
// nel capitolo 4 (rigenerazione) i nemici sono più deboli del 10%, nel 7 (zaino chiuso… che il simulatore non usa) più forti.
// Si ricalcola con: node controlli/leggenda.js 300 0 2 & node controlli/leggenda.js 300 1 2 (unire i due JSON).
const TARATURA_LEGGENDA = {
  "c1-0": 26, "c1-1": 15, "c1-2": 19, "c1-3": 6, "c1-4": 2, "c1-5": -2,
  "c2-0": 17, "c2-1": 6, "c2-2": 15, "c2-3": 7, "c2-4": -1, "c2-5": -2,
  "c3-0": 17, "c3-1": -1, "c3-2": 3, "c3-3": 17, "c3-4": -11, "c3-5": -7,
  "c4-0": -3, "c4-1": 1, "c4-2": -10, "c4-3": 3, "c4-4": -11, "c4-5": -13,
  "c6-0": 26, "c6-1": 25, "c6-2": 8, "c6-3": -7, "c6-4": 1, "c6-5": -13,
  "c7-0": 28, "c7-1": 27, "c7-2": 35, "c7-3": 7, "c7-4": 12, "c7-5": 2,
  "c8-0": 26, "c8-1": 18, "c8-2": 8, "c8-3": 27, "c8-4": 2, "c8-5": 3,
  "c9-0": 27, "c9-1": 27, "c9-2": 12, "c9-3": 10, "c9-4": -2, "c9-5": -1,
  "c10-0": 29, "c10-1": 23, "c10-2": -1, "c10-3": 19, "c10-4": 10, "c10-5": 6,
  "c11-0": 11, "c11-1": 10, "c11-2": 11, "c11-3": 6, "c11-4": 3, "c11-5": 6,
  "c12-0": 11, "c12-1": 9, "c12-2": -2, "c12-3": -3, "c12-4": -4, "c12-5": -8,
  "c16-0": 5, "c16-1": -8, "c16-2": 3, "c16-3": 9, "c16-4": -11, "c16-5": 1,
  "c17-0": 20, "c17-1": 14, "c17-2": 8, "c17-3": 7, "c17-4": -3, "c17-5": -3,
  "c18-0": 6, "c18-1": 9, "c18-2": 2, "c18-3": -7, "c18-4": -4, "c18-5": 14,
  "c19-0": 15, "c19-1": 15, "c19-2": 4, "c19-3": 15, "c19-4": 12, "c19-5": -5,
  "c20-0": 11, "c20-1": 19, "c20-2": 15, "c20-3": 8, "c20-4": -8, "c20-5": 4,
  "c21-0": 24, "c21-1": 18, "c21-2": 19, "c21-3": 8, "c21-4": 3, "c21-5": -1,
  "c22-0": 22, "c22-1": 29, "c22-2": 17, "c22-3": 6, "c22-4": 14, "c22-5": 1,
  "c23-0": 20, "c23-1": 20, "c23-2": 23, "c23-3": 18, "c23-4": 7, "c23-5": -1,
  "c24-0": 23, "c24-1": 20, "c24-2": 10, "c24-3": 11, "c24-4": 5, "c24-5": 1,
  "c25-0": 27, "c25-1": 22, "c25-2": 15, "c25-3": 7, "c25-4": -2, "c25-5": 0,
  "c26-0": 15, "c26-1": 21, "c26-2": 17, "c26-3": 16, "c26-4": -1, "c26-5": -1,
  "c27-0": 23, "c27-1": 17, "c27-2": 4, "c27-3": 3, "c27-4": -5, "c27-5": -10,
  "c28-0": 23, "c28-1": 20, "c28-2": 7, "c28-3": 10, "c28-4": -4, "c28-5": -1,
  "c29-0": 11, "c29-1": 19, "c29-2": 11, "c29-3": 15, "c29-4": 10, "c29-5": 2,
  "c30-0": 24, "c30-1": 25, "c30-2": 15, "c30-3": 4, "c30-4": -3, "c30-5": -4,
  "c13-0": 1, "c13-1": 2, "c13-2": -10, "c13-3": 1, "c13-4": -9, "c13-5": 17,
  "c14-0": 20, "c14-1": 10, "c14-2": -3, "c14-3": 14, "c14-4": 19, "c14-5": 3,
  "c15-0": 33, "c15-1": 8, "c15-2": 12, "c15-3": -8, "c15-4": 15, "c15-5": 9,
  "c5-0": 0, "c5-1": -1, "c5-2": 6, "c5-3": 3, "c5-4": -18, "c5-5": -8,
};

const Leggenda = (() => {
  const N_TAPPE = 6;
  // dove sei nella Leggenda, da 0 (prima tappa) a 1 (boss finale)
  const avanzamento = (k, i) => (k * N_TAPPE + i) / (STORIA.length * N_TAPPE - 1);
  const regola = k => REGOLE_LEGGENDA[STORIA[k].id] || { ico: "", nome: "", desc: "", applica: () => {} };
  const forza = (k, i) => (TARATURA_LEGGENDA[`${STORIA[k].id}-${i}`] || 0);
  // la tappa in versione Leggenda: stessi nemici, tutti al 30 con la lode; olografici dal capitolo 11, anche Ultra dal 21
  function tappa(k, i) {
    const t = STORIA[k].tappe[i], p = avanzamento(k, i), g = k * N_TAPPE + i;
    const olo = k >= 10, ultra = k >= 20;
    const monete = Math.round((100 + 2 * g) / 10) * 10 * (t.boss ? 2 : 1);
    const framm = (15 + Math.floor(g / 6)) * (t.boss ? 3 : 1);
    const potU = t.boss ? 5 + Math.floor(k / 3) : 0;
    const bustina = !t.boss ? "" : k === STORIA.length - 1 ? "ultra" : k >= 20 ? "leggendaria" : k >= 10 ? "epica" : "";
    return Object.assign({}, t, {
      nemici: t.nemici.map(id => ({ id, liv: LIVELLO_MAX, lode: true, olo, ultra })),
      liv: [LIVELLO_MAX, LIVELLO_MAX], abilita: Math.min(1, .9 + .1 * p), forza: forza(k, i),
      monete, framm, potU, bustina, bustine: 1, leggenda: true,
    });
  }
  // la battaglia: regola del capitolo e forza della tappa (anche per chi guarda: tutto deterministico)
  function prepara(B, k, i) {
    const f = 1 + forza(k, i) / 100;
    if (f !== 1) nemici(B, x => { x.pvMax = Math.max(1, Math.round(x.pvMax * f)); x.pv = x.pvMax; x.att *= f; });
    regola(k).applica(B);
  }
  // scrigni del capitolo (si aprono con le stelle, come nella storia normale)
  function scrigni(k) {
    const cap = STORIA[k];
    return [
      { id: `L${cap.id}-9`, stelle: 9, frammenti: 80 + 5 * k, testo: `${80 + 5 * k} frammenti ◈` },
      { id: `L${cap.id}-18`, stelle: 18, potU: 8 + Math.floor(k / 3), bustina: k >= 15 ? "leggendaria" : "", testo: `${8 + Math.floor(k / 3)} potenziatori universali ✪${k >= 15 ? " e una Bustina Leggendaria" : ""}` },
    ];
  }
  return { tappa, prepara, regola, scrigni, avanzamento };
})();
if (typeof module !== "undefined") module.exports = { REGOLE_LEGGENDA, TARATURA_LEGGENDA };
