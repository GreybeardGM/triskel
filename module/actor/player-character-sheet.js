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
    const selectedActionType = context.system?.actions?.selectedType ?? "impact";

    const preparedBundle = this.document?.preparedActions ?? {};
    const preparedForms = preparedBundle.forms ?? {};
    const preparedAttunements = preparedBundle.attunements ?? {};
    const preparedActions = preparedBundle.actions ?? {};
    const preparedSpells = preparedBundle.spells ?? {};
    const selectedActionId = this.document?.system?.actions?.selected?.ref ?? null;
    const selectedForms = Array.isArray(this.document?.system?.actions?.selectedForms)
      ? this.document.system.actions.selectedForms
      : [];
    context.actions = prepareActionLikesWithKeywords({
      actionLikes: preparedActions,
      keywordBuckets: preparedForms,
      selectedActionId,
      selectedKeywords: selectedForms,
      skills: this.document?.system?.skills ?? {},
      selectedTypeId: selectedActionType,
      keywordProperty: "forms"
    });
    context.spells = prepareActionLikesWithKeywords({
      actionLikes: preparedSpells,
      keywordBuckets: preparedAttunements,
      selectedActionId,
      selectedKeywords: selectedForms,
      skills: this.document?.system?.skills ?? {},
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
    context.actions.selectedType = context.actions?.selectedType ?? selectedActionType;
    context.spells.selectedType = context.spells?.selectedType ?? selectedActionType;
    context.actionTypeFilters = actionTypeFilters;
    const selectedAction = context.actions?.selectedAction ?? context.spells?.selectedAction ?? null;
    const { reserves, paths, commit } = prepareActorBarsContext(this.document);
    if (reserves) context.reserves = reserves;
    if (paths) context.paths = paths;
    if (commit) context.commit = commit;
    const { rollHelper, rollHelperSummary } = prepareRollHelperContext({
      selectedAction,
      reserves: context.reserves ?? {},
      commit: context.commit ?? null
    });
    context.rollHelper = rollHelper;
    context.rollHelperSummary = rollHelperSummary;

    return context;
  }

  async _preparePartContext(partId, context, options) {
    const basePartContext = await super._preparePartContext(partId, context, options) ?? context ?? {};

    if (partId === "skills") {
      const { skillCategories } = prepareSkillsDisplay(this.document?.system?.skills ?? {});
      return {
        ...basePartContext,
        skillCategories
      };
    }

    if (partId === "info") {
      const tierValue = this.document?.system?.tier?.value;
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
      const notes = this.document?.system?.details?.notes ?? "";
      const notesHTML = await TextEditor?.enrichHTML?.(notes, { async: true }) ?? notes;

      return {
        ...basePartContext,
        notesHTML
      };
    }

    if (partId === "inventory") {
      return {
        ...basePartContext,
        assets: prepareActorItemsContext(this.document)
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

  const currentlySelected = this.document?.system?.actions?.selected?.ref ?? null;
  const nextSelection = currentlySelected === actionKey ? null : actionKey;

  await this.document?.update({ "system.actions.selected.ref": nextSelection });
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

  const currentSelection = Array.isArray(this.document?.system?.actions?.[selectionCollection])
    ? [...this.document.system.actions[selectionCollection]]
    : [];

  const normalizedSelection = Array.from(new Set(currentSelection));
  const selectedIndex = normalizedSelection.indexOf(formKey);

  if (selectedIndex >= 0) normalizedSelection.splice(selectedIndex, 1);
  else normalizedSelection.push(formKey);

  await this.document?.update({ [selectionPath]: normalizedSelection });
}

async function onRollHelper(event) {
  event.preventDefault();

  if (typeof this.document?.rollSelectedAction !== "function") return;

  const rollResult = await this.document.rollSelectedAction();
  if (rollResult) {
    await this.document.update({ "system.actions.commit.value": 0 });
  }
}

async function onToggleActiveItem(event, target) {
  await toggleActiveItem.call(this, event, target);
}
