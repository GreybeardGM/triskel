import { onEditImage, onUpdateResourceValue, prepareResourceBarSegments, prepareResourceBars, prepareSkillsDisplay } from "./sheet-helpers.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class PlayerCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "actor", "character"],
    form: {
      submitOnChange: true
    },
    actions: {
      editImage: onEditImage,
      quickTriskelRoll: this.#onQuickTriskelRoll,
      updateResourceValue: onUpdateResourceValue
    },
    actor: {
      type: 'character'
    },
    window: {
      resizable: true
    },
    position: {
      height: "auto",
      width: 720
    }
  };

  static PARTS = {
    info: {
      id: "info",
      template: "systems/triskel/templates/actor/player-character-info.hbs"
    },
    roller: {
      id: "roller",
      template: "systems/triskel/templates/actor/player-character-roller.hbs"
    },
    reserves: {
      id: "reserves",
      template: "systems/triskel/templates/actor/reserves.hbs"
    },
    paths: {
      id: "paths",
      template: "systems/triskel/templates/actor/paths.hbs"
    },
    skills: {
      id: "skills",
      template: "systems/triskel/templates/actor/skills.hbs"
    },
    notes: {
      id: "notes",
      template: "systems/triskel/templates/actor/player-character-notes.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
  
    context.actor ??= this.document;
    context.system ??= this.document.system;

    const { resistances, skillColumns } = prepareSkillsDisplay(
      context.system.skills,
      context.system.resistances
    );

    context.resistances = resistances;
    context.skillColumns = skillColumns;

    // Reserves + Balken vorbereiten
    const {
      resources: reserves,
      maxSegments
    } = prepareResourceBars({
      resources: context.system.reserves ?? {},
      fallbackMax: 5
    });

    context.reserves = reserves;

    // Paths vorbereiten
    const PATH_LAYOUT = [
      { id: "virtue", label: "Virtue", side: "left" },
      { id: "vice", label: "Vice", side: "left" },
      { id: "ward", label: "Ward", side: "right" },
      { id: "ruin", label: "Ruin", side: "right" }
    ];

    const preparedPaths = prepareResourceBars({
      resources: PATH_LAYOUT.reduce((paths, path) => {
        const systemPath = context.system.paths?.[path.id] ?? {};

        paths[path.id] = {
          max: systemPath.max ?? 12,
          ...systemPath,
          label: systemPath.label ?? path.label
        };

        return paths;
      }, {}),
      fallbackMax: 12
    }).resources;

    const pathsBySide = PATH_LAYOUT.reduce((columns, { id, side, label }) => {
      const prepared = preparedPaths[id] ?? {};
      const segments = prepared._segments ?? [];

      const column = columns[side] ?? { side, paths: [] };
      column.paths.push({
        ...prepared,
        id,
        label: prepared.label ?? label,
        side,
        _displaySegments: side === "right" ? [...segments].reverse() : segments
      });

      columns[side] = column;
      return columns;
    }, {});

    context.paths = [pathsBySide.left, pathsBySide.right].filter(Boolean);

    // Tension-Bar vorbereiten
    const tension = {
      ...(context.system.tension ?? {})
    };

    if (Object.keys(tension).length) {
      const {
        segments,
        max,
        min,
        value
      } = prepareResourceBarSegments({
        min: 0,
        value: tension.value,
        max: maxSegments,
        globalMax: maxSegments
      });

      tension._segments = segments;
      tension.max = max;
      tension.min = min;
      tension.value = value;
    }

    context.tension = tension;
  
    // Notes vorbereiten (aus der letzten Runde, falls noch nicht drin)
    context.notesHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.document.system.details?.notes ?? "",
      {
        secrets: this.document.isOwner,
        relativeTo: this.document
      }
    );
  
    return context;
  }

  static async #onQuickTriskelRoll(event, target) {
    event.preventDefault();

    const container = target.closest("[data-quick-roll]");
    const modifierInput = container?.querySelector("[data-quick-roll-modifier]");
    const modifierValue = Number(modifierInput?.value ?? 0);

    const modifiers = Number.isFinite(modifierValue) && modifierValue !== 0
      ? [{ label: "Sheet Modifier", value: modifierValue }]
      : [];

    await this.document?.rollTriskelDice({ modifiers });
  }

}
