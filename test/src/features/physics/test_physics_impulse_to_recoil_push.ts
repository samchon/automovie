import { impulseToRecoilPush } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * The impulse→push bridge is the previously-missing consumer between collision
 * response and flinch: the impulse magnitude times the gain becomes the flexion
 * the struck body yields. Gain is a rough runtime-checked scalar.
 *
 * Scenarios:
 *
 * 1. A (3,4,0) impulse (magnitude 5) at gain 2 yields flexion 10.
 * 2. A non-finite gain throws.
 * 3. A negative gain throws.
 *
 * @evidence contracts/testing.md#behavioral-verification Converts an impulse to recoil flexion and rejects invalid gains with diagnostic fragments, catching a missing magnitude/gain factor or non-finite/negative gain admission.
 * @evidence contracts/testing.md#independent-expectations The 3-4-5 Euclidean norm at gain 2 independently gives 10 degrees; finite nonnegative gain and diagnostic concepts define refusal. This fixture does not establish impulse-vector admission, zero gain or full directional pose response.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts a finite positive conversion, NaN gain and negative gain; impact impulse production and joint-bound recoil projection belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit calls the bridge directly with authored vectors and owns its assertions, without hosts or dynamic test registration.
 */
export function test_physics_impulse_to_recoil_push(): void {
  TestValidator.predicate(
    "flexion = |impulse| * gain",
    nclose(
      impulseToRecoilPush({ x: 3, y: 4, z: 0 }, 2).flexion ?? Number.NaN,
      10,
    ),
  );
  TestValidator.predicate(
    "non-finite gain throws",
    throwsError(
      (): ReturnType<typeof impulseToRecoilPush> => impulseToRecoilPush({ x: 1, y: 0, z: 0 }, Number.NaN),
      "gain must be finite",
    ),
  );
  TestValidator.predicate(
    "negative gain throws",
    throwsError(
      (): ReturnType<typeof impulseToRecoilPush> => impulseToRecoilPush({ x: 1, y: 0, z: 0 }, -1),
      "gain must be >= 0",
    ),
  );
}
