'use strict';
const { getBedwarsLevel } = require('../util/starCalculator.js');
const { PlayerNotFound, RateLimited, NetworkError, ApiError } = require('../util/errors.js');
const { hypixelLimiter } = require('./rateLimiter.js');
const { FETCH_TIMEOUT_MS } = require('../config.js');

function createHypixelClient({ apiKey, fetchImpl = fetch, limiter = hypixelLimiter, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  async function fetchPlayer(uuid) {
    return limiter.schedule(async () => {
      let res;
      try {
        res = await fetchImpl(`https://api.hypixel.net/v2/player?uuid=${encodeURIComponent(uuid)}`, {
          headers: { 'API-Key': apiKey },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (e) { throw new NetworkError(e); }

      limiter.updateFromHeaders(res.headers);

      if (res.status === 429) {
        const reset = Number(res.headers.get('RateLimit-Reset')) || 60;
        throw new RateLimited(reset);
      }
      if (res.status === 403) throw new ApiError('Clé API Hypixel invalide', 'FORBIDDEN');
      if (res.status < 200 || res.status >= 300) throw new NetworkError(new Error(`Hypixel ${res.status}`));

      const data = await res.json();
      if (!data || data.success === false) throw new ApiError(data && data.cause ? data.cause : 'Hypixel error', 'API');
      const player = data.player;
      if (!player) throw new PlayerNotFound();

      const exp = (player.stats && player.stats.Bedwars && Number(player.stats.Bedwars.Experience)) || 0;
      const discordSocial = player.socialMedia && player.socialMedia.links && player.socialMedia.links.DISCORD || null;

      return {
        uuid,
        username: player.displayname || null,
        bedwarsExp: exp,
        stars: getBedwarsLevel(exp),
        discordSocial,
      };
    });
  }

  return { fetchPlayer };
}

module.exports = { createHypixelClient };
