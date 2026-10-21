// Écrit par delf.py --site-fr depuis NORMES (atelier). Ne pas modifier à la main.
const EXAM_FORMATS_FR = {
 "source": "France Éducation international, « Évolution des épreuves du DELF et du DALF », version actualisée du 24/06/2024 ; productions et durées : sujets d’exemple tout public",
 "checked": "2026-10-15",
 "delf": {
  "A1": {
   "name": "DELF A1",
   "written": "1 h 20 min",
   "papers": [
    {
     "name": "Compréhension de l’oral",
     "time": "20 min environ",
     "marks": 25,
     "detail": "5 exercices, 21 questions : QCM, QCM à images, appariement, oui/non ; aucune question ouverte"
    },
    {
     "name": "Compréhension des écrits",
     "time": "30 min",
     "marks": 25,
     "detail": "4 exercices, 20 questions : QCM à images, QCM ; aucune question ouverte"
    },
    {
     "name": "Production écrite",
     "time": "30 min",
     "marks": 25,
     "detail": "Épreuve en deux parties : compléter une fiche, un formulaire ; rédiger un message simple (courriel, carte postale, invitation) sur un sujet de la vie quotidienne."
    },
    {
     "name": "Production orale",
     "time": "5 à 7 min",
     "marks": 25,
     "prep": "10 min",
     "detail": "Épreuve en trois parties : entretien dirigé ; échange d’informations ; dialogue simulé."
    }
   ],
   "pass": "Réussite : 50/100, avec au moins 5/25 dans chaque épreuve"
  },
  "A2": {
   "name": "DELF A2",
   "written": "1 h 40 min",
   "papers": [
    {
     "name": "Compréhension de l’oral",
     "time": "25 min environ",
     "marks": 25,
     "detail": "4 exercices, 22 questions : QCM à images, QCM, appariement ; aucune question ouverte"
    },
    {
     "name": "Compréhension des écrits",
     "time": "30 min",
     "marks": 25,
     "detail": "4 exercices, 23 questions : appariement, QCM à images, QCM, vrai/faux ; aucune question ouverte"
    },
    {
     "name": "Production écrite",
     "time": "45 min",
     "marks": 25,
     "detail": "Rédaction de deux brèves productions écrites (lettre amicale ou message) : décrire un événement ou des expériences personnelles ; écrire pour inviter, remercier, s’excuser, demander, informer, féliciter."
    },
    {
     "name": "Production orale",
     "time": "6 à 8 min",
     "marks": 25,
     "prep": "10 min",
     "detail": "Épreuve en trois parties : entretien dirigé ; monologue suivi ; exercice en interaction."
    }
   ],
   "pass": "Réussite : 50/100, avec au moins 5/25 dans chaque épreuve"
  },
  "B1": {
   "name": "DELF B1",
   "written": "1 h 55 min",
   "papers": [
    {
     "name": "Compréhension de l’oral",
     "time": "25 min environ",
     "marks": 25,
     "detail": "3 exercices, 20 questions : QCM ; aucune question ouverte"
    },
    {
     "name": "Compréhension des écrits",
     "time": "45 min",
     "marks": 25,
     "detail": "3 exercices, 30 questions : oui/non, QCM, vrai/faux ; aucune question ouverte"
    },
    {
     "name": "Production écrite",
     "time": "45 min",
     "marks": 25,
     "detail": "Expression d’une attitude personnelle sur un thème général (essai, courrier, article…)."
    },
    {
     "name": "Production orale",
     "time": "15 min environ",
     "marks": 25,
     "prep": "10 min (partie 3)",
     "detail": "Épreuve en trois parties : entretien dirigé ; exercice en interaction ; expression d’un point de vue à partir d’un document déclencheur."
    }
   ],
   "pass": "Réussite : 50/100, avec au moins 5/25 dans chaque épreuve"
  },
  "B2": {
   "name": "DELF B2",
   "written": "2 h 30 min",
   "papers": [
    {
     "name": "Compréhension de l’oral",
     "time": "30 min environ",
     "marks": 25,
     "detail": "3 exercices, 20 questions : QCM ; aucune question ouverte"
    },
    {
     "name": "Compréhension des écrits",
     "time": "60 min",
     "marks": 25,
     "detail": "3 exercices, 20 questions : QCM ; aucune question ouverte"
    },
    {
     "name": "Production écrite",
     "time": "60 min",
     "marks": 25,
     "detail": "Prise de position personnelle argumentée (contribution à un débat, lettre formelle, article critique…)."
    },
    {
     "name": "Production orale",
     "time": "20 min",
     "marks": 25,
     "prep": "30 min",
     "detail": "Présentation et défense d’un point de vue à partir d’un court document déclencheur."
    }
   ],
   "pass": "Réussite : 50/100, avec au moins 5/25 dans chaque épreuve"
  }
 },
 "dalf": {
  "C1": {
   "name": "DALF C1",
   "written": "4 h",
   "papers": [
    {
     "name": "Compréhension de l’oral",
     "time": "40 min environ",
     "marks": 25,
     "detail": "Deux exercices : un document long (entretien, cours, conférence), deux écoutes ; deux documents courts (flashs d’information, sondages), une seule écoute."
    },
    {
     "name": "Compréhension des écrits",
     "time": "50 min",
     "marks": 25,
     "detail": "Un exercice de compréhension portant sur un texte d’idées, littéraire ou journalistique."
    },
    {
     "name": "Production écrite",
     "time": "2 h 30",
     "marks": 25,
     "detail": "Deux exercices : une synthèse de documents, puis un essai argumenté sur le même thème."
    },
    {
     "name": "Production orale",
     "time": "30 min",
     "marks": 25,
     "prep": "1 h",
     "detail": "Exposé : défense d’un point de vue argumenté à partir d’un document déclencheur, puis entretien avec le jury."
    }
   ],
   "pass": "Réussite : 50/100, avec au moins 5/25 dans chaque épreuve",
   "source": "France Éducation international, Manuel du candidat DALF C1, juillet 2022"
  },
  "C2": {
   "name": "DALF C2",
   "written": "3 h 30 min",
   "papers": [
    {
     "name": "Compréhension et production écrites",
     "time": "3 h 30",
     "marks": 50,
     "detail": "Production d’un texte structuré (article, éditorial, rapport, discours…) à partir d’un dossier de documents d’environ 2000 mots."
    },
    {
     "name": "Compréhension et production orales",
     "time": "30 min",
     "marks": 50,
     "prep": "1 h",
     "detail": "Compte rendu du contenu de documents sonores (deux écoutes), puis exposé argumenté et débat avec le jury."
    }
   ],
   "pass": "Réussite : 50/100, avec au moins 10/50 dans chaque épreuve",
   "source": "France Éducation international, format relevé le 27/09/2026"
  }
 },
 "tcf": {
  "tcf-canada": {
   "name": "TCF Canada",
   "official": "Test de connaissance du français pour le Canada",
   "papers": [
    {
     "name": "Compréhension orale",
     "time": "35 min",
     "marks": null,
     "detail": "39 questions à choix multiple (4 choix), chaque enregistrement entendu une fois ; difficulté croissante de A1 à C2"
    },
    {
     "name": "Compréhension écrite",
     "time": "60 min",
     "marks": null,
     "detail": "39 questions à choix multiple (4 choix), difficulté croissante de A1 à C2"
    },
    {
     "name": "Expression écrite",
     "marks": null,
     "time": "60 min",
     "detail": "3 tâches : écrire un message à un ou plusieurs destinataires (60 à 120 mots) ; écrire un article, un courrier ou une note pour plusieurs lecteurs (120 à 150 mots) ; comparer deux points de vue, puis prendre position (120 à 180 mots)"
    },
    {
     "name": "Expression orale",
     "marks": null,
     "time": "12 min",
     "detail": "3 tâches : entretien dirigé, sans préparation ; exercice en interaction, avec préparation ; expression d’un point de vue, sans préparation"
    }
   ],
   "pass": "Pas de note de réussite : chaque épreuve donne un niveau du Cadre européen (A1 à C2), converti en niveau NCLC",
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
      "name": "Compréhension orale",
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
      "name": "Compréhension écrite",
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
      "name": "Expression écrite",
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
      "name": "Expression orale",
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
    "note": "Compréhensions sur 699, expressions sur 20.",
    "target": "Les programmes d’immigration qui évaluent le français demandent souvent le NCLC 7 dans les quatre compétences : un B2 solide, pas un B2 juste. Vérifiez les règles en vigueur auprès de l’autorité concernée."
   }
  },
  "tcf-quebec": {
   "name": "TCF Québec",
   "official": "Test de connaissance du français pour le Québec",
   "papers": [
    {
     "name": "Compréhension orale",
     "time": "25 min",
     "marks": null,
     "detail": "29 questions à choix multiple (4 choix), chaque enregistrement entendu une fois ; difficulté croissante de A1 à C2"
    },
    {
     "name": "Compréhension écrite",
     "time": "45 min",
     "marks": null,
     "detail": "29 questions à choix multiple (4 choix), difficulté croissante de A1 à C2"
    },
    {
     "name": "Expression écrite",
     "marks": null,
     "time": "60 min",
     "detail": "3 tâches : écrire un message à un ou plusieurs destinataires (60 à 120 mots) ; écrire un article, un courrier ou une note pour plusieurs lecteurs (120 à 150 mots) ; comparer deux points de vue, puis prendre position (120 à 180 mots)"
    },
    {
     "name": "Expression orale",
     "marks": null,
     "time": "12 min",
     "detail": "3 tâches : entretien dirigé, sans préparation ; exercice en interaction, avec préparation ; expression d’un point de vue, sans préparation"
    }
   ],
   "pass": "Pas de note de réussite : chaque épreuve donne un niveau du Cadre européen (A1 à C2) et un niveau de l’Échelle québécoise. Le candidat choisit les épreuves qu’il passe",
   "source": "France Éducation international et MIFI (novembre 2024) ; épreuves d’exemple officielles d’expression écrite (2022) et orale de France Éducation international"
  },
  "tcf-tp": {
   "name": "TCF tout public",
   "official": "Test de connaissance du français tout public",
   "papers": [
    {
     "name": "Compréhension orale",
     "time": "25 min",
     "marks": null,
     "detail": "29 questions à choix multiple (4 choix), chaque enregistrement entendu une fois ; difficulté croissante de A1 à C2"
    },
    {
     "name": "Maîtrise des structures de la langue",
     "time": "15 min",
     "marks": null,
     "detail": "18 questions à choix multiple (4 choix), grammaire et lexique ; difficulté croissante de A1 à C2"
    },
    {
     "name": "Compréhension écrite",
     "time": "45 min",
     "marks": null,
     "detail": "29 questions à choix multiple (4 choix), difficulté croissante de A1 à C2"
    },
    {
     "name": "Expression écrite",
     "marks": null,
     "time": "60 min",
     "detail": "3 tâches : écrire un message à un ou plusieurs destinataires (60 à 120 mots) ; écrire un article, un courrier ou une note pour plusieurs lecteurs (120 à 150 mots) ; comparer deux points de vue, puis prendre position (120 à 180 mots) (facultative)"
    },
    {
     "name": "Expression orale",
     "marks": null,
     "time": "12 min",
     "detail": "3 tâches : entretien dirigé, sans préparation ; exercice en interaction, avec préparation ; expression d’un point de vue, sans préparation (facultative)"
    }
   ],
   "pass": "Pas de note de réussite : chaque épreuve donne un niveau du Cadre européen (A1 à C2). Expression écrite et expression orale sont facultatives",
   "source": "France Éducation international et centres agréés ; épreuves d’exemple officielles d’expression écrite (2022) et orale de France Éducation international"
  },
  "tcf-dap": {
   "name": "TCF DAP",
   "official": "TCF pour la demande d’admission préalable",
   "papers": [
    {
     "name": "Compréhension orale",
     "time": "25 min",
     "marks": null,
     "detail": "29 questions à choix multiple (4 choix), chaque enregistrement entendu une fois ; difficulté croissante de A1 à C2"
    },
    {
     "name": "Maîtrise des structures de la langue",
     "time": "15 min",
     "marks": null,
     "detail": "18 questions à choix multiple (4 choix), grammaire et lexique ; difficulté croissante de A1 à C2"
    },
    {
     "name": "Compréhension écrite",
     "time": "45 min",
     "marks": null,
     "detail": "29 questions à choix multiple (4 choix), difficulté croissante de A1 à C2"
    },
    {
     "name": "Expression écrite",
     "marks": null,
     "time": "60 min",
     "detail": "3 tâches : écrire un message à un ou plusieurs destinataires (60 à 120 mots) ; écrire un article, un courrier ou une note pour plusieurs lecteurs (120 à 150 mots) ; comparer deux points de vue, puis prendre position (120 à 180 mots)"
    },
    {
     "name": "Expression orale",
     "marks": null,
     "time": "12 min",
     "detail": "3 tâches : entretien dirigé, sans préparation ; exercice en interaction, avec préparation ; expression d’un point de vue, sans préparation (facultative)"
    }
   ],
   "pass": "Le TCF tout public avec l’expression écrite obligatoire, pour une demande d’admission préalable à l’université. Chaque épreuve donne un niveau du Cadre européen (A1 à C2)",
   "source": "France Éducation international et centres agréés ; épreuves d’exemple officielles d’expression écrite (2022) et orale de France Éducation international"
  },
  "tcf-irn": {
   "name": "TCF IRN",
   "official": "TCF pour l’intégration, la résidence et la nationalité",
   "papers": [
    {
     "name": "Compréhension orale",
     "time": "20 min",
     "marks": null,
     "detail": "25 questions à choix multiple (4 choix), chaque enregistrement entendu une fois ; difficulté croissante, question après question"
    },
    {
     "name": "Compréhension écrite",
     "time": "35 min",
     "marks": null,
     "detail": "25 questions à choix multiple (4 choix), difficulté croissante, question après question"
    },
    {
     "name": "Expression écrite",
     "marks": null,
     "time": "30 min",
     "detail": "3 tâches : répondre à un message court (décrire, informer) (30 à 60 mots) ; écrire un message pour raconter un événement (40 à 90 mots) ; donner son opinion (par exemple sur un forum) (40 à 90 mots)"
    },
    {
     "name": "Expression orale",
     "marks": null,
     "time": "10 min",
     "detail": "3 tâches : entretien dirigé, sans préparation ; exercice en interaction sur une situation, avec images, sans préparation ; exprimer ses goûts, ses opinions, sans préparation"
    }
   ],
   "pass": "Intégration, résidence et nationalité. Chaque épreuve donne un niveau du Cadre européen, jusqu’au B2",
   "source": "France Éducation international, page officielle du TCF IRN (relevée le 16/10/2026 : 25 + 25 questions, 20 et 35 min, EE 3 exercices 30 min, EO 3 exercices 10 min, 1 h 35) et épreuves d’exemple officielles (2022, 2023). Questions de A1 à B2 : choix de l’atelier"
  }
 }
};
