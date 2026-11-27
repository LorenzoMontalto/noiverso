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
        parla: "alessiai", frase: "Ho simulato questa battaglia un milione di volte. Hai vinto zero volte.", vittoria: "Il cervello centrale si spegne e la città va al buio. Nel silenzio si sente solo un rumore: qualcuno, da qualche parte, sta mescolando un mazzo di carte." }
    ],
  },
  {
    id: "c22", campo: "stadio", titolo: "Il tavolo da gioco", serie: "carte", colore: "#e8b04a", simbolo: "♣",
    intro: "Ti ritrovi in un paese dove tutti giocano a carte, dall'osteria alla piazza. I tuoi amici sono diventati re, cavalli, fanti e assi delle carte napoletane, e ogni partita si gioca sul serio.",
    tappe: [
      { titolo: "L'osteria", nemici: ["aurante", "alessante", "diegallo", "simocallo", "pipsante"], liv: [1, 1], abilita: 0.9, monete: 310,
        parla: "aurante", frase: "Si gioca a scopa? Chi perde paga da bere. E perdi tu." },
      { titolo: "La sagra del paese", nemici: ["diegallo", "vikante", "senecallo", "simocallo", "alessante"], liv: [1, 1], abilita: 0.92, monete: 320,
        parla: "diegallo", frase: "Alla sagra si mangia, si balla e si gioca a carte. Tu hai scelto la parte sbagliata." },
      { titolo: "Il circolo della briscola", nemici: ["ritare", "pipsante", "senecallo", "aurante", "vikante"], liv: [1, 1], abilita: 0.93, monete: 330, bustina: "epica",
        parla: "ritare", frase: "Qui si gioca a briscola da cent'anni. E da cent'anni vince il banco." },
      { titolo: "La sala del tressette", nemici: ["samasso", "ludasso", "ritare", "lollocallo", "alessante"], liv: [1, 1], abilita: 0.94, monete: 340,
        parla: "samasso", frase: "Ho già contato i punti: settebello, primiera e denari. Mi manca solo la tua sconfitta." },
      { titolo: "Il torneo dei cavalli", nemici: ["lollocallo", "senecallo", "diegallo", "simocallo", "giulasso"], liv: [1, 1], abilita: 0.95, monete: 350,
        parla: "lollocallo", frase: "Quattro cavalli in pista e tu a piedi. Mi sa che parti in svantaggio." },
      { titolo: "Il tavolo dei re", boss: true, nemici: ["maurire", "alire", "tizire", "ritare", "samasso"], liv: [1, 1], abilita: 0.97, monete: 620, bustina: "leggendaria",
        parla: "maurire", frase: "Quattro re sullo stesso tavolo. Tu che carta hai in mano?", vittoria: "I re abbassano le carte: la mano è tua. Sul tavolo resta solo una carta coperta. La giri: è un biglietto aereo, con scritto «Giro del mondo»." }
    ],
  },
  {
    id: "c23", campo: "pioggia", titolo: "Il giro del mondo", serie: "paesi", colore: "#4fb87a", simbolo: "✈",
    intro: "Il biglietto ti porta su un aereo che fa il giro del mondo. A ogni scalo ti aspetta un amico vestito come il suo paese, con bandiera, costume e monumento alle spalle. E nessuno ti lascia ripartire senza una sfida.",
    tappe: [
      { titolo: "Londra sotto la pioggia", nemici: ["aleghilterra", "lollirlanda", "ludormania", "giulancia", "alirtogallo"], liv: [1, 1], abilita: 0.9, monete: 320,
        parla: "aleghilterra", frase: "Benvenuto a Londra. Piove, ovviamente. E tu perdi, ovviamente." },
      { titolo: "Il carnevale di Rio", nemici: ["samubrasil", "alirtogallo", "diegspagna", "giulancia", "ludormania"], liv: [1, 1], abilita: 0.92, monete: 330,
        parla: "samubrasil", frase: "Al carnevale si balla fino all'alba. Tu invece cadi molto prima." },
      { titolo: "All'ombra delle piramidi", nemici: ["maurigitto", "tizgeria", "senesia", "lollirlanda", "alirtogallo"], liv: [1, 1], abilita: 0.93, monete: 340, bustina: "epica",
        parla: "maurigitto", frase: "Queste piramidi resistono da cinquemila anni. Tu non arrivi a cinque minuti." },
      { titolo: "Tokyo in fiore", nemici: ["vikappone", "ritalia", "maurigitto", "ludormania", "senesia"], liv: [1, 1], abilita: 0.94, monete: 350,
        parla: "vikappone", frase: "I ciliegi sono in fiore. Peccato che tu sia venuto qui a farti sfiorire." },
      { titolo: "Le Highlands", nemici: ["pipscozia", "aleghilterra", "lollirlanda", "diegspagna", "tizgeria"], liv: [1, 1], abilita: 0.95, monete: 360,
        parla: "pipscozia", frase: "Hai sentito la cornamusa? Vuol dire che sei arrivato nelle Highlands. E che è troppo tardi per scappare." },
      { titolo: "Il vertice delle nazioni", boss: true, nemici: ["simonusa", "aurorecia", "pipscozia", "ritalia", "samubrasil"], liv: [1, 1], abilita: 0.97, monete: 640, bustina: "leggendaria",
        parla: "simonusa", frase: "Benvenuto al vertice: qui si decide il mondo. E il mondo ha appena deciso che perdi.", vittoria: "Le nazioni firmano la pace e il vertice finisce in festa. Mentre esci, il vento ti porta tra i piedi un manifesto ingiallito: «WANTED», e sotto c'è la tua faccia. Taglia: 5.000 dollari." }
    ],
  },
  {
    id: "c24", campo: "lava", titolo: "La città senza legge", serie: "farwest", colore: "#d9893b", simbolo: "✶",
    intro: "Il manifesto ti porta in una città di legno in mezzo al deserto, dove il sole picchia e la legge la fa chi estrae per primo. Tutti hanno visto la tua faccia sul «WANTED», e tutti vogliono la taglia.",
    tappe: [
      { titolo: "Il saloon", nemici: ["ritaloon", "vikylasso", "tiziariffo", "pipstolero", "samuero"], liv: [1, 1], abilita: 0.9, monete: 320,
        parla: "ritaloon", frase: "Benvenuto al saloon, straniero! Il primo bicchiere lo offre la casa. La prima scazzottata pure." },
      { titolo: "L'ufficio dello sceriffo", nemici: ["tiziariffo", "simarshal", "dieganger", "ritaloon", "vikylasso"], liv: [1, 1], abilita: 0.92, monete: 330,
        parla: "tiziariffo", frase: "Ho il tuo manifesto appeso in ufficio da una settimana. Finalmente ti sei fatto vedere." },
      { titolo: "L'assalto alla diligenza", nemici: ["auroraider", "mauribandit", "alessoutlaw", "pipstolero", "samuero"], liv: [1, 1], abilita: 0.93, monete: 340, bustina: "epica",
        parla: "auroraider", frase: "Mani in alto! Questa diligenza è nostra. E da adesso anche la tua taglia." },
      { titolo: "Il rodeo", nemici: ["samuero", "vikylasso", "lollawless", "dieganger", "alicolt"], liv: [1, 1], abilita: 0.94, monete: 350,
        parla: "samuero", frase: "Al rodeo vince chi resta in sella più a lungo. Tu sei già con la faccia nella polvere." },
      { titolo: "La rapina al treno", nemici: ["alessoutlaw", "mauribandit", "lollawless", "auroraider", "ludobunty"], liv: [1, 1], abilita: 0.95, monete: 360,
        parla: "mauribandit", frase: "La miccia è accesa e il treno sta arrivando. Tu sei proprio in mezzo ai binari." },
      { titolo: "Mezzogiorno di fuoco", boss: true, nemici: ["seneloon", "giuvlass", "ludobunty", "simarshal", "alicolt"], liv: [1, 1], abilita: 0.97, monete: 640, bustina: "leggendaria",
        parla: "seneloon", frase: "Questo è il mio saloon e la mia città, straniero. Qui si beve, si balla e, a mezzogiorno, si spara.", vittoria: "Il fumo si dirada e la città intera ti applaude: da oggi lo sceriffo sei tu. Seneloon ti lascia la ricompensa sul bancone: una vecchia radio. La accendi e, tra i fruscii, una voce chiede aiuto: «Qui zona rossa… c'è ancora qualcuno vivo?»" }
    ],
  },
  {
    id: "c25", campo: "notte", titolo: "La zona rossa", serie: "apocalisse", colore: "#e0552e", simbolo: "☣",
    intro: "Segui la voce della radio fino a una città in rovina, recintata dai cartelli di quarantena. Il virus ha trasformato quasi tutti: i pochi sopravvissuti sono i tuoi amici, armati fino ai denti e convinti che l'infetto sia tu.",
    tappe: [
      { titolo: "Il posto di blocco", nemici: ["senemune", "giulimort", "ludovirus", "samudead", "auroravive"], liv: [1, 1], abilita: 0.9, monete: 320,
        parla: "senemune", frase: "Fermo lì! Prima il controllo: se sei infetto, qui non entri. Se non lo sei… non entri lo stesso." },
      { titolo: "L'ospedale abbandonato", nemici: ["auroravive", "alizombie", "senemune", "simopter", "giulimort"], liv: [1, 1], abilita: 0.92, monete: 330,
        parla: "auroravive", frase: "Le medicine sono finite da un pezzo. Però le bende ce le ho ancora: ti serviranno." },
      { titolo: "L'orda", nemici: ["alizombie", "maurizomb", "lollivor", "samudead", "ludovirus"], liv: [1, 1], abilita: 0.93, monete: 340, bustina: "epica",
        parla: "alizombie", frase: "Ho solo un graffietto, giuro. Però adesso che ti guardo… hai un'aria così appetitosa." },
      { titolo: "La torre radio", nemici: ["alesshack", "simopter", "vikydead", "tizianator", "lollivor"], liv: [1, 1], abilita: 0.94, monete: 350,
        parla: "alesshack", frase: "La voce alla radio? Ero io. Avevo bisogno di qualcuno che facesse da esca all'orda." },
      { titolo: "Il laboratorio", nemici: ["pipscience", "alesshack", "tizianator", "maurizomb", "vikydead"], liv: [1, 1], abilita: 0.95, monete: 360,
        parla: "pipscience", frase: "Questa provetta può salvare il mondo. O finirlo. Facciamo una prova su di te?" },
      { titolo: "L'ultimo rifugio", boss: true, nemici: ["dieghunter", "ritageddon", "pipscience", "vikydead", "maurizomb"], liv: [1, 1], abilita: 0.97, monete: 640, bustina: "leggendaria",
        parla: "dieghunter", frase: "Ho contato ogni infetto che ho abbattuto. Tu saresti il numero mille: un bel numero tondo.", vittoria: "Dieghunter abbassa la balestra: non sei infetto, sei solo ostinato. All'alba arriva l'elicottero e, tra le scorte del rifugio, trovi una lanterna di carta rossa che si accende da sola. Dentro, un petalo di ciliegio e una scritta: «Il santuario ti aspetta»." }
    ],
  },
  {
    id: "c26", campo: "tempio", titolo: "Il santuario della luna rossa", serie: "giappone", colore: "#e84a7f", simbolo: "⛩",
    intro: "La lanterna ti guida oltre un torii rosso, in una valle di ciliegi sotto una luna color sangue. Qui gli dèi e i demoni camminano tra la gente, e i tuoi amici sono diventati samurai, kami e yokai: per arrivare al santuario devi superarli tutti, con onore.",
    tappe: [
      { titolo: "Il torii del villaggio", nemici: ["ritamiko", "pipsuki", "seneko", "vikitsune", "alikami"], liv: [1, 1], abilita: 0.9, monete: 320,
        parla: "ritamiko", frase: "Prima di passare sotto il torii ci si inchina. Tu non ti sei inchinato. Quindi niente, torni indietro." },
      { titolo: "La foresta degli spiriti", nemici: ["giulyokai", "vikitsune", "alikami", "pipsuki", "seneko"], liv: [1, 1], abilita: 0.92, monete: 330,
        parla: "giulyokai", frase: "Stanotte sfilano i cento demoni. Ne manca uno per fare cifra tonda: mi sembri perfetto." },
      { titolo: "Il dojo del clan", nemici: ["ludoninja", "alesshogun", "maurioni", "seneko", "ritamiko"], liv: [1, 1], abilita: 0.93, monete: 340, bustina: "epica",
        parla: "alesshogun", frase: "Nel mio clan si entra in due modi: con un invito o con la spada. Il tuo invito non lo vedo." },
      { titolo: "La vetta del tengu", nemici: ["simotengu", "aurokitsune", "diegami", "ludoninja", "giulyokai"], liv: [1, 1], abilita: 0.94, monete: 350,
        parla: "simotengu", frase: "Sei salito fin quassù senza ali? Complimenti. Adesso scendi, e senza ali è più veloce." },
      { titolo: "Il lago dell'Orochi", nemici: ["lollorochi", "maurioni", "aurokitsune", "diegami", "simotengu"], liv: [1, 1], abilita: 0.95, monete: 360,
        parla: "lollorochi", frase: "Otto teste, otto fame diverse. E tu sei uno solo: dovrete fare a turno, ragazzi." },
      { titolo: "Il santuario della luna rossa", boss: true, nemici: ["samuruele", "tizunagi", "lollorochi", "diegami", "aurokitsune"], liv: [1, 1], abilita: 0.97, monete: 640, bustina: "leggendaria",
        parla: "samuruele", frase: "Ho vinto mille duelli e non ho mai smesso di sorridere. Il millesimo primo sei tu: inchiniamoci, e cominciamo.", vittoria: "Samuruele rinfodera la katana e si inchina: hai combattuto con onore. I ciliegi lasciano cadere una pioggia di petali e, sull'altare del santuario, trovi un biglietto dorato che brilla come una stella: «Circo Intergalattico — ingresso per uno. Lo spettacolo comincia stanotte, in orbita»." }
    ],
  },
  {
    id: "c27", campo: "stadio", titolo: "Il circo tra le stelle", serie: "circo", colore: "#9b4dff", simbolo: "✪",
    intro: "Il biglietto dorato si accende e ti ritrovi su una nave a forma di tendone, in orbita tra pianeti e galassie. Il Circo Intergalattico è pieno di alieni urlanti e i tuoi amici sono le stelle dello spettacolo: per arrivare al centro della pista devi battere tutti i numeri, uno dopo l'altro.",
    tappe: [
      { titolo: "La biglietteria", nemici: ["tiziclown", "giullia", "ritacrobata", "vikyrobata", "pipstronauta"], liv: [1, 1], abilita: 0.9, monete: 320,
        parla: "tiziclown", frase: "Biglietto, prego! Ah, ce l'hai. Peccato: oggi si entra solo battendo il clown." },
      { titolo: "Il trapezio orbitale", nemici: ["ritacrobata", "vikyrobata", "aurorbit", "giullia", "ludovolo"], liv: [1, 1], abilita: 0.92, monete: 330,
        parla: "aurorbit", frase: "Quassù non c'è gravità e non c'è rete. Se cadi, finisci su Saturno." },
      { titolo: "Il serraglio alieno", nemici: ["mauriziano", "diegolo", "pipstronauta", "tiziclown", "aurorbit"], liv: [1, 1], abilita: 0.93, monete: 340, bustina: "epica",
        parla: "mauriziano", frase: "Le mie bestie non mangiano da tre galassie. Tranquillo, sei solo l'antipasto." },
      { titolo: "Il numero di magia", nemici: ["samufo", "alessiastro", "senebula", "diegolo", "ludovolo"], liv: [1, 1], abilita: 0.94, monete: 350,
        parla: "samufo", frase: "Pesca una carta, una qualsiasi. Adesso guarda in alto: il disco volante sta per farti sparire." },
      { titolo: "La regina degli alieni", nemici: ["aliena", "lollovni", "senebula", "alessiastro", "mauriziano"], liv: [1, 1], abilita: 0.95, monete: 360,
        parla: "aliena", frase: "Tutti questi alieni lavorano per me. E da stasera, anche tu." },
      { titolo: "Il gran finale", boss: true, nemici: ["simoonauta", "aliena", "mauriziano", "lollovni", "samufo"], liv: [1, 1], abilita: 0.97, monete: 640, bustina: "leggendaria",
        parla: "simoonauta", frase: "Tre, due, uno… accensione! Sono l'uomo cannone del circo, e il prossimo bersaglio sei tu.", vittoria: "Il pubblico alieno si alza in piedi e il tendone trema di applausi: il gran finale è tuo. Simoonauta ti stringe la mano con il guanto della tuta e ti lascia il premio dello spettacolo: un telecomando d'oro con un solo tasto, «OLIMPO». Lo premi, ovviamente." }
    ],
  },
  {
    id: "c28", campo: "pioggia", titolo: "L'Olimpo degli inutili", serie: "inutili", colore: "#ffa07a", simbolo: "☁",
    intro: "Il telecomando d'oro ti spedisce su una nuvola, tra colonne di marmo, panni da stendere e cartoni di pizza. È l'Olimpo degli Dei Inutili: i tuoi amici sono diventati divinità del niente e non hanno nessuna voglia di essere disturbati. Per tornare indietro devi arrivare fino al divano del loro re.",
    tappe: [
      { titolo: "Le nuvole del dormiveglia", nemici: ["auroronfla", "ludosbadiglio", "senevolta", "ricaos", "tizifone"], liv: [1, 1], abilita: 0.9, monete: 320,
        parla: "auroronfla", frase: "Shh… qui si dorme. Se proprio vuoi passare, fallo senza fare rumore. Anzi, non farlo proprio." },
      { titolo: "La lavanderia divina", nemici: ["ricaos", "senevolta", "giulimbuto", "ludosbadiglio", "simondo"], liv: [1, 1], abilita: 0.92, monete: 330,
        parla: "ricaos", frase: "Non pestare quella pila di panni: sono puliti. O sporchi, non me lo ricordo più." },
      { titolo: "Il banchetto infinito", nemici: ["simondo", "maurizap", "diegigante", "tizifone", "alessietra"], liv: [1, 1], abilita: 0.93, monete: 340, bustina: "epica",
        parla: "simondo", frase: "Hai interrotto il mio quarto pranzo. Il quinto lo faccio dopo averti battuto." },
      { titolo: "La sala del Wi-Fi", nemici: ["samufi", "alessietra", "giulimbuto", "alicronos", "maurizap"], liv: [1, 1], abilita: 0.94, monete: 350,
        parla: "samufi", frase: "Vuoi la password del Wi-Fi? Battimi. Tanto non funziona lo stesso." },
      { titolo: "Le terme di Pipposeidon", nemici: ["pipposeidon", "vikyber", "alicronos", "diegigante", "samufi"], liv: [1, 1], abilita: 0.95, monete: 360,
        parla: "pipposeidon", frase: "Sono sotto la doccia da tre ore e ne ho ancora per due. Tu aspetti fuori, come tutti." },
      { titolo: "Il divano dell'Olimpo", boss: true, nemici: ["lollimpo", "pipposeidon", "vikyber", "maurizap", "diegigante"], liv: [1, 1], abilita: 0.97, monete: 640, bustina: "leggendaria",
        parla: "lollimpo", frase: "Ero così comodo… Va bene, combatto. Ma dal divano: alzarmi non è previsto.", vittoria: "Lollimpo sbadiglia, si gira dall'altra parte e ti lancia il telecomando: «Hai vinto, ora lasciami dormire». Sotto un cuscino del divano, tra briciole e monetine, trovi una scatola di pastelli che brillano. Ne prendi uno in mano e il mondo intorno a te comincia a colorarsi." }
    ],
  },  {
    id: "c29", campo: "tempio", titolo: "L'Italia a colori", serie: "colori", colore: "#ff4fd8", simbolo: "🎨",
    intro: "I pastelli ti trascinano dentro un quadro: l'Italia dipinta a mano, dai girasoli della Toscana al mare di Capri, fino a Roma di notte. Ogni amico è diventato un colore e custodisce un pezzo del quadro. Per uscirne devi raccoglierli tutti, fino alla luce bianca che li contiene.",
    tappe: [
      { titolo: "Le colline toscane", nemici: ["alessiallo", "tizianverde", "seneocra", "aliverde", "diegosa"], liv: [1, 1], abilita: 0.9, monete: 330,
        parla: "alessiallo", frase: "Qui il giallo è mio: girasoli, sole e tramonto. Vuoi passare? Prima devi abbronzarti un po'." },
      { titolo: "Il bosco smeraldo", nemici: ["aliverde", "ludovirde", "tizianverde", "samuarancio", "ritavola"], liv: [1, 1], abilita: 0.92, monete: 340,
        parla: "aliverde", frase: "Shh, le lucciole dormono. E la tua energia… ora è mia." },
      { titolo: "La costiera al tramonto", nemici: ["diegosa", "samuarancio", "vikfuchsia", "seneocra", "ludovirde"], liv: [1, 1], abilita: 0.93, monete: 350, bustina: "epica",
        parla: "diegosa", frase: "Guarda che tramonto rosa! Peccato che tu non te lo possa godere: si combatte." },
      { titolo: "I campi di lavanda", nemici: ["giulilla", "ritavola", "simoborg", "vikfuchsia", "alessiallo"], liv: [1, 1], abilita: 0.94, monete: 360,
        parla: "giulilla", frase: "Senti questo profumo? Respira forte… ecco, ora ti gira la testa." },
      { titolo: "Il mare di Capri", nemici: ["mauzzurro", "lolloblitz", "giulilla", "simoborg", "ludovirde"], liv: [1, 1], abilita: 0.95, monete: 370,
        parla: "mauzzurro", frase: "Il mare oggi è calmo. Non farmi arrabbiare, o arrivano le onde." },
      { titolo: "Roma di notte", boss: true, nemici: ["aurormo", "pipscuro", "lolloblitz", "mauzzurro", "vikfuchsia"], liv: [1, 1], abilita: 0.97, monete: 660, bustina: "leggendaria",
        parla: "aurormo", frase: "Il nero, il blu, il rosa… sono tutti dentro di me. Sono la luce bianca: battimi e il quadro sarà finito.", vittoria: "Aurormo sorride e la luce bianca si apre come un ventaglio: tutti i colori tornano al loro posto e il quadro si asciuga. Nell'angolo in basso, al posto della firma, c'è un biglietto d'ingresso dipinto: «Museo dei Capolavori, valido per un giorno». Lo tocchi, e ti ritrovi davanti a una porta enorme con le cornici d'oro." }
    ],
  },  {
    id: "c30", campo: "notte", titolo: "Il museo dei capolavori", serie: "arte", colore: "#d8a84a", simbolo: "🖼",
    intro: "È notte e il museo è chiuso, ma i quadri sono svegli: in ogni cornice d'oro c'è uno dei tuoi amici, e non hanno nessuna intenzione di farsi guardare in silenzio. Per uscire devi attraversare tutte le sale fino alla più famosa di tutte.",
    tappe: [
      { titolo: "L'ingresso del museo", nemici: ["diegazzo", "dinoludovico", "damaalessiott", "pecorella", "giuvvsage"], liv: [1, 1], abilita: 0.9, monete: 340,
        parla: "diegazzo", frase: "Vietato fumare nel museo? Io sono un quadro: le regole valgono per voi." },
      { titolo: "La sala dei ritratti", nemici: ["pecorella", "auroraermellino", "damaalessiott", "mortesimons", "diegazzo"], liv: [1, 1], abilita: 0.92, monete: 350,
        parla: "pecorella", frase: "Abbiamo appena pranzato in famiglia. Non disturbare la digestione, o ci alziamo tutti insieme." },
      { titolo: "La galleria moderna", nemici: ["giuvvsage", "vikith", "pipsgothic", "dinoludovico", "auroraermellino"], liv: [1, 1], abilita: 0.93, monete: 360, bustina: "epica",
        parla: "giuvvsage", frase: "Ciao! Ciao! Ciao! Ciao! Scusa, sono stampata in serie: ti saluto tutte e quattro." },
      { titolo: "La sala delle battaglie", nemici: ["bonaparte", "seneberta", "vikith", "mortesimons", "lollante"], liv: [1, 1], abilita: 0.94, monete: 370,
        parla: "bonaparte", frase: "Ho attraversato le Alpi a cavallo. Credi davvero che una sala del museo mi fermi?" },
      { titolo: "La sala dei capolavori", nemici: ["urlosamu", "aliceperla", "lollante", "seneberta", "pipsgothic"], liv: [1, 1], abilita: 0.95, monete: 380,
        parla: "urlosamu", frase: "AAAAAAH! …scusa, faccio sempre così quando arriva un visitatore." },
      { titolo: "La Gioconda", boss: true, nemici: ["monnarita", "urlosamu", "aliceperla", "bonaparte", "seneberta"], liv: [1, 1], abilita: 0.97, monete: 680, bustina: "leggendaria",
        parla: "monnarita", frase: "Tutti vengono qui per guardarmi. Ma sono io che guardo te, da qualunque parte ti metti.", vittoria: "Monnarita sorride, come sempre, e ti fa l'occhiolino: «Torna quando vuoi, la fila la salti». Dietro il quadro, appoggiato al muro, c'è un mappamondo di vetro che non riflette il museo… ma mondi diversi." }
    ],
  },


  {
    id: "c13", campo: "notte", titolo: "Lo specchio dei mondi", sottotitolo: "Multiverso", colore: "#c38bff", simbolo: "∞",
    intro: "Tocchi il mappamondo di vetro e la sua superficie si muove come acqua, sempre più grande. Ci entri e ti ritrovi nel Multiverso: ogni amico è lì in tutte le sue versioni, e insieme sono più forti.",
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
      { titolo: "Ombre dal passato", nemici: ["ombra", "eltigre", "labruja", "comora", "criliziano"], liv: [4, 4], abilita: 0.95, monete: 260,
        parla: "ombra", frase: "Ti ho seguito per tutta la strada. Adesso tocca a me." },
      { titolo: "Gli strateghi", nemici: ["reina", "freezovico", "mieloki", "adelrizio", "atharita"], liv: [4, 5], abilita: 0.96, monete: 300,
        parla: "atharita", frase: "Ogni tua mossa l'ho già prevista. Anche questa." },
      { titolo: "Il caos", nemici: ["loca", "wandessia", "dionpips", "panky", "lasombra"], liv: [4, 4], abilita: 0.97, monete: 280, bustina: "epica",
        parla: "wandessia", frase: "Le regole? Le ho appena cambiate tutte." },
      { titolo: "I giganti", nemici: ["ligulk", "brolymone", "poseludovico", "pelado", "wonderrita"], liv: [4, 5], abilita: 0.98, monete: 290,
        parla: "brolymone", frase: "Siete piccoli... Tutti così piccoli..." },
      { titolo: "Fulmini e saette", nemici: ["mauthor", "zeutiz", "vegerizio", "artalice", "ironlus"], liv: [4, 4], abilita: 0.99, monete: 270,
        parla: "mauthor", frase: "Senti l'aria? Sta arrivando il temporale." },
      { titolo: "La squadra finale", boss: true, nemici: ["gokiele", "zeutiz", "reina", "ironlus", "aresorenzo"], liv: [5, 5], abilita: 1, monete: 700, bustina: "leggendaria", bustine: 2,
        parla: "aresorenzo", frase: "Sei arrivato fin qui. Ora dimostra di meritare il posto tra Los Nueve.", vittoria: "Ce l'hai fatta: sei uno di Los Nueve. Dalla città agli Inferi, in tutti i mondi parlano solo di te." },
    ],
  },
];

// Scrigni di ogni capitolo: si aprono con le stelle (3 per tappa, 18 per capitolo)
function scrigniCapitolo(k) {
  const cap = STORIA[k];
  return [
    { id: `${cap.id}-9`, stelle: 9, monete: piuMonete(100 + 50 * k), testo: `${piuMonete(100 + 50 * k)} monete` },
    { id: `${cap.id}-18`, stelle: 18, bustina: k >= 3 ? "leggendaria" : "epica", testo: k >= 3 ? "Bustina Leggendaria" : "Bustina Epica" },
  ];
}



// TARATURA_STORIA: per ogni tappa [livelli in più o in meno, extra]. Calcolata con una simulazione: la difficoltà
// sale con regolarità dentro ogni capitolo e da un capitolo all'altro, e il boss finale è il più duro di tutti.
// Bersagli (squadra tipo — 1 leggendaria, 2 epiche, 1 rara, 1 comune — al livello che ci si aspetta in quel punto):
// nelle tappe normali si vince dall'85% (prima tappa) al 50% (quinta), un po' meno verso la fine della storia;
// i boss dal 40% del primo capitolo al 15% circa degli ultimi, e il boss finale è il più duro di tutti.
// Nei primi 3 capitoli (si sta ancora imparando) la taratura può solo rendere più facile; altrove al massimo +4 livelli
// per le tappe normali.
// Si ricalcola con una simulazione (vedi la cronologia del repository, 26/11/2026) se si cambiano carte o capitoli.
const TARATURA_STORIA = {
  "c4-0": [1, 0], "c4-2": [-1, 0], "c4-3": [2, 0], "c4-4": [2, 0], "c4-5": [2, 0],
  "c6-0": [3, 0], "c6-1": [4, 0], "c6-2": [1, 0], "c6-3": [-2, 0], "c6-4": [1, 0], "c6-5": [-3, 0],
  "c7-0": [1, 0], "c7-1": [1, 0], "c7-2": [3, 0], "c7-3": [-1, 0], "c7-5": [-2, 0],
  "c8-0": [2, 0], "c8-3": [4, 0], "c8-5": [-2, 0],
  "c9-0": [2, 0], "c9-1": [2, 0], "c9-3": [1, 0], "c9-4": [-1, 0], "c9-5": [-2, 0],
  "c10-2": [-4, 0], "c10-5": [-2, 0],
  "c11-0": [-1, 0], "c11-2": [1, 0],
  "c12-2": [-2, 0], "c12-4": [-1, 0], "c12-5": [-2, 0],
  "c16-1": [-2, 0], "c16-2": [1, 0], "c16-3": [3, 0], "c16-4": [-2, 0], "c16-5": [1, 0],
  "c17-0": [2, 0], "c17-1": [2, 0], "c17-2": [1, 0], "c17-3": [1, 0],
  "c18-1": [2, 0], "c18-2": [2, 0], "c18-4": [1, 0], "c18-5": [7, 0],
  "c19-0": [3, 0], "c19-1": [2, 0], "c19-3": [2, 0], "c19-4": [3, 0], "c19-5": [-1, 0],
  "c20-1": [3, 0], "c20-2": [2, 0], "c20-3": [1, 0], "c20-4": [-3, 0], "c20-5": [1, 0],
  "c21-0": [4, 0], "c21-1": [2, 0], "c21-2": [1, 0], "c21-3": [2, 0], "c21-5": [-1, 0],
  "c22-0": [4, 0], "c22-1": [4, 0], "c22-2": [3, 0], "c22-3": [2, 0], "c22-4": [3, 0],
  "c23-0": [4, 0], "c23-1": [1, 0], "c23-2": [3, 0], "c23-3": [4, 0],
  "c24-0": [3, 0], "c24-1": [2, 0], "c24-2": [2, 0], "c24-3": [2, 0],
  "c25-0": [3, 0], "c25-1": [4, 0], "c25-2": [3, 0], "c25-4": [-2, 0],
  "c26-0": [3, 0], "c26-1": [3, 0], "c26-2": [1, 0], "c26-3": [1, 0], "c26-4": [-1, 0],
  "c27-0": [3, 0], "c27-1": [3, 0], "c27-4": [-2, 0],
  "c28-0": [3, 0], "c28-1": [3, 0], "c28-3": [1, 0], "c28-4": [-4, 0],
  "c13-2": [-2, 0], "c13-3": [2, 0], "c13-4": [-1, 0], "c13-5": [3, 2],
  "c14-0": [-1, 0], "c14-1": [-3, 0], "c14-2": [-4, 0], "c14-3": [2, 0], "c14-4": [2, 1], "c14-5": [1, 0],
  "c15-0": [2, 1], "c15-1": [-2, 0], "c15-2": [-1, 0], "c15-3": [-4, 0], "c15-4": [-2, 0], "c15-5": [-1, 0],
  "c5-0": [-4, 0], "c5-1": [-4, 0], "c5-3": [-3, 0], "c5-4": [-4, 0],
};

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
  // nov 2026: taratura tappa per tappa (vedi TARATURA_STORIA): livelli in più o in meno rispetto alla curva e,
  // per le tappe già al livello 30, nemici con la lode, olografici o Ultra
  const ta = TARATURA_STORIA[`${cap.id}-${i}`] || [0, 0];
  const bb = Math.max(1, Math.min(30, b - meno + ta[0]));
  t.curva = b; t.meno = meno; t.extra = ta[1] || 0;
  if (!t.moneteBase) { t.moneteBase = t.monete; t.monete = typeof piuMonete === "function" ? piuMonete(t.monete) : t.monete; }   // +50% (carte.js)
  t.livRif = Math.min(30, b + 2);   // il livello che ci si aspetta dal giocatore in quel punto della storia
  t.liv = t.boss ? [Math.min(30, bb + 1), Math.min(30, bb + 2)] : [Math.max(1, bb), Math.min(30, bb + 2)];
}));
if (typeof module !== "undefined") module.exports = { STORIA, scrigniCapitolo };
