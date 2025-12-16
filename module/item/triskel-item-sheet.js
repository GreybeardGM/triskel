import { onEditImage } from "../actor/sheet-helpers.js";

const getTriskellCodex = () => CONFIG.triskell?.codex ?? {};
const getTriskellIndex = () => CONFIG.triskell?.index ?? {};

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

const ACTION_REFERENCE_OPTIONS = () => (getTriskellCodex().actions ?? [])
  .map(action => ({ value: action.id, label: action.label ?? action.id }));

const FORM_REFERENCE_OPTIONS = () => (getTriskellCodex().forms ?? [])
  .map(form => ({ value: form.id, label: form.label ?? form.id }));

const MODIFIER_SKILL_OPTIONS = () => (getTriskellCodex().skills ?? [])
  .map(skill => ({ value: skill.id, label: skill.label ?? skill.id }));

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

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.item ??= this.document;
    context.system ??= this.document.system ?? {};

    const itemTypeKey = context.item?.type ?? "";
    const itemCategories = getTriskellIndex().itemCategories ?? {};
    const labelKey = itemCategories[itemTypeKey]?.label ?? `TRISKEL.Item.Type.${itemTypeKey}`;

    context.itemTypeLabel = labelKey || itemTypeKey;

    context.referenceOptions = {
      actions: ACTION_REFERENCE_OPTIONS(),
      forms: FORM_REFERENCE_OPTIONS()
    };
    context.references = {
      actions: this.constructor.prepareReferenceEntries(context.system.actions?.ref, getTriskellCodex().actions),
      forms: this.constructor.prepareReferenceEntries(context.system.forms?.ref, getTriskellCodex().forms)
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
      console.debug("[Triskel] #_appendReference aborted: duplicate key", { key });
      return null;
    }

    entries.push(key);
    console.debug("[Triskel] reference list AFTER", entries.slice());
    return this.document.update({ [refPath]: entries });
  }

  static _removeReferenceAt({ refPath, index }) {
    const entries = this.getReferenceList(refPath);
    if (!entries[index]) return null;

    console.debug("[Triskel] #_removeReferenceAt", { index, before: entries.slice() });

    entries.splice(index, 1);

    console.debug("[Triskel] #_removeReferenceAt after", entries.slice());
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

    console.debug("[Triskel] #_handleAddReference called", {
      selectField,
      refPath,
      key
    });

    if (!key) {
      console.debug("[Triskel] #_handleAddReference aborted: empty key");
      return;
    }

    const current = this.getReferenceList(refPath);
    console.debug("[Triskel] reference list BEFORE", current.slice());

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
