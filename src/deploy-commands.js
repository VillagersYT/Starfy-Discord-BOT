'use strict';
const { deployCommands } = require('./discord/commandRegistry.js');

// On ne force PAS process.exit() : sur Node 23/Windows cela déclenche une
// assertion libuv (UV_HANDLE_CLOSING) en fermant les sockets HTTP undici.
// On fixe le code de sortie et on laisse la boucle d'événements se vider
// d'elle-même une fois le déploiement terminé.
deployCommands()
  .then(() => { process.exitCode = 0; })
  .catch((e) => { console.error(e); process.exitCode = 1; });
