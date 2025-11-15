import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacter } from "./actor/player-character.js";
import { PlayerCharacterSheet } from "./actor/sheets/player-character-sheet.js";

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  CONFIG.Actor.documentClass = TriskelActor;

  Actors.registerSheet("triskel", PlayerCharacterSheet, {
    makeDefault: true,
    types: ["character"],
    label: "Player Character"
  });

  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    character: "Player Character"
  };
});

