'use strict';
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { refreshByUuid } = require('../../services/starService.js');
const { syncForDiscordId } = require('../../services/nicknameSync.js');
const linksRepo = require('../../db/links.repo.js');
const { successEmbed, errorEmbed, loadingEmbed } = require('../embeds.js');
const { nicknameStatusNote } = require('../nicknameNote.js');
const { starSymbol } = require('../../util/starSymbol.js');
const { t, resolveLocale, localizeDescription } = require('../../i18n/index.js');
const guildsRepo = require('../../db/guilds.repo.js');
const { UserRateLimit } = require('../../util/userRateLimit.js');
const { UPDATE_RATE } = require('../../config.js');
const { InvalidIgn, RateLimited, PlayerNotFound } = require('../../util/errors.js');

// Quota par utilisateur : 10 appels / heure. En mémoire (process unique).
const quota = new UserRateLimit({ max: UPDATE_RATE.max, windowMs: UPDATE_RATE.windowMs });

module.exports = {
  data: localizeDescription(new SlashCommandBuilder().setName('update'), 'cmd.update.desc'),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);

    const link = linksRepo.getByDiscordId(interaction.user.id);
    if (!link) {
      return interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'update.notlinked'))], flags: MessageFlags.Ephemeral });
    }
    // Quota consommé avant le fetch pour protéger l'API même en cas d'échec.
    if (!quota.tryConsume(interaction.user.id)) {
      return interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'update.limit'))], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await interaction.editReply({ embeds: [loadingEmbed(t(locale, 'loading.title'), t(locale, 'loading.update'))] });
    try {
      const r = await refreshByUuid(link.mc_uuid, link.mc_username);
      let results = [];
      if (interaction.guildId) results = await syncForDiscordId(interaction.client, interaction.user.id);
      const note = nicknameStatusNote(results, interaction.guildId, locale);
      return interaction.editReply({ embeds: [successEmbed(
        t(locale, 'update.title'),
        t(locale, 'update.done', { ign: r.username, stars: r.stars, symbol: starSymbol(r.stars) }) + note,
      )] });
    } catch (e) {
      if (e instanceof RateLimited) return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'error.rate_limited'))] });
      if (e instanceof InvalidIgn || e instanceof PlayerNotFound) {
        return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'link.notfound', { ign: link.mc_username }))] });
      }
      throw e; // remonté au handler global -> error.generic
    }
  },
};
