import {
  getTriskellCodex,
  getTriskellIndex,
  getGearCarryLocationOptions,
  onEditImage,
  onUpdateResourceValue,
  prepareAssetContext,
  prepareActionLikesWithKeywords,
  prepareActorBarsContext,
  prepareGearLocationBuckets,
  prepareRollHelperContext,
  prepareSkillsDisplay
} from "./sheet-helpers.js";
import { normalizeKeyword, toArray, toFiniteNumber } from "../util/normalization.js";
const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

function getContextMenuClass() {
  const contextMenu = foundry.applications?.ux?.ContextMenu;
  return typeof contextMenu === "function" ? contextMenu : contextMenu?.implementation;
}

function asHTMLElement(element) {
  if (!element) return null;
  if (element instanceof HTMLElement) return element;
  if (Array.isArray(element) && element[0] instanceof HTMLElement) return element[0];
  if (element[0] instanceof HTMLElement) return element[0];
  return null;
}

async function toggleActiveItem(event, target, expectedType) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  const itemType = expectedType ?? target?.dataset?.itemType ?? target.closest("[data-item-type]")?.dataset.itemType;
  if (!item || (itemType && item.type !== itemType)) return;

  const isActive = Boolean(item.system?.active);
  await item.update({ "system.active": !isActive });
}

export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  activateListeners(html) {
    super.activateListeners?.(html);
    this._ensureCarryLocationMenu(html);
  }

  _ensureCarryLocationMenu(html) {
    const ContextMenuClass = getContextMenuClass();
    if (!ContextMenuClass) return;

    const container = asHTMLElement(html) ?? asHTMLElement(this.element) ?? document.body;
    if (this._carryLocationMenu && this._carryLocationMenu._container === container) return;

    closeCarryLocationMenu(this);

    const selector = "[data-action=\"openCarryLocationMenu\"]";
    const menu = new ContextMenuClass(
      container,
      selector,
      (element) => buildCarryLocationMenuItems(this, element),
      { eventName: "contextmenu" }
    );
    // eigene Referenz, unabhängig davon wie ContextMenu intern benennt
    menu._container = container;
    this._carryLocationMenu = menu;
  }

  async close(options = {}) {
    closeCarryLocationMenu(this);
    return super.close(options);
  }

  _configureRenderOptions(options = {}) {
    const renderOptions = super._configureRenderOptions?.(options) ?? options ?? {};
    const configuredParts = renderOptions.parts;
    const partIds = Array.isArray(configuredParts)
      ? configuredParts
      : Object.keys(this.constructor.PARTS ?? {});
    const activeTab = this.tabGroups?.sheet
      ?? this.constructor.TABS?.sheet?.initial
      ?? "actions";
    const tabParts = new Set(["actions", "skills", "gear", "spells", "notes"]);

    renderOptions.parts = partIds.filter(partId => !tabParts.has(partId) || partId === activeTab);
    return renderOptions;
  }

  async _onClickTab(event, tabs, tab) {
    await super._onClickTab?.(event, tabs, tab);

    const activeTab = typeof tab === "string"
      ? tab
      : tab?.id ?? tabs?.active ?? this.tabGroups?.sheet ?? null;

    if (activeTab) {
      closeCarryLocationMenu(this);
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
      const abilitiesToDisplay = prepareAssetContext(actor?.assets, ["ability"]);
      return {
        ...basePartContext,
        skillCategories,
        abilitiesToDisplay
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

    if (["gear", "spells"].includes(partId)) {
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
      return {
        ...basePartContext,
        itemsToDisplay,
        tab: basePartContext.tabs?.[partId]
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
      toggleActiveItem: onToggleActiveItem,
      selectSkill: onSelectSkill,
      openCarryLocationMenu: onOpenCarryLocationMenu
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
          id: "gear",
          group: "sheet",
          icon: "fa-solid fa-suitcase",
          label: "TRISKEL.Actor.Tab.Gear",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Gear"
        },
        {
          id: "spells",
          group: "sheet",
          icon: "fa-solid fa-book-sparkles",
          label: "TRISKEL.Actor.Tab.Spells",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Spells"
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
    gear: {
      id: "gear",
      template: "systems/triskel/templates/actor/player-character-gear.hbs",
      sort: 240
    },
    spells: {
      id: "spells",
      template: "systems/triskel/templates/actor/player-character-spells.hbs",
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

function closeCarryLocationMenu(sheet) {
  if (sheet._carryLocationMenu) {
    if (sheet._carryLocationMenu.element) {
      sheet._carryLocationMenu.close?.();
    } else {
      sheet._carryLocationMenu.remove?.();
    }
    sheet._carryLocationMenu.destroy?.();
    sheet._carryLocationMenu.remove?.();
    sheet._carryLocationMenu = null;
  }
}

function buildCarryLocationMenuItems(sheet, element) {
  const anchor = asHTMLElement(element);
  if (!anchor) return [];
  const item = getItemFromTarget(sheet, anchor);
  if (!item) return [];

  const locationOptions = getGearCarryLocationOptions(item) ?? [];
  if (!locationOptions.length) return [];

  return locationOptions.map(option => {
    const locationId = option.id ?? "";
    const label = option.label ?? locationId ?? "";
    const iconClass = option.icon ?? "fa-solid fa-location-dot";

    return {
      name: label,
      icon: `<i class="${iconClass}"></i>`,
      class: option.isActive ? "context-item--active" : "",
      callback: async () => {
        if (!locationId) return;
        const active = Boolean(option.defaultActive);
        await item.update({
          "system.carryLocation": locationId,
          "system.active": active
        });
        closeCarryLocationMenu(sheet);
      }
    };
  });
}

async function onOpenCarryLocationMenu(event, target) {
  event.preventDefault();
  event.stopPropagation();

  const sheet = this;
  const actionTarget = target ?? event.currentTarget ?? event.target;
  const anchorElement = asHTMLElement(actionTarget?.closest?.("[data-action=\"openCarryLocationMenu\"]") ?? actionTarget);
  if (!anchorElement) return;

  sheet._ensureCarryLocationMenu?.();
  const menu = sheet._carryLocationMenu;
  if (!menu) return;

  menu.open?.(event, anchorElement);
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

async function onSelectSkill(event, target) {
  event.preventDefault();

  const skillId = target.closest("[data-skill-id]")?.dataset.skillId ?? null;
  if (!skillId) return;

  const actor = this.document;
  const skill = actor?.system?.skills?.[skillId] ?? null;
  if (!skill) return;

  const skillLabel = skill?.label ?? skillId;
  const skillTotal = toFiniteNumber(skill?.total, 0);
  const description = skill?.description ?? "";

  const pseudoAction = {
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
    ]
  };

  await actor?.update({ "system.actions.selectedAction": null });
  await actor?.update({ "system.actions.selectedAction": pseudoAction });
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

function getActionBucket(preparedActions, actionType) {
  return Array.isArray(preparedActions?.[actionType])
    ? preparedActions[actionType]
    : [];
}
