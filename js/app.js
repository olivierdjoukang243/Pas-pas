// ====== Shop settings (edit before launch) ======
const WHATSAPP_NUMBER = "237600000000"; // international format, no "+"
const PROMO_CODES = { WELCOME10: 0.10 };

// Indicative rates for 1 EUR. FCFA has a fixed parity with the euro; update the others regularly.
const CURRENCIES = {
  EUR: { rate: 1, label: "€ EUR", code: "EUR", decimals: 2 },
  USD: { rate: 1.08, label: "$ USD", code: "USD", decimals: 2 },
  GBP: { rate: 0.85, label: "£ GBP", code: "GBP", decimals: 2 },
  CAD: { rate: 1.48, label: "$ CAD", code: "CAD", decimals: 2 },
  XAF: { rate: 655.957, label: "FCFA (XAF)", symbol: "FCFA", decimals: 0 },
  XOF: { rate: 655.957, label: "FCFA (XOF)", symbol: "FCFA", decimals: 0 },
  NGN: { rate: 1700, label: "₦ NGN", code: "NGN", decimals: 0 },
  GHS: { rate: 17, label: "₵ GHS", code: "GHS", decimals: 2 },
};

// Checkout countries. Cameroon gets MTN MoMo and Orange Money; everyone gets card and PayPal.
const COUNTRIES = ["Cameroon", "Nigeria", "Ghana", "United States", "Canada", "United Kingdom", "France", "Other country"];
const PAY_METHODS = {
  momo: { label: "MTN MoMo", phone: true, cm: true },
  om: { label: "Orange Money", phone: true, cm: true },
  card: { label: "Bank card" },
  paypal: { label: "PayPal" },
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
  get(key, fallback) { try { return JSON.parse(localStorage.getItem("ppf2_" + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("ppf2_" + key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

function guessLocale() {
  let tz = "", lang = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; lang = navigator.language || ""; } catch { /* ignore */ }
  if (tz === "Africa/Douala") return { currency: "XAF", country: "Cameroon" };
  if (tz === "Africa/Lagos") return { currency: "NGN", country: "Nigeria" };
  if (tz === "Africa/Accra") return { currency: "GHS", country: "Ghana" };
  if (/-CA$/.test(lang) || /^America\/(Toronto|Vancouver|Montreal|Edmonton|Winnipeg|Halifax)/.test(tz)) return { currency: "CAD", country: "Canada" };
  if (lang === "en-GB" || tz === "Europe/London") return { currency: "GBP", country: "United Kingdom" };
  if (lang === "en-US" || tz.startsWith("America/")) return { currency: "USD", country: "United States" };
  return { currency: "EUR", country: "Other country" };
}
const guess = guessLocale();

const state = {
  query: "", level: store.get("level", "A1"), family: "",
  currency: store.get("currency", guess.currency),
  country: store.get("country", guess.country),
  cart: store.get("cart", []), // [id]
  promo: store.get("promo", null),
};
if (!CURRENCIES[state.currency]) state.currency = "EUR";
if (!LEVELS.includes(state.level)) state.level = "A1";
state.cart = state.cart.filter((id) => PRODUCTS.some((p) => p.id === id));

const $ = (sel) => document.querySelector(sel);
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const inCart = (id) => state.cart.includes(id);

function money(eur, currency = state.currency) {
  const c = CURRENCIES[currency];
  const value = eur * c.rate;
  if (!c.code) return Math.round(value).toLocaleString("fr-FR") + " " + c.symbol;
  return value.toLocaleString("en-US", { style: "currency", currency: c.code, currencyDisplay: "narrowSymbol", minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2600);
}

const levelLabel = (p) => p.levels && p.levels.length > 1 ? `${p.levels[0]}–${p.levels[p.levels.length - 1]}` : p.level;
const typeLabel = { level: "Full level", module: "Module", exam: "Exam papers", practice: "Practice tests" };

// ====== Cart rules: a full level replaces its modules ======
function addToCart(id) {
  const p = byId(id);
  if (inCart(id)) { toast("Already in your cart"); return; }
  if (p.type === "module" && inCart(`level-${p.level}`)) { toast(`Included in the full ${p.level} level already in your cart`); return; }
  if (p.type === "level") {
    const before = state.cart.length;
    state.cart = state.cart.filter((cid) => !(byId(cid).type === "module" && byId(cid).level === p.level));
    const removed = before - state.cart.length;
    state.cart.push(id);
    toast(removed ? `Full ${p.level} level added; it replaces ${removed} module${removed > 1 ? "s" : ""}` : `Full ${p.level} level added`);
  } else {
    state.cart.push(id);
    toast(`"${p.short || p.name}" added`);
  }
  saveCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter((c) => c !== id);
  saveCart();
}

function saveCart() {
  store.set("cart", state.cart);
  renderCart();
  renderLevelPanel();
  renderCardsState();
}

function totals() {
  const subtotal = state.cart.reduce((s, id) => s + byId(id).price, 0);
  const promoDisc = state.promo ? subtotal * PROMO_CODES[state.promo] : 0;
  return { subtotal, promoDisc, total: subtotal - promoDisc };
}

// Suggest the full level when the modules already in the cart get close to its price.
function upgradeHints() {
  return LEVELS.map((lvl) => {
    const mods = state.cart.filter((id) => byId(id).type === "module" && byId(id).level === lvl);
    if (mods.length < 2 || inCart(`level-${lvl}`)) return null;
    const paid = mods.reduce((s, id) => s + byId(id).price, 0);
    const full = byId(`level-${lvl}`);
    return { lvl, extra: full.price - paid, count: LEVEL_COURSES[lvl].modules.length - mods.length };
  }).filter(Boolean);
}

function renderCart() {
  $("#cartCount").textContent = state.cart.length;
  $("#cartList").innerHTML = state.cart.length ? state.cart.map((id) => {
    const p = byId(id);
    return `<li class="cart-item">
      <div class="cart-thumb" style="--h:${p.hue}">${levelLabel(p)}</div>
      <div><h4>${p.name}</h4><small>${typeLabel[p.type]} · ${p.size}</small></div>
      <div class="cart-right"><strong>${money(p.price)}</strong><button class="remove" data-rm="${id}">Remove</button></div>
    </li>`;
  }).join("") + upgradeHints().map((h) => `<li class="upgrade">
      <span>${h.extra > 0 ? `Get the other ${h.count} ${h.lvl} modules for only <strong>${money(h.extra)}</strong> more` : `The full ${h.lvl} level is <strong>${money(-h.extra)}</strong> cheaper than these modules`}</span>
      <button class="btn btn-primary mini" data-add="level-${h.lvl}">Switch to full ${h.lvl}</button>
    </li>`).join("") : `<li class="empty">Your cart is empty.</li>`;

  const t = totals();
  $("#totals").innerHTML = `
    <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.promoDisc ? `<div class="disc"><span>Code ${state.promo}</span><span>−${money(t.promoDisc)}</span></div>` : ""}
    <div><span>Delivery</span><span>Instant access</span></div>
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`;
  $("#checkoutBtn").disabled = !state.cart.length;
  $("#waOrder").disabled = !state.cart.length;
}

// ====== Courses by level ======
function renderLevelTabs() {
  $("#levelTabs").innerHTML = LEVELS.map((lvl) => `<button role="tab" aria-selected="${lvl === state.level}" data-level="${lvl}" style="--h:${LEVEL_COURSES[lvl].hue}">
    <b>${lvl}</b><span>${LEVEL_COURSES[lvl].name}</span></button>`).join("");
}

function renderLevelPanel() {
  const lvl = state.level;
  const c = LEVEL_COURSES[lvl];
  const full = byId(`level-${lvl}`);
  const fullIn = inCart(full.id);
  const exams = PRODUCTS.filter((p) => p.type === "exam" && p.levels.includes(lvl));
  $("#levelPanel").innerHTML = `
    <div class="lp-head" style="--h:${c.hue}">
      <div class="lp-title"><span class="lp-code">${lvl}</span><div><h3>${c.name}</h3><p>${c.can}</p></div></div>
      <div class="lp-buy">
        <span class="lp-label">Full level · ${c.modules.length} modules</span>
        <span class="price">${money(full.price)} <s>${money(full.old)}</s></span>
        <button class="btn ${fullIn ? "btn-ghost" : "btn-light"}" data-add="${full.id}" ${fullIn ? "disabled" : ""}>${fullIn ? "In your cart" : "Add full level · save 30%"}</button>
      </div>
    </div>
    <ol class="modules">
      ${c.modules.map((title, i) => {
        const m = byId(`mod-${lvl}-${i + 1}`);
        const status = fullIn ? "Included" : inCart(m.id) ? "In cart" : "";
        return `<li>
          <span class="m-num">${i + 1}</span>
          <div class="m-body"><strong>${title}</strong><small>${m.size}</small></div>
          <span class="m-price">${money(m.price)}</span>
          <button class="btn ${status ? "btn-ghost" : "btn-primary"} mini" data-add="${m.id}" ${status ? "disabled" : ""}>${status || "Add"}</button>
        </li>`;
      }).join("")}
    </ol>
    <div class="lp-foot">
      <span>Train for this level:</span>
      <button class="link-btn" data-open="practice-${lvl}">${lvl} practice tests · ${money(byId(`practice-${lvl}`).price)}</button>
      ${exams.map((e) => `<button class="link-btn" data-open="${e.id}">${e.name}</button>`).join("")}
    </div>`;
  document.querySelectorAll("#levelTabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.level === lvl));
}

// ====== Product cards (exams, practice, search) ======
function coverHTML(p, big = false) {
  return `<div class="cover ${big ? "cover-big" : ""}" style="--h:${p.hue}">
    <span class="cover-level">${levelLabel(p)}</span>
    <span class="cover-cat">${typeLabel[p.type]}</span>
    <span class="cover-title">${p.type === "exam" ? p.name.replace(" exam papers", "") : p.type === "module" ? p.short : p.name}</span>
  </div>`;
}

function cardHTML(p) {
  const added = inCart(p.id) || (p.type === "module" && inCart(`level-${p.level}`));
  return `<article class="card">
    <button class="card-media" data-open="${p.id}" aria-label="View ${p.name}">${coverHTML(p)}</button>
    ${p.best ? `<div class="card-tags"><span class="tag best">Popular</span></div>` : ""}
    <div class="card-body">
      <h3><button data-open="${p.id}">${p.name}</button></h3>
      <div class="card-meta">${p.size}</div>
      <div class="price-row">
        <span class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</span>
        <button class="btn ${added ? "btn-ghost" : "btn-primary"} mini" data-add="${p.id}" data-card-add ${added ? "disabled" : ""}>${added ? "In cart" : "Add"}</button>
      </div>
    </div>
  </article>`;
}

function renderExams() {
  const list = PRODUCTS.filter((p) => p.type === "exam" && (!state.family || p.family === state.family));
  $("#examGrid").innerHTML = list.map(cardHTML).join("");
  document.querySelectorAll("#examFilter button").forEach((b) => b.classList.toggle("active", b.dataset.family === state.family));
}

function renderPractice() {
  $("#practiceGrid").innerHTML = PRODUCTS.filter((p) => p.type === "practice").map(cardHTML).join("");
}

function renderSearch() {
  const q = state.query.trim().toLowerCase();
  $("#results").hidden = !q;
  if (!q) return;
  const words = q.split(/\s+/);
  const list = PRODUCTS.filter((p) => {
    const hay = [p.name, p.desc, p.size, typeLabel[p.type], p.family || "", p.level, LEVEL_COURSES[p.level]?.name || ""].join(" ").toLowerCase();
    return words.every((w) => hay.includes(w));
  });
  $("#resultCount").textContent = `${list.length} result${list.length === 1 ? "" : "s"} for "${state.query.trim()}"`;
  $("#resultGrid").innerHTML = list.length ? list.map(cardHTML).join("") : `<p class="empty">Nothing found. Try a level (B1), an exam (DELF) or a topic (subjunctive).</p>`;
}

function renderCardsState() { renderExams(); renderPractice(); renderSearch(); }

// ====== Dialogs ======
const modal = $("#modal");
function openModal(html) {
  $("#modalBody").innerHTML = `<button class="icon-btn modal-close" data-modal-close aria-label="Close">✕</button>${html}`;
  if (!modal.open) modal.showModal();
}

function openProduct(id) {
  const p = byId(id);
  const included = p.type === "module" && inCart(`level-${p.level}`);
  const added = inCart(id) || included;
  openModal(`<div class="pd">
    <div class="pd-media">${coverHTML(p, true)}</div>
    <div class="pd-body">
      <p class="eyebrow">${typeLabel[p.type]}${p.family ? ` · ${p.family}` : ""}</p>
      <h2>${p.name}</h2>
      <p>${p.desc}</p>
      <div class="pd-facts">
        <div><span>Level</span>${p.levels ? p.levels.join(", ") : p.level}</div>
        <div><span>Content</span>${p.size}</div>
        <div><span>Access</span>Instant, for life</div>
        <div><span>Language of instruction</span>English</div>
      </div>
      <div class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</div>
      <div class="hero-cta tight">
        <button class="btn ${added ? "btn-ghost" : "btn-primary"}" data-add="${p.id}" ${added ? "disabled" : ""}>${included ? "Included in your full level" : added ? "In your cart" : "Add to cart"}</button>
        ${p.type === "module" || p.type === "level" ? `<button class="link-btn" data-goto-level="${p.level}">See all ${p.level} modules</button>` : ""}
      </div>
    </div>
  </div>`);
}

// ---- Checkout ----
// Cameroon: MTN MoMo, Orange Money, card and PayPal. Elsewhere: card and PayPal.
function methodsFor(country) {
  return Object.entries(PAY_METHODS).filter(([, m]) => country === "Cameroon" || !m.cm);
}

function renderPayOptions() {
  const country = $("#coCountry").value;
  const methods = methodsFor(country);
  $("#payMethods").innerHTML = methods.map(([k, m], i) => `<label class="pm pm-${k}"><input type="radio" name="pay" value="${k}" ${i === 0 ? "checked" : ""}> ${m.label}</label>`).join("");
  renderPayDetails();
}

function renderPayDetails() {
  const country = $("#coCountry").value;
  const method = document.querySelector('input[name="pay"]:checked')?.value;
  const m = PAY_METHODS[method];
  const t = totals();
  const fcfa = country === "Cameroon" && state.currency !== "XAF" ? `<div><span>Charged in FCFA</span><span>${money(t.total, "XAF")}</span></div>` : "";
  $("#payDetails").innerHTML = m?.phone ? `<label for="coMomo">${m.label} number
      <input id="coMomo" name="momo" type="tel" required inputmode="tel" placeholder="6XX XX XX XX" autocomplete="tel"></label>
      <p class="note">You will receive a payment request on this phone. Confirm it with your ${m.label} PIN.</p>` : "";
  $("#coTotals").innerHTML = `${fcfa}<div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`;
  $("#payBtn").textContent = m?.phone ? `Send ${m.label} request` : `Pay ${money(t.total)}`;
}

function openCheckout() {
  closeDrawers();
  openModal(`<form class="checkout" id="checkoutForm" novalidate>
    <h2>Checkout</h2>
    <div class="form-grid">
      <label for="coName">Full name<input id="coName" name="name" required autocomplete="name"></label>
      <label for="coEmail">Email (to receive your access)<input id="coEmail" name="email" type="email" required autocomplete="email"></label>
      <label for="coCountry">Country<select id="coCountry" name="country">${COUNTRIES.map((c) => `<option ${c === state.country ? "selected" : ""}>${c}</option>`).join("")}</select></label>
      <label for="coPhone">WhatsApp number (optional)<input id="coPhone" name="phone" type="tel" autocomplete="tel"></label>
    </div>
    <p class="eyebrow pm-title">Payment method</p>
    <div class="pay-methods" id="payMethods" role="radiogroup" aria-label="Payment method"></div>
    <div id="payDetails"></div>
    <div class="totals" id="coTotals"></div>
    <p class="form-error" id="formError" hidden></p>
    <button class="btn btn-primary btn-block" id="payBtn"></button>
    <p class="note">🔒 Demo checkout: no real payment is taken yet.</p>
  </form>`);
  renderPayOptions();
}

const CM_MOBILE = /^(?:\+?237)?6\d{8}$/;

function confirmOrder(form) {
  const data = new FormData(form);
  const err = $("#formError");
  const method = data.get("pay");
  const m = PAY_METHODS[method];
  let msg = "";
  if (!data.get("name").trim()) msg = "Please enter your name.";
  else if (!form.coEmail.checkValidity() || !data.get("email")) msg = "Please enter a valid email address: your access links are sent there.";
  else if (m.phone && !CM_MOBILE.test(String(data.get("momo")).replace(/[\s.-]/g, ""))) msg = `Enter a Cameroon mobile number for ${m.label}: 9 digits starting with 6, e.g. 677 12 34 56.`;
  if (msg) { err.textContent = msg; err.hidden = false; return; }

  state.country = data.get("country"); store.set("country", state.country);
  const ref = "PPF-" + Date.now().toString(36).toUpperCase().slice(-6);
  const t = totals();
  const amount = state.country === "Cameroon" ? money(t.total, "XAF") : money(t.total);
  const names = state.cart.map((id) => byId(id).name);
  state.cart = []; state.promo = null;
  store.set("promo", null);
  saveCart();
  openModal(`<div class="success">
    <h2 class="section-title">Merci, ${data.get("name").trim().split(" ")[0]}!</h2>
    <p>Order <strong>${ref}</strong> · ${amount} · ${m.label}</p>
    ${m.phone ? `<p class="note">In the live shop, the ${m.label} payment request would now go to ${data.get("momo")}.</p>` : ""}
    <ul class="ticks">${names.map((n) => `<li>${n}</li>`).join("")}</ul>
    <p>Your access links go to <strong>${data.get("email")}</strong>.</p>
    <button class="btn btn-primary" data-modal-close>Back to the shop</button>
  </div>`);
}

// ====== Placement test ======
let testStep = 0, testAnswers = [];
function openTest() { testStep = 0; testAnswers = []; closeDrawers(); renderTestStep(); }

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

function testResult() {
  let reached = "A0";
  for (const lvl of ["A1", "A2", "B1", "B2", "C1"]) {
    const score = TEST.filter((t, i) => t.lvl === lvl && testAnswers[i] === t.ok).length;
    if (score >= 2) reached = lvl; else break;
  }
  const correct = TEST.filter((t, i) => testAnswers[i] === t.ok).length;
  const next = LEVELS[Math.min(LEVELS.indexOf(reached) + 1, LEVELS.length - 1)];
  const picks = [`mod-${next}-1`, `practice-${reached === "A0" ? "A0" : reached}`, `level-${next}`].map(byId);
  state.level = next; store.set("level", next);
  renderLevelTabs(); renderLevelPanel();
  openModal(`<div class="quiz quiz-result">
    <p class="eyebrow">Your result · ${correct}/${TEST.length} correct</p>
    <h2>${reached === "A0" ? "Start at <em>A0</em>" : `You're around <em>${reached}</em>`}</h2>
    <p>${reached === "A0" ? "Perfect: everything is explained in English from the very first word." : `Your next step is <strong>${next}</strong>. A good way to begin:`}</p>
    <ul class="pick-list">${picks.map((p) => `<li><span>${p.name}</span><span><strong>${money(p.price)}</strong> <button class="btn btn-primary mini" data-add="${p.id}">Add</button></span></li>`).join("")}</ul>
    <div class="hero-cta tight">
      <button class="btn btn-ghost" data-goto-level="${next}">See all ${next} modules</button>
      <button class="link-btn" data-test>Retake the test</button>
    </div>
  </div>`);
}

// ====== WhatsApp ======
const whatsappLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
function whatsappOrder() {
  const lines = state.cart.map((id) => `• ${byId(id).name}`).join("\n");
  const text = `Hello, I'd like to order:\n${lines}\n\nTotal: ${money(totals().total)}${state.promo ? `\nPromo code: ${state.promo}` : ""}`;
  window.open(whatsappLink(text), "_blank", "noopener");
}

// ====== Drawer ======
function openDrawer() { $("#cart").classList.add("open"); $("#cart").setAttribute("aria-hidden", "false"); $("#overlay").hidden = false; }
function closeDrawers() { $("#cart").classList.remove("open"); $("#cart").setAttribute("aria-hidden", "true"); $("#overlay").hidden = true; }

// ====== Events ======
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-add],[data-open],[data-rm],[data-level],[data-family],[data-close],[data-modal-close],[data-test],[data-answer],[data-goto-level]");
  if (!el) return;
  const d = el.dataset;
  if (d.add) {
    addToCart(d.add);
    if (el.closest(".pd")) openProduct(d.add);
    else if (el.closest(".quiz")) { el.disabled = true; el.textContent = "Added"; }
  }
  else if (d.open) openProduct(d.open);
  else if (d.rm) removeFromCart(d.rm);
  else if (d.level) { state.level = d.level; store.set("level", d.level); renderLevelPanel(); }
  else if (d.family !== undefined) { state.family = d.family; renderExams(); }
  else if ("close" in d) closeDrawers();
  else if ("modalClose" in d) modal.close();
  else if ("test" in d) { e.preventDefault(); openTest(); }
  else if (d.answer !== undefined) {
    testAnswers[testStep] = +d.answer;
    testStep++;
    testStep < TEST.length ? renderTestStep() : testResult();
  }
  else if (d.gotoLevel) {
    if (modal.open) modal.close();
    state.level = d.gotoLevel; store.set("level", d.gotoLevel);
    renderLevelPanel();
    $("#courses").scrollIntoView();
  }
});

modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
modal.addEventListener("change", (e) => {
  if (e.target.id === "coCountry") renderPayOptions();
  else if (e.target.name === "pay") renderPayDetails();
});
modal.addEventListener("submit", (e) => { if (e.target.id === "checkoutForm") { e.preventDefault(); confirmOrder(e.target); } });

$("#cartBtn").addEventListener("click", openDrawer);
$("#overlay").addEventListener("click", closeDrawers);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawers(); });
$("#checkoutBtn").addEventListener("click", openCheckout);
$("#waOrder").addEventListener("click", whatsappOrder);

$("#search").addEventListener("input", (e) => { state.query = e.target.value; renderSearch(); });
$("#search").addEventListener("keydown", (e) => { if (e.key === "Enter" && state.query.trim()) $("#results").scrollIntoView(); });
$("#clearSearch").addEventListener("click", () => { state.query = ""; $("#search").value = ""; renderSearch(); });

$("#currency").addEventListener("change", (e) => {
  state.currency = e.target.value; store.set("currency", state.currency);
  renderAll();
});

$("#promoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = $("#promoInput").value.trim().toUpperCase();
  if (PROMO_CODES[code]) { state.promo = code; store.set("promo", code); toast("Code applied"); }
  else toast("This code isn't valid");
  $("#promoInput").value = "";
  renderCart();
});

$("#newsletter").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.reset();
  toast("Subscribed. Your code: WELCOME10");
});

function renderAll() {
  renderCart();
  renderLevelTabs();
  renderLevelPanel();
  renderCardsState();
}

// ====== Start ======
$("#currency").innerHTML = Object.entries(CURRENCIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
$("#currency").value = state.currency;
const waGreeting = whatsappLink("Hello, I have a question about your French courses.");
for (const sel of ["#waFloat", "#waFooter", "#waPay"]) { $(sel).href = waGreeting; $(sel).target = "_blank"; $(sel).rel = "noopener"; }
$("#year").textContent = new Date().getFullYear();
document.querySelectorAll("[data-module-count]").forEach((el) => { el.textContent = PRODUCTS.filter((p) => p.type === "module").length; });
renderAll();
