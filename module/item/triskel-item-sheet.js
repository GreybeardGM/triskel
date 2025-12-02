import { TRISKEL_ACTIONS } from "../codex/action-codex.js";
import { TRISKEL_SKILLS } from "../codex/triskel-codex.js";

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const ACTION_REFERENCE_OPTIONS = TRISKEL_ACTIONS
  .map(action => ({ value: `action:${action.key}`, label: action.label ?? action.key }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

const SKILL_REFERENCE_OPTIONS = Object.values(TRISKEL_SKILLS)
  .map(skill => ({ value: `skill:${skill.id}`, label: skill.label ?? skill.id }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

const MODIFIER_SKILL_OPTIONS = Object.values(TRISKEL_SKILLS)
  .map(skill => ({ value: skill.id, label: skill.label ?? skill.id }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

export class TriskelItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "item"],
    form: {
      submitOnChange: true
    },
    actions: {
      addReference: this.#onAddReference,
      removeReference: this.#onRemoveReference,
      addModifier: this.#onAddModifier,
      removeModifier: this.#onRemoveModifier
    },
    window: {
      resizable: true
    }
  };

  static PARTS = {
    details: {
      id: "details",
      template: "systems/triskel/templates/item/triskel-item-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.item ??= this.document;
    context.system ??= this.document.system ?? {};

    context.referenceOptions = {
      actions: ACTION_REFERENCE_OPTIONS,
      skills: SKILL_REFERENCE_OPTIONS
    };
    context.references = {
      actions: this.constructor.#prepareReferenceEntries(context.system.actions?.ref),
      forms: this.constructor.#prepareReferenceEntries(context.system.forms?.ref)
    };
    context.modifiers = this.constructor.#prepareModifiers(context.system.modifiers);
    context.modifierOptions = MODIFIER_SKILL_OPTIONS;

    return context;
  }

  static #prepareReferenceEntries(entries = []) {
    if (!Array.isArray(entries)) return [];

    return entries.map((entry, index) => {
      const normalized = typeof entry === "string" ? { type: "action", key: entry } : entry ?? {};
      const type = normalized.type === "skill" ? "skill" : "action";
      const key = normalized.key ?? "";

      const label = type === "action"
        ? (TRISKEL_ACTIONS.find(action => action.key === key)?.label ?? key)
        : (TRISKEL_SKILLS[key]?.label ?? key);

      return { ...normalized, type, key, label, index };
    });
  }

  static #prepareModifiers(modifiers = []) {
    if (!Array.isArray(modifiers)) return [];

    return modifiers.map((modifier, index) => {
      const skill = TRISKEL_SKILLS[modifier.skill] ?? {};

      return {
        ...modifier,
        label: skill.label ?? modifier.skill ?? "",
        index
      };
    });
  }

  static #pathForList(list) {
    if (list === "actions") return "system.actions.ref";
    if (list === "forms") return "system.forms.ref";
    return null;
  }

  static async #onAddReference(event, target) {
    event.preventDefault();

    const list = target.dataset.list;
    const path = this.#pathForList(list);
    if (!path) return;

    const select = target.closest("form")?.querySelector(`[data-reference-select="${list}"]`);
    const value = select?.value ?? "";

    if (!value) return;

    const [type, key] = value.split(":");
    if (!type || !key) return;

    const current = foundry.utils.duplicate(foundry.utils.getProperty(this.document, path) ?? []);
    current.push({ type, key });

    await this.document.update({ [path]: current });
  }

  static async #onRemoveReference(event, target) {
    event.preventDefault();

    const list = target.dataset.list;
    const index = Number(target.dataset.index ?? -1);
    const path = this.#pathForList(list);

    if (!path || index < 0) return;

    const current = foundry.utils.duplicate(foundry.utils.getProperty(this.document, path) ?? []);
    if (!Array.isArray(current) || !current[index]) return;

    current.splice(index, 1);

    await this.document.update({ [path]: current });
  }

  static async #onAddModifier(event, target) {
    event.preventDefault();

    const form = target.closest("form");
    const skill = form?.querySelector("[data-modifier-skill]")?.value ?? "";
    const valueInput = form?.querySelector("[data-modifier-value]");
    const value = Number(valueInput?.value ?? NaN);

    if (!skill || !Number.isFinite(value)) return;

    const modifiers = foundry.utils.duplicate(this.document.system?.modifiers ?? []);
    modifiers.push({ skill, value });

    await this.document.update({ "system.modifiers": modifiers });
  }

  static async #onRemoveModifier(event, target) {
    event.preventDefault();

    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    const modifiers = foundry.utils.duplicate(this.document.system?.modifiers ?? []);
    if (!Array.isArray(modifiers) || !modifiers[index]) return;

    modifiers.splice(index, 1);

    await this.document.update({ "system.modifiers": modifiers });
  }
}
