import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";
import { spendRecoverySceneWork } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `spendRecoverySceneWork` adds work of one kind while it stays within that
 * kind's budget, and otherwise throws a `RecoverySceneBudget` error without
 * spending.
 *
 * Scenarios, with 2 camera attempts and 3 joint fits of 4 iterations allowed:
 *
 * 1. Spending 2 camera attempts reaches the limit; one more is refused and the
 *    count stays 2.
 * 2. Joint iterations are limited to 3 × 4 = 12: 12 is spent, 1 more refused.
 * 3. A negative amount is refused.
 */
export function test_recovery_internal_spend_scene_work(): void {
  const budget: IAutoMovieRecoveryCameraSceneBudget = {
    maxPixels: 1,
    maxDescriptorPairs: 1,
    maxTracks: 1,
    maxObservations: 1,
    maxResectionTrials: 1,
    minimumResectionTrials: 1,
    maxLocalRefinements: 1,
    maxRefinementIterations: 4,
    maxLinearEntries: 1,
    maxSingularSweeps: 1,
    maxViews: 1,
    maxCameraAttempts: 2,
    maxTotalResectionTrials: 1,
    maxTriangulations: 1,
    maxJointFits: 3,
    maxLinearWork: 1,
    maxResidentLinearEntries: 1,
  };
  const work: IAutoMovieRecoverySceneWork = {
    cameraAttempts: 0,
    resectionTrials: 0,
    triangulations: 0,
    triangulationRefusals: 0,
    jointFits: 0,
    jointIterationAttempts: 0,
    linearWork: 0,
  };
  const refused: (
    kind: "cameraAttempts" | "jointIterationAttempts",
    amount: number,
  ) => string | null = (
    kind: "cameraAttempts" | "jointIterationAttempts",
    amount: number,
  ): string | null => {
    try {
      spendRecoverySceneWork(work, budget, kind, amount);
      return null;
    } catch (error) {
      return error instanceof Error ? error.name : null;
    }
  };
  spendRecoverySceneWork(work, budget, "cameraAttempts", 2);
  TestValidator.equals(
    "past the camera limit",
    [refused("cameraAttempts", 1), work.cameraAttempts],
    ["RecoverySceneBudget", 2],
  );
  spendRecoverySceneWork(work, budget, "jointIterationAttempts", 12);
  TestValidator.equals(
    "past the iteration limit",
    [refused("jointIterationAttempts", 1), work.jointIterationAttempts],
    ["RecoverySceneBudget", 12],
  );
  work.cameraAttempts = 0;
  TestValidator.equals(
    "a negative amount",
    refused("cameraAttempts", -1),
    "RecoverySceneBudget",
  );
}
