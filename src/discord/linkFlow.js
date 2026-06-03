'use strict';
const { verifyAndLink } = require('../services/linkService.js');
const { syncForDiscordId } = require('../services/nicknameSync.js');
const { successEmbed, errorEmbed, infoEmbed, loadingEmbed } = require('./embeds.js');
const { nicknameStatusNote } = require('./nicknameNote.js');
const { starSymbol } = require('../util/starSymbol.js');
const { t } = require('../i18n/index.js');
const { InvalidIgn, PlayerNotFound } = require('../util/errors.js');
const logger = require('../logger.js');

// Flux de lien vérifié (socials Hypixel), partagé par la commande /link et le
// bouton « Réclamer ». L'interaction doit déjà être deferred (ephemeral).
// Ne throw jamais : toutes les issues répondent via editReply.
async function runVerifiedLink(interaction, locale, ign) {
  try {
    // Message de chargement affiché pendant le fetch Hypixel, remplacé par le résultat.
    await interaction.editReply({ embeds: [loadingEmbed(t(locale, 'loading.title'), t(locale, 'loading.link'))] });
    const r = await verifyAndLink({ discordUser: interaction.user, ign });
    if (!r.ok && r.reason === 'taken') {
      return interaction.editReply({ embeds: [errorEmbed(t(locale, 'link.fail.title'), t(locale, 'link.taken', { ign }))] });
    }
    if (!r.ok && r.reason === 'mismatch') {
      return interaction.editReply({ embeds: [errorEmbed(t(locale, 'link.fail.title'), t(locale, 'link.fail.desc', { ign: r.ign }))] });
    }
    let results = [];
    if (interaction.guildId) results = await syncForDiscordId(interaction.client, interaction.user.id);
    const note = nicknameStatusNote(results, interaction.guildId, locale);
    return interaction.editReply({ embeds: [successEmbed(
      t(locale, 'link.success.title'),
      t(locale, 'link.success.desc', { ign: r.ign, stars: r.stars, symbol: starSymbol(r.stars), mention: `<@${interaction.user.id}>` }) + note,
    )] });
  } catch (e) {
    if (e instanceof InvalidIgn) {
      return interaction.editReply({ embeds: [errorEmbed(t(locale, 'link.fail.title'), t(locale, 'link.notfound', { ign }))] });
    }
    if (e instanceof PlayerNotFound) {
      return interaction.editReply({ embeds: [infoEmbed('•', t(locale, 'link.nohypixel', { ign }))] });
    }
    logger.error('verified link failed', e);
    return interaction.editReply({ embeds: [errorEmbed('✗', t(locale, 'error.generic'))] });
  }
}

module.exports = { runVerifiedLink };
