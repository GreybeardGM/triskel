import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacterSheet } from "./actor/sheets/player-character-sheet.js";

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  // Actor-Dokumentklasse setzen
  CONFIG.Actor.documentClass = TriskelActor;

  Actors.registerSheet("triskel", PlayerCharacterSheet, {
    makeDefault: true,
    types: ["character"]
  });

  // Actor-Typen deklarieren (optional, aber sauber)
  CONFIG.Actor.typeLabels = {
    character: "Triskel Character"
  };
});
