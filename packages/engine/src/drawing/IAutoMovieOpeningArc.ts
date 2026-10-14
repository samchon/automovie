import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * The circle one bulged opening edge runs on, in the profile's planar frame.
 *
 * Produced by `autoMovieOpeningArc`. The arc starts at the edge's `from` point,
 * at angle `start` about `center`, and turns by the signed `sweep` to reach
 * the edge's `to` point; a negative sweep runs clockwise.
 *
 * @evidence contracts/common.md#principled-implementation Centre, radius, start angle and signed sweep are the standard parametrization of a circular arc, from which both chord points and the circular-segment area follow in closed form.
 * @evidence contracts/common.md#clear-and-simple-design The four numbers the drafted outline and the exact area both need, so the conversion from a bulge happens once in `autoMovieOpeningArc`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no special case; a straight edge has no arc record at all rather than a sentinel radius.
 * @evidence contracts/common.md#meaningful-documentation The comment states the producer, the frame, how start and sweep reach the edge's two ends, the sweep's sign convention and formula, its validated bound and the radius's sign.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A four-field arc record that computes nothing; `autoMovieOpeningArc` states the cost of producing it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A value record produced per edge; there is no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds four numbers and owns no handle or task.
 * @author Samchon
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
