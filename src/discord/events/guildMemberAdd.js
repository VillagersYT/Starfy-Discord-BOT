'use strict';
const { Events } = require('discord.js');
const { autoLinkMember } = require('../../services/memberAutoLink.js');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) { await autoLinkMember(member); },
};
