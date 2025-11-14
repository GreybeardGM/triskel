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
      reserve.max ??= 0;
      reserve.value ??= reserve.min ?? 0;

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

      const min = Number.isFinite(reserve.min) ? reserve.min : 0;
      const max = Number.isFinite(reserve.max) ? reserve.max : min;
      const value = Number.isFinite(reserve.value) ? reserve.value : min;

      reserve.value = foundry.utils.clamp(value, min, max);
    }
  }
}
