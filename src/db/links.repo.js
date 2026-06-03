'use strict';
const { getDb } = require('./database.js');

function upsertLink({ discordId, uuid, username, method = 'social' }) {
  getDb().prepare(`
    INSERT INTO links (discord_id, mc_uuid, mc_username, link_method, linked_at)
    VALUES (@discordId, @uuid, @username, @method, @at)
    ON CONFLICT(discord_id) DO UPDATE SET
      mc_uuid=excluded.mc_uuid, mc_username=excluded.mc_username,
      link_method=excluded.link_method, linked_at=excluded.linked_at
  `).run({ discordId, uuid, username, method, at: Date.now() });
}
function getByDiscordId(discordId) { return getDb().prepare('SELECT * FROM links WHERE discord_id=?').get(discordId); }
function getByUuid(uuid) { return getDb().prepare('SELECT * FROM links WHERE mc_uuid=?').get(uuid); }
function getByUsername(username) { return getDb().prepare('SELECT * FROM links WHERE LOWER(mc_username)=?').get(String(username).toLowerCase()); }
function deleteByDiscordId(discordId) { return getDb().prepare('DELETE FROM links WHERE discord_id=?').run(discordId).changes; }
// Met à jour seulement le pseudo connu (réconciliation après un changement de
// nom Minecraft) sans toucher à l'UUID, à la méthode ni à la date de lien.
function updateUsername(discordId, username) { return getDb().prepare('UPDATE links SET mc_username=? WHERE discord_id=?').run(username, discordId).changes; }
function allLinks() { return getDb().prepare('SELECT * FROM links').all(); }

module.exports = { upsertLink, getByDiscordId, getByUuid, getByUsername, deleteByDiscordId, updateUsername, allLinks };
