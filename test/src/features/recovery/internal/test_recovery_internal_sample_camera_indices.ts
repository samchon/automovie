import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `sampleRecoveryCameraIndices` draws a reproducible subset without replacement
 * by a seeded partial Fisher–Yates shuffle (Knuth, TAOCP vol. 2, Algorithm P):
 * distinct indices inside the population, the same for the same seed, domain
 * and trial.
 *
 * Scenarios:
 *
 * 1. Four of 20: four distinct indices in [0, 20).
 * 2. The same identity draws the same subset.
 * 3. A sample of the whole population is a permutation of it.
 * 4. A sample larger than the population refuses.
 */
export function test_recovery_internal_sample_camera_indices(): void {
  const drawn: number[] = AutoMovieRecoveryCameraGeometry.sampleCameraIndices(20, 4, 7, 1, 3);
  TestValidator.predicate(
    "four distinct indices inside the population",
    drawn.length === 4 &&
      new Set(drawn).size === 4 &&
      drawn.every((index: number): boolean => index >= 0 && index < 20),
  );
  TestValidator.equals(
    "reproducible",
    AutoMovieRecoveryCameraGeometry.sampleCameraIndices(20, 4, 7, 1, 3),
    drawn,
  );
  TestValidator.equals(
    "the whole population",
    AutoMovieRecoveryCameraGeometry.sampleCameraIndices(5, 5, 7, 1, 3).sort(
      (left: number, right: number): number => left - right,
    ),
    [0, 1, 2, 3, 4],
  );
  TestValidator.error("an oversized sample", (): number[] =>
    AutoMovieRecoveryCameraGeometry.sampleCameraIndices(3, 4, 7, 1, 3),
  );
}
