'use strict';
const fs = require('node:fs');
const path = require('node:path');
const logger = require('../logger.js');

function registerEvents(client) {
  const dir = path.join(__dirname, 'events');
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const evt = require(path.join(dir, file));
    if (!evt || !evt.name || !evt.execute) continue;
    // Tout rejet d'un handler est capturé ici : le process ne crashe jamais.
    const safe = (...a) => Promise.resolve()
      .then(() => evt.execute(...a))
      .catch((e) => logger.error(`event ${evt.name} failed`, e));
    if (evt.once) client.once(evt.name, safe);
    else client.on(evt.name, safe);
  }
}

module.exports = { registerEvents };
