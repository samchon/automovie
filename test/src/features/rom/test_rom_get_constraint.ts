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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the effective-constraint lookup with an override, a defaulted elbow and an unconstrained hips bone, catching inverted precedence or a fabricated fallback.
 * @evidence contracts/testing.md#independent-expectations Override precedence and null absence follow the lookup contract; default fallback is judged by borrowed record identity rather than copied table numbers. These cases establish policy, not anatomical validity.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts supplied override, null override with a known entry and null override without an entry; interval and frame admission are owned by the model and rest-frame tests.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns these three portable calls; no skeleton construction, native artifact, process or viewer participates.
 */
export function test_rom_get_constraint(): void {
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
