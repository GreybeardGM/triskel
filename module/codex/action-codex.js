// action-codex.js

export const TRISKEL_ACTION_TYPES = [
  {
    id: "position",
    label: "TRISKEL.Action.Type.Position.Label",
    description: "TRISKEL.Action.Type.Position.Description"
  },
  {
    id: "setup",
    label: "TRISKEL.Action.Type.Setup.Label",
    description: "TRISKEL.Action.Type.Setup.Description"
  },
  {
    id: "impact",
    label: "TRISKEL.Action.Type.Impact.Label",
    description: "TRISKEL.Action.Type.Impact.Description"
  },
  {
    id: "defense",
    label: "TRISKEL.Action.Type.Defense.Label",
    description: "TRISKEL.Action.Type.Defense.Description"
  }
];

export const TRISKEL_BASE_ACTIONS = [
  {
    id: "strike",
    label: "TRISKEL.Action.Base.Strike.Label",
    type: "impact",
    category: "combat",
    skill: "strike",
    reserve: "power",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.Action.Base.Strike.Description",
    image: "icons/skills/melee/strike-sword-steel-yellow.webp",
    keywords: ["action", "melee", "offense", "strike"]
  },
  {
    id: "bind",
    label: "TRISKEL.Action.Base.Bind.Label",
    type: "impact",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.Action.Base.Bind.Description",
    image: "icons/skills/melee/weapons-crossed-swords-black-gray.webp",
    keywords: ["action", "melee", "offense", "control", "bind"]
  },
  {
    id: "expose",
    label: "TRISKEL.Action.Base.Expose.Label",
    type: "impact",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.Action.Base.Expose.Description",
    image: "icons/skills/melee/shield-damaged-broken-blue.webp",
    keywords: ["action", "melee", "offense", "control", "expose"]
  },
  {
    id: "push",
    label: "TRISKEL.Action.Base.Push.Label",
    type: "impact",
    category: "combat",
    skill: "strike",
    reserve: "power",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.Action.Base.Push.Description",
    image: "icons/skills/melee/shield-block-bash-blue.webp",
    keywords: ["action", "melee", "offense", "control", "push"]
  },
  {
    id: "brace",
    label: "TRISKEL.Action.Base.Brace.Label",
    type: "defense",
    category: "combat",
    skill: "brace",
    reserve: "power",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Brace.Description",
    image: "icons/skills/melee/hand-grip-sword-white-brown.webp",
    keywords: ["defense", "melee", "brace", "resilience"]
  },
  {
    id: "guard",
    label: "TRISKEL.Action.Base.Guard.Label",
    type: "defense",
    category: "combat",
    skill: "guard",
    reserve: "grace",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Guard.Description",
    image: "icons/skills/melee/swords-parry-block-blue.webp",
    keywords: ["defense", "melee", "guard", "protection"]
  },
  {
    id: "evade",
    label: "TRISKEL.Action.Base.Evade.Label",
    type: "defense",
    category: "combat",
    skill: "evasion",
    reserve: "grace",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Evade.Description",
    image: "icons/skills/movement/figure-running-gray.webp",
    keywords: ["defense", "evasion"]
  },
  {
    id: "grapple",
    label: "TRISKEL.Action.Base.Grapple.Label",
    type: "impact",
    category: "combat",
    skill: "control",
    reserve: "power",
    cost: 0,
    range: "hand",
    description: "TRISKEL.Action.Base.Grapple.Description",
    image: "icons/skills/melee/unarmed-punch-fist.webp",
    keywords: ["action", "melee", "offense", "control", "grapple"]
  },
  {
    id: "break",
    label: "TRISKEL.Action.Base.Break.Label",
    type: "impact",
    category: "combat",
    skill: "brace",
    reserve: "power",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Break.Description",
    image: "icons/skills/movement/arrow-upward-yellow.webp",
    keywords: ["action", "melee", "offense", "brace", "break"]
  },
  {
    id: "grit",
    label: "TRISKEL.Action.Base.Grit.Label",
    type: "defense",
    category: "combat",
    skill: "grit",
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Grit.Description",
    keywords: ["defense", "resilience", "grit"]
  },
  {
    id: "snap",
    label: "TRISKEL.Action.Base.Snap.Label",
    type: "defense",
    category: "combat",
    skill: "snap",
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Snap.Description",
    keywords: ["defense", "reflex", "snap"]
  },
  {
    id: "resolve",
    label: "TRISKEL.Action.Base.Resolve.Label",
    type: "defense",
    category: "combat",
    skill: "resolve",
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Resolve.Description",
    keywords: ["defense", "will", "resolve"]
  },
  {
    id: "invocation",
    label: "TRISKEL.Action.Base.Invocation.Label",
    type: "setup",
    category: "combat",
    skill: null,
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Invocation.Description",
    keywords: ["setup", "magic", "invocation"]
  },
  {
    id: "switchgear",
    label: "TRISKEL.Action.Base.Switchgear.Label",
    type: "setup",
    category: "combat",
    skill: null,
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Switchgear.Description",
    keywords: ["setup", "equipment", "inventory", "switchgear"]
  },
  {
    id: "move",
    label: "TRISKEL.Action.Base.Move.Label",
    type: "position",
    category: "combat",
    skill: null,
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Move.Description",
    keywords: ["position", "movement", "maneuver", "move"]
  },
  {
    id: "takeCover",
    label: "TRISKEL.Action.Base.TakeCover.Label",
    type: "position",
    category: "combat",
    skill: null,
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.TakeCover.Description",
    keywords: ["position", "defense", "cover", "take cover"]
  }
];

export const TRISKEL_ADVANCED_ACTIONS = [
  {
    id: "shoot",
    label: "TRISKEL.Action.Advanced.Shoot.Label",
    type: "impact",
    category: "combat",
    skill: "aim",
    reserve: "grace",
    cost: 0,
    range: "ranged_weapon",
    description: "TRISKEL.Action.Advanced.Shoot.Description",
    keywords: ["action", "ranged", "offense", "aim", "shoot"]
  },
  {
    id: "throw",
    label: "TRISKEL.Action.Advanced.Throw.Label",
    type: "impact",
    category: "combat",
    skill: "aim",
    reserve: "power",
    cost: 0,
    range: "ranged_weapon",
    description: "TRISKEL.Action.Advanced.Throw.Description",
    keywords: ["action", "ranged", "offense", "aim", "throw"]
  },
  {
    id: "loadArrow",
    label: "TRISKEL.Action.Advanced.LoadArrow.Label",
    type: "setup",
    category: "combat",
    skill: null,
    reserve: null,
    cost: 0,
    range: "ranged_weapon",
    description: "TRISKEL.Action.Advanced.LoadArrow.Description",
    keywords: ["setup", "ranged", "archery", "load"]
  },
  {
    id: "raiseShield",
    label: "TRISKEL.Action.Advanced.RaiseShield.Label",
    type: "setup",
    category: "combat",
    skill: null,
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Advanced.RaiseShield.Description",
    keywords: ["setup", "defense", "shield"]
  },
  {
    id: "quickLoad",
    label: "TRISKEL.Action.Advanced.QuickLoad.Label",
    type: "setup",
    category: "combat",
    skill: null,
    reserve: null,
    cost: 0,
    range: "ranged_weapon",
    description: "TRISKEL.Action.Advanced.QuickLoad.Description",
    keywords: ["setup", "ranged", "crossbow", "load"]
  }
];

export const TRISKEL_SPELLS = [
  {
    id: "arc",
    label: "TRISKEL.Action.Spell.Arc.Label",
    type: "impact",
    category: "spell",
    skill: "manifest",
    reserve: "will",
    cost: 1,
    range: "near",
    description: "TRISKEL.Action.Spell.Arc.Description",
    keywords: ["spell", "arcane", "action", "manifestation", "lightning"]
  },
  {
    id: "glue",
    label: "TRISKEL.Action.Spell.Glue.Label",
    type: "impact",
    category: "spell",
    skill: "manifest",
    reserve: "will",
    cost: 3,
    range: "near",
    description: "TRISKEL.Action.Spell.Glue.Description",
    keywords: ["spell", "arcane", "action", "manifestation"]
  },
  {
    id: "rebukeEvil",
    label: "TRISKEL.Action.Spell.RebukeEvil.Label",
    type: "impact",
    category: "spell",
    skill: "transpose",
    reserve: "will",
    cost: 3,
    range: "self",
    description: "TRISKEL.Action.Spell.RebukeEvil.Description",
    keywords: ["spell", "divine", "action", "transposition"]
  },
  {
    id: "protectivePrayer",
    label: "TRISKEL.Action.Spell.ProtectivePrayer.Label",
    type: "setup",
    category: "spell",
    reserve: "will",
    cost: 2,
    range: "near",
    description: "TRISKEL.Action.Spell.ProtectivePrayer.Description",
    keywords: ["spell", "divine", "setup", "warding"]
  }
];

export const TRISKEL_ALL_ACTIONS = [
  ...TRISKEL_BASE_ACTIONS,
  ...TRISKEL_ADVANCED_ACTIONS,
  ...TRISKEL_SPELLS
];
