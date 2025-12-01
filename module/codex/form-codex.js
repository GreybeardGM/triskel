// form-codex.js
// Core combat forms for Triskel.
// Keys, skills, reserves, and action references are lowercase for direct ID usage.

export const TRISKEL_FORMS = [
  {
    key: "power_strike",
    label: "Power Strike",
    category: "combat",
    skill: "strike",
    reserve: "power",
    actions: ["strike"],
    description: "Spend power to make a strike hit much harder than usual."
  },
  {
    key: "long_hook",
    label: "Long Hook",
    category: "combat",
    skill: "control",
    reserve: "grace",
    actions: ["bind", "expose", "push"],
    description: "Extend a control action to reach further than normal using a hooked or polearm weapon."
  },
  {
    key: "locking_bind",
    label: "Locking Bind",
    category: "combat",
    skill: "control",
    reserve: "grace",
    actions: ["bind"],
    description: "Deepen a bind so that the target’s weapon stays locked more firmly in place."
  },
  {
    key: "precision_thrust",
    label: "Precision Thrust",
    category: "combat",
    skill: "strike",
    reserve: "grace",
    actions: ["strike"],
    description: "Turn a strike into a precise thrust that gains extra accuracy for a brief moment."
  },
  {
    key: "push_through",
    label: "Push Through",
    category: "combat",
    skill: "control",
    reserve: "power",
    actions: ["push"],
    description: "Drive a push harder, forcing the target back farther than a normal control move would."
  },
  {
    key: "counterguard",
    label: "Counterguard",
    category: "combat",
    skill: "guard",
    reserve: "grace",
    actions: ["guard"],
    description: "Sharpen your defensive structure to gain a stronger guard against the next attack."
  },
  {
    key: "break_stance",
    label: "Break Stance",
    category: "combat",
    skill: "strike",
    reserve: "power",
    actions: ["strike"],
    description: "Turn a heavy strike into a stance-breaking blow that leaves the target more exposed."
  }
];
