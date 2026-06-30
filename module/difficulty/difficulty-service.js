const FLAG_SCOPE = "triskel";
const FLAG_KEY = "difficulty";
const SOCKET_NAMESPACE = "system.triskel";
const CONSUME_DIFFICULTY_REQUEST = "consumeDifficultyRequest";
const CONSUME_DIFFICULTY_RESPONSE = "consumeDifficultyResponse";
const DIFFICULTY_REQUEST_TIMEOUT_MS = 5000;

const pendingDifficultyRequests = new Map();
const sceneDifficultyLocks = new Map();
let difficultyServiceRegistered = false;
let usersCollectionWarningShown = false;

function getScene(sceneId) {
  if (sceneId) return game.scenes?.get?.(sceneId) ?? null;
  return getCurrentScene();
}

function getUser(userId) {
  if (!userId) return null;
  return game.users?.get?.(userId) ?? null;
}

function getActiveGms() {
  const users = game.users?.contents;
  if (!Array.isArray(users)) {
    if (!usersCollectionWarningShown) {
      ui.notifications?.warn("Unable to inspect active GMs; difficulty rolls are disabled.");
      usersCollectionWarningShown = true;
    }
    return [];
  }

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
  ui.notifications?.warn("Unable to create a secure difficulty request id. Roll aborted.");
  return null;
}

function resolvePendingDifficultyRequest(message) {
  const pending = pendingDifficultyRequests.get(message?.requestId);
  if (!pending) return;
  if (message.userId !== game.user?.id) return;

  clearTimeout(pending.timeoutId);
  pendingDifficultyRequests.delete(message.requestId);

  if (message.ok === false) {
    ui.notifications?.warn("The GM could not process the scene difficulty. Roll aborted.");
    pending.resolve({ ...normalizeDifficultyData(null), aborted: true });
    return;
  }

  pending.resolve({
    ...normalizeDifficultyData({ value: message.value, persist: message.persist }),
    consumed: message.consumed === true,
    retained: message.retained === true
  });
}

async function handleConsumeDifficultyRequest(message) {
  if (!game.user?.isGM || !isPrimaryGm()) return;

  const requestingUserId = message?.userId;
  if (!message?.requestId || !getUser(requestingUserId)) return;

  let difficulty = createDifficultyRollResult();
  let ok = true;
  let responseError = null;
  try {
    difficulty = await consumeSceneDifficulty({ sceneId: message.sceneId });
  } catch (consumeError) {
    console.error("Triskel | Failed to consume difficulty for socket request.", consumeError);
    ok = false;
    responseError = "consume-failed";
  }

  game.socket?.emit?.(SOCKET_NAMESPACE, {
    type: CONSUME_DIFFICULTY_RESPONSE,
    requestId: message.requestId,
    userId: requestingUserId,
    sceneId: message.sceneId ?? null,
    ok,
    error: responseError,
    value: Number.isFinite(difficulty.value) ? difficulty.value : null,
    persist: difficulty.persist === true,
    consumed: difficulty.consumed === true,
    retained: difficulty.retained === true
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

function createDifficultyRollResult(data = null, { consumed = false, retained = false } = {}) {
  return {
    ...normalizeDifficultyData(data),
    consumed: consumed === true,
    retained: retained === true
  };
}

async function withSceneDifficultyLock(sceneId, operation) {
  const lockKey = sceneId ?? getCurrentScene()?.id;
  if (!lockKey) return operation();

  const previousLock = sceneDifficultyLocks.get(lockKey) ?? Promise.resolve();
  let releaseLock;
  const currentLock = new Promise(resolve => {
    releaseLock = resolve;
  });
  const queuedLock = previousLock.then(() => currentLock, () => currentLock);

  sceneDifficultyLocks.set(lockKey, queuedLock);

  await previousLock.catch(() => undefined);
  try {
    return await operation();
  } finally {
    releaseLock();
    if (sceneDifficultyLocks.get(lockKey) === queuedLock) {
      sceneDifficultyLocks.delete(lockKey);
    }
  }
}

export function getCurrentScene() {
  return game.scenes?.current ?? game.canvas?.scene ?? null;
}

export async function setSceneDifficulty(value, { persist = false } = {}) {
  const scene = getCurrentScene();
  if (!scene) return null;

  const difficultyData = Number.isFinite(value)
    ? normalizeDifficultyData({ value, persist })
    : normalizeDifficultyData(null);
  await scene.setFlag(FLAG_SCOPE, FLAG_KEY, difficultyData);
  return difficultyData;
}

async function consumeDifficultyForRoll({ sceneId } = {}) {
  if (!game.user?.isGM) return null;

  const scene = getScene(sceneId);
  if (!scene) return createDifficultyRollResult();

  const currentDifficulty = normalizeDifficultyData(scene.getFlag(FLAG_SCOPE, FLAG_KEY) ?? null);

  if (!Number.isFinite(currentDifficulty.value)) {
    return createDifficultyRollResult();
  }

  if (currentDifficulty.persist === true) {
    return createDifficultyRollResult(currentDifficulty, { retained: true });
  }

  await scene.setFlag(FLAG_SCOPE, FLAG_KEY, { value: null, persist: false });
  return createDifficultyRollResult(currentDifficulty, { consumed: true });
}

export async function consumeSceneDifficulty({ sceneId } = {}) {
  return withSceneDifficultyLock(sceneId, () => consumeDifficultyForRoll({ sceneId }));
}

export function registerDifficultyService() {
  if (difficultyServiceRegistered) return;
  difficultyServiceRegistered = true;
  game.socket?.on?.(SOCKET_NAMESPACE, handleSocketMessage);
}

export async function requestDifficultyForRoll({ sceneId, timeout = DIFFICULTY_REQUEST_TIMEOUT_MS } = {}) {
  if (game.user?.isGM) {
    return consumeSceneDifficulty({ sceneId });
  }

  if (!getActiveGms().length) {
    ui.notifications?.warn("No active GM available to consume difficulty.");
    return { ...normalizeDifficultyData(null), aborted: true };
  }

  const requestId = createRequestId();
  if (!requestId) return { ...normalizeDifficultyData(null), aborted: true };

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
