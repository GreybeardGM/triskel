import { gatherFormsFromItems, prepareActionFormsState, prepareStandardActions } from "./sheet-helpers.js";

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

    const ownedItems = Array.from(this.items ?? []);

    this.#prepareActionsAndForms(ownedItems);
    this.#prepareSkillsWithModifiers(ownedItems);
  }

  #prepareActionsAndForms(ownedItems = []) {
    const actionsData = this.system?.actions;
    if (!actionsData) return;

    const availableForms = gatherFormsFromItems(ownedItems);
    const normalizedActionForms = prepareActionFormsState(availableForms, actionsData.forms);
    const standardActions = prepareStandardActions(
      actionsData.selected,
      this.system?.skills,
      this.system?.reserves,
      availableForms,
      normalizedActionForms
    );

    actionsData.availableForms = availableForms;
    actionsData.forms = normalizedActionForms;
    actionsData.standard = standardActions;
  }

  #prepareSkillsWithModifiers(ownedItems = []) {
    // TODO: Ergänzungen für zukünftige Skill-Modifier-Logik einfügen.
    const skills = this.system?.skills ?? {};
    const highestSkillModifiers = this.#collectHighestSkillModifiers(ownedItems);

    Object.entries(skills).forEach(([skillKey, skill]) => {
      const value = Number(skill?.value ?? 0);
      const baseMod = Number.isFinite(Number(skill?.mod)) ? Number(skill.mod) : 0;
      const itemMod = highestSkillModifiers[skillKey];
      const mod = Number.isFinite(itemMod)
        ? itemMod
        : baseMod;

      skill.mod = mod;
      skill.total = value + mod;
    });
  }

  #collectHighestSkillModifiers(ownedItems = []) {
    return ownedItems.reduce((modifiersBySkill, item) => {
      const itemModifiers = item?.system?.modifiers;
      if (!Array.isArray(itemModifiers)) return modifiersBySkill;

      itemModifiers.forEach(modifier => {
        const skillKey = typeof modifier?.skill === "string" ? modifier.skill : null;
        if (!skillKey) return;

        const value = Number(modifier?.value);
        if (!Number.isFinite(value)) return;

        const current = modifiersBySkill[skillKey];
        modifiersBySkill[skillKey] = Number.isFinite(current)
          ? Math.max(current, value)
          : value;
      });

      return modifiersBySkill;
    }, {});
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
