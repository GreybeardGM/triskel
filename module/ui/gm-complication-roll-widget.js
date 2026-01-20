import { chatOutput } from "../util/chat-output.js";

const WIDGET_CLASS = "triskel-complication-roll";
const ROLL_FORMULA = "1dt[Threat]-1dt[Obstacle]";
const I18N_ROOT = "TRISKEL.Widget.ComplicationRoll";

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

  await chatOutput({
    title: localize(`${I18N_ROOT}.Title`),
    subtitle: localize(`${I18N_ROOT}.Subtitle`),
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

function addButtonToTopBar(html) {
  if (!game.user?.isGM) return;

  const root = html?.[0] ?? html;
  if (!root) return;

  const navBar = root.querySelector("#nav-bar") ?? root.querySelector("#navigation") ?? root;
  if (!navBar) return;
  if (navBar.querySelector(`.${WIDGET_CLASS}`)) return;

  const localize = game.i18n.localize.bind(game.i18n);
  const button = createButton(localize, { showLabel: false, extraClass: "triskel-complication-roll--top" });

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await performComplicationRoll(localize);
    } finally {
      button.disabled = false;
    }
  });

  navBar.appendChild(button);
}

export function registerComplicationRollWidget() {
  Hooks.on("renderSceneNavigation", (app, html) => {
    addButtonToTopBar(html);
  });
}
