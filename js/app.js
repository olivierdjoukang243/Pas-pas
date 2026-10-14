// ====== Shop settings: fill in once confirmed. Empty values stay hidden on the page. ======
const SHOP = {
  email: "",          // dedicated contact address
  whatsapp: "",       // international format without "+", e.g. 2376XXXXXXXX
  freeSampleUrl: "",  // link to the free module A0-1
  api: "",            // booking and payment server (Notch Pay), e.g. "https://api.pasapasfrench.com"
};
// ?demo in the address: try purchases and live lessons without paying (this browser only)
const DEMO = /(^|[?&])demo(&|$)/.test(location.search);

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

// ====== Currencies ======
// USD and FCFA prices are fixed in the catalogue. XOF has the same parity as XAF.
// EUR is derived from FCFA (fixed parity 655.957). The others are converted from USD
// at indicative rates: update them before launch; the amount charged is the USD or FCFA price.
const XAF_PER_EUR = 655.957;
const CURRENCIES = {
  USD: { label: "$ USD" },
  XAF: { label: "FCFA (XAF)" },
  XOF: { label: "FCFA (XOF)" },
  EUR: { label: "€ EUR" },
  GBP: { label: "£ GBP", perUSD: 0.79 },
  CAD: { label: "$ CAD", perUSD: 1.37 },
  NGN: { label: "₦ NGN", perUSD: 1550 },
  GHS: { label: "₵ GHS", perUSD: 15.5 },
};

// Starting payment methods. Cameroon adds MTN MoMo and Orange Money.
const COUNTRIES = ["Cameroon", "Nigeria", "Ghana", "Côte d'Ivoire", "Senegal", "United States", "Canada", "United Kingdom", "France", "Other country"];
const PAY_METHODS = {
  momo: { label: "MTN MoMo", phone: true, cameroonOnly: true },
  om: { label: "Orange Money", phone: true, cameroonOnly: true },
  card: { label: "Bank card (Visa, Mastercard)" },
  paypal: { label: "PayPal" },
};
const CM_MOBILE = /^(?:\+?237)?6\d{8}$/;

// ====== Visitor's country ======
// Country code → currency and checkout country. Euro-zone countries use EUR.
const EURO = ["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"];
const COUNTRY_NAMES = { CM: "Cameroon", NG: "Nigeria", GH: "Ghana", CI: "Côte d'Ivoire", SN: "Senegal", US: "United States", CA: "Canada", GB: "United Kingdom", FR: "France" };
function currencyFor(code) {
  if (["CM", "GA", "GQ", "CG", "CF", "TD"].includes(code)) return "XAF";
  if (["CI", "SN", "BJ", "BF", "ML", "NE", "TG", "GW"].includes(code)) return "XOF";
  if (code === "NG") return "NGN";
  if (code === "GH") return "GHS";
  if (code === "GB") return "GBP";
  if (code === "CA") return "CAD";
  if (EURO.includes(code)) return "EUR";
  return "USD";
}
const localeFor = (code) => ({ code, currency: currencyFor(code), country: COUNTRY_NAMES[code] || "Other country" });

// First guess, available instantly: the browser's region (en-CM, fr-CA…), then its time zone.
// Time zones are a weak signal: Windows often sets Cameroon to "West Central Africa" (Africa/Lagos).
function guessLocale() {
  try {
    for (const lang of navigator.languages || [navigator.language]) {
      const region = (lang.split("-")[1] || "").toUpperCase();
      if (/^[A-Z]{2}$/.test(region) && region !== "US" && region !== "GB" && region !== "FR") return localeFor(region);
    }
  } catch { /* ignore */ }
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { /* ignore */ }
  const byZone = { "Africa/Douala": "CM", "Africa/Libreville": "GA", "Africa/Malabo": "GQ", "Africa/Brazzaville": "CG", "Africa/Bangui": "CF", "Africa/Ndjamena": "TD",
    "Africa/Abidjan": "CI", "Africa/Dakar": "SN", "Africa/Lome": "TG", "Africa/Porto-Novo": "BJ", "Africa/Bamako": "ML", "Africa/Ouagadougou": "BF", "Africa/Niamey": "NE",
    "Africa/Accra": "GH", "Europe/London": "GB", "Europe/Paris": "FR" };
  if (byZone[tz]) return localeFor(byZone[tz]);
  if (tz === "Africa/Lagos") return { code: "", currency: "XAF", country: "Other country" }; // Nigeria or Central Africa: settled by the IP lookup
  if (tz.startsWith("Africa/")) return { code: "", currency: "XAF", country: "Other country" };
  if (tz.startsWith("Europe/")) return { code: "", currency: "EUR", country: "Other country" };
  if (/^America\/(Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Halifax|Regina|St_Johns)/.test(tz)) return localeFor("CA");
  if (tz.startsWith("America/")) return localeFor("US");
  return { code: "", currency: "USD", country: "Other country" };
}

// Then the reliable answer: the country of the visitor's connection (free lookup, no key).
async function lookupCountry() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/country.json", { signal: ctrl.signal });
    const data = await res.json();
    return /^[A-Z]{2}$/.test(data.country) ? data.country : "";
  } catch { return ""; } finally { clearTimeout(timer); }
}
const guess = guessLocale();

// A currency the visitor picks by hand wins over detection, and is remembered.
const state = {
  currency: store.get("currencyChoice", null) || guess.currency,
  country: store.get("country", null) || guess.country,
  level: store.get("level", "A0"),
};
if (!CURRENCIES[state.currency]) state.currency = guess.currency;
if (!COUNTRIES.includes(state.country)) state.country = guess.country;
if (!LEVELS.some((l) => l.code === state.level)) state.level = "A0";

const $ = (sel) => document.querySelector(sel);
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const levelOf = (code) => LEVELS.find((l) => l.code === code);

const fmtUSD = (n) => "$" + n.toLocaleString("en-US");
const fmtXAF = (n) => n.toLocaleString("en-US").replace(/,/g, " ") + " FCFA";
const fmtMoney = (value, code) => value.toLocaleString("en-US", { style: "currency", currency: code, currencyDisplay: code === "CAD" ? "symbol" : "narrowSymbol", minimumFractionDigits: code === "NGN" ? 0 : 2, maximumFractionDigits: code === "NGN" ? 0 : 2 });

// Price shown in the selected currency. "≈" marks a conversion; USD and FCFA are exact.
function amount(usd, xaf, currency = state.currency) {
  if (currency === "USD") return fmtUSD(usd);
  if (currency === "XAF" || currency === "XOF") return fmtXAF(xaf);
  if (currency === "EUR") return "≈ " + fmtMoney(xaf / XAF_PER_EUR, "EUR");
  return "≈ " + fmtMoney(usd * CURRENCIES[currency].perUSD, currency);
}
const price = (p) => amount(p.usd, p.xaf);

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

// Module titles come from the workshop export (js/modules.js), never typed here.
function modulesOf(p) {
  if (typeof MODULES === "undefined") return null;
  if (MODULES[p.id]) return [{ offset: p.part === 2 ? 8 : 0, data: MODULES[p.id] }];
  if (p.kind === "level") {
    const base = p.id.replace("-complete", "");
    const parts = [1, 2].map((n) => MODULES[`${base}-part${n}`]);
    if (parts.every(Boolean)) return parts.map((data, i) => ({ offset: i * 8, data }));
  }
  return null;
}

function modulesHTML(p) {
  const groups = modulesOf(p);
  if (!groups) return "";
  const count = groups.reduce((s, g) => s + g.data.modules.length, 0);
  const lists = groups.map((g) => `<ol class="mod-list" start="${g.offset + 1}">
      ${g.data.modules.map((m) => `<li>${m.titre}</li>`).join("")}
    </ol>${g.data.bilan ? `<p class="mod-bilan">Level check · ${g.data.bilan.titre}</p>` : ""}`).join("");
  return `<details class="mods"><summary>See the ${count} modules</summary>${lists}</details>`;
}

function productRow(p) {
  const saving = p.kind === "level" ? levelSaving(p.level) : null;
  return `<li class="prod">
    <div class="prod-body">
      <strong>${p.name}</strong>
      <small>${p.contents}${saving ? ` · <span class="ok">save ${amount(saving.usd, saving.xaf)} vs two parts</span>` : ""}</small>
      <p>${p.desc}</p>
      ${modulesHTML(p)}
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
  $("#examSoon").innerHTML = EXAMS.map((e) => `<div class="pay-card exam-card">
    <span class="tag soon">Coming soon</span>
    <h3>${e.name}</h3>
    <p class="exam-levels">${e.levels}</p>
    <p>${e.note}</p>
  </div>`).join("");
}

function renderLive() {
  $("#liveGrid").innerHTML = LIVE.map((p) => `<div class="pay-card live-card">
    <h3>${p.name}</h3>
    <p>${p.desc}</p>
    <span class="price">${price(p)}</span>
  </div>`).join("");
}

function renderPrices() { renderLevelPanel(); renderMethod(); renderLive(); }

// ====== Dialogs ======
const modal = $("#modal");
function openModal(html) {
  $("#modalBody").innerHTML = `<button class="icon-btn modal-close" data-modal-close aria-label="Close">✕</button>${html}`;
  if (!modal.open) modal.showModal();
}

const whatsappLink = (text) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;

function contactHTML() {
  const bits = [];
  if (SHOP.email) bits.push(`email <a href="mailto:${SHOP.email}">${SHOP.email}</a>`);
  if (SHOP.whatsapp) bits.push(`WhatsApp <a href="https://wa.me/${SHOP.whatsapp}" target="_blank" rel="noopener">+${SHOP.whatsapp}</a>`);
  return bits.length ? `To order before online payment opens: ${bits.join(" or ")}.` : "";
}

// Cameroon: MTN MoMo, Orange Money, card and PayPal. Elsewhere: card and PayPal.
const methodsFor = (country) => Object.entries(PAY_METHODS).filter(([, m]) => country === "Cameroon" || !m.cameroonOnly);

let checkoutDraft = null;   // a live lesson being booked, set by live.js

function openBuy(id, draft = null) {
  const p = byId(id);
  checkoutDraft = draft;
  openModal(`<form class="checkout" id="checkoutForm" data-product="${p.id}" novalidate>
    <p class="eyebrow">${p.level === "A0–B1" ? "A0 to B1" : p.level}${DEMO ? " · demo" : ""}</p>
    <h2>${p.name}</h2>
    <p>${draft ? `${localDay(draft.start)}, ${localTime(draft.start)} your time · ${draft.minutes} min · ${draft.need}` : p.contents}</p>
    <div class="form-grid">
      <label for="coEmail">Email (to receive your ${p.kind === "live" ? "booking confirmation" : "files"})<input id="coEmail" name="email" type="email" required autocomplete="email" value="${draft ? draft.email : ""}"></label>
      <label for="coCountry">Country<select id="coCountry" name="country">${COUNTRIES.map((c) => `<option ${c === state.country ? "selected" : ""}>${c}</option>`).join("")}</select></label>
    </div>
    <p class="eyebrow pm-title">Payment method</p>
    <div class="pay-methods" id="payMethods" role="radiogroup" aria-label="Payment method"></div>
    <div id="payDetails"></div>
    <div class="totals" id="coTotals"></div>
    <p class="form-error" id="formError" hidden></p>
    <button class="btn btn-primary btn-block" id="payBtn"></button>
    <p class="note">${p.kind === "live" ? "Payment confirms the session and reserves the time for you." : "Sales are final: the files are delivered instantly and cannot be returned."}</p>
  </form>`);
  renderPayOptions();
}

function renderPayOptions() {
  const country = $("#coCountry").value;
  $("#payMethods").innerHTML = methodsFor(country).map(([k, m], i) => `<label class="pm pm-${k}"><input type="radio" name="pay" value="${k}" ${i === 0 ? "checked" : ""}> ${m.label}</label>`).join("");
  renderPayDetails();
}

function renderPayDetails() {
  const p = byId($("#checkoutForm").dataset.product);
  const country = $("#coCountry").value;
  const m = PAY_METHODS[document.querySelector('input[name="pay"]:checked').value];
  $("#payDetails").innerHTML = m.phone ? `<label for="coMomo">${m.label} number
      <input id="coMomo" name="momo" type="tel" required inputmode="tel" placeholder="6XX XX XX XX" autocomplete="tel"></label>` : "";
  const charged = country === "Cameroon" || m.phone ? fmtXAF(p.xaf) : fmtUSD(p.usd);
  const shown = price(p);
  $("#coTotals").innerHTML = `<div class="grand"><span>Total</span><span>${charged}</span></div>
    ${shown !== charged ? `<div class="note"><span>In ${CURRENCIES[state.currency].label}</span><span>${shown}</span></div>` : ""}`;
  $("#payBtn").textContent = m.phone ? `Pay with ${m.label}` : `Pay ${charged}`;
}

function submitCheckout(form) {
  const p = byId(form.dataset.product);
  const data = new FormData(form);
  const m = PAY_METHODS[data.get("pay")];
  const err = $("#formError");
  let msg = "";
  if (!form.coEmail.value || !form.coEmail.checkValidity()) msg = "Enter a valid email address: your files are sent there.";
  else if (m.phone && !CM_MOBILE.test(String(data.get("momo")).replace(/[\s.-]/g, ""))) msg = `Enter a Cameroon mobile number for ${m.label}: 9 digits starting with 6, e.g. 677 12 34 56.`;
  if (msg) { err.textContent = msg; err.hidden = false; return; }

  state.country = data.get("country"); store.set("country", state.country);
  const inFCFA = state.country === "Cameroon" || m.phone;
  const charged = inFCFA ? fmtXAF(p.xaf) : fmtUSD(p.usd);
  const order = { product: p.id, email: data.get("email"), country: state.country, method: data.get("pay"),
    phone: m.phone ? String(data.get("momo")).replace(/[\s.-]/g, "") : "",
    currency: inFCFA ? "XAF" : "USD", amount: inFCFA ? p.xaf : p.usd, booking: checkoutDraft };

  // Live payment: the server creates the Notch Pay transaction and sends back its page.
  if (SHOP.api) return payOnline(order);
  // Demo: nothing is charged; a live lesson is booked in this browser only.
  if (DEMO) {
    if (checkoutDraft) return bookedScreen(confirmBooking(checkoutDraft, "demo"));
    return openModal(`<div class="checkout"><p class="eyebrow">Demo · nothing was charged</p><h2>Payment accepted</h2>
      <p>In the live shop, ${p.name} would now be sent to ${order.email}.</p><button class="btn btn-primary" data-modal-close>Done</button></div>`);
  }
  const contact = contactHTML();
  const wa = SHOP.whatsapp ? whatsappLink(`Hello, I'd like to buy "${p.name}" (${charged}), paying by ${m.label}. My email: ${data.get("email")}`) : "";
  openModal(`<div class="checkout">
    <h2>Online payment opens soon</h2>
    <p>Nothing has been charged. Payment by ${m.label} is not active on the site yet.</p>
    ${wa ? `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">Send this order on WhatsApp</a>` : ""}
    ${contact ? `<p>${contact}</p>` : ""}
    <button class="btn btn-ghost" data-modal-close>Close</button>
  </div>`);
}

async function payOnline(order) {
  const btn = $("#payBtn"), err = $("#formError");
  btn.disabled = true; btn.textContent = "Opening the secure payment page…";
  try {
    const r = await fetch(`${SHOP.api}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, return_url: location.href.split(/[?#]/)[0] }) });
    const d = await r.json();
    if (!r.ok || !d.authorization_url) throw new Error(d.error || "no payment page");
    location.href = d.authorization_url;
  } catch (e) {
    err.textContent = "The payment page could not be opened. Nothing was charged. Please try again in a moment.";
    err.hidden = false; btn.disabled = false; renderPayDetails();
  }
}

// Back from the payment page: the server tells whether the payment is complete.
async function checkReturn() {
  const ref = new URLSearchParams(location.search).get("paid");
  if (!ref || !SHOP.api) return;
  history.replaceState(null, "", location.pathname + location.hash);
  try {
    const d = await (await fetch(`${SHOP.api}/payments/${encodeURIComponent(ref)}`)).json();
    if (d.status !== "complete") {
      return openModal(`<div class="checkout"><h2>Payment not completed</h2><p>Nothing was charged. You can try again.</p><button class="btn btn-primary" data-modal-close>Close</button></div>`);
    }
    if (d.booking) return bookedScreen(confirmBooking(d.booking, "paid", ref));
    openModal(`<div class="checkout"><h2>Thank you</h2><p>Payment received. Your files are on their way to ${d.email}.</p><button class="btn btn-primary" data-modal-close>Done</button></div>`);
  } catch {
    openModal(`<div class="checkout"><h2>Checking your payment…</h2><p>We could not confirm it yet. You will receive an email as soon as it is confirmed.</p><button class="btn btn-primary" data-modal-close>Close</button></div>`);
  }
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
  const el = e.target.closest("[data-buy],[data-level],[data-modal-close],[data-test],[data-answer],[data-goto-level]");
  if (!el) return;
  const d = el.dataset;
  if (d.buy) openBuy(d.buy);
  else if (d.level) { state.level = d.level; store.set("level", d.level); renderLevelTabs(); renderLevelPanel(); }
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
modal.addEventListener("change", (e) => {
  if (e.target.id === "coCountry") renderPayOptions();
  else if (e.target.name === "pay") renderPayDetails();
});
modal.addEventListener("submit", (e) => {
  if (e.target.id === "checkoutForm") { e.preventDefault(); submitCheckout(e.target); }
});

$("#currency").addEventListener("change", (e) => {
  state.currency = e.target.value; store.set("currencyChoice", state.currency);
  renderPrices();
});

lookupCountry().then((code) => {
  if (!code) return;
  const loc = localeFor(code);
  if (!store.get("country", null)) state.country = loc.country;
  if (store.get("currencyChoice", null) || loc.currency === state.currency) return;
  state.currency = loc.currency;
  $("#currency").value = state.currency;
  renderPrices();
});

// ====== Start ======
if (SHOP.freeSampleUrl) {
  const a = $(".free-sample");
  a.href = SHOP.freeSampleUrl; a.target = "_blank"; a.rel = "noopener"; a.hidden = false;
}
const contact = contactHTML();
if (contact) { $("#contactLine").innerHTML = contact; $("#contactLine").hidden = false; }
$("#year").textContent = new Date().getFullYear();
$("#currency").innerHTML = Object.entries(CURRENCIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
$("#currency").value = state.currency;
renderLevelTabs();
renderPrices();
renderExams();
