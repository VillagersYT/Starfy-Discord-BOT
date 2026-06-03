'use strict';
const { HYPIXEL_API_KEY } = require('../env.js');
const { createHypixelClient } = require('../hypixel/hypixelClient.js');
const { resolveUuid } = require('../hypixel/mojang.js');
const starsRepo = require('../db/stars.repo.js');
const linksRepo = require('../db/links.repo.js');
const { CACHE_TTL_MS } = require('../config.js');

const hypixel = createHypixelClient({ apiKey: HYPIXEL_API_KEY });

// Un seul fetch Hypixel par UUID : renvoie les stars + le social Discord et
// met à jour le cache (source 'api'). L'UUID est l'identité stable : si le
// joueur a changé de pseudo Minecraft, on réconcilie le lien pour rester exact.
async function refreshByUuid(uuid, knownUsername, client = hypixel) {
  const data = await client.fetchPlayer(uuid);
  const username = data.username || knownUsername;
  starsRepo.upsertStars({ username, uuid, stars: data.stars, source: 'api' });
  const link = linksRepo.getByUuid(uuid);
  if (link && username && link.mc_username !== username) {
    // Changement de pseudo réel (pas une simple casse) : purger l'ancienne
    // entrée de cache pour éviter l'accumulation de lignes orphelines.
    if (link.mc_username.toLowerCase() !== username.toLowerCase()) {
      starsRepo.deleteByUsername(link.mc_username);
    }
    linksRepo.updateUsername(link.discord_id, username);
  }
  return { stars: data.stars, username, discordSocial: data.discordSocial };
}

// Renvoie les stars depuis le cache si frais, sinon fetch (si autorisé).
async function getStarsForUsername(username, { allowFetch = true } = {}) {
  const cached = starsRepo.getByUsername(username);
  const fresh = cached && Date.now() - cached.updated_at < CACHE_TTL_MS;
  if (fresh || !allowFetch) {
    return cached
      ? { stars: cached.stars, uuid: cached.mc_uuid, username: cached.mc_username, updatedAt: cached.updated_at, fresh: !!fresh, cached: true }
      : null;
  }
  const { uuid } = await resolveUuid(username);
  const r = await refreshByUuid(uuid, username);
  return { stars: r.stars, uuid, username: r.username, updatedAt: Date.now(), fresh: true, cached: false };
}

module.exports = { refreshByUuid, getStarsForUsername };
