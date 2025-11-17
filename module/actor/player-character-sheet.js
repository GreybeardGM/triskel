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
        quickTriskelRoll: this.#onQuickTriskelRoll,
        decrementNumberInput: this.#onDecrementNumberInput,
        incrementNumberInput: this.#onIncrementNumberInput
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
      reserve._fields = {
        max: `system.reserves.${key}.max`,
        value: `system.reserves.${key}.value`
      };
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

  static #onIncrementNumberInput(event, target) {
    this.#adjustNumberInput(event, target, 1);
  }

  static #onDecrementNumberInput(event, target) {
    this.#adjustNumberInput(event, target, -1);
  }

  static #adjustNumberInput(event, target, direction) {
    event.preventDefault();

    const container = target.closest("[data-number-input]");
    if (!container) return;

    const input = container.querySelector('input[type="number"]');
    if (!input) return;

    const stepValue = Number(input.step ?? 1);
    const step = Number.isFinite(stepValue) && stepValue !== 0 ? stepValue : 1;
    const delta = step * direction;

    const currentValue = Number(input.value);
    let nextValue = Number.isFinite(currentValue) ? currentValue + delta : direction > 0 ? step : 0;

    if (input.min !== "") {
      const min = Number(input.min);
      if (Number.isFinite(min)) nextValue = Math.max(min, nextValue);
    }

    if (input.max !== "") {
      const max = Number(input.max);
      if (Number.isFinite(max)) nextValue = Math.min(max, nextValue);
    }

    input.value = nextValue;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
