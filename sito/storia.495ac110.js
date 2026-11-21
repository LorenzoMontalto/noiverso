// ============================================================
//  MODALITÀ STORIA: capitoli, tappe, squadre nemiche e premi.
//  Ogni tappa: nemici (5 carte), livello delle carte nemiche, abilità del computer,
//  monete alla prima vittoria, eventuale bustina, chi parla e cosa dice.
// ============================================================

const STORIA = [
  {
    id: "c1", titolo: "Notte in città", serie: "nueve", colore: "#ff2e46", simbolo: "♠",
    intro: "Le luci al neon si accendono e i vicoli si riempiono. Per farti un nome in città devi passare da tutte le bande, una alla volta.",
    tappe: [
      { titolo: "Il primo giro", nemici: ["pelado", "fiesta", "rojo", "lasombra", "chapo"], liv: [1, 1], abilita: 0.35, monete: 50,
        parla: "pelado", frase: "Questa strada è nostra. Gira al largo, o fammi vedere cosa sai fare." },
      { titolo: "La bisca", nemici: ["lasombra", "fuego", "bandita", "rojo", "fiesta"], liv: [1, 1], abilita: 0.4, monete: 55,
        parla: "lasombra", frase: "Al mio tavolo si punta tutto. Sei sicuro di voler giocare?" },
      { titolo: "Fumo e specchi", nemici: ["diablo", "labruja", "chapo", "elcuervo", "pelado"], liv: [1, 1], abilita: 0.45, monete: 60, bustina: "normale",
        parla: "labruja", frase: "Ho letto le carte prima che arrivassi. Il tuo futuro è... breve." },
      { titolo: "Il branco", nemici: ["ellobo", "eltigre", "rojo", "fuego", "bandita"], liv: [1, 2], abilita: 0.5, monete: 65,
        parla: "ellobo", frase: "Da solo non vai da nessuna parte. Noi siamo in tanti." },
      { titolo: "Il consiglio", nemici: ["loca", "chapo", "diablo", "eltigre", "labruja"], liv: [1, 2], abilita: 0.55, monete: 70,
        parla: "loca", frase: "Che bella festa! Peccato che per te sia l'ultima." },
      { titolo: "La Reina", boss: true, nemici: ["reina", "ombra", "loca", "ellobo", "bandita"], liv: [2, 2], abilita: 0.65, monete: 150, bustina: "epica",
        parla: "reina", frase: "Hai attraversato tutta la città per inginocchiarti davanti a me. Bravo.", vittoria: "La città ha un nuovo nome sulla bocca di tutti: il tuo." },
    ],
  },
  {
    id: "c2", titolo: "Il Grande Torneo", serie: "db", colore: "#ff9a1f", simbolo: "✪",
    intro: "Sul ring del torneo si sfidano i guerrieri più forti. Ogni incontro è più duro del precedente, e qualcuno nasconde un potere leggendario.",
    tappe: [
      { titolo: "Iscrizioni aperte", nemici: ["chichice", "vidalessia", "panky", "bulsene", "giulmai"], liv: [1, 2], abilita: 0.45, monete: 70,
        parla: "vidalessia", frase: "Le regole sono semplici: chi resta in piedi vince. Pronto?" },
      { titolo: "Capsule e invenzioni", nemici: ["bulsene", "c18ora", "diego17", "criliziano", "chichice"], liv: [2, 2], abilita: 0.5, monete: 75,
        parla: "bulsene", frase: "Ho un'invenzione per ogni tua mossa. E anche qualcuna in più." },
      { titolo: "I cyborg", nemici: ["c18ora", "diego17", "criliziano", "giulmai", "panky"], liv: [2, 2], abilita: 0.55, monete: 80, bustina: "normale",
        parla: "c18ora", frase: "Noi non ci stanchiamo mai. Tu, invece, tra poco sì." },
      { titolo: "Il namecciano", nemici: ["pipsccolo", "gohanlollo", "caulifrita", "criliziano", "vidalessia"], liv: [2, 3], abilita: 0.6, monete: 85,
        parla: "pipsccolo", frase: "Concentrati. Ogni errore qui si paga caro." },
      { titolo: "L'imperatore", nemici: ["freezovico", "caulifrita", "vegerizio", "diego17", "c18ora"], liv: [2, 3], abilita: 0.65, monete: 90,
        parla: "freezovico", frase: "Ti concedo l'onore di essere sconfitto dall'imperatore in persona." },
      { titolo: "Il guerriero leggendario", boss: true, nemici: ["brolymone", "gokiele", "vegerizio", "freezovico", "gohanlollo"], liv: [3, 3], abilita: 0.72, monete: 200, bustina: "epica",
        parla: "gokiele", frase: "Finalmente un avversario vero! Dai, non trattenerti.", vittoria: "Il torneo è tuo. Persino i Saiyan ti chiedono la rivincita." },
    ],
  },
  {
    id: "c3", titolo: "La città in pericolo", serie: "eroi", colore: "#4c95ff", simbolo: "★",
    intro: "Qualcuno ha messo gli eroi gli uni contro gli altri. Per scoprire chi c'è dietro devi affrontarli tutti, dal primo all'ultimo.",
    tappe: [
      { titolo: "Allarme in centro", nemici: ["waspy", "diegkeye", "vedovagreca", "stellascura", "cypips"], liv: [2, 3], abilita: 0.55, monete: 90,
        parla: "vedovagreca", frase: "Non sei autorizzato a stare qui. Ultimo avviso." },
      { titolo: "Sui tetti", nemici: ["spidertoto", "gossip", "comora", "waspy", "undercut"], liv: [2, 3], abilita: 0.6, monete: 95,
        parla: "spidertoto", frase: "Bella vista da quassù, eh? Peccato che stai per cadere." },
      { titolo: "L'inganno", nemici: ["mieloki", "wandessia", "comora", "vedovagreca", "stellascura"], liv: [3, 3], abilita: 0.62, monete: 100, bustina: "normale",
        parla: "mieloki", frase: "Sei sicuro che io sia davvero qui? Sei sicuro di qualcosa?" },
      { titolo: "Lo scudo", nemici: ["wonderrita", "undercut", "cypips", "diegkeye", "spidertoto"], liv: [3, 3], abilita: 0.66, monete: 105,
        parla: "undercut", frase: "Posso andare avanti così tutto il giorno." },
      { titolo: "Armature e tuoni", nemici: ["ironlus", "mauthor", "wandessia", "gossip", "mieloki"], liv: [3, 4], abilita: 0.7, monete: 110,
        parla: "ironlus", frase: "Ho calcolato le tue probabilità di vittoria. Meglio che tu non le sappia." },
      { titolo: "La furia verde", boss: true, nemici: ["ligulk", "ironlus", "mauthor", "wonderrita", "spidertoto"], liv: [3, 4], abilita: 0.78, monete: 250, bustina: "leggendaria",
        parla: "ligulk", frase: "GRRR... Ligulk... SPACCA!", vittoria: "Gli eroi tornano dalla stessa parte. E stavolta c'è anche il tuo nome sulla lista." },
    ],
  },
  {
    id: "c4", titolo: "La scalata all'Olimpo", serie: "dei", colore: "#f2c14e", simbolo: "♛",
    intro: "In cima al monte gli dei guardano dall'alto i mortali. Salire fino al trono di Zeus vuol dire sfidarli tutti.",
    tappe: [
      { titolo: "I campi fioriti", nemici: ["demviky", "persene", "aphroalessia", "solmone", "aurera"], liv: [3, 3], abilita: 0.62, monete: 110,
        parla: "demviky", frase: "Qui cresce tutto, tranne le speranze dei mortali." },
      { titolo: "Messaggeri e banchetti", nemici: ["herdiego", "nikulia", "dionpips", "efesamuele", "artalice"], liv: [3, 4], abilita: 0.66, monete: 115,
        parla: "dionpips", frase: "Un brindisi alla tua sconfitta! Anzi, due." },
      { titolo: "La caccia", nemici: ["artalice", "atharita", "aurera", "persene", "dionpips"], liv: [3, 4], abilita: 0.7, monete: 120, bustina: "normale",
        parla: "artalice", frase: "La luna è alta. È la notte perfetta per cacciare." },
      { titolo: "Le porte degli inferi", nemici: ["adelrizio", "persene", "efesamuele", "aresorenzo", "nikulia"], liv: [4, 4], abilita: 0.74, monete: 125,
        parla: "adelrizio", frase: "Prima o poi passano tutti da qui. Tu un po' prima." },
      { titolo: "Mari in tempesta", nemici: ["poseludovico", "aresorenzo", "atharita", "herdiego", "aphroalessia"], liv: [4, 4], abilita: 0.78, monete: 130,
        parla: "poseludovico", frase: "Il mare non perdona. E nemmeno io." },
      { titolo: "Il trono di Zeus", boss: true, nemici: ["zeutiz", "poseludovico", "adelrizio", "aresorenzo", "atharita"], liv: [4, 4], abilita: 0.85, monete: 300, bustina: "leggendaria",
        parla: "zeutiz", frase: "Un mortale sull'Olimpo. Che coraggio. Che stupidità.", vittoria: "Gli dei ti fanno spazio sul monte. Ma c'è ancora qualcuno che ti aspetta..." },
    ],
  },
  {
    id: "c6", titolo: "La Scuola di Magia", serie: "maghi", colore: "#43d39e", simbolo: "☾",
    intro: "Un castello pieno di torri, scale che cambiano posto e studenti con la bacchetta facile. Per uscirne devi battere ogni casa, ogni professore e il mago più oscuro di tutti.",
    tappe: [
      { titolo: "Il binario nascosto", nemici: ["lollon", "ginice", "tizievil", "auroruna", "giulifleur"], liv: [1, 1], abilita: 0.66, monete: 120,
        parla: "lollon", frase: "Ehi, sei nuovo? Attento: la mia bacchetta ogni tanto spara al contrario." },
      { titolo: "La Sala Grande", nemici: ["alessmione", "giulifleur", "ginice", "ritadora", "tizievil"], liv: [1, 1], abilita: 0.7, monete: 125,
        parla: "alessmione", frase: "Ho studiato ogni incantesimo che conosci. E anche quelli che non conosci." },
      { titolo: "La foresta proibita", nemici: ["auroruna", "diegirius", "ritadora", "ludraco", "seneverr"], liv: [1, 1], abilita: 0.74, monete: 130, bustina: "epica",
        parla: "auroruna", frase: "Le senti anche tu le creature tra gli alberi? No? Peccato: loro sentono te." },
      { titolo: "I sotterranei", nemici: ["pipverus", "ludraco", "vikatrix", "seneverr", "alessmione"], liv: [1, 1], abilita: 0.78, monete: 140,
        parla: "pipverus", frase: "Qui non si sventolano bacchette. Qui si preparano pozioni. E punizioni." },
      { titolo: "La torre del preside", nemici: ["mauriziente", "seneverr", "samulett", "diegirius", "alessmione"], liv: [1, 1], abilita: 0.82, monete: 150,
        parla: "mauriziente", frase: "Sono le scelte a mostrare chi siamo davvero. Scegli bene la prossima mossa." },
      { titolo: "Il Signore Oscuro", boss: true, nemici: ["simoldemort", "vikatrix", "pipverus", "ludraco", "mauriziente"], liv: [1, 1], abilita: 0.88, monete: 300, bustina: "leggendaria",
        parla: "simoldemort", frase: "Ho stregato mezzo castello, preside compreso. Inginocchiati: tanto il risultato non cambia.", vittoria: "Il Signore Oscuro è sconfitto e il castello festeggia fino all'alba. Al banchetto c'è un posto d'onore per te." },
    ],
  },
  {
    id: "c5", titolo: "Los Nueve", serie: null, colore: "#b866ff", simbolo: "✦",
    intro: "Tutte le storie portano qui. I più forti di ogni serie si sono uniti in un'unica squadra. È la sfida finale.",
    tappe: [
      { titolo: "Ombre dal passato", nemici: ["ombra", "eltigre", "labruja", "comora", "criliziano"], liv: [4, 4], abilita: 0.66, monete: 130,
        parla: "ombra", frase: "Ti ho seguito per tutta la strada. Adesso tocca a me." },
      { titolo: "Fulmini e saette", nemici: ["mauthor", "zeutiz", "vegerizio", "artalice", "ironlus"], liv: [4, 4], abilita: 0.76, monete: 140,
        parla: "mauthor", frase: "Senti l'aria? Sta arrivando il temporale." },
      { titolo: "Il caos", nemici: ["loca", "wandessia", "dionpips", "panky", "lasombra"], liv: [4, 4], abilita: 0.8, monete: 150, bustina: "epica",
        parla: "wandessia", frase: "Le regole? Le ho appena cambiate tutte." },
      { titolo: "I giganti", nemici: ["ligulk", "brolymone", "poseludovico", "pelado", "wonderrita"], liv: [4, 5], abilita: 0.82, monete: 160,
        parla: "brolymone", frase: "Siete piccoli... Tutti così piccoli..." },
      { titolo: "Gli strateghi", nemici: ["reina", "freezovico", "mieloki", "adelrizio", "atharita"], liv: [4, 5], abilita: 0.86, monete: 170,
        parla: "atharita", frase: "Ogni tua mossa l'ho già prevista. Anche questa." },
      { titolo: "La squadra finale", boss: true, nemici: ["gokiele", "zeutiz", "reina", "ironlus", "aresorenzo"], liv: [5, 5], abilita: 0.92, monete: 500, bustina: "leggendaria", bustine: 2,
        parla: "aresorenzo", frase: "Sei arrivato fin qui. Ora dimostra di meritare il posto tra Los Nueve.", vittoria: "Ce l'hai fatta: sei uno di Los Nueve. La città, il torneo, gli eroi, l'Olimpo e la scuola di magia parlano solo di te." },
    ],
  },
];

// Scrigni di ogni capitolo: si aprono con le stelle (3 per tappa, 18 per capitolo)
function scrigniCapitolo(k) {
  const cap = STORIA[k];
  return [
    { id: `${cap.id}-9`, stelle: 9, monete: 100 + 50 * k, testo: `${100 + 50 * k} monete` },
    { id: `${cap.id}-18`, stelle: 18, bustina: k >= 3 ? "leggendaria" : "epica", testo: k >= 3 ? "Bustina Leggendaria" : "Bustina Epica" },
  ];
}



// Livelli dei nemici in base alla posizione nella storia: dalla prima tappa (Lv1–3) al boss finale (Lv23–24).
STORIA.forEach((cap, k) => cap.tappe.forEach((t, i) => {
  const g = k * cap.tappe.length + i;
  t.indice = g;
  const b = Math.round(g * .62); t.liv = t.boss ? [b + 1, b + 2] : [Math.max(1, b), b + 2];
}));
if (typeof module !== "undefined") module.exports = { STORIA, scrigniCapitolo };
