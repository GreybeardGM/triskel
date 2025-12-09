import { TRISKEL_BASE_ACTIONS, TRISKEL_ADVANCED_ACTIONS, TRISKEL_SPELLS } from "../codex/action-codex.js";
import { TRISKEL_FORMS } from "../codex/form-codex.js";
import { TRISKEL_RESERVES, TRISKEL_SKILLS } from "../codex/triskel-codex.js";

const createLookupByKey = (collection = []) => new Map(
  (Array.isArray(collection) ? collection : [])
    .filter(entry => entry?.key)
    .map(entry => [entry.key, entry])
);

const ADVANCED_ACTIONS_BY_KEY = createLookupByKey(TRISKEL_ADVANCED_ACTIONS);
const SPELLS_BY_KEY = createLookupByKey(TRISKEL_SPELLS);
const FORMS_BY_KEY = createLookupByKey(TRISKEL_FORMS);

const localize = (value) => {
  if (!value) return "";

  try {
    return game?.i18n?.localize?.(value) ?? value;
  } catch (error) {
    console.warn("[Triskel] Failed to localize value", { value, error });
    return value;
  }
};

export class TriskelActor extends Actor {
  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
    // Platz für allgemeine Sachen für alle Actor
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    // Globale Ableitungen für alle Actor-Typen
    const reserves = this.system?.reserves ?? {};
    for (const reserve of Object.values(reserves)) {
      if (!reserve?.strain) continue;
      const strainValues = Object.values(reserve.strain);
      const minimumFromStrain = strainValues.reduce(
        (total, isActive) => total + (isActive ? 1 : 0),
        0
      );
      reserve.min = minimumFromStrain;
    }

    const modifiers = this._prepareSkillModifiers();
    this.system.modifiers = modifiers;
    this._applySkillModifiers(modifiers);

    const selectedAction = this.system?.actions?.selected ?? null;
    const selectedForms = this._normalizeSelectedForms(this.system?.actions?.selectedForms ?? []);
    const { actions, spells } = this._prepareActionCollections({ selectedAction, selectedForms });
    this.system.actions = { actions, spells, selected: selectedAction, selectedForms };

  }

  _prepareSkillModifiers() {
    const modifiersBySkill = {};

    for (const item of Array.from(this.items ?? [])) {
      const itemModifiers = Array.isArray(item?.system?.modifiers)
        ? item.system.modifiers
        : [];

      const image = item.img ?? item.image ?? null;

      for (const modifier of itemModifiers) {
        const skill = modifier?.skill ?? modifier?.key ?? modifier?.id ?? "";
        if (!skill) continue;

        const parsedValue = Number(modifier.value);
        const value = Number.isFinite(parsedValue) ? parsedValue : 0;
        const existing = modifiersBySkill[skill];

        if (!existing || value > (existing.value ?? 0)) {
          modifiersBySkill[skill] = {
            ...modifier,
            skill,
            value,
            source: item.id ?? null,
            image
          };
        }
      }
    }

    return Object.values(modifiersBySkill).map(modifier => {
      const skill = TRISKEL_SKILLS[modifier.skill] ?? {};

      return {
        ...modifier,
        label: localize(skill.label ?? modifier.skill ?? "")
      };
    });
  }

  _applySkillModifiers(modifiers = []) {
    const skills = this.system?.skills ?? {};

    const modifiersBySkill = modifiers.reduce((collection, modifier) => {
      const skill = modifier?.skill ?? "";
      if (!skill) return collection;

      collection[skill] = modifier;
      return collection;
    }, {});

    Object.entries(skills).forEach(([skillId, skillData]) => {
      if (!skillData) return;

      const parsedValue = Number(skillData.value);
      const value = Number.isFinite(parsedValue) ? parsedValue : 0;

      const parsedMod = Number(modifiersBySkill[skillId]?.value ?? 0);
      const mod = Number.isFinite(parsedMod) ? parsedMod : 0;

      skillData.mod = mod;
      skillData.total = value + mod;
    });
  }

  _normalizeReferenceList(entries = []) {
    if (!Array.isArray(entries)) return [];

    return entries
      .map(entry => (typeof entry === "string" ? entry : entry?.key ?? ""))
      .filter(Boolean);
  }

  _normalizeSelectedForms(selectedForms = []) {
    if (!Array.isArray(selectedForms)) return [];

    return Array.from(new Set(this._normalizeReferenceList(selectedForms)));
  }

  _formatAction(action, { source, image }) {
    const skill = TRISKEL_SKILLS[action.skill] ?? {};
    const reserve = TRISKEL_RESERVES[action.reserve] ?? {};
    const actorSkill = this.system?.skills?.[action.skill] ?? {};

    const parsedSkillTotal = Number(actorSkill.total ?? actorSkill.value ?? 0);
    const skillTotal = Number.isFinite(parsedSkillTotal) ? parsedSkillTotal : 0;

    return {
      ...action,
      label: localize(action.label ?? action.key),
      description: localize(action.description ?? ""),
      skillLabel: localize(skill.label ?? action.skill ?? ""),
      reserveLabel: localize(reserve.label ?? action.reserve ?? ""),
      skillTotal,
      source,
      image: image ?? action.image ?? action.img ?? null
    };
  }

  _formatForm(form, { source, image }) {
    const reserve = TRISKEL_RESERVES[form.reserve] ?? {};
    const skill = TRISKEL_SKILLS[form.skill] ?? {};

    return {
      ...form,
      label: localize(form.label ?? form.key),
      description: localize(form.description ?? ""),
      reserveLabel: localize(reserve.label ?? form.reserve ?? ""),
      skillLabel: localize(skill.label ?? form.skill ?? ""),
      source,
      image: image ?? form.image ?? form.img ?? null
    };
  }

  _prepareActionCollections({ selectedAction = null, selectedForms = [] } = {}) {
    const actions = [];
    const spells = [];
    const forms = [];

    const actionKeys = new Set();
    const spellKeys = new Set();
    const formKeys = new Set();

    const addAction = (action, { source = null, image } = {}) => {
      if (!action?.key || actionKeys.has(action.key)) return;
      actionKeys.add(action.key);
      actions.push(this._formatAction(action, { source, image }));
    };

    const addSpell = (spell, { source = null, image } = {}) => {
      if (!spell?.key || spellKeys.has(spell.key)) return;
      spellKeys.add(spell.key);
      spells.push(this._formatAction(spell, { source, image }));
    };

    const addForm = (form, { source = null, image } = {}) => {
      if (!form?.key || formKeys.has(form.key)) return;
      formKeys.add(form.key);
      forms.push(this._formatForm(form, { source, image }));
    };

    TRISKEL_BASE_ACTIONS.forEach(action => addAction(action, { image: action.image ?? action.img }));

    const itemsById = new Map(Array.from(this.items ?? []).map(item => [item.id, item]));

    const equippedGear = this.system?.equippedGear ?? {};
    const sanitizeEquippedList = (entries = []) => this
      ._normalizeReferenceList(entries)
      .filter(itemId => itemsById.has(itemId));

    const sanitizedEquippedGear = {
      Worn: sanitizeEquippedList(equippedGear?.Worn ?? []),
      Held: sanitizeEquippedList(equippedGear?.Held ?? []),
      Spells: sanitizeEquippedList(equippedGear?.Spells ?? []),
      Abilities: sanitizeEquippedList(equippedGear?.Abilities ?? [])
    };

    this.system.equippedGear = sanitizedEquippedGear;

    const equippedIds = [
      ...sanitizedEquippedGear.Worn,
      ...sanitizedEquippedGear.Held,
      ...sanitizedEquippedGear.Spells,
      ...sanitizedEquippedGear.Abilities
    ];

    for (const itemId of this._normalizeReferenceList(equippedIds)) {
      const item = itemsById.get(itemId);
      if (!item) continue;

      const actionRefs = this._normalizeReferenceList(item.system?.actions?.ref);
      const formRefs = this._normalizeReferenceList(item.system?.forms?.ref);

      actionRefs.forEach(actionKey => {
        const advancedAction = ADVANCED_ACTIONS_BY_KEY.get(actionKey);
        if (advancedAction) addAction(advancedAction, { source: item.id, image: item.img });

        const spell = SPELLS_BY_KEY.get(actionKey);
        if (spell) addSpell(spell, { source: item.id, image: item.img });
      });

      formRefs.forEach(formKey => {
        const form = FORMS_BY_KEY.get(formKey);
        if (form) addForm(form, { source: item.id, image: item.img });
      });
    }

    actions.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    spells.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    forms.forEach(form => {
      form.active = selectedForms.includes(form.key);
    });

    forms.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

    const hasAllKeywords = (formKeywords = [], entryKeywords = []) => {
      const normalizedFormKeywords = (Array.isArray(formKeywords) ? formKeywords : [])
        .map(keyword => `${keyword}`.trim().toLowerCase())
        .filter(Boolean);
      const normalizedEntryKeywords = new Set(
        (Array.isArray(entryKeywords) ? entryKeywords : [])
          .map(keyword => `${keyword}`.trim().toLowerCase())
          .filter(Boolean)
      );

      return normalizedFormKeywords.length > 0
        ? normalizedFormKeywords.every(keyword => normalizedEntryKeywords.has(keyword))
        : false;
    };

    const findMatchingForms = entry =>
      forms.filter(form => hasAllKeywords(form.keywords ?? [], entry?.keywords ?? []));

    actions.forEach(action => {
      action.forms = findMatchingForms(action);
      action.isSelected = action.key === selectedAction;
    });

    spells.forEach(spell => {
      spell.forms = findMatchingForms(spell);
      spell.isSelected = spell.key === selectedAction;
    });

    return { actions, spells };
  }

  /**
   * Roll the standard Triskel 2d10 (tens-as-zero) test with optional modifiers.
   *
   * @param {object} [config={}]             - Configuration for the roll.
   * @param {Array<{label?: string, value?: number}>} [config.modifiers=[]]
   *   Collection of labeled bonuses or penalties to apply to the roll.
   * @param {number|null} [config.difficulty=null]
   *   Optional difficulty value (not yet used mechanically).
   * @param {object} [config.options={}]     - Placeholder for future options.
   */
  async rollTriskelDice({ modifiers = [], difficulty = null, options = {} } = {}) {
    const baseRoll = await (new Roll("2d10")).evaluate({ async: true });
    const d10Term = baseRoll.dice.find(die => die.faces === 10);
    const [firstResult, secondResult] = d10Term?.results ?? [];

    const convertResult = value => (value === 10 ? 0 : value ?? 0);
    const firstValue = convertResult(firstResult?.result);
    const secondValue = convertResult(secondResult?.result);

    if (game.dice3d) {
      const rollMode = game.settings.get("core", "rollMode");
      const gmRecipients = ChatMessage.getWhisperRecipients("GM").map(user => user.id);
      let whisper = null;
      let blind = false;
      switch (rollMode) {
        case "selfroll":
          whisper = [game.user.id];
          break;
        case "gmroll":
          whisper = gmRecipients;
          break;
        case "blindroll":
          whisper = gmRecipients;
          blind = true;
          break;
        default:
          whisper = null;
      }

      try {
        await game.dice3d.showForRoll(baseRoll, game.user, true, whisper ?? [], blind);
      }
      catch (error) {
        console.warn("Triskel | Dice So Nice error:", error);
      }
    }

    const normalizedModifiers = modifiers
      .map(modifier => ({
        label: modifier?.label ?? "Modifier",
        value: Number(modifier?.value ?? 0)
      }))
      .filter(modifier => !Number.isNaN(modifier.value) && modifier.value !== 0);

    const expressionValues = [firstValue, secondValue, ...normalizedModifiers.map(mod => mod.value)];
    const expression = expressionValues
      .map((value, index) => {
        if (index === 0) return `${value}`;
        const operator = value >= 0 ? "+" : "-";
        return `${operator} ${Math.abs(value)}`;
      })
      .join(" ");

    const finalRoll = await (new Roll(expression)).evaluate({ async: true });

    const modifierSummary = normalizedModifiers.length
      ? normalizedModifiers
        .map(mod => `${mod.label} (${mod.value >= 0 ? "+" : ""}${mod.value})`)
        .join(", ")
      : "None";

    const flavorParts = ["2d10 (10→0)"];
    if (normalizedModifiers.length) {
      flavorParts.push(`Modifiers: ${modifierSummary}`);
    }
    if (Number.isFinite(difficulty)) {
      flavorParts.push(`Difficulty: ${difficulty}`);
    }

    const rollMode = game.settings.get("core", "rollMode");
    await finalRoll.toMessage(
      {
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: flavorParts.join(" | ")
      },
      { rollMode }
    );

    return {
      baseRoll,
      finalRoll,
      diceValues: [firstValue, secondValue],
      modifiers: normalizedModifiers,
      difficulty,
      options
    };
  }
}
