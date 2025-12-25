import {
  getTriskellCodex,
  getTriskellIndex,
  onEditImage,
  onUpdateResourceValue,
  prepareActorItemsContext,
  prepareActorSkillsContext,
  prepareActorFormsContext,
  prepareActorActionsContext,
  prepareActorActionsWithForms,
  prepareActorBarsContext,
  prepareRollHelperContext
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
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;

    context.actor ??= actor;
    context.system ??= actor?.system ?? {};

    // Tier-Label aus Codex/Index ermitteln.
    const tierValue = this.document?.system?.tier?.value;
    const tierLabelKey = getTriskellCodex()?.tiers?.find(tier => tier.tier === tierValue)?.label
      ?? getTriskellIndex()?.tiers?.find(tier => tier.tier === tierValue)?.label
      ?? null;
    const tierLabel = tierLabelKey ? (game.i18n?.localize?.(tierLabelKey) ?? tierLabelKey) : null;

    context.tierLabel = tierLabel;
    if (context.system) {
      context.system.tier ??= {};
      context.system.tier.label = tierLabel;
    }

    const { skillCategories } = prepareActorSkillsContext(this.document);
    context.skillCategories = skillCategories;
    context.assets = prepareActorItemsContext(this.document);
    const preparedForms = this.document?.preparedForms ?? prepareActorFormsContext(this.document);
    const preparedActions = this.document?.preparedActions ?? prepareActorActionsContext(this.document);
    const selectedActionId = this.document?.system?.actions?.selected?.ref ?? null;
    const selectedForms = Array.isArray(this.document?.system?.actions?.selectedForms)
      ? this.document.system.actions.selectedForms
      : [];
    context.actions = prepareActorActionsWithForms({
      actions: preparedActions,
      forms: preparedForms,
      selectedActionId,
      selectedForms
    });
    const { reserves, paths, commit } = prepareActorBarsContext(this.document);
    if (reserves) context.reserves = reserves;
    if (paths) context.paths = paths;
    if (commit) context.commit = commit;
    const { rollHelper, rollHelperSummary } = prepareRollHelperContext({
      selectedAction: context.actions?.selectedAction ?? null,
      reserves: context.reserves ?? {}
    });
    context.rollHelper = rollHelper;
    context.rollHelperSummary = rollHelperSummary;

    return context;
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
    rollHelper: {
      id: "rollHelper",
      template: "systems/triskel/templates/actor/player-character-roll-helper.hbs"
    },
    core: {
      id: "core",
      template: "systems/triskel/templates/actor/player-character-core.hbs"
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

  const filterValue = target.closest("[data-filter-value]")?.dataset.filterValue ?? "all";
  this._actionTypeFilter = filterValue;
  await this.render();
}

async function onToggleForm(event, target) {
  event.preventDefault();

  const formKey = target.closest("[data-form-key]")?.dataset.formKey;
  if (!formKey) return;

  const currentSelection = Array.isArray(this.document?.system?.actions?.selectedForms)
    ? [...this.document.system.actions.selectedForms]
    : [];

  const normalizedSelection = Array.from(new Set(currentSelection));
  const selectedIndex = normalizedSelection.indexOf(formKey);

  if (selectedIndex >= 0) normalizedSelection.splice(selectedIndex, 1);
  else normalizedSelection.push(formKey);

  await this.document?.update({ "system.actions.selectedForms": normalizedSelection });
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
