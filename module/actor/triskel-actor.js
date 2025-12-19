import {
  normalizeIdList,
  normalizeKeyword,
  normalizeKeywords,
  toFiniteNumber,
  toFiniteNumbers
} from "../util/normalization.js";
import { chatOutput } from "../util/chat-output.js";
import { convertD10TensToZero } from "../util/roll.js";
import { prepareBars, prepareSkillsDisplay } from "./sheet-helpers.js";

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
    const triskellCodex = getTriskellCodex();

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
    if (this.type === "character") {
      baseActions.activations = { value: 1 };
    } else if (this.type === "npc") {
      const woundsValue = toFiniteNumber(this.system?.npcStats?.wounds?.value);
      baseActions.activations = { value: woundsValue };
    }
    const selectedRef = baseActions.selected?.ref ?? baseActions.selected ?? null;
    const selectedForms = this._normalizeSelectedForms(baseActions.selectedForms ?? []);
    const { actions, spells } = this._prepareActionCollections({
      selectedAction: selectedRef,
      selectedForms,
      equippedContext
    });
    const actionTypes = triskellCodex.actionTypes ?? [];
    const actionsByType = this._bucketActionsByType(actions);
    const spellsByType = this._bucketActionsByType(spells);
    const selectedPrepared = [...actions, ...spells].find(action => action.id === selectedRef);
    const cloneAction = value => {
      if (!value) return null;
      if (foundry.utils?.deepClone) return foundry.utils.deepClone(value);
      try {
        return structuredClone(value);
      } catch (error) {
        return JSON.parse(JSON.stringify(value));
      }
    };
    const selected = selectedPrepared
      ? cloneAction({ ref: selectedRef, ...selectedPrepared })
      : selectedRef
        ? { ref: selectedRef }
        : null;

    if (selected) {
      const reserveCosts = { power: 0, grace: 0, will: 0 };
      const addReserveCost = entry => {
        const reserveId = `${entry?.reserve ?? ""}`.trim();
        const cost = toFiniteNumber(entry?.cost, Number.NaN);
        if (!reserveId || !Number.isFinite(cost)) return;
        if (reserveId in reserveCosts) reserveCosts[reserveId] += cost;
      };

      addReserveCost(selected);
      const activeForms = Array.isArray(selected.forms) ? selected.forms.filter(form => form?.active) : [];
      activeForms.forEach(addReserveCost);
      const commitValue = toFiniteNumber(commit?.value, Number.NaN);
      if (selected.reserve && Number.isFinite(commitValue)) {
        addReserveCost({ reserve: selected.reserve, cost: commitValue });
      }

      const rollModifiers = [];
      const actionLabel = selected.skillLabel ?? selected.label ?? selected.id ?? "";
      const actionBonus = toFiniteNumber(selected.skillTotal, Number.NaN);
      if (Number.isFinite(actionBonus) && actionBonus !== 0) rollModifiers.push({ label: actionLabel || "Action", value: actionBonus });

      activeForms.forEach(form => {
        const formBonus = toFiniteNumber(form?.skillBonus, Number.NaN);
        if (!Number.isFinite(formBonus) || formBonus === 0) return;
        rollModifiers.push({ label: form.label ?? form.id ?? "Form", value: formBonus });
      });

      if (selected.reserve && Number.isFinite(commitValue) && commitValue !== 0) {
        const commitLabel = commit?.label ?? "Commit";
        rollModifiers.push({ label: commitLabel, value: commitValue });
      }

      const totalBonus = rollModifiers.reduce((total, modifier) => total + toFiniteNumber(modifier?.value, 0), 0);

      selected.cost = reserveCosts;
      selected.modifiers = rollModifiers;
      selected.roll = { totalBonus };
    }

    this.system.actions = {
      ...baseActions,
      actions,
      spells,
      actionTypes,
      actionsByType,
      spellsByType,
      selected,
      selectedForms,
      commit
    };

    if (this.type === "character") {
      const preparedReserves = prepareBars(this.system?.reserves, triskellIndex.reserves);
      const preparedPaths = prepareBars(this.system?.paths, triskellIndex.paths);
      const preparedCommit = prepareBars({ commit: this.system?.actions?.commit }, triskellIndex.actions)?.commit
        ?? { id: "commit", _segments: [] };

      this.system.reserves = preparedReserves;
      this.system.paths = preparedPaths;
      this.system.actions.commit = preparedCommit;
    } else if (this.type === "npc") {
      const preparedNpcStats = prepareBars(this.system?.npcStats, triskellIndex.npcStats);
      this.system.npcStats = preparedNpcStats;
    }

    const { skillCategories } = prepareSkillsDisplay(
      this.system?.skills,
      this.system?.resistances
    );

    const tierValue = toFiniteNumber(this.system?.tier?.value, Number.NaN);
    const tierLabel = this.type === "character"
      ? triskellCodex.tiers?.find(tier => tier.tier === tierValue)?.label ?? ""
      : "";

    this.system.skillCategories = skillCategories;
    this.system.tier = {
      ...this.system.tier,
      label: tierLabel
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
    const normalizedKeywords = normalizeKeywords(action.keywords);

    return {
      ...action,
      label: action.label ?? action.id,
      description: action.description ?? "",
      skillLabel: skill.label ?? action.skill ?? "",
      reserveLabel: reserve.label ?? action.reserve ?? "",
      skillTotal,
      source,
      normalizedKeywords,
      image: image ?? action.image ?? action.img ?? null
    };
  }

  _formatForm(form, { source, image }) {
    const index = getTriskellIndex();
    const reserve = index.reserves?.[form.reserve] ?? {};
    const skill = index.skills?.[form.skill] ?? {};

    const modifierBonus = toFiniteNumber(
      typeof form?.modifier?.skill === "number" ? form.modifier.skill : form?.modifier?.value,
      0
    );

    return {
      ...form,
      label: form.label ?? form.id,
      description: form.description ?? "",
      reserveLabel: reserve.label ?? form.reserve ?? "",
      skillLabel: skill.label ?? form.skill ?? "",
      skillBonus: modifierBonus,
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

    const formsByKeyword = new Map();
    forms.forEach(form => {
      const normalizedKeyword = normalizeKeyword(form.keyword ?? form.keywords);
      form.normalizedKeyword = normalizedKeyword;
      form.normalizedKeywords = normalizedKeyword ? [normalizedKeyword] : [];
      form.active = selectedForms.includes(form.id);

      if (!normalizedKeyword) return;
      const formsWithKeyword = formsByKeyword.get(normalizedKeyword) ?? [];
      formsWithKeyword.push(form);
      formsByKeyword.set(normalizedKeyword, formsWithKeyword);
    });

    forms.sort((a, b) => collator.compare(a.label, b.label));

    const findMatchingForms = entry => {
      const entryKeyword = entry?.normalizedKeywords?.[0] ?? normalizeKeyword(entry?.keywords);
      if (!entryKeyword) return [];

      return formsByKeyword.get(entryKeyword) ?? [];
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

  _bucketActionsByType(entries = []) {
    const bucket = { all: Array.from(entries) };

    for (const entry of entries) {
      const type = entry?.type ?? "";
      if (!type) continue;

      if (!bucket[type]) bucket[type] = [];
      bucket[type].push(entry);
    }

    return bucket;
  }

  async rollSelectedAction() {
    const actionsData = this.system?.actions ?? {};
    const selectedRef = actionsData.selected?.ref ?? null;

    if (!selectedRef) return null;

    const selectedAction = actionsData.selected;

    if (!selectedAction) return null;

    const actionLabel = selectedAction.skillLabel ?? selectedAction.label ?? selectedAction.id ?? "";

    const modifiers = Array.isArray(selectedAction.modifiers) ? [...selectedAction.modifiers] : [];

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
    await roll.evaluate();
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

    const subtitle = subtitleParts.join(" | ");

    await chatOutput({
      title: title || game.i18n.localize("TRISKEL.Actor.RollHelper.Title"),
      subtitle,
      roll,
      speaker: ChatMessage.getSpeaker({ actor: this }),
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
