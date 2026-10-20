import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";

import type { createRecoveryPoseModel } from "./createRecoveryPoseModel";

/**
 * Signed pixel Sampson residuals and analytic five-coordinate local Jacobian.
 * With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative
 * is de/d - (e/d)*sum((line/d)*(derivativeLine/d)). This differentiates both the
 * incidence and its pixel normalization; zero/undefined lines refuse the fit.
 *
 * @evidence contracts/common.md#principled-implementation The quotient derivative of signed Sampson distance uses both epipolar lines and the calibrated model's five analytic matrix derivatives. Norm-normalized dot products avoid first squaring the full denominator, and no derivative denominator is floored.
 * @evidence contracts/common.md#clear-and-simple-design This point pass owns the residual equation used by the local optimizer, independently of robust weighting and step selection; the same supplied pixel charts remain fixed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No finite-difference perturbation, omitted normalization derivative, zero residual replacement or expected camera supplies a Jacobian. Undefined or nonfinite arithmetic throws.
 * @evidence contracts/common.md#meaningful-documentation Gives signed pixel units, the complete derivative equation, the five local coordinates inherited from the model and the undefined-line failure effect.
 * @evidence contracts/performance.md#efficient-algorithms N points and five fixed derivatives require O(N) work and O(5N) returned Jacobian storage; six transposes are prepared once, and no image or design factorization is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work Base incidence and line norm serve all five derivatives at each correspondence; model derivatives are shared over the complete current fitting set.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only owned residual and Jacobian arrays return; no borrowed observations, calibration, image buffer or external handle remains after return or throw.
 */
export function linearizeRecoveryPoseResiduals(
  model: ReturnType<typeof createRecoveryPoseModel>,
  first: readonly (readonly [number, number])[],
  second: readonly (readonly [number, number])[],
): { residuals: number[]; jacobian: number[][] } {
  if (first.length !== second.length || model.derivatives.length !== 5)
    throw new Error(
      "camera-refinement: paired points and five derivatives required",
    );
  const matrices: number[][] = [model.matrix, ...model.derivatives];
  const transposes: number[][] = matrices.map((matrix: number[]): number[] =>
    AutoMovieMatrix3.transpose(matrix),
  );
  const residuals: number[] = [],
    jacobian: number[][] = [];
  for (let at: number = 0; at < first.length; at++) {
    const x: number[] = [...first[at]!, 1],
      y: number[] = [...second[at]!, 1];
    const l2: [number, number, number] = AutoMovieMatrix3.apply(
      model.matrix,
      x,
    );
    const l1: [number, number, number] = AutoMovieMatrix3.apply(
      transposes[0]!,
      y,
    );
    const denominator: number = Math.hypot(l1[0], l1[1], l2[0], l2[1]);
    const incidence: number = y[0]! * l2[0] + y[1]! * l2[1] + l2[2];
    if (
      !(denominator > 0) ||
      !Number.isFinite(denominator) ||
      !Number.isFinite(incidence)
    )
      throw new Error("camera-refinement: undefined epipolar normal");
    const residual: number = incidence / denominator;
    const row: number[] = [];
    for (let parameter: number = 0; parameter < 5; parameter++) {
      const dl2: [number, number, number] = AutoMovieMatrix3.apply(
        model.derivatives[parameter]!,
        x,
      );
      const dl1: [number, number, number] = AutoMovieMatrix3.apply(
        transposes[parameter + 1]!,
        y,
      );
      const de: number = y[0]! * dl2[0] + y[1]! * dl2[1] + dl2[2];
      const relativeNormDerivative: number =
        (l1[0] / denominator) * (dl1[0] / denominator) +
        (l1[1] / denominator) * (dl1[1] / denominator) +
        (l2[0] / denominator) * (dl2[0] / denominator) +
        (l2[1] / denominator) * (dl2[1] / denominator);
      row.push(de / denominator - residual * relativeNormDerivative);
    }
    if (!Number.isFinite(residual) || !row.every(Number.isFinite))
      throw new Error(
        "camera-refinement: nonrepresentable residual derivative",
      );
    residuals.push(residual);
    jacobian.push(row);
  }
  return { residuals, jacobian };
}
