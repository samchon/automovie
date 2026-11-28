import {
  AutoMovieArchetypeQuadrupedEquipment,
  AutoMovieArchetypeQuadrupedLead,
} from "@automovie/archetypes";
import assert from "node:assert/strict";

import { AnimalEquipmentFixture } from "../../internal/AnimalEquipmentFixture";

/**
 * Finite equipment dimensions with overflowing geometry leave the builder intact.
 *
 * Scenarios:
 * 1. The opening raises the hook on the ox's positive neck slope. That rise
 *    exceeds the `2^970` round-to-nearest overflow margin above the largest
 *    finite depth (IEEE Std 754-2019 §§4.3.1, 7.4).
 * 2. A finite lead radius of `2^1023` requires a `2^1024` grip diameter, above
 *    the largest binary64 value (IEEE Std 754-2019 §§3.6, 7.4).
 * 3. Each refusal retains its authored parameter and leaves the genuine
 *    builder's parts and contacts identical to the original build.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines equipment and lead overflow inputs, reported axes and builder state before and after refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual tack and lead layout with finite but unrepresentable resulting geometry. The test saves the same builder's complete model before each call and compares the model after structured refusal.
 * @evidence contracts/development/testing.md#independent-expectations The fixture's positive neck slope and opening exceed the available binary64 height. A grip diameter twice `2^1023` is `2^1024`, above the binary64 limit. The captured pre-call model supplies the equality expectation.
 */
export function test_archetype_quadruped_equipment_overflow(): void {
  const { builder, rig }: AnimalEquipmentFixture.IFixture =
    AnimalEquipmentFixture.create();
  const params: AutoMovieArchetypeQuadrupedEquipment.IParams = {
    yoke: {
      width: 0.6,
      radius: 0.02,
      neckAt: 0.12,
      clearance: 0.005,
      hook: { radius: 0.008, opening: 2 ** 1020, depth: Number.MAX_VALUE },
    },
  };
  const before: string = JSON.stringify(builder.build(300));

  assert.throws(
    () =>
      AutoMovieArchetypeQuadrupedEquipment.lay(
        builder,
        rig,
        params,
        "equipment-fixture",
      ),
    {
      name: "AutoMovieArchetypeRefusal",
      kind: "parameter",
      archetype: "equipment-fixture",
      axis: "yoke.hook.depth",
      value: Number.MAX_VALUE,
    },
  );
  assert.equal(JSON.stringify(builder.build(300)), before);

  const lead: AutoMovieArchetypeQuadrupedLead.IParams = {
    width: 0.1,
    thickness: 0.01,
    leadLength: 0.6,
    leadRadius: 2 ** 1023,
  };
  assert.throws(
    () =>
      AutoMovieArchetypeQuadrupedLead.lay(
        builder,
        rig,
        "lead",
        lead,
        "equipment-fixture",
      ),
    {
      name: "AutoMovieArchetypeRefusal",
      kind: "parameter",
      archetype: "equipment-fixture",
      axis: "collar.leadRadius",
      value: lead.leadRadius,
    },
  );
  assert.equal(JSON.stringify(builder.build(300)), before);
}
