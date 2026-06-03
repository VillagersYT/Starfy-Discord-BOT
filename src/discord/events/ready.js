'use strict';
const { Events } = require('discord.js');
const logger = require('../../logger.js');
const { startScheduler } = require('../../services/scheduler.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Connecté en tant que ${client.user.tag} sur ${client.guilds.cache.size} serveur(s)`);
    startScheduler(client);
  },
};
