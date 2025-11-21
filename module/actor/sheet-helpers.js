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

import { TRISKEL_RESISTANCES, TRISKEL_SKILLS } from "../triskel-codex.js";

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

const SKILL_COLUMN_LAYOUT = [
  { id: "combat", categories: ["Offense", "Defense"] },
  { id: "physical", categories: ["Physical", "Professional"] },
  { id: "social", categories: ["Social", "Intellectual"] },
  { id: "magic", categories: ["Magic"] }
];

export function prepareSkillsDisplay(skills = {}, resistances = {}) {
  const normalizedSkills = skills ?? {};
  const normalizedResistances = resistances ?? {};

  const byCategory = Object.values(TRISKEL_SKILLS).reduce((collection, skill) => {
    const rawValue = normalizedSkills[skill.id]?.value;
    const parsedValue = Number(rawValue);
    const value = Number.isFinite(parsedValue) ? parsedValue : 0;

    const entry = { ...skill, value };
    const category = skill.category ?? "";

    if (!collection[category]) collection[category] = [];
    collection[category].push(entry);

    return collection;
  }, {});

  Object.values(byCategory).forEach(skillsInCategory =>
    skillsInCategory.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
  );

  const skillColumns = SKILL_COLUMN_LAYOUT.map(column => ({
    id: column.id,
    categories: column.categories
      .map(category => ({
        id: category.toLowerCase(),
        title: category,
        skills: byCategory[category] ?? []
      }))
      .filter(category => category.skills.length)
  }));

  const resistancesList = Object.values(TRISKEL_RESISTANCES).map(resistance => {
    const rawValue = normalizedResistances[resistance.id]?.value;
    const parsedValue = Number(rawValue);
    const value = Number.isFinite(parsedValue) ? parsedValue : 0;

    return { ...resistance, value };
  });

  return { resistances: resistancesList, skillColumns };
}
