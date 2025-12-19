import { onEditImage, onUpdateResourceValue } from "./sheet-helpers.js";

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
    core: {
      id: "core",
      template: "systems/triskel/templates/actor/npc-core.hbs"
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

    context.npcStats = context.system?.npcStats ?? {};
    context.skillCategories = context.system?.skillCategories ?? [];

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
