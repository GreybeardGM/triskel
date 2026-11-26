import { onEditImage } from "../actor/sheet-helpers.js";

const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

export class CompanionSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["triskel", "sheet", "item", "companion"],
    form: {
      submitOnChange: true
    },
    actions: {
      editImage: onEditImage
    },
    position: {
      height: "auto",
      width: 440
    }
  };

  static PARTS = {
    details: {
      template: "systems/triskel/templates/item/companion-details.hbs"
    }
  };
}
