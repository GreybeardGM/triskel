import { TriskelActorDataModel } from "./triskel-actor-data.js";

const { fields } = foundry.data;

function createReserveSchema() {
  return new fields.SchemaField({
    min: new fields.NumberField({ initial: 0 }),
    value: new fields.NumberField({ initial: 0 }),
    max: new fields.NumberField({ initial: 0 }),
    strain: new fields.SchemaField({
      s1: new fields.BooleanField({ initial: false }),
      s2: new fields.BooleanField({ initial: false }),
      s3: new fields.BooleanField({ initial: false }),
      s4: new fields.BooleanField({ initial: false }),
      s5: new fields.BooleanField({ initial: false })
    })
  });
}

export class PlayerCharacterDataModel extends TriskelActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      reserves: new fields.SchemaField({
        power: createReserveSchema(),
        grace: createReserveSchema(),
        will: createReserveSchema()
      })
    };
  }
}
