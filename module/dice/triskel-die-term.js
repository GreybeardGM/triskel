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
    const classNames = Array.isArray(css)
      ? css.join(" ")
      : typeof css === "string"
        ? css
        : "";
    const value = TriskelDieTerm.map10to09(result.result);
    const classList = new Set(classNames.split(/\s+/).filter(Boolean));

    classList.delete("min");
    classList.delete("max");

    if (value === 0) classList.add("min");
    if (value === 9) classList.add("max");

    return Array.from(classList);
  }

  get values() {
    return this.results.map(result => TriskelDieTerm.map10to09(result.result));
  }

  get total() {
    return this.values.reduce((total, value) => total + value, 0);
  }
}

export function registerTriskelDiceTerm() {
  if (!globalThis.CONFIG?.Dice?.terms) return;
  CONFIG.Dice.terms.t = TriskelDieTerm;
}

export function registerTriskelDiceSoNice(dice3d) {
  if (!dice3d?.addSystem || !dice3d?.addDicePreset) return;

  dice3d.addSystem({ id: "triskel", name: "Triskel" }, "preferred");
  if (dice3d.addColorset) {
    dice3d.addColorset({
      name: "Threat",
      description: "Triskel Threat",
      category: "Triskel",
      foreground: "#fdf7f2",
      background: "#a0191d",
      outline: "#4f0c0e",
      edge: "#4f0c0e",
      texture: "bronze03b",
      font: "Arial",
      material: "plastic"
    }, "default");

    dice3d.addColorset({
      name: "Obstacle",
      description: "Triskel Obstacle",
      category: "Triskel",
      foreground: "#1f1400",
      background: "#f2a11b",
      outline: "#b36a10",
      edge: "#b36a10",
      texture: "bronze03b",
      font: "Arial",
      material: "plastic"
    }, "default");
  }
  dice3d.addDicePreset({
    type: "dt",
    system: "triskel",
    labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
  }, "d10");
}
