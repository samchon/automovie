import type { IAutoMovieMotionClock } from "@automovie/interface";
import { collapseClock, knockdown } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * The `collapse` law's timetable (`collapseClock`): a sag, the knees on the
 * floor `knockdown.SEATED` (0.45 s) after it, the body down `knockdown.DOWN`
 * (1.1 s) after it, and a hold, one second by default.
 *
 * Scenarios:
 *
 * 1. A 0.3 s sag puts the knees down at 0.75 s, the body down at 1.4 s, and with
 *    the default hold ends at 2.4 s.
 * 2. A negative sag or hold is refused.
 */
export function test_unit_motions_reaction_collapse(): void {
  const clock: IAutoMovieMotionClock = collapseClock({ sag: 0.3 });
  TestValidator.predicate(
    "the sag, the knees and the floor",
    knockdown.SEATED === 0.45 &&
      knockdown.DOWN === 1.1 &&
      nclose(clock.at("sag"), 0.3, 1e-12) &&
      nclose(clock.at("knees"), 0.75, 1e-12) &&
      nclose(clock.at("down"), 1.4, 1e-12) &&
      nclose(clock.duration, 2.4, 1e-12),
  );
  TestValidator.predicate(
    "negative times",
    throwsError(() => collapseClock({ sag: -0.1 })) &&
      throwsError(() => collapseClock({ hold: -1 })),
  );
}