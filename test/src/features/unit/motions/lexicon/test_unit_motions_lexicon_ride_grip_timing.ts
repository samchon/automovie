import { humanRideGripTiming } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The ride overlays' grip (`humanRideGripTiming`), shared by
 * `HumanHoldHandles`, `HumanLeadHorse` and `HumanTendHorse`: the hands acquire
 * the implement over the transition, hold it and release it over a last
 * transition, the fingers' closure a minimum-jerk share of the nearer
 * transition.
 *
 * Scenario: over a 4 s overlay with 0.5 s transitions the grip runs from 1/8 to
 * 7/8 of it; the fingers are open at the ends, half closed a quarter second in
 * and fully closed at the middle.
 */
export function test_unit_motions_lexicon_ride_grip_timing(): void {
  const timing: humanRideGripTiming.ITiming = humanRideGripTiming(0.5, 4);
  TestValidator.predicate(
    "acquire, hold and release",
    nclose(timing.on, 1 / 8, 1e-12) &&
      nclose(timing.off, 7 / 8, 1e-12) &&
      timing.closure(0) === 0 &&
      nclose(timing.closure(0.25), 0.5, 1e-12) &&
      timing.closure(2) === 1 &&
      timing.closure(4) === 0,
  );
}
