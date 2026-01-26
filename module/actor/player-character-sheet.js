import {
  getTriskellCodex,
  getTriskellIndex,
  getGearCarryLocationOptions,
  getActionBucket,
  asHTMLElement,
  getItemFromTarget,
  onEditImage,
  onUpdateResourceValue,
  prepareActorBarsContext,
  prepareActionsTabContext,
  prepareGearTabContext,
  prepareNotesTabContext,
  prepareRollHelperTabContext,
  prepareSkillsTabContext
} from "./sheet-helpers.js";
import { chatOutput } from "../util/chat-output.js";
import { normalizeKeyword, toArray, toFiniteNumber } from "../util/normalization.js";
const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------
async function toggleActiveItem(event, target, expectedType) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  const itemType = expectedType ?? target?.dataset?.itemType ?? target.closest("[data-item-type]")?.dataset.itemType;
  if (!item || (itemType && item.type !== itemType)) return;

  const isActive = Boolean(item.system?.active);
  await item.update({ "system.active": !isActive });
}

async function onEditItem(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  await item?.sheet?.render(true);
}

async function onDeleteItem(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item) return;

  await this.document?.deleteEmbeddedDocuments("Item", [item.id]);
}

async function onChangeCarryLocation(event, target) {
  event.preventDefault();

  const sheet = this;
  const selectElement = asHTMLElement(target);
  if (!selectElement) return;
  const item = getItemFromTarget(sheet, selectElement);
  if (!item) return;

  const locationId = normalizeKeyword(selectElement.value ?? "", "");
  if (!locationId) return;
  const locationOptions = getGearCarryLocationOptions(item);
  const selectedLocation = locationOptions.find(option => option.id === locationId) ?? null;
  const active = Boolean(selectedLocation?.defaultActive);

  const actor = sheet.document;
  if (actor?.updateEmbeddedDocuments) {
    await actor.updateEmbeddedDocuments("Item", [{
      _id: item.id,
      "system.carryLocation": locationId,
      "system.active": active
    }]);
  } else {
    await item.update({
      "system.carryLocation": locationId,
      "system.active": active
    });
  }
  await sheet.render({ parts: ["gear"] });
}

async function onAdjustGearValue(event, target) {
  event.preventDefault();

  const item = getItemFromTarget(this, target);
  if (!item) return;

  const field = target?.dataset?.itemField ?? "";
  if (!["quantity", "uses"].includes(field)) return;

  const valuePath = `system.${field}.value`;
  const maxPath = `system.${field}.max`;
  const currentValue = toFiniteNumber(foundry.utils.getProperty(item, valuePath), 0);
  const maxValue = toFiniteNumber(foundry.utils.getProperty(item, maxPath), Number.NaN);
  const isDecrement = event.type === "contextmenu" || event.button === 2;
  const delta = isDecrement ? -1 : 1;

  let nextValue = currentValue + delta;
  nextValue = Math.max(0, nextValue);
  if (Number.isFinite(maxValue)) {
    nextValue = Math.min(maxValue, nextValue);
  }
  if (nextValue === currentValue) return;

  const actor = this.document;
  if (actor?.updateEmbeddedDocuments) {
    await actor.updateEmbeddedDocuments("Item", [{
      _id: item.id,
      [valuePath]: nextValue
    }]);
  } else {
    await item.update({ [valuePath]: nextValue });
  }
}

async function onSelectAction(event, target) {
  event.preventDefault();

  const actionKey = target.closest("[data-action-key]")?.dataset.actionKey;
  if (!actionKey) return;

  const actor = this.document;
  const selectedActionType = actor?.system?.actions?.selectedType ?? "impact";
  const actionKind = target.closest("[data-action-kind]")?.dataset.actionKind ?? "action";
  const preparedActions = actor?.preparedActions?.actions ?? {};
  const preparedSpells = actor?.preparedActions?.spells ?? {};
  const actionBucket = getActionBucket(preparedActions, selectedActionType);
  const spellBucket = getActionBucket(preparedSpells, selectedActionType);
  const selectionBucket = actionKind === "spell" ? spellBucket : actionBucket;
  const selectedAction = selectionBucket.find(action => action?.id === actionKey) ?? null;
  if (!selectedAction) return;

  await actor?.update({ "system.actions.selectedAction": null });
  await actor?.update({
    "system.actions.selectedAction": {
      ...selectedAction,
      selectionKind: actionKind
    }
  });
}

async function onFilterActionType(event, target) {
  event.preventDefault();

  const filterValue = target.closest("[data-filter-value]")?.dataset.filterValue ?? "impact";
  await this.document?.update({ "system.actions.selectedType": filterValue });
}

async function onSelectSkill(event, target) {
  event.preventDefault();

  const skillId = target.closest("[data-skill-id]")?.dataset.skillId ?? null;
  if (!skillId) return;

  const actor = this.document;
  const skill = actor?.system?.skills?.[skillId] ?? null;
  if (!skill) return;

  const skillLabel = skill?.label ?? skillId;
  const skillTotal = toFiniteNumber(skill?.total, 0);
  const description = skill?.description ?? "";

  const pseudoAction = {
    id: skillId,
    label: skillLabel,
    cost: 0,
    reserve: null,
    skill: skillId,
    skillLabel,
    skillTotal,
    description,
    forms: [],
    modifiers: [
      {
        label: skillLabel,
        value: skillTotal
      }
    ]
  };

  await actor?.update({ "system.actions.selectedAction": null });
  await actor?.update({ "system.actions.selectedAction": pseudoAction });
}

async function onToggleForm(event, target) {
  event.preventDefault();

  const formKey = target.closest("[data-form-key]")?.dataset.formKey;
  if (!formKey) return;

  const selectionCollection = target.closest("[data-selection-collection]")?.dataset.selectionCollection
    ?? "selectedForms";
  const selectionPath = `system.actions.${selectionCollection}`;

  const actor = this.document;
  const currentSelection = [...toArray(actor?.system?.actions?.[selectionCollection])];

  const normalizedSelection = Array.from(new Set(currentSelection));
  const selectedIndex = normalizedSelection.indexOf(formKey);

  if (selectedIndex >= 0) normalizedSelection.splice(selectedIndex, 1);
  else normalizedSelection.push(formKey);

  await actor?.update({ [selectionPath]: normalizedSelection });
}

async function onRollHelper(event) {
  event.preventDefault();

  const actor = this.document;
  const rollHelper = this._rollHelper ?? {};
  const rollData = rollHelper.rollData;
  const rollHelperSummary = rollHelper.summary;
  const rollHelperAction = rollHelper.action;
  const rollHelperForms = rollHelper.forms;
  const rollHelperCost = toFiniteNumber(rollHelperAction?.cost, Number.NaN);
  if (!rollHelperSummary) return;
  if (rollHelperSummary.canAfford === false) return;

  const shouldRoll = Boolean(rollData);
  if (shouldRoll && typeof actor?.rollTriskelDice !== "function") return;
  const rollResult = shouldRoll
    ? await actor.rollTriskelDice({
      ...rollData,
      options: {
        ...rollData?.options,
        chatOutput: false
      }
    })
    : null;
  if (shouldRoll && !rollResult) return;

  const reserveUpdates = {};
  const reserveCosts = Array.isArray(rollHelperSummary?.reserveCosts)
    ? rollHelperSummary.reserveCosts
    : [];
  const activeForms = Array.isArray(rollHelperForms)
    ? rollHelperForms.filter(form => form?.active)
    : [];

  reserveCosts.forEach(reserve => {
    if (!reserve?.id) return;
    const reservePath = `system.reserves.${reserve.id}`;
    const currentReserve = actor?.system?.reserves?.[reserve.id] ?? {};
    const currentValue = toFiniteNumber(currentReserve?.value, Number.NaN);
    if (!Number.isFinite(currentValue)) return;
    const minimum = toFiniteNumber(currentReserve?.min, 0);
    const totalCost = toFiniteNumber(reserve.total, 0);
    const updatedValue = Math.max(minimum, currentValue - totalCost);
    reserveUpdates[`${reservePath}.value`] = updatedValue;
  });

  await actor.update({
    ...reserveUpdates,
    "system.actions.commit.value": 0
  });

  await chatOutput({
    roll: rollResult?.roll ?? null,
    actionTemplate: rollHelperAction ? "systems/triskel/templates/chat/roll-helper-action.hbs" : "",
    actionContext: {
      action: rollHelperAction,
      forms: activeForms,
      actionCost: Number.isFinite(rollHelperCost) && rollHelperCost !== 0 ? rollHelperCost : null,
      reserveCosts
    },
    speaker: ChatMessage.getSpeaker({ actor }),
    rollMode: rollData?.options?.rollMode ?? null
  });
}

async function onToggleActiveItem(event, target) {
  await toggleActiveItem.call(this, event, target);
}

// ---------------------------------------------------------------------------
// Sheet implementation
// ---------------------------------------------------------------------------
export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  // -- Lifecycle ------------------------------------------------------------
  activateListeners(html) {
    super.activateListeners?.(html);

    const root = asHTMLElement(html) ?? asHTMLElement(this.element);
    if (!root) return;

    if (this._carryLocationChangeHandler) {
      root.removeEventListener("change", this._carryLocationChangeHandler, true);
    }

    if (this._gearValueAdjustHandler) {
      root.removeEventListener("auxclick", this._gearValueAdjustHandler, true);
      root.removeEventListener("contextmenu", this._gearValueAdjustHandler, true);
    }

    this._carryLocationChangeHandler = (event) => {
      const target = event.target?.closest?.("[data-action=\"changeCarryLocation\"]");
      if (!target) return;
      onChangeCarryLocation.call(this, event, target);
    };

    this._gearValueAdjustHandler = (event) => {
      const target = event.target?.closest?.("[data-action=\"adjustGearValue\"]");
      if (!target) return;
      onAdjustGearValue.call(this, event, target);
    };

    root.addEventListener("change", this._carryLocationChangeHandler, true);
    root.addEventListener("auxclick", this._gearValueAdjustHandler, true);
    root.addEventListener("contextmenu", this._gearValueAdjustHandler, true);
  }

  async close(options = {}) {
    const root = asHTMLElement(this.element);
    if (root && this._carryLocationChangeHandler) {
      root.removeEventListener("change", this._carryLocationChangeHandler, true);
    }
    if (root && this._gearValueAdjustHandler) {
      root.removeEventListener("auxclick", this._gearValueAdjustHandler, true);
      root.removeEventListener("contextmenu", this._gearValueAdjustHandler, true);
    }
    return super.close(options);
  }

  // -- Rendering ------------------------------------------------------------
  _configureRenderOptions(options = {}) {
    const renderOptions = super._configureRenderOptions?.(options) ?? options ?? {};
    const configuredParts = renderOptions.parts;
    const partIds = Array.isArray(configuredParts)
      ? configuredParts
      : Object.keys(this.constructor.PARTS ?? {});
    const activeTab = this.tabGroups?.sheet
      ?? this.constructor.TABS?.sheet?.initial
      ?? "actions";
    const tabParts = new Set(["actions", "skills", "gear", "spells", "notes"]);

    renderOptions.parts = partIds.filter(partId => !tabParts.has(partId) || partId === activeTab);
    return renderOptions;
  }

  async _onClickTab(event, tabs, tab) {
    await super._onClickTab?.(event, tabs, tab);

    const activeTab = typeof tab === "string"
      ? tab
      : tab?.id ?? tabs?.active ?? this.tabGroups?.sheet ?? null;

    if (activeTab) {
      await this.render({ parts: [activeTab] });
    }
  }

  // -- Context preparation --------------------------------------------------
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;

    context.actor ??= actor;
    context.system ??= actor?.system ?? {};
    const { reserves, paths, commit } = prepareActorBarsContext(actor);
    if (reserves) context.reserves = reserves;
    if (paths) context.paths = paths;
    if (commit) context.commit = commit;

    return context;
  }

  async _preparePartContext(partId, context, options) {
    const basePartContext = await super._preparePartContext(partId, context, options) ?? context ?? {};
    const actor = this.document;

    if (partId === "skills") {
      return {
        ...basePartContext,
        ...prepareSkillsTabContext(actor)
      };
    }

    if (partId === "info") {
      const tierValue = actor?.system?.tier?.value;
      const tierLabelKey = getTriskellCodex()?.tiers?.find(tier => tier.tier === tierValue)?.label
        ?? getTriskellIndex()?.tiers?.find(tier => tier.tier === tierValue)?.label
        ?? null;
      const tierLabel = tierLabelKey ? (game.i18n?.localize?.(tierLabelKey) ?? tierLabelKey) : null;

      if (basePartContext.system) {
        basePartContext.system.tier ??= {};
        basePartContext.system.tier.label = tierLabel;
      }

      return {
        ...basePartContext,
        tierLabel
      };
    }

    if (partId === "notes") {
      return {
        ...basePartContext,
        ...(await prepareNotesTabContext(actor))
      };
    }

    if (["gear", "spells"].includes(partId)) {
      return {
        ...basePartContext,
        ...prepareGearTabContext(actor, partId),
        tab: basePartContext.tabs?.[partId]
      };
    }

    if (partId === "rollHelper") {
      const rollHelperContext = prepareRollHelperTabContext({
        actor,
        system: basePartContext.system,
        reserves: basePartContext.reserves ?? {},
        commit: basePartContext.commit ?? null
      });
      this._rollHelper = {
        rollData: rollHelperContext.rollHelperRollData ?? null,
        summary: rollHelperContext.rollHelperSummary ?? null,
        action: rollHelperContext.rollHelper?.action ?? null,
        forms: rollHelperContext.rollHelper?.forms ?? []
      };

      return {
        ...basePartContext,
        ...rollHelperContext
      };
    }

    if (partId === "actions") {
      const selectedActionType = basePartContext.system?.actions?.selectedType ?? "impact";
      return {
        ...basePartContext,
        ...prepareActionsTabContext(actor, selectedActionType)
      };
    }

    return basePartContext;
  }

  // -- Sheet configuration --------------------------------------------------
  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "actor", "character"],
    template: "systems/triskel/templates/actor/player-character-sheet.hbs",
    form: {
      submitOnChange: true
    },
    actions: {
      editImage: onEditImage,
      updateResourceValue: onUpdateResourceValue,
      adjustGearValue: onAdjustGearValue,
      editItem: onEditItem,
      deleteItem: onDeleteItem,
      selectAction: onSelectAction,
      toggleForm: onToggleForm,
      rollHelper: onRollHelper,
      filterActionType: onFilterActionType,
      toggleActiveItem: onToggleActiveItem,
      selectSkill: onSelectSkill,
      changeCarryLocation: onChangeCarryLocation
    },
    actor: {
      type: "character"
    },
    window: {
      resizable: true
    },
    position: {
      height: "auto",
      width: 720
    }
  };

  static TABS = {
    sheet: {
      tabs: [
        {
          id: "actions",
          group: "sheet",
          icon: "fa-solid fa-bolt",
          label: "TRISKEL.Actor.Tab.Actions",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Actions"
        },
        {
          id: "skills",
          group: "sheet",
          icon: "fa-solid fa-shield-halved",
          label: "TRISKEL.Actor.Tab.Skills",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Skills"
        },
        {
          id: "gear",
          group: "sheet",
          icon: "fa-solid fa-suitcase",
          label: "TRISKEL.Actor.Tab.Gear",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Gear"
        },
        {
          id: "spells",
          group: "sheet",
          icon: "fa-solid fa-book-sparkles",
          label: "TRISKEL.Actor.Tab.Spells",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Spells"
        },
        {
          id: "notes",
          group: "sheet",
          icon: "fa-solid fa-pen-to-square",
          label: "TRISKEL.Actor.Tab.Notes",
          tooltip: "TRISKEL.Actor.Tab.Tooltip.Notes"
        }
      ],
      initial: "actions"
    }
  };

  static PARTS = {
    info: {
      id: "info",
      template: "systems/triskel/templates/actor/player-info.hbs",
      sort: 5
    },
    rollHelper: {
      id: "rollHelper",
      template: "systems/triskel/templates/actor/roll-helper.hbs",
      sort: 10
    },
    resources: {
      id: "ressourcen",
      template: "systems/triskel/templates/actor/player-resources.hbs",
      sort: 20
    },
    actions: {
      id: "actions",
      template: "systems/triskel/templates/actor/actions.hbs",
      sort: 100
    },
    skills: {
      id: "skills",
      template: "systems/triskel/templates/actor/skills.hbs",
      sort: 200
    },
    notes: {
      id: "notes",
      template: "systems/triskel/templates/actor/notes.hbs",
      sort: 300
    },
    gear: {
      id: "gear",
      template: "systems/triskel/templates/actor/gear.hbs",
      sort: 240
    },
    spells: {
      id: "spells",
      template: "systems/triskel/templates/actor/spells.hbs",
      sort: 250
    }
  };
}
