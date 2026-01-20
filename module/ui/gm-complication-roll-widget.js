import { chatOutput } from "../util/chat-output.js";

const WIDGET_CLASS = "triskel-complication-roll";
const ROLL_FORMULA = "1dt[Threat]-1dt[Obstacle]";
const I18N_ROOT = "TRISKEL.Widget.ComplicationRoll";

function getComplicationEntryLabel(total) {
  const entries = CONFIG.triskell?.codex?.complicationTable?.entries ?? [];
  const entry = entries.find(item => item?.range && total >= item.range.min && total <= item.range.max);
  if (!entry?.label) return null;
  return entry.label.startsWith?.("TRISKEL.") ? game.i18n.localize(entry.label) : entry.label;
}

function createButton(localize, { showLabel = true, extraClass = "" } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ui-control icon ${WIDGET_CLASS} ${extraClass}`.trim();
  button.title = localize(`${I18N_ROOT}.Tooltip`);
  button.setAttribute("aria-label", localize(`${I18N_ROOT}.Label`));
  button.innerHTML = `
    <i class="fa-solid fa-dice-d10" aria-hidden="true"></i>
    ${showLabel ? `<span>${localize(`${I18N_ROOT}.Label`)}</span>` : ""}
  `;
  return button;
}

async function performComplicationRoll(localize) {
  const roll = new Roll(ROLL_FORMULA);
  await roll.evaluate();
  const total = roll.total ?? 0;
  const entryLabel = getComplicationEntryLabel(total);
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

  await chatOutput({
    title: localize(`${I18N_ROOT}.Title`),
    subtitle: localize(`${I18N_ROOT}.Subtitle`),
    content: localize(`${I18N_ROOT}.PublicMessage`),
    rollMode: "roll"
  });
}

function addButtonToRightColumn(app, html) {
  if (!game.user?.isGM) return;

  const root = app?.element?.[0] ?? document;

  const column = root.querySelector("#ui-right-column-1");
  if (!column) return;
  if (column.querySelector(`.${WIDGET_CLASS}`)) return;

  const notifications = column.querySelector("#chat-notifications");
  if (!notifications) return;

  const localize = game.i18n.localize.bind(game.i18n);
  const button = createButton(localize, { showLabel: true, extraClass: "triskel-complication-roll--right" });

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await performComplicationRoll(localize);
    } finally {
      button.disabled = false;
    }
  });

  column.insertBefore(button, notifications);
}

export function registerComplicationRollWidget() {
  Hooks.on("renderChatLog", (app, html) => {
    addButtonToRightColumn(app, html);
  });

  Hooks.on("renderChatSidebar", (app, html) => {
    addButtonToRightColumn(app, html);
  });
}
