import { AutoMovieEnginePhysics } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `impulseToRecoilPush` turns an impulse into a flexion of its magnitude times
 * the gain.
 *
 * Scenarios:
 *
 * 1. The impulse (3, 4, 0) has magnitude 5, so gain 2 gives flexion 10.
 * 2. A zero gain gives 0 and a negative gain is refused.
 * 3. A negative gain is refused with the message "gain must be >= 0".
 */
export function test_engine_physics_impulse_to_recoil_push(): void {
  TestValidator.equals("push", AutoMovieEnginePhysics.impulseToRecoilPush({ x: 3, y: 4, z: 0 }, 2), {
    flexion: 10,
  });
  TestValidator.equals(
    "no gain",
    AutoMovieEnginePhysics.impulseToRecoilPush({ x: 3, y: 4, z: 0 }, 0),
    { flexion: 0 },
  );
  TestValidator.predicate(
    "negative gain",
    throwsError(() => AutoMovieEnginePhysics.impulseToRecoilPush({ x: 1, y: 0, z: 0 }, -1)),
  );
  TestValidator.predicate(
    "negative gain message",
    throwsError(
      () => AutoMovieEnginePhysics.impulseToRecoilPush({ x: 1, y: 0, z: 0 }, -1),
      ["gain must be >= 0"],
    ),
  );
}
