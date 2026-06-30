const FLAG_SCOPE = "triskel";
const FLAG_KEY = "difficulty";
const SOCKET_NAMESPACE = "system.triskel";
const CONSUME_DIFFICULTY_REQUEST = "consumeDifficultyRequest";
const CONSUME_DIFFICULTY_RESPONSE = "consumeDifficultyResponse";
const DIFFICULTY_REQUEST_TIMEOUT_MS = 5000;

const pendingDifficultyRequests = new Map();
let difficultyServiceRegistered = false;

function getScene(sceneId) {
  if (sceneId) return game.scenes?.get?.(sceneId) ?? null;
  return getCurrentScene();
}

function getUser(userId) {
  if (!userId) return null;
  return game.users?.get?.(userId) ?? null;
}

function getActiveGms() {
  const users = game.users?.contents ?? Array.from(game.users ?? []);
  return users
    .filter(user => user?.isGM && user?.active)
    .sort((a, b) => String(a?.id ?? "").localeCompare(String(b?.id ?? "")));
}

function isPrimaryGm() {
  if (!game.user?.isGM) return false;
  return getActiveGms()[0]?.id === game.user.id;
}

function createRequestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${game.user?.id ?? "user"}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function resolvePendingDifficultyRequest(message) {
  const pending = pendingDifficultyRequests.get(message?.requestId);
  if (!pending) return;
  if (message.userId !== game.user?.id) return;

  clearTimeout(pending.timeoutId);
  pendingDifficultyRequests.delete(message.requestId);
  pending.resolve(normalizeDifficultyData({ value: message.value, persist: message.persist }));
}

async function handleConsumeDifficultyRequest(message) {
  if (!game.user?.isGM || !isPrimaryGm()) return;

  const requestingUserId = message?.userId;
  if (!message?.requestId || !getUser(requestingUserId)) return;

  let difficulty = normalizeDifficultyData(null);
  let value = null;
  try {
    difficulty = normalizeDifficultyData(getScene(message.sceneId)?.getFlag(FLAG_SCOPE, FLAG_KEY) ?? null);
    value = await consumeSceneDifficulty({ sceneId: message.sceneId });
  } catch (error) {
    console.error("Triskel | Failed to consume difficulty for socket request.", error);
  }

  game.socket?.emit?.(SOCKET_NAMESPACE, {
    type: CONSUME_DIFFICULTY_RESPONSE,
    requestId: message.requestId,
    userId: requestingUserId,
    sceneId: message.sceneId ?? null,
    value: Number.isFinite(value) ? value : null,
    persist: difficulty.persist === true
  });
}

function handleSocketMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === CONSUME_DIFFICULTY_REQUEST) {
    void handleConsumeDifficultyRequest(message);
    return;
  }

  if (message.type === CONSUME_DIFFICULTY_RESPONSE) {
    resolvePendingDifficultyRequest(message);
  }
}

export function normalizeDifficultyData(data) {
  return {
    value: Number.isFinite(data?.value) ? data.value : null,
    persist: data?.persist === true
  };
}

export function getCurrentScene() {
  return game.scenes?.current ?? game.canvas?.scene ?? null;
}

export async function setSceneDifficulty(value, { persist = false } = {}) {
  const scene = getCurrentScene();
  if (!scene) return null;

  const difficultyData = normalizeDifficultyData({ value, persist });
  await scene.setFlag(FLAG_SCOPE, FLAG_KEY, difficultyData);
  return difficultyData;
}

export async function consumeSceneDifficulty({ sceneId } = {}) {
  if (!game.user?.isGM) return null;

  const scene = getScene(sceneId);
  if (!scene) return null;

  const currentDifficulty = normalizeDifficultyData(scene.getFlag(FLAG_SCOPE, FLAG_KEY) ?? null);

  if (currentDifficulty.persist === true) {
    ui.notifications?.info("Difficulty retained");
    return currentDifficulty.value;
  }

  await scene.setFlag(FLAG_SCOPE, FLAG_KEY, { value: null, persist: false });
  ui.notifications?.info("Difficulty consumed");

  return currentDifficulty.value;
}

export function registerDifficultyService() {
  if (difficultyServiceRegistered) return;
  difficultyServiceRegistered = true;
  game.socket?.on?.(SOCKET_NAMESPACE, handleSocketMessage);
}

export async function requestDifficultyForRoll({ sceneId, timeout = DIFFICULTY_REQUEST_TIMEOUT_MS } = {}) {
  if (game.user?.isGM) {
    const difficulty = normalizeDifficultyData(getScene(sceneId)?.getFlag(FLAG_SCOPE, FLAG_KEY) ?? null);
    const value = await consumeSceneDifficulty({ sceneId });
    return normalizeDifficultyData({ value, persist: difficulty.persist });
  }

  if (!getActiveGms().length) {
    ui.notifications?.warn("No active GM available to consume difficulty.");
    return { ...normalizeDifficultyData(null), aborted: true };
  }

  const requestId = createRequestId();
  const response = new Promise(resolve => {
    const timeoutId = setTimeout(() => {
      pendingDifficultyRequests.delete(requestId);
      ui.notifications?.warn("No GM response received for difficulty. Roll aborted.");
      resolve({ ...normalizeDifficultyData(null), aborted: true });
    }, timeout);

    pendingDifficultyRequests.set(requestId, { resolve, timeoutId });
  });

  game.socket?.emit?.(SOCKET_NAMESPACE, {
    type: CONSUME_DIFFICULTY_REQUEST,
    requestId,
    userId: game.user?.id ?? null,
    sceneId: sceneId ?? null
  });

  return response;
}
