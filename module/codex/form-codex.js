// form-codex.js
// Core combat forms for Triskel.
// Keys, reserves, and keyword references are lowercase for direct ID usage.

export const TRISKEL_FORMS = [
  {
    key: "power_strike",
    label: "TRISKEL.Form.PowerStrike.Label",
    cost: 1,
    reserve: "power",
    keywords: ["strike"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.PowerStrike.Description"
  },
  {
    key: "tripping_hook",
    label: "TRISKEL.Form.TrippingHook.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["expose"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.TrippingHook.Description"
  },
  {
    key: "locking_bind",
    label: "TRISKEL.Form.LockingBind.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["bind"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.LockingBind.Description"
  },
  {
    key: "precision_thrust",
    label: "TRISKEL.Form.PrecisionThrust.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["strike"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.PrecisionThrust.Description"
  },
  {
    key: "push_through",
    label: "TRISKEL.Form.PushThrough.Label",
    cost: 1,
    reserve: "power",
    keywords: ["push"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.PushThrough.Description"
  },
  {
    key: "counterguard",
    label: "TRISKEL.Form.Counterguard.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["guard"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.Counterguard.Description"
  },
  {
    key: "break_stance",
    label: "TRISKEL.Form.BreakStance.Label",
    cost: 1,
    reserve: "power",
    keywords: ["strike"],
    description: "TRISKEL.Form.BreakStance.Description"
  },
  {
    key: "drag",
    label: "TRISKEL.Form.Drag.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["push"],
    modifiers: [{ skill: 1 }],
    description: "TRISKEL.Form.Drag.Description"
  },
  {
    key: "shield_pull",
    label: "TRISKEL.Form.ShieldPull.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["bind"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.ShieldPull.Description"
  },
  {
    key: "shield_cover",
    label: "TRISKEL.Form.ShieldCover.Label",
    cost: 1,
    reserve: "grace",
    keywords: ["evasion"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.ShieldCover.Description"
  },
  {
    key: "blackmagic",
    label: "TRISKEL.Form.Blackmagic.Label",
    cost: 1,
    reserve: "power",
    keywords: ["manifestation"],
    modifiers: [{ skill: 2 }],
    description: "TRISKEL.Form.Blackmagic.Description"
  }
];
