// action-codex.js

export const TRISKEL_ACTIONS = [
  {
    key: "strike",
    label: "Strike",
    category: "combat",
    skill: "strike",
    reserve: "power",
    description: "A direct attack. Extra power increases its force."
  },
  {
    key: "bind",
    label: "Bind",
    category: "combat",
    skill: "control",
    reserve: "grace",
    description: "Locks the opponent’s weapon line and imposes bound(X)."
  },
  {
    key: "expose",
    label: "Expose",
    category: "combat",
    skill: "control",
    reserve: "grace",
    description: "Forces an opening in the opponent’s defense and applies exposed(X)."
  },
  {
    key: "push",
    label: "Push",
    category: "combat",
    skill: "control",
    reserve: "grace",
    description: "Drives the opponent back and applies pushed(X)."
  },
  {
    key: "brace",
    label: "Brace",
    category: "combat",
    skill: "brace",
    reserve: "power",
    description: "Sets a firm stance; reduces incoming control effects."
  },
  {
    key: "guard",
    label: "Guard",
    category: "combat",
    skill: "guard",
    reserve: "grace",
    description: "Adopts a defensive structure; improves the next guard attempt."
  },
  {
    key: "evade",
    label: "Evade",
    category: "combat",
    skill: "evasion",
    reserve: "grace",
    description: "Moves lightly out of line; improves the next evasion attempt."
  },
  {
    key: "grapple",
    label: "Grapple",
    category: "combat",
    skill: "control",
    reserve: "power",
    description: "Unarmed restraint that limits the target’s movement."
  },
  {
    key: "break",
    label: "Break",
    category: "combat",
    skill: "brace",
    reserve: "power",
    description: "Shakes off negative states; reduces bound/exposed/pushed."
  }
];
