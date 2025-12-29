import { normalizeKeyword, toArray, toFiniteNumber } from "../util/normalization.js";
import { getCachedCollator } from "../util/collator.js";

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

function prepareKeywordBuckets({ refs = [], index = {}, keywordField = "keyword" } = {}) {
  const entriesByKeyword = {};
  if (!Array.isArray(refs) || !refs.length) return entriesByKeyword;

  const collator = getCachedCollator(game.i18n?.lang, { sensitivity: "base" });

  refs.forEach(ref => {
    if (!ref?.id) return;

    const base = index[ref.id] ?? { id: ref.id };
    const keyword = ref[keywordField] ?? base[keywordField];
    const keywordKey = normalizeKeyword(keyword);
    if (!entriesByKeyword[keywordKey]) entriesByKeyword[keywordKey] = [];

    const merged = {
      ...base,
      id: ref.id,
      keyword: keywordKey,
      source: ref.itemId ?? ref.source ?? null,
      image: ref.image ?? base.image ?? base.img ?? null,
      label: base.label ?? ref.label ?? ref.id ?? base.id
    };

    entriesByKeyword[keywordKey].push(merged);
  });

  Object.values(entriesByKeyword).forEach(bucket =>
    bucket.sort((a, b) => collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? ""))
  );

  return entriesByKeyword;
}

/**
 * Forms aus den FormRefs vorbereiten und nach Keywords bündeln.
 *
 * @param {Actor|null} actor
 * @returns {object} Forms nach Keyword, sortiert nach Label: forms[keyword] = Array<Form>
 */
export function prepareActorForms(actor = null) {
  const formRefs = toArray(actor?.preparedRefs?.forms);
  const formsIndex = getTriskellIndex().forms ?? {};

  return prepareKeywordBuckets({ refs: formRefs, index: formsIndex, keywordField: "keyword" });
}

/**
 * Actions mit vorbereiteten Forms zusammenführen und Selektion kennzeichnen.
 *
 * @param {object} [options={}]
 * @param {object|null} [options.actions=null] vorbereitete Actions (z. B. aus prepareActorActions)
 * @param {object|null} [options.forms=null] vorbereitete Forms (z. B. aus prepareActorForms)
 * @param {string|null} [options.selectedActionId=null] aktuell gewählte Action-ID
 * @param {Array<string>} [options.selectedForms=[]] aktuell gewählte Form-IDs
 * @returns {{types: Array, selectedAction?: object}} vorbereitete Actions mit angedockten Forms
 */
export function prepareActorActionsWithForms({
  actions = null,
  forms = null,
  selectedActionId = null,
  selectedForms = []
} = {}) {
  // prepareActorForms liefert ein Keyword-Mapping: forms[keyword] = Array<Form>
  const formsByKeyword = (forms && typeof forms === "object" && !Array.isArray(forms)) ? forms : {};
  const selectedFormIds = new Set(Array.isArray(selectedForms) ? selectedForms : []);
  const result = {
    types: []
  };

  let resolvedSelectedAction = null;

  const sourceTypes = Array.isArray(actions?.types) ? actions.types : [];
  result.types = sourceTypes.map(type => {
    const preparedType = { ...type, collection: [] };
    const collection = Array.isArray(type?.collection) ? type.collection : [];

    preparedType.collection = collection.map(action => {
      const isActive = action?.id === selectedActionId;
      const keywords = Array.isArray(action?.keywords) ? action.keywords : [];
      const attachedForms = [];

      keywords.forEach(keyword => {
        const normalized = normalizeKeyword(keyword);
        const formsForKeyword = formsByKeyword?.[normalized];
        const keywordForms = Array.isArray(formsForKeyword) ? formsForKeyword : [];
        if (!keywordForms.length) return;

        keywordForms.forEach(form => {
          const preparedForm = {
            ...form,
            active: selectedFormIds.has(form.id)
          };
          attachedForms.push(preparedForm);
        });
      });

      const preparedAction = {
        ...action,
        active: isActive,
        forms: attachedForms
      };

      if (isActive) resolvedSelectedAction = preparedAction;

      return preparedAction;
    });

    return preparedType;
  });

  if (resolvedSelectedAction) {
    result.selectedAction = resolvedSelectedAction;
  }

  return result;
}

/**
 * Actions für Action Cards vorbereiten (Grundgerüst).
 *
 * @param {Actor|null} actor
 * @returns {object} Actions nach Typen gruppiert.
 */
function prepareActionLike({ refs = [], indexEntries = {}, baseEntries = [] } = {}) {
  const collator = getCachedCollator(game.i18n?.lang, { sensitivity: "base" });

  const typesById = {};
  const baseActionTypes = getTriskellCodex()?.actionTypes ?? [];
  const preparedTypes = baseActionTypes.map(type => {
    const entry = { ...type, collection: [] };
    typesById[type.id] = entry;
    return entry;
  });

  const ensureType = (typeId) => {
    const key = typeId || "untyped";
    if (!typesById[key]) {
      const entry = { id: key, label: key, collection: [] };
      typesById[key] = entry;
      preparedTypes.push(entry);
    }
    return typesById[key];
  };

  const addEntryToType = (entry, { source = null, image = null } = {}) => {
    if (!entry) return;
    const typeId = entry.type ?? "untyped";
    const bucket = ensureType(typeId);
    bucket.collection.push({
      ...entry,
      source,
      image: image ?? entry.image ?? entry.img ?? null
    });
  };

  baseEntries.forEach(base => addEntryToType(base, { image: base?.image ?? base?.img ?? null }));

  refs.forEach(ref => {
    if (!ref?.id) return;
    const entry = indexEntries[ref.id];
    if (!entry) return;
    addEntryToType(entry, { source: ref.itemId ?? null, image: ref.image ?? null });
  });

  if (preparedTypes.length > 1) {
    preparedTypes.sort((a, b) => {
      const sortA = toFiniteNumber(a.sort);
      const sortB = toFiniteNumber(b.sort);
      if (sortA !== sortB) return sortA - sortB;
      return collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? "");
    });
  }
  preparedTypes.forEach(type => {
    if (type.collection.length > 1) {
      type.collection.sort((a, b) => collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? ""));
    }
  });

  return { types: preparedTypes };
}

export function prepareActorActions(actor = null) {
  const codex = getTriskellCodex();
  const index = getTriskellIndex();
  const actionRefs = toArray(actor?.preparedRefs?.actions);

  if (!actionRefs.length && !(codex?.baseActions?.length)) return { types: [] };

  return prepareActionLike({
    refs: actionRefs,
    indexEntries: index.advancedActions ?? {},
    baseEntries: codex?.baseActions ?? []
  });
}

/**
 * Spells aus den SpellRefs vorbereiten.
 *
 * @param {Actor|null} actor
 * @returns {object} Spells nach Typen gruppiert.
 */
export function prepareActorSpells(actor = null) {
  const spellRefs = toArray(actor?.preparedRefs?.spells);
  const index = getTriskellIndex();

  if (!spellRefs.length) return { types: [] };

  return prepareActionLike({
    refs: spellRefs,
    indexEntries: index.spells ?? {},
    baseEntries: []
  });
}

/**
 * Attunements aus den AttunementRefs vorbereiten.
 *
 * @param {Actor|null} actor
 * @returns {object} Attunements nach Keyword gruppiert
 */
export function prepareActorAttunements(actor = null) {
  const attunementRefs = toArray(actor?.preparedRefs?.attunements);
  const attunementsIndex = getTriskellIndex().attunements ?? {};

  return prepareKeywordBuckets({ refs: attunementRefs, index: attunementsIndex, keywordField: "keyword" });
}

/**
 * Spells aus den SpellRefs vorbereiten.
 *
 * @param {Actor|null} actor
 * @returns {Array} vorbereitete Spells
 */
export function prepareActorSpells(actor = null) {
  const spellRefs = toArray(actor?.system?.actions?.refs?.spells);
  const spellsIndex = getTriskellIndex().spells ?? {};
  const collator = getCachedCollator(game.i18n?.lang, { sensitivity: "base" });

  if (!spellRefs.length) return [];

  const spells = spellRefs
    .map(ref => {
      if (!ref?.id) return null;

      const spell = spellsIndex[ref.id] ?? { id: ref.id };

      return {
        ...spell,
        id: ref.id,
        source: ref.itemId ?? ref.source ?? null,
        image: ref.image ?? spell.image ?? spell.img ?? null,
        label: spell.label ?? ref.label ?? ref.id ?? spell.id
      };
    })
    .filter(Boolean);

  spells.sort((a, b) => collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? ""));

  return spells;
}

/**
 * Attunements aus den AttunementRefs vorbereiten.
 *
 * @param {Actor|null} actor
 * @returns {Array} vorbereitete Attunements
 */
export function prepareActorAttunements(actor = null) {
  const attunementRefs = toArray(actor?.system?.actions?.refs?.attunements);
  const attunementsIndex = getTriskellIndex().attunements ?? {};
  const collator = getCachedCollator(game.i18n?.lang, { sensitivity: "base" });

  if (!attunementRefs.length) return [];

  const attunements = attunementRefs
    .map(ref => {
      if (!ref?.id) return null;

      const attunement = attunementsIndex[ref.id] ?? { id: ref.id };

      return {
        ...attunement,
        id: ref.id,
        source: ref.itemId ?? ref.source ?? null,
        image: ref.image ?? attunement.image ?? attunement.img ?? null,
        label: attunement.label ?? ref.label ?? ref.id ?? attunement.id
      };
    })
    .filter(Boolean);

  attunements.sort((a, b) => collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? ""));

  return attunements;
}

/**
 * Roll Helper Kontext aus ausgewählter Action und Ressourcen vorbereiten.
 *
 * @param {object} [options={}]
 * @param {object|null} [options.selectedAction=null] ausgewählte Action (inkl. Forms)
 * @param {object} [options.reserves={}] vorbereitete Reserves aus prepareActorBarsContext
 * @returns {{rollHelper: object, rollHelperSummary: object|null}}
 */
export function prepareRollHelperContext({ selectedAction = null, reserves = {}, commit = null } = {}) {
  const commitValue = toFiniteNumber(commit?.value, 0);
  const normalizedForms = Array.isArray(selectedAction?.forms) ? selectedAction.forms : [];
  const mappedForms = normalizedForms.map(form => {
    const skillBonus = toFiniteNumber(form.skillBonus ?? form.modifier?.skill, Number.NaN);
    const skillLabel = form.skillLabel ?? selectedAction?.skillLabel ?? "";

    return {
      ...form,
      skillLabel,
      skillBonus: Number.isFinite(skillBonus) ? skillBonus : 0
    };
  });
  const preparedAction = selectedAction ? { ...selectedAction, forms: mappedForms } : {};
  const activeForms = mappedForms.filter(form => form.active);

  const rollHelper = {
    hasSelection: Boolean(selectedAction),
    action: preparedAction,
    forms: mappedForms,
    cost: calculateTotalCost(preparedAction, activeForms, commitValue)
  };

  const rollHelperSummary = selectedAction
    ? prepareRollHelperSummary({ action: preparedAction, activeForms, reserves, commitValue })
    : null;

  return { rollHelper, rollHelperSummary };
}

function calculateTotalCost(action, activeForms, commitValue = 0) {
  const baseCost = toFiniteNumber(action?.cost, 0);
  const formsCost = activeForms.reduce((total, form) => total + toFiniteNumber(form.cost, 0), 0);
  const commitCost = action?.reserve ? toFiniteNumber(commitValue, 0) : 0;

  return baseCost + formsCost + commitCost;
}

const addReserveCost = (collection, reserveId, cost) => {
  const normalizedReserve = reserveId ?? "";
  const numericCost = toFiniteNumber(cost, Number.NaN);
  if (!normalizedReserve || !Number.isFinite(numericCost) || numericCost <= 0) return;

  collection[normalizedReserve] = toFiniteNumber(collection[normalizedReserve], 0) + numericCost;
};

function prepareRollHelperSummary({ action = {}, activeForms = [], reserves = {}, commitValue = 0 } = {}) {
  const reserveTotals = {};
  const commitContribution = action?.reserve ? toFiniteNumber(commitValue, 0) : 0;

  addReserveCost(reserveTotals, action.reserve, (action.cost ?? 0) + commitContribution);
  activeForms.forEach(form => addReserveCost(reserveTotals, form.reserve, form.cost));

  const reserveIndex = getTriskellIndex().reserves ?? {};
  const normalizedReserves = reserves && typeof reserves === "object" ? reserves : {};

  const reserveCosts = Object.entries(reserveTotals).map(([reserveId, total]) => {
    const reserveSource = normalizedReserves[reserveId] ?? reserveIndex[reserveId] ?? {};
    const available = toFiniteNumber(reserveSource.value, Number.NaN);

    return {
      id: reserveId,
      label: reserveSource.label ?? reserveId,
      total,
      available
    };
  });

  const canAfford = reserveCosts.every(entry => !Number.isFinite(entry.available) || entry.available >= entry.total);
  const totalSkillBonus = toFiniteNumber(action.skillTotal, 0)
    + activeForms.reduce((sum, form) => sum + toFiniteNumber(form.skillBonus, 0), 0)
    + commitContribution;

  return {
    totalSkillBonus,
    reserveCosts: reserveCosts.map(({ available, ...rest }) => rest),
    canAfford
  };
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
  const preparedSkills = Object.values(skills ?? {});

  const codex = getTriskellCodex();

  const byCategory = preparedSkills.reduce((collection, skill) => {
    if (!skill?.id) return collection;

    const categoryId = skill.category ?? "";
    const bucket = collection[categoryId] ?? [];
    bucket.push(skill);
    collection[categoryId] = bucket;

    return collection;
  }, {});

  const skillCategories = (codex.skillCategories ?? []).map(category => {
    const skillsInCategory = byCategory[category.id] ?? [];

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
