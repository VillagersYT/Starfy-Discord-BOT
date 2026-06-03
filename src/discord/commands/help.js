'use strict';
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { infoEmbed } = require('../embeds.js');
const { t, resolveLocale, localizeDescription } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');

module.exports = {
  data: localizeDescription(new SlashCommandBuilder().setName('help'), 'cmd.help.desc'),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    return interaction.reply({ embeds: [infoEmbed(t(locale, 'help.title'), t(locale, 'help.desc'))], flags: MessageFlags.Ephemeral });
  },
};
