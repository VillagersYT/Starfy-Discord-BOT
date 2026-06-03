# Hypixel Starfy Discord Bot

Bot Discord pour lier un compte Minecraft à un compte Discord, récupérer les **stars BedWars Hypixel**, et synchroniser automatiquement les pseudos serveur.

---

## Sommaire

- [1) Ce que fait le bot](#1-ce-que-fait-le-bot)
- [2) Prérequis](#2-prérequis)
- [3) Installation de A à Z](#3-installation-de-a-à-z)
- [4) Configuration `.env`](#4-configuration-env)
- [5) Déploiement des commandes Discord](#5-déploiement-des-commandes-discord)
- [6) Lancement du bot](#6-lancement-du-bot)
- [7) Utilisation de A à Z (côté Discord)](#7-utilisation-de-a-à-z-côté-discord)
- [8) Référence complète des commandes](#8-référence-complète-des-commandes)
- [9) Comment le bot fonctionne (interne)](#9-comment-le-bot-fonctionne-interne)
- [10) Structure du code](#10-structure-du-code)
- [11) Base de données SQLite](#11-base-de-données-sqlite)
- [12) Logs, tests et maintenance](#12-logs-tests-et-maintenance)
- [13) Dépannage](#13-dépannage)
- [14) Sécurité et bonnes pratiques](#14-sécurité-et-bonnes-pratiques)
- [15) Licence](#15-licence)

---

## 1) Ce que fait le bot

### Fonctionnalités principales

- Liaison **vérifiée** d'un compte Minecraft via le social Discord renseigné sur Hypixel (`/link`).
- Affichage des stars BedWars (`/stars`).
- Rafraîchissement manuel des stars (`/update`) avec quota utilisateur.
- Synchronisation automatique du pseudo Discord au format :
  - `[{stars}{symbol}] {ign}`
- Détection automatique des IGN dans les pseudos serveur et auto-liaison (si vérification sociale valide).
- Configuration serveur via panneau interactif (`/config`) :
  - activer/désactiver la synchro pseudo,
  - forcer la langue (`fr`/`en`/auto).
- Commandes admin bot : forcer un lien, supprimer un lien, rafraîchir un joueur.

### APIs utilisées

- **Hypixel API** (données joueur + social Discord)
- **Mojang API** (résolution IGN → UUID)

---

## 2) Prérequis

- **Node.js 22.5.0+**
- Un bot Discord créé dans le portail développeur
- Une clé API Hypixel
- Un serveur Discord où le bot est invité

---

## 3) Installation de A à Z

### Étape 1 — Cloner et installer

```bash
git clone https://github.com/VillagersYT/Starfy-Discord-BOT.git
cd Starfy-Discord-BOT
npm install
```

### Étape 2 — Créer le fichier d'environnement

```bash
cp .env.example .env
```

Puis remplir toutes les variables requises (voir section [4](#4-configuration-env)).

### Étape 3 — Configurer l'application Discord

Dans le [Discord Developer Portal](https://discord.com/developers/applications) :

1. Créer une application puis un bot.
2. Copier :
   - **Bot Token** → `DISCORD_TOKEN`
   - **Application ID** → `DISCORD_CLIENT_ID`
3. Activer les intents privilégiés :
   - **Server Members Intent**
   - **Message Content Intent**
4. Inviter le bot sur votre serveur avec les permissions nécessaires :
   - `View Channels`
   - `Send Messages`
   - `Use Application Commands`
   - `Embed Links`
   - `Read Message History`
   - `Manage Nicknames` (obligatoire pour la synchro pseudo)

### Étape 4 — Créer une clé Hypixel

- Aller sur <https://developer.hypixel.net/dashboard>
- Générer une clé API
- La renseigner dans `HYPIXEL_API_KEY`

---

## 4) Configuration `.env`

Variables disponibles (depuis `.env.example`) :

| Variable | Requise | Description |
|---|---:|---|
| `DISCORD_TOKEN` | ✅ | Token du bot Discord |
| `DISCORD_CLIENT_ID` | ✅ | Application ID Discord |
| `HYPIXEL_API_KEY` | ✅ | Clé API Hypixel |
| `BOT_ADMIN_IDS` | ❌ | IDs Discord admin bot, séparés par des virgules |
| `DEV_GUILD_ID` | ❌ | ID de guilde test pour déploiement instantané des commandes |
| `DATABASE_PATH` | ❌ | Chemin SQLite (défaut `./data/starfy.db`) |

### Exemple

```env
DISCORD_TOKEN=xxxxxxxx
DISCORD_CLIENT_ID=123456789012345678
HYPIXEL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
BOT_ADMIN_IDS=111111111111111111,222222222222222222
DEV_GUILD_ID=333333333333333333
DATABASE_PATH=./data/starfy.db
```

---

## 5) Déploiement des commandes Discord

Avant de lancer le bot, déployez les slash commands :

```bash
npm run deploy
```

- Si `DEV_GUILD_ID` est défini : commandes déployées sur la guilde de dev (quasi instantané).
- Sinon : déploiement global (peut prendre du temps à apparaître).

---

## 6) Lancement du bot

```bash
npm start
```

Au démarrage, le bot :

1. Charge les variables d'environnement
2. Initialise SQLite et les tables
3. Connecte le client Discord
4. Enregistre les events
5. Démarre le scheduler de rafraîchissement périodique

---

## 7) Utilisation de A à Z (côté Discord)

### 7.1 Lier son compte correctement

1. Sur Hypixel, renseigner votre Discord dans :
   - `Main menu → My Profile → Social Media → Discord`
2. Dans Discord :
   - `/link ign:<VotrePseudoMinecraft>`
3. Si la vérification réussit :
   - lien enregistré,
   - stars récupérées,
   - pseudo serveur mis à jour si possible.

### 7.2 Voir les stars

- `/stars` → vos stars (si vous êtes lié)
- `/stars user:@Membre` → stars du membre lié
- `/stars ign:PseudoMinecraft` → stars d'un pseudo précis

### 7.3 Mettre à jour ses stars

- `/update`
- Quota : **10 utilisations par heure par utilisateur**

### 7.4 Retirer son lien

- `/unlink`

### 7.5 Configuration serveur

- `/config` (permission **Gérer le serveur**)
- Panneau interactif :
  - activer/désactiver détection + synchro pseudo
  - choisir langue (`Auto`, `Français`, `English`)

### 7.6 Balayer les membres

- `/scan-members` (permission **Gérer le serveur**)
- Le bot :
  - lit les pseudos serveur,
  - extrait les IGN valides,
  - tente une auto-liaison vérifiée,
  - affiche une progression temps réel.

---

## 8) Référence complète des commandes

| Commande | Accès | Description |
|---|---|---|
| `/help` | Tous | Affiche l'aide |
| `/link <ign>` | Tous | Lie un compte Minecraft avec vérification sociale Hypixel |
| `/unlink` | Tous | Supprime son lien |
| `/stars [user] [ign]` | Tous | Affiche les stars BedWars |
| `/update` | Tous | Rafraîchit ses stars (quota 10/h) |
| `/config` | Manage Server | Ouvre le panneau de configuration du serveur |
| `/scan-members` | Manage Server | Scanne les membres et auto-lie les comptes vérifiés |
| `/force-link <user> <ign>` | Admin bot | Force la liaison d'un membre |
| `/force-unlink <user>` | Admin bot | Supprime la liaison d'un membre |
| `/refresh <ign>` | Admin bot | Force un rafraîchissement joueur Hypixel |

> Les **admins bot** sont définis via `BOT_ADMIN_IDS`.

---

## 9) Comment le bot fonctionne (interne)

### 9.1 Pipeline de liaison `/link`

1. Résolution IGN → UUID via Mojang
2. Vérification d'un éventuel lien existant
3. Appel Hypixel pour stars + social Discord
4. Comparaison social Discord Hypixel avec l'utilisateur Discord
5. Écriture en base (`links`, `stars_cache`)
6. Synchronisation du pseudo sur les serveurs partagés

### 9.2 Gestion des stars et cache

- Les stars sont calculées depuis l'XP BedWars (formule Plancke).
- Cache SQLite `stars_cache` avec TTL.
- Scheduler périodique qui rafraîchit les entrées les plus anciennes.

### 9.3 Rate limiting

- Limiteur interne pour Hypixel et Mojang.
- Alignement avec les headers `RateLimit-*` d'Hypixel.
- Back-off automatique en cas de `429`.

### 9.4 Synchronisation des pseudos

- Format : `[{stars}{symbol}] {ign}`
- Contraintes gérées :
  - propriétaire de serveur non renommable,
  - rôle bot insuffisant,
  - permission `Manage Nicknames` manquante.

### 9.5 i18n

- Fichiers `src/i18n/fr.json` et `src/i18n/en.json`
- Résolution langue :
  - `locale_override` serveur si défini,
  - sinon locale Discord de l'utilisateur,
  - fallback anglais.

---

## 10) Structure du code

```text
src/
  index.js                   # Point d'entrée
  env.js                     # Validation des variables d'environnement
  config.js                  # Constantes globales (couleurs, quotas, templates)
  deploy-commands.js         # Déploiement slash commands
  logger.js                  # Logger simple console

  discord/
    client.js                # Création client Discord + intents
    commandRegistry.js       # Chargement/déploiement des commandes
    eventRegistry.js         # Enregistrement des events
    embeds.js                # Fabrication des embeds
    nickname.js              # Format + application pseudo serveur
    linkFlow.js              # Flux métier de /link
    configPanel.js           # UI interactive /config
    nicknameNote.js          # Notes de statut synchro pseudo
    commands/                # Toutes les slash commands
    events/                  # ready, interactionCreate, guildMemberAdd/Update

  services/
    starService.js           # Accès API + cache stars
    linkService.js           # Vérification sociale + liaison
    nicknameSync.js          # Sync pseudo sur serveurs partagés
    memberAutoLink.js        # Auto-liaison depuis pseudo membre
    scheduler.js             # Refresh périodique du cache

  hypixel/
    hypixelClient.js         # Client Hypixel
    mojang.js                # Client Mojang + cache 1h
    rateLimiter.js           # Limiteurs de débit

  db/
    database.js              # Init SQLite + migration
    links.repo.js            # Requêtes table links
    stars.repo.js            # Requêtes table stars_cache
    guilds.repo.js           # Requêtes table guild_config

  util/
    starCalculator.js        # XP BedWars -> stars
    starSymbol.js            # Symbole/couleur selon prestige
    socialMatch.js           # Matching Discord social
    userRateLimit.js         # Quota glissant utilisateur
    errors.js                # Erreurs métier/API
```

---

## 11) Base de données SQLite

Tables créées automatiquement :

- `links`
  - association Discord ↔ Minecraft
- `stars_cache`
  - cache stars + timestamp de mise à jour
- `guild_config`
  - configuration par serveur (synchro, langue)

Le mode WAL est activé (`PRAGMA journal_mode = WAL`).

---

## 12) Logs, tests et maintenance

### Logs

- Logs console horodatés (`INFO`, `WARN`, `ERROR`, `DEBUG`).
- Le bot capture `unhandledRejection` et `uncaughtException` pour éviter les crashs.

### Tests

```bash
npm test
```

> Le script de test est disponible et exécute le runner de tests Node.js.

---

## 13) Dépannage

### Les commandes n'apparaissent pas

- Vérifier `DISCORD_CLIENT_ID`, `DISCORD_TOKEN`
- Relancer `npm run deploy`
- Si déploiement global : attendre propagation Discord

### `/link` échoue alors que le pseudo est correct

- Vérifier le social Discord sur Hypixel
- Vérifier que le Discord Hypixel correspond exactement à votre compte

### Le pseudo Discord ne change pas

- Vérifier permission `Manage Nicknames`
- Vérifier que le rôle du bot est au-dessus du rôle de l'utilisateur
- Le propriétaire du serveur ne peut pas être renommé par un bot

### Erreurs de rate limit

- Normal en cas de forte charge API
- Réessayer après quelques instants

---

## 14) Sécurité et bonnes pratiques

- Ne jamais commit le fichier `.env`
- Limiter `BOT_ADMIN_IDS` aux personnes de confiance
- Utiliser une guilde de test avec `DEV_GUILD_ID` avant production
- Surveiller les logs régulièrement
- Régénérer les clés/tokens en cas de fuite

---

## 15) Licence

Projet sous licence [MIT](./LICENSE).
