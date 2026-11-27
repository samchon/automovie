import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartBoxSolve,
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
} from "@automovie/interface";

import { RecoveryChartBoxSolve as S } from "./RecoveryChartBoxSolve";

/*
 * Solve the normalized box problem and reconstruct the original coefficient
 * registry.
 */
export function RecoveryChartFitSolve(
  input: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[0],
  prepared: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[1],
  system: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[2],
): ReturnType<IAutoMovieRecoveryChartFitSolve.Operation> {
  const {
    finite,
    lower,
    upper,
    origin,
    scale,
    slots,
    reduced,
  }: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation> = prepared;
  const {
    hessian,
    rhs,
    diagnostics,
  }: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation> = system;
  const lo: [number, number, number] = [
    (lower[0] - origin[0]!) / scale,
    (lower[1] - origin[1]!) / scale,
    (lower[2] - origin[2]!) / scale,
  ];
  const hi: [number, number, number] = [
    (upper[0] - origin[0]!) / scale,
    (upper[1] - origin[1]!) / scale,
    (upper[2] - origin[2]!) / scale,
  ];
  const initialValues: number[] | undefined = input.initialControlsMm
    ? reduced.independent.flatMap((id: number): number[] => {
        const point: Readonly<AutoMovieVector3Tuple> | undefined =
          input.initialControlsMm![id];
        if (!point || !finite(point))
          throw new Error(
            "Prolonged initialization must address every independent coefficient finitely",
          );
        return point.map(
          (value: number, k: number): number => (value - origin[k]!) / scale,
        );
      })
    : undefined;
  if (input.initialControlsMm) {
    if (input.initialControlsMm.length !== input.controls.length)
      throw new Error(
        "Prolonged initialization must retain the complete coefficient registry",
      );
    let maximumDifferenceMm: number = 0;
    for (let id: number = 0; id < reduced.expressions.length; id++) {
      const expression: (typeof reduced.expressions)[number] =
        reduced.expressions[id]!;
      const point: Readonly<AutoMovieVector3Tuple> | undefined =
        input.initialControlsMm[id];
      if (!point || !finite(point))
        throw new Error("Every prolonged coefficient must be finite");
      const reconstructed: number[] = expression.constant.map(
        (value: number, k: number): number =>
          value +
          expression.terms.reduce(
            (sum: number, term: (typeof expression.terms)[number]): number =>
              sum + term.weight * input.initialControlsMm![term.id]![k]!,
            0,
          ),
      );
      maximumDifferenceMm = Math.max(
        maximumDifferenceMm,
        Math.hypot(
          ...reconstructed.map(
            (value: number, k: number): number => value - point[k]!,
          ),
        ),
      );
    }
    diagnostics.push(
      `Prolonged initialization affine-relation maximumDifferenceMm=${maximumDifferenceMm}; binary64 measurement, not an exact-arithmetic certificate`,
    );
    if (maximumDifferenceMm > input.toleranceMm)
      throw new Error(
        "Prolonged field is incompatible with the new coefficient relations at the declared tolerance",
      );
  }
  const solved: ReturnType<IAutoMovieRecoveryChartBoxSolve.Operation> = S({
    hessian: hessian.map((row: Map<number, number>): [number, number][] => [
      ...row,
    ]),
    rhs: [...rhs],
    lower: lo,
    upper: hi,
    maxIterations: input.maxIterations,
    gradientTolerance: input.gradientTolerance,
    initialValues,
  });
  const x: Float64Array = solved.values,
    iterations: number = solved.iterations,
    projectedGradient: number = solved.projectedGradient;
  const solveAxis = (id: number, k: 0 | 1 | 2): number =>
    reduced.expressions[id]!.terms.reduce(
      (sum: number, term: { id: number; weight: number }): number =>
        sum +
        term.weight * (origin[k]! + scale * x[3 * slots[term.id]! + k]!),
      reduced.expressions[id]!.constant[k]!,
    );
  const controls: Readonly<AutoMovieVector3Tuple>[] = input.controls.map(
    (
      p: Readonly<AutoMovieVector3Tuple> | null,
      id: number,
    ): Readonly<AutoMovieVector3Tuple> =>
      p === null
        ? [solveAxis(id, 0), solveAxis(id, 1), solveAxis(id, 2)]
        : [p[0], p[1], p[2]],
  );
  if (
    controls.some((p: Readonly<AutoMovieVector3Tuple>): boolean => !finite(p))
  )
    throw new Error("The fitted coefficient registry became nonfinite");
  const dependentEnclosureViolationMm: number = controls.reduce(
    (maximum: number, point: Readonly<AutoMovieVector3Tuple>): number =>
      Math.max(
        maximum,
        ...point.map((value: number, k: number): number =>
          Math.max(lower[k]! - value, value - upper[k]!, 0),
        ),
      ),
    0,
  );
  if (dependentEnclosureViolationMm > 0)
    diagnostics.push(
      "Affine dependent controls exceed the declared enclosure; finite coefficients are retained without clipping",
    );

  return {
    lo,
    hi,
    solved,
    x,
    iterations,
    projectedGradient,
    controls,
    dependentEnclosureViolationMm,
  };
}
