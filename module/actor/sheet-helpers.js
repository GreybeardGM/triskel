import {
  TRISKEL_RESERVES_BY_ID,
  TRISKEL_RESISTANCES,
  TRISKEL_SKILL_CATEGORIES,
  TRISKEL_SKILL_CATEGORIES_BY_ID,
  TRISKEL_SKILLS
} from "../codex/triskel-codex.js";

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

const toFiniteNumbers = (collection, extractor) =>
  collection
    .map(item => Number(extractor(item)))
    .filter(Number.isFinite);

const deriveMaxSegments = (values, fallback = 5) =>
  values.length ? Math.max(...values) : fallback;

const createSegments = (maxSegments, stateResolver) =>
  Array.from({ length: maxSegments }, (_, index) => {
    const value = index + 1;
    return {
      index: value,
      value,
      state: stateResolver(value)
    };
  });

export async function onUpdateResourceValue(event, target) {
  event.preventDefault();

  const resource = target.dataset.resource;
  const clickedValue = Number(target.dataset.resourceValue ?? NaN);
  if (!resource || !Number.isFinite(clickedValue)) return;

  const resourceField = target.dataset.resourceField ?? "value";
  const property = `system.${resource}.${resourceField}`;
  const currentValue = Number(foundry.utils.getProperty(this.document, property) ?? 0);

  let newValue = clickedValue;
  if (currentValue === clickedValue) newValue = clickedValue - 1;

  await this.document.update({ [property]: newValue });
}

export function prepareBars(bars = {}, codexReference = TRISKEL_RESERVES_BY_ID) {
  if (!bars) return {};

  const reserveMax = toFiniteNumbers(Object.values(bars), reserve => reserve?.max);

  const MaxSegments = deriveMaxSegments(reserveMax);

  return Object.entries(bars ?? {}).reduce((collection, [id, resource]) => {
    if (!resource) return collection;

    const min = Number(resource.min ?? 0);
    const value = Number(resource.value ?? 0);
    const ownMax = Number.isFinite(Number(resource.max))
      ? Number(resource.max)
      : MaxSegments;

    const _segments = createSegments(MaxSegments, (index) => {
      if (index <= min) return "strain";
      if (index <= value) return "filled";
      if (index <= ownMax) return "empty";
      return "placeholder";
    });

    const codexEntry = codexReference[id] ?? {};

    collection[id] = {
      ...resource,
      id,
      label: localize(codexEntry.label ?? resource.label),
      description: localize(codexEntry.description ?? resource.description),
      _segments
    };

    return collection;
  }, {});
}

export function prepareSkillsDisplay(skills = {}, resistances = {}) {
  const normalizedSkills = skills ?? {};
  const normalizedResistances = resistances ?? {};

  const byCategory = TRISKEL_SKILLS.reduce((collection, skill) => {
    const rawSkill = normalizedSkills[skill.id] ?? {};
    const category = TRISKEL_SKILL_CATEGORIES_BY_ID[skill.category] ?? {};

    const rawValue = rawSkill.value;
    const parsedValue = Number(rawValue);
    const value = Number.isFinite(parsedValue) ? parsedValue : 0;

    const parsedMod = Number(rawSkill.mod);
    const mod = Number.isFinite(parsedMod) ? parsedMod : 0;

    const parsedTotal = Number(rawSkill.total);
    const total = Number.isFinite(parsedTotal) ? parsedTotal : value + mod;

    const entry = {
      ...skill,
      value,
      label: localize(skill.label ?? skill.id),
      description: localize(skill.description ?? ""),
      categoryLabel: localize(category.label ?? skill.category ?? ""),
      phase: category.phase,
      phaseLabel: localize(category.phaseLabel ?? category.phase ?? ""),
      mod,
      total
    };
    const categoryId = category.id ?? skill.category ?? "";

    const categoryCollection = collection[categoryId] ?? { category, skills: [] };
    categoryCollection.skills.push(entry);
    collection[categoryId] = categoryCollection;

    return collection;
  }, {});

  Object.values(byCategory).forEach(({ skills: skillsInCategory }) =>
    skillsInCategory.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
  );

  const skillCategories = TRISKEL_SKILL_CATEGORIES.map(category => {
    const skillsInCategory = byCategory[category.id]?.skills ?? [];

    return {
      id: category.id.toLowerCase(),
      title: localize(category.label ?? category.id),
      phase: category.phase,
      phaseLabel: localize(category.phaseLabel ?? category.phase ?? ""),
      skills: skillsInCategory
    };
  }).filter(category => category.skills.length);

  const resistancesList = TRISKEL_RESISTANCES.map(resistance => {
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

  return { resistances: resistancesList, skillCategories };
}

