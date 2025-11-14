const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["triskel", "sheet", "actor", "character"],
    window: {
      title: "Triskel | Player Character"
    }
  });

  static PARTS = foundry.utils.mergeObject(super.PARTS, {
    form: {
      template: "systems/triskel/templates/actor/player-character-sheet.hbs"
    }
  });

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor ??= this.actor;
    context.document ??= this.actor;
    context.system ??= this.actor.system;
    const reserves = context.system.reserves ?? context.system.system?.reserves ?? {};
    context.reserves = reserves;
    return context;
  }
}
