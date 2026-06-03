'use strict';
const { t } = require('../i18n/index.js');

const KNOWN = new Set(['owner', 'not_manageable', 'missing_permission', 'sync_disabled']);

// À partir des résultats de syncForDiscordId, renvoie une ligne localisée
// décrivant ce qui s'est passé pour le pseudo DANS le serveur courant
// (succès, ou raison précise de l'échec), ou '' si non concerné.
function nicknameStatusNote(results, guildId, locale) {
  if (!Array.isArray(results)) return '';
  const here = results.find((r) => r.guildId === guildId);
  if (!here) return '';
  if (here.ok) return `\n\n${t(locale, 'nick.ok')}`;
  const reason = KNOWN.has(here.reason) ? here.reason : 'error';
  return `\n\n${t(locale, `nick.skip.${reason}`)}`;
}

module.exports = { nicknameStatusNote };
