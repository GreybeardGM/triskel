export class PlayerCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["triskel", "sheet", "actor", "character"],
      template: "systems/triskel/templates/actor/player-character-sheet.hbs"
    });
  }
}
