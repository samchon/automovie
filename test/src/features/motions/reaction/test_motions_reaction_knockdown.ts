import type { IAutoMovieMotionClock } from "@automovie/interface";
import { knockdown } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `knockdown` law's timetable (`knockdown.timetable`): the body lands
 * seated `SEATED` (0.45 s) in, the `stroke`, rolls on to its back by `DOWN`
 * (1.1 s), and lies, one second by default.
 *
 * Scenarios:
 *
 * 1. Held 2 s, the knockdown is seated and struck at 0.45 s, down and relaxing at
 *    1.1 s, and ends at 3.1 s; it starts rolling back before the seat lands.
 * 2. A negative lie is refused.
 */
export function test_motions_reaction_knockdown(): void {
  const clock: IAutoMovieMotionClock = knockdown.timetable(2);
  TestValidator.predicate(
    "seated, down, lying",
    nclose(clock.at("seated"), 0.45, 1e-12) &&
      nclose(clock.at("stroke"), 0.45, 1e-12) &&
      nclose(clock.at("down"), 1.1, 1e-12) &&
      nclose(clock.at("relax"), 1.1, 1e-12) &&
      nclose(clock.duration, 3.1, 1e-12) &&
      clock.at("rolling") < 0.45 &&
      nclose(knockdown.timetable(undefined).duration, 2.1, 1e-12),
  );
  TestValidator.predicate(
    "a negative lie",
    throwsError(() => knockdown.timetable(-1)),
  );
}
