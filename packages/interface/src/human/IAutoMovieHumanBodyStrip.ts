import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Appendage/base endpoint jets and arclength derivatives used to bridge a skin
 * strip. Runtime construction and admission remain with AutoMovieHumanBodyStrip
 * in Human.
 */
export namespace IAutoMovieHumanBodyStrip {
  /** Both edges of one column: points and outward arc-length derivatives. */
  export interface IColumn {
    /** Appendage end point. */
    A: AutoMovieVector3Tuple;

    /** Appendage's unit tangent leaving its end, into the strip. */
    a1: AutoMovieVector3Tuple;

    /** Appendage's curvature vector there. */
    a2: AutoMovieVector3Tuple;

    /** Base point on the root loop. */
    C: AutoMovieVector3Tuple;

    /** Base's unit tangent across the loop, away from the hole. */
    c1: AutoMovieVector3Tuple;

    /** Base's curvature vector there. */
    c2: AutoMovieVector3Tuple;

    /** Edge length: the reach times the chord between the edges, mm. */
    l: number;
  }

  /**
   * First and second arclength derivatives across a chain at the requested
   * chart point, in the chain's world frame. The first is dimensionless; the
   * second has inverse-millimetre units. The owning operation uses the
   * available chain jet or its documented finite-difference estimate.
   */
  export type AcrossResult = [AutoMovieVector3Tuple, AutoMovieVector3Tuple];
}
