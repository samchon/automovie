import type {
  IAutoMovieTransform,
  IAutoMovieWarpRoot,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { minimumJerk as minimumJerkImplementation } from "./minimumJerk";

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
export function warpRoot(
  root: IAutoMovieTransform,
  warp: IAutoMovieWarpRoot.IWarp,
  seconds: number,
): IAutoMovieTransform {
  if (!(warp.end > warp.start))
    throw new Error("A root warp window moves forward");
  const s: number = minimumJerkImplementation.share(
    (seconds - warp.start) / (warp.end - warp.start),
  );
  return {
    translation: {
      x: root.translation.x + warp.translation.x * s,
      y: root.translation.y + warp.translation.y * s,
      z: root.translation.z + warp.translation.z * s,
    },
    rotation: Quaternion.normalize(
      Quaternion.multiply(yawRotation(warp.yaw * s), root.rotation),
    ),
    scale: root.scale,
  };
}

/** Rotations about the fixed world-up axis. */
const yawRotation: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });
