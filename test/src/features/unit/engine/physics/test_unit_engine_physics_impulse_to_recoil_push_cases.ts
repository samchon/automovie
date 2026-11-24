import { impulseToRecoilPush } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

/**
 * The impulse→push bridge is the previously-missing consumer between collision
 * response and flinch: the impulse magnitude times the gain becomes the flexion
 * the struck body yields. Gain is a rough runtime-checked scalar.
 *
 * Scenarios:
 *
 * 1. A (3,4,0) impulse (magnitude 5) at gain 2 yields flexion 10.
 * 2. A negative gain throws.
 */
export function test_unit_engine_physics_impulse_to_recoil_push_cases(): void {
  TestValidator.predicate(
    "flexion = |impulse| * gain",
    nclose(
      impulseToRecoilPush({ x: 3, y: 4, z: 0 }, 2).flexion ?? Number.NaN,
      10,
    ),
  );

  TestValidator.predicate(
    "negative gain throws",
    throwsError(
      (): ReturnType<typeof impulseToRecoilPush> =>
        impulseToRecoilPush({ x: 1, y: 0, z: 0 }, -1),
      "gain must be >= 0",
    ),
  );
}
