// ============================================================
//  CONTENUTI DEL GIOCO: serie, rarità, stili, ruoli e carte.
//  Per aggiungere una carta: metti l'immagine in img/<id>.webp
//  (formato 5:7, es. 520×728) e aggiungi una riga in CARTE.
// ============================================================

// Le serie dell'album (l'id "nueve" resta per non perdere i salvataggi: è la serie Mafiosi)
const SERIE = {
  eroi:  { nome: "Supereroi",   colore: "#4c95ff", simbolo: "★", desc: "Il gruppo in costume, pronto a salvare (o rovinare) la serata." },
  db:    { nome: "Dragon Ball", colore: "#ff9a1f", simbolo: "✪", desc: "Guerrieri Saiyan, cyborg e namecciani: il torneo è appena iniziato." },
  dei:   { nome: "Dei",         colore: "#f2c14e", simbolo: "♛", desc: "L'Olimpo al completo, tra fulmini, mari in tempesta e inferi." },
  nueve: { nome: "Mafiosi",     colore: "#ff2e46", simbolo: "♠", desc: "La banda al completo, tra vicoli e luci al neon." },
  maghi: { nome: "Maghi",       colore: "#43d39e", simbolo: "☾", desc: "Bacchette, pozioni e una scuola di magia piena di guai." },
  demoni: { nome: "Demoni",     colore: "#d4145a", simbolo: "♆", desc: "Corna, troni e patti col diavolo: gli Inferi hanno aperto le porte." },
  mestieri: { nome: "Mestieri", colore: "#a6e22e", simbolo: "⚒", desc: "Hacker, spie, calciatori e pianisti: ognuno con il suo lavoro, tutti pronti a combattere." },
  simpson:  { nome: "Simpson", colore: "#ffd90f", simbolo: "◎", desc: "Ciambelle, Duff e la centrale nucleare: a Springfield tutti sono pronti a combattere." },
  barbapapa: { nome: "Barbapapà", colore: "#ff8fc8", simbolo: "✿", desc: "Barbatrucco! Una famiglia che cambia forma come vuole: spade, ombrelli, chitarre." },
  starwars: { nome: "Star Wars", colore: "#4fc3ff", simbolo: "☄", desc: "Jedi, Sith, ribelli e cacciatori di taglie, in una galassia lontana lontana." },
  elementi: { nome: "Elementi", colore: "#3fe0c0", simbolo: "❖", desc: "Fuoco, acqua, ghiaccio, fulmini, luce e ombra: i tuoi amici sono diventati i signori degli elementi." },
  creature: { nome: "Creature Mistiche", colore: "#9d7bff", simbolo: "☠", desc: "Vampiri, lupi mannari, mummie e sirene: quando sorge la luna piena escono tutti allo scoperto." },
  cyborg: { nome: "Cyborg", colore: "#38e0ff", simbolo: "⌬", desc: "Metà persone e metà macchine, tra grattacieli al neon e auto volanti: il futuro è arrivato e picchia forte." },
  carte: { nome: "Carte da Gioco", colore: "#e8b04a", simbolo: "♣", desc: "Re, cavalli, fanti e assi delle carte napoletane: coppe, denari, spade e bastoni scendono dal mazzo e si siedono al tavolo." },
  paesi: { nome: "Paesi del Mondo", colore: "#4fb87a", simbolo: "✈", desc: "Bandiere, costumi e monumenti: i tuoi amici fanno il giro del mondo, un paese a testa." },
  farwest: { nome: "Far West", colore: "#d9893b", simbolo: "✶", desc: "Saloon, sceriffi e fuorilegge: al tramonto, nel deserto, vince chi estrae per primo." },
  apocalisse: { nome: "Apocalisse", colore: "#e0552e", simbolo: "☣", desc: "Città in rovina, orde di infetti e un virus che non perdona: sopravvive solo chi resta in piedi fino all'ultimo." },
};

// peso = probabilità relativa di uscire nelle prime 3 carte della bustina
// peso4 = probabilità relativa nella 4ª carta (garantita almeno Rara)
// forza = moltiplicatore su PV, attacco e difesa: ogni gradino di rarità vale il 10% in più
// (es. stesso ruolo, Lv1: comune 100 PV → rara 110 → epica 120 → leggendaria 130)
const RARITA = {
  comune:      { nome: "Comune",      peso: 62,  peso4: 0,  forza: 1.00 },
  rara:        { nome: "Rara",        peso: 28,  peso4: 70, forza: 1.10 },
  epica:       { nome: "Epica",       peso: 8.5, peso4: 24, forza: 1.20 },
  leggendaria: { nome: "Leggendaria", peso: 1.5, peso4: 6,  forza: 1.30 },
};
const ORDINE_RARITA = ["comune", "rara", "epica", "leggendaria"];
const RARE_TOP = r => r === "leggendaria" || r === "ultra";   // per la regola "una a persona per serie"

// Tre tipi, e ognuno potenzia la sua statistica:
//   Forza    → +25% attacco                   batte Difesa   (la sfonda)
//   Difesa   → +5% difesa                     batte Velocità (para i colpi veloci)
//   Velocità → +5 velocità e +15% attacco     batte Forza    (schiva i colpi lenti)
// In più, potenziando, la statistica del tipo cresce più delle altre (vedi statistiche()).
// Numeri scelti con 4000 partite simulate: le carte Difesa sono già robuste per ruolo (tank, difensori),
// quelle Velocità fragili (schivatori, assassini), così ogni tipo pesa circa uguale in una squadra mista.
// Con +5 la carta Velocità più lenta arriva a 15, le altre al massimo a 12: a parità di livello una Velocità attacca sempre prima.
const STILI = {
  FOR: { nome: "Forza",    icona: "⚔️", batte: "DIF", bonus: "+25% attacco, e potenziando l'attacco cresce di più" },
  DIF: { nome: "Difesa",   icona: "🛡️", batte: "VEL", bonus: "+5% difesa, e potenziando la difesa cresce di più" },
  VEL: { nome: "Velocità", icona: "⚡", batte: "FOR", bonus: "+5 velocità (a parità di livello attacca sempre per prima) e +15% attacco, e potenziando la velocità cresce di più" },
};
const BONUS_TIPO = { FOR: { att: 1.25 }, DIF: { dif: 1.05 }, VEL: { vel: 5, att: 1.15 } };

// Statistiche base per ruolo (prima di rarità e livello) + abilità passiva.
// "cosa" = in due parole a cosa serve, mostrato sulla carta.
const RUOLI = {
  tank:          { nome: "Tank",          cosa: "Incassa i colpi",      pv: 150, att: 10, dif: 16, vel: 6,  passiva: "Subisce il 10% di danni in meno." },
  difensore:     { nome: "Difensore",     cosa: "Protegge con scudi",   pv: 145, att: 12, dif: 15, vel: 8,  passiva: "Quando entra in campo ottiene uno scudo del 30%." },
  guaritore:     { nome: "Guaritore",     cosa: "Cura la squadra",      pv: 115, att: 10, dif: 13, vel: 10, passiva: "A fine turno recupera il 5% dei PV se è in campo, e cura del 2% chi è in panchina." },
  schivatore:    { nome: "Schivatore",    cosa: "Evita gli attacchi",   pv: 100, att: 13, dif: 10, vel: 16, passiva: "15% di probabilità di schivare ogni attacco." },
  assassino:     { nome: "Assassino",     cosa: "Colpi critici",        pv: 95,  att: 16, dif: 9,  vel: 15, passiva: "Colpo critico al 20% invece del 6%." },
  picchiatore:   { nome: "Picchiatore",   cosa: "Più ferito, più forte", pv: 120, att: 15, dif: 9,  vel: 11, passiva: "Più è ferito, più picchia (fino a +50% attacco)." },
  capo:          { nome: "Capo",          cosa: "Potenzia la squadra",  pv: 115, att: 12, dif: 12, vel: 11, passiva: "Finché è in piedi, tutta la squadra ha +10% attacco." },
  imprevedibile: { nome: "Imprevedibile", cosa: "Danni a sorpresa",     pv: 105, att: 15, dif: 10, vel: 12, passiva: "I suoi danni variano moltissimo: da ×0,6 a ×1,5." },
  stratega:      { nome: "Stratega",      cosa: "Genera energia",       pv: 110, att: 12, dif: 12, vel: 12, passiva: "Se è in campo, la squadra guadagna +1 energia a turno." },
  ladro:         { nome: "Ladro",         cosa: "Ruba energia",         pv: 100, att: 12, dif: 10, vel: 15, passiva: "Ogni colpo andato a segno ha il 20% di rubare 1 energia." },
  incendiario:   { nome: "Incendiario",   cosa: "Brucia i nemici",      pv: 110, att: 15, dif: 10, vel: 12, passiva: "Le sue bruciature durano 1 turno in più. Immune alle bruciature." },
  stregone:      { nome: "Stregone",      cosa: "Indebolisce",          pv: 110, att: 13, dif: 11, vel: 11, passiva: "I suoi indebolimenti durano 1 turno in più." },
  tiratore:      { nome: "Tiratore",      cosa: "Danni dalla distanza", pv: 105, att: 16, dif: 10, vel: 11, passiva: "+10% danni con le mosse da 2 energia o più." },
};

// m(nome, costo energia, potenza, extra)
// extra può contenere:
//   eff: { tipo, val, turni }  tipi: brucia, stordisci, indebolisci, ruba (sul bersaglio)
//                                    potenzia, scudo, nebbia, cura, energia (su chi la usa)
//   colpi: n     (colpisce n volte)
//   drena: %     (cura il % dei danni inflitti)
//   penetra: %   (ignora il % della difesa)
function m(nome, costo, pot, extra = {}) { return { nome, costo, pot, ...extra }; }

const CARTE = [
  // ---------------- LOS NUEVE ----------------
  { id: "loca", nome: "La Loca", serie: "nueve", rarita: "leggendaria", stile: "FOR", ruolo: "imprevedibile",
    frase: "Nessuno sa cosa farà. Nemmeno lei.",
    mosse: [m("Brindisi Pazzo", 0, 30), m("Risata Isterica", 2, 24, { eff: { tipo: "stordisci", val: 50 } }), m("Ultimo Giro", 5, 98)] },
  { id: "fuego", nome: "La Fuego", serie: "nueve", rarita: "rara", stile: "FOR", ruolo: "incendiario",
    frase: "Dove passa lei resta solo cenere.",
    mosse: [m("Schiaffo Rovente", 0, 26, { eff: { tipo: "brucia", val: 4, turni: 2 } }), m("Benzina", 2, 38, { eff: { tipo: "brucia", val: 6, turni: 3 } }), m("Inferno", 5, 80, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "reina", nome: "La Reina", serie: "nueve", rarita: "leggendaria", stile: "DIF", ruolo: "capo",
    frase: "Non alza mai la voce. Non ne ha bisogno.",
    mosse: [m("Sguardo Gelido", 0, 30), m("Ordine Reale", 2, 0, { eff: { tipo: "potenzia", val: 35, turni: 3 } }), m("Corte Marziale", 5, 82, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "chapo", nome: "El Chapo", serie: "nueve", rarita: "rara", stile: "DIF", ruolo: "stratega",
    frase: "Ogni affare ha il suo prezzo.",
    mosse: [m("Sigaro", 0, 28), m("Affare Fatto", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Colpo Grosso", 5, 88)] },
  { id: "rojo", nome: "El Rojo", serie: "nueve", rarita: "comune", stile: "FOR", ruolo: "picchiatore",
    frase: "Più lo colpisci, più si arrabbia.",
    mosse: [m("Pugno Diretto", 0, 32), m("Rissa", 2, 48), m("Furia Rossa", 5, 92)] },
  { id: "ombra", nome: "El Ombra", serie: "nueve", rarita: "leggendaria", stile: "VEL", ruolo: "schivatore",
    frase: "Te ne accorgi quando è già finita.",
    mosse: [m("Lama nel Buio", 0, 30), m("Sparire", 3, 0, { eff: { tipo: "nebbia" } }), m("Colpo alle Spalle", 5, 80, { penetra: 35 })] },
  { id: "pelado", nome: "El Pelado", serie: "nueve", rarita: "comune", stile: "DIF", ruolo: "tank",
    frase: "Un muro con le catenine.",
    mosse: [m("Spallata", 0, 30), m("Muro", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Schiacciasassi", 5, 82)] },
  { id: "fiesta", nome: "La Fiesta", serie: "nueve", rarita: "comune", stile: "VEL", ruolo: "guaritore",
    frase: "La festa finisce quando lo dice lui.",
    mosse: [m("Cin Cin", 0, 26), m("Dopo Festa", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Fino all'Alba", 5, 72, { drena: 50 })] },
  { id: "diablo", nome: "El Diablo", serie: "nueve", rarita: "epica", stile: "DIF", ruolo: "stregone",
    frase: "Firma qui. Poi ne parliamo.",
    mosse: [m("Ghigno", 0, 30), m("Patto", 2, 30, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Fuoco Infernale", 5, 84, { eff: { tipo: "brucia", val: 5, turni: 2 } })] },
  { id: "bandita", nome: "La Bandita", serie: "nueve", rarita: "epica", stile: "VEL", ruolo: "ladro",
    frase: "Quello che è tuo è anche un po' suo.",
    mosse: [m("Borseggio", 0, 25, { eff: { tipo: "ruba", val: 1 } }), m("Rapina", 2, 36, { eff: { tipo: "ruba", val: 1 } }), m("Il Colpo", 5, 86)] },

  // ---------------- SUPEREROI ----------------
  { id: "gossip", nome: "Capitan Gossip", serie: "eroi", rarita: "epica", stile: "FOR", ruolo: "tiratore",
    frase: "Sa tutto di tutti, e lo spara a velocità della luce.",
    mosse: [m("Pugno Stellare", 0, 32), m("Raggio Fotonico", 2, 50), m("Supernova", 5, 95)] },
  { id: "comora", nome: "Comora", serie: "eroi", rarita: "rara", stile: "VEL", ruolo: "assassino",
    frase: "Sorride sempre. Anche prima di colpire.",
    mosse: [m("Taglio", 0, 32), m("Danza delle Lame", 2, 20, { colpi: 3 }), m("Esecuzione", 5, 88, { penetra: 40 })] },
  { id: "vedovagreca", nome: "Vedova Greca", serie: "eroi", rarita: "comune", stile: "VEL", ruolo: "schivatore",
    frase: "Sa già cosa stai per fare.",
    mosse: [m("Colpo Rapido", 0, 28), m("Pistole Gemelle", 2, 24, { colpi: 2 }), m("Infiltrazione", 5, 80, { penetra: 30 })] },
  { id: "spidertoto", nome: "Spider Toto", serie: "eroi", rarita: "epica", stile: "VEL", ruolo: "schivatore",
    frase: "Salta, schiva, sorride. Ripete.",
    mosse: [m("Calcio Acrobatico", 0, 30), m("Ragnatela", 2, 26, { eff: { tipo: "stordisci", val: 55 } }), m("Oscillata Finale", 5, 90)] },
  { id: "wonderrita", nome: "Wonder Rita", serie: "eroi", rarita: "rara", stile: "DIF", ruolo: "difensore",
    frase: "Nata per combattere, cresciuta per vincere.",
    mosse: [m("Bracciali", 0, 28), m("Lazo", 2, 28, { eff: { tipo: "stordisci", val: 40 } }), m("Carica Guerriera", 5, 88)] },
  { id: "stellascura", nome: "Stella Scura", serie: "eroi", rarita: "comune", stile: "FOR", ruolo: "tiratore",
    frase: "Brilla di più quando si arrabbia.",
    mosse: [m("Dardo Stellare", 0, 30), m("Raffica", 2, 18, { colpi: 3 }), m("Esplosione Stellare", 5, 88)] },
  { id: "mieloki", nome: "Mie Loki", serie: "eroi", rarita: "epica", stile: "DIF", ruolo: "stregone",
    frase: "Quello che vedi non è mai quello che c'è.",
    mosse: [m("Pugnale", 0, 30), m("Illusione", 2, 0, { eff: { tipo: "nebbia" } }), m("Inganno Supremo", 5, 80, { eff: { tipo: "indebolisci", val: 35, turni: 2 } })] },
  { id: "ironlus", nome: "Iron Lus", serie: "eroi", rarita: "leggendaria", stile: "FOR", ruolo: "tiratore",
    frase: "Genio, armatura e nessuna modestia.",
    mosse: [m("Repulsore", 0, 32), m("Missili", 2, 20, { colpi: 3 }), m("Raggio Centrale", 5, 100)] },
  { id: "cypips", nome: "CyPips", serie: "eroi", rarita: "comune", stile: "DIF", ruolo: "difensore",
    frase: "Metà uomo, metà blindato.",
    mosse: [m("Mitraglia", 0, 28), m("Blindatura", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Bombardamento", 5, 84)] },
  { id: "mauthor", nome: "Mau Thor", serie: "eroi", rarita: "leggendaria", stile: "FOR", ruolo: "picchiatore",
    frase: "Quando arriva lui, arriva anche il temporale.",
    mosse: [m("Martellata", 0, 34), m("Fulmine", 2, 42, { eff: { tipo: "stordisci", val: 30 } }), m("Tempesta Divina", 5, 95)] },
  { id: "undercut", nome: "Capitan Undercut", serie: "eroi", rarita: "rara", stile: "DIF", ruolo: "difensore",
    frase: "Si mette sempre in mezzo. Per fortuna.",
    mosse: [m("Lancio dello Scudo", 0, 30), m("Parata", 2, 0, { eff: { tipo: "scudo", val: 60 } }), m("Assalto", 5, 86)] },
  { id: "ligulk", nome: "Ligulk", serie: "eroi", rarita: "leggendaria", stile: "DIF", ruolo: "tank",
    frase: "Non farlo arrabbiare. Davvero.",
    mosse: [m("Schianto", 0, 34), m("Rabbia", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Distruzione", 5, 100)] },
  // ---------------- SUPEREROI (nuovi) ----------------
  { id: "wandessia", nome: "Wandessia", serie: "eroi", rarita: "epica", stile: "FOR", ruolo: "imprevedibile", frase: "La realtà fa quello che dice lei.",
    mosse: [m("Sfera Scarlatta", 0, 30), m("Distorsione", 2, 26, { eff: { tipo: "stordisci", val: 45 } }), m("Caos Scarlatto", 5, 94)] },
  { id: "waspy", nome: "Waspy", serie: "eroi", rarita: "rara", stile: "VEL", ruolo: "schivatore", frase: "Piccola, veloce e con il pungiglione.",
    mosse: [m("Puntura", 0, 28), m("Rimpicciolisci", 3, 0, { eff: { tipo: "nebbia" } }), m("Sciame", 5, 18, { colpi: 5 })] },
  { id: "diegkeye", nome: "Diegkeye", serie: "eroi", rarita: "comune", stile: "VEL", ruolo: "tiratore", frase: "Non sbaglia un colpo. Quasi mai.",
    mosse: [m("Freccia", 0, 30), m("Freccia Esplosiva", 2, 44), m("Pioggia di Frecce", 5, 22, { colpi: 4 })] },

  // ---------------- DRAGON BALL ----------------
  { id: "gokiele", nome: "Gokiele", serie: "db", rarita: "leggendaria", stile: "FOR", ruolo: "capo", frase: "Più è forte l'avversario, più si diverte.",
    mosse: [m("Pugno Saiyan", 0, 34), m("Teletrasporto", 2, 44, { penetra: 30 }), m("Onda Energetica Suprema", 5, 100)] },
  { id: "vegerizio", nome: "Vegerizio", serie: "db", rarita: "leggendaria", stile: "VEL", ruolo: "tiratore", frase: "Il principe non chiede scusa. Mai.",
    mosse: [m("Raffica d'Orgoglio", 0, 32), m("Lampo del Principe", 2, 48), m("Esplosione Finale", 5, 100)] },
  { id: "brolymone", nome: "Brolymone", serie: "db", rarita: "leggendaria", stile: "DIF", ruolo: "tank", frase: "Leggendario, enorme e sempre più arrabbiato.",
    mosse: [m("Pugno Leggendario", 0, 34), m("Furia Verde", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Meteora Gigante", 5, 98)] },
  { id: "freezovico", nome: "Freezovico", serie: "db", rarita: "rara", stile: "DIF", ruolo: "stregone", frase: "L'imperatore Ludovico non perdona.",
    mosse: [m("Raggio Mortale", 0, 30, { penetra: 20 }), m("Gelo Imperiale", 2, 30, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Supernova Imperiale", 5, 90)] },
  { id: "gohanlollo", nome: "Lohan", serie: "db", rarita: "rara", stile: "FOR", ruolo: "picchiatore", frase: "Studia di giorno, salva il mondo di sera.",
    mosse: [m("Calcio Volante", 0, 32), m("Potenziale Nascosto", 2, 0, { eff: { tipo: "potenzia", val: 35, turni: 3 } }), m("Onda Padre e Figlio", 5, 96)] },
  { id: "pipsccolo", nome: "Pipsccolo", serie: "db", rarita: "epica", stile: "DIF", ruolo: "difensore", frase: "Il namecciano Pips: braccia lunghe, pazienza corta.",
    mosse: [m("Braccio Allungabile", 0, 28), m("Rigenerazione", 2, 0, { eff: { tipo: "cura", val: 18 } }), m("Cannone a Spirale", 5, 88, { penetra: 25 })] },
  { id: "caulifrita", nome: "Caulif Rita", serie: "db", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Selvaggia, testarda e fortissima.",
    mosse: [m("Pugno Selvaggio", 0, 32), m("Sfera Crescente", 2, 46), m("Raffica Tripla", 5, 30, { colpi: 3 })] },
  { id: "criliziano", nome: "Criliziano", serie: "db", rarita: "rara", stile: "VEL", ruolo: "assassino", frase: "Piccolo, ma con il disco giusto.",
    mosse: [m("Disco Affilato", 0, 30, { penetra: 30 }), m("Lampo Solare", 2, 20, { eff: { tipo: "stordisci", val: 40 } }), m("Disco Distruttore", 5, 88, { penetra: 35 })] },
  { id: "bulsene", nome: "Bulsene", serie: "db", rarita: "epica", stile: "DIF", ruolo: "stratega", frase: "Genio, capsule e zero pazienza.",
    mosse: [m("Invenzione", 0, 26), m("Capsula Energetica", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Robot Capsula", 5, 84)] },
  { id: "c18ora", nome: "C-18 Ora", serie: "db", rarita: "epica", stile: "VEL", ruolo: "schivatore", frase: "Fredda come il metallo, veloce come un lampo.",
    mosse: [m("Calcio Cyborg", 0, 30), m("Barriera Cyborg", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Tempesta di Raggi", 5, 20, { colpi: 4 })] },
  { id: "diego17", nome: "Diego-17", serie: "db", rarita: "rara", stile: "VEL", ruolo: "ladro", frase: "Energia infinita e sorriso da guardaparco.",
    mosse: [m("Raffica Cyborg", 0, 26, { eff: { tipo: "ruba", val: 1 } }), m("Assorbimento", 2, 36, { eff: { tipo: "ruba", val: 1 } }), m("Super Barriera Esplosiva", 5, 88)] },
  { id: "chichice", nome: "Chichice", serie: "db", rarita: "comune", stile: "FOR", ruolo: "guaritore", frase: "Prima i compiti, poi si combatte.",
    mosse: [m("Padellata", 0, 28), m("Pranzo Saiyan", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Furia di Mamma", 5, 76, { drena: 40 })] },
  { id: "vidalessia", nome: "Videssia", serie: "db", rarita: "comune", stile: "VEL", ruolo: "capo", frase: "La giustizia ha un nuovo idolo.",
    mosse: [m("Calcio della Giustizia", 0, 28), m("Grido di Squadra", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Volo Giustiziere", 5, 80)] },
  { id: "panky", nome: "Panky", serie: "db", rarita: "comune", stile: "VEL", ruolo: "imprevedibile", frase: "Piccola peste, grande potenza.",
    mosse: [m("Pugnetto", 0, 28), m("Capriccio", 2, 26, { eff: { tipo: "stordisci", val: 50 } }), m("Raffica della Nipote", 5, 18, { colpi: 5 })] },
  // nov 2026: prima era "Giulmai". Il codice resta "giulmai" (così chi l'aveva la tiene, con livelli e squadre);
  // la foto nuova sta nel file "giuvv21" (img), così nessuno vede più la vecchia rimasta in memoria.
  { id: "giulmai", img: "giuvv21", nome: "Giuvv-21", serie: "db", rarita: "comune", stile: "FOR", ruolo: "stregone", frase: "La scienziata del Red Ribbon con le cellule Majin: ha sempre fame, e tu sembri un dolcetto.",
    mosse: [m("Raggio Caramella", 0, 30), m("Dolcetto Majin", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Assorbimento", 5, 80, { drena: 40 })] },

  // ---------------- DEI ----------------
  { id: "zeutiz", nome: "Zeu Tiz", serie: "dei", rarita: "leggendaria", stile: "DIF", ruolo: "capo", frase: "Sovrano degli dei. Fulmini compresi.",
    mosse: [m("Saetta", 0, 32), m("Tuono dell'Olimpo", 2, 42, { eff: { tipo: "stordisci", val: 40 } }), m("Ira di Zeus", 5, 104)] },
  { id: "poseludovico", nome: "Pose Ludovico", serie: "dei", rarita: "epica", stile: "DIF", ruolo: "tank", frase: "Signore dei mari e delle tempeste.",
    mosse: [m("Colpo di Tridente", 0, 32), m("Muro d'Acqua", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Maremoto", 5, 96)] },
  { id: "adelrizio", nome: "Adel Rizio", serie: "dei", rarita: "comune", stile: "DIF", ruolo: "stregone", frase: "Sovrano degli Inferi: prima o poi passano tutti da lui.",
    mosse: [m("Tocco degli Inferi", 0, 30, { drena: 30 }), m("Catene dell'Ade", 2, 28, { eff: { tipo: "indebolisci", val: 35, turni: 2 } }), m("Regno dei Morti", 5, 90, { drena: 40 })] },
  { id: "aresorenzo", nome: "Aresorenzo", serie: "dei", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Dio della guerra: la pace lo annoia.",
    mosse: [m("Fendente di Guerra", 0, 34), m("Grido di Battaglia", 2, 0, { eff: { tipo: "potenzia", val: 35, turni: 3 } }), m("Furia di Ares", 5, 96)] },
  { id: "atharita", nome: "Atha Rita", serie: "dei", rarita: "leggendaria", stile: "DIF", ruolo: "difensore", frase: "Dea della saggezza e della strategia.",
    mosse: [m("Lancia della Saggezza", 0, 30), m("Egida", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Strategia Divina", 5, 84, { penetra: 25 })] },
  { id: "artalice", nome: "Art Alice", serie: "dei", rarita: "epica", stile: "VEL", ruolo: "tiratore", frase: "Dea della caccia e della luna: non scappa nessuno.",
    mosse: [m("Freccia d'Argento", 0, 32), m("Pioggia di Frecce Lunari", 2, 18, { colpi: 3 }), m("Freccia della Luna", 5, 96)] },
  { id: "aurera", nome: "Aurera", serie: "dei", rarita: "epica", stile: "DIF", ruolo: "guaritore", frase: "Regina degli dei e del matrimonio.",
    mosse: [m("Sguardo Regale", 0, 28), m("Benedizione Nuziale", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Collera della Regina", 5, 80, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "herdiego", nome: "Her Diego", serie: "dei", rarita: "rara", stile: "VEL", ruolo: "ladro", frase: "Messaggero degli dei, e un po' ladruncolo.",
    mosse: [m("Sandali Alati", 0, 28, { eff: { tipo: "ruba", val: 1 } }), m("Furto Divino", 2, 36, { eff: { tipo: "ruba", val: 1 } }), m("Messaggero Fulmineo", 5, 22, { colpi: 4 })] },
  { id: "efesamuele", nome: "Efe Samuele", serie: "dei", rarita: "rara", stile: "FOR", ruolo: "incendiario", frase: "Dio del fuoco e della forgia.",
    mosse: [m("Martello Rovente", 0, 28, { eff: { tipo: "brucia", val: 4, turni: 2 } }), m("Forgia", 2, 38, { eff: { tipo: "brucia", val: 6, turni: 3 } }), m("Eruzione", 5, 82, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "dionpips", nome: "Dion Pips", serie: "dei", rarita: "comune", stile: "FOR", ruolo: "imprevedibile", frase: "Dio del vino e della festa. Soprattutto del vino.",
    mosse: [m("Brindisi Divino", 0, 30), m("Ebbrezza", 2, 24, { eff: { tipo: "stordisci", val: 50 } }), m("Baccanale", 5, 94)] },
  { id: "nikulia", nome: "Nikulia", serie: "dei", rarita: "leggendaria", stile: "VEL", ruolo: "assassino", frase: "Dea della vittoria: perdere non è un'opzione.",
    mosse: [m("Ali della Vittoria", 0, 32), m("Colpo Vincente", 2, 46, { penetra: 20 }), m("Trionfo", 5, 90, { penetra: 40 })] },
  { id: "solmone", nome: "Solmone", serie: "dei", rarita: "comune", stile: "DIF", ruolo: "stratega", frase: "Dio del sole e della musica.",
    mosse: [m("Raggio di Sole", 0, 28), m("Melodia della Lira", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Carro del Sole", 5, 84)] },
  { id: "aphroalessia", nome: "Aphro Alessia", serie: "dei", rarita: "comune", stile: "VEL", ruolo: "stregone", frase: "Dea dell'amore e della bellezza.",
    mosse: [m("Bacio Ammaliante", 0, 26), m("Fascino", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Amore Travolgente", 5, 80, { drena: 40 })] },
  { id: "demviky", nome: "Dem Viky", serie: "dei", rarita: "rara", stile: "FOR", ruolo: "guaritore", frase: "Dea della terra, del raccolto e dell'abbondanza.",
    mosse: [m("Frusta di Spighe", 0, 26), m("Raccolto", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Abbondanza", 5, 76, { drena: 50 })] },
  { id: "persene", nome: "Per Senè", serie: "dei", rarita: "rara", stile: "VEL", ruolo: "schivatore", frase: "Regina della primavera e degli inferi.",
    mosse: [m("Petali", 0, 28), m("Ritorno agli Inferi", 3, 0, { eff: { tipo: "nebbia" } }), m("Primavera Nera", 5, 84)] },

  // ---------------- MAFIOSI (nuovi) ----------------
  { id: "ellobo", nome: "El Lobo", serie: "nueve", rarita: "epica", stile: "FOR", ruolo: "capo", frase: "Dove va lui, il branco lo segue.",
    mosse: [m("Morso", 0, 32), m("Ululato", 2, 22, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Caccia del Branco", 5, 24, { colpi: 4 })] },
  { id: "eltigre", nome: "El Tigre", serie: "nueve", rarita: "epica", stile: "VEL", ruolo: "assassino", frase: "Silenzioso finché non salta.",
    mosse: [m("Artigli", 0, 32), m("Balzo della Tigre", 2, 46, { penetra: 25 }), m("Zampata Finale", 5, 92, { penetra: 30 })] },
  { id: "elcuervo", nome: "El Cuervo", serie: "nueve", rarita: "rara", stile: "FOR", ruolo: "tiratore", frase: "Quando arriva lui, è un brutto presagio.",
    mosse: [m("Piuma Nera", 0, 30), m("Stormo", 2, 18, { colpi: 3 }), m("Presagio", 5, 92)] },
  { id: "labruja", nome: "La Bruja", serie: "nueve", rarita: "rara", stile: "DIF", ruolo: "stregone", frase: "Ti legge la mano. Poi te la maledice.",
    mosse: [m("Maleficio", 0, 32), m("Pozione Tossica", 2, 32, { eff: { tipo: "brucia", val: 7, turni: 3 } }), m("Sabba", 5, 92, { eff: { tipo: "indebolisci", val: 35, turni: 2 } })] },
  { id: "lasombra", nome: "La Sombra", serie: "nueve", rarita: "comune", stile: "VEL", ruolo: "imprevedibile", frase: "Al tavolo da gioco non perde mai. Quasi.",
    mosse: [m("Shot", 0, 30), m("Carta Truccata", 2, 26, { eff: { tipo: "stordisci", val: 45 } }), m("All In", 5, 96)] },

  // ---------------- MAGHI ----------------
  { id: "samulett", nome: "Samulett Potter", serie: "maghi", rarita: "epica", stile: "VEL", ruolo: "capo", frase: "Il ragazzo sopravvissuto. Con la cicatrice e tutto.",
    mosse: [m("Raggio Disarmante", 0, 32), m("Volo sulla Scopa", 2, 44, { penetra: 20 }), m("Duello Finale", 5, 98)] },
  { id: "mauriziente", nome: "Mauriziente", serie: "maghi", rarita: "epica", stile: "DIF", ruolo: "stratega", frase: "Il preside più saggio della scuola. E il più eccentrico.",
    mosse: [m("Lampo di Bacchetta", 0, 30), m("Saggezza Antica", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Fenice di Fuoco", 5, 88, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "simoldemort", nome: "Simoldemort", serie: "maghi", rarita: "leggendaria", stile: "DIF", ruolo: "stregone", frase: "Colui-che-non-si-deve-nominare. E infatti nessuno lo nomina.",
    mosse: [m("Fiamma Verde", 0, 32, { drena: 20 }), m("Marchio Oscuro", 2, 28, { eff: { tipo: "indebolisci", val: 35, turni: 2 } }), m("Maledizione Suprema", 5, 100)] },
  { id: "pipverus", nome: "Pipverus Piton", serie: "maghi", rarita: "leggendaria", stile: "FOR", ruolo: "incendiario", frase: "Pozioni, sarcasmo e un segreto lungo una vita.",
    mosse: [m("Fendente Oscuro", 0, 32), m("Pozione Velenosa", 2, 30, { eff: { tipo: "brucia", val: 7, turni: 3 } }), m("Principe Mezzosangue", 5, 92, { penetra: 25 })] },
  { id: "vikatrix", nome: "Vikatrix Lestrange", serie: "maghi", rarita: "leggendaria", stile: "VEL", ruolo: "assassino", frase: "Ride sempre. E non è mai un buon segno.",
    mosse: [m("Pugnale Stregato", 0, 34), m("Risata Folle", 2, 44, { penetra: 25 }), m("Tortura Oscura", 5, 92, { penetra: 30 })] },
  { id: "alessmione", nome: "Alessmione Granger", serie: "maghi", rarita: "leggendaria", stile: "DIF", ruolo: "difensore", frase: "Ha letto tutti i libri. Due volte.",
    mosse: [m("Incanto Levitante", 0, 28), m("Scudo Protettivo", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Tutti i Libri a Memoria", 5, 86, { penetra: 25 })] },
  { id: "seneverr", nome: "Seneverr McGrannit", serie: "maghi", rarita: "epica", stile: "DIF", ruolo: "tank", frase: "Severa ma giusta. Soprattutto severa.",
    mosse: [m("Bacchettata", 0, 28), m("Trasfigurazione", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Armata di Pietra", 5, 90)] },
  { id: "diegirius", nome: "Diegirius Black", serie: "maghi", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Evaso, ribelle e, quando serve, cane nero.",
    mosse: [m("Morso del Cane Nero", 0, 32), m("Fuga dalla Prigione", 2, 0, { eff: { tipo: "potenzia", val: 35, turni: 3 } }), m("Furia del Padrino", 5, 94)] },
  { id: "ludraco", nome: "Ludraco Malfoy", serie: "maghi", rarita: "rara", stile: "VEL", ruolo: "ladro", frase: "Mio padre verrà a saperlo.",
    mosse: [m("Gambe Molli", 0, 28, { eff: { tipo: "ruba", val: 1 } }), m("Serpente Evocato", 2, 36, { eff: { tipo: "ruba", val: 1 } }), m("Orgoglio Serpeverde", 5, 22, { colpi: 4 })] },
  { id: "ritadora", nome: "Ritadora Tonks", serie: "maghi", rarita: "rara", stile: "VEL", ruolo: "schivatore", frase: "Cambia faccia e capelli quando le pare.",
    mosse: [m("Raffica di Scintille", 0, 28), m("Metamorfosi", 3, 0, { eff: { tipo: "nebbia" } }), m("Assalto dell'Auror", 5, 86)] },
  { id: "lollon", nome: "Lollon Weasley", serie: "maghi", rarita: "comune", stile: "FOR", ruolo: "imprevedibile", frase: "La bacchetta è rotta. Funziona lo stesso. Più o meno.",
    mosse: [m("Bacchetta Rotta", 0, 30), m("Pioggia di Lumache", 2, 26, { eff: { tipo: "stordisci", val: 45 } }), m("Scacco Matto Gigante", 5, 96)] },
  { id: "ginice", nome: "Ginice Weasley", serie: "maghi", rarita: "comune", stile: "FOR", ruolo: "tiratore", frase: "La più piccola di casa, ma la fattura la sa fare.",
    mosse: [m("Fattura Pipistrello", 0, 30), m("Bolide", 2, 24, { colpi: 2 }), m("Tiro da Cacciatrice", 5, 86)] },
  { id: "tizievil", nome: "Tizievil Paciock", serie: "maghi", rarita: "comune", stile: "FOR", ruolo: "guaritore", frase: "Timido fino al momento giusto. Poi tira fuori la spada.",
    mosse: [m("Pianta Carnivora", 0, 26), m("Erbologia", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Spada del Coraggio", 5, 80, { drena: 40 })] },
  { id: "auroruna", nome: "Auroruna", serie: "maghi", rarita: "rara", stile: "DIF", ruolo: "stregone", frase: "Vede creature che nessun altro vede. Forse esistono davvero.",
    mosse: [m("Fascino Lunare", 0, 28), m("Creature Invisibili", 2, 24, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Patrono Lepre", 5, 84)] },
  { id: "giulifleur", nome: "Giulifleur", serie: "maghi", rarita: "rara", stile: "VEL", ruolo: "capo", frase: "Elegante, raffinata e campionessa del torneo.",
    mosse: [m("Fiamma Azzurra", 0, 28), m("Fascino Veela", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Torneo dei Tre Maghi", 5, 80)] },
  // ---------------- DEMONI ----------------
  { id: "lollifer", nome: "Lollifer", serie: "demoni", rarita: "leggendaria", stile: "FOR", ruolo: "capo", frase: "Il re degli Inferi. È caduto dal cielo, ma con stile.",
    mosse: [m("Artiglio Infernale", 0, 34), m("Ali Nere", 2, 44, { penetra: 30 }), m("Caduta dal Cielo", 5, 100)] },
  { id: "samuzebub", nome: "Samuzebub", serie: "demoni", rarita: "leggendaria", stile: "DIF", ruolo: "stratega", frase: "Il Signore delle Mosche: ronza, comanda e non si stanca mai.",
    mosse: [m("Sciame Ronzante", 0, 30), m("Banchetto Infernale", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Signore delle Mosche", 5, 90, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "simothan", nome: "Simothan", serie: "demoni", rarita: "epica", stile: "DIF", ruolo: "tank", frase: "Il serpente degli abissi. Quando si muove lui, si muove il mare.",
    mosse: [m("Coda dell'Abisso", 0, 32), m("Scaglie d'Acciaio", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Maremoto Infernale", 5, 98)] },
  { id: "alissith", nome: "Alissith", serie: "demoni", rarita: "leggendaria", stile: "VEL", ruolo: "stregone", frase: "La prima delle streghe: un sorriso, e sei già suo.",
    mosse: [m("Bacio Velenoso", 0, 32, { drena: 20 }), m("Incanto della Notte", 2, 28, { eff: { tipo: "indebolisci", val: 35, turni: 2 } }), m("Luna Nera", 5, 94, { drena: 30 })] },
  { id: "mauriphomet", nome: "Mauriphomet", serie: "demoni", rarita: "rara", stile: "DIF", ruolo: "stregone", frase: "Il caprone del sabba. Basta lo sguardo come maledizione.",
    mosse: [m("Cornata", 0, 30), m("Sabba Oscuro", 2, 30, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Pentacolo di Fuoco", 5, 88, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "ludomodeus", nome: "Ludomodeus", serie: "demoni", rarita: "epica", stile: "FOR", ruolo: "imprevedibile", frase: "Il demone dei vizi: tutto o niente, sempre.",
    mosse: [m("Tentazione", 0, 32), m("Dado Truccato", 2, 42, { penetra: 25 }), m("Mille Vizi", 5, 26, { colpi: 4 })] },
  { id: "tiziazel", nome: "Tiziazel", serie: "demoni", rarita: "rara", stile: "VEL", ruolo: "assassino", frase: "Il ribelle con la cicatrice. Colpisce e sparisce.",
    mosse: [m("Lama Spezzata", 0, 34), m("Fuga nell'Ombra", 2, 0, { eff: { tipo: "nebbia" } }), m("Marchio del Ribelle", 5, 92, { penetra: 30 })] },
  { id: "aurorrigan", nome: "Aurorrigan", serie: "demoni", rarita: "leggendaria", stile: "VEL", ruolo: "tiratore", frase: "La regina dei corvi: vede la tua sconfitta prima di te.",
    mosse: [m("Piuma Affilata", 0, 32), m("Stormo di Corvi", 2, 16, { colpi: 3 }), m("Profezia di Sangue", 5, 90)] },
  { id: "pipmon", nome: "Pipmon", serie: "demoni", rarita: "rara", stile: "VEL", ruolo: "ladro", frase: "Il demone dell'oro: quello che è tuo, presto sarà suo.",
    mosse: [m("Monetina Affilata", 0, 26, { eff: { tipo: "ruba", val: 1 } }), m("Patto d'Oro", 2, 36, { eff: { tipo: "ruba", val: 1 } }), m("Pioggia di Monete", 5, 20, { colpi: 4 })] },
  { id: "diegial", nome: "Diegial", serie: "demoni", rarita: "comune", stile: "FOR", ruolo: "picchiatore", frase: "Il principe senza regole. Prima picchia, poi (forse) parla.",
    mosse: [m("Pugno Infernale", 0, 32), m("Rabbia Senza Freni", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Trono in Fiamme", 5, 86)] },
  { id: "ritacubus", nome: "Ritacubus", serie: "demoni", rarita: "epica", stile: "VEL", ruolo: "schivatore", frase: "Un sorriso, uno sguardo, e ti scordi perché stavi combattendo.",
    mosse: [m("Graffio Gentile", 0, 30), m("Sguardo Ammaliante", 2, 24, { eff: { tipo: "stordisci", val: 45 } }), m("Danza della Notte", 5, 80, { drena: 30 })] },
  { id: "alistaroth", nome: "Alistaroth", serie: "demoni", rarita: "rara", stile: "DIF", ruolo: "difensore", frase: "La duchessa degli Inferi: elegante, paziente, inattaccabile.",
    mosse: [m("Scettro di Rubino", 0, 28), m("Barriera di Rubini", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Corona Infernale", 5, 84, { penetra: 25 })] },
  { id: "giulimaah", nome: "Giulimaah", serie: "demoni", rarita: "epica", stile: "FOR", ruolo: "tiratore", frase: "Canta, sorride e ti incenerisce a tempo di musica.",
    mosse: [m("Nota Stonata", 0, 30), m("Doppio Acuto", 2, 24, { colpi: 2 }), m("Canto degli Inferi", 5, 84)] },
  { id: "vikamashtu", nome: "Vikamashtu", serie: "demoni", rarita: "comune", stile: "FOR", ruolo: "incendiario", frase: "Dolce fuori, brace viva dentro.",
    mosse: [m("Soffio di Brace", 0, 28), m("Fiamme Gemelle", 2, 26, { eff: { tipo: "brucia", val: 6, turni: 3 } }), m("Rogo Infernale", 5, 82)] },
  { id: "senecate", nome: "Senecate", serie: "demoni", rarita: "comune", stile: "DIF", ruolo: "guaritore", frase: "La strega dei crocevia: il suo libro sa sempre la strada.",
    mosse: [m("Colpo di Libro", 0, 26), m("Erbe del Crocevia", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Tre Lune", 5, 76, { drena: 40 })] },
  // ---------------- MESTIERI ----------------
  { id: "ludhacker", nome: "Ludhacker", serie: "mestieri", rarita: "leggendaria", stile: "VEL", ruolo: "ladro", frase: "Il genio col cappuccio: entra ovunque, esce sempre.",
    mosse: [m("Codice Malevolo", 0, 28, { eff: { tipo: "ruba", val: 1 } }), m("Furto di Password", 2, 38, { eff: { tipo: "ruba", val: 1 } }), m("Sistema Violato", 5, 96, { penetra: 35 })] },
  { id: "lollinista", nome: "Lollinista", serie: "mestieri", rarita: "rara", stile: "FOR", ruolo: "capo", frase: "Il maestro al pianoforte: quando suona lui, la squadra va a tempo.",
    mosse: [m("Accordo Potente", 0, 34), m("Crescendo", 2, 0, { eff: { tipo: "potenzia", val: 35, turni: 3 } }), m("Gran Finale", 5, 100)] },
  { id: "tiziegista", nome: "Tiziegista", serie: "mestieri", rarita: "leggendaria", stile: "DIF", ruolo: "stratega", frase: "Azione! E tutti fanno esattamente quello che dice lui.",
    mosse: [m("Ciak", 0, 30), m("Pausa sul Set", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Effetti Speciali", 5, 90, { eff: { tipo: "stordisci", val: 40 } })] },
  { id: "alispia", nome: "Alispia", serie: "mestieri", rarita: "leggendaria", stile: "VEL", ruolo: "assassino", frase: "Nome in codice: Alice. Il resto è top secret.",
    mosse: [m("Colpo Silenziato", 0, 34, { penetra: 20 }), m("Travestimento", 2, 0, { eff: { tipo: "nebbia" } }), m("Missione Impossibile", 5, 98, { penetra: 35 })] },
  { id: "senebroker", nome: "Senebroker", serie: "mestieri", rarita: "leggendaria", stile: "DIF", ruolo: "stregone", frase: "Compra basso, vende alto, e ti lascia in rosso.",
    mosse: [m("Telefonata Urgente", 0, 30), m("Crollo di Borsa", 2, 30, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Lupo di Borsa", 5, 86, { drena: 30 })] },
  { id: "maurialpinista", nome: "Maurialpinista", serie: "mestieri", rarita: "rara", stile: "DIF", ruolo: "tank", frase: "Ottomila metri, zero lamentele.",
    mosse: [m("Colpo di Piccozza", 0, 30), m("Corda di Sicurezza", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Valanga", 5, 92)] },
  { id: "pipciatore", nome: "Pipciatore", serie: "mestieri", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Il numero 10 sulla maglia, e in campo si sente.",
    mosse: [m("Tiro a Giro", 0, 32), m("Rovesciata", 2, 46), m("Gol all'Ultimo Minuto", 5, 94)] },
  { id: "simonducer", nome: "Simonducer", serie: "mestieri", rarita: "rara", stile: "FOR", ruolo: "imprevedibile", frase: "Mette il beat e il pavimento trema.",
    mosse: [m("Cassa Dritta", 0, 32), m("Drop del Beat", 2, 44, { penetra: 20 }), m("Hit dell'Estate", 5, 24, { colpi: 4 })] },
  { id: "diegarman", nome: "Diegarman", serie: "mestieri", rarita: "epica", stile: "FOR", ruolo: "incendiario", frase: "Shakera, fa il flambé e ti porta il conto.",
    mosse: [m("Shakerata", 0, 28), m("Cocktail Flambé", 2, 28, { eff: { tipo: "brucia", val: 6, turni: 3 } }), m("Giro della Casa", 5, 84)] },
  { id: "samutografo", nome: "Samutografo", serie: "mestieri", rarita: "comune", stile: "VEL", ruolo: "tiratore", frase: "Uno scatto e sei immortale. O accecato.",
    mosse: [m("Scatto Rapido", 0, 30), m("Flash Accecante", 2, 22, { eff: { tipo: "stordisci", val: 45 } }), m("Raffica di Scatti", 5, 20, { colpi: 4 })] },
  { id: "alessiologa", nome: "Alessiologa", serie: "mestieri", rarita: "epica", stile: "DIF", ruolo: "stregone", frase: "Al microscopio vede tutto. Anche i tuoi punti deboli.",
    mosse: [m("Provetta", 0, 28), m("Coltura Batterica", 2, 28, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Mutazione Genetica", 5, 84, { penetra: 25 })] },
  { id: "vikyventura", nome: "Vikyventura", serie: "mestieri", rarita: "epica", stile: "VEL", ruolo: "schivatore", frase: "Mappa, zaino e nessuna paura di perdersi.",
    mosse: [m("Colpo di Machete", 0, 30), m("Salto con la Liana", 2, 40, { penetra: 20 }), m("Tesoro Perduto", 5, 82)] },
  { id: "auroressa", nome: "Auroressa", serie: "mestieri", rarita: "rara", stile: "DIF", ruolo: "difensore", frase: "Interrogazione a sorpresa. Hai studiato?",
    mosse: [m("Gessetto", 0, 26), m("Nota sul Registro", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Compito in Classe", 5, 80)] },
  { id: "ritanimatrice", nome: "Ritanimatrice", serie: "mestieri", rarita: "comune", stile: "FOR", ruolo: "guaritore", frase: "Balli di gruppo e acqua per tutti: lo staff c'è.",
    mosse: [m("Ballo di Gruppo", 0, 28), m("Pausa Acqua", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Baby Dance", 5, 76, { drena: 40 })] },
  { id: "giudella", nome: "Giudella", serie: "mestieri", rarita: "comune", stile: "VEL", ruolo: "capo", frase: "Passerella, sguardo, pausa. Tutti gli occhi su di lei.",
    mosse: [m("Colpo di Tacco", 0, 28), m("Tutti gli Occhi su di Me", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Sfilata Finale", 5, 80)] },
  // ---------------- Simpson ----------------
  { id: "tizomer", nome: "Tizomer", serie: "simpson", rarita: "epica", stile: "DIF", ruolo: "tank", frase: "D'oh! Ma una ciambella risolve tutto.",
    mosse: [m("Ciambellata", 0, 32), m("Mmm… Ciambelle", 2, 0, { eff: { tipo: "cura", val: 35 } }), m("Incidente alla Centrale", 5, 94, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "lollart", nome: "Lollart", serie: "simpson", rarita: "leggendaria", stile: "VEL", ruolo: "imprevedibile", frase: "Ciucciati il calzino! E poi scappa sullo skate.",
    mosse: [m("Fionda", 0, 32), m("Scherzo Telefonico", 2, 26, { eff: { tipo: "stordisci", val: 50 } }), m("Skate Kamikaze", 5, 96, { penetra: 25 })] },
  { id: "alisa", nome: "Alisa", serie: "simpson", rarita: "leggendaria", stile: "VEL", ruolo: "stratega", frase: "La più brillante di Springfield, sassofono compreso.",
    mosse: [m("Nota Stonata", 0, 30), m("Primo della Classe", 2, 30, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Blues di Springfield", 5, 92, { eff: { tipo: "energia", val: 2 } })] },
  { id: "simarney", nome: "Simarney", serie: "simpson", rarita: "rara", stile: "FOR", ruolo: "picchiatore", frase: "Un boccale, un rutto e via: si combatte.",
    mosse: [m("Rutto Sonoro", 0, 32), m("Boccale di Duff", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 2 } }), m("Spazzaneve Re", 5, 92)] },
  { id: "maurilanders", nome: "Maurilanders", serie: "simpson", rarita: "epica", stile: "DIF", ruolo: "guaritore", frase: "Salve salvino, vicinino! Ti curo, poi ti batto.",
    mosse: [m("Okely Dokely", 0, 30), m("Preghiera del Vicinato", 2, 0, { eff: { tipo: "cura", val: 35 } }), m("Furia del Mancino", 5, 86)] },
  { id: "samusty", nome: "Samusty", serie: "simpson", rarita: "rara", stile: "FOR", ruolo: "imprevedibile", frase: "Ehi ehi ragazzi! Lo spettacolo è appena iniziato.",
    mosse: [m("Torta in Faccia", 0, 32), m("Risata Registrata", 2, 30, { eff: { tipo: "stordisci", val: 40 } }), m("Show del Pagliaccio", 5, 24, { colpi: 4 })] },
  { id: "dieggum", nome: "Dieggum", serie: "simpson", rarita: "leggendaria", stile: "DIF", ruolo: "tank", frase: "Fermo, polizia! Appena finisco la ciambella.",
    mosse: [m("Manganello", 0, 30), m("Ciambella di Servizio", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Sirene Spiegate", 5, 92)] },
  { id: "pimoe", nome: "Pimoe", serie: "simpson", rarita: "rara", stile: "FOR", ruolo: "ladro", frase: "Taverna di Moe, chi parla? Ancora voi!",
    mosse: [m("Straccio del Bancone", 0, 28), m("Conto Salato", 2, 24, { eff: { tipo: "ruba", val: 2 } }), m("Fiammeggiante di Moe", 5, 82, { eff: { tipo: "brucia", val: 5, turni: 2 } })] },
  { id: "ludohouse", nome: "Ludohouse", serie: "simpson", rarita: "comune", stile: "VEL", ruolo: "schivatore", frase: "Mia mamma dice che sono forte. Ci credo anch'io.",
    mosse: [m("Spintone", 0, 28), m("Mi Gira la Testa", 2, 0, { eff: { tipo: "nebbia" } }), m("Vendetta di Fallout Boy", 5, 84)] },
  { id: "alledna", nome: "Alledna", serie: "simpson", rarita: "rara", stile: "DIF", ruolo: "stregone", frase: "Ah-ha! Seduto e zitto: c'è un compito a sorpresa.",
    mosse: [m("Gessetto Lanciato", 0, 28), m("Compito Extra", 2, 28, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Bocciatura", 5, 84, { penetra: 25 })] },
  { id: "vaggie", nome: "Vaggie", serie: "simpson", rarita: "epica", stile: "VEL", ruolo: "assassino", frase: "Non parla mai. Non ne ha bisogno.",
    mosse: [m("Ciuccio", 0, 30), m("Biberon Volante", 2, 40, { penetra: 20 }), m("Chi ha Sparato a Mr. Burns?", 5, 84, { penetra: 30 })] },
  { id: "giupatty", nome: "Giupatty", serie: "simpson", rarita: "epica", stile: "DIF", ruolo: "difensore", frase: "Allo sportello della Motorizzazione non si passa.",
    mosse: [m("Timbro", 0, 26), m("Sguardo Disgustato", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Numero Sbagliato", 5, 80)] },
  { id: "selmene", nome: "Selmene", serie: "simpson", rarita: "comune", stile: "FOR", ruolo: "incendiario", frase: "Sigaretta, iguana e zero pazienza.",
    mosse: [m("Sigaretta Accesa", 0, 26), m("Nube di Fumo", 2, 22, { eff: { tipo: "brucia", val: 5, turni: 3 } }), m("Jub-Jub all'Attacco", 5, 78)] },
  { id: "riessica", nome: "Riessica", serie: "simpson", rarita: "comune", stile: "VEL", ruolo: "ladro", frase: "La figlia del reverendo. Occhio al portafoglio.",
    mosse: [m("Sorriso Angelico", 0, 26), m("Colletta Rubata", 2, 20, { eff: { tipo: "ruba", val: 2 } }), m("Figlia del Reverendo", 5, 78)] },
  { id: "aurrerri", nome: "Aurrerri", serie: "simpson", rarita: "comune", stile: "FOR", ruolo: "imprevedibile", frase: "Quando ride lei, sembra che ridano in due.",
    mosse: [m("Doppio Sghignazzo", 0, 14, { colpi: 2 }), m("Pettegolezzo", 2, 22, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Gemelle all'Attacco", 5, 38, { colpi: 2 })] },
  // ---------------- Barbapapà ----------------
  { id: "diegopa", nome: "Diegopà", serie: "barbapapa", rarita: "leggendaria", stile: "VEL", ruolo: "assassino", frase: "Diventa una spada, poi un fulmine, poi di nuovo lui. Barbatrucco!",
    mosse: [m("Barbatrucco", 0, 34), m("Forma di Spada", 2, 44, { penetra: 30 }), m("Resta Barba!", 5, 98, { penetra: 25 })] },
  { id: "pipsoba", nome: "Pipsobà", serie: "barbapapa", rarita: "leggendaria", stile: "FOR", ruolo: "picchiatore", frase: "Amico di tutti gli animali. E gli animali sono dalla sua parte.",
    mosse: [m("Zampata", 0, 34), m("Branco Selvaggio", 2, 16, { colpi: 3 }), m("Zoo in Libertà", 5, 98)] },
  { id: "ritamma", nome: "Ritamma", serie: "barbapapa", rarita: "leggendaria", stile: "DIF", ruolo: "guaritore", frase: "La mamma di tutta la famiglia: abbraccia, cura e, se serve, si arrabbia.",
    mosse: [m("Abbraccio Rotondo", 0, 30), m("Cure di Mamma", 2, 0, { eff: { tipo: "cura", val: 40 } }), m("Barbacasa", 5, 90, { eff: { tipo: "scudo", val: 40 } })] },
  { id: "aliottina", nome: "Aliottina", serie: "barbapapa", rarita: "epica", stile: "DIF", ruolo: "stregone", frase: "Ha letto tutti i libri della casa. Ora li lancia.",
    mosse: [m("Libro in Testa", 0, 30), m("Lezione Noiosa", 2, 30, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Biblioteca Volante", 5, 88)] },
  { id: "aurobrava", nome: "Aurobrava", serie: "barbapapa", rarita: "epica", stile: "VEL", ruolo: "schivatore", frase: "Sportiva e detective: corre più veloce dei suoi sospettati.",
    mosse: [m("Scatto Bravo", 0, 32), m("Lente d'Ingrandimento", 2, 44, { penetra: 20 }), m("Caso Risolto", 5, 90)] },
  { id: "ludopa", nome: "Ludopà", serie: "barbapapa", rarita: "epica", stile: "FOR", ruolo: "tiratore", frase: "Si allunga, si arrotola e ti arriva addosso da lontano.",
    mosse: [m("Braccio Elastico", 0, 32), m("Fionda Barba", 2, 46), m("Palla di Gomma", 5, 92)] },
  { id: "mauriba", nome: "Mauribà", serie: "barbapapa", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Rosso di forma e di rabbia: lo sport è la sua vita.",
    mosse: [m("Palla Medica", 0, 32), m("Riscaldamento", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Barbagol", 5, 92)] },
  { id: "alebella", nome: "AleBella", serie: "barbapapa", rarita: "rara", stile: "VEL", ruolo: "stregone", frase: "Occhiali, collane e un fascino tutto rotondo.",
    mosse: [m("Specchietto", 0, 28), m("Fascino Rotondo", 2, 26, { eff: { tipo: "stordisci", val: 45 } }), m("Bellezza Accecante", 5, 84)] },
  { id: "giulialla", nome: "Giulialla", serie: "barbapapa", rarita: "rara", stile: "VEL", ruolo: "stratega", frase: "Canta sempre, e la squadra va a tempo.",
    mosse: [m("Nota Rotonda", 0, 28), m("Melodia di Casa", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Concerto Barba", 5, 84)] },
  { id: "seneforte", nome: "Seneforte", serie: "barbapapa", rarita: "rara", stile: "DIF", ruolo: "tank", frase: "Morbida fuori, fortissima dentro.",
    mosse: [m("Spallata", 0, 30), m("Pelle di Gomma", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Barbamuro", 5, 86)] },
  { id: "vikylalla", nome: "Vikylalla", serie: "barbapapa", rarita: "rara", stile: "FOR", ruolo: "incendiario", frase: "Giacca nera e chitarra: la Barba-rockstar di famiglia.",
    mosse: [m("Chitarra Rock", 0, 28), m("Assolo Infuocato", 2, 28, { eff: { tipo: "brucia", val: 6, turni: 3 } }), m("Barba Rock", 5, 84)] },
  { id: "lollapa", nome: "Lollapà", serie: "barbapapa", rarita: "comune", stile: "DIF", ruolo: "capo", frase: "Il papà rosa: quando dice Barbatrucco, tutti si trasformano.",
    mosse: [m("Barbaspinta", 0, 28), m("Tutti in Famiglia", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Grande Barbatrucco", 5, 80)] },
  { id: "tizoba", nome: "Tizobà", serie: "barbapapa", rarita: "comune", stile: "DIF", ruolo: "difensore", frase: "Verde, barbuto e sempre al riparo: diventa un ombrello quando piove.",
    mosse: [m("Fischietto", 0, 26), m("Forma a Ombrello", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Barbatromba", 5, 80)] },
  { id: "samuba", nome: "Samubà", serie: "barbapapa", rarita: "comune", stile: "VEL", ruolo: "guaritore", frase: "Lo scienziato blu: ogni esperimento finisce con un botto.",
    mosse: [m("Provetta Blu", 0, 26), m("Pozione Barba", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Esperimento Esplosivo", 5, 76, { drena: 40 })] },
  { id: "simopa", nome: "Simopà", serie: "barbapapa", rarita: "comune", stile: "FOR", ruolo: "imprevedibile", frase: "Giacca e cravatta, ma con il pennello in tasca.",
    mosse: [m("Pennellata", 0, 28), m("Schizzo di Colore", 2, 24, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Capolavoro", 5, 80)] },
  // ---------------- Star Wars ----------------
  { id: "ludowalker", nome: "Ludowalker", serie: "starwars", rarita: "leggendaria", stile: "VEL", ruolo: "capo", frase: "Un ragazzo di campagna che ha fatto saltare una stazione spaziale. Niente male.",
    mosse: [m("Fendente Jedi", 0, 34), m("Usa la Forza", 2, 44, { penetra: 30 }), m("Colpo nel Condotto", 5, 100)] },
  { id: "giueia", nome: "Giueia", serie: "starwars", rarita: "leggendaria", stile: "DIF", ruolo: "stratega", frase: "Principessa, generale e capa della Ribellione. Aiutami, sei la mia unica speranza.",
    mosse: [m("Blaster della Principessa", 0, 30), m("Messaggio Olografico", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("La Ribellione", 5, 90, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "mauribecca", nome: "Mauribecca", serie: "starwars", rarita: "leggendaria", stile: "DIF", ruolo: "tank", frase: "Duecento anni, due metri e mezzo di pelo e un ruggito che fa tremare l'astronave.",
    mosse: [m("Balestra Wookiee", 0, 34), m("Pelliccia Spessa", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Furia Wookiee", 5, 98)] },
  { id: "lollakin", nome: "Lollakin Skywalker", serie: "starwars", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Il prescelto. Impaziente, fortissimo e con un debole per il lato oscuro.",
    mosse: [m("Fendente Impaziente", 0, 32), m("Rabbia del Prescelto", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Duello su Mustafar", 5, 90, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "tizvader", nome: "Tiz Vader", serie: "starwars", rarita: "epica", stile: "DIF", ruolo: "stregone", frase: "Respira forte, parla piano e ti stringe la gola da lontano.",
    mosse: [m("Spada Rossa", 0, 30), m("Stretta della Forza", 2, 30, { eff: { tipo: "stordisci", val: 40 } }), m("Lato Oscuro", 5, 88, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "simalpatine", nome: "Simalpatine", serie: "starwars", rarita: "epica", stile: "FOR", ruolo: "imprevedibile", frase: "Fai quello che devi fare. Anzi, fallo fare a lui.",
    mosse: [m("Risata Sinistra", 0, 32), m("Fulmini della Forza", 2, 30, { eff: { tipo: "brucia", val: 7, turni: 3 } }), m("Ordine 66", 5, 24, { colpi: 4 })] },
  { id: "samuwan", nome: "Samuwan", serie: "starwars", rarita: "epica", stile: "VEL", ruolo: "schivatore", frase: "Hello there! Il maestro Jedi più educato della galassia.",
    mosse: [m("Hello There", 0, 32), m("Trucco Mentale Jedi", 2, 0, { eff: { tipo: "nebbia" } }), m("Ho l'Altura", 5, 92, { penetra: 25 })] },
  { id: "aleadme", nome: "Aleadmè", serie: "starwars", rarita: "rara", stile: "DIF", ruolo: "tiratore", frase: "Regina di Naboo: prima prova a parlare, poi spara.",
    mosse: [m("Blaster Reale", 0, 30), m("Diplomazia", 2, 28, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Regina di Naboo", 5, 84)] },
  { id: "alihsoka", nome: "Alihsoka", serie: "starwars", rarita: "rara", stile: "VEL", ruolo: "assassino", frase: "Due spade bianche e nessuna paura di fare di testa sua.",
    mosse: [m("Doppio Fendente", 0, 30, { penetra: 20 }), m("Salto Acrobatico", 2, 40, { penetra: 20 }), m("Lame Gemelle", 5, 20, { colpi: 4 })] },
  { id: "pipsobafett", nome: "Pipsobà Fett", serie: "starwars", rarita: "rara", stile: "FOR", ruolo: "tiratore", frase: "Cacciatore di taglie: il prezzo sulla tua testa gli piace molto.",
    mosse: [m("Blaster", 0, 30), m("Razzo da Polso", 2, 40), m("Jetpack Kamikaze", 5, 84)] },
  { id: "ritey", nome: "Ritey", serie: "starwars", rarita: "rara", stile: "VEL", ruolo: "ladro", frase: "Raccoglieva rottami nel deserto. Ora raccoglie vittorie.",
    mosse: [m("Bastone da Jakku", 0, 28, { eff: { tipo: "ruba", val: 1 } }), m("Recupero di Rottami", 2, 36, { eff: { tipo: "ruba", val: 1 } }), m("Spada di Skywalker", 5, 88)] },
  { id: "aurothma", nome: "Aurothma", serie: "starwars", rarita: "comune", stile: "DIF", ruolo: "guaritore", frase: "Senatrice e cuore della Ribellione: unisce tutti, poi vince.",
    mosse: [m("Discorso al Senato", 0, 26), m("Alleanza Ribelle", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Voto di Sfiducia", 5, 76, { drena: 40 })] },
  { id: "diegoren", nome: "Diegoren", serie: "starwars", rarita: "comune", stile: "FOR", ruolo: "picchiatore", frase: "Spada che sfrigola, elmo che vola: quando si arrabbia, si arrabbia davvero.",
    mosse: [m("Spada Instabile", 0, 28), m("Crisi di Rabbia", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Elmo Spaccato", 5, 80)] },
  { id: "senendulla", nome: "Senendulla", serie: "starwars", rarita: "comune", stile: "VEL", ruolo: "stratega", frase: "La pilota migliore della flotta: qualsiasi astronave, qualsiasi manovra.",
    mosse: [m("Cannoniera", 0, 28), m("Manovra Spericolata", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Ghost all'Attacco", 5, 84)] },
  { id: "vikyerso", nome: "Viky Erso", serie: "starwars", rarita: "comune", stile: "FOR", ruolo: "assassino", frase: "Ribelle per scelta: ruba i piani e scappa prima che se ne accorgano.",
    mosse: [m("Colpo alle Spalle", 0, 28), m("I Piani Rubati", 2, 24, { eff: { tipo: "stordisci", val: 40 } }), m("Rogue One", 5, 80)] },  // ---------------- Elementi ----------------
  { id: "auraria", nome: "Auraria", serie: "elementi", rarita: "leggendaria", stile: "VEL", ruolo: "capo", frase: "Dove passa lei il cielo si apre e il vento cambia direzione. Sempre a suo favore.",
    mosse: [m("Brezza Dorata", 0, 34), m("Vento a Favore", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Uragano d'Oro", 5, 96, { penetra: 20 })] },
  { id: "senesuono", nome: "Senesuono", serie: "elementi", rarita: "leggendaria", stile: "DIF", ruolo: "stregone", frase: "Alza il volume e il mondo trema: ogni nota è un colpo, ogni ritornello un terremoto.",
    mosse: [m("Nota Acuta", 0, 32), m("Onda Sonora", 2, 30, { eff: { tipo: "stordisci", val: 40 } }), m("Sinfonia Assordante", 5, 90, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "vikytal", nome: "Vikytal", serie: "elementi", rarita: "leggendaria", stile: "FOR", ruolo: "difensore", frase: "Viene dal Nord con le rune incise sull'ascia. Non ha mai perso una battaglia, e non vuole iniziare oggi.",
    mosse: [m("Ascia Runica", 0, 34), m("Runa dello Scudo", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Furia del Nord", 5, 98)] },
  { id: "alessieno", nome: "Alessieno", serie: "elementi", rarita: "epica", stile: "VEL", ruolo: "incendiario", frase: "Occhiali, un serpente come amico e un sorriso velenoso: basta un sorso e sei fuori.",
    mosse: [m("Morso di Serpe", 0, 28, { eff: { tipo: "brucia", val: 4, turni: 2 } }), m("Nube Tossica", 2, 26, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Veleno Mortale", 5, 84, { eff: { tipo: "brucia", val: 7, turni: 3 } })] },
  { id: "diegaqua", nome: "Diegaqua", serie: "elementi", rarita: "epica", stile: "DIF", ruolo: "imprevedibile", frase: "Comanda le onde come gli pare: oggi mare calmo, domani maremoto.",
    mosse: [m("Getto d'Acqua", 0, 32), m("Vortice Marino", 2, 30, { eff: { tipo: "stordisci", val: 40 } }), m("Maremoto", 5, 90)] },
  { id: "pipgelo", nome: "Pipgelo", serie: "elementi", rarita: "epica", stile: "DIF", ruolo: "stregone", frase: "Ha i baffi ghiacciati e il cuore pure: quando ti guarda da dietro gli occhiali, ti congeli.",
    mosse: [m("Scheggia di Ghiaccio", 0, 30), m("Brina", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Era Glaciale", 5, 86, { eff: { tipo: "stordisci", val: 40 } })] },
  { id: "ritacrys", nome: "Ritacrys", serie: "elementi", rarita: "epica", stile: "FOR", ruolo: "tiratore", frase: "Regina dei cristalli: ti sorride e intanto ti punta addosso mille schegge.",
    mosse: [m("Scheggia di Cristallo", 0, 32), m("Pioggia di Cristalli", 2, 14, { colpi: 3 }), m("Prisma Accecante", 5, 23, { colpi: 4 })] },
  { id: "alisombra", nome: "Alisombra", serie: "elementi", rarita: "rara", stile: "VEL", ruolo: "assassino", frase: "Vive nell'ombra e ci torna dopo ogni colpo. Non l'hai vista arrivare, non la vedrai andare via.",
    mosse: [m("Lama d'Ombra", 0, 30, { penetra: 20 }), m("Passo nell'Ombra", 2, 0, { eff: { tipo: "nebbia" } }), m("Eclissi", 5, 84)] },
  { id: "giuliflora", nome: "Giuliflora", serie: "elementi", rarita: "rara", stile: "DIF", ruolo: "guaritore", frase: "Dove cammina nascono fiori. Dove si arrabbia nascono rovi.",
    mosse: [m("Frusta di Rovi", 0, 26), m("Fioritura", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Abbraccio della Foresta", 5, 76, { drena: 40 })] },
  { id: "simoluce", nome: "Simoluce", serie: "elementi", rarita: "rara", stile: "FOR", ruolo: "stratega", frase: "Splende così tanto che la notte, prima di arrivare, gli chiede il permesso.",
    mosse: [m("Raggio di Luce", 0, 28), m("Alba", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Sole Nascente", 5, 84)] },
  { id: "tiziamma", nome: "Tiziamma", serie: "elementi", rarita: "rara", stile: "FOR", ruolo: "incendiario", frase: "Ha il fuoco nelle vene e nell'armatura: meglio non farlo arrabbiare, anzi meglio non farlo neanche sudare.",
    mosse: [m("Pugno di Fuoco", 0, 30), m("Fiammata", 2, 28, { eff: { tipo: "brucia", val: 7, turni: 3 } }), m("Inferno di Fiamme", 5, 84)] },
  { id: "lollonova", nome: "Lollonova", serie: "elementi", rarita: "comune", stile: "VEL", ruolo: "schivatore", frase: "Tiene una galassia in mano come fosse una palla da giocoliere. Se gli cade, sono guai per tutti.",
    mosse: [m("Polvere di Stelle", 0, 28), m("Gravità", 2, 24, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Supernova", 5, 80)] },
  { id: "ludomagma", nome: "Ludomagma", serie: "elementi", rarita: "comune", stile: "FOR", ruolo: "picchiatore", frase: "Sorride sempre, anche quando il vulcano dietro di lui erutta. Soprattutto allora.",
    mosse: [m("Pugno di Lava", 0, 28), m("Eruzione", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Colata di Magma", 5, 80)] },
  { id: "mauricore", nome: "Mauricore", serie: "elementi", rarita: "comune", stile: "DIF", ruolo: "tank", frase: "Fatto di roccia e radici: per spostarlo ci vuole un terremoto. Che di solito fa lui.",
    mosse: [m("Pugno di Roccia", 0, 26), m("Pelle di Pietra", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Terremoto", 5, 78)] },
  { id: "samulmine", nome: "Samulmine", serie: "elementi", rarita: "comune", stile: "VEL", ruolo: "ladro", frase: "Carico a mille volt: dove passa lui saltano le luci, e pure la tua energia.",
    mosse: [m("Scarica", 0, 28, { eff: { tipo: "ruba", val: 1 } }), m("Saetta", 2, 36), m("Tempesta di Fulmini", 5, 20, { colpi: 4 })] },
  // ---------------- Creature Mistiche ----------------
  { id: "lollendigo", nome: "Lollendigo", serie: "creature", rarita: "leggendaria", stile: "FOR", ruolo: "imprevedibile", frase: "Corna di cervo, pelle di ghiaccio e una fame che non passa mai. Nel bosco d'inverno non sei tu che cacci.",
    mosse: [m("Artigli Gelati", 0, 34), m("Urlo nel Bosco", 2, 30, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Fame del Wendigo", 5, 96, { drena: 35 })] },
  { id: "senelagoon", nome: "Senelagoon", serie: "creature", rarita: "leggendaria", stile: "DIF", ruolo: "guaritore", frase: "Sorride tra le ninfee della laguna. Chi si avvicina troppo non torna più a riva.",
    mosse: [m("Onda di Palude", 0, 30), m("Acqua di Loto", 2, 0, { eff: { tipo: "cura", val: 35 } }), m("Abisso della Laguna", 5, 90, { eff: { tipo: "stordisci", val: 40 } })] },
  { id: "vikyeletro", nome: "Vikyeletro", serie: "creature", rarita: "leggendaria", stile: "VEL", ruolo: "capo", frase: "Mezza ragazza e mezza scheletro: con un fulmine viola sveglia un esercito di ossa.",
    mosse: [m("Tocco d'Ossa", 0, 32), m("Maledizione delle Ossa", 2, 28, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Esercito di Scheletri", 5, 24, { colpi: 4 })] },
  { id: "aligorgona", nome: "Aligorgona", serie: "creature", rarita: "epica", stile: "DIF", ruolo: "difensore", frase: "Al posto dei capelli ha serpenti, e uno sguardo che ti lascia di sasso. Letteralmente.",
    mosse: [m("Coda di Serpente", 0, 30), m("Sguardo di Pietra", 2, 26, { eff: { tipo: "stordisci", val: 45 } }), m("Pietrificazione", 5, 86, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "giulistrega", nome: "Giulistrega", serie: "creature", rarita: "epica", stile: "VEL", ruolo: "stregone", frase: "Cappello a punta, sorriso furbo e un calderone sempre sul fuoco. Meglio non chiederle cosa ci bolle dentro.",
    mosse: [m("Scopa Volante", 0, 30), m("Maleficio", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Calderone Ribollente", 5, 84, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "samulupo", nome: "Samulupo", serie: "creature", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Di giorno ride sempre. Con la luna piena ride lo stesso, ma con molti più denti.",
    mosse: [m("Artigliata", 0, 32), m("Ululato alla Luna", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Notte di Luna Piena", 5, 90, { penetra: 20 })] },
  { id: "simospirit", nome: "Simospirit", serie: "creature", rarita: "epica", stile: "VEL", ruolo: "schivatore", frase: "Un fantasma con la barba: passa attraverso i muri, i colpi e pure le scuse.",
    mosse: [m("Brivido", 0, 32), m("Diventa Invisibile", 2, 0, { eff: { tipo: "nebbia" } }), m("Possessione", 5, 90, { penetra: 25 })] },
  { id: "auranshee", nome: "Auranshee", serie: "creature", rarita: "rara", stile: "VEL", ruolo: "tiratore", frase: "Quando canta lei qualcuno sta per perdere. Di solito non è lei.",
    mosse: [m("Lamento", 0, 30), m("Urlo della Banshee", 2, 28, { eff: { tipo: "stordisci", val: 40 } }), m("Profezia di Sventura", 5, 84)] },
  { id: "diegombie", nome: "Diegombie", serie: "creature", rarita: "rara", stile: "DIF", ruolo: "tank", frase: "Lento, verde e sempre affamato. Lo butti giù e si rialza, lo ributti giù e si rialza ancora.",
    mosse: [m("Morso Zombie", 0, 26, { drena: 30 }), m("Non Muore Mai", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Orda di Zombie", 5, 20, { colpi: 4 })] },
  { id: "ludogargo", nome: "Ludogargo", serie: "creature", rarita: "rara", stile: "DIF", ruolo: "difensore", frase: "Di giorno è una statua sul campanile. Di notte scende a giocare, e gioca duro.",
    mosse: [m("Artiglio di Pietra", 0, 28), m("Pelle di Granito", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Picchiata dal Campanile", 5, 84)] },
  { id: "maurimmia", nome: "Maurimmia", serie: "creature", rarita: "rara", stile: "FOR", ruolo: "stregone", frase: "Tremila anni in un sarcofago e ancora con i baffi a posto. Svegliarlo porta sfortuna. Molta.",
    mosse: [m("Colpo di Bende", 0, 28), m("Maledizione del Faraone", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Tempesta di Sabbia", 5, 84)] },
  { id: "alessiaracne", nome: "Alessiaracne", serie: "creature", rarita: "comune", stile: "VEL", ruolo: "ladro", frase: "Tesse ragnatele tra gli archi del castello e aspetta. Ha tutta la pazienza del mondo, e otto zampe.",
    mosse: [m("Morso di Ragno", 0, 26, { eff: { tipo: "ruba", val: 1 } }), m("Ragnatela", 2, 24, { eff: { tipo: "stordisci", val: 40 } }), m("Nido di Ragni", 5, 20, { colpi: 4 })] },
  { id: "pipkenstein", nome: "Pipkenstein", serie: "creature", rarita: "comune", stile: "FOR", ruolo: "stratega", frase: "Cuciture in faccia, bulloni nel collo e occhiali sul naso: il fulmine giusto e torna come nuovo.",
    mosse: [m("Pugno Cucito", 0, 28), m("Scossa Vitale", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("È Vivo!", 5, 84)] },
  { id: "ritarena", nome: "Ritarena", serie: "creature", rarita: "comune", stile: "DIF", ruolo: "guaritore", frase: "Coda da sirena e risata contagiosa: canta per i marinai, che poi però non tornano a casa.",
    mosse: [m("Colpo di Coda", 0, 26), m("Canto della Sirena", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Richiamo degli Abissi", 5, 76, { drena: 40 })] },
  { id: "tizidrac", nome: "Tizidrac", serie: "creature", rarita: "comune", stile: "FOR", ruolo: "assassino", frase: "Mantello rosso, canini lucidi e un castello in collina. Ti invita a cena: il menù sei tu.",
    mosse: [m("Morso del Vampiro", 0, 26, { drena: 40 }), m("Nuvola di Pipistrelli", 2, 24, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Sete di Sangue", 5, 80, { drena: 40 })] },
  // ---------------- Cyborg ----------------
  { id: "alessiai", nome: "Alessi.AI", serie: "cyborg", rarita: "leggendaria", stile: "VEL", ruolo: "stratega", frase: "Un'intelligenza artificiale con gli occhiali: ha già calcolato come finisce la partita. Spoiler: vince lei.",
    mosse: [m("Analisi del Bersaglio", 0, 32, { penetra: 20 }), m("Algoritmo", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Singolarità", 5, 94, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "diegobot", nome: "Diegobot", serie: "cyborg", rarita: "leggendaria", stile: "DIF", ruolo: "tank", frase: "Due tonnellate di metallo e un reattore nel petto. Il sorrisetto, invece, è rimasto quello di prima.",
    mosse: [m("Pugno Idraulico", 0, 34), m("Campo di Forza", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Reattore al Massimo", 5, 98)] },
  { id: "ritron", nome: "Ritron", serie: "cyborg", rarita: "leggendaria", stile: "FOR", ruolo: "tiratore", frase: "Ride sempre, anche mentre carica il cannone al plasma. Soprattutto mentre lo carica.",
    mosse: [m("Laser al Plasma", 0, 34), m("Raffica", 2, 15, { colpi: 3 }), m("Cannone Fotonico", 5, 96, { penetra: 25 })] },
  { id: "piptron", nome: "Piptron", serie: "cyborg", rarita: "epica", stile: "DIF", ruolo: "difensore", frase: "Baffi, occhiali e un'armatura che si chiude da sola. Dentro c'è un nucleo che scalda come un piccolo sole.",
    mosse: [m("Pugno Corazzato", 0, 30), m("Scudo Energetico", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Nucleo Solare", 5, 86, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "senetron", nome: "Senetron", serie: "cyborg", rarita: "epica", stile: "VEL", ruolo: "ladro", frase: "Hacker con i ricci: entra nei tuoi sistemi prima che tu finisca di dire «password».",
    mosse: [m("Virus", 0, 30, { eff: { tipo: "ruba", val: 1 } }), m("Hackeraggio", 2, 28, { eff: { tipo: "stordisci", val: 40 } }), m("Download Completo", 5, 86, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "tizitron", nome: "Tizitron", serie: "cyborg", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Più lo ammacchi, più si arrabbia: a ogni colpo gli si accende un'altra spia rossa.",
    mosse: [m("Pugno a Razzo", 0, 32), m("Sovraccarico", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Missili a Ricerca", 5, 22, { colpi: 4 })] },
  { id: "vikybyte", nome: "Vikybyte", serie: "cyborg", rarita: "epica", stile: "VEL", ruolo: "schivatore", frase: "Si muove come un glitch: c'è, non c'è, ti ha già colpito.",
    mosse: [m("Glitch", 0, 32), m("Ologramma", 2, 0, { eff: { tipo: "nebbia" } }), m("Codice Sorgente", 5, 90, { penetra: 25 })] },
  { id: "giulibyte", nome: "GiuliByte", serie: "cyborg", rarita: "rara", stile: "DIF", ruolo: "guaritore", frase: "Metà robot e metà giardino: ripara i circuiti con le foglie e i graffi con un sorriso.",
    mosse: [m("Impulso Verde", 0, 26), m("Riparazione", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Bio-Reattore", 5, 76, { drena: 40 })] },
  { id: "lolloborg", nome: "Lolloborg", serie: "cyborg", rarita: "rara", stile: "FOR", ruolo: "stregone", frase: "Ti guarda con l'occhio viola e dice sempre la stessa cosa: «Sarai assimilato».",
    mosse: [m("Raggio Viola", 0, 28), m("Assimilazione", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("La Resistenza è Inutile", 5, 84)] },
  { id: "ludovolt", nome: "Ludovolt", serie: "cyborg", rarita: "rara", stile: "VEL", ruolo: "incendiario", frase: "Carico a mille volt e sempre sorridente: se gli dai la mano, prendi la scossa.",
    mosse: [m("Scossa", 0, 30), m("Cortocircuito", 2, 28, { eff: { tipo: "brucia", val: 7, turni: 3 } }), m("Alta Tensione", 5, 84)] },
  { id: "samulex", nome: "Samulex", serie: "cyborg", rarita: "rara", stile: "DIF", ruolo: "capo", frase: "Il capo della squadra cyborg: quando lui si carica di fulmini blu, si caricano tutti.",
    mosse: [m("Scarica Blu", 0, 28), m("Protocollo di Squadra", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Tempesta Elettrica", 5, 84)] },
  { id: "alicircuit", nome: "Alicircuit", serie: "cyborg", rarita: "comune", stile: "VEL", ruolo: "assassino", frase: "Circuiti viola sul viso e un fucile sulla spalla: non sbaglia un colpo, e non sorride mai mentre mira.",
    mosse: [m("Lama al Plasma", 0, 28, { penetra: 20 }), m("Mira Laser", 2, 36), m("Colpo di Precisione", 5, 80)] },
  { id: "auroroide", nome: "Auroroid", serie: "cyborg", rarita: "comune", stile: "DIF", ruolo: "stratega", frase: "Androide dorato con la mano di metallo: si sistema i capelli e intanto ricarica tutta la squadra.",
    mosse: [m("Colpo Dorato", 0, 26), m("Ricarica", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Raggio d'Oro", 5, 80)] },
  { id: "mauriborg", nome: "Mauriborg", serie: "cyborg", rarita: "comune", stile: "FOR", ruolo: "tank", frase: "Un carro armato con i baffi: lento a partire, impossibile da fermare.",
    mosse: [m("Pressa Idraulica", 0, 26), m("Corazza Rinforzata", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Schiacciasassi", 5, 78)] },
  { id: "simonex", nome: "Simonex", serie: "cyborg", rarita: "comune", stile: "FOR", ruolo: "imprevedibile", frase: "Le luci rosse lampeggiano sempre: nessuno sa se è un errore di sistema o se è proprio fatto così.",
    mosse: [m("Raggio Rosso", 0, 28), m("Errore di Sistema", 2, 24, { eff: { tipo: "stordisci", val: 40 } }), m("Autodistruzione", 5, 82)] },  // ---------------- Carte da Gioco ----------------
  { id: "alire", nome: "Alire", serie: "carte", rarita: "leggendaria", stile: "DIF", ruolo: "capo", frase: "Re di Coppe: alza il calice e tutto il tavolo brinda con lei. Poi vince lei.",
    mosse: [m("Brindisi Reale", 0, 32), m("Coppa del Re", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Napoletana", 5, 94, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "maurire", nome: "Maurire", serie: "carte", rarita: "leggendaria", stile: "FOR", ruolo: "picchiatore", frase: "Re di Bastoni: la corona in testa e il bastone in mano. Indovina quale dei due usa di più.",
    mosse: [m("Bastonata Reale", 0, 34), m("Briscola", 2, 44, { penetra: 30 }), m("Re di Bastoni", 5, 98)] },
  { id: "tizire", nome: "Tizire", serie: "carte", rarita: "leggendaria", stile: "FOR", ruolo: "assassino", frase: "Re di Spade: non gioca mai a carte scoperte, ma quando cala la spada la mano è finita.",
    mosse: [m("Spada del Re", 0, 32, { penetra: 20 }), m("Striscio", 2, 30, { eff: { tipo: "stordisci", val: 40 } }), m("Scopa!", 5, 98)] },
  { id: "giulasso", nome: "Giulasso", serie: "carte", rarita: "epica", stile: "FOR", ruolo: "imprevedibile", frase: "Asso di Bastoni: sorride, ti saluta e ti cala una mazzata da carico pieno.",
    mosse: [m("Mazzata", 0, 32), m("Asso Pigliatutto", 2, 34, { eff: { tipo: "ruba", val: 1 } }), m("Asso di Bastoni", 5, 90)] },
  { id: "lollocallo", nome: "Lollocallo", serie: "carte", rarita: "epica", stile: "VEL", ruolo: "ladro", frase: "Cavallo di Denari: galoppa sul tavolo e si porta via le monete di tutti.",
    mosse: [m("Carica a Cavallo", 0, 32), m("Rubamazzo", 2, 30, { eff: { tipo: "ruba", val: 1 } }), m("Galoppo d'Oro", 5, 90, { penetra: 25 })] },
  { id: "ludasso", nome: "Ludasso", serie: "carte", rarita: "epica", stile: "DIF", ruolo: "guaritore", frase: "Asso di Coppe: ha sempre il calice pieno e un sorriso per tutti. Anche per chi perde.",
    mosse: [m("Sorso", 0, 28), m("Coppa Colma", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Asso di Coppe", 5, 84, { drena: 35 })] },
  { id: "samasso", nome: "Samasso", serie: "carte", rarita: "epica", stile: "VEL", ruolo: "stratega", frase: "Asso di Denari: corona d'alloro e una moneta d'oro in mano. Conta i punti prima ancora di giocare.",
    mosse: [m("Moneta Lanciata", 0, 30), m("Settebello", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Primiera", 5, 90)] },
  { id: "pipsante", nome: "Pipsante", serie: "carte", rarita: "rara", stile: "DIF", ruolo: "difensore", frase: "Fante di Coppe: piuma sul cappello, coppa in mano e nessuna intenzione di lasciarti passare.",
    mosse: [m("Calice", 0, 28), m("Liscio", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Carico", 5, 84)] },
  { id: "ritare", nome: "Ritare", serie: "carte", rarita: "rara", stile: "DIF", ruolo: "stregone", frase: "Re di Denari: ride, ti mostra una moneta e intanto ne ha già nascoste altre dieci.",
    mosse: [m("Pioggia di Monete", 0, 28), m("Tressette", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Tesoro del Re", 5, 84)] },
  { id: "senecallo", nome: "Senecallo", serie: "carte", rarita: "rara", stile: "FOR", ruolo: "tiratore", frase: "Cavallo di Spade: arriva al galoppo, spada in pugno, e i ricci al vento.",
    mosse: [m("Lancia", 0, 30), m("Cucù", 2, 40), m("Carica di Cavalleria", 5, 84)] },
  { id: "vikante", nome: "Vikante", serie: "carte", rarita: "rara", stile: "VEL", ruolo: "schivatore", frase: "Fante di Bastoni: quando pensi di averla presa, ha già cambiato mano.",
    mosse: [m("Bastoncino", 0, 30), m("Volo", 2, 0, { eff: { tipo: "nebbia" } }), m("Sette e Mezzo", 5, 84, { penetra: 20 })] },
  { id: "alessante", nome: "Alessante", serie: "carte", rarita: "comune", stile: "FOR", ruolo: "picchiatore", frase: "Fante di Spade: occhiali, piuma e spadino. Gioca come se avesse sempre l'asso in mano.",
    mosse: [m("Spadino", 0, 28, { penetra: 20 }), m("Bluff", 2, 24, { eff: { tipo: "stordisci", val: 40 } }), m("Fante di Spade", 5, 80)] },
  { id: "aurante", nome: "Aurante", serie: "carte", rarita: "comune", stile: "VEL", ruolo: "ladro", frase: "Fante di Denari: due monete in mano e lo sguardo di chi ne vuole una terza. La tua.",
    mosse: [m("Moneta d'Oro", 0, 26, { eff: { tipo: "ruba", val: 1 } }), m("Mano Lesta", 2, 34), m("Tutti i Denari", 5, 20, { colpi: 4 })] },
  { id: "diegallo", nome: "Diegallo", serie: "carte", rarita: "comune", stile: "DIF", ruolo: "tank", frase: "Cavallo di Coppe: in sella con un calice in mano senza versarne una goccia. Spostarlo è un'altra storia.",
    mosse: [m("Zoccolata", 0, 26), m("Coppa Scudo", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Galoppata", 5, 78)] },
  { id: "simocallo", nome: "Simocallo", serie: "carte", rarita: "comune", stile: "VEL", ruolo: "imprevedibile", frase: "Cavallo di Bastoni: non si sa mai da che parte arriva, ma si sa che arriva col bastone.",
    mosse: [m("Randellata", 0, 28), m("Sgambetto", 2, 24, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Cavallo Pazzo", 5, 82)] },  // ---------------- Paesi del Mondo ----------------
  { id: "aurorecia", nome: "Aurorecia", serie: "paesi", rarita: "leggendaria", stile: "DIF", ruolo: "stratega", frase: "Grecia: corona d'alloro, tunica bianca e l'Acropoli alle spalle. Ha già consultato l'oracolo: vinci tu? No.",
    mosse: [m("Lancia di Sparta", 0, 32), m("Oracolo di Delfi", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Furia degli Dei", 5, 94, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "pipscozia", nome: "Pipscozia", serie: "paesi", rarita: "leggendaria", stile: "FOR", ruolo: "picchiatore", frase: "Scozia: kilt, pelliccia e spadone. Quando suona la cornamusa, nelle Highlands tremano anche i castelli.",
    mosse: [m("Colpo di Claymore", 0, 34), m("Cornamusa", 2, 30, { eff: { tipo: "stordisci", val: 40 } }), m("Highlander", 5, 98)] },
  { id: "simonusa", nome: "Simonusa", serie: "paesi", rarita: "leggendaria", stile: "VEL", ruolo: "capo", frase: "Stati Uniti: cilindro a stelle e strisce e un sorriso da campagna elettorale. Tutto in grande, anche i colpi.",
    mosse: [m("Fuochi del 4 Luglio", 0, 34), m("Sogno Americano", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Stelle e Strisce", 5, 24, { colpi: 4 })] },
  { id: "aleghilterra", nome: "Aleghilterra", serie: "paesi", rarita: "epica", stile: "DIF", ruolo: "difensore", frase: "Inghilterra: corona in testa, occhiali sul naso e il Big Ben che segna l'ora del tè. E della tua sconfitta.",
    mosse: [m("Tè delle Cinque", 0, 30), m("Guardia Reale", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Corona Imperiale", 5, 90)] },
  { id: "diegspagna", nome: "Diegspagna", serie: "paesi", rarita: "epica", stile: "VEL", ruolo: "schivatore", frase: "Spagna: giacca da torero ricamata d'oro e mantello rosso. Tu carichi, lui si sposta. Olé.",
    mosse: [m("Banderilla", 0, 32, { penetra: 20 }), m("Olé!", 2, 0, { eff: { tipo: "nebbia" } }), m("Corrida", 5, 90, { penetra: 25 })] },
  { id: "ritalia", nome: "Ritalia", serie: "paesi", rarita: "epica", stile: "FOR", ruolo: "imprevedibile", frase: "Italia: corona d'alloro, tricolore sulle spalle e il Colosseo dietro. Ride sempre, ma guai a toccarle la pasta.",
    mosse: [m("Schiaffo all'Italiana", 0, 32), m("Mamma Mia!", 2, 30, { eff: { tipo: "stordisci", val: 40 } }), m("Colosseo", 5, 90)] },
  { id: "samubrasil", nome: "Samubrasil", serie: "paesi", rarita: "epica", stile: "VEL", ruolo: "assassino", frase: "Brasile: piume, paillettes e il Cristo Redentore sullo sfondo. Balla la samba anche mentre ti mette al tappeto.",
    mosse: [m("Passo di Samba", 0, 30, { penetra: 20 }), m("Carnevale", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Rovesciata", 5, 90)] },
  { id: "maurigitto", nome: "Maurigitto", serie: "paesi", rarita: "rara", stile: "DIF", ruolo: "stregone", frase: "Egitto: copricapo da faraone, baffi perfetti e le piramidi alle spalle. Ti guarda come si guarda uno schiavo.",
    mosse: [m("Scettro del Faraone", 0, 28), m("Maledizione della Piramide", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Tempesta del Deserto", 5, 84)] },
  { id: "senesia", nome: "Senesia", serie: "paesi", rarita: "rara", stile: "FOR", ruolo: "incendiario", frase: "Tunisia: velo ricamato, orecchini d'oro e un sorriso caldo come il sole del deserto. Le spezie, poi, bruciano.",
    mosse: [m("Harissa", 0, 28, { eff: { tipo: "brucia", val: 4, turni: 2 } }), m("Vento del Sahara", 2, 24, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Sole di Cartagine", 5, 82, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "tizgeria", nome: "Tizgeria", serie: "paesi", rarita: "rara", stile: "FOR", ruolo: "tiratore", frase: "Algeria: turbante, giacca verde ricamata e un pugnale alla cintura. Arriva dal deserto e non sbaglia un colpo.",
    mosse: [m("Pugnale Berbero", 0, 30), m("Raffica del Deserto", 2, 14, { colpi: 3 }), m("Casbah", 5, 84)] },
  { id: "vikappone", nome: "Vikappone", serie: "paesi", rarita: "rara", stile: "VEL", ruolo: "guaritore", frase: "Giappone: kimono rosso, ombrellino e fiori di ciliegio. Ti offre un tè con un inchino, poi ti sistema.",
    mosse: [m("Ventaglio", 0, 26), m("Cerimonia del Tè", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Tempesta di Ciliegi", 5, 76, { drena: 40 })] },
  { id: "alirtogallo", nome: "Alirtogallo", serie: "paesi", rarita: "comune", stile: "VEL", ruolo: "ladro", frase: "Portogallo: foulard rosso, collana d'oro e Lisbona al tramonto. Canta il fado e intanto ti sfila l'energia.",
    mosse: [m("Saudade", 0, 26, { eff: { tipo: "ruba", val: 1 } }), m("Fado Triste", 2, 24, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Onda di Nazaré", 5, 80)] },
  { id: "giulancia", nome: "Giulancia", serie: "paesi", rarita: "comune", stile: "FOR", ruolo: "stratega", frase: "Francia: basco rosso, maglia a righe e una baguette sotto il braccio. Che non è solo per mangiare.",
    mosse: [m("Colpo di Baguette", 0, 28), m("Croissant", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Torre Eiffel", 5, 84)] },
  { id: "lollirlanda", nome: "Lollirlanda", serie: "paesi", rarita: "comune", stile: "DIF", ruolo: "tank", frase: "Irlanda: mantello verde, pinta di stout in mano e le scogliere alle spalle. Più lo colpisci, più ordina da bere.",
    mosse: [m("Pugno Celtico", 0, 26), m("Pinta di Stout", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Scogliere di Moher", 5, 78)] },
  { id: "ludormania", nome: "Ludormania", serie: "paesi", rarita: "comune", stile: "DIF", ruolo: "capo", frase: "Germania: cappello con la piuma, bretelle e un boccale enorme. All'Oktoberfest guida lui il brindisi, e la squadra.",
    mosse: [m("Boccale di Birra", 0, 26), m("Oktoberfest", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Precisione Tedesca", 5, 78)] },
  // ---------------- Far West ----------------
  { id: "seneloon", nome: "Seneloon", serie: "farwest", rarita: "leggendaria", stile: "FOR", ruolo: "imprevedibile", frase: "La regina del saloon: ricci al vento, sorriso da cartolina e una bottiglia sempre a portata di mano. Per brindare, o per tirartela.",
    mosse: [m("Bottigliata", 0, 34), m("Rissa da Saloon", 2, 13, { colpi: 3 }), m("Whisky in Fiamme", 5, 96, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "giuvlass", nome: "Giuvlass", serie: "farwest", rarita: "leggendaria", stile: "VEL", ruolo: "assassino", frase: "Sorride come se ti stesse offrendo da bere. Poi suona mezzogiorno, e la sua mano è già sulla pistola.",
    mosse: [m("Occhiolino", 0, 32, { penetra: 20 }), m("Sorriso Disarmante", 2, 0, { eff: { tipo: "nebbia" } }), m("Mezzogiorno di Fuoco", 5, 98, { penetra: 30 })] },
  { id: "ludobunty", nome: "Ludobunty", serie: "farwest", rarita: "leggendaria", stile: "DIF", ruolo: "tiratore", frase: "Cacciatore di taglie: cartuccera piena e un elenco di nomi in tasca. Se c'è il tuo, preparati a correre.",
    mosse: [m("Colpo di Winchester", 0, 32), m("Taglia sulla Testa", 2, 28, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Vivo o Morto", 5, 94)] },
  { id: "alicolt", nome: "Alicolt", serie: "farwest", rarita: "epica", stile: "VEL", ruolo: "tiratore", frase: "Capelli d'oro e una Colt d'argento sotto il braccio. Sei colpi nel tamburo, e non ne spreca nemmeno uno.",
    mosse: [m("Colpo dall'Anca", 0, 30, { penetra: 20 }), m("Rotazione del Tamburo", 2, 0, { eff: { tipo: "potenzia", val: 30, turni: 3 } }), m("Sei Colpi", 5, 15, { colpi: 6 })] },
  { id: "auroraider", nome: "Auroraider", serie: "farwest", rarita: "epica", stile: "FOR", ruolo: "ladro", frase: "Ricercata: 5.000 dollari di taglia. Lei il manifesto lo ha visto, e si è offesa che fossero così pochi.",
    mosse: [m("Calcio di Fucile", 0, 30, { eff: { tipo: "ruba", val: 1 } }), m("Assalto alla Diligenza", 2, 28, { eff: { tipo: "ruba", val: 1 } }), m("Ricercata", 5, 90)] },
  { id: "lollawless", nome: "Lollawless", serie: "farwest", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Senza legge e senza fretta: arriva a cavallo dal deserto, entra nel saloon e la rissa comincia da sola.",
    mosse: [m("Pugno da Saloon", 0, 32), m("Rissa Senza Legge", 2, 30, { eff: { tipo: "stordisci", val: 40 } }), m("Fuorilegge", 5, 92)] },
  { id: "simarshal", nome: "Simarshal", serie: "farwest", rarita: "epica", stile: "DIF", ruolo: "capo", frase: "Barba folta, stella da marshal sul petto e lo sguardo di chi ha già deciso chi finisce in prigione stasera.",
    mosse: [m("Calcio di Pistola", 0, 30), m("Stella del Marshal", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Legge del West", 5, 86, { eff: { tipo: "indebolisci", val: 25, turni: 2 } })] },
  { id: "alessoutlaw", nome: "Alessoutlaw", serie: "farwest", rarita: "rara", stile: "VEL", ruolo: "stregone", frase: "Fuorilegge con gli occhiali: legge il piano della rapina due volte, poi te lo fa saltare in faccia.",
    mosse: [m("Sguardo da Ricercata", 0, 28), m("Polvere negli Occhi", 2, 24, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Rapina al Treno", 5, 84)] },
  { id: "dieganger", nome: "Dieganger", serie: "farwest", rarita: "rara", stile: "DIF", ruolo: "tank", frase: "Ranger del deserto: carabina in spalla e cartucce sul petto. Ha dormito sotto le stelle più notti di quante ne ricordi.",
    mosse: [m("Calcio di Carabina", 0, 28), m("Bivacco", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Pattuglia del Ranger", 5, 82)] },
  { id: "mauribandit", nome: "Mauribandit", serie: "farwest", rarita: "rara", stile: "FOR", ruolo: "incendiario", frase: "Bandito coi baffi e l'aria di chi ha appena acceso una miccia. Il problema è che non ti dice dove.",
    mosse: [m("Miccia Corta", 0, 28, { eff: { tipo: "brucia", val: 4, turni: 2 } }), m("Candelotto", 2, 30), m("Dinamite", 5, 82, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "samuero", nome: "Samuero", serie: "farwest", rarita: "rara", stile: "VEL", ruolo: "schivatore", frase: "Vaquero col lazo in spalla e un sorriso che non si spegne nemmeno al rodeo. Tu lo carichi, lui salta.",
    mosse: [m("Lazo", 0, 28, { penetra: 20 }), m("Rodeo", 2, 0, { eff: { tipo: "nebbia" } }), m("Carica della Mandria", 5, 84)] },
  { id: "pipstolero", nome: "Pipstolero", serie: "farwest", rarita: "comune", stile: "VEL", ruolo: "assassino", frase: "Pistolero con baffi e occhiali: la pistola la tiene alta, vicino alla faccia. Dice che così prende meglio la mira.",
    mosse: [m("Estrazione Rapida", 0, 28, { penetra: 20 }), m("Doppietta", 2, 15, { colpi: 2 }), m("Duello all'Alba", 5, 80, { penetra: 25 })] },
  { id: "ritaloon", nome: "Ritaloon", serie: "farwest", rarita: "comune", stile: "DIF", ruolo: "guaritore", frase: "Lavora al saloon e ride più forte del pianoforte. Un bicchiere da lei rimette in piedi anche un cowboy steso.",
    mosse: [m("Vassoio Volante", 0, 26), m("Giro di Whisky", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Can-Can", 5, 76, { drena: 40 })] },
  { id: "tiziariffo", nome: "Tiziariffo", serie: "farwest", rarita: "comune", stile: "DIF", ruolo: "difensore", frase: "Lo sceriffo della città: stella sul cappello, stella sul petto e l'ufficio alle spalle. In questa città, la legge è lui.",
    mosse: [m("Manette", 0, 26), m("Distintivo", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("In Nome della Legge", 5, 78)] },
  { id: "vikylasso", nome: "Vikylasso", serie: "farwest", rarita: "comune", stile: "FOR", ruolo: "stratega", frase: "Cowgirl dal sorriso dolce e dal lazo infallibile: il bestiame lo prende al primo lancio. E tu non sei più veloce di un vitello.",
    mosse: [m("Frustata di Lazo", 0, 26), m("Giro di Lazo", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Lazo Stretto", 5, 76, { eff: { tipo: "stordisci", val: 40 } })] },
  // ---------------- Apocalisse ----------------
  { id: "dieghunter", nome: "Dieghunter", serie: "apocalisse", rarita: "leggendaria", stile: "VEL", ruolo: "tiratore", frase: "Cacciatore di infetti: balestra in spalla, cartucce sul petto e un graffio sulla guancia. Gli infetti li conta a tacche, e ha finito il posto.",
    mosse: [m("Dardo di Balestra", 0, 34, { penetra: 20 }), m("Trappola", 2, 28, { eff: { tipo: "stordisci", val: 40 } }), m("Caccia Grossa", 5, 24, { colpi: 4 })] },
  { id: "pipscience", nome: "Pipscience", serie: "apocalisse", rarita: "leggendaria", stile: "DIF", ruolo: "stregone", frase: "Lo scienziato che forse ha creato il virus, forse la cura. Tiene in mano una provetta verde e non ti dice quale delle due.",
    mosse: [m("Provetta Verde", 0, 32, { eff: { tipo: "brucia", val: 4, turni: 2 } }), m("Siero Sperimentale", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Paziente Zero", 5, 94, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "ritageddon", nome: "Ritageddon", serie: "apocalisse", rarita: "leggendaria", stile: "FOR", ruolo: "picchiatore", frase: "Il mondo è finito e lei ride lo stesso. Corona di filo spinato, balestra in mano: l'Armageddon è arrivato, e ha il suo sorriso.",
    mosse: [m("Calcio di Balestra", 0, 34), m("Raffica di Dardi", 2, 14, { colpi: 3 }), m("Armageddon", 5, 98)] },
  { id: "alesshack", nome: "Alesshack", serie: "apocalisse", rarita: "epica", stile: "VEL", ruolo: "ladro", frase: "Nel bunker, tra schermi e mappe del contagio, è l'unica che sa ancora dove sono le scorte. E come prendersi le tue.",
    mosse: [m("Intrusione", 0, 30, { eff: { tipo: "ruba", val: 1 } }), m("Blackout", 2, 28, { eff: { tipo: "stordisci", val: 40 } }), m("Virus nel Sistema", 5, 88, { eff: { tipo: "ruba", val: 1 } })] },
  { id: "maurizomb", nome: "Maurizomb", serie: "apocalisse", rarita: "epica", stile: "DIF", ruolo: "tank", frase: "Corazza fatta a mano, mazza da demolizione in spalla e lo sguardo di chi ha già abbattuto mezza orda. L'altra metà sta arrivando.",
    mosse: [m("Mazzata", 0, 32), m("Pelle Dura", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Terremoto di Mazza", 5, 90)] },
  { id: "tizianator", nome: "Tizianator", serie: "apocalisse", rarita: "epica", stile: "FOR", ruolo: "incendiario", frase: "Lo sterminatore della zona rossa: giubbotto tattico, teschio sul braccio e un lanciafiamme. Dove passa lui, gli infetti non tornano.",
    mosse: [m("Fiammata", 0, 30, { eff: { tipo: "brucia", val: 4, turni: 2 } }), m("Lanciafiamme", 2, 28, { eff: { tipo: "brucia", val: 5, turni: 2 } }), m("Sterminio", 5, 86, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "vikydead", nome: "Vikydead", serie: "apocalisse", rarita: "epica", stile: "VEL", ruolo: "tiratore", frase: "Cappuccio, maschera antigas al collo e un fucile in spalla. Si muove nella nebbia tossica senza fare rumore, e senza sbagliare.",
    mosse: [m("Colpo Silenzioso", 0, 30, { penetra: 20 }), m("Maschera Antigas", 2, 0, { eff: { tipo: "nebbia" } }), m("Cecchino", 5, 92, { penetra: 25 })] },
  { id: "alizombie", nome: "Alizombie", serie: "apocalisse", rarita: "rara", stile: "FOR", ruolo: "imprevedibile", frase: "Un graffio sulla guancia e quel sorriso un po' strano. È ancora dei nostri? Mezza sì. Mezza ha fame.",
    mosse: [m("Morso", 0, 28, { drena: 20 }), m("Contagio", 2, 24, { eff: { tipo: "indebolisci", val: 25, turni: 2 } }), m("Orda", 5, 16, { colpi: 5 })] },
  { id: "auroravive", nome: "Auroravive", serie: "apocalisse", rarita: "rara", stile: "DIF", ruolo: "guaritore", frase: "Il medico del campo: stetoscopio al collo, borsa con la croce rossa e nessuna voglia di arrendersi. Finché c'è lei, nessuno resta a terra.",
    mosse: [m("Bisturi", 0, 26), m("Kit di Pronto Soccorso", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Defibrillatore", 5, 78, { eff: { tipo: "stordisci", val: 40 } })] },
  { id: "lollivor", nome: "Lollivor", serie: "apocalisse", rarita: "rara", stile: "FOR", ruolo: "capo", frase: "Il sopravvissuto: mazza chiodata in spalla, radio alla cintura e un gruppo che lo segue ovunque. Anche dentro l'orda.",
    mosse: [m("Mazza Chiodata", 0, 30), m("Grido di Raduno", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Ultimo Sopravvissuto", 5, 84)] },
  { id: "simopter", nome: "Simopter", serie: "apocalisse", rarita: "rara", stile: "DIF", ruolo: "stratega", frase: "Il pilota dell'elicottero: cuffie in testa, braccia incrociate e l'unico passaggio per uscire dalla zona rossa. Se ti sta simpatico.",
    mosse: [m("Raffica dal Cielo", 0, 28), m("Rifornimento", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Evacuazione", 5, 82)] },
  { id: "giulimort", nome: "Giulimort", serie: "apocalisse", rarita: "comune", stile: "VEL", ruolo: "schivatore", frase: "Zaino in spalla e un sorriso che l'apocalisse non è riuscita a spegnere. Quando l'orda arriva, lei è già dall'altra parte della strada.",
    mosse: [m("Coltello da Caccia", 0, 26, { penetra: 20 }), m("Corri!", 2, 0, { eff: { tipo: "nebbia" } }), m("Fuga tra le Rovine", 5, 78)] },
  { id: "ludovirus", nome: "Ludovirus", serie: "apocalisse", rarita: "comune", stile: "FOR", ruolo: "stratega", frase: "Il meccanico del rifugio: occhialoni sulla fronte, chiavi inglesi in tasca e uno sciame di droni fatti con i rottami.",
    mosse: [m("Chiave Inglese", 0, 26), m("Drone Spia", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Sciame di Droni", 5, 13, { colpi: 6 })] },
  { id: "samudead", nome: "Samudead", serie: "apocalisse", rarita: "comune", stile: "VEL", ruolo: "assassino", frase: "Fucile tra le mani, teschio sulla spalla e un sorriso da incoscienza pura. Dietro di lui la torre di guardia: lassù non manca un colpo.",
    mosse: [m("Colpo di Fucile", 0, 28, { penetra: 20 }), m("Mirino", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Colpo alla Testa", 5, 80, { penetra: 25 })] },
  { id: "senemune", nome: "Senemune", serie: "apocalisse", rarita: "comune", stile: "DIF", ruolo: "difensore", frase: "L'unica immune: il virus la morde e si arrende. Sorride tra i cartelli di quarantena, perché il suo sangue è la speranza di tutti.",
    mosse: [m("Spallata", 0, 26), m("Anticorpi", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Sangue Immune", 5, 76, { drena: 40 })] },
];


// Chi è la persona dietro ogni carta (dedotto dai nomi delle carte).
// Regola: ogni persona ha al massimo UNA carta leggendaria (o ultra) per serie (può averne in più serie).
// Le carte senza persona qui sotto non si possono controllare: vanno aggiunte.
const PERSONE = {
  aphroalessia: "Alessia", vidalessia: "Alessia", wandessia: "Alessia",
  atharita: "Rita", caulifrita: "Rita", wonderrita: "Rita",
  dionpips: "Pips", pipsccolo: "Pips", cypips: "Pips",
  aresorenzo: "Lorenzo", gohanlollo: "Lorenzo",
  herdiego: "Diego", diego17: "Diego", diegkeye: "Diego",
  efesamuele: "Samuele", gokiele: "Samuele",
  poseludovico: "Ludovico", freezovico: "Ludovico",
  adelrizio: "Maurizio", vegerizio: "Maurizio",
  zeutiz: "Tiziano", criliziano: "Tiziano",
  artalice: "Alice", chichice: "Alice",
  demviky: "Viky", panky: "Viky",
  solmone: "Simone", brolymone: "Simone",
  persene: "Senè", bulsene: "Senè",
  aurera: "Aurora", c18ora: "Aurora",
  nikulia: "Giulia", giulmai: "Giulia",
  // Maghi
  alessmione: "Alessia", ritadora: "Rita", pipverus: "Pips", lollon: "Lorenzo", diegirius: "Diego", samulett: "Samuele",
  ludraco: "Ludovico", mauriziente: "Maurizio", tizievil: "Tiziano", ginice: "Alice", vikatrix: "Viky", simoldemort: "Simone",
  seneverr: "Senè", auroruna: "Aurora", giulifleur: "Giulia",
  // Demoni
  lollifer: "Lorenzo", samuzebub: "Samuele", simothan: "Simone", alissith: "Alessia", mauriphomet: "Maurizio", ludomodeus: "Ludovico",
  tiziazel: "Tiziano", aurorrigan: "Aurora", pipmon: "Pips", diegial: "Diego", ritacubus: "Rita", alistaroth: "Alice",
  giulimaah: "Giulia", vikamashtu: "Viky", senecate: "Senè",
  // Mestieri
  ludhacker: "Ludovico", lollinista: "Lorenzo", tiziegista: "Tiziano", alispia: "Alice", senebroker: "Senè", maurialpinista: "Maurizio",
  pipciatore: "Pips", simonducer: "Simone", diegarman: "Diego", samutografo: "Samuele", alessiologa: "Alessia", vikyventura: "Viky",
  auroressa: "Aurora", ritanimatrice: "Rita", giudella: "Giulia",
  // Simpson
  tizomer: "Tiziano", lollart: "Lorenzo", alisa: "Alice", simarney: "Simone", maurilanders: "Maurizio", samusty: "Samuele", dieggum: "Diego",
  pimoe: "Pips", ludohouse: "Ludovico", alledna: "Alessia", vaggie: "Viky", giupatty: "Giulia", selmene: "Senè", riessica: "Rita", aurrerri: "Aurora",
  // Barbapapà
  lollapa: "Lorenzo", tizoba: "Tiziano", diegopa: "Diego", pipsoba: "Pips", samuba: "Samuele", mauriba: "Maurizio", ludopa: "Ludovico", simopa: "Simone",
  alebella: "Alessia", aliottina: "Alice", aurobrava: "Aurora", giulialla: "Giulia", ritamma: "Rita", seneforte: "Senè", vikylalla: "Viky",
  // Star Wars
  ludowalker: "Ludovico", giueia: "Giulia", mauribecca: "Maurizio", lollakin: "Lorenzo", tizvader: "Tiziano", simalpatine: "Simone", samuwan: "Samuele",
  aleadme: "Alessia", alihsoka: "Alice", pipsobafett: "Pips", ritey: "Rita", aurothma: "Aurora", diegoren: "Diego", senendulla: "Senè", vikyerso: "Viky",
  // Elementi
  auraria: "Aurora", senesuono: "Senè", vikytal: "Viky", alessieno: "Alessia", diegaqua: "Diego", pipgelo: "Pips", ritacrys: "Rita",
  alisombra: "Alice", giuliflora: "Giulia", simoluce: "Simone", tiziamma: "Tiziano", lollonova: "Lorenzo", ludomagma: "Ludovico", mauricore: "Maurizio", samulmine: "Samuele",
  // Creature Mistiche
  lollendigo: "Lorenzo", senelagoon: "Senè", vikyeletro: "Viky", aligorgona: "Alice", giulistrega: "Giulia", samulupo: "Samuele", simospirit: "Simone",
  auranshee: "Aurora", diegombie: "Diego", ludogargo: "Ludovico", maurimmia: "Maurizio", alessiaracne: "Alessia", pipkenstein: "Pips", ritarena: "Rita", tizidrac: "Tiziano",
  // Cyborg
  alessiai: "Alessia", diegobot: "Diego", ritron: "Rita", piptron: "Pips", senetron: "Senè", tizitron: "Tiziano", vikybyte: "Viky",
  giulibyte: "Giulia", lolloborg: "Lorenzo", ludovolt: "Ludovico", samulex: "Samuele", alicircuit: "Alice", auroroide: "Aurora", mauriborg: "Maurizio", simonex: "Simone",
  // Carte da Gioco
  alire: "Alice", maurire: "Maurizio", tizire: "Tiziano", giulasso: "Giulia", lollocallo: "Lorenzo", ludasso: "Ludovico", samasso: "Samuele",
  pipsante: "Pips", ritare: "Rita", senecallo: "Senè", vikante: "Viky", alessante: "Alessia", aurante: "Aurora", diegallo: "Diego", simocallo: "Simone",
  // Paesi del Mondo
  aurorecia: "Aurora", pipscozia: "Pips", simonusa: "Simone", aleghilterra: "Alessia", diegspagna: "Diego", ritalia: "Rita", samubrasil: "Samuele",
  maurigitto: "Maurizio", senesia: "Senè", tizgeria: "Tiziano", vikappone: "Viky", alirtogallo: "Alice", giulancia: "Giulia", lollirlanda: "Lorenzo", ludormania: "Ludovico",
  // Far West
  seneloon: "Senè", giuvlass: "Giulia", ludobunty: "Ludovico", alicolt: "Alice", auroraider: "Aurora", lollawless: "Lorenzo", simarshal: "Simone",
  alessoutlaw: "Alessia", dieganger: "Diego", mauribandit: "Maurizio", samuero: "Samuele", pipstolero: "Pips", ritaloon: "Rita", tiziariffo: "Tiziano", vikylasso: "Viky",
  // Apocalisse
  dieghunter: "Diego", pipscience: "Pips", ritageddon: "Rita", alesshack: "Alessia", maurizomb: "Maurizio", tizianator: "Tiziano", vikydead: "Viky",
  alizombie: "Alice", auroravive: "Aurora", lollivor: "Lorenzo", simopter: "Simone", giulimort: "Giulia", ludovirus: "Ludovico", samudead: "Samuele", senemune: "Senè",
};
CARTE.forEach(c => { c.persona = PERSONE[c.id] || ""; });

// Valori di partenza scritti qui nel codice. L'admin può cambiarli dal gioco:
// le sue scelte (persona, serie, rarità) stanno nel database e vengono applicate all'avvio.
// Versione Ultra: alcune carte (scelte dall'admin) hanno anche una versione Ultra da trovare, come l'olografica:
// la carta base resta quella, la versione Ultra le dà la cornice nera e oro e +10% di PV e danni.
// nov 2026: rarità ribilanciate perché ogni amico abbia più o meno lo stesso numero di leggendarie, epiche, rare e comuni.
// Qui le rarità di PRIMA delle carte cambiate: servono a sistemare l'Ascesa di chi le aveva già fatte salire.
const RARITA_PRIMA_NOV26 = {"freezovico": "epica", "gohanlollo": "epica", "bulsene": "rara", "c18ora": "rara", "poseludovico": "leggendaria", "adelrizio": "epica", "aresorenzo": "leggendaria", "atharita": "epica", "dionpips": "rara", "nikulia": "rara", "demviky": "comune", "persene": "comune", "samulett": "leggendaria", "mauriziente": "leggendaria", "pipverus": "epica", "vikatrix": "epica", "lollon": "rara", "giulifleur": "comune", "simothan": "leggendaria", "mauriphomet": "epica", "tiziazel": "epica", "aurorrigan": "epica", "diegial": "rara", "ritacubus": "rara", "giulimaah": "comune", "lollinista": "leggendaria", "senebroker": "epica", "maurialpinista": "epica", "simonducer": "epica", "diegarman": "rara", "samutografo": "rara", "alessiologa": "rara", "vikyventura": "rara", "auroressa": "comune", "tizomer": "leggendaria", "simarney": "epica", "samusty": "epica", "dieggum": "epica", "ludohouse": "rara", "vaggie": "rara", "giupatty": "comune"};
// Una sola versione Ultra per serie. Da quando le serie sono più degli amici, un amico può averne più di una
// (ma conviene darla prima a chi ne ha meno: lo mostra il riquadro «Versioni Ultra» nel pannello admin).
// Supereroi Iron Lus, Mafiosi La Reina, Dragon Ball Gokiele (Samuele), Dei Zeu Tiz (Tiziano), Maghi Simoldemort (Simone),
// Demoni Lollifer (Lorenzo), Mestieri Ludhacker (Ludovico), Simpson Alisa (Alice), Barbapapà Ritamma (Rita), Star Wars Giueia (Giulia).
const ULTRA_DI_PARTENZA = ["ironlus", "reina", "gokiele", "zeutiz", "simoldemort", "lollifer", "ludhacker", "alisa", "ritamma", "giueia", "auraria", "vikyeletro", "alessiai", "maurire", "pipscozia", "seneloon", "dieghunter"];
CARTE.forEach(c => { c.ultra = ULTRA_DI_PARTENZA.includes(c.id); });
const CARTE_ORIGINALI = Object.fromEntries(CARTE.map(c => [c.id, { serie: c.serie, rarita: c.rarita, stile: c.stile, persona: c.persona, ultra: c.ultra, mosse: c.mosse.map(m => m.nome) }]));
function applicaConfigCarte(cfg) {
  const mappa = (cfg && cfg.carte) || {};
  CARTE.forEach(c => {
    const o = CARTE_ORIGINALI[c.id], m = mappa[c.id] || {};
    c.serie = SERIE[m.serie] ? m.serie : o.serie;
    c.rarita = RARITA[m.rarita] ? m.rarita : o.rarita;
    c.stile = STILI[m.stile] ? m.stile : o.stile;
    c.ultra = typeof m.ultra === "boolean" ? m.ultra : o.ultra;
    c.persona = typeof m.persona === "string" ? m.persona.trim().slice(0, 30) : o.persona;
    // nomi delle mosse cambiati dall'admin (solo il nome: costo, potenza ed effetti restano quelli)
    c.mosse.forEach((mo, i) => { const v = m.mosse && typeof m.mosse[i] === "string" ? m.mosse[i].trim().slice(0, 40) : ""; mo.nome = v || o.mosse[i]; });
  });
}

// Controllo della regola: persone con due leggendarie nella stessa serie e carte senza persona
const leggendarieDoppie = cs => Object.keys(SERIE).some(se => cs.filter(c => c.serie === se && RARE_TOP(c.rarita)).length > 1);
function controllaLeggendarie() {
  const gruppi = {};
  CARTE.forEach(c => { if (c.persona) (gruppi[c.persona] = gruppi[c.persona] || []).push(c); });
  const problemi = Object.entries(gruppi).filter(([, cs]) => leggendarieDoppie(cs)).map(([p]) => p);
  return { gruppi, problemi, senza: CARTE.filter(c => !c.persona) };
}

const PER_ID = Object.fromEntries(CARTE.map(c => [c.id, c]));
// Vecchi id → nuovi (per non perdere le carte già trovate prima del cambio nomi)
const ID_VECCHI = { stella: "gossip", smeraldo: "comora", spia: "vedovagreca", ragno: "spidertoto", amazzone: "wonderrita", viola: "stellascura",
  ingannatore: "mieloki", corazza: "ironlus", argento: "cypips", tonante: "mauthor", scudo: "undercut", gigante: "ligulk" };
// ---------------- Livelli (1–30) e lode ----------------
// Le carte crescono con l'esperienza (XP) presa in battaglia e con i doppioni.
// Esempio: da Lv1 a Lv2 servono 40 XP, da Lv29 a Lv30 ne servono 320; in tutto 5220 XP.
// Arrivata al 30, la carta continua a fare esperienza: con altri 2000 XP prende la LODE.
const LIVELLO_MAX = 30, XP_LODE = 2000, XP_DOPPIONE = 120;
const xpPerLivello = L => 30 + 10 * L;                       // XP per passare da L a L+1
const xpPerArrivare = L => { let t = 0; for (let k = 1; k < L; k++) t += xpPerLivello(k); return t; };
const XP_AL_30 = xpPerArrivare(LIVELLO_MAX);
function infoLivello(xp = 0) {
  let L = 1, resto = xp;
  while (L < LIVELLO_MAX && resto >= xpPerLivello(L)) { resto -= xpPerLivello(L); L++; }
  if (L < LIVELLO_MAX) return { liv: L, dentro: resto, serve: xpPerLivello(L), lode: false };
  const extra = xp - XP_AL_30;
  return { liv: LIVELLO_MAX, dentro: Math.min(extra, XP_LODE), serve: XP_LODE, lode: extra >= XP_LODE };
}
// Ogni livello dà +2% (al 30: +58%); la lode aggiunge un altro 5%.
const fattoreLivello = (liv = 1, lode = false) => (1 + 0.02 * (liv - 1)) * (lode ? 1.05 : 1);

// ---------------- Potenziamento a mano ----------------
// Le carte salgono di livello solo quando le potenzi tu. Ogni doppione dà potenziatori per QUELLA carta
// (di più se è rara, perché i suoi doppioni escono meno). Per ogni livello servono potenziatori + monete.
// Esempio: Lv1→2 costa 3 potenziatori e 5 monete; Lv10→11: 8 e 20; Lv29→30: 17 e 110.
// In tutto, dal 1 al 30: 297 potenziatori e 1205 monete (nov 2026: le monete erano il doppio).
const POT_DOPPIONE = { comune: 10, rara: 12, epica: 24, leggendaria: 60 };   // nov 2026: epica 30→24, leggendaria 100→60 (un doppione fortunato non porta più una carta al 16 in un colpo)
// Doppione di una carta già al 30 (nov 2026: prima 15 / 20 / 40 / 100).
// Tetto: anche con TUTTE le carte di una bustina al 30, una bustina da 150 restituisce in media circa 138 monete,
// quindi comprare bustine non diventa mai un modo per fare soldi.
const MONETE_DOPPIONE_30 = { comune: 25, rara: 30, epica: 60, leggendaria: 150 };
const potPerLivello = L => 3 + Math.floor(L / 2);

// ---------------- Ascesa ----------------
// Una carta comune, rara o epica arrivata al 30 può salire alla rarità successiva pagando monete:
// nov 2026: resta al livello che ha (30) con la forza della nuova rarità, e può salire ancora subito, fino a leggendaria.
// (Prima ripartiva dal livello 1 e andava ripotenziata ogni volta: quasi metà delle monete del gioco servivano a questo.)
// Esempio: una comune al 30 ha forza 1,00 × 1,58 = 1,58; diventata rara resta al 30 e vale 1,10 × 1,58 = 1,74;
// salita fino a leggendaria, al 30 vale 1,30 × 1,58 = 2,05 come una leggendaria trovata nelle bustine.
// I doppioni continuano a dare i potenziatori della rarità di partenza (una comune dà sempre 10 potenziatori).
const ASCESA_MONETE = { comune: 500, rara: 1000, epica: 2000 };   // costo per salire DA questa rarità
const rarDopo = (base, passi) => ORDINE_RARITA[Math.min(ORDINE_RARITA.length - 1, Math.max(0, ORDINE_RARITA.indexOf(base)) + Math.max(0, Math.min(3, passi | 0)))] || base;
// nov 2026: costo in monete dimezzato (prima 5 · arrotonda((10 + L²/4) / 5): dal 1 al 30 servivano 2410 monete, ora 1205)
const monetePerLivello = L => 5 * Math.round((10 + L * L / 4) / 10);

// Statistiche reali di una carta.
// Potenziare fa salire PV, attacco, difesa e velocità di tutte le carte (+2% a livello: al 30 è +58%),
// e la statistica del tipo sale di più (+2,8% a livello: al 30 è +81%): Forza l'attacco, Difesa la difesa,
// Velocità la velocità. A parità di livello una carta Velocità è sempre la più veloce.
// Esempio: El Pelado (Tank, Difesa, comune) Lv1 → 150 PV, attacco 10, difesa 16,8; Lv30 → 237 PV, attacco 15,8, difesa 30,4.
const CRESCITA_TIPO = 1.4;
// Impronta di ogni carta: due carte con lo stesso ruolo, tipo e rarità non hanno più statistiche identiche.
// Da ogni nome esce sempre la stessa variazione (fino a ±8% su PV, attacco e difesa, ±1 di velocità),
// e le tre percentuali si compensano: se una carta ha più attacco ha un po' meno PV o difesa, così nessuna è più forte in totale.
const _impronte = {};
function impronta(id) {
  if (_impronte[id]) return _impronte[id];
  let h = 2166136261;
  for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const r = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 2001) / 1000 - 1; };
  const a = [r(), r(), r()], media = (a[0] + a[1] + a[2]) / 3, v = r();
  const p = x => Math.max(-.08, Math.min(.08, (x - media) * .09));
  return (_impronte[id] = { pv: p(a[0]), att: p(a[1]), dif: p(a[2]), vel: v > .5 ? 1 : v < -.5 ? -1 : 0 });
}
// Bilanciamento per carta (nov 2026): un piccolo correttivo a PV, attacco e difesa, calcolato con migliaia di partite simulate,
// perché ogni carta valga quanto le altre della sua rarità (le mosse e i ruoli non sono tutti uguali). 1 = nessuna correzione.
const BILANCIO = {
  aleadme: 1.168, alebella: 1.117, aleghilterra: 0.97, alessante: 0.985, alesshack: 0.99, alessiai: 0.956, alessieno: 1.02, alessiologa: 1.078,
  alessmione: 0.924, alessoutlaw: 1.073, alicircuit: 1.094, alicolt: 0.99, aligorgona: 1.031, alihsoka: 1.038, aliottina: 1.136, alire: 1.028,
  alirtogallo: 1.068, alisa: 0.916, alisombra: 0.943, alispia: 0.922, alissith: 0.958, alistaroth: 0.905, alizombie: 1.038, alledna: 1.051,
  aphroalessia: 1.006, aresorenzo: 0.911, artalice: 0.981, atharita: 0.948, auranshee: 1.073, aurante: 1.124, auraria: 0.919, aurobrava: 1.01,
  auroraider: 0.995, auroravive: 1.025, aurorecia: 0.993, auroressa: 1.021, auroroide: 1.094, auroruna: 1.147, aurothma: 1.013, aurrerri: 1.048,
  bandita: 1.042, brolymone: 0.976, bulsene: 1.07, c18ora: 1.023, chapo: 1.061, chichice: 0.965, comora: 0.901, criliziano: 0.91,
  demviky: 0.954, diablo: 1.1, diegallo: 1.039, dieganger: 0.903, diegaqua: 1.116, diegarman: 1.07, dieghunter: 1.033, diegial: 0.904,
  diegirius: 1.015, diegkeye: 0.987, diego17: 1.049, diegobot: 0.971, diegombie: 0.892, diegopa: 0.969, diegoren: 1.022, diegspagna: 0.886,
  dionpips: 0.924, efesamuele: 1.008, elcuervo: 0.943, ellobo: 0.982, eltigre: 0.967, fiesta: 1.025, freezovico: 1.144, fuego: 0.926,
  ginice: 0.975, giudella: 0.989, giueia: 1.05, giulancia: 0.938, giulasso: 0.973, giulialla: 0.99, giulibyte: 0.971, giulifleur: 0.98,
  giuliflora: 0.969, giulimaah: 0.97, giulimort: 0.98, giulistrega: 1.064, giupatty: 1.026, giuvlass: 0.945, gohanlollo: 0.932, gokiele: 0.962,
  gossip: 1.035, herdiego: 1.029, ironlus: 0.939, labruja: 1.094, lasombra: 1.017, ligulk: 0.968, loca: 1.036, lollakin: 0.922,
  lollapa: 1.051, lollart: 1.019, lollawless: 1.052, lollendigo: 0.977, lollifer: 0.946, lollinista: 0.895, lollirlanda: 0.951, lollivor: 0.987,
  lolloborg: 1.017, lollocallo: 0.988, lollon: 1.036, lollonova: 1.027, ludasso: 0.93, ludhacker: 0.985, ludobunty: 1.136, ludogargo: 0.979,
  ludohouse: 0.96, ludomagma: 0.922, ludomodeus: 0.973, ludopa: 0.975, ludormania: 1.085, ludovirus: 0.988, ludovolt: 1.01, ludowalker: 0.946,
  ludraco: 1.054, maurialpinista: 0.972, mauriba: 0.94, mauribandit: 0.95, mauribecca: 0.973, mauriborg: 0.965, mauricore: 1.058, maurigitto: 1.178,
  maurilanders: 0.974, maurimmia: 1.07, mauriphomet: 1.077, maurire: 0.994, mauriziente: 0.99, maurizomb: 0.986, mauthor: 1.035, mieloki: 1.141,
  nikulia: 0.964, ombra: 0.961, pelado: 1.01, persene: 0.968, pimoe: 0.943, pipciatore: 1.014, pipgelo: 1.168, pipkenstein: 0.927,
  pipmon: 1.036, pipsccolo: 0.911, pipscience: 1.124, pipscozia: 0.983, pipsoba: 1.039, pipsobafett: 1.031, pipstolero: 0.982, piptron: 0.914,
  pipverus: 0.974, poseludovico: 0.975, reina: 1.079, riessica: 1.024, ritacrys: 1.073, ritacubus: 0.978, ritadora: 0.984, ritageddon: 1.042,
  ritalia: 1.054, ritaloon: 0.985, ritamma: 0.894, ritanimatrice: 0.979, ritare: 1.145, ritarena: 1.011, ritey: 1.024, ritron: 1.042,
  rojo: 0.989, samasso: 0.978, samuba: 1.011, samubrasil: 1.053, samudead: 0.959, samuero: 0.971, samulett: 0.951, samulex: 1.062,
  samulmine: 1.109, samulupo: 0.911, samusty: 0.976, samutografo: 1.018, samuwan: 0.929, samuzebub: 0.997, selmene: 1.033, senebroker: 1.05,
  senecallo: 0.978, senecate: 0.992, seneforte: 0.994, senelagoon: 0.946, seneloon: 1.135, senemune: 0.935, senesia: 0.948, senesuono: 1.197,
  senetron: 0.992, seneverr: 1.008, simalpatine: 1.065, simarney: 0.942, simarshal: 1.021, simocallo: 1.08, simoldemort: 1.044, simoluce: 0.926,
  simonducer: 0.983, simonex: 1.072, simonusa: 0.973, simopter: 1.069, simospirit: 0.941, simothan: 0.96, solmone: 1.051, spidertoto: 1.059,
  stellascura: 0.893, tizgeria: 1.061, tiziamma: 0.987, tizianator: 0.958, tiziariffo: 1.012, tiziazel: 0.873, tizidrac: 0.969, tiziegista: 1.066,
  tizievil: 0.982, tizire: 1.008, tizitron: 1.017, tizoba: 1.013, tizomer: 0.795, tizvader: 1.177, undercut: 0.978, vaggie: 0.993,
  vedovagreca: 0.925, vegerizio: 1.033, vidalessia: 0.982, vikamashtu: 0.975, vikante: 0.913, vikappone: 0.973, vikatrix: 0.973, vikybyte: 0.891,
  vikydead: 0.937, vikyeletro: 0.985, vikylalla: 1.006, vikylasso: 0.907, vikytal: 0.884, vikyventura: 1.016, wandessia: 1.1, waspy: 0.915,
  wonderrita: 1.034, zeutiz: 1.062,
  aurorrigan: 1.02,
};
function statistiche(c, liv = 1, lode = false, rar) {
  const b = RUOLI[c.ruolo], fr = RARITA[RARITA[rar] ? rar : c.rarita].forza * (BILANCIO[c.id] || 1), f = fattoreLivello(liv, lode), t = BONUS_TIPO[c.stile] || {};
  const g = f - 1, fT = 1 + g * CRESCITA_TIPO, im = impronta(c.id);
  const pv = b.pv * (t.pv || 1) * fr * f * (1 + im.pv);
  const att = b.att * (t.att || 1) * fr * (c.stile === "FOR" ? fT : f) * (1 + im.att);
  const dif = b.dif * (t.dif || 1) * fr * (c.stile === "DIF" ? fT : f) * (1 + im.dif);
  return {
    pv: Math.round(pv),
    att: Math.round(att * 10) / 10,
    attBase: Math.round(att / f * 100) / 100,   // in battaglia l'attacco si moltiplica per f (livello)
    dif: Math.round(dif * 10) / 10,
    vel: Math.round((b.vel + (t.vel || 0) + im.vel) * (c.stile === "VEL" ? fT : f)),
    f,
  };
}

if (typeof module !== "undefined") module.exports = { SERIE, RARITA, ORDINE_RARITA, STILI, BONUS_TIPO, RUOLI, CARTE, PER_ID, ID_VECCHI, controllaLeggendarie, CARTE_ORIGINALI, applicaConfigCarte, LIVELLO_MAX, XP_LODE, XP_DOPPIONE, ASCESA_MONETE, rarDopo, RARITA_PRIMA_NOV26, POT_DOPPIONE, MONETE_DOPPIONE_30, potPerLivello, monetePerLivello, xpPerLivello, xpPerArrivare, infoLivello, fattoreLivello, statistiche };
