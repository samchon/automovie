import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { seatedFlatHand } from "./seatedFlatHand";

/**
 * Straighten each hand's digits as it travels to its resting surface in a sit.
 * Each side has its own progress because an armrest is reached before an
 * unassisted hand reaches its thigh. The digits go to the flat hand whose
 * thumb's metacarpal is turned clear of the palmar plane (`seatedFlatHand`),
 * the hand the thigh and armrest goals lay the palm of (`seatedHands`): the
 * plain flat shape holds the thumb past the palm, which drove it into the thigh
 * under the laid palm. This remains a pre-shape blend (Jeannerod 1984), not a
 * digit-to-surface contact solve.
 *
 * @param body The body, whose flat hands are solved once per side.
 * @param posture The body's posture before hand shaping.
 * @param progress Each hand's transport progress, in [0, 1].
 * @returns The posture with its digit angles blended toward the seated flat
 *   hand.
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
