import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacterSheet } from "./actor/player-character-sheet.js";
import { NpcSheet } from "./actor/npc-sheet.js";
import { TriskelItemSheet } from "./item/triskel-item-sheet.js";
import {
  TRISKEL_CODEX,
  TRISKEL_CODEX_INDEX,
  TRISKEL_ITEM_CATEGORIES
} from "./codex/triskel-codex.js";
import { localizeCodexCollections } from "./codex/codex-localization.js";

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

  const itemTypes = TRISKEL_ITEM_CATEGORIES.map(category => category.id);

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
    const labelKey = TRISKEL_ITEM_CATEGORIES.find(category => category.id === type)?.label ?? "";

    return {
      ...labels,
      [type]: labelKey ? localize(labelKey) : type
    };
  }, CONFIG.Item.typeLabels ?? {});

  CONFIG.triskell = {
    ...(CONFIG.triskell ?? {}),
    codex: TRISKEL_CODEX,
    index: TRISKEL_CODEX_INDEX
  };

  localizeCodexCollections(CONFIG.triskell?.codex, CONFIG.triskell?.index, localize);
});

