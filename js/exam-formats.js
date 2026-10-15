// Écrit par delf.py --site depuis NORMES (atelier). Ne pas modifier à la main.
const EXAM_FORMATS = {
 "source": "France Éducation international, « Évolution des épreuves du DELF et du DALF », version actualisée du 24/06/2024 ; productions et durées : sujets d’exemple tout public",
 "checked": "2026-10-15",
 "delf": {
  "A1": {
   "name": "DELF A1",
   "written": "1 h 20 min",
   "papers": [
    {
     "name": "Listening",
     "time": "about 20 min",
     "marks": 25,
     "detail": "5 exercises, 21 questions: multiple choice, picture multiple choice, matching, yes/no; no open questions"
    },
    {
     "name": "Reading",
     "time": "30 min",
     "marks": 25,
     "detail": "4 exercises, 20 questions: picture multiple choice, multiple choice; no open questions"
    },
    {
     "name": "Writing",
     "time": "30 min",
     "marks": 25,
     "detail": "fill in a form; write a simple message of at least 40 words"
    },
    {
     "name": "Speaking",
     "time": "5–7 min",
     "marks": 25,
     "prep": "10 min",
     "detail": "3 parts: guided interview, information exchange, simulated dialogue"
    }
   ],
   "pass": "Pass mark 50/100, with at least 5/25 in each paper"
  },
  "A2": {
   "name": "DELF A2",
   "written": "1 h 40 min",
   "papers": [
    {
     "name": "Listening",
     "time": "about 25 min",
     "marks": 25,
     "detail": "4 exercises, 22 questions: picture multiple choice, multiple choice, matching; no open questions"
    },
    {
     "name": "Reading",
     "time": "30 min",
     "marks": 25,
     "detail": "4 exercises, 23 questions: matching, picture multiple choice, multiple choice, true/false; no open questions"
    },
    {
     "name": "Writing",
     "time": "45 min",
     "marks": 25,
     "detail": "describe an event or a personal experience, at least 60 words; invite, thank, apologise, ask, inform or congratulate, at least 60 words"
    },
    {
     "name": "Speaking",
     "time": "6–8 min",
     "marks": 25,
     "prep": "10 min",
     "detail": "3 parts: guided interview, short monologue, interaction"
    }
   ],
   "pass": "Pass mark 50/100, with at least 5/25 in each paper"
  },
  "B1": {
   "name": "DELF B1",
   "written": "1 h 55 min",
   "papers": [
    {
     "name": "Listening",
     "time": "about 25 min",
     "marks": 25,
     "detail": "3 exercises, 20 questions: multiple choice; no open questions"
    },
    {
     "name": "Reading",
     "time": "45 min",
     "marks": 25,
     "detail": "3 exercises, 30 questions: yes/no, multiple choice, true/false; no open questions"
    },
    {
     "name": "Writing",
     "time": "45 min",
     "marks": 25,
     "detail": "one text of at least 160 words giving your view on a general topic (essay, letter, article)"
    },
    {
     "name": "Speaking",
     "time": "about 15 min",
     "marks": 25,
     "prep": "10 min (part 3)",
     "detail": "3 parts: guided interview, interaction, giving a point of view on a short document"
    }
   ],
   "pass": "Pass mark 50/100, with at least 5/25 in each paper"
  },
  "B2": {
   "name": "DELF B2",
   "written": "2 h 30 min",
   "papers": [
    {
     "name": "Listening",
     "time": "about 30 min",
     "marks": 25,
     "detail": "3 exercises, 20 questions: multiple choice; no open questions"
    },
    {
     "name": "Reading",
     "time": "60 min",
     "marks": 25,
     "detail": "3 exercises, 20 questions: multiple choice; no open questions"
    },
    {
     "name": "Writing",
     "time": "60 min",
     "marks": 25,
     "detail": "one argued text of at least 250 words (contribution to a debate, formal letter, critical article)"
    },
    {
     "name": "Speaking",
     "time": "20 min",
     "marks": 25,
     "prep": "30 min",
     "detail": "2 parts: presenting and defending a point of view on a short document, then a debate with the examiner"
    }
   ],
   "pass": "Pass mark 50/100, with at least 5/25 in each paper"
  }
 },
 "dalf": {
  "C1": {
   "name": "DALF C1",
   "written": "4 h",
   "papers": [
    {
     "name": "Listening",
     "time": "about 40 min",
     "marks": 25,
     "detail": "2 exercises: one long document (interview, lecture, talk) heard twice; two short documents (news flashes, surveys) heard once; multiple choice, short answers and true/false with justification"
    },
    {
     "name": "Reading",
     "time": "50 min",
     "marks": 25,
     "detail": "1 exercise: one text of ideas, literary or journalistic; multiple choice, short answers and true/false with justification"
    },
    {
     "name": "Writing",
     "time": "2 h 30",
     "marks": 25,
     "detail": "a synthesis of a set of documents (200 to 240 words), without giving your opinion; an argued essay on the same theme (contribution to a debate, formal letter, critical article…), at least 250 words"
    },
    {
     "name": "Speaking",
     "time": "30 min",
     "marks": 25,
     "prep": "1 h",
     "detail": "a presentation defending a point of view from a short trigger document (two topics drawn, one chosen), then a debate with the jury"
    }
   ],
   "pass": "Pass mark 50/100, with at least 5/25 in each paper",
   "source": "France Éducation international, Manuel du candidat DALF C1, juillet 2022"
  },
  "C2": {
   "name": "DALF C2",
   "written": "3 h 30 min",
   "papers": [
    {
     "name": "Reading and writing",
     "time": "3 h 30",
     "marks": 50,
     "detail": "one structured text (article, editorial, report, speech) of at least 700 words, from a file of documents of about 2,000 words"
    },
    {
     "name": "Listening and speaking",
     "time": "30 min",
     "marks": 50,
     "prep": "1 h",
     "detail": "reporting on recorded documents (heard twice), then an argued presentation and a debate with the jury"
    }
   ],
   "pass": "Pass mark 50/100, with at least 10/50 in each paper",
   "source": "France Éducation international, format relevé le 27/09/2026"
  }
 },
 "tcf": {
  "name": "TCF Canada",
  "checked": "2026-09-26",
  "papers": [
   {
    "name": "Listening",
    "time": "35 min",
    "marks": null,
    "detail": "39 multiple-choice questions (4 choices), each recording heard once; difficulty rises from A1 to C2"
   },
   {
    "name": "Reading",
    "time": "60 min",
    "marks": null,
    "detail": "39 multiple-choice questions (4 choices); difficulty rises from A1 to C2"
   },
   {
    "name": "Writing",
    "time": "60 min",
    "marks": null,
    "detail": "3 tasks: a message (60 to 120 words); an article, letter or note (120 to 150 words); comparing two points of view, then your own (120 to 180 words)"
   },
   {
    "name": "Speaking",
    "time": "12 min",
    "marks": null,
    "detail": "3 tasks: guided interview; interaction after 2 minutes of preparation; expressing a point of view"
   }
  ],
  "pass": "No pass mark: Listening and Reading are scored from 100 to 699, Writing and Speaking out of 20, and each score is converted into a CEFR level and an NCLC level"
 }
};
