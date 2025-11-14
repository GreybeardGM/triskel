export class TriskelActor extends Actor {
  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
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
}
