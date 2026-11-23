// ============================================================
//  MODALITÀ STORIA: capitoli, tappe, squadre nemiche e premi.
//  Ogni tappa: nemici (5 carte), livello delle carte nemiche, abilità del computer,
//  monete alla prima vittoria, eventuale bustina, chi parla e cosa dice.
// ============================================================

const STORIA = [
  {
    id: "c1", campo: "notte", titolo: "Notte in città", serie: "nueve", colore: "#ff2e46", simbolo: "♠",
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
    id: "c2", campo: "stadio", titolo: "Il Grande Torneo", serie: "db", colore: "#ff9a1f", simbolo: "✪",
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
    id: "c3", campo: "pioggia", titolo: "La città in pericolo", serie: "eroi", colore: "#4c95ff", simbolo: "★",
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
    id: "c4", campo: "tempio", titolo: "La scalata all'Olimpo", serie: "dei", colore: "#f2c14e", simbolo: "♛",
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
    id: "c6", campo: "notte", titolo: "La Scuola di Magia", serie: "maghi", colore: "#43d39e", simbolo: "☾",
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
    id: "c7", campo: "pioggia", titolo: "Il porto dei contrabbandieri", serie: null, sottotitolo: "Mafiosi contro Supereroi", colore: "#3fd8ff", simbolo: "⚓",
    intro: "Di notte al porto arrivano navi senza nome. Le bande della città e gli eroi si contendono il molo, e tu ci finisci in mezzo.",
    tappe: [
      { titolo: "I container rossi", nemici: ["rojo", "fuego", "diegkeye", "stellascura", "lasombra"], liv: [1, 1], abilita: 0.78, monete: 160,
        parla: "diegkeye", frase: "Ho visto tutto dalla gru: nel container numero nove c'è qualcosa che non dovresti vedere." },
      { titolo: "La dogana", nemici: ["cypips", "undercut", "chapo", "bandita", "vedovagreca"], liv: [1, 1], abilita: 0.8, monete: 170,
        parla: "undercut", frase: "Documenti, prego. Ah, non li hai? Allora si passa alle maniere forti." },
      { titolo: "Il mercato del pesce", nemici: ["fiesta", "eltigre", "comora", "waspy", "pelado"], liv: [1, 1], abilita: 0.82, monete: 180, bustina: "normale",
        parla: "eltigre", frase: "Qui si vende tutto al chilo. Anche le carte sconfitte." },
      { titolo: "La nave fantasma", nemici: ["elcuervo", "labruja", "mieloki", "wandessia", "ombra"], liv: [1, 1], abilita: 0.84, monete: 190,
        parla: "labruja", frase: "Questa nave non tocca terra da cento anni. E stanotte ha fame." },
      { titolo: "Il faro", nemici: ["spidertoto", "gossip", "ellobo", "diablo", "wonderrita"], liv: [1, 1], abilita: 0.86, monete: 200,
        parla: "gossip", frase: "Dalla cima del faro si vede tutto. Anche il tuo prossimo errore." },
      { titolo: "Il patto del molo", boss: true, nemici: ["reina", "ironlus", "mauthor", "loca", "ligulk"], liv: [1, 1], abilita: 0.88, monete: 350, bustina: "leggendaria",
        parla: "ironlus", frase: "Mafia ed eroi, per una notte dalla stessa parte. Contro di te.", vittoria: "Il porto torna tranquillo e le navi ripartono. In un container però c'è una mappa strappata: porta a un deserto lontano..." },
    ],
  },
  {
    id: "c8", campo: "lava", titolo: "Il deserto delle sfere", serie: null, sottotitolo: "Dragon Ball contro Dei", colore: "#e0a34a", simbolo: "☀",
    intro: "Sotto la sabbia sono nascoste le sette sfere. I guerrieri del torneo le cercano da anni, ma gli dei non hanno nessuna voglia di lasciarle a qualcuno.",
    tappe: [
      { titolo: "La carovana", nemici: ["panky", "vidalessia", "demviky", "persene", "giulmai"], liv: [1, 1], abilita: 0.8, monete: 180,
        parla: "panky", frase: "Che caldo! Facciamo che chi perde porta l'acqua per tutti?" },
      { titolo: "L'oasi", nemici: ["aurera", "chichice", "aphroalessia", "solmone", "c18ora"], liv: [1, 1], abilita: 0.82, monete: 190,
        parla: "aurera", frase: "L'acqua dell'oasi guarisce tutto. Tranne le sconfitte." },
      { titolo: "Il canyon", nemici: ["criliziano", "nikulia", "herdiego", "diego17", "efesamuele"], liv: [1, 1], abilita: 0.84, monete: 200, bustina: "epica",
        parla: "nikulia", frase: "Nel canyon l'eco ripete ogni passo. Il tuo lo sento da un'ora." },
      { titolo: "La piramide", nemici: ["adelrizio", "freezovico", "pipsccolo", "dionpips", "bulsene"], liv: [1, 1], abilita: 0.86, monete: 210,
        parla: "freezovico", frase: "Dentro la piramide comando io. Anche le mummie si inchinano." },
      { titolo: "La tempesta di sabbia", nemici: ["artalice", "caulifrita", "gohanlollo", "atharita", "vegerizio"], liv: [1, 1], abilita: 0.88, monete: 220,
        parla: "vegerizio", frase: "Nella tempesta tu non vedi niente. Io invece vedo benissimo la tua fine." },
      { titolo: "Il guardiano delle sfere", boss: true, nemici: ["gokiele", "brolymone", "poseludovico", "aresorenzo", "zeutiz"], liv: [1, 1], abilita: 0.9, monete: 380, bustina: "leggendaria",
        parla: "gokiele", frase: "Le sette sfere sono qui dietro. Per prenderle devi passare sopra di me... e sopra di loro.", vittoria: "Le sfere brillano nelle tue mani ed esprimi un desiderio. Un luna park? Strano desiderio... ma eccolo che si accende all'orizzonte." },
    ],
  },
  {
    id: "c9", campo: "stadio", titolo: "Il luna park maledetto", serie: null, sottotitolo: "Maghi contro Mafiosi", colore: "#ff4fd8", simbolo: "☠",
    intro: "Le giostre girano da sole, la musica non si ferma mai e chi entra non trova più l'uscita. Qualcuno ha stregato il luna park.",
    tappe: [
      { titolo: "La biglietteria", nemici: ["lollon", "ginice", "tizievil", "lasombra", "fiesta"], liv: [1, 1], abilita: 0.82, monete: 200,
        parla: "lollon", frase: "Un biglietto per la ruota panoramica? Fidati, è sicurissima. Quasi." },
      { titolo: "Gli specchi deformanti", nemici: ["wandessia", "ritadora", "giulifleur", "panky", "dionpips"], liv: [1, 1], abilita: 0.84, monete: 210,
        parla: "ritadora", frase: "Quale delle mie facce preferisci? Tanto le perdi tutte." },
      { titolo: "Il tunnel dell'orrore", nemici: ["vikatrix", "labruja", "diablo", "auroruna", "adelrizio"], liv: [1, 1], abilita: 0.86, monete: 220, bustina: "normale",
        parla: "vikatrix", frase: "Nel tunnel nessuno ti sente urlare. Che bello." },
      { titolo: "Le montagne russe", nemici: ["samulett", "diegirius", "eltigre", "comora", "ludraco"], liv: [1, 1], abilita: 0.88, monete: 230,
        parla: "diegirius", frase: "Su e giù, su e giù... e poi solo giù." },
      { titolo: "La tenda della veggente", nemici: ["seneverr", "pipverus", "mieloki", "loca", "alessmione"], liv: [1, 1], abilita: 0.9, monete: 240,
        parla: "pipverus", frase: "La sfera di cristallo dice che perderai. La sfera non sbaglia mai." },
      { titolo: "Il padrone delle giostre", boss: true, nemici: ["simoldemort", "mauriziente", "reina", "ombra", "freezovico"], liv: [1, 1], abilita: 0.92, monete: 420, bustina: "leggendaria",
        parla: "simoldemort", frase: "Benvenuto nel mio luna park. L'uscita? Non l'ho mai costruita.", vittoria: "Le giostre si fermano e la maledizione si spezza. Dalla cima della ruota panoramica, però, si vede una montagna che fuma..." },
    ],
  },
  {
    id: "c10", campo: "lava", titolo: "Il cuore del vulcano", serie: null, sottotitolo: "Tutti contro tutti", colore: "#ff5a1f", simbolo: "▲",
    intro: "La montagna si è svegliata. Fiumi di lava, grotte di cristallo e un cratere dove si sono radunati i più forti di ogni mondo, per vedere chi resta in piedi.",
    tappe: [
      { titolo: "Le pendici", nemici: ["rojo", "efesamuele", "fuego", "giulmai", "chichice"], liv: [1, 1], abilita: 0.84, monete: 220,
        parla: "efesamuele", frase: "Qui sotto c'è la mia fucina. Non toccare niente: scotta." },
      { titolo: "Le grotte di cristallo", nemici: ["c18ora", "diego17", "cypips", "persene", "waspy"], liv: [1, 1], abilita: 0.86, monete: 230,
        parla: "c18ora", frase: "I cristalli riflettono ogni colpo. Anche quelli che non hai ancora tirato." },
      { titolo: "Il fiume di lava", nemici: ["pipverus", "caulifrita", "eltigre", "nikulia", "aresorenzo"], liv: [1, 1], abilita: 0.88, monete: 240, bustina: "epica",
        parla: "caulifrita", frase: "Il ponte regge solo uno di noi due. Indovina chi." },
      { titolo: "Il campo di cenere", nemici: ["ombra", "vikatrix", "criliziano", "bandita", "herdiego"], liv: [1, 1], abilita: 0.9, monete: 250,
        parla: "ombra", frase: "Nella cenere non si vedono le impronte. Le mie, di sicuro, no." },
      { titolo: "Il cratere", nemici: ["ligulk", "brolymone", "seneverr", "pelado", "poseludovico"], liv: [1, 1], abilita: 0.92, monete: 260,
        parla: "ligulk", frase: "Ligulk spacca. Ligulk spacca anche il vulcano." },
      { titolo: "Fuoco e tuoni", boss: true, nemici: ["mauthor", "vegerizio", "samulett", "aresorenzo", "alessmione"], liv: [1, 1], abilita: 0.94, monete: 450, bustina: "leggendaria",
        parla: "mauthor", frase: "Fuoco e tuoni: questa è la mia montagna. Inginocchiati, se le ginocchia non ti si sono sciolte.", vittoria: "Il vulcano si calma sotto i tuoi piedi. Ma sul fondo del cratere si apre una crepa che scende verso gli Inferi..." },
    ],
  },
  {
    id: "c11", campo: "lava", titolo: "Discesa agli Inferi", serie: "demoni", colore: "#d4145a", simbolo: "♆",
    intro: "Dal cratere del vulcano si è aperta una crepa che scende sempre più giù. Fiumi neri, patti col diavolo e un trono di fuoco: i Demoni ti stavano aspettando.",
    tappe: [
      { titolo: "La porta degli Inferi", nemici: ["vikamashtu", "senecate", "giulimaah", "ritacubus", "pipmon"], liv: [1, 1], abilita: 0.86, monete: 240,
        parla: "vikamashtu", frase: "Benvenuto all'inferno. Scotta un po', ma ti abitui. Forse." },
      { titolo: "Il fiume Stige", nemici: ["aurorrigan", "giulimaah", "alistaroth", "senecate", "diegial"], liv: [1, 1], abilita: 0.88, monete: 250,
        parla: "aurorrigan", frase: "I miei corvi ti hanno visto arrivare. Hanno visto anche come finisce." },
      { titolo: "Il mercato dei patti", nemici: ["pipmon", "ludomodeus", "ritacubus", "vikamashtu", "tiziazel"], liv: [1, 1], abilita: 0.9, monete: 260, bustina: "epica",
        parla: "pipmon", frase: "Firma qui. Poi qui. E qui. Non leggere le scritte piccole." },
      { titolo: "Il cerchio del sabba", nemici: ["mauriphomet", "alissith", "senecate", "aurorrigan", "alistaroth"], liv: [1, 1], abilita: 0.92, monete: 270,
        parla: "mauriphomet", frase: "Sei entrato nel cerchio. Da qui non si esce camminando." },
      { titolo: "L'abisso", nemici: ["simothan", "samuzebub", "diegial", "tiziazel", "ludomodeus"], liv: [1, 1], abilita: 0.94, monete: 280,
        parla: "simothan", frase: "Più scendi, più l'acqua è scura. E io sono quello che ci nuota dentro." },
      { titolo: "Il trono di fuoco", boss: true, nemici: ["lollifer", "alissith", "samuzebub", "simothan", "mauriphomet"], liv: [1, 1], abilita: 0.96, monete: 480, bustina: "leggendaria",
        parla: "lollifer", frase: "Sono caduto dal cielo per costruirmi questo trono. Credi davvero di potermelo togliere?", vittoria: "Il trono di fuoco è vuoto e la crepa si richiude. Risali in superficie: in città è appena iniziata una giornata di lavoro molto strana." }
    ],
  },
  {
    id: "c12", campo: "stadio", titolo: "La città dei mestieri", serie: "mestieri", colore: "#a6e22e", simbolo: "⚒",
    intro: "Di giorno la città lavora: c'è chi insegna, chi segna gol, chi gira film e chi entra nei computer degli altri. Ma oggi ogni mestiere ha una sfida per te.",
    tappe: [
      { titolo: "Il villaggio vacanze", nemici: ["ritanimatrice", "giudella", "auroressa", "diegarman", "samutografo"], liv: [1, 1], abilita: 0.88, monete: 250,
        parla: "ritanimatrice", frase: "Tutti in piscina per il ballo di gruppo! Chi non balla, combatte." },
      { titolo: "La scuola", nemici: ["auroressa", "alessiologa", "samutografo", "vikyventura", "giudella"], liv: [1, 1], abilita: 0.9, monete: 260,
        parla: "auroressa", frase: "Interrogazione a sorpresa. Domanda numero uno: sai perdere con dignità?" },
      { titolo: "Lo stadio", nemici: ["pipciatore", "maurialpinista", "diegarman", "vikyventura", "simonducer"], liv: [1, 1], abilita: 0.92, monete: 270, bustina: "epica",
        parla: "pipciatore", frase: "Novantesimo minuto, palla al numero dieci. Indovina come finisce." },
      { titolo: "La borsa", nemici: ["senebroker", "ludhacker", "alessiologa", "giudella", "samutografo"], liv: [1, 1], abilita: 0.94, monete: 280,
        parla: "senebroker", frase: "Le tue azioni stanno crollando. E le tue difese pure." },
      { titolo: "Il set del film", nemici: ["tiziegista", "simonducer", "alispia", "maurialpinista", "pipciatore"], liv: [1, 1], abilita: 0.95, monete: 290,
        parla: "tiziegista", frase: "Scena della battaglia, prima ripresa. Tu fai quello che perde. Azione!" },
      { titolo: "Il grande concerto", boss: true, nemici: ["lollinista", "ludhacker", "alispia", "tiziegista", "senebroker"], liv: [1, 1], abilita: 0.97, monete: 500, bustina: "leggendaria",
        parla: "lollinista", frase: "Il teatro è pieno e il pianoforte è pronto. L'ultima nota la suono io.", vittoria: "Applausi in piedi: la città intera ha visto la tua vittoria. Fuori dal teatro ti aspetta un pullman giallo: destinazione Springfield." }
    ],
  },
  {
    id: "c16", campo: "stadio", titolo: "Benvenuti a Springfield", serie: "simpson", colore: "#ffd90f", simbolo: "◎",
    intro: "Il pullman giallo ti lascia davanti alla scuola elementare. Nuvole a forma di nuvola, una centrale nucleare all'orizzonte e un profumo di ciambelle ovunque: a Springfield i tuoi amici sono diventati gialli, e vogliono sfidarti.",
    tappe: [
      { titolo: "La scuola elementare", nemici: ["alledna", "ludohouse", "riessica", "aurrerri", "vaggie"], liv: [1, 1], abilita: 0.88, monete: 250,
        parla: "alledna", frase: "Ah-ha! Arrivi in ritardo. Siediti: oggi l'interrogazione la fai combattendo." },
      { titolo: "La Taverna di Moe", nemici: ["pimoe", "simarney", "giupatty", "selmene", "dieggum"], liv: [1, 1], abilita: 0.9, monete: 260,
        parla: "pimoe", frase: "Qui si entra solo se si paga da bere. Tu non hai pagato. Quindi si combatte." },
      { titolo: "La prima chiesa di Springfield", nemici: ["maurilanders", "riessica", "aurrerri", "giupatty", "ludohouse"], liv: [1, 1], abilita: 0.92, monete: 270, bustina: "epica",
        parla: "maurilanders", frase: "Salve salvino, forestierino! Un'ultima preghierina e poi ti sistemo per benino." },
      { titolo: "Lo studio di Krusty", nemici: ["samusty", "simarney", "selmene", "vaggie", "alledna"], liv: [1, 1], abilita: 0.94, monete: 280,
        parla: "samusty", frase: "Ehi ehi, ragazzi! Oggi nello show c'è un ospite speciale: il perdente!" },
      { titolo: "La stazione di polizia", nemici: ["dieggum", "maurilanders", "pimoe", "alisa", "giupatty"], liv: [1, 1], abilita: 0.95, monete: 290,
        parla: "dieggum", frase: "Sei in arresto per… per… beh, ci penso dopo. Prima combattiamo." },
      { titolo: "742 di Evergreen Terrace", boss: true, nemici: ["tizomer", "lollart", "alisa", "vaggie", "samusty"], liv: [1, 1], abilita: 0.97, monete: 500, bustina: "leggendaria",
        parla: "tizomer", frase: "D'oh! Hai finito tutte le ciambelle? Allora è guerra.", vittoria: "Springfield ti saluta con una ciambella gigante. Ma in cantina, dietro la lavatrice dei Simpson, c'è una porticina rosa che prima non c'era…" }
    ],
  },
  {
    id: "c17", campo: "pioggia", titolo: "La casa dei Barbapapà", serie: "barbapapa", colore: "#ff8fc8", simbolo: "✿",
    intro: "Dalla cantina dei Simpson spunta un giardino pieno di fiori. In fondo c'è una casa rosa tutta tondeggiante: lì vivono i Barbapapà, che si trasformano in quello che vogliono. Barbatrucco!",
    tappe: [
      { titolo: "Il giardino fiorito", nemici: ["tizoba", "samuba", "simopa", "alebella", "giulialla"], liv: [1, 1], abilita: 0.88, monete: 260,
        parla: "tizoba", frase: "Sta per piovere: io divento un ombrello, tu invece ti bagni. E perdi." },
      { titolo: "Il laboratorio blu", nemici: ["samuba", "ludopa", "aliottina", "seneforte", "simopa"], liv: [1, 1], abilita: 0.9, monete: 270,
        parla: "samuba", frase: "Esperimento numero 47: vediamo quanto resisti prima del botto." },
      { titolo: "La biblioteca", nemici: ["aliottina", "ludopa", "alebella", "vikylalla", "tizoba"], liv: [1, 1], abilita: 0.92, monete: 280, bustina: "epica",
        parla: "aliottina", frase: "Silenzio in biblioteca! Le regole qui le scrivo io. Nei libri." },
      { titolo: "Il campo sportivo", nemici: ["mauriba", "aurobrava", "seneforte", "vikylalla", "samuba"], liv: [1, 1], abilita: 0.94, monete: 290,
        parla: "mauriba", frase: "Riscaldamento finito. Ora si gioca sul serio, e io non perdo mai in casa." },
      { titolo: "La sala della musica", nemici: ["giulialla", "vikylalla", "aurobrava", "mauriba", "diegopa"], liv: [1, 1], abilita: 0.95, monete: 300,
        parla: "vikylalla", frase: "Un, due, tre, quattro! Questo assolo te lo suono in faccia." },
      { titolo: "La casa rosa", boss: true, nemici: ["ritamma", "lollapa", "pipsoba", "diegopa", "aliottina"], liv: [1, 1], abilita: 0.97, monete: 520, bustina: "leggendaria",
        parla: "ritamma", frase: "In questa casa si entra pulendosi i piedi. Tu non l'hai fatto. Barbatrucco!", vittoria: "La famiglia Barbapapà ti saluta trasformandosi in un arco di fiori. Dietro l'ultimo petalo si vedono le stelle…" }
    ],
  },
  {
    id: "c18", campo: "notte", titolo: "Una galassia lontana lontana", serie: "starwars", colore: "#4fc3ff", simbolo: "☄",
    intro: "Dietro l'ultimo petalo non c'è un muro, ma le stelle. Un'astronave un po' ammaccata ti aspetta: tanto tempo fa, in una galassia lontana lontana, i tuoi amici sono diventati Jedi, Sith e ribelli.",
    tappe: [
      { titolo: "Il deserto di Tatooine", nemici: ["ritey", "senendulla", "vikyerso", "diegoren", "aleadme"], liv: [1, 1], abilita: 0.88, monete: 270,
        parla: "ritey", frase: "Questi rottami li ho trovati io. E anche questa battaglia." },
      { titolo: "La cantina di Mos Eisley", nemici: ["pipsobafett", "senendulla", "vikyerso", "alihsoka", "aurothma"], liv: [1, 1], abilita: 0.9, monete: 280,
        parla: "pipsobafett", frase: "Sulla tua testa c'è una bella taglia. Vivo o sconfitto, per me è uguale." },
      { titolo: "Il Senato galattico", nemici: ["aurothma", "aleadme", "simalpatine", "alihsoka", "ritey"], liv: [1, 1], abilita: 0.92, monete: 290, bustina: "epica",
        parla: "simalpatine", frase: "Il Senato ha votato: perdi tu. Eh eh eh." },
      { titolo: "La base ribelle", nemici: ["giueia", "mauribecca", "vikyerso", "senendulla", "samuwan"], liv: [1, 1], abilita: 0.94, monete: 300,
        parla: "giueia", frase: "Ci hanno trovati. Mettiti in posizione: questa base non cade." },
      { titolo: "Il duello su Mustafar", nemici: ["lollakin", "samuwan", "ludowalker", "alihsoka", "diegoren"], liv: [1, 1], abilita: 0.95, monete: 310,
        parla: "samuwan", frase: "Hello there! Attento alla lava: qui chi ha l'altura vince." },
      { titolo: "La Morte Nera", boss: true, nemici: ["tizvader", "simalpatine", "diegoren", "pipsobafett", "lollakin"], liv: [1, 1], abilita: 0.97, monete: 540, bustina: "leggendaria",
        parla: "tizvader", frase: "Non sottovalutare il potere del lato oscuro. Io… sono il tuo boss.", vittoria: "La Morte Nera esplode in mille stelle. Nel lampo si apre uno squarcio nello spazio: dentro girano fuoco, acqua, terra e vento." }
    ],
  },
  {
    id: "c19", campo: "tempio", titolo: "Il regno degli elementi", serie: "elementi", colore: "#3fe0c0", simbolo: "❖",
    intro: "Dallo squarcio cadi in un mondo dove ogni cosa è un elemento: foreste che fioriscono in un attimo, laghi in tempesta, vette di ghiaccio e vulcani. I tuoi amici ne sono diventati i signori, e non hanno nessuna voglia di dividerlo con te.",
    tappe: [
      { titolo: "La foresta in fiore", nemici: ["giuliflora", "mauricore", "samulmine", "lollonova", "ludomagma"], liv: [1, 1], abilita: 0.9, monete: 280,
        parla: "giuliflora", frase: "Cammina piano: ogni fiore che calpesti diventa una spina." },
      { titolo: "Il lago in tempesta", nemici: ["diegaqua", "samulmine", "alisombra", "mauricore", "simoluce"], liv: [1, 1], abilita: 0.91, monete: 290,
        parla: "diegaqua", frase: "Il lago adesso è calmo. Tra un minuto no." },
      { titolo: "Le vette di ghiaccio", nemici: ["pipgelo", "ritacrys", "lollonova", "giuliflora", "tiziamma"], liv: [1, 1], abilita: 0.93, monete: 300, bustina: "epica",
        parla: "pipgelo", frase: "Quassù si gela. E quello che fa gelare tutto sono io." },
      { titolo: "La palude del veleno", nemici: ["alessieno", "alisombra", "samulmine", "ludomagma", "ritacrys"], liv: [1, 1], abilita: 0.94, monete: 310,
        parla: "alessieno", frase: "Non bere l'acqua della palude. Anzi no, bevila pure." },
      { titolo: "La forgia di magma", nemici: ["tiziamma", "ludomagma", "vikytal", "diegaqua", "simoluce"], liv: [1, 1], abilita: 0.95, monete: 320,
        parla: "tiziamma", frase: "Qui dentro si forgiano le armi degli elementi. Oggi si forgia la tua sconfitta." },
      { titolo: "Il trono degli elementi", boss: true, nemici: ["auraria", "senesuono", "vikytal", "pipgelo", "alessieno"], liv: [1, 1], abilita: 0.97, monete: 560, bustina: "leggendaria",
        parla: "auraria", frase: "Fuoco, acqua, terra e cielo rispondono a me. Tu a chi rispondi?", vittoria: "Gli elementi si placano e il trono si spegne. Il cielo diventa notte, sorge una luna piena enorme e da lontano si sente un ululato…" }
    ],
  },
  {
    id: "c20", campo: "notte", titolo: "La notte delle creature", serie: "creature", colore: "#9d7bff", simbolo: "☠",
    intro: "Sotto la luna piena il mondo cambia: dal cimitero escono gli zombie, nella laguna canta una sirena e sulla collina si accende il castello del conte. I tuoi amici sono diventati creature della notte, e hanno fame.",
    tappe: [
      { titolo: "Il cimitero", nemici: ["diegombie", "simospirit", "alessiaracne", "pipkenstein", "ritarena"], liv: [1, 1], abilita: 0.9, monete: 290,
        parla: "diegombie", frase: "Cervellooo… no, scherzo. Mi basta vincere." },
      { titolo: "La laguna nera", nemici: ["ritarena", "auranshee", "ludogargo", "alessiaracne", "tizidrac"], liv: [1, 1], abilita: 0.92, monete: 300,
        parla: "ritarena", frase: "Senti questa canzone? È l'ultima che senti prima di perdere." },
      { titolo: "Il laboratorio del dottore", nemici: ["pipkenstein", "maurimmia", "diegombie", "auranshee", "simospirit"], liv: [1, 1], abilita: 0.93, monete: 310, bustina: "epica",
        parla: "pipkenstein", frase: "È vivo! È vivo! E adesso ti picchia." },
      { titolo: "La piramide maledetta", nemici: ["maurimmia", "aligorgona", "ludogargo", "tizidrac", "giulistrega"], liv: [1, 1], abilita: 0.94, monete: 320,
        parla: "maurimmia", frase: "Hai svegliato il faraone. Pessima idea, davvero pessima." },
      { titolo: "Il bosco della luna piena", nemici: ["samulupo", "lollendigo", "giulistrega", "alessiaracne", "senelagoon"], liv: [1, 1], abilita: 0.95, monete: 330,
        parla: "samulupo", frase: "Auuuuuu! Stanotte la luna è piena, e io ho una fame da lupo." },
      { titolo: "Il castello del conte", boss: true, nemici: ["vikyeletro", "lollendigo", "senelagoon", "tizidrac", "samulupo"], liv: [1, 1], abilita: 0.97, monete: 580, bustina: "leggendaria",
        parla: "tizidrac", frase: "Benvenuto nel mio castello. Entra pure: è uscire che è un po' più difficile.", vittoria: "All'alba le creature tornano nelle loro tombe. In fondo alla cripta trovi una porta di metallo piena di luci al neon: dall'altra parte c'è il futuro." }
    ],
  },
  {
    id: "c21", campo: "pioggia", titolo: "La città del futuro", serie: "cyborg", colore: "#38e0ff", simbolo: "⌬",
    intro: "Oltre la porta piove su una città di grattacieli, insegne al neon e auto volanti. I tuoi amici sono diventati cyborg, collegati a un cervello centrale che controlla tutto. Tutto tranne te.",
    tappe: [
      { titolo: "Il quartiere dei neon", nemici: ["alicircuit", "simonex", "mauriborg", "auroroide", "ludovolt"], liv: [1, 1], abilita: 0.9, monete: 300,
        parla: "alicircuit", frase: "Benvenuto nel futuro. Qui chi non è collegato resta indietro." },
      { titolo: "Il mercato dei ricambi", nemici: ["auroroide", "giulibyte", "samulex", "simonex", "mauriborg"], liv: [1, 1], abilita: 0.92, monete: 310,
        parla: "auroroide", frase: "Ti manca un braccio? Te lo vendo io. Dopo che hai perso, però." },
      { titolo: "La fabbrica dei robot", nemici: ["mauriborg", "piptron", "tizitron", "lolloborg", "alicircuit"], liv: [1, 1], abilita: 0.93, monete: 320, bustina: "epica",
        parla: "piptron", frase: "Qui si montano cyborg dalla mattina alla sera. Tu sei il prossimo pezzo da smontare." },
      { titolo: "Dentro la rete", nemici: ["senetron", "vikybyte", "lolloborg", "ludovolt", "giulibyte"], liv: [1, 1], abilita: 0.94, monete: 330,
        parla: "senetron", frase: "Sei entrato nella rete. Peccato che la rete sia mia." },
      { titolo: "Il grattacielo della corporazione", nemici: ["ritron", "tizitron", "samulex", "vikybyte", "piptron"], liv: [1, 1], abilita: 0.95, monete: 340,
        parla: "ritron", frase: "Centesimo piano, vista sulla città e un cannone al plasma carico. Sorridi!" },
      { titolo: "Il cervello centrale", boss: true, nemici: ["alessiai", "diegobot", "ritron", "senetron", "tizitron"], liv: [1, 1], abilita: 0.97, monete: 600, bustina: "leggendaria",
        parla: "alessiai", frase: "Ho simulato questa battaglia un milione di volte. Hai vinto zero volte.", vittoria: "Il cervello centrale si spegne e la città va al buio. Solo lo schermo più grande resta acceso, e non mostra te… ma mondi diversi." }
    ],
  },
  {
    id: "c13", campo: "notte", titolo: "Lo specchio dei mondi", sottotitolo: "Multiverso", colore: "#c38bff", simbolo: "∞",
    intro: "Tocchi lo schermo gigante del cervello centrale e la superficie si muove come acqua. Ci entri e ti ritrovi nel Multiverso: ogni amico è lì in tutte le sue versioni, e insieme sono più forti.",
    tappe: [
      { titolo: "Il riflesso di Giulia", nemici: ["giulmai", "nikulia", "giulifleur", "giulimaah", "giudella"], liv: [1, 1], abilita: 0.9, monete: 290,
        parla: "giudella", frase: "Cinque Giulie e una sola passerella. Indovina quale è quella vera… mentre ti battiamo." },
      { titolo: "Le mille Viky", nemici: ["panky", "demviky", "vikatrix", "vikamashtu", "vikyventura"], liv: [1, 1], abilita: 0.91, monete: 300,
        parla: "vikatrix", frase: "In un mondo sono una strega, in un altro un demone. In tutti ti batto." },
      { titolo: "Il labirinto di Aurora", nemici: ["c18ora", "aurera", "auroruna", "aurorrigan", "auroressa"], liv: [1, 1], abilita: 0.92, monete: 310, bustina: "epica",
        parla: "aurorrigan", frase: "Ogni corridoio del labirinto porta a un'altra me. E nessuno porta all'uscita." },
      { titolo: "Lo specchio di Senè", nemici: ["bulsene", "persene", "seneverr", "senecate", "senebroker"], liv: [1, 1], abilita: 0.93, monete: 320,
        parla: "senebroker", frase: "Abbiamo fatto i conti: cinque contro uno. L'investimento è sicuro." },
      { titolo: "Il doppio di Tiziano", nemici: ["criliziano", "zeutiz", "tizievil", "tiziazel", "tiziegista"], liv: [1, 1], abilita: 0.95, monete: 330,
        parla: "tiziegista", frase: "Scena madre: tutti i Tiziano del Multiverso contro di te. Motore… azione!" },
      { titolo: "Tutti i Lorenzo", boss: true, nemici: ["gohanlollo", "aresorenzo", "lollon", "lollinista", "lollifer"], liv: [1, 1], abilita: 0.97, monete: 520, bustina: "leggendaria",
        parla: "lollifer", frase: "Cinque mondi, cinque Lorenzo. E di te ce n'è uno solo.", vittoria: "Gli specchi si incrinano e cadono in mille pezzi. In lontananza fischia un treno: è l'unico modo per tornare a casa." }
    ],
  },
  {
    id: "c14", campo: "pioggia", titolo: "Il treno tra i mondi", sottotitolo: "Multiverso", colore: "#4fc3f7", simbolo: "⇶",
    intro: "Un treno corre sotto la pioggia attraversando un mondo dopo l'altro. In ogni carrozza viaggiano versioni diverse degli amici, mischiate tra loro: occhio alle coppie dello stesso amico, che si danno forza.",
    tappe: [
      { titolo: "La stazione", nemici: ["ritadora", "ritacubus", "cypips", "pipmon", "chichice"], liv: [1, 1], abilita: 0.92, monete: 300,
        parla: "ritadora", frase: "Biglietto, prego. Non ce l'hai? Allora si paga in battaglia." },
      { titolo: "La carrozza ristorante", nemici: ["diegarman", "diegial", "pipciatore", "pipverus", "giudella"], liv: [1, 1], abilita: 0.93, monete: 310,
        parla: "diegarman", frase: "Il menù di oggi: un cocktail flambé e una sconfitta. Offre la casa." },
      { titolo: "La carrozza letto", nemici: ["alessmione", "alissith", "ludraco", "ludhacker", "auroruna"], liv: [1, 1], abilita: 0.94, monete: 320, bustina: "epica",
        parla: "alessmione", frase: "Qui si dorme. Tu invece, tra un attimo, sognerai di aver vinto." },
      { titolo: "Il ponte sospeso", nemici: ["mauriziente", "maurialpinista", "adelrizio", "samulett", "samutografo"], liv: [1, 1], abilita: 0.95, monete: 330,
        parla: "maurialpinista", frase: "Il ponte è stretto e sotto c'è il vuoto. Io sono abituato all'altezza, tu?" },
      { titolo: "La galleria buia", nemici: ["ludomodeus", "freezovico", "simothan", "simonducer", "alistaroth"], liv: [1, 1], abilita: 0.96, monete: 340,
        parla: "simothan", frase: "In galleria si spengono le luci. È lì che ci divertiamo di più." },
      { titolo: "La locomotiva", boss: true, nemici: ["samuzebub", "gokiele", "efesamuele", "poseludovico", "zeutiz"], liv: [1, 1], abilita: 0.98, monete: 540, bustina: "leggendaria",
        parla: "gokiele", frase: "Il treno lo guido io, e non si ferma finché non cadi. Tutto vapore!", vittoria: "Freni il treno appena in tempo. Davanti a te si alza una torre altissima, con un orologio fermo in cima." }
    ],
  },
  {
    id: "c15", campo: "tempio", titolo: "La torre del tempo", sottotitolo: "Multiverso", colore: "#f2c14e", simbolo: "⌛",
    intro: "Nella torre del tempo il passato e il futuro si incontrano: ogni piano è più alto e più difficile. In cima ti aspettano i più forti di tutti i mondi.",
    tappe: [
      { titolo: "Il portone", nemici: ["tizievil", "ginice", "lollon", "giulifleur", "ritadora"], liv: [1, 1], abilita: 0.94, monete: 320,
        parla: "ginice", frase: "Il portone si apre solo a chi vince. Gli altri restano fuori… per sempre." },
      { titolo: "La sala degli orologi", nemici: ["aphroalessia", "atharita", "dionpips", "persene", "aresorenzo"], liv: [1, 1], abilita: 0.95, monete: 330,
        parla: "aphroalessia", frase: "Ogni ticchettio è un secondo in meno per te. Gli dei non hanno fretta." },
      { titolo: "La scala infinita", nemici: ["diego17", "herdiego", "diegirius", "nikulia", "panky"], liv: [1, 1], abilita: 0.96, monete: 340, bustina: "epica",
        parla: "herdiego", frase: "Tre Diego su questa scala. Per salire devi passare da tutti." },
      { titolo: "Il giardino sospeso", nemici: ["vegerizio", "brolymone", "mauriziente", "simoldemort", "mauriphomet"], liv: [1, 1], abilita: 0.97, monete: 350,
        parla: "vegerizio", frase: "Da quassù il mondo sembra piccolo. E anche tu." },
      { titolo: "La stanza degli specchi", nemici: ["wandessia", "vidalessia", "alispia", "artalice", "alistaroth"], liv: [1, 1], abilita: 0.98, monete: 360,
        parla: "alispia", frase: "Due sorelle, cinque riflessi. Non saprai mai da dove arriva il colpo." },
      { titolo: "In cima alla torre", boss: true, nemici: ["lollinista", "alissith", "gokiele", "zeutiz", "lollifer"], liv: [1, 1], abilita: 1, monete: 600, bustina: "leggendaria",
        parla: "zeutiz", frase: "Il tempo qui si è fermato per aspettarti. Adesso riparte, e non a tuo favore.", vittoria: "L'orologio in cima alla torre riprende a girare. Da lassù vedi l'ultima porta, quella che porta da Los Nueve." }
    ],
  },
  {
    id: "c5", campo: "notte", titolo: "Los Nueve", serie: null, colore: "#b866ff", simbolo: "✦",
    intro: "Tutte le storie portano qui. I più forti di ogni serie si sono uniti in un'unica squadra. È la sfida finale.",
    tappe: [
      { titolo: "Ombre dal passato", nemici: ["ombra", "eltigre", "labruja", "comora", "criliziano"], liv: [4, 4], abilita: 0.86, monete: 260,
        parla: "ombra", frase: "Ti ho seguito per tutta la strada. Adesso tocca a me." },
      { titolo: "Fulmini e saette", nemici: ["mauthor", "zeutiz", "vegerizio", "artalice", "ironlus"], liv: [4, 4], abilita: 0.88, monete: 270,
        parla: "mauthor", frase: "Senti l'aria? Sta arrivando il temporale." },
      { titolo: "Il caos", nemici: ["loca", "wandessia", "dionpips", "panky", "lasombra"], liv: [4, 4], abilita: 0.9, monete: 280, bustina: "epica",
        parla: "wandessia", frase: "Le regole? Le ho appena cambiate tutte." },
      { titolo: "I giganti", nemici: ["ligulk", "brolymone", "poseludovico", "pelado", "wonderrita"], liv: [4, 5], abilita: 0.92, monete: 290,
        parla: "brolymone", frase: "Siete piccoli... Tutti così piccoli..." },
      { titolo: "Gli strateghi", nemici: ["reina", "freezovico", "mieloki", "adelrizio", "atharita"], liv: [4, 5], abilita: 0.94, monete: 300,
        parla: "atharita", frase: "Ogni tua mossa l'ho già prevista. Anche questa." },
      { titolo: "La squadra finale", boss: true, nemici: ["gokiele", "zeutiz", "reina", "ironlus", "aresorenzo"], liv: [5, 5], abilita: 0.97, monete: 700, bustina: "leggendaria", bustine: 2,
        parla: "aresorenzo", frase: "Sei arrivato fin qui. Ora dimostra di meritare il posto tra Los Nueve.", vittoria: "Ce l'hai fatta: sei uno di Los Nueve. Dalla città agli Inferi, in tutti i mondi parlano solo di te." },
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



// Livelli dei nemici in base alla posizione nella storia: dalla prima tappa (Lv1–3) al boss finale (Lv30).
STORIA.forEach((cap, k) => cap.tappe.forEach((t, i) => {
  const g = k * cap.tappe.length + i;
  t.indice = g;
  const ultima = STORIA.reduce((n, c) => n + c.tappe.length, 0) - 1;
  const b = Math.round(g < 30 ? g * .62 : 18 + (g - 30) * 12 / Math.max(1, ultima - 30));
  // i nemici con una sinergia di serie sono più forti: per compensare hanno qualche livello in meno
  // (5 della stessa serie: −3 livelli, 3 o 4: −1)
  const perSerie = {}; for (const id of t.nemici) { const c = (typeof PER_ID !== "undefined" ? PER_ID : require("./carte.js").PER_ID)[id]; if (c) perSerie[c.serie] = (perSerie[c.serie] || 0) + 1; }
  // anche il Multiverso (più versioni della stessa persona) li rende più forti: 3 o più versioni −2, 2 versioni −1
  const perPers = {}; for (const id of t.nemici) { const c = (typeof PER_ID !== "undefined" ? PER_ID : require("./carte.js").PER_ID)[id]; if (c && c.persona) perPers[c.persona] = (perPers[c.persona] || 0) + 1; }
  const maxP = Math.max(0, ...Object.values(perPers));
  const max = Math.max(0, ...Object.values(perSerie)), meno = (max >= 5 ? 3 : max >= 3 ? 1 : 0) + (maxP >= 3 ? 2 : maxP >= 2 ? 1 : 0);
  const bb = Math.max(1, b - meno);
  t.liv = t.boss ? [Math.min(30, bb + 1), Math.min(30, bb + 2)] : [Math.max(1, bb), Math.min(30, bb + 2)];
}));
if (typeof module !== "undefined") module.exports = { STORIA, scrigniCapitolo };
