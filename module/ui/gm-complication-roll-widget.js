import { chatOutput } from "../util/chat-output.js";
import { getTriskelCodex } from "../actor/sheet-helpers.js";
import { getWidgetHost } from "./widget-host.js";

const WIDGET_CONTAINER_CLASS = "complication-roll-widget";
const STORED_ROW_CLASS = "complication-roll__stored";
const STORED_CARD_CLASS = "complication-roll__card";
const STORED_DROP_CLASS = "complication-roll__drop";
const ROLL_FORMULA = "1dt[Threat]-1dt[Obstacle]";
const I18N_ROOT = "TRISKEL.Widget.ComplicationRoll";
const STORED_SETTING_KEY = "storedComplicationRoll";

function getLocalize() {
  return game.i18n?.localize?.bind(game.i18n) ?? (key => key);
}

function getComplicationEntry(total) {
  const entries = getTriskelCodex()?.complicationTable?.entries ?? [];
  return entries.find(item => item?.range && total >= item.range.min && total <= item.range.max) ?? null;
}

function getComplicationEntryLabel(entry, localize) {
  if (!entry?.label) return null;
  return entry.label.startsWith?.("TRISKEL.") ? localize(entry.label) : entry.label;
}

function formatComplicationLabel(localize, entryLabel, total) {
  const baseLabel = entryLabel ?? localize(`${I18N_ROOT}.ResultFallback`);
  return `${baseLabel} (${total})`;
}

function getComplicationTone(total) {
  if (total < 0) return "obstacle";
  if (total > 0) return "threat";
  return null;
}

function createIconButton({ icon, title, label, extraClass = "" } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ui-control ${extraClass}`.trim();
  if (title) button.title = title;
  button.innerHTML = `
    <i class="${icon}" aria-hidden="true"></i>
    ${label ? `<span>${label}</span>` : ""}
  `;
  return button;
}

function createDropButton(localize) {
  return createIconButton({
    icon: "fa-solid fa-hand-pointer",
    title: localize(`${I18N_ROOT}.DropTooltip`),
    extraClass: STORED_DROP_CLASS
  });
}

function createRollButton(localize) {
  return createIconButton({
    icon: "fa-solid fa-dice-d10",
    title: localize(`${I18N_ROOT}.Tooltip`),
    label: localize(`${I18N_ROOT}.Label`),
    extraClass: "complication-roll__button"
  });
}

function createStoredCard() {
  const card = document.createElement("div");
  card.className = `${STORED_CARD_CLASS} complication-tone`;
  return card;
}

function getStoredComplication() {
  return game.settings.get("triskel", STORED_SETTING_KEY);
}

async function setStoredComplication(value) {
  await game.settings.set("triskel", STORED_SETTING_KEY, value);
}

function updateStoredComplicationDisplay(root, localize, stored = getStoredComplication()) {
  const widgets = root.querySelectorAll(`.${WIDGET_CONTAINER_CLASS}`);
  const label = stored?.label ?? localize(`${I18N_ROOT}.StoredEmpty`);
  const tone = stored ? getComplicationTone(stored.total ?? 0) : null;

  widgets.forEach(widget => {
    const card = widget.querySelector(`.${STORED_CARD_CLASS}`);
    const dropButton = widget.querySelector(`.${STORED_DROP_CLASS}`);
    if (!card || !dropButton) return;

    card.textContent = label;
    card.classList.toggle("obstacle", tone === "obstacle");
    card.classList.toggle("threat", tone === "threat");

    dropButton.disabled = !stored;
    dropButton.setAttribute("aria-disabled", String(!stored));
  });
}

async function performComplicationRoll(localize) {
  const roll = new Roll(ROLL_FORMULA);
  await roll.evaluate();
  const total = roll.total ?? 0;
  const entry = getComplicationEntry(total);
  const entryLabel = getComplicationEntryLabel(entry, localize);
  const complicationLabel = formatComplicationLabel(localize, entryLabel, total);

  await chatOutput({
    title: localize(`${I18N_ROOT}.Label`),
    subtitle: localize(`${I18N_ROOT}.Subtitle`),
    complication: complicationLabel,
    complicationTone: getComplicationTone(total),
    roll,
    rollMode: "blindroll"
  });

  const storedComplication = {
    total,
    label: complicationLabel
  };
  await setStoredComplication(storedComplication);
  updateStoredComplicationDisplay(document, localize, storedComplication);

  await chatOutput({
    title: localize(`${I18N_ROOT}.Label`),
    subtitle: localize(`${I18N_ROOT}.Subtitle`),
    content: localize(`${I18N_ROOT}.PublicMessage`),
    rollMode: "roll"
  });
}

// Mount the widget next to the difficulty widget in the shared host.
function addWidgetToHost() {
  if (!game.user?.isGM) return;

  const host = getWidgetHost(document);
  if (!host || host.querySelector(`.${WIDGET_CONTAINER_CLASS}`)) return;

  const localize = getLocalize();
  const storedRow = document.createElement("div");
  storedRow.className = STORED_ROW_CLASS;

  const dropButton = createDropButton(localize);
  const storedCard = createStoredCard();

  storedRow.append(dropButton, storedCard);

  const button = createRollButton(localize);

  dropButton.addEventListener("click", async () => {
    dropButton.disabled = true;
    try {
      await setStoredComplication(null);
      updateStoredComplicationDisplay(document, localize, null);
    } finally {
      dropButton.disabled = false;
    }
  });

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await performComplicationRoll(localize);
    } finally {
      button.disabled = false;
    }
  });

  const container = document.createElement("div");
  container.className = `triskel ${WIDGET_CONTAINER_CLASS}`;
  container.append(storedRow, button);

  const difficultyWidget = host.querySelector(".difficulty-widget");
  if (difficultyWidget?.nextSibling) {
    host.insertBefore(container, difficultyWidget.nextSibling);
  } else if (difficultyWidget) {
    host.append(container);
  } else {
    host.append(container);
  }
  updateStoredComplicationDisplay(container, localize);
}

export function registerComplicationRollSettings() {
  game.settings.register("triskel", STORED_SETTING_KEY, {
    name: "Stored complication roll",
    scope: "world",
    config: false,
    type: Object,
    default: null,
    onChange: value => {
      updateStoredComplicationDisplay(document, getLocalize(), value);
    }
  });
}

export function registerComplicationRollWidget() {
  Hooks.on("renderChatLog", () => {
    addWidgetToHost();
  });

  Hooks.on("renderChatSidebar", () => {
    addWidgetToHost();
  });
}
