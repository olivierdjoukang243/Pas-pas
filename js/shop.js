// ====== Shop settings: fill in once confirmed. Empty values stay hidden on the pages. ======
// Read by the shop (index.html) and the policies (policies.html).
const SHOP = {
  email: "hello@pasapasfrench.com", // contact address (Cloudflare Email Routing to Gmail)
  whatsapp: "",       // international format without "+", e.g. 2376XXXXXXXX
  api: "",            // booking and reviews server (not built yet), e.g. "https://api.pasapasfrench.com"
  pay: "https://api.pasapasfrench.com", // payment, delivery, stock and free module (serveur.py, hosted)
  // Seller identity shown in the policies (required by consumer law in many countries).
  // Since 18/10/2026 the seller is Olivier Djoukang in his own name: Notch Pay only opens
  // merchant accounts to individuals living in French-speaking Africa.
  seller: {
    name: "Olivier Djoukang",
    status: "a self-employed French teacher",
    address: "Dschang, Cameroon",
  },
};

// The payment server. Published site: SHOP.pay. Opened from Olivier's own computer: the local
// server (atelier: serveur/serveur.py, http://127.0.0.1:8767), or the hosted one with ?api=en-ligne
// (remembered in this browser; ?api=local to undo); ?demo pays nothing. Used by the payment
// (checkout and return), the stock check ("Coming soon") and the free module.
const LOCAL_SITE = ["127.0.0.1", "localhost"].includes(location.hostname);
const LOCAL_API = (() => {
  if (!LOCAL_SITE) return "";
  const asked = new URLSearchParams(location.search).get("api");
  try { if (asked) localStorage.setItem("pap-api", asked); return localStorage.getItem("pap-api") || ""; }
  catch { return asked || ""; }
})();
const PAY_API = /[?&]demo\b/.test(location.search) ? ""
  : !LOCAL_SITE ? (SHOP.pay || SHOP.api)
  : LOCAL_API === "en-ligne" ? "https://api.pasapasfrench.com" : "http://127.0.0.1:8767";
