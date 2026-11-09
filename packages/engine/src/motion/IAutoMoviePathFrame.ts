import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The path frame at one baked keyframe time: where the root sits on the path
 * and which way it faces, the per-time data a later pass (a camera follow, a
 * foot-planting pass) consumes without re-deriving the path math.
 * Position is the path baseline before the gait's rotated root bob is added;
 * yaw and tangent describe the corner-blended facing, not the geometric
 * derivative of that bob or of the unsmoothed waypoint polyline.
 *
 * @evidence contracts/development/design.md#principled-representation Records one arc-length path sample and its corner-blended yaw, with a horizontal unit tangent reconstructed from that same yaw so downstream facing data cannot diverge within the frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Baseline placement facts accompany the baked clip without duplicating gait joints or root bob, which remain in motion keyframes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tangent is explicitly facing data rather than an unmeasured path velocity; world height comes from the supplied ground source for every waypoint sequence.
 * @evidence contracts/development/common.md#meaningful-documentation Gives local seconds, world coordinates, degree axis convention and the distinction between baseline facing and actual root velocity.
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
