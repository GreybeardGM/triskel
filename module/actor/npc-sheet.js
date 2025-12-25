import { onEditImage, onUpdateResourceValue, prepareActorItemsContext, prepareActorSkillsContext, prepareActorActionsContext, prepareActorBarsContext } from "./sheet-helpers.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class NpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;

    context.actor ??= actor;
    context.system ??= actor?.system ?? {};
    const { skillCategories } = prepareActorSkillsContext(this.document);
    context.skillCategories = skillCategories;
    context.assets = prepareActorItemsContext(this.document);
    context.actions = this.document?.preparedActions ?? prepareActorActionsContext(this.document);
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
      resizable: true
    },
    position: {
      height: "auto",
      width: 720
    }
  };

  static PARTS = {
    core: {
      id: "core",
      template: "systems/triskel/templates/actor/npc-core.hbs"
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

}
