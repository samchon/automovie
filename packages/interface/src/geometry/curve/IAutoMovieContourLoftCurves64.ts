import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { AutoMovieCubicBezierControls3 } from "./AutoMovieCubicBezierControls3";

/** Data and callback contracts shared by the ContourLoftCurves64 operations. */
export namespace IAutoMovieContourLoftCurves64 {
  /** A closed polygon's physical arclength chart, in millimetres. */
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
   * An evaluated curve point and its inherited source phase, distinct from a
   * control.
   */
  export interface Knot {
    /** Evaluated point in millimetres, distinct from an authored control. */
    p: AutoMovieVector3Tuple;

    /** Inherited parameter in the primitive's declared phase chart. */
    phase: number;

    /**
     * Retained outgoing positive-orientation source restriction; absent for an
     * unsupported diagnostic knot.
     */
    leaf?: IAutoMovieContourLoftCurves64.Leaf;
  }

  /** An exact algebraic Bernstein restriction before binary64 rounding. */
  export interface Leaf {
    /**
     * Materialized positive source restriction; absent until needed for a
     * compact half-path leaf.
     */
    net?: AutoMovieVector3Tuple[];
    /** Immutable original cubic authority for lazy materialization. */
    original?: AutoMovieCubicBezierControls3;
    /** Binary left/right half path from the original span, with length depth. */
    path?: number;
    /** Inherited source phase of its first control. */
    start: number;
    /**
     * Inherited source phase of its last control, before any constant-interval
     * quotient.
     */
    end: number;
    /**
     * Subdivision depth; a compact original half path has exactly this many
     * bits.
     */
    depth: number;
  }
}
