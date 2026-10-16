# Serveur de paiement, de réservation et d'e-mails : ce que le site attend

Le site est prêt : il suffit de renseigner `SHOP.api` (adresse du serveur, dans `js/shop.js`)
et `LIVE_CONFIG.video.appId` (compte JaaS, dans `js/live.js`). Tant que `SHOP.api` est vide,
rien n'est encaissé, envoyé ni réservé, et le site l'affiche clairement. Ajouter `?demo` à
l'adresse permet d'essayer tout le parcours sans payer, y compris le côté d'Olivier
(données gardées dans le navigateur).

Le serveur est indispensable pour quatre raisons :
- la clé de paiement et l'accès à Gmail doivent rester secrets ;
- un paiement ne se confirme que par le webhook du prestataire, jamais par le seul retour du navigateur ;
- deux élèves ne doivent pas pouvoir réserver la même heure ;
- un avis ne doit venir que d'un vrai acheteur.

## Prestataires retenus

| Besoin | Prestataire | Pourquoi |
|---|---|---|
| Paiement, monde entier (carte, PayPal, Apple Pay, Google Pay) | **Paddle** ou **Lemon Squeezy**, comme « marchand officiel » (*merchant of record*) | Le vendeur est Nuvalex LLC (Wyoming), et les clients sont des anglophones du monde entier. Vendre des produits numériques à des particuliers oblige à percevoir la TVA ou la GST de leur pays, souvent dès la première vente : TVA de l'UE (guichet OSS), TVA du Royaume-Uni, GST d'Australie et du Canada au-delà de leurs seuils. Un marchand officiel encaisse, calcule, déclare et reverse ces taxes à la place de la LLC. Les deux acceptent une LLC américaine avec son EIN |
| Paiement, Cameroun (MTN MoMo, Orange Money) | **Notch Pay** | FCFA, MoMo et Orange Money, page de paiement hébergée, webhooks. **À vérifier à l'ouverture du compte :** Notch Pay accepte-t-il Nuvalex LLC, ou faut-il un compte au nom d'Olivier au Cameroun ? |
| E-mails | **Gmail**, depuis l'alias de la boutique | Choix d'Olivier. Envoi par l'API Gmail (voir plus bas) |
| Visio dans le site | **JaaS (Jitsi as a Service, 8x8)** | S'intègre dans la page ; gratuit jusqu'à 25 utilisateurs actifs par mois. L'instance publique meet.jit.si ne peut plus être intégrée dans un autre site |

## Les e-mails, par Gmail

- **Expéditeur :** l'alias de la boutique (par exemple `hello@<domaine>`), déclaré dans Gmail
  → Paramètres → Comptes → « Envoyer des e-mails en tant que ». Le serveur envoie avec l'API
  Gmail (`users.messages.send`), en OAuth 2 avec le seul droit `gmail.send`, et met l'alias dans
  l'en-tête `From`. Le jeton OAuth reste sur le serveur.
- **Recommandé au moment du domaine :** Google Workspace sur le domaine de la boutique.
  L'alias y est signé DKIM, ce qui évite le dossier spam, et la limite d'envoi est d'environ
  2 000 e-mails par jour, contre environ 500 pour un compte Gmail gratuit.
- **Côté DNS :** publier SPF, DKIM et DMARC pour le domaine.
- **Désinscription :** chaque e-mail marketing porte un en-tête `List-Unsubscribe` (désinscription
  en un clic) et un lien visible. Google l'exige des expéditeurs en nombre, et c'est une bonne
  pratique dès le départ.
- **Les modèles sont dans `emails/` :**

| Modèle | Destinataire | Quand |
|---|---|---|
| `module-gratuit.html` / `.txt` | visiteur | aussitôt après le formulaire du module gratuit |
| `demande-creneaux-olivier.html` | Olivier | à chaque demande de séance |
| `creneaux-confirmes.html` | élève | quand Olivier a coché ses heures |
| `demande-avis.html` | acheteur | 7 jours après un achat de fichiers, ou le lendemain d'une séance |

  La confirmation de paiement, la livraison des fichiers et le rappel de séance suivent la même charte.

## Les routes

### `GET /slots/taken`
Les créneaux déjà réservés, pour que le site ne les propose plus.
```json
{ "taken": [ { "start": 1760630400000, "end": 1760634000000 } ] }
```

### `POST /lesson-requests`
L'élève propose ses heures. Le site exige au moins 3 heures de début, 3 au plus par jour, sans chevauchement compte tenu de la durée de la séance (6 sur 3 jours sont conseillées, pas exigées) ; le serveur le vérifie de nouveau.
```json
{ "product": "live-60", "need": "…", "level": "A2", "minutes": 60, "name": "…", "email": "…",
  "zone": "Europe/London", "proposed": [1760630400000, …], "credit": null }
```
Le serveur :
1. enregistre la demande ;
2. crée deux clés au hasard, une pour Olivier et une pour l'élève ;
3. envoie à Olivier `demande-creneaux-olivier.html`, avec le lien `<site>/?olivier=<id>&key=<clé Olivier>` ;
4. répond `{ "id": "…", "key": "<clé élève>" }`.

`credit` vaut l'identifiant d'un pack payé, qu'il faut vérifier, ou `null`.

### `GET /lesson-requests/:id?key=…`
La demande, lue par Olivier (avec sa clé) ou par l'élève (avec la sienne). Elle renvoie les champs ci-dessus, plus `status` (`pending`, `answered` ou `declined`) et `accepted` (les heures cochées par Olivier).

### `POST /lesson-requests/:id/answer`
Olivier coche ses heures : `{ "key": "<clé Olivier>", "accepted": [1760630400000, …] }`. Le serveur :
- enregistre les heures cochées ;
- si au moins une heure est cochée, envoie à l'élève `creneaux-confirmes.html`, avec le lien `<site>/?lesson=<id>&key=<clé élève>` ;
- si aucune n'est cochée, demande à l'élève de proposer d'autres heures.

L'élève choisit ensuite une des heures, puis paie par `/checkout`. Pour une séance d'un pack, il n'y a pas de paiement : le serveur confirme directement.

### `POST /checkout`
Envoyé par le site au clic sur « Pay ».
```json
{ "product": "live-60", "email": "…", "country": "Cameroon", "method": "momo",
  "phone": "677123456", "currency": "XAF", "amount": 8200,
  "booking": { "start": 1760630400000, "minutes": 60, "request": "…", "need": "…", "level": "A2", "name": "…", "email": "…", "zone": "Africa/Douala" },
  "return_url": "https://…/" }
```
Le serveur doit :
1. **recalculer le prix** à partir de `product` et de la devise, sans jamais faire confiance à `amount` ;
2. **refuser un moyen de paiement absent du pays de résidence** déclaré. MTN MoMo et Orange Money ne valent que pour le Cameroun ; la carte et PayPal valent partout. C'est la même règle que `PAY_METHODS` dans `js/app.js` ;
3. pour une séance, **vérifier que l'heure fait partie de celles qu'Olivier a cochées** pour cette demande, qu'elle est toujours libre, puis la **bloquer 20 minutes** ;
4. créer la transaction chez le bon prestataire, avec un retour vers `return_url?paid=<référence>` :
   - **carte ou PayPal :** un checkout Paddle ou Lemon Squeezy, qui ajoute la taxe du pays si elle est due ;
   - **MoMo ou Orange Money :** une transaction Notch Pay (`POST /payments`, clé dans l'en-tête `Authorization`), traitée directement avec le canal `cm.mtn` ou `cm.orange` et le numéro.

   Le site ne change pas : il reçoit toujours une `authorization_url`.

Réponse : `{ "authorization_url": "https://…" }`, ou `{ "error": "…" }` avec un code 4xx.

### `POST /webhooks/notchpay` (et le webhook du marchand officiel)
Vérifier la signature du corps brut : HMAC-SHA256 dans l'en-tête `X-Notchpay-Signature` pour Notch Pay, en-tête de signature propre pour Paddle ou Lemon Squeezy. Puis :
- **`payment.complete` :**
  1. relire la transaction chez Notch Pay ;
  2. marquer la commande payée ;
  3. pour un fichier ou un pack d'examen, envoyer les liens de téléchargement signés ;
  4. pour une séance, confirmer l'heure, créer le salon et prévenir l'élève et Olivier ;
  5. programmer la demande d'avis ;
- **`payment.failed` :** libérer l'heure.

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
1. vérifier l'adresse et limiter les demandes : une par adresse et par jour, quelques-unes par adresse IP ;
2. enregistrer le contact : adresse, prénom, pays, date, et le consentement `marketing` tel quel (la case est décochée par défaut) ;
3. envoyer **tout de suite** `emails/module-gratuit.html` et sa version `.txt`. Les liens pointent vers l'édition web, le PDF vendu et les MP3 du module A0-1, nommés selon `noms.py` de l'atelier (`pas-a-pas-french_a0-complete_m01_vendue.pdf`, etc.). Ils peuvent rester publics : le module est offert ;
4. remplir `{{A0_PRICE}}` et `{{LIVE_PRICE}}` dans la devise du visiteur, ainsi que `{{UNSUBSCRIBE_URL}}`.

Réponse : `204`, ou `{ "error": "…" }` avec un code 4xx. Seuls les contacts qui ont coché la case reçoivent d'autres e-mails ensuite.

### `GET /reviews`
Les avis publiés : `{ "reviews": [ { "name", "country", "product", "rating", "date", "text", "reply" } ] }`.

### `POST /reviews`
Envoyé depuis le lien de l'e-mail de demande d'avis (`<site>/?review=<jeton>`).
```json
{ "token": "…", "rating": 2, "text": "…", "name": "Sam", "country": "Ghana", "consent": true }
```
La publication est **automatique, sans intervention d'Olivier** :
1. le jeton doit correspondre à une commande payée et ne pas avoir déjà servi : un avis par commande ;
2. le texte passe par `reviewProblems()` de `js/review-filter.js`, le même fichier que le site. Ce filtre juge la forme (insultes, liens, coordonnées, majuscules, longueur, consentement), **jamais la note** ;
3. sans problème, l'avis est publié aussitôt, quelle que soit sa note. Sinon, le serveur répond `{ "error": "…" }` et l'élève corrige son texte ;
4. Olivier reçoit une simple notification et peut répondre publiquement (champ `reply`). Il n'a rien à valider.

Réponse : `201`, ou `{ "error": "…" }` avec un code 4xx.

### `GET /sessions/:id/token`
Lu au clic sur « Join ». Il n'est servi que pour une séance payée, de 10 minutes avant le début jusqu'à la fin.
```json
{ "room": "pasapas-<id>", "jwt": "<jeton JaaS signé avec la clé privée du compte>" }
```
Olivier reçoit un jeton modérateur pour le même salon (lien dans son e-mail de confirmation).

## Protection contre la fraude

### Les fichiers
1. **Jamais de fichier public.** Les productions sont stockées hors du site (un stockage privé). Seul le module gratuit peut avoir un lien stable, et il est tatoué « Free sample ».
2. **Tatouage à la livraison.** Après `payment.complete`, le serveur fait des copies au nom de l'acheteur (nom, e-mail, référence de commande) avec `tatouer.py` de l'atelier, ou la même logique. Il les inscrit au registre des licences, puis envoie les liens. Aucun fichier ne part sans tatouage.
3. **Liens personnels.** Liens signés (HMAC), liés à la commande, valables 7 jours et 5 téléchargements, puis renouvelables sur demande de l'acheteur.
4. **Alerte de partage.** Une même commande téléchargée depuis plus de 5 adresses IP, ou plus de 3 pays, en 24 h suspend les liens et prévient Olivier.
5. **Éditions web.** Elles s'ouvrent par un lien personnel, et chaque page servie est tatouée au vol. Le jeton n'est valable que pour sa commande.
6. **Sujets d'examen.** Une série jamais livrée par commande (`livrer.py`), dont la référence est enregistrée avec la commande.

### Les paiements
- **Prix et moyens.** Le prix est toujours recalculé côté serveur, et le moyen de paiement contrôlé selon le pays de résidence (voir `/checkout`).
- **Confirmation.** Une commande n'est livrée qu'après le webhook signé du prestataire, relu chez lui. Le retour du navigateur ne suffit pas.
- **Limites de débit.** Formulaires et paiements sont limités : quelques tentatives par adresse IP et par adresse e-mail.
- **Litiges et rétrofacturations.** On garde la trace de la livraison (date, adresse IP du téléchargement, case « terms » acceptée), qui sert de preuve. Le marchand officiel (Paddle ou Lemon Squeezy) gère les rétrofacturations.

### Les accès
- **Secrets.** Clés des prestataires, jeton Gmail et clé JaaS restent dans des variables d'environnement du serveur, jamais dans Git.
- **Liens d'Olivier.** Ses liens d'administration (`?olivier=…`) portent une clé à usage unique, longue et aléatoire.
- **Si une copie circule.** Lancer `tracer.py` (atelier) sur la copie, puis faire la demande de retrait décrite dans `docs/protection.md`.

## Packs d'examen
Les produits `delf-a1` à `delf-b2` et les cinq TCF (`tcf-canada`, `tcf-quebec`, `tcf-tp`,
`tcf-dap`, `tcf-irn`) sont des séries de 4 sujets complets sans tâche commune. L'atelier les
produit avec `delf.py` et `tcf.py` (registre `examens/series.json`) ; à chaque commande,
`livrer.py` donne une série jamais livrée, renomme les fichiers et les tatoue. Garder la
référence de la série livrée avec la commande.

## Précommandes
Un produit `ready: false, preorder: true` (`js/products.js`) se paie tout de suite :
`/checkout` reçoit `preorder: true`. Après `payment.complete`, le serveur n'envoie pas de
fichiers : il enregistre la précommande, envoie un accusé (« sent as soon as it is ready,
cancel for a full refund until then ») et prévient Olivier. `GET /payments/:ref` renvoie
`preorder: true` pour que le site affiche le bon message.
- Les parties d'un pack déjà prêtes (A1 Part 1 dans A1 Complete ; A0 et A1 Part 1 dans la
  méthode complète) partent tout de suite, tatouées comme d'habitude.
- Le jour où un produit passe `ready: true`, le serveur livre toutes ses précommandes en attente.
- Annulation avant livraison : remboursement de ce qui n'a pas été livré. Sans livraison
  90 jours après le paiement : remboursement, sauf si l'acheteur préfère attendre
  (`policies.html`, sections 2 et 3).

## Données à garder
- commandes : référence, produit, montant, devise, pays de résidence, moyen, statut, e-mail ;
- contacts du module gratuit, avec leur consentement ;
- demandes de séance : heures proposées et heures cochées ;
- séances : début, durée, élève, statut, salon ;
- crédits des packs : 5 séances, à utiliser en 3 mois ;
- avis, avec leur jeton.

Durées de conservation : voir `policies.html#privacy`. Une base légère suffit : Cloudflare D1, Supabase ou SQLite.

## Sources
- Notch Pay, accepter un paiement : https://developer.notchpay.co/accept-payments/charge
- Notch Pay, démarrage : https://developer.notchpay.co/get-started/quickstart
- Notch Pay, webhooks : https://developer.notchpay.co/api-reference/create-a-webhook
- Gmail API, envoyer un e-mail : https://developers.google.com/gmail/api/guides/sending
- Gmail, envoyer depuis une autre adresse (alias) : https://support.google.com/mail/answer/22370
- Google, règles pour les expéditeurs : https://support.google.com/a/answer/81126
- Limites d'envoi de Google Workspace : https://support.google.com/a/answer/166852
- Paddle, marchand officiel : https://www.paddle.com/blog/what-is-merchant-of-record
- Lemon Squeezy, marchand officiel : https://docs.lemonsqueezy.com/help/payments/merchant-of-record
- UE, TVA sur les services numériques fournis par des vendeurs hors UE : https://vat-one-stop-shop.ec.europa.eu/
- JaaS : https://jitsi.org/jaas/ et https://developer.8x8.com/jaas/docs/faq
- Avis clients, règle de la FTC (2024) : https://www.ftc.gov/legal-library/browse/rules/trade-regulation-rule-use-consumer-reviews-testimonials
