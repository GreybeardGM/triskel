import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacter } from "./actor/player-character.js";
import { PlayerCharacterSheet } from "./actor/sheets/player-character-sheet.js";
import { TriskelActorDataModel } from "./actor/data/triskel-actor-data.js";
import { PlayerCharacterDataModel } from "./actor/data/player-character-data.js";

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  CONFIG.Actor.documentClass = TriskelActor;
  CONFIG.Actor.typeClasses ??= {};
  CONFIG.Actor.typeClasses.character = PlayerCharacter;
  CONFIG.Actor.typeClasses.npc ??= TriskelActor;

  CONFIG.Actor.dataModels ??= {};
  CONFIG.Actor.dataModels.base ??= TriskelActorDataModel;
  CONFIG.Actor.dataModels.character = PlayerCharacterDataModel;
  CONFIG.Actor.dataModels.npc ??= TriskelActorDataModel;

  Actors.registerSheet("triskel", PlayerCharacterSheet, {
    makeDefault: true,
    types: ["character"],
    sheetClass: foundry.applications.sheets.ActorSheetV2,
    label: "Player Character"
  });

  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    character: "Player Character"
  };
});

