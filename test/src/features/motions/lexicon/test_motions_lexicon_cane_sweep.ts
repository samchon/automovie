import type { AutoMovieHumanSide } from "@automovie/interface";
import {
  humanCaneSweepTouches
} from "../../../../../packages/motions/src/lexicon/internal/humanCaneSweepTouches";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanCaneSweep` law's own logic (`humanCaneSweepTouches`): each walk
 * landing within the cane pose puts the tip down opposite the landing foot (the
 * two-point touch), and between touches the tip crosses on a minimum-jerk
 * share, lifted at most `LIFT` (an inch).
 *
 * Scenarios:
 *
 * 1. Over a 2 s walk whose right foot lands at 1 s and left at 1.5 s, the tip
 *    touches left at 1 s and right at 1.5 s; halfway between it is on the
 *    midline lifted the whole inch, and before the first touch it rests on the
 *    left, `wide` out.
 * 2. Sliding (constant contact) it does not lift.
 * 3. A walk that lands no foot in the sweep is refused.
 */
export function test_motions_lexicon_cane_sweep(): void {
  const walk = (t: number): Record<AutoMovieHumanSide, boolean> => ({
    left: t < 0.6 || t >= 1.5,
    right: t < 0.6 || t >= 1,
  });
  const touches: humanCaneSweepTouches.ITouch[] = humanCaneSweepTouches(
    walk,
    2,
  );
  const middle: humanCaneSweepTouches.ITip = humanCaneSweepTouches.tip(
    touches,
    1.25,
    0.3,
    true,
  );
  TestValidator.predicate(
    "the touches and the lifted crossing",
    touches.length === 2 &&
      touches[0]!.side === "left" &&
      nclose(touches[0]!.at, 1, 1e-9) &&
      touches[1]!.side === "right" &&
      nclose(middle.lateral, 0, 1e-12) &&
      nclose(middle.height, humanCaneSweepTouches.LIFT, 1e-12) &&
      nclose(
        humanCaneSweepTouches.tip(touches, 0.5, 0.3, true).lateral,
        0.3,
        1e-12,
      ) &&
      humanCaneSweepTouches.tip(touches, 1.25, 0.3, false).height === 0,
  );
  TestValidator.predicate(
    "no landing",
    throwsError(() =>
      humanCaneSweepTouches(
        (): Record<AutoMovieHumanSide, boolean> => ({
          left: true,
          right: true,
        }),
        2,
      ),
    ),
  );
}
