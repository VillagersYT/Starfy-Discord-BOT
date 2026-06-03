'use strict';

// Quota glissant par clé (ex. par utilisateur Discord), en mémoire.
// tryConsume(key) renvoie true et enregistre l'appel s'il reste du quota
// dans la fenêtre, false sinon. Les horodatages expirés sont purgés à la volée.
class UserRateLimit {
  constructor({ max, windowMs, now = () => Date.now() }) {
    this.max = max;
    this.windowMs = windowMs;
    this.now = now;
    this.hits = new Map(); // key -> number[] (timestamps des appels récents)
  }

  _fresh(key, t) {
    const arr = this.hits.get(key);
    if (!arr) return [];
    const kept = arr.filter((ts) => t - ts < this.windowMs);
    if (kept.length) this.hits.set(key, kept);
    else this.hits.delete(key);
    return kept;
  }

  tryConsume(key) {
    const t = this.now();
    const kept = this._fresh(key, t);
    if (kept.length >= this.max) return false;
    kept.push(t);
    this.hits.set(key, kept);
    return true;
  }
}

module.exports = { UserRateLimit };
