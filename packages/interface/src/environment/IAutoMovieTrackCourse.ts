import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A spatial course shared by rails, carriers and performer contacts.
 *
 * @evidence contracts/development/design.md#principled-representation Keeps spatial input separate from film timing and exposes admitted distances in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared spatial course serves every vehicle and timing schedule on the same waypoints.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A course approximates spline arc length from sampled chords; it is neither a physical track design nor a ride simulation.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the coordinate and timing responsibilities and the distance approximation.
 */
export namespace IAutoMovieTrackCourse {
  /**
   * Waypoints and optional banking for a rotation-minimizing spatial course.
   *
   * @evidence contracts/development/design.md#principled-representation A centripetal spline passes through the authored points. Banks are interpolated between them and added to transported frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Points, optional one bank per point and an optional starting lateral direction specify all spatial degrees of freedom.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed paths implicitly return to the first point. Repeated neighbors, malformed banking and a parallel starting lateral direction are refused during course preparation.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies input units, default orientation and bank, and how the closing waypoint is formed.
   */
  export interface IInput {
    /** Ordered XYZ waypoints in local metres, at least two for open or three for closed courses. */
    points: readonly IAutoMovieVector3[];
    /** Connect the last waypoint to the first, without repeating it in the input. Defaults to false. */
    closed?: boolean;
    /** Optional bank in degrees about the forward tangent at each waypoint. Adjacent angles differ by at most 180 degrees, including the closing span. */
    banks?: readonly number[];
    /** Optional initial +X direction, projected normal to the tangent. Otherwise start as upright as the tangent permits. */
    lateral?: IAutoMovieVector3;
  }

  /**
   * Course evaluated in the authored local frame.
   *
   * @evidence contracts/development/design.md#principled-representation Stations are strictly increasing sampled chord sums. Each station lies on the same spline used for distance queries.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The retained station table supplies both track mesh samples and the carrier's distance clock without another sampling pass.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The station table does not assert exact spline arc length. The evaluator refuses nonfinite distances and values beyond the prepared interval.
   * @evidence contracts/development/common.md#meaningful-documentation States the distance approximation, closure flag and frame axes.
   */
  export interface IPrepared {
    /** Course distances in local metres, starting at 0 and ending at the approximate length. */
    readonly stations: readonly number[];
    /** Approximate course length in metres, the final station. */
    readonly length: number;
    /** Whether the terminal position and orientation join the start. */
    readonly closed: boolean;

    /**
     * Sample the local rigid frame with +Z forward and +Y above the track.
     *
     * @param distance Metres along the course, inclusive of both ends.
     * @returns The posed frame at the distance.
     * @throws When distance is nonfinite or outside the prepared range.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Identifies the distance range and frame and the query refusal.
     */
    frame(distance: number): IAutoMovieTransform;
  }
}
