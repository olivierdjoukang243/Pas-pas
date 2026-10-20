// ====== Shop settings: fill in once confirmed. Empty values stay hidden on the pages. ======
// Read by the shop (index.html) and the policies (policies.html).
const SHOP = {
  email: "hello@pasapasfrench.com", // contact address (Cloudflare Email Routing to Gmail)
  whatsapp: "",       // international format without "+", e.g. 2376XXXXXXXX
  api: "",            // booking, payment and email server, e.g. "https://api.pasapasfrench.com"
  // Seller identity shown in the policies (required by consumer law in many countries).
  // Since 18/10/2026 the seller is Olivier Djoukang in his own name: Notch Pay only opens
  // merchant accounts to individuals living in French-speaking Africa.
  seller: {
    name: "Olivier Djoukang",
    status: "a self-employed French teacher",
    address: "Dschang, Cameroon",
  },
};

// Local test of the payment server (atelier: serveur/serveur.py, Notch Pay sandbox). Only when
// the site is opened from Olivier's own computer, without ?demo, and while SHOP.api is empty:
// the published site never calls 127.0.0.1. Used by the payment (checkout and return), the stock
// check ("Coming soon") and the free module. ?api=en-ligne (remembered in this browser, ?api=local
// to undo) tests the hosted server from the local copy of the site, in sandbox.
const LOCAL_SITE = ["127.0.0.1", "localhost"].includes(location.hostname);
const LOCAL_API = (() => {
  if (!LOCAL_SITE) return "";
  const asked = new URLSearchParams(location.search).get("api");
  try { if (asked) localStorage.setItem("pap-api", asked); return localStorage.getItem("pap-api") || ""; }
  catch { return asked || ""; }
})();
const PAY_API = SHOP.api || (LOCAL_SITE && !/[?&]demo\b/.test(location.search)
  ? (LOCAL_API === "en-ligne" ? "https://api.pasapasfrench.com" : "http://127.0.0.1:8767") : "");
