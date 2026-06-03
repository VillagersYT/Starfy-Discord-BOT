'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DEV_GUILD_ID } = require('../env.js');
const logger = require('../logger.js');

const commands = new Map();
const dir = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  const cmd = require(path.join(dir, file));
  if (cmd && cmd.data && cmd.execute) commands.set(cmd.data.name, cmd);
}

async function deployCommands() {
  const body = [...commands.values()].map((c) => c.data.toJSON());
  const rest = new REST().setToken(DISCORD_TOKEN);
  if (DEV_GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DEV_GUILD_ID), { body });
    logger.info(`Deployed ${body.length} commands to dev guild ${DEV_GUILD_ID}`);
  } else {
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body });
    logger.info(`Deployed ${body.length} global commands`);
  }
}

module.exports = { commands, deployCommands };
