import { onEditImage, onUpdateResourceValue, prepareBars, prepareSkillsDisplay } from "./sheet-helpers.js";
import { TRISKEL_PATHS, TRISKEL_RESERVES, TRISKEL_TIERS } from "../codex/triskel-codex.js";

const ITEM_TYPE_ALIASES = {
  held: ["held"],
  worn: ["worn"],
  ability: ["ability"],
  spell: ["spell"]
};

const canonicalItemType = (type) => Object.entries(ITEM_TYPE_ALIASES)
  .find(([, aliases]) => aliases.includes(type))?.[0] ?? type;

const ITEM_CATEGORY_CONFIG = {
  held: {
    labelKey: "TRISKEL.ItemTypes.Held",
    gearKey: "Held",
    toggleAction: "toggleHeldItem",
    toggleTitleKey: "TRISKEL.ItemToggles.Held"
  },
  worn: {
    labelKey: "TRISKEL.ItemTypes.Worn",
    gearKey: "Worn",
    toggleAction: "toggleWornEquip",
    toggleTitleKey: "TRISKEL.ItemToggles.Worn"
  },
  ability: {
    labelKey: "TRISKEL.ItemTypes.Ability",
    gearKey: "Abilities",
    toggleAction: "toggleAbility",
    toggleTitleKey: "TRISKEL.ItemToggles.Ability"
  },
  spell: {
    labelKey: "TRISKEL.ItemTypes.Spell",
    gearKey: "Spells",
    toggleAction: "toggleSpell",
    toggleTitleKey: "TRISKEL.ItemToggles.Spell"
  }
};

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

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
          label: "TRISKEL.Tabs.Actions.Label",
          tooltip: "TRISKEL.Tabs.Actions.Tooltip"
        },
        {
          id: "skills",
          group: "sheet",
          icon: "fa-solid fa-shield-halved",
          label: "TRISKEL.Tabs.Skills.Label",
          tooltip: "TRISKEL.Tabs.Skills.Tooltip"
        },
        {
          id: "inventory",
          group: "sheet",
          icon: "fa-solid fa-suitcase",
          label: "TRISKEL.Tabs.Inventory.Label",
          tooltip: "TRISKEL.Tabs.Inventory.Tooltip"
        },
        {
          id: "notes",
          group: "sheet",
          icon: "fa-solid fa-pen-to-square",
          label: "TRISKEL.Tabs.Notes.Label",
          tooltip: "TRISKEL.Tabs.Notes.Tooltip"
        }
      ],
      initial: "actions"
    }
  };

  static PARTS = {
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

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
  
    context.actor ??= this.document;
    context.system ??= this.document.system;

    // Prepare Sills
    const { resistances, skillColumns } = prepareSkillsDisplay(
      context.system.skills,
      context.system.resistances
    );

    // Get Max Segments for sheet
    const reserveAndTensionValues = [];

    Object.values(context.system.reserves ?? {}).forEach(reserve => {
      const reserveValue = Number(reserve?.value);
      if (Number.isFinite(reserveValue)) reserveAndTensionValues.push(reserveValue);

      const reserveMax = Number(reserve?.max);
      if (Number.isFinite(reserveMax)) reserveAndTensionValues.push(reserveMax);
    });

    const tensionValue = Number(context.system.tension?.value);
    if (Number.isFinite(tensionValue)) reserveAndTensionValues.push(tensionValue);

    const tensionMax = Number(context.system.tension?.max);
    if (Number.isFinite(tensionMax)) reserveAndTensionValues.push(tensionMax);

    const MaxSegments = reserveAndTensionValues.length
      ? Math.max(...reserveAndTensionValues)
      : 5;

    // Prepare Reserves
    const reserves = prepareBars(context.system.reserves, MaxSegments, TRISKEL_RESERVES);
    const tension = prepareBars({ tension: context.system.tension }, MaxSegments).tension ?? context.system.tension;

    // Prepare Paths
    const preparedPaths = prepareBars(context.system.paths, MaxSegments, TRISKEL_PATHS);

    context.reserves = reserves;
    context.tension = tension;
    context.paths = preparedPaths;
    context.resistances = resistances;
    context.skillColumns = skillColumns;
    const equippedGear = this.document.system?.equippedGear ?? {};
    const equippedLists = Object.fromEntries(
      Object.entries(ITEM_CATEGORY_CONFIG).map(([type, config]) => [
        type,
        getEquippedList(config.gearKey, equippedGear)
      ])
    );

    const items = Array.from(this.document.items ?? []).map(item => {
      const categoryType = canonicalItemType(item.type);
      const categoryConfig = ITEM_CATEGORY_CONFIG[categoryType];
      const typeLabelKey = categoryConfig?.labelKey ?? `TRISKEL.ItemTypes.${categoryType}`;
      const localizedType = game.i18n.localize(typeLabelKey);
      const equippedList = categoryConfig ? equippedLists[categoryType] ?? [] : [];
      const isEquipToggleActive = categoryConfig ? equippedList.includes(item.id) : false;
      const toggleTitle = categoryConfig?.toggleTitleKey ? game.i18n.localize(categoryConfig.toggleTitleKey) : "";

      return {
        id: item.id,
        name: item.name,
        img: item.img,
        type: item.type,
        categoryType,
        typeLabel: localizedType === typeLabelKey ? categoryType : localizedType,
        isEquipToggleActive,
        toggleAction: categoryConfig?.toggleAction,
        toggleTitle
      };
    });

    items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    context.items = items;

    context.itemsByType = Object.entries(ITEM_CATEGORY_CONFIG).map(([type, config]) => ({
      type,
      label: game.i18n.localize(config.labelKey),
      toggleAction: config.toggleAction,
      toggleTitle: config.toggleTitleKey ? game.i18n.localize(config.toggleTitleKey) : "",
      items: items.filter(item => item.categoryType === type)
    }));
    const tierValue = Number(context.system.tier?.value);
    const tierLabelKey = Object.values(TRISKEL_TIERS).find(tier => tier.tier === tierValue)?.label;
    context.tierLabel = tierLabelKey ? game.i18n.localize(tierLabelKey) : "";

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

  await this.document?.update({ "system.actions.selected": actionKey });
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
  if (!item || canonicalItemType(item.type) !== "worn") return;

  const updatedWorn = toggleIdInList(
    getEquippedList("Worn", this.document?.system?.equippedGear),
    item.id
  );

  await this.document?.update({ "system.equippedGear.Worn": updatedWorn });
}

async function onToggleSpell(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || canonicalItemType(item.type) !== "spell") return;

  const updatedSpells = toggleIdInList(
    getEquippedList("Spells", this.document?.system?.equippedGear),
    item.id
  );

  await this.document?.update({ "system.equippedGear.Spells": updatedSpells });
}

async function onToggleHeldItem(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || canonicalItemType(item.type) !== "held") return;

  const updatedHeldItems = toggleIdInList(
    getEquippedList("Held", this.document?.system?.equippedGear),
    item.id
  );

  await this.document?.update({ "system.equippedGear.Held": updatedHeldItems });
}

async function onToggleAbility(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || canonicalItemType(item.type) !== "ability") return;

  const updatedAbilities = toggleIdInList(
    getEquippedList("Abilities", this.document?.system?.equippedGear),
    item.id
  );

  await this.document?.update({ "system.equippedGear.Abilities": updatedAbilities });
}

