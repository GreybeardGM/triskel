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

    const parsedTension = Number(this.system?.tension?.value ?? 0);
    const tension = Number.isFinite(parsedTension) ? parsedTension : 0;

    const tierValue = Number(this.system?.tier?.value ?? 0);
    const commit = this.system?.actions?.commit ?? null;
    if (commit) {
      const max = Number.isFinite(tierValue) ? tierValue : 0;
      commit.max = Math.max(0, max);
    }

    const paths = this.system?.paths ?? {};
    Object.entries(paths).forEach(([id, path]) => {
      if (!path) return;

      const parsedMax = Number(path.max);
      const codexMax = Number(triskellIndex.paths?.[id]?.steps?.length ?? 0);
      const max = Number.isFinite(parsedMax) ? parsedMax : codexMax;
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
    const sanitizeEquippedList = (entries = []) => this
      ._normalizeReferenceList(entries)
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
    for (const itemId of this._normalizeReferenceList(equippedIds)) {
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
      actionRefs: this._normalizeReferenceList(item.system?.actions?.ref),
      formRefs: this._normalizeReferenceList(item.system?.forms?.ref)
    }));
  }

  _prepareSkillModifiers(equippedContext = []) {
    const modifiersBySkill = {};

    const skillsById = getTriskellIndex().skills ?? {};

    for (const { modifiers: itemModifiers, id, image } of Array.from(equippedContext)) {
      for (const modifier of itemModifiers) {
        const skill = modifier?.skill ?? modifier?.id ?? "";
        if (!skill) continue;

        const parsedValue = Number(modifier.value);
        const value = Number.isFinite(parsedValue) ? parsedValue : 0;
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
      .map(entry => (typeof entry === "string" ? entry : entry?.id ?? ""))
      .filter(Boolean);
  }

  _normalizeSelectedForms(selectedForms = []) {
    if (!Array.isArray(selectedForms)) return [];

    return Array.from(new Set(this._normalizeReferenceList(selectedForms)));
  }

  _formatAction(action, { source, image }) {
    const index = getTriskellIndex();
    const skill = index.skills?.[action.skill] ?? {};
    const reserve = index.reserves?.[action.reserve] ?? {};
    const actorSkill = this.system?.skills?.[action.skill] ?? {};

    const parsedSkillTotal = Number(actorSkill.total ?? actorSkill.value ?? 0);
    const skillTotal = Number.isFinite(parsedSkillTotal) ? parsedSkillTotal : 0;

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

    const skillBonus = Array.isArray(form.modifiers)
      ? form.modifiers.reduce((total, modifier) => {
          const bonus = typeof modifier?.skill === "number"
            ? modifier.skill
            : Number(modifier?.value ?? 0);

          return Number.isFinite(bonus) ? total + bonus : total;
        }, 0)
      : 0;

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

    actions.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
    spells.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

    const normalizeKeywords = (keywords = []) => (Array.isArray(keywords) ? keywords : [])
      .map(keyword => `${keyword}`.trim().toLowerCase())
      .filter(Boolean);

    forms.forEach(form => {
      form.active = selectedForms.includes(form.id);
      form.normalizedKeywords = normalizeKeywords(form.keywords);
    });

    forms.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

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
