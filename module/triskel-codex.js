// triskel-codex.js
// Master list of all Triskel Skills + Resistances

export const TRISKEL_SKILLS = {
  /* ---------------------------------- OFFENSE ---------------------------------- */
  strike: {
    id: "strike",
    label: "Strike",
    description: "Deliver direct melee attacks.",
    category: "Offense",
    phase: "Combat"
  },
  control: {
    id: "control",
    label: "Control",
    description: "Manipulate positioning, balance, or leverage in melee.",
    category: "Offense",
    phase: "Combat"
  },
  aim: {
    id: "aim",
    label: "Aim",
    description: "Execute accurate ranged attacks.",
    category: "Offense",
    phase: "Combat"
  },

  /* ---------------------------------- DEFENSE ---------------------------------- */
  guard: {
    id: "guard",
    label: "Guard",
    description: "Parry or deflect incoming attacks with technique.",
    category: "Defense",
    phase: "Combat"
  },
  brace: {
    id: "brace",
    label: "Brace",
    description: "Absorb force and stand firm against impact.",
    category: "Defense",
    phase: "Combat"
  },
  evasion: {
    id: "evasion",
    label: "Evasion",
    description: "Evade attacks through agility and trained movement.",
    category: "Defense",
    phase: "Combat"
  },

  /* --------------------------------- PHYSICAL --------------------------------- */
  athletics: {
    id: "athletics",
    label: "Athletics",
    description: "Perform physical feats of strength, speed, or motion.",
    category: "Physical",
    phase: "Travel"
  },
  notice: {
    id: "notice",
    label: "Notice",
    description: "Spot details, changes, or hidden elements in the environment.",
    category: "Physical",
    phase: "Travel"
  },
  stealth: {
    id: "stealth",
    label: "Stealth",
    description: "Avoid detection through silence, concealment, or timing.",
    category: "Physical",
    phase: "Travel"
  },
 
  /* ------------------------------- PROFESSIONAL ------------------------------- */
  craft: {
    id: "craft",
    label: "Craft",
    description: "Build, repair, or create functional equipment or tools.",
    category: "Professional",
    phase: "Preparation"
  },
  track: {
    id: "track",
    label: "Track",
    description: "Follow trails, signs, and environmental disturbances.",
    category: "Professional",
    phase: "Travel"
  },
  handleBeasts: {
    id: "handleBeasts",
    label: "Handle Beasts",
    description: "Manage mounts and animals, calm or direct creatures.",
    category: "Professional",
    phase: "Travel"
  },
  
  /* ---------------------------------- SOCIAL ---------------------------------- */
  impress: {
    id: "impress",
    label: "Impress",
    description: "Shape how others perceive you through presence and impact.",
    category: "Social",
    phase: "Preparation"
  },
  influence: {
    id: "influence",
    label: "Influence",
    description: "Shift another’s intentions through persuasion or pressure.",
    category: "Social",
    phase: "Preparation"
  },
  insight: {
    id: "insight",
    label: "Insight",
    description: "Read motives, patterns, and emotional cues.",
    category: "Social",
    phase: "Preparation"
  },

  /* ------------------------------- INTELLECTUAL ------------------------------- */
  lore: {
    id: "lore",
    label: "Lore",
    description: "Recall and apply stored knowledge.",
    category: "Intellectual",
    phase: "Preparation"
  },
  study: {
    id: "study",
    label: "Study",
    description: "Analyze texts, clues, maps, or structured data.",
    category: "Intellectual",
    phase: "Preparation"
  },
  navigate: {
    id: "navigate",
    label: "Navigate",
    description: "Chart routes, orient yourself, and read terrain or maps.",
    category: "Intellectual",
    phase: "Travel"
  },

  /* ----------------------------------- MAGIC ---------------------------------- */
  manifest: {
    id: "manifest",
    label: "Manifest",
    description: "Create or project raw magical force.",
    category: "Magic",
    phase: "Any"
  },
  alter: {
    id: "alter",
    label: "Alter",
    description: "Transform matter, bodies, or physical states.",
    category: "Magic",
    phase: "Any"
  },
  compel: {
    id: "compel",
    label: "Compel",
    description: "Impose force on minds, spirits, or entities.",
    category: "Magic",
    phase: "Any"
  },
  reveal: {
    id: "reveal",
    label: "Reveal",
    description: "Expose truth, detect hidden things, or gain insight.",
    category: "Magic",
    phase: "Any"
  },
  transpose: {
    id: "transpose",
    label: "Transpose",
    description: "Shift positions, move objects, or bend states and space.",
    category: "Magic",
    phase: "Any"
  },
  ward: {
    id: "ward",
    label: "Ward",
    description: "Create barriers, protections, or magical defenses.",
    category: "Magic",
    phase: "Any"
  },
  
  /* ------------------------------- RESISTANCES -------------------------------- */
  snap: {
    id: "snap",
    label: "Snap",
    description: "Instant reflex response to sudden threats.",
    category: "Resistance",
    phase: "Any"
  },
  grit: {
    id: "grit",
    label: "Grit",
    description: "Bodily toughness against pain, poison, and the elements.",
    category: "Resistance",
    phase: "Any"
  },
  resolve: {
    id: "resolve",
    label: "Resolve",
    description: "Mental resilience to fear, influence, or despair.",
    category: "Resistance",
    phase: "Any"
  }

};
