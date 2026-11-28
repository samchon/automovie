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
 * 4. Oversized or fractional samples and nonfinite draw identities refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names deterministic sampling identity, uniqueness and bounded populations.
 * @evidence contracts/development/testing.md#behavioral-verification Samples four of twenty twice and takes a full-population sample. It submits invalid sample sizes and nonfinite seed, domain and trial inputs.
 * @evidence contracts/development/testing.md#independent-expectations The sample population supplies exact allowed indices. Distinctness gives four unique slots and a full-size sample must be a permutation.
 */
export function test_recovery_internal_sample_camera_indices(): void {
  const drawn: number[] = AutoMovieRecoveryCameraGeometry.sampleCameraIndices(
    20,
    4,
    7,
    1,
    3,
  );
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
  for (const [population, size, seed, domain, trial] of [
    [10, 2.5, 4, 5, 6],
    [10, 2, NaN, 5, 6],
    [10, 2, 4, Infinity, 6],
    [10, 2, 4, 5, NaN],
  ])
    TestValidator.error(
      "sample cardinalities and identities must be integral",
      (): number[] =>
        AutoMovieRecoveryCameraGeometry.sampleCameraIndices(
          population!,
          size!,
          seed!,
          domain!,
          trial!,
        ),
    );
}
