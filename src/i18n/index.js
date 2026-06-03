'use strict';
const en = require('./en.json');
const fr = require('./fr.json');
const BUNDLES = { en, fr };

function t(locale, key, vars = {}) {
  const lang = locale === 'fr' ? 'fr' : 'en';
  const bundle = BUNDLES[lang] || en;
  let str = bundle[key] != null ? bundle[key] : (en[key] != null ? en[key] : key);
  for (const [k, v] of Object.entries(vars)) {
    str = str.split(`{${k}}`).join(String(v));
  }
  return str;
}

// Discord locale -> 'fr' | 'en'
function resolveLocale(interaction, guildCfg) {
  if (guildCfg && guildCfg.locale_override) return guildCfg.locale_override === 'fr' ? 'fr' : 'en';
  const loc = interaction && interaction.locale;
  return loc && String(loc).startsWith('fr') ? 'fr' : 'en';
}

// Applique une description localisée à un builder de commande OU d'option :
// l'anglais sert de description par défaut, le français est ajouté en
// localisation (Discord l'affiche selon la langue du client). Les NOMS de
// commandes/options ne sont jamais traduits. Renvoie la cible pour chaînage.
function localizeDescription(target, key) {
  target.setDescription(t('en', key));
  target.setDescriptionLocalizations({ fr: t('fr', key) });
  return target;
}

module.exports = { t, resolveLocale, localizeDescription };
