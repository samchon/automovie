import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `isRecoveryMapIdentityGauge` holds for the exact identity first pose, the
 * gauge a bundle adjustment fixes: rotation I and zero translation.
 *
 * Scenarios:
 *
 * 1. Rotation I₃ and translation 0 hold.
 * 2. One diagonal entry 0.5, or translation (0, 0, 1), does not.
 */
export function test_recovery_internal_is_map_identity_gauge(): void {
  const identity: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  TestValidator.predicate(
    "the identity gauge",
    AutoMovieRecoveryCameraMap.isMapIdentityGauge({ rotation: identity, translation: [0, 0, 0] }),
  );
  TestValidator.predicate(
    "a scaled rotation",
    !AutoMovieRecoveryCameraMap.isMapIdentityGauge({
      rotation: [1, 0, 0, 0, 0.5, 0, 0, 0, 1],
      translation: [0, 0, 0],
    }),
  );
  TestValidator.predicate(
    "a translated pose",
    !AutoMovieRecoveryCameraMap.isMapIdentityGauge({ rotation: identity, translation: [0, 0, 1] }),
  );
}
