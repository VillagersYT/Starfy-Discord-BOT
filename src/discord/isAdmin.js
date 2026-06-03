'use strict';
const { ADMIN_IDS } = require('../env.js');
function isBotAdmin(userId) { return ADMIN_IDS.includes(String(userId)); }
module.exports = { isBotAdmin };
