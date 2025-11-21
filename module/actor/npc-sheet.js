import { onEditImage, onUpdateResourceValue, prepareResourceBars, prepareSkillsDisplay } from "./sheet-helpers.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class NpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "actor", "npc"],
    form: {
      submitOnChange: true
    },
    actions: {
      editImage: onEditImage,
      updateResourceValue: onUpdateResourceValue
    },
    actor: {
      type: "npc"
    },
    window: {
      resizable: true
    },
    position: {
      height: "auto",
      width: 720
    }
  };

  static PARTS = {
    info: {
      id: "info",
      template: "systems/triskel/templates/actor/player-character-info.hbs"
    },
    stats: {
      id: "stats",
      template: "systems/triskel/templates/actor/npc-stats.hbs"
    },
    skills: {
      id: "skills",
      template: "systems/triskel/templates/actor/skills.hbs"
    },
    notes: {
      id: "notes",
      template: "systems/triskel/templates/actor/player-character-notes.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.actor ??= this.document;
    context.system ??= this.document.system;

    const { resistances, skillColumns } = prepareSkillsDisplay(
      context.system.skills,
      context.system.resistances
    );

    context.resistances = resistances;
    context.skillColumns = skillColumns;

    // Health + Balken vorbereiten
    const { resources: health } = prepareResourceBars({
      resources: context.system.health ?? {},
      fallbackMax: 5
    });

    context.health = health;

    // Notes Vorbereiten
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
