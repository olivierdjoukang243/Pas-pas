// ====== The site assistant: the "Questions?" bubble ======
// The server (chat.py) answers from the site's own texts only: FAQ, policies, catalogue,
// modules, exam formats. It never teaches and never invents a price; anything else goes to
// hello@ or a live lesson. If the server can't answer (no key yet, offline, limit reached),
// the bubble looks for the closest question in the FAQ of the page language.
(() => {
  const CONTACT = "hello@pasapasfrench.com";
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
    log.scrollTop = log.scrollHeight;
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

  // ---- FAQ fallback: the questions of this page, or of the home page of the language ----
  const STOP = new Set(("the and can you for how what with are does that this from have your about which will there when "
    + "les des une est que qui pour avec dans comment quel quelle quels sont pas mon vos votre nous vous faire peut").split(" "));
  const words = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(?<=...)s$/, ""));
  async function loadFaq() {
    if (faq) return faq;
    let doc = document;
    if (!document.querySelector("details summary")) {
      try { doc = new DOMParser().parseFromString(await (await fetch(HOME)).text(), "text/html"); } catch { doc = document; }
    }
    faq = [...doc.querySelectorAll("details")].map((d) => {
      const q = d.querySelector("summary")?.textContent.trim() || "";
      const a = [...d.querySelectorAll("p")].map((p) => p.textContent.trim()).join(" ");
      return { q, a, wq: new Set(words(q)), wa: new Set(words(a)) };
    }).filter((x) => x.q && x.a);
    return faq;
  }
  // The closest FAQ question: rare words count more, and a word of the question itself three times.
  async function fromFaq(question) {
    const list = await loadFaq(), asked = [...new Set(words(question))];
    const idf = (w) => Math.log((list.length + 1) / (1 + list.filter((x) => x.wq.has(w) || x.wa.has(w)).length));
    let best = null, score = 0;
    for (const x of list) {
      const s = asked.reduce((n, w) => n + idf(w) * (x.wq.has(w) ? 3 : x.wa.has(w) ? 1 : 0), 0);
      if (s > score) { best = x; score = s; }
    }
    if (best && score >= 2) return `${t("From our FAQ", "Dans notre FAQ")} · <b>${linkify(best.q)}</b><br>${linkify(best.a)}`;
    return linkify(t(`I couldn't find that on the site. Write to ${CONTACT}: Olivier reads every message.`,
      `Je n'ai pas trouvé la réponse sur le site. Écrivez à ${CONTACT} : Olivier lit chaque message.`));
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
  $c(".chat-starters").addEventListener("click", (e) => { const b = e.target.closest(".chat-chip"); if (b) ask(b.textContent); });
})();
