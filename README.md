# Pas à Pas French — learn French step by step

Site de vente de la méthode Pas à Pas : cours de français pour adultes anglophones, écrits par Olivier Djoukang. Site statique (HTML/CSS/JS, sans compilation), en anglais.

## Catalogue (faits confirmés le 14/10/2026)

11 produits, 56 modules et 7 bilans, de A0 à B1, vendus par paquets de 8 modules.

| Produit | Contenu | Prix |
|---|---|---|
| A0 Complete | 8 modules + bilan | 19 $ / 10 400 FCFA |
| A1, A2, B1 Part 1 | modules 1–8 + bilan | 29 $ / 15 900 FCFA chacun |
| A1, A2, B1 Part 2 | modules 9–16 + bilan | 29 $ / 15 900 FCFA chacun |
| A1, A2, B1 Complete | parties 1 et 2 | 49 $ / 26 900 FCFA chacun |
| The Complete Method | A0 à B1, 56 modules, 7 bilans | 129 $ / 70 800 FCFA |

- Un niveau complet coûte 9 $ (4 900 FCFA) de moins que ses deux parties. La Complete Method coûte 37 $ (20 300 FCFA) de moins que les quatre niveaux. Le site calcule ces économies à partir des prix, sans les saisir à la main.
- B2, C1 et C2 sont en préparation (B2 partie 1 commencé) : affichés, mais non vendus.
- Sujets d'examen DELF (A1–B2), DALF (C1–C2) et TCF (dont TCF Canada) : l'atelier sait les produire (sujet, correcteur, feuille de réponses, édition web notée, audio intégré au web et joint au PDF). Affichés « Coming soon », sans prix tant qu'ils ne sont pas fixés.
- Formats livrés : PDF « édition vendue » avec corrigé, accompagné de l'audio en MP3 et d'un mémo PDF ; édition web interactive, à faire en ligne sur le site, avec l'audio intégré à la page. Pas de vidéo. L'édition CLASSROOM n'est jamais vendue.
- Ventes définitives, sans remboursement.

## Fonctionnalités

- Sélecteur de niveau A0 à C2 (B2 à C2 grisés « In preparation »), avec les packs, leurs descriptions, leurs prix et la liste de leurs modules (titres réels, tirés des sources par l'atelier)
- Bande « The Complete Method »
- Devises : dollar US et FCFA (XAF, XOF) au prix exact ; euro calculé depuis le FCFA (parité fixe 655,957) ; livre, dollar canadien, naira et cédi convertis depuis le dollar à des taux indicatifs, marqués « ≈ ». La devise suit le pays du visiteur : d'abord la région du navigateur et le fuseau horaire, puis le pays de sa connexion via get.geojs.io (gratuit, sans clé). Un choix manuel du visiteur prime et est mémorisé. Cette consultation envoie l'adresse IP du visiteur à geojs : à mentionner dans la politique de confidentialité.
- Moyens de paiement de départ : carte bancaire (Visa, Mastercard) et PayPal partout ; MTN MoMo et Orange Money en plus pour le Cameroun (montant en FCFA, numéro vérifié). Le formulaire de paiement est en place, mais n'encaisse rien : il annonce « Online payment opens soon » et propose d'envoyer la commande sur WhatsApp quand le numéro est renseigné.
- **Séances en face à face** avec Olivier (visio, ou en présentiel si possible) : étudier un point, pratiquer, converser, préparer un examen. Parcours en deux temps : demande et échange gratuit par WhatsApp ou e-mail, puis paiement pour confirmer. Tarifs : 30 min 9 $ / 4 900 FCFA ; 60 min 15 $ / 8 200 FCFA ; 5 × 60 min 65 $ / 35 700 FCFA (à utiliser en 3 mois). Modifiables dans `LIVE` (`js/products.js`).
- Test de niveau en 15 questions, qui recommande le pack suivant
- Sections : contenu d'un module (audio inclus), préparation DELF/TCF (en production), auteur, paiement, FAQ

## Personnaliser

| Quoi | Où |
|---|---|
| Produits, descriptions, prix, niveaux, séances en direct | `js/products.js` |
| Titres des modules | `js/modules.js`, **généré** : `python tools/importer_catalogue.py <atelier>/livraison/site/catalogue.json` après « Exporter pour le site » dans l'atelier |
| E-mail, WhatsApp, lien du module gratuit A0-1 | objet `SHOP` en haut de `js/app.js` (les champs vides restent masqués) |
| Questions du test | `TEST` dans `js/app.js` |
| Devises, taux indicatifs, pays, moyens de paiement | `CURRENCIES`, `COUNTRIES`, `PAY_METHODS` dans `js/app.js` |
| Couleurs et typographies | variables `:root` de `css/style.css` |

## Mise en ligne

GitHub Pages, branche `main` : https://olivierdjoukang243.github.io/Pas-pas/

## Ce qui manque pour vendre

Le bouton « Buy » ouvre pour l'instant une fenêtre « Online checkout opens soon » : aucun paiement n'est encaissé. Restent à fournir ou à construire :
1. Le prestataire de paiement (piste principale : Notch Pay, carte et mobile money au Cameroun) et l'état du compte.
   D'après les notes du projet, PayPal (comme Stripe) n'accepte pas un vendeur basé au Cameroun : à confirmer avant d'ouvrir les paiements, sinon retirer PayPal de `PAY_METHODS`.
2. Un serveur de livraison : webhook de paiement, puis lien de téléchargement signé et limité dans le temps (PDF, MP3, mémo).
   Les éditions web se font en ligne sur le site : elles doivent être servies derrière un accès acheteur, pas en fichiers publics. GitHub Pages ne sait pas protéger un contenu payant.
3. Le stockage privé des fichiers.
4. Le nom de domaine, l'adresse e-mail dédiée et le numéro WhatsApp.
5. Les pages légales : conditions de vente et confidentialité.
6. ~~Les titres des 56 modules~~ : importés depuis l'atelier (`js/modules.js`).
7. Les noms définitifs des fichiers à livrer, fixés au moment de la mise en ligne.
