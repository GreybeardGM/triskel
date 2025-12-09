import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacterSheet } from "./actor/player-character-sheet.js";
import { NpcSheet } from "./actor/npc-sheet.js";
import { TriskelItemSheet } from "./item/triskel-item-sheet.js";
import { ITEM_CATEGORY_CONFIG } from "./codex/triskel-codex.js";

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
    label: localize("TRISKEL.Misc.Sheet.PlayerCharacter")
  });

  foundry.documents.collections.Actors.registerSheet("triskel", NpcSheet, {
    makeDefault: true,
    types: ["npc"],
    label: localize("TRISKEL.Misc.Sheet.NPC")
  });

  const itemTypes = Object.keys(ITEM_CATEGORY_CONFIG);

  foundry.documents.collections.Items.registerSheet("triskel", TriskelItemSheet, {
    makeDefault: true,
    types: itemTypes,
    label: localize("TRISKEL.Misc.Sheet.Item")
  });

  // L<abens für Typen
  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    character: localize("TRISKEL.Actor.Type.Character"),
    npc: localize("TRISKEL.Actor.Type.NPC")
  };

  CONFIG.Item.typeLabels = itemTypes.reduce((labels, type) => {
    const labelKey = ITEM_CATEGORY_CONFIG[type]?.itemLabelKey ?? "";

    return {
      ...labels,
      [type]: labelKey ? localize(labelKey) : type
    };
  }, CONFIG.Item.typeLabels ?? {});
});
