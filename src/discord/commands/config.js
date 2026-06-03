'use strict';
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const guildsRepo = require('../../db/guilds.repo.js');
const { buildConfigPanel } = require('../configPanel.js');
const { resolveLocale, localizeDescription } = require('../../i18n/index.js');

module.exports = {
  // /config n'a aucune option : tout se configure via le panneau interactif.
  data: localizeDescription(new SlashCommandBuilder().setName('config'), 'cmd.config.desc')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  async execute(interaction) {
    const cfg = guildsRepo.getConfig(interaction.guildId);
    const locale = resolveLocale(interaction, cfg);
    return interaction.reply({ ...buildConfigPanel(locale, cfg), flags: MessageFlags.Ephemeral });
  },
};
