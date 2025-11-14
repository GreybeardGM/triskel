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

Hooks.once("ready", async function() {
  if (!game.user.isGM) return;

  const updates = [];
  for (const actor of game.actors.contents) {
    const sourceSystem = actor._source?.system;
    const nested = sourceSystem?.system;
    if (!foundry.utils.isObject(nested)) continue;

    const flattened = foundry.utils.deepClone(sourceSystem ?? {});
    delete flattened.system;
    foundry.utils.mergeObject(flattened, nested, { insertKeys: true, overwrite: true });

    updates.push(actor.update({
      system: flattened,
      "-=system.system": null
    }, { diff: false }));
  }

  if (updates.length) await Promise.allSettled(updates);
});
