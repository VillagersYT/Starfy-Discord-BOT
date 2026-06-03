'use strict';

function ts() { return new Date().toISOString(); }
function safe(args) {
  try { return args.map((a) => (a instanceof Error ? (a.stack || a.message) : a)); }
  catch { return args; }
}

module.exports = {
  info: (...a) => console.log(`[${ts()}] [INFO]`, ...safe(a)),
  warn: (...a) => console.warn(`[${ts()}] [WARN]`, ...safe(a)),
  error: (...a) => console.error(`[${ts()}] [ERROR]`, ...safe(a)),
  debug: (...a) => { if (process.env.DEBUG) console.log(`[${ts()}] [DEBUG]`, ...safe(a)); },
};
