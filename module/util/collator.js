const collatorCache = new Map();

/**
 * Liefert einen gecachten Intl.Collator, um teure Neubauten zu vermeiden.
 *
 * @param {string|null} [locale=game?.i18n?.lang] Locale für den Collator
 * @param {Intl.CollatorOptions} [options={}] Optionen für den Collator
 * @returns {Intl.Collator}
 */
export function getCachedCollator(locale = game?.i18n?.lang, options = {}) {
  const key = `${locale ?? "default"}|${JSON.stringify(options ?? {})}`;

  if (!collatorCache.has(key)) {
    collatorCache.set(key, new Intl.Collator(locale ?? undefined, options ?? undefined));
  }

  return collatorCache.get(key);
}
