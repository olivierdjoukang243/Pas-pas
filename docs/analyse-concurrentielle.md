# Analyse concurrentielle — vente en ligne de produits français

## 1. Le marché observé

| Acteur | Positionnement | Points forts | Faiblesses constatées |
|---|---|---|---|
| **Madeleine Market** | Épicerie fine premium (sélection Gault & Millau, chefs) | Caution gastronomique, livraison offerte en France | Catalogue tourné vers la France, peu d'international |
| **Horizons Gourmet** | Épicerie haut de gamme (~300 références) | Sélection courte, qualitative | Pas de frais/surgelés, peu de contenu producteur |
| **La Francerie** (Italie) | Produits français pour un pays étranger (~250 réf.) | Ciblage expatriés/locaux | Un seul pays livré |
| **Délices de France** (Irlande) | Épicerie d'expatriés (~2 000 réf.) | Large choix, PayPal | Zone de livraison très limitée |
| **Mon Panier Latin** (Londres) | Supermarché français en ligne | Livraison 24 h, 7j/7 | Londres uniquement |
| **Saveurs de France** (Espagne) | Épicerie-traiteur pour expatriés | Plats cuisinés, fêtes | Un seul pays, site daté |
| **Grandes enseignes FR** (Carrefour.fr…) | Généralistes | Prix, catalogue | Pas de livraison hors France → les clients passent par des réexpéditeurs (Easy Delivery…) avec frais cumulés |
| **ALittleMarket / marketplaces "made in France"** | Artisans + épicerie | Lien producteur | Expérience hétérogène, frais de port par vendeur |

## 2. Les manques du marché (opportunités)

1. **L'international est mal servi** : chaque épicerie couvre *un* pays, ou le client doit passer par un réexpéditeur. Personne ne cible sérieusement l'**Afrique francophone** et la diaspora.
2. **Frais de port opaques** : le coût réel n'apparaît qu'au paiement.
3. **Moyens de paiement** : carte/PayPal uniquement — pas de **Mobile Money** (Orange Money, MTN MoMo, Wave), pourtant dominants en Afrique.
4. **Prix affichés uniquement en euros**.
5. **Traçabilité faible** : peu de fiches "qui a fabriqué ce produit, où".
6. **Pas de personnalisation** : coffrets figés, rarement "composez votre coffret".
7. **Commande conversationnelle absente** : pas de WhatsApp, alors que c'est le canal n°1 de la clientèle cible.

## 3. Notre proposition "hyperconcurrentielle"

| Levier | Ce que fait le site |
|---|---|
| Livraison mondiale transparente | Sélecteur de zone (France, UE, Afrique, Amérique du Nord, Monde) : coût + délai affichés **dès la page d'accueil** et dans le panier, barre "plus que X € pour la livraison offerte" |
| Multi-devises | EUR, FCFA (XAF/XOF, parité fixe 655,957), USD, GBP, CAD |
| Paiements locaux | Carte, PayPal, Mobile Money, virement, commande WhatsApp |
| Traçabilité | Chaque produit : région, producteur, label (AOP, IGP, Label Rouge, Bio, Origine France Garantie) |
| Coffret sur mesure | 3 produits ou plus = −10 % automatique |
| Abonnement "Box du terroir" | Revenu récurrent, fidélisation |
| Fidélité | Code de bienvenue −10 %, points |
| Confiance | Avis clients, garantie colis cassé remboursé, emballage isotherme |
| Logistique réaliste | Produits secs/longue conservation privilégiés pour l'international (pas de frais hors France) |

## 4. Recommandations pour la mise en production

- Brancher un vrai paiement : **Stripe** (carte) + **CinetPay / Flutterwave / PayDunya** (Mobile Money Afrique) + PayPal.
- Back-office : migrer le catalogue (`js/products.js`) vers Shopify, WooCommerce ou un headless CMS dès 50+ références.
- Douanes : vérifier les restrictions par pays (alcool, viande, lait cru) et afficher les produits non éligibles par zone.
- Mentions légales, CGV, RGPD et vente d'alcool (interdite aux mineurs, message sanitaire) à finaliser avec un juriste.
- SEO : une page par produit et par région, blog recettes, Google Merchant Center.

### Sources
- https://www.frenchweb.fr/madeleine-market-epicerie-fine-2-0/93790
- https://www.lejournaldesentreprises.com/article/horizons-gourmet-une-epicerie-fine-sur-la-toile-85196
- https://lepetitjournal.com/milan/communaute/francerie-gastronomie-francaise-italie-398327
- https://lepetitjournal.com/dublin/communaute/laurent-guinot-delices-de-france-329251
- https://lepetitjournal.com/vivre-a-londres/mon-panier-latin-vos-courses-comme-en-france-avec-reductions-323931
- https://lepetitjournal.com/madrid/communaute/saveurs-de-france-vos-produits-gourmets-francais-livres-en-espagne-pour-les-fetes-428772
- https://www.easy-delivery.com/blog/expat-5-sites-pour-acheter-des-produits-francais/
- https://www.frenchweb.fr/la-plateforme-e-commerce-alittlemarket-com-se-lance-dans-lepicerie-en-ligne/106099
