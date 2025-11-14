export class TriskelCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["triskel", "sheet", "actor", "character"],
      template: "systems/triskel/templates/actor/character-sheet.hbs"
    });
  }
}
