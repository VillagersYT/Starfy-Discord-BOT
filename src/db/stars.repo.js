'use strict';
const { getDb } = require('./database.js');

function upsertStars({ username, uuid = null, stars, source = 'api' }) {
  getDb().prepare(`
    INSERT INTO stars_cache (mc_username_lower, mc_username, mc_uuid, stars, source, updated_at)
    VALUES (@lower, @username, @uuid, @stars, @source, @at)
    ON CONFLICT(mc_username_lower) DO UPDATE SET
      mc_username=excluded.mc_username,
      mc_uuid=COALESCE(excluded.mc_uuid, stars_cache.mc_uuid),
      stars=excluded.stars, source=excluded.source, updated_at=excluded.updated_at
  `).run({ lower: String(username).toLowerCase(), username, uuid, stars, source, at: Date.now() });
}
function getByUsername(username) { return getDb().prepare('SELECT * FROM stars_cache WHERE mc_username_lower=?').get(String(username).toLowerCase()); }
// Supprime l'entrée de cache d'un pseudo (utilisé pour purger l'ancien pseudo
// après un changement de nom Minecraft, sinon les lignes orphelines s'accumulent).
function deleteByUsername(username) { return getDb().prepare('DELETE FROM stars_cache WHERE mc_username_lower=?').run(String(username).toLowerCase()).changes; }
// Liens dont le cache est le plus ancien (jointure links<->stars), pour le scheduler.
function getStalest(limit) {
  return getDb().prepare(`
    SELECT l.discord_id, l.mc_uuid AS uuid, l.mc_username AS username,
           COALESCE(s.updated_at, 0) AS updated_at
    FROM links l
    LEFT JOIN stars_cache s ON s.mc_username_lower = LOWER(l.mc_username)
    ORDER BY updated_at ASC
    LIMIT ?
  `).all(limit);
}
function allCached() { return getDb().prepare('SELECT * FROM stars_cache').all(); }

module.exports = { upsertStars, getByUsername, deleteByUsername, getStalest, allCached };
