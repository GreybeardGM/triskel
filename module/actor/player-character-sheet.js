import {
  onEditImage,
  onUpdateResourceValue,
  prepareBars,
  prepareSkillsDisplay
} from "./sheet-helpers.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const getTriskellCodex = () => CONFIG.triskell?.codex ?? {};
const getTriskellIndex = () => CONFIG.triskell?.index ?? {};

function createActionTypeFilter({ actionTypes = [], selected = "all" } = {}) {
  const options = [
    { id: "all", label: "TRISKEL.Action.Filter.All" },
    ...(Array.isArray(actionTypes) ? actionTypes : [])
  ];

  const optionIds = new Set(options.map(option => option.id));
  const normalizedSelected = optionIds.has(selected) ? selected : "all";

  return {
    selected: normalizedSelected,
    options: options.map(option => ({
      ...option,
      isActive: option.id === normalizedSelected
    }))
  };
}

function filterActionsByType(actions = [], type = "all") {
  const entries = Array.isArray(actions) ? actions : [];
  if (type === "all") return entries;

  return entries.filter(action => (action?.type ?? "") === type);
}

export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
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
      filterActionType: onFilterActionType,
      toggleWornEquip: onToggleWornEquip,
      toggleSpell: onToggleSpell,
      toggleHeldItem: onToggleHeldItem,
      toggleAbility: onToggleAbility
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
    info: {
      id: "info",
      template: "systems/triskel/templates/actor/player-character-info.hbs"
    },
    reserves: {
      id: "reserves",
      template: "systems/triskel/templates/actor/reserves.hbs"
    },
    paths: {
      id: "paths",
      template: "systems/triskel/templates/actor/paths.hbs"
    },
    tabs: {
      id: "tabs",
      template: "systems/triskel/templates/actor/player-character-tabs.hbs",
      sort: 50
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

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.actor ??= this.document;
    context.system ??= this.document.system;

    const codex = getTriskellCodex();
    const index = getTriskellIndex();

    // Prepare Sills
    const { resistances, skillCategories } = prepareSkillsDisplay(
      context.system.skills,
      context.system.resistances
    );

    // Prepare Reserves
    const reserves = prepareBars(context.system.reserves, index.reserves);

    // Prepare Paths
    const paths = prepareBars(context.system.paths, index.paths);

    context.reserves = reserves;
    context.paths = paths;
    context.resistances = resistances;
    context.skillCategories = skillCategories;
    const actionFilterSelection = this._actionTypeFilter ?? "all";
    const equippedGear = this.document.system?.equippedGear ?? {};
    const itemCategories = codex.itemCategories ?? [];
    const itemCategoriesById = index.itemCategories ?? {};

    const equippedLists = Object.fromEntries(
      itemCategories.map(({ id }) => [
        id,
        getEquippedList(id, equippedGear)
      ])
    );

    const items = Array.from(this.document.items ?? []).map(item => {
      const categoryConfig = itemCategoriesById[item.type];
      const equippedList = categoryConfig ? equippedLists[item.type] ?? [] : [];
      const isEquipToggleActive = categoryConfig ? equippedList.includes(item.id) : false;
      return {
        id: item.id,
        name: item.name,
        img: item.img,
        type: item.type,
        categoryType: categoryConfig ? item.type : undefined,
        isEquipToggleActive,
        toggleAction: categoryConfig?.toggleAction
      };
    });

    items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    context.items = items;

    context.itemsByType = itemCategories.map(category => ({
      type: category.id,
      itemLabel: category.label,
      label: category.labelPlural,
      toggleAction: category.toggleAction,
      items: items.filter(item => item.categoryType === category.id)
    }));

    const tierValue = Number(context.system.tier?.value);
    const tierLabel = codex.tiers?.find(tier => tier.tier === tierValue)?.label;
    context.tierLabel = tierLabel ?? "";

    const actionTypeFilter = createActionTypeFilter({
      actionTypes: codex.actionTypes,
      selected: actionFilterSelection
    });

    context.actionFilter = {
      ...actionTypeFilter,
      actions: filterActionsByType(context.system.actions?.actions, actionFilterSelection),
      spells: filterActionsByType(context.system.actions?.spells, actionFilterSelection)
    };

    const selectedActionId = context.system.actions?.selected ?? null;
    const availableActions = Array.isArray(context.system.actions?.actions)
      ? context.system.actions.actions
      : [];
    const availableSpells = Array.isArray(context.system.actions?.spells)
      ? context.system.actions.spells
      : [];
    const selectedAction = [...availableActions, ...availableSpells]
      .find(action => action.id === selectedActionId);

    context.rollHelper = selectedAction
      ? {
          action: selectedAction,
          forms: Array.isArray(selectedAction.forms) ? selectedAction.forms : []
        }
      : null;

    // Notes vorbereiten (aus der letzten Runde, falls noch nicht drin)
    context.notesHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.document.system.details?.notes ?? "",
      {
        secrets: this.document.isOwner,
        relativeTo: this.document
      }
    );
  
    return context;
  }

}

function getItemFromTarget(sheet, target) {
  const itemId = target.closest("[data-item-id]")?.dataset.itemId ?? target.dataset.itemId;
  if (!itemId) return null;

  return sheet.document?.items?.get(itemId) ?? null;
}

function getEquippedList(gearKey, equippedGear) {
  const entries = equippedGear?.[gearKey];
  if (!Array.isArray(entries)) return [];

  return Array.from(new Set(entries));
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

  const currentlySelected = this.document?.system?.actions?.selected ?? null;
  const nextSelection = currentlySelected === actionKey ? null : actionKey;

  await this.document?.update({ "system.actions.selected": nextSelection });
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

function toggleIdInList(list, id) {
  const normalized = Array.isArray(list) ? [...list] : [];
  const existingIndex = normalized.indexOf(id);

  if (existingIndex >= 0) normalized.splice(existingIndex, 1);
  else normalized.push(id);

  return normalized;
}

async function onToggleWornEquip(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || item.type !== "worn") return;

  const updatedWorn = toggleIdInList(
    getEquippedList("worn", this.document?.system?.equippedGear),
    item.id
  );

  await this.document?.update({ "system.equippedGear.worn": updatedWorn });
}

async function onToggleSpell(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || item.type !== "spell") return;

  const updatedSpells = toggleIdInList(
    getEquippedList("spell", this.document?.system?.equippedGear),
    item.id
  );

  await this.document?.update({ "system.equippedGear.spell": updatedSpells });
}

async function onToggleHeldItem(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || item.type !== "held") return;

  const updatedHeldItems = toggleIdInList(
    getEquippedList("held", this.document?.system?.equippedGear),
    item.id
  );

  await this.document?.update({ "system.equippedGear.held": updatedHeldItems });
}

async function onToggleAbility(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || item.type !== "ability") return;

  const updatedAbilities = toggleIdInList(
    getEquippedList("ability", this.document?.system?.equippedGear),
    item.id
  );

  await this.document?.update({ "system.equippedGear.ability": updatedAbilities });
}

