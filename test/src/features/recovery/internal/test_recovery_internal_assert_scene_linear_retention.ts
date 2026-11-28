import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `assertRecoverySceneLinearRetention` refuses a scene whose retained linear
 * slots, 16 per observation and 12 per landmark across the reduced camera width
 * plus four, 16 for the square of that width, the transient entries and 64
 * more, exceed the resident budget.
 *
 * Scenarios, for two cameras (reduced width 6·2 - 7 = 5), one observation and
 * one landmark: 16·9 + 16·25 + 12·9 + 64 = 716 slots.
 *
 * 1. A budget of 716 holds them; 715 refuses with a `RecoverySceneBudget`.
 * 2. Ten transient entries need 726.
 * 3. One camera is refused.
 * 4. Two cameras with no points, observations or transient entries need 464 slots.
 *    Fractional, nonfinite, negative and unsafe counts and capacity refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the reduced-width storage count and inclusive budget check.
 * @evidence contracts/development/testing.md#behavioral-verification Checks inclusive resident boundaries with and without point data and transient entries. Changes each declared quantity to malformed or unsafe values and verifies the same named budget error.
 * @evidence contracts/development/testing.md#independent-expectations The five reduced camera dimensions require 16 times 25 plus 64 fixed slots, or 464. One point and one measurement add 12 times nine and 16 times nine. Ten transient slots add ten more.
 */
export function test_recovery_internal_assert_scene_linear_retention(): void {
  const budget: (entries: number) => IAutoMovieRecoveryCameraSceneBudget = (
    entries: number,
  ): IAutoMovieRecoveryCameraSceneBudget => ({
    maxPixels: 1,
    maxDescriptorPairs: 1,
    maxTracks: 1,
    maxObservations: 1,
    maxResectionTrials: 1,
    minimumResectionTrials: 1,
    maxLocalRefinements: 1,
    maxRefinementIterations: 1,
    maxLinearEntries: 1,
    maxSingularSweeps: 1,
    maxViews: 2,
    maxCameraAttempts: 1,
    maxTotalResectionTrials: 1,
    maxTriangulations: 1,
    maxJointFits: 1,
    maxLinearWork: 1,
    maxResidentLinearEntries: entries,
  });
  const refusal: (call: () => void) => string | null = (
    call: () => void,
  ): string | null => {
    try {
      call();
      return null;
    } catch (error) {
      return error instanceof Error ? error.name : null;
    }
  };
  TestValidator.equals(
    "the slots",
    [
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(
          budget(716),
          2,
          1,
          1,
        ),
      ),
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(
          budget(715),
          2,
          1,
          1,
        ),
      ),
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(
          budget(726),
          2,
          1,
          1,
          10,
        ),
      ),
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(
          budget(725),
          2,
          1,
          1,
          10,
        ),
      ),
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(
          budget(1_000_000),
          1,
          1,
          1,
        ),
      ),
    ],
    [
      null,
      "RecoverySceneBudget",
      null,
      "RecoverySceneBudget",
      "RecoverySceneBudget",
    ],
  );
  TestValidator.equals(
    "zero populations consume only base slots",
    [464, 463].map((amount: number): string | null =>
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(
          budget(amount),
          2,
          0,
          0,
          0,
        ),
      ),
    ),
    [null, "RecoverySceneBudget"],
  );
  for (const count of [2.5, NaN, Infinity, -1, Number.MAX_SAFE_INTEGER + 1]) {
    for (const [
      label,
      cameras,
      observations,
      landmarks,
      transient,
      capacity,
    ] of [
      ["cameras", count, 0, 0, 0, 10_000],
      ["observations", 2, count, 0, 0, 10_000],
      ["landmarks", 2, 0, count, 0, 10_000],
      ["transient slots", 2, 0, 0, count, 10_000],
      ["capacity", 2, 0, 0, 0, count],
    ] as const)
      TestValidator.equals(
        `invalid ${label} (${count}) refuses`,
        refusal((): void =>
          AutoMovieRecoveryCameraMap.assertSceneLinearRetention(
            budget(capacity),
            cameras,
            observations,
            landmarks,
            transient,
          ),
        ),
        "RecoverySceneBudget",
      );
  }
  TestValidator.equals(
    "safe inputs with an unsafe derived total refuse",
    refusal((): void =>
      AutoMovieRecoveryCameraMap.assertSceneLinearRetention(
        budget(Number.MAX_SAFE_INTEGER),
        Number.MAX_SAFE_INTEGER,
        0,
        0,
      ),
    ),
    "RecoverySceneBudget",
  );
}
