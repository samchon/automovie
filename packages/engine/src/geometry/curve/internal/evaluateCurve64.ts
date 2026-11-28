import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieBernsteinCurvePiece64,
  IAutoMovieCurvePrimitive64,
  IAutoMovieEvaluateBernstein64,
  IAutoMovieEvaluateCurve64,
} from "@automovie/interface";

import { assertCurve64 } from "./assertCurve64";
import { evaluateBernstein64 } from "./evaluateBernstein64";

/*
 * Evaluate a millimetre primitive in its declared phase chart. Piecewise
 * derivatives are divided by the selected positive phase width; analytic oval
 * derivatives are per turn. Interior seams choose the following piece, and the
 * final endpoint chooses the final piece at local t=1.
 * Parameter curve: Complete generating coefficients and their physical phase chart.
 * Parameter parameter: Value from 0 through the sum of phase widths, or through 1
 * turn for an oval.
 * Error when admission, domain selection or represented arithmetic is
 * unresolved.
 */
export function evaluateCurve64(
  curve: IAutoMovieCurvePrimitive64,
  parameter: number,
): IAutoMovieEvaluateCurve64.IResult {
  if (!Number.isFinite(parameter) || parameter < 0)
    throw new Error("A finite nonnegative curve parameter is required");
  assertCurve64(curve);
  if (curve.type === "analyticOval") {
    if (parameter > 1) throw new Error("An analytic oval uses one turn");
    const angle: number = 2 * Math.PI * parameter;
    const cos: number = Math.cos(angle);
    const sin: number = Math.sin(angle);
    const at: (k: 0 | 1 | 2) => number = (k: 0 | 1 | 2): number =>
      curve.center[k] +
      curve.radiusU * cos * curve.u[k] +
      curve.radiusV * sin * curve.v[k];
    const turn: (k: 0 | 1 | 2) => number = (k: 0 | 1 | 2): number =>
      2 *
      Math.PI *
      (-curve.radiusU * sin * curve.u[k] + curve.radiusV * cos * curve.v[k]);
    const point: AutoMovieVector3Tuple = [at(0), at(1), at(2)];
    const tangent: AutoMovieVector3Tuple = [turn(0), turn(1), turn(2)];
    if (!point.every(Number.isFinite) || !tangent.every(Number.isFinite))
      throw new Error("Analytic oval point and tangent must remain finite");
    return { point, tangentPerParameter: tangent };
  }
  const pieces: readonly IAutoMovieBernsteinCurvePiece64[] =
    curve.type === "cubicBezier"
      ? curve.spans.map(
          (
            s: AutoMovieCubicBezierControls3,
          ): IAutoMovieBernsteinCurvePiece64 => ({
            primitive: "polynomialBezier",
            degree: 3,
            controls: s,
          }),
        )
      : curve.pieces;
  const cumulative: number[] = [0];
  for (const width of curve.phaseIntervals)
    cumulative.push(cumulative.at(-1)! + width);
  const total: number = cumulative.at(-1)!;
  if (
    pieces.length === 0 ||
    cumulative.length !== pieces.length + 1 ||
    parameter > total ||
    curve.phaseIntervals.some(
      (w: number, i: number): boolean =>
        w <= 0 || cumulative[i + 1]! <= cumulative[i]!,
    )
  )
    throw new Error("Unresolved parameter partition");
  const index: number =
    parameter === total
      ? pieces.length - 1
      : cumulative.findIndex(
          (x: number, i: number): boolean =>
            i < pieces.length &&
            parameter >= x &&
            parameter < cumulative[i + 1]!,
        );
  const width: number = curve.phaseIntervals[index]!;
  const t: number =
    parameter === total ? 1 : (parameter - cumulative[index]!) / width;
  const evaluated: IAutoMovieEvaluateBernstein64.IResult = evaluateBernstein64(
    pieces[index]!,
    t,
  );
  const tangent: AutoMovieVector3Tuple = [
    evaluated.derivative[0] / width,
    evaluated.derivative[1] / width,
    evaluated.derivative[2] / width,
  ];
  if (!tangent.every(Number.isFinite))
    throw new Error("Curve tangent per parameter must remain finite");
  for (const k of [0, 1, 2] as const)
    if (evaluated.derivative[k] !== 0 && tangent[k] === 0)
      throw new Error("Unresolved physical parameter derivative underflow");
  return { point: evaluated.point, tangentPerParameter: tangent };
}
