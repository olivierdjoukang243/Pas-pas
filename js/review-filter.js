// ====== Automatic review filter ======
// Reviews are published without anyone reading them first. This filter is the only check,
// and it looks at the WORDING, never at the rating: a 1-star review that passes is published
// exactly like a 5-star one. Suppressing reviews because they are negative is forbidden
// (US FTC rule on consumer reviews, 2024; EU Omnibus directive) and breaks Google's rules.
//
// The same file runs in the browser (to tell the learner what to fix before sending)
// and on the server (the decision that counts): reviewProblems(review) -> [] when publishable.

const REVIEW_RULES = {
  minLength: 20,
  maxLength: 1200,
  // Insults and obscenities, English and French. Matched as whole words, accents ignored.
  banned: ["fuck", "fucking", "shit", "bitch", "bastard", "asshole", "dickhead", "cunt", "whore", "slut", "retard",
    "nigger", "faggot", "merde", "putain", "connard", "connasse", "salope", "encule", "batard", "pute", "nique", "fdp", "ntm"],
};

function reviewProblems(r) {
  const out = [];
  const text = String(r.text || "").trim();
  const flat = text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) out.push("Choose a rating from 1 to 5 stars.");
  if (text.length < REVIEW_RULES.minLength) out.push(`Write at least ${REVIEW_RULES.minLength} characters.`);
  if (text.length > REVIEW_RULES.maxLength) out.push(`Keep it under ${REVIEW_RULES.maxLength} characters.`);
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|fr|cm|io|co)\b)/i.test(text)) out.push("Remove the links: reviews cannot contain web addresses.");
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)) out.push("Remove the email address: reviews cannot contain contact details.");
  if (/(\+?\d[\d\s.-]{7,}\d)/.test(text)) out.push("Remove the phone number: reviews cannot contain contact details.");
  if (REVIEW_RULES.banned.some((w) => new RegExp(`\\b${w}\\b`).test(flat))) out.push("Remove the insulting words. Criticism is welcome; insults are not published.");
  const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length > 30 && letters === letters.toUpperCase()) out.push("Please don't write the whole review in capitals.");
  if (!String(r.name || "").trim() || String(r.name).length > 40 || /\d|@/.test(r.name)) out.push("Give your first name only (it is shown with the review).");
  if (!r.consent) out.push("Tick the box to agree to the publication of your review.");
  return out;
}

if (typeof module !== "undefined") module.exports = { reviewProblems, REVIEW_RULES };
