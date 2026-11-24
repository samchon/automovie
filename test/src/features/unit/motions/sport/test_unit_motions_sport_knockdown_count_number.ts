import { KnockdownCount } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * `KnockdownCount.number` lands each number of the ten-count one second apart
 * from the count's start (GLORY Rules 5.05.B), readiness at eight.
 *
 * Scenarios:
 *
 * 1. From a start at 3 s, one lands at 4 s, eight at 11 s and ten at 13 s.
 * 2. A number outside one to ten is a caller's defect and throws.
 */
export function test_unit_motions_sport_knockdown_count_number(): void {
  TestValidator.equals(
    "one, readiness and ten",
    [
      KnockdownCount.number(3, 1),
      KnockdownCount.number(3, KnockdownCount.READINESS),
      KnockdownCount.number(3, KnockdownCount.TEN),
    ],
    [4, 11, 13],
  );
  TestValidator.predicate(
    "outside the count",
    throwsError(() => KnockdownCount.number(3, 0)) &&
      throwsError(() => KnockdownCount.number(3, 11)),
  );
}
