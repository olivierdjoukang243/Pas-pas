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
  "tcf-canada": {
   "name": "TCF Canada",
   "official": "Test de connaissance du français pour le Canada",
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
     "detail": "39 multiple-choice questions (4 choices), difficulty rises from A1 to C2"
    },
    {
     "name": "Writing",
     "marks": null,
     "time": "60 min",
     "detail": "3 tasks: a message (60 to 120 words); an article, letter or note (120 to 150 words); comparing two points of view, then your own (120 to 180 words)"
    },
    {
     "name": "Speaking",
     "marks": null,
     "time": "12 min",
     "detail": "3 tasks: guided interview; interaction after 2 minutes of preparation; expressing a point of view"
    }
   ],
   "pass": "No pass mark: Listening and Reading are scored from 100 to 699, Writing and Speaking out of 20, and each score is converted into a CEFR level and an NCLC level",
   "source": "France Éducation international, format relevé le 26/09/2026",
   "nclc": {
    "source": "France Éducation international, correspondence between TCF results and NCLC levels",
    "levels": [
     "4",
     "5",
     "6",
     "7",
     "8",
     "9",
     "10+"
    ],
    "rows": [
     {
      "name": "Listening",
      "scores": [
       "331–368",
       "369–397",
       "398–457",
       "458–502",
       "503–522",
       "523–548",
       "549–699"
      ]
     },
     {
      "name": "Reading",
      "scores": [
       "342–374",
       "375–405",
       "406–452",
       "453–498",
       "499–523",
       "524–548",
       "549–699"
      ]
     },
     {
      "name": "Writing",
      "scores": [
       "4–5",
       "6",
       "7–9",
       "10–11",
       "12–13",
       "14–15",
       "16–20"
      ]
     },
     {
      "name": "Speaking",
      "scores": [
       "4–5",
       "6",
       "7–9",
       "10–11",
       "12–13",
       "14–15",
       "16–20"
      ]
     }
    ],
    "note": "Listening and Reading out of 699, Writing and Speaking out of 20.",
    "target": "Immigration programmes that score French usually ask for NCLC 7 in all four skills: a solid B2, not a low one. Check the current rules with the authority concerned."
   }
  },
  "tcf-quebec": {
   "name": "TCF Québec",
   "official": "Test de connaissance du français pour le Québec",
   "papers": [
    {
     "name": "Listening",
     "time": "25 min",
     "marks": null,
     "detail": "29 multiple-choice questions (4 choices), each recording heard once; difficulty rises from A1 to C2"
    },
    {
     "name": "Reading",
     "time": "45 min",
     "marks": null,
     "detail": "29 multiple-choice questions (4 choices), difficulty rises from A1 to C2"
    },
    {
     "name": "Writing",
     "marks": null,
     "time": "60 min",
     "detail": "3 tasks: a message (60 to 120 words); an article, letter or note (120 to 150 words); comparing two points of view, then your own (120 to 180 words)"
    },
    {
     "name": "Speaking",
     "marks": null,
     "time": "12 min",
     "detail": "3 tasks: guided interview; interaction after 2 minutes of preparation; expressing a point of view"
    }
   ],
   "pass": "No pass mark: each paper gives a CEFR level (A1 to C2) and a level of the Quebec scale; candidates choose which papers they take",
   "source": "France Éducation international et MIFI (novembre 2024) ; épreuves d’exemple officielles d’expression écrite (2022) et orale de France Éducation international"
  },
  "tcf-tp": {
   "name": "TCF tout public",
   "official": "Test de connaissance du français tout public",
   "papers": [
    {
     "name": "Listening",
     "time": "25 min",
     "marks": null,
     "detail": "29 multiple-choice questions (4 choices), each recording heard once; difficulty rises from A1 to C2"
    },
    {
     "name": "Language structures",
     "time": "15 min",
     "marks": null,
     "detail": "18 multiple-choice questions (4 choices), grammar and vocabulary; difficulty rises from A1 to C2"
    },
    {
     "name": "Reading",
     "time": "45 min",
     "marks": null,
     "detail": "29 multiple-choice questions (4 choices), difficulty rises from A1 to C2"
    },
    {
     "name": "Writing",
     "marks": null,
     "time": "60 min",
     "detail": "3 tasks: a message (60 to 120 words); an article, letter or note (120 to 150 words); comparing two points of view, then your own (120 to 180 words) (optional)"
    },
    {
     "name": "Speaking",
     "marks": null,
     "time": "12 min",
     "detail": "3 tasks: guided interview; interaction after 2 minutes of preparation; expressing a point of view (optional)"
    }
   ],
   "pass": "No pass mark: each paper gives a CEFR level (A1 to C2); Writing and Speaking are optional",
   "source": "France Éducation international et centres agréés ; épreuves d’exemple officielles d’expression écrite (2022) et orale de France Éducation international"
  },
  "tcf-dap": {
   "name": "TCF DAP",
   "official": "TCF pour la demande d’admission préalable",
   "papers": [
    {
     "name": "Listening",
     "time": "25 min",
     "marks": null,
     "detail": "29 multiple-choice questions (4 choices), each recording heard once; difficulty rises from A1 to C2"
    },
    {
     "name": "Language structures",
     "time": "15 min",
     "marks": null,
     "detail": "18 multiple-choice questions (4 choices), grammar and vocabulary; difficulty rises from A1 to C2"
    },
    {
     "name": "Reading",
     "time": "45 min",
     "marks": null,
     "detail": "29 multiple-choice questions (4 choices), difficulty rises from A1 to C2"
    },
    {
     "name": "Writing",
     "marks": null,
     "time": "60 min",
     "detail": "3 tasks: a message (60 to 120 words); an article, letter or note (120 to 150 words); comparing two points of view, then your own (120 to 180 words)"
    },
    {
     "name": "Speaking",
     "marks": null,
     "time": "12 min",
     "detail": "3 tasks: guided interview; interaction after 2 minutes of preparation; expressing a point of view (optional)"
    }
   ],
   "pass": "The TCF tout public with Writing compulsory, for a prior admission request to a university; each paper gives a CEFR level (A1 to C2)",
   "source": "France Éducation international et centres agréés ; épreuves d’exemple officielles d’expression écrite (2022) et orale de France Éducation international"
  },
  "tcf-irn": {
   "name": "TCF IRN",
   "official": "TCF pour l’intégration, la résidence et la nationalité",
   "papers": [
    {
     "name": "Listening",
     "time": "20 min",
     "marks": null,
     "detail": "25 multiple-choice questions (4 choices), each recording heard once; difficulty rises question by question"
    },
    {
     "name": "Reading",
     "time": "35 min",
     "marks": null,
     "detail": "25 multiple-choice questions (4 choices), difficulty rises question by question"
    },
    {
     "name": "Writing",
     "marks": null,
     "time": "30 min",
     "detail": "3 tasks: answering a short message (30 to 60 words); a message telling about an event (40 to 90 words); giving your opinion, for example on a forum (40 to 90 words)"
    },
    {
     "name": "Speaking",
     "marks": null,
     "time": "10 min",
     "detail": "3 tasks, no preparation: guided interview; interaction on a situation with pictures; expressing your tastes and opinions"
    }
   ],
   "pass": "No pass mark: each paper gives a CEFR level; 1 h 35 in all",
   "source": "France Éducation international, page officielle du TCF IRN (relevée le 16/10/2026 : 25 + 25 questions, 20 et 35 min, EE 3 exercices 30 min, EO 3 exercices 10 min, 1 h 35) et épreuves d’exemple officielles (2022, 2023). Questions de A1 à B2 : choix de l’atelier"
  }
 }
};
