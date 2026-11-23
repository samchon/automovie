import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  AutoMovieBernsteinGrid64 as BernsteinGrid,
} from "@automovie/interface";

import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";

/**
 * Longitudinal Bernstein grids: four-row Hermite construction from endpoint
 * courses and complete derivative courses, outer-parameter evaluation and
 * outer-parameter differentiation.
 *
 * The inner (cross-course) coefficients of every row survive each operation, so
 * a grid value or derivative is a complete polynomial course rather than sparse
 * samples.
 */
export namespace AutoMovieBernsteinGrid64 {
  /**
   * Build four longitudinal rows from endpoint curves and full derivatives over
   * a physical chart length.
   */
  export function hermite(
    a: readonly AutoMovieVector3Tuple[],
    b: readonly AutoMovieVector3Tuple[],
    da: readonly AutoMovieVector3Tuple[],
    db: readonly AutoMovieVector3Tuple[],
    length: number,
  ): BernsteinGrid {
    const degree: number =
        Math.max(a.length, b.length, da.length, db.length) - 1,
      aa: AutoMovieBernsteinPolynomial64 = B.elevate(a, degree),
      bb: AutoMovieBernsteinPolynomial64 = B.elevate(b, degree);
    return [
      aa,
      B.add(aa, B.elevate(da, degree), length / 3),
      B.add(bb, B.elevate(db, degree), -length / 3),
      bb,
    ];
  }
  /**
   * Evaluate the outer grid parameter while retaining the complete cross-course
   * coefficients.
   */
  export function gridValue(
    g: BernsteinGrid,
    t: number,
  ): AutoMovieBernsteinPolynomial64 {
    return g[0]!.map(
      (_: AutoMovieVector3Tuple, i: number): AutoMovieVector3Tuple =>
        B.value(
          g.map(
            (p: AutoMovieBernsteinPolynomial64): AutoMovieVector3Tuple => p[i]!,
          ),
          t,
        ),
    );
  }
  /** Differentiate the outer grid parameter using the supplied physical scale. */
  export function gridTangent(
    g: BernsteinGrid,
    scale: number = 1,
  ): BernsteinGrid {
    return g
      .slice(1)
      .map(
        (
          p: AutoMovieBernsteinPolynomial64,
          i: number,
        ): AutoMovieBernsteinPolynomial64 =>
          B.scale(B.add(p, g[i]!, -1), (g.length - 1) * scale),
      );
  }
}
