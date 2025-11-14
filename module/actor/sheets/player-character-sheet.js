const { ActorSheetV2 } = foundry.applications.sheets;

export class PlayerCharacterSheet extends ActorSheetV2 {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["triskel", "sheet", "actor", "character"],
      template: "systems/triskel/templates/actor/player-character-sheet.hbs",
      window: {
        title: "Triskel | Player Character"
      }
    });
  }

  async getData(options) {
    const context = await super.getData(options);
    context.system ??= this.actor.system;
    context.reserves = context.system.reserves ?? {};
    return context;
  }
}
