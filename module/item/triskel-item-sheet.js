import { TRISKEL_ACTIONS } from "../codex/action-codex.js";
import { TRISKEL_FORMS } from "../codex/form-codex.js";
import { TRISKEL_SKILLS } from "../codex/triskel-codex.js";

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const ACTION_REFERENCE_OPTIONS = TRISKEL_ACTIONS
  .map(action => ({ value: action.key, label: action.label ?? action.key }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

const FORM_REFERENCE_OPTIONS = TRISKEL_FORMS
  .map(form => ({ value: form.key, label: form.label ?? form.key }))
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
      addActionReference: this.#onAddActionReference,
      removeActionReference: this.#onRemoveActionReference,
      addFormReference: this.#onAddFormReference,
      removeFormReference: this.#onRemoveFormReference,
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
      forms: FORM_REFERENCE_OPTIONS
    };
    context.references = {
      actions: this.constructor.#prepareReferenceEntries(context.system.actions?.ref, TRISKEL_ACTIONS),
      forms: this.constructor.#prepareReferenceEntries(context.system.forms?.ref, TRISKEL_FORMS)
    };
    context.modifiers = this.constructor.#prepareModifiers(context.system.modifiers);
    context.modifierOptions = MODIFIER_SKILL_OPTIONS;

    return context;
  }

  static #prepareReferenceEntries(entries = [], collection = []) {
    if (!Array.isArray(entries)) return [];

    return entries.map((entry, index) => {
      const key = typeof entry === "string" ? entry : entry?.key ?? "";
      const label = collection.find(item => item.key === key)?.label ?? key;

      return { key, label, index };
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

  static #getReferenceList(path) {
    const current = foundry.utils.getProperty(this.document, path);

    if (!Array.isArray(current)) return [];

    return current
      .map(entry => (typeof entry === "string" ? entry : entry?.key))
      .filter(Boolean);
  }

  static async #onAddActionReference(event, target) {
    event.preventDefault();

    const select = target.closest("form")?.querySelector('[data-reference-select="actions"]');
    const key = select?.value ?? "";

    if (!key) return;

    const current = this.#getReferenceList("system.actions.ref");

    current.push(key);

    await this.document.update({ "system.actions.ref": current });
  }

  static async #onRemoveActionReference(event, target) {
    event.preventDefault();

    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    const current = this.#getReferenceList("system.actions.ref");

    if (!current[index]) return;

    current.splice(index, 1);

    await this.document.update({ "system.actions.ref": current });
  }

  static async #onAddFormReference(event, target) {
    event.preventDefault();

    const select = target.closest("form")?.querySelector('[data-reference-select="forms"]');
    const key = select?.value ?? "";

    if (!key) return;

    const current = this.#getReferenceList("system.forms.ref");

    current.push(key);

    await this.document.update({ "system.forms.ref": current });
  }

  static async #onRemoveFormReference(event, target) {
    event.preventDefault();

    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    const current = this.#getReferenceList("system.forms.ref");

    if (!current[index]) return;

    current.splice(index, 1);

    await this.document.update({ "system.forms.ref": current });
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
