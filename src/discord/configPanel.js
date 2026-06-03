'use strict';
const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');
const { infoEmbed } = require('./embeds.js');
const { t, resolveLocale } = require('../i18n/index.js');
const guildsRepo = require('../db/guilds.repo.js');

// custom_ids des composants du panneau (préfixe cfg: pour le routage).
const ID = {
  toggleSync: 'cfg:toggle:sync',
  setLocale: 'cfg:set:locale',
};

function isConfigComponent(customId) {
  return typeof customId === 'string' && customId.startsWith('cfg:');
}

function onOff(locale, v) { return v ? t(locale, 'config.on') : t(locale, 'config.off'); }
function localeLabel(locale, override) {
  if (override === 'fr') return 'Français';
  if (override === 'en') return 'English';
  return t(locale, 'config.locale.auto');
}

// Construit l'embed + les composants reflétant l'état courant de la config.
function buildConfigPanel(locale, cfg) {
  const embed = infoEmbed(t(locale, 'config.panel.title'), t(locale, 'config.panel.desc')).addFields(
    { name: t(locale, 'config.field.nickname_sync'), value: onOff(locale, cfg.nickname_sync_enabled), inline: true },
    { name: t(locale, 'config.field.locale'), value: localeLabel(locale, cfg.locale_override), inline: true },
  );

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(ID.toggleSync).setEmoji('📝').setLabel(t(locale, 'config.btn.sync'))
      .setStyle(cfg.nickname_sync_enabled ? ButtonStyle.Success : ButtonStyle.Secondary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId(ID.setLocale)
      .setPlaceholder(t(locale, 'config.placeholder.locale'))
      .addOptions(
        { label: t(locale, 'config.locale.auto'), value: 'auto' },
        { label: 'English', value: 'en' },
        { label: 'Français', value: 'fr' },
      ),
  );

  return { embeds: [embed], components: [row1, row2] };
}

// Applique l'action du composant cliqué puis re-render le panneau (in place).
async function handleConfigComponent(interaction) {
  const guildId = interaction.guildId;
  const cfg = guildsRepo.getConfig(guildId);
  const id = interaction.customId;
  const patch = {};
  if (id === ID.toggleSync) patch.nickname_sync_enabled = cfg.nickname_sync_enabled ? 0 : 1;
  else if (id === ID.setLocale) patch.locale_override = interaction.values[0] === 'auto' ? null : interaction.values[0];

  const next = guildsRepo.setConfig(guildId, patch);
  const locale = resolveLocale(interaction, next);
  return interaction.update(buildConfigPanel(locale, next));
}

module.exports = { buildConfigPanel, handleConfigComponent, isConfigComponent };
