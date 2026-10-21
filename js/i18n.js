// ====== Language: English (index.html) or French (fr/index.html) ======
// The French site is for French speakers: exam preparation and live lessons. The page's own
// <html lang> decides; every script reads t("English", "Français") and L(product, "name").
// The visitor's choice (FR / EN button) is remembered; without one, the home page follows the
// language of the device (inline script in the <head> of index.html).
const LANG = document.documentElement.lang === "fr" ? "fr" : "en";
const FR = LANG === "fr";
const t = (en, fr) => (FR ? fr : en);
// A product's name, contents or description in the page language (products.js: p.fr).
const L = (p, k) => (FR && p.fr && p.fr[k]) || p[k];
// The policies page of the page language.
const POLICIES = t("policies.html", "conditions.html");

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-lang]");
  if (!a) return;
  try { localStorage.setItem("pap-lang", a.dataset.lang); } catch { /* storage unavailable */ }
});
