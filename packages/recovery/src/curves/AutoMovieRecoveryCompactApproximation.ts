import { AutoMovieEngineBernstein64 as B } from "@automovie/engine";
import {
  type AutoMovieVector2Tuple,
  type IAutoMovieCompactCurveApproximation,
  type IAutoMoviePiecewisePlanarCurveSource,
  type IAutoMovieRegisteredPlanarCurvePiece,
} from "@automovie/interface";

import { AutoMovieRecoveryConicApproximation as Conic } from "./AutoMovieRecoveryConicApproximation";
import { approximateRecoveryCompactCurves as approximateRecoveryCompactCurvesImplementation } from "./internal/approximateRecoveryCompactCurves";

/** Fits compact planar coefficient pieces to a registered source chart. */
export namespace AutoMovieRecoveryCompactApproximation {
  /**
   * Evaluates one saved planar piece at its normalized parameter in [0, 1]. The
   * coordinates use the piece's planar millimetre frame.
   */
  export function evaluate(
    piece: IAutoMovieRegisteredPlanarCurvePiece,
    u: number,
  ): Readonly<AutoMovieVector2Tuple> {
    if (piece.kind === "conic") return Conic.evaluate(piece, u);
    return [
      B.scalar(
        piece.controls.map(
          (p: Readonly<AutoMovieVector2Tuple>): number => p[0],
        ),
        u,
      ),
      B.scalar(
        piece.controls.map(
          (p: Readonly<AutoMovieVector2Tuple>): number => p[1],
        ),
        u,
      ),
    ];
  }

  /**
   * Counts the planar scalar representation in saved piece order. Each piece
   * adds its control coordinates and three metadata scalars. Exact shared
   * adjacent endpoints count once.
   */
  export function storedScalars(
    pieces: readonly IAutoMovieRegisteredPlanarCurvePiece[],
  ): number {
    let total: number = 0;
    let previous: Readonly<AutoMovieVector2Tuple> | undefined;
    for (const piece of pieces) {
      total += 2 * piece.controls.length + 3;
      const first: Readonly<AutoMovieVector2Tuple> = piece.controls[0]!;
      if (
        previous !== undefined &&
        previous[0] === first[0] &&
        previous[1] === first[1]
      )
        total -= 2;
      previous = piece.controls.at(-1)!;
    }
    return total;
  }

  /**
   * Fits a chart with tangent-constrained cubic through quintic Bernstein
   * pieces.
   *
   * Enable conic candidates through the supplied options. The fitter selects a
   * compact result using the configured tolerance and query and piece budgets.
   * Source knots guide samples and chart coverage. Independent held-out samples
   * qualify point correspondence in millimetres. A complete result establishes
   * the sampled criterion on the admitted charts.
   */
  export function approximate(
    curve: IAutoMoviePiecewisePlanarCurveSource,
    options: IAutoMovieCompactCurveApproximation.IOptions,
  ): IAutoMovieCompactCurveApproximation.IResult {
    return approximateRecoveryCompactCurvesImplementation(curve, options);
  }
}
