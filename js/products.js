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
const PRODUCTS = [
  { id: "a0-complete", level: "A0", kind: "level", name: "French A0 — Complete Beginner Course", contents: "8 modules + level check", usd: 19, xaf: 10400,
    desc: "Start French from zero. Eight modules that take you from the alphabet to holding a first conversation: introducing yourself, numbers, describing people and places, asking questions, present tense, telling the time, ordering in a café, and talking about your day. Every trap that catches English speakers is handled where it appears: tu and vous, silent endings, je suis Paul instead of je m'appelle Paul. Ends with a level check that tells you whether to move on to A1 or revise." },
  { id: "a1-part1", level: "A1", kind: "part", part: 1, name: "French A1 Part 1 — Modules 1 to 8", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "The first half of A1. You move from single sentences to real exchanges: past events with the passé composé, future plans, expressing opinions and preferences, shopping and quantities, giving directions, and describing your home and daily routine. Ends with a level check before Part 2." },
  { id: "a1-part2", level: "A1", kind: "part", part: 2, name: "French A1 Part 2 — Modules 9 to 16", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "The second half of A1, where French starts to sound natural. Reflexive verbs, the imperative, comparisons, weather and seasons, health and the body, travel and transport, plus the pronouns that let you stop repeating nouns. Ends with the A1 level check: you will know whether you are ready for A2." },
  { id: "a1-complete", level: "A1", kind: "level", name: "French A1 Complete — All 16 Modules", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "Both halves of A1 in one purchase, and cheaper than buying them separately. Sixteen modules and two level checks, from your first past tense to the pronouns that make you sound less like a textbook." },
  { id: "a2-part1", level: "A2", kind: "part", part: 1, name: "French A2 Part 1 — Modules 1 to 8", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "Past participle agreement, double pronouns, the plus-que-parfait, qui and que, où and dont, si + imparfait, and the subjunctive: how it is formed and what triggers it. Ends with a level check before Part 2." },
  { id: "a2-part2", level: "A2", kind: "part", part: 2, name: "French A2 Part 2 — Modules 9 to 16", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "The gérondif, demonstratives and possessives, cause and consequence, purpose and opposition, reported speech in the present and the past, the passive voice and the futur antérieur. Ends with the A2 level check." },
  { id: "a2-complete", level: "A2", kind: "level", name: "French A2 Complete — All 16 Modules", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "The whole A2 level in one purchase: sixteen modules and two level checks. Cheaper than buying the two parts separately." },
  { id: "b1-part1", level: "B1", kind: "part", part: 1, name: "French B1 Part 1 — Modules 1 to 8", contents: "Modules 1–8 + level check", usd: 29, xaf: 15900,
    desc: "Compound relative pronouns, past conditional, past subjunctive, present participle, se faire + infinitive, emphasis, indefinites, and the passé simple for reading. From B1 the objectives and section openers are in French too; the page \"Ce qui change au B1\" explains the shift." },
  { id: "b1-part2", level: "B1", kind: "part", part: 2, name: "French B1 Part 2 — Modules 9 to 16", contents: "Modules 9–16 + level check", usd: 29, xaf: 15900,
    desc: "The second half of B1: argument and nuance. Concession and opposition, hypothesis, formal and informal registers, professional writing, debating an idea, and the connectors that hold a long answer together. Ends with the B1 level check, the level most exams and employers ask for." },
  { id: "b1-complete", level: "B1", kind: "level", name: "French B1 Complete — All 16 Modules", contents: "Parts 1 and 2 · 16 modules + 2 level checks", usd: 49, xaf: 26900,
    desc: "The complete B1 level, both parts, sixteen modules and two level checks. The level that lets you work, study and argue in French. Cheaper than buying the parts separately." },
  { id: "complete-method", level: "A0–B1", kind: "method", name: "Pas à Pas — The Complete Method (A0 to B1)", contents: "56 modules + 7 level checks", usd: 129, xaf: 70800,
    desc: "Everything: 56 modules and 7 level checks, from the alphabet to arguing a point in French. Four levels that share one method, one set of characters and one way of explaining, so nothing is ever re-taught differently halfway through. You keep the files for good, including the updates." },
];

// Exam papers: the workshop can produce DELF, DALF and TCF papers. Nothing is priced or on sale yet.
const EXAMS = [
  { name: "DELF", levels: "A1 · A2 · B1 · B2", note: "The French diploma for levels A1 to B2, valid for life." },
  { name: "DALF", levels: "C1 · C2", note: "The advanced diploma, for university and professional use." },
  { name: "TCF", levels: "Including TCF Canada", note: "The French language test used for studies, citizenship and immigration." },
];

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
