import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanRingCurve } from "../junction/AutoMovieHumanRingCurve";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";

/**
 * Rounds of the iteration that solves the control points of the curve through the row. The stencil (1, 4, 1) / 6 has eigenvalues from 1/3 to 1, so each round leaves at most two thirds of the error and 50 rounds under 1e-8 of it.
 */
const ROUNDS: number = 50;

/**
 * Girth of the limit surface along one closed row of a regular cage, from the points the row's limit passes through.
 *
 * Where every vertex has valence four, the limit surface along a row of control points is a closed uniform cubic B-spline (Stam 1998, SIGGRAPH '98, pp. 395-404), and a cage fitted to its targets passes through each of them at its own vertex, so that curve is the closed cubic B-spline interpolating the targets in row order. Its control points solve `(c[k-1] + 4 c[k] + c[k+1]) / 6 = p[k]`, and its length is measured on `AutoMovieHumanRingCurve.SPAN_SAMPLES` points per span. Next to an extraordinary vertex the row is not exactly this curve, an approximation there.
 *
 * @param points The row's limit points in order around it, millimetres
 * @returns Girth, millimetres
 */
export function measureAutoMovieHumanLimbRow(points: IAutoMovieVector3[]): number {
  const n: number = points.length;
  let control: IAutoMovieVector3[] = points.map(
    (p: IAutoMovieVector3): IAutoMovieVector3 => ({ ...p }),
  );
  for (let round: number = 0; round < ROUNDS; ++round)
    control = control.map(
      (c: IAutoMovieVector3, k: number): IAutoMovieVector3 =>
        AutoMovieHumanVector.offset(
          c,
          [points[k]!, 1],
          [control[(k + n - 1) % n]!, -1 / 6],
          [c, -4 / 6],
          [control[(k + 1) % n]!, -1 / 6],
        ),
    );
  return AutoMovieHumanRingCurve.perimeter(AutoMovieHumanRingCurve.spline(control));
}
