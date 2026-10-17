// ====== Live lessons: instant booking, request, payment, countdown, video room ======
// Book now (default, needs SHOP.api or ?demo): the learner sees Olivier's real free times, read by
// the server from his Google Calendar (his Preply lessons included), picks one, pays: booked.
// The server writes the lesson in a separate "Pas à Pas" calendar, never linked to Preply, and
// notifies Olivier, who blocks the time on Preply himself (docs/serveur.md, GET /slots).
// Propose times (fallback, when no free time suits):
// 1. The learner proposes at least 3 start times (at most 3 a day; 6 over 3 days advised), in their own time zone.
// 2. Olivier ticks the times that suit him (link in his email: ?olivier=<id>&key=<key>).
// 3. The learner gets an email (?lesson=<id>&key=<key>), picks one of those times and pays.
//    A pack session needs no payment. Payment confirms the session.
// 4. At the time, the learner presses Join: the video lesson opens here, with a timer.
//
// Without a server (SHOP.api empty) nothing is sent for real. Add ?demo to the address to
// try the whole flow in this browser, Olivier's side included.

const LIVE_CONFIG = {
  utcOffset: 1,                 // Douala: UTC+1, no daylight saving
  hours: ["06:00", "22:00"],    // Douala time: no lesson starts before 06:00 or ends after 22:00 (Olivier sleeps 22:00–06:00)
  step: 30,                     // minutes between two possible start times
  noticeHours: 24,              // earliest start: 24 h ahead
  horizonDays: 21,              // latest start: 3 weeks ahead
  minTimes: 3,                  // the request can be sent from 3 proposed times…
  goodTimes: 6, goodDays: 3,    // …but 6 over 3 days give Olivier the best chance, and the page says so
  maxPerDay: 3,                 // at most 3 times a day, so the times are really spread out
  joinEarly: 10,                // the Join button opens 10 minutes before the start
  instant: { noticeHours: 3, horizonDays: 14, bufferMin: 15 },   // Book now: from 3 h ahead, 2 weeks, 15 min between lessons
  video: { appId: "" },         // JaaS (8x8) app id, e.g. "vpaas-magic-cookie-…"; needs SHOP.api for the token
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

// ---- bookings (server when configured, this browser otherwise) ----------
const bookings = () => store.get("bookings", []);
const saveBookings = (list) => store.set("bookings", list);

function overlaps(start, minutes) {
  return bookings().some((b) => b.status !== "cancelled" && start < b.start + b.minutes * MIN && b.start < start + minutes * MIN);
}

// Every start time a learner may propose for a session of `minutes`: within the lesson hours
// (Douala), from now + notice to the horizon, outside sessions already booked.
function candidateTimes(minutes, taken = []) {
  const now = Date.now(), off = LIVE_CONFIG.utcOffset * H, out = [];
  const today = new Date(now + off);
  const [a, b] = LIVE_CONFIG.hours.map(hm);
  for (let i = 0; i <= LIVE_CONFIG.horizonDays; i++) {
    const day = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i);
    for (let t = a; t + minutes <= b; t += LIVE_CONFIG.step) {
      const start = day + t * MIN - off;
      if (start < now + LIVE_CONFIG.noticeHours * H) continue;
      if (overlaps(start, minutes) || taken.some((x) => start < x.end && x.start < start + minutes * MIN)) continue;
      out.push(start);
    }
  }
  return out;
}

// ---- requests (server when configured, this browser otherwise) ---------
const requests = () => store.get("requests", []);
const saveRequests = (list) => store.set("requests", list);
const upsertRequest = (r) => saveRequests([...requests().filter((x) => x.id !== r.id), r]);
const daysOf = (times) => new Set(times.map(localDay)).size;

// ---- book now: Olivier's free times, from his calendar -------------------
let freeSlots = null;                 // start times (ms) free for the chosen length, or null while loading
async function loadFree(minutes) {
  freeSlots = null;
  if (SHOP.api) {
    try {
      const r = await fetch(`${SHOP.api}/slots?minutes=${minutes}`);
      freeSlots = ((await r.json()).free || []).map(Number).filter((t) => t > Date.now());
    } catch { freeSlots = []; }
  } else if (DEMO) {
    // demo: every time of the lesson hours from 3 h ahead, minus a pretend busy pattern
    const C = LIVE_CONFIG, keep = { ...C };
    C.noticeHours = C.instant.noticeHours; C.horizonDays = C.instant.horizonDays;
    freeSlots = candidateTimes(minutes).filter((t) => (Math.floor(t / (90 * MIN)) % 3) !== 0);
    Object.assign(C, keep);
  } else freeSlots = [];
}
const instantOn = () => !!(SHOP.api || DEMO);

// ---- step 1: the learner proposes times -------------------------------
const booking = { product: "live-60", need: LIVE_NEEDS[0], level: "I don't know yet", day: null, times: [], credit: null, mode: "now", slot: null };
let takenFromServer = [];

async function loadTaken() {
  if (!SHOP.api) return;
  try {
    const r = await fetch(`${SHOP.api}/slots/taken`);
    takenFromServer = (await r.json()).taken || [];
  } catch { takenFromServer = []; }
}

function openBooking(product, credit = null, mode = null) {
  Object.assign(booking, { product: product || booking.product, day: null, times: [], credit, slot: null,
    mode: mode || (instantOn() ? "now" : "propose") });
  openModal(`<form class="checkout book" id="bookForm" novalidate></form>`);
  if (booking.mode === "now") {
    loadFree(LIVE_MINUTES[booking.product]).then(() => { if (modal.open && $("#bookForm")) renderBooking(); });
  } else loadTaken().then(() => { if (modal.open && $("#bookForm")) renderBooking(); });
  renderBooking();
}

// Book now: one free time, then payment (or the pack credit).
function renderInstant() {
  if ($("#bkName")) { booking.name = $("#bkName").value; booking.email = $("#bkEmail").value; }
  const minutes = LIVE_MINUTES[booking.product], p = byId(booking.product);
  const all = freeSlots || [];
  const days = [...new Set(all.map(localDay))];
  if (!days.includes(booking.day)) booking.day = days[0] || null;
  if (booking.slot && !all.includes(booking.slot)) booking.slot = null;
  const times = all.filter((t) => localDay(t) === booking.day);
  const talk = talkFirstLinks();
  $("#bookForm").innerHTML = `
    <p class="eyebrow">${booking.credit ? "Book with your pack" : "Book a live lesson"}${DEMO ? " · demo" : ""}</p>
    <h2>${PACK_SIZE[booking.product] && !booking.credit ? "Pick the time of your first lesson" : "Pick a time that suits you"}</h2>
    <p>These are Olivier's free times, updated live, in <strong>your local time (${zoneLabel()})</strong>. Choose one${booking.credit ? " and confirm it" : ", pay, and it is booked"}: no waiting for an answer.</p>
    ${booking.credit ? `<p class="note">Session ${booking.credit.used + 1} of ${booking.credit.total} of your pack: no payment needed.</p>` : `
    <div class="pay-methods book-len" role="radiogroup" aria-label="Session">
      ${LIVE.filter((x) => !x.plan || x.id === booking.product).map((x) => `<label class="pm"><input type="radio" name="product" value="${x.id}" ${x.id === booking.product ? "checked" : ""}> ${x.name}<br><b>${price(x)}${x.plan ? " every 2 months" : ""}</b></label>`).join("")}
    </div>`}
    <div class="form-grid">
      <label for="bkNeed">What would you like to work on?<select id="bkNeed" name="need">${LIVE_NEEDS.map((x) => `<option ${x === booking.need ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label for="bkLevel">Your level<select id="bkLevel" name="level"><option>I don't know yet</option>${LEVELS.map((l) => `<option ${l.code === booking.level ? "selected" : ""}>${l.code}</option>`).join("")}</select></label>
    </div>
    ${freeSlots === null ? `<p class="note" role="status">Loading Olivier's free times…</p>` : !all.length ? `<p class="note" role="status">No free ${minutes}-minute time in the next ${LIVE_CONFIG.instant.horizonDays} days.</p>` : `
    <p class="eyebrow pm-title">Free times · ${minutes}-minute lesson</p>
    <div class="chips-row" role="group" aria-label="Day">${days.map((d) => `<button type="button" class="slot ${d === booking.day ? "on" : ""}" data-day="${d}">${d}</button>`).join("")}</div>
    <div class="chips-row" id="bkTimes" role="group" aria-label="Start times">${times.map((t) => `<button type="button" class="slot ${t === booking.slot ? "on" : ""}" aria-pressed="${t === booking.slot}" data-pick="${t}">${localTime(t)}</button>`).join("")}</div>
    ${booking.slot ? `<p class="note ok" role="status">Your lesson: <strong>${localDay(booking.slot)}, ${localTime(booking.slot)}–${localTime(booking.slot + minutes * MIN)}</strong> your time.</p>` : ""}`}
    <div class="form-grid" id="bkDetails">
      <label for="bkName">Your name<input id="bkName" name="name" required autocomplete="name" value="${esc(booking.name || "")}"></label>
      <label for="bkEmail">Email<input id="bkEmail" name="email" type="email" required autocomplete="email" value="${esc(booking.email || "")}"></label>
    </div>
    <p class="form-error" id="bkError" hidden></p>
    ${PACK_SIZE[booking.product] && !booking.credit ? `<p class="note">The other ${PACK_SIZE[booking.product] - 1} lessons: book them whenever you like over the next 2 months, from “My live lessons”.</p>` : ""}
    <button class="btn btn-primary btn-block" ${booking.slot ? "" : "disabled"}>${booking.credit ? "Confirm this time" : `Continue to payment · ${price(p)}${p.plan ? " every 2 months" : ""}`}</button>
    <p class="note">None of these times suits you? <button type="button" class="link-btn" data-propose>Propose your own times</button>${talk ? ` · Want to talk first? ${talk}` : ""}</p>`;
}

function submitInstant(form) {
  const d = new FormData(form);
  booking.name = String(d.get("name") || "").trim();
  booking.email = String(d.get("email") || "").trim();
  const err = $("#bkError");
  if (!booking.slot) { err.textContent = "Choose a time."; err.hidden = false; return; }
  if (!booking.name || !form.bkEmail.checkValidity() || !booking.email) { err.textContent = "Enter your name and a valid email address."; err.hidden = false; return; }
  const draft = { product: booking.product, need: booking.need, level: booking.level, start: booking.slot,
    minutes: LIVE_MINUTES[booking.product], name: booking.name, email: booking.email, zone: visitorZone(), instant: true };
  if (booking.credit) return useCredit(booking.credit.id, draft);
  openBuy(booking.product, draft);                    // payment; the server holds the time while it is paid
}

// Two proposed times may not overlap: a lesson of `minutes` starting at one must end before the other.
const clash = (a, b, minutes) => a !== b && Math.abs(a - b) < minutes * MIN;
const perDay = (times, day) => times.filter((t) => localDay(t) === day).length;

// Keeps the proposed times that still fit the rules, earliest first (after a change of lesson length).
function pruneTimes(times, minutes, all) {
  const kept = [];
  for (const t of [...times].sort((a, b) => a - b)) {
    if (!all.includes(t) || kept.some((k) => clash(k, t, minutes)) || perDay(kept, localDay(t)) >= LIVE_CONFIG.maxPerDay) continue;
    kept.push(t);
  }
  return kept;
}

// Why a time cannot be added, or "" when it can.
function blockedReason(t, minutes) {
  if (booking.times.includes(t)) return "";
  if (booking.times.some((x) => clash(x, t, minutes))) return `overlaps a ${minutes}-minute lesson you already chose`;
  if (perDay(booking.times, localDay(t)) >= LIVE_CONFIG.maxPerDay) return `already ${LIVE_CONFIG.maxPerDay} times on this day`;
  return "";
}

function bookingStatus(n, nd) {
  const C = LIVE_CONFIG;
  const got = `${n} time${n === 1 ? "" : "s"} over ${nd} day${nd === 1 ? "" : "s"}`;
  if (n < C.minTimes) return { ok: false, text: `${got} · choose ${C.minTimes - n} more to send your request` };
  if (n >= C.goodTimes && nd >= C.goodDays) return { ok: true, text: `${got} · ready to send` };
  return { ok: true, text: `${got} · you can send now; ${C.goodTimes} times over ${C.goodDays} days give Olivier the best chance to find one` };
}

// The next day after `day` that still has room, or null.
function nextOpenDay(days, day, minutes) {
  const all = candidateTimes(minutes, takenFromServer);
  for (const d of days.slice(days.indexOf(day) + 1)) {
    if (perDay(booking.times, d) < LIVE_CONFIG.maxPerDay && all.some((t) => localDay(t) === d && !blockedReason(t, minutes))) return d;
  }
  return null;
}

// `next`: what to bring into view after this render: "times", "full", "details" or nothing.
function renderBooking(next) {
  if (booking.mode === "now") return renderInstant();
  // keep what the learner already typed: the form is drawn again at every choice
  if ($("#bkName")) { booking.name = $("#bkName").value; booking.email = $("#bkEmail").value; }
  const minutes = LIVE_MINUTES[booking.product];
  const all = candidateTimes(minutes, takenFromServer);
  booking.times = pruneTimes(booking.times, minutes, all);
  const days = [...new Set(all.map(localDay))];
  if (!days.includes(booking.day)) booking.day = days[0] || null;
  const times = all.filter((t) => localDay(t) === booking.day);
  const n = booking.times.length, nd = daysOf(booking.times);
  const status = bookingStatus(n, nd), ready = status.ok;
  const p = byId(booking.product);
  const talk = talkFirstLinks();
  const chosen = [...booking.times].sort((x, y) => x - y);
  $("#bookForm").innerHTML = `
    <p class="eyebrow">${booking.credit ? "Book with your pack" : "Book a live lesson"}${DEMO ? " · demo" : ""}</p>
    <h2>When are you free?</h2>
    <p>Propose at least <strong>${LIVE_CONFIG.minTimes} start times</strong>, at most ${LIVE_CONFIG.maxPerDay} a day; ${LIVE_CONFIG.goodTimes} times over ${LIVE_CONFIG.goodDays} different days give the best chance. Olivier ticks the ones that suit him, then you choose one and ${booking.credit ? "confirm it" : "pay to confirm it"}.</p>
    ${booking.credit ? `<p class="note">Session ${booking.credit.used + 1} of ${booking.credit.total} of your pack: no payment needed.</p>` : `
    <div class="pay-methods book-len" role="radiogroup" aria-label="Session">
      ${LIVE.filter((x) => !x.plan || x.id === booking.product).map((x) => `<label class="pm"><input type="radio" name="product" value="${x.id}" ${x.id === booking.product ? "checked" : ""}> ${x.name}<br><b>${price(x)}${x.plan ? " every 2 months" : ""}</b></label>`).join("")}
    </div>`}
    <div class="form-grid">
      <label for="bkNeed">What would you like to work on?<select id="bkNeed" name="need">${LIVE_NEEDS.map((x) => `<option ${x === booking.need ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label for="bkLevel">Your level<select id="bkLevel" name="level"><option>I don't know yet</option>${LEVELS.map((l) => `<option ${l.code === booking.level ? "selected" : ""}>${l.code}</option>`).join("")}</select></label>
    </div>
    <p class="eyebrow pm-title">Your free times · your local time (${zoneLabel()})</p>
    <p class="note">Each time is the start of a ${minutes}-minute lesson. Times that would overlap a lesson you chose are greyed out.</p>
    <div class="chips-row" role="group" aria-label="Day">${days.map((d) => {
      const k = perDay(booking.times, d), full = k >= LIVE_CONFIG.maxPerDay;
      const cls = d === booking.day ? "on" : full ? "day-full" : k ? "day-has" : "";
      return `<button type="button" class="slot ${cls}" data-day="${d}" ${k ? `title="${k} time${k > 1 ? "s" : ""} chosen on this day"` : ""}>${d}${k ? ` · ${k}/${LIVE_CONFIG.maxPerDay}` : ""}</button>`; }).join("")}</div>
    <div class="chips-row" id="bkTimes" role="group" aria-label="Start times">${times.map((t) => {
      const why = blockedReason(t, minutes), on = booking.times.includes(t);
      return `<button type="button" class="slot ${on ? "on" : ""}" aria-pressed="${on}" data-slot="${t}" ${why ? `disabled title="${esc(why)}"` : ""}>${localTime(t)}</button>`; }).join("")}</div>
    ${(() => {
      if (booking.dismissFull === booking.day || perDay(booking.times, booking.day) < LIVE_CONFIG.maxPerDay) return "";
      const next = nextOpenDay(days, booking.day, minutes);
      return `<div class="day-full-msg" role="status"><p><b>${booking.day} is full</b> (${LIVE_CONFIG.maxPerDay} times). ${next ? `Choose another day to keep proposing times.` : "No other day has room left."}</p>
        <div class="day-full-actions">${next ? `<button type="button" class="btn btn-primary mini" data-day="${next}">Continue on ${next}</button>` : ""}
        <button type="button" class="btn btn-ghost mini" data-dismiss-full>${ready ? "I'm done, keep my times" : "Close"}</button></div></div>`;
    })()}
    <p class="note ${ready ? "ok" : ""}" role="status">${status.text}</p>
    ${chosen.length ? `<ul class="proposed">${chosen.map((t) => `<li>${localDay(t)}, ${localTime(t)}–${localTime(t + minutes * MIN)} <button type="button" class="link-btn" data-slot="${t}" aria-label="Remove">✕</button></li>`).join("")}</ul>` : ""}
    <div class="form-grid" id="bkDetails">
      <label for="bkName">Your name<input id="bkName" name="name" required autocomplete="name" value="${esc(booking.name || "")}"></label>
      <label for="bkEmail">Email<input id="bkEmail" name="email" type="email" required autocomplete="email" value="${esc(booking.email || "")}"></label>
    </div>
    <p class="form-error" id="bkError" hidden></p>
    <button class="btn btn-primary btn-block" ${ready ? "" : "disabled"}>Send my times to Olivier</button>
    <p class="note">${booking.credit ? "" : `Nothing to pay now: you pay ${price(p)} once Olivier has answered and you have chosen your time. `}${talk ? `Want to talk first? ${talk}` : ""}</p>`;
  if (next === "times") bringIntoView($("#bkTimes"));
  else if (next === "full") bringIntoView($(".day-full-msg"));
  else if (next === "details") {
    const empty = [$("#bkName"), $("#bkEmail")].find((x) => !x.value);
    bringIntoView($("#bkDetails"), empty || null);
  }
}

function talkFirstLinks() {
  const text = `Hello Olivier, before booking a live lesson I'd like to talk about: ${booking.need} (level: ${booking.level}).`;
  const bits = [];
  if (SHOP.whatsapp) bits.push(`<a href="${whatsappLink(text)}" target="_blank" rel="noopener">WhatsApp</a>`);
  if (SHOP.email) bits.push(`<a href="mailto:${SHOP.email}?subject=${encodeURIComponent("Live lesson")}&body=${encodeURIComponent(text)}">email</a>`);
  return bits.length ? `Write on ${bits.join(" or ")}, free of charge.` : "";
}

async function submitBooking(form) {
  const d = new FormData(form);
  booking.name = String(d.get("name") || "").trim();
  booking.email = String(d.get("email") || "").trim();
  const err = $("#bkError");
  if (booking.times.length < LIVE_CONFIG.minTimes) { err.textContent = `Propose at least ${LIVE_CONFIG.minTimes} times.`; err.hidden = false; return; }
  if (!booking.name || !form.bkEmail.checkValidity() || !booking.email) { err.textContent = "Enter your name and a valid email address."; err.hidden = false; return; }
  const req = { product: booking.product, need: booking.need, level: booking.level, minutes: LIVE_MINUTES[booking.product],
    name: booking.name, email: booking.email, zone: visitorZone(), proposed: [...booking.times].sort((a, b) => a - b),
    credit: booking.credit ? booking.credit.id : null };
  if (SHOP.api) {
    try {
      const r = await fetch(`${SHOP.api}/lesson-requests`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
      const out = await r.json();
      if (!r.ok || !out.id) throw new Error();
      upsertRequest({ ...req, id: out.id, key: out.key, status: "pending", accepted: null });
    } catch { err.textContent = "Your times could not be sent just now. Please try again in a moment."; err.hidden = false; return; }
  } else if (DEMO) {
    upsertRequest({ ...req, id: "REQ-" + Date.now().toString(36).toUpperCase(), key: "demo", status: "pending", accepted: null });
  } else {
    const talk = talkFirstLinks();
    return openModal(`<div class="checkout"><h2>Booking opens soon</h2><p>Live lessons can be booked on the site as soon as it opens.</p>${talk ? `<p>${talk}</p>` : ""}<button class="btn btn-ghost" data-modal-close>Close</button></div>`);
  }
  renderMySessions();
  openModal(`<div class="checkout"><p class="eyebrow">Sent${DEMO ? " · demo" : ""}</p><h2>Your times are with Olivier</h2>
    <p>He ticks the times that suit him. You then receive an email to choose one of them${booking.credit ? "" : " and pay to confirm it"}. The request also appears under “My live lessons” on this page.</p>
    ${DEMO ? `<p class="note">Demo: you can answer as Olivier from “My live lessons”.</p>` : ""}
    <button class="btn btn-primary" data-modal-close>Done</button></div>`);
}

// ---- step 2: Olivier ticks the times that suit him ---------------------
async function fetchRequest(id, key) {
  if (SHOP.api) {
    const r = await fetch(`${SHOP.api}/lesson-requests/${encodeURIComponent(id)}?key=${encodeURIComponent(key)}`);
    if (!r.ok) throw new Error();
    return r.json();
  }
  const r = requests().find((x) => x.id === id);
  if (!r) throw new Error();
  return r;
}

async function openAnswer(id, key) {
  let r;
  try { r = await fetchRequest(id, key); } catch {
    return openModal(`<div class="checkout"><h2>Request not found</h2><p>This link is no longer valid.</p><button class="btn btn-ghost" data-modal-close>Close</button></div>`);
  }
  const p = byId(r.product);
  openModal(`<form class="checkout" id="answerForm" data-id="${esc(r.id)}" data-key="${esc(key)}">
    <p class="eyebrow">Olivier · lesson request${DEMO ? " · demo" : ""}</p>
    <h2>${esc(r.name)} · ${p ? esc(p.name) : ""}</h2>
    <p>${esc(r.need)} · level ${esc(r.level)} · ${r.minutes} min · learner's zone: ${esc(r.zone)}</p>
    <p class="eyebrow pm-title">Tick the times that suit you · your time</p>
    <div class="answer-list">${r.proposed.map((t) => `<label class="pm"><input type="checkbox" name="t" value="${t}" ${(r.accepted || []).includes(t) ? "checked" : ""}> ${localDay(t)} · ${localTime(t)}–${localTime(t + r.minutes * MIN)}</label>`).join("")}</div>
    <p class="form-error" id="ansError" hidden></p>
    <button class="btn btn-primary btn-block">Send my answer</button>
    <p class="note">The learner chooses one of the times you tick${r.credit ? "" : ", then pays"}. Tick none if nothing suits: the learner is asked to propose new times.</p>
  </form>`);
}

async function submitAnswer(form) {
  const accepted = [...form.querySelectorAll('input[name="t"]:checked')].map((x) => Number(x.value));
  const { id, key } = form.dataset;
  if (SHOP.api) {
    try {
      const r = await fetch(`${SHOP.api}/lesson-requests/${encodeURIComponent(id)}/answer`, { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, accepted }) });
      if (!r.ok) throw new Error();
    } catch { $("#ansError").textContent = "The answer could not be sent. Please try again."; $("#ansError").hidden = false; return; }
  } else {
    const r = requests().find((x) => x.id === id);
    if (r) upsertRequest({ ...r, accepted, status: accepted.length ? "answered" : "declined" });
  }
  renderMySessions();
  openModal(`<div class="checkout"><h2>Answer sent</h2><p>${accepted.length ? `The learner can now choose among ${accepted.length} time${accepted.length > 1 ? "s" : ""}.` : "The learner is asked to propose new times."}</p><button class="btn btn-primary" data-modal-close>Done</button></div>`);
}

// ---- step 3: the learner picks one of Olivier's times, then pays -------
async function openChoice(id, key) {
  let r;
  try { r = await fetchRequest(id, key); } catch {
    return openModal(`<div class="checkout"><h2>Request not found</h2><p>This link is no longer valid. You can propose new times.</p><button class="btn btn-primary" data-book>Propose times</button></div>`);
  }
  upsertRequest({ ...requests().find((x) => x.id === r.id), ...r, key });
  const free = (r.accepted || []).filter((t) => t > Date.now() + 2 * H && !overlaps(t, r.minutes));
  if (!free.length) {
    return openModal(`<div class="checkout"><h2>${r.accepted && r.accepted.length ? "These times have passed" : "None of your times suited Olivier"}</h2>
      <p>Propose new times: it takes a minute.</p><button class="btn btn-primary" data-book="${r.credit ? "live-pack5" : r.product}">Propose new times</button></div>`);
  }
  const p = byId(r.product);
  openModal(`<form class="checkout" id="choiceForm" data-id="${esc(r.id)}">
    <p class="eyebrow">Olivier has answered${DEMO ? " · demo" : ""}</p>
    <h2>Choose your time</h2>
    <div class="answer-list">${free.map((t, i) => `<label class="pm"><input type="radio" name="t" value="${t}" ${i ? "" : "checked"}> ${localDay(t)}, ${localTime(t)}–${localTime(t + r.minutes * MIN)}</label>`).join("")}</div>
    <button class="btn btn-primary btn-block">${r.credit ? "Confirm this time" : `Continue to payment · ${price(p)}`}</button>
  </form>`);
}

function submitChoice(form) {
  const r = requests().find((x) => x.id === form.dataset.id);
  const start = Number(form.querySelector('input[name="t"]:checked').value);
  const draft = { product: r.product, need: r.need, level: r.level, start, minutes: r.minutes,
    name: r.name, email: r.email, zone: r.zone, request: r.id };
  if (r.credit) return useCredit(r.credit, draft);
  openBuy(r.product, draft);                          // payment step, methods of the learner's country (app.js)
}

// Called by app.js once a session is paid (server) or in demo mode.
function confirmBooking(draft, status, reference) {
  const b = { ...draft, id: reference || "PAP-" + Date.now().toString(36).toUpperCase(), status, room: null };
  const pack = PACK_SIZE[draft.product];
  if (pack) b.credit = { total: pack, used: 1, expires: addMonths(Date.now(), CREDIT_MONTHS),
    plan: isPlan(draft.product), renews: isPlan(draft.product) };
  saveBookings([...bookings(), b]);
  if (draft.request) saveRequests(requests().filter((x) => x.id !== draft.request));
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
  if (draft.request) saveRequests(requests().filter((x) => x.id !== draft.request));
  bookedScreen(list[list.length - 1]);
  renderMySessions();
}

// Right after a single lesson: the moment to offer the plans (the learner has just committed).
function planOffer(b) {
  if (b.fromPack || PACK_SIZE[b.product]) return "";
  const one = byId("live-60"), plan = LIVE.find((x) => x.best) || LIVE.find((x) => x.plan);
  if (!one || !plan) return "";
  const per = amount(plan.usd / plan.lessons, plan.xaf / plan.lessons);
  return `<div class="plan-offer"><p class="eyebrow">Keep the momentum</p>
    <h3>${plan.lessons} lessons every 2 months, ${per} each instead of ${price(one)}</h3>
    <p>Learners who meet a teacher every week keep what they learn. With the ${esc(plan.name.split(" · ")[0])}, you book each lesson when it suits you over 2 months; the plan renews by itself, and you can cancel the renewal at any time.</p>
    <div class="hero-cta tight"><button class="btn btn-primary" data-modal-close data-goto-plans>See the plans</button><button class="btn btn-ghost" data-modal-close>Not now</button></div></div>`;
}

function bookedScreen(b) {
  openModal(`<div class="checkout">
    <p class="eyebrow">${b.status === "demo" ? "Demo booking · nothing was charged" : "Booked"}</p>
    <h2>Your live lesson is booked</h2>
    <p><strong>${localDay(b.start)}, ${localTime(b.start)}</strong> your time (${b.zone}) · ${b.minutes} minutes.</p>
    <p>Come back to this page at that time: the <strong>Join</strong> button opens ${LIVE_CONFIG.joinEarly} minutes before the start, in the “My live lessons” section.</p>
    ${b.credit ? `<p class="note">${b.credit.plan ? "Your plan" : "Your pack"}: ${b.credit.total - 1} more lesson${b.credit.total - 1 === 1 ? "" : "s"} to book whenever you like until ${localDay(b.credit.expires)}, from “My live lessons”.</p>` : ""}
    ${planOffer(b) || `<button class="btn btn-primary" data-modal-close>Done</button>`}
  </div>`);
}

// ---- my sessions: countdown and Join ------------------------------------
function sessionState(b, now = Date.now()) {
  const end = b.start + b.minutes * MIN;
  if (now >= end) return "ended";
  if (now >= b.start - LIVE_CONFIG.joinEarly * MIN) return "open";
  return "waiting";
}

// Cancelling stops the next renewal; the lessons of the current 2 months stay usable until its end.
async function cancelPlan(id) {
  const list = bookings(), b = list.find((x) => x.id === id);
  if (!b || !confirm(`Cancel the renewal of your plan? You keep the lessons left until ${localDay(b.credit.expires)}.`)) return;
  if (SHOP.api) {
    try { const r = await fetch(`${SHOP.api}/plans/${encodeURIComponent(id)}/cancel`, { method: "POST" }); if (!r.ok) throw new Error(); }
    catch { return alert("The renewal could not be cancelled just now. Please try again, or write to us: we cancel it for you."); }
  }
  b.credit.renews = false; saveBookings(list); renderMySessions();
}

function renderMySessions() {
  const box = $("#mySessions");
  if (!box) return;
  const list = bookings().filter((b) => b.start + b.minutes * MIN > Date.now() - DAY).sort((a, b) => a.start - b.start);
  const packs = bookings().filter((b) => b.credit && (b.credit.plan ? b.credit.renews || b.credit.expires > Date.now()
    : b.credit.used < b.credit.total && (!b.credit.expires || b.credit.expires > Date.now())));
  const reqs = requests();
  box.hidden = !list.length && !packs.length && !reqs.length;
  box.innerHTML = `<h3>My live lessons${DEMO ? " · demo" : ""}</h3>
    ${reqs.map((r) => `<div class="session request"><div><strong>${r.status === "answered" ? "Olivier has answered" : r.status === "declined" ? "No time suited Olivier" : "Waiting for Olivier"}</strong>
      <small>${r.proposed.length} times proposed · ${r.minutes} min · ${esc(r.need)}</small></div>
      ${r.status === "answered" ? `<button class="btn btn-primary mini" data-choose="${esc(r.id)}">Choose a time</button>`
        : r.status === "declined" ? `<button class="btn btn-ghost mini" data-book="${r.credit ? "live-pack5" : r.product}">Propose new times</button>`
        : DEMO ? `<button class="btn btn-ghost mini" data-answer-demo="${esc(r.id)}">Demo: answer as Olivier</button>` : ""}
    </div>`).join("")}
    ${list.map((b) => `<div class="session" data-session="${b.id}">
      <div><strong>${localDay(b.start)} · ${localTime(b.start)}</strong><small>${b.minutes} min · ${b.need}</small></div>
      <span class="countdown" data-countdown="${b.id}"></span>
      <button class="btn btn-primary mini" data-join="${b.id}">Join</button>
    </div>`).join("")}
    ${packs.map((b) => { const c = b.credit, left = c.total - c.used, until = c.expires ? localDay(c.expires) : "";
      return `<div class="session pack"><div><strong>${c.plan ? esc(byId(b.product).name.split(" · ")[0]) : "Your pack"}</strong>
      <small>${left} lesson${left === 1 ? "" : "s"} left${until ? ` until ${until}` : ""}${c.plan ? (c.renews ? ` · renews on ${until} with ${c.total} new lessons` : " · renewal cancelled") : ""}</small></div>
      ${left > 0 ? `<button class="btn btn-ghost mini" data-book-credit="${b.id}">Book the next one</button>` : ""}
      ${c.plan && c.renews ? `<button class="link-btn" data-cancel-plan="${b.id}">Cancel renewal</button>` : ""}</div>`; }).join("")}`;
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

// ---- the video room -----------------------------------------------------
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
  if (LIVE_CONFIG.video.appId && SHOP.api) {
    try {
      const r = await fetch(`${SHOP.api}/sessions/${encodeURIComponent(b.id)}/token`);
      const { jwt, room: name } = await r.json();
      await loadScript(`https://8x8.vc/${LIVE_CONFIG.video.appId}/external_api.js`);
      room.api = new JitsiMeetExternalAPI("8x8.vc", { roomName: `${LIVE_CONFIG.video.appId}/${name}`, jwt, parentNode: box,
        width: "100%", height: "100%", userInfo: { displayName: b.name, email: b.email } });
      room.api.addListener("readyToClose", leaveRoom);
      return;
    } catch {
      box.innerHTML = `<p class="room-msg">The video connection failed. Reload the page, or write to Olivier.</p>`;
      return;
    }
  }
  // No video service yet: check the camera and microphone, so the visitor is ready.
  box.innerHTML = `<video id="selfView" autoplay muted playsinline></video>
    <p class="room-msg">${DEMO ? "Demo: the call with Olivier connects here once the video service is set up." : "The call with Olivier connects here."} Your camera preview shows that your camera and microphone work.</p>`;
  try {
    room.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    $("#selfView").srcObject = room.stream;
  } catch {
    box.querySelector(".room-msg").textContent = "Allow access to your camera and microphone in your browser, then reload the page.";
  }
}

function loadScript(src) {
  return new Promise((ok, ko) => {
    if (document.querySelector(`script[src="${src}"]`)) return ok();
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = ko;
    document.head.appendChild(s);
  });
}

function roomTick(now) {
  if (!room || !$("#roomTimer")) return;
  const { b } = room, end = b.start + b.minutes * MIN;
  const t = $("#roomTimer"), bar = $("#roomBar");
  if (now < b.start) { t.textContent = `Starts in ${duration(b.start - now)}`; bar.style.width = "0%"; t.className = "room-timer"; return; }
  if (now >= end) { t.textContent = "Time is up"; bar.style.width = "100%"; t.className = "room-timer over"; return; }
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
  const el = e.target.closest("[data-book],[data-day],[data-slot],[data-pick],[data-propose],[data-join],[data-leave],[data-book-credit],[data-cancel-plan],[data-goto-plans],[data-choose],[data-answer-demo],[data-dismiss-full]");
  if (!el) return;
  const d = el.dataset;
  if ("book" in d) openBooking(d.book || null);
  else if (d.day) { booking.day = d.day; renderBooking("times"); }
  else if (d.pick) { booking.slot = Number(d.pick); renderBooking(); bringIntoView($("#bkDetails"), [$("#bkName"), $("#bkEmail")].find((x) => !x.value) || null); }
  else if ("propose" in d) openBooking(booking.product, booking.credit, "propose");
  else if ("dismissFull" in d) { booking.dismissFull = booking.day; renderBooking("details"); }
  else if (d.slot) {
    const t = Number(d.slot);
    if (booking.times.includes(t)) booking.times = booking.times.filter((x) => x !== t);
    else if (!blockedReason(t, LIVE_MINUTES[booking.product])) booking.times = [...booking.times, t];
    const full = perDay(booking.times, booking.day) >= LIVE_CONFIG.maxPerDay && booking.dismissFull !== booking.day;
    renderBooking(full ? "full" : null);
  }
  else if (d.join) openRoom(d.join);
  else if ("leave" in d) leaveRoom();
  else if (d.bookCredit) {
    const pack = bookings().find((x) => x.id === d.bookCredit);
    if (pack) openBooking(pack.product, { id: pack.id, used: pack.credit.used, total: pack.credit.total });
  }
  else if (d.cancelPlan) cancelPlan(d.cancelPlan);
  else if ("gotoPlans" in d) { const g = $("#livePlans"); if (g) g.scrollIntoView({ behavior: "smooth" }); }
  else if (d.choose) { const r = requests().find((x) => x.id === d.choose); if (r) openChoice(r.id, r.key); }
  else if (d.answerDemo) openAnswer(d.answerDemo, "demo");
});
modal.addEventListener("change", (e) => {
  if (!$("#bookForm") || !e.target.closest("#bookForm")) return;
  if (e.target.name === "product") {
    booking.product = e.target.value;
    if (booking.mode === "now") { booking.slot = null; freeSlots = null; loadFree(LIVE_MINUTES[booking.product]).then(() => renderBooking()); }
    renderBooking();
  }
  else if (e.target.name === "need") booking.need = e.target.value;
  else if (e.target.name === "level") booking.level = e.target.value;
});
modal.addEventListener("submit", (e) => {
  const id = e.target.id;
  if (!["bookForm", "answerForm", "choiceForm"].includes(id)) return;
  e.preventDefault();
  if (id === "bookForm") (booking.mode === "now" ? submitInstant : submitBooking)(e.target);
  else if (id === "answerForm") submitAnswer(e.target);
  else submitChoice(e.target);
});
modal.addEventListener("close", () => { if (room) leaveRoom(); });

// Links from the emails: ?olivier=<id>&key=<key> (Olivier's answer), ?lesson=<id>&key=<key> (learner's choice)
function openFromLink() {
  const q = new URLSearchParams(location.search);
  const key = q.get("key") || "";
  if (q.get("olivier")) openAnswer(q.get("olivier"), key);
  else if (q.get("lesson")) openChoice(q.get("lesson"), key);
}

renderMySessions();
setInterval(tick, 1000);
checkReturn();
openFromLink();
