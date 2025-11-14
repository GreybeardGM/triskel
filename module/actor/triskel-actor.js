export class TriskelActor extends Actor {
  /** @override */
  prepareBaseData() {
    this._normalizeSystemStructure();
    super.prepareBaseData();
    this._normalizeSystemStructure();
    // Hier später allgemeine Sachen für alle Actor rein
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const system = this.system;

    // Platz für globale Ableitungen,
    // aber NICHTs Reserves-spezifisches hier,
    // damit NPCs / Monster später nicht automatisch Pools kriegen.
  }

  _normalizeSystemStructure() {
    const source = (this._source.system ??= {});
    const nested = source.system;
    if (isRecord(nested)) {
      delete source.system;
      foundry.utils.mergeObject(source, foundry.utils.deepClone(nested), {
        insertKeys: true,
        overwrite: false
      });
    }

    const prepared = this.system;
    if (!prepared) return;

    if (isRecord(prepared.system)) {
      const preparedNested = prepared.system;
      for (const [key, value] of Object.entries(foundry.utils.deepClone(preparedNested))) {
        if (prepared[key] === undefined) {
          prepared[key] = value;
        }
      }
      if (Object.prototype.hasOwnProperty.call(prepared, "system")) {
        delete prepared.system;
      }
    }
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
