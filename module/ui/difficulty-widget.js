const WIDGET_CONTAINER_CLASS = "difficulty-widget";
const TOGGLE_BUTTON_CLASS = "difficulty-widget__toggle";
const VALUE_CLASS = "difficulty-widget__value";
const GM_CONTROLS_CLASS = "difficulty-widget__controls";
const I18N_ROOT = "TRISKEL.Widget.Difficulty";
const FLAG_KEY = "difficulty";
const DIFFICULTY_VALUES = [10, 12, 14, 16];

function getCurrentScene() {
  return game.scenes?.current ?? game.canvas?.scene ?? null;
}

function getDifficulty() {
  return getCurrentScene()?.getFlag("triskel", FLAG_KEY) ?? null;
}

async function setDifficulty(value) {
  const scene = getCurrentScene();
  if (!scene) return;
  await scene.setFlag("triskel", FLAG_KEY, { value, persist: false });
}

function createToggleButton(localize) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `ui-control ${TOGGLE_BUTTON_CLASS}`;
  button.title = localize(`${I18N_ROOT}.Toggle`);
  button.setAttribute("aria-expanded", "true");
  button.innerHTML = '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
  return button;
}

function createValueDisplay(localize) {
  const wrapper = document.createElement("div");
  wrapper.className = VALUE_CLASS;
  wrapper.setAttribute("role", "status");
  wrapper.setAttribute("aria-live", "polite");
  wrapper.innerHTML = `
    <div class="difficulty-widget__label">${localize(`${I18N_ROOT}.Label`)}</div>
    <div class="difficulty-widget__number">—</div>
  `;
  return wrapper;
}

function createControls() {
  const controls = document.createElement("div");
  controls.className = GM_CONTROLS_CLASS;

  DIFFICULTY_VALUES.forEach(value => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "difficulty-widget__control";
    button.textContent = String(value);
    button.dataset.value = String(value);
    controls.append(button);
  });

  return controls;
}

function updateDifficultyDisplay(root, localize, data = getDifficulty()) {
  const widgets = root.querySelectorAll(`.${WIDGET_CONTAINER_CLASS}`);
  widgets.forEach(widget => {
    const number = widget.querySelector(`.${VALUE_CLASS} .difficulty-widget__number`);
    if (!number) return;

    if (Number.isFinite(data?.value)) {
      number.textContent = String(data.value);
    } else {
      number.textContent = localize(`${I18N_ROOT}.Empty`);
    }
  });
}

function updateToggleState(container, expanded) {
  container.classList.toggle("is-collapsed", !expanded);
  const toggle = container.querySelector(`.${TOGGLE_BUTTON_CLASS}`);
  if (!toggle) return;
  toggle.setAttribute("aria-expanded", String(expanded));
  const icon = toggle.querySelector("i");
  if (icon) {
    icon.classList.toggle("fa-chevron-down", expanded);
    icon.classList.toggle("fa-chevron-up", !expanded);
  }
}

function addWidget(root) {
  if (!root || root.querySelector(`.${WIDGET_CONTAINER_CLASS}`)) return;

  const localize = game.i18n.localize.bind(game.i18n);
  const container = document.createElement("div");
  container.className = `triskel ${WIDGET_CONTAINER_CLASS}`;

  const toggleButton = createToggleButton(localize);
  const valueDisplay = createValueDisplay(localize);

  container.append(toggleButton, valueDisplay);

  if (game.user?.isGM) {
    const controls = createControls();
    container.append(controls);

    controls.addEventListener("click", async event => {
      const button = event.target.closest("button");
      if (!button) return;
      const value = Number(button.dataset.value);
      if (!Number.isFinite(value)) return;
      button.disabled = true;
      try {
        await setDifficulty(value);
      } finally {
        button.disabled = false;
      }
    });
  }

  toggleButton.addEventListener("click", () => {
    const expanded = toggleButton.getAttribute("aria-expanded") === "true";
    updateToggleState(container, !expanded);
  });

  root.append(container);
  updateToggleState(container, true);
  updateDifficultyDisplay(container, localize);
}

function ensureWidget() {
  addWidget(document.body);
}

export function registerDifficultyWidget() {
  Hooks.on("renderChatLog", () => {
    ensureWidget();
  });

  Hooks.on("renderChatSidebar", () => {
    ensureWidget();
  });

  Hooks.on("canvasReady", () => {
    ensureWidget();
    const localize = game.i18n?.localize?.bind(game.i18n) ?? (key => key);
    updateDifficultyDisplay(document, localize);
  });

  Hooks.on("updateScene", scene => {
    if (scene.id !== getCurrentScene()?.id) return;
    const localize = game.i18n?.localize?.bind(game.i18n) ?? (key => key);
    updateDifficultyDisplay(document, localize);
  });
}
