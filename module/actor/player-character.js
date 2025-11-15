import { TriskelActor } from "./triskel-actor.js";

export class PlayerCharacter extends TriskelActor {
  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const reserves = this.system?.reserves ?? {};
    for (const reserve of Object.values(reserves)) {
      const strainValues = Object.values(reserve?.strain ?? {});
      const minimumFromStrain = strainValues.reduce(
        (total, isActive) => total + (isActive ? 1 : 0),
        0
      );
      reserve.min = minimumFromStrain;
    }
  }
}
