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
| Visio dans le site | **JaaS (Jitsi as a Service, 8x8)** | S'intègre dans la page ; gratuit jusqu'à 25 utilisateurs actifs par mois. L'instance publique meet.jit.si ne peut plus être intégrée dans un autre site |

## Les cinq routes

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
3. créer la transaction Notch Pay (`POST /payments`, clé dans l'en-tête `Authorization`), avec un `callback` vers `return_url?paid=<référence>` ;
4. pour MoMo et Orange Money, il peut traiter directement (`POST /payments/{reference}` avec le canal `cm.mtn` ou `cm.orange` et le numéro), sinon renvoyer la page Notch Pay.

Réponse : `{ "authorization_url": "https://…" }`, ou `{ "error": "…" }` avec un code 4xx.

### `POST /webhooks/notchpay`
Vérifier la signature HMAC-SHA256 du corps brut (en-tête `X-Notchpay-Signature`, à confirmer dans le tableau de bord). Puis :
- `payment.complete` : relire la transaction chez Notch Pay ; marquer la commande payée ; pour un fichier, envoyer les liens de téléchargement signés ; pour une séance, confirmer le créneau, créer le salon et envoyer l'e-mail de confirmation à l'élève et à Olivier ;
- `payment.failed` : libérer le créneau.

### `GET /payments/:reference`
Lu par le site au retour de la page de paiement.
```json
{ "status": "complete", "email": "…", "booking": { …la réservation… } }
```
`status` vaut `complete`, `pending` ou `failed`. Une séance n'apparaît dans « My live lessons » que si `complete`.

### `GET /sessions/:id/token`
Lu au clic sur « Join ». N'est servi que pour une séance payée, de 10 minutes avant le début jusqu'à la fin.
```json
{ "room": "pasapas-<id>", "jwt": "<jeton JaaS signé avec la clé privée du compte>" }
```
Olivier reçoit un jeton modérateur pour le même salon (lien dans son e-mail de confirmation).

## Données à garder
Commandes (référence, produit, montant, devise, statut, e-mail), séances (début, durée,
élève, statut, salon), crédits des packs (5 séances, à utiliser en 3 mois). Une base légère
suffit : Cloudflare D1, Supabase ou SQLite.

## Sources
- Notch Pay, accepter un paiement : https://developer.notchpay.co/accept-payments/charge
- Notch Pay, démarrage : https://developer.notchpay.co/get-started/quickstart
- Notch Pay, webhooks : https://developer.notchpay.co/api-reference/create-a-webhook
- JaaS : https://jitsi.org/jaas/ et https://developer.8x8.com/jaas/docs/faq
