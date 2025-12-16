import {
  normalizeIdList,
  normalizeKeywords,
  toFiniteNumber,
  toFiniteNumbers
} from "../util/normalization.js";
import { chatOutput } from "../util/chat-output.js";
import { convertD10TensToZero } from "../util/roll.js";

const getTriskellIndex = () => CONFIG.triskell?.index ?? {};
const getTriskellCodex = () => CONFIG.triskell?.codex ?? {};

export class TriskelActor extends Actor {
  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
    // Platz für allgemeine Sachen für alle Actor
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    const triskellIndex = getTriskellIndex();

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

    const tension = toFiniteNumber(this.system?.tension?.value);
    const tierValue = toFiniteNumber(this.system?.tier?.value);
    const commit = this.system?.actions?.commit ?? null;
    if (commit) {
      commit.max = Math.max(0, tierValue);
    }

    const paths = this.system?.paths ?? {};
    Object.entries(paths).forEach(([id, path]) => {
      if (!path) return;

      const codexMax = toFiniteNumber(triskellIndex.paths?.[id]?.steps?.length);
      const max = toFiniteNumber(path.max, codexMax);
      const safeMax = Math.max(0, max);

      path.max = safeMax;
      path.value = Math.min(Math.max(0, tension), safeMax);
    });

    const { equippedItems, sanitizedEquippedGear } = this._collectEquippedItems();
    this.system.equippedGear = sanitizedEquippedGear;

    const equippedContext = this._buildEquippedContext(equippedItems);

    const modifiers = this._prepareSkillModifiers(equippedContext);
    this.system.modifiers = modifiers;
    this._applySkillModifiers(modifiers);

    const baseActions = this.system?.actions ?? {};
    const selectedAction = baseActions.selected ?? null;
    const selectedForms = this._normalizeSelectedForms(baseActions.selectedForms ?? []);
    const { actions, spells } = this._prepareActionCollections({
      selectedAction,
      selectedForms,
      equippedContext
    });
    this.system.actions = {
      ...baseActions,
      actions,
      spells,
      selected: selectedAction,
      selectedForms,
      commit
    };

  }

  _collectEquippedItems() {
    const itemsById = new Map(Array.from(this.items ?? []).map(item => [item.id, item]));

    const equippedGear = this.system?.equippedGear ?? {};
    const sanitizeEquippedList = (entries = []) => normalizeIdList(entries)
      .filter(itemId => itemsById.has(itemId));

    const sanitizedEquippedGear = {
      worn: sanitizeEquippedList(equippedGear?.worn ?? []),
      held: sanitizeEquippedList(equippedGear?.held ?? []),
      spell: sanitizeEquippedList(equippedGear?.spell ?? []),
      ability: sanitizeEquippedList(equippedGear?.ability ?? [])
    };

    const equippedIds = [
      ...sanitizedEquippedGear.worn,
      ...sanitizedEquippedGear.held,
      ...sanitizedEquippedGear.spell,
      ...sanitizedEquippedGear.ability
    ];

    const equippedItems = [];
    const seenItemIds = new Set();
    for (const itemId of normalizeIdList(equippedIds)) {
      if (seenItemIds.has(itemId)) continue;

      const item = itemsById.get(itemId);
      if (!item) continue;

      equippedItems.push(item);
      seenItemIds.add(itemId);
    }

    return { equippedItems, sanitizedEquippedGear };
  }

  _buildEquippedContext(equippedItems = []) {
    return Array.from(equippedItems).map(item => ({
      id: item.id,
      image: item.img ?? item.image ?? null,
      modifiers: Array.isArray(item?.system?.modifiers) ? item.system.modifiers : [],
      actionRefs: normalizeIdList(item.system?.actions?.ref),
      formRefs: normalizeIdList(item.system?.forms?.ref)
    }));
  }

  _prepareSkillModifiers(equippedContext = []) {
    const modifiersBySkill = {};

    const skillsById = getTriskellIndex().skills ?? {};

    for (const { modifiers: itemModifiers, id, image } of Array.from(equippedContext)) {
      for (const modifier of itemModifiers) {
        const skill = modifier?.skill ?? modifier?.id ?? "";
        if (!skill) continue;

        const value = toFiniteNumber(modifier.value);
        const existing = modifiersBySkill[skill];

        if (!existing || value > (existing.value ?? 0)) {
          modifiersBySkill[skill] = {
            ...modifier,
            skill,
            value,
            source: id ?? null,
            image
          };
        }
      }
    }

    return Object.values(modifiersBySkill).map(modifier => {
      const skill = skillsById[modifier.skill] ?? {};

      return {
        ...modifier,
        label: skill.label ?? modifier.skill ?? ""
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

      const value = toFiniteNumber(skillData.value);

      const mod = toFiniteNumber(modifiersBySkill[skillId]?.value);

      skillData.mod = mod;
      skillData.total = value + mod;
    });
  }

  _normalizeSelectedForms(selectedForms = []) {
    if (!Array.isArray(selectedForms)) return [];

    return Array.from(new Set(normalizeIdList(selectedForms)));
  }

  _formatAction(action, { source, image }) {
    const index = getTriskellIndex();
    const skill = index.skills?.[action.skill] ?? {};
    const reserve = index.reserves?.[action.reserve] ?? {};
    const actorSkill = this.system?.skills?.[action.skill] ?? {};

    const skillTotal = toFiniteNumber(actorSkill.total ?? actorSkill.value);

    return {
      ...action,
      label: action.label ?? action.id,
      description: action.description ?? "",
      skillLabel: skill.label ?? action.skill ?? "",
      reserveLabel: reserve.label ?? action.reserve ?? "",
      skillTotal,
      source,
      image: image ?? action.image ?? action.img ?? null
    };
  }

  _formatForm(form, { source, image }) {
    const index = getTriskellIndex();
    const reserve = index.reserves?.[form.reserve] ?? {};
    const skill = index.skills?.[form.skill] ?? {};

    const modifierBonuses = toFiniteNumbers(
      form.modifiers,
      modifier => typeof modifier?.skill === "number"
        ? modifier.skill
        : modifier?.value,
      Number.NaN
    );

    const skillBonus = modifierBonuses.reduce((total, bonus) => total + bonus, 0);

    return {
      ...form,
      label: form.label ?? form.id,
      description: form.description ?? "",
      reserveLabel: reserve.label ?? form.reserve ?? "",
      skillLabel: skill.label ?? form.skill ?? "",
      skillBonus,
      source,
      image: image ?? form.image ?? form.img ?? null
    };
  }

  _prepareActionCollections({ selectedAction = null, selectedForms = [], equippedContext = [] } = {}) {
    const actions = [];
    const spells = [];
    const forms = [];

    const codex = getTriskellCodex();
    const index = getTriskellIndex();
    const collator = new Intl.Collator(undefined, { sensitivity: "base" });

    const actionIds = new Set();
    const spellIds = new Set();
    const formIds = new Set();

    const baseActions = codex.baseActions ?? [];
    const advancedActionsById = index.advancedActions ?? {};
    const spellsById = index.spells ?? {};
    const formsById = index.forms ?? {};

    const addAction = (action, { source = null, image } = {}) => {
      if (!action?.id || actionIds.has(action.id)) return;
      actionIds.add(action.id);
      actions.push(this._formatAction(action, { source, image }));
    };

    const addSpell = (spell, { source = null, image } = {}) => {
      if (!spell?.id || spellIds.has(spell.id)) return;
      spellIds.add(spell.id);
      spells.push(this._formatAction(spell, { source, image }));
    };

    const addForm = (form, { source = null, image } = {}) => {
      if (!form?.id || formIds.has(form.id)) return;
      formIds.add(form.id);
      forms.push(this._formatForm(form, { source, image }));
    };

    baseActions.forEach(action => addAction(action, { image: action.image ?? action.img }));

    for (const { actionRefs, formRefs, id, image } of Array.from(equippedContext)) {
      actionRefs.forEach(actionId => {
        const advancedAction = advancedActionsById[actionId];
        if (advancedAction) addAction(advancedAction, { source: id, image });

        const spell = spellsById[actionId];
        if (spell) addSpell(spell, { source: id, image });
      });

      formRefs.forEach(formId => {
        const form = formsById[formId];
        if (form) addForm(form, { source: id, image });
      });
    }

    actions.sort((a, b) => collator.compare(a.label, b.label));
    spells.sort((a, b) => collator.compare(a.label, b.label));

    forms.forEach(form => {
      form.active = selectedForms.includes(form.id);
      form.normalizedKeywords = normalizeKeywords(form.keywords);
    });

    forms.sort((a, b) => collator.compare(a.label, b.label));

    const findMatchingForms = entry => {
      const entryKeywords = normalizeKeywords(entry?.keywords);
      if (!entryKeywords.length) return [];

      const entryKeywordSet = new Set(entryKeywords);

      return forms.filter(form =>
        form.normalizedKeywords.length > 0
        && form.normalizedKeywords.every(keyword => entryKeywordSet.has(keyword))
      );
    };

    actions.forEach(action => {
      action.forms = findMatchingForms(action);
      action.isSelected = action.id === selectedAction;
    });

    spells.forEach(spell => {
      spell.forms = findMatchingForms(spell);
      spell.isSelected = spell.id === selectedAction;
    });

    return { actions, spells };
  }

  async rollSelectedAction() {
    const actionsData = this.system?.actions ?? {};
    const selectedId = actionsData.selected ?? null;

    if (!selectedId) return null;

    const availableActions = Array.isArray(actionsData.actions) ? actionsData.actions : [];
    const availableSpells = Array.isArray(actionsData.spells) ? actionsData.spells : [];
    const selectedAction = [...availableActions, ...availableSpells]
      .find(action => action?.id === selectedId);

    if (!selectedAction) return null;

    const modifiers = [];

    const actionLabel = selectedAction.skillLabel ?? selectedAction.label ?? selectedAction.id ?? "";
    const actionBonus = toFiniteNumber(selectedAction.skillTotal, Number.NaN);
    if (Number.isFinite(actionBonus) && actionBonus !== 0) {
      modifiers.push({ label: actionLabel || "Action", value: actionBonus });
    }

    const activeForms = Array.isArray(selectedAction.forms)
      ? selectedAction.forms.filter(form => form?.active)
      : [];

    activeForms.forEach(form => {
      const formBonus = toFiniteNumber(form?.skillBonus, Number.NaN);
      if (!Number.isFinite(formBonus) || formBonus === 0) return;

      modifiers.push({ label: form.label ?? form.id ?? "Form", value: formBonus });
    });

    const commitBonus = toFiniteNumber(actionsData.commit?.value, Number.NaN);
    if (Number.isFinite(commitBonus) && commitBonus !== 0) {
      const commitLabel = actionsData.commit?.label ?? "Commit";
      modifiers.push({ label: commitLabel, value: commitBonus });
    }

    return this.rollTriskelDice({ modifiers, title: actionLabel });
  }

  /**
   * Roll a simple 2d10 test with optional modifiers.
   *
   * @param {object} [config={}]             - Configuration for the roll.
   * @param {Array<{label?: string, value?: number}>} [config.modifiers=[]]
   *   Collection of labeled bonuses or penalties to apply to the roll.
   * @param {number|null} [config.difficulty=null]
   *   Optional difficulty value (not yet used mechanically).
   * @param {string} [config.title=""]      - Optional title for the chat card.
   * @param {object} [config.options={}]     - Placeholder for future options.
   */
  async rollTriskelDice({ modifiers = [], difficulty = null, title = "", options = {} } = {}) {
    const normalizedModifiers = modifiers
      .map(modifier => ({
        label: modifier?.label ?? "Modifier",
        value: toFiniteNumber(modifier?.value, Number.NaN)
      }))
      .filter(modifier => Number.isFinite(modifier.value) && modifier.value !== 0);

    const terms = [new foundry.dice.terms.Die({ number: 2, faces: 10 })];

    normalizedModifiers.forEach(modifier => {
      terms.push(new foundry.dice.terms.OperatorTerm({ operator: modifier.value >= 0 ? "+" : "-" }));
      terms.push(new foundry.dice.terms.NumericTerm({
        number: Math.abs(modifier.value),
        options: { flavor: modifier.label }
      }));
    });

    const roll = Roll.fromTerms(terms);
    await roll.evaluate({ async: true });
    convertD10TensToZero(roll);

    const modifierTotal = normalizedModifiers.reduce((total, modifier) => total + modifier.value, 0);
    const escape = foundry.utils?.escapeHTML ?? (value => value);
    const modifiersContent = normalizedModifiers.length
      ? `<ul>${normalizedModifiers
        .map(modifier => `<li>${escape(modifier.label)}: ${modifier.value >= 0 ? "+" : ""}${modifier.value}</li>`)
        .join("")}</ul>`
      : `<p>${game.i18n.localize("TRISKEL.Actor.RollHelper.TotalBonus")}: +0</p>`;

    const subtitleParts = ["2d10 (10→0)"];
    if (normalizedModifiers.length) subtitleParts.push(`${game.i18n.localize("TRISKEL.Actor.RollHelper.TotalBonus")}: ${modifierTotal >= 0 ? "+" : ""}${modifierTotal}`);
    if (Number.isFinite(difficulty)) subtitleParts.push(`${game.i18n.localize("TRISKEL.Actor.RollHelper.Difficulty") ?? "Difficulty"}: ${difficulty}`);

    const flavor = subtitleParts.join(" | ");

    await chatOutput({
      title: title || game.i18n.localize("TRISKEL.Actor.RollHelper.Title"),
      subtitle: flavor,
      roll,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor,
      content: modifiersContent,
      rollMode: options.rollMode ?? null
    });

    return {
      roll,
      modifiers: normalizedModifiers,
      modifierTotal,
      difficulty,
      options
    };
  }

}
