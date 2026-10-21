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
// The site is in English: days in English ("Fri 16 Oct"), times in the visitor's usual clock (13:00 or 1:00 PM).
const localDay = (ms) => new Date(ms).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
// The browser's own language decides 13:00 or 1:00 PM; an unusual tag (e.g. "en-US@posix") falls back to 24 h.
const TIME_LOCALE = (() => { try { new Date().toLocaleTimeString(navigator.language); return navigator.language; } catch { return "en-GB"; } })();
const localTime = (ms) => new Date(ms).toLocaleTimeString(TIME_LOCALE, { hour: "2-digit", minute: "2-digit" });
function visitorZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "your time"; } }
// What the visitor reads: "GMT+1", not a system name such as "Etc/GMT-1"
function zoneLabel() {
  try { return new Intl.DateTimeFormat("en", { timeZoneName: "shortOffset" }).formatToParts(new Date()).find((x) => x.type === "timeZoneName").value; }
  catch { return "your time zone"; }
}
function duration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  return d ? `${d} d ${h} h` : h ? `${h} h ${pad(m)} min` : `${pad(m)}:${pad(sec)}`;
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
const booking = { product: "live-60", need: LIVE_NEEDS[0], level: "I don't know yet", day: null, credit: null, slot: null, stage: "time" };

function openBooking(product, credit = null) {
  if (!bookingOn()) {
    return openModal(`<div class="checkout"><h2>Booking is coming soon</h2><p>You'll be able to book live lessons here very soon.</p>${SHOP.email ? `<p>Questions? Write to <a href="mailto:${SHOP.email}">${SHOP.email}</a>.</p>` : ""}<button class="btn btn-ghost" data-modal-close>Close</button></div>`);
  }
  Object.assign(booking, { product: product || booking.product, day: null, credit, slot: null, stage: "time" });
  openModal(`<form class="checkout book" id="bookForm" novalidate></form>`);
  loadFree(LIVE_MINUTES[booking.product]).then(() => { if (modal.open && $("#bookForm")) renderBooking(); });
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
      <label for="bkName">Your name<input id="bkName" name="name" required autocomplete="name" value="${esc(booking.name || "")}"></label>
      <label for="bkEmail">Email<input id="bkEmail" name="email" type="email" required autocomplete="email" value="${esc(booking.email || "")}"></label>
    </div>`;
  const when = booking.slot ? `<strong>${localDay(booking.slot)}, ${localTime(booking.slot)}–${localTime(booking.slot + minutes * MIN)}</strong> your time` : "";

  if (booking.stage === "pay" && booking.slot && !booking.credit) {
    // step 2: how to pay for it, with the price
    const offers = LIVE.filter((x) => LIVE_MINUTES[x.id] === minutes);
    $("#bookForm").innerHTML = `
    <p class="eyebrow">Step 2 of 2 · payment${DEMO ? " · demo" : ""}</p>
    <h2>Choose how to pay</h2>
    <p class="note ok" role="status">Your ${minutes}-minute lesson: ${when}. <button type="button" class="link-btn" data-back-time>Change the time</button></p>
    <p class="note">Your lesson is booked as soon as the payment goes through.</p>
    <div class="pay-methods book-len" role="radiogroup" aria-label="Payment option">
      ${offers.map((x) => `<label class="pm"><input type="radio" name="product" value="${x.id}" ${x.id === booking.product ? "checked" : ""}> <span class="pm-t">${x.name}<b>${price(x)}${x.plan ? " every 2 months" : ""}</b>${PACK_SIZE[x.id] ? `<small>this lesson plus ${PACK_SIZE[x.id] - 1} more to book within 2 months</small>` : ""}</span></label>`).join("")}
    </div>
    ${details}
    <p class="form-error" id="bkError" hidden></p>
    ${PACK_SIZE[booking.product] ? `<p class="note">You book the other ${PACK_SIZE[booking.product] - 1} lessons yourself in “My courses”, whenever you like over the next 2 months.${p.plan ? " 7 days before the end, we email you a link to renew the plan for 2 more months. If you don't renew, it simply stops." : ""}</p>` : ""}
    <button class="btn btn-primary btn-block">Continue to payment · ${price(p)}${p.plan ? " every 2 months" : ""}</button>`;
    return;
  }

  // step 1: the time
  const times = all.filter((t) => localDay(t) === booking.day);
  const fixed = booking.credit || PACK_SIZE[booking.product];      // a pack or a plan: 60 minutes
  $("#bookForm").innerHTML = `
    <p class="eyebrow">${booking.credit ? "Book with your lesson pack" : "Step 1 of 2 · choose a time"}${DEMO ? " · demo" : ""}</p>
    <h2>${PACK_SIZE[booking.product] && !booking.credit ? "Pick a time for your first lesson" : "Pick a time that works for you"}</h2>
    <p>Here are Olivier's open times, updated live and shown in <strong>your local time (${zoneLabel()})</strong>. Pick one${booking.credit ? " and confirm it" : " and pay on the next step"}. Your lesson is booked instantly, so there's no waiting for a reply.</p>
    ${booking.credit ? `<p class="note">Lesson ${booking.credit.used + 1} of ${booking.credit.total} in your pack. No payment needed.</p>` : fixed ? `<p class="note">${p.name}: ${minutes}-minute lessons.</p>` : `
    <div class="pay-methods book-len" role="radiogroup" aria-label="Lesson length">
      ${[30, 60].map((m) => `<label class="pm"><input type="radio" name="minutes" value="${m}" ${m === minutes ? "checked" : ""}> ${m} minutes</label>`).join("")}
    </div>`}
    <div class="form-grid">
      <label for="bkNeed">What would you like to work on?<select id="bkNeed" name="need">${LIVE_NEEDS.map((x) => `<option ${x === booking.need ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label for="bkLevel">Your level<select id="bkLevel" name="level"><option>I don't know yet</option>${LEVELS.map((l) => `<option ${l.code === booking.level ? "selected" : ""}>${l.code}</option>`).join("")}</select></label>
    </div>
    ${freeSlots === null ? `<p class="note" role="status">Loading Olivier's available times…</p>` : !all.length ? `<p class="note" role="status">There are no ${minutes}-minute times available in the next ${LIVE_CONFIG.horizonDays} days.</p>` : `
    <p class="eyebrow pm-title">Available times · ${minutes}-minute lesson</p>
    <div class="chips-row" role="group" aria-label="Day">${days.map((d) => `<button type="button" class="slot ${d === booking.day ? "on" : ""}" data-day="${d}">${d}</button>`).join("")}</div>
    <div class="chips-row" id="bkTimes" role="group" aria-label="Start times">${times.map((t) => `<button type="button" class="slot ${t === booking.slot ? "on" : ""}" aria-pressed="${t === booking.slot}" data-pick="${t}">${localTime(t)}</button>`).join("")}</div>
    ${booking.slot ? `<p class="note ok" role="status">Your lesson: ${when}.</p>` : ""}`}
    ${booking.credit ? details : ""}
    <p class="form-error" id="bkError" hidden></p>
    <button class="btn btn-primary btn-block" ${booking.slot ? "" : "disabled"}>${booking.credit ? "Confirm this time" : "Next: choose how to pay"}</button>
    <p class="note">These are all of Olivier's open times. New ones appear as his calendar changes.</p>`;
}

function submitBooking(form) {
  const d = new FormData(form);
  booking.name = String(d.get("name") || "").trim();
  booking.email = String(d.get("email") || "").trim();
  const err = $("#bkError");
  if (!booking.slot) { err.textContent = "Please choose a time."; err.hidden = false; return; }
  if (!booking.credit && booking.stage !== "pay") { booking.stage = "pay"; renderBooking(); return bringIntoView($("#bookForm")); }
  if (!booking.name || !form.bkEmail.checkValidity() || !booking.email) { err.textContent = "Please enter your name and a valid email address."; err.hidden = false; return; }
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
  return `<div class="plan-offer"><p class="eyebrow">Keep up the momentum</p>
    <h3>${plan.lessons} lessons every 2 months, ${per} each instead of ${price(one)}</h3>
    <p>Meeting a teacher every week helps you remember what you learn. With the ${esc(plan.name.split(" · ")[0])}, you book each lesson whenever it suits you over 2 months. Every 2 months, we email you a link to renew it, and it stops whenever you don't.</p>
    <div class="hero-cta tight"><button class="btn btn-primary" data-modal-close data-goto-plans>See the plans</button><button class="btn btn-ghost" data-modal-close>Not now</button></div></div>`;
}

function bookedScreen(b) {
  openModal(`<div class="checkout">
    <p class="eyebrow">${b.status === "demo" ? "Demo booking · nothing was charged" : "Booked"}</p>
    <h2>Your live lesson is booked</h2>
    <p><strong>${localDay(b.start)}, ${localTime(b.start)}</strong> your time (${b.zone}) · ${b.minutes} minutes.</p>
    <p>Come back to this page when it's time. The <strong>Join</strong> button in “My live lessons” becomes active ${LIVE_CONFIG.joinEarly} minutes before the start.</p>
    ${b.credit ? `<p class="note">${b.credit.plan ? "Your plan" : "Your lesson pack"}: ${b.credit.total - 1} more lesson${b.credit.total - 1 === 1 ? "" : "s"} to book from “My live lessons” whenever you like until ${localDay(b.credit.expires)}.</p>` : ""}
    ${planOffer(b) || `<button class="btn btn-primary" data-modal-close>Done</button>`}
  </div>`);
}

// Back from the payment (app.js checkReturn): what the server booked. The lesson, the next
// bookings and the video room are in "My courses" on the server.
function paidBooking(d) {
  const b = d.booking, url = d.account_url ? esc(d.account_url) : `${PAY_API}/account`;
  const open = `<a class="btn btn-primary" href="${url}">Open My courses</a>`;
  if (b.renewed) return openModal(`<div class="checkout"><h2>Your plan is renewed</h2>
    <p>Thank you! Your new lessons are ready to book in “My courses”. We've also sent the details to ${esc(d.email)}.</p>${open}</div>`);
  if (!b.booked) return openModal(`<div class="checkout"><h2>Choose a new time</h2>
    <p>Your payment went through, but the time you chose was taken while you were paying. Pick another one in “My courses”. If none suits you, reply to the email we've sent to ${esc(d.email)} and you'll be refunded.</p>${open}</div>`);
  const more = b.lessons - 1;
  openModal(`<div class="checkout"><p class="eyebrow">Booked</p><h2>Your live lesson is booked</h2>
    <p><strong>${localDay(b.start)}, ${localTime(b.start)}</strong> your time · ${b.minutes} minutes.</p>
    <p>When it's time, open “My courses” and press <strong>Join</strong>: the room opens ${LIVE_CONFIG.joinEarly} minutes before the start. We've emailed the details to ${esc(d.email)}.</p>
    ${more > 0 ? `<p class="note">Book your other ${more} lesson${more === 1 ? "" : "s"} yourself in “My courses”, whenever you like until ${localDay(b.until)}.</p>` : ""}
    ${open} ${planOffer({ product: d.booking.product }) ? `<button class="btn btn-ghost" data-modal-close data-goto-plans>See the plans</button>` : ""}</div>`);
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
  if (!b || !confirm(`Stop your plan's renewal? You'll keep your remaining lessons until ${localDay(b.credit.expires)}.`)) return;
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
  box.innerHTML = `<h3>My live lessons · demo</h3>
    ${list.map((b) => `<div class="session" data-session="${b.id}">
      <div><strong>${localDay(b.start)} · ${localTime(b.start)}</strong><small>${b.minutes} min · ${b.need}</small></div>
      <span class="countdown" data-countdown="${b.id}"></span>
      <button class="btn btn-primary mini" data-join="${b.id}">Join</button>
    </div>`).join("")}
    ${packs.map((b) => { const c = b.credit, left = c.total - c.used, until = c.expires ? localDay(c.expires) : "";
      return `<div class="session pack"><div><strong>${c.plan ? esc(byId(b.product).name.split(" · ")[0]) : "Your lesson pack"}</strong>
      <small>${left} lesson${left === 1 ? "" : "s"} left${until ? ` until ${until}` : ""}${c.plan ? (c.renews ? ` · renewal link emailed 7 days before ${until}` : " · renewal stopped") : ""}</small></div>
      ${left > 0 ? `<button class="btn btn-ghost mini" data-book-credit="${b.id}">Book your next lesson</button>` : ""}
      ${c.plan && c.renews ? `<button class="link-btn" data-cancel-plan="${b.id}">Stop the renewal</button>` : ""}</div>`; }).join("")}`;
  tick();
}

function tick() {
  const now = Date.now();
  for (const b of bookings()) {
    const c = document.querySelector(`[data-countdown="${b.id}"]`);
    if (c) {
      const st = sessionState(b, now);
      c.textContent = st === "ended" ? "Ended" : now < b.start ? `Starts in ${duration(b.start - now)}` : `In progress · ${duration(b.start + b.minutes * MIN - now)} left`;
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
      <div><p class="eyebrow">Live lesson with Olivier</p><strong>${b.need}</strong></div>
      <div class="room-timer" id="roomTimer"></div>
      <button class="btn btn-ghost mini" data-leave>Leave</button>
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
    <p class="room-msg">Demo: in a real lesson, your call with Olivier connects here. Use the preview to check that your camera and microphone are working.</p>`;
  try {
    room.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    $("#selfView").srcObject = room.stream;
  } catch {
    box.querySelector(".room-msg").textContent = "Please allow camera and microphone access in your browser, then reload the page.";
  }
}

function roomTick(now) {
  if (!room || !$("#roomTimer")) return;
  const { b } = room, end = b.start + b.minutes * MIN;
  const t = $("#roomTimer"), bar = $("#roomBar");
  if (now < b.start) { t.textContent = `Starts in ${duration(b.start - now)}`; bar.style.width = "0%"; t.className = "room-timer"; return; }
  if (now >= end) { t.textContent = "Time's up"; bar.style.width = "100%"; t.className = "room-timer over"; return; }
  t.textContent = `${duration(end - now)} left`;
  bar.style.width = `${((now - b.start) / (b.minutes * MIN)) * 100}%`;
  t.className = end - now <= 5 * MIN ? "room-timer warn" : "room-timer";
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
