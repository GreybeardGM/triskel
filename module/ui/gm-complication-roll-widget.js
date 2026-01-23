import { chatOutput } from "../util/chat-output.js";

const WIDGET_CONTAINER_CLASS = "complication-roll-widget";
const STORED_ROW_CLASS = "complication-roll__stored";
const STORED_CARD_CLASS = "complication-roll__card";
const STORED_DROP_CLASS = "complication-roll__drop";
const ROLL_FORMULA = "1dt[Threat]-1dt[Obstacle]";
const I18N_ROOT = "TRISKEL.Widget.ComplicationRoll";
const STORED_SETTING_KEY = "storedComplicationRoll";

function getComplicationEntry(total) {
  const entries = CONFIG.triskell?.codex?.complicationTable?.entries ?? [];
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

function createIconButton(localize, { icon, title, label, extraClass = "" } = {}) {
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
  return createIconButton(localize, {
    icon: "fa-solid fa-hand-pointer",
    title: localize(`${I18N_ROOT}.DropTooltip`),
    extraClass: STORED_DROP_CLASS
  });
}

function createRollButton(localize) {
  return createIconButton(localize, {
    icon: "fa-solid fa-dice-d10",
    title: localize(`${I18N_ROOT}.Tooltip`),
    label: localize(`${I18N_ROOT}.Label`),
    extraClass: "complication-roll__button"
  });
}

function createStoredCard() {
  const card = document.createElement("div");
  card.className = STORED_CARD_CLASS;
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
  const gmContent = entryLabel
    ? `<p><strong>${entryLabel}</strong> (${total})</p>`
    : `<p>${localize(`${I18N_ROOT}.ResultFallback`)} (${total})</p>`;

  await chatOutput({
    title: localize(`${I18N_ROOT}.Title`),
    subtitle: localize(`${I18N_ROOT}.Subtitle`),
    content: gmContent,
    roll,
    rollMode: "blindroll"
  });

  const storedComplication = {
    total,
    label: formatComplicationLabel(localize, entryLabel, total)
  };
  await setStoredComplication(storedComplication);
  updateStoredComplicationDisplay(document, localize, storedComplication);

  await chatOutput({
    title: localize(`${I18N_ROOT}.Title`),
    subtitle: localize(`${I18N_ROOT}.Subtitle`),
    content: localize(`${I18N_ROOT}.PublicMessage`),
    rollMode: "roll"
  });
}

function addWidgetToRightColumn(app, html) {
  if (!game.user?.isGM) return;

  const root = app?.element?.[0] ?? document;

  const column = root.querySelector("#ui-right-column-1");
  if (!column) return;
  if (column.querySelector(`.${WIDGET_CONTAINER_CLASS}`)) return;

  const notifications = column.querySelector("#chat-notifications");
  if (!notifications) return;

  const localize = game.i18n.localize.bind(game.i18n);
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

  column.insertBefore(container, notifications);
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
      const localize = game.i18n?.localize?.bind(game.i18n) ?? (key => key);
      updateStoredComplicationDisplay(document, localize, value);
    }
  });
}

export function registerComplicationRollWidget() {
  Hooks.on("renderChatLog", (app, html) => {
    addWidgetToRightColumn(app, html);
  });

  Hooks.on("renderChatSidebar", (app, html) => {
    addWidgetToRightColumn(app, html);
  });
}
