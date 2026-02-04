const DEG_TO_RAD = Math.PI / 180;
const MAX_RESERVE_VALUE = 5;
const RESERVE_DEGREES_PER_POINT = 24;
const NPC_ARC_DEGREES = 180;
const LINE_WIDTH = 2;

const getCssColor = variableName => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return PIXI.utils.string2hex(value || "#ffffff");
};

const removeExistingBars = token => {
  if (!token?.triskelBars) {
    return;
  }

  if (token.triskelBars.parent) {
    token.triskelBars.parent.removeChild(token.triskelBars);
  }

  token.triskelBars.destroy({ children: true });
  token.triskelBars = null;
};

const getTokenDimensions = token => {
  const width = token?.w ?? token?.width ?? token?.document?.width ?? 0;
  const height = token?.h ?? token?.height ?? token?.document?.height ?? 0;
  return { width, height };
};

const drawPcReserveSegment = (graphics, centerX, centerY, radius, reserveValue, centerDeg, color) => {
  const clampedValue = Math.max(0, Math.min(MAX_RESERVE_VALUE, reserveValue ?? 0));
  const fillAngle = clampedValue * RESERVE_DEGREES_PER_POINT;

  if (fillAngle <= 0) {
    return;
  }

  const start = (centerDeg - fillAngle / 2) * DEG_TO_RAD;
  const end = (centerDeg + fillAngle / 2) * DEG_TO_RAD;

  graphics.lineStyle(LINE_WIDTH, color, 1);
  graphics.arc(centerX, centerY, radius, start, end);
};

const drawPcBars = (graphics, token) => {
  const reserves = token.actor?.system?.reserves ?? {};
  const { width, height } = getTokenDimensions(token);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(0, Math.min(width, height) / 2 - LINE_WIDTH);

  drawPcReserveSegment(
    graphics,
    centerX,
    centerY,
    radius,
    reserves.power,
    135,
    getCssColor("--triskel-color-highlight-power")
  );

  drawPcReserveSegment(
    graphics,
    centerX,
    centerY,
    radius,
    reserves.grace,
    45,
    getCssColor("--triskel-color-highlight-grace")
  );

  drawPcReserveSegment(
    graphics,
    centerX,
    centerY,
    radius,
    reserves.will,
    270,
    getCssColor("--triskel-color-highlight-will")
  );
};

const drawNpcBars = (graphics, token) => {
  const wounds = token.actor?.system?.npcStats?.wounds ?? {};
  const max = wounds.max ?? 0;
  const value = wounds.value ?? 0;

  if (max <= 0) {
    return;
  }

  const missingRatio = Math.max(0, Math.min(1, (max - value) / max));
  const fillAngle = NPC_ARC_DEGREES * missingRatio;

  if (fillAngle <= 0) {
    return;
  }

  const { width, height } = getTokenDimensions(token);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(0, Math.min(width, height) / 2 - LINE_WIDTH);

  const start = 180 * DEG_TO_RAD;
  const end = (180 - fillAngle) * DEG_TO_RAD;

  graphics.lineStyle(LINE_WIDTH, getCssColor("--triskel-color-highlight-wounds"), 1);
  graphics.arc(centerX, centerY, radius, start, end);
};

export const cleanupTriskelTokenBars = token => {
  removeExistingBars(token);
};

export const drawTriskelTokenBars = token => {
  if (!token?.actor) {
    removeExistingBars(token);
    return;
  }

  if (token.document) {
    token.document.displayBars = CONST.TOKEN_DISPLAY_MODES.NONE;
  }

  removeExistingBars(token);

  const graphics = new PIXI.Graphics();
  token.triskelBars = graphics;
  token.addChild(graphics);

  if (token.actor?.type === "character") {
    drawPcBars(graphics, token);
  } else if (token.actor?.type === "npc") {
    drawNpcBars(graphics, token);
  }
};
