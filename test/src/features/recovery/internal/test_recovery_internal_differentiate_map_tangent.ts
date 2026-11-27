import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `differentiateRecoveryMapTangent` removes from each tangent row its component
 * along the translation, the derivative of normalizing it.
 *
 * Scenarios:
 *
 * 1. Translation (0, 0, 2): (1, 0, 1) loses (0, 0, 1) to (1, 0, 0); (0, 1, 0)
 *    stays.
 * 2. A zero translation has no direction: null.
 * 3. A one-row tangent is refused.
 */
export function test_recovery_internal_differentiate_map_tangent(): void {
  TestValidator.equals(
    "projected rows",
    AutoMovieRecoveryCameraMap.differentiateMapTangent(
      [0, 0, 2],
      [
        [1, 0, 1],
        [0, 1, 0],
      ],
    ),
    [
      [1, 0, 0],
      [0, 1, 0],
    ],
  );
  TestValidator.equals(
    "a zero translation",
    AutoMovieRecoveryCameraMap.differentiateMapTangent(
      [0, 0, 0],
      [
        [1, 0, 0],
        [0, 1, 0],
      ],
    ),
    null,
  );
  TestValidator.error("a one-row tangent", (): unknown =>
    AutoMovieRecoveryCameraMap.differentiateMapTangent([0, 0, 1], [[1, 0, 0]]),
  );
}
