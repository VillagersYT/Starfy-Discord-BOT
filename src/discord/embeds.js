'use strict';
const { EmbedBuilder } = require('discord.js');
const { COLORS, BRANDING, PLAYER_HEAD_URL } = require('../config.js');
const { starSymbol, prestigeColor } = require('../util/starSymbol.js');

function base(color) {
  return new EmbedBuilder().setColor(color).setFooter({ text: BRANDING.footer }).setTimestamp();
}
function successEmbed(title, desc) { return base(COLORS.success).setTitle(title).setDescription(desc); }
function errorEmbed(title, desc) { return base(COLORS.error).setTitle(title).setDescription(desc); }
function infoEmbed(title, desc) { return base(COLORS.info).setTitle(title).setDescription(desc); }
// Embed « chargement » affiché pendant une requête, remplacé par le résultat ensuite.
function loadingEmbed(title, desc) { return base(COLORS.info).setTitle(title).setDescription(desc); }

// Carte de stats stars. labels = { title, level, linked, updated } déjà localisés.
function starsEmbed({ ign, uuid, stars, linkedMention, updatedAt }, labels) {
  const symbol = starSymbol(stars);
  const e = base(prestigeColor(stars))
    .setTitle(labels.title)
    .addFields({ name: labels.level, value: `**${stars}**${symbol}`, inline: true });
  if (linkedMention) e.addFields({ name: labels.linked, value: linkedMention, inline: true });
  if (updatedAt) e.addFields({ name: labels.updated, value: `<t:${Math.floor(updatedAt / 1000)}:R>`, inline: true });
  if (uuid) e.setThumbnail(PLAYER_HEAD_URL(uuid));
  return e;
}

module.exports = { successEmbed, errorEmbed, infoEmbed, loadingEmbed, starsEmbed };
