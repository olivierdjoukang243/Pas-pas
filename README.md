# Pas-à-Pas French — learn French step by step

Site de vente de la méthode Pas-à-Pas : cours de français pour adultes anglophones, écrits par Olivier Djoukang. Site statique (HTML/CSS/JS, sans compilation), en anglais.

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
- Sujets DELF et TCF : en production, rien en vente. Pas de DALF.
- Formats livrés : PDF « édition vendue » avec corrigé, édition web interactive, mémo PDF et enregistrements audio de chaque module. Pas de vidéo. L'édition CLASSROOM n'est jamais vendue.
- Ventes définitives, sans remboursement.

## Fonctionnalités

- Sélecteur de niveau A0 à C2 (B2 à C2 grisés « In preparation »), avec les packs, leurs descriptions et leurs prix
- Bande « The Complete Method »
- Bascule $ / FCFA, en FCFA par défaut pour les fuseaux horaires africains
- Test de niveau en 15 questions, qui recommande le pack suivant
- Sections : contenu d'un module (audio inclus), préparation DELF/TCF (en production), auteur, paiement, FAQ

## Personnaliser

| Quoi | Où |
|---|---|
| Produits, descriptions, prix, niveaux | `js/products.js` |
| E-mail, WhatsApp, lien du module gratuit A0-1 | objet `SHOP` en haut de `js/app.js` (les champs vides restent masqués) |
| Questions du test | `TEST` dans `js/app.js` |
| Couleurs et typographies | variables `:root` de `css/style.css` |

## Mise en ligne

GitHub Pages, branche `main` : https://olivierdjoukang243.github.io/Pas-pas/

## Ce qui manque pour vendre

Le bouton « Buy » ouvre pour l'instant une fenêtre « Online checkout opens soon » : aucun paiement n'est encaissé. Restent à fournir ou à construire :
1. Le prestataire de paiement (piste principale : Notch Pay, carte et mobile money au Cameroun) et l'état du compte.
2. Un serveur de livraison : webhook de paiement, puis lien de téléchargement signé et limité dans le temps.
3. Le stockage privé des fichiers.
4. Le nom de domaine, l'adresse e-mail dédiée et le numéro WhatsApp.
5. Les pages légales : conditions de vente et confidentialité.
6. Les titres des 56 modules (aucun titre n'est inventé sur le site).
