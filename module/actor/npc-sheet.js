import { onEditImage, onUpdateResourceValue } from "./sheet-helpers.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class NpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
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
    }
  );

  static PARTS = {
    info: {
      id: "info",
      template: "systems/triskel/templates/actor/player-character-info.hbs"
    },
    stats: {
      id: "stats",
      template: "systems/triskel/templates/actor/npc-stats.hbs"
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

    const health = foundry.utils.duplicate(context.system.health ?? {});
    const healthValues = Object.values(health).map(resource => Number(resource?.max ?? 0));
    const maxSegments = Math.max(...healthValues, 5);
    const statResources = [];

    for (const [key, resource] of Object.entries(health)) {
      if (!resource) continue;

      const min = Number(resource.min ?? 0);
      const value = Number(resource.value ?? 0);
      const max = Number(resource.max ?? 0);

      const segments = [];
      for (let i = maxSegments; i >= 1; i--) {
        let state;
        if (i <= min) state = "strain";
        else if (i <= value) state = "filled";
        else if (i <= max) state = "empty";
        else state = "placeholder";

        const clickable = state === "filled" || state === "empty";
        segments.push({ index: i, state, clickable });
      }

      resource._segments = segments;
      statResources.push({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        ...resource
      });
    }

    context.health = health;
    context.statResources = statResources;

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
