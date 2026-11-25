import { StrikingArrest } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * A striking arrest (`StrikingArrest`): a value carried at a velocity settles
 * onto a target over a span along the quintic that starts at the value with
 * that velocity and ends at the target at rest (`u - 6u³ + 8u⁴ - 3u⁵` for the
 * velocity, the minimum-jerk share for the move); unmoved, the velocity alone
 * carries it half its span-length.
 *
 * Scenarios:
 *
 * 1. From 1 at 2 per second to 3 over 0.5 s: 1 at the start, 3 at the end and
 *    after, leaving at 2 per second, and arriving at rest.
 * 2. Unmoved, 1 at 2 per second over 0.5 s rests at 1.5.
 * 3. A span of none is refused.
 */
export function test_unit_motions_striking_arrest(): void {
  const at = (t: number): number => StrikingArrest.settle(1, 2, 3, 0.5, t);
  const h: number = 1e-6;
  TestValidator.predicate(
    "the settle",
    nclose(at(0), 1, 1e-12) &&
      nclose(at(0.5), 3, 1e-12) &&
      nclose(at(2), 3, 1e-12) &&
      nclose((at(h) - at(0)) / h, 2, 1e-4) &&
      nclose((at(0.5) - at(0.5 - h)) / h, 0, 1e-4),
  );
  TestValidator.predicate(
    "the rest and a span of none",
    nclose(StrikingArrest.rest(1, 2, 0.5), 1.5, 1e-12) &&
      throwsError(() => StrikingArrest.settle(1, 2, 3, 0, 0)),
  );
}
