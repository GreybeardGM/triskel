import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacterSheet } from "./actor/player-character-sheet.js";
import { NpcSheet } from "./actor/npc-sheet.js";
import { TriskelItemSheet } from "./item/triskel-item-sheet.js";
import { registerTriskelDiceSoNice, registerTriskelDiceTerm } from "./dice/triskel-die-term.js";
import { registerComplicationRollWidget } from "./ui/gm-complication-roll-widget.js";
import {
  TRISKEL_CODEX,
  TRISKEL_CODEX_INDEX,
  TRISKEL_ITEM_CATEGORIES
} from "./codex/triskel-codex.js";
import { localizeCodexCollections } from "./codex/codex-localization.js";

const itemTypes = TRISKEL_ITEM_CATEGORIES.map(category => category.id);
const itemTypeLabelMap = TRISKEL_ITEM_CATEGORIES.reduce((labels, category) => {
  labels[category.id] = category.label;
  return labels;
}, {});

const registerSheets = localize => {
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

  foundry.documents.collections.Items.registerSheet("triskel", TriskelItemSheet, {
    makeDefault: true,
    types: itemTypes,
    label: localize("TRISKEL.Misc.Sheet.Item")
  });
};

const setTypeLabels = localize => {
  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    character: localize("TRISKEL.Actor.Type.Character"),
    npc: localize("TRISKEL.Actor.Type.NPC")
  };

  const itemLabels = { ...(CONFIG.Item.typeLabels ?? {}) };

  for (const type of itemTypes) {
    const labelKey = itemTypeLabelMap[type] ?? "";
    itemLabels[type] = labelKey ? localize(labelKey) : type;
  }

  CONFIG.Item.typeLabels = itemLabels;
};

Hooks.once("init", function() {
  console.log("Triskel | Initializing Triskel system");

  // Klassen mit Typen verknüpfen
  CONFIG.Actor.documentClass = TriskelActor;
  CONFIG.Actor.sheetClasses.character = PlayerCharacterSheet;
  CONFIG.Actor.sheetClasses.npc = NpcSheet;

  CONFIG.triskell = {
    ...(CONFIG.triskell ?? {}),
    codex: TRISKEL_CODEX,
    index: TRISKEL_CODEX_INDEX
  };

  registerTriskelDiceTerm();
  registerComplicationRollWidget();

  Hooks.once("i18nInit", () => {
    const localize = game.i18n.localize.bind(game.i18n);

    registerSheets(localize);
    setTypeLabels(localize);

    localizeCodexCollections(CONFIG.triskell?.codex, CONFIG.triskell?.index, localize);
  });

});

Hooks.once("diceSoNiceReady", registerTriskelDiceSoNice);
