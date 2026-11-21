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
const TURNO_SIRENE = 30; // da questo turno le cure si dimezzano e chi è in campo perde PV ogni turno

const _carte = (typeof module !== "undefined") ? require("./carte.js") : null;
const _PER_ID = _carte ? _carte.PER_ID : PER_ID;
const _STILI = _carte ? _carte.STILI : STILI;
const _stat = _carte ? _carte.statistiche : statistiche;

function multStile(sa, sd) {
  if (_STILI[sa].batte === sd) return 1.3;
  if (_STILI[sd].batte === sa) return 0.8;
  return 1;
}

function nuovoCombattente(id, liv, lode) {
  const c = _PER_ID[id], s = _stat(c, liv, lode);
  return { id, c, liv, lode: !!lode, f: s.f, pv: s.pv, pvMax: s.pv, att: s.attBase, dif: s.dif, vel: s.vel,
    buff: {}, stati: {}, scudo: 0, nebbia: false, stordito: false, carica: false, koAnnunciato: false };
}

class Battaglia {
  // squadre: array di {id, liv}
  constructor(sqG, sqC, nomeG = "Tu", nomeC = "Avversario", rng = Math.random) {
    this.rng = rng;
    this.lati = [
      { nome: nomeG, squadra: sqG.map(x => nuovoCombattente(x.id, x.liv, x.lode)), attivo: 0, energia: ENERGIA_INIZIALE },
      { nome: nomeC, squadra: sqC.map(x => nuovoCombattente(x.id, x.liv, x.lode)), attivo: 0, energia: ENERGIA_INIZIALE },
    ];
    this.turno = 1;
    this.vincitore = -1;
    this.ev = [];
  }

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
    let a = x.att;
    if (x.buff.att) a *= 1 + x.buff.att.val / 100;
    if (x.buff.debole) a *= 1 - x.buff.debole.val / 100;
    if (this.lati[l].squadra.some(y => y.pv > 0 && y.c.ruolo === "capo")) a *= 1.1;
    if (x.c.ruolo === "picchiatore") a *= 1 + 0.5 * (1 - x.pv / x.pvMax);
    return a;
  }

  // casuale=false → stima deterministica (usata dal computer per decidere)
  calcolaDanno(l, a, d, m, casuale = true) {
    const att = this.attaccoEffettivo(l, a);
    const dif = d.dif * (1 - (m.penetra || 0) / 100);
    const rapporto = (att + SMUSSO) / (dif + SMUSSO);
    const stile = multStile(a.c.stile, d.c.stile);
    let varia = 1, crit = false;
    if (casuale) {
      varia = a.c.ruolo === "imprevedibile" ? 0.6 + this.rng() * 0.9 : 0.9 + this.rng() * 0.2;
      crit = this.rng() < (a.c.ruolo === "assassino" ? 0.2 : PROB_CRITICO);
    }
    let dmg = m.pot * rapporto * stile * varia * (crit ? 1.5 : 1) * K_DANNO * (a.f || 1);
    if (a.c.ruolo === "tiratore" && m.costo >= 2) dmg *= 1.1;
    if (d.c.ruolo === "tank") dmg *= 0.9;
    if (d.carica) dmg *= 0.7;
    return { danno: Math.max(1, Math.round(dmg)), crit, stile };
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
    const chiMuove = [0, 1].filter(l => az[l].tipo === "mossa");
    chiMuove.sort((x, y) => (this.attivo(y).vel - this.attivo(x).vel) || (this.rng() - 0.5));
    for (const l of chiMuove) {
      if (this.vincitore >= 0) break;
      const a = this.attivo(l);
      if (a.pv <= 0) continue;
      if (a.stordito) { a.stordito = false; this._log(`${a.c.nome} è stordito e salta il turno.`, { lato: l }); continue; }
      const m = a.c.mosse[az[l].i];
      if (this.lati[l].energia < m.costo) { this._log(`${a.c.nome} non ha abbastanza energia.`, { lato: l }); continue; }
      this._usaMossa(l, m);
      this._controllaKO();
    }
    if (this.vincitore < 0) this._fineTurno();
    return this.ev;
  }

  _cambia(l, i) {
    const L = this.lati[l], fuori = this.attivo(l);
    if (i === L.attivo || !L.squadra[i] || L.squadra[i].pv <= 0) return;
    fuori.stordito = false; fuori.carica = false; fuori.nebbia = false;
    L.attivo = i;
    const dentro = this.attivo(l);
    this._log(`${L.nome} manda in campo ${dentro.c.nome}.`, { lato: l, entra: l });
    if (dentro.c.ruolo === "difensore") { dentro.scudo = Math.max(dentro.scudo, 30); this._log(`${dentro.c.nome} alza la guardia: scudo 30%.`, { lato: l, anim: "scudo", su: l }); }
  }

  // Sostituzione dopo un KO (non consuma il turno)
  sostituisci(l, i) { this.ev = []; this._cambia(l, i); return this.ev; }

  _usaMossa(l, m) {
    const L = this.lati[l], O = this.lati[1 - l], a = this.attivo(l), d = this.attivo(1 - l);
    L.energia -= m.costo;
    this._log(`${a.c.nome} usa ${m.nome}!`, { lato: l, anim: "attacco", id: a.id, mossa: a.c.mosse.indexOf(m), nome: m.nome, costo: m.costo, stile: a.c.stile, pot: m.pot, colpi: m.colpi || 1, eff: (m.eff || {}).tipo || "" });
    const e = m.eff || {};
    const SUL_BERSAGLIO = ["brucia", "stordisci", "indebolisci", "ruba"];
    const mira = m.pot > 0 || SUL_BERSAGLIO.includes(e.tipo);
    let colpito = false, totale = 0;
    if (mira) {
      if (d.nebbia) { d.nebbia = false; this._log(`${d.c.nome} sparisce: il colpo va a vuoto.`, { lato: 1 - l, anim: "schiva", bersaglio: 1 - l }); }
      else if (d.c.ruolo === "schivatore" && this.rng() < 0.15) { this._log(`${d.c.nome} schiva!`, { lato: 1 - l, anim: "schiva", bersaglio: 1 - l }); }
      else colpito = true;
    }
    if (colpito && m.pot > 0) {
      const n = m.colpi || 1;
      for (let k = 0; k < n && d.pv > 0; k++) {
        const r = this.calcolaDanno(l, a, d, m, true);
        let dmg = r.danno;
        if (d.scudo) { dmg = Math.max(1, Math.round(dmg * (1 - d.scudo / 100))); d.scudo = 0; }
        d.pv = Math.max(0, d.pv - dmg);
        totale += dmg;
        const nota = r.stile > 1 ? " Super efficace!" : r.stile < 1 ? " Poco efficace." : "";
        this._log(`${r.crit ? "Critico! " : ""}${d.c.nome} perde ${dmg} PV.${nota}`, { lato: l, colpo: 1 - l, danno: dmg, crit: r.crit, stile: a.c.stile, efficace: r.stile });
      }
      if (m.drena && totale > 0) this._cura(l, a, Math.round(totale * m.drena / 100));
      if (a.c.ruolo === "ladro" && O.energia > 0 && this.rng() < 0.2) {
        O.energia--; L.energia = Math.min(ENERGIA_MAX, L.energia + 1);
        this._log(`${a.c.nome} ruba 1 energia.`, { lato: l });
      }
    }
    if (!e.tipo) return;
    if (SUL_BERSAGLIO.includes(e.tipo)) { if (colpito && d.pv > 0) this._effettoBersaglio(l, a, d, e); }
    else this._effettoSe(l, a, e);
  }

  _effettoBersaglio(l, a, d, e) {
    const L = this.lati[l], O = this.lati[1 - l];
    if (e.tipo === "brucia") {
      if (d.c.ruolo === "incendiario") { this._log(`${d.c.nome} non brucia.`, { lato: 1 - l }); return; }
      const turni = e.turni + (a.c.ruolo === "incendiario" ? 1 : 0);
      d.stati.brucia = { val: e.val, turni };
      this._log(`${d.c.nome} brucia per ${turni} turni.`, { lato: l, anim: "brucia", su: 1 - l });
    } else if (e.tipo === "stordisci") {
      if (this.rng() < e.val / 100) { d.stordito = true; this._log(`${d.c.nome} è stordito!`, { lato: l, anim: "stordito", su: 1 - l }); }
      else this._log(`${d.c.nome} resiste allo stordimento.`, { lato: 1 - l });
    } else if (e.tipo === "indebolisci") {
      const turni = e.turni + (a.c.ruolo === "stregone" ? 1 : 0);
      d.buff.debole = { val: e.val, turni };
      this._log(`Attacco di ${d.c.nome} −${e.val}% per ${turni} turni.`, { lato: l, anim: "debole", su: 1 - l });
    } else if (e.tipo === "ruba") {
      const n = Math.min(e.val, O.energia);
      O.energia -= n; L.energia = Math.min(ENERGIA_MAX, L.energia + n);
      if (n) this._log(`${a.c.nome} ruba ${n} energia.`, { lato: l });
    }
  }

  _effettoSe(l, a, e) {
    const L = this.lati[l];
    if (e.tipo === "potenzia") { a.buff.att = { val: e.val, turni: e.turni }; this._log(`Attacco di ${a.c.nome} +${e.val}% per ${e.turni} turni.`, { lato: l, anim: "potenzia", su: l }); }
    else if (e.tipo === "scudo") { a.scudo = e.val; this._log(`${a.c.nome} si protegge: il prossimo colpo fa il ${e.val}% di danni in meno.`, { lato: l, anim: "scudo", su: l }); }
    else if (e.tipo === "nebbia") {
      if (a.ultimaNebbia === this.turno - 1) { this._log(`${a.c.nome} prova a sparire di nuovo, ma non ci riesce.`, { lato: l }); }
      else { a.nebbia = true; this._log(`${a.c.nome} sparisce: il prossimo attacco nemico andrà a vuoto.`, { lato: l, anim: "nebbia", su: l }); }
      a.ultimaNebbia = this.turno;
    }
    else if (e.tipo === "cura") this._cura(l, a, Math.round(a.pvMax * e.val / 100));
    else if (e.tipo === "energia") { L.energia = Math.min(ENERGIA_MAX, L.energia + e.val); this._log(`${L.nome} guadagna ${e.val} energia.`, { lato: l, anim: "energia", su: l }); }
  }

  _cura(l, x, n) {
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
    for (const l of [0, 1]) {
      const L = this.lati[l], a = this.attivo(l);
      if (a.pv > 0) {
        const b = a.stati.brucia;
        if (b) {
          const dmg = Math.max(1, Math.round(a.pvMax * b.val / 100));
          a.pv = Math.max(0, a.pv - dmg);
          this._log(`${a.c.nome} brucia: −${dmg} PV.`, { lato: l, colpo: l, danno: dmg, stile: "FOR", brucia: true });
          if (--b.turni <= 0) delete a.stati.brucia;
        }
        if (a.pv > 0 && a.c.ruolo === "guaritore") {
          this._cura(l, a, Math.round(a.pvMax * 0.05));
          for (const x of L.squadra) if (x !== a && x.pv > 0 && x.pv < x.pvMax) x.pv = Math.min(x.pvMax, x.pv + Math.round(x.pvMax * (this.turno >= TURNO_SIRENE ? 0.01 : 0.02)));
        }
        if (a.pv > 0 && this.turno >= TURNO_SIRENE) {
          const pct = 4 + 2 * (this.turno - TURNO_SIRENE);
          const dmg = Math.max(1, Math.round(a.pvMax * pct / 100));
          a.pv = Math.max(0, a.pv - dmg);
          this._log(`Sirene in arrivo: ${a.c.nome} perde ${dmg} PV.`, { lato: l, colpo: l, danno: dmg });
        }
      }
      for (const x of L.squadra) {
        for (const k of Object.keys(x.buff)) if (--x.buff[k].turni <= 0) delete x.buff[k];
        x.carica = false;
      }
      const extra = (a.pv > 0 && a.c.ruolo === "stratega") ? 1 : 0;
      L.energia = Math.min(ENERGIA_MAX, L.energia + ENERGIA_TURNO + extra);
    }
    this._controllaKO();
    this.turno++;
    if (this.vincitore < 0) {
      this._log(`— Turno ${this.turno} —`, { separatore: true });
      if (this.turno === TURNO_SIRENE) this._log("Arrivano le sirene! Da ora le cure valgono la metà e ogni turno si perdono PV.", { avviso: true });
    }
  }

  // ---------------- Intelligenza del computer ----------------
  // abilita: 0..1 (quanto spesso sceglie la mossa migliore invece di una a caso)
  scegliAzione(l, abilita) {
    const L = this.lati[l], a = this.attivo(l), d = this.attivo(1 - l);
    const usabili = a.c.mosse.map((m, i) => i).filter(i => L.energia >= a.c.mosse[i].costo);
    if (this.rng() > abilita) {
      if (this.rng() < 0.15) return { tipo: "carica" };
      return { tipo: "mossa", i: usabili[Math.floor(this.rng() * usabili.length)] };
    }
    // Cambio se è in svantaggio di stile e messo male
    if (a.pv / a.pvMax < 0.35 && multStile(d.c.stile, a.c.stile) > 1 && this.rng() < abilita * 0.5) {
      const i = L.squadra.findIndex((x, k) => k !== L.attivo && x.pv > 0 && multStile(d.c.stile, x.c.stile) <= 1);
      if (i >= 0) return { tipo: "cambio", i };
    }
    let meglio = usabili[0], punti = -1;
    for (const i of usabili) {
      const p = this._valuta(l, a, d, a.c.mosse[i]);
      if (p > punti) { punti = p; meglio = i; }
    }
    // Se ha solo la mossa base e poca energia, a volte carica per la mossa finale
    if (a.c.mosse[meglio].costo === 0 && L.energia < 5 && L.energia >= 3 && this.rng() < 0.3) return { tipo: "carica" };
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
      if (e.tipo === "stordisci") p += d.stordito ? 0 : 20 * e.val / 100;
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

if (typeof module !== "undefined") module.exports = { Battaglia, multStile, ENERGIA_MAX };
