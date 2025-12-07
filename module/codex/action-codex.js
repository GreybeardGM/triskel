// action-codex.js

export const TRISKEL_BASE_ACTIONS = [
  {
    key: "strike",
    label: "TRISKEL.BaseActions.Strike.Label",
    category: "combat",
    skill: "strike",
    reserve: "power",
    cost: 0,
    description: "TRISKEL.BaseActions.Strike.Description",
    image: "icons/skills/melee/strike-sword-steel-yellow.webp",
    keywords: ["action", "melee", "offense", "strike"]
  },
  {
    key: "bind",
    label: "TRISKEL.BaseActions.Bind.Label",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    description: "TRISKEL.BaseActions.Bind.Description",
    image: "icons/skills/melee/weapons-crossed-swords-black-gray.webp",
    keywords: ["action", "melee", "offense", "control", "bind"]
  },
  {
    key: "expose",
    label: "TRISKEL.BaseActions.Expose.Label",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    description: "TRISKEL.BaseActions.Expose.Description",
    image: "icons/skills/melee/shield-damaged-broken-blue.webp",
    keywords: ["action", "melee", "offense", "control", "expose"]
  },
  {
    key: "push",
    label: "TRISKEL.BaseActions.Push.Label",
    category: "combat",
    skill: "control",
    reserve: "grace",
    cost: 0,
    description: "TRISKEL.BaseActions.Push.Description",
    image: "icons/skills/melee/shield-block-bash-blue.webp",
    keywords: ["action", "melee", "offense", "control", "push"]
  },
  {
    key: "brace",
    label: "TRISKEL.BaseActions.Brace.Label",
    category: "combat",
    skill: "brace",
    reserve: "power",
    cost: 0,
    description: "TRISKEL.BaseActions.Brace.Description",
    image: "icons/skills/melee/hand-grip-sword-white-brown.webp",
    keywords: ["action", "melee", "defense", "brace", "resilience"]
  },
  {
    key: "guard",
    label: "TRISKEL.BaseActions.Guard.Label",
    category: "combat",
    skill: "guard",
    reserve: "grace",
    cost: 0,
    description: "TRISKEL.BaseActions.Guard.Description",
    image: "icons/skills/melee/swords-parry-block-blue.webp",
    keywords: ["action", "melee", "defense", "guard", "protection"]
  },
  {
    key: "evade",
    label: "TRISKEL.BaseActions.Evade.Label",
    category: "combat",
    skill: "evasion",
    reserve: "grace",
    cost: 0,
    description: "TRISKEL.BaseActions.Evade.Description",
    image: "icons/skills/movement/figure-running-gray.webp",
    keywords: ["reaction", "defense", "evasion"]
  },
  {
    key: "grapple",
    label: "TRISKEL.BaseActions.Grapple.Label",
    category: "combat",
    skill: "control",
    reserve: "power",
    cost: 0,
    description: "TRISKEL.BaseActions.Grapple.Description",
    image: "icons/skills/melee/unarmed-punch-fist.webp",
    keywords: ["action", "melee", "offense", "control", "grapple"]
  },
  {
    key: "break",
    label: "TRISKEL.BaseActions.Break.Label",
    category: "combat",
    skill: "brace",
    reserve: "power",
    cost: 0,
    description: "TRISKEL.BaseActions.Break.Description",
    image: "icons/skills/movement/arrow-upward-yellow.webp",
    keywords: ["action", "melee", "offense", "brace", "break"]
  }
];

export const TRISKEL_ADVANCED_ACTIONS = [
  {
    key: "quickShot",
    label: "TRISKEL.AdvancedActions.QuickShot.Label",
    category: "advanced",
    skill: "aim",
    reserve: "grace",
    cost: 0,
    description: "TRISKEL.AdvancedActions.QuickShot.Description",
    keywords: ["action", "ranged", "offense", "aim", "quick shot"]
  },
  {
    key: "crossBowShot",
    label: "TRISKEL.AdvancedActions.CrossBowShot.Label",
    category: "advanced",
    skill: "aim",
    reserve: "power",
    cost: 0,
    description: "TRISKEL.AdvancedActions.CrossBowShot.Description",
    keywords: ["action", "ranged", "offense", "aim", "crossbow"]
  }
];

export const TRISKEL_SPELLS = [
  {
    key: "arc",
    label: "TRISKEL.Spells.Arc.Label",
    category: "spell",
    skill: "manifest",
    reserve: "will",
    cost: 1,
    description: "TRISKEL.Spells.Arc.Description",
    keywords: ["spell", "arcane", "action", "manifestation", "lightning"]
  }
];

export const TRISKEL_ALL_ACTIONS = [
  ...TRISKEL_BASE_ACTIONS,
  ...TRISKEL_ADVANCED_ACTIONS,
  ...TRISKEL_SPELLS
];
