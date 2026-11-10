import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { minimumJerk } from "./minimumJerk";

/**
 * Warp a motion's root so it arrives at a different place and heading by a
 * named instant, leaving the motion's own shape intact.
 *
 * Motion warping (Witkin and Popović, SIGGRAPH 1995) adds a smooth
 * displacement map to a clip so it meets new keyframe constraints; Unreal's
 * Motion Warping applies the same idea to the root over a warping window
 * ending at a notify. Here the displacement (`translation`, metres, and
 * `yaw`, degrees about +Y) is spread over `[start, end]` seconds by the
 * minimum-jerk profile, so the warp adds no velocity or acceleration
 * discontinuity at either end of the window; before the window the root is
 * the source's, after it the full displacement holds. The yaw turns the root
 * about +Y in the parent frame before the translation is added.
 *
 * @param root The source root at the instant.
 * @param warp The displacement and its window.
 * @param seconds The instant.
 * @returns The warped root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cites the method, states the window profile, the before and after behaviour and the order of yaw and translation.
 * @evidence contracts/development/implementation.md#principled-implementation A displacement map blended by the minimum-jerk profile (Witkin and Popović 1995; Unreal Motion Warping).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One profile read and one composition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A window that does not move forward throws.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function warpRoot(
  root: IAutoMovieTransform,
  warp: warpRoot.IWarp,
  seconds: number,
): IAutoMovieTransform {
  if (!(warp.end > warp.start))
    throw new Error("A root warp window moves forward");
  const s: number = minimumJerk(
    (seconds - warp.start) / (warp.end - warp.start),
  ).s;
  return {
    translation: {
      x: root.translation.x + warp.translation.x * s,
      y: root.translation.y + warp.translation.y * s,
      z: root.translation.z + warp.translation.z * s,
    },
    rotation: Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, warp.yaw * s),
        root.rotation,
      ),
    ),
    scale: root.scale,
  };
}

/**
 * Companion types of {@link warpRoot}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit.
 * @evidence contracts/development/design.md#principled-representation A displacement in metres and degrees with a window in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the warp reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
 */
export namespace warpRoot {
  /** A root displacement over a window. */
  export interface IWarp {
    /** Translation added by the window's end, metres, parent frame. */
    translation: IAutoMovieVector3;

    /** Turn about +Y added by the window's end, degrees. */
    yaw: number;

    /** Window start, seconds. */
    start: number;

    /** Window end, the named event's instant, seconds. */
    end: number;
  }
}
