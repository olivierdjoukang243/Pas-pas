// Pas à Pas catalogue. Facts confirmed by Olivier on 14/10/2026: 11 products,
// 56 modules and 7 level checks from A0 to B1. Prices are set in both currencies
// (they are not converted). Never add a module title, product or price that is not confirmed.

const LEVELS = [
  { code: "A0", name: "Discovery", hue: 190, status: "open" },
  { code: "A1", name: "Beginner", hue: 210, status: "open" },
  { code: "A2", name: "Elementary", hue: 228, status: "open" },
  { code: "B1", name: "Intermediate", hue: 248, status: "open" },
  { code: "B2", name: "Upper-intermediate", hue: 272, status: "prep", note: "Part 1 is being written. Not on sale yet." },
  { code: "C1", name: "Advanced", hue: 330, status: "prep", note: "In preparation. Not on sale yet." },
  { code: "C2", name: "Mastery", hue: 350, status: "prep", note: "In preparation. Not on sale yet." },
];

const LEVEL_INTRO = {
  A0: "From the alphabet to a first conversation. Instructions are in English.",
  A1: "From single sentences to real exchanges. Instructions in French, grammar still explained in English.",
  A2: "Where you stop translating in your head.",
  B1: "Where French becomes yours. Objectives and section openers are in French too.",
};

// kind: "part" (8 modules + level check), "level" (both parts), "method" (everything).
// ready: false = not deliverable yet. With preorder: true it can be pre-ordered: paid now,
// sent as soon as it is ready, cancellable with a full refund until then (policies, 2-3).
// Without preorder it is shown as "In preparation" and cannot be bought.
// Olivier, 15/10/2026: the products without their illustrations wait for them (A1 Part 2,
// A2, B1, and the packs that contain them); 16/10/2026: they open to pre-order. Set ready
// back to true (or remove it) as each one is illustrated.
const PRODUCTS = [
  { id: "a0-complete", level: "A0", kind: "level", name: "French A0 — Complete Beginner Course", contents: "8 modules + level check", usd: 19, xaf: 10400,
    desc: "Start French from zero. Eight modules that take you from the alphabet to holding a first conversation: introducing yourself, numbers, describing people and places, asking questions, present tense, telling the time, ordering in a café, and talking about your day. Every trap that catches English speakers is handled where it appears: tu and vous, silent endings, je suis Paul instead of je m'appelle Paul. Ends with a level check that tells you whether to move on to A1 or revise." },
  { id: "a1-part1", level: "A1", kind: "part", part: 1, name: "French A1 Part 1 — Modules 1 to 8", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "The first half of A1. You move from single sentences to real exchanges: past events with the passé composé, future plans, expressing opinions and preferences, shopping and quantities, giving directions, and describing your home and daily routine. Ends with a level check before Part 2." },
  { id: "a1-part2", ready: false, preorder: true, level: "A1", kind: "part", part: 2, name: "French A1 Part 2 — Modules 9 to 16", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "The second half of A1, where French starts to sound natural. Reflexive verbs, the imperative, comparisons, weather and seasons, health and the body, travel and transport, plus the pronouns that let you stop repeating nouns. Ends with the A1 level check: you will know whether you are ready for A2." },
  { id: "a1-complete", ready: false, preorder: true, level: "A1", kind: "level", name: "French A1 Complete — All 16 Modules", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "Both halves of A1 in one purchase, and cheaper than buying them separately. Sixteen modules and two level checks, from your first past tense to the pronouns that make you sound less like a textbook." },
  { id: "a2-part1", ready: false, preorder: true, level: "A2", kind: "part", part: 1, name: "French A2 Part 1 — Modules 1 to 8", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "Past participle agreement, double pronouns, the plus-que-parfait, qui and que, où and dont, si + imparfait, and the subjunctive: how it is formed and what triggers it. Ends with a level check before Part 2." },
  { id: "a2-part2", ready: false, preorder: true, level: "A2", kind: "part", part: 2, name: "French A2 Part 2 — Modules 9 to 16", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "The gérondif, demonstratives and possessives, cause and consequence, purpose and opposition, reported speech in the present and the past, the passive voice and the futur antérieur. Ends with the A2 level check." },
  { id: "a2-complete", ready: false, preorder: true, level: "A2", kind: "level", name: "French A2 Complete — All 16 Modules", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "The whole A2 level in one purchase: sixteen modules and two level checks. Cheaper than buying the two parts separately." },
  { id: "b1-part1", ready: false, preorder: true, level: "B1", kind: "part", part: 1, name: "French B1 Part 1 — Modules 1 to 8", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "Compound relative pronouns, past conditional, past subjunctive, present participle, se faire + infinitive, emphasis, indefinites, and the passé simple for reading. From B1 the objectives and section openers are in French too; the page \"Ce qui change au B1\" explains the shift." },
  { id: "b1-part2", ready: false, preorder: true, level: "B1", kind: "part", part: 2, name: "French B1 Part 2 — Modules 9 to 16", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "The second half of B1: argument and nuance. Concession and opposition, hypothesis, formal and informal registers, professional writing, debating an idea, and the connectors that hold a long answer together. Ends with the B1 level check, the level most exams and employers ask for." },
  { id: "b1-complete", ready: false, preorder: true, level: "B1", kind: "level", name: "French B1 Complete — All 16 Modules", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "The complete B1 level, both parts, sixteen modules and two level checks. The level that lets you work, study and argue in French. Cheaper than buying the parts separately." },
  { id: "complete-method", ready: false, preorder: true, level: "A0–B1", kind: "method", name: "Pas à Pas — The Complete Method (A0 to B1)", contents: "56 modules + 7 level checks", usd: 129, xaf: 70800,
    desc: "Everything: 56 modules and 7 level checks, from the alphabet to arguing a point in French. Four levels that share one method, one set of characters and one way of explaining, so nothing is ever re-taught differently halfway through. You keep the files for good, including the updates." },
];

// Exam packs: series of 4 complete papers produced by the workshop (delf.py, tcf.py, series.py),
// delivered by livrer.py. The format shown on each card comes from js/exam-formats.js, written
// by the workshop from its norm (delf.py --site), never typed here. ready: false until the
// workshop has produced a series; until then the packs are pre-ordered. DALF C1 and C2 have
// no price yet: they stay "coming soon".
const DELF_DESC = (lvl) => `Four complete ${lvl} papers in the current official format, sharing no task: listening, reading, writing and speaking. Marking guide with the answers, transcripts and grids, and a timed web edition you sit like the real exam: each paper on its own clock, every recording heard as many times as at the exam and no more, listening and reading marked out of 25 once the last paper is over.`;
const EXAM_PACKS = [
  { id: "delf-a1", kind: "exam", level: "DELF", exam: "DELF A1", format: ["delf", "A1"], ready: false, preorder: true, name: "DELF A1 — 4 practice papers", contents: "4 complete papers · four skills · audio included", usd: 19, xaf: 10400, desc: DELF_DESC("DELF A1") },
  { id: "delf-a2", kind: "exam", level: "DELF", exam: "DELF A2", format: ["delf", "A2"], ready: false, preorder: true, name: "DELF A2 — 4 practice papers", contents: "4 complete papers · four skills · audio included", usd: 19, xaf: 10400, desc: DELF_DESC("DELF A2") },
  { id: "delf-b1", kind: "exam", level: "DELF", exam: "DELF B1", format: ["delf", "B1"], ready: false, preorder: true, name: "DELF B1 — 4 practice papers", contents: "4 complete papers · four skills · audio included", usd: 25, xaf: 13700, desc: DELF_DESC("DELF B1") },
  { id: "delf-b2", kind: "exam", level: "DELF", exam: "DELF B2", format: ["delf", "B2"], ready: false, preorder: true, name: "DELF B2 — 4 practice papers", contents: "4 complete papers · four skills · audio included", usd: 25, xaf: 13700, desc: DELF_DESC("DELF B2") },
  { id: "tcf-canada", kind: "exam", level: "TCF", exam: "TCF Canada", format: ["tcf", "tcf-canada"], ready: false, preorder: true, name: "TCF Canada — 4 practice papers", contents: "4 complete papers, A1 to C2 · four skills · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF Canada papers in the official format, sharing no question: 39 listening and 39 reading questions rising from A1 to C2, the three writing tasks and the three speaking tasks. Marking guide with the level of every question, and a timed web edition, run like the real test, that counts your right answers level by level once the last paper is over and gives the NCLC estimate." },
  { id: "tcf-quebec", kind: "exam", level: "TCF", exam: "TCF Québec", format: ["tcf", "tcf-quebec"], ready: false, preorder: true, name: "TCF Québec — 4 practice papers", contents: "4 complete papers, A1 to C2 · four skills · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF Québec papers in the official format, sharing no question: 29 listening and 29 reading questions rising from A1 to C2, the three writing tasks and the three speaking tasks. Marking guide with the level of every question, and a timed web edition, run like the real test, that counts your right answers level by level once the last paper is over." },
  { id: "tcf-tp", kind: "exam", level: "TCF", exam: "TCF tout public", format: ["tcf", "tcf-tp"], ready: false, preorder: true, name: "TCF tout public — 4 practice papers", contents: "4 complete papers, A1 to C2 · five papers · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF tout public papers in the official format, sharing no question: 29 listening, 18 language structure and 29 reading questions rising from A1 to C2, plus the optional writing and speaking tasks. Marking guide with the level of every question, and a timed web edition, run like the real test, that counts your right answers level by level once the last paper is over." },
  { id: "tcf-dap", kind: "exam", level: "TCF", exam: "TCF DAP", format: ["tcf", "tcf-dap"], ready: false, preorder: true, name: "TCF DAP — 4 practice papers", contents: "4 complete papers, A1 to C2 · five papers · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF DAP papers in the official format, sharing no question: 29 listening, 18 language structure and 29 reading questions rising from A1 to C2, the compulsory writing tasks and the optional speaking tasks. Marking guide with the level of every question, and a timed web edition, run like the real test, that counts your right answers level by level once the last paper is over." },
  { id: "tcf-irn", kind: "exam", level: "TCF", exam: "TCF IRN", format: ["tcf", "tcf-irn"], ready: false, preorder: true, name: "TCF IRN — 4 practice papers", contents: "4 complete papers · four skills · audio included", usd: 29, xaf: 15900,
    desc: "Four complete TCF IRN papers in the official format, sharing no question: 25 listening and 25 reading questions of rising difficulty, the three writing tasks and the three speaking tasks, all without preparation. Marking guide with the level of every question, and a timed web edition, run like the real test, that counts your right answers level by level once the last paper is over." },
];
const EXAMS_SOON = [
  { name: "DALF C1", format: ["dalf", "C1"], levels: "Advanced diploma · C1", note: "For university and professional use. Practice papers in preparation, in the current official format." },
  { name: "DALF C2", format: ["dalf", "C2"], levels: "Advanced diploma · C2", note: "The highest French diploma. Practice papers in preparation, in the current official format." },
];
PRODUCTS.push(...EXAM_PACKS);

// Live lessons with the author, one to one. Booked in two steps: a free exchange
// to agree on the content and the time, then payment to confirm the session.
// FCFA prices follow the same rate as the course (about 547 FCFA per dollar).
const LIVE = [
  { id: "live-30", kind: "live", level: "Live", name: "Live lesson · 30 minutes", contents: "One to one with Olivier", usd: 9, xaf: 4900,
    desc: "A short, focused session: one grammar point, a pronunciation problem, or a quick speaking practice before an exam or an interview." },
  { id: "live-60", kind: "live", level: "Live", name: "Live lesson · 60 minutes", contents: "One to one with Olivier", usd: 15, xaf: 8200,
    desc: "A full session to study a topic in depth, work on a module, practise speaking or prepare an exam task." },
  { id: "live-pack5", kind: "live", level: "Live", name: "5 live lessons · 60 minutes each", contents: "One to one with Olivier · use within 3 months", usd: 65, xaf: 35700,
    desc: "A short course built around your goal, with a plan agreed in the first session and a short written follow-up after each one." },
];
const LIVE_NEEDS = ["Study a grammar point or a module", "Practise speaking or pronunciation", "Conversation practice", "Prepare an exam (DELF, DALF, TCF)", "Something else"];
PRODUCTS.push(...LIVE);
