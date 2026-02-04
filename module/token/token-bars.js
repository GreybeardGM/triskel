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

const drawOutlinedArc = ({
  graphics,
  centerX,
  centerY,
  radius,
  outlineStart,
  outlineEnd,
  fillStart,
  fillEnd,
  fillColor
}) => {
  const outlineStartX = centerX + radius * Math.cos(outlineStart);
  const outlineStartY = centerY + radius * Math.sin(outlineStart);
  const outlineWidth = LINE_WIDTH + OUTLINE_WIDTH * 2;

  // Draw the outline arc for the full segment.
  graphics.lineStyle(outlineWidth, 0x000000, 1);
  graphics.moveTo(outlineStartX, outlineStartY);
  graphics.arc(centerX, centerY, radius, outlineStart, outlineEnd);

  if (fillStart === null || fillEnd === null) {
    return;
  }

  const fillStartX = centerX + radius * Math.cos(fillStart);
  const fillStartY = centerY + radius * Math.sin(fillStart);

  // Draw the filled arc inside the outline.
  graphics.lineStyle(LINE_WIDTH, fillColor, 1);
  graphics.moveTo(fillStartX, fillStartY);
  graphics.arc(centerX, centerY, radius, fillStart, fillEnd);
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
  token.triskelBarsState = null;
};

const getTokenDimensions = token => {
  const width = token?.w ?? token?.width ?? token?.document?.width ?? 0;
  const height = token?.h ?? token?.height ?? token?.document?.height ?? 0;
  return { width, height };
};

const drawPcReserveSegment = (graphics, centerX, centerY, radius, reserveValue, centerDeg, color, outlineAngle) => {
  // Reserve values are inverted (5 - min) so higher min shrinks the arc.
  const clampedValue = Math.max(0, Math.min(MAX_RESERVE_VALUE, reserveValue ?? 0));
  const isEmpty = clampedValue <= 0;
  const isFull = clampedValue >= MAX_RESERVE_VALUE;

  // Skip full segments entirely (no outline when full).
  if (isFull) {
    return;
  }

  const outlineStart = (centerDeg - outlineAngle / 2) * DEG_TO_RAD;
  const outlineEnd = (centerDeg + outlineAngle / 2) * DEG_TO_RAD;

  const fillAngle = isEmpty ? 0 : clampedValue * RESERVE_DEGREES_PER_POINT;
  const fillStart = isEmpty ? null : (centerDeg - fillAngle / 2) * DEG_TO_RAD;
  const fillEnd = isEmpty ? null : (centerDeg + fillAngle / 2) * DEG_TO_RAD;

  drawOutlinedArc({
    graphics,
    centerX,
    centerY,
    radius,
    outlineStart,
    outlineEnd,
    fillStart,
    fillEnd,
    fillColor: color
  });
};

const drawPcBars = (graphics, token) => {
  const reserves = token.actor?.system?.reserves ?? {};
  const { width, height } = getTokenDimensions(token);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(0, Math.min(width, height) / 2 - LINE_WIDTH);
  const outlineAngle = MAX_RESERVE_VALUE * RESERVE_DEGREES_PER_POINT;

  drawPcReserveSegment(
    graphics,
    centerX,
    centerY,
    radius,
    MAX_RESERVE_VALUE - (reserves.power?.min ?? 0),
    270,
    getTokenColor("power"),
    outlineAngle
  );

  drawPcReserveSegment(
    graphics,
    centerX,
    centerY,
    radius,
    MAX_RESERVE_VALUE - (reserves.grace?.min ?? 0),
    150,
    getTokenColor("grace"),
    outlineAngle
  );

  drawPcReserveSegment(
    graphics,
    centerX,
    centerY,
    radius,
    MAX_RESERVE_VALUE - (reserves.will?.min ?? 0),
    30,
    getTokenColor("will"),
    outlineAngle
  );
};

const drawNpcBars = (graphics, token) => {
  const wounds = token.actor?.system?.npcStats?.wounds ?? {};
  const max = wounds.max ?? 0;
  const value = wounds.value ?? 0;

  if (max <= 0) {
    return;
  }

  const isEmpty = value <= 0;
  const isFull = value >= max;

  // Skip full arcs entirely (no outline when full).
  if (isFull) {
    return;
  }

  const { width, height } = getTokenDimensions(token);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.max(0, Math.min(width, height) / 2 - LINE_WIDTH);

  const centerDeg = 270;
  const outlineStart = (centerDeg - NPC_ARC_DEGREES / 2) * DEG_TO_RAD;
  const outlineEnd = (centerDeg + NPC_ARC_DEGREES / 2) * DEG_TO_RAD;

  const fillRatio = isEmpty ? 0 : Math.max(0, Math.min(1, value / max));
  const fillAngle = NPC_ARC_DEGREES * fillRatio;
  const fillStart = isEmpty ? null : (centerDeg - fillAngle / 2) * DEG_TO_RAD;
  const fillEnd = isEmpty ? null : (centerDeg + fillAngle / 2) * DEG_TO_RAD;

  drawOutlinedArc({
    graphics,
    centerX,
    centerY,
    radius,
    outlineStart,
    outlineEnd,
    fillStart,
    fillEnd,
    fillColor: getTokenColor("wounds")
  });
};

const areStatesEqual = (left, right) => {
  if (!left || !right) {
    return false;
  }
  return left.type === right.type
    && left.powerMin === right.powerMin
    && left.graceMin === right.graceMin
    && left.willMin === right.willMin
    && left.woundsValue === right.woundsValue
    && left.woundsMax === right.woundsMax;
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

  const actor = token.actor;
  const reserves = actor?.system?.reserves ?? {};
  const wounds = actor?.system?.npcStats?.wounds ?? {};
  const nextState = {
    type: actor?.type ?? null,
    powerMin: reserves.power?.min ?? null,
    graceMin: reserves.grace?.min ?? null,
    willMin: reserves.will?.min ?? null,
    woundsValue: wounds.value ?? null,
    woundsMax: wounds.max ?? null
  };

  if (token.triskelBars && areStatesEqual(token.triskelBarsState, nextState)) {
    return;
  }

  removeExistingBars(token);

  const graphics = new PIXI.Graphics();
  token.triskelBars = graphics;
  token.triskelBarsState = nextState;
  token.addChild(graphics);

  if (token.actor?.type === "character") {
    drawPcBars(graphics, token);
  } else if (token.actor?.type === "npc") {
    drawNpcBars(graphics, token);
  }
};
