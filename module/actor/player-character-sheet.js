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
    context.actor ??= this.actor;
    context.system ??= this.actor.system;

    // Reserves
    const reserves = context.system.reserves ?? {};
    context.reserves = reserves;

    // Notizen für Editor vorbereiten
    context.enrichedNotes = await TextEditor.enrichHTML(
      this.actor.system.details?.notes ?? "",
      {
        secrets: this.actor.isOwner,
        rollData: this.actor.getRollData()
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
