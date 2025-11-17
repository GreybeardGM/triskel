const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      classes: ["triskel", "sheet", "actor", "character"],
      form: {
        submitOnChange: true
      },
      actions: {
        editImage: this.#onEditImage
      },
      actor: {
        type: 'character'
      }
    }
  );

  static PARTS = {
    info: {
      id: "info",
      template: "systems/triskel/templates/actor/player-character-info.hbs"
    },
    reserves: {
      id: "reserves",
      template: "systems/triskel/templates/actor/reserves.hbs"
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
  
    // Reserves + Balken vorbereiten
    const reserves = context.system.reserves ?? {};
    const COLORS = {
      power: "#D9534F", // Rot-Orange
      grace: "#5CB85C", // Grün
      will:  "#5BC0DE"  // Cyan
    };
  
    for (const [key, reserve] of Object.entries(reserves)) {
      if (!reserve) continue;
  
      const color = COLORS[key] ?? "#5BC0DE";
      const min   = Number(reserve.min  ?? 0);
      const value = Number(reserve.value ?? 0);
      const max   = Number(reserve.max  ?? 0);
  
      const segments = [];
  
      // 12 Container, unten = 1, oben = 12
      for (let i = 12; i >= 1; i--) {
        let state;
        if (i <= min)       state = "strain";  // dunkelrot
        else if (i <= value) state = "filled"; // Pool-Farbe
        else if (i <= max)   state = "buffer"; // dunkelgrau bis max
        else                 state = "empty";  // über dem Max
  
        segments.push({ index: i, state });
      }
  
      reserve._color    = color;
      reserve._segments = segments;
    }
  
    context.reserves = reserves;
  
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

  static async #onEditImage(event, target) {
    const field = target.dataset.field || "img";
    const current = foundry.utils.getProperty(this.document, field);

    const picker = new foundry.applications.apps.FilePicker({
      type: "image",
      current,
      callback: (path) => this.document.update({ [field]: path })
    });

    picker.render(true);
  }
}
