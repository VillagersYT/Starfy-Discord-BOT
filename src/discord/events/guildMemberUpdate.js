'use strict';
const { Events } = require('discord.js');
const { autoLinkMember } = require('../../services/memberAutoLink.js');

// N'agit que si le pseudo de serveur a changé (un GuildMemberUpdate se déclenche
// aussi pour les rôles, le timeout, etc. — qu'on ignore).
function nicknameChanged(oldMember, newMember) {
  return oldMember.nickname !== newMember.nickname;
}

module.exports = {
  name: Events.GuildMemberUpdate,
  nicknameChanged,
  async execute(oldMember, newMember) {
    if (!nicknameChanged(oldMember, newMember)) return;
    await autoLinkMember(newMember);
  },
};
