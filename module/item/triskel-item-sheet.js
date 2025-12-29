import { onEditImage } from "../actor/sheet-helpers.js";
import { getCachedCollator } from "../util/collator.js";

const getTriskellIndex = () => CONFIG.triskell?.index ?? {};

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class TriskelItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;

    const triskellIndex = getTriskellIndex();

    const actionRefs = this.getReferenceList("system.actions.ref");
    const formRefs = this.getReferenceList("system.forms.ref");
    const spellRefs = this.getReferenceList("system.spells.ref");
    const attunementRefs = this.getReferenceList("system.attunements.ref");

    const references = {
      actions: this.constructor.prepareReferenceEntries(actionRefs, Object.values(triskellIndex.advancedActions ?? {})),
      forms: this.constructor.prepareReferenceEntries(formRefs, Object.values(triskellIndex.forms ?? {})),
      spells: this.constructor.prepareReferenceEntries(spellRefs, Object.values(triskellIndex.spells ?? {})),
      attunements: this.constructor.prepareReferenceEntries(attunementRefs, Object.values(triskellIndex.attunements ?? {}))
    };

    const referenceOptions = {
      actions: this.constructor.prepareOptions(triskellIndex.advancedActions ?? {}),
      forms: this.constructor.prepareOptions(triskellIndex.forms),
      spells: this.constructor.prepareOptions(triskellIndex.spells),
      attunements: this.constructor.prepareOptions(triskellIndex.attunements)
    };

    const modifiers = this.constructor.prepareModifiers(this.document.system?.modifiers);
    const modifierOptions = this.constructor.prepareOptions(triskellIndex.skills);

    const itemTypeLabel = CONFIG.Item?.typeLabels?.[this.document.type] ?? this.document.type ?? "";

    return {
      ...context,
      document: context.document ?? item,
      item: context.item ?? item,
      system: context.system ?? item?.system ?? {},
      references,
      referenceOptions,
      modifiers,
      modifierOptions,
      itemTypeLabel
    };
  }

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
      addSpellReference: this.onAddSpellReference,
      removeSpellReference: this.onRemoveSpellReference,
      addAttunementReference: this.onAddAttunementReference,
      removeAttunementReference: this.onRemoveAttunementReference,
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
    spells: {
      id: "spells",
      template: "systems/triskel/templates/item/triskel-item-spells.hbs"
    },
    attunements: {
      id: "attunements",
      template: "systems/triskel/templates/item/triskel-item-attunements.hbs"
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

  static prepareOptions(collection = {}) {
    const collator = getCachedCollator(game.i18n?.lang, { sensitivity: "base" });
    const entries = Array.isArray(collection) ? collection : Object.values(collection ?? {});

    const options = entries
      .filter(entry => entry?.id)
      .map(entry => ({
        value: entry.id,
        label: entry.label ?? entry.id
      }));

    options.sort((a, b) => collator.compare(a.label ?? a.value ?? "", b.label ?? b.value ?? ""));

    return options;
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

    const key = this.constructor._getSelectValue(target, selectField);

    if (!key) {
      return;
    }

    const current = this.getReferenceList(refPath);

    await this.constructor._appendReference.call(this, { refPath, entries: current, key });
  }

  static async _handleRemoveReference(event, target, { defaultRefPath }) {
    event.preventDefault();

    const refPath = target.dataset.refPath ?? defaultRefPath;
    const index = Number(target.dataset.index ?? -1);
    if (index < 0) return;

    await this.constructor._removeReferenceAt.call(this, { refPath, index });
  }

  // ---------- Add / Remove Actions ----------

  static async onAddActionReference(event, target) {
    await this.constructor._handleAddReference.call(this, event, target, {
      defaultSelectField: "",
      defaultRefPath: "system.actions.ref"
    });
  }

  static async onRemoveActionReference(event, target) {
    await this.constructor._handleRemoveReference.call(this, event, target, { defaultRefPath: "system.actions.ref" });
  }

  // ---------- Add / Remove Forms ----------

  static async onAddFormReference(event, target) {
    await this.constructor._handleAddReference.call(this, event, target, {
      defaultSelectField: "",
      defaultRefPath: "system.forms.ref"
    });
  }

  static async onRemoveFormReference(event, target) {
    await this.constructor._handleRemoveReference.call(this, event, target, { defaultRefPath: "system.forms.ref" });
  }

  // ---------- Add / Remove Spells ----------

  static async onAddSpellReference(event, target) {
    await this.constructor._handleAddReference.call(this, event, target, {
      defaultSelectField: "",
      defaultRefPath: "system.spells.ref"
    });
  }

  static async onRemoveSpellReference(event, target) {
    await this.constructor._handleRemoveReference.call(this, event, target, { defaultRefPath: "system.spells.ref" });
  }

  // ---------- Add / Remove Attunements ----------

  static async onAddAttunementReference(event, target) {
    await this.constructor._handleAddReference.call(this, event, target, {
      defaultSelectField: "",
      defaultRefPath: "system.attunements.ref"
    });
  }

  static async onRemoveAttunementReference(event, target) {
    await this.constructor._handleRemoveReference.call(this, event, target, { defaultRefPath: "system.attunements.ref" });
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
