# Serveur de paiement et de réservation — ce que le site attend

Le site est prêt : il suffit de renseigner `SHOP.api` (adresse du serveur, dans `js/app.js`)
et `LIVE_CONFIG.video.appId` (compte JaaS, dans `js/live.js`). Tant que `SHOP.api` est vide,
rien n'est encaissé ni réservé : le site l'affiche clairement. Ajouter `?demo` à l'adresse
permet d'essayer tout le parcours sans payer (réservations gardées dans le navigateur).

Le serveur est indispensable pour trois raisons : la clé de paiement doit rester secrète,
un paiement ne se confirme que par le webhook du prestataire (jamais par le seul retour du
navigateur), et deux élèves ne doivent pas pouvoir réserver la même heure.

## Prestataires retenus

| Besoin | Prestataire | Pourquoi |
|---|---|---|
| Paiement | **Notch Pay** | Vendeur au Cameroun, FCFA, MTN MoMo, Orange Money et carte, page de paiement hébergée, webhooks |
| E-mails (module gratuit, livraisons, demandes d'avis) | **Brevo** (ou Resend) | Envoi transactionnel et liste de contacts avec désinscription ; offre gratuite suffisante au départ (environ 300 e-mails par jour chez Brevo, à vérifier à l'ouverture) |
| Visio dans le site | **JaaS (Jitsi as a Service, 8x8)** | S'intègre dans la page ; gratuit jusqu'à 25 utilisateurs actifs par mois. L'instance publique meet.jit.si ne peut plus être intégrée dans un autre site |

## Les routes

### `GET /slots/taken`
Les créneaux déjà réservés, pour que le site ne les propose plus.
```json
{ "taken": [ { "start": 1760630400000, "end": 1760634000000 } ] }
```

### `POST /checkout`
Envoyé par le site au clic sur « Pay ».
```json
{ "product": "live-60", "email": "…", "country": "Cameroon", "method": "momo",
  "phone": "677123456", "currency": "XAF", "amount": 8200,
  "booking": { "start": 1760630400000, "minutes": 60, "need": "…", "level": "A2", "name": "…", "email": "…", "zone": "Africa/Douala" },
  "return_url": "https://…/" }
```
Le serveur doit :
1. **recalculer le prix** à partir de `product` et de la devise, sans jamais faire confiance à `amount` ;
2. pour une séance, **vérifier que le créneau est libre** et le **bloquer 20 minutes** ;
   Les moyens de paiement sont proposés dans tous les pays : MoMo et Orange Money
   demandent seulement un numéro camerounais (canal `cm.mtn` ou `cm.orange`), où que
   soit l'acheteur ; ils sont toujours encaissés en FCFA.
3. créer la transaction Notch Pay (`POST /payments`, clé dans l'en-tête `Authorization`), avec un `callback` vers `return_url?paid=<référence>` ;
4. pour MoMo et Orange Money, il peut traiter directement (`POST /payments/{reference}` avec le canal `cm.mtn` ou `cm.orange` et le numéro), sinon renvoyer la page Notch Pay.

Réponse : `{ "authorization_url": "https://…" }`, ou `{ "error": "…" }` avec un code 4xx.

### `POST /webhooks/notchpay`
Vérifier la signature HMAC-SHA256 du corps brut (en-tête `X-Notchpay-Signature`, à confirmer dans le tableau de bord). Puis :
- `payment.complete` : relire la transaction chez Notch Pay ; marquer la commande payée ; pour un fichier ou un pack d'examen, envoyer les liens de téléchargement signés ; programmer la demande d'avis (voir plus bas) ; pour une séance, confirmer le créneau, créer le salon et envoyer l'e-mail de confirmation à l'élève et à Olivier ;
- `payment.failed` : libérer le créneau.

### `GET /payments/:reference`
Lu par le site au retour de la page de paiement.
```json
{ "status": "complete", "email": "…", "booking": { …la réservation… } }
```
`status` vaut `complete`, `pending` ou `failed`. Une séance n'apparaît dans « My live lessons » que si `complete`.

### `POST /free-module`
Le formulaire « Get Module 1 free ».
```json
{ "email": "…", "name": "Sam", "marketing": false, "country": "Nigeria", "currency": "NGN" }
```
Le serveur doit :
1. vérifier l'adresse, limiter les demandes (une par adresse et par jour, quelques-unes par IP) ;
2. enregistrer le contact : adresse, prénom, pays, date, et le consentement `marketing` tel quel (case décochée par défaut) ;
3. envoyer **tout de suite** `emails/module-gratuit.html` (et sa version `.txt`) avec les liens du module A0-1 :
   édition web, PDF vendu et MP3, nommés selon `noms.py` de l'atelier
   (`pas-a-pas-french_a0-complete_m01_vendue.pdf`…). Ces liens-là peuvent rester publics : le module est offert ;
4. remplir `{{A0_PRICE}}` et `{{LIVE_PRICE}}` dans la devise du visiteur, et `{{UNSUBSCRIBE_URL}}`.

Réponse : `204`, ou `{ "error": "…" }` avec un code 4xx. Seuls les contacts qui ont coché la case reçoivent ensuite d'autres e-mails.

### `GET /sessions/:id/token`
Lu au clic sur « Join ». N'est servi que pour une séance payée, de 10 minutes avant le début jusqu'à la fin.
```json
{ "room": "pasapas-<id>", "jwt": "<jeton JaaS signé avec la clé privée du compte>" }
```
Olivier reçoit un jeton modérateur pour le même salon (lien dans son e-mail de confirmation).

## Demande d'avis
Sept jours après une commande de fichiers, ou le lendemain d'une séance, envoyer
`emails/demande-avis.html`. Un avis n'est publié qu'avec l'accord écrit de l'élève, avec son
prénom et son pays seulement : on l'ajoute alors à `js/reviews.js`, et la section « Reviews »
du site apparaît d'elle-même. Ne jamais publier d'avis inventé ni retouché.

## Packs d'examen
Les produits `delf-a1`, `delf-a2`, `delf-b1`, `delf-b2` (3 sujets chacun) et `tcf-canada`
(4 sujets, A1 à B2) sont des fichiers comme les autres. L'atelier les produit une fois avec
`examen.py` (commandes dans son LISEZ-MOI) ; garder les références des sujets livrés.

## Données à garder
Commandes (référence, produit, montant, devise, statut, e-mail), contacts du module gratuit (avec le consentement), séances (début, durée,
élève, statut, salon), crédits des packs (5 séances, à utiliser en 3 mois). Une base légère
suffit : Cloudflare D1, Supabase ou SQLite.

## Sources
- Notch Pay, accepter un paiement : https://developer.notchpay.co/accept-payments/charge
- Notch Pay, démarrage : https://developer.notchpay.co/get-started/quickstart
- Notch Pay, webhooks : https://developer.notchpay.co/api-reference/create-a-webhook
- Brevo, tarifs : https://www.brevo.com/pricing/
- JaaS : https://jitsi.org/jaas/ et https://developer.8x8.com/jaas/docs/faq
