'use strict';
const { SlashCommandBuilder } = require('discord.js');
const { getStarsForUsername } = require('../../services/starService.js');
const linksRepo = require('../../db/links.repo.js');
const { starsEmbed, errorEmbed, infoEmbed, loadingEmbed } = require('../embeds.js');
const { t, resolveLocale, localizeDescription } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');
const { InvalidIgn, RateLimited, PlayerNotFound } = require('../../util/errors.js');

module.exports = {
  data: localizeDescription(new SlashCommandBuilder().setName('stars'), 'cmd.stars.desc')
    .addUserOption((o) => localizeDescription(o.setName('user'), 'cmd.stars.opt.user'))
    .addStringOption((o) => localizeDescription(o.setName('ign'), 'cmd.stars.opt.ign')),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    await interaction.deferReply();
    const user = interaction.options.getUser('user');
    let ign = interaction.options.getString('ign');
    if (user) { const link = linksRepo.getByDiscordId(user.id); if (link) ign = link.mc_username; }
    if (!ign) { const link = linksRepo.getByDiscordId(interaction.user.id); if (link) ign = link.mc_username; }
    if (!ign) return interaction.editReply({ embeds: [infoEmbed('•', t(locale, 'stars.none', { ign: '—' }))] });

    await interaction.editReply({ embeds: [loadingEmbed(t(locale, 'loading.title'), t(locale, 'loading.stars'))] });
    try {
      const data = await getStarsForUsername(ign, { allowFetch: true });
      if (!data) return interaction.editReply({ embeds: [infoEmbed('•', t(locale, 'stars.none', { ign }))] });
      const link = linksRepo.getByUsername(data.username || ign);
      const labels = { title: t(locale, 'stars.title', { ign: data.username || ign }), level: t(locale, 'stars.field.level'), linked: t(locale, 'stars.field.linked'), updated: t(locale, 'stars.field.updated') };
      return interaction.editReply({ embeds: [starsEmbed({ ign: data.username || ign, uuid: data.uuid, stars: data.stars, linkedMention: link ? `<@${link.discord_id}>` : null, updatedAt: data.updatedAt }, labels)] });
    } catch (e) {
      if (e instanceof InvalidIgn) return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'link.notfound', { ign }))] });
      if (e instanceof PlayerNotFound) return interaction.editReply({ embeds: [infoEmbed('•', t(locale, 'link.nohypixel', { ign }))] });
      if (e instanceof RateLimited) return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'error.rate_limited'))] });
      throw e;
    }
  },
};
