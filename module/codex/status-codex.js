export const TRISKEL_STATUS_EFFECTS = [
  {
    id: "impaired",
    label: "TRISKEL.StatusEffect.Impaired.Label",
    description: "TRISKEL.StatusEffect.Impaired.Description",
    category: "debuff",
    modifiedSkillCategories: ["offense", "defense", "physical", "professional", "social", "intellectual", "magic"]
  },
  {
    id: "exposed",
    label: "TRISKEL.StatusEffect.Exposed.Label",
    description: "TRISKEL.StatusEffect.Exposed.Description",
    category: "debuff",
    modifiedSkills: ["guard", "evasion"]
  },
  {
    id: "bound",
    label: "TRISKEL.StatusEffect.Bound.Label",
    description: "TRISKEL.StatusEffect.Bound.Description",
    category: "debuff",
    modifiedSkills: ["strike", "guard"]
  },
  {
    id: "pushed",
    label: "TRISKEL.StatusEffect.Pushed.Label",
    description: "TRISKEL.StatusEffect.Pushed.Description",
    category: "debuff",
    modifiedSkills: ["brace", "guard"]
  },
  {
    id: "frightened",
    label: "TRISKEL.StatusEffect.Frightened.Label",
    description: "TRISKEL.StatusEffect.Frightened.Description",
    category: "debuff",
    modifiedSkills: ["strike", "control"]
  },
  {
    id: "pinned",
    label: "TRISKEL.StatusEffect.Pinned.Label",
    description: "TRISKEL.StatusEffect.Pinned.Description",
    category: "debuff",
    blockedActionTypes: ["position"]
  },
  {
    id: "grabbed",
    label: "TRISKEL.StatusEffect.Grabbed.Label",
    description: "TRISKEL.StatusEffect.Grabbed.Description",
    category: "debuff",
    blockedActionTypes: ["position"],
    blockedActions: ["move"]
  },
  {
    id: "fortified",
    label: "TRISKEL.StatusEffect.Fortified.Label",
    description: "TRISKEL.StatusEffect.Fortified.Description",
    category: "buff",
    modifiedSkills: ["brace", "guard", "evasion"]
  },
  {
    id: "cover",
    label: "TRISKEL.StatusEffect.Cover.Label",
    description: "TRISKEL.StatusEffect.Cover.Description",
    category: "buff",
    modifiedSkills: ["evasion"]
  }
];
