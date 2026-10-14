# Analyse concurrentielle — outils numériques pour apprendre le français (public anglophone)

## 1. Qui vend déjà quoi

| Acteur | Modèle | Points forts | Limites pour notre cible |
|---|---|---|---|
| **Duolingo** | Application gratuite + abonnement « Super » (~7 $/mois, prix variable selon le pays) | Gratuit, ludique, très connu | Peu d'explications de grammaire ; ne prépare pas aux examens (TCF, TEF, DELF) |
| **Babbel** | Abonnement (~9 à 13 $/mois selon la durée) | Cours structurés pour adultes | Paiement par carte uniquement, en devises fortes ; pas de préparation TCF/TEF Canada |
| **Pimsleur** | Abonnement audio (~15 à 20 $/mois) | Oral, prononciation | Cher, centré audio, pas d'écrit ni d'examens |
| **italki / Preply** | Places de marché de professeurs (de 4 à 60 $ l'heure) | Cours humains, beaucoup de professeurs camerounais bilingues spécialisés TCF/TEF | Qualité variable ; on paie à l'heure, rien n'est conservé ; pas de supports structurés |
| **Formations TCF Canada en ligne** (ex. French with Chadi, Voilà) | Cours intensifs et simulations | Spécialisés Canada | Prix élevés, en devises fortes, peu adaptés à l'Afrique anglophone |

## 2. Les manques du marché

1. **Payer en Afrique** : personne ne propose le Mobile Money (MTN MoMo, Orange Money, Wave, Airtel) ni des prix en FCFA, en nairas ou en cédis.
2. **Les abonnements fatiguent** : la clientèle préfère payer une fois et garder ses fichiers.
3. **La connexion coûte cher** : il faut des contenus téléchargeables (PDF, MP3) qui marchent hors ligne.
4. **Expliquer en anglais** : les applications enseignent « en immersion » ; un anglophone veut comprendre la règle dans sa langue.
5. **L'immigration au Canada** : la demande TCF/TEF Canada est forte, mais les simulations avec correspondance NCLC sont rares et chères.
6. **Aucun retour humain** dans les applications sur l'oral et l'écrit, alors que ce sont les épreuves qui font échouer.

## 3. Notre positionnement : « Pas à Pas French »

Mis à jour le 14/10/2026 d'après les faits confirmés (voir le README).

| Levier | Ce que fait la méthode |
|---|---|
| Parcours structuré A0 → B1 | 56 modules et 7 bilans, en paquets de 8 modules ; B2 à C2 en préparation |
| Expliqué en anglais | Grammaire en anglais ; consignes en français à partir de l'A1 |
| Corrigés complets | 9 exercices ou plus par module, test sur 20, bilan de niveau qui nomme ce qu'il faut réviser |
| Écrit de zéro | Aucun contenu adapté d'un manuel existant ; personnages récurrents Léa, Thomas et Amina |
| Achat unique | Pas d'abonnement ; niveau complet et méthode complète moins chers que les parties |
| Prix en $ et en FCFA | Deux grilles fixes, FCFA par défaut en Afrique |
| Examens | Sujets DELF, DALF et TCF produits par l'atelier, en vente prochainement |

## 4. À faire avant le lancement

- Choisir le prestataire de paiement (Notch Pay en piste principale) et construire la livraison automatique.
- Fournir le domaine, l'adresse e-mail dédiée, le numéro WhatsApp et les titres des 56 modules.
- Rédiger les conditions de vente (ventes définitives) et la politique de confidentialité.
- Ne publier que de vrais avis clients, une fois les premières ventes faites.
- DELF et TCF appartiennent à France Éducation international : vendre des sujets originaux au format officiel, jamais des copies des épreuves.

### Sources
- https://www.italki.com/en/blog/best-online-platform-to-learn-french
- https://praktika.ai/blog/best-language-learning-app-2026-ranked-french
- https://toolradar.com/guides/best-apps-to-learn-french
- https://preply.com/en/online/tutors-tcf
- https://www.frenchwithchadi.com/online-vip-courses
- https://frenchclassesonlinevoila.com/?p=1667

## 5. Où en est le site face à la concurrence (14/10/2026)

| Ce que font les meilleurs | Pas à Pas FRENCH |
|---|---|
| Test de niveau gratuit | Oui : questions tirées des 7 bilans de la méthode, étape par étape de A0 à B1, avec le produit par lequel commencer |
| Aperçu avant achat | A0 Module 1 complet offert, envoyé par e-mail avec un message de présentation ; liste des 56 modules |
| Prix clairs, dans la devise du visiteur | Oui : devise selon le pays, $ et FCFA fixes, économies calculées |
| Paiement local | Oui : seulement les moyens du pays de résidence (carte et PayPal partout, MTN MoMo et Orange Money au Cameroun), actifs avec le serveur Notch Pay |
| Cours avec un professeur | Oui : séances en visio dans le site, réservation sur les disponibilités, minuteur, packs |
| Comparatif avec les alternatives | Oui : tableau « How it compares » (catégories, pas de marques) |
| Préparation aux examens | DELF A1 à B2 et TCF Canada en vente ; DALF « Coming soon » |
| Avis clients | Publication automatique des avis d'acheteurs vérifiés, quelle que soit la note, avec un filtre de forme ; la section apparaît au premier avis |
| Cours avec un professeur : choix de l'heure | L'élève propose 6 heures sur 3 jours, Olivier coche, l'élève choisit et paie |
| Politiques claires | Page `policies.html` : vente, remboursement, licence, séances, avis, confidentialité |
| Enseignants d'autres plateformes | Bienvenus, pour leur usage personnel (licence) |
| Garantie de remboursement | Non (ventes définitives) ; compensé par le test, l'aperçu et l'échange avant achat |

### Ce qui reste
1. **Les premiers avis réels** : à ajouter dans `js/reviews.js` dès la première vente, avec l'accord de l'élève.
2. **Un nom de domaine et une adresse e-mail** propres, à l'hébergement (prévu par Olivier).
3. **Le serveur** (paiement Notch Pay, e-mails Brevo, visio JaaS) : tout est décrit dans `docs/serveur.md`.
