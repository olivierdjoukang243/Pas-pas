// ?demo in the address: try purchases and live lessons without paying (this browser only)
const DEMO = /(^|[?&])demo(&|$)/.test(location.search);

// ====== State ======
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem("pap_" + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("pap_" + key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

// ====== Views: the home page stays short; each menu entry opens its own part of the page ======
// Every section stays in the page (search engines and no-JS visitors see it all); the script only
// shows one view at a time: home, levels, inside, exams, live, author, faq (data-view in index.html).
function viewOf(el) {
  const s = el && el.closest && el.closest("main > section[data-view]");
  return s ? s.dataset.view : null;
}
function showView(v) {
  const sections = [...document.querySelectorAll("main > section[data-view]")];
  if (!sections.length) return;
  let first = true;
  sections.forEach((s) => {
    const on = s.dataset.view === v;
    s.classList.toggle("view-off", !on);
    s.classList.toggle("view-first", on && first && !s.hidden);
    if (on && !s.hidden) first = false;
  });
  document.body.dataset.view = v;
  document.querySelectorAll("nav.nav a[href^='#']").forEach((a) => {
    const t = document.getElementById(a.getAttribute("href").slice(1));
    a.classList.toggle("on", v !== "home" && viewOf(t) === v);
  });
  requestAnimationFrame(() => typeof clampAll === "function" && clampAll());
}
// Anything brought into view (a link, a button, ?next=) opens its view first.
const nativeScroll = Element.prototype.scrollIntoView;
Element.prototype.scrollIntoView = function (...args) {
  const v = viewOf(this);
  if (v && document.body.dataset.view !== v) showView(v);
  return nativeScroll.apply(this, args);
};
function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id ? document.getElementById(id) : null;
  const v = viewOf(el) || "home";
  showView(v);
  if (!el || el.classList.contains("view-first")) window.scrollTo(0, 0);
  else nativeScroll.call(el, { block: "start" });
}
window.addEventListener("hashchange", route);
route();

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
  country: store.get("countryChoice", null) || guess.country,   // detected, unless the visitor chose another
  countryDetected: guess.country,
  level: store.get("level", "A0"),
};
if (!CURRENCIES[state.currency]) state.currency = guess.currency;
if (!COUNTRIES.includes(state.country)) state.country = guess.country;
const NAME_TO_CODE = Object.fromEntries(Object.entries(COUNTRY_NAMES).map(([c, n]) => [n, c]));
// A country chosen by the visitor brings its currency, unless a currency was also picked by hand.
if (store.get("countryChoice", null) && !store.get("currencyChoice", null)) state.currency = currencyFor(NAME_TO_CODE[state.country] || "");
const countryChosen = () => !!store.get("countryChoice", null);

// The country of residence is detected; the visitor can choose another one anywhere it is shown.
// It decides the payment methods and, unless a currency was picked by hand, the currency.
function setCountry(name, manual) {
  if (!COUNTRIES.includes(name)) return;
  const before = state.currency;
  state.country = name;
  if (manual) {
    store.set("countryChoice", name === state.countryDetected ? null : name);
    store.set("currencyChoice", null);          // a country chosen by hand brings its own currency
  }
  if (!store.get("currencyChoice", null)) {
    const cur = currencyFor(NAME_TO_CODE[name] || "");
    if (CURRENCIES[cur]) state.currency = cur;
  }
  renderCurrencyPicker();
  renderPrices();
  renderResidence();
  if ($("#checkoutForm")) { renderResidenceCheckout(); renderPayOptions(); }
  if (manual) {
    const methods = methodsFor(name).map(([, m]) => m.label).join(", ");
    announce(`Your country is now set to ${name}. Prices are shown in ${CURRENCIES[state.currency].label}${before !== state.currency ? " (updated)" : ""}, and you can pay with ${methods}.`);
    flashUpdated();
  }
}

// ====== Feedback: every choice shows on the whole page ======
// What needs the visitor's action next comes into view by itself (smoothly, unless reduced motion is asked).
function bringIntoView(el, focusEl) {
  if (!el) return;
  const smooth = !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
  if (focusEl) focusEl.focus({ preventScroll: true });
}
// Any error message that appears in a form is brought into view.
new MutationObserver((changes) => {
  for (const c of changes) if (c.target.classList?.contains("form-error") && !c.target.hidden) bringIntoView(c.target);
}).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["hidden"] });

function announce(text) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite"); }
  // an open dialog sits above the page: the message goes inside it to stay visible
  const host = modal.open ? modal : document.body;
  if (t.parentElement !== host) host.appendChild(t);
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => t.classList.remove("show"), 4500);
}
function flashUpdated() {
  document.querySelectorAll("#levelPanel, #methodBand, #compareTable, #examSoon, #liveGrid, #residenceLine, #payLocal, #payCurrency, #currencyPicker, .checkout .totals, #payMethods")
    .forEach((el) => { el.classList.remove("just-updated"); void el.offsetWidth; el.classList.add("just-updated"); });
}

// ====== Searchable picker (long lists: countries, currencies) ======
const PICKERS = {};
const fold = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function pickerHTML(id, { label, options, value, name, onChange }) {
  PICKERS[id] = { options, onChange };
  const cur = options.find((o) => o.value === value) || { label: value };
  return `<div class="picker" data-picker="${id}">
    <input type="hidden" id="${id}" ${name ? `name="${name}"` : ""} value="${esc(value)}">
    <button type="button" class="picker-btn" id="${id}-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(label)}: ${esc(cur.label)}">
      <span>${esc(cur.label)}</span><span aria-hidden="true">▾</span></button>
    <div class="picker-pop" hidden>
      <input type="search" class="picker-search" placeholder="Search…" aria-label="Search ${esc(label)}" autocomplete="off">
      <ul class="picker-list" role="listbox" aria-label="${esc(label)}"></ul>
    </div>
  </div>`;
}
function pickerFill(box, q = "") {
  const { options } = PICKERS[box.dataset.picker];
  const v = box.querySelector('input[type="hidden"]').value, f = fold(q.trim());
  const list = options.filter((o) => !f || fold(o.label + " " + (o.keys || "")).includes(f));
  box.querySelector(".picker-list").innerHTML = list.length
    ? list.map((o, i) => `<li role="option" data-value="${esc(o.value)}" aria-selected="${o.value === v}" class="${i === 0 && f ? "active" : ""}">${esc(o.label)}${o.hint ? ` <small>${esc(o.hint)}</small>` : ""}</li>`).join("")
    : `<li class="none">No matches</li>`;
}
function pickerOpen(box, open) {
  document.querySelectorAll(".picker-pop:not([hidden])").forEach((p) => { if (p.parentElement !== box) { p.hidden = true; p.parentElement.querySelector(".picker-btn").setAttribute("aria-expanded", "false"); } });
  const pop = box.querySelector(".picker-pop");
  pop.hidden = !open;
  box.querySelector(".picker-btn").setAttribute("aria-expanded", String(open));
  if (open) {
    const s = box.querySelector(".picker-search"); s.value = ""; pickerFill(box);
    s.focus();
    box.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
  }
}
function pickerChoose(box, value) {
  pickerOpen(box, false);
  box.querySelector('input[type="hidden"]').value = value;
  box.querySelector(".picker-btn").focus();
  PICKERS[box.dataset.picker].onChange?.(value);
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".picker-btn");
  if (btn) { const box = btn.closest(".picker"); pickerOpen(box, box.querySelector(".picker-pop").hidden); return; }
  const li = e.target.closest(".picker-list li[data-value]");
  if (li) { pickerChoose(li.closest(".picker"), li.dataset.value); return; }
  if (!e.target.closest(".picker")) document.querySelectorAll(".picker").forEach((b) => { if (!b.querySelector(".picker-pop").hidden) pickerOpen(b, false); });
});
document.addEventListener("input", (e) => { if (e.target.classList.contains("picker-search")) pickerFill(e.target.closest(".picker"), e.target.value); });
document.addEventListener("keydown", (e) => {
  const box = e.target.closest?.(".picker");
  if (!box || box.querySelector(".picker-pop").hidden) return;
  const items = [...box.querySelectorAll(".picker-list li[data-value]")];
  let i = items.findIndex((x) => x.classList.contains("active"));
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    i = e.key === "ArrowDown" ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1);
    items.forEach((x, k) => x.classList.toggle("active", k === i));
    items[i]?.scrollIntoView({ block: "nearest" });
  } else if (e.key === "Enter") {
    e.preventDefault();
    const pick = items[i] || (items.length === 1 ? items[0] : null);
    if (pick) pickerChoose(box, pick.dataset.value);
  } else if (e.key === "Escape") { e.preventDefault(); pickerOpen(box, false); box.querySelector(".picker-btn").focus(); }
});

const COUNTRY_OPTIONS = () => COUNTRIES.map((c) => ({ value: c, label: c, keys: NAME_TO_CODE[c] || "" }));
const currencyName = (() => { try { const dn = new Intl.DisplayNames(["en"], { type: "currency" }); return (c) => dn.of(c); } catch { return (c) => c; } })();
function renderCurrencyPicker() {
  const box = $("#currencyPicker");
  if (!box) return;
  box.innerHTML = pickerHTML("currency", { label: "Currency", value: state.currency,
    options: Object.entries(CURRENCIES).map(([k, c]) => ({ value: k, label: c.label, hint: c.perUSD ? "estimate" : "", keys: currencyName(k) })),
    onChange: (v) => {
      state.currency = v; store.set("currencyChoice", v);
      renderCurrencyPicker(); renderPrices(); if ($("#checkoutForm")) renderPayDetails();
      announce(`Prices are now shown in ${CURRENCIES[v].label}.${["USD", "XAF", "XOF"].includes(v) ? "" : " These are estimates. You'll be charged in US dollars or FCFA."}`);
      flashUpdated();
    } });
}

const residenceNote = () => countryChosen() ? "your choice" : "detected automatically";

function renderResidence() {
  const box = $("#residenceLine");
  if (!box) return;
  box.innerHTML = `<div class="res-field"><span class="res-label" id="resCountryLabel">Your country of residence <small>(${residenceNote()})</small></span>
    ${pickerHTML("resCountry", { label: "Country of residence", options: COUNTRY_OPTIONS(), value: state.country, onChange: (v) => setCountry(v, true) })}</div>
    <span>Ways to pay: ${methodsFor(state.country).map(([, m]) => m.label).join(", ")}.</span>`;
  renderPayLocal();
}

const localFCFA = () => methodsFor(state.country).some(([, m]) => m.phone);

// What the visitor's currency means for them: exact price, or an estimate of a US dollar charge.
function renderPayCurrency() {
  const box = $("#payCurrency");
  if (!box) return;
  const c = state.currency, label = CURRENCIES[c].label;
  const exact = c === "USD" || ((c === "XAF" || c === "XOF") && localFCFA());
  box.innerHTML = `<h3>Your currency: ${esc(label)}</h3><p>${c === "USD"
    ? "Prices are shown in US dollars, the currency used for card and PayPal payments."
    : exact ? `Prices are shown in ${esc(label)}. This is the exact amount you'll pay with local payment methods. Card and PayPal payments are charged in US dollars.`
    : `Prices in ${esc(label)} are estimates${CURRENCIES[c].perUSD ? ", updated daily" : ""}. Card and PayPal payments are charged in US dollars, and your bank handles the conversion.`}
    You can change the currency at the top of the page.</p>`;
}

// The local methods of the visitor's country of residence, and only that country.
function renderPayLocal() {
  const box = $("#payLocal");
  if (!box) return;
  const local = methodsFor(state.country).filter(([, m]) => m.countries);
  box.hidden = !local.length;
  if (!local.length) return;
  box.innerHTML = `<h3>${esc(state.country)}</h3>
    <p>Pay with ${local.map(([, m]) => m.label).join(" or ")} in ${local.some(([, m]) => m.phone) ? "FCFA" : "local currency"}, then confirm the payment on your phone.</p>
    <div class="chips">${local.map(([k, m]) => `<span class="chip chip-${k}">${m.label}</span>`).join("")}</div>`;
}

function renderResidenceCheckout() {
  const box = $("#coResidence");
  if (!box) return;
  box.innerHTML = `<div class="res-field"><span class="res-label">Country of residence <small>(${residenceNote()})</small></span>
    ${pickerHTML("coCountry", { label: "Country of residence", name: "country", options: COUNTRY_OPTIONS(), value: state.country, onChange: (v) => setCountry(v, true) })}</div>`;
}
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
  // FCFA is an exact price only where a local method charges it; elsewhere the card pays in US dollars
  if (currency === "XAF" || currency === "XOF") return (localFCFA() ? "" : "≈ ") + fmtXAF(xaf);
  if (currency === "EUR") return "≈ " + fmtMoney(xaf / XAF_PER_EUR, "EUR");
  return "≈ " + fmtMoney(usd * CURRENCIES[currency].perUSD, currency);
}
const price = (p) => amount(p.usd, p.xaf);
// Short product name for notes: "A1 Part 1", "A0".
const shortName = (x) => (x.kind === "part" ? `${x.level} Part ${x.part}` : x.level);

// Pre-order: not deliverable yet, paid now and sent as soon as it is ready (policies, 2-3).
const isPre = (p) => p.ready === false && !!p.preorder;
// Ready on the site but not yet in the shop's stock (server /stock): shown "Coming soon", not sold.
const SOON = new Set();
const buyable = (p) => (p.ready !== false && !SOON.has(p.id)) || isPre(p);
const waitTag = (p) => SOON.has(p.id) ? "Coming soon" : "In preparation";
const buyLabel = (p) => isPre(p) ? "Pre-order" : "Buy";
// The parts of a pack already deliverable: sent at once with a pre-order of the pack.
const readyParts = (p) => p.kind === "level" ? PRODUCTS.filter((x) => x.level === p.level && x.kind === "part" && x.ready !== false && !SOON.has(x.id))
  : p.kind === "method" ? PRODUCTS.filter((x) => ["part", "level"].includes(x.kind) && x.ready !== false && !SOON.has(x.id) && !(x.kind === "part" && PRODUCTS.some((l) => l.kind === "level" && l.level === x.level && l.ready !== false))) : [];
const PRE_NOTE = "We'll email your files as soon as they're ready, and you can cancel for a full refund until then.";

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
    <b>${l.name.replace(/ (\d)$/, "\u00a0$1")}</b><span>${l.code}${l.status === "prep" ? " · In preparation" : ""}</span></button>`).join("");
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
    </ol>${g.data.bilan ? `<p class="mod-bilan">${/^level check/i.test(g.data.bilan.titre) ? g.data.bilan.titre.replace(/^level check/i, "Progress test") : `Progress test · ${g.data.bilan.titre}`}</p>` : ""}`).join("");
  return `<details class="mods"><summary>See all ${count} modules</summary>${lists}</details>`;
}

function productRow(p) {
  const saving = p.kind === "level" ? levelSaving(p.level) : null;
  return `<li class="prod">
    <div class="prod-body">
      <strong>${p.name}</strong>
      <small>${p.contents}${saving ? ` · <span class="ok">save ${amount(saving.usd, saving.xaf)} vs. buying both parts</span>` : ""}</small>
      <p>${p.desc}</p>
      ${modulesHTML(p)}
    </div>
    <div class="prod-buy">
      <span class="price">${price(p)}</span>
      ${!buyable(p) ? `<span class="tag soon">${waitTag(p)}</span>` : `<button class="btn ${p.kind === "level" ? "btn-primary" : "btn-ghost"} mini" data-buy="${p.id}">${buyLabel(p)}</button>`}
      ${isPre(p) ? `<span class="pre-note">${readyParts(p).length ? `${readyParts(p).map((x) => shortName(x)).join(", ")} can already be bought on its own. This pre-order sends the whole level as soon as the last part is illustrated, and you can cancel for a full refund until then.` : `Illustrations are in progress. ${PRE_NOTE}`}</span>` : ""}
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
    $("#levelPanel").innerHTML = head + `<div class="lp-empty"><p>${l.code} isn't on sale yet. Levels A0 to B1 are available now.</p>
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
      <p class="method-meta">${m.contents} · <span>${amount(s.usd, s.xaf)} less than buying the four levels separately</span></p>
    </div>
    <div class="method-buy">
      <span class="price">${price(m)}</span>
      ${!buyable(m) ? `<span class="tag soon">${SOON.has(m.id) ? "Coming soon" : "In preparation: on sale once every level is illustrated"}</span>` : `<button class="btn btn-light" data-buy="${m.id}">${isPre(m) ? "Pre-order the Complete Method" : "Buy the Complete Method"}</button>`}
      ${isPre(m) ? `<span class="pre-note light">${readyParts(m).map((x) => shortName(x)).join(", ")} can already be bought level by level. This pre-order sends the whole method as soon as the last level is illustrated, and you can cancel for a full refund until then.</span>` : ""}
    </div>`;
}

// Categories, not brands: what each kind of tool usually offers.
function renderCompare() {
  const rows = [
    ["How you pay", `One payment, from ${price(byId("a0-complete"))}, and the files are yours to keep`, "Monthly or yearly subscription", "Pay by the hour, every lesson"],
    ["Grammar explained in English", "Yes, in every module", "Short tips, mostly practice", "Depends on the tutor"],
    ["Step-by-step course with progress tests", "56 modules, 7 progress tests, A0 to B1", "Yes, in the app", "Depends on the tutor"],
    ["Works offline", "PDFs and MP3s on any device", "Partly, in the app", "No"],
    ["Answer keys to keep", "For every exercise", "Instant grading, nothing to keep", "Depends on the tutor"],
    ["Talk with a teacher", `Optional live lessons, from ${price(byId("live-30"))}`, "Rarely", "Yes"],
    ["Exam practice tests", "DELF A1 to B2 and all five TCF versions, timed like the real exam", "Rarely", "Depends on the tutor"],
    ["Try before you buy", "All of Module 1, free", "Free version or trial, then a subscription", "Sometimes a trial lesson"],
    ["Pay the way you're used to", "Card and PayPal worldwide, plus local payment methods where you live", "Card or app store", "Varies"],
  ];
  $("#compareTable").innerHTML = `<table class="compare">
    <thead><tr><th scope="col"><span class="sr-only">Feature</span></th><th scope="col" class="us">Pas à Pas FRENCH</th><th scope="col">Language apps</th><th scope="col">Hourly tutors</th></tr></thead>
    <tbody>${rows.map(([k, a, b, c]) => `<tr><th scope="row">${k}</th><td class="us">${a}</td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody>
  </table>`;
}

function examFormat(f) {
  if (typeof EXAM_FORMATS === "undefined" || !f) return null;
  const x = (EXAM_FORMATS[f[0]] || {})[f[1]];
  return x || null;
}

function formatHTML(x) {
  if (!x) return "";
  return `<details class="exam-format"><summary>Test format</summary>
    <table>${x.papers.map((p) => `<tr><th>${p.name}<span>${p.time}${p.marks ? ` · /${p.marks}` : ""}${p.prep ? `<br>preparation time: ${p.prep}` : ""}</span></th><td>${p.detail}</td></tr>`).join("")}</table>
    <p>${x.written ? `Written sections: ${x.written} in one sitting. ` : ""}${x.pass}.</p>
    ${x.nclc ? `<p class="nclc-target"><strong>${x.nclc.target}</strong></p>
    <div class="nclc-wrap"><table class="nclc"><tr><th>NCLC</th>${x.nclc.rows.map((r) => `<th>${r.name}</th>`).join("")}</tr>
    ${x.nclc.levels.map((l, i) => `<tr${l === "7" ? ' class="t7"' : ""}><th>${l}</th>${x.nclc.rows.map((r) => `<td>${r.scores[i]}</td>`).join("")}</tr>`).slice().reverse().join("")}</table></div>
    <p>${x.nclc.note} Source: ${x.nclc.source}.</p>` : ""}</details>`;
}

function renderExams() {
  $("#examSoon").innerHTML = EXAM_PACKS.map((p) => `<div class="pay-card exam-card" data-group="${p.level === "TCF" ? "tcf" : "delf"}">
    <span class="tag${isPre(p) ? " pre" : buyable(p) ? "" : " soon"}">${isPre(p) ? "Pre-order" : buyable(p) ? p.level : waitTag(p)}</span>
    <h3>${p.exam}</h3>
    ${(examFormat(p.format) || {}).official ? `<p class="exam-official" lang="fr">${examFormat(p.format).official}</p>` : ""}
    <p class="exam-levels">${p.contents}</p>
    <p>${p.desc}</p>
    ${formatHTML(examFormat(p.format))}
    <div class="exam-buy"><span class="price">${price(p)}</span>${buyable(p) ? `<button class="btn btn-primary mini" data-buy="${p.id}">${buyLabel(p)}</button>` : `<span class="exam-wait">Not on sale yet</span>`}</div>
    ${isPre(p) ? `<p class="pre-note">The tests are being written. ${PRE_NOTE}</p>` : ""}
  </div>`).join("") + EXAMS_SOON.map((e) => `<div class="pay-card exam-card" data-group="delf">
    <span class="tag soon">Coming soon</span>
    <h3>${e.name}</h3>
    <p class="exam-levels">${e.levels}</p>
    <p>${e.note}</p>
    ${formatHTML(examFormat(e.format))}
  </div>`).join("");
}

function renderLive() {
  const one = byId("live-60");
  $("#liveGrid").innerHTML = LIVE.filter((p) => !p.plan).map((p) => `<div class="pay-card live-card">
    <h3>${p.name}</h3>
    <p>${p.desc}</p>
    <span class="price">${price(p)}</span>
  </div>`).join("");
  const plans = LIVE.filter((p) => p.plan), box = $("#livePlans");
  if (!box || !plans.length) return;
  box.innerHTML = `<div class="plans-head"><p class="eyebrow">Plans</p><h3>Learn every week and pay less per lesson</h3>
    <p>Book your lessons yourself, whenever it suits you over each 2-month period. 7 days before the end, we email you a link to renew it with a fresh set of lessons. No renewal, no charge: it simply stops.</p></div>
    <div class="plans">${plans.map((p) => { const save = Math.round(100 * (1 - p.usd / p.lessons / one.usd));
      return `<div class="pay-card plan-card${p.best ? " best" : ""}">${p.best ? `<span class="tag best">Most popular</span>` : ""}
      <h4>${p.name.split(" · ")[0]}</h4><p class="plan-n"><b>${p.lessons} lessons</b> of 60 minutes every 2 months · ${p.contents.toLowerCase()}</p>
      <p class="plan-price"><span class="price">${price(p)}</span> <small>every 2 months</small></p>
      <p class="plan-per">${amount(p.usd / p.lessons, p.xaf / p.lessons)} per lesson · <span class="ok">save ${save}%</span></p>
      <p>${p.desc}</p>
      <button class="btn ${p.best ? "btn-primary" : "btn-ghost"} mini" data-book="${p.id}">Choose this plan</button></div>`; }).join("")}</div>
    <p class="note">Unused lessons don't carry over to the next 2-month period, so book them as you go. You can stop the renewal at any time in one click from “My courses”.</p>`;
}

// Amounts written in the page text follow the chosen currency too, computed from the catalogue.
function renderSavings() {
  document.querySelectorAll("[data-saving]").forEach((el) => {
    const s = el.dataset.saving === "method" ? methodSaving() : levelSaving("A1");
    if (s) el.textContent = amount(s.usd, s.xaf);
  });
}
function renderPrices() { renderLevelPanel(); renderMethod(); renderCompare(); renderExams(); renderLive(); renderSavings(); renderPayCurrency(); }

// ====== Dialogs ======
const modal = $("#modal");
function openModal(html) {
  $("#modalBody").innerHTML = `<button class="icon-btn modal-close" data-modal-close aria-label="Close">✕</button>${html}`;
  if (!modal.open) modal.showModal();
}

const whatsappLink = (text) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;

function contactHTML() {
  const bits = [];
  if (SHOP.email) bits.push(`by email at <a href="mailto:${SHOP.email}">${SHOP.email}</a>`);
  if (SHOP.whatsapp) bits.push(`on WhatsApp at <a href="https://wa.me/${SHOP.whatsapp}" target="_blank" rel="noopener">+${SHOP.whatsapp}</a>`);
  return bits.length ? `Until online payment opens, you can order ${bits.join(" or ")}.` : "";
}

// Cameroon: MTN MoMo, Orange Money, card and PayPal. Elsewhere: card and PayPal.
const methodsFor = (country) => Object.entries(PAY_METHODS).filter(([, m]) => !m.countries || m.countries.includes(country));

let checkoutDraft = null;   // a live lesson being booked, set by live.js

function openBuy(id, draft = null) {
  const p = byId(id);
  if (!p || !buyable(p)) return;      // a product that can be neither delivered nor pre-ordered is never sold
  const pre = isPre(p);
  checkoutDraft = draft;
  openModal(`<form class="checkout" id="checkoutForm" data-product="${p.id}" novalidate>
    <p class="eyebrow">${pre ? "Pre-order · " : ""}${p.level === "A0–B1" ? "A0 to B1" : p.level}${DEMO ? " · demo" : ""}</p>
    <h2>${p.name}</h2>
    <p>${draft ? `${localDay(draft.start)}, ${localTime(draft.start)} your time · ${draft.minutes} min · ${draft.need}` : p.contents}</p>
    <div class="form-grid">
      ${p.kind === "live" ? "" : `<label for="coName">Your name (printed on your files)<input id="coName" name="name" type="text" maxlength="80" autocomplete="name"></label>`}
      <label for="coEmail">Email (your ${p.kind === "live" ? "booking confirmation" : "files"} will be sent here)<input id="coEmail" name="email" type="email" required autocomplete="email" value="${draft ? draft.email : ""}"></label>
      <div id="coResidence"></div>
    </div>
    <p class="eyebrow pm-title">Payment method</p>
    <div class="pay-methods" id="payMethods" role="radiogroup" aria-label="Payment method"></div>
    <div id="payDetails"></div>
    <div class="totals" id="coTotals"></div>
    <label class="check"><input type="checkbox" name="terms" id="coTerms"> ${p.kind === "live"
      ? (p.plan ? `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#live" target="_blank">live lesson rules</a>. I understand that my plan lasts 2 months, that unused lessons don't carry over, and that I can renew it with the link emailed 7 days before the end (if I don't, it simply stops).`
        : `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#live" target="_blank">live lesson rules</a> (free rescheduling up to 24 hours before the lesson).`)
      : pre ? `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#licence" target="_blank">licence</a>. I understand that this is a pre-order. The files will be sent as soon as they're ready, and I can cancel for a full refund until then.`
      : `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#licence" target="_blank">licence</a>. I want the files delivered immediately, and I understand that this means I lose my right of withdrawal.`}</label>
    <p class="form-error" id="formError" hidden></p>
    <button class="btn btn-primary btn-block" id="payBtn"></button>
    <p class="note">${p.plan ? `Payment confirms your first lesson and starts your plan for 2 months. You book the other lessons yourself in “My courses”. 7 days before the end, we email you a link to renew it at ${price(p)}.` : p.kind === "live" ? "Payment confirms your lesson and holds the time for you." : pre ? `This is a pre-order. ${PRE_NOTE} If it isn't delivered within 90 days, you'll be refunded unless you choose to wait.` : "Because the files are delivered instantly, all sales are final. If a file is faulty, we'll replace it."}</p>
  </form>`);
  renderResidenceCheckout();
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
  $("#payDetails").innerHTML = m.phone ? `<label for="coMomo">${m.label} phone number
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
  if (!form.coEmail.value || !form.coEmail.checkValidity()) msg = "Please enter a valid email address so we can send you your order.";
  else if (!form.coTerms.checked) msg = "Please accept the terms of sale to continue.";
  else if (m.phone && !CM_MOBILE.test(String(data.get("momo")).replace(/[\s.-]/g, ""))) msg = `Please enter a Cameroonian mobile number for ${m.label}. It should have 9 digits and start with 6 (for example, 677 12 34 56).`;
  if (msg) { err.textContent = msg; err.hidden = false; return; }

  if (data.get("country") !== state.country) setCountry(data.get("country"), true);
  const inFCFA = state.country === "Cameroon" || m.phone;
  const charged = inFCFA ? fmtXAF(p.xaf) : fmtUSD(p.usd);
  const order = { product: p.id, email: data.get("email"), name: String(data.get("name") || (checkoutDraft && checkoutDraft.name) || "").trim(),
    country: state.country, method: data.get("pay"),
    phone: m.phone ? String(data.get("momo")).replace(/[\s.-]/g, "") : "",
    currency: inFCFA ? "XAF" : "USD", amount: inFCFA ? p.xaf : p.usd, preorder: isPre(p), booking: checkoutDraft };

  // Live payment: the server creates the Notch Pay transaction and sends back its page.
  if (PAY_API) return payOnline(order);
  // Demo: nothing is charged; a live lesson is booked in this browser only.
  if (DEMO) {
    if (checkoutDraft) return bookedScreen(confirmBooking(checkoutDraft, "demo"));
    return openModal(`<div class="checkout"><p class="eyebrow">Demo · nothing was charged</p><h2>Payment accepted</h2>
      <p>In the real shop, ${p.name} would now be ${order.preorder ? "reserved for" : "sent to"} ${order.email}${order.preorder ? ", and sent as soon as it's ready" : ""}.</p><button class="btn btn-primary" data-modal-close>Done</button></div>`);
  }
  const contact = contactHTML();
  const wa = SHOP.whatsapp ? whatsappLink(`Hello, I'd like to ${order.preorder ? "pre-order" : "buy"} "${p.name}" (${charged}), paying with ${m.label}. My email: ${data.get("email")}`) : "";
  openModal(`<div class="checkout">
    <h2>Online payment is coming soon</h2>
    <p>Payment by ${m.label} isn't available on the site yet, so you haven't been charged.</p>
    ${wa ? `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">Send this order via WhatsApp</a>` : ""}
    ${contact ? `<p>${contact}</p>` : ""}
    <button class="btn btn-ghost" data-modal-close>Close</button>
  </div>`);
}

async function payOnline(order) {
  const btn = $("#payBtn"), err = $("#formError");
  btn.disabled = true; btn.textContent = "Opening the secure payment page…";
  try {
    const r = await fetch(`${PAY_API}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, return_url: location.href.split(/[?#]/)[0] }) });
    const d = await r.json().catch(() => ({}));
    // A refusal explained by the server (method not open yet, wrong number…) is shown as is.
    if (!r.ok && d.error) { err.textContent = d.error; err.hidden = false; btn.disabled = false; renderPayDetails(); return; }
    if (!d.authorization_url) throw new Error("no payment page");
    location.href = d.authorization_url;
  } catch (e) {
    err.textContent = "We couldn't open the payment page. You haven't been charged. Please try again in a moment.";
    err.hidden = false; btn.disabled = false; renderPayDetails();
  }
}

// Back from the payment page: the server tells whether the payment is complete. The files take a
// few seconds to prepare (watermarked for the buyer): the page waits for them, then offers the course.
async function checkReturn() {
  const ref = new URLSearchParams(location.search).get("paid");
  if (!ref || !PAY_API) return;
  history.replaceState(null, "", location.pathname + location.hash);
  try {
    let d;
    for (let i = 0; i < 15; i++) {
      d = await (await fetch(`${PAY_API}/payments/${encodeURIComponent(ref)}`)).json();
      if (d.status !== "complete" || d.booking || d.preorder || d.delivery !== "preparing") break;
      if (i === 0) openModal(`<div class="checkout"><h2>Payment received</h2><p>${d.live ? "We're writing your lesson in Olivier's calendar." : "We're adding your name to your files."} This only takes a few seconds…</p></div>`);
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (d.status !== "complete") {
      return openModal(`<div class="checkout"><h2>Payment not completed</h2><p>You haven't been charged, and you can try again whenever you're ready.</p><button class="btn btn-primary" data-modal-close>Close</button></div>`);
    }
    if (d.booking) return paidBooking(d);
    if (d.preorder) return openModal(`<div class="checkout"><h2>Thank you</h2><p>Your payment went through and your pre-order is confirmed. We'll send the files to ${esc(d.email)} as soon as they're ready, and you can cancel for a full refund until then.</p><button class="btn btn-primary" data-modal-close>Done</button></div>`);
    if (d.account_url) return openModal(`<div class="checkout"><h2>Thank you</h2><p>Your payment went through and your course is ready. Start reading online now, and pick up where you left off at any time over the next 12 months. We've also emailed the link and the download to ${esc(d.email)}.</p>
      <a class="btn btn-primary" href="${esc(d.account_url)}">Open my course</a> <button class="btn btn-ghost" data-modal-close>Later</button></div>`);
    openModal(`<div class="checkout"><h2>Thank you</h2><p>Your payment went through. Your files will be emailed to ${esc(d.email)} shortly.</p><button class="btn btn-primary" data-modal-close>Done</button></div>`);
  } catch {
    openModal(`<div class="checkout"><h2>Checking your payment…</h2><p>We can't confirm it just yet. You'll get an email as soon as it goes through.</p><button class="btn btn-primary" data-modal-close>Close</button></div>`);
  }
}

// Buyers come back to their courses ("My courses", top right), once the payment server exists:
// they sign in with the email used at checkout and receive a sign-in link (no password).
if (PAY_API && $("#accountLink")) {
  $("#accountLink").href = `${PAY_API}/account`;
  $("#accountLink").hidden = false;
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
    ${testStep === 0 ? `<p class="quiz-note">Type just the answer. Accents and capital letters don't matter, and you can leave a question blank if you don't know.</p>` : ""}
    ${testStep === 1 ? `<p class="quiz-note">From here on, the instructions are in French, just as in the course. The example shows you what to write.</p>` : ""}
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
    <h2>${finishedAll ? "You've reached the end of <em>B1</em>" : `Start with <em>${last.step.name}</em>`}</h2>
    <p>${passedSteps.length ? `You passed ${passedSteps.join(", ")}. ` : ""}${finishedAll ? "B2, C1 and C2 are in preparation. In the meantime, a live lesson with Olivier is the best next step." : `You got ${last.right} out of ${last.total} right at this step.`}</p>
    ${!finishedAll && last.wrong.length ? `<p class="quiz-note">Among other things, this course covers:</p><ul class="quiz-skills">${last.wrong.map((w) => `<li>${esc(w.skill)}</li>`).join("")}</ul>` : ""}
    <ul class="pick-list">${(p ? (p.ready === false ? [p, live] : [p]) : [live]).map((x) => `<li><span>${x.name}</span><span><strong>${price(x)}</strong> ${!buyable(x) ? `<span class="tag soon">In preparation</span>` : `<button class="btn btn-primary mini" ${x.kind === "live" ? `data-book="${x.id}"` : `data-buy="${x.id}"`}>${x.kind === "live" ? "Book" : buyLabel(x)}</button>`}</span></li>`).join("")}</ul>
    ${p && p.ready === false ? `<p class="quiz-note">${isPre(p) ? `This course is still being illustrated. Pre-order it now and we'll send it as soon as it's ready, with a full refund if you cancel before then.` : "This course is still being illustrated and isn't on sale yet."} In the meantime, a live lesson with Olivier can focus on exactly these points.</p>` : ""}
    <div class="hero-cta tight">
      ${p ? `<button class="btn btn-ghost" data-goto-level="${p.level}">See all ${p.level} courses</button>` : ""}
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
    <p>Get the complete first module free: the PDF with MP3 audio, plus a web version you can work through online. It arrives in your inbox within a minute.</p>
    <div class="form-grid">
      <label for="frName">First name<input id="frName" name="name" autocomplete="given-name"></label>
      <label for="frEmail">Email<input id="frEmail" name="email" type="email" required autocomplete="email"></label>
    </div>
    <label class="check"><input type="checkbox" name="marketing"> Also send me French tips and news from Pas à Pas FRENCH. You can unsubscribe at any time in one click.</label>
    <p class="form-error" id="freeError" hidden></p>
    <button class="btn btn-primary btn-block" id="freeBtn">Send me Module 1</button>
    <p class="note">No card needed and nothing to pay. We use your email address as described in our <a href="policies.html#privacy" target="_blank">privacy policy</a>.</p>
  </form>`);
}

async function submitFree(form) {
  const err = $("#freeError"), btn = $("#freeBtn");
  if (!form.frEmail.value || !form.frEmail.checkValidity()) { err.textContent = "Please enter a valid email address so we can send you the module."; err.hidden = false; return; }
  const req = { email: form.frEmail.value.trim(), name: form.frName.value.trim(), marketing: form.marketing.checked,
    country: state.country, currency: state.currency };
  const sent = (note = "") => openModal(`<div class="checkout"><p class="eyebrow">Free · A0 Module 1${note}</p><h2>Check your inbox</h2>
    <p>Module 1 is on its way to ${esc(req.email)}. If it isn't there in a few minutes, check your spam or promotions folder.</p>
    <p>While you wait, why not find your level with the free test?</p>
    <div class="hero-cta tight"><button class="btn btn-primary" data-test>Take the level test</button><button class="btn btn-ghost" data-modal-close>Close</button></div></div>`);
  if (PAY_API) {
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const r = await fetch(`${PAY_API}/free-module`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
      if (!r.ok) throw { said: (await r.json().catch(() => ({}))).error };
      return sent();
    } catch (e) {
      err.textContent = (e && e.said) || "We couldn't send the module just now. Please try again in a moment."; err.hidden = false;
      btn.disabled = false; btn.textContent = "Send me Module 1"; return;
    }
  }
  if (DEMO) return sent(" · demo, nothing was sent");
  const contact = contactHTML();
  openModal(`<div class="checkout"><h2>Coming soon</h2><p>The free module will be sent automatically once the shop opens.</p>
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
  $("#reviewSummary").textContent = `${avg.toFixed(1)} out of 5 from ${list.length} review${list.length > 1 ? "s" : ""} by verified buyers. Every review is published, good or bad.`;
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
    <label for="rvText">Your review<textarea id="rvText" name="text" rows="5" maxlength="1200" placeholder="What did you like? What was hard? What can you do now?"></textarea></label>
    <div class="form-grid">
      <label for="rvName">First name<input id="rvName" name="name" autocomplete="given-name"></label>
      <label for="rvCountry">Country<input id="rvCountry" name="country" autocomplete="country-name" value="${esc(state.country === "Other country" ? "" : state.country)}"></label>
    </div>
    <label class="check"><input type="checkbox" name="consent"> I agree to have my review published on this site with my first name and country.</label>
    <p class="form-error" id="rvError" hidden></p>
    <button class="btn btn-primary btn-block">Publish my review</button>
    <p class="note">Every review is published, good or bad. A review is only held back if it contains insults, links or contact details. See the <a href="policies.html#reviews" target="_blank">review rules</a>.</p>
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
      if (!res.ok) { err.innerHTML = esc(out.error || "We couldn't publish your review."); err.hidden = false; return; }
    } catch { err.textContent = "We couldn't send your review just now. Please try again."; err.hidden = false; return; }
  } else if (DEMO) {
    store.set("demoReviews", [...store.get("demoReviews", []), { ...r, token: undefined, date: new Date().toISOString().slice(0, 10) }]);
  }
  history.replaceState(null, "", location.pathname + location.hash);
  openModal(`<div class="checkout"><h2>Thank you</h2><p>Your review has been published.</p><button class="btn btn-primary" data-modal-close>Close</button></div>`);
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
  else if (d.level) { state.level = d.level; store.set("level", d.level); renderLevelTabs(); renderLevelPanel();
    if (d.scroll) $("#" + d.scroll).scrollIntoView({ behavior: "smooth" }); }
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
  if (e.target.name === "pay") {
    renderPayDetails();
    if ($("#coMomo")) bringIntoView($("#coMomo"), $("#coMomo"));   // the number to type comes into view
  }
});
modal.addEventListener("submit", (e) => {
  if (e.target.id === "checkoutForm") { e.preventDefault(); submitCheckout(e.target); }
});


lookupCountry().then((code) => {
  if (!code) return;
  const loc = localeFor(code);
  state.countryDetected = loc.country;
  if (countryChosen()) return renderResidence();
  setCountry(loc.country, false);   // also sets the currency of that country, unless one was picked by hand
});


// ====== Start ======
renderResidence();
loadReviews();
{ const t = new URLSearchParams(location.search).get("review"); if (t) openReview(t); }
// ?next=<product id> or ?next=live: the "Your next step" button at the end of every module,
// level check and self-assessment (workshop: etape_suivante.py) lands on what comes next.
function openNext(id) {
  if (id === "live") return bringIntoView($("#live"));
  const p = byId(id);
  if (!p) return;
  if (p.kind === "exam") {
    const tab = document.querySelector(`[data-exam-tab="${p.level === "TCF" ? "tcf" : "delf"}"]`);
    if (tab) tab.click();
    return bringIntoView($("#exams"));
  }
  if (p.kind === "method") return bringIntoView($("#method") || $("#levels"));
  state.level = p.level; store.set("level", p.level); renderLevelTabs(); renderLevelPanel();
  const row = document.querySelector(`#levelPanel [data-buy="${p.id}"]`);
  bringIntoView(row ? row.closest("li") || row : $("#levels"));
}
const contact = contactHTML();
if (contact) { $("#contactLine").innerHTML = contact; $("#contactLine").hidden = false; }
$("#year").textContent = new Date().getFullYear();
renderCurrencyPicker();
renderLevelTabs();
renderPrices();
refreshRates().then(renderPrices);
// The shop server says which ready courses aren't in stock yet: those show "Coming soon".
if (PAY_API) fetch(`${PAY_API}/stock`).then((r) => r.json()).then((d) => {
  (d.soon || []).forEach((id) => SOON.add(id));
  if (SOON.size) { renderLevelPanel(); renderMethod(); renderCompare(); }
}).catch(() => { /* the server refuses unstocked courses anyway */ });
{ const n = new URLSearchParams(location.search).get("next"); if (n) setTimeout(() => openNext(n), 300); }

// ====== Long texts: first lines shown, "Read more" unfolds the rest (nothing is removed) ======
const CLAMPED = ".prod-body > p, .exam-card > p:not(.exam-levels):not(.exam-official):not(.pre-note), .motive > p:not(.motive-tag):not(.motive-path), .clamp-me";
function clampAll() {
  document.querySelectorAll(CLAMPED).forEach((el) => {
    if (el.dataset.clamped || !el.offsetParent) return;
    el.dataset.clamped = "1";
    el.classList.add("clamp");
    if (el.scrollHeight <= el.clientHeight + 2) { el.classList.remove("clamp"); return; }
    const b = document.createElement("button");
    b.type = "button"; b.className = "more-btn"; b.textContent = "Read more"; b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", () => {
      const open = el.classList.toggle("open");
      b.textContent = open ? "Show less" : "Read more";
      b.setAttribute("aria-expanded", String(open));
    });
    el.after(b);
  });
}
new MutationObserver(() => requestAnimationFrame(clampAll)).observe(document.body, { childList: true, subtree: true });
clampAll();

// Exam cards: DELF & DALF or TCF, one family at a time (every card stays on the page).
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-exam-tab]");
  if (!t) return;
  document.querySelectorAll("[data-exam-tab]").forEach((b) => b.setAttribute("aria-selected", String(b === t)));
  $("#examSoon").dataset.show = t.dataset.examTab;
  requestAnimationFrame(clampAll);
});
