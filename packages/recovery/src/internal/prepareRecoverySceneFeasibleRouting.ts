import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoverySceneWork } from "../structures/image/IAutoMovieRecoverySceneWork";
import type { IAutoMovieRecoveryFeasibleJointOptions } from "../structures/internal/IAutoMovieRecoveryFeasibleJointOptions";
import type { IAutoMovieRecoverySceneFeasibleRouting } from "../structures/internal/IAutoMovieRecoverySceneFeasibleRouting";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/**
 * Own one explicit scene method request before any user checkpoint.
 *
 * @evidence contracts/common.md#principled-implementation Fixed scalar validation preserves the admitted scene ceilings; execution retention subtracts64 while the original declared budget remains reportable. Inner iterations are explicit and never derived from outer trials or specimen dimensions.
 * @evidence contracts/common.md#clear-and-simple-design The coordinator skips this owner entirely when options are absent. One existing work ledger prepays256 before snapshots and validation; each joint fit retains its separate admission and charging.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid requests, aggregate charge errors and insufficient fixed retention propagate before geometry. No ordinary fallback, raised ceiling or method-specific image identity supplies capacity.
 * @evidence contracts/common.md#meaningful-documentation Budget values are logical scalar entries and visits, not bytes or elapsed time. Only named fixed fields are read; no caller record survives a checkpoint through this result.
 * @evidence contracts/performance.md#efficient-algorithms The fixed256 visits cover at most72 budget copy reads/stores including the resident override,20 option reads/stores including repeated nested access,80 shape/numeric/flag/ceiling operations and64 charge/record/bookkeeping visits; their conservative sum is236. There is no population scan; malformed prefixes consume the same precharge after outer shape admission.
 * @evidence contracts/performance.md#reuse-equivalent-work One snapshot supplies both checkpoints and every closure fit without recopying options per candidate or retaining caller aliases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two17-field budgets plus eight option/reference fields and three routing references occupy45 slots. Dense validation arrays of at most4 and fixed scratch fit64; later the coordinator's fixed callback guard and the charge helper's six-field limit record share the remaining19 slots. The existing seven-field work ledger is not duplicated. The declared budget transfers to the result, and other snapshots expire on return or throw.
 */
export function prepareRecoverySceneFeasibleRouting(
  budget: IAutoMovieRecoveryCameraSceneBudget,
  options: IAutoMovieRecoveryFeasibleJointOptions,
  work: IAutoMovieRecoverySceneWork,
): IAutoMovieRecoverySceneFeasibleRouting {
  if (
    !options ||
    typeof options !== "object" ||
    Array.isArray(options) ||
    !options.directionBudget ||
    typeof options.directionBudget !== "object" ||
    Array.isArray(options.directionBudget)
  )
    throw new Error("camera-scene-feasible: fixed method records required");
  if (
    !Number.isSafeInteger(budget.maxResidentLinearEntries) ||
    budget.maxResidentLinearEntries <= 64
  )
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
    ].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    ![
      feasible.sqpAcceleration,
      feasible.adaptiveRegularization,
      feasible.laggedLagrangianMetric,
    ].every(
      (value: boolean | undefined): boolean =>
        value === undefined || typeof value === "boolean",
    ) ||
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
