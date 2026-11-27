import type {
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoverySceneFeasibleRouting,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";

import { spendRecoverySceneWork } from "../../internal/spendRecoverySceneWork";

/** Own one explicit scene method request before any user checkpoint. */
export function prepareRecoverySceneFeasibleRouting(
  budget: IAutoMovieRecoveryCameraSceneBudget,
  options: IAutoMovieRecoveryFeasibleJointOptions,
  work: IAutoMovieRecoverySceneWork,
): IAutoMovieRecoverySceneFeasibleRouting {
  if (budget.maxResidentLinearEntries <= 64)
    throw new Error("camera-scene-feasible: fixed routing retention required");
  spendRecoverySceneWork(work, budget, "linearWork", 256);
  const declared: IAutoMovieRecoveryCameraSceneBudget = {
    maxPixels: budget.maxPixels,
    maxDescriptorPairs: budget.maxDescriptorPairs,
    maxTracks: budget.maxTracks,
    maxObservations: budget.maxObservations,
    maxResectionTrials: budget.maxResectionTrials,
    minimumResectionTrials: budget.minimumResectionTrials,
    maxLocalRefinements: budget.maxLocalRefinements,
    maxRefinementIterations: budget.maxRefinementIterations,
    maxLinearEntries: budget.maxLinearEntries,
    maxSingularSweeps: budget.maxSingularSweeps,
    maxViews: budget.maxViews,
    maxCameraAttempts: budget.maxCameraAttempts,
    maxTotalResectionTrials: budget.maxTotalResectionTrials,
    maxTriangulations: budget.maxTriangulations,
    maxJointFits: budget.maxJointFits,
    maxLinearWork: budget.maxLinearWork,
    maxResidentLinearEntries: budget.maxResidentLinearEntries,
  };
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
  if (
    ![
      feasible.directionBudget.maxIterations,
      feasible.directionBudget.maxEntries,
      feasible.directionBudget.maxWork,
      feasible.maxResidentLinearEntries,
    ].every((value: number): boolean => value > 0) ||
    (feasible.laggedLagrangianMetric === true &&
      feasible.sqpAcceleration !== true) ||
    feasible.directionBudget.maxEntries > declared.maxLinearEntries ||
    feasible.directionBudget.maxWork > declared.maxLinearWork ||
    feasible.maxResidentLinearEntries > declared.maxResidentLinearEntries
  )
    throw new Error(
      "camera-scene-feasible: safe method bounds within scene ceilings required",
    );
  const execution: IAutoMovieRecoveryCameraSceneBudget = {
    ...declared,
    maxResidentLinearEntries: declared.maxResidentLinearEntries - 64,
  };
  feasible.maxResidentLinearEntries = Math.min(
    feasible.maxResidentLinearEntries,
    execution.maxResidentLinearEntries,
  );
  return { declared, execution, feasible };
}
