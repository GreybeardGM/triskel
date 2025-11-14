import { TriskelActor } from "./triskel-actor.js";

const RESERVE_TYPES = ["power", "grace", "will"];

export class PlayerCharacter extends TriskelActor {
  /** @override */
  prepareBaseData() {
    super.prepareBaseData();

    const sourceSystem = (this._source.system ??= {});
    const sourceReserves = (sourceSystem.reserves ??= {});

    const reserves = (this.system.reserves ??= {});
    for (const type of RESERVE_TYPES) {
      const reserveSource = (sourceReserves[type] ??= {});
      const reserve = (reserves[type] ??= reserveSource);
      reserve.min ??= 0;
      reserve.max ??= 12;
      reserve.value ??= 12;

      const strain = (reserve.strain ??= {});
      for (let index = 1; index <= 5; index += 1) {
        const key = `s${index}`;
        strain[key] ??= false;
      }
    }
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const reserves = this.system.reserves ?? {};
    for (const type of RESERVE_TYPES) {
      const reserve = reserves[type];
      if (!reserve) continue;

      const min = reserve.min;
      const max = reserve.max;
      const value = reserve.value;

      value = foundry.utils.clamp(value, min, max);
    }
  }
}
