// form-codex.js
// Core combat forms for Triskel.
// Keys, skills, reserves, and action references are lowercase for direct ID usage.

export const TRISKEL_FORMS = [
  {
    key: "power_strike",
    label: "TRISKEL.Forms.PowerStrike.Label",
    category: "combat",
    skill: "strike",
    reserve: "power",
    actions: ["strike"],
    description: "TRISKEL.Forms.PowerStrike.Description"
  },
  {
    key: "long_hook",
    label: "TRISKEL.Forms.LongHook.Label",
    category: "combat",
    skill: "control",
    reserve: "grace",
    actions: ["bind", "expose", "push"],
    description: "TRISKEL.Forms.LongHook.Description"
  },
  {
    key: "locking_bind",
    label: "TRISKEL.Forms.LockingBind.Label",
    category: "combat",
    skill: "control",
    reserve: "grace",
    actions: ["bind"],
    description: "TRISKEL.Forms.LockingBind.Description"
  },
  {
    key: "precision_thrust",
    label: "TRISKEL.Forms.PrecisionThrust.Label",
    category: "combat",
    skill: "strike",
    reserve: "grace",
    actions: ["strike"],
    description: "TRISKEL.Forms.PrecisionThrust.Description"
  },
  {
    key: "push_through",
    label: "TRISKEL.Forms.PushThrough.Label",
    category: "combat",
    skill: "control",
    reserve: "power",
    actions: ["push"],
    description: "TRISKEL.Forms.PushThrough.Description"
  },
  {
    key: "counterguard",
    label: "TRISKEL.Forms.Counterguard.Label",
    category: "combat",
    skill: "guard",
    reserve: "grace",
    actions: ["guard"],
    description: "TRISKEL.Forms.Counterguard.Description"
  },
  {
    key: "break_stance",
    label: "TRISKEL.Forms.BreakStance.Label",
    category: "combat",
    skill: "strike",
    reserve: "power",
    actions: ["strike"],
    description: "TRISKEL.Forms.BreakStance.Description"
  }
];
