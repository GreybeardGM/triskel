// module/actor/triskel-character-sheet.js
export class TriskelCharacterSheet extends ActorSheet {
  get template() {
    return "systems/triskel/templates/actor/character-sheet.hbs";
  }

  async getData(options) {
    const data = await super.getData(options);
    const r = data.system.reserves;

    // 1..12 als Array
    const steps = Array.from({ length: 12 }, (_, i) => i + 1);

    data.triskel = {
      steps,
      powerValue: Number(r.power?.value ?? 0),
      graceValue: Number(r.grace?.value ?? 0),
      willValue: Number(r.will?.value ?? 0)
    };

    return data;
  }
}
