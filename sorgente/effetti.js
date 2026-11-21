// ============================================================
//  EFFETTI DELL'INTERFACCIA: particelle, monete che volano,
//  animazioni diverse per ogni tipo di bottone.
// ============================================================

const FX = (() => {
  const ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.className = "fx-tela";
  cv.setAttribute("aria-hidden", "true");
  const g = cv.getContext("2d");
  let parts = [], attivo = false;
  function misura() { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * d; cv.height = innerHeight * d; g.setTransform(d, 0, 0, d, 0, 0); }
  function monta() { if (!cv.isConnected) { document.body.appendChild(cv); misura(); addEventListener("resize", misura); } }

  function ciclo() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => {
      p.vita += 16;
      const t = p.vita / p.durata;
      if (t >= 1) return false;
      p.vx *= p.attrito; p.vy = p.vy * p.attrito + p.gravita;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      g.save();
      g.globalAlpha = 1 - t;
      g.translate(p.x, p.y); g.rotate(p.rot);
      if (p.forma === "anello") {
        g.strokeStyle = p.colore; g.lineWidth = 3 * (1 - t);
        g.beginPath(); g.arc(0, 0, p.r0 + t * p.r1, 0, Math.PI * 2); g.stroke();
      } else if (p.forma === "rombo") {
        g.fillStyle = p.colore; g.shadowColor = p.colore; g.shadowBlur = 10;
        g.beginPath(); g.moveTo(0, -p.d); g.lineTo(p.d * .6, 0); g.lineTo(0, p.d); g.lineTo(-p.d * .6, 0); g.closePath(); g.fill();
      } else if (p.forma === "coriandolo") {
        g.fillStyle = p.colore; g.fillRect(-p.d, -p.d * .4, p.d * 2, p.d * .8);
      } else if (p.forma === "stella") {
        g.fillStyle = p.colore; g.shadowColor = p.colore; g.shadowBlur = 12;
        g.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? p.d * .45 : p.d; const a = i / 10 * Math.PI * 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        g.closePath(); g.fill();
      } else {
        g.fillStyle = p.colore; g.shadowColor = p.colore; g.shadowBlur = 8;
        g.beginPath(); g.arc(0, 0, p.d, 0, Math.PI * 2); g.fill();
      }
      g.restore();
      return true;
    });
    if (parts.length) requestAnimationFrame(ciclo); else { attivo = false; g.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function avvia() { if (!attivo) { attivo = true; requestAnimationFrame(ciclo); } }

  function esplosione(x, y, opz = {}) {
    if (ridotto) return;
    monta();
    const n = opz.n || 24, colori = opz.colori || ["#ff2e46", "#f2c14e", "#ffffff"];
    for (let i = 0; i < n; i++) {
      const a = (opz.angolo ?? Math.random() * Math.PI * 2) + (opz.angolo !== undefined ? (Math.random() - .5) * (opz.apertura || 1) : 0);
      const v = (opz.velocita || 5) * (.4 + Math.random() * .8);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gravita: opz.gravita ?? .18, attrito: opz.attrito || .96,
        d: (opz.dimensione || 3) * (.6 + Math.random() * .8), colore: colori[i % colori.length], forma: opz.forma || "punto",
        rot: Math.random() * 6, vr: (Math.random() - .5) * .3, vita: 0, durata: opz.durata || 700 + Math.random() * 300 });
    }
    avvia();
  }
  function anello(x, y, colore = "#3fd8ff", r1 = 70) {
    if (ridotto) return;
    monta();
    parts.push({ x, y, vx: 0, vy: 0, gravita: 0, attrito: 1, forma: "anello", r0: 6, r1, colore, rot: 0, vr: 0, vita: 0, durata: 520 });
    avvia();
  }
  const centro = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  // Monete che volano da un elemento all'altro
  function volaMonete(da, a, n = 8) {
    if (ridotto || !da || !a) return Promise.resolve();
    const [x0, y0] = centro(da), [x1, y1] = centro(a);
    const promesse = [];
    for (let i = 0; i < n; i++) {
      const m = document.createElement("span");
      m.className = "moneta-volante";
      document.body.appendChild(m);
      const mx = (x0 + x1) / 2 + (Math.random() - .5) * 160, my = Math.min(y0, y1) - 60 - Math.random() * 80;
      const anim = m.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${mx}px, ${my}px) scale(1.1)`, opacity: 1, offset: .45 },
        { transform: `translate(${x1}px, ${y1}px) scale(.6)`, opacity: .9 },
      ], { duration: 650 + i * 60, easing: "cubic-bezier(.3,.1,.3,1)", delay: i * 45, fill: "forwards" });
      promesse.push(anim.finished.then(() => m.remove()).catch(() => m.remove()));
    }
    return Promise.all(promesse).then(() => { a.classList.remove("rimbalza"); void a.offsetWidth; a.classList.add("rimbalza"); });
  }

  // Un oggetto (es. bustina) che vola verso un bottone
  function volaIcona(da, a, classe) {
    if (ridotto || !da || !a) return Promise.resolve();
    const [x0, y0] = centro(da), [x1, y1] = centro(a);
    const el = document.createElement("span");
    el.className = "icona-volante " + classe;
    document.body.appendChild(el);
    return el.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(1) rotate(0)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 120}px) scale(1.3) rotate(-20deg)`, opacity: 1, offset: .5 },
      { transform: `translate(${x1}px, ${y1}px) scale(.3) rotate(10deg)`, opacity: .2 },
    ], { duration: 900, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).finished.then(() => { el.remove(); a.classList.remove("rimbalza"); void a.offsetWidth; a.classList.add("rimbalza"); });
  }

  // Contatore che scorre fino al nuovo valore
  function contatore(el, a) {
    const da = +el.dataset.valore || 0;
    el.dataset.valore = a;
    if (ridotto || da === a) { el.textContent = a; return; }
    const t0 = performance.now(), dur = Math.min(900, 300 + Math.abs(a - da) * 4);
    const passo = ora => {
      const t = Math.min(1, (ora - t0) / dur), k = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(da + (a - da) * k);
      if (t < 1) requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
    el.parentElement.classList.remove(a > da ? "sale" : "scende"); void el.offsetWidth;
    el.parentElement.classList.add(a > da ? "sale" : "scende");
  }

  function riavvia(el, classe) { el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe); el.addEventListener("animationend", () => el.classList.remove(classe), { once: true }); }

  // Onda d'inchiostro dal punto toccato
  function onda(el, ev, colore) {
    const r = el.getBoundingClientRect();
    const s = document.createElement("span");
    s.className = "onda";
    const d = Math.max(r.width, r.height) * 2.2;
    s.style.cssText = `width:${d}px;height:${d}px;left:${(ev.clientX || r.left + r.width / 2) - r.left - d / 2}px;top:${(ev.clientY || r.top + r.height / 2) - r.top - d / 2}px;${colore ? `background:${colore}` : ""}`;
    el.appendChild(s);
    s.addEventListener("animationend", () => s.remove(), { once: true });
  }

  const COLORI_STILE = { FOR: ["#ff7a45", "#ffd0a8"], VEL: ["#3fd8ff", "#c8f6ff"], MEN: ["#d08cff", "#f1dcff"] };

  // Ogni tipo di bottone ha la sua animazione (data-fx)
  function suClick(ev) {
    const el = ev.target.closest("[data-fx]");
    if (!el || el.disabled) return;
    const x = ev.clientX, y = ev.clientY;
    switch (el.dataset.fx) {
      case "onda": onda(el, ev); riavvia(el, "fx-schiaccia"); break;                                  // bottoni principali
      case "monete": riavvia(el, "fx-schiaccia"); volaMonete(document.querySelector(".monete"), el, 6); break; // spendere monete
      case "scintille": {                                                                              // mosse in battaglia
        const st = el.dataset.stile || "FOR";
        esplosione(x, y, { n: 18, colori: COLORI_STILE[st], forma: "rombo", velocita: 6, dimensione: 4, gravita: .05 });
        riavvia(el, "fx-colpo"); break;
      }
      case "carica": anello(x, y, "#3fd8ff", 90); anello(x, y, "#3fd8ff", 50); riavvia(el, "fx-carica"); break; // carica energia
      case "gelatina": riavvia(el, "fx-gelatina"); break;                                              // filtri
      case "scuoti": riavvia(el, "fx-scuoti"); break;                                                  // abbandona
      case "spinta": riavvia(el, "fx-spinta"); esplosione(x, y, { n: 10, colori: ["#ff2e46", "#ffffff"], velocita: 4, dimensione: 2.5 }); break; // sfide
      case "stelle": riavvia(el, "fx-gira"); esplosione(x, y, { n: 14, forma: "stella", colori: ["#f2c14e", "#fff3c4"], velocita: 5, dimensione: 6, gravita: .12 }); break; // squadra
      case "salto": riavvia(el, "fx-salto"); break;                                                   // navigazione
      case "coriandoli": riavvia(el, "fx-schiaccia"); esplosione(x, y, { n: 40, forma: "coriandolo", colori: ["#ff2e46", "#f2c14e", "#3fd8ff", "#b866ff"], velocita: 7, dimensione: 5, gravita: .22, attrito: .97, durata: 1400 }); break; // riscuoti
      default: riavvia(el, "fx-schiaccia");
    }
  }
  document.addEventListener("click", suClick, true);

  // Inclinazione 3D seguendo il dito/mouse (carte livello, ricompense del pass)
  document.addEventListener("pointermove", ev => {
    const el = ev.target.closest && ev.target.closest("[data-inclina]");
    if (!el || ridotto) return;
    const r = el.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width - .5, py = (ev.clientY - r.top) / r.height - .5;
    el.style.setProperty("--rx", `${(-py * 14).toFixed(1)}deg`);
    el.style.setProperty("--ry", `${(px * 18).toFixed(1)}deg`);
    el.style.setProperty("--lx", `${((px + .5) * 100).toFixed(0)}%`);
  });
  document.addEventListener("pointerout", ev => {
    const el = ev.target.closest && ev.target.closest("[data-inclina]");
    if (el && !el.contains(ev.relatedTarget)) { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); }
  });

  return { esplosione, anello, volaMonete, volaIcona, contatore, riavvia, centro };
})();
