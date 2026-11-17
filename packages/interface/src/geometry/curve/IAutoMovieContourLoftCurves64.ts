import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { AutoMovieCubicBezierControls3 } from "./AutoMovieCubicBezierControls3";

/**
 * Data and callback contracts shared by the ContourLoftCurves64 operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Millimetre polygon arclength charts, evaluated source phases and exact Bernstein restrictions remain distinct records. Optional materialized nets and lazy original/path data describe existing representations; their consistency is a numerical-owner premise, not a fitted mesh substitute.
 * @evidence contracts/development/design.md#principled-representation Millimetre polygon arclength charts, evaluated source phases and exact Bernstein restrictions remain distinct records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieContourLoftCurves64 exchanges these records with contour sampling and interaction refinement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional materialized nets and lazy original/path data describe existing representations; their consistency is a numerical-owner premise, not a fitted mesh substitute.
 */
export namespace IAutoMovieContourLoftCurves64 {
  /**
   * A closed polygon's physical arclength chart, in millimetres.
   *
   * @evidence contracts/development/design.md#principled-representation This record preserves the closed polygon arclength or evaluated parameter chart consumed by the helper namespace.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Fields separate physical points from their cumulative or normalized parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This type performs no fitting or geometry validity certification.
   * @evidence contracts/development/common.md#meaningful-documentation States physical point units and parameter meaning.
   */
  export interface Curve {
    /** Ordered closed polygon samples in millimetres; the caller keeps them stable during evaluation. */
    points: AutoMovieVector3Tuple[];

    /** Chord-length prefixes, including zero and the closing edge's final total. */
    cumulative: number[];

    /** Complete closed chord length in millimetres. */
    length: number;
  }

  /**
   * An evaluated curve point and its inherited source phase, distinct from a control.
   *
   * @evidence contracts/development/design.md#principled-representation This record preserves the closed polygon arclength or evaluated parameter chart consumed by the helper namespace.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Fields separate physical points from their cumulative or normalized parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This type performs no fitting or geometry validity certification.
   * @evidence contracts/development/common.md#meaningful-documentation States physical point units and parameter meaning.
   */
  export interface Knot {
    /** Evaluated point in millimetres, distinct from an authored control. */
    p: AutoMovieVector3Tuple;

    /** Inherited parameter in the primitive's declared phase chart. */
    phase: number;

    /** Retained outgoing positive-orientation source restriction; absent for an unsupported diagnostic knot. */
    leaf?: IAutoMovieContourLoftCurves64.Leaf;
  }

  /**
   * An exact algebraic Bernstein restriction before binary64 rounding.
   *
   * @evidence contracts/development/design.md#principled-representation An immutable original span and recorded half path, or a materialized child net, preserve the generating restriction independently of its display chord.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One leaf is shared by initial sampling and interaction-driven refinement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This record is not a fitted control table or a source mesh witness.
   * @evidence contracts/development/common.md#meaningful-documentation Fields state source orientation, inherited phase and arithmetic scope.
   */
  export interface Leaf {
    /** Materialized positive source restriction; absent until needed for a compact half-path leaf. */
    net?: AutoMovieVector3Tuple[];
    /** Immutable original cubic authority for lazy materialization. */
    original?: AutoMovieCubicBezierControls3;
    /** Binary left/right half path from the original span, with length depth. */
    path?: number;
    /** Inherited source phase of its first control. */
    start: number;
    /** Inherited source phase of its last control, before any constant-interval quotient. */
    end: number;
    /** Subdivision depth; a compact original half path has exactly this many bits. */
    depth: number;
  }
}
