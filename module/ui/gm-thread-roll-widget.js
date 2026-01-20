import { chatOutput } from "../util/chat-output.js";

const WIDGET_CLASS = "triskel-gm-thread-roll";
const ROLL_FORMULA = "1dt[Thread]-1dt[Obstacle]";

function createButton(localize) {
  return $(
    `<button type="button" class="${WIDGET_CLASS}" title="${localize("TRISKEL.Widget.ThreadObstacleRoll.Tooltip")}">
      <i class="fa-solid fa-dice-d10" aria-hidden="true"></i>
      <span>${localize("TRISKEL.Widget.ThreadObstacleRoll.Label")}</span>
    </button>`
  );
}

async function performThreadObstacleRoll(localize) {
  const roll = new Roll(ROLL_FORMULA);
  await roll.evaluate();

  await chatOutput({
    title: localize("TRISKEL.Widget.ThreadObstacleRoll.Title"),
    subtitle: localize("TRISKEL.Widget.ThreadObstacleRoll.Subtitle"),
    roll,
    rollMode: "blindroll"
  });

  await chatOutput({
    title: localize("TRISKEL.Widget.ThreadObstacleRoll.Title"),
    subtitle: localize("TRISKEL.Widget.ThreadObstacleRoll.Subtitle"),
    content: localize("TRISKEL.Widget.ThreadObstacleRoll.PublicMessage"),
    rollMode: "roll"
  });
}

export function registerThreadObstacleRollWidget() {
  Hooks.on("renderChatLog", (app, html) => {
    if (!game.user?.isGM) return;

    const controls = html.find("#chat-controls");
    if (!controls.length) return;
    if (controls.find(`.${WIDGET_CLASS}`).length) return;

    const localize = game.i18n.localize.bind(game.i18n);
    const button = createButton(localize);

    button.on("click", async () => {
      button.prop("disabled", true);
      try {
        await performThreadObstacleRoll(localize);
      } finally {
        button.prop("disabled", false);
      }
    });

    controls.append(button);
  });
}
