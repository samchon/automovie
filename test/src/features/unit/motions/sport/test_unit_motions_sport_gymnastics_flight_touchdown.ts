import { GymnasticsFlight } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** How late the bisection may find a touchdown, seconds: its stated bracket. */
const BRACKET: number = 1e-4;

/**
 * `GymnasticsFlight.touchdown` bisects for the first second a falling lowest
 * point comes down to a height, to within a tenth of a millisecond, returning
 * the bracket's late end.
 *
 * Scenarios:
 *
 * 1. A lowest point falling as `1 - t` reaches 0.25 m at 0.75 s: the answer is
 *    at or after it by at most the bracket.
 * 2. A bracket already narrower than that returns its late end.
 */
export function test_unit_motions_sport_gymnastics_flight_touchdown(): void {
  const lowest = (t: number): number => 1 - t;
  const found: number = GymnasticsFlight.touchdown(0, 1, lowest, 0.25);
  TestValidator.predicate(
    "within the bracket after the crossing",
    found >= 0.75 && found - 0.75 <= BRACKET,
  );
  TestValidator.equals(
    "a narrow bracket",
    GymnasticsFlight.touchdown(0.75, 0.75 + BRACKET / 2, lowest, 0.25),
    0.75 + BRACKET / 2,
  );
}
