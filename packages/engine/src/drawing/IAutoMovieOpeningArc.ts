import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The circle one bulged opening edge runs on, in the profile's planar frame.
 *
 * Produced by `autoMovieOpeningArc`. The arc starts at the edge's `from` point,
 * at angle `start` about `center`, and turns by the signed `sweep` to reach
 * the edge's `to` point; a negative sweep runs clockwise.
 *
 * @evidence contracts/development/design.md#principled-representation Centre, radius, start angle and signed sweep are the standard parametrization of a circular arc, from which both chord points and the circular-segment area follow in closed form.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The four numbers the drafted outline and the exact area both need, so the conversion from a bulge happens once in `autoMovieOpeningArc`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no special case; a straight edge has no arc record at all rather than a sentinel radius.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the producer, the frame, how start and sweep reach the edge's two ends, the sweep's sign convention and formula, its validated bound and the radius's sign.
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
