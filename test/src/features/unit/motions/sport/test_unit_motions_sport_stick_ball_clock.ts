import type { IAutoMovieMotionClock } from "@automovie/interface";
import { stickBallClock } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `stickBallClock` times a stick stroke: the grips taken, then the swing
 * meeting the ball at 55 % of its duration and ending at 85 %.
 *
 * Scenario: a 0.4 s take and a 0.75 s swing grip at 0.4 s, strike at 0.8125 s,
 * end the follow-through at 1.0375 s and last 1.15 s.
 */
export function test_unit_motions_sport_stick_ball_clock(): void {
  const clock: IAutoMovieMotionClock = stickBallClock(0.4, 0.75);
  TestValidator.predicate(
    "the stroke's marks",
    nclose(clock.at("gripped"), 0.4, 1e-12) &&
      nclose(clock.at("stroke"), 0.8125, 1e-12) &&
      nclose(clock.at("strokeEnd"), 1.0375, 1e-12) &&
      nclose(clock.duration, 1.15, 1e-12),
  );
}
