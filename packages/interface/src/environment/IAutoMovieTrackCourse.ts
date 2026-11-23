import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** A spatial course shared by rails, carriers and performer contacts. */
export namespace IAutoMovieTrackCourse {
  /** Waypoints and optional banking for a rotation-minimizing spatial course. */
  export interface IInput {
    /**
     * Ordered XYZ waypoints in local metres, at least two for open or three for
     * closed courses.
     */
    points: readonly IAutoMovieVector3[];
    /**
     * Connect the last waypoint to the first, without repeating it in the
     * input. Defaults to false.
     */
    closed?: boolean;
    /**
     * Optional bank in degrees about the forward tangent at each waypoint.
     * Adjacent angles differ by at most 180 degrees, including the closing
     * span.
     */
    banks?: readonly number[];
    /**
     * Optional initial +X direction, projected normal to the tangent. Otherwise
     * start as upright as the tangent permits.
     */
    lateral?: IAutoMovieVector3;
  }

  /** Course evaluated in the authored local frame. */
  export interface IPrepared {
    /**
     * Course distances in local metres, starting at 0 and ending at the
     * approximate length.
     */
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
     */
    frame(distance: number): IAutoMovieTransform;
  }
}
