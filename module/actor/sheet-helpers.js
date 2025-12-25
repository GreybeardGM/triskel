import { normalizeKeyword, toFiniteNumber } from "../util/normalization.js";
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

/**
 * Forms aus den FormRefs vorbereiten und nach Keywords bündeln.
 *
 * @param {Actor|null} actor
 * @returns {object} Forms nach Keyword, sortiert nach Label: forms[keyword] = Array<Form>
 */
export function prepareActorFormsContext(actor = null) {
  const formRefs = Array.isArray(actor?.system?.actions?.formRefs) ? actor.system.actions.formRefs : [];

  const collator = getCachedCollator(game.i18n?.lang, { sensitivity: "base" });
  const formsByKeyword = {};

  if (!formRefs.length) return formsByKeyword;

  const formsIndex = getTriskellIndex().forms ?? {};
  formRefs.forEach(ref => {
    if (!ref?.id) return;

    const form = formsIndex[ref.id] ?? { id: ref.id };
    const keyword = ref.keyword ?? form.keyword;
    const keywordKey = normalizeKeyword(keyword);
    if (!formsByKeyword[keywordKey]) {
      formsByKeyword[keywordKey] = [];
    }

    const mergedForm = {
      ...form,
      id: ref.id,
      keyword: keywordKey,
      source: ref.itemId ?? ref.source ?? null,
      image: ref.image ?? form.image ?? form.img ?? null,
      label: form.label ?? ref.label ?? ref.id ?? form.id
    };

    formsByKeyword[keywordKey].push(mergedForm);
  });

  Object.values(formsByKeyword).forEach(bucket =>
    bucket.sort((a, b) => collator.compare(a.label ?? a.id ?? "", b.label ?? b.id ?? ""))
  );

  return formsByKeyword;
}

/**
 * Actions mit vorbereiteten Forms zusammenführen und Selektion kennzeichnen.
 *
 * @param {object} [options={}]
 * @param {object|null} [options.actions=null] vorbereitete Actions (z. B. aus prepareActorActionsContext)
 * @param {object|null} [options.forms=null] vorbereitete Forms (z. B. aus prepareActorFormsContext)
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
  // prepareActorFormsContext liefert ein Keyword-Mapping: forms[keyword] = Array<Form>
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
export function prepareActorActionsContext(actor = null) {
  const codex = getTriskellCodex();
  const index = getTriskellIndex();
  const actorSkills = actor?.system?.skills ?? {};

  const actionRefs = Array.isArray(actor?.system?.actions?.actionRefs) ? actor.system.actions.actionRefs : [];

  const collator = getCachedCollator(game.i18n?.lang, { sensitivity: "base" });

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

  const resolveSkillData = (action = {}) => {
    const skillId = action?.skill ?? "";
    if (!skillId) {
      return {
        skillLabel: action?.skillLabel ?? "",
        skillTotal: toFiniteNumber(action?.skillTotal, 0)
      };
    }

    const actorSkill = actorSkills[skillId] ?? {};
    const indexSkill = index.skills?.[skillId] ?? {};
    const skillLabel = actorSkill.label ?? indexSkill.label ?? skillId;
    const skillTotal = Number.isFinite(actorSkill.total)
      ? actorSkill.total
      : toFiniteNumber(actorSkill.value, 0) + toFiniteNumber(actorSkill.mod, 0);

    return {
      skillLabel,
      skillTotal
    };
  };

  const addActionToType = (action, { source = null, image = null } = {}) => {
    if (!action) return;
    const typeId = action.type ?? "untyped";
    const bucket = ensureType(typeId);
    const skillData = resolveSkillData(action);
    bucket.collection.push({
      ...action,
      source,
      image: image ?? action.image ?? action.img ?? null,
      ...skillData
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
 * Roll Helper Kontext aus ausgewählter Action und Ressourcen vorbereiten.
 *
 * @param {object} [options={}]
 * @param {object|null} [options.selectedAction=null] ausgewählte Action (inkl. Forms)
 * @param {object} [options.reserves={}] vorbereitete Reserves aus prepareActorBarsContext
 * @returns {{rollHelper: object, rollHelperSummary: object|null}}
 */
export function prepareRollHelperContext({ selectedAction = null, reserves = {} } = {}) {
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
    cost: calculateTotalCost(preparedAction, activeForms)
  };

  const rollHelperSummary = selectedAction
    ? prepareRollHelperSummary({ action: preparedAction, activeForms, reserves })
    : null;

  return { rollHelper, rollHelperSummary };
}

function calculateTotalCost(action, activeForms) {
  const baseCost = toFiniteNumber(action?.cost, 0);
  const formsCost = activeForms.reduce((total, form) => total + toFiniteNumber(form.cost, 0), 0);

  return baseCost + formsCost;
}

const addReserveCost = (collection, reserveId, cost) => {
  const normalizedReserve = reserveId ?? "";
  const numericCost = toFiniteNumber(cost, Number.NaN);
  if (!normalizedReserve || !Number.isFinite(numericCost) || numericCost <= 0) return;

  collection[normalizedReserve] = toFiniteNumber(collection[normalizedReserve], 0) + numericCost;
};

function prepareRollHelperSummary({ action = {}, activeForms = [], reserves = {} } = {}) {
  const reserveTotals = {};

  addReserveCost(reserveTotals, action.reserve, action.cost);
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
    + activeForms.reduce((sum, form) => sum + toFiniteNumber(form.skillBonus, 0), 0);

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
