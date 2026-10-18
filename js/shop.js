// ====== Shop settings: fill in once confirmed. Empty values stay hidden on the pages. ======
// Read by the shop (index.html) and the policies (policies.html).
const SHOP = {
  email: "",          // contact address: the Gmail alias, created at hosting time
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
// the published site never calls 127.0.0.1. Only the payment uses it (checkout and return).
const PAY_API = SHOP.api || (["127.0.0.1", "localhost"].includes(location.hostname)
  && !/[?&]demo\b/.test(location.search) ? "http://127.0.0.1:8767" : "");
