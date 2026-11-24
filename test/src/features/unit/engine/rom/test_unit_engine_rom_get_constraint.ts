import { DEFAULT_HUMANOID_ROM, getConstraint } from "@automovie/engine";
import type { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** A constraint unlike any default. */
const OVERRIDE: IAutoMovieJointConstraint = {
  flexion: { min: 0, max: 1 },
  abduction: null,
  twist: null,
};

/**
 * `getConstraint` answers the override when given, else the default humanoid
 * table entry, else null.
 *
 * Scenarios:
 *
 * 1. An override wins over the table.
 * 2. Without one, the table entry for the bone is answered.
 * 3. A bone with no table entry gives null.
 */
export function test_unit_engine_rom_get_constraint(): void {
  TestValidator.predicate(
    "the override",
    getConstraint("leftUpperArm", OVERRIDE) === OVERRIDE,
  );
  TestValidator.predicate(
    "the table entry",
    getConstraint("leftUpperArm", null) === DEFAULT_HUMANOID_ROM.leftUpperArm,
  );
  TestValidator.predicate(
    "no entry",
    DEFAULT_HUMANOID_ROM.hips !== undefined ||
      getConstraint("hips", null) === null,
  );
}
