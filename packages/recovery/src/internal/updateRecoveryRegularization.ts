import type { IAutoMovieRecoveryRegularizationUpdate } from "@automovie/interface";

/**
 * React to one selected increment using its undamped computed agreement. The
 * multiplier is the unclamped reciprocal accepted-radius rule from Ceres
 * levenberg_marquardt_strategy.cc, blob
 * 9e25466e61e0cc6a2c1136131c48c841bd365fcc, lines162-168. Radius caps, diagonal
 * clamps and rejected-step rules are absent. Source:
 * https://ceres-solver.googlesource.com/ceres-solver/+/master/internal/ceres/levenberg_marquardt_strategy.cc
 * This rule alone supplies no standard LM or constrained convergence theorem.
 */
export function updateRecoveryRegularization(
  damping: number,
  actualDecrease: number,
  predictedDecrease: number | null,
): IAutoMovieRecoveryRegularizationUpdate {
  if (!(damping > 0))
    throw new Error(
      "camera-regularization: positive finite previous damping required",
    );
  const result: IAutoMovieRecoveryRegularizationUpdate = {
    supported: false,
    reason: "decrease-unsupported",
    previousDamping: damping,
    damping,
    actualDecrease: actualDecrease,
    predictedDecrease: predictedDecrease !== null ? predictedDecrease : null,
    ratio: null,
    factor: null,
  };
  if (
    !(
      result.actualDecrease !== null &&
      result.actualDecrease > 0 &&
      result.predictedDecrease !== null &&
      result.predictedDecrease > 0
    )
  )
    return result;
  const ratio: number = result.actualDecrease / result.predictedDecrease;
  if (!(ratio > 0)) {
    result.reason = "ratio-unsupported";
    return result;
  }
  result.ratio = ratio;
  const factor: number =
    ratio >= 1 ? 1 / 3 : Math.max(1 / 3, 1 - (2 * ratio - 1) ** 3);
  result.factor = factor;
  const next: number = damping * factor;
  if (!(next > 0)) {
    result.reason = "damping-unsupported";
    return result;
  }
  result.supported = true;
  result.reason = "accepted-agreement";
  result.damping = next;
  return result;
}
