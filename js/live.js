// ====== Live lessons: choose a time, pay, booked; then "My courses" ======
// The learner picks one of Olivier's free times, read live by the payment server from his Google
// Calendar (GET /slots: any hour without an event, 06:00–22:00 Douala time, from 3 h to 2 weeks
// ahead), then pays: the server holds the time during the payment and writes the lesson in a
// separate "Pas à Pas" calendar. A pack or a plan: its first lesson is chosen here, the others
// are booked by the learner in "My courses" on the server, where the video room also opens.
// Olivier's calendar is the only source of his free times: no times are suggested to him.
//
// Without a server (PAY_API empty) nothing is booked. Add ?demo to the address to try the
// whole flow in this browser.

const LIVE_CONFIG = {
  utcOffset: 1,                 // Douala: UTC+1, no daylight saving
  hours: ["06:00", "22:00"],    // Douala time: no lesson starts before 06:00 or ends after 22:00
  step: 30,                     // minutes between two possible start times
  noticeHours: 3,               // earliest start: 3 h ahead
  horizonDays: 14,              // latest start: 2 weeks ahead
  joinEarly: 10,                // the Join button opens 10 minutes before the start
};

const LIVE_MINUTES = { "live-30": 30, "live-60": 60, "live-pack5": 60, "plan-4": 60, "plan-8": 60, "plan-16": 60 };
const PACK_SIZE = { "live-pack5": 5, "plan-4": 4, "plan-8": 8, "plan-16": 16 };
const CREDIT_MONTHS = 2;          // a pack or a plan period lasts 2 months; a plan then renews, its counter back to zero
const addMonths = (ms, n) => { const d = new Date(ms); d.setMonth(d.getMonth() + n); return d.getTime(); };
const isPlan = (id) => !!(byId(id) || {}).plan;

// ---- time helpers -------------------------------------------------------
const H = 3600e3, MIN = 60e3, DAY = 24 * H;
const pad = (n) => String(n).padStart(2, "0");
const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
// Days in the page language ("Fri 16 Oct", "ven. 16 oct."), times in the visitor's usual clock (13:00 or 1:00 PM).
const localDay = (ms) => new Date(ms).toLocaleDateString(t("en-GB", "fr-FR"), { weekday: "short", day: "numeric", month: "short" });
// The browser's own language decides 13:00 or 1:00 PM; an unusual tag (e.g. "en-US@posix") falls back to 24 h.
const TIME_LOCALE = (() => { try { new Date().toLocaleTimeString(navigator.language); return navigator.language; } catch { return "en-GB"; } })();
const localTime = (ms) => new Date(ms).toLocaleTimeString(TIME_LOCALE, { hour: "2-digit", minute: "2-digit" });
function visitorZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return t("your time", "votre heure"); } }
// What the visitor reads: "GMT+1", not a system name such as "Etc/GMT-1"
function zoneLabel() {
  try { return new Intl.DateTimeFormat("en", { timeZoneName: "shortOffset" }).formatToParts(new Date()).find((x) => x.type === "timeZoneName").value; }
  catch { return t("your time zone", "votre fuseau horaire"); }
}
function duration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  return d ? `${d} ${t("d", "j")} ${h} h` : h ? `${h} h ${pad(m)} min` : `${pad(m)}:${pad(sec)}`;
}

// ---- demo bookings (this browser only, ?demo) ---------------------------
const bookings = () => store.get("bookings", []);
const saveBookings = (list) => store.set("bookings", list);

function overlaps(start, minutes) {
  return bookings().some((b) => b.status !== "cancelled" && start < b.start + b.minutes * MIN && b.start < start + minutes * MIN);
}

// Demo: every start time within the lesson hours (Douala), from now + notice to the horizon.
function candidateTimes(minutes) {
  const now = Date.now(), off = LIVE_CONFIG.utcOffset * H, out = [];
  const today = new Date(now + off);
  const [a, b] = LIVE_CONFIG.hours.map(hm);
  for (let i = 0; i <= LIVE_CONFIG.horizonDays; i++) {
    const day = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i);
    for (let t = a; t + minutes <= b; t += LIVE_CONFIG.step) {
      const start = day + t * MIN - off;
      if (start < now + LIVE_CONFIG.noticeHours * H || overlaps(start, minutes)) continue;
      out.push(start);
    }
  }
  return out;
}

// ---- Olivier's free times, from his calendar ------------------------------
let freeSlots = null;                 // start times (ms) free for the chosen length, or null while loading
async function loadFree(minutes) {
  freeSlots = null;
  if (DEMO) {
    // demo: every time of the lesson hours from 3 h ahead, minus a pretend busy pattern
    freeSlots = candidateTimes(minutes).filter((t) => (Math.floor(t / (90 * MIN)) % 3) !== 0);
  } else if (PAY_API) {
    try {
      const r = await fetch(`${PAY_API}/slots?minutes=${minutes}`);
      freeSlots = ((await r.json()).free || []).map(Number).filter((t) => t > Date.now());
    } catch { freeSlots = []; }
  } else freeSlots = [];
}
const bookingOn = () => !!(PAY_API || DEMO);

// ---- choose a time, then pay ----------------------------------------------
const NEEDS = FR && typeof LIVE_NEEDS_FR !== "undefined" ? LIVE_NEEDS_FR : LIVE_NEEDS;
const LEVEL_UNKNOWN = t("I don't know yet", "Je ne sais pas encore");
const booking = { product: "live-60", need: NEEDS[0], level: LEVEL_UNKNOWN, day: null, credit: null, slot: null, stage: "time" };

function openBooking(product, credit = null, start = null) {
  if (!bookingOn()) {
    return openModal(`<div class="checkout"><h2>${t("Booking is coming soon", "La réservation ouvre bientôt")}</h2><p>${t("You'll be able to book live lessons here very soon.", "Vous pourrez réserver vos cours en direct ici très bientôt.")}</p>${SHOP.email ? `<p>${t("Questions? Write to", "Une question ? Écrivez à")} <a href="mailto:${SHOP.email}">${SHOP.email}</a>.</p>` : ""}<button class="btn btn-ghost" data-modal-close>${t("Close", "Fermer")}</button></div>`);
  }
  Object.assign(booking, { product: product || booking.product, day: null, credit, slot: null, stage: "time" });
  openModal(`<form class="checkout book" id="bookForm" novalidate></form>`);
  loadFree(LIVE_MINUTES[booking.product]).then(() => {
    // a time already chosen in "My courses" (?book=…&start=…): selected, if it is still free
    if (start && (freeSlots || []).includes(start)) { booking.slot = start; booking.day = localDay(start); }
    if (modal.open && $("#bookForm")) renderBooking();
  });
  renderBooking();
}

// In two steps: 1. the time (and the length of the lesson), 2. the formula and the payment.
// The price comes once the learner has a time of their own (or the demo pack credit).
function renderBooking() {
  if ($("#bkName")) { booking.name = $("#bkName").value; booking.email = $("#bkEmail").value; }
  const minutes = LIVE_MINUTES[booking.product], p = byId(booking.product);
  const all = freeSlots || [];
  const days = [...new Set(all.map(localDay))];
  if (!days.includes(booking.day)) booking.day = days[0] || null;
  if (booking.slot && !all.includes(booking.slot)) { booking.slot = null; booking.stage = "time"; }
  const details = `<div class="form-grid" id="bkDetails">
      <label for="bkName">${t("Your name", "Votre nom")}<input id="bkName" name="name" required autocomplete="name" value="${esc(booking.name || "")}"></label>
      <label for="bkEmail">${t("Email", "E-mail")}<input id="bkEmail" name="email" type="email" required autocomplete="email" value="${esc(booking.email || "")}"></label>
    </div>`;
  const when = booking.slot ? `<strong>${localDay(booking.slot)}, ${localTime(booking.slot)}–${localTime(booking.slot + minutes * MIN)}</strong> ${t("your time", "à votre heure")}` : "";

  if (booking.stage === "pay" && booking.slot && !booking.credit) {
    // step 2: how to pay for it, with the price
    const offers = LIVE.filter((x) => LIVE_MINUTES[x.id] === minutes);
    const every = t(" every 2 months", " tous les 2 mois");
    $("#bookForm").innerHTML = `
    <p class="eyebrow">${t("Step 2 of 2 · payment", "Étape 2 sur 2 · paiement")}${DEMO ? " · demo" : ""}</p>
    <h2>${t("Choose how to pay", "Choisissez votre formule")}</h2>
    <p class="note ok" role="status">${t(`Your ${minutes}-minute lesson`, `Votre cours de ${minutes} minutes`)} : ${when}. <button type="button" class="link-btn" data-back-time>${t("Change the time", "Changer l'heure")}</button></p>
    <p class="note">${t("Your lesson is booked as soon as the payment goes through.", "Votre cours est réservé dès que le paiement est passé.")}</p>
    <div class="pay-methods book-len" role="radiogroup" aria-label="${t("Payment option", "Formule")}">
      ${offers.map((x) => `<label class="pm"><input type="radio" name="product" value="${x.id}" ${x.id === booking.product ? "checked" : ""}> <span class="pm-t">${L(x, "name")}<b>${price(x)}${x.plan ? every : ""}</b>${PACK_SIZE[x.id] ? `<small>${t(`this lesson plus ${PACK_SIZE[x.id] - 1} more to book within 2 months`, `ce cours et ${PACK_SIZE[x.id] - 1} autres à réserver sous 2 mois`)}</small>` : ""}</span></label>`).join("")}
    </div>
    ${details}
    <p class="form-error" id="bkError" hidden></p>
    ${PACK_SIZE[booking.product] ? `<p class="note">${t(`You book the other ${PACK_SIZE[booking.product] - 1} lessons yourself in “My courses”, whenever you like over the next 2 months.${p.plan ? " Next step: choose how the plan renews, automatically or by link. Nothing is taken without your approval." : ""}`,
      `Vous réservez vous-même les ${PACK_SIZE[booking.product] - 1} autres cours dans « Mes cours », quand vous voulez pendant 2 mois.${p.plan ? " Étape suivante : choisir comment la formule se renouvelle, automatiquement ou par lien. Rien n'est prélevé sans votre accord." : ""}`)}</p>` : ""}
    <button class="btn btn-primary btn-block">${t("Continue to payment", "Continuer vers le paiement")} · ${price(p)}${p.plan ? every : ""}</button>`;
    return;
  }

  // step 1: the time
  const times = all.filter((t) => localDay(t) === booking.day);
  const fixed = booking.credit || isPlan(booking.product);         // a plan: chosen on its card, 60 minutes
  // the formula and its price from the start: 30 min, 60 min or the 5-lesson bundle
  const offers = LIVE.filter((x) => !x.plan);
  $("#bookForm").innerHTML = `
    <p class="eyebrow">${booking.credit ? t("Book with your lesson pack", "Réserver avec votre forfait") : t("Step 1 of 2 · choose a time", "Étape 1 sur 2 · choisissez l'heure")}${DEMO ? " · demo" : ""}</p>
    <h2>${PACK_SIZE[booking.product] && !booking.credit ? t("Pick a time for your first lesson", "Choisissez l'heure de votre premier cours") : t("Pick a time that works for you", "Choisissez l'heure qui vous convient")}</h2>
    <p>${t(`Here are Olivier's open times, updated live and shown in <strong>your local time (${zoneLabel()})</strong>. Pick one${booking.credit ? " and confirm it" : " and pay on the next step"}. Your lesson is booked instantly, so there's no waiting for a reply.`,
      `Voici les heures libres d'Olivier, à jour en direct et affichées <strong>à votre heure locale (${zoneLabel()})</strong>. Choisissez-en une${booking.credit ? " et confirmez" : ", puis payez à l'étape suivante"}. Le cours est réservé aussitôt : pas besoin d'attendre une réponse.`)}</p>
    ${booking.credit ? `<p class="note">${t(`Lesson ${booking.credit.used + 1} of ${booking.credit.total} in your pack. No payment needed.`, `Cours ${booking.credit.used + 1} sur ${booking.credit.total} de votre forfait. Rien à payer.`)}</p>` : fixed ? `<p class="note">${L(p, "name")} : ${t(`${minutes}-minute lessons`, `cours de ${minutes} minutes`)} · <b>${price(p)}</b> ${t("every 2 months", "tous les 2 mois")}.</p>` : `
    <div class="pay-methods book-len" role="radiogroup" aria-label="${t("Lesson", "Formule")}">
      ${offers.map((x) => `<label class="pm"><input type="radio" name="product" value="${x.id}" ${x.id === booking.product ? "checked" : ""}> <span class="pm-t">${L(x, "name")}<b>${price(x)}</b>${PACK_SIZE[x.id] ? `<small>${t(`book the other ${PACK_SIZE[x.id] - 1} yourself within 2 months`, `les ${PACK_SIZE[x.id] - 1} autres à réserver vous-même sous 2 mois`)}</small>` : ""}</span></label>`).join("")}
    </div>`}
    <div class="form-grid">
      <label for="bkNeed">${t("What would you like to work on?", "Que voulez-vous travailler ?")}<select id="bkNeed" name="need">${NEEDS.map((x) => `<option ${x === booking.need ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label for="bkLevel">${t("Your level", "Votre niveau")}<select id="bkLevel" name="level"><option>${LEVEL_UNKNOWN}</option>${LEVELS.map((l) => `<option ${l.code === booking.level ? "selected" : ""}>${l.code}</option>`).join("")}</select></label>
    </div>
    ${freeSlots === null ? `<p class="note" role="status">${t("Loading Olivier's available times…", "Chargement des heures libres d'Olivier…")}</p>` : !all.length ? `<p class="note" role="status">${t(`There are no ${minutes}-minute times available in the next ${LIVE_CONFIG.horizonDays} days.`, `Aucune heure libre pour un cours de ${minutes} minutes dans les ${LIVE_CONFIG.horizonDays} prochains jours.`)}</p>` : `
    <p class="eyebrow pm-title">${t(`Available times · ${minutes}-minute lesson`, `Heures libres · cours de ${minutes} minutes`)}</p>
    <div class="chips-row" role="group" aria-label="${t("Day", "Jour")}">${days.map((d) => `<button type="button" class="slot ${d === booking.day ? "on" : ""}" data-day="${d}">${d}</button>`).join("")}</div>
    <div class="chips-row" id="bkTimes" role="group" aria-label="${t("Start times", "Heures de début")}">${times.map((t) => `<button type="button" class="slot ${t === booking.slot ? "on" : ""}" aria-pressed="${t === booking.slot}" data-pick="${t}">${localTime(t)}</button>`).join("")}</div>
    ${booking.slot ? `<p class="note ok" role="status">${t("Your lesson:", "Votre cours :")} ${when}.</p>` : ""}`}
    ${booking.credit ? details : ""}
    <p class="form-error" id="bkError" hidden></p>
    <button class="btn btn-primary btn-block" ${booking.slot ? "" : "disabled"}>${booking.credit ? t("Confirm this time", "Confirmer cette heure") : `${t("Next: payment", "Suivant : le paiement")} · ${price(p)}${isPlan(p.id) ? t(" every 2 months", " tous les 2 mois") : ""}`}</button>
    <p class="note">${t("These are all of Olivier's open times. New ones appear as his calendar changes.", "Ce sont toutes les heures libres d'Olivier. D'autres apparaissent quand son agenda change.")}</p>`;
}

function submitBooking(form) {
  const d = new FormData(form);
  booking.name = String(d.get("name") || "").trim();
  booking.email = String(d.get("email") || "").trim();
  const err = $("#bkError");
  if (!booking.slot) { err.textContent = t("Please choose a time.", "Choisissez une heure."); err.hidden = false; return; }
  if (!booking.credit && booking.stage !== "pay") { booking.stage = "pay"; renderBooking(); return bringIntoView($("#bookForm")); }
  if (!booking.name || !form.bkEmail.checkValidity() || !booking.email) { err.textContent = t("Please enter your name and a valid email address.", "Entrez votre nom et une adresse e-mail valide."); err.hidden = false; return; }
  const draft = { product: booking.product, need: booking.need, level: booking.level, start: booking.slot,
    minutes: LIVE_MINUTES[booking.product], name: booking.name, email: booking.email, zone: visitorZone(), instant: true };
  if (booking.credit) return useCredit(booking.credit.id, draft);
  openBuy(booking.product, draft);                    // payment; the server holds the time while it is paid
}

// Demo only: the lesson is kept in this browser.
function confirmBooking(draft, status) {
  const b = { ...draft, id: "PAP-" + Date.now().toString(36).toUpperCase(), status, room: null };
  const pack = PACK_SIZE[draft.product];
  if (pack) b.credit = { total: pack, used: 1, expires: addMonths(Date.now(), CREDIT_MONTHS),
    plan: isPlan(draft.product), renews: isPlan(draft.product) };
  saveBookings([...bookings(), b]);
  renderMySessions();
  return b;
}

function useCredit(packId, draft) {
  const list = bookings();
  const pack = list.find((x) => x.id === packId);
  if (!pack || pack.credit.used >= pack.credit.total || (pack.credit.expires && pack.credit.expires < Date.now())) return;
  pack.credit.used++;
  list.push({ ...draft, id: `${packId}-${pack.credit.used}`, status: pack.status, fromPack: packId, room: null });
  saveBookings(list);
  bookedScreen(list[list.length - 1]);
  renderMySessions();
}

// Right after a single lesson: the moment to offer the plans (the learner has just committed).
function planOffer(b) {
  if (b.fromPack || PACK_SIZE[b.product]) return "";
  const one = byId("live-60"), plan = LIVE.find((x) => x.best) || LIVE.find((x) => x.plan);
  if (!one || !plan) return "";
  const per = amount(plan.usd / plan.lessons, plan.xaf / plan.lessons);
  return FR ? `<div class="plan-offer"><p class="eyebrow">Gardez le rythme</p>
    <h3>${plan.lessons} cours tous les 2 mois, ${per} le cours au lieu de ${price(one)}</h3>
    <p>Retrouver un professeur chaque semaine aide à retenir ce qu'on apprend. Avec la ${esc(L(plan, "name").split(" · ")[0])}, vous réservez chaque cours quand cela vous arrange, sur 2 mois. Tous les 2 mois, elle se renouvelle selon le mode choisi, automatiquement ou par lien ; sans votre accord, elle s'arrête.</p>
    <div class="hero-cta tight"><button class="btn btn-primary" data-modal-close data-goto-plans>Voir les formules</button><button class="btn btn-ghost" data-modal-close>Pas maintenant</button></div></div>`
    : `<div class="plan-offer"><p class="eyebrow">Keep up the momentum</p>
    <h3>${plan.lessons} lessons every 2 months, ${per} each instead of ${price(one)}</h3>
    <p>Meeting a teacher every week helps you remember what you learn. With the ${esc(plan.name.split(" · ")[0])}, you book each lesson whenever it suits you over 2 months. Every 2 months, it renews the way you chose, automatically or by link, and it stops without your approval.</p>
    <div class="hero-cta tight"><button class="btn btn-primary" data-modal-close data-goto-plans>See the plans</button><button class="btn btn-ghost" data-modal-close>Not now</button></div></div>`;
}

function bookedScreen(b) {
  openModal(`<div class="checkout">
    <p class="eyebrow">${b.status === "demo" ? t("Demo booking · nothing was charged", "Réservation de démonstration · rien n'a été payé") : t("Booked", "Réservé")}</p>
    <h2>${t("Your live lesson is booked", "Votre cours en direct est réservé")}</h2>
    <p><strong>${localDay(b.start)}, ${localTime(b.start)}</strong> ${t("your time", "à votre heure")} (${b.zone}) · ${b.minutes} minutes.</p>
    <p>${t(`Come back to this page when it's time. The <strong>Join</strong> button in “My live lessons” becomes active ${LIVE_CONFIG.joinEarly} minutes before the start.`,
      `Revenez sur cette page à l'heure du cours : le bouton <strong>Rejoindre</strong> de « Mes cours en direct » s'active ${LIVE_CONFIG.joinEarly} minutes avant le début.`)}</p>
    ${b.credit ? `<p class="note">${t(`${b.credit.plan ? "Your plan" : "Your lesson pack"}: ${b.credit.total - 1} more lesson${b.credit.total - 1 === 1 ? "" : "s"} to book from “My live lessons” whenever you like until ${localDay(b.credit.expires)}.`,
      `${b.credit.plan ? "Votre formule" : "Votre forfait"} : encore ${b.credit.total - 1} cours à réserver dans « Mes cours en direct », quand vous voulez jusqu'au ${localDay(b.credit.expires)}.`)}</p>` : ""}
    ${planOffer(b) || `<button class="btn btn-primary" data-modal-close>${t("Done", "Terminé")}</button>`}
  </div>`);
}

// Back from the payment (app.js checkReturn): what the server booked. The lesson, the next
// bookings and the video room are in "My courses" on the server.
function paidBooking(d) {
  const b = d.booking, url = d.account_url ? esc(d.account_url) : `${PAY_API}/account?lang=${LANG}`;
  const open = `<a class="btn btn-primary" href="${url}">${t("Open My courses", "Ouvrir Mes cours")}</a>`;
  if (b.renewed) return openModal(`<div class="checkout"><h2>${t("Your plan is renewed", "Votre formule est renouvelée")}</h2>
    <p>${t(`Thank you! Your new lessons are ready to book in “My courses”. We've also sent the details to ${esc(d.email)}.`, `Merci ! Vos nouveaux cours sont à réserver dans « Mes cours ». Le détail vous a aussi été envoyé à ${esc(d.email)}.`)}</p>${open}</div>`);
  if (!b.booked) return openModal(`<div class="checkout"><h2>${t("Choose a new time", "Choisissez une autre heure")}</h2>
    <p>${t(`Your payment went through, but the time you chose was taken while you were paying. Pick another one in “My courses”. If none suits you, reply to the email we've sent to ${esc(d.email)} and you'll be refunded.`,
      `Votre paiement est passé, mais l'heure choisie a été prise pendant le paiement. Choisissez-en une autre dans « Mes cours ». Si aucune ne vous convient, répondez à l'e-mail envoyé à ${esc(d.email)} : vous serez remboursé.`)}</p>${open}</div>`);
  const more = b.lessons - 1;
  openModal(`<div class="checkout"><p class="eyebrow">${t("Booked", "Réservé")}</p><h2>${t("Your live lesson is booked", "Votre cours en direct est réservé")}</h2>
    <p><strong>${localDay(b.start)}, ${localTime(b.start)}</strong> ${t("your time", "à votre heure")} · ${b.minutes} minutes.</p>
    <p>${t(`When it's time, open “My courses” and press <strong>Join</strong>: the room opens ${LIVE_CONFIG.joinEarly} minutes before the start. We've emailed the details to ${esc(d.email)}.`,
      `À l'heure du cours, ouvrez « Mes cours » et cliquez sur <strong>Rejoindre</strong> : la salle ouvre ${LIVE_CONFIG.joinEarly} minutes avant le début. Le détail vous a été envoyé à ${esc(d.email)}.`)}</p>
    ${more > 0 ? `<p class="note">${t(`Book your other ${more} lesson${more === 1 ? "" : "s"} yourself in “My courses”, whenever you like until ${localDay(b.until)}.`, `Réservez vous-même vos ${more} autres cours dans « Mes cours », quand vous voulez jusqu'au ${localDay(b.until)}.`)}</p>` : ""}
    ${open} ${planOffer({ product: d.booking.product }) ? `<button class="btn btn-ghost" data-modal-close data-goto-plans>${t("See the plans", "Voir les formules")}</button>` : ""}</div>`);
}

// ---- my sessions: countdown and Join ------------------------------------
function sessionState(b, now = Date.now()) {
  const end = b.start + b.minutes * MIN;
  if (now >= end) return "ended";
  if (now >= b.start - LIVE_CONFIG.joinEarly * MIN) return "open";
  return "waiting";
}

// Demo: stopping the renewal; the lessons of the current 2 months stay usable until its end.
function cancelPlan(id) {
  const list = bookings(), b = list.find((x) => x.id === id);
  if (!b || !confirm(t(`Stop your plan's renewal? You'll keep your remaining lessons until ${localDay(b.credit.expires)}.`, `Arrêter le renouvellement ? Vous gardez vos cours restants jusqu'au ${localDay(b.credit.expires)}.`))) return;
  b.credit.renews = false; saveBookings(list); renderMySessions();
}

function renderMySessions() {
  const box = $("#mySessions");
  if (!box) return;
  const list = bookings().filter((b) => b.start + b.minutes * MIN > Date.now() - DAY).sort((a, b) => a.start - b.start);
  const packs = bookings().filter((b) => b.credit && (b.credit.plan ? b.credit.renews || b.credit.expires > Date.now()
    : b.credit.used < b.credit.total && (!b.credit.expires || b.credit.expires > Date.now())));
  box.hidden = !DEMO || (!list.length && !packs.length);
  if (box.hidden) return;
  box.innerHTML = `<h3>${t("My live lessons", "Mes cours en direct")} · demo</h3>
    ${list.map((b) => `<div class="session" data-session="${b.id}">
      <div><strong>${localDay(b.start)} · ${localTime(b.start)}</strong><small>${b.minutes} min · ${b.need}</small></div>
      <span class="countdown" data-countdown="${b.id}"></span>
      <button class="btn btn-primary mini" data-join="${b.id}">${t("Join", "Rejoindre")}</button>
    </div>`).join("")}
    ${packs.map((b) => { const c = b.credit, left = c.total - c.used, until = c.expires ? localDay(c.expires) : "";
      return `<div class="session pack"><div><strong>${c.plan ? esc(L(byId(b.product), "name").split(" · ")[0]) : t("Your lesson pack", "Votre forfait")}</strong>
      <small>${t(`${left} lesson${left === 1 ? "" : "s"} left${until ? ` until ${until}` : ""}`, `${left} cours restant${left > 1 ? "s" : ""}${until ? ` jusqu'au ${until}` : ""}`)}${c.plan ? (c.renews ? t(` · renews on ${until}`, ` · renouvellement le ${until}`) : t(" · renewal stopped", " · renouvellement arrêté")) : ""}</small></div>
      ${left > 0 ? `<button class="btn btn-ghost mini" data-book-credit="${b.id}">${t("Book your next lesson", "Réserver le cours suivant")}</button>` : ""}
      ${c.plan && c.renews ? `<button class="link-btn" data-cancel-plan="${b.id}">${t("Stop the renewal", "Arrêter le renouvellement")}</button>` : ""}</div>`; }).join("")}`;
  tick();
}

function tick() {
  const now = Date.now();
  for (const b of bookings()) {
    const c = document.querySelector(`[data-countdown="${b.id}"]`);
    if (c) {
      const st = sessionState(b, now);
      c.textContent = st === "ended" ? t("Ended", "Terminé") : now < b.start ? t(`Starts in ${duration(b.start - now)}`, `Commence dans ${duration(b.start - now)}`) : t(`In progress · ${duration(b.start + b.minutes * MIN - now)} left`, `En cours · encore ${duration(b.start + b.minutes * MIN - now)}`);
      const j = document.querySelector(`[data-join="${b.id}"]`);
      if (j) j.disabled = st !== "open";
    }
  }
  roomTick(now);
}

// ---- the video room (demo; real lessons: "My courses" on the server) ------
let room = null;

function openRoom(id) {
  const b = bookings().find((x) => x.id === id);
  if (!b || sessionState(b) !== "open") return;
  room = { b, stream: null, api: null };
  openModal(`<div class="room">
    <div class="room-top">
      <div><p class="eyebrow">${t("Live lesson with Olivier", "Cours en direct avec Olivier")}</p><strong>${b.need}</strong></div>
      <div class="room-timer" id="roomTimer"></div>
      <button class="btn btn-ghost mini" data-leave>${t("Leave", "Quitter")}</button>
    </div>
    <div class="room-bar"><span id="roomBar"></span></div>
    <div class="room-video" id="roomVideo"></div>
  </div>`);
  modal.classList.add("modal-room");
  startVideo(b);
  roomTick(Date.now());
}

async function startVideo(b) {
  const box = $("#roomVideo");
  // Demo: no call, only the camera and microphone check. Real lessons open in "My courses".
  box.innerHTML = `<video id="selfView" autoplay muted playsinline></video>
    <p class="room-msg">${t("Demo: in a real lesson, your call with Olivier connects here. Use the preview to check that your camera and microphone are working.", "Démo : pendant un vrai cours, l'appel avec Olivier s'ouvre ici. Vérifiez dans l'aperçu que votre caméra et votre micro fonctionnent.")}</p>`;
  try {
    room.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    $("#selfView").srcObject = room.stream;
  } catch {
    box.querySelector(".room-msg").textContent = t("Please allow camera and microphone access in your browser, then reload the page.", "Autorisez la caméra et le micro dans votre navigateur, puis rechargez la page.");
  }
}

function roomTick(now) {
  if (!room || !$("#roomTimer")) return;
  const { b } = room, end = b.start + b.minutes * MIN;
  const tm = $("#roomTimer"), bar = $("#roomBar");
  if (now < b.start) { tm.textContent = t(`Starts in ${duration(b.start - now)}`, `Commence dans ${duration(b.start - now)}`); bar.style.width = "0%"; tm.className = "room-timer"; return; }
  if (now >= end) { tm.textContent = t("Time's up", "C'est l'heure"); bar.style.width = "100%"; tm.className = "room-timer over"; return; }
  tm.textContent = t(`${duration(end - now)} left`, `encore ${duration(end - now)}`);
  bar.style.width = `${((now - b.start) / (b.minutes * MIN)) * 100}%`;
  tm.className = end - now <= 5 * MIN ? "room-timer warn" : "room-timer";
}

function leaveRoom() {
  if (room) {
    if (room.stream) room.stream.getTracks().forEach((x) => x.stop());
    if (room.api) room.api.dispose();
  }
  room = null;
  modal.classList.remove("modal-room");
  if (modal.open) modal.close();
}

// ---- events ---------------------------------------------------------------
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-book],[data-day],[data-pick],[data-join],[data-leave],[data-book-credit],[data-cancel-plan],[data-goto-plans],[data-back-time]");
  if (!el) return;
  const d = el.dataset;
  if ("book" in d) openBooking(d.book || null);
  else if (d.day) { booking.day = d.day; renderBooking(); bringIntoView($("#bkTimes")); }
  else if (d.pick) {
    booking.slot = Number(d.pick); renderBooking();
    const next = $("#bkDetails") || $("#bookForm button.btn-primary");
    bringIntoView(next, $("#bkDetails") ? [$("#bkName"), $("#bkEmail")].find((x) => !x.value) || null : null);
  }
  else if ("backTime" in d) { booking.stage = "time"; renderBooking(); }
  else if (d.join) openRoom(d.join);
  else if ("leave" in d) leaveRoom();
  else if (d.bookCredit) {
    const pack = bookings().find((x) => x.id === d.bookCredit);
    if (pack) openBooking(pack.product, { id: pack.id, used: pack.credit.used, total: pack.credit.total });
  }
  else if (d.cancelPlan) cancelPlan(d.cancelPlan);
  else if ("gotoPlans" in d) { const g = $("#livePlans"); if (g) g.scrollIntoView({ behavior: "smooth" }); }
});
// a live card opens with the keyboard too (Enter or Space)
document.addEventListener("keydown", (e) => {
  const c = e.target.closest && e.target.closest(".live-card[data-book]");
  if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openBooking(c.dataset.book); }
});
modal.addEventListener("change", (e) => {
  if (!$("#bookForm") || !e.target.closest("#bookForm")) return;
  if (e.target.name === "product" || e.target.name === "minutes") {
    const before = LIVE_MINUTES[booking.product];
    booking.product = e.target.name === "minutes" ? (e.target.value === "30" ? "live-30" : "live-60") : e.target.value;
    // another length means other free times; the same length keeps the chosen time
    if (LIVE_MINUTES[booking.product] !== before) {
      booking.slot = null; booking.stage = "time"; freeSlots = null;
      loadFree(LIVE_MINUTES[booking.product]).then(() => renderBooking());
    }
    renderBooking();
  }
  else if (e.target.name === "need") booking.need = e.target.value;
  else if (e.target.name === "level") booking.level = e.target.value;
});
modal.addEventListener("submit", (e) => {
  if (e.target.id !== "bookForm") return;
  e.preventDefault();
  submitBooking(e.target);
});
modal.addEventListener("close", () => { if (room) leaveRoom(); });

renderMySessions();
setInterval(tick, 1000);
checkReturn();
// From "My courses" on the server: ?book=live-60&start=<ms> opens the booking with that time.
{
  const q = new URLSearchParams(location.search), id = q.get("book");
  if (id && byId(id) && byId(id).kind === "live") {
    history.replaceState(null, "", location.pathname + location.hash);
    openBooking(id, null, Number(q.get("start")) || null);
  }
}
