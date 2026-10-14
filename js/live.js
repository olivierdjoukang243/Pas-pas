// ====== Live lessons: request, Olivier's answer, payment, countdown, video room ======
// 1. The learner proposes at least 6 start times over at least 3 days, in their own time zone.
// 2. Olivier ticks the times that suit him (link in his email: ?olivier=<id>&key=<key>).
// 3. The learner gets an email (?lesson=<id>&key=<key>), picks one of those times and pays.
//    A pack session needs no payment. Payment confirms the session.
// 4. At the time, the learner presses Join: the video lesson opens here, with a timer.
//
// Without a server (SHOP.api empty) nothing is sent for real. Add ?demo to the address to
// try the whole flow in this browser, Olivier's side included.

const LIVE_CONFIG = {
  utcOffset: 1,                 // Douala: UTC+1, no daylight saving
  hours: ["06:00", "22:00"],    // the times a lesson can take place, Douala time
  step: 30,                     // minutes between two possible start times
  noticeHours: 24,              // earliest start: 24 h ahead
  horizonDays: 21,              // latest start: 3 weeks ahead
  minTimes: 6,                  // the learner proposes at least 6 times…
  minDays: 3,                   // …spread over at least 3 days
  joinEarly: 10,                // the Join button opens 10 minutes before the start
  video: { appId: "" },         // JaaS (8x8) app id, e.g. "vpaas-magic-cookie-…"; needs SHOP.api for the token
};

const LIVE_MINUTES = { "live-30": 30, "live-60": 60, "live-pack5": 60 };
const PACK_SIZE = { "live-pack5": 5 };

// ---- time helpers -------------------------------------------------------
const H = 3600e3, MIN = 60e3, DAY = 24 * H;
const pad = (n) => String(n).padStart(2, "0");
const hm = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const localDay = (ms) => new Date(ms).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
const localTime = (ms) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const doualaTime = (ms) => { const d = new Date(ms + LIVE_CONFIG.utcOffset * H); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
function visitorZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "your time"; } }
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

// ---- step 1: the learner proposes times -------------------------------
const booking = { product: "live-60", need: LIVE_NEEDS[0], level: "I don't know yet", day: null, times: [], credit: null };
let takenFromServer = [];

async function loadTaken() {
  if (!SHOP.api) return;
  try {
    const r = await fetch(`${SHOP.api}/slots/taken`);
    takenFromServer = (await r.json()).taken || [];
  } catch { takenFromServer = []; }
}

function openBooking(product, credit = null) {
  Object.assign(booking, { product: product || booking.product, day: null, times: [], credit });
  loadTaken().then(() => { if (modal.open && $("#bookForm")) renderBooking(); });
  openModal(`<form class="checkout book" id="bookForm" novalidate></form>`);
  renderBooking();
}

function renderBooking() {
  const minutes = LIVE_MINUTES[booking.product];
  const all = candidateTimes(minutes, takenFromServer);
  booking.times = booking.times.filter((t) => all.includes(t));
  const days = [...new Set(all.map(localDay))];
  if (!days.includes(booking.day)) booking.day = days[0] || null;
  const times = all.filter((t) => localDay(t) === booking.day);
  const n = booking.times.length, nd = daysOf(booking.times);
  const ready = n >= LIVE_CONFIG.minTimes && nd >= LIVE_CONFIG.minDays;
  const p = byId(booking.product);
  const talk = talkFirstLinks();
  const chosen = [...booking.times].sort((x, y) => x - y);
  $("#bookForm").innerHTML = `
    <p class="eyebrow">${booking.credit ? "Book with your pack" : "Book a live lesson"}${DEMO ? " · demo" : ""}</p>
    <h2>When are you free?</h2>
    <p>Propose at least <strong>${LIVE_CONFIG.minTimes} times over ${LIVE_CONFIG.minDays} different days</strong>. Olivier ticks the ones that suit him, then you choose one and ${booking.credit ? "confirm it" : "pay to confirm it"}.</p>
    ${booking.credit ? `<p class="note">Session ${booking.credit.used + 1} of ${booking.credit.total} of your pack: no payment needed.</p>` : `
    <div class="pay-methods book-len" role="radiogroup" aria-label="Session">
      ${LIVE.map((x) => `<label class="pm"><input type="radio" name="product" value="${x.id}" ${x.id === booking.product ? "checked" : ""}> ${x.name}<br><b>${price(x)}</b></label>`).join("")}
    </div>`}
    <div class="form-grid">
      <label for="bkNeed">What would you like to work on?<select id="bkNeed" name="need">${LIVE_NEEDS.map((x) => `<option ${x === booking.need ? "selected" : ""}>${x}</option>`).join("")}</select></label>
      <label for="bkLevel">Your level<select id="bkLevel" name="level"><option>I don't know yet</option>${LEVELS.map((l) => `<option ${l.code === booking.level ? "selected" : ""}>${l.code}</option>`).join("")}</select></label>
    </div>
    <p class="eyebrow pm-title">Your free times · in your zone (${visitorZone()}) · ${minutes} min</p>
    <div class="chips-row" role="group" aria-label="Day">${days.map((d) => {
      const k = booking.times.filter((t) => localDay(t) === d).length;
      return `<button type="button" class="slot ${d === booking.day ? "on" : ""}" data-day="${d}">${d}${k ? ` · ${k}` : ""}</button>`; }).join("")}</div>
    <div class="chips-row" role="group" aria-label="Start times">${times.map((t) => `<button type="button" class="slot ${booking.times.includes(t) ? "on" : ""}" aria-pressed="${booking.times.includes(t)}" data-slot="${t}">${localTime(t)}</button>`).join("")}</div>
    <p class="note ${ready ? "ok" : ""}">${n} time${n === 1 ? "" : "s"} over ${nd} day${nd === 1 ? "" : "s"} · ${ready ? "enough, you can send them" : `at least ${LIVE_CONFIG.minTimes} over ${LIVE_CONFIG.minDays} days`}</p>
    ${chosen.length ? `<ul class="proposed">${chosen.map((t) => `<li>${localDay(t)} ${localTime(t)} <button type="button" class="link-btn" data-slot="${t}" aria-label="Remove">✕</button></li>`).join("")}</ul>` : ""}
    <div class="form-grid">
      <label for="bkName">Your name<input id="bkName" name="name" required autocomplete="name" value="${esc(booking.name || "")}"></label>
      <label for="bkEmail">Email<input id="bkEmail" name="email" type="email" required autocomplete="email" value="${esc(booking.email || "")}"></label>
    </div>
    <p class="form-error" id="bkError" hidden></p>
    <button class="btn btn-primary btn-block" ${ready ? "" : "disabled"}>Send my times to Olivier</button>
    <p class="note">${booking.credit ? "" : `Nothing to pay now: you pay ${price(p)} once Olivier has answered and you have chosen your time. `}${talk ? `Want to talk first? ${talk}` : ""}</p>`;
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
  if (booking.times.length < LIVE_CONFIG.minTimes || daysOf(booking.times) < LIVE_CONFIG.minDays) { err.textContent = `Propose at least ${LIVE_CONFIG.minTimes} times over ${LIVE_CONFIG.minDays} days.`; err.hidden = false; return; }
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
    <p class="eyebrow pm-title">Tick the times that suit you · Douala time</p>
    <div class="answer-list">${r.proposed.map((t) => `<label class="pm"><input type="checkbox" name="t" value="${t}" ${(r.accepted || []).includes(t) ? "checked" : ""}> ${new Date(t + LIVE_CONFIG.utcOffset * H).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })} · ${doualaTime(t)}–${doualaTime(t + r.minutes * MIN)}</label>`).join("")}</div>
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
    <div class="answer-list">${free.map((t, i) => `<label class="pm"><input type="radio" name="t" value="${t}" ${i ? "" : "checked"}> ${localDay(t)}, ${localTime(t)}–${localTime(t + r.minutes * MIN)} <small>(${doualaTime(t)} in Douala)</small></label>`).join("")}</div>
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
  if (pack) b.credit = { total: pack, used: 1 };
  saveBookings([...bookings(), b]);
  if (draft.request) saveRequests(requests().filter((x) => x.id !== draft.request));
  renderMySessions();
  return b;
}

function useCredit(packId, draft) {
  const list = bookings();
  const pack = list.find((x) => x.id === packId);
  if (!pack || pack.credit.used >= pack.credit.total) return;
  pack.credit.used++;
  list.push({ ...draft, id: `${packId}-${pack.credit.used}`, status: pack.status, fromPack: packId, room: null });
  saveBookings(list);
  if (draft.request) saveRequests(requests().filter((x) => x.id !== draft.request));
  bookedScreen(list[list.length - 1]);
  renderMySessions();
}

function bookedScreen(b) {
  openModal(`<div class="checkout">
    <p class="eyebrow">${b.status === "demo" ? "Demo booking · nothing was charged" : "Booked"}</p>
    <h2>Your live lesson is booked</h2>
    <p><strong>${localDay(b.start)}, ${localTime(b.start)}</strong> your time (${b.zone}) · ${doualaTime(b.start)} in Douala · ${b.minutes} minutes.</p>
    <p>Come back to this page at that time: the <strong>Join</strong> button opens ${LIVE_CONFIG.joinEarly} minutes before the start, in the “My live lessons” section.</p>
    <button class="btn btn-primary" data-modal-close>Done</button>
  </div>`);
}

// ---- my sessions: countdown and Join ------------------------------------
function sessionState(b, now = Date.now()) {
  const end = b.start + b.minutes * MIN;
  if (now >= end) return "ended";
  if (now >= b.start - LIVE_CONFIG.joinEarly * MIN) return "open";
  return "waiting";
}

function renderMySessions() {
  const box = $("#mySessions");
  if (!box) return;
  const list = bookings().filter((b) => b.start + b.minutes * MIN > Date.now() - DAY).sort((a, b) => a.start - b.start);
  const packs = bookings().filter((b) => b.credit && b.credit.used < b.credit.total);
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
    ${packs.map((b) => `<div class="session pack"><div><strong>Your pack</strong><small>${b.credit.total - b.credit.used} session(s) left</small></div>
      <button class="btn btn-ghost mini" data-book-credit="${b.id}">Book the next one</button></div>`).join("")}`;
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
  const el = e.target.closest("[data-book],[data-day],[data-slot],[data-join],[data-leave],[data-book-credit],[data-choose],[data-answer-demo]");
  if (!el) return;
  const d = el.dataset;
  if ("book" in d) openBooking(d.book || null);
  else if (d.day) { booking.day = d.day; renderBooking(); }
  else if (d.slot) {
    const t = Number(d.slot);
    booking.times = booking.times.includes(t) ? booking.times.filter((x) => x !== t) : [...booking.times, t];
    renderBooking();
  }
  else if (d.join) openRoom(d.join);
  else if ("leave" in d) leaveRoom();
  else if (d.bookCredit) {
    const pack = bookings().find((x) => x.id === d.bookCredit);
    if (pack) openBooking("live-pack5", { id: pack.id, used: pack.credit.used, total: pack.credit.total });
  }
  else if (d.choose) { const r = requests().find((x) => x.id === d.choose); if (r) openChoice(r.id, r.key); }
  else if (d.answerDemo) openAnswer(d.answerDemo, "demo");
});
modal.addEventListener("change", (e) => {
  if (!$("#bookForm") || !e.target.closest("#bookForm")) return;
  if (e.target.name === "product") { booking.product = e.target.value; renderBooking(); }
  else if (e.target.name === "need") booking.need = e.target.value;
  else if (e.target.name === "level") booking.level = e.target.value;
});
modal.addEventListener("submit", (e) => {
  const id = e.target.id;
  if (!["bookForm", "answerForm", "choiceForm"].includes(id)) return;
  e.preventDefault();
  if (id === "bookForm") submitBooking(e.target);
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
