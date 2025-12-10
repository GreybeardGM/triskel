import { TRISKEL_PATHS, TRISKEL_RESERVES, TRISKEL_RESISTANCES, TRISKEL_SKILLS } from "../codex/triskel-codex.js";

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

  const property = `system.${resource}.value`;
  const currentValue = Number(foundry.utils.getProperty(this.document, property) ?? 0);

  let newValue = clickedValue;
  if (currentValue === clickedValue) newValue = clickedValue - 1;

  await this.document.update({ [property]: newValue });
}

export function prepareReserveBars(bars = {}, codexReference = TRISKEL_RESERVES) {
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

    collection[id] = {
      ...resource,
      id,
      label: localize(codexReference[id]?.label ?? resource.label),
      description: localize(codexReference[id]?.description ?? resource.description),
      _segments
    };

    return collection;
  }, {});
}

export function preparePathBars(paths = {}) {
  if (!paths) return {};

  const pathValues = toFiniteNumbers(Object.values(paths), path => path?.value);

  const MaxSegments = deriveMaxSegments(pathValues);

  return Object.entries(paths ?? {}).reduce((collection, [id, resource]) => {
    if (!resource) return collection;

    const value = Number(resource.value ?? 0);
    const _segments = createSegments(MaxSegments, index => index <= value ? "filled" : "empty");

    collection[id] = {
      ...resource,
      id,
      label: localize(TRISKEL_PATHS[id]?.label ?? resource.label),
      description: localize(TRISKEL_PATHS[id]?.description ?? resource.description),
      _segments
    };

    return collection;
  }, {});
}

const SKILL_CATEGORY_LABELS = {
  offense: "TRISKEL.Actor.Skill.Category.Offense",
  defense: "TRISKEL.Actor.Skill.Category.Defense",
  physical: "TRISKEL.Actor.Skill.Category.Physical",
  professional: "TRISKEL.Actor.Skill.Category.Professional",
  social: "TRISKEL.Actor.Skill.Category.Social",
  intellectual: "TRISKEL.Actor.Skill.Category.Intellectual",
  magic: "TRISKEL.Actor.Skill.Category.Magic"
};

export function prepareSkillsDisplay(skills = {}, resistances = {}) {
  const normalizedSkills = skills ?? {};
  const normalizedResistances = resistances ?? {};

  const byCategory = Object.values(TRISKEL_SKILLS).reduce((collection, skill) => {
    const rawSkill = normalizedSkills[skill.id] ?? {};

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
      categoryLabel: localize(skill.categoryLabel ?? skill.category ?? ""),
      phaseLabel: localize(skill.phaseLabel ?? skill.phase ?? ""),
      mod,
      total
    };
    const category = skill.category ?? "";

    if (!collection[category]) collection[category] = [];
    collection[category].push(entry);

    return collection;
  }, {});

  Object.values(byCategory).forEach(skillsInCategory =>
    skillsInCategory.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
  );

  const skillCategories = Object.entries(byCategory).map(([category, skillsInCategory]) => ({
    id: category.toLowerCase(),
    title: localize(SKILL_CATEGORY_LABELS[category] ?? category),
    skills: skillsInCategory
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

  return { resistances: resistancesList, skillCategories };
}

