// ====== Shop settings: fill in once confirmed. Empty values stay hidden on the pages. ======
// Read by the shop (index.html) and the policies (policies.html).
const SHOP = {
  email: "",          // contact address: the Gmail alias, created at hosting time
  whatsapp: "",       // international format without "+", e.g. 2376XXXXXXXX
  api: "",            // booking, payment and email server, e.g. "https://api.pasapasfrench.com"
  // Seller identity shown in the policies (required by consumer law in many countries).
  // The EIN and the state filing number are not published: no law asks for them on the site.
  seller: {
    name: "Nuvalex LLC",
    status: "a limited liability company registered in Wyoming, USA",
    address: "30 N Gould St, Ste R, Sheridan, WY 82801, United States",
    manager: "Olivier Djoukang",
  },
};
