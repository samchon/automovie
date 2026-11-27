import { locomoteMotion as locomoteMotionImplementation } from "./internal/locomoteMotion";

import { type IAutoMoviePathLocomotion, type IAutoMovieFollowPathMotion, type IAutoMovieMotion, type IAutoMovieVector3, type IAutoMovieQuaternion, type IAutoMovieTransform, type IAutoMovieWarpRoot } from "@automovie/interface";
import { followPathMotion as followPathMotionImplementation } from "./internal/followPathMotion";
import { timeScaleMotion as timeScaleMotionImplementation } from "./internal/timeScaleMotion";
import { travelMotion as travelMotionImplementation } from "./internal/travelMotion";
import { warpRoot as warpRootImplementation } from "./internal/warpRoot";

/** Public operations for Auto Movie Engine Motion Trajectory. */
export namespace AutoMovieEngineMotionTrajectory {
  /**
   * Bake an admitted in-place gait along an authored world XZ polyline, ignoring
   * waypoint Y and sampling height from optional ground. Whole cycles nearest
   * requested speed determine exact-arrival duration; yaw follows the tangent
   * with a shortest-arc corner blend, and gait root bob/sway rotates with
   * heading. Pathfinding is outside this operation.
   */
  export function followPathMotion(props: IAutoMovieFollowPathMotion.IProps): IAutoMoviePathLocomotion {
    return followPathMotionImplementation(props);
  }

  /**
   * Multiply an admitted clip's seconds clock by a positive finite factor.
   * Keyframe times, duration and optional stride period/phase scale together;
   * pose and expression values are borrowed and unchanged.
   */
  export function timeScaleMotion(clip: IAutoMovieMotion, k: number): IAutoMovieMotion {
    return timeScaleMotionImplementation(clip, k);
  }

  /**
   * Repeat an admitted in-place clip a positive safe-integer number of cycles and
   * add velocity times global seconds to its root. Velocity uses the receiving
   * motion's metre frame, not necessarily the final staged world frame; optional
   * facing rotates base root translation and orientation.
   */
  export function travelMotion(id: string, base: IAutoMovieMotion, cycles: number, velocity: IAutoMovieVector3, facing?: IAutoMovieQuaternion): IAutoMovieMotion {
    return travelMotionImplementation(id, base, cycles, velocity, facing);
  }

  /**
   * Warp a motion's root so it arrives at a different place and heading by a
   * named instant, leaving the motion's own shape intact.
   *
   * Motion warping (Witkin and Popović, SIGGRAPH 1995) adds a smooth displacement
   * map to a clip so it meets new keyframe constraints. Here the displacement
   * (`translation`, metres, and `yaw`, degrees about +Y) is spread over `[start,
   * end]` seconds by the minimum-jerk profile, so the warp adds no velocity or
   * acceleration discontinuity at either end of the window; before the window the
   * root is the source's, after it the full displacement holds. The yaw turns the
   * root about +Y in the parent frame before the translation is added.
   *
   * @param root The source root at the instant.
   * @param warp The displacement and its window.
   * @param seconds The instant.
   * @returns The warped root.
   */
  export function warpRoot(root: IAutoMovieTransform, warp: IAutoMovieWarpRoot.IWarp, seconds: number): IAutoMovieTransform {
    return warpRootImplementation(root, warp, seconds);
  }

  /**
   * Carry an admitted gait over a positive metre distance in a finite nonzero
   * direction at a requested positive speed. Whole cycles determine duration; a
   * trip shorter than half a nominal stride compresses one cycle, and optional
   * faceTravel aligns model +Z with the horizontal heading.
   */
  export function locomoteMotion(id: string, gait: IAutoMovieMotion, distance: number, speed: number, direction: IAutoMovieVector3, faceTravel?: boolean): IAutoMovieMotion {
    return locomoteMotionImplementation(id, gait, distance, speed, direction, faceTravel);
  }
}
