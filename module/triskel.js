import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacterSheet } from "./actor/player-character-sheet.js";
import { NpcSheet } from "./actor/npc-sheet.js";
import { TriskelItemSheet } from "./item/triskel-item-sheet.js";

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  const localize = game.i18n.localize.bind(game.i18n);

  // Klassen mit Typen verknüpfen
  CONFIG.Actor.documentClass = TriskelActor;
  CONFIG.Actor.sheetClasses.character = PlayerCharacterSheet;
  CONFIG.Actor.sheetClasses.npc = NpcSheet;

  // Sheets registrieren
  foundry.documents.collections.Actors.registerSheet("triskel", PlayerCharacterSheet, {
    makeDefault: true,
    types: ["character"],
    label: localize("TRISKEL.Sheets.PlayerCharacter")
  });

  foundry.documents.collections.Actors.registerSheet("triskel", NpcSheet, {
    makeDefault: true,
    types: ["npc"],
    label: localize("TRISKEL.Sheets.NPC")
  });

  foundry.documents.collections.Items.registerSheet("triskel", TriskelItemSheet, {
    makeDefault: true,
    types: ["held", "worn", "ability", "spell"],
    label: localize("TRISKEL.Sheets.Item")
  });

  // L<abens für Typen
  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    character: localize("TRISKEL.ActorTypes.Character"),
    npc: localize("TRISKEL.ActorTypes.NPC")
  };

  CONFIG.Item.typeLabels = {
    ...CONFIG.Item.typeLabels,
    held: localize("TRISKEL.ItemTypes.Held"),
    worn: localize("TRISKEL.ItemTypes.Worn"),
    ability: localize("TRISKEL.ItemTypes.Ability"),
    spell: localize("TRISKEL.ItemTypes.Spell")
  };
});
