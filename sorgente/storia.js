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
        parla: "lollinista", frase: "Il teatro è pieno e il pianoforte è pronto. L'ultima nota la suono io.", vittoria: "Applausi in piedi: la città intera ha visto la tua vittoria. Ora resta un'ultima porta, quella che porta da Los Nueve." }
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
  const max = Math.max(0, ...Object.values(perSerie)), meno = max >= 5 ? 3 : max >= 3 ? 1 : 0;
  const bb = Math.max(1, b - meno);
  t.liv = t.boss ? [Math.min(30, bb + 1), Math.min(30, bb + 2)] : [Math.max(1, bb), Math.min(30, bb + 2)];
}));
if (typeof module !== "undefined") module.exports = { STORIA, scrigniCapitolo };
