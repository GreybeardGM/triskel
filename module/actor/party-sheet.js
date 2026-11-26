import { getItemFromTarget } from "./sheet-helpers.js";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { TextEditor } = foundry.applications.ux;

async function resolveCharacter(uuid) {
  const actor = await foundry.utils.fromUuid(uuid).catch(() => null);
  return actor?.documentName === "Actor" && actor.type === "character" && actor.visible ? actor : null;
}

export class PartySheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["triskel", "sheet", "actor", "party"],
    actions: {
      removePartyMember: this.#onRemoveMember,
      openCompanion: this.#onOpenCompanion
    },
    window: {
      resizable: true,
      contentClasses: ["party-sheet"]
    },
    position: {
      height: 480,
      width: 540
    }
  };

  static PARTS = {
    roster: {
      template: "systems/triskel/templates/actor/party-roster.hbs"
    },
    companions: {
      template: "systems/triskel/templates/actor/party-companions.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.consumption = this.document.system.consumption;
    context.members = await Promise.all(this.document.partyMemberEntries.map(async ([key, member]) => {
      const character = await resolveCharacter(member.uuid);
      return {
        key,
        active: member.active !== false,
        portrait: character?.img,
        name: character ? character.name : game.i18n.localize("TRISKEL.Actor.Party.Unavailable"),
        className: character?.system.class?.label
      };
    }));
    context.companions = this.document.partyCompanions.map(item => ({
      id: item.id,
      name: item.name,
      portrait: item.img,
      active: item.system.active,
      role: item.system.role,
      complication: item.system.complication,
      consumption: item.system.consumption
    }));
    return context;
  }

  _attachPartListeners(partId, htmlElement, options) {
    super._attachPartListeners(partId, htmlElement, options);
    if (!this.isEditable || !["roster", "companions"].includes(partId)) return;

    htmlElement.addEventListener("dragover", event => {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    });
    htmlElement.addEventListener("drop", event => this._onDrop(event));
    const onChange = partId === "roster" ? this.#onChangeMemberActive : this.#onChangeCompanionActive;
    for (const checkbox of htmlElement.querySelectorAll('input[type="checkbox"]')) {
      checkbox.addEventListener("change", event => onChange.call(this, event));
    }
  }

  async _onDrop(event) {
    const section = event.target.closest(".party-roster, .party-companions");
    if (!this.isEditable || !section) return;
    event.preventDefault();
    event.stopPropagation();

    const data = TextEditor.getDragEventData(event);
    if (section.classList.contains("party-companions")) {
      await this.#onDropCompanion(data);
      return;
    }

    const character = data?.type === "Actor" && typeof data.uuid === "string"
      ? await resolveCharacter(data.uuid)
      : null;
    if (!character) {
      ui.notifications.warn(game.i18n.localize("TRISKEL.Actor.Party.InvalidDrop"));
      return;
    }

    // Keep UUIDs as values and escape dots in the keys used by Foundry update paths.
    const key = encodeURIComponent(character.uuid).replaceAll(".", "%2E");
    if (this.document.system.members[key]?.uuid) return;
    await this.#saveRosterChange(() => this.document.update({
      [`system.members.${key}`]: { uuid: character.uuid, active: true }
    }));
  }

  async #onDropCompanion(data) {
    const item = data?.type === "Item" && typeof data.uuid === "string"
      ? await foundry.utils.fromUuid(data.uuid).catch(() => null)
      : null;
    if (item?.documentName !== "Item" || item.type !== "companion" || !item.visible) {
      ui.notifications.warn(game.i18n.localize("TRISKEL.Actor.Party.InvalidCompanionDrop"));
      return;
    }
    if (item.parent === this.document) return;

    await this.#saveRosterChange(() => this.document.createEmbeddedDocuments("Item", [item.toObject()]));
  }

  async #onChangeMemberActive(event) {
    event.stopPropagation();
    if (!this.isEditable) return;

    const checkbox = event.currentTarget;
    const key = checkbox.closest("[data-member-key]").dataset.memberKey;
    if (!this.document.system.members[key]?.uuid) return;

    checkbox.disabled = true;
    await this.#saveRosterChange(() => this.document.update({ [`system.members.${key}.active`]: checkbox.checked }));
    checkbox.checked = this.document.system.members[key]?.active !== false;
    checkbox.disabled = false;
  }

  async #onChangeCompanionActive(event) {
    event.stopPropagation();
    if (!this.isEditable) return;

    const checkbox = event.currentTarget;
    const companion = getItemFromTarget(this, checkbox);
    if (companion?.type !== "companion") return;

    checkbox.disabled = true;
    await this.#saveRosterChange(() => companion.update({ "system.active": checkbox.checked }));
    checkbox.checked = companion.system.active;
    checkbox.disabled = false;
  }

  static async #onOpenCompanion(event, target) {
    const companion = getItemFromTarget(this, target);
    if (companion?.type === "companion") await companion.sheet?.render(true);
  }

  static async #onRemoveMember(event, target) {
    if (!this.isEditable) return;
    const key = target.closest("[data-member-key]").dataset.memberKey;
    if (!this.document.system.members[key]?.uuid) return;
    await this.#saveRosterChange(() => this.document.update({ [`system.members.-=${key}`]: null }));
  }

  async #saveRosterChange(write) {
    try {
      await write();
    } catch (error) {
      console.error("Triskel | Failed to update the party roster.", error);
      ui.notifications.error(game.i18n.localize("TRISKEL.Actor.Party.UpdateFailed"));
    }
  }
}
