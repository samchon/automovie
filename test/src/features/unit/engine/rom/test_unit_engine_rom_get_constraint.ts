import { DEFAULT_HUMANOID_ROM, getConstraint } from "@automovie/engine";
import { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Resolve a bone's effective constraint by override, default entry and null precedence, so rigs can change the fallback policy per bone.
 *
 * Scenarios:
 *
 * 1. A per-bone skeleton override wins outright over the default table.
 * 2. With no override, the default elbow entry is returned by identity.
 * 3. The hips bone has neither an override nor a table entry and resolves to null.
 */
export function test_unit_engine_rom_get_constraint(): void {
  const override: IAutoMovieJointConstraint = {
    flexion: { min: -200, max: 200 },
    abduction: null,
    twist: null,
  };
  TestValidator.predicate(
    "override wins",
    getConstraint("leftLowerArm", override) === override,
  );
  TestValidator.predicate(
    "table fallback",
    getConstraint("leftLowerArm", null) === DEFAULT_HUMANOID_ROM.leftLowerArm,
  );
  TestValidator.equals(
    "unconstrained bone → null",
    getConstraint("hips", null),
    null,
  );
}
