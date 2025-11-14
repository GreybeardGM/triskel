import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacter } from "./actor/player-character.js";
import { PlayerCharacterSheet } from "./actor/sheets/player-character-sheet.js";

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  CONFIG.Actor.documentClass = TriskelActor;
  CONFIG.Actor.typeClasses ??= {};
  CONFIG.Actor.typeClasses.character = PlayerCharacter;

  Actors.registerSheet("triskel", PlayerCharacterSheet, {
    makeDefault: true,
    types: ["character"],
    sheetClass: foundry.applications.sheets.ActorSheetV2,
    label: "Triskel Player Character"
  });

  CONFIG.Actor.typeLabels = {
    character: "Player Character"
  };
});

