import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The path frame at one baked keyframe time: where the root sits on the path
 * and which way it faces, the per-time data a later pass (a camera follow, a
 * foot-planting pass) consumes without re-deriving the path math. Position is
 * the path baseline before the gait's rotated root bob is added; yaw and
 * tangent describe the corner-blended facing, not the geometric derivative of
 * that bob or of the unsmoothed waypoint polyline.
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
