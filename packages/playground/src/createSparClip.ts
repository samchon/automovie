import type {
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMovieTransform,
} from "@automovie/interface";

import { SPAR_MOMENTS } from "./SPAR_MOMENTS";

/**
 * Project one side of the authored shared sparring moments into a non-looping clip targeting the caller's skeleton. Times are seconds and joint angles are authored degrees; root motion is choreography, not an impact/contact simulation or a validated clinical motion.
 *
 * @evidence contracts/common.md#principled-implementation Both sides project the same ordered moments and final duration, retaining per-side roots and using the same identity root when a moment omits one; outgoing easing remains easeInOut.
 * @evidence contracts/common.md#clear-and-simple-design One projection serves red/blue clip wrappers while timeline choreography stays in its single authored owner and rendering stays with the sparring page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No hit, defence, joint-capacity or visual result is inferred from frame names. This producer does not validate ROM or collision, and supplied skeleton identity does not prove compatible bones.
 * @evidence contracts/common.md#meaningful-documentation The comment states units, non-looping projection, caller rig premise and choreography rather than simulated contact.
 * @evidence contracts/performance.md#efficient-algorithms One pass over m shared moments creates O(m) keyframe/pose wrappers; joint arrays and root transforms are borrowed rather than rebuilt, and engine sampling/rendering occurs later.
 * @evidence contracts/performance.md#reuse-equivalent-work Red/blue clips share one module timeline and duration so authored instants cannot drift through independent timing generation; each clip receives new outer/keyframe/pose wrappers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the clip wrappers, while module moments and the identity root remain page/module-lifetime data. Borrowed joint/root records must not be mutated by consumers; no worker, timer or GPU handle is acquired.
 *
 * @author Samchon
 */
export function createSparClip(
  skeleton: string,
  side: "red" | "blue",
): IAutoMovieMotion {
  return {
    id: "spar-" + side,
    skeleton,
    duration: SPAR_MOMENTS[SPAR_MOMENTS.length - 1]!.t,
    loop: false,
    keyframes: SPAR_MOMENTS.map(
      (moment: (typeof SPAR_MOMENTS)[number]): IAutoMovieKeyframe => ({
        time: moment.t,
        pose: {
          skeleton,
          joints: moment[side],
          root: moment[side === "red" ? "redRoot" : "blueRoot"] ?? upright,
        },
        expression: null,
        easing: "easeInOut",
        bezier: null,
      }),
    ),
  };
}

const upright: IAutoMovieTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};
