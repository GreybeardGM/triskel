import {
  getTriskelCodex,
  getTriskelIndex,
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
  prepareRollHelperContext,
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
  await updateItemCarryLocation(sheet, item, locationId);
}

async function updateItemCarryLocation(sheet, item, locationId) {
  if (!sheet || !item || !locationId) return false;

  const locationOptions = getGearCarryLocationOptions(item);
  const selectedLocation = locationOptions.find(option => option.id === locationId) ?? null;
  if (!selectedLocation) return false;
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
  return true;
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
  const rawMaxValue = foundry.utils.getProperty(item, maxPath);
  const parsedMaxValue = Number(rawMaxValue);
  const maxValue = Number.isFinite(parsedMaxValue) ? parsedMaxValue : Number.NaN;
  const delta = event.shiftKey ? 1 : -1;

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
  const actionBucket = getActionBucket(preparedActions, selectedActionType);
  const selectedAction = actionBucket.find(action => action?.id === actionKey) ?? null;
  if (!selectedAction) return;

  const situationalModifier = toFiniteNumber(actor?.system?.actions?.selectedAction?.situationalModifier, 0);
  await actor?.update({
    "system.actions.selectedAction": {
      selectionKind: actionKind,
      actionId: actionKey,
      actionType: selectedActionType,
      situationalModifier
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

  const situationalModifier = toFiniteNumber(actor?.system?.actions?.selectedAction?.situationalModifier, 0);
  const selectedActionType = actor?.system?.actions?.selectedType ?? "impact";
  await actor?.update({
    "system.actions.selectedAction": {
      selectionKind: "skill",
      skillId,
      actionType: selectedActionType,
      situationalModifier
    }
  });
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
  const rollHelperCost = toFiniteNumber(rollHelperAction?.cost, Number.NaN);
  if (!rollHelperSummary) return;
  if (rollHelperSummary.canAfford === false) return;

  const scene = game.scenes?.current ?? game.canvas?.scene ?? null;
  const sceneDifficulty = scene?.getFlag?.("triskel", "difficulty") ?? null;
  const difficultyValue = Number.isFinite(sceneDifficulty?.value) ? sceneDifficulty.value : null;
  const shouldResetDifficulty = sceneDifficulty?.persist !== true;
  const shouldRoll = Boolean(rollData);
  if (shouldRoll && typeof actor?.rollTriskelDice !== "function") return;
  const rollResult = shouldRoll
    ? await actor.rollTriskelDice({
      ...rollData,
      difficulty: Number.isFinite(difficultyValue) ? difficultyValue : null,
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
  const activeForms = Array.isArray(rollHelperAction?.forms)
    ? rollHelperAction.forms.filter(form => form?.active)
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

  let difficultyOutcome = null;
  if (Number.isFinite(difficultyValue) && rollResult?.roll) {
    const total = toFiniteNumber(rollResult.roll.total, Number.NaN);
    if (Number.isFinite(total)) {
      const difference = total - difficultyValue;
      const localize = game.i18n?.localize?.bind(game.i18n) ?? (key => key);
      const difficultyLabel = localize("TRISKEL.Actor.RollHelper.Difficulty");
      let outcomeLabel = localize("TRISKEL.Actor.RollHelper.OutcomeTie");
      let outcomeTone = "tie";
      let outcomeValue = null;
      if (difference > 0) {
        outcomeLabel = difference === 1
          ? localize("TRISKEL.Actor.RollHelper.OutcomeSuccess")
          : localize("TRISKEL.Actor.RollHelper.OutcomeSuccesses");
        outcomeTone = "success";
        outcomeValue = difference;
      } else if (difference < 0) {
        const misses = Math.abs(difference);
        outcomeLabel = misses === 1
          ? localize("TRISKEL.Actor.RollHelper.OutcomeMiss")
          : localize("TRISKEL.Actor.RollHelper.OutcomeMisses");
        outcomeTone = "miss";
        outcomeValue = misses;
      }
      difficultyOutcome = {
        label: outcomeLabel,
        tone: outcomeTone,
        value: outcomeValue,
        difficultyLabel,
        difficultyValue
      };
    }
  }

  if (shouldResetDifficulty && scene) {
    await scene.setFlag("triskel", "difficulty", { value: null, persist: false });
  }

  await chatOutput({
    roll: rollResult?.roll ?? null,
    actionTemplate: rollHelperAction ? "systems/triskel/templates/chat/roll-helper-action.hbs" : "",
    actionContext: {
      action: rollHelperAction,
      forms: activeForms,
      actionCost: Number.isFinite(rollHelperCost) && rollHelperCost !== 0 ? rollHelperCost : null,
      reserveCosts
    },
    actor,
    rollMode: rollData?.options?.rollMode ?? null,
    outcome: difficultyOutcome
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

    const root = this._getSheetRoot(html);
    this._bindGearListeners(root);
  }

  async close(options = {}) {
    this._unbindGearListeners();
    return super.close(options);
  }

  async _onRender(context, options) {
    await super._onRender?.(context, options);
    const root = this._getSheetRoot();
    this._bindGearListeners(root);
  }

  _getSheetRoot(preferred = null) {
    return preferred?.[0]
      ?? asHTMLElement(preferred)
      ?? this._gearRoot
      ?? this.element?.[0]
      ?? asHTMLElement(this.element)
      ?? null;
  }

  _bindGearListeners(root) {
    if (!root) return;

    this._unbindGearListeners();
    this._gearRoot = root;

    this._carryLocationChangeHandler = this._carryLocationChangeHandler ?? ((event) => {
      const target = event.target?.closest?.("[data-action=\"changeCarryLocation\"]");
      if (!target) return;
      onChangeCarryLocation.call(this, event, target);
    });
    this._gearDragCleanupHandler = this._gearDragCleanupHandler ?? (() => {
      this._clearDragState();
    });
    root.addEventListener("change", this._carryLocationChangeHandler, true);
    root.addEventListener("dragend", this._gearDragCleanupHandler, true);

  }

  _unbindGearListeners() {
    const root = this._getSheetRoot();
    if (!root) return;
    if (this._carryLocationChangeHandler) {
      root.removeEventListener("change", this._carryLocationChangeHandler, true);
    }
    if (this._gearDragCleanupHandler) {
      root.removeEventListener("dragend", this._gearDragCleanupHandler, true);
    }
    this._clearDragState();
    this._gearRoot = null;
  }

  _onGearDragStart(event) {
    const target = event.currentTarget
      ?? event.target?.closest?.(".inventory-list--gear .inventory-list__item[data-item-id]");
    if (!target) return;

    const itemId = target.dataset.itemId;
    if (!itemId) return;
    this._draggedGearItemId = itemId;
    target.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      const baseDragData = foundry.applications.ux.TextEditor.getDragEventData(event) ?? {};
      event.dataTransfer.setData("text/plain", JSON.stringify({
        ...baseDragData,
        triskelGearMove: {
          actorId: this.document?.id ?? null,
          itemId
        }
      }));
    }
  }

  _onGearDragEnd() {
    this._clearDragState();
  }

  _onGearDragOver(event) {
    super._onDragOver?.(event);
    const location = event.target?.closest?.(".inventory-location[data-carry-location-id]");
    if (!location) {
      if (this._activeDropLocation) {
        this._activeDropLocation.classList.remove("is-drop-target");
        this._activeDropLocation = null;
      }
      return;
    }
    const locationId = normalizeKeyword(location.dataset.carryLocationId ?? "", "");
    const draggedItem = this._draggedGearItemId
      ? this.document?.items?.get(this._draggedGearItemId)
      : null;
    const isValidTarget = this._isValidCarryLocationForItem(draggedItem, locationId);
    if (!isValidTarget) {
      if (this._activeDropLocation) {
        this._activeDropLocation.classList.remove("is-drop-target");
        this._activeDropLocation = null;
      }
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    if (this._activeDropLocation && this._activeDropLocation !== location) {
      this._activeDropLocation.classList.remove("is-drop-target");
    }
    this._activeDropLocation = location;
    location.classList.add("is-drop-target");
  }

  async _onGearDrop(event) {
    const location = event.target?.closest?.(".inventory-location[data-carry-location-id]");
    if (!location) {
      this._clearDragState();
      return super._onDrop?.(event);
    }

    event.preventDefault();
    const droppedLocationId = normalizeKeyword(location.dataset.carryLocationId ?? "", "");
    const { itemId: movedItemId, actorId: sourceActorId } = this._extractGearMoveData(event);

    if (!droppedLocationId || !movedItemId) {
      this._clearDragState();
      return super._onDrop?.(event);
    }

    const isSameActorMove = !sourceActorId || sourceActorId === this.document?.id;
    const item = isSameActorMove ? this.document?.items?.get(movedItemId) : null;
    if (!item || item.type !== "gear") {
      this._clearDragState();
      return super._onDrop?.(event);
    }

    const wasUpdated = await updateItemCarryLocation(this, item, droppedLocationId);
    if (!wasUpdated) {
      ui.notifications?.warn?.(
        game.i18n?.localize?.("TRISKEL.Item.CarryLocation.InvalidDrop")
        ?? "Ungültiger Trageort für dieses Item."
      );
    }
    this._clearDragState();
  }

  _onDragStart(event) {
    const result = super._onDragStart?.(event);
    this._onGearDragStart(event);
    return result;
  }

  _onDragOver(event) {
    this._onGearDragOver(event);
  }

  _onDragEnd(event) {
    this._onGearDragEnd(event);
    return super._onDragEnd?.(event);
  }

  _onDrop(event) {
    return this._onGearDrop(event);
  }

  _clearDragState() {
    const root = this._getSheetRoot();
    root?.querySelectorAll?.(".inventory-list__item.is-dragging")
      ?.forEach(element => element.classList.remove("is-dragging"));
    root?.querySelectorAll?.(".inventory-location.is-drop-target")
      ?.forEach(element => element.classList.remove("is-drop-target"));
    this._activeDropLocation = null;
    this._draggedGearItemId = null;
  }

  _extractGearMoveData(event) {
    const dragData = foundry.applications.ux.TextEditor.getDragEventData(event) ?? {};
    const itemId = (
      dragData?.triskelGearMove?.itemId
      ?? dragData?._id
      ?? dragData?.data?._id
      ?? this._draggedGearItemId
      ?? ""
    ).toString().trim();
    const actorId = (
      dragData?.triskelGearMove?.actorId
      ?? dragData?.actorId
      ?? ""
    ).toString().trim();
    const isValid = Boolean(itemId);
    return { itemId, actorId, isValid };
  }

  _isValidCarryLocationForItem(item, locationId) {
    if (!item || item.type !== "gear" || !locationId) return false;
    const locationOptions = getGearCarryLocationOptions(item);
    return locationOptions.some(option => option.id === locationId);
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
      const tierLabelKey = getTriskelCodex()?.tiers?.find(tier => tier.tier === tierValue)?.label
        ?? getTriskelIndex()?.tiers?.find(tier => tier.tier === tierValue)?.label
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
      const rollHelperContext = prepareRollHelperContext({
        actor,
        system: basePartContext.system,
        reserves: basePartContext.reserves ?? {},
        commit: basePartContext.commit ?? null
      });
      this._rollHelper = {
        rollData: rollHelperContext.rollHelperRollData ?? null,
        summary: rollHelperContext.rollHelperSummary ?? null,
        action: rollHelperContext.rollHelper?.action ?? null
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
      resizable: true,
      contentClasses: ["character-sheet"]
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
