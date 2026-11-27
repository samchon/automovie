import type { IAutoMoviePlanarPoint } from "../architecture/IAutoMoviePlanarPoint";

/**
 * The circle one bulged opening edge runs on, in the profile's planar frame.
 *
 * Produced by `openingArc`. The arc starts at the edge's `from` point,
 * at angle `start` about `center`, and turns by the signed `sweep` to reach the
 * edge's `to` point; a negative sweep runs clockwise.
 */
export interface IAutoMovieOpeningArc {
  /** Centre of the arc's circle, in profile-frame metres. */
  center: IAutoMoviePlanarPoint;

  /** Radius of the arc's circle, in metres; always positive. */
  radius: number;

  /** Angle of the edge's start point about the centre, in radians. */
  start: number;

  /**
   * Signed angle the arc turns through, in radians, `-4 atan(bulge)`.
   *
   * Its magnitude is at most a half turn because validation keeps every bulge
   * within `[-1, 1]`.
   */
  sweep: number;
}
