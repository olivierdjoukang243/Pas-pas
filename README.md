# Pas-Pas — boutique en ligne de produits français

Site e-commerce statique (HTML/CSS/JS, sans build) pour vendre des produits français en France, en Europe, en Afrique et dans le monde.

L'analyse des concurrents et le positionnement sont dans [`docs/analyse-concurrentielle.md`](docs/analyse-concurrentielle.md).

## Fonctionnalités

- Catalogue de 24 produits (épicerie fine, vins, fromages, douceurs, beauté, artisanat, coffrets) avec région, producteur et label (AOP, IGP, Label Rouge, Bio, Origine France Garantie)
- Recherche instantanée, filtres par catégorie, région et label, tri, filtre « livrable dans ma zone »
- **6 zones de livraison** : frais, délai et seuil de gratuité affichés dès l'accueil ; produits frais réservés à la France
- **Multi-devises** : EUR, FCFA (XAF/XOF), USD, GBP, CAD
- Panier persistant, favoris, barre « plus que X € pour la livraison offerte », code promo `BIENVENUE10`
- **Coffret sur mesure** : 3 produits ou plus donnent −10 %
- Abonnement « Box du Terroir » (3 formules)
- Paiement : carte, PayPal, Mobile Money, virement (formulaire de démonstration), et commande via **WhatsApp**
- Confirmation d'âge pour l'alcool, SEO (meta, Open Graph, JSON-LD), responsive mobile

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Personnaliser

| Quoi | Où |
|---|---|
| Produits, prix, photos | `js/products.js` |
| Numéro WhatsApp, codes promo, zones, devises, abonnements | haut de `js/app.js` |
| Couleurs et typographies | variables `:root` de `css/style.css` |

## Mise en ligne

Le site est 100 % statique : il se déploie tel quel sur GitHub Pages, Netlify ou Vercel.

## Avant d'encaisser de vraies commandes

Le paiement est **simulé**. Pour vendre réellement, il faut :
1. Brancher Stripe (carte), PayPal, et CinetPay, Flutterwave ou PayDunya (Mobile Money), ou migrer vers Shopify ou WooCommerce.
2. Remplacer les emojis par de vraies photos produits.
3. Rédiger les mentions légales, les CGV et la politique RGPD, et vérifier les règles douanières par pays (alcool, viande, lait cru).
4. Mettre à jour les taux de change (aujourd'hui fixes et indicatifs, sauf le FCFA qui a une parité fixe).
