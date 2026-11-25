import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMoviePlanarHermiteKnot } from "./IAutoMoviePlanarHermiteKnot";
import type { IAutoMovieScalarHermiteKnot } from "./IAutoMovieScalarHermiteKnot";

/**
 * Mesh slicing and Hermite reduction records used to author construction
 * profiles.
 *
 * Sections use the supplied mesh frame in millimetres; scalar runs keep their
 * supplied station and value units, and loop tangents differentiate chord
 * length. Mesh indexing, finite samples and orthonormal frames are caller
 * premises; outline flags broken cuts, reducers check minimum sample counts,
 * and profileCurve checks station order and loop size.
 */
export namespace IAutoMovieMeshExtract {
  /** One extreme point of a section along an in-plane direction. */
  export interface IExtreme {
    /**
     * Extreme crossing in the input mesh's frame, in millimetres; several
     * extreme directions may share the same returned point tuple.
     */
    point: AutoMovieVector3Tuple;

    /** Its reach along the direction from the station's axis point, millimetres. */
    reach: number;
  }

  /**
   * Greedily reduced value-and-slope knots that hold a dense run within the
   * tolerance. Every sample starts as a knot with its central-difference slope;
   * knots are then removed one at a time, always the one whose removal deviates
   * least, while that deviation stays within the tolerance. On each removal the
   * two neighbouring knots' slopes are refitted by least squares to the dense
   * samples of the three spans they shape (knot removal with a least-squares
   * approximation, Lyche and Morken, Knot removal for parametric B-spline
   * curves and surfaces, CAGD 4, 1987), so facet noise in the samples does not
   * enter the slopes, and the deviation is the largest over those spans'
   * samples. Knot values stay the samples' own.
   *
   * Never removed: the ends, the pinned indices, and the prominent features: a
   * local extremum whose topographic prominence exceeds twice the tolerance
   * (its slope is held at zero, so the curve's extremum is the sample's), and
   * an inflection (sign change of the divided second difference) between two
   * bends whose sagittas exceed twice the tolerance after the weaker wiggles
   * merge away. Twice the tolerance is the noise threshold because a curve
   * through the middle of a bump that high stays within the tolerance of both
   * its top and its foot without a knot of its own.
   *
   * The reducer borrows its inputs and returns mutable copies. Increasing
   * finite stations, finite values and a meaningful nonnegative tolerance
   * remain caller premises; only the retained sample count is checked. Greedy
   * removal does not prove a globally minimal knot count.
   */
  export type IReduceResult = {
    /**
     * New mutable knots in retained input order, with at least both endpoints;
     * index still addresses the original dense array including excluded
     * samples.
     */
    knots: IAutoMovieScalarHermiteKnot[];

    /**
     * Largest absolute scalar residual at retained dense stations, in the input
     * value unit; excluded samples and between-sample extrema are not
     * measured.
     */
    error: number;
  };

  /**
   * The loop variant for top silhouettes and section loops: the dense closed
   * loop is parameterised by cumulative chord length, every point starts as a
   * knot with its periodic central-difference tangent, and knots are removed as
   * in `AutoMovieMeshExtract.reduce`, the deviation being the Euclidean
   * distance of a dense point from its span and both tangent components
   * refitted. Never removed: the extremes along both axes (their axis component
   * of tangent held at zero, so the curve's extreme is the sample's), the
   * pinned indices and the prominent inflections (sign changes of the turn
   * between bends whose sagittas exceed twice the tolerance after the weaker
   * facet wiggles merge away); at least four knots remain.
   *
   * The result owns its knot records and point/tangent tuples. Finite
   * coordinates, nonzero consecutive retained chords and a meaningful
   * nonnegative tolerance are caller premises; only the minimum retained sample
   * count is checked.
   */
  export type IReduceLoopResult = {
    /**
     * New mutable periodic Hermite knots in input loop order, at least four;
     * point and tangent tuples are copied and the closing point is not
     * repeated.
     */
    knots: IAutoMoviePlanarHermiteKnot[];

    /**
     * Sum of the retained dense loop's chord lengths including closure, in its
     * coordinate unit; this is the Hermite period, not fitted-curve arc
     * length.
     */
    length: number;

    /**
     * Largest Euclidean residual at retained dense chord parameters, in the
     * coordinate unit; this is neither a closest-point distance nor a
     * continuous Hausdorff certificate.
     */
    error: number;
  };
}
