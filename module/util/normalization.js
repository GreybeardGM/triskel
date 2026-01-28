export function toFiniteNumber(value, fallback = 0) {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const parsedValue = Number(candidate);
      if (Number.isFinite(parsedValue)) return parsedValue;
    }
  } else {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) return parsedValue;
  }

  const parsedFallback = Number(fallback);
  return Number.isFinite(parsedFallback) ? parsedFallback : 0;
}

export function toArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((_, index) => index in value);
}

export function createArrayKey(value) {
  return JSON.stringify(toArray(value));
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

export function normalizeKeyword(keyword, fallback = "untyped") {
  const normalized = (keyword ?? "").toString().trim().toLowerCase();
  return normalized || fallback;
}
