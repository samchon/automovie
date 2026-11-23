import type { AutoMovieVector3Tuple } from "../../index";

/**
 * Source edge/plane intersection retained only in private observation
 * extraction.
 */
export interface IAutoMovieMeshPlaneIntersection {
  /** Physical intersection on a source edge in the declared source frame. */
  p: AutoMovieVector3Tuple;

  /**
   * Ordered canonical connectivity labels of the original supporting edge;
   * representative positions need not reproduce p.
   */
  a: number;

  /**
   * Larger canonical connectivity label, retained privately without moving the
   * original supporting edge.
   */
  b: number;

  /**
   * Fraction along the original supporting source edge, oriented to match the
   * a/b labels; interpolating canonical representative positions can differ
   * from p.
   */
  t: number;

  /** Opt-in original emitted-edge aliases; absent on the original default path. */
  sourceEdges?: Array<{
    /** First original input vertex, not a canonical representative. */
    a: number;

    /** Second original input vertex; equality retains an on-plane vertex. */
    b: number;

    /** Dimensionless crossing fraction in this original edge direction. */
    t: number;

    /**
     * Actual original witness in registered mm, retained independently for
     * aliases.
     */
    pointMm: AutoMovieVector3Tuple;
  }>;
}
