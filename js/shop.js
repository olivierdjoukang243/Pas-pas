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
