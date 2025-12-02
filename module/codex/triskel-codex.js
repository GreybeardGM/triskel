// triskel-codex.js
// Triskel Tiers
export const TRISKEL_TIERS = {
  novice: {
    id: "novice",
    label: "TRISKEL.Tiers.Novice.Label",
    tier: 1
  },
  apprentice: {
    id: "apprentice",
    label: "TRISKEL.Tiers.Apprentice.Label",
    tier: 2
  },
  adept: {
    id: "adept",
    label: "TRISKEL.Tiers.Adept.Label",
    tier: 3
  },
  veteran: {
    id: "veteran",
    label: "TRISKEL.Tiers.Veteran.Label",
    tier: 4
  },
  master: {
    id: "master",
    label: "TRISKEL.Tiers.Master.Label",
    tier: 5
  },
  paragon: {
    id: "paragon",
    label: "TRISKEL.Tiers.Paragon.Label",
    tier: 6
  }
};

// Master list of all Triskel Skills
export const TRISKEL_SKILLS = {
  /* ---------------------------------- OFFENSE ---------------------------------- */
  strike: {
    id: "strike",
    label: "TRISKEL.Skills.Strike.Label",
    description: "TRISKEL.Skills.Strike.Description",
    category: "offense",
    categoryLabel: "TRISKEL.SkillCategories.Offense",
    phase: "combat",
    phaseLabel: "TRISKEL.Phases.Combat"
  },
  control: {
    id: "control",
    label: "TRISKEL.Skills.Control.Label",
    description: "TRISKEL.Skills.Control.Description",
    category: "offense",
    categoryLabel: "TRISKEL.SkillCategories.Offense",
    phase: "combat",
    phaseLabel: "TRISKEL.Phases.Combat"
  },
  aim: {
    id: "aim",
    label: "TRISKEL.Skills.Aim.Label",
    description: "TRISKEL.Skills.Aim.Description",
    category: "offense",
    categoryLabel: "TRISKEL.SkillCategories.Offense",
    phase: "combat",
    phaseLabel: "TRISKEL.Phases.Combat"
  },

  /* ---------------------------------- DEFENSE ---------------------------------- */
  guard: {
    id: "guard",
    label: "TRISKEL.Skills.Guard.Label",
    description: "TRISKEL.Skills.Guard.Description",
    category: "defense",
    categoryLabel: "TRISKEL.SkillCategories.Defense",
    phase: "combat",
    phaseLabel: "TRISKEL.Phases.Combat"
  },
  brace: {
    id: "brace",
    label: "TRISKEL.Skills.Brace.Label",
    description: "TRISKEL.Skills.Brace.Description",
    category: "defense",
    categoryLabel: "TRISKEL.SkillCategories.Defense",
    phase: "combat",
    phaseLabel: "TRISKEL.Phases.Combat"
  },
  evasion: {
    id: "evasion",
    label: "TRISKEL.Skills.Evasion.Label",
    description: "TRISKEL.Skills.Evasion.Description",
    category: "defense",
    categoryLabel: "TRISKEL.SkillCategories.Defense",
    phase: "combat",
    phaseLabel: "TRISKEL.Phases.Combat"
  },

  /* --------------------------------- PHYSICAL --------------------------------- */
  athletics: {
    id: "athletics",
    label: "TRISKEL.Skills.Athletics.Label",
    description: "TRISKEL.Skills.Athletics.Description",
    category: "physical",
    categoryLabel: "TRISKEL.SkillCategories.Physical",
    phase: "travel",
    phaseLabel: "TRISKEL.Phases.Travel"
  },
  notice: {
    id: "notice",
    label: "TRISKEL.Skills.Notice.Label",
    description: "TRISKEL.Skills.Notice.Description",
    category: "physical",
    categoryLabel: "TRISKEL.SkillCategories.Physical",
    phase: "travel",
    phaseLabel: "TRISKEL.Phases.Travel"
  },
  stealth: {
    id: "stealth",
    label: "TRISKEL.Skills.Stealth.Label",
    description: "TRISKEL.Skills.Stealth.Description",
    category: "physical",
    categoryLabel: "TRISKEL.SkillCategories.Physical",
    phase: "travel",
    phaseLabel: "TRISKEL.Phases.Travel"
  },
 
  /* ------------------------------- PROFESSIONAL ------------------------------- */
  craft: {
    id: "craft",
    label: "TRISKEL.Skills.Craft.Label",
    description: "TRISKEL.Skills.Craft.Description",
    category: "professional",
    categoryLabel: "TRISKEL.SkillCategories.Professional",
    phase: "preparation",
    phaseLabel: "TRISKEL.Phases.Preparation"
  },
  track: {
    id: "track",
    label: "TRISKEL.Skills.Track.Label",
    description: "TRISKEL.Skills.Track.Description",
    category: "professional",
    categoryLabel: "TRISKEL.SkillCategories.Professional",
    phase: "travel",
    phaseLabel: "TRISKEL.Phases.Travel"
  },
  handleBeasts: {
    id: "handleBeasts",
    label: "TRISKEL.Skills.HandleBeasts.Label",
    description: "TRISKEL.Skills.HandleBeasts.Description",
    category: "professional",
    categoryLabel: "TRISKEL.SkillCategories.Professional",
    phase: "travel",
    phaseLabel: "TRISKEL.Phases.Travel"
  },
  
  /* ---------------------------------- SOCIAL ---------------------------------- */
  impress: {
    id: "impress",
    label: "TRISKEL.Skills.Impress.Label",
    description: "TRISKEL.Skills.Impress.Description",
    category: "social",
    categoryLabel: "TRISKEL.SkillCategories.Social",
    phase: "preparation",
    phaseLabel: "TRISKEL.Phases.Preparation"
  },
  influence: {
    id: "influence",
    label: "TRISKEL.Skills.Influence.Label",
    description: "TRISKEL.Skills.Influence.Description",
    category: "social",
    categoryLabel: "TRISKEL.SkillCategories.Social",
    phase: "preparation",
    phaseLabel: "TRISKEL.Phases.Preparation"
  },
  insight: {
    id: "insight",
    label: "TRISKEL.Skills.Insight.Label",
    description: "TRISKEL.Skills.Insight.Description",
    category: "social",
    categoryLabel: "TRISKEL.SkillCategories.Social",
    phase: "preparation",
    phaseLabel: "TRISKEL.Phases.Preparation"
  },

  /* ------------------------------- INTELLECTUAL ------------------------------- */
  academia: {
    id: "academia",
    label: "TRISKEL.Skills.Academia.Label",
    description: "TRISKEL.Skills.Academia.Description",
    category: "intellectual",
    categoryLabel: "TRISKEL.SkillCategories.Intellectual",
    phase: "preparation",
    phaseLabel: "TRISKEL.Phases.Preparation"
  },
  folklore: {
    id: "folklore",
    label: "TRISKEL.Skills.Folklore.Label",
    description: "TRISKEL.Skills.Folklore.Description",
    category: "intellectual",
    categoryLabel: "TRISKEL.SkillCategories.Intellectual",
    phase: "preparation",
    phaseLabel: "TRISKEL.Phases.Preparation"
  },
  navigate: {
    id: "navigate",
    label: "TRISKEL.Skills.Navigate.Label",
    description: "TRISKEL.Skills.Navigate.Description",
    category: "intellectual",
    categoryLabel: "TRISKEL.SkillCategories.Intellectual",
    phase: "travel",
    phaseLabel: "TRISKEL.Phases.Travel"
  },

  /* ----------------------------------- MAGIC ---------------------------------- */
  manifest: {
    id: "manifest",
    label: "TRISKEL.Skills.Manifest.Label",
    description: "TRISKEL.Skills.Manifest.Description",
    category: "magic",
    categoryLabel: "TRISKEL.SkillCategories.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Phases.Any"
  },
  alter: {
    id: "alter",
    label: "TRISKEL.Skills.Alter.Label",
    description: "TRISKEL.Skills.Alter.Description",
    category: "magic",
    categoryLabel: "TRISKEL.SkillCategories.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Phases.Any"
  },
  compel: {
    id: "compel",
    label: "TRISKEL.Skills.Compel.Label",
    description: "TRISKEL.Skills.Compel.Description",
    category: "magic",
    categoryLabel: "TRISKEL.SkillCategories.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Phases.Any"
  },
  reveal: {
    id: "reveal",
    label: "TRISKEL.Skills.Reveal.Label",
    description: "TRISKEL.Skills.Reveal.Description",
    category: "magic",
    categoryLabel: "TRISKEL.SkillCategories.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Phases.Any"
  },
  transpose: {
    id: "transpose",
    label: "TRISKEL.Skills.Transpose.Label",
    description: "TRISKEL.Skills.Transpose.Description",
    category: "magic",
    categoryLabel: "TRISKEL.SkillCategories.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Phases.Any"
  },
  ward: {
    id: "ward",
    label: "TRISKEL.Skills.Ward.Label",
    description: "TRISKEL.Skills.Ward.Description",
    category: "magic",
    categoryLabel: "TRISKEL.SkillCategories.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Phases.Any"
  }

};

// Master list of Triskel Resistances
export const TRISKEL_RESISTANCES = {
  snap: {
    id: "snap",
    label: "TRISKEL.Resistances.Snap.Label",
    description: "TRISKEL.Resistances.Snap.Description",
    phase: "Any"
  },
  grit: {
    id: "grit",
    label: "TRISKEL.Resistances.Grit.Label",
    description: "TRISKEL.Resistances.Grit.Description",
    phase: "Any"
  },
  resolve: {
    id: "resolve",
    label: "TRISKEL.Resistances.Resolve.Label",
    description: "TRISKEL.Resistances.Resolve.Description",
    phase: "Any"
  }
};

// Triskel Reserves
export const TRISKEL_RESERVES = {
  power: {
    id: "power",
    label: "TRISKEL.Reserves.Power.Label",
    description: "TRISKEL.Reserves.Power.Description",
    sortOrder: 1
  },
  grace: {
    id: "grace",
    label: "TRISKEL.Reserves.Grace.Label",
    description: "TRISKEL.Reserves.Grace.Description",
    sortOrder: 2
  },
  will: {
    id: "will",
    label: "TRISKEL.Reserves.Will.Label",
    description: "TRISKEL.Reserves.Will.Description",
    sortOrder: 3
  }
};

// Triskel NPC Stats
export const TRISKEL_NPC_STATS = {
  hp: {
    id: "hp",
    label: "TRISKEL.NPCStats.HP.Label",
    description: "TRISKEL.NPCStats.HP.Description",
    sortOrder: 1
  },
  wounds: {
    id: "wounds",
    label: "TRISKEL.NPCStats.Wounds.Label",
    description: "TRISKEL.NPCStats.Wounds.Description",
    sortOrder: 2
  }
};

// Master list of Triskel Paths
export const TRISKEL_PATHS = {
  virtue: {
    id: "virtue",
    label: "TRISKEL.Paths.Virtue.Label",
    description: "TRISKEL.Paths.Virtue.Description",
    sortOrder: 1,
    tags: ["Good", "Moralistic"],
    steps: [
      { tier: 1, label: "TRISKEL.Paths.Virtue.Steps.Discipline" },
      { tier: 2, label: "TRISKEL.Paths.Virtue.Steps.Constancy" },
      { tier: 3, label: "TRISKEL.Paths.Virtue.Steps.Integrity" }
    ]
  },
  ward: {
    id: "ward",
    label: "TRISKEL.Paths.Ward.Label",
    description: "TRISKEL.Paths.Ward.Description",
    sortOrder: 2,
    tags: ["Good", "Naturalistic"],
    steps: [
      { tier: 1, label: "TRISKEL.Paths.Ward.Steps.Presence" },
      { tier: 2, label: "TRISKEL.Paths.Ward.Steps.Stewardship" },
      { tier: 3, label: "TRISKEL.Paths.Ward.Steps.Renewal" }
    ]
  },
  vice: {
    id: "vice",
    label: "TRISKEL.Paths.Vice.Label",
    description: "TRISKEL.Paths.Vice.Description",
    sortOrder: 3,
    tags: ["Evil", "Moralistic"],
    steps: [
      { tier: 1, label: "TRISKEL.Paths.Vice.Steps.Indulgence" },
      { tier: 2, label: "TRISKEL.Paths.Vice.Steps.Decay" },
      { tier: 3, label: "TRISKEL.Paths.Vice.Steps.Depravity" }
    ]
  },
  ruin: {
    id: "ruin",
    label: "TRISKEL.Paths.Ruin.Label",
    description: "TRISKEL.Paths.Ruin.Description",
    sortOrder: 4,
    tags: ["Evil", "Naturalistic"],
    steps: [
      { tier: 1, label: "TRISKEL.Paths.Ruin.Steps.Desire" },
      { tier: 2, label: "TRISKEL.Paths.Ruin.Steps.Despair" },
      { tier: 3, label: "TRISKEL.Paths.Ruin.Steps.Righteousness" }
    ]
  }
};
