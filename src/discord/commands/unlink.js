'use strict';
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const linksRepo = require('../../db/links.repo.js');
const { successEmbed, infoEmbed } = require('../embeds.js');
const { t, resolveLocale, localizeDescription } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');

module.exports = {
  data: localizeDescription(new SlashCommandBuilder().setName('unlink'), 'cmd.unlink.desc'),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    const changes = linksRepo.deleteByDiscordId(interaction.user.id);
    const embed = changes > 0 ? successEmbed('✓', t(locale, 'unlink.success')) : infoEmbed('•', t(locale, 'unlink.none'));
    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
