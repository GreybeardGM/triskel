// triskel-codex.js

import {
  TRISKEL_ACTION_TYPES,
  TRISKEL_ADVANCED_ACTIONS,
  TRISKEL_ALL_ACTIONS,
  TRISKEL_BASE_ACTIONS,
  TRISKEL_SPELLS
} from "./action-codex.js";
import { TRISKEL_FORMS } from "./form-codex.js";

const indexById = (entries = []) => entries.reduce((collection, entry) => {
  if (entry?.id) collection[entry.id] = entry;
  return collection;
}, {});

const createCodexCollections = (entries = {}) => {
  const codex = {};
  const index = {};

  Object.entries(entries).forEach(([key, value]) => {
    codex[key] = value;
    index[key] = Array.isArray(value) ? indexById(value) : value;
  });

  return { codex, index };
};

export const TRISKEL_TIERS = [
  { id: "novice", label: "TRISKEL.Actor.Tier.Novice.Label", tier: 1 },
  { id: "apprentice", label: "TRISKEL.Actor.Tier.Apprentice.Label", tier: 2 },
  { id: "adept", label: "TRISKEL.Actor.Tier.Adept.Label", tier: 3 },
  { id: "veteran", label: "TRISKEL.Actor.Tier.Veteran.Label", tier: 4 },
  { id: "master", label: "TRISKEL.Actor.Tier.Master.Label", tier: 5 },
  { id: "paragon", label: "TRISKEL.Actor.Tier.Paragon.Label", tier: 6 }
];

export const TRISKEL_ITEM_CATEGORIES = [
  {
    id: "held",
    label: "TRISKEL.Item.Type.Held",
    labelPlural: "TRISKEL.Item.Category.Held",
    toggleAction: "toggleHeldItem"
  },
  {
    id: "worn",
    label: "TRISKEL.Item.Type.Worn",
    labelPlural: "TRISKEL.Item.Category.Worn",
    toggleAction: "toggleWornEquip"
  },
  {
    id: "ability",
    label: "TRISKEL.Item.Type.Ability",
    labelPlural: "TRISKEL.Item.Category.Ability",
    toggleAction: "toggleAbility"
  },
  {
    id: "spell",
    label: "TRISKEL.Item.Type.Spell",
    labelPlural: "TRISKEL.Item.Category.Spell",
    toggleAction: "toggleSpell"
  }
];

export const TRISKEL_RESISTANCES = [
  {
    id: "snap",
    label: "TRISKEL.Actor.Resistance.Snap.Label",
    description: "TRISKEL.Actor.Resistance.Snap.Description",
    phase: "Any"
  },
  {
    id: "grit",
    label: "TRISKEL.Actor.Resistance.Grit.Label",
    description: "TRISKEL.Actor.Resistance.Grit.Description",
    phase: "Any"
  },
  {
    id: "resolve",
    label: "TRISKEL.Actor.Resistance.Resolve.Label",
    description: "TRISKEL.Actor.Resistance.Resolve.Description",
    phase: "Any"
  }
];

export const TRISKEL_SKILL_CATEGORIES = [
  {
    id: "resistances",
    label: "TRISKEL.Actor.Resistance.Label",
    phase: "any",
    phaseLabel: "TRISKEL.Action.Phase.Any"
  },
  {
    id: "offense",
    label: "TRISKEL.Actor.Skill.Category.Offense",
    phase: "combat",
    phaseLabel: "TRISKEL.Action.Phase.Combat"
  },
  {
    id: "defense",
    label: "TRISKEL.Actor.Skill.Category.Defense",
    phase: "combat",
    phaseLabel: "TRISKEL.Action.Phase.Combat"
  },
  {
    id: "physical",
    label: "TRISKEL.Actor.Skill.Category.Physical",
    phase: "travel",
    phaseLabel: "TRISKEL.Action.Phase.Travel"
  },
  {
    id: "professional",
    label: "TRISKEL.Actor.Skill.Category.Professional",
    phase: "travel",
    phaseLabel: "TRISKEL.Action.Phase.Travel"
  },
  {
    id: "social",
    label: "TRISKEL.Actor.Skill.Category.Social",
    phase: "preparation",
    phaseLabel: "TRISKEL.Action.Phase.Preparation"
  },
  {
    id: "intellectual",
    label: "TRISKEL.Actor.Skill.Category.Intellectual",
    phase: "preparation",
    phaseLabel: "TRISKEL.Action.Phase.Preparation"
  },
  {
    id: "magic",
    label: "TRISKEL.Actor.Skill.Category.Magic",
    phase: "any",
    phaseLabel: "TRISKEL.Action.Phase.Any"
  }
];

const TRISKEL_BASE_SKILLS = [
  /* ---------------------------------- OFFENSE ---------------------------------- */
  {
    id: "strike",
    label: "TRISKEL.Actor.Skill.Strike.Label",
    description: "TRISKEL.Actor.Skill.Strike.Description",
    category: "offense"
  },
  {
    id: "control",
    label: "TRISKEL.Actor.Skill.Control.Label",
    description: "TRISKEL.Actor.Skill.Control.Description",
    category: "offense"
  },
  {
    id: "aim",
    label: "TRISKEL.Actor.Skill.Aim.Label",
    description: "TRISKEL.Actor.Skill.Aim.Description",
    category: "offense"
  },

  /* ---------------------------------- DEFENSE ---------------------------------- */
  {
    id: "guard",
    label: "TRISKEL.Actor.Skill.Guard.Label",
    description: "TRISKEL.Actor.Skill.Guard.Description",
    category: "defense"
  },
  {
    id: "brace",
    label: "TRISKEL.Actor.Skill.Brace.Label",
    description: "TRISKEL.Actor.Skill.Brace.Description",
    category: "defense"
  },
  {
    id: "evasion",
    label: "TRISKEL.Actor.Skill.Evasion.Label",
    description: "TRISKEL.Actor.Skill.Evasion.Description",
    category: "defense"
  },

  /* --------------------------------- PHYSICAL --------------------------------- */
  {
    id: "athletics",
    label: "TRISKEL.Actor.Skill.Athletics.Label",
    description: "TRISKEL.Actor.Skill.Athletics.Description",
    category: "physical"
  },
  {
    id: "notice",
    label: "TRISKEL.Actor.Skill.Notice.Label",
    description: "TRISKEL.Actor.Skill.Notice.Description",
    category: "physical"
  },
  {
    id: "stealth",
    label: "TRISKEL.Actor.Skill.Stealth.Label",
    description: "TRISKEL.Actor.Skill.Stealth.Description",
    category: "physical"
  },

  /* ------------------------------- PROFESSIONAL ------------------------------- */
  {
    id: "craft",
    label: "TRISKEL.Actor.Skill.Craft.Label",
    description: "TRISKEL.Actor.Skill.Craft.Description",
    category: "professional"
  },
  {
    id: "track",
    label: "TRISKEL.Actor.Skill.Track.Label",
    description: "TRISKEL.Actor.Skill.Track.Description",
    category: "professional"
  },
  {
    id: "handleBeasts",
    label: "TRISKEL.Actor.Skill.HandleBeasts.Label",
    description: "TRISKEL.Actor.Skill.HandleBeasts.Description",
    category: "professional"
  },

  /* ---------------------------------- SOCIAL ---------------------------------- */
  {
    id: "impress",
    label: "TRISKEL.Actor.Skill.Impress.Label",
    description: "TRISKEL.Actor.Skill.Impress.Description",
    category: "social"
  },
  {
    id: "influence",
    label: "TRISKEL.Actor.Skill.Influence.Label",
    description: "TRISKEL.Actor.Skill.Influence.Description",
    category: "social"
  },
  {
    id: "insight",
    label: "TRISKEL.Actor.Skill.Insight.Label",
    description: "TRISKEL.Actor.Skill.Insight.Description",
    category: "social"
  },

  /* ------------------------------- INTELLECTUAL ------------------------------- */
  {
    id: "academia",
    label: "TRISKEL.Actor.Skill.Academia.Label",
    description: "TRISKEL.Actor.Skill.Academia.Description",
    category: "intellectual"
  },
  {
    id: "folklore",
    label: "TRISKEL.Actor.Skill.Folklore.Label",
    description: "TRISKEL.Actor.Skill.Folklore.Description",
    category: "intellectual"
  },
  {
    id: "navigate",
    label: "TRISKEL.Actor.Skill.Navigate.Label",
    description: "TRISKEL.Actor.Skill.Navigate.Description",
    category: "intellectual"
  },

  /* ----------------------------------- MAGIC ---------------------------------- */
  {
    id: "manifest",
    label: "TRISKEL.Actor.Skill.Manifest.Label",
    description: "TRISKEL.Actor.Skill.Manifest.Description",
    category: "magic"
  },
  {
    id: "alter",
    label: "TRISKEL.Actor.Skill.Alter.Label",
    description: "TRISKEL.Actor.Skill.Alter.Description",
    category: "magic"
  },
  {
    id: "compel",
    label: "TRISKEL.Actor.Skill.Compel.Label",
    description: "TRISKEL.Actor.Skill.Compel.Description",
    category: "magic"
  },
  {
    id: "reveal",
    label: "TRISKEL.Actor.Skill.Reveal.Label",
    description: "TRISKEL.Actor.Skill.Reveal.Description",
    category: "magic"
  },
  {
    id: "transpose",
    label: "TRISKEL.Actor.Skill.Transpose.Label",
    description: "TRISKEL.Actor.Skill.Transpose.Description",
    category: "magic"
  },
  {
    id: "ward",
    label: "TRISKEL.Actor.Skill.Ward.Label",
    description: "TRISKEL.Actor.Skill.Ward.Description",
    category: "magic"
  }
];

export const TRISKEL_SKILLS = [
  ...TRISKEL_BASE_SKILLS,
  ...TRISKEL_RESISTANCES.map(resistance => ({
    ...resistance,
    category: "resistances"
  }))
];

export const TRISKEL_RESERVES = [
  {
    id: "power",
    label: "TRISKEL.Actor.Reserve.Power.Label",
    description: "TRISKEL.Actor.Reserve.Power.Description"
  },
  {
    id: "grace",
    label: "TRISKEL.Actor.Reserve.Grace.Label",
    description: "TRISKEL.Actor.Reserve.Grace.Description"
  },
  {
    id: "will",
    label: "TRISKEL.Actor.Reserve.Will.Label",
    description: "TRISKEL.Actor.Reserve.Will.Description"
  }
];

export const TRISKEL_NPC_STATS = [
  {
    id: "hp",
    label: "TRISKEL.Actor.NPC.Stat.HP.Label",
    description: "TRISKEL.Actor.NPC.Stat.HP.Description"
  },
  {
    id: "wounds",
    label: "TRISKEL.Actor.NPC.Stat.Wounds.Label",
    description: "TRISKEL.Actor.NPC.Stat.Wounds.Description"
  }
];

export const TRISKEL_PATHS = [
  {
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
  {
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
  {
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
  {
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
];

export const { codex: TRISKEL_CODEX, index: TRISKEL_CODEX_INDEX } = createCodexCollections({
  actionTypes: TRISKEL_ACTION_TYPES,
  tiers: TRISKEL_TIERS,
  itemCategories: TRISKEL_ITEM_CATEGORIES,
  skillCategories: TRISKEL_SKILL_CATEGORIES,
  skills: TRISKEL_SKILLS,
  baseActions: TRISKEL_BASE_ACTIONS,
  advancedActions: TRISKEL_ADVANCED_ACTIONS,
  spells: TRISKEL_SPELLS,
  actions: TRISKEL_ALL_ACTIONS,
  forms: TRISKEL_FORMS,
  resistances: TRISKEL_RESISTANCES,
  reserves: TRISKEL_RESERVES,
  npcStats: TRISKEL_NPC_STATS,
  paths: TRISKEL_PATHS
});

export const TRISKEL_TIERS_BY_ID = TRISKEL_CODEX_INDEX.tiers;
export const TRISKEL_ITEM_CATEGORIES_BY_ID = TRISKEL_CODEX_INDEX.itemCategories;
export const TRISKEL_SKILL_CATEGORIES_BY_ID = TRISKEL_CODEX_INDEX.skillCategories;
export const TRISKEL_SKILLS_BY_ID = TRISKEL_CODEX_INDEX.skills;
export const TRISKEL_ACTION_TYPES_BY_ID = TRISKEL_CODEX_INDEX.actionTypes;
export const TRISKEL_ACTIONS_BY_ID = TRISKEL_CODEX_INDEX.actions;
export const TRISKEL_FORMS_BY_ID = TRISKEL_CODEX_INDEX.forms;
export const TRISKEL_RESISTANCES_BY_ID = TRISKEL_CODEX_INDEX.resistances;
export const TRISKEL_RESERVES_BY_ID = TRISKEL_CODEX_INDEX.reserves;
export const TRISKEL_NPC_STATS_BY_ID = TRISKEL_CODEX_INDEX.npcStats;
export const TRISKEL_PATHS_BY_ID = TRISKEL_CODEX_INDEX.paths;
