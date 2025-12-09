// action-codex.js

export const TRISKEL_BASE_ACTIONS = [
  {
    key: "strike",
    label: "TRISKEL.Action.Base.Strike.Label",
    type: "action",
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
    key: "bind",
    label: "TRISKEL.Action.Base.Bind.Label",
    type: "action",
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
    key: "expose",
    label: "TRISKEL.Action.Base.Expose.Label",
    type: "action",
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
    key: "push",
    label: "TRISKEL.Action.Base.Push.Label",
    type: "action",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.Action.Base.Push.Description",
    image: "icons/skills/melee/shield-block-bash-blue.webp",
    keywords: ["action", "melee", "offense", "control", "push"]
  },
  {
    key: "brace",
    label: "TRISKEL.Action.Base.Brace.Label",
    type: "reaction",
    category: "combat",
    skill: "brace",
    reserve: "power",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Brace.Description",
    image: "icons/skills/melee/hand-grip-sword-white-brown.webp",
    keywords: ["reaction", "melee", "defense", "brace", "resilience"]
  },
  {
    key: "guard",
    label: "TRISKEL.Action.Base.Guard.Label",
    type: "reaction",
    category: "combat",
    skill: "guard",
    reserve: "grace",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Guard.Description",
    image: "icons/skills/melee/swords-parry-block-blue.webp",
    keywords: ["reaction", "melee", "defense", "guard", "protection"]
  },
  {
    key: "evade",
    label: "TRISKEL.Action.Base.Evade.Label",
    type: "reaction",
    category: "combat",
    skill: "evasion",
    reserve: "grace",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Evade.Description",
    image: "icons/skills/movement/figure-running-gray.webp",
    keywords: ["reaction", "defense", "evasion"]
  },
  {
    key: "grapple",
    label: "TRISKEL.Action.Base.Grapple.Label",
    type: "action",
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
    key: "break",
    label: "TRISKEL.Action.Base.Break.Label",
    type: "action",
    category: "combat",
    skill: "brace",
    reserve: "power",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.Break.Description",
    image: "icons/skills/movement/arrow-upward-yellow.webp",
    keywords: ["action", "melee", "offense", "brace", "break"]
  }
];

export const TRISKEL_ADVANCED_ACTIONS = [
  {
    key: "shoot",
    label: "TRISKEL.Action.Advanced.Shoot.Label",
    type: "action",
    category: "combat",
    skill: "aim",
    reserve: "grace",
    cost: 0,
    range: "ranged_weapon",
    description: "TRISKEL.Action.Advanced.Shoot.Description",
    keywords: ["action", "ranged", "offense", "aim", "shoot"]
  },
  {
    key: "throw",
    label: "TRISKEL.Action.Advanced.Throw.Label",
    type: "action",
    category: "combat",
    skill: "aim",
    reserve: "power",
    cost: 0,
    range: "ranged_weapon",
    description: "TRISKEL.Action.Advanced.Throw.Description",
    keywords: ["action", "ranged", "offense", "aim", "throw"]
  }
];

export const TRISKEL_SPELLS = [
  {
    key: "arc",
    label: "TRISKEL.Action.Spell.Arc.Label",
    type: "action",
    category: "spell",
    skill: "manifest",
    reserve: "will",
    cost: 1,
    range: "near",
    description: "TRISKEL.Action.Spell.Arc.Description",
    keywords: ["spell", "arcane", "action", "manifestation", "lightning"]
  },
  {
    key: "glue",
    label: "TRISKEL.Action.Spell.Glue.Label",
    type: "action",
    category: "spell",
    skill: "manifest",
    reserve: "will",
    cost: 3,
    range: "near",
    description: "TRISKEL.Action.Spell.Glue.Description",
    keywords: ["spell", "arcane", "action", "manifestation"]
  },
  {
    key: "rebukeEvil",
    label: "TRISKEL.Action.Spell.RebukeEvil.Label",
    type: "action",
    category: "spell",
    skill: "transpose",
    reserve: "will",
    cost: 3,
    range: "self",
    description: "TRISKEL.Action.Spell.RebukeEvil.Description",
    keywords: ["spell", "divine", "action", "transposition"]
  },
  {
    key: "protectivePrayer",
    label: "TRISKEL.Action.Spell.ProtectivePrayer.Label",
    type: "reaction",
    category: "spell",
    skill: "ward",
    reserve: "will",
    cost: 2,
    range: "near",
    description: "TRISKEL.Action.Spell.ProtectivePrayer.Description",
    keywords: ["spell", "divine", "reaction", "warding"]
  }
];

export const TRISKEL_ALL_ACTIONS = [
  ...TRISKEL_BASE_ACTIONS,
  ...TRISKEL_ADVANCED_ACTIONS,
  ...TRISKEL_SPELLS
];
