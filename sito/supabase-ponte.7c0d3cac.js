// ============================================================
//  PONTE VERSO SUPABASE
//  Il gioco parla con il database come faceva su Claude (doc(...).get/set/onSnapshot).
//  Questo file traduce quelle chiamate in tabelle Supabase:
//    data/users/<id>/<slot>  →  salvataggi (user_id, slot, dati)
//    classifica/<id>         →  classifica (user_id, punti, dati)
//    config/<id>             →  config (id, dati)
//  Accesso: nickname + password. Supabase vuole un'email, quindi il nickname diventa
//  "<nickname>@giocatori.noiverso.app" (nessuna email viene mai inviata).
//  Il dispositivo resta collegato: la sessione è salvata e rinnovata da sola.
// ============================================================
(function () {
  const C = window.NOIVERSO_CONFIG || {};
  if (!C.supabaseUrl || !C.supabaseKey || !window.supabase) return;

  const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: "noiverso-sessione" },
  });
  const DOMINIO = "giocatori.noiverso.app";
  const pulisciNick = n => String(n || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9_.-]/g, "");
  const errore = (codice, messaggio) => Object.assign(new Error(messaggio || codice), { code: codice });

  // ---------------- Accesso ----------------
  const Accesso = {
    sb,
    pulisciNick,
    async sessione() {
      const { data } = await sb.auth.getSession(); if (!data.session) return null;
      // la sessione salvata sul dispositivo potrebbe essere di un account cancellato: lo chiedo al server.
      // Se il server dice che l'account non c'è più (o la sessione non vale), esco; se manca solo la rete, resto dentro.
      try {
        const { data: u, error } = await sb.auth.getUser();
        if (error && (error.status === 401 || error.status === 403 || error.status === 404 || /not.?found|does not exist|invalid|expired/i.test(error.message || "")) && !/fetch|network/i.test(error.message || "")) { await sb.auth.signOut({ scope: "local" }); return null; }
        if (!error && !(u && u.user)) { await sb.auth.signOut({ scope: "local" }); return null; }
      } catch (e) { /* senza rete: tengo la sessione */ }
      return (await sb.auth.getSession()).data.session;
    },
    async entra(nick, password) {
      const n = pulisciNick(nick);
      const { error } = await sb.auth.signInWithPassword({ email: `${n}@${DOMINIO}`, password });
      if (error) throw errore(/invalid/i.test(error.message) ? "credenziali" : "rete", error.message);
    },
    async registra(nick, password) {
      const n = pulisciNick(nick);
      if (n.length < 3 || n.length > 20) throw errore("nick", "Il nickname deve avere da 3 a 20 caratteri (lettere, numeri, _ . -).");
      if (String(password).length < 6) throw errore("password", "La password deve avere almeno 6 caratteri.");
      try { const { data } = await sb.rpc("nickname_libero", { n }); if (data === false) throw errore("preso", "Questo nickname è già preso."); } catch (e) { if (e.code === "preso") throw e; }
      const { data, error } = await sb.auth.signUp({ email: `${n}@${DOMINIO}`, password, options: { data: { nickname: String(nick).trim() } } });
      if (error) throw errore(/registered|exists/i.test(error.message) ? "preso" : "rete", /registered|exists/i.test(error.message) ? "Questo nickname è già preso." : error.message);
      if (!data.session) throw errore("conferma", "Su Supabase va disattivata la conferma via email (Authentication → Providers → Email → Confirm email).");
      try { await sb.from("nickname").insert({ nick: n, user_id: data.user.id }); } catch (e) { /* solo un aiuto per i duplicati */ }
    },
    async esci() { await sb.auth.signOut(); },
    async nickname() { const { data } = await sb.auth.getUser(); const u = data.user; return u ? ((u.user_metadata && u.user_metadata.nickname) || u.email.split("@")[0]) : ""; },
  };
  window.NoiversoAccesso = Accesso;

  // ---------------- Documenti ----------------
  function mappa(path) {
    const p = path.split("/");
    if (p[0] === "data" && p[1] === "users") return { tabella: "salvataggi", chiave: { user_id: p[2], slot: p[3] }, id: p[3] };
    if (p[0] === "classifica") return { tabella: "classifica", chiave: { user_id: p[1] }, id: p[1] };
    if (p[0] === "config") return { tabella: "config", chiave: { id: p[1] }, id: p[1] };
    throw errore("invalid_argument", "Percorso sconosciuto: " + path);
  }
  const istantanea = (id, dati) => ({ id, exists: dati != null, data: () => (dati == null ? undefined : JSON.parse(JSON.stringify(dati))), metadata: { fromCache: false, hasPendingWrites: false } });
  const filtro = (q, chiave) => { for (const [k, v] of Object.entries(chiave)) q = q.eq(k, v); return q; };
  const traduciErrore = e => {
    const m = (e && (e.message || e.code)) || "";
    if (/row-level security|permission|42501/i.test(m)) return errore("invalid_argument", m);
    if (/fetch|network|Failed/i.test(m)) return errore("unavailable", m);
    return errore("sconosciuto", m);
  };
  let canali = 0;

  function doc(path) {
    const { tabella, chiave, id } = mappa(path);
    const leggi = async () => {
      const { data, error } = await filtro(sb.from(tabella).select("dati"), chiave).maybeSingle();
      if (error) throw traduciErrore(error);
      return istantanea(id, data ? data.dati : null);
    };
    return {
      id, path,
      get: leggi,
      async set(dati) {
        const riga = { ...chiave, dati, aggiornato: new Date().toISOString() };
        if (tabella === "classifica") riga.punti = Math.round(Number(dati && dati.punti) || 0);
        const { error } = await sb.from(tabella).upsert(riga);
        if (error) throw traduciErrore(error);
      },
      onSnapshot(cb, err) {
        let vivo = true;
        leggi().then(s => vivo && cb(s), e => vivo && err && err(e));
        const nome = `doc-${tabella}-${++canali}`;
        const fil = tabella === "config" ? `id=eq.${chiave.id}` : `user_id=eq.${chiave.user_id}`;
        const canale = sb.channel(nome).on("postgres_changes", { event: "*", schema: "public", table: tabella, filter: fil }, pl => {
          if (!vivo) return;
          const riga = pl.new && Object.keys(pl.new).length ? pl.new : null;
          if (tabella === "salvataggi" && riga && riga.slot !== chiave.slot) return;
          cb(istantanea(id, riga ? riga.dati : null));
        }).subscribe();
        return () => { vivo = false; try { sb.removeChannel(canale); } catch (e) {} };
      },
    };
  }

  function collezione(nome) {
    let ordine = null, limite = 1000;
    const q = {
      orderBy(campo, verso) { ordine = { campo, asc: verso !== "desc" }; return q; },
      limit(n) { limite = n; return q; },
      where() { return q; },
      async get() {
        if (nome !== "classifica") throw errore("invalid_argument", "Collezione non gestita: " + nome);
        let r = sb.from("classifica").select("user_id, dati");
        if (ordine) r = r.order(ordine.campo === "punti" ? "punti" : ordine.campo, { ascending: ordine.asc });
        const { data, error } = await r.limit(limite);
        if (error) throw traduciErrore(error);
        const docs = (data || []).map(x => ({ id: x.user_id, data: () => x.dati }));
        return { docs, size: docs.length, empty: !docs.length };
      },
      onSnapshot(cb, err) {
        let vivo = true, attesa = null;
        const aggiorna = () => q.get().then(s => vivo && cb(s), e => vivo && err && err(e));
        aggiorna();
        const canale = sb.channel(`coll-${nome}-${++canali}`).on("postgres_changes", { event: "*", schema: "public", table: nome }, () => {
          clearTimeout(attesa); attesa = setTimeout(aggiorna, 400);
        }).subscribe();
        return () => { vivo = false; try { sb.removeChannel(canale); } catch (e) {} };
      },
      doc: id => doc(`${nome}/${id}`),
    };
    return q;
  }

  const db = { doc, collection: collezione };
  const user = {
    async id() { const s = await Accesso.sessione(); return s ? s.user.id : null; },
    async me() { return { name: await Accesso.nickname() }; },
    async isOwner() { try { const { data } = await sb.rpc("sono_admin"); return !!data; } catch (e) { return false; } },
  };

  window.claude = { use: async nome => (nome === "db" ? db : nome === "user" ? user : null) };
  window.NOIVERSO_SUPABASE = true;
})();
