'use strict';
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { autoLinkMember } = require('../../services/memberAutoLink.js');
const { extractIgnFromNickname } = require('../nickname.js');
const { t, resolveLocale, localizeDescription } = require('../../i18n/index.js');
const { infoEmbed, successEmbed, errorEmbed } = require('../embeds.js');
const guildsRepo = require('../../db/guilds.repo.js');
const logger = require('../../logger.js');

// Concurrence du balayage : remplit en parallèle les files Mojang + Hypixel
// (les rate-limiters plafonnent quand même le débit réel des APIs).
const SCAN_CONCURRENCY = 5;
// Throttle des éditions de l'embed (reste sous la limite d'édition Discord).
const PROGRESS_THROTTLE_MS = 1750;
const BAR_SEGMENTS = 10;

// Pur : membres dont le pseudo donne un IGN valide.
function selectCandidates(members) {
  return members.filter((m) => extractIgnFromNickname(m.nickname) !== null);
}

// Pur : dérive l'avancement (pourcentage, barre, compteurs) d'un état de balayage.
function buildProgress(s) {
  const total = s.total || 0;
  const done = s.done || 0;
  const pct = total ? Math.round((done / total) * 100) : 100;
  const filled = Math.round((pct / 100) * BAR_SEGMENTS);
  return {
    pct,
    bar: '▰'.repeat(filled) + '▱'.repeat(BAR_SEGMENTS - filled),
    success: (s.linked || 0) + (s.already || 0),
    failed: (s.notVerified || 0) + (s.rateLimited || 0) + (s.errors || 0),
    pending: Math.max(0, total - done),
    done,
    total,
  };
}

// Pool de workers borné : traite les membres en parallèle (jusqu'à `concurrency`),
// agrège les résultats et notifie l'avancement après chaque membre traité.
async function runScan(members, { linker = autoLinkMember, onProgress, concurrency = SCAN_CONCURRENCY } = {}) {
  const s = { total: members.length, done: 0, linked: 0, already: 0, notVerified: 0, rateLimited: 0, errors: 0 };
  let idx = 0;
  async function worker() {
    while (idx < members.length) {
      const m = members[idx++];
      const r = await linker(m);
      switch (r && r.action) {
        case 'linked': s.linked++; break;
        case 'already_linked': s.already++; break;
        case 'not_verified': s.notVerified++; break;
        case 'rate_limited': s.rateLimited++; break;
        case 'error': s.errors++; break;
        default: break; // 'skip'
      }
      s.done++;
      if (onProgress) onProgress(s);
    }
  }
  const n = Math.min(concurrency, members.length) || 0;
  await Promise.all(Array.from({ length: n }, worker));
  return s;
}

// Embed reflétant l'avancement (barre + % + Liés / Non liés / En attente).
function progressEmbed(locale, s, { done = false } = {}) {
  const p = buildProgress(s);
  const make = done ? successEmbed : infoEmbed;
  const title = t(locale, done ? 'scanmembers.done.title' : 'scanmembers.progress.title');
  const desc = `${p.bar}  **${p.pct}%** — ${p.done}/${p.total}`;
  return make(title, desc).addFields(
    { name: t(locale, 'scanmembers.field.success'), value: String(p.success), inline: true },
    { name: t(locale, 'scanmembers.field.failed'), value: String(p.failed), inline: true },
    { name: t(locale, 'scanmembers.field.pending'), value: String(p.pending), inline: true },
  );
}

module.exports = {
  selectCandidates,
  runScan,
  buildProgress,
  data: localizeDescription(new SlashCommandBuilder().setName('scan-members'), 'cmd.scanmembers.desc')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const cfg = interaction.guildId ? guildsRepo.getConfig(interaction.guildId) : null;
    const locale = resolveLocale(interaction, cfg);
    if (!interaction.guildId || !cfg) {
      return interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'error.generic'))], flags: MessageFlags.Ephemeral });
    }
    if (!cfg.nickname_sync_enabled) {
      return interaction.reply({ embeds: [errorEmbed('✗', t(locale, 'scanmembers.disabled'))], flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const all = await interaction.guild.members.fetch();
    const candidates = selectCandidates([...all.values()]);

    const initial = { total: candidates.length, done: 0, linked: 0, already: 0, notVerified: 0, rateLimited: 0, errors: 0 };
    await interaction.editReply({ embeds: [progressEmbed(locale, initial)] }).catch(() => {});

    // Mise à jour live throttlée : une seule édition en vol à la fois ; les échecs
    // (token expiré après 15 min) sont ignorés — le balayage continue en fond.
    let lastEdit = Date.now();
    let editing = false;
    const onProgress = (s) => {
      const now = Date.now();
      if (editing || now - lastEdit < PROGRESS_THROTTLE_MS) return;
      editing = true;
      lastEdit = now;
      interaction.editReply({ embeds: [progressEmbed(locale, s)] })
        .catch(() => {})
        .finally(() => { editing = false; });
    };

    // Arrière-plan : on logue le résumé final et on tente une dernière édition
    // (état terminé), ignorée si le token a déjà expiré.
    runScan(candidates, { onProgress })
      .then((s) => {
        logger.info(`scan-members guild=${interaction.guildId} linked=${s.linked} already=${s.already} notVerified=${s.notVerified} rateLimited=${s.rateLimited} errors=${s.errors}`);
        return interaction.editReply({ embeds: [progressEmbed(locale, s, { done: true })] }).catch(() => {});
      })
      .catch((e) => logger.error('scan-members run failed', e));
  },
};
