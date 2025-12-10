// triskel-codex.js
// Triskel Tiers
export const TRISKEL_TIERS = {
  novice: {
    id: "novice",
    label: "TRISKEL.Actor.Tier.Novice.Label",
    tier: 1
  },
  apprentice: {
    id: "apprentice",
    label: "TRISKEL.Actor.Tier.Apprentice.Label",
    tier: 2
  },
  adept: {
    id: "adept",
    label: "TRISKEL.Actor.Tier.Adept.Label",
    tier: 3
  },
  veteran: {
    id: "veteran",
    label: "TRISKEL.Actor.Tier.Veteran.Label",
    tier: 4
  },
  master: {
    id: "master",
    label: "TRISKEL.Actor.Tier.Master.Label",
    tier: 5
  },
  paragon: {
    id: "paragon",
    label: "TRISKEL.Actor.Tier.Paragon.Label",
    tier: 6
  }
};

export const ITEM_CATEGORY_CONFIG = {
  held: {
    itemLabelKey: "TRISKEL.Item.Type.Held",
    categoryLabelKey: "TRISKEL.Item.Category.Held",
    toggleAction: "toggleHeldItem"
  },
  worn: {
    itemLabelKey: "TRISKEL.Item.Type.Worn",
    categoryLabelKey: "TRISKEL.Item.Category.Worn",
    toggleAction: "toggleWornEquip"
  },
  ability: {
    itemLabelKey: "TRISKEL.Item.Type.Ability",
    categoryLabelKey: "TRISKEL.Item.Category.Ability",
    toggleAction: "toggleAbility"
  },
  spell: {
    itemLabelKey: "TRISKEL.Item.Type.Spell",
    categoryLabelKey: "TRISKEL.Item.Category.Spell",
    toggleAction: "toggleSpell"
  }
};

// Master list of all Triskel Skills
export const TRISKEL_SKILLS = {
  /* ---------------------------------- OFFENSE ---------------------------------- */
  strike: {
    id: "strike",
    label: "TRISKEL.Actor.Skill.Strike.Label",
    description: "TRISKEL.Actor.Skill.Strike.Description",
    category: "offense",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Offense",
    phase: "combat",
    phaseLabel: "TRISKEL.Action.Phase.Combat"
  },
  control: {
    id: "control",
    label: "TRISKEL.Actor.Skill.Control.Label",
    description: "TRISKEL.Actor.Skill.Control.Description",
    category: "offense",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Offense",
    phase: "combat",
    phaseLabel: "TRISKEL.Action.Phase.Combat"
  },
  aim: {
    id: "aim",
    label: "TRISKEL.Actor.Skill.Aim.Label",
    description: "TRISKEL.Actor.Skill.Aim.Description",
    category: "offense",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Offense",
    phase: "combat",
    phaseLabel: "TRISKEL.Action.Phase.Combat"
  },

  /* ---------------------------------- DEFENSE ---------------------------------- */
  guard: {
    id: "guard",
    label: "TRISKEL.Actor.Skill.Guard.Label",
    description: "TRISKEL.Actor.Skill.Guard.Description",
    category: "defense",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Defense",
    phase: "combat",
    phaseLabel: "TRISKEL.Action.Phase.Combat"
  },
  brace: {
    id: "brace",
    label: "TRISKEL.Actor.Skill.Brace.Label",
    description: "TRISKEL.Actor.Skill.Brace.Description",
    category: "defense",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Defense",
    phase: "combat",
    phaseLabel: "TRISKEL.Action.Phase.Combat"
  },
  evasion: {
    id: "evasion",
    label: "TRISKEL.Actor.Skill.Evasion.Label",
    description: "TRISKEL.Actor.Skill.Evasion.Description",
    category: "defense",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Defense",
    phase: "combat",
    phaseLabel: "TRISKEL.Action.Phase.Combat"
  },

  /* --------------------------------- PHYSICAL --------------------------------- */
  athletics: {
    id: "athletics",
    label: "TRISKEL.Actor.Skill.Athletics.Label",
    description: "TRISKEL.Actor.Skill.Athletics.Description",
    category: "physical",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Physical",
    phase: "travel",
    phaseLabel: "TRISKEL.Action.Phase.Travel"
  },
  notice: {
    id: "notice",
    label: "TRISKEL.Actor.Skill.Notice.Label",
    description: "TRISKEL.Actor.Skill.Notice.Description",
    category: "physical",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Physical",
    phase: "travel",
    phaseLabel: "TRISKEL.Action.Phase.Travel"
  },
  stealth: {
    id: "stealth",
    label: "TRISKEL.Actor.Skill.Stealth.Label",
    description: "TRISKEL.Actor.Skill.Stealth.Description",
    category: "physical",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Physical",
    phase: "travel",
    phaseLabel: "TRISKEL.Action.Phase.Travel"
  },
 
  /* ------------------------------- PROFESSIONAL ------------------------------- */
  craft: {
    id: "craft",
    label: "TRISKEL.Actor.Skill.Craft.Label",
    description: "TRISKEL.Actor.Skill.Craft.Description",
    category: "professional",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Professional",
    phase: "preparation",
    phaseLabel: "TRISKEL.Action.Phase.Preparation"
  },
  track: {
    id: "track",
    label: "TRISKEL.Actor.Skill.Track.Label",
    description: "TRISKEL.Actor.Skill.Track.Description",
    category: "professional",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Professional",
    phase: "travel",
    phaseLabel: "TRISKEL.Action.Phase.Travel"
  },
  handleBeasts: {
    id: "handleBeasts",
    label: "TRISKEL.Actor.Skill.HandleBeasts.Label",
    description: "TRISKEL.Actor.Skill.HandleBeasts.Description",
    category: "professional",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Professional",
    phase: "travel",
    phaseLabel: "TRISKEL.Action.Phase.Travel"
  },
  
  /* ---------------------------------- SOCIAL ---------------------------------- */
  impress: {
    id: "impress",
    label: "TRISKEL.Actor.Skill.Impress.Label",
    description: "TRISKEL.Actor.Skill.Impress.Description",
    category: "social",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Social",
    phase: "preparation",
    phaseLabel: "TRISKEL.Action.Phase.Preparation"
  },
  influence: {
    id: "influence",
    label: "TRISKEL.Actor.Skill.Influence.Label",
    description: "TRISKEL.Actor.Skill.Influence.Description",
    category: "social",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Social",
    phase: "preparation",
    phaseLabel: "TRISKEL.Action.Phase.Preparation"
  },
  insight: {
    id: "insight",
    label: "TRISKEL.Actor.Skill.Insight.Label",
    description: "TRISKEL.Actor.Skill.Insight.Description",
    category: "social",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Social",
    phase: "preparation",
    phaseLabel: "TRISKEL.Action.Phase.Preparation"
  },

  /* ------------------------------- INTELLECTUAL ------------------------------- */
  academia: {
    id: "academia",
    label: "TRISKEL.Actor.Skill.Academia.Label",
    description: "TRISKEL.Actor.Skill.Academia.Description",
    category: "intellectual",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Intellectual",
    phase: "preparation",
    phaseLabel: "TRISKEL.Action.Phase.Preparation"
  },
  folklore: {
    id: "folklore",
    label: "TRISKEL.Actor.Skill.Folklore.Label",
    description: "TRISKEL.Actor.Skill.Folklore.Description",
    category: "intellectual",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Intellectual",
    phase: "preparation",
    phaseLabel: "TRISKEL.Action.Phase.Preparation"
  },
  navigate: {
    id: "navigate",
    label: "TRISKEL.Actor.Skill.Navigate.Label",
    description: "TRISKEL.Actor.Skill.Navigate.Description",
    category: "intellectual",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Intellectual",
    phase: "travel",
    phaseLabel: "TRISKEL.Action.Phase.Travel"
  },

  /* ----------------------------------- MAGIC ---------------------------------- */
  manifest: {
    id: "manifest",
    label: "TRISKEL.Actor.Skill.Manifest.Label",
    description: "TRISKEL.Actor.Skill.Manifest.Description",
    category: "magic",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Action.Phase.Any"
  },
  alter: {
    id: "alter",
    label: "TRISKEL.Actor.Skill.Alter.Label",
    description: "TRISKEL.Actor.Skill.Alter.Description",
    category: "magic",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Action.Phase.Any"
  },
  compel: {
    id: "compel",
    label: "TRISKEL.Actor.Skill.Compel.Label",
    description: "TRISKEL.Actor.Skill.Compel.Description",
    category: "magic",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Action.Phase.Any"
  },
  reveal: {
    id: "reveal",
    label: "TRISKEL.Actor.Skill.Reveal.Label",
    description: "TRISKEL.Actor.Skill.Reveal.Description",
    category: "magic",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Action.Phase.Any"
  },
  transpose: {
    id: "transpose",
    label: "TRISKEL.Actor.Skill.Transpose.Label",
    description: "TRISKEL.Actor.Skill.Transpose.Description",
    category: "magic",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Action.Phase.Any"
  },
  ward: {
    id: "ward",
    label: "TRISKEL.Actor.Skill.Ward.Label",
    description: "TRISKEL.Actor.Skill.Ward.Description",
    category: "magic",
    categoryLabel: "TRISKEL.Actor.Skill.Category.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Action.Phase.Any"
  }

};

// Master list of Triskel Resistances
export const TRISKEL_RESISTANCES = {
  snap: {
    id: "snap",
    label: "TRISKEL.Actor.Resistance.Snap.Label",
    description: "TRISKEL.Actor.Resistance.Snap.Description",
    phase: "Any"
  },
  grit: {
    id: "grit",
    label: "TRISKEL.Actor.Resistance.Grit.Label",
    description: "TRISKEL.Actor.Resistance.Grit.Description",
    phase: "Any"
  },
  resolve: {
    id: "resolve",
    label: "TRISKEL.Actor.Resistance.Resolve.Label",
    description: "TRISKEL.Actor.Resistance.Resolve.Description",
    phase: "Any"
  }
};

// Triskel Reserves
export const TRISKEL_RESERVES = {
  power: {
    id: "power",
    label: "TRISKEL.Actor.Reserve.Power.Label",
    description: "TRISKEL.Actor.Reserve.Power.Description"
  },
  grace: {
    id: "grace",
    label: "TRISKEL.Actor.Reserve.Grace.Label",
    description: "TRISKEL.Actor.Reserve.Grace.Description"
  },
  will: {
    id: "will",
    label: "TRISKEL.Actor.Reserve.Will.Label",
    description: "TRISKEL.Actor.Reserve.Will.Description"
  }
};

// Triskel NPC Stats
export const TRISKEL_NPC_STATS = {
  hp: {
    id: "hp",
    label: "TRISKEL.Actor.NPC.Stat.HP.Label",
    description: "TRISKEL.Actor.NPC.Stat.HP.Description"
  },
  wounds: {
    id: "wounds",
    label: "TRISKEL.Actor.NPC.Stat.Wounds.Label",
    description: "TRISKEL.Actor.NPC.Stat.Wounds.Description"
  }
};

// Master list of Triskel Paths
export const TRISKEL_PATHS = {
  virtue: {
    id: "virtue",
    label: "TRISKEL.Actor.Path.Virtue.Label",
    description: "TRISKEL.Actor.Path.Virtue.Description",
    tags: ["Good", "Moralistic"],
    steps: [
      { tier: 1, label: "TRISKEL.Actor.Path.Virtue.Steps.Discipline" },
      { tier: 2, label: "TRISKEL.Actor.Path.Virtue.Steps.Constancy" },
      { tier: 3, label: "TRISKEL.Actor.Path.Virtue.Steps.Integrity" }
    ]
  },
  ward: {
    id: "ward",
    label: "TRISKEL.Actor.Path.Ward.Label",
    description: "TRISKEL.Actor.Path.Ward.Description",
    tags: ["Good", "Naturalistic"],
    steps: [
      { tier: 1, label: "TRISKEL.Actor.Path.Ward.Steps.Presence" },
      { tier: 2, label: "TRISKEL.Actor.Path.Ward.Steps.Stewardship" },
      { tier: 3, label: "TRISKEL.Actor.Path.Ward.Steps.Renewal" }
    ]
  },
  vice: {
    id: "vice",
    label: "TRISKEL.Actor.Path.Vice.Label",
    description: "TRISKEL.Actor.Path.Vice.Description",
    tags: ["Evil", "Moralistic"],
    steps: [
      { tier: 1, label: "TRISKEL.Actor.Path.Vice.Steps.Indulgence" },
      { tier: 2, label: "TRISKEL.Actor.Path.Vice.Steps.Decay" },
      { tier: 3, label: "TRISKEL.Actor.Path.Vice.Steps.Depravity" }
    ]
  },
  ruin: {
    id: "ruin",
    label: "TRISKEL.Actor.Path.Ruin.Label",
    description: "TRISKEL.Actor.Path.Ruin.Description",
    tags: ["Evil", "Naturalistic"],
    steps: [
      { tier: 1, label: "TRISKEL.Actor.Path.Ruin.Steps.Desire" },
      { tier: 2, label: "TRISKEL.Actor.Path.Ruin.Steps.Despair" },
      { tier: 3, label: "TRISKEL.Actor.Path.Ruin.Steps.Righteousness" }
    ]
  }
};
