'use strict';

function discordSocialMatches(social, user) {
  if (!social || typeof social !== 'string' || !user) return false;
  const s = social.trim().toLowerCase();
  if (!s) return false;
  const u = String(user.username || '').toLowerCase();
  if (!u) return false;
  if (s === u) return true;                // nouveau format
  if (s === `${u}#0`) return true;         // username#0 saisi à la main
  const disc = String(user.discriminator || '');
  if (disc && disc !== '0' && s === `${u}#${disc}`) return true; // ancien format
  return false;
}

module.exports = { discordSocialMatches };
