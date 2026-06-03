'use strict';
const { Events, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { commands } = require('../commandRegistry.js');
const { isConfigComponent, handleConfigComponent } = require('../configPanel.js');
const { errorEmbed } = require('../embeds.js');
const { t, resolveLocale } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');
const logger = require('../../logger.js');

// Acquitte une interaction non reconnue (commande/bouton/menu absent du code).
// Inatteignable en fonctionnement normal, mais une désync registre<->Discord
// laisserait sinon l'utilisateur sur « L'interaction a échoué ».
async function replyUnrecognized(interaction) {
  const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
  const locale = resolveLocale(interaction, cfg);
  try {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'error.generic'))], flags: MessageFlags.Ephemeral });
    }
  } catch (e) { logger.warn('failed to ack unrecognized interaction', e); }
}

async function handleCommand(interaction) {
  const cmd = commands.get(interaction.commandName);
  if (!cmd) return replyUnrecognized(interaction);
  try {
    await cmd.execute(interaction);
  } catch (err) {
    logger.error(`command ${interaction.commandName} failed`, err);
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    const payload = { embeds: [errorEmbed('✗', t(locale, 'error.generic'))], flags: MessageFlags.Ephemeral };
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
      else await interaction.reply(payload);
    } catch (e) { logger.warn('failed to send error reply', e); }
  }
}

// Composants du panneau /config (boutons + menus). Re-vérifie la permission.
async function handleConfigInteraction(interaction) {
  const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
  const locale = resolveLocale(interaction, cfg);
  if (!interaction.guildId || !interaction.memberPermissions || !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'error.manage_guild'))], flags: MessageFlags.Ephemeral });
  }
  try {
    await handleConfigComponent(interaction);
  } catch (e) {
    logger.error('config component failed', e);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'error.generic'))], flags: MessageFlags.Ephemeral });
      }
    } catch (e2) { logger.warn('config error reply failed', e2); }
  }
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) return handleCommand(interaction);
    if (interaction.isButton()) {
      if (isConfigComponent(interaction.customId)) return handleConfigInteraction(interaction);
      return replyUnrecognized(interaction);
    }
    if (interaction.isChannelSelectMenu() || interaction.isStringSelectMenu()) {
      if (isConfigComponent(interaction.customId)) return handleConfigInteraction(interaction);
      return replyUnrecognized(interaction);
    }
  },
};
