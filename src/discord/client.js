'use strict';
const { Client, GatewayIntentBits } = require('discord.js');

function createClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent, // privilégié
      GatewayIntentBits.GuildMembers,   // privilégié
    ],
  });
}

module.exports = { createClient };
