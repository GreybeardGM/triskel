const LOCALIZABLE_FIELDS = new Set(["label", "labelPlural", "description"]);

const localizeFields = (value, localize) => {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach(entry => localizeFields(entry, localize));
    return;
  }

  Object.entries(value).forEach(([key, entryValue]) => {
    if (LOCALIZABLE_FIELDS.has(key) && typeof entryValue === "string") {
      value[key] = localize(entryValue);
      return;
    }

    if (entryValue && typeof entryValue === "object") {
      localizeFields(entryValue, localize);
    }
  });
};

export const localizeCodexCollections = (codex, index, localize) => {
  if (!codex || !index || !localize) return;

  Object.values(codex).forEach(collection => {
    localizeFields(collection, localize);

    if (Array.isArray(collection)) {
      collection.sort((a, b) => {
        const labelA = a?.label ?? "";
        const labelB = b?.label ?? "";
        return labelA.localeCompare(labelB, game.i18n.lang);
      });
    }
  });

  Object.values(index).forEach(collection => {
    localizeFields(collection, localize);
  });
};
