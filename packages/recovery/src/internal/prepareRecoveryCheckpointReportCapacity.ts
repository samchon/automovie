import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoverySceneWork } from "../structures/image/IAutoMovieRecoverySceneWork";
import type { IAutoMovieRecoveryCheckpointReporting } from "../structures/internal/IAutoMovieRecoveryCheckpointReporting";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import { isRecoveryMapIdentityGauge } from "./isRecoveryMapIdentityGauge";
import { prepareRecoveryFeasibleReportCapacity } from "./prepareRecoveryFeasibleReportCapacity";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/**
 * Acquire a direct checkpoint's report scope after its active-index check.
 *
 * @evidence contracts/common.md#principled-implementation The original exact first-pose gauge is checked before fixed capacity can classify a valid resource refusal; unchanged scene/fit ceilings partition one current-operation envelope.
 * @evidence contracts/common.md#clear-and-simple-design Scene calls already own their method/scope and skip this owner; direct feasible checkpoints snapshot the nested method before growth callbacks and share that matching pair through closure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No approximate gauge, ordinary fallback, changed threshold, extra fit or refunded work supplies a report.
 * @evidence contracts/common.md#meaningful-documentation Prepay256 covers fixed gauge/context/budget-copy bookkeeping; charge and core errors propagate and capacity remains its concrete distinguished error.
 * @evidence contracts/performance.md#efficient-algorithms Fixed setup covers36 budget-copy,64 capacity,64 gauge,64 charge/bookkeeping,20 method-copy and8 transfer visits:256. No population scan runs; the caller's one17-field execution copy belongs to this same envelope.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the original gauge predicate and one scope for every closure pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Context, ten-slot nested method snapshot and three-slot transfer fit the current512 reporting envelope. Borrowed pose/options/budget/work do not enter output reports, and no caller option reference survives acquisition.
 */
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
