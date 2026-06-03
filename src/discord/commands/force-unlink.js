'use strict';
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const linksRepo = require('../../db/links.repo.js');
const { isBotAdmin } = require('../isAdmin.js');
const { successEmbed, errorEmbed } = require('../embeds.js');
const { t, resolveLocale, localizeDescription } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');

module.exports = {
  admin: true,
  data: localizeDescription(new SlashCommandBuilder().setName('force-unlink'), 'cmd.forceunlink.desc')
    .addUserOption((o) => localizeDescription(o.setName('user'), 'cmd.forceunlink.opt.user').setRequired(true)),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    if (!isBotAdmin(interaction.user.id)) return interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'error.admin_only'))], flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser('user', true);
    linksRepo.deleteByDiscordId(target.id);
    return interaction.reply({ embeds: [successEmbed('✓', t(locale, 'forceunlink.success', { mention: `<@${target.id}>` }))], flags: MessageFlags.Ephemeral });
  },
};
