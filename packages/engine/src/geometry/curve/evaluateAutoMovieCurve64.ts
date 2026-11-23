import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieBernsteinCurvePiece64,
  IAutoMovieCurvePrimitive64,
  IAutoMovieEvaluateBernstein64,
  IAutoMovieEvaluateCurve64,
} from "@automovie/interface";

import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";
import { evaluateAutoMovieBernstein64 } from "./evaluateAutoMovieBernstein64";

/**
 * Evaluate a millimetre primitive in its declared phase chart. Piecewise derivatives are divided by the selected positive phase width; analytic oval derivatives are per turn. Interior seams choose the following piece, and the final endpoint chooses the final piece at local t=1.
 *
 * @param curve Complete generating coefficients and their physical phase chart.
 * @param parameter Finite value from 0 through the sum of phase widths, or through 1 turn for an oval.
 * @throws Error when admission, domain selection or represented arithmetic is unresolved.
 */
export function evaluateAutoMovieCurve64(
  curve: IAutoMovieCurvePrimitive64,
  parameter: number,
): IAutoMovieEvaluateCurve64.IResult {
  assertAutoMovieCurve64(curve);
  if (!Number.isFinite(parameter) || parameter < 0)
    throw new Error("A nonnegative finite curve parameter is required");
  if (
    curve.unit !== "mm" ||
    !["turn", "mm", "normalized"].includes(curve.phaseUnit)
  )
    throw new Error("Explicit coordinate and parameter units required");
  if (typeof curve.name !== "string" || typeof curve.closed !== "boolean")
    throw new Error("Explicit curve identity and topology required");
  const point: number[] = [0, 0, 0];
  const tangent: number[] = [0, 0, 0];
  if (curve.type === "analyticOval") {
    if (curve.phaseUnit !== "turn" || parameter > 1)
      throw new Error("An analytic oval uses one turn");
    if (
      ![curve.center, curve.u, curve.v].every(
        (v: Readonly<AutoMovieVector3Tuple>): boolean =>
          v.length === 3 && v.every(Number.isFinite),
      ) ||
      ![curve.radiusU, curve.radiusV].every(Number.isFinite) ||
      curve.radiusU <= 0 ||
      curve.radiusV <= 0 ||
      curve.closed !== true
    )
      throw new Error("Invalid analytic oval");
    const dot: (
      a: Readonly<AutoMovieVector3Tuple>,
      b: Readonly<AutoMovieVector3Tuple>,
    ) => number = (
      a: Readonly<AutoMovieVector3Tuple>,
      b: Readonly<AutoMovieVector3Tuple>,
    ): number =>
      a.reduce((s: number, x: number, k: number): number => s + x * b[k]!, 0);
    if (
      Math.abs(dot(curve.u, curve.u) - 1) > 64 * Number.EPSILON ||
      Math.abs(dot(curve.v, curve.v) - 1) > 64 * Number.EPSILON ||
      Math.abs(dot(curve.u, curve.v)) > 64 * Number.EPSILON
    )
      throw new Error("Orthonormal oval axes required");
    const angle: number = 2 * Math.PI * parameter;
    for (let k: number = 0; k < 3; k++) {
      point[k] =
        curve.center[k]! +
        curve.radiusU * Math.cos(angle) * curve.u[k]! +
        curve.radiusV * Math.sin(angle) * curve.v[k]!;
      tangent[k] =
        2 *
        Math.PI *
        (-curve.radiusU * Math.sin(angle) * curve.u[k]! +
          curve.radiusV * Math.cos(angle) * curve.v[k]!);
    }
  } else {
    if (curve.type !== "cubicBezier" && curve.type !== "bernstein")
      throw new Error("Unknown actual primitive");
    const pieces: readonly IAutoMovieBernsteinCurvePiece64[] =
      curve.type === "cubicBezier"
        ? curve.spans.map(
            (
              s: AutoMovieCubicBezierControls3,
            ): IAutoMovieBernsteinCurvePiece64 => {
              if (s.length !== 4) throw new Error("Cubic degree mismatch");
              return { primitive: "polynomialBezier", degree: 3, controls: s };
            },
          )
        : curve.pieces;
    const cumulative: number[] = [0];
    for (const width of curve.phaseIntervals)
      cumulative.push(cumulative.at(-1)! + width);
    const total: number = cumulative.at(-1)!;
    if (
      pieces.length === 0 ||
      cumulative.length !== pieces.length + 1 ||
      !Number.isFinite(total) ||
      parameter > total ||
      curve.phaseIntervals.some(
        (w: number, i: number): boolean =>
          !Number.isFinite(w) || w <= 0 || cumulative[i + 1]! <= cumulative[i]!,
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
    const evaluated: IAutoMovieEvaluateBernstein64.IResult =
      evaluateAutoMovieBernstein64(pieces[index]!, t);
    for (let k: number = 0; k < 3; k++) {
      point[k] = evaluated.point[k]!;
      tangent[k] = evaluated.derivative[k]! / width;
      if (evaluated.derivative[k] !== 0 && tangent[k] === 0)
        throw new Error("Unresolved physical parameter derivative underflow");
    }
  }
  if (![...point, ...tangent].every(Number.isFinite))
    throw new Error("Unresolved curve evaluation");
  return {
    point: point as unknown as Readonly<AutoMovieVector3Tuple>,
    tangentPerParameter: tangent as unknown as Readonly<AutoMovieVector3Tuple>,
  };
}
