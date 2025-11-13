import { TriskelActor } from "./actor/triskel-actor.js";

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  // Actor-Dokumentklasse setzen
  CONFIG.Actor.documentClass = TriskelActor;

  // Actor-Typen deklarieren (optional, aber sauber)
  CONFIG.Actor.typeLabels = {
    character: "Triskel Character"
  };
});
