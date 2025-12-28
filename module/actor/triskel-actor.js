import {
  normalizeIdList,
  toFiniteNumber
} from "../util/normalization.js";
import { chatOutput } from "../util/chat-output.js";
import { convertD10TensToZero } from "../util/roll.js";
import { prepareActorActionsContext, prepareActorActionsWithForms, prepareActorFormsContext, prepareBars } from "./sheet-helpers.js";

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

    // Gebündelte Vorbereitung für abgeleitete Charakterdaten.
    this._prepareCharacterDerivedData();

    // Platzhalter: zukünftige Item-Auswertung (ActionRefs, FormRefs, Assets, Modifiers).
    const { actionRefs, formRefs, spellRefs, assets, modifiers } = this._prepareActorItems(this.items);
    this.system.assets = assets;

    this.system.actions = {
      ...(this.system.actions ?? {}),
      actionRefs,
      formRefs,
      spellRefs
    };
    this.system.modifiers = modifiers;
    // Skills vor Actions vorbereiten, damit Skill-Werte in Actions genutzt werden können.
    this.system.skills = this._prepareCharacterSkills({
      skills: this.system?.skills,
      modifiers: this.system?.modifiers
    });

    this.preparedForms = prepareActorFormsContext(this);
    const actionsData = this.system?.actions ?? {};
    const preparedActions = prepareActorActionsContext(this);
    const selectedActionId = actionsData?.selected?.ref ?? null;
    const selectedForms = Array.isArray(actionsData?.selectedForms) ? actionsData.selectedForms : [];
    this.preparedActions = prepareActorActionsWithForms({
      actions: preparedActions,
      forms: this.preparedForms,
      selectedActionId,
      selectedForms
    });
    this.system.actions = {
      ...(this.system.actions ?? {}),
      selected: {
        ...(this.system.actions?.selected ?? {}),
        ref: selectedActionId,
        action: this.preparedActions?.selectedAction ?? null
      }
    };

    // Platzhalter: NPC-Ressourcen vorbereiten.
    this._prepareNpcResources();
  }

  /**
   * Bereitet alle abgeleiteten Werte speziell für Spielercharaktere vor.
   * - Strain-Minimum aus aktiven Schritten bestimmen
   * - Reserve- und Commit-Werte basierend auf Tier setzen
   * - Pfad-Werte mit aktueller Spannung deckeln
   */
  _prepareCharacterDerivedData() {
    // Indirekte Werte nur für Spielercharaktere vorbereiten.
    if (this.type !== "character") return;

    const triskellIndex = getTriskellIndex();
    const tierValue = toFiniteNumber(this.system?.tier?.value);
    const tensionValue = toFiniteNumber(this.system?.tension?.value);

    // Reserves: Minimum aus aktiven Strains und aktueller Wert basierend auf Tier.
    const reserves = this.system?.reserves ?? {};
    Object.values(reserves).forEach(reserve => {
      if (!reserve) return;

      // Strain-Schritte zählen: Ein Schritt ist aktiv, wenn "active" true ist (Fallback: isActive/boolean).
      const strainMinimum = this._calculateStrainMinimum(reserve.strain);
      reserve.min = strainMinimum;

      const resolvedMax = Math.max(strainMinimum, Math.max(0, toFiniteNumber(reserve.max, 5)));

      if (Number.isFinite(resolvedMax)) {
        reserve.max = resolvedMax;
      }

      const currentValue = toFiniteNumber(reserve.value, strainMinimum);
      reserve.value = Number.isFinite(resolvedMax)
        ? Math.min(Math.max(currentValue, strainMinimum), resolvedMax)
        : Math.max(currentValue, strainMinimum);
    });

    // Paths: Wert folgt der aktuellen Spannung, aber maximal bis zum definierten Maximum.
    const paths = this.system?.paths ?? {};
    Object.values(paths).forEach(path => {
      if (!path) return;

      const max = Math.max(0, toFiniteNumber(path.max));
      const cappedValue = Number.isFinite(tensionValue)
        ? Math.min(Math.max(0, tensionValue), max)
        : 0;

      path.max = max;
      path.value = cappedValue;
    });

    // Commit: Maximum orientiert sich am aktuellen Tier.
    const commit = this.system?.actions?.commit ?? null;
    if (commit && Number.isFinite(tierValue)) {
      commit.max = Math.max(0, tierValue);
    }
  }

  /**
   * Zählt aktive Strain-Schritte und akzeptiert alte/isActive oder boolsche Werte.
   *
   * @param {object} [strain={}] Sammlung von Strain-Schritten.
   * @returns {number} Anzahl aktiver Strain-Schritte.
   */
  _calculateStrainMinimum(strain = {}) {
    return Object.values(strain ?? {}).reduce((total, entry) => {
      const activeFlag = typeof entry === "object"
        ? Boolean(entry?.active ?? entry?.isActive)
        : Boolean(entry);

      return total + (activeFlag ? 1 : 0);
    }, 0);
  }

  /**
   * Platzhalter: Hier werden später Items ausgewertet und ActionRefs, FormRefs, Assets, Modifiers erzeugt.
   *
   * @param {Item[]} [items=[]] Item-Daten des Actors.
   * @returns {{
   *  actionRefs: Array<{id: string, itemId: string|null, image: string|null}>,
   *  formRefs: Array<{id: string, itemId: string|null, image: string|null}>,
   *  spellRefs: Array<{id: string, itemId: string|null, image: string|null}>,
   *  assets: object,
   *  modifiers: object
   * }}
   */
  _prepareActorItems(items = []) {
    // Grundstruktur für Assets nach Item-Kategorien mit Labeln aufbauen.
    const itemCategories = getTriskellIndex().itemCategories ?? {};
    const assets = Object.entries(itemCategories).reduce((collection, [id, category]) => {
      collection[id] = {
        id,
        label: category.label ?? id,
        labelPlural: category.labelPlural ?? category.label ?? id,
        collection: []
      };
      return collection;
    }, {});

    const actionRefs = [];
    const formRefs = [];
    const spellRefs = [];
    const modifiers = {};

    // TODO: Iteration über alle Items und Aggregation von ActionRefs, FormRefs und Modifiers.
    // Placeholder: Items nach Typ den Asset-Kollektionen hinzufügen.
    for (const item of Array.from(items ?? [])) {
      const type = item?.type ?? "";
      if (!type || !assets[type]) continue;

      assets[type].collection.push(item);
      const isActive = Boolean(item?.system?.active);

      // Inaktive Items beeinflussen Actions, Forms oder Modifiers nicht.
      if (!isActive) continue;

      // Action- und Form-Referenzen sammeln, falls vorhanden.
      const itemActionRefs = normalizeIdList(item?.system?.actions?.ref);
      const itemFormRefs = normalizeIdList(item?.system?.forms?.ref);
      itemActionRefs.forEach(actionId => actionRefs.push({
        id: actionId,
        itemId: item?.id ?? null,
        image: item?.img ?? item?.image ?? null
      }));
      itemFormRefs.forEach(formId => formRefs.push({
        id: formId,
        itemId: item?.id ?? null,
        image: item?.img ?? item?.image ?? null
      }));

      const itemSpellRefs = normalizeIdList(item?.system?.spells?.ref);
      itemSpellRefs.forEach(spellId => spellRefs.push({
        id: spellId,
        itemId: item?.id ?? null,
        image: item?.img ?? item?.image ?? null
      }));

      if (Array.isArray(item?.system?.modifiers)) {
        item.system.modifiers.forEach(modifier => {
          const skill = modifier?.skill ?? modifier?.id ?? "";
          if (!skill) return;

          const value = toFiniteNumber(modifier?.value, 0);
          modifiers[skill] = toFiniteNumber(modifiers[skill] ?? 0, 0) + value;
        });
      }
    }

    return {
      actionRefs,
      formRefs,
      spellRefs,
      assets,
      modifiers
    };
  }

  /**
   * Führt Actor-Skills mit Codex-Infos und Modifikatoren zusammen.
   *
   * @param {object} [options={}]
   * @param {object} [options.skills={}] Skills aus dem Actor.
   * @param {object} [options.modifiers={}] Aggregierte Modifikatoren (skill -> value).
   * @returns {object} Zusammengeführte Skills.
   */
  _prepareCharacterSkills({ skills = {}, modifiers = [] } = {}) {
    const codexSkills = Array.isArray(getTriskellCodex().skills) ? getTriskellCodex().skills : [];

    const modifierBySkill = modifiers && typeof modifiers === "object" ? modifiers : {};

    const prepared = {};

    const upsertSkill = (id, source = {}) => {
      const current = skills?.[id] ?? {};
      const mod = toFiniteNumber(modifierBySkill[id], 0);
      const value = toFiniteNumber(current.value);
      const category = source.category ?? current.category ?? null;

      prepared[id] = {
        ...current,
        id,
        label: source.label ?? current.label ?? id,
        description: source.description ?? current.description ?? "",
        category,
        value,
        mod,
        total: value + mod
      };
    };

    codexSkills.forEach(skill => {
      if (!skill?.id) return;
      upsertSkill(skill.id, skill);
    });

    Object.keys(skills ?? {}).forEach(skillId => {
      if (prepared[skillId]) return;
      upsertSkill(skillId);
    });

    return prepared;
  }

  /**
   * Platzhalter: NPC-Ressourcen vorbereiten.
   * Übernimmt aktuell nur den Activations-Wert aus npcStats.wounds.value.
   */
  _prepareNpcResources() {
    if (this.type !== "npc") return;

    const woundsValue = toFiniteNumber(this.system?.npcStats?.wounds?.value);

    if (Number.isFinite(woundsValue)) {
      this.system.actions = {
        ...(this.system.actions ?? {}),
        activations: { value: woundsValue }
      };
    }
  }

  async rollSelectedAction() {
    const actionsData = this.system?.actions ?? {};
    const selectedRef = actionsData.selected?.ref ?? null;

    if (!selectedRef) return null;

    const selectedAction = actionsData.selected?.action ?? null;

    if (!selectedAction || selectedAction?.roll?.active === false) return null;

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
