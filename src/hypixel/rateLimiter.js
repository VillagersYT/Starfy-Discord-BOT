'use strict';
const { RATE_LIMIT, MOJANG_RATE_LIMIT } = require('../config.js');

const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Limiteur à fenêtre fixe alignée sur la fenêtre réelle d'Hypixel.
//
// Pourquoi pas un token-bucket : un bucket à refill continu autorise, sur une
// fenêtre glissante, un burst initial PLUS le refill (~2x la capacité), ce qui
// dépasse une limite à fenêtre fixe comme celle d'Hypixel (300/5min). Ici on
// compte les requêtes par fenêtre et on se resynchronise sur les en-têtes
// RateLimit-* renvoyés par Hypixel après chaque réponse, de sorte que notre
// fenêtre suit celle du serveur et qu'on ne dépasse jamais `maxRequests`.
class RateLimiter {
  constructor({ maxRequests, windowMs, now = () => Date.now(), sleepFn = defaultSleep }) {
    this.maxRequests = maxRequests; // plafond auto-imposé (< limite serveur)
    this.windowMs = windowMs;
    this.now = now;
    this.sleepFn = sleepFn;
    this.count = 0;
    this.windowStart = now();
    this.pausedUntil = 0; // back-off après un 429
    this.queue = [];
    this.running = false;
  }

  _rollWindow() {
    const t = this.now();
    if (t - this.windowStart >= this.windowMs) {
      this.windowStart = t;
      this.count = 0;
    }
  }

  // ms à attendre avant de pouvoir émettre la prochaine requête (0 = maintenant).
  _msUntilSlot() {
    const t = this.now();
    if (t < this.pausedUntil) return this.pausedUntil - t;
    this._rollWindow();
    if (this.count < this.maxRequests) return 0;
    return (this.windowStart + this.windowMs) - t;
  }

  schedule(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  // NOTE: les tâches s'exécutent séquentiellement (une requête en vol à la fois).
  // Ne pas appeler schedule() DEPUIS une tâche schedulée sur ce même limiter :
  // _drain est mono-passe, l'appel imbriqué resterait en file (interblocage).
  async _drain() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length > 0) {
        const wait = this._msUntilSlot();
        if (wait > 0) {
          // On plafonne le sommeil pour re-vérifier régulièrement (un 429 ou
          // une resynchro d'en-têtes peut modifier l'échéance entre-temps).
          await this.sleepFn(Math.min(wait, 1000));
          continue;
        }
        this._rollWindow();
        this.count += 1;
        const job = this.queue.shift();
        try {
          job.resolve(await job.fn());
        } catch (err) {
          if (err && err.code === 'RATE_LIMITED') {
            // Hypixel nous a 429 : on bloque jusqu'au reset annoncé.
            this.pausedUntil = this.now() + (err.retryAfterMs || this.windowMs);
            this.count = this.maxRequests;
          }
          job.reject(err);
        }
      }
    } finally {
      this.running = false;
    }
  }

  // Resynchronise depuis les en-têtes RateLimit-* (objet Headers fetch).
  updateFromHeaders(headers) {
    if (!headers || typeof headers.get !== 'function') return;
    const remaining = Number(headers.get('RateLimit-Remaining'));
    const limit = Number(headers.get('RateLimit-Limit'));
    const reset = Number(headers.get('RateLimit-Reset'));
    if (Number.isFinite(remaining) && Number.isFinite(limit)) {
      // Reflète la consommation réelle vue par le serveur (sans jamais
      // diminuer notre compteur local — on reste prudent).
      const used = limit - remaining;
      if (used > this.count) this.count = used;
    } else if (Number.isFinite(remaining)) {
      const used = this.maxRequests - remaining;
      if (used > this.count) this.count = used;
    }
    if (Number.isFinite(reset) && reset > 0) {
      // Aligne la fin de notre fenêtre sur le reset annoncé par Hypixel, avec
      // 1 s de marge pour que notre fenêtre ne se ferme jamais AVANT celle du
      // serveur (sinon un reset sous-estimé pourrait rouvrir un burst).
      this.windowStart = this.now() - (this.windowMs - (reset + 1) * 1000);
    }
  }
}

const hypixelLimiter = new RateLimiter(RATE_LIMIT);
const mojangLimiter = new RateLimiter(MOJANG_RATE_LIMIT);

module.exports = { RateLimiter, hypixelLimiter, mojangLimiter };
