# Pas-Pas French — learn French step by step

Boutique en ligne internationale (HTML/CSS/JS, sans compilation) qui vend des outils numériques pour apprendre le français aux **anglophones** : cours de A0 à C2 découpés en modules, sujets DELF, DALF et TCF, et sujets d'entraînement par niveau. Le site est en anglais.

L'analyse des concurrents et le positionnement sont dans [`docs/analyse-concurrentielle.md`](docs/analyse-concurrentielle.md).

## Fonctionnalités

- **7 niveaux, de A0 à C2**, chacun découpé en **modules** (38 au total). Chaque module s'achète seul ; le niveau complet coûte 30 % de moins. Le panier propose de passer au niveau complet quand on a déjà plusieurs modules.
- **Sujets d'examen** au format officiel : DELF A1 à B2, DALF C1 et C2, TCF Tout public, TCF Canada
- **Sujets d'entraînement simples par niveau** (A0 à C2)
- **Test de niveau gratuit** (15 questions) qui donne un niveau de A0 à C1 et recommande le module suivant
- **Vente internationale** : carte bancaire et PayPal partout ; **MTN MoMo et Orange Money** quand le pays choisi est le Cameroun (montant en FCFA, numéro vérifié)
- Devises : EUR, USD, GBP, CAD, FCFA (XAF/XOF), NGN, GHS. La devise est devinée d'après le fuseau horaire du visiteur (FCFA au Cameroun, CAD au Canada…)
- Recherche, panier, code promo `WELCOME10`, commande WhatsApp, adapté au mobile

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Personnaliser

| Quoi | Où |
|---|---|
| Niveaux, modules, sujets d'examen, prix | `js/products.js` |
| Numéro WhatsApp, codes promo, devises, pays et moyens de paiement, questions du test | haut de `js/app.js` |
| Couleurs et typographies | variables `:root` de `css/style.css` |

## Mise en ligne

Publié avec GitHub Pages depuis la branche `main` : https://olivierdjoukang243.github.io/Pas-pas/

## Avant d'encaisser de vraies commandes

Le paiement est **simulé**. Pour MTN MoMo et Orange Money au Cameroun, il faut un agrégateur comme **CinetPay**, **Campay** ou **NotchPay** ; pour la carte et PayPal à l'international, **Stripe** ou **PayPal**. Les sujets DELF, DALF et TCF vendus doivent être des sujets originaux au format officiel, pas des copies des épreuves officielles (droits de France Éducation international).
