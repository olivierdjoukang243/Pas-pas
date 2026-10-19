// Pas à Pas catalogue. Facts confirmed by Olivier on 14/10/2026: 11 products,
// 56 modules and 7 level checks from A0 to B1. Prices are set in both currencies
// (they are not converted). Never add a module title, product or price that is not confirmed.

const LEVELS = [
  { code: "A0", name: "Absolute Beginner", hue: 190, status: "open" },
  { code: "A1", name: "Beginner 1", hue: 210, status: "open" },
  { code: "A2", name: "Beginner 2", hue: 228, status: "open" },
  { code: "B1", name: "Intermediate 1", hue: 248, status: "open" },
  { code: "B2", name: "Intermediate 2", hue: 272, status: "prep", note: "Part 1 is being written. Not available yet." },
  { code: "C1", name: "Advanced 1", hue: 330, status: "prep", note: "In preparation. Not available yet." },
  { code: "C2", name: "Advanced 2", hue: 350, status: "prep", note: "In preparation. Not available yet." },
];

const LEVEL_INTRO = {
  A0: "From the alphabet to your first conversation. Instructions are in English.",
  A1: "From single sentences to real conversations. Instructions are in French, but grammar is still explained in English.",
  A2: "The level where you stop translating in your head.",
  B1: "The level where French starts to feel like your own. Objectives and section introductions are in French too.",
};

// kind: "part" (8 modules + level check), "level" (both parts), "method" (everything).
// ready: false = not deliverable yet. With preorder: true it can be pre-ordered: paid now,
// sent as soon as it is ready, cancellable with a full refund until then (policies, 2-3).
// Without preorder it is shown as "In preparation" and cannot be bought.
// Olivier, 15/10/2026: the products without their illustrations wait for them (A1 Part 2,
// A2, B1, and the packs that contain them); 16/10/2026: they open to pre-order. Set ready
// back to true (or remove it) as each one is illustrated.
const PRODUCTS = [
  { id: "a0-complete", level: "A0", kind: "level", name: "French Absolute Beginner (A0)", contents: "8 modules + level check", usd: 19, xaf: 10400,
    desc: "Start French from zero. Eight modules take you from the alphabet to your first conversation. You'll learn to introduce yourself, use numbers, describe people and places, ask questions, use the present tense, tell the time, order in a café and talk about your day. Every trap that catches English speakers is covered as it comes up: tu and vous, silent endings, je suis Paul versus je m'appelle Paul. The course ends with a level check that tells you whether you're ready for A1 or should review first." },
  { id: "a1-part1", level: "A1", kind: "part", part: 1, name: "French Beginner 1 (A1) — Part 1", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "The first half of A1, where you move from single sentences to real conversations. You'll talk about the past with the passé composé, make plans for the future, give opinions and preferences, shop and talk about quantities, give directions, and describe your home and daily routine. It ends with a level check before Part 2." },
  { id: "a1-part2", ready: false, preorder: true, level: "A1", kind: "part", part: 2, name: "French Beginner 1 (A1) — Part 2", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "The second half of A1, where your French starts to sound natural. It covers reflexive verbs, the imperative, comparisons, weather and seasons, health and the body, travel and transport, and the pronouns that save you from repeating nouns. It ends with the A1 level check, so you'll know whether you're ready for A2." },
  { id: "a1-complete", ready: false, preorder: true, level: "A1", kind: "level", name: "French Beginner 1 (A1) — Full Level", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "Both halves of A1 in one purchase, for less than buying them separately. Sixteen modules and two level checks, from your first past tense to the pronouns that make you sound less like a textbook." },
  { id: "a2-part1", ready: false, preorder: true, level: "A2", kind: "part", part: 1, name: "French Beginner 2 (A2) — Part 1", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "This part covers past participle agreement, double pronouns, the plus-que-parfait, qui and que, où and dont, si + imparfait, and the subjunctive: how to form it and when to use it. It ends with a level check before Part 2." },
  { id: "a2-part2", ready: false, preorder: true, level: "A2", kind: "part", part: 2, name: "French Beginner 2 (A2) — Part 2", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "This part covers the gérondif, demonstratives and possessives, cause and consequence, purpose and opposition, reported speech in the present and the past, the passive voice and the futur antérieur. It ends with the A2 level check." },
  { id: "a2-complete", ready: false, preorder: true, level: "A2", kind: "level", name: "French Beginner 2 (A2) — Full Level", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "The full A2 level in one purchase: sixteen modules and two level checks, for less than buying the two parts separately." },
  { id: "b1-part1", ready: false, preorder: true, level: "B1", kind: "part", part: 1, name: "French Intermediate 1 (B1) — Part 1", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "This part covers compound relative pronouns, the past conditional, the past subjunctive, the present participle, se faire + infinitive, emphasis, indefinites, and the passé simple for reading. From B1, objectives and section introductions are in French too. The page \"Ce qui change au B1\" explains what changes." },
  { id: "b1-part2", ready: false, preorder: true, level: "B1", kind: "part", part: 2, name: "French Intermediate 1 (B1) — Part 2", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "The second half of B1 teaches you to make a case and express shades of meaning. It covers concession and opposition, hypotheses, formal and informal registers, professional writing, debating an idea, and the linking words that hold a long answer together. It ends with the B1 level check. B1 is the level most exams and employers ask for." },
  { id: "b1-complete", ready: false, preorder: true, level: "B1", kind: "level", name: "French Intermediate 1 (B1) — Full Level", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "The full B1 level: both parts, with sixteen modules and two level checks. This is the level that lets you work, study and debate in French. It costs less than buying the two parts separately." },
  { id: "complete-method", ready: false, preorder: true, level: "A0–B1", kind: "method", name: "Pas à Pas — The Complete Method (A0 to B1)", contents: "56 modules + 7 level checks", usd: 129, xaf: 70800,
    desc: "Everything in one place: 56 modules and 7 level checks, from the alphabet to defending your point of view in French. All four levels follow one method, with the same characters and the same way of explaining, so nothing is ever taught differently halfway through. The files are yours to keep, updates included." },
];

// Exam packs: series of 4 complete papers produced by the workshop (delf.py, tcf.py, series.py),
// delivered by livrer.py. The format shown on each card comes from js/exam-formats.js, written
// by the workshop from its norm (delf.py --site), never typed here. ready: false until the
// workshop has produced a series; until then the packs are pre-ordered. DALF C1 and C2 have
// no price yet: they stay "coming soon".
const DELF_DESC = (lvl) => `Four complete ${lvl} practice tests in the current official format, with no task repeated across them. Each one covers listening, reading, writing and speaking. You get a marking guide with the answers, transcripts and scoring grids, plus a timed online version you take just like the real exam. Each part has its own timer, you can play each recording only as many times as in the exam, and listening and reading are scored out of 25 when you finish.`;
const EXAM_PACKS = [
  { id: "delf-a1", kind: "exam", level: "DELF", exam: "DELF A1", format: ["delf", "A1"], ready: false, preorder: true, name: "DELF A1 — 4 Practice Tests", contents: "4 complete tests · all four skills · audio included", usd: 19, xaf: 10400, desc: DELF_DESC("DELF A1") },
  { id: "delf-a2", kind: "exam", level: "DELF", exam: "DELF A2", format: ["delf", "A2"], ready: false, preorder: true, name: "DELF A2 — 4 Practice Tests", contents: "4 complete tests · all four skills · audio included", usd: 19, xaf: 10400, desc: DELF_DESC("DELF A2") },
  { id: "delf-b1", kind: "exam", level: "DELF", exam: "DELF B1", format: ["delf", "B1"], ready: false, preorder: true, name: "DELF B1 — 4 Practice Tests", contents: "4 complete tests · all four skills · audio included", usd: 25, xaf: 13700, desc: DELF_DESC("DELF B1") },
  { id: "delf-b2", kind: "exam", level: "DELF", exam: "DELF B2", format: ["delf", "B2"], ready: false, preorder: true, name: "DELF B2 — 4 Practice Tests", contents: "4 complete tests · all four skills · audio included", usd: 25, xaf: 13700, desc: DELF_DESC("DELF B2") },
  { id: "tcf-canada", kind: "exam", level: "TCF", exam: "TCF Canada", format: ["tcf", "tcf-canada"], ready: false, preorder: true, name: "TCF Canada — 4 Practice Tests", contents: "4 complete tests, A1 to C2 · all four skills · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF Canada practice tests in the official format, with no question repeated across them. Each test has 39 listening and 39 reading questions that rise from A1 to C2, plus the three writing tasks and the three speaking tasks. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level and gives you an NCLC estimate." },
  { id: "tcf-quebec", kind: "exam", level: "TCF", exam: "TCF Québec", format: ["tcf", "tcf-quebec"], ready: false, preorder: true, name: "TCF Québec — 4 Practice Tests", contents: "4 complete tests, A1 to C2 · all four skills · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF Québec practice tests in the official format, with no question repeated across them. Each test has 29 listening and 29 reading questions that rise from A1 to C2, plus the three writing tasks and the three speaking tasks. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level." },
  { id: "tcf-tp", kind: "exam", level: "TCF", exam: "TCF tout public", format: ["tcf", "tcf-tp"], ready: false, preorder: true, name: "TCF tout public — 4 Practice Tests", contents: "4 complete tests, A1 to C2 · five sections · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF tout public practice tests in the official format, with no question repeated across them. Each test has 29 listening, 18 language structure and 29 reading questions that rise from A1 to C2, plus the optional writing and speaking tasks. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level." },
  { id: "tcf-dap", kind: "exam", level: "TCF", exam: "TCF DAP", format: ["tcf", "tcf-dap"], ready: false, preorder: true, name: "TCF DAP — 4 Practice Tests", contents: "4 complete tests, A1 to C2 · five sections · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF DAP practice tests in the official format, with no question repeated across them. Each test has 29 listening, 18 language structure and 29 reading questions that rise from A1 to C2, plus the required writing tasks and the optional speaking tasks. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level." },
  { id: "tcf-irn", kind: "exam", level: "TCF", exam: "TCF IRN", format: ["tcf", "tcf-irn"], ready: false, preorder: true, name: "TCF IRN — 4 Practice Tests", contents: "4 complete tests · all four skills · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF IRN practice tests in the official format, with no question repeated across them. Each test has 25 listening and 25 reading questions of increasing difficulty, plus the three writing tasks and the three speaking tasks, all with no preparation time. You get a marking guide showing the level of every question, and a timed online version that works like the real test. When you finish, it counts your correct answers level by level." },
];
const EXAMS_SOON = [
  { name: "DALF C1", format: ["dalf", "C1"], levels: "Advanced diploma · C1", note: "For university study and professional use. Practice tests in the current official format are in preparation." },
  { name: "DALF C2", format: ["dalf", "C2"], levels: "Advanced diploma · C2", note: "The highest French diploma. Practice tests in the current official format are in preparation." },
];
PRODUCTS.push(...EXAM_PACKS);

// Live lessons with the author, one to one. Booked in two steps: a free exchange
// to agree on the content and the time, then payment to confirm the session.
// FCFA prices follow the same rate as the course (about 547 FCFA per dollar).
const LIVE = [
  { id: "live-30", kind: "live", level: "Live", name: "Live Lesson · 30 minutes", contents: "One-to-one with Olivier", usd: 9, xaf: 4900,
    desc: "A short, focused session on one grammar point, a pronunciation problem, or some quick speaking practice before an exam or interview." },
  { id: "live-60", kind: "live", level: "Live", name: "Live Lesson · 60 minutes", contents: "One-to-one with Olivier", usd: 15, xaf: 8200,
    desc: "A full session to explore a topic in depth, work through a module, practice speaking or prepare for an exam task." },
  { id: "live-pack5", kind: "live", level: "Live", lessons: 5, name: "5 Live Lessons · 60 minutes each", contents: "One-to-one with Olivier · book them within 2 months", usd: 65, xaf: 35700,
    desc: "A short course built around your goal. We agree on a plan in the first lesson, and you get a brief written follow-up after each one." },
  // Plans (16/10/2026, Olivier: "make the best choices for me"): 60-minute lessons booked as you go over
  // 2 months; the counter resets and the plan renews every 2 months unless cancelled before.
  // Three tiers, the middle one highlighted; savings are computed against the single 60-minute lesson.
  { id: "plan-4", kind: "live", plan: true, level: "Live", lessons: 4, name: "Light Plan · 4 lessons every 2 months", contents: "One lesson every two weeks", usd: 52, xaf: 28400,
    desc: "Enough to keep your French moving alongside the course. A regular meeting with Olivier to speak, ask questions and work on what's holding you back." },
  { id: "plan-8", kind: "live", plan: true, best: true, level: "Live", lessons: 8, name: "Steady Plan · 8 lessons every 2 months", contents: "One lesson a week", usd: 96, xaf: 52500,
    desc: "One lesson a week is the pace that turns study into a habit. You'll see your progress month after month, and you'll never lose momentum." },
  { id: "plan-16", kind: "live", plan: true, level: "Live", lessons: 16, name: "Intensive Plan · 16 lessons every 2 months", contents: "Two lessons a week", usd: 176, xaf: 96300,
    desc: "For an upcoming exam, a move or a new job. Two lessons a week is the fastest way to go from understanding French to speaking it with ease." },
];
const LIVE_NEEDS = ["Study a grammar point or a module", "Practice speaking or pronunciation", "Conversation practice", "Prepare for an exam (DELF, DALF, TCF)", "Something else"];
PRODUCTS.push(...LIVE);
