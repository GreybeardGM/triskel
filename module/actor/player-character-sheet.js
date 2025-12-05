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
      selectAction: this.#onSelectAction,
      toggleFormSelection: this.#onToggleFormSelection,
      updateResourceValue: onUpdateResourceValue,
      editItem: this.#onEditItem,
      deleteItem: this.#onDeleteItem
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
    const actionFormsState = context.system.actions?.formsState ?? context.system.actions?.forms ?? {};
    context.actionForms = actionFormsState;
    context.standardActions = context.system.actions?.standard ?? [];
    context.items = Array.from(this.document.items ?? []).map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      typeLabel: (() => {
        const typeLabelKey = `TRISKEL.ItemTypes.${item.type}`;
        const localizedType = game.i18n.localize(typeLabelKey);
        return localizedType === typeLabelKey ? item.type : localizedType;
      })()
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

  static async #onSelectAction(event, target) {
    event.preventDefault();

    const actionKey = target.dataset.actionKey ?? target.closest("[data-action-key]")?.dataset.actionKey;
    if (!actionKey) return;

    const currentSelection = this.document.system?.actions?.selected ?? null;
    const isAlreadySelected = currentSelection === actionKey;

    if (isAlreadySelected) {
      target.checked = false;
      await this.document.update({ "system.actions.selected": null });
      return;
    }

    await this.document.update({ "system.actions.selected": actionKey });
  }

  static async #onToggleFormSelection(event, target) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const actionKey = target.dataset.actionKey;
    const formKey = target.dataset.formKey;
    if (!actionKey || !formKey) return;

    const currentForms = foundry.utils.duplicate(this.document.system?.actions?.forms ?? {});
    const normalizedForAction = Object.entries(currentForms[actionKey] ?? {}).reduce((collection, [key, formState]) => {
      const activeState = typeof formState === "boolean" ? formState : formState?.active;
      collection[key] = { active: Boolean(activeState) };
      return collection;
    }, {});

    const currentState = normalizedForAction[formKey]?.active ?? false;
    normalizedForAction[formKey] = { active: !currentState };

    currentForms[actionKey] = normalizedForAction;

    await this.document.update({ "system.actions.forms": currentForms });
  }

  static #getItemFromTarget(target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId ?? target.dataset.itemId;
    if (!itemId) return null;

    return this.document?.items?.get(itemId) ?? null;
  }

  static async #onEditItem(event, target) {
    event.preventDefault();

    const item = this.#getItemFromTarget(target);
    await item?.sheet?.render(true);
  }

  static async #onDeleteItem(event, target) {
    event.preventDefault();

    const item = this.#getItemFromTarget(target);
    if (!item) return;

    await this.document?.deleteEmbeddedDocuments("Item", [item.id]);
  }

}
