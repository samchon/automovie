import { riseSeatOff } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a decimal product, seconds. */
const ROUNDING: number = 1e-12;

/**
 * `riseSeatOff` releases the seat at the end of the rise's flexion phase, 36 %
 * of the rise (McDonald, Villarejo Mayor and Lennon 2025).
 *
 * Scenarios:
 *
 * 1. A 2 s rise leaves the seat at 0.72 s, a 2.5 s rise at 0.9 s.
 */
export function test_unit_motions_everyday_rise_seat_off(): void {
  TestValidator.predicate(
    "the release",
    nclose(riseSeatOff(2), 0.72, ROUNDING) &&
      nclose(riseSeatOff(2.5), 0.9, ROUNDING),
  );
}
