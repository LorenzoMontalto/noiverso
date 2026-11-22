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
  { id: "freezovico", nome: "Freezovico", serie: "db", rarita: "epica", stile: "DIF", ruolo: "stregone", frase: "L'imperatore Ludovico non perdona.",
    mosse: [m("Raggio Mortale", 0, 30, { penetra: 20 }), m("Gelo Imperiale", 2, 30, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Supernova Imperiale", 5, 90)] },
  { id: "gohanlollo", nome: "Gohan Lollo", serie: "db", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Studia di giorno, salva il mondo di sera.",
    mosse: [m("Calcio Volante", 0, 32), m("Potenziale Nascosto", 2, 0, { eff: { tipo: "potenzia", val: 35, turni: 3 } }), m("Onda Padre e Figlio", 5, 96)] },
  { id: "pipsccolo", nome: "Pipsccolo", serie: "db", rarita: "epica", stile: "DIF", ruolo: "difensore", frase: "Il namecciano Pips: braccia lunghe, pazienza corta.",
    mosse: [m("Braccio Allungabile", 0, 28), m("Rigenerazione", 2, 0, { eff: { tipo: "cura", val: 18 } }), m("Cannone a Spirale", 5, 88, { penetra: 25 })] },
  { id: "caulifrita", nome: "Caulif Rita", serie: "db", rarita: "epica", stile: "FOR", ruolo: "picchiatore", frase: "Selvaggia, testarda e fortissima.",
    mosse: [m("Pugno Selvaggio", 0, 32), m("Sfera Crescente", 2, 46), m("Raffica Tripla", 5, 30, { colpi: 3 })] },
  { id: "criliziano", nome: "Criliziano", serie: "db", rarita: "rara", stile: "VEL", ruolo: "assassino", frase: "Piccolo, ma con il disco giusto.",
    mosse: [m("Disco Affilato", 0, 30, { penetra: 30 }), m("Lampo Solare", 2, 20, { eff: { tipo: "stordisci", val: 40 } }), m("Disco Distruttore", 5, 88, { penetra: 35 })] },
  { id: "bulsene", nome: "Bulsene", serie: "db", rarita: "rara", stile: "DIF", ruolo: "stratega", frase: "Genio, capsule e zero pazienza.",
    mosse: [m("Invenzione", 0, 26), m("Capsula Energetica", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Robot Capsula", 5, 84)] },
  { id: "c18ora", nome: "C-18 Ora", serie: "db", rarita: "rara", stile: "VEL", ruolo: "schivatore", frase: "Fredda come il metallo, veloce come un lampo.",
    mosse: [m("Calcio Cyborg", 0, 30), m("Barriera Cyborg", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Tempesta di Raggi", 5, 20, { colpi: 4 })] },
  { id: "diego17", nome: "Diego-17", serie: "db", rarita: "rara", stile: "VEL", ruolo: "ladro", frase: "Energia infinita e sorriso da guardaparco.",
    mosse: [m("Raffica Cyborg", 0, 26, { eff: { tipo: "ruba", val: 1 } }), m("Assorbimento", 2, 36, { eff: { tipo: "ruba", val: 1 } }), m("Super Barriera Esplosiva", 5, 88)] },
  { id: "chichice", nome: "Chichice", serie: "db", rarita: "comune", stile: "FOR", ruolo: "guaritore", frase: "Prima i compiti, poi si combatte.",
    mosse: [m("Padellata", 0, 28), m("Pranzo Saiyan", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Furia di Mamma", 5, 76, { drena: 40 })] },
  { id: "vidalessia", nome: "Vidalessia", serie: "db", rarita: "comune", stile: "VEL", ruolo: "capo", frase: "La giustizia ha un nuovo idolo.",
    mosse: [m("Calcio della Giustizia", 0, 28), m("Grido di Squadra", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Volo Giustiziere", 5, 80)] },
  { id: "panky", nome: "Panky", serie: "db", rarita: "comune", stile: "VEL", ruolo: "imprevedibile", frase: "Piccola peste, grande potenza.",
    mosse: [m("Pugnetto", 0, 28), m("Capriccio", 2, 26, { eff: { tipo: "stordisci", val: 50 } }), m("Raffica della Nipote", 5, 18, { colpi: 5 })] },
  { id: "giulmai", nome: "Giulmai", serie: "db", rarita: "comune", stile: "FOR", ruolo: "tiratore", frase: "La guerriera Saiyan carica sempre un'altra sfera.",
    mosse: [m("Sfera di Ki", 0, 30), m("Doppia Sfera", 2, 24, { colpi: 2 }), m("Bomba Viola", 5, 86)] },

  // ---------------- DEI ----------------
  { id: "zeutiz", nome: "Zeu Tiz", serie: "dei", rarita: "leggendaria", stile: "DIF", ruolo: "capo", frase: "Sovrano degli dei. Fulmini compresi.",
    mosse: [m("Saetta", 0, 32), m("Tuono dell'Olimpo", 2, 42, { eff: { tipo: "stordisci", val: 40 } }), m("Ira di Zeus", 5, 104)] },
  { id: "poseludovico", nome: "Pose Ludovico", serie: "dei", rarita: "leggendaria", stile: "DIF", ruolo: "tank", frase: "Signore dei mari e delle tempeste.",
    mosse: [m("Colpo di Tridente", 0, 32), m("Muro d'Acqua", 2, 0, { eff: { tipo: "scudo", val: 50 } }), m("Maremoto", 5, 96)] },
  { id: "adelrizio", nome: "Adel Rizio", serie: "dei", rarita: "epica", stile: "DIF", ruolo: "stregone", frase: "Sovrano degli Inferi: prima o poi passano tutti da lui.",
    mosse: [m("Tocco degli Inferi", 0, 30, { drena: 30 }), m("Catene dell'Ade", 2, 28, { eff: { tipo: "indebolisci", val: 35, turni: 2 } }), m("Regno dei Morti", 5, 90, { drena: 40 })] },
  { id: "aresorenzo", nome: "Aresorenzo", serie: "dei", rarita: "leggendaria", stile: "FOR", ruolo: "picchiatore", frase: "Dio della guerra: la pace lo annoia.",
    mosse: [m("Fendente di Guerra", 0, 34), m("Grido di Battaglia", 2, 0, { eff: { tipo: "potenzia", val: 35, turni: 3 } }), m("Furia di Ares", 5, 96)] },
  { id: "atharita", nome: "Atha Rita", serie: "dei", rarita: "epica", stile: "DIF", ruolo: "difensore", frase: "Dea della saggezza e della strategia.",
    mosse: [m("Lancia della Saggezza", 0, 30), m("Egida", 2, 0, { eff: { tipo: "scudo", val: 45 } }), m("Strategia Divina", 5, 84, { penetra: 25 })] },
  { id: "artalice", nome: "Art Alice", serie: "dei", rarita: "epica", stile: "VEL", ruolo: "tiratore", frase: "Dea della caccia e della luna: non scappa nessuno.",
    mosse: [m("Freccia d'Argento", 0, 32), m("Pioggia di Frecce Lunari", 2, 18, { colpi: 3 }), m("Freccia della Luna", 5, 96)] },
  { id: "aurera", nome: "Aurera", serie: "dei", rarita: "epica", stile: "DIF", ruolo: "guaritore", frase: "Regina degli dei e del matrimonio.",
    mosse: [m("Sguardo Regale", 0, 28), m("Benedizione Nuziale", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Collera della Regina", 5, 80, { eff: { tipo: "indebolisci", val: 30, turni: 2 } })] },
  { id: "herdiego", nome: "Her Diego", serie: "dei", rarita: "rara", stile: "VEL", ruolo: "ladro", frase: "Messaggero degli dei, e un po' ladruncolo.",
    mosse: [m("Sandali Alati", 0, 28, { eff: { tipo: "ruba", val: 1 } }), m("Furto Divino", 2, 36, { eff: { tipo: "ruba", val: 1 } }), m("Messaggero Fulmineo", 5, 22, { colpi: 4 })] },
  { id: "efesamuele", nome: "Efe Samuele", serie: "dei", rarita: "rara", stile: "FOR", ruolo: "incendiario", frase: "Dio del fuoco e della forgia.",
    mosse: [m("Martello Rovente", 0, 28, { eff: { tipo: "brucia", val: 4, turni: 2 } }), m("Forgia", 2, 38, { eff: { tipo: "brucia", val: 6, turni: 3 } }), m("Eruzione", 5, 82, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "dionpips", nome: "Dion Pips", serie: "dei", rarita: "rara", stile: "FOR", ruolo: "imprevedibile", frase: "Dio del vino e della festa. Soprattutto del vino.",
    mosse: [m("Brindisi Divino", 0, 30), m("Ebbrezza", 2, 24, { eff: { tipo: "stordisci", val: 50 } }), m("Baccanale", 5, 94)] },
  { id: "nikulia", nome: "Nikulia", serie: "dei", rarita: "rara", stile: "VEL", ruolo: "assassino", frase: "Dea della vittoria: perdere non è un'opzione.",
    mosse: [m("Ali della Vittoria", 0, 32), m("Colpo Vincente", 2, 46, { penetra: 20 }), m("Trionfo", 5, 90, { penetra: 40 })] },
  { id: "solmone", nome: "Solmone", serie: "dei", rarita: "comune", stile: "DIF", ruolo: "stratega", frase: "Dio del sole e della musica.",
    mosse: [m("Raggio di Sole", 0, 28), m("Melodia della Lira", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Carro del Sole", 5, 84)] },
  { id: "aphroalessia", nome: "Aphro Alessia", serie: "dei", rarita: "comune", stile: "VEL", ruolo: "stregone", frase: "Dea dell'amore e della bellezza.",
    mosse: [m("Bacio Ammaliante", 0, 26), m("Fascino", 2, 26, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Amore Travolgente", 5, 80, { drena: 40 })] },
  { id: "demviky", nome: "Dem Viky", serie: "dei", rarita: "comune", stile: "FOR", ruolo: "guaritore", frase: "Dea della terra, del raccolto e dell'abbondanza.",
    mosse: [m("Frusta di Spighe", 0, 26), m("Raccolto", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Abbondanza", 5, 76, { drena: 50 })] },
  { id: "persene", nome: "Per Senè", serie: "dei", rarita: "comune", stile: "VEL", ruolo: "schivatore", frase: "Regina della primavera e degli inferi.",
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
  { id: "samulett", nome: "Samulett Potter", serie: "maghi", rarita: "leggendaria", stile: "VEL", ruolo: "capo", frase: "Il ragazzo sopravvissuto. Con la cicatrice e tutto.",
    mosse: [m("Raggio Disarmante", 0, 32), m("Volo sulla Scopa", 2, 44, { penetra: 20 }), m("Duello Finale", 5, 98)] },
  { id: "mauriziente", nome: "Mauriziente", serie: "maghi", rarita: "leggendaria", stile: "DIF", ruolo: "stratega", frase: "Il preside più saggio della scuola. E il più eccentrico.",
    mosse: [m("Lampo di Bacchetta", 0, 30), m("Saggezza Antica", 1, 0, { eff: { tipo: "energia", val: 3 } }), m("Fenice di Fuoco", 5, 88, { eff: { tipo: "brucia", val: 6, turni: 3 } })] },
  { id: "simoldemort", nome: "Simoldemort", serie: "maghi", rarita: "leggendaria", stile: "DIF", ruolo: "stregone", frase: "Colui-che-non-si-deve-nominare. E infatti nessuno lo nomina.",
    mosse: [m("Fiamma Verde", 0, 32, { drena: 20 }), m("Marchio Oscuro", 2, 28, { eff: { tipo: "indebolisci", val: 35, turni: 2 } }), m("Maledizione Suprema", 5, 100)] },
  { id: "pipverus", nome: "Pipverus Piton", serie: "maghi", rarita: "epica", stile: "FOR", ruolo: "incendiario", frase: "Pozioni, sarcasmo e un segreto lungo una vita.",
    mosse: [m("Fendente Oscuro", 0, 32), m("Pozione Velenosa", 2, 30, { eff: { tipo: "brucia", val: 7, turni: 3 } }), m("Principe Mezzosangue", 5, 92, { penetra: 25 })] },
  { id: "vikatrix", nome: "Vikatrix Lestrange", serie: "maghi", rarita: "epica", stile: "VEL", ruolo: "assassino", frase: "Ride sempre. E non è mai un buon segno.",
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
  { id: "lollon", nome: "Lollon Weasley", serie: "maghi", rarita: "rara", stile: "FOR", ruolo: "imprevedibile", frase: "La bacchetta è rotta. Funziona lo stesso. Più o meno.",
    mosse: [m("Bacchetta Rotta", 0, 30), m("Pioggia di Lumache", 2, 26, { eff: { tipo: "stordisci", val: 45 } }), m("Scacco Matto Gigante", 5, 96)] },
  { id: "ginice", nome: "Ginice Weasley", serie: "maghi", rarita: "comune", stile: "FOR", ruolo: "tiratore", frase: "La più piccola di casa, ma la fattura la sa fare.",
    mosse: [m("Fattura Pipistrello", 0, 30), m("Bolide", 2, 24, { colpi: 2 }), m("Tiro da Cacciatrice", 5, 86)] },
  { id: "tizievil", nome: "Tizievil Paciock", serie: "maghi", rarita: "comune", stile: "FOR", ruolo: "guaritore", frase: "Timido fino al momento giusto. Poi tira fuori la spada.",
    mosse: [m("Pianta Carnivora", 0, 26), m("Erbologia", 2, 0, { eff: { tipo: "cura", val: 30 } }), m("Spada del Coraggio", 5, 80, { drena: 40 })] },
  { id: "auroruna", nome: "Auroruna", serie: "maghi", rarita: "rara", stile: "DIF", ruolo: "stregone", frase: "Vede creature che nessun altro vede. Forse esistono davvero.",
    mosse: [m("Fascino Lunare", 0, 28), m("Creature Invisibili", 2, 24, { eff: { tipo: "indebolisci", val: 30, turni: 2 } }), m("Patrono Lepre", 5, 84)] },
  { id: "giulifleur", nome: "Giulifleur", serie: "maghi", rarita: "comune", stile: "VEL", ruolo: "capo", frase: "Elegante, raffinata e campionessa del torneo.",
    mosse: [m("Fiamma Azzurra", 0, 28), m("Fascino Veela", 2, 0, { eff: { tipo: "potenzia", val: 25, turni: 3 } }), m("Torneo dei Tre Maghi", 5, 80)] },
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
};
CARTE.forEach(c => { c.persona = PERSONE[c.id] || ""; });

// Valori di partenza scritti qui nel codice. L'admin può cambiarli dal gioco:
// le sue scelte (persona, serie, rarità) stanno nel database e vengono applicate all'avvio.
// Versione Ultra: alcune carte (scelte dall'admin) hanno anche una versione Ultra da trovare, come l'olografica:
// la carta base resta quella, la versione Ultra le dà la cornice nera e oro e +10% di PV e danni.
const ULTRA_DI_PARTENZA = ["reina", "gokiele", "zeutiz", "ironlus", "simoldemort"];
CARTE.forEach(c => { c.ultra = ULTRA_DI_PARTENZA.includes(c.id); });
const CARTE_ORIGINALI = Object.fromEntries(CARTE.map(c => [c.id, { serie: c.serie, rarita: c.rarita, stile: c.stile, persona: c.persona, ultra: c.ultra }]));
function applicaConfigCarte(cfg) {
  const mappa = (cfg && cfg.carte) || {};
  CARTE.forEach(c => {
    const o = CARTE_ORIGINALI[c.id], m = mappa[c.id] || {};
    c.serie = SERIE[m.serie] ? m.serie : o.serie;
    c.rarita = RARITA[m.rarita] ? m.rarita : o.rarita;
    c.stile = STILI[m.stile] ? m.stile : o.stile;
    c.ultra = typeof m.ultra === "boolean" ? m.ultra : o.ultra;
    c.persona = typeof m.persona === "string" ? m.persona.trim().slice(0, 30) : o.persona;
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
// Esempio: Lv1→2 costa 3 potenziatori e 10 monete; Lv10→11: 8 e 35; Lv29→30: 17 e 220.
// In tutto, dal 1 al 30: 297 potenziatori e 2410 monete (circa 30 doppioni di una comune).
const POT_DOPPIONE = { comune: 10, rara: 12, epica: 30, leggendaria: 100 };
const MONETE_DOPPIONE_30 = { comune: 15, rara: 20, epica: 40, leggendaria: 100 };   // doppione di una carta già al 30
const potPerLivello = L => 3 + Math.floor(L / 2);
const monetePerLivello = L => 5 * Math.round((10 + L * L / 4) / 5);

// Statistiche reali di una carta.
// Potenziare fa salire PV, attacco, difesa e velocità di tutte le carte (+2% a livello: al 30 è +58%),
// e la statistica del tipo sale di più (+2,8% a livello: al 30 è +81%): Forza l'attacco, Difesa la difesa,
// Velocità la velocità. A parità di livello una carta Velocità è sempre la più veloce.
// Esempio: El Pelado (Tank, Difesa, comune) Lv1 → 150 PV, attacco 10, difesa 16,8; Lv30 → 237 PV, attacco 15,8, difesa 30,4.
const CRESCITA_TIPO = 1.4;
function statistiche(c, liv = 1, lode = false) {
  const b = RUOLI[c.ruolo], fr = RARITA[c.rarita].forza, f = fattoreLivello(liv, lode), t = BONUS_TIPO[c.stile] || {};
  const g = f - 1, fT = 1 + g * CRESCITA_TIPO;
  const pv = b.pv * (t.pv || 1) * fr * f;
  const att = b.att * (t.att || 1) * fr * (c.stile === "FOR" ? fT : f);
  const dif = b.dif * (t.dif || 1) * fr * (c.stile === "DIF" ? fT : f);
  return {
    pv: Math.round(pv),
    att: Math.round(att * 10) / 10,
    attBase: Math.round(att / f * 100) / 100,   // in battaglia l'attacco si moltiplica per f (livello)
    dif: Math.round(dif * 10) / 10,
    vel: Math.round((b.vel + (t.vel || 0)) * (c.stile === "VEL" ? fT : f)),
    f,
  };
}

if (typeof module !== "undefined") module.exports = { SERIE, RARITA, ORDINE_RARITA, STILI, BONUS_TIPO, RUOLI, CARTE, PER_ID, ID_VECCHI, controllaLeggendarie, CARTE_ORIGINALI, applicaConfigCarte, LIVELLO_MAX, XP_LODE, XP_DOPPIONE, POT_DOPPIONE, MONETE_DOPPIONE_30, potPerLivello, monetePerLivello, xpPerLivello, xpPerArrivare, infoLivello, fattoreLivello, statistiche };
