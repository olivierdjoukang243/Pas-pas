// Pas à Pas catalogue. Facts confirmed by Olivier on 14/10/2026: 11 products,
// 56 modules and 7 level checks from A0 to B1; 28/10/2026: B2 and C1 open (88 modules and
// 11 level checks from A0 to C1), prices chosen for Olivier. Prices are set in both currencies
// (they are not converted). Never add a module title, product or price that is not confirmed.

const LEVELS = [
  { code: "A0", name: "Introduction", hue: 190, status: "open" },
  { code: "A1", name: "Beginner 1", hue: 210, status: "open" },
  { code: "A2", name: "Beginner 2", hue: 228, status: "open" },
  { code: "B1", name: "Intermediate 1", hue: 248, status: "open" },
  { code: "B2", name: "Intermediate 2", hue: 272, status: "open" },
  { code: "C1", name: "Advanced 1", hue: 330, status: "open" },
  { code: "C2", name: "Advanced 2", hue: 350, status: "prep", note: "In preparation and not available yet." },
];

const LEVEL_INTRO = {
  A0: "From the alphabet to your first conversation, with every instruction in English.",
  A1: "From single sentences to real conversations. Instructions switch to French, but grammar is still explained in English.",
  A2: "The level where you stop translating in your head.",
  B1: "The level where French starts to feel like your own, with objectives and section introductions in French too.",
  B2: "The level where you explain, argue and write at length, with ease and nuance.",
  C1: "Advanced French for study and work: precise, flexible and natural.",
};

// kind: "part" (8 modules + level check), "level" (both parts), "method" (everything).
// ready: false = not deliverable yet. With preorder: true it can be pre-ordered: paid now,
// sent as soon as it is ready, cancellable with a full refund until then (policies, 2-3).
// Without preorder it is shown as "In preparation" and cannot be bought.
// Olivier, 15/10/2026: the products without their illustrations wait for them (A1 Part 2,
// A2, B1, and the packs that contain them); 16/10/2026: they open to pre-order. Set ready
// back to true (or remove it) as each one is illustrated.
// 25/10/2026: B1 and the Complete Method are illustrated and in stock on the server: on sale.
const PRODUCTS = [
  { id: "a0-complete", level: "A0", kind: "level", name: "French Introduction (A0)", contents: "8 modules + progress test", usd: 19, xaf: 10400,
    desc: "Start French from zero and reach your first conversation in eight modules. You'll learn to introduce yourself, use numbers, describe people and places, ask questions, use the present tense, tell the time, order in a café and talk about your day. The classic traps for English speakers are explained the moment they come up, from tu and vous to silent endings and je suis Paul versus je m'appelle Paul. A final progress test tells you whether you're ready for A1 or should review first." },
  { id: "a1-part1", level: "A1", kind: "part", part: 1, name: "French Beginner 1 (A1) — Part 1", contents: "Modules 1–8 + progress test", usd: 29, xaf: 15900,
    desc: "The first half of A1, where you move from single sentences to real conversations. You'll talk about the past with the passé composé, make plans, give opinions and preferences, shop and talk about quantities, give directions, and describe your home and daily routine. A progress test at the end prepares you for Part 2." },
  { id: "a1-part2", level: "A1", kind: "part", part: 2, name: "French Beginner 1 (A1) — Part 2", contents: "Modules 9–16 + progress test", usd: 29, xaf: 15900,
    desc: "The second half of A1, where your French starts to sound natural. You'll cover reflexive verbs, the imperative, comparisons, weather and seasons, health and the body, travel and transport, and the pronouns that save you from repeating nouns. The A1 progress test at the end shows whether you're ready for A2." },
  { id: "a1-complete", level: "A1", kind: "level", name: "French Beginner 1 (A1) — Full Level", contents: "Parts 1 and 2 · 16 modules + 2 progress tests", usd: 49, xaf: 26900,
    desc: "Both halves of A1 in one purchase, for less than buying them separately. Sixteen modules and two progress tests take you from your first past tense to the pronouns that make you sound less like a textbook." },
  { id: "a2-part1", level: "A2", kind: "part", part: 1, name: "French Beginner 2 (A2) — Part 1", contents: "Modules 1–8 + progress test", usd: 29, xaf: 15900,
    desc: "The first half of A2 covers past participle agreement, double pronouns, the plus-que-parfait, qui and que, où and dont, si + imparfait, and the subjunctive, from how to form it to when to use it. A progress test at the end prepares you for Part 2." },
  { id: "a2-part2", level: "A2", kind: "part", part: 2, name: "French Beginner 2 (A2) — Part 2", contents: "Modules 9–16 + progress test", usd: 29, xaf: 15900,
    desc: "The second half of A2 covers the gérondif, demonstratives and possessives, cause and consequence, purpose and opposition, reported speech in the present and the past, the passive voice and the futur antérieur. It finishes with the A2 progress test." },
  { id: "a2-complete", level: "A2", kind: "level", name: "French Beginner 2 (A2) — Full Level", contents: "Parts 1 and 2 · 16 modules + 2 progress tests", usd: 49, xaf: 26900,
    desc: "The full A2 level in one purchase: sixteen modules and two progress tests, for less than buying the two parts separately." },
  { id: "b1-part1", level: "B1", kind: "part", part: 1, name: "French Intermediate 1 (B1) — Part 1", contents: "Modules 1–8 + progress test", usd: 29, xaf: 15900,
    desc: "The first half of B1 covers compound relative pronouns, the past conditional, the past subjunctive, the present participle, se faire + infinitive, emphasis, indefinites, and the passé simple for reading. From B1, objectives and section introductions are in French too, and the page \"Ce qui change au B1\" walks you through the switch." },
  { id: "b1-part2", level: "B1", kind: "part", part: 2, name: "French Intermediate 1 (B1) — Part 2", contents: "Modules 9–16 + progress test", usd: 29, xaf: 15900,
    desc: "The second half of B1 teaches you to make a case and express shades of meaning. It covers concession and opposition, hypotheses, formal and informal registers, professional writing, debating an idea, and the linking words that hold a long answer together. It ends with the B1 progress test. B1 is the level most exams and employers ask for." },
  { id: "b1-complete", level: "B1", kind: "level", name: "French Intermediate 1 (B1) — Full Level", contents: "Parts 1 and 2 · 16 modules + 2 progress tests", usd: 49, xaf: 26900,
    desc: "The full B1 level in one purchase: sixteen modules and two progress tests, for less than buying the two parts separately. This is the level that lets you work, study and debate in French." },
  { id: "b2-part1", level: "B2", kind: "part", part: 1, name: "French Intermediate 2 (B2) — Part 1", contents: "Modules 1–8 + progress test", usd: 35, xaf: 19100,
    desc: "The first half of B2, in eight modules and a progress test. Built like the rest of the method: grammar explained step by step, exercises with full answer keys, and a recorded dialogue and dictation in every module." },
  { id: "b2-part2", level: "B2", kind: "part", part: 2, name: "French Intermediate 2 (B2) — Part 2", contents: "Modules 9–16 + progress test", usd: 35, xaf: 19100,
    desc: "The second half of B2, in eight modules and a progress test that tells you when you're ready for C1. Built like the rest of the method: grammar explained step by step, exercises with full answer keys, and a recorded dialogue and dictation in every module." },
  { id: "b2-complete", level: "B2", kind: "level", name: "French Intermediate 2 (B2) — Full Level", contents: "Parts 1 and 2 · 16 modules + 2 progress tests", usd: 59, xaf: 32300,
    desc: "The full B2 level in one purchase: sixteen modules and two progress tests, for less than buying the two parts separately. B2 is the level many universities and employers ask for." },
  { id: "c1-part1", level: "C1", kind: "part", part: 1, name: "French Advanced 1 (C1) — Part 1", contents: "Modules 1–8 + progress test", usd: 39, xaf: 21300,
    desc: "The first half of C1, in eight modules and a progress test. Built like the rest of the method: grammar explained step by step, exercises with full answer keys, and a recorded dialogue and dictation in every module." },
  { id: "c1-part2", level: "C1", kind: "part", part: 2, name: "French Advanced 1 (C1) — Part 2", contents: "Modules 9–16 + progress test", usd: 39, xaf: 21300,
    desc: "The second half of C1, in eight modules and a progress test. Built like the rest of the method: grammar explained step by step, exercises with full answer keys, and a recorded dialogue and dictation in every module." },
  { id: "c1-complete", level: "C1", kind: "level", name: "French Advanced 1 (C1) — Full Level", contents: "Parts 1 and 2 · 16 modules + 2 progress tests", usd: 65, xaf: 35600,
    desc: "The full C1 level in one purchase: sixteen modules and two progress tests, for less than buying the two parts separately." },
  { id: "complete-method", level: "A0–B1", kind: "method", name: "Pas à Pas — The Complete Method (Introduction to Intermediate)", contents: "56 modules + 7 progress tests", usd: 129, xaf: 70800,
    desc: "Everything in one place: 56 modules and 7 progress tests, from the alphabet to defending your point of view in French. All four levels follow one method, with the same characters and the same way of explaining, so you never have to adjust to a new approach halfway through. The files are yours to keep, updates included." },
];

// Exam packs: series of 6 complete papers produced by the workshop (delf.py, tcf.py, series.py),
// delivered by livrer.py. The format shown on each card comes from js/exam-formats.js, written
// by the workshop from its norm (delf.py --site), never typed here. ready: false until the
// workshop has produced a series; until then the packs are pre-ordered. DALF C1 and C2 have
// no price yet: they stay "coming soon".
const DELF_DESC = (lvl) => `Six complete ${lvl} practice tests in the current official format, with no task repeated across them. Each one covers listening, reading, writing and speaking. You also get a marking guide with the answers, transcripts and scoring grids, and a timed online version that works just like the real exam. Each section has its own timer, each recording plays only as many times as it would on the day, and your listening and reading are scored out of 25 when you finish.`;
const EXAM_PACKS = [
  { id: "delf-a1", kind: "exam", level: "DELF", exam: "DELF A1", format: ["delf", "A1"], ready: false, preorder: true, name: "DELF A1 — 6 Practice Tests", contents: "6 complete tests · all four skills · revision guide · audio included", usd: 19, xaf: 10400, desc: DELF_DESC("DELF A1") },
  { id: "delf-a2", kind: "exam", level: "DELF", exam: "DELF A2", format: ["delf", "A2"], ready: false, preorder: true, name: "DELF A2 — 6 Practice Tests", contents: "6 complete tests · all four skills · revision guide · audio included", usd: 19, xaf: 10400, desc: DELF_DESC("DELF A2") },
  { id: "delf-b1", kind: "exam", level: "DELF", exam: "DELF B1", format: ["delf", "B1"], ready: false, preorder: true, name: "DELF B1 — 6 Practice Tests", contents: "6 complete tests · all four skills · revision guide · audio included", usd: 25, xaf: 13700, desc: DELF_DESC("DELF B1") },
  { id: "delf-b2", kind: "exam", level: "DELF", exam: "DELF B2", format: ["delf", "B2"], ready: false, preorder: true, name: "DELF B2 — 6 Practice Tests", contents: "6 complete tests · all four skills · revision guide · audio included", usd: 25, xaf: 13700, desc: DELF_DESC("DELF B2") },
  { id: "tcf-canada", kind: "exam", level: "TCF", exam: "TCF Canada", format: ["tcf", "tcf-canada"], ready: false, preorder: true, name: "TCF Canada — 6 Practice Tests", contents: "6 complete tests, A1 to C2 · all four skills · revision guide · audio included", usd: 29, xaf: 15900,
    desc: "Six complete TCF Canada practice tests in the official format, with no question repeated across them. Each test has 39 listening and 39 reading questions that rise from A1 to C2, plus the three writing tasks and the three speaking tasks. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level and gives you an NCLC estimate." },
  { id: "tcf-quebec", kind: "exam", level: "TCF", exam: "TCF Québec", format: ["tcf", "tcf-quebec"], ready: false, preorder: true, name: "TCF Québec — 6 Practice Tests", contents: "6 complete tests, A1 to C2 · all four skills · revision guide · audio included", usd: 29, xaf: 15900,
    desc: "Six complete TCF Québec practice tests in the official format, with no question repeated across them. Each test has 29 listening and 29 reading questions that rise from A1 to C2, plus the three writing tasks and the three speaking tasks. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level." },
  { id: "tcf-tp", kind: "exam", level: "TCF", exam: "TCF tout public", format: ["tcf", "tcf-tp"], ready: false, preorder: true, name: "TCF tout public — 6 Practice Tests", contents: "6 complete tests, A1 to C2 · five sections · revision guide · audio included", usd: 29, xaf: 15900,
    desc: "Six complete TCF tout public practice tests in the official format, with no question repeated across them. Each test has 29 listening, 18 language structure and 29 reading questions that rise from A1 to C2, plus the optional writing and speaking tasks. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level." },
  { id: "tcf-dap", kind: "exam", level: "TCF", exam: "TCF DAP", format: ["tcf", "tcf-dap"], ready: false, preorder: true, name: "TCF DAP — 6 Practice Tests", contents: "6 complete tests, A1 to C2 · five sections · revision guide · audio included", usd: 29, xaf: 15900,
    desc: "Six complete TCF DAP practice tests in the official format, with no question repeated across them. Each test has 29 listening, 18 language structure and 29 reading questions that rise from A1 to C2, plus the required writing tasks and the optional speaking tasks. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level." },
  { id: "tcf-irn", kind: "exam", level: "TCF", exam: "TCF IRN", format: ["tcf", "tcf-irn"], ready: false, preorder: true, name: "TCF IRN — 6 Practice Tests", contents: "6 complete tests · all four skills · revision guide · audio included", usd: 29, xaf: 15900,
    desc: "Six complete TCF IRN practice tests in the official format, with no question repeated across them. Each test has 25 listening and 25 reading questions of increasing difficulty, plus the three writing tasks and the three speaking tasks, all with no preparation time. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level." },
];
const EXAMS_SOON = [
  { name: "DALF C1", format: ["dalf", "C1"], levels: "Advanced diploma · C1", note: "The diploma for university study and professional work. Practice tests in the current official format are on the way." },
  { name: "DALF C2", format: ["dalf", "C2"], levels: "Advanced diploma · C2", note: "The highest French-language diploma. Practice tests in the current official format are on the way." },
];
// French site (fr/index.html): names and texts in French, same products and prices.
const DELF_DESC_FR = (lvl) => `Six sujets complets du ${lvl} au format officiel actuel, sans aucune tâche répétée d'un sujet à l'autre. Chacun couvre la compréhension de l'oral, la compréhension des écrits, la production écrite et la production orale. Vous recevez aussi un guide de correction avec les réponses, les transcriptions et les grilles d'évaluation, et une version en ligne chronométrée qui se passe comme le vrai examen : chaque épreuve a son minuteur, chaque enregistrement ne s'écoute que le nombre de fois prévu le jour J, et la compréhension de l'oral et des écrits est notée sur 25 à la fin.`;
const TCF_DESC_FR = (exam, co, st, ce, prods) => `Six sujets complets du ${exam} au format officiel, sans aucune question répétée d'un sujet à l'autre. Chaque sujet comprend ${co} questions de compréhension orale${st ? `, ${st} de structures de la langue` : ""} et ${ce} de compréhension écrite, de difficulté croissante, plus ${prods}. Vous recevez un guide de correction qui indique le niveau de chaque question, et une version en ligne chronométrée qui se passe comme le vrai test. À la fin, elle compte vos bonnes réponses niveau par niveau.`;
const EXAM_FR = {
  "delf-a1": { name: "DELF A1 — 6 sujets d'entraînement", contents: "6 sujets complets · les quatre compétences · guide de révision · audio inclus", desc: DELF_DESC_FR("DELF A1") },
  "delf-a2": { name: "DELF A2 — 6 sujets d'entraînement", contents: "6 sujets complets · les quatre compétences · guide de révision · audio inclus", desc: DELF_DESC_FR("DELF A2") },
  "delf-b1": { name: "DELF B1 — 6 sujets d'entraînement", contents: "6 sujets complets · les quatre compétences · guide de révision · audio inclus", desc: DELF_DESC_FR("DELF B1") },
  "delf-b2": { name: "DELF B2 — 6 sujets d'entraînement", contents: "6 sujets complets · les quatre compétences · guide de révision · audio inclus", desc: DELF_DESC_FR("DELF B2") },
  "tcf-canada": { name: "TCF Canada — 6 sujets d'entraînement", contents: "6 sujets complets, de A1 à C2 · les quatre compétences · guide de révision · audio inclus",
    desc: TCF_DESC_FR("TCF Canada", 39, 0, 39, "les trois tâches d'expression écrite et les trois tâches d'expression orale").replace("niveau par niveau.", "niveau par niveau et vous donne une estimation NCLC.") },
  "tcf-quebec": { name: "TCF Québec — 6 sujets d'entraînement", contents: "6 sujets complets, de A1 à C2 · les quatre compétences · guide de révision · audio inclus",
    desc: TCF_DESC_FR("TCF Québec", 29, 0, 29, "les trois tâches d'expression écrite et les trois tâches d'expression orale") },
  "tcf-tp": { name: "TCF tout public — 6 sujets d'entraînement", contents: "6 sujets complets, de A1 à C2 · cinq épreuves · guide de révision · audio inclus",
    desc: TCF_DESC_FR("TCF tout public", 29, 18, 29, "les épreuves facultatives d'expression écrite et orale") },
  "tcf-dap": { name: "TCF DAP — 6 sujets d'entraînement", contents: "6 sujets complets, de A1 à C2 · cinq épreuves · guide de révision · audio inclus",
    desc: TCF_DESC_FR("TCF DAP", 29, 18, 29, "l'expression écrite obligatoire et l'expression orale facultative") },
  "tcf-irn": { name: "TCF IRN — 6 sujets d'entraînement", contents: "6 sujets complets · les quatre compétences · guide de révision · audio inclus",
    desc: TCF_DESC_FR("TCF IRN", 25, 0, 25, "les trois tâches d'expression écrite et les trois tâches d'expression orale, toutes sans préparation") },
};
EXAM_PACKS.forEach((p) => { p.fr = EXAM_FR[p.id]; });
EXAMS_SOON[0].fr = { levels: "Diplôme avancé · C1", note: "Le diplôme des études universitaires et du travail en français. Des sujets au format officiel actuel sont en préparation." };
EXAMS_SOON[1].fr = { levels: "Diplôme avancé · C2", note: "Le plus haut diplôme de langue française. Des sujets au format officiel actuel sont en préparation." };
PRODUCTS.push(...EXAM_PACKS);

// Live lessons with the author, one to one. Booked in two steps: a free exchange
// to agree on the content and the time, then payment to confirm the session.
// Prices revised 24/10/2026 (Olivier): learners are very price-sensitive, so $12 the hour, a little
// above the marketplace rate, with no marketplace commission. FCFA prices are set for the Cameroonian
// market (mobile money). A plan renews at the price it was bought at (serveur/direct.py).
const LIVE = [
  { id: "live-30", kind: "live", level: "Live", name: "Live Lesson · 30 minutes", contents: "One-to-one with Olivier", usd: 7, xaf: 3500,
    desc: "A short, focused session on one grammar point, a pronunciation problem, or some quick speaking practice before an exam or interview." },
  { id: "live-60", kind: "live", level: "Live", name: "Live Lesson · 60 minutes", contents: "One-to-one with Olivier", usd: 12, xaf: 6000,
    desc: "A full session to explore a topic in depth, work through a module, practice speaking or get ready for an exam task." },
  { id: "live-pack5", kind: "live", level: "Live", lessons: 5, name: "5 Live Lessons · 60 minutes each", contents: "One-to-one with Olivier · book them within 2 months", usd: 55, xaf: 28000,
    desc: "A short course built around your goal. We agree on a plan in the first lesson, and after each lesson you get a brief written follow-up." },
  // Plans (16/10/2026, Olivier: "make the best choices for me"): 60-minute lessons booked as you go over
  // 2 months; the counter resets and the plan renews every 2 months unless cancelled before.
  // Three tiers, the middle one highlighted; savings are computed against the single 60-minute lesson.
  { id: "plan-4", kind: "live", plan: true, level: "Live", lessons: 4, name: "Light Plan · 4 lessons every 2 months", contents: "One lesson every two weeks", usd: 44, xaf: 22000,
    desc: "Just enough to keep your French moving alongside the course, with a regular slot to speak, ask Olivier questions and work on whatever is holding you back." },
  { id: "plan-8", kind: "live", plan: true, best: true, level: "Live", lessons: 8, name: "Steady Plan · 8 lessons every 2 months", contents: "One lesson a week", usd: 80, xaf: 44000,
    desc: "One lesson a week is the pace that turns study into a habit. You'll see steady progress month after month and keep your momentum." },
  { id: "plan-16", kind: "live", plan: true, level: "Live", lessons: 16, name: "Intensive Plan · 16 lessons every 2 months", contents: "Two lessons a week", usd: 144, xaf: 80000,
    desc: "For an upcoming exam, a move or a new job. Two lessons a week is the fastest way to go from understanding French to speaking it with ease." },
];
const LIVE_NEEDS = ["A grammar point or a module", "Speaking or pronunciation", "Conversation practice", "Exam preparation (DELF, DALF, TCF)", "Something else"];
const LIVE_NEEDS_FR = ["Préparer l'expression orale d'un examen", "Préparer l'expression écrite d'un examen", "Faire le point sur mon niveau", "Conversation", "Autre chose"];
const LIVE_FR = {
  "live-30": { name: "Cours en direct · 30 minutes", contents: "En tête-à-tête avec Olivier",
    desc: "Une séance courte et ciblée : une tâche d'examen, un point de grammaire, ou un entraînement à l'oral juste avant l'épreuve ou un entretien." },
  "live-60": { name: "Cours en direct · 60 minutes", contents: "En tête-à-tête avec Olivier",
    desc: "Une séance complète pour simuler une épreuve d'expression orale, corriger une production écrite avec la grille officielle, ou approfondir un point." },
  "live-pack5": { name: "5 cours en direct · 60 minutes chacun", contents: "En tête-à-tête avec Olivier · à réserver sous 2 mois",
    desc: "Une préparation construite autour de votre objectif. Nous fixons le plan au premier cours, et chaque cours est suivi d'un court bilan écrit." },
  "plan-4": { name: "Formule Légère · 4 cours tous les 2 mois", contents: "Un cours toutes les deux semaines",
    desc: "Juste ce qu'il faut pour garder le cap avant l'examen, avec un rendez-vous régulier pour parler, poser vos questions et travailler ce qui vous bloque." },
  "plan-8": { name: "Formule Régulière · 8 cours tous les 2 mois", contents: "Un cours par semaine",
    desc: "Un cours par semaine, c'est le rythme qui transforme l'entraînement en habitude. Vous progressez mois après mois, sans perdre l'élan." },
  "plan-16": { name: "Formule Intensive · 16 cours tous les 2 mois", contents: "Deux cours par semaine",
    desc: "Pour un examen proche, un départ ou un nouveau poste. Deux cours par semaine, c'est la voie la plus rapide vers une expression orale et écrite à la hauteur de l'épreuve." },
};
LIVE.forEach((p) => { p.fr = LIVE_FR[p.id]; });
PRODUCTS.push(...LIVE);
