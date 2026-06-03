'use strict';
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { adminLink } = require('../../services/linkService.js');
const { syncForDiscordId } = require('../../services/nicknameSync.js');
const { isBotAdmin } = require('../isAdmin.js');
const { successEmbed, errorEmbed, loadingEmbed } = require('../embeds.js');
const { t, resolveLocale, localizeDescription } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');
const { InvalidIgn } = require('../../util/errors.js');

module.exports = {
  admin: true,
  data: localizeDescription(new SlashCommandBuilder().setName('force-link'), 'cmd.forcelink.desc')
    .addUserOption((o) => localizeDescription(o.setName('user'), 'cmd.forcelink.opt.user').setRequired(true))
    .addStringOption((o) => localizeDescription(o.setName('ign'), 'cmd.forcelink.opt.ign').setRequired(true)),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    if (!isBotAdmin(interaction.user.id)) return interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'error.admin_only'))], flags: MessageFlags.Ephemeral });
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.editReply({ embeds: [loadingEmbed(t(locale, 'loading.title'), t(locale, 'loading.forcelink'))] });
    const target = interaction.options.getUser('user', true);
    const ign = interaction.options.getString('ign', true);
    try {
      const r = await adminLink({ discordId: target.id, ign });
      if (!r.ok && r.reason === 'taken') return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'link.taken', { ign }))] });
      if (interaction.guildId) await syncForDiscordId(interaction.client, target.id);
      return interaction.editReply({ embeds: [successEmbed('✓', t(locale, 'forcelink.success', { ign: r.ign, mention: `<@${target.id}>` }))] });
    } catch (e) {
      if (e instanceof InvalidIgn) return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'link.notfound', { ign }))] });
      throw e;
    }
  },
};
