'use strict';
const { NICKNAME_TEMPLATE } = require('../config.js');
const { starSymbol } = require('../util/starSymbol.js');
const logger = require('../logger.js');

const MAX = 32;

function formatNickname(stars, ign) {
  const symbol = starSymbol(stars);
  const prefix = NICKNAME_TEMPLATE.replace('{stars}', String(stars)).replace('{symbol}', symbol).replace('{ign}', '');
  let name = NICKNAME_TEMPLATE.replace('{stars}', String(stars)).replace('{symbol}', symbol).replace('{ign}', ign);
  if (name.length > MAX) {
    const room = Math.max(0, MAX - prefix.length);
    name = NICKNAME_TEMPLATE.replace('{stars}', String(stars)).replace('{symbol}', symbol).replace('{ign}', ign.slice(0, room));
  }
  return name.slice(0, MAX);
}

// Applique le nickname avec toutes les gardes ; ne throw jamais.
async function applyNickname(member, stars, ign) {
  try {
    if (!member || !member.guild) return { ok: false, reason: 'no_member' };
    if (member.id === member.guild.ownerId) return { ok: false, reason: 'owner' };
    if (!member.manageable) return { ok: false, reason: 'not_manageable' };
    const me = member.guild.members.me;
    if (!me || !me.permissions.has('ManageNicknames')) return { ok: false, reason: 'missing_permission' };
    const nick = formatNickname(stars, ign);
    if (member.nickname === nick) return { ok: true, reason: 'unchanged' };
    await member.setNickname(nick, 'Hypixel Starfy: sync stars');
    return { ok: true };
  } catch (err) {
    logger.warn('applyNickname failed', err);
    return { ok: false, reason: 'error' };
  }
}

const IGN_RE = /^[A-Za-z0-9_]{2,16}$/;

// Inverse de formatNickname : retire le préfixe "[<stars><symbole>] " que le bot
// ajoute, puis valide le reste comme IGN Minecraft. Renvoie l'IGN ou null.
function extractIgnFromNickname(nick) {
  if (typeof nick !== 'string') return null;
  const stripped = nick.replace(/^\[\d{1,4}\s*[^\]]*\]\s+/, '').trim();
  return IGN_RE.test(stripped) ? stripped : null;
}

module.exports = { formatNickname, applyNickname, extractIgnFromNickname, MAX };
