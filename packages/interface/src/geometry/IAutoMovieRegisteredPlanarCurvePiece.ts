import type { AutoMovieVector2Tuple } from "./AutoMovieVector2Tuple";
import type { IAutoMovieRegisteredConicArc } from "./IAutoMovieRegisteredConicArc";

/**
 * Read a planar curve from saved polynomial or bitangent conic coefficients.
 *
 * Both variants register a source interval `[a, b]`. The polynomial maps a
 * source parameter `t` to `u = (t - a) / (b - a)`. The conic uses its own
 * normalized parameter `u`, which can travel along the interval at a different
 * speed.
 */
export type IAutoMovieRegisteredPlanarCurvePiece =
  | IAutoMovieRegisteredPlanarCurvePiece.IPolynomial
  | IAutoMovieRegisteredPlanarCurvePiece.IConic;

/** Saved variants selected by `kind`. */
export namespace IAutoMovieRegisteredPlanarCurvePiece {
  /** Polynomial Bernstein coefficients with affine source registration. */
  export interface IPolynomial {
    /** Selects polynomial evaluation. */
    kind: "polynomial";

    /** Number of Bernstein controls minus one. */
    degree: 3 | 4 | 5;

    /** Ordered source interval in the source callback's parameter unit. */
    domain: readonly [number, number];

    /** `degree + 1` Bernstein controls in source-plane millimetres. */
    controls: readonly Readonly<AutoMovieVector2Tuple>[];

    /** Largest observed fitting or held-out sample discrepancy in millimetres. */
    maximumSampleErrorMm: number;
  }

  /** A positive-weight quadratic conic with its own local parameter speed. */
  export interface IConic extends IAutoMovieRegisteredConicArc {
    /** Selects rational conic evaluation. */
    kind: "conic";
  }
}
