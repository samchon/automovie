import type { AutoMovieCubicBezierControls3 } from "./AutoMovieCubicBezierControls3";
import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Chord-length views and source restrictions used by closed contour lofts. */
export namespace IAutoMovieContourLoftCurves64 {
  /**
   * Chord-length chart of a cyclic polygon in millimetres. It borrows the point
   * array and stores its own cumulative lengths, including closure.
   */
  export interface Curve {
    /**
     * Ordered closed polygon samples in millimetres; the caller keeps them
     * stable during evaluation.
     */
    points: AutoMovieVector3Tuple[];

    /** Chord-length prefixes, including zero and the closing edge's final total. */
    cumulative: number[];

    /** Complete closed chord length in millimetres. */
    length: number;
  }

  /**
   * An evaluated source point with its inherited phase and optional outgoing
   * restriction for the next sample.
   */
  export interface Knot {
    /** Source-evaluated point in millimetres. */
    p: AutoMovieVector3Tuple;

    /** Inherited parameter in the primitive's declared phase chart. */
    phase: number;

    /**
     * Retained outgoing positive-orientation source restriction; absent for an
     * unsupported diagnostic knot.
     */
    leaf?: IAutoMovieContourLoftCurves64.Leaf;
  }

  /**
   * One Bernstein restriction on an increasing source phase interval. A compact
   * leaf keeps its original cubic and half path. Materialization caches the
   * restricted coefficients on the same leaf.
   */
  export interface Leaf {
    /**
     * Materialized positive source restriction; absent until needed for a
     * compact half-path leaf.
     */
    net?: AutoMovieVector3Tuple[];
    /** Immutable original cubic authority for lazy materialization. */
    original?: AutoMovieCubicBezierControls3;
    /** Binary half choices read high bit first with leading zeros to depth. */
    path?: number;
    /** Inclusive source phase at this restriction's start. */
    start: number;
    /**
     * Inclusive source phase at the end before constant intervals are removed
     * from cyclic sampling.
     */
    end: number;
    /**
     * Number of inherited subdivision steps. Compact paths support at most 30
     * steps. An explicit already qualified restriction can be deeper.
     */
    depth: number;
  }
}
