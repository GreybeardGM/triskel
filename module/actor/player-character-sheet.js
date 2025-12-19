import {
  onEditImage,
  onUpdateResourceValue
} from "./sheet-helpers.js";
import { normalizeIdList, toFiniteNumber } from "../util/normalization.js";

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
  if (Array.isArray(actions)) {
    if (type === "all") return actions;
    return actions.filter(action => (action?.type ?? "") === type);
  }

  const buckets = actions ?? {};
  if (type === "all") return buckets.all ?? [];
  return buckets[type] ?? [];
}

function buildRollHelperSummary({ action = null, forms = [], reserves = {}, reserveIndex = {}, commit = null } = {}) {
  if (!action) return null;

  const reserveLookup = reserveIndex ?? {};
  const reserveValues = reserves ?? {};

  const activeForms = Array.isArray(forms) ? forms.filter(form => form?.active) : [];
  const actionReserveId = `${action?.reserve ?? ""}`.trim();
  const hasActionReserve = Boolean(actionReserveId);
  const commitValue = hasActionReserve ? toFiniteNumber(commit?.value ?? commit ?? 0) : 0;
  const resolveReserveLabel = (reserveId) => {
    if (!reserveId) return reserveId;
    if (reserveId === actionReserveId && action?.reserveLabel) return action.reserveLabel;

    return reserveLookup?.[reserveId]?.label
      ?? reserveValues?.[reserveId]?.label
      ?? reserveId;
  };

  const totalSkillBonus = toFiniteNumber(
    action.roll?.totalBonus,
    toFiniteNumber(action.skillTotal)
      + activeForms.reduce((total, form) => total + toFiniteNumber(form.skillBonus), 0)
      + commitValue
  );

  const reserveCosts = Object.entries(action.cost ?? {}).reduce((collection, [reserveId, value]) => {
    const cost = toFiniteNumber(value, Number.NaN);
    if (!Number.isFinite(cost) || cost === 0) return collection;

    const reserveLabel = resolveReserveLabel(reserveId);
    collection.push({ id: reserveId, label: reserveLabel, total: cost });
    return collection;
  }, []);

  const reserveAvailability = new Map(
    Object.entries(reserveValues).map(([reserveId, reserve]) => {
      const available = toFiniteNumber(reserve?.value, 0);
      const minimum = toFiniteNumber(reserve?.min);

      const usableValue = Number.isFinite(available)
        ? Math.max(available - Math.max(minimum, 0), 0)
        : Number.NaN;

      return [reserveId, usableValue];
    })
  );

  const exceedsReserves = reserveCosts.some(({ id, total }) => {
    const available = reserveAvailability.has(id) ? reserveAvailability.get(id) : 0;
    return Number.isFinite(available) ? total > available : false;
  });

  return {
    totalSkillBonus,
    reserveCosts,
    canAfford: !exceedsReserves
  };
}

async function toggleActiveItem(event, target, expectedType) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  const itemType = expectedType ?? target?.dataset?.itemType ?? target.closest("[data-item-type]")?.dataset.itemType;
  if (!item || item.type !== itemType) return;

  const equipped = getEquippedList(itemType, this.document?.system?.equippedGear);
  const updatedEquipped = toggleIdInList(equipped, item.id);

  await this.document?.update({ [`system.equippedGear.${itemType}`]: updatedEquipped });
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

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.actor ??= this.document;
    context.system ??= this.document.system;

    const codex = getTriskellCodex();
    const index = getTriskellIndex();
    const reserves = context.system?.reserves ?? {};
    const commit = context.system?.actions?.commit ?? { id: "commit", _segments: [] };
    const paths = context.system?.paths ?? {};
    const skillCategories = context.system?.skillCategories ?? [];
    const actions = context.system?.actions ?? {};

    context.reserves = reserves;
    context.commit = commit;
    context.paths = paths;
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

    const itemsByType = itemCategories.reduce((collection, category) => {
      collection[category.id] = [];
      return collection;
    }, {});

    const items = Array.from(this.document.items ?? []).map(item => {
      const equippedList = equippedLists[item.type] ?? [];
      const isActive = equippedList.includes(item.id);
      const entry = {
        id: item.id,
        name: item.name,
        img: item.img,
        type: item.type,
        isActive
      };

      if (itemsByType[item.type]) itemsByType[item.type].push(entry);

      return entry;
    });

    items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    Object.values(itemsByType).forEach(itemList => itemList.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })));

    context.items = items;

    context.itemsByType = itemCategories.map(category => ({
      type: category.id,
      itemLabel: category.label,
      label: category.labelPlural,
      items: itemsByType[category.id] ?? []
    }));

    context.tierLabel = context.system?.tier?.label ?? "";

    const actionTypeFilter = createActionTypeFilter({
      actionTypes: actions.actionTypes ?? codex.actionTypes,
      selected: actionFilterSelection
    });

    context.actionFilter = {
      ...actionTypeFilter,
      actions: filterActionsByType(actions.actionsByType ?? context.system.actions?.actions, actionFilterSelection),
      spells: filterActionsByType(actions.spellsByType ?? context.system.actions?.spells, actionFilterSelection)
    };

    const selectedActionId = context.system.actions?.selected?.ref ?? null;
    const selectedAction = context.system.actions?.selected
      ?? (() => {
        const availableActions = Array.isArray(context.system.actions?.actions)
          ? context.system.actions.actions
          : [];
        const availableSpells = Array.isArray(context.system.actions?.spells)
          ? context.system.actions.spells
          : [];
        return [...availableActions, ...availableSpells]
          .find(action => action.id === selectedActionId);
      })();

    const selectedActionForms = Array.isArray(selectedAction?.forms) ? selectedAction.forms : [];
    context.rollHelper = selectedAction
      ? {
          action: selectedAction,
          forms: selectedActionForms
        }
      : null;

    context.rollHelperSummary = selectedAction
      ? buildRollHelperSummary({
          action: selectedAction,
          forms: selectedActionForms,
          reserves,
          reserveIndex: index.reserves,
          commit
        })
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
  const entries = normalizeIdList(equippedGear?.[gearKey]);

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

function toggleIdInList(list, id) {
  const normalized = Array.isArray(list) ? [...list] : [];
  const existingIndex = normalized.indexOf(id);

  if (existingIndex >= 0) normalized.splice(existingIndex, 1);
  else normalized.push(id);

  return normalized;
}

async function onToggleActiveItem(event, target) {
  await toggleActiveItem.call(this, event, target);
}
