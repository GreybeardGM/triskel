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

export function prepareBars(bars, MaxSegments, codexReference = {}) {
  if (!bars) return {};

  const globalMax = Number.isFinite(Number(MaxSegments)) ? Number(MaxSegments) : 5;

  return Object.entries(bars).reduce((collection, [id, resource]) => {
    if (!resource) return collection;

    const codexEntry = codexReference[id] ?? {};

    const min = Number(resource.min ?? 0);
    const value = Number(resource.value ?? 0);
    const ownMax = Number.isFinite(Number(resource.max)) ? Number(resource.max) : globalMax;

    const _segments = [];
    for (let index = 1; index <= globalMax; index += 1) {
      let state = "placeholder";
      if (index <= min) state = "strain";
      else if (index <= value) state = "filled";
      else if (index <= ownMax) state = "empty";

      _segments.push({
        index,
        value: index,
        state,
        clickable: state !== "placeholder"
      });
    }

    collection[id] = {
      ...resource,
      id,
      label: codexEntry.label ?? resource.label,
      description: codexEntry.description ?? resource.description,
      _segments
    };

    return collection;
  }, {});
}

import { TRISKEL_RESISTANCES, TRISKEL_SKILLS } from "../triskel-codex.js";

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
