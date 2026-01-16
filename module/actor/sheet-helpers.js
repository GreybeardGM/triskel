import {
  normalizeIdList,
  normalizeKeyword,
  toArray,
  toFiniteNumber
} from "../util/normalization.js";

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------
export function asHTMLElement(element) {
  if (!element) return null;
  if (element instanceof HTMLElement) return element;
  if (Array.isArray(element) && element[0] instanceof HTMLElement) return element[0];
  if (element[0] instanceof HTMLElement) return element[0];
  return null;
}

export function getItemFromTarget(sheet, target) {
  const itemId = target.closest("[data-item-id]")?.dataset.itemId ?? target.dataset.itemId;
  if (!itemId) return null;

  return sheet.document?.items?.get(itemId) ?? null;
}

// ---------------------------------------------------------------------------
// Config accessors
// ---------------------------------------------------------------------------
export const getTriskellIndex = () => CONFIG.triskell?.index ?? {};
export const getTriskellCodex = () => CONFIG.triskell?.codex ?? {};

// ---------------------------------------------------------------------------
// Shared UI handlers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Asset preparation (gear, items, categories)
// ---------------------------------------------------------------------------
/**
 * Assets für Actor-Sheets vorbereiten und nach Kategorien filtern.
 *
 * @param {object|null} assets vorbereitete Asset-Buckets aus dem Actor
 * @param {Array<string>|string|null} types optionale Filterliste für Item-Kategorien
 * @returns {object|Array<object>|null} Assets oder gefilterte Buckets
 */
export function prepareAssetContext(assets = null, types = null) {
  if (!types) return assets;

  const typeFilter = Array.isArray(types) ? types : [types];
  const itemsToDisplay = typeFilter.reduce((collection, type) => {
    const bucket = assets?.[type] ?? null;
    if (!bucket) return collection;
    collection.push(bucket);
    return collection;
  }, []);

  return itemsToDisplay;
}

/**
 * Gear-Items nach Trageorten (Codex) bündeln.
 *
 * @param {object|null} gearBucket vorbereiteter Gear-Bucket
 * @returns {object|null} Gear-Bucket mit locationBuckets
 */
export function prepareGearLocationBuckets(gearBucket = null) {
  if (!gearBucket || typeof gearBucket !== "object") return gearBucket;

  const carryLocations = toArray(getTriskellCodex().carryLocations);
  if (!carryLocations.length) {
    return { ...gearBucket, locationBuckets: [] };
  }

  const locationBuckets = [];
  const locationBucketsById = {};
  for (const location of carryLocations) {
    if (!location?.id) continue;
    const bucket = { ...location, collection: [], locationLoad: 0 };
    locationBuckets.push(bucket);
    locationBucketsById[location.id] = bucket;
  }

  const fallbackLocationId = locationBucketsById.dropped
    ? "dropped"
    : (locationBuckets[0]?.id ?? null);
  const gearItems = toArray(gearBucket.collection);

  for (const item of gearItems) {
    const requestedLocation = normalizeKeyword(item?.system?.carryLocation ?? "", "");
    const targetLocation = requestedLocation && locationBucketsById[requestedLocation]
      ? requestedLocation
      : fallbackLocationId;
    if (!targetLocation) continue;
    const bucket = locationBucketsById[targetLocation];
    if (!bucket) continue;
    bucket.collection.push(item);
    const rawPackLoad = toFiniteNumber(item?.system?.packLoad, Number.NaN);
    const rawQuantity = toFiniteNumber(item?.system?.quantity, Number.NaN);
    const packLoad = Number.isFinite(rawPackLoad) ? rawPackLoad : 1;
    const quantity = Number.isFinite(rawQuantity) ? rawQuantity : 1;
    bucket.locationLoad += packLoad * quantity;
  }

  return { ...gearBucket, locationBuckets };
}

/**
 * Verfügbare Trageorte für ein Gear-Item bestimmen.
 *
 * @param {object|null} item Gear-Item
 * @returns {Array<object>} Liste mit gültigen Trageorten
 */
export function getGearCarryLocationOptions(item = null) {
  if (item?.type && item.type !== "gear") return [];

  const carryLocations = toArray(getTriskellCodex().carryLocations);
  if (!carryLocations.length) return [];

  const archetypeId = normalizeKeyword(item?.system?.archetype ?? "");
  const archetype = archetypeId ? getTriskellIndex().gearArchetypes?.[archetypeId] ?? null : null;
  const archetypeLocations = normalizeIdList(archetype?.validLocations);
  if (!archetypeLocations.length) return [];
  const currentLocation = normalizeKeyword(item?.system?.carryLocation ?? "");
  const carryLocationsById = getTriskellIndex().carryLocations ?? {};
  const validLocationIds = archetypeLocations
    .map(locationId => normalizeKeyword(locationId))
    .filter(Boolean);

  const options = validLocationIds
    .map(locationId => {
      const location = carryLocationsById[locationId];
      if (!location) return null;
      return {
        ...location,
        id: normalizeKeyword(location?.id ?? locationId),
        isSelected: locationId === currentLocation
      };
    })
    .filter(Boolean);

  if (currentLocation && !options.some(option => option.id === currentLocation)) {
    const location = carryLocationsById[currentLocation];
    if (location) {
      options.push({
        ...location,
        id: normalizeKeyword(location?.id ?? currentLocation),
        isSelected: true
      });
    }
  }

  return options;
}

// ---------------------------------------------------------------------------
// Action/keyword preparation
// ---------------------------------------------------------------------------
/**
 * Forms aus den FormRefs vorbereiten und nach Keywords bündeln.
 */
// (Jetzt in den Actor verschoben.)

/**
 * Actions oder Spells mit Forms oder Attunements zusammenführen.
 *
 * @param {object} [options={}]
 * @param {object|null} [options.actionLikes=null] vorbereitete Actions oder Spells
 * @param {object|null} [options.keywordBuckets=null] vorbereitete Forms oder Attunements
 * @param {Array<string>} [options.selectedKeywords=[]] aktuell gewählte Form-/Attunement-IDs
 * @param {object} [options.skills={}] vorbereitete Actor-Skills aus prepareDerivedData
 * @param {string|null} [options.selectedTypeId=null] gewählte Action-Phase
 * @param {string} [options.keywordProperty="forms"] Zielfeld für angehängte Keywords (forms|attunements)
 * @param {string} [options.selectionCollection="selectedForms"] Auswahl-Feld im Actor-Datenmodell
 * @returns {{collection: Array, hasEntries: boolean, renderNonce: string|null}}
 *  vorbereitete Actions/Spells mit angedockten Forms/Attunements
 */
export function prepareActionLikesWithKeywords({
  actionLikes = null,
  keywordBuckets = null,
  selectedKeywords = [],
  skills = {},
  selectedTypeId = null,
  keywordProperty = "forms",
  selectionCollection = "selectedForms"
} = {}) {
  const bucketsByKeyword = keywordBuckets ?? {};
  const selectedKeywordIds = new Set(Array.isArray(selectedKeywords) ? selectedKeywords : []);
  const reservesIndex = getTriskellIndex().reserves ?? {};
  const actionLikesByType = actionLikes ?? {};

  const resolveReserveLabel = (reserveId) => {
    if (!reserveId) return "";
    const reserve = reservesIndex[reserveId] ?? {};
    return reserve.label ?? reserveId;
  };

  const rawCollection = toArray(actionLikesByType?.[selectedTypeId]);
  const collection = [];
  for (const entry of rawCollection) {
    const keywords = Array.isArray(entry?.availableKeywords)
      ? entry.availableKeywords.map(keyword => normalizeKeyword(keyword))
      : [];
    const attachedKeywords = [];

    keywords.forEach(keyword => {
      const keywordsForBucket = bucketsByKeyword?.[keyword];
      const keywordCollection = Array.isArray(keywordsForBucket) ? keywordsForBucket : [];
      if (!keywordCollection.length) return;

      keywordCollection.forEach(keywordEntry => {
        const preparedKeywordEntry = {
          ...keywordEntry,
          active: selectedKeywordIds.has(keywordEntry.id),
          reserveLabel: resolveReserveLabel(keywordEntry.reserve)
        };
        attachedKeywords.push(preparedKeywordEntry);
      });
    });

    const preparedAction = {
      ...entry,
      reserveLabel: resolveReserveLabel(entry.reserve),
      selectionCollection,
      [keywordProperty]: attachedKeywords
    };

    // Kompatibilität: Forms oder Attunements optional auch im jeweils anderen Feld ablegen.
    if (keywordProperty !== "forms" && !preparedAction.forms) preparedAction.forms = attachedKeywords;
    if (keywordProperty !== "attunements" && !preparedAction.attunements) preparedAction.attunements = attachedKeywords;

    const skillId = entry?.skill ?? null;
    const skillSource = skillId ? skills?.[skillId] ?? null : null;
    preparedAction.skill = skillId;
    preparedAction.skillLabel = skillSource?.label ?? (skillId ? skillId : null);
    preparedAction.skillTotal = skillId ? toFiniteNumber(skillSource?.total, 0) : null;

    collection.push(preparedAction);
  }

  const hasEntries = collection.length > 0;

  const renderNonce = foundry?.utils?.randomID?.() ?? null;

  return {
    collection,
    hasEntries,
    renderNonce
  };
}

// ---------------------------------------------------------------------------
// Sheet tab preparation (items, actions, roll helper, notes, skills)
// ---------------------------------------------------------------------------
function buildGearCarryLocationSelections(itemsToDisplay = []) {
  const selections = {};
  if (!Array.isArray(itemsToDisplay)) return selections;

  const collectItems = (collection) => {
    for (const item of toArray(collection)) {
      if (!item?.id) continue;
      const options = getGearCarryLocationOptions(item);
      if (!options.length) continue;
      const selectedOption = options.find(option => option.isSelected) ?? options[0] ?? null;
      selections[item.id] = {
        options,
        currentIcon: selectedOption?.icon ?? "fa-solid fa-location-dot"
      };
    }
  };

  for (const category of itemsToDisplay) {
    if (!category) continue;
    if (Array.isArray(category.locationBuckets) && category.locationBuckets.length) {
      for (const bucket of category.locationBuckets) {
        collectItems(bucket?.collection);
      }
    } else {
      collectItems(category.collection);
    }
  }

  return selections;
}

export function enrichSelectedAction({
  action = null,
  forms = {},
  attunements = {},
  selectedForms = [],
  skills = {}
} = {}) {
  if (!action || typeof action !== "object" || !action.id) return null;

  const selectedFormIds = new Set(Array.isArray(selectedForms) ? selectedForms : []);
  const availableKeywords = Array.isArray(action.availableKeywords) ? action.availableKeywords : [];
  const reservesIndex = getTriskellIndex().reserves ?? {};
  const selectionKind = action?.selectionKind === "spell" ? "spell" : "action";
  const keywordProperty = selectionKind === "spell" ? "attunements" : "forms";
  const keywordBuckets = selectionKind === "spell" ? attunements : forms;
  const resolveReserveLabel = (reserveId) => {
    if (!reserveId) return "";
    const reserve = reservesIndex[reserveId] ?? {};
    return reserve.label ?? reserveId;
  };

  const attachedForms = [];
  for (const keyword of availableKeywords) {
    const normalizedKeyword = normalizeKeyword(keyword);
    const keywordsForBucket = keywordBuckets?.[normalizedKeyword];
    const keywordCollection = Array.isArray(keywordsForBucket) ? keywordsForBucket : [];
    if (!keywordCollection.length) continue;

    for (const formEntry of keywordCollection) {
      attachedForms.push({
        ...formEntry,
        active: selectedFormIds.has(formEntry.id),
        reserveLabel: resolveReserveLabel(formEntry.reserve)
      });
    }
  }

  const skillId = action?.skill ?? null;
  let skillLabel = null;
  let skillTotal = null;
  if (skillId) {
    const skillSource = skills?.[skillId] ?? null;
    skillLabel = skillSource?.label ?? action?.skillLabel ?? skillId;
    const resolvedTotal = toFiniteNumber(skillSource?.total, Number.NaN);
    skillTotal = Number.isFinite(resolvedTotal)
      ? resolvedTotal
      : toFiniteNumber(action?.skillTotal, 0);
  }

  return {
    ...action,
    [keywordProperty]: attachedForms,
    reserveLabel: resolveReserveLabel(action?.reserve),
    selectionKind,
    skillLabel,
    skillTotal
  };
}

export function getActionBucket(preparedActions, actionType) {
  return Array.isArray(preparedActions?.[actionType])
    ? preparedActions[actionType]
    : [];
}

export function prepareGearTabContext(actor = null, partId = null) {
  if (!["gear", "spells"].includes(partId)) return {};

  const selectedTypesByPart = {
    gear: ["gear"],
    spells: ["spell"]
  };
  const selectedTypes = selectedTypesByPart[partId] ?? [];
  let itemsToDisplay = prepareAssetContext(actor?.assets, selectedTypes);
  if (partId === "gear" && Array.isArray(itemsToDisplay)) {
    itemsToDisplay = itemsToDisplay.map(category => {
      if (category?.id !== "gear") return category;
      return prepareGearLocationBuckets(category);
    });
  }
  const carryLocationSelections = partId === "gear"
    ? buildGearCarryLocationSelections(itemsToDisplay)
    : {};

  return {
    itemsToDisplay,
    carryLocationSelections
  };
}

export function prepareActionsTabContext(actor = null, selectedActionType = "impact") {
  const preparedBundle = actor?.preparedActions ?? {};
  const preparedForms = preparedBundle.forms ?? {};
  const preparedAttunements = preparedBundle.attunements ?? {};
  const preparedActions = preparedBundle.actions ?? {};
  const preparedSpells = preparedBundle.spells ?? {};
  const selectedForms = toArray(actor?.system?.actions?.selectedForms);
  const actions = prepareActionLikesWithKeywords({
    actionLikes: preparedActions,
    keywordBuckets: preparedForms,
    selectedKeywords: selectedForms,
    skills: actor?.system?.skills ?? {},
    selectedTypeId: selectedActionType,
    keywordProperty: "forms"
  });
  const spells = prepareActionLikesWithKeywords({
    actionLikes: preparedSpells,
    keywordBuckets: preparedAttunements,
    selectedKeywords: selectedForms,
    skills: actor?.system?.skills ?? {},
    selectedTypeId: selectedActionType,
    keywordProperty: "attunements"
  });
  const actionTypeOrder = ["position", "setup", "impact", "defense"];
  const actionTypeFilters = actionTypeOrder.map(typeId => {
    const type = getTriskellCodex()?.actionTypes?.find(entry => entry.id === typeId) ?? { id: typeId, label: typeId };
    return {
      ...type,
      isSelected: selectedActionType === typeId
    };
  });

  return {
    actions,
    spells,
    actionTypeFilters
  };
}

export function prepareRollHelperTabContext({ actor = null, system = {}, reserves = {}, commit = null } = {}) {
  const storedSelectedAction = system?.actions?.selectedAction ?? null;
  let enrichedSelectedAction = null;
  if (storedSelectedAction?.id) {
    const selectedForms = toArray(system?.actions?.selectedForms);
    const preparedForms = actor?.preparedActions?.forms ?? {};
    const preparedAttunements = actor?.preparedActions?.attunements ?? {};
    enrichedSelectedAction = enrichSelectedAction({
      action: storedSelectedAction,
      forms: preparedForms,
      attunements: preparedAttunements,
      selectedForms,
      skills: actor?.system?.skills ?? {}
    });
    const rollActive = Boolean(enrichedSelectedAction?.skill);
    enrichedSelectedAction = {
      ...enrichedSelectedAction,
      roll: {
        ...(enrichedSelectedAction?.roll ?? {}),
        active: rollActive
      }
    };
  }
  const { rollHelper, rollHelperSummary } = prepareRollHelperContext({
    selectedAction: enrichedSelectedAction,
    reserves,
    commit
  });
  const rollHelperRollData = rollHelper?.hasSelection && rollHelper?.action?.roll?.active
    ? prepareRollHelperRollData({
      action: rollHelper.action,
      forms: rollHelper.forms,
      commitValue: toFiniteNumber(commit?.value, 0)
    })
    : null;

  return {
    rollHelper,
    rollHelperSummary,
    rollHelperRollData
  };
}

export function prepareSkillsTabContext(actor = null) {
  const { skillCategories } = prepareSkillsDisplay(actor?.system?.skills ?? {});
  const abilitiesToDisplay = prepareAssetContext(actor?.assets, ["ability"]);

  return {
    skillCategories,
    abilitiesToDisplay
  };
}

export async function prepareNotesTabContext(actor = null) {
  const notes = actor?.system?.details?.notes ?? "";
  const notesHTML = await TextEditor?.enrichHTML?.(notes, { async: true }) ?? notes;

  return { notesHTML };
}

// ---------------------------------------------------------------------------
// Roll helper preparation
// ---------------------------------------------------------------------------
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
  const situationalModifier = toFiniteNumber(selectedAction?.situationalModifier, 0);
  const normalizedForms = Array.isArray(selectedAction?.forms)
    ? selectedAction.forms
    : (Array.isArray(selectedAction?.attunements) ? selectedAction.attunements : []);
  const mappedForms = normalizedForms.map(form => {
    const skillBonusValue = toFiniteNumber(form?.modifier?.skill ?? form?.skillBonus, 0);
    const skillBonus = Number.isFinite(skillBonusValue) && skillBonusValue !== 0 ? skillBonusValue : null;

    return {
      ...form,
      skillBonus
    };
  });
  const preparedAction = selectedAction
    ? { ...selectedAction, forms: mappedForms, situationalModifier }
    : {};
  const activeForms = mappedForms.filter(form => form.active);
  const baseCostValue = toFiniteNumber(preparedAction?.cost, Number.NaN);
  const baseCost = Number.isFinite(baseCostValue) && baseCostValue !== 0 ? baseCostValue : null;

  const rollHelper = {
    hasSelection: Boolean(selectedAction),
    action: preparedAction,
    forms: mappedForms,
    cost: baseCost
  };

  const rollHelperSummary = selectedAction
    ? prepareRollHelperSummary({ action: preparedAction, activeForms, reserves, commitValue })
    : null;

  return { rollHelper, rollHelperSummary };
}

export function prepareRollHelperRollData({ action = null, forms = [], commitValue = 0 } = {}) {
  if (!action?.id || action?.roll?.active === false) return null;

  const actionLabel = action.skillLabel ?? action.label ?? action.id ?? "";
  const modifiers = Array.isArray(action.modifiers) ? [...action.modifiers] : [];
  const skillLabel = action.skillLabel ?? "";
  const skillTotal = toFiniteNumber(action.skillTotal, Number.NaN);
  const hasSkillModifier = skillLabel
    ? modifiers.some(modifier => (modifier?.label ?? "") === skillLabel)
    : false;
  if (!hasSkillModifier && Number.isFinite(skillTotal) && skillTotal !== 0) {
    modifiers.push({ label: skillLabel || actionLabel, value: skillTotal });
  }

  const normalizedForms = Array.isArray(forms) ? forms : [];
  normalizedForms
    .filter(form => form.active)
    .forEach(form => {
      const formBonus = toFiniteNumber(form?.modifier?.skill ?? form?.skillBonus, Number.NaN);
      if (!Number.isFinite(formBonus) || formBonus === 0) return;
      modifiers.push({ label: form?.label ?? form?.id ?? "Form", value: formBonus });
    });

  const normalizedCommitValue = action.reserve ? toFiniteNumber(commitValue, 0) : 0;
  if (Number.isFinite(normalizedCommitValue) && normalizedCommitValue !== 0) {
    modifiers.push({ label: "Commit", value: normalizedCommitValue });
  }

  const situationalModifier = toFiniteNumber(action?.situationalModifier, 0);
  if (Number.isFinite(situationalModifier) && situationalModifier !== 0) {
    const situationalLabel = game.i18n?.localize?.("TRISKEL.Actor.RollHelper.SituationalModifier")
      ?? "Situational Modifier";
    modifiers.push({ label: situationalLabel, value: situationalModifier });
  }

  return {
    title: actionLabel,
    modifiers
  };
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

  const reserveCosts = [];
  let canAfford = true;
  for (const [reserveId, total] of Object.entries(reserveTotals)) {
    const reserveSource = normalizedReserves[reserveId] ?? reserveIndex[reserveId] ?? {};
    const available = toFiniteNumber(reserveSource.value, Number.NaN);
    if (Number.isFinite(available) && available < total) {
      canAfford = false;
    }

    reserveCosts.push({
      id: reserveId,
      label: reserveSource.label ?? reserveId,
      total
    });
  }
  const totalSkillBonus = toFiniteNumber(action.skillTotal, 0)
    + activeForms.reduce((sum, form) => sum + toFiniteNumber(form.skillBonus, 0), 0)
    + toFiniteNumber(action.situationalModifier, 0)
    + commitContribution;

  return {
    totalSkillBonus,
    reserveCosts,
    canAfford
  };
}

// ---------------------------------------------------------------------------
// Bars and resource preparation
// ---------------------------------------------------------------------------
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

const isStrainActive = (entry) => {
  if (!entry) return false;
  if (typeof entry === "object") {
    return Boolean(entry?.active ?? entry?.isActive ?? entry?.checked);
  }

  return Boolean(entry);
};

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
    const strainDefinition = Array.isArray(codexEntry.strain) ? codexEntry.strain : [];
    const strainState = (resource.strain && typeof resource.strain === "object") ? resource.strain : {};
    const max = toFiniteNumber(resource.max, 1);
    maxSegments = Math.max(maxSegments, max);

    const min = toFiniteNumber(resource.min);
    const value = toFiniteNumber(resource.value);

    const _segments = createSegments(max, (index) => {
      if (index <= min) return "strain";
      if (index <= value) return "filled";
      return "empty";
    });

    const strainSteps = strainDefinition.length
      ? strainDefinition.map(step => ({
        ...step,
        checked: isStrainActive(strainState[step.id])
      }))
      : Object.entries(strainState).map(([strainId, entry]) => ({
        id: strainId,
        label: strainId,
        checked: isStrainActive(entry)
      }));

    collection[id] = {
      ...resource,
      id,
      label: codexEntry.label ?? resource.label,
      description: codexEntry.description ?? resource.description,
      min,
      value,
      max,
      strainSteps,
      _segments
    };
  }

  Object.entries(collection).forEach(([id, entry]) => {
    if (!entry || typeof entry !== "object") return;
    const entryMax = toFiniteNumber(entry.max, maxSegments);
    entry._spacerFlex = Math.max(0, maxSegments - entryMax);
  });

  return collection;
}

// ---------------------------------------------------------------------------
// Skill display preparation
// ---------------------------------------------------------------------------
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
