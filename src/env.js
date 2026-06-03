'use strict';
require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Variable d'environnement manquante : ${name}. Copiez .env.example vers .env et remplissez-la.`);
  }
  return v.trim();
}

const ADMIN_IDS = (process.env.BOT_ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = {
  DISCORD_TOKEN: required('DISCORD_TOKEN'),
  DISCORD_CLIENT_ID: required('DISCORD_CLIENT_ID'),
  HYPIXEL_API_KEY: required('HYPIXEL_API_KEY'),
  ADMIN_IDS,
  DEV_GUILD_ID: (process.env.DEV_GUILD_ID || '').trim() || null,
  DATABASE_PATH: (process.env.DATABASE_PATH || './data/starfy.db').trim(),
};
