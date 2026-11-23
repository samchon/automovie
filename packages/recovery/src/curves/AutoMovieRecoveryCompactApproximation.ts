import { AutoMovieBernstein64 as B } from "@automovie/engine";
import type {
  AutoMovieVector2Tuple,
  IAutoMovieRegisteredPlanarCurvePiece,
} from "@automovie/interface";

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
}
