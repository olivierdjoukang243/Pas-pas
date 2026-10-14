// ====== Shop settings: fill in once confirmed. Empty values stay hidden on the page. ======
const SHOP = {
  email: "",          // dedicated contact address
  whatsapp: "",       // international format without "+", e.g. 2376XXXXXXXX
  freeSampleUrl: "",  // link to the free module A0-1
};

// Placement test: 3 questions per level. The level reached is the highest one passed in a row (2/3 or better).
const TEST = [
  { lvl: "A1", q: "Je ___ étudiant.", a: ["suis", "es", "est", "sommes"], ok: 0 },
  { lvl: "A1", q: "« Comment tu t'appelles ? » means…", a: ["What's your name?", "How are you?", "Where do you live?", "How old are you?"], ok: 0 },
  { lvl: "A1", q: "Choose the article: ___ maison est grande.", a: ["Le", "La", "Les", "Un"], ok: 1 },
  { lvl: "A2", q: "Hier, nous ___ au marché.", a: ["allons", "sommes allés", "irons", "allions"], ok: 1 },
  { lvl: "A2", q: "« Il y a deux ans » means…", a: ["two years ago", "in two years", "for two years", "two years later"], ok: 0 },
  { lvl: "A2", q: "Je ne mange ___ de viande.", a: ["pas", "non", "aucun", "nul"], ok: 0 },
  { lvl: "B1", q: "Il faut que tu ___ tes devoirs.", a: ["fais", "fasses", "feras", "faisais"], ok: 1 },
  { lvl: "B1", q: "Si j'avais le temps, j'___ le français tous les jours.", a: ["étudie", "étudierai", "étudierais", "étudiais"], ok: 2 },
  { lvl: "B1", q: "La personne ___ je t'ai parlé est arrivée.", a: ["que", "qui", "dont", "où"], ok: 2 },
  { lvl: "B2", q: "Bien qu'il ___ malade, il est venu.", a: ["est", "soit", "était", "sera"], ok: 1 },
  { lvl: "B2", q: "Il est parti tôt ___ éviter les embouteillages.", a: ["afin d'", "afin qu'", "pour qu'", "parce qu'"], ok: 0 },
  { lvl: "B2", q: "« Actuellement » means…", a: ["currently", "actually", "eventually", "accurately"], ok: 0 },
  { lvl: "C1", q: "Il a réussi, ___ les difficultés rencontrées.", a: ["malgré", "bien que", "quoique", "pourtant"], ok: 0 },
  { lvl: "C1", q: "Quoi qu'il en ___, nous partirons demain.", a: ["soit", "est", "sera", "serait"], ok: 0 },
  { lvl: "C1", q: "« Elle n'est pas sans savoir que… » means…", a: ["She is well aware that…", "She doesn't know that…", "She has no idea that…", "She wants to know whether…"], ok: 0 },
];

// ====== State ======
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem("pap_" + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("pap_" + key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

function defaultCurrency() {
  try { return (Intl.DateTimeFormat().resolvedOptions().timeZone || "").startsWith("Africa/") ? "XAF" : "USD"; }
  catch { return "USD"; }
}

const state = {
  currency: store.get("currency", defaultCurrency()),
  level: store.get("level", "A0"),
};
if (!["USD", "XAF"].includes(state.currency)) state.currency = "USD";
if (!LEVELS.some((l) => l.code === state.level)) state.level = "A0";

const $ = (sel) => document.querySelector(sel);
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const levelOf = (code) => LEVELS.find((l) => l.code === code);

const fmtUSD = (n) => "$" + n.toLocaleString("en-US");
const fmtXAF = (n) => n.toLocaleString("en-US").replace(/,/g, " ") + " FCFA";
const price = (p) => state.currency === "XAF" ? fmtXAF(p.xaf) : fmtUSD(p.usd);
const amount = (usd, xaf) => state.currency === "XAF" ? fmtXAF(xaf) : fmtUSD(usd);

// Savings are computed from the catalogue, never typed by hand.
function levelSaving(code) {
  const parts = PRODUCTS.filter((p) => p.level === code && p.kind === "part");
  const full = PRODUCTS.find((p) => p.level === code && p.kind === "level");
  if (parts.length < 2 || !full) return null;
  return { usd: parts.reduce((s, p) => s + p.usd, 0) - full.usd, xaf: parts.reduce((s, p) => s + p.xaf, 0) - full.xaf };
}
function methodSaving() {
  const levels = PRODUCTS.filter((p) => p.kind === "level");
  const m = byId("complete-method");
  return { usd: levels.reduce((s, p) => s + p.usd, 0) - m.usd, xaf: levels.reduce((s, p) => s + p.xaf, 0) - m.xaf };
}

// ====== Levels ======
function renderLevelTabs() {
  $("#levelTabs").innerHTML = LEVELS.map((l) => `<button role="tab" aria-selected="${l.code === state.level}" data-level="${l.code}" class="${l.status === "prep" ? "prep" : ""}" style="--h:${l.hue}">
    <b>${l.code}</b><span>${l.status === "prep" ? "In preparation" : l.name}</span></button>`).join("");
}

function productRow(p) {
  const saving = p.kind === "level" ? levelSaving(p.level) : null;
  return `<li class="prod">
    <div class="prod-body">
      <strong>${p.name}</strong>
      <small>${p.contents}${saving ? ` · <span class="ok">save ${amount(saving.usd, saving.xaf)} vs two parts</span>` : ""}</small>
      <p>${p.desc}</p>
    </div>
    <div class="prod-buy">
      <span class="price">${price(p)}</span>
      <button class="btn ${p.kind === "level" ? "btn-primary" : "btn-ghost"} mini" data-buy="${p.id}">Buy</button>
    </div>
  </li>`;
}

function renderLevelPanel() {
  const l = levelOf(state.level);
  const products = PRODUCTS.filter((p) => p.level === l.code).sort((a, b) => (a.kind === "level") - (b.kind === "level") || (a.part || 0) - (b.part || 0));
  const head = `<div class="lp-head" style="--h:${l.hue}">
      <div class="lp-title"><span class="lp-code">${l.code}</span><div><h3>${l.name}</h3><p>${l.status === "prep" ? l.note : LEVEL_INTRO[l.code]}</p></div></div>
    </div>`;
  if (l.status === "prep") {
    $("#levelPanel").innerHTML = head + `<div class="lp-empty"><p>${l.code} is not on sale yet. The levels on sale today run from A0 to B1.</p>
      <button class="btn btn-ghost mini" data-level="B1">See B1</button></div>`;
  } else {
    $("#levelPanel").innerHTML = head + `<ol class="prods">${products.map(productRow).join("")}</ol>`;
  }
  document.querySelectorAll("#levelTabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.level === l.code));
}

function renderMethod() {
  const m = byId("complete-method");
  const s = methodSaving();
  $("#methodBand").innerHTML = `<div>
      <p class="eyebrow">Best value</p>
      <h2>The Complete Method</h2>
      <p>${m.desc}</p>
      <p class="method-meta">${m.contents} · <span>${amount(s.usd, s.xaf)} less than the four levels bought separately</span></p>
    </div>
    <div class="method-buy">
      <span class="price">${price(m)}</span>
      <button class="btn btn-light" data-buy="${m.id}">Buy the Complete Method</button>
    </div>`;
}

function renderExams() {
  $("#examSoon").innerHTML = EXAMS_IN_PRODUCTION.map((e) => `<div class="pay-card"><h3>${e}</h3><p>Practice papers in production. Not on sale yet.</p></div>`).join("");
}

function renderPrices() { renderLevelPanel(); renderMethod(); }

// ====== Dialogs ======
const modal = $("#modal");
function openModal(html) {
  $("#modalBody").innerHTML = `<button class="icon-btn modal-close" data-modal-close aria-label="Close">✕</button>${html}`;
  if (!modal.open) modal.showModal();
}

function contactHTML() {
  const bits = [];
  if (SHOP.email) bits.push(`email <a href="mailto:${SHOP.email}">${SHOP.email}</a>`);
  if (SHOP.whatsapp) bits.push(`WhatsApp <a href="https://wa.me/${SHOP.whatsapp}" target="_blank" rel="noopener">+${SHOP.whatsapp}</a>`);
  return bits.length ? `To order before checkout opens: ${bits.join(" or ")}.` : "";
}

function openBuy(id) {
  const p = byId(id);
  const contact = contactHTML();
  openModal(`<div class="checkout">
    <p class="eyebrow">${p.level === "A0–B1" ? "A0 to B1" : p.level}</p>
    <h2>${p.name}</h2>
    <p>${p.contents}</p>
    <div class="totals"><div class="grand"><span>Price</span><span>${fmtUSD(p.usd)} · ${fmtXAF(p.xaf)}</span></div></div>
    <p><strong>Online checkout opens soon.</strong> Card payment worldwide and MTN MoMo or Orange Money in Cameroon are planned. After payment, your download link arrives immediately.</p>
    ${contact ? `<p>${contact}</p>` : ""}
    <p class="note">Sales are final: the files are delivered instantly and cannot be returned.</p>
    <button class="btn btn-primary" data-modal-close>Close</button>
  </div>`);
}

// ====== Placement test ======
let testStep = 0, testAnswers = [];
function openTest() { testStep = 0; testAnswers = []; renderTestStep(); }

function renderTestStep() {
  const item = TEST[testStep];
  openModal(`<div class="quiz">
    <div class="quiz-head"><span class="eyebrow">Level test · question ${testStep + 1} of ${TEST.length}</span><span class="chip">${item.lvl}</span></div>
    <div class="bar"><span style="width:${(testStep / TEST.length) * 100}%"></span></div>
    <h2 lang="fr">${item.q}</h2>
    <div class="quiz-options">${item.a.map((a, i) => `<button class="quiz-opt" data-answer="${i}">${a}</button>`).join("")}</div>
    <button class="link-btn" data-answer="-1">I don't know</button>
  </div>`);
}

// What to buy next, from the level reached.
const NEXT = {
  A0: { pick: "a0-complete", text: "Start with A0 Complete: everything is explained in English from the very first word." },
  A1: { pick: "a2-part1", text: "You have the basics of A1. Your next step is A2, starting with Part 1." },
  A2: { pick: "b1-part1", text: "You are around A2. Your next step is B1, starting with Part 1." },
  B1: { pick: "b1-part2", text: "You are around B1. B2 is in preparation; B1 Part 2 works on argument, nuance and formal writing in the meantime." },
  B2: { pick: null, text: "You are beyond the levels on sale today (A0 to B1). B2, C1 and C2 are in preparation." },
  C1: { pick: null, text: "You are beyond the levels on sale today (A0 to B1). B2, C1 and C2 are in preparation." },
};

function testResult() {
  let reached = "A0";
  for (const lvl of ["A1", "A2", "B1", "B2", "C1"]) {
    const score = TEST.filter((t, i) => t.lvl === lvl && testAnswers[i] === t.ok).length;
    if (score >= 2) reached = lvl; else break;
  }
  const correct = TEST.filter((t, i) => testAnswers[i] === t.ok).length;
  const next = NEXT[reached];
  const p = next.pick && byId(next.pick);
  if (p) { state.level = p.level; store.set("level", p.level); renderLevelTabs(); renderLevelPanel(); }
  openModal(`<div class="quiz quiz-result">
    <p class="eyebrow">Your result · ${correct}/${TEST.length} correct</p>
    <h2>${reached === "A0" ? "Start at <em>A0</em>" : `You're around <em>${reached}</em>`}</h2>
    <p>${next.text}</p>
    ${p ? `<ul class="pick-list"><li><span>${p.name}</span><span><strong>${price(p)}</strong> <button class="btn btn-primary mini" data-buy="${p.id}">Buy</button></span></li></ul>` : ""}
    <div class="hero-cta tight">
      ${p ? `<button class="btn btn-ghost" data-goto-level="${p.level}">See all ${p.level} packs</button>` : ""}
      <button class="link-btn" data-test>Retake the test</button>
    </div>
  </div>`);
}

// ====== Events ======
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-buy],[data-level],[data-currency],[data-modal-close],[data-test],[data-answer],[data-goto-level]");
  if (!el) return;
  const d = el.dataset;
  if (d.buy) openBuy(d.buy);
  else if (d.level) { state.level = d.level; store.set("level", d.level); renderLevelTabs(); renderLevelPanel(); }
  else if (d.currency) { state.currency = d.currency; store.set("currency", d.currency); renderCurrency(); renderPrices(); }
  else if ("modalClose" in d) modal.close();
  else if ("test" in d) { e.preventDefault(); openTest(); }
  else if (d.answer !== undefined) {
    testAnswers[testStep] = +d.answer;
    testStep++;
    testStep < TEST.length ? renderTestStep() : testResult();
  }
  else if (d.gotoLevel) {
    modal.close();
    state.level = d.gotoLevel; store.set("level", d.gotoLevel);
    renderLevelTabs(); renderLevelPanel();
    $("#levels").scrollIntoView();
  }
});
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

function renderCurrency() {
  document.querySelectorAll("#currencySwitch button").forEach((b) => b.classList.toggle("active", b.dataset.currency === state.currency));
}

// ====== Start ======
if (SHOP.freeSampleUrl) {
  const a = $(".free-sample");
  a.href = SHOP.freeSampleUrl; a.target = "_blank"; a.rel = "noopener"; a.hidden = false;
}
const contact = contactHTML();
if (contact) { $("#contactLine").innerHTML = contact; $("#contactLine").hidden = false; }
$("#year").textContent = new Date().getFullYear();
renderCurrency();
renderLevelTabs();
renderPrices();
renderExams();
