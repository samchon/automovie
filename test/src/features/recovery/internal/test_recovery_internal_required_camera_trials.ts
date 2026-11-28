import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `requiredRecoveryCameraTrials` is the RANSAC stopping count of Fischler and
 * Bolles 1981, `⌈ln(1 − p) / ln(1 − w)⌉`, with w the chance that a sample of
 * size s drawn without replacement holds only inliers, `Π (I − k) / (N − k)`.
 *
 * Scenarios:
 *
 * 1. N = 10, I = 5, s = 2, p = 0.99: w = 2/9 and ⌈ln 0.01 / ln(7/9)⌉ = 19.
 * 2. Every match an inlier: one trial.
 * 3. Fewer inliers than the sample: no finite count.
 * 4. A confidence of 1 or malformed trial counts refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the independent-trial count and unique-sample inlier chance.
 * @evidence contracts/development/testing.md#behavioral-verification Checks ordinary support, full support, too few inliers, invalid confidence and malformed population counts.
 * @evidence contracts/development/testing.md#independent-expectations Drawing two inliers from five of ten without replacement has probability 2/9. The logarithmic bound requires 19 trials at confidence 0.99.
 */
export function test_recovery_internal_required_camera_trials(): void {
  TestValidator.equals(
    "the worked count",
    AutoMovieRecoveryCameraGeometry.requiredCameraTrials(10, 5, 2, 0.99),
    Math.ceil(Math.log(0.01) / Math.log(7 / 9)),
  );
  TestValidator.equals(
    "all inliers",
    AutoMovieRecoveryCameraGeometry.requiredCameraTrials(8, 8, 3, 0.99),
    1,
  );
  TestValidator.equals(
    "too few inliers",
    AutoMovieRecoveryCameraGeometry.requiredCameraTrials(10, 1, 2, 0.99),
    Infinity,
  );
  TestValidator.error("certainty", (): number =>
    AutoMovieRecoveryCameraGeometry.requiredCameraTrials(10, 5, 2, 1),
  );
  for (const [population, inliers, sample] of [
    [Infinity, 5, 2],
    [10, NaN, 2],
    [10, 5, 1.5],
  ])
    TestValidator.error(
      "trial cardinalities must be safe integers",
      (): number =>
        AutoMovieRecoveryCameraGeometry.requiredCameraTrials(
          population!,
          inliers!,
          sample!,
          0.99,
        ),
    );
}
