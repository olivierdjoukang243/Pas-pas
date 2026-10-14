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

## 3. Notre positionnement : « Pas-à-Pas French »

| Levier | Ce que fait le site |
|---|---|
| Parcours complet A0 → C2 | 7 niveaux découpés en 38 modules ; achat au module ou au niveau complet (−30 %) |
| Expliqué en anglais | Interface et cours en anglais, pour un public anglophone international |
| Examens | Sujets au format officiel DELF (A1–B2), DALF (C1–C2), TCF Tout public et TCF Canada |
| Entraînement | Sujets d'entraînement simples pour chaque niveau, entre les modules |
| Test de niveau gratuit | 15 questions, niveau A0 à C1 et module recommandé : il sert à capter des prospects |
| Paiement | International : carte et PayPal. Cameroun : MTN MoMo et Orange Money en FCFA |
| Achat unique, accès à vie | Pas d'abonnement obligatoire ; passage au niveau complet en payant la différence |

## 4. À faire avant le lancement

- Remplacer le catalogue d'exemple (`js/products.js`) par vos vrais produits, contenus et prix.
- Mettre votre numéro WhatsApp dans `js/app.js`.
- Brancher un vrai paiement : CinetPay, Campay ou NotchPay pour MTN MoMo et Orange Money au Cameroun ; Stripe ou PayPal à l'international.
- Mettre à jour les taux de change NGN, GHS, USD, CAD et GBP (le FCFA a une parité fixe).
- Ne publier que de **vrais** avis clients, une fois les premières ventes faites.
- Mentions légales, conditions de vente et politique de remboursement.
- DELF, DALF et TCF appartiennent à France Éducation international : vendre des **sujets originaux** au format officiel, jamais des copies des épreuves officielles, et rester « préparation indépendante » (mention déjà en pied de page).

### Sources
- https://www.italki.com/en/blog/best-online-platform-to-learn-french
- https://praktika.ai/blog/best-language-learning-app-2026-ranked-french
- https://toolradar.com/guides/best-apps-to-learn-french
- https://preply.com/en/online/tutors-tcf
- https://www.frenchwithchadi.com/online-vip-courses
- https://frenchclassesonlinevoila.com/?p=1667
