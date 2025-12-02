import { TRISKEL_ACTIONS } from "../codex/action-codex.js";
import { TRISKEL_RESERVES, TRISKEL_RESISTANCES, TRISKEL_SKILLS } from "../codex/triskel-codex.js";

const localize = (value) => {
  if (!value) return "";

  try {
    return game?.i18n?.localize?.(value) ?? value;
  } catch (error) {
    console.warn("[Triskel] Failed to localize value", { value, error });
    return value;
  }
};

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

  const barsWithSorting = Object.entries(bars ?? {}).map(([id, resource]) => ({
    id,
    resource,
    codexEntry: codexReference[id] ?? {},
    sortOrder: codexReference[id]?.sortOrder ?? Number.MAX_SAFE_INTEGER
  }));

  barsWithSorting.sort((a, b) => {
    const orderDifference = a.sortOrder - b.sortOrder;
    if (orderDifference !== 0) return orderDifference;

    const labelA = a.codexEntry.label ?? a.resource?.label ?? "";
    const labelB = b.codexEntry.label ?? b.resource?.label ?? "";
    return localize(labelA).localeCompare(localize(labelB), undefined, { sensitivity: "base" });
  });

  return barsWithSorting.reduce((collection, entry) => {
    if (!entry.resource) return collection;

    const min = Number(entry.resource.min ?? 0);
    const value = Number(entry.resource.value ?? 0);
    const ownMax = Number.isFinite(Number(entry.resource.max)) ? Number(entry.resource.max) : globalMax;

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

    collection[entry.id] = {
      ...entry.resource,
      id: entry.id,
      label: localize(entry.codexEntry.label ?? entry.resource.label),
      description: localize(entry.codexEntry.description ?? entry.resource.description),
      _segments
    };

    return collection;
  }, {});
}

const SKILL_CATEGORY_LABELS = {
  offense: "TRISKEL.SkillCategories.Offense",
  defense: "TRISKEL.SkillCategories.Defense",
  physical: "TRISKEL.SkillCategories.Physical",
  professional: "TRISKEL.SkillCategories.Professional",
  social: "TRISKEL.SkillCategories.Social",
  intellectual: "TRISKEL.SkillCategories.Intellectual",
  magic: "TRISKEL.SkillCategories.Magic"
};

const SKILL_COLUMN_LAYOUT = [
  { id: "combat", categories: ["offense", "defense"] },
  { id: "physical", categories: ["physical", "professional"] },
  { id: "social", categories: ["social", "intellectual"] },
  { id: "magic", categories: ["magic"] }
];

export function prepareSkillsDisplay(skills = {}, resistances = {}) {
  const normalizedSkills = skills ?? {};
  const normalizedResistances = resistances ?? {};

  const byCategory = Object.values(TRISKEL_SKILLS).reduce((collection, skill) => {
    const rawValue = normalizedSkills[skill.id]?.value;
    const parsedValue = Number(rawValue);
    const value = Number.isFinite(parsedValue) ? parsedValue : 0;

    const entry = {
      ...skill,
      value,
      label: localize(skill.label ?? skill.id),
      description: localize(skill.description ?? ""),
      categoryLabel: localize(skill.categoryLabel ?? skill.category ?? ""),
      phaseLabel: localize(skill.phaseLabel ?? skill.phase ?? "")
    };
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
        title: localize(SKILL_CATEGORY_LABELS[category] ?? category),
        skills: byCategory[category] ?? []
      }))
      .filter(category => category.skills.length)
  }));

  const resistancesList = Object.values(TRISKEL_RESISTANCES).map(resistance => {
    const rawValue = normalizedResistances[resistance.id]?.value;
    const parsedValue = Number(rawValue);
    const value = Number.isFinite(parsedValue) ? parsedValue : 0;

    return {
      ...resistance,
      value,
      label: localize(resistance.label ?? resistance.id),
      description: localize(resistance.description ?? "")
    };
  });

  return { resistances: resistancesList, skillColumns };
}

export function prepareStandardActions(selectedActions = {}, skills = {}, reserves = {}) {
  const selected = selectedActions ?? {};
  const actorSkills = skills ?? {};
  const actorReserves = reserves ?? {};

  return TRISKEL_ACTIONS.map(action => {
    const skillInfo = TRISKEL_SKILLS[action.skill] ?? {};
    const reserveInfo = TRISKEL_RESERVES[action.reserve] ?? {};

    const rawSkillValue = actorSkills[action.skill]?.value;
    const parsedSkillValue = Number(rawSkillValue);
    const skillValue = Number.isFinite(parsedSkillValue) ? parsedSkillValue : 0;

    const reserve = actorReserves[action.reserve] ?? {};
    const reserveValue = Number(reserve.value ?? reserveInfo.value ?? NaN);
    const reserveMax = Number(reserve.max ?? reserveInfo.max ?? NaN);

    return {
      ...action,
      label: localize(action.label ?? skillInfo.label ?? action.key),
      skillLabel: localize(skillInfo.label ?? action.skill),
      reserveLabel: localize(reserveInfo.label ?? action.reserve),
      description: localize(action.description ?? ""),
      selected: Boolean(selected[action.key]),
      skillValue,
      reserveValue: Number.isFinite(reserveValue) ? reserveValue : null,
      reserveMax: Number.isFinite(reserveMax) ? reserveMax : null
    };
  });
}
