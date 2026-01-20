// form-codex.js
// Core combat forms for Triskel.
// Keys, reserves, and keyword references are lowercase for direct ID usage.

export const TRISKEL_FORMS = [
  {
    id: "power_strike",
    label: "TRISKEL.Form.PowerStrike.Label",
    cost: 1,
    reserve: "power",
    keyword: "strike",
    modifier: { skill: 2 },
    description: "TRISKEL.Form.PowerStrike.Description"
  },
  {
    id: "tripping_hook",
    label: "TRISKEL.Form.TrippingHook.Label",
    cost: 1,
    reserve: "grace",
    keyword: "expose",
    modifier: { skill: 2 },
    description: "TRISKEL.Form.TrippingHook.Description"
  },
  {
    id: "deny",
    label: "TRISKEL.Form.Deny.Label",
    cost: 1,
    reserve: "grace",
    keyword: "guard",
    description: "TRISKEL.Form.Deny.Description"
  },
  {
    id: "intercept",
    label: "TRISKEL.Form.Intercept.Label",
    cost: 2,
    reserve: "grace",
    keyword: "guard",
    description: "TRISKEL.Form.Intercept.Description"
  },
  {
    id: "precision_thrust",
    label: "TRISKEL.Form.PrecisionThrust.Label",
    cost: 1,
    reserve: "grace",
    keyword: "strike",
    modifier: { skill: 2 },
    description: "TRISKEL.Form.PrecisionThrust.Description"
  },
  {
    id: "sure_strike",
    label: "TRISKEL.Form.SureStrike.Label",
    cost: 1,
    reserve: "grace",
    keyword: "strike",
    modifier: { skill: 1 },
    description: "TRISKEL.Form.SureStrike.Description"
  },
  {
    id: "push_through",
    label: "TRISKEL.Form.PushThrough.Label",
    cost: 1,
    reserve: "power",
    keyword: "push",
    modifier: { skill: 2 },
    description: "TRISKEL.Form.PushThrough.Description"
  },
  {
    id: "counterguard",
    label: "TRISKEL.Form.Counterguard.Label",
    cost: 1,
    reserve: "grace",
    keyword: "guard",
    modifier: { skill: 2 },
    description: "TRISKEL.Form.Counterguard.Description"
  },
  {
    id: "break_stance",
    label: "TRISKEL.Form.BreakStance.Label",
    cost: 1,
    reserve: "power",
    keyword: "strike",
    description: "TRISKEL.Form.BreakStance.Description"
  },
  {
    id: "drag",
    label: "TRISKEL.Form.Drag.Label",
    cost: 1,
    reserve: "grace",
    keyword: "push",
    modifier: { skill: 1 },
    description: "TRISKEL.Form.Drag.Description"
  },
  {
    id: "shield_pull",
    label: "TRISKEL.Form.ShieldPull.Label",
    cost: 1,
    reserve: "grace",
    keyword: "bind",
    modifier: { skill: 2 },
    description: "TRISKEL.Form.ShieldPull.Description"
  },
  {
    id: "shield_cover",
    label: "TRISKEL.Form.ShieldCover.Label",
    cost: 1,
    reserve: "grace",
    keyword: "evasion",
    modifier: { skill: 2 },
    description: "TRISKEL.Form.ShieldCover.Description"
  },
  {
    id: "shield_brace",
    label: "TRISKEL.Form.ShieldBrace.Label",
    cost: 2,
    reserve: "power",
    keyword: "guard",
    description: "TRISKEL.Form.ShieldBrace.Description"
  }
];
