import { TRISKEL_BASE_ACTIONS, TRISKEL_ADVANCED_ACTIONS, TRISKEL_SPELLS } from "../codex/action-codex.js";
import { TRISKEL_FORMS } from "../codex/form-codex.js";
import { TRISKEL_RESERVES, TRISKEL_SKILLS } from "../codex/triskel-codex.js";

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

    const modifiers = this.#prepareSkillModifiers();
    this.system.modifiers = modifiers;
    this.#applySkillModifiers(modifiers);

    const selectedAction = this.system?.actions?.selected ?? null;
    const selectedForms = this.#normalizeSelectedForms(
      this.system?.actions?.selectedForms ?? this.system?.actions?.forms ?? []
    );
    const { actions, spells } = this.#prepareActionCollections({ selectedAction, selectedForms });
    this.system.actions = { actions, spells, selected: selectedAction, selectedForms };

  }

  #prepareSkillModifiers() {
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

  #applySkillModifiers(modifiers = []) {
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

  #normalizeReferenceList(entries = []) {
    if (!Array.isArray(entries)) return [];

    return entries
      .map(entry => (typeof entry === "string" ? entry : entry?.key ?? ""))
      .filter(Boolean);
  }

  #normalizeSelectedForms(selectedForms = []) {
    if (Array.isArray(selectedForms)) {
      return Array.from(new Set(this.#normalizeReferenceList(selectedForms)));
    }

    if (selectedForms && typeof selectedForms === "object") {
      const activeKeys = Object.entries(selectedForms)
        .filter(([, value]) => Boolean(value?.active ?? value))
        .map(([key]) => key);

      return Array.from(new Set(activeKeys));
    }

    return [];
  }

  #formatAction(action, { source, image }) {
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

  #formatForm(form, { source, image }) {
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

  #prepareActionCollections({ selectedAction = null, selectedForms = [] } = {}) {
    const actions = [];
    const spells = [];
    const forms = [];

    const actionKeys = new Set();
    const spellKeys = new Set();
    const formKeys = new Set();

    const addAction = (action, { source = null, image } = {}) => {
      if (!action?.key || actionKeys.has(action.key)) return;
      actionKeys.add(action.key);
      actions.push(this.#formatAction(action, { source, image }));
    };

    const addSpell = (spell, { source = null, image } = {}) => {
      if (!spell?.key || spellKeys.has(spell.key)) return;
      spellKeys.add(spell.key);
      spells.push(this.#formatAction(spell, { source, image }));
    };

    const addForm = (form, { source = null, image } = {}) => {
      if (!form?.key || formKeys.has(form.key)) return;
      formKeys.add(form.key);
      forms.push(this.#formatForm(form, { source, image }));
    };

    TRISKEL_BASE_ACTIONS.forEach(action => addAction(action, { image: action.image ?? action.img }));

    for (const item of Array.from(this.items ?? [])) {
      const actionRefs = this.#normalizeReferenceList(item.system?.actions?.ref);
      const formRefs = this.#normalizeReferenceList(item.system?.forms?.ref);

      actionRefs.forEach(actionKey => {
        const advancedAction = TRISKEL_ADVANCED_ACTIONS.find(entry => entry.key === actionKey);
        if (advancedAction) addAction(advancedAction, { source: item.id, image: item.img });

        const spell = TRISKEL_SPELLS.find(entry => entry.key === actionKey);
        if (spell) addSpell(spell, { source: item.id, image: item.img });
      });

      formRefs.forEach(formKey => {
        const form = TRISKEL_FORMS.find(entry => entry.key === formKey);
        if (form) addForm(form, { source: item.id, image: item.img });
      });
    }

    const formsByAction = forms.reduce((collection, form) => {
      for (const actionKey of form.actions ?? []) {
        if (!collection[actionKey]) collection[actionKey] = [];
        collection[actionKey].push({ ...form });
      }
      return collection;
    }, {});

    actions.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    spells.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    forms.forEach(form => {
      form.active = selectedForms.includes(form.key);
    });

    forms.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

    actions.forEach(action => {
      action.forms = formsByAction[action.key] ?? [];
      action.isSelected = action.key === selectedAction;
    });

    spells.forEach(spell => {
      spell.forms = formsByAction[spell.key] ?? [];
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
