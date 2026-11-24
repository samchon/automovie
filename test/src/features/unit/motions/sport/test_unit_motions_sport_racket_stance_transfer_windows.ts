import { racketStanceTransfer } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `racketStanceTransfer.inside`, `share` and `ease` read a phase window: a
 * second is inside only strictly between the ends (an end belongs to the
 * adjacent bearing phase), the share is the clamped linear fraction, and the
 * ease its minimum-jerk share `10 u³ - 15 u⁴ + 6 u⁵`.
 *
 * The window from 1 s to 3 s.
 *
 * Scenarios:
 *
 * 1. 2 s is inside; the ends and outside are not.
 * 2. The share is 0 before, 0.25 at 1.5 s and 1 after.
 * 3. The ease is one half at the middle and 0.103515625 a quarter in.
 */
export function test_unit_motions_sport_racket_stance_transfer_windows(): void {
  const window: racketStanceTransfer.Window = [1, 3];
  TestValidator.equals(
    "inside, strictly",
    [0.5, 1, 2, 3, 4].map((t: number): boolean =>
      racketStanceTransfer.inside(window, t),
    ),
    [false, false, true, false, false],
  );
  TestValidator.predicate(
    "the share and the ease",
    racketStanceTransfer.share(window, 0) === 0 &&
      nclose(racketStanceTransfer.share(window, 1.5), 0.25, 1e-12) &&
      racketStanceTransfer.share(window, 5) === 1 &&
      nclose(racketStanceTransfer.ease(window, 2), 0.5, 1e-12) &&
      nclose(racketStanceTransfer.ease(window, 1.5), 0.103515625, 1e-12),
  );
}
