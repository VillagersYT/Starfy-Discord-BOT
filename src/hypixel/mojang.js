'use strict';
const { InvalidIgn, RateLimited, NetworkError } = require('../util/errors.js');
const { FETCH_TIMEOUT_MS } = require('../config.js');
const { mojangLimiter } = require('./rateLimiter.js');

const CACHE_TTL = 60 * 60 * 1000; // 1h

function createMojang({ fetchImpl = fetch, timeoutMs = FETCH_TIMEOUT_MS, limiter = mojangLimiter } = {}) {
  const cache = new Map(); // key: lower ign -> { value, at }

  async function resolveUuid(ign) {
    const key = String(ign || '').toLowerCase();
    if (!/^[a-z0-9_]{2,16}$/.test(key)) throw new InvalidIgn(ign);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;

    // Requête réseau passée par le limiter : sérialisée et plafonnée comme
    // Hypixel. La gestion du statut est faite ICI pour qu'un 429 (RATE_LIMITED)
    // déclenche le back-off du limiter avant de remonter l'erreur.
    const data = await limiter.schedule(async () => {
      let res;
      try {
        res = await fetchImpl(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(ign)}`, {
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (e) { throw new NetworkError(e); }

      if (res.status === 404 || res.status === 204) throw new InvalidIgn(ign);
      if (res.status === 429) throw new RateLimited(60);
      if (res.status < 200 || res.status >= 300) throw new NetworkError(new Error(`Mojang ${res.status}`));
      return res.json();
    });

    if (!data || !data.id) throw new InvalidIgn(ign);
    const value = { uuid: data.id, name: data.name };
    cache.set(key, { value, at: Date.now() });
    return value;
  }

  return { resolveUuid };
}

const defaultMojang = createMojang();

module.exports = { createMojang, resolveUuid: defaultMojang.resolveUuid };
