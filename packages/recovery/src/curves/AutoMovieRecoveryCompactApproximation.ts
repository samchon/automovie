import { approximateRecoveryCompactCurves as approximateRecoveryCompactCurvesImplementation } from "./internal/approximateRecoveryCompactCurves";

import { AutoMovieEngineBernstein64 as B } from "@automovie/engine";
import { type AutoMovieVector2Tuple, type IAutoMovieRegisteredPlanarCurvePiece, type IAutoMovieCompactCurveApproximation, type IAutoMoviePiecewisePlanarCurveSource } from "@automovie/interface";

import { AutoMovieRecoveryConicApproximation as Conic } from "./AutoMovieRecoveryConicApproximation";

/** Planar coefficient-reduction experiment, independent of source meshes. */
export namespace AutoMovieRecoveryCompactApproximation {
  /** Evaluate only saved coefficients at the piece's own normalized parameter. */
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
   * Count the actual planar numeric representation, including chart metadata.
   * Adjacent equal endpoints are counted once; corners may share position.
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
   * Refit whole smooth charts with storage-selected degree-three to degree-five
   * Bernstein pieces and optional positive bitangent conics. Old source knots
   * inform observation coverage but do not force output pieces.
   *
   * This is a degree-bounded adaptation of Schneider's endpoint-tangent fitting
   * and adaptive subdivision (Graphics Gems, 1990), not a reproduction of a
   * global minimum-control theorem. The existing engine's original-design Jacobi
   * SVD replaces two-handle normal equations and extends the interior controls:
   * https://github.com/erich666/GraphicsGems/blob/master/gems/FitCurves.c
   * https://www.netlib.org/lapack/lapack_routine/dgesvj.f
   *
   * Every polynomial fixes endpoint positions and forward tangent directions.
   * Trapezoid-weighted fitting nodes and distinct held-out quarter nodes inspect
   * every supplied source knot interval. Polynomial paired-point distances give
   * bidirectional geometric witnesses at those nodes, not a continuous bound.
   * Conics additionally use independent source-apex radial correspondences in
   * both directions. Finite samples cannot certify missed features, embedding,
   * Hausdorff error or likeness. No source observation is retained in the
   * result.
   */
  export function approximate(curve: IAutoMoviePiecewisePlanarCurveSource, options: IAutoMovieCompactCurveApproximation.IOptions): IAutoMovieCompactCurveApproximation.IResult {
    return approximateRecoveryCompactCurvesImplementation(curve, options);
  }
}
