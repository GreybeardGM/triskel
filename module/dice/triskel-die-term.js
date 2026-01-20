export class TriskelDieTerm extends foundry.dice.terms.Die {
  static DENOMINATION = "t";

  constructor(termData = {}) {
    super({ ...termData, faces: 10 });

    this.options.appearance ??= { system: "triskel", dice: "dt" };
  }

  static map10to09(result) {
    return result % 10;
  }

  getResultLabel(result) {
    return String(TriskelDieTerm.map10to09(result.result));
  }

  getResultCSS(result) {
    const css = super.getResultCSS(result);
    const value = TriskelDieTerm.map10to09(result.result);
    const classList = new Set(css.split(/\s+/).filter(Boolean));

    classList.delete("min");
    classList.delete("max");

    if (value === 0) classList.add("min");
    if (value === 9) classList.add("max");

    return Array.from(classList).join(" ");
  }
}

export function registerTriskelDiceTerm() {
  if (!globalThis.CONFIG?.Dice?.terms) return;
  CONFIG.Dice.terms.t = TriskelDieTerm;
}

export function registerTriskelDiceSoNice(dice3d) {
  if (!dice3d?.addSystem || !dice3d?.addDicePreset) return;

  dice3d.addSystem({ id: "triskel", name: "Triskel" }, "preferred");
  dice3d.addDicePreset({
    type: "dt",
    system: "triskel",
    labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
  }, "d10");
}
