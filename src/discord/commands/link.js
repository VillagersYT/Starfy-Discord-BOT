'use strict';
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { runVerifiedLink } = require('../linkFlow.js');
const { resolveLocale, localizeDescription } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');

module.exports = {
  data: localizeDescription(new SlashCommandBuilder().setName('link'), 'cmd.link.desc')
    .addStringOption((o) => localizeDescription(o.setName('ign'), 'cmd.link.opt.ign').setRequired(true)),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const ign = interaction.options.getString('ign', true);
    return runVerifiedLink(interaction, locale, ign);
  },
};
