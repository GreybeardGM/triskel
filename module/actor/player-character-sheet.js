import { onEditImage, onUpdateResourceValue, prepareBars, prepareSkillsDisplay } from "./sheet-helpers.js";
import { TRISKEL_PATHS, TRISKEL_RESERVES, TRISKEL_TIERS } from "../codex/triskel-codex.js";

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
      toggleArmorEquip: onToggleArmorEquip,
      togglePreparedSpell: onTogglePreparedSpell,
      toggleMainHand: onToggleMainHand,
      toggleOffHand: onToggleOffHand
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
    const equippedArmor = Array.isArray(equippedGear.armor) ? equippedGear.armor : [];
    const preparedSpells = Array.isArray(equippedGear.preparedSpells) ? equippedGear.preparedSpells : [];
    const mainHandId = typeof equippedGear.mainHand === "string" ? equippedGear.mainHand : "";
    const offHandId = typeof equippedGear.offHand === "string" ? equippedGear.offHand : "";

    const items = Array.from(this.document.items ?? []).map(item => ({
      id: item.id,
      name: item.name,
      img: item.img,
      type: item.type,
      typeLabel: (() => {
        const typeLabelKey = `TRISKEL.ItemTypes.${item.type}`;
        const localizedType = game.i18n.localize(typeLabelKey);
        return localizedType === typeLabelKey ? item.type : localizedType;
      })(),
      isEquippedArmor: item.type === "armor" && equippedArmor.includes(item.id),
      isPreparedSpell: item.type === "spell" && preparedSpells.includes(item.id),
      isMainHand: item.type === "weapon" && item.id === mainHandId,
      isOffHand: item.type === "weapon" && item.id === offHandId,
      isEquipToggleActive:
        (item.type === "armor" && equippedArmor.includes(item.id)) ||
        (item.type === "spell" && preparedSpells.includes(item.id)) ||
        (item.type === "weapon" && (item.id === mainHandId || item.id === offHandId))
    }));

    items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    context.items = items;
    context.equippedWeapons = {
      mainHand: items.find(item => item.type === "weapon" && item.id === mainHandId) ?? null,
      offHand: items.find(item => item.type === "weapon" && item.id === offHandId) ?? null
    };

    const itemTypeLabels = {
      weapon: game.i18n.localize("TRISKEL.ItemTypes.Weapon"),
      armor: game.i18n.localize("TRISKEL.ItemTypes.Armor"),
      ability: game.i18n.localize("TRISKEL.ItemTypes.Ability"),
      spell: game.i18n.localize("TRISKEL.ItemTypes.Spell")
    };

    context.itemsByType = Object.entries(itemTypeLabels).map(([type, label]) => ({
      type,
      label,
      items: items.filter(item => item.type === type),
      hasEquipToggle: type === "armor" || type === "spell",
      hasWeaponToggle: type === "weapon",
      isArmorCategory: type === "armor",
      isSpellCategory: type === "spell",
      isWeaponCategory: type === "weapon"
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

async function onToggleArmorEquip(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || item.type !== "armor") return;

  const updatedArmor = toggleIdInList(this.document?.system?.equippedGear?.armor, item.id);

  await this.document?.update({ "system.equippedGear.armor": updatedArmor });
}

async function onTogglePreparedSpell(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || item.type !== "spell") return;

  const updatedSpells = toggleIdInList(this.document?.system?.equippedGear?.preparedSpells, item.id);

  await this.document?.update({ "system.equippedGear.preparedSpells": updatedSpells });
}

async function onToggleMainHand(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || item.type !== "weapon") return;

  const currentMainHand = typeof this.document?.system?.equippedGear?.mainHand === "string"
    ? this.document.system.equippedGear.mainHand
    : "";

  const newMainHand = currentMainHand === item.id ? "" : item.id;

  await this.document?.update({ "system.equippedGear.mainHand": newMainHand });
}

async function onToggleOffHand(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item || item.type !== "weapon") return;

  const currentOffHand = typeof this.document?.system?.equippedGear?.offHand === "string"
    ? this.document.system.equippedGear.offHand
    : "";

  const newOffHand = currentOffHand === item.id ? "" : item.id;

  await this.document?.update({ "system.equippedGear.offHand": newOffHand });
}

