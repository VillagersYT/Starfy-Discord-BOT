'use strict';
const { getDb } = require('./database.js');

const DEFAULTS = { scan_enabled: 1, scan_channel_id: null, nickname_sync_enabled: 1, locale_override: null };

function getConfig(guildId) {
  const row = getDb().prepare('SELECT * FROM guild_config WHERE guild_id=?').get(guildId);
  return row || { guild_id: guildId, ...DEFAULTS };
}
function setConfig(guildId, patch) {
  const cur = getConfig(guildId);
  const next = { ...cur, ...patch, guild_id: guildId };
  getDb().prepare(`
    INSERT INTO guild_config (guild_id, scan_enabled, scan_channel_id, nickname_sync_enabled, locale_override)
    VALUES (@guild_id, @scan_enabled, @scan_channel_id, @nickname_sync_enabled, @locale_override)
    ON CONFLICT(guild_id) DO UPDATE SET
      scan_enabled=excluded.scan_enabled, scan_channel_id=excluded.scan_channel_id,
      nickname_sync_enabled=excluded.nickname_sync_enabled, locale_override=excluded.locale_override
  `).run(next);
  return next;
}

module.exports = { getConfig, setConfig };
