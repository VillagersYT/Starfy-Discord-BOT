'use strict';
const { applyNickname } = require('../discord/nickname.js');
const guildsRepo = require('../db/guilds.repo.js');
const linksRepo = require('../db/links.repo.js');
const starsRepo = require('../db/stars.repo.js');
const logger = require('../logger.js');

// Met à jour le nickname d'un discordId sur tous les serveurs partagés.
// Renvoie un tableau { guildId, ok, reason? } pour permettre aux commandes
// d'expliquer à l'utilisateur ce qui s'est passé (et trace chaque skip).
async function syncForDiscordId(client, discordId) {
  const results = [];
  const link = linksRepo.getByDiscordId(discordId);
  if (!link) return results;
  const cached = starsRepo.getByUsername(link.mc_username);
  if (!cached) return results;
  for (const guild of client.guilds.cache.values()) {
    const cfg = guildsRepo.getConfig(guild.id);
    if (!cfg.nickname_sync_enabled) {
      results.push({ guildId: guild.id, ok: false, reason: 'sync_disabled' });
      continue;
    }
    let member;
    try { member = guild.members.cache.get(discordId) || await guild.members.fetch(discordId); }
    catch { continue; } // pas membre de ce serveur
    if (!member) continue;
    const res = await applyNickname(member, cached.stars, link.mc_username);
    results.push({ guildId: guild.id, ...res });
    if (!res.ok) logger.info(`nickname not applied: guild=${guild.id} user=${discordId} reason=${res.reason}`);
  }
  return results;
}

module.exports = { syncForDiscordId };
