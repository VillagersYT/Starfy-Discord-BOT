'use strict';

class ApiError extends Error {
  constructor(message, code) { super(message); this.name = 'ApiError'; this.code = code || 'API'; }
}
class RateLimited extends ApiError {
  constructor(retryAfterSeconds = 60) {
    super('Rate limited', 'RATE_LIMITED');
    this.retryAfterMs = Math.max(0, retryAfterSeconds) * 1000;
  }
}
class PlayerNotFound extends ApiError {
  constructor() { super('Player not found', 'PLAYER_NOT_FOUND'); }
}
class InvalidIgn extends ApiError {
  constructor(ign) { super(`Invalid IGN: ${ign}`, 'INVALID_IGN'); this.ign = ign; }
}
class NetworkError extends ApiError {
  constructor(cause) { super('Network error', 'NETWORK'); this.cause = cause; }
}

module.exports = { ApiError, RateLimited, PlayerNotFound, InvalidIgn, NetworkError };
