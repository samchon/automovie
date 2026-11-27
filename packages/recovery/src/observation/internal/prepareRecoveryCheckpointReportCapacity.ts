import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryCheckpointReporting,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";

import { isRecoveryMapIdentityGauge } from "./isRecoveryMapIdentityGauge";
import { prepareRecoveryFeasibleReportCapacity } from "./prepareRecoveryFeasibleReportCapacity";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/** Acquire a direct checkpoint's report scope after its active-index check. */
export function prepareRecoveryCheckpointReportCapacity(
  pose: IAutoMovieRecoveryMapPose,
  budget: IAutoMovieRecoveryCameraSceneBudget,
  options: IAutoMovieRecoveryFeasibleJointOptions,
  work: IAutoMovieRecoverySceneWork,
): IAutoMovieRecoveryCheckpointReporting {
  spendRecoverySceneWork(work, budget, "linearWork", 256);
  if (!isRecoveryMapIdentityGauge(pose))
    throw new Error(
      "camera-feasible: bounded full-population identity gauge required",
    );
  const feasible: IAutoMovieRecoveryFeasibleJointOptions = {
    directionBudget: {
      maxIterations: options.directionBudget.maxIterations,
      maxEntries: options.directionBudget.maxEntries,
      maxWork: options.directionBudget.maxWork,
    },
    maxResidentLinearEntries: options.maxResidentLinearEntries,
    sqpAcceleration: options.sqpAcceleration,
    adaptiveRegularization: options.adaptiveRegularization,
    laggedLagrangianMetric: options.laggedLagrangianMetric,
  };
  return {
    feasible,
    reporting: prepareRecoveryFeasibleReportCapacity(
      budget.maxResidentLinearEntries,
      feasible.maxResidentLinearEntries,
      0,
    ),
  };
}
