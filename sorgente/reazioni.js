// ============================================================
//  REAZIONI IN BATTAGLIA
//  Un bottone nell'arena apre le reazioni (emoji e frasi brevi). Dopo averne mandata una
//  bisogna aspettare 3 secondi per la prossima. Nelle sfide dal vivo arrivano all'amico;
//  contro il computer ogni tanto risponde lui.
// ============================================================
const Reazioni = (() => {
  const ATTESA = 3000;   // millisecondi tra una reazione e l'altra
  const ELENCO = ["😂", "😎", "😱", "😡", "👏", "🔥", "💀", "🤡", "GG", "Fortuna!", "Ops…", "Tutto calcolato"];
  const RISPOSTE_CPU = ["😎", "😂", "🔥", "😱", "GG", "Tutto calcolato", "Ops…"];
  let ultima = 0, ultimaRicevuta = 0, muto = false, timerGiro = null;

  function htmlArena() {
    return `<div class="reazioni" id="reazioni">
      <button type="button" class="reazioni-apri" data-reazioni="apri" aria-label="Reazioni" aria-expanded="false"><span>😀</span><i class="reazioni-giro" hidden></i></button>
      <div class="reazioni-vassoio" id="reazioni-vassoio" hidden>
        <div class="reazioni-griglia">${ELENCO.map((r, i) => `<button type="button" class="reazione ${[...r].length > 2 ? "frase" : ""}" data-reazione="${i}">${esc(r)}</button>`).join("")}</div>
        ${livelloAttuale && livelloAttuale.vivo ? `<button type="button" class="reazioni-muto" data-reazioni="muto">${muto ? "🔈 Riattiva le sue reazioni" : "🔇 Silenzia le sue reazioni"}</button>` : ""}
      </div>
    </div>`;
  }
  function monta() {
    const ar = $("#arena"); if (!ar || $("#reazioni")) return;
    ar.insertAdjacentHTML("beforeend", htmlArena());
    aggiornaGiro();
  }
  const vassoio = () => $("#reazioni-vassoio");
  function apriChiudi(forza) {
    const v = vassoio(); if (!v) return;
    const apri = forza !== undefined ? forza : v.hidden;
    v.hidden = !apri;
    const b = $(".reazioni-apri"); if (b) b.setAttribute("aria-expanded", String(apri));
  }
  // il bottone mostra quanto manca prima di poter mandare la prossima
  function aggiornaGiro() {
    clearTimeout(timerGiro);
    const resto = ultima + ATTESA - Date.now(), b = $(".reazioni-apri"), g = $(".reazioni-giro");
    if (!b || !g) return;
    const attesa = resto > 0;
    b.classList.toggle("in-attesa", attesa); g.hidden = !attesa;
    $$(".reazione").forEach(x => { x.disabled = attesa; });
    if (attesa) { g.style.setProperty("--p", `${Math.round((1 - resto / ATTESA) * 100)}%`); timerGiro = setTimeout(aggiornaGiro, 100); }
  }
  function manda(i) {
    const r = ELENCO[i]; if (!r || !B) return;
    if (Date.now() - ultima < ATTESA) return;
    ultima = Date.now();
    apriChiudi(false);
    mostra(0, r);
    aggiornaGiro();
    if (livelloAttuale && livelloAttuale.vivo) Online.mandaReazione(i);
    else if (Math.random() < .35) setTimeout(() => { if (B) mostra(1, RISPOSTE_CPU[Math.floor(Math.random() * RISPOSTE_CPU.length)]); }, 800 + Math.random() * 900);
  }
  // dall'amico (sfida dal vivo): accetto solo reazioni dell'elenco e non più di una ogni 2,5 secondi
  function ricevi(i) {
    const r = ELENCO[+i];
    if (!r || muto || !B || Date.now() - ultimaRicevuta < 2500) return;
    ultimaRicevuta = Date.now();
    mostra(1, r);
  }
  function mostra(lato, r) {
    const ar = $("#arena"); if (!ar) return;
    const vecchia = ar.querySelector(`.fumetto-reazione.lato-${lato}`); if (vecchia) vecchia.remove();
    const el = document.createElement("div");
    el.className = `fumetto-reazione lato-${lato} ${[...r].length > 2 ? "frase" : ""}`;
    el.textContent = r;
    el.setAttribute("aria-live", "polite");
    ar.appendChild(el);
    setTimeout(() => el.classList.add("via"), 2300);
    setTimeout(() => el.remove(), 2800);
  }
  function clic(cosa) {
    if (cosa === "apri") { apriChiudi(); aggiornaGiro(); }
    if (cosa === "muto") { muto = !muto; const b = $(".reazioni-muto"); if (b) b.textContent = muto ? "🔈 Riattiva le sue reazioni" : "🔇 Silenzia le sue reazioni"; mostraAvviso(muto ? "Reazioni dell'avversario silenziate." : "Reazioni dell'avversario riattivate."); }
  }
  // tocco fuori dal vassoio: si chiude
  document.addEventListener("pointerdown", e => { const v = vassoio(); if (v && !v.hidden && !e.target.closest("#reazioni")) apriChiudi(false); });
  return { monta, manda, ricevi, clic, ELENCO };
})();
