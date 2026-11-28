import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";

/**
 * Charge a nonnegative safe integer amount to one scene work category before
 * performing the action. A malformed charge, invalid category limit or
 * insufficient remaining work throws `RecoverySceneBudget` and keeps the ledger
 * intact.
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
  const { maxJointFits, maxRefinementIterations } = budget;
  const jointIterationLimit: number =
    Number.isSafeInteger(maxJointFits) &&
    maxJointFits >= 0 &&
    Number.isSafeInteger(maxRefinementIterations) &&
    maxRefinementIterations >= 0
      ? Math.min(
          maxJointFits * maxRefinementIterations,
          Number.MAX_SAFE_INTEGER,
        )
      : NaN;
  const limits: Record<typeof kind, number> = {
    cameraAttempts: budget.maxCameraAttempts,
    resectionTrials: budget.maxTotalResectionTrials,
    triangulations: budget.maxTriangulations,
    jointFits: budget.maxJointFits,
    linearWork: budget.maxLinearWork,
    jointIterationAttempts: jointIterationLimit,
  };
  const limit: number = limits[kind];
  const spent: number = work[kind];
  if (
    !Number.isSafeInteger(amount) ||
    amount < 0 ||
    !Number.isSafeInteger(limit) ||
    limit < 0 ||
    !Number.isSafeInteger(spent) ||
    spent < 0 ||
    amount > limit - spent
  ) {
    const error: Error = new Error(`camera-scene-budget: ${kind} exhausted`);
    error.name = "RecoverySceneBudget";
    throw error;
  }
  work[kind] += amount;
}
