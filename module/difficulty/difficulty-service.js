const FLAG_SCOPE = "triskel";
const FLAG_KEY = "difficulty";

function getScene(sceneId) {
  if (sceneId) return game.scenes?.get?.(sceneId) ?? null;
  return getCurrentScene();
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

export function requestDifficultyForRoll({ sceneId } = {}) {
  const scene = getScene(sceneId);
  const difficultyData = normalizeDifficultyData(scene?.getFlag?.(FLAG_SCOPE, FLAG_KEY) ?? null);

  if (Number.isFinite(difficultyData.value)) {
    try {
      Hooks.callAll("triskelDifficultyUsed", {
        sceneId: scene?.id ?? sceneId ?? null,
        difficultyValue: difficultyData.value,
        persist: difficultyData.persist,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Triskel | Failed to request difficulty for roll.", error);
    }
  }

  return difficultyData;
}
