import { TriskelActor } from "./actor/triskel-actor.js";
import { PlayerCharacterSheet } from "./actor/player-character-sheet.js";
import { NpcSheet } from "./actor/npc-sheet.js";
import { PartySheet } from "./actor/party-sheet.js";
import { TriskelItemSheet } from "./item/triskel-item-sheet.js";
import { CompanionSheet } from "./item/companion-sheet.js";
import { registerTriskelDiceSoNice, registerTriskelDiceTerm } from "./dice/triskel-die-term.js";
import { registerComplicationRollSettings, registerComplicationRollWidget } from "./ui/gm-complication-roll-widget.js";
import { registerDifficultyService } from "./difficulty/difficulty-service.js";
import { registerDifficultyWidget } from "./ui/difficulty-widget.js";
import { cleanupTriskelTokenBars, drawTriskelTokenBars } from "./token/token-bars.js";
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

function validateItemPlacement(actorType, itemType) {
  let warning;
  if (actorType === "party" && itemType !== "companion") {
    warning = "TRISKEL.Item.Placement.PartyCompanionsOnly";
  } else if (actorType === "character" && itemType === "companion") {
    warning = "TRISKEL.Item.Placement.CompanionBlockedForCharacter";
  }
  if (!warning) return true;

  ui.notifications.warn(game.i18n.localize(warning));
  return false;
}

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

  foundry.documents.collections.Actors.registerSheet("triskel", PartySheet, {
    makeDefault: true,
    types: ["party"],
    label: localize("TRISKEL.Actor.Type.Party")
  });

  foundry.documents.collections.Items.registerSheet("triskel", TriskelItemSheet, {
    makeDefault: true,
    types: itemTypes.filter(type => type !== "companion"),
    label: localize("TRISKEL.Misc.Sheet.Item")
  });

  foundry.documents.collections.Items.registerSheet("triskel", CompanionSheet, {
    makeDefault: true,
    types: ["companion"],
    label: localize("TRISKEL.Item.Type.Companion")
  });
};

const setTypeLabels = localize => {
  CONFIG.Actor.typeLabels = {
    ...CONFIG.Actor.typeLabels,
    character: localize("TRISKEL.Actor.Type.Character"),
    npc: localize("TRISKEL.Actor.Type.NPC"),
    party: localize("TRISKEL.Actor.Type.Party")
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
  CONFIG.Actor.sheetClasses.party = PartySheet;

  CONFIG.triskel = {
    ...(CONFIG.triskel ?? {}),
    codex: TRISKEL_CODEX,
    index: TRISKEL_CODEX_INDEX
  };

  registerTriskelDiceTerm();
  registerComplicationRollSettings();
  registerComplicationRollWidget();
  registerDifficultyService();
  registerDifficultyWidget();

  Hooks.on("preCreateItem", item => validateItemPlacement(item.actor?.type, item.type));
  Hooks.on("preUpdateItem", (item, changes) => {
    if (changes.type && changes.type !== item.type) return validateItemPlacement(item.actor?.type, changes.type);
  });
  Hooks.on("preCreateActor", actor => actor.items.every(item => validateItemPlacement(actor.type, item.type)));
  Hooks.on("preUpdateActor", (actor, changes) => {
    const actorType = changes.type ?? actor.type;
    if (Array.isArray(changes.items)) {
      return changes.items.every(item => validateItemPlacement(actorType, item.type ?? actor.items.get(item._id)?.type));
    }
    if (actorType !== actor.type) return actor.items.every(item => validateItemPlacement(actorType, item.type));
  });

  Hooks.once("i18nInit", () => {
    const localize = game.i18n.localize.bind(game.i18n);

    registerSheets(localize);
    setTypeLabels(localize);

    localizeCodexCollections(CONFIG.triskel?.codex, CONFIG.triskel?.index, localize);
  });

});

Hooks.once("diceSoNiceReady", registerTriskelDiceSoNice);

Hooks.on("refreshToken", token => drawTriskelTokenBars(token));
Hooks.on("drawToken", token => drawTriskelTokenBars(token));
Hooks.on("destroyToken", token => cleanupTriskelTokenBars(token));
