import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";
import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRecoveryCameraMap.spendSceneWork` adds work of one kind while it
 * stays within that kind's budget, and otherwise throws a `RecoverySceneBudget`
 * error without spending.
 *
 * Scenarios, with 2 camera attempts and 3 joint fits of 4 iterations allowed:
 *
 * 1. Spending 2 camera attempts reaches the limit; one more is refused and the
 *    count stays 2.
 * 2. Joint iterations are limited to 3 × 4 = 12: 12 is spent, 1 more refused.
 * 3. Negative, fractional and NaN charges leave the ledger unchanged. Zero is
 *    admissible at the same original limits.
 * 4. A product beyond the largest safe counter admits representable work and
 *    refuses one past that counter. Malformed factors leave work unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names independent scene ledger limits and atomic refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Spends into ordinary and oversized iteration caps, tries one further charge at each true boundary, checks malformed factors in either position, and verifies atomic refusal and zero work.
 * @evidence contracts/development/testing.md#independent-expectations Three fits with four iterations give twelve. Twice the largest safe count exceeds the ledger's exact range, so that ledger can still represent every charge up to the largest safe integer.
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
      AutoMovieRecoveryCameraMap.spendSceneWork(work, budget, kind, amount);
      return null;
    } catch (error) {
      return error instanceof Error ? error.name : null;
    }
  };
  AutoMovieRecoveryCameraMap.spendSceneWork(work, budget, "cameraAttempts", 2);
  TestValidator.equals(
    "past the camera limit",
    [refused("cameraAttempts", 1), work.cameraAttempts],
    ["RecoverySceneBudget", 2],
  );
  AutoMovieRecoveryCameraMap.spendSceneWork(
    work,
    budget,
    "jointIterationAttempts",
    12,
  );
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
  for (const amount of [NaN, 0.5])
    TestValidator.equals(
      "malformed work cannot change the ledger",
      [refused("cameraAttempts", amount), work.cameraAttempts],
      ["RecoverySceneBudget", 0],
    );
  AutoMovieRecoveryCameraMap.spendSceneWork(work, budget, "cameraAttempts", 0);
  TestValidator.equals("zero work is admissible", work.cameraAttempts, 0);

  work.jointIterationAttempts = 0;
  budget.maxJointFits = Number.MAX_SAFE_INTEGER;
  budget.maxRefinementIterations = 2;
  AutoMovieRecoveryCameraMap.spendSceneWork(
    work,
    budget,
    "jointIterationAttempts",
    1,
  );
  TestValidator.equals("first safe iteration", work.jointIterationAttempts, 1);
  AutoMovieRecoveryCameraMap.spendSceneWork(
    work,
    budget,
    "jointIterationAttempts",
    Number.MAX_SAFE_INTEGER - 1,
  );
  TestValidator.equals(
    "refuse the first unrepresentable counter without spending",
    [refused("jointIterationAttempts", 1), work.jointIterationAttempts],
    ["RecoverySceneBudget", Number.MAX_SAFE_INTEGER],
  );
  TestValidator.equals(
    "zero charge is admitted at the exact safe cap",
    [refused("jointIterationAttempts", 0), work.jointIterationAttempts],
    [null, Number.MAX_SAFE_INTEGER],
  );

  work.jointIterationAttempts = 0;
  budget.maxJointFits = 0;
  TestValidator.equals(
    "zero effective limit admits only zero work",
    [
      refused("jointIterationAttempts", 0),
      refused("jointIterationAttempts", 1),
      work.jointIterationAttempts,
    ],
    [null, "RecoverySceneBudget", 0],
  );
  for (const value of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    for (const [fits, iterations] of [
      [value, 1],
      [1, value],
    ] as const) {
      budget.maxJointFits = fits;
      budget.maxRefinementIterations = iterations;
      TestValidator.equals(
        `invalid fit and iteration caps (${fits}, ${iterations}) refuse atomically`,
        [refused("jointIterationAttempts", 1), work.jointIterationAttempts],
        ["RecoverySceneBudget", 0],
      );
    }
  budget.maxJointFits = -1;
  budget.maxRefinementIterations = -1;
  TestValidator.equals(
    "two negative factors cannot authorize work",
    [refused("jointIterationAttempts", 1), work.jointIterationAttempts],
    ["RecoverySceneBudget", 0],
  );
  AutoMovieRecoveryCameraMap.spendSceneWork(work, budget, "cameraAttempts", 1);
  TestValidator.equals(
    "other categories use their own caps",
    work.cameraAttempts,
    1,
  );
}
