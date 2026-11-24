import { AutoMovieMatrix3 } from "@automovie/engine";
import type { IAutoMovieRecoveryPoseResidualsLinearizeOperation } from "@automovie/interface";

/**
 * Signed pixel Sampson residuals and analytic five-coordinate local Jacobian.
 * With e=x2-transpose F x1 and d the joint epipolar-normal norm, each
 * derivative is de/d - (e/d)_sum((line/d)_(derivativeLine/d)). This
 * differentiates both the incidence and its pixel normalization; zero/undefined
 * lines refuse the fit.
 */
export function linearizeRecoveryPoseResiduals(
  model: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[0],
  first: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[1],
  second: Parameters<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation> {
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
    if (!(denominator > 0))
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
    residuals.push(residual);
    jacobian.push(row);
  }
  return { residuals, jacobian };
}
