'use strict';
const env = require('./env.js');
const logger = require('./logger.js');
const { getDb } = require('./db/database.js');
const { createClient } = require('./discord/client.js');
const { registerEvents } = require('./discord/eventRegistry.js');

// Ne jamais crasher.
process.on('unhandledRejection', (reason) => logger.error('unhandledRejection', reason));
process.on('uncaughtException', (err) => logger.error('uncaughtException', err));

function main() {
  getDb(); // init + migrations
  const client = createClient();
  registerEvents(client);
  client.login(env.DISCORD_TOKEN).catch((e) => logger.error('login failed', e));
}

main();
