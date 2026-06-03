'use strict';
const { resolveUuid: defaultResolveUuid } = require('../hypixel/mojang.js');
const { discordSocialMatches } = require('../util/socialMatch.js');
const { refreshByUuid: defaultRefreshByUuid } = require('./starService.js');
const defaultLinksRepo = require('../db/links.repo.js');

// Dépendances injectables (réseau + DB) : valeurs réelles en production,
// remplaçables dans les tests pour rester déterministe et hors réseau.
const DEFAULT_DEPS = {
  resolveUuid: defaultResolveUuid,
  refreshByUuid: defaultRefreshByUuid,
  linksRepo: defaultLinksRepo,
};

// Violation de la contrainte UNIQUE(mc_uuid) : un autre utilisateur a lié ce
// même compte entre notre vérification (getByUuid) et notre insertion. La
// contrainte protège l'intégrité ; on traduit l'échec en « déjà pris ».
function isUuidTakenError(e) {
  return !!e && /UNIQUE constraint failed:\s*links\.mc_uuid/i.test(String(e.message));
}

// Vérifie le social Hypixel puis lie. Renvoie un objet résultat (jamais throw pour les cas métier).
async function verifyAndLink({ discordUser, ign }, deps = DEFAULT_DEPS) {
  const { resolveUuid, refreshByUuid, linksRepo } = deps;
  const { uuid, name } = await resolveUuid(ign); // throw InvalidIgn si inconnu
  const existing = linksRepo.getByUuid(uuid);
  if (existing && existing.discord_id !== discordUser.id) return { ok: false, reason: 'taken' };

  const data = await refreshByUuid(uuid, name); // remplit le cache stars
  const matches = discordSocialMatches(data.discordSocial, {
    username: discordUser.username, discriminator: discordUser.discriminator,
  });
  if (!matches) return { ok: false, reason: 'mismatch', ign: name, stars: data.stars };

  try {
    linksRepo.upsertLink({ discordId: discordUser.id, uuid, username: name, method: 'social' });
  } catch (e) {
    if (isUuidTakenError(e)) return { ok: false, reason: 'taken' };
    throw e;
  }
  return { ok: true, ign: name, uuid, stars: data.stars };
}

// Lien admin : pas de vérification social.
async function adminLink({ discordId, ign }, deps = DEFAULT_DEPS) {
  const { resolveUuid, refreshByUuid, linksRepo } = deps;
  const { uuid, name } = await resolveUuid(ign);
  const existing = linksRepo.getByUuid(uuid);
  if (existing && existing.discord_id !== discordId) return { ok: false, reason: 'taken' };
  const data = await refreshByUuid(uuid, name).catch(() => ({ stars: 0 }));
  try {
    linksRepo.upsertLink({ discordId, uuid, username: name, method: 'admin' });
  } catch (e) {
    if (isUuidTakenError(e)) return { ok: false, reason: 'taken' };
    throw e;
  }
  return { ok: true, ign: name, uuid, stars: data.stars };
}

module.exports = { verifyAndLink, adminLink, isUuidTakenError };
