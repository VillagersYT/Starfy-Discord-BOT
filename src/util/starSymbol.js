'use strict';
const { SYMBOL_TIERS, PRESTIGE_COLORS } = require('../config.js');

function starSymbol(stars) {
  const s = Number.isFinite(stars) ? stars : 0;
  for (const tier of SYMBOL_TIERS) {
    if (s >= tier.min) return tier.glyph;
  }
  return SYMBOL_TIERS[SYMBOL_TIERS.length - 1].glyph;
}

function prestigeColor(stars) {
  const s = Number.isFinite(stars) ? stars : 0;
  for (const tier of PRESTIGE_COLORS) {
    if (s >= tier.min) return tier.color;
  }
  return 0xaaaaaa;
}

module.exports = { starSymbol, prestigeColor };
