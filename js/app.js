// ====== Configuration boutique (à adapter) ======
const WHATSAPP_NUMBER = "33600000000"; // format international sans "+"
const PROMO_CODES = { BIENVENUE10: 0.10 };
const BUNDLE_MIN = 3;
const BUNDLE_DISCOUNT = 0.10;

const ZONES = {
  FR: { name: "France métropolitaine", cost: 5.9, free: 79, delay: "48–72 h", fresh: true },
  EU: { name: "Union européenne", cost: 12.9, free: 129, delay: "3–5 jours", fresh: false },
  UK: { name: "Royaume-Uni & Suisse", cost: 16.9, free: 149, delay: "3–6 jours", fresh: false },
  AF: { name: "Afrique francophone", cost: 24.9, free: 199, delay: "6–10 jours", fresh: false },
  NA: { name: "Canada & États-Unis", cost: 29.9, free: 249, delay: "5–8 jours", fresh: false },
  WW: { name: "Reste du monde", cost: 34.9, free: 299, delay: "7–14 jours", fresh: false },
};

// Taux indicatifs ; FCFA à parité fixe avec l'euro.
const CURRENCIES = {
  EUR: { rate: 1, label: "€ EUR", decimals: 2, locale: "fr-FR" },
  XAF: { rate: 655.957, label: "FCFA (XAF)", decimals: 0, locale: "fr-CM" },
  XOF: { rate: 655.957, label: "FCFA (XOF)", decimals: 0, locale: "fr-SN" },
  USD: { rate: 1.08, label: "$ USD", decimals: 2, locale: "en-US" },
  GBP: { rate: 0.85, label: "£ GBP", decimals: 2, locale: "en-GB" },
  CAD: { rate: 1.48, label: "$ CAD", decimals: 2, locale: "fr-CA" },
};

const PLANS = [
  { name: "Découverte", items: "5 produits", price: 29.9 },
  { name: "Gourmet", items: "7 produits + 1 vin", price: 49.9, featured: true },
  { name: "Prestige", items: "8 produits premium", price: 79.9 },
];

// ====== État ======
const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem("pp_" + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem("pp_" + key, JSON.stringify(value)); } catch { /* stockage indisponible */ } },
};

const state = {
  cat: "",
  query: "",
  region: "",
  label: "",
  sort: "best",
  onlyShippable: false,
  zone: store.get("zone", "FR"),
  currency: store.get("currency", "EUR"),
  cart: store.get("cart", []),       // [{ id, qty, bundle }]
  wish: store.get("wish", []),       // [id]
  builder: [],                       // [id]
  promo: store.get("promo", null),
};
if (!ZONES[state.zone]) state.zone = "FR";
if (!CURRENCIES[state.currency]) state.currency = "EUR";

const $ = (sel) => document.querySelector(sel);
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const zone = () => ZONES[state.zone];

function money(eur) {
  const c = CURRENCIES[state.currency];
  const value = eur * c.rate;
  const code = state.currency === "XAF" || state.currency === "XOF" ? null : state.currency;
  if (!code) return Math.round(value).toLocaleString("fr-FR") + " FCFA";
  return value.toLocaleString(c.locale, { style: "currency", currency: code, minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
}

const canShip = (p) => p.intl || zone().fresh;
const stars = (r) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ====== Rendu : en-tête, filtres ======
function renderSelectors() {
  $("#zone").innerHTML = Object.entries(ZONES).map(([k, z]) => `<option value="${k}">${z.name}</option>`).join("");
  $("#zone").value = state.zone;
  $("#currency").innerHTML = Object.entries(CURRENCIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join("");
  $("#currency").value = state.currency;

  const regions = [...new Set(PRODUCTS.map((p) => p.region))].sort((a, b) => a.localeCompare(b, "fr"));
  $("#region").insertAdjacentHTML("beforeend", regions.map((r) => `<option>${r}</option>`).join(""));
  $("#label").insertAdjacentHTML("beforeend", LABELS.map((l) => `<option>${l}</option>`).join(""));

  const cats = [["", "Tout"], ...Object.entries(CATEGORIES)];
  $("#catNav").innerHTML = cats.map(([k, v]) => `<button data-cat="${k}" class="${k === state.cat ? "active" : ""}">${v}</button>`).join("");
  $("#footerCats").innerHTML = Object.entries(CATEGORIES).map(([k, v]) => `<li><a href="#boutique" data-cat="${k}">${v}</a></li>`).join("");
}

function renderShipping() {
  const z = zone();
  $("#shipZone").textContent = z.name;
  $("#shipDelay").textContent = z.delay;
  $("#shipCost").textContent = money(z.cost);
  $("#shipFree").textContent = money(z.free);
  $("#freeShipTop").textContent = money(z.free);
  $("#zoneTop").textContent = z.name.split(" (")[0];
  $("#shipNote").textContent = z.fresh
    ? "Tous nos produits, frais compris, sont livrables chez vous."
    : "Produits frais (fromages, charcuterie, pâtisseries) réservés à la France. Droits de douane éventuels à la charge du destinataire hors UE.";
}

// ====== Catalogue ======
function filtered() {
  const q = state.query.trim().toLowerCase();
  let list = PRODUCTS.filter((p) =>
    (!state.cat || p.cat === state.cat) &&
    (!state.region || p.region === state.region) &&
    (!state.label || p.label === state.label) &&
    (!state.onlyShippable || canShip(p)) &&
    (!q || [p.name, p.region, p.producer, p.label, CATEGORIES[p.cat]].join(" ").toLowerCase().includes(q))
  );
  const sorters = {
    best: (a, b) => (b.best ? 1 : 0) - (a.best ? 1 : 0) || b.reviews - a.reviews,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    rating: (a, b) => b.rating - a.rating,
  };
  return list.sort(sorters[state.sort]);
}

function cardHTML(p) {
  const wished = state.wish.includes(p.id);
  const promo = p.old ? `<span class="tag promo">−${Math.round((1 - p.price / p.old) * 100)} %</span>` : "";
  const best = p.best ? `<span class="tag best">Best-seller</span>` : "";
  return `<article class="card">
    <button class="card-media" style="background:${p.color}" data-open="${p.id}" aria-label="Voir ${p.name}">
      <span aria-hidden="true">${p.emoji}</span>
    </button>
    <div class="card-tags">${promo}${best}<span class="tag">${p.label}</span></div>
    <button class="wish-toggle" data-wish="${p.id}" aria-label="Ajouter aux favoris">${wished ? "♥" : "♡"}</button>
    <div class="card-body">
      <div class="card-meta"><span>📍 ${p.region}</span><span>${CATEGORIES[p.cat]}</span></div>
      <h3><button data-open="${p.id}">${p.name}</button></h3>
      <div class="rating">${stars(p.rating)} <small>${p.rating.toLocaleString("fr-FR")} (${p.reviews})</small></div>
      <div class="ship-flag ${canShip(p) ? "ok" : "no"}">${canShip(p) ? "✔ Livrable dans votre zone" : "✘ France uniquement (produit frais)"}</div>
      <div class="price-row">
        <span class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</span>
        <div class="card-actions">
          <button class="btn btn-ghost mini" data-bundle="${p.id}" title="Ajouter au coffret">＋ Coffret</button>
          <button class="btn btn-primary mini" data-add="${p.id}" ${canShip(p) ? "" : "disabled"}>Ajouter</button>
        </div>
      </div>
    </div>
  </article>`;
}

function renderGrid() {
  const list = filtered();
  $("#resultCount").textContent = `${list.length} produit${list.length > 1 ? "s" : ""}`;
  $("#grid").innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<p class="empty">Aucun produit ne correspond. Essayez une autre recherche.</p>`;
  document.querySelectorAll("#catNav button").forEach((b) => b.classList.toggle("active", b.dataset.cat === state.cat));
}

// ====== Panier ======
function saveCart() { store.set("cart", state.cart); }

function addToCart(id, qty = 1, bundle = false) {
  const p = byId(id);
  if (!canShip(p)) { toast("Ce produit frais n'est livrable qu'en France."); return; }
  const line = state.cart.find((l) => l.id === id && l.bundle === bundle);
  if (line) line.qty += qty; else state.cart.push({ id, qty, bundle });
  saveCart();
  renderCart();
  if (!bundle) toast(`« ${p.name} » ajouté au panier`);
}

function totals() {
  const z = zone();
  let subtotal = 0, bundleSum = 0, bundleCount = 0;
  const blocked = [];
  for (const l of state.cart) {
    const p = byId(l.id);
    subtotal += p.price * l.qty;
    if (l.bundle) { bundleSum += p.price * l.qty; bundleCount += l.qty; }
    if (!canShip(p)) blocked.push(p.name);
  }
  const bundleDisc = bundleCount >= BUNDLE_MIN ? bundleSum * BUNDLE_DISCOUNT : 0;
  const promoDisc = state.promo ? (subtotal - bundleDisc) * PROMO_CODES[state.promo] : 0;
  const net = subtotal - bundleDisc - promoDisc;
  const shipping = subtotal === 0 || subtotal >= z.free ? 0 : z.cost;
  return { subtotal, bundleDisc, promoDisc, shipping, total: net + shipping, blocked };
}

function renderCart() {
  const count = state.cart.reduce((s, l) => s + l.qty, 0);
  $("#cartCount").textContent = count;
  $("#wishCount").textContent = state.wish.length;

  $("#cartList").innerHTML = state.cart.length ? state.cart.map((l, i) => {
    const p = byId(l.id);
    return `<li class="cart-item">
      <div class="cart-thumb" style="background:${p.color}">${p.emoji}</div>
      <div>
        <h4>${p.name}${l.bundle ? " 🎁" : ""}</h4>
        <small>${money(p.price)} · ${p.region}</small>${canShip(p) ? "" : `<br><small style="color:var(--rouge)">Non livrable dans votre zone</small>`}
        <div class="qty"><button data-dec="${i}" aria-label="Moins">−</button><span>${l.qty}</span><button data-inc="${i}" aria-label="Plus">+</button></div>
      </div>
      <div style="text-align:right"><strong>${money(p.price * l.qty)}</strong><br><button class="remove" data-rm="${i}">Retirer</button></div>
    </li>`;
  }).join("") : `<li class="empty">Votre panier est vide.</li>`;

  const t = totals();
  const z = zone();
  const remaining = z.free - t.subtotal;
  $("#freeMsg").innerHTML = remaining > 0
    ? `Plus que <strong>${money(remaining)}</strong> pour la livraison offerte (${z.name.split(" (")[0]})`
    : `🎉 Livraison offerte !`;
  $("#freeBar").style.width = Math.min(100, (t.subtotal / z.free) * 100) + "%";

  $("#totals").innerHTML = `
    <div><span>Sous-total</span><span>${money(t.subtotal)}</span></div>
    ${t.bundleDisc ? `<div class="disc"><span>Coffret sur mesure −10 %</span><span>−${money(t.bundleDisc)}</span></div>` : ""}
    ${t.promoDisc ? `<div class="disc"><span>Code ${state.promo}</span><span>−${money(t.promoDisc)}</span></div>` : ""}
    <div><span>Livraison (${z.delay})</span><span>${t.shipping ? money(t.shipping) : "Offerte"}</span></div>
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>
    ${t.blocked.length ? `<div class="warn">Retirez les produits non livrables pour commander.</div>` : ""}`;
  const disabled = !state.cart.length || t.blocked.length > 0;
  $("#checkoutBtn").disabled = disabled;
  $("#waOrder").disabled = disabled;

  renderWish();
}

function renderWish() {
  $("#wishList").innerHTML = state.wish.length ? state.wish.map((id) => {
    const p = byId(id);
    return `<li class="cart-item">
      <div class="cart-thumb" style="background:${p.color}">${p.emoji}</div>
      <div><h4>${p.name}</h4><small>${money(p.price)}</small></div>
      <div><button class="btn btn-primary mini" data-add="${p.id}" ${canShip(p) ? "" : "disabled"}>Ajouter</button></div>
    </li>`;
  }).join("") : `<li class="empty">Aucun favori pour l'instant.</li>`;
}

// ====== Coffret sur mesure ======
function renderBuilder() {
  const items = state.builder.map(byId);
  $("#builderList").innerHTML = items.length
    ? items.map((p, i) => `<li><span>${p.emoji} ${p.name}</span><span>${money(p.price)} <button class="remove" data-brm="${i}">✕</button></span></li>`).join("")
    : `<li class="hint">Ajoutez des produits avec « ＋ Coffret »…</li>`;
  const sum = items.reduce((s, p) => s + p.price, 0);
  const ok = items.length >= BUNDLE_MIN;
  $("#builderTotal").innerHTML = items.length
    ? ok
      ? `Total : <s>${money(sum)}</s> <span style="color:var(--vert)">${money(sum * (1 - BUNDLE_DISCOUNT))}</span>`
      : `Encore ${BUNDLE_MIN - items.length} produit(s) pour débloquer −10 %`
    : "";
  $("#builderAdd").disabled = !ok;
}

// ====== Modales ======
const modal = $("#modal");
function openModal(html) {
  $("#modalBody").innerHTML = `<button class="icon-btn modal-close" data-modal-close aria-label="Fermer">✕</button>${html}`;
  if (!modal.open) modal.showModal();
}

function openProduct(id) {
  const p = byId(id);
  openModal(`<div class="pd">
    <div class="pd-media" style="background:${p.color}">${p.emoji}</div>
    <div class="pd-body">
      <p class="eyebrow">${CATEGORIES[p.cat]} · ${p.label}</p>
      <h2>${p.name}</h2>
      <div class="rating">${stars(p.rating)} <small>${p.rating.toLocaleString("fr-FR")}/5 — ${p.reviews} avis vérifiés</small></div>
      <p>${p.desc}</p>
      <div class="pd-facts">
        <div><span>Région</span>${p.region}</div>
        <div><span>Producteur</span>${p.producer}</div>
        <div><span>Label</span>${p.label}</div>
        <div><span>Livraison</span>${canShip(p) ? zone().delay : "France uniquement"}</div>
      </div>
      ${p.alcohol ? `<small>🔞 Vente interdite aux mineurs. À consommer avec modération.</small>` : ""}
      <div class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</div>
      <div class="hero-cta" style="margin:0">
        <button class="btn btn-primary" data-add="${p.id}" ${canShip(p) ? "" : "disabled"}>Ajouter au panier</button>
        <button class="btn btn-ghost" data-bundle="${p.id}">＋ Coffret</button>
      </div>
    </div>
  </div>`);
}

function openCheckout() {
  const t = totals();
  const hasAlcohol = state.cart.some((l) => byId(l.id).alcohol);
  closeDrawers();
  openModal(`<form class="checkout" id="checkoutForm">
    <h2>Finaliser ma commande</h2>
    <div class="form-grid">
      <label>Prénom<input name="first" required autocomplete="given-name"></label>
      <label>Nom<input name="last" required autocomplete="family-name"></label>
      <label>E-mail<input name="email" type="email" required autocomplete="email"></label>
      <label>Téléphone / WhatsApp<input name="phone" type="tel" required autocomplete="tel"></label>
      <label class="full">Adresse<input name="address" required autocomplete="street-address"></label>
      <label>Ville<input name="city" required autocomplete="address-level2"></label>
      <label>Pays<input name="country" required autocomplete="country-name"></label>
    </div>
    <div class="pay-methods" role="radiogroup" aria-label="Moyen de paiement">
      <label><input type="radio" name="pay" value="Carte bancaire" checked> 💳 Carte bancaire</label>
      <label><input type="radio" name="pay" value="PayPal"> 🅿️ PayPal</label>
      <label><input type="radio" name="pay" value="Mobile Money"> 📱 Mobile Money</label>
      <label><input type="radio" name="pay" value="Virement"> 🏦 Virement</label>
    </div>
    ${hasAlcohol ? `<label class="check"><input type="checkbox" required> Je certifie avoir 18 ans ou plus.</label>` : ""}
    <div class="totals" style="margin-top:1em">
      <div><span>Livraison vers</span><span>${zone().name}</span></div>
      <div class="grand"><span>Total à payer</span><span>${money(t.total)}</span></div>
    </div>
    <button class="btn btn-primary btn-block">Payer ${money(t.total)}</button>
    <p class="ship-note">🔒 Paiement sécurisé. Démonstration : aucun paiement réel n'est effectué.</p>
  </form>`);
}

function confirmOrder(form) {
  const data = new FormData(form);
  const ref = "PP-" + Date.now().toString(36).toUpperCase().slice(-6);
  const total = money(totals().total);
  state.cart = []; state.promo = null;
  saveCart(); store.set("promo", null);
  renderCart();
  openModal(`<div class="success">
    <div class="big">🎉</div>
    <h2 class="section-title">Merci ${data.get("first")} !</h2>
    <p>Commande <strong>${ref}</strong> de <strong>${total}</strong> enregistrée (${data.get("pay")}).</p>
    <p>Livraison estimée : <strong>${zone().delay}</strong>. Confirmation envoyée à ${data.get("email")}.</p>
    <button class="btn btn-primary" data-modal-close>Continuer mes achats</button>
  </div>`);
}

function whatsappLink(text) { return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`; }

function whatsappOrder() {
  const t = totals();
  const lines = state.cart.map((l) => `• ${l.qty} × ${byId(l.id).name}${l.bundle ? " (coffret)" : ""}`).join("\n");
  const text = `Bonjour, je souhaite commander :\n${lines}\n\nLivraison : ${zone().name}\nTotal : ${money(t.total)}${state.promo ? `\nCode promo : ${state.promo}` : ""}`;
  window.open(whatsappLink(text), "_blank", "noopener");
}

// ====== Tiroirs ======
function openDrawer(id) {
  closeDrawers();
  const d = $(id);
  d.classList.add("open");
  d.setAttribute("aria-hidden", "false");
  $("#overlay").hidden = false;
}
function closeDrawers() {
  document.querySelectorAll(".drawer").forEach((d) => { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); });
  $("#overlay").hidden = true;
}

// ====== Événements ======
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-add],[data-open],[data-wish],[data-bundle],[data-inc],[data-dec],[data-rm],[data-brm],[data-cat],[data-close],[data-modal-close],[data-plan]");
  if (!el) return;
  const d = el.dataset;
  if (d.add) { addToCart(+d.add); }
  else if (d.open) { openProduct(+d.open); }
  else if (d.wish) {
    const id = +d.wish;
    state.wish = state.wish.includes(id) ? state.wish.filter((w) => w !== id) : [...state.wish, id];
    store.set("wish", state.wish);
    renderGrid(); renderCart();
  }
  else if (d.bundle) {
    const id = +d.bundle;
    if (state.builder.includes(id)) { toast("Déjà dans votre coffret"); return; }
    state.builder.push(id);
    renderBuilder();
    toast(`Ajouté au coffret (${state.builder.length})`);
  }
  else if (d.inc) { state.cart[+d.inc].qty++; saveCart(); renderCart(); }
  else if (d.dec) { const l = state.cart[+d.dec]; l.qty--; if (l.qty < 1) state.cart.splice(+d.dec, 1); saveCart(); renderCart(); }
  else if (d.rm) { state.cart.splice(+d.rm, 1); saveCart(); renderCart(); }
  else if (d.brm) { state.builder.splice(+d.brm, 1); renderBuilder(); }
  else if (d.cat !== undefined) { state.cat = d.cat; renderGrid(); }
  else if ("close" in d) { closeDrawers(); }
  else if ("modalClose" in d) { modal.close(); }
  else if (d.plan) {
    const plan = PLANS[+d.plan];
    window.open(whatsappLink(`Bonjour, je souhaite m'abonner à la Box du Terroir « ${plan.name} » (${money(plan.price)}/mois), livraison : ${zone().name}.`), "_blank", "noopener");
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

$("#search").addEventListener("input", (e) => {
  state.query = e.target.value;
  renderGrid();
});
$("#search").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#boutique").scrollIntoView(); });
$("#region").addEventListener("change", (e) => { state.region = e.target.value; renderGrid(); });
$("#label").addEventListener("change", (e) => { state.label = e.target.value; renderGrid(); });
$("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });
$("#onlyShippable").addEventListener("change", (e) => { state.onlyShippable = e.target.checked; renderGrid(); });

$("#zone").addEventListener("change", (e) => {
  state.zone = e.target.value; store.set("zone", state.zone);
  renderAll();
  toast(`Livraison : ${zone().name}`);
});
$("#currency").addEventListener("change", (e) => {
  state.currency = e.target.value; store.set("currency", state.currency);
  renderAll();
});

$("#promoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const code = $("#promoInput").value.trim().toUpperCase();
  if (PROMO_CODES[code]) { state.promo = code; store.set("promo", code); toast("Code appliqué 🎉"); }
  else toast("Code invalide");
  $("#promoInput").value = "";
  renderCart();
});

$("#builderAdd").addEventListener("click", () => {
  const unshippable = state.builder.map(byId).filter((p) => !canShip(p));
  if (unshippable.length) { toast(`« ${unshippable[0].name} » n'est pas livrable dans votre zone`); return; }
  state.builder.forEach((id) => addToCart(id, 1, true));
  state.builder = [];
  renderBuilder();
  openDrawer("#cart");
});

$("#newsletter").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.reset();
  toast("Merci ! Votre code : BIENVENUE10");
});

function renderPlans() {
  $("#plans").innerHTML = PLANS.map((p, i) => `<div class="plan ${p.featured ? "featured" : ""}">
    <h3>${p.name}</h3><small>${p.items}</small>
    <span class="price">${money(p.price)}</span><small>par mois</small>
    <button class="btn ${p.featured ? "btn-primary" : "btn-ghost"} mini" data-plan="${i}">Je m'abonne</button>
  </div>`).join("");
}

function renderAll() {
  renderShipping();
  renderGrid();
  renderCart();
  renderBuilder();
  renderPlans();
}

// ====== Démarrage ======
const waGreeting = whatsappLink("Bonjour, j'ai une question sur vos produits français.");
$("#waFloat").href = waGreeting;
$("#waFooter").href = waGreeting;
$("#waFooter").target = "_blank";
$("#year").textContent = new Date().getFullYear();
renderSelectors();
renderAll();
