// ====== The site assistant: the "Questions?" bubble ======
// The server (chat.py) answers from the site's own texts only: FAQ, policies, catalogue,
// modules, exam formats. It never teaches and never invents a price; anything else goes to
// hello@ or a live lesson. If the server can't answer (no key yet, offline, limit reached),
// the bubble looks for the closest question in the FAQ of the page language.
(() => {
  const CONTACT = "hello@pasapasfrench.com";
  const SCRIPTS = document.currentScript.src.replace(/[^/]*$/, "");   // the js/ folder of the site
  const HOME = "index.html";               // the home page of the page language (fr/ or not)
  const history = [];          // { role: "user" | "assistant", content }
  let faq = null, busy = false;

  const root = document.createElement("div");
  root.className = "chatbot";
  root.innerHTML = `
    <button class="chat-bubble" type="button" aria-expanded="false" aria-controls="chatPanel">
      <span aria-hidden="true">💬</span><span class="chat-bubble-label">${t("Questions?", "Une question ?")}</span></button>
    <section class="chat-panel" id="chatPanel" role="dialog" aria-label="${t("Questions about Pas à Pas FRENCH", "Questions sur Pas à Pas FRENCH")}" hidden>
      <header><div><b>${t("Questions?", "Une question ?")}</b><small>${t("Automatic answers from our site · Olivier replies by email", "Réponses automatiques tirées du site · Olivier répond par e-mail")}</small></div>
        <button type="button" class="chat-close" aria-label="${t("Close", "Fermer")}">×</button></header>
      <div class="chat-log" aria-live="polite"></div>
      <div class="chat-starters"></div>
      <form class="chat-form"><input name="q" type="text" maxlength="800" autocomplete="off" required
        placeholder="${t("Ask about courses, exams, live lessons…", "Posez votre question : examens, cours en direct…")}" aria-label="${t("Your question", "Votre question")}">
        <button class="btn btn-primary mini" type="submit">${t("Send", "Envoyer")}</button></form>
    </section>`;
  document.body.appendChild(root);
  const $c = (s) => root.querySelector(s);
  const log = $c(".chat-log");

  const STARTERS = t(
    ["Where do I start?", "How do the live lessons work?", "How do I pay from Cameroon?", "Which exams can I prepare?"],
    ["Comment se passe un cours en direct ?", "Quels examens puis-je préparer ?", "Comment payer depuis le Cameroun ?", "Comment fonctionnent les formules ?"]);
  $c(".chat-starters").innerHTML = STARTERS.map((s) => `<button type="button" class="chat-chip">${s}</button>`).join("");

  // Plain text from the server: escape it, then turn full links and the email into links.
  const linkify = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
    .replace(/https?:\/\/[^\s<)]+[^\s<).,;:!?]/g, (u) => `<a href="${u}">${u.replace(/^https?:\/\//, "")}</a>`)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+[\w]/g, (m) => `<a href="mailto:${m}">${m}</a>`)
    .replace(/\n/g, "<br>");
  function say(role, html) {
    const p = document.createElement("p");
    p.className = `chat-msg ${role}`;
    p.innerHTML = html;
    log.appendChild(p);
    // a long answer is read from its first line
    log.scrollTop = role === "bot" && p.offsetHeight > log.clientHeight * .6 ? p.offsetTop - 8 : log.scrollHeight;
    return p;
  }

  function open(on) {
    $c(".chat-panel").hidden = !on;
    $c(".chat-bubble").setAttribute("aria-expanded", on);
    root.classList.toggle("open", on);
    if (on && !log.children.length) say("bot", t(
      "Hello! Ask me anything about the courses, exam preparation, live lessons or payment. I answer from the information on this site.",
      "Bonjour ! Posez-moi vos questions sur la préparation aux examens, les cours en direct ou le paiement. Je réponds à partir des informations du site."));
    if (on) $c(".chat-form input").focus();
  }
  $c(".chat-bubble").addEventListener("click", () => open($c(".chat-panel").hidden));
  $c(".chat-close").addEventListener("click", () => open(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$c(".chat-panel").hidden) open(false); });

  // ---- Without the server: the FAQ, the policies and the catalogue prices of the site ----
  // Every answer is a text of the site, quoted as it is; nothing is written here.
  const STOP = new Set(("the and can you for how what with are does that this from have your about which will there when "
    + "les des une est que qui pour avec dans comment quel quelle quels quelles sont pas mon vos votre nous vous faire peut "
    + "puis est-ce estce get got obtenir avoir another other autre veux want need personal personnel personnelle").split(" "));
  // Words of the same meaning count as one (accents already removed).
  const SYN = {};
  [["pay", "payer", "paie", "paye", "paiement", "payment", "paying", "paid", "regler", "reglement", "momo", "mtn", "orange", "money", "mobile", "paypal", "carte", "card"],
   ["price", "prix", "cout", "coute", "couter", "tarif", "cost", "much", "combien", "cher", "expensive", "cheap", "fcfa", "dollar", "usd"],
   ["refund", "rembourse", "remboursement", "rembourser", "retractation", "withdrawal"],
   ["lesson", "lecon", "class", "classe", "seance", "session", "tutor"],
   ["live", "direct", "video", "visio", "zoom"],
   ["exam", "examen", "epreuve", "sujet"],
   ["start", "begin", "beginner", "debut", "debutant", "commencer", "commence", "zero", "novice"],
   ["level", "niveau"],
   ["book", "reserver", "reservation", "booking", "creneau", "slot", "schedule", "horaire"],
   ["cancel", "annuler", "annulation", "reporter", "report", "reschedule", "rescheduling", "deplacer", "move"],
   ["download", "telecharger", "telechargement", "fichier", "file", "delivery", "livraison", "deliver", "receive", "recevoir"],
   ["audio", "ecoute", "listening", "mp3"],
   ["free", "gratuit", "gratuite", "offert"],
   ["plan", "formule", "abonnement", "subscription", "renew", "renouveler", "renouvellement", "forfait"],
   ["account", "compte", "connexion", "login", "password"],
   ["privacy", "donnee", "data", "privee", "confidentialite", "rgpd", "gdpr"],
   ["official", "officiel", "officielle", "certificat", "certificate", "diplome", "attestation"]]
    .forEach((g) => g.forEach((w) => { SYN[w] = g[0]; }));
  const stem = (w) => w.length > 4 ? w.replace(/s$/, "") : w;
  const words = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/).filter((w) => (w.length > 2 || /\d/.test(w)) && !STOP.has(w))
    .map((w) => SYN[w] || SYN[stem(w)] || stem(w));
  const here = (page) => location.pathname.endsWith("/" + page) || (page === HOME && /\/$/.test(location.pathname));
  const url = (page, hash) => new URL(page + (hash ? "#" + hash : ""), location.href).href;
  async function page(name) {
    if (here(name)) return document;
    try { return new DOMParser().parseFromString(await (await fetch(name)).text(), "text/html"); } catch { return null; }
  }
  async function loadFaq() {
    if (faq) return faq;
    const [home, rules] = await Promise.all([page(HOME), page(POLICIES)]);
    const list = [];
    for (const d of home ? home.querySelectorAll("details") : []) {
      const q = d.querySelector("summary")?.textContent.trim() || "";
      const a = [...d.querySelectorAll("p")].map((p) => p.textContent.trim()).join(" ");
      if (q && a) list.push({ q, a, link: url(HOME, "faq"), weight: 1 });
    }
    for (const sec of rules ? rules.querySelectorAll("section[id]") : []) {
      const h = sec.querySelector("h2")?.textContent.trim().replace(/^\d+\.\s*/, "") || "";
      for (const el of sec.querySelectorAll("li, p")) {
        const a = el.textContent.trim().replace(/\s+/g, " ");
        if (a.length < 40) continue;
        const b = el.querySelector("b")?.textContent.trim().replace(/[.:]$/, "");
        list.push({ q: b ? `${h} · ${b}` : h, a, link: url(POLICIES, sec.id), weight: .8 });
      }
    }
    list.forEach((x) => { x.wq = new Set(words(x.q)); x.wa = new Set(words(x.a)); });
    faq = list;
    return faq;
  }
  // The catalogue (js/products.js), loaded on pages that don't have it.
  async function catalogue() {
    if (typeof PRODUCTS !== "undefined") return PRODUCTS;
    await new Promise((ok) => { const s = document.createElement("script"); s.src = SCRIPTS + "products.js"; s.onload = s.onerror = ok; document.head.appendChild(s); });
    return typeof PRODUCTS !== "undefined" ? PRODUCTS : [];
  }
  const xaf = (n) => n.toLocaleString("en-US").replace(/,/g, " ") + " FCFA";
  async function prices(asked) {
    const wanted = asked.filter((w) => w !== "price");
    if (!wanted.length) return "";
    const list = (await catalogue()).filter((p) => !FR || p.kind === "exam" || p.kind === "live");
    const scored = list.map((p) => {
      const w = new Set(words([L(p, "name"), L(p, "contents"), p.exam, p.level, p.kind === "live" ? "lesson live" : "", p.plan ? "plan" : ""].join(" ")));
      return [wanted.filter((x) => w.has(x)).length, p];
    }).filter(([n]) => n > 0);
    if (!scored.length) return "";
    const top = Math.max(...scored.map(([n]) => n));
    const found = scored.filter(([n]) => n === top).slice(0, 5).map(([, p]) => p);
    const where = { exam: "exams", live: "live" }[found[0].kind] || "levels";
    return `${t("From our catalogue", "Dans notre catalogue")} :<br>` + found.map((p) => `• <b>${L(p, "name")}</b> : $${p.usd} · ${xaf(p.xaf)}`
      + (p.ready === false ? (p.preorder ? t(" (pre-order)", " (précommande)") : t(" (in preparation)", " (en préparation)")) : "")).join("<br>")
      + `<br>${linkify(t("See the offers: ", "Voir les offres : ") + url(HOME, FR && where === "levels" ? "" : where))}`;
  }
  const short = (s) => s.length <= 650 ? s : s.slice(0, 600).replace(/[^.!?]*$/, "") + " …";
  async function fromFaq(question) {
    const asked = [...new Set(words(question))];
    if (asked.includes("price")) { const p = await prices(asked); if (p) return p; }
    const list = await loadFaq();
    const idf = (w) => Math.log((list.length + 1) / (1 + list.filter((x) => x.wq.has(w) || x.wa.has(w)).length));
    const ranked = list.map((x) => [x.weight * asked.reduce((n, w) => n + idf(w) * (x.wq.has(w) ? 3 : x.wa.has(w) ? 1 : 0), 0), x])
      .filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]);
    if (!ranked.length || ranked[0][0] < 2) return linkify(t(`I couldn't find that on the site. Write to ${CONTACT}: Olivier reads every message.`,
      `Je n'ai pas trouvé la réponse sur le site. Écrivez à ${CONTACT} : Olivier lit chaque message.`));
    const [top, best] = ranked[0];
    const also = ranked.slice(1).filter(([s, x]) => s >= top * .6 && x.q !== best.q).map(([, x]) => x.q)
      .filter((q, i, a) => a.indexOf(q) === i).slice(0, 2);
    const more = best.a.length > 650 || best.link.includes(POLICIES);
    return `<b>${linkify(best.q)}</b><br>${linkify(short(best.a))}`
      + (more ? `<br>${linkify(t("Read more: ", "Lire la suite : ") + best.link)}` : "")
      + (also.length ? `<span class="chat-also">${t("See also", "Voir aussi")} :${also.map((q) => `<button type="button" class="chat-chip">${linkify(q)}</button>`).join("")}</span>` : "");
  }

  async function ask(question) {
    if (busy || !question.trim()) return;
    busy = true;
    $c(".chat-starters").hidden = true;
    say("user", linkify(question));
    history.push({ role: "user", content: question });
    const wait = say("bot wait", `<span class="dots"><i></i><i></i><i></i></span>`);
    let html = "";
    try {
      if (!PAY_API) throw new Error("no server");
      const r = await fetch(`${PAY_API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: LANG, messages: history.slice(-12) }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.reply) { history.push({ role: "assistant", content: d.reply }); html = linkify(d.reply); }
      else if (r.status === 429 && d.error) html = linkify(d.error);
      else throw new Error(String(r.status));
    } catch {
      history.pop();                              // the server never saw it: keep the history clean
      html = await fromFaq(question);
    }
    wait.remove();
    say("bot", html);
    busy = false;
  }
  $c(".chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $c(".chat-form input");
    const q = input.value;
    input.value = "";
    ask(q);
  });
  root.addEventListener("click", (e) => { const b = e.target.closest(".chat-chip"); if (b) ask(b.textContent); });
})();
