import { onEditImage } from "../actor/sheet-helpers.js";

const getTriskellIndex = () => CONFIG.triskell?.index ?? {};

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class TriskelItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
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
    header: {
      id: "header",
      template: "systems/triskel/templates/item/triskel-item-header.hbs"
    },
    actions: {
      id: "actions",
      template: "systems/triskel/templates/item/triskel-item-actions.hbs"
    },
    forms: {
      id: "forms",
      template: "systems/triskel/templates/item/triskel-item-forms.hbs"
    },
    modifiers: {
      id: "modifiers",
      template: "systems/triskel/templates/item/triskel-item-modifiers.hbs"
    }
  };

  static prepareReferenceEntries(entries = [], collection = []) {
    if (!Array.isArray(entries)) return [];

    return entries.map((entry, index) => {
      const id = typeof entry === "string" ? entry : entry?.id ?? "";
      const label = collection.find(item => item.id === id)?.label ?? id;

      return { id, label, index };
    });
  }

  static prepareModifiers(modifiers = []) {
    if (!Array.isArray(modifiers)) return [];

    const skillsById = getTriskellIndex().skills ?? {};

    return modifiers.map((modifier, index) => {
      const skill = skillsById[modifier.skill] ?? {};

      return {
        ...modifier,
        label: skill.label ?? modifier.skill ?? "",
        index
      };
    });
  }

  static _getSelectValue(target, selectField) {
    const form = target.form;
    const select = form?.elements[selectField] ?? null;

    return select?.value ?? "";
  }

  static _appendReference({ refPath, entries, key }) {
    if (entries.includes(key)) {
      return null;
    }

    entries.push(key);
    return this.document.update({ [refPath]: entries });
  }

  static _removeReferenceAt({ refPath, index }) {
    const entries = this.getReferenceList(refPath);
    if (!entries[index]) return null;

    entries.splice(index, 1);
    return this.document.update({ [refPath]: entries });
  }

  getReferenceList(path) {
    const current = foundry.utils.getProperty(this.document, path);

    if (!Array.isArray(current)) return [];

    return current
      .map(entry => (typeof entry === "string" ? entry : entry?.id))
      .filter(Boolean);
  }

  static async _handleAddReference(event, target, { defaultSelectField, defaultRefPath }) {
    event.preventDefault();

    const selectField = target.dataset.selectField ?? defaultSelectField;
    const refPath = target.dataset.refPath ?? defaultRefPath;

    const key = this._getSelectValue(target, selectField);

    if (!key) {
      return;
    }

    const current = this.getReferenceList(refPath);

    await this._appendReference({ refPath, entries: current, key });
  }

  static async _handleRemoveReference(event, target, { defaultRefPath }) {
    event.preventDefault();

    const refPath = target.dataset.refPath ?? defaultRefPath;
    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    await this._removeReferenceAt({ refPath, index });
  }

  // ---------- Add / Remove Actions ----------

  static async onAddActionReference(event, target) {
    await this._handleAddReference(event, target, {
      defaultSelectField: "",
      defaultRefPath: "system.actions.ref"
    });
  }

  static async onRemoveActionReference(event, target) {
    await this._handleRemoveReference(event, target, { defaultRefPath: "system.actions.ref" });
  }

  // ---------- Add / Remove Forms ----------

  static async onAddFormReference(event, target) {
    await this._handleAddReference(event, target, {
      defaultSelectField: "",
      defaultRefPath: "system.forms.ref"
    });
  }

  static async onRemoveFormReference(event, target) {
    await this._handleRemoveReference(event, target, { defaultRefPath: "system.forms.ref" });
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

    if (!skill || !Number.isFinite(value)) {
      return;
    }

    const modifiers = foundry.utils.duplicate(this.document.system?.modifiers ?? []);

    modifiers.push({ skill, value });
    await this.document.update({ [refPath]: modifiers });

    if (valueInput) valueInput.value = "0";
  }

  static async onRemoveModifier(event, target) {
    event.preventDefault();

    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    const modifiers = foundry.utils.duplicate(this.document.system?.modifiers ?? []);
    if (!Array.isArray(modifiers) || !modifiers[index]) return;

    modifiers.splice(index, 1);
    await this.document.update({ "system.modifiers": modifiers });
  }
}
