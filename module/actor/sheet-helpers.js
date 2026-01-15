import {
  normalizeIdList,
  normalizeKeyword,
  toArray,
  toFiniteNumber
} from "../util/normalization.js";

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
    const bucket = { ...location, collection: [] };
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
  const carryLocations = toArray(getTriskellCodex().carryLocations);
  if (!carryLocations.length) return [];

  const archetypeId = normalizeKeyword(item?.system?.archetype ?? "", "");
  const archetype = archetypeId ? getTriskellIndex().gearArchetypes?.[archetypeId] ?? null : null;
  const overrideLocations = normalizeIdList(item?.system?.overwrite?.validLocations);
  const archetypeLocations = normalizeIdList(archetype?.validLocations);
  const validLocationIds = overrideLocations.length ? overrideLocations : archetypeLocations;
  const validLocationSet = validLocationIds.length ? new Set(validLocationIds) : null;
  const currentLocation = normalizeKeyword(item?.system?.carryLocation ?? "", "");

  return carryLocations
    .filter(location => !validLocationSet || validLocationSet.has(location?.id))
    .map(location => ({
      ...location,
      isActive: location?.id === currentLocation
    }));
}

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
    preparedAction.skill = skillId ?? null;

    if (skillId) {
      const skillSource = skills?.[skillId] ?? null;
      preparedAction.skillLabel = skillSource?.label ?? skillId;
      preparedAction.skillTotal = toFiniteNumber(skillSource?.total, 0);
    } else {
      preparedAction.skillLabel = null;
      preparedAction.skillTotal = null;
    }

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
    + toFiniteNumber(action.situationalModifier, 0)
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
