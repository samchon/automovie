import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoverySceneWork } from "../structures/image/IAutoMovieRecoverySceneWork";

/**
 * Charge aggregate scene work before an action, without geometry rollback.
 *
 * @evidence contracts/common.md#principled-implementation Safe nonnegative integer accounting checks remaining declared capacity before incrementing; a distinct budget error propagates through numerical proposal catches.
 * @evidence contracts/common.md#clear-and-simple-design One counter-to-ceiling mapping serves scene orchestration, point growth and joint fitting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No overflow, negative refund, raised ceiling or rolled-back work supplies capacity.
 * @evidence contracts/common.md#meaningful-documentation States preaction charging and distinguished budget failure semantics.
 * @evidence contracts/performance.md#efficient-algorithms One fixed-field lookup and safe-integer check cost constant time and space.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared caller-owned ledger accounts for every stage without a second workflow scan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the explicit scalar ledger is mutated; no global state or resource is acquired.
 */
export function spendRecoverySceneWork(
  work: IAutoMovieRecoverySceneWork,
  budget: IAutoMovieRecoveryCameraSceneBudget,
  kind:
    | "cameraAttempts"
    | "resectionTrials"
    | "triangulations"
    | "jointFits"
    | "linearWork"
    | "jointIterationAttempts",
  amount: number,
): void {
  const limits: Record<typeof kind, number> = {
    cameraAttempts: budget.maxCameraAttempts,
    resectionTrials: budget.maxTotalResectionTrials,
    triangulations: budget.maxTriangulations,
    jointFits: budget.maxJointFits,
    linearWork: budget.maxLinearWork,
    jointIterationAttempts:
      budget.maxJointFits * budget.maxRefinementIterations,
  };
  if (
    !Number.isSafeInteger(amount) ||
    amount < 0 ||
    amount > limits[kind] - work[kind]
  ) {
    const error: Error = new Error(`camera-scene-budget: ${kind} exhausted`);
    error.name = "RecoverySceneBudget";
    throw error;
  }
  work[kind] += amount;
}
