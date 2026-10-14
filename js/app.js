// ====== Shop settings (edit before launch) ======
const WHATSAPP_NUMBER = "33600000000"; // international format, no "+"
const PROMO_CODES = { WELCOME10: 0.10 };
const PACK_MIN = 3;
const PACK_DISCOUNT = 0.15;

// Indicative rates for 1 EUR. FCFA has a fixed parity with the euro; update the others regularly.
const CURRENCIES = {
  XAF: { rate: 655.957, label: "FCFA (XAF)", symbol: "FCFA", decimals: 0 },
  XOF: { rate: 655.957, label: "FCFA (XOF)", symbol: "FCFA", decimals: 0 },
  NGN: { rate: 1700, label: "₦ NGN", code: "NGN", decimals: 0 },
  GHS: { rate: 17, label: "₵ GHS", code: "GHS", decimals: 2 },
  USD: { rate: 1.08, label: "$ USD", code: "USD", decimals: 2 },
  CAD: { rate: 1.48, label: "$ CAD", code: "CAD", decimals: 2 },
  GBP: { rate: 0.85, label: "£ GBP", code: "GBP", decimals: 2 },
  EUR: { rate: 1, label: "€ EUR", code: "EUR", decimals: 2 },
};

const PLANS = [
  { name: "Monthly", price: 12, months: 1 },
  { name: "Quarterly", price: 9, months: 3, featured: true },
  { name: "Yearly", price: 7, months: 12 },
];

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
];

// ====== State ======
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem("ppf_" + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("ppf_" + key, JSON.stringify(value)); } catch { /* storage unavailable */ } },
};

const state = {
  cat: "", query: "", level: "", goal: "", format: "", sort: "best",
  currency: store.get("currency", "XAF"),
  cart: store.get("cart", []),     // [{ id, pack }]
  wish: store.get("wish", []),     // [id]
  builder: [],                     // [id]
  promo: store.get("promo", null),
};
if (!CURRENCIES[state.currency]) state.currency = "XAF";
state.cart = state.cart.filter((l) => PRODUCTS.some((p) => p.id === l.id));
state.wish = state.wish.filter((id) => PRODUCTS.some((p) => p.id === id));

const $ = (sel) => document.querySelector(sel);
const byId = (id) => PRODUCTS.find((p) => p.id === id);

function money(eur) {
  const c = CURRENCIES[state.currency];
  const value = eur * c.rate;
  if (!c.code) return Math.round(value).toLocaleString("fr-FR") + " " + c.symbol;
  return value.toLocaleString("en-US", { style: "currency", currency: c.code, currencyDisplay: "narrowSymbol", minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
}
const priceTag = (p) => money(p.price) + (p.per ? ` / ${p.per}` : "");
const levelRange = (p) => p.levels.length > 1 ? `${p.levels[0]}–${p.levels[p.levels.length - 1]}` : p.levels[0];

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ====== Header & filters ======
function renderSelectors() {
  $("#currency").innerHTML = Object.entries(CURRENCIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
  $("#currency").value = state.currency;
  $("#level").insertAdjacentHTML("beforeend", LEVELS.map((l) => `<option>${l}</option>`).join(""));
  $("#goal").insertAdjacentHTML("beforeend", Object.entries(GOALS).map(([k, v]) => `<option value="${k}">${v}</option>`).join(""));
  $("#format").insertAdjacentHTML("beforeend", Object.entries(FORMATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join(""));
  const cats = [["", "All"], ...Object.entries(CATEGORIES)];
  $("#catNav").innerHTML = cats.map(([k, v]) => `<button data-cat="${k}">${v}</button>`).join("");
  $("#footerCats").innerHTML = Object.entries(CATEGORIES).map(([k, v]) => `<li><a href="#shop" data-cat="${k}">${v}</a></li>`).join("");
}

// ====== Catalogue ======
function filtered() {
  const q = state.query.trim().toLowerCase();
  const list = PRODUCTS.filter((p) =>
    (!state.cat || p.cat === state.cat) &&
    (!state.level || p.levels.includes(state.level)) &&
    (!state.goal || p.goals.includes(state.goal)) &&
    (!state.format || p.formats.includes(state.format)) &&
    (!q || [p.name, p.desc, p.size, CATEGORIES[p.cat], ...p.levels, ...p.goals.map((g) => GOALS[g])].join(" ").toLowerCase().includes(q))
  );
  const sorters = {
    best: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0) || a.id - b.id,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    level: (a, b) => LEVELS.indexOf(a.levels[0]) - LEVELS.indexOf(b.levels[0]) || a.price - b.price,
  };
  return list.sort(sorters[state.sort]);
}

function coverHTML(p, big = false) {
  return `<div class="cover ${big ? "cover-big" : ""}" style="--h:${p.hue}">
    <span class="cover-level">${levelRange(p)}</span>
    <span class="cover-cat">${CATEGORIES[p.cat]}</span>
    <span class="cover-title">${p.name}</span>
  </div>`;
}

function cardHTML(p) {
  const wished = state.wish.includes(p.id);
  const promo = p.old ? `<span class="tag promo">−${Math.round((1 - p.price / p.old) * 100)}%</span>` : "";
  const best = p.best ? `<span class="tag best">Popular</span>` : "";
  return `<article class="card">
    <button class="card-media" data-open="${p.id}" aria-label="View ${p.name}">${coverHTML(p)}</button>
    <div class="card-tags">${promo}${best}</div>
    <button class="wish-toggle" data-wish="${p.id}" aria-label="${wished ? "Remove from saved" : "Save"}">${wished ? "♥" : "♡"}</button>
    <div class="card-body">
      <h3><button data-open="${p.id}">${p.name}</button></h3>
      <div class="card-meta">${p.size}</div>
      <div class="chips">${p.formats.map((f) => `<span class="chip">${FORMATS[f]}</span>`).join("")}</div>
      <div class="price-row">
        <span class="price">${priceTag(p)}${p.old ? `<s>${money(p.old)}</s>` : ""}</span>
        <div class="card-actions">
          <button class="btn btn-ghost mini" data-pack="${p.id}" title="Add to your pack">＋ Pack</button>
          <button class="btn btn-primary mini" data-add="${p.id}">Add</button>
        </div>
      </div>
    </div>
  </article>`;
}

function renderGrid() {
  const list = filtered();
  $("#resultCount").textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  $("#grid").innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<p class="empty">No product matches. Try another level or goal.</p>`;
  document.querySelectorAll("#catNav button").forEach((b) => b.classList.toggle("active", b.dataset.cat === state.cat));
}

// ====== Cart (digital products: one of each) ======
function saveCart() { store.set("cart", state.cart); }

function addToCart(id, pack = false) {
  const p = byId(id);
  const line = state.cart.find((l) => l.id === id);
  if (line) {
    if (pack && !line.pack) { line.pack = true; saveCart(); renderCart(); }
    else if (!pack) toast(`"${p.name}" is already in your cart`);
    return;
  }
  state.cart.push({ id, pack });
  saveCart();
  renderCart();
  if (!pack) toast(`"${p.name}" added to cart`);
}

function totals() {
  let subtotal = 0, packSum = 0, packCount = 0;
  for (const l of state.cart) {
    const p = byId(l.id);
    subtotal += p.price;
    if (l.pack) { packSum += p.price; packCount++; }
  }
  const packDisc = packCount >= PACK_MIN ? packSum * PACK_DISCOUNT : 0;
  const promoDisc = state.promo ? (subtotal - packDisc) * PROMO_CODES[state.promo] : 0;
  return { subtotal, packDisc, promoDisc, total: subtotal - packDisc - promoDisc };
}

function renderCart() {
  $("#cartCount").textContent = state.cart.length;
  $("#wishCount").textContent = state.wish.length;

  $("#cartList").innerHTML = state.cart.length ? state.cart.map((l, i) => {
    const p = byId(l.id);
    return `<li class="cart-item">
      <div class="cart-thumb" style="--h:${p.hue}">${levelRange(p)}</div>
      <div><h4>${p.name}${l.pack ? ` <span class="chip">Pack</span>` : ""}</h4><small>${p.size}</small></div>
      <div class="cart-right"><strong>${priceTag(p)}</strong><button class="remove" data-rm="${i}">Remove</button></div>
    </li>`;
  }).join("") : `<li class="empty">Your cart is empty.</li>`;

  const t = totals();
  $("#totals").innerHTML = `
    <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.packDisc ? `<div class="disc"><span>Your pack −15%</span><span>−${money(t.packDisc)}</span></div>` : ""}
    ${t.promoDisc ? `<div class="disc"><span>Code ${state.promo}</span><span>−${money(t.promoDisc)}</span></div>` : ""}
    <div><span>Delivery</span><span>Instant download</span></div>
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`;
  $("#checkoutBtn").disabled = !state.cart.length;
  $("#waOrder").disabled = !state.cart.length;

  $("#wishList").innerHTML = state.wish.length ? state.wish.map((id) => {
    const p = byId(id);
    return `<li class="cart-item">
      <div class="cart-thumb" style="--h:${p.hue}">${levelRange(p)}</div>
      <div><h4>${p.name}</h4><small>${priceTag(p)}</small></div>
      <div><button class="btn btn-primary mini" data-add="${p.id}">Add</button></div>
    </li>`;
  }).join("") : `<li class="empty">Nothing saved yet.</li>`;
}

// ====== Pack builder ======
function renderBuilder() {
  const items = state.builder.map(byId);
  $("#builderList").innerHTML = items.length
    ? items.map((p, i) => `<li><span>${p.name} <small>${levelRange(p)}</small></span><span>${money(p.price)} <button class="remove" data-brm="${i}" aria-label="Remove ${p.name}">✕</button></span></li>`).join("")
    : `<li class="hint">Tap "＋ Pack" on the products you want…</li>`;
  const sum = items.reduce((s, p) => s + p.price, 0);
  const ok = items.length >= PACK_MIN;
  $("#builderTotal").innerHTML = !items.length ? ""
    : ok ? `Pack price: <s>${money(sum)}</s> <span class="ok">${money(sum * (1 - PACK_DISCOUNT))}</span>`
    : `Add ${PACK_MIN - items.length} more to unlock −15%`;
  $("#builderAdd").disabled = !ok;
}

// ====== Dialogs ======
const modal = $("#modal");
function openModal(html) {
  $("#modalBody").innerHTML = `<button class="icon-btn modal-close" data-modal-close aria-label="Close">✕</button>${html}`;
  if (!modal.open) modal.showModal();
}

function openProduct(id) {
  const p = byId(id);
  openModal(`<div class="pd">
    <div class="pd-media">${coverHTML(p, true)}</div>
    <div class="pd-body">
      <p class="eyebrow">${CATEGORIES[p.cat]}</p>
      <h2>${p.name}</h2>
      <p>${p.desc}</p>
      <div class="pd-facts">
        <div><span>Level</span>${p.levels.join(", ")}</div>
        <div><span>Content</span>${p.size}</div>
        <div><span>Format</span>${p.formats.map((f) => FORMATS[f]).join(", ")}</div>
        <div><span>Best for</span>${p.goals.map((g) => GOALS[g]).join(", ")}</div>
      </div>
      <div class="price">${priceTag(p)}${p.old ? `<s>${money(p.old)}</s>` : ""}</div>
      <div class="hero-cta tight">
        <button class="btn btn-primary" data-add="${p.id}">Add to cart</button>
        <button class="btn btn-ghost" data-pack="${p.id}">＋ Pack</button>
      </div>
    </div>
  </div>`);
}

function openCheckout() {
  const t = totals();
  closeDrawers();
  openModal(`<form class="checkout" id="checkoutForm">
    <h2>Checkout</h2>
    <div class="form-grid">
      <label for="coName">Full name<input id="coName" name="name" required autocomplete="name"></label>
      <label for="coEmail">Email (to receive your links)<input id="coEmail" name="email" type="email" required autocomplete="email"></label>
      <label for="coPhone" class="full">WhatsApp number<input id="coPhone" name="phone" type="tel" required autocomplete="tel" placeholder="+237 6…"></label>
    </div>
    <div class="pay-methods" role="radiogroup" aria-label="Payment method">
      <label><input type="radio" name="pay" value="Mobile Money" checked> 📱 Mobile Money</label>
      <label><input type="radio" name="pay" value="Card"> 💳 Card</label>
      <label><input type="radio" name="pay" value="PayPal"> 🅿️ PayPal</label>
    </div>
    <div class="totals"><div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div>
    <button class="btn btn-primary btn-block">Pay ${money(t.total)}</button>
    <p class="note">🔒 Demo checkout: no real payment is taken yet.</p>
  </form>`);
}

function confirmOrder(form) {
  const data = new FormData(form);
  const ref = "PPF-" + Date.now().toString(36).toUpperCase().slice(-6);
  const total = money(totals().total);
  const names = state.cart.map((l) => byId(l.id).name);
  state.cart = []; state.promo = null;
  saveCart(); store.set("promo", null);
  renderCart();
  openModal(`<div class="success">
    <h2 class="section-title">Merci, ${data.get("name").split(" ")[0]}!</h2>
    <p>Order <strong>${ref}</strong> · ${total} · ${data.get("pay")}</p>
    <ul class="ticks">${names.map((n) => `<li>${n}</li>`).join("")}</ul>
    <p>Your access links go to <strong>${data.get("email")}</strong> and to your WhatsApp.</p>
    <button class="btn btn-primary" data-modal-close>Back to the shop</button>
  </div>`);
}

// ====== Placement test ======
let testStep = 0, testAnswers = [];

function openTest() {
  testStep = 0; testAnswers = [];
  closeDrawers();
  renderTestStep();
}

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
  let reached = "A1", started = false;
  for (const lvl of ["A1", "A2", "B1", "B2"]) {
    const qs = TEST.map((t, i) => ({ t, i })).filter((x) => x.t.lvl === lvl);
    const score = qs.filter((x) => testAnswers[x.i] === x.t.ok).length;
    if (score >= 2) { reached = lvl; started = true; } else break;
  }
  const correct = TEST.filter((t, i) => testAnswers[i] === t.ok).length;
  const target = !started ? "A1" : LEVELS[Math.min(LEVELS.indexOf(reached) + 1, LEVELS.length - 1)];
  const picks = PRODUCTS.filter((p) => p.levels.includes(target) && p.cat !== "bundles").sort((a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0)).slice(0, 3);
  store.set("level", started ? reached : "A1");
  openModal(`<div class="quiz quiz-result">
    <p class="eyebrow">Your result · ${correct}/${TEST.length} correct</p>
    <h2>${started ? `You're around <em>${reached}</em>` : "You're starting at <em>A1</em>"}</h2>
    <p>${started ? `Your next step is <strong>${target}</strong>. These products fit it:` : "Perfect: everything below is explained in English from the very first word."}</p>
    <ul class="pick-list">${picks.map((p) => `<li><span>${p.name} <small>${levelRange(p)}</small></span><span><strong>${priceTag(p)}</strong> <button class="btn btn-primary mini" data-add="${p.id}">Add</button></span></li>`).join("")}</ul>
    <div class="hero-cta tight">
      <button class="btn btn-ghost" data-show-level="${target}">See all ${target} products</button>
      <button class="link-btn" data-test>Retake the test</button>
    </div>
  </div>`);
}

// ====== WhatsApp ======
const whatsappLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
function whatsappOrder() {
  const lines = state.cart.map((l) => `• ${byId(l.id).name}${l.pack ? " (pack)" : ""}`).join("\n");
  const text = `Hello, I'd like to order:\n${lines}\n\nTotal: ${money(totals().total)}${state.promo ? `\nPromo code: ${state.promo}` : ""}`;
  window.open(whatsappLink(text), "_blank", "noopener");
}

// ====== Drawers ======
function openDrawer(id) {
  closeDrawers();
  $(id).classList.add("open");
  $(id).setAttribute("aria-hidden", "false");
  $("#overlay").hidden = false;
}
function closeDrawers() {
  document.querySelectorAll(".drawer").forEach((d) => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
  $("#overlay").hidden = true;
}

// ====== Events ======
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-add],[data-open],[data-wish],[data-pack],[data-rm],[data-brm],[data-cat],[data-close],[data-modal-close],[data-plan],[data-test],[data-answer],[data-show-level]");
  if (!el) return;
  const d = el.dataset;
  if (d.add) addToCart(+d.add);
  else if (d.open) openProduct(+d.open);
  else if (d.wish) {
    const id = +d.wish;
    state.wish = state.wish.includes(id) ? state.wish.filter((w) => w !== id) : [...state.wish, id];
    store.set("wish", state.wish);
    renderGrid(); renderCart();
  }
  else if (d.pack) {
    const id = +d.pack;
    if (state.builder.includes(id)) { toast("Already in your pack"); return; }
    state.builder.push(id);
    renderBuilder();
    toast(`Added to your pack (${state.builder.length})`);
  }
  else if (d.rm) { state.cart.splice(+d.rm, 1); saveCart(); renderCart(); }
  else if (d.brm) { state.builder.splice(+d.brm, 1); renderBuilder(); }
  else if (d.cat !== undefined) { state.cat = d.cat; renderGrid(); }
  else if ("close" in d) closeDrawers();
  else if ("modalClose" in d) modal.close();
  else if ("test" in d) { e.preventDefault(); openTest(); }
  else if (d.answer !== undefined) {
    testAnswers[testStep] = +d.answer;
    testStep++;
    testStep < TEST.length ? renderTestStep() : testResult();
  }
  else if (d.showLevel) {
    modal.close();
    state.level = d.showLevel; state.cat = "";
    $("#level").value = d.showLevel;
    renderGrid();
    $("#shop").scrollIntoView();
  }
  else if (d.plan) {
    const plan = PLANS[+d.plan];
    window.open(whatsappLink(`Hello, I'd like to join the Pas-Pas Club (${plan.name} plan, ${money(plan.price)}/month).`), "_blank", "noopener");
  }
});

modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
modal.addEventListener("submit", (e) => { if (e.target.id === "checkoutForm") { e.preventDefault(); confirmOrder(e.target); } });

$("#cartBtn").addEventListener("click", () => openDrawer("#cart"));
$("#wishBtn").addEventListener("click", () => openDrawer("#wish"));
$("#overlay").addEventListener("click", closeDrawers);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawers(); });
$("#checkoutBtn").addEventListener("click", openCheckout);
$("#waOrder").addEventListener("click", whatsappOrder);

$("#search").addEventListener("input", (e) => { state.query = e.target.value; renderGrid(); });
$("#search").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#shop").scrollIntoView(); });
for (const key of ["level", "goal", "format", "sort"]) {
  $("#" + key).addEventListener("change", (e) => { state[key] = e.target.value; renderGrid(); });
}
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

$("#builderAdd").addEventListener("click", () => {
  state.builder.forEach((id) => addToCart(id, true));
  state.builder = [];
  renderBuilder();
  openDrawer("#cart");
});

$("#newsletter").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.reset();
  toast("Subscribed. Your code: WELCOME10");
});

function renderPlans() {
  $("#plans").innerHTML = PLANS.map((p, i) => `<div class="plan ${p.featured ? "featured" : ""}">
    <h3>${p.name}</h3>
    <span class="price">${money(p.price)}</span><small>per month${p.months > 1 ? `, billed ${money(p.price * p.months)} every ${p.months} months` : ""}</small>
    <button class="btn ${p.featured ? "btn-primary" : "btn-ghost"} mini" data-plan="${i}">Join</button>
  </div>`).join("");
}

function renderAll() {
  renderGrid();
  renderCart();
  renderBuilder();
  renderPlans();
}

// ====== Start ======
const waGreeting = whatsappLink("Hello, I have a question about your French courses.");
$("#waFloat").href = waGreeting;
$("#waFooter").href = waGreeting;
$("#waFooter").target = "_blank";
$("#year").textContent = new Date().getFullYear();
renderSelectors();
renderAll();
