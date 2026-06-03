'use strict';
const guildsRepo = require('../db/guilds.repo.js');
const linksRepo = require('../db/links.repo.js');
const starsRepo = require('../db/stars.repo.js');
const { verifyAndLink } = require('./linkService.js');
const { applyNickname, extractIgnFromNickname } = require('../discord/nickname.js');
const logger = require('../logger.js');

const DEFAULT_DEPS = {
  guildsRepo, linksRepo, starsRepo, verifyAndLink, applyNickname,
  extractIgn: extractIgnFromNickname, logger,
};

// Détecte l'IGN dans le pseudo d'un membre, le vérifie (social Hypixel) et le lie.
// Ne throw jamais. Renvoie { action, ... } pour le résumé du balayage :
//   'skip' | 'already_linked' | 'linked' | 'not_verified' | 'rate_limited' | 'error'
async function autoLinkMember(member, deps = DEFAULT_DEPS) {
  const { guildsRepo, linksRepo, starsRepo, verifyAndLink, applyNickname, extractIgn, logger } = deps;
  try {
    if (!member || !member.guild) return { action: 'skip', reason: 'no_member' };
    const cfg = guildsRepo.getConfig(member.guild.id);
    if (!cfg || !cfg.nickname_sync_enabled) return { action: 'skip', reason: 'sync_disabled' };

    const ign = extractIgn(member.nickname);
    if (!ign) return { action: 'skip', reason: 'no_ign' };

    const link = linksRepo.getByDiscordId(member.id);
    if (link && String(link.mc_username).toLowerCase() === ign.toLowerCase()) {
      const cached = starsRepo.getByUsername(link.mc_username);
      if (cached) await applyNickname(member, cached.stars, link.mc_username);
      return { action: 'already_linked' };
    }

    const r = await verifyAndLink({ discordUser: member.user, ign });
    if (r.ok) {
      await applyNickname(member, r.stars, r.ign);
      return { action: 'linked', ign: r.ign };
    }
    return { action: 'not_verified', reason: r.reason };
  } catch (e) {
    // Issues ATTENDUES pendant un balayage : un pseudo qui ressemble à un IGN
    // mais n'existe pas (404 Mojang), un compte sans données Hypixel, ou un 429
    // transitoire (le limiter recule déjà). On ne les logue pas comme des échecs.
    const code = e && e.code;
    if (code === 'INVALID_IGN') return { action: 'not_verified', reason: 'invalid_ign' };
    if (code === 'PLAYER_NOT_FOUND') return { action: 'not_verified', reason: 'no_hypixel' };
    if (code === 'RATE_LIMITED') return { action: 'rate_limited' };
    logger.warn('autoLinkMember failed', e);
    return { action: 'error' };
  }
}

module.exports = { autoLinkMember };
