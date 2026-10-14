# Pas-Pas French — learn French step by step

Boutique en ligne (HTML/CSS/JS, sans compilation) qui vend des outils numériques pour apprendre le français aux **anglophones** : cours vidéo, préparation TCF/TEF Canada et DELF, e-books, audio, flashcards et coaching. Le site est en anglais, puisqu'il s'adresse à des anglophones.

L'analyse des concurrents et le positionnement sont dans [`docs/analyse-concurrentielle.md`](docs/analyse-concurrentielle.md).

## Fonctionnalités

- **Test de niveau gratuit** (12 questions) qui donne un niveau CECR et recommande des produits
- Catalogue d'exemple de 18 produits, avec filtres par niveau (A1 à C1), objectif (Canada, travail, DELF, quotidien, enfants) et format, plus recherche et tri
- **Devises** : FCFA (XAF/XOF), NGN, GHS, USD, CAD, GBP, EUR
- Panier, favoris, code promo `WELCOME10`, **pack sur mesure** (−15 % dès 3 produits)
- Abonnement « Pas-Pas Club » (mensuel, trimestriel, annuel)
- Paiement : Mobile Money, carte, PayPal (formulaire de démonstration), et **commande WhatsApp**
- Adapté au mobile, référencement (meta, Open Graph, JSON-LD)

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Personnaliser

| Quoi | Où |
|---|---|
| Produits, prix, descriptions | `js/products.js` |
| Numéro WhatsApp, codes promo, devises, abonnements, questions du test | haut de `js/app.js` |
| Couleurs et typographies | variables `:root` de `css/style.css` |

## Mise en ligne

Publié avec GitHub Pages depuis la branche `main` : https://olivierdjoukang243.github.io/Pas-pas/

## Avant d'encaisser de vraies commandes

Le paiement est **simulé**. Il faut brancher un vrai prestataire (CinetPay, Flutterwave ou Paystack pour le Mobile Money ; Stripe ou PayPal), ou vendre les fichiers via Gumroad, Selar ou Payhip, qui envoient les liens de téléchargement automatiquement.
