import {
  getTriskellCodex,
  getTriskellIndex,
  onEditImage,
  onUpdateResourceValue,
  prepareActorItemsContext,
  prepareActionLikesWithKeywords,
  prepareActorBarsContext,
  prepareRollHelperContext,
  prepareSkillsDisplay
} from "./sheet-helpers.js";
import { normalizeKeyword, toArray, toFiniteNumber } from "../util/normalization.js";
const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

async function toggleActiveItem(event, target, expectedType) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  const itemType = expectedType ?? target?.dataset?.itemType ?? target.closest("[data-item-type]")?.dataset.itemType;
  if (!item || (itemType && item.type !== itemType)) return;

  const isActive = Boolean(item.system?.active);
  await item.update({ "system.active": !isActive });
}

export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  _configureRenderOptions(options = {}) {
    const renderOptions = super._configureRenderOptions?.(options) ?? options ?? {};
    const configuredParts = renderOptions.parts;
    const partIds = Array.isArray(configuredParts)
      ? configuredParts
      : Object.keys(this.constructor.PARTS ?? {});
    const activeTab = this.tabGroups?.sheet
      ?? this.constructor.TABS?.sheet?.initial
      ?? "actions";
    const tabParts = new Set(["actions", "skills", "inventory", "notes"]);

    renderOptions.parts = partIds.filter(partId => !tabParts.has(partId) || partId === activeTab);
    return renderOptions;
  }

  async _onClickTab(event, tabs, tab) {
    await super._onClickTab?.(event, tabs, tab);

    const activeTab = typeof tab === "string"
      ? tab
      : tab?.id ?? tabs?.active ?? this.tabGroups?.sheet ?? null;

    if (activeTab) {
      await this.render({ parts: [activeTab] });
    }
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;

    context.actor ??= actor;
    context.system ??= actor?.system ?? {};
    const { reserves, paths, commit } = prepareActorBarsContext(actor);
    if (reserves) context.reserves = reserves;
    if (paths) context.paths = paths;
    if (commit) context.commit = commit;

    return context;
  }

  async _preparePartContext(partId, context, options) {
    const basePartContext = await super._preparePartContext(partId, context, options) ?? context ?? {};
    const actor = this.document;

    if (partId === "skills") {
      const { skillCategories } = prepareSkillsDisplay(actor?.system?.skills ?? {});
      return {
        ...basePartContext,
        skillCategories
      };
    }

    if (partId === "info") {
      const tierValue = actor?.system?.tier?.value;
      const tierLabelKey = getTriskellCodex()?.tiers?.find(tier => tier.tier === tierValue)?.label
        ?? getTriskellIndex()?.tiers?.find(tier => tier.tier === tierValue)?.label
        ?? null;
      const tierLabel = tierLabelKey ? (game.i18n?.localize?.(tierLabelKey) ?? tierLabelKey) : null;

      if (basePartContext.system) {
        basePartContext.system.tier ??= {};
        basePartContext.system.tier.label = tierLabel;
      }

      return {
        ...basePartContext,
        tierLabel
      };
    }

    if (partId === "notes") {
      const notes = actor?.system?.details?.notes ?? "";
      const notesHTML = await TextEditor?.enrichHTML?.(notes, { async: true }) ?? notes;

      return {
        ...basePartContext,
        notesHTML
      };
    }

    if (partId === "inventory") {
      return {
        ...basePartContext,
        assets: prepareActorItemsContext(actor)
      };
    }

    if (partId === "rollHelper") {
      const storedSelectedAction = basePartContext.system?.actions?.selectedAction ?? null;
      let enrichedSelectedAction = null;
      if (storedSelectedAction?.id) {
        const selectedForms = toArray(basePartContext.system?.actions?.selectedForms);
        const preparedForms = actor?.preparedActions?.forms ?? {};
        const preparedAttunements = actor?.preparedActions?.attunements ?? {};
        enrichedSelectedAction = enrichSelectedAction({
          action: storedSelectedAction,
          forms: preparedForms,
          attunements: preparedAttunements,
          selectedForms,
          skills: basePartContext.system?.skills ?? {}
        });
      }
      const { rollHelper, rollHelperSummary } = prepareRollHelperContext({
        selectedAction: enrichedSelectedAction,
        reserves: basePartContext.reserves ?? {},
        commit: basePartContext.commit ?? null
      });

      return {
        ...basePartContext,
        rollHelper,
        rollHelperSummary
      };
    }

    if (partId === "actions") {
      const selectedActionType = basePartContext.system?.actions?.selectedType ?? "impact";
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

      const collectSparseIndices = (entries = []) => {
        if (!Array.isArray(entries)) return [];
        return Array.from({ length: entries.length }, (_, index) =>
          (index in entries ? null : index)
        ).filter(index => index !== null);
      };

      const actionSparseIndices = collectSparseIndices(actions?.collection);
      const spellSparseIndices = collectSparseIndices(spells?.collection);

      console.log("TRISKEL | Actions part context prepared.", {
        ...basePartContext,
        actions,
        spells,
        actionTypeFilters,
        actionCollectionMeta: {
          length: actions?.collection?.length ?? 0,
          sparseIndices: actionSparseIndices
        },
        spellCollectionMeta: {
          length: spells?.collection?.length ?? 0,
          sparseIndices: spellSparseIndices
        }
      });

      return {
        ...basePartContext,
        actions,
        spells,
        actionTypeFilters
      };
    }

    return basePartContext;
  }

  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "actor", "character"],
    template: "systems/triskel/templates/actor/player-character-sheet.hbs",
    form: {
      submitOnChange: true
    },
    actions: {
      editImage: onEditImage,
      updateResourceValue: onUpdateResourceValue,
      editItem: onEditItem,
      deleteItem: onDeleteItem,
      selectAction: onSelectAction,
      toggleForm: onToggleForm,
      rollHelper: onRollHelper,
      filterActionType: onFilterActionType,
      toggleActiveItem: onToggleActiveItem
    },
    actor: {
      type: 'character'
    },
    window: {
      resizable: true
    },
    position: {
      height: "auto",
      width: 720
    }
  };

  static TABS = {
    sheet: {
      tabs: [
        {
          id: "actions",
          group: "sheet",
          icon: "fa-solid fa-bolt",
          label: "TRISKEL.Actor.Tab.Actions",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Actions"
        },
        {
          id: "skills",
          group: "sheet",
          icon: "fa-solid fa-shield-halved",
          label: "TRISKEL.Actor.Tab.Skills",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Skills"
        },
        {
          id: "inventory",
          group: "sheet",
          icon: "fa-solid fa-suitcase",
          label: "TRISKEL.Actor.Tab.Inventory",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Inventory"
        },
        {
          id: "notes",
          group: "sheet",
          icon: "fa-solid fa-pen-to-square",
          label: "TRISKEL.Actor.Tab.Notes",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Notes"
        }
      ],
      initial: "actions"
    }
  };

  static PARTS = {
    info: {
      id: "info",
      template: "systems/triskel/templates/actor/player-character-info.hbs",
      sort: 5
    },
    rollHelper: {
      id: "rollHelper",
      template: "systems/triskel/templates/actor/player-character-roll-helper.hbs",
      sort: 10
    },
    resources: {
      id: "resources",
      template: "systems/triskel/templates/actor/player-character-resources.hbs",
      sort: 20
    },
    actions: {
      id: "actions",
      template: "systems/triskel/templates/actor/player-character-actions.hbs",
      sort: 100
    },
    skills: {
      id: "skills",
      template: "systems/triskel/templates/actor/skills.hbs",
      sort: 200
    },
    notes: {
      id: "notes",
      template: "systems/triskel/templates/actor/player-character-notes.hbs",
      sort: 300
    },
    inventory: {
      id: "inventory",
      template: "systems/triskel/templates/actor/player-character-inventory.hbs",
      sort: 250
    }
  };

}

function getItemFromTarget(sheet, target) {
  const itemId = target.closest("[data-item-id]")?.dataset.itemId ?? target.dataset.itemId;
  if (!itemId) return null;

  return sheet.document?.items?.get(itemId) ?? null;
}

async function onEditItem(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  await item?.sheet?.render(true);
}

async function onDeleteItem(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item) return;

  await this.document?.deleteEmbeddedDocuments("Item", [item.id]);
}

async function onSelectAction(event, target) {
  event.preventDefault();

  const actionKey = target.closest("[data-action-key]")?.dataset.actionKey;
  if (!actionKey) return;

  const actor = this.document;
  const selectedActionType = actor?.system?.actions?.selectedType ?? "impact";
  const actionKind = target.closest("[data-action-kind]")?.dataset.actionKind ?? "action";
  const preparedActions = actor?.preparedActions?.actions ?? {};
  const preparedSpells = actor?.preparedActions?.spells ?? {};
  const actionBucket = getActionBucket(preparedActions, selectedActionType);
  const spellBucket = getActionBucket(preparedSpells, selectedActionType);
  const selectionBucket = actionKind === "spell" ? spellBucket : actionBucket;
  const selectedAction = selectionBucket.find(action => action?.id === actionKey) ?? null;
  if (!selectedAction) return;

  await actor?.update({ "system.actions.selectedAction": null });
  await actor?.update({
    "system.actions.selectedAction": {
      ...selectedAction,
      selectionKind: actionKind
    }
  });
}

async function onFilterActionType(event, target) {
  event.preventDefault();

  const filterValue = target.closest("[data-filter-value]")?.dataset.filterValue ?? "impact";
  await this.document?.update({ "system.actions.selectedType": filterValue });
}

async function onToggleForm(event, target) {
  event.preventDefault();

  const formKey = target.closest("[data-form-key]")?.dataset.formKey;
  if (!formKey) return;

  const selectionCollection = target.closest("[data-selection-collection]")?.dataset.selectionCollection
    ?? "selectedForms";
  const selectionPath = `system.actions.${selectionCollection}`;

  const actor = this.document;
  const currentSelection = [...toArray(actor?.system?.actions?.[selectionCollection])];

  const normalizedSelection = Array.from(new Set(currentSelection));
  const selectedIndex = normalizedSelection.indexOf(formKey);

  if (selectedIndex >= 0) normalizedSelection.splice(selectedIndex, 1);
  else normalizedSelection.push(formKey);

  await actor?.update({ [selectionPath]: normalizedSelection });
}

async function onRollHelper(event) {
  event.preventDefault();

  const actor = this.document;
  if (typeof actor?.rollSelectedAction !== "function") return;

  const rollResult = await actor.rollSelectedAction();
  if (rollResult) {
    await actor.update({ "system.actions.commit.value": 0 });
  }
}

async function onToggleActiveItem(event, target) {
  await toggleActiveItem.call(this, event, target);
}

function enrichSelectedAction({
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
    skillLabel = skillSource?.label ?? skillId;
    skillTotal = toFiniteNumber(skillSource?.total, 0);
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

function getActionBucket(preparedActions, actionType) {
  return Array.isArray(preparedActions?.[actionType])
    ? preparedActions[actionType]
    : [];
}
