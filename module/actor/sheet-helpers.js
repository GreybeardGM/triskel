import { toFiniteNumber, toFiniteNumbers } from "../util/normalization.js";

const getTriskellIndex = () => CONFIG.triskell?.index ?? {};
const getTriskellCodex = () => CONFIG.triskell?.codex ?? {};

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
  const clickedValue = toFiniteNumber(target.dataset.resourceValue, Number.NaN);
  if (!resource || !Number.isFinite(clickedValue)) return;

  const resourceField = target.dataset.resourceField ?? "value";
  const property = `system.${resource}.${resourceField}`;
  const currentValue = toFiniteNumber(foundry.utils.getProperty(this.document, property));

  let newValue = clickedValue;
  if (currentValue === clickedValue) newValue = clickedValue - 1;

  await this.document.update({ [property]: newValue });
}

export function prepareBars(bars = {}, codexReference = undefined) {
  if (!bars) return {};

  const reference = codexReference ?? getTriskellIndex().reserves ?? {};

  const reserveMax = toFiniteNumbers(Object.values(bars), reserve => reserve?.max);

  const MaxSegments = deriveMaxSegments(reserveMax);

  return Object.entries(bars ?? {}).reduce((collection, [id, resource]) => {
    if (!resource) return collection;

    const min = toFiniteNumber(resource.min);
    const value = toFiniteNumber(resource.value);
    const ownMax = toFiniteNumber(resource.max, MaxSegments);

    const _segments = createSegments(MaxSegments, (index) => {
      if (index <= min) return "strain";
      if (index <= value) return "filled";
      if (index <= ownMax) return "empty";
      return "placeholder";
    });

    const codexEntry = reference[id] ?? {};

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

export function prepareSkillsDisplay(skills = {}, resistances = {}) {
  const normalizedSkills = skills ?? {};
  const normalizedResistances = resistances ?? {};

  const index = getTriskellIndex();
  const codex = getTriskellCodex();

  const byCategory = (codex.skills ?? []).reduce((collection, skill) => {
    const rawSkill = normalizedSkills[skill.id] ?? normalizedResistances[skill.id] ?? {};
    const category = index.skillCategories?.[skill.category] ?? {};

    const value = toFiniteNumber(rawSkill.value);
    const mod = toFiniteNumber(rawSkill.mod);
    const total = toFiniteNumber(rawSkill.total, value + mod);

    const entry = {
      ...skill,
      value,
      label: skill.label ?? skill.id,
      description: skill.description ?? "",
      categoryLabel: category.label ?? skill.category ?? "",
      phase: category.phase,
      phaseLabel: category.phaseLabel ?? category.phase ?? "",
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

  const skillCategories = (codex.skillCategories ?? []).map(category => {
    const skillsInCategory = byCategory[category.id]?.skills ?? [];

    return {
      id: category.id.toLowerCase(),
      title: category.label ?? category.id,
      phase: category.phase,
      phaseLabel: category.phaseLabel ?? category.phase ?? "",
      skills: skillsInCategory
    };
  }).filter(category => category.skills.length);

  return { skillCategories };
}

