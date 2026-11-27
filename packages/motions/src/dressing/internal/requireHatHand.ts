import type { AutoMovieHumanSide } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Admit an unoccupied hand for a hat gesture.
 * Parameter side: The selected hand.
 * Parameter held: Its held prop, if any.
 * When the hand is carrying a prop.
 */
export function requireHatHand(
  side: AutoMovieHumanSide,
  held: string | undefined,
): void {
  if (held !== undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "hand",
      value: side,
      reason: `The ${side} hand already holds ${held}`,
      fix: "free the hand or choose the other hand",
    });
}
