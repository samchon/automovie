import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { seatedFlatHand } from "./seatedFlatHand";

/**
 * Straighten each hand's digits as it travels to its resting surface in a
 * sit. Each side has its own progress because an armrest is reached before
 * an unassisted hand reaches its thigh. The digits go to the flat hand whose
 * thumb's metacarpal is turned clear of the palmar plane
 * (`seatedFlatHand`), the hand the thigh and armrest goals lay the palm of
 * (`seatedHands`): the plain flat shape holds the thumb past the palm,
 * which drove it into the thigh under the laid palm. This remains a
 * pre-shape blend (Jeannerod 1984), not a digit-to-surface contact solve.
 *
 * @param body The body, whose flat hands are solved once per side.
 * @param posture The body's posture before hand shaping.
 * @param progress Each hand's transport progress, in [0, 1].
 * @returns The posture with its digit angles blended toward the seated flat hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the separate sides' progress, the target shape, why its thumb is turned and the remaining contact-solve limitation.
 * @evidence contracts/development/implementation.md#principled-implementation Joint-space preshaping on each hand's already eased transport progress, from its current angles toward the flat hand the seated goals assume, so the shape shown is the shape the palm was laid for.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One write per side through the seated flat hand's owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The thumb's clearance is the floor hand's own solve, not a tuned angle; no contact is claimed.
 * @evidence contracts/development/implementation.md#efficient-algorithms The thumb's turn is solved once per body and side (`seatedFlatHand`); each call writes two hands.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `seatedFlatHand`, the one seated flat hand the thigh and armrest goals use.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond `seatedFlatHand`'s weakly keyed cache.
 */
export function sitHands(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  progress: (side: AutoMovieHumanSide) => number,
): IAutoMovieMotionHumanPosture {
  let out: IAutoMovieMotionHumanPosture = posture;
  for (const side of SIDES)
    out = seatedFlatHand(body, out, side, progress(side));
  return out;
}

/** Both hands, left first. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
