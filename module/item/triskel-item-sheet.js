import { onEditImage } from "../actor/sheet-helpers.js";
import { TRISKEL_ALL_ACTIONS } from "../codex/action-codex.js";
import { TRISKEL_FORMS } from "../codex/form-codex.js";
import { TRISKEL_SKILLS } from "../codex/triskel-codex.js";

const localize = (value) => {
  if (!value) return "";

  try {
    return game?.i18n?.localize?.(value) ?? value;
  } catch (error) {
    console.warn("[Triskel] Failed to localize value", { value, error });
    return value;
  }
};

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const ACTION_REFERENCE_OPTIONS = () => TRISKEL_ALL_ACTIONS
  .map(action => ({ value: action.key, label: localize(action.label ?? action.key) }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

const FORM_REFERENCE_OPTIONS = () => TRISKEL_FORMS
  .map(form => ({ value: form.key, label: localize(form.label ?? form.key) }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

const MODIFIER_SKILL_OPTIONS = () => Object.values(TRISKEL_SKILLS)
  .map(skill => ({ value: skill.id, label: localize(skill.label ?? skill.id) }))
  .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

export class TriskelItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "item"],
    form: {
      submitOnChange: true
    },
    actions: {
      editImage: onEditImage,
      addActionReference: this.onAddActionReference,
      removeActionReference: this.onRemoveActionReference,
      addFormReference: this.onAddFormReference,
      removeFormReference: this.onRemoveFormReference,
      addModifier: this.onAddModifier,
      removeModifier: this.onRemoveModifier
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
      actions: ACTION_REFERENCE_OPTIONS(),
      forms: FORM_REFERENCE_OPTIONS()
    };
    context.references = {
      actions: this.constructor.prepareReferenceEntries(context.system.actions?.ref, TRISKEL_ALL_ACTIONS),
      forms: this.constructor.prepareReferenceEntries(context.system.forms?.ref, TRISKEL_FORMS)
    };
    context.modifiers = this.constructor.prepareModifiers(context.system.modifiers);
    context.modifierOptions = MODIFIER_SKILL_OPTIONS();

    console.debug("[Triskel] ItemSheet _prepareContext", {
      item: context.item?.name,
      referenceOptions: context.referenceOptions,
      modifierOptions: context.modifierOptions,
      system: context.system
    });

    return context;
  }

  static prepareReferenceEntries(entries = [], collection = []) {
    if (!Array.isArray(entries)) return [];

    return entries.map((entry, index) => {
      const key = typeof entry === "string" ? entry : entry?.key ?? "";
      const label = collection.find(item => item.key === key)?.label ?? key;

      return { key, label: localize(label), index };
    });
  }

  static prepareModifiers(modifiers = []) {
    if (!Array.isArray(modifiers)) return [];

    return modifiers.map((modifier, index) => {
      const skill = TRISKEL_SKILLS[modifier.skill] ?? {};

      return {
        ...modifier,
        label: localize(skill.label ?? modifier.skill ?? ""),
        index
      };
    });
  }

  getReferenceList(path) {
    const current = foundry.utils.getProperty(this.document, path);

    if (!Array.isArray(current)) return [];

    return current
      .map(entry => (typeof entry === "string" ? entry : entry?.key))
      .filter(Boolean);
  }

  // ---------- Add / Remove Actions ----------

  static async onAddActionReference(event, target) {
    event.preventDefault();

    const form = target.form;
    const selectField = target.dataset.selectField ?? "";              // aus data-select-field am Button
    const refPath = target.dataset.refPath ?? "system.actions.ref";    // aus data-ref-path am Button

    const select = form?.elements[selectField] ?? null;
    const key = select?.value ?? "";

    console.debug("[Triskel] #onAddActionReference called", {
      selectField,
      refPath,
      key
    });

    if (!key) {
      console.debug("[Triskel] #onAddActionReference aborted: empty key");
      return;
    }

    const current = this.getReferenceList(refPath);
    console.debug("[Triskel] actions ref list BEFORE", current.slice());

    current.push(key);

    console.debug("[Triskel] actions ref list AFTER", current.slice());
    await this.document.update({ [refPath]: current });
  }

  static async onRemoveActionReference(event, target) {
    event.preventDefault();

    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    const current = this.getReferenceList("system.actions.ref");
    if (!current[index]) return;

    console.debug("[Triskel] #onRemoveActionReference", { index, before: current.slice() });

    current.splice(index, 1);

    console.debug("[Triskel] #onRemoveActionReference after", current.slice());
    await this.document.update({ "system.actions.ref": current });
  }

  // ---------- Add / Remove Forms ----------

  static async onAddFormReference(event, target) {
    event.preventDefault();

    const form = target.form;
    const selectField = target.dataset.selectField ?? "";
    const refPath = target.dataset.refPath ?? "system.forms.ref";

    const select = form?.elements[selectField] ?? null;
    const key = select?.value ?? "";

    console.debug("[Triskel] #onAddFormReference called", {
      selectField,
      refPath,
      key
    });

    if (!key) {
      console.debug("[Triskel] #onAddFormReference aborted: empty key");
      return;
    }

    const current = this.getReferenceList(refPath);
    console.debug("[Triskel] forms ref list BEFORE", current.slice());

    current.push(key);

    console.debug("[Triskel] forms ref list AFTER", current.slice());
    await this.document.update({ [refPath]: current });
  }

  static async onRemoveFormReference(event, target) {
    event.preventDefault();

    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    const current = this.getReferenceList("system.forms.ref");
    if (!current[index]) return;

    console.debug("[Triskel] #onRemoveFormReference", { index, before: current.slice() });

    current.splice(index, 1);

    console.debug("[Triskel] #onRemoveFormReference after", current.slice());
    await this.document.update({ "system.forms.ref": current });
  }

  // ---------- Add / Remove Modifiers ----------

  static async onAddModifier(event, target) {
    event.preventDefault();

    const form = target.form;
    const skillField = target.dataset.skillField ?? "";
    const valueField = target.dataset.valueField ?? "";
    const refPath = target.dataset.refPath ?? "system.modifiers";

    const skillInput = form?.elements[skillField] ?? null;
    const valueInput = form?.elements[valueField] ?? null;

    const skill = skillInput?.value ?? "";
    const value = Number(valueInput?.value ?? NaN);

    console.debug("[Triskel] #onAddModifier called", {
      skillField,
      valueField,
      refPath,
      skill,
      rawValue: valueInput?.value
    });

    if (!skill || !Number.isFinite(value)) {
      console.debug("[Triskel] #onAddModifier aborted: invalid skill/value");
      return;
    }

    const modifiers = foundry.utils.duplicate(this.document.system?.modifiers ?? []);
    console.debug("[Triskel] modifiers BEFORE", modifiers.slice());

    modifiers.push({ skill, value });

    console.debug("[Triskel] modifiers AFTER", modifiers.slice());
    await this.document.update({ [refPath]: modifiers });

    if (valueInput) valueInput.value = "0";
  }

  static async onRemoveModifier(event, target) {
    event.preventDefault();

    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    const modifiers = foundry.utils.duplicate(this.document.system?.modifiers ?? []);
    if (!Array.isArray(modifiers) || !modifiers[index]) return;

    console.debug("[Triskel] #onRemoveModifier", { index, before: modifiers.slice() });

    modifiers.splice(index, 1);

    console.debug("[Triskel] #onRemoveModifier after", modifiers.slice());
    await this.document.update({ "system.modifiers": modifiers });
  }
}
