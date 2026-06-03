'use strict';
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { refreshByUuid } = require('../../services/starService.js');
const { resolveUuid } = require('../../hypixel/mojang.js');
const { syncForDiscordId } = require('../../services/nicknameSync.js');
const linksRepo = require('../../db/links.repo.js');
const { isBotAdmin } = require('../isAdmin.js');
const { successEmbed, errorEmbed, loadingEmbed } = require('../embeds.js');
const { starSymbol } = require('../../util/starSymbol.js');
const { t, resolveLocale, localizeDescription } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');
const { InvalidIgn, RateLimited } = require('../../util/errors.js');

module.exports = {
  admin: true,
  data: localizeDescription(new SlashCommandBuilder().setName('refresh'), 'cmd.refresh.desc')
    .addStringOption((o) => localizeDescription(o.setName('ign'), 'cmd.refresh.opt.ign').setRequired(true)),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    if (!isBotAdmin(interaction.user.id)) return interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'error.admin_only'))], flags: MessageFlags.Ephemeral });
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.editReply({ embeds: [loadingEmbed(t(locale, 'loading.title'), t(locale, 'loading.refresh'))] });
    const ign = interaction.options.getString('ign', true);
    try {
      const { uuid } = await resolveUuid(ign);
      const r = await refreshByUuid(uuid, ign);
      const link = linksRepo.getByUuid(uuid);
      if (link && interaction.guildId) await syncForDiscordId(interaction.client, link.discord_id);
      return interaction.editReply({ embeds: [successEmbed('✓', t(locale, 'refresh.done', { ign: r.username, stars: r.stars, symbol: starSymbol(r.stars) }))] });
    } catch (e) {
      if (e instanceof InvalidIgn) return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'link.notfound', { ign }))] });
      if (e instanceof RateLimited) return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'error.rate_limited'))] });
      throw e;
    }
  },
};
