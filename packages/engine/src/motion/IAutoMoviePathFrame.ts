import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The path frame at one baked keyframe time: where the root sits on the path
 * and which way it faces, the per-time data a later pass (a camera follow, a
 * foot-planting pass) consumes without re-deriving the path math.
 *
 * @author Samchon
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
