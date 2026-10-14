// Catalogue. Base prices in euros; the page converts them to the visitor's currency.
// Titles, module lists and prices are examples: replace them with your real content.

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];

// Each level is a course made of modules. Modules sell one by one, or the whole level at a discount.
const LEVEL_COURSES = {
  A0: { name: "Discovery", hue: 190, modulePrice: 5, lessons: 5,
    can: "Never studied French? Start here: the sounds of French, greetings and your first 200 words.",
    modules: ["Sounds & the alphabet", "Greetings & introductions", "Numbers, dates & time", "Survival phrases"] },
  A1: { name: "Beginner", hue: 210, modulePrice: 7, lessons: 6,
    can: "Introduce yourself, ask simple questions and handle everyday situations.",
    modules: ["Être, avoir & articles", "Family & describing people", "Daily routine (present tense)", "Food & shopping", "Town & directions", "Plans & the near future"] },
  A2: { name: "Elementary", hue: 225, modulePrice: 7, lessons: 6,
    can: "Talk about past events, travel and handle routine tasks at work or school.",
    modules: ["The passé composé", "Imparfait or passé composé?", "Travel & transport", "Health & the body", "Object pronouns", "Comparisons & the future"] },
  B1: { name: "Intermediate", hue: 245, modulePrice: 9, lessons: 7,
    can: "Give opinions, tell stories and work or study in French with some support.",
    modules: ["Expressing opinions", "Subjunctive essentials", "Conditional & hypotheses", "Relative pronouns: qui, que, dont, où", "Work & studies", "Letters & short essays"] },
  B2: { name: "Upper-intermediate", hue: 265, modulePrice: 9, lessons: 7,
    can: "Argue a point, follow the news and write clear, structured texts.",
    modules: ["Argument & connectors", "Advanced subjunctive", "Reported speech", "Passive voice & nominalisation", "Media & current affairs", "Formal writing & synthesis"] },
  C1: { name: "Advanced", hue: 330, modulePrice: 12, lessons: 8,
    can: "Use French flexibly for academic and professional purposes, with nuance.",
    modules: ["Nuance & register", "Complex sentence structures", "Academic writing", "Presentations & debate", "Idioms & culture"] },
  C2: { name: "Mastery", hue: 350, modulePrice: 12, lessons: 8,
    can: "Understand virtually everything and express yourself with precision and style.",
    modules: ["Style & rhetoric", "Literary texts", "Professional & legal French", "Synthesis & critical review", "Mastering spoken French"] },
};
const LEVEL_DISCOUNT = 0.30; // whole level vs. buying every module

// Exam papers in the official format (original mock papers, not copies of official exams).
const EXAMS = [
  { code: "DELF A1", family: "DELF", levels: ["A1"], price: 15, sets: 4 },
  { code: "DELF A2", family: "DELF", levels: ["A2"], price: 15, sets: 4 },
  { code: "DELF B1", family: "DELF", levels: ["B1"], price: 19, sets: 4, best: true },
  { code: "DELF B2", family: "DELF", levels: ["B2"], price: 19, sets: 4, best: true },
  { code: "DALF C1", family: "DALF", levels: ["C1"], price: 25, sets: 3 },
  { code: "DALF C2", family: "DALF", levels: ["C2"], price: 25, sets: 3 },
  { code: "TCF Tout public", family: "TCF", levels: ["A1", "A2", "B1", "B2", "C1", "C2"], price: 22, sets: 4 },
  { code: "TCF Canada", family: "TCF", levels: ["A1", "A2", "B1", "B2", "C1", "C2"], price: 25, sets: 4, best: true },
];
const EXAM_HUES = { DELF: 205, DALF: 280, TCF: 4 };
const EXAM_NOTES = {
  DELF: "Listening, reading, writing and speaking, timed like the real exam, with marking grids out of 100.",
  DALF: "Long listening and reading documents, synthesis and argued essay, with model answers.",
  TCF: "Multiple-choice listening, reading and language sections, plus writing and speaking tasks, with a score-to-level table.",
};

const PRACTICE_PRICES = { A0: 4, A1: 6, A2: 6, B1: 8, B2: 8, C1: 10, C2: 10 };

// ---- Build one flat product list from the definitions above ----
const PRODUCTS = [];
for (const lvl of LEVELS) {
  const c = LEVEL_COURSES[lvl];
  const full = c.modulePrice * c.modules.length;
  PRODUCTS.push({
    id: `level-${lvl}`, type: "level", level: lvl, hue: c.hue,
    name: `${lvl} ${c.name}: full level`, price: Math.round(full * (1 - LEVEL_DISCOUNT)), old: full,
    size: `${c.modules.length} modules · ${c.modules.length * c.lessons} lessons`, desc: c.can,
  });
  c.modules.forEach((title, i) => PRODUCTS.push({
    id: `mod-${lvl}-${i + 1}`, type: "module", level: lvl, hue: c.hue, num: i + 1,
    name: `${lvl} · Module ${i + 1}: ${title}`, short: title, price: c.modulePrice,
    size: `${c.lessons} lessons · video, PDF, audio & quiz`,
    desc: `Module ${i + 1} of the ${lvl} ${c.name} course. ${c.lessons} lessons explained in English, with exercises and a final quiz.`,
  }));
}
for (const e of EXAMS) {
  PRODUCTS.push({
    id: `exam-${e.code.toLowerCase().replace(/\s+/g, "-")}`, type: "exam", family: e.family, levels: e.levels,
    level: e.levels[0], hue: EXAM_HUES[e.family], best: e.best,
    name: `${e.code} exam papers`, price: e.price,
    size: `${e.sets} complete papers · audio · answer keys`, desc: EXAM_NOTES[e.family],
  });
}
for (const lvl of LEVELS) {
  PRODUCTS.push({
    id: `practice-${lvl}`, type: "practice", level: lvl, hue: LEVEL_COURSES[lvl].hue,
    name: `${lvl} practice tests`, price: PRACTICE_PRICES[lvl],
    size: "10 short tests · answers explained",
    desc: `Simple training papers for level ${lvl}: 20-minute tests mixing listening, reading, grammar and vocabulary, each with explained answers in English.`,
  });
}
