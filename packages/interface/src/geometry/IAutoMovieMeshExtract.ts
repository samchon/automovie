import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMoviePlanarHermiteKnot } from "./IAutoMoviePlanarHermiteKnot";
import type { IAutoMovieScalarHermiteKnot } from "./IAutoMovieScalarHermiteKnot";

/**
 * Public result records for mesh sections and Hermite reduction. Sections use
 * supplied frame coordinates in millimetres, scalar runs keep the supplied
 * station and value units, and loop tangents differentiate chord length. Supply
 * finite samples, valid mesh indexing and orthonormal section frames.
 */
export namespace IAutoMovieMeshExtract {
  /**
   * One directional support crossing of a section. Its point uses the input
   * millimetre frame and its reach is a signed projection from the station
   * centre.
   */
  export interface IExtreme {
    /**
     * The selected crossing in the input millimetre frame. Several directions
     * can reference the same returned tuple.
     */
    point: AutoMovieVector3Tuple;

    /**
     * Signed millimetres from the station centre along the specified unit
     * direction.
     */
    reach: number;
  }

  /**
   * The retained knots and measured scalar error after greedy reduction of
   * dense finite samples.
   *
   * The dense run starts with one knot per included sample and
   * central-difference slopes. At each removal the least-deviation candidate
   * within tolerance is discarded. The two adjacent slopes are refitted by
   * least squares against the affected dense samples, while knot values stay on
   * the samples.
   *
   * Endpoints and pinned sample indices survive. The reducer also protects
   * extrema with prominence over twice the tolerance and inflections between
   * bends with sagittas above that threshold after weaker bends merge.
   * Protected extrema have slope zero. Supply increasing finite stations,
   * finite values and a finite nonnegative tolerance. The reducer checks that
   * at least two samples remain after exclusions.
   */
  export type IReduceResult = {
    /**
     * Owns copied retained knots in input order, including both endpoints. Each
     * knot index still addresses the original input.
     */
    knots: IAutoMovieScalarHermiteKnot[];

    /**
     * Largest absolute residual at the retained dense sample stations, in their
     * value unit. Excluded samples and between-station extrema are outside this
     * measurement.
     */
    error: number;
  };

  /**
   * Periodic Hermite knots, their closed chord parameter period and sampled
   * planar residual.
   *
   * Each dense sample starts with a periodic central-difference tangent. Greedy
   * removal refits both tangent components and measures Euclidean residual at
   * dense chord parameters. Axis extrema and pinned samples survive along with
   * inflections separating bends whose sagittas pass twice the tolerance after
   * weaker bends merge. At an axis extremum the tangent component along that
   * axis stays zero.
   *
   * Supply finite points, a finite nonnegative tolerance and nonzero chords
   * between successive included points. The reducer checks that at least four
   * samples remain after exclusions.
   */
  export type IReduceLoopResult = {
    /**
     * Owns points and tangent tuples in loop order, with at least four knots
     * and no repeated closing point.
     */
    knots: IAutoMoviePlanarHermiteKnot[];

    /**
     * Chord period of the retained dense loop, including the closing chord, in
     * the input coordinate unit.
     */
    length: number;

    /**
     * Largest Euclidean residual at retained dense chord parameters, in the
     * input coordinate unit.
     *
     * This residual measures the reconstructed curve at recorded chord
     * parameters. A continuous or closest-distance bound requires a different
     * measurement.
     */
    error: number;
  };
}
