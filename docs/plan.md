# Plan de lancement de Pas à Pas FRENCH

On avance une étape à la fois. Une étape n'est cochée qu'une fois son résultat vérifié.
« Olivier » : c'est à vous. « Claude » : c'est à moi. « Ensemble » : vous me donnez
l'information, je fais le reste.

État au 15/10/2026 : le site et l'atelier sont à jour sur GitHub (`main`).

---

## Phase 1 — Le contenu prêt à vendre

| # | Étape | Qui | Résultat attendu |
|---|---|---|---|
| 1.1 | Dans `C:\projets\PasAPas` : `git pull`, puis `pip install pypdf reportlab cryptography` | Olivier | `git log --oneline -1` affiche `9c6f3ea` ; aucune erreur à l'installation |
| 1.2 | Panneau → **« Tout le catalogue (A0 à B1) »**, sur un PC qu'on peut laisser tourner environ une heure | Olivier | « TERMINÉ » ; la liste des « à revoir » m'est envoyée |
| 1.3 | Traiter les « à revoir » de l'étape 1.2 | Ensemble | Plus aucun « à revoir » |
| 1.4 | Panneau → **« Voix de synthèse »** pour les 50 pistes des sujets d'examen (plan et coût d'abord, puis génération) | Olivier | Les 50 MP3 sont dans `audio/` |
| 1.5 | Produire les packs DELF A1 à B2 et TCF Canada (commandes du LISEZ-MOI de l'atelier) | Olivier | 5 dossiers dans `livraison/packs/` |
| 1.6 | Panneau → **« Exporter pour le site »**, puis **« Test de positionnement »** | Olivier | `livraison/site/` et `Pas-a-Pas-Level-Check.json` existent |
| 1.7 | Importer dans le site les titres et le test à partir de ces exports | Claude | Le site affiche les titres et les questions à jour |
| 1.8 | Donner au projet Claude chat la présentation exacte : « Qualified teacher · in person since 2011 · 7,800+ lessons online since 2023 » | Olivier | Les nouvelles sources arrivent justes |

## Phase 2 — L'identité et les comptes

| # | Étape | Qui | Résultat attendu |
|---|---|---|---|
| 2.1 | Choisir et acheter le nom de domaine (environ 10 à 15 $ par an) | Olivier | Le domaine est à vous |
| 2.2 | Brancher le domaine sur le site (GitHub Pages reste gratuit) | Ensemble | Le site s'ouvre à la nouvelle adresse, en https |
| 2.3 | Google Workspace sur le domaine, puis l'alias de contact (par exemple `hello@…`) | Olivier | Un e-mail envoyé à l'alias arrive dans votre boîte |
| 2.4 | Mettre l'alias et le numéro WhatsApp dans `js/shop.js` | Claude | Les boutons « contact » et « WhatsApp » apparaissent sur le site |
| 2.5 | Faire corriger l'activité déclarée de Nuvalex (« cours de français en ligne », au lieu de « health and wellness products ») | Olivier, avec l'agent ou l'IRS | Une confirmation écrite |

## Phase 3 — Ouvrir les ventes sans attendre le serveur

| # | Étape | Qui | Résultat attendu |
|---|---|---|---|
| 3.1 | Ajouter à l'atelier la fabrication d'un .zip par produit (11 produits du cours + 5 packs d'examen) | Claude | Une carte « Paquets pour la boutique » dans le panneau |
| 3.2 | Créer le compte Payhip au nom de Nuvalex LLC (vérifier d'abord frais et conditions sur payhip.com) | Olivier | Le compte est validé |
| 3.3 | Créer les 16 produits sur Payhip : zip, prix en dollars, impression du nom de l'acheteur dans les PDF activée ; plus le Module 1 gratuit | Olivier | 17 liens de produit |
| 3.4 | Brancher les boutons « Buy » et « Get Module 1 free » sur ces liens | Claude | Un achat test réussit de bout en bout |
| 3.5 | Vérifier chez Notch Pay que Nuvalex (ou vous, au Cameroun) peut encaisser MoMo et Orange Money par lien de paiement | Olivier | Un lien de paiement fonctionne |
| 3.6 | Brancher MoMo et Orange Money sur ce lien ; livraison à la main, avec `tatouer.py` | Ensemble | Un achat test MoMo réussit |
| 3.7 | Séances en attendant le serveur : la demande d'heures part sur WhatsApp ou par e-mail | Claude | Une demande test vous arrive |
| 3.8 | Relecture finale, puis ouverture : un premier achat réel | Ensemble | La première vente |

## Phase 4 — Le serveur : tout automatique

| # | Étape | Qui | Résultat attendu |
|---|---|---|---|
| 4.1 | Choisir l'hébergement du serveur (piste : Cloudflare Workers + D1, peu cher) et créer le compte | Ensemble | Le compte est ouvert |
| 4.2 | Écrire le serveur selon `docs/serveur.md` : réservations, réponses d'Olivier, e-mails Gmail, avis, tatouage à la livraison | Claude | Tests réussis en démo |
| 4.3 | Compte JaaS pour la visio, puis `LIVE_CONFIG.video.appId` | Olivier puis Claude | Une séance test en visio, avec le minuteur |
| 4.4 | Mise en service : le site passe du mode « ouverture prochaine » au mode réel (`SHOP.api`) | Claude | Séance réservée, payée et rejointe de bout en bout |

## Phase 5 — Après le lancement

| # | Étape | Qui |
|---|---|---|
| 5.1 | Déposer la méthode au US Copyright Office (45 à 65 $ par dépôt, un niveau entier peut tenir en un seul) | Olivier |
| 5.2 | Suivre les premiers avis (ils se publient seuls) et y répondre si besoin | Olivier |
| 5.3 | Ajouter les sources B2 au fur et à mesure qu'elles sont écrites, puis les mettre en vente | Ensemble |
| 5.4 | DALF, quand l'atelier aura ses réserves C1 et C2 | Ensemble |
| 5.5 | Faire connaître le site : Module 1 gratuit, réseaux sociaux, groupes d'apprenants | Ensemble |
