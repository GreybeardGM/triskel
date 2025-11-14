const { fields } = foundry.data;

export class TriskelActorDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      details: new fields.SchemaField({
        biography: new fields.HTMLField({ initial: "" }),
        notes: new fields.HTMLField({ initial: "" })
      })
    };
  }
}
