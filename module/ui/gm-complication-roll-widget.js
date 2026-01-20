import { chatOutput } from "../util/chat-output.js";

const WIDGET_CLASS = "triskel-complication-roll";
const ROLL_FORMULA = "1dt[Threat]-1dt[Obstacle]";
const I18N_ROOT = "TRISKEL.Widget.ComplicationRoll";

function createButton(localize) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `chat-control-icon ${WIDGET_CLASS}`;
  button.title = localize(`${I18N_ROOT}.Tooltip`);
  button.innerHTML = `
    <i class="fa-solid fa-dice-d10" aria-hidden="true"></i>
    <span>${localize(`${I18N_ROOT}.Label`)}</span>
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

function addButtonToChatControls(html) {
  if (!game.user?.isGM) return;

  const root = html?.[0] ?? html;
  if (!root) return;

  const controls = root.querySelector(".chat-controls") ?? root.querySelector("#chat-controls");
  if (!controls) return;
  if (controls.querySelector(`.${WIDGET_CLASS}`)) return;

  const localize = game.i18n.localize.bind(game.i18n);
  const button = createButton(localize);

  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await performComplicationRoll(localize);
    } finally {
      button.disabled = false;
    }
  });

  controls.appendChild(button);
}

export function registerComplicationRollWidget() {
  Hooks.on("renderChatLog", (app, html) => {
    addButtonToChatControls(html);
  });

  Hooks.on("renderChatSidebar", (app, html) => {
    addButtonToChatControls(html);
  });
}
