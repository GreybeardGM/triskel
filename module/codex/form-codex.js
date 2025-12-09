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
    key: "tripping_hook",
    label: "TRISKEL.Forms.TrippingHook.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["expose"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Forms.TrippingHook.Description"
  },
  {
    key: "locking_bind",
    label: "TRISKEL.Forms.LockingBind.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["bind"],
    modifiers: [{ skill: 2 }],
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
    modifiers: [{ skill: 2 }],
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
    key: "drag",
    label: "TRISKEL.Forms.Drag.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["push"],
    modifiers: [{ skill: 1 }],
    description: "TRISKEL.Forms.Drag.Description"
  },
  {
    key: "shield_pull",
    label: "TRISKEL.Forms.ShieldPull.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["bind"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Forms.ShieldPull.Description"
  },
  {
    key: "shield_cover",
    label: "TRISKEL.Forms.ShieldCover.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["evasion"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Forms.ShieldCover.Description"
  },
  {
    key: "blackmagic",
    label: "TRISKEL.Forms.Blackmagic.Label",
    cost: 1,
    reserve: "power",
    keywords: ["manifestation"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Forms.Blackmagic.Description"
  }
];
