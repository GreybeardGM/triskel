// form-codex.js
// Core combat forms for Triskel.
// Keys, reserves, and keyword references are lowercase for direct ID usage.

export const TRISKEL_FORMS = [
  {
    key: "power_strike",
    label: "TRISKEL.Forms.PowerStrike.Label",
    cost: 1,
    reserve: "power",
    keywords: ["strike"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Forms.PowerStrike.Description"
  },
  {
    key: "long_hook",
    label: "TRISKEL.Forms.LongHook.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["control"],
    modifiers: [
      { skill: 1 },
      { reach: 5 }
    ],
    description: "TRISKEL.Forms.LongHook.Description"
  },
  {
    key: "locking_bind",
    label: "TRISKEL.Forms.LockingBind.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["bind"],
    description: "TRISKEL.Forms.LockingBind.Description"
  },
  {
    key: "precision_thrust",
    label: "TRISKEL.Forms.PrecisionThrust.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["strike"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Forms.PrecisionThrust.Description"
  },
  {
    key: "push_through",
    label: "TRISKEL.Forms.PushThrough.Label",
    cost: 1,
    reserve: "power",
    keywords: ["push"],
    description: "TRISKEL.Forms.PushThrough.Description"
  },
  {
    key: "counterguard",
    label: "TRISKEL.Forms.Counterguard.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["guard"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Forms.Counterguard.Description"
  },
  {
    key: "break_stance",
    label: "TRISKEL.Forms.BreakStance.Label",
    cost: 1,
    reserve: "power",
    keywords: ["strike"],
    description: "TRISKEL.Forms.BreakStance.Description"
  },
  {
    key: "blackmagic",
    label: "TRISKEL.Forms.Blackmagic.Label",
    cost: 1,
    reserve: "power",
    keywords: ["manifestation"],
    description: "TRISKEL.Forms.Blackmagic.Description"
  }
];
