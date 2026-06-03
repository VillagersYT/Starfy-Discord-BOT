'use strict';

// Formule Plancke (hypixel-php ExpCalculator).
const EASY_LEVELS_XP = [500, 1000, 2000, 3500]; // coût des 4 premiers niveaux d'un cycle
const XP_PER_PRESTIGE = 487000;
const XP_PER_LEVEL = 5000;
const LEVELS_PER_PRESTIGE = 100;

function getBedwarsLevel(exp) {
  if (!Number.isFinite(exp) || exp < 0) return 0;
  const prestiges = Math.floor(exp / XP_PER_PRESTIGE);
  let level = prestiges * LEVELS_PER_PRESTIGE;
  let remainder = exp - prestiges * XP_PER_PRESTIGE;
  for (let i = 0; i < EASY_LEVELS_XP.length; i++) {
    if (remainder < EASY_LEVELS_XP[i]) return level;
    remainder -= EASY_LEVELS_XP[i];
    level += 1;
  }
  level += Math.floor(remainder / XP_PER_LEVEL);
  return level;
}

module.exports = { getBedwarsLevel };
