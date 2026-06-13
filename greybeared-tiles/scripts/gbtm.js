const MODULE_ID = "greybeared-tiles";
const NAMESPACE = "gbtm";
const SETPIECES_FLAG = "setpieces";
const PICKER_SOURCE = "data";
const PICKER_START_PATH = "assets/artworks";

function localize(key) {
  return game.i18n?.localize?.(`${NAMESPACE}.${key}`) ?? key;
}

function currentScene() {
  return canvas?.scene ?? game.scenes?.current ?? null;
}

function randomId() {
  return foundry.utils.randomID(16);
}

function getSetpieces(scene = currentScene()) {
  const entries = scene?.getFlag(MODULE_ID, SETPIECES_FLAG);
  return Array.isArray(entries) ? entries : [];
}

async function setSetpieces(setpieces, scene = currentScene()) {
  if (!scene) return;
  await scene.setFlag(MODULE_ID, SETPIECES_FLAG, setpieces);
}

function getTile(tileId) {
  if (!tileId) return null;
  return canvas?.scene?.tiles?.get(tileId) ?? null;
}

function selectedTile() {
  const controlled = canvas?.tiles?.controlled ?? [];
  return controlled[0]?.document ?? null;
}

function textureSource(tile) {
  return tile?.texture?.src ?? tile?.document?.texture?.src ?? "";
}

async function addSelectedTileSetpiece() {
  const tile = selectedTile();

  if (!tile) {
    ui.notifications?.warn(localize("Notifications.NoSelectedTile"));
    return;
  }

  const scene = currentScene();
  if (!scene) return;

  const setpieces = getSetpieces(scene);
  setpieces.push({
    id: randomId(),
    tileId: tile.id,
    name: tile.name || localize("Setpieces.FallbackName"),
    src: textureSource(tile)
  });

  await setSetpieces(setpieces, scene);
  ui.notifications?.info(localize("Notifications.SetpieceAdded"));
  GBTMSetpieceBar.renderSingleton(true);
}

async function updateSetpieceTexture(setpieceId, path) {
  const scene = currentScene();
  if (!scene) return;

  const setpieces = getSetpieces(scene);
  const index = setpieces.findIndex(setpiece => setpiece.id === setpieceId);
  if (index < 0) return;

  const setpiece = setpieces[index];
  const tile = getTile(setpiece.tileId);

  if (!tile) {
    ui.notifications?.error(localize("Notifications.TileNotFound"));
    return;
  }

  await tile.update({ texture: { src: path } });
  setpieces[index] = { ...setpiece, src: path };
  await setSetpieces(setpieces, scene);
  ui.notifications?.info(game.i18n?.format?.(`${NAMESPACE}.Notifications.SetpieceChanged`, { path }) ?? path);
}

function openSetpiecePicker(setpiece) {
  new FilePicker({
    type: "image",
    source: PICKER_SOURCE,
    current: setpiece.src || PICKER_START_PATH,
    callback: path => updateSetpieceTexture(setpiece.id, path)
  }).render(true);
}

class GBTMSetpieceBar extends foundry.applications.api.ApplicationV2 {
  static singleton = null;

  static DEFAULT_OPTIONS = {
    id: "gbtm-setpiece-bar",
    classes: ["gbtm", "gbtm-setpiece-bar"],
    tag: "section",
    window: {
      frame: false,
      positioned: false
    },
    position: {
      top: 0,
      left: "50%"
    }
  };

  static renderSingleton(force = false) {
    if (!this.singleton) this.singleton = new this();
    return this.singleton.render({ force });
  }

  async _renderHTML() {
    const setpieces = getSetpieces();

    const thumbnails = setpieces.map(setpiece => `
      <button type="button" class="gbtm-setpiece-bar__thumbnail" data-setpiece-id="${foundry.utils.escapeHTML(setpiece.id)}" title="${foundry.utils.escapeHTML(setpiece.name || setpiece.src || localize("Setpieces.FallbackName"))}">
        ${setpiece.src ? `<img src="${foundry.utils.escapeHTML(setpiece.src)}" alt="">` : `<i class="fa-solid fa-image" aria-hidden="true"></i>`}
      </button>
    `).join("");

    return `
      <div class="gbtm-setpiece-bar__content">
        ${thumbnails || `<p class="gbtm-setpiece-bar__empty">${localize("Setpieces.Empty")}</p>`}
      </div>
    `;
  }

  _replaceHTML(result, content) {
    content.innerHTML = result;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.style.position = "absolute";
    this.element.style.top = "0";
    this.element.style.left = "50%";
    this.element.style.transform = "translateX(-50%)";
    this.element.addEventListener("click", event => {
      const button = event.target.closest("[data-setpiece-id]");
      if (!button) return;
      const setpiece = getSetpieces().find(entry => entry.id === button.dataset.setpieceId);
      if (setpiece) openSetpiecePicker(setpiece);
    });
  }
}

function addToolToControls(controls, controlName, tool) {
  if (Array.isArray(controls)) {
    const control = controls.find(entry => entry.name === controlName);
    if (control) control.tools.push(tool);
    return;
  }

  const control = controls[controlName];
  if (!control) return;
  if (control.tools instanceof Map) control.tools.set(tool.name, tool);
  else control.tools[tool.name] = tool;
}

Hooks.on("getSceneControlButtons", controls => {
  addToolToControls(controls, "tiles", {
    name: "gbtm-add-setpiece",
    title: localize("Controls.AddSetpiece"),
    icon: "fa-solid fa-photo-film",
    button: true,
    onClick: () => addSelectedTileSetpiece()
  });

  addToolToControls(controls, "tiles", {
    name: "gbtm-toggle-setpieces",
    title: localize("Controls.ToggleSetpieces"),
    icon: "fa-solid fa-masks-theater",
    button: true,
    onClick: () => GBTMSetpieceBar.renderSingleton(true)
  });
});

Hooks.on("canvasReady", () => {
  if (GBTMSetpieceBar.singleton?.rendered) GBTMSetpieceBar.renderSingleton(true);
});

Hooks.on("updateScene", scene => {
  if (scene.id === currentScene()?.id && GBTMSetpieceBar.singleton?.rendered) GBTMSetpieceBar.renderSingleton(true);
});

window.GBTM = {
  ...(window.GBTM ?? {}),
  GBTMSetpieceBar,
  addSelectedTileSetpiece,
  getSetpieces
};
