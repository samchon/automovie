import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanPosture } from "@automovie/interface";

import { HumanHand } from "../posture/HumanHand";

/**
 * Straighten each hand's digits as it travels to its resting surface in a
 * sit. Each side has its own progress because an armrest is reached before
 * an unassisted hand reaches its thigh. This remains an interim pre-shape
 * blend (Jeannerod 1984), not a digit-to-surface contact solve.
 *
 * @param posture The body's posture before hand shaping.
 * @param progress Each hand's transport progress, in [0, 1].
 * @returns The posture with its digit angles blended toward flat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the separate sides' progress and the remaining contact-solve limitation.
 * @evidence contracts/development/implementation.md#principled-implementation Linear joint-space preshaping on each hand's already eased transport progress, from its current angles toward HumanHand's flat shape.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over each hand's shape entries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing preshape blend and openly states that it does not solve contact.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed set of hand joints with no algorithm to choose.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanHand.shape rather than defining another flat shape.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function retaining no resources.
 */
export function sitHands(
  posture: IAutoMovieMotionHumanPosture,
  progress: (side: "left" | "right") => number,
): IAutoMovieMotionHumanPosture {
  const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };
  for (const side of ["left", "right"] as const) {
    const s: number = progress(side);
    for (const [bone, flat] of Object.entries(
      HumanHand.shape(side, "flat"),
    ) as [AutoMovieHumanoidBone, readonly [number, number, number]][]) {
      const was: readonly [number, number, number] = posture.joints[bone] ?? [
        0, 0, 0,
      ];
      joints[bone] = [
        was[0] + (flat[0] - was[0]) * s,
        was[1] + (flat[1] - was[1]) * s,
        was[2] + (flat[2] - was[2]) * s,
      ];
    }
  }
  return { ...posture, joints };
}
