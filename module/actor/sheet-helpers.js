export async function onEditImage(event, target) {
  const field = target.dataset.field || "img";
  const current = foundry.utils.getProperty(this.document, field);

  const picker = new FilePicker({
    type: "image",
    current,
    callback: (path) => this.document.update({ [field]: path })
  });

  picker.render(true);
}

export async function onUpdateResourceValue(event, target) {
  event.preventDefault();

  const resource = target.dataset.resource;
  const clickedValue = Number(target.dataset.resourceValue ?? NaN);
  if (!resource || !Number.isFinite(clickedValue)) return;

  const property = `system.${resource}.value`;
  const currentValue = Number(foundry.utils.getProperty(this.document, property) ?? 0);

  let newValue = clickedValue;
  if (currentValue === clickedValue) newValue = clickedValue - 1;

  await this.document.update({ [property]: newValue });
}

export function prepareResourceBarSegments({
  min = 0,
  value = 0,
  max = 0,
  globalMax = 0
} = {}) {
  const normalizedMin = Number(min ?? 0);
  const normalizedValue = Number(value ?? 0);
  const normalizedMax = Number(max ?? 0);
  const normalizedGlobalMax = Math.max(Math.floor(Number(globalMax ?? 0)), 1);

  const segments = [];
  for (let i = normalizedGlobalMax; i >= 1; i--) {
    let state;
    if (i <= normalizedMin) state = "strain";
    else if (i <= normalizedValue) state = "filled";
    else if (i <= normalizedMax) state = "empty";
    else state = "placeholder";

    const clickable = state === "filled" || state === "empty";
    segments.push({ index: i, state, clickable });
  }

  return {
    min: normalizedMin,
    value: normalizedValue,
    max: normalizedMax,
    segments
  };
}

export function prepareResourceBars({
  resources = {},
  fallbackMax = 5
} = {}) {
  const normalizedResources = resources ?? {};
  const normalizedFallbackMax = Math.max(Math.floor(Number(fallbackMax ?? 0)), 1);

  const segmentBounds = Object.values(normalizedResources)
    .map(resource => Math.max(Math.floor(Number(resource?.max ?? 0)), 0));
  const maxSegments = Math.max(normalizedFallbackMax, ...segmentBounds);

  for (const resource of Object.values(normalizedResources)) {
    if (!resource) continue;

    const { segments, min, value, max } = prepareResourceBarSegments({
      min: resource.min,
      value: resource.value,
      max: resource.max,
      globalMax: maxSegments
    });

    resource._segments = segments;
    resource.min = min;
    resource.value = value;
    resource.max = max;
  }

  return {
    maxSegments,
    resources: normalizedResources
  };
}
