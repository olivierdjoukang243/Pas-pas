// ====== Live lessons: booking, countdown, video room ======
// Olivier's availability is set below, in Douala time (WAT, UTC+1 all year).
// The visitor sees every slot in their own time zone.
//
// Without a booking server (SHOP.api empty) nothing can be booked for real:
// the page shows the slots and offers to talk first. Add ?demo to the address
// to try the whole flow locally (bookings are then kept in this browser only).

const LIVE_CONFIG = {
  utcOffset: 1,                        // Douala: UTC+1, no daylight saving
  // 0 = Sunday … 6 = Saturday; windows in Douala time. EXAMPLE: to confirm with Olivier.
  weekly: {
    1: [["18:00", "21:00"]],
    2: [["18:00", "21:00"]],
    3: [["18:00", "21:00"]],
    4: [["18:00", "21:00"]],
    5: [["18:00", "21:00"]],
    6: [["09:00", "13:00"]],
  },
  step: 30,           // minutes between two possible starts
  noticeHours: 24,    // earliest booking: 24 h ahead
  horizonDays: 21,    // latest booking: 3 weeks ahead
  joinEarly: 10,      // the Join button opens 10 minutes before the start
  video: { appId: "" },  // JaaS (8x8) app id, e.g. "vpaas-magic-cookie-…"; needs SHOP.api for the token
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

// Every start time Olivier offers for a session of `minutes`, from now + notice to the horizon.
function liveSlots(minutes, taken = []) {
  const now = Date.now(), off = LIVE_CONFIG.utcOffset * H, out = [];
  const today = new Date(now + off);
  for (let i = 0; i <= LIVE_CONFIG.horizonDays; i++) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + i));
    for (const [a, b] of LIVE_CONFIG.weekly[day.getUTCDay()] || []) {
      for (let t = hm(a); t + minutes <= hm(b); t += LIVE_CONFIG.step) {
        const start = day.getTime() + t * MIN - off;
        if (start < now + LIVE_CONFIG.noticeHours * H) continue;
        if (overlaps(start, minutes) || taken.some((x) => start < x.end && x.start < start + minutes * MIN)) continue;
        out.push(start);
      }
    }
  }
  return out;
}

// ---- booking flow -------------------------------------------------------
const booking = { product: "live-60", need: LIVE_NEEDS[0], level: "I don't know yet", day: null, start: null, credit: null };
let takenFromServer = [];

async function loadTaken() {
  if (!SHOP.api) return;
  try {
    const r = await fetch(`${SHOP.api}/slots/taken`);
    takenFromServer = (await r.json()).taken || [];
  } catch { takenFromServer = []; }
}

function openBooking(product, credit = null) {
  Object.assign(booking, { product: product || booking.product, day: null, start: null, credit });
  loadTaken().then(() => { if (modal.open && $("#bookForm")) renderBooking(); });
  openModal(`<form class="checkout book" id="bookForm" novalidate></form>`);
  renderBooking();
}

function renderBooking() {
  const minutes = LIVE_MINUTES[booking.product];
  const slots = liveSlots(minutes, takenFromServer);
  const days = [...new Set(slots.map(localDay))];
  if (!days.includes(booking.day)) booking.day = days[0] || null;
  const times = slots.filter((s) => localDay(s) === booking.day);
  if (!times.includes(booking.start)) booking.start = null;
  const p = byId(booking.product);
  const talk = talkFirstLinks();
  $("#bookForm").innerHTML = `
    <p class="eyebrow">${booking.credit ? "Book with your pack" : "Book a live lesson"}${DEMO ? " · demo" : ""}</p>
    <h2>Choose your session and time</h2>
    ${booking.credit ? `<p>Session ${booking.credit.used + 1} of ${booking.credit.total} of your pack: no payment needed.</p>` : `
    <div class="pay-methods book-len" role="radiogroup" aria-label="Session">
      ${LIVE.map((x) => `<label class="pm"><input type="radio" name="product" value="${x.id}" ${x.id === booking.product ? "checked" : ""}> ${x.name}<br><b>${price(x)}</b></label>`).join("")}
    </div>`}
    <div class="form-grid">
      <label for="bkNeed">What would you like to work on?<select id="bkNeed" name="need">${LIVE_NEEDS.map((n) => `<option ${n === booking.need ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label for="bkLevel">Your level<select id="bkLevel" name="level"><option>I don't know yet</option>${LEVELS.map((l) => `<option ${l.code === booking.level ? "selected" : ""}>${l.code}</option>`).join("")}</select></label>
    </div>
    <p class="eyebrow pm-title">Olivier's availability · times in your zone (${visitorZone()})</p>
    ${days.length ? `<div class="chips-row" role="group" aria-label="Day">${days.map((d) => `<button type="button" class="slot ${d === booking.day ? "on" : ""}" data-day="${d}">${d}</button>`).join("")}</div>
    <div class="chips-row" role="group" aria-label="Start time">${times.map((s) => `<button type="button" class="slot ${s === booking.start ? "on" : ""}" data-slot="${s}">${localTime(s)}</button>`).join("")}</div>
    ${booking.start ? `<p class="note">${localDay(booking.start)}, ${localTime(booking.start)}–${localTime(booking.start + minutes * MIN)} your time · ${doualaTime(booking.start)} in Douala.</p>` : `<p class="note">Pick a start time.</p>`}`
    : `<p class="note">No free time in the next ${LIVE_CONFIG.horizonDays} days. Talk to Olivier to find one.</p>`}
    <div class="form-grid">
      <label for="bkName">Your name<input id="bkName" name="name" required autocomplete="name" value="${booking.name || ""}"></label>
      <label for="bkEmail">Email<input id="bkEmail" name="email" type="email" required autocomplete="email" value="${booking.email || ""}"></label>
    </div>
    <p class="form-error" id="bkError" hidden></p>
    <button class="btn btn-primary btn-block" ${booking.start ? "" : "disabled"}>${booking.credit ? "Book this session" : `Continue to payment · ${price(p)}`}</button>
    ${talk ? `<p class="note">Want to talk first? ${talk} Free of charge, before you pay.</p>` : ""}`;
}

function talkFirstLinks() {
  const text = `Hello Olivier, before booking a live lesson I'd like to talk about: ${booking.need} (level: ${booking.level}).`;
  const bits = [];
  if (SHOP.whatsapp) bits.push(`<a href="${whatsappLink(text)}" target="_blank" rel="noopener">WhatsApp</a>`);
  if (SHOP.email) bits.push(`<a href="mailto:${SHOP.email}?subject=${encodeURIComponent("Live lesson")}&body=${encodeURIComponent(text)}">email</a>`);
  return bits.length ? `Write on ${bits.join(" or ")}.` : "";
}

function submitBooking(form) {
  const d = new FormData(form);
  booking.name = String(d.get("name") || "").trim();
  booking.email = String(d.get("email") || "").trim();
  const err = $("#bkError");
  if (!booking.start) { err.textContent = "Pick a start time."; err.hidden = false; return; }
  if (!booking.name || !form.bkEmail.checkValidity() || !booking.email) { err.textContent = "Enter your name and a valid email address."; err.hidden = false; return; }
  const draft = { product: booking.product, need: booking.need, level: booking.level, start: booking.start,
    minutes: LIVE_MINUTES[booking.product], name: booking.name, email: booking.email, zone: visitorZone() };
  if (booking.credit) return useCredit(booking.credit.id, draft);
  openBuy(booking.product, draft);                    // payment step, methods by country (app.js)
}

// Called by app.js once a session is paid (server) or in demo mode.
function confirmBooking(draft, status, reference) {
  const b = { ...draft, id: reference || "PAP-" + Date.now().toString(36).toUpperCase(), status, room: null };
  const pack = PACK_SIZE[draft.product];
  if (pack) b.credit = { total: pack, used: 1 };
  saveBookings([...bookings(), b]);
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
  box.hidden = !list.length && !packs.length;
  box.innerHTML = `<h3>My live lessons${DEMO ? " · demo" : ""}</h3>
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
  const el = e.target.closest("[data-book],[data-day],[data-slot],[data-join],[data-leave],[data-book-credit]");
  if (!el) return;
  const d = el.dataset;
  if ("book" in d) openBooking(d.book || null);
  else if (d.day) { booking.day = d.day; booking.start = null; renderBooking(); }
  else if (d.slot) { booking.start = Number(d.slot); renderBooking(); }
  else if (d.join) openRoom(d.join);
  else if ("leave" in d) leaveRoom();
  else if (d.bookCredit) {
    const pack = bookings().find((x) => x.id === d.bookCredit);
    if (pack) openBooking("live-pack5", { id: pack.id, used: pack.credit.used, total: pack.credit.total });
  }
});
modal.addEventListener("change", (e) => {
  if (!$("#bookForm") || !e.target.closest("#bookForm")) return;
  if (e.target.name === "product") { booking.product = e.target.value; renderBooking(); }
  else if (e.target.name === "need") booking.need = e.target.value;
  else if (e.target.name === "level") booking.level = e.target.value;
});
modal.addEventListener("submit", (e) => { if (e.target.id === "bookForm") { e.preventDefault(); submitBooking(e.target); } });
modal.addEventListener("close", () => { if (room) leaveRoom(); });

renderMySessions();
setInterval(tick, 1000);
checkReturn();
