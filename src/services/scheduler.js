'use strict';
const starsRepo = require('../db/stars.repo.js');
const { refreshByUuid } = require('./starService.js');
const { syncForDiscordId } = require('./nicknameSync.js');
const { SCHEDULER_INTERVAL_MS, SCHEDULER_BATCH, CACHE_TTL_MS } = require('../config.js');
const logger = require('../logger.js');

function startScheduler(client) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const candidates = starsRepo.getStalest(SCHEDULER_BATCH)
        .filter((c) => Date.now() - c.updated_at >= CACHE_TTL_MS);
      for (const c of candidates) {
        try {
          await refreshByUuid(c.uuid, c.username);
          await syncForDiscordId(client, c.discord_id);
        } catch (e) {
          logger.warn(`scheduler refresh failed for ${c.username}`, e);
        }
      }
      if (candidates.length) logger.info(`scheduler: refreshed ${candidates.length} player(s)`);
    } catch (e) {
      logger.error('scheduler tick error', e);
    } finally {
      running = false;
    }
  };
  setInterval(tick, SCHEDULER_INTERVAL_MS);
  logger.info(`scheduler started (every ${SCHEDULER_INTERVAL_MS / 1000}s, batch ${SCHEDULER_BATCH})`);
}

module.exports = { startScheduler };
