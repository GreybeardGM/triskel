import {
  onEditImage,
  onUpdateResourceValue,
  prepareAssetContext,
  prepareActorBarsContext,
  prepareSkillsDisplay
} from "./sheet-helpers.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class NpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;

    context.actor ??= actor;
    context.system ??= actor?.system ?? {};
    const { skillCategories } = prepareSkillsDisplay(this.document?.system?.skills ?? {});
    context.skillCategories = skillCategories;
    context.assets = prepareAssetContext(this.document?.assets);
    const preparedBundle = this.document?.preparedActions ?? {};
    context.actions = preparedBundle.actions ?? {};
    const { npcStats } = prepareActorBarsContext(this.document);
    if (npcStats) context.npcStats = npcStats;
    if (context.system && npcStats) context.system.npcStats = npcStats;

    return context;
  }

  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "actor", "npc"],
    form: {
      submitOnChange: true
    },
    actions: {
      editImage: onEditImage,
      updateResourceValue: onUpdateResourceValue
    },
    actor: {
      type: "npc"
    },
    window: {
      resizable: true,
      contentClasses: ["npc-sheet"]
    },
    position: {
      height: "auto",
      width: 720
    }
  };

  static PARTS = {
    info: {
      id: "info",
      template: "systems/triskel/templates/actor/npc-info.hbs",
      sort: 5
    },
    resources: {
      id: "ressourcen",
      template: "systems/triskel/templates/actor/npc-resources.hbs",
      sort: 20
    },
    skills: {
      id: "skills",
      template: "systems/triskel/templates/actor/skills.hbs",
      sort: 200
    },
    notes: {
      id: "notes",
      template: "systems/triskel/templates/actor/notes.hbs",
      sort: 300
    }
  };

}
