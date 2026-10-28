# Pas à Pas French — learn French step by step

Vendeur : **Olivier Djoukang**, enseignant de français indépendant au Cameroun, sous le nom commercial Pas à Pas FRENCH (depuis le 18/10/2026 : Notch Pay n'ouvre de compte marchand qu'aux personnes physiques résidant en Afrique francophone). Clientèle : les anglophones du monde entier.

Site de vente de la méthode Pas à Pas : cours de français pour adultes anglophones, écrits par Olivier Djoukang. Site statique (HTML/CSS/JS, sans compilation), en anglais.

## Catalogue (faits confirmés le 14/10/2026)

17 produits, 88 modules et 11 bilans, de A0 à C1, vendus par paquets de 8 modules (B2 et C1 en vente le 28/10/2026).

| Produit | Contenu | Prix |
|---|---|---|
| A0 Complete | 8 modules + bilan | 19 $ / 10 400 FCFA |
| A1, A2, B1, B2, C1 Part 1 | modules 1–8 + bilan | 29 $ / 15 900 FCFA chacun |
| A1, A2, B1, B2, C1 Part 2 | modules 9–16 + bilan | 29 $ / 15 900 FCFA chacun |
| A1, A2, B1, B2, C1 Complete | parties 1 et 2 | 49 $ / 26 900 FCFA chacun |
| The Complete Method | A0 à B1, 56 modules, 7 bilans | 129 $ / 70 800 FCFA |
| DELF A1, DELF A2 | 5 packs de 6 sujets complets (aucune tâche commune) | 19 $ / 10 400 FCFA chacun |
| DELF B1, DELF B2 | 5 packs de 6 sujets complets (aucune tâche commune) | 25 $ / 13 700 FCFA chacun |
| TCF Canada, TCF Québec, TCF tout public, TCF DAP, TCF IRN | 5 packs de 6 sujets complets (aucune tâche commune) | 29 $ / 15 900 FCFA chacun (prix à revoir) |
| A0 Module 1 | module complet | gratuit, envoyé par e-mail |

- Un niveau complet coûte 9 $ (4 900 FCFA) de moins que ses deux parties. La Complete Method coûte 37 $ (20 300 FCFA) de moins que les quatre niveaux. Le site calcule ces économies à partir des prix, sans les saisir à la main.
- B2 et C1 sont en vente (mêmes prix que B1 : 29 $ la partie, 49 $ le niveau). La méthode complète reste A0 à B1 ; B2 et C1 se vendent à part. C2 est en préparation : affiché, mais non vendu. Les titres des modules B2 et C1 s’afficheront quand l’export de l’atelier (`catalogue.json`) les contiendra.
- **Précommandes** (16/10/2026) : A1 Part 2, A2, B1, les niveaux complets, la méthode complète et tous les packs d'examen sont `ready: false, preorder: true`. Bouton « Pre-order » : payé tout de suite, envoyé le jour où c'est prêt (les parties déjà prêtes partent aussitôt), annulable avec remboursement jusque-là, remboursé sans livraison sous 90 jours. Règles : `policies.html` (2 et 3) et `docs/serveur.md`.
- Sujets d'examen : DELF A1 à B2 et les cinq TCF, packs de 6 sujets (jusqu’à 5 par examen, 30 sujets tous différents) produits par l'atelier depuis ses réserves (sujet, correcteur, feuille de réponses, édition web qui note la compréhension écrite et orale, audio). DALF C1 et C2 restent « Coming soon » (pas encore de prix). Ce sont des sujets originaux au format officiel, jamais des épreuves officielles. Le format affiché sur chaque fiche est écrit par l'atelier (`js/exam-formats.js`, `delf.py --site`).
- Formats livrés : PDF « édition vendue » avec corrigé, accompagné de l'audio en MP3 et d'un mémo PDF ; édition web interactive, à faire en ligne sur le site, avec l'audio intégré à la page. Pas de vidéo. L'édition CLASSROOM n'est jamais vendue.
- Fichiers livrés : ventes définitives (fichier défectueux remplacé ou remboursé) ; précommandes annulables jusqu'à la livraison.

## Fonctionnalités

- Sélecteur de niveau A0 à C2 (B2 à C2 grisés « In preparation »), avec les packs, leurs descriptions, leurs prix et la liste de leurs modules (titres réels, tirés des sources par l'atelier)
- Bande « The Complete Method »
- Devises : dollar US et FCFA (XAF, XOF) au prix exact ; euro calculé depuis le FCFA (parité fixe 655,957) ; livre, dollars canadien, australien, néo-zélandais et singapourien, roupie, rand, naira, cédi, shilling kényan et peso philippin convertis depuis le dollar à des taux indicatifs, marqués « ≈ » et rafraîchis chaque jour (open.er-api.com, taux de secours dans le code). Pays de résidence : la liste complète des pays. La devise suit le pays du visiteur : d'abord la région du navigateur et le fuseau horaire, puis le pays de sa connexion via get.geojs.io (gratuit, sans clé). Un choix manuel du visiteur prime et est mémorisé. Cette consultation envoie l'adresse IP du visiteur à geojs : à mentionner dans la politique de confidentialité.
- Pays de résidence **détecté automatiquement** (connexion, puis navigateur), affiché dans la section Payment et à la caisse, avec la possibilité d'en choisir un autre (choix mémorisé ; il entraîne la devise du pays, sauf devise choisie à la main).
- Moyens de paiement : **seulement ceux du pays de résidence** de l'acheteur : carte bancaire (Visa, Mastercard) et PayPal partout ; MTN MoMo et Orange Money au Cameroun (montant en FCFA, numéro vérifié). Le serveur applique la même règle. Le formulaire de paiement est en place, mais n'encaisse rien : il annonce « Online payment opens soon » et propose d'envoyer la commande sur WhatsApp quand le numéro est renseigné.
- **Forfaits et abonnements de séances** (17/10/2026) : forfait de 5 séances (65 $, à programmer sur 2 mois) et trois abonnements de séances de 60 min renouvelés tous les 2 mois, compteur remis à zéro : Light 4 séances 52 $ / 28 400 FCFA, Steady 8 séances 96 $ / 52 500 FCFA (mis en avant, « Most popular »), Intensive 16 séances 176 $ / 96 300 FCFA. Résiliation en un clic, rappel 7 jours avant chaque renouvellement. Offre proposée juste après la réservation d'une séance à l'unité.
- **Réservation immédiate** (17/10/2026) : l'élève voit les heures libres d'Olivier, lues en direct par le serveur dans son Google Agenda (cours Preply compris), de 3 h à 14 jours à l'avance, en choisit une, paie : c'est réservé. La séance s'écrit dans un agenda Google « Pas à Pas » non relié à Preply ; Olivier reçoit une notification et bloque lui-même le créneau sur Preply (`docs/serveur.md`, `GET /slots`). Le parcours « proposer ses heures » ci-dessous reste en secours.
- **Séances en visio dans le site** (`js/live.js`) : 30 min 9 $ / 4 900 FCFA ; 60 min 15 $ / 8 200 FCFA ; 5 × 60 min 65 $ / 35 700 FCFA. Les disponibilités d'Olivier suivent celles de l'élève :
  1. l'élève propose **au moins 3 heures**, 3 au plus par jour, sans chevauchement selon la durée (6 sur 3 jours conseillées), entre 06:00 et 22:00 heure de Douala, affichées dans son fuseau ;
  2. Olivier reçoit un e-mail et **coche les heures qui lui conviennent** (`?olivier=<id>&key=…`) ;
  3. l'élève reçoit un e-mail, choisit une de ces heures et paie (`?lesson=<id>&key=…`) ;
  4. « My live lessons » affiche le compte à rebours ; **Join** s'active 10 min avant ; la salle vidéo s'ouvre dans la page avec un minuteur (temps restant, alerte à 5 min).
  Un pack donne 4 séances de plus sans repayer. Échange gratuit possible avant de réserver.
- **Paiement par le site** : avec `SHOP.api` renseigné, « Pay » ouvre la page Notch Pay (carte, MTN MoMo, Orange Money) et le site confirme au retour. Contrat du serveur : [`docs/serveur.md`](docs/serveur.md).
- **Mode démo** : ajouter `?demo` à l'adresse pour essayer achats et séances sans payer (réservations gardées dans ce navigateur).
- **Module A0-1 gratuit** : formulaire (prénom, e-mail, case marketing décochée) ; le serveur envoie aussitôt le module avec un message de présentation de la méthode (`emails/module-gratuit.html` et `.txt`).
- **Avis clients, sans intervention** : après chaque achat, l'acheteur reçoit un lien personnel (`?review=<jeton>`). Son avis est publié aussitôt, **quelle que soit la note**, s'il passe le filtre automatique de `js/review-filter.js` (insultes, liens, coordonnées, majuscules, longueur). Retenir les avis négatifs est interdit (règle de la FTC aux États-Unis, directive Omnibus dans l'UE) et contraire aux règles de Google. La section reste masquée tant qu'aucun avis n'existe.
- **Politiques du site** (`policies.html`) : vendeur, conditions de vente, remboursement et rétractation, licence (enseignants d'autres plateformes : usage personnel), séances, sujets d'examen, avis, confidentialité, cookies, droit applicable. Une case « terms » obligatoire au paiement.
- **Protection contre la fraude** : chaque copie vendue est tatouée au nom de l'acheteur par l'atelier (`tatouer.py`), liens de téléchargement personnels et limités, traçage des fuites (`tracer.py`) et modèle de demande de retrait : [`docs/protection.md`](docs/protection.md), règles du serveur dans [`docs/serveur.md`](docs/serveur.md).
- **E-mails** : envoyés par Gmail depuis l'alias de la boutique ; modèles dans `emails/`.
- Test de niveau tiré des bilans de la méthode, étape par étape de A0 à B1, qui recommande le pack par lequel commencer (`js/leveltest.js`, généré : `python tools/importer_test.py <atelier>/livraison/Pas-a-Pas-Level-Check.json`)
- Sections : contenu d'un module (audio inclus), comparatif, examens (guide « quel examen », diplôme ou test, « êtes-vous prêt ? », fiches DELF, TCF et DALF), séances, auteur, paiement, bandeau « Not sure where to start? », avis, FAQ

## Personnaliser

| Quoi | Où |
|---|---|
| Produits, descriptions, prix, niveaux, séances en direct | `js/products.js` |
| Heures possibles des séances, minimum de 3 heures, 3 par jour au plus, délais, visio (JaaS) | `LIVE_CONFIG` en haut de `js/live.js` |
| Textes des politiques | `policies.html` |
| Titres des modules | `js/modules.js`, **généré** : `python tools/importer_catalogue.py <atelier>/livraison/site/catalogue.json` après « Exporter pour le site » dans l'atelier, ou, si l'export oublie un niveau, `python tools/importer_stock.py <atelier>/livraison/boutique/stock-prive` (lit le `<h1>` des éditions en ligne vendues). Aucun des deux n'efface un produit absent de sa source. |
| E-mail (alias Gmail), WhatsApp, adresse du serveur, identité du vendeur | `js/shop.js` (les champs vides restent masqués) |
| Questions du test | `js/leveltest.js`, **généré** depuis l'atelier (`tools/importer_test.py`) |
| Avis clients | automatiques (serveur) ; filtre dans `js/review-filter.js` ; avis recueillis ailleurs dans `js/reviews.js` |
| E-mails envoyés par le serveur | `emails/` |
| Devises, taux indicatifs, pays, moyens de paiement | `CURRENCIES`, `COUNTRIES`, `PAY_METHODS` dans `js/app.js` |
| Couleurs et typographies | variables `:root` de `css/style.css` |

## Mise en ligne

GitHub Pages, branche `main` : https://olivierdjoukang243.github.io/Pas-pas/

**Version des fichiers.** `index.html` et `policies.html` appellent `css/style.css?v=…` et
`js/*.js?v=…`. À chaque modification du CSS ou d'un script, changez ce numéro (le même
partout) : sans lui, un téléphone peut garder l'ancien CSS en mémoire avec la nouvelle page,
et l'afficher en vrac.

## Ce qui manque pour vendre

Le bouton « Buy » ouvre pour l'instant une fenêtre « Online checkout opens soon » : aucun paiement n'est encaissé. Restent à fournir ou à construire :
1. Le compte Notch Pay (carte et mobile money au Cameroun) et le serveur décrit dans [`docs/serveur.md`](docs/serveur.md), puis renseigner `SHOP.api`. Le compte JaaS pour la visio, puis `LIVE_CONFIG.video.appId`.
   Les disponibilités de `LIVE_CONFIG.weekly` sont un **exemple** (lun.–ven. 18 h–21 h, sam. 9 h–13 h, heure de Douala) : à confirmer.
   D'après les notes du projet, PayPal (comme Stripe) n'accepte pas un vendeur basé au Cameroun : à confirmer avant d'ouvrir les paiements, sinon retirer PayPal de `PAY_METHODS`.
2. Un serveur de livraison : webhook de paiement, puis lien de téléchargement signé et limité dans le temps (PDF, MP3, mémo).
   Les éditions web se font en ligne sur le site : elles doivent être servies derrière un accès acheteur, pas en fichiers publics. GitHub Pages ne sait pas protéger un contenu payant.
3. Le stockage privé des fichiers.
4. Le nom de domaine, l'adresse e-mail dédiée et le numéro WhatsApp.
5. Les pages légales : conditions de vente et confidentialité.
6. ~~Les titres des 56 modules~~ : importés depuis l'atelier (`js/modules.js`).
7. Les noms définitifs des fichiers à livrer, fixés au moment de la mise en ligne.
