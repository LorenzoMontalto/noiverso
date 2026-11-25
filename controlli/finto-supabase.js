// Supabase finto per i test: stessi metodi usati dal ponte, dati salvati in localStorage ("il server").
(function () {
  const SERVER = "finto-server", SESSIONE = "noiverso-sessione";
  const SS = localStorage.getItem("finto-sessione-scheda") ? sessionStorage : localStorage;
  const leggi = () => { try { return JSON.parse(localStorage.getItem(SERVER)) || { utenti: {}, tabelle: { salvataggi: [], classifica: [], config: [], amministratori: [], nickname: [], codici: [], codici_usati: [], sfide_amici: [], boss_danni: [] } }; } catch (e) { return null; } };
  const scrivi = s => localStorage.setItem(SERVER, JSON.stringify(s));
  if (!localStorage.getItem(SERVER)) scrivi(leggi());
  const ascolta = [];
  const chiavi = { salvataggi: ["user_id", "slot"], classifica: ["user_id"], config: ["id"], amministratori: ["user_id"], nickname: ["nick"], codici: ["codice"], codici_usati: ["user_id", "codice"] };
  const attesa = () => new Promise(r => setTimeout(r, 15));
  window.__fintoSB = { leggi, scrivi };

  function query(tab) {
    const f = []; let ord = null, lim = 1e9;
    const esegui = async (singola) => {
      await attesa();
      const s = leggi(); s.tabelle[tab] = s.tabelle[tab] || []; let righe = s.tabelle[tab].filter(r => f.every(([k, v, op]) => op === 'gte' ? String(r[k]) >= String(v) : op === 'in' ? v.map(String).includes(String(r[k])) : String(r[k]) === String(v)));
      if (ord) righe.sort((a, b) => (a[ord.c] - b[ord.c]) * (ord.asc ? 1 : -1));
      righe = righe.slice(0, lim);
      if (tab === "salvataggi" && righe.some(r => r.user_id !== uid())) return { data: null, error: { message: "row-level security" } };
      return { data: singola ? (righe[0] || null) : righe, error: null };
    };
    const q = {
      select() { return q; }, eq(k, v) { f.push([k, v]); return q; }, gte(k, v) { f.push([k, v, 'gte']); return q; }, in(k, v) { f.push([k, v, 'in']); return q; },
      order(c, o) { ord = { c, asc: !o || o.ascending !== false }; return q; },
      async delete() { return { eq: async (k, v) => { const s = leggi(); s.tabelle[tab] = (s.tabelle[tab] || []).filter(r => String(r[k]) !== String(v)); scrivi(s); return { error: null }; } }; }, limit(n) { lim = n; return q; },
      maybeSingle: () => esegui(true), then: (ok, ko) => esegui(false).then(ok, ko),
      async upsert(riga) {
        await attesa();
        if ((tab === "salvataggi" || tab === "classifica") && riga.user_id !== uid()) return { error: { message: "new row violates row-level security policy" } };
        const s = leggi(), k = chiavi[tab]; s.tabelle[tab] = s.tabelle[tab] || []; const i = s.tabelle[tab].findIndex(r => k.every(c => r[c] === riga[c]));
        if (i >= 0) s.tabelle[tab][i] = { ...s.tabelle[tab][i], ...riga }; else s.tabelle[tab].push(riga);
        scrivi(s);
        ascolta.filter(a => a.tab === tab).forEach(a => setTimeout(() => a.cb({ new: riga }), 30));
        return { error: null };
      },
      async insert(riga) { return q.upsert(riga); },
    };
    return q;
  }
  const uid = () => { try { const s = JSON.parse(SS.getItem(SESSIONE)); return s && s.user.id; } catch (e) { return null; } };
  window.supabase = {
    createClient() {
      return {
        auth: {
          async getSession() { await attesa(); const s = SS.getItem(SESSIONE); return { data: { session: s ? JSON.parse(s) : null } }; },
          async getUser() { const s = SS.getItem(SESSIONE); return { data: { user: s ? JSON.parse(s).user : null } }; },
          async signUp({ email, password, options }) {
            await attesa(); const s = leggi();
            if (s.utenti[email]) return { data: {}, error: { message: "User already registered" } };
            const user = { id: "u-" + Math.random().toString(36).slice(2, 10), email, user_metadata: (options && options.data) || {} };
            s.utenti[email] = { password, user }; scrivi(s);
            const sess = { user, access_token: "x" }; SS.setItem(SESSIONE, JSON.stringify(sess));
            return { data: { user, session: sess }, error: null };
          },
          async signInWithPassword({ email, password }) {
            await attesa(); const u = leggi().utenti[email];
            if (!u || u.password !== password) return { data: {}, error: { message: "Invalid login credentials" } };
            SS.setItem(SESSIONE, JSON.stringify({ user: u.user, access_token: "x" })); return { data: {}, error: null };
          },
          async signOut() { SS.removeItem(SESSIONE); return { error: null }; },
        },
        from: query,
        storage: { from(b) { return {
          async list() { await attesa(); const s = leggi(); return { data: (s.bucket || []).map(name => ({ name })), error: null }; },
          async upload(nome, file, opz) { await attesa(); const s = leggi(); if (!s.tabelle.amministratori.some(a => a.user_id === uid())) return { error: { message: "new row violates row-level security policy" } };
            s.bucket = [...new Set([...(s.bucket || []), nome])]; scrivi(s); window.__caricati = (window.__caricati || 0) + 1; window.__ultimoTipo = file.type + " " + file.size; return { data: { path: nome }, error: null }; },
          async createSignedUrls(nomi, durata) { await attesa(); if (!uid()) return { data: null, error: { message: "not logged" } }; const s = leggi();
            return { data: nomi.map(n => (s.bucket || []).includes(n) ? { path: n, signedUrl: "https://finto-storage.test/carte/" + n + "?token=abc", error: null } : { path: n, signedUrl: null, error: "Object not found" }), error: null }; },
        }; } },
        async rpc(nome, args) {
          await attesa(); const s = leggi();
          if (nome === "sono_admin") return { data: s.tabelle.amministratori.some(a => a.user_id === uid()) };
          if (nome === "nickname_libero") return { data: !s.tabelle.nickname.some(n => n.nick === String(args.n).toLowerCase()) };
          const me = uid(), T = s.tabelle; T.sfide_amici = T.sfide_amici || []; T.boss_danni = T.boss_danni || [];
          const salv = id => T.salvataggi.find(r => r.user_id === id && r.slot === "partita");
          if (nome === "squadra_amico") { const d = (salv(args.amico) || {}).dati; if (!d) return { data: null, error: { message: "Questo giocatore non ha ancora un salvataggio" } };
            const sq = (d.squadre || [])[d.attiva || 0] || { carte: [] };
            return { data: { nome: (d.profilo || {}).nome || "Giocatore", avatar: (d.profilo || {}).avatar || "", squadra: sq.carte.map(id => ({ id, liv: Math.min(30, (d.liv || {})[id] || 1), lode: false, olo: !!(d.olo || {})[id], ultra: !!(d.ultra || {})[id] })),
              graffito: (() => { const g = sq.graffito || d.graffito; return g && (d.graffiti || {})[g] > 0 ? { id: g, liv: Math.min(5, d.graffiti[g]) } : null; })() }, error: null }; }
          if (nome === "registra_sfida") { const oggi = T.sfide_amici.filter(r => r.sfidante === me && r.sfidato === args.amico).length;
            if (oggi >= 3) return { data: null, error: { message: "Oggi hai già sfidato questo amico 3 volte: riprova domani" } };
            T.sfide_amici.push({ sfidante: me, sfidato: args.amico, vinto: args.vinto, visto: false, quando: new Date().toISOString() }); scrivi(s); return { data: { oggi_coppia: oggi + 1 }, error: null }; }
          if (nome === "segna_sfide_viste") { T.sfide_amici.forEach(r => { if (r.sfidato === me) r.visto = true; }); scrivi(s); return { data: null, error: null }; }
          const bossStato = () => { const pv = s.bossPv || 40000, tot = T.boss_danni.reduce((a, r) => a + r.danni, 0), mio = T.boss_danni.find(r => r.user_id === me);
            return { settimana: "2026-W47", pv_max: pv, danni: tot, fine: new Date(Date.now() + 2 * 864e5).toISOString(), colpi_oggi: mio ? mio.colpi : 0,
              classifica: T.boss_danni.filter(r => r.danni > 0).sort((a, b) => b.danni - a.danni).map(r => ({ id: r.user_id, danni: r.danni, nome: r.nome || "Giocatore", avatar: "" })),
              da_riscuotere: tot >= pv && mio && !mio.riscosso ? ["2026-W47"] : [] }; };
          if (nome === "boss_attuale") return { data: bossStato(), error: null };
          if (nome === "colpisci_boss") { let mio = T.boss_danni.find(r => r.user_id === me); if (!mio) { mio = { user_id: me, danni: 0, colpi: 0, nome: "Io" }; T.boss_danni.push(mio); }
            if (mio.colpi >= 3) return { data: null, error: { message: "Oggi hai già attaccato il boss 3 volte: torna domani" } };
            const prima = bossStato().danni, d = Math.min(6000, args.danni); mio.danni += d; mio.colpi++; scrivi(s);
            const st = bossStato(); return { data: { ...st, registrati: d, sconfitto_ora: prima < st.pv_max && st.danni >= st.pv_max }, error: null }; }
          if (nome === "riscatta_boss") { const mio = T.boss_danni.find(r => r.user_id === me); if (!mio || mio.riscosso) return { data: null, error: { message: "Premio già riscosso" } };
            mio.riscosso = true; scrivi(s); return { data: { posizione: 1, partecipanti: T.boss_danni.length, danni: mio.danni }, error: null }; }
          T.scambi = T.scambi || [];
          const costo = c => POT_DOPPIONE[PER_ID[c].rarita], dati = u => ((salv(u) || {}).dati || {});
          const potL = (u, c, tr) => ((dati(u).pot || {})[c] || 0) - costo(c) * T.scambi.filter(x => x.id !== tr && x.da === u && x.offro === c && (x.stato === "aperto" || (x.stato === "accettato" && !x.ritirato))).length;
          const ha = (u, c) => ((dati(u).carte || {})[c] || 0) > 0;
          const no = m => ({ data: null, error: { message: m } });
          if (nome === "doppioni_amico") return { data: Object.keys(dati(args.amico).carte || {}).filter(c => PER_ID[c] && ha(args.amico, c) && potL(args.amico, c) >= costo(c)), error: null };
          if (nome === "proponi_scambio") {
            if (PER_ID[args.offro].rarita !== PER_ID[args.chiedo].rarita) return no("Si scambia solo tra carte della stessa rarità");
            if (potL(me, args.offro) < costo(args.offro)) return no("Per offrire questa carta servono " + costo(args.offro) + " potenziatori suoi");
            if (ha(me, args.chiedo)) return no("Questa carta ce l'hai già");
            if (!ha(args.amico, args.chiedo) || potL(args.amico, args.chiedo) < costo(args.chiedo)) return no("Il tuo amico non ha abbastanza potenziatori di questa carta per scambiarla");
            if (ha(args.amico, args.offro)) return no("Il tuo amico ha già la carta che offri");
            const id = T.scambi.length + 1; T.scambi.push({ id, da: me, a: args.amico, offro: args.offro, chiedo: args.chiedo, stato: "aperto", ritirato: false, creato: new Date().toISOString() }); scrivi(s); return { data: { id, costo: costo(args.offro) }, error: null }; }
          if (nome === "rispondi_scambio") { const x = T.scambi.find(y => y.id === args.scambio && y.a === me && y.stato === "aperto"); if (!x) return no("Scambio non trovato");
            if (args.accetto && ha(me, x.offro)) return no("La carta che ti offre ce l'hai già: puoi solo rifiutare");
            if (args.accetto && potL(me, x.chiedo, x.id) < costo(x.chiedo)) return no("Non hai più i potenziatori");
            x.stato = args.accetto ? "accettato" : "rifiutato"; scrivi(s); return { data: args.accetto ? { stato: "accettato", dai: x.chiedo, ricevi: x.offro, costo: costo(x.chiedo) } : { stato: "rifiutato" }, error: null }; }
          if (nome === "annulla_scambio") { const x = T.scambi.find(y => y.id === args.scambio && y.da === me && y.stato === "aperto"); if (x) x.stato = "annullato"; scrivi(s); return { data: null, error: null }; }
          if (nome === "ritira_scambi") { const r = T.scambi.filter(y => y.da === me && y.stato === "accettato" && !y.ritirato); r.forEach(y => { y.ritirato = true; }); scrivi(s); return { data: r.map(y => ({ id: y.id, dai: y.offro, ricevi: y.chiedo, costo: costo(y.offro) })), error: null }; }
          if (nome === "azzera_classifica") { s.configClassifica = { dal: new Date().toISOString(), storico: [] }; scrivi(s); return { data: {}, error: null }; }
          if (nome === "segnalazioni") return { data: s.segnalazioni || [], error: null };
          if (nome === "annulla_sfide_di") { const n = T.sfide_amici.filter(x => x.sfidante === args.u).length; T.sfide_amici = T.sfide_amici.filter(x => x.sfidante !== args.u); s.segnalazioni = (s.segnalazioni || []).filter(x => x.user_id !== args.u); scrivi(s); return { data: n, error: null }; }
          if (nome === "azzera_boss_di") return { data: null, error: null };
          if (nome === "riscatta_codice") {
            const c = String(args.c || "").replace(/\s/g, "").toUpperCase(), k = (s.tabelle.codici || []).find(x => x.codice === c && x.attivo !== false);
            if (!k) return { data: null, error: { message: "Codice non valido" } };
            const admin = s.tabelle.amministratori.some(a => a.user_id === uid());
            if (args.prova && admin) return { data: { ...k.premio, codice: c, prova: true }, error: null };
            s.tabelle.codici_usati = s.tabelle.codici_usati || [];
            if (s.tabelle.codici_usati.some(u => u.user_id === uid() && u.codice === c)) {
              if (k.premio.ripetibile) { const p = { ...k.premio }; delete p.monete; delete p.bustine; return { data: { ...p, codice: c, gia: true }, error: null }; }
              return { data: null, error: { message: "Hai già usato questo codice" } };
            }
            s.tabelle.codici_usati.push({ user_id: uid(), codice: c }); scrivi(s);
            return { data: { ...k.premio, codice: c }, error: null };
          }
          if (nome === "chiudi_partita_vivo") { T.partite_vivo = T.partite_vivo || []; let p = T.partite_vivo.find(x => x.id === args.partita);
            if (!p) { p = { id: args.partita, a: args.sono_a ? me : args.avversario, b: args.sono_a ? args.avversario : me, stato: "attesa" }; T.partite_vivo.push(p); }
            const lato = args.sono_a ? "a" : "b"; if (p["detto_" + lato]) return { data: { stato: p.stato }, error: null };
            p["detto_" + lato] = true; p["vince_" + lato] = args.chi_vince; p["motivo_" + lato] = args.motivo;
            if (p.motivo_a === "contestata" || p.motivo_b === "contestata") p.stato = "contestata";
            else if (p.detto_a && p.detto_b) p.stato = p.vince_a && p.vince_a === p.vince_b ? "ok" : "contestata";
            else { const v = p.vince_a || p.vince_b; p.stato = !v ? "contestata" : v === args.avversario ? "ok" : args.motivo === "abbandono" ? "abbandono" : "attesa"; }
            p.vincitore = p.vince_a || p.vince_b; scrivi(s); return { data: { stato: p.stato }, error: null }; }
          return { data: null };
        },
        channel(nome, opz) {
          // tempo reale finto: presenza e messaggi tra schede della stessa finestra (BroadcastChannel)
          const key = opz && opz.config && opz.config.presence && opz.config.presence.key, self = !!(opz && opz.config && opz.config.broadcast && opz.config.broadcast.self);
          const c = { key, h: [], stato: {}, mio: null, attivo: false, cbSub: null,
            on(tipo, filtro, cb) { if (tipo === "postgres_changes") { c._a = { tab: filtro.table, cb }; ascolta.push(c._a); } else c.h.push({ tipo, ev: filtro.event, cb }); return c; },
            _fuoco(tipo, ev, arg) { c.h.filter(x => x.tipo === tipo && x.ev === ev).forEach(x => { try { x.cb(arg); } catch (e) { console.error(e); } }); },
            _posta(m) { if (!c.attivo || window.__rtStaccato) return; if (window.__rtPerdita && m.t === "b" && Math.random() < window.__rtPerdita) return; try { c.bc.postMessage(m); } catch (e) {} },
            subscribe(cb) {
              c.cbSub = cb;
              if (!c.bc) { c.bc = new BroadcastChannel("finto-rt-" + nome); c.bc.onmessage = ({ data: m }) => {
                if (!c.attivo || window.__rtStaccato) return;
                if (m.t === "b") c._fuoco("broadcast", m.event, { payload: m.payload });
                else if (m.t === "ciao") { if (c.mio) c._posta({ t: "pres", key, meta: c.mio }); }
                else if (m.t === "pres") { const nuovo = !c.stato[m.key]; c.stato[m.key] = [m.meta]; if (nuovo) c._fuoco("presence", "join", {}); c._fuoco("presence", "sync", {}); }
                else if (m.t === "bye") { if (c.stato[m.key]) { delete c.stato[m.key]; c._fuoco("presence", "leave", {}); c._fuoco("presence", "sync", {}); } }
              }; window.__rtCanali = (window.__rtCanali || []).concat(c); }
              c.attivo = true;
              setTimeout(() => { if (cb) cb("SUBSCRIBED"); c._posta({ t: "ciao" }); }, 20);
              return c;
            },
            async track(meta) { c.mio = meta; if (key) { c.stato[key] = [meta]; c._fuoco("presence", "sync", {}); } c._posta({ t: "pres", key, meta }); return "ok"; },
            async untrack() { c._posta({ t: "bye", key }); c.mio = null; },
            presenceState() { return JSON.parse(JSON.stringify(c.stato)); },
            async send(m) { c._posta({ t: "b", event: m.event, payload: m.payload }); if (self) c._fuoco("broadcast", m.event, { payload: m.payload }); return "ok"; },
          };
          return c;
        },
        removeChannel(c) { const i = ascolta.indexOf(c._a); if (i >= 0) ascolta.splice(i, 1); if (c.bc) { c._posta({ t: "bye", key: c.key }); c.mio = null; c.attivo = false; } },
      };
    },
  };
})();
