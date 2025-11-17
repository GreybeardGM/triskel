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
        editImage: this.#onEditImage,
        quickTriskelRoll: this.#onQuickTriskelRoll
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
    roller: {
      id: "roller",
      template: "systems/triskel/templates/actor/player-character-roller.hbs"
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
    const vals = Object.values(reserves)
      .map(r => r?.max ?? 0);
    const maxSegments = Math.max(...vals, 5);
  
    for (const [key, reserve] of Object.entries(reserves)) {
      if (!reserve) continue;
  
      const min   = Number(reserve.min  ?? 0);
      const value = Number(reserve.value ?? 0);
      const max   = Number(reserve.max  ?? 0);
  
      const segments = [];
  
      // 12 Container, unten = 1, oben = 12
      for (let i = maxSegments; i >= 1; i--) {
        let state;
        if (i <= min)        state = "strain";  // dunkelrot
        else if (i <= value) state = "filled"; // Pool-Farbe
        else if (i <= max)   state = "empty"; // dunkelgrau bis max
        else                 state = "placeholder";  // über dem Max
  
        segments.push({ index: i, state });
      }
  
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
