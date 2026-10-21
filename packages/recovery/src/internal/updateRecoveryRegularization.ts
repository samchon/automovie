import type { IAutoMovieRecoveryRegularizationUpdate } from "../structures/image/IAutoMovieRecoveryRegularizationUpdate";

/**
 * React to one selected increment using its undamped computed agreement.
 * The multiplier is the unclamped reciprocal accepted-radius rule from Ceres
 * levenberg_marquardt_strategy.cc, blob 9e25466e61e0cc6a2c1136131c48c841bd365fcc,
 * lines162-168. Radius caps, diagonal clamps and rejected-step rules are absent.
 * Source: https://ceres-solver.googlesource.com/ceres-solver/+/master/internal/ceres/levenberg_marquardt_strategy.cc
 * This rule alone supplies no standard LM or constrained convergence theorem.
 *
 * @evidence contracts/common.md#principled-implementation For positive finite actual and predicted decreases, the computed ratio gives max(1/3,1-(2*rho-1)^3). The rho>=1 branch is algebraically identical and avoids cubic overflow. These finite checks qualify arithmetic use, not exact agreement or a Hessian approximation.
 * @evidence contracts/common.md#clear-and-simple-design This scalar owner returns the next coefficient and explicit support status; its caller owns the current design, actual increment, next-model timing and charging.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported decreases, ratio or coefficient preserve the previous damping without a specimen coefficient, floor, extra trial or refactor loop. Invalid previous damping is a core input error.
 * @evidence contracts/common.md#meaningful-documentation States the source, copied portion, computed ratio meaning and unchanged-coefficient failure effects; all published diagnostic values are finite or null.
 * @evidence contracts/performance.md#efficient-algorithms Constant scalar arithmetic and one fixed record need no scan or matrix; the fitting owner charges the original-design prediction separately before visiting it.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied actual and predicted decreases are consumed once without evaluating geometry or rebuilding a model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One owned scalar record transfers; no design, state, callback or history is retained.
 */
export function updateRecoveryRegularization(
  damping: number,
  actualDecrease: number,
  predictedDecrease: number | null,
): IAutoMovieRecoveryRegularizationUpdate {
  if (!(damping > 0 && Number.isFinite(damping)))
    throw new Error("camera-regularization: positive finite previous damping required");
  const result: IAutoMovieRecoveryRegularizationUpdate = {
    supported: false, reason: "decrease-unsupported",
    previousDamping: damping, damping,
    actualDecrease: Number.isFinite(actualDecrease) ? actualDecrease : null,
    predictedDecrease: predictedDecrease !== null && Number.isFinite(predictedDecrease) ? predictedDecrease : null,
    ratio: null, factor: null,
  };
  if (!(result.actualDecrease !== null && result.actualDecrease > 0 &&
      result.predictedDecrease !== null && result.predictedDecrease > 0)) return result;
  const ratio: number = result.actualDecrease / result.predictedDecrease;
  if (!(ratio > 0 && Number.isFinite(ratio))) {
    result.reason = "ratio-unsupported";
    return result;
  }
  result.ratio = ratio;
  const factor: number = ratio >= 1 ? 1 / 3 : Math.max(1 / 3, 1 - (2 * ratio - 1) ** 3);
  result.factor = factor;
  const next: number = damping * factor;
  if (!(next > 0 && Number.isFinite(next))) {
    result.reason = "damping-unsupported";
    return result;
  }
  result.supported = true;
  result.reason = "accepted-agreement";
  result.damping = next;
  return result;
}
