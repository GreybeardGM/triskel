// action-codex.js

export const TRISKEL_BASE_ACTIONS = [
  {
    key: "strike",
    label: "TRISKEL.BaseActions.Strike.Label",
    type: "action",
    category: "combat",
    skill: "strike",
    reserve: "power",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.BaseActions.Strike.Description",
    image: "icons/skills/melee/strike-sword-steel-yellow.webp",
    keywords: ["action", "melee", "offense", "strike"]
  },
  {
    key: "bind",
    label: "TRISKEL.BaseActions.Bind.Label",
    type: "action",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.BaseActions.Bind.Description",
    image: "icons/skills/melee/weapons-crossed-swords-black-gray.webp",
    keywords: ["action", "melee", "offense", "control", "bind"]
  },
  {
    key: "expose",
    label: "TRISKEL.BaseActions.Expose.Label",
    type: "action",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.BaseActions.Expose.Description",
    image: "icons/skills/melee/shield-damaged-broken-blue.webp",
    keywords: ["action", "melee", "offense", "control", "expose"]
  },
  {
    key: "push",
    label: "TRISKEL.BaseActions.Push.Label",
    type: "action",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    range: "melee_weapon",
    description: "TRISKEL.BaseActions.Push.Description",
    image: "icons/skills/melee/shield-block-bash-blue.webp",
    keywords: ["action", "melee", "offense", "control", "push"]
  },
  {
    key: "brace",
    label: "TRISKEL.BaseActions.Brace.Label",
    type: "reaction",
    category: "combat",
    skill: "brace",
    reserve: "power",
    cost: 0,
    range: "self",
    description: "TRISKEL.BaseActions.Brace.Description",
    image: "icons/skills/melee/hand-grip-sword-white-brown.webp",
    keywords: ["reaction", "melee", "defense", "brace", "resilience"]
  },
  {
    key: "guard",
    label: "TRISKEL.BaseActions.Guard.Label",
    type: "reaction",
    category: "combat",
    skill: "guard",
    reserve: "grace",
    cost: 0,
    range: "self",
    description: "TRISKEL.BaseActions.Guard.Description",
    image: "icons/skills/melee/swords-parry-block-blue.webp",
    keywords: ["reaction", "melee", "defense", "guard", "protection"]
  },
  {
    key: "evade",
    label: "TRISKEL.BaseActions.Evade.Label",
    type: "reaction",
    category: "combat",
    skill: "evasion",
    reserve: "grace",
    cost: 0,
    range: "self",
    description: "TRISKEL.BaseActions.Evade.Description",
    image: "icons/skills/movement/figure-running-gray.webp",
    keywords: ["reaction", "defense", "evasion"]
  },
  {
    key: "grapple",
    label: "TRISKEL.BaseActions.Grapple.Label",
    type: "action",
    category: "combat",
    skill: "control",
    reserve: "power",
    cost: 0,
    range: "hand",
    description: "TRISKEL.BaseActions.Grapple.Description",
    image: "icons/skills/melee/unarmed-punch-fist.webp",
    keywords: ["action", "melee", "offense", "control", "grapple"]
  },
  {
    key: "break",
    label: "TRISKEL.BaseActions.Break.Label",
    type: "action",
    category: "combat",
    skill: "brace",
    reserve: "power",
    cost: 0,
    range: "self",
    description: "TRISKEL.BaseActions.Break.Description",
    image: "icons/skills/movement/arrow-upward-yellow.webp",
    keywords: ["action", "melee", "offense", "brace", "break"]
  }
];

export const TRISKEL_ADVANCED_ACTIONS = [
  {
    key: "shoot",
    label: "TRISKEL.AdvancedActions.Shoot.Label",
    type: "action",
    category: "combat",
    skill: "aim",
    reserve: "grace",
    cost: 0,
    range: "ranged_weapon",
    description: "TRISKEL.AdvancedActions.Shoot.Description",
    keywords: ["action", "ranged", "offense", "aim", "shoot"]
  },
  {
    key: "throw",
    label: "TRISKEL.AdvancedActions.Throw.Label",
    type: "action",
    category: "combat",
    skill: "aim",
    reserve: "power",
    cost: 0,
    range: "ranged_weapon",
    description: "TRISKEL.AdvancedActions.Throw.Description",
    keywords: ["action", "ranged", "offense", "aim", "throw"]
  }
];

export const TRISKEL_SPELLS = [
  {
    key: "arc",
    label: "TRISKEL.Spells.Arc.Label",
    type: "action",
    category: "spell",
    skill: "manifest",
    reserve: "will",
    cost: 1,
    range: "near",
    description: "TRISKEL.Spells.Arc.Description",
    keywords: ["spell", "arcane", "action", "manifestation", "lightning"]
  },
  {
    key: "glue",
    label: "TRISKEL.Spells.Glue.Label",
    type: "action",
    category: "spell",
    skill: "manifest",
    reserve: "will",
    cost: 3,
    range: "near",
    description: "TRISKEL.Spells.Glue.Description",
    keywords: ["spell", "arcane", "action", "manifestation"]
  },
  {
    key: "rebukeEvil",
    label: "TRISKEL.Spells.RebukeEvil.Label",
    type: "action",
    category: "spell",
    skill: "transpose",
    reserve: "will",
    cost: 3,
    range: "self",
    description: "TRISKEL.Spells.RebukeEvil.Description",
    keywords: ["spell", "divine", "action", "transposition"]
  },
  {
    key: "protectivePrayer",
    label: "TRISKEL.Spells.ProtectivePrayer.Label",
    type: "reaction",
    category: "spell",
    skill: "ward",
    reserve: "will",
    cost: 2,
    range: "near",
    description: "TRISKEL.Spells.ProtectivePrayer.Description",
    keywords: ["spell", "divine", "reaction", "warding"]
  }
];

export const TRISKEL_ALL_ACTIONS = [
  ...TRISKEL_BASE_ACTIONS,
  ...TRISKEL_ADVANCED_ACTIONS,
  ...TRISKEL_SPELLS
];
