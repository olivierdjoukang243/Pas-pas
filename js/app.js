// ?demo in the address: try purchases and live lessons without paying (this browser only)
const DEMO = /(^|[?&])demo(&|$)/.test(location.search);

// ====== State ======
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem("pap_" + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("pap_" + key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

// ====== Currencies ======
// USD and FCFA prices are fixed in the catalogue. XOF has the same parity as XAF.
// EUR is derived from FCFA (fixed parity 655.957). The others are converted from USD at
// indicative rates, refreshed once a day from open.er-api.com (free, no key); the values
// below are the fallback. The amount charged is always the USD or FCFA price.
const XAF_PER_EUR = 655.957;
const CURRENCIES = {
  USD: { label: "$ USD" },
  XAF: { label: "FCFA (XAF)" },
  XOF: { label: "FCFA (XOF)" },
  EUR: { label: "€ EUR" },
  GBP: { label: "£ GBP", perUSD: 0.79 },
  CAD: { label: "$ CAD", perUSD: 1.37 },
  AUD: { label: "$ AUD", perUSD: 1.52 },
  NZD: { label: "$ NZD", perUSD: 1.68 },
  INR: { label: "₹ INR", perUSD: 84, whole: true },
  ZAR: { label: "R ZAR", perUSD: 18 },
  NGN: { label: "₦ NGN", perUSD: 1550, whole: true },
  GHS: { label: "₵ GHS", perUSD: 15.5 },
  KES: { label: "KSh KES", perUSD: 129, whole: true },
  PHP: { label: "₱ PHP", perUSD: 57, whole: true },
  SGD: { label: "$ SGD", perUSD: 1.33 },
};
async function refreshRates() {
  const saved = store.get("rates", null);
  const apply = (r) => Object.keys(CURRENCIES).forEach((k) => { if (CURRENCIES[k].perUSD && r[k]) CURRENCIES[k].perUSD = r[k]; });
  if (saved && Date.now() - saved.at < 864e5) return apply(saved.rates);
  try {
    const d = await (await fetch("https://open.er-api.com/v6/latest/USD")).json();
    if (d.result !== "success") throw new Error();
    store.set("rates", { at: Date.now(), rates: d.rates });
    apply(d.rates);
  } catch { if (saved) apply(saved.rates); }
}

// Every country of residence, by its English name. The shop serves English speakers worldwide.
const ISO = "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");
const regionName = (() => { try { const dn = new Intl.DisplayNames(["en"], { type: "region" }); return (c) => dn.of(c); } catch { return (c) => c; } })();
const COUNTRY_NAMES = Object.fromEntries(ISO.map((c) => [c, regionName(c)]));
const COUNTRIES = [...Object.values(COUNTRY_NAMES).sort((a, b) => a.localeCompare(b, "en")), "Other country"];
// Each method lists the countries of residence where it is available; no list = every country.
// The checkout only shows the methods of the buyer's country of residence.
const PAY_METHODS = {
  momo: { label: "MTN MoMo", phone: true, countries: ["Cameroon"] },
  om: { label: "Orange Money", phone: true, countries: ["Cameroon"] },
  card: { label: "Bank card (Visa, Mastercard)" },
  paypal: { label: "PayPal" },
};
const CM_MOBILE = /^(?:\+?237)?6\d{8}$/;

// ====== Visitor's country ======
// Country code → currency and checkout country. Euro-zone countries use EUR.
const EURO = ["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"];
function currencyFor(code) {
  if (["CM", "GA", "GQ", "CG", "CF", "TD"].includes(code)) return "XAF";
  if (["CI", "SN", "BJ", "BF", "ML", "NE", "TG", "GW"].includes(code)) return "XOF";
  const own = { NG: "NGN", GH: "GHS", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD", IN: "INR", ZA: "ZAR", KE: "KES", PH: "PHP", SG: "SGD" }[code];
  if (own) return own;
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
    "Africa/Accra": "GH", "Europe/London": "GB", "Europe/Dublin": "IE", "Europe/Paris": "FR", "Africa/Johannesburg": "ZA", "Africa/Nairobi": "KE",
    "Asia/Kolkata": "IN", "Asia/Calcutta": "IN", "Asia/Manila": "PH", "Asia/Singapore": "SG", "Pacific/Auckland": "NZ" };
  if (byZone[tz]) return localeFor(byZone[tz]);
  if (tz === "Africa/Lagos") return { code: "", currency: "XAF", country: "Other country" }; // Nigeria or Central Africa: settled by the IP lookup
  if (tz.startsWith("Africa/")) return { code: "", currency: "XAF", country: "Other country" };
  if (tz.startsWith("Europe/")) return { code: "", currency: "EUR", country: "Other country" };
  if (/^America\/(Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Halifax|Regina|St_Johns)/.test(tz)) return localeFor("CA");
  if (tz.startsWith("America/")) return localeFor("US");
  if (tz.startsWith("Australia/")) return localeFor("AU");
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
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const levelOf = (code) => LEVELS.find((l) => l.code === code);

const fmtUSD = (n) => "$" + n.toLocaleString("en-US");
const fmtXAF = (n) => n.toLocaleString("en-US").replace(/,/g, " ") + " FCFA";
const fmtMoney = (value, code) => { const d = CURRENCIES[code]?.whole ? 0 : 2;
  return value.toLocaleString("en-US", { style: "currency", currency: code, currencyDisplay: ["CAD", "AUD", "NZD", "SGD"].includes(code) ? "symbol" : "narrowSymbol", minimumFractionDigits: d, maximumFractionDigits: d }); };

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

// Categories, not brands: what each kind of tool usually offers.
function renderCompare() {
  const rows = [
    ["How you pay", `One payment, from ${price(byId("a0-complete"))}. The files are yours`, "Monthly or yearly subscription", "Per hour, every time"],
    ["Grammar explained in English", "Yes, in every module", "Short tips, mostly practice", "Depends on the tutor"],
    ["Step-by-step path with level checks", "56 modules, 7 level checks, A0 to B1", "Yes, inside the app", "Depends on the tutor"],
    ["Works offline", "PDF and MP3 on any device", "Partly, in the app", "No"],
    ["Answer keys you keep", "Every exercise", "Instant marking, nothing to keep", "Depends on the tutor"],
    ["Talk with a teacher", `Optional live lessons, from ${price(byId("live-30"))}`, "Rarely", "Yes"],
    ["Exam practice papers", "DELF A1 to B2 and TCF Canada", "Rarely", "Depends on the tutor"],
    ["Try before you buy", "Module 1 free, in full", "Free version or trial, then subscription", "Sometimes a trial lesson"],
    ["Pay the way your country pays", "Card and PayPal everywhere, MTN MoMo and Orange Money in Cameroon", "Card or app store", "Varies"],
  ];
  $("#compareTable").innerHTML = `<table class="compare">
    <thead><tr><th scope="col"><span class="sr-only">Feature</span></th><th scope="col" class="us">Pas à Pas FRENCH</th><th scope="col">Language apps</th><th scope="col">Hourly tutors</th></tr></thead>
    <tbody>${rows.map(([k, a, b, c]) => `<tr><th scope="row">${k}</th><td class="us">${a}</td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
  </table>`;
}

function renderExams() {
  $("#examSoon").innerHTML = EXAM_PACKS.map((p) => `<div class="pay-card exam-card">
    <span class="tag">${p.level}</span>
    <h3>${p.exam}</h3>
    <p class="exam-levels">${p.contents}</p>
    <p>${p.desc}</p>
    <div class="exam-buy"><span class="price">${price(p)}</span><button class="btn btn-primary mini" data-buy="${p.id}">Buy</button></div>
  </div>`).join("") + EXAMS_SOON.map((e) => `<div class="pay-card exam-card">
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

function renderPrices() { renderLevelPanel(); renderMethod(); renderCompare(); renderExams(); renderLive(); }

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
const methodsFor = (country) => Object.entries(PAY_METHODS).filter(([, m]) => !m.countries || m.countries.includes(country));

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
      <label for="coCountry">Country of residence<select id="coCountry" name="country">${COUNTRIES.map((c) => `<option ${c === state.country ? "selected" : ""}>${c}</option>`).join("")}</select></label>
    </div>
    <p class="eyebrow pm-title">Payment method</p>
    <div class="pay-methods" id="payMethods" role="radiogroup" aria-label="Payment method"></div>
    <div id="payDetails"></div>
    <div class="totals" id="coTotals"></div>
    <label class="check"><input type="checkbox" name="terms" id="coTerms"> ${p.kind === "live"
      ? `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#live" target="_blank">live lesson rules</a> (free rescheduling up to 24 h before).`
      : `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#licence" target="_blank">licence</a>. I ask for immediate delivery of the files and understand that I then lose my right of withdrawal.`}</label>
    <p class="form-error" id="formError" hidden></p>
    <button class="btn btn-primary btn-block" id="payBtn"></button>
    <p class="note">${p.kind === "live" ? "Payment confirms the session and reserves the time for you." : "Sales are final: the files are delivered instantly. A faulty file is replaced."}</p>
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
  else if (!form.coTerms.checked) msg = "Please accept the terms of sale to continue.";
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
// The questions come from the level checks of the method (js/leveltest.js, exported by the atelier).
// The test climbs step by step, from A0 to B1 Part 2, and stops at the first step that is too hard.
const TEST_PER_STEP = 4;
let testStep = 0, testDraw = [], testDone = [];
const pick = (arr, n) => arr.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).slice(0, n).map((x) => x[1]);
const normalise = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[\u2019\u02bc]/g, "'").toLowerCase().replace(/[.!?;:,]/g, "").replace(/\s+/g, " ").trim();

function drawStep(step) {
  return pick(step.skills, TEST_PER_STEP).map((s) => {
    const [ex, q] = pick(s.items, 2);
    return { skill: s.skill, instruction: s.instruction, example: ex, q: q[0], answer: q[1] };
  });
}

function openTest() {
  if (typeof LEVEL_TEST === "undefined") return;
  testStep = 0; testDone = [];
  testDraw = drawStep(LEVEL_TEST.steps[0]);
  renderTestStep();
}

function renderTestStep() {
  const steps = LEVEL_TEST.steps, step = steps[testStep];
  openModal(`<form class="quiz" id="testForm" autocomplete="off">
    <div class="quiz-head"><span class="eyebrow">Level test · step ${testStep + 1} of ${steps.length}</span><span class="chip">${step.name}</span></div>
    <div class="bar"><span style="width:${(testStep / steps.length) * 100}%"></span></div>
    ${testStep === 0 ? `<p class="quiz-note">Type the answer only. Accents and capitals are not marked. Leave it empty if you don't know.</p>` : ""}
    ${testStep === 1 ? `<p class="quiz-note">From here, instructions are in French, as in the course. Read the example: it shows what to write.</p>` : ""}
    ${testDraw.map((t, i) => `<div class="quiz-q" lang="fr">
      <p class="quiz-inst">${esc(t.instruction)}</p>
      <p class="quiz-ex"><b lang="en">Example</b> ${esc(t.example[0])} → <strong>${esc(t.example[1])}</strong></p>
      <label for="tq${i}">${esc(t.q)}</label>
      <input id="tq${i}" name="tq${i}" spellcheck="false" autocapitalize="off">
    </div>`).join("")}
    <button class="btn btn-primary btn-block" type="submit">${testStep + 1 < steps.length ? "Next step" : "See my level"}</button>
  </form>`);
  document.getElementById("tq0")?.focus();
}

function submitTestStep(form) {
  const data = new FormData(form);
  const wrong = testDraw.filter((t, i) => normalise(data.get("tq" + i)) !== normalise(t.answer));
  const right = testDraw.length - wrong.length;
  testDone.push({ step: LEVEL_TEST.steps[testStep], right, total: testDraw.length, wrong });
  const passed = (100 * right) / testDraw.length >= LEVEL_TEST.pass;
  if (passed && testStep + 1 < LEVEL_TEST.steps.length) {
    testStep++;
    testDraw = drawStep(LEVEL_TEST.steps[testStep]);
    renderTestStep();
  } else testResult(passed);
}

function testResult(finishedAll) {
  const last = testDone[testDone.length - 1];
  const passedSteps = testDone.slice(0, finishedAll ? undefined : -1).map((d) => d.step.name);
  const p = finishedAll ? null : byId(last.step.product);
  if (p) { state.level = p.level; store.set("level", p.level); renderLevelTabs(); renderLevelPanel(); }
  const live = byId("live-60");
  openModal(`<div class="quiz quiz-result">
    <p class="eyebrow">Your result</p>
    <h2>${finishedAll ? "You have reached the end of <em>B1</em>" : `Start with <em>${last.step.name}</em>`}</h2>
    <p>${passedSteps.length ? `You passed ${passedSteps.join(", ")}. ` : ""}${finishedAll ? "B2, C1 and C2 are in preparation. Meanwhile, a live lesson with Olivier is the best next step." : `At this step you had ${last.right} of ${last.total} right.`}</p>
    ${!finishedAll && last.wrong.length ? `<p class="quiz-note">This pack teaches, among others:</p><ul class="quiz-skills">${last.wrong.map((w) => `<li>${esc(w.skill)}</li>`).join("")}</ul>` : ""}
    <ul class="pick-list">${(p ? [p] : [live]).map((x) => `<li><span>${x.name}</span><span><strong>${price(x)}</strong> <button class="btn btn-primary mini" ${x.kind === "live" ? `data-book="${x.id}"` : `data-buy="${x.id}"`}>${x.kind === "live" ? "Book" : "Buy"}</button></span></li>`).join("")}</ul>
    <div class="hero-cta tight">
      ${p ? `<button class="btn btn-ghost" data-goto-level="${p.level}">See all ${p.level} packs</button>` : ""}
      <button class="link-btn" data-test>Retake the test</button>
    </div>
  </div>`);
}

document.addEventListener("submit", (e) => {
  if (e.target.id !== "testForm") return;
  e.preventDefault();
  submitTestStep(e.target);
});

// ====== Free module (A0 Module 1) ======
// The server records the address and sends the module at once, with a short presentation
// of the method (emails/module-gratuit.html). Further emails only with the visitor's consent.
function openFree() {
  openModal(`<form class="checkout" id="freeForm" novalidate>
    <p class="eyebrow">Free · A0 Module 1${DEMO ? " · demo" : ""}</p>
    <h2>Letters, Vowels and Introducing Yourself</h2>
    <p>The full first module, free: the PDF with its MP3 audio, and the web edition to do online. It arrives in your inbox within a minute.</p>
    <div class="form-grid">
      <label for="frName">First name<input id="frName" name="name" autocomplete="given-name"></label>
      <label for="frEmail">Email<input id="frEmail" name="email" type="email" required autocomplete="email"></label>
    </div>
    <label class="check"><input type="checkbox" name="marketing"> Also send me French tips and news from Pas à Pas FRENCH. Unsubscribe in one click.</label>
    <p class="form-error" id="freeError" hidden></p>
    <button class="btn btn-primary btn-block" id="freeBtn">Send me Module 1</button>
    <p class="note">No card, nothing to pay. Your address is used as described in our <a href="policies.html#privacy" target="_blank">privacy policy</a>.</p>
  </form>`);
}

async function submitFree(form) {
  const err = $("#freeError"), btn = $("#freeBtn");
  if (!form.frEmail.value || !form.frEmail.checkValidity()) { err.textContent = "Enter a valid email address: the module is sent there."; err.hidden = false; return; }
  const req = { email: form.frEmail.value.trim(), name: form.frName.value.trim(), marketing: form.marketing.checked,
    country: state.country, currency: state.currency };
  const sent = (note = "") => openModal(`<div class="checkout"><p class="eyebrow">Free · A0 Module 1${note}</p><h2>Check your inbox</h2>
    <p>Module 1 is on its way to ${esc(req.email)}. If it is not there in a few minutes, look in the spam or promotions folder.</p>
    <p>While you wait: find your level with the free test.</p>
    <div class="hero-cta tight"><button class="btn btn-primary" data-test>Take the level test</button><button class="btn btn-ghost" data-modal-close>Close</button></div></div>`);
  if (SHOP.api) {
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const r = await fetch(`${SHOP.api}/free-module`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
      if (!r.ok) throw new Error();
      return sent();
    } catch {
      err.textContent = "The module could not be sent just now. Please try again in a moment."; err.hidden = false;
      btn.disabled = false; btn.textContent = "Send me Module 1"; return;
    }
  }
  if (DEMO) return sent(" · demo, nothing was sent");
  const contact = contactHTML();
  openModal(`<div class="checkout"><h2>Opening soon</h2><p>The free module will be sent automatically as soon as the shop opens.</p>
    ${contact ? `<p>${contact}</p>` : ""}<button class="btn btn-ghost" data-modal-close>Close</button></div>`);
}

document.addEventListener("submit", (e) => {
  if (e.target.id !== "freeForm") return;
  e.preventDefault();
  submitFree(e.target);
});

// ====== Reviews ======
// Published automatically: the server checks that the link comes from a real order, runs the
// filter in js/review-filter.js, and publishes at once, whatever the rating. js/reviews.js
// can hold reviews collected elsewhere (with the author's agreement); both lists are shown.
let reviewList = typeof REVIEWS !== "undefined" ? [...REVIEWS] : [];

async function loadReviews() {
  if (SHOP.api) {
    try { reviewList = [...reviewList, ...((await (await fetch(`${SHOP.api}/reviews`)).json()).reviews || [])]; } catch { /* keep the local list */ }
  } else if (DEMO) reviewList = [...reviewList, ...store.get("demoReviews", [])];
  renderReviews();
}

function renderReviews() {
  if (!reviewList.length) { $("#reviews").hidden = true; return; }
  const list = [...reviewList].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const avg = list.reduce((t, r) => t + r.rating, 0) / list.length;
  $("#reviewSummary").textContent = `${avg.toFixed(1)} out of 5 · ${list.length} review${list.length > 1 ? "s" : ""} from verified buyers, all published, good or bad.`;
  $("#reviewList").innerHTML = list.map((r) => `<figure class="review">
    <div class="stars" aria-label="${r.rating} out of 5">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
    <blockquote>${esc(r.text)}</blockquote>
    <figcaption>${esc(r.name)}${r.country ? `, ${esc(r.country)}` : ""}${byId(r.product) ? ` · ${esc(byId(r.product).name)}` : ""} · <span class="verified">Verified purchase</span></figcaption>
    ${r.reply ? `<p class="review-reply"><b>Olivier:</b> ${esc(r.reply)}</p>` : ""}
  </figure>`).join("");
  $("#reviews").hidden = false;
  document.getElementById("reviewLd")?.remove();
  const ld = document.createElement("script");
  ld.type = "application/ld+json"; ld.id = "reviewLd";
  ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Course", name: "Pas à Pas — The Complete Method (A0 to B1)",
    provider: { "@type": "Person", name: "Olivier Djoukang" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: list.length },
    review: list.map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.name }, datePublished: r.date,
      reviewRating: { "@type": "Rating", ratingValue: r.rating }, reviewBody: r.text })) });
  document.head.appendChild(ld);
}

// The link in the review email: ?review=<token>. The token ties the review to one order.
function openReview(token) {
  openModal(`<form class="checkout" id="reviewForm" data-token="${esc(token)}" novalidate>
    <p class="eyebrow">Your review${DEMO ? " · demo" : ""}</p>
    <h2>How is your French going?</h2>
    <div class="star-pick" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="rating" value="${n}"><span aria-hidden="true">★</span><span class="sr-only">${n} star${n > 1 ? "s" : ""}</span></label>`).join("")}</div>
    <label for="rvText">Your review<textarea id="rvText" name="text" rows="5" maxlength="1200" placeholder="What you liked, what was hard, what you can do now."></textarea></label>
    <div class="form-grid">
      <label for="rvName">First name<input id="rvName" name="name" autocomplete="given-name"></label>
      <label for="rvCountry">Country<input id="rvCountry" name="country" autocomplete="country-name" value="${esc(state.country === "Other country" ? "" : state.country)}"></label>
    </div>
    <label class="check"><input type="checkbox" name="consent"> I agree that my review is published on this site with my first name and country.</label>
    <p class="form-error" id="rvError" hidden></p>
    <button class="btn btn-primary btn-block">Publish my review</button>
    <p class="note">Every review is published, good or bad. It is only held back for insults, links or contact details: <a href="policies.html#reviews" target="_blank">review rules</a>.</p>
  </form>`);
}

async function submitReview(form) {
  const d = new FormData(form);
  const r = { token: form.dataset.token, rating: Number(d.get("rating")), text: String(d.get("text") || "").trim(),
    name: String(d.get("name") || "").trim(), country: String(d.get("country") || "").trim(), consent: !!d.get("consent") };
  const problems = reviewProblems(r);
  const err = $("#rvError");
  if (problems.length) { err.innerHTML = problems.map(esc).join("<br>"); err.hidden = false; return; }
  if (SHOP.api) {
    try {
      const res = await fetch(`${SHOP.api}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(r) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { err.innerHTML = esc(out.error || "Your review could not be published."); err.hidden = false; return; }
    } catch { err.textContent = "Your review could not be sent just now. Please try again."; err.hidden = false; return; }
  } else if (DEMO) {
    store.set("demoReviews", [...store.get("demoReviews", []), { ...r, token: undefined, date: new Date().toISOString().slice(0, 10) }]);
  }
  history.replaceState(null, "", location.pathname + location.hash);
  openModal(`<div class="checkout"><h2>Thank you</h2><p>Your review is published.</p><button class="btn btn-primary" data-modal-close>Close</button></div>`);
  reviewList = typeof REVIEWS !== "undefined" ? [...REVIEWS] : [];
  loadReviews();
}

document.addEventListener("submit", (e) => {
  if (e.target.id !== "reviewForm") return;
  e.preventDefault();
  submitReview(e.target);
});

// ====== Events ======
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-buy],[data-level],[data-modal-close],[data-test],[data-goto-level],[data-free]");
  if (!el) return;
  const d = el.dataset;
  if (d.buy) openBuy(d.buy);
  else if (d.level) { state.level = d.level; store.set("level", d.level); renderLevelTabs(); renderLevelPanel(); }
  else if ("modalClose" in d) modal.close();
  else if ("test" in d) { e.preventDefault(); openTest(); }
  else if ("free" in d) { e.preventDefault(); openFree(); }
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
loadReviews();
{ const t = new URLSearchParams(location.search).get("review"); if (t) openReview(t); }
const contact = contactHTML();
if (contact) { $("#contactLine").innerHTML = contact; $("#contactLine").hidden = false; }
$("#year").textContent = new Date().getFullYear();
$("#currency").innerHTML = Object.entries(CURRENCIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
$("#currency").value = state.currency;
renderLevelTabs();
renderPrices();
refreshRates().then(renderPrices);
