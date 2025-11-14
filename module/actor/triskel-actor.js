// module/actor/triskel-character-sheet.js
export class TriskelActor extends ActorSheet {
  get template() {
    return "systems/triskel/templates/actor/character-sheet.hbs";
  }

  async getData(options) {
    const data = await super.getData(options);
    const r = data.system.reserves;

    data.triskel = {
      powerValue: Number(r.power?.value ?? 0),
      graceValue: Number(r.grace?.value ?? 0),
      willValue: Number(r.will?.value ?? 0)
    };

    return data;
  }
}
