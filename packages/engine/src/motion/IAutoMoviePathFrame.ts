import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The path frame at one baked keyframe time: where the root sits on the path
 * and which way it faces, the per-time data a later pass (a camera follow, a
 * foot-planting pass) consumes without re-deriving the path math.
 * Position is the path baseline before the gait's rotated root bob is added;
 * yaw and tangent describe the corner-blended facing, not the geometric
 * derivative of that bob or of the unsmoothed waypoint polyline.
 *
 * @evidence contracts/common.md#principled-implementation Records one arc-length path sample and its corner-blended yaw, with a horizontal unit tangent reconstructed from that same yaw so downstream facing data cannot diverge within the frame.
 * @evidence contracts/common.md#clear-and-simple-design Baseline placement facts accompany the baked clip without duplicating gait joints or root bob, which remain in motion keyframes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The tangent is explicitly facing data rather than an unmeasured path velocity; world height comes from the supplied ground source for every waypoint sequence.
 * @evidence contracts/common.md#meaningful-documentation Gives local seconds, world coordinates, degree axis convention and the distinction between baseline facing and actual root velocity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A path sample performs no polyline lookup or corner-window interpolation; followPathMotion owns both.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Downstream consumers may reuse recorded baseline facts at that time, while the type stores no interpolation cache across frames.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each output frame owns two vectors and scalar timing/facing values, bounded by the bake's emitted keyframe count.
 */
export interface IAutoMoviePathFrame {
  /** Seconds into the baked clip. */
  time: number;

  /** World path point: XZ on the polyline, `y` from the ground source. */
  position: IAutoMovieVector3;

  /** Facing about +Y in degrees (0 = +Z, +90 = +X), corner-blended. */
  yawDeg: number;

  /** Unit horizontal facing direction (`y` = 0), matching `yawDeg`. */
  tangent: IAutoMovieVector3;
}
