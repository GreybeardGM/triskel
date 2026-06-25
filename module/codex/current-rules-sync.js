const mergeDeep = (target, source) => {
  if (!target || !source) return target;

  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] ??= {};
      mergeDeep(target[key], value);
      return;
    }

    target[key] = value;
  });

  return target;
};

const LOCALIZATION_PATCHES = {
  en: {
    TRISKEL: {
      Action: {
        Base: {
          Focus: {
            Description: "Convert the entire current Favour pool through Virtue. The conversion is limited by Virtue; its concrete effect is not yet final."
          },
          Unleash: {
            Description: "Convert the entire current Favour pool through Reverence. The conversion is limited by Reverence; its concrete effect is not yet final."
          }
        },
        Spell: {
          Arc: {
            Description: "Strike a target with a short arc of energy. The target resists with Snap.\nScaling: [1] Impaired +1; [4] Damage +1"
          },
          Glue: {
            Description: "Create a small area of adhesive fluid.\nScaling: [1] Impaired 1; [3] Pinned; [5] Grabbed"
          },
          ProtectivePrayer: {
            Description: "Grant an ally Fortified for one round. Each point of Will spent increases Fortified by 1, up to your Tier."
          },
          RebukeEvil: {
            Description: "Instills dread in all nearby beings with evil intent.\nScaling: [0] Frightened 1 +1/2"
          }
        }
      },
      StatusEffect: {
        Impaired: {
          Description: "The target takes a penalty to all Action Rolls. Grit, Snap, and Resolve are unaffected."
        },
        Exposed: {
          Description: "The target takes a penalty to Guard and Evade."
        },
        Bound: {
          Description: "The target takes a penalty to Strike and Guard."
        },
        Pushed: {
          Description: "The target takes a penalty to Brace and Guard."
        },
        Frightened: {
          Description: "The target takes a penalty to Strike and Control."
        },
        Pinned: {
          Description: "The target cannot take Position actions. This prevents regular movement, taking cover, intercepting, and similar positioning maneuvers. The target can still move by spending another action; Secure Passage remains available because it is an Impact action."
        },
        Grabbed: {
          Description: "The target cannot take Position actions or use any other form of its own movement or positioning."
        },
        Fortified: {
          Description: "The target gains a bonus to Brace, Guard, and Evade."
        }
      },
      Form: {
        Deny: {
          Description: "On a successful Guard, the first success applies Bound 1."
        },
        Intercept: {
          Description: "On a successful Guard, the first success applies Bound 1."
        }
      }
    }
  },
  de: {
    TRISKEL: {
      Action: {
        Base: {
          Focus: {
            Description: "Wandle den gesamten aktuellen Favour-Vorrat über Tugend um. Die daraus entstehende Konvertierung ist durch Tugend begrenzt; ihr konkreter Effekt ist noch nicht final."
          },
          Unleash: {
            Description: "Wandle den gesamten aktuellen Favour-Vorrat über Ehrfurcht um. Die daraus entstehende Konvertierung ist durch Ehrfurcht begrenzt; ihr konkreter Effekt ist noch nicht final."
          }
        },
        Spell: {
          Arc: {
            Description: "Triff ein Ziel mit einem kurzen Lichtbogen. Das Ziel widersteht mit Reflex.\nSkalierung: [1] Beeinträchtigt +1; [4] Schaden +1"
          },
          Glue: {
            Description: "Erzeuge einen kleinen Bereich aus haftender Flüssigkeit.\nSkalierung: [1] Beeinträchtigt 1; [3] Festgesetzt; [5] Fixiert"
          },
          ProtectivePrayer: {
            Description: "Verleihe einem Verbündeten für eine Runde Gefestigt. Jeder ausgegebene Punkt Willenskraft erhöht Gefestigt um 1, bis zu deinem Tier."
          },
          RebukeEvil: {
            Description: "Versetzt alle Wesen mit bösen Absichten in der Nähe in Furcht.\nSkalierung: [0] Verängstigt 1 +1/2"
          }
        }
      },
      StatusEffect: {
        Impaired: {
          Description: "Das Ziel erleidet einen Malus auf alle Aktionswürfe. Zähigkeit, Reflex und Willenskraft bleiben unverändert."
        },
        Exposed: {
          Description: "Das Ziel erleidet einen Malus auf Parade und Ausweichen."
        },
        Bound: {
          Description: "Das Ziel erleidet einen Malus auf Schlag und Parade."
        },
        Pushed: {
          Description: "Das Ziel erleidet einen Malus auf Standhalten und Parade."
        },
        Frightened: {
          Description: "Das Ziel erleidet einen Malus auf Schlag und Kontrolle."
        },
        Pinned: {
          Description: "Das Ziel kann keine Positionsaktion ausführen. Dadurch entfallen reguläre Bewegung, Deckung, Abfangen und vergleichbare Positionsmanöver. Durch eine andere Aktion kann es sich weiterhin bewegen; Weg sichern bleibt möglich, weil es eine Wirkungsaktion ist."
        },
        Grabbed: {
          Description: "Das Ziel kann weder Positionsaktionen noch irgendeine andere Form eigener Bewegung oder Positionierung nutzen."
        },
        Fortified: {
          Description: "Das Ziel erhält einen Bonus auf Standhalten, Parade und Ausweichen."
        }
      },
      Form: {
        Deny: {
          Description: "Bei einer erfolgreichen Parade verursacht der erste Erfolg Gebunden 1."
        },
        Intercept: {
          Description: "Bei einer erfolgreichen Parade verursacht der erste Erfolg Gebunden 1."
        }
      }
    }
  }
};

export const applyCurrentRulesCodex = (codex = {}, index = {}) => {
  const tiers = Array.isArray(codex?.tiers) ? codex.tiers : [];
  const paragonIndex = tiers.findIndex(tier => tier?.id === "paragon");
  if (paragonIndex >= 0) tiers.splice(paragonIndex, 1);
  delete index?.tiers?.paragon;
};

export const applyCurrentRulesLocalization = (lang = "en", translations = {}) => {
  const patch = LOCALIZATION_PATCHES[lang] ?? LOCALIZATION_PATCHES.en;
  return mergeDeep(translations, patch);
};
