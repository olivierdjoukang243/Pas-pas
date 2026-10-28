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
// below are the fallback. Mobile money is charged at the FCFA price (Notch Pay); card and PayPal at
// the USD price when Whop charges them, otherwise at the FCFA price.
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
// French site: countries shown in French; the value (sent to the server) stays the English name.
const regionNameFr = (() => { try { const dn = new Intl.DisplayNames(["fr"], { type: "region" }); return (c) => dn.of(c); } catch { return (c) => c; } })();
const COUNTRY_NAMES = Object.fromEntries(ISO.map((c) => [c, regionName(c)]));
const COUNTRIES = [...Object.values(COUNTRY_NAMES).sort((a, b) => a.localeCompare(b, "en")), "Other country"];
// Each method lists the countries of residence where it is available; no list = every country.
// The checkout only shows the methods of the buyer's country of residence.
const PAY_METHODS = {
  momo: { label: "MTN MoMo", phone: true, countries: ["Cameroon"] },
  om: { label: "Orange Money", phone: true, countries: ["Cameroon"] },
  card: { label: t("Bank card (Visa, Mastercard)", "Carte bancaire (Visa, Mastercard)") },
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
// ?cur=XAF : a payment logo clicked on the policies page brings its currency with it
{ const c = new URLSearchParams(location.search).get("cur");
  if (CURRENCIES[c]) { state.currency = c; store.set("currencyChoice", c); } }
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
    announce(t(`Your country is now set to ${name}. Prices are shown in ${CURRENCIES[state.currency].label}${before !== state.currency ? " (updated)" : ""}, and you can pay with ${methods}.`,
      `Votre pays est maintenant ${countryLabel(name)}. Les prix sont affichés en ${CURRENCIES[state.currency].label}${before !== state.currency ? " (mis à jour)" : ""}, et vous pouvez payer par ${methods}.`));
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
      <input type="search" class="picker-search" placeholder="${t("Search…", "Rechercher…")}" aria-label="${t("Search", "Rechercher")} ${esc(label)}" autocomplete="off">
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
    : `<li class="none">${t("No matches", "Aucun résultat")}</li>`;
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

const countryLabel = (c) => !FR ? c : c === "Other country" ? "Autre pays" : NAME_TO_CODE[c] ? regionNameFr(NAME_TO_CODE[c]) : c;
const COUNTRY_OPTIONS = () => COUNTRIES.map((c) => ({ value: c, label: countryLabel(c), keys: (NAME_TO_CODE[c] || "") + (FR ? " " + c : "") }))
  .sort((a, b) => (a.value === "Other country") - (b.value === "Other country") || a.label.localeCompare(b.label, LANG));
const currencyName = (() => { try { const dn = new Intl.DisplayNames(["en"], { type: "currency" }); return (c) => dn.of(c); } catch { return (c) => c; } })();
function renderCurrencyPicker() {
  const box = $("#currencyPicker");
  if (!box) return;
  box.innerHTML = pickerHTML("currency", { label: t("Currency", "Devise"), value: state.currency,
    options: Object.entries(CURRENCIES).map(([k, c]) => ({ value: k, label: c.label, hint: c.perUSD ? t("estimate", "estimation") : "", keys: currencyName(k) })),
    onChange: (v) => {
      state.currency = v; store.set("currencyChoice", v);
      renderCurrencyPicker(); renderPrices(); if ($("#checkoutForm")) renderPayDetails();
      const exactHere = cardUSD() ? ["USD", "XAF", "XOF"].includes(v) : ["XAF", "XOF"].includes(v);
      announce(t(`Prices are now shown in ${CURRENCIES[v].label}.${exactHere ? "" : cardUSD() ? " These are estimates. Card and PayPal are charged in US dollars." : " These are estimates. Every payment is charged in FCFA."}`,
        `Les prix sont maintenant affichés en ${CURRENCIES[v].label}.${exactHere ? "" : cardUSD() ? " Ce sont des estimations : la carte et PayPal se paient en dollars US." : " Ce sont des estimations : tout paiement se fait en FCFA."}`));
      flashUpdated();
    } });
}

// The payment logos of the footer lead to the courses, priced in the currency of that method
// (US dollars for card, Apple Pay, Google Pay and PayPal; FCFA for MTN MoMo and Orange Money).
document.addEventListener("click", (e) => {
  const a = e.target.closest(".pay-link");
  if (!a || !CURRENCIES[a.dataset.cur] || a.dataset.cur === state.currency) return;
  state.currency = a.dataset.cur; store.set("currencyChoice", a.dataset.cur);
  try { renderCurrencyPicker(); renderPrices(); } catch { /* a page without prices: the choice is kept */ }
});

const residenceNote = () => countryChosen() ? t("your choice", "votre choix") : t("detected automatically", "détecté automatiquement");

function renderResidence() {
  const box = $("#residenceLine");
  if (!box) return;
  box.innerHTML = `<div class="res-field"><span class="res-label" id="resCountryLabel">${t("Your country of residence", "Votre pays de résidence")} <small>(${residenceNote()})</small></span>
    ${pickerHTML("resCountry", { label: t("Country of residence", "Pays de résidence"), options: COUNTRY_OPTIONS(), value: state.country, onChange: (v) => setCountry(v, true) })}</div>
    <span>${t("Ways to pay:", "Moyens de paiement :")} ${methodsFor(state.country).map(([, m]) => m.label).join(", ")}.</span>`;
  renderPayLocal();
}

const localFCFA = () => methodsFor(state.country).some(([, m]) => m.phone);
// Who charges card and PayPal, as the shop server says (/stock): "whop", in US dollars at the
// catalogue's USD price (seller Nuvalex LLC), or "notchpay", in FCFA. The demo shows Whop.
let CARD = PAY_API ? "" : "whop";
const cardUSD = () => CARD === "whop";

// What the visitor's currency means for them: exact price, or an estimate of a US dollar charge.
function renderPayCurrency() {
  const box = $("#payCurrency");
  if (!box) return;
  const c = state.currency, label = CURRENCIES[c].label;
  if (cardUSD()) {
    // card and PayPal: US dollars at the catalogue's USD price; mobile money (Cameroon): FCFA
    const local = localFCFA(), fcfa = c === "XAF" || (c === "XOF" && local);
    box.innerHTML = FR ? `<h3>Votre devise : ${esc(label)}</h3><p>${c === "USD"
      ? `Les prix sont affichés en ${esc(label)} : c'est le montant exact que vous paierez par carte ou PayPal${local ? " (le mobile money se paie en FCFA)" : ""}.`
      : fcfa && local ? `Les prix sont affichés en ${esc(label)} : c'est le montant exact que vous paierez par mobile money. La carte et PayPal se paient en dollars US.`
      : `Les prix en ${esc(label)} sont indicatifs. La carte et PayPal se paient en dollars US, au prix indiqué au paiement${local ? ", le mobile money en FCFA" : ""}, et votre banque fait la conversion.`}
      Vous pouvez changer de devise en haut de la page.</p>`
      : `<h3>Your currency: ${esc(label)}</h3><p>${c === "USD"
      ? `Prices are shown in ${esc(label)}. This is the exact amount you'll pay by card or PayPal${local ? " (mobile money is paid in FCFA)" : ""}.`
      : fcfa && local ? `Prices are shown in ${esc(label)}. This is the exact amount you'll pay by mobile money. Card and PayPal are charged in US dollars.`
      : `Prices in ${esc(label)} are indicative. Card and PayPal are charged in US dollars, at the price shown at checkout${local ? ", and mobile money in FCFA" : ""}. Your bank handles the conversion.`}
      You can change the currency at the top of the page.</p>`;
    return;
  }
  // every payment (mobile money, card, PayPal) is charged in FCFA, at the catalogue's FCFA price
  const exact = c === "XAF" || (c === "XOF" && localFCFA());
  box.innerHTML = FR ? `<h3>Votre devise : ${esc(label)}</h3><p>${exact
    ? `Les prix sont affichés en ${esc(label)} : c'est le montant exact que vous paierez, par mobile money, carte ou PayPal.`
    : `Les prix en ${esc(label)} sont indicatifs. Tous les paiements (mobile money, carte, PayPal) se font en francs CFA (FCFA), au prix fixe indiqué au paiement, et votre banque fait la conversion.`}
    Vous pouvez changer de devise en haut de la page.</p>`
    : `<h3>Your currency: ${esc(label)}</h3><p>${exact
    ? `Prices are shown in ${esc(label)}. This is the exact amount you'll pay, by mobile money, card or PayPal.`
    : `Prices in ${esc(label)} are indicative. Every payment (mobile money, card, PayPal) is charged in CFA francs (FCFA), at the fixed price shown at checkout, and your bank handles the conversion.`}
    You can change the currency at the top of the page.</p>`;
}

// The local methods of the visitor's country of residence, and only that country.
function renderPayLocal() {
  const box = $("#payLocal");
  if (!box) return;
  const local = methodsFor(state.country).filter(([, m]) => m.countries);
  box.hidden = !local.length;
  if (!local.length) return;
  box.innerHTML = `<h3>${esc(countryLabel(state.country))}</h3>
    <p>${t(`Pay with ${local.map(([, m]) => m.label).join(" or ")} in ${local.some(([, m]) => m.phone) ? "FCFA" : "local currency"}, then confirm the payment on your phone.`,
      `Payez par ${local.map(([, m]) => m.label).join(" ou ")} en ${local.some(([, m]) => m.phone) ? "FCFA" : "monnaie locale"}, puis confirmez le paiement sur votre téléphone.`)}</p>
    <div class="chips">${local.map(([k, m]) => `<span class="chip chip-${k}">${m.label}</span>`).join("")}</div>`;
}

function renderResidenceCheckout() {
  const box = $("#coResidence");
  if (!box) return;
  box.innerHTML = `<div class="res-field"><span class="res-label">${t("Country of residence", "Pays de résidence")} <small>(${residenceNote()})</small></span>
    ${pickerHTML("coCountry", { label: t("Country of residence", "Pays de résidence"), name: "country", options: COUNTRY_OPTIONS(), value: state.country, onChange: (v) => setCountry(v, true) })}</div>`;
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
  // FCFA: the price charged by mobile money (Notch Pay, in XAF); USD: by card and PayPal (Whop)
  if (currency === "XAF") return fmtXAF(xaf);
  if (currency === "XOF") return (localFCFA() ? "" : "≈ ") + fmtXAF(xaf);
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
const waitTag = (p) => SOON.has(p.id) ? t("Coming soon", "Bientôt disponible") : t("In preparation", "En préparation");
const buyLabel = (p) => isPre(p) ? t("Pre-order", "Précommander") : t("Buy", "Acheter");
// The parts of a pack already deliverable: sent at once with a pre-order of the pack.
const readyParts = (p) => p.kind === "level" ? PRODUCTS.filter((x) => x.level === p.level && x.kind === "part" && x.ready !== false && !SOON.has(x.id))
  : p.kind === "method" ? PRODUCTS.filter((x) => ["part", "level"].includes(x.kind) && x.ready !== false && !SOON.has(x.id) && !(x.kind === "part" && PRODUCTS.some((l) => l.kind === "level" && l.level === x.level && l.ready !== false))) : [];
const PRE_NOTE = t("We'll email your files as soon as they're ready, and you can cancel for a full refund until then.",
  "Nous vous envoyons les fichiers par e-mail dès qu'ils sont prêts, et vous pouvez annuler jusque-là pour un remboursement intégral.");

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
  if (!$("#levelTabs")) return;
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
  if (!$("#levelPanel")) return;
  const l = levelOf(state.level);
  const products = PRODUCTS.filter((p) => p.level === l.code).sort((a, b) => (a.kind === "level") - (b.kind === "level") || (a.part || 0) - (b.part || 0));
  const head = `<div class="lp-head" style="--h:${l.hue}">
      <div class="lp-title"><span class="lp-code">${l.code}</span><div><h3>${l.name}</h3><p>${l.status === "prep" ? l.note : LEVEL_INTRO[l.code]}</p></div></div>
    </div>`;
  if (l.status === "prep") {
    $("#levelPanel").innerHTML = head + `<div class="lp-empty"><p>${l.code} isn't on sale yet. Levels from Introduction to Intermediate are available now.</p>
      <button class="btn btn-ghost mini" data-level="B1">See B1</button></div>`;
  } else {
    $("#levelPanel").innerHTML = head + `<ol class="prods">${products.map(productRow).join("")}</ol>`;
  }
  document.querySelectorAll("#levelTabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.level === l.code));
}

function renderMethod() {
  if (!$("#methodBand")) return;
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
  if (!$("#compareTable")) return;
  const rows = [
    ["How you pay", `One payment, from ${price(byId("a0-complete"))}, and the files are yours to keep`, "Monthly or yearly subscription", "Pay by the hour, every lesson"],
    ["Grammar explained in English", "Yes, in every module", "Short tips, mostly practice", "Depends on the tutor"],
    ["Step-by-step course with progress tests", "56 modules, 7 progress tests, Introduction to Intermediate", "Yes, in the app", "Depends on the tutor"],
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
  const formats = FR && typeof EXAM_FORMATS_FR !== "undefined" ? EXAM_FORMATS_FR : typeof EXAM_FORMATS !== "undefined" ? EXAM_FORMATS : null;
  if (!formats || !f) return null;
  const x = (formats[f[0]] || {})[f[1]];
  return x || null;
}

function formatHTML(x) {
  if (!x) return "";
  return `<details class="exam-format"><summary>${t("Test format", "Format de l'examen")}</summary>
    <table>${x.papers.map((p) => `<tr><th>${p.name}<span>${p.time}${p.marks ? ` · /${p.marks}` : ""}${p.prep ? `<br>${t("preparation time", "préparation")}: ${p.prep}` : ""}</span></th><td>${p.detail}</td></tr>`).join("")}</table>
    <p>${x.written ? t(`Written sections: ${x.written} in one sitting. `, `Épreuves collectives : ${x.written} d'affilée. `) : ""}${x.pass}.</p>
    ${x.nclc ? `<p class="nclc-target"><strong>${x.nclc.target}</strong></p>
    <div class="nclc-wrap"><table class="nclc"><tr><th>NCLC</th>${x.nclc.rows.map((r) => `<th>${r.name}</th>`).join("")}</tr>
    ${x.nclc.levels.map((l, i) => `<tr${l === "7" ? ' class="t7"' : ""}><th>${l}</th>${x.nclc.rows.map((r) => `<td>${r.scores[i]}</td>`).join("")}</tr>`).slice().reverse().join("")}</table></div>
    <p>${x.nclc.note} ${t("Source:", "Source :")} ${x.nclc.source}.</p>` : ""}</details>`;
}

function renderExams() {
  $("#examSoon").innerHTML = EXAM_PACKS.map((p) => `<div class="pay-card exam-card" data-group="${p.level === "TCF" ? "tcf" : "delf"}">
    <span class="tag${isPre(p) ? " pre" : buyable(p) ? "" : " soon"}">${isPre(p) ? t("Pre-order", "Précommande") : buyable(p) ? p.level : waitTag(p)}</span>
    <h3>${p.exam}</h3>
    ${(examFormat(p.format) || {}).official ? `<p class="exam-official" lang="fr">${examFormat(p.format).official}</p>` : ""}
    <p class="exam-levels">${L(p, "contents")}</p>
    ${formatHTML(examFormat(p.format))}
    <div class="exam-buy"><span class="price">${price(p)}</span>${buyable(p) ? `<button class="btn btn-primary mini" data-buy="${p.id}">${buyLabel(p)}</button>` : `<span class="exam-wait">${t("Not on sale yet", "Pas encore en vente")}</span>`}</div>
    ${isPre(p) ? `<p class="pre-note">${t("Emailed as soon as they're written. Cancel anytime for a full refund.", "Envoyés dès qu'ils sont rédigés. Annulable à tout moment, remboursement intégral.")}</p>` : ""}
  </div>`).join("") + EXAMS_SOON.map((e) => `<div class="pay-card exam-card" data-group="delf">
    <span class="tag soon">${t("Coming soon", "Bientôt")}</span>
    <h3>${e.name}</h3>
    <p class="exam-levels">${L(e, "levels")}</p>
    <p>${L(e, "note")}</p>
    ${formatHTML(examFormat(e.format))}
  </div>`).join("");
}

function renderLive() {
  const one = byId("live-60");
  // the whole card opens the booking, with this formula already chosen
  $("#liveGrid").innerHTML = LIVE.filter((p) => !p.plan).map((p) => `<div class="pay-card live-card" data-book="${p.id}" role="button" tabindex="0" aria-label="${t("Book", "Réserver")} : ${esc(L(p, "name"))}">
    <h3>${L(p, "name")}</h3>
    <p>${L(p, "desc")}</p>
    <div class="live-buy"><span class="price">${price(p)}</span><button class="btn btn-primary mini" data-book="${p.id}">${t("Book", "Réserver")}</button></div>
  </div>`).join("");
  const plans = LIVE.filter((p) => p.plan), box = $("#livePlans");
  if (!box || !plans.length) return;
  box.innerHTML = `<div class="plans-head"><p class="eyebrow">${t("Plans", "Formules")}</p><h3>${t("Learn every week and pay less per lesson", "Un cours chaque semaine, moins cher à l'unité")}</h3>
    <p>${t("Book your lessons yourself, whenever it suits you over each 2-month period. Your plan renews only with your approval, and you can stop it at any time.",
      "Vous réservez vous-même vos cours, quand cela vous arrange, sur chaque période de 2 mois. La formule ne se renouvelle qu'avec votre accord, et vous l'arrêtez quand vous voulez.")}</p></div>
    <div class="plans">${plans.map((p) => { const save = Math.round(100 * (1 - p.usd / p.lessons / one.usd));
      return `<div class="pay-card plan-card${p.best ? " best" : ""}">${p.best ? `<span class="tag best">${t("Most popular", "La plus choisie")}</span>` : ""}
      <h4>${L(p, "name").split(" · ")[0]}</h4><p class="plan-n">${t(`<b>${p.lessons} lessons</b> of 60 minutes every 2 months`, `<b>${p.lessons} cours</b> de 60 minutes tous les 2 mois`)} · ${L(p, "contents").toLowerCase()}</p>
      <p class="plan-price"><span class="price">${price(p)}</span> <small>${t("every 2 months", "tous les 2 mois")}</small></p>
      <p class="plan-per">${amount(p.usd / p.lessons, p.xaf / p.lessons)} ${t("per lesson", "le cours")} · <span class="ok">${t(`save ${save}%`, `${save} % d'économie`)}</span></p>
      <p>${L(p, "desc")}</p>
      <button class="btn ${p.best ? "btn-primary" : "btn-ghost"} mini" data-book="${p.id}">${t("Choose this plan", "Choisir cette formule")}</button></div>`; }).join("")}</div>
    <p class="note">${t("Unused lessons don't carry over to the next 2-month period, so book them as you go. You can stop the renewal at any time in one click from “My courses”.",
      "Les cours non réservés ne sont pas reportés sur la période suivante : réservez-les au fil de l'eau. Vous pouvez arrêter le renouvellement à tout moment, en un clic, depuis « Mes cours ».")}</p>`;
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
  $("#modalBody").innerHTML = `<button class="icon-btn modal-close" data-modal-close aria-label="${t("Close", "Fermer")}">✕</button>${html}`;
  if (!modal.open) modal.showModal();
}

const whatsappLink = (text) => `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(text)}`;

function contactHTML() {
  const bits = [];
  if (SHOP.email) bits.push(t(`by email at <a href="mailto:${SHOP.email}">${SHOP.email}</a>`, `par e-mail à <a href="mailto:${SHOP.email}">${SHOP.email}</a>`));
  if (SHOP.whatsapp) bits.push(t(`on WhatsApp at`, `sur WhatsApp au`) + ` <a href="https://wa.me/${SHOP.whatsapp}" target="_blank" rel="noopener">+${SHOP.whatsapp}</a>`);
  return bits.length ? t(`Until online payment opens, you can order ${bits.join(" or ")}.`, `En attendant le paiement en ligne, vous pouvez commander ${bits.join(" ou ")}.`) : "";
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
    <p class="eyebrow">${pre ? t("Pre-order · ", "Précommande · ") : ""}${p.level === "A0–B1" ? "Introduction to Intermediate" : p.kind === "live" ? t("Live", "Cours en direct") : p.level}${DEMO ? " · demo" : ""}</p>
    <h2>${L(p, "name")}</h2>
    <p>${draft ? `${localDay(draft.start)}, ${localTime(draft.start)} ${t("your time", "à votre heure")} · ${draft.minutes} min${draft.need ? ` · ${draft.need}` : ""}` : L(p, "contents")}</p>
    <div class="form-grid">
      ${p.kind === "live" ? "" : `<label for="coName">${t("Your name (printed on your files)", "Votre nom (imprimé sur vos fichiers)")}<input id="coName" name="name" type="text" maxlength="80" autocomplete="name"></label>`}
      <label for="coEmail">${p.kind === "live" ? t("Email (your booking confirmation will be sent here)", "E-mail (la confirmation de réservation y sera envoyée)") : t("Email (your files will be sent here)", "E-mail (vos fichiers y seront envoyés)")}<input id="coEmail" name="email" type="email" required autocomplete="email" value="${draft ? draft.email : ""}"></label>
      <div id="coResidence"></div>
    </div>
    <p class="eyebrow pm-title">${t("Payment method", "Moyen de paiement")}</p>
    <div class="pay-methods" id="payMethods" role="radiogroup" aria-label="${t("Payment method", "Moyen de paiement")}"></div>
    <div id="payDetails"></div>
    ${p.plan ? `<div id="renewBox"></div>` : ""}
    <div class="totals" id="coTotals"></div>
    <label class="check"><input type="checkbox" name="terms" id="coTerms"> ${FR ? (p.kind === "live"
      ? (p.plan ? `J'accepte les <a href="${POLICIES}#terms" target="_blank">conditions de vente</a> et les <a href="${POLICIES}#live" target="_blank">règles des cours en direct</a>. Je comprends que ma formule dure 2 mois, que les cours non réservés ne sont pas reportés, et qu'elle se renouvelle selon le mode choisi ci-dessus, que je peux changer ou arrêter à tout moment dans « Mes cours ».`
        : `J'accepte les <a href="${POLICIES}#terms" target="_blank">conditions de vente</a> et les <a href="${POLICIES}#live" target="_blank">règles des cours en direct</a> (report gratuit jusqu'à 24 heures avant le cours).`)
      : pre ? `J'accepte les <a href="${POLICIES}#terms" target="_blank">conditions de vente</a> et la <a href="${POLICIES}#licence" target="_blank">licence</a>. Je comprends qu'il s'agit d'une précommande : les fichiers seront envoyés dès qu'ils seront prêts, et je peux annuler jusque-là pour un remboursement intégral.`
      : `J'accepte les <a href="${POLICIES}#terms" target="_blank">conditions de vente</a> et la <a href="${POLICIES}#licence" target="_blank">licence</a>. Je veux recevoir les fichiers immédiatement et je comprends que je renonce ainsi à mon droit de rétractation.`)
      : p.kind === "live"
      ? (p.plan ? `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#live" target="_blank">live lesson rules</a>. I understand that my plan lasts 2 months, that unused lessons don't carry over, and that it renews in the way I chose above, which I can change or stop at any time in “My courses”.`
        : `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#live" target="_blank">live lesson rules</a> (free rescheduling up to 24 hours before the lesson).`)
      : pre ? `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#licence" target="_blank">licence</a>. I understand that this is a pre-order. The files will be sent as soon as they're ready, and I can cancel for a full refund until then.`
      : `I accept the <a href="policies.html#terms" target="_blank">terms of sale</a> and the <a href="policies.html#licence" target="_blank">licence</a>. I want the files delivered immediately, and I understand that this means I lose my right of withdrawal.`}</label>
    <p class="form-error" id="formError" hidden></p>
    <button class="btn btn-primary btn-block" id="payBtn"></button>
    <p class="note">${FR ? (p.plan ? `Le paiement confirme votre premier cours et ouvre votre formule pour 2 mois. Vous réservez les autres cours vous-même dans « Mes cours ».` : p.kind === "live" ? "Le paiement confirme votre cours et vous garde l'heure choisie." : pre ? `C'est une précommande. ${PRE_NOTE} Si elle n'est pas livrée sous 90 jours, vous êtes remboursé, sauf si vous choisissez d'attendre.` : "Les fichiers étant livrés immédiatement, la vente est définitive. Si un fichier est défectueux, nous le remplaçons.")
      : p.plan ? `Payment confirms your first lesson and starts your plan for 2 months. You book the other lessons yourself in “My courses”.` : p.kind === "live" ? "Payment confirms your lesson and holds the time for you." : pre ? `This is a pre-order. ${PRE_NOTE} If it isn't delivered within 90 days, you'll be refunded unless you choose to wait.` : "Because the files are delivered instantly, all sales are final. If a file is faulty, we'll replace it."}</p>
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
  $("#payDetails").innerHTML = m.phone ? `<label for="coMomo">${t(`${m.label} phone number`, `Numéro ${m.label}`)}
      <input id="coMomo" name="momo" type="tel" required inputmode="tel" placeholder="6XX XX XX XX" autocomplete="tel"></label>` : "";
  // Card and PayPal by Whop: the exact USD price, sold by Nuvalex LLC. Otherwise (mobile money,
  // or card by Notch Pay): FCFA. The visitor's currency is shown as an indication.
  const usd = !m.phone && cardUSD();
  const charged = usd ? fmtUSD(p.usd) : fmtXAF(p.xaf);
  const shown = usd ? amount(p.usd, p.xaf) : price(p);
  const preByCard = usd && isPre(p);
  $("#coTotals").innerHTML = `<div class="grand"><span>Total</span><span>${charged}</span></div>
    ${shown !== charged && !(usd && state.currency === "USD") ? `<div class="note"><span>${t("About", "Environ")} ${CURRENCIES[state.currency].label}</span><span>${shown.replace(/^≈ /, "≈ ")}</span></div>` : ""}
    ${m.phone ? "" : usd ? `<div class="note"><span>${t("Sold by Nuvalex LLC (Pas à Pas FRENCH) · payment processed by Whop, in US dollars.", "Vendu par Nuvalex LLC (Pas à Pas FRENCH) · paiement traité par Whop, en dollars US.")}</span><span></span></div>`
      : `<div class="note"><span>${t("Your bank converts FCFA into your currency.", "Votre banque convertit les FCFA dans votre devise.")}</span><span></span></div>`}
    ${preByCard ? `<div class="note"><span>${t("Pre-orders can't be paid by card or PayPal yet.", "Les précommandes ne se paient pas encore par carte ni PayPal.")}</span><span></span></div>` : ""}`;
  $("#payBtn").textContent = m.phone ? t(`Pay with ${m.label}`, `Payer par ${m.label}`) : t(`Pay ${charged}`, `Payer ${charged}`);
  $("#payBtn").disabled = preByCard;
  renderRenew(p, m);
}

// A plan: how it renews, chosen before paying. Automatic: on the renewal date the server sends a
// payment request to the phone, approved with the PIN (nothing is taken without it). By link: an
// email 7 days before. Card and PayPal: by link only (no automatic charge without the phone prompt).
let renewChoice = "auto";
function renderRenew(p, m) {
  const box = $("#renewBox");
  if (!box) return;
  const auto = !!m.phone, v = auto ? renewChoice : "lien";
  box.innerHTML = `<p class="eyebrow pm-title">${t("Renewal every 2 months", "Renouvellement tous les 2 mois")}</p>
    <div class="pay-methods renew-choice" role="radiogroup" aria-label="${t("Renewal", "Renouvellement")}">
      <label class="pm${auto ? "" : " off"}"><input type="radio" name="renew" value="auto" ${v === "auto" ? "checked" : ""} ${auto ? "" : "disabled"}>
        <span class="pm-t">${t("Automatic", "Automatique")}<small>${auto
          ? t(`On the renewal date, a payment request for ${price(p)} arrives on your ${m.label} phone: just approve it with your PIN. Nothing is taken without your approval.`,
              `Le jour de l'échéance, une demande de paiement de ${price(p)} arrive sur votre téléphone ${m.label} : validez-la avec votre code. Rien n'est débité sans votre accord.`)
          : t("Available with MTN MoMo and Orange Money.", "Disponible avec MTN MoMo et Orange Money.")}</small></span></label>
      <label class="pm"><input type="radio" name="renew" value="lien" ${v === "lien" ? "checked" : ""}>
        <span class="pm-t">${t("By link", "Par lien")}<small>${t("7 days before the end, we email you a link: you pay if you want to continue, otherwise the plan simply stops.",
          "7 jours avant la fin, vous recevez un lien par e-mail : vous payez si vous voulez continuer, sinon la formule s'arrête simplement.")}</small></span></label>
    </div>
    <p class="note">${t("You can switch between the two, or stop the renewal, at any time in “My courses” → Settings.", "Vous pouvez passer de l'un à l'autre, ou arrêter le renouvellement, à tout moment dans « Mes cours » → Paramètres.")}</p>`;
}

function submitCheckout(form) {
  const p = byId(form.dataset.product);
  const data = new FormData(form);
  const m = PAY_METHODS[data.get("pay")];
  const err = $("#formError");
  let msg = "";
  if (!form.coEmail.value || !form.coEmail.checkValidity()) msg = t("Please enter a valid email address so we can send you your order.", "Entrez une adresse e-mail valide pour recevoir votre commande.");
  else if (!form.coTerms.checked) msg = t("Please accept the terms of sale to continue.", "Acceptez les conditions de vente pour continuer.");
  else if (m.phone && !CM_MOBILE.test(String(data.get("momo")).replace(/[\s.-]/g, ""))) msg = t(`Please enter a Cameroonian mobile number for ${m.label}. It should have 9 digits and start with 6 (for example, 677 12 34 56).`,
    `Entrez un numéro mobile camerounais pour ${m.label} : 9 chiffres commençant par 6 (par exemple 677 12 34 56).`);
  if (msg) { err.textContent = msg; err.hidden = false; return; }

  if (data.get("country") !== state.country) setCountry(data.get("country"), true);
  const usd = !m.phone && cardUSD();
  const charged = usd ? fmtUSD(p.usd) : fmtXAF(p.xaf);
  const order = { product: p.id, email: data.get("email"), name: String(data.get("name") || (checkoutDraft && checkoutDraft.name) || "").trim(),
    country: state.country, method: data.get("pay"),
    phone: m.phone ? String(data.get("momo")).replace(/[\s.-]/g, "") : "",
    currency: usd ? "USD" : "XAF", amount: usd ? p.usd : p.xaf, preorder: isPre(p), booking: checkoutDraft, lang: LANG,
    renew: p.plan ? (m.phone ? (data.get("renew") || "auto") : "lien") : undefined };

  // Live payment: the server creates the Notch Pay transaction and sends back its page.
  if (PAY_API) return payOnline(order);
  // Demo: nothing is charged; a live lesson is booked in this browser only.
  if (DEMO) {
    if (checkoutDraft) return bookedScreen(confirmBooking(checkoutDraft, "demo"));
    return openModal(FR ? `<div class="checkout"><p class="eyebrow">Démo · rien n'a été payé</p><h2>Paiement accepté</h2>
      <p>Dans la vraie boutique, ${L(p, "name")} serait maintenant ${order.preorder ? "réservé pour" : "envoyé à"} ${esc(order.email)}.</p><button class="btn btn-primary" data-modal-close>Terminé</button></div>`
      : `<div class="checkout"><p class="eyebrow">Demo · nothing was charged</p><h2>Payment accepted</h2>
      <p>In the real shop, ${p.name} would now be ${order.preorder ? "reserved for" : "sent to"} ${order.email}${order.preorder ? ", and sent as soon as it's ready" : ""}.</p><button class="btn btn-primary" data-modal-close>Done</button></div>`);
  }
  const contact = contactHTML();
  const wa = SHOP.whatsapp ? whatsappLink(`Hello, I'd like to ${order.preorder ? "pre-order" : "buy"} "${p.name}" (${charged}), paying with ${m.label}. My email: ${data.get("email")}`) : "";
  openModal(`<div class="checkout">
    <h2>${t("Online payment is coming soon", "Le paiement en ligne arrive bientôt")}</h2>
    <p>${t(`Payment by ${m.label} isn't available on the site yet, so you haven't been charged.`, `Le paiement par ${m.label} n'est pas encore ouvert sur le site : rien n'a été débité.`)}</p>
    ${wa ? `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">${t("Send this order via WhatsApp", "Envoyer cette commande par WhatsApp")}</a>` : ""}
    ${contact ? `<p>${contact}</p>` : ""}
    <button class="btn btn-ghost" data-modal-close>${t("Close", "Fermer")}</button>
  </div>`);
}

async function payOnline(order) {
  const btn = $("#payBtn"), err = $("#formError");
  btn.disabled = true; btn.textContent = t("Opening the secure payment page…", "Ouverture de la page de paiement sécurisée…");
  try {
    const r = await fetch(`${PAY_API}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, return_url: location.href.split(/[?#]/)[0] }) });
    const d = await r.json().catch(() => ({}));
    // A refusal explained by the server (method not open yet, wrong number…) is shown as is.
    if (!r.ok && d.error) { err.textContent = d.error; err.hidden = false; btn.disabled = false; renderPayDetails(); return; }
    if (!d.authorization_url) throw new Error("no payment page");
    location.href = d.authorization_url;
  } catch (e) {
    err.textContent = t("We couldn't open the payment page. You haven't been charged. Please try again in a moment.", "La page de paiement n'a pas pu s'ouvrir. Rien n'a été débité. Réessayez dans un instant.");
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
      if (i === 0) openModal(`<div class="checkout"><h2>${t("Payment received", "Paiement reçu")}</h2><p>${d.live ? t("We're writing your lesson in Olivier's calendar.", "Nous inscrivons votre cours dans l'agenda d'Olivier.") : t("We're adding your name to your files.", "Nous ajoutons votre nom à vos fichiers.")} ${t("This only takes a few seconds…", "Cela ne prend que quelques secondes…")}</p></div>`);
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (d.status !== "complete") {
      return openModal(`<div class="checkout"><h2>${t("Payment not completed", "Paiement non abouti")}</h2><p>${t("You haven't been charged, and you can try again whenever you're ready.", "Rien n'a été débité. Vous pouvez réessayer quand vous voulez.")}</p><button class="btn btn-primary" data-modal-close>${t("Close", "Fermer")}</button></div>`);
    }
    if (d.booking) return paidBooking(d);
    if (d.preorder) return openModal(`<div class="checkout"><h2>${t("Thank you", "Merci")}</h2><p>${t(`Your payment went through and your pre-order is confirmed. We'll send the files to ${esc(d.email)} as soon as they're ready, and you can cancel for a full refund until then.`,
      `Votre paiement est passé et votre précommande est confirmée. Nous enverrons les fichiers à ${esc(d.email)} dès qu'ils seront prêts, et vous pouvez annuler jusque-là pour un remboursement intégral.`)}</p><button class="btn btn-primary" data-modal-close>${t("Done", "Terminé")}</button></div>`);
    if (d.account_url) return openModal(`<div class="checkout"><h2>${t("Thank you", "Merci")}</h2><p>${t(`Your payment went through and your course is ready. Start reading online now, and pick up where you left off at any time over the next 12 months. We've also emailed the link and the download to ${esc(d.email)}.`,
      `Votre paiement est passé et vos fichiers sont prêts. Ouvrez-les en ligne dès maintenant, pendant 12 mois. Le lien et le téléchargement vous ont aussi été envoyés à ${esc(d.email)}.`)}</p>
      <a class="btn btn-primary" href="${esc(d.account_url)}">${t("Open my course", "Ouvrir mes cours")}</a> <button class="btn btn-ghost" data-modal-close>${t("Later", "Plus tard")}</button></div>`);
    openModal(`<div class="checkout"><h2>${t("Thank you", "Merci")}</h2><p>${t(`Your payment went through. Your files will be emailed to ${esc(d.email)} shortly.`, `Votre paiement est passé. Vos fichiers seront envoyés à ${esc(d.email)} dans quelques instants.`)}</p><button class="btn btn-primary" data-modal-close>${t("Done", "Terminé")}</button></div>`);
  } catch {
    openModal(`<div class="checkout"><h2>${t("Checking your payment…", "Vérification du paiement…")}</h2><p>${t("We can't confirm it just yet. You'll get an email as soon as it goes through.", "Nous ne pouvons pas encore le confirmer. Vous recevrez un e-mail dès qu'il sera passé.")}</p><button class="btn btn-primary" data-modal-close>${t("Close", "Fermer")}</button></div>`);
  }
}

// Buyers come back to their courses ("My courses", top right), once the payment server exists:
// they sign in with the email used at checkout and receive a sign-in link (no password).
if (PAY_API && $("#accountLink")) {
  $("#accountLink").href = `${PAY_API}/account?lang=${LANG}`;
  $("#accountLink").hidden = false;
}

// ====== Placement test ======
// The questions come from the level checks of the method (js/leveltest.js, exported by the atelier).
// The test climbs step by step, from A0 to the last level check exported (B1 Part 2 today, up to C2
// as their level checks are written), and stops at the first step that is too hard.
const TEST_PER_STEP = 4;
// Time counts too: a step answered right but very slowly is known, not yet fluent. Target seconds per
// answer, by level, as in the timed self-assessments of the course (atelier: bilan_web.py, RYTHME);
// a step passed in more than SLOW times the target is a step to consolidate, where we suggest starting.
const TEST_SECONDS = { A0: 40, A1: 45, A2: 50, B1: 55, B2: 60, C1: 65, C2: 70 };
const TEST_SLOW = 2;
let testStep = 0, testDraw = [], testDone = [], testActive = 0, testSince = 0;
const stepLevel = (step) => (step.product || step.name || "").slice(0, 2).toUpperCase();
// time only counts while the test is on screen (a tab left open doesn't make anyone slow)
const testClock = () => testActive + (testSince && !document.hidden ? Date.now() - testSince : 0);
document.addEventListener("visibilitychange", () => {
  if (!testSince && !testActive) return;
  if (document.hidden) { testActive = testClock(); testSince = 0; } else if (document.getElementById("testForm")) testSince = Date.now();
});
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
  testActive = 0; testSince = Date.now();
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
  const seconds = Math.round(testClock() / 1000); testSince = 0;
  const target = TEST_SECONDS[stepLevel(LEVEL_TEST.steps[testStep])] || 55;
  const passed = (100 * right) / testDraw.length >= LEVEL_TEST.pass;
  const slow = passed && seconds > TEST_SLOW * target * testDraw.length;
  testDone.push({ step: LEVEL_TEST.steps[testStep], right, total: testDraw.length, wrong, seconds, target, slow });
  if (passed && testStep + 1 < LEVEL_TEST.steps.length) {
    testStep++;
    testDraw = drawStep(LEVEL_TEST.steps[testStep]);
    renderTestStep();
  } else testResult(passed);
}

function testResult(finishedAll) {
  // where to start: the first step missed, or an earlier one passed but too slowly
  const slowStep = testDone.find((d) => d.slow);
  if (slowStep) finishedAll = false;
  const last = slowStep || testDone[testDone.length - 1];
  const passedSteps = testDone.slice(0, testDone.indexOf(last) + (finishedAll ? 1 : 0)).map((d) => d.step.name);
  const total = testDone.reduce((n, d) => n + d.seconds, 0);
  const topLevel = stepLevel(LEVEL_TEST.steps[LEVEL_TEST.steps.length - 1]);
  const minutes = total >= 60 ? `${Math.floor(total / 60)} min ${total % 60} s` : `${total} s`;
  const p = finishedAll ? null : byId(last.step.product);
  if (p) { state.level = p.level; store.set("level", p.level); renderLevelTabs(); renderLevelPanel(); }
  const live = byId("live-60");
  openModal(`<div class="quiz quiz-result">
    <p class="eyebrow">Your result</p>
    <h2>${finishedAll ? `You've reached the end of <em>${topLevel}</em>` : `Start with <em>${last.step.name}</em>`}</h2>
    <p>${passedSteps.length ? `You passed ${passedSteps.join(", ")}. ` : ""}${finishedAll ? (topLevel === "C2" ? "That's the top of the scale. A live lesson with Olivier keeps it sharp." : "The next levels are in preparation. In the meantime, a live lesson with Olivier is the best next step.") : slowStep ? `You got ${last.right} out of ${last.total} right at this step, but it took you ${Math.round(last.seconds / last.total)} seconds per answer, where about ${last.target} is comfortable at this level. You know it; this course makes it automatic.` : `You got ${last.right} out of ${last.total} right at this step.`}</p>
    <p class="quiz-note">Time on the test: ${minutes}. Your answers and your speed both count.</p>
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
  if (!$("#reviews")) return;
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
  ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Course", name: "Pas à Pas — The Complete Method (Introduction to Intermediate)",
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
  if (e.target.name === "renew") renewChoice = e.target.value;
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
if (contact && $("#contactLine")) { $("#contactLine").innerHTML = contact; $("#contactLine").hidden = false; }
$("#year").textContent = new Date().getFullYear();
renderCurrencyPicker();
renderLevelTabs();
renderPrices();
refreshRates().then(renderPrices);
// The shop server says which ready courses aren't in stock yet: those show "Coming soon".
if (PAY_API) fetch(`${PAY_API}/stock`).then((r) => r.json()).then((d) => {
  (d.soon || []).forEach((id) => SOON.add(id));
  if (SOON.size) { renderLevelPanel(); renderMethod(); renderCompare(); }
  if (d.card !== undefined && d.card !== CARD) { CARD = d.card; renderPayCurrency(); if ($("#checkoutForm")) renderPayDetails(); }
}).catch(() => { /* the server refuses unstocked courses anyway */ });
{ const n = new URLSearchParams(location.search).get("next"); if (n) setTimeout(() => openNext(n), 300); }
// ?test: the level test opens at once (link in the follow-up email of the free module).
if (new URLSearchParams(location.search).has("test") && typeof LEVEL_TEST !== "undefined") setTimeout(openTest, 300);

// ====== Long texts: first lines shown, "Read more" unfolds the rest (nothing is removed) ======
const CLAMPED = ".prod-body > p, .exam-card > p:not(.exam-levels):not(.exam-official):not(.pre-note), .motive > p:not(.motive-tag):not(.motive-path), .clamp-me";
function clampAll() {
  document.querySelectorAll(CLAMPED).forEach((el) => {
    if (el.dataset.clamped || !el.offsetParent) return;
    el.dataset.clamped = "1";
    el.classList.add("clamp");
    if (el.scrollHeight <= el.clientHeight + 2) { el.classList.remove("clamp"); return; }
    const b = document.createElement("button");
    b.type = "button"; b.className = "more-btn"; b.textContent = t("Read more", "Lire la suite"); b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", () => {
      const open = el.classList.toggle("open");
      b.textContent = open ? t("Show less", "Réduire") : t("Read more", "Lire la suite");
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
