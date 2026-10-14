// Example catalogue. Base prices in euros; the page converts them to the visitor's currency.
// Replace titles, descriptions and prices with your real products before launch.
const CATEGORIES = {
  courses: "Video courses",
  exams: "Exam prep",
  books: "E-books & audio",
  practice: "Practice tools",
  coaching: "Live coaching",
  bundles: "Bundles",
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

const GOALS = {
  canada: "Move to Canada",
  work: "Work & career",
  daily: "Everyday French",
  exam: "Diplomas (DELF)",
  kids: "Children",
};

const FORMATS = {
  video: "Video",
  pdf: "PDF",
  audio: "Audio",
  live: "Live",
  app: "Flashcards",
};

const PRODUCTS = [
  { id: 1, name: "French from Zero", cat: "courses", levels: ["A1"], goals: ["daily", "canada"], formats: ["video", "pdf"], price: 19, old: 29, best: true, hue: 222,
    size: "32 video lessons · 6 h", desc: "Start from nothing. Every rule is explained in English, with short videos, a printable workbook and a quiz after each lesson. Ends with a mini A1 mock test." },
  { id: 2, name: "Step Up to A2", cat: "courses", levels: ["A2"], goals: ["daily", "canada"], formats: ["video", "pdf"], price: 24, hue: 214,
    size: "36 video lessons · 7 h", desc: "Past tenses, everyday situations, phone calls and emails. Built around the mistakes English speakers make most: gender, articles and false friends." },
  { id: 3, name: "Intermediate French B1", cat: "courses", levels: ["B1"], goals: ["canada", "work", "exam"], formats: ["video", "pdf", "audio"], price: 34, best: true, hue: 206,
    size: "40 video lessons · 9 h", desc: "The level most immigration and job applications ask for. Subjunctive basics, giving opinions, writing structured texts and following real radio clips." },
  { id: 4, name: "TCF Canada Prep Pack", cat: "exams", levels: ["B1", "B2", "C1"], goals: ["canada"], formats: ["pdf", "audio", "video"], price: 39, old: 49, best: true, hue: 4,
    size: "4 full mock exams · 160 questions", desc: "Four timed mock exams in the official format: listening, reading, writing and speaking. Answer keys explained in English and a score table mapped to CLB/NCLC levels." },
  { id: 5, name: "TEF Canada Prep Pack", cat: "exams", levels: ["B1", "B2", "C1"], goals: ["canada"], formats: ["pdf", "audio"], price: 39, hue: 356,
    size: "3 mock exams · 120 audio tracks", desc: "Practice for all four TEF Canada sections, with model answers for the written tasks and speaking prompts you can record yourself on." },
  { id: 6, name: "DELF B1 & B2 Prep", cat: "exams", levels: ["B1", "B2"], goals: ["exam", "work"], formats: ["pdf", "audio"], price: 29, hue: 12,
    size: "2 mock exams per level", desc: "Mock papers, marking grids and corrected sample essays for the DELF B1 and B2 diplomas, recognised for life worldwide." },
  { id: 7, name: "French Grammar for English Speakers", cat: "books", levels: ["A1", "A2", "B1"], goals: ["daily", "exam"], formats: ["pdf"], price: 12, best: true, hue: 38,
    size: "E-book · 180 pages", desc: "Grammar compared side by side with English, so you see exactly where the two languages differ. 300 exercises with answers." },
  { id: 8, name: "500 False Friends", cat: "books", levels: ["A2", "B1", "B2"], goals: ["daily", "work"], formats: ["pdf", "audio"], price: 7, hue: 30,
    size: "E-book + audio", desc: "Actually ≠ actuellement, library ≠ librairie… 500 traps for English speakers, each with an example sentence and its recording." },
  { id: 9, name: "Pronunciation Bootcamp", cat: "books", levels: ["A1", "A2"], goals: ["daily", "canada"], formats: ["audio", "video"], price: 15, hue: 46,
    size: "21 days · 10 min a day", desc: "Nasal vowels, the French R, silent letters and liaisons. Listen, repeat and compare with native recordings, one short drill a day." },
  { id: 10, name: "Everyday Phrasebook (offline)", cat: "books", levels: ["A1", "A2"], goals: ["daily", "canada"], formats: ["pdf", "audio"], price: 5, hue: 52,
    size: "1,200 phrases · MP3", desc: "Phrases for the market, the bank, the doctor, school and transport. Downloads once and works without internet." },
  { id: 11, name: "2,000 Essential Words Flashcards", cat: "practice", levels: ["A1", "A2", "B1"], goals: ["daily", "canada", "exam"], formats: ["app", "audio"], price: 9, hue: 160,
    size: "Anki & printable deck", desc: "The 2,000 most frequent French words with audio, gender colour-coding and an English example. Spaced repetition keeps them in memory." },
  { id: 12, name: "Daily French on WhatsApp", cat: "practice", levels: ["A1", "A2", "B1"], goals: ["daily", "work"], formats: ["audio", "live"], price: 6, per: "month", hue: 150,
    size: "1 lesson a day · voice notes", desc: "Every morning: a voice note, a mini lesson and a question. Reply by voice and a teacher corrects you the same day. Cancel anytime." },
  { id: 13, name: "Workplace French", cat: "courses", levels: ["B1", "B2"], goals: ["work"], formats: ["video", "pdf"], price: 29, hue: 196,
    size: "24 lessons · templates", desc: "Meetings, formal letters, reports and job interviews in French. Includes 30 email and letter templates you can adapt." },
  { id: 14, name: "Speaking Coaching · 5 sessions", cat: "coaching", levels: ["A2", "B1", "B2", "C1"], goals: ["canada", "work", "exam"], formats: ["live"], price: 59, hue: 280,
    size: "5 × 45 min on video call", desc: "One-to-one sessions with a bilingual teacher. Ideal before the TCF/TEF speaking test: realistic prompts, timed answers and written feedback." },
  { id: 15, name: "Written Expression Corrections", cat: "coaching", levels: ["B1", "B2", "C1"], goals: ["canada", "exam"], formats: ["pdf"], price: 25, hue: 270,
    size: "5 texts corrected in 48 h", desc: "Send five exam-style texts. Each comes back annotated, with an estimated level and a rewritten model version." },
  { id: 16, name: "Kids' French Adventure", cat: "practice", levels: ["A1"], goals: ["kids"], formats: ["video", "pdf"], price: 14, hue: 120,
    size: "Ages 6–11 · 20 episodes", desc: "Animated episodes, songs and colouring worksheets so children pick up their first 300 words in French." },
  { id: 17, name: "Zero to B1 Complete", cat: "bundles", levels: ["A1", "A2", "B1"], goals: ["daily", "canada", "work"], formats: ["video", "pdf", "audio", "app"], price: 69, old: 109, best: true, hue: 240,
    size: "3 courses + grammar + flashcards", desc: "French from Zero, Step Up to A2, Intermediate B1, the grammar e-book and the 2,000-word flashcards. About 22 hours of video." },
  { id: 18, name: "Canada Immigration Pack", cat: "bundles", levels: ["B1", "B2", "C1"], goals: ["canada"], formats: ["pdf", "audio", "video", "live"], price: 119, old: 162, hue: 350,
    size: "TCF + TEF + 5 coaching sessions", desc: "Both Canada prep packs, five live speaking sessions and five written corrections. Everything you need to hit your NCLC target." },
];
