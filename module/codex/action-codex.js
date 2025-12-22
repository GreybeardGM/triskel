// action-codex.js

export const TRISKEL_ACTION_TYPES = [
  {
    id: "position",
    label: "TRISKEL.Action.Type.Position.Label",
    description: "TRISKEL.Action.Type.Position.Description",
    category: "combat_phase",
    sort: 1
  },
  {
    id: "setup",
    label: "TRISKEL.Action.Type.Setup.Label",
    description: "TRISKEL.Action.Type.Setup.Description",
    category: "combat_phase",
    sort: 2
  },
  {
    id: "impact",
    label: "TRISKEL.Action.Type.Impact.Label",
    description: "TRISKEL.Action.Type.Impact.Description",
    category: "combat_phase",
    sort: 3
  },
  {
    id: "defense",
    label: "TRISKEL.Action.Type.Defense.Label",
    description: "TRISKEL.Action.Type.Defense.Description",
    category: "combat_phase",
    sort: 4
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
    icon: "fa-solid fa-swords",
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
    icon: "fa-solid fa-link",
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
    icon: "fa-solid fa-shield-halved",
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
    icon: "fa-solid fa-people-pulling",
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
    icon: "fa-solid fa-hand-fist",
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
    icon: "fa-solid fa-user-shield",
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
    icon: "fa-solid fa-person-running",
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
    icon: "fa-solid fa-hand-holding-hand",
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
    icon: "fa-solid fa-burst",
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
    icon: "fa-solid fa-shield-heart",
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
    icon: "fa-solid fa-bolt",
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
    icon: "fa-solid fa-brain",
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
    icon: "fa-solid fa-wand-sparkles",
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
    icon: "fa-solid fa-screwdriver-wrench",
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
    icon: "fa-solid fa-person-walking",
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
    icon: "fa-solid fa-shield",
    keywords: ["position", "defense", "cover", "take cover"]
  },
  {
    id: "traverseHazard",
    label: "TRISKEL.Action.Base.TraverseHazard.Label",
    type: "position",
    category: "combat",
    skill: "athletics",
    reserve: "grace",
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.TraverseHazard.Description",
    icon: "fa-solid fa-person-hiking",
    keywords: ["position", "movement", "athletics", "hazard", "traverse"]
  },
  {
    id: "securePassage",
    label: "TRISKEL.Action.Base.SecurePassage.Label",
    type: "impact",
    category: "combat",
    skill: null,
    reserve: null,
    cost: 0,
    range: "self",
    description: "TRISKEL.Action.Base.SecurePassage.Description",
    icon: "fa-solid fa-route",
    keywords: ["action", "support", "passage", "secure"]
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
    skill: "compel",
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
