# Triskel Naming Conventions

This document defines the canonical terminology used in code for Actions and Forms.

## Goals

- Keep semantics strict in code.
- Keep canonical names in code and data paths.
- Avoid mixing gameplay concepts unintentionally.

## Core Terms

### Action Terms

- **Mundane Action**
  - An action that is not a spell-only action.
  - Typical source: `system.actions.ref`.

- **Spell Action**
  - An action that is exclusively spell-based.
  - Typical source: `system.spellActions.ref`.
  - Important: This does **not** rename the Item type `spell`.

- **Action** (generalized)
  - The merged runtime concept used by sheet rendering and roll logic.
  - Produced by combining Mundane Actions and Spell Actions.

### Form Terms

- **Mundane Form**
  - A form connected to Mundane Actions.
  - Typical source: `system.forms.ref`.

- **Spell Form**
  - A form connected to Spell Actions.
  - Typical source: `system.spellForms.ref`.

- **Form** (generalized)
  - The merged runtime concept used by sheet rendering and roll logic.
  - Produced by combining Mundane Forms and Spell Forms.

## Canonical Internal Naming

Use these names in code when expressing semantic source buckets:

- `mundaneActions`
- `spellActions`
- `mundaneForms`
- `spellForms`

Use these names for generalized runtime usage:

- `actions`
- `forms`

## Preferred Helper/Parameter Naming

When writing or refactoring helper logic:

- Prefer `actionsByType` over historical names like `actionLikes`.
- Prefer `formsByKeyword` or `forms` over historical names like `formLikes`.
- Prefer function names based on domain terms:
  - Example: `prepareActionsWithKeywords` (not `prepareActionLikesWithKeywords`).
  - Example: `enrichAction` (not `enrichActionLike`).

## Roll Helper Convention

The Roll Helper should operate on:

- `action` (selected generalized action)
- `action.forms` (selected/available generalized forms)

Avoid introducing compatibility aliases.

## Strictness Rule

- The naming convention is strict in code and data model.
- No backward-compatibility aliases should be added for terminology transitions.
- Only visible UI wording may deviate from canonical internal names.

Current canonical storage paths:

- `system.actions.ref` (Mundane Actions)
- `system.spellActions.ref` (Spell Actions)
- `system.forms.ref` (Mundane Forms)
- `system.spellForms.ref` (Spell Forms)
