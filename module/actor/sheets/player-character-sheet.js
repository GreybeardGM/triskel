const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["triskel", "sheet", "actor", "character"],
    template: "systems/triskel/templates/actor/player-character-sheet.hbs",
    window: {
      title: "Triskel | Player Character"
    }
  });

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system ??= this.actor.system;
    context.reserves = context.system.reserves ?? {};
    return context;
  }
}
