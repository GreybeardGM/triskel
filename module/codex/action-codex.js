// action-codex.js

export const TRISKEL_BASE_ACTIONS = [
  {
    key: "strike",
    label: "TRISKEL.BaseActions.Strike.Label",
    category: "combat",
    skill: "strike",
    reserve: "power",
    description: "TRISKEL.BaseActions.Strike.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  },
  {
    key: "bind",
    label: "TRISKEL.BaseActions.Bind.Label",
    category: "combat",
    skill: "control",
    reserve: "grace",
    description: "TRISKEL.BaseActions.Bind.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  },
  {
    key: "expose",
    label: "TRISKEL.BaseActions.Expose.Label",
    category: "combat",
    skill: "control",
    reserve: "grace",
    description: "TRISKEL.BaseActions.Expose.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  },
  {
    key: "push",
    label: "TRISKEL.BaseActions.Push.Label",
    category: "combat",
    skill: "control",
    reserve: "grace",
    description: "TRISKEL.BaseActions.Push.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  },
  {
    key: "brace",
    label: "TRISKEL.BaseActions.Brace.Label",
    category: "combat",
    skill: "brace",
    reserve: "power",
    description: "TRISKEL.BaseActions.Brace.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  },
  {
    key: "guard",
    label: "TRISKEL.BaseActions.Guard.Label",
    category: "combat",
    skill: "guard",
    reserve: "grace",
    description: "TRISKEL.BaseActions.Guard.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  },
  {
    key: "evade",
    label: "TRISKEL.BaseActions.Evade.Label",
    category: "combat",
    skill: "evasion",
    reserve: "grace",
    description: "TRISKEL.BaseActions.Evade.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  },
  {
    key: "grapple",
    label: "TRISKEL.BaseActions.Grapple.Label",
    category: "combat",
    skill: "control",
    reserve: "power",
    description: "TRISKEL.BaseActions.Grapple.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  },
  {
    key: "break",
    label: "TRISKEL.BaseActions.Break.Label",
    category: "combat",
    skill: "brace",
    reserve: "power",
    description: "TRISKEL.BaseActions.Break.Description",
    image: "systems/triskel/assets/placeholders/base-action.svg"
  }
];

export const TRISKEL_ADVANCED_ACTIONS = [
  {
    key: "quickShot",
    label: "TRISKEL.AdvancedActions.QuickShot.Label",
    category: "advanced",
    skill: "aim",
    reserve: "grace",
    description: "TRISKEL.AdvancedActions.QuickShot.Description"
  },
  {
    key: "crossBowShot",
    label: "TRISKEL.AdvancedActions.CrossBowShot.Label",
    category: "advanced",
    skill: "aim",
    reserve: "power",
    description: "TRISKEL.AdvancedActions.CrossBowShot.Description"
  }
];

export const TRISKEL_SPELLS = [
  {
    key: "arc",
    label: "TRISKEL.Spells.Arc.Label",
    category: "spell",
    skill: "manifest",
    reserve: "will",
    description: "TRISKEL.Spells.Arc.Description"
  }
];

export const TRISKEL_ALL_ACTIONS = [
  ...TRISKEL_BASE_ACTIONS,
  ...TRISKEL_ADVANCED_ACTIONS,
  ...TRISKEL_SPELLS
];
