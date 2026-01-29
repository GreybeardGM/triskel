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
  if (element[0] instanceof HTMLElement) return element[0];
  return null;
}

export function getItemFromTarget(sheet, target) {
  const itemId = target.closest("[data-item-id]")?.dataset.itemId ?? target.dataset.itemId;
  if (!itemId) return null;

  return sheet.document?.items?.get(itemId);
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
    const bucket = assets?.[type];
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
export function prepareGearLocationBuckets(gearBucket = null, { powerMax = null } = {}) {
  if (!gearBucket || typeof gearBucket !== "object") return gearBucket;

  const carryLocationDefinitions = toArray(getTriskellCodex().carryLocations);
  if (!carryLocationDefinitions.length) {
    return { ...gearBucket, locationBuckets: [] };
  }

  // Resolve load limits, including dynamic limits based on power.
  const resolveLoadLimit = (location) => {
    let loadLimit = location.loadLimit ?? null;
    if (loadLimit === "power") {
      const resolvedPowerMax = toFiniteNumber(powerMax, Number.NaN);
      loadLimit = Number.isFinite(resolvedPowerMax) ? resolvedPowerMax : null;
    }
    if (typeof loadLimit === "number" && !Number.isFinite(loadLimit)) {
      loadLimit = null;
    }
    return loadLimit;
  };

  const locationBuckets = [];
  const locationBucketsById = {};
  for (const location of carryLocationDefinitions) {
    if (!location?.id) continue;
    const usesLocationLoad = ["packLoad", "hands"].includes(location.loadType);
    const bucket = {
      ...location,
      collection: [],
      locationLoad: usesLocationLoad ? 0 : null,
      loadLimit: resolveLoadLimit(location),
      overburdened: false
    };
    locationBuckets.push(bucket);
    locationBucketsById[location.id] = bucket;
  }

  const fallbackLocationId = locationBucketsById.dropped
    ? "dropped"
    : (locationBuckets[0]?.id ?? null);
  const gearItems = toArray(gearBucket.collection);

  for (const item of gearItems) {
    const requestedLocationId = normalizeKeyword(item?.system?.carryLocation ?? "", "");
    const bucket = locationBucketsById[requestedLocationId] ?? locationBucketsById[fallbackLocationId];
    if (!bucket) continue;

    bucket.collection.push(item);

    // Track load for buckets that support it (pack load / hands).
    if (bucket.locationLoad !== null) {
      const useStack = item?.system?.quantity?.stack ?? false;
      const quantity = useStack ? toFiniteNumber(item?.system?.quantity?.value, 1) : 1;
      let loadPerItem = null;
      if (bucket.loadType === "hands") {
        loadPerItem = item?.system?.twoHanded ? 2 : 1;
      } else if (bucket.loadType === "packLoad") {
        loadPerItem = toFiniteNumber(item?.system?.packLoad, 1);
      }
      if (loadPerItem !== null) {
        bucket.locationLoad += loadPerItem * quantity;
      }
    }

    if (bucket.loadLimit !== null) {
      bucket.overburdened = (bucket.locationLoad ?? 0) > bucket.loadLimit;
    }
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
  const archetype = archetypeId ? getTriskellIndex().gearArchetypes?.[archetypeId] : null;
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
function resolveReserveLabel(reservesIndex, reserveId) {
  if (!reserveId) return "";
  const reserve = reservesIndex?.[reserveId] ?? {};
  return reserve.label ?? reserveId;
}

function buildActionKeywords({
  action = null,
  keywordBuckets = null,
  selectedKeywords = []
} = {}) {
  const bucketsByKeyword = keywordBuckets ?? {};
  const selectedKeywordIds = new Set(Array.isArray(selectedKeywords) ? selectedKeywords : []);
  const availableKeywords = Array.isArray(action?.availableKeywords)
    ? action.availableKeywords
    : [];

  const attachedKeywords = [];
  for (const keyword of availableKeywords) {
    const normalizedKeyword = normalizeKeyword(keyword);
    const keywordsForBucket = bucketsByKeyword?.[normalizedKeyword];
    const keywordCollection = Array.isArray(keywordsForBucket) ? keywordsForBucket : [];
    if (!keywordCollection.length) continue;

    for (const keywordEntry of keywordCollection) {
      attachedKeywords.push({
        ...keywordEntry,
        active: selectedKeywordIds.has(keywordEntry.id)
      });
    }
  }

  return attachedKeywords;
}

function enrichActionLike({
  action = null,
  keywordBuckets = null,
  selectedKeywords = [],
  skills = {},
  keywordProperty = "forms",
  selectionCollection = null,
  selectionKind = null,
  reservesIndex = null
} = {}) {
  if (!action || typeof action !== "object" || !action.id) return null;

  const resolvedReservesIndex = reservesIndex ?? (getTriskellIndex().reserves ?? {});
  const resolvedSelectionKind = selectionKind ?? (action?.selectionKind === "spell" ? "spell" : "action");
  const resolvedKeywordProperty = keywordProperty
    ?? (resolvedSelectionKind === "spell" ? "attunements" : "forms");
  const bucketsByKeyword = keywordBuckets ?? {};
  const attachedKeywords = buildActionKeywords({
    action,
    keywordBuckets: bucketsByKeyword,
    selectedKeywords
  }).map(keywordEntry => ({
    ...keywordEntry,
    reserveLabel: resolveReserveLabel(resolvedReservesIndex, keywordEntry.reserve)
  }));

  const skillId = action?.skill ?? null;
  const skillSource = skillId ? skills?.[skillId] ?? null : null;
  const skillLabel = skillSource?.label ?? action?.skillLabel ?? (skillId ? skillId : null);
  const skillTotal = skillId
    ? toFiniteNumber([skillSource?.total, action?.skillTotal], 0)
    : null;
  const preparedAction = {
    ...action,
    reserveLabel: resolveReserveLabel(resolvedReservesIndex, action?.reserve),
    [resolvedKeywordProperty]: attachedKeywords,
    skill: skillId,
    skillLabel,
    skillTotal,
    selectionKind: resolvedSelectionKind
  };

  if (selectionCollection) {
    preparedAction.selectionCollection = selectionCollection;
  }

  // Kompatibilität: Forms oder Attunements optional auch im jeweils anderen Feld ablegen.
  if (resolvedKeywordProperty !== "forms" && !preparedAction.forms) preparedAction.forms = attachedKeywords;
  if (resolvedKeywordProperty !== "attunements" && !preparedAction.attunements) preparedAction.attunements = attachedKeywords;

  return preparedAction;
}

export function prepareActionLikesWithKeywords({
  actionLikes = null,
  keywordBuckets = null,
  selectedKeywords = [],
  skills = {},
  selectedTypeId = null,
  keywordProperty = "forms",
  selectionCollection = "selectedForms"
} = {}) {
  const actionLikesByType = actionLikes ?? {};
  const rawCollection = toArray(actionLikesByType?.[selectedTypeId]);
  const reservesIndex = getTriskellIndex().reserves ?? {};
  const collection = rawCollection
    .map(entry => enrichActionLike({
      action: entry,
      keywordBuckets,
      selectedKeywords,
      skills,
      keywordProperty,
      selectionCollection,
      selectionKind: keywordProperty === "attunements" ? "spell" : "action",
      reservesIndex
    }))
    .filter(Boolean);

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
  formLikes = {},
  keywordProperty = "forms",
  selectedForms = [],
  skills = {},
  selectionKind = null
} = {}) {
  const resolvedSelectionKind = selectionKind ?? (action?.selectionKind === "spell" ? "spell" : "action");
  const selectedKeywords = Array.isArray(selectedForms) ? selectedForms : [];
  const resolvedKeywordProperty = keywordProperty ?? (resolvedSelectionKind === "spell" ? "attunements" : "forms");
  return enrichActionLike({
    action,
    keywordBuckets: formLikes,
    selectedKeywords,
    skills,
    selectionKind: resolvedSelectionKind,
    keywordProperty: resolvedKeywordProperty
  });
}

export function getActionBucket(preparedActions, actionType) {
  return Array.isArray(preparedActions?.[actionType])
    ? preparedActions[actionType]
    : [];
}

export function prepareGearTabContext(actor = null, partId = null) {
  if (!["gear", "spells"].includes(partId)) return {};

  const powerMax = toFiniteNumber(actor?.system?.reserves?.power?.max, Number.NaN);
  const selectedTypesByPart = {
    gear: ["gear"],
    spells: ["spell"]
  };
  const selectedTypes = selectedTypesByPart[partId] ?? [];
  let itemsToDisplay = prepareAssetContext(actor?.assets, selectedTypes);
  if (partId === "gear" && Array.isArray(itemsToDisplay)) {
    itemsToDisplay = itemsToDisplay.map(category => {
      if (category?.id !== "gear") return category;
      return prepareGearLocationBuckets(category, { powerMax });
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

export function prepareRollHelperContext({ actor = null, system = {}, reserves = {}, commit = null } = {}) {
  const storedSelectedAction = system?.actions?.selectedAction ?? null;
  if (!storedSelectedAction || typeof storedSelectedAction !== "object" || !storedSelectedAction.selectionKind) {
    const { rollHelper, rollHelperSummary } = prepareRollHelperSelectionContext({
      selectedAction: null,
      reserves,
      commit
    });
    return {
      rollHelper,
      rollHelperSummary,
      rollHelperRollData: null
    };
  }
  let enrichedSelectedAction = null;
  const selectionKind = storedSelectedAction.selectionKind;
  const actionType = storedSelectedAction.actionType ?? system?.actions?.selectedType ?? "impact";
  const situationalModifier = toFiniteNumber(storedSelectedAction?.situationalModifier, 0);
  const skills = actor?.system?.skills ?? {};

  if (selectionKind === "action" || selectionKind === "spell") {
    if (storedSelectedAction?.actionId) {
      const selectedForms = toArray(system?.actions?.selectedForms);
      const preparedForms = actor?.preparedActions?.forms ?? {};
      const preparedAttunements = actor?.preparedActions?.attunements ?? {};
      const preparedActions = actor?.preparedActions?.actions ?? {};
      const preparedSpells = actor?.preparedActions?.spells ?? {};
      const actionBucket = getActionBucket(preparedActions, actionType);
      const spellBucket = getActionBucket(preparedSpells, actionType);
      const selectionBucket = selectionKind === "spell" ? spellBucket : actionBucket;
      const selectedAction = selectionBucket.find(action => action?.id === storedSelectedAction?.actionId) ?? null;
      if (selectedAction) {
        const formLikes = selectionKind === "spell" ? preparedAttunements : preparedForms;
        const keywordProperty = selectionKind === "spell" ? "attunements" : "forms";
        enrichedSelectedAction = enrichSelectedAction({
          action: {
            ...selectedAction,
            selectionKind,
            situationalModifier
          },
          formLikes,
          keywordProperty,
          selectedForms,
          skills,
          selectionKind
        });
      }
    }
  }

  else if (selectionKind === "skill") {
    const skillId = storedSelectedAction?.skillId ?? null;
    const skill = skillId ? skills?.[skillId] ?? null : null;
    if (skillId && skill) {
      const skillLabel = skill?.label ?? skillId;
      const skillTotal = toFiniteNumber(skill?.total, 0);
      const description = skill?.description ?? "";
      enrichedSelectedAction = {
        id: skillId,
        label: skillLabel,
        cost: 0,
        reserve: null,
        skill: skillId,
        skillLabel,
        skillTotal,
        description,
        forms: [],
        modifiers: [
          {
            label: skillLabel,
            value: skillTotal
          }
        ],
        selectionKind,
        situationalModifier
      };
    }
  }

  if (enrichedSelectedAction) {
    const rollActive = Boolean(enrichedSelectedAction?.skill);
    enrichedSelectedAction = {
      ...enrichedSelectedAction,
      roll: {
        ...(enrichedSelectedAction?.roll ?? {}),
        active: rollActive
      }
    };
  }
  const { rollHelper, rollHelperSummary } = prepareRollHelperSelectionContext({
    selectedAction: enrichedSelectedAction,
    reserves,
    commit
  });
  const rollHelperRollData = rollHelper?.hasSelection && rollHelper?.action?.roll?.active
    ? prepareRollHelperRollData({
      action: rollHelper.action,
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
export function prepareRollHelperSelectionContext({ selectedAction = null, reserves = {}, commit = null } = {}) {
  if (!selectedAction) {
    return {
      rollHelper: {
        hasSelection: false,
        action: {}
      },
      rollHelperSummary: null
    };
  }
  const commitValue = toFiniteNumber(commit?.value, 0);
  const situationalModifier = toFiniteNumber(selectedAction?.situationalModifier, 0);
  const selectionKind = selectedAction?.selectionKind === "spell" ? "spell" : "action";
  const normalizedForms = selectionKind === "spell"
    ? (Array.isArray(selectedAction?.attunements) ? selectedAction.attunements : [])
    : (Array.isArray(selectedAction?.forms) ? selectedAction.forms : []);
  const preparedForms = normalizedForms.map(form => {
    const skillBonus = toFiniteNumber(form?.modifier?.skill, Number.NaN);
    return {
      ...form,
      hasSkillBonus: Number.isFinite(skillBonus) && skillBonus !== 0
    };
  });
  const preparedAction = { ...selectedAction, forms: preparedForms, situationalModifier };
  const activeForms = preparedForms.filter(form => form.active);
  const rollHelper = {
    hasSelection: true,
    action: preparedAction
  };

  const rollHelperSummary = prepareRollHelperSummary({ action: preparedAction, activeForms, reserves, commitValue });

  return { rollHelper, rollHelperSummary };
}

export function prepareRollHelperRollData({ action = null, commitValue = 0 } = {}) {
  if (!action?.id || action?.roll?.active === false) return null;

  const actionLabel = action.label ?? action.id ?? "";
  const modifiers = Array.isArray(action.modifiers) ? [...action.modifiers] : [];
  const addModifier = (label, value) => {
    const numericValue = toFiniteNumber(value, Number.NaN);
    if (!label || !Number.isFinite(numericValue) || numericValue === 0) return;
    modifiers.push({ label, value: numericValue });
  };

  // Ensure the skill total is part of the modifier list (unless already present).
  const skillLabel = action.skillLabel ?? "";
  const skillTotal = toFiniteNumber(action.skillTotal, Number.NaN);
  const hasSkillModifier = skillLabel
    ? modifiers.some(modifier => (modifier?.label ?? "") === skillLabel)
    : false;
  if (!hasSkillModifier && Number.isFinite(skillTotal) && skillTotal !== 0) {
    modifiers.push({ label: skillLabel || actionLabel, value: skillTotal });
  }

  const normalizedForms = Array.isArray(action?.forms) ? action.forms : [];
  normalizedForms
    .filter(form => form.active)
    .forEach(form => {
      const formBonus = form?.modifier?.skill;
      addModifier(form?.label ?? form?.id ?? "Form", formBonus);
    });

  const normalizedCommitValue = action.reserve ? toFiniteNumber(commitValue, 0) : 0;
  addModifier("Commit", normalizedCommitValue);

  const situationalModifier = toFiniteNumber(action?.situationalModifier, 0);
  const situationalLabel = game.i18n?.localize?.("TRISKEL.Actor.RollHelper.SituationalModifier")
    ?? "Situational Modifier";
  addModifier(situationalLabel, situationalModifier);

  return {
    title: actionLabel,
    modifiers
  };
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
    const minimum = toFiniteNumber(reserveSource.min, 0);
    if (Number.isFinite(available) && available - total < minimum) {
      canAfford = false;
    }

    reserveCosts.push({
      id: reserveId,
      label: reserveSource.label ?? reserveId,
      total
    });
  }
  const totalSkillBonus = toFiniteNumber(action.skillTotal, 0)
    + activeForms.reduce((sum, form) => sum + toFiniteNumber(form?.modifier?.skill, 0), 0)
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
  const entries = Object.entries(bars);
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
  const preparedSkills = Object.values(skills);

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
