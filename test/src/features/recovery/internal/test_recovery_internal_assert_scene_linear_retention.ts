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
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(budget(716), 2, 1, 1),
      ),
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(budget(715), 2, 1, 1),
      ),
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(budget(726), 2, 1, 1, 10),
      ),
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(budget(725), 2, 1, 1, 10),
      ),
      refusal((): void =>
        AutoMovieRecoveryCameraMap.assertSceneLinearRetention(budget(1_000_000), 1, 1, 1),
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
}
