const DEG_TO_RAD = Math.PI / 180;
const MAX_RESERVE_VALUE = 5;
const RESERVE_DEGREES_PER_POINT = 22;
const NPC_ARC_DEGREES = 180;
const LINE_WIDTH = 3;
const OUTLINE_WIDTH = 1;

const TRISKEL_TOKEN_COLORS = {
  power: "#d9534f",
  grace: "#5cb85c",
  will: "#5bc0de",
  wounds: "#7a1f1f"
};

const getTokenColor = key => PIXI.utils.string2hex(TRISKEL_TOKEN_COLORS[key] ?? "#ffffff");

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
  if (clampedValue >= MAX_RESERVE_VALUE) {
    return;
  }

  const outlineAngle = MAX_RESERVE_VALUE * RESERVE_DEGREES_PER_POINT;
  const outlineStart = (centerDeg - outlineAngle / 2) * DEG_TO_RAD;
  const outlineEnd = (centerDeg + outlineAngle / 2) * DEG_TO_RAD;
  const outlineStartX = centerX + radius * Math.cos(outlineStart);
  const outlineStartY = centerY + radius * Math.sin(outlineStart);
  const outlineWidth = LINE_WIDTH + OUTLINE_WIDTH * 2;

  graphics.lineStyle(outlineWidth, 0x000000, 1);
  graphics.moveTo(outlineStartX, outlineStartY);
  graphics.arc(centerX, centerY, radius, outlineStart, outlineEnd);

  if (clampedValue <= 0) {
    return;
  }

  const fillAngle = clampedValue * RESERVE_DEGREES_PER_POINT;
  const start = (centerDeg - fillAngle / 2) * DEG_TO_RAD;
  const end = (centerDeg + fillAngle / 2) * DEG_TO_RAD;

  const startX = centerX + radius * Math.cos(start);
  const startY = centerY + radius * Math.sin(start);

  graphics.lineStyle(LINE_WIDTH, color, 1);
  graphics.moveTo(startX, startY);
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
    MAX_RESERVE_VALUE - (reserves.power?.min ?? 0),
    270,
    getTokenColor("power")
  );

  drawPcReserveSegment(
    graphics,
    centerX,
    centerY,
    radius,
    MAX_RESERVE_VALUE - (reserves.grace?.min ?? 0),
    150,
    getTokenColor("grace")
  );

  drawPcReserveSegment(
    graphics,
    centerX,
    centerY,
    radius,
    MAX_RESERVE_VALUE - (reserves.will?.min ?? 0),
    30,
    getTokenColor("will")
  );
};

const drawNpcBars = (graphics, token) => {
  const wounds = token.actor?.system?.npcStats?.wounds ?? {};
  const max = wounds.max ?? 0;
  const value = wounds.value ?? 0;

  if (max <= 0) {
    return;
  }

  if (value >= max) {
    return;
  }

  const fillRatio = Math.max(0, Math.min(1, value / max));
  const fillAngle = NPC_ARC_DEGREES * fillRatio;

  const { width, height } = getTokenDimensions(token);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(0, Math.min(width, height) / 2 - LINE_WIDTH);

  const centerDeg = 270;
  const outlineStart = (centerDeg - NPC_ARC_DEGREES / 2) * DEG_TO_RAD;
  const outlineEnd = (centerDeg + NPC_ARC_DEGREES / 2) * DEG_TO_RAD;
  const outlineStartX = centerX + radius * Math.cos(outlineStart);
  const outlineStartY = centerY + radius * Math.sin(outlineStart);
  const outlineWidth = LINE_WIDTH + OUTLINE_WIDTH * 2;

  graphics.lineStyle(outlineWidth, 0x000000, 1);
  graphics.moveTo(outlineStartX, outlineStartY);
  graphics.arc(centerX, centerY, radius, outlineStart, outlineEnd);

  if (value <= 0) {
    return;
  }

  const start = (centerDeg - fillAngle / 2) * DEG_TO_RAD;
  const end = (centerDeg + fillAngle / 2) * DEG_TO_RAD;
  const startX = centerX + radius * Math.cos(start);
  const startY = centerY + radius * Math.sin(start);

  graphics.lineStyle(LINE_WIDTH, getTokenColor("wounds"), 1);
  graphics.moveTo(startX, startY);
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
