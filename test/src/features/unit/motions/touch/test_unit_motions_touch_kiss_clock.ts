import type { IAutoMovieMotionClock } from "@automovie/interface";
import { AutoMovieMotionClock, kissClock } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `kissClock` adds a kiss's two contact events to a phrase: `contact` at its
 * `ready` and `part` at its `relax`, keeping the phrase's length and instants.
 *
 * Scenarios:
 *
 * 1. A phrase preparing 0.4 s, holding 1 s and retracting 0.4 s makes contact at
 *    0.4 s and parts at 1.4 s, over 1.8 s.
 */
export function test_unit_motions_touch_kiss_clock(): void {
  const clock: IAutoMovieMotionClock = kissClock(
    AutoMovieMotionClock.phrase({
      prepare: 0.4,
      attack: 0,
      hold: 1,
      retract: 0.4,
    }),
  );
  TestValidator.predicate(
    "the contact events",
    nclose(clock.duration, 1.8, 1e-12) &&
      nclose(clock.at("contact"), 0.4, 1e-12) &&
      nclose(clock.at("part"), 1.4, 1e-12) &&
      nclose(clock.at("ready"), 0.4, 1e-12),
  );
}
