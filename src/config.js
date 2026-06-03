'use strict';

// Table des symboles de prestige : le glyphe change au millier rond (Hypixel).
// Triée par min décroissant : on prend le premier dont stars >= min.
const SYMBOL_TIERS = [
  { min: 3000, glyph: '✥' }, // ✥  3000+
  { min: 2000, glyph: '⚝' }, // ⚝  2000+
  { min: 1000, glyph: '✪' }, // ✪  1000+
  { min: 0,    glyph: '✫' }, // ✫  0+
];

// Couleur (hex décimal) par palier de prestige, pour starsEmbed.
const PRESTIGE_COLORS = [
  { min: 3100, color: 0xff5555 },
  { min: 2100, color: 0xffaa00 },
  { min: 1100, color: 0x55ffff },
  { min: 100,  color: 0xffffff },
  { min: 0,    color: 0xaaaaaa },
];

const COLORS = {
  success: 0x57f287,
  error: 0xed4245,
  info: 0x5865f2,
};

const BRANDING = {
  name: 'Hypixel Starfy',
  footer: 'Hypixel Starfy',
};

// Tête du joueur pour les miniatures d'embed.
const PLAYER_HEAD_URL = (uuid) => `https://minotar.net/helm/${uuid}/64.png`;

// Modèle de nickname. {stars}=nombre, {symbol}=glyphe, {ign}=pseudo MC.
const NICKNAME_TEMPLATE = '[{stars}{symbol}] {ign}';

// Rate-limit Hypixel : 300 req / 5 min réels. On s'impose un plafond par
// fenêtre (290) sous la limite réelle ; le limiter (fenêtre fixe) se
// resynchronise sur les en-têtes RateLimit-* renvoyés par Hypixel.
const RATE_LIMIT = { maxRequests: 290, windowMs: 5 * 60 * 1000 };

// Rate-limit Mojang : l'API ne publie pas de quota officiel ni d'en-têtes
// RateLimit-*. On s'impose un plafond prudent par fenêtre (les résolutions
// pseudo->uuid sont en plus mises en cache 1 h), et le limiter recule sur un 429.
const MOJANG_RATE_LIMIT = { maxRequests: 120, windowMs: 60 * 1000 };

// Durée de validité d'une entrée stars_cache avant re-fetch.
const CACHE_TTL_MS = 10 * 60 * 1000;

// Timeout par requête HTTP sortante (Hypixel/Mojang). Le fetch natif de Node
// n'a AUCUN timeout par défaut : sans cela, une requête bloquée gèlerait la
// file du rate-limiter Hypixel (qui s'exécute séquentiellement) indéfiniment.
const FETCH_TIMEOUT_MS = 10 * 1000;

// Scheduler : toutes les 30 s, on rafraîchit jusqu'à SCHEDULER_BATCH joueurs périmés.
const SCHEDULER_INTERVAL_MS = 30 * 1000;
const SCHEDULER_BATCH = 15;

// Quota de la commande /update : 10 appels par heure et par utilisateur.
const UPDATE_RATE = { max: 10, windowMs: 60 * 60 * 1000 };

module.exports = {
  SYMBOL_TIERS, PRESTIGE_COLORS, COLORS, BRANDING, PLAYER_HEAD_URL,
  NICKNAME_TEMPLATE, RATE_LIMIT, MOJANG_RATE_LIMIT, CACHE_TTL_MS, FETCH_TIMEOUT_MS,
  SCHEDULER_INTERVAL_MS, SCHEDULER_BATCH, UPDATE_RATE,
};
