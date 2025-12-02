import { onEditImage, onUpdateResourceValue, prepareBars, prepareSkillsDisplay, prepareStandardActions } from "./sheet-helpers.js";
import { TRISKEL_PATHS, TRISKEL_RESERVES, TRISKEL_TIERS } from "../codex/triskel-codex.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "actor", "character"],
    form: {
      submitOnChange: true
    },
    actions: {
      editImage: onEditImage,
      quickTriskelRoll: this.#onQuickTriskelRoll,
      updateResourceValue: onUpdateResourceValue
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
    roller: {
      id: "roller",
      template: "systems/triskel/templates/actor/player-character-roller.hbs"
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
    context.standardActions = prepareStandardActions(
      context.system.actions?.selected,
      context.system.skills,
      context.system.reserves
    );
    const tierValue = Number(context.system.tier?.value);
    context.tierLabel = Object.values(TRISKEL_TIERS).find(tier => tier.tier === tierValue)?.label ?? "";

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

  static async #onQuickTriskelRoll(event, target) {
    event.preventDefault();

    const container = target.closest("[data-quick-roll]");
    const modifierInput = container?.querySelector("[data-quick-roll-modifier]");
    const modifierValue = Number(modifierInput?.value ?? 0);

    const modifiers = Number.isFinite(modifierValue) && modifierValue !== 0
      ? [{ label: "Sheet Modifier", value: modifierValue }]
      : [];

    await this.document?.rollTriskelDice({ modifiers });
  }

}
