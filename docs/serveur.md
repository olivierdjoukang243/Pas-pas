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
| Paiement, monde entier (carte, PayPal, Apple Pay, Google Pay) | **Paddle** ou **Lemon Squeezy**, comme « marchand officiel » (*merchant of record*) | Le vendeur est Olivier Djoukang (Cameroun), et les clients sont des anglophones du monde entier. Vendre des produits numériques à des particuliers oblige à percevoir la TVA ou la GST de leur pays, souvent dès la première vente : TVA de l'UE (guichet OSS), TVA du Royaume-Uni, GST d'Australie et du Canada au-delà de leurs seuils. Un marchand officiel encaisse, calcule, déclare et reverse ces taxes à la place de la LLC. Les deux acceptent une LLC américaine avec son EIN |
| Paiement, Cameroun (MTN MoMo, Orange Money) | **Notch Pay** | FCFA, MoMo et Orange Money, page de paiement hébergée, webhooks. Compte ouvert le 18/10/2026 au nom d'Olivier Djoukang, indépendant au Cameroun (le contrat marchand réserve les comptes aux personnes physiques résidant en Afrique francophone). Tarifs : 2 % par paiement local, 1 % par retrait vers le mobile money. |
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

### `GET /slots?minutes=60` — les heures libres
Le serveur (`serveur/direct.py` de l'atelier) les calcule depuis Google Agenda (API Calendar,
`freeBusy`, compte Google d'Olivier, autorisation donnée par `autoriser_gmail.py`) :
- agendas lus : l'agenda principal d'Olivier (`AGENDA_OLIVIER`) et l'agenda « Pas à Pas »
  (`AGENDA_PASAPAS`, créé au premier besoin), où le serveur écrit les séances vendues ;
- libre : toute heure sans événement, 06:00–22:00 heure de Douala, tous les jours ;
- de 3 h à 14 jours à l'avance, pas de 30 min, 15 min de battement autour de chaque occupation ;
- moins les heures tenues pendant un paiement en cours et les séances déjà réservées.
```json
{ "free": [1760630400000, 1760632200000] }
```
Olivier ne reçoit aucune demande d'heures : son agenda est la seule source de ses disponibilités.

**Paiement** : `POST /checkout` reçoit `booking` (`start` en ms, `need`, `level`, `zone`, `name`).
Le serveur revérifie l'heure (agenda relu), la tient 20 min (refus `409` sinon, rien n'est
encaissé), puis, une fois le paiement relu chez Notch Pay :
1. écrit l'événement dans l'agenda « Pas à Pas », avec le lien de la salle d'Olivier ;
2. confirme à l'élève (e-mail) et prévient Olivier ;
3. si l'heure a été prise pendant le paiement, l'élève en choisit une autre dans « My courses »,
   ou il est remboursé.

### Forfaits et abonnements (`live-pack5`, `plan-4`, `plan-8`, `plan-16`)
- Le premier paiement réserve la première séance et ouvre un crédit (`lessons` de
  `js/products.js`), valable **2 mois**. L'élève réserve lui-même les suivantes dans
  « My courses » (`/account/book/<commande>`), parmi les mêmes heures libres, sans paiement.
- **Abonnement** : 7 jours avant la fin, un e-mail avec un lien de paiement
  (`/account/renew/<commande>`, signé) ; payé, un nouveau crédit commence à la fin du
  précédent ; sans paiement, l'abonnement s'arrête. Rien n'est prélevé automatiquement.
- « Stop the renewal » dans « My courses » arrête les rappels ; les séances restantes restent
  utilisables jusqu'à la fin de la période.

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
`status` vaut `complete`, `pending` ou `failed`. Pour un cours en direct payé, `live` vaut `true` et
`booking` donne `{ "booked": true, "start", "minutes", "lessons", "until" }`, `{ "booked": false }`
(heure prise pendant le paiement) ou `{ "renewed": true }` ; `account_url` connecte à « My courses ».

### `POST /free-module`
Le formulaire « Get Module 1 free ».
```json
{ "email": "…", "name": "Sam", "marketing": false, "country": "Nigeria", "currency": "NGN" }
```
Le serveur doit :
1. vérifier l'adresse et limiter les demandes : une par adresse et par jour, quelques-unes par adresse IP ;
2. enregistrer le contact : adresse, prénom, pays, date, et le consentement `marketing` tel quel (la case est décochée par défaut) ;
3. envoyer **tout de suite** `emails/module-gratuit.html` et sa version `.txt`. Les liens pointent vers la copie publique du module A0-1, préparée par l'atelier dans `livraison/boutique/gratuit/free-module/` (déjà tatouée « Free sample »), sous les noms définitifs de `noms.py` (`PasAPas-French_A0-Free-Sample_01-Module-1_Book.pdf`, `…_Online.html`, `…_Memo.pdf`, et les MP3 dans `audio/`). Ils peuvent rester publics : le module est offert ;
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

### La salle vidéo : `/account/lesson/<séance>`
Une page du serveur, dans « My courses » : la salle JaaS (8x8) s'ouvre 10 minutes avant le début,
avec un jeton signé par le serveur (`JAAS_APP_ID`, `JAAS_KID`, clé privée `donnees/jaas.pem`).
Olivier entre par son propre lien (`?k=<clé>`, dans l'événement de l'agenda et son e-mail), en
modérateur.

## Protection contre la fraude

### Les fichiers
1. **Jamais de fichier public.** Les productions sont stockées hors du site (un stockage privé). Seul le module gratuit peut avoir un lien stable, et il est tatoué « Free sample ».
2. **Tatouage à la livraison, sans intervention.** Le stockage privé reçoit les dossiers `livraison/boutique/stock-prive/<produit>/` de l'atelier (un dossier par identifiant de `js/products.js`, avec `manifeste.json` : rôle, taille et SHA-256 de chaque fichier). Après `payment.complete`, le serveur exécute `livrer_cours.py` de l'atelier, ou la même logique : contrôle des empreintes, copies au nom de l'acheteur (nom, e-mail, référence de commande) avec `tatouer.py`, inscription au registre des licences, `.zip` de la commande, puis envoi des liens. Olivier n'intervient pas. Aucun fichier ne part sans tatouage, et un dossier sans adresse du site (`"adresse": ""` dans le manifeste) ne se vend pas.
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
`tcf-dap`, `tcf-irn`) sont des packs de 6 sujets complets (jusqu’à 5 packs par examen, soit 30 sujets), sans tâche commune. L'atelier les
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
