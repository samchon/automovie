import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";

/*
 * Charge aggregate scene work before an action, without geometry rollback.
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
  if (amount < 0 || amount > limits[kind] - work[kind]) {
    const error: Error = new Error(`camera-scene-budget: ${kind} exhausted`);
    error.name = "RecoverySceneBudget";
    throw error;
  }
  work[kind] += amount;
}
