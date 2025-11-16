import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacterSheet } from "./actor/player-character-sheet.js";

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  // Klassen mit Typen verknüpfen
  CONFIG.Actor.documentClass = TriskelActor;
  CONFIG.Actor.sheetClasses.character = PlayerCharacterSheet;

  // Sheets registrieren
  Actors.registerSheet("triskel", PlayerCharacterSheet, {
    makeDefault: true,
    types: ["character"],
    label: "Player Character"
  });

  // L<abens für Typen
  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    character: "Player Character"
  };
});
