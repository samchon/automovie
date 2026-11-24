import { requiredRecoveryCameraTrials } from "@automovie/recovery";
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
 * 4. A confidence of 1 refuses.
 */
export function test_unit_recovery_internal_required_camera_trials(): void {
  TestValidator.equals(
    "the worked count",
    requiredRecoveryCameraTrials(10, 5, 2, 0.99),
    Math.ceil(Math.log(0.01) / Math.log(7 / 9)),
  );
  TestValidator.equals(
    "all inliers",
    requiredRecoveryCameraTrials(8, 8, 3, 0.99),
    1,
  );
  TestValidator.equals(
    "too few inliers",
    requiredRecoveryCameraTrials(10, 1, 2, 0.99),
    Infinity,
  );
  TestValidator.error("certainty", (): number =>
    requiredRecoveryCameraTrials(10, 5, 2, 1),
  );
}
