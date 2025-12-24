import { normalizeKeyword, toFiniteNumber } from "../util/normalization.js";

export const getTriskellIndex = () => CONFIG.triskell?.index ?? {};
export const getTriskellCodex = () => CONFIG.triskell?.codex ?? {};

export async function onEditImage(event, target) {
  const field = target.dataset.field || "img";
  const current = foundry.utils.getProperty(this.document, field);

  const picker = new FilePicker({
    type: "image",
    current,
    callback: (path) => this.document.update({ [field]: path })
  });

  picker.render(true);
}

const deriveMaxSegments = (values, fallback = 5) =>
  values.length ? Math.max(...values) : fallback;

const createSegments = (maxSegments, stateResolver) =>
  Array.from({ length: maxSegments }, (_, index) => {
    const value = index + 1;
    const state = stateResolver(value);
    const interactive = state === "filled" || state === "empty";

    return {
      index: value,
      value,
      state,
      interactive
    };
  });

export async function onUpdateResourceValue(event, target) {
  event.preventDefault();

  const resource = target.dataset.resource;
  const clickedValue = toFiniteNumber(target.dataset.resourceValue, Number.NaN);
  if (!resource || !Number.isFinite(clickedValue)) return;

  const resourceField = target.dataset.resourceField ?? "value";
  const property = `system.${resource}.${resourceField}`;
  const currentValue = toFiniteNumber(foundry.utils.getProperty(this.document, property));

  let newValue = clickedValue;
  if (currentValue === clickedValue) newValue = clickedValue - 1;

  await this.document.update({ [property]: newValue });
}

/**
 * Items für Actor-Sheets vorbereiten und nach Kategorien bündeln.
 *
 * @param {Actor|null} actor
 * @returns {object} assets nach Item-Kategorien
 */
export function prepareActorItemsContext(actor = null) {
  const itemCategories = getTriskellIndex().itemCategories ?? {};
  const assets = Object.entries(itemCategories).reduce((collection, [id, category]) => {
    collection[id] = {
      id,
      label: category.label ?? id,
      labelPlural: category.labelPlural ?? category.label ?? id,
      collection: []
    };
    return collection;
  }, {});

  if (!actor?.items) return assets;

  for (const item of actor.items) {
    const type = item?.type ?? "";
    if (!type || !assets[type]) continue;

    assets[type].collection.push(item);
  }

  return assets;
}

/**
 * Skills für Actor-Sheets vorbereiten und nach Kategorien gruppieren.
 *
 * @param {Actor|null} actor
 * @returns {{skillCategories: Array}}
 */
export function prepareActorSkillsContext(actor = null) {
  const skills = actor?.system?.skills ?? {};

  return prepareSkillsDisplay(skills);
}

/**
 * Forms aus den FormRefs vorbereiten und nach Keywords bündeln.
 *
 * @param {Actor|null} actor
 * @returns {{keywords: Array<string>, byKeyword: object, [keyword: string]: Array<object>}}
 */
export function prepareActorFormsContext(actor = null) {
  const formRefs = Array.isArray(actor?.system?.actions?.formRefs) ? actor.system.actions.formRefs : [];

  const collator = new Intl.Collator(game.i18n?.lang, { sensitivity: "base" });
  const formsByKeyword = {};
  const keywords = [];
  const ensureKeyword = (keyword) => {
    const keywordKey = normalizeKeyword(keyword);

    if (!formsByKeyword[keywordKey]) {
      formsByKeyword[keywordKey] = [];
      keywords.push(keywordKey);
    }

    return { keywordKey, bucket: formsByKeyword[keywordKey] };
  };

  if (formRefs.length) {
    const formsIndex = getTriskellIndex().forms ?? {};
    formRefs.forEach(ref => {
      if (!ref?.id) return;

      const form = formsIndex[ref.id] ?? { id: ref.id };
      const keyword = ref.keyword ?? form.keyword;
      const { keywordKey, bucket } = ensureKeyword(keyword);

      const mergedForm = {
        ...form,
        id: ref.id,
        keyword: keywordKey,
        source: ref.itemId ?? ref.source ?? null,
        image: ref.image ?? form.image ?? form.img ?? null,
        active: Boolean(ref.active),
        label: form.label ?? ref.label ?? ref.id ?? form.id
      };

      bucket.push(mergedForm);
    });

    keywords.sort((a, b) => collator.compare(a, b));
    keywords.forEach(keyword => {
      const bucket = formsByKeyword[keyword];
      if (bucket.length > 1) {
        bucket.sort((a, b) => collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? ""));
      }
    });
  }

  return { keywords, byKeyword: formsByKeyword };
}

/**
 * Actions für Action Cards vorbereiten (Grundgerüst).
 *
 * @param {Actor|null} actor
 * @returns {object} Actions nach Typen gruppiert.
 */
export function prepareActorActionsContext(actor = null) {
  const codex = getTriskellCodex();
  const index = getTriskellIndex();

  const actionRefs = Array.isArray(actor?.system?.actions?.actionRefs) ? actor.system.actions.actionRefs : [];

  const collator = new Intl.Collator(game.i18n?.lang, { sensitivity: "base" });

  const typesById = {};
  const actionTypes = Array.isArray(codex?.actionTypes)
    ? codex.actionTypes.map(type => {
      const entry = { ...type, collection: [] };
      typesById[type.id] = entry;
      return entry;
    })
    : [];

  const ensureType = (typeId) => {
    const key = typeId || "untyped";
    if (!typesById[key]) {
      const entry = { id: key, label: key, collection: [] };
      typesById[key] = entry;
      actionTypes.push(entry);
    }
    return typesById[key];
  };

  const addActionToType = (action, { source = null, image = null } = {}) => {
    if (!action) return;
    const typeId = action.type ?? "untyped";
    const bucket = ensureType(typeId);
    bucket.collection.push({
      ...action,
      source,
      image: image ?? action.image ?? action.img ?? null
    });
  };

  // Base Actions immer einhängen.
  const baseActions = codex?.baseActions ?? [];
  for (let i = 0; i < baseActions.length; i += 1) {
    const action = baseActions[i];
    addActionToType(action, { image: action?.image ?? action?.img ?? null });
  }

  // Advanced Actions aus den ActionRefs holen.
  if (actionRefs.length) {
    const advancedActionsById = index.advancedActions ?? {};
    for (let i = 0; i < actionRefs.length; i += 1) {
      const ref = actionRefs[i];
      if (!ref?.id) continue;
      const advancedAction = advancedActionsById[ref.id];
      if (!advancedAction) continue;
      addActionToType(advancedAction, { source: ref.itemId ?? null, image: ref.image ?? null });
    }
  }

  if (actionTypes.length > 1) {
    actionTypes.sort((a, b) => {
      const sortA = toFiniteNumber(a.sort);
      const sortB = toFiniteNumber(b.sort);
      if (sortA !== sortB) return sortA - sortB;
      return collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? "");
    });
  }
  for (let i = 0; i < actionTypes.length; i += 1) {
    const type = actionTypes[i];
    if (type.collection.length > 1) {
      type.collection.sort((a, b) => collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? ""));
    }
  }

  return { types: actionTypes };
}

/**
 * Bars (Reserven/Wege/Commit/NPC-Stats) für das Sheet vorbereiten.
 *
 * @param {Actor|null} actor
 * @returns {{reserves?: object, paths?: object, commit?: object, npcStats?: object}}
 */
export function prepareActorBarsContext(actor = null) {
  if (!actor?.system) return {};

  const index = getTriskellIndex();
  const result = {};

  if (actor.type === "character") {
    const reserves = prepareBars(actor.system.reserves, index.reserves);
    const paths = prepareBars(actor.system.paths, index.paths);
    const commitData = actor.system.actions?.commit ?? { id: "commit", min: 0, max: 0, value: 0 };
    const commit = prepareBars({ commit: commitData }, index.actions)?.commit ?? commitData;

    result.reserves = reserves;
    result.paths = paths;
    result.commit = commit;
  } else if (actor.type === "npc") {
    result.npcStats = prepareBars(actor.system.npcStats, index.npcStats);
  }

  return result;
}

export function prepareBars(bars = {}, codexReference = undefined) {
  if (!bars) return {};

  const reference = codexReference ?? getTriskellIndex().reserves ?? {};
  const entries = Object.entries(bars ?? {});
  const collection = {};
  // Track the maximum segment count seen while building bars (default to 1).
  let maxSegments = 1;

  for (const [id, resource] of entries) {
    if (!resource) continue;

    const codexEntry = reference[id] ?? {};
    const max = toFiniteNumber(resource.max, 1);
    maxSegments = Math.max(maxSegments, max);

    const min = toFiniteNumber(resource.min);
    const value = toFiniteNumber(resource.value);

    const _segments = createSegments(max, (index) => {
      if (index <= min) return "strain";
      if (index <= value) return "filled";
      return "empty";
    });

    collection[id] = {
      ...resource,
      id,
      label: codexEntry.label ?? resource.label,
      description: codexEntry.description ?? resource.description,
      min,
      value,
      max,
      _segments
    };
  }

  collection.maxSegments = maxSegments;

  return collection;
}

export function prepareSkillsDisplay(skills = {}) {
  const normalizedSkills = skills ?? {};

  const index = getTriskellIndex();
  const codex = getTriskellCodex();

  const byCategory = (codex.skills ?? []).reduce((collection, skill) => {
    const rawSkill = normalizedSkills[skill.id] ?? {};
    const category = index.skillCategories?.[skill.category] ?? {};

    const value = toFiniteNumber(rawSkill.value);
    const mod = toFiniteNumber(rawSkill.mod);
    const total = toFiniteNumber(rawSkill.total, value + mod);

    const entry = {
      ...skill,
      value,
      label: skill.label ?? skill.id,
      description: skill.description ?? "",
      categoryLabel: category.label ?? skill.category ?? "",
      phase: category.phase,
      phaseLabel: category.phaseLabel ?? category.phase ?? "",
      mod,
      total
    };
    const categoryId = category.id ?? skill.category ?? "";

    const categoryCollection = collection[categoryId] ?? { category, skills: [] };
    categoryCollection.skills.push(entry);
    collection[categoryId] = categoryCollection;

    return collection;
  }, {});

  Object.values(byCategory).forEach(({ skills: skillsInCategory }) =>
    skillsInCategory.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
  );

  const skillCategories = (codex.skillCategories ?? []).map(category => {
    const skillsInCategory = byCategory[category.id]?.skills ?? [];

    return {
      id: category.id.toLowerCase(),
      title: category.label ?? category.id,
      phase: category.phase,
      phaseLabel: category.phaseLabel ?? category.phase ?? "",
      skills: skillsInCategory
    };
  }).filter(category => category.skills.length);

  return { skillCategories };
}
