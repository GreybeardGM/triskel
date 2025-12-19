export function toFiniteNumber(value, fallback = 0) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function toFiniteNumbers(collection, extractor = (entry) => entry, fallback = 0) {
  const entries = Array.isArray(collection) ? collection : [];

  return entries
    .map(item => toFiniteNumber(extractor(item), fallback))
    .filter(Number.isFinite);
}

export function normalizeIdList(entries = []) {
  if (!Array.isArray(entries)) return [];

  return entries
    .map(entry => (typeof entry === "string" ? entry : entry?.id ?? ""))
    .filter(Boolean);
}

export function normalizeKeywords(keywords = []) {
  if (typeof keywords === "string") {
    keywords = [keywords];
  } else if (!Array.isArray(keywords)) {
    keywords = [];
  }

  return keywords
    .map(keyword => `${keyword}`.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeKeyword(keyword = null) {
  return normalizeKeywords(keyword)[0] ?? null;
}
